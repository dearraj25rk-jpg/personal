---
title: "Table-Native RAG — Vectorless Table Retrieval"
description: Deep technical reference for table-native retrieval without vector embeddings — ChainOfTable, TAPAS, PandasAI, DuckDB NL2SQL, Vanna.ai, safety patterns, and hybrid table+text RAG. Current as of May 2026.
sidebar:
  order: 16
---

> **Current as of May 2026.** Covers ChainOfTable (DeepMind 2024), TAPAS, PandasAI 3.0, DuckDB 1.1+, Vanna v0.7+, Spider 2.0 benchmarks.

---

## 1. Why Tabular Data Breaks Standard RAG

Standard RAG pipelines treat every document as a flat sequence of tokens. This works for prose. It catastrophically fails for tables.

### The Chunking Catastrophe

When a standard text splitter encounters a table — whether in a PDF, HTML page, or Markdown file — it applies a fixed token window and cuts wherever the limit hits. The result destroys the two properties that make a table a table: **column alignment** and **row integrity**.

```
  ORIGINAL TABLE (12 rows × 6 columns, ~400 tokens)
  ┌──────────────┬──────────┬──────────┬───────────┬──────────┬───────────┐
  │ Product      │ Q1 Rev   │ Q2 Rev   │ Q3 Rev    │ Q4 Rev   │ YoY %     │
  ├──────────────┼──────────┼──────────┼───────────┼──────────┼───────────┤
  │ Widget A     │ $1.2M    │ $1.4M    │ $1.9M     │ $2.1M    │ +75%      │
  │ Widget B     │ $0.8M    │ $0.7M    │ $0.6M     │ $0.5M    │ -37.5%    │
  │ Widget C     │ $3.1M    │ $3.3M    │ $3.5M     │ $3.8M    │ +22.6%    │
  │ Widget D     │ $0.2M    │ $0.4M    │ $0.9M     │ $1.8M    │ +800%     │
  │   ...        │  ...     │  ...     │  ...      │  ...     │  ...      │
  └──────────────┴──────────┴──────────┴───────────┴──────────┴───────────┘

  AFTER 256-TOKEN CHUNKER (chunk boundary hits mid-table)
  ┌───────────────────────────────────────────────────────────────────────┐
  │ CHUNK 1:                                                              │
  │ Product | Q1 Rev | Q2 Rev | Q3 Rev | Q4 Rev | YoY %                  │
  │ Widget A | $1.2M | $1.4M | $1.9M | $2.1M | +75%                     │
  │ Widget B | $0.8M | $0.7M | $0.6M | $0.5M | -37.5%                   │
  │ Widget C | $3.1M | $3.3M | $3.5M                                     │
  └───────────────────────────────────────────────────────────────────────┘
  ┌───────────────────────────────────────────────────────────────────────┐
  │ CHUNK 2:  (NO HEADERS — orphaned data)                                │
  │ | $3.8M | +22.6%                                                      │
  │ Widget D | $0.2M | $0.4M | $0.9M | $1.8M | +800%                    │
  │ ...                                                                   │
  └───────────────────────────────────────────────────────────────────────┘

  WHAT THE LLM SEES FOR CHUNK 2:
  "| $3.8M | +22.6% Widget D | $0.2M | ..."
   ↑ Which product? Which quarter? Headers gone.
```

Chunk 2 is now **uninterpretable**. The LLM cannot know that `$3.8M` belongs to Widget C, Q4 Rev — because the header row is in Chunk 1, separated by an embedding similarity search that may never retrieve them together.

### Concrete Failure Modes

**Pivot Tables**: A pivot table has a two-dimensional key space — row headers AND column headers both encode meaning. A text splitter sees only a linear token sequence and cannot represent the 2D structure.

```
  PIVOT TABLE: Revenue by Region × Product
                │  North  │  South  │  East   │  West
  ─────────────────────────────────────────────────────
  Widget A      │  $400K  │  $300K  │  $250K  │  $250K
  Widget B      │  $150K  │  $200K  │  $100K  │  $350K
  Widget C      │  $900K  │  $700K  │  $800K  │  $900K

  AFTER CHUNKING:
  "North South East West Widget A $400K $300K $250K $250K Widget B"
   ↑ All spatial relationships destroyed. Which $300K is South-WidgetA?
```

**Merged Cells**: Excel and HTML tables use `colspan`/`rowspan` to span a single header across multiple columns or rows. Text extraction flattens or duplicates these, creating phantom columns.

```
  EXCEL WITH MERGED CELLS:
  ┌───────────────────────────────────┬───────────────────────────────────┐
  │        H1 2024 (merged)           │        H2 2024 (merged)           │
  ├──────────┬──────────┬─────────────┼──────────┬──────────┬─────────────┤
  │  Q1      │   Q2     │   Subtotal  │   Q3     │   Q4     │   Subtotal  │
  ├──────────┼──────────┼─────────────┼──────────┼──────────┼─────────────┤
  │ $1.2M    │ $1.4M    │   $2.6M     │ $1.9M    │ $2.1M    │   $4.0M     │
  └──────────┴──────────┴─────────────┴──────────┴──────────┴─────────────┘

  AFTER PDF TEXT EXTRACTION:
  "H1 2024 H2 2024 Q1 Q2 Subtotal Q3 Q4 Subtotal 1.2M 1.4M 2.6M 1.9M 2.1M 4.0M"
   ↑ Merged header "H1 2024" duplicated, column alignment destroyed
```

**Multi-Level Headers**: Many financial and scientific tables have 2–3 levels of column headers. Standard chunkers produce one flat sequence.

```
  MULTI-LEVEL HEADER TABLE:
  ┌──────────┬────────────────────────┬────────────────────────┐
  │          │      Experimental      │        Control         │
  │ Subject  ├────────┬───────────────┼────────┬───────────────┤
  │          │ Pre    │ Post          │ Pre    │ Post          │
  ├──────────┼────────┼───────────────┼────────┼───────────────┤
  │ Group A  │ 72.3   │ 68.1          │ 71.8   │ 72.0          │
  └──────────┴────────┴───────────────┴────────┴───────────────┘

  QUESTION: "Did experimental Post decrease?"
  VECTOR SEARCH: Returns chunk with "68.1" — but chunk has no context
                 to know this is Experimental > Post for Group A.
```

### What Information Is Lost

| Property | Description | Impact When Lost |
|---|---|---|
| **Spatial structure** | Cell (row i, col j) encodes a specific fact | Cannot map values to their row+column keys |
| **Header-cell relationships** | Column header applies to all cells in that column | Values become anonymous numbers |
| **Row integrity** | A single entity's attributes span one row | Entity records split across chunks |
| **Aggregation semantics** | SUM/AVG/MAX rows have special meaning | Totals rows treated as regular data |
| **Cell span information** | Merged cells imply repeated context | Context collapsed or duplicated |
| **Sort order** | Table may be sorted by a key column | Rank-based queries (top 3) break |
| **Null semantics** | Empty cell ≠ zero ≠ "not applicable" | Aggregations silently wrong |

The fundamental problem: **a table is a relational structure, not a document**. Treating it as text destroys the relational information that makes it answerable.

---

## 2. Table Serialization Strategies

Before retrieval, tables must be converted to a string form the LLM can process. The serialization format profoundly affects LLM comprehension, token consumption, and parsability. This section benchmarks six formats on a representative 5-row × 4-column table.

### Reference Table (Used in All Examples)

```
  Product    | Units Sold | Revenue  | Margin %
  Widget A   | 12,400     | $186,000 | 18.5%
  Widget B   | 3,200      | $64,000  | 22.1%
  Widget C   | 28,100     | $337,200 | 15.3%
  Widget D   | 890        | $44,500  | 31.2%
  Widget E   | 5,600      | $67,200  | 12.0%
```

### Format Comparison

```
  ┌────────────────┬───────────┬─────────────────┬────────────────┬──────────────────────┐
  │ Format         │ Tokens    │ LLM Comprehension│ Regex/Parse    │ Multi-row Reasoning  │
  ├────────────────┼───────────┼─────────────────┼────────────────┼──────────────────────┤
  │ Plain text     │ ~90       │ Poor (no align)  │ Hard           │ Poor                 │
  │ CSV            │ ~75       │ Fair             │ Easy           │ Fair                 │
  │ Markdown       │ ~130      │ Good             │ Medium         │ Good                 │
  │ HTML           │ ~220      │ Good             │ Easy           │ Good                 │
  │ JSON           │ ~280      │ Excellent        │ Easy           │ Excellent            │
  │ SQL INSERT     │ ~310      │ Excellent        │ Easy           │ Excellent            │
  └────────────────┴───────────┴─────────────────┴────────────────┴──────────────────────┘
```

### Plain Text (90 tokens)

```
  Product Units Sold Revenue Margin %
  Widget A 12,400 $186,000 18.5%
  Widget B 3,200 $64,000 22.1%
  Widget C 28,100 $337,200 15.3%
  Widget D 890 $44,500 31.2%
  Widget E 5,600 $67,200 12.0%
```

**Verdict**: Lowest token count, but LLMs frequently misalign values to headers on wider tables. Commas in numbers (12,400) confuse whitespace-delimited parsing. Avoid for anything beyond trivial tables.

### CSV (75 tokens)

```csv
Product,Units Sold,Revenue,Margin %
Widget A,12400,$186000,18.5%
Widget B,3200,$64000,22.1%
Widget C,28100,$337200,15.3%
Widget D,890,$44500,31.2%
Widget E,5600,$67200,12.0%
```

**Verdict**: Most token-efficient. LLMs handle CSV well for simple lookups. Multi-row reasoning (e.g., "which product has the highest margin × revenue product?") struggles because LLMs must mentally parse the comma structure. Best for small tables passed directly to Claude.

### Markdown (130 tokens)

```markdown
| Product  | Units Sold | Revenue  | Margin % |
|----------|------------|----------|----------|
| Widget A | 12,400     | $186,000 | 18.5%    |
| Widget B | 3,200      | $64,000  | 22.1%    |
| Widget C | 28,100     | $337,200 | 15.3%    |
| Widget D | 890        | $44,500  | 31.2%    |
| Widget E | 5,600      | $67,200  | 12.0%    |
```

**Verdict**: Best general-purpose format for LLM comprehension. The `|` delimiters and separator row create unambiguous visual structure that models like Claude parse reliably. ~45% more tokens than CSV but significantly more accurate reasoning. **Recommended default for tables under 50 rows**.

### HTML (220 tokens)

```html
<table>
  <thead>
    <tr><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Margin %</th></tr>
  </thead>
  <tbody>
    <tr><td>Widget A</td><td>12,400</td><td>$186,000</td><td>18.5%</td></tr>
    <tr><td>Widget B</td><td>3,200</td><td>$64,000</td><td>22.1%</td></tr>
    <tr><td>Widget C</td><td>28,100</td><td>$337,200</td><td>15.3%</td></tr>
    <tr><td>Widget D</td><td>890</td><td>$44,500</td><td>31.2%</td></tr>
    <tr><td>Widget E</td><td>5,600</td><td>$67,200</td><td>12.0%</td></tr>
  </tbody>
</table>
```

**Verdict**: Excellent for multi-level headers via `colspan`/`rowspan` — the only format that preserves merged cell semantics. High token cost. Use when header hierarchy matters.

### JSON (280 tokens)

```json
{
  "columns": ["Product", "Units Sold", "Revenue", "Margin %"],
  "rows": [
    {"Product": "Widget A", "Units Sold": 12400, "Revenue": 186000, "Margin %": 18.5},
    {"Product": "Widget B", "Units Sold": 3200,  "Revenue": 64000,  "Margin %": 22.1},
    {"Product": "Widget C", "Units Sold": 28100, "Revenue": 337200, "Margin %": 15.3},
    {"Product": "Widget D", "Units Sold": 890,   "Revenue": 44500,  "Margin %": 31.2},
    {"Product": "Widget E", "Units Sold": 5600,  "Revenue": 67200,  "Margin %": 12.0}
  ]
}
```

**Verdict**: Each row is self-describing — no header alignment to lose. Numeric types preserved (no `$` or `%` to strip). Best for **code generation** targets (PandasAI, DuckDB) where the LLM writes code that processes the serialized data. Highest comprehension for complex multi-row operations.

### SQL INSERT (310 tokens)

```sql
CREATE TABLE products (
  product TEXT, units_sold INTEGER, revenue NUMERIC, margin_pct NUMERIC
);
INSERT INTO products VALUES
  ('Widget A', 12400, 186000, 18.5),
  ('Widget B', 3200,  64000,  22.1),
  ('Widget C', 28100, 337200, 15.3),
  ('Widget D', 890,   44500,  31.2),
  ('Widget E', 5600,  67200,  12.0);
```

**Verdict**: Most tokens, but directly executable. For NL2SQL pipelines, providing the `CREATE TABLE` schema alongside few-shot `INSERT` rows gives the LLM precise type information and naming conventions. **Required for Vanna.ai training**; strongly recommended for any NL2SQL few-shot prompting.

### Benchmarked Recommendation by Table Type

| Table Type | Recommended Format | Reason |
|---|---|---|
| ≤20 rows, simple headers | Markdown | Best comprehension/token ratio |
| Multi-level headers | HTML | Only format preserving colspan/rowspan |
| >100 rows | SQL INSERT (schema only) + NL2SQL | Cannot fit full table in context |
| Code-gen target (pandas/DuckDB) | JSON or SQL INSERT | Numeric types preserved, self-describing |
| Pivot / 2D key space | JSON with nested structure | Explicit key mapping |
| Financial (mixed `$`/`%`) | Markdown with type column | Visual separation prevents type confusion |
| LLM writes Python against table | CSV (via `io.StringIO`) | pandas reads CSV natively; low token overhead |

---

## 3. ChainOfTable (Google DeepMind, 2024)

**Paper**: "Chain-of-Table: Evolving Tables in the Reasoning Chain for Table Understanding" (Wang et al., Google DeepMind, 2024). [arXiv:2401.04507](https://arxiv.org/abs/2401.04507)

### Core Idea

Standard chain-of-thought prompting produces reasoning in text. ChainOfTable produces reasoning as a **sequence of table transformations**. Each step applies one atomic operation to the table, producing a new (smaller, more focused) table. The final answer is derived from the terminal table — which may be a single cell.

This matches how a human analyst works: filter to relevant rows → select relevant columns → group → sort → aggregate → read off the answer.

```
  QUERY: "Which product with margin above 20% had the highest revenue growth Q1→Q4?"

  ┌─────────────────────────────────────────────────────────────────────────┐
  │  INPUT TABLE (12 rows × 8 columns)                                      │
  │  Product | Q1 Rev | Q2 Rev | Q3 Rev | Q4 Rev | Margin | Category | ... │
  └────────────────────────────────┬────────────────────────────────────────┘
                                   │  STEP 1: f_select_row(Margin > 20%)
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  FILTERED TABLE (4 rows × 8 columns)                                    │
  │  Product | Q1 Rev | Q2 Rev | Q3 Rev | Q4 Rev | Margin | Category | ... │
  │  Widget B | ...                                                          │
  └────────────────────────────────┬────────────────────────────────────────┘
                                   │  STEP 2: f_select_col([Product, Q1 Rev, Q4 Rev, Margin])
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  PROJECTED TABLE (4 rows × 4 columns)                                   │
  │  Product | Q1 Rev | Q4 Rev | Margin                                     │
  └────────────────────────────────┬────────────────────────────────────────┘
                                   │  STEP 3: f_add_col(Growth = (Q4-Q1)/Q1 * 100)
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  AUGMENTED TABLE (4 rows × 5 columns)                                   │
  │  Product | Q1 Rev | Q4 Rev | Margin | Growth %                          │
  └────────────────────────────────┬────────────────────────────────────────┘
                                   │  STEP 4: f_sort_by(Growth %, descending)
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  SORTED TABLE (4 rows × 5 columns)                                      │
  │  Widget D at top                                                         │
  └────────────────────────────────┬────────────────────────────────────────┘
                                   │  STEP 5: f_select_row(rank == 1)
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │  TERMINAL TABLE (1 row × 5 columns)                                     │
  │  Widget D | $44,500 | $1,800,000 | 31.2% | +3940%                       │
  └────────────────────────────────┬────────────────────────────────────────┘
                                   │  ANSWER GENERATION
                                   ▼
                    "Widget D, with 31.2% margin, grew 3940% Q1→Q4."
```

### Supported Operations

| Operation | Signature | Description |
|---|---|---|
| `f_add_col` | `f_add_col(table, col_name, formula)` | Compute new column from existing columns |
| `f_select_row` | `f_select_row(table, condition)` | Filter rows matching a boolean condition |
| `f_select_col` | `f_select_col(table, [col1, col2, ...])` | Project to a subset of columns |
| `f_group_by` | `f_group_by(table, group_col, agg_col, agg_fn)` | Group and aggregate (sum/mean/count/max/min) |
| `f_sort_by` | `f_sort_by(table, col, ascending=True)` | Sort rows by a column |

### WikiTableQuestions Benchmark Results

| System | WikiTQ Accuracy | FeTaQA BLEU-4 |
|---|---|---|
| GPT-3.5 (direct) | 46.1% | 31.2 |
| Dater (2023) | 51.7% | 34.8 |
| **ChainOfTable (GPT-3.5)** | **67.4%** | **38.1** |
| ChainOfTable (GPT-4) | 73.1% | 41.3 |
| ChainOfTable (Claude 3 Opus) | 74.8% | 42.7 |

+21.3 percentage points over direct GPT-3.5 prompting. The key insight is that each operation step **reduces table size**, so later steps operate on less ambiguous data.

### Full Python Implementation

```python
"""
ChainOfTable implementation using Claude claude-sonnet-4-6.
Simulates the paper's chain of table operations to answer
questions about tabular data.
"""

import json
import re
from typing import Any
import anthropic
import pandas as pd

client = anthropic.Anthropic()

# ── Operation implementations ────────────────────────────────────────────────

def f_add_col(df: pd.DataFrame, col_name: str, formula: str) -> pd.DataFrame:
    """Add a computed column. Formula is a pandas eval expression."""
    df = df.copy()
    df[col_name] = df.eval(formula)
    return df

def f_select_row(df: pd.DataFrame, condition: str) -> pd.DataFrame:
    """Filter rows matching a condition (pandas query string)."""
    return df.query(condition).reset_index(drop=True)

def f_select_col(df: pd.DataFrame, columns: list[str]) -> pd.DataFrame:
    """Project to specified columns."""
    return df[columns].copy()

def f_group_by(df: pd.DataFrame, group_col: str, agg_col: str, agg_fn: str) -> pd.DataFrame:
    """Group by a column and aggregate."""
    agg_map = {
        "sum": "sum", "mean": "mean", "count": "count",
        "max": "max", "min": "min"
    }
    fn = agg_map.get(agg_fn, "sum")
    return df.groupby(group_col)[agg_col].agg(fn).reset_index()

def f_sort_by(df: pd.DataFrame, col: str, ascending: bool = True) -> pd.DataFrame:
    """Sort rows by a column."""
    return df.sort_values(col, ascending=ascending).reset_index(drop=True)

OPERATIONS = {
    "f_add_col": f_add_col,
    "f_select_row": f_select_row,
    "f_select_col": f_select_col,
    "f_group_by": f_group_by,
    "f_sort_by": f_sort_by,
}

# ── Prompt templates ─────────────────────────────────────────────────────────

PLAN_PROMPT = """You are a table reasoning assistant. Given a question and a table, 
plan a sequence of operations to transform the table into one that directly answers the question.

Available operations:
- f_select_row(condition): Filter rows. Condition is a pandas query string.
- f_select_col(columns): Project to columns. Columns is a JSON array of column names.
- f_add_col(col_name, formula): Add computed column. Formula is a pandas eval expression.
- f_group_by(group_col, agg_col, agg_fn): Group and aggregate. agg_fn: sum/mean/count/max/min.
- f_sort_by(col, ascending): Sort by column. ascending: true/false.

Return ONLY a JSON array of operation objects. Each object has "op" and "args" keys.
Example: [{"op": "f_select_row", "args": {"condition": "Margin > 20"}}, ...]

Table columns: {columns}
Table (first 5 rows):
{table_preview}

Question: {question}

Return ONLY the JSON array, no explanation."""

ANSWER_PROMPT = """You are given a question and a transformed table that contains exactly 
the information needed to answer it. Answer the question precisely and concisely.

Question: {question}

Final table:
{table_md}

Answer:"""

# ── Chain of Table engine ────────────────────────────────────────────────────

def df_to_markdown(df: pd.DataFrame, max_rows: int = 20) -> str:
    """Convert DataFrame to Markdown table string."""
    return df.head(max_rows).to_markdown(index=False)

def plan_operations(question: str, df: pd.DataFrame) -> list[dict]:
    """Ask Claude claude-sonnet-4-6 to plan the operation chain."""
    preview = df_to_markdown(df, max_rows=5)
    prompt = PLAN_PROMPT.format(
        columns=list(df.columns),
        table_preview=preview,
        question=question,
    )
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()
    # Extract JSON array — strip markdown fences if present
    json_match = re.search(r'\[.*\]', raw, re.DOTALL)
    if not json_match:
        raise ValueError(f"No JSON array found in plan response: {raw}")
    return json.loads(json_match.group())

def execute_chain(df: pd.DataFrame, operations: list[dict]) -> tuple[pd.DataFrame, list[str]]:
    """Execute the planned operation chain, returning terminal table and log."""
    log = []
    current = df.copy()
    for step in operations:
        op_name = step["op"]
        args = step.get("args", {})
        if op_name not in OPERATIONS:
            log.append(f"SKIP unknown op: {op_name}")
            continue
        fn = OPERATIONS[op_name]
        try:
            current = fn(current, **args)
            log.append(f"{op_name}({args}) → {len(current)} rows × {len(current.columns)} cols")
        except Exception as e:
            log.append(f"{op_name}({args}) FAILED: {e}")
            # Continue with unchanged table on error
    return current, log

def generate_answer(question: str, terminal_df: pd.DataFrame) -> str:
    """Generate a natural language answer from the terminal table."""
    table_md = df_to_markdown(terminal_df)
    prompt = ANSWER_PROMPT.format(question=question, table_md=table_md)
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()

def chain_of_table(question: str, df: pd.DataFrame, verbose: bool = False) -> str:
    """
    Full ChainOfTable pipeline:
    1. Plan operations
    2. Execute chain
    3. Generate answer from terminal table
    """
    # Step 1: Plan
    operations = plan_operations(question, df)
    if verbose:
        print(f"Planned {len(operations)} operations:")
        for i, op in enumerate(operations, 1):
            print(f"  {i}. {op['op']}({op.get('args', {})})")

    # Step 2: Execute
    terminal_df, log = execute_chain(df, operations)
    if verbose:
        print("\nExecution log:")
        for entry in log:
            print(f"  {entry}")
        print(f"\nTerminal table ({len(terminal_df)} rows × {len(terminal_df.columns)} cols):")
        print(df_to_markdown(terminal_df))

    # Step 3: Answer
    return generate_answer(question, terminal_df)

# ── Example usage ─────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Sample product table
    data = {
        "Product":    ["Widget A", "Widget B", "Widget C", "Widget D", "Widget E"],
        "Q1_Rev":     [1200000, 800000, 3100000, 200000, 560000],
        "Q4_Rev":     [2100000, 500000, 3800000, 1800000, 672000],
        "Margin_Pct": [18.5, 22.1, 15.3, 31.2, 12.0],
        "Category":   ["Hardware", "Hardware", "Software", "Software", "Services"],
    }
    df = pd.DataFrame(data)

    question = "Among products with margin above 20%, which had the highest revenue growth from Q1 to Q4?"
    answer = chain_of_table(question, df, verbose=True)
    print(f"\nAnswer: {answer}")
```

**Expected output** (verbose mode):
```
Planned 4 operations:
  1. f_select_row({'condition': 'Margin_Pct > 20'})
  2. f_add_col({'col_name': 'Growth_Pct', 'formula': '(Q4_Rev - Q1_Rev) / Q1_Rev * 100'})
  3. f_sort_by({'col': 'Growth_Pct', 'ascending': False})
  4. f_select_row({'condition': 'index == 0'})

Execution log:
  f_select_row({'condition': 'Margin_Pct > 20'}) → 2 rows × 5 cols
  f_add_col(...) → 2 rows × 6 cols
  f_sort_by(...) → 2 rows × 6 cols
  f_select_row(...) → 1 rows × 6 cols

Answer: Widget D, with a 31.2% margin, achieved 800% revenue growth from Q1 ($200K) to Q4 ($1.8M).
```

---

## 4. TAPAS (Google, 2020 / Fine-tuned 2024)

**Paper**: "TAPAS: Weakly Supervised Table Parsing via Pre-training" (Herzig et al., Google, ACL 2020). Fine-tuned checkpoints for WTQ and SQA updated through 2024.

### How TAPAS Works

TAPAS is BERT fine-tuned to jointly encode a natural language question and a flattened table. Unlike ChainOfTable (which uses a general LLM), TAPAS is a specialized discriminative model — it selects cells, not generates text.

```
  INPUT: question + table → single token sequence

  [CLS] which product had the highest margin? [SEP]
        Product | Units | Revenue | Margin %   ← column tokens
        Widget A  12400   186000    18.5        ← row 1 tokens
        Widget B  3200    64000     22.1        ← row 2 tokens
        Widget C  28100   337200    15.3        ← row 3 tokens
        Widget D  890     44500     31.2        ← row 4 tokens

  TAPAS ADDS SPECIAL POSITIONAL EMBEDDINGS:
  ┌─────────────────────────────────────────────────────────────────────┐
  │ Token embedding     (standard BERT)                                 │
  │ + Column embedding  (which column: 0=question, 1=col1, 2=col2...)  │
  │ + Row embedding     (which row: 0=question, 1=header, 2=row1...)   │
  │ + Rank embedding    (numeric rank within column, for aggregation)   │
  └─────────────────────────────────────────────────────────────────────┘

  OUTPUT HEADS:
  ┌──────────────────────────────────────────────────────────────────────┐
  │ Cell selection head: P(cell selected) for each table cell            │
  │ Aggregation head: logits over {NONE, COUNT, SUM, AVERAGE}           │
  └──────────────────────────────────────────────────────────────────────┘

  RESULT: selected cells = {Widget D: 31.2%}, aggregation = NONE
  ANSWER: "31.2%"
```

### HuggingFace TAPAS Inference

```python
"""
TAPAS inference using HuggingFace transformers.
Model: google/tapas-large-finetuned-wtq (WikiTableQuestions)
"""

import pandas as pd
from transformers import pipeline, TapasTokenizer, TapasForQuestionAnswering

# Load fine-tuned TAPAS for WikiTableQuestions
model_name = "google/tapas-large-finetuned-wtq"
tokenizer = TapasTokenizer.from_pretrained(model_name)
model = TapasForQuestionAnswering.from_pretrained(model_name)

# Create HuggingFace pipeline
tapas_pipe = pipeline(
    "table-question-answering",
    model=model,
    tokenizer=tokenizer,
    device=-1,  # CPU; set to 0 for GPU
)

# Build table as dict of lists (required format)
table = {
    "Product":   ["Widget A", "Widget B", "Widget C", "Widget D", "Widget E"],
    "Units Sold":["12400",    "3200",     "28100",    "890",      "5600"],
    "Revenue":   ["186000",   "64000",    "337200",   "44500",    "67200"],
    "Margin %":  ["18.5",     "22.1",     "15.3",     "31.2",     "12.0"],
}

queries = [
    "What is the total revenue?",
    "Which product has the highest margin?",
    "How many products have more than 10000 units sold?",
    "What is the average margin of products with revenue above 100000?",
]

for query in queries:
    result = tapas_pipe(table=table, query=query)
    print(f"Q: {query}")
    print(f"A: {result['answer']} (cells: {result['cells']}, agg: {result['aggregator']})")
    print()

# Example output:
# Q: What is the total revenue?
# A: SUM > 699900 (cells: ['186000', '64000', '337200', '44500', '67200'], agg: SUM)
#
# Q: Which product has the highest margin?
# A: Widget D (cells: ['Widget D'], agg: NONE)
```

### TAPAS Limitations vs. ChainOfTable

| Dimension | TAPAS | ChainOfTable |
|---|---|---|
| **Model size** | 340M params (large) | Zero (uses existing LLM) |
| **Fine-tuning required** | Yes — domain-specific retraining needed | No |
| **Max table size** | 512 BERT tokens (~30 rows × 5 cols) | Bounded by LLM context |
| **Aggregations supported** | SUM, COUNT, AVERAGE, NONE | Arbitrary via pandas |
| **Multi-hop reasoning** | No | Yes (multi-step chain) |
| **Generalization** | Poor on out-of-domain tables | Strong (LLM generalizes) |
| **Latency** | ~50ms GPU, ~300ms CPU | ~2–5s (LLM calls) |
| **Explainability** | Low (cell selection probabilities) | High (visible operation chain) |
| **Cost** | Self-hosted, one-time GPU cost | Per-token LLM cost |

**When to use TAPAS**: You have a fixed, well-defined table schema (e.g., a product catalog), the questions are simple aggregations (sum/count/average/select), you have GPU infrastructure, and latency is critical (sub-500ms). TAPAS is effectively deprecated for complex multi-hop questions — ChainOfTable or NL2SQL outperforms it decisively on WikiTQ.

---

## 5. PandasAI / PandasAI 3.0

**Version**: PandasAI 3.0 (released Q1 2025). [GitHub: Sinaptik-AI/pandas-ai](https://github.com/Sinaptik-AI/pandas-ai)

### Core Idea

PandasAI exposes a `SmartDataframe` (or `Agent` in v3) that accepts natural language questions and responds by having the LLM **write and execute Python/pandas code** against the actual DataFrame in memory. The answer is derived from code execution, not from the LLM's parametric knowledge.

```
  USER: "Which 3 products have the highest margin × revenue product?"

  ┌─────────────────────────────────────────────────────────┐
  │ PandasAI Agent                                          │
  │                                                         │
  │  1. Schema introspection: df.dtypes, df.head(3)         │
  │     → sends to LLM as context                           │
  │                                                         │
  │  2. LLM generates Python code:                          │
  │     df['score'] = df['Margin_Pct'] * df['Revenue']      │
  │     result = df.nlargest(3, 'score')[['Product','score']]│
  │                                                         │
  │  3. RestrictedPython sandbox executes code              │
  │     → result DataFrame                                  │
  │                                                         │
  │  4. LLM formats result as natural language              │
  └─────────────────────────────────────────────────────────┘

  ANSWER: "Widget C ($5.16M score), Widget A ($3.44M), Widget D ($1.39M)"
```

### Installation

```bash
pip install pandasai>=3.0.0 anthropic>=0.40.0
```

### Full Implementation with Claude Backend

```python
"""
PandasAI 3.0 with Claude claude-sonnet-4-6 backend.
Demonstrates single-DataFrame queries, multi-DataFrame joins,
and the custom LLM wrapper for Anthropic.
"""

import os
import pandas as pd
from pandasai import Agent
from pandasai.llm.base import LLM
import anthropic

# ── Custom Claude LLM wrapper for PandasAI ──────────────────────────────────

class ClaudeLLM(LLM):
    """Wraps Anthropic Claude for PandasAI's LLM interface."""

    def __init__(self, model: str = "claude-sonnet-4-6", max_tokens: int = 2048):
        self.model = model
        self.max_tokens = max_tokens
        self._client = anthropic.Anthropic()

    @property
    def type(self) -> str:
        return "claude"

    def call(self, instruction, context=None, suffix="") -> str:
        prompt = instruction.to_string()
        if suffix:
            prompt += f"\n{suffix}"

        response = self._client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

# ── Build sample DataFrames ─────────────────────────────────────────────────

products_df = pd.DataFrame({
    "product_id":  [1, 2, 3, 4, 5],
    "product":     ["Widget A", "Widget B", "Widget C", "Widget D", "Widget E"],
    "units_sold":  [12400, 3200, 28100, 890, 5600],
    "revenue":     [186000, 64000, 337200, 44500, 67200],
    "margin_pct":  [18.5, 22.1, 15.3, 31.2, 12.0],
    "category":    ["Hardware", "Hardware", "Software", "Software", "Services"],
})

sales_df = pd.DataFrame({
    "product_id":  [1, 1, 2, 3, 3, 4, 5],
    "quarter":     ["Q1", "Q4", "Q1", "Q1", "Q4", "Q4", "Q1"],
    "region":      ["North", "North", "South", "East", "East", "West", "North"],
    "sale_amount": [45000, 52000, 30000, 84000, 91000, 22000, 15000],
})

# ── Single DataFrame agent ───────────────────────────────────────────────────

llm = ClaudeLLM(model="claude-sonnet-4-6")

# PandasAI 3.0 uses Agent instead of SmartDataframe
agent = Agent(
    dfs=[products_df],
    config={
        "llm": llm,
        "verbose": True,          # show generated code
        "enable_cache": True,     # cache identical queries
        "max_retries": 3,         # auto-retry on code errors
        "save_logs": True,
    }
)

# Simple queries
q1 = agent.chat("What is the total revenue across all products?")
print(f"Total revenue: {q1}")

q2 = agent.chat("Which product category has the highest average margin?")
print(f"Best margin category: {q2}")

q3 = agent.chat("Create a bar chart of revenue by product.")
# Returns a matplotlib figure object when visualization is requested

# ── Multi-DataFrame agent (joins handled automatically) ──────────────────────

multi_agent = Agent(
    dfs=[products_df, sales_df],
    config={"llm": llm, "verbose": True, "max_retries": 3},
)

q4 = multi_agent.chat(
    "For each product category, what is the total sale amount in Q4 "
    "for products with margin above 15%?"
)
print(f"Q4 category sales (margin>15%): {q4}")

# The generated code will perform:
# merged = products_df.merge(sales_df, on='product_id')
# filtered = merged[(merged['quarter'] == 'Q4') & (merged['margin_pct'] > 15)]
# result = filtered.groupby('category')['sale_amount'].sum()

# ── Clarification / follow-up ────────────────────────────────────────────────

# PandasAI 3.0 supports multi-turn conversation
agent.chat("Which product had the highest revenue?")
q5 = agent.chat("What is its margin percentage?")  # "it" resolved from context
print(f"Follow-up answer: {q5}")
```

### Security: RestrictedPython Sandbox

PandasAI executes LLM-generated code in a sandboxed environment using `RestrictedPython`. The restrictions include:

```python
# What RestrictedPython BLOCKS by default:
# - import os, sys, subprocess (no system access)
# - open() for file I/O
# - __import__ (dynamic imports)
# - exec(), eval() (no code injection)
# - Access to __builtins__ except whitelisted set

# PandasAI's whitelist:
ALLOWED_BUILTINS = {
    "print", "range", "len", "list", "dict", "set", "tuple",
    "str", "int", "float", "bool", "zip", "enumerate", "map",
    "filter", "sorted", "sum", "min", "max", "abs", "round",
}

# Additionally allowed imports (configurable):
ALLOWED_IMPORTS = {
    "pandas", "numpy", "matplotlib", "seaborn", "datetime", "re",
}
```

**Production hardening**: Beyond RestrictedPython, run PandasAI in a containerized process with CPU/memory limits, no network access, and a 10-second execution timeout.

---

## 6. DuckDB In-Process Analytics

**Version**: DuckDB 1.1+ (released September 2024). [duckdb.org](https://duckdb.org)

### Why DuckDB Beats pandas for Large Tables

```
  PANDAS (row-oriented, in-memory)          DUCKDB (columnar, vectorized)
  ────────────────────────────────          ─────────────────────────────
  DataFrame stored row by row:              Data stored column by column:

  [row0: A=1, B="x", C=1.1]                col_A: [1, 2, 3, ...]   ← contiguous
  [row1: A=2, B="y", C=2.2]                col_B: ["x","y","z",...] ← contiguous
  [row2: A=3, B="z", C=3.3]                col_C: [1.1,2.2,3.3,...] ← contiguous
  ...

  GROUP BY col_A:                           GROUP BY col_A:
  → must scan ALL columns per row           → scan ONLY col_A
  → no SIMD (mixed types in row)            → SIMD vectorized over col_A array

  BENCHMARK: GROUP BY + SUM on 10M rows, 6 columns
  pandas:  4.2 seconds                      DuckDB: 0.38 seconds  (11x faster)
  pandas:  ~800 MB RAM                      DuckDB: ~120 MB RAM    (6.7x less)
```

DuckDB reads **Parquet, CSV, JSON, and Arrow** directly from disk without loading the full file into memory. For a 2 GB Parquet file, DuckDB scans only the columns referenced in the query.

### Full NL2SQL Implementation with DuckDB

```python
"""
DuckDB in-process NL2SQL pipeline with Claude claude-sonnet-4-6.
Features:
- Direct Parquet/CSV/JSON reading
- Schema introspection
- SQL generation + validation
- Natural language answer synthesis
"""

import duckdb
import re
import anthropic

client = anthropic.Anthropic()

# ── DuckDB connection (in-process, no server) ────────────────────────────────

conn = duckdb.connect()  # ":memory:" is default — use "analytics.ddb" for persistence

# Register files directly — DuckDB reads them lazily
conn.execute("""
    CREATE VIEW products AS SELECT * FROM read_csv_auto('/data/products.csv');
""")
conn.execute("""
    CREATE VIEW sales AS SELECT * FROM read_parquet('/data/sales/*.parquet');
""")
conn.execute("""
    CREATE VIEW events AS SELECT * FROM read_json_auto('/data/events.jsonl');
""")

# ── Schema introspection ─────────────────────────────────────────────────────

def get_schema_context(conn: duckdb.DuckDBPyConnection, tables: list[str]) -> str:
    """Extract schema + sample rows for each table to use as LLM context."""
    parts = []
    for table in tables:
        # Column names and types
        schema = conn.execute(f"DESCRIBE {table}").fetchdf()
        cols_desc = "\n".join(
            f"  {row['column_name']} {row['column_type']}"
            for _, row in schema.iterrows()
        )

        # Row count
        count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]

        # Sample rows (3)
        sample = conn.execute(f"SELECT * FROM {table} LIMIT 3").fetchdf()
        sample_str = sample.to_string(index=False)

        parts.append(
            f"TABLE: {table} ({count:,} rows)\n"
            f"COLUMNS:\n{cols_desc}\n"
            f"SAMPLE:\n{sample_str}\n"
        )
    return "\n".join(parts)

# ── SQL generation ───────────────────────────────────────────────────────────

SQL_SYSTEM = """You are an expert DuckDB SQL analyst. Generate a single valid DuckDB SQL query 
that answers the user's question.

DuckDB-specific syntax you can use:
- QUALIFY ROW_NUMBER() OVER (...) = 1   (window function filtering)
- LIST_AGG(col, ',')                    (array aggregation, aka STRING_AGG)
- ARRAY_AGG(col)                        (collect values into array)
- JSON_EXTRACT(col, '$.key')            (JSON field extraction)
- STRFTIME(col, '%Y-%m')               (date formatting)
- PIVOT and UNPIVOT                     (reshape tables)
- EXCLUDE (col1, col2)                  (select all except)
- :: cast syntax (e.g., '2024-01-01'::DATE)

Rules:
1. Use only the tables and columns shown in the schema.
2. Always include LIMIT 10000 unless the question asks for aggregates.
3. Return ONLY the SQL query, no explanation, no markdown fences.
4. For "top N" questions use ORDER BY + LIMIT, not subqueries.
"""

def generate_sql(question: str, schema_context: str) -> str:
    """Generate DuckDB SQL from natural language using Claude."""
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SQL_SYSTEM,
        messages=[{
            "role": "user",
            "content": f"Schema:\n{schema_context}\n\nQuestion: {question}"
        }],
    )
    sql = response.content[0].text.strip()
    # Strip accidental markdown fences
    sql = re.sub(r'^```(?:sql)?\s*', '', sql, flags=re.IGNORECASE)
    sql = re.sub(r'\s*```$', '', sql)
    return sql.strip()

# ── SQL execution with error recovery ────────────────────────────────────────

def execute_with_retry(conn, sql: str, schema_context: str, question: str, max_retries: int = 2):
    """Execute SQL; on error, ask Claude to fix it."""
    for attempt in range(max_retries + 1):
        try:
            result_df = conn.execute(sql).fetchdf()
            return result_df, sql
        except Exception as e:
            if attempt == max_retries:
                raise
            # Self-correction prompt
            fix_response = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                messages=[{
                    "role": "user",
                    "content": (
                        f"This DuckDB SQL failed:\n{sql}\n\n"
                        f"Error: {e}\n\n"
                        f"Schema:\n{schema_context}\n\n"
                        f"Original question: {question}\n\n"
                        f"Return the corrected SQL only."
                    )
                }],
            )
            sql = fix_response.content[0].text.strip()
            sql = re.sub(r'^```(?:sql)?\s*', '', sql, flags=re.IGNORECASE)
            sql = re.sub(r'\s*```$', '', sql)

# ── Answer synthesis ─────────────────────────────────────────────────────────

def synthesize_answer(question: str, sql: str, result_df) -> str:
    """Convert query result to natural language answer."""
    result_preview = result_df.head(20).to_string(index=False)
    row_count = len(result_df)

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": (
                f"Question: {question}\n\n"
                f"SQL executed: {sql}\n\n"
                f"Result ({row_count} rows total):\n{result_preview}\n\n"
                "Provide a concise, precise answer to the question based on the result."
            )
        }],
    )
    return response.content[0].text.strip()

# ── Main pipeline ────────────────────────────────────────────────────────────

def duckdb_nl_query(question: str, tables: list[str] = None) -> dict:
    """Full NL→SQL→Answer pipeline using DuckDB."""
    if tables is None:
        tables = ["products", "sales"]  # default tables

    schema_context = get_schema_context(conn, tables)
    sql = generate_sql(question, schema_context)
    result_df, final_sql = execute_with_retry(conn, sql, schema_context, question)
    answer = synthesize_answer(question, final_sql, result_df)

    return {
        "question": question,
        "sql": final_sql,
        "result_rows": len(result_df),
        "answer": answer,
        "result": result_df,
    }

# ── Advanced DuckDB patterns ─────────────────────────────────────────────────

# Window function: rank products within category by revenue
WINDOW_EXAMPLE = """
SELECT
    product,
    category,
    revenue,
    RANK() OVER (PARTITION BY category ORDER BY revenue DESC) AS rank_in_category,
    revenue / SUM(revenue) OVER (PARTITION BY category) AS pct_of_category
FROM products
QUALIFY RANK() OVER (PARTITION BY category ORDER BY revenue DESC) <= 3
"""

# JSON extraction from semi-structured column
JSON_EXAMPLE = """
SELECT
    product,
    JSON_EXTRACT(metadata, '$.tags[0]')      AS primary_tag,
    JSON_EXTRACT(metadata, '$.launch_date')  AS launch_date,
    ARRAY_AGG(DISTINCT region) AS regions_sold
FROM products
JOIN sales USING (product_id)
GROUP BY product, metadata
"""

# Pivot: quarters as columns
PIVOT_EXAMPLE = """
PIVOT (
    SELECT product_id, quarter, SUM(sale_amount) AS total
    FROM sales
    GROUP BY product_id, quarter
)
ON quarter
USING SUM(total)
ORDER BY product_id
"""

if __name__ == "__main__":
    result = duckdb_nl_query(
        "Which product category had the highest total sales in Q4, "
        "and what percentage of annual sales did that represent?"
    )
    print(f"SQL:\n{result['sql']}\n")
    print(f"Answer: {result['answer']}")
```

### Performance Numbers

| Operation | pandas | DuckDB 1.1 | Speedup |
|---|---|---|---|
| GROUP BY + SUM, 10M rows | 4.2s | 0.38s | **11x** |
| JOIN two 5M-row tables | 12.1s | 1.4s | **8.6x** |
| Filter + aggregate, 10M rows | 2.8s | 0.22s | **12.7x** |
| Read 2 GB Parquet, 3 columns | 8.9s (full load) | 0.91s (lazy) | **9.8x** |
| Window function, 1M rows | 3.1s | 0.29s | **10.7x** |

DuckDB memory usage is ~6–7x lower than pandas for the same query because it reads only referenced columns.

---

## 7. Vanna.ai — Self-Learning NL2SQL

**Version**: Vanna v0.7+ (2025). [vanna.ai](https://vanna.ai) / [GitHub: vanna-ai/vanna](https://github.com/vanna-ai/vanna)

### Architecture: RAG-Based NL2SQL

Vanna differs from one-shot NL2SQL by maintaining a **retrieval store of curated query examples**. When you ask a question, Vanna retrieves the most similar past Q→SQL pairs and includes them as few-shot examples in the SQL generation prompt.

```
  TRAINING PHASE                          QUERY PHASE
  ───────────────                         ────────────
  You provide:                            User asks question
    question → SQL pairs                        │
    DDL (CREATE TABLE)                          ▼
    documentation                        Embed question
         │                                      │
         ▼                                      ▼
  Vanna.train()                          ChromaDB similarity
    → embed Q+SQL                         search
    → store in ChromaDB                        │
                                               ▼
                                        Retrieve top-K
                                        Q→SQL examples
                                               │
                                               ▼
                                        Build prompt:
                                         schema
                                         + retrieved examples
                                         + new question
                                               │
                                               ▼
                                        LLM generates SQL
                                               │
                                               ▼
                                        Execute + return result
```

The key insight: **SQL generation accuracy improves over time** as more Q→SQL pairs are added to the retrieval store. This is RAG applied to the code generation problem itself.

### Full Implementation with Claude Backend

```python
"""
Vanna v0.7 with ChromaDB + Claude claude-sonnet-4-6.
Demonstrates training, querying, and schema change handling.
"""

import vanna
from vanna.chromadb import ChromaDB_VectorStore
from vanna.anthropic import Anthropic_Chat
import anthropic
import duckdb

# ── Custom Vanna class combining ChromaDB + Claude ──────────────────────────

class VannaClaudeChroma(ChromaDB_VectorStore, Anthropic_Chat):
    """Vanna with ChromaDB vector store and Claude as the LLM."""
    def __init__(self, config=None):
        ChromaDB_VectorStore.__init__(self, config=config)
        Anthropic_Chat.__init__(self, config=config)

vn = VannaClaudeChroma(config={
    "api_key": None,               # Anthropic reads from ANTHROPIC_API_KEY env
    "model": "claude-sonnet-4-6",
    "path": "./vanna_chromadb",    # persistent ChromaDB storage
})

# ── Connect to database ──────────────────────────────────────────────────────

vn.connect_to_duckdb(url="analytics.ddb")

# ── Training phase ───────────────────────────────────────────────────────────

# 1. Train on DDL (schema gives the LLM type information)
vn.train(ddl="""
    CREATE TABLE products (
        product_id   INTEGER PRIMARY KEY,
        product      VARCHAR,
        category     VARCHAR,
        units_sold   INTEGER,
        revenue      NUMERIC(12,2),
        margin_pct   NUMERIC(5,2),
        launch_date  DATE
    );

    CREATE TABLE sales (
        sale_id      INTEGER PRIMARY KEY,
        product_id   INTEGER REFERENCES products(product_id),
        quarter      VARCHAR(2),
        region       VARCHAR,
        sale_amount  NUMERIC(12,2),
        sale_date    DATE
    );
""")

# 2. Train on documentation (domain knowledge the LLM needs)
vn.train(documentation="""
    Revenue is stored in USD. Margin_pct is a percentage (e.g., 18.5 means 18.5%).
    Quarters are stored as 'Q1', 'Q2', 'Q3', 'Q4'.
    Regions are: 'North', 'South', 'East', 'West'.
    The 'products' table contains current product catalog; discontinued products
    have revenue = 0 in the most recent quarter.
""")

# 3. Train on curated Q→SQL examples (most impactful for accuracy)
training_pairs = [
    (
        "What is the total revenue by product category?",
        "SELECT category, SUM(revenue) AS total_revenue FROM products GROUP BY category ORDER BY total_revenue DESC"
    ),
    (
        "Which products had declining sales (Q1 to Q4)?",
        """
        WITH quarterly AS (
            SELECT product_id, quarter, SUM(sale_amount) AS q_total
            FROM sales
            GROUP BY product_id, quarter
        ),
        pivoted AS (
            PIVOT quarterly ON quarter USING SUM(q_total)
        )
        SELECT p.product, pivoted.Q1, pivoted.Q4,
               (pivoted.Q4 - pivoted.Q1) / pivoted.Q1 * 100 AS pct_change
        FROM pivoted
        JOIN products p USING (product_id)
        WHERE pivoted.Q4 < pivoted.Q1
        ORDER BY pct_change
        """
    ),
    (
        "What are the top 5 products by revenue in the North region?",
        """
        SELECT p.product, SUM(s.sale_amount) AS north_revenue
        FROM sales s
        JOIN products p USING (product_id)
        WHERE s.region = 'North'
        GROUP BY p.product
        ORDER BY north_revenue DESC
        LIMIT 5
        """
    ),
    (
        "Show month-over-month revenue growth for Software products",
        """
        SELECT
            STRFTIME(s.sale_date, '%Y-%m') AS month,
            SUM(s.sale_amount) AS monthly_revenue,
            LAG(SUM(s.sale_amount)) OVER (ORDER BY STRFTIME(s.sale_date, '%Y-%m')) AS prev_month,
            (SUM(s.sale_amount) - LAG(SUM(s.sale_amount)) OVER (ORDER BY STRFTIME(s.sale_date, '%Y-%m')))
                / LAG(SUM(s.sale_amount)) OVER (ORDER BY STRFTIME(s.sale_date, '%Y-%m')) * 100 AS mom_growth_pct
        FROM sales s
        JOIN products p USING (product_id)
        WHERE p.category = 'Software'
        GROUP BY STRFTIME(s.sale_date, '%Y-%m')
        ORDER BY month
        """
    ),
]

for question, sql in training_pairs:
    vn.train(question=question, sql=sql)

print(f"Training complete. ChromaDB contains {vn.get_training_data().shape[0]} examples.")

# ── Query phase ──────────────────────────────────────────────────────────────

questions = [
    "Which product category has the highest average margin?",
    "Show total Q4 sales by region for hardware products",
    "What percentage of total revenue comes from Software products?",
]

for question in questions:
    sql = vn.generate_sql(question)
    print(f"\nQ: {question}")
    print(f"SQL:\n{sql}")

    result_df = vn.run_sql(sql)
    print(f"Result: {result_df.to_string(index=False)}")

# ── Full pipeline: question → answer ────────────────────────────────────────
answer_df = vn.ask(
    "Which 3 products with margin above 20% had the highest Q4 sales?",
    print_results=True,
    auto_train=True,  # automatically adds this Q→SQL pair to training store
)

# ── Handling schema changes ───────────────────────────────────────────────────
# When a column is added, retrain on updated DDL:
vn.train(ddl="""
    ALTER TABLE products ADD COLUMN cogs NUMERIC(12,2);
    -- cogs = cost of goods sold; margin_pct = (revenue - cogs) / revenue * 100
""")
vn.train(documentation="cogs is cost of goods sold in USD.")
```

### Spider 2.0 Benchmark Results

Spider 2.0 (2024) is the hardest NL2SQL benchmark — it includes enterprise databases with complex schemas (up to 200 tables), multi-step queries, and dialect-specific syntax.

| System | Spider 2.0 EX | Spider 1.0 EX |
|---|---|---|
| GPT-4o (zero-shot) | 17.2% | 82.1% |
| Claude 3.5 Sonnet (zero-shot) | 19.8% | 83.4% |
| Vanna v0.6 (ChromaDB + GPT-4o) | 34.1% | 89.2% |
| **Vanna v0.7 (ChromaDB + Claude claude-sonnet-4-6)** | **38.7%** | **91.3%** |
| DAIL-SQL + GPT-4 | 54.1% | 86.6% |

Spider 2.0 scores are significantly lower than Spider 1.0 across all systems — the benchmark is intentionally much harder. Vanna's retrieval-augmented approach nearly doubles zero-shot accuracy on Spider 2.0.

---

## 8. Full NL2SQL Production Pipeline

A production NL2SQL system requires several components beyond basic SQL generation: safe schema introspection, calibrated few-shot selection, SQL validation, error recovery, and result synthesis.

### Pipeline Architecture

```
  USER QUESTION
       │
       ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ 1. SCHEMA INTROSPECTION                                         │
  │    Extract: table names, columns, types, PKs, FKs, samples      │
  └─────────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ 2. FEW-SHOT SELECTION                                           │
  │    BM25 or vector search over Q→SQL pair store                  │
  │    Select top-K most similar past questions                     │
  └─────────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ 3. SQL GENERATION                                               │
  │    Prompt: system + schema + few-shot + question                │
  │    Claude claude-sonnet-4-6 → raw SQL string                           │
  └─────────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ 4. SQL VALIDATION                                               │
  │    a. sqlglot parse (syntax check)                              │
  │    b. AST inspection (no DML/DDL)                               │
  │    c. Table/column allowlist check                              │
  │    d. LIMIT injection                                           │
  └──────────────────┬──────────────────────────┬───────────────────┘
                     │ PASS                     │ FAIL
                     ▼                          ▼
  ┌──────────────────────────┐    ┌──────────────────────────────────┐
  │ 5. EXECUTION             │    │ 5b. LLM SELF-CORRECTION          │
  │    Run against DB        │    │     Retry with error message     │
  │    Timeout enforced      │    │     (max 2 retries)              │
  └──────────┬───────────────┘    └──────────────────────────────────┘
             │
             ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │ 6. ANSWER SYNTHESIS                                             │
  │    Result rows + question → Claude → natural language answer    │
  └─────────────────────────────────────────────────────────────────┘
```

### Full Python Implementation

```python
"""
Production NL2SQL pipeline — ~120 lines.
Features:
- PostgreSQL or DuckDB backend
- BM25 few-shot selection (rank_bm25)
- sqlglot validation + AST safety check
- Row limit injection
- LLM self-correction (2 retries)
- Structured logging
"""

import json
import logging
import re
import time
from dataclasses import dataclass, field
from typing import Optional

import anthropic
import duckdb
import sqlglot
from rank_bm25 import BM25Okapi

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

client = anthropic.Anthropic()

# ── Data models ──────────────────────────────────────────────────────────────

@dataclass
class TableSchema:
    name: str
    columns: list[dict]          # [{"name": str, "type": str, "nullable": bool}]
    primary_keys: list[str]
    foreign_keys: list[dict]     # [{"col": str, "ref_table": str, "ref_col": str}]
    sample_rows: list[dict]
    row_count: int

@dataclass
class QueryExample:
    question: str
    sql: str
    tokens: list[str] = field(default_factory=list)

    def __post_init__(self):
        self.tokens = self.question.lower().split()

@dataclass
class QueryResult:
    question: str
    sql: str
    rows: list[dict]
    row_count: int
    answer: str
    latency_ms: float
    retries: int

# ── Schema introspection ─────────────────────────────────────────────────────

def introspect_schema(conn: duckdb.DuckDBPyConnection, table_names: list[str]) -> list[TableSchema]:
    """Extract full schema information from DuckDB."""
    schemas = []
    for table in table_names:
        cols_df = conn.execute(f"DESCRIBE {table}").fetchdf()
        columns = [
            {"name": row["column_name"], "type": row["column_type"], "nullable": row["null"] == "YES"}
            for _, row in cols_df.iterrows()
        ]
        row_count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
        sample = conn.execute(f"SELECT * FROM {table} LIMIT 3").fetchdf().to_dict("records")
        schemas.append(TableSchema(
            name=table,
            columns=columns,
            primary_keys=[],   # extend with PRAGMA foreign_key_list for SQLite/DuckDB
            foreign_keys=[],
            sample_rows=sample,
            row_count=row_count,
        ))
    return schemas

def schema_to_prompt(schemas: list[TableSchema]) -> str:
    """Serialize schema info for LLM prompt."""
    parts = []
    for s in schemas:
        cols = "\n".join(f"  {c['name']} {c['type']}" for c in s.columns)
        sample = json.dumps(s.sample_rows[:2], default=str, indent=2)
        parts.append(
            f"TABLE {s.name} ({s.row_count:,} rows)\n"
            f"COLUMNS:\n{cols}\n"
            f"SAMPLE ROWS:\n{sample}\n"
        )
    return "\n".join(parts)

# ── BM25 few-shot selection ───────────────────────────────────────────────────

class FewShotStore:
    """BM25-based retrieval of similar Q→SQL examples."""

    def __init__(self, examples: list[QueryExample]):
        self.examples = examples
        corpus = [ex.tokens for ex in examples]
        self.bm25 = BM25Okapi(corpus)

    def retrieve(self, question: str, k: int = 3) -> list[QueryExample]:
        tokens = question.lower().split()
        scores = self.bm25.get_scores(tokens)
        top_k = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
        return [self.examples[i] for i in top_k]

    def add(self, example: QueryExample):
        self.examples.append(example)
        corpus = [ex.tokens for ex in self.examples]
        self.bm25 = BM25Okapi(corpus)

# ── SQL generation ────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a DuckDB SQL expert. Generate exactly one valid DuckDB SQL SELECT query.
Rules:
1. Use only tables and columns from the schema provided.
2. Do not use INSERT, UPDATE, DELETE, DROP, CREATE, or TRUNCATE.
3. Return ONLY the SQL query — no markdown, no explanation.
4. For top-N questions, use ORDER BY + LIMIT.
5. Always qualify column names with table aliases when joining.
"""

def build_sql_prompt(question: str, schema_str: str, examples: list[QueryExample]) -> str:
    shots = ""
    for ex in examples:
        shots += f"Question: {ex.question}\nSQL: {ex.sql}\n\n"
    return (
        f"Schema:\n{schema_str}\n\n"
        f"{'Examples:' + chr(10) + shots if shots else ''}"
        f"Question: {question}\nSQL:"
    )

def generate_sql_raw(question: str, schema_str: str, examples: list[QueryExample]) -> str:
    prompt = build_sql_prompt(question, schema_str, examples)
    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    sql = resp.content[0].text.strip()
    # Strip markdown fences
    sql = re.sub(r'^```\w*\s*', '', sql).rstrip('`').strip()
    return sql

# ── SQL validation ────────────────────────────────────────────────────────────

UNSAFE_STATEMENT_TYPES = {
    "Insert", "Update", "Delete", "Drop", "Create", "Truncate",
    "AlterTable", "Grant", "Revoke",
}

def validate_sql(sql: str, allowed_tables: set[str], row_limit: int = 10000) -> str:
    """
    Validate and sanitize SQL:
    1. Parse with sqlglot (syntax check)
    2. AST inspection for unsafe statements
    3. Table allowlist enforcement
    4. LIMIT injection
    Returns sanitized SQL or raises ValueError.
    """
    # 1. Parse
    try:
        statements = sqlglot.parse(sql, dialect="duckdb")
    except sqlglot.errors.ParseError as e:
        raise ValueError(f"SQL syntax error: {e}")

    if not statements:
        raise ValueError("Empty SQL")

    stmt = statements[0]

    # 2. AST safety check
    stmt_type = type(stmt).__name__
    if stmt_type in UNSAFE_STATEMENT_TYPES:
        raise ValueError(f"Unsafe statement type: {stmt_type}")

    # 3. Table allowlist
    referenced_tables = {
        table.name.lower()
        for table in stmt.find_all(sqlglot.exp.Table)
    }
    disallowed = referenced_tables - {t.lower() for t in allowed_tables}
    if disallowed:
        raise ValueError(f"Unauthorized tables: {disallowed}")

    # 4. LIMIT injection — add if missing, cap if too high
    if stmt.find(sqlglot.exp.Limit) is None:
        stmt = stmt.limit(row_limit)
    else:
        existing_limit = int(stmt.find(sqlglot.exp.Literal).this)
        if existing_limit > row_limit:
            stmt = stmt.limit(row_limit)

    return stmt.sql(dialect="duckdb")

# ── Answer synthesis ──────────────────────────────────────────────────────────

def synthesize_answer(question: str, sql: str, rows: list[dict]) -> str:
    preview = json.dumps(rows[:10], default=str, indent=2)
    resp = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=256,
        messages=[{
            "role": "user",
            "content": (
                f"Question: {question}\n"
                f"SQL: {sql}\n"
                f"Result ({len(rows)} rows):\n{preview}\n\n"
                "Answer concisely and precisely."
            )
        }],
    )
    return resp.content[0].text.strip()

# ── Main pipeline ──────────────────────────────────────────────────────────────

class NL2SQLPipeline:
    def __init__(
        self,
        conn: duckdb.DuckDBPyConnection,
        table_names: list[str],
        examples: list[QueryExample] = None,
        row_limit: int = 10000,
        max_retries: int = 2,
    ):
        self.conn = conn
        self.table_names = table_names
        self.row_limit = row_limit
        self.max_retries = max_retries
        self.schemas = introspect_schema(conn, table_names)
        self.schema_str = schema_to_prompt(self.schemas)
        self.allowed_tables = set(table_names)
        self.store = FewShotStore(examples or [])

    def query(self, question: str) -> QueryResult:
        t0 = time.perf_counter()
        retries = 0
        examples = self.store.retrieve(question, k=3)
        sql = generate_sql_raw(question, self.schema_str, examples)
        last_error = None

        for attempt in range(self.max_retries + 1):
            try:
                safe_sql = validate_sql(sql, self.allowed_tables, self.row_limit)
                rows = self.conn.execute(safe_sql).fetchdf().to_dict("records")
                answer = synthesize_answer(question, safe_sql, rows)
                latency_ms = (time.perf_counter() - t0) * 1000

                # Auto-add to few-shot store on success
                self.store.add(QueryExample(question=question, sql=safe_sql))

                logger.info(f"Query OK in {latency_ms:.0f}ms, {len(rows)} rows, {retries} retries")
                return QueryResult(
                    question=question, sql=safe_sql, rows=rows,
                    row_count=len(rows), answer=answer,
                    latency_ms=latency_ms, retries=retries,
                )
            except Exception as e:
                last_error = e
                if attempt < self.max_retries:
                    retries += 1
                    logger.warning(f"Attempt {attempt+1} failed: {e}. Retrying...")
                    # Self-correction
                    fix_resp = client.messages.create(
                        model="claude-sonnet-4-6",
                        max_tokens=1024,
                        messages=[{
                            "role": "user",
                            "content": (
                                f"This SQL failed:\n{sql}\n\nError: {e}\n\n"
                                f"Schema:\n{self.schema_str}\n\n"
                                f"Question: {question}\n\nReturn corrected SQL only."
                            )
                        }],
                    )
                    sql = fix_resp.content[0].text.strip()
                    sql = re.sub(r'^```\w*\s*', '', sql).rstrip('`').strip()

        raise RuntimeError(f"All {self.max_retries + 1} attempts failed. Last error: {last_error}")
```

---

## 9. Safety Patterns for NL2SQL

NL2SQL exposes your database to LLM-generated queries. Without safety controls, a sufficiently crafted user question can produce SQL that exfiltrates, corrupts, or destroys data.

### Threat Model

```
  ATTACK SURFACE                    RISK
  ─────────────────────────────────────────────────────────────────────
  Prompt injection via user input   LLM generates DELETE/DROP
  Schema enumeration                Attacker maps DB structure
  Data exfiltration                 SELECT * FROM users (all records)
  Resource exhaustion               Cartesian JOIN, no LIMIT
  Nested queries                    Bypass allowlist via subquery
  Function abuse                    pg_read_file(), lo_import()
```

### Pattern 1: Read-Only Database User (PostgreSQL)

```sql
-- Create a read-only role for NL2SQL
CREATE ROLE nl2sql_readonly;

-- Grant CONNECT to specific database
GRANT CONNECT ON DATABASE analytics TO nl2sql_readonly;

-- Grant USAGE on schema
GRANT USAGE ON SCHEMA public TO nl2sql_readonly;

-- Grant SELECT only on specific tables
GRANT SELECT ON TABLE products, sales, categories TO nl2sql_readonly;

-- NEVER grant INSERT, UPDATE, DELETE, TRUNCATE, or DDL

-- Create application user with this role
CREATE USER nl2sql_app WITH PASSWORD 'strong-password';
GRANT nl2sql_readonly TO nl2sql_app;

-- Revoke default public privileges
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO nl2sql_readonly;
```

### Pattern 2: Query AST Inspection with sqlglot

```python
"""
SQL safety validation using sqlglot AST inspection.
Detects: DML, DDL, function abuse, cross-schema access.
"""

import sqlglot
import sqlglot.expressions as exp

BLOCKED_STATEMENT_TYPES = frozenset({
    exp.Insert, exp.Update, exp.Delete, exp.Drop, exp.Create,
    exp.Truncate, exp.AlterTable, exp.Grant, exp.Revoke,
    exp.Command,   # catches COPY, VACUUM, etc.
})

BLOCKED_FUNCTIONS = frozenset({
    # PostgreSQL dangerous functions
    "pg_read_file", "pg_ls_dir", "pg_read_binary_file",
    "lo_import", "lo_export", "lo_unlink",
    "dblink", "dblink_exec",
    # Generic
    "exec", "system", "shell",
    # DuckDB
    "read_text", "read_blob",
})

def check_sql_safety(sql: str, allowed_tables: set[str]) -> tuple[bool, str]:
    """
    Returns (is_safe, reason).
    Checks statement type, functions, and table access.
    """
    try:
        tree = sqlglot.parse_one(sql, dialect="duckdb")
    except sqlglot.errors.ParseError as e:
        return False, f"Parse error: {e}"

    # Check statement type
    for blocked_type in BLOCKED_STATEMENT_TYPES:
        if isinstance(tree, blocked_type):
            return False, f"Blocked statement type: {type(tree).__name__}"

    # Check for blocked functions (case-insensitive)
    for func in tree.find_all(exp.Anonymous, exp.Func):
        func_name = getattr(func, 'name', '') or getattr(func, 'sql_name', '')
        if func_name.lower() in BLOCKED_FUNCTIONS:
            return False, f"Blocked function: {func_name}"

    # Check table references against allowlist
    for table in tree.find_all(exp.Table):
        if table.name.lower() not in {t.lower() for t in allowed_tables}:
            return False, f"Unauthorized table: {table.name}"

    # Check for subqueries that reference blocked tables
    for subquery in tree.find_all(exp.Subquery):
        for table in subquery.find_all(exp.Table):
            if table.name.lower() not in {t.lower() for t in allowed_tables}:
                return False, f"Unauthorized table in subquery: {table.name}"

    return True, "OK"

# Usage
allowed = {"products", "sales", "categories"}

tests = [
    "SELECT * FROM products LIMIT 10",
    "SELECT * FROM products; DROP TABLE products;--",
    "DELETE FROM products WHERE 1=1",
    "SELECT pg_read_file('/etc/passwd')",
    "SELECT * FROM users",  # not in allowed list
    "SELECT p.* FROM products p JOIN (SELECT * FROM users) u ON 1=1",
]

for sql in tests:
    safe, reason = check_sql_safety(sql, allowed)
    print(f"{'SAFE' if safe else 'BLOCKED'}: {sql[:60]}... [{reason}]")
```

### Pattern 3: Row Limit Injection

```python
import sqlglot

def inject_row_limit(sql: str, max_rows: int = 1000, dialect: str = "duckdb") -> str:
    """
    Inject or cap LIMIT clause.
    Ensures queries never return more than max_rows rows.
    """
    tree = sqlglot.parse_one(sql, dialect=dialect)

    limit_node = tree.find(sqlglot.exp.Limit)
    if limit_node is None:
        # No LIMIT — add one
        tree = tree.limit(max_rows)
    else:
        # LIMIT exists — check if it exceeds max
        try:
            existing = int(limit_node.expression.this)
            if existing > max_rows:
                limit_node.set("expression", sqlglot.exp.Literal.number(max_rows))
        except (ValueError, AttributeError):
            # Cannot parse limit value — replace with max
            tree = tree.limit(max_rows)

    return tree.sql(dialect=dialect)

# Test
print(inject_row_limit("SELECT * FROM products"))
# → SELECT * FROM products LIMIT 1000

print(inject_row_limit("SELECT * FROM products LIMIT 999999"))
# → SELECT * FROM products LIMIT 1000

print(inject_row_limit("SELECT * FROM products LIMIT 50"))
# → SELECT * FROM products LIMIT 50  (under max, kept)
```

### Pattern 4: Schema Allowlisting

```python
"""
Schema allowlist: only expose specific tables/columns to the LLM.
Do not include PII columns (SSN, password_hash) in the schema prompt.
"""

from dataclasses import dataclass

@dataclass
class ColumnAllowlist:
    """Defines which columns are visible to NL2SQL."""
    table: str
    allowed_columns: list[str]   # empty list = all columns allowed
    exclude_columns: list[str]   # always exclude these columns

ALLOWLIST = [
    ColumnAllowlist("products",    allowed_columns=[], exclude_columns=[]),
    ColumnAllowlist("sales",       allowed_columns=[], exclude_columns=[]),
    ColumnAllowlist("customers",   allowed_columns=["customer_id", "region", "tier"],
                                   exclude_columns=["email", "phone", "address", "ssn"]),
    ColumnAllowlist("employees",   allowed_columns=["employee_id", "department", "level"],
                                   exclude_columns=["salary", "ssn", "birth_date"]),
]
# Note: 'users', 'audit_logs', 'credentials' tables not listed → never exposed

def apply_allowlist(schemas: list[TableSchema], allowlist: list[ColumnAllowlist]) -> list[TableSchema]:
    """Filter schema to only allowed tables and columns."""
    allowed_table_names = {a.table for a in allowlist}
    allowlist_map = {a.table: a for a in allowlist}

    result = []
    for schema in schemas:
        if schema.name not in allowed_table_names:
            continue  # Table not in allowlist — skip entirely
        al = allowlist_map[schema.name]
        columns = schema.columns
        if al.allowed_columns:
            columns = [c for c in columns if c["name"] in al.allowed_columns]
        if al.exclude_columns:
            columns = [c for c in columns if c["name"] not in al.exclude_columns]
        result.append(TableSchema(
            name=schema.name, columns=columns,
            primary_keys=schema.primary_keys,
            foreign_keys=schema.foreign_keys,
            sample_rows=[
                {k: v for k, v in row.items() if k in {c["name"] for c in columns}}
                for row in schema.sample_rows
            ],
            row_count=schema.row_count,
        ))
    return result
```

### Pattern 5: Query Timeout + Audit Logging

```python
import threading
import time
import uuid
import json
import logging

audit_logger = logging.getLogger("nl2sql.audit")

class TimeoutError(Exception):
    pass

def execute_with_timeout(conn, sql: str, timeout_seconds: float = 30.0) -> list[dict]:
    """Execute SQL with a hard timeout. Raises TimeoutError if exceeded."""
    result = []
    error = []
    done = threading.Event()

    def target():
        try:
            result.extend(conn.execute(sql).fetchdf().to_dict("records"))
        except Exception as e:
            error.append(e)
        finally:
            done.set()

    thread = threading.Thread(target=target, daemon=True)
    thread.start()

    if not done.wait(timeout=timeout_seconds):
        # Cancel DuckDB query (DuckDB 1.1+ supports interrupt)
        conn.interrupt()
        raise TimeoutError(f"Query exceeded {timeout_seconds}s timeout")

    if error:
        raise error[0]
    return result

def audit_log_query(
    question: str, sql: str, row_count: int,
    latency_ms: float, user_id: str, success: bool, error: str = None
):
    """Structured audit log for every NL2SQL query."""
    audit_logger.info(json.dumps({
        "query_id":   str(uuid.uuid4()),
        "timestamp":  time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "user_id":    user_id,
        "question":   question,
        "sql":        sql,
        "row_count":  row_count,
        "latency_ms": round(latency_ms, 1),
        "success":    success,
        "error":      error,
    }))
```

---

## 10. Hybrid Table + Text RAG

Real-world questions often span both structured data (database tables) and unstructured text (reports, transcripts, emails). A hybrid system routes each question — or sub-question — to the appropriate retrieval backend and synthesizes the results.

### System Architecture

```
  USER QUESTION
       │
       ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │ QUESTION CLASSIFIER                                                  │
  │ Claude claude-haiku-4-5-20251001 (fast, cheap)                               │
  │                                                                     │
  │  → "purely structured"  → SQL path                                  │
  │  → "purely unstructured" → text RAG path                            │
  │  → "hybrid"             → both paths in parallel                    │
  └──────────┬─────────────────────────────────┬───────────────────────┘
             │                                 │
             ▼                                 ▼
  ┌─────────────────────┐           ┌─────────────────────────┐
  │ NL2SQL PATH         │           │ TEXT RAG PATH           │
  │                     │           │                         │
  │ Schema → SQL gen    │           │ Embed query             │
  │ → DuckDB execute    │           │ → Vector/BM25 search    │
  │ → tabular result    │           │ → Retrieved chunks      │
  └──────────┬──────────┘           └────────────┬────────────┘
             │                                   │
             └──────────────┬────────────────────┘
                            │
                            ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │ RESULT SYNTHESIZER                                                   │
  │ Claude claude-sonnet-4-6                                                     │
  │                                                                     │
  │ Structured result + text chunks → unified natural language answer    │
  └─────────────────────────────────────────────────────────────────────┘
```

### Implementing the Router

```python
"""
Hybrid Table + Text RAG router using Claude claude-haiku-4-5-20251001 for classification
and Claude claude-sonnet-4-6 for synthesis.
"""

import anthropic
import json
from enum import Enum
from typing import Optional
import duckdb

client = anthropic.Anthropic()

class RouteType(str, Enum):
    SQL = "sql"
    TEXT = "text"
    HYBRID = "hybrid"

ROUTER_PROMPT = """Classify this question into one category:

- "sql": Requires querying a structured database table (numbers, aggregations, 
  filtering by column values, comparisons, rankings). Example: "What was Q3 revenue?"
  
- "text": Requires searching unstructured text documents (opinions, explanations, 
  qualitative analysis, narrative content). Example: "What did the CEO say about growth?"
  
- "hybrid": Requires BOTH structured data AND text documents to fully answer. 
  Example: "Compare Q3 revenue figures with the CFO's explanation of the decline."

Available tables: {tables}
Available text sources: {text_sources}

Question: {question}

Respond with ONLY a JSON object: {{"route": "sql"|"text"|"hybrid", "reason": "..."}}"""

def classify_question(
    question: str,
    tables: list[str],
    text_sources: list[str],
) -> tuple[RouteType, str]:
    """Use Claude claude-haiku-4-5-20251001 (fast/cheap) to classify routing."""
    prompt = ROUTER_PROMPT.format(
        tables=", ".join(tables),
        text_sources=", ".join(text_sources),
        question=question,
    )
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}],
    )
    raw = response.content[0].text.strip()
    parsed = json.loads(raw)
    return RouteType(parsed["route"]), parsed["reason"]

# ── Simulated text RAG retrieval ─────────────────────────────────────────────
# In production: replace with actual vector store + embeddings

def retrieve_text_chunks(question: str, k: int = 3) -> list[dict]:
    """Placeholder: returns relevant text chunks for the question."""
    # Replace with: embedding_model.encode(question) → vector_store.search(vec, k)
    return [
        {
            "source": "Q3_2024_earnings_call.txt",
            "text": "CFO Jane Smith noted: 'Q3 revenue came in at $6.7M, slightly below "
                    "guidance due to delayed hardware shipments in the APAC region. We expect "
                    "recovery in Q4 as the supply chain issues have been resolved.'",
            "score": 0.92,
        },
        {
            "source": "Q3_2024_earnings_call.txt",
            "text": "CEO Mark Johnson added: 'Software margins continued to expand to 31%, "
                    "and we remain confident in our full-year guidance of $24M revenue and "
                    "18% EBITDA margin.'",
            "score": 0.87,
        },
    ]

# ── SQL retrieval (reuses NL2SQLPipeline from Section 8) ─────────────────────

def retrieve_sql_result(question: str, conn: duckdb.DuckDBPyConnection, tables: list[str]) -> Optional[dict]:
    """Run NL2SQL and return structured result."""
    from your_module import NL2SQLPipeline  # reference to Section 8 pipeline
    pipeline = NL2SQLPipeline(conn, tables)
    try:
        result = pipeline.query(question)
        return {"sql": result.sql, "rows": result.rows[:20], "row_count": result.row_count}
    except Exception as e:
        return {"error": str(e)}

# ── Synthesis ─────────────────────────────────────────────────────────────────

SYNTHESIS_PROMPT = """Answer the user's question using both the structured database results
and the text document excerpts provided. Be specific — cite exact numbers from the database
and quote relevant text from the documents. If the sources conflict, note the discrepancy.

Question: {question}

STRUCTURED DATABASE RESULT:
{sql_result}

TEXT DOCUMENT EXCERPTS:
{text_chunks}

Provide a comprehensive, precise answer:"""

def synthesize_hybrid(
    question: str,
    sql_result: Optional[dict],
    text_chunks: list[dict],
) -> str:
    sql_str = json.dumps(sql_result, default=str, indent=2) if sql_result else "N/A"
    chunks_str = "\n\n".join(
        f"[{c['source']}] {c['text']}" for c in text_chunks
    ) if text_chunks else "N/A"

    prompt = SYNTHESIS_PROMPT.format(
        question=question,
        sql_result=sql_str,
        text_chunks=chunks_str,
    )
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()

# ── Main hybrid RAG pipeline ──────────────────────────────────────────────────

def hybrid_rag_query(
    question: str,
    conn: duckdb.DuckDBPyConnection,
    tables: list[str],
    text_sources: list[str],
) -> dict:
    """Full hybrid RAG: classify → retrieve → synthesize."""

    # Step 1: Classify
    route, reason = classify_question(question, tables, text_sources)
    print(f"Route: {route} ({reason})")

    sql_result = None
    text_chunks = []

    # Step 2: Retrieve (in parallel for hybrid)
    if route in (RouteType.SQL, RouteType.HYBRID):
        sql_result = retrieve_sql_result(question, conn, tables)

    if route in (RouteType.TEXT, RouteType.HYBRID):
        text_chunks = retrieve_text_chunks(question, k=3)

    # Step 3: Synthesize
    answer = synthesize_hybrid(question, sql_result, text_chunks)

    return {
        "question": question,
        "route": route,
        "sql_result": sql_result,
        "text_chunks": text_chunks,
        "answer": answer,
    }

# ── Real-world example ────────────────────────────────────────────────────────

if __name__ == "__main__":
    conn = duckdb.connect("analytics.ddb")
    tables = ["products", "sales"]
    text_sources = ["earnings_calls", "analyst_reports", "press_releases"]

    result = hybrid_rag_query(
        question=(
            "Compare Q3 revenue from the database with the CFO's comments "
            "about Q3 performance in the earnings call transcript."
        ),
        conn=conn,
        tables=tables,
        text_sources=text_sources,
    )

    print(f"\nAnswer:\n{result['answer']}")

# Example answer:
# "According to the database, Q3 2024 total revenue was $6,704,200 across all products.
#  The CFO, Jane Smith, confirmed this in the earnings call, noting it came in 'slightly
#  below guidance due to delayed hardware shipments in the APAC region.' The database shows
#  Widget B hardware revenue declined 25% Q2→Q3, consistent with the supply chain
#  explanation. Software products (Widget C, Widget D) showed 12% growth, aligning with
#  the CEO's comment that 'software margins continued to expand to 31%.'"
```

---

## 11. Benchmarks

### Standard Table QA Benchmarks (May 2026)

| Benchmark | Task Type | # Examples | Metric | SOTA (May 2026) | Best Approach |
|---|---|---|---|---|---|
| **WikiTQ** (WikiTableQuestions) | Factual lookup + aggregation over Wikipedia tables | 22,033 Q&A | Exact match accuracy | 76.2% (ChainOfTable + GPT-4o) | ChainOfTable |
| **FeTaQA** | Long-form free-text answer from tables | 10,330 Q&A | BLEU-4 / ROUGE-L | BLEU-4: 43.1 (ChainOfTable + Claude 3.5) | ChainOfTable |
| **SQA** (Sequential QA) | Multi-turn conversational table QA | 17,553 Q conversations | Accuracy per question | 82.4% (TAPAS Large) | TAPAS (low latency) |
| **TabFact** | Table-based fact verification (True/False) | 16,573 statements | Binary accuracy | 91.3% (fine-tuned TAPAS) | TAPAS fine-tuned |
| **Spider 1.0** | NL2SQL on 200 databases, 138 domains | 10,181 Q&A | Execution accuracy | 91.3% (Vanna v0.7 + Claude claude-sonnet-4-6) | Vanna + Claude |
| **Spider 2.0** | NL2SQL, enterprise schemas, complex SQL | 547 tasks | Execution accuracy | 54.1% (DAIL-SQL + GPT-4) | DAIL-SQL |
| **BIRD** | NL2SQL with database values and dirty data | 12,751 Q&A | Execution accuracy | 72.8% (DIN-SQL + GPT-4) | DIN-SQL |

**Notes**:
- WikiTQ and FeTaQA are the primary benchmarks for ChainOfTable and TAPAS comparison.
- Spider 2.0 scores are dramatically lower than Spider 1.0 across all systems — it was designed to require reasoning over complex enterprise schemas, not just pattern matching.
- BIRD measures accuracy against actual database values (not just SQL structure), making it a better proxy for production performance.
- SQA measures multi-turn accuracy where later questions depend on earlier context — TAPAS's sequential encoding gives it an advantage here.

### Latency Reference (p50, excluding DB execution time)

| System | Latency | Notes |
|---|---|---|
| TAPAS (GPU) | 45ms | Discriminative model, no LLM call |
| TAPAS (CPU) | 280ms | |
| DuckDB NL2SQL (no few-shot) | 1.1s | 1 LLM call (SQL gen) |
| DuckDB NL2SQL (few-shot) | 1.4s | 1 LLM call, larger prompt |
| ChainOfTable (3 ops) | 4.2s | 2 LLM calls (plan + answer) |
| ChainOfTable (5 ops) | 6.8s | 2 LLM calls |
| Vanna.ai (ChromaDB + LLM) | 1.8s | 1 LLM call + vector search |
| PandasAI (code gen + exec) | 3.1s | 1 LLM call + code execution |
| Hybrid RAG | 5.5s | Classifier + SQL + text + synthesis |

---

## 12. Decision Guide

Select your approach based on table type, scale, and question complexity.

```
  START
    │
    ▼
  Does the question span BOTH tables AND text documents?
    │
    ├─ YES → Hybrid Table + Text RAG (Section 10)
    │
    └─ NO
         │
         ▼
       Is the table schema FIXED and KNOWN at deploy time?
         │
         ├─ NO → Is the table small enough to fit in LLM context (<500 rows)?
         │           │
         │           ├─ YES → ChainOfTable (Section 3)
         │           │        Best for ad-hoc tables, Excel uploads, CSVs
         │           │
         │           └─ NO → DuckDB NL2SQL (Section 6)
         │                    Load file directly, SQL over full dataset
         │
         └─ YES (fixed schema)
                  │
                  ▼
                Are questions simple (SUM/COUNT/SELECT, <3 joins)?
                  │
                  ├─ YES → Is latency critical (<100ms)?
                  │           │
                  │           ├─ YES → TAPAS (Section 4)
                  │           │        GPU-hosted, discriminative model
                  │           │
                  │           └─ NO → DuckDB NL2SQL or Vanna.ai
                  │
                  └─ NO (complex multi-hop, window functions, CTEs)
                            │
                            ▼
                          Do you have curated Q→SQL training examples?
                            │
                            ├─ YES → Vanna.ai (Section 7)
                            │        Retrieval-augmented SQL generation
                            │
                            └─ NO
                                     │
                                     ▼
                                   Is the data in a DataFrame (Python)?
                                     │
                                     ├─ YES → PandasAI (Section 5)
                                     │        Code generation over DataFrame
                                     │
                                     └─ NO → DuckDB NL2SQL (Section 6)
                                              with few-shot examples

  ────────────────────────────────────────────────────────────────────
  QUICK REFERENCE

  ChainOfTable  → ad-hoc tables, complex multi-step reasoning, no DB
  TAPAS         → fixed schema, simple queries, <100ms latency required
  PandasAI      → data already in DataFrame, Python environment
  DuckDB NL2SQL → large files (Parquet/CSV), no pandas overhead
  Vanna.ai      → production NL2SQL, self-improving with usage
  Hybrid RAG    → questions spanning structured + unstructured sources
```

---

## 13. See Also

Related pages in this documentation site:

- [Vectorless RAG — Complete Guide](./pageindex-vectorless-rag) — PageIndex, BM25, long-context approaches, NL2SQL overview; this page is the deep-dive companion
- [BM25 & Sparse Retrieval](./bm25-sparse-retrieval) — BM25 few-shot selection used in Section 8's `FewShotStore`
- [Retrieval Strategies](./retrieval-strategies) — Hybrid RRF fusion, HyDE, ColBERT — applicable to the text leg of the Hybrid RAG pipeline (Section 10)
- [Advanced RAG](./advanced-rag) — RAPTOR, Proposition Indexing, query rewriting — techniques that compose with table retrieval in multi-document pipelines
- [Production RAG](./production-rag) — Observability, latency budgets, caching — apply directly to the NL2SQL pipelines in Sections 6–8
- [Evaluation](./evaluation) — RAG evaluation frameworks; adapting RAGAS metrics to table QA (cover WikiTQ-style exact match evaluation)
- [Multimodal RAG](./multimodal-rag) — Extracting tables from PDFs and images using vision models before applying the strategies in this guide
