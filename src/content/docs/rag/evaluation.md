---
title: RAG Evaluation
description: Complete May 2026 guide to RAG evaluation — RAGAS v0.2, DeepEval G-Eval, Prometheus-Eval, TruLens, ARES, RAGXplain, faithfulness, answer relevancy, context precision/recall, synthetic testset generation, automated regression testing, BEIR/FinanceBench benchmarks, unit testing, and CI/CD patterns.
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

The triad captures three independent failure modes. A system can have high faithfulness (LLM sticks to context) but low answer relevance (context was wrong). Or high context precision (all retrieved chunks are relevant) but low context recall (missing key chunks). Evaluating all three together pinpoints exactly where the pipeline is failing.

```
  Evaluation Signal Map
  ──────────────────────────────────────────────────────────────────
  FAILURE TYPE              METRIC AFFECTED           REMEDIATION
  ──────────────────────────────────────────────────────────────────
  LLM ignores context   →  Faithfulness ↓         →  Prompt tuning
  LLM off-topic         →  Answer Relevance ↓     →  Query rewriting
  Wrong chunks ranked   →  Context Precision ↓    →  Reranking
  Missing chunks        →  Context Recall ↓       →  Increase k, chunking
  Named entity absent   →  Entity Recall ↓        →  Metadata filtering
  Noisy corpus          →  Noise Sensitivity ↓    →  Better chunking
  ──────────────────────────────────────────────────────────────────
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

---

## Metric Details

### Faithfulness

**Measures:** Whether every factual claim in the answer can be inferred from the retrieved context (hallucination detection).

**Algorithm:**
1. LLM extracts all factual statements from the answer
2. For each statement, LLM checks if it can be inferred from the context
3. Score = (statements supported by context) / (total statements)

```
  Faithfulness Computation
  ──────────────────────────────────────────────────────────────
  Answer: "BERT was published in 2018 by Google.
           It later won the Nobel Prize."
       │
       ▼
  Statement extraction (LLM)
  ├── [1] "BERT was published in 2018"  ← check against context
  └── [2] "BERT won the Nobel Prize"    ← check against context
       │
       ▼
  Context: "BERT was introduced by Google in October 2018."
  ├── [1] SUPPORTED     ✓
  └── [2] NOT SUPPORTED ✗
       │
       ▼
  Faithfulness = 1 / 2 = 0.50
  ──────────────────────────────────────────────────────────────
```

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

```
  Answer Relevancy — Reverse Question Method
  ─────────────────────────────────────────────────────────────────
  Original question: "What is the boiling point of water?"

  Answer: "Water is a liquid formed from hydrogen and oxygen."

  Generated reverse questions (LLM):
  ├── "What is water made of?"        sim = 0.31
  ├── "What is the state of water?"   sim = 0.28
  └── "What is H2O?"                  sim = 0.25

  Answer Relevancy = mean(0.31, 0.28, 0.25) = 0.28  ← LOW
  (The answer doesn't address boiling point at all)
  ─────────────────────────────────────────────────────────────────
```

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

```
  Context Precision — Rank-Weighted Example (k=4)
  ─────────────────────────────────────────────────────────────────
  Rank 1: "Refunds allowed within 30 days"      → RELEVANT   ✓
  Rank 2: "Shipping costs vary by region"        → NOT relevant ✗
  Rank 3: "Exchanges allowed within 60 days"     → RELEVANT   ✓
  Rank 4: "Store hours are 9AM–6PM"              → NOT relevant ✗

  Precision@1 = 1/1 = 1.00  (used, chunk 1 relevant)
  Precision@2 = 1/2 = 0.50  (not used, chunk 2 not relevant)
  Precision@3 = 2/3 = 0.67  (used, chunk 3 relevant)
  Precision@4 = 2/4 = 0.50  (not used, chunk 4 not relevant)

  Context Precision = (1.00 + 0.67) / 4 = 0.42
  (Low because a relevant chunk was ranked below irrelevant ones)
  ─────────────────────────────────────────────────────────────────
```

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

## RAGAS v0.2 — May 2026 Updates

RAGAS v0.2 introduced a modernized API, new metrics, multi-backend LLM support, and a testset generation toolkit. The old `Dataset.from_dict()` pattern is deprecated in favor of `EvaluationDataset` and `SingleTurnSample`.

### New Metrics in v0.2

**`answer_correctness`** — Factual correctness vs. a reference answer, combining lexical and semantic similarity:

```
  answer_correctness = 0.75 × F1_fact + 0.25 × semantic_similarity

  F1_fact: token-level F1 overlap between answer claims and reference claims
  semantic_similarity: cosine similarity of answer vs. reference embeddings

  Example:
    Reference: "Paris is the capital of France, with a population of 2.1 million."
    Answer:    "Paris is the French capital."

    F1_fact          = 0.62  (partial fact overlap)
    semantic_sim     = 0.89  (high semantic similarity)
    answer_correctness = 0.75 × 0.62 + 0.25 × 0.89 = 0.69
```

**`context_entity_recall`** — Does the retrieved context contain the named entities needed to answer the question? Catches cases where the right topic is retrieved but key entities (product names, dates, figures) are missing:

```
  Reference answer: "The M2 chip was released in June 2022 with 8-core GPU."
  Named entities:   {M2 chip, June 2022, 8-core GPU}

  Retrieved context contains: {M2 chip, June 2022}   (missing 8-core GPU)

  context_entity_recall = 2/3 = 0.67
```

**`LLMContextRecallWithoutReference`** — Reference-free context recall using LLM judgment. Instead of comparing to a ground-truth answer, the LLM judges whether the retrieved context is sufficient to produce a complete answer. This enables context recall evaluation without a labeled test set — a significant practical advantage.

```
  Traditional context_recall:  requires ground truth answer → expensive to label
  LLMContextRecallWithoutReference: LLM judges sufficiency → no labels needed

  LLM prompt (simplified):
    "Given this question and retrieved context, is the context sufficient
     to produce a complete and accurate answer? Score 0-1."
```

### Updated API: EvaluationDataset

```python
from ragas import EvaluationDataset, evaluate, SingleTurnSample
from ragas.metrics import (
    Faithfulness,
    AnswerRelevancy,
    AnswerCorrectness,
    ContextEntityRecall,
    LLMContextRecallWithoutReference,
)

samples = [
    SingleTurnSample(
        user_input="What is the refund policy?",
        response="Refunds are processed within 30 days.",
        retrieved_contexts=[
            "Our refund policy allows returns within 30 days.",
            "Shipping takes 5-7 business days.",
        ],
        reference="Refunds take 30 days from purchase.",
    ),
    SingleTurnSample(
        user_input="When was the M2 chip released?",
        response="The M2 chip was released in June 2022.",
        retrieved_contexts=[
            "Apple unveiled the M2 chip at WWDC in June 2022.",
        ],
        reference="The M2 chip was released in June 2022 with an 8-core GPU.",
    ),
]

dataset = EvaluationDataset(samples=samples)

results = evaluate(
    dataset=dataset,
    metrics=[
        Faithfulness(),
        AnswerRelevancy(),
        AnswerCorrectness(),           # new in v0.2
        ContextEntityRecall(),         # new in v0.2
        LLMContextRecallWithoutReference(),  # reference-free
    ],
)
print(results)
```

### Multi-Backend LLM Support

RAGAS v0.2 supports any LLM backend through LiteLLM, enabling evaluation with open-source or locally-hosted models:

```python
from ragas.llms import LangchainLLMWrapper
from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI
from langchain_community.chat_models import ChatOllama

# Option 1: Claude as the RAGAS evaluator LLM
claude_judge = LangchainLLMWrapper(
    ChatAnthropic(model="claude-sonnet-4-6", api_key="YOUR_KEY")
)

# Option 2: OpenAI
openai_judge = LangchainLLMWrapper(ChatOpenAI(model="gpt-4o"))

# Option 3: Local model via Ollama (free, private)
local_judge = LangchainLLMWrapper(ChatOllama(model="llama3.1:8b"))

# Apply Claude as the judge to all metrics
metrics = [Faithfulness(), AnswerRelevancy(), AnswerCorrectness()]
for metric in metrics:
    metric.llm = claude_judge

results = evaluate(dataset=dataset, metrics=metrics)
```

**Using Claude as a RAGAS evaluator** is a strong choice: Claude's long-context window handles large retrieved documents cleanly, and its instruction-following reduces judge inconsistency. Claude Haiku is cost-effective for bulk evaluation; Claude Sonnet is recommended for final quality gates.

### Testset Generation

```python
from ragas.testset import TestsetGenerator
from ragas.llms import LangchainLLMWrapper
from langchain_anthropic import ChatAnthropic
from langchain_community.document_loaders import PyPDFLoader

# Load your corpus
loader = PyPDFLoader("product_documentation.pdf")
docs = loader.load()

# Configure generator
generator_llm = LangchainLLMWrapper(ChatAnthropic(model="claude-sonnet-4-6"))
generator = TestsetGenerator(llm=generator_llm)

# Generate diverse test questions
testset = generator.generate_with_langchain_docs(
    docs,
    testset_size=100,
    # Distribution of question types:
    # simple: 40%, reasoning: 30%, multi_context: 20%, conditional: 10%
)

# Export for evaluation
df = testset.to_pandas()
df.to_json("golden_testset.json", orient="records")
print(df[["question", "ground_truth", "question_type"]].head(10))
```

---

## Synthetic Testset Generation

Hand-labeling 100 QA pairs takes a team of reviewers several days. RAGAS TestsetGenerator produces them in minutes by having an LLM read your documents and generate diverse, realistic questions. This section covers the full workflow.

```
  Testset Generation Pipeline
  ──────────────────────────────────────────────────────────────────────
  Document Corpus
        │
        ▼
  Document Chunking ──→ Chunk Graph (semantic relationships)
        │
        ▼
  LLM reads chunks ──→ Generates question candidates per chunk
        │
        ├──→ Question type classifier
        │         ├── simple (40%)
        │         ├── reasoning (30%)
        │         ├── multi_context (20%)
        │         └── conditional (10%)
        │
        ▼
  Ground truth generation (LLM answers from source chunks)
        │
        ▼
  Filtering & deduplication
        │
        ▼
  Golden Testset (question, ground_truth, source_chunks, type)
  ──────────────────────────────────────────────────────────────────────
```

### Question Types and What They Test

| Type | Description | What it tests | Example |
|---|---|---|---|
| `simple` | Single-chunk lookup | Basic retrieval precision | "What is the refund window?" |
| `reasoning` | Requires combining information within a chunk | LLM reasoning over context | "Why did the company change its refund policy?" |
| `multi_context` | Requires multiple chunks to answer | Cross-chunk retrieval (context recall) | "How does the refund policy differ between digital and physical products?" |
| `conditional` | Counterfactual / "if X then what?" | Generalization and logical inference | "If a product is defective, does the 30-day limit still apply?" |

Each question type stresses a different part of the RAG pipeline. A system that performs well on `simple` but poorly on `multi_context` needs better retrieval breadth, not better generation.

### Complete Testset Generation Code

```python
from ragas.testset import TestsetGenerator
from ragas.testset.graph import KnowledgeGraph, Node, NodeType
from ragas.llms import LangchainLLMWrapper
from ragas.embeddings import LangchainEmbeddingsWrapper
from langchain_anthropic import ChatAnthropic
from langchain_openai import OpenAIEmbeddings
from langchain_community.document_loaders import DirectoryLoader
import json

# Load corpus
loader = DirectoryLoader("./docs/", glob="**/*.md")
documents = loader.load()
print(f"Loaded {len(documents)} documents")

# Set up LLM and embeddings for generation
generator_llm = LangchainLLMWrapper(
    ChatAnthropic(model="claude-sonnet-4-6")
)
generator_embeddings = LangchainEmbeddingsWrapper(OpenAIEmbeddings())

# Initialize the generator
generator = TestsetGenerator(
    llm=generator_llm,
    embedding_model=generator_embeddings,
)

# Generate testset with controlled distribution
testset = generator.generate_with_langchain_docs(
    documents,
    testset_size=100,
)

df = testset.to_pandas()

# Validate: inspect the generated questions
print("\nSample questions by type:")
for qtype in df["question_type"].unique():
    sample = df[df["question_type"] == qtype].iloc[0]
    print(f"\n  [{qtype}]")
    print(f"  Q: {sample['question']}")
    print(f"  A: {sample['ground_truth'][:120]}...")

# Save golden testset
records = df[["question", "ground_truth", "question_type", "contexts"]].to_dict("records")
with open("golden_testset.json", "w") as f:
    json.dump(records, f, indent=2)

print(f"\nSaved {len(records)} test cases to golden_testset.json")
```

### Validation: Human Spot-Check Protocol

Synthetic questions are good but not perfect. LLMs occasionally generate:
- Questions where the ground truth is ambiguous
- Questions that are too easy (directly copied phrasing)
- Questions with incorrect ground truth due to misreading the document

**Recommended:** Have human reviewers spot-check 20% of generated questions (20 out of 100) before using the testset as a regression gate. Flag and remove questions where:
- Ground truth is factually wrong
- Question cannot be answered from the provided source chunks
- Question is duplicated or nearly identical to another

```python
# Generate a review spreadsheet
import pandas as pd

review_df = df.sample(frac=0.20, random_state=42)[
    ["question", "ground_truth", "question_type", "contexts"]
].copy()
review_df["human_verdict"] = ""   # "ok" / "fix" / "remove"
review_df["reviewer_note"] = ""

review_df.to_csv("testset_review.csv", index=False)
print(f"Exported {len(review_df)} questions for human review")
```

### Cost Estimate

| Setup | Model | Cost per 100 questions (50-page doc) |
|---|---|---|
| Cheap API | GPT-4o-mini | ~$0.50 |
| Quality API | Claude Sonnet | ~$2.00 |
| Free / local | Llama 3.1 8B via Ollama | $0.00 |
| Quality local | Llama 3.1 70B via vLLM | ~$0.10 (electricity) |

At $0.50–$2.00 for a 100-question testset, synthetic generation is dramatically cheaper than human annotation ($500–$2,000 for the same set at professional rates).

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

## G-Eval for RAG

**Framework:** DeepEval (Confident AI, 2024)  
**Paper:** Liu et al., "G-Eval: NLG Evaluation using GPT-4 with Better Human Alignment" (2023)

G-Eval is an LLM-as-judge framework that defines evaluation criteria in natural language and uses Chain-of-Thought reasoning to produce structured scores on a 1–10 scale. Unlike simple LLM prompting ("rate this answer 1-10"), G-Eval forces the model to reason step-by-step through a defined evaluation rubric before scoring, which substantially improves consistency and alignment with human judgments.

```
  G-Eval Scoring Pipeline
  ──────────────────────────────────────────────────────────────────
  Define metric in natural language:
  ┌─────────────────────────────────────────────────────────────┐
  │  Name: "Completeness"                                       │
  │  Criteria: "Does the answer address all aspects of the     │
  │             question without omitting key information?"     │
  │  Steps: ["Identify what the question asks for",            │
  │           "Check each part of the question is answered",   │
  │           "Score higher if all parts covered"]             │
  └─────────────────────────────────────────────────────────────┘
         │
         ▼
  LLM performs Chain-of-Thought reasoning:
  "The question asks about refund window AND who is eligible.
   The answer covers the 30-day window but says nothing about
   eligibility criteria. Therefore completeness is partial."
         │
         ▼
  Structured score output: 6/10
  ──────────────────────────────────────────────────────────────
```

**Key advantages over simple LLM prompting:**
- Structured CoT reasoning reduces score variance (judges don't anchor to arbitrary numbers)
- Criteria defined as evaluation steps constrain the judge's attention
- Reference-free: no ground truth answers needed
- Fully customizable: define metrics for completeness, safety, conciseness, factual accuracy, tone

### Defining Custom G-Eval Metrics

```python
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCase, LLMTestCaseParams

# Define a completeness metric
completeness_metric = GEval(
    name="Completeness",
    criteria=(
        "Determine whether the actual output fully addresses all aspects of the input question. "
        "A complete answer covers every distinct sub-question and does not omit key information "
        "that a reader would expect."
    ),
    evaluation_steps=[
        "Read the input question and identify every distinct sub-question or aspect it contains.",
        "Read the actual output and check whether each identified aspect is addressed.",
        "For each unaddressed aspect, note it as a gap.",
        "Score higher if fewer gaps exist. A perfect score (10) means no gaps.",
        "A score below 5 means major aspects of the question were ignored entirely.",
    ],
    evaluation_params=[
        LLMTestCaseParams.INPUT,
        LLMTestCaseParams.ACTUAL_OUTPUT,
    ],
    model="gpt-4o",
    threshold=0.7,
)

# Define a factual accuracy metric (cross-referenced with context)
factual_accuracy_metric = GEval(
    name="Factual Accuracy",
    criteria=(
        "Determine whether every factual claim in the actual output is directly supported by "
        "the retrieval context. Claims not verifiable from the context should lower the score."
    ),
    evaluation_steps=[
        "List every factual claim in the actual output (numbers, names, dates, causal statements).",
        "For each claim, search the retrieval context for supporting evidence.",
        "Count claims with no supporting evidence in the context — these are potential hallucinations.",
        "Score 10 if all claims are supported. Deduct 1-2 points per unsupported claim.",
    ],
    evaluation_params=[
        LLMTestCaseParams.INPUT,
        LLMTestCaseParams.ACTUAL_OUTPUT,
        LLMTestCaseParams.RETRIEVAL_CONTEXT,
    ],
    model="gpt-4o",
    threshold=0.8,
)

# Safety / off-topic metric
safety_metric = GEval(
    name="Safety",
    criteria=(
        "Determine whether the actual output stays within the subject matter of the retrieval "
        "context and avoids harmful, biased, or inappropriate content."
    ),
    evaluation_steps=[
        "Check if the answer introduces topics absent from the retrieval context.",
        "Check for harmful, biased, discriminatory, or inappropriate language.",
        "Score 10 if fully on-topic and safe. Score 0 for any harmful content.",
    ],
    evaluation_params=[
        LLMTestCaseParams.ACTUAL_OUTPUT,
        LLMTestCaseParams.RETRIEVAL_CONTEXT,
    ],
    model="gpt-4o",
    threshold=0.9,
)

# Run G-Eval on a test case
test_case = LLMTestCase(
    input="What is the refund policy for international orders?",
    actual_output="Refunds for international orders follow the same 30-day window as domestic orders, but the customer is responsible for return shipping costs.",
    retrieval_context=[
        "All orders, domestic and international, are eligible for refunds within 30 days.",
        "For international returns, return shipping costs are the customer's responsibility.",
    ],
)

for metric in [completeness_metric, factual_accuracy_metric, safety_metric]:
    metric.measure(test_case)
    print(f"{metric.name}: {metric.score:.2f} — {metric.reason}")
```

---

## Prometheus-Eval

**Paper:** Kim et al., "Prometheus 2: An Open Source Language Model Specialized in Evaluating Other Language Models" (KAIST, 2024)  
**HuggingFace:** `prometheus-eval/prometheus-8x7b-v2.0`, `prometheus-eval/prometheus-7b-v2.0`

Prometheus-Eval is an open-source LLM-as-judge system fine-tuned specifically on evaluation tasks. Unlike using a general-purpose LLM (GPT-4, Claude) as a judge, Prometheus was trained on a large dataset of human evaluation judgments, making it more calibrated and consistent.

**Key claims from the KAIST paper:**
- Prometheus-70B matches or exceeds GPT-4-as-judge on several evaluation benchmarks
- At 10% the cost of GPT-4 (self-hosted), or free on HuggingFace Inference API
- Fine-tuned to follow detailed rubrics precisely — less prone to position bias and verbosity bias than general models

```
  Prometheus-Eval Architecture
  ──────────────────────────────────────────────────────────────
  Training data: human evaluation judgments from Feedback
                 Collection datasets + synthetic rubric data
         │
         ▼
  Fine-tuned on:
  ├── Absolute scoring: rate a response on a 1-5 rubric
  └── Pairwise comparison: which of two responses is better?
         │
         ▼
  At inference: provide instruction + response + rubric
  → model produces score + natural language feedback
  ──────────────────────────────────────────────────────────────
```

### Two Evaluation Modes

**Absolute scoring (1–5 scale):** Rate a single response against a rubric.

**Pairwise comparison:** Given two responses (A and B), determine which is better. Useful for A/B testing RAG pipeline changes — compare old vs. new pipeline side by side without requiring a numerical rubric.

### HuggingFace Inference Code

```python
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Load Prometheus-8B (fits on a single A100 40GB)
model_id = "prometheus-eval/prometheus-7b-v2.0"
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForCausalLM.from_pretrained(
    model_id,
    torch_dtype=torch.bfloat16,
    device_map="auto",
)

# Absolute scoring rubric for RAG faithfulness
ABS_RUBRIC = """Score 1: The response contains multiple claims not supported by the context.
Score 2: The response contains at least one major unsupported claim.
Score 3: The response is mostly grounded but includes minor unsupported details.
Score 4: The response is fully grounded with only trivially rephrased wording.
Score 5: The response is perfectly grounded — every claim traces directly to the context."""

def prometheus_score_faithfulness(
    question: str,
    answer: str,
    context: str,
) -> tuple[int, str]:
    """Score RAG faithfulness on a 1-5 scale using Prometheus."""
    prompt = f"""###Task Description:
An instruction (might include an Input inside it), a response to evaluate, a reference answer that gets a score of 5, and a score rubric representing an evaluation criterion are given.
1. Write a detailed feedback that assesses the quality of the response strictly based on the given score rubric, not evaluating in general.
2. After writing a feedback, write a score that is an integer between 1 and 5.

###The instruction to evaluate:
Question: {question}
Retrieved Context: {context}

###Response to evaluate:
{answer}

###Score Rubric:
{ABS_RUBRIC}

###Feedback:"""

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=512,
            temperature=0.0,
            do_sample=False,
        )

    generated = tokenizer.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)

    # Parse score from output (Prometheus ends with [RESULT] N)
    import re
    score_match = re.search(r"\[RESULT\]\s*(\d)", generated)
    score = int(score_match.group(1)) if score_match else 3
    feedback = generated[:generated.rfind("[RESULT]")].strip()

    return score, feedback


# Pairwise comparison: old pipeline vs. new pipeline
def prometheus_compare(
    question: str,
    context: str,
    response_a: str,
    response_b: str,
) -> str:
    """Returns 'A', 'B', or 'tie'."""
    prompt = f"""###Task Description:
Given a question, context, and two responses (A and B), determine which response is more faithful to the context and better answers the question.

###Question: {question}
###Context: {context}
###Response A: {response_a}
###Response B: {response_b}

###Which response is better? Explain your reasoning, then conclude with [RESULT] A, [RESULT] B, or [RESULT] tie."""

    inputs = tokenizer(prompt, return_tensors="pt").to(model.device)
    with torch.no_grad():
        outputs = model.generate(**inputs, max_new_tokens=256, temperature=0.0, do_sample=False)
    generated = tokenizer.decode(outputs[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True)

    import re
    result_match = re.search(r"\[RESULT\]\s*(A|B|tie)", generated, re.IGNORECASE)
    return result_match.group(1).upper() if result_match else "tie"


# Example usage
score, feedback = prometheus_score_faithfulness(
    question="What is the refund window?",
    answer="Refunds are available within 30 days. Customers in the EU get 60 days.",
    context="Our refund policy allows returns within 30 days of purchase.",
)
print(f"Faithfulness score: {score}/5")
print(f"Feedback: {feedback}")
# Score: 2/5 — "The EU claim is not supported by the provided context."
```

### When to Use Prometheus-Eval

- **Cost-sensitive evaluation:** Self-hosted Prometheus-8B costs ~$0.001/evaluation vs. $0.01–$0.05 with GPT-4
- **Privacy-sensitive corpora:** No data leaves your infrastructure
- **High-volume CI/CD:** Thousands of evaluations per PR run
- **Research settings:** Reproducible, open-weight judge

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

## Automated Regression Testing Pipeline

Preventing evaluation regressions requires running metrics automatically on every pull request, comparing results to a known-good baseline, and blocking merges when quality drops. This section shows a complete implementation.

```
  CI/CD Regression Testing Workflow
  ──────────────────────────────────────────────────────────────────
  Pull Request opened
        │
        ▼
  GitHub Actions triggered
        │
        ├── 1. Checkout PR branch
        ├── 2. Run RAG pipeline on 50-question golden set
        ├── 3. Compute RAGAS metrics (faithfulness, etc.)
        ├── 4. Load baseline metrics from main branch artifact
        ├── 5. Compare: PR metrics vs. baseline
        │
        ├── Faithfulness drop > 2%?  ──→ EXIT 1 (block merge)
        ├── All metrics within tolerance? ──→ EXIT 0 (allow merge)
        │
        ├── 6. Save PR results as JSON artifact
        └── 7. Plot metric trend over last 30 PRs
  ──────────────────────────────────────────────────────────────────
```

### `ci_evaluate.py` — Full Evaluation Script

```python
#!/usr/bin/env python3
"""
RAG regression evaluation script for CI/CD.
Usage: python ci_evaluate.py --testset golden_testset.json --output results.json [--baseline baseline.json]
"""
import argparse
import json
import sys
from pathlib import Path

from ragas import EvaluationDataset, SingleTurnSample, evaluate
from ragas.metrics import (
    Faithfulness,
    AnswerRelevancy,
    LLMContextPrecisionWithReference,
    AnswerCorrectness,
)
from ragas.llms import LangchainLLMWrapper
from langchain_openai import ChatOpenAI

# ── Configuration ──────────────────────────────────────────────

THRESHOLDS = {
    "faithfulness": 0.85,
    "answer_relevancy": 0.80,
    "context_precision": 0.75,
    "answer_correctness": 0.70,
}

REGRESSION_TOLERANCE = 0.02   # 2% drop from baseline triggers failure


def load_rag_pipeline():
    """Load the RAG chain and retriever. Customize for your pipeline."""
    from your_rag_module import build_chain, build_retriever
    retriever = build_retriever()
    chain = build_chain(retriever)
    return chain, retriever


def run_pipeline_on_testset(testset_path: str) -> list[SingleTurnSample]:
    """Run the RAG pipeline over all test questions and collect results."""
    chain, retriever = load_rag_pipeline()

    with open(testset_path) as f:
        test_questions = json.load(f)

    samples = []
    for i, item in enumerate(test_questions):
        print(f"  [{i+1}/{len(test_questions)}] {item['question'][:60]}...")
        try:
            docs = retriever.invoke(item["question"])
            answer = chain.invoke(item["question"])
            samples.append(SingleTurnSample(
                user_input=item["question"],
                response=answer,
                retrieved_contexts=[d.page_content for d in docs],
                reference=item.get("ground_truth", ""),
            ))
        except Exception as e:
            print(f"    WARNING: pipeline error: {e}", file=sys.stderr)
            continue

    return samples


def evaluate_samples(samples: list[SingleTurnSample]) -> dict:
    """Run RAGAS metrics on collected samples."""
    judge_llm = LangchainLLMWrapper(ChatOpenAI(model="gpt-4o-mini"))

    metrics = [
        Faithfulness(llm=judge_llm),
        AnswerRelevancy(llm=judge_llm),
        LLMContextPrecisionWithReference(llm=judge_llm),
        AnswerCorrectness(llm=judge_llm),
    ]

    dataset = EvaluationDataset(samples=samples)
    results = evaluate(dataset=dataset, metrics=metrics)
    df = results.to_pandas()

    return {
        "faithfulness": float(df["faithfulness"].mean()),
        "answer_relevancy": float(df["answer_relevancy"].mean()),
        "context_precision": float(df["context_precision"].mean()),
        "answer_correctness": float(df["answer_correctness"].mean()),
        "n_samples": len(samples),
    }


def check_regression(current: dict, baseline: dict) -> list[str]:
    """Return list of failed checks (empty = pass)."""
    failures = []
    for metric, baseline_score in baseline.items():
        if metric == "n_samples":
            continue
        current_score = current.get(metric, 0.0)
        drop = baseline_score - current_score
        if drop > REGRESSION_TOLERANCE:
            failures.append(
                f"{metric}: dropped {drop:.3f} ({baseline_score:.3f} → {current_score:.3f}), "
                f"tolerance is {REGRESSION_TOLERANCE}"
            )
    return failures


def check_absolute_thresholds(current: dict) -> list[str]:
    """Return list of metrics below absolute threshold."""
    failures = []
    for metric, threshold in THRESHOLDS.items():
        score = current.get(metric, 0.0)
        if score < threshold:
            failures.append(f"{metric}: {score:.3f} < threshold {threshold}")
    return failures


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--testset", required=True, help="Path to golden testset JSON")
    parser.add_argument("--output", required=True, help="Path to write results JSON")
    parser.add_argument("--baseline", help="Path to baseline results JSON (from main branch)")
    args = parser.parse_args()

    print("Running RAG pipeline on golden testset...")
    samples = run_pipeline_on_testset(args.testset)
    print(f"Collected {len(samples)} samples.")

    print("Running RAGAS evaluation...")
    results = evaluate_samples(samples)

    # Save results
    with open(args.output, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {args.output}:")
    for k, v in results.items():
        if k != "n_samples":
            print(f"  {k}: {v:.4f}")

    # Check absolute thresholds
    absolute_failures = check_absolute_thresholds(results)

    # Check regression against baseline
    regression_failures = []
    if args.baseline and Path(args.baseline).exists():
        with open(args.baseline) as f:
            baseline = json.load(f)
        regression_failures = check_regression(results, baseline)

    all_failures = absolute_failures + regression_failures
    if all_failures:
        print("\nEVALUATION FAILED:")
        for f in all_failures:
            print(f"  FAIL: {f}")
        sys.exit(1)
    else:
        print("\nAll evaluation checks passed.")
        sys.exit(0)


if __name__ == "__main__":
    main()
```

### `.github/workflows/rag-eval.yml` — GitHub Actions Workflow

```yaml
# .github/workflows/rag-eval.yml
name: RAG Regression Evaluation

on:
  pull_request:
    branches: [main]
    paths:
      - "src/**"
      - "rag/**"
      - "requirements.txt"

jobs:
  evaluate:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
          cache: "pip"

      - name: Install dependencies
        run: pip install -r requirements.txt

      # Download baseline results from main branch (stored as artifact)
      - name: Download baseline artifact
        uses: dawidd6/action-download-artifact@v3
        with:
          branch: main
          workflow: rag-eval.yml
          name: rag-eval-results
          path: baseline/
        continue-on-error: true   # first run: no baseline exists yet

      # Run evaluation on this PR's code
      - name: Run RAG evaluation
        run: |
          python ci_evaluate.py \
            --testset tests/golden_testset.json \
            --output results.json \
            --baseline baseline/results.json
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      # Upload this run's results as an artifact (becomes next PR's baseline if merged)
      - name: Upload evaluation results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: rag-eval-results
          path: results.json
          retention-days: 90

      # Comment results on the PR
      - name: Comment PR with results
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('results.json', 'utf8'));
            const body = [
              '## RAG Evaluation Results',
              '',
              '| Metric | Score | Threshold |',
              '|---|---|---|',
              `| Faithfulness | ${results.faithfulness.toFixed(3)} | 0.85 |`,
              `| Answer Relevancy | ${results.answer_relevancy.toFixed(3)} | 0.80 |`,
              `| Context Precision | ${results.context_precision.toFixed(3)} | 0.75 |`,
              `| Answer Correctness | ${results.answer_correctness.toFixed(3)} | 0.70 |`,
              '',
              `Evaluated on ${results.n_samples} golden test questions.`,
            ].join('\n');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body,
            });
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

## Evaluation Tool Comparison

This table covers the major tools available as of May 2026, focusing on practical integration factors.

| Tool | Open Source | Reference-Free | CI/CD | LLM Backend | Main Strength |
|---|---|---|---|---|---|
| RAGAS v0.2 | Yes | Partial | Yes | Any (LiteLLM) | Comprehensive RAG metrics |
| DeepEval | Yes | Yes (G-Eval) | Yes | OpenAI/local | Custom metrics |
| TruLens | Yes | Yes | Partial | OpenAI | Feedback + trace UI |
| Giskard | Yes | Yes | Yes | Any | Safety + bias testing |
| LangSmith Evals | No | Yes | Yes | OpenAI | LangChain native |
| Prometheus-Eval | Yes | Yes | Manual | Self-hosted | Low-cost LLM judge |

**Notes on "Reference-Free":** RAGAS is listed as "Partial" because its most important retrieval metric (context recall) requires ground-truth answers. Its generation metrics (faithfulness, answer relevancy) are fully reference-free. Prometheus-Eval, G-Eval, and TruLens can score outputs without any ground truth labels.

**Notes on CI/CD integration:**
- RAGAS and DeepEval produce numeric scores that can be thresholded with `sys.exit(1)` directly
- TruLens is designed for dashboard monitoring rather than binary pass/fail CI gates
- Prometheus-Eval requires manual integration into CI (no native GitHub Actions plugin)

```
  Tool Selection Decision Tree
  ─────────────────────────────────────────────────────────────────
  Do you need a pytest-style CI gate?
  ├── Yes ──→ DeepEval (native pytest) or RAGAS + ci_evaluate.py
  └── No
       │
       Do you need production dashboard monitoring?
       ├── Yes ──→ TruLens (self-hosted) or LangSmith (cloud)
       └── No
            │
            Do you need custom domain-specific criteria?
            ├── Yes ──→ G-Eval (DeepEval) or ARES
            └── No
                 │
                 Is cost the primary constraint?
                 ├── Yes ──→ Prometheus-Eval (self-hosted)
                 └── No ──→ RAGAS v0.2 with Claude judge
  ─────────────────────────────────────────────────────────────────
```

---

## Evaluation Framework Comparison (May 2026)

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
| **Prometheus-Eval** | Python/HuggingFace | Cost-sensitive evaluation | Self-hosted | No | Yes | Infrastructure only |

---

## See Also

- [Advanced RAG](../advanced-rag) — improvements likely to raise context precision and recall
- [Retrieval Strategies](../retrieval-strategies) — targeting specific retrieval failures
- [Production RAG](../production-rag) — evaluation in CI/CD pipelines and monitoring in production
- [Vectorless RAG](./pageindex-vectorless-rag) — FinanceBench benchmark results in context
