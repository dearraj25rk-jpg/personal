---
title: Session Management & Resumability — Complete Reference
description: >
  Complete reference for Claude Code session management — session lifecycle, persistence
  on disk (location, JSON format, project hash), the /resume and /rename commands,
  multi-session workflows, non-interactive session management with --session flags,
  Python and TypeScript SDK StatefulClient, session state deep dive with compaction
  and MEMORY.md, cost tracking per session, session security, and troubleshooting.
  Claude Code v2.1.126 (May 2026).
sidebar:
  order: 29
  label: Session Management
lastUpdated: 2026-06-06
---

# Session Management & Resumability — Complete Reference

> **Version:** v2.1.126 (May 19, 2026) · Session persistence introduced in v1.8.0 · `/rename` command added in v2.0.x · StatefulClient SDK introduced in v2.1.0

A Claude Code session is the fundamental unit of work — a continuous conversation with its own context window, tool history, cost accounting, and persistent identity. Understanding how sessions are created, stored, resumed, and managed is essential for productive Claude Code workflows.

---

## 1. Session Lifecycle Overview

Every Claude Code session passes through a defined set of phases from creation to archival.

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                     CLAUDE CODE SESSION LIFECYCLE                          ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  ┌─────────────────┐                                                      ║
║  │   SESSION START  │                                                      ║
║  │                 │  • New session ID generated (UUID v4)                ║
║  │  claude         │  • Project hash computed from CWD                    ║
║  │  (or --session) │  • Session file created on disk                      ║
║  │                 │  • CLAUDE.md files loaded into context               ║
║  │                 │  • MEMORY.md loaded (if exists)                      ║
║  │                 │  • MCP servers initialized                           ║
║  └────────┬────────┘                                                      ║
║           │                                                               ║
║           ▼                                                               ║
║  ┌─────────────────┐                                                      ║
║  │  ACTIVE SESSION  │                                                      ║
║  │                 │  • Each turn appended to session file                ║
║  │  (interactive   │  • Tool calls recorded with inputs and outputs       ║
║  │   REPL)         │  • Cost tracked per turn                             ║
║  │                 │  • Context window grows each turn                    ║
║  │                 │  • Auto-compact at ~85% context capacity             ║
║  └────────┬────────┘                                                      ║
║           │                                                               ║
║    ┌──────┴──────┐                                                        ║
║    │             │                                                         ║
║    ▼             ▼                                                         ║
║  ┌──────┐  ┌──────────────┐                                               ║
║  │/clear│  │ Auto-compact │  • Context pruned to fit window               ║
║  │      │  │   triggered  │  • CLAUDE.md re-injected                     ║
║  │New   │  │              │  • MEMORY.md re-injected                     ║
║  │turn  │  │              │  • Tool history pruned                        ║
║  └──┬───┘  └──────┬───────┘                                               ║
║     │              │                                                       ║
║     └──────┬───────┘                                                      ║
║            ▼                                                              ║
║  ┌─────────────────┐                                                      ║
║  │  SESSION END     │                                                      ║
║  │                 │  • Triggered by Ctrl+D, /exit, or process kill       ║
║  │  (Ctrl+D or     │  • Session file flushed and closed                   ║
║  │   /exit)        │  • Session index updated                             ║
║  │                 │  • Session available for /resume                     ║
║  └────────┬────────┘                                                      ║
║           │                                                               ║
║           ▼                                                               ║
║  ┌─────────────────┐                                                      ║
║  │  RESUMED SESSION │                                                      ║
║  │                 │  • Full conversation history restored                ║
║  │  /resume or     │  • CLAUDE.md and MEMORY.md re-loaded                ║
║  │  --session      │  • Context window rebuilt from history               ║
║  │                 │  • Token cost of history paid again on resume        ║
║  └─────────────────┘                                                      ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### What State is Maintained During a Session

| State category | Maintained during session | Survives session end |
|----------------|--------------------------|---------------------|
| Conversation history | Yes | Yes (on disk) |
| Tool call results | Yes (in history) | Yes (on disk) |
| File system changes | Yes (actual disk state) | Yes (actual disk state) |
| `/clear` resets history | Clears context | N/A |
| Model choice (`/model`) | Yes | No — resets to default |
| Mode (Normal/Auto/Plan) | Yes | No — resets to Normal |
| Approved tool permissions | Yes (session-local "always allow") | No |
| Cost accumulation | Yes | Visible in session file |
| Custom keybindings | Yes (from keybindings.json) | Yes (file persists) |

---

## 2. Session Persistence — What Lives on Disk

### Session File Location

Every session is written to disk as a JSON file at:

```
~/.claude/projects/<project-hash>/sessions/<session-id>.json
```

Where:
- `<project-hash>` is a SHA-256-derived identifier for the project (see below)
- `<session-id>` is a UUID v4 generated when the session starts

**Example:**

```
~/.claude/
└── projects/
    └── a3f8c2e1d4b7f9a0c5e3b1d2a4f6c8e0/    ← Project hash
        ├── sessions/
        │   ├── f47ac10b-58cc-4372-a567-0e02b2c3d479.json  ← Session file
        │   ├── 8b4f03c2-1234-5678-9abc-def012345678.json
        │   └── .index.json                                 ← Sessions index
        ├── memory/
        │   └── MEMORY.md                                   ← Auto-memory
        └── history                                         ← Prompt history
```

### The Project Identity Hash

The project hash is computed from the **absolute path of your working directory** when you start Claude Code. This means:

- `/home/alice/projects/myapp` → always the same hash for Alice's myapp
- `/home/bob/projects/myapp` → different hash (different user, different path)
- `/home/alice/projects/myapp-v2` → different hash (different directory)
- Moving the project directory changes its hash, breaking session discovery

**Hash computation:**

```python
import hashlib, os

project_path = os.path.abspath(os.getcwd())
project_hash = hashlib.sha256(project_path.encode()).hexdigest()[:32]
# Truncated to 32 hex characters
```

You can find your current project's hash by inspecting the directory:

```bash
ls ~/.claude/projects/
# Output: a3f8c2e1d4b7f9a0c5e3b1d2a4f6c8e0  ...other hashes...

# Find which hash belongs to which project:
cat ~/.claude/projects/*/sessions/.index.json | python3 -m json.tool | grep -A1 "project_path"
```

Or use Claude Code itself:

```
> /session-info

Session ID:     f47ac10b-58cc-4372-a567-0e02b2c3d479
Session name:   (unnamed)
Project:        /home/alice/projects/myapp
Project hash:   a3f8c2e1d4b7f9a0c5e3b1d2a4f6c8e0
Session file:   ~/.claude/projects/a3f8c2e1.../sessions/f47ac10b....json
Started:        2026-06-05 14:23:01
Turns:          8
Tokens used:    23,441
```

### Session File Format

The session JSON file is a structured record of the entire conversation. Its top-level structure:

```json
{
  "schema_version": "2.1",
  "session_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "session_name": "auth-refactor",
  "project_path": "/home/alice/projects/myapp",
  "project_hash": "a3f8c2e1d4b7f9a0c5e3b1d2a4f6c8e0",
  "model": "claude-sonnet-4-5",
  "created_at": "2026-06-05T14:23:01.000Z",
  "last_active_at": "2026-06-05T15:10:44.000Z",
  "turns": [ ... ],
  "cost": {
    "input_tokens": 42318,
    "input_tokens_cache_hit": 89441,
    "output_tokens": 8203,
    "cache_write_tokens": 3102,
    "estimated_usd": 0.187
  },
  "tool_calls": 47,
  "compactions": 1
}
```

Each entry in `turns` contains:

```json
{
  "turn_id": 3,
  "timestamp": "2026-06-05T14:31:22.000Z",
  "role": "user",
  "content": "Please refactor the auth module to use JWT",
  "tool_calls": [],
  "cost": { "input_tokens": 5213, "output_tokens": 892 }
}
```

Tool calls within a turn:

```json
{
  "tool": "Read",
  "input": { "file_path": "/home/alice/projects/myapp/src/auth/index.ts" },
  "output": { "content": "..." },
  "duration_ms": 12,
  "approved": true
}
```

**The session file is plaintext JSON.** It contains your complete conversation including any sensitive information you typed. See Section 9 (Session Security) for implications.

### Sessions Index

Each project directory maintains a `.index.json` file that Claude Code uses to quickly list available sessions:

```json
{
  "sessions": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "name": "auth-refactor",
      "created_at": "2026-06-05T14:23:01.000Z",
      "last_active_at": "2026-06-05T15:10:44.000Z",
      "turns": 23,
      "estimated_usd": 0.187
    },
    {
      "id": "8b4f03c2-1234-5678-9abc-def012345678",
      "name": null,
      "created_at": "2026-06-04T09:15:00.000Z",
      "last_active_at": "2026-06-04T11:42:00.000Z",
      "turns": 47,
      "estimated_usd": 0.341
    }
  ]
}
```

### Session TTL and Cleanup

Claude Code does not automatically delete session files. Sessions accumulate indefinitely. To manage disk usage:

```bash
# See how much disk space sessions are using:
du -sh ~/.claude/projects/

# List sessions by size:
ls -lhS ~/.claude/projects/*/sessions/*.json

# Delete sessions older than 90 days (adjust as needed):
find ~/.claude/projects/*/sessions/ -name "*.json" -mtime +90 -delete
```

There is no built-in `/sessions-cleanup` command in v2.1.126. Manual file deletion is the supported approach.

---

## 3. The `/resume` Command — Complete Reference

`/resume` is the primary mechanism for returning to a previous session. It restores the full conversation history, allowing you to continue exactly where you left off.

### Basic Syntax

```
/resume                      ← Open the session picker (lists all sessions for this project)
/resume <session-id>         ← Resume by full session UUID
/resume <session-name>       ← Resume by name (requires naming with /rename first)
/resume <partial-id>         ← Resume by unique prefix of session UUID
```

### The Session Picker

Running `/resume` with no arguments opens the interactive session picker:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         RESUME A SESSION                                  │
│                                                                           │
│  Project: /home/alice/projects/myapp                                      │
│                                                                           │
│  NAME                  LAST ACTIVE        TURNS   COST                   │
│  ─────────────────────────────────────────────────────                   │
│  ● auth-refactor       Today 15:10        23      $0.19                  │
│  ○ (unnamed)           Yesterday 11:42    47      $0.34                  │
│  ○ add-stripe-webhooks 3 days ago 16:20   15      $0.11                  │
│  ○ (unnamed)           1 week ago 09:00   8       $0.07                  │
│                                                                           │
│  ↑↓ to navigate · Enter to resume · Esc to cancel                        │
└──────────────────────────────────────────────────────────────────────────┘
```

Sessions are sorted by `last_active_at` descending (most recent first). Named sessions show their name; unnamed sessions show `(unnamed)`.

### What Gets Restored on Resume

| State element | Restored on resume | Notes |
|--------------|-------------------|-------|
| Conversation history | Yes — fully | All turns from prior session |
| Tool call results | Yes — in history | Visible to Claude as prior context |
| File system state | N/A | Files are on disk, not in session |
| CLAUDE.md content | Yes — re-read from disk | May differ from original session |
| MEMORY.md content | Yes — re-read from disk | May differ from original session |
| Model choice | No | Resets to current default model |
| Mode (Normal/Auto/Plan) | No | Resets to Normal |
| Session-local "always allow" | No | Approval decisions not persisted |
| MCP servers | Yes — re-initialized | From current settings.json |
| Session name | Yes | Name persists from /rename |

**Key nuance on file content:** When you resume a session, CLAUDE.md and MEMORY.md are re-read from disk. If you edited CLAUDE.md between sessions, the resumed session will see the updated instructions. This is intentional — it means your configuration evolves naturally even as sessions are resumed.

### Resume with `--session` Flag (Non-Interactive)

From the command line, use `--session` to resume a specific session without opening the interactive picker:

```bash
# Resume by session ID:
claude --session f47ac10b-58cc-4372-a567-0e02b2c3d479

# Resume by session name (exact match):
claude --session-name auth-refactor

# Resume with a prompt (continues the session with an initial message):
claude --session f47ac10b-58cc-4372-a567-0e02b2c3d479 "Continue where we left off"

# Resume in non-interactive (headless) mode:
echo "What was the last thing you did?" | claude --session f47ac10b-58cc-4372-a567-0e02b2c3d479
```

### What Happens to Context Window on Resume

When a session is resumed, Claude Code rebuilds the context window from the stored conversation history. This has cost implications:

```
Resume cost = (all historical turns) × (current input token rate)
            + (CLAUDE.md tokens) + (MEMORY.md tokens)
            + any new prompts
```

For long sessions that have been compacted, only the post-compaction history is restored (compaction is lossy — it cannot be reversed). For sessions that were not compacted, the full history is restored.

**The "resumption cost spike":** The first turn after resuming a very long session can be expensive because the entire prior conversation must be sent to the API as context. This is worth keeping in mind for cost-sensitive workflows. Using `/compact` before closing a session reduces resumption cost.

---

## 4. The `/rename` Command

The `/rename` command assigns a human-readable name to the current session, making it easy to find with `/resume`.

### Syntax

```
/rename <name>
/rename auth-refactor
/rename "add stripe webhooks"
/rename oauth-pkce-implementation
```

Names can contain letters, numbers, hyphens, and underscores. Spaces are allowed if the name is quoted. Names are not required to be globally unique — only the session UUID guarantees uniqueness — but using unique names avoids ambiguity in `/resume <name>`.

### When to Use `/rename`

**Best practice:** Rename sessions at the start, when you know what you are working on:

```
> /rename oauth-pkce-implementation
Session renamed to: oauth-pkce-implementation

> Now let's implement OAuth 2.0 with PKCE for the auth module...
```

You can also rename at any point during or after a session. The name is written to the session file and the sessions index immediately.

### Naming Conventions

Good session names are:
- **Descriptive:** Capture the primary goal or feature area
- **Dated when relevant:** `2026-06-05-database-migration` for time-sensitive tasks
- **Task-scoped:** One session, one primary goal
- **Consistent with branch names:** `feature/oauth-pkce` → `oauth-pkce`

Poor session names:
- `test`, `temp`, `misc` — too generic to be useful
- `session1`, `session2` — enumeration without meaning
- Very long names — truncated in the picker display

### Using Names in `/resume`

```bash
# By name (exact match, case-insensitive):
/resume oauth-pkce-implementation

# From CLI:
claude --session-name oauth-pkce-implementation

# If multiple sessions share a name, the most recent is used.
# For disambiguation, use the full UUID.
```

---

## 5. Multi-Session Patterns

### Pattern 1: Feature-per-Session

The simplest pattern: one named session per feature or ticket.

```bash
# Monday: start work on JIRA-1234
claude
> /rename jira-1234-auth-module
> Implement the authentication module as described in the spec...

# Tuesday: resume same feature
claude --session-name jira-1234-auth-module
> Continue implementing — today focus on the token refresh logic

# Wednesday: feature complete, start new session for code review
claude
> /rename jira-1234-review
> Please review all the changes in the auth module...
```

### Pattern 2: Session-per-Branch with Worktrees

Using git worktrees with Claude Code gives complete isolation per branch — separate working directory means separate project hash means separate sessions.

```bash
# Create worktrees:
git worktree add ../myapp-feature-auth feature/auth
git worktree add ../myapp-feature-billing feature/billing

# Each worktree gets its own Claude Code universe:
cd ../myapp-feature-auth
claude          # Sessions in ~/.claude/projects/<auth-hash>/
> /rename auth-implementation

cd ../myapp-feature-billing
claude          # Sessions in ~/.claude/projects/<billing-hash>/
> /rename billing-stripe-integration
```

Because each worktree has a different absolute path, their project hashes differ. Sessions, MEMORY.md, and prompt history are completely isolated. No context bleed between branches.

See the Worktrees Guide for the full worktree workflow.

### Pattern 3: Long-Running Sessions with Compaction

For extended tasks that span many turns, use `/compact` strategically to keep costs manageable while preserving continuity.

```
# Session day 1 (100 turns, context getting large):
> /compact Please summarize what we have built so far and what remains.

# Claude produces a compact summary injected as new context.
# Session continues from the summary point.

# Session day 2 (resume):
claude --session-name big-refactor
# Picks up from the post-compact state
```

### Pattern 4: Parallel Sessions for Research + Implementation

Some workflows benefit from two simultaneous sessions in separate terminals:

```
Terminal 1:                          Terminal 2:
──────────────────────────────       ──────────────────────────────
claude --session-name research       claude --session-name implement
> /plan                              > Normal mode
> Research the best approach         > Write the code based on the
  for implementing X...                plan from the research session
> (read-only analysis)               > (active file writing)
```

The sessions are independent. The implementation session can be given context from the research session by copy-pasting the plan, or by referring to a shared MEMORY.md.

### Pattern 5: Supervisor + Worker Sessions

In agentic workflows (see Agent Teams Guide), a supervisor session spawns sub-agent sessions. Each sub-agent gets its own session ID and runs concurrently.

```
Supervisor session (session-id: AABB...)
│
├── Sub-agent 1 (session-id: CC11...) → Works on module A
├── Sub-agent 2 (session-id: DD22...) → Works on module B
└── Sub-agent 3 (session-id: EE33...) → Works on tests
```

Sub-agent sessions are created automatically by the Task tool — you do not manually `/rename` or `/resume` them. They appear in the sessions index after completion.

---

## 6. Non-Interactive Session Management

### Command-Line Session Flags

Claude Code exposes session management through command-line flags for scripting and automation:

```bash
# Start a fresh named session non-interactively:
claude --session-name "ci-review-$(date +%Y%m%d)" "Review the diff in this PR..."

# Resume an existing session by ID:
claude --session f47ac10b-58cc-4372-a567-0e02b2c3d479 "Continue the analysis"

# Resume by name:
claude --session-name auth-refactor "What did we decide about token refresh?"

# Start fresh (ignore existing sessions for this project):
claude --no-session "Start a completely fresh analysis"
```

### Headless / Pipe Mode with Sessions

When Claude Code's stdin is a pipe (not a TTY), it runs in headless mode — no REPL, no spinner, output goes directly to stdout:

```bash
# Run a task using an existing session's context:
echo "List all the files we modified in the auth module" \
  | claude --session f47ac10b-58cc-4372-a567-0e02b2c3d479

# Capture output:
claude --session-name auth-refactor "Generate a change summary" \
  > change-summary.md

# In a CI script:
REVIEW=$(claude --session-name "$PR_SESSION_NAME" \
  "Review the changes from a security perspective and give a pass/fail verdict")
echo "$REVIEW"
```

In headless mode:
- The session is resumed and a single turn is executed
- The response is written to stdout
- The session file is updated with the new turn
- The process exits after the turn completes

### Using Sessions in CI/CD

A common CI pattern is to use a session to accumulate context across multiple pipeline stages:

```yaml
# .github/workflows/review.yml

jobs:
  analyze:
    steps:
      - name: Start analysis session
        run: |
          SESSION_NAME="pr-${{ github.event.pull_request.number }}"
          claude --session-name "$SESSION_NAME" \
            "Analyze the diff in this PR: $(git diff main...HEAD)"
          echo "SESSION_NAME=$SESSION_NAME" >> $GITHUB_ENV

      - name: Security check
        run: |
          claude --session-name "$SESSION_NAME" \
            "Focus on any security issues in the diff"

      - name: Generate review summary
        run: |
          claude --session-name "$SESSION_NAME" \
            "Summarize your findings as a concise PR review comment" \
            > review-comment.md

      - name: Post comment
        uses: actions/github-script@v7
        with:
          script: |
            const comment = require('fs').readFileSync('review-comment.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: comment
            });
```

**Considerations for CI sessions:**
- Session files accumulate across PR runs — clean up old sessions periodically
- The CI runner's home directory must be consistent for the project hash to match
- Session files may contain sensitive code — store them appropriately for your security posture

### Python SDK — StatefulClient

The Python SDK (`anthropic` package, Claude Code SDK) provides a `StatefulClient` that wraps session management:

```python
from claude_code_sdk import StatefulClient, ClaudeCodeOptions

# Create a new named session:
async with StatefulClient(
    options=ClaudeCodeOptions(
        session_name="my-analysis-session",
        cwd="/path/to/project"
    )
) as client:
    response1 = await client.send("Analyze the codebase structure")
    print(response1.text)

    response2 = await client.send("Now focus on the auth module")
    print(response2.text)

    # Session is automatically saved when the context manager exits

# Resume the same session later:
async with StatefulClient(
    options=ClaudeCodeOptions(
        session_name="my-analysis-session",
        resume=True,
        cwd="/path/to/project"
    )
) as client:
    response = await client.send("What did we discuss about the auth module?")
    print(response.text)
```

The `StatefulClient` handles:
- Session file creation and management
- Resuming by name or ID
- Context window management (triggering compaction when near limit)
- Cost tracking across turns

```python
# Access session metadata:
async with StatefulClient(...) as client:
    await client.send("Hello")
    
    print(client.session_id)       # UUID of current session
    print(client.session_name)     # Name (if set)
    print(client.turn_count)       # Number of turns so far
    print(client.cost_usd)         # Accumulated cost in USD
    print(client.context_used)     # Fraction of context window used (0.0-1.0)
```

### TypeScript SDK — StatefulClient

```typescript
import { StatefulClient, ClaudeCodeOptions } from '@anthropic-ai/claude-code-sdk';

// Create a new named session:
const client = new StatefulClient({
  sessionName: 'my-analysis-session',
  cwd: '/path/to/project',
});

await client.start();

const response1 = await client.send('Analyze the codebase structure');
console.log(response1.text);

const response2 = await client.send('Now focus on the auth module');
console.log(response2.text);

await client.close(); // Flushes session to disk

// Resume later:
const resumed = new StatefulClient({
  sessionName: 'my-analysis-session',
  resume: true,
  cwd: '/path/to/project',
});

await resumed.start();
const response3 = await resumed.send('What did we discuss about auth?');
console.log(response3.text);
await resumed.close();
```

For full SDK documentation, see the SDK Guide.

---

## 7. Session State Deep Dive

### What Survives Compaction vs What Doesn't

Compaction (triggered by `/compact` or automatically at ~85% context) is **lossy**. It cannot be reversed. Understanding what survives is critical for long sessions.

```
BEFORE COMPACTION:
┌──────────────────────────────────────────────────────┐
│  Turn 1: "Read the project structure"                 │
│  Turn 2: [Glob tool output — 847 files]              │
│  Turn 3: "Focus on the auth module"                   │
│  Turn 4: [Read 12 files, output 40,000 tokens]       │
│  Turn 5: "Refactor index.ts to use JWT"               │
│  Turn 6: [Write tool — modified index.ts]             │
│  Turn 7: "Now update the middleware"                  │
│  Turn 8: [Edit tool — modified middleware.ts]         │
│  ...                                                  │
│  Turn 47: "What's left to do?"                        │
└──────────────────────────────────────────────────────┘

AFTER /compact (with no focus argument):
┌──────────────────────────────────────────────────────┐
│  [Compaction summary — Claude-generated ~2000 tokens] │
│  "In this session we have: analyzed the auth module, │
│   refactored index.ts to use JWT tokens, updated the │
│   middleware to validate tokens, identified 3 files  │
│   still needing updates: types.ts, tests/auth.test,  │
│   config/auth.json..."                               │
└──────────────────────────────────────────────────────┘
```

| State element | Survives compaction |
|--------------|---------------------|
| CLAUDE.md instructions | Yes — re-read from disk |
| MEMORY.md content | Yes — re-read from disk |
| Actual file changes made | Yes — they are on disk |
| Specific file content discussed | No — not in summary |
| Detailed tool outputs | No — summarized |
| Exact error messages seen | Usually No — may be summarized |
| Turn-by-turn decision rationale | No — replaced by summary |
| Session ID and name | Yes |
| Cost history | Yes |

**The MEMORY.md pattern:** Because MEMORY.md survives compaction (it is re-read from disk), you can use it as a persistence layer for information that must survive compaction:

```
> Before we compact, please save the following to MEMORY.md:
> 1. The list of files we still need to update
> 2. The decision we made about using RS256 for JWT signing
> 3. The API contract we agreed to for the token refresh endpoint
```

After compaction, MEMORY.md is re-loaded and this information is back in context.

### MEMORY.md as the Durable State Layer

MEMORY.md lives at:

```
~/.claude/projects/<project-hash>/memory/MEMORY.md
```

It is:
- **Per-project, not per-session** — shared across all sessions for the same project
- **Machine-local** — not committed to git, not shared with teammates
- **Auto-managed by Claude** — Claude reads and writes it when you ask, or when `/memory` is used
- **Re-loaded at every session start and after every compaction**
- **Capped at 200 lines / 25KB** at load time (truncated if over)

The cap prevents MEMORY.md from growing indefinitely and consuming too many tokens on every turn. When the cap is reached, you should archive older entries or restructure.

### The `/memory` Command

```
/memory              ← Show current MEMORY.md contents
/memory clear        ← Clear all MEMORY.md content (cannot be undone)
/memory edit         ← Open MEMORY.md in $EDITOR
```

```
> /memory

MEMORY.md — ~/.claude/projects/a3f8c2e1.../memory/MEMORY.md
─────────────────────────────────────────────────────────────
Lines: 47 / 200 limit
Size:  2.1 KB / 25 KB limit

Content:
─────────────────────────────────────────────────────────────
## Auth Module Refactor (started 2026-06-03)

### Completed
- index.ts: Converted from session-based to JWT auth
- middleware.ts: Added JWT validation middleware
- types.ts: Added JWTPayload type

### Still needed
- tests/auth.test.ts: Tests need updating for JWT
- config/auth.json: Add RS256 public key config
- README.md: Document new auth flow

### Key decisions
- Using RS256 (asymmetric) not HS256 (symmetric) — allows microservices to verify tokens without shared secret
- Token expiry: 15 min access, 7 day refresh
- Refresh token rotation enabled (each refresh issues a new refresh token)
```

### TODO.md Pattern for Task Continuity

For multi-session tasks, maintaining a `TODO.md` at the project root provides persistence that is independent of MEMORY.md:

```markdown
<!-- TODO.md — tracked in git, visible to all team members -->

## Auth Refactor — JIRA-1234

### Done
- [x] index.ts: JWT auth implementation
- [x] middleware.ts: Token validation

### In Progress
- [ ] tests/auth.test.ts — update for JWT

### Pending
- [ ] config/auth.json — RS256 key config
- [ ] README.md — document auth flow
```

When you start a new session on this project, you can load the TODO:

```
> Read TODO.md and tell me what's still left on the auth refactor
```

Because TODO.md is in the project and tracked by git, it is visible to Claude on every session without needing MEMORY.md.

---

## 8. Cost Tracking per Session

### The `/cost` Command

`/cost` shows the full token and cost accounting for the current session:

```
> /cost

Session Cost — auth-refactor
─────────────────────────────────────────────────────
Model:                 claude-sonnet-4-5

Token Usage
  Input (non-cached):  42,318     × $0.003/1K  = $0.1270
  Input (cache hit):   89,441     × $0.0003/1K = $0.0268
  Output:               8,203     × $0.015/1K  = $0.1230
  Cache writes:         3,102     × $0.00375/1K= $0.0116
  ──────────────────────────────────────────────────
  Total tokens:        143,064
  Session total:                              $0.2884

  Without cache:       ≈$0.3936
  Cache savings:       ≈$0.1052 (27% saved)

Session
  Duration:            47 minutes
  Turns:               23
  Tool calls:          47
  Compactions:         1
  Avg cost per turn:   $0.0125
```

The `/cost` output is identical to the Ctrl+S stats screenshot — the difference is that `/cost` prints to the REPL while `Ctrl+S` copies to clipboard.

### `/usage` vs `/cost`

Both commands show token and cost data. The distinction:

| Command | Shows | Use when |
|---------|-------|----------|
| `/usage` | Same as `/cost` | Checking session spend |
| `/cost` | Same as `/usage` | Checking session spend |

In v2.1.126, `/usage` and `/cost` are aliases. Earlier versions had different output formats.

### `CLAUDE_COST_THRESHOLD` Environment Variable

You can set a maximum USD cost threshold for a session. When exceeded, Claude Code displays a prominent warning and asks for confirmation before each new turn:

```bash
export CLAUDE_COST_THRESHOLD=1.00    # Warn after $1.00 of spend
claude
```

When the threshold is crossed:

```
⚠ Session cost has exceeded $1.00 (current: $1.04)
  Model: claude-sonnet-4-5
  Continue? [y/N]
```

Pressing `y` continues. Pressing `n` or `Enter` exits the session (session is still saved).

Setting the threshold to 0 disables cost warnings:

```bash
export CLAUDE_COST_THRESHOLD=0       # No warnings
```

The threshold can also be set in `~/.claude/settings.json`:

```json
{
  "costThresholdUSD": 2.00
}
```

### Session Cost Breakdown in the Dashboard

If you have an Anthropic Console account with API key authentication, session costs appear in the Console usage dashboard under the `claude-code` project tag. The session ID is included as metadata, allowing per-session cost attribution.

To enable Console tracking:

```bash
# Authenticate with Console API key (not claude.ai account):
claude auth login --api-key sk-ant-api03-...
```

Sessions using Claude Code with a personal claude.ai subscription do not appear in the Console dashboard — they are billed directly to the subscription and do not have per-session breakdown.

### Cost Optimization Per Session

| Technique | Typical savings |
|-----------|----------------|
| Run `/compact` before closing a session you plan to resume | 60-80% reduction in resumption cost |
| Keep CLAUDE.md concise (each KB costs on every turn) | Variable |
| Use `--permission-mode plan` for read-heavy analysis | No write tools = faster, cheaper |
| Break very long sessions with `/clear` when switching tasks | Prevents context accumulation |
| Enable prompt caching (automatic, no action needed) | 10-27% typical savings |

---

## 9. Session Security

### Session Files Contain Plaintext Conversation History

Session JSON files at `~/.claude/projects/*/sessions/*.json` contain:
- Every prompt you typed (including anything sensitive you mentioned)
- Every file Claude read (full content in tool results)
- Every bash command output
- All Claude responses

This data is stored **unencrypted on disk**. The security of your session data is the security of your `~/.claude/` directory.

**Risk scenarios:**
- Another user on the same machine (shared workstations)
- Malware with filesystem access
- Unencrypted backup systems
- Laptop theft

**Mitigations:**

```bash
# Ensure ~/.claude/ is not world-readable:
chmod 700 ~/.claude/
chmod -R go-rwx ~/.claude/projects/

# Exclude from backup tools that sync to cloud:
# Time Machine: Add ~/.claude/projects/ to exclusions
# Dropbox/iCloud Drive: Don't put home directory in Dropbox

# For shared workstations, use a separate user account per developer.
```

### Where to Store Sensitive Sessions

If you work with sensitive data (PII, credentials, proprietary algorithms), consider:

1. **Separate project directories per sensitivity level:** Sessions are scoped to project hash. Keep sensitive projects in a different directory, encrypted at rest.

2. **Full disk encryption:** macOS FileVault, Linux LUKS, or Windows BitLocker protects session data at rest against physical theft.

3. **Session cleanup after sensitive work:**
   ```bash
   # Delete sessions for a specific project after completing sensitive work:
   rm -rf ~/.claude/projects/<hash>/sessions/
   ```

4. **Environment variable masking:** Claude Code attempts to detect and redact API keys and common secret patterns in session files, but this is best-effort, not a security guarantee.

### Enterprise Session Log Forwarding

In enterprise deployments, IT administrators can configure Claude Code to forward session logs to a centralized SIEM or audit logging system:

```json
// ~/.claude/settings.json (or enterprise-managed CLAUDE.md)
{
  "auditLog": {
    "enabled": true,
    "endpoint": "https://logging.internal.example.com/claude-code",
    "includeContent": false,    // Set true to include full conversation content
    "includeToolCalls": true,
    "authToken": "${CLAUDE_AUDIT_TOKEN}"
  }
}
```

When `includeContent` is false (recommended for most enterprise deployments), the audit log records:
- Session start/end timestamps and IDs
- Tool calls (tool name, file paths accessed, bash commands run)
- Turn counts and token usage
- Model used and cost

It does NOT record conversation text, file contents, or bash output. This provides auditability without exposing developer conversation data.

### Remote Control Session Tokens (Distinct from Session State)

Claude Code's Remote Control feature (see Remote Control Guide) uses **session tokens** that are distinct from session state:

| Term | What it is |
|------|-----------|
| Session state (this document) | Conversation history file in `~/.claude/projects/` |
| Remote Control session token | Short-lived token allowing external process to send prompts to Claude Code |

Remote Control tokens:
- Are ephemeral — they expire when the REPL exits
- Do not give access to session file contents
- Authorize sending prompts to the REPL, not reading history
- Are stored temporarily in `~/.claude/.rc-token` with 600 permissions

Do not confuse "resume a session" with "connect to a running session." `/resume` restores historical context from a file. Remote Control connects a client to an already-running REPL process.

---

## 10. Session Troubleshooting

### Session Not Found on Resume

**Symptom:** `/resume` shows an empty list, or `--session-name` fails with "session not found."

**Cause 1: Wrong working directory.** Sessions are scoped by project hash (derived from absolute CWD). If you launch Claude Code from a different directory than the session was created in, you will see a different project's sessions.

```bash
# Check: what directory are you in?
pwd

# Sessions for the current directory:
ls ~/.claude/projects/$(python3 -c "
import hashlib, os
h = hashlib.sha256(os.getcwd().encode()).hexdigest()[:32]
print(h)
")/sessions/
```

**Cause 2: Project directory was moved or renamed.** Moving `/home/alice/projects/myapp` to `/home/alice/projects/myapp-v2` changes the project hash. Sessions from the original path will not be visible when running from the new path.

**Resolution:** Either:
- Run Claude Code from the original path
- Manually move the sessions:
  ```bash
  OLD_HASH="a3f8c2e1d4b7f9a0c5e3b1d2a4f6c8e0"  # hash of old path
  NEW_HASH="b1d2e3f4..."                           # hash of new path
  mkdir -p ~/.claude/projects/$NEW_HASH/sessions/
  cp ~/.claude/projects/$OLD_HASH/sessions/*.json \
     ~/.claude/projects/$NEW_HASH/sessions/
  # Rebuild the index:
  claude --rebuild-session-index
  ```

**Cause 3: Session file was deleted or moved.** The `.index.json` references session files by ID. If the file was deleted, the index still lists it but the resume will fail.

### Session Corruption Recovery

**Symptom:** Resuming a session causes Claude Code to crash or display an error.

**Diagnosis:**

```bash
# Validate the session file is valid JSON:
python3 -m json.tool ~/.claude/projects/<hash>/sessions/<id>.json > /dev/null
echo "Exit code: $?"    # 0 = valid, non-zero = corrupted

# Check file size:
ls -lh ~/.claude/projects/<hash>/sessions/<id>.json
# A 0-byte or very small file is likely corrupted
```

**Recovery options:**

1. **Skip the corrupted session:** Start a new session and summarize what was being worked on

2. **Partial recovery:** If the file is valid JSON but truncated, the turns array may still have recoverable data:
   ```bash
   python3 -c "
   import json
   with open('session.json') as f:
       data = json.load(f)
   for turn in data['turns']:
       if turn.get('role') == 'user':
           print(f'Turn {turn[\"turn_id\"]}: {turn[\"content\"][:100]}')
   "
   ```

3. **Delete and restart:** Remove the corrupted session file, update `.index.json` to remove the reference, and start fresh.

### Clearing Stuck Sessions

**Symptom:** Claude Code hangs on startup for a specific project, apparently stuck loading a previous session.

**Diagnosis and fix:**

```bash
# Find the project hash for current directory:
PROJECT_HASH=$(python3 -c "
import hashlib, os
print(hashlib.sha256(os.getcwd().encode()).hexdigest()[:32])
")

# Check for lock files (stuck sessions leave locks):
ls ~/.claude/projects/$PROJECT_HASH/*.lock 2>/dev/null

# Remove lock files:
rm -f ~/.claude/projects/$PROJECT_HASH/*.lock

# If the index is corrupted, rebuild it:
claude --rebuild-session-index
```

### Session Resumes But Context Is Wrong

**Symptom:** After `/resume`, Claude seems to have the wrong understanding of the project state.

**Likely causes:**
1. The project files changed significantly since the session was last active
2. The session was compacted and the summary is incomplete
3. CLAUDE.md was updated since the session and the new instructions conflict with the session history

**Resolution:** Start the resumed session by giving Claude explicit context:

```
> [Resume session]
> Before we continue: the project has changed since we last spoke.
> Please re-read CLAUDE.md and the following files to get current context:
> @src/auth/index.ts @src/auth/types.ts
> Then summarize your understanding of where we are.
```

### Sessions Using Too Much Disk Space

**Diagnosis:**

```bash
# Total size of all session data:
du -sh ~/.claude/

# Breakdown by project:
du -sh ~/.claude/projects/*/

# Largest session files:
find ~/.claude/projects/*/sessions/ -name "*.json" \
  -exec ls -lh {} \; | sort -k5 -hr | head -20
```

**Cleanup:**

```bash
# Remove all sessions older than 60 days:
find ~/.claude/projects/*/sessions/ -name "*.json" -mtime +60 -delete

# Remove sessions for a specific project entirely:
rm -rf ~/.claude/projects/<hash>/sessions/

# Compact existing sessions to reduce size (cannot be done post-hoc):
# Compaction must be done during an active session via /compact
```

---

## 11. Session Management Architecture Summary

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                    SESSION MANAGEMENT ARCHITECTURE                         ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                           ║
║  CREATION                                                                 ║
║  claude (new session)  →  UUID generated  →  session.json created         ║
║  claude --session-name →  Named session   →  session.json + name index    ║
║                                                                           ║
║  IDENTITY                                                                 ║
║  Session ID: UUID v4 (unique, immutable)                                  ║
║  Session name: Human label (mutable via /rename)                          ║
║  Project hash: SHA-256 of CWD[:32] (ties session to directory)            ║
║                                                                           ║
║  STORAGE                                                                  ║
║  ~/.claude/projects/<hash>/sessions/<uuid>.json    ← Session file         ║
║  ~/.claude/projects/<hash>/sessions/.index.json    ← Quick lookup index   ║
║  ~/.claude/projects/<hash>/memory/MEMORY.md        ← Durable memory       ║
║  ~/.claude/projects/<hash>/history                 ← Prompt history        ║
║                                                                           ║
║  RESUMPTION                                                               ║
║  /resume             → Interactive picker → Full history restored          ║
║  /resume <name>      → By name           → Full history restored          ║
║  --session <id>      → By UUID           → CLI or SDK                     ║
║  --session-name <n>  → By name           → CLI or SDK                     ║
║                                                                           ║
║  STATE LAYERS (what survives)                                             ║
║  ┌──────────────────────────────────────────────────────────────────┐    ║
║  │ Disk state (files, git)  — Always survives                        │    ║
║  │ CLAUDE.md                — Re-read on resume/compact             │    ║
║  │ MEMORY.md                — Re-read on resume/compact             │    ║
║  │ Session history          — Restored on resume (not on /clear)    │    ║
║  │ Context window           — Rebuilt on resume from history        │    ║
║  │ Model/mode choice        — NOT persisted (resets each session)   │    ║
║  │ "Always allow" decisions — NOT persisted (resets each session)   │    ║
║  └──────────────────────────────────────────────────────────────────┘    ║
║                                                                           ║
║  COST TRACKING                                                            ║
║  /cost or /usage     → Current session cost breakdown                     ║
║  CLAUDE_COST_THRESHOLD → Warn when exceeded                               ║
║  Ctrl+S              → Copy stats to clipboard                            ║
║                                                                           ║
║  SECURITY                                                                 ║
║  Session files: plaintext JSON, chmod 600 recommended                     ║
║  Location: ~/.claude/projects/ (not committed to git)                     ║
║  Enterprise: audit log forwarding via settings.json                       ║
║                                                                           ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

---

## 12. Quick-Reference Command Summary

| Command | What it does |
|---------|-------------|
| `/resume` | Open session picker for current project |
| `/resume <name>` | Resume named session |
| `/resume <uuid>` | Resume session by ID |
| `/rename <name>` | Name or rename current session |
| `/cost` | Show current session cost breakdown |
| `/usage` | Alias for `/cost` |
| `/compact` | Summarize and compress conversation history |
| `/compact <focus>` | Compact with focus instruction |
| `/memory` | Show MEMORY.md contents |
| `/memory clear` | Clear MEMORY.md |
| `/memory edit` | Edit MEMORY.md in $EDITOR |
| `/session-info` | Show current session ID, name, path |
| `Ctrl+D` | Exit and save session |
| `/exit` | Exit and save session |

| CLI Flag | What it does |
|----------|-------------|
| `--session <uuid>` | Resume session by ID |
| `--session-name <name>` | Resume (or start) session by name |
| `--no-session` | Force start fresh, ignore existing sessions |
| `--rebuild-session-index` | Rebuild `.index.json` from session files |

| Environment Variable | What it does |
|---------------------|-------------|
| `CLAUDE_COST_THRESHOLD` | USD amount before cost warning |
| `CLAUDE_SESSION_DIR` | Override default session storage directory |
