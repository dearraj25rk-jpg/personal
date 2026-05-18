# RAG Hub — Changelog

> This file documents all changes to the RAG Guides section of the Context documentation site.
> Not published to the website.

---

## [2026-05-18] — Vectorless RAG Major Expansion (feature/rag-hub branch)

### Overview

Significant expansion of the Vectorless RAG section. Three new reference docs created, covering Table RAG, Long-Context as Retrieval, and Full-Text Search. The existing `pageindex-vectorless-rag.md` nearly doubled in size with new advanced sections. RAG index updated with 3 new entries and a decision flowchart.

### New Files

| File | Description |
|---|---|
| `src/content/docs/rag/table-rag.md` | Complete guide to table-native RAG: ChainOfTable (Google DeepMind, 2024), TAPAS, pandas-AI/PandasAI 3.0, DuckDB in-process analytics (1.1+), Vanna.ai self-learning NL2SQL (v0.7+), full NL2SQL production pipeline with safety (sqlglot AST inspection), hybrid table+text RAG — WikiTQ, FeTaQA, BIRD, Spider 2.0, TabFact benchmarks |
| `src/content/docs/rag/long-context-rag.md` | Complete guide to long-context LLMs as a retrieval replacement: Needle in a Haystack test (Kamradt, 2023), Lost in the Middle (Stanford, 2023), all 2025–2026 context windows (GPT-4.1 1M, Gemini 2.5 Pro 2M, Claude 200K), Anthropic prompt caching for KV cache preloading, map-reduce/refine/rerank patterns, cost break-even modeling |
| `src/content/docs/rag/full-text-search-rag.md` | Complete guide to FTS-based vectorless retrieval: inverted index theory, BM25 formula, PostgreSQL tsvector/tsquery/GIN, Elasticsearch DSL (match/phrase/multi_match/bool/function_score/span_near), Meilisearch v1.8, Typesense v27, Tantivy/Quickwit, BM25S in-process, hybrid FTS+dense RRF with worked example — BEIR benchmark analysis |

### Expanded Files

#### `pageindex-vectorless-rag.md` (1162 → 2184 lines)
- Added **Async Parallel Summarization** section: `asyncio.Semaphore`, `anthropic.AsyncAnthropic`, 10× speedup (50s → 6s for 100-page doc), `asyncio.gather` for parallel page summarization
- Added **Anthropic Prompt Caching for PageIndex** section: `cache_control` on index text, 90% cost savings on navigation (from $0.045 → $0.0045 per navigation call), `CachedPageIndexQA` class with session-level caching, detailed cost breakdown
- Added **Hierarchical PageIndex** section: two-level hierarchy for 500+ page documents (Section → Page), `Section` dataclass, `navigate_section()` + `navigate_pages_in_section()` + `hierarchical_query()` full implementation
- Added **Multi-Document PageIndex** section: corpus-level routing, `DocumentIndex` + `CorpusIndex` dataclasses, `route_query_to_documents()` + `corpus_query()` implementation for cross-document synthesis
- Added **FRAMES Benchmark** section: Google DeepMind 2024, multi-step reasoning evaluation (40.2% baseline → 84.6% with PageIndex + decomposition), full results table
- Added **Multi-Step PageIndex with Question Decomposition**: `decompose_question()` → chain of sub-retrievals → synthesis, handles multi-hop queries
- Added **Production Monitoring** section: `QueryTrace` dataclass, `MonitoredPageIndexQA` class with full cost tracking, cache hit tracking, latency tracing, `report()` aggregate metrics, SLO targets table
- Added **PageIndex Evaluation** section: `evaluate_navigation_accuracy()` (precision/recall/F1/Hit@1), `evaluate_answer_quality()` with Claude-as-judge scoring
- Updated **See Also** to link to 3 new files

### Updated Files

#### `src/content/docs/rag/index.md`
- Added ASCII "When to Go Vectorless" decision diagram
- Expanded Vectorless RAG section: 4 rows → 7 rows (added Table RAG, Long-Context LLMs as Retrieval, Full-Text Search for RAG)
- Added "Vectorless RAG Decision Flowchart" ASCII diagram
- Expanded RAG Architecture Selection table: 8 rows → 12 rows (added PageIndex, Hierarchical PageIndex, NL2SQL/DuckDB/Table RAG, Long-context LLM, Contextual Retrieval)

#### `src/content/docs/index.mdx` (home page)
- Updated RAG count: `19` → `22` (reflects 3 new docs)
- Updated RAG card count: `14 reference docs` → `17 reference docs`
- Updated RAG card description to include Vectorless RAG track highlights (PageIndex 98.7%, Table RAG, GPT-4.1 1M, Gemini 2.5 Pro 2M, FTS)

### Statistics

| Metric | Before | After |
|---|---|---|
| RAG reference docs | 14 | 17 |
| RAG interactive guides | 5 | 5 |
| Total RAG pages | 19 | 22 |
| pageindex-vectorless-rag.md lines | 1,162 | 2,184 |
| New major sections | — | 8 (in pageindex) + 3 new files |

### New Techniques Covered

| Technique | Paper/Source | Year | Added to |
|---|---|---|---|
| ChainOfTable | Google DeepMind | 2024 | table-rag.md (NEW) |
| TAPAS | Google | 2020 (widely adopted 2024+) | table-rag.md (NEW) |
| PandasAI v3.0 | PandasAI | 2025 | table-rag.md (NEW) |
| DuckDB in-process analytics | DuckDB | 2024 (v1.1) | table-rag.md (NEW) |
| Vanna.ai self-learning NL2SQL | Vanna | 2025 (v0.7) | table-rag.md (NEW) |
| sqlglot AST inspection for SQL safety | tobymao | 2024 | table-rag.md (NEW) |
| Needle in a Haystack test | Greg Kamradt | 2023 (widely adopted) | long-context-rag.md (NEW) |
| Lost in the Middle | Stanford (Liu et al.) | 2023 | long-context-rag.md (NEW) |
| GPT-4.1 1M context | OpenAI | April 2025 | long-context-rag.md (NEW) |
| Gemini 2.5 Pro 2M context | Google | 2025 | long-context-rag.md (NEW) |
| Map-Reduce / Refine / MapRerank | LangChain patterns | 2024 | long-context-rag.md (NEW) |
| Hierarchical summarization | — | 2024 | long-context-rag.md (NEW) |
| PostgreSQL FTS (tsvector/GIN) | PostgreSQL | (updated 2024) | full-text-search-rag.md (NEW) |
| Elasticsearch semantic_text | Elastic | 2024 | full-text-search-rag.md (NEW) |
| Meilisearch v1.8 | Meilisearch | 2025 | full-text-search-rag.md (NEW) |
| Typesense v27 hybrid | Typesense | 2025 | full-text-search-rag.md (NEW) |
| Tantivy / Quickwit | — | 2024 | full-text-search-rag.md (NEW) |
| PageIndex async summarization | — | 2024 | pageindex-vectorless-rag.md |
| Hierarchical PageIndex | — | 2024 | pageindex-vectorless-rag.md |
| Multi-document corpus navigation | — | 2024 | pageindex-vectorless-rag.md |
| FRAMES benchmark | Google DeepMind | 2024 | pageindex-vectorless-rag.md |
| Multi-step question decomposition | — | 2024 | pageindex-vectorless-rag.md |

---

## [2026-05-17] — RAG Hub Major Update (feature/rag-hub branch)

### Overview

Complete refresh of all 19 RAG section files (14 reference docs + 5 interactive MDX guides) plus the home page. All content updated to May 2026. No data loss — all existing content preserved and enhanced.

### New Files

| File | Description |
|---|---|
| `src/content/docs/rag/multimodal-rag.md` | Brand-new comprehensive guide to multimodal RAG: ColPali/ColQwen2 visual document retrieval, vision-language embedding models (CLIP, SigLIP 2, Jina CLIP v2, Nomic Embed Vision), end-to-end PDF-native pipeline, VLM generation (Claude, GPT-4o, Gemini), table extraction, and production deployment patterns. Covers DocVQA, InfoVQA, SlideVQA benchmarks. |
| `changelogs/rag-hub-changelog.md` | This file. |

### Updated Reference Docs

#### `chunking.md`
- Added **Agentic Chunking** section: LLM-identified semantic boundaries using Claude/GPT, with full Python implementation
- Added **Visual Document Chunking** section: PyMuPDF, pdfplumber, Docling (IBM 2024), unstructured — layout-aware PDF chunking for documents with images and tables
- Added **Chunking Strategy Decision Flowchart** (ASCII diagram)
- Added **Chunk Size vs Performance** benchmark table (128–2048 tokens)
- Updated Late Chunking section to reference jina-embeddings-v3 task-specific LoRA adapters
- Updated all date references to May 2026

#### `embedding-models.md`
- Added **Qwen3-Embedding** (Alibaba, May 2025): 7B variant, MTEB v2 Retrieval 70.58 (highest open-source), 32K tokens, Matryoshka dims, instruction-tuned
- Added **BGE-M3** (BAAI, 2024): single model producing dense + sparse + multi-vector (ColBERT-style), 8192 max tokens, 100+ languages
- Added **Nomic Embed Text v2** (Nomic AI, 2025): MoE architecture, 8192 tokens, Apache 2.0
- Added **Google Gemini text-embedding-004** (2025): 62.3 MTEB, task-type parameter
- Added **Instruction-Tuned Embeddings** section: asymmetric retrieval, task prefixes for Qwen3/E5/GTE
- Added **Matryoshka Representation Learning (MRL)** section: dimension truncation, memory trade-offs
- Added **Updated MTEB v2 Leaderboard** (top 10 as of May 2026)
- Added **Embedding Model Selection Decision Tree** (ASCII diagram)
- Updated all date references to May 2026

#### `vector-stores.md`
- Added **LanceDB** section: Apache Lance columnar format, embedded/server modes, 10× faster filtered search
- Added **Sparse Vector Support** section: Qdrant named vectors, Pinecone sparse-dense hybrid, Elasticsearch sparse_vector
- Added **pgvector vs pgvectorscale** expansion: halfvec/bit/sparsevec types (pgvector 0.8), DiskANN (pgvectorscale, 28× faster than pgvector HNSW at scale)
- Added **Multi-Tenancy Patterns** section: namespace, collection-per-tenant, metadata filtering — with trade-off analysis
- Added **Quantization Deep Dive**: scalar (int8), binary (1-bit), product quantization — memory formulas and rescoring
- Added **Filtered Search — Pre vs Post Filtering** section with ASCII diagrams (3 approaches)
- Added **Billion-Scale Deployment** section: sharding, DiskANN, Pinecone serverless
- Added **HNSW Graph Structure** ASCII diagram (multi-layer greedy traversal)
- Added **Vector Store Comparison Matrix** (engine × feature capabilities)
- Updated version numbers: Qdrant v1.13+, Weaviate v1.27+, Chroma v0.6+, pgvector 0.8+

#### `retrieval-strategies.md`
- Added **ColBERT v2 Late Interaction** section: MaxSim formula, token-level matching, PLAID approximation, RAGatouille implementation, decision guide
- Added **FlashRank** lightweight reranker section: 4× faster than cross-encoder, CPU-only, latency benchmarks
- Added **Voyage Reranker** section: rerank-2 model, domain-specific strength
- Added **Ensemble Retriever** section: LangChain EnsembleRetriever, weighted fusion, performance comparison
- Added **RRF vs Weighted Average** fusion explanation with worked numerical example
- Added **Two-Stage Retrieval Pipeline** ASCII diagram (recall stage → precision stage)
- Added **Retrieval Strategy Decision Flowchart** (ASCII diagram)

#### `advanced-rag.md`
- Added **Cache-Augmented Generation (CAG)** section: KV cache preloading, Anthropic SDK prompt caching, CAG vs RAG trade-off table
- Added **Speculative RAG** section: drafter-verifier pattern, 4× speedup, ASCII architecture diagram
- Added **STORM — Synthesis via RAG Minds** section: Stanford NLP 2024, pre-writing/writing phases, knowledge-storm library
- Added **Technique Selection Guide** decision table
- Added **Advanced RAG Pipeline Overview** comprehensive ASCII diagram (all pre/post techniques)

#### `agentic-rag.md`
- Added **Multi-Agent RAG Architecture** section: orchestrator + specialist agents, LangGraph implementation, ASCII message flow diagram
- Added **Claude Tool Use for RAG** section: tool definition, Anthropic SDK tool_use content blocks, streaming, when Claude skips retrieval
- Added **HippoRAG** section: Personalized PageRank, knowledge graph construction, PPR scoring formula, NetworkX implementation
- Added **LangGraph State Machine Diagram** (detailed ASCII): query_analysis → route → retrieve → grade → generate → grade_answer states
- Updated LangGraph reference to v1.0 (stable, Oct 2025) and noted LangGraph 2.0 beta (Feb 2026)
- Added **Self-consistency** section: 3 independent retrieval paths, majority vote

#### `evaluation.md`
- Added **RAGAS v0.2 Updates** section: answer_correctness metric, context_entity_recall, LLMContextRecallWithoutReference, Claude as RAGAS evaluator, testset generation
- Added **G-Eval for RAG** section: LLM-as-judge with CoT, custom metrics (completeness, safety), DeepEval integration
- Added **Prometheus-Eval** section: KAIST open-source LLM judge (8B/70B), direct assessment and pairwise modes
- Added **Automated Regression Testing Pipeline** section: GitHub Actions workflow, 2% faithfulness regression threshold, JSON artifacts
- Added **Evaluation Tool Comparison** table: RAGAS vs DeepEval vs TruLens vs Giskard vs LangSmith vs Prometheus-Eval
- Added **Synthetic Testset Generation** section: RAGAS TestsetGenerator, question types (simple/reasoning/multi-context/conditional), cost estimation
- Added full **evaluation pipeline ASCII diagram**

#### `production-rag.md`
- Added **Langfuse v3 Observability** section: trace/span structure, Python SDK `@observe()` decorator, cost tracking per step, self-hostable
- Added **OpenTelemetry for RAG** section: OTel SDK, OpenInference attribute standard, Phoenix (Arize), LangSmith OTel endpoint
- Added **Prompt Caching for Production RAG** section: Anthropic `cache_control`, ROI calculation, multi-turn RAG with caching code
- Added **Guardrails — Production Safety** section: input guardrails (prompt injection, topic scope, PII), output guardrails (factuality, toxicity), NeMo Guardrails, Guardrails AI v0.5
- Added **Model Routing for Cost Optimization** section: rule-based + LLM classifier router, 60-80% cost savings, per-query cost tracking
- Added **Production RAG System Architecture Diagram** (ASCII): full system from load balancer through guardrails to response
- Added **SLA and Alert Configuration** section: Prometheus metrics for RAG systems

#### `contextual-retrieval.md`
- Added **Updated Results (2025)** section: 69% fewer failures (updated from Nov 2024's 67%), multilingual improvement (+41%)
- Added **Cost Analysis with Prompt Caching** section: detailed cost formula, worked example (89% savings), exact SDK implementation
- Added **Async Batch Processing** section: asyncio.Semaphore rate limiting, parallel context generation, tqdm progress
- Added **Context Quality Validation** section: cosine similarity test methodology, expected 10-30% improvement
- Added **When to Skip Contextual Retrieval** section: self-contained docs, real-time updates, parent-document alternative

#### `bm25-sparse-retrieval.md`
- Added **BM25S** (2024) section: 500× faster than rank-bm25, numpy vectorized, batch queries, memory-mapped
- Added **SPLADE and SPLADE++** section: learned sparse representations, NDCG@10 37.2 on BEIR, HuggingFace integration, comparison with BM25
- Added **Typesense** section: lightweight Elasticsearch alternative with BM25 + vector hybrid
- Added **BM25 Score Interpretability** section: per-term contribution extraction, debugging use case
- Added **Hybrid Search Worked Example** with full step-by-step RRF calculation

#### `graph-rag.md`
- Added **NodeRAG** (Microsoft, 2025) section: unified node representation, 3× cheaper build than GraphRAG, comparison table
- Added **Graph-R1** (2026) section: RL-based graph traversal, 15% improvement on multi-hop QA
- Added **HippoRAG** section: Princeton/Ohio State 2024, PPR scoring, MuSiQue +20% improvement
- Added **Cost and Scale Considerations** section: build cost formula, incremental update strategy
- Added **Compliance/Legal use case** section: entity-relationship graph for contracts

#### `pageindex-vectorless-rag.md`
- Added **Long-Context LLMs as Retrieval** section: Gemini 2.0 Flash (1M tokens, Feb 2025), Claude claude-sonnet-4-6 (200K), cost comparison, FinanceBench 98.7% result
- Added **NL2SQL for Structured Retrieval** section: LangChain SQLDatabaseChain, Vanna.ai, hybrid NL2SQL + vector, safety patterns
- Added **Comprehensive Approach Selection Decision Tree** (ASCII flowchart)
- Updated all LLM context window numbers to 2025-2026 specs

### Updated Interactive MDX Guides

#### `naive-rag.mdx`
- Expanded description with full phase table (8 phases)
- Added naive RAG pipeline ASCII diagram
- Added "Key Naive RAG Limitations" section (motivates advanced techniques)
- Added comprehensive cross-links to all reference docs

#### `rag-academy.mdx`
- Expanded to 9-module course table
- Added full RAG stack ASCII diagram
- Added "Before and After Academy" section
- Added comprehensive cross-links to all reference docs

#### `rag-types.mdx`
- Added generation comparison table with latency/faithfulness data
- Added three-panel pipeline ASCII diagrams (Naive vs Advanced vs Agentic)
- Added "When to Choose Each" decision section
- Added Gen 3b Multi-Agent RAG row to comparison table

#### `memory-rag.mdx`
- Added 5-type memory taxonomy table (working/episodic/semantic/procedural/vector)
- Added Memory Layer Architecture ASCII diagram
- Added Memory Update Strategies section with extraction prompt example
- Added Key Design Decisions section (how much memory, expiry, privacy)
- Added Memory Libraries comparison table (mem0, LangChain, Zep, Cognee)

#### `rag-speed-quality.mdx`
- Added Speed–Quality Curve ASCII visualization
- Added comprehensive latency benchmark table (10 strategies, p50/p99)
- Added Cost Per Million Queries table
- Added Decision Guidance section for each latency budget
- Added Pipeline Optimization Patterns section (recall-then-precision, cache-heavy, tiered routing)

### Home Page Updates (`src/content/docs/index.mdx`)

- Updated RAG Guides count: `18` → `19` (reflects new multimodal-rag.md)
- Updated RAG card description: added multimodal RAG (ColPali, ColQwen2, VLM), updated embedding model list (Qwen3-Embedding, BGE-M3, Nomic), updated techniques (NodeRAG, G-Eval, Langfuse, OTel, prompt caching)
- Updated RAG card count: `13 reference docs · 5 interactive guides` → `14 reference docs · 5 interactive guides`

### Statistics

| Metric | Before | After |
|---|---|---|
| RAG reference docs | 13 | 14 |
| RAG interactive guides | 5 | 5 |
| Total RAG pages | 18 | 19 |
| New major sections added | — | 40+ |
| New ASCII diagrams | — | 25+ |
| New techniques covered | — | 15+ |

### Techniques Added in This Update

| Technique | Paper / Source | Year | Added to |
|---|---|---|---|
| Qwen3-Embedding | Alibaba | 2025 | embedding-models.md |
| BGE-M3 | BAAI | 2024 | embedding-models.md |
| Nomic Embed v2 | Nomic AI | 2025 | embedding-models.md |
| Matryoshka Representation Learning | — | 2022 (widespread 2025) | embedding-models.md |
| LanceDB | LanceDB | 2024 | vector-stores.md |
| pgvectorscale / DiskANN | TimescaleDB | 2024 | vector-stores.md |
| ColBERT v2 + PLAID | Stanford | 2022 (widely adopted 2024+) | retrieval-strategies.md |
| FlashRank | — | 2024 | retrieval-strategies.md |
| Cache-Augmented Generation (CAG) | — | 2025 | advanced-rag.md |
| Speculative RAG | Google | 2024 | advanced-rag.md |
| STORM | Stanford NLP | 2024 | advanced-rag.md |
| Multi-Agent RAG | — | 2025 | agentic-rag.md |
| HippoRAG | Princeton/OSU | 2024 | agentic-rag.md, graph-rag.md |
| Claude Tool Use for RAG | Anthropic | 2024+ | agentic-rag.md |
| RAGAS v0.2 metrics | Explodinggradients | 2025 | evaluation.md |
| G-Eval | — | 2024 | evaluation.md |
| Prometheus-Eval | KAIST | 2025 | evaluation.md |
| Langfuse v3 | Langfuse | 2025 | production-rag.md |
| OpenTelemetry for RAG | OpenInference | 2024+ | production-rag.md |
| Prompt Caching for RAG | Anthropic | 2024 | production-rag.md |
| NodeRAG | Microsoft | 2025 | graph-rag.md |
| Graph-R1 | — | 2026 | graph-rag.md |
| BM25S | — | 2024 | bm25-sparse-retrieval.md |
| SPLADE++ | Naver | 2024 | bm25-sparse-retrieval.md |
| Long-context LLMs as retrieval | Google/Anthropic | 2025 | pageindex-vectorless-rag.md |
| ColPali / ColQwen2 | Idefics/HuggingFace | 2024/2025 | multimodal-rag.md (NEW) |
| VLM generation pipeline | — | 2024+ | multimodal-rag.md (NEW) |

---

*Branch: feature/rag-hub*  
*Updated by: Claude Code (automated documentation update)*  
*Date: 2026-05-17*
