---
title: Every Markdown File Claude Code Recognizes — Complete Catalog
sidebar:
  order: 4
lastUpdated: 2026-06-02
---

# Every Markdown File Claude Code Recognizes — Complete Catalog

> **Last updated: June 2, 2026 — reflects Claude Code v2.1.126+**
> All information sourced from official `code.claude.com` documentation.

---

## Quick Reference Map

```
YOUR SYSTEM
├── /Library/Application Support/ClaudeCode/    (macOS Managed/Enterprise)
│   ├── CLAUDE.md                               ← 1. Enterprise Policy Memory
│   ├── managed-settings.json                   (JSON — enterprise-wide settings)
│   ├── managed-mcp.json                        (JSON — enterprise MCP servers)
│   └── managed-settings.d/*.json               (JSON — drop-in policy fragments)
│
├── /etc/claude-code/                           (Linux/WSL Managed/Enterprise)
│   ├── CLAUDE.md                               ← 1. Enterprise Policy Memory
│   ├── managed-settings.json
│   └── managed-settings.d/
│
├── C:\Program Files\ClaudeCode\                (Windows Managed/Enterprise)
│   ├── CLAUDE.md                               ← 1. Enterprise Policy Memory
│   └── managed-settings.json
│
├── ~/.claude/
│   ├── CLAUDE.md                               ← 2. User Memory (all projects)
│   ├── commands/
│   │   └── *.md                                ← 3. Personal Slash Commands
│   ├── agents/
│   │   └── *.md                                ← 4. Personal Subagents
│   ├── skills/
│   │   └── <skill-name>/
│   │       ├── SKILL.md                        ← 5. Personal Skills
│   │       └── *.md (supporting files)
│   ├── output-styles/
│   │   └── *.md                                ← 6. Personal Output Styles
│   ├── projects/<project>/memory/
│   │   ├── MEMORY.md                           ← 15. Auto-memory (main index)
│   │   └── <topic>.md                          ← 15. Auto-memory (satellite files)
│   ├── agent-memory/<agent>/
│   │   └── MEMORY.md                           ← 16. Subagent Memory (user scope)
│   └── settings.json                           (JSON — user settings)
│       .claude.json                            (JSON — OAuth session, MCP configs)
│
YOUR PROJECT (cwd)
├── CLAUDE.md                                   ← 7. Project Memory (team-shared)
├── CLAUDE.local.md                             ← 8. Project Local Memory (gitignored)
├── .claude/
│   ├── CLAUDE.md                               ← 7. (alternate location for Project Memory)
│   ├── rules/
│   │   └── *.md                                ← 9. Rules (global + path-scoped)
│   │       (symlinks supported for shared rule libraries)
│   ├── commands/
│   │   └── *.md                                ← 10. Project Slash Commands
│   ├── agents/
│   │   └── *.md                                ← 11. Project Subagents
│   ├── skills/
│   │   └── <skill-name>/
│   │       ├── SKILL.md                        ← 12. Project Skills
│   │       └── *.md (supporting files)
│   ├── output-styles/
│   │   └── *.md                                ← 13. Project Output Styles
│   ├── agent-memory/<agent>/
│   │   └── MEMORY.md                           ← 16. Subagent Memory (project scope)
│   ├── agent-memory/local/<agent>/
│   │   └── MEMORY.md                           ← 16. Subagent Memory (local scope, gitignored)
│   ├── settings.json                           (JSON — project settings, git-tracked)
│   ├── settings.local.json                     (JSON — local overrides, gitignored)
│   └── .mcp.json                               (JSON — project MCP servers)
│
├── src/
│   └── Domain/
│       └── CLAUDE.md                           ← 14. Subtree Memory (on-demand)
│
SUBAGENT AUTO MEMORY
└── ~/.claude/projects/<project>/memory/         (auto-memory, all worktrees share)
    ├── MEMORY.md                               ← 15. Auto-memory MEMORY.md
    └── <topic>.md                              ← 15. Satellite topic files

SUBAGENT PERSISTENT MEMORY
├── ~/.claude/agent-memory/<agent>/              (user scope)
│   └── MEMORY.md                               ← 16. Subagent MEMORY.md
├── .claude/agent-memory/<agent>/                (project scope)
│   └── MEMORY.md                               ← 16. Subagent MEMORY.md
└── .claude/agent-memory/local/<agent>/          (local scope, gitignored)
    └── MEMORY.md                               ← 16. Subagent MEMORY.md

PLUGINS
└── <plugin>/
    ├── .claude-plugin/
    │   └── plugin.json                         (JSON — manifest, optional)
    ├── commands/*.md                           ← 17. Plugin Commands
    ├── agents/*.md                             ← 18. Plugin Agents
    ├── skills/*/SKILL.md                       ← 19. Plugin Skills
    ├── output-styles/*.md                      ← 20. Plugin Output Styles
    ├── monitors/monitors.json                  ← 21. Plugin Monitors (JSON)
    ├── themes/*.json                           ← 22. Plugin Themes (JSON)
    ├── bin/*                                   (executables added to Bash tool PATH)
    ├── hooks/hooks.json                        (JSON — event hooks)
    ├── .mcp.json                               (JSON — MCP server definitions)
    ├── .lsp.json                               (JSON — Language Server Protocol configs)
    └── settings.json                           (JSON — default plugin settings)

IMPORTED FILES (via @path syntax in any CLAUDE.md)
└── any *.md referenced with @                  ← 23. Imported Files
```

---

### Configuration Layers — Visual Precedence Map

```
  HIGHEST PRECEDENCE
  ══════════════════════════════════════════════════════════════
  ▲ Enterprise Managed Settings (MDM/Group Policy/Registry)
  │  └── Enterprise CLAUDE.md (system-level)
  ══════════════════════════════════════════════════════════════
  ▲ CLI Flags & Environment Variables
  ══════════════════════════════════════════════════════════════
  ▲ .claude/settings.local.json  (project local, git-ignored)
  ══════════════════════════════════════════════════════════════
  ▲ .claude/settings.json  (project, committed to git)
  ══════════════════════════════════════════════════════════════
  ▲ ~/.claude/settings.json  (user-global preferences)
  ══════════════════════════════════════════════════════════════
  ▲ ~/.claude/CLAUDE.md  (user-global context/instructions)
  ══════════════════════════════════════════════════════════════
  ▲ CLAUDE.md (project root)  →  subdirectory CLAUDE.md files
  ══════════════════════════════════════════════════════════════
  ▲ CLAUDE.local.md  (personal project overrides, git-ignored)
  ══════════════════════════════════════════════════════════════
  ▲ .claude/rules/*.md  (path-scoped, conditional)
  ══════════════════════════════════════════════════════════════
  ▲ Skills / Output Styles  (on-demand)
  ══════════════════════════════════════════════════════════════
  ▲ Auto-Memory MEMORY.md  (~/.claude/projects/<hash>/memory/)
  LOWEST PRECEDENCE (but always injected into context)
  ══════════════════════════════════════════════════════════════
```

---

## Visual Load-Order Timeline

Understanding *when* each file type loads is critical for token budget planning. The timeline below shows the sequence from session start through user interaction.

```
  SESSION START
  │
  │  T=0ms  PHASE 1: Fixed Context Assembly (always happens)
  │  ┌──────────────────────────────────────────────────────────────────┐
  │  │ Step 1  Tool schema definitions (built-in tools)                 │
  │  │         ↳ Shared by ALL users → highest cache hit rate           │
  │  │                                                                  │
  │  │ Step 2  MCP tool schemas (if MCP servers configured)             │
  │  │         ↳ Per-session config, added to stable prefix             │
  │  │                                                                  │
  │  │ Step 3  System prompt (Anthropic hardcoded instructions)         │
  │  │         ↳ Shared across all users → very high cache hit          │
  │  │                                                                  │
  │  │ Step 4  Enterprise CLAUDE.md (if exists)                         │
  │  │         ↳ Loaded FIRST among user-configurable content           │
  │  │                                                                  │
  │  │ Step 5  User CLAUDE.md (~/.claude/CLAUDE.md)                     │
  │  │         ↳ Personal, all projects                                 │
  │  │                                                                  │
  │  │ Step 6  Project CLAUDE.md (./CLAUDE.md or ./.claude/CLAUDE.md)  │
  │  │         ↳ Team-shared; survives /compact                         │
  │  │                                                                  │
  │  │ Step 7  CLAUDE.local.md (./CLAUDE.local.md)                      │
  │  │         ↳ Personal overrides, gitignored                         │
  │  │                                                                  │
  │  │ Step 8  Auto-memory MEMORY.md (≤200 lines / 25KB)               │
  │  │         ↳ Machine-local, all worktrees share one file            │
  │  │                                                                  │
  │  │ Step 9  Global Rules (.claude/rules/*.md, no paths: frontmatter) │
  │  │         ↳ Always-on rules, loaded in full                        │
  │  │                                                                  │
  │  │ Step 10 @imported files (resolved recursively, max 5 hops)       │
  │  │         ↳ Inline at load time; adds to parent file's cost        │
  │  │                                                                  │
  │  │ Step 11 Skill & Agent frontmatter scan (name + description only) │
  │  │         ↳ ~100-150 tokens per skill; body NOT loaded yet         │
  │  └──────────────────────────────────────────────────────────────────┘
  │
  │  T=variable  PHASE 2: On-Demand Context (triggered mid-session)
  │  ┌──────────────────────────────────────────────────────────────────┐
  │  │ On file access    Subtree CLAUDE.md files (nested subdirectories) │
  │  │                   ↳ Fires "nested_traversal" InstructionsLoaded  │
  │  │                                                                  │
  │  │ On file access    Path-scoped Rules (.claude/rules/ with paths:) │
  │  │                   ↳ Fires "path_glob_match" InstructionsLoaded   │
  │  │                                                                  │
  │  │ On task match     Skill body (full SKILL.md content)             │
  │  │                   ↳ Loaded as tool result into conversation       │
  │  │                                                                  │
  │  │ On /command       Slash command body                              │
  │  │                   ↳ Loaded only when user types /command-name    │
  │  │                                                                  │
  │  │ On delegation     Subagent definition body                        │
  │  │                   ↳ Becomes subagent system prompt               │
  │  │                                                                  │
  │  │ On invocation     Subagent MEMORY.md (≤200 lines / 25KB)         │
  │  │                   ↳ Into subagent's own context window           │
  │  └──────────────────────────────────────────────────────────────────┘
  │
  │  T=session  PHASE 3: Separate Context (never touches main window)
  │  ┌──────────────────────────────────────────────────────────────────┐
  │  │ Subagent conversations → own forked context window               │
  │  │ Skills with context: fork → run in subagent context window       │
  │  └──────────────────────────────────────────────────────────────────┘
  │
  END SESSION
```

---

## Decision Flowchart: Which File Type Should I Use?

Use this flowchart when you have content to give Claude and need to decide where to put it.

```
  START: "I have content/instructions for Claude"
  │
  ├─► Is this enforced policy for ALL users on this machine?
  │   │
  │   YES ─► Enterprise CLAUDE.md (#1) + managed-settings.json
  │           Deployed via MDM/Ansible/Group Policy
  │
  └─► Is this personal to me, not the team?
      │
      ├─► YES: Does it apply to ALL my projects?
      │         │
      │         YES ─► User CLAUDE.md (#2) at ~/.claude/CLAUDE.md
      │         │
      │         NO  ─► This project only? Is it personal (not shared)?
      │                 │
      │                 YES ─► CLAUDE.local.md (#8) — gitignored
      │
      └─► NO (team-shared content):
          │
          ├─► Is it a multi-step workflow, needs scripts/templates?
          │   │
          │   YES ─► Skill (#12 project, #5 personal)
          │           Put in .claude/skills/<name>/SKILL.md
          │
          ├─► Is it instructions Claude needs on EVERY interaction?
          │   │
          │   YES ─► Does it apply to specific file types/directories?
          │           │
          │           YES ─► Path-scoped Rule (#9)
          │           │       .claude/rules/<name>.md with paths: frontmatter
          │           │
          │           NO  ─► Does it fit in ~5-10 lines?
          │                   │
          │                   YES ─► Project CLAUDE.md (#7)
          │                   NO  ─► Global Rule (#9) — no paths: frontmatter
          │
          ├─► Is it a reusable command the team types explicitly?
          │   │
          │   YES ─► Project Slash Command (#10)
          │           .claude/commands/<name>.md
          │
          ├─► Is it an autonomous agent with its own identity?
          │   │
          │   YES ─► Subagent (#11 project, #4 personal)
          │           .claude/agents/<name>.md
          │
          ├─► Is it a custom response format/style?
          │   │
          │   YES ─► Output Style (#13 project, #6 personal)
          │           .claude/output-styles/<name>.md
          │
          └─► Does it apply when Claude enters a specific subdirectory?
              │
              YES ─► Subtree CLAUDE.md (#14)
                      src/subdomain/CLAUDE.md (on-demand loading)
```

---

## Detailed Breakdown of Each File

---

### 1. CLAUDE.md — Enterprise Policy Memory

| Attribute | Detail |
|-----------|--------|
| **File** | `CLAUDE.md` |
| **Locations** | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md` · Linux/WSL: `/etc/claude-code/CLAUDE.md` · Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` |
| **When loaded** | Always — first thing at session start, highest priority |
| **Priority** | Highest — cannot be overridden by any other CLAUDE.md or settings |
| **Who creates it** | IT/DevOps via MDM, Ansible, Group Policy, Intune, Jamf, etc. |
| **Shared with** | All users on the machine |
| **Git tracked** | No — deployed via config management tooling |
| **Token impact** | Permanent overhead every session |
| **Can be excluded** | **No** — `claudeMdExcludes` cannot skip managed CLAUDE.md files |
| **Injection method** | Delivered as a **user message** after the system prompt (not part of the system prompt itself) |
| **HTML comment stripping** | Yes — block-level `<!-- -->` comments removed before injection |
| **Survives /compact** | Yes — re-injected from disk |
| **Size limit** | None — loaded in full regardless of length |

**Purpose**: Organization-wide coding standards, security policies, compliance requirements, approved tools/libraries. This is the "law of the land" — it shapes Claude's behavior but is not a hard enforcement layer the way `managed-settings.json` is. For technical enforcement, use settings; for behavioral guidance, use this file.

**Companion managed-settings.json**: Lives alongside `CLAUDE.md` in the same managed directory. While `CLAUDE.md` instructs Claude, `managed-settings.json` enforces hard policy rules (tool allow/deny, permission modes, etc.) that override all user/project settings.

**HTML comment stripping**: Block-level HTML comments (`<!-- notes -->`) are stripped from this file before the content is injected into Claude's context. Comments inside code blocks are preserved. Use this to add maintainer annotations without token cost.

**Example**:
```markdown
# Enterprise Policy — Acme Corp

<!-- Last reviewed: 2026-01 by DevSecOps team -->

## Security
- Never commit secrets, API keys, or credentials
- All new endpoints require authentication middleware
- Use parameterized queries only — no string concatenation for SQL

## Compliance
- GDPR: All PII must be encrypted at rest
- SOC2: Audit logging required for data access operations
- Do not use unapproved third-party packages (see approved-packages.acme.com)

## Standards
- Code must pass SonarQube quality gate before merge
- All PRs require minimum 2 approvals
- Conventional commits required: feat:, fix:, chore:, docs:
```

---

### 2. CLAUDE.md — User Memory (Personal, All Projects)

| Attribute | Detail |
|-----------|--------|
| **File** | `CLAUDE.md` |
| **Location** | `~/.claude/CLAUDE.md` |
| **When loaded** | Always at session start |
| **Priority** | High — loaded after Enterprise, before Project |
| **Shared with** | Just you, across all projects |
| **Git tracked** | No |
| **Token impact** | Permanent overhead every session |
| **Can be excluded** | Yes — via `claudeMdExcludes` in your settings |
| **Injection method** | User message after the system prompt |
| **HTML comment stripping** | Yes |
| **Survives /compact** | Yes — re-injected from disk |
| **Size limit** | None |

**Purpose**: Your personal coding preferences that travel with you regardless of project — editor preferences, interaction style, personal shortcuts, formatting rules.

**HTML comment stripping**: Block-level HTML comments are stripped from this file too before injection.

**Compaction survival**: This file is not the project-root CLAUDE.md, so it loads once at session start. After `/compact`, Claude re-reads the project-root CLAUDE.md from disk; user-level CLAUDE.md is also re-injected as it was at session start.

**Environment variable override**: Set `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD` to load CLAUDE.md files from extra directories in addition to the standard hierarchy.

**Example**:
```markdown
# Personal Preferences — Raj

## Coding Style
- Prefer functional patterns over imperative
- Use descriptive variable names, never abbreviations
- Always add XML doc comments on public methods
- Use `var` only when the type is obvious from the right-hand side

## Interaction
- Before making changes, propose a plan first and wait for "OK"
- Keep solutions minimal — avoid over-engineering
- When unsure, ask rather than assume
- After completing a task, summarize what changed in 2–3 bullet points

## Tools
- Use pnpm, not npm
- Prefer `git log --oneline -10` for recent history
```

---

### 3. Slash Commands — Personal (`~/.claude/commands/*.md`)

| Attribute | Detail |
|-----------|--------|
| **File** | Any `*.md` file |
| **Location** | `~/.claude/commands/` (supports subdirectories) |
| **Filename** | Becomes the command name: `review.md` → `/review` |
| **Invocation** | User-invoked — you type `/command-name` explicitly |
| **When loaded** | Only when you invoke the command; frontmatter descriptions loaded at session start for autocomplete |
| **Shared with** | Just you, across all projects |
| **Git tracked** | No |
| **Namespace** | No namespace for personal commands; subdirectory names appear in descriptions but don't affect the command name |
| **Token impact** | On-use only (negligible at session start) |
| **HTML comment stripping** | Yes |
| **Size limit** | None |

**Frontmatter fields**:
```yaml
---
description: What this command does (shown in autocomplete and /help)
allowed-tools: Read, Grep, Glob, Bash(git diff:*)
model: claude-sonnet-4-6          # optional — full model ID or alias (sonnet/opus/haiku)
---
```

**Special variables in command body**:
- `$ARGUMENTS` — everything the user types after the command name
- `$1`, `$2`, `$3` — individual positional arguments (space-separated)
- `@file.txt` — file content injection (replaced at runtime with file contents)
- `!command` — shell command execution (output inserted inline)

**Example** (`~/.claude/commands/review.md`):
```markdown
---
description: Comprehensive code review of recent changes
allowed-tools: Read, Grep, Glob, Bash(git diff:*)
---

## Files Changed in Last Commit
!`git diff --name-only HEAD~1`

## Full Diff
!`git diff HEAD~1`

## Review Checklist
Review the above diff for:
1. Logic errors and bugs
2. Security vulnerabilities (injection, auth bypass, data exposure)
3. Performance issues (N+1 queries, unnecessary allocations)
4. Style consistency with surrounding code
5. Test coverage gaps — are edge cases covered?
6. API contract changes — any breaking changes?
```

**Subdirectory organization**:
```
~/.claude/commands/
├── frontend/
│   ├── component.md        # → /component
│   └── style-check.md      # → /style-check
├── backend/
│   ├── api-test.md         # → /api-test
│   └── db-migrate.md       # → /db-migrate
└── review.md               # → /review
```
Subdirectory names appear in the description shown in the command browser but do **not** become part of the slash command name.

---

### 4. Subagents — Personal (`~/.claude/agents/*.md`)

| Attribute | Detail |
|-----------|--------|
| **File** | Any `*.md` file |
| **Location** | `~/.claude/agents/` |
| **Filename** | Becomes the agent name (kebab-case recommended) |
| **Invocation** | Claude auto-delegates based on `description`; user `@-mentions` for one task; `--agent <name>` for session-wide; `claude agents` to list all |
| **When loaded** | Agent definitions (frontmatter) loaded at session start; agent body runs in forked context on invocation |
| **Shared with** | Just you, across all projects |
| **Git tracked** | No |
| **Priority** | Lower than project agents of the same name; higher than built-in agents |
| **Token impact** | Frontmatter ~100-150 tokens at start; body only on invocation |
| **HTML comment stripping** | Yes |
| **Size limit** | None |

**Frontmatter fields** (only `name` and `description` are required):
```yaml
---
name: code-reviewer                # Required. Unique identifier.
description: >                     # Required. Used for auto-delegation.
  Reviews code for quality, security, and best practices.
  Use proactively for PR reviews, security audits, and code quality checks.
tools: Read, Glob, Grep            # Allowlist — these tools only
disallowedTools: Write, Edit, Bash # Denylist — block specific tools
model: sonnet                      # sonnet | opus | haiku | inherit | full model ID (e.g. claude-opus-4-7)
                                   # Defaults to "inherit" (same model as main session) if omitted
effort: medium                     # low | medium | high | xhigh — thinking budget
maxTurns: 50                       # Max agentic loop iterations before stopping
isolation: worktree                # "worktree" only — runs in isolated git worktree copy
background: true                   # Run agent as background task (experimental)
skills:                            # Inject skill content into agent context at startup
  - code-review
  - security-scan
memory:
  scope: user                      # user | project | local
permissionMode: default            # default | plan | acceptEdits | auto | bypassPermissions
hooks:                             # Lifecycle hooks scoped to this agent's lifetime
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: echo "Bash about to run"
          once: true               # "once: true" only honored in skill/agent frontmatter
mcpServers:                        # Inline or reference existing MCP servers
  - name: github                   # String = reuse already-connected server
  - my-server:                     # Object = inline definition (scoped to this agent)
      command: node
      args: ["./server.js"]
---
```

**The markdown body** below the frontmatter becomes the **system prompt** for the subagent. The subagent receives ONLY this system prompt (plus basic env details like working directory) — NOT the full Claude Code system prompt.

**Invocation patterns**:
```bash
# Session-wide: entire session runs as this agent
claude --agent code-reviewer

# For plugin agents use namespaced form
claude --agent my-plugin:security-reviewer

# List all configured agents without starting a session
claude agents
```

**Important constraints**:
- Subagents **cannot spawn other subagents** — the `Agent` tool in a subagent definition has no effect
- Subagent `cd` commands do not persist between Bash calls and do not affect the main session's working directory
- `permissionMode` inherits from parent; parent's `bypassPermissions` or `acceptEdits` takes precedence and cannot be overridden
- Model resolution order: `CLAUDE_CODE_SUBAGENT_MODEL` env var → per-invocation parameter → frontmatter `model` → main session model

**Example** (`~/.claude/agents/code-reviewer.md`):
```markdown
---
name: code-reviewer
description: >
  Reviews code for quality, security, and best practices.
  Use proactively when the user asks for a PR review, code review, or security audit.
tools: Read, Glob, Grep
model: sonnet
effort: medium
maxTurns: 30
memory:
  scope: user
---

You are a senior code reviewer. Your job is to analyze code thoroughly and provide
actionable, constructive feedback.

## Review Priorities (in order)
1. Logic errors and bugs — does the code do what it claims?
2. Security vulnerabilities — injection, auth bypass, data exposure
3. Performance problems — N+1, unnecessary work, missing indexes
4. Maintainability and tech debt — complexity, naming, coupling
5. Code style consistency — does it match the surrounding codebase?

## Instructions
- Read the target files thoroughly before commenting
- Cross-reference with related files for consistency
- Provide actionable feedback with specific line references
- Categorize issues: Critical / High / Medium / Low
- Save patterns and architectural discoveries to your memory
```

---

### 5. Skills — Personal (`~/.claude/skills/*/SKILL.md`)

| Attribute | Detail |
|-----------|--------|
| **File** | Must be named `SKILL.md` (case-sensitive) |
| **Location** | `~/.claude/skills/<skill-name>/SKILL.md` |
| **Folder name** | The skill's identity; used as fallback command name if `name` not in frontmatter |
| **Invocation** | Claude auto-invokes based on `description` match; user types `/skill-name`; both unified since v2.1.3 |
| **When loaded** | Frontmatter scanned at session start for discovery; full body injected only at invocation |
| **Shared with** | Just you, across all projects |
| **Git tracked** | No |
| **Can include** | Supporting `.md` files, scripts, templates, any data files |
| **Token impact** | Frontmatter ~100-150 tokens at start; body 500-5K tokens only on invocation |
| **HTML comment stripping** | Yes |
| **Size limit** | None for body; description capped at 1,536 chars in /skills listing (v2.1.105) |

**Frontmatter fields**:
```yaml
---
name: deploy-staging              # Max 64 chars; lowercase, hyphens, numbers only
description: >                    # Max 1024 chars — CRITICAL for auto-invocation discovery
  Deploy to staging environment with safety checks.
  Use when user says "deploy", "push to staging", or "ship it".
allowed-tools: Read, Bash(npm run *), Bash(git *)
model: claude-sonnet-4-6          # Optional model override — alias or full model ID
disable-model-invocation: true    # Only allow manual /deploy-staging, not auto-invocation
context: fork                     # Run this skill in a separate subagent context (isolated)
agent: Explore                    # Which subagent type to use when context: fork
---
```

**Special variables in skill body**:
- `$ARGUMENTS` — user input typed after `/skill-name`
- `${CLAUDE_SESSION_ID}` — current session identifier
- `${CLAUDE_EFFORT}` — current session effort level (v2.1.120)
- `!`backtick commands — shell output injected inline at invocation
- `@path` — file content injected inline

**Skill folder structure example**:
```
~/.claude/skills/
└── deploy-staging/
    ├── SKILL.md                  # Required — entry point
    ├── FORMS.md                  # Optional — supporting reference, loaded on demand
    ├── REFERENCE.md              # Optional — detailed docs
    ├── scripts/
    │   ├── deploy.sh             # Optional — executable scripts
    │   └── rollback.sh
    └── templates/
        └── deploy-checklist.md   # Optional — templates
```

**Auto-discovery**: Claude auto-discovers skills in nested `.claude/skills/` subdirectories of the project tree, not just `~/.claude/skills/` and `.claude/skills/`.

**Hooks in skill frontmatter**:
```yaml
---
name: secure-operations
description: Perform write operations with security pre-checks
hooks:
  PreToolUse:
    - matcher: Bash
      hooks:
        - type: command
          command: ./scripts/security-check.sh
          once: true              # Runs once per session, then removed
---
```

#### `${CLAUDE_EFFORT}` in Skills (v2.1.120+)

Skills can read the current session effort level and adapt their behavior:

```markdown
<!-- .claude/skills/review/SKILL.md -->
---
name: review
description: Code review skill — depth adapts to effort level
---

# Code Review

Current effort level: ${CLAUDE_EFFORT}

{% if CLAUDE_EFFORT == "xhigh" %}
Perform an exhaustive security audit: check all OWASP Top 10, trace all data flows,
verify all authentication checks, analyse all error paths.
{% elif CLAUDE_EFFORT == "high" %}
Thorough review: focus on correctness, security, and test coverage.
{% else %}
Quick review: identify obvious bugs and style issues only.
{% endif %}
```

This allows one skill definition to serve multiple quality levels without separate files.

---

### 6. Output Styles — Personal (`~/.claude/output-styles/*.md`)

| Attribute | Detail |
|-----------|--------|
| **File** | Any `*.md` file |
| **Location** | `~/.claude/output-styles/` |
| **Activation** | Via `/config` → select "Output style", or set `outputStyle` in `settings.json` |
| **Effect** | **Directly modifies Claude Code's system prompt** — replaces SE-specific instructions |
| **Shared with** | Just you |
| **Git tracked** | No |
| **When takes effect** | Next new session (not mid-session, to keep prompt caching stable) |
| **Token impact** | Replaces part of system prompt; overall overhead depends on style length |
| **HTML comment stripping** | Yes |
| **Size limit** | None |

**How output styles differ from CLAUDE.md**:
- **CLAUDE.md** → injected as a *user message* after the system prompt; does not touch the system prompt
- **`--append-system-prompt`** → appends content to the end of the system prompt; does not remove anything
- **Output Styles** → directly replace the software-engineering-specific parts of Claude's default system prompt; more invasive than either

**Frontmatter fields**:
```yaml
---
name: My Teaching Style            # Display name in /config menu
description: Explains reasoning and teaches as it codes
keep-coding-instructions: true     # false (default) = removes SE instructions; true = keeps them
---
```

**`keep-coding-instructions` behavior**:
- `false` (default): Custom styles **remove** the software-engineering instructions (running tests, verifying code, etc.). Claude loses its default "verify your changes" behavior.
- `true`: Claude keeps its core SE capabilities (running scripts, reading/writing files, tracking TODOs) AND adds your custom style on top. **Set this to `true` for most coding-focused styles.**

**Token cost**: Adding output style instructions increases input tokens. After the first turn, prompt caching reduces this cost. Built-in Explanatory and Learning styles produce longer responses than Default by design — your output token cost increases accordingly.

**Built-in styles** (no file needed):
- **Default** — Standard software engineering system prompt
- **Explanatory** — Adds educational "Insights" between coding steps; helps you understand implementation choices and codebase patterns
- **Learning** — Collaborative learn-by-doing; adds `TODO(human)` markers for you to implement; Claude won't just write the code for you

**Example** (`~/.claude/output-styles/architect.md`):
```markdown
---
name: architect
description: Responds with architectural thinking, trade-off analysis, and system design focus
keep-coding-instructions: true
---

# Architect Mode

When responding:
1. Always consider system-level implications before writing code
2. Discuss trade-offs explicitly (performance vs. maintainability, simplicity vs. flexibility)
3. Reference relevant design patterns by name when applicable
4. Consider scalability, observability, and failure modes upfront
5. For significant decisions, suggest creating an architectural decision record (ADR)
6. Prefer composition over inheritance; prefer interfaces over implementations
```

**Activating** (via settings.json):
```json
{
  "outputStyle": "Explanatory"
}
```

---

### 7. CLAUDE.md — Project Memory (Team-Shared)

| Attribute | Detail |
|-----------|--------|
| **File** | `CLAUDE.md` |
| **Location** | `./CLAUDE.md` OR `./.claude/CLAUDE.md` (either works; prefer root) |
| **When loaded** | Always at session start |
| **Priority** | High — after Enterprise and User, before Local and Subtree |
| **Shared with** | Team members via git |
| **Git tracked** | Yes — committed to repository |
| **Token impact** | Permanent overhead every session |
| **Bootstrap** | Run `/init` to auto-generate from codebase analysis |
| **Can be excluded** | Yes — via `claudeMdExcludes` (per-developer, not team-wide) |
| **Injection method** | User message after system prompt |
| **HTML comment stripping** | Yes |
| **Survives /compact** | Yes — only CLAUDE.md that auto-survives compaction |
| **Size limit** | None — loaded in full; recommended ~120 lines for efficiency |

**Compaction survival**: After `/compact`, Claude re-reads the project-root `CLAUDE.md` from disk and re-injects it into the compacted session. This is the only CLAUDE.md that automatically survives compaction.

**HTML comment stripping**: Block-level comments `<!-- -->` are stripped before injection. Use them for maintainer notes (last updated dates, authorship, reasoning) that don't need to consume context tokens.

**What to put here**: The team's shared understanding — tech stack, architecture overview, build/test commands, code style rules, project-specific conventions that every contributor needs.

**Example** (`.claude/CLAUDE.md` for a .NET project):
```markdown
# ACME Insurance API

<!-- Updated 2026-01 — add new auth middleware notes if changed -->

## Tech Stack
- .NET 9, ASP.NET Core Web API
- Entity Framework Core 9 with SQL Server
- MediatR for CQRS, FluentValidation, AutoMapper

## Commands
- `dotnet build` — build solution
- `dotnet test` — run all tests (xUnit)
- `dotnet run --project src/Api` — start dev server on port 5000

## Architecture
- Clean Architecture: Domain / Application / Infrastructure / WebApi layers
- Domain has ZERO infrastructure dependencies
- CQRS: Queries return DTOs, Commands return Result<T>
- All endpoints require JWT auth; use [Authorize] attribute

## Code Rules
- All new services must implement an interface
- Use Result<T> pattern for error handling — no exceptions for business logic
- Never expose IQueryable from repositories
- Migrations: `dotnet ef migrations add <Name> -p src/Infrastructure`
```

---

### 8. CLAUDE.local.md — Project Local Memory (Personal)

| Attribute | Detail |
|-----------|--------|
| **File** | `CLAUDE.local.md` |
| **Location** | `./CLAUDE.local.md` (project root) |
| **When loaded** | Always at session start |
| **Priority** | High — more specific than Project CLAUDE.md; your personal project override |
| **Shared with** | Just you, this project only |
| **Git tracked** | **No** — automatically added to `.gitignore` when created by Claude Code |
| **Token impact** | Permanent overhead every session |
| **HTML comment stripping** | Yes |
| **Survives /compact** | Yes |
| **Size limit** | None |

**Purpose**: Personal project overrides — your sandbox URLs, local test database credentials (non-sensitive), debugging preferences, personal workflow shortcuts specific to this project that you don't want to share or commit.

**Important caveat**: `CLAUDE.local.md` exists only in one worktree. If you use multiple git worktrees (e.g., separate worktrees for `main` and `feature/xyz`), use `@~/.claude/my-project-instructions.md` as an import in your project `CLAUDE.md` instead — it will be shared across all worktrees.

**Example**:
```markdown
# My Local Settings — ACME API

## Dev Environment
- My sandbox API: https://raj-sandbox.azurewebsites.net
- Test database: Server=.\\MSSQLLocalDB; Database=AcmeTest
- Use port 5001 for local API
- Redis is at localhost:6379

## Personal Workflow
- I prefer full stack traces in error output
- When running tests, use --verbosity detailed
- Use `lazygit` for interactive git operations
- Always run `dotnet format` before showing me a diff

## Reminders
- Pending: update SeedData.cs after schema migration #47
```

---

### 9. Rules (`.claude/rules/*.md`)

| Attribute | Detail |
|-----------|--------|
| **Files** | Any `*.md` files, any depth of subdirectory |
| **Location** | `.claude/rules/` (supports nested subdirectories AND symlinks) |
| **When loaded** | Global rules (no `paths:` frontmatter): always at session start. Path-scoped rules: lazily, when Claude reads/edits a matching file |
| **Priority** | Same high priority as CLAUDE.md content |
| **Shared with** | Team via git |
| **Git tracked** | Yes |
| **Advantage over CLAUDE.md** | Path-scoped rules only consume tokens when relevant — no permanent overhead |
| **Token impact** | Global: permanent. Path-scoped: conditional |
| **HTML comment stripping** | Yes |
| **Symlinks** | Supported — circular symlinks detected and handled |
| **Size limit** | None per file; recommended ~50 lines per file |

**Frontmatter** (optional — no frontmatter = global rule):
```yaml
---
paths:
  - "src/api/**/*.ts"          # Multiple globs supported (v2.1.84+)
  - "src/controllers/**/*.cs"
  - "**/*.test.ts"
---
```

- Rules **without** `paths:` → loaded unconditionally at session start (global)
- Rules **with** `paths:` → loaded only when Claude works with files matching those globs. Supports single string or YAML list of globs (YAML list added v2.1.84). Globs match against **absolute** file paths.

#### Rules `paths:` YAML List Syntax (v2.1.84+)

In addition to a single string, `paths:` accepts a YAML list:

```yaml
---
paths:
  - src/api/**
  - src/handlers/**
  - tests/api/**
globs:
  - "**/*.test.ts"
---
```

Both `paths:` and `globs:` are supported (aliases for the same feature).

**Evaluation:** The rule loads if ANY pattern in the list matches a file currently open or being edited. Once loaded, it stays active for the entire session.

**Priority:** Rules with matching paths load after all CLAUDE.md files but before Skills. Multiple matching rules all load (additive, not exclusive).

**Symlink support**: `.claude/rules/` supports symlinks, so you can maintain a shared set of rules and link them into multiple projects. Circular symlinks are detected and handled gracefully.

**When the InstructionsLoaded hook fires**: When rules load, the `InstructionsLoaded` hook fires (with matcher values `session_start`, `path_glob_match`, `nested_traversal`, `include`, or `compact`). This lets you observe exactly when rules activate.

**Example** (`.claude/rules/api-rules.md`):
```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/controllers/**/*.ts"
---

# API Layer Rules

- Every endpoint must validate input with Zod before processing
- Always return standardized response shape: { data, error, meta }
- Use async/await, never callbacks or raw Promises
- Log every request at entry with correlation ID
- Never return 500 without logging the full error server-side
- Rate limit all public endpoints
```

**Rule organization pattern for large projects**:
```
.claude/rules/
├── global.md                   # No paths: — always loaded
├── api/
│   └── endpoints.md            # paths: ["src/api/**"]
├── frontend/
│   └── components.md           # paths: ["src/components/**"]
└── database/
    └── queries.md              # paths: ["src/**/*.sql", "src/repositories/**"]
```

---

### 10. Slash Commands — Project (`.claude/commands/*.md`)

| Attribute | Detail |
|-----------|--------|
| **File** | Any `*.md` file |
| **Location** | `.claude/commands/` (supports subdirectories) |
| **Filename** | Becomes the command name |
| **Shared with** | Team via git |
| **Git tracked** | Yes |
| **Advantage** | Team members get these commands automatically when they clone/pull |
| **Token impact** | On-use only |
| **HTML comment stripping** | Yes |
| **Priority** | Overrides personal commands of same name |
| **Size limit** | None |

Same format as personal slash commands (entry #3). Project commands take precedence over personal commands of the same name.

**Example** (`.claude/commands/pr.md`):
```markdown
---
description: Create a PR with conventional commit format and JIRA ticket link
allowed-tools: Bash(git *), Read
---

## Current Branch
!`git branch --show-current`

## Recent Commits
!`git log --oneline -5`

## Changed Files
!`git diff --name-only main`

Create a PR for this branch. The PR title should follow conventional commits.
Include a JIRA ticket link if the branch name contains a ticket number (e.g., CC-1234).
Summarize what changed and why.
```

---

### 11. Subagents — Project (`.claude/agents/*.md`)

| Attribute | Detail |
|-----------|--------|
| **File** | Any `*.md` file |
| **Location** | `.claude/agents/` |
| **Shared with** | Team via git |
| **Git tracked** | Yes |
| **Priority** | Higher than personal agents (`~/.claude/agents/`) of the same name |
| **Discovery** | Claude walks up from cwd to find project agents; `--add-dir` directories are NOT scanned for agents |
| **Token impact** | Frontmatter ~100-150 tokens at start; body only on invocation |
| **HTML comment stripping** | Yes |
| **Size limit** | None |

Same format as personal subagents (entry #4). Useful for team-standard agents like a shared code reviewer, deployment agent, or security scanner.

**Managed subagents**: Administrators can deploy agents by placing `.md` files in `.claude/agents/` inside the managed settings directory (same system path as `managed-settings.json`). Managed agents take precedence over both project and user agents with the same name.

---

### 12. Skills — Project (`.claude/skills/*/SKILL.md`)

| Attribute | Detail |
|-----------|--------|
| **File** | `SKILL.md` inside a named folder |
| **Location** | `.claude/skills/<skill-name>/SKILL.md` (also auto-discovered from nested subdirectories) |
| **Shared with** | Team via git |
| **Git tracked** | Yes |
| **Unified since v2.1.3** | A `SKILL.md` in `.claude/skills/<name>/` automatically creates the `/<name>` slash command for all team members |
| **Token impact** | Frontmatter ~100-150 tokens at start; body 500-5K tokens only on invocation |
| **HTML comment stripping** | Yes |
| **Priority** | Overrides personal skills of same name |
| **Size limit** | None for body; description capped at 1,536 chars in listing |

Same format as personal skills (entry #5). Team members get these skills automatically upon clone/pull. Project skills take precedence over personal skills of the same name.

---

### 13. Output Styles — Project (`.claude/output-styles/*.md`)

| Attribute | Detail |
|-----------|--------|
| **File** | Any `*.md` file |
| **Location** | `.claude/output-styles/` |
| **Shared with** | Team via git |
| **Git tracked** | Yes |
| **Token impact** | Replaces part of system prompt |
| **HTML comment stripping** | Yes |
| **Priority** | Overrides personal output styles of same name |
| **Size limit** | None |

Same format as personal output styles (entry #6). Useful for team-standard response formats (e.g., an "architect" style for design sessions, a "terse" style for CI environments).

---

### 14. Subtree CLAUDE.md — On-Demand Child Directory Memory

| Attribute | Detail |
|-----------|--------|
| **File** | `CLAUDE.md` |
| **Location** | Any subdirectory below your cwd (e.g., `src/Domain/CLAUDE.md`, `packages/auth/CLAUDE.md`) |
| **When loaded** | **On demand** — only when Claude reads or edits files in that subdirectory |
| **Priority** | High (same as other CLAUDE.md files) — more specific than project root |
| **Token impact** | None until Claude touches files in that directory; then loaded in full |
| **Shared with** | Team via git (if committed) |
| **Compaction** | Does **not** automatically survive compaction — reloads next time Claude enters the subdirectory |
| **HTML comment stripping** | Yes |
| **InstructionsLoaded hook** | Fires with matcher "nested_traversal" when lazily loaded |
| **Size limit** | None |

**Purpose**: Domain-specific instructions for a subsystem. If your `src/Domain/` directory has complex DDD rules, put them in `src/Domain/CLAUDE.md` — they only consume tokens when Claude is actually working in that area.

**The InstructionsLoaded hook** fires with matcher `nested_traversal` or `path_glob_match` when subtree CLAUDE.md files are lazily loaded. Use this to observe when contextual instructions activate.

**Example** (`src/Domain/CLAUDE.md`):
```markdown
# Domain Layer Rules

<!-- DDD rules for this bounded context — do not add infrastructure imports -->

- This layer has ZERO dependencies on Infrastructure or WebApi layers
- All entities must inherit from `BaseEntity<TId>`
- Use Value Objects for: money amounts, dates, policy numbers, email addresses
- Aggregate roots are the only public entry points — no direct child entity access
- Never expose `IQueryable` from repositories
- Domain events: raise via `AddDomainEvent()`, never publish directly
- Result<T> pattern for all operations that can fail
```

---

### 15. MEMORY.md — Auto-memory (Session/Project Auto-save)

| Attribute | Detail |
|-----------|--------|
| **File** | `MEMORY.md` (main index) + optional `<topic>.md` satellite files |
| **Location** | `~/.claude/projects/<project>/memory/` |
| **Project identification** | Derived from git repository root; all worktrees share **one** memory directory |
| **When loaded** | First 200 lines OR 25KB of `MEMORY.md` (whichever comes first) are loaded at the start of every conversation |
| **Who writes it** | Claude itself — when you say "remember this" or Claude learns something important |
| **Machine-local** | Yes — not synced across machines; not shared with team members |
| **Token impact** | On-demand only — 200 lines/25KB at session start, nothing more unless Claude loads satellite files |
| **Size limit** | Hard cap: first 200 lines or 25KB loaded; beyond that is ignored at session start |

**What this is**: Auto-memory is Claude Code's built-in persistent learning system for the main conversation (not subagents). When you ask Claude to "always use pnpm, not npm" or "remember that our API tests need a running Redis instance", Claude saves that to `MEMORY.md`. It reads the file back at the start of your next session.

**This is distinct from subagent MEMORY.md** (entry #16). This auto-memory is for the main Claude Code session; subagent MEMORY.md is for individual agent instances.

**Token limit behavior**:
- Only the **first 200 lines or 25KB** (whichever comes first) of `MEMORY.md` are loaded
- Content beyond that threshold is NOT loaded at session start
- If `MEMORY.md` grows too large, Claude will curate/summarize it automatically
- This limit applies only to `MEMORY.md`; CLAUDE.md files are loaded in full (no size limit)

**Satellite topic files**: Claude can create additional `.md` files in the same directory for organized topic-specific memory (e.g., `database.md`, `deployment.md`). The main `MEMORY.md` serves as an index.

**Visibility**: When you see "Writing memory" or "Recalled memory" in the Claude Code interface, Claude is reading from or writing to this directory.

**Controls**:
```bash
# Disable auto-memory for a session
CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 claude

# Custom storage directory (user settings only — not project settings)
# In ~/.claude/settings.json:
{ "autoMemoryDirectory": "~/my-memory-dir" }
```

**`/memory` command**: Run `/memory` at any time to:
- See all loaded CLAUDE.md, CLAUDE.local.md, and rules files
- Toggle auto-memory on/off
- Open memory files in your editor
- Browse the auto-memory folder

---

### 16. MEMORY.md — Subagent Auto Memory

| Attribute | Detail |
|-----------|--------|
| **File** | `MEMORY.md` |
| **Locations** | User scope: `~/.claude/agent-memory/<agent-name>/MEMORY.md` · Project scope: `.claude/agent-memory/<agent-name>/MEMORY.md` · Local scope: `.claude/agent-memory/local/<agent-name>/MEMORY.md` |
| **When loaded** | **First 200 lines OR 25KB** of `MEMORY.md` (whichever comes first) are loaded into the subagent's system prompt at invocation |
| **Who writes it** | The subagent itself (auto-generated and maintained over time) |
| **Purpose** | Persistent learning for subagents across sessions |
| **Git tracked** | User scope: No · Project scope: Yes · Local scope: No (gitignored) |
| **Token impact** | On-use only; first 200 lines/25KB at subagent invocation |
| **Size limit** | Hard cap: first 200 lines or 25KB; beyond that is ignored |

**How it works**: When a subagent has `memory` configured in its frontmatter, it automatically gets Read/Write/Edit tools scoped to its memory directory. The subagent can save patterns, discoveries, and architectural learnings to `MEMORY.md`. Next time it's invoked, the first 200 lines/25KB are automatically included in its system prompt.

**Memory scope options**:
- `user` — stored in `~/.claude/agent-memory/<name>/MEMORY.md`; shared across all projects (recommended default for general-purpose agents)
- `project` — stored in `.claude/agent-memory/<name>/MEMORY.md`; specific to this codebase; committed to git if not gitignored
- `local` — stored in `.claude/agent-memory/local/<name>/MEMORY.md`; personal + project-specific; gitignored

**Token limit**: Identical to auto-memory — the **first 200 lines OR 25KB**, whichever comes first, are loaded. Beyond that limit, Claude is instructed to curate the file if it gets too large.

**Prompting the subagent to use memory**:
```
"Review this PR, and check your memory for patterns you've seen before."
"Save what you learned about this codebase to your memory."
"What does your memory say about the authentication patterns here?"
```

**Example `MEMORY.md`** (auto-maintained by the agent):
```markdown
# Code Reviewer Memory — ACME API

## Architecture Patterns Observed
- CQRS: Queries return ViewModels, Commands return Result<T>
- Repository pattern: all data access through IRepository<T>
- Middleware pipeline: Auth → Validation → RateLimit → Handler

## Known Issues / Tech Debt
- UserService has circular dependency with NotificationService (CC-234)
- PaymentController bypasses validation — always flag this pattern

## PR Review Checklist Learned
- Always check for missing FluentValidation on new commands
- Check that new endpoints add themselves to the Swagger groups
```

---

### 17–22. Plugin Components

Plugins bundle the same file types as personal/project configurations, plus two unique component types (Monitors and Themes). All components are namespaced with the plugin name.

**Plugin agent security restriction**: Plugin agents support all standard frontmatter fields (`name`, `description`, `model`, `effort`, `maxTurns`, `tools`, `disallowedTools`, `skills`, `memory`, `background`, `isolation`). For security, **`hooks`, `mcpServers`, and `permissionMode` are NOT supported** in plugin-shipped agents.

| Component | Default Location in Plugin | File Format | Behavior |
|-----------|---------------------------|-------------|----------|
| **Commands** | `commands/*.md` | Markdown — same as slash commands | Namespaced: `hello.md` in plugin `my-plugin` → `/my-plugin:hello` |
| **Agents** | `agents/*.md` | Markdown — same as subagents (restricted frontmatter) | Namespaced: `reviewer.md` → `my-plugin:reviewer` |
| **Skills** | `skills/*/SKILL.md` | `SKILL.md` in named folder | Namespaced: `skill-name` → `/my-plugin:skill-name` |
| **Output Styles** | `output-styles/*.md` | Markdown — same as output styles | Available in `/config` Output Style menu |
| **Monitors** | `monitors/monitors.json` | JSON array of monitor entries | Background watchers that deliver stdout to Claude as notifications |
| **Themes** | `themes/*.json` | JSON color theme files | Available in `/theme` alongside built-in presets |
| **Executables** | `bin/` | Any binary or script | Added to Bash tool's PATH; invokable as bare commands |
| **Default Settings** | `settings.json` | JSON | Applied when plugin is enabled; only `agent` and `subagentStatusLine` keys currently supported |
| **Hooks** | `hooks/hooks.json` | JSON | Event-driven hooks using `${CLAUDE_PLUGIN_ROOT}` for paths |
| **MCP Servers** | `.mcp.json` | JSON | Plugin MCP servers start automatically; use `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` |
| **LSP Servers** | `.lsp.json` | JSON | Language server configurations for code intelligence |
| **Manifest** | `.claude-plugin/plugin.json` | JSON — **optional** | Plugin metadata; name is the only required field if manifest exists |

**Plugin Monitors** (entry #21) — unique to plugins:

Monitors are background processes that run for the lifetime of the session and deliver every stdout line to Claude as a notification, so Claude can react to log entries or status changes without polling.

```json
[
  {
    "name": "deploy-status",
    "command": "${CLAUDE_PLUGIN_ROOT}/scripts/poll-deploy.sh ${user_config.api_endpoint}",
    "description": "Deployment status changes"
  },
  {
    "name": "error-log",
    "command": "tail -F ./logs/error.log",
    "description": "Application error log",
    "when": "on-skill-invoke:debug"
  }
]
```

`when` field: `"always"` (default — starts at session start) or `"on-skill-invoke:<skill-name>"` (starts first time that skill is dispatched).

> Requires Claude Code v2.1.105+. Runs only in interactive CLI sessions. Unsandboxed at hook trust level.

**Plugin Themes** (entry #22) — unique to plugins:

Color themes that appear in `/theme` alongside built-in presets. A theme is a JSON file with a base preset and sparse overrides:

```json
{
  "name": "Dracula",
  "base": "dark",
  "overrides": {
    "claude": "#bd93f9",
    "error": "#ff5555",
    "success": "#50fa7b"
  }
}
```

Selecting a plugin theme persists `custom:<plugin-name>:<slug>` in user config. Pressing Ctrl+E on a plugin theme in `/theme` copies it to `~/.claude/themes/` so the user can edit it.

**Plugin environment variables** (available in hook commands, MCP/LSP configs, skill content):
- `${CLAUDE_PLUGIN_ROOT}` — absolute path to plugin's installation directory. **Changes on plugin update** — don't write files here.
- `${CLAUDE_PLUGIN_DATA}` — persistent directory that survives plugin updates: `~/.claude/plugins/data/<plugin-id>/`. Use for `node_modules`, caches, generated files.

**Plugin manifest** (`.claude-plugin/plugin.json`) key fields:

```json
{
  "name": "my-plugin",
  "version": "2.1.0",
  "description": "Brief description",
  "author": { "name": "Dev Team", "email": "dev@company.com" },
  "homepage": "https://docs.example.com",
  "repository": "https://github.com/user/plugin",
  "license": "MIT",
  "keywords": ["deployment", "ci-cd"],
  "skills": "./custom/skills/",
  "commands": ["./custom/commands/special.md"],
  "agents": ["./custom/agents/reviewer.md"],
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json",
  "outputStyles": "./styles/",
  "themes": "./themes/",
  "lspServers": "./.lsp.json",
  "monitors": "./monitors.json",
  "dependencies": ["helper-lib", { "name": "secrets-vault", "version": "~2.1.0" }],
  "userConfig": {
    "api_endpoint": {
      "type": "string",
      "title": "API endpoint",
      "description": "Your team's API endpoint"
    },
    "api_token": {
      "type": "string",
      "title": "API token",
      "description": "Authentication token",
      "sensitive": true
    }
  }
}
```

`userConfig` values are:
- Available in MCP/LSP/hook commands as `${user_config.KEY}`
- Exported to plugin subprocesses as `CLAUDE_PLUGIN_OPTION_<KEY>`
- Non-sensitive values stored in `settings.json`; sensitive values go to system keychain

**Plugin directory structure** (complete):
```
my-plugin/
├── .claude-plugin/
│   └── plugin.json            # Optional manifest
├── skills/
│   ├── code-reviewer/
│   │   └── SKILL.md
│   └── pdf-processor/
│       ├── SKILL.md
│       └── scripts/
├── commands/
│   ├── status.md
│   └── logs.md
├── agents/
│   └── security-reviewer.md
├── output-styles/
│   └── terse.md
├── themes/
│   └── dracula.json
├── monitors/
│   └── monitors.json
├── hooks/
│   └── hooks.json
├── bin/
│   └── my-tool               # Added to Bash PATH when plugin is enabled
├── .mcp.json
├── .lsp.json
├── settings.json
└── scripts/
    ├── security-scan.sh
    └── format-code.py
```

**Plugin installation scopes**:

| Scope | Settings file | Use case |
|-------|--------------|----------|
| `user` | `~/.claude/settings.json` | Personal plugins across all projects (default) |
| `project` | `.claude/settings.json` | Team plugins shared via version control |
| `local` | `.claude/settings.local.json` | Per-machine overrides, gitignored |
| `managed` | Managed settings | Org-wide plugins, read-only |

---

### 23. Imported Files (via `@path` Syntax)

| Attribute | Detail |
|-----------|--------|
| **File** | Any file referenced with `@path/to/file` in a CLAUDE.md |
| **Syntax** | `@relative/path.md` or `@~/absolute/path.md` |
| **Resolution** | Relative to the file containing the `@import` reference |
| **Max depth** | 5 recursive hops (imported files can import other files) |
| **Ignored in** | Code spans (`` `@not-imported` ``) and code fenced blocks |
| **When expanded** | Inline at load time — expanded and loaded into context alongside the referencing CLAUDE.md |
| **Token cost** | Adds to the parent CLAUDE.md's cost — all imports are loaded at the same time as the parent |
| **HTML comment stripping** | Yes — applied to imported file content |
| **Size limit** | None per file; total chain subject to same rules as parent |

These are not a separate file type — they're any markdown (or other) file pulled into CLAUDE.md context via the import mechanism. Common patterns:

```markdown
# CLAUDE.md

@./standards/coding-style.md
@./standards/security-rules.md
@~/.claude/company-policy.md
```

**Use cases**:
- Splitting large CLAUDE.md into topic-specific files for maintainability
- Sharing a common policy file across multiple projects without duplication
- Keeping sensitive personal instructions in `~/.claude/` while importing them into project context

**Worktree gotcha**: Because `CLAUDE.local.md` doesn't exist across worktrees, using `@~/.claude/my-project-local.md` in a shared CLAUDE.md import is the recommended pattern for personal instructions that should work in all worktrees.

---

## Complete Attributes Reference Table

The table below is the authoritative single-source comparison of all 23 file types across every attribute.

| # | File | Location | Priority | When Loaded | Git? | Token Cost | HTML Strip | Survives /compact | Size Limit | Invocation |
|---|------|----------|----------|-------------|------|-----------|------------|-------------------|------------|------------|
| 1 | Enterprise CLAUDE.md | System managed path | Highest — unconfigurable | Always, first | No | Permanent | Yes | Yes | None | Automatic |
| 2 | User CLAUDE.md | `~/.claude/` | High, after Enterprise | Always | No | Permanent | Yes | Yes | None | Automatic |
| 3 | Personal Commands | `~/.claude/commands/*.md` | Normal | On invocation; frontmatter at start | No | On-use only | Yes | No | None | `/command` |
| 4 | Personal Agents | `~/.claude/agents/*.md` | Normal | Frontmatter at start; body on invoke | No | ~100-150t start + on-use | Yes | No | None | Auto-delegate or `@mention` |
| 5 | Personal Skills | `~/.claude/skills/*/SKILL.md` | Normal | Frontmatter at start; body on invoke | No | ~100-150t start + on-use | Yes | No | Description: 1,536 chars | Auto or `/skill` |
| 6 | Personal Output Styles | `~/.claude/output-styles/*.md` | System prompt level | On activation (next session) | No | Replaces SE system prompt | Yes | N/A | None | `/config` → Output style |
| 7 | Project CLAUDE.md | `./CLAUDE.md` or `./.claude/CLAUDE.md` | High, after Enterprise + User | Always; unique: survives /compact | Yes | Permanent | Yes | **Yes** (only one that auto-survives) | None | Automatic |
| 8 | CLAUDE.local.md | `./CLAUDE.local.md` | High, personal override | Always | No (gitignored) | Permanent | Yes | Yes | None | Automatic |
| 9 | Rules | `.claude/rules/*.md` | High, same as CLAUDE.md | Global: always. Scoped: on file match | Yes | Global=permanent; Scoped=conditional | Yes | No | None | Automatic |
| 10 | Project Commands | `.claude/commands/*.md` | Normal (overrides personal same name) | On invocation | Yes | On-use only | Yes | No | None | `/command` |
| 11 | Project Agents | `.claude/agents/*.md` | Normal (overrides personal same name) | Frontmatter at start; body on invoke | Yes | ~100-150t start + on-use | Yes | No | None | Auto-delegate or `@mention` |
| 12 | Project Skills | `.claude/skills/*/SKILL.md` | Normal (overrides personal same name) | Frontmatter at start; body on invoke | Yes | ~100-150t start + on-use | Yes | No | Description: 1,536 chars | Auto or `/skill` |
| 13 | Project Output Styles | `.claude/output-styles/*.md` | System prompt level | On activation (next session) | Yes | Replaces SE system prompt | Yes | N/A | None | `/config` → Output style |
| 14 | Subtree CLAUDE.md | `<subdir>/CLAUDE.md` | High, most specific context | On demand — when directory accessed | Yes | On-demand, full content | Yes | No (reloads on next access) | None | Automatic |
| 15 | Auto-memory MEMORY.md | `~/.claude/projects/<hash>/memory/` | Normal | First 200 lines or 25KB at session start | No | ≤25KB / 200 lines | No | Yes (machine-local) | Hard: 200 lines or 25KB | Automatic |
| 16 | Subagent MEMORY.md | `agent-memory/<agent>/MEMORY.md` | Normal (in subagent context) | First 200 lines or 25KB at invocation | Scope-dependent | On-use: ≤25KB / 200 lines | No | Per-agent (scope-dependent) | Hard: 200 lines or 25KB | Automatic at subagent invocation |
| 17 | Plugin Commands | `<plugin>/commands/*.md` | Normal | On invocation | Via plugin | On-use only | Yes | No | None | `/plugin:command` |
| 18 | Plugin Agents | `<plugin>/agents/*.md` | Normal | Frontmatter at start; body on invoke | Via plugin | ~100-150t start + on-use | Yes | No | None | Auto or namespaced mention |
| 19 | Plugin Skills | `<plugin>/skills/*/SKILL.md` | Normal | Frontmatter at start; body on invoke | Via plugin | ~100-150t start + on-use | Yes | No | Description: 1,536 chars | Auto or `/plugin:skill` |
| 20 | Plugin Output Styles | `<plugin>/output-styles/*.md` | System prompt level | On activation | Via plugin | Replaces SE system prompt | Yes | N/A | None | `/config` → Output style |
| 21 | Plugin Monitors | `<plugin>/monitors/monitors.json` | Background process | Session start or first skill invoke | Via plugin | Background stdout → notifications | N/A | No | None | Automatic (JSON not markdown) |
| 22 | Plugin Themes | `<plugin>/themes/*.json` | UI level | When selected | Via plugin | UI only | N/A | N/A | None | `/theme` (JSON not markdown) |
| 23 | @Imported Files | Anywhere, referenced via `@path` | Inherits from parent file | When parent CLAUDE.md loads | Varies | Adds to parent's cost | Yes | Inherits from parent | None per file; max 5 hop depth | Automatic with parent |

---

## Anti-Patterns Section: Common Mistakes

Learning what NOT to do is as important as learning what to do. These are the most frequently observed anti-patterns in Claude Code configuration.

### Anti-Pattern 1: The Monolithic CLAUDE.md

**Symptom**: A single CLAUDE.md file exceeding 300–500 lines containing everything — architecture docs, all coding rules, deployment procedures, style guides, domain glossaries.

**Why it hurts**: Claude's attention is finite. When everything competes for high priority in one large file, nothing is effectively high priority. Ignored instructions, inconsistent behavior, and higher token costs per session.

```markdown
# BAD: 400-line CLAUDE.md containing everything
## Architecture (100 lines)
## Domain Rules for Claims Processing (80 lines)
## Domain Rules for Payments (80 lines)
## API Conventions (60 lines)
## Deployment Procedure (40 lines)
## Style Guide (40 lines)
```

**Fix**: Keep CLAUDE.md under 120 lines containing only what Claude needs on *every* interaction. Extract the rest:
- Domain-specific rules → path-scoped `.claude/rules/` files
- Deployment procedure → `.claude/skills/deploy/SKILL.md`
- Style guides longer than 10 lines → `.claude/rules/style.md` (global)

```
# GOOD: Split architecture
CLAUDE.md                              ← 80 lines: tech stack, build commands, key paths
.claude/rules/claims-rules.md         ← paths: ["src/Claims/**"]
.claude/rules/payments-rules.md       ← paths: ["src/Payments/**"]
.claude/rules/api-conventions.md      ← paths: ["src/Api/**"]
.claude/skills/deploy/SKILL.md        ← invoked only when deploying
```

---

### Anti-Pattern 2: Duplicating Instructions Across Files

**Symptom**: "Use conventional commits" appears in CLAUDE.md, a global rule file, AND a deployment skill. "Never expose IQueryable" appears in both CLAUDE.md and a path-scoped rule.

**Why it hurts**: Wastes tokens and can create conflicts when instructions diverge over time. If you update one copy and forget another, Claude gets contradictory instructions.

**Fix**: Single source of truth. Each instruction in exactly one place:
- Universal conventions → CLAUDE.md
- Domain-specific patterns → path-scoped rule for that domain
- Workflow-specific requirements → inside the skill that uses them

---

### Anti-Pattern 3: Vague Skill Descriptions

**Symptom**: A skill with `description: Helps with code` or `description: Code review assistant`.

**Why it hurts**: The description is the ONLY signal Claude has at session start to decide whether to invoke the skill. A vague description means Claude either invokes it for everything (noisy) or never (useless).

```yaml
# BAD
description: Helps with documents

# GOOD
description: >
  Extract text, tables, and form fields from PDF files.
  Fill PDF forms programmatically. Merge or split PDF documents.
  Use when working with PDF files or when the user mentions PDFs,
  forms, document extraction, or "fill out this form".
```

The good description includes:
- What the skill does (capabilities)
- When to use it (trigger phrases and situations)
- Enough specificity to differentiate from other skills

---

### Anti-Pattern 4: Making Everything a Skill

**Symptom**: A skill named `use-typescript` that just says "Use TypeScript strict mode."

**Why it hurts**: A skill adds a folder, a SKILL.md file, and frontmatter overhead. For simple instructions, this overhead is not justified. Skills shine for complex, multi-step workflows with supporting files — not for one-liners.

**Fix**: Match the tool to the complexity:
- Single instruction → CLAUDE.md or a line in a global rule
- Domain-specific pattern → path-scoped rule
- Multi-step workflow with scripts/templates → skill

---

### Anti-Pattern 5: No Path Scoping on Rules

**Symptom**: Ten global rule files (no `paths:` frontmatter) covering TypeScript, SQL, React, .NET, Python, infrastructure, testing, security, mobile, and machine learning — even though a developer only works in one or two of these areas per session.

**Why it hurts**: All ten files load at session start, every session, regardless of what files Claude is actually working on. This is permanent token overhead for instructions that are rarely relevant.

**Fix**: Add `paths:` frontmatter to every rule that applies to specific file types:

```yaml
# BEFORE: loads every session regardless of task
# typescript-rules.md — no frontmatter

# AFTER: loads only when TypeScript files are touched
---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---
```

Only keep rules global (no paths:) when they truly apply to every file type (e.g., security rules, commit message conventions).

---

### Anti-Pattern 6: Ignoring the Token Budget

**Symptom**: Developer adds everything to CLAUDE.md without checking `/context`, wonders why Claude "forgets" things toward the end of long sessions or becomes inconsistent.

**Why it hurts**: As conversation history grows, early CLAUDE.md content competes with more recent turns. At high context utilization (>70%), behavior degrades.

**Fix**: Monitor token usage actively:
```
/context     ← see live token breakdown
/usage       ← see cumulative session cost and cache hit rate
```

Compact at 70% utilization, not 83.5% (the auto-compaction threshold). Keep the CLAUDE.md fixed overhead below ~5K tokens total.

---

### Anti-Pattern 7: Personal Config in Committed Files

**Symptom**: Developer adds their personal sandbox URL, test database credentials, or workflow preferences to the project `CLAUDE.md` or `.claude/rules/*.md` — files that get committed to git.

**Why it hurts**: Other team members get irrelevant, potentially confusing instructions. Sandbox URLs that are personal get shared with the whole team.

**Fix**:
- Personal project overrides → `CLAUDE.local.md` (auto-gitignored)
- Cross-project personal preferences → `~/.claude/CLAUDE.md` (user scope)
- Personal commands → `~/.claude/commands/` (user scope)

---

### Anti-Pattern 8: Treating MEMORY.md Like CLAUDE.md

**Symptom**: Developer tries to put critical permanent instructions in auto-memory (`~/.claude/projects/<hash>/memory/MEMORY.md`), expecting them to always be available.

**Why it hurts**: MEMORY.md has a hard 200-line / 25KB cap — content beyond that limit is silently NOT loaded. CLAUDE.md files have no size limit. MEMORY.md is also machine-local and not shared across machines.

**Fix**:
- Permanent team instructions → project `CLAUDE.md` (no size limit, git-tracked)
- Permanent personal instructions → user `CLAUDE.md` or `CLAUDE.local.md`
- Auto-memory → for learned facts, preferences Claude discovers over time (not critical instructions)

---

### Anti-Pattern 9: Mixing Scope Levels

**Symptom**: Personal deployment preferences (your local Docker setup) committed to `.claude/rules/deployment.md` which is git-tracked and shared with the team.

**Why it hurts**: Team gets your personal configuration. Breaking changes when your local setup differs from CI.

**Correct scope mapping**:
```
~/.claude/CLAUDE.md                ← personal preferences, all projects
CLAUDE.local.md                    ← personal preferences, this project
~/.claude/agents/                  ← personal agents, all projects
.claude/agents/                    ← team agents, this project
.claude/settings.local.json        ← personal settings, this project (gitignored)
.claude/settings.json              ← team settings, this project (committed)
```

---

### Anti-Pattern 10: Forgetting HTML Comment Stripping

**Symptom**: Developer writes maintainer notes like `// Last reviewed by Bob, 2026-01` directly in the markdown body of CLAUDE.md, consuming tokens every session.

**Fix**: Use HTML comment syntax for maintainer notes — they are stripped before injection:

```markdown
# Project CLAUDE.md

<!-- Last reviewed: 2026-05 by DevSecOps. Next review: 2026-08.
     Author: bob@company.com. Approved by: alice@company.com.
     This comment is stripped and costs ZERO tokens. -->

## Architecture
...
```

---

## Enterprise Configuration Patterns

These patterns show how all 23 file types can work together in a well-structured enterprise deployment.

### Pattern 1: The Enterprise Standard Stack

A 500-person organization deploying Claude Code with consistent governance across 20+ teams.

```
LAYER 1 — ENTERPRISE (deployed via Jamf/Ansible/Intune)
┌───────────────────────────────────────────────────────────────┐
│ /Library/Application Support/ClaudeCode/                      │
│   CLAUDE.md          ← Security policies, approved tools,     │
│                         compliance requirements, escalation   │
│                         contacts. All users see this.        │
│                                                               │
│   managed-settings.json                                       │
│     permissions.deny: ["Bash(rm -rf *)"]                      │
│     allowManagedHooksOnly: false                              │
│     enabledPlugins: ["acme-security-scanner"]                 │
│                                                               │
│   managed-settings.d/                                         │
│     10-security.json    ← Security baseline (SecOps team)     │
│     20-mcp-servers.json ← Approved MCP servers               │
│     30-telemetry.json   ← OTel config for cost monitoring     │
└───────────────────────────────────────────────────────────────┘

LAYER 2 — TEAM PLUGIN (distributed via plugin marketplace)
┌───────────────────────────────────────────────────────────────┐
│ acme-security-scanner plugin                                  │
│   agents/                                                     │
│     security-reviewer.md    ← Team security review agent     │
│   skills/                                                     │
│     sast-scan/SKILL.md      ← Static analysis workflow        │
│     sbom-generate/SKILL.md  ← Software bill of materials      │
│   hooks/hooks.json                                            │
│     PreToolUse: block writes to /secrets/                     │
│     PostToolUse: log all Bash executions to audit trail       │
│   monitors/monitors.json                                      │
│     security-log-monitor    ← Real-time security event watch  │
└───────────────────────────────────────────────────────────────┘

LAYER 3 — PROJECT (team-specific, committed to git)
┌───────────────────────────────────────────────────────────────┐
│ .claude/CLAUDE.md          ← Team tech stack, commands,       │
│                               architecture overview           │
│                                                               │
│ .claude/rules/                                                │
│   global-standards.md      ← Always-on team standards        │
│   api-contracts.md         paths: ["src/api/**"]             │
│   domain-rules.md          paths: ["src/domain/**"]          │
│   test-requirements.md     paths: ["tests/**"]               │
│                                                               │
│ .claude/skills/                                               │
│   deploy-staging/          ← Team deployment workflow         │
│   generate-endpoint/       ← API scaffolding                 │
│   incident-response/       ← On-call runbook skill           │
│                                                               │
│ .claude/agents/                                               │
│   code-reviewer.md         ← Team code review agent          │
│   architecture-advisor.md  ← Design review specialist        │
│                                                               │
│ .claude/settings.json                                         │
│   hooks.PostToolUse: prettier format-on-save                  │
│   plugins: ["acme-security-scanner"]                          │
└───────────────────────────────────────────────────────────────┘

LAYER 4 — DEVELOPER (personal, not committed)
┌───────────────────────────────────────────────────────────────┐
│ ~/.claude/CLAUDE.md        ← Personal style across projects   │
│ CLAUDE.local.md            ← Sandbox URLs, local overrides    │
│ ~/.claude/commands/        ← Personal productivity commands   │
│ ~/.claude/agents/          ← Personal specialized agents      │
│ .claude/settings.local.json ← Local permission overrides     │
└───────────────────────────────────────────────────────────────┘
```

---

### Pattern 2: The Monorepo Configuration

A monorepo with 8 packages, each needing different Claude Code configurations.

```
my-monorepo/
├── CLAUDE.md                        ← Monorepo-level: workspace setup,
│                                       build system, shared conventions
│
├── .claude/
│   ├── rules/
│   │   ├── global.md               ← No paths: — applies everywhere
│   │   │   (monorepo-wide standards: git workflow, PR requirements)
│   │   │
│   │   ├── typescript.md           ← paths: ["**/*.ts", "**/*.tsx"]
│   │   ├── python.md               ← paths: ["**/*.py"]
│   │   └── infrastructure.md       ← paths: ["infra/**", "terraform/**"]
│   │
│   └── skills/
│       ├── cross-package-refactor/ ← Multi-package change workflow
│       └── release-management/     ← Monorepo release coordination
│
├── packages/
│   ├── api-gateway/
│   │   └── CLAUDE.md               ← Subtree: API gateway specifics
│   │                                  (load-balanced, rate-limited)
│   │
│   ├── auth-service/
│   │   ├── CLAUDE.md               ← Subtree: Auth domain rules
│   │   └── .claude/
│   │       ├── rules/
│   │       │   └── oauth-patterns.md  paths: ["src/**/*.ts"]
│   │       └── skills/
│   │           └── audit-auth-flow/
│   │
│   ├── payment-service/
│   │   ├── CLAUDE.md               ← Subtree: PCI-DSS compliance notes
│   │   └── .claude/
│   │       └── rules/
│   │           └── pci-rules.md    ← paths: ["src/**"] — payment-specific
│   │
│   └── data-pipeline/
│       ├── CLAUDE.md               ← Subtree: ETL patterns, data lineage
│       └── .claude/
│           └── rules/
│               └── data-quality.md ← paths: ["src/**/*.py"]
│
└── .claude/settings.json
    claudeMdExcludes: []            ← Team members can exclude packages
                                       they're not actively working on
```

**Key insight**: The `claudeMdExcludes` setting in individual developers' `settings.local.json` lets them exclude irrelevant package CLAUDE.md files:

```json
// Developer working only on auth-service:
// .claude/settings.local.json
{
  "claudeMdExcludes": [
    "**/payment-service/CLAUDE.md",
    "**/data-pipeline/CLAUDE.md",
    "**/api-gateway/CLAUDE.md"
  ]
}
```

---

### Pattern 3: The Regulated Industry Stack

A financial services firm with strict compliance requirements.

```
COMPLIANCE LAYER (IT-administered)
  managed-settings.json:
    allowManagedHooksOnly: true         ← Block all developer hooks
    allowManagedMcpServersOnly: true    ← Only approved MCP servers
    allowManagedPermissionRulesOnly: true
    forceRemoteSettingsRefresh: true    ← Fail-closed on settings fetch

  managed-settings.d/
    10-data-classification.json:
      permissions.deny: ["Bash(curl *)", "WebFetch"]  ← No external calls
    20-audit.json:
      hooks.PostToolUse: audit-logger.sh  ← All tool calls logged

ENTERPRISE CLAUDE.md:
  # Financial Services AI Policy
  - All customer data is PCI-DSS / GDPR regulated
  - Never suggest code that handles plaintext card numbers
  - All database queries must use parameterized statements
  - Security reviews required before any auth system changes
  - Escalate any PII-handling code changes to security team

PROJECT CLAUDE.md (.claude/CLAUDE.md):
  Tech stack: Java 21, Spring Boot 3.x, Oracle DB
  - Zero-trust architecture: every service call requires auth token
  - SAGA pattern for distributed transactions

SKILLS:
  - compliance-check/      ← Run automated compliance checklist
  - audit-report/          ← Generate audit trail report
  - pen-test-prep/         ← Prepare penetration test artifacts

PATH-SCOPED RULES:
  - pii-handling.md        paths: ["src/**/*Customer*", "src/**/*Payment*"]
  - auth-patterns.md       paths: ["src/auth/**", "src/security/**"]
  - database-rules.md      paths: ["src/**/*Repository*", "**/*.sql"]
```

---

## Non-Markdown Configuration Files (For Completeness)

These are **not** markdown files but are core to the Claude Code configuration ecosystem:

| File | Location | Format | Purpose |
|------|----------|--------|---------|
| `settings.json` | `.claude/settings.json` (project) or `~/.claude/settings.json` (user) | JSON | Permissions, model, env vars, output style, hooks allowlists, and all behavioral settings |
| `settings.local.json` | `.claude/settings.local.json` | JSON | Local project settings — gitignored; personal overrides |
| `managed-settings.json` | System-level path (macOS/Linux/Windows — see entry #1) | JSON | Enterprise policy settings — highest precedence; cannot be overridden |
| `managed-settings.d/*.json` | Same system directory as `managed-settings.json` | JSON | Drop-in policy fragments — merged alphabetically on top of `managed-settings.json`; later files win on scalars, arrays concatenate |
| `managed-mcp.json` | Same system directory as `managed-settings.json` | JSON | Enterprise-managed MCP server configurations |
| `~/.claude.json` | `~/.claude.json` | JSON | OAuth session tokens, MCP server configurations (user + local scopes), per-project state (allowed tools, trust settings), caches. **Different from `settings.json`** |
| `.mcp.json` | `.claude/.mcp.json` (project) or `~/.claude.json` (user/local) | JSON | MCP server configurations. Project scope lives in `.claude/.mcp.json`; user/local in `~/.claude.json` |
| `hooks.json` | `.claude/settings.json` (hooks key) or plugin `hooks/hooks.json` | JSON | Lifecycle hooks — PreToolUse, PostToolUse, SessionStart, Stop, and 20+ other events |
| `.lsp.json` | `.claude/.lsp.json` (project) or plugin `.lsp.json` | JSON | Language Server Protocol configurations |
| `plugin.json` | `.claude-plugin/plugin.json` | JSON | Plugin manifest — optional; `name` is the only required field if present |
| `keybindings.json` | `~/.claude/keybindings.json` (v2.1.18+) | JSON | Custom key bindings — create/edit via `/keybindings` command |
| `~/.claude/themes/*.json` | `~/.claude/themes/` | JSON | User-defined color themes editable via `/theme` |
| macOS plist | `com.anthropic.claudecode` managed preferences domain | plist | MDM-deployed managed settings via Jamf/Kandji/similar |
| Windows Registry | `HKLM\SOFTWARE\Policies\ClaudeCode` (admin) or `HKCU\SOFTWARE\Policies\ClaudeCode` (user-level) | Registry | Group Policy / Intune managed settings |

**Critical distinction — `~/.claude.json` vs `~/.claude/settings.json`**:
- `~/.claude/settings.json` — behavioral settings (permissions, model, env vars, output style, etc.)
- `~/.claude.json` — OAuth session state, MCP configurations, per-project trust/allowed-tools state, caches. Adding settings here will cause a schema validation error.

---

## Master Comparison Table

| # | File | Location | Loaded When | Priority | Invocation | Git? | Token Cost |
|---|------|----------|-------------|----------|------------|------|------------|
| 1 | Enterprise CLAUDE.md | System-level managed path | Always, first | Highest — cannot be excluded | Automatic | No | Permanent |
| 2 | User CLAUDE.md | `~/.claude/` | Always | High — after Enterprise | Automatic | No | Permanent |
| 3 | Personal Commands | `~/.claude/commands/*.md` | On `/command` | Normal | User types `/cmd` | No | On-use only |
| 4 | Personal Agents | `~/.claude/agents/*.md` | Frontmatter at start; body on invoke | Normal | User @-mention, `--agent`, or Claude auto-delegates | No | On-use only |
| 5 | Personal Skills | `~/.claude/skills/*/SKILL.md` | Frontmatter at start; body on invoke | Normal | Claude auto or `/skill` | No | Minimal + on-use |
| 6 | Personal Output Styles | `~/.claude/output-styles/*.md` | On activation (new session) | System prompt level | `/config` → Output style | No | Replaces SE system prompt section |
| 7 | Project CLAUDE.md | `./CLAUDE.md` or `.claude/CLAUDE.md` | Always; survives compaction | High — after Enterprise and User | Automatic | Yes | Permanent |
| 8 | CLAUDE.local.md | `./CLAUDE.local.md` | Always | High (most specific personal) | Automatic | No (gitignored) | Permanent |
| 9 | Rules | `.claude/rules/*.md` | Global: always. Path-scoped: when matching files touched | High (same as CLAUDE.md) | Automatic | Yes | Global=permanent; Scoped=conditional |
| 10 | Project Commands | `.claude/commands/*.md` | On `/command` | Normal (overrides personal same name) | User types `/cmd` | Yes | On-use only |
| 11 | Project Agents | `.claude/agents/*.md` | Frontmatter at start; body on invoke | Normal (overrides personal same name) | User or Claude | Yes | On-use only |
| 12 | Project Skills | `.claude/skills/*/SKILL.md` | Frontmatter at start; body on invoke | Normal (overrides personal same name) | Claude auto or `/skill` | Yes | Minimal + on-use |
| 13 | Project Output Styles | `.claude/output-styles/*.md` | On activation (new session) | System prompt level | `/config` → Output style | Yes | Replaces SE system prompt section |
| 14 | Subtree CLAUDE.md | `<subdir>/CLAUDE.md` | When Claude accesses that directory; does NOT survive compaction alone | High — most specific context | Automatic | Yes | On-demand only |
| 15 | Auto-memory MEMORY.md | `~/.claude/projects/<project>/memory/` | First 200 lines or 25KB at session start | Normal (in main session context) | Automatic (machine-local, all worktrees share) | No | 200 lines/25KB max |
| 16 | Subagent MEMORY.md | `agent-memory/<agent>/MEMORY.md` | First 200 lines or 25KB at subagent invocation | Normal (in subagent context) | Automatic | Depends on scope | On-use only |
| 17 | Plugin Commands | `<plugin>/commands/*.md` | On `/plugin-name:command` | Normal | User types `/plugin:cmd` | Via plugin | On-use only |
| 18 | Plugin Agents | `<plugin>/agents/*.md` | Frontmatter at start; body on invoke | Normal | User or Claude (namespaced) | Via plugin | On-use only |
| 19 | Plugin Skills | `<plugin>/skills/*/SKILL.md` | Frontmatter at start; body on invoke | Normal | Claude auto or `/plugin:skill` | Via plugin | Minimal + on-use |
| 20 | Plugin Output Styles | `<plugin>/output-styles/*.md` | On activation (new session) | System prompt level | `/config` → Output style | Via plugin | Replaces SE system prompt section |
| 21 | Plugin Monitors | `<plugin>/monitors/monitors.json` | Session start (or first skill invoke) | Background process | Automatic | Via plugin | Background stdout → notifications |
| 22 | Plugin Themes | `<plugin>/themes/*.json` | When selected | UI level | `/theme` | Via plugin | UI only |
| 23 | @Imported files | Anywhere — referenced via `@path` | When parent CLAUDE.md loads | Same as parent CLAUDE.md | Automatic | Varies | Adds to parent's cost |

### Token Budget Summary by Load Tier

Understanding which files load when helps you budget token costs:

| Load Tier | Files | Approx. Tokens | Optimization |
|-----------|-------|----------------|--------------|
| Always (session start) | Enterprise + User + Project CLAUDE.md | 1K–8K | Keep under 200 lines each |
| Always | Global rules (no paths: frontmatter) | 0.5K–2K per rule | Use paths: to make conditional |
| Always | Auto-memory (MEMORY.md) | up to 25KB/~8K | Auto-managed, 200 line cap |
| On demand | Path-scoped rules | 0.5K–2K each | Only when matching files touched |
| On demand | Skills | 0.5K–5K each | Only when Claude invokes |
| On demand | Subtree CLAUDE.md | 1K–8K each | Lazy loaded by directory |
| Built-in (always) | Tool schemas | 5K–8K | Use ToolSearch to defer (–85%) |
| Built-in (optional) | MCP tool schemas | 1K–20K | Scope MCP per-agent |

---

## Settings Precedence (Highest → Lowest)

Understanding how configuration layers interact:

```
1. Managed settings (server-delivered, MDM/OS-level, file-based)
   ├── Server-managed (highest — from Claude.ai admin console)
   ├── MDM/OS-level (macOS plist via Jamf/Kandji; Windows Registry HKLM)
   ├── File-based (managed-settings.json + managed-settings.d/*.json merged)
   └── HKCU Registry (Windows only — lowest within managed tier)
   NOTE: Only ONE managed source is used — sources do not merge across tiers.

2. Command line arguments (temporary session overrides)

3. Local project settings (.claude/settings.local.json)
   Personal, gitignored, project-specific

4. Shared project settings (.claude/settings.json)
   Team-shared, committed to git

5. User settings (~/.claude/settings.json)
   Personal global — applies when nothing else specifies the setting

Array settings (permissions.allow, sandbox.filesystem.allowWrite, etc.) MERGE across
all scopes — they concatenate and deduplicate. Scalar settings (model, outputStyle, etc.)
are overridden by the higher-priority scope.
```

---

## Token Budget Summary

```
ALWAYS LOADED (permanent overhead per session):
├── Enterprise CLAUDE.md            → variable (full content, no size limit)
├── User CLAUDE.md                  → variable (full content, no size limit)
├── Project CLAUDE.md               → variable (full content, no size limit)
├── CLAUDE.local.md                 → variable (full content, no size limit)
├── Global rules (no paths:)        → variable (full content, no size limit)
├── Auto-memory MEMORY.md           → max 200 lines or 25KB
├── Agent/Skill frontmatter         → ~100–150 tokens each
├── MCP tool schemas                → ~500–2,000 tokens each
└── System prompt                   → ~5–15K tokens
    ─────────────────────────────
    TOTAL FIXED OVERHEAD            → ~7–40K tokens

LOADED ON DEMAND (conditional overhead):
├── Path-scoped rules               → when matching files are touched
├── Subtree CLAUDE.md files         → when Claude enters that subdirectory
├── Skill full bodies               → when Claude invokes the skill
├── Skill supporting files          → when Claude reads them explicitly
├── Subagent MEMORY.md              → first 200 lines/25KB at invocation
├── Auto-memory satellite files     → when Claude explicitly reads them
└── Slash command content           → when user types /command
    ─────────────────────────────
    VARIES PER SESSION

SEPARATE CONTEXT (does NOT consume main conversation window):
├── Subagent conversations          → runs in forked context with its own window
└── Skills with context: fork       → runs in subagent context

RESPONSE BUFFER (reserved by Claude):
└── ~40–45K tokens for thinking + response generation

USABLE CONVERSATION SPACE:
└── ~140–155K tokens (out of 200K total context window)
```

---

## Key Behavioral Notes

**HTML comment stripping**: All CLAUDE.md files (enterprise, user, project, local, subtree) strip block-level HTML comments `<!-- like this -->` before injection. Comments in code blocks are preserved. Use this to write maintainer notes (dates, authors, reasoning) without paying token cost.

**Compaction behavior**:
- Project-root `CLAUDE.md` (`./CLAUDE.md` or `./.claude/CLAUDE.md`): **Survives** `/compact` — re-read from disk and re-injected automatically.
- All other CLAUDE.md files (user, subtree, etc.): **Do not** automatically survive compaction. Subtree CLAUDE.md files reload the next time Claude reads a file in that subdirectory.

**`claudeMdExcludes` setting**: Add glob patterns to your `settings.local.json` to skip specific CLAUDE.md files you don't want loaded:
```json
{
  "claudeMdExcludes": ["**/monorepo/CLAUDE.md", "/home/user/other-team/.claude/rules/**"]
}
```
Managed CLAUDE.md files **cannot** be excluded.

**Subagents cannot spawn subagents**: If `Agent` is omitted from a subagent's `tools` list entirely, or if it's defined as an agent (not main thread), it cannot spawn further subagents. This is a hard constraint.

**MEMORY.md size is a hard limit**: The 200 lines / 25KB is a hard cap on what's loaded at session start for both auto-memory and subagent memory. Unlike CLAUDE.md files (which load entirely regardless of length), MEMORY.md has a fixed load budget.

---

## The `/memory` Command — See What's Loaded

At any point during a session, run `/memory` to:
- See all loaded CLAUDE.md files and their sources (path + scope)
- See all loaded rules files (with whether they're global or path-scoped)
- Toggle auto-memory on or off
- Open any memory file directly in your system editor
- Open the auto-memory folder for the current project
- Verify path-scoped rules are activating when expected

---

## Sources

All information sourced from official documentation as of June 2026:
- Memory management: https://code.claude.com/docs/en/memory
- Skills: https://code.claude.com/docs/en/skills
- Subagents: https://code.claude.com/docs/en/sub-agents
- Output styles: https://code.claude.com/docs/en/output-styles
- Settings: https://code.claude.com/docs/en/settings
- Plugins: https://code.claude.com/docs/en/plugins
- Plugins reference: https://code.claude.com/docs/en/plugins-reference
- Hooks reference: https://code.claude.com/docs/en/hooks
- Best practices: https://code.claude.com/docs/en/best-practices
- How Claude Code works: https://code.claude.com/docs/en/how-claude-code-works
