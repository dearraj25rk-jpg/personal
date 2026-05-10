---
title: Claude Code
description: Complete technical reference and training for Claude Code — quick start, CLI reference, all 23 file types, configuration hierarchy, hooks system, MCP servers, agent teams, CI/CD integration, permissions, context engineering, Agent SDK, worktrees, plugins, output styles, memory management, models & pricing, slash commands, and 11 interactive diagrams. Claude Code v2.1.126 (May 2026).
sidebar:
  order: 1
lastUpdated: 2026-05-09
---

Claude Code is Anthropic's agentic terminal-based coding assistant. It lives in your terminal, understands your entire codebase, and executes multi-step engineering tasks autonomously — reading files, running commands, editing code, managing Git, and verifying its own work in a closed loop.

**Latest stable:** v2.1.126 (May 9, 2026) · **Package:** `@anthropic-ai/claude-code` (392+ published versions) · **Platforms:** macOS, Linux, WSL2, Windows native

---

## What's New (v2.1.108–v2.1.126)

| Version | Feature | What changed |
|---------|---------|-------------|
| v2.1.126 | Latest stable (May 2026) | Bug fixes, stability improvements |
| v2.1.122 | Bedrock service tiers | `default`, `flex`, `priority` tier selection via `CLAUDE_CODE_BEDROCK_SERVICE_TIER` |
| v2.1.121 | Vertex Workload Identity Federation | WIF support for GCP auth — no service account key required |
| v2.1.120 | `${CLAUDE_EFFORT}` in skills | Skills can read and respond to session effort level |
| v2.1.119 | `/config` persistence | Settings saved to `~/.claude/settings.json` via the UI |
| v2.1.118 | `DISABLE_UPDATES` + `mcp_tool` hooks | Block all updates; hooks targeting specific MCP tools |
| v2.1.117 | Opus 4.7 default `xhigh` effort | Default effort elevated for Opus 4.7; 1M context window fixes |
| v2.1.116 | `/terminal-setup` command | Configure scroll sensitivity, clipboard, iTerm2 integration |
| v2.1.113 | Native binary (no Node.js) | `Glob`/`Grep` replaced with embedded `bfs`/`ugrep` — faster cold starts |
| v2.1.108 | Cache TTL fix | 1-hour cache TTL now works for `DISABLE_TELEMETRY` users |
| v2.1.105 | `/doctor` auto-fix | Health check with `f`-key auto-repair; plugin monitors enabled |
| v2.1.104 | `/team-onboarding` | Generate teammate ramp-up guide from codebase analysis |
| v2.1.98  | Monitor tool | Stream background process output line-by-line |
| v2.1.92  | `--bare` mode | CI-optimised mode: 14% faster, skips non-essential startup steps |
| v2.1.89  | Compaction circuit breaker | Prevents thrash loop in auto-compaction scenarios |
| v2.1.84  | Rules `paths:` scoping | Rules load conditionally by file glob pattern; YAML list support |
| v2.1.63  | `http` hook handler | POST event payloads to a webhook URL |
| v2.1.32  | Agent Teams (Research Preview) | Persistent peer-to-peer multi-agent sessions via CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 |

---

## Getting Started

**New to Claude Code?** Start here → [Quick Start Guide](./quick-start)

---

## Reference Guides

| Page | What you'll learn |
|------|------------------|
| [Quick Start](./quick-start) | Install, authenticate, first session, agentic loop, keyboard shortcuts, CLAUDE.md setup, modes of operation, session management, cost tips |
| [CLI Technical Reference](./claude-code-reference) | Every documented feature through v2.1.126 — tools, slash commands, CLI flags, hooks, MCP, plugins, subagents, agent teams, worktrees, remote control, sandbox, permissions, models, pricing, GitHub Actions, Agent SDK, version timeline |
| [Configuration Guide — CLAUDE.md vs Skills vs Rules](./claude-code-config-guide) | Decision framework for all configuration files, precedence hierarchy, token budgets, best practices, enterprise patterns |
| [Every Markdown File — Complete Catalog](./claude-code-all-markdown-files-catalog) | All 23 file types Claude Code recognises — CLAUDE.md, Rules, Skills, Subagents, Output Styles, Auto-Memory, Plugin components, and more. Includes full attribute tables, examples, and the master comparison table |
| [Slash Commands — Complete Reference](./slash-commands-reference) | All built-in slash commands (30+), custom project and personal commands, special variables ($ARGUMENTS, @imports, !shell), frontmatter reference, 6 practical examples |
| [Context, Cost & Token Efficiency](./claude-code-efficiency-reference) | Auto-compaction, token budgets, caching economics, effort levels, model selection, cost optimisation, the advisor command |
| [Memory Management](./memory-management) | All 6 memory types, /memory command, compaction survival, @import syntax, claudeMdExcludes, MEMORY.md limits, monorepo patterns |
| [Models, Pricing & Effort](./models-pricing) | All models (Opus 4.7/4.6, Sonnet 4.6, Haiku 4.5), context windows, effort levels, extended thinking, Bedrock/Vertex integration, cost optimisation |
| [Output Styles](./output-styles-guide) | Built-in styles (Default, Explanatory, Learning), creating custom styles, keep-coding-instructions behavior, team styles, token cost implications |
| [Plugins](./plugins-guide) | Plugin architecture, all 10 component types, plugin.json manifest, userConfig, CLAUDE_PLUGIN_ROOT vs CLAUDE_PLUGIN_DATA, installation scopes, building and distributing plugins |

---

## Topic Guides

| Page | What you'll learn |
|------|------------------|
| [Hooks System — Deep Dive](./hooks-deep-dive) | All 30+ hook events, five handler types (command, prompt, agent, http, mcp_tool), exit codes, matchers, 9 practical patterns, security gates, audit logging |
| [MCP Servers — Architecture & Development](./mcp-servers-guide) | MCP architecture, transport types (stdio, HTTP), three primitives (Tools, Resources, Prompts), four configuration scopes, building servers in TypeScript/Python/.NET, official servers, security |
| [Agent Teams & Subagents](./agent-teams-guide) | Task tool vs Agent Teams, subagent YAML frontmatter, agent memory, team protocols, filesystem mailbox, orchestration patterns, known limitations |
| [CI/CD Integration](./cicd-integration) | GitHub Actions (`anthropics/claude-code-action@v1`), GitLab CI, Azure DevOps, non-interactive flags, Bedrock/Vertex in CI, security hardening, cost optimisation |
| [Permissions & Security](./permissions-security) | Permission modes, tool allowlists/blocklists, sandbox architecture, enterprise managed settings, audit logging, trust model |
| [Agent SDK — Python & TypeScript](./sdk-guide) | Subprocess SDK, streaming message types, StatefulClient multi-turn sessions, parallel sessions, OAuth auth, CI/CD integration, production patterns |
| [Worktrees & Parallel Development](./worktrees-guide) | `/branch` command, multiple simultaneous Claude Code sessions, PR review workflows, SDK-driven parallel worktrees, team coordination |

---

## Diagrams & Interactive Tools

| Page | What it covers |
|------|---------------|
| [Architecture Diagram](./architecture) | Full lifecycle view: session init → tool loop → compaction → shutdown. All 23 markdown file types with load order. |
| [Precedence Diagram](./precedence) | Visual hierarchy of all configuration layers, conflict resolution, and override rules |
| [Override Test Lab](./override-test-lab) | Interactive sandbox for testing configuration precedence across 12 hands-on scenarios |
| [File Catalog — Interactive](./file-catalog) | Browse and filter all 23 Claude Code file types with token costs, load timing, and usage examples |
| [Context & Cost Efficiency Guide](./claude-code-efficiency-guide) | Visual interactive guide to token efficiency, compaction strategies, caching, and effort levels |
| [Context Engineering for Claude Code](./context-engineering-ce) | Four CE strategies, token window simulator, session rhythm, command reference, full CE checklist |
| [/advisor Command Diagram](./advisor-diagram) | Interactive flow diagram of the dual-model /advisor command — Sonnet executor + Opus advisor |
| [Hooks System — Flow Diagram](./hooks-diagram) | Interactive session lifecycle flow, all 30+ hook events, five handler types, 6 copy-paste automation patterns |
| [MCP Architecture — Diagram](./mcp-diagram) | Interactive four-layer architecture, three primitives with examples, transport types, config scopes, 12 official servers |
| [Agent Teams — Architecture Diagram](./agent-teams-diagram) | Task tool vs Agent Teams comparison, subagent YAML reference, filesystem mailbox, message types, decision guide |
| [CI/CD Pipeline — Diagram](./cicd-diagram) | Full pipeline flow, GitHub Actions workflow examples, Bedrock/Vertex cloud auth, security hardening checklist |
| [Agent SDK — Diagram](./sdk-diagram) | Subprocess architecture, all SDK event types, Python/TypeScript session patterns, parallel workloads |
| [Memory System — Diagram](./memory-diagram) | All 7 memory types, scope, load timing, compaction survival, size limits, @import syntax |
| [Plugins — Architecture Diagram](./plugins-diagram) | All 10 plugin component types, environment variables, installation scopes, directory structure |

---

## Training & Research

| Page | What you'll learn |
|------|------------------|
| [Elite Mastery Training Program](./claude-training) | 8-module curriculum: CLI mastery → agent teams → hooks system → MCP → prompt engineering → RAG + enterprise → CI/CD → architecture patterns (.NET/Azure focus) |
| [Compass Research Notes](./compass-research-notes) | Deep research notes on Agent SDK internals, hooks, MCP, session management, CCA-F exam domains |
| [Concept Validation Report](./validation-report) | 270+ claims verified against official documentation through v2.1.126 |

---

## Quick Reference

### Configuration Hierarchy (Highest → Lowest Precedence)

```
Enterprise Managed Settings  (server-managed > MDM > file-based > Windows HKCU registry)
    │  ← cannot be overridden by anything below, including CLI flags
    ▼
CLI flags / environment variables
    │
    ▼
.claude/settings.local.json  (project local — gitignore this)
    │
    ▼
.claude/settings.json        (project — commit to git)
    │
    ▼
~/.claude/settings.json      (user-global)
    │
    ▼
~/.claude/CLAUDE.md          (user-global context)
    │
    ▼
CLAUDE.md (project root) → subdirectory CLAUDE.md files
    │
    ▼
.claude/rules/*.md           (path-scoped rules, conditional loading — v2.1.84+)
    │
    ▼
Skills / Output Styles       (loaded on demand via slash commands or /config)
    │
    ▼
Auto-Memory                  (~/.claude/projects/<hash>/memory/MEMORY.md — per-project)
```

### Key File Types at a Glance

| File | Purpose | Scope | Git? |
|------|---------|-------|------|
| `CLAUDE.md` | Persistent project context | Session-wide | Yes |
| `~/.claude/CLAUDE.md` | User-global defaults | All projects | No |
| `CLAUDE.local.md` | Personal project overrides | This project, local | No (auto-gitignored) |
| `.claude/rules/*.md` | Conditional rules (path-scoped v2.1.84+) | Path/context scoped | Yes |
| `.claude/skills/<name>/SKILL.md` | Auto-invokable reusable capabilities | On-demand | Yes |
| `.claude/agents/<name>.md` | Subagent definitions with YAML frontmatter | On-demand via Task tool | Yes |
| `.claude/commands/<name>.md` | Custom slash commands | On invocation | Yes |
| `.claude/output-styles/<name>.md` | Response format styles (activate via `/config`) | Per-session | Yes |
| `~/.claude/projects/<hash>/memory/MEMORY.md` | Durable auto-memory (≤200 lines / 25KB) | Per-project | No |
| `.mcp.json` | MCP server definitions | Project | Yes |
| `~/.claude/settings.json` | Global preferences | All projects | No |
| `.claude/settings.json` | Project preferences (commit to git) | Project | Yes |
| `.claude/settings.local.json` | Local overrides (gitignore this) | Project | No |

### Essential Slash Commands

| Command | Purpose |
|---------|--------|
| `/clear` | Reset conversation (keep config) |
| `/compact [instructions]` | Summarise conversation to free context |
| `/model` | Switch Claude model mid-session |
| `/plan` | Enter plan-only mode (no file writes) |
| `/memory` | View and edit all memory files |
| `/todos` | View and manage current task list |
| `/usage` | Show token usage and cost for session |
| `/context` | Display token-usage grid |
| `/rewind` | Roll back code changes + conversation |
| `/config` | Tabbed settings UI; activate output styles |
| `/agents` | List/edit subagent definitions |
| `/skills` | Browse and filter installed skills |
| `/permissions` | Manage tool allowlists |
| `/mcp` | Manage MCP server connections |
| `/hooks` | Configure automation hooks |
| `/resume` | Open interactive session picker |
| `/rename [name]` | Name session for retrieval |
| `/doctor` | Health check with auto-repair |
| `/terminal-setup` | Configure scroll, clipboard, iTerm2 |
| `/branch` | Create a git worktree branch |
| `/advisor` | Invoke dual-model advisor (Sonnet + Opus) |
| `/changelog` | Show Claude Code release notes |
| `/debug` | Troubleshoot session issues |
| `/keybindings` | Create/edit keybindings file |
| `/theme` | Browse and apply color themes |
| `/team-onboarding` | Generate teammate ramp-up guide |

### Built-In Tools — What Claude Can Do

| Tool | What it does |
|------|-------------|
| `Read` | Read files, images (PNG/JPG/WebP/GIF), PDFs, Jupyter notebooks |
| `Write` | Write or overwrite entire files |
| `Edit` | Exact-string replacement in existing files |
| `MultiEdit` | Multiple replacements in one file, one atomic operation |
| `Glob` | Fast file pattern matching (src/**/*.ts) using embedded bfs |
| `Grep` | Content search using embedded ugrep; full regex support |
| `LS` | List directory contents |
| `Bash` | Run shell commands, scripts, test runners |
| `Monitor` | Stream output from a background process (v2.1.98+) |
| `WebFetch` | Fetch URL content with AI extraction — markdown output |
| `WebSearch` | Web search with AI-ranked results |
| `TodoWrite` | Structured task tracking — visible in /todos |
| `TodoRead` | Read current task list |
| `Task` | Spawn a subagent for parallel or isolated work |

### Agentic Loop at a Glance

```
Your prompt
    │
    ▼  Claude generates response + optional tool_use blocks
Claude API ────────────────────────────────────────────
    │
    ▼  check stop_reason (never parse text)
stop_reason == "tool_use"?
    │ YES                              │ NO ("end_turn")
    ▼                                  ▼
Execute tools                  Session complete
Append tool_result
Send back to API
    │
    └───────────────────────────────────► loop
```

**Core rule:** always route on `stop_reason`, never on parsed assistant text.

### Models Available (May 2026)

| Model | Alias | Context | Best for | Pricing tier |
|-------|-------|---------|---------|-------------- |
| `claude-opus-4-7` | `opus` | 1M tokens | Complex reasoning, architecture, research | $$$$$ |
| `claude-opus-4-6` | — | 1M tokens | Heavy analysis, long documents | $$$$ |
| `claude-sonnet-4-6` | `sonnet` | 200K tokens | Balanced quality/speed — **default** | $$$ |
| `claude-haiku-4-5` | `haiku` | 200K tokens | Bulk operations, CI/CD, quick edits | $ |

> 1M token context for Opus 4.6 and Sonnet 4.6 is at standard pricing with no surcharge (since March 14, 2026).

### Effort Levels

| Level | Extended Thinking | Best for | Cost impact |
|-------|------------------|---------|------------|
| `low` | None | Simple edits, formatting, docs | Cheapest |
| `normal` | Minimal | Standard feature work | Moderate |
| `high` | Substantial | Complex features, debugging | Higher |
| `xhigh` | Maximum | Architecture, critical debugging | Highest |

---

## Learning Paths

### New to Claude Code

1. [Quick Start](./quick-start) — get running in 20 minutes
2. [CLI Technical Reference](./claude-code-reference) — Sections 1–4
3. [Configuration Guide](./claude-code-config-guide) — understand CLAUDE.md, Rules, Skills
4. [Context, Cost & Efficiency](./claude-code-efficiency-reference) — manage costs from day one
5. [Memory Management](./memory-management) — understand how Claude remembers things

### Intermediate — Automate and Extend

1. [Hooks System](./hooks-deep-dive) — automate formatting, testing, auditing
2. [Slash Commands](./slash-commands-reference) — create custom team commands
3. [MCP Servers](./mcp-servers-guide) — connect Claude to your databases and APIs
4. [Agent Teams](./agent-teams-guide) — multi-agent orchestration
5. [CI/CD Integration](./cicd-integration) — integrate into your pipeline
6. [Agent SDK](./sdk-guide) — drive Claude Code programmatically from Python/TypeScript
7. [Worktrees & Parallel Dev](./worktrees-guide) — multiple simultaneous Claude Code sessions

### Advanced — Security, Plugins & Enterprise

1. [Permissions & Security](./permissions-security) — lock down Claude for your organisation
2. [Plugins](./plugins-guide) — build and distribute extensions
3. [Output Styles](./output-styles-guide) — customise Claude's response format
4. [Models & Pricing](./models-pricing) — deep-dive into model selection and cost control
5. [Elite Training Program](./claude-training) — 8-module curriculum for mastery
6. [Compass Research Notes](./compass-research-notes) — deep dives into internals

### Preparing for CCA-F Exam

1. [Compass Research Notes](./compass-research-notes) — all 5 domains with gap-fill reference
2. [Concept Validation Report](./validation-report) — 270+ claims verified against official docs
3. [Elite Training Program](./claude-training) — structured 8-module curriculum
