---
title: Slash Commands — Complete Reference
description: >
  Complete reference for all Claude Code slash commands — built-in session commands,
  configuration commands, agent and skill management, session navigation, debugging tools,
  project setup, and creating custom slash commands (project and personal commands
  with frontmatter, special variables, file imports, and shell execution).
  Claude Code v2.1.126 (May 2026).
sidebar:
  order: 12
  label: Slash Commands
lastUpdated: 2026-05-09
---

# Slash Commands — Complete Reference

> **Version:** v2.1.126 (May 9, 2026) · Covers all built-in commands through v2.1.126 plus the complete custom command authoring API.

Slash commands are short, typed directives you send in the Claude Code REPL to control session behavior, navigate history, manage configuration, and invoke pre-written workflows. They complement natural-language prompts by providing fast, deterministic access to features that would otherwise require verbose instructions or navigating a settings file.

---

## 1. Slash Command Overview

### What slash commands are

A slash command is any message that begins with `/` followed by a keyword. When Claude Code sees a leading `/`, it matches the keyword against its registry of built-in commands and your library of custom commands before processing the message as a prompt.

```
/compact focus on the authentication module
^        ^-------- optional arguments -------^
|
keyword matched against command registry
```

### Two categories

| Category | Source | Examples |
|----------|--------|----------|
| **Built-in** | Shipped with Claude Code binary | `/clear`, `/compact`, `/model`, `/doctor` |
| **Custom** | Markdown files you write | `/review`, `/pr`, `/deploy`, anything you name |

Built-in commands are hard-coded into the binary and cannot be overridden. Custom commands are discovered at startup by scanning `~/.claude/commands/` (personal) and `.claude/commands/` (project). A project command with the same name as a personal command silently wins — project takes precedence.

### Autocomplete

Type `/` and pause for one second. Claude Code shows an autocomplete picker listing every registered command (built-in + custom) with the first line of its description. Arrow-key navigation, `Tab` to confirm, `Esc` to dismiss.

You can also type partial keywords — `/co` matches `/compact`, `/config`, `/context`, and `/changelog`.

### Browsing all commands

```
/help           — list all commands (built-in + custom) with one-line descriptions
/help compact   — show full help text for a specific command
```

The `/help` output is searchable: type a keyword after `/help` and results are filtered in real time.

---

## 2. Built-in Commands — Session Management

### `/clear`

**Purpose:** Reset the conversation history while keeping all loaded configuration (CLAUDE.md, rules, skills, hooks, MCP servers).

```
/clear
```

After `/clear` the context window is empty, but Claude Code still knows your project settings, tools permissions, and model choice. Use it before switching to an unrelated task within the same session to avoid stale context bleeding into a new topic.

**When to use:**
- Starting a fresh task after completing one
- Recovering from a confused or derailed conversation
- Freeing context window space without losing config

**When NOT to use:**
- When you need continuity with prior conversation — use `/compact` instead
- To switch projects — open a new terminal session or use `/branch`

---

### `/compact [instructions]`

**Purpose:** Summarise the conversation history into a compressed representation, freeing context window capacity while preserving the gist of what happened.

```
/compact
/compact focus on the authentication changes we discussed
/compact ignore the test output, concentrate on the design decisions
```

**How it works:**

1. Claude Code sends the full conversation to the model with an internal summarisation prompt.
2. The summary is written back as a single synthetic assistant message, replacing all prior turns.
3. Project-root `CLAUDE.md` is re-read from disk and re-injected so instructions are fresh.
4. The session continues with the summary as the new baseline.

**Auto-compaction:** When the context window reaches **85% capacity**, Claude Code triggers compaction automatically. You will see a status line: `Compacting conversation…`. A compaction circuit breaker (introduced v2.1.89) prevents thrash loops — if the summary itself consumes more than 60% of the window, Claude Code halts and warns you instead of compacting again immediately.

**Optional instructions:** The text after `/compact` is passed to the summariser as a focus directive. Use it to steer what gets preserved when you care about specific threads.

**Token cost:** Compaction itself costs roughly 2,000–5,000 input tokens (the cost of reading the history) plus ~500 output tokens for the summary. This is almost always worth it when the alternative is hitting the context ceiling.

---

### `/rewind`

**Purpose:** Open the rewind menu and roll back both code changes and conversation history to a previous checkpoint.

```
/rewind
```

Pressing `Esc` twice in the REPL is the keyboard shortcut equivalent.

**Checkpoints:** Claude Code creates automatic checkpoints before every destructive operation (file writes, shell commands, git operations). Each checkpoint captures:
- A snapshot of every modified file
- The full conversation state at that moment

The rewind menu shows a chronological list of checkpoints with human-readable labels such as:
```
● 14:32  Before: Edit src/auth.ts — removed JWT middleware
● 14:28  Before: Bash — npm run build
● 14:19  Before: Edit src/db.ts, src/models/user.ts
```

Select a checkpoint and confirm to restore both the filesystem and conversation to that exact state. Rewinding does not require `git` — the checkpoint store is internal to Claude Code.

**Practical use cases:**
- Claude made a large edit that broke the build; you want to try a different approach
- You accepted a refactor but changed your mind after reviewing the diff
- A shell command had unintended side effects

---

### `/resume`

**Purpose:** Open an interactive session picker listing recent Claude Code sessions (named and unnamed) so you can continue a prior conversation.

```
/resume
```

The picker displays:
- Session name (if named via `/rename`)
- Project root path
- Last active timestamp
- Approximate token count of the conversation

Select a session and press Enter to restore it, including its full conversation history, loaded configuration, and tool permissions. Named sessions appear at the top of the list, sorted by recency.

Sessions are stored in `~/.claude/sessions/` as compressed JSON. They persist across terminal restarts, machine reboots, and Claude Code upgrades.

---

### `/rename [name]`

**Purpose:** Give the current session a memorable name so it surfaces prominently in `/resume`.

```
/rename
/rename auth-refactor
/rename "payment gateway integration Q2-2026"
```

Called without arguments, `/rename` opens an inline input field. Called with a name argument, it applies the name immediately.

Named sessions are shown at the top of the `/resume` picker and are searchable by keyword. Names do not need to be unique — if you reuse a name, both sessions appear. Names can contain spaces when quoted.

---

### `/context`

**Purpose:** Display a live token usage breakdown showing how much of the context window each section consumes.

```
/context
```

Output format (illustrative):

```
Context Window — 200,000 tokens (claude-sonnet-4-6)

 Section                          Tokens   % Window
─────────────────────────────────────────────────────
 System / CLAUDE.md                 4,821     2.4 %
 Rules (7 files)                    2,108     1.1 %
 Auto-Memory                          312     0.2 %
 Skills (loaded: 2)                 1,440     0.7 %
 Conversation history              38,914    19.5 %
 Tool results (cached)             12,003     6.0 %
─────────────────────────────────────────────────────
 Total used                        59,598    29.8 %
 Remaining                        140,402    70.2 %
 Auto-compact threshold (85%)     170,000
```

Use `/context` to diagnose why Claude Code is compacting frequently (large rules files, verbose tool outputs), decide whether to run `/compact`, and understand what is driving your token costs.

---

### `/usage`

**Purpose:** Show the complete token accounting and estimated USD cost for the current session.

```
/usage
```

Output (illustrative):

```
Session Usage — auth-refactor

 Metric                      Value
──────────────────────────────────
 Input tokens (non-cached)   42,318
 Input tokens (cache hit)    89,441
 Output tokens                8,203
 Cache write tokens           3,102
 Total tokens               143,064
──────────────────────────────────
 Estimated cost              $0.187
 Cache savings               $0.134
 Session duration            47 min
```

Cache hits are billed at approximately 10% of the normal input token rate. `/usage` shows the savings so you can see how much caching is helping. The cost estimate uses list prices for the active model; it does not account for enterprise discounts or credit-pack rates.

---

### `/plan`

**Purpose:** Enter plan-only mode. Claude writes a detailed plan but cannot write files, run shell commands, or execute any tool that modifies state.

```
/plan
```

This is equivalent to launching Claude Code with `--permission-mode plan` from the CLI. The mode indicator in the status bar changes to `[PLAN MODE]`.

In plan mode:
- Read tools (Read, Glob, Grep, List) work normally
- Write tools (Edit, Write, MultiEdit) are blocked — Claude describes the edits instead
- Bash is blocked — Claude describes the commands instead
- Task (subagent spawning) is blocked
- The model's response always ends with a numbered action list

To exit plan mode and execute, type `/config` and switch permission mode back to `default`, or restart the session without the flag.

**Use cases:**
- Reviewing Claude's proposed approach before allowing any changes
- Generating a migration plan to share with a team for review
- Teaching sessions where you want to see the reasoning without the execution

---

## 3. Built-in Commands — Model & Configuration

### `/model`

**Purpose:** Switch the active Claude model mid-session without restarting.

```
/model
```

Opens a picker showing all models available to your account with their context windows and relative cost tier:

```
  claude-opus-4-7        1M tokens    $$$$$   Complex reasoning, architecture
  claude-opus-4-6        1M tokens    $$$$    Heavy analysis, long documents
▶ claude-sonnet-4-6      200K tokens  $$$     Balanced quality/speed (current)
  claude-haiku-4-5       200K tokens  $        Bulk operations, CI/CD, quick edits
```

The change takes effect immediately for the next turn. The model selection persists for the session but reverts to your default on the next session launch. To make a model change permanent, use `/config` which writes the setting to `settings.json`.

---

### `/config`

**Purpose:** Open a tabbed, interactive settings UI where changes are persisted to `~/.claude/settings.json` (introduced v2.1.119).

```
/config
```

**Tabs available:**

| Tab | Controls |
|-----|----------|
| Model | Active model selection; same picker as `/model` but saved |
| Effort | Low / Medium / High / xHigh effort levels (controls internal chain-of-thought depth) |
| Output Style | Activate a loaded output style from `.claude/output-styles/` |
| Permission Mode | Default / Plan / Accept-all; written to settings on save |
| Environment | View and edit environment variable overrides for the session |
| Advanced | Token budget overrides, compaction threshold, cache TTL |

Press `s` to save and close, `q` or `Esc` to close without saving. Any field left unchanged keeps its current value.

---

### `/permissions`

**Purpose:** View and manage the tool allowlist and blocklist for the current session.

```
/permissions
```

The display shows three sections:

**Allowed tools (session-level additions):**
```
  ✓ Bash(git *)         — added by user
  ✓ Edit(**/*.ts)       — added by user
```

**Blocked tools:**
```
  ✗ Bash(rm -rf *)      — blocked by project settings
  ✗ WebFetch            — blocked by enterprise policy
```

**Available actions (keyboard shortcuts shown in UI):**
- `a` — add an allowed tool pattern
- `d` — add a denied tool pattern
- `r` — remove a session-level override
- `v` — view all inherited permissions from project and enterprise settings

Permission changes made via `/permissions` apply for the current session only. To make them permanent, save via `/config` or edit `.claude/settings.json` directly.

For the full permission system including `settings.json` structure, allowlist syntax, and sandbox architecture, see the [Permissions & Security guide](./permissions-security).

---

### `/hooks`

**Purpose:** View and manage automation hooks that fire at session lifecycle events.

```
/hooks
```

Displays all active hooks grouped by event type:

```
PreToolUse (2 hooks)
  ├─ matcher: Bash(rm *)         → command: ./scripts/guard-rm.sh
  └─ matcher: Edit(**/*.prod.*)  → command: ./scripts/require-approval.sh

PostToolUse (1 hook)
  └─ matcher: Edit(**/*.ts)      → command: npx prettier --write $CLAUDE_FILE_PATH

SessionStart (1 hook)
  └─ (no matcher)                → command: ./scripts/inject-context.sh
```

**Interactive options:**
- `n` — add a new hook (prompts for event type, matcher, handler type, command)
- `r` — reload hooks from `~/.claude/settings.json` (equivalent to `claude hooks reload`)
- `e` — open the hooks configuration file in your editor
- `d` — disable/enable a specific hook

For the full hooks reference including all 30+ events, five handler types, exit codes, and production patterns, see the [Hooks System — Deep Dive](./hooks-deep-dive).

---

## 4. Built-in Commands — Memory & Knowledge

### `/memory`

**Purpose:** View all loaded CLAUDE.md and rules files, toggle auto-memory, browse the memory folder, and open files in your editor.

```
/memory
```

**What it shows:**

```
Loaded Memory Files
───────────────────────────────────────────────────
 Source                                    Tokens
 /etc/claude-code/CLAUDE.md (Enterprise)     812
 ~/.claude/CLAUDE.md (User)                1,204
 ./CLAUDE.md (Project)                     3,418
 ./CLAUDE.local.md (Local override)          220
 .claude/rules/testing.md                    408
 .claude/rules/typescript.md                 631
───────────────────────────────────────────────────
 Total context from memory files           6,693

Auto-Memory: ENABLED
 Location: ~/.claude/projects/abc123/memory/MEMORY.md
 Size: 47 lines / 3.1KB (limit: 200 lines / 25KB)
```

**Interactive options:**
- `e` — open a selected memory file in your editor (`$EDITOR`)
- `t` — toggle auto-memory on or off for this project
- `b` — browse the auto-memory folder in your file browser
- `r` — reload all memory files from disk without restarting the session

Use `/memory` to diagnose context bloat (large CLAUDE.md files), verify that project rules are loading correctly, or check whether auto-memory is accumulating entries you want to prune.

---

### `/todos`

**Purpose:** View and interactively manage the structured task list Claude Code maintains via the `TodoWrite` / `TodoRead` tool.

```
/todos
```

Output format:

```
Current Task List
─────────────────────────────────────────────
 ◐ IN PROGRESS  Refactor UserService to use repository pattern
 ○ PENDING      Write unit tests for UserRepository
 ○ PENDING      Update OpenAPI spec with new endpoints
 ✓ DONE         Extract database connection pool to shared module
 ✓ DONE         Add index to users.email column
```

**Interactive options:**
- `a` — add a new task
- `d` — mark a task done
- `r` — remove a task
- `e` — edit task text
- `p` — reorder tasks (move up / down)

The task list is a shared data structure between you and Claude Code. Claude updates it automatically as it works through a multi-step task. You can use `/todos` to redirect Claude's priorities during a long agentic run — add a task that appears before the next pending item and Claude will pick it up on the next iteration.

---

## 5. Built-in Commands — Agents, Skills & MCP

### `/agents`

**Purpose:** List, browse, create, and edit subagent definitions from both personal (`~/.claude/agents/`) and project (`.claude/agents/`) locations.

```
/agents
```

The picker shows each agent's name, scope (personal / project / plugin), and the first line of its `description` frontmatter field:

```
  NAME                 SCOPE      DESCRIPTION
  ─────────────────────────────────────────────────────────────────
  code-reviewer        project    Reviews diffs for correctness, security, style
  test-writer          project    Generates unit and integration tests from code
  doc-generator        personal   Writes JSDoc / XML doc comments for a function
  sql-optimizer        personal   Analyses and optimises slow SQL queries
```

**Interactive options:**
- `n` — create a new agent (opens a template in `$EDITOR`)
- `e` — open an existing agent definition for editing
- `v` — view the full frontmatter and body of a selected agent
- `d` — delete an agent definition file

For the full subagent authoring API (YAML frontmatter fields, memory, agent teams, orchestration patterns), see the [Agent Teams & Subagents guide](./agent-teams-guide).

---

### `/skills`

**Purpose:** Browse all installed skills, see their auto-invocation descriptions, and invoke one manually.

```
/skills
```

Output (illustrative):

```
  NAME             SCOPE     AUTO-INVOCATION DESCRIPTION
  ──────────────────────────────────────────────────────────────────────
  pr-review        project   When user asks to review a PR or diff
  sql-explain      project   When user asks to explain or optimise a SQL query
  openapi-gen      personal  When user asks to generate an OpenAPI spec
  changelog-gen    personal  When user asks to write a changelog entry
```

Skills differ from slash commands in a key way: **skills are auto-invoked by Claude based on semantic matching of the description**, while slash commands require explicit typing. A skill can also be invoked manually by typing its name as a slash command (e.g., `/pr-review`), which is why skills and project slash commands share the same namespace since v2.1.3.

**Interactive options:**
- `i` — invoke a skill manually (same as typing `/skill-name`)
- `e` — open the `SKILL.md` file for editing
- `v` — view the full skill definition including supporting files

---

### `/mcp`

**Purpose:** View and manage MCP (Model Context Protocol) server connections.

```
/mcp
```

The status display:

```
  SERVER           TRANSPORT   STATUS    TOOLS
  ────────────────────────────────────────────────────────
  filesystem       stdio       ✓ online  read_file, write_file, list_dir (3)
  github           sse         ✓ online  search_code, list_issues, create_pr (14)
  postgres         stdio       ✗ error   (connection refused :5432)
  slack            http        ⚡ idle    send_message, list_channels (2)
```

**Interactive options:**
- `r` — restart a selected server
- `s` — start a stopped/error server
- `x` — stop a running server
- `l` — view the error log for a server
- `t` — list all tools provided by a server with their descriptions

For full MCP architecture, transport types, configuration scopes, and building custom servers, see the [MCP Servers guide](./mcp-servers-guide).

---

## 6. Built-in Commands — Git & Workspace

### `/branch [name]`

**Purpose:** Create a git worktree on a new branch and open a fresh Claude Code session in it, enabling parallel development across multiple branches.

```
/branch
/branch feature/new-auth
/branch --from main hotfix/payment-bug
/branch --list
/branch --clean
```

**Options:**

| Flag | Description |
|------|-------------|
| `--from <ref>` | Base the new branch on this commit/branch/tag (default: `HEAD`) |
| `--list` | List all active worktrees without creating a new one |
| `--clean` | Remove worktrees for branches that have been merged and deleted |

When you run `/branch feature/new-auth`:
1. Claude Code runs `git worktree add ../project-feature-new-auth feature/new-auth` (creating the branch if it doesn't exist).
2. A new Claude Code session launches in that directory.
3. The original session remains running in your current terminal tab.

This is the preferred way to work on multiple tasks simultaneously without context pollution. Each worktree session has its own conversation history, tool permissions, and session state.

For a detailed guide on parallel development patterns with worktrees, see [Worktrees & Parallel Development](./worktrees-guide).

---

### `/init`

**Purpose:** Auto-generate a `CLAUDE.md` file for the current project by analysing its codebase structure, conventions, and tooling.

```
/init
```

Claude Code performs a structured codebase scan:
1. Reads package manifests (`package.json`, `pyproject.toml`, `Cargo.toml`, `*.csproj`, etc.)
2. Detects framework patterns (React, Next.js, FastAPI, Django, .NET, etc.)
3. Reads `Makefile`, `justfile`, `scripts/` to discover build/test/deploy commands
4. Samples a selection of source files to infer coding conventions
5. Reads existing `README.md` and `CONTRIBUTING.md` if present

The generated `CLAUDE.md` is written to the project root and opened in your editor for review before being committed. Sections typically include: tech stack, directory structure overview, key commands, coding conventions, and any important caveats.

Run `/init` once when starting work on an existing codebase you did not write. For your own projects, hand-write `CLAUDE.md` from the start — it will be more accurate and tightly scoped.

---

## 7. Built-in Commands — Diagnostics & Setup

### `/doctor`

**Purpose:** Run a health check across all Claude Code subsystems with automatic repair where possible. Introduced in v2.1.105.

```
/doctor
```

The health check covers:

| Check | What it verifies |
|-------|----------------|
| API connectivity | Can reach `api.anthropic.com` (or Bedrock/Vertex endpoint) |
| Authentication | API key valid, not expired, has required permissions |
| CLI version | Current vs latest stable; warns if more than 5 versions behind |
| MCP servers | Each configured server starts cleanly; lists errors for failing ones |
| Hooks | Each configured hook script exists and is executable |
| File permissions | `~/.claude/` directory and subdirectories are writable |
| Node.js / binary | Runtime is a supported version (or native binary is intact) |
| Sandbox | Sandbox binary is accessible and the user has permission to run it |

Press `f` while the check is displayed to trigger auto-fix for any flagged issue. Auto-fix actions include: re-authenticating, downloading the latest version, creating missing directories, and setting executable bits on hook scripts.

---

### `/debug`

**Purpose:** Open the debug panel showing live session internals for troubleshooting.

```
/debug
```

**Debug panel sections:**

```
SESSION STATE
  Session ID:        sess_01AbCdEfGh
  Model:             claude-sonnet-4-6
  Permission mode:   default
  Effort level:      medium
  Context used:      59,598 / 200,000 tokens

LOADED FILES
  CLAUDE.md (project):    3,418 tokens
  rules/testing.md:         408 tokens
  rules/typescript.md:      631 tokens
  skills/pr-review (active)

ACTIVE HOOKS
  PreToolUse:   2 hooks (scripts/guard-rm.sh, scripts/require-approval.sh)
  PostToolUse:  1 hook (npx prettier)
  SessionStart: 1 hook (scripts/inject-context.sh)

MCP SERVERS
  filesystem: online  github: online  postgres: ERROR

RECENT TOOL CALLS (last 10)
  14:31:04  Read       src/auth/jwt.ts              200 OK
  14:31:09  Edit       src/auth/jwt.ts              OK
  14:31:14  Bash       npm test                     exit 1
  14:31:22  Read       src/auth/jwt.test.ts         200 OK

ERROR LOG
  [14:31:14] Bash tool exit code 1: 3 tests failed
```

Use `/debug` as your first stop when Claude Code is behaving unexpectedly — it reveals exactly what files are loaded, what hooks are firing, and what the last few tool calls returned.

---

### `/terminal-setup`

**Purpose:** Configure terminal integration settings. Introduced in v2.1.116.

```
/terminal-setup
```

**Settings available:**

| Setting | Options | Default |
|---------|---------|--------|
| Scroll sensitivity | 1–10 (lines per scroll event) | 3 |
| Clipboard mode | `auto`, `xclip`, `pbcopy`, `wl-clipboard` | `auto` |
| iTerm2 shell integration | Enable / disable | Disabled |
| Mouse support | Enable / disable click-to-position cursor | Enabled |
| Hyperlinks | ANSI hyperlink sequences in output | Enabled |

Run `/terminal-setup` once after installation, especially on Linux where the clipboard backend may need explicit selection, or when using iTerm2 on macOS where shell integration provides jump-to-prompt markers.

---

### `/keybindings`

**Purpose:** Open `~/.claude/keybindings.json` in your editor to define custom key bindings for the REPL.

```
/keybindings
```

If the file does not exist, Claude Code creates it with a commented template. The format:

```json
{
  "bindings": [
    { "key": "ctrl+r", "command": "/review" },
    { "key": "ctrl+p", "command": "/plan" },
    { "key": "ctrl+shift+c", "command": "/compact" },
    { "key": "f5", "command": "/rewind" }
  ]
}
```

Each binding maps a key combination to any slash command (built-in or custom). Changes take effect the next time Claude Code starts. There is no live reload for keybindings.

---

### `/theme`

**Purpose:** Browse and apply color themes to the Claude Code REPL interface.

```
/theme
```

The theme picker shows built-in presets and any themes loaded from plugins or `~/.claude/themes/`:

```
  ● default       Standard Anthropic palette
  ○ dark-high-contrast
  ○ light
  ○ solarized-dark
  ○ solarized-light
  ○ gruvbox-dark
  ○ catppuccin-mocha   (plugin: claude-code-catppuccin)
```

Arrow-key navigation previews each theme live. Press `Enter` to apply and save, `Esc` to cancel.

Press `Ctrl+E` while a plugin or custom theme is highlighted to copy its definition into `~/.claude/themes/` for editing — this is the recommended way to create a theme by starting from an existing one.

---

## 8. Built-in Commands — Team & Information

### `/team-onboarding`

**Purpose:** Analyse the current codebase and generate a structured ramp-up guide for a new teammate. Introduced in v2.1.104.

```
/team-onboarding
```

Claude Code reads `CLAUDE.md`, `README.md`, package manifests, and a representative sample of source files, then generates a markdown document covering:

- Prerequisites (languages, runtimes, tools to install)
- Repository layout and what each major directory contains
- How to run the project locally (step by step)
- How to run the test suite
- Key architecture decisions and their rationale
- Contribution workflow (branching model, PR process, review expectations)
- Common gotchas and known sharp edges

The output is written to `docs/onboarding.md` (or your configured docs path) and opened in your editor. It is generated content — review and refine before committing to git.

---

### `/advisor`

**Purpose:** Escalate a complex decision to the `/advisor` dual-model command, which uses a higher-capability model (Opus) for architectural reasoning while your session continues on the current model.

```
/advisor
/advisor Should we use event sourcing or CQRS for the payment service?
```

Called without arguments, `/advisor` prompts you to describe the decision inline. Called with arguments, it passes the question directly.

The advisor response is clearly marked as coming from the elevated model and includes:
- A structured analysis of the trade-offs
- A recommendation with rationale
- Specific next steps

The advisor does not take actions (no file writes, no shell commands) — it is a read-only reasoning pass. Results are inserted into the conversation history so you can act on them immediately.

For a visual flow diagram of the `/advisor` command including model routing and decision structure, see the [/advisor Command Diagram](./advisor-diagram).

---

### `/changelog`

**Purpose:** Show Claude Code release notes for recent versions.

```
/changelog
/changelog v2.1.119
```

Called without arguments, shows the last 10 releases. Called with a version number, scrolls to that release. The output links to the full `CHANGELOG.md` on GitHub for deeper reading.

---

### `/help`

**Purpose:** List all available commands with descriptions, filterable by keyword.

```
/help
/help compact
/help model
/help review      — searches custom commands too
```

`/help` lists built-in commands first, then project custom commands, then personal custom commands. The `description` frontmatter field from custom command files appears as the help text.

---

## 9. Custom Slash Commands — Personal (`~/.claude/commands/*.md`)

Personal slash commands are markdown files you place in `~/.claude/commands/`. They are available in every Claude Code session across all projects. The filename (without `.md`) becomes the command name.

**Example:** `~/.claude/commands/review.md` → available as `/review` in all sessions.

### File format

```markdown
---
description: Review the current file or diff for correctness, security, and style.
allowed-tools: Read, Bash
model: claude-sonnet-4-6
---

You are a senior code reviewer. Review the following code with a focus on:

1. **Correctness** — logic errors, off-by-one errors, null dereferences
2. **Security** — injection risks, auth bypass, insecure defaults
3. **Style** — consistency with surrounding code, naming clarity
4. **Performance** — obvious inefficiencies, N+1 queries

Code to review:

$ARGUMENTS
```

### Frontmatter fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Shown in `/help` and the autocomplete picker. Required for discoverability. |
| `allowed-tools` | string or list | Restricts which tools Claude may use when executing this command. If omitted, the session's current tool permissions apply. |
| `model` | string | Override the active model for this command only. Useful for commands that always need high-capability reasoning regardless of session default. |

### Subdirectory organisation

Commands in subdirectories are accessible with a slash-separated path:

```
~/.claude/commands/
├── review.md          → /review
├── git/
│   ├── pr.md          → /git/pr  (or /git pr)
│   └── commit.md      → /git/commit
└── docs/
    └── api.md         → /docs/api
```

Both `/git/pr` (slash-separated) and `/git pr` (space-separated after parent) work as command invocations.

---

## 10. Custom Slash Commands — Project (`.claude/commands/*.md`)

Project commands live in `.claude/commands/` within the project root and are committed to git, making them available to the whole team. The structure and format are identical to personal commands.

**Key difference:** A project command with the same name as a personal command **overrides** the personal one. This lets teams establish project-specific versions of common commands like `/review` that enforce project-specific criteria.

```
.claude/commands/
├── review.md          → /review (overrides ~/.claude/commands/review.md)
├── pr.md              → /pr
├── deploy.md          → /deploy
├── test.md            → /test
└── docs.md            → /docs
```

**Team workflow:** Add `.claude/commands/` to git and commit command files alongside source code. New team members automatically get all project commands on their next `git pull` with no additional setup.

---

## 11. Special Variables in Custom Commands

Custom command files support four variable mechanisms that make commands dynamic at invocation time.

### `$ARGUMENTS` — Full argument text

`$ARGUMENTS` expands to everything the user typed after the command name.

```markdown
<!-- ~/.claude/commands/explain.md -->
Explain the following code in plain English, suitable for a junior developer:

$ARGUMENTS
```

Usage:

```
/explain function calculateCompoundInterest(principal, rate, periods) { ... }
```

The entire text after `/explain ` becomes `$ARGUMENTS`. If the user types `/explain` with nothing after it, `$ARGUMENTS` is an empty string — your command body should handle this gracefully.

---

### `$1`, `$2`, `$3` — Positional arguments

Space-separated tokens after the command name bind to `$1`, `$2`, `$3`, and so on.

```markdown
<!-- ~/.claude/commands/compare.md -->
Compare the implementation of `$1` in `$2` versus `$3`.
Identify differences in approach, performance characteristics, and error handling.
```

Usage:

```
/compare authenticate src/v1/auth.ts src/v2/auth.ts
```

Produces:
```
Compare the implementation of `authenticate` in `src/v1/auth.ts` versus `src/v2/auth.ts`.
```

Arguments that contain spaces must be quoted: `/compare "my function" file-a.ts file-b.ts`.

---

### `@path/to/file` — File content injection

A token starting with `@` followed by a path causes that file's content to be read from disk and injected at that position when the command is invoked.

```markdown
<!-- ~/.claude/commands/review.md -->
Review the following code against our coding standards:

@.claude/standards/typescript-style-guide.md

Code to review:

$ARGUMENTS
```

When the user runs `/review`, Claude Code reads `.claude/standards/typescript-style-guide.md` at invocation time and injects its contents. The style guide is not permanently loaded into the context — it only appears for this command invocation.

File paths are resolved relative to the project root. If the file does not exist, Claude Code shows an error before sending the command.

---

### `` !`shell command` `` — Shell output injection

A backtick-quoted shell command prefixed with `!` is executed at invocation time and its stdout is injected at that position.

```markdown
<!-- ~/.claude/commands/pr.md -->
Create a pull request for the current branch.

Current branch: !`git rev-parse --abbrev-ref HEAD`
Base branch: !`git remote show origin | grep 'HEAD branch' | awk '{print $NF}'`
Commits since base: !`git log --oneline $(git merge-base HEAD origin/main)..HEAD`
Changed files: !`git diff --name-only origin/main`

$ARGUMENTS
```

When the user runs `/pr`, all four shell commands execute immediately and their output is embedded in the prompt sent to Claude. This gives Claude accurate, real-time information about the repository state.

**Security note:** Shell injection in `` !`...` `` runs with your user permissions at invocation time. Avoid placing user-controlled input (from `$ARGUMENTS` or `$1` etc.) inside the backtick expression — construct shell commands only from static strings or trusted environment variables.

### Complete example combining all variable types

```markdown
---
description: Deep-dive review of a specific function across environments.
allowed-tools: Read, Bash, Glob
---

Perform a thorough review of the `$1` function.

Project coding standards:
@.claude/standards/review-checklist.md

Current git status:
!`git status --short`

Recent changes to relevant files:
!`git log --oneline -10 -- $(git diff --name-only HEAD~5 | head -20)`

Function location (search results):
!`grep -rn "function $1\|const $1\|def $1\|$1 =" src/ --include="*.ts" --include="*.py" | head -20`

Additional context from user:
$2
```

---

## 12. Skill-Based Slash Commands

Since v2.1.3, Skills and slash commands share a unified namespace. A skill defined in `.claude/skills/<name>/SKILL.md` is automatically available as `/<name>` in the REPL, in addition to being auto-invoked by Claude based on semantic matching.

**File layout:**

```
.claude/skills/pr-review/
├── SKILL.md           ← skill definition (auto-invoked + slash command)
├── checklist.md       ← supporting file imported by SKILL.md
└── examples/
    └── good-review.md ← supporting file
```

**SKILL.md example:**

```markdown
---
description: >
  When the user asks to review a pull request, diff, or set of code changes.
  Invoked by: phrases like "review this PR", "check my diff", "look at these changes".
allowed-tools: Read, Bash, Glob
---

You are a senior code reviewer. Follow this checklist:

@checklist.md

Review the changes provided. If no diff is provided, run:
!`git diff origin/main`
```

### Skills vs. Commands: when to use each

| | Skills | Custom Commands |
|---|---|---|
| **Invocation** | Auto (by Claude) + manual `/name` | Manual `/name` only |
| **Use case** | Reusable expertise Claude decides when to apply | Deterministic workflows you always trigger explicitly |
| **Namespace** | `.claude/skills/<name>/SKILL.md` | `.claude/commands/<name>.md` or `~/.claude/commands/<name>.md` |
| **Supporting files** | Directory of files co-located with `SKILL.md` | Single `.md` file (use `@path` to import extras) |
| **Auto-invocation description** | Required (`description:` frontmatter drives matching) | Optional (only used in `/help`) |

**Rule of thumb:** If you want Claude to apply something automatically when it detects the right context, use a skill. If you want a workflow you trigger yourself at a specific moment, use a custom command.

---

## 13. Command Frontmatter Reference

Complete table of all supported frontmatter fields for custom slash commands (`.md` files in `commands/` directories):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | Recommended | One-line description shown in `/help` and autocomplete. If omitted, the command still works but is unlabelled in the picker. |
| `allowed-tools` | string \| string[] | No | Restrict which tools Claude may use during this command. Accepts tool names (`Read`, `Edit`, `Bash`) and glob patterns (`Bash(git *)`, `Edit(**/*.test.ts)`). If omitted, the session's current permissions apply. |
| `model` | string | No | Force a specific model for this command regardless of session default. Use a full model ID: `claude-opus-4-7`, `claude-sonnet-4-6`, `claude-haiku-4-5`. |

**Format examples:**

```yaml
# Single tool
allowed-tools: Bash

# Multiple tools as YAML list
allowed-tools:
  - Read
  - Bash
  - Glob

# Multiple tools as comma-separated string
allowed-tools: Read, Bash, Glob

# With glob pattern restrictions
allowed-tools:
  - Read
  - "Bash(git *)"
  - "Edit(**/*.test.ts)"
```

**Model override example:**

```yaml
---
description: Architecture review — always uses Opus for deep reasoning.
allowed-tools: Read, Glob, Bash
model: claude-opus-4-7
---
```

**No frontmatter is required.** A command file can be purely a body of text with no YAML block. It will still register as a slash command, appear in `/help` (without a description), and execute normally.

---

## 14. Practical Examples

The following six complete command files cover the most common team workflows. All paths shown are project commands (`.claude/commands/`) but they work equally well as personal commands (`~/.claude/commands/`).

---

### Example 1: `/review` — PR Code Review

**File:** `.claude/commands/review.md`

```markdown
---
description: Review staged changes or a specified file for correctness, security, and style.
allowed-tools: Read, Bash, Glob
---

You are a senior engineer performing a thorough code review. Your job is to find real problems, not to rubber-stamp the changes.

## Context

Branch: !`git rev-parse --abbrev-ref HEAD`
Author: !`git config user.name`
Changed files:
!`git diff --staged --name-only 2>/dev/null || git diff --name-only HEAD~1`

## Diff to review

!`git diff --staged 2>/dev/null || git diff HEAD~1`

## Review criteria

Evaluate against our standards:
@.claude/standards/review-checklist.md

## Instructions

If `$ARGUMENTS` is provided, focus the review on that file or topic: $ARGUMENTS

Structure your response as:
1. **Summary** — one paragraph describing what changed and why
2. **Issues** — numbered list of problems, each with: severity (blocker/major/minor), file:line, explanation, suggested fix
3. **Positives** — what was done well (at least two items)
4. **Verdict** — Approve / Request Changes / Needs Discussion
```

---

### Example 2: `/pr` — Create Pull Request

**File:** `.claude/commands/pr.md`

```markdown
---
description: Create a GitHub pull request for the current branch with ticket link and structured description.
allowed-tools: Bash
---

Create a pull request for the current branch.

## Repository state

Current branch: !`git rev-parse --abbrev-ref HEAD`
Base branch: !`git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}'`
Commits to include:
!`git log --oneline $(git merge-base HEAD origin/main 2>/dev/null || echo HEAD~5)..HEAD`

Changed files:
!`git diff --name-only origin/main 2>/dev/null || git diff --name-only HEAD~3`

## Instructions

1. Generate a PR title: concise, imperative mood, ≤72 characters
2. Generate a PR body with these sections:
   - **Summary** — what changed and why (2–4 sentences)
   - **Changes** — bulleted list of specific changes
   - **Testing** — how to verify the changes work
   - **Ticket** — if `$ARGUMENTS` is a ticket ID (e.g., PROJ-123), include a link
3. Run the `gh pr create` command with the title and body

Ticket reference: $ARGUMENTS
```

---

### Example 3: `/test` — Run Tests with Coverage

**File:** `.claude/commands/test.md`

```markdown
---
description: Run the test suite for the current change set and report results with coverage.
allowed-tools: Bash, Read, Glob
---

Run tests for the current changes and provide a structured report.

## What changed

!`git diff --name-only HEAD~1 | grep -E '\.(ts|tsx|js|py|cs|go|rs)$'`

## Test execution

Determine the correct test command from the project type:
!`cat package.json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('scripts',{}).get('test',''))" 2>/dev/null || echo ""`

Run the tests. If `$ARGUMENTS` specifies a file pattern or test name, scope the run to that: $ARGUMENTS

## Report format

Provide:
1. **Pass / Fail** — overall status
2. **Coverage** — line and branch coverage for changed files specifically
3. **Failed tests** — for each failure: test name, error message, file:line
4. **Missing coverage** — specific lines in changed files that have no test
5. **Recommended next steps** — specific tests to add, if any
```

---

### Example 4: `/deploy` — Deployment with Environment Selection

**File:** `.claude/commands/deploy.md`

```markdown
---
description: Run the deployment pipeline for a specified environment (staging/production).
allowed-tools: Bash, Read
---

Deploy the application to the specified environment.

## Environment

Target: $1
Caller: !`whoami`
Timestamp: !`date -u +"%Y-%m-%dT%H:%M:%SZ"`
Git SHA: !`git rev-parse HEAD`
Branch: !`git rev-parse --abbrev-ref HEAD`

## Pre-flight checks

Before deploying, verify:
1. All tests pass — run the test suite for the target environment
2. No uncommitted changes: !`git status --porcelain`
3. The branch is up to date with origin: !`git fetch origin && git status -sb | head -3`

## Deployment steps

Read the deployment configuration:
@.claude/deploy-config.md

Execute the deployment for environment `$1`. If environment is `production`, require explicit confirmation by printing the SHA and asking the user to type "CONFIRM" before proceeding.

Additional flags or options: $2
```

---

### Example 5: `/docs` — Generate Documentation for Changed Files

**File:** `.claude/commands/docs.md`

```markdown
---
description: Generate or update documentation for files changed since the last commit.
allowed-tools: Read, Edit, Glob, Bash
---

Generate documentation for recently changed source files.

## Changed files

!`git diff --name-only HEAD~1 | grep -vE '\.(json|yaml|yml|lock|md)$'`

## Documentation standards

@.claude/standards/documentation-guide.md

## Instructions

For each changed file:
1. Read the current file
2. Identify all exported functions, classes, interfaces, and constants
3. Check whether existing doc comments are accurate after the changes
4. Add or update doc comments using the format specified in the documentation guide
5. If `$ARGUMENTS` specifies a particular file, limit work to that file: $ARGUMENTS

Write the updated comments directly to the files. Do not regenerate the whole file — only add or update the documentation sections.

After completing all files, provide a summary table: file → symbols documented → symbols that need examples added.
```

---

### Example 6: `/security` — Security Audit of Changed Files

**File:** `.claude/commands/security.md`

```markdown
---
description: Security-focused audit of all changes since the last commit. Checks OWASP Top 10 risks.
allowed-tools: Read, Bash, Glob
model: claude-opus-4-7
---

Perform a security audit of the current changes.

## Scope

Changed files: !`git diff --name-only HEAD~1`
Full diff:
!`git diff HEAD~1`

## Security checklist

Review each change against these risk categories:

**Injection** — SQL, command, LDAP, XPath, template injection; unsanitised input reaching a sink
**Authentication** — hardcoded credentials, weak token generation, missing auth checks, JWT validation
**Access control** — missing authorisation on endpoints, IDOR, privilege escalation paths
**Cryptography** — weak algorithms, predictable IVs, key material in code or logs
**Security misconfiguration** — debug flags, verbose errors, overly permissive CORS, missing security headers
**Sensitive data exposure** — PII in logs, insecure transmission, unencrypted storage
**Dependency risks** — newly introduced packages with known CVEs (check with !`npm audit 2>/dev/null || pip-audit 2>/dev/null || echo "No audit tool found"`)
**Secrets** — API keys, passwords, tokens committed to source

## Report format

For each finding:
- **Severity:** Critical / High / Medium / Low / Informational
- **Category:** (from checklist above)
- **Location:** file:line
- **Description:** what the risk is and how it could be exploited
- **Remediation:** specific fix or mitigation

Additional focus area (if provided): $ARGUMENTS

End with an overall risk rating: SAFE TO MERGE / REVIEW REQUIRED / DO NOT MERGE
```

---

## Quick Reference — All Built-in Commands

| Command | Category | Purpose |
|---------|----------|---------|
| `/clear` | Session | Reset conversation, keep config |
| `/compact [instructions]` | Session | Summarise conversation to free context |
| `/rewind` | Session | Roll back code + conversation to checkpoint |
| `/resume` | Session | Open session picker to continue prior session |
| `/rename [name]` | Session | Name current session for retrieval |
| `/context` | Session | Token usage breakdown by section |
| `/usage` | Session | Total tokens + cost for session |
| `/plan` | Session | Enter plan-only mode (no file writes) |
| `/model` | Config | Switch model mid-session |
| `/config` | Config | Tabbed settings UI; persists to settings.json |
| `/permissions` | Config | View/manage tool allowlist for session |
| `/hooks` | Config | View/manage automation hooks |
| `/memory` | Memory | View loaded CLAUDE.md + rules; toggle auto-memory |
| `/todos` | Memory | View and manage structured task list |
| `/agents` | Agents | Browse/create/edit subagent definitions |
| `/skills` | Agents | Browse installed skills; invoke manually |
| `/mcp` | MCP | View/manage MCP server connections |
| `/branch [name]` | Git | Create worktree branch + new session |
| `/init` | Setup | Auto-generate CLAUDE.md from codebase analysis |
| `/doctor` | Diagnostics | Health check with auto-repair |
| `/debug` | Diagnostics | Debug panel: session state, hooks, tool log |
| `/terminal-setup` | Diagnostics | Configure scroll, clipboard, iTerm2 |
| `/keybindings` | Diagnostics | Edit custom key bindings |
| `/theme` | Diagnostics | Browse and apply color themes |
| `/team-onboarding` | Team | Generate teammate ramp-up guide |
| `/advisor` | Team | Escalate to Opus for complex decisions |
| `/changelog` | Info | Show recent release notes |
| `/help` | Info | List all commands with descriptions |
