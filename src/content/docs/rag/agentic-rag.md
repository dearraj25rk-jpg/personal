---
title: Agentic RAG
description: Complete May 2026 guide — ReAct, Self-RAG, CRAG, HippoRAG, Multi-Agent RAG, Claude Tool Use, tool-calling RAG, Adaptive RAG, LangGraph workflows — dynamic retrieval agents with LangGraph and LangChain implementations.
sidebar:
  order: 10
---

> **Current as of May 2026.**
>
> **LangChain 1.0 + LangGraph 1.0** released October 2025. LangGraph 2.0 is in beta (Feb 2026) with first-class async, compiled graphs, and persistent state backends. All examples use LangGraph 1.x stable API.

## What Is Agentic RAG?

In standard RAG, retrieval is a fixed step: query → retrieve → generate. In **Agentic RAG**, an LLM agent dynamically decides:

- **Whether** to retrieve (or answer from memory)
- **What** to retrieve (which knowledge source, search query)
- **When** to retrieve (before or during generation)
- **Whether to retry** (if retrieved context is insufficient)
- **How to synthesize** across multiple retrieval rounds

Agentic RAG trades simplicity for significantly higher answer quality on complex, multi-hop questions.

---

## LangGraph Agentic RAG State Machine

The diagram below shows the full agentic RAG control flow as a LangGraph state machine. Conditional edges create feedback loops that allow the agent to self-correct through multiple retrieval rounds.

```
START
  │
  ▼
query_analysis
  │  (classify intent, extract entities)
  ▼
route_query
  │
  ├─── [simple: no retrieval needed] ──────────────────────→ direct_generate
  │                                                                │
  │                                                                ▼
  │                                                              END
  │
  └─── [needs_retrieval] ──────────────────────────────────→ retrieve
                                                                  │
                                                                  ▼
                                                          grade_documents
                                                                  │
                                                  ┌───────────────┴──────────────┐
                                                  │                              │
                                             [relevant]                    [irrelevant]
                                                  │                              │
                                                  ▼                              ▼
                                              generate                    rewrite_query
                                                  │                              │
                                                  ▼                              │
                                           grade_answer                          │
                                                  │                              │
                                  ┌───────────────┴──────────┐                  │
                                  │                          │                  │
                               [good]                    [bad, iter < 3]        │
                                  │                          │                  │
                                  ▼                          └──────────────────┘
                                END                          (loop back to retrieve,
                                                             max 3 iterations)
```

This loop enables: route on complexity, retrieve, grade retrieved docs, generate, grade the answer, and rewrite + retry if quality is insufficient — all within a single compiled graph.

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

## Multi-Agent RAG Architecture

**Pattern:** 2025. Scales agentic RAG by distributing retrieval across specialist agents, each owning a distinct knowledge source or retrieval modality.

### Architecture Overview

```
                         User Query
                              │
                              ▼
              ┌───────────────────────────────┐
              │       Orchestrator Agent      │
              │  - Analyzes query intent      │
              │  - Decides which retrievers   │
              │    are needed                 │
              │  - Dispatches sub-tasks       │
              │  - Aggregates results         │
              └───┬───────┬───────┬───────┬───┘
                  │       │       │       │
          (parallel dispatch to specialist agents)
                  │       │       │       │
          ┌───────▼─┐ ┌───▼───┐ ┌─▼────┐ ┌▼──────────┐
          │ Vector  │ │  SQL  │ │ Web  │ │   Code     │
          │  DB     │ │Retrie-│ │Searc-│ │  Retriever │
          │Retriever│ │  ver  │ │  her │ │            │
          │         │ │       │ │      │ │            │
          │semantic │ │struct-│ │real- │ │codebase    │
          │ search  │ │ ured  │ │time  │ │ search     │
          │ over    │ │ data  │ │ info │ │            │
          │ docs    │ │(SQL)  │ │      │ │            │
          └────┬────┘ └───┬───┘ └──┬───┘ └─────┬──────┘
               │          │        │            │
               └──────────┴────────┴────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │     Synthesizer Agent    │
                    │  - Receives outputs from │
                    │    all specialist agents │
                    │  - Resolves conflicts    │
                    │  - Generates final answer│
                    │    with citations        │
                    └──────────────────────────┘
                                   │
                                   ▼
                               Final Answer
```

### Specialist Agent Roles

| Agent | Knowledge Source | Query Types |
|---|---|---|
| VectorDBRetriever | Semantic vector store over document corpus | Conceptual, definitional, procedural |
| SQLRetriever | Structured database (revenue, dates, codes) | Numerical, time-bounded, exact lookup |
| WebSearchRetriever | Real-time web search | Current events, recent data |
| CodeRetriever | Codebase (AST + embedding) | Function signatures, usage examples, bugs |

### Communication Pattern: Filesystem Mailbox

Each agent reads from and writes to a shared JSON message store. This decouples agents and enables async execution.

```python
import json
import os
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import Any

MAILBOX_DIR = Path("/tmp/agent_mailbox")
MAILBOX_DIR.mkdir(exist_ok=True)

@dataclass
class AgentMessage:
    agent_id: str
    query: str
    result: Any
    status: str   # "pending" | "complete" | "error"

def write_message(msg: AgentMessage) -> None:
    path = MAILBOX_DIR / f"{msg.agent_id}.json"
    with open(path, "w") as f:
        json.dump(asdict(msg), f)

def read_message(agent_id: str) -> AgentMessage | None:
    path = MAILBOX_DIR / f"{agent_id}.json"
    if not path.exists():
        return None
    with open(path) as f:
        data = json.load(f)
    return AgentMessage(**data)
```

### LangGraph Implementation

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator
import asyncio

class MultiAgentState(TypedDict):
    question: str
    vector_results: list
    sql_results: list
    web_results: list
    final_answer: str

# --- Specialist retriever nodes ---

def vector_retrieve(state: MultiAgentState) -> MultiAgentState:
    """Semantic search over the document corpus."""
    docs = vectorstore.similarity_search(state["question"], k=5)
    return {**state, "vector_results": [d.page_content for d in docs]}

def sql_retrieve(state: MultiAgentState) -> MultiAgentState:
    """Structured query for numerical / time-bounded data."""
    # Convert natural language to SQL via LLM
    sql = llm.invoke(
        f"Convert to SQL (table: company_metrics, cols: quarter, revenue, growth):\n{state['question']}"
    ).content
    try:
        rows = db_connection.execute(sql).fetchall()
        return {**state, "sql_results": [str(r) for r in rows]}
    except Exception as e:
        return {**state, "sql_results": [f"SQL error: {e}"]}

def web_retrieve(state: MultiAgentState) -> MultiAgentState:
    """Real-time web search for current information."""
    from langchain_community.tools import TavilySearchResults
    results = TavilySearchResults(max_results=3).invoke(state["question"])
    return {**state, "web_results": [r["content"] for r in results]}

# --- Orchestrator: decides which retrievers to call ---

def orchestrate(state: MultiAgentState) -> list[str]:
    """
    Return the list of retriever node names to execute in parallel.
    LangGraph's Send API dispatches these concurrently.
    """
    decision = llm.invoke(
        f"Which retrieval sources are needed? (vector, sql, web) "
        f"Respond with comma-separated names only.\nQuestion: {state['question']}"
    ).content.lower()

    sources = []
    if "vector" in decision:
        sources.append("vector_retrieve")
    if "sql" in decision:
        sources.append("sql_retrieve")
    if "web" in decision:
        sources.append("web_retrieve")
    return sources or ["vector_retrieve"]   # default to vector

# --- Synthesizer: merges all retriever outputs ---

def synthesize(state: MultiAgentState) -> MultiAgentState:
    all_context = []
    if state.get("vector_results"):
        all_context.append("=== Document Corpus ===\n" + "\n".join(state["vector_results"]))
    if state.get("sql_results"):
        all_context.append("=== Structured Data ===\n" + "\n".join(state["sql_results"]))
    if state.get("web_results"):
        all_context.append("=== Web Search ===\n" + "\n".join(state["web_results"]))

    context = "\n\n".join(all_context)
    answer = llm.invoke(
        f"Using the following sources, answer the question.\n\n{context}\n\nQuestion: {state['question']}"
    ).content
    return {**state, "final_answer": answer}

# --- Build the graph ---

workflow = StateGraph(MultiAgentState)
workflow.add_node("orchestrate", orchestrate)
workflow.add_node("vector_retrieve", vector_retrieve)
workflow.add_node("sql_retrieve", sql_retrieve)
workflow.add_node("web_retrieve", web_retrieve)
workflow.add_node("synthesize", synthesize)

workflow.set_entry_point("orchestrate")
# Parallel edges: orchestrator fans out to all needed retrievers
workflow.add_conditional_edges(
    "orchestrate",
    lambda state: orchestrate(state),
    {
        "vector_retrieve": "vector_retrieve",
        "sql_retrieve": "sql_retrieve",
        "web_retrieve": "web_retrieve",
    }
)
# All retrievers converge to synthesizer
workflow.add_edge("vector_retrieve", "synthesize")
workflow.add_edge("sql_retrieve", "synthesize")
workflow.add_edge("web_retrieve", "synthesize")
workflow.add_edge("synthesize", END)

app = workflow.compile()

result = app.invoke({
    "question": "What was Q3 2024 revenue and how does our refund policy apply to enterprise customers?",
    "vector_results": [], "sql_results": [], "web_results": [], "final_answer": "",
})
print(result["final_answer"])
```

---

## Claude Tool Use for RAG

The Anthropic SDK's native tool use API gives Claude the ability to decide **when** to call retrieval — rather than always retrieving or never retrieving. Claude invokes the retrieval tool only when the query genuinely requires information from the knowledge base.

### When Claude Skips Retrieval

Claude will answer directly (without calling the retrieval tool) for:
- Simple factual questions it already knows ("What is 2+2?", "Who wrote Hamlet?")
- Questions about itself or its capabilities
- Mathematical calculations
- Questions where the user's intent is meta (asking about the agent itself)

This makes Claude tool use more efficient than forced retrieval — and avoids injecting irrelevant context into the prompt.

### Explicit vs. Forced Retrieval

| Mode | How it works | When to use |
|---|---|---|
| Explicit tool use (Claude decides) | Claude calls retrieval only when needed | Mixed query types; Claude knows a lot already |
| Forced retrieval (always retrieve) | Always retrieve before answering | Domain-specific corpus Claude cannot know |

### Complete Implementation

```python
import anthropic
import json

client = anthropic.Anthropic()

# --- Step 1: Define retrieval as a structured tool ---

RETRIEVAL_TOOL = {
    "name": "retrieve_documents",
    "description": (
        "Search the internal knowledge base for information relevant to the user's question. "
        "Call this when the question requires specific facts, policies, procedures, or technical "
        "details that may be in the document corpus. Do NOT call this for general knowledge "
        "questions you can answer directly."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "The search query. Should be specific and keyword-rich.",
            },
            "top_k": {
                "type": "integer",
                "description": "Number of documents to retrieve. Default 5.",
                "default": 5,
            },
        },
        "required": ["query"],
    },
}

# --- Step 2: Execute the retrieval tool ---

def execute_retrieval(query: str, top_k: int = 5) -> str:
    """Call your actual retrieval system here."""
    docs = vectorstore.similarity_search(query, k=top_k)
    if not docs:
        return "No relevant documents found."
    parts = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("source", "unknown")
        parts.append(f"[Document {i} | {source}]\n{doc.page_content}")
    return "\n\n".join(parts)

# --- Step 3: Agentic loop — Claude decides when to call retrieval ---

def claude_rag(user_question: str, system_prompt: str = None) -> str:
    """
    Run Claude with retrieval tool use.
    Loop continues until Claude produces a final text response
    (no more tool calls).
    """
    messages = [{"role": "user", "content": user_question}]
    system = system_prompt or "You are a helpful assistant with access to an internal knowledge base."

    while True:
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=system,
            tools=[RETRIEVAL_TOOL],
            messages=messages,
        )

        # Append assistant response to conversation history
        messages.append({"role": "assistant", "content": response.content})

        # Check stop reason
        if response.stop_reason == "end_turn":
            # Claude gave a final text answer — extract and return it
            for block in response.content:
                if block.type == "text":
                    return block.text
            return ""

        if response.stop_reason == "tool_use":
            # Claude wants to call one or more tools
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    if block.name == "retrieve_documents":
                        query = block.input.get("query", user_question)
                        top_k = block.input.get("top_k", 5)
                        result = execute_retrieval(query, top_k)
                    else:
                        result = f"Unknown tool: {block.name}"

                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })

            # Send tool results back to Claude
            messages.append({"role": "user", "content": tool_results})
            # Loop: Claude will now process the retrieval results and either
            # give a final answer or call another tool
        else:
            # Unexpected stop reason
            break

    return "Unable to generate a response."

# --- Step 4: Streaming variant ---

def claude_rag_streaming(user_question: str) -> str:
    """Streaming version — yields text chunks as Claude generates."""
    messages = [{"role": "user", "content": user_question}]
    full_response = []

    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        tools=[RETRIEVAL_TOOL],
        messages=messages,
    ) as stream:
        for event in stream:
            if hasattr(event, "type"):
                if event.type == "content_block_delta":
                    if hasattr(event.delta, "text"):
                        print(event.delta.text, end="", flush=True)
                        full_response.append(event.delta.text)

        final_message = stream.get_final_message()

        # Handle tool use from streaming response
        if final_message.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": final_message.content})
            tool_results = []
            for block in final_message.content:
                if block.type == "tool_use" and block.name == "retrieve_documents":
                    result = execute_retrieval(block.input.get("query", user_question))
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    })
            messages.append({"role": "user", "content": tool_results})
            # Second pass — final answer after retrieval
            return claude_rag(user_question)   # fall back to non-streaming for simplicity

    return "".join(full_response)

# --- Usage ---
answer = claude_rag("What is the maximum file size for uploads in our API?")
print(answer)

# Claude will:
# 1. See this is a domain-specific policy question
# 2. Call retrieve_documents("maximum file size upload API limit")
# 3. Read the returned docs
# 4. Answer with the specific limit from the retrieved policy doc
```

---

## HippoRAG

**Paper:** Gutierrez et al., "HippoRAG: Neurobiologically Inspired Long-Term Memory for Large Language Models" (Princeton / Ohio State, 2024)  
**Inspired by:** Hippocampal-neocortical indexing theory in neuroscience

HippoRAG models retrieval after how the human brain forms long-term memories. The hippocampus indexes relationships between concepts (not raw text), enabling multi-hop retrieval by traversing the knowledge graph rather than exhaustive re-embedding.

### Core Architecture

HippoRAG blends two memory types from neuroscience:

- **Episodic memory** — specific events and passages (the raw document store)
- **Semantic memory** — facts and relationships (the knowledge graph, traversed via PPR)

```
Offline Indexing (build once):
  Documents
      │
      ▼ LLM extracts named entities + (subject, predicate, object) triples
      │
      ▼ Build knowledge graph:
         nodes = entities (e.g., "Marie Curie", "Nobel Prize", "radioactivity")
         edges = relations (e.g., "Marie Curie" --won--> "Nobel Prize")
      │
      ▼ Embed all entity names (for query-to-node matching)
      │
      ▼ Save: graph + entity embeddings + passage store

Online Querying (per query):
  Query
      │
      ▼ LLM extracts query entities
      │
      ▼ Embed query entities → find closest graph nodes (cosine similarity)
         [seed nodes = starting points for graph traversal]
      │
      ▼ Personalized PageRank (PPR) from seed nodes
         Activation spreads through graph edges:
           Marie Curie → radioactivity → Henri Becquerel → 1896 discovery
      │
      ▼ Surface passages associated with high-PPR entities
      │
      ▼ LLM generates answer from retrieved passages
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

### Benchmarks

**20% improvement** on MuSiQue multi-hop QA and **15% improvement** on 2WikiMultiHopQA versus standard dense RAG, as reported in the original paper. Full benchmark table:

| Benchmark | Standard RAG | HippoRAG | Improvement |
|---|---|---|---|
| MuSiQue (multi-hop) | 21.4% | 33.6% | +57% relative |
| 2WikiMultiHopQA | 38.2% | 52.1% | +36% relative |
| HotpotQA | 44.7% | 58.9% | +32% relative |
| Single-hop QA | ~equal | ~equal | Negligible |

*Source: Gutierrez et al. 2024. Multi-hop gains come from graph traversal surfacing indirect relationships that vector similarity misses.*

### Simplified Python Implementation (NetworkX PPR)

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
    """
    Retrieve passages using Personalized PageRank (PPR) over the knowledge graph.

    PPR starts from seed nodes (entities found in the query) and propagates
    relevance scores through the graph. Entities connected via multi-hop
    relation chains surface even when not mentioned in the query.
    """
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
# HippoRAG traverses: Marie Curie → Nobel Prize → radioactivity → Henri Becquerel
```

---

## Comparison: All Agentic RAG Approaches

| Feature | Self-RAG | CRAG | Tool-calling | Adaptive RAG | ReAct | HippoRAG | Multi-Agent RAG | Claude Tool Use |
|---|---|---|---|---|---|---|---|---|
| **Controls retrieval** | Via reflection tokens | Via relevance classifier | Via agent decision | Via query classifier | Via reasoning traces | Via graph traversal | Via orchestrator | Via Claude's judgment |
| **Model fine-tuning needed** | Yes (special tokens) | No | No | Yes (classifier) | No | No | No | No |
| **External search fallback** | No | Yes | Yes | Optional | Yes | No | Yes | Optional |
| **Multiple retrieval rounds** | Yes | No | Yes | Yes (multi-hop) | Yes | Yes (graph hops) | Yes (parallel) | Yes |
| **Multi-hop reasoning** | Limited | No | Limited | Yes | Yes | Excellent | Good | Good |
| **Knowledge graph required** | No | No | No | No | No | Yes | No | No |
| **Parallel retrieval** | No | No | No | No | No | No | Yes | No |
| **Latency** | High | Medium | High | Low–High | High | Medium | Medium (parallel) | Low–Medium |
| **Best for** | Quality-critical generation | Unreliable vector stores | Multi-source routing | Mixed query volumes | Complex multi-step tasks | Multi-hop QA, entity reasoning | Large-scale multi-source systems | General-purpose with Anthropic SDK |

---

## See Also

- [Advanced RAG](../advanced-rag) — pre/post retrieval optimizations (simpler, no agent required)
- [Graph RAG](../graph-rag) — Microsoft GraphRAG, LightRAG, NodeRAG — community-graph retrieval for global queries
- [Retrieval Strategies](../retrieval-strategies) — underlying retrieval mechanisms used by agents
- [Evaluation](../evaluation) — measuring whether agentic approaches actually improve scores
- [RAG Types](../rag-types) — interactive side-by-side architecture comparison
