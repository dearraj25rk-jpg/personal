---
title: Retrieval Strategies
description: Complete May 2026 guide to RAG retrieval — dense, BM25, hybrid RRF, HyDE, MMR, ColBERT v2 late interaction, FlashRank, Voyage Reranker, Ensemble Retriever, RRF vs weighted fusion, two-stage pipeline, and a decision flowchart — with code examples and benchmarks.
sidebar:
  order: 7
---

> **Current as of May 2026.**

## Retrieval Overview

Retrieval is the core of RAG — it determines what context the LLM sees. A bad retriever guarantees a bad answer. A good retriever makes the generator's job easy.

The retrieval pipeline has evolved from basic cosine similarity to multi-stage hybrid systems. This page covers each strategy, when to use it, and how to implement it.

```
  RETRIEVAL PIPELINE — HIGH LEVEL
  ──────────────────────────────────────────────────────────────────────
  User query
      │
      ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  STAGE 1 — RECALL (fast, broad)                                  │
  │                                                                  │
  │  BM25 retriever ──────────────────────────────────────┐         │
  │                                                        ├─► RRF  │
  │  Dense (bi-encoder) retriever ────────────────────────┘  fusion │
  │                                                                  │
  │  Output: top-100 candidates (~5ms)                               │
  └──────────────────────────────────────────────────────────────────┘
      │
      ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  STAGE 2 — PRECISION (slower, accurate)                          │
  │                                                                  │
  │  Cross-encoder reranker (or ColBERT, or FlashRank)               │
  │  Scores each (query, candidate) pair                             │
  │                                                                  │
  │  Output: top-5 reranked results (~150ms)                         │
  └──────────────────────────────────────────────────────────────────┘
      │
      ▼
  LLM context window → answer
```

---

## 1. Dense Retrieval (Vector Search)

The baseline: embed query and documents with the same model, retrieve by cosine similarity.

$$\text{score}(q, d) = \frac{\mathbf{q} \cdot \mathbf{d}}{\|\mathbf{q}\| \|\mathbf{d}\|}$$

**Strengths:** Semantic understanding — finds paraphrases, synonyms, related concepts.
**Weaknesses:** Poor at exact phrase matching ("CVE-2024-43573"), rare terms, proper nouns.

```
  BI-ENCODER DENSE RETRIEVAL:
  ─────────────────────────────────────────────────────────────────
  Offline (at index time):
  doc_0 ──► encoder ──► vector_0  ─┐
  doc_1 ──► encoder ──► vector_1  ─┼──► vector index (HNSW)
  doc_2 ──► encoder ──► vector_2  ─┘

  Online (at query time):
  query ──► encoder ──► query_vec ──► ANN search ──► top-k docs

  Key insight: query and doc vectors are computed INDEPENDENTLY.
  Dot product (cosine) at the end is the only interaction.
  Consequence: fast (pre-computed doc vecs), but loses fine-grained
  token-level matching between query and document.
```

```python
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")
vectorstore = FAISS.load_local("my_index", embeddings, allow_dangerous_deserialization=True)

# Basic dense retrieval
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 10},
)

docs = retriever.invoke("What is the refund policy?")
```

---

## 2. Sparse Retrieval — BM25

**BM25** (Best Match 25) is the standard keyword-based retrieval algorithm used by search engines (Elasticsearch, Solr, Lucene). It scores documents based on term frequency (TF) with saturation and inverse document frequency (IDF).

$$\text{BM25}(q, d) = \sum_{t \in q} \text{IDF}(t) \cdot \frac{f(t,d) \cdot (k_1 + 1)}{f(t,d) + k_1 \cdot \left(1 - b + b \cdot \frac{|d|}{\text{avgdl}}\right)}$$

| Parameter | Typical value | Effect |
|---|---|---|
| $k_1$ | 1.2–2.0 | TF saturation (higher = slower saturation) |
| $b$ | 0.75 | Document length normalization (0 = none, 1 = full) |

**Strengths:** Exact phrase matching, rare terms, proper nouns, IDs, error codes.
**Weaknesses:** Zero understanding of synonyms or semantics.

```python
# BM25 with LangChain + rank_bm25
from langchain_community.retrievers import BM25Retriever

# Build BM25 index from documents
bm25_retriever = BM25Retriever.from_documents(docs, k=10)
bm25_retriever.k = 10

results = bm25_retriever.invoke("CVE-2024-43573 vulnerability fix")
```

### BM25 with Elasticsearch

```python
from langchain_elasticsearch import ElasticsearchStore

es_store = ElasticsearchStore(
    es_url="http://localhost:9200",
    index_name="rag_docs",
    query_field="text",
    vector_query_field="embedding",
    embedding=embeddings,
    strategy=ElasticsearchStore.BM25RetrievalStrategy(),
)
```

---

## 3. Hybrid Retrieval

The best of both worlds: dense retrieval catches semantic matches, BM25 catches keyword matches. Hybrid retrieval with **Reciprocal Rank Fusion (RRF)** is the standard production approach.

### Reciprocal Rank Fusion (RRF)

Given results ranked by two (or more) retrievers, RRF assigns a combined score:

$$\text{RRF}(d) = \sum_{r \in R} \frac{1}{k + \text{rank}_r(d)}$$

where $R$ is the set of retrievers, $\text{rank}_r(d)$ is the position of document $d$ in retriever $r$'s ranking, and $k = 60$ is a smoothing constant.

**Why RRF?** It's robust to outlier scores — you don't need to normalize scores across different retrievers. A document ranked #1 by dense and #3 by BM25 gets a high combined score regardless of the raw similarity values.

```python
from langchain.retrievers import EnsembleRetriever

# Dense retriever
dense_retriever = vectorstore.as_retriever(search_kwargs={"k": 10})

# BM25 retriever
bm25_retriever = BM25Retriever.from_documents(all_docs, k=10)

# RRF ensemble (50/50 weight by default)
hybrid_retriever = EnsembleRetriever(
    retrievers=[dense_retriever, bm25_retriever],
    weights=[0.6, 0.4],   # customize: 0.6 for dense (semantic), 0.4 for BM25 (keyword)
)

results = hybrid_retriever.invoke("Python memory management garbage collection")
```

### Weaviate Hybrid Search

Weaviate implements hybrid natively with the `alpha` parameter:

```python
results = collection.query.hybrid(
    query="memory management",
    alpha=0.75,          # 0 = BM25 only, 1 = vector only
    limit=10,
)
```

---

## 4. HyDE — Hypothetical Document Embeddings

**Paper:** Gao et al., "Precise Zero-Shot Dense Retrieval without Relevance Labels" (2022)

Instead of directly embedding the user's query (often short and ambiguous), ask an LLM to generate a **hypothetical answer document**, then embed that document to search the corpus.

```
User query: "What causes the seasons?"
          ↓ LLM generates
Hypothetical: "The seasons are caused by Earth's axial tilt of 23.5 degrees.
               As the Earth orbits the Sun, the tilt means different hemispheres
               receive more direct sunlight at different times of year..."
          ↓ embed the hypothetical document
          ... retrieve real documents with similar embedding
```

The hypothetical document's embedding is closer to real relevant documents than the short query embedding is.

```python
from langchain.retrievers import HyDEDocumentChain
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

hyde_prompt = ChatPromptTemplate.from_template(
    "Write a paragraph that would answer this question: {question}"
)

hyde_chain = (
    hyde_prompt
    | llm
    | StrOutputParser()
    | vectorstore.as_retriever(search_kwargs={"k": 5})
)

# The chain: generates hypothetical doc → embeds it → retrieves real docs
results = hyde_chain.invoke({"question": "What causes the seasons?"})
```

**When HyDE helps:**
- Queries are very short (< 5 words)
- Domain-specific terminology where queries use different vocabulary than documents
- Cross-lingual retrieval

**When HyDE hurts:**
- Factual queries where hallucination could mislead (the generated hypothesis may be wrong)
- Very fast latency requirements (one extra LLM call)

---

## 5. Multi-Query Retrieval

Generate multiple reformulations of the user's query, retrieve for each, and deduplicate results. Reduces the chance that a single phrasing misses relevant documents.

```python
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.5)

multi_retriever = MultiQueryRetriever.from_llm(
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
    llm=llm,
)
# Internally generates 3 variations of the query, retrieves for each, deduplicates
docs = multi_retriever.invoke("How does attention work in BERT?")
```

Default prompt generates 3 variations. You can also provide a custom prompt.

---

## 6. MMR — Maximal Marginal Relevance

Standard similarity retrieval returns the top-k most similar chunks — which often cluster around the same information. MMR balances **relevance** against **diversity**:

$$\text{MMR}(d) = \arg\max_{d_i \in C \setminus S} \left[\lambda \cdot \text{sim}(q, d_i) - (1-\lambda) \cdot \max_{d_j \in S} \text{sim}(d_i, d_j)\right]$$

- $S$: already selected documents
- $C \setminus S$: candidates not yet selected
- $\lambda$: trade-off (lambda=1 is pure similarity, lambda=0 is pure diversity)

```python
retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 5,
        "fetch_k": 20,   # fetch 20 candidates, MMR selects best 5
        "lambda_mult": 0.7,  # 0 = max diversity, 1 = max relevance
    },
)
```

**Use when:** The corpus has many near-duplicate chunks (e.g., repeated policy boilerplate), and you don't want all 5 retrieved chunks to be the same paragraph.

---

## 7. Cross-Encoder Reranking

A two-stage pattern: first retrieve broadly with a fast method (bi-encoder, BM25, or hybrid), then rerank the candidate list with a more accurate cross-encoder.

```
Stage 1: Hybrid retrieval → top-50 candidates (fast, ~5ms)
Stage 2: Cross-encoder reranking → top-5 (accurate, ~100ms)
```

```python
from sentence_transformers import CrossEncoder
from langchain_core.documents import Document

reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2", max_length=512)

def rerank(query: str, docs: list[Document], top_n: int = 5) -> list[Document]:
    pairs  = [(query, doc.page_content) for doc in docs]
    scores = reranker.predict(pairs)
    ranked = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
    return [doc for doc, _ in ranked[:top_n]]

# Usage: first retrieve 30, then rerank to top 5
candidates = hybrid_retriever.invoke(query)   # 30 docs
final_docs  = rerank(query, candidates, top_n=5)
```

### BGE Reranker (stronger)

```python
from FlagEmbedding import FlagReranker

reranker = FlagReranker("BAAI/bge-reranker-large", use_fp16=True)
pairs = [[query, doc.page_content] for doc in candidates]
scores = reranker.compute_score(pairs)
```

---

## 8. Contextual Compression

After retrieval, extract only the relevant sentences from each chunk instead of passing the full chunk:

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
compressor = LLMChainExtractor.from_llm(llm)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=hybrid_retriever,
)

# Returns only the relevant sentences extracted from each chunk
compressed_docs = compression_retriever.invoke("What is the refund deadline?")
```

---

## ColBERT v2 — Late Interaction

**Paper:** Santhanam et al., "ColBERTv2: Effective and Efficient Retrieval via Lightweight Late Interaction" (2022)

ColBERT is a fundamentally different retrieval paradigm — it sits between a bi-encoder (fast, one vector per text) and a cross-encoder (slow, scores pairs jointly).

### Why Bi-encoders are Limited

A bi-encoder compresses an entire document into a single vector. That single vector must somehow encode all the meaning in the text — but a single 1024-dimensional vector is a lossy summary. Fine-grained token-level matching is lost: the query token "salary" and the document phrase "annual compensation" may be semantically similar, but a bi-encoder single-vector representation cannot reliably preserve this token-pair relationship.

### ColBERT Architecture

```
  BI-ENCODER (standard dense retrieval):
  ─────────────────────────────────────────────────────────────────
  Query  ──► encoder ──► single vector q  (e.g., 1024 dims)
  Doc    ──► encoder ──► single vector d  (e.g., 1024 dims)
  Score  = cosine(q, d)

  All query semantics compressed into one number per dim.
  Token-level matching is LOST.

  CROSS-ENCODER (reranker):
  ─────────────────────────────────────────────────────────────────
  [Query + Doc concatenated] ──► encoder ──► single relevance score
  Can model every token interaction.
  BUT: must run for EVERY candidate — cannot pre-compute doc reps.
  O(n) inference at query time → very slow at scale.

  COLBERT v2 (late interaction):
  ─────────────────────────────────────────────────────────────────
  Query  ──► encoder ──► [q_1, q_2, ..., q_m]   (one vector per query token)
  Doc    ──► encoder ──► [d_1, d_2, ..., d_n]   (one vector per doc token)

  MaxSim scoring:
  Score(q, d) = sum_i  max_j  (q_i · d_j)
                  ^      ^
               each    best matching
               query   doc token
               token

  Interpretation: for each query token, find the most similar doc token.
  Sum those max-similarities across all query tokens.
  ─────────────────────────────────────────────────────────────────
  The "late interaction": vectors stay separate until the final scoring
  step. Document token vectors are pre-computed offline and stored.
  At query time: compute query token vecs → MaxSim over stored doc vecs.
  Much more expressive than bi-encoder; far faster than cross-encoder at scale.
```

### MaxSim Scoring Formula

$$\text{Score}(q, d) = \sum_{i=1}^{m} \max_{j=1}^{n} \left( \mathbf{q}_i \cdot \mathbf{d}_j \right)$$

Where:
- $m$ = number of query tokens (ColBERT pads queries to 32 tokens)
- $n$ = number of document tokens
- $\mathbf{q}_i$ = L2-normalized embedding of query token $i$
- $\mathbf{d}_j$ = L2-normalized embedding of document token $j$

### Index Structure and PLAID

ColBERT stores ALL token vectors for every document — which creates large indexes compared to bi-encoders. For a 1M-document corpus with average 100 tokens per doc, the raw token vector index holds 100M vectors.

**PLAID** (Production-ready Late Interaction Architecture with Dynamic pruning) makes ColBERT practical at scale:
- Clusters all document token vectors into centroids
- At query time, each query token vector finds its nearest centroids
- Only expands candidates from those centroid clusters
- 4x faster than vanilla ColBERT v2 with < 1% recall loss

```
  PLAID QUERY FLOW:
  ─────────────────────────────────────────────────────────────────
  Query tokens [q_1, ..., q_m]
      │
      ▼  find top-k centroids per query token
  Centroid clusters ──► candidate document IDs
      │
      ▼  MaxSim scoring for candidates only (not full corpus)
  Rerank candidates by exact MaxSim
      │
      ▼  return top-k documents
  ─────────────────────────────────────────────────────────────────
  4x speedup vs full MaxSim over all token vectors
```

### RAGatouille — Simplest ColBERT Python Interface

```python
# pip install ragatouille
from ragatouille import RAGPretrainedModel

RAG = RAGPretrainedModel.from_pretrained("colbert-ir/colbertv2.0")

# Index documents (builds compressed token vector index)
RAG.index(
    collection=["Refunds take 30 days.", "Shipping is 5-7 days.", "Returns need receipt."],
    index_name="my_rag_index",
    max_document_length=180,
    split_documents=True,
)

# Search (MaxSim scoring via PLAID)
results = RAG.search(query="What is the refund window?", k=3)
for r in results:
    print(f"Score: {r['score']:.4f}: {r['content']}")
```

```python
# ColBERT as a LangChain retriever
from ragatouille import RAGPretrainedModel
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from langchain_core.callbacks import CallbackManagerForRetrieverRun

class ColBERTRetriever(BaseRetriever):
    rag_model: RAGPretrainedModel
    k: int = 5

    class Config:
        arbitrary_types_allowed = True

    def _get_relevant_documents(
        self, query: str, *, run_manager: CallbackManagerForRetrieverRun
    ) -> list[Document]:
        results = self.rag_model.search(query=query, k=self.k)
        return [
            Document(
                page_content=r["content"],
                metadata={"score": r["score"], "rank": r["rank"]},
            )
            for r in results
        ]

RAG = RAGPretrainedModel.from_index(".ragatouille/colbert/indexes/my_rag_index")
colbert_retriever = ColBERTRetriever(rag_model=RAG, k=5)
```

### Retriever Comparison: Bi-encoder vs ColBERT vs Cross-encoder

| Property | Bi-encoder | ColBERT v2 | Cross-encoder |
|---|---|---|---|
| **Query representation** | Single vector | One vector per token | N/A (joint encoding) |
| **Doc representation** | Single vector (pre-computed) | All token vectors (pre-computed) | Computed at query time |
| **Index size** | 1x (1 vec/doc) | ~100x (100 vecs/doc) | No index |
| **Query latency** | Very fast (ANN) | Fast (PLAID centroid approx) | Slow (runs per candidate) |
| **Recall quality** | Good | Very good | Excellent |
| **Token-level matching** | No | Yes (MaxSim) | Yes (full attention) |
| **Best for** | First-stage recall | High-quality standalone retrieval | Second-stage reranking |

**When to use ColBERT:**
- Legal documents, scientific papers, medical literature — precision matters
- Queries that contain technical terms that need token-level matching
- When you want cross-encoder accuracy without the per-candidate inference cost
- When you cannot afford a GPU reranker in production

---

## Advanced Reranking Options (2024–2026)

### FlashRank — Fast Cross-Encoder Reranking

**GitHub:** `PrithivirajDamodaran/FlashRank`

FlashRank provides ultra-fast cross-encoder reranking with a tiny model footprint — designed for latency-sensitive production. It achieves approximately 4x lower latency than a standard cross-encoder (ms-marco-MiniLM-L-12-v2) with comparable quality on web-search benchmarks.

```
  FLASHRANK LATENCY vs QUALITY (50 candidates):
  ─────────────────────────────────────────────────────────────────
  Model                          Latency   NDCG@10   Size
  ─────────────────────────────────────────────────────────────────
  FlashRank ms-marco-MiniLM      ~10ms     Good      66 MB
  cross-encoder ms-marco-L12     ~150ms    Good      66 MB
  BAAI/bge-reranker-large        ~300ms    Very good 560 MB
  ─────────────────────────────────────────────────────────────────
  FlashRank is 15x faster than bge-reranker-large at comparable
  quality to standard MiniLM cross-encoders.
```

```python
# pip install flashrank
from flashrank import Ranker, RerankRequest
from langchain_core.documents import Document

# Default model: ms-marco-MiniLM-L-12-v2 (~66MB, ~10ms for 50 candidates)
# Larger option: ms-marco-MultiBERT-L-12 (better quality, ~200ms)
ranker = Ranker(model_name="ms-marco-MiniLM-L-12-v2", cache_dir="/tmp/flashrank")

def flashrank_rerank(query: str, docs: list[Document], top_n: int = 5) -> list[Document]:
    passages = [{"id": i, "text": d.page_content} for i, d in enumerate(docs)]
    request = RerankRequest(query=query, passages=passages)
    results = ranker.rerank(request)
    # Results are sorted by relevance score descending
    return [docs[r["id"]] for r in results[:top_n]]

# Usage: retrieve broadly, rerank fast
candidates = hybrid_retriever.invoke(query)   # 50 candidates
final_docs = flashrank_rerank(query, candidates, top_n=5)
# Total latency: ~5ms retrieval + ~10ms FlashRank = ~15ms
```

**Best for:** Latency-sensitive production where a full cross-encoder (~150ms) exceeds your budget. FlashRank fits inside a 50ms API response budget alongside retrieval.

---

### RankGPT — LLM as Reranker

**Paper:** Sun et al., "Is ChatGPT Good at Search? Investigating Large Language Models as Re-Ranking Agents" (2023)

Use an LLM directly as a reranker via a sliding window permutation approach. More expensive than cross-encoders but can leverage language understanding not captured by embedding models.

```python
import anthropic

client = anthropic.Anthropic()

def rankgpt_rerank(
    query: str,
    docs: list[str],
    top_n: int = 5,
    window_size: int = 10,
) -> list[str]:
    """
    Rerank documents using Claude as a listwise reranker.
    Uses sliding window to handle > window_size docs.
    """
    if len(docs) <= window_size:
        return _rankgpt_window(query, docs, top_n)

    # Sliding window: process in overlapping batches
    ranked = docs[:]
    step = window_size // 2
    for start in range(0, len(ranked) - window_size, step):
        window = ranked[start : start + window_size]
        ranked[start : start + window_size] = _rankgpt_window(query, window, len(window))

    return ranked[:top_n]


def _rankgpt_window(query: str, docs: list[str], top_n: int) -> list[str]:
    doc_list = "\n".join(f"[{i+1}] {d[:300]}" for i, d in enumerate(docs))
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",   # fast + cheap for reranking
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": f"""Rank these passages by relevance to the query.
Query: {query}

Passages:
{doc_list}

Output ONLY the passage numbers in order from most to least relevant.
Format: [3] > [1] > [4] > [2] > ...""",
        }],
    )
    # Parse ranking from response
    import re
    numbers = re.findall(r'\[(\d+)\]', response.content[0].text)
    ranked_indices = [int(n) - 1 for n in numbers if 0 < int(n) <= len(docs)]
    # Fill in any missing indices
    for i in range(len(docs)):
        if i not in ranked_indices:
            ranked_indices.append(i)
    return [docs[i] for i in ranked_indices[:top_n]]
```

---

### Cohere Rerank v3

```python
import cohere
from langchain_core.documents import Document

co = cohere.Client("YOUR_API_KEY")

def cohere_rerank(query: str, docs: list[Document], top_n: int = 5) -> list[Document]:
    """Cohere Rerank v3 — strong cross-encoder performance via API."""
    response = co.rerank(
        model="rerank-english-v3.0",   # or rerank-multilingual-v3.0
        query=query,
        documents=[d.page_content for d in docs],
        top_n=top_n,
        return_documents=True,
    )
    return [
        Document(
            page_content=result.document.text,
            metadata={"relevance_score": result.relevance_score},
        )
        for result in response.results
    ]
```

---

### Voyage Reranker (2024)

Voyage AI's `rerank-2` model (released 2024) is particularly strong on long-document and domain-specific retrieval tasks — especially legal, medical, and scientific corpora. It consistently outperforms general-purpose rerankers on BEIR-legal and PubMedQA benchmarks.

```python
import voyageai
from langchain_core.documents import Document

vo = voyageai.Client()   # reads VOYAGE_API_KEY from environment

def voyage_rerank(query: str, docs: list[Document], top_n: int = 5) -> list[Document]:
    """Voyage Reranker-2 — excellent on legal, medical, scientific domains."""
    result = vo.rerank(
        query=query,
        documents=[d.page_content for d in docs],
        model="rerank-2",        # full model — best quality
        # model="rerank-2-lite"  # 3x faster, modest quality reduction
        top_k=top_n,
        truncation=True,         # auto-truncate long passages to model max
    )
    # Rebuild Document objects with voyage relevance scores
    reranked = []
    for r in result.results:
        original_doc = docs[r.index]  # result.index = original position in input list
        reranked.append(Document(
            page_content=original_doc.page_content,
            metadata={**original_doc.metadata, "relevance_score": r.relevance_score},
        ))
    return reranked

# Usage
candidates = hybrid_retriever.invoke(query)   # retrieve top-50
final_docs = voyage_rerank(query, candidates, top_n=5)
```

**Pricing (May 2026):** $0.05 per 1K queries (rerank-2), $0.02 per 1K queries (rerank-2-lite).

---

## Ensemble Retriever with Weighted Fusion

The LangChain `EnsembleRetriever` combines multiple retrievers with configurable weights. Each retriever produces a ranked list; the ensemble applies RRF fusion weighted by the provided coefficients.

```
  ENSEMBLE RETRIEVER — THREE-WAY FUSION:
  ─────────────────────────────────────────────────────────────────
  Query
    │
    ├──► BM25 retriever (weight 0.3) ──► ranked list A (top-10)
    │
    ├──► Dense retriever (weight 0.5) ──► ranked list B (top-10)
    │
    └──► ColBERT retriever (weight 0.2) ──► ranked list C (top-10)
                                                │
                                                ▼
                               weighted RRF fusion
                               RRF_w(d) = sum_r  w_r / (k + rank_r(d))
                                                │
                                                ▼
                                         final ranked list
  ─────────────────────────────────────────────────────────────────
```

```python
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# BM25 retriever (keyword-focused, weight 0.3)
bm25_retriever = BM25Retriever.from_documents(all_docs, k=10)

# Dense bi-encoder retriever (semantic, weight 0.5)
dense_retriever = vectorstore.as_retriever(search_kwargs={"k": 10})

# ColBERT retriever (token-level, weight 0.2)
colbert_retriever = ColBERTRetriever(rag_model=RAG, k=10)

# Three-way ensemble with weights
ensemble = EnsembleRetriever(
    retrievers=[bm25_retriever, dense_retriever, colbert_retriever],
    weights=[0.3, 0.5, 0.2],
)

results = ensemble.invoke("annual salary review process")
```

### Performance Comparison: Ensemble vs Individual Retrievers

```
  NDCG@10 on BEIR benchmark (approximate, varies by domain):
  ─────────────────────────────────────────────────────────────────
  Method                         NDCG@10    Notes
  ─────────────────────────────────────────────────────────────────
  BM25 alone                     0.43       Strong on keyword queries
  Dense (bge-large) alone        0.52       Strong on semantic queries
  ColBERT v2 alone               0.58       Strong on token-level matching
  BM25 + Dense (RRF)             0.57       Best simple hybrid
  BM25 + Dense + ColBERT (RRF)   0.61       Best ensemble, highest coverage
  + Cross-encoder rerank         0.65       Best overall (two-stage)
  ─────────────────────────────────────────────────────────────────
  Takeaway: each retriever catches different failure modes.
  Ensemble reliably outperforms any individual retriever.
```

---

## RRF vs Weighted Average Fusion — Math Explained

Two fusion approaches are common in production hybrid retrieval. Understanding the math helps you choose when to apply each.

### Reciprocal Rank Fusion (RRF)

$$\text{RRF}(d) = \sum_{i=1}^{N} \frac{1}{k + \text{rank}_i(d)}$$

where $k = 60$ is the standard smoothing constant (empirically tuned), and $\text{rank}_i(d)$ is document $d$'s rank (1-indexed) in retriever $i$'s result list.

**Worked example — 3 retrievers, 4 documents:**

```
  Retriever A (BM25):    doc_1=rank1, doc_3=rank2, doc_2=rank3, doc_4=rank4
  Retriever B (dense):   doc_2=rank1, doc_1=rank2, doc_4=rank3, doc_3=rank4
  Retriever C (ColBERT): doc_1=rank1, doc_2=rank2, doc_3=rank3, doc_4=rank4

  k = 60

  RRF scores:
  ─────────────────────────────────────────────────────────────────
  doc_1: 1/(60+1) + 1/(60+2) + 1/(60+1)
       = 0.01639 + 0.01613 + 0.01639 = 0.04891  <-- WINNER

  doc_2: 1/(60+3) + 1/(60+1) + 1/(60+2)
       = 0.01587 + 0.01639 + 0.01613 = 0.04839

  doc_3: 1/(60+2) + 1/(60+4) + 1/(60+3)
       = 0.01613 + 0.01563 + 0.01587 = 0.04763

  doc_4: 1/(60+4) + 1/(60+3) + 1/(60+4)
       = 0.01563 + 0.01587 + 0.01563 = 0.04713

  Final ranking: doc_1 > doc_2 > doc_3 > doc_4
  ─────────────────────────────────────────────────────────────────
  doc_1 wins because it ranked #1 in two out of three retrievers.
  The raw similarity scores from each retriever are never used —
  only the rank positions matter.
```

**Why RRF is robust:**
- Does not require calibrated or normalized scores across retrievers
- Rank positions are comparable; cosine similarities and BM25 scores are not on the same scale
- The $k=60$ constant dampens the importance of very high ranks vs moderate ranks, preventing any single retriever from dominating

### Weighted Average Fusion

$$\text{WA}(d) = \sum_{i=1}^{N} w_i \cdot \text{score}_i(d)$$

where $w_i$ are manually tuned weights summing to 1, and $\text{score}_i(d)$ are the raw similarity/relevance scores from each retriever.

```
  WHEN TO USE WEIGHTED AVERAGE:
  ─────────────────────────────────────────────────────────────────
  Prerequisite: scores must be calibrated (on the same scale).

  Example: both retrievers return probabilities [0, 1]:
    Retriever A (cross-encoder): doc_1=0.92, doc_2=0.71, doc_3=0.45
    Retriever B (BM25 normalized): doc_1=0.80, doc_2=0.60, doc_3=0.75

    WA(doc_1) = 0.6 * 0.92 + 0.4 * 0.80 = 0.552 + 0.320 = 0.872
    WA(doc_2) = 0.6 * 0.71 + 0.4 * 0.60 = 0.426 + 0.240 = 0.666
    WA(doc_3) = 0.6 * 0.45 + 0.4 * 0.75 = 0.270 + 0.300 = 0.570

  PROBLEM: BM25 scores are NOT calibrated probabilities.
  Raw BM25 scores depend on corpus statistics (IDF) and are not
  comparable to cosine similarity scores.

  USE RRF WHEN:
  - Combining BM25 + dense (different score scales — use ranks, not scores)
  - Adding a new retriever without calibration experiments
  - Default / starting point

  USE WEIGHTED AVERAGE WHEN:
  - Both retrievers output calibrated confidence scores
  - You have labeled data to tune weights
  - You need smooth score interpolation (e.g., Weaviate alpha parameter)
```

---

## Two-Stage Retrieval Pipeline

The standard production retrieval architecture uses two stages: a fast broad-recall stage followed by a slower high-precision stage.

```
  TWO-STAGE RETRIEVAL PIPELINE
  ─────────────────────────────────────────────────────────────────

  User query: "What are the early termination fees for my contract?"

  STAGE 1: RECALL (optimize for breadth)
  ─────────────────────────────────────────────────────────────────
  ┌──────────────────────────────────────────────────────────────┐
  │  BM25 retriever ─────────────────────────────────┐          │
  │  ("early termination", "fees", "contract")        ├─► RRF   │
  │                                                   │  fusion  │
  │  Dense retriever ────────────────────────────────┘          │
  │  (semantic: "cancellation charges", "exit penalty")          │
  │                                                              │
  │  Output: top-100 candidates                                  │
  │  Latency: ~5ms (HNSW ANN + BM25 inverted index)             │
  │  Recall@100: ~95%  (target: true answer is in top 100)      │
  └──────────────────────────────────────────────────────────────┘
                          │
                          ▼ 100 candidates

  STAGE 2: PRECISION (optimize for accuracy)
  ─────────────────────────────────────────────────────────────────
  ┌──────────────────────────────────────────────────────────────┐
  │  Cross-encoder reranker                                      │
  │  Scores each (query, candidate) pair with full attention     │
  │                                                              │
  │  Options by latency budget:                                  │
  │  FlashRank MiniLM  → ~10ms   for 100 candidates, good       │
  │  ms-marco-L12      → ~150ms  for 100 candidates, good       │
  │  bge-reranker-large→ ~300ms  for 100 candidates, very good  │
  │  Cohere/Voyage API → ~200ms  API call, excellent             │
  │                                                              │
  │  Output: top-5 reranked results                              │
  │  Latency: ~10–300ms (depends on reranker choice)            │
  │  Precision@5: ~85-92% (vs ~70% for stage 1 top-5 alone)    │
  └──────────────────────────────────────────────────────────────┘
                          │
                          ▼ top-5 high-precision context

  LLM generation (~500ms for most models)

  TOTAL PIPELINE LATENCY:
  ─────────────────────────────────────────────────────────────────
  Stage 1 (recall):     ~5ms
  Stage 2 (precision):  ~10ms  (FlashRank) to ~300ms (bge-large)
  LLM generation:       ~500ms (gpt-4o-mini / haiku)
  ─────────────────────────────────────────────────────────────────
  End-to-end:           ~515ms (FlashRank) to ~800ms (bge-large)
```

```python
# Complete two-stage pipeline
from flashrank import Ranker, RerankRequest
from langchain.retrievers import EnsembleRetriever
from langchain_community.retrievers import BM25Retriever

# Stage 1: hybrid retriever
bm25 = BM25Retriever.from_documents(all_docs, k=50)
dense = vectorstore.as_retriever(search_kwargs={"k": 50})
stage1 = EnsembleRetriever(retrievers=[bm25, dense], weights=[0.4, 0.6])

# Stage 2: FlashRank reranker
ranker = Ranker(model_name="ms-marco-MiniLM-L-12-v2")

def two_stage_retrieve(query: str, final_k: int = 5):
    # Stage 1: recall — get top-100 candidates
    candidates = stage1.invoke(query)   # EnsembleRetriever deduplicates

    # Stage 2: precision — rerank to top-5
    passages = [{"id": i, "text": d.page_content} for i, d in enumerate(candidates)]
    results = ranker.rerank(RerankRequest(query=query, passages=passages))
    top_indices = [r["id"] for r in results[:final_k]]
    return [candidates[i] for i in top_indices]
```

---

## Retrieval Strategy Decision Flowchart

Use this flowchart to select the right strategy for your use case.

```
  RETRIEVAL STRATEGY DECISION FLOWCHART
  ─────────────────────────────────────────────────────────────────

  START: What does your query contain?
      │
      ├──► Exact terms (CVE IDs, model numbers, serial numbers,
      │    error codes, part numbers, ISBNs)?
      │        │
      │        ├── YES, ONLY exact terms ──────────────► BM25
      │        │
      │        └── YES, but also needs semantic ────────► Hybrid RRF
      │                                                   (BM25 + dense)
      │
      └──► Semantic / natural language queries?
               │
               ├── YES, but query is very short (<5 words)
               │   or uses different vocabulary than docs?
               │        └────────────────────────────────► HyDE
               │                                           (generate hypothesis
               │                                            before embedding)
               │
               └── YES, standard natural language query
                        │
                        ▼
               Does the corpus have near-duplicate chunks
               (repeated boilerplate, policy text)?
                        │
                        ├── YES ──────────────────────────► MMR
                        │                                   (diversity boost)
                        │
                        └── NO
                                 │
                                 ▼
                        Is latency budget > 200ms total?
                                 │
                                 ├── NO (< 50ms) ─────────► Dense alone
                                 │                           (skip reranking)
                                 │
                                 └── YES — add reranking:
                                          │
                                          ├── Budget: 50–150ms
                                          │    └────────────► FlashRank
                                          │                   (10ms, good)
                                          │
                                          ├── Budget: 150–500ms
                                          │    └────────────► Cross-encoder
                                          │                   or Voyage/Cohere
                                          │
                                          └── Need token-level precision
                                               (legal, scientific, medical)?
                                                    └───────► ColBERT v2
                                                               (standalone or
                                                                + reranker)
  ─────────────────────────────────────────────────────────────────

  SUMMARY TABLE:
  ─────────────────────────────────────────────────────────────────
  Query type                      Recommended strategy
  ─────────────────────────────────────────────────────────────────
  Exact codes, IDs               BM25
  Semantic only                  Dense bi-encoder
  Mixed (most production cases)  Hybrid RRF (BM25 + dense)
  Short / ambiguous              HyDE (+ hybrid)
  Redundant corpus               MMR
  Latency < 50ms                 Dense, no reranking
  Quality-critical, 200ms OK     Hybrid + cross-encoder rerank
  Legal / scientific precision   ColBERT v2 (PLAID)
  Max quality, latency flexible  Hybrid + Voyage/Cohere rerank
```

---

## Combining Strategies: Production Pipeline

```python
# Recommended production retrieval pipeline

# 1. Multi-query expansion
queries = generate_queries(user_question)  # 3 query variants

# 2. Hybrid retrieval for each query
all_candidates = []
for q in queries:
    all_candidates += hybrid_retriever.invoke(q)

# 3. Deduplicate by document ID
seen_ids = set()
unique_candidates = []
for doc in all_candidates:
    doc_id = doc.metadata.get("doc_id") or doc.page_content[:50]
    if doc_id not in seen_ids:
        unique_candidates.append(doc)
        seen_ids.add(doc_id)

# 4. Cross-encoder rerank
final_docs = rerank(user_question, unique_candidates, top_n=5)

# 5. Generate
answer = llm.invoke(build_prompt(user_question, final_docs))
```

---

## Reranker Comparison (May 2026)

```
  RERANKER OPTIONS — SPEED vs. QUALITY vs. COST
  ─────────────────────────────────────────────────────────────────────
  Model                     Latency/50   Quality   Cost       Self-host
  ─────────────────────────────────────────────────────────────────────
  ms-marco-MiniLM-L-6-v2    ~4ms         Good      Free       Yes
  cross-encoder/ms-marco-L6  ~4ms        Good      Free       Yes
  BAAI/bge-reranker-large   ~30ms        Very good Free       Yes
  FlashRank MiniLM          ~10ms        Good      Free       Yes
  FlashRank MultiBERT       ~200ms       Better    Free       Yes
  Cohere Rerank v3          ~200ms       Excellent $2/1K      No
  Voyage Rerank-2           ~200ms       Excellent $0.05/1K   No
  Voyage Rerank-2-lite      ~80ms        Very good $0.02/1K   No
  RankGPT (Claude Haiku)    ~500ms       Excellent ~$0.02/Q   No
  ─────────────────────────────────────────────────────────────────────
  Recommendation: FlashRank for low-latency prod; Voyage rerank-2
  for legal/medical/scientific; Cohere for multilingual; RankGPT
  when reasoning-based ranking is needed.
```

---

## Retrieval Strategy Comparison (Updated May 2026)

| Strategy | Recall | Precision | Latency | Complexity | Best for |
|---|---|---|---|---|---|
| Dense (bi-encoder) | High | Medium | Very fast | Low | Prototypes, semantic queries |
| BM25 | Medium | High (keywords) | Very fast | Low | Exact terms, IDs, codes |
| Hybrid (RRF) | Very high | High | Fast | Medium | Production default |
| HyDE | High | Medium | Medium (+LLM) | Medium | Short/ambiguous queries |
| Multi-query | Very high | Medium | Medium (+LLM) | Medium | Broad topics |
| MMR | High | Medium | Fast | Low | Diverse sources needed |
| **ColBERT v2** | Very high | Very high | Medium | Medium | Legal, scientific, token-level |
| Cross-encoder rerank | Very high | Very high | Slow (+model) | High | Quality-critical pipelines |
| **FlashRank** | -- (reranker) | Very high | Fast | Low | Latency-sensitive prod |
| **Voyage Rerank-2** | -- (reranker) | Excellent | Medium | Low | Legal/medical/scientific |
| **RankGPT** | -- (reranker) | Excellent | Slow (+LLM) | High | Complex reasoning needed |
| Ensemble (BM25+dense+ColBERT) | Very high | Very high | Medium | High | Maximum recall coverage |

---

## See Also

- [Embedding Models](../embedding-models) — choosing the bi-encoder; Voyage AI, BGE-M3
- [Vector Stores](../vector-stores) — FAISS, Weaviate, Qdrant implementations
- [BM25 & Sparse Retrieval](../bm25-sparse-retrieval) — BM25 math, SPLADE, FTS engines
- [Advanced RAG](../advanced-rag) — query rewriting, FLARE, step-back prompting
- [BERT in RAG](../bert/bert-in-rag) — bi-encoder vs cross-encoder architecture details
