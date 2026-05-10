---
title: Agent Teams & Subagents — Complete Guide
description: >
  Complete reference for Claude Code subagents and Agent Teams — architecture,
  Task tool vs Agent Teams, YAML frontmatter, team protocols, filesystem mailbox,
  practical orchestration patterns, and known limitations. Research Preview
  through v2.1.126 (May 2026).
sidebar:
  order: 7
  label: Agent Teams
lastUpdated: 2026-05-09
---

# Agent Teams & Subagents — Complete Guide

> **Version:** v2.1.126 (May 6, 2026) · Agent Teams: Research Preview (enable via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)

Claude Code supports two levels of multi-agent operation:

| Feature | Subagents (Task tool) | Agent Teams |
|---------|----------------------|-------------|
| Model | GA · v1.0+ | Research Preview · v2.1.32+ |
| Communication | One-way (fire-and-forget) | Bidirectional (peer-to-peer) |
| Persistence | Ephemeral per invocation | Persistent mailbox |
| Parallelism | Yes — multiple Task calls | Yes — dedicated worker agents |
| Use case | Isolated subtasks | Complex coordinated workflows |

---

## 1. Subagents — Task Tool

The `Task` tool spawns a subagent: an independent Claude instance that executes a specific prompt in its own context window with its own tool access.

### 1.1 When to Use Subagents

- **Parallelism**: run multiple independent analyses simultaneously
- **Context isolation**: keep a large codebase analysis in its own window
- **Specialisation**: route different task types to agents with different configs
- **Long-running subtasks**: free the main agent to continue while a subtask runs

### 1.2 Spawning a Subagent

Claude Code will use the `Task` tool automatically when it determines a task benefits from isolation. You can also prompt it explicitly:

```
> Analyse src/api/, src/domain/, and src/infra/ in parallel and summarise each module's responsibilities
```

Claude will spawn three simultaneous Task agents, one per directory.

### 1.3 Subagent Definitions — `.claude/agents/<name>.md`

You can define custom subagents with specific instructions, tools, and models:

```
.claude/
└── agents/
    ├── code-reviewer.md    ← project-scoped
    └── test-writer.md

~/.claude/
└── agents/
    └── my-analyst.md       ← user-scoped (all projects)
```

#### Subagent frontmatter schema

```yaml
---
name: code-reviewer          # Required: agent name (used in /agents list)
description: >               # Required: Claude uses this to decide when to auto-invoke
  Reviews code changes for security vulnerabilities, code smells, and
  SOLID principle violations. Auto-invoked after significant edits.
model: claude-opus-4-7       # Optional: override session model
effort: high                 # Optional: normal | high | xhigh
tools:                       # Optional: restrict available tools
  - Read
  - Glob
  - Grep
  - WebFetch
context: fork                # Optional: fork | inherit (default: fork)
max-turns: 30               # Optional: limit agent turns
---

# Code Reviewer Agent

You are a senior software engineer specialising in code quality and security.

## Your Review Checklist
1. **Security**: Check for SQL injection, XSS, command injection, hardcoded secrets, SSRF
2. **Performance**: N+1 queries, missing indexes, unnecessary allocations
3. **SOLID**: Single Responsibility, Open/Closed, dependency inversion
4. **Error handling**: All exceptions caught, resources closed, errors logged
5. **Tests**: Coverage of happy path, error cases, edge cases

## Output Format
Return a structured review with:
- Summary (1 paragraph)
- Issues found (severity: critical/major/minor)
- Suggested fixes (code snippets where helpful)
- Overall verdict: approve / request-changes / needs-discussion
```

### 1.4 Subagent Memory — `agent-memory/<name>/MEMORY.md`

Each subagent can have persistent memory that survives across invocations:

```
.claude/agent-memory/code-reviewer/MEMORY.md   ← project scope
~/.claude/agent-memory/code-reviewer/MEMORY.md ← user scope
.claude/agent-memory/local/code-reviewer/MEMORY.md ← local (gitignored)
```

The first **200 lines** or **25 KB** (whichever comes first) of the agent's MEMORY.md is automatically injected at the start of every invocation.

```markdown
<!-- .claude/agent-memory/code-reviewer/MEMORY.md -->

## Project Security Decisions
- We intentionally use eval() in sandbox/executor.py — reviewed and approved
- PostgreSQL connection is not parameterised in legacy/reporting.py — tech debt ticket #4521

## Patterns to Flag
- Any use of string formatting in SQL queries
- Direct os.system() calls
- Missing @require_auth decorator on API endpoints

## Recently Approved Changes
- JWT refresh logic in src/auth/tokens.py — reviewed 2026-04-28
```

---

## 2. Agent Teams — Persistent Peer-to-Peer

Agent Teams are a **Research Preview** feature that enables persistent, bidirectional communication between specialised agents running in separate terminal sessions.

### 2.1 Enable Agent Teams

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

Or in `.claude/settings.json`:

```json
{
  "experimental": {
    "agentTeams": true
  }
}
```

### 2.2 Architecture

```
┌────────────────────────────────────────────────────────┐
│                  Filesystem Mailbox                     │
│         ~/.claude/teams/{team-name}/inboxes/           │
│                                                        │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────┐  │
│  │ orchestrator  │   │  agent-a     │   │ agent-b  │  │
│  │ (your session)│   │  (terminal 2)│   │(terminal3│  │
│  └──────┬────────┘   └──────┬───────┘   └────┬─────┘  │
│         │  sends messages   │               │         │
│         │ ─────────────────▶│               │         │
│         │ ◀─────────────────│               │         │
│         │ ─────────────────────────────────▶         │
└─────────┼───────────────────────────────────────────┘
```

Each agent has its own inbox directory. Messages are written as atomic JSON files (tempfile + `os.replace` for consistency).

### 2.3 Team Tools

| Tool | Purpose |
|------|--------|
| `TeamCreate` | Create a team and register members |
| `TaskCreate` | Create a task and assign it to a team member |
| `TaskUpdate` | Update task status or add results |
| `TaskList` | List tasks and their states |
| `SendMessage` | Send a message to a specific agent |
| `TeamDelete` | Dissolve the team and clean up mailboxes |

### 2.4 Message Types

```typescript
type MessageType =
  | 'message'                   // Direct message with text content
  | 'broadcast'                 // Message to all team members
  | 'shutdown_request'          // Ask an agent to shut down gracefully
  | 'shutdown_response'         // Agent confirms shutdown
  | 'plan_approval_response'    // Agent responds to a plan approval request
  | 'task_update'               // Task state change notification
```

### 2.5 Task States

```
pending → in_progress → completed
                      ⇘ failed
```

### 2.6 Filesystem Layout

```
~/.claude/
└── teams/
    └── {team-name}/
        ├── manifest.json          ← Team metadata, member list
        ├── tasks/
        │   ├── task-001.json      ← Task definitions
        │   └── task-002.json
        └── inboxes/
            ├── orchestrator/      ← Orchestrator's inbox
            │   └── msg-*.json
            ├── agent-a/          ← Agent A's inbox
            │   └── msg-*.json
            └── agent-b/          ← Agent B's inbox
                └── msg-*.json
```

---

## 3. Practical Multi-Agent Patterns

### Pattern 1: Parallel Code Analysis

Use multiple Task calls for independent analyses that can run simultaneously:

```
> Analyse the following areas in parallel and report findings:
  1. Security vulnerabilities in src/api/
  2. Performance bottlenecks in src/database/
  3. Test coverage gaps in tests/
  Combine the results into a single engineering report.
```

Claude spawns three simultaneous agents and merges results.

### Pattern 2: Orchestrator → Specialists

```
> I want to refactor the authentication module. 
  Use a code reviewer agent to audit the current code first,
  then a test-writer agent to add tests for the new implementation,
  then perform the refactor.
```

The orchestrator sequences specialist agents, passing results between them.

### Pattern 3: Agent Teams — Feature Development Pipeline

Launch multiple terminal sessions, each running `claude`:

**Terminal 1 (Orchestrator):**
```
> Create a team called "feature-team" with members: architect, engineer, reviewer.
  Team task: implement user notification system.
  Assign architecture design to architect, implementation to engineer, review to reviewer.
```

**Terminal 2 (Architect):**
```bash
claude --agent-team feature-team --agent-name architect
```

**Terminal 3 (Engineer):**
```bash
claude --agent-team feature-team --agent-name engineer
```

**Terminal 4 (Reviewer):**
```bash
claude --agent-team feature-team --agent-name reviewer
```

The orchestrator sends tasks via `TaskCreate`, agents pick them up from their inboxes, and report completion via `TaskUpdate`. The orchestrator aggregates results.

### Pattern 4: CI/CD Agent Team

```yaml
# .github/workflows/ai-review.yml
jobs:
  claude-review:
    steps:
      - name: Security audit agent
        run: |
          claude --print "Perform a security audit of all changed files" \
                 --permission-mode bypassPermissions \
                 --agent code-reviewer \
                 --max-turns 20 \
                 --output-format json > security-report.json

      - name: Test generation agent
        run: |
          claude --print "Write unit tests for all changed functions" \
                 --permission-mode bypassPermissions \
                 --agent test-writer \
                 --max-turns 30
```

### Pattern 5: Subagent with Custom Tool Restrictions

```yaml
---
name: readonly-analyst
description: Analyses code and data without making any changes. Never writes files.
tools:
  - Read
  - Glob
  - Grep
  - WebFetch
  - TodoRead
model: claude-sonnet-4-6
effort: high
max-turns: 50
---

You are a read-only analyst. You can read any file in the project but must NEVER
write, edit, or delete any file. Your output is analysis and recommendations only.
```

Restricting tools to `Read`, `Glob`, `Grep` makes this agent safe to run with `--permission-mode bypassPermissions` without risk of unintended changes.

---

## 4. Orchestration Best Practices

### 4.1 Context passing between agents

Use `TodoWrite` as a shared state mechanism:

```
> Write a comprehensive analysis of src/ to TodoWrite with items for each module.
  Then delegate implementation tasks to specialist agents based on those items.
```

Claude's TodoWrite is visible in `/todos` and persists within the session.

### 4.2 Agent result aggregation

```
> Run the following tasks in parallel:
  - Code quality score for each module in src/ (use the code-reviewer agent)
  - Test coverage percentage per module
  - Dependency vulnerability scan (npm audit / pip audit)
  
  Then produce a consolidated engineering health dashboard report.
```

### 4.3 Limiting agent resource consumption

```yaml
---
name: budget-conscious-agent
max-turns: 15              # Hard stop at 15 turns
model: claude-haiku-4-5   # Use cheapest model
effort: low
---
```

For bulk processing tasks, use Haiku with `effort: low` to minimise cost.

### 4.4 Error handling in multi-agent flows

```
> If any agent in the parallel analysis fails, note the failure in the report
  and continue with the remaining agents. Do not block on individual failures.
```

Claude handles agent failures gracefully when instructed to do so.

---

## 5. Subagent vs Agent Teams Decision Guide

```
Need to run tasks in parallel?
    └─ YES → Use Task tool (multiple Task calls in one session)
    └─ NO
         ↓
Need persistent state across invocations?
    └─ YES → Agent Team (Research Preview)
    └─ NO → Task tool

Need bidirectional communication between agents?
    └─ YES → Agent Team (Research Preview)
    └─ NO → Task tool

Is this a CI/CD pipeline?
    └─ YES → Task tool (--agent flag + --permission-mode bypassPermissions)
    └─ NO → depends on above

Is the research preview stability acceptable for production?
    └─ NO → Task tool
    └─ YES → Agent Team (more powerful but experimental)
```

---

## 6. Agent Team Limitations (Research Preview)

These are known limitations as of v2.1.126:

| Limitation | Detail |
|-----------|--------|
| No session resumption for team members | Session resume restores the orchestrator but NOT teammate agents — they must be restarted |
| No nested teams | Teams cannot contain other teams |
| No cross-machine teams | All agents must run on the same machine (shared filesystem) |
| Manual agent startup | Team members must be manually started in separate terminals |
| No built-in load balancing | Orchestrator must manually distribute tasks |
| Mailbox cleanup | `TeamDelete` must be called to remove team files |
| Max 10 members | Practical limit (not hard-coded but performance degrades) |

---

## 7. YAML Frontmatter Reference — Agent Definitions

```yaml
---
name: my-agent               # Required. Identifier in /agents list.
description: |               # Required. Used by Claude to decide auto-invocation.
  Detailed description of what this agent does, when to invoke it,
  and what it specialises in. More detail = better auto-invocation.

# --- Model configuration ---
model: claude-opus-4-7       # Default: inherits session model
effort: normal               # normal | high | xhigh. Default: inherits session effort.

# --- Tool access ---
tools:                       # Omit to allow all tools. List to restrict.
  - Read
  - Write
  - Edit
  - MultiEdit
  - Bash
  - Glob
  - Grep
  - WebFetch
  - WebSearch
  - TodoWrite
  - TodoRead
  - Task
  - Monitor

# --- Context mode ---
context: fork                # fork (own context window) | inherit (shares parent's)

# --- Resource limits ---
max-turns: 50                # Max agent turns (1–100). Default: 50.

# --- Memory ---
memory: true                 # Enable persistent agent memory. Default: false.
memory-scope: project        # user | project | local. Default: project.
---

# Agent Instructions

Write the agent's system instructions here in markdown.
This is treated with the same priority as CLAUDE.md.
```

---

## 8. Viewing and Managing Agents

```
/agents                       # List all available agents
/agents create                # Create a new agent interactively
/agents edit my-agent         # Edit agent definition
/agents delete my-agent       # Remove agent
```

---

## Related Guides

- [CLI Technical Reference](./claude-code-reference) — Section 10: Subagents & Agent Teams
- [Hooks System](./hooks-deep-dive) — SubagentStop and TaskCreated hooks
- [MCP Servers Guide](./mcp-servers-guide) — tools available to agents
- [CI/CD Integration](./cicd-integration) — agents in pipelines
