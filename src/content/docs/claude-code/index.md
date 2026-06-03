---
title: Claude Code
description: Complete technical reference and training for Claude Code — quick start, CLI reference, all 23 file types, configuration hierarchy, hooks system (30+ events, 5 handler types), MCP servers (JSON-RPC 2.0, stdio/HTTP), agent teams & subagents, CI/CD integration (GitHub Actions, GitLab, Azure DevOps, Bedrock, Vertex AI with WIF), permissions & sandbox, Agent SDK (Python/TypeScript), worktrees & parallel development, plugins (10 component types), output styles, memory management (7 types), models & pricing, slash commands, context engineering, enterprise deployment, monorepo patterns, and 19 interactive diagrams. 44 total resources. Claude Code v2.1.126 · Updated June 2026.
sidebar:
  order: 1
lastUpdated: 2026-06-03
---

Claude Code is Anthropic's agentic terminal-based coding assistant. It lives in your terminal, understands your entire codebase, and executes multi-step engineering tasks autonomously — reading files, running commands, editing code, managing Git, and verifying its own work in a closed loop.

**Latest stable:** v2.1.126 (May 19, 2026) · **Package:** `@anthropic-ai/claude-code` (392+ published versions) · **Platforms:** macOS, Linux, WSL2, Windows native

```
┌────────────────────────────── CLAUDE CODE ECOSYSTEM ────────────────────────────────┐
│                                                                                       │
│  ┌──────────────────┐    ┌────────────────────┐    ┌─────────────────────────────┐  │
│  │    CONFIGURE     │    │      EXTEND         │    │         INTEGRATE           │  │
│  │                  │    │                     │    │                             │  │
│  │  CLAUDE.md       │    │  MCP Servers        │    │  GitHub Actions             │  │
│  │    hierarchy     │    │  (stdio / HTTP)     │    │  GitLab CI                  │  │
│  │  23 file types   │    │  30+ hook events    │    │  Azure DevOps               │  │
│  │  Rules (path-    │    │  5 handler types    │    │  Agent SDK (Python / TS)    │  │
│  │    scoped)       │    │  Plugin system      │    │  AWS Bedrock (3 tiers)      │  │
│  │  Skills          │    │  Agent Teams        │    │  GCP Vertex AI + WIF        │  │
│  │  Output Styles   │    │  Subagents          │    │  Sandboxed / --bare mode    │  │
│  │  Settings hier.  │    │  /advisor dual-model│    │  DISABLE_UPDATES lockdown   │  │
│  └──────────────────┘    └────────────────────┘    └─────────────────────────────┘  │
│                                                                                       │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │                          AGENTIC LOOP (CORE ENGINE)                           │   │
│  │                                                                               │   │
│  │  User Prompt                                                                  │   │
│  │      │  [UserPromptSubmit hooks — can inject context or block]                │   │
│  │      ▼                                                                        │   │
│  │  Claude API ──► tool_use?                                                     │   │
│  │      │    [reads: CLAUDE.md, Rules, Memory, Skills, loaded context]           │   │
│  │      │          YES                           NO                              │   │
│  │      │    [PreToolUse hooks]           [Stop hooks — can force continue]      │   │
│  │      ▼          │                              │                              │   │
│  │  Execute tool   │                        End turn ──► return to user          │   │
│  │  (Read/Edit/    │                                                             │   │
│  │   Bash/Task/    │                                                             │   │
│  │   Monitor/...)  │                                                             │   │
│  │      │    [PostToolUse hooks — can reject result or inject context]           │   │
│  │      │                                                                        │   │
│  │  Append tool_result to context ──► back to Claude API (loop)                 │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                       │
│  MODELS (June 2026):                                                                  │
│    Opus 4.8 (newest, `opus` alias) · Opus 4.7 (1M ctx) · Opus 4.6 · Sonnet 4.6      │
│    (default) · Haiku 4.5                                                              │
│  EFFORT:   low · normal · high · xhigh (extended thinking, up to ~32K think tokens)  │
│  MEMORY:   Enterprise Managed > CLI flags > settings.local.json > settings.json >    │
│            ~/.claude/settings.json > CLAUDE.md hierarchy > Rules > Skills            │
│  PRICING:  Opus $15/M in · $75/M out · $1.50/M cache  |  Sonnet $3/$15/$0.30        │
│            Haiku $0.80/$4.00/$0.08                                                    │
└───────────────────────────────────────────────────────────────────────────────────────┘
```

---

## What's New (v2.1.108–v2.1.126) · Documentation Updated June 2026

| Version | Feature | What changed |
|---------|---------|-------------|
| v2.1.126+ | claude-opus-4-8 | Newest Opus model added as the most capable frontier model; holds the `opus` alias; same 1M context window and pricing as Opus 4.7; `/fast` toggle for Opus-speed streaming optimisation without model downgrade |
| v2.1.126 | Latest stable (May 2026) | Bug fixes, stability improvements, minor UX polish across slash command UI |
| v2.1.122 | Bedrock service tiers | `default`, `flex`, `priority` tier selection via `CLAUDE_CODE_BEDROCK_SERVICE_TIER`; flex lowers cost for async/CI workloads, priority reserves throughput for SLA-bound pipelines |
| v2.1.121 | Vertex Workload Identity Federation | WIF support for GCP auth in CI — no service account key file required; works with GKE Workload Identity, Cloud Run, Cloud Functions |
| v2.1.120 | `${CLAUDE_EFFORT}` in skills | Skills can read and respond to session effort level; enables adaptive behaviour (e.g., skip extended analysis at `low` effort) |
| v2.1.119 | `/config` persistence | All settings changed via the `/config` UI are automatically saved to `~/.claude/settings.json`; no manual JSON editing required |
| v2.1.118 | `DISABLE_UPDATES` + `mcp_tool` hooks | `DISABLE_UPDATES=1` freezes the Claude Code binary version for managed/enterprise environments; `mcp_tool` hook matcher targets individual MCP tool calls by tool name |
| v2.1.117 | Opus 4.7 default `xhigh` effort | Default effort elevated to `xhigh` for Opus 4.7 sessions; 1M context window bug fixes and stability improvements |
| v2.1.116 | `/terminal-setup` command | Configure terminal scroll sensitivity, clipboard integration, and iTerm2 Shift+Enter multiline binding from a guided UI |
| v2.1.113 | Native binary (no Node.js) | `Glob`/`Grep` tools replaced with embedded `bfs` (file traversal) and `ugrep` (search); 30–50% faster cold starts; Node.js no longer required |
| v2.1.108 | Cache TTL fix | 1-hour prompt cache TTL now correctly honoured for `DISABLE_TELEMETRY=1` users; previously, telemetry-disabled sessions fell back to shorter cache windows |
| v2.1.105 | `/doctor` auto-fix | Health check with `f`-key guided auto-repair for common installation and config issues; plugin health monitors enabled |
| v2.1.104 | `/team-onboarding` | Generate a codebase-aware teammate ramp-up guide from automated project analysis |
| v2.1.98  | Monitor tool | Stream background process stdout line-by-line — enables real-time CI feedback loops without polling |
| v2.1.92  | `--bare` mode | CI-optimised launch mode: 14% faster startup, skips non-essential initialisation steps (theme, telemetry prompt, update check) |
| v2.1.89  | Compaction circuit breaker | Prevents runaway auto-compaction thrash loop in long agentic sessions; configurable hysteresis window |
| v2.1.84  | Rules `paths:` scoping | Rules load conditionally based on file glob patterns; `paths:` frontmatter field accepts YAML list syntax |
| v2.1.63  | `http` hook handler | POST hook event payloads to any webhook URL — enables external audit logging, Slack notifications, SIEM integration |
| v2.1.32  | Agent Teams (Research Preview) | Persistent peer-to-peer multi-agent sessions via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |

---

## June 2026 — Documentation Update

This site received a comprehensive documentation refresh on **2026-06-03**, covering all Claude Code features through **v2.1.126** (the latest stable release as of May 19, 2026).

**What was updated in this refresh:**

- All 44 documentation files reviewed and updated for accuracy through v2.1.126
- New ASCII flow diagrams added throughout: agentic loop detail, model decision trees, cost optimization flowcharts, MCP debugging flows, and configuration hierarchy visuals
- Pricing tables updated to reflect current rates: Opus 4.8/4.7/4.6 at $15/$75/$1.50 per million tokens; Sonnet 4.6 at $3/$15/$0.30; Haiku 4.5 at $0.80/$4.00/$0.08
- Extended cost optimization strategies with worked examples: prompt caching ROI, multi-model agent fleet pricing, per-sprint cost projections
- `claude-opus-4-8` documented as the newest Opus model holding the `opus` alias, with full capability and pricing comparison against Opus 4.7
- Bedrock service tiers (`default`, `flex`, `priority`) and Vertex AI WIF documented in detail
- New "Common Beginner Mistakes" reference table with symptom/cause/fix format
- New "Daily Workflow Patterns" section covering morning standup, feature implementation, debugging session, and PR review workflows
- Extended thinking mechanics documented in depth: token economics, budget ranges by effort level, when thinking pays off vs. when it wastes budget
- Hooks system updated with `mcp_tool` matcher and `DISABLE_UPDATES` env var documentation
- All date references updated to June 2026

---

## Feature Map

```
╔══════════════════════════════════════════════════════════════════════════════════╗
║              Claude Code v2.1.126 — Complete Feature Coverage Map               ║
╠══════════════════════════╦════════════════════════╦═══════════════════════════╣
║  CONFIGURE               ║  EXTEND                ║  INTEGRATE                ║
╠══════════════════════════╬════════════════════════╬═══════════════════════════╣
║  CLAUDE.md hierarchy     ║  MCP Servers           ║  GitHub Actions           ║
║    23 recognised types   ║    stdio transport     ║    (anthropics/claude-    ║
║    session-wide context  ║    HTTP/SSE transport  ║     code-action@v1)       ║
║  Configuration guide     ║    JSON-RPC 2.0        ║  GitLab CI                ║
║  Rules (path-scoped,     ║    3 primitives:       ║  Azure DevOps             ║
║    v2.1.84+)             ║    Tools/Resources/    ║  AWS Bedrock              ║
║  Skills                  ║    Prompts             ║    3 service tiers        ║
║    auto-invokable        ║  30+ hook events       ║    (default/flex/prio)    ║
║  Output Styles           ║    5 handler types:    ║  GCP Vertex AI + WIF      ║
║  Memory (7 types)        ║    command/prompt/     ║    (v2.1.121+)            ║
║  Settings hierarchy      ║    agent/http/mcp_tool ║  Agent SDK (Python / TS)  ║
║    7-layer precedence    ║  Plugin system (10 types)  CI non-interactive       ║
║  /config UI persistence  ║  Agent Teams           ║  --bare mode (14% faster) ║
║  DISABLE_UPDATES lockdown║  Subagents             ║  Sandboxed mode           ║
║  ${CLAUDE_EFFORT} skills ║  Task tool             ║  DISABLE_UPDATES          ║
║  claudeMdExcludes        ║  /advisor dual-model   ║  DISABLE_TELEMETRY        ║
║  @import syntax          ║  Custom commands       ║  OpenTelemetry logging    ║
╠══════════════════════════╬════════════════════════╬═══════════════════════════╣
║  CORE TOOLS              ║  EFFICIENCY            ║  SECURITY                 ║
╠══════════════════════════╬════════════════════════╬═══════════════════════════╣
║  Read (files/images/PDFs)║  Prompt caching        ║  4 permission modes:      ║
║  Write (full overwrite)  ║    (automatic, 90%     ║    normal / plan /        ║
║  Edit (exact replace)    ║    cheaper cache reads)║    autoAccept /           ║
║  MultiEdit (atomic)      ║  Effort levels (4):    ║    bypassPermissions      ║
║  Bash (shell commands)   ║    low/normal/high/    ║  Tool allowlists          ║
║  Monitor (v2.1.98+)      ║    xhigh               ║    (Bash(git:*) syntax)   ║
║  Glob (bfs, v2.1.113+)   ║  Context engineering   ║  Tool blocklists          ║
║  Grep (ugrep, v2.1.113+) ║  Auto-compaction +     ║  Enterprise managed       ║
║  LS (directory listing)  ║    circuit breaker     ║  Sandbox filesystem       ║
║  WebFetch (AI extract)   ║  Token budgeting       ║    (Seatbelt/bubblewrap)  ║
║  WebSearch (AI ranked)   ║  Model selection       ║  Audit logging            ║
║  TodoWrite / TodoRead    ║  Output style costs    ║  Secret scanning          ║
║  Task (subagent spawn)   ║  /compact + /context   ║  Role-based access        ║
║  Agent (SDK agent)       ║  --max-budget-usd      ║  /permissions UI          ║
╚══════════════════════════╩════════════════════════╩═══════════════════════════╝

MODELS (June 2026):
  claude-opus-4-8   alias: opus    1M ctx   $15/M in · $75/M out · $1.50/M cache
  claude-opus-4-7   —              1M ctx   $15/M in · $75/M out · $1.50/M cache
  claude-opus-4-6   —              200K ctx $15/M in · $75/M out · $1.50/M cache
  claude-sonnet-4-6 alias: sonnet  200K ctx  $3/M in · $15/M out ·  $0.30/M cache
  claude-haiku-4-5  alias: haiku   200K ctx $0.80/M in · $4/M out · $0.08/M cache
```

---

## Getting Started

**New to Claude Code?** Start here → [Quick Start Guide](./quick-start)

## Quick Setup (5 minutes)

The five-step flow from zero to a productive Claude Code session:

```
STEP 1: Install          STEP 2: Auth            STEP 3: First Task
─────────────────        ────────────────        ──────────────────
curl -fsSL               claude                  claude "Explain
  claude.ai/             (browser OAuth          what this codebase
  install.sh | bash      opens automatically)    does"
       │                       │                       │
       ▼                       ▼                       ▼
  Binary placed           ~/.claude/              Claude reads your
  in PATH               auth.json saved          files autonomously
  (v2.1.113+:            session begins          and responds
  no Node.js needed)
       │
       ▼
STEP 4: Project Context         STEP 5: Explore Features
────────────────────────        ──────────────────────────────
cat > CLAUDE.md << 'EOF'        /config   → settings UI
# Project Context               /memory   → view memory files
[tech stack, conventions,       /mcp      → connect MCP servers
 coding standards]              /hooks    → set up automation
EOF                             /skills   → browse skills
                                /agents   → manage subagents
claude "What patterns                     │
should I follow for                       ▼
new features?"              Full productivity in < 1 day
```

```bash
# 1. Install
curl -fsSL https://claude.ai/install.sh | bash

# 2. Authenticate
claude                    # Browser OAuth opens automatically

# 3. Run your first task
claude "Explain what this codebase does and what the main entry point is"

# 4. Set up project context (optional but recommended)
cat > CLAUDE.md << 'EOF'
# Project Context
[Describe your project, tech stack, conventions here]
EOF
claude "What patterns should I follow when adding new features?"

# 5. Explore the slash command UI
claude
> /config          # settings, output styles, model selection
> /memory          # view and edit all memory files
> /hooks           # configure automation hooks
```

→ [Full Quick Start Guide](./quick-start)

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
| [Models, Pricing & Effort](./models-pricing) | All models (Opus 4.8/4.7/4.6, Sonnet 4.6, Haiku 4.5), context windows, effort levels, extended thinking, Fast Mode, Bedrock/Vertex integration, cost optimisation |
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
| [Enterprise Deployment Guide](./enterprise-guide) | Managed settings via MDM/registry/plist, policy federation for 500+ developer orgs, shared MCP server infrastructure, audit logging with OpenTelemetry, cost governance, multi-cloud auth (Bedrock + Vertex WIF), security hardening, rollout playbook |
| [Monorepo & Multi-Service Guide](./monorepo-guide) | Root-level and service-specific CLAUDE.md hierarchy, path-scoped rules for domain isolation, shared MCP servers, parallel worktree development, Agent Teams cross-service coordination, CI/CD matrix builds |
| [Troubleshooting Guide](./troubleshooting) | Authentication failures, MCP connection issues, hook failures, context/compaction problems, sandbox errors, performance debugging, CI/CD pipeline issues, error message dictionary |

---

## Diagrams & Interactive Tools

| Page | What it covers |
|------|---------------|
| [Architecture Diagram](./architecture) | Full lifecycle view: session init → tool loop → compaction → shutdown. All 23 markdown file types with load order. |
| [Precedence Diagram](./precedence) | Visual hierarchy of all configuration layers, conflict resolution, and override rules |
| [Override Test Lab](./override-test-lab) | Interactive sandbox for testing configuration precedence across 12 hands-on scenarios |
| [File Catalog — Interactive](./file-catalog) | Browse and filter all 23 Claude Code file types with token costs, load timing, and usage examples |
| [Models — Comparison & Pricing](./models-diagram) | Interactive model comparison, task decision guide, and real-time pricing calculator with cache ROI for all 5 models |
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
| [Worktrees & Parallel Dev — Diagram](./worktrees-diagram) | Interactive visual of git worktree architecture, parallel session flow, /branch command walkthrough, coordination patterns, and directory layout |
| [Permissions & Security — Diagram](./permissions-diagram) | Visual permission layer pyramid, four permission modes, tool allowlist/blocklist syntax, sandbox architecture (Seatbelt/bubblewrap), and audit logging flow |
| [Enterprise Deployment — Diagram](./enterprise-diagram) | Managed settings hierarchy, auth provider comparison (Direct/Bedrock/Vertex WIF), audit logging destinations, cost governance dashboard, and phased rollout playbook |
| [Monorepo Patterns — Diagram](./monorepo-diagram) | CLAUDE.md hierarchy tree for multi-service repos, path-scoped rules matching visualizer, shared MCP server architecture, Agent Teams cross-service orchestration, and CI/CD matrix build patterns |
| [Slash Commands — Visual Reference](./slash-commands-diagram) | Interactive slash command browser — filter by category (session, memory, config, agents, git, debug), see usage examples, custom command anatomy, and special variable reference |

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
┌─────────────────────────────────────────────────────────────────────┐
│  Enterprise Managed Settings                                         │
│  (server-managed > MDM > file-based > Windows HKCU registry)        │
│  ← cannot be overridden by anything below, including CLI flags      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
                    CLI flags / environment variables
                    (--model, --effort, ANTHROPIC_MODEL, etc.)
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
          .claude/rules/*.md   (path-scoped rules, conditional loading — v2.1.84+)
                               │
                               ▼
          Skills / Output Styles  (loaded on demand via slash commands or /config)
                               │
                               ▼
          Auto-Memory           (~/.claude/projects/<hash>/memory/MEMORY.md)
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
| `/fast` | Toggle Fast Mode — Opus-speed output without downgrading to a smaller model |
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
    │  [UserPromptSubmit hooks may inject context or block the prompt]
    ▼
Claude API ─── full context: CLAUDE.md + rules + tools + conversation history
    │
    ▼  check stop_reason (never parse text — always route on stop_reason field)
stop_reason == "tool_use"?
    │ YES                                    │ NO ("end_turn")
    │                                        │
    │  [PreToolUse hooks may block/modify]   │  [Stop hooks fire]
    ▼                                        │  [Stop hook exit 2 = force continue]
Execute tool (Read/Edit/Bash/Task/...)       ▼
Append tool_result to context        Session complete — control returns to user
    │
    │  [PostToolUse hooks may reject result or inject context]
    │
    └──────────────────────────────────────────────────────► loop back to API
```

**Core rule:** always route on `stop_reason`, never on parsed assistant text.
**Safety valve:** `--max-turns N` sets a hard ceiling on iterations regardless of Claude's intent.

### Models Available (June 2026)

| Model | Alias | Context | Best for | Pricing tier |
|-------|-------|---------|---------|-------------- |
| `claude-opus-4-8` | `opus` | 1M tokens | Frontier reasoning, hardest problems, novel design | $$$$$ |
| `claude-opus-4-7` | — | 1M tokens | Complex reasoning, architecture, research | $$$$$ |
| `claude-opus-4-6` | — | 200K tokens | Heavy analysis, long documents | $$$$ |
| `claude-sonnet-4-6` | `sonnet` | 200K tokens | Balanced quality/speed — **default** | $$$ |
| `claude-haiku-4-5` | `haiku` | 200K tokens | Bulk operations, CI/CD, quick edits | $ |

> 1M token context for Opus 4.7 and Opus 4.8 is at standard pricing with no surcharge (since March 14, 2026).

### Effort Levels

| Level | Extended Thinking | Thinking Budget | Best for | Cost impact |
|-------|------------------|-----------------|---------|------------|
| `low` | None | 0 tokens | Simple edits, formatting, docs | Baseline cost |
| `normal` | Minimal | ~1,000–5,000 tokens | Standard feature work | ~1.1–1.3× baseline |
| `high` | Substantial | ~10,000–20,000 tokens | Complex features, debugging | ~1.5–2× baseline |
| `xhigh` | Maximum | ~32,000+ tokens | Architecture, critical debugging | ~2–4× baseline |

---

## Troubleshooting Quick Reference

For comprehensive diagnostics and error message dictionary, see the **[Troubleshooting Guide](./troubleshooting)**.

Common issues and their solutions:

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Claude ignores CLAUDE.md | File not at project root or encoding issue | Check `git show HEAD:CLAUDE.md`, ensure UTF-8 without BOM |
| High costs unexpectedly | Large CLAUDE.md or low cache hit rate | Run `/context` to see token usage; check cache hit rate with `/usage` |
| Context fills up fast | Path-scoped rules matching too broadly | Tighten `paths:` globs in `.claude/rules/*.md`; move broad rules to CLAUDE.md |
| Skills not loading | Missing SKILL.md or wrong directory | Check `.claude/skills/<name>/SKILL.md` exists; verify frontmatter `name:` field |
| Auto-compaction thrash | Context jumping between unrelated tasks | Use `/clear` between unrelated tasks; enable circuit breaker (v2.1.89+) |
| MCP server not connecting | Transport mismatch or auth failure | Check `.mcp.json` config; run `/mcp` for live connection status and error details |
| Permission denied errors | Tool not in allowlist | Add to `permissions.allow` in `.claude/settings.json`; or use `/permissions` UI |
| Hooks not firing | Wrong event name or JSON syntax error | Validate JSON with `jq`; check hook event spelling — names are case-sensitive |
| Subagent OOM | Too many parallel subagents consuming memory | Reduce concurrency in Task calls; switch to serial Task chaining for large payloads |
| Slow cold starts | Old Node.js-based binary installed | Upgrade to v2.1.113+ (native binary with embedded bfs/ugrep, no Node.js required) |
| Hook fires but does nothing | Exit code 0 with no stdout | Commands must print to stdout to inject context; exit 2 to block/force-continue |
| MCP tool hook not matching | Wrong `mcp_tool` matcher syntax | Format: `"matcher": "server-name/tool-name"` — server name prefix is required |
| `opus` alias resolves wrong | Pinned to old Opus in CI | Use full model IDs (`claude-opus-4-8`) in CI; never pin aliases in CI/CD |
| Context window differs | 200K vs 1M context confusion | Opus 4.7+ and Opus 4.8 have 1M; all other models are 200K |

### Diagnosing Context and Cost Issues

```
Session cost spike? Use this checklist:

1. /context           → see token breakdown (system / conversation / tools)
                         system tokens = CLAUDE.md + rules + tool schemas
                         target: system < 15K tokens
                         
2. /usage             → check cache hit rate (target: >80% on system prompt)
                         if cache hit < 50%, CLAUDE.md may be changing between turns
                         
3. /memory            → audit CLAUDE.md size — keep under 8K tokens (~6,000 words)
                         use @import to load large sections on demand
                         
4. Check rules/       → path globs loading rules for every file?
                         rules with broad globs ("**/*") load on every tool call
                         tighten to specific subdirs or file extensions
                         
5. /compact           → manually compact if auto-compaction hasn't triggered
                         add focus instruction: /compact "keep the auth refactor context"
                         
6. /clear             → start fresh if context is polluted with unrelated work
                         keeps all config (CLAUDE.md, rules, settings) but resets conversation

Prompt caching quick check:
  Good: cache hit rate 80-95%, cost/turn flat or decreasing
  Bad:  cache hit rate <50%, cost/turn growing each turn
  Fix:  stable CLAUDE.md content, avoid mid-session edits to CLAUDE.md
```

### MCP Debugging Flow

```
MCP server not responding?

/mcp                         → lists all configured servers + connection state
   │
   ├── Status: "error"?      → check server logs in ~/.claude/mcp-logs/
   │                            common causes: missing binary, wrong args, port conflict
   │
   ├── Status: "connecting"? → transport mismatch (stdio vs HTTP)?
   │                            stdio servers need "command" + "args" in .mcp.json
   │                            HTTP servers need "url" in .mcp.json
   │
   ├── Status: "connected"   → check tool permissions in settings.json
   │                            tool may be in permissions.deny list
   │
   └── No server listed?     → .mcp.json missing or malformed
                                validate with: cat .mcp.json | jq .

.mcp.json quick-check (stdio transport):
{
  "servers": {
    "my-server": {
      "command": "npx",        ← stdio transport: run a local process
      "args": ["-y", "@my/mcp-server"],
      "env": { "API_KEY": "${MY_API_KEY}" }
    }
  }
}

.mcp.json quick-check (HTTP transport):
{
  "servers": {
    "remote-server": {
      "url": "https://my-mcp-server.example.com/sse",   ← SSE endpoint
      "headers": { "Authorization": "Bearer ${MCP_TOKEN}" }
    }
  }
}

mcp_tool hook (v2.1.118+) — target specific tool calls:
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "my-server/dangerous-tool",   ← "server/tool" format
      "hooks": [{ "type": "command", "command": "echo 'Blocked' && exit 2" }]
    }]
  }
}
```

### Hooks Debugging Flow

```
Hook not firing?

Step 1: Validate JSON syntax
  cat .claude/settings.json | jq .hooks
  → If jq errors: fix JSON syntax (trailing commas, missing quotes)

Step 2: Check event name spelling (case-sensitive)
  Valid event names:
    UserPromptSubmit    PreToolUse     PostToolUse
    Stop                SubagentStop   PreCompact
    PostCompact         SessionStart   SessionEnd

Step 3: Verify matcher pattern
  "matcher": "Edit|Write|MultiEdit"    ← pipe-separated tool names
  "matcher": "Bash"                    ← exact tool name (no wildcards)
  "matcher": "my-mcp/tool-name"        ← mcp_tool format

Step 4: Test hook command manually
  Run the hook command in your shell:
    echo '{"tool_name":"Edit","tool_input":{}}' | my-hook-script.sh
  Should exit 0 to allow, exit 2 to block

Step 5: Check hook output interpretation
  exit 0 + no stdout   → allow (no context injection)
  exit 0 + stdout JSON → allow + inject the JSON as context
  exit 2               → block (for PreToolUse) or force-continue (for Stop)
  exit 1               → error (logged, does not block)
```

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
5. [Enterprise Deployment Guide](./enterprise-guide) — managed settings, org rollout, audit logging, cost governance
6. [Monorepo & Multi-Service Guide](./monorepo-guide) — CLAUDE.md hierarchy, path-scoped rules, shared MCP servers, Agent Teams across services
7. [Elite Training Program](./claude-training) — 8-module curriculum for mastery
8. [Compass Research Notes](./compass-research-notes) — deep dives into internals

### Preparing for CCA-F Exam

1. [Compass Research Notes](./compass-research-notes) — all 5 domains with gap-fill reference
2. [Concept Validation Report](./validation-report) — 270+ claims verified against official docs
3. [Elite Training Program](./claude-training) — structured 8-module curriculum

---

## Version History Quick Reference

The most impactful releases across Claude Code's history, grouped by theme:

### Agentic & Multi-Agent Capabilities

| Version | Release | Impact |
|---------|---------|--------|
| v2.1.32 | Agent Teams (Research Preview) | Peer-to-peer multi-agent sessions; persistent shared context via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |
| v2.1.98 | Monitor tool | Stream stdout from background processes line-by-line — enables real-time CI feedback loops |
| v2.1.89 | Compaction circuit breaker | Prevents runaway auto-compaction thrash; critical for long-running agentic sessions |
| v2.0.64 | Task tool (subagents) | Spawn isolated child Claude sessions from within a parent session for parallel workloads |

### Configuration & Context

| Version | Release | Impact |
|---------|---------|--------|
| v2.1.84 | Rules `paths:` scoping | Load rules conditionally based on file glob — reduces context overhead per task |
| v2.1.120 | `${CLAUDE_EFFORT}` in skills | Skills can branch on session effort level for adaptive behaviour |
| v2.1.119 | `/config` persistence | UI-driven settings saved to `settings.json` — no manual JSON editing required |
| v2.1.116 | `/terminal-setup` | First-class terminal configuration: scroll sensitivity, clipboard, iTerm2 integration |

### Performance & Infrastructure

| Version | Release | Impact |
|---------|---------|--------|
| v2.1.113 | Native binary | Eliminated Node.js dependency; embedded `bfs` (file traversal) and `ugrep` (search); 30–50% faster cold starts |
| v2.1.92 | `--bare` mode | CI-optimised launch: 14% faster startup, skips non-essential initialization |
| v2.1.108 | Cache TTL fix | 1-hour prompt cache TTL restored for `DISABLE_TELEMETRY=1` users — previously broken |

### Cloud & Enterprise Integration

| Version | Release | Impact |
|---------|---------|--------|
| v2.1.121 | Vertex WIF | GCP Workload Identity Federation in CI — no service account key required |
| v2.1.122 | Bedrock service tiers | `default`/`flex`/`priority` tier routing via `CLAUDE_CODE_BEDROCK_SERVICE_TIER` |
| v2.1.117 | Opus 4.7 + 1M context | Opus 4.7 as `xhigh`-effort default; 1M token context window stabilised |
| v2.1.118 | `mcp_tool` hooks | Hook handlers can now target individual MCP tool calls by tool name |

### Hooks & Automation

| Version | Release | Impact |
|---------|---------|--------|
| v2.1.63 | `http` hook handler | POST hook payloads to any webhook URL — enables external audit logging |
| v2.1.118 | `DISABLE_UPDATES` env var | Freeze Claude Code version in managed/enterprise environments |
| v2.1.105 | `/doctor` auto-fix | Health check with `f`-key guided repair; plugin health monitors |
| v2.1.104 | `/team-onboarding` | Generate codebase-aware onboarding guides from project analysis |
