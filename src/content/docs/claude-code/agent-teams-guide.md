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
lastUpdated: 2026-05-17
---

# Agent Teams & Subagents — Complete Guide

> **Version:** v2.1.126 (May 17, 2026) · Agent Teams: Research Preview (enable via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`)

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
  TASK LIFECYCLE
  ══════════════════════════════════════════════════════════════════

  TaskCreate({title, description, assignee?})
          │
          ▼
       ┌────────┐
       │pending │  ← task created, waiting to be claimed
       └────┬───┘
            │ agent calls TaskUpdate(status: "in_progress")
            │ (uses file locking to prevent double-claiming)
            ▼
      ┌───────────┐
      │in_progress│  ← agent actively working on this task
      └─────┬─────┘
            │
      ┌─────┴──────────────────────────┐
      │                                │
      ▼                                ▼
  ┌─────────┐                     ┌────────┐
  │completed│                     │ failed │
  └─────────┘                     └────────┘
  TaskUpdate(                     TaskUpdate(
    status: "completed",            status: "failed",
    result: "...")                  error: "...")

  CLAIM PROTOCOL (prevent double-claiming):
  1. Agent reads TaskList — finds task in "pending" state
  2. Agent writes TaskUpdate with file lock (flock / atomic rename)
  3. If lock succeeds: agent owns task
  4. If lock fails: another agent claimed it first; skip and look for next
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

## Related Guides

- [CLI Technical Reference](./claude-code-reference) — Section 10: Subagents & Agent Teams
- [Hooks System](./hooks-deep-dive) — SubagentStop and TaskCompleted hooks
- [MCP Servers Guide](./mcp-servers-guide) — tools available to agents
- [CI/CD Integration](./cicd-integration) — agents in pipelines
