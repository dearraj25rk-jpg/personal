---
title: Context Window Architecture — Complete Reference
description: >
  Complete reference for Claude Code context window architecture — window composition anatomy,
  200K vs 1M context windows, compaction trigger mechanics, context budget configuration,
  token measurement with /context, ToolSearch deferred loading, and cost calculations.
  Claude Code v2.1.126 (May 2026).
sidebar:
  order: 25
  label: Context Window Guide
lastUpdated: 2026-06-04
---

# Context Window Architecture — Complete Reference

> **Version:** v2.1.126 (May 19, 2026) · Documentation updated June 2026

---

## 1. What the Context Window Is

The context window is Claude Code's **working memory**. It is the totality of text, tokens, and structured data that the model can "see" at any given moment during a session. Everything that influences Claude's responses — your instructions, your code files, your conversation history, tool schemas, rules, skills, and memory files — must be present inside the context window to have any effect.

This is not a metaphor. The model has no persistent internal state between API calls. Every time you press Enter, Claude Code assembles the context window from scratch, sends it to the Anthropic API, receives a response, and updates its internal state. The model retains nothing between calls except what is explicitly placed back into the window.

**The direct consequence:** if a file is not read into the context window, Claude cannot "know" it exists. If a rule file has not been loaded, the rule has no effect. If a CLAUDE.md was written after the session started but before the relevant tool call, whether Claude sees it depends entirely on whether the file was loaded in that turn.

### Why This Matters Practically

```
┌─────────────────────────────────────────────────────────────────┐
│              THE CONTEXT WINDOW = WHAT CLAUDE KNOWS             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   Your entire codebase:   OUTSIDE the window (until read)        │
│   A CLAUDE.md file:       OUTSIDE the window (until loaded)      │
│   A rules/*.md file:      OUTSIDE the window (until matched)     │
│   Your git history:       OUTSIDE the window (until fetched)     │
│   Web search results:     OUTSIDE the window (until fetched)     │
│                                                                   │
│   Once read via a tool:   INSIDE the window (costs tokens)       │
│   System prompt:          ALWAYS INSIDE (costs tokens always)    │
│   Loaded CLAUDE.md:       ALWAYS INSIDE (costs tokens always)    │
│   Conversation history:   GROWS every turn (costs more tokens)   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

Understanding this model is the prerequisite for every optimization strategy in Claude Code. You cannot "hint" at context that is not loaded. You cannot "tell Claude about" a file without either reading it into context or telling Claude its contents inline.

---

## 2. Context Window Composition Anatomy

The context window is not a flat list of text. It is a carefully ordered sequence of blocks, each loaded from a different source, each costing tokens, each with different timing and caching properties.

### The 12-Block Context Window (v2.1.126)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║               CLAUDE CODE CONTEXT WINDOW — BLOCK ORDER                       ║
║               (Top = First in window = Highest precedence)                   ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  BLOCK 1: SYSTEM PROMPT                                  ~3,100 tokens       ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  Claude Code's internal instructions: tool documentation stubs, agentic     ║
║  behavior rules, safety guidelines, output formatting preferences.           ║
║  Managed entirely by Claude Code — you cannot edit this directly.            ║
║  Cached: YES (prompt cache hit on most requests)                             ║
║                                                                              ║
║  BLOCK 2: EAGER TOOL SCHEMAS                             ~4,800 tokens       ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  Full JSON schemas for the 12 always-loaded built-in tools:                  ║
║  Read, Write, Edit, MultiEdit, Glob, Grep, Bash, TodoRead, TodoWrite,       ║
║  WebFetch, WebSearch, NotebookEdit. These are ALWAYS in context.             ║
║  Cached: YES (stable across turns)                                           ║
║                                                                              ║
║  BLOCK 3: ENTERPRISE CLAUDE.md                           ~0–8,000 tokens     ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  /Library/Application Support/ClaudeCode/CLAUDE.md (macOS)                  ║
║  /etc/claude-code/CLAUDE.md (Linux)                                          ║
║  %PROGRAMDATA%\ClaudeCode\CLAUDE.md (Windows)                                ║
║  Loaded at session start. Cannot be excluded. Highest user-controlled        ║
║  priority. If absent, costs 0 tokens.                                        ║
║  Cached: YES                                                                 ║
║                                                                              ║
║  BLOCK 4: USER CLAUDE.md                                 ~0–4,000 tokens     ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  ~/.claude/CLAUDE.md. Loaded at session start.                               ║
║  Can be excluded via claudeMdExcludes in settings.                           ║
║  @import chains resolved and inlined here.                                   ║
║  Cached: YES (if unchanged)                                                  ║
║                                                                              ║
║  BLOCK 5: PROJECT CLAUDE.md                              ~0–6,000 tokens     ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  <project-root>/CLAUDE.md. Loaded at session start.                         ║
║  Most commonly customized file for per-project instructions.                 ║
║  Cached: YES                                                                 ║
║                                                                              ║
║  BLOCK 6: SUBDIRECTORY CLAUDE.md CHAIN                   ~0–3,000 tokens     ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  CLAUDE.md files in every directory Claude descends into during the          ║
║  session. Each loaded on first access of a file in that directory.           ║
║  Example: src/CLAUDE.md, src/api/CLAUDE.md, src/api/handlers/CLAUDE.md      ║
║  Cumulative across subdirectories accessed.                                  ║
║  Cached: individually per file                                               ║
║                                                                              ║
║  BLOCK 7: CLAUDE.local.md                                ~0–4,000 tokens     ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  <project-root>/CLAUDE.local.md. Never committed to git (.gitignore).       ║
║  Personal overrides: personal API keys, local paths, dev preferences.        ║
║  Loaded immediately after project CLAUDE.md.                                 ║
║  Cached: YES                                                                 ║
║                                                                              ║
║  BLOCK 8: AUTO-MEMORY MEMORY.md                          ~0–6,000 tokens     ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  ~/.claude/MEMORY.md (user scope) and <project>/.claude/MEMORY.md           ║
║  Auto-maintained by Claude based on /memory commands.                        ║
║  Loaded after CLAUDE.md files. Survives compaction (re-read from disk).     ║
║  Cached: YES                                                                 ║
║                                                                              ║
║  BLOCK 9: CONVERSATION HISTORY                           ~0–160,000 tokens   ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  Every user turn, every assistant response, every tool call, every tool      ║
║  result — since the start of the current session or last compaction.         ║
║  GROWS with every turn. The primary driver of context exhaustion.            ║
║  Cached: PARTIALLY (earlier turns may be cached, recent turns are not)      ║
║                                                                              ║
║  BLOCK 10: PATH-MATCHED RULES                            ~0–15,000 tokens    ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  .claude/rules/*.md files (or settings.json "rules" key) that match         ║
║  the current file path being operated on. DEFERRED: cost 0 tokens until     ║
║  a matching path is encountered. Each matched rule: ~300–800 tokens.         ║
║  Multiple rules can be active simultaneously.                                ║
║  Cached: per-file, once loaded                                               ║
║                                                                              ║
║  BLOCK 11: ACTIVE SKILLS                                 ~0–8,000 tokens     ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  .claude/commands/*.md files loaded when the user invokes a slash command.   ║
║  Only the invoked skill is loaded. DEFERRED: cost 0 until invocation.       ║
║  Cached: once per session per skill                                          ║
║                                                                              ║
║  BLOCK 12: MCP TOOL SCHEMAS                              ~2,650 per server   ║
║  ─────────────────────────────────────────────────────────────────────────  ║
║  Full JSON schemas for every tool exposed by every connected MCP server.    ║
║  Loaded at session start for all configured MCP servers (always-on).        ║
║  With 5 MCP servers: ~13,250 tokens constant overhead.                      ║
║  NOT cached (MCP schemas are dynamic per server session).                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Token Totals at Session Start (Typical)

```
Block 1  System prompt              3,100 tokens
Block 2  Eager tool schemas         4,800 tokens
Block 3  Enterprise CLAUDE.md       1,200 tokens (if present)
Block 4  User CLAUDE.md             1,800 tokens (if present)
Block 5  Project CLAUDE.md          2,400 tokens (typical)
Block 6  Subdirectory CLAUDE.mds        0 tokens (not yet descended)
Block 7  CLAUDE.local.md              400 tokens (if present)
Block 8  MEMORY.md                    800 tokens (if present)
Block 9  Conversation history       1,200 tokens (just the first prompt)
Block 10 Path-matched rules             0 tokens (deferred)
Block 11 Active skills                  0 tokens (deferred)
Block 12 MCP tool schemas           5,300 tokens (2 MCP servers typical)
         ─────────────────────────────────────────
         TOTAL AT SESSION START:   ~21,000 tokens
```

That 21K baseline is before any significant work happens. By the middle of a complex refactor session, conversation history alone typically reaches 80K–120K tokens.

---

## 3. 200K vs 1M Context Windows

### Context Limits by Model (v2.1.126, May 2026)

| Model | Context Window | Input Cost | Output Cost | Best For |
|-------|---------------|------------|-------------|----------|
| Claude Opus 4.8 | **1,048,576 tokens** | $15 / MTok | $75 / MTok | Massive codebases, complex reasoning |
| Claude Opus 4.7 | **1,048,576 tokens** | $15 / MTok | $75 / MTok | High-quality analysis tasks |
| Claude Opus 4.6 | 200,000 tokens | $15 / MTok | $75 / MTok | Flagship quality, moderate context |
| Claude Sonnet 4.6 | 200,000 tokens | $3 / MTok | $15 / MTok | Daily driver, balanced cost/quality |
| Claude Haiku 4.5 | 200,000 tokens | $0.80 / MTok | $4 / MTok | High-volume, fast tasks |

> **Note:** Model availability in Claude Code is controlled by the `model` key in `~/.claude/settings.json` or the `--model` flag. Enterprise accounts may have additional or restricted model access.

### What 1M Tokens Actually Means

One million tokens is not a number most developers have an intuitive feel for. Here are concrete reference points:

```
1,000,000 tokens ≈
  ├── 750,000 words of English prose
  ├── ~200,000 lines of Go code (typical line density)
  ├── ~170,000 lines of Python (slightly higher token density)
  ├── ~120,000 lines of TypeScript with comments and JSDoc
  ├── A typical large React SPA (all .tsx/.ts/.css files): ~80K–120K tokens
  └── A complete .NET solution with 50 projects: ~200K–400K tokens

200,000 tokens ≈
  ├── 150,000 words of English prose
  ├── ~40,000 lines of Go code
  ├── A medium-sized microservice (all source files)
  └── A full conversation of ~400 back-and-forth exchanges
```

### When 1M Context Actually Matters

The 1M context window is genuinely useful in specific scenarios — and irrelevant in others.

**Scenarios where 1M context helps:**

1. **Whole-codebase refactors** — reading every source file into context before making a sweeping API change; with 200K you may need to segment the work across multiple sessions or subagents
2. **Large file analysis** — a 40K-line generated file (database schema, protobuf output, minified bundle analysis) that would exhaust 200K on its own
3. **Long research sessions** — multi-hour sessions where conversation history is the primary token consumer; 1M lets you go longer before auto-compaction triggers
4. **Full project comprehension** — asking Claude to understand a 200-file codebase holistically without chunking

**Scenarios where 1M context does NOT help:**

1. **Writing a new feature** — you rarely need all 200K lines loaded; relevant files rarely exceed 20K tokens
2. **Bug fixing** — usually requires only the failing file, a few related files, and test output; 200K is more than sufficient
3. **Short agentic tasks** — most automated tasks complete well within 50K tokens
4. **Parallel subagent workloads** — subagents use smaller, focused windows anyway; 1M on the orchestrator does not help the agents

### Context Window Headroom Visualization

```
200K Window                          1M Window
═══════════════════                  ═══════════════════════════════════════
[████ Startup ~21K  ]                [█ Startup ~21K                        ]
[                   ]                [                                       ]
[                   ]                [                                       ]
[  Available for    ]                [  Available for                        ]
[  conversation     ]                [  conversation and                     ]
[  and code reads   ]                [  large code reads                     ]
[                   ]                [                                       ]
[                   ]                [                                       ]
[⚠ Compaction at    ]                [                                       ]
[ ~167K (~83.5%)    ]                [                                       ]
[                   ]                [                                       ]
[  Dead zone: 33K   ]                [⚠ Compaction at                        ]
[  (safety buffer)  ]                [   ~836K (~83.5%)                      ]
═══════════════════                  ═══════════════════════════════════════
Effective usable: ~146K              Effective usable: ~815K
```

---

## 4. Compaction — The Safety Valve

### What Compaction Is

Context compaction is Claude Code's automatic mechanism for preventing context window overflow. When the context window approaches its limit, continuing to add tokens (conversation history, tool results, new file reads) would eventually hit the model's hard limit, causing the API call to fail with a context length error.

Compaction prevents this by summarizing the conversation history, discarding most of the raw content, and starting a "fresh" conversation that begins with a compact summary of what happened, followed by a re-read of all persistent memory files (CLAUDE.md, MEMORY.md).

### The Compaction Trigger

Compaction fires automatically when the context window reaches approximately **83.5% of its maximum capacity**.

```
200K window:  triggers at ~167,000 tokens
1M window:    triggers at ~836,000 tokens
```

The 83.5% threshold is not configurable. It is a hard-coded safety margin. The remaining ~16.5% (33K tokens in a 200K window) is reserved as a buffer to ensure the compaction process itself can complete — because compaction itself requires Claude to read and synthesize the conversation, which costs tokens.

### Step-by-Step Compaction Process

```
  Phase 1: TRIGGER
  ─────────────────────────────────────────────────────
  Conversation history token count crosses 83.5% threshold
  Claude Code detects this BEFORE sending the next API call
  Auto-compaction begins (or user ran /compact manually)

  Phase 2: SYNTHESIS
  ─────────────────────────────────────────────────────
  Claude Code sends a special compaction prompt to the API:
  "Summarize the conversation so far, capturing:
    - All decisions made
    - All tasks completed and their outcomes
    - All files modified (with what changed)
    - All errors encountered and how they were resolved
    - The current state of incomplete tasks
    - Any relevant technical context"
  This synthesis call: ~100K–200K input tokens + ~4K–8K output tokens
  Cost: ~$0.30–$0.90 on Sonnet 4.6, ~$1.50–$4.50 on Opus 4.8

  Phase 3: CONTEXT REBUILD
  ─────────────────────────────────────────────────────
  New context window assembled from scratch:
    [System prompt]          ← same as before
    [Tool schemas]           ← same as before
    [All CLAUDE.md files]    ← RE-READ FROM DISK (picks up any edits!)
    [All MEMORY.md files]    ← RE-READ FROM DISK
    [Compaction summary]     ← replaces ALL conversation history
    [Current turn]           ← the message that triggered this turn

  Phase 4: RESUME
  ─────────────────────────────────────────────────────
  Session continues from the compacted state
  Claude continues the task as if nothing happened
```

### What Survives Compaction vs What Does Not

| Content | Survives? | Notes |
|---------|-----------|-------|
| CLAUDE.md instructions | YES (re-read) | Re-read from disk — edits take effect |
| MEMORY.md entries | YES (re-read) | Re-read from disk |
| Task description | YES (summarized) | May lose some nuance |
| File contents read earlier | PARTIALLY | Summary says "read X", content lost |
| Exact error messages | MAYBE | Preserved if Claude judged them important |
| Code snippets in conversation | MAYBE | May survive if pivotal to the task |
| Tool call results (raw) | NO | Only summary survives |
| Conversation tone/context | NO | Personality context is lost |
| Todo list state | YES | TodoRead/Write state is summarized |

**Critical implication:** if you read a file into context and then compaction fires, the file's contents are gone from the window. Claude remembers it was read, but not what it contained. If Claude needs the content again, it will re-read the file. This is generally fine — it is what the tools are for.

### The Circuit Breaker (v2.1.89+)

Prior to v2.1.89, a pathological session could trigger compaction, then immediately fill the window again (e.g., by reading enormous files), triggering another compaction — creating a rapid compaction loop. Each loop burned $0.50–$2.00 in API costs.

Starting in v2.1.89, Claude Code includes a **compaction circuit breaker**: after a compaction event, auto-compaction cannot fire again within a **2-minute window**. During the lockout period:

- Claude Code continues operating normally
- If the context window fills completely during the lockout, the API call fails with a context length error
- Claude Code surfaces this as a user-facing error with a recommendation to run `/compact` manually

The circuit breaker is not configurable and cannot be disabled.

### Compaction Cost Worked Example

A typical mid-session compaction on Sonnet 4.6:

```
Pre-compaction window state:
  System + tools:      ~8,000 tokens
  CLAUDE.md files:     ~6,000 tokens
  MEMORY.md:           ~1,500 tokens
  Conversation:      ~155,000 tokens   ← 83.5% threshold reached
  ─────────────────────────────────────
  Total:             ~170,500 tokens

Compaction synthesis call:
  Input:             ~170,500 tokens   @ $3.00/MTok = $0.51
  Output:              ~5,000 tokens   @ $15.00/MTok = $0.075
  Compaction cost:     ~$0.585

Post-compaction window state:
  System + tools:      ~8,000 tokens
  CLAUDE.md files:     ~6,000 tokens
  MEMORY.md:           ~1,500 tokens
  Compact summary:     ~5,000 tokens   ← replaces 155K of history
  Current turn:          ~500 tokens
  ─────────────────────────────────────
  Total:              ~21,000 tokens   ← fresh start
```

The session went from 170K tokens to 21K tokens, at a cost of approximately $0.59.

### Manual /compact vs Auto-Compaction

**Use `/compact` proactively when:**
- You have completed a major task phase and are starting a new phase
- The `/context` output shows remaining tokens below 40K
- You are about to read a large file that might push you over the threshold
- You want to clear irrelevant conversation history before a sensitive operation

**Let auto-compaction fire when:**
- You are in the middle of a continuous task and do not want to interrupt it
- The conversation history is all relevant to the ongoing task
- You are monitoring token usage and have sufficient headroom

**Tip:** Before a compaction (manual or auto), update your MEMORY.md with `/memory` to ensure important decisions survive. MEMORY.md is re-read from disk after compaction; conversation history is not.

---

## 5. Context Budget Configuration in settings.json

### The `contextBudget` Key

The `contextBudget` setting in `~/.claude/settings.json` (or project `.claude/settings.json`) controls how many tokens Claude Code is allowed to allocate to a given task or agentic run before it stops and asks for confirmation or terminates.

This is distinct from the model's context window limit — it is a user-defined spending cap on context tokens.

```json
{
  "model": "claude-sonnet-4-6",
  "contextBudget": {
    "maxTokens": 100000,
    "warnAt": 80000,
    "hardLimit": true
  }
}
```

**Fields:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxTokens` | integer | model max × 0.835 | Maximum tokens to use before stopping |
| `warnAt` | integer | maxTokens × 0.8 | Token count that triggers a warning |
| `hardLimit` | boolean | false | If true, abort task when limit hit; if false, warn only |

### Per-Task Budget Allocation

When Claude Code runs as an orchestrator spawning subagents, each subagent inherits a portion of the parent's remaining budget. The default allocation is:

```
Parent budget: 100,000 tokens remaining
Subagent 1 spawned: allocated 25,000 tokens (25% of remaining)
Subagent 2 spawned: allocated 25,000 tokens (25% of remaining)
Parent continues with: 50,000 tokens reserved
```

This default split can be overridden in the subagent invocation:

```json
{
  "subagentBudget": {
    "defaultFraction": 0.3,
    "minTokens": 10000,
    "maxTokens": 50000
  }
}
```

### The `--max-budget-usd` Flag

The `--max-budget-usd` flag provides a dollar-denominated budget cap that Claude Code converts to a token count at session start based on the selected model's pricing:

```bash
claude --max-budget-usd 0.50 "refactor all API handlers to use the new auth middleware"
```

With Sonnet 4.6 ($3/MTok input, $15/MTok output):
- $0.50 budget
- Conservative assumption: 80% input / 20% output ratio
- Effective token budget: ~$0.40 / $3.00 × 1,000,000 = ~133,333 input tokens
- Claude Code will warn at 80% of this (~106K tokens) and stop at 100% (~133K)

The `--max-budget-usd` flag is additive with `contextBudget` settings: the more restrictive limit wins.

---

## 6. Measuring Context with /context

The `/context` command is the primary diagnostic tool for understanding how your context window is being used. Run it at any point during a session to get a breakdown.

### Sample /context Output

```
/context

╔══════════════════════════════════════════════════════════════════╗
║                    CONTEXT WINDOW USAGE                          ║
╠══════════════════════════════════════════════════════════════════╣
║  Model:          claude-sonnet-4-6                               ║
║  Window size:    200,000 tokens                                  ║
╠══════════════════════════════════════════════════════════════════╣
║  SYSTEM CONTEXT                                                  ║
║    System prompt:          3,142 tokens                          ║
║    Eager tool schemas:     4,891 tokens                          ║
║    Enterprise CLAUDE.md:   1,204 tokens                          ║
║    User CLAUDE.md:         1,887 tokens                          ║
║    Project CLAUDE.md:      3,401 tokens                          ║
║    CLAUDE.local.md:          312 tokens                          ║
║    MEMORY.md:                891 tokens                          ║
║    ─────────────────────────────────────                         ║
║    System subtotal:       15,728 tokens                          ║
╠══════════════════════════════════════════════════════════════════╣
║  DYNAMIC CONTEXT                                                 ║
║    Conversation history:  67,441 tokens                          ║
║    Active rules:           1,204 tokens  (2 rules loaded)        ║
║    Active skills:          2,812 tokens  (1 skill loaded)        ║
║    MCP tool schemas:       5,298 tokens  (2 servers)             ║
║    ─────────────────────────────────────                         ║
║    Dynamic subtotal:      76,755 tokens                          ║
╠══════════════════════════════════════════════════════════════════╣
║  TOTALS                                                          ║
║    Used:                  92,483 tokens  (46.2% of window)       ║
║    Remaining:            107,517 tokens  (53.8% of window)       ║
║    Compaction at:        167,000 tokens  (83.5% of window)       ║
║    Headroom to compact:   74,517 tokens                          ║
╠══════════════════════════════════════════════════════════════════╣
║  CACHE PERFORMANCE                                               ║
║    Cache hit rate:           78.3%                               ║
║    Cached tokens this turn:  72,294 tokens                       ║
║    Uncached tokens this turn: 20,189 tokens                      ║
╚══════════════════════════════════════════════════════════════════╝
```

### Interpreting /context Output

**System subtotal — target ranges:**

| Metric | Healthy | Investigate | Critical |
|--------|---------|-------------|----------|
| System subtotal | < 15K tokens | 15K–25K tokens | > 25K tokens |
| Project CLAUDE.md alone | < 4K tokens | 4K–8K tokens | > 8K tokens |
| MCP schemas | < 8K tokens | 8K–15K tokens | > 15K tokens |

**Cache hit rate — target ranges:**

| Cache Hit Rate | Meaning | Action |
|---------------|---------|--------|
| > 85% | Excellent — most tokens read from cache | None needed |
| 70–85% | Good — minor inefficiency | Monitor |
| 50–70% | Moderate — some churn in system context | Check if CLAUDE.md is changing |
| < 50% | Poor — cache is being invalidated frequently | Audit system context changes |

**The cache hit rate is your cost multiplier.** A 90% cache hit rate means you are only paying for 10% of your system context tokens on most turns. A 40% cache hit rate means you are paying for 60% — substantially higher cost per turn.

**Headroom to compact — action thresholds:**

- **> 60K headroom**: No action needed
- **30K–60K headroom**: Monitor; consider proactive /compact if starting a large task
- **< 30K headroom**: Run `/compact` before the next large operation
- **< 10K headroom**: Run `/compact` now; auto-compaction may fire mid-task

---

## 7. ToolSearch and Deferred Tool Loading

### The Problem: Tool Schema Bloat

Each MCP tool schema is a JSON document describing the tool's name, description, parameters, and return type. A single complex tool schema can be 500–2,000 tokens. A large MCP server with 30 tools could add 15,000–60,000 tokens to every session — even for tools that are never used.

Claude Code v2.1.89 introduced **deferred tool loading** to solve this. Instead of loading all MCP tool schemas eagerly, schemas above a threshold are registered by name only. Their full schemas are loaded on demand via `ToolSearch`.

### How Deferred Loading Works

```
Session Start:
  ┌─────────────────────────────────────────────────────────┐
  │  MCP Server "github" connects: 47 tools registered      │
  │                                                          │
  │  Threshold check: 47 tools × avg 800 tokens = 37,600    │
  │  This exceeds the 10% context threshold (20K for 200K)  │
  │                                                          │
  │  Deferred loading activated:                             │
  │    - Top 5 most-used tools: loaded eagerly (~4,000 tok)  │
  │    - Remaining 42 tools: deferred (registered by name)   │
  │                                                          │
  │  Context window impact:                                  │
  │    Without deferral: +37,600 tokens                      │
  │    With deferral:    +4,000 tokens  (89% savings)        │
  └─────────────────────────────────────────────────────────┘

Tool call at runtime:
  User: "create a pull request for this branch"

  Claude recognizes this needs a github tool but does not have
  the full mcp__github__create_pull_request schema.

  Claude calls ToolSearch:
    ToolSearch("create pull request github")
    → Returns full schema for mcp__github__create_pull_request
    → Schema is loaded into context (~1,200 tokens)
    → Claude can now call the tool

  Token cost: +1,200 tokens (instead of +37,600 at session start)
```

### The 10% Deferral Threshold

The deferral threshold is calculated as 10% of the total context window:

```
200K window → threshold = 20,000 tokens
1M window   → threshold = 100,000 tokens
```

If all MCP tool schemas for a given server would exceed this threshold, deferral activates for that server. The most-recently-used tools are loaded eagerly (up to the threshold), and the rest are deferred.

### Approximate Token Savings from Deferral

For a session with these MCP servers configured:

| MCP Server | Tools | Without Deferral | With Deferral | Savings |
|------------|-------|------------------|---------------|---------|
| github | 47 | ~37,600 tok | ~4,000 tok | ~33,600 |
| filesystem | 12 | ~7,200 tok | ~7,200 tok | 0 (under threshold) |
| postgres | 28 | ~16,800 tok | ~2,800 tok | ~14,000 |
| slack | 31 | ~24,800 tok | ~3,200 tok | ~21,600 |
| **Total** | **118** | **~86,400 tok** | **~17,200 tok** | **~69,200** |

In this example, deferred loading saves approximately **77,000 tokens** at session start — freeing that space for actual work.

### ToolSearch Usage Patterns

ToolSearch accepts natural language queries and fuzzy-matches them against deferred tool names and descriptions:

```
# Exact name lookup
ToolSearch("select:mcp__github__create_pull_request")

# Semantic search
ToolSearch("create PR github")
ToolSearch("search github issues")
ToolSearch("push files to repository")

# Multi-tool fetch
ToolSearch("select:mcp__github__list_branches,mcp__github__create_branch")
```

Each ToolSearch call that resolves a new tool adds that tool's schema to the context window and makes the tool callable. The schema persists in context for the rest of the session (no re-loading needed).

---

## 8. Path-Scoped Rules — Zero-Cost Deferral

### How Rules Deferral Works

Rules files (`.claude/rules/*.md` or configured via `settings.json`) are a powerful way to apply context-specific instructions without bloating every session. Unlike CLAUDE.md files which are always loaded, rules files are **deferred by default**.

```
Session start:
  Rules discovered:    12 rules files in .claude/rules/
  Context cost:        0 tokens  ← none loaded yet

Claude reads src/api/handlers/auth.go:
  Path: src/api/handlers/auth.go
  Matching rules check:
    - "*.go" rule → MATCHES → loaded: +340 tokens
    - "src/api/**" rule → MATCHES → loaded: +520 tokens
    - "**/*auth*" rule → MATCHES → loaded: +280 tokens
  Three rules now active: +1,140 tokens total

Claude reads tests/unit/auth_test.go:
  Path: tests/unit/auth_test.go
  Matching rules check:
    - "*.go" rule → already loaded (no additional cost)
    - "tests/**" rule → MATCHES → loaded: +410 tokens
    - "**/*_test.go" rule → MATCHES → loaded: +190 tokens
  Two new rules loaded: +600 tokens additional
```

### Rule Token Costs

Individual rule file token costs depend on content length:

| Rule Complexity | Approximate Token Cost | Example |
|----------------|----------------------|---------|
| Simple (3–5 bullet points) | 150–300 tokens | `no_console_log.md` |
| Medium (10–20 guidelines) | 300–600 tokens | `go_style.md` |
| Complex (with code examples) | 600–1,200 tokens | `api_design_patterns.md` |
| Very complex (exhaustive) | 1,200–2,500 tokens | `security_requirements.md` |

### Checking Active Rules

The `/context` output shows which rules are currently loaded and their token costs. You can also identify rules state from the "Active rules" line:

```
Active rules:    2,847 tokens  (7 rules loaded)
```

To see which specific rules are loaded, run `/context --verbose` (available in v2.1.100+):

```
Active rules:    2,847 tokens  (7 rules loaded)
  ├── *.ts                    312 tokens  (loaded at src/App.tsx)
  ├── *.tsx                   312 tokens  (same rule, already counted)
  ├── src/components/**       841 tokens  (loaded at src/components/Button.tsx)
  ├── **/*.test.*             428 tokens  (loaded at src/Button.test.tsx)
  ├── no-any-type             189 tokens  (loaded at src/types.ts)
  ├── react-patterns          524 tokens  (loaded at src/App.tsx)
  └── accessibility           241 tokens  (loaded at src/components/Button.tsx)
```

### Designing Rules for Context Efficiency

Best practice is to keep rules focused and scoped as tightly as possible:

```markdown
# Wasteful — broad rule loaded for all files, every language
# .claude/rules/code-style.md (glob: "**/*")
Use consistent indentation. Prefer functional patterns.
Never use global variables. Document all public functions.
Handle all error cases explicitly. Use descriptive names.
[...300 more lines of generic advice...]

# Better — language-specific rules with tight glob patterns
# .claude/rules/go-style.md (glob: "**/*.go")
# .claude/rules/ts-style.md (glob: "**/*.{ts,tsx}")
# .claude/rules/python-style.md (glob: "**/*.py")
```

With the tight approach, only relevant rules are loaded, and each is smaller and more actionable.

---

## 9. Cost Math for Different Context States

### Sonnet 4.6 Cost Model (May 2026)

```
Input tokens (uncached):  $3.00 per million tokens ($0.000003 per token)
Input tokens (cached):    $0.30 per million tokens ($0.0000003 per token)
Output tokens:           $15.00 per million tokens ($0.000015 per token)
Cache write premium:      $3.75 per million tokens (one-time write cost)
```

### Worked Example: Session Startup Cost

```
Turn 1: User asks "explain this codebase"

Tokens sent to API:
  System prompt:            3,142 tokens  — CACHE WRITE (first time)
  Tool schemas:             4,891 tokens  — CACHE WRITE (first time)
  CLAUDE.md files:          6,500 tokens  — CACHE WRITE (first time)
  First message:              180 tokens  — NOT CACHED
  ────────────────────────────────────────
  Total input:             14,713 tokens

Cost breakdown:
  Cache writes: 14,533 tokens × $3.75/MTok = $0.000054 (cache write premium)
  Uncached:        180 tokens × $3.00/MTok = $0.0000005
  Total input cost: $0.000055 (about 0.006 cents)

Response output: ~2,000 tokens × $15/MTok = $0.030

Turn 1 total: ~$0.030 (output dominates)
```

### Worked Example: Mid-Session Turn (Turn 50)

```
By turn 50, typical state:
  System context (cached):  15,500 tokens
  Conversation history:     88,000 tokens (mostly cached)
  Recent history (new):      4,200 tokens (last 3 turns, not cached)
  Current message:             350 tokens (not cached)
  ────────────────────────────────────────
  Total input:             108,050 tokens

Cost breakdown:
  Cached tokens: 103,500 × $0.30/MTok  = $0.000031
  Uncached:        4,550 × $3.00/MTok  = $0.000014
  Total input cost: $0.000045 (about 0.005 cents per turn)

Output: ~3,000 tokens × $15/MTok = $0.045

Turn 50 total: ~$0.045 (output still dominates)
Note: High cache hit rate keeps input costs low even at 108K tokens.
```

### Worked Example: Cost Per Compaction

```
Compaction at 167K tokens (83.5% of 200K):
  Input tokens for synthesis: ~167,000 tokens (mostly cached from prior turns)
    Cached portion (80%):   133,600 × $0.30/MTok = $0.000040
    Uncached portion (20%):  33,400 × $3.00/MTok = $0.000100
  Output tokens (summary):   ~5,000 × $15/MTok   = $0.075

  Total compaction cost: ~$0.075 per compaction event
```

### Sonnet 4.6 vs Opus 4.8 Context Cost Comparison

For the same mid-session state (108K tokens in, 3K tokens out):

| Model | Input Cost | Output Cost | Turn Cost | Notes |
|-------|-----------|-------------|-----------|-------|
| Sonnet 4.6 | $0.000045 | $0.045 | ~$0.045 | Practical daily driver |
| Opus 4.8 | $0.000225 | $0.225 | ~$0.225 | 5× more expensive |
| Haiku 4.5 | $0.000012 | $0.012 | ~$0.012 | 3.75× cheaper than Sonnet |

**Key insight:** At high context utilization, input costs are a small fraction of output costs (ratio ~1:100 for typical sessions). Optimizing for cache hit rate matters more than reducing context size when input tokens are cached.

---

## 10. Optimization Strategies (Ranked by Impact)

### Tier 1: High Impact, Low Effort

**1. Use path-scoped rules instead of CLAUDE.md for language/domain guidance**

Every line in CLAUDE.md costs tokens on every turn. Moving language-specific rules to `.claude/rules/` with tight glob patterns means they are only loaded when needed.

Expected savings: 1,000–8,000 tokens per turn for sessions that do not touch the relevant file types.

**2. Trim CLAUDE.md to instructions that apply to 100% of tasks**

Audit your CLAUDE.md quarterly. Remove guidance that only applies to specific tasks (move to rules), remove instructions that describe behavior Claude already does by default, remove outdated context.

Expected savings: 500–3,000 tokens per turn.

**3. Limit MCP server connections to actually-used servers**

Each MCP server adds ~2,650 tokens minimum (for deferred schemas). A disconnected MCP server costs exactly 0 tokens. Remove servers you do not use in a given project context.

Expected savings: 2,650 tokens per unused MCP server per turn.

### Tier 2: High Impact, Moderate Effort

**4. Proactive /compact at task phase boundaries**

Instead of waiting for auto-compaction (which fires at 83.5% and may interrupt a sensitive operation), run `/compact` manually at natural task boundaries. This gives you maximum headroom for the next phase.

Example workflow:
```
Phase 1: Exploration     → /compact at end
Phase 2: Implementation  → /compact at end
Phase 3: Testing         → /compact at end
Phase 4: PR description  → natural session end
```

**5. Subagent isolation for independent tasks**

Parallel subagents each have their own context window. A parent orchestrator can remain at a low token count while delegating heavy work to subagents. Each subagent's window is independent.

```
Parent window: 25K tokens (lean orchestrator)
  ├── Subagent A: 80K tokens (handles frontend work)
  ├── Subagent B: 65K tokens (handles backend work)
  └── Subagent C: 40K tokens (handles test generation)
```

Total work capacity: 210K tokens across 4 windows, without any single window approaching limits.

### Tier 3: Moderate Impact, Low Effort

**6. Prune MEMORY.md entries regularly**

MEMORY.md is designed to be pruned. Periodically review entries with `/memory list` and remove entries that are no longer relevant. Each removed entry saves tokens on every future turn.

**7. Use @import in CLAUDE.md to lazy-load reference material**

With `@import` syntax, you can reference large reference documents from CLAUDE.md without including them inline. The import is resolved only when Claude encounters the directive, loading only the relevant section.

**8. Avoid reading entire large files when only sections are needed**

Use `Read` with `offset` and `limit` parameters to read specific line ranges rather than entire files. A 3,000-line file read in full costs ~9,000 tokens; reading a 50-line relevant section costs ~150 tokens.

---

## 11. Token Budget by Project Type

### Example A: Large Codebase Refactor (~550K tokens)

Scenario: Migrating a 120-file Go microservice from gRPC v1 to gRPC v2.

```
Session configuration: Opus 4.8 (1M window), no subagents
─────────────────────────────────────────────────────────
Startup overhead:          ~22K tokens (system + CLAUDE.md)
Files read for exploration:
  120 × average 80 lines = 9,600 lines × ~3 tok/line = ~29K tokens
Migration reference docs read:        ~18K tokens
Conversation history (50 turns):      ~95K tokens
Error output from test runs:          ~12K tokens
Generated code patches inlined:       ~48K tokens
─────────────────────────────────────────────────────────
Estimated peak window:              ~224K tokens

Well within the 1M window.
Expected compaction events: 0 (if Opus 4.8 used)
If Sonnet 4.6 (200K): would compact twice during session

Cost estimate (Opus 4.8):
  Per turn (avg 80K in, 4K out): ~$0.36
  50 turns total: ~$18.00
```

### Example B: Focused Script Generation (~73K tokens)

Scenario: Writing a Python script to parse and transform CSV files.

```
Session configuration: Sonnet 4.6 (200K window)
─────────────────────────────────────────────────────────
Startup overhead:          ~16K tokens
Sample CSV file read:       ~3K tokens
Conversation history (15 turns): ~28K tokens
Generated script inline:   ~8K tokens
Test output:                ~4K tokens
─────────────────────────────────────────────────────────
Estimated peak window:      ~59K tokens (30% of 200K)
Expected compaction events: 0

Cost estimate (Sonnet 4.6):
  Per turn (avg 45K in, 3K out): ~$0.059
  15 turns total: ~$0.88
```

### Example C: Parallel Agent Workload (~170K parent + subagent windows)

Scenario: Orchestrator with 3 specialized subagents building a REST API.

```
Orchestrator (parent) window:
  System + CLAUDE.md:       ~18K tokens
  Task description:          ~3K tokens
  Coordination messages:    ~12K tokens
  Subagent results (summaries): ~8K tokens
  ──────────────────────────────────────
  Total parent window:       ~41K tokens

Subagent A (route handlers):  ~65K tokens
Subagent B (database layer):  ~55K tokens
Subagent C (auth middleware): ~48K tokens

Total context across all windows: ~209K tokens
Single-window equivalent (sequential): ~180K
Advantage: parallel execution, better separation of concerns
```

---

## 12. Common Context Window Mistakes

### Mistake 1: Putting Reference Documentation in CLAUDE.md

**Symptom:** CLAUDE.md is 8,000+ tokens; every turn is expensive; `/context` shows system subtotal > 25K.

**What is happening:** You have included API documentation, style guides, or reference tables directly in CLAUDE.md, making every turn expensive even when that reference is not needed.

**Fix:** Move reference material to `.claude/rules/` with appropriate glob patterns. Keep CLAUDE.md to behavioral instructions only.

### Mistake 2: Reading Entire Large Files When Only a Section is Needed

**Symptom:** A single `Read` call adds 15,000+ tokens; context fills up quickly.

**What is happening:** `Read /src/generated/schema.pb.go` on a 5,000-line file uses ~15,000 tokens, even if you only needed the first 50 lines to find a struct definition.

**Fix:** Use `Read` with `limit` and `offset`, or use `Grep` to find the specific section first, then read only that section.

```bash
# Wasteful
# Read /src/generated/schema.pb.go  ← reads all 5,000 lines

# Better
# Grep "type UserResponse struct" → find line 1204
# Read /src/generated/schema.pb.go offset=1204 limit=30
```

### Mistake 3: Ignoring /context Until It Is Too Late

**Symptom:** Auto-compaction fires unexpectedly mid-task, interrupting sensitive operations.

**Fix:** Check `/context` regularly (every 10–15 turns in complex sessions). Run `/compact` proactively when headroom drops below 40K tokens.

### Mistake 4: Using Too Many MCP Servers

**Symptom:** Session startup is slow; `/context` shows 15K+ tokens in MCP schemas; schemas are for tools never used in this project.

**Fix:** Configure MCP servers at the project level, not globally. Add servers to `.claude/settings.json` only for projects that need them. Remove global MCP servers that are project-specific.

### Mistake 5: Not Updating MEMORY.md Before Compaction

**Symptom:** After compaction, Claude "forgets" important decisions made earlier in the session.

**What is happening:** Important architectural decisions were only in conversation history, not in MEMORY.md. Compaction summarized them briefly but lost detail.

**Fix:** Run `/memory` periodically to save important decisions:
```
/memory "The team decided to use PostgreSQL for the primary store because Redis was too expensive at scale"
```
This writes to MEMORY.md, which survives compaction.

### Mistake 6: Spawning Subagents That Each Load the Same Large Files

**Symptom:** Parallel subagents are slower and more expensive than expected; each one re-reads the same codebase files.

**Fix:** Have the orchestrator read shared files once and pass relevant content to subagents as inline context, rather than each subagent independently discovering and reading the same files.

### Mistake 7: Running /compact Too Early

**Symptom:** Compaction fires when only 40% of window is used; conversation context that was still relevant is lost.

**Fix:** Only run `/compact` proactively when headroom drops below 40K tokens (for a 200K window). Earlier than that, you are discarding relevant context unnecessarily.

### Mistake 8: Treating 1M Context as Infinite

**Symptom:** With Opus 4.8, sessions run unchecked until they hit the 83.5% threshold at ~836K tokens, resulting in compaction costs of $8–$15 per event.

**Fix:** Even with 1M context, use good hygiene: do not read unnecessary files, prune CLAUDE.md, use path-scoped rules. The compaction penalty at 1M scale is 5× larger than at 200K scale.

---

## Related Documentation

- [Memory Management — Complete Reference](/claude-code/memory-management) — detailed coverage of CLAUDE.md hierarchy and MEMORY.md
- [Models & Pricing](/claude-code/models-pricing) — complete model specifications and cost tables
- [Hooks System](/claude-code/hooks-deep-dive) — hook events and their token overhead
- [MCP Servers Guide](/claude-code/mcp-servers-guide) — MCP server configuration and tool schema management
- [Slash Commands Reference](/claude-code/slash-commands-reference) — `/compact`, `/context`, `/memory` command reference
- [Troubleshooting](/claude-code/troubleshooting) — context-related error messages and resolutions
