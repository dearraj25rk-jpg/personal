---
title: Permissions, Sandbox & Security
description: >
  Complete reference for Claude Code's permission system, tool allowlists and
  blocklists, sandbox architecture, enterprise security controls, permission modes,
  audit logging, and security best practices. Covers v2.1.126 (May 2026).
sidebar:
  order: 9
  label: Permissions & Security
lastUpdated: 2026-05-09
---

# Permissions, Sandbox & Security

> **Version:** v2.1.126 (May 6, 2026)

Claude Code's security model has four layers:

1. **Permission modes** — how aggressively Claude auto-executes tools
2. **Tool allowlists and blocklists** — explicit rules for which tools and commands are permitted
3. **Sandbox** — OS-level process isolation for the entire Claude Code session
4. **Enterprise managed settings** — organisation-wide policies that override all user config

---

## 1. Permission Modes

The permission mode controls whether Claude Code prompts the user before executing each tool.

| Mode | Behaviour | Appropriate Use |
|------|-----------|----------------|
| `default` | Prompts for each tool call | Interactive development |
| `acceptEdits` | Auto-accepts file edits, prompts for Bash | Semi-supervised automation |
| `autoAccept` | Accepts all tools without prompting | Trusted scripts, pre-reviewed tasks |
| `bypassPermissions` | Bypasses all checks | CI/CD inside sandboxed environments |
| `plan` | Never executes tools — plan only | Dry-run review before execution |

### Set mode via CLI

```bash
claude --permission-mode bypassPermissions --print "Fix all test failures"
```

### Set mode for a session

```
/permissions mode bypassPermissions
```

Or press `Shift+Tab` to cycle between Normal, Auto-Accept, and Plan modes.

### Set default mode in settings

```json
{
  "defaultPermissionMode": "acceptEdits"
}
```

---

## 2. Tool Allowlists

Allowlists specify which tools Claude is permitted to use, regardless of permission mode.

### Syntax

Tool allow/deny rules use a format of `ToolName(pattern)`:

```
ToolName             → matches the tool by name only
ToolName(*)          → any argument to that tool
ToolName(value)      → specific argument value only
ToolName(prefix:*)   → argument starting with prefix
```

### Configuration in settings.json

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "MultiEdit",
      "Glob",
      "Grep",
      "TodoWrite",
      "TodoRead",
      "Bash(git:*)",
      "Bash(npm test)",
      "Bash(npm run *)",
      "Bash(python -m pytest:*)",
      "Bash(dotnet test:*)",
      "WebFetch"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(ssh:*)",
      "WebSearch"
    ]
  }
}
```

**Precedence:** Enterprise managed > `deny` > `allow` > permission mode

### Interactive permission management

```
/permissions                     # View current allowlist
/permissions allow Bash(git:*)   # Add an allow rule
/permissions deny WebSearch      # Add a deny rule
/permissions remove Bash(git:*)  # Remove a rule
/permissions reset               # Reset to defaults
```

### Common allowlist patterns

#### Minimal read-only analysis agent

```json
{
  "permissions": {
    "allow": ["Read", "Glob", "Grep", "TodoRead"],
    "deny": ["Write", "Edit", "MultiEdit", "Bash", "Task", "WebFetch", "WebSearch"]
  }
}
```

#### CI/CD pipeline (controlled writes)

```json
{
  "permissions": {
    "allow": [
      "Read", "Write", "Edit", "MultiEdit", "Glob", "Grep",
      "Bash(git:*)",
      "Bash(npm:*)",
      "Bash(pytest:*)",
      "Bash(dotnet:*)",
      "TodoWrite", "TodoRead", "Task"
    ],
    "deny": [
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(ssh:*)",
      "Bash(scp:*)",
      "WebFetch",
      "WebSearch"
    ]
  }
}
```

#### Developer workstation (permissive)

```json
{
  "permissions": {
    "allow": ["*"],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(dd if=*)",
      "Bash(mkfs.*)"
    ]
  }
}
```

### `--allowedTools` and `--disallowedTools` CLI flags

```bash
# Allow only specific tools for this session
claude --allowedTools "Read,Glob,Grep" --print "Analyse the API surface"

# Disallow certain MCP tools
claude --disallowedTools "github:create_pull_request,github:merge_pull_request" \
       --print "Review the open PRs"
```

---

## 3. Sandbox Architecture

The sandbox provides OS-level process isolation for the entire Claude Code session, preventing malicious code or accidental commands from affecting the rest of the system.

### 3.1 What the sandbox does

- Runs Claude Code and all spawned tools in an isolated process group
- Restricts file system access to the project directory and approved paths
- Limits network access (optional — configurable)
- Prevents access to other processes' memory
- Monitors and logs all system calls (configurable)

### 3.2 Sandbox configuration

```json
{
  "sandbox": {
    "enabled": true,
    "networkAccess": "restricted",    // "full" | "restricted" | "none"
    "allowedPaths": [
      "${PROJECT_DIR}",
      "${HOME}/.claude",
      "/tmp"
    ],
    "blockedPaths": [
      "${HOME}/.ssh",
      "${HOME}/.aws",
      "${HOME}/.gnupg",
      "/etc/passwd",
      "/etc/shadow"
    ]
  }
}
```

### 3.3 Sandbox modes

| Mode | Isolation level | Use case |
|------|----------------|----------|
| Disabled | None | Full system access, maximum speed |
| Standard | File + process | Recommended for interactive use |
| Strict | File + process + network | High-security environments |

Enable strict mode:

```bash
claude --sandbox strict
```

Or in settings:

```json
{
  "sandbox": { "mode": "strict" }
}
```

### 3.4 Cloud sessions (claude.ai/code)

When running via the web interface (`claude.ai/code`), the entire session runs in a managed cloud sandbox:
- Full VM isolation per session
- GitHub repository access via OAuth
- No access to local file system (by design)
- Ephemeral — session data deleted on close

---

## 4. Enterprise Managed Settings

For organisations, IT administrators can configure Claude Code policies that override all user configuration.

### 4.1 Managed settings locations

| Platform | Path |
|----------|------|
| macOS | `/Library/Application Support/ClaudeCode/managed-settings.json` |
| Linux | `/etc/claude-code/managed-settings.json` |
| Windows | `C:\Program Files\ClaudeCode\managed-settings.json` |
| MDM/GPO | `HKEY_LOCAL_MACHINE\Software\Anthropic\ClaudeCode` (Windows Registry) |

### 4.2 Enterprise settings hierarchy

```
Server-managed (centrally pushed)
    ↓ overrides
MDM / OS policy (Jamf, Intune, Group Policy)
    ↓ overrides
File-based managed settings
    ↓ overrides
Windows HKCU registry
    ↓ overrides
All user/project configuration
    ↓ overrides
CLI flags
```

Enterprise managed settings **cannot be overridden** by CLI flags, environment variables, or any user/project settings.

### 4.3 Example managed settings

```json
{
  "allowedModels": ["claude-sonnet-4-6", "claude-haiku-4-5"],
  "disallowedModels": ["claude-opus-4-7"],
  "maxBudgetPerSessionUSD": 10.00,
  "permissions": {
    "allow": ["Read", "Write", "Edit", "Bash(git:*)", "Bash(dotnet:*)"],
    "deny": ["WebSearch", "WebFetch", "Bash(curl:*)", "Bash(wget:*)"]
  },
  "sandbox": { "mode": "standard" },
  "disableAutoUpdate": true,
  "requireProjectClaudeMd": true,
  "telemetry": { "enabled": true, "endpoint": "https://internal-otel.corp.com" },
  "mcpServers": {
    "corporate-tools": {
      "type": "http",
      "url": "https://mcp.corp.internal/v1",
      "headers": { "Authorization": "Bearer ${CORP_MCP_TOKEN}" }
    }
  }
}
```

### 4.4 Drop-in policy fragments

Large organisations can split managed settings across multiple files:

```
/etc/claude-code/managed-settings.d/
├── 00-base-policy.json
├── 10-allowed-models.json
├── 20-network-restrictions.json
└── 30-audit-logging.json
```

Fragments are merged in alphabetical order. Later fragments override earlier ones.

### 4.5 Enterprise CLAUDE.md

```
/Library/Application Support/ClaudeCode/CLAUDE.md  (macOS)
/etc/claude-code/CLAUDE.md                         (Linux)
C:\Program Files\ClaudeCode\CLAUDE.md              (Windows)
```

Enterprise CLAUDE.md is loaded at the **highest** priority — before user, project, and local CLAUDE.md files. Use it for:
- Corporate coding standards
- Regulatory compliance requirements
- Security policies
- Approved technology stacks

---

## 5. Audit Logging

### 5.1 Built-in audit trail

Claude Code writes a session log with all tool calls:

```bash
~/.claude/logs/session-{date}-{id}.jsonl
```

Each line is a JSON record:

```json
{
  "ts": "2026-05-06T14:23:01.123Z",
  "session_id": "sess_01abc...",
  "turn": 4,
  "tool": "Bash",
  "input": { "command": "git status" },
  "output": "...",
  "duration_ms": 234,
  "cost_usd": 0.0001
}
```

### 5.2 Hook-based audit logging

For more control, use a `PostToolUse` hook (see [Hooks System](./hooks-deep-dive)):

```python
#!/usr/bin/env python3
# ~/.claude/hooks/audit.py
import json, sys, datetime, os, hashlib

payload = json.load(sys.stdin)
log_dir = os.environ.get('AUDIT_LOG_DIR', '/var/log/claude-code')
os.makedirs(log_dir, exist_ok=True)

ts = datetime.datetime.utcnow().isoformat()
entry = {
    'ts': ts,
    'session': payload.get('session_id'),
    'user': os.environ.get('USER', 'unknown'),
    'project': payload.get('project_dir'),
    'tool': payload.get('tool_name'),
    'input': payload.get('tool_input'),
}

digest = hashlib.sha256(json.dumps(entry).encode()).hexdigest()[:8]
with open(f'{log_dir}/{ts}_{digest}.json', 'w') as f:
    json.dump(entry, f)

sys.exit(0)
```

### 5.3 OpenTelemetry integration

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
export OTEL_SERVICE_NAME=claude-code
export OTEL_RESOURCE_ATTRIBUTES=team=platform,environment=production
claude
```

All sessions, turns, and tool calls are traced to your observability stack (Datadog, Grafana, Splunk, etc.).

---

## 6. Security Best Practices

### For individual developers

1. **Never commit `.claude/settings.local.json`** — it may contain personal tokens
2. **Always gitignore `CLAUDE.local.md`** — auto-generated, may contain sensitive context
3. **Review tool calls in interactive mode** before switching to `autoAccept`
4. **Scope your CLAUDE.md carefully** — it's loaded every session; don't put secrets in it
5. **Use `--max-budget-usd`** to prevent accidental overspend
6. **Audit your hooks** — hook scripts run with your full user privileges

### For teams

1. **Commit `.mcp.json` without tokens** — use `${ENV_VAR}` expansion for secrets
2. **Create a team CLAUDE.md** with approved patterns and prohibited operations
3. **Use `.claude/rules/` for enforceable policies** — rules are harder to accidentally ignore
4. **Enable the Pre/PostToolUse audit hooks** — log all tool calls centrally
5. **Review subagent definitions** in `.claude/agents/` — agents inherit all permissions

### For CI/CD

1. **Always use `--max-budget-usd` and `--max-turns`** in automated pipelines
2. **Run Claude Code in Docker** with minimal mount points and network access
3. **Use `DISABLE_UPDATES=1`** to prevent unexpected version changes
4. **Never log prompts containing secrets** — secrets should be env vars, not prompt text
5. **Use `bypassPermissions` only inside a sandboxed environment** — not on production servers

### For enterprises

1. **Deploy managed-settings.json via MDM** (Jamf, Intune, SCCM)
2. **Pin allowed models** to control capability exposure and costs
3. **Block external network tools** (WebSearch, WebFetch) unless required
4. **Require enterprise CLAUDE.md** with `requireProjectClaudeMd: true`
5. **Route to private Bedrock/Vertex endpoints** — data never leaves your cloud
6. **Enable OTel export** to your SIEM for full audit capability
7. **Review and rotate MCP server tokens** quarterly

---

## 7. MCP Security

MCP servers are a common attack surface. See [MCP Servers Guide](./mcp-servers-guide) for details, but key points:

### Prompt injection via MCP

A malicious MCP server can return content designed to override Claude's instructions. Mitigations:
- Use `PreToolUse` hooks to validate MCP tool calls
- Only install servers you control or from trusted sources
- Use enterprise-managed MCP to restrict available servers

### `--disallowedTools` for MCP

```bash
# Block all GitHub MCP tools except read operations
claude --disallowedTools "github:create_pull_request,github:merge_pull_request,github:push_files" \
       --print "Review the codebase"
```

### CVE-2025-6514 (mcp-remote)

`mcp-remote` versions before `0.1.3` allowed OS command injection via a malicious MCP server response. **Update if using `mcp-remote`.**

---

## 8. The Trust Model

Claude Code's trust model has three principals:

```
Operators (enterprise admins)   →  highest trust
    set managed-settings.json, CLAUDE.md
    
Users (individual developers)   →  medium trust
    set settings.json, project CLAUDE.md, rules, skills

Humans (end users of Claude)    →  context-dependent trust
    set session prompts
```

**Operators can restrict user actions** (e.g., block WebSearch). **Users can restrict Claude's actions** (e.g., require tests before writing). Claude Code enforces these boundaries at the tool execution level, not at the prompt level.

---

## Related Guides

- [CLI Technical Reference](./claude-code-reference) — Section 15: Permission System, Section 16: Sandbox
- [Hooks System](./hooks-deep-dive) — PreToolUse blocking hooks for security enforcement
- [MCP Servers Guide](./mcp-servers-guide) — MCP security and prompt injection
- [CI/CD Integration](./cicd-integration) — `bypassPermissions` in pipelines
