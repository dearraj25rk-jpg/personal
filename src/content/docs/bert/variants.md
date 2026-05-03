---
title: BERT Variants
description: Detailed comparison of major BERT-family models — RoBERTa, DistilBERT, ALBERT, DeBERTa v3 — covering architectural changes, training improvements, benchmark results, and when to use each.
sidebar:
  order: 6
---

## Why Variants Exist

The original BERT paper left several training decisions under-explored. Subsequent work showed BERT was **significantly undertrained**: more data, longer training, better masking, and hyperparameter tuning all yielded large gains without architectural changes. Other variants focused on making BERT smaller and faster for deployment.

---

## RoBERTa (2019)

**Paper:** Liu et al., "RoBERTa: A Robustly Optimized BERT Pretraining Approach"  
**By:** Facebook AI Research  
**HF Hub:** `FacebookAI/roberta-base`, `FacebookAI/roberta-large`

### Changes from BERT

| Change | BERT | RoBERTa |
|---|---|---|
| NSP objective | Yes | **Removed** — full-sentence packing instead |
| Training data | 16 GB (Books + Wiki) | **160 GB** (Books, Wiki, CC-News, OpenWebText, Stories) |
| Training steps | 1 M steps | **500K steps** (but larger batches) |
| Batch size | 256 | **8,192** (much larger) |
| Masking | Static (pre-processed once) | **Dynamic** (new mask each epoch) |
| Token encoding | WordPiece (char-level) | **BPE on bytes** (GPT-2 tokenizer, 50,265 vocab) |
| Sequence length during training | 128 mostly, 512 occasionally | Full 512 throughout |

### Why Remove NSP?

NSP was found to be too easy — models could predict `NotNext` by detecting topic shift (different document), not true discourse understanding. Removing NSP and using **full-document packing** (pack multiple sentences from the same document, separated by `[SEP]`) improves downstream performance consistently.

### Performance

| Benchmark | BERT-base | RoBERTa-base |
|---|---|---|
| GLUE | 84.6 | **88.1** |
| SQuAD v2 F1 | 76.3 | **86.8** |
| MNLI-m Acc | 84.6 | **87.6** |

### Usage

```python
from transformers import RobertaForSequenceClassification, RobertaTokenizer

tokenizer = RobertaTokenizer.from_pretrained("FacebookAI/roberta-base")
model = RobertaForSequenceClassification.from_pretrained("FacebookAI/roberta-base", num_labels=2)

# Note: RoBERTa uses token_type_ids=None (no segment embeddings)
inputs = tokenizer("I love this movie!", return_tensors="pt")
# No token_type_ids in output
```

---

## DistilBERT (2019)

**Paper:** Sanh et al., "DistilBERT, a distilled version of BERT"  
**By:** Hugging Face  
**HF Hub:** `distilbert/distilbert-base-uncased`

### Architecture Changes

DistilBERT uses **knowledge distillation** to compress BERT-base:

- **6 layers** (vs. 12) — initialized from every other BERT-base layer
- Same hidden size (768) and attention heads (12)
- Removed token type embeddings (no NSP)
- Removed pooler

### Knowledge Distillation Training

The student (DistilBERT) is trained to mimic the teacher (BERT-base) using three losses:

$$\mathcal{L} = \alpha \mathcal{L}_{\text{CE}} + \beta \mathcal{L}_{\text{MLM}} + \gamma \mathcal{L}_{\text{cos}}$$

| Loss | Formula | Purpose |
|---|---|---|
| $\mathcal{L}_{\text{CE}}$ | KL divergence of soft logits (temperature T=4) | Match teacher's output distribution |
| $\mathcal{L}_{\text{MLM}}$ | Standard MLM cross-entropy | Maintain language modeling ability |
| $\mathcal{L}_{\text{cos}}$ | Cosine distance between student/teacher hidden states | Align internal representations |

**Soft targets with temperature T:** $p_i = \frac{e^{z_i/T}}{\sum_j e^{z_j/T}}$ — higher temperature softens probabilities, carrying more information about teacher's uncertainty.

### Performance vs Size

| Metric | BERT-base | DistilBERT |
|---|---|---|
| Parameters | 110 M | **66 M** (40% smaller) |
| Inference speed | 1× | **~1.6×** faster |
| Memory | 1× | **~0.6×** |
| GLUE score | 84.6 | **82.8** (97% of BERT) |
| SST-2 accuracy | 93.5 | 91.3 |

### When to Use

- Edge deployment / mobile inference
- High-throughput serving where latency matters more than top-1 accuracy
- Embedding generation for semantic search where speed is critical

```python
from transformers import DistilBertForSequenceClassification, DistilBertTokenizer

tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")
model = DistilBertForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)

# Same API as BERT — no token_type_ids
inputs = tokenizer("Fast inference!", return_tensors="pt")
outputs = model(**inputs)
```

---

## ALBERT (2019)

**Paper:** Lan et al., "ALBERT: A Lite BERT for Self-supervised Learning of Language Representations"  
**By:** Google Research  
**HF Hub:** `albert/albert-base-v2`, `albert/albert-xxlarge-v2`

### Two Key Innovations

#### 1. Factorized Embedding Parameterization

Original BERT ties vocabulary size V with hidden size H: embedding matrix is $V \times H = 30522 \times 768 = 23.4\text{M}$ parameters.

ALBERT factorizes this into a small embedding size E (128) projected to H:

$$E_{\text{BERT}} \in \mathbb{R}^{V \times H} \quad \to \quad E_{\text{ALBERT}} \in \mathbb{R}^{V \times E} \cdot \mathbb{R}^{E \times H}$$

For V=30,000, H=768, E=128: $30000 \times 128 + 128 \times 768 = 3.95\text{M}$ (vs 23.4M for BERT). This makes the embedding layer 6× smaller with little accuracy loss.

#### 2. Cross-Layer Parameter Sharing

ALBERT shares **all** parameters across all 12 encoder layers (attention + FFN). The model has 12 layers in the computation graph but they are the same layer applied 12 times.

```
Layer 1 weights = Layer 2 weights = ... = Layer 12 weights
```

This reduces parameters dramatically while maintaining representational capacity.

#### 3. Sentence Order Prediction (SOP) replaces NSP

SOP is a harder task: given two consecutive sentences, predict which ordering is correct (original vs. swapped). Compared to NSP, SOP cannot be solved by topic detection alone.

### Model Variants

| Model | Parameters | GLUE |
|---|---|---|
| ALBERT-base | 12 M | 84.6 |
| ALBERT-large | 18 M | 86.5 |
| ALBERT-xlarge | 60 M | 87.9 |
| ALBERT-xxlarge | 235 M | **90.9** |

Note: parameter count is misleading — shared layers mean ALBERT-xxlarge has the same inference compute as a 235M non-shared model.

```python
from transformers import AlbertForSequenceClassification, AlbertTokenizer

tokenizer = AlbertTokenizer.from_pretrained("albert/albert-base-v2")
model = AlbertForSequenceClassification.from_pretrained("albert/albert-base-v2", num_labels=3)
```

---

## DeBERTa v3 (2021)

**Paper:** He et al., "DeBERTaV3: Improving DeBERTa using ELECTRA-Style Pre-Training with Gradient-Disentangled Embedding Sharing"  
**By:** Microsoft Research  
**HF Hub:** `microsoft/deberta-v3-base`, `microsoft/deberta-v3-large`

### Disentangled Attention (DeBERTa v1)

Standard BERT encodes each token as a single vector combining content and position. DeBERTa uses **two separate vectors** per token — one for content ($H_i$) and one for position ($P_i$) — and computes attention using all four combinations:

$$A_{i,j} = H_i H_j^\top + H_i P_{j-i}^\top + P_{i-j} H_j^\top$$

| Term | Meaning |
|---|---|
| $H_i H_j^\top$ | content-to-content |
| $H_i P_{j-i}^\top$ | content-to-position |
| $P_{i-j} H_j^\top$ | position-to-content |

Position vectors are relative (distance $j-i$), not absolute. This explicitly models the interaction between a token's content and its position relative to other tokens.

### ELECTRA-Style Pre-training (DeBERTa v3)

DeBERTa v3 replaces MLM with **Replaced Token Detection (RTD)**:

1. A small generator (DeBERTa-small) fills `[MASK]` positions with plausible tokens
2. The main discriminator DeBERTa-large must detect which tokens are "fake" (generated) vs "real"
3. Loss is binary classification for every token — uses **all** tokens, not just 15% masked positions

This is more sample-efficient than MLM: every token in every sequence contributes to the loss.

### Gradient-Disentangled Embedding Sharing (GDES)

DeBERTa v3 shares token embeddings between generator and discriminator but blocks gradients flowing from the discriminator back through the shared embeddings (to prevent the generator from becoming too good, which would make the discriminator's task trivial).

### Performance

| Task | BERT-base | RoBERTa-base | DeBERTa-v3-base |
|---|---|---|---|
| MNLI (acc) | 84.6 | 87.6 | **90.6** |
| SQuAD v2 (F1) | 76.3 | 86.8 | **88.4** |
| RACE (acc) | 65.0 | 73.0 | **81.8** |
| GLUE (avg) | 84.6 | 88.1 | **91.9** |

DeBERTa-v3-large achieves **SuperGLUE score of 90.3**, matching human performance on some tasks.

```python
from transformers import DebertaV2ForSequenceClassification, DebertaV2Tokenizer

tokenizer = DebertaV2Tokenizer.from_pretrained("microsoft/deberta-v3-base")
model = DebertaV2ForSequenceClassification.from_pretrained(
    "microsoft/deberta-v3-base",
    num_labels=3,
)
```

---

## ModernBERT (December 2024 / ACL 2025)

**Paper:** "Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder for Fast, Memory Efficient, and Long Document Understanding" (ACL 2025)  
**By:** Answer.AI, LightOn, and collaborators (including Jeremy Howard)  
**Released:** December 19, 2024  
**HF Hub:** `answerdotai/ModernBERT-base` (149M), `answerdotai/ModernBERT-large` (395M)

ModernBERT is the first true Pareto improvement over BERT since RoBERTa — better accuracy, better speed, and 16× longer context, all at once. It integrates 6 years of decoder-side improvements back into encoder architectures.

### Why ModernBERT Matters

Classic BERT:
- 512 token context window
- ~3.3 billion training tokens (Wikipedia + BooksCorpus)
- Static absolute positional embeddings
- Standard GELU activation
- All tokens attend to all tokens (quadratic attention)
- Token type IDs required for segment separation

ModernBERT:
- **8,192 token context window** (16× BERT)
- **2 trillion training tokens** (web, code, science)
- **Rotary Positional Embeddings (RoPE)** for long sequences
- **GeGLU activation** (better throughput and performance)
- **Alternating Attention** (efficient long-context)
- **Padding-free inference** (skips computation for padded tokens)
- **No Token Type IDs** (simpler, more generic)
- **Bias removal + Pre-normalization** (stabler training)

Previous encoder improvements always traded something off:

- **DeBERTa:** Better GLUE, but 2× slower and 5× the memory of BERT
- **ALBERT:** Far fewer parameters, but slower inference due to sequential shared layers
- **RoBERTa:** Better training data, but same architecture and 512 context limit

ModernBERT breaks the pattern: it is the **first base-size encoder to beat DeBERTa-v3 on GLUE** while using less than 1/5th of DeBERTa's memory and running 2–4× faster.

### Architectural Innovations

ModernBERT applies modern LLM techniques to the encoder-only paradigm:

#### 1. Rotary Positional Embeddings (RoPE)

Replaces BERT's absolute positional embeddings with RoPE, enabling:
- Better relative position awareness
- Generalization to longer sequences not seen during training
- Native support for 8,192-token context (vs. 512 for vanilla BERT)

#### 2. Alternating Attention (Local + Global)

Instead of full attention on every layer, ModernBERT uses **alternating attention**:
- **Local attention (most layers):** Each token attends only to the 128 nearest tokens. Complexity $O(n \cdot w)$ where $w = 128$.
- **Global attention (every 3rd layer):** Full bidirectional attention across the entire sequence. Complexity $O(n^2)$.

This allows long-context processing at drastically reduced cost:

```
Layer 1:  Local  → attend to window of 128 tokens
Layer 2:  Local  → attend to window of 128 tokens
Layer 3:  Global → attend to all 8192 tokens
Layer 4:  Local  → attend to window of 128 tokens
...
```

#### 3. GeGLU Activation Layers

Replaces the original BERT's GeLU MLP layers with Gated Linear Units (GeGLU), as used in modern LLMs like PaLM. This consistently improves representational quality for equivalent parameter count.

#### 4. Padding-Free Inference + Sequence Packing

ModernBERT completely eliminates padding waste:

- **Unpadding:** Remove all padding tokens before attention. Concatenate variable-length inputs into a single flat tensor.
- **Sequence Packing:** Use greedy bin-packing to fill each batch as close to 8192 tokens as possible.
- **Flash Attention 2:** Hardware-efficient attention that only needs standard Flash Attention (no xformers dependency).

Result: 10–20% speedup over previous unpadding methods. For variable-length real-world inputs, ModernBERT is **2–4× faster** than DeBERTa.

#### 5. No Token Type IDs

ModernBERT removes the segment embedding (token type IDs) used by BERT for sentence-pair tasks. This simplifies the architecture and makes it more generic — no special handling needed when processing single sequences.

#### 6. Bias Removal & Pre-Normalization

Biases are removed from linear layers throughout the model, and layer normalization is applied before the attention/FFN blocks (Pre-LN) rather than after (Post-LN). This improves training stability, especially at large context lengths.

#### 7. Hardware-Aware Model Design

Embedding dimensions (768 base, 1024 large) are **identical to original BERT** — enabling drop-in replacement. Internal dimensions were tuned for inference efficiency on common GPUs (RTX 3090/4090, A10, T4, L4) rather than benchmark hardware.

### Training Details

| Aspect | ModernBERT |
|---|---|
| Training tokens | 2 trillion (mostly unique) |
| Data mix | Web text, code, scientific articles, math |
| Masking rate | 30% (up from BERT's 15%) |
| Pre-training objective | MLM only (NSP removed) |
| Learning rate schedule | Warmup → constant → decay (trapezoid) |
| Context phases | Phase 1: 1T tokens @ 1024 ctx; Phase 2: 250B @ 8192 ctx; Phase 3: 50B annealing |
| Maximum context | 8,192 tokens |

Training: 3-phase approach. The stable phases release intermediate checkpoints (Pythia-style), enabling domain-specific annealing from any checkpoint.

### Performance Benchmarks

#### GLUE (Natural Language Understanding)

| Model | GLUE avg | Memory (relative) | Speed (variable-len) |
|---|---|---|---|
| BERT-base | 84.6 | 1.0× | 1.0× |
| RoBERTa-base | 88.1 | 1.0× | 1.0× |
| DeBERTa-v3-base | 91.9 | 5.0× | 0.5× |
| **ModernBERT-base** | **92.1** | **0.9×** | **2.0×** |
| **ModernBERT-large** | **93.4** | **1.2×** | **1.8×** |

ModernBERT-base is **the first sub-200M encoder to exceed DeBERTa-v3-base on GLUE**.

#### Long-Context Retrieval (ColBERT, 8k tokens)

| Model | Max context | Long-context BEIR | Code retrieval (SQA) |
|---|---|---|---|
| DeBERTa-v3-base | 512 | N/A | N/A |
| NomicBERT | 2048 | 52.1 | 48.3 |
| GTE-en-MLM | 8192 | 55.4 | 62.1 |
| **ModernBERT-large** | **8192** | **64.2** | **>80** |

ModernBERT is the **state-of-the-art long-context encoder with ColBERT** — 9 percentage points above other long-context models. It is also the **only open encoder to score >80 on Stack Overflow QA**, a code+text hybrid dataset.

#### RAG Implications

ModernBERT's 8k context window is transformative for RAG:
- **Larger chunks:** Process full documents instead of tiny 256-token fragments
- **Better coherence:** Semantic meaning preserved across longer contexts
- **Code search:** First encoder trained on significant code data — enables whole-repository indexing

### Usage

```python
from transformers import AutoTokenizer, AutoModel
import torch

# Drop-in replacement for any BERT pipeline
tokenizer = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")
model = AutoModel.from_pretrained("answerdotai/ModernBERT-base")

text = "ModernBERT is a state-of-the-art encoder for NLP tasks."
inputs = tokenizer(text, return_tensors="pt")
outputs = model(**inputs)

# outputs.last_hidden_state: [batch, seq_len, 768]
cls_embedding = outputs.last_hidden_state[:, 0, :]  # [CLS] token
```

**For classification (fine-tuning):**

```python
from transformers import AutoModelForSequenceClassification

model = AutoModelForSequenceClassification.from_pretrained(
    "answerdotai/ModernBERT-base",
    num_labels=2
)
```

**For retrieval with Sentence Transformers:**

```python
from sentence_transformers import SentenceTransformer

# Use ModernBERT-large as a powerful retrieval backbone
model = SentenceTransformer("answerdotai/ModernBERT-large")
embeddings = model.encode(["long document 1...", "long document 2..."])
```

### Ecosystem Status (as of May 2026)

- **HuggingFace Transformers:** Full native support (v4.48+)
- **Sentence Transformers:** Supported as backbone
- **vLLM:** Added encoder support (April 2025)
- **ONNX / TensorRT:** Community export scripts available
- **GliNER NER:** ModernBERT-based zero-shot NER models published
- **Multilingual:** mmBERT (September 2025) — ModernBERT goes multilingual

---

## Head-to-Head Comparison

| Model | Params | GLUE | Max Context | Speed (variable-len) | Key innovation |
|---|---|---|---|---|---|
| BERT-base | 110 M | 84.6 | 512 | 1.0× | Original bidirectional encoder |
| RoBERTa-base | 125 M | 88.1 | 512 | 1.0× | Better training recipe, more data |
| DistilBERT | 66 M | 82.8 | 512 | 1.6× | Knowledge distillation |
| ALBERT-base | 12 M | 84.6 | 512 | 0.9× | Parameter sharing, factored embeddings |
| ALBERT-xxlarge | 235 M | 90.9 | 512 | 0.4× | SOP + large capacity |
| DeBERTa-v3-base | 86 M | 91.9 | 512 | 0.5× | Disentangled attention + RTD |
| **ModernBERT-base** | **149 M** | **92.1** | **8192** | **2.0×** | **RoPE + alternating attention + code** |
| **ModernBERT-large** | **395 M** | **93.4** | **8192** | **1.8×** | **RoPE + alternating attention + code** |

---

## Practical Selection Guide

```
Best overall accuracy + speed?  → ModernBERT-base (new default choice)
Long context (>512 tokens)?     → ModernBERT-base or ModernBERT-large
Code retrieval / search?        → ModernBERT-large (only encoder trained on code)
Kaggle NLP competition?         → ModernBERT-large (dethroned DeBERTa-v3 as champion choice)
Best classification accuracy?   → ModernBERT-large (93.4 GLUE) or DeBERTa-v3-large
General production NLP?         → ModernBERT-base (robust, fast, drop-in BERT replacement)
Fast inference / edge?          → DistilBERT or DistilRoBERTa (smallest footprint)
Parameter-efficient deployment  → ALBERT-base (only 12M params)
Multilingual?                   → mmBERT (ModernBERT-based) or XLM-RoBERTa-base
Domain-specific tasks?
  Biomedical:  BioBERT / PubMedBERT
  Legal:       legal-bert-base-uncased
  Financial:   FinBERT / FLANG-BERT
  Scientific:  SciBERT
  Code:        ModernBERT-large
```

---

## See Also

- [BERT Architecture](../architecture) — baseline architecture all variants build on
- [Sentence-BERT](../sbert) — variants optimized for semantic similarity and embeddings
- [BERT in RAG](../bert-in-rag) — which BERT family model to use for retrieval vs. reranking
