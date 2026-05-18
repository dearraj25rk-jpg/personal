---
title: RAG Guides
description: Complete technical reference for Retrieval-Augmented Generation — from chunking and embedding to agentic pipelines, multimodal RAG, evaluation, and production deployment. May 2026.
sidebar:
  order: 1
---

> **Current as of May 2026.**

Retrieval-Augmented Generation (RAG) grounds LLM responses in your own documents, eliminating hallucinations on domain-specific knowledge. This section covers every layer of the RAG stack — from initial chunking decisions through production observability — including multimodal RAG for visual documents.

## Documentation Pages

| Page | What you'll learn |
|---|---|
| [Chunking Strategies](./chunking) | Fixed-size, recursive, semantic, late chunking, agentic chunking (LLM-identified boundaries), visual document chunking (Docling, PyMuPDF), parent-document retrieval — with benchmarks and code |
| [Embedding Models](./embedding-models) | Qwen3-Embedding (MTEB v2 #1), BGE-M3, Nomic Embed v2, Gemini text-embedding-004, Cohere Embed v3, OpenAI text-embedding-3, MRL, instruction-tuned embeddings — MTEB v2 leaderboard |
| [Vector Stores](./vector-stores) | FAISS, Chroma, Qdrant v1.13, Pinecone serverless, Weaviate, pgvector 0.8, pgvectorscale, LanceDB — HNSW/IVF/DiskANN algorithms, quantization, multi-tenancy, filtered search |
| [Retrieval Strategies](./retrieval-strategies) | Dense, BM25, hybrid RRF, HyDE, ColBERT v2 late interaction, FlashRank, Voyage Reranker, cross-encoder reranking — with latency and accuracy benchmarks |
| [Advanced RAG](./advanced-rag) | Query rewriting, RAG-Fusion, HyDE, step-back prompting, RAPTOR, Proposition Indexing, STORM, Speculative RAG, Cache-Augmented Generation (CAG) — technique selection guide |
| [Agentic RAG](./agentic-rag) | Self-RAG, CRAG, HippoRAG, Adaptive RAG, multi-agent RAG, Claude tool use, LangGraph 1.0 state machine workflows — decision guide |
| [Evaluation](./evaluation) | RAGAS v0.2 (answer_correctness, entity recall), G-Eval, Prometheus-Eval, DeepEval, TruLens, synthetic testset generation, CI/CD regression testing |
| [Production RAG](./production-rag) | Semantic caching, Langfuse v3, OpenTelemetry, Anthropic prompt caching, guardrails, model routing, cost optimization — complete architecture diagram |
| [Multimodal RAG](./multimodal-rag) | ColPali / ColQwen2 visual document retrieval (no OCR), vision-language embeddings (SigLIP 2, Jina CLIP v2), VLM generation (Claude, GPT-4o, Gemini), table extraction, production patterns |

## Vectorless RAG — Beyond Vector Similarity

When vector search isn't enough — structured documents, exact-match needs, entity relationships, or global corpus synthesis:

| Page | What you'll learn |
|---|---|
| [Vectorless RAG — Complete Guide](./pageindex-vectorless-rag) | Long-context LLMs (Gemini 2.0 Flash 1M, Claude 200K) as retrieval, PageIndex LLM navigation, NL2SQL structured retrieval, decision flowchart (98.7% FinanceBench) |
| [Contextual Retrieval](./contextual-retrieval) | Anthropic Nov 2024: LLM-generated context prepended to every chunk + BM25 hybrid → 69% fewer retrieval failures; prompt caching reduces cost by 89%; async batch pipeline |
| [BM25 & Sparse Retrieval](./bm25-sparse-retrieval) | BM25 math (TF-IDF foundations to BM25 formula), BM25S (500× faster), SPLADE++ (NDCG@10 37.2), Typesense, Elasticsearch, hybrid RRF with worked example |
| [GraphRAG & Knowledge Graphs](./graph-rag) | Microsoft GraphRAG (Leiden communities), NodeRAG (2025, 3× cheaper), LightRAG, HippoRAG (Personalized PageRank), Graph-R1 (2026 RL-based), Neo4j Cypher QA |

## Interactive Courses & Visual Guides

| Resource | What it covers |
|---|---|
| [RAG Academy](./rag-academy) | End-to-end 9-module interactive course — chunking through production deployment, with live code and mini-quizzes |
| [Naive RAG Explainer](./naive-rag) | Step-by-step visual walkthrough of all 8 naive RAG phases — document loading through answer generation with citations |
| [RAG Types Comparison](./rag-types) | Naive, Advanced, Agentic, and Multi-Agent RAG compared — pipeline diagrams, code samples, faithfulness benchmarks, latency profiles |
| [Memory-Augmented RAG](./memory-rag) | Episodic, semantic, procedural, and vector memory — multi-turn conversations, memory extraction, privacy patterns |
| [RAG Speed vs Quality](./rag-speed-quality) | 10 retrieval strategies on the speed–quality curve — p50/p99 latency benchmarks, BEIR NDCG@10, cost per million queries |

## Quick Reference

### The RAG Pipeline

```
Documents (PDF / DOCX / HTML / images)
    │
    ▼ Chunking (512 tokens, 10–20% overlap)
[Chunk 1] [Chunk 2] ... [Chunk N]
    │
    ▼ Embedding (bi-encoder: BGE / Qwen3 / text-embedding-3)
[v1] [v2] ... [vN]   ← 384–2048 dimensional dense vectors
    │
    ▼ Index (HNSW / DiskANN / IVF)
┌──────────────────────────────────┐
│  Vector Store + BM25 Index       │
│  (hybrid for best recall)        │
└──────────────────────────────────┘
             │
             │ ← User Query
             ▼
     Embed query → q_vec
             │
             ▼ Hybrid ANN + BM25 → RRF fusion
     Top-k candidates (k = 50–100)
             │
             ▼ Cross-encoder reranking (optional)
     Top-n chunks (n = 3–5)
             │
             ▼ Prompt assembly
     LLM Generation
             │
             ▼ Answer + Citations
```

### RAG Evaluation Targets (May 2026)

| Metric | Minimum | Good | Excellent |
|---|---|---|---|
| Faithfulness | 0.75 | 0.85 | 0.95 |
| Answer Relevancy | 0.70 | 0.82 | 0.92 |
| Context Precision | 0.65 | 0.78 | 0.90 |
| Context Recall | 0.65 | 0.80 | 0.90 |
| Answer Correctness (RAGAS v0.2) | 0.60 | 0.75 | 0.88 |

### Embedding Model Quick Pick

| Constraint | Choose |
|---|---|
| Fast prototype | `all-MiniLM-L6-v2` (free, 384 dims, 256 max tokens) |
| Production, self-hosted, best open-source | `Qwen/Qwen3-Embedding-7B` (MTEB v2 #1, 2048 dims, 32K tokens) |
| Production, self-hosted, compact | `BAAI/bge-large-en-v1.5` (free, 1024 dims, 512 tokens) |
| Dense + sparse + multi-vector in one | `BAAI/bge-m3` (1024 dims, 8192 tokens, 100+ languages) |
| Production, managed API | `embed-english-v3.0` (Cohere, 1024 dims) |
| Long documents (>512 tokens) | `text-embedding-3-large` (OpenAI, 3072 dims, 8191 tokens) |
| Multilingual | `BAAI/bge-m3` or `Qwen/Qwen3-Embedding-7B` (both 100+ languages) |
| Highest open-source quality | `Qwen/Qwen3-Embedding-7B` (MTEB v2 Retrieval: 70.58) |
| Multimodal / visual documents | `vidore/colqwen2-v1.0` (image patches, no OCR needed) |

### RAG Architecture Selection

| Query type | Corpus type | Recommended architecture |
|---|---|---|
| Simple factual | Text documents | Naive RAG or hybrid retrieval |
| Multi-hop, complex | Text documents | Agentic RAG (LangGraph + Self-RAG) |
| Entity relationships | Any | GraphRAG / HippoRAG |
| Charts, tables, images | PDFs / scanned docs | Multimodal RAG (ColPali/ColQwen2) |
| Exact terms, codes | Any | BM25 or hybrid RRF |
| Small static corpus | Any (≤500 pages) | Cache-Augmented Generation (CAG) |
| Structured data | Database / spreadsheet | NL2SQL |
| Global synthesis | Large corpus | GraphRAG or long-context LLM |
