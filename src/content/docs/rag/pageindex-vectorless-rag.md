---
title: "Vectorless RAG — Complete Guide"
description: Why vector similarity fails for structured documents, and how PageIndex, contextual retrieval, BM25, GraphRAG, long-context LLMs, and NL2SQL replace or reduce it — with flow diagrams and full implementations. May 2026.
sidebar:
  order: 14
---

> **Current as of May 2026.**

## What is RAG? (Beginner Recap)

RAG — **Retrieval-Augmented Generation** — is a pattern where an LLM answers questions by first fetching relevant information from a document store, then using that information to generate its answer.

```
  USER QUESTION
       │
       ▼
  ┌──────────────┐     fetch relevant docs      ┌──────────────┐
  │  Retrieval   │ ────────────────────────────▶ │  Documents   │
  │   System     │ ◀──────────────────────────── │    Store     │
  └──────────────┘     return matching chunks    └──────────────┘
       │
       │ question + retrieved context
       ▼
  ┌──────────────┐
  │     LLM      │ ──▶  Final Answer
  └──────────────┘
```

**Standard (vector) RAG** converts both documents and queries into numerical vectors (embeddings), then finds documents whose vectors are closest to the query vector — a process called **cosine similarity search**.

This works great for prose. It breaks down badly for structured data.

---

## Why Vectors Fail — The Core Problem

### What embeddings actually represent

An embedding model converts text into a list of ~768–3072 numbers that encode **semantic meaning**. Two sentences that mean the same thing get similar vectors, even if they use different words.

```
  "The dog ran quickly."     →  [0.23, -0.11, 0.87, 0.04, ...]
  "The canine moved fast."   →  [0.24, -0.10, 0.85, 0.03, ...]
                                  ↑ Very similar — correct!

  "Q3 revenue: $39.7B"       →  [0.11,  0.03, 0.42, 0.71, ...]
  "What was Q3 revenue?"     →  [0.10,  0.04, 0.45, 0.68, ...]
                                  ↑ Reasonably similar... but
```

The problem isn't the similarity — it's **everything else that gets lost**:

```
  WHAT VECTORS CAPTURE          WHAT VECTORS LOSE
  ─────────────────────         ──────────────────────────────
  Semantic similarity           Exact numbers (39.7 vs 39.8)
  Topic/subject matter          Table structure (rows/columns)
  General meaning               Cross-references ("see Note 12")
  Paraphrases                   Document position/section context
  Synonyms                      Negative statements
                                Relative comparisons
                                Multi-page reasoning chains
```

### Concrete failure examples

**Failure 1: Exact number retrieval**

```
  Query:  "What was Apple's iPhone revenue in Q3 FY2023?"

  In the 10-K filing, Page 14 contains:
  ┌────────────────────────────────────────────────────────┐
  │  Net sales by product (in millions):                   │
  │  ─────────────────────────────────────────────────     │
  │  Products      Q3 2023    Q3 2022    Change            │
  │  iPhone        $39,669    $40,665    -2.4%             │
  │  Mac            $6,840     $7,382    -7.3%             │
  │  iPad           $5,791     $7,224    -19.8%            │
  └────────────────────────────────────────────────────────┘

  This table was chunked as plain text → embedding can't
  distinguish "$39,669" from any other number in the doc.

  Vector search may return the wrong page (e.g., a page
  that discusses "iPhone revenue" in narrative prose)
  while missing the actual table on Page 14.
```

**Failure 2: Cross-reference resolution**

```
  Page 8 (narrative):
  "The contingent liabilities described in Note 14 could
   materially affect our liquidity position."

  Page 47 (Note 14):
  "Contingent liabilities: $2.3B in pending litigation..."

  Vector RAG chunks these separately. A query about 
  "liquidity risks from litigation" may retrieve Page 8
  WITHOUT Page 47 — missing the actual dollar amount.
```

**Failure 3: Structural reasoning**

```
  Query: "Compare R&D spend across all three business segments"

  Answer requires:
  ├── Page 22: Segment A R&D table
  ├── Page 31: Segment B R&D table
  └── Page 39: Segment C R&D table

  Top-k retrieval (k=5) likely returns 5 chunks from
  whichever single segment scored highest — incomplete answer.
```

**Failure 4: Negation**

```
  Query: "Which regions were NOT affected by supply disruptions?"

  Embeddings treat "affected" and "not affected" as similar
  (negation is weakly encoded in most embedding models).
  
  Result: RAG returns chunks about regions THAT WERE affected,
  which is the opposite of what was asked.
```

---

## The Vectorless RAG Landscape

Rather than one replacement, "vectorless RAG" is a **family of approaches** — each suited to different document types and query patterns.

```
  ╔══════════════════════════════════════════════════════════════╗
  ║               VECTORLESS RAG LANDSCAPE                       ║
  ╠══════════════════════════════════════════════════════════════╣
  ║                                                              ║
  ║  ┌─────────────────────────────────────────────────────┐    ║
  ║  │  TIER 0 — NO RETRIEVAL (Long-Context LLMs)          │    ║
  ║  │  Entire document fits in the model's context window  │    ║
  ║  │  Gemini 1.5 Pro (1M tokens), Claude 3.x (200k)      │    ║
  ║  └─────────────────────────────────────────────────────┘    ║
  ║                           ▼                                  ║
  ║              (when document exceeds context)                 ║
  ║                           ▼                                  ║
  ║  ┌──────────────┬──────────────┬──────────────┐             ║
  ║  │  TIER 1      │   TIER 1     │   TIER 1     │             ║
  ║  │  PageIndex   │  GraphRAG    │ SQL/FTS      │             ║
  ║  │  Structured  │  Relational  │  Tabular &   │             ║
  ║  │  PDFs/docs   │  entity data │  databases   │             ║
  ║  └──────────────┴──────────────┴──────────────┘             ║
  ║                           ▼                                  ║
  ║              (when structure is unavailable)                 ║
  ║                           ▼                                  ║
  ║  ┌──────────────┬──────────────┬──────────────┐             ║
  ║  │  TIER 2      │   TIER 2     │   TIER 2     │             ║
  ║  │  BM25        │   SPLADE     │  Full-Text   │             ║
  ║  │  Keyword     │  Learned     │  Search      │             ║
  ║  │  retrieval   │  sparse      │  (Elastic)   │             ║
  ║  └──────────────┴──────────────┴──────────────┘             ║
  ║                           ▼                                  ║
  ║         (when both semantic + exact needed together)         ║
  ║                           ▼                                  ║
  ║  ┌─────────────────────────────────────────────────────┐    ║
  ║  │  HYBRID — Sparse + Dense + Contextual Retrieval      │    ║
  ║  │  BM25 + Vector + Contextual summaries (Anthropic)    │    ║
  ║  └─────────────────────────────────────────────────────┘    ║
  ╚══════════════════════════════════════════════════════════════╝

  Deep dives:  BM25 & Sparse →  ./bm25-sparse-retrieval
               GraphRAG       →  ./graph-rag
               Contextual     →  ./contextual-retrieval
```

---

## PageIndex — LLM-Native Document Navigation

### The Big Idea

PageIndex replaces vector similarity search with **LLM reasoning**. Instead of asking "which chunks are mathematically similar to the query?", it asks "LLM: read this document index and tell me which pages contain the answer."

```
  VECTOR RAG (how it works)          PAGEINDEX (how it works)
  ──────────────────────────         ──────────────────────────
  
  1. Chunk document into ~500        1. Keep each PAGE as a unit
     token pieces                       (no chunking across pages)
          │                                    │
          ▼                                    ▼
  2. Embed each chunk → vec          2. LLM reads each page →
     [0.23, -0.11, 0.87...]             writes a 3-sentence summary
          │                                    │
          ▼                                    ▼
  3. Store in vector database        3. Build hierarchical index
     (FAISS, Pinecone, Weaviate)         of all page summaries
          │                                    │
     QUERY TIME                         QUERY TIME
          │                                    │
          ▼                                    ▼
  4. Embed query → vec               4. LLM reads the index →
     compute cosine similarity           selects relevant pages
          │                                    │
          ▼                                    ▼
  5. Return top-k similar chunks     5. Read selected pages IN FULL
          │                                    │
          ▼                                    ▼
  6. LLM generates answer            6. LLM synthesizes precise answer
     from truncated chunks               from complete page context
```

### Full Pipeline — Step by Step

```
  ┌────────────────────────────────────────────────────────────┐
  │                   PAGEINDEX PIPELINE                        │
  │                                                             │
  │  INPUT: Apple 10-K annual report (PDF, 112 pages)          │
  └───────────────────────────┬────────────────────────────────┘
                              │
                              ▼
  ╔═══════════════════════════════════════════════════════════╗
  ║  PHASE 1: PAGE EXTRACTION                                 ║
  ║                                                           ║
  ║  Page 1  → text + metadata (no tables)                   ║
  ║  Page 14 → text + 2 tables (revenue breakdown)           ║
  ║  Page 47 → text + 1 table (Note 14: contingencies)       ║
  ║  Page 78 → text + 3 charts (described as text)           ║
  ║  ...                                                      ║
  ║  Page 112 → text + signature block                       ║
  ║                                                           ║
  ║  Tool: PyMuPDF (fitz)                                     ║
  ║  Output: list of {page_num, text, tables, figures}        ║
  ╚═══════════════════════════════════╦═══════════════════════╝
                                      ║
                                      ▼
  ╔═══════════════════════════════════════════════════════════╗
  ║  PHASE 2: LLM SUMMARIZATION (per page)                   ║
  ║                                                           ║
  ║  LLM prompt for Page 14:                                  ║
  ║  "Describe what's on this page in 2-3 sentences.          ║
  ║   Include: section, key figures, any tables."             ║
  ║                                                           ║
  ║  LLM output:                                              ║
  ║  "Page 14 contains Apple's Q3 FY2023 net sales           ║
  ║   breakdown by product. Key figures: iPhone $39.7B,       ║
  ║   Mac $6.8B, iPad $5.8B. Includes YoY % change table."  ║
  ║                                                           ║
  ║  ★ This is the navigation signal — not a vector ★         ║
  ╚═══════════════════════════════════╦═══════════════════════╝
                                      ║
                                      ▼
  ╔═══════════════════════════════════════════════════════════╗
  ║  PHASE 3: INDEX ASSEMBLY                                  ║
  ║                                                           ║
  ║  # Apple 10-K FY2023 — Page Index                        ║
  ║  ## Page 1                                                ║
  ║  Cover page. Company name, fiscal year end date.          ║
  ║  ## Page 2                                                ║
  ║  Table of contents listing 8 sections + exhibits.         ║
  ║  ## Page 14                                               ║
  ║  Q3 FY2023 net sales by product. iPhone $39.7B...         ║
  ║  ## Page 47                                               ║
  ║  Note 14: Contingent liabilities. $2.3B litigation.       ║
  ║  ...                                                      ║
  ║                                                           ║
  ║  Total index: ~15,000 tokens (fits in a single prompt)    ║
  ╚═══════════════════════════════════╦═══════════════════════╝
                                      ║
                                      ║
              ┌─────────────────────────────────────┐
              │  USER QUERY                         │
              │  "What was iPhone revenue in Q3?"   │
              └──────────────────┬──────────────────┘
                                 │
                                 ▼
  ╔═══════════════════════════════════════════════════════════╗
  ║  PHASE 4: LLM PAGE NAVIGATION                            ║
  ║                                                           ║
  ║  LLM reads the full index and outputs:                   ║
  ║  {                                                        ║
  ║    "pages": [14],                                         ║
  ║    "reasoning": "Page 14 explicitly mentions iPhone       ║
  ║                  $39.7B for Q3 FY2023 in a product        ║
  ║                  revenue breakdown table."                ║
  ║  }                                                        ║
  ║                                                           ║
  ║  This is pure reasoning — no cosine similarity            ║
  ╚═══════════════════════════════════╦═══════════════════════╝
                                      ║
                                      ▼
  ╔═══════════════════════════════════════════════════════════╗
  ║  PHASE 5: FULL PAGE READ                                  ║
  ║                                                           ║
  ║  Read Page 14 COMPLETELY:                                 ║
  ║  - All narrative text                                     ║
  ║  - Full table with all rows and columns                   ║
  ║  - All footnotes on the page                              ║
  ║                                                           ║
  ║  No chunk boundary truncation. No missing table rows.     ║
  ╚═══════════════════════════════════╦═══════════════════════╝
                                      ║
                                      ▼
  ╔═══════════════════════════════════════════════════════════╗
  ║  PHASE 6: SYNTHESIS                                       ║
  ║                                                           ║
  ║  LLM answer:                                              ║
  ║  "Apple's iPhone revenue in Q3 FY2023 was $39,669M       ║
  ║   ($39.7B), a decline of 2.4% from $40,665M in Q3        ║
  ║   FY2022. (Source: Page 14, Net Sales by Product table)"  ║
  ╚═══════════════════════════════════════════════════════════╝
```

### Why PageIndex Scores 98.7% on FinanceBench

**FinanceBench** (Islam et al., 2023) is a benchmark of 150 questions over public company financial filings (10-K, 10-Q). Questions require exact figure lookup, cross-table reasoning, and multi-page synthesis — all scenarios where vector RAG fails.

```
  FinanceBench Accuracy Comparison
  ─────────────────────────────────────────────────────
  
  GPT-4 (no retrieval, from memory)      ████░░░░░░  ~46%
  Standard vector RAG (top-k chunks)     ██████░░░░  ~60%
  Advanced RAG (hybrid + rerank)         ███████░░░  ~72%
  Self-RAG / Agentic RAG                 ████████░░  ~81%
  PageIndex (LLM navigation)             ██████████  98.7%
  ─────────────────────────────────────────────────────
  
  The gap from 81% → 98.7% comes from:
  ✓ Tables read intact (no truncation)
  ✓ Cross-references resolved across pages
  ✓ LLM understands document structure (10-K sections)
  ✓ Exact numbers preserved (no embedding blurring)
  ✓ Multi-page synthesis without retrieval gaps
```

---

## Implementation — Anthropic SDK

### Full PageIndex System

```python
"""
pageindex.py — Full PageIndex implementation using Anthropic SDK
"""
import json
import fitz  # PyMuPDF: pip install pymupdf
import anthropic
from dataclasses import dataclass, field
from typing import Optional

client = anthropic.Anthropic()

# ─── Data structures ──────────────────────────────────────────

@dataclass
class Page:
    page_num: int
    text: str
    tables: list[list]        # list of extracted tables (row × col)
    char_count: int
    summary: Optional[str] = None   # filled in Phase 2

@dataclass
class PageIndex:
    doc_path: str
    pages: list[Page] = field(default_factory=list)
    index_text: str = ""              # the assembled navigation index

# ─── Phase 1: Extract pages ───────────────────────────────────

def extract_pages(pdf_path: str) -> list[Page]:
    """
    Extract each PDF page as a separate unit.
    Tables are extracted intact — no chunking across page boundaries.
    """
    doc = fitz.open(pdf_path)
    pages = []

    for i, page in enumerate(doc):
        # Extract text with layout (preserves column order)
        text = page.get_text("text", sort=True)

        # Extract tables as structured data
        table_finder = page.find_tables()
        tables = []
        for table in table_finder:
            extracted = table.extract()    # returns list of rows
            if extracted:
                tables.append(extracted)

        pages.append(Page(
            page_num=i + 1,
            text=text,
            tables=tables,
            char_count=len(text),
        ))

    doc.close()
    return pages


# ─── Phase 2: Summarize each page ─────────────────────────────

def summarize_page(page: Page, document_type: str = "financial filing") -> str:
    """
    Ask the LLM to write a dense navigation summary for each page.
    This summary is the ONLY thing used during query navigation —
    so it needs to capture all searchable facts.
    """
    # Build a text representation including table data
    content_parts = [f"[Page {page.page_num}]\n{page.text[:4000]}"]

    if page.tables:
        for i, table in enumerate(page.tables):
            # Format table as markdown for the LLM
            if table:
                header = " | ".join(str(cell) for cell in table[0])
                rows = "\n".join(
                    " | ".join(str(cell or "") for cell in row)
                    for row in table[1:4]    # first 4 data rows
                )
                content_parts.append(f"\n[Table {i+1}]\n{header}\n{rows}")

    content = "\n".join(content_parts)

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",   # fast + cheap for indexing
        max_tokens=300,
        system=f"""You are building a navigation index for a {document_type}.
For each page, write a 2-4 sentence summary that captures:
1. Which section or topic this page covers
2. Any specific numbers, dates, or named entities
3. Whether there are tables, charts, or footnotes — and what they show

Be specific. This summary is used to decide whether to read this page.
Output ONLY the summary sentences, no preamble.""",
        messages=[{"role": "user", "content": content}],
    )
    return response.content[0].text.strip()


def build_summaries(
    pages: list[Page],
    document_type: str = "financial filing",
    batch_pause: float = 0.5,
) -> list[Page]:
    """
    Summarize all pages. Uses claude-haiku for speed and cost efficiency.
    For a 100-page document: ~$0.05 total at haiku pricing.
    """
    import time

    for page in pages:
        page.summary = summarize_page(page, document_type)
        time.sleep(batch_pause)    # respect rate limits

    return pages


# ─── Phase 3: Assemble the index ──────────────────────────────

def assemble_index(pages: list[Page], doc_title: str = "Document") -> str:
    """
    Combine per-page summaries into a hierarchical navigation index.
    The LLM will read this index in Phase 4 to decide which pages to fetch.
    """
    lines = [f"# {doc_title} — Page Navigation Index\n",
             f"Total pages: {len(pages)}\n"]

    for page in pages:
        lines.append(f"## Page {page.page_num}")
        lines.append(page.summary or "[No summary generated]")
        if page.tables:
            lines.append(f"*{len(page.tables)} table(s) present*")
        lines.append("")    # blank line between entries

    return "\n".join(lines)


# ─── Phase 4: LLM navigation ──────────────────────────────────

def navigate_index(
    question: str,
    index_text: str,
    max_pages: int = 6,
) -> dict:
    """
    LLM reads the index and selects the pages most likely to contain
    the answer. Returns page numbers + reasoning.
    """
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=f"""You are navigating a document index to find information.

Given the document's page index, identify which pages to read to answer the question.

Rules:
- Select only pages that are LIKELY to contain the answer
- Select at most {max_pages} pages
- If the question requires cross-referencing (e.g., "see Note X"), include all referenced pages
- Return JSON only: {{"pages": [14, 47], "reasoning": "Page 14 has revenue table; Page 47 has Note 14 details"}}""",
        messages=[{
            "role": "user",
            "content": f"Question: {question}\n\n{index_text}"
        }],
    )

    raw = response.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


# ─── Phase 5 & 6: Read pages + synthesize ─────────────────────

def read_pages(page_nums: list[int], pages: list[Page]) -> str:
    """
    Fetch the full content of selected pages.
    Tables are formatted as readable markdown.
    """
    parts = []
    page_map = {p.page_num: p for p in pages}

    for num in page_nums:
        page = page_map.get(num)
        if not page:
            continue

        section = [f"{'='*60}", f"PAGE {num}", f"{'='*60}", page.text]

        if page.tables:
            for i, table in enumerate(page.tables):
                if not table:
                    continue
                header = " | ".join(str(c) for c in table[0])
                separator = " | ".join("---" for _ in table[0])
                rows = "\n".join(
                    " | ".join(str(c or "") for c in row)
                    for row in table[1:]
                )
                section.append(f"\n[Table {i+1}]\n{header}\n{separator}\n{rows}")

        parts.append("\n".join(section))

    return "\n\n".join(parts)


def synthesize_answer(question: str, page_content: str) -> str:
    """
    Generate the final answer from complete page content.
    """
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system="""Answer the question using ONLY the provided document pages.
- Be precise with numbers — copy exact figures from the document
- Cite the page number for every specific fact
- If the answer spans multiple pages, synthesize clearly
- If the pages don't contain enough information, say so explicitly""",
        messages=[{
            "role": "user",
            "content": f"Question: {question}\n\nDocument pages:\n{page_content}"
        }],
    )
    return response.content[0].text


# ─── Main entry point ──────────────────────────────────────────

def pageindex_query(
    question: str,
    idx: PageIndex,
) -> dict:
    """
    Answer a question using PageIndex navigation.
    Returns the answer, selected pages, and reasoning.
    """
    # Phase 4: Navigate
    nav = navigate_index(question, idx.index_text)
    selected_page_nums = nav.get("pages", [])

    if not selected_page_nums:
        return {
            "answer": "Could not identify relevant pages.",
            "pages_consulted": [],
            "reasoning": nav.get("reasoning", ""),
        }

    # Phase 5: Read selected pages
    page_content = read_pages(selected_page_nums, idx.pages)

    # Phase 6: Synthesize
    answer = synthesize_answer(question, page_content)

    return {
        "answer": answer,
        "pages_consulted": selected_page_nums,
        "reasoning": nav.get("reasoning", ""),
    }


# ─── Usage example ────────────────────────────────────────────

if __name__ == "__main__":
    # Build index (one-time, cache the result)
    pages = extract_pages("apple_10k_2023.pdf")
    pages = build_summaries(pages, document_type="annual report (10-K)")
    index_text = assemble_index(pages, doc_title="Apple Inc. 10-K FY2023")

    idx = PageIndex(
        doc_path="apple_10k_2023.pdf",
        pages=pages,
        index_text=index_text,
    )

    # Query
    result = pageindex_query(
        "What was iPhone revenue in Q3 FY2023, and how did it compare to Q3 FY2022?",
        idx,
    )

    print(f"Answer: {result['answer']}")
    print(f"Pages used: {result['pages_consulted']}")
    print(f"Reasoning: {result['reasoning']}")
```

---

## Implementation — LangChain Custom Retriever

For teams already using LangChain pipelines, PageIndex integrates as a custom retriever:

```python
"""
pageindex_langchain.py — PageIndex as a LangChain retriever
"""
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from langchain_core.callbacks import CallbackManagerForRetrieverRun
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
import fitz
import json


# ─── Pydantic schema for structured navigation output ──────────

class PageSelection(BaseModel):
    pages: list[int] = Field(description="Page numbers to retrieve")
    reasoning: str = Field(description="Why these pages were selected")


# ─── LangChain retriever ───────────────────────────────────────

class PageIndexRetriever(BaseRetriever):
    """
    A LangChain retriever that uses LLM navigation over a page index
    instead of vector similarity search.

    Usage:
        retriever = PageIndexRetriever.from_pdf("document.pdf")
        docs = retriever.invoke("What was Q3 revenue?")
    """

    pages: list[dict]
    index_text: str
    nav_llm: ChatAnthropic = Field(
        default_factory=lambda: ChatAnthropic(model="claude-sonnet-4-6")
    )
    max_pages: int = 6

    class Config:
        arbitrary_types_allowed = True

    @classmethod
    def from_pdf(
        cls,
        pdf_path: str,
        document_type: str = "document",
        summarizer_model: str = "claude-haiku-4-5-20251001",
    ) -> "PageIndexRetriever":
        """Build a PageIndexRetriever from a PDF file."""
        import anthropic
        import time

        client = anthropic.Anthropic()
        doc = fitz.open(pdf_path)
        pages_data = []

        for i, page in enumerate(doc):
            text = page.get_text("text", sort=True)
            tables = [t.extract() for t in page.find_tables()]

            # Summarize page
            content = text[:3000]
            if tables:
                content += f"\n[Contains {len(tables)} table(s)]"

            resp = client.messages.create(
                model=summarizer_model,
                max_tokens=250,
                messages=[{
                    "role": "user",
                    "content": f"Summarize page {i+1} of this {document_type} in 2-3 sentences. Include specific numbers and what tables/sections are present.\n\n{content}"
                }],
            )
            summary = resp.content[0].text.strip()
            pages_data.append({
                "page_num": i + 1,
                "text": text,
                "tables": tables,
                "summary": summary,
            })
            time.sleep(0.3)

        doc.close()

        # Build index text
        lines = [f"# {document_type} Page Index\n"]
        for p in pages_data:
            lines.append(f"## Page {p['page_num']}\n{p['summary']}\n")
        index_text = "\n".join(lines)

        return cls(pages=pages_data, index_text=index_text)

    def _get_relevant_documents(
        self,
        query: str,
        *,
        run_manager: CallbackManagerForRetrieverRun,
    ) -> list[Document]:
        """Core retrieval: LLM navigates index, returns full-page Documents."""

        nav_prompt = ChatPromptTemplate.from_messages([
            ("system", f"""Navigate the document index to find pages relevant to the query.
Return JSON: {{"pages": [list of page numbers], "reasoning": "explanation"}}
Select at most {self.max_pages} pages."""),
            ("human", "Query: {query}\n\n{index}"),
        ])

        chain = nav_prompt | self.nav_llm | JsonOutputParser()
        nav_result = chain.invoke({"query": query, "index": self.index_text})
        selected_nums = nav_result.get("pages", [])

        # Build LangChain Documents from selected pages
        docs = []
        page_map = {p["page_num"]: p for p in self.pages}

        for num in selected_nums[:self.max_pages]:
            page = page_map.get(num)
            if not page:
                continue

            # Format tables as markdown
            table_text = ""
            for i, table in enumerate(page.get("tables", [])):
                if table:
                    rows = "\n".join(" | ".join(str(c or "") for c in row) for row in table)
                    table_text += f"\n\n[Table {i+1}]\n{rows}"

            docs.append(Document(
                page_content=page["text"] + table_text,
                metadata={
                    "page_num": num,
                    "source": "pageindex",
                    "reasoning": nav_result.get("reasoning", ""),
                },
            ))

        return docs


# ─── Wire into a standard LangChain QA chain ──────────────────

from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough


def build_pageindex_chain(pdf_path: str, document_type: str = "financial filing"):
    retriever = PageIndexRetriever.from_pdf(pdf_path, document_type)

    prompt = PromptTemplate.from_template("""Answer using only the document pages below.
Cite page numbers for all specific figures.

Pages:
{context}

Question: {question}

Answer:""")

    def format_docs(docs):
        return "\n\n".join(
            f"[Page {d.metadata['page_num']}]\n{d.page_content}" for d in docs
        )

    llm = ChatAnthropic(model="claude-sonnet-4-6", max_tokens=1024)

    chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain


# ─── Usage ────────────────────────────────────────────────────

if __name__ == "__main__":
    chain = build_pageindex_chain("apple_10k_2023.pdf", "annual report")
    answer = chain.invoke("What was iPhone revenue in Q3 FY2023?")
    print(answer)
```

---

## Long-Context LLMs — When to Skip Retrieval Entirely

Before building any retrieval system, ask: **does the document fit in the model's context window?**

```
  CONTEXT WINDOW SIZES (May 2026)
  ──────────────────────────────────────────────────────────────
  Model                    Context      ~Pages of text   Cost/query*
  ────────────────────────────────────────────────────────────────
  GPT-4o (2025)            128K         ~100 pages       $0.05
  Claude Haiku 4.5         200K         ~150 pages       $0.005
  claude-sonnet-4-6        200K         ~150 pages       $0.09
  claude-opus-4-7          200K         ~150 pages       $0.45
  Gemini 2.0 Flash         1M tokens    ~750 pages       $0.075
  Gemini 2.0 Pro           2M tokens    ~1,500 pages     $0.30
  ────────────────────────────────────────────────────────────────
  * Approximate, based on $3/MTok for 150-page doc (100K tokens)

  Rule: 1 page ≈ 500–700 tokens (text-heavy financial doc)
        1 page ≈ 300–400 tokens (sparse layout, large font)

  Key 2025–2026 update: Gemini 2.0 Flash (released Feb 2025)
  increased the practical limit for "no retrieval" to ~750 pages
  at a reasonable cost per query.
```

**When long-context beats retrieval:**

```
  Document size ≤ model's context?
          │
          ├─ YES → Just pass the whole document
          │        No retrieval system needed
          │        100% recall guaranteed
          │        No chunking errors
          │
          └─ NO  → Need retrieval
                    │
                    ├─ Structured PDF?  → PageIndex
                    ├─ Relational data? → GraphRAG
                    ├─ Database tables? → SQL retrieval
                    └─ General prose?   → Vector RAG or BM25
```

```python
# Long-context approach — simplest possible RAG
import anthropic, fitz

client = anthropic.Anthropic()

def answer_from_full_document(pdf_path: str, question: str) -> str:
    """
    Pass the entire document to Claude. No retrieval needed.
    Works for documents up to ~150 pages with Claude, ~750 pages with Gemini.
    """
    doc = fitz.open(pdf_path)
    full_text = "\n\n".join(
        f"[Page {i+1}]\n{page.get_text('text', sort=True)}"
        for i, page in enumerate(doc)
    )
    doc.close()

    # Estimate tokens (rough: 4 chars per token)
    estimated_tokens = len(full_text) // 4
    print(f"Document: ~{estimated_tokens:,} tokens")

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system="Answer questions about the provided document. Cite page numbers for specific facts.",
        messages=[{
            "role": "user",
            "content": f"Document:\n{full_text}\n\nQuestion: {question}"
        }],
    )
    return response.content[0].text
```

**Tradeoffs:**

| | Long-Context | PageIndex | Vector RAG |
|---|---|---|---|
| Setup complexity | None | Medium | Medium-High |
| Cost per query | High (full doc) | Medium (index + pages) | Low (chunks only) |
| Accuracy | Near-perfect | Very high | Variable |
| Max document size | ~150-750 pages | Unlimited | Unlimited |
| Table handling | Perfect | Perfect | Poor |
| Latency | High (full doc) | Medium | Low |

---

## NL2SQL — Structured Data Retrieval

When your answers live in a database (not a PDF), convert natural language questions directly to SQL. No embeddings, no vector stores, no chunking.

### When to Use

- Financial data: revenue, expenses, KPIs by quarter/region/product
- Inventory, CRM, ERP data where records are structured
- Any question that reduces to `SELECT ... WHERE ... GROUP BY ...`
- When answers require aggregation (SUM, COUNT, AVG, MAX) — impossible with vector RAG

### LangChain SQLDatabaseChain

```python
from langchain_community.utilities import SQLDatabase
from langchain.chains import create_sql_query_chain
from langchain_anthropic import ChatAnthropic
from langchain_community.tools import QuerySQLDataBaseTool

llm = ChatAnthropic(model="claude-sonnet-4-6")

db = SQLDatabase.from_uri(
    "postgresql://readonly_user:password@localhost/financials",
    include_tables=["revenue", "expenses", "products", "regions"],
    sample_rows_in_table_info=3,
)

write_query = create_sql_query_chain(llm, db)
execute_query = QuerySQLDataBaseTool(db=db)

from langchain_core.runnables import RunnablePassthrough

chain = (
    RunnablePassthrough.assign(query=write_query)
    | RunnablePassthrough.assign(result=lambda x: execute_query.invoke(x["query"]))
)

result = chain.invoke({"question": "What was iPhone revenue in Q3 FY2023 by region?"})
print(result["result"])
```

### Safety Patterns

SQL generated by LLMs can be dangerous. Always:

1. **Read-only user**: connect with a database user that has only `SELECT` privileges
2. **Query inspection**: log all generated queries; alert on `INSERT`, `UPDATE`, `DELETE`, `DROP`
3. **Row limits**: add `LIMIT 1000` to all generated queries via a post-processing wrapper
4. **Schema restriction**: pass only the relevant tables to `include_tables`, not the full schema

```python
def safe_execute(query: str, db: SQLDatabase) -> str:
    query_upper = query.upper().strip()
    if any(kw in query_upper for kw in ["INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "TRUNCATE"]):
        return "Query rejected: only SELECT statements are allowed."
    if "LIMIT" not in query_upper:
        query = query.rstrip(";") + " LIMIT 1000;"
    return db.run(query)
```

### Hybrid NL2SQL + Vector RAG

Real-world systems often need both structured and unstructured retrieval:

```
User query
    │
    ▼
Query classifier (LLM)
    │
    ├── "What was Q3 revenue?" → NL2SQL → database result
    │
    ├── "What did the CEO say about growth?" → Vector RAG → document chunks
    │
    └── "Compare Q3 revenue with CEO's guidance" → Both pipelines → LLM synthesizes
```

```python
def hybrid_retrieval(question: str) -> str:
    classifier_response = llm.invoke(
        f"""Classify this question: '{question}'
Output JSON: {{"type": "sql", "text", or "both"}}
- sql: needs exact numbers from database
- text: needs document/report content
- both: needs both"""
    )
    query_type = json.loads(classifier_response.content)["type"]

    if query_type in ("sql", "both"):
        sql_result = sql_chain.invoke({"question": question})
    if query_type in ("text", "both"):
        text_result = rag_chain.invoke(question)

    if query_type == "both":
        return synthesize(question, sql_result, text_result)
    return sql_result if query_type == "sql" else text_result
```

---

## Choosing Your Approach — Decision Guide

```
  START HERE: What kind of document/data do you have?
                        │
          ┌─────────────┼──────────────┐
          │             │              │
          ▼             ▼              ▼
    Structured     Relational      Tabular
    PDFs/docs      entity data     database
    (10-K, legal,  (knowledge      (SQL)
    contracts)     graphs)
          │             │              │
          ▼             ▼              ▼
    Does it fit    Use GraphRAG   Use Text-to-SQL
    in context?    (graph-rag →)  (see below)
          │
     YES  │  NO
          │   │
          ▼   ▼
     Long-   PageIndex
    context

                        │
          ┌─────────────┴──────────────┐
          │             │              │
          ▼             ▼              ▼
     Exact match   Semantic        Both?
     matters?      similarity?
     (CVEs, IDs,   (concepts,
      names)        meanings)
          │             │              │
          ▼             ▼              ▼
        BM25       Vector RAG     Hybrid +
      retrieval                  Contextual
                                 Retrieval
```

**Full comparison table:**

| Approach | Best document type | Best query type | Accuracy | Cost | Latency |
|---|---|---|---|---|---|
| Long-context LLM | Any, ≤750 pages | Any | Highest | High | High |
| **PageIndex** | Structured PDFs | Precise, multi-hop | Very high | Medium | Medium |
| GraphRAG | Entity-relationship | Global themes, relationships | High | Medium | Medium |
| SQL retrieval | Databases, tables | Aggregations, filters | High | Very low | Very low |
| BM25 | Any text | Exact terms, codes | Medium | Very low | Very low |
| Contextual Retrieval | Any text chunks | Semantic + exact | High | Low-Med | Low |
| Vector RAG | Unstructured prose | Semantic, fuzzy | Medium | Low | Low |

---

## PageIndex Limitations

PageIndex is not a universal solution. Know when it won't work:

```
  PAGEINDEX LIMITATIONS
  ──────────────────────────────────────────────────────────────

  ✗ Unstructured prose corpuses (Wikipedia, news articles)
    → Pages don't have meaningful boundaries; no structure to exploit
    → Use vector RAG or BM25 instead

  ✗ Very large corpora (10,000+ documents)
    → Building per-page summaries costs ~$50 per 1000-page corpus
    → Navigation index becomes too large for a single prompt
    → Use hybrid: cluster by document first, then PageIndex within

  ✗ Real-time or frequently updated documents
    → Must rebuild summaries when documents change
    → Use BM25 or vector RAG with incremental indexing

  ✗ Image-heavy documents (diagrams, scanned PDFs)
    → PyMuPDF extracts text only; images become blank
    → Use vision LLMs (Claude vision) to describe images before indexing

  ✗ Low-latency requirements (<500ms)
    → LLM navigation adds 1-3s latency per query
    → Use BM25 or vector search for sub-second needs
```

---

## Caching the PageIndex

The page summaries and index are expensive to generate but stable — cache them.

```python
import json, hashlib, os
from pathlib import Path

CACHE_DIR = Path(".pageindex_cache")
CACHE_DIR.mkdir(exist_ok=True)

def get_cache_key(pdf_path: str) -> str:
    """Hash the PDF file content for cache invalidation."""
    with open(pdf_path, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()[:16]

def save_index(pdf_path: str, pages: list[Page], index_text: str):
    key = get_cache_key(pdf_path)
    cache_file = CACHE_DIR / f"{key}.json"
    data = {
        "index_text": index_text,
        "pages": [
            {
                "page_num": p.page_num,
                "text": p.text,
                "tables": p.tables,
                "summary": p.summary,
            }
            for p in pages
        ],
    }
    cache_file.write_text(json.dumps(data))
    print(f"Index cached to {cache_file}")

def load_index(pdf_path: str) -> tuple[list[Page], str] | None:
    key = get_cache_key(pdf_path)
    cache_file = CACHE_DIR / f"{key}.json"
    if not cache_file.exists():
        return None

    data = json.loads(cache_file.read_text())
    pages = [Page(**p) for p in data["pages"]]
    return pages, data["index_text"]
```

---

## Async Parallel Summarization

Building the page index serially is slow for large documents (~0.5s per page → 50s for a 100-page doc). Parallelize with `asyncio`:

```python
"""
async_pageindex.py — 10x faster index building with async I/O
"""
import asyncio
import anthropic
import fitz
from dataclasses import dataclass, field
from typing import Optional

client = anthropic.AsyncAnthropic()   # note: AsyncAnthropic, not Anthropic

@dataclass
class Page:
    page_num: int
    text: str
    tables: list[list]
    char_count: int
    summary: Optional[str] = None

async def summarize_page_async(
    page: Page,
    semaphore: asyncio.Semaphore,
    document_type: str = "financial filing",
) -> str:
    """Summarize a single page with concurrency control."""
    async with semaphore:
        content_parts = [f"[Page {page.page_num}]\n{page.text[:4000]}"]
        for i, table in enumerate(page.tables[:3]):
            if table:
                header = " | ".join(str(c) for c in table[0])
                rows = "\n".join(
                    " | ".join(str(c or "") for c in row)
                    for row in table[1:4]
                )
                content_parts.append(f"\n[Table {i+1}]\n{header}\n{rows}")
        content = "\n".join(content_parts)

        response = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=300,
            system=f"""You are building a navigation index for a {document_type}.
Write a 2-4 sentence summary capturing: section/topic, specific numbers, tables present.
Output ONLY the summary sentences.""",
            messages=[{"role": "user", "content": content}],
        )
        return response.content[0].text.strip()


async def build_index_async(
    pages: list[Page],
    document_type: str = "financial filing",
    max_concurrent: int = 10,   # respect API rate limits
) -> list[Page]:
    """
    Build summaries for all pages in parallel.
    max_concurrent=10 keeps ~10 API calls in flight at once.
    For claude-haiku: 10 concurrent × 300 tokens = 3000 tok/s throughput.
    """
    semaphore = asyncio.Semaphore(max_concurrent)
    tasks = [
        summarize_page_async(page, semaphore, document_type)
        for page in pages
    ]
    summaries = await asyncio.gather(*tasks)
    for page, summary in zip(pages, summaries):
        page.summary = summary
    return pages


def build_index_from_pdf(pdf_path: str, document_type: str = "financial filing") -> tuple[list[Page], str]:
    """Synchronous entry point — runs async pipeline internally."""
    doc = fitz.open(pdf_path)
    pages = []
    for i, pdf_page in enumerate(doc):
        text = pdf_page.get_text("text", sort=True)
        tables = [t.extract() for t in pdf_page.find_tables()]
        pages.append(Page(
            page_num=i + 1, text=text, tables=tables, char_count=len(text)
        ))
    doc.close()

    # Run async summarization
    pages = asyncio.run(build_index_async(pages, document_type))

    # Assemble index
    lines = [f"# Document Page Index\nTotal pages: {len(pages)}\n"]
    for page in pages:
        lines.append(f"## Page {page.page_num}")
        lines.append(page.summary or "")
        if page.tables:
            lines.append(f"*{len(page.tables)} table(s)*")
        lines.append("")
    index_text = "\n".join(lines)

    return pages, index_text


# Timing comparison (100-page document):
# Serial:  ~50s  (0.5s per page, sequential)
# Async:   ~6s   (10 concurrent, I/O-bound)
```

---

## Anthropic Prompt Caching for PageIndex

The page navigation step (Phase 4) sends the full index to Claude on every query. For a 100-page document, this index is ~15,000 tokens — repeated per query. With [Anthropic prompt caching](../contextual-retrieval), you pay 10% of the input price for cached tokens after the first query.

```python
"""
pageindex_cached.py — Use prompt caching for the navigation step.
Cache the document index across queries → 89% cost reduction on navigation.
"""
import anthropic, json

client = anthropic.Anthropic()

def navigate_index_cached(
    question: str,
    index_text: str,
    max_pages: int = 6,
) -> dict:
    """
    Navigate the page index with prompt caching.
    
    First call: index_text is processed normally (cache miss).
    Subsequent calls: index_text served from cache at 10% of input price.
    
    For a 15,000-token index at $3/MTok:
      Without caching: 15,000 × $3/1M = $0.045 per query
      With caching (after first): 15,000 × $0.30/1M = $0.0045 per query
      Savings: 90% per navigation call
    """
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system=[
            {
                "type": "text",
                "text": f"""You are navigating a document index to find pages relevant to a user query.

Return JSON only: {{"pages": [list of ints], "reasoning": "why these pages"}}
Select at most {max_pages} pages. Choose the most specific pages that directly answer the query.""",
            },
            {
                "type": "text",
                "text": index_text,
                "cache_control": {"type": "ephemeral"},  # cache the index
            },
        ],
        messages=[
            {"role": "user", "content": f"Query: {question}"}
        ],
    )

    # Log cache performance
    usage = response.usage
    cache_read = getattr(usage, "cache_read_input_tokens", 0)
    cache_created = getattr(usage, "cache_creation_input_tokens", 0)
    if cache_read > 0:
        print(f"Cache HIT: {cache_read:,} tokens served from cache (~90% cheaper)")
    elif cache_created > 0:
        print(f"Cache MISS: {cache_created:,} tokens cached for future queries")

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()
    return json.loads(raw)


class CachedPageIndexQA:
    """
    Multi-query session over a document with prompt caching.
    
    The document index is cached after the first query.
    Questions 2+ use the cache and cost ~10x less for navigation.
    """

    def __init__(self, pages: list, index_text: str):
        self.pages = pages
        self.index_text = index_text
        self.page_map = {p.page_num: p for p in pages}
        self.query_count = 0

    def ask(self, question: str) -> dict:
        self.query_count += 1

        # Phase 4: Navigate (cached after first call)
        nav = navigate_index_cached(question, self.index_text)
        selected = nav.get("pages", [])

        # Phase 5: Read selected pages
        parts = []
        for num in selected:
            page = self.page_map.get(num)
            if page:
                table_text = ""
                for i, table in enumerate(page.tables):
                    if table:
                        rows = "\n".join(
                            " | ".join(str(c or "") for c in row) for row in table
                        )
                        table_text += f"\n[Table {i+1}]\n{rows}"
                parts.append(f"=== PAGE {num} ===\n{page.text}{table_text}")

        page_content = "\n\n".join(parts)

        # Phase 6: Synthesize
        synthesis = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system="Answer precisely from the document pages. Cite page numbers.",
            messages=[{
                "role": "user",
                "content": f"Question: {question}\n\n{page_content}"
            }],
        )

        return {
            "answer": synthesis.content[0].text,
            "pages": selected,
            "reasoning": nav.get("reasoning", ""),
        }


# Usage: ask multiple questions about the same document
# qa = CachedPageIndexQA(pages, index_text)
# result1 = qa.ask("What was iPhone revenue in Q3?")   # cache miss on navigation
# result2 = qa.ask("What was Mac revenue in Q3?")      # cache hit → 90% cheaper navigation
# result3 = qa.ask("What were total operating expenses?")  # cache hit
```

**Cost breakdown for 100 queries over a 100-page doc:**

```
  Navigation cost (15,000-token index):
  ─────────────────────────────────────────────────────────
  Without caching:  100 × 15,000 × $3/1M    = $4.50
  With caching:     1 × 15,000 × $3/1M      = $0.045  (first query, cache write)
                  + 99 × 15,000 × $0.30/1M  = $0.445  (queries 2-100, cache read)
  Total with cache: $0.49   vs.  $4.50 without  →  89% savings
```

---

## Hierarchical PageIndex — Scaling to Large Documents

For documents with 500+ pages, the navigation index itself becomes too large for a single context window. Use a two-level hierarchy:

```
  HIERARCHICAL PAGEINDEX
  ─────────────────────────────────────────────────────────────────
  
  Level 0: Raw pages (500 pages total)
  
  Level 1: Section summaries (groups of 25 pages → 20 section nodes)
  ┌─────────┐ ┌─────────┐ ┌─────────┐       ┌─────────┐
  │Section 1│ │Section 2│ │Section 3│  ...  │Section20│
  │Pages1-25│ │Pg 26-50 │ │Pg 51-75 │       │Pg476-500│
  │~500 tok │ │~500 tok │ │~500 tok │       │~500 tok │
  └────┬────┘ └────┬────┘ └────┬────┘       └────┬────┘
       │           │           │                  │
  Level 2: Document index (20 section summaries → single index ~2,500 tokens)
       └───────────┴───────────┴──────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   TOP-LEVEL INDEX   │
                    │  20 section entries │
                    │  ~2,500 tokens      │
                    └──────────┬──────────┘
                               │
                         QUERY TIME
                               │
                    Phase A: LLM reads top-level index
                             → selects Section 3
                               │
                    Phase B: LLM reads Section 3 page index
                             → selects Pages 52, 67
                               │
                    Phase C: Read Pages 52 and 67 in full
                               │
                    Phase D: Synthesize answer
```

```python
"""
hierarchical_pageindex.py — Two-level PageIndex for 500+ page documents
"""
import asyncio
import anthropic
import fitz
from dataclasses import dataclass, field
from typing import Optional

client = anthropic.Anthropic()
async_client = anthropic.AsyncAnthropic()


@dataclass
class Section:
    section_id: int
    start_page: int
    end_page: int
    pages: list           # list of Page objects
    section_summary: Optional[str] = None
    page_index_text: str = ""   # index of pages within this section


def group_pages_into_sections(pages: list, section_size: int = 25) -> list[Section]:
    """Group consecutive pages into sections of section_size pages."""
    sections = []
    for i in range(0, len(pages), section_size):
        section_pages = pages[i : i + section_size]
        sections.append(Section(
            section_id=i // section_size + 1,
            start_page=section_pages[0].page_num,
            end_page=section_pages[-1].page_num,
            pages=section_pages,
        ))
    return sections


def build_section_page_index(section: Section) -> str:
    """Build the page-level index for one section."""
    lines = [f"# Section {section.section_id} (Pages {section.start_page}–{section.end_page})\n"]
    for page in section.pages:
        lines.append(f"## Page {page.page_num}")
        lines.append(page.summary or "")
        if page.tables:
            lines.append(f"*{len(page.tables)} table(s)*")
        lines.append("")
    return "\n".join(lines)


def summarize_section(section: Section) -> str:
    """Generate a high-level summary of an entire section from its page summaries."""
    page_summaries = "\n".join(
        f"Page {p.page_num}: {p.summary}" for p in section.pages if p.summary
    )
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": f"""Summarize what pages {section.start_page}–{section.end_page} cover as a group.
Write 2-3 sentences. Include major topics, key figures, and section names.

Page summaries:
{page_summaries}"""
        }],
    )
    return response.content[0].text.strip()


def build_top_level_index(sections: list[Section]) -> str:
    """Build the top-level document index from section summaries."""
    lines = ["# Document Top-Level Index\n",
             f"Total sections: {len(sections)}\n"]
    for s in sections:
        lines.append(f"## Section {s.section_id} (Pages {s.start_page}–{s.end_page})")
        lines.append(s.section_summary or "")
        lines.append("")
    return "\n".join(lines)


def navigate_section(question: str, top_level_index: str) -> list[int]:
    """Phase A: identify which section(s) contain the answer."""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        system="""Navigate the document section index to find which section(s) to drill into.
Return JSON: {"sections": [list of section IDs], "reasoning": "..."}
Select at most 3 sections.""",
        messages=[{"role": "user", "content": f"Query: {question}\n\n{top_level_index}"}],
    )
    import json
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()
    result = json.loads(raw)
    return result.get("sections", [])


def navigate_pages_in_section(question: str, section: Section) -> list[int]:
    """Phase B: within a section, identify the exact pages."""
    import json
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        system="""Select the most relevant pages from the section index to answer the query.
Return JSON: {"pages": [list of page numbers], "reasoning": "..."}
Select at most 5 pages.""",
        messages=[{"role": "user", "content": f"Query: {question}\n\n{section.page_index_text}"}],
    )
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()
    return json.loads(raw).get("pages", [])


def hierarchical_query(
    question: str,
    sections: list[Section],
    top_level_index: str,
    all_pages: list,
) -> dict:
    """Full hierarchical PageIndex query: 2-level navigation → page read → synthesis."""

    # Phase A: identify sections
    target_section_ids = navigate_section(question, top_level_index)

    # Phase B: within each section, identify pages
    all_selected_pages = []
    section_map = {s.section_id: s for s in sections}
    for sid in target_section_ids:
        section = section_map.get(sid)
        if section:
            page_nums = navigate_pages_in_section(question, section)
            all_selected_pages.extend(page_nums)

    # Phase C: read selected pages
    page_map = {p.page_num: p for p in all_pages}
    parts = []
    for num in all_selected_pages[:8]:  # cap at 8 pages
        page = page_map.get(num)
        if page:
            table_text = ""
            for i, t in enumerate(page.tables):
                if t:
                    rows = "\n".join(" | ".join(str(c or "") for c in row) for row in t)
                    table_text += f"\n[Table {i+1}]\n{rows}"
            parts.append(f"=== PAGE {num} ===\n{page.text}{table_text}")

    # Phase D: synthesis
    synthesis = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system="Answer precisely from the pages. Cite page numbers for all facts.",
        messages=[{
            "role": "user",
            "content": f"Question: {question}\n\n" + "\n\n".join(parts)
        }],
    )

    return {
        "answer": synthesis.content[0].text,
        "sections_consulted": target_section_ids,
        "pages_consulted": all_selected_pages,
    }
```

---

## Multi-Document PageIndex — Corpus Navigation

When you have a corpus of documents (e.g., 5 years of 10-K filings), add a corpus-level index above the document level:

```
  MULTI-DOCUMENT PAGEINDEX HIERARCHY
  ─────────────────────────────────────────────────────────────────────
  
  Level 0: Corpus index (one entry per document)
  ┌──────────────────────────────────────────────────────────┐
  │ # Financial Filings Corpus                               │
  │ ## Apple 10-K FY2023 (112 pages)                         │
  │    Annual report. Revenue $383B. iPhone 52% of sales.   │
  │ ## Apple 10-K FY2022 (108 pages)                         │
  │    Annual report. Revenue $394B. Record Mac sales.       │
  │ ## Apple 10-Q Q1 FY2024 (47 pages)                      │
  │    Quarterly. Revenue $119.6B. Services record $23.1B.   │
  │ ...                                                       │
  └──────────────────────────────────────────────────────────┘
                            │
                     Query routing
                            │
              ┌─────────────┼─────────────┐
              │             │             │
       Document 1     Document 2    Document 3
       PageIndex       PageIndex    PageIndex
              │             │             │
         Pages 1-112   Pages 1-108  Pages 1-47
```

```python
"""
corpus_pageindex.py — Navigate across multiple documents
"""
from dataclasses import dataclass, field
import anthropic, json
from pathlib import Path

client = anthropic.Anthropic()


@dataclass
class DocumentIndex:
    doc_id: str
    title: str
    path: str
    corpus_summary: str     # 2-3 sentence summary for corpus-level index
    page_count: int
    index_text: str         # full page-level index
    pages: list


@dataclass
class CorpusIndex:
    documents: list[DocumentIndex] = field(default_factory=list)
    corpus_index_text: str = ""


def build_corpus_index(doc_indexes: list[DocumentIndex]) -> str:
    """Build the top-level corpus index from per-document summaries."""
    lines = [f"# Document Corpus Index\nTotal documents: {len(doc_indexes)}\n"]
    for doc in doc_indexes:
        lines.append(f"## {doc.doc_id}: {doc.title} ({doc.page_count} pages)")
        lines.append(doc.corpus_summary)
        lines.append("")
    return "\n".join(lines)


def route_query_to_documents(
    question: str,
    corpus_index: str,
    max_docs: int = 3,
) -> list[str]:
    """Select which documents to search for the answer."""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        system=f"""Select which document(s) to search to answer the query.
Return JSON: {{"doc_ids": ["id1", "id2"], "reasoning": "..."}}
Select at most {max_docs} documents.""",
        messages=[{"role": "user", "content": f"Query: {question}\n\n{corpus_index}"}],
    )
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()
    return json.loads(raw).get("doc_ids", [])


def corpus_query(question: str, corpus: CorpusIndex) -> dict:
    """Query across the corpus: route → navigate each doc → synthesize."""
    # Step 1: route to relevant documents
    target_doc_ids = route_query_to_documents(question, corpus.corpus_index_text)

    doc_map = {d.doc_id: d for d in corpus.documents}
    all_results = []

    # Step 2: within each selected document, run PageIndex navigation
    for doc_id in target_doc_ids:
        doc = doc_map.get(doc_id)
        if not doc:
            continue

        # Navigate within document
        nav_resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=256,
            system="""Select pages to read. Return JSON: {"pages": [list of ints], "reasoning": "..."}""",
            messages=[{"role": "user", "content": f"Query: {question}\n\n{doc.index_text}"}],
        )
        nav_raw = nav_resp.content[0].text.strip()
        if nav_raw.startswith("```"):
            nav_raw = nav_raw.split("```")[1].lstrip("json").strip()
        nav = json.loads(nav_raw)

        page_map = {p.page_num: p for p in doc.pages}
        for num in nav.get("pages", [])[:4]:
            page = page_map.get(num)
            if page:
                all_results.append({
                    "doc_id": doc_id,
                    "doc_title": doc.title,
                    "page_num": num,
                    "content": page.text,
                })

    # Step 3: synthesize across all retrieved pages
    context = "\n\n".join(
        f"[{r['doc_title']}, Page {r['page_num']}]\n{r['content'][:3000]}"
        for r in all_results
    )

    synthesis = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system="Answer using evidence from the provided documents. Always cite document name and page.",
        messages=[{"role": "user", "content": f"Question: {question}\n\n{context}"}],
    )

    return {
        "answer": synthesis.content[0].text,
        "documents_searched": target_doc_ids,
        "pages_consulted": [(r["doc_title"], r["page_num"]) for r in all_results],
    }
```

---

## FRAMES Benchmark — Multi-Step Reasoning

**FRAMES** (Factuality, Retrieval, And Multi-Step Reasoning Evaluation, Google DeepMind, 2024) tests whether RAG systems can answer questions that require chaining facts across multiple sources — not just single-hop lookup.

```
  FRAMES BENCHMARK STRUCTURE
  ─────────────────────────────────────────────────────────────────
  
  Single-hop (baseline):
  Q: "Where was the author of 'The Great Gatsby' born?"
  A: Retrieve Wikipedia page for F. Scott Fitzgerald → "St. Paul, Minnesota"
  
  Multi-hop (FRAMES hard cases):
  Q: "Who was the US president when the author of the book that
      influenced Tolkien most was born, and what is that president's
      middle name?"
  
  Requires:
  Step 1: Identify book most influencing Tolkien → William Morris's works
  Step 2: Find Morris's birth year → 1834
  Step 3: Find US president in 1834 → Andrew Jackson
  Step 4: Find Jackson's middle name → none (no middle name)
  
  Naive vector RAG: fails (can't chain 4 retrieval steps)
  PageIndex w/ reasoning: succeeds (LLM plans the steps)
  
  ─────────────────────────────────────────────────────────────────
  FRAMES Accuracy (May 2026)
  
  RAG baseline (BM25 + GPT-4)          ████░░░░░░░░  40.2%
  Vector RAG (top-k=5, GPT-4)          █████░░░░░░░  45.1%
  Iterative RAG (5 hops, GPT-4)        ███████░░░░░  62.4%
  Long-context (Gemini 2.0 Flash 1M)   ████████░░░░  72.9%
  Agentic RAG (ReAct, GPT-4)           █████████░░░  78.3%
  PageIndex + Multi-step decomp.       ██████████░░  84.6%
  ─────────────────────────────────────────────────────────────────
  
  Note: FRAMES uses Wikipedia as corpus (English, ~6.7M articles).
  PageIndex applies per-article; multi-step is handled by an
  outer planning loop that decomposes the question.
```

### Multi-Step PageIndex with Question Decomposition

```python
"""
multistep_pageindex.py — Decompose complex questions into retrieval sub-steps
"""
import anthropic, json

client = anthropic.Anthropic()


def decompose_question(question: str) -> list[str]:
    """Break a complex multi-hop question into sequential sub-questions."""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system="""Decompose this complex question into a sequence of simpler sub-questions.
Each sub-question should be answerable with a single lookup.
Return JSON: {"sub_questions": ["q1", "q2", "q3"], "reasoning": "..."}
Order them so each question can build on the answer to the previous one.""",
        messages=[{"role": "user", "content": question}],
    )
    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1].lstrip("json").strip()
    return json.loads(raw).get("sub_questions", [question])


def multistep_pageindex_query(
    question: str,
    retrieve_fn,    # callable: (query: str) -> str (returns page content)
    max_steps: int = 5,
) -> dict:
    """
    Solve a multi-hop question by decomposing it and chaining retrievals.
    
    retrieve_fn: your PageIndex retriever — takes a query, returns page text.
    """
    sub_questions = decompose_question(question)
    context_chain = []

    for i, sub_q in enumerate(sub_questions[:max_steps]):
        # Enrich sub-question with answers accumulated so far
        if context_chain:
            enriched_q = f"{sub_q}\n\nContext from previous steps:\n" + "\n".join(
                f"Step {j+1}: {c['answer']}" for j, c in enumerate(context_chain)
            )
        else:
            enriched_q = sub_q

        # Retrieve
        retrieved_text = retrieve_fn(enriched_q)

        # Extract answer to this sub-question
        answer_resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=256,
            system="Answer the question concisely from the retrieved text. One sentence max.",
            messages=[{"role": "user", "content": f"Question: {enriched_q}\n\nText:\n{retrieved_text}"}],
        )
        sub_answer = answer_resp.content[0].text.strip()
        context_chain.append({"question": sub_q, "answer": sub_answer})

    # Final synthesis
    all_context = "\n".join(
        f"Q{i+1}: {c['question']}\nA{i+1}: {c['answer']}"
        for i, c in enumerate(context_chain)
    )
    final_resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        system="Use the step-by-step reasoning chain to answer the original complex question.",
        messages=[{
            "role": "user",
            "content": f"Original question: {question}\n\nReasoning chain:\n{all_context}"
        }],
    )

    return {
        "answer": final_resp.content[0].text,
        "steps": context_chain,
        "sub_questions": sub_questions,
    }
```

---

## Production Monitoring for PageIndex

Track the four key metrics in production: latency, accuracy, cost, and page selection quality.

```python
"""
pageindex_monitoring.py — Observability for production PageIndex systems
"""
import time
import anthropic
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class QueryTrace:
    query_id: str
    question: str
    pages_selected: list[int]
    pages_total: int
    nav_latency_ms: float
    read_latency_ms: float
    synth_latency_ms: float
    total_latency_ms: float
    nav_input_tokens: int
    synth_input_tokens: int
    nav_output_tokens: int
    synth_output_tokens: int
    cache_hit_tokens: int
    cache_miss_tokens: int
    estimated_cost_usd: float
    answer_length: int
    pages_selected_pct: float   # pages_selected / pages_total — lower is better


class MonitoredPageIndexQA:
    """PageIndex QA system with full observability."""

    HAIKU_INPUT_PRICE  = 0.80 / 1_000_000   # $0.80/MTok
    SONNET_INPUT_PRICE = 3.00 / 1_000_000   # $3.00/MTok
    SONNET_OUTPUT_PRICE = 15.00 / 1_000_000
    CACHE_READ_PRICE = SONNET_INPUT_PRICE * 0.10   # 10% of input

    def __init__(self, pages: list, index_text: str):
        self.pages = pages
        self.index_text = index_text
        self.page_map = {p.page_num: p for p in pages}
        self.traces: list[QueryTrace] = []
        self.client = anthropic.Anthropic()

    def ask(self, question: str, query_id: Optional[str] = None) -> dict:
        import uuid, json
        qid = query_id or str(uuid.uuid4())[:8]
        t_start = time.perf_counter()

        # Phase 4: Navigate (with caching)
        t_nav_start = time.perf_counter()
        nav_resp = self.client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            system=[
                {"type": "text", "text": "Return JSON: {\"pages\": [ints], \"reasoning\": \"...\"}"},
                {"type": "text", "text": self.index_text, "cache_control": {"type": "ephemeral"}},
            ],
            messages=[{"role": "user", "content": f"Query: {question}"}],
        )
        nav_latency = (time.perf_counter() - t_nav_start) * 1000

        # Parse navigation
        raw = nav_resp.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1].lstrip("json").strip()
        nav = json.loads(raw)
        selected = nav.get("pages", [])

        # Phase 5: Read pages
        t_read_start = time.perf_counter()
        parts = []
        for num in selected[:6]:
            page = self.page_map.get(num)
            if page:
                table_text = ""
                for i, t in enumerate(page.tables):
                    if t:
                        rows = "\n".join(" | ".join(str(c or "") for c in row) for row in t)
                        table_text += f"\n[Table {i+1}]\n{rows}"
                parts.append(f"=== PAGE {num} ===\n{page.text[:4000]}{table_text}")
        read_latency = (time.perf_counter() - t_read_start) * 1000

        # Phase 6: Synthesis
        t_synth_start = time.perf_counter()
        synth_resp = self.client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system="Answer from the pages. Cite page numbers.",
            messages=[{"role": "user", "content": f"Q: {question}\n\n" + "\n\n".join(parts)}],
        )
        synth_latency = (time.perf_counter() - t_synth_start) * 1000
        total_latency = (time.perf_counter() - t_start) * 1000

        # Calculate cost
        nav_usage = nav_resp.usage
        synth_usage = synth_resp.usage
        cache_read = getattr(nav_usage, "cache_read_input_tokens", 0)
        cache_created = getattr(nav_usage, "cache_creation_input_tokens", 0)
        nav_normal_input = nav_usage.input_tokens - cache_read - cache_created

        cost = (
            nav_normal_input * self.SONNET_INPUT_PRICE
            + cache_created * self.SONNET_INPUT_PRICE
            + cache_read * self.CACHE_READ_PRICE
            + nav_usage.output_tokens * self.SONNET_OUTPUT_PRICE
            + synth_usage.input_tokens * self.SONNET_INPUT_PRICE
            + synth_usage.output_tokens * self.SONNET_OUTPUT_PRICE
        )

        # Record trace
        trace = QueryTrace(
            query_id=qid,
            question=question[:100],
            pages_selected=selected,
            pages_total=len(self.pages),
            nav_latency_ms=round(nav_latency, 1),
            read_latency_ms=round(read_latency, 1),
            synth_latency_ms=round(synth_latency, 1),
            total_latency_ms=round(total_latency, 1),
            nav_input_tokens=nav_usage.input_tokens,
            synth_input_tokens=synth_usage.input_tokens,
            nav_output_tokens=nav_usage.output_tokens,
            synth_output_tokens=synth_usage.output_tokens,
            cache_hit_tokens=cache_read,
            cache_miss_tokens=cache_created,
            estimated_cost_usd=round(cost, 6),
            answer_length=len(synth_resp.content[0].text),
            pages_selected_pct=round(len(selected) / len(self.pages) * 100, 1),
        )
        self.traces.append(trace)

        return {
            "answer": synth_resp.content[0].text,
            "pages": selected,
            "trace": trace,
        }

    def report(self) -> dict:
        """Aggregate metrics across all queries in this session."""
        if not self.traces:
            return {}
        total_q = len(self.traces)
        return {
            "total_queries": total_q,
            "avg_latency_ms": round(sum(t.total_latency_ms for t in self.traces) / total_q, 1),
            "p95_latency_ms": sorted(t.total_latency_ms for t in self.traces)[int(total_q * 0.95)],
            "avg_pages_selected_pct": round(sum(t.pages_selected_pct for t in self.traces) / total_q, 1),
            "total_cost_usd": round(sum(t.estimated_cost_usd for t in self.traces), 4),
            "avg_cost_per_query_usd": round(sum(t.estimated_cost_usd for t in self.traces) / total_q, 6),
            "cache_hit_tokens_total": sum(t.cache_hit_tokens for t in self.traces),
        }
```

**Key SLO targets for production PageIndex:**

```
  PAGEINDEX PRODUCTION SLOs
  ─────────────────────────────────────────────────────────────────
  
  Metric                    Target     Alert threshold
  ─────────────────────────────────────────────────────────────────
  Total query latency       < 5s       > 8s (p95)
  Navigation latency        < 2s       > 3s
  Pages selected %          < 10%      > 25% (too broad — index poor)
  Cost per query            < $0.02    > $0.05
  Cache hit rate (nav)      > 80%      < 60% (cache churn)
  Answer length             > 50 chars < 20 chars (likely failure)
  ─────────────────────────────────────────────────────────────────
```

---

## PageIndex Evaluation — Measuring Navigation Accuracy

Before deploying to production, measure how accurately the navigation step selects the right pages:

```python
"""
pageindex_eval.py — Measure navigation accuracy and answer quality
"""
import anthropic

client = anthropic.Anthropic()


def evaluate_navigation_accuracy(
    test_cases: list[dict],  # [{"question": ..., "ground_truth_pages": [14, 47]}]
    navigate_fn,             # callable: (question) -> {"pages": [...]}
) -> dict:
    """
    Measure page retrieval precision and recall.
    
    precision = fraction of selected pages that were relevant
    recall    = fraction of relevant pages that were selected
    """
    total_precision = 0.0
    total_recall = 0.0
    hits_at_1 = 0    # was the top page correct?

    for case in test_cases:
        nav = navigate_fn(case["question"])
        selected = set(nav.get("pages", []))
        ground_truth = set(case["ground_truth_pages"])

        tp = len(selected & ground_truth)
        precision = tp / len(selected) if selected else 0.0
        recall = tp / len(ground_truth) if ground_truth else 0.0

        total_precision += precision
        total_recall += recall

        # Hit@1: first page selected is a ground-truth page
        pages_list = nav.get("pages", [])
        if pages_list and pages_list[0] in ground_truth:
            hits_at_1 += 1

    n = len(test_cases)
    avg_precision = total_precision / n
    avg_recall = total_recall / n
    f1 = (2 * avg_precision * avg_recall) / (avg_precision + avg_recall + 1e-9)

    return {
        "precision": round(avg_precision, 3),
        "recall": round(avg_recall, 3),
        "f1": round(f1, 3),
        "hit_at_1": round(hits_at_1 / n, 3),
        "n_cases": n,
    }


def evaluate_answer_quality(
    test_cases: list[dict],  # [{"question": ..., "ground_truth_answer": ...}]
    answer_fn,               # callable: (question) -> str
) -> dict:
    """
    Use Claude as judge to evaluate answer quality.
    Returns correctness scores on a 1-5 scale.
    """
    scores = []

    for case in test_cases:
        answer = answer_fn(case["question"])

        judge_resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=128,
            system="""You are evaluating RAG answer quality.
Score correctness from 1-5:
5 = Completely correct with proper citations
4 = Mostly correct, minor gaps
3 = Partially correct
2 = Mostly wrong but shows some understanding
1 = Completely wrong or hallucinated

Return JSON: {"score": 3, "reason": "..."}""",
            messages=[{
                "role": "user",
                "content": f"""Question: {case['question']}
Ground truth: {case['ground_truth_answer']}
System answer: {answer}"""
            }],
        )
        import json
        raw = judge_resp.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1].lstrip("json").strip()
        result = json.loads(raw)
        scores.append(result.get("score", 1))

    return {
        "avg_score": round(sum(scores) / len(scores), 2),
        "score_distribution": {i: scores.count(i) for i in range(1, 6)},
        "pct_score_4_or_5": round(sum(s >= 4 for s in scores) / len(scores) * 100, 1),
    }
```

---

## See Also

- [Contextual Retrieval](../contextual-retrieval) — Anthropic's Nov 2024 research (updated 2025): add context to chunks, 69% fewer retrieval failures with BM25 hybrid
- [BM25 & Sparse Retrieval](../bm25-sparse-retrieval) — keyword scoring, SPLADE, Elasticsearch, hybrid RRF
- [GraphRAG](../graph-rag) — Microsoft GraphRAG (2024), LightRAG, entity relationship retrieval
- [Retrieval Strategies](../retrieval-strategies) — dense, hybrid, HyDE, MMR, cross-encoder reranking
- [Advanced RAG](../advanced-rag) — RAPTOR, FLARE, CRAG, query decomposition
- [Agentic RAG](../agentic-rag) — multi-step retrieval agents
- [Table RAG](./table-rag) — ChainOfTable, NL2SQL deep dive, DuckDB, Vanna.ai, TAPAS
- [Long-Context LLMs as Retrieval](./long-context-rag) — Needle in a Haystack, Lost in the Middle, cost models
- [Full-Text Search for RAG](./full-text-search-rag) — PostgreSQL FTS, Elasticsearch, Meilisearch, Typesense
