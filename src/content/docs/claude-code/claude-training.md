---
title: Elite Claude Code Mastery — Training Program
sidebar:
  order: 11
---

# Elite Claude Code mastery: a complete AI Engineer training program

**This training program transforms an experienced .NET/Azure tech lead into an elite-level AI engineer** capable of orchestrating multi-agent systems, engineering production-grade RAG architectures, and leveraging Claude Code at its absolute ceiling. The curriculum spans 8 modules progressing from advanced CLI mastery through enterprise architecture patterns, with every technique grounded in the latest 2025-2026 documentation and real-world production implementations.

The program assumes foundational Claude Code familiarity and jumps directly into power-user territory. Each module builds on the previous one, culminating in a capstone that integrates agent teams, MCP servers, hooks, and CI/CD automation into a cohesive enterprise workflow. All code examples and configurations prioritize the .NET/Azure ecosystem.

---

## Module 1: Claude Code CLI — the complete operator's reference

Mastering Claude Code begins with internalizing every keyboard shortcut, slash command, and tool at your disposal. The difference between a competent user and an elite operator is **muscle-memory fluency** with the full control surface.

### Keyboard shortcuts that define your workflow speed

The three shortcuts that matter most are mode cycling, backgrounding, and history search. **Shift+Tab** (or Alt+M) cycles through Normal → Auto-Accept → Plan Mode, letting you fluidly switch between careful supervision, fast editing, and read-only analysis without leaving the terminal. **Ctrl+B** backgrounds a running Bash command — essential when a build takes minutes and you need Claude to continue reasoning. **Ctrl+R** opens reverse history search for recalling previous prompts.

Beyond these, the complete shortcut map includes: **Tab** toggles extended thinking on/off, **Esc×2** (double-tap Escape) opens the rewind menu, **!** at line start enters bash mode, **@** triggers file path autocomplete, and **Ctrl+S** screenshots stats to clipboard. For multiline input, use **Option+Enter** (macOS), **Shift+Enter** (after `/terminal-setup`), or **backslash+Enter** universally. In agent teams mode, **Shift+Up/Down** cycles through teammates.

Claude Code now supports full keybinding customization via `~/.claude/keybindings.json` — run `/keybindings` to create the file. Bindings support key chords (e.g., `ctrl+k ctrl+s`), context-specific mappings, and uppercase letters implying Shift.

### Slash commands: the complete 2026 inventory

The command surface has grown significantly. Beyond the essentials (`/compact`, `/clear`, `/model`, `/cost`), the latest additions include:

**Context management**: `/compact [instructions]` summarizes conversation with optional focus directives — `/compact focus on the authentication logic` preserves only what matters. `/context` displays a colored token-usage grid. `/rewind` rolls back code and conversation to any checkpoint. `/clear` resets everything.

**Configuration**: `/config` opens an interactive settings interface. `/permissions` manages tool allowlists interactively. `/hooks` configures the hooks system. `/mcp` manages MCP server connections and OAuth. `/agents` views and creates custom subagents.

**Session management**: `/resume` opens an interactive session picker with metadata. `/rename` names sessions for retrieval. `/teleport` pulls a remote session (from claude.ai/code) into your terminal. `/desktop` hands off to the Desktop app.

**New in 2025-2026**: `/output-style` configures response formatting (Default, Explanatory, or Learning modes). `/keybindings` opens keybinding configuration. `/bashes` shows running background processes. `/todos` displays current task items. `/changelog` shows release notes. `/stats` shows usage streaks. `/debug` helps troubleshoot sessions. `/branch` creates a worktree branch (renamed from `/fork` in v2.1.49). `/insights` shows session analytics. `/color` customizes terminal color scheme. `/powerup` activates Max-tier upgrades. `/team-onboarding` generates an onboarding doc from CLAUDE.md. `/ultraplan` triggers maximum-depth planning mode. `/reload-plugins` hot-reloads installed plugins without restarting.

**Custom commands** live in `.claude/commands/` (project) or `~/.claude/commands/` (personal). The newer **Skills system** (`.claude/skills/` with `SKILL.md` files) supersedes commands with auto-invocation capabilities, supporting files, and YAML frontmatter for `context: fork`, `agent: Explore`, and `disable-model-invocation`.

### Tool orchestration: built-in tools and when to use each

Claude Code exposes **20+ built-in tools**. The critical rule: **always prefer native tools over shell equivalents**. Use `Read` instead of `cat`, `Edit` instead of `sed`, `Write` instead of `echo >`, `Glob` instead of `find`, `Grep` instead of `grep`.

| Tool | Purpose | Power-user tip |
|------|---------|---------------|
| **Read** | Files, images, PDFs, notebooks | Use `offset` and `limit` for partial reads to conserve context |
| **Edit** | Exact string replacement | `replace_all: true` for global substitutions |
| **MultiEdit** | Batch edits in one file | Reduces round-trips vs. sequential Edit calls |
| **Glob** | File pattern matching | `**/*.cs` patterns for codebase-wide discovery |
| **Grep** | Content search via ripgrep | `output_mode: "files_with_matches"` for fast scanning |
| **WebFetch** | URL content with AI extraction | Include a `prompt` parameter to focus extraction |
| **TodoWrite** | Structured task tracking | Use for 3+ step tasks; tracks `pending/in_progress/completed` |
| **Task** | Spawn sub-agents | `subagent_type: "Explore"` for read-only research |
| **PowerShell** | Windows shell (v2.1.84) | Native PowerShell 5.1/7+ execution on Windows; use instead of Bash on Windows hosts |
| **ExitWorktree** | Leave worktree context (v2.1.72) | Returns agent to main worktree after isolated branch work; used by Agent Teams |
| **CronCreate** | Schedule recurring tasks (v2.1.71) | Registers cron-style jobs; pairs with `CLAUDE_CODE_DISABLE_CRON=1` to suppress |
| **SendMessage** | Peer-to-peer agent messaging | Sends typed inbox messages to a named teammate; enables true Agent Teams coordination |
| **Monitor** | Watch filesystem/processes (v2.1.98) | Background observation without polling Bash; alerts Claude when conditions are met |

### CLAUDE.md configuration hierarchy

Files load in this order (highest to lowest priority): **CLI flags** → `.claude/settings.local.json` → `.claude/settings.json` → `~/.claude/settings.json` → enterprise managed settings. For CLAUDE.md specifically: project root → subdirectories → `~/.claude/CLAUDE.md` (user-level).

The **Auto Memory** feature (2025-2026) writes persistent notes to `~/.claude/projects/<project>/memory/MEMORY.md`. Use `/memory` to edit manually, or tell Claude "remember that we use vertical slice architecture" to save automatically.

**Best practice for .NET projects** — a production CLAUDE.md template:

```markdown
# Project Context
.NET 10 / C# 14 / ASP.NET Core Minimal APIs / EF Core / xUnit

## Commands
- Build: `dotnet build`
- Test: `dotnet test` — ALWAYS run before considering changes complete
- Migrations: `dotnet ef migrations add <Name> --project src/Infrastructure`

## Architecture
Clean Architecture: Api → Application → Domain → Infrastructure
CQRS with MediatR. Vertical slice per feature folder.

## Conventions
- Records for DTOs and value objects
- Nullable reference types enabled everywhere
- All endpoints accept CancellationToken
- Async/await throughout — never .Result or .Wait()
- Return ProblemDetails for errors
```

Keep CLAUDE.md **ruthlessly concise**. Research from HumanLayer shows Claude's system prompt already contains ~50 instructions, and frontier models can follow roughly 150-200. Every instruction in CLAUDE.md must justify its token cost. Never put in CLAUDE.md what a linter or `.editorconfig` can enforce deterministically.

### Plugin System — package and distribute configurations

Introduced in **v2.0.12+**, plugins bundle CLAUDE.md, rules, skills, MCP server configs, and hooks as a single versioned artifact. This is the preferred mechanism for sharing team-wide configurations.

```bash
claude plugin install <name-or-url>   # Install from registry or local path
claude plugin list                    # List all installed plugins
claude plugin enable <name>
claude plugin disable <name>
claude plugin validate <dir>          # Validate plugin structure before publishing
claude plugin update                  # Pull latest versions of all plugins
```

**plugin.json manifest** (`.claude-plugin/plugin.json` at plugin root — only `name` is required):
```json
{
  "name": "dotnet-azure-ops",
  "version": "2.0.0",
  "description": "Build validation and Azure deployment tools for .NET projects",
  "author": { "name": "Platform Team" },
  "userConfig": [
    { "name": "envName", "type": "string", "required": false,
      "description": "Deployment environment (staging/production)" }
  ]
}
```

Plugin directory layout (`skills/`, `agents/`, `hooks/hooks.json`, `monitors/`, `themes/`, `output-styles/`, `bin/`, `.mcp.json`, `settings.json`) is auto-discovered by naming convention — you don't list them in `plugin.json`. Use `${CLAUDE_PLUGIN_ROOT}` for paths that must survive plugin updates and `${CLAUDE_PLUGIN_DATA}` for persistent data that survives updates.

Use `/reload-plugins` inside a session to pick up changes without restarting. For enterprise rollout: drop plugin configs into `.claude/managed-settings.d/` (v2.1.83 — a drop-in directory where separate teams can deploy independent policy fragments, merged alphabetically) and deliver via MDM plist (macOS, `com.anthropic.claudecode` preference domain) or Windows Registry (`HKLM\SOFTWARE\Anthropic\ClaudeCode`, v2.1.51). The `forceRemoteSettingsRefresh` policy (v2.1.92) triggers re-download on session start.

### Context window mastery

**1M token context** is available at standard pricing (no surcharge since March 2026) on `claude-opus-4-7`, `claude-opus-4-6`, and `claude-sonnet-4-6` across all Pro/Max/Team/Enterprise plans. `claude-haiku-4-5` uses 200K. Disable 1M with `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` if needed. Use `/context` to see the colored usage grid and `/usage` to monitor spending (v2.1.118 — merged `/cost` + `/stats`). The formula: `Context = System + CLAUDE.md + Rules + Auto-memory + Skills + History + Tools + MCP schemas`. Reserved buffer: ~33K–45K tokens for system overhead.

**Token budgeting strategies**: Never exceed **75% utilization** — quality degrades noticeably past this point. Use `/compact focus on [topic]` proactively at 70%, not reactively at 95% when auto-compact triggers. Between distinct tasks, prefer `/clear` over `/compact`. Use `--max-turns` and `--max-budget-usd` flags in automation to prevent runaway costs.

**Session management** provides continuity: `claude -c` resumes the most recent conversation; `claude -r` opens the interactive session picker; `--fork-session` branches from a resumed session without modifying the original.

---

## Module 2: Agent teams — orchestrating collaborative AI systems

Agent teams represent **the most significant Claude Code capability of 2026**: fully independent Claude Code instances that communicate peer-to-peer, share task lists, and collaborate on complex problems. Launched February 5, 2026 alongside Opus 4.6 as a "Research Preview."

### Enabling and configuring agent teams

Enable via settings (recommended) or environment variable:

```json
// ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

This unlocks six core tools: **TeamCreate, TaskCreate, TaskUpdate, TaskList, SendMessage, TeamDelete** — plus **ExitWorktree** for teammates to leave worktree contexts and return to the main workspace. Requires Claude Code **v2.1.32+**. The feature works on Pro tier but practically demands Max tier ($100-200/month) or API billing because each teammate is a full ~200K token session — a 5-agent team consumes roughly **1M tokens per session**.

### SubAgent vs. TeammateTool: choosing the right pattern

This is the single most important architectural decision when working with multiple agents:

**SubAgent (Task tool)** spawns fire-and-forget workers. One-way communication only — the subagent works, summarizes results, and returns them to your context window. Low token cost because you get summarized output, not full transcripts. **Use for**: focused research, code review, verification, any task where only the result matters.

**Agent Teams (TeammateTool)** create persistent, peer-to-peer collaborators. Each teammate runs as an independent Claude Code instance with its own context window, loads CLAUDE.md and MCP servers independently, and communicates via a **filesystem-based mailbox system** under `~/.claude/teams/{team-name}/inboxes/`. Teammates message each other directly using `SendMessage`, claim tasks from shared task lists, and persist until explicitly shut down. **Use for**: competing hypotheses, cross-domain coordination, QA swarms, any work requiring real-time collaboration.

The key analogy: **subagents are contractors sent on separate errands; agent teams are a collaborative engineering squad.**

### The Agent Mailbox pattern

Communication uses JSON inbox files on the filesystem. Messages support types including `message`, `broadcast`, `shutdown_request`, `shutdown_response`, and `plan_approval_response`. The lead can message any teammate; teammates can message the lead and each other (true peer-to-peer, not hub-and-spoke). **Atomic writes** via tempfile + os.replace prevent race conditions.

Task coordination uses `TaskCreate`/`TaskUpdate`/`TaskList` with JSON files under `~/.claude/tasks/{team-name}/`. Tasks flow through `pending → in_progress → completed` states. Teammates self-organize by polling `TaskList`, finding unclaimed tasks, and claiming them with file locking to prevent double-claiming.

### Custom agents and specialization

Define reusable agent types in `.claude/agents/` as markdown with YAML frontmatter:

```markdown
---
name: dotnet-security-reviewer
description: Reviews .NET code for security vulnerabilities
tools: Read, Glob, Grep
model: sonnet
effort: high
maxTurns: 30
isolation: worktree   # Run in an isolated git worktree (v2.1.50)
---
You are a .NET security specialist. Analyze code for:
- SQL injection via raw queries or string interpolation
- Missing authorization attributes on endpoints
- Secrets in configuration files
- Insecure deserialization patterns
```

**`isolation: worktree` (v2.1.50):** Runs the agent in its own git worktree, preventing interference with the main workspace. Required for Agent Teams teammates; optional for subagents doing parallel file modifications.

**Monitor tool (v2.1.98):** Stream and filter events from background scripts or other agents in real time without polling Bash. Use in long-running agent sessions to watch for build failures, file changes, or external triggers:

```markdown
# In an agent prompt:
Use the Monitor tool to watch for new files in ./queue/ and process them as they arrive.
```

**`/team-onboarding` command (v2.1.104):** Generate a teammate ramp-up guide from your local Claude Code usage patterns — useful for onboarding new team members or configuring new agent teammates with project context.

**Cost optimization pattern**: Use Opus for the lead (strategic decisions) and Sonnet for teammates (execution work). This cuts costs by 60-70% with minimal quality loss on implementation tasks.

### Current limitations to know

Session resumption does not restore teammates — after `/resume`, spawn new ones. No nested teams (teammates cannot create their own teams). One team per session. The lead role cannot transfer. Delegate mode restrictions pass to teammates, which can cause stalling. These are Research Preview constraints likely to improve.

---

## Module 3: The hooks system — programmatic quality gates

Hooks transform Claude Code from an interactive assistant into a **governed development system** with automated validation, security enforcement, and zero-hallucination verification.

### Hook event types and lifecycle

Claude Code provides **30+ hook events** spanning the full session lifecycle:

| Event | When | Can Block? | Version |
|-------|------|-----------|---------|
| **PreToolUse** | Before any tool executes | Yes — return `deny` to prevent execution | Original |
| **PostToolUse** | After tool completes | Yes — feed errors back to Claude | Original |
| **UserPromptSubmit** | Before Claude processes your input | Yes — exit 2 blocks the prompt | Original |
| **Stop** | When Claude finishes responding | Yes — exit 2 with reason forces continuation | Original |
| **StopFailure** | When the Stop hook itself fails | No — error logged | v2.1.78 |
| **SessionStart** | New/resumed session | No — but can inject context | Original |
| **SessionEnd** | Session terminating | No — async, uses separate timeout env var | Original |
| **Setup** | Triggered by `--maintenance` flag or on-demand setup workflows | No — runs setup scripts | v2.1.10 |
| **Notification** | Permission prompts, idle alerts | No | Original |
| **PreCompact** | Before context compaction (matcher: `manual` or `auto`) | No | Original |
| **PostCompact** | After context compaction completes | No | v2.1.76 |
| **WorktreeCreate** | When a git worktree is created | No — `hookSpecificOutput.worktreePath` | v2.1.50 |
| **WorktreeRemove** | When a git worktree is removed | No | v2.1.50 |
| **CwdChanged** | When the working directory changes | No | v2.1.83 |
| **FileChanged** | When a tracked file is modified on disk | No | v2.1.83 |
| **ConfigChange** | When a settings file changes | No — triggers config reload | v2.1.49 |
| **InstructionsLoaded** | After CLAUDE.md and rules finish loading | No | v2.1.69 |
| **Elicitation** | MCP server requests structured input from user | No — pause for user dialog | v2.1.76 |
| **ElicitationResult** | After user responds to elicitation | No | v2.1.76 |
| **SubagentStop** | When a subagent finishes | Yes | Original |
| **PermissionDenied** | User denies a permission prompt | No — but can log or alert | v2.1.89 |
| **TeammateIdle** | An Agent Teams teammate has no pending tasks | No | Original |
| **TaskCompleted** | An Agent Teams task transitions to completed | No | Original |

### Configuration format and matchers

Configure in `.claude/settings.json` (project) or `~/.claude/settings.json` (user):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ./scripts/security-check.py",
            "timeout": 60
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "./scripts/dotnet-validate.sh" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "agent",
            "prompt": "Verify all unit tests pass. Run the test suite and check results. $ARGUMENTS",
            "timeout": 120
          }
        ]
      }
    ]
  }
}
```

Matchers use regex against tool names: `"Edit|Write"` matches both, `"mcp__github__.*"` matches all GitHub MCP tools, `"Bash"` matches shell commands only. Hooks receive **JSON on stdin** containing `tool_name`, `tool_input`, `session_id`, and `cwd`.

### Three hook types

Beyond standard **command** hooks (shell scripts), Claude Code supports:
- **http** hooks (POST to a webhook/sidecar — v2.1.63): sends JSON payload to a local or remote HTTP endpoint; ideal for audit trails, SIEM integration, and long-running validators that shouldn't block the terminal.
- **prompt** hooks (LLM evaluation using Haiku for fast, cheap assessment)
- **agent** hooks (full subagent verification with tool access, up to 50 turns)

Agent hooks are the most powerful — they can read files, run tests, and make informed decisions about whether Claude should stop or continue.

**Additional hook options:**
- `"once": true` — hook runs once per session then auto-removes itself (v2.1.0); useful for one-time setup validation
- `"if": "Bash(git *)"` — conditional hook using permission rule syntax; hook only fires when the condition matches (v2.1.85)
- `"disableAllHooks": true` in settings — completely disables all hook execution for a session
- `"disableSkillShellExecution": true` (v2.1.91) — prevents skills from executing shell commands, making them read-only
- `CLAUDE_CODE_SESSIONEND_HOOKS_TIMEOUT_MS` env var — override the SessionEnd hook timeout (separate from the 10-minute global timeout)

### Production .NET integration hooks

**Build validation after every C# edit:**
```bash
#!/bin/bash
# .claude/hooks/dotnet-validate.sh
input=$(cat)
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')
if [[ "$file_path" =~ \.cs$ ]]; then
    dotnet format --include "$file_path" 2>/dev/null
    dotnet build --no-restore 2>&1
    if [[ $? -ne 0 ]]; then
        echo "Build failed after editing $file_path" >&2
        exit 2  # Blocking error — fed back to Claude
    fi
fi
```

**Block dangerous Azure CLI operations:**
```bash
#!/bin/bash
input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')
if echo "$command" | grep -qE 'az (group|resource) delete'; then
    echo "BLOCKED: Azure resource deletion requires manual approval" >&2
    exit 2
fi
```

**PreToolUse input modification** — transparently add `--dry-run` to deployment commands:
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "updatedInput": {
      "command": "az deployment group create --what-if ..."
    }
  }
}
```

**Critical implementation detail**: hooks snapshot at session start. Config edits require a session restart or use `/hooks` to reload. All matching hooks run in parallel. Exit code 0 = success, exit code 2 = blocking error (stderr fed to Claude), any other exit = non-blocking warning.

---

## Module 4: MCP servers — extending Claude's tool reach

The Model Context Protocol gives Claude Code access to **any external system** through a standardized JSON-RPC 2.0 interface. With 10,000+ active servers and first-class support across Claude, ChatGPT, Cursor, Gemini, and VS Code, MCP is the universal integration layer for AI tooling.

### Architecture and transport protocols

MCP follows a Host → Client → Server model. Claude Code (host) manages multiple clients, each connecting to independent servers via three transports: **stdio** (local processes, most common), **HTTP** (remote services, recommended for cloud), and **SSE** (deprecated, use HTTP). Servers expose three primitives: **Tools** (functions the model invokes), **Resources** (structured data), and **Prompts** (templates that appear as slash commands).

### Configuration for .NET/Azure ecosystems

Three scopes with clear precedence: **local** (`~/.claude.json` under project path) > **project** (`.mcp.json` at root, version-controlled) > **user** (`~/.claude.json` global).

**Essential MCP servers for .NET/Azure development:**

```json
{
  "mcpServers": {
    "azure-devops": {
      "command": "npx",
      "args": ["-y", "@azure-devops/mcp", "your-org", "-d", "work-items", "repositories", "pipelines"],
      "env": {}
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "database": {
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub", "--dsn", "postgresql://readonly:${DB_PASSWORD}@db.example.com:5432/analytics"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

Environment variable expansion works in `.mcp.json`: `${VAR}` and `${VAR:-default}` syntax in `command`, `args`, `env`, `url`, and `headers` fields.

### Building custom MCP servers in C#/.NET

The official **C#/.NET MCP SDK** (`ModelContextProtocol` NuGet package, maintained with Microsoft) uses attribute-based tool registration:

```csharp
using Microsoft.Extensions.Hosting;
using ModelContextProtocol;

var builder = Host.CreateEmptyApplicationBuilder(settings: null);
builder.Services.AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();
var app = builder.Build();
await app.RunAsync();

[McpServerToolType]
public class BicepTools
{
    [McpServerTool, Description("Validate Bicep template syntax")]
    public static async Task<string> ValidateBicep(string templatePath)
    {
        var process = Process.Start("az", $"bicep build --file {templatePath}");
        await process.WaitForExitAsync();
        return process.ExitCode == 0 ? "Valid" : "Errors found";
    }
}
```

Use `CreateEmptyApplicationBuilder` (not `CreateDefaultBuilder`) for stdio transport to prevent non-JSON-RPC output from corrupting the protocol stream.

### Security considerations

MCP security is non-negotiable in enterprise settings. Real-world incidents in 2025 included SQL injection in Anthropic's own SQLite reference server, a path-traversal exploit on the Smithery platform affecting 3,000+ hosted apps, and a critical OS command-injection (CVE-2025-6514) in `mcp-remote` affecting 437,000+ environments. **Mitigations**: validate and sanitize all inputs, use parameterized queries, run local servers in Docker sandboxes, implement least-privilege tokens, and monitor for tool description changes (rug pull attacks).

**Context window awareness**: each enabled MCP server adds tool definitions to Claude's system prompt. Keep MCP overhead under **20K tokens** — disable unused servers via `/mcp` during sessions.

**ToolSearch auto-deferral (v2.1.7+):** When total MCP tool definitions exceed ~10% of context (~10K tokens), Claude Code automatically defers loading full tool schemas. Only lightweight stubs (name + 1-line description) appear in the context prefix; full schemas are injected into conversation history on demand. This saves **85%+ of tool definition tokens** and actually improves tool selection accuracy. Opt out per-server with `"enableToolSearch": false` in `.mcp.json`.

**Tool description caps (v2.1.84):** Tool descriptions are limited to 2KB to prevent OpenAPI-generated servers from bloating context. Long descriptions are truncated automatically.

**MCP Elicitation (v2.1.76):** MCP servers can request structured input from the user mid-task via an interactive dialog. Claude Code pauses and presents the elicitation form to the user. The `Elicitation` hook fires before the dialog, `ElicitationResult` after.

**Large tool results (v2.1.91):** MCP tools can return up to 500K characters by including `_meta["anthropic/maxResultSizeChars"]` in their response. Default cap is 25K tokens.

**MCP OAuth (v2.1.85):** HTTP MCP servers support OAuth via RFC 9728 discovery. Manual URL paste fallback available for environments where browser redirect fails (v2.1.63).

**MCP headers (v2.1.85):** Use `headersHelper` scripts in `.mcp.json` to generate dynamic auth headers. `CLAUDE_CODE_MCP_SERVER_NAME` and `CLAUDE_CODE_MCP_SERVER_URL` env vars are injected into helper scripts.

---

## Module 5: Advanced prompt engineering — from practitioner to architect

The shift from "prompt engineering" to **context engineering** is the defining evolution of 2025-2026. Anthropic now frames the discipline as: "What configuration of context is most likely to generate the desired behavior?" The goal is finding the **smallest possible set of high-signal tokens** that maximize output quality.

### XML tagging for structured prompts

Claude has been fine-tuned to pay special attention to XML tag structure. While Anthropic notes modern models understand structure without XML, tags remain essential for complex prompts, agentic workflows, and parseable outputs. Anthropic uses XML in their own system prompts:

```xml
<instructions>Analyze the codebase for security vulnerabilities</instructions>
<context>This is a .NET 10 API using EF Core with SQL Server</context>
<constraints>
- Only report confirmed vulnerabilities, not theoretical risks
- Include severity rating (Critical/High/Medium/Low)
- Provide specific file and line references
</constraints>
<output_format>
Return findings as a structured list with: file, line, severity, description, fix
</output_format>
```

**Guided Chain-of-Thought** dramatically improves complex reasoning. The structured pattern — `<thinking>` for reasoning, `<answer>` for output — lets Claude show work while keeping responses clean. AWS prescriptive guidance confirms this architecture improves both accuracy and injection resistance for RAG systems.

### Extended thinking triggers in Claude Code

**This is a Claude Code CLI-exclusive feature.** Trigger words map to specific thinking token budgets:

| Trigger | Budget | Use when |
|---------|--------|----------|
| "think" | ~4,000 tokens | Routine tasks, basic reasoning |
| "think hard" / "megathink" | ~10,000 tokens | Design work, caching strategy |
| "think harder" / "ultrathink" | ~31,999 tokens | Architecture decisions, complex debugging |

**Important Opus 4.6 update**: The latest model uses **adaptive reasoning** where Claude dynamically allocates thinking depth. The `/effort` level setting (low, medium, high) controls this — the `max` tier was removed in **v2.1.72**. Default effort is `high` for API/Bedrock/Vertex/Team/Enterprise tiers (v2.1.94). The trigger word system ("think hard", "ultrathink") is being deprecated in favor of `/effort`. For older models, the fixed-budget system still applies. Cost range: ~$0.06/task (basic) to ~$0.48/task (ultrathink). Reserve high-effort for decisions where the cost of error exceeds $5 or time saved exceeds 1 hour.

### Multi-shot anchoring and meta-prompting

Include **3-5 diverse, relevant examples** wrapped in `<examples>` tags. With prompt caching (90% cost reduction on cached reads), you can now affordably include 20+ high-quality examples — previously cost-prohibitive. Each example should demonstrate a different edge case or challenge pattern.

**Meta-prompting** uses Claude itself to generate, audit, and refine prompts. Anthropic's Console includes a built-in Prompt Generator and Prompt Improver. The practical pattern: write a rough prompt → ask Claude to analyze it for ambiguities, missing context, and edge cases → iterate until robust. The **Evaluator-Optimizer loop** takes this further: an LLM-as-Judge assesses output quality and generates feedback that feeds into iterative prompt optimization.

### Agentic prompt design patterns

The six core patterns for agentic systems, ordered by complexity:

1. **Single agent tool loop** (ReAct): LLM adaptively calls tools in a while-loop. Thought → Action → Observation → repeat.
2. **Prompt chaining**: Sequential subtask processing with explicit handoffs between focused prompts.
3. **Routing**: LLM classifies input and directs to specialized handlers.
4. **Parallelization**: Multiple LLMs work simultaneously on independent aspects.
5. **Orchestrator-Workers**: Lead agent delegates to specialized sub-agents (Claude Code's native pattern).
6. **Evaluator-Optimizer**: Generator + evaluator iterate until quality threshold met (max 3-5 iterations).

Anthropic's Applied AI team recommends writing prompts at the **"right altitude"** — heuristics and principles rather than brittle if-then rules. Curate minimal viable tool sets where every tool justifies its existence. Design tools that are self-contained, non-overlapping, and purpose-specific.

### The Spec-Driven Development workflow

The dominant framework for complex Claude Code work:

```
1. EXPLORE → "Read the codebase structure. Don't write code yet."
2. PLAN → "Ultrathink. Analyze the problem and propose a plan. Don't code."
3. CODE → Implement based on confirmed plan. Tests first.
4. COMMIT → "Commit with a descriptive message and create PR."
```

Save plans as `PLAN.md` files. Use Plan Mode (`Shift+Tab` twice or `--permission-mode plan`) for read-only analysis. This workflow prevents the most common failure mode: Claude jumping into implementation before understanding the problem space.

---

## Module 6: RAG systems and enterprise AI architecture

RAG has evolved from a simple retrieve-then-generate pipeline into a family of sophisticated architectures. The right choice depends on query complexity, corpus size, and accuracy requirements.

### The 2025-2026 RAG taxonomy

**Naive RAG** (query → embed → search → generate) remains viable for simple Q&A over small corpora. **Advanced RAG** adds pre-retrieval query rewriting, post-retrieval re-ranking with cross-encoder models, and context compression — this is the most commonly deployed enterprise pattern. **Modular RAG** treats each component as an interchangeable microservice with declarative configuration. **Agentic RAG** deploys autonomous reasoning agents that orchestrate retrieval, decide which sources to query, and iteratively refine results — significantly more complex but essential for multi-hop reasoning.

**GraphRAG** (Microsoft Research) uses LLM-generated knowledge graphs to dramatically improve retrieval for relationship-heavy domains. GraphRAG 2.0 (October 2025) achieved **92% accuracy** on complex technical documents with a new neural entity extraction model. Best for legal, healthcare, financial, and scientific domains where entities and relationships drive insight.

The decision framework: Simple queries/small corpus → Naive RAG. Enterprise Q&A/accuracy-critical → Advanced RAG. Multiple evolving data sources → Modular RAG. Complex multi-step reasoning → Agentic RAG. Relationship-heavy data → GraphRAG.

### Vector database selection for enterprise

For .NET/Azure ecosystems, **Azure AI Search** is the default choice — native integration with Azure OpenAI, Semantic Kernel, and built-in hybrid search with Reciprocal Rank Fusion. For self-hosted requirements, **Qdrant** (Rust-based, fastest metadata filtering) and **Milvus** (billion-scale with GPU acceleration) lead. **ChromaDB** is strictly for prototyping — not enterprise-ready.

**Hybrid search** (combining vector similarity with BM25 keyword matching) consistently outperforms either method alone by **20-30%** in recall benchmarks. Vector search misses product IDs, proper nouns, and exact codes; BM25 misses synonyms and semantic intent. Azure AI Search's built-in RRF fusion handles this natively.

### Production RAG on Azure with Semantic Kernel

The reference architecture for .NET:

```csharp
// Semantic Kernel RAG pipeline
var builder = Kernel.CreateBuilder();
builder.AddAzureOpenAIChatCompletion(deployment, endpoint, apiKey);
var kernel = builder.Build();

// Azure AI Search integration
var embeddingGenerator = new AzureOpenAIClient(
    new Uri(endpoint), new AzureCliCredential())
    .GetEmbeddingClient("text-embedding-3-large")
    .AsIEmbeddingGenerator(1536);

var vectorStore = new AzureAISearchVectorStore(searchClient);
```

Microsoft's **Agentic Retrieval** (preview) is the recommended approach for new projects: the LLM decomposes complex queries into focused subqueries, executes them in parallel across multiple indexes, and uses conversation history for context-aware planning. Classic RAG with hybrid search remains the GA option for production-critical applications.

### Security hardening for RAG

Implement defense in depth: **Input Layer** (sanitization, malicious encoding blocking) → **Prompt Layer** (structured templates with trust boundaries separating system instructions from user data) → **Retrieval Layer** (RBAC on vector stores, vetted documents only) → **Model Layer** (resource constraints, monitoring) → **Output Layer** (PII scanning, hallucination checks). The `<thinking>` + `<answer>` tag architecture improves both accuracy and injection resistance by separating reasoning from user-facing output.

---

## Module 7: Production workflows and CI/CD integration

### The Battle Plan protocol

For complex tasks, **always plan before implementing**. The protocol: ask for a plan → tell Claude to pause → review and refine → approve implementation. Use Plan Mode (`Shift+Tab` twice) for read-only analysis where Claude can Read, Glob, Grep, and WebFetch but cannot Edit, Write, or run Bash.

The advanced 4-phase approach: **Research → Plan → Implement → Validate**. Never exceed 60% context in any phase. Clear context between phases. Save everything to a `thoughts/` directory. This prevents the most expensive failure mode: Claude implementing the wrong solution in a context-exhausted session.

### Preventing context dilution

Context dilution is the silent killer of long Claude Code sessions. **Five proven strategies**:

1. **Put persistent rules in CLAUDE.md**, not conversation — instructions from early turns get lost during compaction.
2. **Use subagents for context isolation** — each subagent gets a fresh 200K context window. Complex research generates thousands of intermediate tokens in the subagent's context but returns only a condensed summary to yours.
3. **Document & Clear method** — have Claude dump its plan to a `.md` file, `/clear` completely, start a fresh session reading the file.
4. **Proactive compaction at 70%** — don't wait for auto-compact at 98%. Use `/compact focus on [specific topic]` to control what's preserved.
5. **Git worktrees for parallel isolation** — `git worktree add ../feature-branch` with separate Claude Code instances.

### CI/CD integration patterns

**GitHub Actions** with the official `anthropics/claude-code-action@v1`:

```yaml
name: Claude PR Review
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic-api-key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            SECURITY REVIEW for .NET:
            - Check for SQL injection via raw queries
            - Verify authorization on all endpoints
            - Check secrets handling
            Flag issues as 🚨 SECURITY with severity.
```

**Azure DevOps** integration uses CLI mode in pipeline YAML:

```yaml
steps:
  - script: npm install -g @anthropic-ai/claude-code
  - script: |
      claude -p "Review code changes for security and quality" \
        --output-format json \
        --allowedTools "Read,Grep,Glob" \
        --permission-mode plan
    env:
      ANTHROPIC_API_KEY: $(ANTHROPIC_API_KEY)
```

The **Claude Agent SDK** (TypeScript: `@anthropic-ai/claude-agent-sdk`) enables fully programmatic usage with structured JSON output, configurable tool sets, and permission modes — essential for building custom automation pipelines.

### .NET-specific workflow optimization

Install the **dotnet-skills** package (github.com/Aaronontheweb/dotnet-skills) — 30 skills and 5 specialized agents including `modern-csharp-coding-standards`, `efcore-patterns`, `csharp-concurrency-patterns`, and agents for `dotnet-concurrency-specialist` and `dotnet-performance-analyst`. Use modular rules in `.claude/rules/` with glob patterns:

```markdown
<!-- .claude/rules/api/security.md -->
---
globs: ["src/Api/**/*.cs", "src/**/Controllers/**/*.cs"]
---
# API Security Rules
- Always validate JWT tokens
- Rate limiting on all endpoints
- CORS must be restrictive
```

---

## Module 8: Architecture patterns for AI-augmented enterprise development

### Multi-agent QA: the Council of Sub-Agents pattern

The most compelling production implementation comes from OpenObserve's 6-phase pipeline: **Analyst** (feature analysis) → **Architect** (test planning) → **Engineer** (Playwright code generation) → **Sentinel** (quality gate that blocks on critical findings) → **Healer** (iterative test fixing, up to 5 cycles) → **Scribe** (documentation). Results: feature analysis dropped from **45-60 minutes to 5-10 minutes**, flaky tests reduced **85%**, and test coverage grew **84%**. The entire system lives as version-controlled markdown in `.claude/commands/`.

The critical lesson: **specialization over generalization**. Early iterations with a single "super agent" failed. Bounded agents with clear responsibilities consistently outperform monolithic approaches.

### Self-healing Playwright test generation

Playwright now includes three built-in agents: **Planner** (converts goals to Markdown plans), **Generator** (translates to TypeScript tests), and **Healer** (analyzes failure traces and patches broken selectors/assertions automatically). The production pattern combines structured locators with fallback arrays, wrapper helpers that cycle through alternatives, and AI-powered recovery that captures DOM snapshots and generates new selectors when all fallbacks fail.

### Agentic CI/CD — the AI/CD paradigm

The industry is shifting from automated steps to **augmented decisions**. Elastic's production implementation uses Claude Code agents that automatically propose fixes when dependency updates break builds, with CLAUDE.md files teaching agents team-specific practices. Key components: **Code Analysis Agents** (risk detection before human review), **Test Selection Agents** (AI-targeted testing instead of full regression), **Deployment Decision Agents** (real-time metric evaluation for canary releases), and **Post-Release Learning Agents** (telemetry-driven anomaly detection).

### Multi-agent orchestration framework selection

| Scenario | Recommended framework |
|----------|---------------------|
| Complex stateful workflows | **LangGraph** — graph-based state machine with HITL interrupts |
| Rapid prototyping | **CrewAI** — role-based, intuitive delegation |
| Enterprise .NET/Azure | **Semantic Kernel + Microsoft Agent Framework** — native DI, Durable Functions hosting |
| Dialogue-intensive applications | **AutoGen** — conversational model, enterprise error handling |

For the .NET/Azure stack specifically: **Azure Durable Functions** with the Microsoft Agent Framework provides stateful, serverless agent hosting with automatic session management, failure recovery, and auto-scaling. **MCP servers on Azure Functions** (GA January 2026) with native OBO authentication via Entra ID provide the integration layer.

### Insurance domain AI applications

AI has compressed **underwriting decisions from 3-5 days to 12.4 minutes** for standard policies with 99.3% accuracy. Claims document processing has moved from days to minutes through LLM-powered OCR, entity extraction, and summarization. By late 2026, analysts project **35%+ of insurers** will deploy AI agents across 3+ core functions. The regulatory landscape is active: NAIC Model Bulletin adopted by 23 states, EU AI Act requiring documentation and audits for 2026, and the NAIC AI Systems Evaluation Tool providing standardized governance frameworks.

### Human-in-the-loop is not optional

Five core HITL patterns from Google Cloud's architecture guidance: **Approval Gates** (pause at checkpoints for human review), **Escalation on Failure** (auto-escalate to human on stuck/failed agents), **Confidence-Based Routing** (below-threshold confidence → human), **Asynchronous Oversight** (agent acts, human reviews afterward), and **Evaluator/Critic Loops** (generator + critic iterate, human intervenes on persistent failures). In Claude Code, implement these through hooks (Stop hooks that verify completion criteria), permission modes (Plan Mode for read-only analysis requiring approval), and the Agent SDK's structured output for downstream human review workflows.

---

## Conclusion: from operator to architect

This program traces a deliberate arc from mastering Claude Code's full control surface through designing enterprise-grade AI systems. The key insight across all eight modules is that **constraint drives quality**: concise CLAUDE.md files outperform verbose ones, bounded agents outperform monolithic ones, proactive context management outperforms reactive compaction, and explicit planning phases prevent the most expensive failure mode — implementing the wrong solution.

Three capabilities distinguish elite-level practitioners. First, **architectural thinking about context** — treating the up-to-1M token context window as a strategic resource, using subagents for isolation, hooks for verification, and MCP servers for reach. Second, **multi-agent orchestration literacy** — knowing when a SubAgent suffices versus when Agent Teams are worth the 5x token cost, and designing agent specializations that produce emergent quality. Third, **production hardening instincts** — security scanning hooks on every tool use, hybrid search in RAG pipelines, HITL gates on destructive operations, and observability via OpenTelemetry from day one.

The field is moving from prescriptive prompting toward lightweight heuristic guidance and autonomous context management. Opus 4.7's adaptive reasoning supersedes fixed thinking budgets; `xhigh` effort unlocks its full reasoning depth. Agent teams will mature from Research Preview to production-grade. The practitioners who thrive will be those who internalize the principles behind the tools, not just the current syntax — because the syntax will change quarterly, but the architecture patterns endure.