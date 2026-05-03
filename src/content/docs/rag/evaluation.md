---
title: RAG Evaluation
description: Complete 2026 guide to RAG evaluation — RAGAS v0.2, DeepEval, TruLens, ARES, RAGXplain, faithfulness, answer relevancy, context precision/recall, BEIR/FinanceBench benchmarks, unit testing, and CI/CD patterns.
sidebar:
  order: 12
---

> **Current as of May 2026.**

## Why Evaluate RAG Systems?

RAG systems have two failure modes:
1. **Retrieval failure:** The retrieved context doesn't contain the answer
2. **Generation failure:** The context contains the answer, but the LLM ignores or misrepresents it

Standard LLM benchmarks don't separate these. RAG-specific evaluation frameworks diagnose both independently, enabling targeted fixes.

---

## The RAG Evaluation Triad

Three core signals — **faithfulness**, **answer relevance**, and **context relevance** — form the foundation of RAG evaluation:

```
           Query
            │
            ▼
       ┌──────────┐         Answer Relevance:
       │ Retrieval│────────── Does the Answer address the Query?
       └────┬─────┘
            │ Context        Context Relevance:
            ▼                Is the Context relevant to the Query?
       ┌──────────┐
       │   LLM    │
       └────┬─────┘
            │ Answer
            ▼
       Faithfulness:
       Is the Answer grounded in the Context?
```

| Metric | Question | Range |
|---|---|---|
| **Faithfulness** | Is every claim in the answer supported by the retrieved context? | 0–1 |
| **Answer Relevance** | Does the answer actually address the question? | 0–1 |
| **Context Precision** | Of the retrieved chunks, what fraction are actually relevant? | 0–1 |
| **Context Recall** | Does the retrieved context contain all information needed to answer? | 0–1 |

---

## RAGAS Framework

**Paper:** Es et al., "RAGAS: Automated Evaluation of Retrieval Augmented Generation" (2023)  
**GitHub:** `explodinggradients/ragas`

RAGAS provides reference-free evaluation — it uses an LLM-as-judge to score each metric, enabling evaluation without human-labeled ground truth answers (except for context recall, which requires ground-truth answers).

### Installation

```bash
pip install ragas langchain-openai
```

### Basic Usage

```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)
from datasets import Dataset

# Your test data
data = {
    "question": [
        "What is the capital of France?",
        "How does BERT's MLM work?",
    ],
    "answer": [
        "The capital of France is Paris.",
        "BERT masks 15% of tokens and predicts them using context from both sides.",
    ],
    "contexts": [
        [
            "Paris is the capital and largest city of France.",
            "France is a country in Western Europe.",
        ],
        [
            "In MLM, BERT randomly masks 15% of tokens in the input and learns to predict them.",
            "80% of selected tokens are replaced with [MASK], 10% with a random token, 10% unchanged.",
        ],
    ],
    "ground_truth": [   # only needed for context_recall
        "Paris is the capital of France.",
        "BERT masks 15% of input tokens and predicts them using bidirectional context.",
    ],
}

dataset = Dataset.from_dict(data)
results = evaluate(
    dataset=dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall],
)
print(results)
# {'faithfulness': 0.97, 'answer_relevancy': 0.95, 'context_precision': 0.92, 'context_recall': 0.88}
```

### RAGAS Evaluation Pipeline

```
                    RAGAS EVALUATION FLOW
                    ─────────────────────────────────────────────

  Input:
  ┌──────────────┐   ┌──────────────────────┐   ┌────────────────┐
  │    Query     │   │  Retrieved Contexts  │   │ Ground Truth   │
  │              │   │  (chunks from RAG)   │   │ (reference ans)│
  └──────┬───────┘   └──────────┬───────────┘   └───────┬────────┘
         │                      │                        │
         └──────────────────────┼────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    LLM-as-Judge       │
                    │   (GPT-4 / Claude)    │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────────┐
              │                 │                     │
              ▼                 ▼                     ▼
     ┌────────────────┐ ┌───────────────┐  ┌──────────────────┐
     │  Faithfulness  │ │    Answer     │  │    Context       │
     │                │ │   Relevancy   │  │  Precision /     │
     │  "Does every   │ │               │  │    Recall        │
     │  claim in the  │ │  "Does the    │  │                  │
     │  answer appear │ │  answer       │  │  "Were the       │
     │  in context?"  │ │  address the  │  │  right chunks    │
     │                │ │  query?"      │  │  retrieved?"     │
     │  Range: 0→1    │ │  Range: 0→1   │  │  Range: 0→1      │
     └────────────────┘ └───────────────┘  └──────────────────┘
              │                 │                     │
              └─────────────────┼─────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │  Aggregate RAGAS      │
                    │  Score (avg)          │
                    └───────────────────────┘
```

---

## Metric Details

### Faithfulness

**Measures:** Whether every factual claim in the answer can be inferred from the retrieved context (hallucination detection).

**Algorithm:**
1. LLM extracts all factual statements from the answer
2. For each statement, LLM checks if it can be inferred from the context
3. Score = (statements supported by context) / (total statements)

```python
from ragas.metrics import faithfulness
from ragas import SingleTurnSample

sample = SingleTurnSample(
    user_input="What year was BERT published?",
    response="BERT was published in 2018 by Google. It later won the Nobel Prize.",  # hallucination!
    retrieved_contexts=["BERT was introduced by Google in October 2018."],
)

# faithfulness = 1/2 = 0.5 (only first claim is supported)
score = await faithfulness.single_turn_ascore(sample)
print(score)  # ~0.5
```

### Answer Relevancy

**Measures:** Whether the answer addresses the question (ignores faithfulness — even a hallucinated answer can be relevant).

**Algorithm:**
1. LLM generates N reverse questions from the answer (what question does this answer?)
2. Embeds original question + each generated question
3. Score = average cosine similarity between original and generated questions

```python
# Low score: answer is off-topic
sample = SingleTurnSample(
    user_input="What is the boiling point of water?",
    response="Water is a liquid at room temperature formed from hydrogen and oxygen.",
    retrieved_contexts=["Water boils at 100°C at standard pressure."]
)
# The answer doesn't say the boiling point → low answer_relevancy
```

### Context Precision

**Measures:** Of the top-k retrieved chunks, what fraction are actually relevant to answering the question? Penalizes noisy retrievals ranked highly.

**Formula:**

$$\text{Context Precision} = \frac{1}{k} \sum_{i=1}^{k} \frac{\text{relevant chunks in top-}i}{i} \times \mathbb{1}[\text{chunk}_i \text{ is relevant}]$$

This is a **weighted precision at rank** — relevant chunks ranked higher contribute more.

### Context Recall

**Measures:** Does the retrieved context contain all the information needed to answer the question?

**Algorithm:**
1. Break ground-truth answer into individual statements
2. For each statement, check if it can be inferred from any retrieved chunk
3. Score = (statements found in context) / (total statements)

**Requires ground-truth answers** — the only metric that needs labels.

---

## Running Evaluation on a Full Pipeline

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper

# Configure RAGAS to use your LLM and embedding model
evaluator_llm = LangchainLLMWrapper(ChatOpenAI(model="gpt-4o"))
evaluator_embeddings = LangchainEmbeddingsWrapper(OpenAIEmbeddings())

for metric in [faithfulness, answer_relevancy, context_precision, context_recall]:
    metric.llm = evaluator_llm
    metric.embeddings = evaluator_embeddings

# Run your RAG pipeline over test questions
test_questions = load_test_dataset()    # your eval set
records = []

for q in test_questions:
    # Run actual pipeline
    retrieved_docs = retriever.invoke(q["question"])
    answer = rag_chain.invoke(q["question"])

    records.append({
        "question":     q["question"],
        "answer":       answer,
        "contexts":     [d.page_content for d in retrieved_docs],
        "ground_truth": q["ground_truth"],
    })

dataset = Dataset.from_list(records)
results = evaluate(dataset, metrics=[faithfulness, answer_relevancy, context_precision, context_recall])

# Save results
results.to_pandas().to_csv("evaluation_results.csv", index=False)
print(results.to_pandas()[["faithfulness","answer_relevancy","context_precision","context_recall"]].describe())
```

---

## Additional RAGAS Metrics

| Metric | What it measures |
|---|---|
| `answer_correctness` | Factual overlap between answer and ground truth (needs labels) |
| `answer_similarity` | Semantic similarity between answer and ground truth |
| `context_entity_recall` | Fraction of named entities in ground truth found in context |
| `noise_sensitivity` | System's robustness to noisy/irrelevant context |
| `summarization_score` | Quality of summarization when used |

```python
from ragas.metrics import answer_correctness, noise_sensitivity

results = evaluate(
    dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall, answer_correctness],
)
```

---

## Benchmark Datasets

| Dataset | Size | Domain | Metrics it tests |
|---|---|---|---|
| **BEIR** | 18 datasets, 5.4M docs | Heterogeneous | Retrieval (NDCG@10) |
| **RAGBench** | 100K QA pairs | Multi-domain | End-to-end RAG |
| **FinanceBench** | 10K questions | Financial SEC filings | Retrieval + faithfulness |
| **RGB** | 900 questions | News, bio, general | Noise robustness |
| **CRUD-RAG** | 36K Q4 | Chinese news | Create/Read/Update/Delete |

```python
# Load a BEIR dataset for retrieval evaluation
from beir import util
from beir.datasets.data_loader import GenericDataLoader
from beir.retrieval.evaluation import EvaluateRetrieval

dataset = "nfcorpus"
url = f"https://public.ukp.informatik.tu-darmstadt.de/thakur/BEIR/datasets/{dataset}.zip"
data_path = util.download_and_unzip(url, "beir_datasets")
corpus, queries, qrels = GenericDataLoader(data_folder=data_path).load(split="test")

from beir.retrieval.search.dense import DenseRetrievalExactSearch as DRES
from beir.retrieval.models import SentenceBERT

model = DRES(SentenceBERT("BAAI/bge-large-en-v1.5"), batch_size=64)
retriever = EvaluateRetrieval(model, score_function="cos_sim")

results = retriever.retrieve(corpus, queries)
ndcg, _map, recall, precision = retriever.evaluate(qrels, results, retriever.k_values)
print(f"NDCG@10: {ndcg['NDCG@10']:.4f}")
```

---

## Unit Testing RAG Pipelines

Treat RAG evaluation like software testing — write assertions against specific known cases:

```python
import pytest
from langchain_community.vectorstores import FAISS

@pytest.fixture
def rag_chain():
    # Build a small test index
    from langchain_community.embeddings import HuggingFaceEmbeddings
    from langchain_core.documents import Document

    docs = [
        Document(page_content="The refund window is 30 days from purchase.", metadata={"source": "tos.pdf"}),
        Document(page_content="Shipping takes 5–7 business days.", metadata={"source": "faq.pdf"}),
    ]
    vectorstore = FAISS.from_documents(docs, HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2"))
    return build_rag_chain(vectorstore)

def test_refund_answer(rag_chain):
    answer = rag_chain.invoke("What is the refund policy?")
    assert "30 days" in answer.lower(), f"Expected '30 days' in answer, got: {answer}"

def test_sources_cited(rag_chain):
    result = rag_chain.invoke_with_sources("What is the refund policy?")
    assert any("tos.pdf" in s for s in result["sources"]), "Source document not cited"

def test_no_hallucination(rag_chain):
    """Answer to a question not in the index should not invent facts."""
    answer = rag_chain.invoke("What is the exchange rate for euros?")
    # Should say it doesn't know, not invent a rate
    assert any(phrase in answer.lower() for phrase in ["don't know", "not sure", "no information"]), \
        f"Potential hallucination: {answer}"
```

---

## Evaluation Dashboard with Phoenix Arize

```python
import phoenix as px
from phoenix.trace.langchain import LangChainInstrumentor

# Start Phoenix session (opens a local UI at http://localhost:6006)
session = px.launch_app()

# Auto-instrument LangChain
LangChainInstrumentor().instrument()

# Now every LangChain call is traced and visible in Phoenix
response = rag_chain.invoke("What is RAG?")

# View traces at http://localhost:6006
# Phoenix shows: retrieval latency, chunk contents, LLM prompt, token counts
```

---

## Interpreting Results and Taking Action

| Score | What it means | Action |
|---|---|---|
| Faithfulness < 0.7 | LLM is hallucinating beyond the context | Add anti-hallucination instructions; lower temperature; add grounding checks |
| Answer Relevance < 0.7 | LLM is off-topic | Improve prompt; check if question preprocessing (HyDE/rewriting) helps |
| Context Precision < 0.7 | Too many irrelevant chunks retrieved | Add reranking; improve chunking; tune `k` |
| Context Recall < 0.7 | Missing information in retrieved context | Increase `k`; check chunk size isn't too small; add multi-query |

---

---

## DeepEval — Modern RAG Testing Framework

**GitHub:** `confident-ai/deepeval`  
**Website:** deepeval.com

DeepEval (2024) is a pytest-native RAG evaluation framework with a wider metric set than RAGAS, built-in CI/CD support, and cleaner APIs.

```python
# pip install deepeval
import pytest
from deepeval import assert_test
from deepeval.metrics import (
    AnswerRelevancyMetric,
    FaithfulnessMetric,
    ContextualPrecisionMetric,
    ContextualRecallMetric,
    ContextualRelevancyMetric,
    HallucinationMetric,
    BiasMetric,
    ToxicityMetric,
)
from deepeval.test_case import LLMTestCase

# ── Individual metric evaluation ──────────────────────────────

faithfulness_metric = FaithfulnessMetric(
    threshold=0.8,
    model="gpt-4o",
    include_reason=True,
)

test_case = LLMTestCase(
    input="What is the refund policy?",
    actual_output="Refunds are processed within 30 days of purchase.",
    expected_output="Refunds take 30 days.",              # ground truth
    retrieval_context=[
        "Our refund policy allows returns within 30 days of the purchase date.",
        "Shipping takes 5-7 business days.",
    ],
)

faithfulness_metric.measure(test_case)
print(f"Faithfulness: {faithfulness_metric.score:.2f}")
print(f"Reason:       {faithfulness_metric.reason}")


# ── pytest integration ─────────────────────────────────────────

@pytest.mark.parametrize("test_case", load_test_cases())
def test_rag_pipeline(test_case):
    actual_output = rag_chain.invoke(test_case.input)
    test_case.actual_output = actual_output
    test_case.retrieval_context = [
        d.page_content for d in retriever.invoke(test_case.input)
    ]

    assert_test(test_case, [
        AnswerRelevancyMetric(threshold=0.7),
        FaithfulnessMetric(threshold=0.8),
        ContextualPrecisionMetric(threshold=0.7),
        ContextualRecallMetric(threshold=0.7),
        HallucinationMetric(threshold=0.3),  # lower = better (hallucination rate)
    ])


# ── Batch evaluation ──────────────────────────────────────────

from deepeval import evaluate

test_cases = [
    LLMTestCase(
        input=q["question"],
        actual_output=rag_chain.invoke(q["question"]),
        expected_output=q["ground_truth"],
        retrieval_context=[d.page_content for d in retriever.invoke(q["question"])],
    )
    for q in test_questions
]

results = evaluate(
    test_cases=test_cases,
    metrics=[
        AnswerRelevancyMetric(threshold=0.7),
        FaithfulnessMetric(threshold=0.8),
        ContextualPrecisionMetric(threshold=0.7),
        ContextualRecallMetric(threshold=0.7),
    ],
    run_async=True,    # parallel evaluation
    show_indicator=True,
)
```

**DeepEval vs. RAGAS:**
```
  Feature                    DeepEval        RAGAS v0.2
  ─────────────────────────────────────────────────────
  pytest native              ✓               ✗
  CI/CD assert thresholds    ✓               Manual
  Hallucination metric       ✓               Faithfulness
  Bias / Toxicity metrics    ✓               ✗
  Async evaluation           ✓               Partial
  Cloud dashboard            ✓ (Confident AI) ✗
  Custom LLM judge           ✓               ✓
  Open source                ✓               ✓
```

---

## TruLens — Evaluation with Feedback Functions

**GitHub:** `truera/trulens`  
**Website:** trulens.org  
**Maintained by:** Snowflake (acquired TruEra 2024)

TruLens instruments your LangChain/LlamaIndex chains, records every call as a "record", and evaluates it with "feedback functions" — LLM-as-judge evaluators that run asynchronously.

```python
# pip install trulens-eval trulens-apps-langchain
from trulens.core import TruSession, Feedback
from trulens.apps.langchain import TruChain
from trulens.providers.openai import OpenAI as TruOpenAI
import numpy as np

session = TruSession()
session.reset_database()  # clear previous runs

provider = TruOpenAI(model_engine="gpt-4o")

# Define feedback functions
f_answer_relevance = (
    Feedback(provider.relevance_with_cot_reasons, name="Answer Relevance")
    .on_input_output()
)

f_context_relevance = (
    Feedback(provider.context_relevance_with_cot_reasons, name="Context Relevance")
    .on_input()
    .on(TruChain.select_context(rag_chain))
    .aggregate(np.mean)
)

f_groundedness = (
    Feedback(provider.groundedness_measure_with_cot_reasons, name="Groundedness")
    .on(TruChain.select_context(rag_chain).collect())
    .on_output()
)

# Wrap your LangChain chain
tru_rag = TruChain(
    rag_chain,
    app_name="production-rag",
    app_version="v1.2",
    feedbacks=[f_answer_relevance, f_context_relevance, f_groundedness],
)

# Run with automatic evaluation
with tru_rag as recording:
    for question in test_questions:
        tru_rag.invoke(question)

# View results
session.get_leaderboard()   # pandas DataFrame of app versions + metrics
# Or open the TruLens dashboard
session.run_dashboard()     # http://localhost:8501
```

---

## RAGAS v0.2 API Changes

RAGAS v0.2 (2024) introduced a new `SingleTurnSample`-based API. The old `Dataset.from_dict()` pattern still works but is deprecated.

```python
# RAGAS v0.2 — new async API
from ragas import evaluate, EvaluationDataset
from ragas.metrics import LLMContextPrecisionWithReference, Faithfulness, AnswerRelevancy
from ragas.llms import LangchainLLMWrapper
from langchain_anthropic import ChatAnthropic

# Use Claude as the judge LLM
judge_llm = LangchainLLMWrapper(ChatAnthropic(model="claude-sonnet-4-6"))

# New: EvaluationDataset API
from ragas import SingleTurnSample

samples = [
    SingleTurnSample(
        user_input="What is the refund policy?",
        response="Refunds are processed within 30 days.",
        retrieved_contexts=[
            "Our refund policy allows returns within 30 days.",
            "Shipping takes 5-7 business days.",
        ],
        reference="Refunds take 30 days from purchase.",
    )
]

dataset = EvaluationDataset(samples=samples)

results = evaluate(
    dataset=dataset,
    metrics=[
        Faithfulness(llm=judge_llm),
        AnswerRelevancy(llm=judge_llm),
        LLMContextPrecisionWithReference(llm=judge_llm),
    ],
)
print(results)
```

---

## ARES — Automated RAG Evaluation System

**GitHub:** `stanford-futuredata/ARES`

ARES is a modular framework for domain-specific evaluation — define your own scoring schema using YAML or Python rather than relying on fixed metrics. Ideal for teams working on specialized corpora (legal, biomedical, finance) where standard RAGAS metrics don't capture domain nuance.

```python
# ARES uses a YAML config for evaluation pipeline definition
# ares_config.yaml:
# evaluation_datasets: ["test_set.jsonb"]
# few_shot_examples_filepath: "few_shot.tsv"
# llm_judge: "meta-llama/llama-3.1-8b-instruct"
# documents_filepath: "corpus.tsv"
# rag_type: "closed_book"
# labels: ["context_relevance", "answer_faithfulness", "answer_relevance"]

from ares import ARES

ares_module = ARES(
    in_domain_scorer_settings={
        "training_set": [{"few_shot_examples_filepath": "few_shot.tsv"}],
        "llm_judge": "meta-llama/llama-3.1-8b-instruct",
        "labels": ["context_relevance", "answer_faithfulness", "answer_relevance"],
    }
)
results = ares_module.evaluate_RAG(["test_set.jsonb"])
print(results)
```

**When to use ARES:**
- Domain-specific corpora where generic metrics don't generalize
- Teams wanting to define custom scoring criteria (YAML-based)
- Research settings requiring reproducible evaluation with open-source judges

---

## RAGXplain — Evaluation with Explanations (2025)

RAGXplain extends standard RAG evaluation by providing **natural-language explanations for each score** — not just a 0–1 number but a human-readable reason why a retrieval or answer failed. Built for teams that need transparency and accountability in their evaluation pipeline.

Key differentiator: each metric score comes with an explanation like "The retrieved passage mentions pricing but fails to include the exception clause relevant to the question, reducing faithfulness to 0.4."

---

## Evaluation Framework Comparison (2026)

**Recommended workflow:** RAGAS for metric exploration, DeepEval for CI/CD gates, TruLens for production dashboards.

| Framework | Interface | Best for | Judge LLM | Dashboard | Explanations | Cost |
|---|---|---|---|---|---|---|
| **RAGAS v0.2** | Python/async | Standard RAG metrics | Any | No | No | Per-LLM-call |
| **DeepEval** | pytest native | CI/CD, threshold testing | Any | Yes (Confident AI) | Via `@observe` | Per-LLM-call |
| **TruLens** | Instrumented chains | Production monitoring | OpenAI/Cohere | Yes (localhost) | No | Per-LLM-call |
| **ARES** | YAML/Python config | Domain-specific custom metrics | Open-source | No | No | Per-LLM-call |
| **RAGXplain** | Python | Transparency/accountability | Any | No | **Yes** | Per-LLM-call |
| **Phoenix Arize** | Tracing + eval | Observability + eval | Any | Yes (localhost) | No | Free |
| **LangSmith** | LangChain native | LangChain tracing | Any | Yes (cloud) | No | Free tier |

---

## See Also

- [Advanced RAG](../advanced-rag) — improvements likely to raise context precision and recall
- [Retrieval Strategies](../retrieval-strategies) — targeting specific retrieval failures
- [Production RAG](../production-rag) — evaluation in CI/CD pipelines and monitoring in production
- [Vectorless RAG](./pageindex-vectorless-rag) — FinanceBench benchmark results in context
