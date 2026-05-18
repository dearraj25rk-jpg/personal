---
title: Advanced RAG
description: Complete May 2026 guide — pre/post retrieval optimizations, RAG-Fusion, HyDE, Proposition Indexing, RAPTOR, FLARE, CAG, Speculative RAG, STORM, contextual compression, and reranking pipelines for production RAG systems.
sidebar:
  order: 9
---

> **Current as of May 2026.**

## What Is "Advanced RAG"?

Advanced RAG adds **pre-retrieval** (query optimization before searching) and **post-retrieval** (result refinement after searching) stages to the basic naive pipeline.

```
Naive RAG:     query → embed → retrieve top-k → LLM
Advanced RAG:  query → [pre-retrieval] → retrieve → [post-retrieval] → LLM
```

The goal: improve retrieval precision and recall without changing the underlying vector store.

---

## Advanced RAG Pipeline Overview

The diagram below shows where each technique fits in the full pipeline. Techniques are not mutually exclusive — a production system typically combines several from each stage.

```
                          User Query
                              │
              ┌───────────────▼───────────────┐
              │         Pre-Retrieval          │
              │  ┌─────────────────────────┐  │
              │  │  Query Rewriting        │  │
              │  │  Step-Back Prompting    │  │
              │  │  Query Decomposition    │  │
              │  │  Multi-Query/RAG-Fusion │  │
              │  │  HyDE                  │  │
              │  └─────────────────────────┘  │
              └───────────────┬───────────────┘
                              │ (4-6 query variants
                              │  or hypothetical doc)
              ┌───────────────▼───────────────┐
              │           Retrieval            │
              │  ┌─────────────────────────┐  │
              │  │  Dense / BM25 / Hybrid  │  │
              │  │  RAPTOR Hierarchy       │  │
              │  │  Proposition Index      │  │
              │  │  ColPali (Vision PDF)   │  │
              │  └─────────────────────────┘  │
              └───────────────┬───────────────┘
                              │ (top-30 to 150 candidates)
              ┌───────────────▼───────────────┐
              │        Post-Retrieval          │
              │  ┌─────────────────────────┐  │
              │  │  RRF Fusion             │  │
              │  │  Cross-Encoder Reranking│  │
              │  │  Contextual Compression │  │
              │  │  Lost-in-Middle Reorder │  │
              │  └─────────────────────────┘  │
              └───────────────┬───────────────┘
                              │ (top-5 compressed chunks)
              ┌───────────────▼───────────────┐
              │          Generation            │
              │  ┌─────────────────────────┐  │
              │  │  LLM with citations     │  │
              │  │  FLARE re-retrieval     │  │
              │  │  STORM (long-form)      │  │
              │  └─────────────────────────┘  │
              └───────────────────────────────┘
                              │
                          Answer
```

Alternatively, for **static knowledge bases**, skip retrieval entirely with **Cache-Augmented Generation (CAG)** — loading the full corpus into the LLM's KV cache at startup.

---

## Pre-Retrieval Optimizations

### 1. Query Rewriting

User queries are often ambiguous, conversational, or poorly formed. An LLM rewrites the query into a cleaner, more searching-friendly version.

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

rewrite_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a query optimization assistant. Rewrite the user's question into a precise, search-optimized query. Preserve all intent. Output only the rewritten query."),
    ("human", "{question}"),
])

rewrite_chain = rewrite_prompt | llm | StrOutputParser()

original = "um, how does the thing with keys work in python dictionaries?"
rewritten = rewrite_chain.invoke({"question": original})
# → "How does key hashing and lookup work in Python dictionaries?"
```

### 2. Step-Back Prompting

Instead of answering the specific question directly, first ask a broader "step-back" question and retrieve context for both. The broader query often surfaces foundational information missed by a narrow search.

**Paper:** Zheng et al., "Take a Step Back: Evoking Reasoning via Abstraction in Large Language Models" (2023)

```
Original:    "What was the temperature at Cape Canaveral on January 28, 1986?"
Step-back:   "What are the temperature and weather conditions relevant to the Challenger disaster?"
```

```python
stepback_prompt = ChatPromptTemplate.from_messages([
    ("system", "Your task is to step back and paraphrase a question to a more generic step-back question which is easier to answer. Here are some examples:\nOriginal: What happens to the volume of water when it freezes?\nStep-back: What are the physical properties of water during phase transitions?\n"),
    ("human", "{question}"),
])

stepback_chain = stepback_prompt | llm | StrOutputParser()

from langchain_core.runnables import RunnableParallel, RunnablePassthrough

full_chain = (
    RunnableParallel(
        original=RunnablePassthrough(),
        stepback=stepback_chain,
    )
    | (lambda x: {
        "context": (
            retriever.invoke(x["original"]["question"]) +
            retriever.invoke(x["stepback"])
        ),
        "question": x["original"]["question"],
    })
    | answer_chain
)
```

### 3. Query Decomposition / Sub-question Generation

For multi-hop questions that require synthesizing information from multiple documents, decompose into simpler sub-questions, retrieve for each, and synthesize.

```
Complex:   "Compare the environmental impact and cost of solar vs. nuclear energy."
Sub-q 1:   "What are the environmental impacts of solar energy?"
Sub-q 2:   "What are the environmental impacts of nuclear energy?"
Sub-q 3:   "What is the cost per kWh for solar energy?"
Sub-q 4:   "What is the cost per kWh for nuclear energy?"
```

```python
from langchain.retrievers.multi_query import MultiQueryRetriever

decompose_prompt = ChatPromptTemplate.from_messages([
    ("system", "Decompose the following question into 2-4 simpler sub-questions that together answer the original. Output one sub-question per line."),
    ("human", "{question}"),
])

def decompose_and_retrieve(question: str) -> list:
    raw = (decompose_prompt | llm | StrOutputParser()).invoke({"question": question})
    sub_questions = [q.strip() for q in raw.strip().split("\n") if q.strip()]
    all_docs = []
    for sq in sub_questions:
        all_docs.extend(retriever.invoke(sq))
    return deduplicate(all_docs)
```

### 4. Multi-Query Retrieval

Generate 3 semantically varied reformulations of the query, retrieve documents for each, and take the union (deduplicated). This increases recall by avoiding the vocabulary mismatch between a single phrasing and indexed documents.

```python
from langchain.retrievers.multi_query import MultiQueryRetriever

multi_retriever = MultiQueryRetriever.from_llm(
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
    llm=llm,
)
# Automatically generates 3 query variants and retrieves for each
docs = multi_retriever.invoke("How does BERT's attention mechanism work?")
```

### 5. RAG-Fusion

**Paper / Implementation:** Zackary Rackauckas, "RAG-Fusion" (2023)

RAG-Fusion extends multi-query retrieval with **Reciprocal Rank Fusion (RRF)** to merge ranked result lists from multiple queries — rather than a naive union. Documents that rank highly across multiple query variants get promoted; one-off matches get demoted.

```
Query
  ↓
Generate N query variants (LLM)
  ↓
Retrieve top-K per variant (parallel)
  ↓
       Query 1 results: [D3, D1, D5, D2, D7]
       Query 2 results: [D1, D3, D8, D5, D4]
       Query 3 results: [D3, D5, D1, D9, D2]
  ↓
RRF score = Σ 1/(rank + 60) for each doc across lists
  ↓
       D3: 1/61 + 1/62 + 1/61 = 0.0491   (top across all)
       D1: 1/62 + 1/61 + 1/63 = 0.0484
       D5: 1/63 + 1/64 + 1/62 = 0.0474
  ↓
Return re-ranked fused list → LLM
```

```python
from langchain.retrievers.multi_query import MultiQueryRetriever
from langchain_core.documents import Document

def reciprocal_rank_fusion(results: list[list[Document]], k: int = 60) -> list[Document]:
    """Fuse multiple ranked result lists using RRF."""
    scores: dict[str, float] = {}
    doc_map: dict[str, Document] = {}

    for result_list in results:
        for rank, doc in enumerate(result_list):
            # Use content hash as dedup key
            doc_id = hash(doc.page_content[:200])
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (rank + k)
            doc_map[doc_id] = doc

    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    return [doc_map[doc_id] for doc_id, _ in ranked]

def rag_fusion_retrieve(question: str, retriever, llm, n_queries: int = 4, top_k: int = 5) -> list[Document]:
    from langchain_core.prompts import ChatPromptTemplate
    from langchain_core.output_parsers import StrOutputParser

    query_gen_prompt = ChatPromptTemplate.from_messages([
        ("system", f"Generate {n_queries} different search queries for the same information need. Output one query per line, no numbering."),
        ("human", "{question}"),
    ])
    query_gen = query_gen_prompt | llm | StrOutputParser()

    # Generate query variants
    raw = query_gen.invoke({"question": question})
    queries = [question] + [q.strip() for q in raw.strip().split("\n") if q.strip()]

    # Retrieve in parallel for each query
    all_results = [retriever.invoke(q) for q in queries[:n_queries + 1]]

    # Fuse with RRF
    fused = reciprocal_rank_fusion(all_results)
    return fused[:top_k]

# Usage
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
docs = rag_fusion_retrieve("How does transformer attention scale with sequence length?", retriever, llm)
```

### 6. HyDE — Hypothetical Document Embeddings

**Paper:** Gao et al., "Precise Zero-Shot Dense Retrieval without Relevance Labels" (2022)

The core problem: a user query ("what is X?") is semantically distant from documents that answer it ("X is defined as…"). HyDE bridges this gap by asking the LLM to generate a **hypothetical document** that would answer the query, then embedding that document for retrieval — matching document-to-document rather than query-to-document.

```
Standard:  embed("What causes inflation?") → retrieve by similarity to query vector
HyDE:      LLM generates hypothetical answer →
           embed("Inflation is caused by excess money supply relative to goods,
                  typically triggered by central bank policy…") →
           retrieve by similarity to answer vector
```

```python
from langchain.retrievers import HypotheticalDocumentEmbedder
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# LangChain built-in HyDE retriever
hyde_embeddings = HypotheticalDocumentEmbedder.from_llm(
    llm=llm,
    embeddings=embeddings,
    n=1,   # number of hypothetical docs to generate (averaged)
)

# Drop-in replacement for standard embeddings in any vector store retriever
hyde_retriever = vectorstore.as_retriever(
    search_kwargs={"k": 5},
    # Uses hyde_embeddings.embed_query() which generates hypothetical doc first
)
```

**Manual HyDE implementation with Anthropic SDK:**

```python
import anthropic
import numpy as np

client = anthropic.Anthropic()

def hyde_embed(query: str, embedder) -> np.ndarray:
    """Generate a hypothetical answer and embed it."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=256,
        messages=[{
            "role": "user",
            "content": f"""Write a short factual passage (2-3 sentences) that would directly answer this question.
Write as if it's an excerpt from a reference document.
Question: {query}
Answer:"""
        }]
    )
    hypothetical_doc = response.content[0].text
    return np.array(embedder.embed_query(hypothetical_doc))

def hyde_retrieve(query: str, embedder, vectorstore, k: int = 5):
    hyp_embedding = hyde_embed(query, embedder)
    # Search using hypothetical doc embedding instead of query embedding
    return vectorstore.similarity_search_by_vector(hyp_embedding, k=k)
```

**When HyDE helps vs. hurts:**

| Scenario | HyDE Effect |
|---|---|
| Domain mismatch (query style ≠ doc style) | Significant gain |
| Technical questions from non-experts | Gain — LLM produces expert phrasing |
| Short factual queries with clear vocabulary | Minimal gain |
| Ambiguous queries | Risk — LLM may hallucinate wrong hypothetical |
| Real-time or rapidly changing information | Risk — hallucinated facts misdirect search |

---

## Post-Retrieval Optimizations

### 7. Reranking

Retrieve a broad set (top-50) with a fast method, then score each candidate with a cross-encoder and return only top-5. See [Retrieval Strategies — Reranking](../retrieval-strategies#7-cross-encoder-reranking) for full implementation.

```
Hybrid retrieval → top-50 candidates (fast)
Cross-encoder reranker → score all 50 pairs → top-5 (accurate)
LLM receives top-5 most relevant chunks
```

### 8. Contextual Compression

After retrieval, extract only the sentences directly relevant to the query from each chunk, reducing noise for the LLM.

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor, EmbeddingsFilter

# Option A: LLM extraction (slower, more accurate)
llm_compressor = LLMChainExtractor.from_llm(llm)

# Option B: Embedding filter (fast, removes off-topic sentences)
embeddings_filter = EmbeddingsFilter(
    embeddings=embedding_model,
    similarity_threshold=0.76,   # keep sentences above this cosine similarity to query
)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=embeddings_filter,   # or llm_compressor
    base_retriever=retriever,
)
```

### 9. Long-Context Reordering (Lost in the Middle)

LLMs perform better when relevant context appears at the beginning or end of the prompt — not in the middle. If you pass multiple chunks, reorder them to put the most relevant at the top and bottom.

**Paper:** Liu et al., "Lost in the Middle: How Language Models Use Long Contexts" (2023)

```python
from langchain_community.document_transformers import LongContextReorder

reorder = LongContextReorder()
reordered_docs = reorder.transform_documents(retrieved_docs)
# Places most relevant docs at beginning and end, less relevant in middle
```

---

## Proposition Indexing (Dense X Retrieval)

**Paper:** Chen et al., "Dense X Retrieval: What Retrieval Granularity Should We Use?" (2023)

Standard chunking splits text by token count or paragraph boundaries — often leaving atomic facts split across chunks. **Proposition indexing** decomposes each chunk into **propositions**: self-contained, atomic, single-fact statements. These are indexed instead of (or alongside) raw chunks.

### Standard Chunk vs. Proposition Index

```
Standard chunk (1 node in index):
  "BERT was introduced by Devlin et al. in 2018. It uses bidirectional
   transformers trained on masked language modeling and next sentence
   prediction tasks. BERT achieved state-of-the-art results on 11
   NLP tasks upon release."

Proposition index (3 nodes, each retrievable individually):
  P1: "BERT was introduced by Devlin et al. in 2018."
  P2: "BERT uses bidirectional transformers trained on masked language
       modeling and next sentence prediction."
  P3: "BERT achieved state-of-the-art results on 11 NLP tasks upon release."
```

When a query asks "When was BERT introduced?", proposition P1 has near-perfect similarity to the query — far higher than the whole chunk average. The parent chunk is returned for full context, but retrieved via the precise proposition.

```python
from anthropic import Anthropic
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

client = Anthropic()
embedder = OpenAIEmbeddings(model="text-embedding-3-large")

def extract_propositions(chunk: str) -> list[str]:
    """Decompose a text chunk into atomic propositions."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": f"""Decompose the following passage into a list of atomic propositions.
Each proposition must:
- Be a single self-contained fact (one sentence)
- Be understandable without additional context
- Preserve all key entities, numbers, and relationships
- Not introduce facts not present in the original text

Passage:
{chunk}

Return one proposition per line, no numbering or bullets:"""
        }]
    )
    return [line.strip() for line in response.content[0].text.strip().split("\n") if line.strip()]

def build_proposition_index(documents: list[Document]) -> tuple[FAISS, dict[str, str]]:
    """Build a vector index over propositions, with mapping back to parent chunks."""
    proposition_docs = []
    prop_to_parent: dict[str, str] = {}

    for doc in documents:
        propositions = extract_propositions(doc.page_content)
        for prop in propositions:
            prop_doc = Document(
                page_content=prop,
                metadata={**doc.metadata, "parent_content": doc.page_content},
            )
            proposition_docs.append(prop_doc)
            prop_to_parent[prop] = doc.page_content

    vectorstore = FAISS.from_documents(proposition_docs, embedder)
    return vectorstore, prop_to_parent

def proposition_retrieve(query: str, prop_vectorstore: FAISS, k: int = 5) -> list[Document]:
    """Retrieve by proposition similarity, return parent chunks (deduped)."""
    prop_hits = prop_vectorstore.similarity_search(query, k=k * 2)
    seen, results = set(), []
    for hit in prop_hits:
        parent = hit.metadata.get("parent_content", hit.page_content)
        if parent not in seen:
            seen.add(parent)
            results.append(Document(page_content=parent, metadata=hit.metadata))
        if len(results) == k:
            break
    return results

# Build
prop_store, _ = build_proposition_index(raw_documents)

# Query
docs = proposition_retrieve("When was BERT released?", prop_store)
```

**Proposition Indexing vs. Standard Chunking:**

| Metric | Standard chunks | Proposition Index |
|---|---|---|
| Index size | 1× | ~3-5× more nodes |
| Retrieval precision | Moderate | High (atomic matching) |
| Build cost | Low | High (LLM per chunk) |
| Build time | Fast | Slow |
| Best for | General use | Precision-critical, fact-dense docs |

---

---

## Contextual Retrieval (Anthropic, November 2024)

**Blog post:** Anthropic, "Contextual Retrieval" (November 2024)  
**Full coverage:** See [Contextual Retrieval](../contextual-retrieval) for the complete deep-dive.

Standard chunking embeds each chunk in isolation, stripping away surrounding document context. A chunk from page 47 of a contract — "The termination clause shall apply when payment obligations fail within 30 days" — contains no mention of which parties this refers to. Retrieval fails because the chunk no longer resembles queries that include those party names.

**Contextual Retrieval** prepends an LLM-generated context sentence to each chunk *before embedding*:

```
[CONTEXT]: This excerpt is from an agreement between Acme Corp (Licensor)
and Globex Inc (Licensee), in the Termination section.

[CHUNK]: The termination clause shall apply when payment obligations fail
within 30 days. In such cases, the non-defaulting party may...
```

The combined text embeds better — the entity names and section label are now part of the vector. Anthropic's tests show a **67% reduction in retrieval failures** versus standard chunking, and **49% further reduction** when BM25 is added alongside vector search.

```python
import anthropic

client = anthropic.Anthropic()

CONTEXT_PROMPT = """\
<document>
{full_document}
</document>

Here is the chunk we want to situate within the whole document:
<chunk>
{chunk_text}
</chunk>

Please give a short succinct context to situate this chunk within the overall document
for the purposes of improving search retrieval of the chunk.
Answer only with the succinct context and nothing else."""

def add_context_to_chunk(chunk: str, full_document: str) -> str:
    """Prepend an LLM-generated context to a chunk before embedding."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        system=[{
            "type": "text",
            "text": "You are a document indexing assistant.",
            "cache_control": {"type": "ephemeral"},   # cache the large document
        }],
        messages=[{
            "role": "user",
            "content": CONTEXT_PROMPT.format(
                full_document=full_document,
                chunk_text=chunk,
            ),
        }],
    )
    context_text = response.content[0].text.strip()
    return f"{context_text}\n\n{chunk}"

# Index a document with contextualised chunks
from langchain_core.documents import Document
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

full_doc = open("my_document.txt").read()
raw_chunks = ["chunk 1 text...", "chunk 2 text..."]  # your normal chunking output

contextualised_docs = [
    Document(page_content=add_context_to_chunk(chunk, full_doc))
    for chunk in raw_chunks
]

vectorstore = FAISS.from_documents(contextualised_docs, OpenAIEmbeddings())
```

**Prompt caching impact:** Use `cache_control: ephemeral` on the full document to avoid re-tokenizing it for every chunk. For a 100-page document with 500 chunks, caching reduces contextualisation cost by ~90%.

---

## Late Chunking (JinaAI, October 2024)

**Blog post:** JinaAI, "Late Chunking: Contextual Chunk Embeddings Using Long-Context Embedding Models" (October 2024)

Standard RAG chunks first, then embeds — so each chunk embedding is computed in isolation and loses document-level context. **Late Chunking** reverses this: embed the *entire* document first (using a long-context model), then pool the resulting token embeddings into chunk-level embeddings.

```
Standard:   [Chunk 1] → embed → [vec_1]
            [Chunk 2] → embed → [vec_2]    ← each chunk sees only itself
            [Chunk 3] → embed → [vec_3]

Late:       [Chunk 1 | Chunk 2 | Chunk 3]  ← full document fed to model
            ↓ (long-context transformer processes whole context)
            [tok₁, tok₂, ..., tok_n]       ← token embeddings with full context
            ↓ (mean-pool tokens per chunk boundary)
            [vec_1, vec_2, vec_3]           ← chunk vectors, each context-aware
```

Each chunk vector now encodes how that chunk relates to the rest of the document — without needing an LLM to write a context prefix.

```python
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np

# Use a long-context embedding model (jina-embeddings-v3 supports 8192 tokens)
model_name = "jinaai/jina-embeddings-v3"
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModel.from_pretrained(model_name, trust_remote_code=True)
model.eval()

def late_chunk_embed(full_document: str, chunk_boundaries: list[tuple[int, int]]) -> np.ndarray:
    """
    Embed a full document, then pool token embeddings per chunk.
    
    chunk_boundaries: list of (char_start, char_end) tuples for each chunk.
    """
    # Tokenize the full document
    encoded = tokenizer(
        full_document,
        return_tensors="pt",
        max_length=8192,
        truncation=True,
        return_offsets_mapping=True,
    )
    offset_mapping = encoded.pop("offset_mapping")[0].tolist()

    with torch.no_grad():
        outputs = model(**encoded)
    
    token_embeddings = outputs.last_hidden_state[0]  # [seq_len, hidden]

    chunk_vecs = []
    for char_start, char_end in chunk_boundaries:
        # Find which token indices cover this chunk's character range
        tok_indices = [
            i for i, (t_start, t_end) in enumerate(offset_mapping)
            if t_start >= char_start and t_end <= char_end and t_start < t_end
        ]
        if not tok_indices:
            # Fall back to full document embedding if no tokens in range
            vec = token_embeddings.mean(dim=0)
        else:
            vec = token_embeddings[tok_indices].mean(dim=0)
        
        # Normalise for cosine similarity
        vec = vec / (vec.norm() + 1e-9)
        chunk_vecs.append(vec.numpy())

    return np.array(chunk_vecs)   # [n_chunks, hidden_dim]

# Usage
text = open("my_document.txt").read()
chunks = ["first chunk text...", "second chunk text..."]

# Build character boundaries for each chunk
boundaries = []
offset = 0
for chunk in chunks:
    start = text.find(chunk, offset)
    if start == -1:
        start = offset
    end = start + len(chunk)
    boundaries.append((start, end))
    offset = end

# Late chunk embeddings — each vector "knows" its document context
chunk_embeddings = late_chunk_embed(text, boundaries)
```

**When to use Late Chunking:**
- Long documents where context is critical (legal, scientific, technical)
- Documents with co-references and implicit relationships across sections
- When you can't afford the LLM cost of Contextual Retrieval per chunk

**Trade-off:** Requires a long-context embedding model (BGE-M3, jina-embeddings-v3, Qwen3-Embedding). Not compatible with 512-token models.

---

## ColPali — Vision RAG for PDFs and Images (2024)

**Paper:** Faysse et al., "ColPali: Efficient Document Retrieval with Vision Language Models" (2024)  
**GitHub:** `illuin-tech/colpali`

Standard PDF parsing pipelines extract text from PDFs before embedding — losing tables, figures, charts, and the visual layout that carries meaning. ColPali embeds **page images** instead of extracted text, using a vision-language model to produce multi-vector (ColBERT-style) embeddings of each page.

```
Standard PDF RAG:
  PDF → Text extraction (pdfplumber/PyMuPDF) → Chunk text → Embed text → Vector store
  [loses tables, figures, visual layout, multi-column formatting]

ColPali:
  PDF → Render pages as images → PaliGemma VLM → multi-vector page embeddings
  [preserves everything — tables, charts, figures, handwriting]
```

ColPali uses **PaliGemma** (Google's vision-language model) as the document encoder and **ColBERT late interaction** for scoring — each page produces multiple patch embeddings, and retrieval scores each query token against each page patch.

```python
from colpali_engine.models import ColPali, ColPaliProcessor
from PIL import Image
import torch
import pdf2image

# Load ColPali model
model = ColPali.from_pretrained(
    "vidore/colpali-v1.2",
    torch_dtype=torch.bfloat16,
    device_map="cuda",
)
processor = ColPaliProcessor.from_pretrained("vidore/colpali-v1.2")

def embed_pdf_pages(pdf_path: str) -> list[torch.Tensor]:
    """Render each PDF page as an image and embed with ColPali."""
    images = pdf2image.convert_from_path(pdf_path, dpi=150)
    page_embeddings = []
    
    with torch.no_grad():
        for image in images:
            batch = processor.process_images([image]).to(model.device)
            embedding = model(**batch)   # [1, n_patches, hidden]
            page_embeddings.append(embedding[0].cpu())   # [n_patches, hidden]
    
    return page_embeddings

def score_query_against_pages(
    query: str,
    page_embeddings: list[torch.Tensor],
) -> list[float]:
    """Score query against all pages using ColBERT late interaction."""
    with torch.no_grad():
        batch_query = processor.process_queries([query]).to(model.device)
        query_embedding = model(**batch_query)[0].cpu()   # [n_query_tokens, hidden]
    
    scores = []
    for page_emb in page_embeddings:
        # ColBERT MaxSim: for each query token, max similarity over all page patches
        sim = torch.einsum("qh,ph->qp", query_embedding, page_emb)
        score = sim.max(dim=1).values.sum().item()   # sum of per-token max similarities
        scores.append(score)
    
    return scores

def colpali_retrieve(
    query: str,
    page_embeddings: list[torch.Tensor],
    top_k: int = 3,
) -> list[int]:
    """Return top-k page indices sorted by ColPali score."""
    scores = score_query_against_pages(query, page_embeddings)
    ranked = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)
    return ranked[:top_k]

# Index a PDF
page_embeddings = embed_pdf_pages("annual_report.pdf")

# Query
top_pages = colpali_retrieve("What was the revenue growth in Q3?", page_embeddings)
print(f"Most relevant pages: {[p+1 for p in top_pages]}")
```

**ColPali vs. OCR-based RAG:**

| Aspect | OCR Pipeline | ColPali |
|---|---|---|
| Tables | Loses structure | Preserves layout |
| Charts/figures | Cannot embed | Embedded as image patches |
| Multi-column PDFs | Often misread | Handled natively |
| Handwritten text | Poor OCR | Better with VLM |
| Processing cost | Low | High (GPU required) |
| Retrieval accuracy | Moderate | High for document-dense queries |
| Index size | Small (text only) | Large (multi-vector per page) |

**Best for:** Financial reports, scientific papers, slide decks, government documents — any structured PDF where tables and figures carry meaning.

---

## FLARE — Forward-Looking Active Retrieval

**Paper:** Jiang et al., "Active Retrieval Augmented Generation" (2023)

Unlike standard RAG which retrieves only once before generation, FLARE retrieves **iteratively during generation** — when the model is about to generate uncertain tokens, it pauses, retrieves more context, and continues.

**Algorithm:**
1. Generate text token-by-token (or sentence-by-sentence)
2. After each sentence, check confidence: if any token has probability < threshold, mark the sentence as "uncertain"
3. Use the uncertain sentence as a new retrieval query
4. Retrieve additional context
5. Regenerate the uncertain sentence with the new context
6. Continue

```python
from langchain.chains import FlareChain
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

llm = ChatOpenAI(model="gpt-4o", temperature=0)
vectorstore = FAISS.load_local("corpus", OpenAIEmbeddings())

flare = FlareChain.from_llm(
    llm=llm,
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
    max_generation_len=164,
    min_prob=0.2,   # retrieve when any token prob < 0.2
)

response = flare.invoke({"question": "Explain the history of quantum computing."})
```

**When FLARE is best:**
- Long-form generation requiring multiple facts
- Documents too large to retrieve all at once
- Topics where uncertainty is high (historical, technical)

---

## RAPTOR — Recursive Abstractive Processing for Tree-Organized Retrieval

**Paper:** Sarthi et al., "RAPTOR: Recursive Abstractive Processing for Tree-Organized Retrieval" (2024)

RAPTOR builds a **hierarchical tree** of summaries from the bottom up:

1. Chunk documents (leaf nodes)
2. Cluster semantically similar chunks
3. Summarize each cluster → intermediate nodes
4. Repeat clustering/summarizing on summaries → higher nodes
5. At retrieval time, search across all levels of the hierarchy

This allows retrieval of both fine-grained chunks (for specific facts) and high-level summaries (for abstract questions), in a single index.

```
                   [Root Summary]
                        │
          ┌─────────────┴─────────────┐
   [Cluster A Summary]        [Cluster B Summary]
          │                           │
   ┌──────┴──────┐             ┌──────┴──────┐
[Chunk 1]  [Chunk 2]       [Chunk 3]  [Chunk 4]
(leaf)     (leaf)          (leaf)     (leaf)

Retrieval searches all levels simultaneously:
  Abstract query → matches Root or Cluster summaries
  Specific query → matches leaf chunks directly
```

```python
from langchain_community.document_loaders import DirectoryLoader
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
import numpy as np
from sklearn.mixture import GaussianMixture

# Simplified RAPTOR cluster+summarize loop
def raptor_cluster_summarize(embeddings, texts, llm, level=0, max_levels=3):
    if level >= max_levels or len(texts) <= 1:
        return texts

    # Cluster
    n_clusters = max(1, len(texts) // 10)
    gm = GaussianMixture(n_components=n_clusters, covariance_type="full")
    labels = gm.fit_predict(embeddings)

    # Summarize each cluster
    summaries = []
    for cluster_id in range(n_clusters):
        cluster_texts = [t for t, l in zip(texts, labels) if l == cluster_id]
        summary = llm.invoke(f"Summarize these texts concisely:\n" + "\n---\n".join(cluster_texts))
        summaries.append(summary.content)

    # Recurse on summaries
    summary_embeddings = np.array([embed(s) for s in summaries])
    return texts + raptor_cluster_summarize(summary_embeddings, summaries, llm, level+1)
```

---

## Corrective RAG (CRAG)

**Paper:** Yan et al., "Corrective Retrieval Augmented Generation" (2024)

CRAG evaluates retrieval quality using a relevance classifier. If retrieved documents are irrelevant, it falls back to a web search (or alternative knowledge source) before generation.

```python
from langchain.schema import Document

def evaluate_relevance(query: str, docs: list[Document]) -> str:
    """Returns 'CORRECT', 'INCORRECT', or 'AMBIGUOUS'"""
    prompt = f"Question: {query}\nDocuments: {[d.page_content[:200] for d in docs]}\nAre these documents relevant? Answer: CORRECT, INCORRECT, or AMBIGUOUS."
    return llm.invoke(prompt).content.strip()

def crag_retrieve(query: str) -> list[Document]:
    docs = retriever.invoke(query)
    relevance = evaluate_relevance(query, docs)

    if relevance == "CORRECT":
        return docs
    elif relevance == "INCORRECT":
        # Fall back to web search
        return web_search_retriever.invoke(query)
    else:  # AMBIGUOUS
        # Combine both
        return docs + web_search_retriever.invoke(query)
```

---

## Cache-Augmented Generation (CAG)

**Technique introduced:** 2025. Alternative to RAG when the knowledge base is static and small enough to fit within the LLM's context window.

### Core Idea

Standard RAG retrieves a small slice of the knowledge base per query. CAG eliminates retrieval entirely: the **entire knowledge base** is loaded into the LLM's KV (key-value) cache **once at startup**. Every subsequent query reuses that cached state, appending only the user question.

```
RAG (per query):
  Query → embed → vector search → top-k chunks → LLM (new context every time)
  Latency per query: embedding (~10ms) + retrieval (~20ms) + LLM generation

CAG (startup + per query):
  Startup: system_prompt + ALL documents → KV cache (~2s fill time, once)
  Per query: append user question → reuse KV cache → LLM generation
  Latency per query: LLM generation only (~0ms retrieval)
```

### When CAG Works

CAG is not universally superior to RAG. It requires specific conditions:

- **Knowledge base is static** (or updated infrequently — cache rebuild on update)
- **Knowledge base fits in context window** (e.g., claude-sonnet-4-6 has 200K tokens — fits ~150K tokens of documents after prompt overhead)
- **Low latency is critical** — queries arrive frequently enough that the startup cost amortizes

### Architecture

```
  Startup (once)
  ┌────────────────────────────────────────────┐
  │  system_prompt                             │
  │  + document_1 (with cache_control)         │
  │  + document_2 (with cache_control)         │
  │  + ...                                     │
  │  + document_N (with cache_control)         │
  └────────────────┬───────────────────────────┘
                   │  LLM processes → KV cache saved
                   ▼
              [KV Cache]  ← stored in memory / on accelerator

  Per Query (many times, zero retrieval cost)
  ┌────────────────────────────────────────────┐
  │  [KV Cache]  (reused — not reprocessed)    │
  │  + user: "What is the refund policy?"      │
  └────────────────┬───────────────────────────┘
                   │
                   ▼
                Answer  (generation time only, no retrieval)
```

### Implementation with Anthropic SDK Prompt Caching

The Anthropic SDK's `cache_control` parameter marks content for KV caching. Place `cache_control: {"type": "ephemeral"}` on the last document block — the API caches everything up to and including that block.

```python
import anthropic

client = anthropic.Anthropic()

def build_cag_system(documents: list[str]) -> list[dict]:
    """
    Build a system prompt list with all documents marked for caching.
    The cache_control on the last block tells the API to cache the
    entire prefix (system prompt + all document blocks).
    """
    blocks = [
        {
            "type": "text",
            "text": (
                "You are a helpful assistant. Answer questions using only "
                "the documents below. If the answer is not in the documents, "
                "say so.\n\n"
            ),
        }
    ]

    for i, doc in enumerate(documents):
        block = {
            "type": "text",
            "text": f"<document index='{i+1}'>\n{doc}\n</document>\n\n",
        }
        # Add cache_control to the last document block only.
        # The API caches the entire prefix up to this point.
        if i == len(documents) - 1:
            block["cache_control"] = {"type": "ephemeral"}
        blocks.append(block)

    return blocks

def cag_query(question: str, system_blocks: list[dict]) -> str:
    """
    Send a query reusing the cached KV state.
    Only the user question is new — the full document set is served from cache.
    """
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system_blocks,      # cache hit on second+ call
        messages=[
            {"role": "user", "content": question}
        ],
    )
    # Check cache usage in response metadata
    usage = response.usage
    print(f"Cache read tokens: {getattr(usage, 'cache_read_input_tokens', 0)}")
    print(f"Cache write tokens: {getattr(usage, 'cache_creation_input_tokens', 0)}")
    return response.content[0].text

# --- Usage ---

# Load knowledge base (must fit in ~150K tokens for claude-sonnet-4-6)
documents = [
    open("policies/refund_policy.txt").read(),
    open("policies/shipping_policy.txt").read(),
    open("policies/privacy_policy.txt").read(),
    # ... up to ~150K tokens total
]

# One-time startup: build cached system blocks
# First call fills the cache (~2s), subsequent calls hit cache (~0ms overhead)
system_blocks = build_cag_system(documents)

# Serve many queries with zero retrieval latency
questions = [
    "What is the refund window for electronics?",
    "Do you ship internationally?",
    "How is my data used for marketing?",
]

for q in questions:
    answer = cag_query(q, system_blocks)
    print(f"Q: {q}\nA: {answer}\n")
```

### CAG vs. RAG — Decision Table

| Factor | CAG Wins | RAG Wins |
|---|---|---|
| Knowledge base size | Fits in context window (<150K tokens) | Larger than context window |
| Update frequency | Static or infrequent (daily/weekly) | Frequent (real-time, per-minute) |
| Query latency requirement | Strict (<100ms end-to-end) | Tolerant of retrieval overhead |
| Query volume | High — amortizes startup cost | Low — retrieval per query is fine |
| Precision | All documents always available | Only retrieved chunks sent to LLM |
| Cost per query | Low (cache hit is cheap) | Moderate (embedding + LLM) |
| Cold start | ~2s cache fill at startup | None (retrieval on demand) |
| Multi-tenant (per-user docs) | Poor — one cache per user | Good — query-time filtering |

**Rule of thumb:** if your knowledge base fits comfortably in the model's context window and changes less than once a day, CAG will outperform RAG on both latency and answer quality (no retrieval misses).

---

## Speculative RAG

**Paper:** Google DeepMind, "Speculative RAG: Enhancing Retrieval Augmented Generation through Drafting" (2024)

### Problem

Using a large LLM for both retrieval reasoning and final answer generation is expensive. Full pipeline: large LLM reads all retrieved documents, reasons over them, produces an answer. This is slow when the LLM is 70B+ parameters.

### Solution: Drafter-Verifier Architecture

A small **drafter** LLM (7B parameters) processes the retrieved documents and produces a candidate answer. A large **verifier** LLM sees only the candidate answer and key evidence — not the full retrieval — and revises or confirms.

```
                        User Query
                             │
                             ▼
                      [Retrieval System]
                             │ top-k chunks
                             ▼
              ┌──────────────────────────────┐
              │     Drafter LLM (small, 7B)  │
              │  Reads: query + all chunks   │
              │  Produces:                   │
              │    - candidate answer        │
              │    - key supporting evidence │
              │      (1-2 most relevant      │
              │       sentences)             │
              └──────────────┬───────────────┘
                             │ candidate + evidence
                             ▼
              ┌──────────────────────────────┐
              │   Verifier LLM (large, 70B+) │
              │  Reads: query +              │
              │         candidate answer +   │
              │         key evidence only    │
              │  (NOT the full doc set)      │
              │  Produces:                   │
              │    - confirmed answer, OR    │
              │    - corrected answer        │
              └──────────────┬───────────────┘
                             │
                             ▼
                        Final Answer
```

**Why this is ~4x faster:** The verifier (the expensive model) never processes the full retrieved context — only the short candidate + a few evidence sentences. The bulk of document reading is done by the cheap drafter.

### Code Sketch

```python
import anthropic

client = anthropic.Anthropic()

def speculative_rag(query: str, retrieved_chunks: list[str]) -> str:
    """
    Phase 1: small drafter produces candidate answer + selects key evidence.
    Phase 2: large verifier reviews and confirms or corrects.
    """
    context = "\n\n".join(f"[Chunk {i+1}]: {c}" for i, c in enumerate(retrieved_chunks))

    # --- Phase 1: Drafter ---
    drafter_prompt = f"""You are given a question and retrieved context.
Produce:
1. A candidate answer to the question
2. The 1-2 most relevant sentences from the context that support your answer

Question: {query}

Context:
{context}

Respond in this format:
CANDIDATE_ANSWER: <your answer>
KEY_EVIDENCE: <1-2 supporting sentences verbatim from context>"""

    draft_response = client.messages.create(
        model="claude-haiku-4-5-20251001",   # small/fast drafter
        max_tokens=512,
        messages=[{"role": "user", "content": drafter_prompt}],
    )
    draft_text = draft_response.content[0].text

    # Parse draft
    candidate_answer = ""
    key_evidence = ""
    for line in draft_text.splitlines():
        if line.startswith("CANDIDATE_ANSWER:"):
            candidate_answer = line.replace("CANDIDATE_ANSWER:", "").strip()
        elif line.startswith("KEY_EVIDENCE:"):
            key_evidence = line.replace("KEY_EVIDENCE:", "").strip()

    # --- Phase 2: Verifier ---
    verifier_prompt = f"""You are a fact-checking assistant. A smaller model produced a candidate answer.
Review it using only the provided evidence. Confirm if correct, or provide the correct answer.

Question: {query}
Candidate answer: {candidate_answer}
Supporting evidence: {key_evidence}

Provide the final, verified answer (concise):"""

    verify_response = client.messages.create(
        model="claude-opus-4-6",   # large/accurate verifier
        max_tokens=256,
        messages=[{"role": "user", "content": verifier_prompt}],
    )
    return verify_response.content[0].text

# Usage
chunks = retriever.invoke("What year was the transformer architecture introduced?")
chunk_texts = [c.page_content for c in chunks]
answer = speculative_rag("What year was the transformer architecture introduced?", chunk_texts)
```

### When to Use Speculative RAG

- Large LLM (70B+) is required for answer quality, but throughput is a concern
- Retrieved context is long (many chunks) — drafter reads all of it cheaply
- Answer verification is more important than generation from scratch (factual domains)

---

## STORM — Survey of the Topic via RAG Minds

**Paper:** Shao et al., Stanford NLP, "Assisting in Writing Wikipedia-like Articles From Scratch with Large Language Models" (2024)  
**Python package:** `knowledge-storm`

### Goal

STORM generates **comprehensive, well-structured long-form documents** (Wikipedia-quality articles, technical reports, competitive analyses) by simulating iterative research through multiple perspectives.

### Two-Phase Process

```
Phase 1: Pre-Writing (Outline + Evidence Gathering)
────────────────────────────────────────────────────────────

Topic
  │
  ▼
Identify N perspectives via few-shot prompting
  (e.g., for "Transformer Architecture":
    - ML researcher perspective
    - NLP practitioner perspective
    - Systems/efficiency perspective
    - Historical/origins perspective)
  │
  ▼
For each perspective:
  Simulate multi-turn Q&A dialog with retrieval system
  ┌─────────────────────────────────────────────┐
  │  Perspective agent asks: "What problem did  │
  │  transformers solve vs. RNNs?"              │
  │       ↓ retrieval                          │
  │  Perspective agent asks follow-up: "How    │
  │  does self-attention scale with length?"   │
  │       ↓ retrieval                          │
  │  ... (3-5 turns per perspective)           │
  └─────────────────────────────────────────────┘
  │
  ▼
Aggregate all Q&A exchanges → build hierarchical outline
  │
  ▼
Outline:
  1. Introduction
  2. Historical Context
     2.1 Limitations of RNNs
     2.2 Birth of the Attention Mechanism
  3. Architecture
     3.1 Self-Attention
     3.2 Multi-Head Attention
     ...


Phase 2: Writing (Section-by-Section Generation)
────────────────────────────────────────────────────────────

For each section in outline:
  ┌──────────────────────────────────────────────┐
  │  Retrieve: relevant passages for this section│
  │  Write: section content with citations       │
  │  Cite: source documents inline               │
  └──────────────────────────────────────────────┘
  │
  ▼
Final document: multi-section article with citations
(Wikipedia-quality, multi-source synthesized)
```

### Installation and Usage

```bash
pip install knowledge-storm
```

```python
from knowledge_storm import STORMWikiRunner, STORMWikiRunnerArguments
from knowledge_storm.rm import YouRM, BingSearch   # retrieval backends
from langchain_openai import ChatOpenAI

# Configure retrieval backend (use any search/retrieval API)
rm = YouRM(ydc_api_key="YOUR_KEY", k=5)   # or BingSearch, or custom

# Configure arguments
args = STORMWikiRunnerArguments(
    output_dir="./storm_output",
    max_conv_turn=3,          # Q&A turns per perspective
    max_perspective=5,        # number of perspectives to simulate
    search_top_k=5,           # docs retrieved per query
    max_thread_num=3,         # parallel perspective threads
)

# Initialize runner (uses GPT-4o by default; configurable)
runner = STORMWikiRunner(
    args=args,
    lm_configs=None,          # use defaults, or pass custom LM configs
    rm=rm,
)

# Run full STORM pipeline
topic = "Retrieval-Augmented Generation"
runner.run(
    topic=topic,
    do_research=True,         # Phase 1: outline + evidence
    do_generate_outline=True,
    do_generate_article=True, # Phase 2: write sections
    do_polish_article=True,   # Final: refine + add intro
)

runner.post_run()
runner.summary()
# Output: ./storm_output/Retrieval-Augmented_Generation/storm_gen_article.txt
```

### Connecting a Custom Retriever

```python
from knowledge_storm.interface import Retriever, Information

class CustomRetriever(Retriever):
    """Plug in your own RAG retrieval backend for STORM's Q&A simulation."""

    def __init__(self, vectorstore):
        self.vectorstore = vectorstore

    def retrieve(self, query: str, exclude_urls: list[str] = None) -> list[Information]:
        docs = self.vectorstore.similarity_search(query, k=5)
        results = []
        for doc in docs:
            results.append(Information(
                url=doc.metadata.get("source", "internal"),
                description=doc.metadata.get("title", ""),
                snippets=[doc.page_content],
                title=doc.metadata.get("title", "Document"),
            ))
        return results

# Use custom retriever
runner = STORMWikiRunner(args=args, lm_configs=None, rm=CustomRetriever(vectorstore))
runner.run(topic="Transformer Architecture", do_research=True, do_generate_article=True)
```

### When to Use STORM

| Use Case | STORM | Standard RAG |
|---|---|---|
| Research synthesis (competitive analysis) | Excellent | Poor |
| Technical report generation | Excellent | Poor |
| Wikipedia-style article creation | Excellent | Poor |
| Single factual question answering | Overkill | Appropriate |
| Real-time Q&A | Too slow (minutes) | Fast (seconds) |
| Exploratory research on a new topic | Excellent | Limited |

**Cost note:** STORM runs many LLM calls (N perspectives x T turns x sections). Expect 50-200 LLM calls per article. Use caching and cheaper models for the drafting steps.

---

## Technique Selection Guide

Use this table to choose the right advanced technique for a given scenario. Techniques in the same row are complementary — combine freely.

| Scenario | Recommended Advanced Technique |
|---|---|
| User query is vague or conversational | Query Rewriting |
| Query needs broader foundational context | Step-Back Prompting |
| Query has multiple distinct sub-questions | Query Decomposition |
| Single phrasing may miss relevant docs | Multi-Query / RAG-Fusion |
| Query style is very different from document style | HyDE |
| Fact-dense documents; need pinpoint retrieval | Proposition Indexing |
| Relevant information is spread across many chunks | RAPTOR (hierarchical summaries) |
| Knowledge base is static and fits in context window | Cache-Augmented Generation (CAG) |
| Large LLM is expensive; need throughput | Speculative RAG |
| Need to generate a long, multi-section report | STORM |
| Retrieved docs may be irrelevant | CRAG (web fallback) |
| Long-form generation with uncertain facts | FLARE (iterative retrieval) |
| PDFs with tables, figures, complex layouts | ColPali (vision RAG) |
| Mixed simple/complex queries | Adaptive RAG (classifier routing) |
| Production: general-purpose system | Query Rewriting + Hybrid Retrieval + Reranking |

---

## Advanced RAG Architecture Pattern

A production advanced RAG pipeline combining the above techniques:

```
User Query
    │
    ▼
┌──────────────────────────────────────┐
│  Pre-retrieval                       │
│  ① Query Rewriting (clean phrasing)  │
│  ② HyDE (doc-to-doc matching)        │
│  ③ Step-back (broader context)       │
│  ④ RAG-Fusion (N query variants)     │
│  ⑤ Sub-question decomposition        │
└──────────────────────────────────────┘
    │ 4-6 query variants + hypothetical doc
    ▼
┌──────────────────────────────────────┐
│  Retrieval                           │
│  Index type: Proposition or RAPTOR   │
│  Hybrid (dense + BM25 + RRF)         │
│  Retrieve top-30 per variant         │
└──────────────────────────────────────┘
    │ up to 150 candidates
    ▼
┌──────────────────────────────────────┐
│  Post-retrieval                      │
│  ① RRF fusion across query variants  │
│  ② Deduplication                     │
│  ③ Cross-encoder reranking           │
│  ④ Long-context reordering           │
│  ⑤ Contextual compression            │
└──────────────────────────────────────┘
    │ top-5 compressed chunks
    ▼
┌──────────────────────────────────────┐
│  Generation                          │
│  LLM with structured prompt          │
│  + citations from metadata           │
│  FLARE: re-retrieve on uncertainty   │
└──────────────────────────────────────┘
```

---

## See Also

- [Retrieval Strategies](../retrieval-strategies) — dense, sparse, hybrid, MMR, HyDE
- [Contextual Retrieval](../contextual-retrieval) — full deep-dive on prepending LLM-generated context to chunks
- [Agentic RAG](../agentic-rag) — Self-RAG, CRAG, tool-calling, and routing
- [Graph RAG](../graph-rag) — knowledge-graph-based retrieval for entity reasoning
- [Evaluation](../evaluation) — how to measure if advanced optimizations actually help
- [RAG Types](../rag-types) — interactive comparison of naive vs advanced vs agentic
