---
title: Embedding Models
description: Complete May 2026 guide to embedding models for RAG — Qwen3, Gemini Embedding 2, NV-Embed-v2, Voyage AI, BGE-M3, Nomic Embed, jina-embeddings-v3, Cohere Embed v3, OpenAI text-embedding-3 — MTEB benchmarks, dimensions, cost, and code examples with Anthropic SDK and LangChain.
sidebar:
  order: 5
---

> **Benchmarks current as of May 2026.** MTEB scores evolve rapidly — always verify at [huggingface.co/spaces/mteb/leaderboard](https://huggingface.co/spaces/mteb/leaderboard) before choosing a model for production.
>
> **Key shift (2025–2026):** Open-source models now lead MTEB benchmarks outright. The top five models by raw score are all open-weight or very cheap — commercial APIs are no longer the quality leaders.

## What Embedding Models Do

An embedding model converts text into a fixed-size dense vector (float32 array) such that semantically similar texts have high cosine similarity. In RAG:

1. **Offline (indexing):** each document chunk is embedded and stored in a vector index
2. **Online (query):** the user query is embedded with the same model; nearest neighbors in the index are retrieved

The embedding model is the **most consequential choice** in a RAG pipeline — it determines retrieval quality, latency, and cost more than any other component.

```
  TEXT → Embedding Model → [0.23, -0.11, 0.87, 0.04, ...]
                              ↑ dense vector (384–4096 dims)

  Two semantically similar texts → high cosine similarity (→ 1.0)
  Two unrelated texts            → low cosine similarity (→ 0.0)

  Cosine similarity = (A · B) / (‖A‖ × ‖B‖)
```

```
  EMBEDDING MODEL ROLE IN A RAG PIPELINE
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  INDEXING (offline)                                         │
  │                                                              │
  │  Document chunks                                            │
  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
  │  │ chunk 1  │  │ chunk 2  │  │ chunk 3  │  ...            │
  │  └────┬─────┘  └────┬─────┘  └────┬─────┘                 │
  │       │              │              │                        │
  │       └──────────────┴──────────────┘                       │
  │                       │                                      │
  │               Embedding Model                               │
  │                       │                                      │
  │       ┌───────────────┼───────────────┐                     │
  │       ▼               ▼               ▼                     │
  │   [vec_1]         [vec_2]         [vec_3]   → Vector Index  │
  │                                                              │
  │  RETRIEVAL (online)                                         │
  │                                                              │
  │  User query → Embedding Model → [vec_q]                    │
  │                                      │                      │
  │                                      ▼                      │
  │                              ANN search in index           │
  │                                      │                      │
  │                              Top-k chunks returned         │
  └──────────────────────────────────────────────────────────────┘
```

---

## The MTEB Benchmark

**MTEB** (Massive Text Embedding Benchmark, Muennighoff et al., 2022) is the standard benchmark — 56 tasks across 8 categories: retrieval, clustering, classification, reranking, STS, and more.

**MTEB v2** (2025) extended the benchmark with 10 new tasks and refreshed datasets to reduce contamination. Scores on MTEB v2 are not directly comparable to old MTEB scores.

Scores in the comparison table below are **MTEB Retrieval (NDCG@10)** unless noted as MTEB v2. BEIR covers 18 heterogeneous retrieval datasets (MS-MARCO, TREC-COVID, NQ, HotpotQA, FiQA, ArguAna, etc.).

---

## Updated MTEB v2 Leaderboard (May 2026)

The table below shows the top 10 models ranked by MTEB v2 Retrieval NDCG@10 as of May 2026. This reflects the post-contamination-corrected v2 benchmark.

| Rank | Model | MTEB v2 Retrieval NDCG@10 | Dims | Max Tokens | License |
|---|---|---|---|---|---|
| 1 | Qwen3-Embedding-7B | 70.58 | 2048 | 32K | Apache 2.0 |
| 2 | voyage-3.5 | 68.34 | 1024 | 32K | Commercial |
| 3 | text-embedding-3-large | 64.59 | 3072 | 8191 | Commercial |
| 4 | Gemini text-embedding-004 | 62.31 | 768 | 2048 | Commercial |
| 5 | jina-embeddings-v3 | 61.82 | 1024 | 8192 | Commercial |
| 6 | BAAI/bge-large-en-v1.5 | 60.32 | 1024 | 512 | MIT |
| 7 | Nomic Embed v2 | 58.74 | 768 | 8192 | Apache 2.0 |
| 8 | BAAI/bge-m3 | 57.90 | 1024 | 8192 | MIT |
| 9 | Cohere embed-english-v3.0 | 55.94 | 1024 | 512 | Commercial |
| 10 | all-MiniLM-L6-v2 | 41.95 | 384 | 256 | Apache 2.0 |

---

## Small / Fast Models (< 100M parameters)

### all-MiniLM-L6-v2

**Provider:** Hugging Face / UKP Lab
**HF Hub:** `sentence-transformers/all-MiniLM-L6-v2`

| Property | Value |
|---|---|
| Parameters | 22M |
| Dimensions | 384 |
| Max tokens | 256 |
| MTEB Retrieval | 41.9 |
| License | Apache 2.0 |

Distilled from a larger teacher model, fine-tuned on 1B+ sentence pairs. Max 256 tokens — longer text is silently truncated.

**Best for:** Prototyping, edge deployment, high-throughput pipelines where 384 dims suffices.

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")
embeddings = model.encode(
    ["How does RAG work?", "RAG retrieves relevant documents before generation."],
    batch_size=64,
    normalize_embeddings=True,
)
# embeddings.shape = (2, 384)
```

### BGE-small-en-v1.5

**Provider:** BAAI
**HF Hub:** `BAAI/bge-small-en-v1.5`

| Property | Value |
|---|---|
| Parameters | 33M |
| Dimensions | 384 |
| Max tokens | 512 |
| MTEB Retrieval | 51.7 |
| License | MIT |

Consistently outperforms all-MiniLM on BEIR retrieval despite similar size. Trained specifically for retrieval via RetroMAE + contrastive learning.

---

## Medium Models (100–500M parameters)

### BGE-large-en-v1.5

**HF Hub:** `BAAI/bge-large-en-v1.5`

| Property | Value |
|---|---|
| Parameters | 335M |
| Dimensions | 1024 |
| Max tokens | 512 |
| MTEB Retrieval | 55.4 |
| License | MIT |

**The go-to production model for English RAG** when self-hosting. Recommended over all-MiniLM in any quality-sensitive context.

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("BAAI/bge-large-en-v1.5")

query = "Represent this sentence for searching relevant passages: What is quantum entanglement?"
passage = "Quantum entanglement is a phenomenon where two particles become correlated..."

q_emb = model.encode(query,   normalize_embeddings=True)
d_emb = model.encode(passage, normalize_embeddings=True)
similarity = float((q_emb * d_emb).sum())
print(f"Cosine similarity: {similarity:.4f}")
```

### BGE-M3 — Multi-Lingual, Multi-Functionality, Multi-Granularity

**Paper:** Chen et al., "BGE M3-Embedding: Multi-Lingual, Multi-Functionality, Multi-Granularity Text Embeddings Through Self-Knowledge Distillation" (2024)
**HF Hub:** `BAAI/bge-m3`

| Property | Value |
|---|---|
| Parameters | 568M |
| Dimensions | 1024 |
| Max tokens | **8192** |
| MTEB Retrieval | 54.9 (English avg) |
| Languages | 100+ |
| License | MIT |

BGE-M3 is architecturally unique: it produces **three distinct representation types from a single forward pass**, enabling dense, sparse, and multi-vector retrieval to be combined without maintaining separate models.

```
  BGE-M3 — THREE RETRIEVAL MODES FROM ONE MODEL
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Input text                                                 │
  │       │                                                      │
  │       ▼                                                      │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │             BGE-M3 encoder (XLM-RoBERTa base)       │   │
  │  └───────────────────────────┬─────────────────────────┘   │
  │                              │                               │
  │         ┌────────────────────┼────────────────────┐        │
  │         │                    │                    │         │
  │         ▼                    ▼                    ▼         │
  │  ┌─────────────┐   ┌──────────────────┐   ┌───────────┐   │
  │  │   Dense      │   │     Sparse       │   │  ColBERT  │   │
  │  │   vector     │   │  (lexical wts)   │   │  per-tok  │   │
  │  │  1024 dims   │   │  vocab-sized     │   │  vectors  │   │
  │  │  CLS pooled  │   │  {tok: weight}   │   │ 1024d×N   │   │
  │  └──────┬───────┘   └────────┬─────────┘   └─────┬─────┘  │
  │         │                    │                    │         │
  │         ▼                    ▼                    ▼         │
  │    Cosine sim           BM25-style           Late inter-    │
  │    (ANN search)         exact match          action score   │
  │         │                    │                    │         │
  │         └────────────────────┴────────────────────┘        │
  │                              │                               │
  │                     Hybrid retrieval score                  │
  └──────────────────────────────────────────────────────────────┘
```

- **Multi-lingual:** 100+ languages in a single model
- **Multi-functionality:** dense retrieval + sparse retrieval (BM25-style) + ColBERT-style multi-vector — all from one model
- **Multi-granularity:** handles sentences to 8192-token documents

```python
from FlagEmbedding import BGEM3FlagModel

model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)

# Mode 1: Dense embeddings (standard cosine similarity search)
dense_output = model.encode(
    ["What is BERT?", "BERT is a transformer model by Google."],
    batch_size=12,
    max_length=8192,
    return_dense=True,
    return_sparse=False,
    return_colbert_vecs=False,
)
dense_vecs = dense_output["dense_vecs"]  # shape: (2, 1024)

# Mode 2: Sparse (BM25-style lexical weights from a neural model)
sparse_output = model.encode(
    ["Python async programming tutorial"],
    return_dense=True,
    return_sparse=True,
)
sparse_weights = sparse_output["lexical_weights"]  # {"python": 0.82, "async": 0.71, ...}

# Mode 3: ColBERT multi-vector (late interaction — most accurate, highest cost)
colbert_output = model.encode(
    ["How does attention mechanism work in transformers?"],
    return_dense=False,
    return_sparse=False,
    return_colbert_vecs=True,
)
colbert_vecs = colbert_output["colbert_vecs"]  # list of (num_tokens, 1024) arrays

# Hybrid retrieval: combine dense + sparse scores
from FlagEmbedding import BGEM3FlagModel

def hybrid_score(query_dense, doc_dense, query_sparse, doc_sparse, alpha=0.5):
    import numpy as np
    dense_sim = float(np.dot(query_dense, doc_dense))
    shared_tokens = set(query_sparse.keys()) & set(doc_sparse.keys())
    sparse_sim = sum(query_sparse[t] * doc_sparse[t] for t in shared_tokens)
    return alpha * dense_sim + (1 - alpha) * sparse_sim
```

### E5-large-v2

**Provider:** Microsoft Research
**HF Hub:** `intfloat/e5-large-v2`

| Property | Value |
|---|---|
| Parameters | 335M |
| Dimensions | 1024 |
| Max tokens | 512 |
| MTEB Retrieval | 55.3 |
| License | MIT |

**Key requirement:** always prepend `"query: "` to queries and `"passage: "` to documents:

```python
model = SentenceTransformer("intfloat/e5-large-v2")
query    = "query: What causes climate change?"
passages = ["passage: Climate change is primarily caused by greenhouse gas emissions."]
```

### Nomic Embed v1.5

**Provider:** Nomic AI
**HF Hub:** `nomic-ai/nomic-embed-text-v1.5`

| Property | Value |
|---|---|
| Parameters | 137M |
| Dimensions | 768 (reducible via Matryoshka to 64–512) |
| Max tokens | **8192** |
| MTEB Retrieval | 53.8 |
| License | Apache 2.0 |

Nomic Embed v1.5 is fully open-source (even training code and data). Notable for:
- **8192-token context** at 137M parameters — efficient for long documents
- **Matryoshka embeddings** — truncate to any dimension without reembedding
- **Fully auditable** — only open-source model with published training data

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("nomic-ai/nomic-embed-text-v1.5", trust_remote_code=True)

query = "search_query: What is the boiling point of water?"
docs  = ["search_document: Water boils at 100 degrees Celsius at sea level."]

q_emb = model.encode(query,   normalize_embeddings=True)
d_emb = model.encode(docs,    normalize_embeddings=True)

q_emb_256 = q_emb[:256]
d_emb_256 = d_emb[:, :256]
```

### jina-embeddings-v3

**Provider:** Jina AI
**HF Hub:** `jinaai/jina-embeddings-v3`

| Property | Value |
|---|---|
| Parameters | 570M |
| Dimensions | 1024 (Matryoshka: 32–1024) |
| Max tokens | **8192** |
| MTEB Retrieval | 54.3 |
| Languages | 89 |
| License | CC BY-NC 4.0 (non-commercial) |

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("jinaai/jina-embeddings-v3", trust_remote_code=True)

query_embeddings = model.encode(
    ["What is the capital of France?"],
    task="retrieval.query",
    prompt_name="retrieval.query",
)
doc_embeddings = model.encode(
    ["Paris is the capital of France."],
    task="retrieval.passage",
    prompt_name="retrieval.passage",
)
```

---

## API-Based Models

### Voyage AI — voyage-3 and voyage-3-lite

**Provider:** Voyage AI (founded 2023, strong benchmark performance)
**API:** `voyageai` Python package

Voyage AI consistently ranks at the top of MTEB for API-based models. Their models are designed specifically for retrieval.

| Model | Dimensions | Max tokens | MTEB Retrieval | Pricing |
|---|---|---|---|---|
| `voyage-3` | 1024 | 32,000 | **70.3** | $0.06/1M tokens |
| `voyage-3-lite` | 512 | 32,000 | 67.1 | $0.02/1M tokens |
| `voyage-code-3` | 1024 | 32,000 | — (code-optimized) | $0.18/1M tokens |
| `voyage-finance-2` | 1024 | 32,000 | — (finance-optimized) | $0.12/1M tokens |
| `voyage-law-2` | 1024 | 32,000 | — (legal-optimized) | $0.12/1M tokens |

```python
import voyageai

vo = voyageai.Client()

query_result = vo.embed(
    ["What is RAG?"],
    model="voyage-3",
    input_type="query",
)
doc_result = vo.embed(
    ["RAG stands for Retrieval-Augmented Generation..."],
    model="voyage-3",
    input_type="document",
)

import numpy as np
q_emb = np.array(query_result.embeddings[0])
d_emb = np.array(doc_result.embeddings[0])
similarity = float(np.dot(q_emb, d_emb) / (np.linalg.norm(q_emb) * np.linalg.norm(d_emb)))
```

```python
from langchain_voyageai import VoyageAIEmbeddings

embeddings = VoyageAIEmbeddings(
    model="voyage-3",
    voyage_api_key="YOUR_KEY",
    batch_size=72,
    show_progress_bar=True,
)

from langchain_community.vectorstores import FAISS
vectorstore = FAISS.from_documents(docs, embeddings)
```

### Cohere Embed v3

**Provider:** Cohere
**Model IDs:** `embed-english-v3.0`, `embed-multilingual-v3.0`

| Property | Value |
|---|---|
| Dimensions | 1024 (Matryoshka: 256, 512) |
| Max tokens | 512 |
| MTEB Retrieval | 55.9 (English) |
| Languages | 100+ (multilingual variant) |
| Pricing | ~$0.10/1M tokens |

**Key feature:** Must specify `input_type` — `"search_query"` for queries, `"search_document"` for docs.

```python
import cohere

co = cohere.Client("YOUR_API_KEY")

query_embedding = co.embed(
    texts=["What is the refund policy?"],
    model="embed-english-v3.0",
    input_type="search_query",
).embeddings[0]

doc_embeddings = co.embed(
    texts=["Refunds are processed within 30 days from purchase date."],
    model="embed-english-v3.0",
    input_type="search_document",
).embeddings
```

### OpenAI text-embedding-3-small / large

| Model | Dimensions | Max tokens | MTEB Retrieval | Pricing |
|---|---|---|---|---|
| `text-embedding-3-small` | 1536 (reducible) | 8191 | 44.0 | $0.02/1M |
| `text-embedding-3-large` | 3072 (reducible) | 8191 | 54.9 | $0.13/1M |

```python
from openai import OpenAI

client = OpenAI()

def embed_openai(texts: list[str], model="text-embedding-3-large", dims=1024) -> list[list[float]]:
    response = client.embeddings.create(
        input=texts,
        model=model,
        dimensions=dims,
    )
    return [d.embedding for d in response.data]
```

### Google text-embedding-004

**Provider:** Google (Vertex AI / Gemini API)

| Property | Value |
|---|---|
| Dimensions | 768 (reducible to 1–768) |
| Max tokens | 2048 |
| MTEB Retrieval | 55.7 |
| Pricing | $0.025/1M chars (~$0.006/1M tokens) |

```python
from google.cloud import aiplatform
from vertexai.language_models import TextEmbeddingModel

model = TextEmbeddingModel.from_pretrained("text-embedding-004")

embeddings = model.get_embeddings(
    ["What is quantum entanglement?"],
    task_type="RETRIEVAL_QUERY",
    output_dimensionality=768,
)
```

### Google Gemini Embedding 001 (2025)

**Provider:** Google (Gemini API / Vertex AI)
**GA:** Mid-2025

| Property | Value |
|---|---|
| Dimensions | 3072 (Matryoshka) |
| Max tokens | 8192 |
| MTEB Multilingual | **68.32** (top commercial API, mid-2025) |
| MTEB Retrieval | 67.71 |
| Pricing | $0.00001/1K chars |

```python
import google.generativeai as genai

genai.configure(api_key="YOUR_API_KEY")

result = genai.embed_content(
    model="models/gemini-embedding-001",
    content="What is quantum entanglement?",
    task_type="RETRIEVAL_QUERY",
    output_dimensionality=1024,
)
embedding = result["embedding"]
```

### Google Gemini Embedding 2 — Multimodal (March 2026)

**Provider:** Google (Gemini API)
**Released:** March 2026 (Preview)

The first all-modality embedding model — embeds text, images, video, audio, and PDFs in a **shared embedding space**. Cross-modal retrieval is now native (e.g., query an image collection with a text query using the same model).

| Property | Value |
|---|---|
| Dimensions | 3072 (Matryoshka, native MRL) |
| Modalities | Text, image, video, audio, PDF |
| Languages | 100+ |
| Context | 8192 tokens / equivalent for other modalities |

```python
import google.generativeai as genai
import PIL.Image

genai.configure(api_key="YOUR_API_KEY")

text_result = genai.embed_content(
    model="models/gemini-embedding-2-preview",
    content="A photograph of a golden retriever",
    task_type="RETRIEVAL_QUERY",
)

image = PIL.Image.open("dog.jpg")
image_result = genai.embed_content(
    model="models/gemini-embedding-2-preview",
    content=image,
    task_type="RETRIEVAL_DOCUMENT",
)

import numpy as np
t_emb = np.array(text_result["embedding"])
i_emb = np.array(image_result["embedding"])
similarity = float(np.dot(t_emb, i_emb) / (np.linalg.norm(t_emb) * np.linalg.norm(i_emb)))
print(f"Text-to-image similarity: {similarity:.4f}")
```

---

## Large / Frontier Models (2025–2026)

These models represent a step-change in retrieval quality. They use large decoder LLMs or novel architectures as backbone, achieving MTEB scores that decisively exceed BERT-class models, at the cost of higher GPU memory and inference latency. As of May 2026, open-source models in this tier outperform all commercial APIs on retrieval benchmarks.

```
  FRONTIER EMBEDDING MODEL ARCHITECTURE
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Input text + optional instruction prefix                   │
  │       │                                                      │
  │       ▼                                                      │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │  Large LLM backbone (7B–27B params)                 │   │
  │  │  (Qwen3, Llama, Mistral, Qwen MoE)                 │   │
  │  │                                                     │   │
  │  │  Causal attention over full sequence               │   │
  │  │  Last token pooling (or EOS token representation)  │   │
  │  └─────────────────────┬───────────────────────────────┘   │
  │                         │                                    │
  │                         ▼                                    │
  │             Linear projection head                          │
  │                         │                                    │
  │                         ▼                                    │
  │              Fixed-dim embedding vector                     │
  │              (often with Matryoshka training)               │
  └──────────────────────────────────────────────────────────────┘
```

### Qwen3-Embedding (Alibaba, May 2025)

**HF Hub:** `Qwen/Qwen3-Embedding` (7B), `Qwen/Qwen3-Embedding-1.5B`, `Qwen/Qwen3-Embedding-0.6B`

Qwen3-Embedding is the highest-performing open-source embedding model family as of May 2026, available in three sizes to trade off quality against resource constraints.

| Size | MTEB v2 Retrieval NDCG@10 | Dimensions | Max Tokens | GPU VRAM (est.) |
|---|---|---|---|---|
| 0.6B | 64.2 | 1024 | 32K | ~2 GB |
| 1.5B | 67.1 | 1536 | 32K | ~4 GB |
| 7B | **70.58** | 2048 | 32K | ~16 GB (fp16) |

**Key features:**
- **Instruction-tuned:** accepts a task description prefix that steers the model toward the query or document role — asymmetric by design
- **Matryoshka Representation Learning:** embeddings trained at 256, 512, 1024, and 2048 dims; any prefix length gives a valid embedding without retraining
- **32K token context:** handles long documents, entire code files, or multi-page contracts without chunking artifacts
- **License:** Apache 2.0 — fully commercial use allowed

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("Qwen/Qwen3-Embedding", trust_remote_code=True)
model.max_seq_length = 32768

RETRIEVAL_INSTRUCTION = (
    "Given a web search query, retrieve relevant passages that answer the query"
)

def embed_queries(queries: list[str]) -> list:
    prefixed = [
        f"Instruct: {RETRIEVAL_INSTRUCTION}\nQuery: {q}"
        for q in queries
    ]
    return model.encode(
        prefixed,
        normalize_embeddings=True,
        batch_size=4,
    )

def embed_documents(documents: list[str]) -> list:
    return model.encode(
        documents,
        normalize_embeddings=True,
        batch_size=4,
    )

queries = ["What is the capital of Germany?"]
documents = ["Berlin is the capital and largest city of Germany."]

q_embs = embed_queries(queries)
d_embs = embed_documents(documents)

import numpy as np
sim = float(np.dot(q_embs[0], d_embs[0]))
print(f"Similarity: {sim:.4f}")

# Matryoshka: truncate to 256 dims for storage savings (8x reduction vs 2048)
q_256 = q_embs[0][:256]
q_256 = q_256 / np.linalg.norm(q_256)
```

### BGE-M3 (BAAI, 2024)

See the full entry under **Medium Models** above. Key summary for this section:

**HF Hub:** `BAAI/bge-m3`

BGE-M3's distinguishing characteristic is that it produces **three types of representations from a single model pass** — dense vectors for cosine similarity, sparse vectors for BM25-style lexical matching, and ColBERT multi-vectors for late interaction scoring. No other open-source model combines all three modes.

| Representation | Dimensions | Use case |
|---|---|---|
| Dense vector | 1024 | Standard cosine/ANN search |
| Sparse vector | Vocabulary-sized | Exact term matching, hybrid search |
| ColBERT multi-vector | 1024 per token | Late interaction, highest accuracy |

The three modes can be combined for hybrid retrieval (dense + sparse) or re-ranking (ColBERT on top-k dense results).

```python
from FlagEmbedding import BGEM3FlagModel

model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)

# All three representations in one call
output = model.encode(
    ["Dense, sparse, and multi-vector from a single encoder"],
    return_dense=True,
    return_sparse=True,
    return_colbert_vecs=True,
)

dense = output["dense_vecs"]          # (1, 1024)
sparse = output["lexical_weights"]    # [{"dense": 0.71, "sparse": 0.68, ...}]
colbert = output["colbert_vecs"]      # [(num_tokens, 1024)]
```

### Nomic Embed Text v2 (Nomic AI, 2025)

**HF Hub:** `nomic-ai/nomic-embed-text-v2-moe`

Nomic Embed v2 introduces a Mixture-of-Experts (MoE) architecture — a significant departure from dense transformer encoders. The model has 475M total parameters but activates only 137M during each forward pass, giving the inference cost of a 137M model with the capacity of a 475M model.

| Property | Value |
|---|---|
| Architecture | Mixture-of-Experts (8 experts, 2 active) |
| Total parameters | 475M |
| Active parameters per forward pass | 137M |
| Dimensions | 768 |
| Max tokens | 8192 |
| MTEB Retrieval | 58.7 |
| License | Apache 2.0 |

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("nomic-ai/nomic-embed-text-v2-moe", trust_remote_code=True)

query = "search_query: What are the main causes of inflation?"
docs = [
    "search_document: Inflation is primarily caused by excess money supply relative to goods.",
    "search_document: Supply chain disruptions can trigger cost-push inflation.",
]

q_emb = model.encode(query, normalize_embeddings=True)
d_embs = model.encode(docs, normalize_embeddings=True)

import numpy as np
similarities = np.dot(d_embs, q_emb)
print(f"Doc 1 similarity: {similarities[0]:.4f}")
print(f"Doc 2 similarity: {similarities[1]:.4f}")
```

### Google Gemini Embedding (text-embedding-004, 2025)

**Provider:** Google (Gemini API / Vertex AI)

The `text-embedding-004` model is Google's production embedding model for standard RAG workloads, distinct from the Gemini Embedding multimodal models. It is optimized for text retrieval and supports task-type specialization.

| Property | Value |
|---|---|
| Dimensions | 768 |
| Max tokens | 2048 |
| MTEB Retrieval | 62.3 |
| Task types | RETRIEVAL_DOCUMENT, RETRIEVAL_QUERY, SEMANTIC_SIMILARITY |
| Pricing | $0.025/1M chars |

The `task_type` parameter matters: the model applies different learned transformations depending on whether the input is a query or a document. Always specify the correct task type.

```python
import google.generativeai as genai

genai.configure(api_key="YOUR_API_KEY")

def embed_query(text: str) -> list[float]:
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="RETRIEVAL_QUERY",
    )
    return result["embedding"]

def embed_document(text: str) -> list[float]:
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="RETRIEVAL_DOCUMENT",
    )
    return result["embedding"]

def embed_for_similarity(text: str) -> list[float]:
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type="SEMANTIC_SIMILARITY",
    )
    return result["embedding"]

import numpy as np

q_emb = embed_query("What is retrieval-augmented generation?")
d_emb = embed_document("Retrieval-Augmented Generation (RAG) combines a retrieval system with a language model.")

similarity = float(np.dot(q_emb, d_emb) / (np.linalg.norm(q_emb) * np.linalg.norm(d_emb)))
print(f"Cosine similarity: {similarity:.4f}")
```

---

## Large LLM-based Models (SOTA as of May 2026)

These use decoder LLMs as backbone, achieving top MTEB scores at the cost of higher latency and GPU memory. Open-source models now lead the leaderboard outright.

| Model | Backbone | Dims | MTEB Score | License | Notes |
|---|---|---|---|---|---|
| `Qwen/Qwen3-Embedding-8B` | Qwen3 8B | 7168 (Matryoshka) | **70.58** (multilingual) | Apache 2.0 | #1 multilingual (2025), 32k ctx, 100+ langs |
| `microsoft/Harrier-OSS-v1-27B` | — | — | **74.3** (MTEB v2) | MIT | Highest MTEB v2 (27B); 8B variant: 71.5 |
| `nvidia/Llama-Embed-Nemotron-8B` | Llama 8B | 4096 | 72.31 (English avg) | CC-BY-4.0 | NVIDIA, leads English MTEB |
| `nvidia/NV-Embed-v2` | Mistral 7B | 4096 | 62.7 | CC-BY-4.0 | MTEB #1 open-source (2024) |
| `dunzhang/stella_en_1.5B_v5` | Qwen 1.5B | 8192 | 65.0 | MIT | Best efficiency:quality ratio |
| `intfloat/e5-mistral-7b-instruct` | Mistral 7B | 4096 | 56.9 | MIT | Instruction-tuned |

### Qwen3-Embedding-8B (2025 Multilingual Leader)

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("Qwen/Qwen3-Embedding-8B", trust_remote_code=True)
model.max_seq_length = 32768

task_instruct = "Given a web search query, retrieve relevant passages that answer the query"

def embed_qwen3(queries: list[str], is_query: bool = True) -> list:
    if is_query:
        prefixed = [f"Instruct: {task_instruct}\nQuery: {q}" for q in queries]
    else:
        prefixed = queries
    return model.encode(
        prefixed,
        normalize_embeddings=True,
        batch_size=2,
    )

def embed_qwen3_reduced(queries: list[str], dims: int = 1024) -> list:
    import numpy as np
    full = embed_qwen3(queries)
    return [v[:dims] / np.linalg.norm(v[:dims]) for v in full]
```

### Microsoft Harrier-OSS-v1 (MTEB v2 Leader)

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("microsoft/Harrier-OSS-v1-8B", trust_remote_code=True)

embeddings = model.encode(
    ["What is retrieval-augmented generation?"],
    normalize_embeddings=True,
    batch_size=4,
)
```

### NV-Embed-v2 / Llama-Embed-Nemotron-8B (NVIDIA)

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("nvidia/NV-Embed-v2", trust_remote_code=True)
model.max_seq_length = 4096
model.tokenizer.padding_side = "right"

task_instruct = "Given a question, retrieve passages that answer the question"

def embed_with_instruct(queries: list[str]) -> list:
    return model.encode(
        queries,
        instruction=task_instruct,
        normalize_embeddings=True,
        batch_size=4,
    )
```

---

## Instruction-Tuned Embeddings

Many recent embedding models are **instruction-tuned**: they accept a short task description (an "instruction prefix") that tells the model how to interpret the input text. This allows a single model to handle diverse retrieval tasks — keyword search, semantic similarity, question answering, deduplication — without task-specific fine-tuning.

```
  INSTRUCTION-TUNED EMBEDDING — ASYMMETRIC RETRIEVAL
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  QUERY SIDE:                                                │
  │  "Instruct: Given a question, retrieve passages that        │
  │   answer the question\nQuery: What causes inflation?"       │
  │                                │                             │
  │                                ▼                             │
  │                         Embedding Model                     │
  │                                │                             │
  │                                ▼                             │
  │                          [query vector]                     │
  │                                                              │
  │  DOCUMENT SIDE:                                             │
  │  "Inflation is caused by..."   ← no instruction prefix     │
  │                                │                             │
  │                                ▼                             │
  │                         Embedding Model                     │
  │                                │                             │
  │                                ▼                             │
  │                        [document vector]                    │
  │                                                              │
  │  The model applies different internal transformations based  │
  │  on the presence and content of the instruction prefix.     │
  │  Queries and documents are NOT encoded symmetrically.       │
  │                                                              │
  │  Without instruction prefix:  cosine sim ≈ 0.71            │
  │  With correct instruction:    cosine sim ≈ 0.89            │
  └──────────────────────────────────────────────────────────────┘
```

### Why Instruction Prefixes Improve Retrieval

Embedding models must map all text — whether questions, answers, code, or documents — into the same vector space. Without a signal about intent, a question like "What is the capital of Germany?" and the answer "Berlin is the capital of Germany" may not overlap optimally, because their surface forms differ substantially.

An instruction prefix shifts the representation toward the intended retrieval task. During training, the model sees thousands of examples of (instruction + query, document) pairs and learns to align representations in task-appropriate ways. At inference, the prefix acts as a soft contextual signal.

### Standard Prefixes by Model Family

| Model family | Query prefix | Document prefix |
|---|---|---|
| Qwen3-Embedding | `Instruct: {task}\nQuery: {text}` | None (raw text) |
| E5 / E5-Mistral | `query: {text}` | `passage: {text}` |
| GTE / GTE-Qwen | `Instruct: {task}\nQuery: {text}` | None |
| NV-Embed-v2 | `{task}` (passed as `instruction=` arg) | None |
| Nomic Embed v1.5 | `search_query: {text}` | `search_document: {text}` |
| BGE-large-en-v1.5 | `Represent this sentence for searching relevant passages: {text}` | None |

### With vs Without Instructions — Cosine Similarity Comparison

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("Qwen/Qwen3-Embedding", trust_remote_code=True)

query_text = "What is retrieval-augmented generation?"
document_text = "RAG combines a retrieval system with a generative language model to produce grounded answers."
task_instruction = "Given a web search query, retrieve relevant passages that answer the query"

# Without instruction prefix (raw symmetric encoding)
q_raw = model.encode(query_text, normalize_embeddings=True)
d_raw = model.encode(document_text, normalize_embeddings=True)
sim_raw = float(np.dot(q_raw, d_raw))

# With asymmetric instruction prefix
q_instruct = model.encode(
    f"Instruct: {task_instruction}\nQuery: {query_text}",
    normalize_embeddings=True,
)
d_plain = model.encode(document_text, normalize_embeddings=True)
sim_instruct = float(np.dot(q_instruct, d_plain))

print(f"Without instruction: {sim_raw:.4f}")
print(f"With instruction:    {sim_instruct:.4f}")
print(f"Improvement:         +{sim_instruct - sim_raw:.4f}")
```

Typical results on retrieval-oriented pairs:
```
Without instruction: 0.7134
With instruction:    0.8891
Improvement:         +0.1757
```

---

## Matryoshka Representation Learning (MRL)

Matryoshka Representation Learning (Kusupati et al., 2022) is a training technique that teaches a model to produce useful embeddings at **any prefix length** of the full output vector. The name comes from Russian nesting dolls: the first 256 dimensions of a 2048-dim Matryoshka embedding are themselves a valid 256-dim embedding.

```
  MATRYOSHKA REPRESENTATION LEARNING — NESTED EMBEDDINGS
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Full embedding (2048 dims):                                │
  │  [d0, d1, ..., d255 | d256, ..., d511 | ... | d1792..d2047]│
  │   └──────────────┘   └──────────────┘         └──────────┘ │
  │        256-dim             512-dim               2048-dim   │
  │        valid               valid                 valid      │
  │        embedding           embedding             embedding  │
  │                                                              │
  │  All prefix lengths trained simultaneously with joint loss  │
  │  During training:                                           │
  │    loss = L(full) + L(first 1024) + L(first 512) + L(256)  │
  │                                                              │
  │  MEMORY SAVINGS:                                            │
  │  2048 dims × 4 bytes = 8192 bytes per vector               │
  │   256 dims × 4 bytes = 1024 bytes per vector  (8x savings) │
  │                                                              │
  │  For 10M vectors:                                           │
  │    Full 2048 dims: 80 GB                                    │
  │     Trunc  256 dims:  10 GB  ← same model, no retraining   │
  └──────────────────────────────────────────────────────────────┘
```

### Quality Trade-off at Different Dimensions

The quality reduction from truncation is surprisingly small for Matryoshka-trained models. The model is explicitly trained to front-load the most retrieval-relevant information into early dimensions.

| Dimensions | MTEB Retrieval (Qwen3-7B) | Storage per vector | Relative quality |
|---|---|---|---|
| 2048 | 70.58 | 8192 bytes | 100% (baseline) |
| 1024 | 69.41 | 4096 bytes | 98.3% |
| 512 | 67.89 | 2048 bytes | 96.2% |
| 256 | 65.12 | 1024 bytes | 92.3% |
| 128 | 60.34 | 512 bytes | 85.5% |

For most production RAG systems, **512 dims** gives an excellent quality-to-storage trade-off.

### Models Supporting MRL

| Model | Full dims | Minimum dims | License |
|---|---|---|---|
| OpenAI text-embedding-3-large | 3072 | 256 | Commercial |
| OpenAI text-embedding-3-small | 1536 | 256 | Commercial |
| Qwen3-Embedding-7B | 2048 | 256 | Apache 2.0 |
| jina-embeddings-v3 | 1024 | 32 | CC BY-NC |
| Nomic Embed v1.5 | 768 | 64 | Apache 2.0 |
| Google Gemini Embedding 001 | 3072 | 1 | Commercial |
| Google Gemini Embedding 2 | 3072 | — | Commercial |

### Using Shorter Dimensions in Practice

```python
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("Qwen/Qwen3-Embedding", trust_remote_code=True)

texts = [
    "Matryoshka embeddings allow truncation without retraining.",
    "Dense vectors can be stored at reduced precision for memory savings.",
]

full_embeddings = model.encode(texts, normalize_embeddings=True)
print(f"Full embedding shape: {full_embeddings.shape}")  # (2, 2048)

def truncate_and_normalize(embeddings: np.ndarray, target_dims: int) -> np.ndarray:
    truncated = embeddings[:, :target_dims]
    norms = np.linalg.norm(truncated, axis=1, keepdims=True)
    return truncated / norms

emb_512 = truncate_and_normalize(full_embeddings, 512)
emb_256 = truncate_and_normalize(full_embeddings, 256)

print(f"512-dim shape: {emb_512.shape}")
print(f"256-dim shape: {emb_256.shape}")

# OpenAI API: pass dimensions= parameter directly
from openai import OpenAI
client = OpenAI()

response = client.embeddings.create(
    input=texts,
    model="text-embedding-3-large",
    dimensions=512,
)
openai_512 = [d.embedding for d in response.data]
```

---

## LangChain Integration Pattern

All models above can be wrapped in a consistent LangChain interface:

```python
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_cohere import CohereEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain_voyageai import VoyageAIEmbeddings
from langchain_community.vectorstores import FAISS

embedding_configs = {
    "bge_large":    HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5"),
    "bge_m3":       HuggingFaceEmbeddings(model_name="BAAI/bge-m3"),
    "nomic_v2":     HuggingFaceEmbeddings(model_name="nomic-ai/nomic-embed-text-v2-moe", model_kwargs={"trust_remote_code": True}),
    "nomic":        HuggingFaceEmbeddings(model_name="nomic-ai/nomic-embed-text-v1.5", model_kwargs={"trust_remote_code": True}),
    "voyage_3":     VoyageAIEmbeddings(model="voyage-3"),
    "cohere_v3":    CohereEmbeddings(model="embed-english-v3.0"),
    "openai_large": OpenAIEmbeddings(model="text-embedding-3-large"),
}

embeddings = embedding_configs["voyage_3"]
vectorstore = FAISS.from_documents(docs, embeddings)
```

---

## Batching for Production

```python
from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("BAAI/bge-large-en-v1.5")

def embed_corpus(texts: list[str], batch_size: int = 64) -> np.ndarray:
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        normalize_embeddings=True,
        convert_to_numpy=True,
    )
    return embeddings.astype("float32")

all_embeddings = embed_corpus(all_chunks, batch_size=128)
np.save("corpus_embeddings.npy", all_embeddings)
```

---

## Complete Model Comparison (May 2026)

| Model | Dims | Max tokens | MTEB Score | Params | Cost | Self-host |
|---|---|---|---|---|---|---|
| all-MiniLM-L6-v2 | 384 | 256 | 41.9 | 22M | Free | Yes |
| BGE-small-en-v1.5 | 384 | 512 | 51.7 | 33M | Free | Yes |
| BGE-large-en-v1.5 | 1024 | 512 | 55.4 | 335M | Free | Yes |
| **BGE-M3** | 1024 | **8192** | 54.9 | 568M | Free | Yes |
| E5-large-v2 | 1024 | 512 | 55.3 | 335M | Free | Yes |
| **Nomic Embed v1.5** | 768 | **8192** | 53.8 | 137M | Free | Yes |
| **Nomic Embed v2 (MoE)** | 768 | **8192** | 58.7 | 475M (137M active) | Free | Yes |
| **jina-embeddings-v3** | 1024 | **8192** | 54.3 | 570M | Free* | Yes |
| **jina-v5-text-small** | 1024 | 8192 | **71.7** (MTEB v2) | 677M | Free | Yes |
| Cohere embed-v3 | 1024 | 512 | 55.9 | API | $0.10/1M | No |
| OpenAI embed-3-small | 1536 | 8191 | 44.0 | API | $0.02/1M | No |
| OpenAI embed-3-large | 3072 | 8191 | 54.9 | API | $0.13/1M | No |
| Google text-emb-004 | 768 | 2048 | 62.3 | API | $0.006/1M | No |
| **Google Gemini Emb-001** | 3072 | 8192 | **68.32** (multilingual) | API | $0.01/1M | No |
| **Google Gemini Emb-2** | 3072 | 8192 | — (multimodal) | API | TBD (preview) | No |
| **Voyage-3** | 1024 | **32,000** | 70.3 | API | $0.06/1M | No |
| **Voyage-3-lite** | 512 | **32,000** | 67.1 | API | $0.02/1M | No |
| NV-Embed-v2 | 4096 | 4096 | 62.7 | 7B | Free | Yes (GPU) |
| stella_en_1.5B_v5 | 8192 | 512 | 65.0 | 1.5B | Free | Yes (GPU) |
| **Llama-Embed-Nemotron-8B** | 4096 | 4096 | **72.31** (English avg) | 8B | Free | Yes (GPU) |
| **Qwen3-Embedding-0.6B** | 1024 | **32K** | 64.2 | 0.6B | Free | Yes (GPU) |
| **Qwen3-Embedding-1.5B** | 1536 | **32K** | 67.1 | 1.5B | Free | Yes (GPU) |
| **Qwen3-Embedding-7B** | 2048 | **32K** | **70.58** | 7B | Free | Yes (GPU) |
| **Harrier-OSS-v1-8B** | — | — | **71.5** (MTEB v2) | 8B | Free | Yes (GPU) |
| **Harrier-OSS-v1-27B** | — | — | **74.3** (MTEB v2) | 27B | Free | Yes (GPU) |

*jina-embeddings-v3 is free for self-host but CC BY-NC (non-commercial via API)

---

## Embedding Model Selection Decision Tree

```
  EMBEDDING MODEL SELECTION — MAY 2026
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  What is your primary constraint?                           │
  │                                                              │
  │  ┌──────────┬──────────────┬───────────────────────┐       │
  │  │  Speed / │  Managed     │  Max retrieval         │       │
  │  │  Cost    │  API (no     │  quality, have GPU     │       │
  │  │          │  infra)      │                         │       │
  │  └────┬─────┴──────┬───────┴──────────┬────────────┘       │
  │       │            │                  │                      │
  │       ▼            │                  ▼                      │
  │  Prototype?        │          GPU available?                │
  │       │            │                  │                      │
  │  Yes  │  No        │           Yes   │  No                   │
  │       │   │        │                 │   │                   │
  │       ▼   ▼        │                 ▼   ▼                   │
  │  MiniLM  BGE-large │         MTEB v2 top?  Self-host        │
  │  L6-v2   en-v1.5   │                 │    no GPU            │
  │          (512 tok, │           Yes   │  No    │              │
  │          free)     │                 │   │    ▼              │
  │                    │                 ▼   ▼  BGE-large        │
  │                    │         Harrier  Qwen3  en-v1.5 or      │
  │                    │         27B      7B     Nomic v1.5       │
  │                    │         (MTEB   (70.58) (8192 tok)       │
  │                    │          74.3)                          │
  │                    │                                          │
  │                    ▼                                          │
  │             Need multilingual?                               │
  │                    │                                          │
  │              Yes   │   No                                    │
  │                    │    │                                     │
  │                    ▼    ▼                                    │
  │             Qwen3-7B  Voyage-3        Domain-specific?      │
  │             (Apache,  ($0.06/1M,     │                       │
  │             100+      32K tok)       │                       │
  │             langs)         │    Yes  │  No                   │
  │                            │         │   │                   │
  │                       Budget?        ▼   ▼                   │
  │                            │   voyage-   Voyage-3 or        │
  │                       Low  │  finance-2  Gemini Emb-001     │
  │                            │  voyage-                       │
  │                            ▼  law-2                         │
  │                     Voyage-3-lite                           │
  │                     ($0.02/1M,                              │
  │                     MTEB 67.1)                              │
  │                                                              │
  │  Multimodal (text + images + video)?                        │
  │       → Google Gemini Embedding 2 (March 2026 preview)     │
  │                                                              │
  │  Long documents (>512 tokens per chunk)?                    │
  │       → Qwen3-Embedding (32K), BGE-M3 (8192), Voyage-3     │
  │                                                              │
  │  Need dense + sparse + ColBERT from one model?              │
  │       → BGE-M3 (only model with all three)                 │
  │                                                              │
  │  Storage constrained, need 8x compression?                  │
  │       → Qwen3-Embedding at 256 dims (Matryoshka)           │
  │         or Nomic Embed v1.5 (MRL to 64 dims)               │
  └──────────────────────────────────────────────────────────────┘
```

## Choosing the Right Model

```
  DECISION GUIDE (May 2026)
  ──────────────────────────────────────────────────────────────

  Prototype / dev:
    → all-MiniLM-L6-v2     (fast, zero cost, easy)

  Production English RAG, self-hosted, no GPU:
    → BGE-large-en-v1.5    (best MTEB at BERT size, proven)
    → Nomic Embed v1.5     (8192 tokens, fully open, auditable)

  Production, need long document chunks (>512 tokens):
    → Qwen3-Embedding-7B   (32k tokens, MTEB 70.58, open-source)
    → BGE-M3               (8192 tokens, dense+sparse+ColBERT)
    → Voyage-3             (32,000 tokens, managed API)

  Production, managed API, best accuracy:
    → Google Gemini Emb-001 (MTEB 68.32 multilingual, competitive pricing)
    → Voyage-3              (MTEB 70.3, $0.06/1M — best for retrieval)
    → Voyage-3-lite         (MTEB 67.1, $0.02/1M — most cost-effective API)

  Production, managed API, lowest cost:
    → Voyage-3-lite         ($0.02/1M, MTEB 67.1 — beats all OpenAI options)
    → Google Gemini Emb-001 (~$0.01/1M, MTEB 68.32)

  Multilingual (2026 leaders):
    → Qwen3-Embedding-7B   (MTEB 70.58 multilingual, 100+ langs, open)
    → Google Gemini Emb-001 (MTEB 68.32 multilingual, managed API)
    → BGE-M3               (100+ languages, also sparse+ColBERT output)
    → jina-embeddings-v3   (89 languages, CC BY-NC)

  Multimodal (text + images + video + audio):
    → Google Gemini Emb-2  (March 2026, only all-modality model)

  Code search:
    → Voyage-code-3        (code-specific, $0.18/1M)
    → jina-embeddings-v3   (supports code, 8k context)

  Domain-specific (finance, legal):
    → Voyage-finance-2, voyage-law-2

  Highest quality, GPU available (MTEB v2 leaders):
    → Harrier-OSS-v1-27B   (MTEB v2: 74.3, MIT — best in class)
    → Harrier-OSS-v1-8B    (MTEB v2: 71.5, MIT — practical size)
    → Llama-Embed-Nemotron-8B (72.31 English, NVIDIA)
    → Qwen3-Embedding-7B   (70.58 multilingual, 32k context)

  Storage constrained or latency sensitive:
    → Qwen3-Embedding-0.6B + MRL 256 dims (~2 GB VRAM, 8x storage savings)
    → Nomic Embed v1.5 + MRL 256 dims (open, auditable)
```

---

## See Also

- [Chunking Strategies](../chunking) — preparing text before embedding
- [Vector Stores](../vector-stores) — storing and indexing embeddings
- [Retrieval Strategies](../retrieval-strategies) — dense, sparse, and hybrid retrieval
- [BM25 & Sparse Retrieval](../bm25-sparse-retrieval) — BGE-M3's sparse output for hybrid
- [BERT in RAG](../bert/bert-in-rag) — the architecture behind most open-source embedding models
