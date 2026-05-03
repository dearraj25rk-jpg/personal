---
title: RAG Guides
description: Complete technical reference for Retrieval-Augmented Generation — from chunking and embedding to agentic pipelines, evaluation, and production deployment.
sidebar:
  order: 1
---

Retrieval-Augmented Generation (RAG) grounds LLM responses in your own documents, eliminating hallucinations on domain-specific knowledge. This section covers every layer of the RAG stack — from initial chunking decisions through production observability.

## Documentation Pages

| Page | What you'll learn |
|---|---|
| [Chunking Strategies](./chunking) | Fixed-size, recursive, semantic, parent-document, and sliding-window chunking with code |
| [Embedding Models](./embedding-models) | all-MiniLM, BGE, E5, Cohere v3, OpenAI embed-3 — MTEB benchmarks and selection guide |
| [Vector Stores](./vector-stores) | FAISS, Chroma, Pinecone, Weaviate, pgvector, Qdrant — index algorithms and trade-offs |
| [Retrieval Strategies](./retrieval-strategies) | Dense, BM25, hybrid RRF, HyDE, MMR, reranking — with performance benchmarks |
| [Advanced RAG](./advanced-rag) | Query rewriting, step-back prompting, FLARE, contextual compression, RAPTOR |
| [Agentic RAG](./agentic-rag) | Self-RAG, CRAG, tool-calling, Adaptive RAG, LangGraph workflows |
| [Evaluation](./evaluation) | RAGAS metrics, faithfulness, context precision/recall, BEIR benchmarks, CI/CD testing |
| [Production RAG](./production-rag) | Semantic caching, async retrieval, observability, guardrails, cost optimization |
| [Multimodal RAG](./multimodal-rag) | CLIP embeddings, PDF parsing, late fusion, visual hallucination checks — 2025–2026 |

## Vectorless RAG — Beyond Vector Similarity

When vector search isn't enough — structured documents, exact-match needs, entity relationships, or global corpus synthesis:

| Page | What you'll learn |
|---|---|
| [Vectorless RAG — Complete Guide](./pageindex-vectorless-rag) | Why vectors fail for structured docs; PageIndex LLM navigation; long-context LLMs; decision guide (98.7% FinanceBench) |
| [Contextual Retrieval](./contextual-retrieval) | Anthropic Nov 2024: LLM-generated context prepended to every chunk + BM25 hybrid → 67% fewer retrieval failures |
| [BM25 & Sparse Retrieval](./bm25-sparse-retrieval) | BM25 math explained step-by-step, SPLADE learned sparse, PostgreSQL FTS, Elasticsearch, hybrid RRF |
| [GraphRAG & Knowledge Graphs](./graph-rag) | Microsoft GraphRAG (2024) Leiden communities, LightRAG (2024), Neo4j Cypher QA — entity relationships + global synthesis |
| [Hyper-RAG](./graph-rag#hyper-rag-2025) | Hypergraph-driven retrieval — reduces hallucinations 12.3% in high-stakes domains (medicine, law) |

## Interactive Courses & Visual Guides

| Resource | What it covers |
|---|---|
| [RAG Academy](./rag-academy) | End-to-end interactive course on RAG systems |
| [Naive RAG Explainer](./naive-rag) | Step-by-step visual walkthrough of a basic RAG pipeline |
| [RAG Types Comparison](./rag-types) | Naive, advanced, modular, and agentic RAG compared side-by-side |
| [Memory-Augmented RAG](./memory-rag) | Adding persistent memory layers for multi-turn tasks |
| [RAG Speed vs Quality](./rag-speed-quality) | Interactive retrieval strategy trade-off comparison |

## Quick Reference

### The RAG Pipeline

```
Documents
    │
    ▼ Chunking
Chunks (256–512 tokens each, 10–20% overlap)
    │
    ▼ Embedding (bi-encoder)
Vectors in Vector Store
    │
    ▼ ───────────── User Query ─────────────
    │                    │
    │               Embed query
    │                    │
    ▼                    ▼
Vector Store ← Nearest neighbor search (HNSW/IVF)
    │
    ▼ Top-k chunks (k = 5–20)
    │
    ▼ Optional: Reranking (cross-encoder)
    │
    ▼ Top-n chunks (n = 3–5)
    │
    ▼ Prompt Assembly
LLM Generation
    │
    ▼ Answer + Citations
```

### RAG Evaluation Targets

| Metric | Minimum acceptable | Good | Excellent |
|---|---|---|---|
| Faithfulness | 0.75 | 0.85 | 0.95 |
| Answer Relevancy | 0.70 | 0.82 | 0.92 |
| Context Precision | 0.65 | 0.78 | 0.90 |
| Context Recall | 0.65 | 0.80 | 0.90 |

### Embedding Model Quick Pick

| Constraint | Choose |
|---|---|
| Fast prototype | `all-MiniLM-L6-v2` (free, 384 dims) |
| Production, self-hosted | `BAAI/bge-large-en-v1.5` (free, 1024 dims) |
| Production, managed API | `embed-english-v3.0` (Cohere, best MTEB) |
| Long documents (>512 tokens) | `text-embedding-3-large` (OpenAI, 8191 tokens) |
| Multilingual | `multilingual-e5-large` or Cohere multilingual |
| Highest quality, GPU | `nvidia/NV-Embed-v2` (7B, MTEB #1) |
