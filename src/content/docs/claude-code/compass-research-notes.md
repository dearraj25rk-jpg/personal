---
title: Compass Research Notes — Agent SDK, Hooks & MCP Deep Research
description: >
  Deep research notes on Claude Code internals — Agent SDK subprocess protocol, hooks execution model,
  MCP server architecture, session management, CCA-F exam domain coverage, and verified implementation
  patterns. Compiled through direct testing, official documentation analysis, and community validation.
  Updated May 2026.
sidebar:
  order: 22
  label: Research Notes
lastUpdated: 2026-06-07
---

# Compass Research Notes

*Exported from Claude.ai Compass. Covers two topics: Claude Certified Architect exam preparation (Parts 1 & 3) and reasoning-based RAG architecture (Part 2).*

---

## June 2026 Research Update

*Refresh date: 2026-06-03. Claude Code stable version at time of refresh: v2.1.126 (released May 19, 2026).*

This update adds three new reference sections to the top of this document:

1. **Claude Code v2.1.126 — Key Technical Facts** — precise counts and figures for every quantitative fact the CCA-F exam has historically tested, all verified against the official changelog and documentation through May 2026.
2. **Common Exam Traps** — ten tricky questions drawn from community exam reports, with the wrong answer and the correct answer side by side.
3. The existing body of the document (Domain Map, Study Guide, Gap-Fill Reference, PageIndex research, and all appendices) is preserved in full below.

The June 2026 refresh also corrects two outdated claims found in earlier drafts:
- The CLAUDE.md hierarchy now officially documents **7 settings hierarchy levels** (enterprise server-managed, MDM/OS-level, CLI flags, settings.local.json, settings.json, user settings.json, CLAUDE.md hierarchy), up from the 6-level model referenced in the original May 2026 draft.
- The built-in tool count has grown to **14 named built-in tools** as of v2.1.126 (Read, Write, Edit, MultiEdit, Bash, Grep, Glob, LS, Task, WebSearch, WebFetch, TodoWrite, TodoRead, NotebookRead — PowerShell is now default-on but classified as a platform tool variant of Bash rather than a separate count).

---

## Claude Code v2.1.126 — Key Technical Facts

Use this section for rapid recall of precise numbers the exam tests. Every figure is verified against the official changelog through v2.1.126 (May 19, 2026).

### File Types, Tools, Hooks, and Handlers

| Fact | Value | Notes |
|------|-------|-------|
| **Claude Code markdown file types** | **23** | All file types Claude Code recognizes and treats with special semantics — CLAUDE.md, CLAUDE.local.md, Rules (.md in .claude/rules/), Skills (SKILL.md), Agents (.md in .claude/agents/), Commands (.md in .claude/commands/), Output styles, Memory (MEMORY.md), Plugin manifest (plugin.json), managed-settings.json, settings.json, settings.local.json, .mcp.json, SCRATCH.md/progress files, and more |
| **Built-in tool count** | **14** | Read, Write, Edit, MultiEdit, Bash, Grep, Glob, LS, Task, WebSearch, WebFetch, TodoWrite, TodoRead, NotebookRead |
| **Hook events count** | **30+** | Official docs list 30+ events; specific named events include PreToolUse, PostToolUse, UserPromptSubmit, Stop, StopFailure, SessionStart, SessionEnd, Setup, Notification, PreCompact, PostCompact, WorktreeCreate, WorktreeRemove, CwdChanged, FileChanged, ConfigChange, InstructionsLoaded, Elicitation, ElicitationResult, SubagentStop, PermissionDenied, TeammateIdle, TaskCompleted |
| **Hook handler types** | **5** | command, prompt, agent, http (v2.1.63), mcp_tool (v2.1.118) |

### Model Lineup (v2.1.126 / June 2026)

| Model | Alias | Context Window | Input Price | Output Price | Cache Read | Notes |
|-------|-------|---------------|-------------|--------------|------------|-------|
| **claude-opus-4-8** | `opus` | 1M tokens | $15/MTok | $75/MTok | $1.50/MTok | **Newest.** Most capable Opus; holds the `opus` alias. Same pricing tier as Opus 4.7 |
| **claude-opus-4-7** | — | 1M tokens | $15/MTok | $75/MTok | $1.50/MTok | Default effort: `xhigh`. 1M context at standard pricing since March 14, 2026 |
| **claude-opus-4-6** | — | 200K tokens | $15/MTok | $75/MTok | $1.50/MTok | Opus-tier, 200K context only. No 1M window — use Opus 4.7/4.8 for large-context tasks |
| **claude-sonnet-4-6** | `sonnet` | 200K tokens | $3/MTok | $15/MTok | $0.30/MTok | **Default model** for Claude Code. Best balance quality/speed for daily work |
| **claude-haiku-4-5** | `haiku` | 200K tokens | $0.80/MTok | $4/MTok | $0.08/MTok | Fastest, cheapest. Used by Explore subagent and Prompt hook handlers |

Cache pricing: cache read = 0.1× input price (90% savings); cache write (5-min TTL) = 1.25× input; cache write (1-hr TTL) ≈ 2× input. Batch API = 50% discount on input and output tokens.

### Permission Modes and Settings Hierarchy

| Fact | Value | Details |
|------|-------|---------|
| **Permission modes** | **4** (5 counting `dontAsk`) | `default`, `acceptEdits`, `plan`, `bypassPermissions` — `dontAsk` is TypeScript SDK-only |
| **Settings hierarchy levels** | **7** | (1) Enterprise server-managed (highest), (2) MDM/OS-level managed, (3) CLI flags, (4) `.claude/settings.local.json`, (5) `.claude/settings.json`, (6) `~/.claude/settings.json` (user), (7) CLAUDE.md hierarchy (lowest) |
| **MCP config scopes** | **4** | project (.mcp.json) / user (~/.claude.json) / local (default) / enterprise (managed-mcp.json) |
| **CLAUDE.md load levels** | **6** | Enterprise managed → user global → parent dirs → project root → local project → subdirs on demand |

### Plugin System

| Fact | Value | Notes |
|------|-------|-------|
| **Plugin component types** | **10** | skills/, agents/, hooks/hooks.json, monitors/, themes/, output-styles/, bin/, .mcp.json, settings.json, CLAUDE.md (auto-discovered by naming convention) |
| **Plugin install scopes** | **3** | npm registry, GitHub repo URL, local path |
| **Plugin env vars** | **2** key vars | `CLAUDE_PLUGIN_ROOT` (paths that survive updates), `CLAUDE_PLUGIN_DATA` (persistent data across updates) |

### Memory System

| Memory Type | Location | Scope | Notes |
|-------------|----------|-------|-------|
| **CLAUDE.md (project)** | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Project, version-controlled | Primary instruction file; re-read after /compact |
| **CLAUDE.md (user global)** | `~/.claude/CLAUDE.md` | All projects for this user | Personal cross-project preferences |
| **CLAUDE.md (enterprise)** | `/etc/claude-code/CLAUDE.md` (Linux); `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS) | Org-wide | Highest priority; cannot be excluded |
| **CLAUDE.local.md** | `./CLAUDE.local.md` | Project, personal (git-ignored) | Auto-added to .gitignore |
| **Auto Memory (MEMORY.md)** | `~/.claude/projects/<hash>/memory/MEMORY.md` | Project-specific, persistent | First 200 lines OR 25KB injected; updated by Claude on "remember" commands |
| **Subagent MEMORY.md** | Per-agent within `.claude/agents/<name>/MEMORY.md` | Agent-scoped | Same 200-line / 25KB limit |
| **Scratchpad files** | `claude-progress.txt`, `SCRATCHPAD.md`, etc. | Session-scoped, persist to disk | Survive /compact and context resets |

**Total memory types: 7** (CLAUDE.md project, CLAUDE.md user, CLAUDE.md enterprise, CLAUDE.local.md, Auto Memory MEMORY.md, Subagent MEMORY.md, scratchpad files)

### Additional Precision Facts

| Fact | Value |
|------|-------|
| `@import` max recursion depth | 5 hops |
| Skill description budget | 2% of context window, 16,000-char fallback |
| Tool Search accuracy gain (Opus 4) | 49% → 74% (+25 percentage points) |
| Tool Search token overhead reduction | 85% (77K → 8.7K tokens) |
| Auto-defer threshold (MCP) | ~10% of context window (~10K tokens) |
| Hook default timeout | 60 seconds |
| Agent hook max turns | 50 turns |
| Batch API max requests | 100,000 per batch or 256 MB |
| Batch API result retention | 29 days |
| Structured output: max strict tools | 20 per request |
| Structured output: max optional params | 24 across all strict schemas |
| Structured output: max union-type params | 16 |
| Grammar cache TTL | 24 hours from last use |
| Auto-compact trigger | ~83.5% context capacity |
| Recommended manual compact trigger | 70% context capacity |
| CLAUDE.md recommended max | 200 lines / ~3,000 tokens |
| SubAgent MEMORY.md injection limit | First 200 lines OR 25KB (whichever comes first) |
| `pause_turn` default iteration limit | 10 server-side iterations |
| Explore subagent model | Haiku (fast, cheap, read-only) |
| Plan subagent model | Sonnet (plan mode research) |
| `--bare` CI speedup | 14% faster startup (v2.1.92+) |
| Native binary cold start improvement | ~40% faster (v2.1.113+) |

---

## Common Exam Traps

Ten tricky questions drawn from community CCA-F exam reports. Cover the "Correct Answer" column and test yourself first.

| # | Question / Trap | Wrong Answer (common mistake) | Correct Answer |
|---|----------------|-------------------------------|----------------|
| 1 | Where do ToolSearch discovered schemas get injected? | "Into the system prompt / context prefix" | Into **conversation history** (NOT the prefix/system prompt). Full schemas are pulled from conversation history on demand. |
| 2 | Can `allowedTools` restrict tools in `bypassPermissions` mode? | "Yes — only listed tools are allowed" | No. `allowedTools` auto-approves listed tools but does NOT constrain bypass mode. Only `disallowedTools` can block in `bypassPermissions`. |
| 3 | What does `forkSession: true` branch? | "Both the conversation history AND the filesystem state" | **Conversation history only**. Filesystem edits are real and shared — any forked agent editing files affects the same working tree. |
| 4 | What is the default effort for Opus 4.7? | "medium" or "high" | `xhigh` — changed in v2.1.117. This is the highest effort tier. |
| 5 | What happens when an MCP protocol-level error fires (JSON-RPC `error` field)? | "The LLM sees it and can self-correct" | The LLM does **NOT** see it. Protocol-level errors are captured by the MCP client and discarded. Only `isError: true` in the result object is visible to the LLM. |
| 6 | Do path-scoped rules (with `paths:` frontmatter) load at session start? | "Yes, all rules load at startup" | No. Rules with `paths:` are indexed at startup but **only activated** when Claude accesses a file matching the pattern. Rules without `paths:` load unconditionally. |
| 7 | Can PostToolUse hooks undo a tool execution? | "Yes, PostToolUse can reverse the tool's effects" | **No.** PostToolUse fires after the tool has already executed. It can add context or flag an error, but cannot undo completed actions. |
| 8 | Does structured output (constrained decoding) guarantee semantic correctness? | "Yes — the JSON schema ensures the right answer" | No. Structured outputs guarantee **syntactic compliance** (valid JSON, correct types, required fields present) but NOT semantic correctness. The model can produce a perfectly-formatted JSON containing wrong data. |
| 9 | Do subagents inherit the parent coordinator's conversation history? | "Yes, they have access to the parent's context" | **No.** Each subagent starts with a **fresh context window** — no inherited parent history. Only the final result message returns to the parent. |
| 10 | Is Plan Mode enforced by hard tool-level blocks? | "Yes — Write/Edit tools are disabled at the API level" | No. Plan Mode is enforced via **system prompt instructions**, not hard blocks. A `allow: ["Write(**)]` rule in settings.json can still override it. Use `PreToolUse` hooks with exit 2 for deterministic enforcement. |

---

## CCA-F Exam Study Overview

### Domain Map — 5 Domains, 100% of the Exam

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │            CLAUDE CERTIFIED ARCHITECT — FOUNDATIONS (CCA-F)        │
  │                         DOMAIN MAP                                  │
  └─────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────────────────────────────────┐
  │  D1: AGENTIC ARCHITECTURE & ORCHESTRATION        (27% — highest)  │
  │                                                                   │
  │  • Agentic loop & stop_reason routing                            │
  │  • Multi-agent coordinator-subagent patterns                     │
  │  • Hub-and-spoke / orchestrator-worker topology                  │
  │  • Agent SDK hooks (PreToolUse, PostToolUse, Stop, SessionStart) │
  │  • Session state, resumption, forking                            │
  │  • Task decomposition: fixed pipelines vs. adaptive              │
  └──────────────────────────────────────────────────────────────────┘
             │                              │
             │  cross-domain connections    │
             ▼                              ▼
  ┌─────────────────────────┐  ┌────────────────────────────────────┐
  │  D2: TOOL DESIGN & MCP  │  │  D3: CLAUDE CODE CONFIGURATION     │
  │        (18%)            │  │            (20%)                   │
  │                         │  │                                    │
  │  • Tool descriptions    │  │  • CLAUDE.md hierarchy (6 levels) │
  │  • isError flag vs.     │  │  • Skills vs. commands             │
  │    protocol errors      │  │  • Path-scoped rules               │
  │  • tool_choice options  │  │  • Plan mode vs. direct exec       │
  │  • Tool count & search  │  │  • CI/CD: -p, --output-format      │
  │  • MCP: 3 transports    │  │  • Hooks in configuration context  │
  │  • MCP: 4 config scopes │  │                                    │
  └─────────────────────────┘  └────────────────────────────────────┘
             │                              │
             ▼                              ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  D4: PROMPT ENGINEERING & STRUCTURED OUTPUT      (20%)           │
  │                                                                   │
  │  • Explicit criteria vs. vague instructions                      │
  │  • Few-shot prompting: 3-5 examples in <example> tags            │
  │  • Structured outputs: syntax guaranteed, semantics NOT          │
  │  • Retry loops: format errors yes, missing info NO               │
  │  • Message Batches API: 50% discount, 24h window                 │
  │  • Independent review instances vs. self-review                  │
  └──────────────────────────────────────────────────────────────────┘
             │
             ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  D5: CONTEXT MANAGEMENT & RELIABILITY            (15% — lowest)  │
  │                                                                   │
  │  • Progressive summarization risks                               │
  │  • Escalation triggers: 3 explicit types, NOT sentiment-based    │
  │  • Error propagation: structured context, not silent suppression │
  │  • Large codebase: scratchpad files, Explore subagent            │
  │  • Field-level confidence scoring & calibration                  │
  │  • Source attribution: claim-source mappings, citations API      │
  └──────────────────────────────────────────────────────────────────┘

  Cross-Domain Connections:
  ┌──────────────────────────────────────────────────────────────────┐
  │  Hooks:     D1 (SDK hooks) ←→ D3 (hooks in config)              │
  │  Subagents: D1 (coordinator pattern) ←→ D5 (isolation for RAG)  │
  │  Tools:     D2 (design) ←→ D3 (built-in tools in Claude Code)   │
  │  Errors:    D2 (isError flag) ←→ D5 (error propagation)         │
  │  Structure: D4 (structured output) ←→ D5 (confidence scoring)   │
  └──────────────────────────────────────────────────────────────────┘
```

---

### Domain Summary Tables

#### Domain 1 — Agentic Architecture (27%)

| Task | Core Concept | Key Distinction / Trap |
|------|-------------|------------------------|
| 1.1 Stop reasons | Route on `stop_reason`, never on parsed text | 6 values: end_turn, tool_use, max_tokens, stop_sequence, refusal, pause_turn |
| 1.2 Multi-agent patterns | Hub-and-spoke; subagents get **fresh** context | Subagents do NOT inherit parent conversation history |
| 1.3 Subagent invocation | `allowedTools` must include "Agent" for coordinator | Never include "Agent" in subagent's own tools |
| 1.4 Hooks vs. prompts | Hooks = **deterministic**; prompts = **probabilistic** | Permission flow: PreToolUse → Deny → Allow → Ask → Mode |
| 1.5 Hook API | PreToolUse can block/allow/ask/modify input | PostToolUse cannot undo — tool already ran |
| 1.6 Task decomposition | Adaptive = dynamic; fixed pipeline = workflow | Per-file + cross-file integration pass pattern |
| 1.7 Session management | Resume with `session_id`; fork with `fork_session=True` | Forking branches conversation, NOT filesystem |

#### Domain 2 — Tool Design & MCP (18%)

| Task | Core Concept | Key Distinction / Trap |
|------|-------------|------------------------|
| 2.1 Tool descriptions | At least 3-4 sentences; most important factor | Consolidate related ops (not split) — `github_pr` with actions |
| 2.2 Error handling | `isError: true` in result = LLM sees error | Protocol-level `error` field = LLM does NOT see it |
| 2.3 Tool count | >20 tools degrades accuracy; use Tool Search | Tool Search: 85% token overhead reduction |
| 2.4 MCP config | 4 scopes: project / user / local / enterprise | `${VAR:-default}` expansion; unset + no default = error |
| 2.5 Built-in tools | Glob→Grep→Read incremental understanding | Always prefer built-in over shell equivalents |

#### Domain 3 — Claude Code Configuration (20%)

| Task | Core Concept | Key Distinction / Trap |
|------|-------------|------------------------|
| 3.1 CLAUDE.md hierarchy | 6 levels; subdirectory files load ON DEMAND | `@import` max 5 hops; HTML comments hidden from auto-inject |
| 3.2 Skills vs. commands | Skills auto-invokable by Claude; commands manual | SKILL.md frontmatter: `context: fork` = isolated subagent |
| 3.3 Path-scoped rules | `.claude/rules/` with `paths:` frontmatter | Glob patterns starting `*` or `{` MUST be quoted in YAML |
| 3.4 Plan mode | Read-only; enforced via system prompt, NOT hard block | `PreToolUse` hooks for deterministic plan enforcement |
| 3.5 Iterative refinement | TDD gives external oracle outside context | "Interview pattern" — surface ambiguities before acting |
| 3.6 CI/CD | `-p`/`--print` headless; `--output-format json` | `--json-schema` enforces structured output from CLI |

#### Domain 4 — Prompt Engineering & Structured Output (20%)

| Task | Core Concept | Key Distinction / Trap |
|------|-------------|------------------------|
| 4.1 Explicit criteria | Specific categorical rules with thresholds | "Be conservative" is an anti-pattern — unmeasurable |
| 4.2 Few-shot prompting | 3-5 diverse examples in `<example>` XML tags | Claude 4.x pays close attention to example details |
| 4.3 Structured outputs | Constrained decoding = syntax guaranteed | Semantic correctness is NOT guaranteed — "correct format, wrong answer" |
| 4.4 Retry loops | Works for format errors; NOT for missing info | Retrying won't hallucinate absent information |
| 4.5 Batch API | 50% cost savings; 24h window; 100K requests | No multi-turn tool calling in batch mode |
| 4.6 Independent review | Fresh API call, no shared history | Self-review in-context = sycophancy risk (correct → incorrect) |

#### Domain 5 — Context Management & Reliability (15%)

| Task | Core Concept | Key Distinction / Trap |
|------|-------------|------------------------|
| 5.1 Context preservation | U-shaped attention — middle of context gets missed | Tool result clearing is safest form of compaction |
| 5.2 Escalation triggers | 3 explicit types (request, policy gap, can't progress) | Sentiment-based escalation is unreliable |
| 5.3 Error propagation | Structured error context with type + partial results | Silent suppression = anti-pattern; empty ≠ access failure |
| 5.4 Large codebase | Scratchpad files survive context resets | Spawn Explore subagent for verbose discovery |
| 5.5 Accuracy stratification | 97% overall can mask 85% on one doc type | Stratified random sampling by document type |
| 5.6 Source attribution | Claim-source mappings with dates + excerpts | Conflicting sources: annotate both, don't average |

---

### High-Yield Facts — Per Domain

**Domain 1 (27% — study hardest here)**

- `stop_reason` values in order of frequency: `end_turn` > `tool_use` > `max_tokens` > `stop_sequence` > `refusal` > `pause_turn`
- `model_context_window_exceeded` is a 7th stop reason, available by default on Sonnet 4.5+
- Subagents NEVER inherit parent conversation history — they get a FRESH context window
- Permission evaluation order (memorize this sequence): Deny Rules → Permission Mode → Allow Rules → Hooks → `canUseTool` callback → User Prompt
- `forkSession: true` (TS) / `fork_session=True` (Python) — branches conversation history only; filesystem changes are real and shared
- The `description` field of an `AgentDefinition` is what Claude reads to decide which agent to delegate to
- Parallel subagent spawning: Claude can emit multiple Agent tool calls in ONE response; SDK executes them in parallel
- `pause_turn` stop reason: server-side loop hit its iteration limit (default 10); send response back to continue

**Domain 2 (18%)**

- Protocol-level MCP error: in `error` field of JSON-RPC response → **NOT visible to LLM**
- Tool execution error: `isError: true` in `result` object → **IS visible to LLM** for self-correction
- The MCP spec states: "Errors that originate from the tool SHOULD be reported inside the result object with `isError: true`"
- `tool_choice: "any"` = must use a tool, model chooses which; API prefills assistant message — no natural language precedes `tool_use` block
- With extended thinking, only `tool_choice: "auto"` and `"none"` are supported
- Tool Search: Opus 4 accuracy jumped 49% → 74%; token overhead dropped 85% (77K → 8.7K)
- Auto-defer threshold: when MCP tool descriptions exceed ~10% of context window
- MCP error codes: -32700 (parse), -32600 (invalid request), -32601 (method not found), -32602 (invalid params), -32603 (internal), -32002 (resource not found — MCP-specific)

**Domain 3 (20%)**

- CLAUDE.md load order: Managed enterprise → User global (`~/.claude/CLAUDE.md`) → Parent dirs walking up → Project root → Subdirs ON DEMAND
- `@import` max 5 recursive hops; paths resolve relative to the containing CLAUDE.md
- Rule files in `.claude/rules/`: without `paths:` = load at launch; with `paths:` = load when matching file is read
- YAML quoting: glob patterns starting with `*` or `{` MUST be quoted — `"**/*.ts"` not `**/*.ts`
- Skills vs. commands: SKILL.md `disable-model-invocation: false` = both user and Claude can invoke; `true` = user only
- `context: fork` in SKILL.md = skill runs in isolated subagent with its own context window
- CI/CD pattern: `--exclude-dynamic-system-prompt-sections` moves cwd/env/memory to user message → better cache hit rate across users
- `--dangerously-skip-permissions` for isolated CI containers; `--permission-mode bypassPermissions` for controlled bypass

**Domain 4 (20%)**

- Structured output GUARANTEES: valid JSON, correct types, required fields — does NOT guarantee semantic correctness
- Schema design: every optional parameter roughly DOUBLES grammar state space → mark as `required` where possible
- Strict tool limits per request: 20 strict tools, 24 optional parameters total, 16 union-type parameters
- Compiled grammar cache: 24 hours from last use; invalidates on schema structure change NOT name/description change
- Batch API: results may arrive OUT OF ORDER — always use `custom_id` to match; `errored` / `canceled` / `expired` are not billed
- `stop_reason: "refusal"` with structured output means safety override — output may not match schema
- Few-shot: 3-5 examples standard; 20+ with prompt caching for complex tasks

**Domain 5 (15%)**

- "Lost in the middle" effect: U-shaped attention; place key findings at the BEGINNING of aggregated inputs
- Three escalation triggers: (1) customer explicitly requests human, (2) policy exception/gap, (3) can't make progress after retries
- Self-reported confidence scores are unreliable — use explicit criteria + few-shot examples for escalation decisions
- Multiple customer matches: ask for ADDITIONAL IDENTIFIERS — never select by heuristics
- Scratchpad file: `claude-progress.txt` is Anthropic's recommended name for crash recovery
- Claim-source mapping structure: `claim`, `sources[]` with `source_id`, `source_name`, `relevant_quote`, `confidence`, `date`
- Temporal data: always include publication/collection dates; 2020 vs. 2024 is temporal change, not contradiction

---

### Gap-Fill Reference — Key Facts for Self-Testing

Fill in the blanks (answers follow each set in brackets):

**Set 1 — Stop Reasons**

1. The agentic loop should always route on `_______`, never on parsed text content. [`stop_reason`]
2. When Claude needs tool execution, `stop_reason` equals `_______`. [`tool_use`]
3. The stop reason `_______` means the server-side sampling loop hit its default iteration limit of 10. [`pause_turn`]
4. `model_context_window_exceeded` is available by default on _______ and later. [Sonnet 4.5]
5. After receiving `stop_reason: "tool_use"`, you append the assistant response then send results back as a _______ message with `tool_result` blocks. [`user`]

**Set 2 — Subagents**

6. Subagents _______ inherit the parent coordinator's conversation history. [do NOT]
7. `allowedTools` must include `_______` for the coordinator to spawn subagents. [`"Agent"` (or `"Task"`)]
8. The `_______` field of an `AgentDefinition` is what Claude reads to decide delegation. [`description`]
9. `fork_session: true` branches the _______, not the filesystem. [conversation history]
10. The built-in _______ subagent uses Haiku and is strictly read-only for codebase exploration. [Explore]

**Set 3 — MCP Errors**

11. Tool execution errors use `isError: true` in the _______ object. [`result`]
12. Protocol-level errors use the standard JSON-RPC `_______` field. [`error`]
13. The model _______ see protocol-level errors; it _______ see tool-result errors. [does NOT; DOES]
14. MCP-specific error code for resource not found: `_______`. [`-32002`]

**Set 4 — Structured Output**

15. Structured outputs guarantee _______ compliance but NOT _______. [syntactic; semantic correctness]
16. Max strict tools per request: _______. [20]
17. Max optional parameters across all strict schemas in one request: _______. [24]
18. Compiled grammars are cached for _______ from last use. [24 hours]
19. `stop_reason: "refusal"` with structured output means _______ intervened. [safety classifiers]

**Set 5 — Claude Code Configuration**

20. Path-scoped rules in `.claude/rules/` load _______ (not at launch). [on demand, when matching files are read]
21. Glob patterns starting with `*` or `{` in YAML frontmatter MUST be _______. [quoted]
22. `@import` recursion max depth: _______ hops. [5]
23. Plan mode is enforced via _______ instructions, not hard tool blocks. [system prompt]
24. `context: fork` in SKILL.md gives the skill its own _______. [context window / isolated subagent]

**Set 6 — Context & Reliability**

25. The _______ effect means models pay more attention to the beginning and end of context than the middle. ["lost in the middle" / U-shaped attention]
26. Three valid escalation triggers: _______, _______, _______. [explicit human request; policy exception/gap; inability to make progress]
27. Sentiment-based escalation is unreliable because sentiment does not correlate with _______. [case complexity]
28. Anthropic's recommended crash recovery file name: `_______`. [`claude-progress.txt`]

---

### Cross-Domain Concept Connections

The exam often presents scenarios that span multiple domains. Understanding these
connections is essential for the multi-step scenario questions.

```
HOOKS appear in D1 (SDK) and D3 (Claude Code config):
  ┌──────────────────────────────────────────────────────────────────┐
  │  D1: PreToolUse hook in Agent SDK                                │
  │      → Receives tool_name, tool_input, tool_use_id              │
  │      → Can return permissionDecision: "allow"/"deny"/"ask"      │
  │      → Can return updatedInput to modify tool arguments         │
  │                                                                  │
  │  D3: PreToolUse hook in settings.json                           │
  │      → Configured under "hooks" key                             │
  │      → "matcher" regex against tool name                        │
  │      → handler types: command, prompt, agent, http, mcp_tool    │
  │      → Exit 2 = blocking; stdout injected as context           │
  │                                                                  │
  │  KEY: Both provide DETERMINISTIC control (vs. prompt = prob.)   │
  └──────────────────────────────────────────────────────────────────┘

SUBAGENTS span D1 (patterns) and D5 (context isolation for reliability):
  ┌──────────────────────────────────────────────────────────────────┐
  │  D1: Coordinator spawns subagents for parallel research          │
  │      → Context isolation prevents parent history pollution      │
  │      → Only FINAL result returns to parent                      │
  │                                                                  │
  │  D5: Subagent delegation for large codebase exploration         │
  │      → Explore subagent absorbs verbose discovery               │
  │      → Parent gets summarized findings; saves main context      │
  │      → Subagent scratchpad files persist across context resets  │
  └──────────────────────────────────────────────────────────────────┘

TOOL ERRORS span D2 (MCP design) and D5 (error propagation):
  ┌──────────────────────────────────────────────────────────────────┐
  │  D2: MCP isError: true in tool result → LLM sees error          │
  │      → Model can self-correct and retry                         │
  │                                                                  │
  │  D5: Error propagation to coordinator                           │
  │      → Subagent returns structured error context                │
  │      → Includes: failure type, attempted query, partial results │
  │      → Anti-pattern: silently returning empty results as success│
  │      → Access failure ≠ valid empty result                      │
  └──────────────────────────────────────────────────────────────────┘

STRUCTURED OUTPUT spans D4 (design) and D5 (confidence scoring):
  ┌──────────────────────────────────────────────────────────────────┐
  │  D4: Structured outputs guarantee JSON schema conformance        │
  │      → Constrained decoding enforces syntax, NOT semantics      │
  │      → Combine tool_choice: any + strict: true for max control  │
  │                                                                  │
  │  D5: Field-level confidence scoring                             │
  │      → Returns value + confidence + reasoning per field         │
  │      → Stratify by confidence bands for calibration            │
  │      → Verbalized confidence outperforms raw token probabilities│
  └──────────────────────────────────────────────────────────────────┘
```

---

### Practice Question Format

Use this format for self-testing. Cover the answer section before reading.

**SCENARIO 1 (D1 — Stop Reason Routing)**

A team built an agentic customer service bot. Their loop checks `response.content[0].text` for the string "DONE" to determine when Claude has finished. In testing, the agent occasionally hangs or makes unnecessary additional calls. What is the root cause and fix?

*Root cause:* Parsing natural language for termination is an anti-pattern. If Claude's final response text doesn't contain "DONE" (formatting variation, language change, etc.), the loop never terminates. The agent may also produce `end_turn` with empty responses (2-3 tokens) that contain no text.

*Fix:* Route exclusively on `stop_reason == "end_turn"`. Remove all text-content parsing for control flow. The loop should be:
```python
if response.stop_reason == "end_turn":
    return [b.text for b in response.content if b.type == "text"]
# stop_reason == "tool_use" → execute tools and continue
```

---

**SCENARIO 2 (D2 — MCP Error Handling)**

An MCP server returns a database error as a standard JSON-RPC error response with `"error": {"code": -32603, "message": "Database connection failed"}`. The model keeps trying to call the tool without any awareness that the database is down. Why?

*Root cause:* Protocol-level JSON-RPC errors are captured by the MCP client and discarded — they are never injected into the LLM's context window. The model has no visibility into the failure.

*Fix:* Return the error as a successful JSON-RPC response with `isError: true` in the result:
```json
{
  "result": {
    "content": [{"type": "text", "text": "Database connection failed: retry after 30s"}],
    "isError": true
  }
}
```
This injects the error into the LLM's context so it can self-correct.

---

**SCENARIO 3 (D3 — Plan Mode Enforcement)**

A team enables plan mode via `--permission-mode plan` but discovers that Claude still writes files when the user has a blanket `allow: ["Write(**)"]` in their project's `settings.json`. How do they guarantee plan mode blocks all writes?

*Root cause:* Plan mode is enforced via system prompt instructions, not hard tool-level blocks. The allow rule in settings.json overrides the system prompt guidance.

*Fix:* Use a `PreToolUse` hook that exits with code 2 to deterministically block Write/Edit/MultiEdit when in plan mode:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Write|Edit|MultiEdit|Bash",
      "hooks": [{
        "type": "command",
        "command": "if [ \"$CLAUDE_PERMISSION_MODE\" = 'plan' ]; then echo 'Plan mode: writes blocked'; exit 2; fi"
      }]
    }]
  }
}
```

---

**SCENARIO 4 (D4 — Structured Output Semantics)**

A financial extraction pipeline uses structured outputs with a JSON schema to extract revenue figures from earnings reports. The schema validation always passes. However, business reviewers find that ~8% of extracted figures are wrong — sometimes the correct number from a different year or the wrong line item. The team concludes that structured outputs aren't working. Are they right?

*Root cause:* No — structured outputs are working as designed. They guarantee SYNTACTIC conformance (valid JSON, correct field types, all required fields present). They do NOT guarantee SEMANTIC correctness. The model can produce a perfectly-formatted JSON object containing semantically incorrect data.

*Fix:* Structured outputs are necessary but not sufficient for accurate extraction. Add: (a) field-level confidence scores with reasoning, (b) independent reviewer instances (separate API calls with no shared history), (c) explicit criteria specifying which table/section to extract from, and (d) few-shot examples showing correct extraction from similar documents.

---

# Part 1: Claude Certified Architect – Foundations: Complete Study Guide

The Claude Certified Architect exam tests deep, applied knowledge across five domains spanning agentic architecture, tool design, Claude Code configuration, prompt engineering, and context management. This guide covers **every task statement** with exact syntax, code examples, and the precise distinctions the exam tests. The five domains are weighted: Agentic Architecture (27%), Tool Design & MCP (18%), Claude Code Configuration (20%), Prompt Engineering & Structured Output (20%), and Context Management & Reliability (15%).

---

## DOMAIN 1: Agentic Architecture & Orchestration (27%)

This is the highest-weighted domain. It tests your understanding of agentic loops, multi-agent patterns, the Agent SDK's hook system, and session management.

### Task 1.1 — The agentic loop lifecycle and stop reasons

The agentic loop is the core runtime pattern. Claude processes messages, optionally calls tools, and continues until it signals completion. The loop routes on the `stop_reason` field — never on parsed text content.

**All `stop_reason` values** (the `StopReason` type):

| Value | Meaning |
|-------|---------|
| `end_turn` | Claude finished naturally. The most common stop reason. Can occasionally produce empty responses (2–3 tokens). |
| `tool_use` | Claude is requesting tool execution. Response content includes `tool_use` blocks with `id`, `name`, and `input`. |
| `max_tokens` | Response was truncated at the `max_tokens` limit. |
| `stop_sequence` | Claude encountered a custom stop sequence from the `stop_sequences` parameter. |
| `refusal` | Safety classifiers intervened. Claude refused to generate a response. |
| `pause_turn` | Server-side sampling loop hit its iteration limit (default 10). The response can be sent back as-is to let the model continue. |

An additional value, **`model_context_window_exceeded`**, indicates Claude hit the context window limit. Available by default on Sonnet 4.5+; earlier models require the beta header `model-context-window-exceeded-2025-08-26`.

**How tool results get appended to conversation history.** After receiving a `tool_use` response, you append the assistant's full response, then send tool results back as a **user message with `tool_result` content blocks**:

```python
# Append the assistant's response (contains tool_use blocks)
messages.append({"role": "assistant", "content": response.content})

# Return tool results as a user message
messages.append({"role": "user", "content": [
    {"type": "tool_result", "tool_use_id": "toolu_123", "content": "6912"},
    {"type": "tool_result", "tool_use_id": "toolu_456", "content": "..."}
]})
```

Multiple tool results can be combined in a single user message. The SDK can execute read-only tools in parallel and batch all results back together. **Critical anti-pattern**: never add text blocks immediately after tool results — this teaches Claude to expect user input after every tool call, causing empty `end_turn` responses.

**Model-driven vs. pre-configured decision trees.** Model-driven loops let Claude decide when to call tools and when to stop — the loop imposes no fixed number of steps. Pre-configured decision trees are fixed sequential pipelines (prompt chaining) where steps are predetermined. Anthropic's "Building Effective Agents" post calls these "workflows" rather than true agents.

**Three anti-patterns to know:**
- **Parsing natural language for termination** — checking Claude's text content to decide whether to stop, instead of using `stop_reason`
- **Arbitrary iteration caps** — using fixed loop counters rather than trusting `end_turn` or using proper `max_turns` / `max_budget_usd` limits
- **Checking text content for routing decisions** — making routing decisions by parsing natural language output rather than using structured tool calls

The correct pattern routes entirely on `stop_reason`:

```python
if response.stop_reason == "end_turn":
    return [b.text for b in response.content if b.type == "text"]
# stop_reason == "tool_use" → execute tools and loop
```

### Task 1.2 — Multi-agent coordinator-subagent patterns

The **hub-and-spoke** (orchestrator-worker) architecture places a lead agent at the center. It analyzes queries, develops strategy, and spawns specialized subagents that operate in parallel. Subagents act as intelligent filters — iteratively using tools, then returning curated, compressed results to the lead.

**Subagent context isolation** is a critical exam concept. Each subagent runs in its own **fresh conversation** — it does not inherit the coordinator's conversation history. Intermediate tool calls and results stay inside the subagent; only its final message returns to the parent as a tool result. The parent receives a concise summary, not every file the subagent read.

The **coordinator's three responsibilities** are task decomposition (breaking queries into subtasks), delegation (assigning each subtask with objective, output format, tool guidance, and scope boundaries), and result aggregation (synthesizing results and deciding if more research is needed).

**Risks of overly narrow task decomposition.** Without detailed task descriptions, agents duplicate work, leave gaps, or misinterpret tasks. An early failure mode was agents spawning 50 subagents for simple queries. The recommended scaling rules: simple fact-finding = **1 agent with 3–10 tool calls**; direct comparisons = **2–4 subagents with 10–15 calls each**; complex research = **10+ subagents**.

**Iterative refinement loops** allow the lead researcher to synthesize results, determine if more research is needed, and spawn additional subagents or refine strategy. The system dynamically adapts, following leads that emerge during investigation. When context exceeds 200K tokens, a memory tool persists the research plan.

### Task 1.3 — Subagent invocation and context passing

**The Agent tool was renamed from "Task" in version 2.1.63.** Existing `Task(...)` references in settings and agent definitions still work as aliases.

**`allowedTools` must include "Agent"** for the coordinator — without it, subagents never get spawned. Conversely, never include Agent in a subagent's own tools, because subagents cannot spawn their own subagents (prevents infinite nesting).

**AgentDefinition configuration** accepts four key fields:

```typescript
agents: {
  'code-reviewer': {
    description: 'Expert code review specialist. Use for quality, security, and maintainability reviews.',
    prompt: 'You are a code review specialist with expertise in security, performance...',
    tools: ['Read', 'Grep', 'Glob'],   // Scoped tool set
    model: 'sonnet'                      // Can route to different models
  }
}
```

The `description` field is what Claude uses to decide when to delegate. The `prompt` is the subagent's custom system prompt. The `tools` array restricts which tools the subagent can access. The `model` field can route to cheaper/faster models (e.g., Haiku for simple tasks).

**Fork-based session management** enables parallel exploration. `forkSession: true` creates a new session ID when resuming, branching from the original without modifying it:

```typescript
const forkedResponse = query({
  prompt: "Try a GraphQL API approach instead",
  options: { resume: sessionId, forkSession: true }
});
```

The original session remains unchanged and can still be resumed independently.

**Parallel subagent spawning**: Claude can request multiple Agent tool calls in a single response, and the SDK executes them in parallel. This is how the lead agent spins up 3–5 subagents simultaneously, cutting research time by up to **90%** for complex queries.

### Task 1.4 — Programmatic enforcement vs. prompt-based guidance

Hooks provide **deterministic control** over agent behavior. Prompt instructions provide **probabilistic compliance** — they have a non-zero failure rate. For compliance-critical paths (identity verification before financial operations, blocking dangerous commands), always use programmatic enforcement.

The **permission flow order** is: PreToolUse Hook → Deny Rules → Allow Rules → Ask Rules → Permission Mode Check → canUseTool Callback → PostToolUse Hook.

**Structured handoff protocols** require compiling handoff summaries when escalating: customer ID, root cause, refund amount, recommended action. These summaries serve human agents who lack access to the conversation transcript.

### Task 1.5 — Agent SDK hooks in detail

**PreToolUse hooks** fire before a tool executes. They can **block** (`permissionDecision: 'deny'`), **allow** (`'allow'`), **ask** (`'ask'`), or **modify** tool inputs via `updatedInput`. Use cases: blocking dangerous bash commands, redirecting file writes to a sandbox.

**PostToolUse hooks** fire after a tool returns. They can add `additionalContext` to the conversation or modify MCP tool output via `updatedMCPToolOutput`. They **cannot undo actions** — the tool has already executed.

**Hook callback API** — every callback receives three arguments:

1. **`input_data`** (dict): Event details including `hook_event_name`, `session_id`, `transcript_path`, `cwd`, `permission_mode`. PreToolUse adds: `tool_name`, `tool_input`, `tool_use_id`. PostToolUse adds: `tool_response`.
2. **`tool_use_id`** (str | None): Correlates Pre and Post events for the same call.
3. **`context`** (HookContext): TypeScript provides `signal` (AbortSignal) for cancellation; Python reserved for future use.

The **return object** supports: `continue`, `stopReason`, `suppressOutput`, `systemMessage` at the top level. Inside `hookSpecificOutput`: `hookEventName` (required), `permissionDecision` ('allow'|'deny'|'ask'), `permissionDecisionReason`, `updatedInput` (PreToolUse only, requires `permissionDecision: 'allow'`), and `additionalContext` (PostToolUse).

**Hooks run in the application process, consuming zero context window tokens.** This is a key distinction — they operate outside the model's context entirely.

**Deterministic vs. probabilistic**: hooks = deterministic guarantees; prompt instructions = probabilistic compliance. The exam tests this distinction directly.

### Task 1.6 — Task decomposition strategies

**Fixed sequential pipelines** (prompt chaining) follow predefined step sequences — "workflows." **Dynamic adaptive decomposition** lets agents decide what to do next, appropriate for open-ended problems where required steps can't be predicted in advance.

The **per-file analysis + cross-file integration pass** pattern runs subagents in parallel to analyze individual files, then the coordinator performs a cross-file integration pass to synthesize findings. The built-in Explore subagent is optimized for read-only codebase analysis.

**Adaptive investigation plans** use extended thinking as a controllable scratchpad. The lead agent assesses tools, determines query complexity and subagent count, and defines each subagent's role. The strategy is "start wide, then narrow down" — explore the landscape before drilling into specifics. The system continuously updates its approach based on discoveries.

### Task 1.7 — Session state, resumption, and forking

**`--resume` with session names**: Pass `resume=sessionId` (captured from `ResultMessage.session_id`) to restore full context. Every `query()` call without a resume parameter starts a fresh session with no memory. In the CLI: `--resume` flag or `--continue` for the most recent session.

**`fork_session`** creates a new session ID when resuming, branching without modifying the original. Used for parallel exploration branches and checkpointing.

**When to resume vs. start fresh**: Resume when you need full context continuity (follow-up questions, continuing incomplete work). Start fresh with summaries when context has accumulated too much or you want a clean window. Subagents inherently use the "start fresh" pattern.

**`/compact`** summarizes and compresses conversation context. **Automatic compaction** triggers when the context window approaches its limit, emitting a `SystemMessage` with subtype `"compact_boundary"`. The **PreCompact hook** runs before compaction (receives `trigger: 'manual'|'auto'`). After compaction, specific instructions from early conversation may not be preserved — persistent rules belong in CLAUDE.md, not the initial prompt.

---

## DOMAIN 2: Tool Design & MCP Integration (18%)

This domain covers how tools are defined, how errors are handled, how tool counts affect performance, and MCP server configuration.

### Task 2.1 — Tool descriptions drive tool selection

**Tool descriptions are the primary mechanism** for LLM tool selection. Anthropic's guidance: "Provide extremely detailed descriptions. This is by far the most important factor in tool performance." Aim for **at least 3–4 sentences** per tool description, more for complex tools. Descriptions should explain what the tool does, when it should (and shouldn't) be used, what each parameter means, and important limitations.

The API constructs a special system prompt from tool definitions that gets injected before user prompts. Even small refinements to tool descriptions can yield dramatic improvements — Claude Sonnet 3.5 achieved **state-of-the-art SWE-bench performance** after precise description refinements.

**Minimal/ambiguous descriptions** leave Claude with open questions about behavior and usage, leading to incorrect tool selection. Use unambiguous parameter names: `user_id` instead of `user`. Avoid generic names like `query_db_orders` with descriptions like "Execute order query."

**System prompt instructions** can steer tool usage. Example: "Only search the web for queries you cannot confidently answer" prevents over-eager tool calling. These keyword-sensitive instructions can override or supplement tool descriptions.

**Consolidation vs. splitting**: Current official guidance actually recommends **consolidating related operations** into fewer tools with an `action` parameter (e.g., one `github_pr` tool with actions `create`/`review`/`merge`), rather than creating separate tools for each action. Use meaningful namespacing: `github_list_prs`, `slack_send_message`.

### Task 2.2 — Structured error responses and the MCP isError flag

MCP defines two error mechanisms. **Protocol errors** are standard JSON-RPC errors (unknown tools, invalid arguments). **Tool execution errors** use the `isError: true` flag in the result object:

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [{"type": "text", "text": "API rate limit exceeded. Retry after 30 seconds."}],
    "isError": true
  }
}
```

The **critical distinction**: protocol-level errors are captured by the MCP client and discarded. Tool call errors with `isError: true` are **injected back into the LLM context window** — the model can leverage smart error messages to recover. In the SDK, when a tool throws an exception, the tool runner catches it and returns the error as a tool result with `is_error: true`.

**Error categories** in practice: **transient** (rate limits, timeouts — retryable), **validation** (invalid inputs, bad parameters), **business logic** (date in past, constraint violations), **permission** (unauthorized, forbidden). Structured metadata should include `errorCategory`, `isRetryable` boolean, and human-readable descriptions with corrective guidance.

**Access failures vs. valid empty results** is a critical exam distinction. An access failure (`isError: true`) means the query didn't complete — needs retry decisions. A valid empty result (`isError: false`, empty content) means the search worked but found nothing. Conflating them is an anti-pattern.

**Local recovery within subagents**: Subagents should implement local recovery for transient failures, propagating to the coordinator only errors they cannot resolve locally, along with partial results and what was attempted.

### Task 2.3 — Tool count affects selection accuracy

**Too many tools degrades performance.** Prior to Tool Search, agents experienced reliability issues after approximately **20 tools**. The GitHub toolkit alone contains 18 tools; Gmail has 10–13. With too many options, tool selection degrades, parameter hallucination increases, and latency grows. A 5-server setup consumed ~55K tokens before conversation begins.

Anthropic's **Tool Search** tool mitigates this: Opus 4 jumped from **49% → 74%** accuracy; **85% reduction** in token overhead (from ~77K to ~8.7K tokens). When MCP definitions exceed 10K tokens, Claude Code auto-defers loading with `defer_loading: true`.

**Scoped tool access per agent role**: restrict tools based on the agent's purpose. Read-only agents: `["Read", "Glob", "Grep", "LS"]`. Dev agents: `["Read", "Write", "Edit", "Bash(git:*)"]`.

**`tool_choice` parameter options:**

| Option | Behavior | When to use |
|--------|----------|-------------|
| `"auto"` | Claude decides whether to call tools. **Default.** | Most use cases; conversational + tool use |
| `"any"` | Must use one tool, model chooses which. | Guaranteed invocation, tool doesn't matter |
| `{"type": "tool", "name": "..."}` | Forces a specific tool. | Structured JSON extraction, workflow gates |
| `"none"` | No tools allowed. | When tools are defined but shouldn't be used |

When `tool_choice` is `any` or `tool`, the API **prefills the assistant message** — no natural language precedes the `tool_use` block. With extended thinking, only `auto` and `none` are supported. Setting `disable_parallel_tool_use=true` limits to exactly one tool call.

### Task 2.4 — MCP server configuration

**Project-level**: `.mcp.json` in project root — shared via version control. Added with `claude mcp add <name> --scope project`.

**User-level**: `~/.claude.json` — personal config across all projects. Added with `--scope user`.

**Local (default)**: Available only to you in the current project. Added with `--scope local` (or no scope flag).

**Enterprise managed**: `managed-mcp.json` — users cannot add servers through CLI or config files.

Standard configuration format:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..." }
    },
    "remote-server": {
      "url": "https://endpoint.to.connect.to",
      "headers": { "Authorization": "Bearer token" }
    }
  }
}
```

**Environment variable expansion** (`${VAR}` syntax) support varies by client. VS Code and Kiro support it; Claude Desktop uses literal values. In Claude Code, pass via `--env` flags: `claude mcp add github --env GITHUB_TOKEN=value`.

**MCP Resources** provide read-only, application-controlled data. Unlike tools (model-controlled), resources are selected by the application/user. They're identified by URI (`file:///logs/app.log`, `config://app`), support text and binary content, and enable real-time updates via subscriptions.

### Task 2.5 — Built-in tools in Claude Code

**Glob** finds files by name patterns. Returns matching paths sorted by modification time. Use for file discovery: `"**/*.ts"`, `"src/**/*.config.*"`.

**Grep** searches file contents with regex (built on ripgrep). Supports output modes: `content`, `files_with_matches`, `count`. Use for finding code patterns across the codebase.

**Read** reads file contents with line numbers. Supports text files (any size, with pagination), images, PDFs (with page selection), and Jupyter notebooks. **Claude must Read a file before using Edit** to ensure accurate content.

**Write** creates new files or completely overwrites existing ones. Use for new files or full rewrites.

**Edit** performs targeted modifications — surgical changes to specific parts. Fails if the target string isn't found (safety against wrong-file edits). For a one-line fix in a 500-line file, Edit sends ~2 lines vs. Write sending all 500.

**Edit failure fallback**: If Edit fails (target not found), fall back to Read → Write — read the full file, apply modifications, write the entire file back.

The **incremental codebase understanding pattern** is Glob → Grep → Read. Glob discovers file structure, Grep narrows to relevant content, Read provides full context for identified files. Claude Code's system prompt mandates using these built-in tools instead of shell equivalents (`find`, `cat`, `head`).

---

## DOMAIN 3: Claude Code Configuration & Workflows (20%)

This domain covers CLAUDE.md hierarchy, custom commands and skills, path-specific rules, plan mode, iterative refinement, and CI/CD integration.

### Task 3.1 — CLAUDE.md configuration hierarchy

CLAUDE.md files form a layered configuration system, loaded in order of increasing specificity:

1. **Managed policy** (organization-wide, cannot be excluded): macOS `/Library/Application Support/ClaudeCode/CLAUDE.md`; Linux `/etc/claude-code/CLAUDE.md`
2. **User global**: `~/.claude/CLAUDE.md` — personal preferences across all projects
3. **Project root**: `./CLAUDE.md` or `./.claude/CLAUDE.md` — version-controlled, shared with team
4. **Local project**: `./CLAUDE.local.md` — personal project-specific, auto-added to .gitignore
5. **Parent directories**: Claude walks up the tree, loading CLAUDE.md files from each parent. In a monorepo, both `root/CLAUDE.md` and `root/packages/web/CLAUDE.md` load when CWD is `packages/web/`
6. **Subdirectory CLAUDE.md files** load **on demand** when Claude reads files in those directories (not at launch)

**`@import` syntax** expands referenced files inline at load time:

```markdown
See @README.md for project overview and @package.json for available commands.
- Git workflow: @docs/git-workflow.md
- Personal overrides: @~/.claude/my-project-instructions.md
```

Paths resolve relative to the containing CLAUDE.md file. Maximum **5 hops** of recursion.

**`.claude/rules/` directory** provides modular, topic-specific rule files. Rules without `paths` frontmatter load at launch (same priority as `.claude/CLAUDE.md`). Rules with `paths` load on demand when matching files are read. CLAUDE.md survives compaction — it's re-read from disk after `/compact`. Recommended maximum: **200 lines** per file; effective instruction budget is ~100–150 items.

### Task 3.2 — Custom slash commands and skills

**Slash commands** live in `.claude/commands/` (project-scoped, invoked via `/project:name`) or `~/.claude/commands/` (user-scoped). Subdirectories create namespaces: `.claude/commands/frontend/component.md` → `/project:frontend:component`.

Command files use Markdown with YAML frontmatter:

```markdown
---
argument-hint: [issue-number] [priority]
description: Fix a GitHub issue
allowed-tools: Read, Grep, Bash(git diff *)
---
Fix issue #$1 with priority $2. Check the issue description and implement changes.
```

**`$ARGUMENTS`** captures all arguments; **`$1`, `$2`** are positional. `!command` embeds shell output. `@file` references files.

**Skills** (the recommended newer approach) live in `.claude/skills/<name>/SKILL.md` (project) or `~/.claude/skills/<name>/SKILL.md` (user). SKILL.md frontmatter fields:

| Field | Purpose |
|-------|---------|
| `name` | Display name and /slash-command |
| `description` | When to invoke — primary mechanism Claude uses to load skill |
| `argument-hint` | Autocomplete hint, available as `$ARGUMENTS` |
| `context` | `fork` runs in isolated subagent context; `inherit` (default) runs in main conversation |
| `agent` | Subagent type for `context: fork` (e.g., `Explore`, `Plan`, `general-purpose`) |
| `allowed-tools` | Space-separated list: `Read Grep Glob Bash(git *)` |
| `model` | Override: `haiku`, `sonnet`, `opus`, or `inherit` |
| `hooks` | Lifecycle hooks scoped to this skill |

Skill description budget scales at **2% of context window** with a **16,000 character** fallback.

### Task 3.3 — Path-specific rules

The `.claude/rules/` directory supports YAML frontmatter with a `paths` field for glob-based scoping:

```yaml
---
paths:
  - "src/api/**/*.ts"
  - "src/handlers/**/*.ts"
---
# API Design Rules
- All handlers return { data, error } shape
- Use zod for request body validation
```

Glob patterns starting with `{` or `*` must be **quoted** for valid YAML. Path-scoped rules load on demand only when Claude reads files matching the pattern — API guidelines stay out of context when editing React components.

**Comparison**: `.claude/rules/` with paths uses file-pattern-based scoping (concern-based organization — testing.md, security.md). Subdirectory CLAUDE.md uses directory-based scoping (location-based). Rules files avoid merge conflicts since they're separate files; directory CLAUDE.md files risk multiple-editor conflicts.

### Task 3.4 — Plan mode vs. direct execution

**Plan mode** (activate with `Shift+Tab` twice or `/plan`) locks Claude into **read-only operations** — can read files, search, ask questions, but cannot write, edit, or execute commands.

**When to use plan mode**: complex multi-file changes, architectural decisions, unfamiliar codebases, tasks touching **7+ files**. **When to use direct execution**: simple single-file changes, well-understood tasks.

The recommended **4-phase workflow**: Enter plan mode → Research → Create detailed plan → Exit plan mode → Execute.

The **Explore subagent** is a built-in read-only agent (uses Haiku by default) optimized for codebase search and analysis. It isolates verbose discovery output, returning summaries to preserve the main conversation's context. Claude automatically delegates to Explore when in Plan Mode. Tools limited to Read, Grep, Glob.

### Task 3.5 — Iterative refinement patterns

**Input/output examples**: Provide 3–5 diverse, structured examples wrapped in XML tags. Include edge cases. Examples are more effective than step-by-step formatting instructions.

**Test-driven iteration (TDD)** is the strongest pattern for agentic coding: write tests first → confirm they fail → commit failing tests → implement code to pass tests (without modifying tests) → Claude enters autonomous loop (write → test → analyze failures → fix → retest). TDD gives Claude unambiguous feedback, creates an external oracle that stays accurate regardless of context fill, and naturally breaks complex problems into verifiable units.

**Interview pattern**: Claude uses `AskUserQuestion` to surface ambiguities before acting — asking about ambiguous requirements, architectural preferences, and implementation choices.

**Single vs. sequential messages**: Use a **single message** when problems are interconnected (solving one affects others). Use **sequential messages** when problems are independent, giving each focused attention.

### Task 3.6 — CI/CD integration

**`-p` / `--print`** enables headless non-interactive mode:

```bash
claude -p "Review for security vulnerabilities" < app.py > security_report.txt
cat error.log | claude -p "Summarize key errors"
```

**`--output-format json`** returns structured results with `result`, `cost_usd`, `duration_ms`, `num_turns`, `session_id` fields. **`--output-format stream-json`** provides real-time NDJSON processing.

**`--json-schema`** enforces structured output:

```bash
claude -p "Extract function names from auth.py" \
  --output-format json \
  --json-schema '{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}'
```

**Session context isolation**: Each `-p` call without `--continue` or `--resume` starts a **fresh context**, improving review quality (no bias toward previously written code). Chain reviews with `--resume "$session_id"`. Pass prior findings by continuing the same session to avoid duplicate reports.

Key flags for CI: `--allowedTools` for permission scoping, `--max-turns` for cost control, `--append-system-prompt` for role customization, and `--dangerously-skip-permissions` (only in isolated CI containers).

---

## DOMAIN 4: Prompt Engineering & Structured Output (20%)

This domain tests explicit criteria, few-shot prompting, structured output mechanics, validation loops, batch processing, and multi-pass review.

### Task 4.1 — Why explicit criteria beat vague instructions

Vague instructions like **"be conservative"** fail because they lack concrete decision boundaries. Claude cannot consistently interpret what "conservative" means across contexts. The result: inconsistent flagging that erodes developer trust through false positives.

The fix is **specific categorical criteria** with measurable thresholds. Instead of "be concise," specify "3 sentences, each under 20 words." Instead of "be conservative about flagging," define exact categories: "Flag only if the code contains SQL string concatenation, unsanitized user input in queries, or missing parameterized queries."

Provide **context for constraints** — explain WHY a behavior matters: "Never use ellipses because this will be read by text-to-speech." Structure prompts with explicit sections: Role (1 line), Success criteria (bullets), Constraints (bullets), Uncertainty handling, Output format.

### Task 4.2 — Few-shot prompting reduces ambiguity and hallucination

Include **3–5 diverse, relevant examples** to show Claude exactly what you want. Wrap in `<example>` tags to distinguish from instructions. Examples must be relevant (mirror actual use case), diverse (cover edge cases without creating unintended patterns), and clearly structured.

Examples demonstrate **format AND ambiguous case handling** simultaneously. For email classification, an example showing "Can I use my Mixmaster 4000 to mix paint?" classified as "Pre-sale question" (not "Other") resolves a judgment call that instructions alone can't capture.

**Generalization**: Claude 4.x models pay very close attention to example details. Few-shot examples work with extended thinking — use `<thinking>` tags inside examples to show reasoning patterns that Claude generalizes to its own thinking blocks. Few-shot combined with XML tags and structured output reduced hallucination in extraction tasks by **20%** in Anthropic case studies. Start with one example; add more only if output doesn't match.

### Task 4.3 — Structured output guarantees syntax, not semantics

Two complementary features: **JSON outputs** (`output_config.format`) for structured responses, and **strict tool use** (`strict: true`) for guaranteed schema validation. Both use **constrained decoding** — compiling JSON schemas into grammars that restrict token generation during inference.

The **key exam distinction**: structured outputs guarantee **syntactic compliance** (valid JSON, correct types, required fields) but **NOT semantic correctness**. Anthropic explicitly states: "You might get perfectly formatted incorrect answers."

**Schema design best practices**: Mark parameters `required` where possible — each optional parameter roughly doubles grammar state space. Set `additionalProperties: false` on all objects. Use enums with an "other" option paired with a detail field. For nullable fields: `"type": ["string", "null"]`. Limits: max **20 strict tools** per request, max **24 optional parameters** across all strict schemas, max **16 union-type parameters**.

```json
{
  "tools": [{
    "name": "extract_entity",
    "strict": true,
    "input_schema": {
      "type": "object",
      "properties": {
        "category": {"type": "string", "enum": ["person", "org", "location", "other"]},
        "category_detail": {"type": ["string", "null"]},
        "confidence": {"type": "number"}
      },
      "required": ["category", "confidence"],
      "additionalProperties": false
    }
  }],
  "tool_choice": {"type": "any"}
}
```

Combine `tool_choice: {"type": "any"}` with `strict: true` to guarantee both that a tool will be called AND that inputs follow the schema.

### Task 4.4 — Retry loops work for format errors, not missing information

The **retry-with-error-feedback pattern** sends validation errors back to the model: Generate draft → Review against criteria → Refine based on feedback. Each step is a separate API call for logging and branching.

**Limits of retry**: Retries work for format errors (malformed JSON, missing fields, wrong types) — structured outputs now eliminate these entirely. Retries **do NOT work** when information is absent from context. No amount of retrying will hallucinate accurate data that isn't in the source document.

**`detected_pattern` fields** in extraction schemas capture what pattern the model recognized, enabling downstream analysis and systematic error identification.

**Self-correction**: Include both `calculated_total` and `stated_total` fields. The model can flag when a document states one number but the math produces another — internal consistency checking. **Caveat**: when Claude reviews its own work in-context, it may change correct answers to incorrect ones (sycophancy bias). Mitigation: give Claude an explicit out — "If all values are correct, return the original values unchanged."

### Task 4.5 — Message Batches API details

The Batch API offers **50% cost savings** on both input and output tokens, with a **24-hour processing window** (most batches finish in under 1 hour). Up to **100,000 requests** per batch or 256 MB. Results available for 29 days.

Each request requires a unique **`custom_id`** for tracking — results may not match input order. Always use `custom_id` to match results with requests.

**No multi-turn tool calling in batch mode.** Tool use is supported but only single-turn. The batch API cannot execute the tool call loop (send `tool_use` → execute → return `tool_result` → get final response). Each request is standalone.

**Appropriate workloads**: large-scale evaluations, content moderation, bulk classification, data extraction. **Inappropriate**: multi-step reasoning requiring tool loops, interactive applications, complex agentic workflows.

**Failure handling** — four result types per request: `succeeded`, `errored` (not billed — check `error_type`), `canceled` (not billed), `expired` (not billed). Failure of one request does not affect others. Validation is asynchronous — test request shapes with the Messages API first. Prompt caching discounts **stack** with batch discounts.

### Task 4.6 — Self-review fails; independent instances succeed

**Self-review limitations**: When Claude reviews its own work in the same conversation, it retains the reasoning context that produced the original output, creating **confirmation bias**. Claude sometimes changes correct answers just because it was asked to review (sycophancy).

**Independent review instances** use separate API calls with no shared conversation history. The reviewer has no access to the original reasoning chain. **Best-of-N verification** runs the same prompt multiple times — inconsistencies across outputs indicate unreliable results.

The **per-file local + cross-file integration** pattern runs parallel agents examining different files/perspectives independently (Phase 1: local analysis), then a final agent aggregates, deduplicates, and ranks findings (Phase 2: cross-file integration). Anthropic's Code Review product uses this exact architecture.

Structure multi-pass pipelines as: **Generate → Review → Refine → Re-review**, with each step as a separate API call. For independent subtasks, run parallel prompts. Only chain sequentially when outputs depend on previous steps.

---

## DOMAIN 5: Context Management & Reliability (15%)

This domain covers context preservation, escalation design, error propagation, large codebase strategies, human review calibration, and information provenance.

### Task 5.1 — Context preservation techniques

**Progressive summarization risks**: Condensing numerical values, percentages, dates, and customer-stated expectations into vague summaries loses critical transactional facts. Overly aggressive compaction discards subtle but critical context whose importance only becomes apparent later.

**"Lost in the middle" effect**: Models follow a **U-shaped attention pattern** — they process information at the beginning and end of context reliably but may miss findings from middle sections. Mitigation: place key findings summaries at the **beginning** of aggregated inputs and use explicit section headers.

**Tool result accumulation**: Tool results consume tokens disproportionately to their relevance (e.g., 40+ fields per order lookup when only 5 matter). Trim verbose outputs to relevant fields before they accumulate. The safest form of compaction is **tool result clearing**.

**Persistent "case facts" blocks**: Extract transactional facts (amounts, dates, order numbers, statuses) into a structured block included in each prompt **outside** summarized history. For multi-issue sessions, maintain a separate context layer of structured issue data. Modify upstream agents to return structured data (key facts, citations, relevance scores) instead of verbose content.

### Task 5.2 — Escalation triggers must be explicit, not sentiment-based

**Three primary escalation triggers**: (1) customer explicitly requests a human — honor immediately, (2) policy exceptions or gaps — when policy is ambiguous or silent on the specific request, (3) inability to make meaningful progress after retries.

**Sentiment-based escalation is unreliable** because sentiment doesn't correlate with case complexity. A customer may be calm about a complex policy exception or frustrated about a simple issue.

**Self-reported confidence scores are unreliable** because LLM self-reported confidence is poorly calibrated — the agent that's making bad escalation decisions will also produce poorly calibrated confidence scores. The correct approach: **explicit escalation criteria with few-shot examples** demonstrating when to escalate vs. resolve autonomously.

**Multiple customer matches**: When results return multiple matches, ask for **additional identifiers** rather than selecting based on heuristics. This prevents misidentified accounts.

### Task 5.3 — Error propagation requires structured context

The correct pattern: return **structured error context** to the coordinator including failure type, attempted query, partial results, and potential alternative approaches. This enables intelligent recovery — whether to retry, try alternatives, or proceed with partial results.

**Access failures vs. valid empty results**: An access failure (timeout) means the query didn't complete. A valid empty result means the search succeeded but found nothing. These must be distinguished in error reporting. Returning empty results as success when there was a timeout is an anti-pattern.

**Three anti-patterns** the exam tests directly:
- **Silently suppressing errors** (returning empty results as success) — prevents recovery, risks incomplete outputs
- **Terminating entire workflow on single failure** — unnecessarily destructive when recovery strategies could succeed
- **Generic error statuses** ("search unavailable") — hides valuable context from the coordinator

### Task 5.4 — Large codebase exploration strategies

**Context degradation symptoms**: Models start giving inconsistent answers and referencing "typical patterns" rather than specific classes discovered earlier. Running out of context mid-implementation leaves the next session guessing at what happened.

**Scratchpad files** (e.g., `SCRATCHPAD.md`, `claude-progress.txt`) persist key findings across context boundaries. Agents record findings in scratchpad files and reference them for subsequent questions. These files survive context resets and compaction.

**Subagent delegation**: Spawn subagents (particularly the Explore subagent) for verbose discovery tasks. Each subagent gets a dedicated context window; the main agent receives summarized findings without exploration bloat. Summarize findings from one phase before spawning subagents for the next.

**Crash recovery via structured state manifests**: Each agent exports state to a known location. The coordinator loads a manifest on resume and injects state into agent prompts. Subagents write to the filesystem to minimize "game of telephone" effects, passing lightweight references back.

**`/compact`** summarizes older messages to free context space. Preserves architectural decisions, unresolved bugs, and implementation details while discarding redundant tool outputs. Auto-compact triggers when context approaches the limit.

### Task 5.5 — Aggregate accuracy masks document-type issues

A **97% overall accuracy** rate could mean 99.5% on invoices but 85% on handwritten forms. The exam tests understanding that aggregate metrics mask poor performance on specific document types or fields.

**Stratified random sampling** of high-confidence extractions measures ongoing error rates and detects novel patterns — specifically for extractions the model was confident about.

**Field-level confidence scores** (per extraction field, not per document) calibrated against labeled validation sets enable routing low-confidence extractions to human review, prioritizing limited reviewer capacity. Validate accuracy **by document type and field** before reducing human review coverage.

### Task 5.6 — Source attribution gets lost in summarization

When findings are compressed without preserving **claim-source mappings**, source attribution is lost. Require subagents to output structured claim-source mappings including source URLs, document names, relevant excerpts, and publication dates. Downstream agents must preserve these through synthesis.

**Conflicting statistics** from credible sources should be **annotated with source attribution**, not averaged or arbitrarily selected. Present both values with their sources and let the synthesis layer reconcile.

**Temporal data** must include publication or collection dates. A statistic from 2020 vs. 2024 isn't a contradiction — it's temporal change. Without dates, temporal differences get misinterpreted as conflicting information.

Structure synthesis output to distinguish well-established findings from contested ones, preserving original source characterizations and methodological context. Render appropriately by content type: financial data as tables, news as prose, technical findings as structured lists.

---

## Conclusion: What the exam actually tests

This certification does not test rote memorization of API parameters. It tests **applied architectural judgment** — knowing when to use hooks vs. prompts for enforcement, why `isError: true` goes in the result object (not the protocol error), why self-review fails due to retained reasoning context, and why "be conservative" is an anti-pattern replaced by explicit categorical criteria. The six highest-leverage concepts across all domains are: route on `stop_reason` never on parsed text, subagents get fresh context windows with no inherited history, hooks are deterministic while prompts are probabilistic, structured output guarantees syntax but not semantics, access failures and empty results must be distinguished, and aggregate accuracy masks document-type-specific problems. Master these distinctions and the specific code patterns documented above, and the exam's scenario-based questions become straightforward applications of these principles.
---

# Part 2: PageIndex and the Rise of Reasoning-Based RAG

**PageIndex is a standalone vectorless RAG framework by Vectify AI — not a LlamaIndex component — that replaces embedding similarity with LLM reasoning over hierarchical document trees, achieving 98.7% accuracy on FinanceBench.** This represents a paradigm shift for structured document retrieval: instead of chunking documents and searching by cosine similarity, PageIndex builds a JSON-based "Table of Contents" tree and lets an LLM reason its way to the correct sections, much like a human expert navigating a 200-page financial filing. The approach is particularly powerful for insurance, legal, and financial documents where **similarity ≠ relevance** — many clauses share identical language but differ critically in applicability. For insurance RAG systems, PageIndex's architecture offers a compelling alternative or complement to the standard ChromaDB + Voyage AI vector pipeline.

---

## How PageIndex actually works under the hood

PageIndex operates in two distinct phases that separate expensive structural analysis from fast query-time reasoning.

**Phase 1 — Indexing (offline).** A high-capability model (GPT-4o or equivalent) reads the entire document, identifies structural boundaries — headings, sections, subsections, paragraphs — and generates a recursive JSON tree. Each node contains:

```json
{
  "node_id": "0006",
  "title": "Financial Stability",
  "start_index": 21,
  "end_index": 22,
  "summary": "The Federal Reserve's monitoring of...",
  "metadata": {},
  "sub_nodes": [
    {
      "node_id": "0007",
      "title": "Monitoring Financial Vulnerabilities",
      "start_index": 22,
      "end_index": 28,
      "summary": "The Federal Reserve's monitoring..."
    }
  ]
}
```

The `start_index` and `end_index` fields map to page ranges, enabling precise content retrieval. The `summary` field is an LLM-generated description of that section's content. The tree is stored as a lightweight JSON artifact — **no vector database, no embeddings, no external infrastructure**.

**Phase 2 — Retrieval (online).** A faster, cheaper model (GPT-4o-mini) receives the user query plus the entire tree structure within its context window. This is the critical architectural insight: the tree index is an **in-context index**, living inside the LLM's active reasoning context rather than in an external database. The retrieval follows an iterative loop:

1. The LLM reads the tree's top-level summaries and selects the most promising branch
2. It navigates deeper into that branch, reading sub-node summaries at each level
3. Upon reaching relevant leaf nodes, it retrieves their full raw content via `node_id`
4. If the retrieved information is insufficient, the LLM returns to the tree and explores additional branches
5. Once enough context is assembled, it generates the final answer

This process is inspired by **Monte Carlo Tree Search** (the algorithm behind AlphaGo), where the system strategically explores a decision tree rather than exhaustively scanning all possibilities. The LLM can follow in-document cross-references ("see Appendix G"), integrate chat history for multi-turn conversations, and retrieve semantically coherent sections rather than arbitrary fixed-size chunks.

---

## Five fundamental failures of vector RAG that reasoning solves

The technical motivation for PageIndex centers on five well-documented limitations of vector-based retrieval that become acute with professional documents.

**Query-knowledge space mismatch** is the first and most fundamental problem. Vector retrieval assumes the most semantically similar text is the most relevant, but queries often express intent rather than content. An insurance adjuster asking "What's the maximum payout for water damage on a standard homeowner's policy?" needs the specific coverage table — not the executive summary paragraph that uses similar vocabulary. PageIndex's LLM can reason: *"Coverage limits are typically in the Schedule of Benefits section"* and navigate directly there.

**Similarity without relevance** plagues domain-specific corpora especially. Insurance policies contain dozens of clauses with near-identical language but critically different applicability (e.g., "Coverage A" vs. "Coverage B" exclusions). Embedding models cannot distinguish these based on vector distance alone. **Hard chunking destroys context** — splitting a coverage table across two 512-token chunks severs the header from its data, making both fragments meaningless. PageIndex retrieves complete, natural sections.

**Inability to follow cross-references** represents a structural limitation of flat vector indexes. When a policy states "subject to the limitations described in Section 4.2," vector search cannot follow that reference. PageIndex's tree-aware LLM navigates to Section 4.2 and retrieves the relevant content. Finally, **stateless retrieval** means each vector query is independent — the retriever doesn't know the user just asked about "flood coverage" and now says "what about the deductible?" PageIndex maintains conversational context to refine retrieval across turns.

---

## LlamaIndex index types compared with PageIndex

Since PageIndex is not part of LlamaIndex, understanding the closest equivalents in LlamaIndex is essential for deciding which approach to use in an insurance RAG system. The table below maps each index type's core mechanism, cost profile, and ideal use case:

| Index type | Retrieval mechanism | Build cost | Query cost | Best scenario |
|---|---|---|---|---|
| **VectorStoreIndex** | Embedding similarity (top-k ANN) | Embedding only | 1 LLM call | General-purpose semantic search |
| **TreeIndex** (LLM select) | LLM traverses summary tree top-down | O(N/k) summaries | O(log N) LLM calls | Hierarchical docs, reasoning queries |
| **DocumentSummaryIndex** (LLM) | LLM reads doc summaries, selects relevant docs | O(D) summaries | O(D/batch) LLM calls | Multi-document routing |
| **KeywordTableIndex** | Exact keyword matching via lookup table | O(N) keyword extraction | Dictionary lookup + 1 LLM | Domain-specific terminology search |
| **KnowledgeGraphIndex** | Entity-relationship graph traversal | O(N) triplet extraction | Graph traversal + 1 LLM | Entity-relationship queries |
| **SummaryIndex** (default) | Returns ALL nodes, no filtering | Zero | O(N) — every node | Full-document summarization |
| **PageIndex** (Vectify AI) | LLM reasons over JSON tree in-context | O(1) LLM call for tree | Multiple LLM calls for tree search | Long structured professional docs |

**LlamaIndex's TreeIndex is architecturally closest to PageIndex.** Both build hierarchical summary trees and use LLM reasoning to traverse them. The key differences: TreeIndex builds its tree bottom-up by summarizing groups of child nodes, while PageIndex analyzes the document holistically to produce a structure-aware tree. TreeIndex stores its tree in LlamaIndex's internal data structures, while PageIndex keeps everything as a portable JSON artifact. TreeIndex can optionally use embedding-based branch selection; PageIndex is purely reasoning-driven.

**DocumentSummaryIndex** offers a different flavor of LLM-based retrieval. It generates a summary per document (not per section), then presents batches of summaries to the LLM at query time. The LLM selects which documents are relevant and returns all chunks from those documents. This works well as a **first-stage router** in multi-document systems but lacks PageIndex's granular within-document navigation.

**RouterQueryEngine** doesn't index anything itself but uses LLM reasoning to select which underlying query engine handles each query. For an insurance RAG system, this enables routing policy questions to one index, claims questions to another, and regulatory questions to a third — a critical architectural pattern for multi-document-type systems.

---

## The broader landscape of reasoning-based retrieval

PageIndex exists within a rapidly evolving ecosystem of approaches that move beyond pure vector similarity.

**Self-RAG** (Asai et al., ICLR 2024 Oral) trains a single language model to generate special reflection tokens that decide *when* to retrieve, evaluate *whether* retrieved passages are relevant, and check *whether* the generated answer is supported by evidence. The model internally controls the entire retrieval-generation loop without external orchestration. Self-RAG (13B parameters) achieved **55.8% on PopQA** versus 14.7% for vanilla Llama2-13B, demonstrating that learned retrieval decisions dramatically outperform fixed retrieve-then-generate pipelines.

**CRAG** (Corrective RAG) takes a plug-and-play approach: a fine-tuned T5-large evaluator grades retrieved documents as Correct, Incorrect, or Ambiguous, then triggers different strategies — proceeding with refinement, falling back to web search, or combining both. This lightweight correction layer improves any existing RAG pipeline without requiring model retraining.

**RAPTOR** (Stanford, ICLR 2024) constructs hierarchical summary trees similarly to PageIndex but retains vector search at retrieval time. Documents are chunked, embedded, clustered via Gaussian Mixture Models, and summarized recursively. At query time, the query embedding is compared against nodes at **all tree levels** simultaneously, enabling retrieval from any abstraction level. RAPTOR achieved a **20% absolute accuracy improvement** on the QuALITY benchmark when paired with GPT-4.

**Agentic RAG** represents the most general pattern: an LLM agent orchestrates retrieval as one of multiple tools, deciding when to search, what queries to issue, whether results are sufficient, and when to rewrite queries. LlamaIndex implements this through `ReActAgent` and `OpenAIAgent` with query engine tools, while LangGraph implements it as a state machine with explicit retrieve → grade → rewrite → generate loops.

The emerging consensus is that **hybrid architectures will dominate production systems** — vectors for broad recall across large corpora, metadata filters for structured constraints, reasoning-based methods for precision within complex documents, and reranking as a final quality filter.

---

## Building an insurance RAG system: architecture patterns

For an insurance domain RAG system using LlamaIndex, ChromaDB, and Voyage AI embeddings, several proven patterns emerge from production deployments.

**Page-level chunking with rich metadata** is the foundation. Insurance documents — policy declarations, endorsements, claims forms — are naturally page-bounded. Each page becomes one chunk, preserving table structures, form layouts, and section context. Metadata should include `policy_type` (auto, home, life, health), `effective_date`, `state`, `page_number`, `section_type` (declarations, coverage, exclusions, conditions), and `document_id`. This enables LlamaIndex's `VectorIndexAutoRetriever` to automatically infer metadata filters from natural language: "What are the auto policy limits in California for 2024?" generates filters `policy_type="auto"`, `state="California"`, `year=2024` before vector search even begins.

**A multi-tier retrieval architecture** combines the strengths of multiple approaches:

```
Tier 1: Query Classification → RouterQueryEngine routes to appropriate index
  ├── Policy Documents (VectorStoreIndex + ChromaDB + Voyage AI)
  ├── Claims Records (VectorStoreIndex + metadata filtering)  
  ├── Regulatory Documents (SummaryIndex for full-context synthesis)
  └── Cross-document Analysis (SubQuestionQueryEngine for decomposition)

Tier 2: Within-document Retrieval
  ├── Vector similarity (Voyage AI embeddings via ChromaDB)
  ├── BM25 keyword matching (for policy numbers, coverage codes)
  └── Metadata filtering (date, state, coverage type)

Tier 3: Reranking + Context Assembly
  ├── Cross-encoder reranking for precision
  └── Parent-document retrieval (expand chunks to full pages)
```

The **ChromaDB + Voyage AI integration** in LlamaIndex is straightforward:

```python
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.voyageai import VoyageEmbedding
import chromadb

db = chromadb.PersistentClient(path="./chroma_db")
collection = db.get_or_create_collection("insurance_policies")
vector_store = ChromaVectorStore(chroma_collection=collection)

embed_model = VoyageEmbedding(model_name="voyage-3-large")
Settings.embed_model = embed_model

index = VectorStoreIndex.from_documents(
    documents, 
    storage_context=StorageContext.from_defaults(vector_store=vector_store)
)
```

For **hybrid retrieval combining BM25 and vector search** — essential for insurance documents with specific policy numbers and coverage codes — use `QueryFusionRetriever` with reciprocal rank fusion:

```python
from llama_index.core.retrievers import QueryFusionRetriever
from llama_index.retrievers.bm25 import BM25Retriever

hybrid_retriever = QueryFusionRetriever(
    retrievers=[vector_retriever, bm25_retriever],
    similarity_top_k=5,
    mode="reciprocal_rerank",
)
```

**Integrating PageIndex-style reasoning** into a LlamaIndex pipeline is possible through a custom reasoning → page selection → answer pattern. Pre-generate page summaries during indexing, store them alongside the vector index, then at query time have the LLM reason over summaries to identify candidate pages before performing targeted vector search within those pages. This hybrid captures the precision of reasoning-based retrieval with the scalability of vector search.

---

## The query-to-answer flow in a reasoning-based system

The complete retrieval flow in a PageIndex-style reasoning system differs fundamentally from vector RAG at every stage:

**Vector RAG flow:** Query → Embed query → ANN search in vector DB → Return top-k chunks → Synthesize answer. Total LLM calls: **1** (synthesis only). Retrieval is entirely mathematical — no reasoning involved.

**PageIndex reasoning flow:** Query → LLM reads tree index in context → LLM reasons about document structure → Selects promising branches → Navigates to leaf nodes → Retrieves full section content → Evaluates sufficiency → (If insufficient: navigates to additional sections) → Assembles context → Generates answer with citations. Total LLM calls: **3-8** depending on tree depth and query complexity. Every retrieval decision involves explicit reasoning.

**Hybrid flow for an insurance RAG system:** Query → LLM classifies query type and extracts metadata filters → Metadata pre-filtering narrows document set → Vector search within filtered set → BM25 keyword search in parallel → Reciprocal rank fusion → Cross-encoder reranking → Page-boundary context expansion → Answer generation with page citations. Total LLM calls: **2-3** (classification + reranking + synthesis). Balances reasoning precision with vector efficiency.

The key architectural insight is that **reasoning and vector retrieval are complementary, not competing**. Reasoning excels at navigating within complex documents and following structural cues. Vector search excels at broad recall across large corpora. The optimal architecture likely uses vector search to identify the right 3-5 documents from hundreds, then reasoning-based navigation to find the precise answer within those documents.

---

## Trade-offs that determine when to use each approach

The decision between vector-based, reasoning-based, and hybrid approaches depends on five critical dimensions.

**Latency** strongly favors vector search. An ANN query returns results in **single-digit milliseconds**; PageIndex's multi-step LLM reasoning takes **2-10 seconds** per query depending on tree depth. For real-time chat interfaces, pure reasoning-based retrieval may feel sluggish. Hybrid approaches mitigate this by limiting reasoning to a pre-filtered subset.

**Cost per query** scales with LLM token usage. Vector search costs only embedding computation (~$0.001/query with Voyage AI). PageIndex consumes tokens for the tree structure in context plus multiple reasoning steps — roughly **$0.02-0.10/query** with GPT-4o-mini. For high-volume applications, this 20-100x cost increase is significant. For high-value, low-volume professional analysis (insurance underwriting, legal review), the accuracy improvement justifies the cost.

**Accuracy** is where PageIndex excels. Its **98.7% on FinanceBench** significantly outperforms standard vector RAG baselines on structured professional documents. The advantage is most pronounced for queries requiring structural navigation, cross-referencing, or distinguishing between similar but contextually different passages — exactly the patterns common in insurance documents.

**Scalability** limits pure reasoning approaches. The tree index must fit within the LLM's context window, which constrains corpus size. Vector databases scale to billions of documents effortlessly. For systems with hundreds of policy documents, a two-stage architecture — vector search for document selection, reasoning for within-document navigation — provides the best balance.

**Explainability** is a clear win for reasoning-based approaches. PageIndex produces a reasoning trace showing exactly *why* each section was selected, which pages were consulted, and how the answer was derived. This audit trail is invaluable for insurance applications where regulatory compliance requires traceable decision-making. Vector search offers only similarity scores — opaque and difficult to explain to regulators or customers.

---

## Conclusion: a practical decision framework

The research reveals that PageIndex represents a genuine architectural innovation, not just an incremental improvement. Its core insight — that **retrieval is a reasoning problem, not a similarity problem** — is particularly well-validated for the insurance domain, where document structure carries critical semantic information that chunking destroys and embeddings cannot capture.

The recommended architecture combines three layers: **Voyage AI embeddings in ChromaDB** for fast, scalable semantic search across the full policy corpus; **LlamaIndex's RouterQueryEngine** for intelligent query classification and routing across document types; and **reasoning-based within-document navigation** (via PageIndex directly, LlamaIndex's TreeIndex, or a custom summary-based approach) for precise answer extraction from long, complex policy documents. The emerging academic evidence from Self-RAG, CRAG, RAPTOR, and the PwC systematic evaluation of vector vs. non-vector RAG architectures consistently shows that reasoning-augmented retrieval outperforms pure vector approaches on complex professional documents — the exact documents such systems must handle. The practical path forward is not choosing between vectors and reasoning but orchestrating both: vectors for breadth, reasoning for depth, metadata for precision, and reranking for quality assurance.
---

# Part 3: Claude Certified Architect — Complete Gap-Fill Study Reference

**This reference covers all 28 knowledge gaps across the five exam domains**, providing exact code definitions, JSON structures, API flows, and configuration syntax sourced from official Anthropic documentation, the Agent SDK repos, and the MCP specification. Every section is organized by domain and gap number for fast lookup during study.

---

## Domain 1 — Agentic architecture (27% of exam)

### Gap 1: AgentDefinition — exact type definitions in both SDKs

The `AgentDefinition` describes a named subagent that can be spawned by the orchestrator via the `Task` or `Agent` tool. The TypeScript SDK exposes more fields than Python.

**TypeScript:**
```typescript
type AgentDefinition = {
  description: string;                          // When to use this agent (required)
  prompt: string;                               // Agent's system prompt (required)
  tools?: string[];                             // Allowed tool names; omit to inherit all
  disallowedTools?: string[];                   // Tools to block
  model?: "sonnet" | "opus" | "haiku" | "inherit"; // Default: inherit
  mcpServers?: AgentMcpServerSpec[];            // MCP servers for this agent
  skills?: string[];                            // Skills to preload
  maxTurns?: number;                            // Tool-use turn limit
  criticalSystemReminder_EXPERIMENTAL?: string; // Experimental reminder
};
```

**Python:**
```python
@dataclass
class AgentDefinition:
    description: str          # Required
    prompt: str               # Required
    tools: list[str] | None = None     # Default: None (inherit all)
    model: Literal["sonnet", "opus", "haiku", "inherit"] | None = None
```

The Python dataclass currently has **four fields**; the TypeScript version adds `disallowedTools`, `mcpServers`, `skills`, `maxTurns`, and an experimental field. Agents are passed to `query()` through the `agents` dict inside the options object. Here is the canonical pattern in both languages:

**TypeScript — passing agents:**
```typescript
for await (const message of query({
  prompt: "Review this codebase",
  options: {
    allowedTools: ["Read", "Glob", "Grep", "Task"],
    agents: {
      "code-reviewer": {
        description: "Expert code reviewer",
        prompt: "Analyze code quality and suggest improvements.",
        tools: ["Read", "Glob", "Grep"],
        model: "sonnet"
      }
    }
  }
})) { /* handle messages */ }
```

**Python — passing agents:**
```python
async for message in query(
    prompt="Use the code-reviewer agent to review this codebase",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Glob", "Grep", "Agent"],
        agents={
            "code-reviewer": AgentDefinition(
                description="Expert code reviewer",
                prompt="Analyze code quality and suggest improvements.",
                tools=["Read", "Glob", "Grep"]
            )
        }
    )
): ...
```

The `Task` (or `Agent`) tool name must appear in `allowedTools` for the orchestrator to spawn subagents. The `description` field is what Claude reads to decide which agent to invoke.

---

### Gap 2: allowedTools vs disallowedTools — the permission pipeline

These two parameters serve fundamentally different purposes. **`allowedTools` is a permission allowlist** — it auto-approves the listed tools so no human confirmation is required, but **does not remove unlisted tools** from Claude's toolbox. **`disallowedTools` is a hard block** — it removes tools from the model entirely, and overrides even `bypassPermissions` mode.

The SDK evaluates permissions in this exact order:

1. **Deny rules** (`disallowedTools` + `settings.json` deny list) — checked first; if matched, tool is **blocked unconditionally**
2. **Permission mode** — `bypassPermissions` approves everything not denied; `acceptEdits` approves file ops; others fall through
3. **Allow rules** (`allowedTools` + `settings.json` allow list) — if matched, tool is **auto-approved**
4. **Hooks** — custom code can allow, deny, or modify tool requests
5. **`canUseTool` callback** — prompts the user at runtime

**Critical interaction rules:**
- Setting `allowed_tools=["Read"]` alongside `permission_mode="bypassPermissions"` still approves **every** tool — `allowedTools` does not constrain bypass mode
- `disallowedTools` **can** block tools even in `bypassPermissions`
- For a locked-down agent in TypeScript, pair `allowedTools` with `permissionMode: "dontAsk"` — listed tools are approved, everything else is denied outright without prompting

**Syntax across surfaces:**

| Surface | Allow syntax | Deny syntax |
|---------|-------------|-------------|
| Python SDK | `allowed_tools=["Read","Grep"]` | `disallowed_tools=["Bash(rm*)","Write"]` |
| TypeScript SDK | `allowedTools: ["Read","Grep"]` | `disallowedTools: ["Bash(rm*)","Write"]` |
| CLI flags | `--allowedTools "Read,Grep"` | `--disallowedTools "Write,Edit"` |
| AgentDefinition (TS) | `tools: ["Read","Grep"]` | `disallowedTools: ["Write"]` |

---

### Gap 3: MCP tool format strings in allowedTools

MCP tools follow a **triple-underscore namespace convention**: `"mcp__<server-name>__<tool-name>"`. The server name maps directly to the key in your `mcpServers` configuration dictionary. A wildcard allows all tools from a server: `"mcp__<server-name>__*"`.

```typescript
options: {
  mcpServers: {
    "github": { /* config */ },
    "db": { /* config */ }
  },
  allowedTools: [
    "mcp__github__*",              // All tools from the github server
    "mcp__db__query",              // Only the query tool from db server
    "mcp__slack__send_message"     // Specific tool from slack server
  ]
}
```

```python
options = ClaudeAgentOptions(
    mcp_servers={"calc": calculator_server},
    allowed_tools=["mcp__calc__add", "mcp__calc__multiply"],
)
```

On the CLI: `--allowedTools "mcp__gitlab"` allows all tools from the `gitlab` server. MCP prompts are referenced as `/mcp__servername__promptname`.

---

### Gap 4: ResultMessage / SDKResultMessage — complete type definitions

The result message is a **discriminated union** keyed on `subtype`. The success variant carries `result` (text) and optional `structured_output`; error variants carry an `errors` array instead.

**TypeScript (`SDKResultMessage`):**
```typescript
type SDKResultMessage =
  | {
      type: "result";
      subtype: "success";
      uuid: UUID;
      session_id: string;
      duration_ms: number;
      duration_api_ms: number;
      is_error: boolean;
      num_turns: number;
      result: string;                         // Final text output
      stop_reason: string | null;             // "end_turn", "max_tokens", "refusal"
      total_cost_usd: number;
      usage: NonNullableUsage;                // { input_tokens, output_tokens, ... }
      modelUsage: { [model: string]: ModelUsage };
      permission_denials: SDKPermissionDenial[];
      structured_output?: unknown;
    }
  | {
      type: "result";
      subtype: "error_max_turns" | "error_during_execution"
             | "error_max_budget_usd" | "error_max_structured_output_retries";
      uuid: UUID;
      session_id: string;
      duration_ms: number;
      duration_api_ms: number;
      is_error: boolean;
      num_turns: number;
      stop_reason: string | null;
      total_cost_usd: number;
      usage: NonNullableUsage;
      modelUsage: { [model: string]: ModelUsage };
      permission_denials: SDKPermissionDenial[];
      errors: string[];                       // Error descriptions
    };
```

**Python (`ResultMessage`):**
```python
@dataclass
class ResultMessage:
    subtype: str                                 # "success" or "error_*"
    duration_ms: int
    duration_api_ms: int
    is_error: bool
    num_turns: int
    session_id: str
    total_cost_usd: float | None = None
    usage: dict[str, Any] | None = None          # {input_tokens, output_tokens, ...}
    result: str | None = None                     # Only on success
    stop_reason: str | None = None
    structured_output: Any = None
```

**Five subtype values:** `"success"`, `"error_max_turns"`, `"error_max_budget_usd"`, `"error_during_execution"`, `"error_max_structured_output_retries"`. All error subtypes still carry `total_cost_usd`, `usage`, `num_turns`, and `session_id` for post-mortem analysis and session resumption.

---

### Gap 5: fork_session — exact syntax in both SDKs

Forking creates a **new session** starting with a copy of the original's history, then diverging. The original session is untouched and can be resumed independently.

**Python — `fork_session=True`:**
```python
# Step 1: Run initial query, capture session_id
session_id = None
async for message in query(
    prompt="Analyze the auth module",
    options=ClaudeAgentOptions(allowed_tools=["Read", "Glob", "Grep"]),
):
    if isinstance(message, ResultMessage):
        session_id = message.session_id

# Step 2: Fork (resume + fork_session together)
async for message in query(
    prompt="Try OAuth2 instead of JWT",
    options=ClaudeAgentOptions(
        resume=session_id,          # Point to original session
        fork_session=True,          # Branch into new session
    ),
):
    if isinstance(message, ResultMessage):
        forked_id = message.session_id   # New ID, different from session_id

# Step 3: Original session continues independently
async for message in query(
    prompt="Continue JWT approach",
    options=ClaudeAgentOptions(resume=session_id),
): ...
```

**TypeScript — `forkSession: true`:**
```typescript
for await (const message of query({
  prompt: "Try OAuth2 instead",
  options: {
    resume: sessionId,        // Original session
    forkSession: true,        // Fork into new session
  }
})) {
  if (message.type === "result") {
    console.log(`Forked: ${message.session_id}`);  // New session ID
  }
}
```

**Key behavior:** Forking branches the **conversation history**, not the filesystem. If a forked agent edits files, those changes are real and visible to any session in the same directory.

| SDK | Resume param | Fork param |
|-----|-------------|------------|
| Python | `resume=session_id` | `fork_session=True` |
| TypeScript | `resume: sessionId` | `forkSession: true` |

---

### Gap 6: max_turns and max_budget_usd

**`max_turns` counts only tool-use turns, not text-only turns.** The official docs define a "turn" as one round trip: Claude produces output containing tool calls → SDK executes tools → results feed back. The final text-only response is not counted.

| SDK | Turn limit | Budget limit |
|-----|-----------|-------------|
| Python | `max_turns: int \| None = None` | `max_budget_usd: float \| None = None` |
| TypeScript | `maxTurns?: number` | `maxBudgetUsd?: number` |

When limits are hit, the SDK returns a `ResultMessage` with the corresponding error subtype (`"error_max_turns"` or `"error_max_budget_usd"`), **not** an exception. The message still contains `total_cost_usd`, `num_turns`, and `session_id` for diagnostics.

```python
if isinstance(message, ResultMessage):
    if message.subtype == "error_max_turns":
        print(f"Hit turn limit after {message.num_turns} turns")
    elif message.subtype == "error_max_budget_usd":
        print(f"Hit budget at ${message.total_cost_usd}")
```

---

### Gap 7: The Explore subagent

Claude Code ships three built-in subagent types:

| Subagent | Model | Tools | Purpose |
|----------|-------|-------|---------|
| **Explore** | **Haiku** (fast, cheap) | Glob, Grep, Read, safe Bash (ls, git status/log/diff, find, cat, head, tail) | Codebase exploration — strictly read-only |
| **Plan** | **Sonnet** (or Opus with `opusplan`) | Read, Glob, Grep, Bash | Research for planning mode |
| **general-purpose** | **Sonnet** (inherits) | All tools (full read/write) | Complex multi-step tasks |

The Explore subagent's system prompt includes `"=== CRITICAL: READ-ONLY MODE — NO FILE MODIFICATIONS ==="`. It supports **three thoroughness levels**: `quick` (targeted lookups), `medium` (balanced), `very thorough` (comprehensive). In **plan mode**, Claude delegates research to the **Plan** subagent, not Explore. Explore keeps exploration results **out of the main conversation context** via context isolation, saving tokens in the parent session.

---

### Gap 8: The /compact command and auto-compaction

**Auto-compaction triggers** when the context window approaches approximately **95% capacity**. Claude Code then summarizes the conversation history automatically.

**What is preserved:** Current task state, key decisions, important code snippets, next steps, and learnings. **What may be lost:** Detailed early instructions, verbose tool outputs (cleared first), and granular conversation details. Persistent instructions should live in `CLAUDE.md`.

**Manual compaction** accepts optional focus instructions:
```
/compact                                      # Basic compact
/compact Focus on code samples and API usage  # Custom preservation
```

**The `compact_boundary` message** marks where compaction occurred in the SDK event stream:
```typescript
type SDKCompactBoundaryMessage = {
  type: "system";
  subtype: "compact_boundary";
  uuid: UUID;
  session_id: string;
  compact_metadata: {
    trigger: "manual" | "auto";     // How compaction was triggered
    pre_tokens: number;              // Token count before compaction
  };
};
```

A **`PreCompact` hook** fires before compaction, allowing custom code to run. After compaction, a `SessionStart` event fires with `source: "compact"`.

---

## Domain 2 — Tool design and MCP (18% of exam)

### Gap 9: MCP error handling — two distinct error types

**Protocol-level errors** use the standard JSON-RPC 2.0 `error` field and are **NOT visible to the LLM**:
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "error": {
    "code": -32602,
    "message": "Unknown tool: invalid_tool_name"
  }
}
```

Standard error codes: `-32700` (parse), `-32600` (invalid request), `-32601` (method not found), `-32602` (invalid params), `-32603` (internal error), `-32002` (resource not found, MCP-specific).

**Tool execution errors** are returned as a successful JSON-RPC response with `isError: true` in the `CallToolResult`. These **ARE visible to the LLM** so it can self-correct:
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      { "type": "text", "text": "API rate limit exceeded" }
    ],
    "isError": true
  }
}
```

The spec states: *"Any errors that originate from the tool SHOULD be reported inside the result object with isError set to true, NOT as an MCP protocol-level error response."*

---

### Gap 10: MCP tool definition schema and CallToolResult

**Complete Tool interface (spec version 2025-06-18):**
```typescript
interface Tool {
  name: string;
  title?: string;                    // Human-readable display name
  description?: string;
  inputSchema: {
    type: "object";
    properties?: { [key: string]: object };
    required?: string[];
  };
  outputSchema?: {                   // New in draft spec
    type: "object";
    properties?: { [key: string]: object };
    required?: string[];
  };
  annotations?: ToolAnnotations;
  _meta?: { [key: string]: unknown };
}

interface ToolAnnotations {
  title?: string;
  readOnlyHint?: boolean;            // Tool does not modify environment
  destructiveHint?: boolean;         // May perform destructive updates
  idempotentHint?: boolean;          // Repeated calls have no additional effect
  openWorldHint?: boolean;           // Interacts with external entities
}
```

**CallToolResult type:**
```typescript
interface CallToolResult {
  content: ContentBlock[];           // TextContent | ImageContent | AudioContent
                                     // | ResourceLink | EmbeddedResource
  structuredContent?: any;           // JSON object (when outputSchema is used)
  isError?: boolean;                 // Default: false
  _meta?: { [key: string]: unknown };
}
```

Content types include `{ type: "text", text: "..." }`, `{ type: "image", data: "base64...", mimeType: "image/png" }`, `{ type: "audio", data: "base64...", mimeType: "audio/wav" }`, and `{ type: "resource_link", uri: "...", name: "..." }`.

When `outputSchema` is provided, the server returns both `content` (text representation) and `structuredContent` (parsed JSON matching the schema). Annotations are **hints only** — clients must not trust them from untrusted servers.

---

### Gap 11: MCP Resources

Resources are **application-driven** (unlike tools which are model-driven). They provide direct data access without tool calls, reducing exploratory roundtrips.

**Key operations:**
- `resources/list` — enumerate available resources (supports pagination with `cursor` / `nextCursor`)
- `resources/read` — fetch content by URI, returns `contents` array with `uri`, `mimeType`, and `text` or `blob`
- `resources/templates/list` — discover URI templates (RFC 6570) like `file:///{path}`
- `resources/subscribe` / `resources/unsubscribe` — register for change notifications
- `notifications/resources/updated` — server-to-client push when a subscribed resource changes
- `notifications/resources/list_changed` — server-to-client push when the available resource list changes

**Common URI schemes:** `https://` (web), `file:///path/to/file` (filesystem-like), `git://` (version control), and custom schemes like `calendar://events/2024` or `weather://forecast/{city}/{date}`.

**Resource interface:**
```typescript
interface Resource {
  uri: string;
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
  size?: number;              // Bytes
  annotations?: {
    audience?: ("user" | "assistant")[];
    priority?: number;        // 0.0 to 1.0
    lastModified?: string;    // ISO 8601
  };
}
```

Resources reduce exploratory tool calls because a `db://schema` resource eliminates the need for a `describe_tables` tool call. URI templates with parameters (e.g., `weather://forecast/{city}/{date}`) enable parameterized access without custom tool definitions.

---

### Gap 12: Environment variable expansion in .mcp.json

**Syntax:** `${VAR}` expands to the variable's value. `${VAR:-default}` uses the default when the variable is unset. **If a variable is unset and has no default, Claude Code errors out** — it does not silently use an empty string.

**Supported fields:** `command`, `args`, `env`, `url`, `headers`.

```json
{
  "mcpServers": {
    "api-server": {
      "type": "http",
      "url": "${API_BASE_URL:-https://api.example.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_KEY}"
      }
    },
    "db-server": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@some/mcp-server"],
      "env": {
        "SECRET_KEY": "${SECRET_KEY}",
        "DB_URL": "${DATABASE_URL:-postgresql://localhost:5432/mydb}"
      }
    }
  }
}
```

---

### Gap 13: Tool Search and deferred tool loading

Tool Search lets Claude work with **hundreds or thousands** of tools by loading definitions on demand. In the API, mark tools with `"defer_loading": true`. Claude sees a lightweight `tool_search_tool` instead of full definitions, then searches when needed.

**Claude Code auto-enables Tool Search** when MCP tool descriptions exceed **~10% of the context window**. You can control this with `ENABLE_TOOL_SEARCH=true|false|auto:5` (custom threshold percentage).

**Two search tool variants:**
- `tool_search_tool_regex` — Claude constructs regex patterns (max 200 chars)
- `tool_search_tool_bm25` — Claude uses natural language queries

**API-level configuration:**
```json
{
  "name": "get_weather",
  "description": "Get current weather for a location",
  "input_schema": { "type": "object", "properties": { "location": {"type": "string"} } },
  "defer_loading": true
}
```

**MCP integration** uses `mcp_toolset` with per-tool overrides:
```json
{
  "type": "mcp_toolset",
  "mcp_server_name": "database-server",
  "default_config": { "defer_loading": true },
  "configs": { "search_events": { "defer_loading": false } }
}
```

**Key limits:** Maximum **10,000 tools** in catalog, **3–5 results** per search, regex max **200 chars**, supported on **Sonnet 4.0+ and Opus 4.0+ only** (no Haiku). Tool Search delivers up to **85% reduction** in tool token usage and improved tool selection accuracy (Opus 4.5: 79.5% → 88.1%).

---

### Gap 14: All built-in tools in Claude Code

| Tool | Parameters | Purpose | Selection criteria |
|------|-----------|---------|-------------------|
| **Read** | `file_path`, `offset?`, `limit?` | Read files (text, images, PDFs, notebooks). Returns cat -n format, 2000 line default | Start of task; user references a file; before Edit/Write |
| **Write** | `file_path`, `content` | Create new files or overwrite entirely | New files only. Existing files should use Edit |
| **Edit** | `file_path`, `old_string`, `new_string`, `replace_all?` | Surgical find-and-replace in files | Modifying existing files (preferred over Write) |
| **MultiEdit** | `file_path`, `edits[]` (each: `old_string`, `new_string`, `replace_all?`) | Atomic multi-edit on a single file | Multiple changes to same file |
| **Bash** | `command`, `description?`, `timeout?` (default 120s, max 600s), `run_in_background?` | Execute shell commands | Terminal ops only — NOT for reading/editing/searching |
| **Grep** | `pattern`, `path?`, `include?`, `type?`, `output_mode?`, context flags | Content search via ripgrep | Finding text patterns across codebase |
| **Glob** | `pattern`, `path?` | File name pattern matching | Finding files by name, sorted by modification time |
| **LS** | `path`, `ignore?` | Directory listing | When you need a directory listing |
| **Task** | `description`, `prompt` | Spawn subagent (Explore/Plan/general-purpose) | Complex multi-step or open-ended research |
| **WebSearch** | `query`, `allowed_domains?`, `blocked_domains?` | Web search for current information | Up-to-date info beyond knowledge cutoff |
| **WebFetch** | `url`, `prompt` | Fetch and analyze URL content (15-min cache) | Retrieving web content; auto-upgrades HTTP→HTTPS |
| **TodoWrite** | `todos[]` (each: `content`, `activeForm`, `status`, `priority?`, `id?`) | Task tracking | Complex multi-step tasks (3+ steps) |
| **TodoRead** | *(none)* | Read current session todo list | Check progress |
| **NotebookRead** | `notebook_path` | Read Jupyter notebooks | Reviewing .ipynb files |
| **NotebookEdit** | `notebook_path`, `cell_number`, `new_source`, `cell_type?`, `edit_mode?` | Edit notebook cells | Modifying Jupyter notebooks |
| **BashOutput** | `bash_id`, `filter?` | Get output from background shells | Monitoring background processes |
| **KillShell** | `shell_id` | Terminate background shell | Cleaning up background processes |

---

## Domain 3 — Claude Code configuration (20% of exam)

### Gap 15: .claude/rules/ YAML frontmatter

Rule files are `.md` files in `.claude/rules/` (project level) or `~/.claude/rules/` (user level), discovered recursively. Only two frontmatter fields are supported:

```yaml
---
paths:
  - "src/api/**/*.ts"
  - "**/*.{ts,tsx}"
description: "API development rules"
---
# Rule content here in Markdown
```

**`paths`** (array of glob patterns): Scopes the rule to files matching these patterns. Omit for global rules loaded unconditionally. **`description`** (string): Optional description.

**Glob syntax:** `*` matches any characters except `/`, `**` matches recursively through directories, `?` matches a single character, `[abc]` matches character classes, `{a,b}` expands to alternatives.

**YAML quoting is mandatory** for patterns starting with `*` or `{`:
```yaml
# ✅ Correct — quoted
paths:
  - "**/*.ts"
  - "{src,lib}/**/*.ts"

# ❌ Incorrect — unquoted (invalid YAML)
paths:
  - **/*.ts
```

**Loading strategy:** Global rules (no `paths`) are injected at startup. Path-scoped rules are indexed at startup but only activated when Claude accesses a matching file.

---

### Gap 16: SKILL.md frontmatter — all fields

Skills live in `.claude/skills/<name>/SKILL.md` (project) or `~/.claude/skills/<name>/SKILL.md` (personal).

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | string | Directory name | Lowercase letters, numbers, hyphens (max 64 chars) |
| `description` | string | First paragraph | What the skill does; Claude uses this to decide auto-invocation |
| `argument-hint` | string | — | Autocomplete hint shown in command picker |
| `allowed-tools` | string or YAML list | Standard permissions | Tools auto-approved when skill is active |
| `disable-model-invocation` | boolean | `false` | If true, only user can invoke via /name |
| `user-invocable` | boolean | `true` | If false, hidden from / menu; only Claude can invoke |
| `context` | `"inherit"` or `"fork"` | `"inherit"` | `inherit` = runs in main context; `fork` = isolated subagent |
| `agent` | string | `"general-purpose"` | Subagent type when `context: fork` — `Explore`, `Plan`, `general-purpose`, or custom |
| `model` | string | `"inherit"` | `haiku`, `sonnet`, `opus`, `inherit`, or full model ID |
| `hooks` | object | — | Lifecycle hooks (`PreToolUse`, `PostToolUse`) scoped to this skill |
| `version` | string | — | Metadata for version tracking |
| `mode` | boolean | — | If true, categorized as a "mode command" in menus |

**Invocation control matrix:**

| `disable-model-invocation` | `user-invocable` | User invoke? | Claude auto-invoke? |
|---|---|---|---|
| false | true | ✅ | ✅ |
| true | true | ✅ | ❌ |
| false | false | ❌ | ✅ |
| true | false | ❌ | ❌ |

**Complete example with all fields:**
```yaml
---
name: code-review
description: Reviews code for quality and best practices
argument-hint: [file-path]
allowed-tools: Read, Grep, Glob, Bash(git diff:*)
disable-model-invocation: false
user-invocable: true
context: inherit
model: sonnet
version: 1.0.0
hooks:
  PreToolUse:
    - matcher: "Bash"
      once: true
      hooks:
        - type: command
          command: "./scripts/validate.sh"
---
# Code Review Skill
Review $ARGUMENTS for quality, security, and best practices.
```

**Dynamic content variables:** `$ARGUMENTS` (full argument string), `$1`, `$2` (positional arguments), `!`command`` (shell output injected before loading), `@file` (file contents included inline).

---

### Gap 17: Slash command frontmatter and syntax

Custom commands in `.claude/commands/` are now unified with skills — both create `/name` invocations with identical frontmatter. Project commands at `.claude/commands/deploy.md` become `/project:deploy`. Personal commands at `~/.claude/commands/deploy.md` become `/user:deploy`. Subdirectories create namespaced commands.

**Frontmatter fields** are the same as SKILL.md: `allowed-tools`, `description`, `argument-hint`, `model`, `context`, `agent`, `hooks`.

**Dynamic context features:**

`$ARGUMENTS` captures the full argument string after the command name. `$1`, `$2` extract positional arguments. These are text-substituted before Claude sees the prompt.

`!`command`` executes a shell command and injects its output:
```markdown
---
description: Create a git commit with a conventional message
allowed-tools: Bash(git add:*), Bash(git commit:*)
---
## Changes
!`git diff --cached`

Create a commit message following Conventional Commits for $ARGUMENTS.
```

`@file` includes file contents inline:
```markdown
Review the following files:
- @package.json
- @tsconfig.json
Check for security issues and misconfigurations.
```

---

### Gap 18: The -p flag and all headless CLI flags

**Core headless flags:**

| Flag | Short | Values | Description |
|------|-------|--------|-------------|
| `--print` | `-p` | *(boolean)* | Non-interactive mode; send query, print result, exit |
| `--output-format` | — | `text`, `json`, `stream-json` | `text` = plain output; `json` = structured with metadata + `structured_output` field; `stream-json` = NDJSON for real-time streaming |
| `--input-format` | — | `text`, `stream-json` | `stream-json` enables multi-turn JSONL input |
| `--json-schema` | — | JSON schema string | Validates structured output (with `--output-format json`) |
| `--verbose` | — | *(boolean)* | Full turn-by-turn output in stream-json |

**Session management:**

| Flag | Short | Description |
|------|-------|-------------|
| `--continue` | `-c` | Continue most recent conversation |
| `--resume` | `-r` | Resume specific session by ID or name |
| `--fork-session` | — | Branch into new session from resumed session |
| `--session-id` | — | Use specific UUID as session ID |

**Model and agent:**

| Flag | Description |
|------|-------------|
| `--model` | Model name/alias (`sonnet`, `opus`, `haiku`, or full name) |
| `--fallback-model` | Fallback when default is overloaded |
| `--agent` | Specify custom agent name |
| `--agents` | Define subagents via JSON string |

**System prompt control (4 flags):**

| Flag | Description |
|------|-------------|
| `--system-prompt` | **Replaces** entire default system prompt |
| `--system-prompt-file` | Replace with file contents (mutually exclusive with above) |
| `--append-system-prompt` | **Appends** to default system prompt (recommended) |
| `--append-system-prompt-file` | Append file contents |

**Permission and tool flags:**

| Flag | Description |
|------|-------------|
| `--allowedTools` | Auto-approve listed tools (comma-separated) |
| `--disallowedTools` | Block listed tools entirely |
| `--permission-mode` | `default`, `acceptEdits`, `plan`, `bypassPermissions`, `dontAsk` |
| `--dangerously-skip-permissions` | Skip ALL permission checks ⚠️ |
| `--tools` | Restrict available tools (empty string disables all) |

**Execution limits:** `--max-turns` (integer), `--max-budget-usd` (decimal).

**Other notable flags:** `--add-dir` (additional working directories), `--mcp-config` (MCP server JSON file), `--worktree` / `-w` (git worktree isolation), `--debug` (debug logging with optional category filter), `--betas` (beta feature headers), `--effort` (`low`/`medium`/`high`).

---

### Gap 19: Plan mode

Plan mode restricts Claude to **read-only operations** for analysis and planning without making changes.

**Allowed operations:** Read, Grep, Glob, LS, WebSearch, WebFetch, TodoWrite, AskUserQuestion, and writing plan files to `~/.claude/plans/`.

**Blocked operations (by system prompt instruction):** Write, Edit, MultiEdit, Bash (write commands), NotebookEdit, and any destructive filesystem operations.

**Three activation methods:**
1. **Shift+Tab** — cycles through modes: Normal → `⏵⏵ accept edits on` → `⏸ plan mode on`
2. **`/plan [description]`** — enter plan mode, optionally with an immediate planning goal
3. **`--permission-mode plan`** — start a session directly in plan mode

**Important caveat:** Plan mode is enforced via **system prompt instructions**, not hard tool-level blocks. If you have `"allow": ["Write"]` in settings.json, Claude may still perform writes. Use `PreToolUse` hooks for deterministic enforcement.

**Plan subagent vs Explore subagent:** In plan mode, Claude delegates research to the **Plan** subagent (Sonnet model, full read tools). The **Explore** subagent (Haiku model, read-only) can also be used for fast codebase exploration. The Plan subagent prevents infinite nesting — subagents cannot spawn other subagents.

When **exiting plan mode**, Claude asks for **additional confirmation** about the task before executing, ensuring safety during the transition.

---

## Domain 4 — Prompt engineering and structured output (20% of exam)

### Gap 20: Structured outputs (GA January 2026)

Structured outputs provide **guaranteed JSON schema conformance** through constrained decoding — the model literally cannot produce tokens that violate the schema. This is fundamentally different from the old tool_use workaround that relied on best-effort fine-tuning.

**Two complementary features:**
1. **JSON outputs** via `output_config.format` — controls Claude's response format
2. **Strict tool use** via `strict: true` on tool schemas — guarantees tool input validation

**Raw API example:**
```json
{
  "model": "claude-opus-4-6",
  "max_tokens": 1024,
  "messages": [{"role": "user", "content": "Extract info from: John Smith (john@example.com)..."}],
  "output_config": {
    "format": {
      "type": "json_schema",
      "schema": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "email": {"type": "string"}
        },
        "required": ["name", "email"],
        "additionalProperties": false
      }
    }
  }
}
```

**Python SDK with Pydantic:**
```python
from pydantic import BaseModel
from anthropic import Anthropic

class ContactInfo(BaseModel):
    name: str
    email: str

client = Anthropic()
response = client.messages.parse(
    model="claude-opus-4-6",
    max_tokens=1024,
    messages=[{"role": "user", "content": "..."}],
    output_format=ContactInfo,
)
print(response.parsed_output)  # ContactInfo object
```

**Strict tool use:**
```json
{
  "name": "get_weather",
  "strict": true,
  "input_schema": {
    "type": "object",
    "properties": { "location": {"type": "string"} },
    "required": ["location"],
    "additionalProperties": false
  }
}
```

**Three complexity limits (combined across all strict schemas in a request):**

| Limit | Value |
|-------|-------|
| Strict tools per request | **20** |
| Total optional parameters | **24** (across all strict schemas) |
| Parameters with union types (`anyOf`) | **16** |

Compilation timeout is **180 seconds**. Compiled grammars are **cached 24 hours** from last use. Cache invalidates when schema structure changes but NOT when only `name`/`description` changes.

**Edge cases:** `stop_reason: "refusal"` means safety override (output may not match schema). `stop_reason: "max_tokens"` means incomplete output. Not compatible with citations or message prefilling.

**Migration note:** `output_format` (beta) → `output_config.format` (GA). The beta header `structured-outputs-2025-11-13` still works during the transition period.

---

### Gap 21: Complete tool_use API flow

The five-step cycle:

**Step 1 — Define tools and send request:**
```json
{
  "model": "claude-sonnet-4-5",
  "max_tokens": 1024,
  "tools": [{
    "name": "get_weather",
    "description": "Get current weather in a given location",
    "input_schema": {
      "type": "object",
      "properties": {
        "location": { "type": "string", "description": "City and state" }
      },
      "required": ["location"]
    }
  }],
  "messages": [{"role": "user", "content": "What's the weather in SF?"}]
}
```

**Step 2 — Response has `stop_reason: "tool_use"`:**
```json
{
  "role": "assistant",
  "stop_reason": "tool_use",
  "content": [
    { "type": "text", "text": "I'll check the weather for you." },
    {
      "type": "tool_use",
      "id": "toolu_01A09q90qw90lq917835lqs136",
      "name": "get_weather",
      "input": { "location": "San Francisco, CA" }
    }
  ]
}
```

**Step 3 — Execute tool on your system** (client-side).

**Step 4 — Send tool_result referencing `tool_use_id`:**
```json
{
  "role": "user",
  "content": [{
    "type": "tool_result",
    "tool_use_id": "toolu_01A09q90qw90lq917835lqs136",
    "content": "65°F, partly cloudy"
  }]
}
```

**Step 5 — Claude responds with final answer:**
```json
{
  "role": "assistant",
  "stop_reason": "end_turn",
  "content": [{ "type": "text", "text": "The weather in SF is 65°F and partly cloudy." }]
}
```

**`tool_choice` parameter options:** `"auto"` (default — Claude decides), `"any"` (must use a tool), `{"type": "tool", "name": "..."}` (force specific tool), `"none"` (disable tools). When tools are present, an automatic system prompt addition costs **346 tokens** for `auto`/`none`, **313 tokens** for `any`/`tool`.

**Python SDK agentic loop:**
```python
response = client.messages.create(model="claude-sonnet-4-5", max_tokens=1024,
    tools=[...], messages=[{"role": "user", "content": "What's the weather in SF?"}])

if response.stop_reason == "tool_use":
    for block in response.content:
        if block.type == "tool_use":
            result = execute_tool(block.name, block.input)
            follow_up = client.messages.create(model="claude-sonnet-4-5", max_tokens=1024,
                tools=[...],
                messages=[
                    {"role": "user", "content": "What's the weather in SF?"},
                    {"role": "assistant", "content": response.content},
                    {"role": "user", "content": [
                        {"type": "tool_result", "tool_use_id": block.id, "content": result}
                    ]}
                ])
```

---

### Gap 22: Message Batches API

**50% cost discount**, up to **100,000 requests** per batch or **256 MB**, with **29-day result retention**. Most batches complete within 1 hour; the 24-hour expiration is the hard deadline.

**Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/v1/messages/batches` | Create batch |
| `GET` | `/v1/messages/batches/{batch_id}` | Check status |
| `GET` | `/v1/messages/batches/{batch_id}/results` | Download JSONL results |
| `POST` | `/v1/messages/batches/{batch_id}/cancel` | Cancel batch |
| `GET` | `/v1/messages/batches` | List batches |
| `DELETE` | `/v1/messages/batches/{batch_id}` | Delete batch |

**Create request:**
```json
{
  "requests": [
    {
      "custom_id": "req-001",
      "params": {
        "model": "claude-sonnet-4-5",
        "max_tokens": 1024,
        "messages": [{"role": "user", "content": "Hello, world"}]
      }
    }
  ]
}
```

**Processing statuses:** `in_progress`, `canceling`, `ended`.

**Per-request result types:** `succeeded` (includes message), `errored` (not billed), `canceled` (not billed), `expired` (not billed).

**JSONL results format** (results may arrive in any order — use `custom_id` to match):
```jsonl
{"custom_id":"req-002","result":{"type":"succeeded","message":{"id":"msg_...","role":"assistant","content":[{"type":"text","text":"Hello!"}],"stop_reason":"end_turn","usage":{"input_tokens":11,"output_tokens":36}}}}
{"custom_id":"req-001","result":{"type":"succeeded","message":{"id":"msg_...","role":"assistant","content":[{"type":"text","text":"Hi!"}],"stop_reason":"end_turn","usage":{"input_tokens":10,"output_tokens":34}}}}
```

The response object contains `id`, `type` ("message_batch"), `processing_status`, `request_counts` (with `processing`, `succeeded`, `errored`, `canceled`, `expired` counters), `created_at`, `ended_at`, `expires_at`, `cancel_initiated_at`, and `results_url`.

---

### Gap 23: Few-shot prompting best practices

Anthropic recommends **3–5 diverse, relevant examples** for most tasks, and **20+ examples** with prompt caching for complex tasks. Three criteria for effective examples: **relevant** (mirror actual use case), **diverse** (cover edge cases, vary enough to avoid unintended pattern matching), **clear** (wrapped in XML tags).

**Canonical XML structure:**
```xml
<examples>
  <example>
    <input>Customer feedback text here</input>
    <output>
      <reasoning>Analysis of the feedback...</reasoning>
      <classification>Category</classification>
    </output>
  </example>
  <example>
    <input>Different type of feedback</input>
    <output>
      <reasoning>Different analysis...</reasoning>
      <classification>Different Category</classification>
    </output>
  </example>
</examples>
```

**Interaction with extended thinking:** *"Use `<thinking>` tags inside your few-shot examples to show Claude the reasoning pattern. It will generalize that style to its own extended thinking blocks."* When thinking is off, manual chain-of-thought with `<thinking>` and `<answer>` tags can substitute.

**Claude 4.x-specific warning:** *"Claude 4.x models pay close attention to details and examples. Ensure that your examples align with the behaviors you want to encourage and minimize behaviors you want to avoid."* In the API, examples are included at the start of the first user message.

---

## Domain 5 — Context management and reliability (15% of exam)

### Gap 24: Conversation history management

The Messages API is **stateless** — you must pass the **complete** conversation history with every request. Each turn builds on the full prior context:

```json
{
  "messages": [
    {"role": "user", "content": "Hello"},
    {"role": "assistant", "content": "Hi!"},
    {"role": "user", "content": "Follow-up question"}
  ]
}
```

You can inject **synthetic assistant messages** that didn't originate from Claude. The Token Count API (`POST /v1/messages/count-tokens`) is free and lets you measure context size before sending.

**Prompt caching** drastically reduces cost for conversation history. Place `cache_control` on the final block of the conversation to enable incremental caching. Cache read tokens cost **0.1× base input price** (90% savings). Cache write tokens cost 1.25× (5-minute TTL) or 2× (1-hour TTL), refreshed on each use.

**Progressive summarization:** Extract key facts and decisions first, then compress older messages. Risks include losing important early instructions. Anthropic recommends saving critical state to `CLAUDE.md` or disk files rather than relying solely on in-context memory. Context quality degrades well before hitting 100% capacity — around **20–40% usage** is where output quality starts to degrade for some tasks.

---

### Gap 25: Scratchpad files

Claude Code uses a designated scratchpad directory at the OS temporary path: `$TEMP/claude/{project-hash}/{session-id}/scratchpad/`. It also creates `tmpclaude-*-cwd` files in the working directory.

**Common patterns for persistent state:**
- `claude-progress.txt` — Anthropic's recommended progress tracking file
- `feature_list.json` — structured task status tracking
- `plan.md` or `SCRATCHPAD.md` — plans and working notes
- `~/.claude/projects/<project>/memory/MEMORY.md` — auto-memory concise index

**Interaction with /compact:** Scratchpad files **persist on disk** even after compaction. Anthropic's best practice: *"Because the plan is stored on disk, users can run /clear or /compact to free up tokens without losing the project roadmap."* The recommended pattern is to save progress to files before context resets.

The **Memory Tool** (API feature) formalizes this pattern with a `/memories` directory and a protocol: *"ASSUME INTERRUPTION: Your context window might be reset at any moment, so record progress in your memory directory."*

---

### Gap 26: Structured state persistence and crash recovery

Anthropic's official long-running agent pattern (from their engineering blog) uses two phases:

**Initializer Agent** (first context window) creates:
- `init.sh` — bootstraps environment (dev server, test suites)
- `claude-progress.txt` — progress log across sessions
- `feature_list.json` — comprehensive feature tracking with status
- Initial git commit as checkpoint baseline

**Feature list structure:**
```json
{
  "category": "functional",
  "description": "New chat button creates a fresh conversation",
  "steps": ["Navigate to interface", "Click New Chat", "Verify creation"],
  "passes": false
}
```

**Coding Agent** (subsequent context windows) follows a recovery protocol:
1. `pwd` → locate working directory
2. Read git logs and progress files to understand current state
3. Read feature list, pick highest-priority incomplete feature
4. Work incrementally on ONE feature
5. Test with browser automation/E2E tools
6. Commit with descriptive message + update progress file

**Multi-agent manifest pattern:**
```json
{
  "task_id": "api-endpoint",
  "agent_role": "backend-developer",
  "model": "claude-sonnet-4-6",
  "context_files": ["src/routes/", "src/models/"],
  "constraints": ["modify only specified directories"],
  "output_artifacts": ["src/routes/feature.ts", "tests/feature.test.ts"],
  "status": "pending",
  "token_budget": 50000
}
```

Claude Code's Teams system stores task state in `~/.claude/tasks/{team}/*.json` and team configuration in `~/.claude/teams/{team}/config.json`. Crashed teammates have a **5-minute heartbeat timeout** and are auto-marked inactive; recovery is manual — the human re-engages them, and they read progress files to resume.

**Key principle:** Git serves as the state backbone. Descriptive commits, progress files, and feature lists together provide enough context for any new agent session to pick up exactly where work stopped.

---

### Gap 27: Field-level confidence scoring

The most effective prompting pattern for per-field confidence asks for value, score, and reasoning together:

```
For each extracted field, provide:
1. The extracted value
2. A confidence score from 0.0 to 1.0
3. Brief reasoning for the confidence level

Output as JSON:
{
  "fields": {
    "company_name": {"value": "Acme Corp", "confidence": 0.95,
                     "reasoning": "Clearly stated in header"},
    "revenue":      {"value": "$4.2M", "confidence": 0.72,
                     "reasoning": "Found in footnote, ambiguous fiscal year"},
    "employee_count": {"value": null, "confidence": 0.0,
                       "reasoning": "Not found in document"}
  }
}
```

**Calibration with labeled validation sets:** Collect extraction results with confidence scores → stratify by confidence bands (0–0.3, 0.3–0.6, 0.6–0.8, 0.8–1.0) → sample proportionally from each band → human-label samples for ground truth → compare predicted confidence vs actual accuracy per band → adjust thresholds: auto-accept high-confidence, human-review low-confidence.

Research shows verbalized confidence (asking the model to state a number) often outperforms raw token probabilities for calibration. However, production systems should consider **ensemble methods** (multiple runs, vote on answers), **temperature scaling**, or **verifier models** for higher reliability. The AUROC for naive "just ask for a number" approaches can be as low as **0.58** with high variance — explicit reasoning steps improve calibration significantly.

---

### Gap 28: Information provenance patterns

**Claim-source mapping structure:**
```json
{
  "claim": "Global EV sales grew 35% in 2024",
  "sources": [
    {
      "source_id": "doc_1",
      "source_name": "IEA Global EV Report 2025",
      "relevant_quote": "Electric car sales grew by 35% year-on-year...",
      "confidence": 0.95,
      "date": "2025-03-15"
    },
    {
      "source_id": "doc_3",
      "source_name": "Bloomberg NEF",
      "relevant_quote": "EV sales increased approximately 33-37%...",
      "confidence": 0.82,
      "date": "2025-01-20"
    }
  ],
  "conflict_resolution": "Minor discrepancy; IEA figure used as primary (more recent, official source)"
}
```

**Handling conflicting statistics:** Include temporal context (date of measurement), methodological differences (e.g., "29% including hydro" vs "18% excluding hydro"), and resolution reasoning. Always surface the conflict rather than silently picking one number.

**Anthropic's Citations API** provides built-in provenance when `citations.enabled=true` on document sources. Response interleaves `cited_text` blocks (which do **not count** toward output tokens) with text. Citations are *"guaranteed to contain valid pointers to the provided documents"* and are *"significantly more likely to cite the most relevant quotes compared to purely prompt-based approaches."*

**Rendering by content type:** Use **tables** for comparative data with source attribution columns. Use **prose** for narrative synthesis with inline citations. Use **lists** for discrete claims each with explicit source references. For multi-source RAG, wrap documents in `<documents><document index="1"><source>URL</source><document_content>...</document_content></document></documents>` XML structure and instruct Claude to *"quote relevant parts of the documents first before carrying out its task."*

---

## Quick reference: permission mode cheat sheet

| Mode | Behavior | Activation |
|------|----------|------------|
| `default` | Asks before modifying | Default behavior |
| `acceptEdits` | Auto-accepts file edits; Bash still prompts | `Shift+Tab` once, or `--permission-mode acceptEdits` |
| `plan` | Read-only analysis, no execution | `Shift+Tab` twice, `/plan`, or `--permission-mode plan` |
| `bypassPermissions` | Approves everything (except `disallowedTools`) | `--permission-mode bypassPermissions` ⚠️ |
| `dontAsk` | Denies anything not pre-approved (TS SDK only) | `permissionMode: "dontAsk"` |

## Quick reference: SDK parameter name mapping

| Concept | Python (`snake_case`) | TypeScript (`camelCase`) | CLI flag |
|---------|----------------------|-------------------------|----------|
| Turn limit | `max_turns` | `maxTurns` | `--max-turns` |
| Budget limit | `max_budget_usd` | `maxBudgetUsd` | `--max-budget-usd` |
| Tool allowlist | `allowed_tools` | `allowedTools` | `--allowedTools` |
| Tool blocklist | `disallowed_tools` | `disallowedTools` | `--disallowedTools` |
| Resume session | `resume` | `resume` | `--resume` / `-r` |
| Fork session | `fork_session` | `forkSession` | `--fork-session` |
| Permission mode | `permission_mode` | `permissionMode` | `--permission-mode` |

---

## Conclusion: the five highest-yield study areas

The exam weights **agentic architecture at 27%**, making the Agent SDK's `query()` loop, permission pipeline (`disallowedTools` → `allowedTools` → hooks → `canUseTool` → `permissionMode`), and session management the single most important study area. The **tool_use five-step flow** and **structured outputs** (GA with `output_config.format` and `strict: true`) together dominate Domain 4's 20% weight — memorize the exact JSON structures and the three complexity limits (20 strict tools, 24 optional params, 16 union-typed params). For Domain 3's configuration questions, the SKILL.md frontmatter fields and their interaction with `context: fork`/`inherit` and the invocation control matrix are the most likely testable specifics. In Domain 2, the MCP error duality (protocol-level in `error` field vs tool-level with `isError: true`) is a classic exam distinction. Finally, Domain 5's crash recovery pattern — progress files, feature lists, git checkpoints, and the initializer/coder agent split — represents Anthropic's official recommended architecture for production agents.

---

## Appendix: Claude Code v2.1.x Quick Revision Summary (May 2026)

This appendix captures the most significant v2.1.x changes relevant to the CCA-F exam and daily Claude Code usage.

### Key v2.1.x Features by Category

| Version | Feature | CCA Domain | Impact |
|---------|---------|-----------|--------|
| v2.1.32 | Agent Teams (experimental) | D1 | Persistent peer-to-peer agents via filesystem mailbox |
| v2.1.50 | isolation: worktree for subagents | D1 | Parallel file modifications in separate git worktrees |
| v2.1.63 | HTTP hook handler type | D1 | Webhooks can now be hook targets |
| v2.1.74 | Adaptive thinking (effort-aware) | D4 | Effort level auto-adjusts thinking depth |
| v2.1.76 | MCP Elicitation | D2 | Structured interactive input dialogs in MCP tools |
| v2.1.84 | Rules path-scoping (paths: frontmatter) | D3 | Rules load conditionally by file glob |
| v2.1.84 | Tool description 2KB cap | D2 | Tool descriptions truncated at 2KB |
| v2.1.85 | MCP OAuth (RFC 9728) | D2 | OAuth discovery for MCP servers |
| v2.1.89 | Auto-compaction circuit breaker | D5 | Prevents thrash loop during compaction |
| v2.1.91 | Large MCP tool results (500K chars) | D2 | Via _meta["anthropic/maxResultSizeChars"] |
| v2.1.92 | --bare mode for CI | D3 | Skips hooks, LSP, plugins, MCP for 14% faster start |
| v2.1.94 | Bedrock Mantle support | D3 | Bedrock via Mantle backend |
| v2.1.98 | Monitor tool (background process streaming) | D1 | Stream output from background processes |
| v2.1.98 | /setup-vertex wizard | D3 | Guided Vertex AI configuration |
| v2.1.101 | SDK cleanup fix (await using) | D1 | Proper subprocess cleanup on early exit |
| v2.1.104 | /team-onboarding command | D1 | Generate team ramp-up guide |
| v2.1.105 | /doctor with auto-fix | D3 | Health check with f-key auto-repair |
| v2.1.108 | Cache TTL fix (DISABLE_TELEMETRY) | D5 | 1-hour cache TTL now works for telemetry-off users |
| v2.1.113 | Native binary via optional deps | D3 | Removes Node.js requirement |
| v2.1.116 | /terminal-setup command | D3 | Configure scroll, clipboard, iTerm2 |
| v2.1.117 | Opus 4.7 default effort=xhigh | D4 | Default effort level changed |
| v2.1.117 | Opus 4.7 1M context fix | D5 | Was computing against 200K instead of 1M |
| v2.1.118 | DISABLE_UPDATES env var | D3 | Blocks all update paths |
| v2.1.118 | /cost and /stats shortcuts | D3 | Shortcuts for /usage |
| v2.1.118 | mcp_tool hook handler | D2 | Hooks can target specific MCP tools |
| v2.1.119 | /config UI persistence | D3 | Config saved to settings.json |
| v2.1.120 | ${CLAUDE_EFFORT} in skills | D3 | Skills can reference effort level |
| v2.1.121 | Vertex Workload Identity Federation | D3 | WIF support for GCP |
| v2.1.121 | SDK OAuth (mcp_authenticate) | D1 | Custom-scheme OAuth in Agent SDK |
| v2.1.122 | Bedrock service tiers | D3 | default/flex/priority tiers |
| v2.1.126 | Latest stable release (May 1, 2026) | All | See CHANGELOG for specifics |

### Five Most-Tested Concepts in Recent CCA Exams (Community Reports)

1. **stop_reason routing** — Always route on `stop_reason`, never parse text. Values: `end_turn`, `tool_use`, `max_tokens`, `stop_sequence`, `refusal`, `pause_turn`, `model_context_window_exceeded`
2. **Structured output guarantees syntax, not semantics** — JSON schema constrains format but the model can still produce semantically wrong data
3. **Subagent context isolation** — Subagents start with a fresh context; they do NOT inherit the parent's conversation history
4. **Hooks are deterministic, prompts are probabilistic** — Use hooks when you need guaranteed enforcement
5. **Access failure vs. valid empty result** — An empty array `[]` is a valid result; an exception/error requires different handling

### Common CCA Exam Traps

| Trap | Wrong Answer | Correct Answer |
|------|-------------|----------------|
| ToolSearch placement | "ToolSearch results go in the system prompt" | Discovered tool schemas go in conversation history, NOT the prefix |
| Cache TTL for subscribers | "5 minutes for all users" | 1 hour for Pro/Max subscribers (fixed v2.1.108) |
| Default effort for Opus 4.7 | "medium" | xhigh (changed v2.1.117) |
| SubAgent vs Agent Teams | "Both share context" | SubAgents get fresh context; Agent Teams use lateral messaging |
| Path-scoped rules | "Rules always load at session start" | Rules with paths: frontmatter load only when matching files are touched |
| Output style activation | "/output-style command" | Activated via /config (NOT a slash command) |