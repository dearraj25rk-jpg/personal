---
title: "Master Study Guide"
description: "Quick-reference master guide: 25 rules covering 80%+ of the exam, distractor patterns, exam strategy, and technology reference."
sidebar:
  order: 6
---

# Claude Certified Architect – Foundations: Master Study Guide

## Exam Quick Facts

```
Format:        60 multiple-choice questions
               4 random scenarios from a pool of 6
Passing Score: 720 / 1000
Questions:     One correct answer + three plausible distractors
Penalty:       None for guessing — NEVER leave blank
Pacing:        ~1–1.5 minutes per question
```

## Domain Weights

| Domain | Weight | Approx. Questions | Priority |
|---|---|---|---|
| D1: Agentic Architecture & Orchestration | **27%** | ~16 | **HIGHEST** |
| D3: Claude Code Configuration & Workflows | 20% | ~12 | High |
| D4: Prompt Engineering & Structured Output | 20% | ~12 | High |
| D2: Tool Design & MCP Integration | 18% | ~11 | Medium |
| D5: Context Management & Reliability | 15% | ~9 | Medium |

---

## THE 25 RULES THAT COVER 80%+ OF THE EXAM

### DOMAIN 1: AGENTIC ARCHITECTURE

**Rule 1: stop_reason Controls the Loop**  
The agentic loop continues when `stop_reason == "tool_use"` and terminates when `stop_reason == "end_turn"`. Never parse natural language output. Never use iteration caps as the primary stopping mechanism.

**Rule 2: Tool Results Are USER Messages**  
After executing tools, append Claude's response as an `assistant` message. Then append tool results as a `user` message containing `tool_result` blocks. Each `tool_result` must reference its `tool_use_id`.

**Rule 3: Hooks = Deterministic, Prompts = Probabilistic**  
When financial compliance, security, or identity verification is required, always choose programmatic hooks over prompt instructions. PreToolUse blocks bad calls. PostToolUse normalizes results. Hooks run in the application process — zero context window tokens consumed.

**Rule 4: Subagents Don't Inherit Context**  
Each subagent starts with a fresh conversation. It does NOT inherit the coordinator's conversation history, intermediate tool results, or other subagents' findings. You MUST explicitly pass everything the subagent needs in its prompt.

**Rule 5: allowedTools Must Include "Agent"**  
For a coordinator to spawn subagents, `allowedTools` (or `allowed_tools`) must include `"Agent"`. Never include `"Agent"` in a subagent's own tool list — prevents infinite nesting.

**Rule 6: Task Decomposition Gaps = Coverage Gaps**  
When a multi-agent report is missing topics, check the coordinator's task decomposition FIRST. If the coordinator didn't assign a topic to any subagent, no subagent will cover it. Don't blame the subagents.

**Rule 7: The "Agent" Tool Was Renamed From "Task"**  
In v2.1.63, `Task` was renamed to `Agent`. Both work as aliases. Existing `Task(...)` references continue to function.

**Rule 8: Permission Flow Order**  
PreToolUse Hook → Deny Rules → Allow Rules → Ask Rules → Permission Mode Check → canUseTool Callback → PostToolUse Hook

**Rule 9: Fork Session Creates Independent Branches**  
`forkSession: true` when resuming creates a new session branch. The original session is UNCHANGED and can still be resumed independently. Use for trying alternative approaches in parallel.

**Rule 10: /compact After /compact = Rules May Be Lost**  
After compaction, specific instructions from the initial prompt may not be preserved. Put persistent project rules in CLAUDE.md (version-controlled), not in the initial conversation prompt.

---

### DOMAIN 2: TOOL DESIGN & MCP

**Rule 11: Tool Descriptions Are the #1 Selection Mechanism**  
The FIRST fix for tool misrouting is always expanding tool descriptions — not few-shot examples, not routing layers, not consolidating tools. Descriptions should be 3–4+ sentences covering purpose, input format, output format, when to use, and when NOT to use.

**Rule 12: isError Distinguishes Failures From Empty Results**  
`isError: true` = tool execution FAILED (timeout, permission error). `isError: false` with empty content = search SUCCEEDED with zero results. These are completely different situations. Never suppress failures by returning empty success.

**Rule 13: Protocol Errors vs. Tool Execution Errors**  
Protocol-level errors (JSON-RPC) are captured by the MCP client and discarded — Claude never sees them. Tool execution errors with `isError: true` are injected into Claude's context window — Claude can use them for recovery.

**Rule 14: 4–5 Tools Per Agent, Not 18**  
Too many tools degrades selection accuracy and increases token overhead. Distribute tools across specialized agents. Use Tool Search when tool definitions exceed ~10K tokens (49% → 74% accuracy improvement; 85% token reduction).

**Rule 15: tool_choice Values**  
`"auto"` = Claude decides freely (may skip tools). `"any"` = must call a tool (Claude picks which — use for unknown document types needing guaranteed structured output). `{"type": "tool", "name": "X"}` = must call specific tool X (use for required pipeline steps).

**Rule 16: MCP Project vs. User Scope**  
`.mcp.json` in repository root = project-scoped, shared via git, available to entire team. `~/.claude.json` = user-scoped, personal, not committed. `${VAR}` expands env vars (fails if unset). `${VAR:-default}` uses fallback.

---

### DOMAIN 3: CLAUDE CODE

**Rule 17: CLAUDE.md Hierarchy: User < Project < Directory**  
`~/.claude/CLAUDE.md` (user) is NOT shared via version control — new team members won't have it. `.claude/CLAUDE.md` (project) is version-controlled and shared. Subdirectory `CLAUDE.md` has highest precedence. The #1 new-member misconfiguration is standards in user-level config.

**Rule 18: Path-Specific Rules for Cross-Codebase Conventions**  
`.claude/rules/testing.md` with `paths: ["**/*.test.*"]` applies to ALL test files regardless of directory — far better than directory CLAUDE.md for files scattered across the codebase.

**Rule 19: -p Flag for CI/CD**  
`claude -p "prompt"` runs non-interactively. `CLAUDE_HEADLESS=true` does NOT exist. `--batch` does NOT exist. `--output-format json` + `--json-schema` for structured CI output.

**Rule 20: context: fork for Skills**  
Skills with `context: fork` run in isolated subagent context — their verbose output doesn't pollute the main conversation. Only the summary returns to main session.

**Rule 21: Plan Mode vs. Direct Execution**  
Plan mode: complex tasks, multi-file changes, architectural decisions, multiple valid approaches. Direct execution: single-file changes, clear scope, well-understood modifications.

---

### DOMAIN 4: PROMPT ENGINEERING

**Rule 22: tool_use Eliminates Syntax Errors, Not Semantic Errors**  
JSON schemas enforce structure and types. They cannot catch logical errors (line items that don't sum to stated total). To catch semantic errors: extract both stated and calculated values, flag discrepancies.

**Rule 23: Nullable Fields Prevent Fabrication**  
Make schema fields nullable (`"type": ["string", "null"]`) when source documents may not contain the information. Without nullable, Claude fabricates plausible-sounding values for missing fields.

**Rule 24: Batch API Facts**  
50% cost savings. Up to 24-hour processing window. No latency SLA. Multi-turn tool calling NOT supported within a single batch request. `custom_id` field correlates requests to results. Use for overnight/weekly processing. NOT for blocking pre-merge checks.

**Rule 25: Independent Review Instance > Same-Session Self-Review**  
The session that generated code retains reasoning context — confirmation bias makes self-review less effective. A fresh, independent instance finds more issues. This also applies to CI: use separate sessions for generation and review.

---

### NEW: 2026 FEATURE RULES (v2.1.x — Exam Ready)

**Rule 26: Effort Levels Include xhigh and max**  
Valid effort values: `low`, `medium`, `high`, `xhigh`, `max`; available levels depend on the model. The `auto` keyword in some CLI contexts selects based on context. The default effort level is **high** for API, Bedrock, Vertex, Team, and Enterprise tiers (v2.1.94) — NOT medium.

**Rule 27: HTTP Hooks POST JSON to a URL (v2.1.63)**  
Hook type `"http"` sends the same JSON payload as a `command` hook (via stdin) as an HTTP POST to a configured URL. Useful for enterprise webhook integrations, Slack notifications, audit systems. Returning `{ "permissionDecision": "deny" }` from an HTTP PreToolUse hook blocks the tool call identically to a `command` hook returning exit code 2.

**Rule 28: PermissionDenied Hook Fires on Explicit Denials (v2.1.89)**  
The `PermissionDenied` hook fires whenever Claude Code explicitly denies a tool invocation (due to deny rules or permission mode). It does NOT fire on ask prompts or allow-then-proceed. Use it for auditing denial events or alerting.

**Rule 29: `--bare` Flag for Reproducible CI (v2.1.81)**  
`claude -p "..." --bare` skips auto-discovery of all CLAUDE.md files and user memory. Combined with explicit `--system-prompt` or `--append-system-prompt`, this makes CI runs fully reproducible. Without `--bare`, different users' CLAUDE.md files would produce different CI results.

**Rule 30: ExitWorktree vs. CronCreate Tool Semantics**  
`ExitWorktree` — called by a teammate agent when finished; signals completion back to the lead and releases the worktree branch lock.  
`CronCreate` — schedules a prompt to run on a recurring cron schedule within the current session (e.g., `"*/5 * * * *"` every 5 minutes). Both are non-interactive tools; neither takes user input.

---

## DISTRACTOR PATTERNS

When you see these in answer choices, they are very likely **wrong**:

| Distractor Pattern | Why It's Wrong |
|---|---|
| "Add mandatory instruction to system prompt" | Probabilistic, not deterministic — fails some % of the time |
| "Deploy a routing classifier / ML model" | Over-engineered when tool descriptions haven't been fixed first |
| "Sentiment-based escalation" | Frustration ≠ complexity. Unreliable escalation signal. |
| "Agent self-reported confidence threshold" | LLM confidence is poorly calibrated. Unreliable routing signal. |
| "Consolidate all tools into one" | Hides the root cause (poor descriptions). Not the first step. |
| "Increase context window size" | Doesn't fix attention quality or summarization loss |
| "Run 3 passes and require consensus" | Suppresses intermittent but real findings |
| "Build routing layer that parses user input" | Bypasses Claude's natural language understanding |
| `CLAUDE_HEADLESS=true` | Does not exist. Use `-p` flag. |
| `--batch` flag | Does not exist. Use `-p` flag. |
| `--headless` flag | Does not exist. Use `-p` flag. |
| `--max` effort level | Removed in v2.1.72. Valid levels: `low`, `medium`, `high`. |
| "Check if response contains 'I'm done'" | Never parse text for loop termination — use `stop_reason` |
| "Use max_iterations as primary stop" | Safety limit, not primary mechanism — use `stop_reason` |
| "Subagent inherits coordinator context" | Subagents start FRESH — no inherited history |
| "Add few-shot examples" as FIRST tool fix | Wrong order — expand descriptions FIRST |
| "Same session self-review" for independent check | Biased — use independent fresh session |
| "Batch API for pre-merge checks" | Batch has no latency SLA — blocks developers |

---

## FIVE CROSS-CUTTING PATTERNS

Every hard exam question is one of these five tradeoffs:

```
PATTERN 1: DETERMINISTIC vs PROBABILISTIC
  Hooks (always) vs. Prompts (usually)
  Applied in: D1 (tool ordering), D4 (review criteria)

PATTERN 2: ISOLATION
  Subagent context isolation (D1)
  context: fork for skills (D3)
  Independent review instances (D4)
  Session isolation in CI (D3)

PATTERN 3: STRUCTURED METADATA
  Claim-source mappings (D5)
  Structured errors with errorCategory (D2)
  detected_pattern fields for feedback loops (D4)
  custom_id for batch correlation (D4)

PATTERN 4: PROPORTIONATE RESPONSE (simplest fix first)
  Fix descriptions before building routing layers (D2)
  Add explicit criteria before deploying classifiers (D5)
  Test on samples before batch processing 10K docs (D4)

PATTERN 5: ANTI-PATTERNS AS WRONG ANSWERS
  Same-session self-review | Sentiment escalation
  "Be conservative" | Arbitrary iteration caps
  Suppressing errors as success | Parsing natural language
```

---

## EXAM STRATEGY

### Reading Questions
Read the scenario description carefully before answering any questions — scenario details eliminate wrong answers.

### "Most Effective First Step" Questions
These always point to the **lowest-effort, highest-leverage fix** — not the most comprehensive solution. The exam rewards knowing the right order of interventions.

### Elimination Strategy
1. Eliminate over-engineered options (ML classifiers when descriptions aren't fixed yet)
2. Eliminate prompt-only fixes for compliance/financial scenarios (hooks required)
3. Eliminate options that blame downstream agents when coordinator is the issue
4. Eliminate non-existent flags/env vars (`CLAUDE_HEADLESS`, `--batch`, `--headless`)
5. Pick the remaining option addressing the root cause

### Time Management
~60 questions in the exam period. If stuck: eliminate what you can → pick best remaining → move on. No penalty for guessing.

---

## KEY TECHNOLOGIES QUICK REFERENCE

| Technology | Critical Commands / Concepts |
|---|---|
| **Agent SDK loop** | `stop_reason`: `end_turn`, `tool_use`, `pause_turn`, `refusal`, `max_tokens` |
| **Agent SDK options** | `allowedTools`, `permissionMode`, `maxTurns`, `maxBudgetUsd` |
| **AgentDefinition** | `description`, `prompt`, `tools`, `model`, `disallowedTools`, `maxTurns` |
| **Hooks** | `PreToolUse` (block/modify), `PostToolUse` (normalize), `PreCompact`, `PermissionDenied` (v2.1.89), `StopFailure` |
| **Hook types** | `command`, `http` (POST JSON to URL, v2.1.63), `prompt`, `agent` |
| **Hook returns** | `permissionDecision`: `allow`\|`deny`\|`ask`, `updatedInput`, `additionalContext` |
| **MCP errors** | `isError: true/false`, `errorCategory`, `isRetryable` |
| **MCP config** | `.mcp.json` (project), `~/.claude.json` (user), `${VAR}`, `${VAR:-default}` |
| **MCP elicitation** | Servers can request structured user input mid-task (v2.1.76); fires `Elicitation` + `ElicitationResult` hooks |
| **Claude Code config** | `CLAUDE.md`, `.claude/rules/` (paths), `.claude/skills/SKILL.md` |
| **Skills frontmatter** | `name`, `description`, `context: fork`, `allowed-tools`, `argument-hint`, `agent` |
| **Plugins (v2.0.12+)** | `claude plugin install/list/enable/disable/validate/update`; `/reload-plugins` for hot-reload |
| **Enterprise settings** | `managed-settings.d/` drop-in directory (v2.1.83); macOS plist / Windows Registry (v2.1.51) |
| **CLI flags** | `-p`, `--output-format json`, `--json-schema`, `--resume`, `--continue`, `--bare` (v2.1.81), `-w/--worktree` (v2.1.49) |
| **Effort levels** | `low` / `medium` / `high` only — `max` was removed in v2.1.72; default is HIGH for API/Bedrock/Vertex/Team/Enterprise (v2.1.94) |
| **Session management** | `resume: sessionId`, `forkSession: true`, `/compact`, `/memory`, `/branch` (renamed from `/fork`, v2.1.80) |
| **New tools (2026)** | `PowerShell` (Windows, v2.1.84), `Monitor` (v2.1.98), `ExitWorktree` (v2.1.72), `CronCreate` (v2.1.71), `SendMessage` (agent P2P) |
| **API: structured output** | `tool_use` blocks, `tool_choice`: `auto`\|`any`\|`{type,name}` |
| **API: stop_reasons** | `end_turn`, `tool_use`, `max_tokens`, `refusal`, `pause_turn`, `stop_sequence` |
| **Batch API** | 50% cost, 24hr max, `custom_id`, no multi-turn tools, 100K max requests |
| **Built-in tools** | Grep (content search), Glob (file patterns), Read, Write, Edit, Bash, PowerShell (Windows) |
| **Edit fallback** | If text not unique → Read + Write instead |
| **Context tools** | `/compact` (reduce), `/memory` (verify loaded config) |
| **CI/CD** | `claude -p`, `--output-format json`, `--bare` (skip CLAUDE.md auto-discovery for reproducibility), independent sessions, prior findings |
| **Context window** | Opus 4.6: 1M tokens (Max/Team/Enterprise); Sonnet 4.6: 1M native; Haiku 4.5: 200K |

---

## Quick Reference: Anti-Patterns to Eliminate Immediately

Every distractor answer in the exam uses one of these anti-patterns. Recognize them instantly:

```
ANTI-PATTERN                    WHY IT'S WRONG                CORRECT APPROACH
───────────────────────────────────────────────────────────────────────────────────
"Add a mandatory instruction     Prompts = probabilistic.      Use a hook for
 to the system prompt"           Can fail. Not deterministic.  guaranteed compliance.

"Use sentiment analysis to        Brittle. Off-topic context    Use explicit structured
 detect when to escalate"         triggers wrong escalation.    criteria (keywords, fields).

"Same session self-review"        Reviewer shares the author's  Fresh session / independent
                                  biases and blind spots.       instance for review.

"Set CLAUDE_HEADLESS=true"        This flag does not exist.     Use -p flag for
                                  Made-up distractor.           non-interactive CI mode.

"Check if response text says      Text parsing is unreliable.   Check stop_reason field
 'task complete'"                 LLM may phrase differently.   == "end_turn".

"Increase the context window"     Doesn't fix root cause.       Extract facts to persistent
                                  Just defers the problem.      block before summarization.

"Add few-shot examples first"     Tool descriptions come first. Fix tool description.
 (when tool selection fails)      If desc is wrong, examples   Then add examples if needed.
                                  can't fully compensate.

"Cap iterations at N"             Arbitrary cap causes          Use completion signals:
                                  incomplete tasks.             success/failure state.

"Suppress retrieval errors        Silences real failures.       Return isError:true with
 as empty results"                Downstream gets wrong data.   errorCategory for recovery.

"Use tool_choice: auto when       Auto may choose not to        tool_choice: "any" forces
 structured output required"      use a tool at all.            tool use, guarantees schema.
```

**Memory trick:** If the answer involves prompts for compliance, text parsing for routing, or same-session for review — it's wrong. Choose hooks, structured fields, and fresh sessions instead.
