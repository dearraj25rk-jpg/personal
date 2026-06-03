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
lastUpdated: 2026-06-03
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

### Worktree vs Clone — Visual Comparison

```
  GIT CLONE (old approach)              GIT WORKTREE (correct approach)
  ════════════════════════              ═══════════════════════════════

  my-project/                           my-project/
  ├── .git/          ← full git DB      ├── .git/          ← shared git DB
  │   ├── objects/   (~50 MB)          │   ├── objects/   (single copy)
  │   ├── refs/                        │   ├── refs/
  │   └── config                       │   ├── worktrees/
  ├── src/                             │   │   ├── feature-auth/
  └── tests/                           │   │   └── fix-billing/
                                        ├── src/
  my-project-clone/                     └── tests/
  ├── .git/          ← FULL COPY again
  │   ├── objects/   (~50 MB again)    .worktrees/
  │   ├── refs/      (duplicate)       ├── feature-auth/
  │   └── config                       │   ├── .git    ← file (pointer, not dir)
  ├── src/                             │   ├── src/
  └── tests/                           │   └── tests/
                                        └── fix-billing/
  Problems with clone:                     ├── .git    ← file (pointer)
  • Doubles disk usage                     ├── src/
  • Two separate git histories             └── tests/
  • Push/pull confusion
  • MCP/settings not shared              Worktree advantages:
  • CLAUDE.md inconsistency              • Single .git/objects/ database
                                          • Shared commit history + refs
                                          • ~1KB .git file per worktree
                                          • Shared .claude/settings.json
                                          • CLAUDE.md synced via git
```

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

### Parallel PR Review Pattern

Review multiple PRs simultaneously using worktrees:

```bash
# Create worktrees for each PR
git fetch origin pull/123/head:pr-123
git fetch origin pull/124/head:pr-124

# Open Claude Code in each worktree
cd /path/to/repo
claude /branch pr-review-123 --from origin/pull/123/head

# In a second terminal
claude /branch pr-review-124 --from origin/pull/124/head
```

Or use the SDK to automate parallel reviews:

```python
import asyncio
import anthropic

async def review_pr(pr_number: int, worktree_path: str):
    client = anthropic.AsyncAnthropic()
    async with client.beta.claude_code.sessions.stream(
        cwd=worktree_path,
        max_turns=5,
        initial_message=f"Review PR #{pr_number}: check for bugs, security issues, and style",
    ) as stream:
        async for event in stream:
            if event.type == "result" and event.subtype == "success":
                return event

async def main():
    # Run 3 PR reviews in parallel
    results = await asyncio.gather(
        review_pr(123, "/tmp/worktrees/pr-123"),
        review_pr(124, "/tmp/worktrees/pr-124"),
        review_pr(125, "/tmp/worktrees/pr-125"),
    )
    for i, result in enumerate(results):
        print(f"PR {123+i}: ${result.total_cost_usd:.4f}")

asyncio.run(main())
```

### Coordination Patterns

| Pattern | How | When to use |
|---------|-----|------------|
| Shared CLAUDE.md | Root project CLAUDE.md applies to all worktrees | Shared conventions |
| Isolated local config | Each worktree has own CLAUDE.local.md | Per-branch overrides |
| Shared memory | MEMORY.md is per-project, shared across worktrees | Consistent project state |
| Isolated MCP servers | Each Claude Code session has own connections | No coordination needed |

### Pattern 3: Team Coordination Patterns Using Worktrees

When multiple developers (or agents) work on different features simultaneously, worktrees provide clean isolation:

```
  TEAM COORDINATION WITH WORKTREES
  ══════════════════════════════════════════════════════════════════

  SHARED REPOSITORY (single .git)

  Developer Alice                    Developer Bob
  (main worktree)                    (worktree: feature/auth)
  ───────────────                    ──────────────────────────
  my-project/                        my-project/.worktrees/feature-auth/
  ├── .git/  (shared)  ←────────────► .git  (points to shared)
  ├── src/   (main branch)           ├── src/  (feature/auth branch)
  └── tests/                         └── tests/

  Alice's Claude session:            Bob's Claude session:
  - Works on main branch             - Works on feature/auth branch
  - git commits go to main           - git commits go to feature/auth
  - Can fetch Bob's commits          - Can see Alice's main commits
  - No file conflicts                - No file conflicts

  COORDINATION MECHANISMS:
  1. git fetch origin               → both see each other's pushed commits
  2. git rebase main                → Bob keeps feature up to date
  3. CLAUDE.local.md                → each worktree has private context
  4. .claude/settings.local.json    → worktree-specific settings
  5. Agent Teams mailbox            → agents communicate if needed

  WHEN TO USE WORKTREES FOR TEAM COORDINATION:
  • Long-running feature branches (> 1 day)
  • Parallel agent reviews of same PR from different angles
  • Experiment branches alongside production work
  • Multiple agent specialists on different areas of codebase
```

### Pattern 4: SDK-Driven Automated Worktree Management

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

### Advanced SDK Pattern — Full Automated Worktree Lifecycle Manager

```python
#!/usr/bin/env python3
"""
Automated multi-PR review system using worktrees.
Fetches open PRs from GitHub, creates worktrees, reviews each in parallel,
posts review comments, and cleans up.
"""
import asyncio
import subprocess
import json
from pathlib import Path
from typing import Optional
from anthropic.claude_code import StatefulClient

REPO_PATH = Path("/path/to/my-project")
WORKTREES_DIR = REPO_PATH / ".worktrees"

class WorktreeManager:
    """Context manager for safe worktree creation and cleanup."""

    def __init__(self, branch: str, base_path: Path = REPO_PATH):
        self.branch = branch
        self.base_path = base_path
        self.worktree_path = WORKTREES_DIR / branch.replace("/", "-")

    def __enter__(self):
        self.worktree_path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(
            ["git", "worktree", "add",
             str(self.worktree_path), f"origin/{self.branch}"],
            cwd=self.base_path, check=True, capture_output=True
        )
        return self.worktree_path

    def __exit__(self, *args):
        subprocess.run(
            ["git", "worktree", "remove", "--force", str(self.worktree_path)],
            cwd=self.base_path, capture_output=True
        )

async def review_pr_worktree(branch: str, pr_number: int) -> dict:
    """Full automated review of a single PR branch."""
    with WorktreeManager(branch) as wt_path:
        async with StatefulClient(
            cwd=str(wt_path),
            permission_mode="bypassPermissions",
            model="claude-sonnet-4-6",
            max_turns=20,
            max_budget_usd=0.50,
        ) as client:
            # Step 1: understand the change
            context = await client.query(
                f"This is PR #{pr_number} on branch {branch}. "
                "Run: git diff main --stat to see what changed. "
                "Then read the key changed files."
            )

            # Step 2: security review
            security = await client.query(
                "Review all changed files for security issues. "
                "Check: SQL injection, auth bypass, secrets in code, "
                "input validation, OWASP Top 10. "
                "Output: PASS or SECURITY_ISSUES: <list>"
            )

            # Step 3: quality review
            quality = await client.query(
                "Review changed files for code quality. "
                "Check: test coverage, error handling, documentation, "
                "code duplication, SOLID principles. "
                "Output: PASS or QUALITY_ISSUES: <list>"
            )

            # Step 4: final verdict
            verdict = await client.query(
                "Based on your security and quality reviews, "
                "give a final recommendation: APPROVE, REQUEST_CHANGES, or COMMENT. "
                "Summarize in 3 bullet points."
            )

            return {
                "pr_number": pr_number,
                "branch": branch,
                "security": security.output_text,
                "quality": quality.output_text,
                "verdict": verdict.output_text,
                "total_cost_usd": client.total_cost_usd,
            }

async def review_all_open_prs(pr_list: list[dict]) -> list[dict]:
    """Review all open PRs with concurrency limit."""
    semaphore = asyncio.Semaphore(3)  # max 3 concurrent worktrees

    async def bounded_review(pr):
        async with semaphore:
            return await review_pr_worktree(pr["branch"], pr["number"])

    return await asyncio.gather(*[bounded_review(pr) for pr in pr_list])

if __name__ == "__main__":
    prs = [
        {"number": 101, "branch": "feature/auth-refactor"},
        {"number": 102, "branch": "fix/billing-null-pointer"},
        {"number": 103, "branch": "refactor/database-layer"},
    ]
    results = asyncio.run(review_all_open_prs(prs))
    total_cost = sum(r["total_cost_usd"] for r in results)
    print(f"Total review cost: ${total_cost:.4f}")
    for r in results:
        print(f"\nPR #{r['pr_number']}: {r['verdict'][:100]}")
```

### Pattern 5: Experiment Safely

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

### Pattern 6: Team Coordination via Filesystem Mailbox

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

## 5. CI/CD Parallel Review with Multiple Worktrees

### GitHub Actions — Full Parallel Review Pipeline

```yaml
# .github/workflows/parallel-claude-review.yml
name: Parallel Claude Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  # Three review jobs run simultaneously
  security-review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # full history for accurate diff
      - name: Install Claude Code
        run: curl -fsSL https://claude.ai/install.sh | bash
      - name: Security Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          DISABLE_UPDATES: "1"
        run: |
          claude --print "
            Review all files changed in this PR for security vulnerabilities.
            Check: SQL injection, auth bypass, hardcoded secrets, SSRF, XSS.
            Run: git diff origin/main --name-only to find changed files.
            Output: PASS or SECURITY_ISSUES: <severity: file: description>
          " \
            --permission-mode plan \
            --max-turns 10 \
            --max-budget-usd 0.25 \
            --allowedTools "Read,Bash(git:*),Glob,Grep" \
            --output-format json > security-result.json
          cat security-result.json
      - name: Post security comment
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const result = JSON.parse(fs.readFileSync('security-result.json', 'utf8'));
            await github.rest.issues.createComment({
              ...context.repo,
              issue_number: context.issue.number,
              body: `## Security Review\n\n${result.result}`
            });

  quality-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: Install Claude Code
        run: curl -fsSL https://claude.ai/install.sh | bash
      - name: Code Quality Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          DISABLE_UPDATES: "1"
        run: |
          claude --print "
            Review PR changes for code quality.
            Check: test coverage gaps, missing error handling,
            code duplication, documentation, SOLID principles.
            Output: PASS or QUALITY_ISSUES: <priority: file: description>
          " \
            --permission-mode plan \
            --max-turns 10 \
            --max-budget-usd 0.25 \
            --allowedTools "Read,Bash(git:*),Glob,Grep"

  test-generation:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}
          fetch-depth: 0
      - name: Install Claude Code
        run: curl -fsSL https://claude.ai/install.sh | bash
      - name: Generate missing tests
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          DISABLE_UPDATES: "1"
        run: |
          claude --print "
            Find all new or changed functions in this PR that lack unit tests.
            Write tests for each. Run the test suite at the end.
            Only generate tests — do not change application code.
          " \
            --permission-mode autoAccept \
            --max-turns 20 \
            --max-budget-usd 0.75 \
            --allowedTools "Read,Write,Edit,Bash(git:*),Bash(npm test),Glob,Grep"
      - name: Commit generated tests
        run: |
          git config user.name "Claude Code Bot"
          git config user.email "claude@anthropic.com"
          git add -A
          git diff --cached --quiet || git commit -m "test: add AI-generated tests for PR changes"
          git push
```

---

## 6. Worktree Settings and Config

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

## 7. Syncing and Merging

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

## 8. Managing Worktrees

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

## 9. Worktrees in CI/CD

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

## 10. Troubleshooting

### Expanded Troubleshooting Guide

| Problem | Cause | Solution |
|---------|-------|----------|
| `fatal: 'feature/foo' is already checked out` | Branch checked out in another worktree | Remove the existing worktree first: `git worktree remove .worktrees/feature-foo` |
| Worktree stuck after force delete | Stale git metadata | Run `git worktree prune` to clean up |
| `.claude/settings.local.json` not loading | Wrong directory | Must be in the worktree root, not main repo root |
| CLAUDE.md changes not visible in worktree | Not committed | Commit `CLAUDE.md` first — worktrees share the git database |
| Hooks not firing in worktree session | Stale snapshot | Hooks are snapshotted at session start — restart session after changes |
| Can't push from worktree | No upstream set | `git push -u origin feature/branch-name` |
| `error: cannot lock ref` | Concurrent git operations | Wait for other git operations to complete; retry |
| Worktree shows wrong files | Wrong branch in worktree | `git -C .worktrees/foo branch` to verify; recreate if wrong |
| SDK session sees old file state | Subprocess cached state | Restart StatefulClient; each client session starts fresh |
| High disk usage from worktrees | Many worktrees with build artifacts | Add build dirs to `.gitignore`; run `make clean` before adding worktree |
| Agent Teams mailbox not visible in worktree | Different HOME paths | Verify `~/.claude/teams/` is accessible from all worktrees |

### Diagnosing worktree issues step by step

```bash
# 1. Check all worktrees and their status
git worktree list --porcelain

# 2. Inspect a specific worktree
git -C .worktrees/feature-auth status
git -C .worktrees/feature-auth log --oneline -5

# 3. Check for lock files that might be blocking
ls -la .git/worktrees/feature-auth/

# 4. Verify .git pointer file in worktree
cat .worktrees/feature-auth/.git
# Should show: gitdir: /path/to/main-repo/.git/worktrees/feature-auth

# 5. Manually prune if needed
git worktree prune --verbose --dry-run  # preview
git worktree prune --verbose            # execute

# 6. Rebuild worktree if corrupted
git worktree remove --force .worktrees/feature-auth
git worktree add .worktrees/feature-auth origin/feature/auth
```

---

## 11. Quick Reference

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

## 12. Next Steps

| If you want to… | Go to |
|----------------|-------|
| Visual guide to worktree architecture | [Worktrees & Parallel Dev — Diagram](./worktrees-diagram) |
| Automate worktree operations | [Agent SDK Guide](./sdk-guide) |
| Coordinate multiple agents | [Agent Teams Guide](./agent-teams-guide) |
| CI/CD parallel workflows | [CI/CD Integration](./cicd-integration) |
| Understand session isolation | [Permissions & Security](./permissions-security) |
