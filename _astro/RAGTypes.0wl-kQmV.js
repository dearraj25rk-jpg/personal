import{j as e}from"./jsx-runtime.u17CrQMm.js";import{r as u}from"./index.DrBtkhmp.js";const c=[{id:"naive",tier:"Generation 1",tierColor:"#64748b",name:"Naive RAG",aka:"Basic RAG / Vanilla RAG",emoji:"🌱",color:"#94a3b8",tagline:"The original blueprint",complexity:1,accuracy:3,speed:5,when:"Prototypes, simple Q&A, structured FAQs",weaknesses:["No query optimization","Fixed chunking","No re-ranking","Context misalignment"],pipeline:["User Query","Embed Query","Vector Search (top-k)","Stuff into prompt","LLM Answer"],pipelineColors:["#64748b","#64748b","#64748b","#64748b","#64748b"],description:"The original RAG pattern. Chunk documents → embed → store. At query time: embed query → cosine similarity search → top-k chunks → LLM prompt. Simple, fast, but limited.",example:"Insurance FAQ bot. User asks 'What's the claim deadline?' → retrieve top 3 FAQ chunks → LLM answers.",code:`# Naive RAG — the classic
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

# Index
docs = SimpleDirectoryReader("./insurance_docs").load_data()
index = VectorStoreIndex.from_documents(docs)  # fixed chunk size

# Query — one-shot, no tricks
query_engine = index.as_query_engine(similarity_top_k=3)
response = query_engine.query("What is the claim filing deadline?")`,general:"A starting point for most production RAG systems. Good baseline, ~60-70% retrieval accuracy."},{id:"advanced",tier:"Generation 2",tierColor:"#0ea5e9",name:"Advanced RAG",aka:"Production RAG",emoji:"⚡",color:"#0ea5e9",tagline:"Pre + Post retrieval optimization",complexity:3,accuracy:4,speed:3,when:"Production systems, enterprise search, insurance/legal/medical domains",weaknesses:["More moving parts","Harder to debug","Higher latency"],pipeline:["Query Rewriting / HyDE","Hybrid Retrieval (BM25 + Dense)","Re-ranking (Cross-Encoder)","Contextual Compression","LLM Answer"],pipelineColors:["#0ea5e9","#0ea5e9","#0ea5e9","#0ea5e9","#0ea5e9"],description:"Adds optimizations BEFORE retrieval (query rewriting, HyDE, expansion) and AFTER retrieval (re-ranking, compression, filtering). This is what real production systems use.",example:"A production system. Query rewriting → hybrid BM25+dense retrieval → Voyage AI rerank → contextual answer.",code:`# Advanced RAG — production grade
from llama_index.core.retrievers import QueryFusionRetriever
from llama_index.retrievers.bm25 import BM25Retriever
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.core.indices.query.query_transform import HyDEQueryTransform

# Pre-retrieval: HyDE query transform
hyde = HyDEQueryTransform(include_original=True)

# Hybrid retrieval: BM25 + Dense
hybrid = QueryFusionRetriever(
    [vector_retriever, bm25_retriever],
    mode="reciprocal_rerank"  # RRF fusion
)

# Post-retrieval: cross-encoder re-rank
reranker = SentenceTransformerRerank(
    model="cross-encoder/ms-marco-MiniLM-L-6-v2",
    top_n=3
)`,general:"A solid production target stack. Achieves ~94% retrieval accuracy."},{id:"modular",tier:"Generation 2",tierColor:"#0ea5e9",name:"Modular RAG",aka:"Plug-and-play RAG",emoji:"🧩",color:"#a78bfa",tagline:"Compose RAG like LEGO blocks",complexity:4,accuracy:4,speed:3,when:"Multi-document, multi-source, flexible requirements",weaknesses:["Complex orchestration","Harder to reason about flow"],pipeline:["Router (decide which module)","Retrieval Module","Rewrite Module","Fusion Module","Summarization Module"],pipelineColors:["#a78bfa","#a78bfa","#a78bfa","#a78bfa","#a78bfa"],description:"Decomposes RAG into independent, interchangeable modules: routing, retrieval, rewriting, fusion, generation. Each module can be swapped independently. Popularized by the 'Modular RAG' paper (2023).",example:"A query about claims → routes to claims module. A query about policy → routes to policy module. Each with its own chunking + embedding strategy.",code:`# Modular RAG — routing + composition
from llama_index.core.query_engine import RouterQueryEngine
from llama_index.core.selectors import LLMSingleSelector

# Each module is a specialized engine
policy_engine = policy_index.as_query_engine()
claims_engine = claims_index.as_query_engine()
faq_engine = faq_index.as_query_engine()

# Router decides which module to use
router = RouterQueryEngine(
    selector=LLMSingleSelector.from_defaults(),
    query_engine_tools=[
        QueryEngineTool.from_defaults(policy_engine,
            description="Insurance policy documents"),
        QueryEngineTool.from_defaults(claims_engine,
            description="Claims procedures and history"),
        QueryEngineTool.from_defaults(faq_engine,
            description="Frequently asked questions"),
    ]
)`,general:"Perfect for a dual-chatbot system: customer module vs developer/error module."},{id:"selfrag",tier:"Generation 3",tierColor:"#f59e0b",name:"Self-RAG",aka:"Adaptive / Reflective RAG",emoji:"🪞",color:"#f59e0b",tagline:"The LLM decides if it needs to retrieve",complexity:4,accuracy:5,speed:2,when:"When retrieval is expensive; mixed queries (some need docs, some don't)",weaknesses:["Slower (multiple LLM calls)","Complex training/prompting"],pipeline:["Query","Retrieve? (LLM decides)","Retrieve if needed","Is context relevant? (LLM)","Is answer grounded? (LLM)"],pipelineColors:["#f59e0b","#f59e0b","#f59e0b","#f59e0b","#f59e0b"],description:"The LLM itself decides at each step: (1) Do I even need to retrieve? (2) Is what I retrieved relevant? (3) Is my answer grounded in the evidence? Uses special reflection tokens: [Retrieve], [ISREL], [ISSUP], [ISUSE].",example:"'What is 2+2?' — Self-RAG skips retrieval. 'What are P-200 exclusions?' — Self-RAG retrieves. Saves cost on simple queries.",code:`# Self-RAG via prompting (no fine-tuning needed)
SELF_RAG_PROMPT = """
You are a Self-RAG assistant. Before answering, decide:

1. Do you need to retrieve documents? 
   → If the answer requires specific facts from our knowledge base: [RETRIEVE]
   → If you can answer from general knowledge: [SKIP_RETRIEVE]

2. If you retrieved: Is the context relevant?
   → [RELEVANT] or [IRRELEVANT]

3. Is your answer fully supported by context?
   → [FULLY_SUPPORTED] or [PARTIALLY_SUPPORTED] or [NOT_SUPPORTED]

Question: {question}
"""

# The LLM self-regulates when to retrieve
# reducing unnecessary vector DB calls by 40-60%`,general:"Useful for developer chatbots: some queries don't need doc retrieval; others do."},{id:"crag",tier:"Generation 3",tierColor:"#f59e0b",name:"Corrective RAG",aka:"CRAG",emoji:"🔧",color:"#fb923c",tagline:"Validate retrieved docs before trusting them",complexity:4,accuracy:5,speed:2,when:"High-stakes domains: insurance, legal, medical — where wrong context = wrong answer",weaknesses:["Higher latency","Requires web search fallback"],pipeline:["Retrieve Docs","Relevance Evaluator (LLM)","CORRECT (refine)","INCORRECT (web search)","Generate Answer"],pipelineColors:["#fb923c","#fb923c","#fb923c","#fb923c","#fb923c"],description:"Adds a relevance evaluator after retrieval. If retrieved docs are scored INCORRECT (irrelevant), it falls back to web search or broader retrieval. If AMBIGUOUS, it refines the query and tries again. Prevents 'garbage in, garbage out'.",example:"Query: 'P-500 policy theft limit' → retrieve P-200 docs → evaluator says INCORRECT → retry with web search / broader query.",code:`# Corrective RAG pattern
from llama_index.core.workflow import Workflow, step, Event

class CRAGWorkflow(Workflow):
    @step
    async def retrieve(self, query: str):
        chunks = await vector_search(query)
        return chunks

    @step
    async def evaluate_relevance(self, chunks, query: str):
        # LLM scores each chunk: CORRECT / INCORRECT / AMBIGUOUS
        scores = await llm_relevance_score(chunks, query)
        
        if all(s == "INCORRECT" for s in scores):
            # Fallback: rewrite query, search web
            return await self.web_search_fallback(query)
        elif any(s == "AMBIGUOUS" for s in scores):
            # Refine: keep correct, rewrite for ambiguous
            return await self.refine_and_retrieve(query)
        else:
            return chunks  # All CORRECT, proceed

    @step  
    async def generate(self, context, query):
        return await llm_generate(context, query)`,general:"Critical for production — answers must be grounded. CRAG prevents hallucinations from irrelevant chunks."},{id:"ragfusion",tier:"Generation 2",tierColor:"#0ea5e9",name:"RAG Fusion",aka:"Query Expansion + RRF",emoji:"🔀",color:"#34d399",tagline:"Multiple query perspectives, fused results",complexity:3,accuracy:4,speed:3,when:"Ambiguous queries, comprehensive coverage needed, research-style questions",weaknesses:["Multiple embedding calls","Slower than naive"],pipeline:["Original Query","Generate N sub-queries (LLM)","Retrieve for each query","RRF Fusion of all results","LLM Answer"],pipelineColors:["#34d399","#34d399","#34d399","#34d399","#34d399"],description:"Uses an LLM to generate multiple related versions of the user's query from different angles, runs retrieval for each, then fuses all result lists using Reciprocal Rank Fusion (RRF). Handles ambiguity and gets broader coverage.",example:"'What happens if I miss a payment?' → generates: 'policy lapse procedure', 'late payment penalty', 'grace period rules', 'reinstatement process' → retrieves all → fuses.",code:`from llama_index.core.retrievers import QueryFusionRetriever

# RAG Fusion — auto-generates multiple query variants
fusion_retriever = QueryFusionRetriever(
    retrievers=[vector_retriever],
    similarity_top_k=10,
    num_queries=4,          # generate 4 query variants
    mode="reciprocal_rerank",
    use_async=True,
    verbose=True,
    # LLM generates variants like:
    # "payment deadline insurance policy"
    # "consequences of missed premium payment"  
    # "policy lapse rules"
    # "grace period after missed payment"
)

nodes = await fusion_retriever.aretrieve(
    "What happens if I miss a payment?"
)`,general:"Great for customer chatbots — users often ask vague questions. Fusion handles the ambiguity."},{id:"graphrag",tier:"Generation 3",tierColor:"#f59e0b",name:"Graph RAG",aka:"Knowledge Graph RAG",emoji:"🕸️",color:"#e879f9",tagline:"Relationships between concepts, not just text",complexity:5,accuracy:5,speed:2,when:"Complex entity relationships, multi-hop reasoning, structured knowledge",weaknesses:["Complex to build","Graph maintenance overhead","Slower indexing"],pipeline:["Extract Entities & Relations","Build Knowledge Graph","Graph + Vector Hybrid Search","Graph Traversal","LLM Answer"],pipelineColors:["#e879f9","#e879f9","#e879f9","#e879f9","#e879f9"],description:"Builds a knowledge graph from documents (entities + relationships), then combines graph traversal with vector search. Excels at multi-hop questions like 'Which policies cover flood AND theft AND are active in APAC?' — impossible for pure vector search.",example:"Graph: Policy P-200 → covers → Theft. Theft → limit → $50k. P-200 → valid_in → APAC. Multi-hop query traverses these edges.",code:`# Graph RAG with LlamaIndex + Neo4j
from llama_index.core import KnowledgeGraphIndex
from llama_index.graph_stores.neo4j import Neo4jGraphStore

graph_store = Neo4jGraphStore(
    username="neo4j", password="...", url="bolt://localhost:7687"
)

# Auto-extract entities and relationships
kg_index = KnowledgeGraphIndex.from_documents(
    documents,
    kg_triple_extract_template=kg_prompt,
    max_triplets_per_chunk=10,
    include_embeddings=True,  # hybrid: graph + vector
)

# Query uses BOTH graph traversal + vector search
query_engine = kg_index.as_query_engine(
    include_text=True,
    retriever_mode="hybrid",  # graph + vector
    similarity_top_k=3,
    graph_traversal_depth=2,  # 2-hop traversal
)`,general:"Future upgrade: model domain entities as a graph for complex multi-condition queries."},{id:"multimodal",tier:"Generation 3",tierColor:"#f59e0b",name:"Multi-modal RAG",aka:"Vision RAG",emoji:"👁️",color:"#f472b6",tagline:"Retrieve from images, tables, PDFs, charts",complexity:4,accuracy:4,speed:2,when:"PDFs with tables/charts, scanned forms, diagrams, dashboards",weaknesses:["Expensive (vision model calls)","Complex pipeline"],pipeline:["Parse: text + images + tables","Embed text + image embeddings","Multi-modal search","Vision LLM for images","Unified Answer"],pipelineColors:["#f472b6","#f472b6","#f472b6","#f472b6","#f472b6"],description:"Handles documents that are not just text — insurance claim forms with images, PDFs with coverage tables, scanned accident reports. Uses vision models (Claude, GPT-4V) to understand images, and table parsers for structured data.",example:"A scanned accident report image + text. Multi-modal RAG extracts: text chunks, accident photo description (via vision LLM), damage table rows — all retrievable.",code:`# Multi-modal RAG with LlamaIndex
from llama_index.multi_modal_llms.anthropic import AnthropicMultiModal
from llama_index.core.indices.multi_modal import MultiModalVectorStoreIndex

mm_llm = AnthropicMultiModal(
    model="claude-opus-4-5",
    max_tokens=512
)

# Ingest: text + images from PDFs
from llama_index.core import SimpleDirectoryReader
documents = SimpleDirectoryReader(
    "./claims_docs",
    required_exts=[".pdf", ".png", ".jpg"]
).load_data()

# Multi-modal index (embeds both text and image descriptions)
mm_index = MultiModalVectorStoreIndex.from_documents(documents)

# Query across text AND images
mm_query_engine = mm_index.as_query_engine(
    multi_modal_llm=mm_llm,
    similarity_top_k=3
)
response = mm_query_engine.query(
    "What damage is shown in the accident claim photos?"
)`,general:"High-value upgrade for systems with PDFs full of tables, form fields, and scanned images."},{id:"agentic",tier:"Generation 3",tierColor:"#f59e0b",name:"Agentic RAG",aka:"Multi-hop / ReAct RAG",emoji:"🤖",color:"#fbbf24",tagline:"RAG that plans, loops, and uses tools",complexity:5,accuracy:5,speed:1,when:"Complex multi-step reasoning, tool use, cross-document synthesis",weaknesses:["Slowest","Non-deterministic","Harder to test"],pipeline:["Query","THINK: what do I need?","ACT: retrieve / call tool","OBSERVE: is this enough?","Loop or ANSWER"],pipelineColors:["#fbbf24","#fbbf24","#fbbf24","#fbbf24","#fbbf24"],description:"The LLM acts as an agent — it decides what to retrieve, when to retrieve, and can use multiple tools (calculators, APIs, databases). Implements the ReAct (Reason + Act) loop: Think → Act → Observe → repeat until confident.",example:"'Compare P-200 and P-300 theft limits and tell me which is better for high-value APAC vehicles.' → 2 retrievals + comparison logic + recommendation.",code:`from llama_index.core.agent import ReActAgent
from llama_index.llms.anthropic import Anthropic

agent = ReActAgent.from_tools(
    tools=[
        policy_search_tool,    # retrieves policy docs
        claims_history_tool,   # retrieves past claims
        premium_calc_tool,     # function: calculate premium
        web_search_tool,       # live web search
    ],
    llm=Anthropic(model="claude-opus-4-5"),
    verbose=True,
    max_iterations=8,
    # Thought → Action → Observation loop
    # Agent stops when it has enough to answer
)

response = agent.chat(
    "What would the premium difference be between P-200 and P-300 "
    "for a fleet of 10 vehicles in Singapore?"
)
# Makes: 2 policy lookups + 1 risk data search + 2 calc calls`,general:"A developer support chatbot is essentially this — it reasons over errors, retrieves docs, suggests fixes."},{id:"adaptive",tier:"Generation 3",tierColor:"#f59e0b",name:"Adaptive RAG",aka:"Query-Routing RAG (Jeong et al., 2024)",emoji:"🧭",color:"#22d3ee",tagline:"Route the query — don't always retrieve",complexity:4,accuracy:5,speed:4,when:"Mixed workloads: some queries need no retrieval, some need one hop, some need multi-hop",weaknesses:["Classifier adds latency","Misclassification wastes steps"],pipeline:["Classify Query (LLM)","Simple → LLM Direct","Single-hop → Standard RAG","Multi-hop → Iterative RAG","Merged Answer"],pipelineColors:["#22d3ee","#22d3ee","#22d3ee","#22d3ee","#22d3ee"],description:"A meta-RAG layer that classifies each incoming query into one of three tiers — No Retrieval, Single-hop RAG, or Multi-hop RAG — and routes accordingly. Achieves the accuracy of complex retrieval pipelines while keeping simple queries fast and cheap. Published by Jeong et al. (2024).",example:"'What is 2+2?' → No Retrieval (LLM answers directly). 'What is the theft limit?' → Single-hop RAG. 'Compare P-200 vs P-300 theft AND property limits for APAC vehicles.' → Multi-hop RAG.",code:`# Adaptive RAG — classify then route
from langchain_core.prompts import ChatPromptTemplate
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-opus-4-5")

CLASSIFIER_PROMPT = ChatPromptTemplate.from_template("""
Classify this query into one of three tiers:
- NO_RETRIEVAL: General knowledge, math, simple facts the LLM knows
- SINGLE_HOP: Needs one specific lookup from documents
- MULTI_HOP: Requires multiple retrievals or comparisons across docs

Query: {query}
Tier (output only the label):""")

classifier = CLASSIFIER_PROMPT | llm

async def adaptive_rag(query: str) -> str:
    tier = (await classifier.ainvoke({"query": query})).content.strip()

    if tier == "NO_RETRIEVAL":
        return await llm.ainvoke(query)

    elif tier == "SINGLE_HOP":
        docs = await vector_store.asimilarity_search(query, k=4)
        docs = await reranker.acompress_documents(docs, query)
        return await generate_with_context(query, docs)

    else:  # MULTI_HOP
        return await agentic_retrieval_loop(query, max_hops=4)`,general:"Ideal when query mix is diverse — saves 40–60% on retrieval cost for simple queries while hitting full accuracy on hard ones."},{id:"speculative",tier:"Generation 3",tierColor:"#f59e0b",name:"Speculative RAG",aka:"Draft-then-Verify RAG",emoji:"🎯",color:"#38bdf8",tagline:"Draft answer first, then verify with retrieval",complexity:4,accuracy:5,speed:3,when:"When you want to minimize retrieval calls while maintaining accuracy",weaknesses:["Can reinforce wrong guesses","Two LLM calls per query"],pipeline:["Query","LLM drafts speculative answer","Extract claims from draft","Retrieve to verify each claim","Correct or confirm answer"],pipelineColors:["#38bdf8","#38bdf8","#38bdf8","#38bdf8","#38bdf8"],description:"The LLM first generates a speculative answer from memory alone, then extracts specific claims from that draft, then retrieves targeted evidence to verify each claim. Only retrieves what's needed to verify — very efficient.",example:"Draft: 'P-200 covers theft up to $50k.' → Extract claim: '$50k theft limit' → Retrieve to verify → Confirmed or corrected → Final answer.",code:`SPECULATIVE_RAG_PROMPT = """
Step 1 — Draft: Generate your best answer from memory:
{question}

Step 2 — Extract claims: List all specific factual claims 
you made (numbers, policy details, dates, limits):
Claims: [...]

Step 3 — Verify: For each claim, I will retrieve evidence.
You will then confirm or correct your answer.
"""

async def speculative_rag(question: str):
    # 1. Get speculative draft
    draft = await llm(SPECULATIVE_RAG_PROMPT.format(question=question))
    
    # 2. Extract claims to verify
    claims = extract_claims(draft)
    
    # 3. Targeted retrieval for each claim
    evidence = {}
    for claim in claims:
        evidence[claim] = await retrieve(claim)
    
    # 4. Verify and correct
    final = await llm_verify(draft, evidence)
    return final`,general:"Good for developer support chatbots — can speculate on common errors and verify against your documentation."},{id:"contextual",tier:"Generation 3",tierColor:"#f59e0b",name:"Contextual Retrieval",aka:"Context-Enhanced Chunking (Anthropic, Nov 2024)",emoji:"🧩",color:"#a78bfa",tagline:"Prepend document context to every chunk before embedding",complexity:3,accuracy:5,speed:3,when:"Large corpora where chunks lose context; insurance policy sections, legal documents",weaknesses:["~50% larger vector index","Extra LLM call per chunk at index time","Slower initial indexing"],pipeline:["Load Chunk","LLM Generates Context Summary","Prepend Context + Original Chunk","Embed Contextualized Chunk","Store + Retrieve"],pipelineColors:["#a78bfa","#a78bfa","#a78bfa","#a78bfa","#a78bfa"],description:"Anthropic's Nov 2024 breakthrough: before embedding each chunk, use claude-haiku to generate a 1-2 sentence context that situates it within the whole document. 'The limit is $50,000.' becomes 'From Section 4 of Policy P-200 covering theft exclusions, the theft payout limit is $50,000.' Reduces retrieval failure rates by ~49% (67% with BM25 fusion).",example:"Raw chunk: 'Maximum payout: $50,000.' → Contextualized: 'This clause in Policy P-200 Section 4 sets the maximum theft payout at $50,000 for APAC vehicles registered under the named insured.' Now this chunk is unambiguously findable.",code:`# Contextual Retrieval — Claude generates context for each chunk
import anthropic

client = anthropic.Anthropic()

CONTEXT_PROMPT = """<document>
{whole_document}
</document>

Here is the chunk we want to situate within the document:
<chunk>
{chunk_content}
</chunk>

Provide a short succinct context (1-2 sentences) to situate this 
chunk within the overall document for retrieval. Answer only with
the context, no introduction."""

def add_context_to_chunk(document: str, chunk: str) -> str:
    """Use claude-haiku-4 (fast + cheap) to add context."""
    response = client.messages.create(
        model="claude-haiku-4-20250514",  # Fast & cheap for this task
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": CONTEXT_PROMPT.format(
                whole_document=document,
                chunk_content=chunk
            )
        }]
    )
    context = response.content[0].text
    return f"{context}\\n\\n{chunk}"  # Prepend context to chunk

# Index with contextualized chunks
from anthropic import Anthropic
contextualized_chunks = [
    add_context_to_chunk(full_document, chunk)
    for chunk in raw_chunks
]
# Now embed & store the contextualized chunks
# Retrieval failure rate drops ~49%; pair with BM25 for ~67% improvement`,general:"Biggest single-step improvement for production RAG. Use claude-haiku for context generation to keep costs low. Critical for insurance/legal docs where chunks become meaningless without surrounding context."},{id:"latechunking",tier:"Generation 3",tierColor:"#f59e0b",name:"Late Chunking",aka:"Late Interaction Chunking (JinaAI, Oct 2024)",emoji:"⏱️",color:"#34d399",tagline:"Embed the whole document first, THEN chunk the embeddings",complexity:3,accuracy:4,speed:3,when:"Documents where cross-sentence meaning matters; narratives, reports, interconnected clauses",weaknesses:["Requires long-context embedding model (8192+ tokens)","Slightly higher memory at index time","Less control over chunk boundaries"],pipeline:["Full Document → Long-Context Encoder","Embed All Tokens (full attention)","Pool Embeddings Per Chunk Boundary","Store Chunk Embeddings","Retrieve"],pipelineColors:["#34d399","#34d399","#34d399","#34d399","#34d399"],description:"Traditional RAG: chunk text THEN embed each chunk independently. Late Chunking inverts this: embed the WHOLE document with full attention first (using jina-embeddings-v3 with 8192 token context), then derive chunk embeddings by mean-pooling the token embeddings within chunk boundaries. Each chunk's embedding reflects global document context — solving the 'lost context' problem without an extra LLM call.",example:"Document: 'Policy-P200... Section 4... theft limit $50k... applies to APAC vehicles.' Traditional chunk: '$50k limit' loses 'Policy P-200' and 'APAC' context in its embedding. Late chunking: the $50k chunk embedding encodes the full document context through attention — it 'knows' it's about P-200 APAC theft.",code:`# Late Chunking with jina-embeddings-v3
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np

model_name = "jinaai/jina-embeddings-v3"  # 8192 token context
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModel.from_pretrained(model_name, trust_remote_code=True)

def late_chunking(document: str, chunk_boundaries: list[int]):
    """
    Embed WHOLE doc with full attention, then pool per chunk.
    chunk_boundaries: list of token indices where chunks split.
    """
    # 1. Tokenize full document (up to 8192 tokens)
    inputs = tokenizer(document, return_tensors="pt",
                       max_length=8192, truncation=True)
    
    # 2. Get token embeddings with FULL document attention
    with torch.no_grad():
        outputs = model(**inputs, output_hidden_states=True)
    token_embeddings = outputs.last_hidden_state[0]  # (seq_len, dim)
    
    # 3. Mean-pool token embeddings PER CHUNK BOUNDARY
    chunk_embeddings = []
    for i, (start, end) in enumerate(zip([0] + chunk_boundaries, 
                                          chunk_boundaries + [len(token_embeddings)])):
        chunk_emb = token_embeddings[start:end].mean(dim=0)
        chunk_embeddings.append(chunk_emb.numpy())
    
    return chunk_embeddings  # Each chunk has full-doc-aware embedding

# Result: ~10-12% improvement in MTEB retrieval vs traditional chunking
# No extra LLM call needed — context is captured by attention mechanism`,general:"Best when your documents have strong inter-sentence dependencies. Pairs well with jina-embeddings-v3 which supports 8192 token input. Cheaper than contextual retrieval (no extra LLM call) but requires a long-context encoder."},{id:"longcontext",tier:"Innovation (2025)",tierColor:"#22d3ee",name:"Long-Context RAG",aka:"In-Context Retrieval / Context Window RAG",emoji:"📐",color:"#22d3ee",tagline:"Skip retrieval entirely — stuff the whole corpus in-context",complexity:1,accuracy:4,speed:2,when:"Corpora under ~500K tokens; compliance docs, policy sets, code repositories; when indexing cost > inference cost",weaknesses:["Very high per-query cost","Slow inference for large contexts","Not viable for million-document corpora","Memory intensive"],pipeline:["All Documents → Single Context Window","Query","LLM Reads Everything","Answer from full context","(No retrieval step)"],pipelineColors:["#22d3ee","#22d3ee","#22d3ee","#22d3ee","#22d3ee"],description:"With 1M token context windows (Claude Opus 4.6, Gemini 1.5 Pro), you can skip chunking and retrieval entirely for small-to-medium corpora. Load all your documents into one context window. The model reads everything every query. Dramatically simpler architecture — zero indexing, zero retrieval errors, but very expensive per-query. Research shows it achieves near-perfect recall on 'needle in a haystack' tasks that trip up vector search.",example:"20 insurance policy PDFs → 300K tokens total. Stuff them all into a claude-opus-4-5 call with 1M context. Ask 'List all policies covering APAC flood damage.' LLM reads every document directly — no retrieval failures, no missed clauses.",code:`# Long-Context RAG — no chunking, no vector DB
import anthropic
from pathlib import Path

client = anthropic.Anthropic()

def long_context_rag(query: str, documents_dir: str) -> str:
    """
    Load all documents into one 1M context window.
    No chunking, no embeddings, no vector DB.
    """
    # 1. Load all documents as text
    docs = []
    for f in Path(documents_dir).glob("**/*.txt"):
        docs.append(f"=== {f.name} ===\\n{f.read_text()}")
    
    full_corpus = "\\n\\n".join(docs)
    
    # Check token count (rough: 1 token ≈ 4 chars)
    est_tokens = len(full_corpus) // 4
    print(f"Estimated tokens: {est_tokens:,}")  # Must be < 900K for safety
    
    # 2. Single API call — model reads EVERYTHING
    response = client.messages.create(
        model="claude-opus-4-5",  # 1M context window
        max_tokens=4096,
        system="You are an expert assistant. You have access to all documents below. Answer questions based ONLY on the provided documents.",
        messages=[{
            "role": "user",
            "content": f"""<documents>
{full_corpus}
</documents>

Question: {query}"""
        }]
    )
    return response.content[0].text

# Cost: ~$15 per 1M input tokens (claude-opus-4-5)
# Use when: corpus < 500K tokens AND query frequency is low
# Don't use when: millions of documents, high query volume`,general:"The ultimate simplicity play. Perfect for internal tools querying a fixed, known policy set. Skip RAG infrastructure entirely. High cost per query but zero operational overhead. Use claude-haiku-4 ($0.25/1M tokens) for smaller corpora."}],h=["Generation 1","Generation 2","Generation 3","Innovation (2025)"],d=({value:a,max:s=5,color:o})=>e.jsx("div",{style:{display:"flex",gap:3},children:Array.from({length:s}).map((l,t)=>e.jsx("div",{style:{width:8,height:8,borderRadius:2,background:t<a?o:"#1e293b"}},t))}),f=({steps:a,colors:s,color:o})=>e.jsx("div",{style:{display:"flex",alignItems:"center",flexWrap:"wrap",gap:4,margin:"12px 0"},children:a.map((l,t)=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:4},children:[e.jsx("div",{style:{background:`${o}18`,border:`1px solid ${o}44`,borderRadius:6,padding:"4px 10px",fontSize:11,color:o,fontWeight:600,whiteSpace:"nowrap"},children:l}),t<a.length-1&&e.jsx("span",{style:{color:`${o}66`,fontSize:14},children:"→"})]},t))}),g=({code:a})=>{const[s,o]=u.useState(!1);return e.jsxs("div",{style:{background:"#020617",borderRadius:8,border:"1px solid #1e293b",overflow:"hidden",marginTop:12},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",padding:"6px 12px",background:"#0f172a",borderBottom:"1px solid #1e293b"},children:[e.jsx("span",{style:{color:"#475569",fontSize:11,fontFamily:"monospace"},children:"python"}),e.jsx("button",{onClick:()=>{navigator.clipboard?.writeText(a),o(!0),setTimeout(()=>o(!1),2e3)},style:{background:"none",border:"none",color:"#475569",cursor:"pointer",fontSize:11},children:s?"✓":"copy"})]}),e.jsx("pre",{style:{margin:0,padding:"12px",fontSize:11.5,lineHeight:1.7,color:"#94a3b8",fontFamily:"'Fira Code', monospace",overflowX:"auto"},children:a})]})};function v(){const[a,s]=u.useState(null),[o,l]=u.useState("overview"),t=c.find(r=>r.id===a),p=h.map(r=>({tier:r,color:c.find(i=>i.tier===r)?.tierColor,items:c.filter(i=>i.tier===r)}));return e.jsxs("div",{style:{height:640,background:"#0d1117",color:"#e2e8f0",fontFamily:"'DM Sans', system-ui, sans-serif",display:"flex",flexDirection:"column",borderRadius:8,overflow:"hidden"},children:[e.jsxs("div",{style:{padding:"28px 32px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)"},children:[e.jsx("div",{style:{fontSize:11,fontWeight:700,letterSpacing:4,color:"#475569",textTransform:"uppercase",marginBottom:8},children:"Complete Taxonomy"}),e.jsx("h1",{style:{margin:0,fontSize:32,fontWeight:800,color:"#f8fafc",letterSpacing:-1},children:"Types of RAG"}),e.jsx("p",{style:{margin:"8px 0 0",color:"#64748b",fontSize:14},children:"13 architectures — from vanilla to agentic. Click any type to explore."})]}),e.jsxs("div",{style:{display:"flex",flex:1,overflow:"hidden"},children:[e.jsx("div",{style:{width:340,borderRight:"1px solid rgba(255,255,255,0.06)",overflowY:"auto",padding:"20px 16px",flexShrink:0},children:p.map(({tier:r,color:i,items:m})=>e.jsxs("div",{style:{marginBottom:24},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:10},children:[e.jsx("div",{style:{height:1,flex:1,background:`${i}44`}}),e.jsx("span",{style:{color:i,fontSize:10,fontWeight:700,letterSpacing:3,textTransform:"uppercase"},children:r}),e.jsx("div",{style:{height:1,flex:1,background:`${i}44`}})]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:6},children:m.map(n=>e.jsx("div",{onClick:()=>{s(n.id),l("overview")},style:{background:a===n.id?`${n.color}12`:"#161b22",border:`1px solid ${a===n.id?n.color+"55":"rgba(255,255,255,0.06)"}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",transition:"all 0.15s"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[e.jsx("span",{style:{fontSize:20},children:n.emoji}),e.jsxs("div",{style:{flex:1},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"},children:[e.jsx("span",{style:{color:a===n.id?n.color:"#e2e8f0",fontWeight:700,fontSize:14},children:n.name}),e.jsx("span",{style:{color:"#334155",fontSize:10},children:n.aka})]}),e.jsx("div",{style:{color:"#475569",fontSize:12,marginTop:2},children:n.tagline}),e.jsxs("div",{style:{display:"flex",gap:12,marginTop:6},children:[e.jsxs("div",{children:[e.jsx("div",{style:{color:"#334155",fontSize:9,marginBottom:2},children:"ACCURACY"}),e.jsx(d,{value:n.accuracy,color:n.color})]}),e.jsxs("div",{children:[e.jsx("div",{style:{color:"#334155",fontSize:9,marginBottom:2},children:"COMPLEXITY"}),e.jsx(d,{value:n.complexity,color:n.color})]}),e.jsxs("div",{children:[e.jsx("div",{style:{color:"#334155",fontSize:9,marginBottom:2},children:"SPEED"}),e.jsx(d,{value:n.speed,color:n.color})]})]})]})]})},n.id))})]},r))}),e.jsx("div",{style:{flex:1,overflowY:"auto"},children:t?e.jsxs("div",{style:{padding:"28px 32px",maxWidth:720},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:14,marginBottom:20},children:[e.jsx("span",{style:{fontSize:40},children:t.emoji}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,fontWeight:700,letterSpacing:3,color:t.tierColor,textTransform:"uppercase"},children:t.tier}),e.jsx("h2",{style:{margin:"2px 0 0",fontSize:26,fontWeight:800,color:t.color},children:t.name}),e.jsx("div",{style:{color:"#475569",fontSize:13},children:t.aka})]})]}),e.jsx("div",{style:{display:"flex",gap:2,marginBottom:24,background:"#161b22",borderRadius:8,padding:4,border:"1px solid rgba(255,255,255,0.06)",width:"fit-content"},children:["overview","pipeline","code","general"].map(r=>e.jsx("button",{onClick:()=>l(r),style:{background:o===r?`${t.color}22`:"none",border:o===r?`1px solid ${t.color}44`:"1px solid transparent",color:o===r?t.color:"#475569",padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:12,fontWeight:o===r?700:400,textTransform:"capitalize"},children:r==="general"?"🏗️ General":r.charAt(0).toUpperCase()+r.slice(1)},r))}),o==="overview"&&e.jsxs("div",{children:[e.jsx("p",{style:{color:"#94a3b8",fontSize:15,lineHeight:1.8,margin:"0 0 20px"},children:t.description}),e.jsxs("div",{style:{background:`${t.color}10`,border:`1px solid ${t.color}33`,borderRadius:10,padding:16,marginBottom:16},children:[e.jsx("div",{style:{color:t.color,fontWeight:700,fontSize:12,textTransform:"uppercase",letterSpacing:2,marginBottom:6},children:"Example"}),e.jsx("div",{style:{color:"#cbd5e1",fontSize:14,lineHeight:1.7},children:t.example})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16},children:[e.jsxs("div",{style:{background:"#0a0f1e",border:"1px solid #0f172a",borderRadius:8,padding:12},children:[e.jsx("div",{style:{color:"#22c55e",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:2,marginBottom:8},children:"✓ Best For"}),e.jsx("div",{style:{color:"#94a3b8",fontSize:13,lineHeight:1.8},children:t.when})]}),e.jsxs("div",{style:{background:"#0a0f1e",border:"1px solid #0f172a",borderRadius:8,padding:12},children:[e.jsx("div",{style:{color:"#f87171",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:2,marginBottom:8},children:"⚠ Weaknesses"}),t.weaknesses.map((r,i)=>e.jsxs("div",{style:{color:"#94a3b8",fontSize:13,padding:"1px 0"},children:["• ",r]},i))]})]}),e.jsx("div",{style:{display:"flex",gap:24,background:"#0a0f1e",border:"1px solid #0f172a",borderRadius:8,padding:16},children:[["Accuracy",t.accuracy],["Complexity",t.complexity],["Speed",t.speed]].map(([r,i])=>e.jsxs("div",{children:[e.jsx("div",{style:{color:"#334155",fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:6},children:r}),e.jsx(d,{value:i,color:t.color}),e.jsxs("div",{style:{color:"#475569",fontSize:11,marginTop:4},children:[i,"/5"]})]},r))})]}),o==="pipeline"&&e.jsxs("div",{children:[e.jsxs("div",{style:{color:"#64748b",fontSize:13,marginBottom:16},children:["Step-by-step data flow for ",t.name,":"]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:10},children:t.pipeline.map((r,i)=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:14},children:[e.jsx("div",{style:{width:32,height:32,borderRadius:"50%",background:`${t.color}20`,border:`2px solid ${t.color}55`,display:"flex",alignItems:"center",justifyContent:"center",color:t.color,fontSize:13,fontWeight:800,flexShrink:0},children:i+1}),i<t.pipeline.length-1&&e.jsx("div",{style:{position:"absolute",width:2,height:10,background:`${t.color}33`,marginLeft:15,marginTop:32}}),e.jsxs("div",{style:{background:`${t.color}10`,border:`1px solid ${t.color}33`,borderRadius:8,padding:"10px 16px",flex:1,color:"#e2e8f0",fontSize:14,fontWeight:i===t.pipeline.length-1?700:400},children:[r,i===t.pipeline.length-1&&e.jsx("span",{style:{color:t.color},children:" ←"})]})]},i))}),e.jsxs("div",{style:{marginTop:20,background:"#0a0f1e",border:"1px solid #0f172a",borderRadius:8,padding:14},children:[e.jsx("div",{style:{color:"#475569",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:2,marginBottom:8},children:"Quick Flow"}),e.jsx(f,{steps:t.pipeline,colors:t.pipelineColors,color:t.color})]})]}),o==="code"&&e.jsxs("div",{children:[e.jsxs("div",{style:{color:"#64748b",fontSize:13,marginBottom:4},children:["Implementation pattern for ",t.name,":"]}),e.jsx(g,{code:t.code})]}),o==="general"&&e.jsxs("div",{children:[e.jsxs("div",{style:{background:`${t.color}10`,border:`1px solid ${t.color}44`,borderLeft:`4px solid ${t.color}`,borderRadius:8,padding:16},children:[e.jsx("div",{style:{color:t.color,fontWeight:700,fontSize:12,textTransform:"uppercase",letterSpacing:2,marginBottom:8},children:"🏗️ General Relevance"}),e.jsx("div",{style:{color:"#cbd5e1",fontSize:14,lineHeight:1.8},children:t.general})]}),e.jsxs("div",{style:{marginTop:20,background:"#0a0f1e",border:"1px solid #0f172a",borderRadius:10,padding:16},children:[e.jsx("div",{style:{color:"#475569",fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:2,marginBottom:12},children:"Which RAG types does a general production system use?"}),[{type:"Advanced RAG",role:"Core pipeline — HyDE + Hybrid + Rerank",active:!0},{type:"Modular RAG",role:"Customer chatbot vs Developer chatbot = separate modules",active:!0},{type:"Agentic RAG",role:"Developer support chatbot — multi-hop error reasoning",active:!0},{type:"RAG Fusion",role:"Customer chatbot — handles ambiguous insurance queries",active:t.id==="ragfusion"},{type:"Multi-modal RAG",role:"Future: insurance PDF forms with tables/images",active:!1},{type:"Graph RAG",role:"Future: policy entity relationship graph",active:!1}].map((r,i)=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:"1px solid #0f172a"},children:[e.jsx("span",{style:{fontSize:14},children:r.active?"✅":"🔮"}),e.jsxs("div",{children:[e.jsx("span",{style:{color:r.active?"#e2e8f0":"#334155",fontSize:13,fontWeight:600},children:r.type}),e.jsxs("span",{style:{color:"#475569",fontSize:12},children:[" — ",r.role]})]})]},i))]})]})]}):e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:12,padding:40},children:[e.jsx("div",{style:{fontSize:48},children:"👈"}),e.jsxs("div",{style:{color:"#9ba8b0",fontSize:16,textAlign:"center"},children:["Select a RAG type to see",e.jsx("br",{}),"architecture, pipeline, code & general context"]}),e.jsx("div",{style:{marginTop:24,display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center",maxWidth:500},children:c.map(r=>e.jsxs("div",{onClick:()=>s(r.id),style:{background:`${r.color}15`,border:`1px solid ${r.color}33`,color:r.color,borderRadius:20,padding:"4px 12px",fontSize:12,cursor:"pointer",fontWeight:600},children:[r.emoji," ",r.name]},r.id))})]})})]})]})}export{v as default};
