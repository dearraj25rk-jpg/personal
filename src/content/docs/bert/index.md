---
title: BERT Architectures
description: Complete technical reference for BERT — architecture, tokenization, pre-training, fine-tuning, variants, Sentence-BERT, and RAG integration.
sidebar:
  order: 1
---

BERT (Bidirectional Encoder Representations from Transformers) is the foundational encoder-only Transformer model powering semantic search, NER, QA, NLI, and dense retrieval in production RAG systems. This section covers every layer of BERT — from WordPiece tokenization through self-attention math to deployment-ready fine-tuning code.

## Documentation Pages

| Page | What you'll learn |
|---|---|
| [Architecture](./architecture) | Encoder stack, multi-head self-attention math, FFN, LayerNorm, parameter counts |
| [WordPiece Tokenization](./tokenization) | Vocabulary construction algorithm, subword splitting, special tokens, padding, attention masks |
| [Pre-training Objectives](./pretraining) | MLM masking strategy, NSP, training data, compute, whole-word masking |
| [Fine-tuning](./finetuning) | Classification, NER (BIO tagging), extractive QA (SQuAD), NLI — full code |
| [BERT Variants](./variants) | RoBERTa, DistilBERT, ALBERT, DeBERTa v3 — architecture diffs and benchmarks |
| [Sentence-BERT (SBERT)](./sbert) | Siamese networks, pooling strategies, training objectives, sentence-transformers library |
| [BERT in RAG](./bert-in-rag) | Bi-encoder retrieval, cross-encoder reranking, ColBERT, BEIR benchmarks |

## Interactive Visual Guides

- [BERT Full Interactive Diagram](/ai-lab/bert/bert-full-diagram.html) — End-to-end walkthrough: embeddings, encoder stack, attention heads, and token flow
- [BERT Tokenizer Deep Dive](/ai-lab/bert/bert-tokenizer-deep-dive.html) — WordPiece tokenization: subword tokens, unknown words, vocabulary construction
- [BERT Encoder Block Deep Dive](/ai-lab/bert/bert-encoder-deep-dive.html) — Single encoder block breakdown: multi-head self-attention, feed-forward layers, residual connections, and layer normalization

## Quick Reference

### Model Sizes

| Model | Layers | Hidden | Heads | Parameters | Context |
|---|---|---|---|---|---|
| BERT-base | 12 | 768 | 12 | 110 M | 512 |
| BERT-large | 24 | 1024 | 16 | 340 M | 512 |
| DistilBERT | 6 | 768 | 12 | 66 M | 512 |
| ALBERT-base | 12 (shared) | 768 | 12 | 12 M | 512 |
| DeBERTa-v3-base | 12 | 768 | 12 | 86 M | 512 |
| **ModernBERT-base** | **22** | **768** | **12** | **149 M** | **8,192** |
| **ModernBERT-large** | **28** | **1024** | **16** | **395 M** | **8,192** |

**ModernBERT (Dec 2024 / ACL 2025) is the current recommended encoder** for new projects — 16× longer context, 2× faster, SOTA retrieval benchmarks.

### Key Formulas

**Scaled Dot-Product Attention:**
$$\text{Attention}(Q,K,V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right)V$$

**Mean Pooling (SBERT):**
$$\mathbf{u} = \frac{\sum_i m_i \mathbf{h}_i}{\sum_i m_i}$$

**BiEncoder Retrieval:**
$$\text{score}(q,d) = \text{cos\_sim}(\text{Enc}_Q(q),\; \text{Enc}_D(d))$$

### Task → Head Mapping

| Task | BERT output used | Head |
|---|---|---|
| Text classification | `[CLS]` pooled | Linear → softmax |
| NER | Per-token vectors | Linear → softmax (per token) |
| Extractive QA | Per-token vectors | Two linears (start, end logits) |
| Sentence embedding | Mean of all tokens | None (direct use) |
| Reranking | `[CLS]` | Linear → scalar score |
