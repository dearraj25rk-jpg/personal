---
title: Claude Code
description: Complete technical reference and training for Claude Code — quick start, configuration hierarchy, slash commands, tools, hooks, MCP, agents, context management, CI/CD, permissions, and professional workflows. Claude Code v2.1.126 (May 2026).
sidebar:
  order: 1
lastUpdated: 2026-05-06
---

Claude Code is Anthropic's agentic terminal-based coding assistant. It lives in your terminal, understands your entire codebase, and executes multi-step engineering tasks autonomously — reading files, running commands, editing code, managing Git, and verifying its own work in a closed loop.

**Latest stable:** v2.1.126 (May 6, 2026) · **Package:** `@anthropic-ai/claude-code` (392+ published versions)

---

## What's New (v2.1.108–v2.1.126)

| Version | Feature | What changed |
|---------|---------|-------------|
| v2.1.126 | Latest stable (May 2026) | See [CLI Reference](./claude-code-reference) for full changelog |
| v2.1.122 | Bedrock service tiers | `default`, `flex`, `priority` tier selection via `CLAUDE_CODE_BEDROCK_SERVICE_TIER` |
| v2.1.121 | Vertex Workload Identity Federation | WIF support for GCP auth — no service account key required |
| v2.1.120 | `${CLAUDE_EFFORT}` in skills | Skills can read and respond to session effort level |
| v2.1.119 | `/config` persistence | Settings saved to `~/.claude/settings.json` via the UI |
| v2.1.118 | `DISABLE_UPDATES` + `mcp_tool` hooks | Block all updates; hooks targeting specific MCP tools |
| v2.1.117 | Opus 4.7 default `xhigh` effort | Default effort elevated; 1M context window fixes |
| v2.1.116 | `/terminal-setup` command | Configure scroll sensitivity, clipboard, iTerm2 |
| v2.1.113 | Native binary (no Node.js) | `Glob`/`Grep` replaced with embedded `bfs`/`ugrep` — faster |
| v2.1.108 | Cache TTL fix | 1-hour cache TTL now works for `DISABLE_TELEMETRY` users |
| v2.1.105 | `/doctor` auto-fix | Health check with `f`-key auto-repair |
| v2.1.104 | `/team-onboarding` | Generate teammate ramp-up guide |
| v2.1.98  | Monitor tool | Stream background process output |
| v2.1.92  | `--bare` mode | CI-optimised mode (14% faster, skips non-essential) |
| v2.1.89  | Compaction circuit breaker | Prevents thrash loop in auto-compaction |
| v2.1.84  | Rules `paths:` scoping | Rules load conditionally by file glob pattern |
| v2.1.63  | `http` hook handler | POST event payloads to a webhook URL |
| v2.1.32  | Agent Teams (Research Preview) | Persistent peer-to-peer multi-agent sessions |

---

## Getting Started

**New to Claude Code?** Start here → [Quick Start Guide](./quick-start)

---

## Reference Guides

| Page | What you'll learn |
|------|------------------|
| [Quick Start](./quick-start) | Install, authenticate, first session, key concepts, CLAUDE.md setup, cost tips |
| [CLI Technical Reference](./claude-code-reference) | Every documented feature through v2.1.126 — tools, slash commands, CLI flags, hooks, MCP, plugins, subagents, agent teams, worktrees, remote control, sandbox, permissions, models, pricing, GitHub Actions, Agent SDK, version timeline |
| [CLAUDE.md vs Skills vs Rules](./claude-code-config-guide) | Decision framework for all configuration files, precedence hierarchy, token budgets, best practices |
| [Every Markdown File — Catalog](./claude-code-all-markdown-files-catalog) | All 23 file types Claude Code recognises: CLAUDE.md, Rules, Skills, Subagents, Output Styles, Auto-Memory, Plugin components, and more |
| [Context, Cost & Token Efficiency](./claude-code-efficiency-reference) | Auto-compaction, token budgets, caching economics, effort levels, model selection, cost optimisation |

---

## Topic Guides

| Page | What you'll learn |
|------|------------------|
| [Hooks System — Deep Dive](./hooks-deep-dive) | All 30+ hook events, five handler types (command, prompt, agent, http, mcp\_tool), exit codes, matchers, 9 practical patterns |
| [MCP Servers — Architecture & Development](./mcp-servers-guide) | MCP architecture, transport types, three primitives, four configuration scopes, building servers in TypeScript/Python/.NET, official servers, security |
| [Agent Teams & Subagents](./agent-teams-guide) | Task tool vs Agent Teams, subagent YAML frontmatter, agent memory, team protocols, filesystem mailbox, orchestration patterns |
| [CI/CD Integration](./cicd-integration) | GitHub Actions (`anthropics/claude-code-action@v1`), GitLab CI, non-interactive flags, Bedrock/Vertex in CI, security hardening, cost optimisation |
| [Permissions & Security](./permissions-security) | Permission modes, tool allowlists/blocklists, sandbox architecture, enterprise managed settings, audit logging, trust model |

---

## Diagrams & Interactive Tools

| Page | What it covers |
|------|---------------|
| [Architecture Diagram](./architecture) | Full lifecycle view: session init → tool loop → compaction → shutdown. All 23 markdown file types. |
| [Precedence Diagram](./precedence) | Visual hierarchy of all configuration layers with override rules |
| [Override Test Lab](./override-test-lab) | Interactive sandbox for testing configuration precedence across 12 scenarios |
| [File Catalog — Interactive](./file-catalog) | Browse and filter all Claude Code file types with token costs and usage examples |
| [Context & Cost Efficiency Guide](./claude-code-efficiency-guide) | Visual interactive guide to token efficiency, compaction, and caching |
| [Context Engineering for Claude Code](./context-engineering-ce) | Four CE strategies, token window simulator, session rhythm, command reference, full CE checklist |
| [/advisor Command Diagram](./advisor-diagram) | Interactive flow diagram of the dual-model /advisor command |

---

## Training & Research

| Page | What you'll learn |
|------|------------------|
| [Elite Mastery Training Program](./claude-training) | 8-module curriculum: CLI mastery → agent teams → hooks system → MCP → prompt engineering → RAG + enterprise → CI/CD → architecture patterns (.NET/Azure focus) |
| [Compass Research Notes](./compass-research-notes) | Deep research notes on Agent SDK internals, hooks, MCP, session management, CCA-F exam domains |
| [Concept Validation Report](./validation-report) | 132+ claims verified against official documentation through v2.1.126 |

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

### Key File Types

| File | Purpose | Scope |
|------|---------|-------|
| `CLAUDE.md` | Persistent project context | Session-wide |
| `~/.claude/CLAUDE.md` | User-global defaults | All projects |
| `.claude/rules/*.md` | Conditional rules (YAML `paths:` glob, v2.1.84+) | Path/context scoped |
| `.claude/skills/<name>/SKILL.md` | Auto-invokable reusable capabilities | On-demand |
| `.claude/agents/<name>.md` | Subagent definitions with YAML frontmatter | On-demand via Task tool |
| `.claude/output-styles/<name>.md` | Response format styles (activate via `/config`) | Per-session |
| `~/.claude/projects/<hash>/memory/MEMORY.md` | Durable auto-memory (≤200 lines / 25KB) | Per-project |
| `.mcp.json` | MCP server definitions | Project |
| `~/.claude/settings.json` | Global preferences | All projects |
| `.claude/settings.json` | Project preferences (commit to git) | Project |
| `.claude/settings.local.json` | Local overrides (gitignore this) | Project |

### Essential Slash Commands

| Command | Purpose |
|---------|---------|
| `/clear` | Reset conversation (keep config) |
| `/compact [instructions]` | Summarise conversation to free context |
| `/model` | Switch Claude model mid-session |
| `/plan` | Enter plan-only mode (no file writes) |
| `/memory` | View and edit auto-memory entries |
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
| `/changelog` | Show Claude Code release notes |
| `/debug` | Troubleshoot session issues |
| `/keybindings` | Create/edit keybindings file |
| `/team-onboarding` | Generate teammate ramp-up guide |

### Agentic Loop at a Glance

```
Your prompt
    │
    ▼  Claude generates response + optional tool_use blocks
Claude API ──────────────────────────────────────────────
    │
    ▼  check stop_reason (never parse text)
stop_reason == "tool_use"?
    │ YES                          │ NO ("end_turn")
    ▼                              ▼
Execute tools              Session complete
Append tool_result
Send back to API
    │
    └──────────────────────────────► loop
```

**Core rule:** always route on `stop_reason`, never on parsed assistant text.

### Models Available (May 2026)

| Model | Context | Best for | Relative cost |
|-------|---------|---------|--------------|
| `claude-opus-4-7` | 1M tokens | Complex reasoning, architecture, research | $$$$$ |
| `claude-opus-4-6` | 1M tokens | Heavy analysis, long documents | $$$$ |
| `claude-sonnet-4-6` | 200K tokens | Balanced quality/speed — default | $$$ |
| `claude-haiku-4-5` | 200K tokens | Bulk operations, CI/CD, quick edits | $ |

---

## Learning Paths

### New to Claude Code

1. [Quick Start](./quick-start) — get running in 20 minutes
2. [CLI Technical Reference](./claude-code-reference) — Sections 1–4
3. [CLAUDE.md vs Skills vs Rules](./claude-code-config-guide) — understand configuration
4. [Context, Cost & Efficiency](./claude-code-efficiency-reference) — manage costs from day one

### Intermediate — Automate and Extend

1. [Hooks System](./hooks-deep-dive) — automate formatting, testing, auditing
2. [MCP Servers](./mcp-servers-guide) — connect Claude to your databases and APIs
3. [Agent Teams](./agent-teams-guide) — multi-agent orchestration
4. [CI/CD Integration](./cicd-integration) — integrate into your pipeline

### Advanced — Security and Enterprise

1. [Permissions & Security](./permissions-security) — lock down Claude for your organisation
2. [Elite Training Program](./claude-training) — 8-module curriculum for mastery
3. [Compass Research Notes](./compass-research-notes) — deep dives into internals

### Preparing for CCA-F Exam

1. [Compass Research Notes](./compass-research-notes) — all 5 domains with gap-fill reference
2. [Concept Validation Report](./validation-report) — 132+ claims verified against official docs
3. [Elite Training Program](./claude-training) — structured 8-module curriculum
