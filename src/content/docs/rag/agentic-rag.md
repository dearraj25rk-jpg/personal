---
title: Agentic RAG
description: Complete 2025 guide — ReAct, Self-RAG, CRAG, HippoRAG, tool-calling RAG, Adaptive RAG, LangGraph workflows — dynamic retrieval agents with LangGraph and LangChain implementations.
sidebar:
  order: 10
---

> **Current as of May 2026.**
>
> **LangChain 1.0 + LangGraph 1.0** released October 2025 — stable APIs, no breaking changes until 2.0. LangGraph 1.0 adds type-safe streaming (`version="v2"`) and is the default runtime for LangChain agents. Code in this guide is compatible with both `langgraph>=1.0` and `langchain>=1.0`.

## What Is Agentic RAG?

In standard RAG, retrieval is a fixed step: query → retrieve → generate. In **Agentic RAG**, an LLM agent dynamically decides:

- **Whether** to retrieve (or answer from memory)
- **What** to retrieve (which knowledge source, search query)
- **When** to retrieve (before or during generation)
- **Whether to retry** (if retrieved context is insufficient)
- **How to synthesize** across multiple retrieval rounds

Agentic RAG trades simplicity for significantly higher answer quality on complex, multi-hop questions.

---

## Self-RAG

**Paper:** Asai et al., "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection" (2023)  
**Model:** `selfrag/selfrag_llama3_8b` (fine-tuned Llama 3 8B)

Self-RAG is a fine-tuned LLM that generates **special reflection tokens** inline with its output to control retrieval and evaluate quality:

| Token | Type | Meaning |
|---|---|---|
| `[Retrieve]` | Retrieval decision | "I need to look this up" |
| `[No Retrieve]` | Retrieval decision | "I can answer from memory" |
| `[ISREL]` | Relevance | Retrieved passage is relevant |
| `[ISIRREL]` | Relevance | Retrieved passage is irrelevant |
| `[ISSUP]` | Support | My generation is supported by the passage |
| `[ISPART]` | Support | Partially supported |
| `[ISUSE]` | Utility | Response is useful for the query |
| `[ISNOUSE]` | Utility | Response is not useful |

### Self-RAG Generation Loop

```
Start generating response
    ↓
Model emits [Retrieve]
    ↓
System retrieves relevant documents
    ↓
Model generates passage evaluation tokens ([ISREL], [ISSUP])
    ↓
If [ISIRREL]: discard passage, try another
    ↓
Continue generation
    ↓
Model emits [ISUSE] at end → validate final response
```

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Load Self-RAG fine-tuned model
model_name = "selfrag/selfrag_llama3_8b"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.bfloat16, device_map="auto")

def self_rag_generate(query: str, retriever, max_new_tokens=200):
    # Format instruction
    instruction = f"### Instruction:\n{query}\n\n### Response:\n"
    inputs = tokenizer(instruction, return_tensors="pt").to(model.device)

    # Generate with beam search
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=max_new_tokens,
            do_sample=False,
            temperature=1.0,
        )

    generated = tokenizer.decode(outputs[0], skip_special_tokens=False)

    # Parse reflection tokens (real implementation is more complex)
    if "[Retrieve]" in generated:
        # Re-run with retrieved context
        docs = retriever.invoke(query)
        context = "\n".join([d.page_content for d in docs[:3]])
        prompt_with_ctx = f"### Instruction:\n{query}\n\n### Input:\n{context}\n\n### Response:\n"
        inputs2 = tokenizer(prompt_with_ctx, return_tensors="pt").to(model.device)
        outputs2 = model.generate(**inputs2, max_new_tokens=max_new_tokens)
        return tokenizer.decode(outputs2[0], skip_special_tokens=True)

    return generated
```

---

## Corrective RAG (CRAG)

**Paper:** Yan et al., "Corrective Retrieval Augmented Generation" (2024)

CRAG uses a **lightweight relevance evaluator** to classify retrieved documents. If documents are deemed irrelevant, it corrects by web search before generating.

### Decision Flow

```
Query → Retrieve from vector store
             ↓
    Evaluate relevance of each doc
             ↓
    ┌────────┴──────────┐
  CORRECT          INCORRECT          AMBIGUOUS
    ↓                  ↓                  ↓
Use docs          Web search        Use both
    ↓                  ↓
    └──────────┬────────┘
               ↓
           Generate
```

```python
from typing import TypedDict
from langgraph.graph import StateGraph, END
from langchain_community.tools import TavilySearchResults

class CRAGState(TypedDict):
    question: str
    documents: list
    web_results: list
    generation: str
    relevance: str

def retrieve(state: CRAGState) -> CRAGState:
    docs = retriever.invoke(state["question"])
    return {**state, "documents": docs}

def evaluate_relevance(state: CRAGState) -> CRAGState:
    prompt = f"""Evaluate if these documents are relevant to the question.
Question: {state["question"]}
Documents: {[d.page_content[:300] for d in state["documents"][:3]]}
Answer with exactly: CORRECT, INCORRECT, or AMBIGUOUS"""
    result = llm.invoke(prompt).content.strip().upper()
    relevance = "CORRECT" if "CORRECT" in result else ("INCORRECT" if "INCORRECT" in result else "AMBIGUOUS")
    return {**state, "relevance": relevance}

def web_search(state: CRAGState) -> CRAGState:
    search = TavilySearchResults(max_results=3)
    results = search.invoke(state["question"])
    web_docs = [Document(page_content=r["content"], metadata={"source": r["url"]}) for r in results]
    return {**state, "web_results": web_docs}

def generate(state: CRAGState) -> CRAGState:
    docs = state["documents"]
    if state["relevance"] == "INCORRECT":
        docs = state["web_results"]
    elif state["relevance"] == "AMBIGUOUS":
        docs = state["documents"] + state.get("web_results", [])

    context = "\n\n".join([d.page_content for d in docs])
    answer = llm.invoke(f"Context:\n{context}\n\nQuestion: {state['question']}\nAnswer:").content
    return {**state, "generation": answer}

def route_after_eval(state: CRAGState) -> str:
    return "web_search" if state["relevance"] in ("INCORRECT", "AMBIGUOUS") else "generate"

# Build LangGraph workflow
workflow = StateGraph(CRAGState)
workflow.add_node("retrieve", retrieve)
workflow.add_node("evaluate_relevance", evaluate_relevance)
workflow.add_node("web_search", web_search)
workflow.add_node("generate", generate)

workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "evaluate_relevance")
workflow.add_conditional_edges("evaluate_relevance", route_after_eval, {"web_search": "web_search", "generate": "generate"})
workflow.add_edge("web_search", "generate")
workflow.add_edge("generate", END)

app = workflow.compile()
result = app.invoke({"question": "What is CRAG in RAG systems?"})
print(result["generation"])
```

---

## Tool-Calling RAG

An agent equipped with multiple retrieval tools chooses which to invoke based on query classification:

```python
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.tools import tool

llm = ChatOpenAI(model="gpt-4o", temperature=0)

@tool
def search_technical_docs(query: str) -> str:
    """Search the internal technical documentation and API references."""
    docs = tech_docs_retriever.invoke(query)
    return "\n\n".join([d.page_content for d in docs[:3]])

@tool
def search_support_kb(query: str) -> str:
    """Search the customer support knowledge base for troubleshooting guides."""
    docs = support_retriever.invoke(query)
    return "\n\n".join([d.page_content for d in docs[:3]])

@tool
def search_web(query: str) -> str:
    """Search the web for current information not available in internal docs."""
    results = TavilySearchResults(max_results=3).invoke(query)
    return "\n".join([r["content"] for r in results])

tools = [search_technical_docs, search_support_kb, search_web]

from langchain import hub
prompt = hub.pull("hwchase17/openai-tools-agent")

agent = create_openai_tools_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

response = agent_executor.invoke({
    "input": "How do I fix a 429 rate limit error when calling the embeddings API?"
})
```

---

## Adaptive RAG

**Paper:** Jeong et al., "Adaptive-RAG: Learning to Adapt Retrieval-Augmented Large Language Models through Question Complexity" (2024)

A classifier routes queries to the most appropriate retrieval strategy based on complexity:

| Query type | Strategy | Example |
|---|---|---|
| Simple factual | No retrieval (LLM memory) | "What is 2+2?" |
| Single-hop | Single retrieval round | "What year was BERT published?" |
| Multi-hop | Iterative retrieval | "Compare the architectures of BERT and GPT in 2024" |

```python
from langchain_core.prompts import ChatPromptTemplate

classify_prompt = ChatPromptTemplate.from_messages([
    ("system", "Classify the query complexity:\n- simple: answerable without retrieval\n- single_hop: needs one retrieval round\n- multi_hop: needs multiple retrieval rounds\nOutput one of: simple, single_hop, multi_hop"),
    ("human", "{question}"),
])

def adaptive_rag(question: str) -> str:
    complexity = (classify_prompt | llm | StrOutputParser()).invoke({"question": question})

    if complexity == "simple":
        return llm.invoke(question).content

    elif complexity == "single_hop":
        docs = retriever.invoke(question)
        context = format_docs(docs)
        return llm.invoke(f"Context:\n{context}\n\nQuestion: {question}").content

    else:  # multi_hop
        return iterative_retrieval_generate(question)

def iterative_retrieval_generate(question: str, max_rounds: int = 3) -> str:
    context = ""
    for _ in range(max_rounds):
        new_docs = retriever.invoke(question)
        context += "\n\n" + format_docs(new_docs)
        # Check if enough context
        check = llm.invoke(f"Context: {context}\nQuestion: {question}\nDo you have enough information? Reply YES or NO.")
        if "YES" in check.content:
            break
    return llm.invoke(f"Context:\n{context}\n\nAnswer: {question}").content
```

---

## Agentic RAG with LangGraph

LangGraph models agentic RAG as a directed graph with conditional edges — enabling cycles (self-correction) and parallel retrieval.

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator

class AgentState(TypedDict):
    question: str
    retrieved_docs: Annotated[list, operator.add]   # accumulate across rounds
    generation: str
    iterations: int

MAX_ITERATIONS = 3

def retrieve_node(state: AgentState) -> AgentState:
    query = state.get("revised_query", state["question"])
    docs = retriever.invoke(query)
    return {**state, "retrieved_docs": docs, "iterations": state.get("iterations", 0) + 1}

def generate_node(state: AgentState) -> AgentState:
    context = "\n\n".join([d.page_content for d in state["retrieved_docs"]])
    answer = llm.invoke(f"Context:\n{context}\n\nQuestion: {state['question']}\nAnswer:").content
    return {**state, "generation": answer}

def grade_generation(state: AgentState) -> AgentState:
    check = llm.invoke(f"""
    Question: {state['question']}
    Answer: {state['generation']}
    Is the answer grounded in the context and fully answers the question?
    Answer in JSON: {{"grounded": true/false, "complete": true/false, "revised_query": "..."}}
    """).content
    import json
    try:
        result = json.loads(check)
        return {**state, **result}
    except:
        return {**state, "grounded": True, "complete": True}

def should_continue(state: AgentState) -> str:
    if state.get("grounded") and state.get("complete"):
        return "end"
    if state.get("iterations", 0) >= MAX_ITERATIONS:
        return "end"
    return "retrieve"

workflow = StateGraph(AgentState)
workflow.add_node("retrieve", retrieve_node)
workflow.add_node("generate", generate_node)
workflow.add_node("grade", grade_generation)

workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "generate")
workflow.add_edge("generate", "grade")
workflow.add_conditional_edges("grade", should_continue, {"retrieve": "retrieve", "end": END})

app = workflow.compile()
```

---

## ReAct (Reasoning + Acting)

**Paper:** Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models" (2022)

ReAct interleaves **Thought → Action → Observation** cycles, letting the model reason about what to retrieve before retrieving it — unlike standard RAG which retrieves blindly before generating.

### ReAct Loop

```
Question
    ↓
Thought: "I need to find X to answer this"
    ↓
Action: search("query for X")
    ↓
Observation: [retrieved documents]
    ↓
Thought: "I now know X, but also need Y"
    ↓
Action: search("query for Y")
    ↓
Observation: [retrieved documents]
    ↓
Thought: "I have enough to answer"
    ↓
Action: finish("final answer")
```

ReAct's key insight: reasoning traces guide action selection; observations update reasoning. This enables **multi-hop retrieval** where each step depends on prior results.

### ReAct vs Chain-of-Thought vs Standard RAG

```
Standard RAG:    Query → Retrieve → Generate
                 (blind retrieval, no reasoning)

Chain-of-Thought: Query → Think → Think → Generate
                  (reasoning only, no retrieval)

ReAct:           Query → Think → Retrieve → Observe
                        → Think → Retrieve → Observe
                        → Think → Answer
                  (interleaved reasoning + retrieval)
```

```python
from langchain_anthropic import ChatAnthropic
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.tools import tool
from langchain import hub

llm = ChatAnthropic(model="claude-opus-4-6", temperature=0)

@tool
def search_documents(query: str) -> str:
    """Search the knowledge base for information relevant to the query.
    Use this when you need to find facts, definitions, or explanations."""
    docs = retriever.invoke(query)
    if not docs:
        return "No relevant documents found."
    results = []
    for i, doc in enumerate(docs[:3], 1):
        source = doc.metadata.get("source", "unknown")
        results.append(f"[Doc {i} | {source}]\n{doc.page_content[:500]}")
    return "\n\n".join(results)

@tool
def search_web(query: str) -> str:
    """Search the web for current information not in the knowledge base.
    Use this for recent events or information not in internal docs."""
    from langchain_community.tools import TavilySearchResults
    results = TavilySearchResults(max_results=3).invoke(query)
    return "\n\n".join([f"[{r['url']}]\n{r['content'][:400]}" for r in results])

@tool
def calculate(expression: str) -> str:
    """Evaluate a mathematical expression. Input must be a valid Python expression."""
    try:
        result = eval(expression, {"__builtins__": {}}, {})
        return str(result)
    except Exception as e:
        return f"Error: {e}"

tools = [search_documents, search_web, calculate]

# Pull the standard ReAct prompt from LangChain Hub
# (includes Thought/Action/Observation template)
react_prompt = hub.pull("hwchase17/react")

agent = create_react_agent(llm, tools, react_prompt)
agent_executor = AgentExecutor(
    agent=agent,
    tools=tools,
    verbose=True,           # shows Thought/Action/Observation trace
    max_iterations=6,       # prevent infinite loops
    handle_parsing_errors=True,
)

response = agent_executor.invoke({
    "input": "What is the annual revenue of the top 3 RAG companies in 2024, and what is their combined total?"
})
print(response["output"])
```

### ReAct with LangGraph (Custom Loop)

For production use, build the ReAct loop explicitly in LangGraph for full control:

```python
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from typing import TypedDict, Annotated
import operator

class ReActState(TypedDict):
    messages: Annotated[list, operator.add]
    iterations: int

def should_continue(state: ReActState) -> str:
    last_msg = state["messages"][-1]
    # If the last message has tool calls → continue to tools
    if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
        return "tools"
    # Otherwise → end (model gave final answer)
    return "end"

def call_model(state: ReActState) -> ReActState:
    from langchain_anthropic import ChatAnthropic
    model = ChatAnthropic(model="claude-opus-4-6").bind_tools(tools)
    response = model.invoke(state["messages"])
    return {
        "messages": [response],
        "iterations": state.get("iterations", 0) + 1,
    }

tool_node = ToolNode(tools)

workflow = StateGraph(ReActState)
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)

workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", "end": END})
workflow.add_edge("tools", "agent")   # after tools → back to agent

app = workflow.compile()

from langchain_core.messages import HumanMessage
result = app.invoke({
    "messages": [HumanMessage(content="Compare the architectures of BERT and GPT-3")],
    "iterations": 0,
})
print(result["messages"][-1].content)
```

---

## HippoRAG

**Paper:** Gutierrez et al., "HippoRAG: Neurobiologically Inspired Long-Term Memory for Large Language Models" (2024)  
**Inspired by:** Hippocampal-neocortical indexing theory in neuroscience

HippoRAG models retrieval after how the human brain forms long-term memories. The hippocampus indexes relationships between concepts (not raw text), enabling multi-hop retrieval by traversing the graph rather than exhaustive re-embedding.

### HippoRAG vs Standard RAG Architecture

```
Standard RAG:
  Documents → Chunks → Embeddings → Vector Store
  Query → Embed query → Cosine similarity → Top-K chunks

HippoRAG (brain-inspired):
  Documents → LLM extracts named entities + relations → Knowledge Graph
  Query → LLM extracts query entities → Seed nodes in graph
         → Personalized PageRank (PPR) spreads activation across graph
         → High-activation nodes = most relevant passages
         → Multi-hop connections surface naturally
```

### Why Standard RAG Fails Multi-Hop Questions

```
Documents:
  Doc A: "Marie Curie won the Nobel Prize in Physics in 1903."
  Doc B: "The 1903 Nobel Prize in Physics was awarded for radioactivity research."
  Doc C: "Radioactivity was discovered by Henri Becquerel in 1896."

Query: "Who inspired Marie Curie's Nobel-winning research?"

Standard RAG: Retrieves Doc A (high similarity to "Marie Curie Nobel"),
              misses Doc B and C → cannot connect Curie → radioactivity → Becquerel

HippoRAG: Graph has edges:
              Marie Curie → Nobel Prize (1903)
              Nobel Prize (1903) → radioactivity research
              radioactivity → Henri Becquerel
          PPR from "Marie Curie" node spreads to Becquerel → correct answer
```

### HippoRAG Pipeline

```
Phase 1 — Offline Indexing
─────────────────────────────────────────────────────────────
Documents
    ↓
LLM extracts named entities per passage
    ↓
LLM extracts (subject, predicate, object) triples
    ↓
Synonyms resolved / entities canonicalized
    ↓
Knowledge Graph: nodes=entities, edges=relations + doc memberships
    ↓
Embed all entity names (for query-to-node matching)
    ↓
Save: graph + entity embeddings + passage store

Phase 2 — Online Querying
─────────────────────────────────────────────────────────────
Query
    ↓
LLM extracts query entities (named entities in question)
    ↓
Embed query entities → find closest graph nodes (cosine)
    ↓
Personalized PageRank from seed nodes (query entities)
    ↓
PPR scores propagate through graph edges
    ↓
Top-K passages by PPR score → LLM generates answer
```

```python
import networkx as nx
import numpy as np
from anthropic import Anthropic
from langchain_openai import OpenAIEmbeddings
from dataclasses import dataclass, field
from typing import Optional

client = Anthropic()
embedder = OpenAIEmbeddings(model="text-embedding-3-small")

@dataclass
class HippoRAGIndex:
    graph: nx.DiGraph = field(default_factory=nx.DiGraph)
    passages: list[str] = field(default_factory=list)
    entity_to_node: dict = field(default_factory=dict)   # canonical name → node id
    node_embeddings: dict = field(default_factory=dict)  # node id → embedding
    passage_nodes: dict = field(default_factory=dict)    # passage idx → [node ids]

def extract_triples(passage: str) -> list[tuple[str, str, str]]:
    """Use LLM to extract (subject, predicate, object) triples."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": f"""Extract knowledge graph triples from this passage.
Return as JSON array of [subject, predicate, object] arrays.
Only extract factual relationships. Use concise, canonical entity names.

Passage: {passage}

Triples (JSON only):"""
        }]
    )
    import json, re
    text = response.content[0].text.strip()
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if match:
        try:
            return [tuple(t) for t in json.loads(match.group())]
        except Exception:
            pass
    return []

def build_hipporag_index(passages: list[str]) -> HippoRAGIndex:
    index = HippoRAGIndex()
    index.passages = passages
    node_counter = 0

    for p_idx, passage in enumerate(passages):
        triples = extract_triples(passage)
        index.passage_nodes[p_idx] = []

        for subj, pred, obj in triples:
            # Canonicalize and add nodes
            for entity in [subj, obj]:
                if entity not in index.entity_to_node:
                    index.entity_to_node[entity] = node_counter
                    index.graph.add_node(node_counter, label=entity)
                    node_counter += 1

            s_id = index.entity_to_node[subj]
            o_id = index.entity_to_node[obj]

            # Add relation edge
            if index.graph.has_edge(s_id, o_id):
                index.graph[s_id][o_id]["weight"] += 1
            else:
                index.graph.add_edge(s_id, o_id, predicate=pred, weight=1.0)

            # Link passage to its entities
            for nid in [s_id, o_id]:
                if nid not in index.passage_nodes[p_idx]:
                    index.passage_nodes[p_idx].append(nid)
                # Add passage membership edges (for PPR spread)
                index.graph.add_edge(nid, f"passage_{p_idx}", weight=0.5)
                index.graph.add_edge(f"passage_{p_idx}", nid, weight=0.5)

    # Embed all entity names for query matching
    entities = list(index.entity_to_node.keys())
    if entities:
        embeddings = embedder.embed_documents(entities)
        for entity, emb in zip(entities, embeddings):
            nid = index.entity_to_node[entity]
            index.node_embeddings[nid] = np.array(emb)

    return index

def hipporag_retrieve(query: str, index: HippoRAGIndex, top_k: int = 5,
                      ppr_alpha: float = 0.85, seed_k: int = 3) -> list[str]:
    """Retrieve passages using Personalized PageRank over the knowledge graph."""
    if not index.entity_to_node:
        return []

    # 1. Extract query entities and embed them
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=128,
        messages=[{
            "role": "user",
            "content": f"List the key named entities in this question, one per line:\n{query}"
        }]
    )
    query_entities = [e.strip() for e in response.content[0].text.strip().split("\n") if e.strip()]

    # 2. Find closest graph nodes for each query entity
    query_embeddings = embedder.embed_documents(query_entities) if query_entities else [embedder.embed_query(query)]

    seed_nodes = {}
    node_ids = list(index.node_embeddings.keys())
    node_vecs = np.array([index.node_embeddings[nid] for nid in node_ids])

    for q_emb in query_embeddings:
        q_vec = np.array(q_emb)
        sims = np.dot(node_vecs, q_vec) / (np.linalg.norm(node_vecs, axis=1) * np.linalg.norm(q_vec) + 1e-9)
        top_indices = np.argsort(sims)[-seed_k:][::-1]
        for idx in top_indices:
            nid = node_ids[idx]
            seed_nodes[nid] = seed_nodes.get(nid, 0) + float(sims[idx])

    if not seed_nodes:
        return index.passages[:top_k]

    # 3. Personalized PageRank from seed nodes
    total = sum(seed_nodes.values())
    personalization = {nid: v / total for nid, v in seed_nodes.items()}
    # Pad with 0 for non-seed nodes
    for n in index.graph.nodes:
        if n not in personalization:
            personalization[n] = 0.0

    ppr_scores = nx.pagerank(index.graph, alpha=ppr_alpha, personalization=personalization, max_iter=100)

    # 4. Aggregate PPR scores to passages
    passage_scores = {}
    for p_idx, node_list in index.passage_nodes.items():
        passage_scores[p_idx] = sum(ppr_scores.get(nid, 0) for nid in node_list)
        # Also check passage node directly
        passage_scores[p_idx] += ppr_scores.get(f"passage_{p_idx}", 0)

    ranked = sorted(passage_scores, key=passage_scores.get, reverse=True)
    return [index.passages[i] for i in ranked[:top_k]]

def hipporag_query(question: str, index: HippoRAGIndex) -> str:
    passages = hipporag_retrieve(question, index)
    context = "\n\n".join([f"[{i+1}] {p}" for i, p in enumerate(passages)])
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""Answer the question using only the provided context.

Context:
{context}

Question: {question}
Answer:"""
        }]
    )
    return response.content[0].text

# Usage
passages = [
    "Marie Curie won the Nobel Prize in Physics in 1903 for her research on radioactivity.",
    "The 1903 Nobel Prize in Physics recognized the discovery of radioactive elements.",
    "Radioactivity was first discovered by Henri Becquerel in 1896.",
    "Marie Curie later won a second Nobel Prize in Chemistry in 1911.",
    "Becquerel shared the 1903 Physics Nobel with Pierre and Marie Curie.",
]

index = build_hipporag_index(passages)
answer = hipporag_query("Who first discovered the phenomenon that won Marie Curie her Nobel Prize?", index)
print(answer)
# → HippoRAG traverses: Marie Curie → Nobel Prize → radioactivity → Henri Becquerel
```

### HippoRAG vs Vector RAG on Multi-Hop Benchmarks

| Benchmark | Standard RAG | HippoRAG | Improvement |
|---|---|---|---|
| MuSiQue (multi-hop) | 21.4% | 33.6% | +57% |
| 2WikiMultiHopQA | 38.2% | 52.1% | +36% |
| HotpotQA | 44.7% | 58.9% | +32% |
| Single-hop QA | ~equal | ~equal | Negligible |

*Source: Gutierrez et al. 2024. Multi-hop gains come from graph traversal surfacing indirect relationships.*

---

## Comparison: All Agentic RAG Approaches

| Feature | Self-RAG | CRAG | Tool-calling | Adaptive RAG | ReAct | HippoRAG |
|---|---|---|---|---|---|---|
| **Controls retrieval** | Via reflection tokens | Via relevance classifier | Via agent decision | Via query classifier | Via reasoning traces | Via graph traversal |
| **Model fine-tuning needed** | Yes (special tokens) | No | No | Yes (classifier) | No | No |
| **External search fallback** | No | Yes | Yes | Optional | Yes | No |
| **Multiple retrieval rounds** | Yes | No | Yes | Yes (multi-hop) | Yes | Yes (graph hops) |
| **Multi-hop reasoning** | Limited | No | Limited | Yes | Yes | Excellent |
| **Knowledge graph required** | No | No | No | No | No | Yes |
| **Latency** | High | Medium | High | Low–High | High | Medium |
| **Best for** | Quality-critical generation | Unreliable vector stores | Multi-source routing | Mixed query volumes | Complex multi-step tasks | Multi-hop QA, entity reasoning |

---

## See Also

- [Advanced RAG](../advanced-rag) — pre/post retrieval optimizations (simpler, no agent required)
- [Graph RAG](../graph-rag) — Microsoft GraphRAG, LightRAG, NodeRAG — community-graph retrieval for global queries
- [Retrieval Strategies](../retrieval-strategies) — underlying retrieval mechanisms used by agents
- [Evaluation](../evaluation) — measuring whether agentic approaches actually improve scores
- [RAG Types](../rag-types) — interactive side-by-side architecture comparison
