---
title: "Claude Code: Context, Cost & Token Efficiency — Reference"
description: "Complete reference for context management, prompt caching, token budgets, model selection, effort controls, hooks, environment variables, and the advisor tool in Claude Code v2.1.126+. Covers all five CCA-F exam domains."
lastUpdated: 2026-05-19
sidebar:
  order: 5
---

# Claude Code: Context, Cost & Token Efficiency — Complete Reference

> **Last updated:** May 19, 2026

---

## 1. Context Window Architecture

### 1.1 The Stateless Reconstruction Model

Claude Code is **stateless between turns**. Every API call reconstructs the entire payload from scratch — there is no persistent server-side conversation state. The full context is assembled in a deliberate order designed to maximize prompt cache prefix matching (most stable content first, most volatile last):

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Tool definitions         (all built-in + MCP tools)      │ ← Shared across ALL users (best cache)
│ 2. System prompt            (Anthropic internal instructions)│ ← Shared across all users
│ 3. CLAUDE.md content        (full project hierarchy)        │ ← Shared per-project
│ 4. Auto-memory              (MEMORY.md, ≤200 lines / 25KB) │ ← Per-project
│ 5. Loaded skill descriptions (from .claude/commands/)       │ ← On-demand (when invoked)
│ 6. MCP server instructions  (per-server guidance text)      │ ← Per-session config
│ 7. Conversation history     (all messages + tool results)   │ ← Unique per-session, grows each turn
│ 8. Path-scoped rules        (.claude/rules/ with paths)     │ ← On-demand per directory
└─────────────────────────────────────────────────────────────┘
Reserved buffer: 33K–45K tokens for system overhead
```

**Key metrics:**
- Standard context window: **200K tokens**
- Extended context window: **1M tokens** (Opus 4.6 and Sonnet 4.6, at standard pricing since March 14, 2026 — no surcharge)
- Average API cost: **~$13/developer/active day** (90th percentile under $30; $150-250/month)
- Input tokens account for **85–92%** of total API costs in typical coding sessions

### 1.2 Context Assembly Order

Understanding how Claude assembles context helps you predict token costs:

```
  ┌──────────────────────────────────────────────────────────────────┐
  │              CONTEXT ASSEMBLY (in order, lowest → highest)      │
  ├──────────────────────────────────────────────────────────────────┤
  │  Position  │ Content                        │ Cache eligible?   │
  ├──────────────────────────────────────────────────────────────────┤
  │  1st        │ Tool schemas (built-in)        │ YES (prefix)      │
  │  2nd        │ MCP tool schemas               │ YES (prefix)      │
  │  3rd        │ System prompt                  │ YES (prefix)      │
  │  4th        │ CLAUDE.md (all levels)         │ YES (prefix)      │
  │  5th        │ Rules (global)                 │ YES (prefix)      │
  │  6th        │ Auto-memory (MEMORY.md)        │ YES (prefix)      │
  │  7th        │ Path-scoped rules              │ Sometimes         │
  │  8th        │ Skill content                  │ Sometimes         │
  │  9th        │ Conversation history           │ YES (up to TTL)   │
  │  10th       │ Tool results (in-turn)         │ NO (ephemeral)    │
  └──────────────────────────────────────────────────────────────────┘

  Cache hit = 0.1× cost (90% savings)
  Everything in "prefix" = stable across turns → high cache hit rate
  Conversation history = 5-min TTL (default) or 1-hour (Pro/Max subscribers)
```

### 1.3 Hidden Token Costs

These are the costs developers most frequently underestimate:

| Source | Token cost | Impact |
|--------|-----------|--------|
| GitHub MCP server (91 tools) | ~46,000 tokens | 23% of 200K window consumed before any work |
| A 5,000-token CLAUDE.md | 5,000 tokens × every turn | Compounds across entire session |
| Redundant file re-reads | 40–60% of all Read tokens | Studies show most Read tokens are re-reads |
| System overhead buffer | 33K–45K tokens | Effective usable space is smaller than raw window |

### 1.4 Monitoring Commands

| Command | What it shows | Scope |
|---------|--------------|-------|
| `/context` | Live breakdown: system prompt, system tools, MCP tools, custom agents, skills, messages, free space, autocompact buffer. In VS Code (v2.1.121), opens native Account & Usage dialog | Current snapshot |
| `/usage` | **Primary session cost command** (v2.1.118, merged `/cost` + `/stats`). Per-model input/output/cache-read/cache-write tokens + dollar cost + plan limits. `/cost` and `/stats` remain as shortcuts that open the relevant tab | Cumulative session |
| `/recap` | Manually invoke session recap (v2.1.108) — same summary that fires automatically after absence. Opt out: `CLAUDE_CODE_ENABLE_AWAY_SUMMARY=0` | Current session |
| `/clear` | Resets conversation; preserves tools, CLAUDE.md, and memory | Destructive reset |
| `/compact [focus]` | Summarizes conversation with optional focus topic | Lossy compression |
| `Esc+Esc`, `/rewind`, or `/undo` | Partial compaction — select a message checkpoint and summarize from there. `/undo` is an alias for `/rewind` (v2.1.108) | Selective compression |

---

## 2. Prompt Caching Economics

### 2.1 How Prompt Caching Works

Per Thariq Shihipar (Claude Code engineering team): *"We build our entire harness around prompt caching. A high prompt cache hit rate decreases costs and helps us create more generous rate limits for our subscription plans, so we run alerts on our prompt cache hit rate and declare SEVs if they're too low."*

The system stores **KV (key-value) attention cache tensors** server-side. When a new request shares the same byte-level prefix as a cached request, the model skips recomputation for that prefix. The context reconstruction order (Section 1.1) is deliberately arranged to maximize the length of the shared prefix — tool definitions and system prompts (shared by all users) come first, while per-session conversation history (unique and growing) comes last.

Each cache entry has a **5-minute TTL** that refreshes on every hit. Active sessions with turns less than 5 minutes apart keep the cache warm indefinitely. The cache is **per-model** — switching models mid-session means a complete cache miss where the entire context must be re-cached at write cost.

### 2.2 Pricing Multipliers

| Token type | Multiplier vs base | Sonnet 4.6 | Opus 4.6 / Opus 4.7 | Haiku 4.5 |
|------------|-------------------|------------|---------------------|-----------|
| Standard input (no cache) | 1.0× | $3.00/MTok | $5.00/MTok | $1.00/MTok |
| 5-minute cache write | 1.25× | $3.75/MTok | $6.25/MTok | $1.25/MTok |
| 1-hour cache write | 2.0× | $6.00/MTok | $10.00/MTok | $2.00/MTok |
| **Cache read (hit)** | **0.1×** | **$0.30/MTok** | **$0.50/MTok** | **$0.10/MTok** |
| Output tokens | — | $15.00/MTok | $25.00/MTok | $5.00/MTok |

> **Pricing update (April 16, 2026):** Opus 4.6 was repriced when Opus 4.7 launched — from $15/$75 (input/output) to $5/$25. Opus 4.7 carries the same price. Opus 4.6 is now considered legacy; Opus 4.7 is the recommended primary model. See Section 4.1 for model comparison.

**CCA-F formula:** Effective input cost = `(miss_tokens × write_rate) + (hit_tokens × 0.1 × base_rate)`. At 90% hit rate over a 20-turn session with 100K context on Sonnet, caching delivers **~84% savings** ($0.945 vs $6.00 without caching).

### 2.2a When Each Cache Tier Activates

The two write tiers exist because Anthropic optimizes differently depending on how likely a cached prefix is to be reused.

| Tier | Write cost | Who gets it | When it activates |
|------|-----------|------------|------------------|
| **5-minute** | 1.25× base | API-key customers; subagents; rarely-resumed sessions | Default everywhere for direct API users |
| **1-hour** | 2.0× base | Pro/Max subscribers (logged-in CLI) for likely-reused prefixes | System prompt + tool definitions on interactive sessions |

**New cache tier env vars (v2.1.108):**

| Variable | Effect |
|----------|--------|
| `ENABLE_PROMPT_CACHING_1H` | Opt into 1-hour prompt cache TTL on API key, Bedrock, Vertex, or Foundry. Replaces the deprecated `ENABLE_PROMPT_CACHING_1H_BEDROCK`. |
| `FORCE_PROMPT_CACHING_5M` | Force 5-minute prompt cache TTL regardless of plan. Useful for CI where long-lived cache is not needed. |

**v2.1.108 bug fix:** Subscribers who set `DISABLE_TELEMETRY=1` were silently falling back to the 5-minute cache TTL instead of the 1-hour TTL they were entitled to. Fixed. Claude Code now also prints a startup warning when prompt caching is disabled via any `DISABLE_PROMPT_CACHING*` env var, so unintended cache-off states are immediately visible.

**Why the split exists:** Writing a 1-hour cache entry costs 2.0× but a cache hit costs only 0.1×. If the prefix is reused even once within an hour the write premium is fully recovered. Anthropic rolls the 1-hour tier out selectively — interactive users reuse long prefixes (system prompt, tools) repeatedly in a session; API script runs and subagents rarely do.

**March 2026 silent regression:** Community analysis of raw JSONL session logs confirmed that Anthropic silently changed the default cache TTL from 1 hour to 5 minutes for some subscriber sessions sometime in early March 2026. Any pause longer than 5 minutes caused the full cached context to expire, forcing a complete cache-write on the next turn. The effect: users saw no change in visible behavior but quiet quota drain and cost inflation. Partially resolved by Anthropic server-side; the `--exclude-dynamic-system-prompt-sections` flag (v2.1.98) mitigates the daily-invalidation portion by stripping volatile date headers from the system prompt.

**Practical implication:** If `/cost` shows unexpectedly high `cache_write` tokens relative to `cache_read` tokens mid-session — especially after a pause — the 5-minute TTL has fired and the cache went cold. Use `/context` to verify, and consider `/compact` before long idle periods rather than after.

### 2.3 Cache Hit/Miss Flow

```
  Every API request:
  
  Claude API receives request
         │
         ▼
  Is the prefix (tools + system + CLAUDE.md + rules) identical to a cached version?
         │
    ┌────┴────┐
    │         │
   YES        NO
    │         │
    ▼         ▼
  CACHE HIT  CACHE MISS
  0.1× cost  1.25× cost (writes new cache entry)
  (read 90%  (standard input pricing + 25% write surcharge)
   cheaper)
         │
         ▼
  Response generated using cached KV state
  (same quality as non-cached — the model never "sees" the cache)

  What breaks cache hits (avoid these):
  ✗ Switching models mid-session
  ✗ Modifying CLAUDE.md between turns
  ✗ Adding/removing MCP servers mid-session
  ✗ Dynamic date in system prompt
  ✗ Using FORCE_PROMPT_CACHING_5M=1 with long sessions
```

### 2.4 The `--resume` Cache Regression (v2.1.69 → v2.1.90)

Between v2.1.69 and v2.1.90, `--resume` sessions suffered a critical bug causing a **~20× cost increase** per message. Only the internal system prompt (~14.5K tokens) was cached; all conversation history rebuilt from scratch on every turn.

**Root cause:** The session resume function maintained an allowlist of attachment types to preserve across serialization. Two critical types were missing: `deferred_tools_delta` (tracks which ToolSearch tools have been announced to the model) and `mcp_instructions_delta` (MCP server instructions). When stripped during resume, tools got re-announced on the next turn — inserting new messages that shifted the byte-level prefix hash and broke cache matching for the entire conversation history.

**Fixed in v2.1.90 (April 1, 2026).** This bug connects three CCA-F domains: D4 (ToolSearch's deferred_tools_delta), D5 (prompt caching prefix sensitivity), and D2 (session management with --resume).

### 2.5 Rules for Maximizing Cache Hits

| Rule | Why it matters | Cost of violation |
|------|---------------|-------------------|
| Never modify system prompt mid-session | Shifts byte-level prefix hash | 1.25× write cost on entire context |
| Never switch models mid-session | Caches are per-model; new model = cold start | Full context rebuild + 1.25× write |
| Never add/remove tools mid-session | Tool definitions are in the cached prefix | Prefix invalidation → full re-cache |
| Keep messages within 5-min TTL | Cache expires after 5 min of inactivity | Full cold start on next turn |
| Move the current date out of system prompt | Date string changes every day, invalidating cache (v2.1.42 tip) | Daily cold cache = full write cost every session start |
| Use `--exclude-dynamic-system-prompt-sections` | CLI flag (v2.1.98) strips volatile auto-injected sections (e.g., date headers) from system prompt for deterministic CI runs | N/A — opt-in flag |
| Disable unused MCP servers via `/mcp` | Each server adds tool schemas to prefix | Wasted prefix tokens every turn |
| Prefer CLI tools (gh, aws, gcloud) | No per-tool definition overhead in prefix | MCP tools add schema tokens |
| Use subagents for different-model tasks | Subagent uses separate API call — parent cache stays warm | Switching main model kills parent cache |

---

## 3. ToolSearch (Lazy Tool Loading)

### 3.1 Architecture

ToolSearch (shipped v2.1.7, January 2026) solves the "startup tax" problem where MCP tool definitions consumed tens of thousands of tokens before any work began. It activates automatically when total MCP tool descriptions exceed **10K tokens** (~10% of 200K context).

**Step-by-step flow:**

```
STARTUP:
  1. Build lightweight index: tool name + 1-line description per tool
  2. MCP tools marked defer_loading: true
  3. Sent to API as lightweight stubs (name + desc, no schema)
  4. Token cost: ~100 tokens/tool (vs ~500–2000 for full schema)

RUNTIME (when Claude needs a tool):
  5. Claude calls ToolSearch tool (regex or BM25 search variant)
  6. ToolSearch searches the catalog index
  7. Returns 3–5 most relevant tool matches
  8. Full definitions injected as tool_reference blocks

CRITICAL PLACEMENT:
  9. tool_reference blocks go into CONVERSATION HISTORY
     ├── NOT into the tool definitions prefix
     ├── Cached prefix hash stays UNTOUCHED
     └── ToolSearch + prompt caching work TOGETHER ✓
```

**Impact:** Token reduction of **85%+** in tool definition tokens. Tool selection accuracy actually *improved* (Opus 4.5: 79.5% → 88.1%) because Claude selects from a focused, relevant set rather than a massive list. The system supports up to **10,000 tools** in the catalog.

**CCA-F key point (frequently tested):** Discovered tool definitions go into conversation history, NOT the tool definitions prefix. This architectural choice means ToolSearch never invalidates the prompt cache. This is the most elegant design tradeoff in the system.

### 3.2 Configuration

ToolSearch is automatic by default — zero configuration needed. For servers where you always need tools immediately:

```json
{
  "mcpServers": {
    "critical-server": {
      "command": "...",
      "enableToolSearch": false    // tools loaded eagerly
    }
  }
}
```

Additional details: only MCP tools (`mcp__` prefix) are eligible for deferral; built-in tools (Read, Edit, Bash, Write, Glob, Grep, WebSearch, WebFetch) are never deferred. Tool descriptions and server instructions are capped at **2KB** (v2.1.84) to prevent OpenAPI-generated servers from bloating context.

**Skill description cap in `/skills` listing:** Individual skill descriptions shown in the `/skills` command output were capped at 250 characters in v2.1.86 to reduce context usage; this cap was raised to **1,536 characters** in v2.1.105.

**Vertex AI:** ToolSearch is disabled by default on Vertex AI to avoid an unsupported beta-header error. Opt in with `ENABLE_TOOL_SEARCH=1` (v2.1.119).

**v2.1.113 ranking fix:** ToolSearch now surfaces the correct tool when a pasted MCP tool name is used as the search query. Previously, sibling tools with overlapping descriptions could rank above the named tool.

### 3.3 ToolSearch Failure Modes

Claude can invoke ToolSearch using either a **regex variant** (`tool_search_tool_regex`) or a **BM25 variant** (`tool_search_tool_bm25`). Each has distinct failure modes.

**Regex variant (`tool_search_tool_regex`):**
- Claude constructs a Python `re.search()` pattern against tool names and descriptions
- **Failure:** Patterns longer than 200 characters are silently truncated, causing empty or wrong results with no error message
- **Fix:** Use short, high-entropy patterns: `(?i)finance|billing` not `(?i)financial_reporting|billing_management|invoice_processing`
- Prefer character classes and alternation over verbose literals

**BM25 variant (`tool_search_tool_bm25`):**
- Uses natural-language keyword ranking against the tool catalog
- **Failure:** When the MCP server name is long (e.g., `amazon-bedrock-agentcore-browser-mcp`), server-name tokens dominate BM25 scoring and crowd out capability keywords. A query like `amazon-bedrock-agentcore-browser-mcp navigate evaluate` returns `browser_navigate` and `browser_navigate_back` but misses `browser_evaluate` because the result limit (5) cuts off before it ranks
- **Fix:** Strip the server name prefix from your query entirely. Use just `navigate evaluate` or `browser evaluate page`

**Shared failure mode:** When neither variant returns the needed tool, Claude either attempts to call it by guessed name (fails with unknown tool) or halts and asks the user. Mitigation: keep tool descriptions distinct and keyword-rich; avoid tool names that differ only by suffix (`get_user`, `get_users`, `get_user_by_id` → `get_user_single`, `get_users_list`, `get_user_by_id`).

### 3.4 ToolSearch Lazy Loading (v2.1.7+)

ToolSearch defers loading rarely-used tool schemas until needed, reducing context overhead:

```
Before ToolSearch (v2.1.6 and earlier):
  Context: [system prompt] + [ALL tool schemas] + [CLAUDE.md] + [conversation]
  Tool schema overhead: ~3,000–8,000 tokens regardless of task

After ToolSearch (v2.1.7+):
  Context: [system prompt] + [ACTIVE tool schemas only] + [CLAUDE.md] + [conversation]
  Tool schema overhead: ~500–1,500 tokens (only loaded tools)
  On-demand: ToolSearch loads a tool schema when Claude needs it
```

**Efficiency gain:** 60–80% reduction in tool schema token overhead for typical sessions.

**How it works:**
1. Session starts with only core tools (Read, Write, Edit, Bash, Glob, Grep) loaded
2. When Claude needs a rarely-used tool, ToolSearch fetches its schema
3. `ToolSearchLoad` hook fires (can be monitored)
4. Tool schema added to context, tool becomes callable

**Implications for custom tools:** Register custom tools with ToolSearch for deferred loading.

---

## 4. Model Selection for Cost Optimization

### 4.1 Model Comparison

| Dimension | Opus 4.7 | Opus 4.6 (legacy) | Sonnet 4.6 | Haiku 4.5 |
|-----------|----------|------------------|------------|-----------|
| Input $/MTok | $5 | $5 | $3 | $1 |
| Output $/MTok | $25 | $25 | $15 | $5 |
| Cache read $/MTok | $0.50 | $0.50 | $0.30 | $0.10 |
| Context window | 1M | 1M | 1M | 200K |
| Max output | 128K | 64K / 128K | 64K / 128K | 64K |
| SWE-bench Verified | Step-change above Opus 4.6 | 80.8% | 79.6% | — |
| Thinking modes | Adaptive only (xhigh default) | low / med / high | low / med / high | Not supported |
| Fast mode | N/A | Yes (v2.1.36, Max/Team) | N/A | N/A |
| New tokenizer | Yes (up to 1.35× more tokens for same text) | No | No | No |
| Max image resolution | 2,576px long edge | 768px | 768px | 768px |
| Cost relative to Opus 4.7 | 1× | 1× | 0.6× (40% cheaper) | 0.2× (80% cheaper) |

> **Model IDs:** `claude-opus-4-7`, `claude-opus-4-6`, `claude-sonnet-4-6`, `claude-haiku-4-5-20251001`. Use `claude-opus-4-7` for new projects — Opus 4.6 is now legacy. Both share the same price ($5/$25 input/output per MTok).

**Fast mode for Opus 4.6 (v2.1.36):** Available to Max and Team tier users. Activates a faster, lower-latency processing path at premium pricing (6× standard rates). Toggle with `/fast on`. Not available for Opus 4.7.

**Sonnet handles ~90% of coding tasks** at 40% lower input cost than Opus 4.7/4.6. For most daily work, Sonnet 4.6 remains the recommended default.

### 4.2 The `opusplan` Alias

The single highest-ROI model strategy. It uses Opus only during Plan mode (design and architecture) and Sonnet for all implementation, managing cache implications internally:

```bash
claude --model opusplan
# In-session: /model opusplan
# Plan mode toggle: Shift+Tab×2 or /plan
```

This avoids the cache invalidation problem of manual model switching — `opusplan` routes specific turns to Opus while keeping the main session on Sonnet.

### 4.3 Subagent Model Routing

```bash
# Global default: all subagents use Haiku (~93% cheaper)
export CLAUDE_CODE_SUBAGENT_MODEL=haiku

# Main session on Opus for coordination
claude --model opus

# Per-subagent override in frontmatter:
---
name: security-scan
model: opus           # override for complex tasks
effort: high
---

# Priority: frontmatter > CLAUDE_CODE_SUBAGENT_MODEL > "inherit"
# Built-in Explore subagent uses Haiku by default
```

### 4.4 Output Tokens and Hidden Thinking Costs

Extended thinking tokens are allocated from the **output budget** and billed at **output rates** ($15–75/MTok). With `MAX_THINKING_TOKENS` defaulting to ~32K, a single complex turn on Opus costs $2.40 in thinking alone.

```bash
# Default: ~32K thinking → ~32K for code on 64K limit
# Optimized: 10K thinking → ~54K for code, ~70% less thinking cost
export MAX_THINKING_TOKENS=10000

# This is arguably the single highest-ROI environment variable.
# For one-off deep reasoning, include "ultrathink" in the prompt.
```

---

## 5. Effort Frontmatter

Effort levels control adaptive reasoning — dynamically allocating thinking tokens based on task complexity.

### `/effort` Command (v2.1.76)

The primary way to set effort in an interactive session:

```
/effort low      # Quick tasks: formatting, lookups, simple moves
/effort medium   # Most coding work
/effort high     # Complex debugging, architecture decisions
/effort xhigh    # Very hard problems (Opus 4.7 default)
```

**Interactive slider (v2.1.111):** When called without arguments, `/effort` opens an interactive slider with arrow-key navigation between effort levels. Can also be set via arrow keys in the `/model` picker. In **VS Code** (v2.1.72+), a colored indicator on the input border shows current effort level.

### `ultrathink` Keyword (v2.1.68)

Including `ultrathink` in a prompt triggers **maximum effort for that single turn only**, regardless of the session effort setting. Re-added in v2.1.68:

```
ultrathink: refactor the authentication module to use the repository pattern
```

Does not change the session effort level — subsequent turns revert to the session default. Equivalent to "think harder" in extended thinking token budget terms.

### Effort Level Reference

| Level | Approx. thinking tokens | Use cases | Token cost vs medium |
|-------|------------------------|-----------|---------------------|
| low | 0–500 (often skipped) | Formatting, linting, lookups, file moves | ~0–10% of medium |
| medium | 1K–8K (adaptive) | Most coding: features, tests, docs, refactoring | Baseline |
| high | 8K–32K | Complex debugging, architecture decisions | 2–4× medium |
| xhigh | 32K–80K (Opus 4.7 only) | Very hard problems, cross-system refactors | 5–10× medium |
| max | Up to model ceiling | Most open-ended problems; not session-persistent | Highest |

> **Note:** Token ranges are approximate and model-dependent. Adaptive thinking (see "Adaptive Thinking" subsection below) adjusts within these bands per-turn. `xhigh` is available on Opus 4.7 only. Use `ultrathink` in the prompt to request maximum reasoning depth for a single turn without changing the session level.

**Default effort by plan and model (as of v2.1.117):**

| User tier | Opus 4.6 / Sonnet 4.6 | Opus 4.7 |
|-----------|----------------------|---------|
| Pro / Max (CLI) | **high** (raised from `medium` in v2.1.117) | xhigh |
| API key / Team / Enterprise | high (raised in v2.1.94) | xhigh |
| Bedrock / Vertex / Foundry | high (raised in v2.1.94) | xhigh |

### Effort in Frontmatter

```yaml
# In skill frontmatter: .claude/skills/quick-format/SKILL.md
---
name: quick-format
description: Quick code formatting check
effort: low
---

# In agent frontmatter: .claude/agents/reviewer.md
---
name: code-reviewer
model: sonnet
effort: low
---
```

**`${CLAUDE_EFFORT}` in skill content (v2.1.120):** Skills can reference the current session effort level using the `${CLAUDE_EFFORT}` variable in their content. This allows skill descriptions or instructions to adapt to the active effort setting:

```markdown
---
name: smart-review
description: "Runs with ${CLAUDE_EFFORT} effort — adjusts depth automatically"
---
Review the diff. Current effort: ${CLAUDE_EFFORT}.
```

**Priority order:** `CLAUDE_CODE_EFFORT_LEVEL` env var (highest) → skill/agent frontmatter → session `/effort` command → model default. `ultrathink` in prompt text overrides for a single turn.

### 5.4 Adaptive Thinking (v2.1.74, February 9 2026)

Adaptive thinking lets Opus 4.6 and Sonnet 4.6 decide per-turn how many thinking tokens to spend, rather than using the fixed budget set by `MAX_THINKING_TOKENS`. It is the default mode since February 9, 2026.

**The February 2026 perception problem:** On the same day adaptive thinking launched, Anthropic also silently lowered the default effort from `high` to `medium` (March 3, 2026 for interactive sessions). Community analysis of 6,852 sessions measured a 67% drop in model reasoning depth compared to pre-February baselines. The culprit was the effort default change, not adaptive thinking itself.

**How adaptive thinking actually works:** Rather than always burning a fixed 32K thinking budget, the model scales thinking tokens to task complexity. A lookup uses ~500 tokens; a multi-file refactor might use 20K. At `high` effort, the ceiling is ~32K. At `xhigh` (Opus 4.7), ~80K.

**Key environment variables:**

```bash
# Revert to fixed thinking budget (Opus 4.6 / Sonnet 4.6 only — NOT Opus 4.7)
export CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1

# Set the fixed budget when adaptive is disabled
export MAX_THINKING_TOKENS=10000   # Default was ~32K before adaptive

# Restore effort to previous default for API users
export CLAUDE_CODE_EFFORT_LEVEL=high
```

> **Opus 4.7 note:** Opus 4.7 always uses adaptive reasoning. `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` has no effect on it. `MAX_THINKING_TOKENS` does not apply.

**Decision guide:**

| Symptom | Fix |
|---------|-----|
| Responses feel shallow / low reasoning depth | Raise effort: `/effort high` or `export CLAUDE_CODE_EFFORT_LEVEL=high` |
| Costs spiked after the v2.1.117 update (Pro/Max users) | Pro/Max default raised from `medium` → `high` in v2.1.117. Set `export CLAUDE_CODE_EFFORT_LEVEL=medium` to revert, or use `low` for simple tasks |
| Need deterministic token budgets for CI billing | `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1` + `MAX_THINKING_TOKENS=10000` |
| One-off deep reasoning on a specific turn | Add `ultrathink` to that prompt; leave session effort unchanged |

---

## 6. `--bare` Mode for CI and Scripted Calls

The `--bare` flag (v2.1.81, March 2026) creates a minimal, deterministic execution environment by skipping:

| Skipped | Why it matters |
|---------|---------------|
| All lifecycle hooks (see §12) | No hook execution overhead — PreToolUse, PostToolUse, PreCompact, SessionStart, etc. all skipped |
| LSP connections | No language server startup (~200-500ms) |
| Plugin sync | No marketplace git pull (~1-3s) |
| Skill directory walks | No .claude/commands/ scanning |
| MCP servers | No tool schema tokens in context |
| Auto-memory (MEMORY.md) | No memory file injection |
| CLAUDE.md files (entire hierarchy) | No per-turn CLAUDE.md cost |
| OAuth / keychain reads | No auth token refresh |

Available tools in bare mode: **only Bash, Read, and Edit**. Performance: **~14% faster to first API request** (official); community reports up to 10× faster. Will become the default for `-p` mode in a future release.

```bash
# Minimal CI diff review
git diff origin/main...HEAD | claude -p "Review this diff" \
  --bare --allowedTools "Bash(git:*),Read" --output-format json

# Add specific context when needed
claude -p "Fix lint errors" --bare \
  --append-system-prompt "Use ESLint from .eslintrc" \
  --mcp-config ./ci-mcp.json
```

---

## 7. CLAUDE.md Best Practices

### 7.1 Token Impact

CLAUDE.md files are injected into **every single API call** as input tokens. A 100-token unnecessary paragraph costs 5,000 tokens over a 50-turn session. The loading hierarchy:

```
1. Managed policy              ← IT-administered (cannot exclude)
2. Project ./CLAUDE.md          ← Repository root
3. User ~/.claude/CLAUDE.md     ← Personal global
4. Local ./CLAUDE.local.md      ← git-ignored overrides
5. Subdirectory CLAUDE.md       ← ON-DEMAND when files accessed
6. .claude/rules/ with paths    ← ON-DEMAND, scoped to directories
```

**Target: under 200 lines per file.** For each line, ask: "Would removing this cause Claude to make mistakes?" If not, cut it.

### 7.2 Optimization Techniques

| Technique | How | Impact |
|-----------|-----|--------|
| Move workflows to skills | `.claude/commands/` files load only when invoked | Saves tokens every non-skill turn |
| Use `.claude/rules/` with paths | Topic-specific rules load only for matching files | Scoped injection vs global |
| `@import` for modularity | `@path/to/file.md` — resolved relative to the importing file, not the working directory; max depth: 5 hops; depth 6 is silently ignored | Keep root CLAUDE.md lean |
| HTML comments `<!-- -->` | Stripped before injection into API calls | Zero token cost — free human notes |
| `claudeMdExcludes` setting | Skip irrelevant CLAUDE.md in monorepos | Avoid unrelated project instructions |
| `.claudeignore` | Like `.gitignore` — block build artifacts, lock files | Prevent accidental large file reads |

### 7.3 Recommended Structure (Anthropic's Scientific Computing Guide)

```markdown
# Project: MyProject

## Architecture
- FastAPI + ChromaDB + Voyage AI voyage-3.5 embeddings
- Claude Sonnet for generation, Haiku for intent classification
- Microsoft Presidio for PII detection

## Conventions
- API routes: /src/api/ | Tests: /tests/ | Lint: ruff check src/
- Run tests: pytest tests/ -x --tb=short

## Current Focus
- [ACTIVE] Hybrid search: BM25 + semantic + RRF
- [DONE] PII detection pipeline

## Known Failures (DO NOT RE-ATTEMPT)
- sentence-transformers: incompatible with Python 3.12
- rank_bm25 BM25Okapi: OOM on docs > 50K tokens
- ChromaDB batch upsert > 5000: silent data loss

# Compact Instructions
Preserve: API schema decisions, test commands, known failures
Discard: verbose debugging output, exploratory file reads
```

The **"Known Failures"** section prevents successive sessions from re-attempting dead ends. A separate CHANGELOG.md serves as portable long-term memory including failed approaches and why they didn't work.

---

## 8. Subagents vs. Agent Teams

| Dimension | Subagents (Task tool) | Agent Teams (Teammates) |
|-----------|----------------------|------------------------|
| Process model | Within parent session's process | Separate instances (2–16) |
| Context window | Scoped subset of parent | Own full 1M window each |
| Communication | Vertical only (→ parent) | Lateral (mailbox + shared task list) |
| Cost multiplier | ~1× (efficient) | ~3–7× (commonly ~5×) |
| Context inheritance | **NONE** — must explicitly pass all info | **NONE** — each independent |
| Best for | Focused subtasks, exploration, linting | Multi-file refactors, cross-layer features |

**CCA-F exam trap:** "Subagent inherits parent context" is **WRONG**. All information must be explicitly passed in the task description.

**CCA-F design principle:** Tool descriptions are the primary routing mechanism (not function names). Keep tools to 4–5 per agent for optimal selection accuracy.

### What "Explicitly Pass All Info" Means in Practice

A poorly-formed subagent prompt assumes the agent already knows context from the parent:

```
# BAD — agent has no idea what "the auth refactor" means or where files are
Task: Continue the auth refactor we discussed. Make sure tests still pass.
```

A well-formed subagent prompt is self-contained — a stranger could execute it:

```
# GOOD — every fact the agent needs is spelled out
Task: Refactor the JWT validation logic in src/auth/validator.ts.
Context: We are migrating from HS256 to RS256. The current implementation
is in validateToken() at line 47. The public key path is config/keys/rs256.pub.
Do NOT modify the token generation code in src/auth/generator.ts.
Tests are in tests/auth/validator.test.ts — run with `npm test auth` before finishing.
Success: All 14 existing tests pass and the function signature is unchanged.
```

Key fields to always include: file paths, function names, what NOT to change, how to run tests, and a concrete definition of "done".

### Cost-Efficient Agent Architecture

```
TIER 1 — Main session (opusplan or Sonnet)
  └── Coordination, architecture, task decomposition

TIER 2 — Subagents (Haiku or Sonnet per frontmatter)
  └── CLAUDE_CODE_SUBAGENT_MODEL=haiku (global default)
  └── ~1× cost (same process, scoped context)

TIER 3 — Agent Teams (only when lateral comms needed)
  └── 2–4 teammates max, ~3–7× cost
  └── Use isolation: "worktree" for parallel changes
```

---

## 9. Compaction System

### 9.1 Three-Layer Architecture

**Layer 1 — Microcompaction (automatic):** Large tool outputs are saved to disk; recent results stay inline ("hot tail"), older ones become disk references. Applies to Read, Bash, Grep, Glob, WebSearch, WebFetch, Edit, Write.

**Layer 2 — Auto-compaction:** Triggers at ~83.5% of window limit (configurable via `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`, values 1–100). Clears older tool outputs first, then summarizes conversation if still over threshold. Preserves user requests, key code, recent files, task state. After summary: re-reads recent files, restores todo list, re-injects CLAUDE.md from disk. **Circuit breaker** (v2.1.89): stops after 3 consecutive immediate-refill cycles.

**Layer 3 — Manual (`/compact`):** `/compact Focus on API changes` for guided preservation. `Esc+Esc` or `/rewind` for partial compaction. Customizable via `# Compact Instructions` in CLAUDE.md.

### 9.2 Idle-Return `/clear` Hint

After 75+ minutes idle, Claude Code suggests `/clear` with token savings displayed. Addresses the anti-pattern of resuming stale sessions where the 5-min cache TTL has expired. Bug fix in v2.1.92: now shows current context size (not cumulative session tokens).

### 9.3 Critical Compaction/Memory Fixes

| Bug | Impact | Fixed in |
|-----|--------|---------|
| Nested CLAUDE.md re-injected dozens of times | Massive token waste | v2.1.89 |
| Progress messages surviving compaction | Context bloat | v2.1.89 |
| Background subagents invisible after compaction | Duplicate agent spawning | v2.1.89 |
| Deferred tools losing input schemas | Unusable tools until re-discovery | v2.1.89 |
| Autocompact thrash loop | Infinite token burn | v2.1.89 (circuit breaker) |
| `--resume` truncating recent history | Lost context + cache miss | v2.1.92 |
| `--resume` full prompt-cache miss for users with deferred tools, MCP servers, or custom agents | ~20× cost increase per resumed turn | v2.1.93 |
| Edit/Write failing with "File content has changed" when a PostToolUse format-on-save hook rewrites file between consecutive edits | Broken hook + edit chain | v2.1.93 |
| PreCompact hook added | Hooks can now block or guide compaction behavior | v2.1.95 |
| Context token ceiling (`CLAUDE_CODE_MAX_CONTEXT_TOKENS`) | Hard cap prevents runaway context growth in CI | v2.1.96 |
| Auto mode not respecting explicit user boundaries ("don't push", "wait for X") | Unauthorized actions in auto mode | v2.1.93 |
| PreCompact hook `{"decision":"block"}` return format | Block compaction programmatically with structured response (previously only exit-code blocking) | v2.1.105 |
| Subscribers with `DISABLE_TELEMETRY=1` falling back to 5-minute cache TTL | Fixed — now correctly receives 1-hour TTL | v2.1.108 |
| `--resume` on 40MB+ sessions | 67% faster session resumption | v2.1.116 |
| "Extra usage required for long context" error during compaction in resumed sessions | Fixed | v2.1.113 |

### 9.4 Long-Running Sessions

Anthropic's scientific computing guide recommends tmux on a compute node for multi-day sessions:

```bash
tmux new-session -s claude-research
claude --model opus
# Detach: Ctrl+B, D | Reattach: tmux attach -t claude-research

# Best practices:
# 1. Commit after every meaningful unit of work
# 2. CHANGELOG.md = portable memory (including failed approaches)
# 3. Tests = continuous verification oracle
# 4. /compact with focus when context fills
# 5. /loop N for iterative tasks
```

**Auto-memory:** Stored in `~/.claude/projects/<project>/memory/MEMORY.md`. Truncated at 200 lines / 25KB at session start. Memory timestamps (March 2026) enable freshness reasoning.

### Compaction Decision Logic

```
  Every turn, Claude Code evaluates context usage:

  Context usage check
         │
         ▼
  Is usage > 83.5% of context window?
         │
    ┌────┴────┐
    │         │
   YES        NO ──► Continue normally
    │
    ▼
  AUTO-COMPACTION triggers
  (v2.1.89+ circuit breaker prevents thrash loop)
         │
         ▼
  PreCompact hook fires (optional — capture state before)
         │
         ▼
  Conversation summarized to ~20-30% of original size
  (CLAUDE.md sections survive intact — they reload fresh)
         │
         ▼
  Session continues with reduced context
         │
         ▼
  PostCompact hook fires (optional)

  Manual triggers:
  /compact              ──► immediate compaction
  /compact [focus]      ──► compaction with summary hint
  /rewind               ──► roll back without compacting

  Best practice: /compact at 70%, not 83.5% (keeps quality high)
```

---

## 10. Batch Processing & Scheduled Tasks

### 10.1 The `/batch` Skill

Orchestrates large-scale codebase changes through three phases:

**Phase 1 — Research & Plan:** Explore agents research scope → decompose into 5–30 units → present plan for approval.

**Phase 2 — Parallel Execution:** 1 background agent per unit in isolated git worktrees → implement → test → commit → push → open PR. Up to 10 parallel agents.

**Phase 3 — Tracking:** Live status table. Failed units don't affect others.

Runs **up to 10× faster** than sequential prompts. Best for migrations, convention enforcement, dependency swaps, test generation.

### 10.2 Cloud Scheduled Tasks

Created via `claude.ai/code/scheduled` or `/schedule`. Clones repo fresh each run, creates own session, operates from default branch. Minimum interval: 1 hour. CLI task expiry: 3 days. Each run = full session cost.

### 10.3 Cloud Auto-Fix

Subscribes to GitHub PR events. CI failure → investigate → fix → push → explain. Clear review comment → implement. Ambiguous → asks clarification. Each cycle = full API call.

---

### 10.4 New Power Commands (v2.1.101 → v2.1.126)

| Command | Version | Description |
|---------|---------|-------------|
| `/usage` | v2.1.118 | Merged `/cost` + `/stats`. Per-model breakdown, cache-hit accounting, plan limits. In VS Code opens native Account & Usage dialog. `/cost` and `/stats` remain as shortcuts |
| `/ultrareview [target]` | v2.1.111 | Cloud-based comprehensive code review using parallel multi-agent analysis. No args = review current branch changes; `/ultrareview <PR#>` = specific GitHub PR |
| `claude ultrareview [target]` | v2.1.120 | CLI/CI version of `/ultrareview` — prints to stdout, `--json` for raw output, exits 0 (clean) or 1 (issues found) |
| `/recap` | v2.1.108 | Manually invoke session recap. Also fires automatically when returning to a session after an absence. Opt out: `CLAUDE_CODE_ENABLE_AWAY_SUMMARY=0` |
| `/tui [fullscreen]` | v2.1.110 | Switch to flicker-free fullscreen rendering in the same conversation |
| `/team-onboarding` | v2.1.101 | Generate a teammate ramp-up guide from your local Claude Code usage patterns |
| `/less-permission-prompts` | v2.1.111 | Scans transcripts for common read-only Bash/MCP calls and proposes an allowlist for `.claude/settings.json` |
| `/undo` | v2.1.108 | Alias for `/rewind` — partial compaction back to a message checkpoint |
| `/loop [interval] [cmd]` | v2.1.71 | Run a prompt or slash command on a recurring interval. `/proactive` is an alias (v2.1.105) |
| `/branch` | v2.1.77 | Fork the current conversation into a new branch. Renamed from `/fork` (which still works as alias) |
| `/powerup` | v2.1.90 | Interactive lessons teaching Claude Code features with animated demos |
| `claude project purge [path]` | v2.1.126 | Delete all Claude Code state for a project (transcripts, tasks, file history, config). Supports `--dry-run`, `-y/--yes`, `-i/--interactive`, and `--all` flags |

---

## 11. Top 12 Cost Optimizations (Ranked by Impact)

| Rank | Optimization | Impact | Command | CCA-F Domain |
|------|-------------|--------|---------|-------------|
| 1 | Default to Sonnet 4.6 | 40% input cost reduction vs Opus 4.7/4.6 | `/model sonnet` | D2 |
| 2 | Set MAX_THINKING_TOKENS=10000 | ~70% reduction in thinking costs | `export MAX_THINKING_TOKENS=10000` | D2 |
| 3 | `/clear` between unrelated tasks | Prevents stale context compounding | `/clear` | D5 |
| 4 | Write specific prompts naming files | 3-turn vs 12-turn = 50K+ tokens | Name exact files + outcomes | D3 |
| 5 | Use opusplan alias | Opus design + Sonnet implementation | `/model opusplan` | D2 |
| 6 | Subagent model → Haiku globally | ~80% cheaper exploration vs Opus | `export CLAUDE_CODE_SUBAGENT_MODEL=haiku` | D1 |
| 7 | CLAUDE.md under 200 lines | Saves tokens every turn | Move to `.claude/commands/` | D2 |
| 8 | ToolSearch (automatic) | 85%+ reduction in tool tokens | Auto when MCP > 10K tokens | D4 |
| 9 | Effort: low for simple tasks | Skips thinking entirely | Frontmatter: `effort: low` | D2 |
| 10 | `--bare` for CI/scripts | ~14% faster, minimal overhead | `claude -p '...' --bare` | D2 |
| 11 | PostToolUse hooks for data filtering | Pre-filter large outputs before Claude sees them; community reports 40–70% cost reduction | `.claude/settings.json` hooks | D4 |
| 12 | Advisor before architecture decisions | Prevents costly rework from wrong approaches; call once before design, once before done | `advisor()` in session | D1 |

### 11.1 Cost Impact Visualization

```
  Cumulative savings by applying optimizations (approximate):

  Baseline: Opus 4.7 default, no caching, no optimization
  ─────────────────────────────────────────────────────────
  
  +1 Use Sonnet 4.6 for most tasks           → -40% total cost
  +2 MAX_THINKING_TOKENS=10000               → -42% of thinking cost
  +3 /clear between unrelated tasks          → -15% by reducing history size
  +4 Use Haiku 4.5 for subagents             → -93% per subagent call
  +5 opusplan alias (Opus plan, Sonnet impl) → -30% per planning-heavy session
  +6 CLAUDE.md under 200 lines              → -5% overhead
  +7 ToolSearch auto-deferred               → -85% on tool schema tokens
  +8 PostToolUse hooks (output pruning)     → -40-70% on tool results
  +9 Cache-friendly session structure       → -90% on cached prefix reads
  ─────────────────────────────────────────────────────────
  Total achievable: 60-85% cost reduction vs naive usage
  
  Reality check: you won't apply all 9 to every session.
  Sonnet + caching alone achieves ~55% reduction for most teams.
```

---

## 12. Hooks Reference

Hooks are user-defined shell commands (or scripts) that fire at specific points in Claude Code's lifecycle. They turn best-practice guidelines into deterministic enforcement — hooks always run; prompts sometimes work.

### 12.1 All Hook Events

Hooks fire at three cadences: **once per session**, **once per turn**, and **on every tool call** in the agentic loop.

| Event | Cadence | Blocking? | Key use cases |
|-------|---------|-----------|--------------|
| `SessionStart` | Per session | No | Load env vars, warm caches, re-inject context after compaction |
| `SessionEnd` | Per session | No | Cleanup, final reporting, summary logs |
| `UserPromptSubmit` | Per turn | Yes (exit 2) | Sanitize input, classify task type, route to skill |
| `PreToolUse` | Per tool call | **Yes (exit 2 or `{"decision":"block"}`)** | Security gates, file protection, mandatory review |
| `PostToolUse` | Per tool call | No | Format-on-save, lint, test runner trigger. Input now includes `duration_ms` (v2.1.119) |
| `PostToolUseFailure` | Per tool call (on failure) | No | Add diagnostic context for Claude's next step. Input now includes `duration_ms` (v2.1.119) |
| `Stop` | Per turn | Yes (return to keep going) | Enforce completion criteria before Claude stops |
| `StopFailure` | Per turn (API error) | No | Fires when turn ends due to API error (rate limit, auth failure) — v2.1.78 |
| `SubagentStop` | Per subagent | No | Validate subagent output before returning to parent |
| `PermissionRequest` | Per auto-mode check | Yes | Auto-approve/deny permission dialogs |
| `PermissionDenied` | Per auto-mode denial | Partial (`{retry: true}`) | Tell Claude it can retry after adjusting approach |
| `PreCompact` | Before compaction | Yes (exit 2 or `{"decision":"block"}`) | Block compaction; inject critical context that compaction would lose |
| `PostCompact` | After compaction | No | Re-inject state; reload environment |
| `ConfigChange` | On config file write | Yes | Enterprise security auditing; block unauthorized settings changes — v2.1.49 |
| `InstructionsLoaded` | When CLAUDE.md/rules loaded | No | React when instruction files are loaded into context — v2.1.69 |
| `Elicitation` | Per MCP elicitation request | Yes | Intercept MCP server structured input requests; auto-fill or transform — v2.1.76 |
| `ElicitationResult` | Per MCP elicitation response | Yes | Override elicitation responses before sent to MCP server — v2.1.76 |
| `WorktreeCreate` | On worktree creation | No | Custom VCS setup for isolated agent worktrees — v2.1.50 |
| `WorktreeRemove` | On worktree removal | No | Custom VCS teardown — v2.1.50 |
| `Setup` | Via `--init`/`--init-only`/`--maintenance` | No | Repository setup and maintenance operations — v2.1.10 |
| `TeammateIdle` | On teammate idle | Yes | Stop teammate: return `{"continue": false}` — v2.1.69 |
| `TaskCompleted` | On task completion | Yes | Validate task output before returning to parent — v2.1.69 |
| `Notification` | On alert | No | Slack/webhook routing; desktop notifications |
| `FileChanged` | On watched file change | No | Hot-reload, re-read config on disk changes |
| `CwdChanged` | On directory change | No | Reload env vars (direnv-style), switch project context |

**Additional notes:**
- Agent frontmatter `hooks:` now fire when running via `--agent` (v2.1.116)
- Hook source (settings/plugin/skill) is displayed in permission prompts (v2.1.75) for audit traceability

### 12.2 Hook Configuration

```json
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "bash /scripts/block-rm-rf.sh"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Edit",
      "hooks": [{
        "type": "command",
        "command": "npx prettier --write $CLAUDE_TOOL_ARG_FILE_PATH"
      }]
    }],
    "PreCompact": [{
      "matcher": "compact",
      "hooks": [{
        "type": "command",
        "command": "cat .claude/compact-context.md"
      }]
    }]
  }
}
```

**HTTP hooks (v2.1.63):** Call a remote webhook instead of a local script:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit",
      "hooks": [{
        "type": "http",
        "url": "https://my-service.com/webhook",
        "method": "POST"
      }]
    }]
  }
}
```

**MCP tool invocation from hooks (v2.1.118):** Hooks can invoke MCP tools directly without spawning a subprocess:

```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit",
      "hooks": [{
        "type": "mcp_tool",
        "server": "my-server",
        "tool": "format_code",
        "input": {"file": "$CLAUDE_TOOL_ARG_FILE_PATH"}
      }]
    }]
  }
}
```

**Conditional `if` field (v2.1.85):** Filter when a hook runs using permission-rule syntax:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "if": "Bash(git *)",
      "hooks": [{"type": "command", "command": "echo 'git call detected'"}]
    }]
  }
}
```

**`once: true` option:** Add `"once": true` to a hook definition to run it only once per session, regardless of how many times the event fires.

**Blocking a tool call (PreToolUse):**
- Exit with code `2`, or
- Return JSON `{"decision": "block", "reason": "explanation"}` — Claude sees the reason

**PreToolUse satisfying AskUserQuestion (v2.1.85):** A `PreToolUse` hook can satisfy `AskUserQuestion` by returning `updatedInput` alongside `"permissionDecision": "allow"`.

**PermissionDenied retry:**
- Return `{"retry": true}` — tells Claude it may try again with an adjusted approach

### 12.3 Token Cost Impact of Hooks

| Hook pattern | Token effect |
|-------------|-------------|
| PostToolUse grep/filter before injecting output | **Reduces** tokens — hook distills 10K-line log to 50 matching lines |
| PostToolUse that re-reads the edited file | **Adds** tokens — avoid unless the read is necessary |
| PreToolUse that always calls an LLM | **Adds** tokens per tool call — use shell scripts, not LLM calls, in hooks |
| `--bare` mode | **Skips all hooks** — use for CI where hooks add overhead without benefit |

Poorly written hooks (e.g., a PostToolUse that `cat`s a large file unconditionally) can compound cost worse than the tool itself. The `--bare` flag skips all hooks and is the correct choice for automated pipelines.

### 12.4 Hooks vs. Instructions

| Use hooks when | Use CLAUDE.md instructions when |
|---------------|--------------------------------|
| You need the behavior enforced every time, unconditionally | The guidance is probabilistic ("try to...") |
| The action is dangerous or irreversible | The guidance is stylistic or contextual |
| You want deterministic CI pipeline gates | The instruction rarely applies |
| Speed matters (hooks are faster than another Claude turn) | Flexibility and judgment are needed |

---

## 13. Environment Variables Reference

Consolidated reference for all token-cost-relevant environment variables. Variables marked ★ have the highest practical impact.

### Core Cost Controls

| Variable | Default | Effect |
|----------|---------|--------|
| ★ `CLAUDE_CODE_SUBAGENT_MODEL` | inherit | Override model for all subagents. Set to `haiku` globally for ~80% cost reduction on exploration tasks vs Opus 4.7/4.6 |
| ★ `MAX_THINKING_TOKENS` | ~32K | Fixed thinking budget when adaptive thinking is disabled. Lower to `10000` for ~70% thinking cost reduction |
| ★ `CLAUDE_CODE_EFFORT_LEVEL` | model/plan default | Highest-priority effort override. Values: `low`, `medium`, `high`, `xhigh`, `max`. Set `medium` to reduce costs vs the v2.1.117 default of `high` |
| `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` | unset | Set to `1` to revert Opus 4.6/Sonnet 4.6 to fixed `MAX_THINKING_TOKENS` budget. No effect on Opus 4.7 |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | 83.5 | Context fill % that triggers auto-compaction. Range: 1–100. Lower = more aggressive compaction |
| `CLAUDE_CODE_MAX_CONTEXT_TOKENS` (v2.1.96) | unset | Hard ceiling on context size. When combined with `DISABLE_COMPACT`, prevents context growth beyond the cap |
| `ENABLE_PROMPT_CACHING_1H` (v2.1.108) | unset | Opt into 1-hour prompt cache TTL for API key, Bedrock, Vertex, or Foundry. Replaces deprecated `ENABLE_PROMPT_CACHING_1H_BEDROCK` |
| `FORCE_PROMPT_CACHING_5M` (v2.1.108) | unset | Force 5-minute prompt cache TTL regardless of plan. Useful for CI where long-lived cache is unnecessary |

### Session and Execution Controls

| Variable | Default | Effect |
|----------|---------|--------|
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | model max | Cap output token budget per turn |
| `CLAUDE_CODE_SCRIPT_CAPS` (v2.1.96) | unset | Restricts script capabilities in Bash tool. Paired with PID namespace isolation on Linux |
| `CLAUDE_CODE_PERFORCE_MODE` (v2.1.96) | unset | Enables Perforce VCS mode instead of Git |
| `CLAUDE_CODE_USE_MANTLE` (v2.1.94) | unset | Set to `1` for Amazon Bedrock powered by Mantle |
| `AWS_BEARER_TOKEN_BEDROCK` | unset | Bearer token for Bedrock auth (replaces SigV4 in `CLAUDE_CODE_SKIP_BEDROCK_AUTH` mode) |
| `ENABLE_TOOL_SEARCH` (v2.1.119) | unset | On Vertex AI, ToolSearch is off by default; set to `1` to opt in |
| `DISABLE_UPDATES` (v2.1.118) | unset | Completely blocks all update paths including manual `claude update`. Stricter than `DISABLE_AUTOUPDATER` |
| `CLAUDE_CODE_ENABLE_AWAY_SUMMARY` (v2.1.108) | 1 (on) | Set to `0` to opt out of the automatic session recap when returning after an absence |
| `CLAUDE_CODE_FORK_SUBAGENT` (v2.1.121) | unset | Set to `1` to enable fork subagent mode in non-interactive sessions |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` (v2.1.4) | unset | Disables all background task functionality including auto-backgrounding and Ctrl+B |
| `CLAUDE_CODE_SIMPLE` (v2.1.50) | unset | Fully minimal — disables MCP tools, attachments, hooks, CLAUDE.md, skills, session memory, and custom agents |
| `CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK` (v2.1.83) | unset | Disable non-streaming fallback when streaming fails |
| `CLAUDE_CODE_DISABLE_1M_CONTEXT` (v2.1.50) | unset | Disable 1M context window support (forces 200K cap) |
| `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` (v2.1.83) | unset | Set to `1` to strip Anthropic/cloud credentials from subprocess environments (Bash tool, hooks, MCP stdio) |
| `ANTHROPIC_CUSTOM_MODEL_OPTION` (v2.1.78) | unset | Add a custom entry to the `/model` picker. Also supports `_NAME` and `_DESCRIPTION` suffix variants |
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | — | Control the `sonnet` model alias used by Claude Code |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | — | Control the `opus` model alias used by Claude Code |
| `CLAUDE_CODE_USE_POWERSHELL_TOOL` (v2.1.111) | platform default | Enable PowerShell tool (opt-in on non-Windows, opt-out on Windows) |
| `AI_AGENT` (v2.1.120) | set automatically | Automatically set for subprocesses so `gh` and other tools can attribute traffic to Claude Code |

### Observability and Telemetry

| Variable | Default | Effect |
|----------|---------|--------|
| `DISABLE_TELEMETRY` | unset | Set to `1` to opt out of usage telemetry. Note: previously caused 5-min cache TTL fallback — fixed in v2.1.108 |
| `DISABLE_ERROR_REPORTING` | unset | Set to `1` to suppress crash report uploads |
| `CLAUDE_CODE_ENABLE_TELEMETRY` | unset | Enable structured telemetry output (OpenTelemetry) |
| `OTEL_*` | — | Standard OpenTelemetry transport/logging env vars; used for forwarding metrics to external observability stacks |
| `OTEL_LOG_USER_PROMPTS` (v2.1.101) | unset | Gate to emit user prompt text in OTel spans. Requires `CLAUDE_CODE_ENABLE_TELEMETRY=1` |
| `OTEL_LOG_TOOL_DETAILS` (v2.1.85) | unset | Gate to emit tool parameter details in OTel events |
| `OTEL_LOG_TOOL_CONTENT` (v2.1.101) | unset | Gate to emit full tool result content in OTel spans |
| `MAX_STRUCTURED_OUTPUT_RETRIES` | 3 | Retry limit for structured output format recovery |

### Quick-Start `.env` for Cost-Optimized Interactive Sessions

```bash
# Reduce from the v2.1.117 high default if costs are too high
export CLAUDE_CODE_EFFORT_LEVEL=medium

# Set thinking budget ceiling (applies when adaptive thinking is off)
export MAX_THINKING_TOKENS=10000

# Route all subagents to Haiku (~80% cheaper vs Opus 4.7/4.6)
export CLAUDE_CODE_SUBAGENT_MODEL=haiku

# Compact at 75% instead of 83.5% for faster headroom recovery
export CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=75

# Opt into 1-hour cache TTL on API key / Bedrock / Vertex / Foundry
export ENABLE_PROMPT_CACHING_1H=1
```

### Quick-Start for CI / `--bare` Pipelines

```bash
# Deterministic fixed budget — no adaptive thinking
export CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1
export MAX_THINKING_TOKENS=5000

# Hard context ceiling — prevents runaway cost in long CI runs
export CLAUDE_CODE_MAX_CONTEXT_TOKENS=80000

# Use --bare to skip hooks, MCP, CLAUDE.md, memory
claude -p "Review this diff for security issues" --bare \
  --allowedTools "Read,Bash(git diff:*)" \
  --output-format json
```

---

## 14. The `/advisor` Slash Command — Day-to-Day Workflow

### The /advisor Command — Dual-Model Efficiency

`/advisor` routes complex reasoning questions to Opus while Sonnet handles execution:

```
Sonnet 4.6 (executor):         Cost: ~$3–15/M tokens
  ↓ periodic snapshots
Opus 4.7 (advisor):            Cost: ~$15–75/M tokens (but rarely)
```

**When to use /advisor:**
- Architecture decisions: "How should I structure this?"
- Complex debugging: "Why is this test flaky?"
- Strategic planning: "What's the best approach for X?"
- Code review: "Are there subtle security issues here?"

**Cost comparison (1000-turn session):**
| Mode | Est. cost | Quality |
|------|----------|---------|
| Haiku only | ~$0.50–2 | Basic tasks |
| Sonnet only | ~$5–15 | Standard work |
| /advisor (Sonnet + Opus reviews) | ~$15–30 | Complex decisions |
| Opus only | ~$50–150 | Maximum quality |

**Activate:**
```bash
/advisor          # Toggle on
/advisor now      # Force immediate Opus consultation
/advisor off      # Turn off
```

### 14.1 What `/advisor` Actually Is

Typing `/advisor` in Claude Code invokes the built-in advisor skill, which causes Claude to call the `advisor()` tool internally. No parameters, no configuration. What happens immediately:

1. The **entire conversation transcript** is bundled — every message you sent, every tool call Claude made, every file it read, every result it saw, every reasoning step it took
2. That full bundle is forwarded to an **Opus-tier reviewer model** — a stronger model than the one running your session
3. The reviewer reads the complete arc of the session with no investment in the current approach
4. It returns **one focused message** — a critique, a corrected plan, flagged assumptions, missing constraints, or validation that the current approach is sound
5. That message lands in your active session context. Claude continues with the reviewer's feedback fully visible

The reviewer model does not hold a back-and-forth conversation with you. It makes one pass, one response. If you need a second review after acting on its feedback, type `/advisor` again.

**What makes it architecturally different from a second Claude turn:** A normal follow-up message runs through the same reasoner with the same biases and the same blind spots. The advisor is a different model reading the same transcript cold. It has not been building up an investment in the approach that is currently failing.

---

### 14.2 Two Ways `/advisor` Gets Invoked

#### You type `/advisor` explicitly

Direct user control at deliberate checkpoints:

```
# You orient (read files, explore), then before you write:
/advisor

# Claude is mid-task and stuck:
/advisor

# Claude says "task complete" — gate before you accept:
/advisor
```

You can also embed the trigger in your prompt so Claude calls it automatically:

```
Refactor the auth module. Check with advisor before writing any code.
```

```
Audit the migration. Use advisor before declaring done.
```

#### Claude calls `advisor()` internally (auto-trigger)

Four conditions cause Claude to trigger the advisor without you typing anything:

| Trigger | What it looks like in the session | Why it fires |
|---------|----------------------------------|-------------|
| **Task completion gate** | Claude believes it is done; calls advisor before declaring success | Catches gaps between what was asked and what was delivered |
| **Decision uncertainty** | Claude hits a choice it is not confident about mid-task | Prevents low-confidence decisions from compounding downstream |
| **Recurring error / non-convergence** | Same fix attempted 3+ times; tests keep failing; bouncing between two approaches | Current reasoning is in a loop; a fresh perspective is needed |
| **Multi-phase checkpoint** | Long tasks with an internal todo list; advisor called at phase boundaries | Validates each phase output before the next phase builds on it |

**Important session behavior:** The advisor's response persists in session context. Later advisor calls — whether auto or explicit — can see earlier advice. This creates an accumulating review thread inside the session rather than isolated one-off checks.

**Purpose:** Catch reasoning errors, surface overlooked constraints, and provide a second opinion before Claude commits to an approach — especially on decisions that are hard to reverse or expensive to redo.

---

### 14.3 How `/advisor` Improves Claude's Next Response

This is the primary value. The reviewer's message changes what Claude does immediately after.

#### The cold-reader effect

The advisor model reads your session with no accumulated context bias. Claude, running turn-by-turn, can drift — a wrong assumption in turn 3 shapes every turn after it. The advisor sees turn 3 and turn 27 simultaneously and can say: "The problem started here."

After a well-targeted advisor call, Claude's next response typically shows:

- **Re-anchoring to the original task** — the advisor pulls Claude back to what was actually asked, not what Claude decided the task should be
- **Constraint recovery** — requirements stated early and drifted out of focus are re-introduced into the active reasoning
- **Approach correction** — if the advisor identifies the current strategy as wrong, Claude's next response is built on the corrected approach rather than doubling down
- **Specificity increase** — vague plans become concrete; "I'll refactor this" becomes "I'll change `validateToken()` at line 47 because the null-check is missing before the expiry comparison"

#### What the advisor catches that Claude cannot catch alone

| Failure class | Why Claude misses it | Why the advisor catches it |
|--------------|---------------------|--------------------------|
| Requirement drift | Claude weights recent turns more heavily than early instructions | Advisor reads early and late turns with equal attention |
| Sunk-cost continuation | Claude built several turns on an approach and keeps refining it | Advisor has no investment in the existing approach |
| False completion | Output matches Claude's interpretation, not the original request | Advisor reads your original request and compares it to the actual output |
| Missing constraints | A constraint stated once at turn 2 is no longer prominent by turn 20 | Advisor sees every turn simultaneously |
| Wrong-level abstraction | Claude solves the symptom, not the root cause | Advisor sees the full diagnostic trail and identifies the actual failure point |

#### Real session pattern

From community testing (Sonnet 4.6 as main, Opus 4.6 as advisor):

> "When Sonnet hit the stall pattern on the third pass of the billing fix, it called Opus through `/advisor`. The advisor came back with a two-paragraph analysis that read like a senior engineer's code review — specific, pointing at the exact function, explaining why. Sonnet's next response was completely restructured: different approach, different file targets, and it worked on the first try."

The advisor does not rewrite code. It changes Claude's **reasoning frame** before the next implementation attempt.

---

### 14.4 How `/advisor` Improves Your Prompts Going Forward

This is the compounding benefit most developers miss. The advisor's feedback is not just a one-session fix — it is a **prompt quality signal** you can act on permanently.

#### Reading advisor feedback as prompt diagnosis

When the advisor flags things like:

| Advisor says | What it reveals about your prompt |
|-------------|----------------------------------|
| *"It's unclear whether X or Y should take priority"* | Your prompt was ambiguous on that axis — add explicit priority |
| *"Claude attempted to modify Z, which was not part of the request"* | Your prompt did not scope what was out of bounds — add "do NOT change" clauses |
| *"The definition of done is not specified"* | Your prompt had no acceptance criteria — define what "done" looks like |
| *"The file paths are not named; Claude is guessing"* | Your prompt assumed implicit knowledge — name exact files and functions |
| *"It is unclear whether tests should be updated or kept as-is"* | Your prompt did not specify test modification policy |

Each of these is directly actionable in future prompts for similar tasks.

#### The transformation that emerges over repeated sessions

| Before `/advisor` | After repeated `/advisor` sessions |
|------------------|----------------------------------|
| "Refactor the auth module" | "Refactor `src/auth/validator.ts` — specifically `validateToken()` at line 47. Do NOT modify `generator.ts`. Tests in `tests/auth/validator.test.ts`, run with `npm test auth`. Done when all 14 tests pass and the function signature is unchanged." |
| "Fix the bug" | "Fix the null-pointer in `UserService.getById()` at line 83. Stack trace: [X]. Root cause is [Y]. Do not change the public interface." |
| "Make the tests pass" | "Make `tests/api/users.test.ts:114` pass. Test expects 404 for unknown users; current implementation returns 500. Only change `src/api/users.ts`." |

The pattern: **general intent → self-contained specification**. The advisor enforces this by flagging every gap. Over time, you pre-fill those gaps before Claude even starts — the advisor teaches you to write prompts that make advisor calls less necessary.

#### What to extract from each advisor session

After each advisor call, ask yourself:
1. What did the advisor flag as ambiguous? → add that detail to your template for similar tasks
2. What constraint did the advisor identify as missing? → add explicit "do NOT" clauses next time
3. What question did the advisor raise that you should have answered upfront? → make it a standard field
4. What gap existed between "Claude thinks it is done" and "actually done"? → write acceptance criteria explicitly

---

### 14.5 Token Efficiency — Cost vs. Upstream Savings

`/advisor` costs tokens. Understanding when it saves more than it costs is the core efficiency question.

#### What an advisor call costs

The advisor sends your entire conversation as input, billed at Opus-tier input rates (since the reviewer is Opus-tier):

| Session size | Approx. input tokens sent | Cost character |
|-------------|--------------------------|---------------|
| 5-turn short task | ~10K–30K tokens | Low — advisor is affordable |
| 20-turn medium task | ~60K–120K tokens | Moderate — justified for non-trivial decisions |
| 50-turn long task | ~200K–400K tokens | Significant — reserve for high-stakes moments |

#### What an advisor call prevents

The cost question is not "how much does the advisor call cost?" It is "how much does the wrong approach cost without it?"

| Failure prevented | Rework cost without advisor | Net |
|------------------|-----------------------------|-----|
| Wrong architecture caught at turn 5 | 20–40 turns of rework × compound context growth | Large positive |
| False completion caught before acceptance | Full debugging session to find what is missing | Moderate positive |
| Recurring error loop broken | 5–10 more failed attempts × context bloat | Moderate positive |
| Correct approach confirmed (no issue found) | 0 rework | Negative (insurance cost only) |

**Real session data:** In a community-reported session — 42 Sonnet 4.6 turns with 6 advisor calls to Opus 4.6 — total cost came out cheaper than running 42 pure Opus turns for the same session. The advisor calls were individually expensive, but the session was shorter because wrong-turns were cut off early.

#### The ROI breakeven rule

An advisor call pays for itself if it prevents **more than 3–5 additional turns of rework**. On any non-trivial task this threshold is easy to cross. The advisor is a poor investment only when:

- The session is very short (advisor cost approaches total session cost)
- The next step is mechanically dictated by tool output you just read — no decision to review
- You are calling it after every tool result — over-invocation adds cost without corresponding quality improvement

#### When the ROI is reliably positive

```
Task is non-trivial (more than ~5 turns expected)      → call before writing
Architecture or design decision is involved            → call before committing
The same approach has failed twice                     → call immediately
Task scope feels ambiguous                             → call before any implementation
About to do something irreversible                     → call without exception
Claude says it is done on a complex task               → call as a completion gate
```

---

### 14.6 The Model Pairing Reality

In Claude Code, your session model is paired with an Opus-tier reviewer for advisor calls. The pairing direction matters fundamentally:

| Session model | Advisor (reviewer) | Quality of review |
|--------------|-------------------|------------------|
| Sonnet 4.6 (recommended daily driver) | Opus-tier | Strong — catches what a capable but lighter model misses |
| Opus 4.6 | Opus-tier | Peer-level — useful for confirmation and constraint recovery |

**The pairing asymmetry:** A stronger reviewer auditing a lighter executor is the correct direction. The inverse does not work — a lighter model reviewing a heavier model's architecture decision is like a junior engineer reviewing a senior engineer's design. The advisor only adds value when it is at least as capable as the session model.

**Why `/opusplan` and `/advisor` complement each other:** With `opusplan`, Opus handles Plan mode (design turns) and Sonnet handles implementation. `/advisor` then reviews Sonnet's implementation against the Opus-authored plan. This creates a full quality loop: **design by Opus → implement by Sonnet → review by Opus via advisor** — all within one session, with cache implications managed internally by `opusplan`.

---

### 14.7 Practical Patterns for Daily Development

#### Pattern 1 — The orientation gate (highest ROI)

```
You: [describe the task]
Claude: [reads files, explores codebase]
You: /advisor
Advisor: [flags wrong assumptions; confirms or redirects the approach]
Claude: [implements on the corrected foundation]
```

The gap between "what Claude thinks it found" and "what the codebase actually requires" is where the most expensive wrong-turns originate. Cutting that gap before implementation is the single highest-value use of `/advisor`.

#### Pattern 2 — The completion gate

```
Claude: "I've completed the refactor. All tests pass."
You: /advisor
Advisor: [compares original requirement to actual output; surfaces gaps]
You: [accept or redirect]
```

Claude cannot reliably verify its own completion because it has been building toward its interpretation of the requirement. The advisor reads the original request and the output side-by-side.

#### Pattern 3 — The loop-breaker

```
[Claude has tried the same fix 2–3 times; tests still failing]
You: /advisor
Advisor: [identifies the actual root cause; points to the turn where the wrong assumption was made]
Claude: [implements the corrected approach from the right starting point]
```

The advisor has no reason to continue down the same path. It will often identify that the problem is upstream of where Claude is looking.

#### Pattern 4 — Embedded in the prompt (semi-autonomous)

```
You: Refactor the payment module. Use /advisor before writing any
     code, and use /advisor again before telling me you are done.
```

Pre-programs two review gates without requiring you to watch the session.

#### Pattern 5 — The reconciliation call

```
You: /advisor
Advisor: [says approach X is wrong; recommends Y]
Claude: [has test evidence that X actually works]
You: /advisor
     "Advisor said X is wrong. But the test at line 47 proves X works.
      Which constraint breaks the tie?"
Advisor: [reconciles; identifies what it missed or confirms the test is insufficient]
```

Never silently switch approaches when advisor feedback conflicts with primary-source evidence. Surface the conflict explicitly in a second call.

---

### 14.8 When to Use vs. When to Skip

| Use `/advisor` | Skip `/advisor` |
|---------------|----------------|
| Before writing code on a task longer than ~5 turns | Short reactive tasks where the next step is dictated by what you just read |
| Before any irreversible action (delete, force push, schema migration) | After every single tool call — over-invocation adds cost without improving decisions |
| When the same error has occurred twice | When you have primary-source evidence (file content, passing test, stack trace) that already resolves the question |
| When requirements feel ambiguous before starting | When the session is very short and advisor cost approaches total session cost |
| Before accepting Claude's "done" on complex tasks | When you just need Claude to continue mechanical execution |
| When you are changing approach mid-task | — |

---

### 14.9 What `/advisor` Is Not

| Misconception | Reality |
|--------------|---------|
| A chat partner for follow-up questions | One-shot reviewer per call — one message back. Type `/advisor` again for a second pass |
| A replacement for running tests | Reviews reasoning and approach; does not execute code |
| Always correct | Can be wrong, especially if it underweights tool evidence. Surface conflicts explicitly rather than switching silently |
| Free to call any time | Token-significant on large sessions — costs scale with session size |
| Only useful when stuck | Most valuable *before* a wrong approach is implemented — prevention, not just recovery |

---

## 15. CCA-F Exam Relevance

**Structure:** 60 questions in 120 minutes. 6 scenarios available, 4 randomly selected per sitting.

**Domain weights:** D1 Agentic Architecture (25%), D2 Claude Code Config (20%), D3 Prompt Engineering (20%), D4 Tool Design & MCP (20%), D5 Context Management (15%).

**Key exam principles:**

The exam rewards **programmatic enforcement over prompt-based guidance** — hooks, gates, and interceptors are deterministic while prompts are probabilistic.

**Frequently tested concepts from this guide:**

1. Subagents do NOT inherit context — all information must be explicitly passed
2. Tool descriptions are the primary routing mechanism, not function names
3. Keep tools to 4–5 per agent for optimal selection accuracy
4. ToolSearch places tool_reference blocks in conversation history (not prefix)
5. The Batch API is a latency trade with 50% savings but no SLA
6. Prompt caching is per-model — switching models invalidates the cache
7. CLAUDE.md loads into every API call — bloated files compound cost
8. The `--resume` bug connected ToolSearch, caching, and session management
9. Auto-compaction triggers at ~83.5% with a circuit breaker after 3 thrash loops
10. `opusplan` routes Plan-mode turns to Opus while keeping main session on Sonnet
11. **Blocking hooks:** `PreToolUse`, `PreCompact` (via `{"decision":"block"}`), `ConfigChange`, `Elicitation`, and `ElicitationResult` can all block actions. `UserPromptSubmit` blocks via exit 2. `Stop` blocks by returning a keep-going signal. `TeammateIdle` and `TaskCompleted` are also blocking. Not all hooks are observational-only.
12. `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1` does NOT apply to Opus 4.7
13. ToolSearch regex patterns >200 chars are silently truncated — use short high-entropy patterns
14. 1-hour cache write tier (2.0×) is for Pro/Max subscribers on likely-reused prefixes; API key, Bedrock, Vertex, Foundry users get 5-minute (1.25×) by default unless `ENABLE_PROMPT_CACHING_1H=1` is set (v2.1.108)
15. The advisor() tool forwards the entire conversation — most valuable before approach crystallization and before declaring done
16. `/usage` (v2.1.118) is the primary session cost monitoring command; `/cost` and `/stats` remain as shortcuts
17. Opus 4.7 is the new primary model: `claude-opus-4-7`; same price as Opus 4.6 ($5/$25 MTok); xhigh effort is default for ALL plans; uses a new tokenizer (up to 1.35× more tokens for same text)
18. Default effort for Pro/Max users on Opus 4.6/Sonnet 4.6 changed from `medium` → `high` in v2.1.117
19. ToolSearch disabled by default on Vertex AI — opt in with `ENABLE_TOOL_SEARCH=1` (v2.1.119)
20. `PostToolUse` and `PostToolUseFailure` hook inputs now include `duration_ms` field (v2.1.119)
21. Hooks can invoke MCP tools directly via `"type": "mcp_tool"` (v2.1.118) — no subprocess needed
22. `claude project purge [path]` (v2.1.126) deletes all Claude Code project state (transcripts, tasks, file history, config); supports `--dry-run`
23. Skill descriptions in `/skills` listing capped at 1,536 characters (raised from 250 in v2.1.105)
24. Opus 4.7 tokenizer change: same text may use up to 35% more tokens than on earlier models — account for this in context budget estimates

---

## 16. Token Budget Visualization

### 16.1 Per-Session Token Stack

Every Claude Code session builds a "token stack" that grows with each turn. This ASCII diagram shows a typical 50-turn coding session consuming a 200K context window:

```
200K tokens ┤
            │  ░░░░░░░░░░░░░░░░░░ HEADROOM (buffer for tools + output)
            │  ░░░░░░░░░░░░░░░░░░  ~33K–45K reserved
170K tokens ┤──────────────────────────────────────────────────────
            │  ████████████████████ CONVERSATION HISTORY (grows!)
            │  ████████████████████  ~3K–8K tokens per turn average
            │  ████████████████████  Grows linearly: 50 turns ≈ 150K–250K
            │  ████████████████████
            │  ████████████████████
 40K tokens ┤──────────────────────────────────────────────────────
            │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ STABLE PREFIX (cached, cheap)
            │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  Tool definitions:  ~8K
            │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  System prompt:      ~4K
            │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  CLAUDE.md stack:    ~6K typical
            │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  Rules + memory:     ~4K
  0K tokens ┤──────────────────────────────────────────────────────

Legend:  ▓ = Prompt-cached (read at 0.1× or 0.2× cost)
         █ = Conversation history (full input cost unless cached)
         ░ = Reserved headroom (not billed)
```

**Insight:** The stable prefix (~22K tokens) is written once per session and cached; every subsequent turn pays only the cache-read price for it. The conversation history dominates cost on long sessions — compaction reclaims this space.

### 16.2 Context Growth Per Turn

```
Tokens added per turn (representative values):

Turn type                         Input added    Output added
─────────────────────────────────────────────────────────────
Simple question + answer           ~500 in        ~300 out
File read (1K line file)          ~2,000 in       ~500 out
Bash command + output             ~800 in        ~200 out
Edit tool call (medium file)      ~3,000 in      ~1,200 out
Multi-file read + analysis        ~8,000 in      ~2,000 out
SubAgent task result              ~5,000 in         0 out
─────────────────────────────────────────────────────────────
50-turn active session total:  ~75K–200K in   ~15K–40K out
```

**Rule of thumb:** At $3/MTok (Sonnet 4.6), a 100K-input 20K-output session costs:
- Without caching: (100K × $3) + (20K × $15) / 1,000,000 = **$0.60**
- With 80% cache hit: (20K × $3 + 80K × $0.30 + 20K × $15) / 1,000,000 = **$0.42** (30% saving)

### 16.3 Token Budget by File Type

```
File Type                  Typical Tokens    Loaded When
──────────────────────────────────────────────────────────────────
Tool schemas (built-in)        ~8,000         Every turn (prefix)
System prompt                  ~4,000         Every turn (prefix)
CLAUDE.md (root, typical)      ~2,000         Every turn (prefix)
CLAUDE.md (verbose)           ~10,000         Every turn — DANGER
Rules (global)                 ~1,500         Every turn (prefix)
MEMORY.md (auto-memory)        ~3,000         Every turn (prefix)
Path-scoped rules              ~1,000         On directory change
Skill content                  ~2,000         When skill invoked
MCP server instructions        ~1,000 each    Per connected server
──────────────────────────────────────────────────────────────────
Total stable prefix budget:  ~20K–35K        Lower = more savings
```

**Budget discipline:** Every 1,000 tokens added to CLAUDE.md costs ~$0.003/session at Sonnet 4.6 rates — but multiplied across 100 engineers × 10 sessions/day = **$3/day for 1K tokens**. Keep CLAUDE.md under 2,000 tokens; use `@import` for specialized content.

---

## 17. Prompt Caching — Calculation Examples

### 17.1 Example 1 — Small Project (5 engineers, 30 sessions/day)

```
Setup:
  CLAUDE.md:              1,500 tokens
  Rules (3 files):        2,000 tokens
  Tool schemas:           8,000 tokens
  System prompt:          4,000 tokens
  Total stable prefix:   15,500 tokens ≈ 15K tokens

Per session:
  Cache write (first turn):   15K × $0.30/MTok  =  $0.0045
  Cache read (turns 2–30):    15K × $0.03/MTok × 29 = $0.013
  Conversation (30 turns):   ~90K × $3/MTok     =  $0.27
  ─────────────────────────────────────────────────────────
  Session cost with caching:                       $0.288

Without caching (every turn pays full input):
  30K prefix × 30 turns × $3/MTok = $0.027 prefix only
  Session cost without caching:                    $0.315

Daily savings (5 engineers × 30 sessions):
  With caching:    5 × 30 × $0.288 = $43.20/day
  Without caching: 5 × 30 × $0.315 = $47.25/day
  Saving: ~8.5% on stable prefix ($4.05/day)
```

### 17.2 Example 2 — Enterprise Monorepo (50 engineers, 5 sessions/day)

```
Setup:
  CLAUDE.md stack (3 levels):   8,000 tokens
  Rules (10 files):             6,000 tokens
  MCP server instructions:      3,000 tokens (3 servers)
  Tool schemas:                 8,000 tokens
  System prompt:                4,000 tokens
  Total stable prefix:         29,000 tokens ≈ 29K tokens

Per session (1-hour active, 80 turns):
  Cache write (first turn):    29K × $0.30/MTok    = $0.0087
  Cache reads (turns 2–80):    29K × $0.03/MTok × 79 = $0.069
  Conversation (80 turns):    240K × $3/MTok       = $0.72
  Output (80 turns):           48K × $15/MTok      = $0.72
  ──────────────────────────────────────────────────────────
  Session cost with caching:                        $1.518

Without caching:
  29K prefix × 80 turns × $3/MTok = $6.96 prefix cost alone
  Session cost without caching:                     $8.40

Monthly saving (50 engineers × 5 sessions × 22 days):
  With:     50 × 5 × 22 × $1.518 = $8,349/month
  Without:  50 × 5 × 22 × $8.40  = $46,200/month
  Saving: 82% ($37,851/month) — caching is critical at scale
```

### 17.3 Caching Decision Guide

```
Should you optimize for caching?

Total daily sessions > 100?
├── YES → High priority — savings compound quickly
└── NO  ┐
        │
        ▼
CLAUDE.md size > 5K tokens?
├── YES → Refactor to @import pattern immediately
└── NO  → Standard caching adequate

Sessions typically > 30 turns?
├── YES → Enable 1-hour cache TTL (ENABLE_PROMPT_CACHING_1H=1)
└── NO  → 5-minute TTL sufficient (default)

Using Opus 4.7?
├── YES → Account for 1.35× tokenizer inflation in budget estimates
└── NO  → Standard estimates apply
```

---

## 18. Context Management Playbook

### 18.1 Session Lifecycle Management

Managing context actively across a session prevents hitting the 200K limit unexpectedly:

```
SESSION START
│
├── /memory — verify memory files loaded correctly
├── /usage  — check baseline token count
└── Begin work

DURING SESSION (every ~20 turns or at natural task boundary)
│
├── /usage — check current token consumption
│    │
│    ├── < 40% used   → Continue normally
│    ├── 40–70% used  → Consider subagents for large subtasks
│    ├── 70–83% used  → Plan next compaction point
│    └── > 83% used   → Auto-compaction imminent (cannot prevent)
│
└── At task completion:
     ├── Summarize progress in MEMORY.md manually if critical
     └── /compact — trigger manual compaction if context nearing limit

SESSION END
│
├── Update MEMORY.md with session outcomes
├── Commit key decisions to CLAUDE.md if architectural
└── /exit
```

### 18.2 Auto vs. Manual Compaction Decision Guide

```
Choose MANUAL compaction (/compact or PreCompact hook) when:
┌─────────────────────────────────────────────────────────────┐
│ • Task has a clear logical boundary (feature complete)       │
│ • You want to preserve specific decisions in the summary     │
│ • You are switching to a very different task within session  │
│ • Context is at 60–75% (compact while there's room to work) │
│ • You have a custom PreCompact hook that enhances summaries  │
└─────────────────────────────────────────────────────────────┘

Rely on AUTO compaction when:
┌─────────────────────────────────────────────────────────────┐
│ • Task is continuous with no natural break                   │
│ • Session is exploratory (no specific facts to preserve)     │
│ • You trust Claude's default summarization                   │
│ • Context < 70% (no urgency)                                 │
└─────────────────────────────────────────────────────────────┘

NEVER compact when:
┌─────────────────────────────────────────────────────────────┐
│ • Mid-tool-call (can corrupt state)                          │
│ • MEMORY.md has unsaved changes you need                     │
│ • Session will end in < 5 turns anyway                       │
│ • In a subagent (compact the parent session instead)         │
└─────────────────────────────────────────────────────────────┘
```

### 18.3 MEMORY.md Writing Best Practices

The `MEMORY.md` file persists across sessions in auto-memory mode. Writing it well is the single highest-leverage memory technique:

```markdown
# Project: [Name]                    ← Clear project identifier
Last updated: 2026-05-17

## Architecture Decisions             ← Decisions only; code is in files
- Auth uses RS256 (not HS256) — migrated 2026-04-10; old JWTs invalid
- No ORM — raw SQL via pg; never add an ORM (CTO mandate)

## Current State                      ← Where we are RIGHT NOW
- [ACTIVE] Implementing hybrid search (BM25 + semantic + RRF)
- [BLOCKED] Embedding model selection — waiting for infra team
- [DONE] PII detection pipeline (shipped 2026-05-01)

## Known Dead Ends                    ← Prevent re-attempting failures
- rank_bm25 BM25Okapi: OOM on docs > 50K tokens (tried 2026-04-28)
- ChromaDB batch upsert > 5000: silent data loss bug

## Environment                        ← Reproducible setup
- Python 3.11 (NOT 3.12 — sentence-transformers incompatible)
- Tests: pytest tests/ -x --tb=short
- Lint: ruff check src/

## Next Steps                         ← Concrete, actionable
1. Choose embedding model (wait for infra approval)
2. Implement RRF fusion in src/search/fusion.py
3. Load test with 10K document corpus
```

**Anti-patterns to avoid:**
- Storing file contents (use @import instead)
- Storing verbose debugging output (deduplicate ruthlessly)
- "See file X for details" without the actual detail (file content changes)
- Over 200 lines / 25KB (truncated by auto-memory loader)

### 18.4 Starting Fresh vs. Compacting

```
Scenario: Current session has 160K tokens used (80% of 200K)

Option A: Let auto-compact trigger
  Pros:  No action required; Claude continues seamlessly
  Cons:  You cannot influence what is preserved in the summary
  Cost:  Compaction itself costs ~3K–8K tokens
  Best:  Exploratory sessions with no critical state

Option B: Manual /compact now
  Pros:  You control timing; can update MEMORY.md first
  Cons:  Interrupts flow; costs same tokens as auto
  Best:  At task boundaries; after major decisions

Option C: Start a new session
  Pros:  Clean slate; no compaction cost; can use different model
  Cons:  No continuity with current session's conversation
  Best:  When switching projects entirely; after major task completion

Option D: Delegate remaining work to a subagent
  Pros:  Parent session unaffected; subagent gets clean context
  Cons:  Must pass all necessary context explicitly in task description
  Best:  When remaining work is well-defined and self-contained
```

---

## 19. Model Selection Mental Model

### 19.1 Decision Flowchart

```
Is this a PLANNING or ARCHITECTURE task?
│
├── YES → Does it require extended reasoning or complex decisions?
│         ├── YES → Opus 4.7 (xhigh effort, 1M ctx, $5/$25 MTok)
│         └── NO  → Sonnet 4.6 with opusplan for Plan-mode turns
│
└── NO  → Is this a CODING or EDITING task?
          │
          ├── YES → Is the codebase large (>500 files)?
          │         ├── YES → Sonnet 4.6 (200K ctx, $3/$15 MTok)
          │         └── NO  → Haiku 4.5 for fast/cheap ($0.80/$4 MTok)
          │
          └── NO  → Is this DOCUMENT SEARCH or REVIEW?
                    ├── YES → Sonnet 4.6 (best recall/cost balance)
                    └── NO  → Haiku 4.5 for classification/routing

```

### 19.2 When Model Switching Breaks Caching

Switching models mid-session invalidates the prompt cache for the new model. The cache is per-model, per-API-key. Implications:

```
Session on Sonnet 4.6 → switch to Opus 4.7:
  Cache state:   All Sonnet cache INVALID for Opus 4.7
  First Opus turn: Full input cost (cache miss)
  Subsequent Opus turns: Cache builds fresh

opusplan pattern (Plan-mode only):
  Sonnet turns: Cache preserved for Sonnet
  Opus turns:   Separate cache builds for Opus
  Net effect:   Two active caches — costs slightly more
                but saves significant output cost on Sonnet

Recommendation: Pick one model for the session. If using opusplan,
accept the dual-cache overhead in exchange for Opus reasoning quality
on architecture turns.
```

### 19.3 Real-World Cost Scenarios

```
Scenario 1: 1-hour debugging session
  Model: Sonnet 4.6 | Turns: 40 | Context: 120K in / 24K out
  Cost: (120K × $3 + 24K × $15) / 1M = $0.36 + $0.36 = $0.72
  With 70% cache hit: (36K × $3 + 84K × $0.30 + 24K × $15) / 1M
                      = $0.108 + $0.025 + $0.36 = $0.493

Scenario 2: Architecture planning with Opus 4.7
  Model: Opus 4.7 | Turns: 15 | Context: 45K in / 12K out
  Cost: (45K × $5 + 12K × $25) / 1M = $0.225 + $0.30 = $0.525
  Note: Opus 4.7 tokenizer adds up to 35% more tokens for same text

Scenario 3: CI/CD automated review pipeline
  Model: Haiku 4.5 | 100 reviews/day | 8K in / 2K out each
  Daily cost: 100 × (8K × $0.80 + 2K × $4) / 1M
            = 100 × ($0.0064 + $0.008) = $1.44/day
  Monthly: ~$43/month for 100 automated PR reviews/day
```

---

*Sources: [Claude Code Docs](https://code.claude.com/docs/en/), [Claude Code Hooks](https://code.claude.com/docs/en/hooks), [Claude API Pricing](https://platform.claude.com/docs/en/about-claude/pricing), [Claude Models Overview](https://platform.claude.com/docs/en/about-claude/models/overview), [Adaptive Thinking Docs](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking), [Advisor Tool Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/advisor-tool), [Claude Code Changelog](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md), [Introducing Claude Opus 4.7](https://www.anthropic.com/news/claude-opus-4-7), [Anthropic Scientific Computing Guide](https://www.anthropic.com/research/long-running-Claude), [Cache TTL Community Analysis](https://github.com/anthropics/claude-code/issues/46829), [ToolSearch Failure Issue](https://github.com/anthropics/claude-code/issues/30466), Claude Code Camp, community analysis. Updated May 19, 2026 (v2.1.126).*
