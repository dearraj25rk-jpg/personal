---
title: Embedding Models
description: Complete 2026 guide to embedding models for RAG — Qwen3, Gemini Embedding 2, NV-Embed-v2, Voyage AI, BGE-M3, Nomic Embed, jina-embeddings-v3, Cohere Embed v3, OpenAI text-embedding-3 — MTEB benchmarks, dimensions, cost, and code examples with Anthropic SDK and LangChain.
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

---

## The MTEB Benchmark

**MTEB** (Massive Text Embedding Benchmark, Muennighoff et al., 2022) is the standard benchmark — 56 tasks across 8 categories: retrieval, clustering, classification, reranking, STS, and more.

**MTEB v2** (2025) extended the benchmark with 10 new tasks and refreshed datasets to reduce contamination. Scores on MTEB v2 are not directly comparable to old MTEB scores.

Scores in the comparison table below are **MTEB Retrieval (NDCG@10)** unless noted as MTEB v2. BEIR covers 18 heterogeneous retrieval datasets (MS-MARCO, TREC-COVID, NQ, HotpotQA, FiQA, ArguAna, etc.).

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
    normalize_embeddings=True,   # normalize → cosine sim = dot product
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

# BGE requires instruction prefix for queries (not passages)
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

BGE-M3 is the most versatile open-source embedding model:
- **Multi-lingual:** 100+ languages in a single model
- **Multi-functionality:** dense retrieval + sparse retrieval (BM25-style) + ColBERT-style multi-vector — all from one model
- **Multi-granularity:** handles sentences to 8192-token documents

```python
from FlagEmbedding import BGEM3FlagModel

model = BGEM3FlagModel("BAAI/bge-m3", use_fp16=True)

# Dense embeddings (for vector search)
dense_output = model.encode(
    ["What is BERT?", "BERT is a transformer model by Google."],
    batch_size=12,
    max_length=8192,
    return_dense=True,
    return_sparse=False,
    return_colbert_vecs=False,
)
dense_vecs = dense_output["dense_vecs"]  # shape: (2, 1024)

# Sparse + dense for hybrid (BM25-style lexical weights from a neural model)
hybrid_output = model.encode(
    ["Python async programming tutorial"],
    return_dense=True,
    return_sparse=True,   # returns {token: weight} dict
)
sparse_weights = hybrid_output["lexical_weights"]  # {"python": 0.82, "async": 0.71, ...}
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

# Nomic requires task prefix: "search_query: " or "search_document: "
query = "search_query: What is the boiling point of water?"
docs  = ["search_document: Water boils at 100°C at sea level."]

q_emb = model.encode(query,   normalize_embeddings=True)
d_emb = model.encode(docs,    normalize_embeddings=True)

# Matryoshka: use only first 256 dims for 50% storage reduction
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

# Task-specific encoding for better performance
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

vo = voyageai.Client()   # uses VOYAGE_API_KEY env var

# Embed queries (use input_type="query") and docs (use input_type="document")
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
# LangChain integration
from langchain_voyageai import VoyageAIEmbeddings

embeddings = VoyageAIEmbeddings(
    model="voyage-3",
    voyage_api_key="YOUR_KEY",
    batch_size=72,
    show_progress_bar=True,
)

# Drop-in replacement for any LangChain embedding
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
        dimensions=dims,   # Matryoshka: reduce from 3072 to 1024 for storage savings
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
    task_type="RETRIEVAL_QUERY",     # RETRIEVAL_QUERY or RETRIEVAL_DOCUMENT
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
    task_type="RETRIEVAL_QUERY",   # or RETRIEVAL_DOCUMENT, SEMANTIC_SIMILARITY
    output_dimensionality=1024,    # Matryoshka: reduce from 3072
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

# Text embedding
text_result = genai.embed_content(
    model="models/gemini-embedding-2-preview",
    content="A photograph of a golden retriever",
    task_type="RETRIEVAL_QUERY",
)

# Image embedding (same model, same space)
image = PIL.Image.open("dog.jpg")
image_result = genai.embed_content(
    model="models/gemini-embedding-2-preview",
    content=image,
    task_type="RETRIEVAL_DOCUMENT",
)

# Cross-modal similarity (text query → image results)
import numpy as np
t_emb = np.array(text_result["embedding"])
i_emb = np.array(image_result["embedding"])
similarity = float(np.dot(t_emb, i_emb) / (np.linalg.norm(t_emb) * np.linalg.norm(i_emb)))
print(f"Text-to-image similarity: {similarity:.4f}")
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
model.max_seq_length = 32768   # 32k token context

# Qwen3-Embedding uses instruction-style prompting
task_instruct = "Given a web search query, retrieve relevant passages that answer the query"

def embed_qwen3(queries: list[str], is_query: bool = True) -> list:
    if is_query:
        # Prepend instruction for queries
        prefixed = [f"Instruct: {task_instruct}\nQuery: {q}" for q in queries]
    else:
        prefixed = queries   # no instruction for documents
    return model.encode(
        prefixed,
        normalize_embeddings=True,
        batch_size=2,     # 8B model — small batch
    )

# Matryoshka: reduce from 7168 to 1024 dims
def embed_qwen3_reduced(queries: list[str], dims: int = 1024) -> list:
    full = embed_qwen3(queries)
    return [v[:dims] / (sum(x**2 for x in v[:dims])**0.5) for v in full]
```

### Microsoft Harrier-OSS-v1 (MTEB v2 Leader)

```python
from sentence_transformers import SentenceTransformer

# 8B variant — practical for most deployments
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

# NV-Embed-v2: solid English retrieval, broad availability
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

## LangChain Integration Pattern

All models above can be wrapped in a consistent LangChain interface:

```python
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_cohere import CohereEmbeddings
from langchain_openai import OpenAIEmbeddings
from langchain_voyageai import VoyageAIEmbeddings
from langchain_community.vectorstores import FAISS

# Swap models with a single line change
embedding_configs = {
    "bge_large":    HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5"),
    "bge_m3":       HuggingFaceEmbeddings(model_name="BAAI/bge-m3"),
    "nomic":        HuggingFaceEmbeddings(model_name="nomic-ai/nomic-embed-text-v1.5", model_kwargs={"trust_remote_code": True}),
    "voyage_3":     VoyageAIEmbeddings(model="voyage-3"),
    "cohere_v3":    CohereEmbeddings(model="embed-english-v3.0"),
    "openai_large": OpenAIEmbeddings(model="text-embedding-3-large"),
}

# All are drop-in replacements
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
    """Embed a large corpus efficiently with progress tracking."""
    embeddings = model.encode(
        texts,
        batch_size=batch_size,
        show_progress_bar=True,
        normalize_embeddings=True,
        convert_to_numpy=True,
    )
    return embeddings.astype("float32")   # FAISS requires float32

# Save to disk — avoid re-embedding
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
| **jina-embeddings-v3** | 1024 | **8192** | 54.3 | 570M | Free* | Yes |
| **jina-v5-text-small** | 1024 | 8192 | **71.7** (MTEB v2) | 677M | Free | Yes |
| Cohere embed-v3 | 1024 | 512 | 55.9 | API | $0.10/1M | No |
| OpenAI embed-3-small | 1536 | 8191 | 44.0 | API | $0.02/1M | No |
| OpenAI embed-3-large | 3072 | 8191 | 54.9 | API | $0.13/1M | No |
| Google text-emb-004 | 768 | 2048 | 55.7 | API | $0.006/1M | No |
| **Google Gemini Emb-001** | 3072 | 8192 | **68.32** (multilingual) | API | $0.01/1M | No |
| **Google Gemini Emb-2** | 3072 | 8192 | — (multimodal) | API | TBD (preview) | No |
| **Voyage-3** | 1024 | **32,000** | 70.3 | API | $0.06/1M | No |
| **Voyage-3-lite** | 512 | **32,000** | 67.1 | API | $0.02/1M | No |
| NV-Embed-v2 | 4096 | 4096 | 62.7 | 7B | Free | Yes (GPU) |
| stella_en_1.5B_v5 | 8192 | 512 | 65.0 | 1.5B | Free | Yes (GPU) |
| **Llama-Embed-Nemotron-8B** | 4096 | 4096 | **72.31** (English avg) | 8B | Free | Yes (GPU) |
| **Qwen3-Embedding-8B** | 7168 | **32,768** | **70.58** (multilingual) | 8B | Free | Yes (GPU) |
| **Harrier-OSS-v1-8B** | — | — | **71.5** (MTEB v2) | 8B | Free | Yes (GPU) |
| **Harrier-OSS-v1-27B** | — | — | **74.3** (MTEB v2) | 27B | Free | Yes (GPU) |

*jina-embeddings-v3 is free for self-host but CC BY-NC (non-commercial via API)

---

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
    → Qwen3-Embedding-8B   (32k tokens, MTEB 70.58, open-source)
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
    → Qwen3-Embedding-8B   (MTEB 70.58 multilingual, 100+ langs, open)
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
    → Qwen3-Embedding-8B   (70.58 multilingual, 32k context)
```

---

## See Also

- [Chunking Strategies](../chunking) — preparing text before embedding
- [Vector Stores](../vector-stores) — storing and indexing embeddings
- [Retrieval Strategies](../retrieval-strategies) — dense, sparse, and hybrid retrieval
- [BM25 & Sparse Retrieval](../bm25-sparse-retrieval) — BGE-M3's sparse output for hybrid
- [BERT in RAG](../bert/bert-in-rag) — the architecture behind most open-source embedding models
