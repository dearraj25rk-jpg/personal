---
title: Vector Stores
description: Complete May 2026 guide to vector databases for RAG — FAISS, Chroma, Pinecone, Weaviate, pgvector, pgvectorscale, Qdrant, LanceDB, MongoDB Atlas, Azure AI Search — index algorithms, hybrid search, quantization, multi-tenancy, filtering, billion-scale deployment, and production trade-offs.
sidebar:
  order: 6
---

> **Current as of May 2026.** Ecosystem evolves quickly — verify version compatibility before production deployment.
>
> **Key 2026 trends:** Hybrid search (vector + keyword) is now the default expectation. Billion-vector deployments are common. Momentum is shifting toward extended relational databases (pgvector, pgvectorscale) instead of dedicated vector services for teams already running Postgres. Sparse vector support is now native in major engines. Quantization (scalar, binary, product) is standard practice for controlling index RAM.

## What a Vector Store Does

A vector store indexes high-dimensional embedding vectors and efficiently answers **approximate nearest-neighbor (ANN)** queries: "given a query vector, find the top-k most similar vectors in the corpus."

Core operations:
- **Upsert:** add/update vectors with associated metadata and a document ID
- **Search:** given a query vector, return top-k nearest neighbors (with optional metadata filtering)
- **Delete:** remove vectors by ID

```
  HIGH-LEVEL ARCHITECTURE OF A VECTOR STORE
  ──────────────────────────────────────────────────────────────────────
  Application
      │
      │  embed(text) → float32[1024]
      ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  VECTOR STORE                                                   │
  │                                                                 │
  │  Upsert ──► Index (HNSW / IVF / DiskANN / Flat)               │
  │               │                                                 │
  │               ▼                                                 │
  │           Storage Layer (RAM / disk / columnar)                 │
  │               │                                                 │
  │  Query ──────►├── ANN search → candidate set                   │
  │               │                                                 │
  │               ├── Metadata filter (pre / in-graph / post)       │
  │               │                                                 │
  │               └── Return top-k (id, score, metadata, content)  │
  └─────────────────────────────────────────────────────────────────┘
```

---

## Index Algorithms

Understanding the underlying algorithms helps you choose the right index type for your use case.

### Flat (Brute-force)

Computes exact cosine/L2 distance to every vector. No approximation — 100% recall.

$$\text{sim}(q, d_i) = \frac{q \cdot d_i}{\|q\| \|d_i\|}$$

**Complexity:** O(n·d) per query (n = corpus size, d = dimensions).
**Use when:** Corpus < 100K vectors and recall must be 100%.

### IVF (Inverted File Index)

Divides vectors into k clusters (using k-means). At query time, search only the nearest `nprobe` clusters instead of all vectors.

- Training: k-means with k = `nlist` (typically sqrt(n))
- Query: find nearest `nprobe` clusters, then search only those clusters
- Trade-off: `nprobe` controls recall-speed balance

**Complexity:** O(nprobe/nlist · n · d) — much faster than flat for large corpora.

```
  IVF QUERY FLOW
  ─────────────────────────────────────────────────────────────────
  corpus (n vectors)
      │
      ▼  k-means training
  ┌───────────────────────────────────────────┐
  │  Cluster 0  │  Cluster 1  │ ... Cluster k │
  └───────────────────────────────────────────┘
      │
  query vector q
      │
      ▼  find nearest nprobe cluster centroids
  ┌──────────────┐  ┌──────────────┐
  │  Cluster 3   │  │  Cluster 7   │   ← only search these
  │  (closest)   │  │  (2nd close) │
  └──────────────┘  └──────────────┘
      │
      ▼  scan vectors in selected clusters only
  top-k results
```

### HNSW (Hierarchical Navigable Small Worlds)

Graph-based ANN algorithm. Builds a multi-layer graph where each node is connected to `M` nearest neighbors. Query traverses the graph greedily from coarser to finer layers.

- **M:** number of neighbors per node (32–64 typical)
- **efConstruction:** graph quality during build (higher = better quality, slower build)
- **ef:** search quality at query time (higher = better recall, slower query)

**Complexity:** O(log n) per query. Excellent recall (>99%) with fast queries. More memory than IVF.

```
  HNSW MULTI-LAYER GRAPH STRUCTURE
  ─────────────────────────────────────────────────────────────────
  Layer 2 (coarsest — few nodes, long-range connections):
      [A]─────────────────────[B]
       │                       │
       │                       │
  Layer 1 (medium density):
      [A]────[C]────[D]────[B]
              │      │
              │      │
  Layer 0 (base — all nodes, dense local connections):
      [A]─[E]─[C]─[F]─[D]─[G]─[B]─[H]─...
              ▲
          entry to fine search

  QUERY TRAVERSAL (greedy top-down):
  1. Enter at Layer 2 → find best neighbor → move
  2. Descend to Layer 1 → greedy search → narrow candidate
  3. Descend to Layer 0 → beam search with ef neighbors
  4. Return top-k from Layer 0 candidates
  ─────────────────────────────────────────────────────────────────
  Result: O(log n) traversal, >99% recall at typical ef settings
```

### DiskANN

DiskANN (Microsoft Research, 2019) is a graph-based ANN algorithm designed to store the graph on NVMe SSD rather than RAM, enabling billion-vector search on commodity hardware.

- Graph edges stored compressed on SSD; a beam-search cache keeps hot nodes in RAM
- 4–8 byte quantized vectors in memory for candidate generation; full vectors on disk for reranking
- Enables 1B vectors on a single node with 64GB RAM + NVMe SSD

---

## FAISS

**By:** Meta AI Research
**GitHub:** `facebookresearch/faiss`
**Type:** In-process library (not a server)

FAISS is the foundational ANN library — embedded directly in your application process. It's what most vector databases use internally.

### Index Types

| Index | When to use | Memory | Recall |
|---|---|---|---|
| `IndexFlatL2` | < 100K vectors, exact search | High | 100% |
| `IndexFlatIP` | Normalized cosine similarity, exact | High | 100% |
| `IndexIVFFlat` | 100K–10M vectors, moderate latency OK | Medium | 90–99% |
| `IndexIVFPQ` | >10M vectors, compressed, some recall loss | Low | 80–95% |
| `IndexHNSWFlat` | Fast low-latency queries, medium corpus | High | 95–99% |

```python
import faiss
import numpy as np

d = 768      # embedding dimension
n = 100_000  # corpus size

# Exact search (100% recall)
index_flat = faiss.IndexFlatIP(d)   # Inner product = cosine for normalized vectors

# HNSW (fast approximate)
index_hnsw = faiss.IndexHNSWFlat(d, 32)    # 32 = M parameter
index_hnsw.hnsw.efConstruction = 200
index_hnsw.hnsw.efSearch = 100             # quality of search at runtime

# IVF + PQ (large-scale, compressed)
quantizer = faiss.IndexFlatL2(d)
index_ivf_pq = faiss.IndexIVFPQ(
    quantizer, d,
    nlist=1024,    # number of clusters (approx sqrt(n))
    M=8,           # number of sub-quantizers
    nbits=8,       # bits per sub-quantizer
)
index_ivf_pq.train(corpus_embeddings)   # IVF and PQ require training!

# Add vectors
embeddings = np.random.rand(n, d).astype("float32")
faiss.normalize_L2(embeddings)            # normalize for cosine similarity
index_flat.add(embeddings)

# Search: top-5 most similar to query
query = np.random.rand(1, d).astype("float32")
faiss.normalize_L2(query)
distances, indices = index_flat.search(query, k=5)
# distances[0] = [0.98, 0.96, ...], indices[0] = [42, 17, ...]

# Persist
faiss.write_index(index_flat, "corpus.faiss")
index = faiss.read_index("corpus.faiss")
```

### FAISS with LangChain

```python
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")

# Build from documents
vectorstore = FAISS.from_documents(docs, embeddings)

# Save / load
vectorstore.save_local("faiss_index")
vectorstore = FAISS.load_local("faiss_index", embeddings, allow_dangerous_deserialization=True)

# Similarity search with scores
results = vectorstore.similarity_search_with_score("What is RAG?", k=5)
for doc, score in results:
    print(f"{score:.4f}: {doc.page_content[:80]}")

# Filtered search (metadata filter)
results = vectorstore.similarity_search(
    "refund policy", k=5,
    filter={"source": "terms_of_service.pdf"},
)
```

---

## Chroma

**Website:** [trychroma.com](https://www.trychroma.com)
**Type:** Embedded (in-process) or client-server
**License:** Apache 2.0
**Version:** Chroma v0.6+

Chroma is the most popular choice for development and small-scale production. Zero infrastructure, no server required, good Python API. Chroma v0.6 introduced a new storage backend and improved multi-collection performance.

```python
import chromadb
from chromadb.utils import embedding_functions

# Persistent local database
client = chromadb.PersistentClient(path="./chroma_db")

# Use any embedding function
ef = embedding_functions.SentenceTransformerEmbeddingFunction(
    model_name="BAAI/bge-large-en-v1.5"
)

collection = client.get_or_create_collection(
    name="my_rag_collection",
    embedding_function=ef,
    metadata={"hnsw:space": "cosine"},   # distance metric
)

# Add documents
collection.add(
    documents=["First chunk text", "Second chunk text"],
    metadatas=[{"source": "doc1.pdf", "page": 1}, {"source": "doc1.pdf", "page": 2}],
    ids=["chunk_0", "chunk_1"],
)

# Query with metadata filter
results = collection.query(
    query_texts=["What is the return policy?"],
    n_results=5,
    where={"source": "terms_of_service.pdf"},    # metadata filter
    include=["documents", "metadatas", "distances"],
)

print(results["documents"][0])    # list of top-5 matching chunks
```

**Limitations:**
- Single-node only (no distributed mode)
- Not designed for > 1M vectors
- No real-time deletion performance guarantees

---

## Pinecone

**Website:** [pinecone.io](https://pinecone.io)
**Type:** Fully managed cloud service
**License:** Proprietary (SaaS)

Pinecone is the leading managed vector database — zero infrastructure, auto-scaling, pay-per-use. **Dedicated Read Nodes (DRN)** (December 2025) provide reserved hardware for predictable p99 latency on high-throughput workloads. Pinecone serverless pricing is consumption-based (pay per query and storage byte), replacing the older pod-based pricing model.

Pinecone supports **sparse-dense hybrid queries** in a single index — pass both a dense vector and a sparse vector (e.g., from SPLADE or BM25) in one API call, and Pinecone internally fuses them.

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="YOUR_KEY")

# Create serverless index
pc.create_index(
    name="rag-production",
    dimension=1024,
    metric="dotproduct",   # required for sparse-dense hybrid
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)

index = pc.Index("rag-production")

# Upsert vectors with metadata
index.upsert(vectors=[
    {"id": "chunk_0", "values": embeddings[0].tolist(), "metadata": {"source": "doc1.pdf", "page": 1}},
    {"id": "chunk_1", "values": embeddings[1].tolist(), "metadata": {"source": "doc2.pdf", "page": 3}},
])

# Dense-only query with metadata filter
results = index.query(
    vector=query_embedding.tolist(),
    top_k=10,
    filter={"source": {"$eq": "doc1.pdf"}},   # Pinecone filter syntax
    include_metadata=True,
)

for match in results.matches:
    print(f"{match.score:.4f}: {match.metadata}")

# Sparse-dense hybrid query (requires dotproduct metric)
results = index.query(
    vector=dense_embedding.tolist(),
    sparse_vector={"indices": [101, 4502, 8901], "values": [0.72, 0.45, 0.38]},
    top_k=10,
    include_metadata=True,
)
```

**Namespaces:** Logical partitions within an index — useful for multi-tenant RAG:

```python
# Tenant isolation via namespaces
index.upsert(vectors=[...], namespace="tenant_abc")
results = index.query(vector=q_emb, top_k=5, namespace="tenant_abc")
```

---

## Weaviate

**Website:** [weaviate.io](https://weaviate.io)
**Type:** Open-source (self-host) or managed cloud
**License:** BSD-3
**Version:** Weaviate v1.27+

Weaviate offers **hybrid search** (dense + BM25) natively, multi-modal support, and a GraphQL API. Weaviate v1.27 introduced ACORN — a filtered HNSW algorithm that builds sub-graphs per filter, eliminating the recall degradation that affects standard post-filtered HNSW.

```python
import weaviate
from weaviate.classes.init import Auth
from weaviate.classes.query import MetadataQuery

client = weaviate.connect_to_weaviate_cloud(
    cluster_url="https://YOUR_CLUSTER.weaviate.network",
    auth_credentials=Auth.api_key("YOUR_KEY"),
)

collection = client.collections.get("Document")

# Hybrid search (dense + BM25)
results = collection.query.hybrid(
    query="refund policy",
    alpha=0.75,              # 0 = pure BM25, 1 = pure vector, 0.75 = mostly dense
    limit=5,
    return_metadata=MetadataQuery(score=True),
)

for obj in results.objects:
    print(obj.metadata.score, obj.properties["text"][:80])

client.close()
```

---

## pgvector (PostgreSQL Extension)

**GitHub:** `pgvector/pgvector`
**Type:** PostgreSQL extension
**License:** PostgreSQL License (permissive)
**Version:** pgvector 0.8+

pgvector adds vector similarity search to standard PostgreSQL. Best for teams already running Postgres who want to avoid a separate service.

### pgvector 0.8 — New Vector Types

pgvector 0.8 (2024) introduced three additional vector storage types alongside the original `vector` (float32):

| Type | Storage | Memory savings | Use case |
|---|---|---|---|
| `vector` | float32 (4 bytes/dim) | Baseline | General purpose |
| `halfvec` | float16 (2 bytes/dim) | 2x savings | Large corpora, modest recall loss |
| `bit` | 1 bit/dim | 32x savings | Binary embeddings, Hamming distance |
| `sparsevec` | sparse (index + value) | Varies | SPLADE / sparse model outputs |

```sql
-- Install extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table with embedding column
CREATE TABLE documents (
    id       BIGSERIAL PRIMARY KEY,
    content  TEXT,
    metadata JSONB,
    embedding VECTOR(1024)     -- BGE-large-en-v1.5 dimension
);

-- HNSW index for fast approximate search
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- IVFFlat index (alternative)
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
SET ivfflat.probes = 10;  -- quality/speed trade-off

-- Cosine similarity search with metadata filter
SELECT id, content, 1 - (embedding <=> $1) AS similarity
FROM documents
WHERE metadata->>'department' = 'legal'
ORDER BY embedding <=> $1   -- <=> = cosine distance operator
LIMIT 10;

-- pgvector 0.8: halfvec (2x memory savings, float16 storage)
CREATE TABLE documents_half (
    id        BIGSERIAL PRIMARY KEY,
    content   TEXT,
    embedding HALFVEC(1024)   -- half-precision float16
);
CREATE INDEX ON documents_half USING hnsw (embedding halfvec_cosine_ops);

-- pgvector 0.8: sparsevec for SPLADE/sparse model output
CREATE TABLE documents_sparse (
    id              BIGSERIAL PRIMARY KEY,
    content         TEXT,
    sparse_embedding SPARSEVEC(30522)   -- BERT vocab size
);
-- L2 distance on sparse vectors
SELECT id, sparse_embedding <-> $1 AS dist FROM documents_sparse ORDER BY dist LIMIT 10;
```

```python
# Python with psycopg3
import psycopg
import numpy as np

conn_str = "postgresql://user:pass@localhost/mydb"

def insert_chunk(content: str, embedding: np.ndarray, metadata: dict):
    with psycopg.connect(conn_str) as conn:
        conn.execute(
            "INSERT INTO documents (content, metadata, embedding) VALUES (%s, %s, %s)",
            (content, psycopg.types.json.Jsonb(metadata), embedding.tolist()),
        )

def search(query_embedding: np.ndarray, k: int = 5):
    with psycopg.connect(conn_str) as conn:
        rows = conn.execute(
            "SELECT content, metadata, 1-(embedding<=>%s) AS score FROM documents ORDER BY embedding<=>%s LIMIT %s",
            (query_embedding.tolist(), query_embedding.tolist(), k),
        ).fetchall()
    return rows
```

### pgvectorscale — DiskANN for PostgreSQL

**GitHub:** `timescale/pgvectorscale`
**By:** TimescaleDB (2024)
**Type:** PostgreSQL extension, companion to pgvector

pgvectorscale implements DiskANN for PostgreSQL, enabling billion-scale approximate nearest-neighbor search without requiring all vectors in RAM. Benchmarks show **28x faster query throughput** than pgvector HNSW on 1M+ vector corpora at equivalent recall.

Key properties:
- Graph stored on disk (NVMe SSD), not in RAM — enables billion-vector on a 64GB server
- Combines SSD-resident graph with a small in-memory cache for hot nodes
- Works alongside pgvector — both extensions can coexist in the same database
- Adds the `DiskANN` index type; drop-in replacement for `hnsw` in most queries

```sql
-- Requires pgvector to be installed first
CREATE EXTENSION IF NOT EXISTS vectorscale CASCADE;

-- Create DiskANN index (persists graph to disk, not RAM)
CREATE TABLE documents_large (
    id        BIGSERIAL PRIMARY KEY,
    content   TEXT,
    embedding VECTOR(1024)
);

CREATE INDEX ON documents_large
    USING diskann (embedding vector_cosine_ops);

-- Query is identical to pgvector — planner selects DiskANN index
SELECT id, content, 1 - (embedding <=> $1) AS score
FROM documents_large
ORDER BY embedding <=> $1
LIMIT 10;

-- Tune DiskANN build parameters for larger corpora
CREATE INDEX ON documents_large
    USING diskann (embedding vector_cosine_ops)
    WITH (
        num_neighbors = 50,     -- graph degree (higher = better recall, larger index)
        search_list_size = 100  -- beam width during build
    );
```

```
  pgvector vs pgvectorscale — 1M vectors benchmark
  ─────────────────────────────────────────────────────────────────
  Method              RAM used   QPS     Recall@10
  ─────────────────────────────────────────────────────────────────
  pgvector HNSW       ~4 GB      ~120    99.0%
  pgvectorscale       ~0.5 GB    ~3400   98.5%
  (DiskANN, NVMe)
  ─────────────────────────────────────────────────────────────────
  28x throughput improvement, 8x RAM reduction, ~0.5% recall loss.
  Source: TimescaleDB benchmark, 1M vectors, dim=1536, AWS r6id.2xl
```

---

## Qdrant

**Website:** [qdrant.tech](https://qdrant.tech)
**Type:** Open-source (Rust) or managed cloud
**License:** Apache 2.0
**Version:** Qdrant v1.13+

Qdrant is built in Rust for high performance. Supports **payload filtering** (metadata filters applied directly within the ANN search, not post-filter) and **named sparse vectors** for hybrid retrieval (store dense and sparse vectors as separate named fields per point).

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct, Filter, FieldCondition, MatchValue

client = QdrantClient("localhost", port=6333)

# Create collection
client.create_collection(
    collection_name="rag_docs",
    vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
)

# Insert with payload (metadata)
client.upsert(
    collection_name="rag_docs",
    points=[
        PointStruct(id=0, vector=embeddings[0].tolist(), payload={"source": "doc1.pdf", "page": 1}),
        PointStruct(id=1, vector=embeddings[1].tolist(), payload={"source": "doc2.pdf", "page": 3}),
    ],
)

# Filtered search — filter applied inside HNSW graph, not post-hoc
results = client.search(
    collection_name="rag_docs",
    query_vector=query_embedding.tolist(),
    query_filter=Filter(
        must=[FieldCondition(key="source", match=MatchValue(value="doc1.pdf"))]
    ),
    limit=5,
    with_payload=True,
)
```

---

## LanceDB

**Website:** lancedb.com
**GitHub:** `lancedb/lancedb`
**License:** Apache 2.0
**Type:** Embedded columnar vector store — no server required
**Built on:** Lance columnar format (Apache Arrow / DuckDB)

LanceDB is built for ML workflows: serverless, zero-infrastructure, columnar storage, git-like versioning, and SQL via DuckDB. Its key architectural difference from all other vector stores covered here is that it operates in **embedded mode** — there is no server process to manage, akin to SQLite for relational data.

### Why LanceDB is Architecturally Different

```
  TRADITIONAL VECTOR DB (server mode):
  ─────────────────────────────────────────────────────────────────
  Your App ──HTTP/gRPC──► Vector DB Server ──► Data on disk

  LANCEDB (embedded mode):
  ─────────────────────────────────────────────────────────────────
  Your App ──in-process──► LanceDB library ──► Lance files on disk
                                                (or S3 / GCS / Azure Blob)

  No network hop. No Docker. No port management.
  Like SQLite, but for vectors.
```

### Why Columnar Storage Matters for Filtered Search

Lance stores data in columnar format (Apache Arrow on disk). When you filter by a metadata column (e.g., `source = 'tos.pdf'`), the engine reads only that column — not all the vector data. This is why filtered search in LanceDB is up to **10x faster** than HNSW-only approaches when filters are selective.

```
  ROW STORE (traditional):
  ─────────────────────────────────────────────────────────────────
  Record 0: [id=0][source="tos.pdf"][vector: 1024 floats][text...]
  Record 1: [id=1][source="faq.pdf"][vector: 1024 floats][text...]
  ...
  Filter on "source": must scan all bytes of every row

  COLUMNAR STORE (Lance):
  ─────────────────────────────────────────────────────────────────
  source column: ["tos.pdf", "faq.pdf", "tos.pdf", ...]  ← read only this
  vector column: [[0.1, 0.2, ...], [0.3, ...], ...]       ← skip unless needed
  text column:   ["Refunds...", "Shipping...", ...]        ← skip unless needed

  Filter on "source": reads only the source column → matching row IDs
                      → ANN search on matching vectors only
```

### Code Examples

```python
import lancedb
import numpy as np
import pandas as pd

db = lancedb.connect("./lancedb_data")   # or "s3://your-bucket/lancedb"

# Create from pandas DataFrame — HNSW index built automatically on first query
data = pd.DataFrame({
    "id":     ["chunk_0", "chunk_1"],
    "text":   ["Refunds take 30 days.", "Shipping is 5-7 days."],
    "source": ["tos.pdf", "faq.pdf"],
    "vector": [np.random.rand(1024).tolist(), np.random.rand(1024).tolist()],
})
table = db.create_table("rag_docs", data=data, mode="overwrite")

# Vector search with SQL pre-filter (columnar scan, then ANN)
results = (
    table.search(query_embedding)
    .where("source = 'tos.pdf'")   # columnar pre-filter — reads source col only
    .limit(5)
    .to_pandas()
)

# Upsert (Lance supports versioned, append-only writes with compaction)
new_data = pd.DataFrame({
    "id":     ["chunk_2"],
    "text":   ["Exchanges require original packaging."],
    "source": ["tos.pdf"],
    "vector": [np.random.rand(1024).tolist()],
})
table.add(new_data)   # adds new version; old version still accessible

# Hybrid: vector + built-in FTS (BM25)
table.create_fts_index("text")
results = (
    table.search(query_embedding, query_type="hybrid")
    .rerank(query_string="refund policy")
    .limit(5)
    .to_pandas()
)

# Explicit HNSW index (optional — LanceDB auto-builds but you can tune)
table.create_index(
    metric="cosine",
    vector_column_name="vector",
    index_type="IVF_HNSW_SQ",   # IVF partitioning + HNSW + scalar quantization
    num_partitions=256,
    num_sub_vectors=96,
)
```

```python
# LangChain integration
from langchain_community.vectorstores import LanceDB

vectorstore = LanceDB.from_documents(
    documents=docs,
    embedding=embeddings,
    connection=db,
    table_name="rag_docs",
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
```

### Native Image and Multi-modal Support

Lance stores arbitrary binary data alongside vectors — including raw image bytes, audio, or video thumbnails. This makes LanceDB a natural fit for multi-modal RAG where you retrieve both text chunks and images from the same index.

```python
# Store image embeddings alongside binary image data
import PIL.Image
import io

def image_to_bytes(path: str) -> bytes:
    img = PIL.Image.open(path).resize((224, 224))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

data = pd.DataFrame({
    "id":     ["img_0"],
    "image":  [image_to_bytes("diagram.png")],   # raw bytes — Lance stores natively
    "caption": ["System architecture diagram"],
    "vector": [image_embedding.tolist()],
})
table = db.create_table("images", data=data)
```

### Trade-offs

```
  LANCEDB STRENGTHS:
  ─────────────────────────────────────────────────────────────────
  + Embedded — no server process, simple deployment
  + Columnar storage — fast filtered search
  + Cloud-native — S3/GCS/Azure Blob as native backend
  + Versioning — git-like history, time-travel queries
  + DuckDB integration — SQL over vector + metadata
  + Multi-modal — image/audio/binary data native

  LANCEDB LIMITATIONS:
  ─────────────────────────────────────────────────────────────────
  - Not designed for concurrent writes from multiple processes
    (single-writer model; reads are concurrent-safe)
  - No built-in server/multi-user access control
  - Smaller community than Chroma or Qdrant
  - Compaction needed for write-heavy workloads
    (Lance uses append-only files; run table.compact_files() periodically)
```

---

## Sparse Vector Support

Modern vector databases support **sparse vectors** natively, enabling true hybrid search in a single index pass — rather than running separate dense and sparse queries and fusing the results afterward.

Sparse vectors have thousands of dimensions (typically the vocabulary size: 30,000–50,000 for BERT-style models) but only a handful of non-zero entries per document. They are the output of models like SPLADE, ELSER (Elastic Learned Sparse Encoder), and TF-IDF.

```
  SPARSE vs DENSE VECTORS
  ─────────────────────────────────────────────────────────────────
  Dense vector (1024 dims — all non-zero):
  [0.12, -0.34, 0.89, 0.02, -0.56, 0.71, ...]  ← 1024 floats, all used

  Sparse vector (30522 dims — mostly zero):
  {101: 0.72, 4502: 0.45, 8901: 0.38, 12304: 0.21}
   ^^^        ^^^         ^^^         ^^^
   token IDs with non-zero weights (e.g., SPLADE output)
   Other 30,518 dimensions = 0 (not stored)
```

### Qdrant Named Vectors (Dense + Sparse per Point)

Qdrant v1.13+ stores multiple named vectors per point. You can store both a dense and a sparse vector for each document, then query both simultaneously for hybrid retrieval.

```python
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams, SparseVectorParams, Distance,
    PointStruct, SparseVector, NamedVector, NamedSparseVector
)

client = QdrantClient("localhost", port=6333)

# Collection with both dense and sparse named vectors
client.create_collection(
    collection_name="hybrid_docs",
    vectors_config={
        "dense": VectorParams(size=1024, distance=Distance.COSINE),
    },
    sparse_vectors_config={
        "sparse": SparseVectorParams(),   # sparse vector field
    },
)

# Upsert a point with both dense and sparse vectors
client.upsert(
    collection_name="hybrid_docs",
    points=[
        PointStruct(
            id=0,
            vector={
                "dense": dense_embedding.tolist(),
                "sparse": SparseVector(
                    indices=[101, 4502, 8901],     # non-zero dimension indices
                    values=[0.72, 0.45, 0.38],     # corresponding weights
                ),
            },
            payload={"source": "doc1.pdf", "page": 1},
        ),
    ],
)

# Hybrid query: dense + sparse in one request (fused server-side)
from qdrant_client.models import Prefetch, FusionQuery, Fusion

results = client.query_points(
    collection_name="hybrid_docs",
    prefetch=[
        Prefetch(
            query=NamedVector(name="dense", vector=query_dense.tolist()),
            limit=20,
        ),
        Prefetch(
            query=NamedSparseVector(
                name="sparse",
                vector=SparseVector(indices=query_sparse_indices, values=query_sparse_values),
            ),
            limit=20,
        ),
    ],
    query=FusionQuery(fusion=Fusion.RRF),  # fuse with RRF server-side
    limit=5,
)
```

### Elasticsearch Sparse Vector (ELSER / SPLADE)

Elasticsearch supports a `sparse_vector` field type that stores ELSER (Elastic Learned Sparse Encoder) or SPLADE outputs directly in the inverted index, enabling exact sparse retrieval without a separate BM25 index.

```python
# Index mapping with sparse_vector field
mapping = {
    "mappings": {
        "properties": {
            "content": {"type": "text"},
            "dense_embedding": {
                "type": "dense_vector",
                "dims": 1024,
                "index": True,
                "similarity": "cosine",
            },
            "sparse_embedding": {
                "type": "sparse_vector"  # ELSER / SPLADE output
            },
        }
    }
}

# Query using sparse_vector field (ELSER semantic tokens)
query = {
    "retriever": {
        "rrf": {
            "retrievers": [
                {"knn": {"field": "dense_embedding", "query_vector": query_dense, "k": 20}},
                {"sparse_vector": {"field": "sparse_embedding", "inference_id": "my_elser_model", "query": "refund policy"}},
            ]
        }
    }
}
```

---

## Quantization Deep Dive

Quantization compresses vector values to reduce index RAM. All major vector stores (Qdrant, Weaviate, Milvus, FAISS) support at least one form.

### Memory Formula

```
  INDEX RAM ESTIMATE:
  ─────────────────────────────────────────────────────────────────
  RAM = n_vectors × dims × bytes_per_value

  Example: 1M vectors, 1024 dims
  ─────────────────────────────────────────────────────────────────
  float32 (fp32):  1,000,000 × 1024 × 4 bytes  =  4,096 MB (~4 GB)
  float16 (fp16):  1,000,000 × 1024 × 2 bytes  =  2,048 MB (~2 GB)   [2x savings]
  int8    (SQ):    1,000,000 × 1024 × 1 byte   =  1,024 MB (~1 GB)   [4x savings]
  binary  (BQ):    1,000,000 × 1024 / 8 bytes  =    128 MB            [32x savings]

  Plus HNSW graph overhead: n_vectors × M × 8 bytes (M=32 typical)
  Graph:           1,000,000 × 32 × 8 bytes     =    256 MB
```

### Scalar Quantization (SQ8 / int8)

Converts each float32 value to an int8 (0–255) using per-dimension min/max calibration.

- Memory reduction: 4x (float32 → int8)
- Typical recall loss: ~1–2% at equivalent ef settings
- Supported by: Qdrant, Milvus, FAISS (SQ8), pgvector halfvec (SQ16)

```python
# Qdrant scalar quantization
from qdrant_client.models import ScalarQuantization, ScalarQuantizationConfig, ScalarType

client.create_collection(
    collection_name="rag_sq",
    vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
    quantization_config=ScalarQuantization(
        scalar=ScalarQuantizationConfig(
            type=ScalarType.INT8,
            quantile=0.99,      # ignore top 1% of values when calibrating range
            always_ram=True,    # keep quantized vectors in RAM even if full vecs are on disk
        )
    ),
)
```

### Binary Quantization (BQ)

Converts each float32 value to a single bit (sign bit only: positive → 1, negative → 0).

- Memory reduction: 32x (float32 → 1 bit per dimension)
- Typical recall loss: 5–15% — **requires rescoring** to recover quality
- Best with high-dimensional models (768+ dims) where many dimensions carry signal
- Supported by: Qdrant, Milvus, Weaviate (ACORN + BQ)

**Rescoring pattern:** After binary ANN search (fast, low RAM), re-score the top-N candidates using the full float32 vectors to recover recall:

```
  BINARY QUANTIZATION + RESCORING PIPELINE:
  ─────────────────────────────────────────────────────────────────
  Step 1: Binary ANN search (32x faster, 32x less RAM)
          retrieve top-200 candidates using Hamming distance

  Step 2: Re-score top-200 with full float32 vectors
          compute exact cosine similarity for 200 candidates only
          (200 × 4 KB each = 800 KB fetch vs full index RAM)

  Step 3: Return reranked top-k
  ─────────────────────────────────────────────────────────────────
  Net result: ~28x RAM savings, <2% recall loss, ~10x latency speedup
  (rescoring overhead is small: 200 exact dot products vs ANN on full index)
```

```python
# Qdrant binary quantization with rescoring
from qdrant_client.models import BinaryQuantization, BinaryQuantizationConfig

client.create_collection(
    collection_name="rag_bq",
    vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
    quantization_config=BinaryQuantization(
        binary=BinaryQuantizationConfig(always_ram=True),
    ),
)

# Query with rescoring (oversampling: fetch 4x candidates, rescore, return top-k)
results = client.search(
    collection_name="rag_bq",
    query_vector=query_embedding.tolist(),
    limit=5,
    search_params=SearchParams(
        quantization=QuantizationSearchParams(
            ignore=False,         # use binary quantization for ANN pass
            rescore=True,         # re-score with full float32 after
            oversampling=4.0,     # fetch 4 × k candidates before rescoring
        )
    ),
)
```

### Product Quantization (PQ)

Divides each vector into M equal-length sub-vectors (subspaces). Each subspace is independently quantized using a small codebook of 256 centroids (8 bits).

- Memory reduction: float32 → M × 1 byte, typically 16–32x reduction
- Recall: typically 80–95% depending on M and training data size
- Best for: very large corpora (>50M vectors) where even int8 is too large
- Requires training: must train the codebook on a sample of the corpus

```
  PRODUCT QUANTIZATION (M=8 subspaces, 1024-dim):
  ─────────────────────────────────────────────────────────────────
  Original vector: [dim_0 ... dim_127 | dim_128...dim_255 | ... | dim_896...dim_1023]
                   ^--- subspace 0 ---^ ^--- subspace 1 --^     ^--- subspace 7 ---^
                        128 dims             128 dims               128 dims

  For each subspace, train 256 centroids (codebook).
  Replace sub-vector with centroid index (1 byte).

  Compressed: 8 bytes per vector (one byte per subspace)
  vs 4096 bytes (float32, 1024 dims)  → 512x compression
  (actual PQ memory = n × M bytes; graph memory separate)
  ─────────────────────────────────────────────────────────────────
  Trade-off: lower M = higher compression, lower recall
             higher M = lower compression, higher recall
  Typical: M = dims/4 to dims/8 (M=8 to M=32 for 1024-dim)
```

---

## Filtered Search — Pre-filter vs Post-filter vs In-graph

Metadata filtering during ANN search is one of the hardest engineering problems in vector databases. The naive approaches both have serious drawbacks; modern engines solve this with in-graph filtering.

```
  THREE APPROACHES TO FILTERED ANN SEARCH
  ─────────────────────────────────────────────────────────────────

  1. POST-FILTERING (naive):
  ─────────────────────────────────────────────────────────────────
  corpus (all vectors)
      │
      ▼  ANN search (ignores filter)
  top-100 approximate neighbors
      │
      ▼  apply metadata filter
  survivors (may be << k if filter is strict)
      │
      ▼  return top-k ← PROBLEM: may return fewer than k results!

  Failure mode: if only 3 of 100 candidates pass the filter,
  you return 3 results when you wanted k=10.

  2. PRE-FILTERING (brute-force on subset):
  ─────────────────────────────────────────────────────────────────
  corpus (all vectors)
      │
      ▼  metadata filter (SQL scan or inverted index)
  matching subset (e.g., 5% of corpus)
      │
      ▼  ANN search on subset
      BUT: subset has no HNSW sub-graph → must do brute-force scan
      PROBLEM: O(n_filtered × d) — slow for large filtered sets

  3. IN-GRAPH FILTERING (Qdrant, Weaviate ACORN, Milvus):
  ─────────────────────────────────────────────────────────────────
  Build HNSW graph over full corpus.
  At query time, traverse graph greedily:
      at each node, only follow edges to nodes that PASS the filter.
      If a neighbor fails the filter, skip it and expand further.

  corpus with filter-aware graph traversal:
      query vector
          │
          ▼  enter top HNSW layer
     [A (pass)] ─── [B (fail, skip)] ─── [C (pass)]
          │                                   │
          ▼  descend, expanding around passing nodes only
     [D (pass)] ─── [E (pass)] ─── [F (fail, skip)]
          │
          ▼  collect top-k from passing nodes

  Result: k results guaranteed (unless corpus has fewer than k matching
  the filter). No recall degradation from strict filters.
  ─────────────────────────────────────────────────────────────────

  RECOMMENDATION:
  - Use an engine with in-graph filtering (Qdrant, Weaviate) for
    production filtered search.
  - Avoid post-filtering unless filters are loose (>50% pass rate).
  - Avoid brute-force pre-filtering unless filtered subset is tiny (<10K).
```

### When Each Approach Applies

| Approach | Pass rate needed | Recall guarantee | Latency |
|---|---|---|---|
| Post-filter | > 50% | No — may get < k results | Fast |
| Pre-filter (brute force) | Any | Yes | Slow (scales with subset size) |
| In-graph (ACORN, Qdrant) | Any | Yes | Fast (graph traversal) |

---

## Sparse Vector Support — Extended

*See also the Sparse Vector Support section above for Qdrant named vectors and Elasticsearch ELSER.*

### Why Native Sparse Support Matters

Before native sparse vector support, hybrid retrieval required:
1. Separate dense ANN search → top-100 candidates
2. Separate BM25/SPLADE search → top-100 candidates
3. Merge and deduplicate → 200 candidates
4. Fuse with RRF

With native sparse support, steps 1–3 run inside the engine in a single request, reducing network overhead and simplifying application code.

---

## Multi-tenancy Patterns

Multi-tenant RAG systems (e.g., a SaaS product where each customer has their own document set) require isolation between tenants. There are three architectural patterns:

```
  THREE MULTI-TENANCY ARCHITECTURES
  ─────────────────────────────────────────────────────────────────

  Pattern A: NAMESPACE PER TENANT
  ─────────────────────────────────────────────────────────────────
  Single index/collection
  ┌─────────────────────────────────────────────────────────┐
  │  Index: "rag-production"                                │
  │  ┌──────────────────┐  ┌──────────────────┐            │
  │  │ namespace: t_001 │  │ namespace: t_002 │  ...       │
  │  │ [vec0, vec1, ...]│  │ [vec0, vec1, ...]│            │
  │  └──────────────────┘  └──────────────────┘            │
  └─────────────────────────────────────────────────────────┘
  Query must specify namespace → physically separate segments
  Engines: Pinecone namespaces, Weaviate multi-tenancy shards

  + Fastest query isolation (each namespace is its own segment)
  + No cross-tenant data leakage
  - High index overhead: each namespace has its own HNSW graph
  - Thousands of namespaces can strain the engine

  Pattern B: COLLECTION PER TENANT
  ─────────────────────────────────────────────────────────────────
  Separate collection (table) per tenant
  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
  │ Collection     │  │ Collection     │  │ Collection     │
  │ tenant_001     │  │ tenant_002     │  │ tenant_003     │
  │ (own HNSW)     │  │ (own HNSW)     │  │ (own HNSW)     │
  └────────────────┘  └────────────────┘  └────────────────┘
  Engines: Qdrant collections, Chroma collections, LanceDB tables

  + Clean isolation — accidental cross-tenant access is impossible
  + Simple code: no filter needed, just select the right collection
  - Thousands of collections strain most engines (index memory per coll.)
  - Poor fit for >1000 tenants

  Pattern C: METADATA FILTERING (single index)
  ─────────────────────────────────────────────────────────────────
  Single collection, all tenants in one index
  ┌─────────────────────────────────────────────────────────┐
  │  Collection: "rag-all-tenants"                          │
  │  [id=0, tenant_id="t_001", vec=..., payload=...]       │
  │  [id=1, tenant_id="t_002", vec=..., payload=...]       │
  │  [id=2, tenant_id="t_001", vec=..., payload=...]       │
  │  ...                                                    │
  └─────────────────────────────────────────────────────────┘
  Query: ANN search + filter(tenant_id = "t_001")

  + Lowest infrastructure overhead: one index for all tenants
  + Easy to add new tenants (no schema changes)
  - Recall can degrade if filter is very strict (few docs per tenant)
    with post-filtering engines — use in-graph filtering (Qdrant) to avoid
  - Small risk of cross-tenant data leakage from application bugs
    (must enforce filter in every query)

  RECOMMENDATION:
  ─────────────────────────────────────────────────────────────────
  < 100 tenants, enterprise isolation required:  collection-per-tenant
  100–1000 tenants, moderate isolation:          namespace-per-tenant
  > 1000 tenants, SaaS scale:                   metadata filter + in-graph
                                                 filtering engine (Qdrant)
```

---

## Billion-Scale Deployment

Scaling beyond 50M vectors requires architectural changes beyond tuning a single-node HNSW index.

```
  SCALE TIERS AND RECOMMENDED APPROACHES
  ─────────────────────────────────────────────────────────────────
  < 50M vectors:
    Single-node HNSW (Qdrant, pgvector, Weaviate)
    Fits in RAM on 32–128 GB server
    Simple ops, excellent recall

  50M – 500M vectors:
    Sharded HNSW
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Shard 0  │  │ Shard 1  │  │ Shard 2  │
    │ HNSW     │  │ HNSW     │  │ HNSW     │
    │ (50M ea) │  │ (50M ea) │  │ (50M ea) │
    └──────────┘  └──────────┘  └──────────┘
         │               │              │
         └───────────────┼──────────────┘
                         ▼
                  merge top-k from each shard
                  (requires merge step: N × k candidates → final top-k)

  > 500M vectors:
    DiskANN (pgvectorscale, Milvus DiskANN mode, Qdrant on-disk)
    OR serverless (Pinecone, Weaviate Cloud)

    DiskANN architecture:
    ┌────────────────────────────────────────────────────────┐
    │  RAM (64 GB):                                          │
    │   Quantized vectors (int8) for candidate generation    │
    │   Hot-node cache (LRU, top ~5% of graph nodes)        │
    │                                                        │
    │  NVMe SSD (4 TB):                                      │
    │   Full float32 vectors for rescoring                   │
    │   HNSW-style graph (adjacency lists)                   │
    └────────────────────────────────────────────────────────┘
    Query: RAM-resident quant vectors guide graph traversal →
           SSD fetches full vectors for final rescoring
           → 1B vectors on a $3K server

  RULE OF THUMB:
  ─────────────────────────────────────────────────────────────────
  < 50M   → single-node HNSW in RAM
  50M–500M → sharded HNSW (horizontal scaling)
  > 500M   → DiskANN (disk-resident graph) or serverless
```

### Sharding — Merge Top-k

When querying N shards in parallel, each returns its local top-k. The merge step selects the global top-k:

```python
import asyncio
from typing import List

async def query_all_shards(
    shards: list,      # list of shard clients
    query_vector: list,
    k: int,
) -> list:
    # Query all shards in parallel
    results_per_shard = await asyncio.gather(
        *[shard.search(query_vector, k=k) for shard in shards]
    )
    # Flatten and sort by score — global top-k
    all_results = [item for shard_results in results_per_shard for item in shard_results]
    all_results.sort(key=lambda r: r.score, reverse=True)
    return all_results[:k]
```

---

## MongoDB Atlas Vector Search

**Website:** mongodb.com/atlas
**Type:** Managed cloud — add-on to existing MongoDB
**Key feature:** Vector search inside your existing MongoDB collections — no data migration

```python
from pymongo import MongoClient
import certifi

client = MongoClient("mongodb+srv://user:pass@cluster.mongodb.net/", tlsCAFile=certifi.where())
collection = client["rag_db"]["documents"]

# Insert document with embedding
collection.insert_one({
    "text":       "Refunds are processed within 30 days.",
    "source":     "tos.pdf",
    "department": "legal",
    "embedding":  embedding_vector.tolist(),
})

# $vectorSearch aggregation pipeline (index created once via Atlas UI)
results = collection.aggregate([
    {
        "$vectorSearch": {
            "index":          "vector_index",
            "path":           "embedding",
            "queryVector":    query_embedding.tolist(),
            "numCandidates":  100,
            "limit":          5,
            "filter":         {"department": "legal"},
        }
    },
    {"$project": {"text": 1, "source": 1, "score": {"$meta": "vectorSearchScore"}}},
])

for doc in results:
    print(f"{doc['score']:.4f}: {doc['text']}")
```

```python
# LangChain
from langchain_mongodb import MongoDBAtlasVectorSearch

vectorstore = MongoDBAtlasVectorSearch(
    collection=collection,
    embedding=embeddings,
    index_name="vector_index",
    text_key="text",
    embedding_key="embedding",
)
retriever = vectorstore.as_retriever(search_kwargs={"k": 5})
```

---

## Azure AI Search

**Website:** azure.microsoft.com/products/ai-services/ai-search
**Type:** Managed cloud (Azure)
**Key feature:** Vector + BM25 + Microsoft semantic reranking (cross-encoder) in a single service

The standard choice for Azure OpenAI deployments. Semantic reranking uses Microsoft's own cross-encoder and is included free up to 1000 queries/month.

```python
from azure.search.documents import SearchClient
from azure.search.documents.indexes import SearchIndexClient
from azure.search.documents.indexes.models import (
    SearchIndex, SimpleField, SearchableField, SearchField,
    SearchFieldDataType, VectorSearch,
    HnswAlgorithmConfiguration, VectorSearchProfile,
    SemanticConfiguration, SemanticPrioritizedFields, SemanticField, SemanticSearch,
)
from azure.search.documents.models import VectorizedQuery
from azure.core.credentials import AzureKeyCredential

endpoint = "https://YOUR_SERVICE.search.windows.net"
credential = AzureKeyCredential("YOUR_ADMIN_KEY")
index_name = "rag-index"

# Create index with vector + semantic config (run once)
index_client = SearchIndexClient(endpoint, credential)
index_client.create_or_update_index(SearchIndex(
    name=index_name,
    fields=[
        SimpleField(name="id", type=SearchFieldDataType.String, key=True),
        SearchableField(name="content", type=SearchFieldDataType.String),
        SimpleField(name="source", type=SearchFieldDataType.String, filterable=True),
        SearchField(
            name="embedding",
            type=SearchFieldDataType.Collection(SearchFieldDataType.Single),
            vector_search_dimensions=1024,
            vector_search_profile_name="hnsw-profile",
        ),
    ],
    vector_search=VectorSearch(
        algorithms=[HnswAlgorithmConfiguration(name="hnsw-algo", parameters={"m": 4, "efConstruction": 400})],
        profiles=[VectorSearchProfile(name="hnsw-profile", algorithm_configuration_name="hnsw-algo")],
    ),
    semantic_search=SemanticSearch(configurations=[
        SemanticConfiguration(
            name="semantic-config",
            prioritized_fields=SemanticPrioritizedFields(
                content_fields=[SemanticField(field_name="content")]
            ),
        )
    ]),
))

# Hybrid search: BM25 + vector + semantic reranking
search_client = SearchClient(endpoint, index_name, credential)
results = search_client.search(
    search_text="refund policy",           # BM25 query
    vector_queries=[
        VectorizedQuery(
            vector=query_embedding.tolist(),
            k_nearest_neighbors=50,
            fields="embedding",
        )
    ],
    query_type="semantic",
    semantic_configuration_name="semantic-config",
    filter="source eq 'tos.pdf'",
    top=5,
    select=["id", "content", "source"],
)
for result in results:
    print(f"Reranker: {result['@search.reranker_score']:.4f}: {result['content'][:80]}")
```

---

## Vector Store Comparison Matrix (May 2026)

| Feature | FAISS | Chroma v0.6 | Pinecone | Weaviate v1.27 | pgvector 0.8 | pgvectorscale | Qdrant v1.13 | LanceDB | MongoDB Atlas | Azure AI Search |
|---|---|---|---|---|---|---|---|---|---|---|
| **Type** | Library | Embedded/server | Managed SaaS | OSS/managed | PG ext | PG ext | OSS/managed | Embedded/cloud | Managed SaaS | Managed SaaS |
| **Max scale** | Unlimited (sharding) | ~1M | Unlimited | Unlimited | ~10M (tuned) | Unlimited (DiskANN) | Unlimited | Unlimited | Unlimited | Unlimited |
| **Native hybrid** | No | No | Sparse+dense | BM25+dense | With FTS ext | With FTS ext | Sparse+dense | FTS+vector | Yes | Yes + semantic |
| **Sparse vectors** | No | No | Yes | No | sparsevec type | No | Yes (named) | No | No | ELSER/SPLADE |
| **In-graph filter** | No | No | No | Yes (ACORN) | No | No | Yes | Pre-filter | Pre-filter | Post-filter |
| **Quantization** | SQ/PQ | No | Internal | BQ+PQ | halfvec/bit | Internal | SQ/BQ/PQ | SQ (IVF_HNSW_SQ) | Internal | Internal |
| **Multi-tenancy** | Manual | Manual | Namespaces | Shards/MT | Schema/RLS | Schema/RLS | Collections | Tables | Databases | Indexes |
| **Serverless** | No | No | Yes | Cloud | No | No | Cloud | S3/GCS | Yes | Yes |
| **Self-host** | Yes | Yes | No | Yes | Yes | Yes | Yes | Yes | No | No |
| **Versioning** | No | No | No | No | No | No | No | Yes | No | No |
| **SQL interface** | No | No | No | No | Yes (full SQL) | Yes (full SQL) | No | Yes (DuckDB) | No | No |
| **License** | MIT | Apache 2.0 | Proprietary | BSD-3 | PostgreSQL | Timescale | Apache 2.0 | Apache 2.0 | Proprietary | Proprietary |
| **Best for** | Research/embedded | Dev/prototyping | Managed prod | Hybrid search | Existing Postgres | Billion-scale PG | High-perf prod | ML workflows | Existing MongoDB | Azure ecosystem |

---

## Full Comparison (May 2026)

| Feature | FAISS | Chroma | Pinecone | Weaviate | pgvector | Qdrant | LanceDB | MongoDB Atlas | Azure AI Search |
|---|---|---|---|---|---|---|---|---|---|
| **Type** | Library | Embedded/server | Managed SaaS | OSS/managed | PG ext | OSS/managed | Embedded/cloud | Managed SaaS | Managed SaaS |
| **Max scale** | Unlimited | ~1M | Unlimited | Unlimited | ~10M (tuned) | Unlimited | Unlimited | Unlimited | Unlimited |
| **Native hybrid** | No | No | No | Yes BM25+dense | With FTS | Yes sparse+dense | Yes FTS+vector | Yes | Yes + semantic rerank |
| **In-graph filter** | No | No | No | Yes (ACORN) | No | Yes | Pre-filter | Pre-filter | Post-filter |
| **Multi-tenancy** | Manual | Manual | Namespaces | Multi-tenant | Schema/RLS | Collections | Tables | Databases | Indexes |
| **Self-host** | Yes | Yes | No | Yes | Yes | Yes | Yes | No | No |
| **Versioning** | No | No | No | No | No | No | Yes | No | No |
| **SQL interface** | No | No | No | No | Yes | No | Yes (DuckDB) | No | No |
| **Best for** | Research/embedded | Dev/prototyping | Managed prod | Hybrid search | Existing Postgres | High-perf prod | ML workflows | Existing MongoDB | Azure deployments |

---

## Choosing a Vector Store

```
  DECISION GUIDE — May 2026
  ─────────────────────────────────────────────────────────────────

  Prototyping / learning:
    → Chroma   (simplest, zero infrastructure)
    → LanceDB  (if you want SQL queries or versioning)

  Production, cloud-managed:
    → Pinecone Serverless  (simplest ops, no idle cost, sparse-dense hybrid)
    → Qdrant Cloud         (best filtered search performance, in-graph filters)

  Production, self-hosted:
    → Qdrant   (Rust, in-graph filtering, sparse+dense, quantization)
    → Weaviate (if native BM25+dense hybrid + ACORN in-graph filter is required)

  Existing database integration:
    → pgvector 0.8        (already running Postgres, < 10M vectors)
    → pgvectorscale       (already running Postgres, > 10M vectors, DiskANN)
    → MongoDB Atlas       (already using MongoDB)
    → Azure AI Search     (Azure ecosystem, Azure OpenAI, semantic reranking)

  ML / data science workflows:
    → LanceDB  (columnar, DuckDB, versioning, Arrow-native, multi-modal)

  Billion-scale (> 500M vectors):
    → pgvectorscale (DiskANN on NVMe, stays in Postgres)
    → Pinecone Serverless (auto-scales, no capacity planning)
    → Qdrant with on-disk payload + BQ (quantized, disk-resident)

  Maximum raw ANN performance research:
    → FAISS  (library, fine-tune every parameter)
    → Qdrant (production-grade Rust performance)
```

---

## See Also

- [Embedding Models](../embedding-models) — what generates the vectors stored here
- [Retrieval Strategies](../retrieval-strategies) — dense, sparse, hybrid, and reranking patterns
- [BM25 & Sparse Retrieval](../bm25-sparse-retrieval) — Qdrant sparse vectors, pgvector FTS
- [Production RAG](../production-rag) — caching, scaling, and cost optimization
