---
title: Chunking Strategies
description: Complete May 2026 guide to document chunking for RAG — fixed-size, recursive, semantic, late chunking (Jina AI 2024), parent document retrieval, sliding-window, agentic chunking, visual document chunking — with LangChain and Anthropic SDK code examples.
sidebar:
  order: 4
---

> **Current as of May 2026.**

## Why Chunking Matters

A RAG pipeline embeds text chunks and retrieves the most relevant ones. The quality of those chunks directly determines what context the LLM receives. Too large means noisy, irrelevant text dilutes the answer. Too small means the chunk lacks enough context to be useful. Getting chunking right is often the single highest-leverage optimization in a RAG system.

**The core tension:**

- A 100-token chunk has high precision (focused) but low recall (misses surrounding context)
- A 1,000-token chunk has high recall but low precision (too much noise per chunk)

**Empirical baseline:** For most English prose with SBERT-style embedding models (384–768 dims), chunks of **256–512 tokens** with **10–20% overlap** give good retrieval performance.

```
  THE CHUNKING TRADEOFF
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │  Precision                                        Recall   │
  │  (relevance per chunk)                   (context coverage)│
  │                                                             │
  │  High ◄──────────────────────────────────────────► High   │
  │         small chunks              large chunks             │
  │         (64–128 tokens)           (512–2048 tokens)        │
  │                                                             │
  │         + Focused answer          + Rich context           │
  │         - Loses surrounding ctx   - Noisy, diluted         │
  │         - Pronoun resolution fails- Lower retrieval prec.  │
  │                                                             │
  │  Sweet spot for most English RAG: 256–512 tokens           │
  │  with 10–20% overlap                                       │
  └─────────────────────────────────────────────────────────────┘
```

---

## 1. Fixed-Size Chunking

Split text into chunks of exactly N characters (or tokens), with optional overlap.

**Pros:** Simple, predictable, fast.
**Cons:** Ignores sentence/paragraph boundaries — a chunk may start mid-sentence.

```
  FIXED-SIZE CHUNKING
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Document: "The quick brown fox jumps over the lazy dog..." │
  │                                                              │
  │  chunk_size=20, overlap=5                                    │
  │                                                              │
  │  ┌────────────────────┐                                      │
  │  │ The quick brown fo │  chunk 1 (chars 0–19)               │
  │  └────────────────────┘                                      │
  │               ┌────────────────────┐                         │
  │               │ n fox jumps over t │  chunk 2 (chars 15–34) │
  │               └────────────────────┘                         │
  │                            ┌────────────────────┐            │
  │                            │ he lazy dog...     │  chunk 3  │
  │                            └────────────────────┘            │
  │                                                              │
  │  ◄──────────┼──────────►                                    │
  │    stride=15   overlap=5                                     │
  └──────────────────────────────────────────────────────────────┘
```

```python
from langchain_text_splitters import CharacterTextSplitter

splitter = CharacterTextSplitter(
    chunk_size=512,
    chunk_overlap=64,
    separator="\n",
)

chunks = splitter.split_text(document_text)
```

### Token-based Fixed Chunking

Character counting is unreliable across languages. Token-based is more accurate for embedding model limits:

```python
from langchain_text_splitters import TokenTextSplitter

splitter = TokenTextSplitter(
    chunk_size=256,
    chunk_overlap=32,
    encoding_name="cl100k_base",
)

chunks = splitter.split_text(document_text)
```

---

## 2. Recursive Character Text Splitting

The standard workhorse for unstructured text. Tries to split on a hierarchy of separators in order — only falls back to the next separator if the chunk is still too large.

**Default separator hierarchy:** `["\n\n", "\n", " ", ""]`

This means it first tries to split on double newlines (paragraphs), then single newlines, then spaces, then characters. This produces semantically coherent chunks in practice.

```
  RECURSIVE SPLITTING — SEPARATOR HIERARCHY
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Try "\n\n" (paragraph break) ──► chunk fits? → DONE       │
  │          │                                                   │
  │          └─ chunk still too large?                          │
  │                    │                                         │
  │                    ▼                                         │
  │          Try "\n" (line break) ──► chunk fits? → DONE      │
  │                    │                                         │
  │                    └─ still too large?                      │
  │                              │                               │
  │                              ▼                               │
  │                    Try " " (space) ──► chunk fits? → DONE  │
  │                              │                               │
  │                              └─ still too large?            │
  │                                         │                    │
  │                                         ▼                    │
  │                               Split by character            │
  └──────────────────────────────────────────────────────────────┘
```

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""],
    length_function=len,
)

doc_chunks = splitter.create_documents(
    texts=[document_text],
    metadatas=[{"source": "company_handbook.pdf", "page": 1}]
)
```

### Language-aware Splitters

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter, Language

python_splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=1000,
    chunk_overlap=100,
)

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

```
  MARKDOWN HEADER CHUNKING — METADATA PROPAGATION
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  # Company Overview          ──► chunk metadata:            │
  │    Acme Corp founded in 1990     {H1: "Company Overview"}   │
  │                                                              │
  │  ## Products                 ──► chunk metadata:            │
  │    We sell anvils.               {H1: "Company Overview",   │
  │                                   H2: "Products"}           │
  │                                                              │
  │  ### Anvil Types             ──► chunk metadata:            │
  │    Classic, turbo, deluxe.       {H1: "Company Overview",   │
  │                                   H2: "Products",           │
  │                                   H3: "Anvil Types"}        │
  │                                                              │
  │  Each chunk carries its full hierarchical breadcrumb.       │
  └──────────────────────────────────────────────────────────────┘
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
pages = loader.load()

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
chunks = splitter.split_documents(pages)
```

---

## 4. Semantic Chunking

Instead of splitting at fixed sizes, split at **semantic boundary shifts** — identified by a sudden drop in embedding similarity between adjacent sentences.

```
  SEMANTIC CHUNKING — SIMILARITY-BASED SPLITTING
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Sentence 1 ──embed──► vec1 ─┐                             │
  │  Sentence 2 ──embed──► vec2  ├─ sim=0.91 (high, same topic)│
  │  Sentence 3 ──embed──► vec3 ─┘                             │
  │  Sentence 4 ──embed──► vec4  ─── sim=0.43 (LOW → SPLIT!)  │
  │  Sentence 5 ──embed──► vec5 ─┐                             │
  │  Sentence 6 ──embed──► vec6  ├─ sim=0.88 (high, same topic)│
  │  Sentence 7 ──embed──► vec7 ─┘                             │
  │                                                              │
  │  Result:                                                     │
  │  ┌──────────────────────┐ ┌──────────────────────┐         │
  │  │ Chunk 1              │ │ Chunk 2              │         │
  │  │ Sentences 1, 2, 3   │ │ Sentences 4, 5, 6, 7 │         │
  │  └──────────────────────┘ └──────────────────────┘         │
  └──────────────────────────────────────────────────────────────┘
```

```python
from langchain_experimental.text_splitter import SemanticChunker
from langchain_openai import OpenAIEmbeddings

splitter = SemanticChunker(
    embeddings=OpenAIEmbeddings(),
    breakpoint_threshold_type="percentile",
    breakpoint_threshold_amount=95,
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
| Chunk size variance | Predictable | Variable (0.5x to 3x target) |
| Semantic coherence | Poor | Excellent |
| Recommended for | High-volume pipelines | Quality-critical RAG |

---

## 5. Sliding Window (Overlapping Windows)

Create overlapping windows that step through the document:

```
  SLIDING WINDOW CHUNKING
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Document: ──────────────────────────────────────────────►  │
  │                                                              │
  │  Window 1: [════════════════]                               │
  │  Window 2:       [════════════════]                         │
  │  Window 3:             [════════════════]                   │
  │  Window 4:                   [════════════════]             │
  │                                                              │
  │             ◄──────────────►                                │
  │               window_size                                    │
  │             ◄──────►                                        │
  │               stride                                         │
  │                    ◄────────►                               │
  │                      overlap = window_size - stride          │
  │                                                              │
  │  Overlap ensures answers spanning a boundary are captured.  │
  └──────────────────────────────────────────────────────────────┘
```

```python
def sliding_window_chunks(text: str, window_size: int = 512, stride: int = 256) -> list[str]:
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

---

## 6. Parent Document Retrieval

A powerful pattern: store **small chunks** in the vector index for precise retrieval, but return **large parent chunks** to the LLM for rich context.

```
  PARENT DOCUMENT RETRIEVAL
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  INDEXING PHASE:                                            │
  │                                                              │
  │  Parent doc (2000 chars)                                    │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │ [child 1] [child 2] [child 3] [child 4] [child 5]  │   │
  │  │  200 ch    200 ch    200 ch    200 ch    200 ch     │   │
  │  └─────────────────────────────────────────────────────┘   │
  │        │          │         │                               │
  │        ▼          ▼         ▼                               │
  │   ┌─────────┐ ┌─────────┐ ┌─────────┐                     │
  │   │ vec(c1) │ │ vec(c2) │ │ vec(c3) │  → vector index     │
  │   └─────────┘ └─────────┘ └─────────┘                     │
  │                                                              │
  │  RETRIEVAL PHASE:                                           │
  │                                                              │
  │  Query ──embed──► vec(q)                                   │
  │                     │                                       │
  │                     ▼ similarity search                     │
  │               vec(c2) matches!                              │
  │                     │                                       │
  │                     ▼ lookup parent                         │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │ full Parent doc (2000 chars) returned to LLM        │   │
  │  └─────────────────────────────────────────────────────┘   │
  │                                                              │
  │  Precision: child chunks (high signal/noise ratio)         │
  │  Context:   parent chunks (full surrounding information)   │
  └──────────────────────────────────────────────────────────────┘
```

```python
from langchain.storage import InMemoryStore
from langchain_community.vectorstores import Chroma
from langchain.retrievers import ParentDocumentRetriever
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings

child_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=40)
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

results = retriever.get_relevant_documents("What is the refund policy?")
```

---

## 7. Late Chunking (Jina AI, 2024)

**Paper:** Gunther et al., "Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models" (2024)

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
import torch
import numpy as np
from transformers import AutoTokenizer, AutoModel

model_name = "jinaai/jina-embeddings-v3"
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModel.from_pretrained(model_name, trust_remote_code=True)
model.eval()

def late_chunk_embed(document: str, chunk_boundaries: list[tuple[int, int]]) -> list[np.ndarray]:
    inputs = tokenizer(
        document,
        return_tensors="pt",
        truncation=True,
        max_length=8192,
        return_offsets_mapping=True,
    )
    offset_mapping = inputs.pop("offset_mapping")[0]

    with torch.no_grad():
        outputs = model(**inputs)
    token_embeddings = outputs.last_hidden_state[0]

    chunk_embeddings = []
    for start_char, end_char in chunk_boundaries:
        mask = (
            (offset_mapping[:, 0] >= start_char) &
            (offset_mapping[:, 1] <= end_char) &
            (offset_mapping[:, 0] != offset_mapping[:, 1])
        )
        chunk_tokens = token_embeddings[mask]

        if len(chunk_tokens) == 0:
            chunk_tokens = token_embeddings[:1]

        chunk_vec = chunk_tokens.mean(dim=0).numpy()
        chunk_vec = chunk_vec / np.linalg.norm(chunk_vec)
        chunk_embeddings.append(chunk_vec)

    return chunk_embeddings


def get_chunk_boundaries(document: str, chunk_size_chars: int = 500) -> list[tuple[int, int]]:
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
            chunk_start = word_end + 1

    if chunk_start < len(document):
        boundaries.append((chunk_start, len(document)))

    return boundaries


document = "Albert Einstein was a German-born theoretical physicist... He developed the theory of relativity..."
boundaries = get_chunk_boundaries(document, chunk_size_chars=500)
chunk_texts = [document[s:e] for s, e in boundaries]
chunk_embeddings = late_chunk_embed(document, boundaries)
```

```python
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
import numpy as np

def build_late_chunk_vectorstore(documents: list[str]) -> FAISS:
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

    import faiss
    d = embeddings_array.shape[1]
    index = faiss.IndexFlatIP(d)
    index.add(embeddings_array)

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

## 8. Agentic Chunking

Standard chunking strategies split documents by token counts, character limits, or separators — heuristics that ignore the actual structure of ideas in the document. **Agentic chunking** delegates the boundary-detection decision to an LLM: the model reads the document and identifies where one coherent "idea" ends and another begins.

```
  AGENTIC CHUNKING — LLM-DRIVEN BOUNDARY DETECTION
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  Document (full text)                                       │
  │  ┌────────────────────────────────────────────────────┐    │
  │  │ ...clause 1 text... [?] ...clause 2 text... [?]... │    │
  │  └────────────────────────────────────────────────────┘    │
  │                          │                                   │
  │            ┌─────────────▼─────────────┐                   │
  │            │  LLM (claude-haiku-4-5)   │                   │
  │            │                           │                   │
  │            │  "Where does the first    │                   │
  │            │   coherent idea end?"     │                   │
  │            │                           │                   │
  │            │  → returns char index 847 │                   │
  │            └─────────────┬─────────────┘                   │
  │                          │                                   │
  │            ┌─────────────▼─────────────┐                   │
  │            │  sliding read window      │                   │
  │            │  (4000 chars + 200 ovlp)  │                   │
  │            └─────────────┬─────────────┘                   │
  │                          │                                   │
  │   Boundaries: [0, 847, 1923, 3041, ...]                    │
  │                          │                                   │
  │            ┌─────────────▼─────────────┐                   │
  │            │  Final chunks assembled   │                   │
  │            │  from detected boundaries │                   │
  │            └───────────────────────────┘                   │
  │                                                              │
  │  Result: chunks that respect document's actual structure    │
  └──────────────────────────────────────────────────────────────┘
```

**When to use agentic chunking:**
- Legal contracts (split at clause or section boundaries)
- Scientific papers (split at Introduction/Methods/Results/Discussion transitions)
- Technical documentation (split at feature or concept descriptions)
- Any document type where the logical structure doesn't map to formatting signals

**Trade-offs:**
- **Cost:** requires one LLM call per ~4000-char window — substantially more expensive than other strategies
- **Latency:** sequential LLM calls cannot be trivially parallelized across one document
- **Quality:** highest semantic coherence; chunks match how a human expert would divide the document

```python
import anthropic
import re

client = anthropic.Anthropic()

WINDOW_SIZE = 4000
OVERLAP = 200


def find_split_point(window_text: str, model: str = "claude-haiku-4-5-20251001") -> int:
    prompt = f"""You are a document chunking assistant. Read the following text and identify
the character index of the best split point — where one coherent idea, section, or
logical unit ends and another begins.

Return ONLY a single integer (the character index). Do not explain.

Text:
{window_text}

Character index of best split point:"""

    message = client.messages.create(
        model=model,
        max_tokens=16,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    match = re.search(r"\d+", raw)
    if not match:
        return len(window_text) // 2
    index = int(match.group())
    return max(1, min(index, len(window_text) - 1))


def agentic_chunk(document: str) -> list[str]:
    """
    Slide a window through the document, asking the LLM to identify the optimal
    split point within each window. Assembles final chunks from identified boundaries.
    """
    boundaries = [0]
    position = 0

    while position < len(document):
        window_start = max(0, position - OVERLAP)
        window_end = min(len(document), position + WINDOW_SIZE)
        window_text = document[window_start:window_end]

        if window_end == len(document):
            boundaries.append(len(document))
            break

        local_split = find_split_point(window_text)
        absolute_split = window_start + local_split

        if absolute_split <= boundaries[-1]:
            absolute_split = boundaries[-1] + WINDOW_SIZE // 2

        boundaries.append(absolute_split)
        position = absolute_split

    chunks = []
    for i in range(len(boundaries) - 1):
        start = boundaries[i]
        end = boundaries[i + 1]
        chunk_text = document[start:end].strip()
        if chunk_text:
            chunks.append(chunk_text)

    return chunks


with open("legal_contract.txt") as f:
    contract_text = f.read()

chunks = agentic_chunk(contract_text)
print(f"Document: {len(contract_text)} chars → {len(chunks)} semantically coherent chunks")
for i, chunk in enumerate(chunks):
    print(f"  Chunk {i+1}: {len(chunk)} chars — '{chunk[:60]}...'")
```

---

## 9. Visual Document Chunking

For PDFs containing charts, tables, images, and mixed layouts, plain text extraction is a lossy transformation. A table rendered as PDF vector graphics may extract as disordered whitespace-separated numbers. A diagram extracts as nothing at all. Modern approaches process page images directly or use layout-aware parsers that detect structure before extracting content.

```
  VISUAL DOCUMENT CHUNKING — EXTRACTION PIPELINE
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  PDF / DOCX / HTML                                          │
  │        │                                                     │
  │        ▼                                                     │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │  Layout Analysis (Docling / unstructured)           │   │
  │  │                                                     │   │
  │  │  Page image ──► bounding boxes ──► content types   │   │
  │  │                                                     │   │
  │  │  ┌──────────────┐  ┌──────────┐  ┌──────────────┐ │   │
  │  │  │  TEXT BLOCK  │  │  TABLE   │  │    FIGURE    │ │   │
  │  │  │  (paragraph) │  │ (matrix) │  │  (image/     │ │   │
  │  │  │              │  │          │  │   diagram)   │ │   │
  │  │  └──────┬───────┘  └────┬─────┘  └──────┬───────┘ │   │
  │  └─────────│───────────────│────────────────│─────────┘   │
  │            │               │                │              │
  │            ▼               ▼                ▼              │
  │     text chunks      structured        image chunks        │
  │     (embedded via    JSON / markdown   (embedded via       │
  │      text model)     (embedded as      vision model or     │
  │                       text)             stored as ref)     │
  │            │               │                │              │
  │            └───────────────┴────────────────┘              │
  │                            │                                │
  │                     Vector index                           │
  │                (text + image chunks, linked                │
  │                 by page/section metadata)                  │
  └──────────────────────────────────────────────────────────────┘
```

### Key Libraries

| Library | Strength | Best for |
|---|---|---|
| **PyMuPDF (fitz)** | Fastest PDF renderer, precise text + image bbox extraction | High-throughput pipelines |
| **pdfplumber** | Table-aware text extraction, column detection | PDFs with complex tables |
| **Docling** (IBM, 2024) | Layout analysis, table/figure detection, OCR via PaddleOCR, exports structured JSON | Complex academic/enterprise PDFs |
| **unstructured** | Unified document processing (PDF, DOCX, HTML, PPT, email) | Multi-format ingestion pipelines |

### Text Extraction and Image Region Detection with PyMuPDF

```python
import fitz
from dataclasses import dataclass

@dataclass
class PageChunk:
    text: str
    page_number: int
    chunk_type: str
    bbox: tuple[float, float, float, float] | None = None
    image_index: int | None = None


def extract_page_chunks(pdf_path: str) -> list[PageChunk]:
    doc = fitz.open(pdf_path)
    chunks = []

    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text").strip()
        if text:
            chunks.append(PageChunk(
                text=text,
                page_number=page_num,
                chunk_type="text",
            ))

        for img_index, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            rects = page.get_image_rects(xref)
            for rect in rects:
                chunks.append(PageChunk(
                    text=f"[Image on page {page_num}, region ({rect.x0:.0f},{rect.y0:.0f})-({rect.x1:.0f},{rect.y1:.0f})]",
                    page_number=page_num,
                    chunk_type="image",
                    bbox=(rect.x0, rect.y0, rect.x1, rect.y1),
                    image_index=img_index,
                ))

    doc.close()
    return chunks


pdf_chunks = extract_page_chunks("research_report.pdf")
text_chunks = [c for c in pdf_chunks if c.chunk_type == "text"]
image_chunks = [c for c in pdf_chunks if c.chunk_type == "image"]
print(f"Extracted {len(text_chunks)} text chunks and {len(image_chunks)} image regions")
```

### Layout-Aware Chunking with Docling

Docling (IBM, 2024) is open-source and performs full layout analysis — detecting text blocks, tables, figures, headers, and captions, then converting the document to structured JSON or Markdown. It uses PaddleOCR for scanned content and handles complex multi-column layouts that defeat naive text extractors.

```python
from docling.document_converter import DocumentConverter
from docling.datamodel.base_models import InputFormat
from langchain_core.documents import Document


def docling_chunk_pdf(pdf_path: str) -> list[Document]:
    converter = DocumentConverter()
    result = converter.convert(pdf_path)
    doc = result.document

    langchain_docs = []

    for element, _level in doc.iterate_items():
        element_type = type(element).__name__

        if element_type == "TextItem":
            langchain_docs.append(Document(
                page_content=element.text,
                metadata={
                    "source": pdf_path,
                    "element_type": "text",
                    "page": getattr(element.prov[0], "page_no", None) if element.prov else None,
                }
            ))

        elif element_type == "TableItem":
            table_md = element.export_to_markdown()
            langchain_docs.append(Document(
                page_content=table_md,
                metadata={
                    "source": pdf_path,
                    "element_type": "table",
                    "page": getattr(element.prov[0], "page_no", None) if element.prov else None,
                }
            ))

        elif element_type == "PictureItem":
            caption = element.caption_text(doc) if hasattr(element, "caption_text") else ""
            langchain_docs.append(Document(
                page_content=f"[Figure] {caption}".strip(),
                metadata={
                    "source": pdf_path,
                    "element_type": "figure",
                    "page": getattr(element.prov[0], "page_no", None) if element.prov else None,
                }
            ))

    return langchain_docs


chunks = docling_chunk_pdf("complex_report.pdf")
text_chunks = [c for c in chunks if c.metadata["element_type"] == "text"]
table_chunks = [c for c in chunks if c.metadata["element_type"] == "table"]
figure_chunks = [c for c in chunks if c.metadata["element_type"] == "figure"]
```

### Storing Text and Image Chunks with Linked Metadata

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
import json

def build_multimodal_index(pdf_path: str):
    chunks = docling_chunk_pdf(pdf_path)

    text_and_table_chunks = [
        c for c in chunks
        if c.metadata["element_type"] in ("text", "table")
    ]

    figure_registry = []
    for i, chunk in enumerate(chunks):
        if chunk.metadata["element_type"] == "figure":
            figure_registry.append({
                "figure_id": f"fig_{i}",
                "source": chunk.metadata["source"],
                "page": chunk.metadata["page"],
                "caption": chunk.page_content,
            })
            text_and_table_chunks.append(Document(
                page_content=chunk.page_content,
                metadata={**chunk.metadata, "figure_id": f"fig_{i}"},
            ))

    vectorstore = Chroma.from_documents(
        documents=text_and_table_chunks,
        embedding=OpenAIEmbeddings(),
        collection_name="pdf_chunks",
    )

    with open("figure_registry.json", "w") as f:
        json.dump(figure_registry, f, indent=2)

    return vectorstore, figure_registry


vectorstore, figures = build_multimodal_index("annual_report.pdf")
```

---

## Chunking Strategy Selection Guide

```
  CHUNKING STRATEGY DECISION FLOWCHART
  ┌──────────────────────────────────────────────────────────────┐
  │                                                              │
  │  START: What is your document type?                         │
  │                     │                                        │
  │        ┌────────────┼──────────────────┐                   │
  │        │            │                  │                    │
  │        ▼            ▼                  ▼                    │
  │   PDF/DOCX      Structured         Unstructured             │
  │  with tables    (Markdown/HTML)     prose/reports           │
  │  or figures         │                  │                    │
  │        │            │                  │                    │
  │        ▼            ▼                  ▼                    │
  │   Contains      Use header-       Short docs       Long     │
  │   complex       aware split       (<1000 chars)?   docs?    │
  │   layouts?      (section 3)            │             │      │
  │        │                               │             │      │
  │   Yes  │  No                      Fixed-size    Semantic    │
  │        │   │                      (section 1)  chunking     │
  │        ▼   ▼                                  (section 4)   │
  │   Docling  PyMuPDF                                          │
  │   (section 9)                    Quality over speed?        │
  │                                        │                    │
  │                                  Yes   │   No               │
  │                                        │    │               │
  │                                        ▼    ▼               │
  │  Document has          Semantic    Recursive char           │
  │  cross-references?     (section 4) (section 2)             │
  │        │                                                     │
  │   Yes  │  No                                                │
  │        │   │          Need pronoun/entity context?          │
  │        ▼   ▼                    │                           │
  │   Late chunking           Yes   │   No                      │
  │   (section 7)                   │    │                      │
  │                                 ▼    ▼                      │
  │                          Late chunk  Standard               │
  │  Complex legal/          (section 7) chunking               │
  │  scientific docs?                                           │
  │        │                                                     │
  │   Yes  │  No                                                │
  │        │                                                     │
  │        ▼                                                     │
  │   Agentic chunking (section 8) — LLM-identified boundaries  │
  │                                                              │
  │  Need precision retrieval + full context to LLM?           │
  │        │                                                     │
  │        ▼                                                     │
  │   Parent document retrieval (section 6)                     │
  └──────────────────────────────────────────────────────────────┘
```

| Document type | Recommended strategy | chunk_size | overlap |
|---|---|---|---|
| Prose articles / blogs | Recursive character | 1000 chars | 200 chars |
| Technical documentation | Markdown header split then recursive | 1000–2000 | 200 |
| Legal / financial contracts | Agentic chunking or semantic | LLM-determined | N/A |
| Source code | Language-aware RecursiveCharacterTextSplitter | 1000 | 200 |
| Short FAQ / structured data | Fixed-size | 256 chars | 0 |
| Long-form reports | Parent document retrieval | 200 (child), 2000 (parent) | 40 / 200 |
| PDFs with tables and figures | Docling layout-aware | element-level | 0 |
| Documents with heavy cross-refs | Late chunking | 500 chars | 20% |

---

## Chunk Size vs Performance

Different chunk sizes produce measurable trade-offs between retrieval precision (returning exactly the right passage) and recall (not missing the answer because it was split across chunks). The numbers below are indicative ranges from published RAG benchmarks — actual values depend heavily on embedding model, domain, and query style.

```
  CHUNK SIZE vs RETRIEVAL QUALITY
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                                                                          │
  │  Metric: NDCG@10 on standard retrieval benchmarks (indicative ranges)   │
  │                                                                          │
  │  Chunk size    Precision    Recall    Notes                              │
  │  ──────────────────────────────────────────────────────────────────────  │
  │   64 tokens    Very high    Low       Too small for most models; misses  │
  │                (~0.70)    (~0.52)     surrounding context; good for      │
  │                                      dense QA over structured data       │
  │                                                                          │
  │  128 tokens    High         Medium    Sweet spot for 256-token max       │
  │                (~0.68)    (~0.61)     models (MiniLM); clips at longer   │
  │                                      contexts                            │
  │                                                                          │
  │  256 tokens    Good         Good      General purpose sweet spot for     │
  │                (~0.65)    (~0.68)     SBERT-class models; balances       │
  │                                      focus and context                   │
  │                                                                          │
  │  512 tokens    Medium       High      Better for synthesis queries;      │
  │                (~0.60)    (~0.74)     requires 512+ token embedding      │
  │                                      model; standard production choice   │
  │                                                                          │
  │  1024 tokens   Lower        Higher    Long-context models only (BGE-M3, │
  │                (~0.54)    (~0.79)     Qwen3-Embedding); noisy for        │
  │                                      point-lookup queries                │
  │                                                                          │
  │  2048+ tokens  Low          Very high Use parent document retrieval;     │
  │                (~0.45)    (~0.85)     direct embedding degrades for most │
  │                                      models; LLM context window concern  │
  │                                                                          │
  │  Rule of thumb: chunk_size ≤ (embedding_model_max_tokens × 0.6)        │
  │  Overlap: 10–20% of chunk_size reduces boundary-split retrieval misses  │
  └──────────────────────────────────────────────────────────────────────────┘
```

| Chunk size (tokens) | Precision (NDCG@10) | Recall | Best for | Embedding model requirement |
|---|---|---|---|---|
| 64 | Very high | Low | Structured QA, fact lookup | Any (all models handle this) |
| 128 | High | Medium | Short-answer RAG, FAQ | 256-token max models sufficient |
| 256 | Good | Good | General-purpose RAG | 512-token models (MiniLM, BGE-small) |
| 512 | Medium | High | Technical docs, synthesis | 512-token models (BGE-large, E5) |
| 1024 | Lower | Higher | Long narrative, research | 8192-token models (BGE-M3, Jina v3) |
| 2048+ | Low | Very high | Use parent doc retrieval | Long-context only; avoid direct embedding |

---

## Chunk Metadata: Non-negotiable

Always attach metadata to chunks. At retrieval time, metadata enables filtering, attribution, and debugging:

```python
chunk = Document(
    page_content="The refund window is 30 days from purchase.",
    metadata={
        "source":        "terms_of_service.pdf",
        "page":          5,
        "section":       "Refund Policy",
        "doc_id":        "tos-v2.1",
        "ingested":      "2026-05-01",
        "element_type":  "text",
        "chunk_method":  "recursive_character",
        "chunk_index":   42,
    }
)
```

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
