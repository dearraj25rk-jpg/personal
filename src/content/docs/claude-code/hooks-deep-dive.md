---
title: Hooks System — Complete Reference
description: >
  Deep-dive reference for the Claude Code hooks system — all 30+ hook events,
  five handler types, exit codes, matchers, practical patterns, and production
  examples for automation, audit logging, security gates, formatting, and CI/CD.
  Covers v2.1.126 (May 2026).
sidebar:
  order: 5
  label: Hooks System
lastUpdated: 2026-05-09
---

# Hooks System — Complete Reference

> **Version:** v2.1.126 (May 6, 2026) · Hooks were introduced in v1.0.x and have grown to 30+ events through v2.1.126.

Hooks are shell commands (or sub-agents) that fire automatically at well-defined lifecycle points during a Claude Code session. They let you intercept, audit, block, or augment Claude's behaviour without modifying any Claude Code internals.

**What hooks can do:**
- Block Claude from executing dangerous commands (exit code 2)
- Auto-format code after every file edit
- Post Slack notifications when tasks complete
- Audit every tool call to a log file
- Enforce code review policy before writing
- Run tests after code edits
- Inject additional context into every session
- Validate that generated code compiles before accepting it

---

## 1. Architecture Overview

### High-Level Lifecycle

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     HOOK EXECUTION LIFECYCLE                     │
  └─────────────────────────────────────────────────────────────────┘

  User types prompt
        │
        ▼
  ┌─────────────────────────────────────────────────────────────────┐
  │  [UserPromptSubmit hooks]                                        │
  │   All matching hooks run IN PARALLEL                             │
  │   stdout → injected as context  |  exit 2 → prompt blocked      │
  └──────────────────────────┬──────────────────────────────────────┘
                             │  (if not blocked)
                             ▼
                     Claude API call
                             │
            ┌────────────────┴───────────────────┐
      stop_reason == "tool_use"          stop_reason == "end_turn"
            │                                     │
            ▼                                     ▼
  ┌─────────────────────┐              ┌──────────────────────────┐
  │  [PreToolUse hooks] │              │  [Stop hooks]            │
  │  All parallel       │              │   exit 2 → force         │
  │  exit 2 → BLOCK     │              │   continuation           │
  └────────┬────────────┘              └──────────────────────────┘
           │  (if not blocked)
           ▼
  ┌──────────────────────────────────┐
  │  Tool executes                   │
  │  (Read / Edit / Bash / Task ...) │
  └────────┬─────────────────────────┘
           │
           ├── Success ──►  [PostToolUse hooks]
           │                 exit 2 → result REJECTED
           │                 stdout → context injected
           │
           └── Failure ──►  [PostToolUseFailure hooks]
                             informational only (exit ignored)
           │
           ▼
  tool_result appended → back to Claude API call (loop)
```

### Hook Execution Model — Key Rules

```
  RULE 1: All hooks for an event run IN PARALLEL
  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ hook A   │  │ hook B   │  │ hook C   │  ← all fire simultaneously
  └──────────┘  └──────────┘  └──────────┘
       │              │              │
       └──────────────┴──────────────┘
                      │
                  any exit 2? → BLOCK

  RULE 2: Hooks are SNAPSHOTTED at session start
  Changes to settings.json take effect after /hooks reload or session restart

  RULE 3: Default timeout is 60 seconds (configurable per hook)
  Slow hooks block the entire turn — keep them fast

  RULE 4: stdout → Claude context  |  stderr → terminal log
  Only stdout is injected into the conversation
```

**Key properties:**
- Hooks are **snapshotted at session start** — changes require `/hooks reload` or session restart
- All matching hooks for an event run **in parallel**
- Hooks have a **60-second timeout** by default (configurable)
- Hook output (stdout) is fed back to Claude as context
- Hook stderr appears in the Claude Code terminal log

---

## 2. Hook Events — Full Reference

### 2.1 Session Lifecycle

| Event | When it fires | Can block? | stdout injected? |
|-------|--------------|------------|-----------------|
| `SessionStart` | When a new or resumed session begins | No (exit code ignored) | Yes |
| `SessionEnd` | When a session exits | No | No |
| `Notification` | Permission prompts and idle alerts | No | No |
| `PreCompact` | Before context compaction (manual or auto) | No | Yes |

#### SessionStart — inject context

```json
{
  "SessionStart": [
    {
      "hooks": [{
        "type": "command",
        "command": "echo 'Current branch: '$(git branch --show-current); echo 'Uncommitted files: '$(git status --porcelain | wc -l)"
      }]
    }
  ]
}
```

Output from `SessionStart` hooks is injected into the conversation as system context. Use this to auto-load branch info, recent git log, environment variables, or project state.

#### PreCompact — save state before compaction

```json
{
  "PreCompact": [
    {
      "hooks": [{
        "type": "command",
        "command": "python3 scripts/save_session_state.py"
      }]
    }
  ]
}
```

---

### 2.2 Tool Lifecycle

| Event | When it fires | Can block? | stdout injected? |
|-------|--------------|------------|-----------------|
| `PreToolUse` | Before any tool executes | **Yes** — exit 2 blocks | Yes |
| `PostToolUse` | After a tool completes | **Yes** — exit 2 blocks | Yes |
| `PostToolUseFailure` | After a tool fails | No | Yes |

#### PreToolUse — gate dangerous commands

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "python3 ~/.claude/hooks/validate_bash.py"
      }]
    }
  ]
}
```

The hook receives a JSON payload on stdin:

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf dist/"
  },
  "session_id": "sess_01abc...",
  "transcript": [...]
}
```

Exit 2 + print an error message to **block** the tool. The message is shown to Claude as a refusal reason.

#### PostToolUse — auto-format after edits

```json
{
  "PostToolUse": [
    {
      "matcher": "Edit|Write|MultiEdit",
      "hooks": [{
        "type": "command",
        "command": "python3 ~/.claude/hooks/format_edited_file.py"
      }]
    }
  ]
}
```

The hook receives the same JSON payload plus the tool's output. Use this to auto-run linters, formatters, or type-checkers on the file Claude just edited.

---

### 2.3 Agent Lifecycle

| Event | When it fires | Can block? | stdout injected? |
|-------|--------------|------------|-----------------|
| `SubagentStart` | When a subagent (Task tool) begins | No | Yes |
| `SubagentStop` | When a subagent finishes | **Yes** — exit 2 blocks | Yes |
| `TaskCreated` | When a Task tool creates a subagent | No | No |
| `TaskCompleted` | When a Task tool's agent finishes | No | Yes |

#### SubagentStop — validate subagent output

```json
{
  "SubagentStop": [
    {
      "hooks": [{
        "type": "command",
        "command": "python3 ~/.claude/hooks/validate_subagent_result.py"
      }]
    }
  ]
}
```

---

### 2.4 User Interaction

| Event | When it fires | Can block? | stdout injected? |
|-------|--------------|------------|-----------------|
| `UserPromptSubmit` | Before Claude processes user input | **Yes** — exit 2 blocks | Yes |
| `Stop` | When Claude finishes a response | **Yes** — exit 2 forces Claude to continue | No |

#### UserPromptSubmit — inject context or block

```json
{
  "UserPromptSubmit": [
    {
      "hooks": [{
        "type": "command",
        "command": "python3 ~/.claude/hooks/enrich_prompt.py"
      }]
    }
  ]
}
```

The payload includes `prompt` (the raw user text). Print additional context to stdout — it gets injected into the conversation. Exit 2 blocks the prompt entirely.

#### Stop — force continuation after tests

```json
{
  "Stop": [
    {
      "hooks": [{
        "type": "command",
        "command": "python3 ~/.claude/hooks/run_tests_gate.py"
      }]
    }
  ]
}
```

If your `Stop` hook exits 2, Claude is forced to continue the session (as if the user had replied "continue"). Use this to enforce "tests must pass before stopping."

---

### 2.5 Complete Event Reference Table (v2.1.126)

| Category | Event | Fires When | Blocks? | Exit 2 Effect |
|----------|-------|-----------|---------|---------------|
| Session | `SessionStart` | Session opens | No | Ignored |
| Session | `SessionEnd` | Session closes | No | Ignored |
| Session | `Notification` | Permission prompt or idle alert | No | Ignored |
| Session | `PreCompact` | Before context compaction | No | Ignored |
| Tool | `PreToolUse` | Before tool executes | **Yes** | Tool does not execute |
| Tool | `PostToolUse` | After tool succeeds | **Yes** | Tool result rejected |
| Tool | `PostToolUseFailure` | After tool fails | No | Ignored |
| Agent | `SubagentStart` | Task subagent spawns | No | Ignored |
| Agent | `SubagentStop` | Task subagent finishes | **Yes** | Subagent result rejected |
| Agent | `TaskCreated` | Task tool call begins | No | Ignored |
| Agent | `TaskCompleted` | Task tool call ends | No | Ignored |
| Prompt | `UserPromptSubmit` | User submits a message | **Yes** | Prompt not sent to Claude |
| Turn | `Stop` | Claude returns end_turn | **Yes** | Forces Claude to continue |
| Plan | `PlanApproved` | User approves a plan | No | Ignored |
| Plan | `PlanRejected` | User rejects a plan | No | Ignored |
| Rewind | `CheckpointCreated` | Rewind checkpoint saved | No | Ignored |
| Rewind | `RewindRequested` | User triggers a rewind | No | Ignored |
| MCP | `MCPServerConnected` | MCP server connects | No | Ignored |
| MCP | `MCPServerDisconnected` | MCP server drops | No | Ignored |

---

## 3. Hook Handler Types

There are five handler types. All are configured under the `hooks` key inside each hook event block.

### Handler Type Comparison

| Type | Speed | Cost | Can Block? | Best For |
|------|-------|------|-----------|----------|
| `command` | Fast | None | Yes | Regex validation, formatting, logging |
| `prompt` | Medium | Haiku rate | Yes | Natural-language rules hard to express in code |
| `agent` | Slow | Sonnet/Opus rate | Yes | Complex validation requiring file reads, tests |
| `http` | Medium | None (your server) | No (4xx/5xx = warning) | Webhooks, observability, external systems |
| `mcp_tool` | Fast (async) | MCP server cost | No | Audit logging via connected MCP server |

### 3.1 `command` — Shell Command

```json
{
  "type": "command",
  "command": "bash ~/.claude/hooks/my-hook.sh",
  "timeout": 30
}
```

- Receives event payload as **JSON on stdin**
- stdout → injected into conversation as context
- stderr → shown in Claude Code terminal log
- Exit 0 = success, exit 2 = blocking error, other = non-blocking warning
- Default timeout: 60 seconds

### 3.2 `prompt` — Claude Haiku Sub-LLM

```json
{
  "type": "prompt",
  "prompt": "Review this bash command for destructive operations. If it could destroy data, exit 2. Otherwise exit 0.",
  "model": "claude-haiku-4-5"
}
```

- Uses **Haiku** (fast, cheap) for assessments
- Receives event payload as JSON context
- Haiku decides the exit code
- Ideal for natural-language rules that are hard to express in regex

### 3.3 `agent` — Claude Agent Sub-Session

```json
{
  "type": "agent",
  "agent": "code-reviewer",
  "max_turns": 20
}
```

- Spawns a full Claude sub-session using the named agent definition (from `.claude/agents/`)
- Can read files, run tests, call tools — up to `max_turns` (max 50)
- More powerful but slower and more expensive than `prompt` hooks
- Use for complex validation: "verify this change compiles and passes unit tests"

### 3.4 `http` — HTTP Webhook (v2.1.63+)

```json
{
  "type": "http",
  "url": "https://hooks.example.com/claude-code-events",
  "headers": { "Authorization": "Bearer ${WEBHOOK_TOKEN}" },
  "timeout": 10
}
```

- POSTs event payload as JSON to the URL
- Response body (if JSON `{"inject": "..."}`) is injected into the conversation
- HTTP 4xx/5xx → non-blocking warning
- Supports `${ENV_VAR}` expansion in URL and headers

### 3.5 `mcp_tool` — MCP Tool Invocation (v2.1.118+)

```json
{
  "type": "mcp_tool",
  "server": "my-audit-server",
  "tool": "log_event",
  "arguments": {
    "event": "${event_name}",
    "tool": "${tool_name}"
  }
}
```

- Calls a specific tool on a connected MCP server
- `${event_name}`, `${tool_name}`, `${session_id}` are available as template variables
- Useful for sending events to external audit/observability systems without a separate HTTP server

---

## 4. Matchers

The `matcher` field is a **regex** applied to the `tool_name` for `PreToolUse` and `PostToolUse` events. Without a matcher, the hook fires for all tools.

```json
{
  "PreToolUse": [
    {
      "matcher": "^Bash$",
      "hooks": [...]
    },
    {
      "matcher": "Edit|Write|MultiEdit",
      "hooks": [...]
    },
    {
      "matcher": ".*",
      "hooks": [...]
    }
  ]
}
```

**Common matchers:**

| Matcher | Matches |
|---------|---------|
| `^Bash$` | Only Bash tool |
| `Edit\|Write\|MultiEdit` | All file-write tools |
| `Read` | Read tool |
| `Task` | Subagent spawning |
| `WebFetch\|WebSearch` | All web tools |
| `.*` | Every tool |

For `UserPromptSubmit` and `Stop`, there is no tool name so matcher is not applicable.

---

## 5. Configuration Reference

Hooks are configured in `.claude/settings.json` (project-scoped) or `~/.claude/settings.json` (user-global).

### Full settings.json structure

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "echo 'Session started'" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "bash ~/.claude/hooks/bash-guard.sh", "timeout": 10 }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          { "type": "command", "command": "bash ~/.claude/hooks/auto-format.sh" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "bash ~/.claude/hooks/test-gate.sh" }
        ]
      }
    ]
  }
}
```

### Environment variable access in hooks

All Claude Code environment variables are available in hook commands:

```bash
# In a hook script:
echo "Session: $CLAUDE_SESSION_ID"
echo "Model: $CLAUDE_MODEL"
echo "Project: $CLAUDE_PROJECT_DIR"
```

---

## 6. Exit Codes

| Exit Code | Meaning |
|-----------|---------|
| `0` | Success — continue normally |
| `2` | **Blocking error** — halt the operation; stdout message shown to Claude as refusal reason |
| Any other | Non-blocking warning — stdout injected as context; execution continues |

**Exit code 2 behaviour by event:**

| Event | Exit 2 effect |
|-------|---------------|
| `PreToolUse` | Tool does **not** execute; Claude sees your error message and can retry or apologise |
| `PostToolUse` | Tool result is **rejected**; Claude must retry or stop |
| `UserPromptSubmit` | Prompt is **blocked**; user sees your error message |
| `Stop` | Claude is **forced to continue** (like the user typed "continue") |
| `SubagentStop` | Subagent result is **rejected** |

---

## 7. Practical Patterns

### Pattern 1: Block Dangerous Bash Commands

```python
#!/usr/bin/env python3
# ~/.claude/hooks/bash-guard.py
import json, sys, re

payload = json.load(sys.stdin)
command = payload.get('tool_input', {}).get('command', '')

DANGEROUS_PATTERNS = [
    r'rm\s+-rf\s+/',
    r'rm\s+-rf\s+\*',
    r'dd\s+if=',
    r'mkfs\.',
    r'>\s*/dev/sd',
    r'chmod\s+-R\s+777',
    r'DROP\s+TABLE',
    r'TRUNCATE\s+TABLE',
]

for pattern in DANGEROUS_PATTERNS:
    if re.search(pattern, command, re.IGNORECASE):
        print(f"BLOCKED: Dangerous command pattern detected: {pattern}")
        sys.exit(2)

sys.exit(0)
```

Settings entry:

```json
{
  "PreToolUse": [{
    "matcher": "Bash",
    "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/bash-guard.py", "timeout": 5 }]
  }]
}
```

### Pattern 2: Auto-Format After Edits

```bash
#!/bin/bash
# ~/.claude/hooks/auto-format.sh
# Reads tool_input.path from stdin, runs appropriate formatter

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('path',''))")

if [ -z "$FILE" ]; then exit 0; fi

case "$FILE" in
  *.py)    python3 -m ruff format "$FILE" 2>/dev/null; python3 -m ruff check --fix "$FILE" 2>/dev/null ;;
  *.ts|*.tsx|*.js|*.jsx) npx prettier --write "$FILE" 2>/dev/null ;;
  *.cs)    dotnet-format "$FILE" 2>/dev/null ;;
  *.go)    gofmt -w "$FILE" 2>/dev/null ;;
  *.rs)    rustfmt "$FILE" 2>/dev/null ;;
esac

exit 0
```

### Pattern 3: Audit Log — Every Tool Call

```python
#!/usr/bin/env python3
# ~/.claude/hooks/audit-log.py
import json, sys, datetime, os

payload = json.load(sys.stdin)

log_path = os.path.expanduser('~/.claude/audit.jsonl')
entry = {
    'ts': datetime.datetime.utcnow().isoformat(),
    'event': os.environ.get('CLAUDE_HOOK_EVENT', 'unknown'),
    'tool': payload.get('tool_name', ''),
    'input': payload.get('tool_input', {}),
    'session': payload.get('session_id', ''),
}

with open(log_path, 'a') as f:
    f.write(json.dumps(entry) + '\n')

sys.exit(0)
```

Apply to all events:

```json
{
  "PreToolUse": [{ "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/audit-log.py", "timeout": 5 }] }],
  "PostToolUse": [{ "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/audit-log.py", "timeout": 5 }] }]
}
```

### Pattern 4: Test Gate — Don't Stop Until Tests Pass

```bash
#!/bin/bash
# ~/.claude/hooks/test-gate.sh
# Exit 2 forces Claude to continue if tests fail

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# Only gate if we have tests to run
if [ ! -f "package.json" ] && [ ! -f "pyproject.toml" ] && [ ! -f "*.csproj" ]; then
    exit 0
fi

if [ -f "package.json" ]; then
    npm test --silent 2>&1
    EXIT=$?
elif [ -f "pyproject.toml" ]; then
    python3 -m pytest -q 2>&1
    EXIT=$?
fi

if [ $EXIT -ne 0 ]; then
    echo "Tests are failing. Please fix the failing tests before stopping."
    exit 2
fi

exit 0
```

### Pattern 5: Slack Notification on Task Complete

```python
#!/usr/bin/env python3
# ~/.claude/hooks/notify-slack.py
import json, sys, os, urllib.request

payload = json.load(sys.stdin)
webhook_url = os.environ.get('SLACK_WEBHOOK_URL', '')

if not webhook_url:
    sys.exit(0)

msg = {
    "text": f":robot_face: Claude Code session finished\nProject: `{os.environ.get('CLAUDE_PROJECT_DIR', 'unknown')}`"
}

req = urllib.request.Request(
    webhook_url,
    data=json.dumps(msg).encode(),
    headers={'Content-Type': 'application/json'}
)
urllib.request.urlopen(req, timeout=5)
sys.exit(0)
```

```json
{
  "Stop": [{ "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/notify-slack.py", "timeout": 10 }] }]
}
```

### Pattern 6: Inject Git Context at Session Start

```bash
#!/bin/bash
# ~/.claude/hooks/session-context.sh
# Injected as context into every session

echo "=== Session Context ==="
echo "Branch: $(git branch --show-current 2>/dev/null || echo 'not a git repo')"
echo "Recent commits:"
git log --oneline -5 2>/dev/null || echo "none"
echo "Uncommitted changes: $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ') files"
echo "Current directory: $(pwd)"
echo "Active environment: ${NODE_ENV:-${ENVIRONMENT:-development}}"
```

```json
{
  "SessionStart": [{ "hooks": [{ "type": "command", "command": "bash ~/.claude/hooks/session-context.sh" }] }]
}
```

### Pattern 7: Prompt Hook — Natural Language Rule Enforcement

```json
{
  "PreToolUse": [
    {
      "matcher": "Edit|Write|MultiEdit",
      "hooks": [{
        "type": "prompt",
        "prompt": "You are a code review gatekeeper. Check if the file being written contains hardcoded secrets, API keys, passwords, or connection strings. If any are found, exit 2 and explain what was found. If clean, exit 0.",
        "model": "claude-haiku-4-5"
      }]
    }
  ]
}
```

### Pattern 8: HTTP Webhook for Observability

```json
{
  "PostToolUse": [
    {
      "matcher": ".*",
      "hooks": [{
        "type": "http",
        "url": "https://otel-collector.internal/claude-events",
        "headers": {
          "Authorization": "Bearer ${OTEL_API_TOKEN}",
          "Content-Type": "application/json"
        },
        "timeout": 3
      }]
    }
  ]
}
```

### Pattern 9: MCP Tool Hook — External Audit System (v2.1.118+)

```json
{
  "PostToolUse": [
    {
      "matcher": "Bash|Edit|Write",
      "hooks": [{
        "type": "mcp_tool",
        "server": "audit-mcp",
        "tool": "record_action",
        "arguments": {
          "tool": "${tool_name}",
          "session": "${session_id}",
          "timestamp": "${timestamp}"
        }
      }]
    }
  ]
}
```

### Pattern 10: Security Gate — Full Pipeline

This pattern implements a layered security gate that combines multiple checks:

```python
#!/usr/bin/env python3
# ~/.claude/hooks/security-gate.py
"""
Multi-layer security gate for PreToolUse:Bash
Checks: dangerous patterns, network access, secret exfiltration, 
        package installation, production environment detection.
"""
import json, sys, re, os

payload = json.load(sys.stdin)
command = payload.get('tool_input', {}).get('command', '')
project_dir = payload.get('project_dir', '')

# Layer 1: Catastrophic operations — always block
CATASTROPHIC = [
    (r'rm\s+-rf\s+/', 'recursive delete from root'),
    (r'dd\s+if=/dev/zero', 'disk wipe'),
    (r'mkfs\b', 'filesystem format'),
    (r'fdisk\b', 'partition table modification'),
    (r':(){:|:&};:', 'fork bomb'),
    (r'>\s*/dev/sda', 'raw disk write'),
]

for pattern, desc in CATASTROPHIC:
    if re.search(pattern, command, re.IGNORECASE):
        print(f"SECURITY GATE BLOCK [CATASTROPHIC]: {desc}")
        print(f"Command: {command[:200]}")
        sys.exit(2)

# Layer 2: Production environment — block write operations
if os.environ.get('ENVIRONMENT') in ('production', 'prod'):
    WRITE_PATTERNS = [r'\bwrite\b', r'\bcreate\b', r'\bdelete\b', r'\bdrop\b', r'\btruncate\b']
    for pattern in WRITE_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            print(f"SECURITY GATE BLOCK [PROD-WRITE]: Write operation in production environment")
            sys.exit(2)

# Layer 3: Secret exfiltration — block curl/wget posting to external URLs
EXFIL_PATTERNS = [
    r'curl\s+.*\s+-d\s+.*\$[A-Z_]+',      # curl -d $SECRET_VAR ...
    r'wget\s+.*\s+--post-data.*\$[A-Z_]+', # wget --post-data $SECRET_VAR ...
]
for pattern in EXFIL_PATTERNS:
    if re.search(pattern, command):
        print("SECURITY GATE BLOCK [EXFIL]: Potential secret exfiltration detected")
        sys.exit(2)

# Layer 4: Global package installs — warn but allow
GLOBAL_INSTALL = [r'npm\s+install\s+-g', r'pip\s+install\s+(?!-r)', r'apt(-get)?\s+install']
for pattern in GLOBAL_INSTALL:
    if re.search(pattern, command):
        print(f"SECURITY GATE WARN: Global package installation detected — ensure this is intended")
        # exit 1 = non-blocking warning, context injected
        sys.exit(1)

sys.exit(0)
```

Settings configuration:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 ~/.claude/hooks/security-gate.py",
            "timeout": 5
          }
        ]
      },
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Check this file write for hardcoded secrets, API keys, passwords, private keys, or connection strings with embedded credentials. Block (exit 2) if found. Allow (exit 0) if clean.",
            "model": "claude-haiku-4-5"
          }
        ]
      }
    ]
  }
}
```

### Pattern 11: Compile Validation Before Accepting Code

This `PostToolUse` hook rejects Claude's edits if they break compilation:

```bash
#!/bin/bash
# ~/.claude/hooks/compile-check.sh
# Reject file edits that don't compile

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "
import json, sys
d = json.load(sys.stdin)
path = d.get('tool_input', {}).get('path', '')
print(path)
")

if [ -z "$FILE" ]; then exit 0; fi

case "$FILE" in
  *.ts|*.tsx)
    # TypeScript compile check (type-check only, no emit)
    npx tsc --noEmit --skipLibCheck 2>&1
    if [ $? -ne 0 ]; then
        echo "TypeScript compilation failed after editing $FILE. Reverting and trying again."
        exit 2
    fi
    ;;
  *.go)
    go build ./... 2>&1
    if [ $? -ne 0 ]; then
        echo "Go build failed after editing $FILE."
        exit 2
    fi
    ;;
  *.rs)
    cargo check --quiet 2>&1
    if [ $? -ne 0 ]; then
        echo "Rust cargo check failed after editing $FILE."
        exit 2
    fi
    ;;
  *.cs)
    dotnet build --nologo -q 2>&1
    if [ $? -ne 0 ]; then
        echo ".NET build failed after editing $FILE."
        exit 2
    fi
    ;;
esac

exit 0
```

### Pattern 12: Prompt Enrichment — Auto-inject File Context

This `UserPromptSubmit` hook enriches user prompts with relevant context:

```python
#!/usr/bin/env python3
# ~/.claude/hooks/prompt-enricher.py
"""
Enriches user prompts by auto-injecting context when specific keywords appear.
E.g. "fix bug" → inject recent error log
     "review" → inject git diff
     "deploy" → inject deployment checklist
"""
import json, sys, os, subprocess

payload = json.load(sys.stdin)
prompt = payload.get('prompt', '').lower()
project_dir = payload.get('project_dir', '.')

context_lines = []

# Inject git diff when reviewing changes
if any(kw in prompt for kw in ['review', 'change', 'diff', 'modified']):
    try:
        diff = subprocess.check_output(
            ['git', 'diff', '--stat', 'HEAD'],
            cwd=project_dir, text=True, timeout=5
        )
        if diff.strip():
            context_lines.append(f"\n[Auto-context: Recent git changes]\n{diff}")
    except Exception:
        pass

# Inject error log context when debugging
if any(kw in prompt for kw in ['error', 'bug', 'fail', 'crash', 'exception']):
    log_file = os.path.join(project_dir, 'logs', 'error.log')
    if os.path.exists(log_file):
        try:
            with open(log_file) as f:
                lines = f.readlines()[-20:]  # last 20 lines
            context_lines.append(f"\n[Auto-context: Recent errors]\n{''.join(lines)}")
        except Exception:
            pass

# Inject deployment checklist for deploy prompts
if any(kw in prompt for kw in ['deploy', 'release', 'ship', 'publish']):
    checklist_path = os.path.join(project_dir, '.claude', 'deploy-checklist.md')
    if os.path.exists(checklist_path):
        with open(checklist_path) as f:
            context_lines.append(f"\n[Auto-context: Deployment checklist]\n{f.read()}")

if context_lines:
    print('\n'.join(context_lines))

sys.exit(0)
```

---

## 8. Hook Payload Reference

All hooks receive a JSON payload on stdin with this structure:

```typescript
interface HookPayload {
  // Always present
  event_name: string;           // "PreToolUse", "SessionStart", etc.
  session_id: string;           // Unique session identifier
  project_dir: string;          // Absolute path to project root

  // Tool events only
  tool_name?: string;           // "Bash", "Edit", "Read", etc.
  tool_input?: Record<string, any>; // Tool-specific input parameters
  tool_output?: any;            // PostToolUse only — tool's result
  tool_error?: string;          // PostToolUseFailure only — error message

  // Prompt events only
  prompt?: string;              // UserPromptSubmit — raw user text

  // Context
  model: string;                // Current model name
  transcript: Message[];        // Recent conversation history (truncated)
}
```

**Tool-specific `tool_input` shapes:**

```typescript
// Bash
{ command: string }

// Edit
{ path: string, old_string: string, new_string: string }

// Write
{ path: string, content: string }

// MultiEdit
{ path: string, edits: Array<{ old_string: string, new_string: string }> }

// Read
{ path: string, offset?: number, limit?: number }

// Glob
{ pattern: string, path?: string }

// Grep
{ pattern: string, path?: string, include?: string }

// Task
{ description: string, prompt: string }
```

---

## 9. Common Hook Mistakes

These mistakes appear frequently when setting up hooks for the first time:

### Mistake 1: Forgetting that hooks are snapshotted

**Symptom:** You edit `settings.json` but the hook doesn't run (or the old version runs).

**Fix:** Run `/hooks reload` after every change. Or restart the Claude Code session.

```
/hooks reload     ← always run this after editing hook config
```

### Mistake 2: Not reading from stdin correctly

**Wrong:**
```python
import sys
# This reads raw text, fails on malformed UTF-8, ignores buffering
data = sys.stdin.read()
payload = json.loads(data)
```

**Right:**
```python
import json, sys
# json.load handles buffering and encoding correctly
payload = json.load(sys.stdin)
```

### Mistake 3: Using exit code 1 intending to block

**Wrong:**
```python
if dangerous:
    print("Blocked!")
    sys.exit(1)   # ← 1 is a NON-BLOCKING warning
```

**Right:**
```python
if dangerous:
    print("Blocked!")
    sys.exit(2)   # ← 2 is the ONLY blocking exit code
```

### Mistake 4: Writing to stdout in non-blocking hooks (polluting Claude's context)

**Wrong:** Logging debug info to stdout in every hook, even when nothing is wrong.

**Right:** Only print to stdout what you want Claude to see. Use stderr for debugging:

```python
import sys

# Debug info — goes to terminal log, NOT Claude's context
print("Debug: checking command", file=sys.stderr)

# Context for Claude — only print when you have something useful
if problem_found:
    print(f"Warning: {problem_found}")  # stdout → Claude context
```

### Mistake 5: Slow hooks blocking every tool call

A 2-second hook on `PostToolUse` with matcher `.*` adds 2 seconds to every single tool call. A 10-turn session = 20 extra seconds minimum.

**Fix:** Be specific with matchers, use `timeout` fields, and keep hooks fast:

```json
{
  "PostToolUse": [{
    "matcher": "Edit|Write|MultiEdit",  // NOT .*
    "hooks": [{
      "type": "command",
      "command": "bash ~/.claude/hooks/fast-lint.sh",
      "timeout": 5                       // fail fast, don't block forever
    }]
  }]
}
```

### Mistake 6: Missing error handling causing hook crashes

If your hook script crashes (Python exception, bash error), it exits with a non-zero code that may be misinterpreted. Always handle exceptions:

```python
#!/usr/bin/env python3
import json, sys

try:
    payload = json.load(sys.stdin)
    # ... your logic ...
    sys.exit(0)
except Exception as e:
    print(f"Hook error (non-blocking): {e}", file=sys.stderr)
    sys.exit(0)  # exit 0 = don't block Claude when the hook itself fails
```

---

## 10. Debugging Hooks

### Check hook status

```
/hooks
```

Shows all configured hooks, their status, and any load errors.

### Reload hooks without restarting

```
/hooks reload
```

### Enable hook debug logging

```bash
CLAUDE_HOOK_DEBUG=1 claude
```

This prints hook invocations, payloads, and exit codes to the terminal.

### Test a hook manually

```bash
# Simulate a PreToolUse Bash event
echo '{"event_name":"PreToolUse","tool_name":"Bash","tool_input":{"command":"rm -rf /"},"session_id":"test","project_dir":"/tmp"}' \
  | python3 ~/.claude/hooks/bash-guard.py
echo "Exit: $?"
```

### Common hook problems

| Problem | Cause | Fix |
|---------|-------|-----|
| Hook silently not firing | Outdated snapshot | Run `/hooks reload` |
| Hook times out | Script takes too long | Reduce timeout or optimise script |
| Hook always exits 0 | Script error swallowed | Add `set -e` and explicit exit codes |
| JSON parse error | Malformed payload read | Use `json.load(sys.stdin)` not `sys.stdin.read()` |
| Environment variables missing | Not exported | Use `export VAR=value` in hook runner |

---

## 11. Performance Considerations

- Keep `command` hooks **fast** — they add latency to every matching tool call
- Use `timeout` fields to prevent slow hooks from blocking Claude
- Prefer `prompt` hooks (Haiku is very fast) over `agent` hooks for simple assessments
- `mcp_tool` hooks are async where possible — minimal latency overhead
- Avoid reading large files in hooks — snapshot what you need
- For high-frequency events (`PostToolUse` with `.*` matcher), use non-blocking logging

---

## 12. Enterprise Use Cases

### Compliance gate — prevent PII in generated code

```python
#!/usr/bin/env python3
import json, sys, re

payload = json.load(sys.stdin)
content = json.dumps(payload.get('tool_input', {}))

# PII patterns
PII_PATTERNS = [
    r'\b\d{3}-\d{2}-\d{4}\b',    # SSN
    r'\b4[0-9]{12}(?:[0-9]{3})?\b',  # Visa card
    r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}',  # Email
]

for pattern in PII_PATTERNS:
    if re.search(pattern, content):
        print(f"COMPLIANCE BLOCK: Potential PII detected in generated code.")
        sys.exit(2)

sys.exit(0)
```

### SOC 2 audit trail — immutable log

```python
#!/usr/bin/env python3
import json, sys, hashlib, datetime, os

payload = json.load(sys.stdin)
log_dir = '/var/log/claude-code-audit'
os.makedirs(log_dir, exist_ok=True)

ts = datetime.datetime.utcnow().isoformat()
entry = json.dumps({"ts": ts, "payload": payload})
digest = hashlib.sha256(entry.encode()).hexdigest()[:8]

with open(f'{log_dir}/{ts}_{digest}.json', 'w') as f:
    f.write(entry)

sys.exit(0)
```

### Policy enforcement via prompt hook

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [{
        "type": "prompt",
        "prompt": "You enforce corporate security policy. Block (exit 2) any Bash command that: (1) connects to external networks, (2) modifies system files outside /home or /tmp, (3) installs packages globally without sudo approval pattern. Allow all other commands (exit 0)."
      }]
    }
  ]
}
```

---

## Related Guides

- [CLI Technical Reference](./claude-code-reference) — Section 8: Hooks System (full API spec)
- [Permissions & Security](./permissions-security) — tool allowlists and blocklists
- [MCP Servers Guide](./mcp-servers-guide) — `mcp_tool` hook handler setup
- [CI/CD Integration](./cicd-integration) — hooks in non-interactive CI pipelines
