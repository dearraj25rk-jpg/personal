---
title: Elite Claude Code Mastery — Training Program
description: >
  8-module curriculum for elite Claude Code mastery — CLI mastery, agent teams,
  hooks system, MCP servers, prompt engineering, RAG + enterprise integration,
  CI/CD automation, and advanced architecture patterns. Targets .NET/Azure developers.
  Covers Claude Code v2.1.126 (May 2026).
sidebar:
  order: 11
lastUpdated: 2026-05-09
---

# Elite Claude Code mastery: a complete AI Engineer training program

**This training program transforms an experienced .NET/Azure tech lead into an elite-level AI engineer** capable of orchestrating multi-agent systems, engineering production-grade RAG architectures, and leveraging Claude Code at its absolute ceiling. The curriculum spans 8 modules progressing from advanced CLI mastery through enterprise architecture patterns, with every technique grounded in the latest 2025-2026 documentation and real-world production implementations.

The program assumes foundational Claude Code familiarity and jumps directly into power-user territory. Each module builds on the previous one, culminating in a capstone that integrates agent teams, MCP servers, hooks, and CI/CD automation into a cohesive enterprise workflow. All code examples and configurations prioritize the .NET/Azure ecosystem.

---

## Module 1: Claude Code CLI — the complete operator's reference

### Learning Objectives

By the end of this module you will be able to:
- Navigate Claude Code's full keyboard shortcut map without looking them up
- Invoke any slash command with the correct parameters
- Choose the right built-in tool for every task type
- Structure a production-ready CLAUDE.md under 200 lines
- Deploy and manage plugins for team-wide configuration distribution
- Monitor context utilisation and manage sessions across interruptions

### Module 1 — Visual Orientation

```
┌─────────────────────────────────────────────────────────────────────┐
│                 CLAUDE CODE CLI — CONTROL SURFACE                   │
├─────────────────────────┬───────────────────────────────────────────┤
│  KEYBOARD SHORTCUTS     │  SLASH COMMANDS                           │
│  (muscle-memory layer)  │  (conversation layer)                     │
│                         │                                           │
│  Shift+Tab  mode cycle  │  /compact   /clear    /model              │
│  Ctrl+B     background  │  /config    /hooks    /mcp                │
│  Ctrl+R     history     │  /agents    /skills   /memory             │
│  Esc×2      rewind      │  /rewind    /branch   /todos              │
│  !          bash mode   │  /resume    /rename   /usage              │
│  @          file hint   │  (60+ commands total)                     │
├─────────────────────────┴───────────────────────────────────────────┤
│  BUILT-IN TOOLS (always prefer over shell equivalents)             │
│  Read  Edit  MultiEdit  Write  Glob  Grep  WebFetch                │
│  TodoWrite  Task  Bash  PowerShell  Monitor  SendMessage            │
├─────────────────────────────────────────────────────────────────────┤
│  CONFIGURATION LAYERS (highest → lowest precedence)                │
│  Enterprise MDM → CLI flags → settings.local.json → settings.json  │
│  → user settings.json → CLAUDE.md hierarchy → Rules → Skills        │
└─────────────────────────────────────────────────────────────────────┘
```

Mastering Claude Code begins with internalizing every keyboard shortcut, slash command, and tool at your disposal. The difference between a competent user and an elite operator is **muscle-memory fluency** with the full control surface.

### Keyboard shortcuts that define your workflow speed

The three shortcuts that matter most are mode cycling, backgrounding, and history search. **Shift+Tab** (or Alt+M) cycles through Normal → Auto-Accept → Plan Mode, letting you fluidly switch between careful supervision, fast editing, and read-only analysis without leaving the terminal. **Ctrl+B** backgrounds a running Bash command — essential when a build takes minutes and you need Claude to continue reasoning. **Ctrl+R** opens reverse history search for recalling previous prompts.

Beyond these, the complete shortcut map includes: **Tab** toggles extended thinking on/off, **Esc×2** (double-tap Escape) opens the rewind menu, **!** at line start enters bash mode, **@** triggers file path autocomplete, and **Ctrl+S** screenshots stats to clipboard. For multiline input, use **Option+Enter** (macOS), **Shift+Enter** (after `/terminal-setup`), or **backslash+Enter** universally. In agent teams mode, **Shift+Up/Down** cycles through teammates.

Claude Code now supports full keybinding customization via `~/.claude/keybindings.json` — run `/keybindings` to create the file. Bindings support key chords (e.g., `ctrl+k ctrl+s`), context-specific mappings, and uppercase letters implying Shift.

**Complete Keyboard Shortcut Reference:**

| Shortcut | Action | When to use |
|----------|--------|-------------|
| `Shift+Tab` | Cycle Normal → Auto-Accept → Plan Mode | Switch supervision level |
| `Ctrl+B` | Background running Bash command | Long builds, slow tests |
| `Ctrl+R` | Reverse history search | Recall previous prompts |
| `Tab` | Toggle extended thinking | Harder problems |
| `Esc×2` | Open rewind menu | Undo last code change |
| `!` (line start) | Enter bash mode | Direct shell commands |
| `@` | File path autocomplete | Reference files by name |
| `Ctrl+S` | Screenshot stats to clipboard | Share session metrics |
| `Option+Enter` (macOS) | Multiline input | Multi-paragraph prompts |
| `Shift+Enter` (after `/terminal-setup`) | Multiline input | Alternative multiline |
| `Backslash+Enter` | Multiline input | Universal fallback |
| `Shift+Up/Down` | Cycle agent teammates | Agent Teams mode |
| Custom via `keybindings.json` | Any action | Team-standardized bindings |

### Slash commands: the complete 2026 inventory

The command surface has grown significantly. Beyond the essentials (`/compact`, `/clear`, `/model`, `/cost`), the latest additions include:

**Context management**: `/compact [instructions]` summarizes conversation with optional focus directives — `/compact focus on the authentication logic` preserves only what matters. `/context` displays a colored token-usage grid. `/rewind` rolls back code and conversation to any checkpoint. `/clear` resets everything.

**Configuration**: `/config` opens an interactive settings interface. `/permissions` manages tool allowlists interactively. `/hooks` configures the hooks system. `/mcp` manages MCP server connections and OAuth. `/agents` views and creates custom subagents.

**Session management**: `/resume` opens an interactive session picker with metadata. `/rename` names sessions for retrieval. `/teleport` pulls a remote session (from claude.ai/code) into your terminal. `/desktop` hands off to the Desktop app.

**New in 2025-2026**: `/output-style` configures response formatting (Default, Explanatory, or Learning modes). `/keybindings` opens keybinding configuration. `/bashes` shows running background processes. `/todos` displays current task items. `/changelog` shows release notes. `/stats` shows usage streaks. `/debug` helps troubleshoot sessions. `/branch` creates a worktree branch (renamed from `/fork` in v2.1.49). `/insights` shows session analytics. `/color` customizes terminal color scheme. `/powerup` activates Max-tier upgrades. `/team-onboarding` generates an onboarding doc from CLAUDE.md. `/ultraplan` triggers maximum-depth planning mode. `/reload-plugins` hot-reloads installed plugins without restarting.

**Custom commands** live in `.claude/commands/` (project) or `~/.claude/commands/` (personal). The newer **Skills system** (`.claude/skills/` with `SKILL.md` files) supersedes commands with auto-invocation capabilities, supporting files, and YAML frontmatter for `context: fork`, `agent: Explore`, and `disable-model-invocation`.

### Tool orchestration: built-in tools and when to use each

Claude Code exposes **20+ built-in tools**. The critical rule: **always prefer native tools over shell equivalents**. Use `Read` instead of `cat`, `Edit` instead of `sed`, `Write` instead of `echo >`, `Glob` instead of `find`, `Grep` instead of `grep`.

| Tool | Purpose | Power-user tip |
|------|---------|---------------|
| **Read** | Files, images, PDFs, notebooks | Use `offset` and `limit` for partial reads to conserve context |
| **Edit** | Exact string replacement | `replace_all: true` for global substitutions |
| **MultiEdit** | Batch edits in one file | Reduces round-trips vs. sequential Edit calls |
| **Glob** | File pattern matching | `**/*.cs` patterns for codebase-wide discovery |
| **Grep** | Content search via ripgrep | `output_mode: "files_with_matches"` for fast scanning |
| **WebFetch** | URL content with AI extraction | Include a `prompt` parameter to focus extraction |
| **TodoWrite** | Structured task tracking | Use for 3+ step tasks; tracks `pending/in_progress/completed` |
| **Task** | Spawn sub-agents | `subagent_type: "Explore"` for read-only research |
| **PowerShell** | Windows shell (v2.1.84) | Native PowerShell 5.1/7+ execution on Windows; use instead of Bash on Windows hosts |
| **ExitWorktree** | Leave worktree context (v2.1.72) | Returns agent to main worktree after isolated branch work; used by Agent Teams |
| **CronCreate** | Schedule recurring tasks (v2.1.71) | Registers cron-style jobs; pairs with `CLAUDE_CODE_DISABLE_CRON=1` to suppress |
| **SendMessage** | Peer-to-peer agent messaging | Sends typed inbox messages to a named teammate; enables true Agent Teams coordination |
| **Monitor** | Watch filesystem/processes (v2.1.98) | Background observation without polling Bash; alerts Claude when conditions are met |

### CLAUDE.md configuration hierarchy

Files load in this order (highest to lowest priority): **CLI flags** → `.claude/settings.local.json` → `.claude/settings.json` → `~/.claude/settings.json` → enterprise managed settings. For CLAUDE.md specifically: project root → subdirectories → `~/.claude/CLAUDE.md` (user-level).

The **Auto Memory** feature (2025-2026) writes persistent notes to `~/.claude/projects/<project>/memory/MEMORY.md`. Use `/memory` to edit manually, or tell Claude "remember that we use vertical slice architecture" to save automatically.

**Best practice for .NET projects** — a production CLAUDE.md template:

```markdown
# Project Context
.NET 10 / C# 14 / ASP.NET Core Minimal APIs / EF Core / xUnit

## Commands
- Build: `dotnet build`
- Test: `dotnet test` — ALWAYS run before considering changes complete
- Migrations: `dotnet ef migrations add <Name> --project src/Infrastructure`

## Architecture
Clean Architecture: Api → Application → Domain → Infrastructure
CQRS with MediatR. Vertical slice per feature folder.

## Conventions
- Records for DTOs and value objects
- Nullable reference types enabled everywhere
- All endpoints accept CancellationToken
- Async/await throughout — never .Result or .Wait()
- Return ProblemDetails for errors
```

Keep CLAUDE.md **ruthlessly concise**. Research from HumanLayer shows Claude's system prompt already contains ~50 instructions, and frontier models can follow roughly 150-200. Every instruction in CLAUDE.md must justify its token cost. Never put in CLAUDE.md what a linter or `.editorconfig` can enforce deterministically.

**CLI Flags Quick Reference (headless and automation use):**

| Flag | Purpose | Example |
|------|---------|--------|
| `-p "prompt"` / `--print` | Non-interactive (headless) mode | `claude -p "review this file" --allowedTools Read` |
| `--model` | Override model | `--model claude-sonnet-4-6` |
| `--permission-mode plan` | Read-only (no edits/writes) | Used for CI code review |
| `--max-turns N` | Stop after N agentic turns | `--max-turns 10` |
| `--max-budget-usd N` | Stop when cost exceeds $N | `--max-budget-usd 0.50` |
| `--allowedTools list` | Whitelist specific tools | `--allowedTools "Read,Grep,Glob"` |
| `--output-format json` | Structured JSON output | CI pipelines, automation |
| `--json-schema path` | Enforce output JSON schema | Structured data extraction |
| `-c` / `--continue` | Resume most recent session | `claude -c` |
| `-r` / `--resume` | Interactive session picker | `claude -r` |
| `--bare` | Minimal mode for CI (v2.1.92) | Skips hooks, MCP, plugins; 14% faster |
| `--dangerously-skip-permissions` | Skip all permission prompts | Fully automated pipelines only |

### Plugin System — package and distribute configurations

Introduced in **v2.0.12+**, plugins bundle CLAUDE.md, rules, skills, MCP server configs, and hooks as a single versioned artifact. This is the preferred mechanism for sharing team-wide configurations.

```bash
claude plugin install <name-or-url>   # Install from registry or local path
claude plugin list                    # List all installed plugins
claude plugin enable <name>
claude plugin disable <name>
claude plugin validate <dir>          # Validate plugin structure before publishing
claude plugin update                  # Pull latest versions of all plugins
```

**plugin.json manifest** (`.claude-plugin/plugin.json` at plugin root — only `name` is required):
```json
{
  "name": "dotnet-azure-ops",
  "version": "2.0.0",
  "description": "Build validation and Azure deployment tools for .NET projects",
  "author": { "name": "Platform Team" },
  "userConfig": [
    { "name": "envName", "type": "string", "required": false,
      "description": "Deployment environment (staging/production)" }
  ]
}
```

Plugin directory layout (`skills/`, `agents/`, `hooks/hooks.json`, `monitors/`, `themes/`, `output-styles/`, `bin/`, `.mcp.json`, `settings.json`) is auto-discovered by naming convention — you don't list them in `plugin.json`. Use `${CLAUDE_PLUGIN_ROOT}` for paths that must survive plugin updates and `${CLAUDE_PLUGIN_DATA}` for persistent data that survives updates.

Use `/reload-plugins` inside a session to pick up changes without restarting. For enterprise rollout: drop plugin configs into `.claude/managed-settings.d/` (v2.1.83 — a drop-in directory where separate teams can deploy independent policy fragments, merged alphabetically) and deliver via MDM plist (macOS, `com.anthropic.claudecode` preference domain) or Windows Registry (`HKLM\SOFTWARE\Anthropic\ClaudeCode`, v2.1.51). The `forceRemoteSettingsRefresh` policy (v2.1.92) triggers re-download on session start.

### Module 1 — Common Mistakes

| Mistake | Why it hurts | Fix |
|---------|-------------|-----|
| Verbose CLAUDE.md (500+ lines) | Burns ~15K tokens every session; instructions at the end are ignored | Target 100-150 lines; move domain rules to `.claude/rules/` |
| Putting secrets in CLAUDE.md | CLAUDE.md is committed to git | Use `.env` or secrets manager; reference via `${VAR}` |
| Using `cat`/`grep`/`find` via Bash | Slower, wastes context, misses native tool features | Use `Read`/`Grep`/`Glob` built-in tools |
| Ignoring `/compact` until 95% | Auto-compaction is lossy and unpredictable | Run `/compact` at 70% with a focus directive |
| Running sensitive commands in Auto-Accept | No human oversight on destructive operations | Stay in Normal mode for writes; Plan Mode for analysis |
| Not using `--max-turns` in automation | Runaway sessions cost money and time | Always set `--max-turns` and `--max-budget-usd` in CI |
| Overloading a single session | Long sessions = context dilution | Use `/clear` between unrelated tasks |

### Context window mastery

**1M token context** is available at standard pricing (no surcharge since March 2026) on `claude-opus-4-7`, `claude-opus-4-6`, and `claude-sonnet-4-6` across all Pro/Max/Team/Enterprise plans. `claude-haiku-4-5` uses 200K. Disable 1M with `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` if needed. Use `/context` to see the colored usage grid and `/usage` to monitor spending (v2.1.118 — merged `/cost` + `/stats`). The formula: `Context = System + CLAUDE.md + Rules + Auto-memory + Skills + History + Tools + MCP schemas`. Reserved buffer: ~33K–45K tokens for system overhead.

**Token budgeting strategies**: Never exceed **75% utilization** — quality degrades noticeably past this point. Use `/compact focus on [topic]` proactively at 70%, not reactively at 95% when auto-compact triggers. Between distinct tasks, prefer `/clear` over `/compact`. Use `--max-turns` and `--max-budget-usd` flags in automation to prevent runaway costs.

**Session management** provides continuity: `claude -c` resumes the most recent conversation; `claude -r` opens the interactive session picker; `--fork-session` branches from a resumed session without modifying the original.

---

## Module 2: Agent teams — orchestrating collaborative AI systems

### Learning Objectives

By the end of this module you will be able to:
- Choose between SubAgents and Agent Teams based on task requirements
- Configure and enable Agent Teams with the correct settings
- Design custom agent definitions with appropriate YAML frontmatter
- Implement the filesystem mailbox communication pattern
- Optimize agent team costs with model selection strategy
- Identify and work around current Research Preview limitations

### Agent Team Topology — Visual Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AGENT TEAMS vs SUBAGENTS                       │
├─────────────────────────┬───────────────────────────────────────────┤
│    SUBAGENTS (Task)     │    AGENT TEAMS (TeammateTool)             │
│    fire-and-forget      │    persistent collaboration               │
├─────────────────────────┼───────────────────────────────────────────┤
│   Lead                  │         Lead (Opus 4.7)                   │
│    │ Task()             │          │ TeamCreate                     │
│    ▼                    │          │                                 │
│   SubAgent              │    ┌─────┼─────────────────┐             │
│   (fresh context)       │    │     │                 │             │
│    │                    │   ▼     ▼                 ▼             │
│    └── returns result   │ Mate1  Mate2  ...       MateN            │
│                         │ (Sonnet)(Haiku)         (Sonnet)          │
│   1× cost               │  SendMessage peer-to-peer               │
│   No context inherit    │  ~/.claude/teams/{name}/inboxes/         │
│   One-way output        │  shared task queue                       │
│                         │  3-7× cost; true parallel work           │
└─────────────────────────┴───────────────────────────────────────────┘

When to use which:
  SubAgent  → isolated research, code review, verification, report generation
  TeamTool  → competing hypotheses, QA swarms, cross-domain work, live coordination
```

Agent teams represent **the most significant Claude Code capability of 2026**: fully independent Claude Code instances that communicate peer-to-peer, share task lists, and collaborate on complex problems. Launched February 5, 2026 alongside Opus 4.6 as a "Research Preview."

### Enabling and configuring agent teams

Enable via settings (recommended) or environment variable:

```json
// ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

This unlocks six core tools: **TeamCreate, TaskCreate, TaskUpdate, TaskList, SendMessage, TeamDelete** — plus **ExitWorktree** for teammates to leave worktree contexts and return to the main workspace. Requires Claude Code **v2.1.32+**. The feature works on Pro tier but practically demands Max tier ($100-200/month) or API billing because each teammate is a full ~200K token session — a 5-agent team consumes roughly **1M tokens per session**.

### SubAgent vs. TeammateTool: choosing the right pattern

This is the single most important architectural decision when working with multiple agents:

**SubAgent (Task tool)** spawns fire-and-forget workers. One-way communication only — the subagent works, summarizes results, and returns them to your context window. Low token cost because you get summarized output, not full transcripts. **Use for**: focused research, code review, verification, any task where only the result matters.

**Agent Teams (TeammateTool)** create persistent, peer-to-peer collaborators. Each teammate runs as an independent Claude Code instance with its own context window, loads CLAUDE.md and MCP servers independently, and communicates via a **filesystem-based mailbox system** under `~/.claude/teams/{team-name}/inboxes/`. Teammates message each other directly using `SendMessage`, claim tasks from shared task lists, and persist until explicitly shut down. **Use for**: competing hypotheses, cross-domain coordination, QA swarms, any work requiring real-time collaboration.

The key analogy: **subagents are contractors sent on separate errands; agent teams are a collaborative engineering squad.**

### The Agent Mailbox pattern

Communication uses JSON inbox files on the filesystem. Messages support types including `message`, `broadcast`, `shutdown_request`, `shutdown_response`, and `plan_approval_response`. The lead can message any teammate; teammates can message the lead and each other (true peer-to-peer, not hub-and-spoke). **Atomic writes** via tempfile + os.replace prevent race conditions.

Task coordination uses `TaskCreate`/`TaskUpdate`/`TaskList` with JSON files under `~/.claude/tasks/{team-name}/`. Tasks flow through `pending → in_progress → completed` states. Teammates self-organize by polling `TaskList`, finding unclaimed tasks, and claiming them with file locking to prevent double-claiming.

### Custom agents and specialization

Define reusable agent types in `.claude/agents/` as markdown with YAML frontmatter:

```markdown
---
name: dotnet-security-reviewer
description: Reviews .NET code for security vulnerabilities
tools: Read, Glob, Grep
model: sonnet
effort: high
maxTurns: 30
isolation: worktree   # Run in an isolated git worktree (v2.1.50)
---
You are a .NET security specialist. Analyze code for:
- SQL injection via raw queries or string interpolation
- Missing authorization attributes on endpoints
- Secrets in configuration files
- Insecure deserialization patterns
```

**`isolation: worktree` (v2.1.50):** Runs the agent in its own git worktree, preventing interference with the main workspace. Required for Agent Teams teammates; optional for subagents doing parallel file modifications.

**Monitor tool (v2.1.98):** Stream and filter events from background scripts or other agents in real time without polling Bash. Use in long-running agent sessions to watch for build failures, file changes, or external triggers:

```markdown
# In an agent prompt:
Use the Monitor tool to watch for new files in ./queue/ and process them as they arrive.
```

**`/team-onboarding` command (v2.1.104):** Generate a teammate ramp-up guide from your local Claude Code usage patterns — useful for onboarding new team members or configuring new agent teammates with project context.

**Cost optimization pattern**: Use Opus for the lead (strategic decisions) and Sonnet for teammates (execution work). This cuts costs by 60-70% with minimal quality loss on implementation tasks.

### Agent Teams — Core Tool Reference

| Tool | Purpose | Key parameters |
|------|---------|---------------|
| `TeamCreate` | Spin up a new named team | `name`, `description`, `members[]` |
| `TaskCreate` | Add a task to the shared queue | `title`, `description`, `assignee` (optional) |
| `TaskUpdate` | Change task state | `task_id`, `status: "in_progress"\|"completed"` |
| `TaskList` | List all tasks and their states | `team_name` |
| `SendMessage` | Send typed message to a teammate | `to`, `message_type`, `content` |
| `TeamDelete` | Tear down team and clean up mailboxes | `name` |

**Message types for SendMessage:**
- `message` — direct peer-to-peer communication
- `broadcast` — send to all teammates at once
- `shutdown_request` — politely stop a teammate
- `shutdown_response` — teammate acknowledges shutdown
- `plan_approval_response` — respond to a plan review request

### Current limitations to know

Session resumption does not restore teammates — after `/resume`, spawn new ones. No nested teams (teammates cannot create their own teams). One team per session. The lead role cannot transfer. Delegate mode restrictions pass to teammates, which can cause stalling. These are Research Preview constraints likely to improve.

### Module 2 — Common Mistakes

| Mistake | Why it hurts | Fix |
|---------|-------------|-----|
| Using Agent Teams for simple parallelism | 5-7× cost for no benefit | Use SubAgents with Task tool instead |
| All teammates on Opus 4.7 | $$$: each is a full Opus session | Lead on Opus; teammates on Sonnet/Haiku |
| No task decomposition before TeamCreate | Teammates idle waiting for direction | Pre-define tasks; claim-and-execute pattern |
| Forgetting `isolation: worktree` | Teammates conflict on same files | Add `isolation: worktree` to all teammates |
| Building on Agent Teams for production | Research Preview = breaking changes | Prototype only; not GA yet |

---

## Module 3: The hooks system — programmatic quality gates

### Learning Objectives

By the end of this module you will be able to:
- Identify every hook event and when it fires in the session lifecycle
- Write command, HTTP, prompt, and agent hook handlers
- Use exit codes correctly (0/2/other) and understand their effects
- Block dangerous operations programmatically using PreToolUse
- Verify Claude's output quality using Stop hooks
- Debug hook failures and reload hooks without restarting

### Hook Lifecycle — Visual Sequence

```
  Claude Code Session — Hook Injection Points

  ┌─── Session Start ────────────────────────────────────────────────┐
  │  hooks: SessionStart (inject context), Setup (–-maintenance)     │
  └──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
  ┌─── Per Turn ─────────────────────────────────────────────────────┐
  │                                                                   │
  │  [User types prompt] ──► UserPromptSubmit hook                   │
  │        exit 2 = block prompt                                     │
  │                    │                                             │
  │                    ▼ Claude reasons                              │
  │                                                                  │
  │  [Claude calls tool] ──► PreToolUse hook                         │
  │        exit 2 = deny tool call                                   │
  │        return updatedInput = modify tool arguments               │
  │                    │                                             │
  │                    ▼ Tool executes                               │
  │                                                                  │
  │  [Tool returns result] ──► PostToolUse hook                      │
  │        can augment result, add context                           │
  │                    │                                             │
  │                    ▼ Claude responds                             │
  │                                                                  │
  │  [Claude says "done"] ──► Stop hook                              │
  │        exit 2 + reason = force continuation                      │
  │                                                                  │
  └───────────────────────────────────────────────────────────────────┘
                               │
                               ▼
  ┌─── Special Events ───────────────────────────────────────────────┐
  │  FileChanged, CwdChanged, WorktreeCreate, WorktreeRemove         │
  │  PreCompact / PostCompact (before/after context compaction)      │
  │  InstructionsLoaded (after CLAUDE.md + rules loaded)             │
  │  SubagentStop, TeammateIdle, TaskCompleted                       │
  │  PermissionDenied, Notification (alerts, permission prompts)     │
  └──────────────────────────────────────────────────────────────────┘

  Hook exit codes:
  exit 0  → success, proceed normally
  exit 2  → blocking error; stderr text is fed back to Claude
  exit 1+ → non-blocking warning; logged but does not stop execution
```

Hooks transform Claude Code from an interactive assistant into a **governed development system** with automated validation, security enforcement, and zero-hallucination verification.

### Hook event types and lifecycle

Claude Code provides **30+ hook events** spanning the full session lifecycle:

| Event | When | Can Block? | Version |
|-------|------|-----------|--------|
| **PreToolUse** | Before any tool executes | Yes — return `deny` to prevent execution | Original |
| **PostToolUse** | After tool completes | Yes — feed errors back to Claude | Original |
| **UserPromptSubmit** | Before Claude processes your input | Yes — exit 2 blocks the prompt | Original |
| **Stop** | When Claude finishes responding | Yes — exit 2 with reason forces continuation | Original |
| **StopFailure** | When the Stop hook itself fails | No — error logged | v2.1.78 |
| **SessionStart** | New/resumed session | No — but can inject context | Original |
| **SessionEnd** | Session terminating | No — async, uses separate timeout env var | Original |
| **Setup** | Triggered by `--maintenance` flag or on-demand setup workflows | No — runs setup scripts | v2.1.10 |
| **Notification** | Permission prompts, idle alerts | No | Original |
| **PreCompact** | Before context compaction (matcher: `manual` or `auto`) | No | Original |
| **PostCompact** | After context compaction completes | No | v2.1.76 |
| **WorktreeCreate** | When a git worktree is created | No — `hookSpecificOutput.worktreePath` | v2.1.50 |
| **WorktreeRemove** | When a git worktree is removed | No | v2.1.50 |
| **CwdChanged** | When the working directory changes | No | v2.1.83 |
| **FileChanged** | When a tracked file is modified on disk | No | v2.1.83 |
| **ConfigChange** | When a settings file changes | No — triggers config reload | v2.1.49 |
| **InstructionsLoaded** | After CLAUDE.md and rules finish loading | No | v2.1.69 |
| **Elicitation** | MCP server requests structured input from user | No — pause for user dialog | v2.1.76 |
| **ElicitationResult** | After user responds to elicitation | No | v2.1.76 |
| **SubagentStop** | When a subagent finishes | Yes | Original |
| **PermissionDenied** | User denies a permission prompt | No — but can log or alert | v2.1.89 |
| **TeammateIdle** | An Agent Teams teammate has no pending tasks | No | Original |
| **TaskCompleted** | An Agent Teams task transitions to completed | No | Original |

### Configuration format and matchers

Configure in `.claude/settings.json` (project) or `~/.claude/settings.json` (user):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ./scripts/security-check.py",
            "timeout": 60
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "./scripts/dotnet-validate.sh" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify all unit tests pass. Run the test suite and check results. $ARGUMENTS",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

Matchers use regex against tool names: `"Edit|Write"` matches both, `"mcp__github__.*"` matches all GitHub MCP tools, `"Bash"` matches shell commands only. Hooks receive **JSON on stdin** containing `tool_name`, `tool_input`, `session_id`, and `cwd`.

### Three hook types

Beyond standard **command** hooks (shell scripts), Claude Code supports:
- **http** hooks (POST to a webhook/sidecar — v2.1.63): sends JSON payload to a local or remote HTTP endpoint; ideal for audit trails, SIEM integration, and long-running validators that shouldn't block the terminal.
- **prompt** hooks (LLM evaluation using Haiku for fast, cheap assessment)
- **agent** hooks (full subagent verification with tool access, up to 50 turns)

Agent hooks are the most powerful — they can read files, run tests, and make informed decisions about whether Claude should stop or continue.

**Additional hook options:**
- `"once": true` — hook runs once per session then auto-removes itself (v2.1.0); useful for one-time setup validation
- `"if": "Bash(git *)"` — conditional hook using permission rule syntax; hook only fires when the condition matches (v2.1.85)
- `"disableAllHooks": true` in settings — completely disables all hook execution for a session
- `"disableSkillShellExecution": true` (v2.1.91) — prevents skills from executing shell commands, making them read-only
- `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS` env var — override the SessionEnd hook timeout (separate from the 10-minute global timeout)

### Production .NET integration hooks

**Build validation after every C# edit:**
```bash
#!/bin/bash
# .claude/hooks/dotnet-validate.sh
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')
if [[ "$file_path" =~ \.cs$ ]]; then
    dotnet format --include "$file_path" 2>/dev/null
    dotnet build --no-restore 2>&1
    if [[ $? -ne 0 ]]; then
        echo "Build failed after editing $file_path" >&2
        exit 2  # Blocking error — fed back to Claude
    fi
fi
```

**Block dangerous Azure CLI operations:**
```bash
#!/bin/bash
input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')
if echo "$command" | grep -qE 'az (group|resource) delete'; then
    echo "BLOCKED: Azure resource deletion requires manual approval" >&2
    exit 2
fi
```

**PreToolUse input modification** — transparently add `--dry-run` to deployment commands:
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "updatedInput": {
      "command": "az deployment group create --what-if ..."
    }
  }
}
```

**Critical implementation detail**: hooks snapshot at session start. Config edits require a session restart or use `/hooks` to reload. All matching hooks run in parallel. Exit code 0 = success, exit code 2 = blocking error (stderr fed to Claude), any other exit = non-blocking warning.

### Hook Debugging Checklist

When a hook isn't working as expected:

```bash
# 1. Verify hook config is valid JSON
cat .claude/settings.json | jq '.hooks'

# 2. Test hook script standalone (stdin = simulated tool_use event)
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /tmp/test"}}' \
  | bash .claude/hooks/my-hook.sh

# 3. Check exit code
echo $?  # should be 0, 2, or other

# 4. Reload hooks without restarting
# Run /hooks inside Claude Code session

# 5. Enable hook debug logging
CLAUDE_CODE_HOOK_DEBUG=1 claude
```

### Module 3 — Common Mistakes

| Mistake | Why it hurts | Fix |
|---------|-------------|-----|
| Blocking hook takes 60+ seconds | Claude waits; session feels hung | Add `"timeout": 30` to hook config |
| Using `exit 1` instead of `exit 2` | Error is logged but doesn't stop Claude | Use `exit 2` for blocking errors |
| Hook reads from disk at every turn | Performance overhead accumulates | Cache expensive checks; use `"once": true` for one-time setup |
| Forgetting to reload after editing | Old hook behaviour persists | Run `/hooks` or restart session |
| Hooks running in session start | Not all hooks fire at session start | Check which events you actually need |

---

## Module 4: MCP servers — extending Claude's tool reach

### Learning Objectives

By the end of this module you will be able to:
- Explain the MCP Host → Client → Server architecture
- Configure MCP servers across all three scope levels (local/project/user)
- Build a custom MCP server in your preferred language
- Apply security hardening to prevent tool injection and data exfiltration
- Manage context overhead from MCP tool definitions
- Use ToolSearch for automatic deferral of large tool sets

### MCP Architecture — Visual Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MCP ARCHITECTURE                                │
└─────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────────────┐
  │  HOST: Claude Code                   │
  │  Manages multiple MCP clients        │
  └───────────┬──────────────────────────┘
              │ JSON-RPC 2.0
      ┌───────┼───────────────────┐
      │       │                   │
      ▼       ▼                   ▼
  ┌───────┐ ┌───────┐         ┌───────┐
  │Client │ │Client │   ...   │Client │
  └───┬───┘ └───┬───┘         └───┬───┘
      │         │                 │
      ▼         ▼                 ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ MCP      │ │ MCP      │ │ MCP      │
  │ Server   │ │ Server   │ │ Server   │
  │ (stdio)  │ │ (HTTP)   │ │ (custom) │
  │ GitHub   │ │ Azure    │ │ Internal │
  └──────────┘ └──────────┘ └──────────┘

  Each server exposes 3 primitives:
  • Tools    → functions Claude can invoke (most common)
  • Resources → structured data Claude can read
  • Prompts  → templates that appear as slash commands

  Transport options:
  • stdio  → local process on same machine (most common)
  • HTTP   → remote service over HTTPS (recommended for cloud)
  • SSE    → deprecated (migrate to HTTP)
```

The Model Context Protocol gives Claude Code access to **any external system** through a standardized JSON-RPC 2.0 interface. With 10,000+ active servers and first-class support across Claude, ChatGPT, Cursor, Gemini, and VS Code, MCP is the universal integration layer for AI tooling.

### Architecture and transport protocols

MCP follows a Host → Client → Server model. Claude Code (host) manages multiple clients, each connecting to independent servers via three transports: **stdio** (local processes, most common), **HTTP** (remote services, recommended for cloud), and **SSE** (deprecated, use HTTP). Servers expose three primitives: **Tools** (functions the model invokes), **Resources** (structured data), and **Prompts** (templates that appear as slash commands).

### Configuration for .NET/Azure ecosystems

Three scopes with clear precedence: **local** (`~/.claude.json` under project path) > **project** (`.mcp.json` at root, version-controlled) > **user** (`~/.claude.json` global).

**Essential MCP servers for .NET/Azure development:**

```json
{
  "mcpServers": {
    "azure-devops": {
      "command": "npx",
      "args": ["-y", "@azure-devops/mcp", "your-org", "-d", "work-items", "repositories", "pipelines"],
      "env": {}
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "database": {
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub", "--dsn", "postgresql://readonly:${DB_PASSWORD}@db.example.com:5432/analytics"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

Environment variable expansion works in `.mcp.json`: `${VAR}` and `${VAR:-default}` syntax in `command`, `args`, `env`, `url`, and `headers` fields.

### Building custom MCP servers in C#/.NET

The official **C#/.NET MCP SDK** (`ModelContextProtocol` NuGet package, maintained with Microsoft) uses attribute-based tool registration:

```csharp
using Microsoft.Extensions.Hosting;
using ModelContextProtocol;

var builder = Host.CreateEmptyApplicationBuilder(settings: null);
builder.Services.AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();
var app = builder.Build();
await app.RunAsync();

[McpServerToolType]
public class BicepTools
{
    [McpServerTool, Description("Validate Bicep template syntax")]
    public static async Task<string> ValidateBicep(string templatePath)
    {
        var process = Process.Start("az", $"bicep build --file {templatePath}");
        await process.WaitForExitAsync();
        return process.ExitCode == 0 ? "Valid" : "Errors found";
    }
}
```

Use `CreateEmptyApplicationBuilder` (not `CreateDefaultBuilder`) for stdio transport to prevent non-JSON-RPC output from corrupting the protocol stream.

### Security considerations

MCP security is non-negotiable in enterprise settings. Real-world incidents in 2025 included SQL injection in Anthropic's own SQLite reference server, a path-traversal exploit on the Smithery platform affecting 3,000+ hosted apps, and a critical OS command-injection (CVE-2025-6514) in `mcp-remote` affecting 437,000+ environments. **Mitigations**: validate and sanitize all inputs, use parameterized queries, run local servers in Docker sandboxes, implement least-privilege tokens, and monitor for tool description changes (rug pull attacks).

**Context window awareness**: each enabled MCP server adds tool definitions to Claude's system prompt. Keep MCP overhead under **20K tokens** — disable unused servers via `/mcp` during sessions.

**ToolSearch auto-deferral (v2.1.7+):** When total MCP tool definitions exceed ~10% of context (~10K tokens), Claude Code automatically defers loading full tool schemas. Only lightweight stubs (name + 1-line description) appear in the context prefix; full schemas are injected into conversation history on demand. This saves **85%+ of tool definition tokens** and actually improves tool selection accuracy. Opt out per-server with `"enableToolSearch": false` in `.mcp.json`.

**Tool description caps (v2.1.84):** Tool descriptions are limited to 2KB to prevent OpenAPI-generated servers from bloating context. Long descriptions are truncated automatically.

**MCP Elicitation (v2.1.76):** MCP servers can request structured input from the user mid-task via an interactive dialog. Claude Code pauses and presents the elicitation form to the user. The `Elicitation` hook fires before the dialog, `ElicitationResult` after.

**Large tool results (v2.1.91):** MCP tools can return up to 500K characters by including `_meta["anthropic/maxResultSizeChars"]` in their response. Default cap is 25K tokens.

**MCP OAuth (v2.1.85):** HTTP MCP servers support OAuth via RFC 9728 discovery. Manual URL paste fallback available for environments where browser redirect fails (v2.1.63).

**MCP headers (v2.1.85):** Use `headersHelper` scripts in `.mcp.json` to generate dynamic auth headers. `CLAUDE_CODE_MCP_SERVER_NAME` and `CLAUDE_CODE_MCP_SERVER_URL` env vars are injected into helper scripts.

### Building MCP Servers — Language Examples

**TypeScript (official SDK):**
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "my-tools", version: "1.0.0" });

server.tool("run_tests", "Run the test suite", {
  pattern: z.string().optional().describe("Test file pattern"),
}, async ({ pattern }) => {
  // implementation
  return { content: [{ type: "text", text: "Tests passed" }] };
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Python (official SDK):**
```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import asyncio

app = Server("my-tools")

@app.list_tools()
async def list_tools():
    return [Tool(name="run_tests", description="Run test suite",
                 inputSchema={"type": "object", "properties": {}})]

@app.call_tool()
async def call_tool(name: str, arguments: dict):
    return [TextContent(type="text", text="Tests passed")]

async def main():
    async with stdio_server() as (read, write):
        await app.run(read, write, app.create_initialization_options())

asyncio.run(main())
```

### Module 4 — Common Mistakes

| Mistake | Why it hurts | Fix |
|---------|-------------|-----|
| Enabling 10+ MCP servers always | 20K+ token overhead per session | Use project-scoped `.mcp.json`; disable unused servers via `/mcp` |
| stdio server uses `CreateDefaultBuilder` | Non-JSON output corrupts protocol | Use `CreateEmptyApplicationBuilder` (C#) or stdio transport only |
| No input validation in tool handlers | SQL injection, path traversal | Validate and sanitize all inputs; use parameterized queries |
| Secrets in `.mcp.json` plaintext | Exposed in version control | Use `${VAR}` env expansion; secrets in `.env` |
| Using SSE transport | Deprecated, unstable | Migrate to HTTP transport |

---

## Module 5: Advanced prompt engineering — from practitioner to architect

### Learning Objectives

By the end of this module you will be able to:
- Structure prompts with XML tags for reliable parsing and attention
- Use extended thinking triggers appropriately for different problem types
- Apply multi-shot anchoring with cached examples
- Choose the right agentic pattern (ReAct, chaining, routing, etc.) for a task
- Use the Spec-Driven Development workflow for complex projects
- Identify and fix the six most common prompt engineering anti-patterns

### Prompt Structure Best Practices

A well-structured Claude Code prompt follows the **RICS** pattern:

```
Role:        Who Claude is for this task
Instructions: What to do, how to do it
Context:     What Claude needs to know (files, constraints, history)
Schema:      What the output should look like

Example prompt structure:
┌─────────────────────────────────────────────────────────────┐
│ <instructions>                                               │
│   You are a security reviewer. Analyze the attached API     │
│   endpoint for vulnerabilities.                             │
│ </instructions>                                             │
│                                                             │
│ <context>                                                   │
│   Stack: .NET 10 / EF Core / SQL Server                    │
│   This endpoint handles user authentication.                │
│ </context>                                                  │
│                                                             │
│ <constraints>                                               │
│   - Only report confirmed vulnerabilities                   │
│   - Include CVSS severity score                             │
│   - Reference specific line numbers                         │
│ </constraints>                                              │
│                                                             │
│ <output_format>                                             │
│   Markdown table: File | Line | Severity | Description | Fix │
│ </output_format>                                            │
└─────────────────────────────────────────────────────────────┘
```

The shift from "prompt engineering" to **context engineering** is the defining evolution of 2025-2026. Anthropic now frames the discipline as: "What configuration of context is most likely to generate the desired behavior?" The goal is finding the **smallest possible set of high-signal tokens** that maximize output quality.

### XML tagging for structured prompts

Claude has been fine-tuned to pay special attention to XML tag structure. While Anthropic notes modern models understand structure without XML, tags remain essential for complex prompts, agentic workflows, and parseable outputs. Anthropic uses XML in their own system prompts:

```xml
<instructions>Analyze the codebase for security vulnerabilities</instructions>
<context>This is a .NET 10 API using EF Core with SQL Server</context>
<constraints>
- Only report confirmed vulnerabilities, not theoretical risks
- Include severity rating (Critical/High/Medium/Low)
- Provide specific file and line references
</constraints>
<output_format>
Return findings as a structured list with: file, line, severity, description, fix
</output_format>
```

**Guided Chain-of-Thought** dramatically improves complex reasoning. The structured pattern — `<thinking>` for reasoning, `<answer>` for output — lets Claude show work while keeping responses clean. AWS prescriptive guidance confirms this architecture improves both accuracy and injection resistance for RAG systems.

### Extended thinking triggers in Claude Code

**This is a Claude Code CLI-exclusive feature.** Trigger words map to specific thinking token budgets:

| Trigger | Budget | Use when |
|---------|--------|----------|
| "think" | ~4,000 tokens | Routine tasks, basic reasoning |
| "think hard" / "megathink" | ~10,000 tokens | Design work, caching strategy |
| "think harder" / "ultrathink" | ~31,999 tokens | Architecture decisions, complex debugging |

**Important Opus 4.6 update**: The latest model uses **adaptive reasoning** where Claude dynamically allocates thinking depth. The `/effort` level setting (low, medium, high) controls this — the `max` tier was removed in **v2.1.72**. Default effort is `high` for API/Bedrock/Vertex/Team/Enterprise tiers (v2.1.94). The trigger word system ("think hard", "ultrathink") is being deprecated in favor of `/effort`. For older models, the fixed-budget system still applies. Cost range: ~$0.06/task (basic) to ~$0.48/task (ultrathink). Reserve high-effort for decisions where the cost of error exceeds $5 or time saved exceeds 1 hour.

### Multi-shot anchoring and meta-prompting

Include **3-5 diverse, relevant examples** wrapped in `<examples>` tags. With prompt caching (90% cost reduction on cached reads), you can now affordably include 20+ high-quality examples — previously cost-prohibitive. Each example should demonstrate a different edge case or challenge pattern.

**Meta-prompting** uses Claude itself to generate, audit, and refine prompts. Anthropic's Console includes a built-in Prompt Generator and Prompt Improver. The practical pattern: write a rough prompt → ask Claude to analyze it for ambiguities, missing context, and edge cases → iterate until robust. The **Evaluator-Optimizer loop** takes this further: an LLM-as-Judge assesses output quality and generates feedback that feeds into iterative prompt optimization.

### Agentic prompt design patterns

The six core patterns for agentic systems, ordered by complexity:

1. **Single agent tool loop** (ReAct): LLM adaptively calls tools in a while-loop. Thought → Action → Observation → repeat.
2. **Prompt chaining**: Sequential subtask processing with explicit handoffs between focused prompts.
3. **Routing**: LLM classifies input and directs to specialized handlers.
4. **Parallelization**: Multiple LLMs work simultaneously on independent aspects.
5. **Orchestrator-Workers**: Lead agent delegates to specialized sub-agents (Claude Code's native pattern).
6. **Evaluator-Optimizer**: Generator + evaluator iterate until quality threshold met (max 3-5 iterations).

Anthropic's Applied AI team recommends writing prompts at the **"right altitude"** — heuristics and principles rather than brittle if-then rules. Curate minimal viable tool sets where every tool justifies its existence. Design tools that are self-contained, non-overlapping, and purpose-specific.

### The Spec-Driven Development workflow

The dominant framework for complex Claude Code work:

```
1. EXPLORE → "Read the codebase structure. Don't write code yet."
2. PLAN → "Ultrathink. Analyze the problem and propose a plan. Don't code."
3. CODE → Implement based on confirmed plan. Tests first.
4. COMMIT → "Commit with a descriptive message and create PR."
```

Save plans as `PLAN.md` files. Use Plan Mode (`Shift+Tab` twice or `--permission-mode plan`) for read-only analysis. This workflow prevents the most common failure mode: Claude jumping into implementation before understanding the problem space.

### Prompt Anti-Patterns to Avoid

| Anti-pattern | Problem | Fix |
|-------------|---------|-----|
| "Write me a function that..." | No context, no constraints | Include: stack, existing patterns, test requirements |
| Vague acceptance criteria | Claude decides what "done" means | Specify: "Tests pass, linter clean, PR description written" |
| Asking Claude to review its own work | Confirmation bias; self-review fails | Use independent subagent: `Task("review this code")` |
| "Fix all the bugs" | Unbounded scope; hallucinations | Scope: "Fix the null-reference in UserService.GetById" |
| Chaining many tasks in one prompt | Context mixing; partial completion | Break into sequential, verified steps |
| Dynamic content in system-equivalent position | Breaks prompt cache | Keep CLAUDE.md static; dynamic context in user turn |

### Module 5 — Common Mistakes

| Mistake | Why it hurts | Fix |
|---------|-------------|-----|
| Using "ultrathink" for every task | 32K thinking tokens = expensive | Reserve for architecture decisions; use "think" for routine |
| No examples in few-shot prompts | Inconsistent output format | Include 3-5 diverse examples in `<examples>` tags |
| Asking Claude to generate and review its own output | Self-review = confirmation bias | Use second Claude instance or subagent as reviewer |
| Putting variable data in CLAUDE.md | Breaks prompt caching | Only static instructions in CLAUDE.md |
| Skipping the EXPLORE phase | Claude implements the wrong thing | Always: Explore → Plan → Code → Commit |

---

## Module 6: RAG systems and enterprise AI architecture

### Learning Objectives

By the end of this module you will be able to:
- Classify RAG architectures (Naive, Advanced, Modular, Agentic, GraphRAG)
- Select the right vector database for your performance and scale requirements
- Implement hybrid search (BM25 + vector) with RRF fusion
- Apply the five-layer security model for production RAG
- Evaluate RAG performance beyond simple accuracy metrics
- Choose chunking and embedding strategies for different content types

### RAG Pipeline — Visual Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RAG PIPELINE ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────┘

  INDEXING (offline, run once or on document update):
  ┌──────────────┐
  │  Raw Docs    │
  │ (PDF, DOCX,  │
  │  HTML, etc.) │
  └──────┬───────┘
         │ Chunking strategy
         ▼ (fixed-size, semantic, hierarchical, page-level)
  ┌──────────────┐
  │    Chunks    │──► Embedding model ──► Vector store (index)
  │ + metadata   │                        (BM25 index for hybrid)
  └──────────────┘

  RETRIEVAL (online, per query):
  ┌──────────────┐
  │  User Query  │──► Query rewriting (optional)
  └──────┬───────┘
         │
    ┌────┴────────────────────────────┐
    │ Vector search     BM25 search   │
    │ (semantic match)  (keyword match)│
    └────┬─────────────┬──────────────┘
         │             │
         ▼             ▼
    ┌─────────────────────────┐
    │   RRF Fusion            │ ← Reciprocal Rank Fusion
    │   (combine rankings)    │
    └────────────┬────────────┘
                 │
                 ▼ Re-ranking (optional: cross-encoder)
    ┌────────────────────────┐
    │  Top-K chunks          │
    └────────────┬───────────┘
                 │
  GENERATION:    ▼
  ┌──────────────────────────┐
  │  LLM (Claude)            │
  │  Prompt: context + query │──► Answer + citations
  └──────────────────────────┘

  Evaluation metrics:
  • Faithfulness: answer grounded in retrieved context?
  • Answer relevance: answers the question asked?
  • Context precision: retrieved chunks actually used?
  • Context recall: all relevant chunks retrieved?
```

RAG has evolved from a simple retrieve-then-generate pipeline into a family of sophisticated architectures. The right choice depends on query complexity, corpus size, and accuracy requirements.

### The 2025-2026 RAG taxonomy

**Naive RAG** (query → embed → search → generate) remains viable for simple Q&A over small corpora. **Advanced RAG** adds pre-retrieval query rewriting, post-retrieval re-ranking with cross-encoder models, and context compression — this is the most commonly deployed enterprise pattern. **Modular RAG** treats each component as an interchangeable microservice with declarative configuration. **Agentic RAG** deploys autonomous reasoning agents that orchestrate retrieval, decide which sources to query, and iteratively refine results — significantly more complex but essential for multi-hop reasoning.

**GraphRAG** (Microsoft Research) uses LLM-generated knowledge graphs to dramatically improve retrieval for relationship-heavy domains. GraphRAG 2.0 (October 2025) achieved **92% accuracy** on complex technical documents with a new neural entity extraction model. Best for legal, healthcare, financial, and scientific domains where entities and relationships drive insight.

The decision framework: Simple queries/small corpus → Naive RAG. Enterprise Q&A/accuracy-critical → Advanced RAG. Multiple evolving data sources → Modular RAG. Complex multi-step reasoning → Agentic RAG. Relationship-heavy data → GraphRAG.

### Vector database selection for enterprise

For .NET/Azure ecosystems, **Azure AI Search** is the default choice — native integration with Azure OpenAI, Semantic Kernel, and built-in hybrid search with Reciprocal Rank Fusion. For self-hosted requirements, **Qdrant** (Rust-based, fastest metadata filtering) and **Milvus** (billion-scale with GPU acceleration) lead. **ChromaDB** is strictly for prototyping — not enterprise-ready.

**Hybrid search** (combining vector similarity with BM25 keyword matching) consistently outperforms either method alone by **20-30%** in recall benchmarks. Vector search misses product IDs, proper nouns, and exact codes; BM25 misses synonyms and semantic intent. Azure AI Search's built-in RRF fusion handles this natively.

### Production RAG on Azure with Semantic Kernel

The reference architecture for .NET:

```csharp
// Semantic Kernel RAG pipeline
var builder = Kernel.CreateBuilder();
builder.AddAzureOpenAIChatCompletion(deployment, endpoint, apiKey);
var kernel = builder.Build();

// Azure AI Search integration
var embeddingGenerator = new AzureOpenAIClient(
    new Uri(endpoint), new AzureCliCredential())
    .GetEmbeddingClient("text-embedding-3-large")
    .AsIEmbeddingGenerator(1536);

var vectorStore = new AzureAISearchVectorStore(searchClient);
```

Microsoft's **Agentic Retrieval** (preview) is the recommended approach for new projects: the LLM decomposes complex queries into focused subqueries, executes them in parallel across multiple indexes, and uses conversation history for context-aware planning. Classic RAG with hybrid search remains the GA option for production-critical applications.

### Security hardening for RAG

Implement defense in depth: **Input Layer** (sanitization, malicious encoding blocking) → **Prompt Layer** (structured templates with trust boundaries separating system instructions from user data) → **Retrieval Layer** (RBAC on vector stores, vetted documents only) → **Model Layer** (resource constraints, monitoring) → **Output Layer** (PII scanning, hallucination checks). The `<thinking>` + `<answer>` tag architecture improves both accuracy and injection resistance by separating reasoning from user-facing output.

### Vector Database Comparison

| Database | Best for | Strengths | Avoid when |
|----------|---------|-----------|----------|
| **Azure AI Search** | .NET/Azure teams | Native Azure integration, hybrid search, RRF | Not on Azure |
| **Qdrant** | Metadata-heavy filtering | Fastest metadata filters, Rust performance | Need managed service without Qdrant Cloud |
| **Milvus** | Billion-scale | GPU acceleration, multi-tenancy | Small corpus (<1M vectors) |
| **Weaviate** | Multi-modal | Text + image + video in one index | Pure text RAG |
| **Pinecone** | Quick start, managed | Serverless, zero ops | Cost at scale; vendor lock-in |
| **pgvector** | Existing PostgreSQL stack | No new infra, SQL joins | >10M vectors or high QPS |
| **ChromaDB** | Prototyping only | Simple Python API | Any production use |

### Module 6 — Common Mistakes

| Mistake | Why it hurts | Fix |
|---------|-------------|-----|
| Fixed-size chunking always | Splits sentences, destroys context | Use semantic chunking for prose; fixed for code |
| Vector-only search | Misses product codes, proper nouns | Always add BM25 for hybrid search |
| Aggregate accuracy metric only | 97% overall may hide 85% on one document type | Stratified evaluation by document type |
| No re-ranking step | Top-20 retrieval quality degrades fast | Add cross-encoder re-ranker (e.g., Cohere) |
| Embedding everything together | Mixes structured and unstructured retrieval | Separate indexes by content type |

---

## Module 7: Production workflows and CI/CD integration

### Learning Objectives

By the end of this module you will be able to:
- Apply the Battle Plan protocol to complex multi-step tasks
- Prevent context dilution across long sessions
- Integrate Claude Code into GitHub Actions and Azure DevOps pipelines
- Use the Agent SDK for fully programmatic Claude workflows
- Set up cost controls and monitoring for production usage
- Structure modular rules for path-scoped CI enforcement

### CI/CD Integration Flow

```
  Developer Workflow with Claude Code:

  ┌────────────┐     /plan      ┌─────────────┐
  │  You type  │ ──────────►   │ Plan Mode   │
  │  a task    │               │ (read-only) │
  └────────────┘               │ Explore →   │
                               │ Plan →      │
                               │ Pause ◄─────┼── You review & approve
                               └──────┬──────┘
                                      │ approved
                                      ▼
  ┌─────────────────────────────────────────────────┐
  │  IMPLEMENTATION PHASE (Normal/Auto-Accept mode) │
  │  Claude: Read → Edit → Test → Fix → Repeat      │
  └──────────────────────────┬──────────────────────┘
                             │
                             ▼ pre-commit hook (local)
  ┌─────────────────────────────────────────────────┐
  │  GIT PUSH                                       │
  └──────────────────────────┬──────────────────────┘
                             │
                             ▼ GitHub Actions / Azure DevOps
  ┌─────────────────────────────────────────────────┐
  │  CI PIPELINE                                    │
  │  • anthropics/claude-code-action@v1 (PR review) │
  │  • claude -p "..." --permission-mode plan        │
  │  • --output-format json for structured output   │
  └─────────────────────────────────────────────────┘

  Cost controls in CI:
  --max-turns 5           # Limit agentic turns
  --max-budget-usd 0.10   # Cap per-run cost
  --bare                  # Skip hooks/MCP/plugins (14% faster)
  --allowedTools "Read,Grep,Glob"  # Read-only analysis
```

### The Battle Plan protocol

For complex tasks, **always plan before implementing**. The protocol: ask for a plan → tell Claude to pause → review and refine → approve implementation. Use Plan Mode (`Shift+Tab` twice) for read-only analysis where Claude can Read, Glob, Grep, and WebFetch but cannot Edit, Write, or run Bash.

The advanced 4-phase approach: **Research → Plan → Implement → Validate**. Never exceed 60% context in any phase. Clear context between phases. Save everything to a `thoughts/` directory. This prevents the most expensive failure mode: Claude implementing the wrong solution in a context-exhausted session.

### Preventing context dilution

Context dilution is the silent killer of long Claude Code sessions. **Five proven strategies**:

1. **Put persistent rules in CLAUDE.md**, not conversation — instructions from early turns get lost during compaction.
2. **Use subagents for context isolation** — each subagent gets a fresh 200K context window. Complex research generates thousands of intermediate tokens in the subagent's context but returns only a condensed summary to yours.
3. **Document & Clear method** — have Claude dump its plan to a `.md` file, `/clear` completely, start a fresh session reading the file.
4. **Proactive compaction at 70%** — don't wait for auto-compact at 98%. Use `/compact focus on [specific topic]` to control what's preserved.
5. **Git worktrees for parallel isolation** — `git worktree add ../feature-branch` with separate Claude Code instances.

### CI/CD integration patterns

**GitHub Actions** with the official `anthropics/claude-code-action@v1`:

```yaml
name: Claude PR Review
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            SECURITY REVIEW for .NET:
            - Check for SQL injection via raw queries
            - Verify authorization on all endpoints
            - Check secrets handling
            Flag issues as 🚨 SECURITY with severity.
```

**Azure DevOps** integration uses CLI mode in pipeline YAML:

```yaml
steps:
  - script: npm install -g @anthropic-ai/claude-code
  - script: |
      claude -p "Review code changes for security and quality" \
        --output-format json \
        --allowedTools "Read,Grep,Glob" \
        --permission-mode plan
    env:
      ANTHROPIC_API_KEY: $(ANTHROPIC_API_KEY)
```

The **Claude Agent SDK** (TypeScript: `@anthropic-ai/claude-agent-sdk`) enables fully programmatic usage with structured JSON output, configurable tool sets, and permission modes — essential for building custom automation pipelines.

### .NET-specific workflow optimization

Install the **dotnet-skills** package (github.com/Aaronontheweb/dotnet-skills) — 30 skills and 5 specialized agents including `modern-csharp-coding-standards`, `efcore-patterns`, `csharp-concurrency-patterns`, and agents for `dotnet-concurrency-specialist` and `dotnet-performance-analyst`. Use modular rules in `.claude/rules/` with glob patterns:

```markdown
<!-- .claude/rules/api/security.md -->
---
globs: ["src/Api/**/*.cs", "src/**/Controllers/**/*.cs"]
---
# API Security Rules
- Always validate JWT tokens
- Rate limiting on all endpoints
- CORS must be restrictive
```

### Agent SDK — Programmatic Workflow Example

```typescript
import { query, ClaudeAgentOptions } from "@anthropic-ai/claude-agent-sdk";

// Fully automated code review pipeline
async function reviewPR(prDiff: string): Promise<ReviewResult> {
  const options: ClaudeAgentOptions = {
    model: "claude-sonnet-4-6",
    permissionMode: "plan",        // read-only
    maxTurns: 5,
    maxBudgetUsd: 0.25,
    allowedTools: ["Read", "Grep", "Glob"],
    outputFormat: "json",
  };

  const messages = [];
  for await (const msg of query({
    prompt: `Review this PR diff for security issues and code quality.
    Output JSON: { issues: [{file, line, severity, description, fix}] }
    
    <diff>${prDiff}</diff>`,
    options,
  })) {
    messages.push(msg);
  }
  
  const result = messages.find(m => m.type === "result");
  return JSON.parse(result?.result || "{}");
}
```

### Module 7 — Common Mistakes

| Mistake | Why it hurts | Fix |
|---------|-------------|-----|
| No `--max-turns` in CI | Runaway session; pipeline hangs | Always set `--max-turns 5-10` in automation |
| Wide tool permissions in CI | Security risk | Use `--allowedTools "Read,Grep,Glob"` for review tasks |
| Skipping Plan phase for complex tasks | Wrong implementation; expensive rework | Always Explore → Plan → Approve → Implement |
| Not using `--bare` in CI | Extra 14% startup time per run | Add `--bare` to CI pipelines |
| Inline secrets in pipeline YAML | Exposed in logs | Use GitHub Secrets / Azure Key Vault references |

---

## Module 8: Architecture patterns for AI-augmented enterprise development

### Learning Objectives

By the end of this module you will be able to:
- Apply the Council of Sub-Agents pattern for multi-agent QA
- Select the right multi-agent framework (LangGraph, CrewAI, Semantic Kernel, AutoGen)
- Design agentic CI/CD pipelines with appropriate HITL gates
- Choose stateful serverless hosting for production agent workloads
- Implement the five Human-in-the-Loop patterns
- Scope and plan enterprise AI rollouts with realistic metrics

### Multi-Agent Architecture Decision Map

```
  What type of task do you have?

  ┌─────────────────────────────────────────────────────────────────┐
  │ Single-step, bounded task                                       │
  │ (read, analyze, summarize, generate)                           │
  │ → Single Claude Code session                                   │
  └─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │ Multiple independent subtasks                                   │
  │ (parallelize: research, test, review)                          │
  │ → SubAgents via Task tool                                       │
  │   Lead orchestrates, subagents return summaries                │
  └─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │ Competing hypotheses / real-time collaboration                  │
  │ (QA swarms, cross-domain review, competing implementations)    │
  │ → Agent Teams (experimental Research Preview)                  │
  │   Lead + N teammates via filesystem mailbox                    │
  └─────────────────────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────────────────────┐
  │ Complex stateful workflow with human checkpoints                │
  │ (multi-day project, approval gates, compliance)                │
  │ → LangGraph (Python) or Semantic Kernel + Durable Functions    │
  │   State machine with HITL interrupts                           │
  └─────────────────────────────────────────────────────────────────┘

  Framework selection:
  ┌──────────────────────────────────────────────────────────────┐
  │ LangGraph     → complex stateful flows, HITL, streaming      │
  │ CrewAI        → rapid prototyping, role-based delegation     │
  │ Semantic Kernel → .NET/Azure, Durable Functions hosting      │
  │ AutoGen       → dialogue-intensive, conversation-heavy apps  │
  └──────────────────────────────────────────────────────────────┘
```

### Multi-agent QA: the Council of Sub-Agents pattern

The most compelling production implementation comes from OpenObserve's 6-phase pipeline: **Analyst** (feature analysis) → **Architect** (test planning) → **Engineer** (Playwright code generation) → **Sentinel** (quality gate that blocks on critical findings) → **Healer** (iterative test fixing, up to 5 cycles) → **Scribe** (documentation). Results: feature analysis dropped from **45-60 minutes to 5-10 minutes**, flaky tests reduced **85%**, and test coverage grew **84%**. The entire system lives as version-controlled markdown in `.claude/commands/`.

The critical lesson: **specialization over generalization**. Early iterations with a single "super agent" failed. Bounded agents with clear responsibilities consistently outperform monolithic approaches.

### Self-healing Playwright test generation

Playwright now includes three built-in agents: **Planner** (converts goals to Markdown plans), **Generator** (translates to TypeScript tests), and **Healer** (analyzes failure traces and patches broken selectors/assertions automatically). The production pattern combines structured locators with fallback arrays, wrapper helpers that cycle through alternatives, and AI-powered recovery that captures DOM snapshots and generates new selectors when all fallbacks fail.

### Agentic CI/CD — the AI/CD paradigm

The industry is shifting from automated steps to **augmented decisions**. Elastic's production implementation uses Claude Code agents that automatically propose fixes when dependency updates break builds, with CLAUDE.md files teaching agents team-specific practices. Key components: **Code Analysis Agents** (risk detection before human review), **Test Selection Agents** (AI-targeted testing instead of full regression), **Deployment Decision Agents** (real-time metric evaluation for canary releases), and **Post-Release Learning Agents** (telemetry-driven anomaly detection).

### Multi-agent orchestration framework selection

| Scenario | Recommended framework |
|----------|---------------------|
| Complex stateful workflows | **LangGraph** — graph-based state machine with HITL interrupts |
| Rapid prototyping | **CrewAI** — role-based, intuitive delegation |
| Enterprise .NET/Azure | **Semantic Kernel + Microsoft Agent Framework** — native DI, Durable Functions hosting |
| Dialogue-intensive applications | **AutoGen** — conversational model, enterprise error handling |

For the .NET/Azure stack specifically: **Azure Durable Functions** with the Microsoft Agent Framework provides stateful, serverless agent hosting with automatic session management, failure recovery, and auto-scaling. **MCP servers on Azure Functions** (GA January 2026) with native OBO authentication via Entra ID provide the integration layer.

### Insurance domain AI applications

AI has compressed **underwriting decisions from 3-5 days to 12.4 minutes** for standard policies with 99.3% accuracy. Claims document processing has moved from days to minutes through LLM-powered OCR, entity extraction, and summarization. By late 2026, analysts project **35%+ of insurers** will deploy AI agents across 3+ core functions. The regulatory landscape is active: NAIC Model Bulletin adopted by 23 states, EU AI Act requiring documentation and audits for 2026, and the NAIC AI Systems Evaluation Tool providing standardized governance frameworks.

### Human-in-the-loop is not optional

Five core HITL patterns from Google Cloud's architecture guidance: **Approval Gates** (pause at checkpoints for human review), **Escalation on Failure** (auto-escalate to human on stuck/failed agents), **Confidence-Based Routing** (below-threshold confidence → human), **Asynchronous Oversight** (agent acts, human reviews afterward), and **Evaluator/Critic Loops** (generator + critic iterate, human intervenes on persistent failures). In Claude Code, implement these through hooks (Stop hooks that verify completion criteria), permission modes (Plan Mode for read-only analysis requiring approval), and the Agent SDK's structured output for downstream human review workflows.

### Module 8 — Common Mistakes

| Mistake | Why it hurts | Fix |
|---------|-------------|-----|
| "Super agent" does everything | Monolithic agents fail on complex tasks | Specialize: each agent owns one phase |
| No HITL gates on destructive operations | Unrecoverable mistakes in production | Add Stop hooks + Plan Mode before any write |
| Ignoring agent error propagation | Silent failures cascade | Structured error context; always check agent result |
| Testing multi-agent systems manually | Expensive, slow, unreliable | Unit test each agent prompt independently |
| Measuring only end-to-end accuracy | Hides which agent is the bottleneck | Instrument each agent phase separately |

---

## Conclusion: from operator to architect

This program traces a deliberate arc from mastering Claude Code's full control surface through designing enterprise-grade AI systems. The key insight across all eight modules is that **constraint drives quality**: concise CLAUDE.md files outperform verbose ones, bounded agents outperform monolithic ones, proactive context management outperforms reactive compaction, and explicit planning phases prevent the most expensive failure mode — implementing the wrong solution.

Three capabilities distinguish elite-level practitioners. First, **architectural thinking about context** — treating the up-to-1M token context window as a strategic resource, using subagents for isolation, hooks for verification, and MCP servers for reach. Second, **multi-agent orchestration literacy** — knowing when a SubAgent suffices versus when Agent Teams are worth the 5x token cost, and designing agent specializations that produce emergent quality. Third, **production hardening instincts** — security scanning hooks on every tool use, hybrid search in RAG pipelines, HITL gates on destructive operations, and observability via OpenTelemetry from day one.

The most important mindset shift is thinking of Claude Code as a **governed system**, not a chat interface. Hooks enforce invariants that prompts cannot. Skills package expertise that CLAUDE.md cannot carry. Subagents provide isolation that a single context window cannot achieve. The practitioner who masters these boundaries will build systems that are faster, cheaper, safer, and more reliable than those who treat Claude as an advanced autocomplete.

### Next Steps

| What to read next | Why |
|------------------|-----|
| [CLI Technical Reference](./claude-code-reference) | Every documented feature through v2.1.126 — tools, flags, hook events, MCP, Agent SDK |
| [CLAUDE.md vs Skills vs Rules](./claude-code-config-guide) | The configuration architecture that makes agents reliable |
| [Every Markdown File — Catalog](./claude-code-all-markdown-files-catalog) | All 23 file types Claude Code recognises |
| [Context & Cost Efficiency](./claude-code-efficiency-reference) | Token budgets, caching, effort levels, and the /advisor command |
| [Compass Research Notes](./compass-research-notes) | Deep dives into Agent SDK internals, hooks, MCP for CCA-F exam prep |
| [Concept Validation Report](./validation-report) | 132 claims verified against official Anthropic documentation |

**Recommended practice projects (ascending difficulty):**

1. Create a CLAUDE.md + 3 rules + 1 skill for your current project
2. Build a PostToolUse hook that runs your linter after every file edit
3. Add a custom MCP server for a REST API you use regularly
4. Create a SubAgent orchestration for a multi-step analysis workflow
5. Implement the full Council pattern for end-to-end test generation in your stack

The field is moving from prescriptive prompting toward lightweight heuristic guidance and autonomous context management. Opus 4.7's adaptive reasoning supersedes fixed thinking budgets; `xhigh` effort unlocks its full reasoning depth. Agent teams will mature from Research Preview to production-grade. The practitioners who thrive will be those who internalize the principles behind the tools, not just the current syntax — because the syntax will change quarterly, but the architecture patterns endure.