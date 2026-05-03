---
title: "What's New — May 2026"
description: "Latest Claude Code features and improvements as of May 2026 — Opus 4.7 xhigh, /ultrareview, /tui fullscreen, OAuth improvements, PowerShell detection, and more."
sidebar:
  order: 15
---

> **Current as of May 3, 2026.** Claude Code version 2.1.126+.

## Summary of May 2026 Highlights

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   CLAUDE CODE — MAY 2026 HIGHLIGHTS                     │
│                                                                         │
│  🔴 Opus 4.7 + xhigh effort tier  →  harder tasks, deeper reasoning    │
│  🔍 /ultrareview               →  multi-agent parallel code review      │
│  🖥️  /tui fullscreen mode       →  immersive terminal UI with search    │
│  🔑 OAuth terminal paste         →  WSL2 / SSH / container support      │
│  ⚡ Windows PowerShell default   →  auto-detected, preferred on Windows │
│  🔵 Spinner turns red on stall   →  instant visual permission feedback  │
│  🗑️  claude project purge        →  clean up project state easily       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Opus 4.7 with xhigh Effort Tier

Claude Code now supports **Opus 4.7** with a new `xhigh` effort level — tunable for the most demanding coding tasks that require maximum reasoning depth.

```bash
# Use Opus 4.7 for a session
claude --model claude-opus-4-7

# Set effort level to xhigh for deep refactors
claude --effort xhigh "Refactor the authentication system to use JWT with refresh tokens"
```

**Effort levels:**
| Level | Use case | Cost | Speed |
|---|---|---|---|
| `low` | Quick lookups, simple edits | Lowest | Fastest |
| `medium` | Standard development tasks | Normal | Normal |
| `high` | Complex refactors, architecture | Higher | Slower |
| `xhigh` | Maximum reasoning depth (Opus 4.7) | Highest | Slowest |

---

## /ultrareview — Multi-Agent Parallel Code Review

`/ultrareview` launches a team of parallel review agents to evaluate your branch or PR from multiple angles simultaneously.

```
/ultrareview [branch or PR number]

Example:
/ultrareview feature/auth-refactor
/ultrareview #142
```

```
                    /ultrareview FLOW
                    ──────────────────────────────────────────

  Your PR / Branch
        │
        ▼
  ┌─────────────────────────────────────────────────────────┐
  │              ORCHESTRATOR AGENT                         │
  │  1. Fetch diff                                          │
  │  2. Split into review domains                           │
  │  3. Spawn parallel review agents                        │
  └─────────────────────────────────────────────────────────┘
        │           │           │           │
        ▼           ▼           ▼           ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
  │ Security │ │  Logic   │ │  Style & │ │  Tests & │
  │  Review  │ │  Review  │ │   Docs   │ │ Coverage │
  │  Agent   │ │  Agent   │ │  Agent   │ │  Agent   │
  └──────────┘ └──────────┘ └──────────┘ └──────────┘
        │           │           │           │
        └───────────┴───────────┴───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   SYNTHESIS AGENT     │
              │  Merges findings,     │
              │  deduplicates,        │
              │  prioritizes issues   │
              └───────────────────────┘
                          │
                          ▼
              Unified review report
              with severity labels
```

---

## /tui — Fullscreen Terminal UI

`/tui` enters an immersive fullscreen mode with enhanced navigation:

```
/tui
```

Features in TUI mode:
- **Transcript search:** `Ctrl+F` to search conversation history
- **Auto-scroll toggle:** `S` to pause/resume auto-scrolling
- **Focus mode:** Distraction-free coding with full viewport
- **Session picker:** Browse and resume sessions visually

```
┌──────────────────────────────────────────────────────────────────┐
│ Claude Code — TUI Mode                          [Q:quit] [S:scroll] │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Session: auth-refactor-may-26          Model: claude-sonnet-4-5  │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐  │
│ │  > Refactor the login endpoint to use JWT                   │  │
│ │                                                             │  │
│ │  I'll refactor the login endpoint. Here's my plan:          │  │
│ │  1. Add JWT library (PyJWT or python-jose)                  │  │
│ │  2. Create token generation function                        │  │
│ │  3. Update /login to return access + refresh tokens         │  │
│ │  4. Add token verification middleware                       │  │
│ │  5. Update protected routes                                 │  │
│ │                                                             │  │
│ └─────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  [Ctrl+F: search] [Esc: exit TUI] [/: command]                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## OAuth Terminal Paste (WSL2 / SSH / Container Support)

`claude auth login` now accepts OAuth codes pasted directly into the terminal when browser redirects aren't possible.

```bash
# Before: browser redirect required (broken in WSL2/SSH)
claude auth login
# → Opens browser, redirect fails in headless environments

# After: paste the code if redirect fails
claude auth login
# → "Browser didn't open? Paste your OAuth code here: ________"
# → Paste code from browser on your local machine
```

**Affected environments:** WSL2, SSH sessions, Docker containers, CI environments.

---

## Windows PowerShell Auto-Detection

Claude Code now automatically detects and prefers **PowerShell** (5.1 or 7+) over `cmd.exe` on Windows hosts.

```
Detection flow:
  Is PowerShell 7+ available?  → Use pwsh (PowerShell 7)
  Is PowerShell 5.1 available? → Use powershell
  Otherwise                    → Fall back to cmd.exe
```

Benefits:
- Better script execution, pipelines, and error handling
- Consistent behavior with modern Windows tooling
- PowerShell 7 preferred for cross-platform script compatibility

---

## Permission Stall Visual Feedback

The spinner in **auto mode** now turns **red** when a permission check stalls, giving immediate visual feedback:

```
⣿ Running...        ← normal (spinner is white/grey)
⣿ Running...        ← stalled on permission (spinner turns RED)
  ↑
  "Hey, I need to write to src/config.py — approve?"
```

This prevents silent waiting — you'll immediately know when Claude is blocked waiting for your input.

---

## `claude project purge` Command

New CLI command to delete all Claude Code state for a project:

```bash
# Preview what would be deleted (dry run)
claude project purge --dry-run

# Delete with confirmation prompt
claude project purge

# Delete without confirmation (CI/automation)
claude project purge --yes

# Delete a specific project by path
claude project purge /path/to/project

# Delete all projects at once
claude project purge --all
```

Deletes: transcripts, task history, file edit history, memory entries, config entry.

---

## /model Now Lists Gateway Models

If you're using an Anthropic-compatible API gateway, the `/model` command now queries the gateway's `/v1/models` endpoint and lists available models dynamically:

```
/model
→ [1] claude-opus-4-7
   [2] claude-sonnet-4-5
   [3] claude-haiku-4-5
   [4] my-company/internal-claude-proxy   ← gateway-specific model
   [5] my-company/fine-tuned-coder        ← custom fine-tune via gateway
```
