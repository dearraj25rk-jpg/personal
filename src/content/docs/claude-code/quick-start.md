---
title: Quick Start — Claude Code for New Users
description: >
  Step-by-step guide for installing Claude Code, running your first session,
  understanding the agentic loop, setting up CLAUDE.md, and establishing
  productive daily workflows. Covers v2.1.126 (May 2026).
sidebar:
  order: 2
  label: Quick Start
lastUpdated: 2026-06-03
---

# Quick Start — Claude Code for New Users

> **Version:** v2.1.126 (May 19, 2026) · **Audience:** developers new to Claude Code · **Time to complete:** 20–30 minutes

Claude Code is Anthropic's agentic terminal-based coding assistant. It understands your entire codebase, reads and writes files, runs shell commands, executes tests, manages Git, and works in a continuous loop until your task is done — all from natural-language instructions.

This guide takes you from zero to productive in one sitting.

---

## 1. Install Claude Code

### Installation Decision Tree

Use this tree to choose the right installation method for your environment:

```
Are you on macOS, Linux, or WSL2?
├── YES
│   ├── Do you use Homebrew?
│   │   ├── YES ──► brew install --cask claude-code
│   │   └── NO  ──► curl -fsSL https://claude.ai/install.sh | bash
│   └── Do you prefer a package manager?
│       ├── Debian/Ubuntu ──► apt install claude-code
│       ├── Fedora/RHEL   ──► dnf install claude-code
│       └── Arch (AUR)    ──► yay -S claude-code
└── NO (Windows)
    ├── Do you have WSL2? ──► Use WSL2 (strongly recommended)
    ├── PowerShell        ──► irm https://claude.ai/install.ps1 | iex
    ├── WinGet            ──► winget install Anthropic.ClaudeCode
    ├── CMD               ──► curl -fsSL https://claude.ai/install.cmd ...
    └── Node.js (any OS)  ──► npm install -g @anthropic-ai/claude-code
```

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

### How the Agentic Loop Works

The agentic loop is the core execution model of Claude Code. Understanding it helps you write better prompts and diagnose unexpected behaviour.

```
  ┌─────────────────────────────────────────────────────┐
  │                   AGENTIC LOOP                       │
  └─────────────────────────────────────────────────────┘

  User types prompt
        │
        ▼
  ┌─────────────────────────────────────────────────────┐
  │  [UserPromptSubmit hooks fire]                       │
  │   • Can inject context into the prompt               │
  │   • Can block with exit code 2                       │
  └──────────────────────┬──────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────────┐
  │  Claude API call (model generates response)          │
  │   • Input tokens: context + tools + prompt           │
  │   • Output tokens: response + tool_use blocks        │
  └──────────────────────┬──────────────────────────────┘
                         │
              ┌──────────┴────────────┐
              │                       │
        stop_reason                stop_reason
        == "tool_use"              == "end_turn"
              │                       │
              ▼                       ▼
  ┌───────────────────┐    ┌──────────────────────────┐
  │ [PreToolUse hooks]│    │  [Stop hooks fire]        │
  │  • Can block tool │    │   • Can force continuation│
  │    with exit 2    │    │     with exit 2           │
  └────────┬──────────┘    └──────────────────────────┘
           │
           ▼
  ┌────────────────────────────────┐
  │  Tool executes                 │
  │  (Read, Edit, Bash, Task, ...) │
  └────────┬───────────────────────┘
           │
           ▼
  ┌────────────────────────────────┐
  │  [PostToolUse hooks fire]      │
  │   • Can reject result          │
  │   • Can inject context         │
  └────────┬───────────────────────┘
           │
           ▼
  tool_result appended to context
           │
           └──────────────────► back to "Claude API call"
                                 (loop continues until end_turn)
```

**Key architectural facts:**
- Claude routes on `stop_reason`, never on parsed text — this makes it reliable
- Every tool result is appended to the conversation before the next API call
- Hooks fire at well-defined checkpoints and can intercept the loop
- The loop terminates when Claude returns `end_turn` and all Stop hooks pass (exit 0)
- `--max-turns` sets a hard limit on iterations regardless of Claude's intent

**What one "turn" costs (approximate, Sonnet 4.6):**
- Small task (read 2 files, 1 edit): ~$0.01–0.03
- Medium task (explore codebase, write tests): ~$0.05–0.20
- Large task (full feature with tests + docs): ~$0.50–2.00

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

Run `/keybindings` to view and customise all keyboard shortcuts for your current terminal profile.

---

## 5. Essential Slash Commands

| Command | What it does |
|---------|-------------|
| `/clear` | Reset conversation (keep config, lose context) |
| `/compact [instructions]` | Summarise conversation to free context window |
| `/plan` | Enter plan-only mode — no file writes until you approve |
| `/model` | Switch Claude model mid-session |
| `/fast` | Toggle Fast Mode — Opus-speed output without downgrading to a smaller model |
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
| `/branch [name]` | Create a git worktree and new session in it |
| `/advisor` | Escalate to dual-model advisor (Sonnet + Opus) |
| `/init` | Auto-generate CLAUDE.md from codebase analysis |

For full detail on every built-in command plus how to author custom slash commands (frontmatter fields, `$ARGUMENTS`, `@file` imports, `` !`shell` `` injection), see the [Slash Commands — Complete Reference](./slash-commands-reference).

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

### CLAUDE.md Effectiveness Diagram

Not all CLAUDE.md content is equally valuable. This diagram shows what delivers the highest signal per token:

```
  HIGH VALUE (write this)                  LOW VALUE (skip this)
  ────────────────────────                 ────────────────────────
  ┌──────────────────────────────┐         ┌──────────────────────────────┐
  │ Critical "never do" rules    │         │ Generic best practices       │
  │ e.g. "never use SELECT *"   │  >>>>   │ e.g. "write clean code"      │
  └──────────────────────────────┘         └──────────────────────────────┘
  ┌──────────────────────────────┐         ┌──────────────────────────────┐
  │ Exact test/build commands    │         │ Instructions Claude already  │
  │ e.g. "make test" not npm test│  >>>>   │ knows from the language      │
  └──────────────────────────────┘         └──────────────────────────────┘
  ┌──────────────────────────────┐         ┌──────────────────────────────┐
  │ Non-obvious architecture     │         │ Obvious directory structure  │
  │ decisions and tradeoffs      │  >>>>   │ e.g. "src/ has source code"  │
  └──────────────────────────────┘         └──────────────────────────────┘
  ┌──────────────────────────────┐         ┌──────────────────────────────┐
  │ Project-specific gotchas     │         │ Standard commit message      │
  │ e.g. "db migrations manual" │  >>>>   │ formats Claude already knows │
  └──────────────────────────────┘         └──────────────────────────────┘
  ┌──────────────────────────────┐         ┌──────────────────────────────┐
  │ Environment setup quirks     │         │ Descriptions of what files   │
  │ and prerequisite services    │  >>>>   │ contain (Claude will read    │
  └──────────────────────────────┘         │ them anyway)                 │
                                           └──────────────────────────────┘

  Target: 100–200 lines. Every line costs tokens on every session.
  200 lines × 100 sessions = 20,000+ tokens just for CLAUDE.md.
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

| Tool | What it does | Example use case |
|------|-------------|-----------------|
| `Read` | Read files, images (PNG/JPG/WebP/GIF), PDFs, Jupyter notebooks | "Read the auth module and explain it" |
| `Write` | Write or overwrite entire files | "Create a new config file at config/prod.yaml" |
| `Edit` | Exact-string replacement in existing files | "Fix the typo on line 47 of utils.py" |
| `MultiEdit` | Multiple string replacements in one file, one operation | "Rename the variable everywhere in this file" |
| `Glob` | Fast file pattern matching (e.g., `src/**/*.ts`) | "Find all TypeScript files in src/" |
| `Grep` | Content search via ripgrep; regex support | "Find all places that call the deprecated API" |
| `LS` | List directory contents | "Show what's in the migrations folder" |

**Anti-pattern:** asking Claude to use shell commands for file operations:
```
# Bad — slow, permission-checked, fragile:
> Run: cat src/auth/login.py

# Good — fast, native, direct:
> Read src/auth/login.py
```

### Execution Tools

| Tool | What it does | Example use case |
|------|-------------|-----------------|
| `Bash` | Run shell commands, scripts, test runners | "Run the test suite and show failures" |
| `Monitor` | Stream output from a background process (v2.1.98+) | "Start the dev server and watch for errors" |

**Anti-pattern:** chaining multiple Bash calls when one will do:
```
# Bad — each call is a separate turn:
> Run git add .
> Run git commit -m "feat: add auth"
> Run git push

# Good — single turn:
> Stage all changes, commit with message "feat: add auth", and push to origin
```

### Web Tools

| Tool | What it does | Example use case |
|------|-------------|-----------------|
| `WebFetch` | Fetch URL content with AI extraction — markdown output | "Get the FastAPI docs for dependency injection" |
| `WebSearch` | Web search with AI-ranked results | "Find the latest postgres connection pooling best practices" |

**Note:** WebFetch and WebSearch can be disabled in `.claude/settings.json` for security-sensitive environments:
```json
{ "permissions": { "deny": ["WebFetch", "WebSearch"] } }
```

### Task Management

| Tool | What it does | Example use case |
|------|-------------|-----------------|
| `TodoWrite` | Structured task tracking — visible in `/todos` | Auto-used for multi-step tasks |
| `TodoRead` | Read current task list | "What tasks are remaining?" |

Claude automatically uses TodoWrite for complex multi-step tasks. You can view the live task list with `/todos`.

### Agent Spawning

| Tool | What it does | Example use case |
|------|-------------|-----------------|
| `Task` | Spawn a subagent for parallel or isolated work | "Analyse all 3 microservices in parallel" |
| `Agent` | Launch a specialised Claude agent (Agent SDK) | "Use the code-reviewer agent on this PR" |

**When to use Task (subagents):**
- Independent workstreams that can run in parallel
- Isolated tasks that shouldn't pollute the parent context
- Large tasks where you want separate context budgets

**Anti-pattern:** using Task for simple sequential operations (the overhead isn't worth it for small tasks).

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

## 11. 10 Most Common First-Week Mistakes

These mistakes are observed consistently among new Claude Code users. Each costs time and money — learn them now to avoid them.

### Mistake 1: Context-free prompts

**Wrong:**
```
> Fix the bug
```

**Right:**
```
> The createUser() function in src/users/service.py throws a KeyError when 
  the email field is missing. Fix it to return a 400 validation error instead.
```

**Why it matters:** Claude cannot read your mind. Vague prompts force Claude to guess, which wastes turns and tokens exploring the wrong areas.

### Mistake 2: Skipping /plan for large tasks

**Wrong:**
```
> Refactor the entire authentication system to use JWT tokens
```
(jumping straight to execution)

**Right:**
```
> /plan
> Refactor the entire authentication system to use JWT tokens
```

**Why it matters:** For large tasks, Claude will attempt execution immediately. A `/plan` step lets you validate the approach before any files change. A wrong refactor plan discovered after 30 turns is expensive.

### Mistake 3: Not using /compact — running out of context

**Symptom:** Claude starts forgetting earlier decisions or producing worse output mid-session.

**Fix:** Run `/compact` when the context window is ~50% full (check with `/context`). Don't wait until it's at 85% — compaction quality degrades near the limit.

```
/compact Focus on the auth refactor we just completed
```

The `Focus on...` instruction guides what the summary preserves.

### Mistake 4: Leaving CLAUDE.md empty or writing it once and forgetting it

**Wrong:** Empty CLAUDE.md, or one written at project start that's never updated.

**Right:** Update CLAUDE.md when you discover:
- A project-specific convention Claude gets wrong repeatedly
- A command that differs from the standard (e.g., `make test` instead of `pytest`)
- A non-obvious architecture decision Claude needs to know
- A file or directory Claude should never touch

**Why it matters:** CLAUDE.md is loaded every session. It's the highest-leverage documentation you can write.

### Mistake 5: Using Bash when native tools are faster

**Wrong:**
```
> Run: cat src/config.py | grep DATABASE
```

**Right:**
```
> Search src/config.py for DATABASE
```
or
```
> Read src/config.py and find the database configuration
```

**Why it matters:** The `Bash` tool has permission overhead. `Read` and `Grep` are direct and faster.

### Mistake 6: Not scoping prompts — letting Claude read the entire codebase

**Wrong:**
```
> Add error handling to all API endpoints
```

**Right:**
```
> Add error handling to the 3 endpoints in src/api/users.py that currently 
  have no try/catch blocks. Follow the pattern in src/api/orders.py line 45-60.
```

**Why it matters:** Unscoped prompts cause Claude to read dozens of files it doesn't need, spending tokens on context that doesn't help.

### Mistake 7: Ignoring exit codes and assuming Claude succeeded

**Wrong:** Trusting Claude's "Done!" message without checking.

**Right:**
```
> Run the tests now and show me the output
```
or set up a Stop hook that runs tests automatically.

**Why it matters:** Claude can misread output or optimistically declare success. Always verify with an explicit test run.

### Mistake 8: Using the wrong model for the task

| Task type | Right model | Wrong choice |
|-----------|-------------|--------------|
| Bulk file renaming | Haiku 4.5 ($0.80/M) | Opus 4.8 ($15/M) = 18× overspend |
| Complex architectural review | Opus 4.7 | Haiku 4.5 = poor output |
| Frontier/novel problems | Opus 4.8 | Opus 4.7 = usually fine but Opus 4.8 is strongest |
| Standard feature work | Sonnet 4.6 | Opus 4.8 = 5× overspend |
| CI quick scans | Haiku 4.5 | Sonnet 4.6 = 4× overspend |

Switch model with `/model` or `--model` flag. The `opus` alias now resolves to `claude-opus-4-8`, the newest and most capable Opus model.

### Mistake 9: Not rewinding after a wrong turn

**Symptom:** Claude made 5 changes you don't want, but you kept going hoping it would fix itself.

**Fix:** Press `Esc×2` immediately when Claude goes in the wrong direction. The rewind menu lets you roll back to any checkpoint.

**Why it matters:** Every wrong turn compounds. Stop early, rewind, and give Claude a better-scoped prompt.

### Mistake 10: Running Claude Code in production directories without permission limits

**Wrong:** Starting `claude` in a production directory with no permission configuration.

**Right:**
```json
// .claude/settings.json
{
  "permissions": {
    "deny": ["Bash(rm:*)", "Bash(git push*)", "Bash(kubectl delete*)"]
  }
}
```

**Why it matters:** In auto-accept mode, Claude can delete files, push to main, or drop database tables. Explicit deny rules prevent accidents.

---

## 12. Session Management

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

## 13. Cost Management Tips

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

## 14. Next Steps

| If you want to… | Go to |
|----------------|-------|
| Master every feature | [CLI Technical Reference](./claude-code-reference) |
| Deep-dive every slash command + build custom commands | [Slash Commands — Complete Reference](./slash-commands-reference) |
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

---

## Advanced Usage Tips

### Parallel Development with Worktrees

Run multiple Claude Code sessions on different branches simultaneously:

```bash
# Create a worktree branch
claude /branch feature/auth-refactor

# Claude creates the worktree and opens a new session
# Your original session continues on main
```

→ [Full Worktrees Guide](./worktrees-guide)

### Custom Project Commands

Create team-shared slash commands in `.claude/commands/`:

```bash
# .claude/commands/review-pr.md
---
description: Review the current PR for security issues
---
Review the git diff for security vulnerabilities, logic errors, and API surface changes.
Focus on: input validation, SQL injection, secret exposure, authentication bypasses.
```

Run it with: `/review-pr`

### Using Claude in CI/CD

```bash
# Non-interactive mode for automation
claude -p "Run tests and fix any failures" \
  --max-turns 10 \
  --permission-mode bypassPermissions \
  --bare
```

→ [Full CI/CD Integration Guide](./cicd-integration)

---

## 15. Mastering the Agentic Loop

The agentic loop is not a black box — it is a precisely defined execution model with well-known entry and exit points. Understanding it deeply will help you write better prompts, diagnose unexpected behaviour, control cost, and design reliable automations.

### What actually happens in one turn

When you press Enter on a prompt, the following sequence occurs:

1. **UserPromptSubmit hooks fire.** Any hooks registered on this event run first. They can inject additional context into the prompt (via stdout) or abort the entire turn (exit code 2). This is where prompt logging, team policy checks, and context injection happen.

2. **The full conversation is sent to the model.** Claude receives your complete message history, the system prompt (which includes your CLAUDE.md, loaded rules, and skills), and all available tool schemas. This is an HTTP call to the Anthropic API (or Bedrock/Vertex if configured).

3. **The model responds.** The response includes text and/or one or more `tool_use` blocks. The `stop_reason` field tells Claude Code how to proceed.

4. **If `stop_reason == "tool_use"`:**, PreToolUse hooks fire for each tool call. A hook can block the call (exit 2), modify its input (via stdout JSON), or let it proceed (exit 0). The tool executes. PostToolUse hooks fire with the result. The result is appended to the conversation and the loop restarts from step 2.

5. **If `stop_reason == "end_turn"`:**, Stop hooks fire. A hook that exits 2 forces Claude to continue — this is how you implement automated test-and-fix cycles. If all Stop hooks exit 0, the loop ends and control returns to you.

### The key mental model: Claude never reads your intent

Claude does not have a goal it is "working toward" between turns. Each API call is independent — Claude sees the full conversation context and generates the single best next action. The illusion of continuous intent comes from the loop structure, not from any persistent model state. This means:

- **Long tasks need explicit milestones.** If you ask Claude to "refactor the authentication module", it will attempt this in one continuous loop. If context runs out mid-task, Claude may produce incomplete work. Better: ask Claude to first write a plan to a file, then execute it step by step, committing after each step.
- **Interrupting mid-task is safe.** `Ctrl+C` aborts the current tool call but does not corrupt the conversation. Files already written are kept. You can resume with a correction.
- **Every loop iteration costs money.** A 30-turn session that reads 40 files costs roughly $0.80–$2.00 depending on model and file sizes. The `/context` command shows you exactly where tokens are going.

### Working with the loop effectively

**Provide a clear exit condition.** Vague tasks like "improve the tests" leave Claude deciding when to stop. Specific tasks like "ensure all tests in `tests/auth/` pass with zero failures" give Claude a deterministic termination check.

**Use Plan Mode for uncertain tasks.** Before allowing any writes, enter `/plan` mode to let Claude describe its full approach. You can then accept, redirect, or abort before a single file changes. This saves the cost of unwinding a wrong approach.

**Use Stop hooks for automated verification.** A Stop hook that runs your test suite and exits 2 if tests fail will cause Claude to automatically fix the failure and try again — no human needed. This is the core of CI-quality autonomous loops.

**Monitor token consumption.** Run `/context` to see a breakdown of where tokens are used. The system prompt (CLAUDE.md + rules + tool schemas) typically costs 2,000–15,000 tokens every turn. Long conversation histories compound this. Use `/compact` before the context window reaches 70% full to prevent quality degradation.

**Set `--max-turns` for safety.** In any automated context, always set `--max-turns` to a reasonable limit (10–30 for most tasks). Without it, a confused model or a faulty Stop hook can cause an infinite loop that exhausts your budget.

### Agentic loop decision guide

```
Task is well-defined and bounded?
├── YES ──► Run in Normal mode; use Auto-Accept if you trust the task scope
└── NO  ──► Use /plan first, then approve and execute

Task modifies many files?
├── YES ──► Ask Claude to commit after each logical step
│           (this also creates rewind points)
└── NO  ──► Single-shot is fine

Task is in CI/CD?
├── YES ──► --permission-mode bypassPermissions + --max-turns + --max-budget-usd
│           + Stop hook that runs tests
└── NO  ──► Interactive mode with /plan + periodic /context checks

Context window above 60%?
├── YES ──► /compact before continuing
└── NO  ──► Proceed normally
```

---

## 16. CLAUDE.md Quick Templates

Use these templates as starting points. Every template is intentionally concise — CLAUDE.md is loaded on every session start, so every line costs tokens on every run. The goal is maximum signal per token.

### Template 1: Minimal (20–40 lines)

Suitable for: small projects, solo developers, quick experiments.

```markdown
# Project Name

Brief description (2 sentences max). Stack: [language], [framework], [database].

## Commands
```bash
[build command]
[test command]
[lint command]
```

## Critical Rules
- [Most important rule — e.g., "never use SELECT *"]
- [Second most important rule]
- [Third most important rule]

## Do Not Touch
- [file or directory Claude should never modify]
```

Keep it under 40 lines. Add new rules only when you observe Claude making the same mistake twice.

### Template 2: Standard (60–120 lines)

Suitable for: team projects, production codebases, multi-service repositories.

```markdown
# [Project Name]

## Overview
[2–3 sentence description]. Stack: [full tech stack with versions].
Deployment: [where it runs — e.g., "Azure AKS, PostgreSQL 15, Redis 7"].

## Repository Layout
- `src/` — application source
  - `api/` — HTTP handlers
  - `domain/` — business logic (no infrastructure deps)
  - `infra/` — database, cache, external services
- `tests/` — all tests; mirrors `src/` structure
- `scripts/` — operational scripts (not part of the app)

## Development Commands
```bash
make dev          # start full local stack (requires Docker)
make test         # run all tests
make test-unit    # unit tests only (fast)
make lint         # run linter + type checker
make migrate      # apply pending database migrations
make seed         # seed database with test data
```

## Architecture Decisions
- Domain layer has ZERO infrastructure dependencies (enforced by linting)
- All API responses use `Result<T, E>` wrapper — see `src/api/types.ts`
- Errors are never swallowed — always propagate with context
- Database: never use raw queries; always use the repository pattern in `src/infra/db/`

## Conventions
- Branch names: `feat/`, `fix/`, `refactor/`, `docs/`
- Commits: conventional commits (`feat:`, `fix:`, etc.)
- Tests: every public function needs a unit test; every endpoint needs an integration test
- Environment variables: defined in `.env.example`; never hardcoded

## Critical "Never Do"
- Never modify `migrations/` manually — use `make migration name=...`
- Never commit `.env` files — they are gitignored
- Never bypass the `Result<T, E>` wrapper with direct `throw`
- Never use `any` type in TypeScript

## External Dependencies
- Stripe API (payments): docs at [internal wiki link]
- SendGrid (email): rate limit is 100/min
- Postgres connection pool: max 20 connections — don't create additional pools
```

### Template 3: Enterprise (150–200 lines)

Suitable for: large teams, regulated environments, multi-codebase monorepos. Place at `~/.claude/CLAUDE.md` as a global base, then use project-level CLAUDE.md files for overrides.

```markdown
# [Organisation] — Claude Code Enterprise Configuration

## Governance
This CLAUDE.md encodes our engineering standards. Every Claude Code session
for org members MUST comply with these rules.

**Security clearance required for:** production credentials, customer PII,
anything in `infra/prod/`. If you don't have access, Claude will not either.

## Code Quality Invariants
- All changes must pass: `make lint && make typecheck && make test`
- Security scan on every edit: PostToolUse hook runs `semgrep --config auto`
- No secrets in code — detector runs on every commit (PreToolUse hook)
- Dependency updates require approval from `@platform-team`

## Repository Map
[List of repos and their purposes]

## Required Patterns
- Logging: structured JSON via `src/observability/logger.ts` — never `console.log`
- Error handling: `AppError` class with `code`, `message`, `context` fields
- API clients: generated from OpenAPI specs — never hand-write client code
- Feature flags: LaunchDarkly — never use env vars for feature toggles

## Forbidden Operations (enforced by hooks)
- `Bash(rm -rf*)` — DENIED
- `Bash(git push --force*)` — DENIED (force push to main)
- `Bash(kubectl delete*)` — DENIED without explicit approval
- `Bash(DROP TABLE*)` — DENIED
- Writing to `infra/prod/` — DENIED without an active change ticket

## Team Contacts
- Platform questions: #platform-eng Slack
- Security issues: security@[domain] (never commit to handle in-session)
- DB migrations: DBA approval required — file ticket first

## Session Startup Checklist
Claude will verify at session start:
1. Are we on a feature branch? (not main/master)
2. Is the local stack running? (docker-compose ps)
3. Are there uncommitted changes from a previous session? (git status)

## Cost Governance
- Default model: claude-sonnet-4-6
- Upgrade to Opus only with `/model claude-opus-4-8` for architecture decisions
- Max budget per session: $5 (enforced via --max-budget-usd in CI)
- Weekly team spend reviewed in #ai-costs channel
```

---

## 17. First Week Workflow

The first week with Claude Code is about building the right habits and mental models. Follow this day-by-day guide to go from installation to confident daily use.

### Day 1: Installation and First Contact

**Morning (30 minutes):**
1. Install Claude Code (`claude --version` to verify)
2. Authenticate (`claude` — browser OAuth flow)
3. Navigate to a small, familiar project
4. Run: `> Summarise this codebase in three paragraphs`
5. Run: `> List all TODO comments`
6. Observe the agentic loop in action — watch which files Claude reads

**Goal:** Understand that Claude reads your actual files, not just your description.

**Evening (20 minutes):**
- Run `/init` to auto-generate a CLAUDE.md
- Review the generated file — edit it to remove anything generic, add anything project-specific
- Run `/context` to see how many tokens your CLAUDE.md uses

### Day 2: Learn the Keyboard Shortcuts

**Practice the three most important shortcuts:**
- `Shift+Tab` — cycle through modes (try each mode, observe the prompt indicator)
- `Esc×2` — open the rewind menu (make a small change, then rewind it)
- `Ctrl+B` — background a long Bash command (start a build, press Ctrl+B, ask a question)

**Practice prompt patterns:**
```
> Explain what the [function] does in [file]           # understanding
> Fix [specific bug] in [specific file]                # targeted edit
> /plan                                                # plan before big change
> Add [feature] following the pattern in [reference]  # pattern-guided addition
```

**Goal:** No more than 2 wrong prompts in a row before rewinding and restarting.

### Day 3: Context Management

**Morning:** Watch `/context` throughout a work session. Note when it crosses 30%, 50%, 70%.

**Practice:**
- Run `/compact` when context is at 50% and compare before/after
- Use `/compact Focus on the [task you're working on]` to preserve specific context
- Name sessions with `/rename [descriptive-name]` and retrieve them with `/resume`

**Goal:** Never hit 80%+ context without having compacted first.

### Day 4: Build Your CLAUDE.md Iteratively

**Whenever Claude makes a mistake today:**
1. Note what it got wrong (wrong command, wrong convention, missed constraint)
2. Add a rule to your CLAUDE.md covering it
3. Run `/clear` and retry the task

By end of day, your CLAUDE.md should have 5–10 rules derived from actual failures.

**Goal:** Claude should make zero repeated mistakes by end of day.

### Day 5: Your First Multi-Step Task

Choose a task that involves 3+ files and 2+ steps (e.g., "add a new API endpoint with tests"):

```
> /plan
> Add a DELETE /users/:id endpoint that soft-deletes users.
  Follow the pattern in src/api/users/create.ts.
  Include a unit test and an integration test.
```

Review the plan. Approve it. Watch Claude execute. Interrupt with `Ctrl+C` if anything goes wrong.

**Goal:** Complete a multi-step task without starting over.

### Day 6: Explore Agent Features

**Try subagents:**
```
> Analyse the three API modules (users, orders, products) in parallel.
  For each, identify: test coverage %, any missing error handling, 
  and any performance anti-patterns.
```

**Try hooks** (PostToolUse auto-lint):

Add to `.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write|MultiEdit",
      "hooks": [{ "type": "command", "command": "npm run lint --fix 2>&1 | head -20" }]
    }]
  }
}
```

**Goal:** Experience parallel subagents and automatic hooks.

### Day 7: Review and Calibrate

**Morning audit:**
- Review your CLAUDE.md — is everything still accurate?
- Check your `/stats` or session history — how much did you spend this week?
- Identify the 3 prompts that worked best and the 3 that cost the most retries

**Establish a personal workflow:**
- Which tasks do you always use `/plan` for?
- Which do you always run in Auto-Accept mode?
- What goes in your CLAUDE.md vs your rules files vs slash commands?

**Goal:** Articulate your personal Claude Code workflow to a colleague.

---

## 11. June 2026 Tips & Best Practices

### Fastest Path to a Productive Session

The four-step pattern that experienced users follow every session:

```
1. Start in project root
   cd ~/projects/my-project
   claude
   
2. Check context budget immediately
   > /context        ← see token usage before doing anything
   
3. Clear if coming from a previous unrelated task
   > /clear          ← reset conversation, keep all config loaded
   
4. Use effort level wisely
   > /config         ← set effort to match task complexity
   (low for formatting, high for architecture)
```

### Session Rhythm for Long Tasks

```
Start:     /clear → describe overall goal → Claude makes plan
Work:      Let Claude run tool loop autonomously
Monitor:   Check /context at 50% — /compact proactively at 70%
Capture:   At end of session: "Save key decisions to MEMORY.md"
Resume:    /rename my-oauth-work → close → later: /resume my-oauth-work
```

### CLAUDE.md Best Practices (June 2026)

The single most impactful thing you can do for a new project:

```markdown
# [Project Name]

## Tech Stack
- Language: TypeScript 5.4 + Node.js 20
- Framework: Express 4
- Database: PostgreSQL 16 via Drizzle ORM
- Testing: Vitest + Supertest

## Conventions (follow these exactly)
- All async functions return Promise<T>, never throw — use Result<T, E> pattern
- API handlers in src/handlers/, schemas in src/schemas/, services in src/services/
- Every new endpoint needs: (1) Zod input schema, (2) handler, (3) route registration, (4) unit test

## Do NOT
- Use `any` type
- Write raw SQL — always use Drizzle query builder
- Commit secrets or .env files

## Project Structure
src/
├── handlers/     # HTTP request handlers
├── services/     # Business logic
├── schemas/      # Zod validation schemas  
├── db/           # Database layer (Drizzle)
└── middleware/   # Express middleware
```

**Keep CLAUDE.md under 120 lines.** Move detailed reference material to `.claude/rules/` files with `paths:` globs so they only load for relevant file types.

### Cost Management Quick Reference

| Daily budget | Strategy | Expected cost |
|-------------|---------|--------------|
| Low (~$1/day) | Haiku for everything, Sonnet for complex only | $0.50–2/day |
| Medium (~$5/day) | Sonnet default, Opus for hard problems | $2–8/day |
| High (~$20/day) | Opus for most work, unrestricted | $10–30/day |

- Use `/usage` to check costs mid-session
- Enable prompt caching (automatic) — 80% cache hit = 73% cost reduction
- Use `high` effort only when needed — it's 3–5x more expensive than `normal`
- Haiku for CI/CD tasks — same quality for tool-use, fraction of the cost

---

## 18. Common New User Mistakes — Quick Reference Table

| Mistake | Symptom | Quick Fix |
|---------|---------|-----------|
| **Context-free prompt** | Claude reads many files but produces generic output | Add: file path, function name, specific error message, expected behavior |
| **Skipping /plan for large tasks** | Claude executes immediately and goes in wrong direction | Always use `/plan` before tasks touching 5+ files |
| **Letting context fill to 90%+** | Output quality degrades; Claude starts forgetting earlier decisions | Run `/compact [focus instruction]` at 60–70% |
| **Stale CLAUDE.md** | Claude repeats the same mistake your CLAUDE.md should prevent | Update CLAUDE.md immediately after each observed mistake |
| **Using Bash for file reads** | Slower, permission-prompt-heavy sessions | Use `Read`, `Edit`, `Grep`, `Glob` instead of `cat`, `sed`, `grep`, `find` |
| **No permission limits in prod dirs** | Risk of accidental deletion or push in auto-accept mode | Add deny rules: `Bash(rm -rf*)`, `Bash(git push --force*)` |
| **Wrong model for the task** | Overspend (Opus on trivial tasks) or poor output (Haiku on complex tasks) | Haiku for bulk/simple; Sonnet for standard work; Opus for architecture |
| **Not rewinding after wrong turn** | Claude compounds mistakes across 10+ turns | Press `Esc×2` immediately and restate with a tighter prompt |
| **Trusting "Done!" without verification** | Undetected test failures or silent errors | Always follow up: `> Run the tests and show me the output` |
| **Giant single prompts** | Claude misses constraints in a long list | Break into: (1) plan, (2) execute step A, (3) verify, (4) execute step B |
| **Auto-Accept in an unfamiliar codebase** | Unexpected file changes in areas you didn't expect | Stay in Normal mode until you understand the codebase |
| **No session naming** | Can't find yesterday's session | Use `/rename` immediately when starting a significant session |
