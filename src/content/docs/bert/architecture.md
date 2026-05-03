---
title: BERT Architecture
description: Complete technical reference for BERT's encoder-only Transformer architecture — embeddings, multi-head self-attention, feed-forward layers, residual connections, and layer normalization.
sidebar:
  order: 2
---

## Overview

BERT (Bidirectional Encoder Representations from Transformers) is a **language representation model** introduced by Google in 2018. Unlike GPT (which is decoder-only and reads left-to-right), BERT is **encoder-only** and reads the entire input sequence simultaneously in both directions. This bidirectionality gives BERT a richer contextual understanding of language.

**Key paper:** Devlin et al., "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding" (2018)  
**Available via:** [Hugging Face Hub](https://huggingface.co/google-bert/bert-base-uncased)

---

## Model Variants

| Model | Layers (L) | Hidden size (H) | Attention heads (A) | Parameters |
|---|---|---|---|---|
| BERT-base | 12 | 768 | 12 | 110 M |
| BERT-large | 24 | 1024 | 16 | 340 M |

The feed-forward dimension is always 4 × H (3,072 for base; 4,096 for large).

---

## Input Representation

BERT constructs each input token's representation as the **sum of three learned embeddings**:

$$\mathbf{E}_{input} = \mathbf{E}_{token} + \mathbf{E}_{segment} + \mathbf{E}_{position}$$

### 1. Token Embeddings

Each token in the vocabulary is mapped to a dense vector of size H. The vocabulary contains 30,522 tokens (uncased) built by WordPiece tokenization.

Special tokens added to every input:

| Token | Role |
|---|---|
| `[CLS]` | Prepended to every sequence; its final hidden state is used for classification |
| `[SEP]` | Separates two sentences; also appended at the end |
| `[PAD]` | Pads shorter sequences to `max_length` |
| `[MASK]` | Replaces tokens during Masked Language Modeling pre-training |
| `[UNK]` | Fallback for out-of-vocabulary characters |

### 2. Segment Embeddings

BERT can process two sentences simultaneously (sentence A and sentence B). Segment embeddings are learned vectors $E_A$ and $E_B$ indicating which sentence each token belongs to.

```
Input:    [CLS] The cat sat [SEP] The dog ran [SEP]
Segment:   A     A   A   A    A    B   B   B    B
```

### 3. Position Embeddings

BERT uses **learned** (not sinusoidal) absolute position embeddings for positions 0 through 511 (`max_position_embeddings = 512`). Each position maps to a unique H-dimensional vector.

---

## BERT Architecture Diagram

```
                    BERT ARCHITECTURE (BERT-base: 12 layers)
                    ─────────────────────────────────────────

  Input Text: "The cat sat on the mat"
       │
       ▼ WordPiece Tokenization
  [CLS] The  cat  sat  on  the  mat  [SEP]
    │    │    │    │    │    │    │    │
    ▼    ▼    ▼    ▼    ▼    ▼    ▼    ▼
  ┌─────────────────────────────────────────┐
  │       INPUT EMBEDDING LAYER             │
  │  E_token + E_segment + E_position       │
  │  → H = 768 dims per token               │
  └───────────────────┬─────────────────────┘
                      │ 8 token vectors, each 768-dim
                      ▼
  ┌─────────────────────────────────────────┐
  │         ENCODER BLOCK 1 of 12           │
  │                                         │
  │  ┌───────────────────────────────────┐  │
  │  │   MULTI-HEAD SELF-ATTENTION (12h) │  │
  │  │                                   │  │
  │  │  Q = W_Q · x  (768 → 768)        │  │
  │  │  K = W_K · x  (768 → 768)        │  │
  │  │  V = W_V · x  (768 → 768)        │  │
  │  │                                   │  │
  │  │  head_i = Attention(QW_i, KW_i, VW_i)│
  │  │  → each head: 768/12 = 64 dims   │  │
  │  │                                   │  │
  │  │  Attention(Q,K,V) =               │  │
  │  │    softmax(QK^T / √64) · V        │  │
  │  │                                   │  │
  │  │  MultiHead = concat(h1...h12)W_O │  │
  │  └──────────────────┬────────────────┘  │
  │                     │                   │
  │  ┌──────────────────▼────────────────┐  │
  │  │   ADD & LAYER NORM                │  │
  │  │   x = LayerNorm(x + attention)    │  │
  │  └──────────────────┬────────────────┘  │
  │                     │                   │
  │  ┌──────────────────▼────────────────┐  │
  │  │   FEED-FORWARD NETWORK            │  │
  │  │   FFN(x) = GELU(xW_1 + b_1)W_2   │  │
  │  │   768 → 3,072 → 768               │  │
  │  └──────────────────┬────────────────┘  │
  │                     │                   │
  │  ┌──────────────────▼────────────────┐  │
  │  │   ADD & LAYER NORM                │  │
  │  │   x = LayerNorm(x + FFN(x))       │  │
  │  └──────────────────┬────────────────┘  │
  └─────────────────────┼───────────────────┘
                        │ Repeat × 12
                        ▼
  ┌─────────────────────────────────────────┐
  │      OUTPUT: CONTEXTUALIZED VECTORS     │
  │                                         │
  │  [CLS] → 768-dim → classification head  │
  │  The   → 768-dim → token-level tasks    │
  │  cat   → 768-dim → NER, QA, etc.        │
  │  sat   → 768-dim                        │
  │  ...                                    │
  └─────────────────────────────────────────┘

  Key dimensions (BERT-base):
  ─────────────────────────────
  H (hidden size)     = 768
  A (attention heads) = 12
  d_k (per head)      = 768 / 12 = 64
  FFN intermediate    = 4 × 768 = 3,072
  Max positions       = 512
  Vocabulary          = 30,522 tokens
```

---

## Encoder Stack

BERT stacks L identical encoder layers. Each layer has two sub-layers:

1. **Multi-Head Self-Attention (MHSA)**
2. **Position-wise Feed-Forward Network (FFN)**

Each sub-layer has a residual connection followed by layer normalization:

$$\text{Output} = \text{LayerNorm}(x + \text{SubLayer}(x))$$

---

## Multi-Head Self-Attention

Self-attention allows every token to attend to every other token simultaneously.

### Scaled Dot-Product Attention

Given an input matrix $X \in \mathbb{R}^{n \times H}$ (n tokens, H dimensions), three projection matrices generate Queries, Keys, and Values:

$$Q = X W^Q, \quad K = X W^K, \quad V = X W^V$$

where $W^Q, W^K, W^V \in \mathbb{R}^{H \times d_k}$ and $d_k = H / A$ (head dimension).

$$\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V$$

The $\sqrt{d_k}$ scaling prevents the dot products from growing too large (which would push softmax into low-gradient regions).

### Multiple Heads

A heads run in parallel, each with independent projections:

$$\text{head}_i = \text{Attention}(Q W_i^Q,\; K W_i^K,\; V W_i^V)$$

$$\text{MultiHead}(Q,K,V) = \text{Concat}(\text{head}_1, \ldots, \text{head}_A)\, W^O$$

For BERT-base: A = 12 heads, $d_k = 768/12 = 64$, $W^O \in \mathbb{R}^{768 \times 768}$.

**Why multiple heads?** Each head can specialize in different relationships — one head may learn syntactic dependencies, another co-reference, another long-range paraphrasing.

---

## Feed-Forward Network

After attention, each position independently passes through a two-layer FFN:

$$\text{FFN}(x) = \text{GELU}(x W_1 + b_1)\, W_2 + b_2$$

| Component | Shape (BERT-base) |
|---|---|
| $W_1$ | $768 \times 3072$ |
| $b_1$ | $3072$ |
| $W_2$ | $3072 \times 768$ |
| $b_2$ | $768$ |

BERT uses **GELU** (Gaussian Error Linear Unit) as the activation, which outperforms ReLU for language tasks:

$$\text{GELU}(x) = x \cdot \Phi(x)$$

where $\Phi$ is the standard Gaussian CDF.

---

## Layer Normalization and Residual Connections

Both sub-layers use **Pre-LN or Post-LN** patterns. Original BERT uses Post-LN:

```
x_attn  = LayerNorm(x           + MHSA(x))
x_out   = LayerNorm(x_attn      + FFN(x_attn))
```

**LayerNorm** normalizes across the H dimension for each token independently:

$$\text{LayerNorm}(x) = \gamma \cdot \frac{x - \mu}{\sigma + \epsilon} + \beta$$

where $\gamma, \beta \in \mathbb{R}^H$ are learned affine parameters.

---

## Output

The encoder stack produces a contextualized vector for every input token: $\mathbf{H} \in \mathbb{R}^{n \times H}$.

- **`[CLS]` token vector** → used for sequence-level tasks (classification, NSP)
- **Per-token vectors** → used for token-level tasks (NER, span QA)
- **Pooled mean of all tokens** → used for sentence embeddings (Sentence-BERT)

---

## Parameter Count Breakdown (BERT-base)

| Component | Parameters |
|---|---|
| Token embeddings (30522 × 768) | 23.4 M |
| Position embeddings (512 × 768) | 393 K |
| Segment embeddings (2 × 768) | 1.5 K |
| 12 × Attention (Q, K, V, O projections) | 28.3 M |
| 12 × FFN (two linear layers) | 56.7 M |
| 12 × LayerNorm (γ, β) | 18.4 K |
| Pooler (dense + tanh on CLS) | 590 K |
| **Total** | **~110 M** |

---

## Code Example

```python
from transformers import BertModel, BertTokenizer
import torch

tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
model = BertModel.from_pretrained("bert-base-uncased")

text = "The quick brown fox jumps over the lazy dog"
inputs = tokenizer(text, return_tensors="pt", max_length=512, truncation=True)

with torch.no_grad():
    outputs = model(**inputs)

# outputs.last_hidden_state: [batch, seq_len, 768] — all token representations
# outputs.pooler_output:      [batch, 768]          — CLS token after linear+tanh
last_hidden = outputs.last_hidden_state   # shape: [1, 11, 768]
cls_vector  = outputs.pooler_output       # shape: [1, 768]
```

---

## Attention Complexity

Self-attention is $O(n^2 \cdot d)$ in compute and $O(n^2)$ in memory (the attention matrix). For BERT's max sequence length of 512:

- Attention matrix per head: $512 \times 512 = 262{,}144$ elements
- With 12 heads: $3{,}145{,}728$ elements per layer
- This is why long-document models like Longformer and BigBird introduced sparse attention patterns.

---

## See Also

- [WordPiece Tokenization](../tokenization) — how text is converted to token IDs
- [Pre-training Objectives](../pretraining) — MLM and NSP training details
- [BERT Variants](../variants) — RoBERTa, DistilBERT, ALBERT, DeBERTa
