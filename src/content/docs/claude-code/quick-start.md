---
title: Quick Start — Claude Code for New Users
description: >
  Step-by-step guide for installing Claude Code, running your first session,
  understanding the agentic loop, setting up CLAUDE.md, and establishing
  productive daily workflows. Covers v2.1.126 (May 2026).
sidebar:
  order: 2
  label: Quick Start
lastUpdated: 2026-05-06
---

# Quick Start — Claude Code for New Users

> **Version:** v2.1.126 (May 6, 2026) · **Audience:** developers new to Claude Code · **Time to complete:** 20–30 minutes

Claude Code is Anthropic's agentic terminal-based coding assistant. It understands your entire codebase, reads and writes files, runs shell commands, executes tests, manages Git, and works in a continuous loop until your task is done — all from natural-language instructions.

This guide takes you from zero to productive in one sitting.

---

## 1. Install Claude Code

### macOS / Linux / WSL2 (recommended)

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

The script detects your platform, downloads the native binary, and adds `claude` to your `PATH`.

### Windows (PowerShell)

```powershell
irm https://claude.ai/install.ps1 | iex
```

### Windows (CMD)

```cmd
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

### Homebrew (macOS / Linux)

```bash
brew install --cask claude-code
```

### WinGet

```powershell
winget install Anthropic.ClaudeCode
```

### Linux package managers

```bash
# Debian / Ubuntu
apt install claude-code

# Fedora / RHEL / CentOS
dnf install claude-code

# Arch Linux (AUR)
yay -S claude-code
```

### npm (Node.js 18+, all platforms)

```bash
npm install -g @anthropic-ai/claude-code
```

### Verify installation

```bash
claude --version
claude doctor          # health check with auto-repair
```

---

## 2. Authenticate

On first launch Claude Code opens your browser for OAuth login with your Anthropic account:

```bash
claude
```

You can also set an API key directly (useful in CI/CD or headless environments):

```bash
export ANTHROPIC_API_KEY=sk-ant-...
claude
```

For AWS Bedrock:

```bash
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
claude
```

For Google Cloud Vertex AI:

```bash
export CLAUDE_CODE_USE_VERTEX=1
export CLOUD_ML_REGION=us-central1
export ANTHROPIC_VERTEX_PROJECT_ID=my-project
claude
```

---

## 3. Your First Session

Navigate to any project directory and start Claude Code:

```bash
cd ~/my-project
claude
```

You'll see the REPL prompt. Try these to get a feel for the tool:

```
> Summarise this codebase in three paragraphs
> List all TODO comments across the project
> What does the authenticate() function do?
> Fix the failing tests in src/auth/
> Add input validation to the POST /users endpoint
```

### How the agentic loop works

```
Your prompt
    │
    ▼
Claude generates a response + optional tool_use blocks
    │
    ├─ stop_reason == "tool_use"  →  Execute tools (Read, Edit, Bash, ...)
    │                                Append tool_result
    │                                Send back to API
    │                                └────────────────► loop
    │
    └─ stop_reason == "end_turn"  →  Session complete
```

**Core rule:** Claude routes on `stop_reason`, never on parsed text. Always let Claude decide when to stop.

---

## 4. Essential Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Shift+Tab` | Cycle mode: Normal → Auto-Accept → Plan |
| `Ctrl+C` | Cancel current operation |
| `Ctrl+B` | Background a running Bash command |
| `Ctrl+R` | Reverse history search |
| `Esc` × 2 | Open rewind menu (roll back last action) |
| `Tab` | Toggle extended thinking on/off |
| `Option+Enter` (macOS) | Multiline input |
| `Backslash+Enter` | Multiline input (universal) |
| `!` at line start | Enter raw bash mode |
| `@` | Trigger file path autocomplete |

Run `/terminal-setup` once to enable `Shift+Enter` for multiline (requires iTerm2/supported terminal).

---

## 5. Essential Slash Commands

| Command | What it does |
|---------|-------------|
| `/clear` | Reset conversation (keep config, lose context) |
| `/compact [instructions]` | Summarise conversation to free context window |
| `/plan` | Enter plan-only mode — no file writes until you approve |
| `/model` | Switch Claude model mid-session |
| `/usage` | Show token usage and cost for this session |
| `/context` | Display token-usage grid |
| `/rewind` | Roll back code changes + conversation |
| `/memory` | View and edit auto-memory entries |
| `/todos` | View and manage task list |
| `/config` | Open tabbed settings UI |
| `/doctor` | Run health check with auto-repair |
| `/permissions` | Manage tool allowlists |
| `/mcp` | Manage MCP server connections |
| `/agents` | List and create subagents |
| `/skills` | Browse installed skills |
| `/resume` | Open interactive session picker |
| `/rename [name]` | Name the current session for retrieval |
| `/hooks` | Configure automation hooks |
| `/changelog` | Show Claude Code release notes |
| `/debug` | Troubleshoot session issues |
| `/terminal-setup` | Configure scroll, clipboard, iTerm2 integration |
| `/team-onboarding` | Generate a teammate ramp-up guide |

---

## 6. Modes of Operation

### Normal Mode (default)
Claude asks permission before file writes and shell commands. Best for interactive development.

### Auto-Accept Mode (`Shift+Tab` once)
Claude executes tools without asking. Use for trusted tasks in reviewed codebases. **Never in production without review.**

### Plan Mode (`Shift+Tab` twice, or `--permission-mode plan` CLI flag)
Claude writes a plan but never executes tools. You review before approving. Ideal for uncertain tasks.

### Non-Interactive (CI/CD)
```bash
claude --print "Run all tests and fix any failures" \
       --permission-mode autoAccept \
       --max-turns 30 \
       --max-budget-usd 2.00
```

---

## 7. Set Up Your First CLAUDE.md

`CLAUDE.md` is a persistent memory file that Claude Code reads at the start of every session. It primes Claude with project-specific context — like a README that only Claude reads.

### Create it

```bash
claude /init          # AI-generated CLAUDE.md from your codebase
# or
touch CLAUDE.md       # manual
```

### Recommended template (keep under 200 lines)

```markdown
# Project Name

## Overview
Brief description of what this project does (2–3 sentences).
Tech stack: Python 3.12, FastAPI, PostgreSQL, Redis, Docker.

## Architecture
- `src/api/` — FastAPI routers
- `src/domain/` — business logic
- `src/infra/` — database, cache, external services
- `tests/` — pytest, fixtures in `conftest.py`

## Development Commands
```bash
make dev          # start local stack
make test         # pytest -x
make lint         # ruff + mypy
make migrate      # alembic upgrade head
```

## Critical Conventions
- Never use `SELECT *` in SQL queries
- All API responses use the `Result<T>` wrapper (see `src/api/types.py`)
- Environment variables live in `.env` (never hardcoded)
- Git commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:` prefixes

## What NOT to do
- Do not modify `src/infra/migrations/` manually
- Do not change `docker-compose.prod.yml` — use `docker-compose.override.yml`
```

### CLAUDE.md locations and scope

| File | Scope | Notes |
|------|-------|-------|
| `~/.claude/CLAUDE.md` | All projects | Personal global defaults |
| `CLAUDE.md` (project root) | Project-wide | Commit to git |
| `CLAUDE.local.md` (project root) | Local only | Auto-gitignored |
| `.claude/CLAUDE.md` | Project-wide (alternate) | Same as root CLAUDE.md |
| `src/CLAUDE.md` | That subdirectory | Loaded on demand |

---

## 8. Built-In Tools — What Claude Can Do

Claude Code has 16+ built-in tools. Understanding them helps you write better prompts.

### File System Tools

| Tool | What it does |
|------|-------------|
| `Read` | Read files, images (PNG/JPG/WebP/GIF), PDFs, Jupyter notebooks |
| `Write` | Write or overwrite entire files |
| `Edit` | Exact-string replacement in existing files |
| `MultiEdit` | Multiple string replacements in one file, one operation |
| `Glob` | Fast file pattern matching (e.g., `src/**/*.ts`) |
| `Grep` | Content search via ripgrep; regex support |
| `LS` | List directory contents |

### Execution Tools

| Tool | What it does |
|------|-------------|
| `Bash` | Run shell commands, scripts, test runners |
| `Monitor` | Stream output from a background process (v2.1.98+) |

### Web Tools

| Tool | What it does |
|------|-------------|
| `WebFetch` | Fetch URL content with AI extraction — markdown output |
| `WebSearch` | Web search with AI-ranked results |

### Task Management

| Tool | What it does |
|------|-------------|
| `TodoWrite` | Structured task tracking — visible in `/todos` |
| `TodoRead` | Read current task list |

### Agent Spawning

| Tool | What it does |
|------|-------------|
| `Task` | Spawn a subagent for parallel or isolated work |
| `Agent` | Launch a specialised Claude agent (Agent SDK) |

**Best practice:** prefer native tools over shell equivalents. Use `Read` not `cat`, `Edit` not `sed`, `Glob` not `find`. The native tools are faster, more reliable, and permission-safe.

---

## 9. Configuration Quick Reference

### Settings hierarchy (highest → lowest precedence)

```
Enterprise Managed Settings   (MDM/server-managed — overrides everything)
    ↓
CLI flags / environment variables
    ↓
.claude/settings.local.json   (project local — gitignore this)
    ↓
.claude/settings.json         (project — commit to git)
    ↓
~/.claude/settings.json       (user-global)
    ↓
CLAUDE.md (project root) → subdirectory CLAUDE.md files
    ↓
.claude/rules/*.md            (conditional rules, path-scoped)
```

### Key settings (`.claude/settings.json`)

```json
{
  "model": "claude-opus-4-7",
  "effort": "normal",
  "permissions": {
    "allow": ["Bash(git:*)", "Bash(npm test)", "Read", "Edit"],
    "deny": ["Bash(rm -rf*)"]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [{ "type": "command", "command": "npm run lint --fix" }]
      }
    ]
  }
}
```

---

## 10. Common First-Week Patterns

### Pattern 1: Understand an unfamiliar codebase

```
> Give me a high-level tour of this codebase — architecture, main modules, entry points, and any unusual patterns
> Find all database queries and categorise them by table
> Identify all external API integrations and what they're used for
```

### Pattern 2: Fix a bug with full context

```
> The login endpoint returns 500 for users with special characters in their email. 
  Find the root cause and fix it without breaking existing tests.
```

### Pattern 3: Add a feature end-to-end

```
> Add a POST /users/:id/archive endpoint that soft-deletes a user.
  Follow the existing patterns in the users module.
  Include unit tests and update the OpenAPI spec.
```

### Pattern 4: Code review and refactoring

```
> Review src/api/billing.py for security issues, code smells, and performance problems.
  Make a list before changing anything.
```

Then after reviewing the plan: `> Go ahead and implement those changes.`

### Pattern 5: Test-driven development

```
> Write failing tests for a function that validates UK postcodes.
  Then implement the function to make them pass.
```

### Pattern 6: Documentation generation

```
> Generate comprehensive API documentation for all public endpoints in src/api/.
  Use the OpenAPI format and include request/response examples.
```

---

## 11. Session Management

### Resume a session

```bash
claude -c          # resume most recent session
claude -r          # interactive session picker
```

### Name a session

```
/rename refactor-auth-module
```

### Checkpoint and rewind

Claude Code creates automatic checkpoints before destructive operations. Use `Esc×2` to open the rewind menu and roll back.

### Context management

When the context window fills up (watch `/context`):
```
/compact           # summarise conversation, free ~60% of window
/compact Focus on the auth refactor only    # targeted compaction
```

Auto-compaction triggers automatically when the window reaches ~85% full (configurable).

---

## 12. Cost Management Tips

| Strategy | Impact |
|----------|--------|
| Use `/compact` before starting new tasks | Reduces cumulative cost 30–50% |
| Specify scope in prompts (`src/auth/` only) | Prevents Claude from reading the entire codebase |
| Use `--effort low` for simple tasks | Reduces thinking tokens |
| Keep CLAUDE.md concise (under 200 lines) | Every session loads it — token cost compounds |
| Use `--model claude-haiku-4-5` for bulk/simple ops | 10–20× cheaper than Opus |
| Enable prompt caching | 90% cost reduction on repeated context |

See the [Context, Cost & Token Efficiency guide](./claude-code-efficiency-reference) for detailed strategies.

---

## 13. Next Steps

| If you want to… | Go to |
|----------------|-------|
| Master every feature | [CLI Technical Reference](./claude-code-reference) |
| Understand CLAUDE.md vs Rules vs Skills | [Config Guide](./claude-code-config-guide) |
| Automate with hooks | [Hooks Deep Dive](./hooks-deep-dive) |
| Add MCP tools | [MCP Servers Guide](./mcp-servers-guide) |
| Build multi-agent systems | [Agent Teams Guide](./agent-teams-guide) |
| Set up CI/CD pipelines | [CI/CD Integration](./cicd-integration) |
| Optimise token costs | [Efficiency Reference](./claude-code-efficiency-reference) |
| Prepare for CCA-F exam | [Compass Research Notes](./compass-research-notes) |

---

## Troubleshooting

```bash
claude doctor          # check installation health, auto-repair
claude --version       # confirm version
```

| Problem | Solution |
|---------|---------|
| `claude: command not found` | Run the install script again; check `PATH` |
| Auth loop / token expired | `claude logout && claude` |
| Slow responses | Try `--model claude-sonnet-4-6` for faster output |
| Context full warnings | Run `/compact` then continue |
| MCP server fails to connect | Run `/mcp` to see status and error logs |
| Hook not firing | Hooks snapshot at session start — run `/hooks reload` or restart |
