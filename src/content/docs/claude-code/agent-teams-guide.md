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
lastUpdated: 2026-06-07
---

# Agent Teams & Subagents — Complete Guide

> **Version:** v2.1.126 (May 19, 2026) · Agent Teams: Research Preview (enable via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)

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

### 2.2 Architecture — Filesystem Mailbox Flow

#### Exact Directory Structure

When `TeamCreate("my-team")` is called, Claude Code creates the following hierarchy under `~/.claude/teams/`:

```
~/.claude/teams/my-team/
├── manifest.json              ← written atomically at TeamCreate time
│                                 { "name": "my-team",
│                                   "members": ["orchestrator","engineer","reviewer"],
│                                   "created_at": "2026-06-07T10:00:00Z",
│                                   "version": 1 }
│
├── tasks/
│   ├── task-001.json          ← one file per task; updated in-place with flock
│   └── task-002.json
│
└── inboxes/
    ├── orchestrator/          ← one directory per registered member
    │   └── msg-{ts}-{hash}.json   ← atomic: written to tmp, then os.replace()
    ├── engineer/
    │   └── msg-{ts}-{hash}.json
    └── reviewer/
        └── msg-{ts}-{hash}.json
```

**Message filename format:** `msg-{unix_timestamp_ns}-{8char_random_hex}.json`

Example: `msg-1749290400123456789-a3f7b291.json`

The nanosecond timestamp ensures lexicographic sort order equals arrival order within the same millisecond; the random hex suffix prevents collisions when two senders write simultaneously.

**Task file format** (full schema):

```json
{
  "id": "task-001",
  "title": "Implement auth module",
  "description": "Add JWT-based authentication to the API layer...",
  "assignee": "engineer",
  "created_by": "orchestrator",
  "created_at": "2026-06-07T10:01:00Z",
  "status": "pending",
  "result": null,
  "error": null,
  "updated_at": "2026-06-07T10:01:00Z",
  "seq": 1
}
```

After a worker claims the task (`TaskUpdate(status: "in_progress")`):

```json
{
  "id": "task-001",
  ...
  "status": "in_progress",
  "claimed_by": "engineer",
  "claimed_at": "2026-06-07T10:02:15Z",
  "updated_at": "2026-06-07T10:02:15Z",
  "seq": 2
}
```

**Message file format** (full schema):

```json
{
  "id": "msg-1749290400123456789-a3f7b291",
  "from": "engineer",
  "to": "orchestrator",
  "type": "task_update",
  "content": "Task complete: auth module implemented. All tests pass.",
  "metadata": {
    "task_id": "task-001",
    "timestamp": "2026-06-07T10:15:00Z"
  },
  "seq": 3,
  "read": false
}
```

The `seq` counter is per-team and increments with each write. It provides a partial ordering guarantee: messages with lower `seq` were written before messages with higher `seq` **from the same agent**. Across multiple agents writing concurrently, `seq` ordering is not guaranteed — use `metadata.timestamp` for cross-agent ordering if needed.

**Atomic write protocol** (how `SendMessage` avoids corruption):

```
1. Generate temp filename: ~/.claude/teams/my-team/inboxes/engineer/.tmp-{uuid}
2. Write full JSON content to temp file
3. fsync() the temp file
4. os.replace(temp_path, final_path)   ← atomic on Linux/macOS (POSIX rename)
5. Receiver sees either the old state or the new state — never a partial write
```

```
  AGENT TEAMS — FILESYSTEM MAILBOX ARCHITECTURE
  ══════════════════════════════════════════════════════════════════

  TERMINAL 1                TERMINAL 2               TERMINAL 3
  ──────────────            ──────────────           ──────────────
  Orchestrator              Worker: engineer          Worker: reviewer
  (claude session)          (claude session)          (claude session)
       │                         │                        │
       │                         │                        │
       │  TeamCreate("my-team")  │                        │
       │──────────────────┐      │                        │
       │                  │ creates ~/.claude/teams/my-team/
       │                  │      │                        │
       │  TaskCreate(     │      │                        │
       │   "implement X") │      │                        │
       │──────────────────┤      │                        │
       │                  │ writes task-001.json to tasks/
       │                  │      │                        │
       │  SendMessage(    │      │                        │
       │   to=engineer)   │      │                        │
       │──────────────────┤      │                        │
       │                  │ writes msg-*.json to inboxes/engineer/
       │                  │      │                        │
       │                  │      │ reads inbox            │
       │                  │      │──────────┐             │
       │                  │      │          │ TaskUpdate(in_progress)
       │                  │      │          │ reads task-001.json
       │                  │      │◄─────────┘             │
       │                  │      │                        │
       │                  │      │ [works on task]         │
       │                  │      │                        │
       │                  │      │  SendMessage(          │
       │                  │      │   to=reviewer,         │
       │                  │      │   "review my work")    │
       │                  │      │────────────────────────►
       │                  │      │                        │
       │                  │      │  TaskUpdate(completed) │
       │                  │      │──────────┐             │
       │                  │      │          │ writes to tasks/
       │                  │      │◄─────────┘             │
       │                  │      │                        │
       │ reads inboxes/   │      │                        │ [reviews]
       │ orchestrator/    │      │                        │
       │◄─────────────────┤      │                        │
       │                  │      │                        │  SendMessage(
       │                  │      │                        │   to=orchestrator,
       │                  │      │                        │   "LGTM / issues")
       │◄─────────────────┼──────┼────────────────────────┘
       │                  │      │
       │  [aggregates     │
       │   results,       │
       │   final output]  │

  FILESYSTEM LAYOUT:
  ~/.claude/teams/my-team/
  ├── manifest.json          ← team name, members, created_at
  ├── tasks/
  │   ├── task-001.json      ← {id, title, desc, assignee, status}
  │   └── task-002.json
  └── inboxes/
      ├── orchestrator/
      │   └── msg-{ts}-{hash}.json   ← atomic: tempfile + os.replace
      ├── engineer/
      │   └── msg-{ts}-{hash}.json
      └── reviewer/
          └── msg-{ts}-{hash}.json
```

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

### 2.5 Task State Machine

```
  TASK LIFECYCLE — FULL STATE MACHINE
  ══════════════════════════════════════════════════════════════════

  TaskCreate({title, description, assignee?})
          │
          ▼
       ┌────────┐
       │pending │  ← task created, waiting to be claimed
       └────┬───┘
            │  Any eligible agent calls TaskUpdate(status: "in_progress")
            │  Uses O_EXCL file lock to prevent double-claiming.
            │  If two agents race, exactly one wins; loser retries with
            │  next "pending" task.
            ▼
      ┌───────────┐
      │in_progress│  ← agent actively working; "claimed_by" field set
      └─────┬─────┘
            │
      ┌─────┼────────────────────────────────────┐
      │     │                                    │
      ▼     ▼                                    ▼
  ┌──────┐  ┌────────┐                     ┌──────────┐
  │done  │  │ failed │                     │ blocked  │  ← NEW in v2.1.100+
  └──────┘  └────┬───┘                     └────┬─────┘
                 │                              │
                 │ orchestrator may             │ agent waiting for
                 │ reassign or escalate         │ another task/message
                 ▼                              │
            ┌──────────┐                       │ when dependency resolves:
            │cancelled │  ←────────────────────┘ TaskUpdate(in_progress)
            └──────────┘

  VALID TRANSITIONS:
  ──────────────────
  pending     → in_progress   (worker claims task via TaskUpdate)
  in_progress → done          (TaskUpdate status:"completed", result:"...")
  in_progress → failed        (TaskUpdate status:"failed", error:"...")
  in_progress → blocked       (TaskUpdate status:"blocked", waiting_for:"task-002")
  blocked     → in_progress   (when dependency completes; auto-transition)
  failed      → pending       (orchestrator resets to retry; seq increments)
  any         → cancelled     (TeamDelete or orchestrator force-cancels)

  CLAIM PROTOCOL — RACE-CONDITION-SAFE:
  ──────────────────────────────────────
  1. Worker calls TaskList → receives list of tasks with status:"pending"
  2. Worker selects a task to claim
  3. Worker opens task file with O_EXCL | O_WRONLY (fails if another
     writer holds the lock — Linux flock, macOS advisory lock)
  4. If lock acquired:
       a. Read current status field
       b. If status still "pending": write updated JSON with
          status:"in_progress", claimed_by:"<worker_name>",
          claimed_at:"<now>", seq:<prev+1>
       c. fsync() and release lock
       d. Worker owns this task
  5. If lock NOT acquired (EWOULDBLOCK):
       → Another worker claimed it first
       → Skip; loop to next "pending" task in TaskList
  6. If no "pending" tasks remain: worker polls TaskList every N seconds
     (configurable; default 3s) until new tasks appear or TeamDelete fires

  NOTE: The seq field is critical. Before writing, always read the current
  seq and increment by 1. If you see seq=5 but your local copy shows seq=3,
  a concurrent writer updated the task — re-read before claiming.
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

### 2.7 Orchestrator → Worker Sequence: Step by Step

```
  ORCHESTRATOR                   WORKER (engineer)
  ════════════════════════════════════════════════

  1. TeamCreate("feature-team",
       members=["engineer", "reviewer"])
       → creates ~/.claude/teams/feature-team/

  2. TaskCreate({
       title: "Implement auth module",
       description: "...",
       assignee: "engineer"
     })
     → writes task-001.json (status: pending)

  3. SendMessage(to="engineer",
       type="message",
       content="Task created. Please check your task list.")
     → writes to inboxes/engineer/msg-001.json

                                 4. (polls inbox, finds message)
                                 5. TaskList("feature-team")
                                    → sees task-001 in pending state
                                 6. TaskUpdate(task-001,
                                      status="in_progress")
                                    → acquires file lock, updates JSON

                                 7. [implements auth module]
                                    - reads existing code
                                    - writes new files
                                    - runs tests

                                 8. TaskUpdate(task-001,
                                      status="completed",
                                      result="Auth module done. Tests pass.")

                                 9. SendMessage(to="orchestrator",
                                      type="task_update",
                                      content="Task complete: auth module implemented")
                                    → writes to inboxes/orchestrator/msg-002.json

 10. (polls inbox, finds update)
 11. TaskList — verifies completion
 12. [assigns next task or TeamDelete]
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

### Pattern 3b: Concrete 3-Agent Parallel Workflow (Step by Step)

This is a fully worked example of three agents running truly in parallel — an `architect`, an `engineer`, and a `tester` — collaborating on implementing a new feature.

**Setup (run in your shell before starting sessions):**

```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
mkdir -p ~/.claude/teams/feat-team/tasks
mkdir -p ~/.claude/teams/feat-team/inboxes/{orchestrator,architect,engineer,tester}
```

**Terminal 1 — Orchestrator:**

```
> TeamCreate("feat-team", members=["architect","engineer","tester"])

> TaskCreate({
    id: "task-001",
    title: "Design notification system",
    description: "Design a pub/sub notification system for the app. Output: design.md with component diagram, API contracts, and data model.",
    assignee: "architect"
  })

> TaskCreate({
    id: "task-002",
    title: "Implement notification service",
    description: "Implement the notification service per the design in design.md. Use the existing MessageBus in src/bus/. Output: src/notifications/service.py and src/notifications/models.py",
    assignee: "engineer",
    depends_on: ["task-001"]   ← will start blocked; unblocks when task-001 completes
  })

> TaskCreate({
    id: "task-003",
    title: "Write tests for notification service",
    description: "Write pytest unit tests for src/notifications/service.py. Cover: happy path, subscriber fanout, dead-letter queue handling.",
    assignee: "tester",
    depends_on: ["task-002"]
  })

> SendMessage(to="architect", content="Task queue ready. Start with task-001.")
> SendMessage(to="engineer",  content="Wait for task-001 to complete before starting task-002.")
> SendMessage(to="tester",    content="Wait for task-002 to complete before starting task-003.")
```

**Terminal 2 — Architect:**

```bash
claude --agent-team feat-team --agent-name architect
```

```
> TaskList("feat-team")
# sees task-001 in pending state

> TaskUpdate("task-001", status="in_progress")
# architect now owns it

# [architect reads existing codebase, designs the system, writes design.md]

> TaskUpdate("task-001", status="completed",
    result="Design complete. design.md written with: EventBus interface, NotificationEvent model, SubscriberRegistry, DeadLetterQueue handling.")

> SendMessage(to="orchestrator",
    content="task-001 done. design.md ready at project root.")
```

**Terminal 3 — Engineer:**

```bash
claude --agent-team feat-team --agent-name engineer
```

```
> TaskList("feat-team")
# sees task-002 in "blocked" state (task-001 not yet complete)
# engineer waits, polling every 3s...

# [task-001 completes; task-002 auto-transitions to "pending"]

> TaskUpdate("task-002", status="in_progress")
# engineer reads design.md, implements the service

> TaskUpdate("task-002", status="completed",
    result="Implemented NotificationService, SubscriberRegistry, DeadLetterQueue. All classes in src/notifications/. Manually verified with a quick smoke test.")

> SendMessage(to="orchestrator",
    content="task-002 done. Implementation in src/notifications/.")
```

**Terminal 4 — Tester:**

```bash
claude --agent-team feat-team --agent-name tester
```

```
> TaskList("feat-team")
# sees task-003 blocked; waits for task-002...

# [task-002 completes; task-003 transitions to "pending"]

> TaskUpdate("task-003", status="in_progress")
# tester reads implementation, writes tests

# [runs: pytest tests/notifications/ → 12 passed, 0 failed]

> TaskUpdate("task-003", status="completed",
    result="12 tests written and passing. See tests/notifications/test_service.py.")

> SendMessage(to="orchestrator",
    content="task-003 done. All 12 tests pass.")
```

**Orchestrator receives completion messages:**

```
# [orchestrator polls its inbox, sees 3 task_update messages]

> TaskList("feat-team")
# all 3 tasks in "completed" state

> TeamDelete("feat-team")

# [synthesises final summary for user]
```

**Wall-clock timeline:**

```
t=0    Orchestrator creates team + all 3 tasks
t=1    Architect starts task-001
       Engineer waits (task-002 blocked on task-001)
       Tester   waits (task-003 blocked on task-002)
t=8    Architect completes task-001 → task-002 unblocks
t=8    Engineer starts task-002 immediately (no polling delay)
       Tester   still waiting (task-003 blocked on task-002)
t=18   Engineer completes task-002 → task-003 unblocks
t=18   Tester starts task-003
t=23   Tester completes task-003
t=23   Orchestrator synthesises results → TeamDelete

Total elapsed: ~23 minutes
If sequential (one agent): ~30+ minutes
Speedup: ~25% — limited by the dependency chain in this example.
For tasks with no dependencies, speedup is N× where N = number of parallel agents.
```

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

### Orchestration Patterns

#### Pattern 1: Map-Reduce

Spawn N agents in parallel for independent sub-tasks, then aggregate:

```bash
# Orchestrator prompt
"I need to analyse 10 microservices for security vulnerabilities.
Spawn one subagent per service using the Task tool.
Each agent should: read the service code, identify issues, write findings to /tmp/findings-<service>.md
After all agents complete, aggregate all findings into /tmp/security-report.md"
```

#### Pattern 2: Pipeline

Chain agents where output of one feeds the next:

```
Agent 1 (Researcher) → writes research.md
Agent 2 (Architect)  → reads research.md, writes design.md
Agent 3 (Implementer)→ reads design.md, implements code
Agent 4 (Reviewer)   → reads code, writes review.md
```

#### Pattern 3: Specialist Delegation

Orchestrator delegates by domain expertise:

```yaml
# .claude/agents/frontend-agent.md
---
name: frontend-agent
description: Specialist for React/TypeScript/CSS work
tools: [Read, Write, Edit, Bash]
allowedPaths: [src/components/**, src/styles/**, src/pages/**]
---
You are a frontend specialist. Focus only on React components, 
TypeScript interfaces, and CSS styling. Never touch backend code.
```

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

### 4.5 Cost Estimation for Agent Fleets

Understanding the cost profile before launching large agent teams prevents surprise bills:

```
  COST ESTIMATION GUIDE
  ══════════════════════════════════════════════════════════════════

  Single session cost estimate:
    model             input $/M    output $/M   typical session cost
    ─────────────────────────────────────────────────────────────────
    claude-haiku-4-5    $0.80        $4.00       $0.02 – $0.10
    claude-sonnet-4-6   $3.00       $15.00       $0.10 – $0.50
    claude-opus-4-7    $15.00       $75.00       $0.50 – $3.00

  Agent team cost multiplier:
    N agents × session_cost × turns

  Example: 5-agent feature team (1 Opus lead + 4 Sonnet workers)
    Lead:    1 × $1.00 avg   = $1.00
    Workers: 4 × $0.30 avg   = $1.20
    Total per task:            ~$2.20

  Cost reduction strategies:
  1. Lead on Opus (strategic), workers on Sonnet (execution): 60% saving
  2. Workers on Haiku for simple tasks (review, formatting): 85% saving
  3. Use max-turns: 15 per worker agent: prevents runaway costs
  4. max_budget_usd on SDK sessions: hard cap per session
  5. Reuse StatefulClient across turns: amortises session startup cost

  Per-run CI/CD budget targets:
    PR review (read-only):   $0.05 – $0.25 (claude-sonnet, plan mode)
    Test generation:         $0.10 – $0.50 (claude-sonnet, autoAccept)
    Full refactor review:    $0.50 – $2.00 (claude-opus, autoAccept)
    Agent team pipeline:     $1.00 – $5.00 (mixed models)
```

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

### Detailed Decision Matrix: Task Tool vs Agent Teams vs SDK Parallel Sessions

Understanding the precise trade-offs between the three parallelism mechanisms prevents choosing the wrong tool for the job.

```
  MECHANISM COMPARISON — FULL DETAIL
  ══════════════════════════════════════════════════════════════════

  TASK TOOL (fire-and-forget subagents)
  ─────────────────────────────────────
  Invocation:   Orchestrator calls Task("prompt", agent_name?)
  Lifetime:     Ephemeral — agent runs once, returns result, gone
  Communication:One-way: prompt in, text result out
  State:        None — subagent can't query the orchestrator
  Context:      Forked from orchestrator's context at invocation time
  Best for:     Independent subtasks — analysing N files, reviewing N modules,
                running N independent searches in parallel
  Cost:         1 session startup per Task call; no idle cost
  Stability:    GA — safe for production

  AGENT TEAMS (persistent peer-to-peer)
  ──────────────────────────────────────
  Invocation:   TeamCreate → TaskCreate → workers poll their inboxes
  Lifetime:     Persistent across turns until TeamDelete is called
  Communication:Bidirectional — any agent can message any other agent
  State:        Shared task queue + per-agent inboxes on filesystem
  Context:      Each worker agent has its own independent context window
  Best for:     Workflows where workers need to negotiate, request
                clarification, route results to peers, or proceed through
                multi-step pipelines with inter-agent dependencies
  Cost:         N idle session costs while workers wait for tasks
  Stability:    Research Preview — breaking changes possible

  SDK PARALLEL SESSIONS (asyncio.gather or Promise.all)
  ──────────────────────────────────────────────────────
  Invocation:   Python/TypeScript SDK; asyncio.gather() or Promise.all()
  Lifetime:     Controlled entirely by calling code
  Communication:Through your application code (not agent-to-agent)
  State:        Managed by your application (files, DB, etc.)
  Context:      Fully independent sessions per branch/directory
  Best for:     CI/CD automation, batch processing, PR reviews at scale,
                cases where you need structured output (JSON) per session
  Cost:         Pay only for active API calls; no idle cost
  Stability:    GA — StatefulClient is production-ready

  DECISION RULES:
  ───────────────
  • Simple parallel fan-out (N independent tasks)      → Task tool
  • Agents need to talk back to each other             → Agent Teams
  • You control the orchestration from application code → SDK sessions
  • Must work in CI/CD without human-in-the-loop       → Task tool or SDK
  • Need to switch between branches per agent           → SDK + worktrees
  • Agents need to negotiate output quality iteratively → Agent Teams
```

### Capability Comparison: Orchestrator vs Subagent

| Capability | Orchestrator | Subagent |
|-----------|-------------|---------|
| Read files | Yes | Yes (if allowed by `allowedPaths`) |
| Write files | Yes | Yes (if allowed by `allowedPaths`) |
| Spawn further subagents | Yes (nested) | Yes (nested up to depth limit) |
| Access MCP servers | Yes | Yes (inherits from orchestrator) |
| Access hooks | Yes | Yes (fires orchestrator's hooks) |
| Own MEMORY.md | Yes | Yes (isolated) |
| Share memory with orchestrator | No | No (isolated by design) |
| Access internet | Yes | Yes (if WebFetch/WebSearch allowed) |
| Max context window | 200K/1M | 200K/1M (own context) |
| Max turns | Unlimited | Configured by `maxTurns` in YAML |

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

### Known Limitations (Research Preview — v2.1.126)

| Limitation | Status | Workaround |
|-----------|--------|-----------|
| Agent Teams is experimental | Research Preview | Enable with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |
| Message ordering not guaranteed | Known issue | Use sequence numbers in messages |
| Max team size | 8 agents | Split large teams into hierarchical groups |
| No built-in deadlock detection | Known issue | Set per-agent `maxTurns` to prevent infinite loops |
| Shared filesystem requires coordination | By design | Use file locking or mailbox protocol |
| Team state not persisted across sessions | Known issue | Write state to team.json manually |
| No native broadcasting | Known issue | Loop through agent mailboxes manually |
| Debugging agent interactions | Hard | Enable `CLAUDE_CODE_AGENT_TEAMS_DEBUG=1` for verbose logs |

#### Deep Dive: No Shared Memory Between Agents

Each agent in a team has a completely isolated context window. There is no mechanism for one agent to read another agent's in-memory state, conversation history, or intermediate reasoning. This is a deliberate design constraint, not a missing feature.

**What "no shared memory" means in practice:**

```
  AGENT A (context window)          AGENT B (context window)
  ─────────────────────────         ─────────────────────────
  [system prompt]                   [system prompt]
  [CLAUDE.md]                       [CLAUDE.md]
  [conversation: 8 turns]           [conversation: 4 turns]
  [file reads: auth.py, models.py]  [file reads: tests.py]
  [tool results: ...]               [tool results: ...]

  AGENT A cannot see what           AGENT B cannot see what
  Agent B has read or reasoned.     Agent A has done.

  ❌ No shared scratchpad
  ❌ No "hey B, what did you find in models.py?" direct memory access
  ✓  Agent A CAN write findings to a file; Agent B CAN read that file
  ✓  Agent A CAN SendMessage("my findings are: ..."); Agent B reads inbox
```

**Consequence for workflow design:** Every piece of information that one agent needs from another must be made explicit — written to a file, or included in a message payload. Agents cannot rely on implicit shared understanding.

**Best practice — explicit handoff files:**

```markdown
# In agent instructions:
When completing a task, write a handoff file:

/tmp/agent-handoffs/{task-id}-handoff.md

Include:
- Summary of what you did
- Key decisions made (and why)
- Files created/modified (with purpose of each)
- Open questions or blockers
- Recommended next steps for the next agent

The receiving agent reads this file as its first action.
```

**The MEMORY.md scoping rule for Agent Teams:**

Agent-level MEMORY.md (`.claude/agent-memory/{agent-name}/MEMORY.md`) is per-agent and per-session. It is NOT shared between agents. If Agent A writes to its own MEMORY.md, Agent B cannot read it — Agent B only reads its own MEMORY.md.

To share facts across agents: write to a well-known shared file path (e.g., `~/.claude/teams/{team-name}/shared-context.md`) and have each agent read it as part of their startup instructions.

#### Deep Dive: Message Ordering Guarantees

The filesystem mailbox provides the following ordering guarantees — and explicitly does NOT provide certain guarantees that developers might expect.

**What IS guaranteed:**

```
Same-sender ordering:
  If Agent A sends msg-1, then msg-2, then msg-3 to Agent B,
  Agent B will always process them in order 1 → 2 → 3.
  Reason: filenames include nanosecond timestamps; same agent's
  clock is monotonic; Agent B reads inbox files in lexicographic
  (= timestamp) order.

Atomic delivery:
  A message is either fully in the inbox (complete JSON) or not
  present at all. There is no "partial message" state.
  Reason: atomic os.replace() write protocol.

No message loss (on same machine):
  Once SendMessage() returns, the message file exists on disk.
  It will not disappear unless TeamDelete or manual deletion occurs.
```

**What is NOT guaranteed:**

```
Cross-agent ordering:
  If Agent A sends msg-X and Agent B sends msg-Y to Agent C at
  the same clock tick, Agent C may process them in either order.
  The inbox is not a total-order queue across multiple senders.

  Example failure scenario:
    t=100ms  Agent A: SendMessage(to=C, "I updated auth.py")
    t=101ms  Agent B: SendMessage(to=C, "I updated auth.py")
    Agent C reads Agent B's message first (nanosecond race).
    If both modified auth.py, Agent C may apply B's context
    before A's context, leading to incorrect reasoning.

  Workaround: Use explicit sequence numbers in your message payload:
    { "global_seq": 42, "content": "I updated auth.py" }
    Agent C sorts by global_seq before acting on messages.

Delivery latency:
  There is no push notification. Agents poll their inboxes.
  Default polling interval: 3 seconds.
  A message sent at t=0 may not be processed until t=3s.
  For latency-sensitive workflows, reduce polling or use Monitor tool.

Ordering across task updates and messages:
  TaskUpdate() writes to tasks/ directory.
  SendMessage() writes to inboxes/ directory.
  These are separate write paths with no shared lock.
  An agent calling TaskUpdate followed immediately by SendMessage
  has no guarantee which the orchestrator sees first.

  Safe pattern:
    1. Complete work
    2. Write output files (fsync)
    3. TaskUpdate(status:"completed")  ← update shared task state
    4. SendMessage(to=orchestrator, "task done")  ← notify
    The orchestrator should trust TaskUpdate as the authoritative
    signal; SendMessage is a hint/notification only.
```

---

## 7. Anti-Patterns and Common Mistakes

```
  AGENT TEAM ANTI-PATTERNS
  ══════════════════════════════════════════════════════════════════

  ANTI-PATTERN 1: Using Agent Teams for simple parallelism
  ─────────────────────────────────────────────────────────
  WRONG:  TeamCreate + 3 workers just to run 3 analyses
  RIGHT:  Use 3 Task() calls in one session (same result, 5x cheaper)

  Task tool spawns fire-and-forget workers; Agent Teams add overhead
  for persistent communication that simple parallel tasks don't need.

  ANTI-PATTERN 2: All workers on Opus
  ─────────────────────────────────────────────────────────
  WRONG:  Lead=Opus, Worker1=Opus, Worker2=Opus, Worker3=Opus
  RIGHT:  Lead=Opus (strategic), Workers=Sonnet (execution)

  Opus costs 5x more than Sonnet. Implementation work rarely
  needs Opus-level reasoning; reserve it for architectural decisions.

  ANTI-PATTERN 3: No task decomposition before TeamCreate
  ─────────────────────────────────────────────────────────
  WRONG:  Create team, send vague "implement the feature" message
  RIGHT:  Pre-define 5-10 specific tasks in TaskCreate before
          workers start. Workers poll TaskList and self-assign.

  Workers idle while waiting for direction waste session costs.
  Pre-define the full task queue so workers can immediately proceed.

  ANTI-PATTERN 4: Forgetting isolation: worktree
  ─────────────────────────────────────────────────────────
  WRONG:  Multiple workers editing the same files in the main worktree
  RIGHT:  isolation: worktree in agent definition — each worker
          gets its own git worktree

  Without isolation, workers conflict on file edits, creating
  merge conflicts and corrupted state.

  ANTI-PATTERN 5: Building on Agent Teams for production
  ─────────────────────────────────────────────────────────
  Research Preview means: breaking API changes without warning,
  undocumented edge cases, no SLA. Prototype only.
  Use Task tool for production agentic pipelines.

  ANTI-PATTERN 6: Indefinite wait loops
  ─────────────────────────────────────────────────────────
  WRONG:  while true; poll inbox; wait 1s; end
  RIGHT:  Use Monitor tool to watch for inbox file changes.
          Monitor fires when files appear — no polling loop needed.
```

### Common mistakes table

| Mistake | Why it hurts | Fix |
|---------|-------------|-----|
| Using Agent Teams for simple parallelism | 5-7× cost for no benefit | Use SubAgents with Task tool instead |
| All teammates on Opus 4.7 | $$$: each is a full Opus session | Lead on Opus; teammates on Sonnet/Haiku |
| No task decomposition before TeamCreate | Teammates idle waiting for direction | Pre-define tasks; claim-and-execute pattern |
| Forgetting `isolation: worktree` | Teammates conflict on same files | Add `isolation: worktree` to all teammates |
| Building on Agent Teams for production | Research Preview = breaking changes | Prototype only; not GA yet |
| Polling inbox with sleep loops | Wasteful; misses events under load | Use Monitor tool for file-based event watching |
| Not calling TeamDelete at end | Stale mailbox files accumulate | Always call TeamDelete in finally block |

---

## 8. Debugging Agent Team Issues

### Common failure modes and diagnosis

```bash
# 1. Check if team files exist
ls -la ~/.claude/teams/my-team/
ls -la ~/.claude/teams/my-team/inboxes/
ls -la ~/.claude/teams/my-team/tasks/

# 2. Inspect a task's current state
cat ~/.claude/teams/my-team/tasks/task-001.json | jq .

# 3. Check inbox contents (pending messages)
ls ~/.claude/teams/my-team/inboxes/worker-1/
cat ~/.claude/teams/my-team/inboxes/worker-1/msg-*.json | jq .

# 4. Check team manifest
cat ~/.claude/teams/my-team/manifest.json | jq .

# 5. Clean up a stuck team manually
rm -rf ~/.claude/teams/my-team/
```

### Debugging checklist

```
  AGENT TEAM DEBUGGING CHECKLIST
  ══════════════════════════════════════════════════════════════════

  WORKER NOT RECEIVING MESSAGES
  [ ] Is CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 set in worker terminal?
  [ ] Is worker session using same team name as orchestrator?
  [ ] Check inboxes/<worker-name>/ for message files
  [ ] Check manifest.json — is worker registered as member?

  TASKS NOT BEING CLAIMED
  [ ] Check tasks/*.json status field — is it "pending"?
  [ ] Is worker polling TaskList actively?
  [ ] File lock contention? Try: lsof ~/.claude/teams/team/tasks/task-001.json
  [ ] Worker may have crashed — check worker terminal for errors

  ORCHESTRATOR NOT GETTING RESULTS
  [ ] Check inboxes/orchestrator/ for messages from workers
  [ ] Did worker call TaskUpdate(status: "completed") correctly?
  [ ] Worker may have hit max-turns limit — check worker terminal
  [ ] Worker may have exceeded budget — check cost in worker session

  SESSION RESUMED BUT WORKERS GONE
  [ ] This is expected Research Preview behaviour
  [ ] Workers do not resume with the orchestrator session
  [ ] Start fresh worker sessions with same team name
  [ ] Orchestrator picks up existing team state (tasks + mailboxes)

  HIGH COST, LOW THROUGHPUT
  [ ] Model mismatch: all workers on Opus? Switch to Sonnet/Haiku
  [ ] max-turns too high: set 15-20 for focused tasks
  [ ] Too many idle workers: reduce team size, increase task granularity
  [ ] Context window bloat: add /compact to worker agent instructions

  MAILBOX FILE CONFLICTS
  [ ] Multiple orchestrators writing to same team? Use unique team names
  [ ] File permission errors? Check ~/.claude/teams/ permissions (700)
  [ ] Disk full? ~/.claude/teams/ inbox files accumulate — call TeamDelete
```

### Enabling verbose debug logging

```bash
# Worker terminal — verbose mode
CLAUDE_CODE_DEBUG=1 CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 claude

# Check agent event stream
claude --output-format stream-json --agent-team my-team --agent-name worker-1 \
  --print "Check your task list and process the next pending task" 2>&1 | \
  jq 'select(.type != "assistant")' # filter to non-text events
```

---

## 9. YAML Frontmatter Reference — Agent Definitions

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

# --- Isolation ---
isolation: worktree          # Run in own git worktree (v2.1.50). Prevents file conflicts.
---

# Agent Instructions

Write the agent's system instructions here in markdown.
This is treated with the same priority as CLAUDE.md.
```

---

## 10. Viewing and Managing Agents

```
/agents                       # List all available agents
/agents create                # Create a new agent interactively
/agents edit my-agent         # Edit agent definition
/agents delete my-agent       # Remove agent
```

---

## 11. Agent Teams — Production Patterns

### Pattern 1: Parallel Test Generation

Spawn one test-writing agent per module simultaneously:

```markdown
<!-- .claude/agents/test-writer.md -->
---
name: test-writer
description: Writes comprehensive unit tests for a given module
tools: [Read, Write, Bash]
model: claude-sonnet-4-6
effort: normal
---
You are a test-writing specialist. Given a source module:
1. Read all source files in the module
2. Identify all public functions, classes, and edge cases
3. Write comprehensive unit tests following the project's testing conventions from CLAUDE.md
4. Run the tests to verify they pass
5. Return a summary of tests written and coverage estimate
```

Orchestrator:
```
Write comprehensive tests for all three modules simultaneously.
Use Task tool to spawn three test-writer agents in parallel:
- Task: "Write tests for services/auth/", agent: test-writer
- Task: "Write tests for services/api/", agent: test-writer  
- Task: "Write tests for services/worker/", agent: test-writer
```

### Pattern 2: Code Review Pipeline

Sequential pipeline: security review → performance review → style review:

```
Orchestrator spawns:
1. Task("Security review of PR changes", agent: security-reviewer)
   → waits for result
2. If security issues found: Task("Fix security issues", agent: code-fixer)
3. Task("Performance review of updated code", agent: performance-reviewer)
4. Task("Final style and documentation check", agent: style-checker)
```

### Pattern 3: Parallel Codebase Migration

Migrate an API across all service packages simultaneously:

```
Orchestrator:
"Migrate all services from axios to fetch API.
 Spawn one migration agent per service directory:
 - Task for services/auth
 - Task for services/api
 - Task for services/worker
 - Task for packages/client
 Each agent should: find all axios usages, replace with fetch equivalents,
 update tests, verify tests pass, and report back."
```

**Key constraint:** Agents in the same Agent Team session share the filesystem — avoid two agents writing to the same file simultaneously. Use path scoping to give each agent exclusive ownership of its directory.

### Pattern 4: Incremental Analysis → Fix Loop

```
1. Orchestrator: spawn analysis-agent → "Find all TypeScript type errors"
2. Receive: list of 47 type errors across 12 files
3. Group by file
4. For each group: spawn fix-agent with specific file context
5. After all fix agents complete: spawn test-agent → "Run all tests, report failures"
6. If failures: loop back to step 1 with narrowed scope
```

### Known Limitations (as of v2.1.126)

| Limitation | Impact | Workaround |
|------------|--------|-----------|
| No direct inter-agent API calls | Agents can't call each other directly | Use filesystem mailbox: write output to file, other agent reads it |
| Parent context not shared | Subagents start with CLAUDE.md only, not parent conversation | Pass critical context in task description or shared files |
| Max concurrent agents | Practical limit ~10 parallel agents (memory/API rate limits) | Use sequential batches for >10 agents |
| No agent state persistence across sessions | Agent memory clears when session ends | Write important outputs to files before session ends |
| Agent Teams requires env flag | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` required | Include in `.claude/settings.json` via env block |

---

## Related Guides

- [CLI Technical Reference](./claude-code-reference) — Section 10: Subagents & Agent Teams
- [Hooks System](./hooks-deep-dive) — SubagentStop and TaskCompleted hooks
- [MCP Servers Guide](./mcp-servers-guide) — tools available to agents
- [CI/CD Integration](./cicd-integration) — agents in pipelines

---

## Enabling Agent Teams

Agent Teams are in Research Preview as of v2.1.126. To enable:

```bash
# Set the environment variable before launching Claude Code
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
claude

# Or set it per-session via a SessionStart hook
# In .claude/settings.json:
{
  "hooks": {
    "SessionStart": [{
      "handler": {
        "type": "command",
        "command": "echo 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1'"
      }
    }]
  }
}
```

The environment variable must be set in the parent session that creates the Agent Team. Sub-agents in the team do NOT need the flag — they receive it through team configuration. The flag does NOT persist across Claude Code restarts unless set in your shell profile.

**Verification:** Once enabled, type `/agents` in a Claude Code session. The output should include "Agent Teams (Research Preview): enabled" in the status line.

---

## Agent Teams State Machine

Every message in an Agent Teams team follows this state lifecycle:

```
                    ┌─────────────────────────────────────────────┐
                    │           AGENT TEAMS MESSAGE STATES         │
                    └─────────────────────────────────────────────┘

Message created → [PENDING]
                     │
                     ▼
              Team router picks it up → [QUEUED]
                     │
                     ▼
              Assigned agent starts work → [ACTIVE]
                     │
            ┌────────┼────────────────────┐
            ▼        ▼                    ▼
         [DONE]   [FAILED]           [WAITING]
         (result   (error,            (blocked, waiting
          returned) retried up         for another agent
                    to 3×)             to respond)
                     │                    │
                     │                    ▼
                     │              Other agent responds
                     │                    │
                     │                    ▼
                     │              [ACTIVE] again
                     │
                  [CANCELLED] (orchestrator terminated team)
```

**Key state transitions:**
- `PENDING → QUEUED`: The team router has accepted the message and is routing it
- `QUEUED → ACTIVE`: An agent has picked up the task and started processing
- `ACTIVE → WAITING`: The agent is waiting for a peer agent's response (e.g., waiting for the researcher to return data before the writer can proceed)
- `ACTIVE → DONE`: Task completed successfully, result written to mailbox
- `ACTIVE → FAILED`: Tool error or timeout; retried up to 3 times before permanent failure
- `DONE/FAILED → CANCELLED`: Orchestrator terminated the team before all agents finished

---

## Mailbox Protocol Deep Dive

The filesystem mailbox is the inter-agent communication channel. All messages are files in a well-known directory:

```
~/.claude/agent-teams/<team-id>/mailbox/
  ├── inbox/
  │   ├── <message-id>.json    ← messages TO this agent
  │   └── ...
  ├── outbox/
  │   ├── <message-id>.json    ← messages FROM this agent
  │   └── ...
  └── team-state.json          ← shared team state (read by all agents)
```

**Message file format** (`<message-id>.json`):

```json
{
  "id": "msg_01AbCd...",
  "from": "researcher",
  "to": "writer",
  "type": "task" | "response" | "status" | "terminate",
  "payload": {
    "content": "Here are the search results: ...",
    "artifacts": ["./research-notes.md"],
    "status": "success" | "error"
  },
  "timestamp": "2026-06-04T12:00:00Z",
  "state": "PENDING" | "QUEUED" | "ACTIVE" | "WAITING" | "DONE" | "FAILED" | "CANCELLED"
}
```

**team-state.json** is the shared coordination file. Every agent in the team can read it. The orchestrator agent writes to it to signal team-wide state changes (pause, resume, terminate). Individual agents write their own status updates.

**Important constraint:** Agents cannot write to each other's inboxes directly — all routing goes through the team router. This prevents deadlocks where two agents are each waiting for the other.

---

## Monitoring Running Teams

Monitor a live Agent Teams session using these tools:

```bash
# View mailbox messages in real time
watch -n 1 'ls -la ~/.claude/agent-teams/*/mailbox/inbox/'

# Watch team-state.json for coordinator signals
tail -f ~/.claude/agent-teams/<team-id>/mailbox/team-state.json | jq .

# Check agent logs (each agent has a separate log)
tail -f ~/.claude/logs/agent-teams-<team-id>-*.log

# From within Claude Code
/debug agents   # Shows live agent team status including state, message count, errors
```

The `/debug agents` output shows:
- Team ID and creation time
- List of all agents with their current state (ACTIVE/WAITING/DONE/FAILED)
- Message queue depth (pending + queued messages)
- Last activity timestamp per agent
- Any error messages from failed tasks

---

## When Agent Teams Fail

Common failure modes and how to recover:

| Failure | Symptom | Recovery |
|---------|---------|----------|
| Agent timeout | One agent goes to FAILED state; task stuck | Run `/agents restart <agent-id>` to restart that specific agent |
| Deadlock (two agents waiting for each other) | All agents in WAITING state, no progress | Run `/agents terminate` and redesign the workflow to avoid circular dependencies |
| Mailbox fills up | Messages dropped; agents report "mailbox full" | Use `/agents clear-mailbox` to remove completed messages; increase `maxMailboxSize` in team config |
| Env var not set | `/agents` doesn't show "Agent Teams: enabled" | Set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` and restart Claude Code |
| Tool permission blocked | Agent task fails on PreToolUse hook | Check `permissions.allow` includes the tools your agents need; subagents inherit parent permissions |

---

## Advanced Agent Teams Patterns

### The Hub-and-Spoke Orchestration Pattern

The hub-and-spoke pattern designates a single **orchestrator** (hub) that manages several **specialist** agents (spokes). The orchestrator holds the high-level plan and task queue; each spoke is a narrow expert that receives well-defined subtasks and reports results back.

```
                    ┌─────────────────────────────┐
                    │        ORCHESTRATOR          │
                    │   (Hub — Claude Opus 4.8)    │
                    │                              │
                    │  • Holds master task plan    │
                    │  • Decomposes work into      │
                    │    subtasks                  │
                    │  • Routes subtasks to        │
                    │    correct spoke             │
                    │  • Assembles final result    │
                    └──────┬──────┬──────┬─────────┘
                           │      │      │
              ┌────────────┘  ┌───┘  └────────────┐
              ▼               ▼                    ▼
   ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
   │  CODE WRITER    │ │  CODE REVIEWER  │ │  TEST GENERATOR │
   │ (Sonnet 4.6)    │ │ (Sonnet 4.6)    │ │ (Sonnet 4.6)    │
   │                 │ │                 │ │                 │
   │ • Implements    │ │ • Reviews PRs   │ │ • Writes unit   │
   │   features      │ │ • Checks style  │ │   tests         │
   │ • Writes docs   │ │ • Security scan │ │ • Runs tests    │
   │ • Refactors     │ │ • Reports bugs  │ │ • Reports gaps  │
   └─────────────────┘ └─────────────────┘ └─────────────────┘
```

**Orchestrator CLAUDE.md:**

```markdown
# CLAUDE.md — Orchestrator (Hub)

You are the orchestrator for a hub-and-spoke Agent Team. Your specialists are:

- **code-writer**: Implements features, writes documentation, performs refactoring
- **code-reviewer**: Reviews code for correctness, style, and security issues
- **test-generator**: Writes unit tests, runs the test suite, and identifies coverage gaps

## Your Workflow

1. Receive a task from the user
2. Decompose it into parallel subtasks where possible, sequential where dependencies exist
3. Dispatch subtasks to the appropriate specialist via the mailbox
4. Wait for completion signals before proceeding to dependent steps
5. Assemble the final result and report back to the user

## Dispatch Format

When sending a task to a specialist, use this message format:

```json
{
  "task_id": "unique-id-here",
  "assigned_to": "code-writer",
  "priority": "high",
  "task": "Description of the specific subtask",
  "context": "Any context the specialist needs",
  "expected_output": "What the specialist should return when done",
  "deadline_turns": 10
}
```

## Completion Protocol

Wait for a message with `"status": "complete"` from each specialist before
declaring a phase done. If a specialist reports `"status": "blocked"` or
`"status": "failed"`, escalate to the user immediately.

## Parallel vs Sequential

Dispatch in parallel when subtasks are independent.
Dispatch sequentially when output of one subtask is input to another.
```

**Code Writer CLAUDE.md (spoke):**

```markdown
# CLAUDE.md — Code Writer Specialist

You are the code-writer specialist in a hub-and-spoke Agent Team.

## Your Role

Receive implementation tasks from the orchestrator via the mailbox.
Execute them using your available tools (Read, Write, Edit, Bash).
Report results back via the mailbox when done.

## Task Protocol

1. Read incoming task from mailbox
2. Parse the `task_id`, `task`, and `context` fields
3. Execute the implementation work
4. Write a completion message to the mailbox:

```json
{
  "task_id": "<same task_id>",
  "from": "code-writer",
  "status": "complete",
  "summary": "Brief description of what was done",
  "files_modified": ["list", "of", "files"],
  "notes": "Any issues encountered or decisions made"
}
```

## Implementation Standards

- Follow the coding style established in CLAUDE.md
- Add docstrings/comments for all public functions
- Do not write tests (that is test-generator's responsibility)
- If you encounter ambiguity, make a reasonable decision and note it in your completion message
```

**Code Reviewer CLAUDE.md (spoke):**

```markdown
# CLAUDE.md — Code Reviewer Specialist

You are the code-reviewer specialist in a hub-and-spoke Agent Team.

## Your Role

Receive review tasks from the orchestrator. Review specified files or diffs
for correctness, style compliance, and security issues.

## Review Checklist

For each review task, check:
- [ ] No hardcoded credentials or secrets
- [ ] All error paths are handled
- [ ] No SQL injection vectors
- [ ] Input validation is present for all user-supplied data
- [ ] No obvious N+1 query patterns
- [ ] Function/method complexity is reasonable (< 20 lines preferred)
- [ ] Exported symbols are documented

## Output Format

```json
{
  "task_id": "<task_id>",
  "from": "code-reviewer",
  "status": "complete",
  "verdict": "approved" | "changes_requested" | "blocked",
  "issues": [
    {
      "severity": "critical" | "major" | "minor" | "nit",
      "file": "src/api/auth.go",
      "line": 42,
      "description": "SQL query not parameterized — injection risk"
    }
  ],
  "summary": "Overall assessment"
}
```
```

**Team configuration (`.claude/agent-teams.yaml`):**

```yaml
# .claude/agent-teams.yaml
teams:
  development:
    description: "Hub-and-spoke development team"
    orchestrator:
      agent_id: orchestrator
      model: claude-opus-4-8
      effort: high
      claude_md: .claude/agents/orchestrator/CLAUDE.md
    spokes:
      - agent_id: code-writer
        model: claude-sonnet-4-6
        effort: normal
        claude_md: .claude/agents/code-writer/CLAUDE.md
        max_concurrent_tasks: 1
      - agent_id: code-reviewer
        model: claude-sonnet-4-6
        effort: normal
        claude_md: .claude/agents/code-reviewer/CLAUDE.md
        max_concurrent_tasks: 2
      - agent_id: test-generator
        model: claude-sonnet-4-6
        effort: normal
        claude_md: .claude/agents/test-generator/CLAUDE.md
        max_concurrent_tasks: 1
    mailbox:
      maxMailboxSize: 100
      messageRetentionTurns: 50
```

---

### The Pipeline Pattern

The pipeline pattern arranges agents in a sequential chain where each agent's output feeds directly into the next agent's input. This is ideal for multi-stage processing workflows: generate → review → test → deploy.

```
   User Input
       │
       ▼
┌─────────────────┐
│   STAGE 1       │
│  Requirements   │ ──→ writes requirements.md to mailbox
│  Analyst        │
└─────────────────┘
                            │
                            ▼
                    ┌─────────────────┐
                    │   STAGE 2       │
                    │  Implementor    │ ──→ writes implementation to mailbox
                    │                 │
                    └─────────────────┘
                                                │
                                                ▼
                                        ┌─────────────────┐
                                        │   STAGE 3       │
                                        │  Reviewer       │ ──→ writes review to mailbox
                                        │                 │
                                        └─────────────────┘
                                                                    │
                                                                    ▼
                                                            ┌─────────────────┐
                                                            │   STAGE 4       │
                                                            │  Test Runner    │ ──→ Result
                                                            │                 │
                                                            └─────────────────┘
```

**Filesystem mailbox message passing protocol:**

The pipeline uses Claude Code's filesystem mailbox at `~/.claude/agent-teams/<team-id>/`. Each stage writes a well-structured message file when it completes, and the next stage polls for it.

```
~/.claude/agent-teams/pipeline-team-001/
  mailbox/
    stage1-to-stage2.json      ← written by Stage 1, read by Stage 2
    stage2-to-stage3.json      ← written by Stage 2, read by Stage 3
    stage3-to-stage4.json      ← written by Stage 3, read by Stage 4
    stage4-final-result.json   ← written by Stage 4, read by orchestrator
```

**Message format between stages:**

```json
// stage1-to-stage2.json
{
  "pipeline_run_id": "run-2026-06-05-001",
  "from_stage": "requirements-analyst",
  "to_stage": "implementor",
  "timestamp": "2026-06-05T10:23:41Z",
  "status": "complete",
  "payload": {
    "requirements_file": "~/.claude/agent-teams/pipeline-team-001/artifacts/requirements.md",
    "scope": "Auth middleware JWT validation",
    "acceptance_criteria": [
      "All requests to /api/* must include a valid JWT",
      "Expired tokens must return 401 with message 'token expired'",
      "Missing tokens must return 401 with message 'authorization required'",
      "Token validation must not add more than 5ms p99 latency"
    ],
    "out_of_scope": [
      "Token issuance (handled by auth service)",
      "Role-based access control (separate ticket)"
    ]
  }
}
```

**Stage CLAUDE.md template (parameterized per stage):**

```markdown
# CLAUDE.md — Pipeline Stage: Implementor

You are Stage 2 of the development pipeline.

## Trigger

Wait for the file: ~/.claude/agent-teams/pipeline-team-001/mailbox/stage1-to-stage2.json
Check every turn by reading that path. When the file exists and contains
`"status": "complete"`, begin your work.

## Your Work

Read the requirements from the `requirements_file` path in the message payload.
Implement all acceptance criteria as working code.
Write your implementation in: src/middleware/auth.go

## Completion Protocol

When done, write the following file:
~/.claude/agent-teams/pipeline-team-001/mailbox/stage2-to-stage3.json

```json
{
  "pipeline_run_id": "<same run_id>",
  "from_stage": "implementor",
  "to_stage": "reviewer",
  "timestamp": "<current ISO timestamp>",
  "status": "complete",
  "payload": {
    "files_written": ["src/middleware/auth.go"],
    "test_command": "go test ./middleware/...",
    "notes": "<any implementation decisions or open questions>"
  }
}
```

## Error Protocol

If you cannot complete the task, write:
~/.claude/agent-teams/pipeline-team-001/mailbox/stage2-error.json

```json
{
  "pipeline_run_id": "<run_id>",
  "from_stage": "implementor",
  "status": "failed",
  "error": "<description of what went wrong>"
}
```
```

---

### The Peer Review Pattern

The peer review pattern uses exactly two agents: a **writer** agent and a **reviewer** agent. The writer produces output; the reviewer critiques it. If they disagree, a configurable **resolution protocol** determines the outcome.

```
     User Task
          │
          ▼
   ┌─────────────────┐
   │     WRITER      │ ─────────────────────┐
   │  (Produces      │                      │
   │   initial code) │                      ▼
   └─────────────────┘              ┌─────────────────┐
          ▲                         │    REVIEWER     │
          │ revision                │  (Critiques,    │
          │ request                 │   approves, or  │
          │                        │   requests edits)│
          └────────────────────────┘
                    │
                    │ approved
                    ▼
              Final Output
```

**Writer CLAUDE.md:**

```markdown
# CLAUDE.md — Writer Agent (Peer Review Pattern)

You are the writer in a two-agent peer review system.

## Workflow

### Round 1 (Initial Writing)
1. Read the task from the mailbox
2. Implement the requested code
3. Send to reviewer via mailbox with `"type": "review_request"`

### Rounds 2+ (Revision)
If the reviewer sends `"verdict": "changes_requested"`:
1. Read the reviewer's specific issues from the `issues` field
2. Address each issue in your code
3. Send updated code to reviewer again
4. Maximum revisions: 3. After 3 failed rounds, escalate to user.

### When Approved
When reviewer sends `"verdict": "approved"`:
1. Write the final accepted code to the correct file path
2. Notify the orchestrator or user that the task is complete

## Quality Bar
Produce high-quality code on the first attempt. Aim for reviewer approval
in round 1. Common reviewer requests:
- Add error handling you forgot
- Add docstrings
- Extract overly long functions
- Remove code duplication
```

**Reviewer CLAUDE.md:**

```markdown
# CLAUDE.md — Reviewer Agent (Peer Review Pattern)

You are the reviewer in a two-agent peer review system.

## Workflow

When you receive a `"type": "review_request"` message:
1. Read the code from the `code` or `file_path` field
2. Review it against the acceptance criteria in the original task
3. Send verdict:

### Verdict: approved
```json
{
  "type": "review_verdict",
  "verdict": "approved",
  "comments": "Optional positive feedback"
}
```

### Verdict: changes_requested
```json
{
  "type": "review_verdict",
  "verdict": "changes_requested",
  "issues": [
    {
      "severity": "major",
      "location": "line 42",
      "issue": "Missing nil check before dereferencing",
      "suggestion": "Add: if user == nil { return ErrUserNotFound }"
    }
  ]
}
```

## Conflict Resolution Protocol

If the writer has revised the code 3 times and you still cannot approve:
1. Document the specific unresolvable issue
2. Send `"verdict": "escalate"` to the orchestrator mailbox
3. Include both your concern and the writer's counterargument

The orchestrator will make the final call or involve the human user.

## Review Standards

Approve if:
- All acceptance criteria are met
- No critical or major security issues
- Code follows project conventions
- Error paths are handled
```

---

### Agent Teams with External Services

Agent Teams can interact with external services through MCP servers configured at the user or project level. Because each agent in a team inherits the MCP server configuration of the session, all agents share access to the same MCP tools.

**Shared MCP architecture for Agent Teams:**

```
~/.claude/.mcp.json (user level — shared across all agents)
  ├── github MCP server       → mcp__github__* tools available to ALL agents
  ├── slack MCP server        → mcp__slack__* tools available to ALL agents
  └── database MCP server     → mcp__db__* tools available to ALL agents

.claude/settings.json (project level — shared via git)
  └── project-api MCP server  → mcp__project_api__* tools available to ALL agents
```

**Webhook integration pattern (agent sends results to Slack):**

```markdown
# CLAUDE.md — Notifier Agent

You are the notifier agent. After the code-writer and test-generator complete,
receive their results via mailbox and post a summary to Slack.

## Tools Available

You have access to:
- mcp__slack__post_message — post to Slack channels
- mcp__github__add_issue_comment — comment on GitHub issues

## Notification Flow

1. Wait for completion messages from code-writer and test-generator
2. Compile a summary of:
   - Files changed
   - Tests added/modified
   - Test pass/fail status
3. Post to #engineering-updates channel:
   mcp__slack__post_message({
     channel: "#engineering-updates",
     text: "<summary>"
   })
4. If tests failed, also comment on the relevant GitHub issue
```

**API call pattern (agent fetches external data before implementing):**

```markdown
# CLAUDE.md — API-Aware Implementor

Before implementing any endpoint changes, fetch the current OpenAPI spec
from the API gateway:

1. Use mcp__project_api__get_spec to fetch the current spec
2. Use mcp__project_api__validate_schema to validate your proposed changes
3. Implement only after validation passes

Never modify an endpoint contract without first validating against the spec.
```

**Rate limiting and quota management:**

When multiple agents share an MCP server with API rate limits, add coordination via the mailbox to prevent quota exhaustion:

```markdown
# CLAUDE.md — Rate-Limited Agent

Before making more than 3 API calls in a turn, send a rate-limit check message:

```json
{
  "type": "rate_limit_check",
  "from": "your-agent-id",
  "service": "github",
  "planned_calls": 5
}
```

Wait for acknowledgment from the rate-limit coordinator before proceeding.
If you do not receive an ack within 2 turns, proceed with conservative rate
limiting (1 call per turn).
```

---

### Debugging Agent Teams

When Agent Teams behave unexpectedly — tasks not progressing, agents stuck, messages not flowing — use the following systematic debugging approach.

#### Step 1: Check Basic Team Health

```bash
# In the Claude Code session running the orchestrator
/debug agents

# Expected healthy output:
Team: feature-rollout-001 (created 14 minutes ago)
  orchestrator     ACTIVE    — 12 messages sent, 8 received
  code-writer      WAITING   — 4 messages sent, 4 received (waiting for task)
  code-reviewer    ACTIVE    — 3 messages sent, 3 received
  test-generator   WAITING   — 2 messages sent, 2 received

# Unhealthy pattern: all agents in WAITING with no progress
Team: stuck-team-001 (created 47 minutes ago)
  orchestrator     WAITING   — 2 messages sent, 2 received  ← possible deadlock
  writer           WAITING   — 2 messages sent, 2 received  ← possible deadlock
```

#### Step 2: Inspect the Mailbox Directly

The mailbox is a filesystem directory. You can inspect it directly in any shell:

```bash
# Find your team's mailbox
ls ~/.claude/agent-teams/

# Inspect messages in the mailbox
ls -la ~/.claude/agent-teams/<team-id>/mailbox/

# Read recent messages (most recent files)
ls -t ~/.claude/agent-teams/<team-id>/mailbox/*.json | head -5 | xargs -I {} sh -c 'echo "=== {} ===" && cat {}'

# Check message timestamps to identify stale messages
find ~/.claude/agent-teams/<team-id>/mailbox/ -name "*.json" -older-than 30m
```

#### Step 3: Trace Inter-Agent Communication

Enable verbose mailbox logging in settings:

```json
// .claude/settings.json
{
  "agentTeams": {
    "debugLogging": true,
    "logMailboxPath": "/tmp/claude-agent-mailbox.log"
  }
}
```

With debug logging enabled, every mailbox read and write is logged:

```
2026-06-05T10:23:41Z [orchestrator] WRITE mailbox/task-001.json (412 bytes)
2026-06-05T10:23:41Z [code-writer]  READ  mailbox/task-001.json (found, processing)
2026-06-05T10:23:55Z [code-writer]  WRITE mailbox/result-001.json (834 bytes)
2026-06-05T10:23:55Z [orchestrator] READ  mailbox/result-001.json (found, processing)
```

A stalled trace would look like:

```
2026-06-05T10:23:41Z [orchestrator] WRITE mailbox/task-001.json (412 bytes)
2026-06-05T10:23:41Z [code-writer]  READ  mailbox/task-001.json (found, processing)
# — nothing after this for 15+ minutes — code-writer is stuck
```

#### Step 4: Identify Deadlocked Agents

A deadlock occurs when two (or more) agents are each waiting for a message from the other. Signs:

- All agents in `WAITING` state
- No new messages being written to mailbox
- `/debug agents` shows message counts stopped incrementing

**Resolution:**

```bash
# Terminate the deadlocked team
/agents terminate

# Redesign the workflow to break the circular dependency
# Common fixes:
# 1. Introduce a timeout: agent sends a "deadline exceeded" message after N turns
# 2. Use the orchestrator as the single coordinator (agents only message orchestrator)
# 3. Add an explicit "ready" protocol where each agent signals readiness before expecting input
```

#### Step 5: Recover from a Failed Agent

When one agent in a team fails (crashes, hits token limit, gets a tool permission error):

```bash
# Identify the failed agent
/debug agents
# Look for: agent-id  FAILED  — reason: context window exceeded

# Restart just that agent (preserves other agents' state)
/agents restart code-writer

# The restarted agent re-reads its CLAUDE.md and resumes from mailbox state
# It will see any pending messages it had not processed
```

**If an agent fails repeatedly:**

1. Check the agent's CLAUDE.md — it may be asking the agent to do too much in a single task
2. Check the agent's token budget — reduce the scope of tasks sent to it
3. Check tool permissions — the agent may be hitting a denied tool

```bash
# View the last error from a failed agent
cat ~/.claude/agent-teams/<team-id>/agents/<agent-id>/last-error.txt
```

#### Step 6: Mailbox Overflow Recovery

When the mailbox fills up (default max: 200 messages per team), new messages are dropped and agents report "mailbox full" errors:

```bash
# Check current mailbox size
ls ~/.claude/agent-teams/<team-id>/mailbox/ | wc -l

# Clear processed messages (messages with status: complete or processed: true)
/agents clear-mailbox --processed-only

# If that does not free enough space, clear all non-active messages
/agents clear-mailbox --all

# Increase the limit in .claude/settings.json:
# "agentTeams": { "maxMailboxSize": 500 }
```

---

### Agent Teams Performance Tuning

#### Choosing the Right Model Per Agent

Not all agents in a team need the same model. Matching model capability to task complexity significantly reduces cost without sacrificing quality.

| Agent Role | Recommended Model | Reasoning |
|------------|------------------|-----------|
| Orchestrator / Planner | Claude Opus 4.8 | Needs strong reasoning to decompose complex tasks |
| Code Writer (complex logic) | Claude Sonnet 4.6 | Good code generation at lower cost than Opus |
| Code Writer (simple changes) | Claude Haiku 4.5 | Straightforward edits do not need Sonnet |
| Reviewer (security-critical) | Claude Opus 4.8 | Security review benefits from highest capability |
| Reviewer (style/formatting) | Claude Haiku 4.5 | Style checks are mechanical |
| Test Generator | Claude Sonnet 4.6 | Test writing needs good code understanding |
| Notifier / Formatter | Claude Haiku 4.5 | Simple formatting tasks |
| Documentation Writer | Claude Sonnet 4.6 | Documentation needs clear writing ability |

**Cost comparison: uniform Opus vs mixed model team (same workflow):**

```
Uniform Opus 4.8 team (3 agents, 50 turns each):
  Total input:   ~300K tokens × $15/MTok  = $4.50
  Total output:  ~30K tokens  × $75/MTok  = $2.25
  Total cost:    ~$6.75

Mixed model team (same workflow):
  Orchestrator (Opus): 50 turns
    Input: ~100K tokens × $15/MTok = $1.50
    Output: ~10K tokens × $75/MTok = $0.75
  Code Writer (Sonnet): 50 turns
    Input: ~100K tokens × $3/MTok  = $0.30
    Output: ~10K tokens × $15/MTok = $0.15
  Reviewer (Haiku): 50 turns
    Input: ~100K tokens × $0.80/MTok = $0.08
    Output: ~10K tokens × $4/MTok   = $0.04
  Total cost: ~$2.82  (58% cheaper than uniform Opus)
```

#### Effort Level Configuration Per Agent

The `effort` level (`minimal`, `low`, `normal`, `high`, `max`) controls how thoroughly an agent reasons before responding. Higher effort means more deliberate thinking and fewer mistakes, but uses more tokens per turn.

```yaml
# agent-teams.yaml — per-agent effort levels
teams:
  development:
    orchestrator:
      effort: high      # Orchestrator needs careful planning
    spokes:
      - agent_id: code-writer
        effort: normal  # Normal effort for implementation
      - agent_id: code-reviewer
        effort: high    # Reviewer should be thorough
      - agent_id: formatter
        effort: minimal # Simple formatting needs no deep thinking
```

#### Parallel vs Serial Coordination

Design agent workflows to maximize parallelism. Sequential bottlenecks multiply latency; parallel tasks overlap.

```
SLOW — Serial coordination (total latency = sum of all stages):

User → [Requirements: 5min] → [Implementation: 10min] → [Review: 5min] → [Tests: 8min] → Done
Total: 28 minutes

FAST — Parallel coordination (total latency = longest critical path):

User → [Requirements: 5min] ──┬──→ [Implementation: 10min] ──→ [Integration: 3min] → Done
                               └──→ [Test Templates: 6min]  ──┘
Total: 18 minutes (35% faster)
```

**How to identify parallel opportunities:**
- Tasks that do not depend on each other's output can always run in parallel
- Reading-only tasks (analysis, review of existing code) can often run in parallel with writing tasks
- Multiple agents reviewing different files can always run in parallel

#### Token Budget Allocation Across Teams

Each agent in a team has its own independent context window. Token budgets are not shared between agents — one agent exhausting its context does not affect others.

However, you can set per-agent `contextBudget` in settings to prevent runaway agents from consuming excessive API budget:

```json
// .claude/settings.json
{
  "agentTeams": {
    "perAgentContextBudget": {
      "maxTokens": 80000,
      "hardLimit": true,
      "warnAt": 60000
    }
  }
}
```

With `hardLimit: true`, an agent that reaches its token budget stops and sends a `"status": "budget_exceeded"` message to the orchestrator rather than auto-compacting and continuing. This gives you explicit control over cost.

**Budget allocation strategy by agent type:**

| Agent Type | Suggested `maxTokens` | Reasoning |
|------------|----------------------|-----------|
| Orchestrator | 150,000 | Needs room to accumulate all agent results |
| Code Writer (large feature) | 100,000 | Complex implementation may require many reads |
| Code Writer (small task) | 40,000 | Small tasks should not need large windows |
| Reviewer | 60,000 | Review needs to read files + conversation |
| Test Generator | 60,000 | Similar to reviewer requirements |
| Notifier/Formatter | 15,000 | Simple tasks need minimal context |

#### Monitoring Team Progress

Use the `/debug agents` command periodically during long-running team workflows. Key metrics to watch:

```
/debug agents --verbose

Team: development-001 (created 23 minutes ago)
  orchestrator  ACTIVE   — 28 msgs sent, 26 received — last active: 12s ago
                         context: 67,234 / 200,000 tokens (33.6%)
  code-writer   WAITING  — 14 msgs sent, 14 received — last active: 45s ago
                         context: 88,441 / 80,000 tokens [!!! NEAR BUDGET LIMIT]
  code-reviewer ACTIVE   — 12 msgs sent, 10 received — last active: 8s ago
                         context: 42,114 / 60,000 tokens (70.2%)
```

If `code-writer` is near its budget limit, the orchestrator should send a `"compact"` instruction via the mailbox before the next large task, prompting the agent to run `/compact` to free context window space.
