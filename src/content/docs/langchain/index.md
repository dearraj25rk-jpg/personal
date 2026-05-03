---
title: LangChain Reference
description: "Architecture, LCEL, agents, memory, RAG pipelines, and production patterns — from zero to production-grade chains."
sidebar:
  order: 0
---

## What's in This Section

A deep reference guide for building production LangChain applications. Covers the full stack from installation and mental model through LCEL composition, chat models, prompt engineering, vector stores, RAG pipelines, agents, memory, and evaluation.

### Reference Docs

| Document | Description |
|---|---|
| [LangChain Deep Reference Guide](/ai-lab/langchain/langchain-reference/) | Complete reference: architecture, LCEL, agents, memory, RAG, production patterns |

### Interactive Visual Guides

These guides open as standalone interactive pages:

| Tool | Description |
|---|---|
| [LangChain Mastery](/ai-lab/langchain/langchain_mastery_general.html) ↗ | Visual walkthrough of LangChain architecture, LCEL, agents, and production patterns |

---

## Quick Start

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate

model = ChatAnthropic(model="claude-sonnet-4-5")
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("human", "{question}"),
])
chain = prompt | model
response = chain.invoke({"question": "What is LCEL?"})
```

See the [full reference guide](/ai-lab/langchain/langchain-reference/) for chains, RAG pipelines, agents, and production deployment patterns.

### What's New in LangChain v1.1 (May 2026)

- **`create_agent` API** — cleaner agent construction replacing `initialize_agent`
- **Model profiles** — `.profile` attribute on all LLMs for capability introspection
- **Content blocks** — structured response objects instead of plain strings
- **Composable middleware** — PII redaction, human approval as plug-and-play middleware
- **Fleet** (formerly LangSmith) — rebranded observability with expanded features
- **`langchain-classic`** — backward-compatible package for legacy chains
