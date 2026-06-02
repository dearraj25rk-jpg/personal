---
title: Troubleshooting Guide
description: >
  Comprehensive Claude Code troubleshooting reference — common error messages with diagnosis steps,
  authentication failures, MCP connection issues, hook failures, performance debugging,
  context window problems, worktree conflicts, Agent Teams issues, CI/CD pipeline debugging,
  sandbox permission errors, and health-check commands. Claude Code v2.1.126 (May 2026).
sidebar:
  order: 25
lastUpdated: 2026-06-02
---

# Troubleshooting Guide

> **Version:** v2.1.126 (May 19, 2026)

> **June 2026 update:** Added sections 10 and 11 covering /doctor auto-repair, /debug session diagnostics, and an extended error dictionary with 30+ entries covering binary, auth, MCP, hooks, context, and sandbox errors.

This guide is a dense diagnostic reference. Each section covers a specific failure category with exact error messages, root-cause analysis, and resolution steps. Use the [Error Message Dictionary](#error-message-dictionary) at the end to jump directly from an error string to its fix.

---

## Quick Diagnostic Commands

Run these first. They resolve the majority of environmental issues without further investigation.

```bash
# Full auto-diagnosis — checks PATH, Node, auth, config files, MCP, hooks
/doctor

# Detailed session state dump — version, model, context usage, loaded files, MCP servers
/debug

# Live token budget — how much context is in use right now
/context

# MCP server status — which servers are connected, which failed to start
/mcp

# Hook system status — which hooks are registered, last execution results
/hooks

# Version confirmation
claude --version
```

**`/doctor` is your first stop.** It runs a structured checklist and offers to auto-fix common problems such as broken f-key bindings, missing configuration directories, and stale MCP socket files. If `/doctor` reports everything healthy but the problem persists, continue to the relevant section below.

---

## 1. Authentication & Setup Issues

### 1.1 `claude: command not found`

**Symptoms:** The `claude` binary is not on `$PATH` after installation.

**Diagnosis:**

```bash
# Confirm the binary exists
ls -la ~/.npm-global/bin/claude 2>/dev/null || \
  ls -la /usr/local/bin/claude 2>/dev/null || \
  which claude 2>/dev/null || echo "NOT FOUND"

# Check where npm installs global binaries
npm config get prefix
```

**Fixes:**

1. **npm global prefix not in PATH** (most common):

   ```bash
   # Add to ~/.bashrc or ~/.zshrc
   export PATH="$(npm config get prefix)/bin:$PATH"
   source ~/.bashrc
   ```

2. **Native binary path** (v2.1.113+ uses a native binary, not npm):

   ```bash
   # Default install location for native binary
   export PATH="$HOME/.claude/bin:$PATH"
   ```

3. **Reinstall cleanly:**

   ```bash
   npm uninstall -g @anthropic-ai/claude-code
   npm install -g @anthropic-ai/claude-code
   # OR for native binary installer:
   curl -fsSL https://claude.ai/install.sh | sh
   ```

4. **Verify post-install:**

   ```bash
   claude --version
   # Expected: claude v2.1.126 (...)
   ```

---

### 1.2 API Key Errors

#### `ANTHROPIC_API_KEY is not set`

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
# Or persist it:
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.bashrc
```

If you set the key in `.claude/settings.json` or `~/.claude/settings.json`, confirm the key is under `"env"`:

```json
{
  "env": {
    "ANTHROPIC_API_KEY": "sk-ant-api03-..."
  }
}
```

#### `Invalid API key format`

API keys for direct Anthropic access begin with `sk-ant-api03-`. Keys that start with `sk-ant-` (older format) or `sk-` (generic) indicate a wrong key or a key from a different product. Retrieve a fresh key from [console.anthropic.com](https://console.anthropic.com) → API Keys.

#### `AuthenticationError: 401`

- Key is syntactically valid but has been revoked or belongs to a different organisation.
- Check the key in console.anthropic.com → your org → API Keys → verify status is "Active".

#### `RateLimitError: 429` / `quota exceeded`

```
Error: 429 {"type":"error","error":{"type":"rate_limit_error","message":"Rate limit exceeded"}}
```

- You have hit your organisation's requests-per-minute or tokens-per-minute ceiling.
- Check usage at console.anthropic.com → Usage.
- Immediate mitigation: reduce `--max-turns`, add `--effort low` to use smaller models, or spread parallel jobs over time.
- Long-term: request a quota increase through your Anthropic account team.

---

### 1.3 Bedrock Authentication Failures

**Required environment:**

```bash
CLAUDE_CODE_USE_BEDROCK=1
AWS_REGION=us-east-1          # or whichever region your model is enabled in
# Plus ONE of:
AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + AWS_SESSION_TOKEN
# OR an IAM role attached to the compute (EC2/ECS/Lambda/GitHub OIDC)
```

**Common errors:**

#### `AccessDeniedException` from Bedrock

1. Confirm `claude-code-v3-5-sonnet` (or the model you want) is enabled in the Bedrock console for your region. Not all models are available in all regions.
2. Confirm your IAM identity has `bedrock:InvokeModel` and `bedrock:InvokeModelWithResponseStream` for the relevant model ARN.
3. Model access must be explicitly granted under **Bedrock → Model access** — it is not automatic.

#### `No credentials provided` / `Unable to locate credentials`

```bash
aws sts get-caller-identity   # validates credentials are resolvable
```

If this fails, your credential chain is broken. Check: environment variables → `~/.aws/credentials` → instance metadata endpoint.

#### Wrong region

```bash
# Claude 3.5 Sonnet v2 is not available in all regions
# Check availability:
aws bedrock list-foundation-models --region us-east-1 | grep claude
```

Set `AWS_REGION` or `ANTHROPIC_BEDROCK_REGION` to a region where the model is available.

#### Service tier / provisioned throughput

If using provisioned throughput, set:

```bash
ANTHROPIC_BEDROCK_ENDPOINT_URL="https://bedrock-runtime.us-east-1.amazonaws.com"
# Plus the provisioned model ARN as the model ID
```

---

### 1.4 Vertex AI Authentication Failures

**Required environment:**

```bash
CLAUDE_CODE_USE_VERTEX=1
ANTHROPIC_VERTEX_PROJECT_ID="my-gcp-project"
ANTHROPIC_VERTEX_REGION="us-east5"   # or another supported region
# Plus ONE of:
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
# OR gcloud ADC (Application Default Credentials)
# OR Workload Identity Federation (WIF)
```

#### `google.auth.exceptions.DefaultCredentialsError`

```bash
# Refresh ADC
gcloud auth application-default login
# Verify
gcloud auth application-default print-access-token
```

#### WIF (Workload Identity Federation) setup failures

For GitHub Actions using WIF:

```yaml
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: 'projects/PROJECT_NUM/locations/global/workloadIdentityPools/POOL/providers/PROVIDER'
    service_account: 'claude-code@PROJECT_ID.iam.gserviceaccount.com'
```

The service account needs `roles/aiplatform.user` on the project. WIF pool needs the `attribute.repository` condition to match your repository.

#### `PermissionDenied: 403` from Vertex

- Confirm `claude-3-5-sonnet@20241022` (or target model) is available in your Vertex region.
- Confirm `aiplatform.googleapis.com` is enabled in your project.
- Confirm the service account has `roles/aiplatform.user` or an equivalent custom role with `aiplatform.endpoints.predict`.

#### Project ID not set

```bash
ANTHROPIC_VERTEX_PROJECT_ID=$(gcloud config get-value project)
```

---

### 1.5 Node.js Version Requirements (Pre-v2.1.113)

**Before v2.1.113**, Claude Code shipped as a Node.js package requiring Node.js ≥18.0.0.

**v2.1.113+ ships a native binary** — Node.js is no longer required for the CLI itself. MCP servers written in JavaScript still need Node installed.

If you are on an older version:

```bash
node --version   # Must be ≥18.0.0
nvm install 20   # Install LTS
nvm use 20
claude --version # Retry
```

---

### 1.6 WSL2-Specific Issues

#### `claude: command not found` in WSL2

The Windows `PATH` is injected into WSL2 by default, which can mask the Linux npm global bin path. Confirm:

```bash
echo $PATH | tr ':' '\n' | grep -E 'npm|claude|node'
```

If only Windows paths appear, add the Linux path explicitly in `~/.bashrc`:

```bash
export PATH="$HOME/.npm-global/bin:/usr/local/bin:$PATH"
```

#### File permission issues (NTFS mount)

Files on the Windows filesystem (mounted under `/mnt/c/`) have permissions controlled by NTFS, not Linux. Claude Code may be unable to write lock files or set executable bits.

- **Fix:** Work in the Linux filesystem (`~/projects/...`), not `/mnt/c/...`.
- If you must use `/mnt/c/`, add `metadata` option to `/etc/wstab`: `C: /mnt/c drvfs defaults,metadata 0 0`.

#### WSL2 clock drift causing auth failures

WSL2 clocks can drift. This causes JWT tokens to fail signature validation.

```bash
# Force sync
sudo hwclock -s
# Or:
sudo ntpdate time.windows.com
```

#### Windows path in CLAUDE.md breaking `@import`

If your project CLAUDE.md uses `@import` with Windows-style paths (`C:\Users\...`), they will fail in WSL2. Use relative paths in `@import` directives or Linux-absolute paths.

---

## 2. Session & Context Issues

### 2.1 Context Window Exceeded

**Symptoms:**

- `Error: context_length_exceeded` in the session output
- Claude refuses to continue with "I've run out of context space"
- Session silently stalls after a long agentic run

**Understanding the budget:**

Claude 3.5 Sonnet has a 200,000-token context window. Claude Code reserves tokens for:
- System prompt + all loaded CLAUDE.md files (re-injected every turn)
- The conversation history (grows every turn)
- Tool results (can be very large for Bash or file reads)
- Output reserve (tokens Claude needs to generate a response)

**`/context` output interpretation:**

```
Context: 142,847 / 200,000 tokens (71%)
  System:       8,432
  History:    118,204
  Tools:       16,211
  Reserved:     8,000
```

When history + tools approaches ~190,000 tokens, the circuit breaker fires automatically.

**Manual compaction (best practice):**

Run `/compact` before hitting the ceiling — at roughly 60-70% context usage for long sessions:

```
/compact focus on the database migration task
```

The compaction prompt you provide guides what Claude retains in the summary. Be specific.

**Auto-compaction:**

Claude Code compacts automatically when the context exceeds approximately 85% of the window. You cannot disable auto-compaction, but you can adjust when it triggers by keeping CLAUDE.md files lean (see [Section 6.4](#64-compaction-too-frequent)).

**Circuit breaker behavior:**

If auto-compaction itself fails (e.g., the compact request to the API also exceeds limits), the session enters a "circuit breaker" state and emits:

```
Session paused: context compaction failed. Run /compact manually or start a new session.
```

Start a new session with `/new` or `claude --resume <session-id>` after clearing context.

---

### 2.2 "Claude Seems Confused" After Compaction

**Root cause:** Compaction replaces conversation history with a summary. Details that were only in the conversation (not in CLAUDE.md or MEMORY.md) are lost.

**Symptoms:** Claude forgets constraints you stated earlier, repeats work already done, or contradicts prior decisions.

**Fix — MEMORY.md patterns:**

Persist critical decisions to `MEMORY.md` before compaction:

```
> Update MEMORY.md: we decided to use PostgreSQL not SQLite, and the API must be REST not GraphQL
```

Then confirm:

```bash
cat MEMORY.md
```

Auto-memory (MEMORY.md) is located at:

```
<project-root>/.claude/MEMORY.md
```

It is loaded alongside CLAUDE.md every session. Treat it as a "working decisions" log.

**Structured MEMORY.md template:**

```markdown
# Session Memory

## Active Decisions
- Database: PostgreSQL 16 (decided 2026-05-28, not changing)
- API style: REST (GraphQL rejected — too complex for this use case)
- Auth: JWT with 15-minute expiry + refresh tokens

## Current Task State
- [ ] Migration script for users table — IN PROGRESS (schema done, data migration pending)
- [x] Auth middleware — COMPLETE

## Do Not Do
- Do not add any ORM — raw SQL only per ADR-003
```

---

### 2.3 Session Resume Failures

Claude Code identifies sessions by a hash derived from the project root path. If you move the project directory, the session hash changes and `/resume` will not find old sessions.

**Look up session IDs:**

```bash
# Sessions are stored in:
ls ~/.claude/sessions/
# Each file is named <session-id>.json
```

**Resume by ID:**

```bash
claude --resume abc123def456
```

**Resume most recent session in current directory:**

```bash
claude --continue
```

**If session file is corrupt:**

```bash
# Sessions directory:
~/.claude/sessions/

# Remove a specific corrupt session:
rm ~/.claude/sessions/<session-id>.json

# Or clear all sessions (loses history but fixes corruption):
rm ~/.claude/sessions/*.json
```

**Project identity hash:**

The hash is `sha256(canonical_absolute_path)`. Symlinks are resolved before hashing. If your project is accessed via different paths (symlink vs real path), they will have different session histories.

---

### 2.4 Auto-Memory Not Persisting

**Symptom:** You asked Claude to remember something, but it is gone next session.

**Check the MEMORY.md path:**

```bash
# Should exist after Claude writes to auto-memory:
cat .claude/MEMORY.md
```

If the file does not exist, Claude may have written to a different location. The path is computed as:

```
<project_root>/.claude/MEMORY.md
```

where `project_root` is the directory you started Claude Code from, not the current working directory inside the session.

**Manually confirm or write memory:**

```
/memory
```

This opens MEMORY.md in your configured editor. Any text you save here is loaded on next session start.

**Manual edit from shell:**

```bash
$EDITOR .claude/MEMORY.md
```

**The `/memory` command vs auto-memory:**

- `/memory` opens the file for direct editing.
- Auto-memory is written by Claude when you ask it to "remember" something. Claude writes to MEMORY.md automatically.
- Both write to the same file — there is no separate store.

---

### 2.5 CLAUDE.md Not Loading

**Symptom:** Instructions in CLAUDE.md are being ignored or unknown to Claude.

**Diagnosis:**

```
/debug
```

Look for `Loaded memory files:` in the output. If your CLAUDE.md is not listed, it is not loading.

**File location checklist:**

| CLAUDE.md type | Required location |
|----------------|------------------|
| Project | `<project-root>/CLAUDE.md` |
| User | `~/.claude/CLAUDE.md` |
| Enterprise | `/etc/claude-code/CLAUDE.md` (Linux) |
| Subdirectory | `<any-subdir>/CLAUDE.md` (loaded when Claude enters that dir) |

The project root is wherever you launched `claude` from. If you launched from `/home/user/my-app/src`, the project CLAUDE.md must be at `/home/user/my-app/src/CLAUDE.md`.

**`@import` chain errors:**

```markdown
<!-- In CLAUDE.md -->
@import ./docs/guidelines.md
@import ./team/standards.md
```

If an imported file does not exist, the import silently fails — no error is shown. Confirm each imported path exists relative to the CLAUDE.md file:

```bash
ls -la ./docs/guidelines.md ./team/standards.md
```

**File too large:**

CLAUDE.md files are loaded into the context window every turn. If the file exceeds approximately 50,000 tokens, Claude Code will warn and may truncate. Check size:

```bash
wc -c CLAUDE.md   # bytes
wc -w CLAUDE.md   # words (rough token estimate: words ÷ 0.75)
```

**`claudeMdExcludes`:**

Check `~/.claude/settings.json` and `.claude/settings.json` for `claudeMdExcludes`:

```json
{
  "claudeMdExcludes": ["~/.claude/CLAUDE.md"]
}
```

If the user CLAUDE.md is excluded, it will not load regardless of content.

---

### 2.6 Rules Not Triggering

Rules in `.claude/settings.json` use `paths:` globs to scope which files they apply to.

**Common syntax errors:**

```json
// WRONG — paths is not an array
"paths": "src/**/*.ts"

// CORRECT
"paths": ["src/**/*.ts"]

// WRONG — leading slash on relative pattern
"paths": ["/src/**/*.ts"]

// CORRECT — no leading slash for project-relative patterns
"paths": ["src/**/*.ts"]
```

**Glob syntax reference:**

| Pattern | Matches |
|---------|---------|
| `src/**/*.ts` | All `.ts` files under `src/` at any depth |
| `*.md` | Markdown files in the project root only |
| `**/*.test.*` | Any test file at any depth |
| `!node_modules/**` | Exclude node_modules (prefix with `!`) |

**Load timing:**

Rules are evaluated at tool-call time, not at session start. If you add a rule during a session, it takes effect immediately for the current session (no reload needed), but only for tool calls made after the rule was saved.

**Verify with `/debug`:**

```
/debug
```

Look for `Active rules:` to confirm your rule is registered and its glob is matching.

---

## 3. MCP Connection Issues

### 3.1 Server Startup Failures

**Symptoms:** `/mcp` shows the server as "disconnected" or "error" immediately after session start.

**Check logs:**

```bash
# MCP server logs are written to:
~/.claude/logs/mcp-<server-name>.log

# Or stream them live:
tail -f ~/.claude/logs/mcp-*.log
```

**stdio transport — path issues:**

```json
{
  "mcpServers": {
    "my-server": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/server.js"]
    }
  }
}
```

- Use **absolute paths** for the `command` and in `args`. Relative paths are resolved from `$HOME`, not the project directory.
- Confirm the command is executable: `ls -la /absolute/path/to/server.js`
- Confirm the command's interpreter is on PATH: `which node`

**Environment variables not passed:**

MCP servers inherit Claude Code's environment, but if you need specific variables:

```json
{
  "mcpServers": {
    "my-server": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/server.js"],
      "env": {
        "DATABASE_URL": "postgresql://localhost/mydb",
        "NODE_ENV": "production"
      }
    }
  }
}
```

**HTTP transport — URL format:**

```json
{
  "mcpServers": {
    "remote-server": {
      "type": "http",
      "url": "https://my-mcp-server.example.com/mcp"
    }
  }
}
```

The URL must point to the MCP endpoint, not the server root. Common mistake: using `https://server.example.com` instead of `https://server.example.com/mcp`.

---

### 3.2 Tool Not Appearing in Claude

**Symptoms:** You know an MCP server is connected but the tool is unavailable or Claude says it doesn't have it.

**Reconnect and force schema refresh:**

```
/mcp reconnect my-server-name
```

**Verify server reports the tool:**

```
/mcp tools my-server-name
```

This lists every tool the server has advertised. If your tool is missing from this list, the server's `ListTools` handler is not returning it — the issue is in the server, not Claude Code.

**Schema registration requirements:**

Each tool must have:
- A unique `name` (no spaces, use underscores or hyphens)
- A `description` (non-empty — Claude uses this to decide when to call the tool)
- An `inputSchema` following JSON Schema draft-07

Missing or malformed `inputSchema` causes silent registration failure in some versions. Add a minimal schema if the tool takes no inputs:

```json
{
  "name": "get_status",
  "description": "Returns current server status",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

---

### 3.3 OAuth Flow Failures

OAuth-protected MCP servers use a redirect URI that must be registered in the OAuth application settings.

**Redirect URI mismatch:**

Claude Code uses `http://localhost:<port>/callback` as the redirect URI. The port is ephemeral. If your OAuth app requires a fixed redirect URI, this can cause failures.

**Workaround for fixed redirect URI requirement:**

Set `CLAUDE_CODE_MCP_OAUTH_REDIRECT_PORT` to a fixed port:

```bash
export CLAUDE_CODE_MCP_OAUTH_REDIRECT_PORT=8743
```

Then register `http://localhost:8743/callback` in your OAuth app.

**Token refresh failures:**

If the server was working and stopped working after some time, the OAuth token has expired and refresh failed. Delete the cached token and re-authenticate:

```bash
rm ~/.claude/mcp-tokens/<server-name>.json
```

Then trigger reconnect: `/mcp reconnect <server-name>`

**Scope mismatch:**

If you get `insufficient_scope` from the OAuth provider, the token was issued with scopes that don't cover the tool's API calls. Re-authenticate with the correct scopes by deleting the cached token (above) and editing the server's `scopes` config.

---

### 3.4 HTTP Transport 404/502 Errors

**404 Not Found:**

- The MCP endpoint path is wrong. Verify the exact URL including path.
- The server may require a trailing slash or a specific path prefix.
- Test with curl: `curl -X POST https://server/mcp -H 'Content-Type: application/json' -d '{}'`

**502 Bad Gateway:**

- The MCP server process has crashed or not started.
- Check server-side logs.
- If behind a reverse proxy (nginx/Caddy), check proxy logs.

**SSL Certificate errors:**

```
Error: certificate verify failed
```

- The server is using a self-signed certificate.
- **Do not disable SSL verification in production.**
- For development: install the certificate in your system trust store, or set `NODE_TLS_REJECT_UNAUTHORIZED=0` (dev only).

**Proxy interference:**

If your environment routes through a corporate proxy, the proxy may not forward HTTP streaming (SSE). MCP HTTP transport uses Server-Sent Events for streaming. Configure the proxy to allow `text/event-stream` responses without buffering, or switch to stdio transport.

---

### 3.5 "Deferred Tool Not Found"

**Symptom:**

```
Error: Tool "mcp__myserver__my_tool" invoked before schema was fetched. Call ToolSearch first.
```

This is the `deferred tool not found` pattern. Some MCP tools are loaded lazily — their schemas are not fetched at session start to save context. Before calling them, you must fetch their schema with `ToolSearch`.

**Fix (in agent code or custom commands):**

```
Use ToolSearch with query "select:mcp__myserver__my_tool" before calling it.
```

In Claude Code sessions, this typically resolves itself — Claude will call `ToolSearch` automatically when it encounters a deferred tool. If you are seeing this error in CI or automated scripts, ensure your prompt instructs Claude to discover tools before using them.

---

### 3.6 MCP Server Crashes

**Symptoms:** Tool calls intermittently fail with `Server disconnected` or `SIGTERM`.

**SIGTERM handling in your server:**

MCP servers must handle `SIGTERM` gracefully:

```javascript
process.on('SIGTERM', async () => {
  await cleanup();   // close DB connections, flush buffers
  process.exit(0);
});
```

If your server does not handle `SIGTERM`, Claude Code's automatic restart policy will keep restarting it, causing repeated failures during shutdown/cleanup.

**Restart policy:**

Claude Code automatically restarts crashed stdio MCP servers up to 3 times per session. After 3 crashes, the server is marked as permanently failed for the session. Check `/mcp` for the failure count.

**Crash loop diagnosis:**

```bash
tail -n 100 ~/.claude/logs/mcp-<server-name>.log
```

If the server crashes immediately on startup, the most common causes are:
1. Missing environment variable (server throws on startup)
2. Port already in use (for servers that open a local socket)
3. Dependency not found (missing npm package, missing binary)

---

## 4. Hook System Issues

### 4.1 Hook Not Firing

**Diagnosis:**

```
/hooks
```

This shows all registered hooks, their event bindings, and the last execution result. If your hook is not listed, it is not registered.

**Common cause: event name typo**

Hook events are case-sensitive. Exact valid names include:

```
UserPromptSubmit    PreToolUse          PostToolUse
PostToolUseFailure  SessionStart        SessionEnd
Stop                Notification        PreCompact
SubagentStop        AgentMessageReceived
```

`preToolUse` (camelCase) will not fire — it must be `PreToolUse` (PascalCase).

**Handler type mismatch:**

```json
// WRONG — "cmd" is not a valid handler type
{ "type": "cmd", "command": "echo hello" }

// CORRECT
{ "type": "command", "command": "echo hello" }
```

Valid handler types: `command`, `http`, `subagent`.

**Hooks are snapshotted at session start:**

If you added or edited a hook after starting the session, it will not fire until you run:

```
/hooks reload
```

or restart the session.

---

### 4.2 Exit Code Behavior

Hook exit codes control whether Claude Code blocks or continues. Understanding these is critical for building correct hooks.

| Exit code | Meaning | Effect |
|-----------|---------|--------|
| `0` | Success | Continue normally. stdout injected into context. |
| `1` | Soft error | Log the error, continue anyway. Used for "warn but don't block." |
| `2` | Hard block | **Stop the operation.** For PreToolUse: tool does not execute. For UserPromptSubmit: prompt is rejected. |
| `3` | Soft block with message | Block the operation and inject hook stdout as an error message to Claude (Claude can retry with modifications). |

**Example — block dangerous rm commands:**

```bash
#!/bin/bash
# hooks/block-rm-rf.sh
TOOL_INPUT=$(cat)
COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // ""')

if echo "$COMMAND" | grep -qE 'rm\s+-rf\s+/'; then
  echo "BLOCKED: rm -rf / is not permitted" >&2
  exit 2
fi
exit 0
```

**Example — warn but allow:**

```bash
#!/bin/bash
TOOL_INPUT=$(cat)
COMMAND=$(echo "$TOOL_INPUT" | jq -r '.command // ""')

if echo "$COMMAND" | grep -q 'DROP TABLE'; then
  echo "WARNING: Destructive SQL detected — proceeding with caution"
  exit 1   # warns in log, continues
fi
exit 0
```

---

### 4.3 Command Handler Timeout

**Default timeout:** 60 seconds. If your hook runs longer, it is killed and the error `hook timed out after 60s` is logged.

**Increase timeout per hook:**

```json
{
  "PreToolUse": [
    {
      "hooks": [{
        "type": "command",
        "command": "bash scripts/slow-validation.sh",
        "timeout": 120
      }]
    }
  ]
}
```

`timeout` is in seconds. Maximum is 300 (5 minutes). For hooks that genuinely need longer, consider refactoring to background processing with a fast synchronous check.

**Common causes of slow hooks:**

- Network calls inside the hook (ping external APIs)
- Large file analysis
- Spawning heavy processes (Docker, large Node processes)

**Optimization:** Move slow work to background processes and have the hook check a cached result:

```bash
#!/bin/bash
# Fast check of a pre-computed result
RESULT_FILE="/tmp/security-scan-result"
if [ -f "$RESULT_FILE" ] && [ "$(cat $RESULT_FILE)" = "PASS" ]; then
  exit 0
else
  echo "Security scan result unavailable or failed" >&2
  exit 1
fi
```

---

### 4.4 Circular Hooks

**Symptom:** Session hangs or produces rapid-fire tool calls after a hook fires.

**Root cause:** A PostToolUse hook triggers a tool call that itself triggers the same PostToolUse hook.

**Example of circular hook:**

```
Claude calls Edit("src/foo.ts")
→ PostToolUse hook fires → calls Bash("npm run lint src/foo.ts")
  → PostToolUse hook fires again (Bash is also a tool call)
    → hook calls Bash again → infinite loop
```

**Fix — scope the hook with `if:` conditions:**

```json
{
  "PostToolUse": [
    {
      "matcher": {
        "tool_name": "Edit",
        "if": "$.tool_name == 'Edit'"
      },
      "hooks": [{
        "type": "command",
        "command": "bash scripts/lint.sh"
      }]
    }
  ]
}
```

By scoping to `Edit` tool only (not `Bash`), the Bash call triggered by the hook does not re-trigger the hook.

**Alternative:** Use a session-scoped lock file:

```bash
#!/bin/bash
LOCK="/tmp/claude-hook-running"
if [ -f "$LOCK" ]; then exit 0; fi
touch "$LOCK"
# ... do work ...
rm -f "$LOCK"
```

---

### 4.5 `if:` Condition Syntax Errors

The `if:` field in hook matchers uses a JSONPath-like expression against the tool call payload.

**Valid field names for tool call payload:**

```
$.tool_name       — name of the tool being called
$.input.command   — for Bash tool: the command string
$.input.path      — for Read/Edit/Write: the file path
$.input.content   — for Write: file content
```

**Valid operators:**

```
==    — equality
!=    — inequality
=~    — regex match (POSIX ERE)
```

**Examples:**

```json
// Match only Bash calls containing "git"
"if": "$.input.command =~ '.*git.*'"

// Match only Edit calls to TypeScript files
"if": "$.input.path =~ '.*\\.ts$'"

// Exclude test files from linting hook
"if": "$.input.path =~ '^(?!.*\\.test\\.).*\\.ts$'"
```

**Syntax error symptoms:** Hook fires for all events (condition is silently ignored) or hook never fires (condition is always false). Test with `/hooks` and check the `last_match_result` field.

---

### 4.6 HTTP Handler Failures

```json
{
  "PreToolUse": [{
    "hooks": [{
      "type": "http",
      "url": "https://my-security-gateway.internal/claude-hook",
      "timeout": 10,
      "headers": {
        "Authorization": "Bearer ${HOOK_SECRET}"
      }
    }]
  }]
}
```

**Common failures:**

| Error | Cause | Fix |
|-------|-------|-----|
| `SSL certificate error` | Self-signed cert | Install cert in system trust store |
| `Connection refused` | Service not running | Start the HTTP handler service |
| `301/302 redirect` | URL has a redirect | Use the final URL directly |
| `408 Request Timeout` | Handler too slow | Increase `timeout` or optimize handler |
| `Hook returned non-JSON` | Handler returned HTML error page | Check handler is returning `{"exit_code": 0}` JSON |

**Expected HTTP handler response format:**

```json
{
  "exit_code": 0,
  "output": "Optional message injected into context"
}
```

Any non-2xx response from the HTTP handler is treated as `exit_code: 1` (soft error).

---

## 5. Performance & Cost Issues

### 5.1 Slow Session Startup

**Symptoms:** `claude` takes 10-30+ seconds to display the first prompt.

**Diagnoses:**

1. **Too many MCP servers:** Each MCP server must complete its `initialize` handshake before the session is ready. Servers with slow startup (cold-start databases, remote endpoints) delay session start.

   ```bash
   # Time startup with no MCP servers:
   time CLAUDE_CODE_MCP_DISABLED=1 claude --print "hello"
   ```

   If startup is fast without MCP, disable servers one by one to find the slow one.

2. **Large CLAUDE.md:** A very large CLAUDE.md (>100KB) takes time to tokenize and inject. Check:

   ```bash
   wc -c ~/.claude/CLAUDE.md .claude/CLAUDE.md CLAUDE.md 2>/dev/null
   ```

3. **`@import` chain depth:** Deep `@import` chains read many files sequentially. Flatten imports or consolidate content.

4. **Slow `SessionStart` hooks:** Hooks run before the session is interactive. Profile:

   ```bash
   time bash .claude/hooks/session-start.sh
   ```

---

### 5.2 High Token Costs

**Cache miss on CLAUDE.md (most common cause of unexpectedly high costs):**

Claude Code uses prompt caching for CLAUDE.md content. When CLAUDE.md is modified between sessions, the cache is invalidated and you pay full price to re-inject it. If you are editing CLAUDE.md frequently, you will see a pattern of high input token costs every session.

**Minimize cache invalidation:**

- Write CLAUDE.md content that is stable (no timestamps, no dynamic content).
- Use MEMORY.md for content that changes (task state, decisions).
- Use `@import` to split large CLAUDE.md into a stable part (rarely edited) and a dynamic part (frequently edited). The stable imported file stays cached even when the dynamic one changes.

**Effort level impact:**

```bash
# Default — uses full model
claude --print "Fix the bug"

# Reduced effort — uses smaller/cheaper model for simple tasks
claude --effort low --print "Fix the bug"
claude --effort medium --print "Fix the bug"   # default
claude --effort high --print "Fix the bug"     # most expensive, best quality
```

`--effort low` routes simple tasks to a smaller model, significantly reducing cost. Not appropriate for complex reasoning or large codebases.

**Monitor costs:**

```bash
# Per-session cost summary is shown at session end
# Or check the Anthropic console:
# console.anthropic.com → Usage → filter by date
```

---

### 5.3 Tool Loop Taking Too Long

**Symptoms:** Claude is stuck in a loop of tool calls that is not converging.

**Immediate intervention:**

Press `Escape` to interrupt the current tool call. This brings up a prompt where you can redirect Claude.

**TodoWrite loop:** Claude repeatedly updates the todo list without making progress.

```
> Stop using TodoWrite for now. Just fix the specific failing test in auth_test.go.
```

**Large file read loop:** Claude is reading the same large file repeatedly.

```
> Stop re-reading the file. Here is the specific function you need: [paste the function]
```

**Subagent offloading for long loops:**

If a subtask requires many sequential tool calls, spawning a subagent isolates the tool loop in its own context window and frees the main session:

```
> Spawn a subagent to refactor the entire src/legacy/ directory. 
  It should run independently and report back when done.
```

**Set `--max-turns` to prevent runaway loops:**

```bash
claude --max-turns 20 --print "Refactor the auth module"
```

Default is unlimited turns in interactive mode. In CI, always set `--max-turns`.

---

### 5.4 Compaction Too Frequent

**Symptom:** Claude auto-compacts every 10-15 turns, constantly losing context.

**Primary causes and fixes:**

1. **CLAUDE.md too large:** CLAUDE.md is injected every turn. A 40,000-token CLAUDE.md leaves only ~160,000 tokens for conversation, meaning you hit 85% capacity quickly.

   - **Fix:** Audit CLAUDE.md with `/context`. Split into base (stable) + project (specific) files. Target <10,000 tokens total across all loaded CLAUDE.md files.

2. **Too many MCP servers loaded:** Each server's tool schemas are injected into the system context.

   - **Fix:** Load only the MCP servers needed for the current task. Use project-scoped MCP config (`.claude/settings.json`) rather than user-scoped (`~/.claude/settings.json`) to limit what loads per project.

3. **Large tool outputs not summarized:** If Bash commands return megabytes of output, that output stays in context.

   - **Fix:** Pipe verbose commands through `head`, `tail`, or `grep`: `npm test 2>&1 | tail -100`

4. **Conversation verbosity:** Long back-and-forth discussions burn context quickly.

   - **Fix:** Use `/compact` proactively at natural task boundaries before context fills.

---

## 6. Permissions & Sandbox Issues

### 6.1 Tool Blocked Unexpectedly

**Symptom:** Claude reports it cannot use a tool even though you expected it to be allowed.

**Diagnosis — check which layer is blocking:**

```
/debug
```

Look for `Permission evaluation:` in the output. It shows which rule (allowlist, blocklist, mode, or enterprise policy) blocked the tool.

**Allowlist/blocklist syntax:**

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Edit",
      "Bash(git:*)",
      "Bash(npm run *)",
      "mcp__my-server__*"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(sudo:*)",
      "WebSearch"
    ]
  }
}
```

**Wildcard syntax:**

| Pattern | Matches |
|---------|---------|
| `Bash(git:*)` | Any bash command starting with `git` |
| `Bash(npm run *)` | Any `npm run <anything>` |
| `Read(src/**)` | Read any file under `src/` |
| `mcp__server__*` | All tools from a specific MCP server |
| `*` | Everything (use with caution in allow rules) |

**Deny always wins over allow.** If a command matches both an `allow` and a `deny` rule, it is blocked.

**Check `.claude/settings.json` AND `~/.claude/settings.json`:** Both are applied. Project settings layer on top of user settings — both deny lists are checked.

---

### 6.2 Sandbox Mode Restrictions

**Sandbox mode** (enabled via `--sandbox` or `sandboxMode: true` in settings) runs Claude Code inside an OS-level container.

**What is blocked in sandbox:**

- Network access to hosts not in the `sandboxAllowedHosts` list
- Filesystem writes outside the project directory and `$TMPDIR`
- Process spawning above a configurable process limit
- Privileged syscalls (mount, chroot, etc.)

**Sandbox error example:**

```
Error: EACCES: permission denied, open '/etc/hosts'
Sandbox: write access to /etc/hosts is not permitted
```

**Loosen sandbox for specific paths:**

```json
{
  "sandboxPermissions": {
    "additionalWritePaths": ["/tmp/my-build-output"],
    "allowedHosts": ["api.github.com", "registry.npmjs.org"]
  }
}
```

**`--dangerously-skip-permissions` — when to use it:**

```bash
claude --dangerously-skip-permissions --print "..."
```

This flag **bypasses all permission checks and sandbox restrictions.** It is appropriate **only** in:
- Fully isolated CI environments (Docker containers with no sensitive data)
- Automated testing of Claude Code itself
- Sandboxed VMs where the entire environment is ephemeral

**Never use `--dangerously-skip-permissions` on a developer workstation** or any machine with real credentials, production access, or sensitive files.

---

### 6.3 Enterprise Policy Conflicts

Enterprise Claude Code deployments can lock settings via managed configuration:

```
/etc/claude-code/managed-settings.json      (Linux)
/Library/Application Support/ClaudeCode/managed-settings.json   (macOS)
%PROGRAMDATA%\ClaudeCode\managed-settings.json                   (Windows)
```

**Symptoms of enterprise policy conflicts:**

- Tool is blocked but you cannot find it in your personal `deny` list
- Model cannot be changed with `/model`
- MCP servers cannot be added
- Budget limits cannot be raised

**Identify locked settings:**

```
/debug
```

Look for `Enterprise managed settings:` section. Locked keys are marked `[LOCKED]`.

**Resolution:** Enterprise-managed settings cannot be overridden by user or project config. Contact your IT/security team to request a policy change. If you are the administrator, edit the managed-settings.json file (requires elevated privileges).

---

## 7. Git & Worktree Issues

### 7.1 Worktree Creation Failures

**Symptom:**

```
Error: failed to create worktree: fatal: not a git repository
```

or:

```
Error: /branch requires a bare repository or a repository with no uncommitted changes
```

**Bare repository requirement:**

The `/branch` command (formerly `/fork` in pre-v2.0 versions) creates a worktree from the current repository. It does not require a bare repo, but it does require:

1. The repository must not be in a detached HEAD state.
2. The target branch name must not already be checked out in another worktree.

**Check for conflicting worktrees:**

```bash
git worktree list
```

If the branch you want is already checked out elsewhere, either use a different branch name or remove the existing worktree:

```bash
git worktree remove /path/to/old-worktree
```

**Disk space:**

Worktrees share the `.git` database but create a full filesystem copy of the working tree. Ensure sufficient disk space:

```bash
df -h .
du -sh .   # size of current working tree
```

**Fix for "not a git repository":**

```bash
git init    # if no git repo yet
# OR navigate to the repo root:
cd $(git rev-parse --show-toplevel)
claude      # start from repo root
```

---

### 7.2 `/branch` Not Working

`/branch` was renamed from `/fork` in v2.0.x. If you are on an older version, use `/fork`.

**Git version requirements:**

`/branch` requires git ≥ 2.15 (worktree support). Check:

```bash
git --version
# Must be ≥ git version 2.15.0
```

Upgrade git if below 2.15:

```bash
# Ubuntu/Debian:
sudo apt-get install --only-upgrade git

# macOS:
brew upgrade git
```

**Permission errors on worktree path:**

```bash
# If the default worktree directory is not writable:
git worktree add /tmp/my-worktree feature-branch
# Then open it:
claude /tmp/my-worktree
```

---

### 7.3 Merge Conflicts from Parallel Agents

When running multiple Claude Code instances on different worktrees and merging back to main, merge conflicts occur when both agents edited overlapping files.

**Prevent conflicts with Agent Teams coordination:**

Rather than having two fully independent agents, use the filesystem mailbox to coordinate:

1. Before editing a file, an agent sends a `CLAIM` message to the orchestrator's inbox.
2. The orchestrator responds with `APPROVED` or `DENIED` based on whether another agent already claimed that file.
3. On `DENIED`, the agent waits for a `RELEASED` message before proceeding.

**After conflicts occur — resolution:**

```bash
git merge feature-branch-from-worktree
# Resolve conflicts:
git mergetool
# Or manually:
git checkout --ours conflicted-file.ts   # keep main branch version
git checkout --theirs conflicted-file.ts  # keep feature branch version
git add conflicted-file.ts
git merge --continue
```

**Rebase alternative:**

```bash
git rebase main feature-branch-from-worktree
# Rebase gives you conflict resolution one commit at a time — easier to reason about
```

---

### 7.4 ExitWorktree Tool Not Available

**Symptom:**

```
Tool "ExitWorktree" not found
```

**Cause:** `ExitWorktree` is only available when Claude Code was launched inside a worktree created by `/branch`. It is not available in regular sessions.

**Version check:**

```bash
claude --version
# ExitWorktree requires v2.1.x+
```

**Check if you are in a worktree:**

```bash
git rev-parse --is-inside-work-tree
git worktree list   # shows all worktrees; your current path should appear
```

If you started Claude Code from a manually created worktree (not via `/branch`), `ExitWorktree` may not be registered. Use `/branch` to create worktrees when you need this tool.

---

## 8. Agent Teams Issues

Agent Teams is a Research Preview feature. Enable it with:

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

Without this flag, the `SendMessage`, `ReadInbox`, and related Agent Teams tools are not available.

### 8.1 Filesystem Mailbox Permission Issues

**Mailbox location:**

```
.claude/teams/<agent-name>/inbox/
.claude/teams/<agent-name>/outbox/
```

**Symptoms:**

```
Error: EACCES: permission denied, mkdir '.claude/teams/worker-1/inbox'
```

**Fix:**

```bash
mkdir -p .claude/teams/worker-1/inbox
mkdir -p .claude/teams/worker-1/outbox
chmod 755 .claude/teams/
chmod 755 .claude/teams/worker-1/
chmod 777 .claude/teams/worker-1/inbox   # writable by all agents
chmod 777 .claude/teams/worker-1/outbox
```

If running multiple Claude Code processes under different users (e.g., in CI), ensure all agent processes have write access to the teams directory.

---

### 8.2 Message Delivery Failures

**Symptom:** `SendMessage` returns success but the target agent does not receive the message.

**Inbox path check:**

The `SendMessage` tool writes to the inbox of the named agent. The agent name must exactly match the `name:` field in the target agent's CLAUDE.md frontmatter:

```markdown
---
name: worker-agent-1
role: TypeScript refactoring specialist
---
```

If the orchestrator calls `SendMessage("worker_agent_1", ...)` but the agent is named `worker-agent-1` (with hyphens), the message goes to the wrong inbox.

**Verify inbox:**

```bash
ls -la .claude/teams/worker-agent-1/inbox/
```

Messages are stored as JSON files. If files exist but the agent isn't processing them, the agent is not polling its inbox. Ensure the receiving agent's loop includes `ReadInbox` calls.

**SendMessage tool syntax:**

```
SendMessage(
  recipient: "worker-agent-1",
  subject: "task-assignment",
  body: "Refactor src/auth/*.ts to use the new token validator"
)
```

---

### 8.3 Agent Team Deadlock

**Symptom:** All agents are waiting and no progress is being made.

**Common deadlock patterns:**

1. **Circular wait:** Agent A is waiting for Agent B to complete task X. Agent B is waiting for Agent A to complete task Y. Neither can proceed.

2. **Missing acknowledgment:** An agent sent a message but does not proceed until it receives ACK. The receiver never sends ACK because it is waiting for something else.

3. **State machine stuck:** The orchestrator is in a state that requires a message that was never sent (e.g., a worker crashed before sending completion).

**Diagnosis:**

```bash
# Check all inboxes for unprocessed messages:
for d in .claude/teams/*/inbox/; do
  echo "=== $d ==="
  ls -la "$d"
done
```

**Recovery:**

1. Identify which agents are stuck by checking their last log entries.
2. Clear the stuck agent's inbox and send it a `RESET` message.
3. If the orchestrator is stuck, kill it (`Escape` or `Ctrl+C`), clear the state, and restart with `--resume`.

**Prevention — message ordering:**

Design agent protocols with timeouts:

```
If no reply within 60 seconds, send PING. 
If no reply to PING, assume agent failed and reassign task.
```

---

## 9. CI/CD Pipeline Issues

### 9.1 GitHub Actions: Action Not Found

**Error:**

```
Error: Unable to resolve action `anthropics/claude-code-action@v1`, 
the action does not exist or is private
```

**Cause:** Action name or version tag is wrong.

**Correct action reference:**

```yaml
- uses: anthropics/claude-code-action@v1
```

If this fails, the action may not be public in your GitHub Enterprise instance. Mirror the action to your org or use the direct `claude` CLI instead:

```yaml
- name: Run Claude Code
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: |
    npm install -g @anthropic-ai/claude-code
    claude --print "Review the PR diff" --output-format json > result.json
```

---

### 9.2 Non-Interactive Mode Failures

In CI, Claude Code must run non-interactively. Use `--print` flag (not interactive mode):

```bash
# WRONG — hangs waiting for interactive input in CI
claude "Fix the failing tests"

# CORRECT — prints output and exits
claude --print "Fix the failing tests"
```

**Output format for CI:**

```bash
# Plain text output
claude --print "Summarize changes" --output-format text

# JSON output (for programmatic parsing)
claude --print "Summarize changes" --output-format json | jq '.result'

# Stream output (for long-running tasks with progress)
claude --print "Refactor the module" --output-format stream-json
```

---

### 9.3 Long-Running CI Timeouts

GitHub Actions has a 6-hour job timeout. Complex Claude Code tasks can approach this.

**Mitigation strategies:**

```bash
# Set explicit turn limit
claude --print "..." --max-turns 50

# Set budget limit (stops before exceeding cost)
claude --print "..." --max-budget-usd 10.00

# Use --bare mode (minimal output, faster)
claude --print "..." --bare

# Use lower effort for simpler CI tasks
claude --print "Run linting and fix issues" --effort low
```

**Split long tasks across multiple CI jobs:**

```yaml
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - run: claude --print "Analyze the codebase and output findings as JSON" --output-format json > analysis.json
    outputs:
      analysis: ${{ steps.analyze.outputs.result }}

  fix:
    needs: analyze
    runs-on: ubuntu-latest
    steps:
      - run: claude --print "Based on analysis: ${{ needs.analyze.outputs.analysis }}, fix the issues"
```

---

### 9.4 Bedrock/Vertex Auth in CI

**GitHub Actions with Bedrock using OIDC:**

```yaml
permissions:
  id-token: write   # required for OIDC
  contents: read

steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789012:role/ClaudeCodeRole
      aws-region: us-east-1

  - name: Run Claude Code via Bedrock
    env:
      CLAUDE_CODE_USE_BEDROCK: "1"
      AWS_REGION: us-east-1
    run: claude --print "..." --permission-mode bypassPermissions
```

**GitHub Actions with Vertex using WIF:**

```yaml
permissions:
  id-token: write
  contents: read

steps:
  - uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
      service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

  - name: Run Claude Code via Vertex
    env:
      CLAUDE_CODE_USE_VERTEX: "1"
      ANTHROPIC_VERTEX_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
      ANTHROPIC_VERTEX_REGION: "us-east5"
    run: claude --print "..." --permission-mode bypassPermissions
```

**Common WIF error in CI:**

```
Error: Unable to generate access token; failed to fetch
```

Cause: The OIDC token has expired (GitHub Actions OIDC tokens expire after 10 minutes). Ensure the `google-github-actions/auth` step runs immediately before the `claude` command, not in a separate job.

---

### 9.5 Rate Limiting in Parallel CI Jobs

**Symptom:** Multiple parallel CI jobs all fail with `429 RateLimitError` simultaneously.

**Diagnosis:** Too many concurrent requests from the same API key.

**Fixes:**

1. **Stagger job starts:**

   ```yaml
   strategy:
     matrix:
       shard: [0, 1, 2, 3]
     max-parallel: 2   # Only 2 jobs at a time
   ```

2. **Add jitter delay:**

   ```bash
   sleep $((RANDOM % 30))   # random 0-30 second delay before claude call
   claude --print "..."
   ```

3. **Retry with exponential backoff:**

   ```bash
   for attempt in 1 2 3 4 5; do
     claude --print "..." && break
     WAIT=$((2 ** attempt * 10 + RANDOM % 10))
     echo "Attempt $attempt failed, retrying in ${WAIT}s..."
     sleep $WAIT
   done
   ```

4. **Use separate API keys per team/project** to distribute load across different rate limit buckets.

5. **Use Bedrock or Vertex provisioned throughput** for predictable high-volume CI — these have separate rate limits from the direct API.

---

## 10. Diagnostic Commands Reference

### `/doctor`

Runs an automated health check and offers to fix common problems.

**What it checks:**

- `claude` binary on PATH
- Claude Code version (latest vs installed)
- `ANTHROPIC_API_KEY` set and syntactically valid
- `~/.claude/` directory structure
- F-key terminal bindings (and offers to repair broken ones)
- MCP server configurations (syntax check)
- Hook configurations (syntax check)
- Git configuration (for worktree features)
- Node.js version (for MCP servers)

**Auto-fix behavior:** `/doctor` will prompt before making changes. It can repair broken f-key bindings, recreate missing directories, and fix common JSON syntax errors in settings files.

---

### `/debug`

Dumps comprehensive session diagnostics.

**Output sections:**

```
Version:         claude v2.1.126
Model:           claude-sonnet-4-5-20251101
Permission mode: default
Session ID:      abc123def456
Project hash:    9f3a2b8c...

Context usage:
  Tokens used:   47,832 / 200,000 (23%)
  System:        8,102
  History:       31,440
  Tools:         8,290

Loaded memory files:
  [ENTERPRISE] /etc/claude-code/CLAUDE.md (4,201 tokens)
  [USER]       /home/user/.claude/CLAUDE.md (1,842 tokens)
  [PROJECT]    /home/user/my-project/CLAUDE.md (2,059 tokens)

MCP servers:
  my-db-server        [connected] 4 tools
  my-api-server       [error: connection refused]

Active hooks:
  PreToolUse          2 registered
  PostToolUse         1 registered
  SessionStart        1 registered

Enterprise managed settings:
  maxBudgetUsd        [LOCKED] 10.00
  allowedModels       [LOCKED] [claude-sonnet-*, claude-haiku-*]
```

---

### `/context`

Shows live token budget breakdown.

```
Context: 47,832 / 200,000 tokens (23%)

Breakdown:
  System prompt:      4,847
  CLAUDE.md files:    8,102
  Conversation:      31,440
  Tool results:       3,443
  Output reserve:     8,000
  Available:        144,168
```

Run `/context` before long sessions to baseline usage. Run it during a session to decide whether to `/compact` now.

---

### `/mcp`

Displays MCP server status.

```
MCP Servers:

  my-db-server           [connected]
    Transport:  stdio
    Command:    node /home/user/mcp-servers/db-server.js
    Tools (4):  query_database, list_tables, describe_table, execute_migration
    Last ping:  847ms ago

  my-api-server          [error]
    Transport:  http
    URL:        https://api-server.internal/mcp
    Error:      connection refused (ECONNREFUSED)
    Retries:    3/3 (max retries exhausted)
```

**Sub-commands:**

```
/mcp                          — list all servers and status
/mcp reconnect <server-name>  — force reconnect a specific server
/mcp tools <server-name>      — list tools advertised by a server
/mcp logs <server-name>       — show last 50 lines of server log
```

---

### `/hooks`

Shows hook system status.

```
Hooks: 4 registered

  SessionStart     [1 handler]
    command: bash .claude/hooks/session-start.sh
    last run: 12 min ago, exit 0

  PreToolUse       [2 handlers]
    command: bash .claude/hooks/security-check.sh
      last run: 2 sec ago, exit 0
    command: bash .claude/hooks/audit-log.sh
      last run: 2 sec ago, exit 0

  PostToolUse      [1 handler]
    command: bash .claude/hooks/formatter.sh
      last run: 2 sec ago, exit 0
      matcher: tool_name == "Edit"
```

**Sub-commands:**

```
/hooks              — list all registered hooks with status
/hooks reload       — reload hooks from settings.json (picks up changes made during session)
/hooks test <event> — fire a test event to verify hooks are working
```

---

### `claude --version`

```bash
claude --version
# claude v2.1.126 (build 2026-05-19, native binary, linux/amd64)
```

The version string includes: semantic version, build date, binary type (native vs Node.js), and platform. Use this when filing bug reports or checking whether you need to upgrade.

---

## 11. Error Message Dictionary

Quick lookup: find your exact error message, get the cause and fix.

| Error message | Cause | Fix |
|---------------|-------|-----|
| `claude: command not found` | `claude` binary not on `$PATH` | Add npm global bin or `~/.claude/bin` to PATH. See [Section 1.1](#11-claude-command-not-found). |
| `Error: ANTHROPIC_API_KEY is not set` | Environment variable missing | `export ANTHROPIC_API_KEY="sk-ant-..."` |
| `AuthenticationError: 401 Unauthorized` | API key revoked, wrong org, or invalid | Verify key at console.anthropic.com → API Keys |
| `RateLimitError: 429` | Requests per minute or TPM quota exceeded | Reduce concurrency, add retry with backoff, request quota increase |
| `Error: context_length_exceeded` | Conversation history has filled the context window | Run `/compact` now. See [Section 2.1](#21-context-window-exceeded). |
| `Session paused: context compaction failed` | Auto-compaction hit the API limit itself | Run `/compact` manually with a focused instruction, or `/new` |
| `Error: ENOENT: no such file or directory, open 'CLAUDE.md'` | `@import` path in CLAUDE.md does not exist | Check all `@import` paths exist relative to the importing file |
| `MCP server 'X' failed to start: spawn ENOENT` | The `command` for the stdio MCP server is not on PATH or doesn't exist | Use absolute path for command in MCP server config |
| `MCP server 'X' crashed after 3 attempts` | Repeated startup crash; dependency missing or env var not set | Check `~/.claude/logs/mcp-X.log` for the actual error |
| `Tool "mcp__X__Y" invoked before schema was fetched` | Deferred tool called without `ToolSearch` | Call `ToolSearch("select:mcp__X__Y")` first |
| `hook timed out after 60s` | Hook `command` runs longer than 60 seconds | Add `"timeout": 120` to the hook config, or optimize the hook script |
| `Error: 404 Not Found (MCP HTTP transport)` | Wrong URL — path to MCP endpoint is incorrect | Verify the exact URL including path prefix. Test with curl. |
| `Error: certificate verify failed` | SSL certificate is self-signed or expired | Install cert in system trust store |
| `AccessDeniedException: User is not authorized to perform: bedrock:InvokeModel` | IAM role lacks Bedrock permissions | Grant `bedrock:InvokeModel` for the model ARN in IAM |
| `google.auth.exceptions.DefaultCredentialsError` | GCP credentials not configured | Run `gcloud auth application-default login` |
| `Error: git worktree add failed: branch already checked out` | The target branch is already in another worktree | `git worktree list` to find it, or use a different branch name |
| `ExitWorktree tool not found` | Not running inside a `/branch`-created worktree, or version too old | Use `/branch` to create the worktree; check `claude --version` ≥ v2.1.x |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 is required` | Agent Teams tools unavailable | `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` before starting session |
| `Error: EACCES: permission denied, mkdir '.claude/teams/...'` | Agent Teams mailbox directory not writable | `chmod 777 .claude/teams/<agent>/inbox` |
| `Error: Unable to resolve action 'anthropics/claude-code-action@v1'` | Wrong action path or version in GitHub Actions YAML | Verify action name: `anthropics/claude-code-action@v1` |
| `claude: --print flag required for non-interactive use` | Running without `--print` in a non-TTY environment | Add `--print` flag for all CI/scripted use |
| `PermissionDenied: 403 (Vertex AI)` | Service account lacks `roles/aiplatform.user` | Grant `roles/aiplatform.user` to the service account on the GCP project |
| `Error: bypassPermissions mode requires --dangerously-skip-permissions in interactive sessions` | Using `bypassPermissions` interactively without the safety flag | This is intentional — add the flag only in fully sandboxed CI environments |
| `Hook event 'preToolUse' not recognized` | Event name uses wrong case | Event names are PascalCase: `PreToolUse`, not `preToolUse` |
| `Error: maxBudgetUsd is locked by enterprise policy` | Enterprise managed settings prevent budget changes | Contact your org admin to adjust the managed-settings.json policy |
| `RateLimitError: 429 (parallel CI)` | Multiple CI jobs hitting API concurrently | Set `max-parallel: 2` in matrix strategy and add jitter delay |

---

## 10. New Diagnostic Commands (v2.1.105+)

### /doctor — Automated Health Check

The `/doctor` command runs a comprehensive health check on your Claude Code installation and configuration:

```bash
> /doctor
```

Output shows:
- Claude Code version and whether an update is available
- Authentication status (API key, OAuth, Bedrock, Vertex)
- MCP server connection status (connected/error per server)
- Hook configurations (syntax check, script permissions)
- CLAUDE.md validity (size, encoding, @import chains)
- MEMORY.md status (size, last write)
- Permissions configuration (allow/deny list check)

**Auto-repair:** Press `f` when prompted to auto-fix common issues:
- Missing CLAUDE.md created with template
- Broken MCP connections restarted
- Hook script permissions fixed (chmod +x)
- Corrupt MEMORY.md moved to MEMORY.md.bak and reset

### /debug — Session Diagnostic Dump

```bash
> /debug
```

Shows live session state:
- All loaded context files with their token counts
- Active hook registrations
- Current MCP connection status
- Permission mode and active allow/deny rules
- Context window usage by category

## 11. Error Message Dictionary (Extended)

### Claude Code binary errors

| Error message | Cause | Fix |
|--------------|-------|-----|
| `ENOENT: no such file or directory 'claude'` | Binary not in PATH | Re-run install script; add `~/.local/bin` to PATH |
| `EACCES: permission denied` | Binary not executable | `chmod +x $(which claude)` |
| `Error: Node.js is required` | Using old Node.js-based binary on v2.1.113+ | Upgrade: `curl -fsSL https://claude.ai/install.sh | bash` |
| `Update failed: disk full` | No space on device | Free disk space; `DISABLE_UPDATES=1` to skip auto-update |

### Authentication errors

| Error message | Cause | Fix |
|--------------|-------|-----|
| `AuthenticationError: Invalid API key` | Expired or malformed key | Regenerate at console.anthropic.com |
| `AuthenticationError: Your account has insufficient credits` | Account balance depleted | Add credits at console.anthropic.com/settings/billing |
| `Could not connect to authentication server` | Network/proxy issue | Check corporate proxy; try `ANTHROPIC_BASE_URL` env var |
| `Bedrock: AccessDeniedException` | IAM role missing `bedrock:InvokeModel` permission | Add `bedrock:InvokeModel` and `bedrock:InvokeModelWithResponseStream` to IAM role |
| `Vertex AI: 403 Forbidden` | Service account lacks `roles/aiplatform.user` | Grant `roles/aiplatform.user` in GCP IAM |
| `Vertex AI: Workload Identity Federation failed` | WIF pool/provider misconfigured | Verify `workload_identity_provider` ARN and service account email in GitHub Actions step |

### MCP server errors

| Error message | Cause | Fix |
|--------------|-------|-----|
| `MCP server exited with code 1` | Server crashed at startup | Check `~/.claude/mcp-logs/<server-name>.log`; usually missing env vars |
| `MCP: timeout waiting for handshake` | Server slow to start; timeout too low | Increase `startup_timeout_ms` in .mcp.json config |
| `MCP: Unknown transport type` | Typo in transport field | Must be `"stdio"` or `"http"` (lowercase) |
| `MCP: Tool not found: <name>` | Tool removed from server | Restart server with `/mcp disconnect` then `/mcp connect`; check server version |
| `MCP: schema validation failed` | Tool input doesn't match server schema | Check Claude's tool call against the schema shown in `/mcp` |

### Hook errors

| Error message | Cause | Fix |
|--------------|-------|-----|
| `Hook command failed with exit code 127` | Script not found or not in PATH | Check script path; make it absolute; verify it's executable |
| `Hook: JSON parse error in stdout` | Script printed non-JSON when JSON expected | For `command` handlers, return valid JSON or nothing |
| `Hook blocked: exit 2` | Intentional block by hook | Expected behaviour — check what the hook is blocking and why |
| `http hook: connection refused` | Webhook URL not reachable | Verify URL; check network; set `timeout_ms` to avoid blocking |

### Context and compaction errors

| Error message | Cause | Fix |
|--------------|-------|-----|
| `Context window full — compaction required` | 100% context used before auto-compact | Run `/compact` at 70%; or use smaller CLAUDE.md |
| `Auto-compaction failed` | Compaction call itself hit an error | Check API connectivity; retry with manual `/compact` |
| `MEMORY.md exceeds size limit — truncating` | Auto-memory over 200 lines / 25KB | Run `/memory` and prune; or use CLAUDE.md for permanent context instead |
| `@import cycle detected` | Circular @import chain in CLAUDE.md | Check for A imports B imports A patterns; fix the chain |
| `Rules file failed to parse` | Malformed YAML frontmatter in rules file | Run `yamllint .claude/rules/<file>.md`; fix frontmatter syntax |

### Sandbox errors

| Error message | Cause | Fix |
|--------------|-------|-----|
| `sandbox: operation not permitted` | Seatbelt/bubblewrap blocking the operation | Tool is attempting a restricted syscall; add to allowlist or disable sandbox for this task |
| `sandbox: file not accessible` | File path outside sandbox scope | Work within project directory; add path to sandbox allowlist in settings.json |
| `bubblewrap: newuidmap not found` | Missing user namespace tools on Linux | Install: `apt install uidmap` (Debian) or `dnf install shadow-utils` (Fedora) |

---

## Additional Resources

- **`/doctor`** — run first, auto-fixes many common issues
- **`~/.claude/logs/`** — all session and MCP server logs
- **`.claude/settings.json`** — project-level config (permissions, MCP, hooks)
- **`~/.claude/settings.json`** — user-level config
- **`/etc/claude-code/managed-settings.json`** — enterprise policy (Linux)

When filing a bug report, include the output of:

```bash
claude --version
/debug    # (copy the full output)
```
