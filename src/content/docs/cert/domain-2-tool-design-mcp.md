---
title: "Domain 2: Tool Design & MCP Integration"
description: "18% of the exam. Covers tool descriptions, MCP error handling, tool distribution, tool_choice, and built-in tools."
sidebar:
  order: 2
---

# Domain 2: Tool Design & MCP Integration

## Weight: 18% (~11 questions)

**Appears in Scenarios:** 1 (Customer Support), 3 (Multi-Agent Research), 4 (Developer Productivity)

---

## What This Domain Tests

- Write tool descriptions that enable reliable tool selection
- Implement structured MCP error responses (isError flag, error categories)
- Distribute tools across specialized agents (4–5 tools per agent)
- Configure tool_choice for guaranteed structured output
- Configure MCP servers at project and user scope
- Choose the right built-in tool (Grep vs Glob vs Read vs Edit vs Write vs Bash)

---

## Task Statement 2.1: Tool Descriptions Drive Selection

### Why Descriptions Are Everything

The Claude API constructs a special system prompt from your tool definitions, injected before user messages. **Claude reads tool descriptions to decide which tool to call.** Minimal or ambiguous descriptions = wrong tool selected.

> **Anthropic's guidance:** "Provide extremely detailed descriptions. This is by far the most important factor in tool performance." Aim for at least 3–4 sentences per tool.

### The Problem: Vague Descriptions

```python
# ❌ VAGUE — Claude cannot differentiate these tools
tools = [
    {
        "name": "analyze_content",
        "description": "Analyzes content",          # Too vague!
        "input_schema": {"type": "object", "properties": {"text": {"type": "string"}}}
    },
    {
        "name": "analyze_document",
        "description": "Analyzes a document",       # Nearly identical!
        "input_schema": {"type": "object", "properties": {"text": {"type": "string"}}}
    }
]
# Result: Claude randomly picks between them → 50% misrouting
```

### The Fix: Detailed, Differentiated Descriptions

Every tool description must answer six questions:

```
1. WHAT does it do?           → One clear sentence
2. WHAT INPUT does it expect? → Format, required fields, examples
3. WHAT does it RETURN?       → Output format, fields, types
4. WHEN should you USE it?    → Specific triggering scenarios
5. When should you NOT use it?→ Explicit boundaries with similar tools
6. EXAMPLE queries?           → Concrete phrases that trigger this tool
```

```python
# ✅ DETAILED — Claude knows exactly when to use each
tools = [
    {
        "name": "extract_web_results",
        "description": (
            "Extract and summarize key findings from web search results. "
            "Input: raw HTML or text scraped from a web page. "
            "Output: structured findings with title, key quotes, source URL, "
            "and relevance score (1–5). "
            "Use this for: processing web search output, summarizing news articles, "
            "extracting claims from online sources. "
            "Do NOT use for: analyzing uploaded PDFs, processing local files, "
            "verifying claims against pre-loaded documents, or database queries."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "web_content": {
                    "type": "string",
                    "description": "Raw HTML or text content from a web page"
                },
                "query": {
                    "type": "string",
                    "description": "The original search query for relevance scoring"
                }
            },
            "required": ["web_content"]
        }
    },
    {
        "name": "extract_document_data",
        "description": (
            "Extract structured data points from uploaded documents (PDFs, reports, "
            "spreadsheets, contracts). Input: document text or file path. "
            "Output: structured data with field names, values, page numbers, and "
            "confidence scores (0.0–1.0). "
            "Use this for: processing uploaded PDFs, extracting tables from reports, "
            "pulling specific data points from contracts, analyzing local files. "
            "Do NOT use for: web search results, HTML content, real-time data lookup, "
            "or claim verification."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "document_text": {"type": "string"},
                "fields_to_extract": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Fields to extract e.g. ['total_amount', 'date', 'vendor']"
                }
            },
            "required": ["document_text"]
        }
    }
]
```

### Tool Misrouting Diagnosis Flow

```
Agent calls wrong tool repeatedly?
           │
           ▼
┌──────────────────────────────────────┐
│ STEP 1: Check tool descriptions      │ ← START HERE (lowest effort, highest impact)
│ Are they vague? Do they overlap?     │
│ Do they specify "when NOT to use"?   │
└──────────────────┬───────────────────┘
                   │ Still wrong?
                   ▼
┌──────────────────────────────────────┐
│ STEP 2: Check system prompt          │
│ Are there keyword-sensitive rules    │
│ that override tool descriptions?     │
│ "When user says 'order', always..."  │
└──────────────────┬───────────────────┘
                   │ Still wrong?
                   ▼
┌──────────────────────────────────────┐
│ STEP 3: Add few-shot examples        │
│ Show correct tool choice in context  │
└──────────────────┬───────────────────┘
                   │ Still wrong?
                   ▼
┌──────────────────────────────────────┐
│ STEP 4: Consider splitting or        │
│ renaming tools with unambiguous names│
└──────────────────────────────────────┘

❌ DO NOT jump to: routing classifiers, consolidating tools,
   or adding more instructions without trying descriptions first
```

### Consolidation vs. Splitting — Updated Guidance

> **Important:** Official guidance recommends **consolidating related operations** into fewer tools with an `action` parameter, rather than creating a separate tool per action. Use meaningful namespacing.

```python
# ✅ PREFERRED: One tool, multiple actions (fewer tools = less decision overhead)
{
    "name": "github_pr",
    "description": "Manage GitHub pull requests. Actions: create (opens new PR), "
                   "review (fetches diff and adds review comments), merge (merges an "
                   "approved PR). Each action has different required fields — see "
                   "input_schema for details.",
    "input_schema": {
        "type": "object",
        "properties": {
            "action": {"type": "string", "enum": ["create", "review", "merge"]},
            "pr_number": {"type": "integer", "description": "Required for review and merge"},
            "title": {"type": "string", "description": "Required for create"},
            "body": {"type": "string", "description": "Required for create"},
        },
        "required": ["action"]
    }
}

# ❌ AVOID: Separate tool for every action (creates decision overhead)
# github_create_pr, github_review_pr, github_merge_pr  ← Three nearly identical tools
```

---

## Task Statement 2.2: Structured Error Responses for MCP Tools

### Two Types of MCP Errors — Know the Difference

```
┌─────────────────────────────────────────────────────────────────┐
│              MCP ERROR MECHANISMS                               │
│                                                                 │
│  TYPE 1: PROTOCOL ERRORS (JSON-RPC errors)                     │
│  ────────────────────────────────────────                       │
│  Triggered by: Unknown tool name, invalid JSON-RPC              │
│  Who handles it: MCP client captures and DISCARDS it            │
│  Model sees: NOTHING — these never reach Claude's context       │
│                                                                 │
│  TYPE 2: TOOL EXECUTION ERRORS (isError flag)                  │
│  ──────────────────────────────────────────────                 │
│  Triggered by: Tool logic failure (timeout, bad input, etc.)    │
│  Who handles it: Injected INTO the LLM context window           │
│  Model sees: FULL ERROR — Claude can use it for recovery        │
│                                                                 │
│  ← The exam tests TYPE 2. Always use isError:true for           │
│    tool failures you want Claude to reason about.               │
└─────────────────────────────────────────────────────────────────┘
```

### The isError Flag Pattern

```python
# MCP tool handler — complete pattern
def handle_tool_call(name: str, arguments: dict) -> dict:
    
    if name == "get_customer":
        try:
            customer = db.find_customer(arguments["email"])
            
            if customer:
                # ✅ SUCCESS — found the customer
                return {
                    "content": [{"type": "text", "text": json.dumps(customer)}],
                    "isError": False
                }
            else:
                # ✅ VALID EMPTY RESULT — search worked, no match found
                return {
                    "content": [{"type": "text", "text": json.dumps({
                        "result": "no_match",
                        "message": "No customer found with that email address.",
                        "records_searched": 150000,
                        "suggestion": "Try searching by phone number instead."
                    })}],
                    "isError": False   # NOT an error — search completed successfully
                }

        except DatabaseTimeout:
            # ❌ TRANSIENT FAILURE — search did NOT complete
            return {
                "content": [{"type": "text", "text": json.dumps({
                    "errorCategory": "transient",
                    "isRetryable": True,
                    "message": "Database timeout. Usually resolves within 30 seconds.",
                    "attempted_query": arguments["email"],
                    "partial_results": None,
                    "alternative": "Try phone number lookup via lookup_by_phone tool"
                })}],
                "isError": True   # IS an error — search failed entirely
            }

        except InvalidEmailFormat as e:
            # ❌ VALIDATION FAILURE — bad input
            return {
                "content": [{"type": "text", "text": json.dumps({
                    "errorCategory": "validation",
                    "isRetryable": False,   # Won't succeed with same input
                    "message": f"Invalid email format: {str(e)}",
                    "expected_format": "user@domain.com",
                    "received": arguments["email"]
                })}],
                "isError": True
            }

        except PermissionError:
            # ❌ PERMISSION FAILURE — cannot access
            return {
                "content": [{"type": "text", "text": json.dumps({
                    "errorCategory": "permission",
                    "isRetryable": False,
                    "message": "Access denied to customer database. "
                               "Request requires elevated privileges.",
                    "escalation": "Contact database admin for access"
                })}],
                "isError": True
            }
```

### Access Failure vs. Valid Empty Result — Critical Distinction

```
SCENARIO A: Database timeout (GET request never completed)
  isError: TRUE
  Why: Claude needs to know the search FAILED — it may retry,
       try an alternative, or inform the user of a system issue.

SCENARIO B: Search succeeded, no matching customer found
  isError: FALSE
  Why: Claude needs to know the search SUCCEEDED with zero results —
       it should report "no customer found" (a valid business outcome).

❌ ANTI-PATTERN: Returning both as the same empty result
  return {"content": [{"type": "text", "text": "[]"}], "isError": False}
  ↑ This lies to Claude in scenario A — it thinks the search worked!
```

### Error Categories Reference

| Category | Examples | `isRetryable` | Agent Action |
|---|---|---|---|
| **transient** | DB timeout, rate limit hit, service unavailable | `true` | Retry with exponential backoff |
| **validation** | Invalid email format, missing required field | `false` | Fix the input, then retry |
| **business** | Refund exceeds policy limit, date in the past | `false` | Explain to user or escalate |
| **permission** | Unauthorized, insufficient privileges | `false` | Escalate or use alternative tool |

### Local Recovery Before Propagation

Subagents should handle transient errors locally first, only escalating what they can't resolve:

```python
async def search_with_retry(query: str) -> dict:
    """Subagent-level recovery — 3 attempts with exponential backoff."""
    
    for attempt in range(3):
        try:
            results = await web_search(query)
            return {"success": True, "findings": results}
            
        except Timeout:
            if attempt < 2:
                wait = 2 ** attempt      # 1s, 2s, 4s
                await asyncio.sleep(wait)
                continue
            
            # All 3 attempts failed — propagate with full context
            return {
                "success": False,
                "errorCategory": "transient",
                "message": f"Web search timed out after 3 attempts",
                "attempted_query": query,
                "partial_results": [],
                "alternative": "Try more specific query or document analysis agent",
                "retry_recommended": True
            }
```

### Anti-Patterns in Error Handling

```
❌ ANTI-PATTERN 1: Generic error message
   return {"content": [{"text": "Operation failed"}], "isError": True}
   Problem: Hides what failed — agent cannot make recovery decisions

❌ ANTI-PATTERN 2: Suppress error as success (return empty as success)
   except Timeout:
       return {"content": [{"text": "[]"}], "isError": False}
   Problem: Agent thinks search found nothing, not that it crashed

❌ ANTI-PATTERN 3: Terminate entire workflow on single failure
   if search_agent_failed:
       raise SystemError("Search failed — aborting pipeline")
   Problem: Wastes all partial results from other subagents
```

---

## Task Statement 2.3: Tool Distribution and tool_choice

### The Too-Many-Tools Problem

```
❌ ONE AGENT WITH 18 TOOLS:
┌────────────────────────────────────────────────────────────┐
│ Coordinator: [web_search, fetch_url, read_doc, extract_data│
│  summarize, verify_claim, translate, format_report,        │
│  send_email, create_chart, query_database, update_record,  │
│  schedule_meeting, generate_image, compress_file,          │
│  validate_json, convert_format, notify_slack]              │
└────────────────────────────────────────────────────────────┘
Problems:
  • Claude frequently picks wrong tool (summarize vs extract_data)
  • Parameter hallucination increases
  • ~55K tokens consumed BEFORE conversation starts
  • Response latency grows

✅ DISTRIBUTED ACROSS SPECIALIZED AGENTS:
┌──────────────────────────────────────────────────────────┐
│ Search agent:    [web_search, fetch_url]           2 tools│
│ Analysis agent:  [read_doc, extract_data]          2 tools│
│ Synthesis agent: [summarize, verify_fact, format]  3 tools│
│ Coordinator:     [Agent]                           1 tool │
└──────────────────────────────────────────────────────────┘
Result: Each agent has focused, non-overlapping tools → high accuracy
```

### Tool Search — New Capability

When tool definitions exceed ~10K tokens, Claude Code auto-defers loading with `defer_loading: true`. The **Tool Search** tool (available to Claude) mitigates large tool sets:

```
WITHOUT Tool Search (18 tools loaded upfront):
  Accuracy: ~49%
  Token overhead: ~77K tokens before conversation

WITH Tool Search (tools loaded on demand):
  Accuracy: ~74%   (+25 percentage points)
  Token overhead: ~8.7K tokens   (85% reduction)
```

### Scoped Cross-Role Tools

Synthesis agents occasionally need fact verification. Give them a scoped version, not the full web search:

```python
# ❌ WRONG — Full web_search in synthesis agent
synthesis_agent = {
    "tools": ["summarize", "verify_claim", "web_search"],  # Too broad
}

# ✅ CORRECT — Scoped verify_fact tool (limited to quick fact checks)
synthesis_agent = {
    "tools": ["summarize", "verify_claim", "verify_fact"],
    # verify_fact: checks simple facts (dates, names, statistics)
    # Complex verifications still go through coordinator → search agent
}
```

### tool_choice — Control Structured Output

```
tool_choice DECISION FLOW:

 Do you need structured output (not freeform text)?
          │
    YES   │    NO
          │
          ▼    ▼
  Do you know         Use tool_choice: "auto"
  which schema        (Claude decides freely)
  to use?
     │
  NO │    YES
     │
     ▼    ▼
  "any"   forced: {"type":"tool","name":"X"}
  (Claude picks   (Must use this specific tool)
   one of the     Use when a specific step
   defined tools) must happen first
```

```python
# "auto" (default) — Claude decides whether to use any tool
response = client.messages.create(
    tools=tools,
    tool_choice={"type": "auto"},  # May return text without calling tools
    messages=messages,
)

# "any" — Claude MUST call a tool, Claude chooses which one
# ← Use this when document type is unknown but structured output required
response = client.messages.create(
    tools=[extract_invoice, extract_receipt, extract_contract],
    tool_choice={"type": "any"},   # Guarantees structured output
    messages=messages,
)

# Forced — Claude MUST call THIS specific tool
# ← Use to ensure a specific step happens first
response = client.messages.create(
    tools=[extract_metadata, enrich_data, validate],
    tool_choice={"type": "tool", "name": "extract_metadata"},
    messages=messages,
)
# Next API call uses "auto" to let Claude decide the next step
```

### tool_choice Quick Reference

| Value | Claude Does | When to Use |
|---|---|---|
| `"auto"` | Freely decides (may skip tools entirely) | General agentic loops |
| `"any"` | Must call a tool — picks which one | Unknown doc type, need structured output guaranteed |
| `{"type":"tool","name":"X"}` | Must call tool X specifically | Required pipeline step (extract before enrich) |

---

## Task Statement 2.4: MCP Server Integration

### MCP Architecture Diagram

```
                    MODEL CONTEXT PROTOCOL (MCP) ARCHITECTURE
                    ─────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────┐
  │                     CLAUDE CODE / CLIENT                         │
  │                                                                  │
  │  ┌─────────────────────────────────────────────────────────┐    │
  │  │  MCP Client (built into Claude Code)                    │    │
  │  │  - Manages connections to MCP servers                   │    │
  │  │  - Exposes server capabilities as tools                 │    │
  │  │  - Handles OAuth for external services                  │    │
  │  └───────────────────────┬─────────────────────────────────┘    │
  └──────────────────────────┼───────────────────────────────────────┘
                             │  JSON-RPC over stdio/SSE/HTTP
                             │
          ┌──────────────────┼──────────────────────┐
          │                  │                      │
          ▼                  ▼                      ▼
  ┌──────────────┐  ┌──────────────┐      ┌──────────────────┐
  │ MCP Server 1 │  │ MCP Server 2 │  ... │  MCP Server N    │
  │  (filesystem)│  │  (database)  │      │  (custom tools)  │
  │              │  │              │      │                  │
  │  Resources:  │  │  Tools:      │      │  Prompts:        │
  │  - files     │  │  - query     │      │  - templates     │
  │  - dirs      │  │  - execute   │      │  - workflows     │
  │              │  │  - schema    │      │                  │
  └──────────────┘  └──────────────┘      └──────────────────┘
          │                  │                      │
          ▼                  ▼                      ▼
  Local filesystem    PostgreSQL DB          GitHub API, etc.


MCP Capabilities:
  TOOLS      = functions Claude can call (side effects OK)
  RESOURCES  = read-only data sources (files, DB records, URIs)
  PROMPTS    = reusable prompt templates the client can request

Configuration (.mcp.json):
  {
    "mcpServers": {
      "filesystem": {
        "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/src"],
        "type": "stdio"
      },
      "postgres": {
        "command": "npx", "args": ["-y", "@modelcontextprotocol/server-postgres"],
        "env": {"DATABASE_URL": "postgresql://localhost/mydb"},
        "type": "stdio"
      }
    }
  }
```

### Configuration Scopes

```
SCOPE HIERARCHY:
  User-level  → ~/.claude.json or ~/.claude/settings.local.json
  Project-level → .mcp.json in repository root (shared via git)

WHICH TO USE:
  Project-level: Team integrations (GitHub, Jira, Postgres, Slack)
  User-level: Personal/experimental servers, dev credentials
```

**Project-level `.mcp.json`** — shared with entire team via version control:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "jira": {
      "command": "npx",
      "args": ["-y", "mcp-server-jira"],
      "env": {
        "JIRA_API_TOKEN": "${JIRA_API_TOKEN}",
        "JIRA_BASE_URL": "${JIRA_BASE_URL:-https://mycompany.atlassian.net}"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["mcp-server-postgres"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

**User-level** — personal, not committed to git:

```json
{
  "mcpServers": {
    "my-experimental-server": {
      "command": "python",
      "args": ["/home/user/experiments/my-mcp-server.py"],
      "env": {
        "DEBUG": "true"
      }
    }
  }
}
```

### Environment Variable Expansion

```json
"env": {
  "API_KEY": "${API_KEY}",              // Must be set — fails if missing
  "BASE_URL": "${BASE_URL:-https://api.default.com}",  // Uses default if not set
  "TIMEOUT": "${TIMEOUT:-30}"          // Default 30 seconds
}
```

- `${VAR}` — Reads environment variable. **Fails if unset.** Keeps secrets out of version control.
- `${VAR:-default}` — Uses `VAR` if set, otherwise uses `default`. Safe fallback.

### MCP Resources vs. Tools

```
MCP TOOLS                          MCP RESOURCES
─────────────────────────────────  ──────────────────────────────────
Execute actions                    Expose read-only context data
Model-controlled                   Application-controlled
Claude decides when to call        Loaded automatically into context
Examples:                          Examples:
  create_ticket                      Database schema catalog
  send_email                         API documentation hierarchy
  query_database                     Issue summary templates
  update_record

WITHOUT resources:                 WITH resources:
  Agent: "What tables exist?"        Agent already knows schema
  → calls list_tables()              → 0 exploratory calls needed
  Agent: "What columns?"
  → calls describe_table("users")
  (3 tool calls just to understand
   the schema before real work)
```

### Enhancing MCP Tool Descriptions

If Claude prefers built-in tools (Grep) over a more capable MCP tool, the MCP tool description isn't detailed enough:

```python
# ❌ MINIMAL — Claude ignores this and uses Grep instead
@mcp.tool()
def search_codebase(query: str):
    """Search the codebase."""

# ✅ DETAILED — Claude understands this is superior to Grep
@mcp.tool()
def search_codebase(query: str):
    """Search the codebase using semantic code search with AST-aware indexing.
    
    Unlike Grep (which does text pattern matching), this tool:
    - Understands code structure: finds function implementations, not just strings
    - Supports natural language: 'find all error handlers for database timeouts'
    - Returns ranked results with surrounding context (function signatures, class hierarchy)
    - Handles renamed symbols (finds usages even after refactoring)
    
    Input: Natural language description or code pattern
    Output: Ranked list of code locations with full context
    
    Use INSTEAD OF Grep when: understanding code semantics, not just finding strings.
    Use Grep when: searching for exact string patterns in files."""
```

---

## Task Statement 2.5: Built-in Tools Reference

### Tool Selection Decision Tree

```
What do I need to do?
│
├─► FIND FILES by name or extension pattern
│   Example: "All test files in the project"
│   → Use GLOB  (searches file names/paths)
│   → Glob("**/*.test.tsx")
│
├─► FIND CODE inside files by content
│   Example: "Where is processRefund called?"
│   → Use GREP  (searches file contents)
│   → Grep("processRefund")
│
├─► READ a file's full contents
│   Example: "What's in config.py?"
│   → Use READ
│
├─► CHANGE specific lines in a file
│   Example: "Change MAX_RETRIES from 3 to 5"
│   → Use EDIT  (targeted change via unique text match)
│   → If text not unique → fall back to READ + WRITE
│
├─► COMPLETELY REWRITE a file
│   Example: "Replace this entire config file"
│   → Use WRITE
│
└─► RUN a shell command
    Example: "Run the test suite"
    → Use BASH
```

### Grep vs. Glob — The Most Common Confusion

```
GREP — Searches INSIDE files for content patterns
─────────────────────────────────────────────────
Grep("processRefund")
→ Returns: Lines that CONTAIN "processRefund" with file paths + line numbers
→ Use when: "Where is this function/variable used?"

GLOB — Searches for files by NAME/PATH pattern
───────────────────────────────────────────────
Glob("**/*.test.tsx")
→ Returns: File paths that MATCH the name pattern
→ Use when: "Find all test files" or "Find files named X"

EXAM TRAP: "Search for all usages of calculateTax function"
→ Answer: GREP (searching file contents, not file names)

EXAM TRAP: "Find all TypeScript configuration files"
→ Answer: GLOB (searching by file name pattern *.tsconfig.json)
```

### Edit Tool Failure → Read + Write Fallback

```python
# Edit tool works by matching a UNIQUE string in the file
Edit(
    file="config.py",
    old_str="MAX_RETRIES = 3",   # Must be unique in the file
    new_str="MAX_RETRIES = 5"
)

# ❌ Edit FAILS if "MAX_RETRIES = 3" appears multiple times
# → Edit requires uniqueness to know which occurrence to change

# ✅ FALLBACK: Read → modify in memory → Write
content = Read("config.py")
# Modify the specific occurrence you need
modified = content.replace("MAX_RETRIES = 3", "MAX_RETRIES = 5", 1)
Write("config.py", modified)
```

### Incremental Codebase Understanding

```
❌ WRONG: Read all 50 files upfront
   → Overwhelms context window immediately
   → Most content never relevant to the actual task

✅ CORRECT: Build understanding step by step

  Step 1: GREP for entry points
    Grep("def main") → finds src/app.py, src/cli.py

  Step 2: READ entry points to understand structure
    Read("src/app.py") → sees imports from auth, database, api

  Step 3: GREP to trace specific flows
    Grep("from auth import") → finds all files using auth module

  Step 4: READ specific files to follow the flow
    Read("src/auth/middleware.py") → understands auth flow

  This builds a targeted mental model without wasting context.
```

---

## Task Statement 2.5b: Advanced MCP Features (2026)

### MCP Elicitation — Servers Can Request User Input

Introduced in **v2.1.76**, MCP Elicitation allows an MCP server to pause a tool call and request additional information directly from the user (not Claude). This enables interactive workflows without breaking the agentic loop.

**How it works:**
1. Server sends `elicitation/create` request with a schema for the required input
2. Claude Code presents a dialog to the user
3. User fills in the form and submits
4. Result is passed back to the tool execution

**Server-side configuration** (`plugin.json` or direct):
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["server.js"],
      "allowElicitation": true
    }
  }
}
```

**Use cases:** OAuth credential capture, environment selection dialogs, confirmation prompts, and disambiguation when the server needs human judgment to proceed.

### MCP Tool Result Size Override

Introduced in **v2.1.91**, servers can override the default result size limit (32K chars) per-result by setting `_meta["anthropic/maxResultSizeChars"]` — up to **500,000 characters**.

```python
# MCP server returning a large result with override
return {
    "content": [{"type": "text", "text": large_document_content}],
    "_meta": {
        "anthropic/maxResultSizeChars": 500000  # Override up to 500K chars
    },
    "isError": False
}
```

**Use cases:** Full source file dumps, large API responses, complete database exports where truncation would break downstream processing.

> **Exam fact:** The default limit is ~32K characters. Without `_meta` override, results larger than the limit are silently truncated before Claude sees them.

---

## Practice Questions — Domain 2

### Question 1
Your agent has tools `get_customer` (description: "Retrieves customer information") and `lookup_order` (description: "Retrieves order details"). Logs show `get_customer` called when user asks "check my order #12345." What is the most effective first step?

**A)** Add few-shot examples showing correct tool selection  
**B)** Expand each tool's description to include input format, example queries, edge cases, and explicit "when NOT to use" boundaries  
**C)** Build a routing layer that parses user input and pre-selects the correct tool  
**D)** Consolidate both tools into a single `lookup_entity` tool  

**Correct Answer: B**  
Tool descriptions are the primary mechanism for tool selection. Expanding descriptions is the lowest-effort, highest-leverage fix. A adds token overhead without fixing root cause. C is over-engineered for what's a description problem. D requires more work than a "first step" and hides the original issue.

---

### Question 2
Your web search subagent times out during a research pipeline. You need to design how this failure flows back to the coordinator. Which approach enables the best recovery?

**A)** Return structured error context including failure type, attempted query, partial results, and alternative approaches  
**B)** Retry with exponential backoff, returning generic "search unavailable" after all retries fail  
**C)** Return an empty result set marked as successful (`isError: false`)  
**D)** Propagate the timeout exception to terminate the entire workflow  

**Correct Answer: A**  
Structured error context gives the coordinator everything needed for intelligent recovery — retry with different query, use alternative tool, or synthesize with partial results. B hides context after retries. C lies to the coordinator (claims success on failure). D kills the entire pipeline, discarding all partial results.

---

### Question 3
You need Claude to extract data from an unknown document type (invoice, receipt, or contract — each with a different schema). How should you configure tool_choice?

**A)** `"auto"` — let Claude decide which schema to use  
**B)** `"any"` — guarantee Claude calls an extraction tool, let it pick the matching schema  
**C)** `{"type": "tool", "name": "extract_invoice"}` — always extract as invoice first  
**D)** Don't set tool_choice — add instructions in the system prompt  

**Correct Answer: B**  
`"any"` guarantees Claude calls a tool (structured output guaranteed) but lets it choose which extraction schema fits the document. `"auto"` might return freeform text instead of structured data. C assumes invoice format regardless of actual document type. D is probabilistic.

---

## Quick Reference — Domain 2 Cheat Sheet

| Concept | Key Fact |
|---|---|
| **Tool descriptions** | Primary mechanism for tool selection. Detailed > minimal. |
| **Description components** | Purpose, input, output, when to use, when NOT to use |
| **Misrouting fix order** | Descriptions first → system prompt → few-shot → rename |
| **Consolidation guidance** | Prefer fewer tools with action parameters (github_pr + action) |
| **Protocol errors** | JSON-RPC errors — discarded, model never sees them |
| **Tool execution errors** | `isError: true` — injected into context, Claude reasons about them |
| **isError: true** | Failure — search/action did NOT complete |
| **isError: false** | Success (even if result is empty — e.g., "no match found") |
| **Error categories** | transient (retry), validation (fix input), business, permission |
| **isRetryable field** | `true` for transient, `false` for validation/business/permission |
| **Local recovery** | Subagents retry transient errors internally before propagating |
| **Too many tools** | >20 tools degrades accuracy — distribute across specialized agents |
| **Tool Search** | Auto-defers loading >10K tokens. 49% → 74% accuracy improvement. |
| **tool_choice: "auto"** | Claude decides freely, may skip tools |
| **tool_choice: "any"** | Must call a tool, Claude picks which |
| **tool_choice: forced** | Must call named specific tool |
| **MCP project scope** | `.mcp.json` — shared via version control |
| **MCP user scope** | `~/.claude.json` — personal, not committed |
| **${VAR} expansion** | Reads env var. Fails if unset. |
| **${VAR:-default}** | Reads env var with fallback default value |
| **MCP resources** | Read-only context data — reduces exploratory tool calls |
| **MCP Elicitation** | v2.1.76: server requests user input mid-execution via `elicitation/create`; `allowElicitation: true` in server config |
| **Tool result size override** | v2.1.91: server sets `_meta["anthropic/maxResultSizeChars"]` up to 500K chars per result |
| **HTTP hook type** | v2.1.63: POSTs JSON payload to local/remote endpoint; use for SIEM, audit trails |
| **Community servers** | Use for: GitHub, Jira, Slack, Postgres |
| **Custom servers** | Build for team-specific workflows only |
| **Grep** | Search file CONTENTS for patterns |
| **Glob** | Find files by NAME/extension patterns |
| **Edit failure** | Text not unique → fall back to Read + Write |
| **Incremental exploration** | Grep → Read → Grep → Read. Not read-all-upfront. |
