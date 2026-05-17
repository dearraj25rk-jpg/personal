---
title: Claude Code CLI — Technical Reference
description: >
  Authoritative, comprehensive reference covering every officially documented feature of
  Claude Code from its initial launch (February 2025) through v2.1.126 (May 1, 2026).
  Covers all built-in tools, slash commands, CLI flags, configuration, CLAUDE.md, Skills,
  Hooks, MCP, Plugins, Subagents, Agent Teams, Git Worktrees, Remote Control, Cloud
  Sessions, Sandbox security, Permission system, Models, Pricing, OpenTelemetry, IDE
  integrations, GitHub Actions, the Agent SDK, and the full version release timeline.
sidebar:
  order: 1
  label: CLI Reference
head:
  - tag: meta
    attrs:
      name: keywords
      content: >
        claude code, claude code cli, anthropic, agentic coding, mcp, hooks, skills,
        plugins, subagents, agent teams, worktrees, remote control, sandbox, permissions
tableOfContents:
  minHeadingLevel: 2
  maxHeadingLevel: 3
lastUpdated: 2026-05-17
---

> **Document scope:** All officially documented Claude Code features from February 2025 through **v2.1.126 (May 6, 2026)**. Sources: `code.claude.com/docs`, `github.com/anthropics/claude-code` (CHANGELOG.md), official Anthropic news posts, and the Agent SDK repos. Every version number cited maps to a real entry in the public CHANGELOG. Where official documentation is sparse, that is explicitly flagged.

---

## Quick Navigation

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CLAUDE CODE REFERENCE — QUICK NAVIGATION                               │
├─────────────────────────────────────────────────────────────────────────┤
│  CORE FEATURES                                                          │
│  §1  Overview & Product History    §2  Installation & Setup             │
│  §3  Agentic Loop Architecture     §4  Built-In Tools Reference         │
│  §5  Slash Commands Reference      §6  CLI Flags Reference              │
│                                                                         │
│  CONFIGURATION                                                          │
│  §7  Configuration System          §8  CLAUDE.md — Project Memory       │
│  §9  Skills                        §10 Hooks — Lifecycle Reference       │
│  §11 MCP — Model Context Protocol  §12 Plugins System                   │
│                                                                         │
│  AGENTIC FEATURES                                                       │
│  §13 Subagents                     §14 Agent Teams (Experimental)       │
│  §15 Git Worktrees                 §16 Remote Control                   │
│  §17 Cloud Sessions (Web)          §18 Sandbox & Security Model         │
│                                                                         │
│  MODELS & INFRASTRUCTURE                                                │
│  §19 Permission System             §20 Models & Configuration           │
│  §21 Context & Memory Management   §22 IDE Integrations                 │
│  §23 GitHub & CI/CD Integration    §24 Prompt Caching Architecture      │
│                                                                         │
│  OBSERVABILITY & ADVANCED                                               │
│  §25 Pricing & Plans               §26 OpenTelemetry & Observability    │
│  §27 Voice Mode                    §28 Multi-Directory Workspaces        │
│  §29 Keyboard Shortcuts            §30 Plan Mode                        │
│                                                                         │
│  REFERENCE                                                              │
│  §31 Version Release Timeline      §32 Notable Bug Fixes                │
│  §33 Best Practices                §34 Agent SDK                        │
│  §35 Documentation Gaps            §36 Troubleshooting Reference (NEW)  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Feature Architecture Overview

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │               CLAUDE CODE — ALL MAJOR FEATURE CATEGORIES            │
  │                         v2.1.126 (May 2026)                         │
  └─────────────────────────────────────────────────────────────────────┘

  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐
  │   INSTALLATION   │  │  AUTHENTICATION  │  │   DEPLOYMENT SURFACE │
  │                  │  │                  │  │                      │
  │  Native binary   │  │  Browser OAuth   │  │  Terminal CLI        │
  │  Homebrew cask   │  │  API key         │  │  VS Code extension   │
  │  WinGet / apt    │  │  AWS Bedrock     │  │  JetBrains plugin    │
  │  npm (legacy)    │  │  Google Vertex   │  │  Claude Desktop      │
  │                  │  │  Azure Foundry   │  │  claude.ai/code (web)│
  └──────────────────┘  └──────────────────┘  │  iOS / Android       │
                                               │  Slack / Chrome      │
                                               └──────────────────────┘
  ┌──────────────────────────────────────────────────────────────────┐
  │                     CORE AGENTIC ENGINE                          │
  │                                                                  │
  │  3-Phase Loop: Gather Context → Plan & Act → Verify             │
  │  Context: 200K default / 1M GA (Sonnet 4.6, Opus 4.6/4.7)       │
  │  Compaction: /compact · auto-compact at ~92% capacity            │
  │  Caching: 5-min TTL default / 1-hour for Pro/Max subscribers    │
  └──────────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────┐
  │  BUILT-IN  │ │  SLASH     │ │  CLI FLAGS │ │  CONFIGURATION │
  │  TOOLS     │ │  COMMANDS  │ │            │ │  SYSTEM        │
  │            │ │            │ │  --print   │ │                │
  │  Read      │ │  /compact  │ │  --effort  │ │  settings.json │
  │  Write     │ │  /plan     │ │  --max-    │ │  175+ env vars │
  │  Edit      │ │  /review   │ │  budget    │ │  5-scope merge │
  │  Bash      │ │  /model    │ │  --agent   │ │  Managed/MDM   │
  │  Grep      │ │  60+ total │ │  60+ total │ │  enterprise    │
  │  Glob      │ │            │ │            │ │                │
  │  Task      │ └────────────┘ └────────────┘ └────────────────┘
  │  WebFetch  │
  │  + 20 more │
  └────────────┘
         │
         ▼
  ┌────────────────────────────────────────────────────────────────┐
  │                  EXTENSIBILITY LAYER                            │
  │                                                                │
  │  CLAUDE.md    Skills      Hooks       MCP Servers   Plugins    │
  │  (6-level     (auto-      (30+        (stdio/HTTP/  (bundles   │
  │  hierarchy)   invoke)     events)     SSE deprc)    of above) │
  └────────────────────────────────────────────────────────────────┘
         │
         ▼
  ┌────────────────────────────────────────────────────────────────┐
  │                   AGENTIC WORKFLOWS                             │
  │                                                                │
  │  Subagents     Agent Teams    Git Worktrees    Remote Control  │
  │  (Task tool,   (experimental, (parallel        (bridge local  │
  │  isolated      peer-to-peer   branches,        CLI to web/    │
  │  context)      filesystem     isolation:       mobile)        │
  │                mailbox)       worktree)                       │
  └────────────────────────────────────────────────────────────────┘
         │
         ▼
  ┌────────────────────────────────────────────────────────────────┐
  │               MODELS & INTELLIGENCE                             │
  │                                                                │
  │  claude-opus-4-7    (1M ctx, xhigh effort)                    │
  │  claude-opus-4-6    (1M ctx, flagship quality)                │
  │  claude-sonnet-4-6  (1M ctx, default for Pro/Max)             │
  │  claude-haiku-4-5   (200K, fast/cheap routing)                │
  │                                                                │
  │  Advisor Tool: Executor + Advisor pairing (experimental)      │
  │  Effort levels: low / medium / high / xhigh / max / auto      │
  └────────────────────────────────────────────────────────────────┘
         │
         ▼
  ┌────────────────────────────────────────────────────────────────┐
  │              SECURITY & OBSERVABILITY                           │
  │                                                                │
  │  Sandbox: Apple Seatbelt (macOS) / bubblewrap (Linux)         │
  │  Permissions: 5 modes · allow/deny/ask rules · enterprise mgd │
  │  OpenTelemetry: spans, metrics, traces, full-body logging      │
  │  CI/CD: GitHub Action v1 · GitLab · Bitbucket headless        │
  └────────────────────────────────────────────────────────────────┘
```

---

## 1. Overview & Product History

**Claude Code** is Anthropic's agentic terminal-based coding assistant. It lives in your terminal, understands your codebase as a whole, and helps you ship code faster by executing routine tasks, explaining complex code, handling Git workflows, and running multi-step engineering tasks autonomously — all driven by natural-language commands.

Unlike inline IDE copilots that only suggest snippets, Claude Code can read files, run shell commands, edit code, run tests, fix failures, open PRs, and verify its own work in a closed loop. Anthropic's official one-liner: *"Claude Code is an agentic coding tool that reads your codebase, edits files, runs commands, and integrates with your development tools."*

### 1.1 Release Timeline

Claude Code launched in **February 2025** as a limited research preview alongside Claude 3.7 Sonnet, offering core read/write/edit/bash capabilities. It reached **GA in May 2025** with Claude 4. By November 2025 it had crossed $1B annualised revenue. As of **May 1, 2026** the latest stable version is **v2.1.126**, and the npm package `@anthropic-ai/claude-code` shows **392+ published versions** across the v0/v1/v2 series.

| Series | Period | Key Developments |
|--------|--------|-----------------|
| v0.2.x | Feb–Apr 2025 | Research preview; core tool loop; `/init`, `/clear`, `/compact` |
| v1.0.x | May–Sep 2025 | GA; permission system; CLAUDE.md; MCP; hooks; subagents; Bedrock/Vertex; GitHub Action |
| v2.0.x | Sep–Nov 2025 | Major rewrite; native VS Code extension; checkpoint system (`/rewind`); background tasks; Sonnet 4.5 default; Agent SDK renamed |
| v2.1.x | Dec 2025–present | Plugin system; Agent Teams; Remote Control; worktrees; cloud sessions; 1M context GA; sandbox hardening; Opus 4.7; v2.1.126 (May 1, 2026) |

### 1.2 Deployment Surfaces

All surfaces share the same underlying engine and load `CLAUDE.md`, skills, agents, MCP servers, hooks, and plugins from `~/.claude/`.

| Surface | Description |
|---------|-------------|
| Terminal CLI | The canonical experience. macOS / Linux / Windows, native binary or npm. |
| VS Code extension | Inline panel, native diff, terminal handoff, voice dictation. Also works in Cursor and Windsurf. |
| JetBrains plugin | IntelliJ IDEA, PyCharm, WebStorm, GoLand, RubyMine, PHPStorm, CLion, Rider, AppCode. |
| Claude Desktop | macOS / Windows desktop app; `/desktop` slash command; **Computer Use** (control mouse, keyboard, screen — research preview, Week 17 of 2026). |
| claude.ai/code (Web) | Cloud sandboxed sessions, GitHub repo linking, mobile-friendly. |
| iOS / Android apps | Mobile via **Remote Control** to a local CLI session, or via cloud sessions. |
| Slack | Direct @claude integration in channels. |
| Chrome extension (beta) | Browser-side hooks for `/code` and shared sessions. |
| GitHub/GitLab Actions | `anthropics/claude-code-action` CI/CD integration. |

---

## 2. Installation & Setup

### 2.1 Installation Methods

**macOS / Linux / WSL2 (recommended — native binary):**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows PowerShell (native binary):**
```powershell
irm https://claude.ai/install.ps1 | iex
```

**Windows CMD:**
```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

**Homebrew (macOS / Linux):**
```bash
brew install --cask claude-code          # stable channel
brew install --cask claude-code@latest   # latest channel
```

**WinGet:**
```powershell
winget install Anthropic.ClaudeCode
```

**Linux package managers:**
```bash
# Debian / Ubuntu
apt install claude-code

# Fedora / RHEL
dnf install claude-code

# Alpine
apk add claude-code
```

**npm (deprecated — use native installers):**
```bash
npm install -g @anthropic-ai/claude-code
```

> **Note:** The npm path is deprecated but remains functional. As of **v2.1.113**, the CLI spawns a per-platform native binary via an optional dependency rather than running bundled JavaScript, removing the Node.js requirement for native installs. On macOS/Linux native builds (v2.1.117), `Glob` and `Grep` were replaced with embedded `bfs` and `ugrep` invoked via Bash.

### 2.2 Authentication Methods

```bash
# 1) Browser OAuth — Pro / Max / Team / Enterprise subscribers
claude auth login        # opens browser
claude --console         # authenticate via Anthropic Console API key (v2.1.79+)

# 2) Anthropic API key — pay-as-you-go
export ANTHROPIC_API_KEY="sk-ant-..."

# 3) Custom gateway / third-party Anthropic-compatible endpoint
export ANTHROPIC_BASE_URL="https://api.example.com/anthropic"
export ANTHROPIC_AUTH_TOKEN="..."
```

### 2.3 Third-Party Platforms

```bash
# AWS Bedrock
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
# Optional: gateway mode, custom endpoint, Mantle
export CLAUDE_CODE_SKIP_BEDROCK_AUTH=1        # gateway mode
export ANTHROPIC_BEDROCK_BASE_URL="..."
export CLAUDE_CODE_USE_MANTLE=1               # Bedrock powered by Mantle (v2.1.94)
export ANTHROPIC_BEDROCK_SERVICE_TIER="default|flex|priority"  # v2.1.122

# Google Vertex AI
export CLAUDE_CODE_USE_VERTEX=1
export ANTHROPIC_VERTEX_PROJECT_ID=my-project
export CLOUD_ML_REGION=us-east5              # or "global"
# Optional: Workload Identity Federation (v2.1.121)
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/wif-config.json

# Microsoft Azure AI Foundry
export CLAUDE_CODE_USE_FOUNDRY=1
export ANTHROPIC_FOUNDRY_API_KEY="..."
export ANTHROPIC_FOUNDRY_BASE_URL="..."
export ANTHROPIC_FOUNDRY_RESOURCE="..."

# Third-party gateway compatibility
export CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1   # strips beta headers
```

Interactive setup wizards are available: `/setup-bedrock` (v2.1.92) and `/setup-vertex` (v2.1.98) offer guided configuration with model pinning and 1M context options. The Bedrock wizard is also reachable from the login screen → "3rd-party platform".

### 2.4 Post-Install Commands

```bash
/doctor            # health check; press `f` to have Claude auto-fix issues (v2.1.105+)
/terminal-setup    # configure scroll sensitivity, clipboard, iTerm2 (v2.1.116+)
/login             # authenticate
/logout            # revoke session
/config            # tabbed settings UI; persists to ~/.claude/settings.json (v2.1.119+)
```

### 2.5 Version Management

```bash
claude --version
claude install stable    # pin to stable channel
claude install latest    # pin to latest channel
claude update            # manual update (blocked by DISABLE_UPDATES)
```

`DISABLE_AUTOUPDATER=1` blocks background auto-updates only. `DISABLE_UPDATES=1` (v2.1.118) blocks **all** update paths including manual `claude update`. Stable Homebrew cask is typically about one week behind; the `latest` cask receives versions immediately.

---

## 3. Core Agentic Loop Architecture

### 3.1 The Three-Phase Loop

Claude Code operates as a self-directed agent across three phases:

1. **Gather Context** — read files, run `git status`, search with `grep`/`glob`, fetch URLs, query MCP servers, examine test output.
2. **Plan & Act** — edit code, run shell commands, write files, run tests, open PRs, invoke subagents.
3. **Verify Results** — re-run tests, re-read modified files, check diagnostics, iterate until the task is complete.

The model self-drives the loop turn by turn. You control it with prompts, permissions, hooks, and stop conditions (`--max-turns`, `--max-budget-usd`).

### 3.1.1 Agentic Loop — Visual Flow

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     CLAUDE CODE AGENTIC LOOP                   │
  └─────────────────────────────────────────────────────────────────┘

  Your Prompt ──────────────────────────────────────────────────────►
                                                                    │
  ┌─────────────────────────────────────────────────────────────────▼──────┐
  │ PHASE 1: GATHER CONTEXT                                                 │
  │  Read files · Run git status · Search with Glob/Grep                    │
  │  Fetch URLs · Query MCP servers · Read test output                      │
  └────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ PHASE 2: PLAN & ACT                                                      │
  │  Edit code · Run shell commands · Write files · Run tests                │
  │  Open PRs · Invoke subagents · Commit changes                            │
  └─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
  ┌─────────────────────────────────────────────────────────────────────────┐
  │ PHASE 3: VERIFY RESULTS                                                  │
  │  Re-run tests · Re-read modified files · Check diagnostics               │
  │  ──► If issues found: loop back to Phase 2                               │
  │  ──► If complete: return result to user                                  │
  └─────────────────────────────────────────────────────────────────────────┘

  Control Mechanisms:
  --max-turns N          Stop after N agentic turns
  --max-budget-usd N     Stop when cost exceeds $N
  Hook: Stop             Fires when Claude returns end_turn
  Hook: PreToolUse       Block or modify any tool before execution
```

### 3.2 Context Window

The default context window is **200K tokens**. **1M tokens** is GA (no beta header required) for `claude-sonnet-4-6`, `claude-opus-4-6`, and `claude-opus-4-7` on Pro/Max/Team/Enterprise plans. Disable the 1M window with `CLAUDE_CODE_DISABLE_1M_CONTEXT=true`.

v2.1.117 fixed Opus 4.7 sessions that were computing context usage against 200K instead of the native 1M, causing premature autocompact.

### 3.2.1 Context Window Composition

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │                   200K TOKEN CONTEXT WINDOW                         │
  ├──────────────────────────────────────────────────────────────────────┤
  │  RESERVED (non-negotiable)                                           │
  │  ├── Response buffer             ~40-45K tokens                      │
  │  ├── Built-in tools schema       ~5-8K tokens                        │
  │  └── System prompt               ~5-10K tokens                       │
  ├──────────────────────────────────────────────────────────────────────┤
  │  CONFIGURABLE OVERHEAD                                               │
  │  ├── CLAUDE.md (project)         up to 200 lines ≈ 3-8K             │
  │  ├── Rules (path-scoped)         per-rule ≈ 0.5-2K each             │
  │  ├── MCP tools (if loaded)       up to 20K tokens                    │
  │  └── Auto-memory (MEMORY.md)     up to 25KB ≈ 8-10K                 │
  ├──────────────────────────────────────────────────────────────────────┤
  │  CONVERSATION HISTORY (grows per turn)                               │
  │  ├── Your prompts                                                    │
  │  ├── Claude's responses                                              │
  │  └── Tool results (files read, commands run, etc.)                   │
  ├──────────────────────────────────────────────────────────────────────┤
  │  EXTENDED: 1M TOKENS (GA for Pro/Max/Team/Enterprise)                │
  │  Enable: default for supported models                                │
  │  Disable: CLAUDE_CODE_DISABLE_1M_CONTEXT=true                        │
  └──────────────────────────────────────────────────────────────────────┘
```

### 3.3 Context Compaction

Compaction creates a new fork of the conversation that inherits the same prompt-cache prefix — so KV cache reuse continues even after compaction.

```bash
/compact [optional steering instructions]    # manual compaction
```

Auto-compact triggers near a configurable threshold (default ≈ 92%; overridable with `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`). v2.1.89 added an autocompact thrash-loop guard: if context refills to the limit immediately after compacting three times in a row, the session stops with an actionable error message.

### 3.4 Prompt Caching

Claude Code aggressively caches the stable prefix (system prompt, tool definitions, CLAUDE.md, recent assistant turns) for 70–80% cost reduction on repeated content.

```bash
ENABLE_PROMPT_CACHING_1H=1      # 1-hour TTL on API/Bedrock/Vertex/Foundry (v2.1.108)
FORCE_PROMPT_CACHING_5M=1       # force 5-minute TTL
DISABLE_PROMPT_CACHING=1        # disable entirely (startup warning shown)
```

The default TTL is 5 minutes; subscribers default to **1 hour**. v2.1.108 fixed a bug where subscribers who set `DISABLE_TELEMETRY` were incorrectly falling back to the 5-minute TTL. The older `ENABLE_PROMPT_CACHING_1H_BEDROCK` env var is deprecated in favour of the unified `ENABLE_PROMPT_CACHING_1H`.

### 3.5 Minimal & Bare Modes

```bash
CLAUDE_CODE_SIMPLE=1 claude    # only Bash, file-read, file-edit tools; minimal system prompt
claude --bare                  # skip hooks, plugins, auto-memory, CLAUDE.md, MCP auto-discovery
```

### 3.6 Adaptive Reasoning & Interleaved Thinking

Claude Code uses extended thinking selectively — fast routine responses, deeper thinking for complex steps. It can be toggled and configured:

```bash
# Effort levels: low | medium | high | xhigh (Opus 4.7 only) | max
/effort high
claude --effort xhigh "Redesign the caching layer"

# Always-on thinking
# In settings.json:
{ "alwaysThinkingEnabled": true }

# Per-session keyboard toggle: Option+T / Alt+T

# Disable entirely:
export DISABLE_INTERLEAVED_THINKING=1
```

As of v2.1.117, the default effort for Pro/Max users on Opus 4.6 and Sonnet 4.6 is `high` (changed from `medium`). The thinking spinner shows inline progress: *"still thinking"* → *"thinking more"* → *"almost done thinking"* (v2.1.116).

### 3.7 Background Tasks

Background tasks let you send a long-running tool operation to the background so you can continue prompting Claude while it executes.

Press **Ctrl+B** during any running tool invocation to background it. The task continues executing in the background while Claude returns to the input prompt. You can monitor background tasks with `/tasks` and bring results back into the foreground when they complete.

The `--bg` CLI flag starts a session in background mode from the outset — useful for launching a long migration or test run and disconnecting:

```bash
# Start a background session; returns immediately:
claude --bg --print "Run the full test suite and report failures"

# Monitor background agents collectively:
# Ctrl+X Ctrl+K  — stop all background agents
```

Background task output is streamed to the Monitor tool (v2.1.97) when plugin `monitors/` entries are defined, enabling structured event capture from running scripts.

### 3.8 Routines & Scheduled Sessions

Routines are recurring Claude Code sessions triggered on a schedule — effectively cron jobs for your agentic workflows. They are configured via the `/schedule` slash command and backed by the internal scheduling system (disable with `CLAUDE_CODE_DISABLE_CRON=1`).

```bash
/schedule                    # open the scheduling UI
/schedule "Run test suite"   # schedule a recurring task
```

A scheduled routine stores its configuration in `.claude/routines/` at the project level. On each trigger it starts a new Claude Code session with the configured prompt, tools, and permission mode, then records the result. Routines are useful for nightly regression runs, weekly dependency audits, or daily changelog summaries. The full Routines specification is not yet publicly documented in the official docs beyond what is observable from the CLI and `/schedule` UI.

---

## 4. Built-In Tools Reference

> **Version History:** The core toolset (Read, Write, Edit, Bash, Grep, Glob) has been stable since v1.0. MultiEdit was added in v1.0.x. Task was renamed to Agent in v2.1.63 (Task still works as alias). Monitor added v2.1.97. Skill tool auto-discovery of built-in commands added v2.1.108. PowerShell tool graduated from opt-in to default in v2.1.126. EnterWorktree `path` parameter added v2.1.105.

> **Prefer built-in tools over Bash equivalents.** Read, Grep, Glob, Write, and Edit are tracked in the audit log, integrate with hooks and permissions, work correctly inside the sandbox, and feed results to the model in token-efficient form. Use Bash only when no built-in tool fits.

| Tool | Purpose | Auto-approved? | Permission Pattern |
|------|---------|:---:|---|
| **Read** | Read file contents (text, images, PDFs, notebooks) | ✅ | `Read(...)` deny rules honoured |
| **Write** | Create or overwrite files | ❌ | `Write(pattern)` |
| **Edit** | Targeted in-place patch | ❌ | `Edit(pattern)`. Diff 60% faster on files with tabs/`&`/`$` (v2.1.119) |
| **MultiEdit** | Multiple edits to the same file in one call | ❌ | Same as Edit |
| **Bash** | Execute shell commands | ❌ | `Bash(cmd:*)` patterns; deny rules match wrappers `env`/`sudo`/`watch`/`ionice`/`setsid` (v2.1.113) |
| **PowerShell** | Execute PowerShell commands on Windows (opt-in, default from v2.1.126) | ❌ | `PowerShell(cmd:*)` |
| **Grep** | ripgrep-based regex search (modes: `files_with_matches`, `count`, `lines`); multiline supported | ✅ | n/a |
| **Glob** | File-pattern search; structured listing | ✅ | n/a |
| **LS** | List directory contents | ✅ | Not in `CLAUDE_CODE_SIMPLE=1` |
| **WebFetch** | Fetch URL → markdown; `Claude-User` User-Agent (robots.txt aware); strips `<style>`/`<script>` (v2.1.105) | ❌ | `WebFetch(domain:example.com)` |
| **WebSearch** | Live web search | ❌ | `WebSearch` |
| **Task** | Spawn a subagent in an isolated context window | ❌ | `Task(AgentName)` |
| **TodoRead / TodoWrite** | Structured task list within a session | ✅ | n/a |
| **NotebookRead / NotebookEdit** | Jupyter notebook support | Mixed | Edit prompts |
| **Monitor** | Stream events from background scripts (v2.1.97, via plugin `monitors/`) | ❌ | `Monitor` |
| **RemoteTrigger** | Trigger Remote Control session actions | ❌ | `RemoteTrigger` |
| **Skill** | Invoke a skill file; discovers built-in slash commands like `/init`, `/review`, `/security-review` (v2.1.108+) | ❌ | `Skill(name)` |
| **KillShell / KillBash** | Terminate a running background bash shell | ❌ | n/a |
| **EnterWorktree / ExitWorktree** | Switch into/out of a git worktree; `path` param added v2.1.105 | ❌ | n/a |
| **TaskCreate / TaskUpdate / TaskList / TaskGet** | Persistent task primitives (Agent Teams) | Mixed | n/a |
| **SendMessage** | Peer-to-peer agent messaging (Agent Teams only) | ❌ | `SendMessage(*)` |
| **Teammate** | Spawn/cleanup teammates in Agent Teams | ❌ | `Teammate` |
| **LSP** | Language-server go-to-def, find-references, hover docs (TS/Python/Go/Rust) | ✅ | n/a |
| **mcp__{server}__{tool}** | Dynamically registered MCP tool calls | ❌ | Per-tool permission |

**Notable tool-specific details:**

Bash read-only commands (`ls`, `cat`, `head`, `tail`, `grep`, `find`, `wc`, `diff`, `stat`, `du`, `cd`, read-only `git`) are auto-allowed. v2.1.111 added `lsof`, `pgrep`, `tput`, `ss`, `fd`, `fdfind` to that allowlist. `Bash(find:*)` allow rules no longer auto-approve `find -exec`/`-delete` (v2.1.113).

MCP result size: the default truncation can be bypassed per-server via `_meta["anthropic/maxResultSizeChars"]` up to **500,000 characters** (v2.1.91/v2.1.119). `TaskOutput` is deprecated — use `Read` on the subagent's output file path instead.

---

## 5. Slash Commands Reference

Type `/` in any session to fuzzy-search all commands and skills. There are 60+ built-in commands plus bundled skills. The following tables organise them by purpose.

### 5.1 Session, Model & Cost

| Command | Purpose | Notes |
|---------|---------|-------|
| `/help` | List all commands | |
| `/init` | Auto-generate `CLAUDE.md` | Analyzes build system, tests, code patterns |
| `/login` / `/logout` | Auth management | |
| `/model` | Pick model | Warns mid-session; persists across restarts (v2.1.117) |
| `/effort [low\|medium\|high\|xhigh\|max\|auto]` | Set reasoning budget | Opens slider when bare (v2.1.111) |
| `/usage` | Session cost, per-model & cache-hit breakdown | Merges `/cost` and `/stats` (v2.1.118) |
| `/config` | Tabbed settings UI | Persists to `~/.claude/settings.json` (v2.1.119) |
| `/permissions` | Interactive allow/deny rule editor | Domain allowlisting |
| `/doctor` | Health check | Press `f` to auto-fix (v2.1.105+) |
| `/terminal-setup` | Configure terminal | Scroll, clipboard, iTerm2 clipboard |
| `/release-notes` | Interactive version picker | v2.1.92 |
| `/feedback` / `/bug` | Send feedback to Anthropic | |
| `/status` | Session status | Works mid-response (v2.1.110) |
| `/extra-usage` | Show extra session usage data | Available from Remote Control clients (v2.1.113) |

### 5.2 Context & Memory

| Command | Purpose | Notes |
|---------|---------|-------|
| `/clear` | Reset context | Hint shows current size, not cumulative (fixed v2.1.119) |
| `/compact [steering]` | Summarise; preserves cache prefix | Fork-based architecture |
| `/context` | Show context-usage grid | Native dialog in VS Code (v2.1.121) |
| `/recap` | Manual session recap | v2.1.108; `CLAUDE_CODE_ENABLE_AWAY_SUMMARY` |
| `/btw` | Side question not polluting main thread | |
| `/rewind` (alias `/undo`) | Roll back the last turn | v2.1.108 |
| `/branch` (formerly `/fork`) | Branch the current conversation | Renamed v2.1.77 |
| `/resume` (`/r`) | Session picker | Ctrl+A for all projects; 67% faster on 40MB+ (v2.1.116) |
| `/rename` | Rename a session | Syncs over Remote Control (v2.1.116) |
| `/memory` | Manage auto-memory entries | |

### 5.3 Files, Directories & Worktrees

| Command | Purpose |
|---------|---------|
| `/add-dir <path> [--remember]` | Add a directory to the session |
| `/diff` | Show pending diff |
| `/copy [N]` | Copy last response (or the Nth-latest with `/copy N`) with table-aligned markdown for GitHub/Notion/Slack; `w` to write selection to file |
| `/env` | Manage session environment variables |

### 5.4 Agents, Skills, Plugins & MCP

| Command | Purpose | Notes |
|---------|---------|-------|
| `/agents` | List/edit subagents | "Generate with Claude" button |
| `/skills` | Browse skills | Sort by token count `t`, type to filter (v2.1.121) |
| `/tasks` | Tasks list view | |
| `/plugin` | Plugin marketplace UI | |
| `/plugin install <name>` | Install a plugin | |
| `/plugin update` | Update plugins | |
| `/plugin list` | List installed plugins | |
| `/mcp` | Manage MCP servers, OAuth re-auth | |
| `/reload-plugins` | Reload plugins | Auto-installs missing deps |

### 5.5 Workflow & Power Features

| Command | Purpose | Version |
|---------|---------|---------|
| `/review` | Code review | |
| `/security-review` | Security-focused review | |
| `/think` | One-shot deep-thinking response | |
| `/plan [description]` | Enter plan mode (optional immediate plan execution) | v2.1.111 description arg |
| `/ultraplan` | Multi-agent cloud planning; auto-creates cloud env | v2.1.101 |
| `/ultrareview [PR#]` | Parallelised multi-agent cloud code review | v2.1.111 |
| `/loop` (alias `/proactive`) | Self-referential iterative loop | v2.1.105 |
| `/simplify` | 3-agent quality review pipeline | |
| `/batch` | Parallel large-scale changes across worktrees → auto PRs | |
| `/debug` | Debug skill | |
| `/claude-api` | Skill for Anthropic API work | |
| `/team-onboarding` | Generate teammate ramp-up guide | v2.1.101 |
| `/less-permission-prompts` | Scan transcripts; propose allowlist | v2.1.111 |
| `/sandbox` | Enable OS-level sandbox | |
| `/voice` | Voice dictation toggle | Option+P / Alt+P |
| `/theme` / `/color` | Color/custom themes | Named themes v2.1.118 |
| `/remote-control` (`/rc`) | Bridge local CLI to claude.ai/code, iOS/Android | v2.1.51 |
| `/tui [fullscreen]` | Switch rendering mode | v2.1.110 |
| `/focus` | Focus mode toggle | |
| `/schedule` | Schedule background tasks | |
| `/insights` | Personal usage analytics | |
| `/setup-bedrock` | Guided Bedrock configuration | v2.1.92 |
| `/setup-vertex` | Guided Vertex AI configuration | v2.1.98 |
| `/advisor` | Configure an Advisor model to consult mid-generation (experimental); prompts for advisor model selection | Experimental; v2.1.117+ |
| `/powerup` | Interactive lessons teaching Claude Code features with animated in-terminal demos (v2.1.90) | |

### 5.6 Custom Slash Commands / Skills

Custom commands have been merged into Skills (v2.1.101). A file at `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md` both create `/deploy`. **Skills win on collision.**

Files at `.claude/commands/<name>.md` (project) or `~/.claude/commands/<name>.md` (personal) remain supported for backwards compatibility.

```markdown
---
allowed-tools: Bash(git add:*), Bash(git commit:*)
argument-hint: [message]
description: Create a git commit with the staged changes
model: claude-haiku-4-5
context: fork
disable-model-invocation: false
---

Commit all staged changes with message: $ARGUMENTS
```

`$ARGUMENTS` captures everything after the command name. `$1`, `$2`, … give positional args. `${CLAUDE_EFFORT}` expands to the current effort level (v2.1.120).

---

## 6. CLI Flags Reference

```bash
claude [PROMPT] [FLAGS]
```

> **Note:** `claude --help` does not list every flag. A flag's absence from `--help` does not mean it is unavailable.

| Flag | Purpose |
|------|---------|
| `-p`, `--print` | Non-interactive / headless mode; print result and exit |
| `--output-format text\|json\|stream-json` | Print-mode output shape |
| `--input-format` | Input format for stdin |
| `--include-partial-messages` | Stream intermediate tool content |
| `--json-schema '<schema>'` | Validate JSON output against a JSON Schema |
| `-c`, `--continue` | Resume the most recent session in cwd |
| `-r`, `--resume [id\|name]` | Resume a named or specific session |
| `--session-id <id>` | Resume by session ID |
| `-n`, `--name <name>` | Name a new session at start |
| `--from-pr <url-or-number>` | Resume session linked to a PR (GitHub/GitLab/Bitbucket/GHE, v2.1.119) |
| `--fork-session` | New session ID, inherits context |
| `-w`, `--worktree <name>` | Run in `.claude/worktrees/<name>/` (v2.1.50) |
| `--tmux` | Wrap worktree session in tmux pane |
| `--model <id>` | Override default model |
| `--fallback-model <id>` | Fallback model if primary is unavailable |
| `--effort low\|medium\|high\|xhigh\|max\|auto` | Reasoning budget |
| `--max-tokens <n>` | Cap output tokens |
| `--max-turns <n>` | Cap agentic turns |
| `--max-budget-usd <usd>` | Hard spending cap; session ends gracefully when exceeded |
| `--allowedTools "Read,Write,Bash(git:*)"` | Auto-approve listed tools |
| `--disallowedTools` | Disallow listed tools |
| `--tools` | Hard-restrict toolset (vs `--allowedTools` which only skips prompts) |
| `--permission-mode default\|acceptEdits\|plan\|bypassPermissions\|auto\|dontAsk` | Permission mode |
| `--dangerously-skip-permissions` | Bypass all permission prompts |
| `--system-prompt <text>` | Replace system prompt |
| `--system-prompt-file <path>` | Replace system prompt from file |
| `--append-system-prompt <text>` | Append to default system prompt |
| `--append-system-prompt-file <path>` | Append from file |
| `--exclude-dynamic-system-prompt-sections` | Moves cwd/env/memory to first user message for better cross-user caching (v2.1.98) |
| `--add-dir <path>` | Include extra directory |
| `--settings <path>` | Load settings from a specific file |
| `--setting-sources user,project,local,policy,managed` | Restrict which config scopes load |
| `--mcp-config <file>` | Load MCP servers from a file |
| `--agent <name>` | Run as a specific named agent; honours agent's `permissionMode` (v2.1.119) |
| `--agents <json>` | Inline agent definitions |
| `--channels` | Enable MCP server push events into session |
| `--bg` | Run session in background |
| `--remote` | Start a cloud VM session |
| `--remote-control` / `--rc` | Enable Remote Control bridge |
| `--remote-control-session-name-prefix <pfx>` | Override hostname-derived prefix for Remote Control |
| `--console` | Authenticate via Anthropic Console API key (v2.1.79) |
| `--bare` | Skip hooks, plugins, auto-memory, CLAUDE.md |
| `--no-session-persistence` | Ephemeral session |
| `--replay-user-messages` | Replay messages for testing |
| `--debug [categories]` | Verbose logging (`api,hooks,mcp,permissions,skills`) |
| `--debug-file <path>` | Write debug logs to file |
| `--verbose` | Verbose output |
| `--teleport` | Hand off active session to another surface |
| `--enable-auto-mode` | (Deprecated v2.1.111 — auto mode no longer requires this flag) |
| `--chrome` | Enable Chrome debugging integration |
| `--plugin-dir <path>` | Load a plugin from a local directory |

**Top-level subcommands** (not prefixed with `--`):

```bash
claude auth login                     # browser OAuth
claude update                         # manual update
claude install [stable|latest]        # pin channel
claude doctor                         # health check (CLI alias for /doctor)
claude mcp add|list|remove|get|serve  # MCP management
claude plugin install|update|list|tag|prune|validate|marketplace  # plugin lifecycle
claude remote-control                 # start Remote Control server
claude ultrareview [target] [--json]  # non-interactive code review (v2.1.120)
claude project purge [path]           # clean up old project data (v2.1.126)
  # flags: --dry-run, -y/--yes, -i/--interactive, --all
```

---

## 7. Configuration System

### 7.1 Five-Scope Hierarchy

Settings are merged from lowest to highest precedence. Higher-precedence scopes override lower-precedence ones; **deny rules always win regardless of scope**.

1. **Default settings** — built-in defaults
2. **User settings** — `~/.claude/settings.json`
3. **Project settings** — `.claude/settings.json` (commit to git for team-wide effect)
4. **Project local settings** — `.claude/settings.local.json` (gitignore this file)
5. **CLI flags** — highest priority

**Above all others — Managed settings (enterprise):** server-managed policy > MDM > file-based (`managed-settings.json` + `managed-settings.d/*.json`) > Windows HKCU registry. Cannot be overridden by anything, including CLI flags.

**Managed settings file locations:**

| OS | Path |
|----|------|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\ProgramData\ClaudeCode\managed-settings.json` |

The `managed-settings.d/` drop-in directory is supported for separate teams to deploy independent policy fragments that merge alphabetically.

`wslInheritsWindowsSettings: true` (v2.1.118) lets WSL inherit Windows-side managed settings.

### 7.2 settings.json — Complete Key Reference

```jsonc
{
  // JSON Schema for autocomplete (community-maintained schemastore.org)
  "$schema": "https://json.schemastore.org/claude-code-settings.json",

  // ── Model & reasoning ──────────────────────────────────────────
  "model": "claude-sonnet-4-6",
  "availableModels": ["claude-opus-4-7", "claude-sonnet-4-6", "claude-haiku-4-5"],
  "effort": "high",                      // low|medium|high|xhigh|max
  "alwaysThinkingEnabled": true,
  "showThinkingSummaries": false,        // default false (v2.1.89)

  // ── UI & display ───────────────────────────────────────────────
  "theme": "dark",                       // "auto-match-terminal" also supported
  "editorMode": "vim",                   // or "emacs"
  "language": "english",
  "voiceEnabled": false,
  "tui": "fullscreen",                   // "fullscreen" or "inline"
  "autoScrollEnabled": true,
  "spinnerTipsOverride": { "excludeDefault": false },

  // ── Session management ─────────────────────────────────────────
  "autoCompact": true,
  "cleanupPeriodDays": 30,               // ≥1 (v2.1.89 rejects 0)
  "verbose": false,
  "outputStyle": "default",

  // ── Permissions ────────────────────────────────────────────────
  "permissions": {
    "allow": ["Bash(npm run *)", "Bash(git status)", "Read(**)"],
    "deny":  ["Read(**/.env)", "Read(**/.env.*)", "Bash(rm -rf *)"],
    "ask":   ["WebFetch", "Bash(curl:*)"],
    "additionalDirectories": ["../shared-libs"],
    "defaultMode": "default",            // default|acceptEdits|plan|bypassPermissions|auto|dontAsk
    "disableBypassPermissionsMode": "disable"
  },

  // ── Auto mode (Anthropic safety classifier) ────────────────────
  "autoMode": {
    "allow":      ["$defaults"],         // "$defaults" extends built-in list (v2.1.118)
    "soft_deny":  ["$defaults"],
    "environment": {}
  },

  // ── Sandbox ────────────────────────────────────────────────────
  "sandbox": {
    "enabled": false,
    "failIfUnavailable": false,
    "autoAllowBashIfSandboxed": false,
    "excludedCommands": [],
    "dangerouslyDisableSandbox": false,
    "enableWeakerNestedSandbox": false,
    "enableWeakerNetworkIsolation": false,
    "allowUnixSockets": [],
    "allowRead": ["/usr/local/share"],
    "filesystem": {
      "allowWrite": ["/tmp/build"],
      "denyRead":   ["~/.ssh"],
      "denyWrite":  ["~/.gitconfig"]
    },
    "network": {
      "allowedDomains": ["*.npmjs.org", "github.com"],
      "deniedDomains":  ["telemetry.example.com"],
      "allowMachLookup": false
    }
  },

  // ── Env vars injected into subprocesses ───────────────────────
  "env": {
    "NODE_ENV": "development",
    "API_TIMEOUT_MS": "300000"
  },

  // ── Attribution ────────────────────────────────────────────────
  "includeCoAuthoredBy": true,
  "attribution": { "commits": true, "pullRequests": true },
  "prUrlTemplate": "https://git.company.com/{owner}/{repo}/pulls/{n}",  // v2.1.119

  // ── Hooks (see §10) ────────────────────────────────────────────
  "hooks": {},

  // ── MCP servers (see §11) ──────────────────────────────────────
  "mcpServers": {},

  // ── Plugins (see §12) ──────────────────────────────────────────
  "enabledPlugins": ["pr-review-toolkit@anthropic"],
  "extraKnownMarketplaces": {},
  "blockedMarketplaces": [
    { "hostPattern": "evil.example.com", "pathPattern": "**" }
  ],
  "strictKnownMarketplaces": false,

  // ── Enterprise controls ────────────────────────────────────────
  "forceRemoteSettingsRefresh": false,   // fail-closed (v2.1.92)
  "forceLoginMethod": "claudeai",        // "claudeai" | "console"
  "forceLoginOrgUUID": "...",
  "allowManagedHooksOnly": false,
  "allowedHttpHookUrls": ["https://hooks.internal/*"],
  "httpHookAllowedEnvVars": ["MY_TOKEN"],
  "allowManagedDomainsOnly": false,
  "allowManagedReadPathsOnly": false,
  "disableAllHooks": false,
  "disableSkillShellExecution": false,   // v2.1.91

  // ── Auth helpers ───────────────────────────────────────────────
  "apiKeyHelper": "/usr/local/bin/get-anthropic-key",
  "headersHelper": "/usr/local/bin/get-headers.sh",
  "otelHeadersHelper": "/usr/local/bin/otel-headers.sh",
  "awsCredentialExport": "/usr/local/bin/aws-creds.sh",
  "awsAuthRefresh": "/usr/local/bin/aws-refresh.sh",
  "gcpAuthRefresh": "gcloud auth application-default login",

  // ── WSL ────────────────────────────────────────────────────────
  "wslInheritsWindowsSettings": true,   // v2.1.118

  // ── Status line ────────────────────────────────────────────────
  "statusLine": {
    "type": "command",
    "command": "git branch --show-current 2>/dev/null",
    "refreshInterval": 5000
    // rate_limits is injected automatically when command runs inside Claude Code:
    // { "rate_limits": { "5h": { "used_percentage": 42, "resets_at": "2026-05-02T18:00:00Z" },
    //                   "7d": { "used_percentage": 11, "resets_at": "2026-05-08T00:00:00Z" } } }
  },

  // ── Plan mode ──────────────────────────────────────────────────
  "showClearContextOnPlanAccept": false,  // Plan mode hides "clear context" by default; set true to restore

  // ── Miscellaneous ──────────────────────────────────────────────
  "includeBuiltinGitWorkflow": true,
  "respectGitignore": true,
  "fileSuggestion": true,
  "CLAUDE_CODE_HIDE_CWD": false         // v2.1.119
}
```

### 7.3 Environment Variables — Selected Reference

The complete set exceeds 175 variables. The most important ones are grouped below.

**Auth & Providers:**
`ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_CUSTOM_HEADERS`, `CLAUDE_CODE_OAUTH_TOKEN`, `CLAUDE_CODE_USE_BEDROCK`, `CLAUDE_CODE_USE_VERTEX`, `CLAUDE_CODE_USE_FOUNDRY`, `AWS_REGION`, `ANTHROPIC_VERTEX_PROJECT_ID`, `ANTHROPIC_VERTEX_BASE_URL` (custom Vertex endpoint override), `CLOUD_ML_REGION`, `ANTHROPIC_BEDROCK_BASE_URL`, `ANTHROPIC_FOUNDRY_API_KEY`, `ANTHROPIC_FOUNDRY_BASE_URL`, `ANTHROPIC_FOUNDRY_RESOURCE`, `CLAUDE_CODE_SKIP_BEDROCK_AUTH`, `CLAUDE_CODE_SKIP_VERTEX_AUTH`, `CLAUDE_CODE_SKIP_FOUNDRY_AUTH` (gateway mode for Azure Foundry), `CLAUDE_CODE_USE_MANTLE`, `ANTHROPIC_BEDROCK_SERVICE_TIER`, `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`, `CLAUDE_CODE_CERT_STORE` (`bundled`/`system`; default is OS CA store since v2.1.101), `NO_PROXY`, `HTTP_PROXY`, `HTTPS_PROXY`.

**Models & Thinking:**
`ANTHROPIC_MODEL`, `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`, `ANTHROPIC_DEFAULT_SONNET_MODEL_NAME`, `ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME`, `DISABLE_INTERLEAVED_THINKING`, `CLAUDE_CODE_DISABLE_1M_CONTEXT`, `CLAUDE_CODE_EFFORT_LEVEL`, `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`, `DISABLE_COMPACT`, `CLAUDE_CODE_MAX_CONTEXT_TOKENS`.

**Caching:**
`DISABLE_PROMPT_CACHING`, `ENABLE_PROMPT_CACHING_1H`, `FORCE_PROMPT_CACHING_5M`.

**Telemetry / Privacy:**
`DISABLE_TELEMETRY`, `DISABLE_ERROR_REPORTING`, `DISABLE_BUG_COMMAND`, `DISABLE_AUTOUPDATER`, `DISABLE_UPDATES`, `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC`, `CLAUDE_CODE_DISABLE_TERMINAL_TITLE`, `CLAUDE_CODE_ENABLE_TELEMETRY`, `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA`, `OTEL_LOG_USER_PROMPTS`, `OTEL_LOG_TOOL_DETAILS`, `OTEL_LOG_TOOL_CONTENT`, `OTEL_LOG_RAW_API_BODIES` (v2.1.111: `=1` inline 60KB; `=file:<dir>` writes to disk), `OTEL_METRICS_EXPORTER`, `OTEL_LOGS_EXPORTER`, `OTEL_TRACES_EXPORTER`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`, `OTEL_EXPORTER_OTLP_PROTOCOL` (controls transport: `grpc` or `http/protobuf`; relevant for self-hosted collectors), `OTEL_METRIC_EXPORT_INTERVAL`.

**Sandbox & Security:**
`CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`, `CLAUDE_CODE_SCRIPT_CAPS`, `CLAUDE_CODE_PERFORCE_MODE` (when set to `1`, switches the VCS integration from Git to Perforce: the built-in Git workflow is disabled, read-only Perforce operations are auto-allowed, and `p4` commands requiring write access prompt for permission — useful for codebases hosted in Perforce rather than Git), `CLAUDE_CODE_USE_POWERSHELL_TOOL`, `CLAUDE_CODE_NO_FLICKER`.

**Behaviour Toggles:**
`CLAUDE_CODE_SIMPLE`, `CLAUDE_CODE_DISABLE_CRON`, `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS`, `CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR`, `CLAUDE_CODE_ENABLE_AWAY_SUMMARY`, `CLAUDE_CODE_FORK_SUBAGENT` (v2.1.117), `CLAUDE_CODE_HIDE_CWD` (v2.1.119), `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`, `CLAUDE_CODE_NEW_INIT`, `AI_AGENT` (v2.1.120).

**Skills & Commands:**
`SLASH_COMMAND_TOOL_CHAR_BUDGET` (override the ~8,000-char fallback), `CLAUDE_ENV_FILE` (path SessionStart hooks write env to), `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

**Plugins & MCP:**
`CLAUDE_CODE_PLUGIN_SEED_DIR` (v2.1.92+: colon-separated on Unix, semicolon on Windows), `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`, `ENABLE_CLAUDEAI_MCP_SERVERS`, `ENABLE_TOOL_SEARCH`, `CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE` (when set, keeps the existing marketplace cache if a git pull fails — useful for air-gapped or offline deployments that should never fall back to an empty plugin list).

**Tracing:**
`TRACEPARENT`, `TRACESTATE` (SDK/headless reads from env for distributed tracing, v2.1.110; also injected into Bash subprocesses when OTEL is on, v2.1.97).

---

## 8. CLAUDE.md — Project Memory

`CLAUDE.md` is a Markdown file Claude reads at the start of every session. It is the most important configuration knob: it lets you teach Claude your conventions, build commands, architectural patterns, and "don't" rules once, and have them applied automatically in every future session.

### 8.1 Discovery Hierarchy

Claude discovers `CLAUDE.md` files by walking the directory tree upward from the current working directory. Files are loaded in this order:

1. Managed: `/Library/Application Support/ClaudeCode/CLAUDE.md` (macOS enterprise)
2. User-global: `~/.claude/CLAUDE.md`
3. Parent directories walking up from cwd (most specific wins)
4. Project root: `./CLAUDE.md` or `.claude/CLAUDE.md`
5. Subdirectory files: loaded on-demand when Claude reads files inside that subtree

Set `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1` to also load CLAUDE.md from `--add-dir` directories.

HTML comments in `CLAUDE.md` are hidden from Claude's auto-injection but remain visible when Claude's `Read` tool reads the file explicitly (added in a v2.1.x release).

### 8.2 Recommended Structure

```markdown
# Project Name
Brief description.

## Stack
- Node 22, TypeScript 5.4, React 18, PostgreSQL 16

## Commands
- `npm run dev`    — start dev server (http://localhost:3000)
- `npm test`       — run Vitest unit tests
- `npm run build`  — production build
- `npm run lint`   — eslint + prettier check

## Conventions
- TypeScript everywhere; no `any` except in test mocks
- Functional React components; no class components
- Tabs, 2-char width; single quotes
- Error messages must include an error code (e.g., `E_AUTH_FAILED`)

## Architecture
- src/api/        → REST handlers (Express)
- src/lib/        → pure business logic (no side effects)
- src/components/ → React UI components
- src/db/         → Knex migrations + query builders

## Don't
- Edit `generated/` files — they are auto-generated
- Push directly to `main` — open a PR
- Add new npm dependencies without mentioning it in the PR description
```

### 8.3 YAML Frontmatter (Advanced)

```markdown
---
agent: senior-architect
include: ["docs/patterns.md", "docs/style.md"]
priority: high
---
```

### 8.4 Auto-Generation & Auto-Memory

`/init` analyses your build system, test framework, and code patterns and writes a starter `CLAUDE.md`. Use `CLAUDE_CODE_NEW_INIT=1` for an interactive flow that asks which files to generate (CLAUDE.md, skills, hooks). After generating, refine it and commit it to git.

**Auto memory** scans sessions and proposes new durable facts (build insights, debugging patterns) to save into `CLAUDE.md` automatically. It is scoped per-project and available on all tiers including free. Entries are truncated at **25KB / 200 lines** (whichever comes first, per v2.1.85). Memory is stored in `~/.claude/projects/<project-hash>/memory/MEMORY.md` (machine-local; all worktrees for the same project share one directory). Satellite topic files can live alongside MEMORY.md in the same folder. Edit manually with `/memory`, or tell Claude to remember a fact and it writes the entry automatically.

### 8.5 Recap

`/recap` summarises the session and re-anchors context. Auto-recap fires when you return to a session after time away. Controlled by `CLAUDE_CODE_ENABLE_AWAY_SUMMARY`. Since v2.1.110, Bedrock/Vertex/Foundry/`DISABLE_TELEMETRY` users get auto-recap enabled by default.

---

## 9. Skills

Skills are auto-discoverable structured capabilities. A skill can be invoked **both** by name (`/skill-name`) **and** automatically by Claude when a task matches its `description` field — unlike slash commands which are always manual.

### 9.1 Locations

```
Project:  .claude/skills/<name>/SKILL.md
User:     ~/.claude/skills/<name>/SKILL.md
Plugin:   <plugin>/skills/<name>/SKILL.md
```

Built-in bundled skills: `/simplify`, `/batch`, `/debug`, `/loop`, `/claude-api`, `/less-permission-prompts` (v2.1.111).

### 9.2 SKILL.md Frontmatter — Complete Field Reference

```markdown
---
name: explain-code             # required; ≤64 chars; lowercase + hyphens; becomes /explain-code
description: >                 # required; ≤1024 chars
  Explains code with diagrams and analogies.
  Use when the user asks how or why code does X.
when_to_use: "User asks how/why code does X"  # supplemental trigger hint
allowed-tools: [Read, Grep, Glob]             # tool allowlist for this skill
disable-model-invocation: false               # true = only manual /name invocation
context: fork                                 # run in a new fork/subagent context
agent: general-purpose                        # which agent profile to use
model: claude-opus-4-7                        # model override for this skill
effort: high                                  # effort level override (low|medium|high|xhigh|max) when this skill runs
mode: default                                 # execution mode
disabled: false                               # set true to temporarily disable
keep-coding-instructions: false               # retain main-session coding instructions
argument-hint: "[function-name]"              # shown in autocomplete hint
paths: ["src/**/*.ts"]                        # YAML glob list for file scope
---

# Skill body — the prompt Claude follows when this skill runs.

## How to read the code

First, identify the entry point: $1

Then trace the call graph to understand $ARGUMENTS.

The current effort level is: ${CLAUDE_EFFORT}
```

**Variable substitution:** `$ARGUMENTS` captures everything after the command name. `$1`, `$2`, … give positional arguments. `${CLAUDE_EFFORT}` expands to the current effort level (v2.1.120). `${CLAUDE_PLUGIN_ROOT}` resolves to the plugin root for portable paths.

### 9.3 Bundle Directory Layout

```
my-skill/
├── SKILL.md          # required
├── scripts/          # executable helpers (Python/Bash); deterministic
├── references/       # docs loaded on demand into context
└── assets/           # templates, fonts, icons used in output
```

### 9.4 Discovery & Token Budget

Skill metadata is pre-loaded into context at session start. Budget: approximately **1% of the context window** with an **8,000-character fallback** (community-attested; not published as exact numbers in official docs). Override with `SLASH_COMMAND_TOOL_CHAR_BUDGET`. The listing cap was raised from 250 → **1,536 chars** per skill in v2.1.105; longer descriptions are truncated with a startup warning. The `/skills` command lets you browse skills, sort by token count (`t`), and type to filter (v2.1.121).

### 9.5 Inline vs Subagent Execution

Skills run **inline** in the main session by default. Setting `context: fork` plus an optional `agent: <name>` runs the skill in an isolated subagent context — giving it its own context window and preventing it from seeing the full main-session history. `disableSkillShellExecution: true` blocks shell execution from skill bodies (defence in depth for distrusted plugins, v2.1.91).

Since v2.1.108, the Skill tool can discover and invoke built-in slash commands like `/init`, `/review`, and `/security-review` automatically.

---

## 10. Hooks — Lifecycle Reference

> **Version History:** Hook system (command/prompt/agent handlers) launched v1.0. HTTP handler type added v2.1.63. `mcp_tool` handler type added v2.1.118. `PreToolUse` `defer` field added v2.1.89. `PostToolUse` `updatedToolOutput` for ALL tools added v2.1.121. `PostToolUseFailure` event received `error`, `is_interrupt`, `duration_ms` fields in v2.1.119. `PreCompact` blockable via JSON response added v2.1.105. Conditional `if` hooks (Week 17 research preview). `CLAUDE_TOOL_INPUT_FILE_PATH` env var added v2.1.89.

Hooks are deterministic processes — shell commands, LLM prompts, subagents, MCP tools, or HTTP endpoints — that fire at lifecycle events. They are **guarantees**, not suggestions: if a hook returns a block decision, the action does not proceed.

### Hook Execution Lifecycle — Visual Flow

```
  Claude Code Session Lifecycle with Hook Injection Points

  Session Start
       │
       ▼
  ┌──────────────┐      fires: SessionStart, Setup
  │  INIT PHASE  │ ──── hooks can inject context, set env vars
  └──────────────┘
       │
       ▼
  ┌───────────────────────────────────────────────────────────┐
  │                   AGENTIC LOOP                            │
  │                                                           │
  │   User Prompt ──► UserPromptSubmit hook (can block)       │
  │        │                                                  │
  │        ▼                                                  │
  │   Claude thinks                                           │
  │        │                                                  │
  │        ▼                                                  │
  │   Tool call ──► PreToolUse hook (can block/modify)        │
  │        │                                                  │
  │        ▼                                                  │
  │   Tool executes                                           │
  │        │                                                  │
  │        ▼                                                  │
  │   Tool result ──► PostToolUse hook (can augment)          │
  │        │                                                  │
  │        ▼                                                  │
  │   Claude response ──► Stop hook (exit 2 = force continue) │
  └───────────────────────────────────────────────────────────┘
       │
       ▼
  ┌──────────────────┐    fires: SessionEnd, PreCompact (if compacting)
  │  CLEANUP PHASE   │
  └──────────────────┘

  Hook Exit Codes:
  exit 0  = success, continue normally
  exit 2  = blocking — prevent tool execution / force continuation
  other   = non-blocking warning logged to Claude's context
```

### 10.1 All Hook Events

| Event | Fires When | Can Block? | Notes |
|-------|-----------|:---:|-------|
| `SessionStart` | New session / resume / clear / compact | No | Subtypes: `startup`, `resume`, `clear`, `compact` |
| `Setup` | First-time init / maintenance tasks | No | Subtypes: `init`, `maintenance` |
| `UserPromptSubmit` | After user submits, before model | Yes | Can return `sessionTitle` (v2.1.94) |
| `UserPromptExpansion` | Slash command expands | Yes | |
| `PreToolUse` | Before any tool call | Yes | Can return `updatedInput`, `additionalContext`, `permissionDecision`, `defer` (v2.1.89) |
| `PermissionRequest` | When a permission dialog would show | Yes | Can return `behavior`, `updatedInput`, `setMode` |
| `PostToolUse` | After tool succeeds | Soft | Can return `updatedToolOutput` for all tools (v2.1.121) |
| `PostToolUseFailure` | After tool errors | Yes | Receives `error`, `is_interrupt`, `duration_ms` (v2.1.119) |
| `SubagentStart` / `SubagentStop` | Subagent lifecycle | SubagentStop yes | |
| `Stop` | Turn ends normally | Yes | Can force more work |
| `StopFailure` | Turn ends due to API error | No | |
| `Notification` | Async alerts | No | Forward to Slack/webhooks |
| `PreCompact` | Before compaction | Yes | Block via exit code 2 or `{"decision":"block"}` (v2.1.105) |
| `PostCompact` | After compaction | No | |
| `Elicitation` / `ElicitationResult` | MCP requests structured input | Yes | v2.1.76 |
| `PermissionDenied` | Auto-mode classifier denies an action | No | Can return `{retry: true}` (v2.1.89) |
| `TaskCreated` | A new task is created | Yes | v2.1.89 |
| `WorktreeCreate` / `WorktreeRemove` | Worktree lifecycle | Mixed | |
| `InstructionsLoaded` | CLAUDE.md loaded | No | |
| `CwdChanged` / `FileChanged` | Watched filesystem events | No | |
| `TaskCompleted` | Task lifecycle | Mixed | |
| `TeammateIdle` | Agent team member idles | Yes | |
| `ConfigChange` | Config file changes mid-session | Yes | |

### 10.2 Handler Types

```jsonc
{
  "hooks": {
    // command — most common; receives JSON on stdin
    "PostToolUse": [{
      "matcher": "Write|Edit|MultiEdit",
      "hooks": [
        { "type": "command",
          "command": "npx prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\"" },
        { "type": "command",
          "command": "npx eslint --fix \"$CLAUDE_TOOL_INPUT_FILE_PATH\"" }
      ]
    }],

    // prompt — single-turn LLM eval (Haiku by default)
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [
        { "type": "prompt",
          "prompt": "Block this command if it appears dangerous: $TOOL_INPUT" }
      ]
    }],

    // agent — full subagent with tools (heaviest option)
    "Stop": [{
      "hooks": [
        { "type": "agent", "agent": "test-verifier", "messages": [] }
      ]
    }],

    // http — POST event JSON to an endpoint
    "Notification": [{
      "hooks": [
        { "type": "http",
          "url": "https://hooks.slack.com/services/...",
          "allowedEnvVars": ["SLACK_BOT_TOKEN"] }
      ]
    }],

    // mcp_tool — invoke MCP tools directly (v2.1.118)
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": [
        { "type": "mcp_tool",
          "server": "audit-server",
          "tool": "log_file_write" }
      ]
    }],

    // Conditional if hooks — fire only when a condition is true (research preview, Week 17)
    // The "if" field is a shell command; the hook fires only if it exits 0
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [
        {
          "type": "command",
          "if": "git rev-parse --is-inside-work-tree 2>/dev/null",
          "command": "echo 'Running inside a git repo — safety checks active'"
        }
      ]
    }],

    // SessionStart — inject git context
    "SessionStart": [{
      "hooks": [{
        "type": "command",
        "command": "printf '## Git Status\\n'; git status --short; printf '\\n## TODOs\\n'; grep -r 'TODO:' src/ --include='*.ts' | head -10"
      }]
    }]
  }
}
```

Exit code `2` in a `command` or `prompt` hook is treated as "block" and its stderr is sent to the model as context.

### 10.3 Output Schema

```jsonc
{
  "continue": true,                // false = block
  "suppressOutput": false,
  "decision": "block",             // or "approve"
  "reason": "Command is dangerous",
  "preventContinuation": false,
  "defer": false,                  // PreToolUse only: pause headless session (v2.1.89)
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    // For permission hooks:
    "permissionDecision": "allow|deny|ask",
    "permissionDecisionReason": "Allowed by org policy",
    // For PreToolUse:
    "updatedInput": { "command": "git diff --stat" },
    "additionalContext": "Adding file diff for context",
    // For PostToolUse (all tools, v2.1.121):
    "updatedToolOutput": "Formatted output here",
    // For UserPromptSubmit (v2.1.94):
    "sessionTitle": "Auth refactor session"
  }
}
```

### 10.4 Environment Available to Hooks

`CLAUDE_PROJECT_DIR`, `CLAUDE_TOOL_INPUT_FILE_PATH` (absolute path for Edit/Write/Read, v2.1.89), `CLAUDE_PLUGIN_ROOT`, `CLAUDE_PLUGIN_DATA`, `CLAUDE_ENV_FILE` (Windows support added v2.1.111), `CLAUDE_CODE_MCP_SERVER_NAME`, `CLAUDE_CODE_MCP_SERVER_URL` (v2.1.85), plus all `settings.json` `env` exports.

Input JSON on stdin includes: `session_id`, `cwd`, `tool_name`, `tool_input`, `tool_response`, `agent_id`, `duration_ms`, `error`, `is_interrupt`.

### 10.5 Enterprise Hook Controls

`allowManagedHooksOnly: true` blocks all user/project/plugin hooks — only hooks bundled with managed `enabledPlugins` run. `allowedHttpHookUrls` whitelists HTTP hook endpoints. `httpHookAllowedEnvVars` controls which env vars http hooks may read.

---

## 11. MCP — Model Context Protocol

> **Version History:** MCP support launched v1.0 with stdio transport. HTTP transport added as `sse` (now deprecated); `http` is the current standard (spec 1.1). OAuth RFC 9728 discovery added v2.1.85. `alwaysLoad: true` to bypass Tool Search deferral added v2.1.121. Server-pushed events via channels added v2.1.110. `ENABLE_TOOL_SEARCH=1` on Vertex AI for server-side tool search caching added v2.1.110. `ENABLE_CLAUDEAI_MCP_SERVERS=1` for claude.ai connectors in CLI/SDK added alongside `claude mcp serve` (v2.1.101). MCP transient error retry (3×) added v2.1.121. `resources/templates/list` deferred until first `@`-mention added v2.1.116.

MCP is the open protocol for connecting Claude Code to external services — "USB-C for AI tools." It supports tools, resources, prompts, and (v2.1.110) server-pushed events via channels.

### 11.1 Managing Servers

```bash
# Add servers by transport type
claude mcp add github npx @modelcontextprotocol/server-github
claude mcp add postgres --transport stdio -- /usr/local/bin/pg-mcp
claude mcp add notion --transport http https://mcp.notion.so

# Manage
claude mcp list
claude mcp get github
claude mcp remove github
claude mcp enable github
claude mcp disable github

# Expose Claude Code as an MCP server
claude mcp serve
```

`--scope local|project|user` controls where the config is written. `project` scope writes to `.mcp.json` at the repo root (committed to git).

### 11.2 Server Configuration

```jsonc
{
  "mcpServers": {
    // stdio (local subprocess)
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    },
    // Windows: stdio servers using npx need cmd /c wrapper
    "github-win": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "@modelcontextprotocol/server-github"]
    },
    // HTTP (recommended for remote servers)
    "internal-api": {
      "transport": "http",
      "url": "https://mcp.internal/rpc",
      "headers": { "Authorization": "Bearer ${API_TOKEN}" },
      "alwaysLoad": true   // skip tool-search deferral (v2.1.121)
    }
  }
}
```

> **Note:** The `sse` transport is deprecated. Use `http` for remote servers.

### 11.3 Naming & Tool Access

- Tool names follow `mcp__<server>__<tool>` (e.g., `mcp__github__list_prs`).
- Resources and prompts surface as slash commands.
- `resources/templates/list` is deferred until the first `@`-mention (faster startup, v2.1.116).
- `alwaysLoad: true` bypasses tool-search deferral so all tools are immediately available (v2.1.121).

### 11.4 OAuth Support

Claude Code supports RFC 9728 protected-resource discovery and RFC 8414 server metadata. Servers exposing `/.well-known/oauth-protected-resource` work without `apiKeyHelper`/`headersHelper`. Step-up re-authorisation triggers on `insufficient_scope` 403. OAuth tokens are refreshed with a cross-process lock to prevent concurrent refresh races. v2.1.97 fixed `oauth.authServerMetadataUrl` being lost on token refresh.

### 11.5 Result Size & Performance

The default truncation can be overridden per server call by annotating with `_meta["anthropic/maxResultSizeChars"]` up to **500,000 characters** (v2.1.91/v2.1.119):

```python
# Example: MCP server returning large content
return {
    "content": "...large output...",
    "_meta": { "anthropic/maxResultSizeChars": 500000 }
}
```

MCP read/search calls collapse in the TUI by default; press `Ctrl+O` to expand. Transient errors (5xx, connection refused, timeout) retry up to **3 times** (v2.1.121). MCP descriptions are capped at **2KB** per tool to prevent OpenAPI bloat. `clientInfo` in the initialize request identifies Claude Code to servers. `claude mcp serve` returns proper `outputSchema` (fixed v2.1.101).

### 11.6 ENABLE_CLAUDEAI_MCP_SERVERS

```bash
export ENABLE_CLAUDEAI_MCP_SERVERS=1   # loads claude.ai connectors for CLI/SDK use
```

v2.1.110: `ENABLE_TOOL_SEARCH=1` on Vertex AI to enable server-side tool search caching.

---

## 12. Plugins System

> **Version History:** Plugin system launched as preview in v2.0.x; reached stable in v2.1.0. Plugin `bin/` directory on PATH added v2.1.91. Named themes in plugins added v2.1.118. `claude plugin tag` command with version validation added v2.1.118. `claude plugin prune` for orphaned deps added v2.1.121. `claude plugin validate` accepting `$schema`/`version`/`description` added v2.1.120. Multiple `CLAUDE_CODE_PLUGIN_SEED_DIR` paths (colon/semicolon separated) added v2.1.92. Plugin `monitors/` directory for background monitoring added v2.1.105. `blockedMarketplaces` enforcement across install/update/refresh added v2.1.117.

Plugins are bundles of skills, agents, hooks, MCP servers, monitors, settings, themes, executables, and LSP configs — the atomic deployment unit for team and enterprise tooling.

### 12.1 Directory Layout

```
my-plugin/
├── .claude-plugin/
│   ├── plugin.json          # manifest (only "name" required)
│   └── marketplace.json     # for marketplace publishers
├── commands/                # *.md slash commands (legacy; prefer skills/)
├── agents/                  # subagent .md definitions
├── skills/<name>/SKILL.md   # skills
├── hooks/
│   └── hooks.json           # plugin-scoped hooks
├── monitors/                # background monitors (auto-arm at session start)
├── bin/                     # executables added to Bash PATH (v2.1.91)
├── themes/                  # named themes (v2.1.118)
├── lib/                     # shared libraries for skill scripts
├── output-styles/           # output format styles
├── settings.json            # plugin-level config defaults
├── .mcp.json                # MCP servers bundled with plugin
├── .lsp.json                # LSP server configs
└── README.md
```

### 12.2 plugin.json

```json
{
  "$schema": "...",
  "name": "deployment-toolkit",
  "version": "1.2.0",
  "description": "Deploy and rollback workflows for our cloud infra",
  "author": { "name": "Platform Team" },
  "homepage": "https://internal.example.com/docs/deployment-toolkit",
  "license": "MIT",
  "keywords": ["deploy", "rollback", "kubernetes"],
  "category": "devops",
  "dependencies": [
    { "plugin": "git-toolkit", "version": ">=1.0.0" }
  ],
  "userConfig": [
    { "name": "envName", "type": "string", "required": false,
      "description": "Deployment environment (staging/production)" }
  ],
  "mcpServers": {
    "deploybot": { "command": "deploybot-mcp" }
  },
  "strict": true
}
```

`${user_config.envName}` and `${CLAUDE_PLUGIN_ROOT}` are interpolated at runtime. Sensitive config values are stored in the macOS Keychain or a protected `~/.claude/.credentials.json`.

### 12.3 Plugin Lifecycle

```bash
/plugin marketplace add anthropics/claude-plugins-official
/plugin install pr-review-toolkit@anthropic-bundled
/plugin update
/plugin list
claude plugin tag v1.0.0         # create release tag with version validation (v2.1.118)
claude plugin prune              # remove orphaned auto-installed deps (v2.1.121)
claude plugin validate           # validate plugin.json (v2.1.120: accepts $schema/version/description)
claude plugin marketplace list|add|remove|refresh
```

Marketplace state lives in `~/.claude/plugins/known_marketplaces.json`. Use `CLAUDE_CODE_PLUGIN_SEED_DIR` to pre-bake plugins into container images; multiple paths are separated by `:` (Unix) or `;` (Windows) since v2.1.92.

You can also declare plugin entries **inline in `settings.json`** without a separate marketplace, using `source: 'settings'` in the `extraKnownMarketplaces` block. This is useful for enterprise deployments where plugins are distributed through managed settings rather than a hosted git repository:

```jsonc
// settings.json — declare a plugin inline, no external marketplace required:
{
  "extraKnownMarketplaces": {
    "internal-tools": {
      "source": "settings",
      "plugins": [
        { "name": "deploy-toolkit", "version": "2.1.0",
          "path": "/opt/claude-plugins/deploy-toolkit" }
      ]
    }
  }
}
```

### 12.4 Enterprise Controls

`blockedMarketplaces` (with `hostPattern`/`pathPattern` enforcement fixed v2.1.119) and `strictKnownMarketplaces` prevent installs from non-approved sources. Both are enforced on install, update, refresh, and auto-update (v2.1.117). `enabledPlugins` in managed-settings forces plugins on for the whole organisation. Plugins force-enabled via managed settings can run hooks even when `allowManagedHooksOnly: true`.

---

## 13. Subagents — Isolated Context Execution

> **Version History:** Subagents (Task tool) available since v1.0. `isolation: worktree` for subagents GA in v2.1.49. `CLAUDE_CODE_FORK_SUBAGENT=1` (v2.1.117) enables forked subagents on external builds; non-interactive `-p`/SDK support added v2.1.121. Task tool renamed to "Agent" in v2.1.63 (Task alias preserved). Agent frontmatter fields `skills:`, `mcpServers:`, `hooks:` now ignored when running as a teammate (Agent Teams behavior). `isolation: worktree` subagents denied Read/Edit on own files — fixed v2.1.101. `maxTurns` in agent definition was capped at 50 (some previews documented 100; 50 is confirmed). `TaskOutput` tool deprecated — use `Read` on output file path.

A subagent is a temporary agent spawned via the **Task** tool. It has its own context window, its own system prompt, optionally its own tool allowlist and model, and **only the summary** is returned to the parent session.

### 13.1 Agent Definition Format

Create files at `~/.claude/agents/<name>.md` (user) or `.claude/agents/<name>.md` (project):

```markdown
---
name: code-reviewer
description: >
  Reviews code for security vulnerabilities, style violations, and logic bugs.
  Returns a prioritised, actionable report.
tools: [Read, Grep, Glob, Bash(git diff:*)]
disallowedTools: [Write, Edit]
model: claude-opus-4-7
effort: xhigh
permissionMode: acceptEdits
maxTurns: 20
mcpServers: ["github"]
skills: [security-review]
hooks:
  Stop: [{ type: command, command: "echo 'Review complete'" }]
isolation: worktree          # spawn in its own git worktree
cwd: "./src"                 # working directory override
initialPrompt: "Begin by reading the diff..."
background: false            # run as background task
---

You are a senior security engineer and code reviewer. Your goal is to identify
every issue in the provided code that could cause security vulnerabilities,
incorrect behaviour, or maintenance problems. ...
```

The `/agents` UI offers a **"Generate with Claude"** button to scaffold new subagent files.

### 13.2 Built-In Agents

- **Explore** — read-only; Haiku by default; codebase exploration and context gathering.
- **Plan** — gathers context for plan mode proposals.
- **general-purpose** — default for tasks that need both exploration and modification.

### 13.3 Key Behaviours

- Subagents do **not** inherit parent permissions automatically — pre-approve via `PreToolUse` hooks or settings rules.
- Subagents inherit MCP tools from dynamically-injected servers (fixed v2.1.101).
- `isolation: worktree` (v2.1.49) creates `.claude/worktrees/<auto-name>/`; the subagent can read and edit its own worktree files (fixed v2.1.101).
- `CLAUDE_CODE_FORK_SUBAGENT=1` (v2.1.117) enables forked subagents on external builds; v2.1.121 makes it work in non-interactive `-p`/SDK sessions.
- `TaskOutput` is deprecated — read the output file path directly with the `Read` tool.
- **Agent frontmatter NOT applied when running as a teammate:** `skills:`, `mcpServers:`, `hooks:` (except Stop/SubagentStop), `permissionMode:` are ignored when the agent runs as a teammate in Agent Teams.

---

## 14. Agent Teams (Experimental)

> **Version History:** Agent Teams research preview launched v2.1.32 (February 5, 2026). `TeamCreate` / `TaskCreate` / `TaskUpdate` / `TaskList` / `SendMessage` / `TeamDelete` tools added at launch. `TeammateIdle` hook event added post-launch. Known limitations: no session resumption with in-process teammates; only one team per session; no nested teams; VS Code extension support partial. Enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

Agent Teams coordinate **multiple Claude Code sessions** on a shared project, with true peer-to-peer messaging between teammates — unlike subagents which only report back to the lead.

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

### Agent Team Topology — Visual Overview

```
  ┌─────────────────────────────────────────────────────────────────────┐
  │                     AGENT TEAM ARCHITECTURE                        │
  └─────────────────────────────────────────────────────────────────────┘

        ┌──────────────┐
        │  LEAD AGENT  │  (primary Claude Code session)
        │  Opus 4.7    │  Orchestrates, coordinates, synthesizes
        └──────┬───────┘
               │  TeamCreate / TaskCreate / SendMessage / TeamDelete
               │  filesystem mailbox: ~/.claude/teams/{name}/inboxes/
     ┌─────────┼─────────────────────────┐
     │         │                         │
     ▼         ▼                         ▼
┌──────────┐ ┌──────────┐         ┌──────────┐
│Teammate 1│ │Teammate 2│   ...   │Teammate N│
│Sonnet 4.6│ │Haiku 4.5 │         │Sonnet 4.6│
│(frontend)│ │(testing) │         │(backend) │
└──────────┘ └──────────┘         └──────────┘

  vs. SubAgent (Task tool):
  Lead ──── Task(prompt, tools) ────► SubAgent
             one-way, fire-and-forget   returns single result
             new context, no inheritance
```

### 14.1 Architecture

- **Team lead** — main session that spawns teammates, assigns tasks, synthesises results.
- **Teammates** — full Claude Code sessions; isolated 1M context windows; load the same project CLAUDE.md, MCP, and skills but have no access to the lead's conversation history.
- **Shared task list** — stored at `~/.claude/tasks/{team-name}/`; tasks are claimed atomically via file locking to prevent double-assignment.
- **Mailbox** — `SendMessage(to, message)` enables peer-to-peer communication between any teammates.

### 14.2 Agent Teams Tools

These tools are always available to teammates even when `tools:` allowlists are otherwise restrictive:

```
Teammate(spawnTeam|cleanup)
SendMessage(message|broadcast|shutdown_request|shutdown_response|plan_approval_response)
TaskCreate / TaskUpdate / TaskList / TaskGet
```

### 14.3 Best Practices

Use plan mode first, review proposed roles, then approve the plan before spinning up the team. Include quality-bar instructions in the team's CLAUDE.md section: *"All code must have tests. No commits to main. Every PR must have a description."*

Note that every teammate runs a full Claude Code session with its own 1M context window. Token costs scale with team size. Agent Teams are best suited for genuinely parallel workloads — multi-component features, large-scale migrations, or independent research tasks — not for serial chains that could just be subagents.

### 14.4 Known Limitations

No session resumption with in-process teammates; task status can lag; shutdown waits for the current request to finish; only one team per session; no nested teams; VS Code extension support is partial.

---

## 15. Git Worktrees

> **Version History:** `--worktree` / `-w` CLI flag and `--tmux` added v2.1.50. `isolation: worktree` for subagents added v2.1.49. `EnterWorktree` / `ExitWorktree` tools available since v2.0; `path` parameter added v2.1.105. PR squash-merge cleanup added v2.1.105. Stale "already exists" error fixed v2.1.101. `workspace.git_worktree` in status-line JSON added v2.1.97. Stale worktree reuse fixed v2.1.118. `/update` and `/tui` broken after entering worktree mid-session fixed v2.1.116.

Git worktrees let you run multiple Claude sessions on the same codebase simultaneously, each on its own branch, with no risk of interfering with each other.

```bash
claude -w feature-auth          # creates .claude/worktrees/feature-auth/
claude -w feature-auth --tmux   # wraps the session in its own tmux session

# Run three features in parallel:
claude -w bugfix-login
claude -w new-dashboard
claude -w refactor-api
```

If no name is given, a random name is generated. The branch is named `worktree-<name>`.

Worktrees with no changes are automatically cleaned up at session exit and on next startup. Worktrees with changes persist until you explicitly discard them. v2.1.105 additionally cleans up worktrees whose associated PR was squash-merged.

The status-line JSON includes `workspace.git_worktree` (v2.1.97). `isolation: worktree` in a subagent definition runs that subagent in its own worktree automatically — powerful for parallel large-scale changes and code migrations.

**Notable version fixes:** v2.1.101 fixed "already exists" error after stale-directory cleanup; v2.1.116 fixed `/update` and `/tui` after entering a worktree mid-session; v2.1.118 fixed stale worktree reuse.

---

## 16. Remote Control

Remote Control creates a secure bridge between your local CLI session and claude.ai/code, the iOS app, and the Android app — giving you access to your full local environment, MCP servers, and file system from any device.

```bash
# Start remote control from within a session:
/remote-control
# or with a custom session name visible in claude.ai/code:
/remote-control my-macbook-session
# or:
/rc

# Start with a custom session name prefix:
claude --remote-control-session-name-prefix mybox
# or:
export CLAUDE_REMOTE_CONTROL_SESSION_NAME_PREFIX=mybox
```

The default session name is derived from your hostname: `myhost-graceful-unicorn`. The architecture is outbound-only HTTPS over the Anthropic API — no inbound ports are opened.

### 16.1 Remote Control vs `--remote`

These are different features:

- `--remote` creates a **cloud VM session** (Claude Code on the Web) with a fresh sandbox.
- `--remote-control` / `/remote-control` exposes your **local CLI session** for remote monitoring and control from any device.

### 16.2 Capabilities

When connected via Remote Control, you have access to: full local filesystem, all MCP servers configured locally, project CLAUDE.md and settings, `@`-file autocomplete (v2.1.113), push notifications (v2.1.110), and commands including `/context`, `/exit`, `/reload-plugins` (v2.1.110).

**Limitations:** One connection per session. A 10-minute network timeout. Permission rules still apply — `--dangerously-skip-permissions` does not bypass them from a remote connection. Requires Pro, Max, or Team Premium plan; Team/Enterprise admins must enable "Remote Control" toggle.

**Notable fixes:** v2.1.81 (generic title, /rename syncing); v2.1.108 (web-set titles overwritten by auto-titles); v2.1.116 (renames from claude.ai persist to local CLI; re-login when session too old); v2.1.113 (`@`-file autocomplete from remote, subagent transcript streaming).

---

## 17. Cloud Sessions (Web)

`claude.ai/code` runs each session in an isolated Anthropic-managed cloud sandbox. GitHub repositories can be linked, cloned, edited, tested, and proposed as PRs entirely from within the sandbox. Git credentials are routed through a proxy and never stored directly on the sandbox VM.

```bash
# Start a cloud session from the CLI:
claude --remote "Execute the plan in PLAN.md and open a PR"

# Monitor progress:
/tasks
```

### 17.1 Plan-Locally / Execute-Remotely Pattern

This is the most efficient pattern for large, complex tasks:

1. Use plan mode locally (cheap tokens; no file mutations; fast iteration).
2. Save the final plan to a file: `/copy` or write to `PLAN.md` and commit it.
3. Launch a cloud session: `claude --remote "Execute plan from PLAN.md"`.
4. Monitor progress from web or mobile.

`/ultraplan` (v2.1.101+) auto-creates a default cloud environment when invoked. You can also pull a cloud session back into your terminal with `claude --teleport`.

**Rollout status (May 2026):** GA for web/desktop/iOS on Pro/Max/Team/Enterprise. Cowork (the sibling knowledge-work agent product) is research preview on macOS/Windows Desktop for Max plans, expanded to enterprise in February 2026.

### 17.2 Computer Use in the Desktop App (Research Preview)

The Claude Desktop app introduced **Computer Use** capability in Week 17 of 2026 (approximately v2.1.114–v2.1.119 timeframe). When Computer Use is enabled, Claude Code can control your local desktop — moving the mouse, clicking UI elements, typing into applications, and capturing screenshots to observe the results — in addition to its usual file and shell access.

This is a research preview, not GA. It is available in the Claude Desktop app (macOS and Windows) for Max and eligible Team/Enterprise subscribers. The capability allows Claude to interact with GUI applications, web browsers, and desktop tools that have no CLI or API surface — for example, testing a UI by clicking through it, filling forms in an internal web app that requires SSO, or reading data from a legacy desktop application.

Computer Use in Claude Code is separate from the broader Anthropic Computer Use API. The integration is tightly scoped: Claude can only operate within the desktop session in which Claude Code is running, cannot access other user accounts, and all actions are subject to the same permission system and sandbox controls as other tools.

---

## 18. Sandbox & Security Model

`/sandbox` is **off by default**. When enabled, it provides OS-level filesystem and network isolation using the same primitives that power browser tab isolation.

### 18.1 Technology Stack

| OS | Technology |
|----|-----------|
| macOS | Apple Seatbelt (TrustedBSD MAC) via `sandbox-exec` |
| Linux / WSL2 | bubblewrap (`bwrap`) + `socat` for the proxy bridge |
| Windows native | Not supported — use WSL2 |

The `apply-seccomp` helper ships in both npm and native builds to restore Unix-socket blocking for sandboxed commands (v2.1.92).

### 18.2 Filesystem Isolation

Writes outside the working directory fail with `Operation not permitted` at the syscall level. This is not a policy — it is a kernel-level block with no escape path. `sandbox.filesystem.allowWrite` extends the writable area; `sandbox.filesystem.denyRead` restricts reads beyond the kernel sandbox.

> **Important gotcha:** `sandbox.filesystem.denyRead` does **not** affect Claude's `Read` tool — it only affects Bash subprocesses. To prevent Claude from reading files via the `Read` tool, use `permissions.deny`: `["Read(**/.env*)"]`.

### 18.3 Network Isolation

All traffic is routed through a localhost HTTP proxy (HTTPS via CONNECT) and a SOCKS5 proxy for non-HTTP tools. The proxy enforces `allowedDomains` and `deniedDomains`. Hosts not on the allowlist receive HTTP CONNECT 403. Tools that ignore proxy env vars are caught by a Seatbelt/bubblewrap backstop that blocks non-loopback traffic at the socket layer.

### 18.4 Process Isolation

All subprocesses inherit the same restrictions. `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` (v2.1.98) strips sensitive env vars from child process environments and enables PID namespace isolation on Linux. `CLAUDE_CODE_SCRIPT_CAPS` limits per-session script invocations via a JSON map of `{ scriptName: maxInvocations }`.

### 18.5 Security Hardening History (Verified in CHANGELOG)

- v2.1.34: `autoAllowBashIfSandboxed` Bash bypass closed.
- v2.1.38: writes to `.claude/skills` blocked in sandbox mode.
- v2.1.98: backslash-escape Bash auto-allow bypass; compound-command bypass; env-var-prefix prompt bypass; `/dev/tcp` redirect bypass — all patched.
- v2.1.113: wrapped-exec deny-rule matching (`env`, `sudo`, `watch`, `ionice`, `setsid`); `find -exec`/`-delete` no longer auto-approved by `Bash(find:*)`.
- v2.1.116: sandbox auto-allow can no longer bypass dangerous-path safety check for `rm`/`rmdir` on `/` or `$HOME`.
- v2.1.126: `allowManagedDomainsOnly`/`allowManagedReadPathsOnly` enforcement fixed when a higher-priority managed source lacks a `sandbox` block.

---

## 19. Permission System — Deep Dive

### 19.1 Permission Modes

| Mode | Behaviour |
|------|-----------|
| `default` | Prompt for every tool use |
| `acceptEdits` | Auto-approve all file edits |
| `plan` | Read-only analysis; no mutations |
| `auto` | Anthropic safety-classifier-gated auto approval (GA for Max + Opus 4.7, v2.1.111) |
| `bypassPermissions` | Auto-approve everything (gateable with `disableBypassPermissionsMode: "disable"`) |
| `dontAsk` | Deny anything not explicitly allowed |

Cycle modes with **Shift+Tab**. `--enable-auto-mode` flag is deprecated since v2.1.111 — auto mode no longer requires it.

### 19.2 Rule Format & Evaluation

Rules use `Tool(specifier)` syntax with gitignore-style glob patterns. Evaluation order: **deny → ask → allow → defaultMode**. First match wins. Deny rules cannot be overridden by lower scopes.

```jsonc
"permissions": {
  "allow": [
    "Bash(npm run *)",            // all npm run subcommands
    "Bash(git:*)",                // all git subcommands
    "Bash(find /src -name:*)",    // find in /src only (no -exec)
    "Read(**)",                   // all reads
    "Write(src/**)",              // writes inside src/
    "WebFetch(domain:github.com)" // only github.com
  ],
  "deny": [
    "Read(**/.env*)",             // never read .env files
    "Read(**/.ssh/**)",           // never read SSH keys
    "Bash(rm -rf *)",             // never rm -rf
    "Write(/etc/**)"              // never write to /etc
  ],
  "ask": [
    "WebFetch",                   // always ask for web fetches
    "Bash(curl:*)"                // always ask for curl
  ]
}
```

**Path type prefixes in rules:**

- `//abs/path` — absolute filesystem path
- `~/path` — relative to home directory
- `/project/path` — relative to the settings file location
- `./path` — relative to cwd at runtime

**Known gotchas:**

1. `Read(...)` deny rules apply to Read, Grep, Glob, and LS — but **not** to Bash subprocesses. To block Bash from reading a file, you need a separate `Bash(cat .env*)` deny rule.
2. MCP rules do **not** support parenthesised specifiers — use `mcp__server` or `mcp__server__tool` only.
3. `Bash(curl http://github.com *)` does not reliably restrict which URLs curl can access; URL restrictions in Bash rules are fragile.
4. `Task(AgentName)` restricts which subagent profiles can be spawned.
5. The **`:*` colon-prefix syntax** is the officially documented way to match a command prefix with any arguments: `Bash(npm run:*)` means "any `npm run` invocation regardless of what follows", while `Bash(npm run *)` uses a shell glob that matches `npm run ` followed by any string. They look similar but behave differently for commands with no arguments. When you want to allow all subcommands of a tool, prefer the colon form: `Bash(git:*)`, `Bash(npm:*)`, `Bash(docker compose:*)`.

### 19.3 Auto Mode Configuration

```jsonc
"autoMode": {
  "allow": ["$defaults", "Bash(npm test)"],
  // "$defaults" extends the built-in Anthropic classifier list (v2.1.118)
  // instead of replacing it — use this to add safe commands without
  // losing the built-in safety baseline
  "soft_deny": ["$defaults", "Bash(git push:*)"],
  "environment": { "NODE_ENV": "test" }
}
```

### 19.4 Enterprise Permission Controls

- `forceRemoteSettingsRefresh: true` blocks startup until the managed settings fetch succeeds — fail-closed (v2.1.92).
- `disableBypassPermissionsMode: "disable"` removes auto mode from the Shift+Tab cycle and rejects `--permission-mode auto` at startup.
- `allowManagedDomainsOnly` and `allowManagedReadPathsOnly` restrict network and read access to managed lists.

v2.1.110 fixed `updatedInput` from `PermissionRequest` hooks not being re-checked against `permissions.deny`, and `setMode: "bypassPermissions"` not respecting `disableBypassPermissionsMode`.

---

## 20. Models & Configuration

### 20.1 Available Models (May 2026)

| Model ID | Context | Best Use |
|----------|---------|----------|
| `claude-opus-4-7` | 1M | Most capable; complex reasoning; deep agentic coding; xhigh effort |
| `claude-opus-4-6` | 1M | Previous flagship |
| `claude-sonnet-4-6` | 1M | Default for Pro/Max — best balance |
| `claude-haiku-4-5` | 200K | Fast, cheap; routing, simple tasks, skill execution |

The 1M context beta on Sonnet 4 / 4.5 was retired **April 30, 2026**. All 1M models now work at standard pricing with no special headers.

**Claude Mythos Preview (Project Glasswing):** A cybersecurity-focused research preview model available invitation-only on Google Vertex AI. It is not available via the standard API or claude.ai subscription tiers. If you have been granted access, it is accessed through `CLAUDE_CODE_USE_VERTEX=1` with a specific model string provided in your invitation. This model is not listed in `/model` unless you have been granted access and the model string is explicitly configured.

**Token output limits (updated):** The default maximum output tokens for Claude Opus 4.6 was increased to **64K tokens**, and the upper bound for both Opus 4.6 and Sonnet 4.6 was raised to **128K tokens**. These increases apply to API, Bedrock, Vertex, and Foundry; Claude Code automatically benefits when the model supports it.

### 20.2 Switching Models

```bash
/model                          # interactive picker; persists across restarts (v2.1.117)
claude --model claude-opus-4-7
```

`/model` warns before switching mid-session because the next response re-reads history uncached. The startup header indicates when the active model comes from a project or managed pin (v2.1.117).

### 20.3 Effort Levels

```bash
/effort low      # fast, minimal reasoning; boilerplate/routine changes
/effort medium   # balanced; most day-to-day work
/effort high     # default for Pro/Max (v2.1.117); code design, debugging
/effort xhigh    # Opus 4.7 only; heavy architectural reasoning
/effort max      # maximum thinking budget
/effort auto     # Claude chooses per-turn
```

The underlying API parameter is `output_config.effort`. Exact token budget values are not published. `CLAUDE_CODE_EFFORT_LEVEL` overrides persistently.

### 20.4 Thinking Configuration

```jsonc
// settings.json
{
  "alwaysThinkingEnabled": true,   // force thinking on every turn
  "showThinkingSummaries": false    // show collapsed thinking summaries (default false)
}
```

```bash
export DISABLE_INTERLEAVED_THINKING=1    # disable entirely
# Per-session: Option+T / Alt+T to toggle
```

### 20.5 Model Environment Variables

`ANTHROPIC_DEFAULT_OPUS_MODEL_NAME`, `ANTHROPIC_DEFAULT_SONNET_MODEL_NAME`, `ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME` override model aliases. `ANTHROPIC_BASE_URL` gateway support added v2.1.118; `/model` now lists models from the `/v1/models` endpoint of a custom gateway (v2.1.126).

---

### 20.6 Advisor Tool (Experimental)

The Advisor Tool is one of the most architecturally significant features in Claude Code. It implements what Anthropic calls the **advisor strategy**: pair a fast, lower-cost **executor model** (e.g., Sonnet 4.6 or Haiku 4.5) with a higher-intelligence **advisor model** (e.g., Opus 4.7 or Opus 4.6) inside a single conversation. The executor runs the task end-to-end, calling tools and iterating toward a solution. When it reaches a decision it cannot reasonably solve — a complex architectural choice, a subtle bug, an ambiguous tradeoff — it calls the advisor. The advisor reads the full conversation transcript, produces a plan or course correction (typically 400–700 text tokens, 1,400–1,800 tokens total including thinking), and the executor resumes with that guidance.

#### 20.6.1 Architectural Constraints (Hard Boundaries)

The advisor model has **read-only access to the conversation history only**. It cannot call any tools, access the filesystem, run shell commands, fetch URLs, or interact with MCP servers. This is a hard architectural boundary enforced server-side — not a permission setting you can relax. The advisor exists purely as a reasoning layer over shared context.

Once the advisor responds, its guidance persists in the session context. Subsequent advisor calls see earlier advice, enabling a coherent advisory thread across a long task. If empirical results contradict what the advisor recommended, Claude Code surfaces the conflict explicitly rather than silently overriding it — you get a moment like *"the advisor said X, but the test output shows Y — should we consult again?"*

#### 20.6.2 Performance and Cost Data (Anthropic Benchmarks)

| Configuration | Benchmark | Score | vs. Baseline |
|---|---|---|---|
| Sonnet 4.6 alone | SWE-bench Multilingual | 72.1% | baseline |
| Sonnet 4.6 + Opus advisor | SWE-bench Multilingual | 74.8% | +2.7pp quality; 11.9% lower cost than Opus solo |
| Haiku 4.5 alone | BrowseComp | 19.7% | baseline |
| Haiku 4.5 + Opus advisor | BrowseComp | 41.2% | +21.5pp (>2×); 85% lower cost than Sonnet solo |

The cost advantage comes from the advisor generating only ~400–700 tokens per call, while the executor handles the bulk of generation at Sonnet/Haiku rates.

#### 20.6.3 Enabling in Claude Code

The `/advisor` slash command opens a configuration dialog where you select the advisor model. Once set, the advisor is automatically invoked by the executor model when needed — you do not manually trigger it per-turn.

```bash
/advisor         # opens advisor model selection dialog
                 # then select: e.g., "Opus 4.7" as the advisor
```

The dialog carries an **"experimental"** label with a learn-more link. A startup notification appears whenever the advisor is enabled for the current session (v2.1.117+). The UI validates supported pairings — if your main model does not support the advisor, Claude Code displays "The current main model does not support the advisor."

#### 20.6.4 Supported Model Pairings

| Executor (main model) | Supported Advisor models |
|---|---|
| `claude-sonnet-4-6` | `claude-opus-4-7`, `claude-opus-4-6` |
| `claude-haiku-4-5` | `claude-opus-4-7`, `claude-opus-4-6` |
| `claude-opus-4-7` | `claude-opus-4-7`, `claude-opus-4-6`, `claude-sonnet-4-6` |

> **Note:** The CLI's internal validation may be stricter than the raw API. Issue #46148 documents a case where Haiku 4.5 as executor was rejected by the CLI even though the API supports it. The API always accepts any pair that the `advisor-tool-2026-03-01` beta endpoint documents.

**Recommended pairing:** Sonnet 4.6 executor + Opus 4.6 or 4.7 advisor. This delivers near-Opus intelligence for the complex moments while paying Sonnet rates for the mechanical majority of turns. In typical agentic coding sessions, the advisor is called on 5–15% of turns.

#### 20.6.5 How It Works Under the Hood

At the API level, the Advisor Tool is a special beta tool type included in the `tools` array of a `/v1/messages` request. It requires the beta header `anthropic-beta: advisor-tool-2026-03-01`.

```python
import anthropic

client = anthropic.Anthropic()
response = client.beta.messages.create(
    model="claude-sonnet-4-6",        # executor model
    max_tokens=4096,
    betas=["advisor-tool-2026-03-01"],
    tools=[
        {
            "type": "advisor_20260301",
            "name": "advisor",
            "model": "claude-opus-4-7",   # advisor model
            # "max_uses": 3,              # optional cap on advisor calls per request
        }
    ],
    messages=[
        {"role": "user", "content": "Build a concurrent worker pool in Go with graceful shutdown."}
    ],
)
```

```typescript
// TypeScript equivalent:
const response = await client.beta.messages.create({
    model: "claude-sonnet-4-6",
    maxTokens: 4096,
    betas: ["advisor-tool-2026-03-01"],
    tools: [{ type: "advisor_20260301", name: "advisor", model: "claude-opus-4-7" }],
    messages: [{ role: "user", content: "Build a concurrent worker pool in Go." }],
});
```

When the executor decides to consult the advisor, it emits a `server_tool_use` block with `name: "advisor"` and empty input. The server runs a separate inference pass on the advisor model, passing the full conversation transcript, and returns an `advisor_tool_result` block with the advisor's guidance. The executor then continues.

#### 20.6.6 Multi-Turn Conversations — Critical Rule

`advisor_tool_result` blocks **must be preserved verbatim** in every subsequent turn of the conversation. If you omit the advisor tool from `tools` on a follow-up turn while `advisor_tool_result` blocks are still in the message history, the API returns a `400 invalid_request_error`. If you want to stop using the advisor mid-conversation, you must strip all `advisor_tool_result` blocks from the history at the same time as you remove the tool from the `tools` array.

```python
# Multi-turn example — round-trip advisor_tool_result blocks:
messages.append({"role": "assistant", "content": response.content})
messages.append({"role": "user", "content": "Now add a max-in-flight limit of 10."})

response = client.beta.messages.create(
    model="claude-sonnet-4-6",
    max_tokens=4096,
    betas=["advisor-tool-2026-03-01"],
    tools=[{"type": "advisor_20260301", "name": "advisor", "model": "claude-opus-4-7"}],
    messages=messages,   # includes advisor_tool_result blocks from previous turn
)
```

#### 20.6.7 Behavior Details

Several behaviors are important to understand. First, **advisor output does not stream** — expect a visible pause in the response stream while the sub-inference runs on the advisor model. Second, **`max_tokens` applies to executor output only** and does not bound advisor tokens. Third, **there is no built-in per-conversation cap** on advisor calls — track and cap them client-side if you have a budget (or use the `max_uses` field in the tool definition). Fourth, **enable prompt caching only when you expect three or more advisor calls** per conversation, because the cache write cost is only justified when you get multiple cache hits.

#### 20.6.8 Billing, Rate Limits, and ZDR

Advisor tokens are billed at each model's standard per-token rate. The executor (Sonnet/Haiku) generates at its lower rate; the advisor (Opus) generates the advisory response at the Opus rate. Advisor tokens are broken out separately in the `usage` object under `usage.iterations[]` for clean cost attribution.

Rate limits for the advisor draw from the same per-model bucket as direct calls to that model. A rate limit hit on the advisor surfaces as `too_many_requests` inside the `advisor_tool_result` block — the executor sees this and continues without advice rather than failing the whole request. A rate limit on the executor fails the entire request with HTTP 429 as normal.

This feature is eligible for **Zero Data Retention (ZDR)**. When your organisation has a ZDR arrangement, data sent through the advisor tool is not stored after the API response is returned. Contact your Anthropic account team to request ZDR coverage for the advisor feature. The beta header `advisor-tool-2026-03-01` is accessible with no special waitlist — any API key can include it.

#### 20.6.9 Best Practices

For coding agents, pair Sonnet 4.6 at medium effort as executor with Opus as advisor. The cost math is compelling: Sonnet executes the mechanical 85–90% of turns cheaply, while Opus handles only the hard decisions. For maximum intelligence regardless of cost, keep the executor at default effort — combining high-effort Sonnet with Opus advisor provides diminishing returns over default-effort Sonnet + Opus.

When budgeting, count advisor calls at **Opus input/output pricing** (not Sonnet pricing), since each advisor invocation runs a full Opus inference pass. Plan for 400–700 additional output tokens and 1,400–1,800 total tokens per advisor call.

#### 20.6.10 Known Bug and Fix

A critical stability bug (issue #49994) caused sessions that had used the advisor tool to become unrecoverable: every subsequent prompt returned `400 "Advisor tool result content could not be processed"`, and `/compact` failed with the same error. This was fixed in **v2.1.126**. Sessions created between v2.1.105 and v2.1.112 that used the advisor and are now broken can only be recovered by editing the session JSONL file to remove the malformed `advisor_tool_result` blocks manually.

---

## 21. Context & Memory Management

| Action | Effect | Notes |
|--------|--------|-------|
| `/context` | Show token usage grid | Native dialog in VS Code (v2.1.121) |
| `/compact [hint]` | Compress conversation; preserves cache prefix | Fork-based; cache reuse continues |
| `/clear` | Reset context | Hint shows current context size (fixed v2.1.119) |
| `/recap` | Manual session recap | Auto-recap on return (v2.1.108) |
| `/resume` picker | Session browser | Ctrl+A for all projects; 67% faster on 40MB+ (v2.1.116) |

`autoCompactThreshold` (setting) or `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` (env) controls the auto-compact trigger. `DISABLE_COMPACT=1` opts out entirely.

The `/resume` picker offers to summarise stale large sessions before reloading (v2.1.117). When a session's prompt cache expires, Pro users see a footer hint with the uncached token count (v2.1.108).

**Brief mode in focus mode:** Claude writes more self-contained summaries since it knows only the final message is visible (v2.1.97).

**Auto memory:** durable facts are extracted from sessions and proposed for addition to `CLAUDE.md`. Available on all tiers. Stored in `~/.claude/projects/<project-hash>/memory/MEMORY.md` (machine-local; satellite topic files supported); truncated at 25KB / 200 lines, whichever comes first (v2.1.85). The `/memory` command opens the memory editor directly.

### 21.1 Checkpoint System

Introduced in v2.0.0, the checkpoint system automatically saves the state of your session at each turn, giving you a true undo/redo history rather than just a single rollback.

**Retention:** checkpoints are kept for **30 days**.

**Checkpoint types** — three modes control what is included in each saved checkpoint. You configure this in `/config` under "Checkpoint mode":

The **chat-only** mode saves the conversation transcript but not file changes. This is the lightest option, useful when you want to be able to re-read earlier reasoning without necessarily reverting code.

The **code-only** mode saves file changes (as a git-like snapshot of modified files) but not the conversation. This is useful when you care about reverting code to a prior state but don't need the dialogue.

The **both** mode (the default) saves both the conversation transcript and the associated file changes together, giving you a fully consistent rollback point that restores both the code and the context simultaneously.

**Accessing checkpoints:**

```bash
Esc Esc           # immediately rewind the last turn (reverts files and conversation)
/rewind           # alias for the same action
/undo             # alias (added v2.1.108)
```

When you rewind, Claude Code restores the files that were modified during that turn to their prior state, then removes the last turn from the conversation. You can rewind multiple times consecutively to go further back.

---

## 22. IDE Integrations

### 22.1 VS Code (Also Cursor / Windsurf)

The VS Code extension offers inline diffs, `@`-mention autocomplete, plan review, and full conversation history. Notable features by version:

- v2.0.5: IME fix (unintended Enter/Tab submission blocked)
- v2.1.79: `/remote-control` supported in VS Code
- v2.1.116: scroll sensitivity configuration via `/terminal-setup`
- v2.1.120: `/usage` opens a native Account & Usage dialog
- v2.1.121: `/context` opens a native token usage dialog; `/skills` and `/plugin` panels; LSP diagnostics expand on click/Ctrl+O; voice dictation respects `accessibility.voice.speechLanguage` if no Claude Code `language` setting is configured
- Spinner turns red with *"Not responding"* after ~30 seconds of backend silence

### 22.2 JetBrains

Full support across IntelliJ IDEA, PyCharm, WebStorm, GoLand, RubyMine, PHPStorm, CLion, Rider, and AppCode via the JetBrains Marketplace plugin.

### 22.3 LSP Integration

`.lsp.json` at the project root or in a plugin configures language server detection. `clientInfo` in the initialize request identifies Claude Code to language servers (v2.1.98). This enables "go to definition" and "find references" for precise code navigation in TypeScript, Python, Go, and Rust.

```bash
claude --debug /hooks    # view registered hooks in an IDE session
```

---

## 23. GitHub & CI/CD Integration

### 23.1 claude-code-action

The official GitHub Action is at `anthropics/claude-code-action`. Current major version: v1.0+.

**Complete input reference:**

```yaml
- uses: anthropics/claude-code-action@v1
  with:
    # Authentication (one of):
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}

    # Trigger configuration:
    trigger_phrase: "@claude"        # default
    label_trigger: "claude-review"   # trigger on label
    assignee_trigger: "claude-bot"   # trigger on assignee

    # Prompt:
    prompt: "Review this PR for security issues and suggest improvements"
    claude_args: "--effort high --model claude-opus-4-7"

    # Optional:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    additional_permissions: "actions: read"
    use_sticky_comment: true
    use_commit_signing: true
    track_progress: true
    bot_id: "my-org-claude"
    bot_name: "My Org Claude"
    include_fix_links: true
    show_full_output: false
    plugins: "pr-review-toolkit@anthropic"
    plugin_marketplaces: "anthropics/claude-plugins-official"
    confirmed: false    # require explicit confirmation before acting

    # Cloud providers:
    use_bedrock: false
    use_vertex: false
    use_foundry: false
```

**v0.x → v1.0 breaking changes:** `mode`, `direct_prompt`, `override_prompt` → unified `prompt`; `custom_instructions`, `model`, `allowed_tools`, `mcp_config`, `claude_env`, `disallowed_tools`, `anthropic_model`, `timeout_minutes` → `claude_args` with CLI format.

The action skips draft PRs and already-reviewed PRs by default. `@claude` can be mentioned in issue comments, PR review comments, PR reviews, and newly opened/assigned/labelled issues.

### 23.2 Non-Interactive CI with `claude ultrareview`

```bash
# Run a multi-agent code review from CI without interactive prompts (v2.1.120):
claude ultrareview --json > review.json
claude ultrareview "https://github.com/owner/repo/pull/123" --json
# Exit code: 0 = success, 1 = failure
```

### 23.3 Code Review Analytics

The Code Review analytics dashboard (GA 2026) tracks: PRs reviewed, time saved, false-positive rate, monthly cost, and per-comment resolution rate. A monthly spend cap can be configured per-repository via Code Review settings in your organisation.

### 23.4 GitLab CI/CD Integration

Claude Code works in GitLab CI/CD pipelines through the `--print` / `-p` headless mode. There is no dedicated official GitLab Action (equivalent to `anthropics/claude-code-action` for GitHub), but the CLI runs cleanly in any GitLab Runner that has the native binary installed.

A minimal `.gitlab-ci.yml` example that runs a code review on merge requests:

```yaml
claude-review:
  stage: review
  image: ubuntu:24.04
  before_script:
    - curl -fsSL https://claude.ai/install.sh | bash
    - export PATH="$HOME/.local/bin:$PATH"
  script:
    - |
      claude -p \
        --output-format json \
        --exclude-dynamic-system-prompt-sections \
        --max-budget-usd 2.00 \
        --allowedTools "Read,Grep,Glob" \
        "Review the changes in this merge request for security issues, logic errors, and style violations. Output a JSON summary with keys: issues (array), severity (low|medium|high), summary (string)." \
        > review.json
      cat review.json
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
```

The `--from-pr` flag (v2.1.119) supports GitLab merge request URLs directly for resuming linked sessions:

```bash
claude --from-pr "https://gitlab.com/org/repo/-/merge_requests/42" \
  -p "Continue the review from where we left off"
```

### 23.5 Bitbucket Pipelines Integration

The same headless pattern applies to Bitbucket Pipelines. Install the native binary in the `before-script` step and invoke `claude -p`. The `--from-pr` flag also accepts Bitbucket pull request URLs (v2.1.119):

```yaml
# bitbucket-pipelines.yml
pipelines:
  pull-requests:
    '**':
      - step:
          name: Claude Code Review
          script:
            - curl -fsSL https://claude.ai/install.sh | bash
            - export PATH="$HOME/.local/bin:$PATH"
            - claude -p
                --output-format text
                --max-budget-usd 1.50
                --allowedTools "Read,Grep,Glob"
                "Review this PR for bugs and security issues"
          caches:
            - node
```

> **Stability note:** For production CI/CD on all platforms, pin to a specific Claude Code version (`claude install 2.1.126`) rather than always installing the latest, since Claude Code ships 2–3 versions per week and new versions occasionally introduce regressions (e.g., v2.1.120's `--resume`/`--continue` crash, fixed in v2.1.121).

---

## 24. Prompt Caching Architecture

Understanding prompt caching is critical for cost control in Claude Code. The stable prefix of every request (system prompt, tool definitions, CLAUDE.md, recent assistant turns) is cached server-side. Subsequent requests that share the same prefix pay only the **cache read** price (0.1× input cost) rather than the full input price.

### 24.1 TTL and Controls

| Scenario | TTL |
|----------|-----|
| Default (no subscription) | 5 minutes |
| Subscriber with `ENABLE_PROMPT_CACHING_1H=1` | 1 hour |
| `FORCE_PROMPT_CACHING_5M=1` | 5 minutes (forced) |
| `DISABLE_PROMPT_CACHING=1` | Caching disabled (startup warning) |

`ENABLE_PROMPT_CACHING_1H` replaces the deprecated `ENABLE_PROMPT_CACHING_1H_BEDROCK` and works across all providers.

### 24.2 Fork Architecture

When you run `/compact` or `/branch`, the fork inherits the same cached prefix, so KV cache reuse continues immediately after compaction without a cold-start penalty. v2.1.118 fixed an issue where `/branch` wrote a full conversation copy instead of a pointer, causing unnecessary cache invalidation.

### 24.3 Optimising for Cache Hits

```bash
# Move dynamic content (cwd, env, memory, git status) to the first user message:
claude --exclude-dynamic-system-prompt-sections

# Check cache hit rate:
/usage   # shows cache_read_tokens / cache_creation_tokens breakdown

# Example: maximising cache hits in CI/CD
claude -p \
  --exclude-dynamic-system-prompt-sections \
  --output-format json \
  --max-budget-usd 2.00 \
  "Run the full test suite and fix any failures"
```

### 24.4 Pricing

| Token type | Price (relative to input) |
|-----------|--------------------------|
| Cache read | 0.10× input price |
| 5-min cache write | 1.25× input price |
| 1-hr cache write | ≈ 2× input price (varies by model) |

For Opus 4.7: input $5/MTok, 1-hr cache write ≈ $10/MTok, cache read $0.50/MTok.

---

## 25. Pricing & Plans

### 25.1 Subscription Plans (May 2026)

| Plan | Monthly Price | Claude Code Access | Key Features |
|------|--------------|:---:|------|
| Free | $0 | ❌ | Claude.ai chat only |
| Pro | $20 (or $17/mo annual) | ✅ | Sonnet 4.6; limited Opus |
| Max 5× | $100/mo | ✅ | ≈5× Pro session usage |
| Max 20× | $200/mo | ✅ | ≈20× Pro usage; Opus 4.7 + xhigh; Auto Mode |
| Team Standard | $25/seat/mo annual; $30/mo | ❌ | 1.25× Pro usage; no Claude Code |
| Team Premium | $100/seat/mo annual; $125/mo | ✅ | 6.25× Pro usage; Claude Code included; min 5 seats |
| Enterprise | Custom annual | ✅ | 500K context; HIPAA; SCIM/SSO; audit logs; Cowork |

### 25.2 API Pricing (Pay-as-you-go)

| Model | Input ($/MTok) | Output ($/MTok) | Batch discount |
|-------|---------------|----------------|----------------|
| Opus 4.7 / 4.6 | $5 | $25 | 50% |
| Sonnet 4.6 | $3 | $15 | 50% |
| Haiku 4.5 | $1 | $5 | 50% |

For Sonnet 4.6 with >200K input tokens: $6 in / $22.50 out.

Cache reads: 10% of input price. Cache writes (5-min): 1.25× input. Cache writes (1-hr): ≈2× input.

### 25.3 Cost Controls

```bash
# Hard per-session spending cap (graceful stop when exceeded):
claude --max-budget-usd 5.00 "Refactor the auth module"

# Hard turn limit:
claude --max-turns 10 "Fix all failing tests"

# View live cost:
/usage
```

Model selection strategy: Haiku for routing and simple tasks, Sonnet for the default workload, Opus 4.7 for the hardest 10–15% of tasks. `CLAUDE_CODE_EFFORT_LEVEL` sets the global effort default without needing to pass `--effort` every time.

---

## 26. OpenTelemetry & Observability

### 26.1 Enabling OTEL

```bash
export CLAUDE_CODE_ENABLE_TELEMETRY=1
export CLAUDE_CODE_ENHANCED_TELEMETRY_BETA=1   # enable tracing
export OTEL_METRICS_EXPORTER=otlp
export OTEL_TRACES_EXPORTER=otlp
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer ${MY_TOKEN}"
```

### 26.2 Span Types & Key Attributes

| Span | Type | Key Attributes |
|------|------|----------------|
| `query` | ROOT | `session_id`, `prompt_id`, `service_name`, `service_version` |
| `api_request` | CLIENT | `model`, `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_creation_tokens`, `cost_usd`, `stop_reason`, `gen_ai.response.finish_reasons`, `effort` (v2.1.117) |
| `tool_result` | INTERNAL | `tool_name`, `duration_ms`, `success`, `tool_use_id`, `tool_input_size_bytes` |
| `tool_decision` | INTERNAL | `tool_name`, `decision_type`, `decision_source` |
| `interaction` | ROOT | Wraps full turns in concurrent SDK calls |

**Additional span attributes added across versions:** `user_system_prompt` (v2.1.121, gated by `OTEL_LOG_USER_PROMPTS`), `invocation_trigger` (v2.1.126: `"user-slash"` / `"claude-proactive"` / `"nested-skill"`), `command_name` and `command_source` (v2.1.117).

**Events:** `claude_code.skill_activated` (v2.1.126 — fires for user-typed slash commands), `claude_code.at_mention` (v2.1.122 — fires on `@`-mention resolution).

### 26.3 TRACEPARENT Injection

When OTEL tracing is on, W3C `TRACEPARENT` and `TRACESTATE` are injected into Bash subprocess environments (v2.1.97). This means that if your build scripts, test runners, or deployment scripts emit their own OTEL spans, those spans will automatically parent to Claude Code's trace tree.

```bash
# In your shell scripts, this now has a valid parent span:
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
# $TRACEPARENT is already set by Claude Code
```

The SDK reads `TRACEPARENT`/`TRACESTATE` from the environment for distributed trace linking (v2.1.110).

### 26.4 Full-Body Logging

```bash
OTEL_LOG_RAW_API_BODIES=1           # log inline (first 60KB)
OTEL_LOG_RAW_API_BODIES=file:/tmp/traces   # write full bodies to disk
```

---

## 27. Voice Mode

Voice mode enables push-to-talk input directly in the CLI.

```jsonc
// settings.json
{ "voiceEnabled": true }
```

```bash
/voice           # toggle voice mode
# Option+P / Alt+P — push-to-talk (hold key, release to send)
```

v2.1.79 fixed voice mode not activating on startup when `voiceEnabled: true` was set. v2.1.122 added an error when the voice key is bound to Caps Lock (terminals cannot deliver Caps Lock as a key event). v2.1.121 ensured VS Code voice dictation respects `accessibility.voice.speechLanguage` when no `language` is configured in Claude Code settings.

**Supported STT languages (20 total as of v2.1.101+):** English, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese (Mandarin), Hindi, Russian, Polish, Turkish, Dutch, Ukrainian, Greek, Czech, Danish, Swedish, Norwegian. The `language` setting in `settings.json` controls which language Claude transcribes. If unset, the VS Code `accessibility.voice.speechLanguage` setting is used as a fallback.

---

## 28. Multi-Directory Workspaces

Claude Code can work across multiple repositories or directories in a single session.

```bash
# Add at startup:
claude --add-dir ../backend-api --add-dir ~/company/shared-configs

# Add mid-session:
/add-dir ../backend-api
/add-dir ~/company/shared-configs --remember   # persist across sessions
```

The current working directory is always included. CLAUDE.md files from added directories are not loaded automatically unless `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`. Skills in `<added>/.claude/skills/` are loaded automatically.

---

## 29. Keyboard Shortcuts

| Key | Action | Version |
|-----|--------|---------|
| `Tab` | Command/file completion | |
| `↑` | Command history navigation | |
| `/` | Slash command picker | |
| `@` | File / URL mention autocomplete | |
| `!` | Enter bash mode with leading `!` | v2.1.89 |
| `#` | Quick memory entry | |
| `Esc` | Interrupt current response | |
| `Esc Esc` | Rewind last turn | |
| `Ctrl+C` | Cancel / exit | Fixed in -p mode (v2.1.79) |
| `Ctrl+R` | Prompt history search | |
| `Shift+Tab` | Cycle permission modes | |
| `Ctrl+B` | Background a running tool | |
| `Ctrl+G` | Open prompt in external editor | |
| `Ctrl+O` | Focus view toggle / expand collapsed tool call | v2.1.97 |
| `Ctrl+L` | Force redraw (does not clear input since v2.1.126) | v2.1.111 |
| `Ctrl+A` / `Ctrl+E` | Start / end of logical line in multiline | v2.1.113 |
| `Cmd+Backspace` / `Ctrl+U` | Delete to start of line | Changed to clear whole buffer v2.1.111 |
| `Ctrl+Y` | Restore deleted input (after Ctrl+U) | v2.1.111 |
| `Ctrl+_` | Undo | Kitty protocol fix v2.1.116 |
| `Ctrl+A` | All projects in `/resume` picker | |
| `Ctrl+X Ctrl+K` | Stop all background agents | Changed from Ctrl+F (v2.1.x) |
| `Option+T` / `Alt+T` | Toggle Extended Thinking | |
| `Option+P` / `Alt+P` | Voice / model picker toggle | |
| `Shift+↑/↓` | Scroll viewport while extending selection | v2.1.113 |
| `Shift+↑/↓` | Switch teammate views in agent teams | |
| `PgUp` / `PgDn` | Scroll fullscreen dialogs | v2.1.121 |
| `v` / `V` | Vim visual / visual-line mode | v2.1.118 |
| `w` | Write selection to file (in `/copy`) | v2.1.111 |
| `f` | Auto-fix issues (in `/doctor`) | v2.1.105 |
| `Spacebar` | Show QR code (in `claude remote-control`) | |
| `Cmd+Enter` / `Ctrl+Enter` | Submit in IDE extensions | Remap via `~/.claude/keybindings.json` |
| Paste (image) | Paste an image directly into the prompt for Claude to read | Images >2000px are auto-downscaled; oversized images already in session history are removed and the request retried automatically |

---

## 30. Plan Mode

Plan mode is a safe exploration mode where Claude reads files and runs read-only commands but **does not write to source files or run mutating shell commands.** It produces a written proposal; you review it and authorise execution only when satisfied.

### 30.1 Entering Plan Mode

```bash
# At startup:
claude --permission-mode plan "Redesign the caching layer"

# Mid-session:
/plan
/plan "Refactor the payment service to use Stripe's new API"
# The optional description starts plan execution immediately (v2.1.111)

# Cycle to plan mode with:
# Shift+Tab
```

Tools allowed in plan mode: `Read`, `Glob`, `Grep`, `WebFetch`, `WebSearch`, `Task` (with read-only agents). `Edit`, `Write`, `Bash` require exiting plan mode.

Plans are written to `<repo>/plans/` with names derived from the prompt (e.g., `fix-auth-race-snug-otter.md`) since v2.1.111.

### 30.2 Plan-Locally / Execute-Remotely Pattern

```bash
# Step 1: plan locally (cheap tokens, no file mutations)
claude --permission-mode plan "Migrate PostgreSQL schema to TimescaleDB"

# Step 2: review the plan in plans/ and approve it

# Step 3: execute in the cloud
claude --remote "Execute the plan in plans/migrate-timescaledb-*.md"
```

`/ultraplan` (v2.1.101) hands the plan off to a parallelised multi-agent cloud workflow for large, complex tasks. v2.1.47 fixed plan mode being lost after context compaction. v2.1.119 fixed `/plan open` not acting on the existing plan when re-entering plan mode.

---

## 31. Version Release Timeline

Below is a condensed timeline of every major milestone. The complete, line-by-line changelog is at `code.claude.com/docs/en/changelog`.

| Version | Date | Key Features |
|---------|------|-------------|
| v0.2.x | Feb–Apr 2025 | Initial research preview; core tool loop; `/init`, `/clear`, `/compact` |
| v1.0.0 | May 2025 | GA with Claude 4; permission system; CLAUDE.md; Skills |
| v1.0.x | May–Sep 2025 | 126+ patches: Bedrock/Vertex, MCP, hooks, subagents, GitHub Action v0→v1 |
| v2.0.0 | Sep 29, 2025 | Major rebuild: native VS Code extension; checkpoint system (`/rewind`, Esc+Esc); background tasks (Ctrl+B); Agent SDK renamed; Sonnet 4.5 default |
| v2.0.5 | ~Oct 2025 | IDE IME fix; OAuth expiration handling |
| v2.0.x | Oct–Nov 2025 | 76 patches: plugin system preview, sandbox, 1M context, native binary distribution |
| v2.1.0 | Dec 2025 | Plugin system stable; `context: fork` for skills |
| v2.1.32 | Feb 5, 2026 | Agent Teams research preview GA (with Opus 4.6 launch) |
| v2.1.34 | Feb 2026 | Sandbox `autoAllowBashIfSandboxed` Bash bypass fix |
| v2.1.38 | Feb 2026 | `.claude/skills` write protection in sandbox |
| v2.1.47 | ~Feb 2026 | Plan mode + compaction fix; image pasting WSL2; CJK wide chars; `alwaysThinkingEnabled` on Bedrock/Vertex |
| v2.1.49 | Feb 2026 | Subagent `isolation: worktree` GA |
| v2.1.50 | Feb 19, 2026 | `--worktree` CLI flag; `--tmux`; native worktree flow |
| v2.1.51 | ~Mar 2026 | Remote Control launch |
| v2.1.76 | ~Mar 2026 | MCP elicitation; ~600 tokens saved per `/resume` |
| v2.1.77 | ~Mar 2026 | `/branch` (renames `/fork`); `allowRead` sandbox setting |
| v2.1.79 | ~Mar 2026 | `--console`; turn-duration toggle; voice mode startup fix; `Ctrl+C` in `-p` mode |
| v2.1.81 | ~Mar 2026 | `/btw` fix; recap improvements; Remote Control title/rename sync; MCP read/search collapsing |
| v2.1.85–86 | Mar 26–27 | `CLAUDE_CODE_MCP_SERVER_NAME`/`URL` hooks env; memory leak fixes |
| v2.1.89 | Apr 1, 2026 | PreToolUse `defer`; `PermissionDenied` hook; `TaskCreated` hook; autocompact thrash-loop guard; `--resume` cache-miss fix |
| v2.1.90 | Apr 2, 2026 | SSE quadratic→linear fix; `.husky` protection; PowerShell hardening |
| v2.1.91 | Apr 3, 2026 | MCP `_meta["anthropic/maxResultSizeChars"]` (500K); `disableSkillShellExecution`; plugin `bin/` on PATH |
| v2.1.92 | Apr 4, 2026 | Bedrock setup wizard; `forceRemoteSettingsRefresh`; per-model cache-hit `/cost` breakdown; `/release-notes` interactive picker; `apply-seccomp` shipped; multiple `CLAUDE_CODE_PLUGIN_SEED_DIR` |
| v2.1.94 | Apr 7, 2026 | `CLAUDE_CODE_USE_MANTLE`; default effort → high for API/Bedrock/Vertex/Team/Enterprise; `sessionTitle` hook output |
| v2.1.97–98 | Apr 8–9, 2026 | Vertex setup wizard; Monitor tool; `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB`; `CLAUDE_CODE_SCRIPT_CAPS`; `--exclude-dynamic-system-prompt-sections`; W3C TRACEPARENT in Bash; `workspace.git_worktree`; `clientInfo` LSP; major Bash security hardening |
| v2.1.101 | Apr 10, 2026 | `/team-onboarding`; OS CA certificate trust by default; `/ultraplan` auto-creates cloud env; `mcp serve` `outputSchema` fix; subagent worktree read/edit fix; Bedrock SigV4 fix; `/resume` picker improvements |
| v2.1.105 | Apr 13, 2026 | EnterWorktree `path` param; PreCompact hook block; plugin `monitors/`; skills description cap 250→1536; stalled-stream watchdog; WebFetch strips `<style>`/`<script>` |
| v2.1.108 | Apr 14, 2026 | `ENABLE_PROMPT_CACHING_1H`; `/recap` + `CLAUDE_CODE_ENABLE_AWAY_SUMMARY`; `/undo` alias; built-in commands via Skill tool; pro cache-expiry footer hint |
| v2.1.110 | Apr 15, 2026 | `/tui`; push notifications; `autoScrollEnabled`; SDK reads TRACEPARENT; `PermissionRequest` hook fixes |
| v2.1.111 | Apr 16, 2026 | Opus 4.7 + xhigh effort; auto mode for Max + Opus 4.7; `/effort` slider; `/less-permission-prompts`; `/ultrareview`; `--enable-auto-mode` deprecated; PowerShell progressive rollout; `/plan` description arg; plans saved to `plans/` |
| v2.1.113 | Apr 17, 2026 | Native binary via per-platform optional dep; `sandbox.network.deniedDomains`; Bash deny-rule wrapper matching; `find -exec` bypass fix; `Ctrl+A`/`Ctrl+E` multiline; macOS `/private/*` dangerous paths |
| v2.1.114 | Apr 18, 2026 | Agent Teams teammate permission dialog crash fix |
| v2.1.116 | Apr 20, 2026 | `/resume` 67% faster on 40MB+ sessions; deferred MCP `resources/templates/list`; thinking spinner inline; `/doctor` while responding; new CDN URL; Devanagari rendering fix; sandbox rm-safety bypass closed |
| v2.1.117 | Apr 22, 2026 | `CLAUDE_CODE_FORK_SUBAGENT`; `--agent` loads mcpServers; native bfs/ugrep; `/model` persistence; OTEL `effort` attr; Opus 4.7 1M-context fix; default effort `high` for Pro/Max on Opus 4.6/Sonnet 4.6 |
| v2.1.118 | Apr 23, 2026 | Vim visual mode; `/cost`+`/stats`→`/usage`; named themes; `mcp_tool` hooks; `DISABLE_UPDATES`; `wslInheritsWindowsSettings`; `"$defaults"` in autoMode; `claude plugin tag`; `/branch` writes pointers |
| v2.1.119 | Apr 23, 2026 | `/config` persists to settings; `prUrlTemplate`; `CLAUDE_CODE_HIDE_CWD`; `--from-pr` multi-VCS; `--agent` honours `permissionMode`; PostToolUse `duration_ms`; OTEL `tool_use_id`/`tool_input_size_bytes`; MCP 500K result size; Write diff 60% faster; `apply-seccomp` npm+native |
| v2.1.120 | Apr 28, 2026 | Windows PowerShell fallback shell; `claude ultrareview` non-interactive; `${CLAUDE_EFFORT}` in skills; `AI_AGENT` env; VS Code native `/usage` dialog |
| v2.1.121 | Apr 28, 2026 | MCP `alwaysLoad`; `claude plugin prune`; `/skills` filter; PostToolUse `updatedToolOutput` all tools; SDK `mcp_authenticate` `redirectUri`; LSP diagnostics expand; OTEL `stop_reason`/`finish_reasons`; VS Code `/context` dialog; MCP retry 3× |
| v2.1.122 | Apr 28, 2026 | `ANTHROPIC_BEDROCK_SERVICE_TIER`; PR URL paste in `/resume`; OTEL `at_mention` event |
| v2.1.123 | Apr 29, 2026 | Hotfix: OAuth 401 retry loop with `DISABLE_EXPERIMENTAL_BETAS` |
| v2.1.126 | May 1, 2026 | `/model` lists gateway models; `claude project purge`; expanded `--dangerously-skip-permissions` exemptions; WSL2/SSH OAuth code paste; Windows PowerShell 7 detection; `claude_code.skill_activated` OTEL event with `invocation_trigger`; managed sandbox enforcement fix |

> **Note:** Versions not listed in the public changelog (e.g., v2.1.115, v2.1.124, v2.1.125) represent internal releases that did not ship publicly.

---

## 32. Notable Bug Fixes & Stability History

This section highlights the most impactful fixes across the v2.x series.

**Context & compaction:**
Plan mode lost after context compaction (v2.1.47); Opus 4.7 sessions computing context against 200K instead of 1M (v2.1.117); `--resume` cache-miss chain recovery (v2.1.89); autocompact thrash-loop guard added (v2.1.89); `/compact` regression where first resume dropped cache prefix (v2.1.90); `/clear` dropping the session rename (v2.1.111).

**Bash & permissions:**
`Ctrl+Z` hanging terminal via npx/bun run wrappers (v2.1.116); Bash auto-allow bypass via backslash-escaping (v2.1.98); compound-command permission bypass (v2.1.98); env-var-prefix prompt bypass (v2.1.98); `find -exec`/`-delete` auto-approved by `Bash(find:*)` (v2.1.113); deny-rule wrappers (`env`, `sudo`, `watch`) not matched (v2.1.113); `permissions.deny` overridden by `PermissionRequest` hook's `updatedInput` (v2.1.101); `setMode: bypassPermissions` ignoring `disableBypassPermissionsMode` (v2.1.110); managed domain/read-path enforcement when sandbox block missing (v2.1.126).

**MCP:**
`claude mcp serve` outputSchema validation failure (v2.1.101); OAuth `authServerMetadataUrl` lost on token refresh (v2.1.97); subagents not inheriting dynamically-injected MCP tools (v2.1.101); MCP transient errors not retried — now 3× (v2.1.121); SSE quadratic complexity (v2.1.90).

**Subagents & worktrees:**
Subagents in isolated worktrees denied Read/Edit to own worktree files (v2.1.101); subagent MCP tool inheritance (v2.1.101); stale worktree reuse error (v2.1.118); worktree stale-directory "already exists" (v2.1.101); sandboxed `mktemp` failure (v2.1.101).

**Remote Control:**
Generic session title (v2.1.81); `/rename` not syncing (v2.1.81); web-set titles overwritten by auto-titles (v2.1.108); renames from claude.ai not persisting to CLI (v2.1.116); re-login prompt when session too old (v2.1.116).

**Prompt caching:**
Subscribers with `DISABLE_TELEMETRY` falling back to 5-min TTL (v2.1.108).

**Windows & cross-platform:**
CJK wide character rendering (v2.1.47); Devanagari rendering (v2.1.116); Japanese/Korean/Chinese on Windows no-flicker (v2.1.126); Bedrock SigV4 with custom `Authorization` header (v2.1.101); Kitty protocol Ctrl+_/Cmd+Left/Right (v2.1.116); WSL2 image pasting (v2.1.47).

**IDE:**
IME unintended Enter/Tab submission in VS Code (v2.0.5); voice mode not activating on startup (v2.1.79); `--bare` dropping MCP tools in interactive sessions (v2.1.86).

---

## 33. Best Practices & Optimization Patterns

### 33.1 Project Setup

Set up a thorough `CLAUDE.md` from the start. Run `/init` to generate a baseline, then refine it manually to add team conventions, "don't" rules, and architecture notes. Commit it to git so every team member benefits. Keep it under ~200 lines; move lengthy reference material to a `docs/` directory that Claude can load on demand via skill `references/`.

### 33.2 Context Management

Use `/clear` between unrelated tasks to start fresh. Run `/compact` proactively before the context reaches 80%, not reactively when Claude starts losing track. If you run CI/CD sessions, use `--no-session-persistence` for throwaway runs and `--exclude-dynamic-system-prompt-sections` to maximise cache hit rates across users.

### 33.3 Using `@`-Mentions Instead of Paste

When you want Claude to read a file, type `@filename.ts` rather than pasting the file contents. This is better in three ways: it preserves the audit log entry, honours permission deny rules on that path, and counts towards the prompt cache prefix rather than the dynamic portion.

### 33.4 Model Selection Strategy

Use **Haiku** for routing decisions, generating stubs, simple one-file edits, and skill execution. Use **Sonnet** for the majority of your day-to-day coding work. Reserve **Opus 4.7 at xhigh or max effort** for the hardest 10–15% of tasks: architectural decisions, debugging subtle concurrency issues, security analysis, and multi-file refactors that need global reasoning.

### 33.5 Hooks for Code Quality

The most powerful use of hooks is enforcing quality standards automatically:

```jsonc
"hooks": {
  // Auto-format on every file write:
  "PostToolUse": [
    { "matcher": "Write|Edit|MultiEdit",
      "hooks": [
        { "type": "command",
          "command": "npx prettier --write \"$CLAUDE_TOOL_INPUT_FILE_PATH\" 2>/dev/null || true" },
        { "type": "command",
          "command": "npx eslint --fix \"$CLAUDE_TOOL_INPUT_FILE_PATH\" 2>/dev/null || true" }
      ]
    }
  ],
  // Refuse to finish if tests fail:
  "Stop": [
    { "hooks": [
        { "type": "command",
          "command": "npm test --silent 2>&1 | tail -5; [ $? -eq 0 ] || (echo 'Tests failing — fix before finishing'; exit 2)" }
      ]
    }
  ],
  // Inject git status at session start:
  "SessionStart": [
    { "hooks": [
        { "type": "command",
          "command": "printf '## Current branch: '; git branch --show-current; printf '\\n## Uncommitted changes:\\n'; git status --short | head -20" }
      ]
    }
  ]
}
```

### 33.6 Sandboxing

`/sandbox` reduces permission prompts by ~84% while providing OS-level isolation. Enable it at project setup, configure `allowedDomains` for the package registries your project uses, and add any required write paths to `sandbox.filesystem.allowWrite`. Combine sandbox with `permissions.deny` for defence in depth — the sandbox catches syscalls; deny rules catch tool-level requests.

### 33.7 CI/CD with Print Mode

```bash
# Structured CI/CD usage:
claude -p \
  --output-format json \
  --exclude-dynamic-system-prompt-sections \
  --max-turns 20 \
  --max-budget-usd 3.00 \
  --allowedTools "Read,Grep,Glob,Bash(npm test),Bash(npm run lint)" \
  "Run the full test suite, lint check, and fix any failures. Return a JSON summary."
```

For non-interactive code review in CI (v2.1.120+):

```bash
claude ultrareview "https://github.com/owner/repo/pull/123" --json > review.json
```

### 33.8 Pre-Baking Plugins in Containers

```dockerfile
FROM ubuntu:24.04
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV CLAUDE_CODE_PLUGIN_SEED_DIR=/opt/claude-plugins
COPY ./my-plugins /opt/claude-plugins
```

`CLAUDE_CODE_PLUGIN_SEED_DIR` mirrors `~/.claude/plugins`, letting you pre-install plugins at image build time and avoid marketplace fetches on every CI run.

### 33.9 Parallel Development with Worktrees

```bash
# Open three worktrees in separate terminal tabs:
# Tab 1:
claude -w feature-payments "Implement Stripe webhook handling"

# Tab 2:
claude -w bugfix-auth "Fix the JWT expiry race condition"

# Tab 3:
claude -w refactor-db "Migrate from raw SQL to Prisma"
```

Each worktree is on its own branch in `.claude/worktrees/`. Claude Code sessions run independently with no risk of file conflicts.

---

## 34. Agent SDK

> **Version History:** Agent SDK (TypeScript) launched alongside Claude Code GA (v1.0, May 2025). Python SDK added later in v1.0.x. `ClaudeSDKClient` stateful client added v2.0.x. `fork_session` / `forkSession` parameter added v2.0.x. `rewind_files()`, `get_mcp_status()`, `reconnect_mcp_server()` added to `ClaudeSDKClient` in v2.1.x. SDK OAuth (`mcp_authenticate` + `redirectUri`) added v2.1.121. `include_partial_messages` for `StreamEvent` added v2.0.x. `RateLimitEvent` with `retry_after_ms` added v2.1.x. Subprocess cleanup on early `for await` break fixed v2.1.101. `managed_settings` dict for programmatic policy injection added v2.1.x. **Critical pitfall:** `setting_sources` defaults to `[]` — CLAUDE.md and skills are NOT loaded unless explicitly set.

The Agent SDK provides programmatic access to the Claude Code engine for building custom agents, CI/CD integrations, and multi-agent workflows.

**Packages:** `pip install claude-agent-sdk` (Python) and `npm install @anthropic-ai/claude-agent-sdk` (TypeScript). The TypeScript package bundles the native Claude Code binary as an optional dependency — no separate install required.

### 34.1 Python SDK

```python
import asyncio
from claude_agent_sdk import (
    query, ClaudeSDKClient, ClaudeAgentOptions,
    AssistantMessage, ResultMessage, SystemMessage
)

# Simple query:
async def run_analysis():
    async for message in query(
        prompt="Analyse the test failures in src/ and suggest fixes",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Grep", "Glob", "Bash(npm test)"],
            disallowed_tools=[],
            max_turns=20,
            max_budget_usd=2.00,
            model="claude-sonnet-4-6",
            effort="high",
            permission_mode="acceptEdits",
            # Load CLAUDE.md, skills, and hooks from the project:
            setting_sources=["user", "project"],
            # cwd defaults to os.getcwd()
            sandbox={
                "enabled": True,
                "failIfUnavailable": False,
                "network": {
                    "allowLocalBinding": True,
                    "allowedDomains": ["registry.npmjs.org"]
                }
            }
        )
    ):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if hasattr(block, "text"):
                    print(block.text, end="", flush=True)
        elif isinstance(message, ResultMessage):
            print(f"\n\nCompleted in {message.num_turns} turns, cost: ${message.cost_usd:.4f}")

asyncio.run(run_analysis())
```

**`ClaudeAgentOptions` — all fields:**

- `tools` / `allowed_tools` / `disallowed_tools` — tool allowlists and denylists
- `system_prompt` — string, or `{"type": "preset", "preset": "claude_code", "append": "..."}` to extend the built-in system prompt
- `mcp_servers` — list of MCP server configs
- `permission_mode` — `"acceptEdits"`, `"bypassPermissions"`, `"plan"`, `"default"`, `"dontAsk"`
- `continue_conversation` / `resume` — session resumption
- `max_turns`, `max_budget_usd`, `model`, `fallback_model`, `betas`, `effort`
- `output_format` — `{"type": "json_schema", "schema": {...}}` for structured outputs
- `cwd`, `cli_path`, `settings`, `add_dirs`, `env`, `extra_args`
- `setting_sources` — `["user", "project", "local"]`; **defaults to `[]`** (CLAUDE.md/skills/commands are NOT auto-loaded unless you set this explicitly)
- `agents`, `hooks`, `include_partial_messages`
- `managed_settings` — dict to inject managed settings programmatically
- `sandbox` — filesystem/network isolation config

> **Critical:** `setting_sources` defaults to an empty list. If you want CLAUDE.md, skills, slash commands, and output styles to be loaded, you must explicitly set `setting_sources=["project"]` or `["user", "project"]`. This is the most common SDK pitfall.

### 34.2 TypeScript SDK

```typescript
import { query, ClaudeSDKClient } from "@anthropic-ai/claude-agent-sdk";

// Simple query:
for await (const message of query({
  prompt: "Fix all TypeScript errors in src/",
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Edit", "Write"],
    maxTurns: 30,
    maxBudgetUsd: 5.00,
    model: "claude-opus-4-7",
    effort: "high",
    permissionMode: "acceptEdits",
    settingSources: ["user", "project"],
    sandbox: { enabled: true, failIfUnavailable: false }
  }
})) {
  // Clean up properly even on early exit:
  // Use `await using` (TypeScript 5.2+) or explicit break handling
  if (message.type === "result") {
    console.log(`Done: ${message.result}`);
    console.log(`Cost: $${message.costUsd.toFixed(4)}`);
  }
}
```

### 34.3 Stateful Client (Python)

The `ClaudeSDKClient` is the stateful alternative to the one-shot `query()` generator. It keeps the subprocess alive across multiple turns, which is more efficient for interactive multi-step workflows because it avoids subprocess startup overhead on every query.

```python
async with ClaudeSDKClient(options=ClaudeAgentOptions(
    setting_sources=["project"],
    permission_mode="acceptEdits"
)) as client:
    await client.connect()

    # Send a prompt and iterate over response messages:
    async for msg in client.query("Start by reading ARCHITECTURE.md"):
        print(msg)

    # Change the model mid-session (takes effect on the next query):
    await client.set_model("claude-opus-4-7")

    # Change permission mode mid-session:
    await client.set_permission_mode("bypassPermissions")

    # Continue with a follow-up:
    async for msg in client.query("Now implement the proposed changes"):
        print(msg)

    # Interrupt a currently-running operation (e.g. from another coroutine):
    await client.interrupt()

    # Receive raw messages from the running session without awaiting a response:
    async for msg in client.receive_messages():
        print(msg)

    # Await a single complete response (convenience wrapper over receive_messages):
    response = await client.receive_response()

    # Revert files modified in the last N turns (default 1), without rewinding conversation:
    await client.rewind_files(turns=1)

    # Check the connection status and tool list of all MCP servers:
    status = await client.get_mcp_status()
    # Returns: {"server_name": {"connected": True, "tools": ["tool_a", ...]}, ...}

    # Reconnect a specific MCP server (e.g. after a network blip):
    await client.reconnect_mcp_server("my-db-server")
```

**Complete `ClaudeSDKClient` method reference:**

| Method | Purpose |
|--------|---------|
| `connect()` | Establish the subprocess connection; must be called before any query |
| `query(prompt)` | Send a prompt; returns `AsyncIterator[Message]` |
| `receive_messages()` | Async iterator of raw messages from the running session |
| `receive_response()` | Convenience: awaits a single complete response |
| `interrupt()` | Signal the running operation to stop (equivalent to Ctrl+C) |
| `set_model(model_id)` | Switch model for subsequent queries |
| `set_permission_mode(mode)` | Change permission mode for subsequent queries |
| `rewind_files(turns=1)` | Revert file changes from the last N turns without touching the conversation |
| `get_mcp_status()` | Returns a dict of `{server_name: {connected, tools}}` for all MCP servers |
| `reconnect_mcp_server(name)` | Force-reconnect a named MCP server after a failure |

### 34.4 Message Types Reference

Both `query()` and `ClaudeSDKClient.receive_messages()` yield typed message objects. Understanding these types is essential for robust SDK consumers:

| Message Type | When It Appears | Key Fields |
|---|---|---|
| `SystemMessage` | First message in every session | `subtype` (`init` or `compact_boundary`); `init` carries `slash_commands` list |
| `AssistantMessage` | When Claude produces text or calls tools | `content: list[TextBlock | ToolUseBlock | ToolResultBlock | ThinkingBlock]` |
| `UserMessage` | When permission prompts or hook feedback are surfaced | `content` |
| `ResultMessage` | Final message; session is done | `result: str`, `subtype`, `is_error: bool`, `cost_usd: float`, `duration_ms: int`, `num_turns: int`, `model_usage: dict` |
| `StreamEvent` | Intermediate partial content (requires `include_partial_messages=True`) | `delta`, `index` |
| `RateLimitEvent` | When the API is rate-limiting; client should back off | `retry_after_ms: int` |

```python
from claude_agent_sdk import (
    query, ClaudeAgentOptions,
    AssistantMessage, ResultMessage, SystemMessage,
    UserMessage, StreamEvent, RateLimitEvent,
    TextBlock, ToolUseBlock, ThinkingBlock
)

async for msg in query(prompt="...", options=ClaudeAgentOptions(
    include_partial_messages=True  # required to receive StreamEvent
)):
    if isinstance(msg, RateLimitEvent):
        # Back off before retrying:
        await asyncio.sleep(msg.retry_after_ms / 1000)
    elif isinstance(msg, AssistantMessage):
        for block in msg.content:
            if isinstance(block, TextBlock):
                print(block.text, end="", flush=True)
            elif isinstance(block, ThinkingBlock):
                print(f"[thinking: {block.thinking[:100]}...]")
    elif isinstance(msg, ResultMessage):
        print(f"\nDone in {msg.num_turns} turns | cost ${msg.cost_usd:.4f}")
        if msg.is_error:
            raise RuntimeError(f"Session ended with error: {msg.result}")
```

### 34.5 OAuth Authentication in SDK (v2.1.121)

```typescript
import { mcp_authenticate } from "@anthropic-ai/claude-agent-sdk";

// Custom-scheme OAuth completion (for desktop apps):
const token = await mcp_authenticate({
  server: "my-mcp-server",
  redirectUri: "myapp://oauth/callback"
});

// Uses claude.ai connectors for OAuth flows:
// ENABLE_CLAUDEAI_MCP_SERVERS=1 must be set
```

### 34.6 Cleanup Behaviour

The SDK properly cleans up subprocess and temp files when consumers break from `for await` or use `await using` (v2.1.101 fix). In Python:

```python
# Explicit cleanup via context manager:
async with query(prompt=..., options=...) as session:
    async for message in session:
        if should_stop:
            break  # subprocess is cleaned up on exit
```

---

## 35. Documentation Gaps & Caveats

This section is honest about what is and isn't officially documented.

**Sparse or ambiguous in official docs:**

- `SLASH_COMMAND_TOOL_CHAR_BUDGET` defaults (1%/8,000 chars) — widely cited by community sources but not stated as exact values in any Anthropic doc page.
- Effort → token budget mapping — only the `output_config.effort` API parameter is documented; exact budget values are not published.
- `CLAUDE_CODE_SUBPROCESS_ENV_SCRUB` allowlist — documented as scrubbing "sensitive env vars" but the exact allowlist is not published.
- `.lsp.json` schema — referenced in changelog but not formally documented with a spec.
- JSON Schema for `settings.json` — use `https://json.schemastore.org/claude-code-settings.json` (community-maintained). Issue #11795 requests an official Anthropic-hosted URL; it remains open as of May 2026.
- CLAUDE.md team declaration syntax for Agent Teams — referenced in third-party content but not on the official `code.claude.com/docs/en/agent-teams` page.
- Token cost multiplier for Agent Teams — Anthropic documents that each teammate is a full session but does not state an exact multiplier.
- The exact set of paths protected under `--dangerously-skip-permissions` — evolves release by release; no canonical list page exists.
- Routines full specification — the `/schedule` command and `CLAUDE_CODE_DISABLE_CRON` are observable, but a complete public spec for the Routines feature has not been published as of May 2026.
- Checkpoint retention modes (chat-only / code-only / both) — observable via `/config` but not documented in the official reference pages.

**Discrepancies across official sources:**

- Subscriber prompt-cache TTL: some older docs only describe 5-minute TTL. The authoritative behaviour is 1-hour for subscribers (v2.1.108 fixed the regression for `DISABLE_TELEMETRY` users).
- `defaultMode` enum: the schemastore JSON omits `"auto"` and `"dontAsk"` which are valid runtime values.
- Effort ceiling naming: `xhigh` sits between `high` and `max` for Opus 4.7; some external mirrors simplify this to three levels.

**Shelf life:** Claude Code ships 2–3 versions per week. Fine-grained details (env var names, bug-fix versions, individual setting keys) have a useful shelf life of days to weeks. Architectural facts (three-phase loop, sandbox primitives, permission evaluation order, plugin/skill/hook contracts, SDK structure) are stable across minor versions. A major version bump (v2→v3) historically introduces breaking SDK/plugin changes.

**For production deployments:** always verify the current changelog at `code.claude.com/docs/en/changelog` before upgrading. Pin `claude-code-action` to a specific SHA rather than `@v1` for CI stability. Pre-bake plugins into container images via `CLAUDE_CODE_PLUGIN_SEED_DIR` to avoid marketplace fetch failures in air-gapped environments.

---

---

## 36. Troubleshooting Reference

This section organizes the most common failure modes by symptom category,
with the known cause and resolution for each.

### 36.1 Installation & Startup Failures

```
  SYMPTOM                         CAUSE                     FIX
  ─────────────────────────────────────────────────────────────────────
  "command not found: claude"     Binary not in PATH        Add ~/.local/bin to $PATH
                                  after native install      or restart shell

  "npm ERR! ... permission        npm global prefix owned   Use native install instead
   denied" on npm install -g      by root                   or fix npm prefix permissions

  SSL/TLS certificate errors      Corporate proxy with      Set CLAUDE_CODE_CERT_STORE=
  connecting to Anthropic API     custom CA                 system OR add CA to bundle;
                                                            or set ANTHROPIC_BASE_URL to
                                                            an internal proxy endpoint

  Session fails to start on       Node.js requirement       v2.1.113+ uses native binary;
  npm install path                still present             upgrade to native installer

  "Failed to load managed         Enterprise managed-       Set forceRemoteSettingsRefresh:
   settings" at startup           settings URL unreachable  false to allow offline start;
                                                            or fix network path to policy
                                                            endpoint
```

### 36.2 Authentication Issues

```
  SYMPTOM                         CAUSE                     FIX
  ─────────────────────────────────────────────────────────────────────
  Browser OAuth loop / timeout    Browser blocked or        Use --console flag + API key
                                  no display (SSH/CI)       instead of OAuth

  "401 Unauthorized" on API key   Key prefix wrong or       Verify key starts with
                                  key expired               "sk-ant-"; regenerate at
                                                            console.anthropic.com

  "401 loop" with               DISABLE_EXPERIMENTAL_BETAS  v2.1.123 fix: update to
   DISABLE_EXPERIMENTAL_BETAS   + OAuth token interaction   v2.1.123 or later

  Bedrock auth failure in CI      SigV4 headers conflicting  Set CLAUDE_CODE_SKIP_BEDROCK_
                                  with custom Authorization  AUTH=1 for gateway mode;
                                                            use awsCredentialExport helper

  Vertex auth failure             GCP credentials not set    Set GOOGLE_APPLICATION_
                                  in environment             CREDENTIALS or run
                                                            gcloud auth application-
                                                            default login
```

### 36.3 Context & Compaction Issues

```
  SYMPTOM                         CAUSE                     FIX
  ─────────────────────────────────────────────────────────────────────
  Auto-compact thrash loop        Context refills to limit   v2.1.89 added guard; update.
  (compacts 3× with no progress) immediately after compact  Or use /clear and start fresh.

  Plan mode lost after /compact   Bug fixed in v2.1.47      Update to v2.1.47+

  Opus 4.7 showing "context full" Opus 4.7 1M context       v2.1.117 fix: update to
  at low utilization              computed against 200K      v2.1.117+
                                  instead of 1M

  Prompt cache TTL stuck at 5 min Subscriber with            v2.1.108 fix: update to
  despite subscriber account      DISABLE_TELEMETRY=1        v2.1.108+; or set
                                  regression                 ENABLE_PROMPT_CACHING_1H=1

  /clear hint shows wrong count   Bug fixed in v2.1.119      Update to v2.1.119+
  (cumulative not current)

  Session JSONL corrupt after     Advisor tool_result bug    v2.1.126 fix; or manually
  using advisor tool              (issue #49994)             edit JSONL to remove
                                                            malformed advisor blocks
```

### 36.4 Tool & Permission Issues

```
  SYMPTOM                         CAUSE                     FIX
  ─────────────────────────────────────────────────────────────────────
  Deny rule not matching          Command wrapped with env/  v2.1.113 added wrapper
  "env MYVAR=1 rm -rf ..."        sudo/watch/ionice/setsid   matching; update to v2.1.113+

  Bash(find:*) allows             find -exec and -delete     v2.1.113 fixed; update;
  find -exec rm ...               were auto-approved         add explicit deny rule

  Permission dialog says approved  setMode: bypassPermissions v2.1.110 fix: update to
  but disableBypassPermissions     not respecting setting     v2.1.110+
  should block it

  Read deny rule not blocking     Read(...) deny rules        Add separate Bash(cat:*)
  cat via Bash                    don't apply to Bash         deny rule; use sandbox for
                                                            kernel-level enforcement

  Subagent denied Read on its     Bug fixed in v2.1.101      Update to v2.1.101+
  own worktree files (isolation:
  worktree subagents)
```

### 36.5 Hooks Not Firing

```
  SYMPTOM                         CAUSE                     FIX
  ─────────────────────────────────────────────────────────────────────
  Hook defined in settings.json   Hooks snapshot at session  Use /hooks reload or
  not running                     start time                 restart the session

  Command hook not receiving      Matcher regex doesn't      Test regex against tool name
  events for some tools           match tool name exactly    with --debug hooks flag

  HTTP hook failing silently      URL not in allowedHttp     Add URL to allowedHttp
                                  HookUrls enterprise list   HookUrls in managed settings

  Hook times out and blocks       Default 60s timeout        Make hook faster; or use
  Claude indefinitely             exceeded                    async fire-and-forget pattern
                                                            via background process

  mcp_tool hook not available     Feature added v2.1.118     Update to v2.1.118+

  exit 2 from Stop hook not       PostToolUse, not Stop,     Check hook is on the correct
  forcing continuation            has soft blocking          event; Stop exit 2 = continue
```

### 36.6 MCP Server Issues

```
  SYMPTOM                         CAUSE                     FIX
  ─────────────────────────────────────────────────────────────────────
  MCP server fails to start       stdio server on Windows    Wrap with cmd /c:
  on Windows                      needs cmd wrapper          "command": "cmd",
                                                            "args": ["/c","npx","..."]

  "${VAR}" not expanded in        Client doesn't support it  VS Code and Kiro expand;
  .mcp.json on some clients       (Claude Desktop uses       Claude Desktop does not;
                                  literal values)            use --env flag on CLI

  MCP tool output truncated       Default result size limit  Set _meta["anthropic/
  at unexpected length            (varies by server)         maxResultSizeChars"]: 500000
                                                            in server's return value

  MCP server not inheriting       Bug fixed in v2.1.101      Update to v2.1.101+
  into subagents (dynamically
  injected servers)

  SSE transport deprecation       SSE is deprecated in       Migrate server to HTTP
  warning in console              MCP spec 1.1               transport; update config:
                                                            "transport": "http", "url":...

  OAuth token refresh race        Multiple processes         v2.1.97 fixed cross-process
  condition                       refreshing simultaneously   lock; update to v2.1.97+
```

### 36.7 Performance & Cost Issues

```
  SYMPTOM                         CAUSE                     FIX
  ─────────────────────────────────────────────────────────────────────
  Every request incurs full       Stable prefix not cached;  Use --exclude-dynamic-system-
  input token cost in CI          dynamic content in system  prompt-sections to move
                                  prompt breaks caching      cwd/env/memory to user message

  Session is significantly        MCP tools consuming        Use Tool Search; defer MCP
  slower than expected            too many context tokens    loading; cap tool descriptions
                                  (>10% context window)      at 2KB per tool

  /resume picker very slow        Session files >40MB on     v2.1.116 made it 67% faster;
                                  disk                       update; or archive old sessions

  High cost from Opus advisor     Each advisor call = full   Track advisor call count;
  calls                           Opus inference pass        set max_uses in tool def;
                                                            or switch to Sonnet executor

  Auto-compact fires too often    Default threshold (~92%)   Lower with CLAUDE_AUTOCOMPACT_
                                  too low for workload       PCT_OVERRIDE env var;
                                                            or /compact manually at 70%
```

### 36.8 Agent SDK Pitfalls

```
  SYMPTOM                         CAUSE                     FIX
  ─────────────────────────────────────────────────────────────────────
  CLAUDE.md and skills not        setting_sources defaults   Add setting_sources=
  loaded in SDK sessions          to [] (empty list)         ["user","project"] to options

  Subprocess not cleaned up       Early break from           Use `await using` (TS 5.2+)
  on early exit                   async iterator             or try/finally with break

  400 error on multi-turn         advisor_tool_result blocks Must preserve ALL
  advisor sessions                removed from history       advisor_tool_result blocks
                                                            verbatim in every turn

  Subagent never spawned          "Agent" not in             Add "Agent" to allowedTools
                                  allowedTools               for the coordinator session

  Session context not preserved   resume= param not set      Capture session_id from
  across query() calls            between calls              ResultMessage; pass as
                                                            resume=session_id next call
```

---

> **Version callout:** Most troubleshooting issues described here are fixed in
> **v2.1.126**. Before opening a bug report, run `/doctor` (press `f` to auto-fix),
> check `claude --version`, and update with `claude install latest` if on an older
> version. Pin to a specific version in CI with `claude install 2.1.126`.

---

*End of reference. For the latest patch details, run `claude --version` and then `/release-notes` inside the CLI, or check `code.claude.com/docs/en/changelog` directly.*
