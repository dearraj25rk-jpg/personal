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
lastUpdated: 2026-06-06
---

# Plugins — Complete Reference

> **Version:** v2.1.126 (May 19, 2026) · Plugin system introduced in v2.0.64; monitors added in v2.1.105.

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

### Plugin User Configuration (userConfig)

The `userConfig` schema in `plugin.json` defines settings users can configure. Here is a complete example for a database query plugin:

```json
{
  "name": "my-db-plugin",
  "version": "1.0.0",
  "description": "Database query plugin",
  "userConfig": {
    "connectionString": {
      "type": "string",
      "description": "PostgreSQL connection string",
      "sensitive": true
    },
    "maxRows": {
      "type": "integer",
      "description": "Maximum rows returned per query",
      "default": 100
    },
    "readOnly": {
      "type": "boolean",
      "description": "Restrict to SELECT queries only",
      "default": true
    }
  }
}
```

Users configure it with: `claude plugin config my-db-plugin`

Access config values in your hooks/commands via environment variables (using the `CLAUDE_PLUGIN_OPTION_` prefix + uppercase key name):

```bash
# In hook scripts, config values are available as:
echo $CLAUDE_PLUGIN_OPTION_CONNECTIONSTRING
echo $CLAUDE_PLUGIN_OPTION_MAXROWS
echo $CLAUDE_PLUGIN_OPTION_READONLY
```

Or via `${user_config.KEY}` substitution in `hooks.json`:

```json
{
  "hooks": [
    {
      "event": "SessionStart",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/db-check --conn ${user_config.connectionString} --max-rows ${user_config.maxRows}"
    }
  ]
}
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

---

## 15. Plugin Directory Structure — Complete ASCII Diagram

This diagram shows the full layout of a maximally-featured plugin, with annotations explaining what each entry does.

```
my-plugin/                             ← npm package root
│
├── plugin.json                        ← REQUIRED: plugin manifest
│   (declares all components, metadata, userConfig, dependencies)
│
├── package.json                       ← npm package manifest
│   (name, version, description — separate from plugin.json)
│
├── commands/                          ← slash commands
│   ├── release.md                     → /my-plugin:release
│   ├── rollback.md                    → /my-plugin:rollback
│   └── hotfix.md                      → /my-plugin:hotfix
│
├── agents/                            ← sub-agent definitions
│   ├── deployment-agent.md            → my-plugin:deployment-agent
│   └── review-agent.md               → my-plugin:review-agent
│   (Note: hooks/mcpServers/permissionMode frontmatter blocked)
│
├── skills/                            ← auto-invoked instruction sets
│   ├── deploy/
│   │   └── SKILL.md                   → auto-invoked as my-plugin:deploy
│   ├── rollback/
│   │   └── SKILL.md                   → auto-invoked as my-plugin:rollback
│   └── monitor/
│       └── SKILL.md                   → auto-invoked as my-plugin:monitor
│   (Each skill dir has ONE SKILL.md; extra files for supporting content)
│
├── output-styles/                     ← output style definitions
│   ├── concise.md                     → appears as "my-plugin: concise" in /config
│   └── verbose-debug.md              → appears as "my-plugin: verbose-debug"
│
├── monitors/                          ← background process monitors (v2.1.105+)
│   └── monitors.json                  ← monitor definitions (name, command, when)
│
├── themes/                            ← UI color themes
│   ├── dark-theme.json               → appears in /theme menu
│   └── light-theme.json
│
├── bin/                               ← executable scripts added to Bash PATH
│   ├── deploy-check                   ← available as `deploy-check` in any Bash cmd
│   ├── rollback-safe                  ← chmod +x required
│   └── changelog-gen
│
├── hooks/                             ← lifecycle event hooks
│   └── hooks.json                     ← hook definitions (event, matcher, command)
│
├── .mcp.json                          ← MCP server definitions
│   (servers start automatically; namespaced as my-plugin:server-name)
│
├── .lsp.json                          ← LSP server definitions
│   (language servers for .deploy.yaml, etc.)
│
└── settings.json                      ← default settings overrides
    (only: agent, subagentStatusLine)

Runtime directories (created automatically, NOT in plugin source):
  ${CLAUDE_PLUGIN_ROOT}  →  read-only, where the package is installed
                             ~/.claude/plugins/node_modules/@org/my-plugin/
  ${CLAUDE_PLUGIN_DATA}  →  writable, persistent across updates
                             ~/.claude/plugin-data/my-plugin/
```

### Minimal Plugin Structure

For a plugin with just one command and one skill:

```
my-plugin/
├── plugin.json          ← required
├── commands/
│   └── my-command.md
└── skills/
    └── my-skill/
        └── SKILL.md
```

`plugin.json` for this minimal plugin:
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My minimal plugin"
}
```

The `commands` and `skills` directories are discovered by default even without explicit manifest entries. Only non-default paths need to be declared in `plugin.json`.

---

## 16. All 10 Component Types — Examples and Details

### Component Type 1: Commands (`commands/`)

Commands are slash commands invoked as `/plugin-name:command-name`. They use the standard custom command format.

**Example — a changelog generator command:**

```markdown
<!-- commands/changelog.md -->
---
description: Generate a changelog entry from commits since the last tag
allowed-tools: Bash, Read, Write
---

# Changelog Generator

Generate a changelog entry for the pending release.

## Commits since last tag
!`git log --oneline $(git describe --tags --abbrev=0 2>/dev/null || echo HEAD~20)..HEAD`

## Format (Keep a Changelog)
Group changes under:
- Added: new features
- Changed: changes in existing functionality
- Fixed: bug fixes
- Deprecated / Removed / Security: only if applicable

Run: ${CLAUDE_PLUGIN_ROOT}/bin/changelog-gen --since-tag to get additional context.
Write the entry to CHANGELOG.md above the previous version.
```

**Invocation:** `/my-plugin:changelog`

---

### Component Type 2: Agents (`agents/`)

Agents are sub-agent personas. Invoked via the Task tool or `/agent` command. Security-restricted: cannot register hooks, MCP servers, or change permission mode.

**Example — a security review agent:**

```markdown
<!-- agents/security-reviewer.md -->
---
description: >
  Specialized security code reviewer. Reviews code for OWASP Top 10 risks,
  authentication flaws, and injection vulnerabilities.
allowed-tools: Read, Bash, Glob
model: claude-opus-4-7
---

# Security Reviewer Agent

You are a specialized security code reviewer with expertise in:
- OWASP Top 10 (2021 edition)
- Authentication and authorization flaws
- Injection vulnerabilities (SQL, command, template)
- Cryptographic weaknesses
- Insecure direct object references

When reviewing code:
1. Read the file completely before commenting
2. Check each function for security-relevant operations
3. Reference specific OWASP categories in your findings
4. Rate each finding: Critical / High / Medium / Low / Informational
5. Provide specific remediation code, not just descriptions

Log your findings to ${CLAUDE_PLUGIN_DATA}/security-reviews.log for trend tracking.
```

**Invocation:** `my-plugin:security-reviewer` (via Task tool orchestration)

---

### Component Type 3: Skills (`skills/*/SKILL.md`)

Skills are auto-invoked by Claude when the task description semantically matches the skill's `description` field. Also callable as `/plugin-name:skill-name`.

**Example — a deployment skill:**

```markdown
<!-- skills/deploy/SKILL.md -->
---
description: >
  Deployment procedures — invoke when the user asks to deploy, release, ship code,
  push to production, promote a build, create a release, or trigger CI/CD.
  Also invoke for hotfix deployments and emergency releases.
---

# Deploy Skill

When performing any deployment action:

## Pre-deployment (mandatory)
1. Run `deploy-check` — show output to user
2. Confirm target environment: state it clearly and ask "Proceed?"
3. Verify working tree is clean: `git status --short`

## During deployment
- Stream output from deployment script to user
- Log all actions: `${CLAUDE_PLUGIN_DATA}/deployments.log`
- If any step fails: stop immediately, do not auto-retry

## Post-deployment
- Verify health endpoint responds: `curl -f ${CLAUDE_PLUGIN_OPTION_HEALTHURL}`
- Send Slack notification (if webhook configured)
- Update ${CLAUDE_PLUGIN_DATA}/deployments.log with result
```

**Trigger phrases:** "deploy to staging", "release v2.3", "push to prod", "ship the feature"

---

### Component Type 4: Output Styles (`output-styles/`)

Output styles contributed by plugins appear in the `/config` → Output Style menu with the plugin name as a namespace prefix.

**Example — a minimal CI-focused output style:**

```markdown
<!-- output-styles/ci-minimal.md -->
---
name: "ci-minimal"
description: "CI/automated mode — commands and exit codes only, no explanations"
keep-coding-instructions: true
---

You are running in CI/automated mode. Rules:

- No preamble or greeting
- No explanation unless an error occurred
- For shell commands: show the command and its exit code only
- For code changes: show the diff only, not the full file
- For errors: show the error message, the file:line, and the fix
- For success: show "OK" or the success indicator only

Total response length should not exceed 20 lines for routine operations.
```

**Appears in menu as:** `my-plugin: ci-minimal`

---

### Component Type 5: Monitors (`monitors/monitors.json`)

Monitors are background processes that stream stdout to Claude as ambient context. Requires v2.1.105+.

**Example — monitors.json with two monitors:**

```json
{
  "monitors": [
    {
      "name": "ci-status",
      "description": "CI pipeline status — build/test/deploy results streamed in real time",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/ci-watch",
      "args": ["--project", "${user_config.projectId}", "--interval", "30"],
      "env": {
        "CI_TOKEN": "${user_config.ciToken}",
        "DATA_DIR": "${CLAUDE_PLUGIN_DATA}"
      },
      "when": "always"
    },
    {
      "name": "deploy-log",
      "description": "Live deployment output — streams deploy script stdout after deploy skill is invoked",
      "command": "tail",
      "args": ["-f", "${CLAUDE_PLUGIN_DATA}/deployments.log"],
      "when": "on-skill-invoke:my-plugin:deploy"
    }
  ]
}
```

The `ci-status` monitor runs the entire session. The `deploy-log` monitor starts only after the deploy skill is first invoked.

---

### Component Type 6: Themes (`themes/`)

Themes control the Claude Code REPL color scheme. Users can copy and edit them via Ctrl+E.

**Example — a corporate dark theme:**

```json
{
  "name": "Acme Dark",
  "base": "dark",
  "colors": {
    "claude": "#4A9EFF",
    "success": "#3DBA6A",
    "error": "#FF5252",
    "warning": "#FFB300",
    "muted": "#78909C",
    "highlight": "#1E2A3A",
    "border": "#263040",
    "text": "#B0BEC5",
    "textStrong": "#ECEFF1",
    "background": "#0D1520",
    "backgroundSecondary": "#1A2535"
  }
}
```

**Appears in menu as:** `Acme Dark` (or `my-plugin: Acme Dark` if namespaced)

---

### Component Type 7: Bin Executables (`bin/`)

Scripts in `bin/` are added to the Bash tool's PATH for the session duration. Any language works; shebang line required for interpreted scripts.

**Example — a multi-language deploy-check script:**

```bash
#!/usr/bin/env bash
# bin/deploy-check
# Validates pre-deployment conditions

set -euo pipefail

TARGET="${CLAUDE_PLUGIN_OPTION_DEPLOYTARGET:-staging}"
LOG="${CLAUDE_PLUGIN_DATA}/deploy-checks.log"
VERBOSE="${CLAUDE_PLUGIN_OPTION_VERBOSELOGGING:-false}"

mkdir -p "$(dirname "$LOG")"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

log() {
  echo "$TIMESTAMP $*" | tee -a "$LOG"
}

log "=== Pre-deployment check for $TARGET ==="

# Check 1: Clean working tree
if ! git diff --quiet HEAD 2>/dev/null; then
  log "FAIL: Uncommitted changes present"
  git status --short
  exit 1
fi
log "OK: Working tree clean"

# Check 2: Tests passing (if CI flag not set)
if [ "${CI:-false}" != "true" ]; then
  log "INFO: Running quick test check..."
  if ! npm test --silent 2>&1 | tail -5; then
    log "FAIL: Tests not passing"
    exit 1
  fi
  log "OK: Tests passing"
fi

# Check 3: Required environment variables
REQUIRED_VARS=(DEPLOY_API_KEY DEPLOY_REGION)
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    log "FAIL: Required variable $var is not set"
    exit 1
  fi
done
log "OK: All required env vars present"

log "=== All checks passed — ready to deploy to $TARGET ==="
```

---

### Component Type 8: Hooks (`hooks/hooks.json`)

Hooks fire at session lifecycle events. Plugin hooks use the same event system as project hooks but reference `${CLAUDE_PLUGIN_ROOT}` and `${CLAUDE_PLUGIN_DATA}`.

**Example — hooks.json with three events:**

```json
{
  "hooks": [
    {
      "event": "SessionStart",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/deploy-check --quiet"
    },
    {
      "event": "PreToolUse",
      "matcher": {
        "tool": "Bash",
        "commandContains": "git push"
      },
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/push-guard --log ${CLAUDE_PLUGIN_DATA}/push.log"
    },
    {
      "event": "PostToolUse",
      "matcher": {
        "tool": "Bash",
        "commandContains": "deploy"
      },
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/notify-slack --webhook ${user_config.slackWebhook} --message 'Deploy command executed in session'"
    },
    {
      "event": "Stop",
      "command": "echo \"$(date -u) session ended\" >> ${CLAUDE_PLUGIN_DATA}/sessions.log"
    }
  ]
}
```

**Hook event types available:** `SessionStart`, `Stop`, `PreToolUse`, `PostToolUse`, `InstructionsLoaded`, `SubagentStart`, `SubagentStop`, `ContextCompacted`

---

### Component Type 9: MCP Servers (`.mcp.json`)

Plugin MCP servers start automatically and expose tools to Claude. Server names are namespaced with the plugin name.

**Example — .mcp.json with a deployment API server:**

```json
{
  "mcpServers": {
    "deploy-api": {
      "type": "stdio",
      "command": "node",
      "args": ["${CLAUDE_PLUGIN_ROOT}/mcp/server.js"],
      "env": {
        "API_KEY": "${user_config.apiKey}",
        "REGION": "${user_config.region}",
        "DATA_DIR": "${CLAUDE_PLUGIN_DATA}",
        "LOG_LEVEL": "info"
      }
    },
    "audit-log": {
      "type": "stdio",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/audit-mcp",
      "args": ["--db", "${CLAUDE_PLUGIN_DATA}/audit.db"]
    }
  }
}
```

`deploy-api` is registered as `my-plugin:deploy-api` in Claude Code's MCP registry. Claude can use its tools without any manual MCP configuration by the user.

---

### Component Type 10: LSP Servers (`.lsp.json`)

Language Server Protocol servers provide IDE-like intelligence for custom file types (deployment configs, DSLs, etc.).

**Example — .lsp.json for a deployment DSL:**

```json
{
  "lspServers": {
    "deploy-dsl": {
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/deploy-lsp",
      "args": ["--stdio", "--log", "${CLAUDE_PLUGIN_DATA}/lsp.log"],
      "filetypes": ["*.deploy.yaml", "*.release.json", "*.pipeline.yml"],
      "rootPatterns": [".deploy-config.json", "deploy.yaml", "Deployfile"],
      "settings": {
        "validateOnSave": true,
        "schemaPath": "${CLAUDE_PLUGIN_ROOT}/schemas/deploy-schema.json"
      }
    }
  }
}
```

When Claude reads or edits a `*.deploy.yaml` file, this LSP server provides completions, validation, and hover information.

---

## 17. `plugin.json` — Complete Schema Reference

Every field the plugin manifest supports, with types, defaults, and usage guidance.

```json
{
  // ──────────────────────────────────────────────────────
  // IDENTITY (all required)
  // ──────────────────────────────────────────────────────

  "name": "deploy-helper",
  // string, required
  // The namespace identifier for all plugin components.
  // Must be unique within the user's installed plugins.
  // Convention: lowercase-with-hyphens, no @scope prefix.
  // This becomes the prefix: /deploy-helper:command-name

  "version": "2.3.1",
  // string, required
  // Semver version string. Used for update detection.

  "description": "Deployment automation for Claude Code",
  // string, required
  // One-sentence description shown in `claude plugin list` and marketplace.

  // ──────────────────────────────────────────────────────
  // OPTIONAL METADATA
  // ──────────────────────────────────────────────────────

  "author": "Acme Corp <tools@acme.com>",
  // string, optional
  // Author name and optional email in npm author format.

  "homepage": "https://github.com/acme/deploy-helper",
  // string, optional
  // Shown in `claude plugin info` and marketplace listing.

  "repository": {
    "type": "git",
    "url": "https://github.com/acme/deploy-helper.git"
  },
  // object, optional
  // Same shape as npm's repository field.

  "license": "MIT",
  // string, optional
  // SPDX license identifier.

  "keywords": ["deployment", "release", "CI/CD", "slack"],
  // string[], optional
  // Used for marketplace search. Include synonyms for discoverability.

  // ──────────────────────────────────────────────────────
  // COMPONENT DECLARATIONS
  // ──────────────────────────────────────────────────────

  "commands": "commands",
  // string | null, optional, default: "commands"
  // Directory containing command .md files.
  // Set to null to disable command discovery.

  "agents": "agents",
  // string | null, optional, default: "agents"
  // Directory containing agent .md files.

  "skillsPath": "skills",
  // string | null, optional, default: "skills"
  // Directory containing skill subdirectories (each with SKILL.md).

  "outputStyles": "output-styles",
  // string | null, optional, default: "output-styles"
  // Directory containing output style .md files.

  "themes": "themes",
  // string | null, optional, default: "themes"
  // Directory containing theme .json files.

  "hooks": "hooks/hooks.json",
  // string, optional
  // Path to hooks definition JSON file, relative to plugin root.
  // No default — omit to disable hooks.

  "mcpServers": ".mcp.json",
  // string, optional
  // Path to MCP server definitions JSON file.
  // No default — omit if no MCP servers.

  "lspServers": ".lsp.json",
  // string, optional
  // Path to LSP server definitions JSON file.

  "monitors": "monitors/monitors.json",
  // string, optional
  // Path to monitors definition JSON file. Requires v2.1.105+.

  // ──────────────────────────────────────────────────────
  // RUNTIME DEPENDENCIES
  // ──────────────────────────────────────────────────────

  "dependencies": {
    // Each key is a dependency name; value is a version spec.

    "node": ">=20.0.0",
    // Runtime: Node.js minimum version.

    "python3": ">=3.11",
    // Runtime: Python 3 minimum version.

    "jq": "*",
    // System binary: any version in PATH.

    "git": ">=2.40",
    // System binary: minimum version (checked via `git --version`).

    "@acme/shared-lib": "^2.0.0",
    // npm package: semver range, installed automatically.

    "@private/sdk": {
      "version": "1.2.3",
      "registry": "https://npm.internal.acme.com"
    }
    // npm package: pinned install from specific registry.
  },

  // ──────────────────────────────────────────────────────
  // USER CONFIGURATION
  // ──────────────────────────────────────────────────────

  "userConfig": {
    // Each key is a user-settable configuration option.

    "deployTarget": {
      "description": "Deployment environment (staging, production, etc.)",
      // string, required — shown to user in `claude plugin config list`

      "type": "string",
      // "string" | "boolean", required

      "default": "staging"
      // string | boolean, optional — value used when user has not configured
    },

    "slackWebhook": {
      "description": "Slack incoming webhook URL for deployment notifications",
      "type": "string",
      "sensitive": true
      // boolean, optional, default false
      // If true: stored in OS keychain, never in plaintext on disk,
      // never appears in process listings.
    },

    "verboseLogging": {
      "description": "Enable verbose output from deploy scripts",
      "type": "boolean",
      "default": false
    }
  }
}
```

### Field Quick Reference

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `name` | string | Yes | — | Plugin namespace prefix |
| `version` | string | Yes | — | Semver |
| `description` | string | Yes | — | One-line description |
| `author` | string | No | — | Name and optional email |
| `homepage` | string | No | — | Plugin website |
| `repository` | object | No | — | `{type, url}` |
| `license` | string | No | — | SPDX identifier |
| `keywords` | string[] | No | — | Search terms |
| `commands` | string\|null | No | `"commands"` | Commands directory |
| `agents` | string\|null | No | `"agents"` | Agents directory |
| `skillsPath` | string\|null | No | `"skills"` | Skills directory |
| `outputStyles` | string\|null | No | `"output-styles"` | Styles directory |
| `themes` | string\|null | No | `"themes"` | Themes directory |
| `hooks` | string | No | — | Path to hooks.json |
| `mcpServers` | string | No | — | Path to .mcp.json |
| `lspServers` | string | No | — | Path to .lsp.json |
| `monitors` | string | No | — | Path to monitors.json |
| `dependencies` | object | No | — | Runtime requirements |
| `userConfig` | object | No | — | User-configurable settings |

---

## 18. `${CLAUDE_PLUGIN_ROOT}` vs `${CLAUDE_PLUGIN_DATA}` — Explained with Examples

These two variables are the most important concept in plugin development. Every plugin author needs to understand exactly what they point to and why they behave differently.

### What Each Variable Points To

```
${CLAUDE_PLUGIN_ROOT}  →  Where the plugin package is installed (read-only)
${CLAUDE_PLUGIN_DATA}  →  Where the plugin stores persistent data (writable)
```

**Concrete paths:**

```
After: claude plugin install @acme/deploy-helper

${CLAUDE_PLUGIN_ROOT}:
  ~/.claude/plugins/node_modules/@acme/deploy-helper/
  (the unpacked npm package directory)

${CLAUDE_PLUGIN_DATA}:
  ~/.claude/plugin-data/deploy-helper/
  (created automatically; never deleted on update/reinstall)
```

### The Update Problem

When you run `claude plugin update`:

```
Before update:
  ${CLAUDE_PLUGIN_ROOT} = ~/.claude/plugins/node_modules/@acme/deploy-helper/
  Contains: plugin.json (v2.3.1), bin/deploy-check, skills/...

After update (to v2.4.0):
  ${CLAUDE_PLUGIN_ROOT} = ~/.claude/plugins/node_modules/@acme/deploy-helper/
  Contains: plugin.json (v2.4.0), bin/deploy-check (new version), skills/...

Any files you wrote to ${CLAUDE_PLUGIN_ROOT} are GONE.
Any files in ${CLAUDE_PLUGIN_DATA} are UNCHANGED.
```

This is why the rule is: **${CLAUDE_PLUGIN_ROOT} is static files; ${CLAUDE_PLUGIN_DATA} is everything dynamic**.

### Where Each Type of Data Belongs

```
${CLAUDE_PLUGIN_ROOT}/          ← READ ONLY (plugin package files)
├── plugin.json                 ← plugin metadata
├── commands/                   ← command definitions
├── skills/                     ← skill definitions
├── bin/deploy-check            ← executable scripts
├── config/defaults.json        ← static default configuration
├── schemas/                    ← validation schemas
└── mcp/server.js               ← MCP server code

${CLAUDE_PLUGIN_DATA}/          ← WRITABLE (runtime data)
├── deploy.log                  ← deployment history
├── sessions.log                ← session audit log
├── security-reviews.log        ← security review findings
├── cache/                      ← cached API responses
│   └── ci-status-cache.json
├── config-override.json        ← user-specific config (if needed)
└── audit.db                    ← SQLite audit database
```

### Code Examples

**Correct usage in a bin script:**

```bash
#!/usr/bin/env bash
# bin/deploy-check

# Read static config from plugin root (OK — read-only)
DEFAULTS="${CLAUDE_PLUGIN_ROOT}/config/defaults.json"
SCHEMA="${CLAUDE_PLUGIN_ROOT}/schemas/deploy-config.json"

# Write all dynamic data to plugin data directory
LOG="${CLAUDE_PLUGIN_DATA}/deploy.log"
CACHE="${CLAUDE_PLUGIN_DATA}/cache/"
mkdir -p "$CACHE"

# Read a cached value (from previous call)
CACHED_STATUS="${CACHE}/last-ci-status.txt"
if [ -f "$CACHED_STATUS" ]; then
  echo "Last CI status: $(cat "$CACHED_STATUS")"
fi

# Write a new log entry
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) deploy-check run" >> "$LOG"

# Validate user config against the bundled schema (root is fine for reading)
jq -r '.' "$DEFAULTS"
```

**Incorrect usage (writes to plugin root — will be lost on update):**

```bash
# BAD — don't do this
LOG="${CLAUDE_PLUGIN_ROOT}/logs/deploy.log"  ← written to package dir
touch "${CLAUDE_PLUGIN_ROOT}/cache/api-key"  ← will be overwritten on update
```

**Correct usage in hooks.json:**

```json
{
  "hooks": [
    {
      "event": "SessionStart",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/init-check --config ${CLAUDE_PLUGIN_ROOT}/config/defaults.json --log ${CLAUDE_PLUGIN_DATA}/sessions.log"
    }
  ]
}
```

**Correct usage in monitors:**

```json
{
  "monitors": [
    {
      "name": "error-tail",
      "description": "Application error log monitor",
      "command": "tail",
      "args": ["-f", "${CLAUDE_PLUGIN_DATA}/app-errors.log"],
      "when": "always"
    }
  ]
}
```

### In MCP Server Processes

Both variables are available as environment variables in all plugin subprocesses:

```javascript
// mcp/server.js
const pluginRoot = process.env.CLAUDE_PLUGIN_ROOT;  // read-only files
const pluginData = process.env.CLAUDE_PLUGIN_DATA;  // writable storage

const config = JSON.parse(
  fs.readFileSync(path.join(pluginRoot, 'config', 'schema.json'))
);

const db = new Database(
  path.join(pluginData, 'audit.db')  // writable SQLite database
);
```

---

## 19. Plugin Development — Step-by-Step Tutorial

This tutorial builds a complete, production-ready plugin from scratch: a `git-assistant` plugin that adds git workflow commands, a smart commit skill, and a CI status monitor.

### Step 0: Prerequisites

```bash
# Ensure Claude Code is installed
claude --version
# → v2.1.126 (or later)

# Ensure Node.js is available
node --version
# → v20.x or later recommended

# Create working directory
mkdir git-assistant-plugin
cd git-assistant-plugin
```

### Step 1: Initialize the npm Package

```bash
npm init -y
```

Edit `package.json`:

```json
{
  "name": "@youorg/git-assistant",
  "version": "1.0.0",
  "description": "Git workflow automation for Claude Code",
  "license": "MIT",
  "author": "Your Name <you@example.com>"
}
```

### Step 2: Create the Plugin Manifest

```bash
touch plugin.json
```

```json
{
  "name": "git-assistant",
  "version": "1.0.0",
  "description": "Git workflow automation — smart commits, PR creation, branch management",
  "author": "Your Name",
  "license": "MIT",
  "keywords": ["git", "commit", "pr", "branch", "workflow"],
  "userConfig": {
    "defaultBranch": {
      "description": "Default base branch for PRs (main, master, develop, etc.)",
      "type": "string",
      "default": "main"
    },
    "conventionalCommits": {
      "description": "Enforce conventional commit format (feat/fix/chore/etc.)",
      "type": "boolean",
      "default": true
    }
  }
}
```

### Step 3: Create the Directory Structure

```bash
mkdir -p commands agents skills/commit skills/pr-review bin hooks
```

### Step 4: Write the Commit Skill

The most-used component: auto-invoked whenever the user wants to commit.

```bash
cat > skills/commit/SKILL.md << 'EOF'
---
description: >
  Git commit creation — invoke when the user asks to commit, create a commit,
  stage changes and commit, or says "commit this", "save my work", "git commit".
  Also invoke for conventional commit formatting and commit message generation.
---

# Smart Commit Skill

When creating a git commit:

1. Check what's staged: `git diff --staged --stat`
   - If nothing staged, ask: "Nothing is staged. Stage specific files or all?"
2. Review the diff: `git diff --staged`
3. Generate a commit message:
   - If ${CLAUDE_PLUGIN_OPTION_CONVENTIONALCOMMITS} is "true":
     Format: `type(scope): description` where type ∈ {feat, fix, refactor, test, docs, chore, perf}
   - Else: descriptive imperative-mood sentence
4. Show the proposed message and ask: "Commit with this message? (Y/edit/cancel)"
5. On approval: `git commit -m "proposed message"`
6. Log the commit: `echo "$(date -u) $(git log --oneline -1)" >> ${CLAUDE_PLUGIN_DATA}/commit.log`
EOF
```

### Step 5: Write a PR Command

```bash
cat > commands/pr.md << 'EOF'
---
description: Create a pull request for the current branch with auto-generated description
allowed-tools: Bash
---

# Create Pull Request

Create a GitHub PR for the current branch.

## Repository context
Branch: !`git rev-parse --abbrev-ref HEAD`
Base: ${CLAUDE_PLUGIN_OPTION_DEFAULTBRANCH}
Commits: !`git log --oneline $(git merge-base HEAD origin/${CLAUDE_PLUGIN_OPTION_DEFAULTBRANCH} 2>/dev/null || echo HEAD~5)..HEAD`
Changed files: !`git diff --name-only origin/${CLAUDE_PLUGIN_OPTION_DEFAULTBRANCH} 2>/dev/null || git diff --name-only HEAD~5`

## Generate and create the PR
1. Write a PR title: imperative mood, ≤72 characters, no period
2. Write a PR body:
   - **Summary**: what changed and why (2–4 sentences)
   - **Changes**: bullet list of specific changes
   - **Testing**: how to verify
3. Run: `gh pr create --title "TITLE" --body "BODY" --base ${CLAUDE_PLUGIN_OPTION_DEFAULTBRANCH}`

Extra context from user: $ARGUMENTS
EOF
```

### Step 6: Write a Pre-commit Hook Validator

```bash
cat > bin/commit-check << 'EOF'
#!/usr/bin/env bash
# Validates commit message format
set -euo pipefail

CONVENTIONAL="${CLAUDE_PLUGIN_OPTION_CONVENTIONALCOMMITS:-true}"
LOG="${CLAUDE_PLUGIN_DATA}/hooks.log"
mkdir -p "$(dirname "$LOG")"

echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) commit-check called" >> "$LOG"

if [ "$CONVENTIONAL" != "true" ]; then
  echo "Conventional commits not enforced — skipping check"
  exit 0
fi

# Check last commit message
LAST_MSG=$(git log --format="%s" -1 2>/dev/null || echo "")
PATTERN="^(feat|fix|refactor|test|docs|chore|perf|style|ci|build)(\([^)]+\))?: .+"

if [ -n "$LAST_MSG" ] && ! echo "$LAST_MSG" | grep -qE "$PATTERN"; then
  echo "WARNING: Last commit '$LAST_MSG' does not follow conventional commits format"
  echo "  Expected: type(scope): description"
  echo "  Types: feat|fix|refactor|test|docs|chore|perf|style|ci|build"
fi

echo "Commit check complete"
EOF
chmod +x bin/commit-check
```

### Step 7: Define Hooks

```bash
cat > hooks/hooks.json << 'EOF'
{
  "hooks": [
    {
      "event": "SessionStart",
      "command": "${CLAUDE_PLUGIN_ROOT}/bin/commit-check"
    }
  ]
}
EOF
```

Update `plugin.json` to declare the hooks file:

```json
{
  "name": "git-assistant",
  "version": "1.0.0",
  "description": "Git workflow automation",
  "hooks": "hooks/hooks.json",
  "userConfig": {
    "defaultBranch": {
      "description": "Default base branch for PRs",
      "type": "string",
      "default": "main"
    },
    "conventionalCommits": {
      "description": "Enforce conventional commit format",
      "type": "boolean",
      "default": true
    }
  }
}
```

### Step 8: Test Locally

```bash
# Install from local path
claude plugin install /path/to/git-assistant-plugin --scope local

# Verify installation
claude plugin list
# → git-assistant  local  v1.0.0  Git workflow automation

# Set configuration
claude plugin config set git-assistant defaultBranch main
claude plugin config set git-assistant conventionalCommits true

# Verify config
claude plugin config list git-assistant
# → defaultBranch: main
# → conventionalCommits: true

# Start a session and test
claude

# Test the skill (auto-invoked)
> commit my changes

# Test the command
> /git-assistant:pr

# Verify skill appears in /skills
> /skills
# Should list: commit  git-assistant  [auto-invocation description]
```

### Step 9: Publish to npm

```bash
# Log in to npm
npm login

# Publish (use --access public for scoped packages)
npm publish --access public

# Verify publication
npm view @youorg/git-assistant

# Install from npm
claude plugin install @youorg/git-assistant
```

---

## 20. Plugin Debugging Guide

When a plugin doesn't work as expected, follow this systematic debugging process.

### Level 1: Installation Verification

```bash
# Check if plugin is installed
claude plugin list
# → git-assistant  user  v1.0.0  Git workflow automation

# Check plugin details
claude plugin info git-assistant
# Shows: all declared components, config values, installation path

# If plugin not showing: check the installation scope
claude plugin list --scope user
claude plugin list --scope project
claude plugin list --scope local
```

### Level 2: Manifest Validation

```bash
# View the plugin root path
claude plugin info git-assistant | grep "Root:"
# → Root: ~/.claude/plugins/node_modules/@youorg/git-assistant/

# Manually read the manifest
cat ~/.claude/plugins/node_modules/@youorg/git-assistant/plugin.json

# Check for JSON syntax errors
cat plugin.json | python3 -m json.tool
# If error: fix the JSON syntax
```

### Level 3: Component Discovery Debugging

```bash
# Check if commands are discovered
ls ~/.claude/plugins/node_modules/@youorg/git-assistant/commands/
# Expected: release.md  rollback.md  etc.

# Check if skills are in the right structure
ls ~/.claude/plugins/node_modules/@youorg/git-assistant/skills/
# Expected: commit/  pr-review/  each with SKILL.md
ls ~/.claude/plugins/node_modules/@youorg/git-assistant/skills/commit/
# Expected: SKILL.md

# Check bin permissions
ls -la ~/.claude/plugins/node_modules/@youorg/git-assistant/bin/
# Expected: -rwxr-xr-x (executable bit set)

# Fix missing executable bit
chmod +x ~/.claude/plugins/node_modules/@youorg/git-assistant/bin/*
```

### Level 4: Session Debugging

```bash
# Start Claude Code and inspect the debug panel
claude
> /debug

# Look for:
# - Plugin name in LOADED FILES section
# - Hook entries in ACTIVE HOOKS section
# - MCP server status in MCP SERVERS section

> /skills
# Check if plugin skills appear with correct namespace:
# commit   git-assistant   [description...]

> /help
# Check if plugin commands appear:
# /git-assistant:pr   Create a pull request...
```

### Level 5: Hook Debugging

```bash
# If hooks aren't firing, check the hook script directly
bash ~/.claude/plugins/node_modules/@youorg/git-assistant/bin/commit-check
# Watch for errors

# Check plugin data directory for logs
ls ~/.claude/plugin-data/git-assistant/
cat ~/.claude/plugin-data/git-assistant/hooks.log

# Check hook script permissions
ls -la ~/.claude/plugins/node_modules/@youorg/git-assistant/bin/
# Must be executable

# Test the hook command manually with the env vars
CLAUDE_PLUGIN_ROOT=~/.claude/plugins/node_modules/@youorg/git-assistant \
CLAUDE_PLUGIN_DATA=~/.claude/plugin-data/git-assistant \
CLAUDE_PLUGIN_OPTION_CONVENTIONALCOMMITS=true \
~/.claude/plugins/node_modules/@youorg/git-assistant/bin/commit-check
```

### Level 6: Config Variable Debugging

```bash
# Verify config is set
claude plugin config list git-assistant
# → conventionalCommits: true
# → defaultBranch: main

# Check how config appears as env vars in scripts
# In a bin script, add debug output:
echo "OPTION_CONVENTIONALCOMMITS=${CLAUDE_PLUGIN_OPTION_CONVENTIONALCOMMITS:-not set}"
echo "OPTION_DEFAULTBRANCH=${CLAUDE_PLUGIN_OPTION_DEFAULTBRANCH:-not set}"
```

### Level 7: Complete Reset

If nothing works, clean install:

```bash
# Remove the plugin
claude plugin remove git-assistant --scope local

# Verify removal
claude plugin list

# Reinstall
claude plugin install /path/to/git-assistant-plugin --scope local

# Or from npm
claude plugin install @youorg/git-assistant

# Reconfigure
claude plugin config set git-assistant defaultBranch main
```

### Common Error Patterns

```
Error: "Command not found: /git-assistant:pr"
Cause:  plugin.json missing or has JSON syntax error
Fix:    validate plugin.json with `python3 -m json.tool plugin.json`

Error: "Skill 'git-assistant:commit' not auto-invoked"
Cause:  description field in SKILL.md doesn't match user's phrasing
Fix:    expand the description with more synonyms and trigger phrases

Error: "Hook script failed with exit code 126"
Cause:  bin script not executable
Fix:    chmod +x bin/your-script

Error: "${CLAUDE_PLUGIN_OPTION_KEY} not expanded"
Cause:  config key not set by user
Fix:    claude plugin config set plugin-name key value
        or add a "default" to the userConfig declaration

Error: "Monitor not starting"
Cause:  v2.1.105+ required for monitors
Fix:    claude --version; upgrade if needed
```

---

## 21. Distributing Plugins

### Option A: Public npm Registry

The standard distribution method. Anyone can install with `claude plugin install`.

```bash
# Publish
npm login
npm publish --access public    # for @scoped packages

# Users install with:
claude plugin install @youorg/git-assistant
```

**package.json best practices for public plugins:**

```json
{
  "name": "@youorg/claude-git-assistant",
  "version": "1.0.0",
  "description": "Git workflow automation for Claude Code",
  "keywords": ["claude-code", "claude-plugin", "git", "workflow"],
  "files": [
    "plugin.json",
    "commands/",
    "agents/",
    "skills/",
    "output-styles/",
    "themes/",
    "monitors/",
    "bin/",
    "hooks/",
    ".mcp.json",
    ".lsp.json",
    "settings.json"
  ],
  "engines": {
    "node": ">=20.0.0"
  }
}
```

The `files` array is critical — it controls what's included in the npm package. Without it, everything gets published (including development files, tests, node_modules).

---

### Option B: Private npm Registry

For internal organizational plugins:

```bash
# Set your registry (in .npmrc or via npm config)
npm config set @youorg:registry https://npm.internal.acme.com

# Publish to private registry
npm publish

# Users install with:
claude plugin install @youorg/git-assistant
# (their npm config must point @youorg to the private registry)
```

**GitHub Packages:**

```bash
# Authenticate with GitHub Packages
npm login --registry=https://npm.pkg.github.com --scope=@yourorg

# In package.json
{
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}

# Publish
npm publish

# Install
claude plugin install @yourorg/git-assistant \
  --registry https://npm.pkg.github.com
```

---

### Option C: Git URL Installation

Install directly from a git repository without publishing to npm:

```bash
# Install from GitHub
claude plugin install github:youorg/claude-git-assistant

# Install from a specific branch or tag
claude plugin install github:youorg/claude-git-assistant#v2.0.0
claude plugin install github:youorg/claude-git-assistant#feature-branch

# Install from GitLab
claude plugin install gitlab:youorg/claude-git-assistant

# Install from any git URL
claude plugin install git+https://github.com/youorg/claude-git-assistant.git
```

Git URL installation is useful for:
- Installing pre-release versions
- Installing forks of existing plugins
- Internal plugins not ready for npm publication
- Development/testing of specific branches

---

### Option D: Local Path Installation

For development and testing, or for plugins too organization-specific to publish:

```bash
# Install from an absolute path
claude plugin install /home/alice/dev/git-assistant --scope local

# Install from a relative path (resolved to absolute at install time)
claude plugin install ./git-assistant --scope local

# For shared team plugins: commit the directory to git and install via relative path
# (but prefer project-scoped install for team sharing)
claude plugin install ./tools/claude-plugins/git-assistant --scope project
```

**Team sharing without npm:**

```
project-repo/
├── tools/
│   └── claude-plugins/
│       └── git-assistant/       ← plugin directory committed to git
│           ├── plugin.json
│           ├── commands/
│           └── ...
└── CLAUDE.md:
    ## Claude Code Plugins
    Install the team plugin: claude plugin install ./tools/claude-plugins/git-assistant --scope project
```

Each team member installs the plugin once after cloning. Since it's in the git repo, everyone gets updates on `git pull`.

---

### Distribution Decision Matrix

```
Who needs the plugin?
│
├── Anyone on the internet
│   └── Public npm registry (@scope/plugin-name)
│
├── Our organization only
│   ├── Small team, simple setup
│   │   └── Git URL or local path in project repo
│   │
│   └── Multiple teams, needs versioning
│       └── Private npm registry (GitHub Packages, Artifactory, etc.)
│
└── Just me
    └── Local path install (~/.claude/plugins or --scope local)
        (No publication needed; your personal plugin directory)
```

---

### Publishing Plugins

Share plugins via GitHub/npm for others to install:

#### Directory Structure for Published Plugin

```
my-claude-plugin/
├── package.json           ← npm manifest (if publishing to npm)
├── plugin.json            ← Claude Code plugin manifest
├── README.md
├── commands/
│   └── my-command.md
├── agents/
│   └── my-agent.md
└── hooks/
    └── pre-bash.sh
```

#### package.json for npm Distribution

```json
{
  "name": "@yourorg/claude-plugin-my-plugin",
  "version": "1.0.0",
  "description": "Claude Code plugin for X",
  "keywords": ["claude-code", "claude-plugin"],
  "main": "plugin.json",
  "files": ["plugin.json", "commands/", "agents/", "hooks/", "skills/"]
}
```

#### Installation

```bash
# From npm
npm install -g @yourorg/claude-plugin-my-plugin
claude plugin install @yourorg/claude-plugin-my-plugin

# From GitHub
claude plugin install github:yourorg/claude-plugin-my-plugin

# From local path
claude plugin install ./my-claude-plugin

# List installed plugins
claude plugin list

# Uninstall
claude plugin uninstall my-plugin
```
