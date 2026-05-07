---
title: Git Worktrees — Parallel Development with Claude Code
description: >
  Complete guide to using Git worktrees with Claude Code — how the /branch command works,
  running multiple independent Claude Code instances simultaneously, parallel feature
  development workflows, branch synchronisation strategies, filesystem mailbox coordination,
  and production patterns for teams. Covers Claude Code v2.1.126 (May 2026).
sidebar:
  order: 11
  label: Worktrees & Parallel Dev
lastUpdated: 2026-05-07
---

# Git Worktrees — Parallel Development with Claude Code

> **Version:** v2.1.126 (May 7, 2026) · Worktree support introduced in v2.1.x

Git worktrees allow a single repository to have **multiple checked-out branches simultaneously** — each in its own directory on disk. Claude Code integrates natively with worktrees via the `/branch` slash command, enabling you to run independent Claude Code sessions on different branches at the same time.

**What this enables:**
- Work on feature A while Claude works on feature B — simultaneously
- Run parallel code reviews on multiple PRs without context-switching
- Test a refactoring in isolation while keeping `main` clean
- Run CI-style tasks in a worktree without touching your working copy
- Let multiple Agent Teams work on different parts of a codebase in parallel

---

## 1. Understanding Git Worktrees

A Git **worktree** is a separate checkout of a repository linked to the same `.git` database. Unlike cloning, worktrees:
- Share commit history, objects, and refs with the main repo
- Can only have one branch checked out per worktree
- Are lightweight — no full copy of `.git/`

### How worktrees appear on disk

```
your-project/           ← main worktree (your primary working directory)
├── .git/               ← shared git database
├── src/
├── ...

.worktrees/             ← Claude Code stores worktrees here by default
└── feature-auth/       ← worktree for the feature-auth branch
    ├── .git            ← file (not directory) pointing to main .git/worktrees/
    ├── src/
    └── ...
```

---

## 2. The `/branch` Command

`/branch` creates a Git worktree and opens a new Claude Code session in it. The current session continues running.

### Basic usage

```
/branch feature/new-auth-system
```

This:
1. Creates a new git branch `feature/new-auth-system` from the current HEAD
2. Creates a worktree at `.worktrees/feature-new-auth-system/`
3. Opens a new terminal window (or tab) with a Claude Code session rooted at the worktree
4. Both the original session and the new session run independently

### Flags and options

```
/branch feature/payment-refactor          # create from current HEAD
/branch fix/login-bug --from main         # create from specific branch
/branch experiment/new-api --from v2.1.0  # create from a tag
/branch --list                            # list all active worktrees
/branch --clean                           # remove merged worktrees
```

### Manual worktree creation (without /branch)

```bash
# Create a worktree for an existing remote branch
git worktree add .worktrees/feature-auth origin/feature/auth-refactor

# Create a new branch + worktree in one command
git worktree add -b feature/new-endpoint .worktrees/new-endpoint main

# List all worktrees
git worktree list

# Remove a worktree when done
git worktree remove .worktrees/feature-auth
git worktree prune   # clean up stale metadata
```

---

## 3. Running Multiple Claude Code Instances

When you use `/branch`, each worktree gets its own Claude Code session. Here's what's isolated vs shared:

| Resource | Per Worktree | Shared |
|----------|-------------|--------|
| Checked-out files | ✓ | — |
| Git branch / working tree | ✓ | — |
| Claude conversation context | ✓ | — |
| Session-local settings | ✓ | — |
| CLAUDE.md (project root) | ✓ (reads its own copy) | — |
| `.claude/settings.json` | — | ✓ (same file) |
| `~/.claude/settings.json` | — | ✓ |
| MCP servers | — | ✓ (shared config) |
| Hooks | — | ✓ (snapshotted at each session start) |
| Git objects / refs | — | ✓ (single `.git/` database) |

**Practical implication:** Both sessions can read and write different files, run tests, and make commits without interfering — because they're on different branches with different file states.

---

## 4. Parallel Development Patterns

### Pattern 1: Feature + Bug Fix in Parallel

Open two terminals. In terminal 1, your main session:
```
> Working on feature/payment-gateway branch
/branch fix/critical-login-bug
```

A new terminal opens with Claude in `.worktrees/fix-critical-login-bug/`. In that terminal:
```
> Find and fix the login bug reported in issue #847. Run tests.
```

Meanwhile, in the original terminal you continue on the payment feature. Both sessions work simultaneously.

### Pattern 2: PR Review Workflow

Review multiple PRs without checking them out into your working copy:

```bash
# From a script or manual setup
git worktree add .worktrees/pr-123 origin/feature/add-export-api
git worktree add .worktrees/pr-124 origin/fix/null-pointer-in-billing
git worktree add .worktrees/pr-125 origin/refactor/database-layer

# Start Claude Code sessions in each worktree
claude -C .worktrees/pr-123 --print "Review this PR for security, quality, and test coverage."
claude -C .worktrees/pr-124 --print "Review this PR for security, quality, and test coverage."
claude -C .worktrees/pr-125 --print "Review this PR for security, quality, and test coverage."
```

This runs all three reviews in parallel. Each review sees only its branch's code.

### Pattern 3: SDK-Driven Parallel Worktree Sessions

```python
import asyncio
import subprocess
from pathlib import Path
from anthropic.claude_code import StatefulClient

async def review_branch(branch: str, repo_path: str) -> dict:
    """Check out a branch in a worktree and review it."""
    worktree_path = Path(repo_path) / ".worktrees" / branch.replace("/", "-")
    
    # Create the worktree
    subprocess.run(
        ["git", "worktree", "add", str(worktree_path), f"origin/{branch}"],
        cwd=repo_path, check=True, capture_output=True
    )
    
    try:
        async with StatefulClient(
            cwd=str(worktree_path),
            permission_mode="acceptEdits",
            model="claude-sonnet-4-6",
            max_budget_usd=0.50,
        ) as client:
            summary = await client.query("Summarise the changes in this branch vs main.")
            review = await client.query(
                "Review for: (1) security issues, (2) breaking changes, "
                "(3) missing tests. Rate: APPROVE / REQUEST_CHANGES / COMMENT."
            )
        
        return {
            "branch": branch,
            "summary": summary.output_text,
            "review": review.output_text,
        }
    
    finally:
        # Clean up the worktree
        subprocess.run(["git", "worktree", "remove", str(worktree_path)], cwd=repo_path)

async def review_all_prs(branches: list[str], repo_path: str):
    """Review all open PRs in parallel."""
    results = await asyncio.gather(*[review_branch(b, repo_path) for b in branches])
    for r in results:
        print(f"\n=== {r['branch']} ===")
        print(r['review'])

# Usage
asyncio.run(review_all_prs(
    branches=["feature/auth", "fix/billing", "refactor/db-layer"],
    repo_path="/path/to/repo"
))
```

### Pattern 4: Experiment Safely

Run risky experiments in a worktree without risking your main working copy:

```bash
# Create an experimental worktree
git worktree add .worktrees/experiment-new-db-layer -b experiment/postgres-migration main

# Open Claude Code in it
claude -C .worktrees/experiment-new-db-layer
```

In the session:
```
> Migrate all SQLite queries to PostgreSQL. This is an experiment — 
  make extensive changes without worrying about breaking things.
  Run all tests at the end and show me the results.
```

If the experiment works, you cherry-pick or merge. If it doesn't, you delete the worktree:
```bash
git worktree remove .worktrees/experiment-new-db-layer
# No harm done to main working copy
```

### Pattern 5: Team Coordination via Filesystem Mailbox

When using Agent Teams, multiple agents can coordinate via a filesystem mailbox in a shared worktree:

```
~/.claude/teams/feature-team/
├── inbox/
│   ├── 01-design-complete.json        ← orchestrator → worker
│   └── 02-tests-written.json          ← tester → reviewer
├── outbox/
│   └── 01-implementation-ready.json   ← worker → orchestrator
└── state.json                         ← shared team state
```

Each agent works in its own terminal/session but coordinates by reading and writing to this shared mailbox directory. The filesystem is the communication channel.

---

## 5. Worktree Settings and Config

### CLAUDE.md in worktrees

Each worktree has its own copy of the project files, including `CLAUDE.md`. All worktrees for the same project will see the same `CLAUDE.md` content (assuming it's committed to the branch).

To add worktree-specific context, create a `CLAUDE.local.md` in the worktree (auto-gitignored):

```markdown
# CLAUDE.local.md — worktree context
This worktree is for the payment gateway refactoring experiment.
Key constraint: must maintain backwards compatibility with v1 API.
Test with: make test-payment-only
```

### `.claude/settings.json` in worktrees

Worktrees share the project's `.claude/settings.json` (same file, same path). To have worktree-specific settings, use `.claude/settings.local.json` (gitignored):

```json
{
  "defaultPermissionMode": "autoAccept",
  "model": "claude-opus-4-7",
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{"type": "command", "command": "make test-fast"}]
    }]
  }
}
```

### Restricting tool access per worktree

A common pattern for experimental worktrees is more permissive settings, while production worktrees stay locked down:

```json
// .worktrees/experiment-*/.claude/settings.local.json
{
  "defaultPermissionMode": "bypassPermissions",
  "permissions": {
    "allow": ["Bash(*)", "Edit(*)", "Write(*)"]
  }
}
```

---

## 6. Syncing and Merging

### Merge worktree changes back

```bash
# Review what changed in the worktree
git -C .worktrees/feature-auth diff main

# Merge or rebase
git checkout main
git merge feature/auth-refactor

# Or create a PR
gh pr create --head feature/auth-refactor
```

### Cherry-pick specific commits

```bash
git cherry-pick <commit-hash>
```

### Keep worktree in sync with main

```bash
# Inside the worktree
git rebase main

# Or merge
git merge main
```

---

## 7. Managing Worktrees

### List all worktrees

```bash
git worktree list
```

Output:
```
/path/to/project           abc1234 [main]
/path/to/project/.worktrees/feature-auth  def5678 [feature/auth-refactor]
/path/to/project/.worktrees/fix-bug      ghi9012 [fix/login-bug]
```

### Remove a worktree

```bash
# Remove cleanly (worktree must have no uncommitted changes)
git worktree remove .worktrees/feature-auth

# Force remove (discards uncommitted changes)
git worktree remove --force .worktrees/feature-auth

# Prune stale worktree metadata (after manual deletion)
git worktree prune
```

### Claude Code's `/branch --clean` command

```
/branch --clean   # remove all merged worktrees (safe — only deletes merged branches)
/branch --list    # show all active worktrees with their Claude sessions
```

---

## 8. Worktrees in CI/CD

### GitHub Actions — parallel branch tasks

```yaml
# .github/workflows/parallel-review.yml
name: Parallel Claude Code Review
on: [pull_request]

jobs:
  security-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          claude_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Review for security vulnerabilities only. Output PASS or ISSUES: <list>."
          permission_mode: bypassPermissions

  quality-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          claude_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: "Review for code quality, test coverage, and documentation. Output PASS or ISSUES: <list>."
          permission_mode: bypassPermissions
```

Each job runs on its own checkout (analogous to a worktree) in parallel.

---

## 9. Troubleshooting

| Problem | Solution |
|---------|---------|
| `fatal: 'feature/foo' is already checked out` | Each branch can only be in one worktree at a time. Remove the existing worktree first. |
| Worktree stuck after force delete | Run `git worktree prune` to clean up stale metadata |
| `.claude/settings.local.json` not loading | Must be in the worktree root, not the main repo root |
| CLAUDE.md changes not visible in worktree | Commit `CLAUDE.md` first — worktrees share the git database |
| Hooks not firing in worktree session | Hooks are snapshotted at session start from `~/.claude/settings.json` — restart if changed |
| Can't push from worktree | Set upstream: `git push -u origin feature/branch-name` |

---

## 10. Quick Reference

```bash
# Create a worktree for a new branch
git worktree add .worktrees/feature-x -b feature/x main

# Create a worktree for an existing branch
git worktree add .worktrees/feature-x origin/feature/x

# Start Claude Code in a worktree
claude -C .worktrees/feature-x

# Or from inside a session
/branch feature/x

# List worktrees
git worktree list

# Remove a worktree
git worktree remove .worktrees/feature-x

# Clean up merged worktrees (Claude Code)
/branch --clean
```

---

## 11. Next Steps

| If you want to… | Go to |
|----------------|-------|
| Automate worktree operations | [Agent SDK Guide](./sdk-guide) |
| Coordinate multiple agents | [Agent Teams Guide](./agent-teams-guide) |
| CI/CD parallel workflows | [CI/CD Integration](./cicd-integration) |
| Understand session isolation | [Permissions & Security](./permissions-security) |
