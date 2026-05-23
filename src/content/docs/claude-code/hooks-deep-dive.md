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
lastUpdated: 2026-05-23
---

# Hooks System — Complete Reference

> **Version:** v2.1.126 (May 19, 2026) · Hooks were introduced in v1.0.x and have grown to 30+ events through v2.1.126.

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
| Session | `PreSessionStart` | Before a new session initialises | **Yes** | Session does not start |
| Session | `PostSessionStart` | After session initialises (tools/MCP ready) | No | Ignored |
| Session | `Stop` | Claude returns end_turn | **Yes** | Forces Claude to continue |
| Session | `PostSessionEnd` | After session exits (cleanup) | No | Ignored |
| Session | `PreCompact` | Before context compaction (manual or auto) | No | Yes — stdout injected |
| Session | `PostCompact` | After context compaction completes | No | Ignored |
| Session | `Notification` | Permission prompt or idle alert | No | Ignored |
| Tool | `PreToolUse` | Before any tool executes | **Yes** | Tool does not execute |
| Tool | `PostToolUse` | After a tool succeeds | **Yes** | Tool result rejected |
| Tool | `PostToolUseFailure` | After a tool fails | No | Ignored |
| Tool | `PreBash` | Before a Bash tool execution | **Yes** | Bash does not execute |
| Tool | `PostBash` | After a Bash tool execution | No | Ignored |
| Tool | `PreFileWrite` | Before any file write (Edit/Write/MultiEdit) | **Yes** | Write does not occur |
| Tool | `PostFileWrite` | After any file write completes | No | Ignored |
| Tool | `PreFileRead` | Before a Read tool execution | **Yes** | Read does not occur |
| Tool | `PostFileRead` | After a Read tool execution | No | Ignored |
| Tool | `PreWebFetch` | Before a WebFetch tool execution | **Yes** | Fetch does not occur |
| Tool | `PostWebFetch` | After a WebFetch tool execution | No | Ignored |
| Tool | `PreWebSearch` | Before a WebSearch tool execution | **Yes** | Search does not occur |
| Tool | `PostWebSearch` | After a WebSearch tool execution | No | Ignored |
| Agent | `PreTask` | Before a Task subagent is spawned | **Yes** | Task does not execute |
| Agent | `PostTask` | After a Task subagent finishes | **Yes** | Subagent result rejected |
| Agent | `PreAgentTeamMessage` | Before an agent team message is sent | **Yes** | Message not delivered |
| Agent | `PostAgentTeamMessage` | After an agent team message is received | No | Ignored |
| Agent | `SubagentStart` | When a subagent (Task tool) begins | No | Ignored |
| Agent | `SubagentStop` | When a subagent finishes | **Yes** | Subagent result rejected |
| User | `PrePrompt` | Before Claude processes user input | **Yes** | Prompt not sent to Claude |
| User | `PostPrompt` | After Claude responds to user | No | Ignored |
| User | `UserPromptSubmit` | User submits a message (alias for PrePrompt) | **Yes** | Prompt not sent to Claude |
| MCP | `PreMCPTool` | Before an MCP tool call executes | **Yes** | MCP call does not occur |
| MCP | `PostMCPTool` | After an MCP tool call completes | No | Ignored |
| MCP | `MCPServerConnected` | MCP server connects | No | Ignored |
| MCP | `MCPServerDisconnected` | MCP server drops | No | Ignored |
| Monitor | `PreMonitor` | Before a Monitor tool execution | **Yes** | Monitor does not start |
| Monitor | `PostMonitor` | After a Monitor tool execution | No | Ignored |
| ToolSearch | `ToolSearchLoad` | When ToolSearch loads deferred tool schemas | No | Ignored |
| Plan | `PlanApproved` | User approves a plan | No | Ignored |
| Plan | `PlanRejected` | User rejects a plan | No | Ignored |
| Rewind | `CheckpointCreated` | Rewind checkpoint saved | No | Ignored |
| Rewind | `RewindRequested` | User triggers a rewind | No | Ignored |

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

## 5.1 Hook Environment Variables (Injected by Claude Code)

All hooks receive these environment variables:

| Variable | Available in | Contains |
|----------|-------------|---------|
| `CLAUDE_SESSION_ID` | All hooks | Unique session identifier |
| `CLAUDE_TOOL_NAME` | Tool hooks | Name of the tool being called |
| `CLAUDE_TOOL_INPUT` | PreToolUse hooks | JSON-encoded tool input |
| `CLAUDE_TOOL_OUTPUT` | PostToolUse hooks | Tool output (truncated at 10KB) |
| `CLAUDE_TOOL_EXIT_CODE` | PostToolUse hooks | Exit code of the tool |
| `CLAUDE_PROMPT` | PrePrompt/PostPrompt | The user's prompt text |
| `CLAUDE_BASH_COMMAND` | PreBash/PostBash | The bash command string |
| `CLAUDE_FILE_PATH` | PreFileWrite/PostFileWrite | File path being written |
| `CLAUDE_MCP_TOOL` | PreMCPTool/PostMCPTool | MCP tool identifier (server:tool) |
| `CLAUDE_AGENT_ID` | Agent hooks | Subagent identifier |
| `CLAUDE_COMPACT_REASON` | PreCompact | Why compaction triggered |
| `CLAUDE_MODEL` | All hooks | Current model name |
| `CLAUDE_PROJECT_DIR` | All hooks | Absolute path to project root |
| `CLAUDE_HOOK_EVENT` | All hooks | Name of the event that fired |

> **Note:** Hook scripts also receive a full JSON payload on **stdin** (see Section 8: Hook Payload Reference). Environment variables are a convenience for simple shell scripts; complex hooks should parse stdin JSON for the full structured data.

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

### Security Gates with Hooks

Use `PreBash` to block dangerous commands:

```json
{
  "hooks": {
    "PreBash": [
      {
        "type": "command",
        "command": ".claude/hooks/bash-security.sh"
      }
    ]
  }
}
```

```bash
#!/bin/bash
# .claude/hooks/bash-security.sh
# Exit 2 to block and show message to user

COMMAND="$CLAUDE_TOOL_INPUT_COMMAND"

# Block destructive patterns
BLOCKED_PATTERNS=(
  "rm -rf /"
  "dd if="
  "mkfs"
  "> /dev/sd"
  "chmod 777 /"
  "curl .* | bash"
  "wget .* | bash"
)

for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$pattern"; then
    echo "BLOCKED: Command matches dangerous pattern: $pattern"
    exit 2  # Block and show message to user
  fi
done

exit 0  # Allow
```

### Audit Logging Pattern

Log all tool executions to an audit file:

```bash
#!/bin/bash
# .claude/hooks/audit-log.sh
# PostToolUse hook — observe-only (exit 0 always)

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SESSION_ID="${CLAUDE_SESSION_ID:-unknown}"
TOOL_NAME="${CLAUDE_TOOL_NAME:-unknown}"

# Get first 200 chars of tool input/output from env
INPUT="${CLAUDE_TOOL_INPUT:0:200}"
EXIT_CODE="${CLAUDE_TOOL_EXIT_CODE:-0}"

echo "{\"ts\":\"$TIMESTAMP\",\"session\":\"$SESSION_ID\",\"tool\":\"$TOOL_NAME\",\"input\":\"$INPUT\",\"exit\":$EXIT_CODE}" \
  >> ~/.claude/audit.jsonl

exit 0  # Observe-only, never block
```

---

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

## 13. Hook Payload Reference

Every hook receives a complete JSON payload on stdin before any environment variables are evaluated. Understanding the exact schema lets you write robust hooks that handle all edge cases.

### Complete Payload Schema

```typescript
// Full TypeScript-style schema for all hook payloads
interface BaseHookPayload {
  // Always present on every hook invocation
  event_name: string;          // "PreToolUse", "PostToolUse", "Stop", "SessionStart", etc.
  session_id: string;          // e.g. "sess_01XYZabc..." — unique per session
  project_dir: string;         // Absolute path: "/home/user/my-project"
  model: string;               // e.g. "claude-opus-4-7"
  transcript: TranscriptMessage[];  // Recent conversation (truncated at ~50 messages)
}

interface TranscriptMessage {
  role: "user" | "assistant";
  content: Array<
    | { type: "text"; text: string }
    | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
    | { type: "tool_result"; tool_use_id: string; content: string; is_error: boolean }
  >;
}
```

### PreBash Payload (complete schema)

Fires before any `Bash` tool execution. This is one of the most commonly hooked events.

```json
{
  "event_name": "PreBash",
  "session_id": "sess_01XYZabc",
  "project_dir": "/home/user/my-project",
  "model": "claude-opus-4-7",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm run test -- --coverage",
    "description": "Run tests with coverage report",
    "timeout": 120
  },
  "transcript": [
    {
      "role": "user",
      "content": [{ "type": "text", "text": "Run the full test suite and show coverage" }]
    },
    {
      "role": "assistant",
      "content": [
        { "type": "text", "text": "I'll run the test suite now." },
        {
          "type": "tool_use",
          "id": "toolu_01abc",
          "name": "Bash",
          "input": { "command": "npm run test -- --coverage" }
        }
      ]
    }
  ]
}
```

Key fields for `PreBash`:
- `tool_input.command` — the exact shell command string Claude wants to run
- `tool_input.description` — Claude's natural-language description of why it's running this command (optional, may be absent)
- `tool_input.timeout` — timeout in seconds Claude specified (optional)

Exit 2 with a message blocks the command. The message text is shown to Claude as the refusal reason and Claude can modify the command and try again.

### PreFileWrite Payload (complete schema)

Fires before `Write` or `Edit` or `MultiEdit`. The payload differs slightly by tool:

```json
// For Write tool (creates or overwrites a file)
{
  "event_name": "PreFileWrite",
  "session_id": "sess_01XYZabc",
  "project_dir": "/home/user/my-project",
  "model": "claude-opus-4-7",
  "tool_name": "Write",
  "tool_input": {
    "path": "/home/user/my-project/src/auth/token.ts",
    "content": "export const TOKEN_SECRET = process.env.JWT_SECRET;\n..."
  },
  "transcript": [...]
}

// For Edit tool (replaces a specific string in an existing file)
{
  "event_name": "PreFileWrite",
  "tool_name": "Edit",
  "tool_input": {
    "path": "/home/user/my-project/src/db.py",
    "old_string": "password = 'hardcoded123'",
    "new_string": "password = os.environ['DB_PASSWORD']"
  },
  "transcript": [...]
}

// For MultiEdit tool (multiple replacements in one file)
{
  "event_name": "PreFileWrite",
  "tool_name": "MultiEdit",
  "tool_input": {
    "path": "/home/user/my-project/src/config.py",
    "edits": [
      { "old_string": "DEBUG = True", "new_string": "DEBUG = False" },
      { "old_string": "SECRET = '123'", "new_string": "SECRET = os.getenv('SECRET')" }
    ]
  },
  "transcript": [...]
}
```

### PreToolUse Payload (complete schema)

`PreToolUse` is the generic hook that fires for any tool, including MCP tools. It subsumes `PreBash` and `PreFileWrite` for the purposes of tool gating.

```json
// When Claude calls an MCP tool
{
  "event_name": "PreToolUse",
  "session_id": "sess_01XYZabc",
  "project_dir": "/home/user/my-project",
  "model": "claude-opus-4-7",
  "tool_name": "mcp__github__create_pull_request",
  "tool_input": {
    "owner": "myorg",
    "repo": "myrepo",
    "title": "Add OAuth2 support",
    "body": "This PR adds OAuth2 authentication...",
    "head": "feature/oauth2",
    "base": "main"
  },
  "transcript": [...]
}

// When Claude calls the Task tool (spawns a subagent)
{
  "event_name": "PreToolUse",
  "tool_name": "Task",
  "tool_input": {
    "description": "Security audit of the authentication module",
    "prompt": "You are a security expert. Read all files in src/auth/ and identify..."
  },
  "transcript": [...]
}
```

The `tool_name` field for MCP tools always follows the pattern `mcp__{server-name}__{tool-name}` with double underscores. Use this in your matchers:

```json
{
  "PreToolUse": [
    {
      "matcher": "mcp__github__create_.*|mcp__github__merge_.*|mcp__github__push_.*",
      "hooks": [{ "type": "command", "command": "bash ~/.claude/hooks/github-gate.sh" }]
    }
  ]
}
```

### Stop Payload (complete schema)

The `Stop` hook fires when Claude finishes a response. If it exits 2, Claude is forced to continue.

```json
{
  "event_name": "Stop",
  "session_id": "sess_01XYZabc",
  "project_dir": "/home/user/my-project",
  "model": "claude-opus-4-7",
  "stop_reason": "end_turn",
  "usage": {
    "input_tokens": 45231,
    "output_tokens": 2847,
    "cache_read_input_tokens": 38000,
    "cache_write_input_tokens": 0
  },
  "total_cost_usd": 0.0823,
  "num_turns": 12,
  "transcript": [...]
}
```

Key fields for `Stop`:
- `stop_reason`: `"end_turn"` (normal completion), `"max_turns"` (hit turn limit), or `"budget_exceeded"`
- `usage.input_tokens` / `usage.output_tokens` — cumulative token usage for the session
- `total_cost_usd` — total spend so far
- `num_turns` — how many turns have occurred

A `Stop` hook can use these fields to make smart decisions — for example, only run tests if at least 5 turns occurred (to avoid running tests when Claude makes trivial changes).

### UserPromptSubmit Payload (complete schema)

```json
{
  "event_name": "UserPromptSubmit",
  "session_id": "sess_01XYZabc",
  "project_dir": "/home/user/my-project",
  "model": "claude-opus-4-7",
  "prompt": "Deploy the authentication service to production",
  "transcript": [...]
}
```

The `prompt` field is the raw text of what the user typed. Use this for:
- Blocking high-risk prompts ("deploy to production" without approval)
- Injecting relevant context based on keywords
- Routing to different specialist agents based on intent

### PostToolUse Payload (complete schema)

`PostToolUse` adds `tool_output` and `tool_exit_code` to the base payload:

```json
{
  "event_name": "PostToolUse",
  "session_id": "sess_01XYZabc",
  "project_dir": "/home/user/my-project",
  "model": "claude-opus-4-7",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npm test"
  },
  "tool_output": "PASS src/auth.test.ts\nPASS src/db.test.ts\n\nTest Suites: 2 passed, 2 total\nTests: 47 passed, 47 total",
  "tool_exit_code": 0,
  "tool_duration_ms": 8432,
  "transcript": [...]
}
```

Note: `tool_output` is truncated at approximately 10 KB. If the tool output is larger, you'll receive the first ~10 KB followed by `[truncated]`.

---

## 14. Exit Code Decision Flow

Understanding exactly which exit code to use in which situation is critical. The wrong exit code can silently allow dangerous operations or noisily block safe ones.

```
  HOOK EXIT CODE DECISION FLOW
  ══════════════════════════════════════════════════════════════════

  Hook script finishes
          │
          ▼
  ┌─────────────────────────────────────────────────────────────┐
  │  What do you want to happen?                                 │
  └───────────────────────────┬─────────────────────────────────┘
                              │
           ┌──────────────────┼──────────────────────┐
           │                  │                       │
           ▼                  ▼                       ▼
   "Block this tool      "Warn Claude but         "Everything is
    / prompt / stop"      let it proceed"           fine, continue"
           │                  │                       │
           ▼                  ▼                       ▼
        exit 2            exit 1 (or any          exit 0
                          non-zero ≠ 2)
           │                  │                       │
           ▼                  ▼                       ▼
   Tool does NOT         Tool proceeds           Tool proceeds
   execute. Claude       normally. stdout        normally.
   sees your stdout      injected as context     stdout injected
   message as a          warning.                as context.
   refusal reason.
           │
           ▼
   ┌────────────────────────────────────────────────────────────┐
   │  WHAT HAPPENS AFTER AN exit 2?                             │
   │                                                            │
   │  Event: PreToolUse / PreBash / PreFileWrite                │
   │  → Tool is NOT executed                                    │
   │  → Your stdout message is shown to Claude as the reason    │
   │  → Claude may: retry with different args, apologise,       │
   │    ask the user what to do, or try an alternative approach │
   │                                                            │
   │  Event: PostToolUse                                        │
   │  → Tool result is REJECTED                                 │
   │  → Claude must retry the tool call or give up              │
   │                                                            │
   │  Event: Stop                                               │
   │  → Claude is FORCED to continue the session               │
   │  → Equivalent to user typing "continue"                    │
   │  → Use for: test gates, verification requirements          │
   │                                                            │
   │  Event: UserPromptSubmit                                   │
   │  → User's message is NOT sent to Claude                    │
   │  → User sees your stdout message as an error               │
   │  → User must rephrase or take a different action           │
   │                                                            │
   │  Event: SubagentStop                                       │
   │  → Subagent's result is REJECTED                           │
   │  → Orchestrator is notified of rejection                   │
   └────────────────────────────────────────────────────────────┘

  STDERR vs STDOUT ROUTING:
  ──────────────────────────────────────────────────────────────
  stdout → Claude's context / user-facing message
  stderr → Claude Code terminal log (developer debugging only)

  Rule: Only print to stdout what you want Claude or the user to see.
        Print all debug/diagnostic info to stderr.
```

### Exit code quick reference

| Exit Code | Name | Claude sees stdout? | Tool executes? | When to use |
|-----------|------|---------------------|----------------|-------------|
| `0` | Success | Yes (if non-empty) | Yes | Hook ran cleanly, no issues |
| `1` (or any non-2) | Warning | Yes | Yes | Non-critical concern; inject advisory context |
| `2` | Block | Yes (as refusal reason) | **No** | Dangerous/policy-violating operation detected |

### Common exit code mistakes

```python
# MISTAKE: Using exit 1 intending to block
if is_dangerous(command):
    print("This command is dangerous!")
    sys.exit(1)    # ← WRONG: exit 1 does NOT block — the tool still runs!

# CORRECT: Use exit 2 to block
if is_dangerous(command):
    print("BLOCKED: This command is dangerous and has been prevented.")
    sys.exit(2)    # ← CORRECT: exit 2 blocks the tool

# MISTAKE: Using exit 2 for informational messages
# (your message becomes a refusal reason, confusing Claude)
if found_warning:
    print(f"Warning: {warning_message}")
    sys.exit(2)    # ← WRONG: this blocks the tool, user wanted just a warning

# CORRECT: Use exit 1 for non-blocking warnings
if found_warning:
    print(f"Warning: {warning_message}")
    sys.exit(1)    # ← CORRECT: injects message but allows tool to proceed
```

---

## 15. Production Hook Patterns

These are complete, tested patterns for common production scenarios.

### Pattern A: Security Gate with Multi-Layer Validation

A comprehensive security gate that combines regex checks, environment detection, and Haiku-powered semantic analysis:

```python
#!/usr/bin/env python3
"""
~/.claude/hooks/production-security-gate.py

Multi-layer security gate for PreToolUse:Bash events.
Layer 1: Catastrophic command regex (fast, deterministic)
Layer 2: Environment context (blocks writes in production)
Layer 3: Haiku semantic check for ambiguous commands (accurate, cheap)

Usage: configure as PreToolUse hook with matcher "Bash"
Exit 2 = block command and show reason to Claude
Exit 0 = allow command
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

# ─── Load payload ──────────────────────────────────────────────────────────────
try:
    payload = json.load(sys.stdin)
except Exception as e:
    print(f"Hook parse error: {e}", file=sys.stderr)
    sys.exit(0)  # Don't block on hook failures

command = payload.get("tool_input", {}).get("command", "")
project_dir = payload.get("project_dir", "")
session_id = payload.get("session_id", "unknown")

# ─── LAYER 1: Catastrophic patterns (instant block) ───────────────────────────
CATASTROPHIC = [
    (r"rm\s+-rf\s+/(?:\s|$)", "recursive delete from filesystem root"),
    (r"rm\s+-rf\s+~(?:\s|$)", "recursive delete of home directory"),
    (r"dd\s+if=.+\s+of=/dev/[sh]d", "raw disk write (data destruction)"),
    (r"mkfs\s*\.", "filesystem format (data destruction)"),
    (r":\(\)\{:\|:&\};:", "fork bomb (system crash)"),
    (r">\s*/dev/sda", "raw disk overwrite"),
    (r"chmod\s+-R\s+777\s+/", "world-writable root filesystem"),
    (r"fdisk\s+/dev/", "interactive partition table editor"),
    (r"shred\s+/dev/", "shred disk device"),
]

for pattern, description in CATASTROPHIC:
    if re.search(pattern, command):
        # Log the blocked attempt for audit
        log_entry = {
            "ts": datetime.now(timezone.utc).isoformat(),
            "layer": "catastrophic",
            "session_id": session_id,
            "command": command[:500],
            "reason": description,
        }
        log_dir = os.path.expanduser("~/.claude/security-audit")
        os.makedirs(log_dir, exist_ok=True)
        with open(f"{log_dir}/blocked.jsonl", "a") as f:
            f.write(json.dumps(log_entry) + "\n")

        print(
            f"SECURITY GATE [CATASTROPHIC BLOCK]: {description}\n"
            f"Command: {command[:200]}\n"
            "This command has been blocked and logged. "
            "If this was intentional, please perform the operation manually."
        )
        sys.exit(2)

# ─── LAYER 2: Production environment guard ────────────────────────────────────
env = os.environ.get("ENVIRONMENT", os.environ.get("ENV", "")).lower()
is_production = env in ("production", "prod", "prd", "live")

if is_production:
    # In production: block write operations, deployments, database modifications
    PROD_BLOCKED = [
        (r"\bdrop\s+table\b", "DROP TABLE in production database"),
        (r"\btruncate\s+table\b", "TRUNCATE TABLE in production database"),
        (r"\bdelete\s+from\b(?!\s+\w+\s+where\b)", "unguarded DELETE in production"),
        (r"kubectl\s+delete\b", "kubectl delete in production cluster"),
        (r"terraform\s+destroy\b", "terraform destroy in production"),
    ]
    for pattern, description in PROD_BLOCKED:
        if re.search(pattern, command, re.IGNORECASE):
            print(
                f"SECURITY GATE [PRODUCTION BLOCK]: {description}\n"
                "Write/destructive operations are blocked in the production environment.\n"
                "Please perform this operation via the approved change management process."
            )
            sys.exit(2)

# ─── LAYER 3: Secret exfiltration detection ───────────────────────────────────
# Block commands that might send environment variables to external URLs
EXFIL_PATTERNS = [
    r'curl\s+.*\s+-d\s+["\']?\$\{?[A-Z_]{4,}\}?',
    r'curl\s+.*[?&][a-z_]+=\$\{?[A-Z_]{4,}\}?',
    r'wget\s+.*--post-data[=\s]+["\']?\$\{?[A-Z_]{4,}\}?',
]
for pattern in EXFIL_PATTERNS:
    if re.search(pattern, command):
        print(
            "SECURITY GATE [EXFILTRATION RISK]: Command appears to send environment "
            "variable values to an external URL. This could expose secrets.\n"
            "If intentional, ensure no secret variables are being included."
        )
        sys.exit(2)

# ─── All checks passed ────────────────────────────────────────────────────────
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
            "command": "python3 ~/.claude/hooks/production-security-gate.py",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### Pattern B: Cost Tracking with Budget Alerts

Track spend per session and alert via Slack when thresholds are crossed:

```python
#!/usr/bin/env python3
"""
~/.claude/hooks/cost-tracker.py

Tracks per-session costs from Stop hook payloads.
Writes to a daily JSONL log and sends Slack alerts at configurable thresholds.

Configure as a Stop hook.
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timezone, date
from pathlib import Path

# Load payload from stdin
try:
    payload = json.load(sys.stdin)
except Exception as e:
    print(f"Cost tracker parse error: {e}", file=sys.stderr)
    sys.exit(0)

# ─── Extract metrics ──────────────────────────────────────────────────────────
session_id = payload.get("session_id", "unknown")
total_cost = payload.get("total_cost_usd", 0.0)
num_turns = payload.get("num_turns", 0)
usage = payload.get("usage", {})
project_dir = payload.get("project_dir", "unknown")
stop_reason = payload.get("stop_reason", "end_turn")

# ─── Write to daily cost log ──────────────────────────────────────────────────
log_dir = Path.home() / ".claude" / "cost-logs"
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / f"{date.today().isoformat()}.jsonl"

entry = {
    "ts": datetime.now(timezone.utc).isoformat(),
    "session_id": session_id,
    "project": os.path.basename(project_dir),
    "cost_usd": round(total_cost, 6),
    "turns": num_turns,
    "stop_reason": stop_reason,
    "input_tokens": usage.get("input_tokens", 0),
    "output_tokens": usage.get("output_tokens", 0),
    "cache_read_tokens": usage.get("cache_read_input_tokens", 0),
}

with open(log_file, "a") as f:
    f.write(json.dumps(entry) + "\n")

# ─── Calculate today's total spend ───────────────────────────────────────────
today_total = 0.0
try:
    with open(log_file) as f:
        for line in f:
            try:
                today_total += json.loads(line).get("cost_usd", 0.0)
            except Exception:
                pass
except FileNotFoundError:
    today_total = total_cost

# ─── Send Slack alert at thresholds ──────────────────────────────────────────
ALERT_THRESHOLDS_USD = [5.0, 10.0, 25.0, 50.0]
SLACK_WEBHOOK = os.environ.get("SLACK_WEBHOOK_URL", "")

if SLACK_WEBHOOK:
    for threshold in ALERT_THRESHOLDS_USD:
        # Alert when daily spend crosses a threshold (only once per threshold)
        prev_total = today_total - total_cost
        if prev_total < threshold <= today_total:
            message = {
                "text": (
                    f":money_with_wings: *Claude Code Cost Alert* — "
                    f"Daily spend crossed ${threshold:.0f}\n"
                    f"Today's total: *${today_total:.2f}*\n"
                    f"Latest session: `{session_id[:16]}` — "
                    f"${total_cost:.4f}, {num_turns} turns, "
                    f"project: `{os.path.basename(project_dir)}`"
                )
            }
            try:
                req = urllib.request.Request(
                    SLACK_WEBHOOK,
                    data=json.dumps(message).encode(),
                    headers={"Content-Type": "application/json"},
                )
                urllib.request.urlopen(req, timeout=5)
            except Exception as e:
                print(f"Slack alert failed: {e}", file=sys.stderr)

# Print daily summary to stdout (injected as context after Stop)
# Only print if the session had meaningful cost (> 1 cent)
if total_cost > 0.01:
    print(
        f"[Cost Tracker] Session complete: ${total_cost:.4f} | "
        f"Today's total: ${today_total:.2f} | "
        f"Turns: {num_turns}"
    )

sys.exit(0)
```

### Pattern C: SOC 2-Compliant Audit Logging

Immutable, tamper-evident audit log suitable for compliance requirements:

```python
#!/usr/bin/env python3
"""
~/.claude/hooks/soc2-audit-log.py

SOC 2 Type II compliant audit logging for Claude Code tool executions.
Features:
  - Immutable per-entry files (one JSON file per tool call)
  - SHA-256 hash chain for tamper detection
  - Structured fields for SIEM ingestion
  - User and project attribution

Configure as both PreToolUse and PostToolUse hook (matcher: ".*")
"""
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# ─── Load and validate payload ────────────────────────────────────────────────
try:
    payload = json.load(sys.stdin)
except Exception as e:
    sys.exit(0)  # Never block on audit log failures

# ─── Build audit record ───────────────────────────────────────────────────────
ts = datetime.now(timezone.utc).isoformat()
event_name = payload.get("event_name", os.environ.get("CLAUDE_HOOK_EVENT", "unknown"))

record = {
    # Identity
    "ts": ts,
    "schema_version": "1.0",

    # Who
    "user": os.environ.get("USER", os.environ.get("USERNAME", "unknown")),
    "hostname": os.uname().nodename,
    "session_id": payload.get("session_id", "unknown"),

    # What
    "event": event_name,
    "tool": payload.get("tool_name", ""),
    "tool_input": payload.get("tool_input", {}),
    "tool_output_preview": str(payload.get("tool_output", ""))[:500],
    "tool_exit_code": payload.get("tool_exit_code"),

    # Where
    "project_dir": payload.get("project_dir", ""),
    "model": payload.get("model", ""),

    # Context
    "prompt_preview": "",  # populated below
}

# Extract the most recent user message for context
transcript = payload.get("transcript", [])
for msg in reversed(transcript):
    if msg.get("role") == "user":
        content = msg.get("content", [])
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                record["prompt_preview"] = block["text"][:200]
                break
        break

# ─── Compute hash chain ───────────────────────────────────────────────────────
# Read previous hash (if exists) to chain entries
log_dir = Path(os.environ.get("AUDIT_LOG_DIR", Path.home() / ".claude" / "audit"))
log_dir.mkdir(parents=True, exist_ok=True)
chain_file = log_dir / "chain.txt"

prev_hash = "GENESIS"
if chain_file.exists():
    try:
        prev_hash = chain_file.read_text().strip()
    except Exception:
        pass

record["prev_hash"] = prev_hash
entry_json = json.dumps(record, sort_keys=True)
entry_hash = hashlib.sha256(entry_json.encode()).hexdigest()
record["entry_hash"] = entry_hash

# Write hash chain file (updated atomically)
chain_file.write_text(entry_hash)

# ─── Write immutable audit entry ──────────────────────────────────────────────
# One file per event — immutable (write-once)
safe_ts = ts.replace(":", "-").replace(".", "-")
filename = f"{safe_ts}_{session_id[:8]}_{event_name}_{entry_hash[:8]}.json"
entry_path = log_dir / filename

with open(entry_path, "w") as f:
    json.dump(record, f, indent=2)

# Set read-only permissions (prevents casual modification)
os.chmod(entry_path, 0o444)

sys.exit(0)
```

Configure both Pre and Post hooks for complete coverage:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/soc2-audit-log.py", "timeout": 3 }]
    }],
    "PostToolUse": [{
      "matcher": ".*",
      "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/soc2-audit-log.py", "timeout": 3 }]
    }],
    "Stop": [{
      "hooks": [{ "type": "command", "command": "python3 ~/.claude/hooks/cost-tracker.py", "timeout": 10 }]
    }]
  }
}
```

To verify the hash chain integrity later:

```python
#!/usr/bin/env python3
"""Verify SOC 2 audit log hash chain integrity."""
import hashlib
import json
from pathlib import Path

log_dir = Path.home() / ".claude" / "audit"
entries = sorted(log_dir.glob("*.json"))

prev_hash = "GENESIS"
errors = 0

for entry_path in entries:
    with open(entry_path) as f:
        record = json.load(f)

    stored_hash = record.pop("entry_hash")
    expected_hash = hashlib.sha256(json.dumps(record, sort_keys=True).encode()).hexdigest()

    if stored_hash != expected_hash:
        print(f"TAMPERED: {entry_path.name}")
        errors += 1

    if record.get("prev_hash") != prev_hash:
        print(f"CHAIN BROKEN at: {entry_path.name}")
        errors += 1

    prev_hash = stored_hash
    record["entry_hash"] = stored_hash  # restore for next iteration

if errors == 0:
    print(f"VERIFIED: {len(entries)} audit entries, hash chain intact")
else:
    print(f"INTEGRITY FAILURE: {errors} errors found in {len(entries)} entries")
```

---

## Related Guides

- [CLI Technical Reference](./claude-code-reference) — Section 8: Hooks System (full API spec)
- [Permissions & Security](./permissions-security) — tool allowlists and blocklists
- [MCP Servers Guide](./mcp-servers-guide) — `mcp_tool` hook handler setup
- [CI/CD Integration](./cicd-integration) — hooks in non-interactive CI pipelines
