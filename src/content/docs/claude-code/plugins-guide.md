---
title: Plugins — Complete Reference
description: >
  Complete guide to Claude Code plugins — plugin architecture, directory structure, 
  all plugin component types (commands, agents, skills, output styles, monitors, themes, 
  bin executables, hooks, MCP servers, LSP servers), the plugin manifest (plugin.json),
  plugin-scoped environment variables, installation scopes, building and distributing plugins,
  userConfig for plugin settings, and security model. Claude Code v2.1.126 (May 2026).
sidebar:
  order: 13
  label: Plugins
lastUpdated: 2026-05-09
---

# Plugins — Complete Reference

> **Version:** v2.1.126 (May 9, 2026) · Plugin system introduced in v2.0.64; monitors added in v2.1.105.

Plugins are the **largest unit of Claude Code extension**. A single plugin can bundle commands, agents, skills, output styles, monitors, themes, bin executables, hooks, MCP servers, and LSP servers — all automatically namespaced under the plugin's name. Publish once to npm and any developer can install your entire integration in one command.

**What a plugin can bundle:**

| Component | What it adds |
|-----------|-------------|
| Commands | Slash commands invoked as `/plugin-name:command-name` |
| Agents | Sub-agents invoked as `plugin-name:agent-name` |
| Skills | Auto-invoked instructions matched by description |
| Output Styles | Appear in `/config` → Output Style menu |
| Monitors | Background processes that stream context to Claude |
| Themes | Appear in `/theme`; user-editable after copy |
| Bin Executables | Scripts added to Bash tool PATH |
| Hooks | Lifecycle event handlers |
| MCP Servers | Start automatically with the session |
| LSP Servers | Language server integrations |
| Default Settings | Default `agent` and `subagentStatusLine` overrides |

---

## 1. What Are Plugins

A plugin is a **self-contained, versioned extension package** for Claude Code. Where individual configuration files (`.claude/commands/`, `~/.claude/skills/`, etc.) live scattered across your filesystem, a plugin collocates all related components into a single directory that travels as one unit — one install, one update, one uninstall.

### Namespacing

Every component a plugin contributes is automatically namespaced under the plugin's declared `name`. If your plugin is named `deploy-helper`:

- Command `release.md` → `/deploy-helper:release`
- Agent `rollback.md` → `deploy-helper:rollback`
- Skill `SKILL.md` in `skills/deploy/` → `/deploy-helper:deploy` (auto-invoked)
- Output style `concise.md` → appears as `deploy-helper: concise` in the menu

Namespacing prevents collisions between plugins and between plugins and user-defined components. You can have both a personal command `/release` and a plugin command `/deploy-helper:release` with no conflict.

### Distribution

Plugins are distributed as **npm packages**. The `plugin.json` manifest lives inside the package so Claude Code can discover all components. A plugin package can be:

- Published to the public npm registry (`npm publish`)
- Published to a private npm registry or GitHub Packages
- Installed from a local path (`/home/user/my-plugin`) during development
- Installed from a git URL (`github:org/repo`)

---

## 2. Plugin Architecture

### Directory Layout

A fully-featured plugin looks like this:

```
my-plugin/
├── plugin.json                  ← REQUIRED: plugin manifest
│
├── commands/                    ← slash commands
│   ├── release.md
│   └── rollback.md
│
├── agents/                      ← sub-agent definitions
│   └── deployment-agent.md
│
├── skills/                      ← auto-invoked skill instructions
│   ├── deploy/
│   │   └── SKILL.md
│   └── monitor/
│       └── SKILL.md
│
├── output-styles/               ← output style definitions
│   └── concise.md
│
├── monitors/                    ← background process monitors
│   └── monitors.json
│
├── themes/                      ← UI color themes
│   ├── dark-deploy.json
│   └── light-deploy.json
│
├── bin/                         ← executable scripts added to PATH
│   ├── deploy-check
│   └── rollback-safe
│
├── hooks/                       ← lifecycle event hooks
│   └── hooks.json
│
├── .mcp.json                    ← MCP server definitions
├── .lsp.json                    ← LSP server definitions
└── settings.json                ← default settings overrides
```

### Component Discovery

When Claude Code loads a plugin it reads `plugin.json` to discover all declared components. The manifest is the single source of truth — files that exist in component directories but are not referenced in (or implied by) the manifest may be ignored.

### Plugin Root vs Plugin Data

Claude Code exposes two path variables for plugins:

```
${CLAUDE_PLUGIN_ROOT}   →  the installed package directory (READ-ONLY)
${CLAUDE_PLUGIN_DATA}   →  persistent writable data directory (WRITABLE)
```

- `${CLAUDE_PLUGIN_ROOT}` changes with every plugin update (the new version unpacks to a new path)
- `${CLAUDE_PLUGIN_DATA}` is stable — it persists across updates, uninstalls, and reinstalls

> **Important:** Never write to `${CLAUDE_PLUGIN_ROOT}`. That directory is managed by Claude Code's package manager. Writes there will be lost on the next `claude plugin update`. Store all mutable state — logs, caches, user data, generated files — in `${CLAUDE_PLUGIN_DATA}`.

---

## 3. Plugin Installation

### Installation Scopes

Plugins can be installed at four scopes, mirroring Claude Code's settings hierarchy:

| Scope | Who it affects | Config location | Typical use |
|-------|---------------|-----------------|-------------|
| `user` | Current OS user, all projects | `~/.claude/settings.json` | Personal productivity plugins |
| `project` | Everyone using the `.claude/` directory | `.claude/settings.json` | Team-shared plugins |
| `local` | Current machine only, current project | `.claude/settings.local.json` | Machine-specific, not committed |
| `managed` | Organization-enforced | Managed policy file | Enterprise/compliance |

### Installing Plugins

```bash
# Install from npm (user scope by default)
claude plugin install @myorg/deploy-helper

# Install at project scope (adds to .claude/settings.json)
claude plugin install @myorg/deploy-helper --scope project

# Install at local scope (not committed to git)
claude plugin install @myorg/deploy-helper --scope local

# Install from local path (development)
claude plugin install /home/user/dev/deploy-helper

# Install from a git URL
claude plugin install github:myorg/deploy-helper

# Install a specific version
claude plugin install @myorg/deploy-helper@2.3.1
```

### Managing Plugins

```bash
# List all installed plugins and their scopes
claude plugin list

# Show details about a specific plugin
claude plugin info @myorg/deploy-helper

# Update a plugin to latest
claude plugin update @myorg/deploy-helper

# Update all plugins
claude plugin update

# Remove a plugin
claude plugin remove @myorg/deploy-helper

# Remove from a specific scope
claude plugin remove @myorg/deploy-helper --scope project
```

### Config Format in settings.json

Plugins are stored in `settings.json` under the `plugins` key:

```json
{
  "plugins": {
    "@myorg/deploy-helper": {
      "scope": "project",
      "version": "2.3.1",
      "config": {
        "deployTarget": "production",
        "slackWebhook": "https://hooks.slack.com/..."
      }
    },
    "/home/user/dev/my-local-plugin": {
      "scope": "local",
      "version": "local"
    }
  }
}
```

The `config` key holds user configuration values for that plugin (see [userConfig](#5-userconfig--plugin-configuration)).

---

## 4. Plugin Manifest (plugin.json)

The `plugin.json` file is the heart of every plugin. It declares every component the plugin contributes and all metadata needed for installation and display.

### Complete Annotated Example

```json
{
  // ── Identity ───────────────────────────────────────────────
  "name": "deploy-helper",
  // Unique name. Used as the namespace prefix for all components.
  // Must match npm package name (without @scope) or be unique for local plugins.

  "version": "2.3.1",
  // Semver version string.

  "description": "Deployment automation for Claude Code — release, rollback, monitoring.",
  // Short description shown in `claude plugin list` and the plugin marketplace.

  "author": "Acme Corp <tools@acme.com>",
  // Author name and optional email.

  "homepage": "https://github.com/acme/deploy-helper",
  // Link shown in plugin info and marketplace listing.

  "repository": {
    "type": "git",
    "url": "https://github.com/acme/deploy-helper.git"
  },
  // Repository metadata (same shape as npm's repository field).

  "license": "MIT",
  // SPDX license identifier.

  "keywords": ["deployment", "release", "rollback", "CI/CD"],
  // Searchable keywords for the plugin marketplace.

  // ── Component Declarations ──────────────────────────────────

  "skillsPath": "skills",
  // Directory containing skill subdirectories (each with a SKILL.md).
  // Default: "skills". Each subdirectory becomes a namespaced skill.

  "commands": "commands",
  // Directory containing command markdown files.
  // Default: "commands". Set to null to disable.

  "agents": "agents",
  // Directory containing agent markdown files.
  // Default: "agents". Set to null to disable.

  "hooks": "hooks/hooks.json",
  // Path to the hooks definition file.
  // Relative to plugin root.

  "mcpServers": ".mcp.json",
  // Path to MCP server definitions file.
  // Relative to plugin root.

  "outputStyles": "output-styles",
  // Directory containing output style markdown files.

  "themes": "themes",
  // Directory containing theme JSON files.

  "lspServers": ".lsp.json",
  // Path to LSP server definitions file.

  "monitors": "monitors/monitors.json",
  // Path to monitors definition file. Requires v2.1.105+.

  // ── Dependencies ────────────────────────────────────────────

  "dependencies": {
    "node": ">=20.0.0",
    // Runtime dependency: any Node.js 20+

    "@acme/shared-lib": "1.2.x",
    // npm package pinned to 1.2.x
    // String value = version range (semver)
    // Object value = pinned install (see section 11)

    "jq": "*"
    // System binary dependency — Claude Code checks PATH
  },

  // ── User Configuration ──────────────────────────────────────

  "userConfig": {
    "deployTarget": {
      "description": "Deployment environment (staging, production, etc.)",
      "type": "string",
      "default": "staging"
    },
    "slackWebhook": {
      "description": "Slack webhook URL for deployment notifications",
      "type": "string",
      "sensitive": true
    },
    "verboseLogging": {
      "description": "Enable verbose output from deploy scripts",
      "type": "boolean",
      "default": false
    }
  }
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Plugin namespace identifier |
| `version` | string | Yes | Semver version |
| `description` | string | Yes | Short description |
| `author` | string | No | Author name/email |
| `homepage` | string | No | Plugin website URL |
| `repository` | object | No | `{type, url}` repo info |
| `license` | string | No | SPDX license string |
| `keywords` | string[] | No | Marketplace search terms |
| `skillsPath` | string | No | Skills directory (default: `"skills"`) |
| `commands` | string\|null | No | Commands directory (default: `"commands"`) |
| `agents` | string\|null | No | Agents directory (default: `"agents"`) |
| `hooks` | string | No | Path to `hooks.json` |
| `mcpServers` | string | No | Path to `.mcp.json` |
| `outputStyles` | string | No | Output styles directory |
| `themes` | string | No | Themes directory |
| `lspServers` | string | No | Path to `.lsp.json` |
| `monitors` | string | No | Path to `monitors.json` (v2.1.105+) |
| `dependencies` | object | No | Runtime dependencies |
| `userConfig` | object | No | User-configurable settings declarations |

---

## 5. userConfig — Plugin Configuration

`userConfig` lets plugin authors declare settings that users can configure without editing the plugin source. It is the plugin system's answer to the question: "how do I let users supply API keys, environment names, or feature flags?"

### Declaring Settings

In `plugin.json`, each key under `userConfig` is a setting declaration:

```json
{
  "userConfig": {
    "apiKey": {
      "description": "API key for the deployment service",
      "type": "string",
      "sensitive": true
    },
    "region": {
      "description": "Cloud region for deployments (us-east-1, eu-west-1, etc.)",
      "type": "string",
      "default": "us-east-1"
    },
    "dryRun": {
      "description": "Run deployments in dry-run mode without applying changes",
      "type": "boolean",
      "default": false
    }
  }
}
```

**Setting field reference:**

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Shown to user when setting the value |
| `type` | `"string"` \| `"boolean"` | Value type |
| `default` | string \| boolean | Default if user has not set a value |
| `sensitive` | boolean | If `true`, stored in OS keychain, never in plaintext |

### Storage

- **Non-sensitive settings** are stored in the appropriate `settings.json` under `plugins["plugin-name"].config`
- **Sensitive settings** are stored in the OS keychain (macOS Keychain, Windows Credential Manager, Linux Secret Service) and never appear in any file on disk

### Setting Values

Users set plugin config values via the CLI:

```bash
# Set a string value
claude plugin config set deploy-helper apiKey sk-abc123

# Set a boolean value
claude plugin config set deploy-helper dryRun true

# View current config for a plugin
claude plugin config list deploy-helper

# Reset a value to its default
claude plugin config unset deploy-helper dryRun
```

The `claude plugin config set` command for sensitive keys stores the value in the keychain automatically — the user never needs to know where it is stored.

### Accessing Config in Hooks

In `hooks/hooks.json`, reference user config with the `${user_config.KEY}` syntax:

```json
{
  "hooks": [
    {
      "event": "PostToolUse",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/notify-slack --webhook ${user_config.slackWebhook} --env ${user_config.deployTarget}"
    }
  ]
}
```

Claude Code performs variable substitution before executing the command. Sensitive values are injected securely — they never appear in process listings or logs.

### Accessing Config in Subprocesses

All plugin config values are also exposed as environment variables in subprocesses spawned by the plugin's hooks, bin scripts, and monitors:

```
CLAUDE_PLUGIN_OPTION_APIKAY=sk-abc123
CLAUDE_PLUGIN_OPTION_REGION=us-east-1
CLAUDE_PLUGIN_OPTION_DRYRUN=false
```

The convention is `CLAUDE_PLUGIN_OPTION_` + uppercase key name.

```bash
#!/usr/bin/env bash
# bin/deploy-check — example bin script using plugin config
REGION="${CLAUDE_PLUGIN_OPTION_REGION:-us-east-1}"
DRY_RUN="${CLAUDE_PLUGIN_OPTION_DRYRUN:-false}"

echo "Checking deployment in region: $REGION"
if [ "$DRY_RUN" = "true" ]; then
  echo "[DRY RUN] Would deploy here"
else
  ./deploy.sh --region "$REGION"
fi
```

---

## 6. Plugin Environment Variables

Claude Code provides two environment variables that are always available inside plugin hooks, monitors, bin scripts, and MCP server launch commands:

### `${CLAUDE_PLUGIN_ROOT}`

The **absolute path to the installed plugin package directory**.

```
~/.claude/plugins/node_modules/@myorg/deploy-helper/
```

- Points to the unpacked plugin package
- **Changes with every `claude plugin update`** (new version unpacks to the same location but with new contents — treat the old root as gone)
- Use for: reading static files, referencing bundled scripts, loading the hooks themselves

```json
{
  "command": "${CLAUDE_PLUGIN_ROOT}/bin/deploy-check --config ${CLAUDE_PLUGIN_ROOT}/config/defaults.json"
}
```

### `${CLAUDE_PLUGIN_DATA}`

The **absolute path to the plugin's persistent data directory**.

```
~/.claude/plugin-data/deploy-helper/
```

- Created automatically on first plugin install; never deleted on update
- **Survives updates, reinstalls, and version changes**
- Use for: caches, logs, generated artifacts, user-specific data, SQLite databases

```json
{
  "command": "${CLAUDE_PLUGIN_ROOT}/bin/deploy-check --log ${CLAUDE_PLUGIN_DATA}/deploy.log --cache ${CLAUDE_PLUGIN_DATA}/cache/"
}
```

### Quick Reference

```
${CLAUDE_PLUGIN_ROOT}   Read-only.  Changes on update.  Static plugin files.
${CLAUDE_PLUGIN_DATA}   Writable.   Stable forever.     Mutable state.
```

> **Important:** Never write files to `${CLAUDE_PLUGIN_ROOT}`. The plugin package directory is managed by Claude Code — it may be replaced, moved, or deleted during update operations. Any writes there will be silently lost.

---

## 7. Plugin Component Types

### 7.1 Commands (`commands/`)

Plugin commands are slash commands, identical in format to project commands (`.claude/commands/*.md`) but automatically namespaced.

**Format:** Standard markdown with optional YAML frontmatter.

```markdown
---
description: Trigger a production release with changelog generation
allowed-tools: Bash, Read
---

# Production Release

You are a release coordinator. The user wants to create a production release.

Steps:
1. Run `${CLAUDE_PLUGIN_ROOT}/bin/deploy-check` to validate current state
2. Generate a changelog from git log since last tag
3. Create and push a git tag
4. Trigger the deployment pipeline

Ask the user to confirm before pushing the tag.
```

**Invocation:** `/deploy-helper:release`

**Key differences from project commands:**
- Namespace prefix is mandatory for invocation (users cannot drop the namespace)
- `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` are available for referencing plugin scripts

---

### 7.2 Agents (`agents/`)

Plugin agents are sub-agent definitions — persistent personas that Claude Code can spin up as Task sub-agents.

**Format:** Markdown with frontmatter, same as project agents, but with security-restricted frontmatter.

```markdown
---
description: Handles deployment rollback with safety checks and notifications
allowed-tools: Bash, Read
# NOTE: hooks, mcpServers, and permissionMode are not allowed in plugin agents
---

# Rollback Agent

You are a deployment rollback specialist. When invoked, you:

1. Identify the last known-good deployment artifact
2. Validate the rollback target is healthy
3. Execute the rollback via `${CLAUDE_PLUGIN_ROOT}/bin/rollback-safe`
4. Send a Slack notification using `${CLAUDE_PLUGIN_OPTION_SLACKWEBHOOK}`
5. Confirm with the user before proceeding

Always err on the side of caution. If unsure, stop and ask.
```

**Invocation:** `deploy-helper:rollback` (via Task tool or the `/agent` command)

**Security restrictions on plugin agents:**

| Frontmatter key | Allowed in plugin agents? |
|-----------------|---------------------------|
| `description` | Yes |
| `allowed-tools` | Yes |
| `disallowed-tools` | Yes |
| `model` | Yes |
| `hooks` | **No** — blocked for security |
| `mcpServers` | **No** — blocked for security |
| `permissionMode` | **No** — blocked for security |

> **Why the restrictions?** Plugin agents run at hook trust level. Allowing plugin agents to register additional hooks or MCP servers would create a privilege-escalation path — a plugin could chain events to acquire more capabilities than the user authorized.

---

### 7.3 Skills (`skills/*/SKILL.md`)

Skills are auto-invoked instruction sets. Claude monitors every task description and automatically applies matching skills without the user needing to invoke them explicitly.

**Directory convention:** Each skill lives in its own subdirectory with a `SKILL.md` file.

```
skills/
├── deploy/
│   └── SKILL.md        →  invoked as deploy-helper:deploy
└── rollback/
    └── SKILL.md        →  invoked as deploy-helper:rollback
```

**SKILL.md format:**

```markdown
---
description: >
  Deployment procedures — use when the user asks to deploy, release, push to production,
  ship code, or run a deployment pipeline.
---

# Deployment Skill

When performing any deployment task:

1. Always run `deploy-check` first: `${CLAUDE_PLUGIN_ROOT}/bin/deploy-check`
2. Confirm target environment with the user before proceeding
3. Use the configured region: `${CLAUDE_PLUGIN_OPTION_REGION}`
4. Log all actions to `${CLAUDE_PLUGIN_DATA}/deploy.log`
5. If deployment fails, immediately offer to run the rollback agent

**Never deploy on Fridays after 3pm local time without explicit user confirmation.**
```

**Auto-invocation matching:** Claude uses the `description` field to determine relevance. Write descriptions that clearly enumerate the triggers — use synonyms and related terms. Skills with vague descriptions may fail to trigger or trigger too broadly.

---

### 7.4 Output Styles (`output-styles/`)

Plugin output styles appear in the `/config` → Output Style menu alongside built-in and personal styles.

**Format:** Markdown with frontmatter (identical to personal output styles):

```markdown
---
name: "deploy-helper: terse"
description: "Minimal output focused on deployment actions — no explanations, code only"
keep-coding-instructions: true
---

Respond with the absolute minimum necessary. No preamble, no explanation unless asked.
For deployment tasks: output the exact commands run and their exit codes.
For code changes: output only diffs, not full files.
```

The style appears in the menu as `deploy-helper: terse` (namespaced automatically).

---

### 7.5 Monitors (`monitors/monitors.json`)

Monitors are **background processes** that start automatically and stream their stdout to Claude as contextual information during the session. They are ideal for ambient awareness — Claude sees your CI pipeline status, error logs, or test results without you having to ask.

> **Requires:** v2.1.105 or later.

**Full format reference — see [Section 8](#8-plugin-monitors--deep-dive) below.**

---

### 7.6 Themes (`themes/`)

Plugin themes appear in the `/theme` command menu. When a user selects a plugin theme and presses `Ctrl+E`, a copy is placed in `~/.claude/themes/` where they can edit it freely.

**Format:** JSON with a base preset and sparse color overrides.

**Full format reference — see [Section 9](#9-plugin-themes--deep-dive) below.**

---

### 7.7 Bin Executables (`bin/`)

Any file in the `bin/` directory is added to the `PATH` of the Bash tool for the duration of the session. This means Claude can invoke your plugin's scripts directly by name from Bash commands.

```
bin/
├── deploy-check       ← available as `deploy-check` in Bash
├── rollback-safe      ← available as `rollback-safe` in Bash
└── changelog-gen      ← available as `changelog-gen` in Bash
```

**Requirements:**
- Files must be executable (`chmod +x`)
- Can be any language: bash, Python, Node.js, compiled binaries, etc.
- For interpreted scripts, include a shebang line (`#!/usr/bin/env python3`)

```bash
#!/usr/bin/env bash
# bin/deploy-check
# Validates pre-deployment conditions

set -euo pipefail

LOG="${CLAUDE_PLUGIN_DATA}/deploy.log"
mkdir -p "$(dirname "$LOG")"

echo "=== Pre-deployment check $(date -u +%Y-%m-%dT%H:%M:%SZ) ===" | tee -a "$LOG"

# Check 1: All tests passing
if ! git diff --quiet HEAD; then
  echo "ERROR: Uncommitted changes present" | tee -a "$LOG"
  exit 1
fi

echo "OK: Working tree is clean"
echo "OK: Ready to deploy"
```

---

### 7.8 Hooks (`hooks/hooks.json`)

Plugin hooks use the standard hook event system but are defined in a plugin-scoped JSON file. All path references should use `${CLAUDE_PLUGIN_ROOT}` or `${CLAUDE_PLUGIN_DATA}`.

```json
{
  "hooks": [
    {
      "event": "SessionStart",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/deploy-check --quiet"
    },
    {
      "event": "PostToolUse",
      "matcher": {
        "tool": "Bash",
        "commandContains": "git push"
      },
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/notify-slack --webhook ${user_config.slackWebhook} --message 'Git push detected'"
    },
    {
      "event": "Stop",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/log-session-end --log ${CLAUDE_PLUGIN_DATA}/sessions.log"
    }
  ]
}
```

Hook events and matchers follow the same rules as project-level hooks. See the [Hooks System guide](/claude-code/hooks-deep-dive) for the full event reference.

---

### 7.9 MCP Servers (`.mcp.json`)

Plugin MCP servers start automatically when the plugin is active. The `.mcp.json` format mirrors Claude Code's standard MCP configuration but supports `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}` substitution.

```json
{
  "mcpServers": {
    "deploy-helper-api": {
      "type": "stdio",
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp-server/index.js"],
      "env": {
        "API_KEY": "${user_config.apiKey}",
        "DATA_DIR": "${CLAUDE_PLUGIN_DATA}",
        "REGION": "${user_config.region}"
      }
    }
  }
}
```

The server name is namespaced automatically: `deploy-helper-api` becomes `deploy-helper:deploy-helper-api` in Claude Code's MCP registry.

---

### 7.10 LSP Servers (`.lsp.json`)

Language Server Protocol servers provide IDE-like language intelligence to the Bash and editor tools. Plugin LSP servers are registered automatically.

```json
{
  "lspServers": {
    "deploy-dsl": {
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/deploy-lsp",
      "args": ["--stdio"],
      "filetypes": ["*.deploy.yaml", "*.release.json"],
      "rootPatterns": [".deploy-config.json", "deploy.yaml"]
    }
  }
}
```

---

### 7.11 Default Settings (`settings.json`)

A plugin can ship a `settings.json` that provides default values for Claude Code settings. **Only two keys are currently supported** in plugin-level `settings.json`:

| Key | Type | Description |
|-----|------|-------------|
| `agent` | string | Default sub-agent to use for task delegation |
| `subagentStatusLine` | string | Custom status line format shown during sub-agent execution |

```json
{
  "agent": "deploy-helper:deployment-agent",
  "subagentStatusLine": "[deploy-helper] {agent} working on: {task}"
}
```

These defaults are applied only when no higher-priority setting (user, project, local) overrides them.

---

## 8. Plugin Monitors — Deep Dive

Monitors are a powerful pattern for giving Claude **ambient situational awareness**. Instead of Claude having to ask "what does the CI output say?" or "are there any errors in the logs?", a monitor feeds that information continuously into the session context.

### JSON Format

```json
{
  "monitors": [
    {
      "name": "ci-watcher",
      "description": "Watches CI pipeline status and streams results to Claude",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/ci-watch",
      "args": ["--project", "${user_config.projectId}", "--format", "claude"],
      "env": {
        "CI_TOKEN": "${user_config.ciToken}",
        "DATA_DIR": "${CLAUDE_PLUGIN_DATA}"
      },
      "when": "always"
    },
    {
      "name": "error-log-tail",
      "description": "Tails application error log; surfaces errors to Claude",
      "command": "tail",
      "args": ["-f", "${CLAUDE_PLUGIN_DATA}/app-errors.log"],
      "when": "on-skill-invoke:deploy-helper:deploy"
    }
  ]
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Monitor identifier (namespaced automatically) |
| `description` | string | Yes | Shown in session info; helps Claude understand the context being provided |
| `command` | string | Yes | Executable to run |
| `args` | string[] | No | Arguments (support variable substitution) |
| `env` | object | No | Additional environment variables |
| `when` | string | Yes | `"always"` or `"on-skill-invoke:plugin-name:skill-name"` |

### The `when` Field

**`"always"`** — Monitor starts at session start and runs for the entire session lifetime.

Use `always` for ambient context that is always relevant:
- CI pipeline status
- Test failure streams
- System resource monitors
- Error log tails (if errors are always relevant)

**`"on-skill-invoke:deploy-helper:deploy"`** — Monitor starts the first time the named skill is invoked in the session, then runs until session end.

Use `on-skill-invoke` for context that is only relevant after a certain capability is activated:
- Error log tail (only relevant after starting a deploy)
- Test result stream (only relevant after starting a test run)
- Database query log (only relevant after activating a DB-related skill)

### Monitor Lifecycle

```
Session Start
    │
    ├─ [when=always monitors] ─── start immediately
    │
    │   (session continues)
    │
    ├─ Skill "deploy-helper:deploy" invoked
    │       │
    │       └─ [when=on-skill-invoke:deploy-helper:deploy monitors] ─── start now
    │
    │   (session continues — both monitor types running)
    │
Session End
    │
    └─ All monitors receive SIGTERM → SIGKILL after 5s
```

### What Claude Sees

Monitor stdout is delivered to Claude as a stream of context blocks, labeled with the monitor name and description. Claude treats this like environmental information — it can reference it when answering questions and proactively surface relevant findings.

For example, if your CI monitor outputs:

```
[ci-watcher] BUILD FAILED: test_authentication.py::test_login_flow — AssertionError
```

Claude will notice this and may proactively say: "I see the CI just reported a test failure in `test_authentication.py`. Want me to investigate?"

### Security Model

Monitors run at **hook trust level** — they execute unsandboxed, with the same permissions as the user running Claude Code. The user authorizes plugin installation (which authorizes all plugin components), so monitors are considered authorized.

Monitor stdout is treated as untrusted context — Claude will read it but will not execute arbitrary code from it without normal permission checks.

### Practical Examples

**Example 1: Deploy Status Watcher**

```bash
#!/usr/bin/env bash
# bin/ci-watch — streams CI status updates

PROJECT="${1:-$CLAUDE_PLUGIN_OPTION_PROJECTID}"
while true; do
  STATUS=$(curl -s "https://ci.acme.com/api/projects/$PROJECT/latest" \
    -H "Authorization: Bearer $CI_TOKEN" | jq -r '.status + ": " + .message')
  echo "[ci-watcher] $STATUS"
  sleep 30
done
```

**Example 2: Error Log Tail with Filtering**

```bash
#!/usr/bin/env bash
# bin/error-tail — tails error log, filters noise

LOG="${CLAUDE_PLUGIN_DATA}/app-errors.log"
tail -f "$LOG" | grep --line-buffered -E "(ERROR|FATAL|CRITICAL)" | while read -r line; do
  echo "[error-log] $line"
done
```

**Example 3: Test Runner Output**

```bash
#!/usr/bin/env bash
# bin/test-watch — runs tests in watch mode, streams failures

cd "${CLAUDE_PLUGIN_OPTION_PROJECTROOT:-.}"
npx jest --watch --no-coverage 2>&1 | while read -r line; do
  # Only surface failures and summary lines
  if echo "$line" | grep -qE "(FAIL|PASS|Tests:|✓|✗|●)"; then
    echo "[test-watch] $line"
  fi
done
```

---

## 9. Plugin Themes — Deep Dive

Plugin themes let you bundle pre-designed color schemes that integrate with Claude Code's theming system. Users discover them via `/theme` and can copy them for personal editing.

### JSON Format

```json
{
  "name": "Acme Dark",
  "base": "dark",
  "colors": {
    "claude": "#7C9EFF",
    "error": "#FF6B6B",
    "success": "#51CF66",
    "warning": "#FFD43B",
    "muted": "#868E96",
    "highlight": "#1A1B2E",
    "border": "#2C2D3E",
    "text": "#C1C2C5",
    "textStrong": "#FFFFFF",
    "background": "#0D0E1A",
    "backgroundSecondary": "#1A1B2E"
  }
}
```

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name in `/theme` menu |
| `base` | `"dark"` \| `"light"` \| `"system"` | Base preset to start from |
| `colors` | object | Sparse color overrides (only specify what you want to change) |

### Available Base Presets

| Preset | Description |
|--------|-------------|
| `"dark"` | Claude Code default dark theme |
| `"light"` | Claude Code default light theme |
| `"system"` | Follows OS dark/light mode setting |

### Color Keys

| Key | What it controls |
|-----|------------------|
| `claude` | Claude's response text and primary brand color |
| `error` | Error messages, failed operations |
| `success` | Successful operations, confirmations |
| `warning` | Warnings, cautions |
| `muted` | Secondary text, hints, timestamps |
| `highlight` | Selection highlight, active item background |
| `border` | UI borders and dividers |
| `text` | Primary body text |
| `textStrong` | Bold/emphasized text |
| `background` | Main background |
| `backgroundSecondary` | Panel backgrounds, sidebars |

All color values are CSS hex strings (`#RRGGBB` or `#RRGGBBAA`).

### Sparse Overrides

You do not need to specify every color key. Unspecified keys inherit from the base preset. This allows minimal themes that just tweak accent colors:

```json
{
  "name": "Acme Accent",
  "base": "dark",
  "colors": {
    "claude": "#FF6B35",
    "success": "#00B894"
  }
}
```

This produces the standard dark theme with only `claude` and `success` colors changed.

### User Editing via Ctrl+E

When a user selects a plugin theme in the `/theme` menu and presses `Ctrl+E`, Claude Code:

1. Copies the theme JSON to `~/.claude/themes/<plugin-name>-<theme-name>.json`
2. Opens the file in the user's `$EDITOR`
3. Reloads the theme on save

The copied file is fully independent of the plugin — it will not be overwritten by plugin updates. This design means plugin themes serve as starting points that users customize.

---

## 10. Building a Plugin — Step-by-Step

This walkthrough builds a minimal but complete `deploy-helper` plugin from scratch.

### Step 1: Initialize the Package

```bash
mkdir deploy-helper
cd deploy-helper
npm init -y
```

Edit `package.json` to set a proper name and description:

```json
{
  "name": "@acme/deploy-helper",
  "version": "1.0.0",
  "description": "Deployment automation for Claude Code"
}
```

### Step 2: Create the Plugin Manifest

```bash
touch plugin.json
```

```json
{
  "name": "deploy-helper",
  "version": "1.0.0",
  "description": "Deployment automation for Claude Code",
  "author": "Acme Corp",
  "license": "MIT",
  "userConfig": {
    "deployTarget": {
      "description": "Deployment environment (staging or production)",
      "type": "string",
      "default": "staging"
    },
    "slackWebhook": {
      "description": "Slack webhook for deployment notifications",
      "type": "string",
      "sensitive": true
    }
  }
}
```

### Step 3: Write the Core Skill

```bash
mkdir -p skills/deploy
```

```markdown
<!-- skills/deploy/SKILL.md -->
---
description: >
  Deployment procedures — invoke when the user asks to deploy, release, ship, push to
  production, or run a deployment pipeline. Also invoke for rollback and hotfix tasks.
---

# Deploy Skill

When performing any deployment:

1. Run `deploy-check` first and show the output to the user
2. Confirm target: "Deploying to **${CLAUDE_PLUGIN_OPTION_DEPLOYENVIRONMENT}**. Proceed?"
3. Execute the deployment and monitor output
4. If successful: notify Slack via the configured webhook
5. If failed: immediately offer to roll back
```

### Step 4: Write a Command

```bash
mkdir commands
```

```markdown
<!-- commands/release.md -->
---
description: Create a tagged release with changelog
allowed-tools: Bash, Read
---

# Release Command

Create a new release:

1. Check for uncommitted changes (`git status`)
2. Run all tests and confirm passing
3. Run `changelog-gen` to draft the changelog
4. Show the draft to the user for approval
5. Create and push a git tag
6. Trigger the deployment pipeline

Do not push the tag without explicit user approval.
```

### Step 5: Add a Bin Script

```bash
mkdir bin
```

```bash
#!/usr/bin/env bash
# bin/deploy-check

set -euo pipefail

TARGET="${CLAUDE_PLUGIN_OPTION_DEPLOYTARGET:-staging}"
LOG_DIR="${CLAUDE_PLUGIN_DATA}/logs"
mkdir -p "$LOG_DIR"

echo "Checking deployment prerequisites for target: $TARGET"

# Verify clean working tree
if ! git diff --quiet HEAD; then
  echo "ERROR: Uncommitted changes — commit or stash before deploying"
  exit 1
fi
echo "OK: Working tree clean"

# Verify tests pass (example)
echo "OK: All checks passed. Ready to deploy to $TARGET."
```

```bash
chmod +x bin/deploy-check
```

### Step 6: Add a Monitor

```bash
mkdir monitors
```

```json
{
  "monitors": [
    {
      "name": "deploy-status",
      "description": "Watches deployment pipeline status",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/deploy-watch",
      "when": "on-skill-invoke:deploy-helper:deploy"
    }
  ]
}
```

Update `plugin.json`:

```json
{
  "monitors": "monitors/monitors.json"
}
```

### Step 7: Test Locally

```bash
# Install from local path
claude plugin install /path/to/deploy-helper --scope local

# Verify it loaded
claude plugin list

# Set required config
claude plugin config set deploy-helper deployTarget staging
claude plugin config set deploy-helper slackWebhook https://hooks.slack.com/...

# Start a session and test
claude
> Deploy the latest build to staging
```

### Step 8: Publish to npm

```bash
# Login to npm
npm login

# Publish
npm publish --access public

# Install from npm anywhere
claude plugin install @acme/deploy-helper
```

---

## 11. Plugin Dependencies

The `dependencies` field in `plugin.json` declares runtime requirements. Claude Code validates dependencies at install time and warns on violation.

### String Values (Version Range)

```json
{
  "dependencies": {
    "node": ">=20.0.0",
    "python3": ">=3.11",
    "jq": "*",
    "@acme/shared-scripts": "^2.0.0"
  }
}
```

String values are semver ranges (for versioned software) or `"*"` (any version present in PATH for system binaries).

### Object Values (Pinned Install)

For npm packages that Claude Code should install automatically:

```json
{
  "dependencies": {
    "@acme/shared-lib": {
      "version": "1.2.3",
      "registry": "https://npm.acme.com"
    }
  }
}
```

Object form supports:
- `version` — exact version to install
- `registry` — custom npm registry URL (for private packages)

### System Binary Dependencies

For system tools (not npm packages), list the binary name as a key:

```json
{
  "dependencies": {
    "git": ">=2.40",
    "curl": "*",
    "docker": ">=24.0"
  }
}
```

Claude Code checks for these in `PATH`. If missing, it warns the user but does not block installation (since it cannot install system packages).

### Dependency Resolution Order

1. Claude Code reads `plugin.json` during `claude plugin install`
2. npm package dependencies are installed into the plugin's scoped node_modules
3. System binary dependencies are checked in `PATH`; warnings are emitted for missing binaries
4. If required npm dependencies fail to install, plugin installation is aborted

---

## 12. Security Model

### Plugin Agent Restrictions

Plugin agents cannot use `hooks`, `mcpServers`, or `permissionMode` in their frontmatter. This prevents privilege escalation:

```
Plugin agent (runs at hook trust level)
    │
    ├── Can use: Bash, Read, Write, Edit, Grep, Task (with allowed-tools)
    ├── Can use: MCP tools from already-registered servers
    └── Cannot: register new hooks, new MCP servers, change permissionMode
```

If a plugin agent's markdown contains these keys, Claude Code strips them and logs a warning. The agent loads but the restricted keys are ignored.

### Namespace Isolation

Each plugin's components live in their own namespace. Plugin A cannot override, shadow, or intercept Plugin B's commands, skills, or agents. Personal commands (no namespace) also cannot conflict with plugin commands.

### Plugin Root Immutability

`${CLAUDE_PLUGIN_ROOT}` is intentionally read-only by convention and documented restriction. Reasons:

1. **Updates** replace the plugin root directory entirely — writes are lost
2. **Shared installs** — on multi-user systems, the plugin root may be shared; writes could affect other users
3. **Integrity** — the plugin root should always reflect what was published; writes create drift that's hard to debug

Always use `${CLAUDE_PLUGIN_DATA}` for mutable state.

### Managed Plugins

In enterprise deployments, IT/security teams can configure **managed plugins** via Claude Code's managed policy:

```json
{
  "managedPlugins": {
    "@acme/compliance-enforcer": {
      "required": true,
      "config": {
        "auditEndpoint": "https://audit.acme.internal/api"
      }
    }
  }
}
```

- `required: true` — the plugin cannot be removed by users
- Managed plugin config overrides user-set config for specified keys
- Managed plugins are installed at startup if not present

### Sensitive Config Security

Sensitive `userConfig` values:
- Never written to disk in plaintext
- Never appear in `ps` output (injected via environment, not command line arguments)
- Stored in the OS-native keychain
- Deleted from keychain on `claude plugin remove`

---

## 13. Complete Plugin Example — deploy-helper

This is the full file listing for a production-ready `deploy-helper` plugin.

### plugin.json

```json
{
  "name": "deploy-helper",
  "version": "2.3.1",
  "description": "Deployment automation — release, rollback, monitoring, notifications",
  "author": "Acme Corp <tools@acme.com>",
  "license": "MIT",
  "keywords": ["deployment", "release", "rollback", "CI", "slack"],
  "hooks": "hooks/hooks.json",
  "monitors": "monitors/monitors.json",
  "userConfig": {
    "deployTarget": {
      "description": "Target environment (staging, production)",
      "type": "string",
      "default": "staging"
    },
    "slackWebhook": {
      "description": "Slack incoming webhook URL for notifications",
      "type": "string",
      "sensitive": true
    },
    "verboseLogging": {
      "description": "Enable verbose deploy-check output",
      "type": "boolean",
      "default": false
    }
  }
}
```

### skills/deploy/SKILL.md

```markdown
---
description: >
  Deployment automation — invoke when the user asks to deploy, release, ship code,
  push to production, create a release, or trigger a pipeline.
---

# Deploy Skill

Before any deployment action:
1. Run `deploy-check` and confirm the output looks healthy
2. State the target environment and ask for confirmation
3. Proceed only with explicit approval

After deployment:
- Log the action to `${CLAUDE_PLUGIN_DATA}/deployments.log`
- Send Slack notification if webhook is configured
```

### commands/release.md

```markdown
---
description: Create a versioned release with auto-generated changelog
allowed-tools: Bash, Read
---

# Release

1. Verify the working tree is clean
2. Run `deploy-check`
3. Generate changelog with `changelog-gen --since $(git describe --tags --abbrev=0)`
4. Present changelog draft for user approval
5. On approval: `git tag -a $VERSION -m "Release $VERSION"` and `git push origin $VERSION`
```

### agents/rollback-agent.md

```markdown
---
description: Safely rolls back a deployment to the last known-good state
allowed-tools: Bash, Read
---

# Rollback Agent

You are a deployment rollback specialist. When activated:

1. Identify the previous good deployment from `${CLAUDE_PLUGIN_DATA}/deployments.log`
2. Show the user what will be rolled back and confirm
3. Execute `rollback-safe --target $PREVIOUS_VERSION`
4. Verify service health after rollback
5. Notify Slack of the rollback

Never skip confirmation step.
```

### hooks/hooks.json

```json
{
  "hooks": [
    {
      "event": "SessionStart",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/deploy-check --quiet --log ${CLAUDE_PLUGIN_DATA}/session.log"
    },
    {
      "event": "PostToolUse",
      "matcher": { "tool": "Bash", "commandContains": "git push" },
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/notify --webhook ${user_config.slackWebhook} --msg 'Push detected in session'"
    }
  ]
}
```

### monitors/monitors.json

```json
{
  "monitors": [
    {
      "name": "deploy-pipeline",
      "description": "CI pipeline status — streams build/test/deploy results to Claude",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/pipeline-watch",
      "env": {
        "TARGET": "${user_config.deployTarget}",
        "DATA_DIR": "${CLAUDE_PLUGIN_DATA}"
      },
      "when": "on-skill-invoke:deploy-helper:deploy"
    }
  ]
}
```

### settings.json

```json
{
  "subagentStatusLine": "[deploy-helper] {agent}: {task}"
}
```

---

## 14. Plugin Best Practices

### Keep Plugin Root Read-Only

Structure all write operations to use `${CLAUDE_PLUGIN_DATA}`:

```bash
# Good
LOG="${CLAUDE_PLUGIN_DATA}/plugin.log"

# Bad — will be lost on update
LOG="${CLAUDE_PLUGIN_ROOT}/logs/plugin.log"
```

### Write Clear Skill Descriptions

The `description` field in `SKILL.md` is what Claude uses to decide when to auto-invoke your skill. Write it as a list of trigger scenarios, not as documentation:

```markdown
---
description: >
  Use when the user asks to deploy, release, ship, push to production, create a release,
  run a pipeline, trigger CI, or promote a build to an environment.
  Also use for hotfixes, emergency releases, and rollback planning.
---
```

Avoid vague descriptions like "Helps with deployment stuff" — Claude needs enough signal to match correctly.

### Document userConfig Clearly

Users read the `description` field of each config key via `claude plugin config list`. Write it as a complete sentence that tells them exactly what to enter:

```json
{
  "apiKey": {
    "description": "API key from https://dashboard.acme.com/settings/api-keys — requires 'deploy' scope",
    "type": "string",
    "sensitive": true
  }
}
```

### Keep Monitors Focused

Monitors that produce too much output overwhelm Claude's context. Filter aggressively:

```bash
# Good: only surface actionable lines
tail -f "$LOG" | grep --line-buffered -E "(ERROR|WARN|DEPLOY|BUILD_FAILED)"

# Bad: pipe everything
tail -f "$LOG"
```

### Test All Components Before Publishing

```bash
# Install locally and run through a checklist
claude plugin install /path/to/your-plugin --scope local

# Verify each component
claude plugin info your-plugin       # Check manifest parsed correctly
/your-plugin:your-command            # Test commands
# Ask Claude something that triggers the skill
# Check /theme for your themes
# Check /config Output Style for your styles
claude plugin remove your-plugin --scope local
```

### Version Bump on Breaking Changes

If you change a `userConfig` key name, rename a command, or change a skill trigger, bump the major version. Users who auto-update may have hooks, scripts, or habits that depend on the old names.

### Keep Agents Minimal

Plugin agents run at hook trust level and have restricted frontmatter. Keep agent prompts focused — they should be specialists, not generalists. Broad agents in plugins are harder to trust and harder for users to understand.

---

## Quick Reference Card

```
Plugin Installation
  claude plugin install <pkg>              # from npm
  claude plugin install /path/to/plugin   # local dev
  claude plugin install <pkg> --scope project
  claude plugin list / info / remove / update

Config
  claude plugin config set <plugin> <key> <value>
  claude plugin config list <plugin>
  claude plugin config unset <plugin> <key>

Environment Variables
  ${CLAUDE_PLUGIN_ROOT}   read-only, changes on update
  ${CLAUDE_PLUGIN_DATA}   writable, survives updates
  ${user_config.KEY}      in hooks/monitors
  CLAUDE_PLUGIN_OPTION_KEY  in subprocesses

Component Namespacing
  commands  →  /plugin-name:command-name
  agents    →  plugin-name:agent-name
  skills    →  /plugin-name:skill-name (auto-invoked)
  styles    →  "plugin-name: style-name" in /config
  themes    →  "Plugin Name: Theme Name" in /theme

Security Restrictions (plugin agents)
  hooks         — BLOCKED
  mcpServers    — BLOCKED
  permissionMode — BLOCKED
```
