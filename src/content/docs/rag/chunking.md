---
title: Chunking Strategies
description: Complete 2025 guide to document chunking for RAG — fixed-size, recursive, semantic, late chunking (Jina AI 2024), parent document retrieval, sliding-window — with LangChain code examples.
sidebar:
  order: 4
---

> **Current as of May 2026.**

## Why Chunking Matters

A RAG pipeline embeds text chunks and retrieves the most relevant ones. The quality of those chunks directly determines what context the LLM receives. Too large → noisy, irrelevant text dilutes the answer. Too small → the chunk lacks enough context to be useful. Getting chunking right is often the single highest-leverage optimization in a RAG system.

**The core tension:**

- A 100-token chunk has high precision (focused) but low recall (misses surrounding context)
- A 1,000-token chunk has high recall but low precision (too much noise per chunk)

**Empirical baseline:** For most English prose with SBERT-style embedding models (384–768 dims), chunks of **256–512 tokens** with **10–20% overlap** give good retrieval performance.

---

## 1. Fixed-Size Chunking

Split text into chunks of exactly N characters (or tokens), with optional overlap.

**Pros:** Simple, predictable, fast.  
**Cons:** Ignores sentence/paragraph boundaries — a chunk may start mid-sentence.

```python
from langchain_text_splitters import CharacterTextSplitter

splitter = CharacterTextSplitter(
    chunk_size=512,       # characters
    chunk_overlap=64,     # overlap to preserve context across boundaries
    separator="\n",       # preferred split point
)

chunks = splitter.split_text(document_text)
```

### Token-based Fixed Chunking

Character counting is unreliable across languages. Token-based is more accurate for embedding model limits:

```python
from langchain_text_splitters import TokenTextSplitter

splitter = TokenTextSplitter(
    chunk_size=256,        # tokens (as counted by the embedding model's tokenizer)
    chunk_overlap=32,
    encoding_name="cl100k_base",  # OpenAI tiktoken encoding
)

chunks = splitter.split_text(document_text)
```

---

## 2. Recursive Character Text Splitting

The standard workhorse for unstructured text. Tries to split on a hierarchy of separators in order — only falls back to the next separator if the chunk is still too large.

**Default separator hierarchy:** `["\n\n", "\n", " ", ""]`

This means it first tries to split on double newlines (paragraphs), then single newlines, then spaces, then characters. This produces semantically coherent chunks in practice.

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,         # characters
    chunk_overlap=200,
    separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    length_function=len,     # can substitute a token counter
)

doc_chunks = splitter.create_documents(
    texts=[document_text],
    metadatas=[{"source": "company_handbook.pdf", "page": 1}]
)

# Each chunk is a Document object:
# doc_chunks[0].page_content → "..."
# doc_chunks[0].metadata     → {"source": "...", "page": 1}
```

### Language-aware Splitters

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter, Language

# Python code — splits respect function/class boundaries
python_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=1000,
    chunk_overlap=100,
)

# Markdown — splits on headers, code blocks, paragraphs
md_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.MARKDOWN,
    chunk_size=1000,
    chunk_overlap=100,
)
```

---

## 3. Document-Structure-Aware Chunking

### Markdown Header Splitting

Preserves document hierarchy by splitting on header levels and propagating header metadata:

```python
from langchain_text_splitters import MarkdownHeaderTextSplitter

headers_to_split_on = [
    ("#",  "H1"),
    ("##", "H2"),
    ("###","H3"),
]
splitter = MarkdownHeaderTextSplitter(headers_to_split_on=headers_to_split_on)

md_text = """
# Company Overview
Acme Corp was founded in 1990.

## Products
We sell anvils.

### Anvil Types
Classic, turbo, and deluxe.
"""

header_splits = splitter.split_text(md_text)
# header_splits[0].page_content = "Acme Corp was founded in 1990."
# header_splits[0].metadata     = {"H1": "Company Overview"}
# header_splits[1].page_content = "We sell anvils."
# header_splits[1].metadata     = {"H1": "Company Overview", "H2": "Products"}
```

### HTML Section Splitting

```python
from langchain_text_splitters import HTMLHeaderTextSplitter

headers_to_split_on = [("h1", "Header1"), ("h2", "Header2"), ("h3", "Header3")]
html_splitter = HTMLHeaderTextSplitter(headers_to_split_on=headers_to_split_on)
html_splits = html_splitter.split_text(html_content)
```

### PDF with Page/Section Metadata

```python
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

loader = PyPDFLoader("report.pdf")
pages = loader.load()   # one Document per page

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(pages)
# chunks[i].metadata["page"] = page number from PyPDF
```

---

## 4. Semantic Chunking

Instead of splitting at fixed sizes, split at **semantic boundary shifts** — identified by a sudden drop in embedding similarity between adjacent sentences.

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

# Uses embedding cosine similarity to detect topic shifts
splitter = SemanticChunker(
    embeddings=OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile",  # "standard_deviation", "interquartile"
    breakpoint_threshold_amount=95,          # split when similarity drops below 95th percentile
)

chunks = splitter.split_text(long_document)
```

**Algorithm:**
1. Split text into sentences
2. Embed each sentence
3. Compute cosine similarity between consecutive sentence pairs
4. Find points where similarity drops sharply (breakpoints)
5. Split at breakpoints

**Trade-offs:**

| | Fixed-size | Semantic |
|---|---|---|
| Speed | Very fast | Slow (embeds every sentence) |
| Chunk size variance | Predictable | Variable (0.5× to 3× target) |
| Semantic coherence | Poor | Excellent |
| Recommended for | High-volume pipelines | Quality-critical RAG |

---

## 5. Sliding Window (Overlapping Windows)

Create overlapping windows that step through the document:

```python
def sliding_window_chunks(text: str, window_size: int = 512, stride: int = 256) -> list[str]:
    """window_size and stride in characters."""
    chunks = []
    start = 0
    while start < len(text):
        end = min(start + window_size, len(text))
        chunks.append(text[start:end])
        if end == len(text):
            break
        start += stride
    return chunks

chunks = sliding_window_chunks(document, window_size=1000, stride=500)
```

Overlap (window_size - stride) ensures that answers spanning a boundary are captured.

---

## 6. Parent Document Retrieval

A powerful pattern: store **small chunks** in the vector index for precise retrieval, but return **large parent chunks** to the LLM for rich context.

```python
from langchain.storage import InMemoryStore
from langchain_community.vectorstores import Chroma
from langchain.retrievers import ParentDocumentRetriever
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings

# Small child chunks for retrieval (high precision)
child_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=40)

# Large parent chunks passed to LLM (high context)
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=2000, chunk_overlap=200)

vectorstore = Chroma(embedding_function=OpenAIEmbeddings())
store = InMemoryStore()

retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,
    docstore=store,
    child_splitter=child_splitter,
    parent_splitter=parent_splitter,
)

retriever.add_documents(documents)

# Retrieves child chunk for matching, returns parent chunk to LLM
results = retriever.get_relevant_documents("What is the refund policy?")
```

---

## Chunking Strategy Selection Guide

| Document type | Recommended strategy | chunk_size | overlap |
|---|---|---|---|
| Prose articles / blogs | Recursive character | 1000 chars | 200 chars |
| Technical documentation | Markdown header split → recursive | 1000–2000 | 200 |
| Legal / financial contracts | Recursive character or semantic | 512 chars | 100 |
| Source code | Language-aware (RecursiveCharacterTextSplitter + Language) | 1000 | 200 |
| Short FAQ / structured data | Fixed-size | 256 chars | 0 |
| Long-form reports | Parent document retrieval | 200 (child), 2000 (parent) | 40 / 200 |

---

## Chunk Metadata: Non-negotiable

Always attach metadata to chunks. At retrieval time, metadata enables filtering, attribution, and debugging:

```python
chunk = Document(
    page_content="The refund window is 30 days from purchase.",
    metadata={
        "source":   "terms_of_service.pdf",
        "page":     5,
        "section":  "Refund Policy",
        "doc_id":   "tos-v2.1",
        "ingested": "2025-01-15",
    }
)
```

---

---

## 7. Late Chunking (Jina AI, 2024)

**Paper:** Günther et al., "Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models" (2024)

Standard chunking embeds each chunk independently — the chunk loses all context from the surrounding document. Late Chunking fixes this by embedding the **entire document first**, then pooling token embeddings into chunk-level representations.

```
  STANDARD CHUNKING:
  ────────────────────────────────────────────────────────────
  Document → split → [Chunk 1] → embed → vec1
                     [Chunk 2] → embed → vec2   ← independent, no context
                     [Chunk 3] → embed → vec3


  LATE CHUNKING:
  ────────────────────────────────────────────────────────────
  Document → embed entire document → [t1, t2, t3, ..., tN]
                                      ↑ token embeddings with full context
             then split into chunks:
             Chunk 1 = mean_pool(t1..t50)    ← vector with document context
             Chunk 2 = mean_pool(t51..t100)  ← vector with document context
             Chunk 3 = mean_pool(t101..t150) ← vector with document context


  WHY IT MATTERS:
  ────────────────────────────────────────────────────────────
  Chunk 2 text: "He was born in 1879 in Ulm."

  Standard embedding: Who is "He"? The embedding can't know.
  Late chunking:      "He" = Einstein (from earlier in doc) — context preserved.
```

**Requirements:** Long-context embedding model (BGE-M3, jina-embeddings-v3, Nomic Embed v1.5 — all support 8192 tokens).

```python
# pip install transformers torch numpy
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel

model_name = "jinaai/jina-embeddings-v3"   # 8192-token context
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModel.from_pretrained(model_name, trust_remote_code=True)
model.eval()

def late_chunk_embed(document: str, chunk_boundaries: list[tuple[int, int]]) -> list[np.ndarray]:
    """
    Embed a full document and pool into chunk-level embeddings.

    chunk_boundaries: list of (start_char, end_char) for each chunk
    Returns: list of normalized chunk embeddings
    """
    # Tokenize the entire document
    inputs = tokenizer(
        document,
        return_tensors="pt",
        truncation=True,
        max_length=8192,
        return_offsets_mapping=True,   # char-level token offsets
    )
    offset_mapping = inputs.pop("offset_mapping")[0]   # (num_tokens, 2)

    # Get token embeddings for the full document
    with torch.no_grad():
        outputs = model(**inputs)
    token_embeddings = outputs.last_hidden_state[0]   # (num_tokens, hidden_dim)

    # Pool token embeddings into chunk embeddings
    chunk_embeddings = []
    for start_char, end_char in chunk_boundaries:
        # Find which tokens fall within this chunk's character range
        mask = (
            (offset_mapping[:, 0] >= start_char) &
            (offset_mapping[:, 1] <= end_char) &
            (offset_mapping[:, 0] != offset_mapping[:, 1])   # skip special tokens
        )
        chunk_tokens = token_embeddings[mask]

        if len(chunk_tokens) == 0:
            # Fallback: use CLS token
            chunk_tokens = token_embeddings[:1]

        # Mean pooling over chunk tokens
        chunk_vec = chunk_tokens.mean(dim=0).numpy()

        # L2 normalize
        chunk_vec = chunk_vec / np.linalg.norm(chunk_vec)
        chunk_embeddings.append(chunk_vec)

    return chunk_embeddings


def get_chunk_boundaries(document: str, chunk_size_chars: int = 500) -> list[tuple[int, int]]:
    """Split document into character-level chunks, aligned to word boundaries."""
    words = document.split()
    boundaries = []
    current_pos = 0
    chunk_start = 0

    for word in words:
        word_start = document.find(word, current_pos)
        word_end = word_start + len(word)
        current_pos = word_end

        if word_end - chunk_start >= chunk_size_chars:
            boundaries.append((chunk_start, word_end))
            chunk_start = word_end + 1   # next chunk starts after this word

    if chunk_start < len(document):
        boundaries.append((chunk_start, len(document)))

    return boundaries


# Usage
document = "Albert Einstein was a German-born theoretical physicist... He developed the theory of relativity..."
boundaries = get_chunk_boundaries(document, chunk_size_chars=500)
chunk_texts = [document[s:e] for s, e in boundaries]
chunk_embeddings = late_chunk_embed(document, boundaries)

print(f"Document: {len(document)} chars → {len(chunk_embeddings)} late-chunked embeddings")
# Each embedding captures surrounding document context
```

```python
# Late chunking with LangChain + FAISS
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
import numpy as np

def build_late_chunk_vectorstore(documents: list[str]) -> FAISS:
    """Build a FAISS vectorstore using late chunk embeddings."""
    all_chunks = []
    all_embeddings = []

    for doc_text in documents:
        boundaries = get_chunk_boundaries(doc_text)
        chunk_texts = [doc_text[s:e] for s, e in boundaries]
        embeddings = late_chunk_embed(doc_text, boundaries)

        for text, emb in zip(chunk_texts, embeddings):
            all_chunks.append(Document(page_content=text))
            all_embeddings.append(emb)

    embeddings_array = np.array(all_embeddings, dtype="float32")

    # Build FAISS from pre-computed embeddings
    import faiss
    d = embeddings_array.shape[1]
    index = faiss.IndexFlatIP(d)
    index.add(embeddings_array)

    # Wrap in LangChain FAISS (requires custom embedding class that returns pre-computed vecs)
    # In practice, store embeddings separately and use index.search() directly
    return index, all_chunks
```

**When to use Late Chunking:**
- Documents where pronoun resolution matters ("he", "it", "the company")
- Legal and financial documents with heavy cross-references
- Technical documentation with recurring abbreviations defined early in the text
- Any use case where chunk context loss is causing retrieval failures

**Tradeoff vs. Contextual Retrieval:**
| | Late Chunking | Contextual Retrieval |
|---|---|---|
| Context source | Full document token embeddings | LLM-generated summary |
| Cost | Embedding model only (cheap) | LLM call per chunk (expensive) |
| Context precision | Implicit (pooled) | Explicit (written description) |
| Model requirement | Long-context embedding model | Any embedding + LLM |
| Speed | Fast (one forward pass) | Slow (LLM per chunk) |

---

## Chunk Size Benchmarks

Research findings on chunk size vs. retrieval quality (varies by embedding model and domain):

```
  CHUNK SIZE EFFECT ON RETRIEVAL (general guidance)
  ─────────────────────────────────────────────────────────────
  < 128 tokens   High precision, low recall
                 Loses surrounding context — often too small
                 Good for: short FAQ answers, code snippets

  128–256 tokens Sweet spot for sentence-transformers (512-token max)
                 Best for: general Q&A, support docs

  256–512 tokens Standard production range
                 Best for: technical documentation, reports

  512–1024 tokens Better for long-answer synthesis
                 Risk: lower retrieval precision (too broad)
                 Requires embedding model with >512 token context

  > 1024 tokens  Use parent document retrieval or late chunking
                 Direct embedding of very long chunks degrades quality
                 for most embedding models
  ─────────────────────────────────────────────────────────────
  Overlap: 10–20% of chunk size is typical.
  Test your specific domain — optimal sizes vary significantly.
```

---

## See Also

- [Embedding Models](../embedding-models) — the model receiving your chunks; BGE-M3 for 8192-token late chunking
- [Retrieval Strategies](../retrieval-strategies) — how chunks are retrieved once embedded
- [Contextual Retrieval](./contextual-retrieval) — LLM-generated context prepended to chunks (Anthropic 2024)
- [Vectorless RAG](./pageindex-vectorless-rag) — when to skip chunking entirely (PageIndex, long-context)
- [Naive RAG Explainer](../naive-rag) — see chunking and retrieval in an interactive walkthrough
