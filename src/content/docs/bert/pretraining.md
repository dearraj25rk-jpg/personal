---
title: BERT Pre-training
description: Complete reference for BERT's two pre-training objectives — Masked Language Modeling (MLM) and Next Sentence Prediction (NSP) — with math, training data, compute details, and implementation notes.
sidebar:
  order: 4
---

## Overview

BERT is pre-trained on two self-supervised objectives simultaneously, using unlabeled text from BooksCorpus and English Wikipedia:

| Objective | Purpose | Head |
|---|---|---|
| **Masked Language Modeling (MLM)** | Learn bidirectional token representations | Per-token linear + softmax |
| **Next Sentence Prediction (NSP)** | Learn sentence-pair relationships | \[CLS\] linear + softmax |

Both losses are summed and optimized jointly:

$$\mathcal{L} = \mathcal{L}_{\text{MLM}} + \mathcal{L}_{\text{NSP}}$$

---

## Masked Language Modeling (MLM)

### The Idea

Standard language models (GPT) predict the next token — forcing left-to-right processing. MLM instead **randomly masks tokens** and asks the model to predict them using context from *both* sides. This bidirectional conditioning is what gives BERT its power.

### Masking Strategy

For each training sequence, **15% of WordPiece tokens** are selected for masking. Of those selected tokens:

| Replacement | Probability | Reason |
|---|---|---|
| `[MASK]` | 80% | Primary training signal |
| Random token | 10% | Forces model to keep representations of unmasked tokens useful |
| Unchanged | 10% | Prevents model from ignoring tokens without \[MASK\] |

**Why not always use `[MASK]`?** The `[MASK]` token never appears at fine-tuning time, creating a train-test mismatch. The 10%/10% noise prevents the model from learning to only activate on `[MASK]` positions.

```python
# Conceptual masking logic (simplified from transformers DataCollatorForLanguageModeling)
import torch, random

def mask_tokens(inputs, tokenizer, mlm_probability=0.15):
    labels = inputs.clone()
    # Sample 15% of tokens
    probability_matrix = torch.full(labels.shape, mlm_probability)
    masked_indices = torch.bernoulli(probability_matrix).bool()

    # Only compute loss on masked positions
    labels[~masked_indices] = -100  # -100 = ignore in CrossEntropyLoss

    # 80% → [MASK]
    indices_replaced = torch.bernoulli(torch.full(labels.shape, 0.8)).bool() & masked_indices
    inputs[indices_replaced] = tokenizer.convert_tokens_to_ids(tokenizer.mask_token)

    # 10% → random token
    indices_random = torch.bernoulli(torch.full(labels.shape, 0.5)).bool() & masked_indices & ~indices_replaced
    random_words = torch.randint(len(tokenizer), labels.shape, dtype=torch.long)
    inputs[indices_random] = random_words[indices_random]

    # 10% → unchanged (do nothing)
    return inputs, labels
```

### MLM Loss

The model outputs a logit vector of size V (vocabulary size) for each masked position. Standard cross-entropy loss is computed only over the masked positions:

$$\mathcal{L}_{\text{MLM}} = -\frac{1}{|\mathcal{M}|} \sum_{i \in \mathcal{M}} \log P(x_i \mid \tilde{x})$$

where $\mathcal{M}$ is the set of masked positions and $\tilde{x}$ is the corrupted input sequence.

### MLM Head Architecture

```
BERT encoder output  →  [batch, seq_len, 768]
Dense layer (768→768) + GELU
LayerNorm
Dense layer (768→vocab_size)   # vocab_size = 30,522
Softmax → probabilities over vocabulary
```

---

### MLM + NSP Visual Overview

```
                    BERT PRE-TRAINING OBJECTIVES
                    ─────────────────────────────────────────────

  MASKED LANGUAGE MODELING (MLM)
  ──────────────────────────────
  
  Original sentence: "The cat sat on the mat"
  
  Step 1: Randomly select 15% of tokens
          "The [MASK] sat on the [MASK]"
                ↑               ↑
           selected           selected
  
  Step 2: For each selected token:
    80% → Replace with [MASK]   "The [MASK] sat on the [MASK]"
    10% → Replace with random   "The dog sat on the apple"
    10% → Keep original         "The cat sat on the mat"
  
  Step 3: BERT predicts the original token at masked positions
  
          Input:    [CLS] The [MASK] sat on the [MASK] [SEP]
                                ↓                   ↓
          Predict:           "cat"               "mat"
                     (cross-entropy loss)


  NEXT SENTENCE PREDICTION (NSP) — Removed in RoBERTa / ModernBERT
  ─────────────────────────────────────────────────────────────────
  
  50% IsNext:    [CLS] Sentence A [SEP] Sentence B [SEP]  → label: IsNext
                       "Dogs bark."      "They are loud."
  
  50% NotNext:   [CLS] Sentence A [SEP] Random B [SEP]    → label: NotNext
                       "Dogs bark."      "Stars are distant."
  
  BERT's [CLS] output → binary classification head
  
  Note: NSP was found to be too easy (topic shift detection, not
  discourse understanding). RoBERTa, ALBERT, ModernBERT all drop it.
```

---

## Next Sentence Prediction (NSP)

### The Idea

Many downstream tasks (QA, NLI) require understanding the relationship between two sentences. NSP trains the model to distinguish consecutive sentence pairs from random pairs.

### Sampling Strategy

For each training example, sentence pair (A, B) is constructed as:

| Label | How sampled | Probability |
|---|---|---|
| `IsNext` (1) | B is the actual sentence following A in the corpus | 50% |
| `NotNext` (0) | B is a random sentence from a different document | 50% |

```
Input:  [CLS] the man went to the store [SEP] he bought a gallon of milk [SEP]
Label:  IsNext

Input:  [CLS] the man went to the store [SEP] penguins are birds [SEP]
Label:  NotNext
```

### NSP Head Architecture

```
BERT pooler output (CLS → dense + tanh → 768)
Dense layer (768 → 2)
Softmax → P(IsNext), P(NotNext)
```

$$\mathcal{L}_{\text{NSP}} = -\log P(y \mid h_{\text{[CLS]}})$$

### Controversy About NSP

RoBERTa (2019) showed that removing NSP and using **full-sentence packing** (no artificial sentence breaks) improves downstream performance. The conclusion: NSP teaches an easy shortcut (topic-matching) rather than deep sentence-pair reasoning. Later models (RoBERTa, ALBERT, DistilBERT) either remove or modify NSP.

---

## Pre-training Data

| Source | Size | Description |
|---|---|---|
| BooksCorpus | 800 M words | English books (fiction, non-fiction) — long sentence pairs |
| English Wikipedia | 2,500 M words | Text only, no lists or tables |
| **Total** | ~3.3 B words | |

Data was lowercased for the uncased model. Maximum sequence length: 512, but 90% of training used shorter sequences of 128 tokens to reduce compute.

---

## Training Configuration

### BERT-base

| Hyperparameter | Value |
|---|---|
| Batch size | 256 sequences |
| Training steps | 1,000,000 |
| Optimizer | Adam ($\beta_1=0.9$, $\beta_2=0.999$, $\epsilon=10^{-6}$) |
| Learning rate | 1e-4 |
| LR schedule | Linear warmup (10,000 steps), then linear decay |
| Weight decay | 0.01 |
| Dropout | 0.1 |
| Gradient clipping | 1.0 |
| Training time | 4 days on 16 × TPU v3 |

### BERT-large

| Hyperparameter | Value |
|---|---|
| Batch size | 256 |
| Training steps | 1,000,000 |
| Learning rate | 1e-4 |
| Training time | 4 days on 64 × TPU v3 |

---

## Whole-Word Masking (WWM)

The original BERT masks individual WordPiece tokens, which can create easy predictions. For example, if "playing" is tokenized as `["play", "##ing"]` and only `##ing` is masked, the model trivially predicts it from `play`.

**Whole-word masking** masks all subwords of a word together:

```
Original:   let 's go  play  ##ing  football
Standard:   let 's go [MASK] ##ing  football    ← easy
WWM:        let 's go [MASK] [MASK] football    ← harder, forces semantic understanding
```

`bert-base-uncased-whole-word-masking` and `bert-large-uncased-whole-word-masking` use WWM and achieve better results on reading comprehension.

---

## Dynamic Masking

The original BERT performs masking once during data preprocessing — each training example has a **fixed mask**. RoBERTa introduced **dynamic masking**: the mask is sampled fresh each time the example is seen, giving $O(\text{steps})$ unique masks per example. This substantially improves training efficiency.

---

## Running Pre-training from Scratch

```python
from transformers import (
    BertConfig, BertForPreTraining,
    DataCollatorForLanguageModeling,
    Trainer, TrainingArguments,
)
from datasets import load_dataset

# 1. Config
config = BertConfig(
    vocab_size=30522,
    hidden_size=768,
    num_hidden_layers=12,
    num_attention_heads=12,
    intermediate_size=3072,
    max_position_embeddings=512,
)

# 2. Model (randomly initialized)
model = BertForPreTraining(config)

# 3. Data collator handles MLM masking automatically
data_collator = DataCollatorForLanguageModeling(
    tokenizer=tokenizer,
    mlm=True,
    mlm_probability=0.15,
)

# 4. Trainer
training_args = TrainingArguments(
    output_dir="./bert-pretrained",
    per_device_train_batch_size=32,
    num_train_epochs=3,
    learning_rate=1e-4,
    warmup_steps=10000,
    weight_decay=0.01,
    fp16=True,
)

trainer = Trainer(
    model=model,
    args=training_args,
    data_collator=data_collator,
    train_dataset=tokenized_dataset,
)
trainer.train()
```

---

## Continued Pre-training (Domain Adaptation)

Rather than training from scratch, you can continue pre-training a released BERT checkpoint on your domain's text. This is common in biomedical (BioBERT), legal (Legal-BERT), and financial (FinBERT) NLP:

```python
from transformers import BertForMaskedLM, DataCollatorForLanguageModeling, Trainer, TrainingArguments

# Load released checkpoint
model = BertForMaskedLM.from_pretrained("bert-base-uncased")

# Fine-tune on domain corpus (just MLM, skip NSP)
data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=True)

training_args = TrainingArguments(
    output_dir="./biobert-continued",
    learning_rate=2e-5,   # lower LR to avoid catastrophic forgetting
    num_train_epochs=3,
    per_device_train_batch_size=16,
)
trainer = Trainer(model=model, args=training_args, data_collator=data_collator, train_dataset=ds)
trainer.train()
```

---

## See Also

- [BERT Architecture](../architecture) — how the encoder produces `[CLS]` and token representations
- [WordPiece Tokenization](../tokenization) — how raw text is converted to input IDs
- [Fine-tuning BERT](../finetuning) — adapting the pre-trained model to downstream tasks
