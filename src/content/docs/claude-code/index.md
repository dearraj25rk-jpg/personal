---
title: Claude Code
description: Complete technical reference and training for Claude Code — configuration hierarchy, slash commands, tools, hooks, agents, context management, and professional workflows.
sidebar:
  order: 1
---

Claude Code is Anthropic's AI-powered CLI that integrates directly into your development environment. This section covers everything from core architecture and configuration hierarchy through advanced agent orchestration, context efficiency, and CI/CD integration.

## Reference Guides

| Page | What you'll learn |
|---|---|
| [CLI Technical Reference](./claude-code-reference) | Every officially documented feature through v2.1.126 — tools, slash commands, CLI flags, hooks, MCP, plugins, subagents, agent teams, worktrees, remote control, sandbox, permissions, models, pricing, GitHub Actions, and the Agent SDK |
| [CLAUDE.md vs Skills vs Rules](./claude-code-config-guide) | When to use each configuration file, the full precedence hierarchy, and best practices |
| [Every Markdown File — Catalog](./claude-code-all-markdown-files-catalog) | All 23 file types Claude Code recognizes: CLAUDE.md, Rules, Skills, Subagents, Output Styles, Auto-Memory, Plugin components, and more |
| [Context, Cost & Token Efficiency](./claude-code-efficiency-reference) | Auto-compaction, token budgets, caching, effort levels, cost optimization strategies |

## Diagrams & Interactive Tools

| Page | What it covers |
|---|---|
| [Architecture Diagram](./architecture) | Full lifecycle view: session init → tool loop → compaction → shutdown |
| [Precedence Diagram](./precedence) | Visual hierarchy of all configuration layers with override rules |
| [Override Test Lab](./override-test-lab) | Interactive sandbox for testing configuration precedence |
| [File Catalog — Interactive](./file-catalog) | Browse and filter all Claude Code file types with examples |
| [Context & Cost Efficiency Guide](./claude-code-efficiency-guide) | Visual interactive guide to token efficiency and compaction |
| [Context Engineering for Claude Code](./context-engineering-ce) | Comprehensive CE guide — four CE strategies, token simulator, session rhythm, command reference, and full CE checklist |

## Training & Research

| Page | What you'll learn |
|---|---|
| [Elite Mastery Training Program](./claude-training) | 8-module curriculum: CLI mastery → multi-agent systems → enterprise CI/CD (.NET/Azure focus) |
| [Compass Research Notes](./compass-research-notes) | Deep research notes on Agent SDK internals, hooks, MCP, and session management |
| [Concept Validation Report](./validation-report) | Verified accuracy report for all Claude Code concepts against official documentation |

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
.claude/rules/*.md           (path-scoped rules, conditional loading)
    │
    ▼
Skills / Output Styles       (loaded on demand via slash commands or /config)
    │
    ▼
Auto-Memory                  (~/.claude/projects/<hash>/memory/MEMORY.md — per-project)
```

### Key File Types

| File | Purpose | Scope |
|---|---|---|
| `CLAUDE.md` | Persistent project context | Session-wide |
| `~/.claude/CLAUDE.md` | User-global defaults | All projects |
| `.claude/rules/*.md` | Conditional rules (YAML `paths:` glob, v2.1.84+) | Path/context scoped |
| `.claude/skills/<name>/SKILL.md` | Auto-invokable reusable capabilities | On-demand |
| `.claude/agents/<name>.md` | Subagent definitions with YAML frontmatter | On-demand via Task tool |
| `.claude/output-styles/<name>.md` | Response format styles (activate via `/config`) | Per-session |
| `~/.claude/projects/<hash>/memory/MEMORY.md` | Durable auto-memory (≤200 lines / 25KB) | Per-project, machine-local |
| `.mcp.json` | MCP server definitions | Project |
| `~/.claude/settings.json` | Global preferences | All projects |
| `.claude/settings.json` | Project preferences (commit to git) | Project |
| `.claude/settings.local.json` | Local overrides (gitignore this) | Project |

### Essential Slash Commands

| Command | Purpose |
|---|---|
| `/clear` | Reset conversation (keep config) |
| `/compact` | Summarise conversation to free context |
| `/model` | Switch Claude model mid-session |
| `/plan` | Enter plan-only mode (no file writes) |
| `/memory` | View and edit auto-memory entries |
| `/todos` | View and manage current task list |
| `/branch` | Create a worktree branch |
| `/usage` | Show token usage and cost for session (v2.1.118; `/cost` and `/stats` remain as shortcuts) |
| `/config` | Tabbed settings UI; activate output styles here |
| `/agents` | List/edit subagent definitions |
| `/skills` | Browse and filter installed skills |

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
