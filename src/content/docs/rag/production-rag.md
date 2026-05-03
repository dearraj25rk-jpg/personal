---
title: Production RAG
description: Operating RAG systems at scale — latency optimization, Anthropic prompt caching, semantic caching, vLLM, LiteLLM, async retrieval, cost control, W&B Weave observability, guardrails, and CI/CD for RAG pipelines.
sidebar:
  order: 13
---

> **Current as of May 2026.**

## Production RAG vs Prototype RAG

A RAG proof-of-concept works end-to-end in hours. A production RAG system must handle:

- **Latency SLAs:** p99 < 3 seconds for interactive applications
- **Cost at scale:** 1M queries/month at $0.001/query vs $0.10/query is a 100× cost difference
- **Reliability:** graceful degradation when retrieval returns poor results
- **Observability:** knowing *why* an answer was wrong
- **Safety:** preventing prompt injection, topic drift, and harmful outputs

---

## Latency Budget

Profile every step to find the bottleneck. A typical advanced RAG call:

| Step | Latency (p50) | Optimization target |
|---|---|---|
| Query embedding | 5–20 ms | GPU acceleration, cached |
| Vector search (HNSW) | 2–10 ms | Usually fast already |
| Reranking (cross-encoder) | 50–200 ms | Batch size, smaller model |
| LLM generation (gpt-4o) | 500–2000 ms | **Biggest bottleneck** |
| LLM generation (local) | 200–800 ms | GPU, quantization |

**Total:** typical end-to-end p50 is 800ms–3s. Most latency is in LLM generation.

---

## 1. Semantic Caching

Cache LLM responses for semantically similar (not just identical) queries. If a new query is within cosine distance threshold of a cached query, return the cached answer.

```python
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain.globals import set_llm_cache
from langchain_community.cache import GPTCache
from gptcache import cache
from gptcache.adapter.api import init_similar_cache

# Initialize semantic cache (uses FAISS internally)
init_similar_cache(
    data_manager_dir="./gptcache_data",
    threshold=0.85,   # cosine similarity threshold: queries above this share a cached response
)
set_llm_cache(GPTCache(init_similar_cache))

llm = ChatOpenAI(model="gpt-4o")

# First call: hits LLM (~800ms)
r1 = llm.invoke("What is BERT?")

# Semantically similar query: hits cache (<5ms)
r2 = llm.invoke("Can you explain what BERT is?")   # ← cache hit
r3 = llm.invoke("Describe the BERT model")          # ← cache hit
```

### Custom Redis Semantic Cache

For production multi-instance deployment, use Redis as the cache backend:

```python
from langchain_community.cache import RedisSemanticCache
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.globals import set_llm_cache

embedding = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

set_llm_cache(RedisSemanticCache(
    redis_url="redis://localhost:6379",
    embedding=embedding,
    score_threshold=0.2,  # Redis uses cosine distance (lower = more similar)
))
```

---

## 2. Embedding Cache

Caching query embeddings avoids re-encoding the same queries. Since embedding is fast, prioritize caching document corpus embeddings — recomputing 1M chunks on re-index is expensive.

```python
from langchain.storage import LocalFileStore
from langchain_community.embeddings import CacheBackedEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

base_embedder = HuggingFaceEmbeddings(model_name="BAAI/bge-large-en-v1.5")
store = LocalFileStore("./embedding_cache")

# Automatically caches embeddings by content hash
cached_embedder = CacheBackedEmbeddings.from_bytes_store(
    base_embedder,
    store,
    namespace=base_embedder.model_name,
)

# First call: computes embeddings
vstore = FAISS.from_documents(docs, cached_embedder)

# Re-run: loads from disk cache (near-zero cost)
vstore2 = FAISS.from_documents(docs, cached_embedder)
```

---

## 3. Async and Parallel Retrieval

For pipelines that search multiple sources (vector store + BM25 + web), run retrievals in parallel:

```python
import asyncio
from langchain_community.vectorstores import FAISS
from langchain_community.retrievers import BM25Retriever
from langchain.retrievers import EnsembleRetriever

async def parallel_retrieve(query: str) -> list:
    """Retrieve from multiple sources concurrently."""
    dense_task  = asyncio.create_task(vectorstore.asimilarity_search(query, k=10))
    sparse_task = asyncio.create_task(bm25_retriever.ainvoke(query))
    web_task    = asyncio.create_task(web_search_tool.ainvoke(query))

    dense_docs, sparse_docs, web_docs = await asyncio.gather(
        dense_task, sparse_task, web_task,
        return_exceptions=True,  # don't fail everything if one source fails
    )

    # Handle exceptions gracefully
    all_docs = []
    for result in [dense_docs, sparse_docs, web_docs]:
        if isinstance(result, Exception):
            continue   # skip failed sources
        all_docs.extend(result)

    return deduplicate(all_docs)
```

### Async LangChain Chain

```python
from langchain_core.runnables import RunnableParallel

# Run retrieval and query rewriting in parallel
parallel_steps = RunnableParallel(
    docs=retriever,
    rewritten_query=rewrite_chain,
)

chain = parallel_steps | combine_and_generate

# Async streaming
async for chunk in chain.astream("What is the refund policy?"):
    print(chunk, end="", flush=True)
```

---

## 4. Streaming Responses

Never make users wait for the full response when streaming is available:

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import sys

llm = ChatOpenAI(model="gpt-4o", streaming=True)

rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()}
    | ChatPromptTemplate.from_template(
        "Answer based on context:\n\n{context}\n\nQuestion: {question}"
    )
    | llm
    | StrOutputParser()
)

# Stream tokens as they arrive
for token in rag_chain.stream("What is HNSW?"):
    sys.stdout.write(token)
    sys.stdout.flush()
```

---

## 5. Cost Optimization

### Model Tiering

Route queries to cheaper models when expensive models are unnecessary:

```python
from langchain_openai import ChatOpenAI

def tiered_llm(query: str, context: str) -> str:
    # Classify query complexity
    complexity_score = estimate_complexity(query)

    if complexity_score < 0.4:
        # Simple factual → cheap fast model
        llm = ChatOpenAI(model="gpt-4o-mini")
    elif complexity_score < 0.8:
        # Medium → balanced model
        llm = ChatOpenAI(model="gpt-4o")
    else:
        # Complex reasoning → best model
        llm = ChatOpenAI(model="o3")

    return llm.invoke(f"Context: {context}\n\nQuestion: {query}").content
```

### Chunk Size vs Cost Trade-off

Smaller chunks → smaller context window → fewer tokens → lower cost. But too small loses context. Use `k × chunk_size` to estimate token cost:

```python
# Cost estimation
def estimate_cost(
    chunks: list[str],
    k: int = 5,
    model: str = "gpt-4o",
    queries_per_day: int = 10_000,
) -> float:
    avg_chunk_tokens = sum(len(c.split()) * 1.3 for c in chunks[:100]) / min(100, len(chunks))
    tokens_per_query = k * avg_chunk_tokens + 500  # 500 for prompt + question
    tokens_per_day   = tokens_per_query * queries_per_day
    # gpt-4o: $2.50/1M input tokens, $10/1M output tokens
    input_cost_per_day = (tokens_per_day / 1_000_000) * 2.50
    return input_cost_per_day

print(f"Estimated input cost/day: ${estimate_cost(chunks, k=5):.2f}")
```

---

## 6. Observability with LangSmith

LangSmith traces every LangChain call — inputs, outputs, latency, token counts, nested chains:

```python
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"]    = "YOUR_KEY"
os.environ["LANGCHAIN_PROJECT"]    = "my-rag-production"

# No code change needed — LangChain auto-reports to LangSmith
result = rag_chain.invoke("What is the warranty period?")

# In LangSmith UI you'll see:
# - Retrieval: 3 chunks retrieved (with content)
# - Total tokens: 1,847
# - Latency breakdown: 12ms embed + 8ms search + 950ms LLM
# - Full prompt sent to LLM
# - Model temperature, model name
```

### Custom Spans

```python
from langsmith import traceable

@traceable(name="custom_rerank", tags=["retrieval"])
def rerank_with_tracing(query: str, docs: list, top_n: int = 5) -> list:
    scores = cross_encoder.predict([(query, d.page_content) for d in docs])
    ranked = sorted(zip(docs, scores), key=lambda x: x[1], reverse=True)
    return [d for d, _ in ranked[:top_n]]
```

---

## 7. Phoenix Arize (Open-source Observability)

Free alternative to LangSmith, with built-in RAGAS-style evaluation in the UI:

```python
import phoenix as px
from phoenix.trace.langchain import LangChainInstrumentor
from openinference.instrumentation.langchain import LangChainInstrumentor as OILangChainInstrumentor

session = px.launch_app()  # opens http://localhost:6006

LangChainInstrumentor().instrument()

# Every RAG call is now traced
result = rag_chain.invoke("How does hybrid search work?")

# Phoenix shows:
# - Span tree: chain → retrieval → LLM
# - Embeddings visualized in 2D (UMAP)
# - Token-level latency heatmaps
```

---

## 8. Guardrails

### Input Guardrails (prompt injection prevention)

```python
from guardrails import Guard
from guardrails.hub import DetectPII, ToxicLanguage

guard = Guard().use(DetectPII, pii_entities=["EMAIL_ADDRESS", "PHONE_NUMBER"])

def safe_rag(query: str) -> str:
    # Validate input
    result = guard.validate(query)
    if not result.validation_passed:
        return "I cannot process requests containing personal information."

    # Check for prompt injection patterns
    injection_patterns = [
        "ignore previous instructions",
        "disregard all prior",
        "you are now",
        "forget everything",
    ]
    if any(p in query.lower() for p in injection_patterns):
        return "I cannot process that request."

    return rag_chain.invoke(query)
```

### Output Guardrails (hallucination check)

```python
def rag_with_grounding_check(query: str) -> str:
    docs = retriever.invoke(query)
    context = "\n\n".join([d.page_content for d in docs])
    answer = llm.invoke(f"Context:\n{context}\n\nQuestion: {query}").content

    # Verify every claim in the answer is in the context
    check_prompt = f"""
    Context: {context}
    Answer: {answer}
    
    Is every factual claim in the answer directly supported by the context?
    If any claim is NOT supported, list it. If all are supported, say "GROUNDED".
    """
    verification = llm.invoke(check_prompt).content

    if "GROUNDED" not in verification:
        # Fall back to a conservative answer
        return "Based on available information: " + conservative_answer(query, docs)

    return answer
```

---

## 9. Re-indexing Strategy

Plan for your corpus to change:

| Strategy | When to use | Trade-off |
|---|---|---|
| Full re-index | Weekly, or when embedding model changes | Simple, consistent |
| Incremental (upsert new docs) | Daily or event-driven | Faster, but stale deletions |
| Dual-index | Zero-downtime re-index | Complex, requires swap logic |

```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

async def reindex_job():
    """Runs nightly to pick up new documents."""
    new_docs = fetch_documents_updated_since(last_run_time())
    if not new_docs:
        return
    chunks = splitter.split_documents(new_docs)
    vectorstore.add_documents(chunks)
    log_reindex(len(chunks))

scheduler.add_job(reindex_job, "cron", hour=2, minute=0)  # 2AM nightly
scheduler.start()
```

---

## 10. CI/CD for RAG

Prevent regressions by running RAGAS metrics on every deployment:

```yaml
# .github/workflows/rag-eval.yml
name: RAG Evaluation

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt
      - name: Run RAGAS Evaluation
        run: python scripts/eval_rag.py --output results.json
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      - name: Assert Thresholds
        run: |
          python - <<'EOF'
          import json
          results = json.load(open("results.json"))
          assert results["faithfulness"]    >= 0.85, f"Faithfulness below threshold: {results['faithfulness']}"
          assert results["answer_relevancy"] >= 0.80, f"Answer relevancy below threshold: {results['answer_relevancy']}"
          assert results["context_precision"] >= 0.75, f"Context precision below threshold: {results['context_precision']}"
          print("All evaluation thresholds passed!")
          EOF
```

---

## Production Checklist

- [ ] Embedding model pinned to a specific version (model drift = index invalidation)
- [ ] Vector index persisted and backed up
- [ ] Semantic cache deployed (Redis/GPTCache)
- [ ] Async retrieval implemented
- [ ] Response streaming enabled
- [ ] LangSmith or Phoenix tracing active
- [ ] RAGAS evaluation in CI/CD pipeline
- [ ] Input validation and prompt injection detection
- [ ] Output grounding verification
- [ ] Fallback responses for retrieval failures
- [ ] Cost monitoring and alerting
- [ ] Nightly re-indexing job

---

---

## 11. Anthropic Prompt Caching

Prompt caching dramatically reduces cost and latency when the same large context (system prompt, documents, few-shot examples) is reused across queries.

**2026 updates:**
- **Workspace-level isolation** (February 2026): caches are now isolated per API workspace — data never bleeds between workspaces within the same org
- **1-hour cache duration** available at 2× the write price (vs. 5-min at 1.25×)
- **Automatic caching**: Anthropic now automatically caches system prompt static parts without requiring explicit `cache_control` markers
- **Latency reduction**: up to **85%** for long prompts (100K-token example: 11.5s → 2.4s)

**Cache pricing (all active Claude models):**

| Cache type | Write price | Read price |
|---|---|---|
| Standard (5-min TTL) | 1.25× base input | 0.10× base input |
| Extended (1-hour TTL) | 2.00× base input | 0.10× base input |

```
  WITHOUT CACHING:
  ─────────────────────────────────────────────────────────────
  Query 1: system_prompt (2000 tok) + docs (8000 tok) + question (50 tok)
  Query 2: system_prompt (2000 tok) + docs (8000 tok) + question (48 tok)
  Query 3: system_prompt (2000 tok) + docs (8000 tok) + question (55 tok)

  Total input billed: 3 × 10,050 = 30,150 tokens at full price

  WITH CACHING (mark first 10,000 tokens as cacheable):
  ─────────────────────────────────────────────────────────────
  Query 1: 10,000 tokens (cache WRITE) + 50 tokens = 10,050 tokens billed
  Query 2: 50 tokens (cache HIT, 10,000 at 10% = 1,000 effective) + 48 tokens
  Query 3: 50 tokens (cache HIT) + 55 tokens

  Savings on queries 2+: ~90% reduction on the cached portion
```

```python
import anthropic

client = anthropic.Anthropic()

# Pattern 1: Cache the system prompt + retrieved documents
def rag_with_caching(question: str, context_docs: list[str]) -> str:
    context = "\n\n---\n\n".join(context_docs)

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=[
            {
                "type": "text",
                "text": "You are a precise document assistant. Answer questions using only the provided context. Cite sources.",
                "cache_control": {"type": "ephemeral"},   # cache system prompt (5-min TTL)
            }
        ],
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"<context>\n{context}\n</context>",
                        "cache_control": {"type": "ephemeral"},   # cache the retrieved docs
                    },
                    {
                        "type": "text",
                        "text": f"Question: {question}",
                    },
                ],
            }
        ],
    )

    # Check cache performance
    usage = response.usage
    print(f"Cache read tokens:  {usage.cache_read_input_tokens}")
    print(f"Cache write tokens: {usage.cache_creation_input_tokens}")
    print(f"New input tokens:   {usage.input_tokens}")

    return response.content[0].text


# Pattern 2: Cache a large static knowledge base (batch RAG)
# When the same corpus is queried repeatedly, cache the entire corpus
def batch_rag_with_cached_corpus(
    questions: list[str],
    corpus: str,   # entire knowledge base as text
) -> list[str]:
    answers = []
    for i, question in enumerate(questions):
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"<knowledge_base>\n{corpus}\n</knowledge_base>",
                        "cache_control": {"type": "ephemeral"},   # cached after first call
                    },
                    {
                        "type": "text",
                        "text": f"Question: {question}",
                    },
                ],
            }],
        )
        answers.append(response.content[0].text)
        if i == 0:
            print(f"Cache written: {response.usage.cache_creation_input_tokens} tokens")
        else:
            print(f"Cache hit: {response.usage.cache_read_input_tokens} tokens reused")
    return answers
```

**Cost impact example:** A RAG system with 10k token context, 10k queries/day:
```
  Without caching: 10k × 10k tok × $3/1M = $300/day
  With caching:    10k × (10k × $0.30/1M + 50 × $3/1M) = ~$31.50/day
  Savings: ~$268.50/day (89%)
```

---

## 12. vLLM — High-Throughput Self-Hosted Inference

**GitHub:** `vllm-project/vllm`  
**Website:** vllm.ai

vLLM is the default inference engine for self-hosted LLMs in production. **V1 architecture** (default since v0.8.0, January 2025) rewrote the core engine into a multi-process design with scheduler, engine core, and GPU workers communicating via ZeroMQ — delivering up to **1.7× higher throughput** over the original. **Model Runner V2 (MRV2)** (March 2026) further optimizes block tables and M-RoPE.

**Proven at scale:** Stripe (73% inference cost reduction, 50M daily API calls on 1/3 the GPU fleet), Amazon Rufus (250M customers), Roblox (4B tokens/week).

**Hardware support:** NVIDIA GPUs, AMD GPUs, x86/ARM CPUs, Google TPUs, Intel Gaudi, Apple Silicon, and more.

```python
# Start vLLM server (run in terminal)
# vllm serve meta-llama/Llama-3.1-8B-Instruct --port 8000

# Use via OpenAI-compatible API
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8000/v1",
    api_key="not-needed",  # vLLM doesn't require a key by default
)

def rag_with_vllm(question: str, context: str) -> str:
    response = client.chat.completions.create(
        model="meta-llama/Llama-3.1-8B-Instruct",
        messages=[
            {"role": "system", "content": "Answer using only the provided context."},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
        ],
        temperature=0,
        max_tokens=512,
    )
    return response.choices[0].message.content

# Streaming (for UI)
def rag_stream_vllm(question: str, context: str):
    stream = client.chat.completions.create(
        model="meta-llama/Llama-3.1-8B-Instruct",
        messages=[
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
        ],
        stream=True,
        max_tokens=512,
    )
    for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
```

**vLLM throughput vs. naive HuggingFace (Llama 3.1 8B, A100):**
```
  HuggingFace Transformers:      ~20 tokens/sec   (1 request)
  vLLM V0 (continuous batching): ~500 tokens/sec  (concurrent requests)
  vLLM V1 (ZeroMQ, default):    ~850 tokens/sec  (1.7× V0 improvement)
  vLLM + speculative decoding:   ~1100 tokens/sec (with draft model)
```

---

## 13. LiteLLM — Unified Multi-Provider API

**GitHub:** `BerriAI/litellm`  
**Website:** litellm.ai

LiteLLM gives you a single OpenAI-compatible API across 100+ LLM providers — swap between Anthropic, OpenAI, Cohere, vLLM, and others without changing application code. Critical for cost optimization and provider fallback.

```python
from litellm import completion
import litellm

# Enable cost tracking and fallback logging
litellm.success_callback = ["langfuse"]   # observability

# Single interface for all providers
def rag_generate(question: str, context: str, model: str = "claude-sonnet-4-6") -> str:
    response = completion(
        model=model,
        messages=[
            {"role": "system", "content": "Answer using only the provided context."},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
        ],
        temperature=0,
        max_tokens=512,
    )
    return response.choices[0].message.content


# Automatic fallback: try primary, fall back to secondary on failure/timeout
from litellm import Router

router = Router(
    model_list=[
        {
            "model_name": "primary",
            "litellm_params": {
                "model": "claude-sonnet-4-6",
                "api_key": "YOUR_ANTHROPIC_KEY",
            },
        },
        {
            "model_name": "primary",              # same name = fallback pool
            "litellm_params": {
                "model": "gpt-4o",
                "api_key": "YOUR_OPENAI_KEY",
            },
        },
        {
            "model_name": "cheap",
            "litellm_params": {
                "model": "claude-haiku-4-5-20251001",
                "api_key": "YOUR_ANTHROPIC_KEY",
            },
        },
    ],
    fallbacks=[{"primary": ["cheap"]}],    # if primary fails, use cheap
    num_retries=2,
    timeout=30,
)

response = router.completion(model="primary", messages=[...])


# Cost tiering: route to cheap model for simple queries
def tiered_rag(question: str, context: str) -> str:
    complexity = estimate_complexity(question)   # your classifier
    model = "primary" if complexity > 0.7 else "cheap"
    return router.completion(
        model=model,
        messages=[{"role": "user", "content": f"Context:\n{context}\n\nQ: {question}"}],
    ).choices[0].message.content
```

---

## 14. Weights & Biases Weave — Production Observability

**Website:** weave.wandb.ai  
**GitHub:** `wandb/weave`

W&B Weave (2024) is an observability platform for LLM applications — traces every call, evaluates outputs, and enables dataset-driven iteration.

```python
# pip install weave
import weave
import anthropic

weave.init("my-rag-project")   # connects to W&B

client = anthropic.Anthropic()

# Decorate functions to trace them automatically
@weave.op()
def retrieve(question: str) -> list[str]:
    docs = retriever.invoke(question)
    return [d.page_content for d in docs]

@weave.op()
def generate(question: str, context: list[str]) -> str:
    context_str = "\n\n---\n\n".join(context)
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": f"Context:\n{context_str}\n\nQuestion: {question}",
        }],
    )
    return response.content[0].text

@weave.op()
def rag_pipeline(question: str) -> str:
    context = retrieve(question)
    return generate(question, context)


# Evaluation with Weave datasets
eval_dataset = weave.Dataset(
    name="rag-test-set",
    rows=[
        {"question": "What is the refund policy?", "expected": "30 days"},
        {"question": "How long does shipping take?", "expected": "5-7 days"},
    ]
)

@weave.op()
def faithfulness_scorer(question: str, model_output: str, expected: str) -> dict:
    """Custom scorer — returns a score dict."""
    score = 1.0 if expected.lower() in model_output.lower() else 0.0
    return {"score": score, "passed": score > 0.5}

evaluation = weave.Evaluation(
    dataset=eval_dataset,
    scorers=[faithfulness_scorer],
)

import asyncio
results = asyncio.run(evaluation.evaluate(rag_pipeline))
# Results visible at https://weave.wandb.ai/your-project
```

---

## Updated Production Checklist

- [ ] Embedding model pinned to a specific version (model drift = index invalidation)
- [ ] Vector index persisted and backed up
- [ ] **Anthropic prompt caching enabled** for repeated large contexts (→ 89% cost reduction)
- [ ] Semantic cache deployed (Redis/GPTCache) for repeated queries
- [ ] Async retrieval implemented
- [ ] Response streaming enabled
- [ ] **vLLM** deployed for self-hosted inference (if using open-source models)
- [ ] **LiteLLM Router** configured with fallback providers
- [ ] LangSmith, Phoenix, or **W&B Weave** tracing active
- [ ] **DeepEval** or RAGAS evaluation in CI/CD pipeline
- [ ] Input validation and prompt injection detection
- [ ] Output grounding verification
- [ ] Fallback responses for retrieval failures
- [ ] Cost monitoring and alerting per provider
- [ ] Nightly re-indexing job for updated documents

---

## See Also

- [Evaluation](../evaluation) — RAGAS, DeepEval, TruLens metrics and testing patterns
- [Retrieval Strategies](../retrieval-strategies) — the retrieval optimizations that most affect latency
- [Agentic RAG](../agentic-rag) — when latency trade-offs of agentic approaches are acceptable
- [Contextual Retrieval](./contextual-retrieval) — Anthropic prompt caching for chunk contextualization
