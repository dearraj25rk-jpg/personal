---
title: Vector Stores
description: Complete 2026 guide to vector databases for RAG — FAISS, Chroma, Pinecone, Weaviate, pgvector, Qdrant, LanceDB, MongoDB Atlas, Azure AI Search — index algorithms, hybrid search, filtering, scaling, and production trade-offs.
sidebar:
  order: 6
---

> **Current as of May 2026.** Ecosystem evolves quickly — verify version compatibility before production deployment.
>
> **Key 2026 trends:** Hybrid search (vector + keyword) is now the default expectation. Billion-vector deployments are common. Momentum is shifting toward extended relational databases (pgvector, pgvectorscale) instead of dedicated vector services for teams already running Postgres.

## What a Vector Store Does

A vector store indexes high-dimensional embedding vectors and efficiently answers **approximate nearest-neighbor (ANN)** queries: "given a query vector, find the top-k most similar vectors in the corpus."

Core operations:
- **Upsert:** add/update vectors with associated metadata and a document ID
- **Search:** given a query vector, return top-k nearest neighbors (with optional metadata filtering)
- **Delete:** remove vectors by ID

---

## Index Algorithms

Understanding the underlying algorithms helps you choose the right index type for your use case.

### Flat (Brute-force)

Computes exact cosine/L2 distance to every vector. No approximation → 100% recall.

$$\text{sim}(q, d_i) = \frac{q \cdot d_i}{\|q\| \|d_i\|}$$

**Complexity:** O(n·d) per query (n = corpus size, d = dimensions).  
**Use when:** Corpus < 100K vectors and recall must be 100%.

### IVF (Inverted File Index)

Divides vectors into k clusters (using k-means). At query time, search only the nearest `nprobe` clusters instead of all vectors.

- Training: k-means with k = `nlist` (typically $\sqrt{n}$)
- Query: find nearest `nprobe` clusters → search only those clusters
- Trade-off: `nprobe` controls recall-speed balance

**Complexity:** O(nprobe/nlist · n · d) — much faster than flat for large corpora.

### HNSW (Hierarchical Navigable Small Worlds)

Graph-based ANN algorithm. Builds a multi-layer graph where each node is connected to `M` nearest neighbors. Query traverses the graph greedily top-down.

- **M:** number of neighbors per node (32–64 typical)
- **efConstruction:** graph quality during build (higher = better quality, slower build)
- **ef:** search quality at query time (higher = better recall, slower query)

**Complexity:** O(log n) per query. Excellent recall (>99%) with fast queries. More memory than IVF.

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
    nlist=1024,    # number of clusters (≈ sqrt(n))
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

Chroma is the most popular choice for development and small-scale production. Zero infrastructure, no server required, good Python API.

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

Pinecone is the leading managed vector database — zero infrastructure, auto-scaling, pay-per-use. **Dedicated Read Nodes (DRN)** (December 2025) provide reserved hardware for predictable p99 latency on high-throughput workloads. Note: serverless tier is slower than pod-based — use pod-based (p2) for latency-critical applications.

```python
from pinecone import Pinecone, ServerlessSpec

pc = Pinecone(api_key="YOUR_KEY")

# Create serverless index
pc.create_index(
    name="rag-production",
    dimension=1024,
    metric="cosine",
    spec=ServerlessSpec(cloud="aws", region="us-east-1"),
)

index = pc.Index("rag-production")

# Upsert vectors with metadata
index.upsert(vectors=[
    {"id": "chunk_0", "values": embeddings[0].tolist(), "metadata": {"source": "doc1.pdf", "page": 1}},
    {"id": "chunk_1", "values": embeddings[1].tolist(), "metadata": {"source": "doc2.pdf", "page": 3}},
])

# Query with metadata filter
results = index.query(
    vector=query_embedding.tolist(),
    top_k=10,
    filter={"source": {"$eq": "doc1.pdf"}},   # Pinecone filter syntax
    include_metadata=True,
)

for match in results.matches:
    print(f"{match.score:.4f}: {match.metadata}")
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

Weaviate offers **hybrid search** (dense + BM25) natively, multi-modal support, and a GraphQL API.

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

pgvector adds vector similarity search to standard PostgreSQL. Best for teams already running Postgres who want to avoid a separate service.

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

---

## Qdrant

**Website:** [qdrant.tech](https://qdrant.tech)  
**Type:** Open-source (Rust) or managed cloud  
**License:** Apache 2.0

Qdrant is built in Rust for high performance. The **2025 Rust rewrite** delivered **4× faster writes and queries** compared to the earlier Python implementation. Supports **payload filtering** (metadata filters applied directly within the ANN search, not post-filter) and **sparse vectors** for hybrid retrieval.

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

## Comparison Summary

| Feature | FAISS | Chroma | Pinecone | Weaviate | pgvector | Qdrant |
|---|---|---|---|---|---|---|
| **Type** | Library | Embedded/server | Managed | OSS/managed | PostgreSQL ext | OSS/managed |
| **Max scale** | Unlimited (sharding) | ~1M | Unlimited | Unlimited | ~10M (w/ tuning) | Unlimited |
| **Native hybrid** | No | No | No | **Yes** | With ext | **Yes (sparse)** |
| **Metadata filter** | Post-hoc | Yes | Yes | Yes | SQL WHERE | In-index |
| **Multi-tenancy** | Manual | Manual | Namespaces | Multi-tenancy | Schema/RLS | Collections |
| **Self-host** | Yes | Yes | No | Yes | Yes | Yes |
| **Infrastructure** | None | None | SaaS | Docker/K8s | Postgres | Docker/K8s |
| **Best for** | Embedded, research | Dev, small prod | Managed prod | Hybrid search | Existing Postgres | High-perf prod |

---

## Choosing a Vector Store

```
Prototyping / small corpus (<100K):   Chroma (simplest)
Already have PostgreSQL:              pgvector (no new infra)
Managed cloud, large scale:           Pinecone (simplest ops)
Hybrid BM25+dense built-in:          Weaviate
Best raw performance, self-hosted:    Qdrant
Custom ANN research:                  FAISS (library)
```

---

---

## LanceDB

**Website:** lancedb.com  
**License:** Apache 2.0  
**Type:** Embedded columnar vector store — no server required  
**Built on:** Lance columnar format (Apache Arrow / DuckDB)

LanceDB (2023) is built for ML workflows: serverless, zero-infrastructure, git-like versioning, and SQL via DuckDB.

```
  WHY LANCEDB IS DIFFERENT:
  ─────────────────────────────────────────────────────────────
  ✓ Columnar storage — scans only the columns you need
  ✓ No server — embedded like SQLite, no Docker required
  ✓ Versioning — git-like history for your vector data
  ✓ DuckDB integration — SQL queries over vectors + metadata
  ✓ Multi-modal — stores images, audio alongside vectors
  ✓ Cloud-native — S3 / GCS / Azure Blob as native backends
```

```python
import lancedb
import numpy as np
import pandas as pd

db = lancedb.connect("./lancedb_data")   # or "s3://your-bucket/lancedb"

# Create from pandas DataFrame — HNSW index built automatically
data = pd.DataFrame({
    "id":     ["chunk_0", "chunk_1"],
    "text":   ["Refunds take 30 days.", "Shipping is 5-7 days."],
    "source": ["tos.pdf", "faq.pdf"],
    "vector": [np.random.rand(1024).tolist(), np.random.rand(1024).tolist()],
})
table = db.create_table("rag_docs", data=data, mode="overwrite")

# Vector search with SQL pre-filter
results = (
    table.search(query_embedding)
    .where("source = 'tos.pdf'")
    .limit(5)
    .to_pandas()
)

# Hybrid: vector + built-in FTS (BM25)
table.create_fts_index("text")
results = (
    table.search(query_embedding, query_type="hybrid")
    .rerank(query_string="refund policy")
    .limit(5)
    .to_pandas()
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

## Full Comparison (August 2025)

| Feature | FAISS | Chroma | Pinecone | Weaviate | pgvector | Qdrant | LanceDB | MongoDB Atlas | Azure AI Search |
|---|---|---|---|---|---|---|---|---|---|
| **Type** | Library | Embedded/server | Managed SaaS | OSS/managed | PG ext | OSS/managed | Embedded/cloud | Managed SaaS | Managed SaaS |
| **Max scale** | Unlimited | ~1M | Unlimited | Unlimited | ~10M (tuned) | Unlimited | Unlimited | Unlimited | Unlimited |
| **Native hybrid** | No | No | No | ✓ BM25+dense | With FTS | ✓ sparse+dense | ✓ FTS+vector | ✓ | ✓ + semantic rerank |
| **In-graph filter** | No | No | No | Partial | No | **Yes** | Pre-filter | Pre-filter | Post-filter |
| **Multi-tenancy** | Manual | Manual | Namespaces | Multi-tenant | Schema/RLS | Collections | Tables | Databases | Indexes |
| **Self-host** | Yes | Yes | No | Yes | Yes | Yes | Yes | No | No |
| **Versioning** | No | No | No | No | No | No | **Yes** | No | No |
| **SQL interface** | No | No | No | No | **Yes** | No | **DuckDB** | No | No |
| **Best for** | Research/embedded | Dev/prototyping | Managed prod | Hybrid search | Existing Postgres | High-perf prod | ML workflows | Existing MongoDB | Azure deployments |

---

## Choosing a Vector Store

```
  Prototyping / learning:
    → Chroma   (simplest, zero infrastructure)
    → LanceDB  (if you want SQL queries or versioning)

  Production, cloud-managed:
    → Pinecone Serverless  (simplest ops, no idle cost)
    → Qdrant Cloud         (best filtered search performance)

  Production, self-hosted:
    → Qdrant   (Rust, in-graph filtering, sparse+dense)
    → Weaviate (if native BM25+dense hybrid is required)

  Existing database integration:
    → pgvector            (already running PostgreSQL)
    → MongoDB Atlas       (already using MongoDB)
    → Azure AI Search     (Azure ecosystem, Azure OpenAI)

  ML / data science workflows:
    → LanceDB  (columnar, DuckDB, versioning, Arrow-native)

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
