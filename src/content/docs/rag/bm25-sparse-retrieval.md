---
title: "BM25 & Sparse Retrieval"
description: How BM25 keyword scoring works (with the math explained simply), BM25S fast implementation, SPLADE++ learned sparse retrieval, Typesense, score interpretability, Elasticsearch/Typesense integration, and hybrid RRF fusion — with Anthropic SDK and LangChain implementations.
sidebar:
  order: 17
---

## What Is Sparse Retrieval?

Every retrieval method represents documents as numbers. The difference is *how*:

```
  DENSE RETRIEVAL (vectors)              SPARSE RETRIEVAL (keywords)
  ─────────────────────────────          ─────────────────────────────
  "The cat sat on the mat"               "The cat sat on the mat"
        │                                      │
        ▼ embedding model                      ▼ tokenize + score
  [0.23, -0.11, 0.87, 0.04,             {
   0.33,  0.71, -0.22, ...]               "cat": 2.3,
                                           "sat": 1.8,
  768–3072 dimensions                      "mat": 1.9,
  ALL non-zero (dense)                     "the": 0.1,
                                           [all other words]: 0
                                         }
                                         ~50,000 vocab dimensions
                                         MOST are zero (sparse)
```

**Sparse = most values are zero.** A sparse representation only has non-zero scores for words that actually appear in the document (or are semantically related — more on this with SPLADE).

This sparsity is the key advantage: retrieval becomes exact word matching, not approximate geometric search.

---

## TF-IDF — The Foundation

Before BM25, there was **TF-IDF** (Term Frequency–Inverse Document Frequency). Understanding TF-IDF makes BM25 intuitive.

### Term Frequency (TF)

How many times does a word appear in this document?

```
  Document: "Python is great. Python is fast. Python is popular."
  
  TF("Python") = 3/9 = 0.33   (3 occurrences out of 9 total words)
  TF("is")     = 3/9 = 0.33
  TF("great")  = 1/9 = 0.11
```

**Problem with raw TF:** If a document mentions "Python" 100 times, is it 100× more relevant than a document mentioning it once? No — the relevance gain diminishes.

### Inverse Document Frequency (IDF)

How rare is this word across all documents? Rare words are more informative.

```
  Corpus: 10,000 documents

  "Python" appears in 500 documents → IDF = log(10000/500) = 3.0
  "the"    appears in 9999 documents → IDF = log(10000/9999) ≈ 0.0
  "asyncio" appears in 50 documents  → IDF = log(10000/50)  = 5.3

  Insight: "asyncio" is a much stronger signal than "Python",
           which is a stronger signal than "the"
```

### TF-IDF Score

```
  TF-IDF(word, document) = TF(word, document) × IDF(word, corpus)

  For "Python" in our document:
  TF-IDF = 0.33 × 3.0 = 0.99

  For "asyncio" (appears once):
  TF-IDF = 0.11 × 5.3 = 0.58

  Wait — "asyncio" scores lower despite being rarer?
  → That's the TF-IDF limitation BM25 fixes.
```

---

## BM25 — Best Match 25

**BM25** (Okapi BM25, 1994) improves on TF-IDF with two key fixes:

1. **Saturation** — diminishing returns for high term frequency
2. **Document length normalization** — longer documents shouldn't automatically score higher

### The BM25 Formula

```
  BM25(query q, document D) = Σ  IDF(tᵢ) × TF_adjusted(tᵢ, D)
                               tᵢ∈q

  Where:

  IDF(tᵢ) = log( (N - n(tᵢ) + 0.5) / (n(tᵢ) + 0.5) + 1 )

  TF_adjusted = f(tᵢ,D) × (k₁ + 1)
                ─────────────────────────────────────────
                f(tᵢ,D) + k₁ × (1 - b + b × |D|/avgdl)

  Variables:
  N         = total number of documents in corpus
  n(tᵢ)     = number of documents containing term tᵢ
  f(tᵢ,D)   = raw frequency of term tᵢ in document D
  |D|        = length of document D (in words)
  avgdl      = average document length in corpus
  k₁         = term frequency saturation (default: 1.2)
  b          = length normalization weight (default: 0.75)
```

### Understanding k₁ and b

```
  k₁ — SATURATION PARAMETER
  ─────────────────────────────────────────────────
  Controls how quickly relevance saturates with term frequency

  f(t,D) =  1  →  TF_adjusted ≈ 0.91  (with k₁=1.2)
  f(t,D) =  5  →  TF_adjusted ≈ 1.64
  f(t,D) = 10  →  TF_adjusted ≈ 1.77
  f(t,D) = 50  →  TF_adjusted ≈ 1.93
  f(t,D) = ∞   →  TF_adjusted → k₁+1 = 2.2  (hard ceiling!)

  → No matter how many times a term appears, score is bounded.
  → TF-IDF had no such bound — BM25 is more robust.

  ─────────────────────────────────────────────────
  b — LENGTH NORMALIZATION PARAMETER
  ─────────────────────────────────────────────────
  b = 0:  Document length has NO effect (ignore normalization)
  b = 1:  Full length normalization (penalize long docs strongly)
  b = 0.75: Default — partial normalization

  Example:
  Short doc (50 words), "Python" appears once:  |D|/avgdl = 0.25
  Long doc  (500 words), "Python" appears once: |D|/avgdl = 2.50

  With b=0.75:
  Short doc denominator: 1.2 × (0.25 + 0.75 × 0.25) = 0.525
  Long doc denominator:  1.2 × (0.25 + 0.75 × 2.50) = 2.55

  Short doc scores ~5× higher for same term frequency
  → Prevents long docs from winning just by being verbose
```

### BM25 Step-by-Step Example

```
  QUERY: "python async"
  CORPUS: 3 documents

  Doc 1 (80 words):  "Python async/await makes concurrency simple..."
                      python: 3 times, async: 2 times

  Doc 2 (400 words): "Python is a general programming language...
                      [mentions python 8 times, async 1 time]"

  Doc 3 (60 words):  "JavaScript async promises differ from Python
                      async/await syntax..." [python: 2, async: 4]

  avgdl = (80 + 400 + 60) / 3 = 180

  STEP 1: Compute IDF for each query term
  ─────────────────────────────────────────
  "python": in all 3 docs → IDF = log((3-3+0.5)/(3+0.5)+1) ≈ 0.29
  "async":  in all 3 docs → IDF = log((3-3+0.5)/(3+0.5)+1) ≈ 0.29

  (Low IDF because both terms appear in every document)

  STEP 2: Compute TF_adjusted for each doc
  ─────────────────────────────────────────
  Doc 1 "python": f=3, |D|=80
    TF_adj = 3×2.2 / (3 + 1.2×(0.25+0.75×80/180)) = 1.64

  Doc 2 "python": f=8, |D|=400
    TF_adj = 8×2.2 / (8 + 1.2×(0.25+0.75×400/180)) = 1.52
    (saturated despite 8 occurrences, AND penalized for length)

  Doc 3 "async": f=4, |D|=60
    TF_adj = 4×2.2 / (4 + 1.2×(0.25+0.75×60/180)) = 1.78
    (short doc, 4 occurrences of a relevant term → high score)

  RESULT: Doc 3 ranks highest for "python async" despite
  being shorter and having fewer "python" mentions —
  BM25 correctly identifies it as the most relevant.
```

---

## When BM25 Beats Vector Search

```
  USE BM25 WHEN:                          USE VECTORS WHEN:
  ────────────────────────────────        ─────────────────────────────
  Query contains exact terms to match     Query is conversational/fuzzy
  Searching for product codes, CVEs       Semantic similarity matters
  Searching for proper names (companies)  Cross-language retrieval
  Searching for version numbers           Paraphrase detection
  Technical documentation lookup          Concept-level search
  Short queries (2–5 words)               Long descriptive queries
  Domain-specific jargon                  General knowledge questions

  CONCRETE EXAMPLES:
  ──────────────────────────────────────────────────────────────

  BM25 wins:
  "CVE-2024-43573 vulnerability details"  → exact string match
  "PostgreSQL pg_stat_statements"         → exact technical terms
  "BERT bert-base-uncased model card"     → exact model name
  "Apple Inc AAPL Q3 2023 10-K"          → codes + company name

  Vectors win:
  "how to make database queries faster"   → matches "query optimization"
  "my program crashes on startup"         → matches "initialization errors"
  "explain gradient descent simply"       → matches intuitive explanations
  "difference between let and const"      → conceptual similarity
```

---

## BM25S — Faster Python Implementation (2024)

The standard `rank-bm25` library uses pure Python loops over the corpus. For large corpora (100k+ documents), scoring a single query can take several seconds. **BM25S** (2024) replaces these loops with NumPy vectorized sparse matrix operations, achieving 500× speedup on large corpora.

```
  PERFORMANCE COMPARISON

  rank-bm25 (pure Python):
  ─────────────────────────────────────────────────────────────
  Corpus: 100k documents
  Index time:  ~45 seconds
  Query time:  ~800ms per query
  Memory:      stores tokenized corpus as Python lists

  bm25s (NumPy sparse matrices):
  ─────────────────────────────────────────────────────────────
  Corpus: 100k documents
  Index time:  ~3 seconds
  Query time:  ~1.5ms per query   (500× faster)
  Memory:      scipy sparse matrix (efficient, compressible)
  Batch query: 100 queries simultaneously in ~15ms total
```

**Installation and basic usage:**

```python
# pip install bm25s

import bm25s
import numpy as np

# ─── Indexing ────────────────────────────────────────────────

corpus = [
    "Python asyncio provides cooperative multitasking via coroutines.",
    "JavaScript async promises differ from Python async/await syntax.",
    "CVE-2024-43573 affects Windows MSHTML platform.",
    "PostgreSQL pg_stat_statements tracks query execution statistics.",
    "Apple reported iPhone revenue of $39.7B in Q3 FY2023.",
]

# Tokenize and build index
retriever = bm25s.BM25()
corpus_tokens = bm25s.tokenize(corpus, stopwords="en")
retriever.index(corpus_tokens)

# ─── Single query ──────────────────────────────────────────

query = "Python async concurrency"
query_tokens = bm25s.tokenize([query], stopwords="en")

results, scores = retriever.retrieve(query_tokens, k=3)
# results shape: (n_queries, k)
# scores shape:  (n_queries, k)

print("Single query results:")
for doc_idx, score in zip(results[0], scores[0]):
    print(f"  [{score:.3f}] {corpus[doc_idx][:60]}...")


# ─── Batch query (100 questions simultaneously) ──────────────

queries = [
    "Python async concurrency",
    "CVE vulnerability Windows",
    "iPhone revenue Apple quarterly",
    "PostgreSQL database statistics",
]

query_tokens_batch = bm25s.tokenize(queries, stopwords="en")
batch_results, batch_scores = retriever.retrieve(query_tokens_batch, k=3)

print("\nBatch results (4 queries at once):")
for q_idx, query in enumerate(queries):
    print(f"\nQuery: {query}")
    for doc_idx, score in zip(batch_results[q_idx], batch_scores[q_idx]):
        print(f"  [{score:.3f}] {corpus[doc_idx][:60]}...")


# ─── Save and load index ──────────────────────────────────────

# Save to disk (much faster than rebuilding)
retriever.save("my_bm25_index")

# Load from disk
loaded = bm25s.BM25.load("my_bm25_index", load_corpus=True)
```

**Memory-mapped corpus — when index exceeds RAM:**

```python
import bm25s
import numpy as np

# For very large corpora that don't fit in RAM:
# 1. Build the index in chunks and save to disk
# 2. Use mmap=True to access it without loading fully into memory

# Build and save large index
large_corpus = [...]  # millions of documents
retriever = bm25s.BM25()
tokens = bm25s.tokenize(large_corpus, stopwords="en")
retriever.index(tokens)
retriever.save("large_index")  # saves sparse matrix to disk

# Load with memory mapping — only maps pages actually accessed
loaded_retriever = bm25s.BM25.load(
    "large_index",
    mmap=True,          # memory-map the sparse matrix
    load_corpus=False,  # don't load all document texts into RAM
)

# Query works identically — OS pages in only what's needed
query_tokens = bm25s.tokenize(["search query here"], stopwords="en")
results, scores = loaded_retriever.retrieve(query_tokens, k=10)
```

---

## Implementation — Anthropic SDK + rank_bm25

```python
"""
bm25_retrieval.py — BM25 retrieval with Anthropic SDK for generation
pip install rank-bm25 anthropic nltk
"""
import anthropic
import nltk
from rank_bm25 import BM25Okapi, BM25Plus
from dataclasses import dataclass
import re
import string

# Download required NLTK data (run once)
nltk.download("punkt", quiet=True)
nltk.download("stopwords", quiet=True)
nltk.download("punkt_tab", quiet=True)
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer

client = anthropic.Anthropic()
STOPWORDS = set(stopwords.words("english"))
stemmer = PorterStemmer()


# ─── Text preprocessing ───────────────────────────────────────

def preprocess(text: str, stem: bool = False) -> list[str]:
    """
    Tokenize and clean text for BM25 indexing.
    
    stem=False: faster, exact matching, better for technical terms
    stem=True:  handles plurals/tenses ("running" matches "run")
    """
    # Lowercase
    text = text.lower()
    # Remove punctuation (preserve hyphens in compound terms)
    text = re.sub(r"[^\w\s\-]", " ", text)
    # Tokenize
    tokens = nltk.word_tokenize(text)
    # Remove stopwords (optional — removing hurts exact-match queries)
    tokens = [t for t in tokens if t not in STOPWORDS and len(t) > 1]
    # Stem (optional)
    if stem:
        tokens = [stemmer.stem(t) for t in tokens]
    return tokens


# ─── BM25 index ───────────────────────────────────────────────

@dataclass
class BM25Index:
    documents: list[str]
    metadata: list[dict]
    bm25: BM25Okapi


def build_bm25_index(
    documents: list[str],
    metadata: list[dict] | None = None,
    variant: str = "okapi",   # "okapi" or "plus"
) -> BM25Index:
    """
    Build a BM25 index from a list of document strings.

    BM25Okapi: standard BM25, best for most use cases
    BM25Plus:  improved version that ensures non-zero score for any term match
                (better for short documents)
    """
    tokenized = [preprocess(doc) for doc in documents]

    if variant == "plus":
        bm25 = BM25Plus(tokenized)
    else:
        bm25 = BM25Okapi(tokenized)

    return BM25Index(
        documents=documents,
        metadata=metadata or [{} for _ in documents],
        bm25=bm25,
    )


def bm25_retrieve(
    query: str,
    index: BM25Index,
    k: int = 5,
    score_threshold: float = 0.0,
) -> list[dict]:
    """
    Retrieve top-k documents using BM25 scoring.
    Returns documents with scores and metadata.
    """
    tokenized_query = preprocess(query)
    scores = index.bm25.get_scores(tokenized_query)

    # Get indices sorted by score descending
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)

    results = []
    for idx, score in ranked[:k]:
        if score <= score_threshold:
            break
        results.append({
            "document": index.documents[idx],
            "score": float(score),
            "rank": len(results) + 1,
            "metadata": index.metadata[idx],
        })

    return results


# ─── BM25 + Anthropic QA ─────────────────────────────────────

def bm25_rag(
    question: str,
    index: BM25Index,
    k: int = 5,
) -> str:
    """Answer a question using BM25 retrieval + Claude generation."""
    results = bm25_retrieve(question, index, k=k)

    if not results:
        return "No relevant documents found."

    context = "\n\n---\n\n".join(
        f"[Score: {r['score']:.2f}]\n{r['document']}" for r in results
    )

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system="Answer the question using the provided context. Be precise.",
        messages=[{
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion: {question}",
        }],
    )
    return response.content[0].text


# ─── Hybrid BM25 + vector with RRF ───────────────────────────

import numpy as np
from sentence_transformers import SentenceTransformer
import faiss


class HybridBM25VectorRetriever:
    """
    Combines BM25 (exact match) with dense vectors (semantic match)
    using Reciprocal Rank Fusion.

    Best of both worlds:
    - BM25 handles exact terms, codes, names
    - Vectors handle semantic similarity, paraphrases
    - RRF merges both rankings without score normalization
    """

    def __init__(
        self,
        documents: list[str],
        metadata: list[dict] | None = None,
        embed_model: str = "all-MiniLM-L6-v2",
        rrf_k: int = 60,
    ):
        self.documents = documents
        self.metadata = metadata or [{} for _ in documents]
        self.rrf_k = rrf_k

        # BM25 index
        print("Building BM25 index...")
        tokenized = [preprocess(doc) for doc in documents]
        self.bm25 = BM25Okapi(tokenized)

        # Vector index
        print(f"Building vector index ({embed_model})...")
        self.embedder = SentenceTransformer(embed_model)
        embeddings = self.embedder.encode(documents, show_progress_bar=True)
        embeddings = np.array(embeddings, dtype="float32")
        faiss.normalize_L2(embeddings)

        self.vector_index = faiss.IndexFlatIP(embeddings.shape[1])
        self.vector_index.add(embeddings)
        print(f"Ready: {len(documents)} documents indexed")

    def search(
        self,
        query: str,
        k: int = 5,
        bm25_weight: float = 0.5,   # relative weight for BM25 in RRF
        vector_weight: float = 0.5, # relative weight for vectors in RRF
        fetch_k: int = 50,          # candidates from each method before fusion
    ) -> list[dict]:
        """
        Hybrid search with weighted RRF fusion.

        bm25_weight + vector_weight don't need to sum to 1.
        Increase bm25_weight for technical/exact queries.
        Increase vector_weight for semantic/conceptual queries.
        """
        # BM25 search
        tokenized_q = preprocess(query)
        bm25_scores = self.bm25.get_scores(tokenized_q)
        bm25_ranked = sorted(range(len(bm25_scores)), key=lambda i: bm25_scores[i], reverse=True)[:fetch_k]

        # Vector search
        q_emb = self.embedder.encode([query])
        q_emb = np.array(q_emb, dtype="float32")
        faiss.normalize_L2(q_emb)
        _, vec_indices = self.vector_index.search(q_emb, fetch_k)
        vec_ranked = vec_indices[0].tolist()

        # Weighted RRF fusion
        rrf_scores: dict[int, float] = {}

        for rank, idx in enumerate(bm25_ranked):
            rrf_scores[idx] = rrf_scores.get(idx, 0) + bm25_weight / (rank + 1 + self.rrf_k)

        for rank, idx in enumerate(vec_ranked):
            rrf_scores[idx] = rrf_scores.get(idx, 0) + vector_weight / (rank + 1 + self.rrf_k)

        # Sort and return top-k
        sorted_results = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
        return [
            {
                "document": self.documents[idx],
                "rrf_score": score,
                "bm25_score": float(bm25_scores[idx]),
                "metadata": self.metadata[idx],
                "rank": i + 1,
            }
            for i, (idx, score) in enumerate(sorted_results[:k])
        ]

    def rag_answer(self, question: str, k: int = 5) -> str:
        """Answer using hybrid retrieval + Claude."""
        results = self.search(question, k=k)
        context = "\n\n---\n\n".join(r["document"] for r in results)

        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system="Answer precisely using the provided context.",
            messages=[{
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {question}",
            }],
        )
        return response.content[0].text


# ─── Usage ────────────────────────────────────────────────────

if __name__ == "__main__":
    docs = [
        "CVE-2024-43573 affects Windows MSHTML platform versions 10-11.",
        "Python 3.12 introduced the asyncio.TaskGroup API for structured concurrency.",
        "The async/await pattern simplifies asynchronous code in Python.",
        "PostgreSQL 16 adds pg_stat_io for detailed I/O statistics tracking.",
        "Apple reported Q3 FY2023 iPhone revenue of $39,669M, down 2.4% YoY.",
    ]

    # Pure BM25
    index = build_bm25_index(docs)
    result = bm25_rag("CVE-2024-43573 details", index)
    print(result)

    # Hybrid
    hybrid = HybridBM25VectorRetriever(docs)
    answer = hybrid.rag_answer("Python async concurrency patterns")
    print(answer)
```

---

## Implementation — LangChain

```python
"""
bm25_langchain.py — BM25 and hybrid retrieval with LangChain
pip install langchain langchain-community langchain-anthropic rank-bm25
"""
from langchain_community.retrievers import BM25Retriever
from langchain_core.documents import Document
from langchain.retrievers import EnsembleRetriever
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough


# ─── Documents ────────────────────────────────────────────────

docs = [
    Document(page_content="CVE-2024-43573 affects Windows MSHTML...", metadata={"source": "nvd"}),
    Document(page_content="Python asyncio.TaskGroup introduced in 3.11...", metadata={"source": "docs"}),
    Document(page_content="Apple Q3 FY2023 iPhone revenue $39.7B...", metadata={"source": "10-K"}),
]


# ─── BM25 only ────────────────────────────────────────────────

bm25_retriever = BM25Retriever.from_documents(docs)
bm25_retriever.k = 3


# ─── Hybrid: BM25 + FAISS ─────────────────────────────────────

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = FAISS.from_documents(docs, embeddings)
vector_retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

# EnsembleRetriever uses RRF internally
# weights control the contribution of each retriever
hybrid_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, vector_retriever],
    weights=[0.5, 0.5],   # equal weight; increase BM25 weight for technical queries
)


# ─── QA chain ─────────────────────────────────────────────────

llm = ChatAnthropic(model="claude-sonnet-4-6", max_tokens=1024)

prompt = ChatPromptTemplate.from_template("""Answer using the context below.

Context: {context}
Question: {question}
Answer:""")

def format_docs(docs):
    return "\n\n---\n\n".join(d.page_content for d in docs)

# BM25 chain
bm25_chain = (
    {"context": bm25_retriever | format_docs, "question": RunnablePassthrough()}
    | prompt | llm | StrOutputParser()
)

# Hybrid chain (better for mixed queries)
hybrid_chain = (
    {"context": hybrid_retriever | format_docs, "question": RunnablePassthrough()}
    | prompt | llm | StrOutputParser()
)

# Usage
answer = hybrid_chain.invoke("CVE-2024-43573 vulnerability")
print(answer)
```

---

## SPLADE and SPLADE++ — Learned Sparse Retrieval (2023–2024)

**SPLADE** (Sparse Lexical and Expansion Model, Formal et al., 2022) is a neural approach that *learns* sparse representations using BERT. The key insight: SPLADE generates non-zero scores for vocabulary terms that are **semantically related but not literally present** in the document.

```
  BM25 (statistical):               SPLADE (learned):
  ────────────────────────          ──────────────────────────────
  "Python async"                    "Python async"
  → sparse vector:                  → sparse vector:
  {                                 {
    "python": 2.3,                    "python": 3.1,
    "async": 1.8,                     "async": 2.9,
    [all other terms]: 0              "asyncio": 1.4,    ← expanded
  }                                   "concurrency": 1.2, ← expanded
                                      "coroutine": 0.8,  ← expanded
  Cannot match "coroutine"            "await": 0.7,      ← expanded
  if it's not in query                [all other terms]: 0
                                    }
                                    CAN match "coroutine" docs!
```

**Real expansion example:** SPLADE encodes "vehicle" as a sparse vector with scores for:

```
  "vehicle" query → SPLADE activates:
  vehicle: 4.2 (highest — literal term)
  car: 2.8     (strong synonym)
  automobile: 2.1  (formal synonym)
  truck: 1.4   (related hyponym)
  transportation: 0.9
  drive: 0.6
  [thousands of other terms]: 0
```

A document containing "car" but not "vehicle" will now be found. BM25 would miss it completely.

**SPLADE++ — improved training with knowledge distillation (2024):**

SPLADE++ improves on SPLADE by training with:
- Knowledge distillation from a cross-encoder reranker (the teacher model)
- Hard negative mining during training
- Regularization to keep vectors sparse

```
  BENCHMARK: BEIR (Benchmarking IR) — NDCG@10

  ─────────────────────────────────────────────────────────────
  BM25                      22.7
  SPLADE (original)         31.4
  SPLADE-distil             33.1
  SPLADE++ (2024)           37.2
  Dense (DPR)               26.3
  ColBERT v2                31.7
  ─────────────────────────────────────────────────────────────

  SPLADE++ is the best sparse-only method on BEIR.
  It approaches or exceeds most dense methods on keyword-heavy
  benchmark tasks while remaining interpretable.
```

**How to use SPLADE with HuggingFace:**

```python
# pip install transformers torch scipy

from transformers import AutoModelForMaskedLM, AutoTokenizer
import torch
import numpy as np
import scipy.sparse as sp

# Best SPLADE++ checkpoint as of May 2026
MODEL_ID = "naver/splade-cocondenser-distil"
# Alternative: "naver/splade-v3" for latest

tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
model = AutoModelForMaskedLM.from_pretrained(MODEL_ID)
model.eval()

if torch.cuda.is_available():
    model = model.cuda()


def encode_splade(texts: list[str], batch_size: int = 32) -> list[dict[str, float]]:
    """
    Encode a list of texts into SPLADE sparse vectors.

    Returns a list of dicts mapping token → weight.
    Only non-zero (above threshold) terms are included.

    Requires GPU for practical speed: ~100 docs/sec on A100,
    ~10 docs/sec on CPU (usable for small corpora).
    """
    all_vectors = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        inputs = tokenizer(
            batch,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True,
        )
        if torch.cuda.is_available():
            inputs = {k: v.cuda() for k, v in inputs.items()}

        with torch.no_grad():
            outputs = model(**inputs)

        # SPLADE aggregation: log(1 + ReLU(logits)), max-pooled over tokens
        logits = outputs.logits  # (batch, seq_len, vocab_size)
        activations = torch.log1p(torch.relu(logits))
        # Max pool over sequence dimension
        sparse_vecs = torch.max(activations, dim=1).values  # (batch, vocab_size)

        for vec in sparse_vecs:
            # Keep only non-trivial activations
            nonzero_indices = (vec > 0.01).nonzero(as_tuple=True)[0].tolist()
            nonzero_weights = vec[nonzero_indices].tolist()
            tokens = tokenizer.convert_ids_to_tokens(nonzero_indices)
            all_vectors.append({
                tok: w for tok, w in zip(tokens, nonzero_weights)
            })

    return all_vectors


def splade_dot_product(query_vec: dict, doc_vec: dict) -> float:
    """Dot product of two SPLADE sparse vectors."""
    return sum(
        query_vec.get(term, 0.0) * weight
        for term, weight in doc_vec.items()
    )


def splade_retrieve(
    query: str,
    corpus: list[str],
    doc_vectors: list[dict[str, float]],
    k: int = 5,
) -> list[tuple[int, float, str]]:
    """
    Retrieve top-k documents using SPLADE scoring.

    In production: store doc_vectors in a FAISS sparse index
    or Elasticsearch with sparse vector support for scale.
    """
    query_vec = encode_splade([query])[0]
    scores = [
        (i, splade_dot_product(query_vec, dv), corpus[i])
        for i, dv in enumerate(doc_vectors)
    ]
    scores.sort(key=lambda x: x[1], reverse=True)
    return scores[:k]


# ─── Example ─────────────────────────────────────────────────

if __name__ == "__main__":
    corpus = [
        "Python asyncio provides cooperative multitasking via coroutines.",
        "JavaScript promises and async/await for asynchronous programming.",
        "Concurrent vehicle routing algorithms for logistics optimization.",
        "Automobile industry supply chain management best practices.",
    ]

    print("Encoding corpus with SPLADE...")
    doc_vectors = encode_splade(corpus)

    # Show expansion for a query
    query = "Python async"
    query_vec = encode_splade([query])[0]
    top_expansions = sorted(query_vec.items(), key=lambda x: x[1], reverse=True)[:10]
    print(f"\nSPLADE query expansion for '{query}':")
    for term, weight in top_expansions:
        print(f"  {term}: {weight:.3f}")

    # Retrieve
    results = splade_retrieve(query, corpus, doc_vectors)
    print(f"\nTop results:")
    for idx, score, text in results[:3]:
        print(f"  [{score:.3f}] {text[:80]}...")
```

**SPLADE trade-off summary:**

```
  SPLADE TRADE-OFFS vs BM25
  ─────────────────────────────────────────────────────────────
  Advantage:   Matches semantically related terms
               NDCG@10: 37.2 vs BM25's 22.7 on BEIR
               Still interpretable (sparse vector)

  Disadvantage: Requires GPU BERT model (~500MB)
                10-100× slower to index than BM25
                Needs ONNX export for CPU production use
                Slightly more complex setup

  When to use SPLADE over BM25:
  - Semantic recall matters AND exact keyword precision needed
  - Corpus has domain jargon with many synonyms
  - You have GPU inference available
  - BM25 recall is insufficient but dense vectors are too slow/costly
```

---

## Typesense — Lightweight BM25 + Vector Hybrid

**Typesense** is a lightweight, open-source alternative to Elasticsearch that includes built-in BM25 full-text search plus vector hybrid search, distributed as a single binary with minimal operational overhead.

```
  TYPESENSE vs ELASTICSEARCH
  ─────────────────────────────────────────────────────────────
                    Typesense       Elasticsearch
  ─────────────────────────────────────────────────────────────
  Binary size       ~15MB           ~500MB (JVM)
  RAM (min)         ~100MB          ~1GB+
  Setup             Single binary   JVM + config + plugins
  BM25              Built-in        Built-in
  Vector/hybrid     Built-in        Requires kNN plugin
  Typo tolerance    Built-in        Manual fuzzy config
  License           GPL-3           Elastic (not OSS post 7.10)
  Best for          Small-medium    Large enterprise
                    teams, self-    deployments, existing
                    hosted, fast    Elastic ecosystems
                    iteration
  Millions of docs  Yes             Yes
  Billions of docs  Sharded         Yes (native)
  ─────────────────────────────────────────────────────────────
```

**Python client — create collection, index documents, hybrid search:**

```python
# pip install typesense

import typesense

# Connect to Typesense (self-hosted or Typesense Cloud)
client = typesense.Client({
    "nodes": [{"host": "localhost", "port": "8108", "protocol": "http"}],
    "api_key": "your-api-key",
    "connection_timeout_seconds": 2,
})


# ─── Create collection (schema) ──────────────────────────────

schema = {
    "name": "documents",
    "fields": [
        {"name": "id",        "type": "string"},
        {"name": "title",     "type": "string"},
        {"name": "content",   "type": "string"},
        {"name": "source",    "type": "string", "facet": True},
        # Vector field for semantic search (384 dims for MiniLM)
        {"name": "embedding", "type": "float[]", "num_dim": 384},
    ],
    "default_sorting_field": "",
}

# Delete if exists, then create
try:
    client.collections["documents"].delete()
except Exception:
    pass
client.collections.create(schema)


# ─── Index documents ─────────────────────────────────────────

from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer("all-MiniLM-L6-v2")

raw_docs = [
    {"id": "1", "title": "Python Async", "content": "Python asyncio coroutines...", "source": "docs"},
    {"id": "2", "title": "CVE-2024-43573", "content": "Windows MSHTML vulnerability...", "source": "nvd"},
    {"id": "3", "title": "Apple Q3 2023", "content": "iPhone revenue $39.7B...", "source": "10-K"},
]

for doc in raw_docs:
    # Add vector embedding
    doc["embedding"] = embedder.encode(doc["content"]).tolist()
    client.collections["documents"].documents.upsert(doc)


# ─── Pure BM25 keyword search ─────────────────────────────────

bm25_results = client.collections["documents"].documents.search({
    "q": "Python async",
    "query_by": "title,content",
    "per_page": 5,
})

print("BM25 results:")
for hit in bm25_results["hits"]:
    doc = hit["document"]
    print(f"  [{hit['text_match_info']['score']}] {doc['title']}")


# ─── Hybrid search (BM25 + vector) ───────────────────────────

query = "async Python programming patterns"
query_embedding = embedder.encode(query).tolist()

hybrid_results = client.collections["documents"].documents.search({
    "q": query,
    "query_by": "title,content",         # BM25 fields
    "vector_query": f"embedding:([{','.join(map(str, query_embedding))}], k:10)",
    "per_page": 5,
    # alpha controls BM25 vs vector weight:
    # alpha=1.0 → pure BM25, alpha=0.0 → pure vector
    # alpha=0.5 → equal blend (default)
})

print("\nHybrid results:")
for hit in hybrid_results["hits"]:
    doc = hit["document"]
    print(f"  {doc['title']}: {doc['content'][:60]}...")


# ─── Faceted filtering ────────────────────────────────────────

# Search within a specific source facet
filtered_results = client.collections["documents"].documents.search({
    "q": "revenue",
    "query_by": "content",
    "filter_by": "source:=10-K",
    "per_page": 5,
})
```

---

## BM25 Score Interpretability

Unlike dense vector retrieval, BM25 scores are **fully interpretable**: you can decompose the total score into per-term contributions. This is invaluable for debugging retrieval failures — you can see exactly which terms the system matched or missed.

```
  BM25 SCORE DECOMPOSITION
  ─────────────────────────────────────────────────────────────

  Query: "machine learning optimization algorithm"
  Document: "Gradient descent is the core optimization technique
             in machine learning model training."

  Term contributions:
  ─────────────────────────────────────────────────────────────
  "machine"      IDF=2.1  TF_adj=1.4  contribution: 2.94
  "learning"     IDF=1.8  TF_adj=1.4  contribution: 2.52
  "optimization" IDF=3.2  TF_adj=1.4  contribution: 4.48  ← highest
  "algorithm"    IDF=2.7  TF_adj=0.0  contribution: 0.00  ← MISSED

  Total BM25 score: 9.94
  Missing term "algorithm" → would not match docs with only "algorithm"
  ─────────────────────────────────────────────────────────────

  Diagnosis: if this document was NOT retrieved for the query,
  it means "algorithm" appeared in higher-scoring documents
  that BM25 ranked above it. Adding "algorithm" to the document
  OR changing the query to "machine learning optimization" (3 terms
  all matched) would improve recall.
```

```python
"""
bm25_interpretability.py — Decompose BM25 scores into per-term contributions
pip install rank-bm25 nltk
"""
import nltk
import numpy as np
from rank_bm25 import BM25Okapi
from dataclasses import dataclass

nltk.download("punkt", quiet=True)
nltk.download("punkt_tab", quiet=True)


@dataclass
class TermContribution:
    term: str
    idf: float
    tf_adjusted: float
    contribution: float
    found_in_doc: bool


def preprocess_simple(text: str) -> list[str]:
    return [t.lower() for t in text.split() if len(t) > 1]


def explain_bm25_score(
    query: str,
    document: str,
    corpus: list[str],
    k1: float = 1.2,
    b: float = 0.75,
) -> list[TermContribution]:
    """
    Decompose the BM25 score for (query, document) into per-term contributions.

    Returns a list of TermContribution objects, one per query term,
    showing how much each term contributed to the total score.

    Useful for debugging: low contribution for an important query term
    means either (a) the term is very common in corpus (low IDF), or
    (b) the term doesn't appear in the document (missed).
    """
    tokenized_corpus = [preprocess_simple(doc) for doc in corpus]
    doc_tokens = preprocess_simple(document)
    query_tokens = preprocess_simple(query)

    N = len(corpus)
    avgdl = np.mean([len(toks) for toks in tokenized_corpus])
    doc_len = len(doc_tokens)

    contributions = []

    for term in query_tokens:
        # IDF
        n_docs_with_term = sum(1 for toks in tokenized_corpus if term in toks)
        idf = np.log((N - n_docs_with_term + 0.5) / (n_docs_with_term + 0.5) + 1)

        # TF in this document
        tf = doc_tokens.count(term)
        found = tf > 0

        # TF adjusted (BM25 saturation + length normalization)
        if tf > 0:
            tf_adj = (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * doc_len / avgdl))
        else:
            tf_adj = 0.0

        contribution = idf * tf_adj

        contributions.append(TermContribution(
            term=term,
            idf=round(idf, 4),
            tf_adjusted=round(tf_adj, 4),
            contribution=round(contribution, 4),
            found_in_doc=found,
        ))

    return sorted(contributions, key=lambda x: x.contribution, reverse=True)


def print_bm25_explanation(query: str, document: str, corpus: list[str]):
    """Pretty-print the BM25 score decomposition."""
    contribs = explain_bm25_score(query, document, corpus)
    total = sum(c.contribution for c in contribs)
    missed = [c for c in contribs if not c.found_in_doc]

    print(f"\nBM25 Score Explanation")
    print(f"Query:    {query}")
    print(f"Document: {document[:80]}...")
    print(f"\nTerm contributions:")
    print(f"  {'Term':<20} {'IDF':>6} {'TF_adj':>8} {'Contrib':>8}  Status")
    print(f"  {'-'*20} {'-'*6} {'-'*8} {'-'*8}  ------")
    for c in contribs:
        status = "matched" if c.found_in_doc else "MISSING"
        print(f"  {c.term:<20} {c.idf:>6.3f} {c.tf_adjusted:>8.3f} {c.contribution:>8.3f}  {status}")
    print(f"\n  Total BM25 score: {total:.4f}")

    if missed:
        print(f"\nMissed terms (not in document): {[c.term for c in missed]}")
        print("  → Consider: adding synonyms to document, or using SPLADE")
        print("    for semantic term expansion to cover these gaps.")


# ─── Usage ───────────────────────────────────────────────────

if __name__ == "__main__":
    corpus = [
        "Gradient descent is the core optimization technique in machine learning model training.",
        "Support vector machines use kernel methods for classification.",
        "Neural network backpropagation computes gradients for weight updates.",
        "Random forests aggregate decision trees to reduce overfitting.",
    ]

    print_bm25_explanation(
        query="machine learning optimization algorithm",
        document=corpus[0],
        corpus=corpus,
    )
```

---

## Hybrid Search Worked Example — Full RRF Calculation

A concrete example showing exactly how Reciprocal Rank Fusion merges BM25 and dense vector rankings.

**Query:** "machine learning optimization"

**Step 1 — Individual rankings:**

```
  BM25 ranking:               Dense vector ranking:
  ──────────────────          ──────────────────────
  Rank 1: Doc3               Rank 1: Doc1
  Rank 2: Doc1               Rank 2: Doc3
  Rank 3: Doc5               Rank 3: Doc7

  (Doc7 did not appear in BM25 top-3)
  (Doc5 did not appear in dense top-3)
```

**Step 2 — RRF score calculation (k=60):**

```
  RRF formula: score(doc) = Σ 1/(rank + k)

  ─────────────────────────────────────────────────────────────
  Doc    BM25 rank   Dense rank   RRF from BM25   RRF from Dense   Total
  ─────────────────────────────────────────────────────────────
  Doc3   1           2            1/(1+60)=0.01639 1/(2+60)=0.01613 0.03252
  Doc1   2           1            1/(2+60)=0.01613 1/(1+60)=0.01639 0.03252
  Doc5   3           (not ranked) 1/(3+60)=0.01587 0               0.01587
  Doc7   (not ranked) 3           0               1/(3+60)=0.01587 0.01587
  ─────────────────────────────────────────────────────────────
```

**Step 3 — Final merged ranking:**

```
  FINAL RRF RANKING:
  ──────────────────────────────────────────────────────────────
  Rank 1: Doc3  (score: 0.03252) — appeared in BOTH rankings
  Rank 2: Doc1  (score: 0.03252) — appeared in BOTH rankings
  Rank 3: Doc5  (score: 0.01587) — BM25 only (exact term match)
  Rank 4: Doc7  (score: 0.01587) — Dense only (semantic match)
  ──────────────────────────────────────────────────────────────

  Key insight: Doc3 and Doc1 are tied because they each appeared
  as rank 1 in one method and rank 2 in the other.
  In practice, break ties by preferring the BM25 rank
  (BM25 is more precise; dense adds recall).

  Why RRF is better than score normalization:
  - BM25 scores (e.g., 7.3, 4.1, 2.8) and dense cosine
    similarities (e.g., 0.91, 0.87, 0.72) are on incompatible
    scales. Direct addition would make BM25 dominate.
  - RRF uses only rank position → scale-invariant, robust.
```

```python
def rrf_merge(
    bm25_ranking: list[int],    # doc indices in BM25 rank order
    dense_ranking: list[int],   # doc indices in dense rank order
    k: int = 60,
    bm25_weight: float = 1.0,
    dense_weight: float = 1.0,
) -> list[tuple[int, float]]:
    """
    Merge two ranked lists using Reciprocal Rank Fusion.

    k=60: standard default (Robertson et al., 2009)
         Higher k → more weight to lower-ranked results
         Lower k  → more weight to top-ranked results

    Returns sorted list of (doc_index, rrf_score) tuples.
    """
    scores: dict[int, float] = {}

    for rank, doc_idx in enumerate(bm25_ranking):
        scores[doc_idx] = scores.get(doc_idx, 0.0) + \
                          bm25_weight / (rank + 1 + k)

    for rank, doc_idx in enumerate(dense_ranking):
        scores[doc_idx] = scores.get(doc_idx, 0.0) + \
                          dense_weight / (rank + 1 + k)

    return sorted(scores.items(), key=lambda x: x[1], reverse=True)


# Reproduce worked example:
bm25_order  = [3, 1, 5]   # Doc3 rank1, Doc1 rank2, Doc5 rank3
dense_order = [1, 3, 7]   # Doc1 rank1, Doc3 rank2, Doc7 rank3

merged = rrf_merge(bm25_order, dense_order, k=60)
print("Final RRF ranking:")
for rank, (doc_idx, score) in enumerate(merged, 1):
    print(f"  Rank {rank}: Doc{doc_idx}  score={score:.5f}")
```

---

## Full-Text Search Engines

For production systems, use a purpose-built search engine rather than in-process BM25:

```
  ENGINE COMPARISON
  ────────────────────────────────────────────────────────────────────
  Engine           License    BM25  Neural  Scale       Best for
  ────────────────────────────────────────────────────────────────────
  Elasticsearch    Elastic    Yes   Yes     Petabyte    Enterprise search
  OpenSearch       Apache 2   Yes   Yes     Petabyte    AWS deployments
  Typesense        GPL-3      Yes   Yes     Millions    Lightweight hybrid
  Meilisearch      MIT        Yes   No      Millions    Developer-friendly
  Tantivy          MIT        Yes   No      Millions    Rust-based, embedded
  PostgreSQL FTS   PostgreSQL Yes   No      Millions    Already using Postgres
  ────────────────────────────────────────────────────────────────────
```

### PostgreSQL Full-Text Search

If your data is already in PostgreSQL, use built-in FTS before adding a search engine:

```sql
-- Create a tsvector column for fast FTS
ALTER TABLE documents ADD COLUMN ts_content tsvector;

-- Populate it from the text column
UPDATE documents 
SET ts_content = to_tsvector('english', content);

-- Create GIN index for fast BM25-style search
CREATE INDEX documents_ts_idx ON documents USING GIN(ts_content);

-- Query: returns ranked results
SELECT 
    id,
    title,
    content,
    ts_rank(ts_content, query) AS rank
FROM 
    documents,
    to_tsquery('english', 'python & async') query
WHERE 
    ts_content @@ query
ORDER BY rank DESC
LIMIT 10;
```

```python
# PostgreSQL FTS from Python
import psycopg2
import anthropic

client = anthropic.Anthropic()

def postgres_fts_rag(
    question: str,
    conn_string: str,
    k: int = 5,
) -> str:
    """RAG using PostgreSQL full-text search."""
    conn = psycopg2.connect(conn_string)
    cur = conn.cursor()

    # Convert natural language to tsquery
    # Simple: split into words joined by &
    words = [w.strip("?.,!") for w in question.lower().split() if len(w) > 3]
    tsquery = " & ".join(words[:5])   # use first 5 meaningful words

    cur.execute("""
        SELECT content, ts_rank(ts_content, to_tsquery('english', %s)) AS rank
        FROM documents
        WHERE ts_content @@ to_tsquery('english', %s)
        ORDER BY rank DESC
        LIMIT %s
    """, (tsquery, tsquery, k))

    rows = cur.fetchall()
    conn.close()

    if not rows:
        return "No relevant documents found."

    context = "\n\n---\n\n".join(row[0] for row in rows)

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system="Answer using the provided context.",
        messages=[{
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion: {question}",
        }],
    )
    return response.content[0].text
```

---

## BM25 vs. Vector vs. SPLADE — Head to Head

```
  QUERY TYPE PERFORMANCE MATRIX
  ────────────────────────────────────────────────────────────────
  Query type                   BM25   Vector   SPLADE   Hybrid
  ────────────────────────────────────────────────────────────────
  Exact code: "CVE-2024-43573" *****  **       ****     *****
  Product codes / SKUs         *****  **       ****     *****
  Named entities (companies)   ****   ***      ****     *****
  Technical jargon             ****   ***      *****    *****
  Semantic similarity          **     *****    ****     *****
  Cross-language               *      *****    ***      ****
  Short queries (2-3 words)    ****   ***      ****     *****
  Long conversational queries  **     *****    ****     *****
  Negation ("not affected")    ***    **       ***      ***
  Numbers / dates              *****  **       ***      *****
  ────────────────────────────────────────────────────────────────
  * = poor  *** = adequate  ***** = excellent
```

**Recommendation:** Start with hybrid BM25 + vector. Add SPLADE++ if you need semantic expansion without the cost of dense retrieval at scale. Consider BM25S over rank-bm25 for any corpus above 50,000 documents.

---

## See Also

- [Vectorless RAG Hub](../pageindex-vectorless-rag) — all vectorless approaches overview
- [Contextual Retrieval](../contextual-retrieval) — adding context to chunks, BM25 + contextual hybrid
- [Retrieval Strategies](../retrieval-strategies) — dense, hybrid, HyDE, reranking
- [GraphRAG](../graph-rag) — entity graph retrieval
