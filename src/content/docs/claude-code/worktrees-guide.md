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
lastUpdated: 2026-06-07
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

### Exact Git Commands Executed by `/branch`

When you run `/branch feature/new-auth-system`, Claude Code executes the following git commands internally (equivalent shell representation):

```bash
# Step 1 — Determine the worktree root path
#   Default: <repo-parent>/<repo-name>-worktrees/  OR
#            <repo-root>/.worktrees/  (if worktreeRootPath not set)
#   Controlled by: settings.json "worktreeRootPath" key
WORKTREE_ROOT=".worktrees"

# Step 2 — Sanitise branch name to a valid directory name
#   Replaces "/" with "-" and strips special characters
WORKTREE_DIR="${WORKTREE_ROOT}/feature-new-auth-system"

# Step 3 — Check if the branch already exists
git rev-parse --verify feature/new-auth-system 2>/dev/null
# If exists: skip branch creation (go to step 5)
# If not exists: continue to step 4

# Step 4 — Create the branch (only if it does not already exist)
git checkout -b feature/new-auth-system
# Equivalent: git branch feature/new-auth-system HEAD

# Step 5 — Add the worktree
git worktree add "${WORKTREE_DIR}" feature/new-auth-system
# This:
#   a) Creates .worktrees/feature-new-auth-system/ directory
#   b) Creates .worktrees/feature-new-auth-system/.git (a file, not a dir)
#      Contents: "gitdir: /abs/path/to/.git/worktrees/feature-new-auth-system"
#   c) Creates .git/worktrees/feature-new-auth-system/ with:
#        gitdir   ← absolute path to the .git file in the worktree
#        HEAD     ← refs/heads/feature/new-auth-system
#        commondir← points to main .git/ (shares objects + refs)
#   d) Checks out the branch into the worktree directory

# Step 6 — Launch a new terminal session
#   On macOS: open -n -a Terminal (or iTerm2 if detected)
#   On Linux: xterm / gnome-terminal / wezterm (detected from $TERM_PROGRAM)
#   In the new terminal: claude -C "${WORKTREE_DIR}"
```

**For `/branch --from main`:**

```bash
# Same as above, but step 3-4 use the specified base:
git checkout -b feature/new-auth-system main
# or if the base is a remote ref:
git checkout -b feature/new-auth-system origin/main
```

**For `/branch fix/existing-bug --from origin/fix/existing-bug` (tracking an existing remote branch):**

```bash
# Claude Code detects that the branch already exists on the remote
git worktree add "${WORKTREE_DIR}" --track -b fix/existing-bug origin/fix/existing-bug
# Sets up tracking so "git pull" in the worktree pulls from origin/fix/existing-bug
```

**For `/branch --list`:**

```bash
git worktree list --porcelain
# Claude Code parses this output and displays it with session status annotations
```

**For `/branch --clean`:**

```bash
# Identifies merged branches
git branch --merged main | grep -v "^\* "
# For each merged branch that has a worktree:
git worktree remove "${WORKTREE_DIR}"
# Final prune
git worktree prune
```

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

### State Sharing Constraints — Critical Details

Several constraints arise from the shared/isolated boundary that cause real problems if misunderstood.

#### Constraint 1: `.claude/settings.json` is shared — writes in one worktree affect all

Because `.claude/settings.json` is a single committed file shared via git, any Claude Code session that writes to it (e.g., when you add a permission or hook via Claude Code UI) modifies it for all worktree sessions simultaneously.

```
Session A (main)             Session B (feature/auth)
     │                             │
     │  adds hook to               │
     │  .claude/settings.json      │
     │  (writes to same file)      │
     │                             │  Next time Session B reads settings
     │                             │  → sees Session A's new hook
     │                             │  (may trigger unexpectedly)
```

**Rule:** Use `.claude/settings.local.json` (gitignored) for per-worktree settings changes. Never modify `.claude/settings.json` from inside a worktree session unless you intend the change to apply globally.

#### Constraint 2: The git index (staging area) is isolated — git add in one worktree does not bleed to another

Each worktree has its own `.git/worktrees/<name>/index` file. This means:

```bash
# In main worktree
git add src/api.py         # staged here only

# In .worktrees/feature-auth
git status                  # does NOT show src/api.py as staged
git add src/models.py      # staged only in feature-auth worktree
```

This is safe and expected, but it means git operations in one session are fully isolated at the staging level — Claude Code sessions cannot see each other's staged-but-uncommitted changes.

#### Constraint 3: `MEMORY.md` path is keyed to the worktree directory, not the repository

Auto-Memory MEMORY.md is stored at:
```
~/.claude/projects/<SHA256-of-cwd>/memory/MEMORY.md
```

The SHA256 is computed from the absolute path of the Claude Code session's working directory (`cwd`). Since each worktree has a different `cwd`, each worktree accumulates separate memory:

```
Main repo session cwd:    /projects/myapp/
→ MEMORY.md at: ~/.claude/projects/sha256(projects/myapp)/memory/MEMORY.md

Worktree session cwd:     /projects/myapp/.worktrees/feature-auth/
→ MEMORY.md at: ~/.claude/projects/sha256(projects/myapp/.worktrees/feature-auth)/memory/MEMORY.md
```

These are different files. Memory written in the worktree session is NOT visible in the main session, and vice versa.

**Implication:** If Claude Code writes important project facts to memory in the main session, a worktree session starts with an empty memory for that project. You must either:
- Accept that each worktree starts fresh (usually fine — project facts are in CLAUDE.md)
- Manually copy relevant MEMORY.md sections across worktree paths
- Use a shared `CLAUDE.local.md` file to provide stable context in each worktree

#### Constraint 4: Hooks fire in each session independently — no cross-session coordination

Hooks defined in `.claude/settings.json` are snapshotted at session start and run in the process context of that session. Two sessions running simultaneously with a PostToolUse hook on `Edit` will both fire their own instances of the hook — there is no shared hook state.

**Risk scenario:**

```
Session A: edits src/auth.py → PostToolUse hook runs "make test"
Session B: edits src/auth.py → PostToolUse hook runs "make test" simultaneously
Result: Two parallel "make test" processes write to the same test output files
        → test results may be corrupted
```

**Fix:** Ensure hook commands write to worktree-local output files, not a shared path:

```json
// .claude/settings.local.json (per worktree)
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{"type": "command",
                 "command": "make test > /tmp/test-$(basename $PWD).log 2>&1"}]
    }]
  }
}
```

#### Constraint 5: Git object database is shared — concurrent git gc can cause conflicts

All worktrees share the `.git/objects/` database. Running `git gc`, `git repack`, or `git prune` in one worktree while another is performing a large commit operation can cause:

```
error: object file .git/objects/xx/yyyy is empty
fatal: loose object xxxx (stored in .git/objects/xx/yyyy) is corrupt
```

**Rule:** Never run `git gc` while other worktrees have active Claude Code sessions performing git operations. Coordinate GC to run only when all sessions are idle.

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

### Concrete PR Review Walkthrough — Step by Step

This is a fully worked example reviewing three PRs simultaneously using worktrees, from initial setup to posting GitHub comments.

**Prerequisites:** `gh` CLI installed and authenticated, `claude` CLI installed with API key set.

**Step 1: Fetch the PR branches from GitHub**

```bash
cd /projects/myapp

# Fetch all three PR branches as local tracking refs
git fetch origin pull/123/head:pr-123
git fetch origin pull/124/head:pr-124
git fetch origin pull/125/head:pr-125

# Verify they were fetched
git branch -a | grep pr-
# Should show: pr-123, pr-124, pr-125
```

**Step 2: Create a worktree for each PR branch**

```bash
# Use the .worktrees/ subdirectory (gitignored by convention)
mkdir -p .worktrees

git worktree add .worktrees/pr-123 pr-123
git worktree add .worktrees/pr-124 pr-124
git worktree add .worktrees/pr-125 pr-125

# Verify all three worktrees exist
git worktree list
# Output:
# /projects/myapp                    abc1234 [main]
# /projects/myapp/.worktrees/pr-123  def5678 [pr-123]
# /projects/myapp/.worktrees/pr-124  ghi9012 [pr-124]
# /projects/myapp/.worktrees/pr-125  jkl3456 [pr-125]
```

**Step 3: Run Claude Code reviews in parallel (background processes)**

```bash
# Run all three reviews simultaneously — each writes to a result file
claude -C .worktrees/pr-123 \
  --print "Review this PR. Run: git diff main --name-only to see changed files. Read each changed file. Check for: (1) SQL injection, (2) missing auth, (3) hardcoded secrets, (4) missing tests. Output a structured review with APPROVE or REQUEST_CHANGES verdict." \
  --permission-mode plan \
  --max-turns 10 \
  --output-format json \
  > /tmp/review-pr-123.json &

claude -C .worktrees/pr-124 \
  --print "Review this PR. Run: git diff main --name-only to see changed files. Read each changed file. Check for: (1) SQL injection, (2) missing auth, (3) hardcoded secrets, (4) missing tests. Output a structured review with APPROVE or REQUEST_CHANGES verdict." \
  --permission-mode plan \
  --max-turns 10 \
  --output-format json \
  > /tmp/review-pr-124.json &

claude -C .worktrees/pr-125 \
  --print "Review this PR. Run: git diff main --name-only to see changed files. Read each changed file. Check for: (1) SQL injection, (2) missing auth, (3) hardcoded secrets, (4) missing tests. Output a structured review with APPROVE or REQUEST_CHANGES verdict." \
  --permission-mode plan \
  --max-turns 10 \
  --output-format json \
  > /tmp/review-pr-125.json &

# Wait for all three background jobs to complete
wait
echo "All reviews complete."
```

**Step 4: Parse results and post GitHub comments**

```bash
# Post review comments to GitHub for each PR
for pr_num in 123 124 125; do
  # Extract the text result from the JSON output
  REVIEW_TEXT=$(jq -r '.result' /tmp/review-pr-${pr_num}.json 2>/dev/null || echo "Review failed — see logs")

  # Post as a PR comment
  gh pr comment ${pr_num} \
    --body "## Claude Code Automated Review

${REVIEW_TEXT}

---
*Reviewed by Claude Code v2.1.126 using worktree isolation*"

  echo "Posted review to PR #${pr_num}"
done
```

**Step 5: Cleanup worktrees**

```bash
git worktree remove .worktrees/pr-123
git worktree remove .worktrees/pr-124
git worktree remove .worktrees/pr-125
git worktree prune

# Delete the local tracking branches (optional)
git branch -d pr-123 pr-124 pr-125
```

**Total elapsed time:** For 3 PRs, all three reviews run in parallel. If each review takes ~90 seconds, total wall-clock time is ~90 seconds (vs ~4.5 minutes if sequential). The `wait` command blocks until the slowest review finishes.

**Expected output files** (`/tmp/review-pr-123.json`):

```json
{
  "type": "result",
  "subtype": "success",
  "result": "## PR #123 Review\n\n**Verdict: REQUEST_CHANGES**\n\n### Issues Found\n\n1. **SQL Injection (Critical)** — `src/api/users.go:47`\n   Query uses string concatenation instead of parameterized query...\n\n2. **Missing Auth (Major)** — `src/api/admin.go:23`\n   Endpoint `/admin/users` has no authentication middleware...",
  "total_cost_usd": 0.0842,
  "session_id": "sess_01XYZ..."
}
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

#### How `asyncio.gather` Achieves True Parallelism with Worktrees

The SDK's `StatefulClient` makes one or more HTTP requests to the Claude API per `query()` call. These HTTP calls are I/O-bound (not CPU-bound), which means Python's `asyncio` event loop can interleave them efficiently without threads.

`asyncio.gather(*coroutines)` schedules all coroutines concurrently in the same event loop. While one `StatefulClient.query()` is waiting for the Claude API to respond, the event loop runs another `StatefulClient.query()` from a different worktree session. The result is genuine parallel API calls with a single Python process:

```
Event loop timeline (simplified):

t=0ms   gather() starts all 3 coroutines
t=1ms   review_branch("feature/auth") → git worktree add → await client.query()
        [HTTP request to Claude API — PENDING]
t=2ms   review_branch("fix/billing")  → git worktree add → await client.query()
        [HTTP request to Claude API — PENDING]
t=3ms   review_branch("refactor/db")  → git worktree add → await client.query()
        [HTTP request to Claude API — PENDING]

        ... all three HTTP requests are in-flight simultaneously ...

t=8000ms  Claude API responds to "fix/billing" first
          review_branch("fix/billing") resumes → processes response
t=9200ms  Claude API responds to "feature/auth"
          review_branch("feature/auth") resumes → processes response
t=11000ms Claude API responds to "refactor/db"
          review_branch("refactor/db") resumes → processes response
t=11001ms gather() returns all 3 results
```

Compare to sequential execution:
```
Sequential: 8000ms + 9200ms + 11000ms = 28200ms total
Parallel:                              ~11000ms total  (2.5× faster)
```

**Important:** Each `StatefulClient` has its own `cwd`, which determines which worktree it operates in. File reads, writes, and git operations are isolated to that directory. Multiple `StatefulClient` instances pointing to different worktrees cannot conflict on file operations because they touch different directory trees.

```python
import asyncio
import subprocess
from pathlib import Path
from anthropic.claude_code import StatefulClient

async def review_branch(branch: str, repo_path: str) -> dict:
    """Check out a branch in a worktree and review it."""
    worktree_path = Path(repo_path) / ".worktrees" / branch.replace("/", "-")
    
    # Create the worktree (synchronous — runs before the async session starts)
    subprocess.run(
        ["git", "worktree", "add", str(worktree_path), f"origin/{branch}"],
        cwd=repo_path, check=True, capture_output=True
    )
    
    try:
        # StatefulClient(cwd=...) pins this session to the worktree directory.
        # All file operations, Bash commands, and git operations from Claude
        # will run relative to this path — completely isolated from other sessions.
        async with StatefulClient(
            cwd=str(worktree_path),
            permission_mode="acceptEdits",
            model="claude-sonnet-4-6",
            max_budget_usd=0.50,
        ) as client:
            # First query: understand what changed
            # Claude runs "git diff main --stat" inside the worktree
            summary = await client.query("Summarise the changes in this branch vs main.")
            
            # Second query: reuses the same session context (conversation continues)
            # Claude already knows what files changed from the previous turn
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
        # Always clean up — even if client.query() raises an exception
        subprocess.run(["git", "worktree", "remove", str(worktree_path)],
                       cwd=repo_path, capture_output=True)

async def review_all_prs(branches: list[str], repo_path: str):
    """Review all open PRs in parallel using asyncio.gather."""
    # asyncio.gather() starts all coroutines concurrently.
    # It returns when ALL coroutines complete (or raises on first exception).
    # Use return_exceptions=True to get results even if some branches fail.
    results = await asyncio.gather(
        *[review_branch(b, repo_path) for b in branches],
        return_exceptions=True  # don't abort all if one fails
    )
    for branch, result in zip(branches, results):
        if isinstance(result, Exception):
            print(f"\n=== {branch} — FAILED: {result} ===")
        else:
            print(f"\n=== {result['branch']} ===")
            print(result['review'])

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

### When Worktrees Fail — Root Causes and Recovery

Worktree failures fall into four main categories: locked objects, detached HEAD states, stale metadata, and concurrent operation conflicts. Understanding each failure type prevents data loss and speeds up recovery.

#### Failure Category 1: Locked Object Files

Git objects are occasionally locked during write operations. When a Claude Code session makes a large commit (many files) while another session runs `git fetch` or `git gc`, the object database can encounter lock conflicts:

```
error: object file .git/objects/ab/cd1234... is empty
fatal: loose object abcd1234 (stored in .git/objects/ab/cd1234...) is corrupt

# Or during a write:
error: unable to create '.git/objects/xx/yyyy': File exists
error: insufficient permission for adding an object to repository database .git/objects
```

**Root cause:** Two processes tried to write or modify the same object file simultaneously. Git is mostly safe across processes, but `git gc --aggressive` and `git repack` are not safe to run while other worktrees have active sessions.

**Recovery:**

```bash
# Step 1: Check which objects are affected
git fsck --full 2>&1 | head -20

# Step 2: If an object is empty (zero bytes), delete it
find .git/objects -size 0 -delete

# Step 3: Re-fetch the missing objects from the remote
git fetch --all

# Step 4: Re-run fsck to confirm the database is clean
git fsck --full
# Expected: "Checking connectivity: done."

# Step 5: If fsck still shows errors, run:
git gc --prune=now
# This rebuilds the pack files from the remaining valid objects

# Prevention: never run git gc while worktree sessions are active
# In CI, add a pre-gc check:
if git worktree list | grep -v "^$(git rev-parse --show-toplevel)" | grep -q .; then
  echo "ERROR: Active worktrees found. Refusing to run git gc."
  exit 1
fi
git gc
```

#### Failure Category 2: Detached HEAD States

A worktree can end up in a detached HEAD state when:
- Claude Code checks out a specific commit (not a branch ref) during an experiment
- A `git bisect` or `git rebase` was interrupted mid-operation
- The `/branch --from v2.1.0` command checks out a tag (tags create detached HEAD)

**Symptoms:**

```bash
git -C .worktrees/experiment status
# On output: HEAD detached at a3f7b29

git -C .worktrees/experiment branch
# * (HEAD detached at a3f7b29)
```

**What breaks in detached HEAD:**
- `git commit` works but the commit is orphaned — not reachable from any branch ref
- `/branch --clean` will NOT remove the worktree (it only removes merged branches)
- `git push` will fail: `fatal: You are not currently on a branch`
- Claude Code `/branch` cannot create a sub-branch from a detached HEAD

**Recovery:**

```bash
# Option A: Create a branch at the current detached HEAD (saves your work)
git -C .worktrees/experiment checkout -b experiment/saved-$(date +%Y%m%d)
# Now the worktree is on a named branch; you can push and merge normally

# Option B: Abandon the detached HEAD and reset to a known branch
git -C .worktrees/experiment checkout main
# This re-attaches to the main branch (no orphaned commits to worry about)

# Option C: Force-remove the worktree (loses any uncommitted changes)
git worktree remove --force .worktrees/experiment
git worktree prune

# Preventing detached HEAD in /branch:
# Always use branch names, not commit hashes or tags:
/branch experiment/test  --from main       ✓ (creates branch from main)
/branch experiment/test  --from v2.1.0     ⚠ (tag → detached HEAD)
# If you must start from a tag, create a branch first:
git checkout -b experiment/from-v2.1.0 v2.1.0
/branch --from experiment/from-v2.1.0
```

#### Failure Category 3: Stale Worktree Metadata

If a worktree directory is deleted manually (not via `git worktree remove`), git's internal metadata becomes stale. Subsequent `git worktree` commands may error or show phantom entries:

```bash
git worktree list
# Output includes a path that no longer exists:
# /projects/myapp/.worktrees/feature-auth   def5678 [feature/auth]  (locked: deleted manually)

git worktree add .worktrees/feature-auth feature/auth
# Error: fatal: '.worktrees/feature-auth' is a registered but missing path for worktree 'feature-auth'
```

**Recovery:**

```bash
# Prune stale metadata — safe, only removes entries with missing paths
git worktree prune --verbose
# Output: Removing worktrees/feature-auth: gitdir file points to non-existent location

# After pruning, verify the stale entry is gone
git worktree list

# Now you can re-add the worktree normally
git worktree add .worktrees/feature-auth feature/auth
```

#### Failure Category 4: Concurrent Operation Conflicts

When two Claude Code sessions (or a session + a shell script) perform git operations simultaneously on the same repository, ref-locking conflicts occur:

```
error: cannot lock ref 'refs/heads/feature/auth': unable to resolve reference 'refs/heads/feature/auth'
error: cannot lock ref 'refs/heads/feature/auth': is at abc123 but expected def456

# During git fetch in one session while another commits:
error: cannot lock ref 'refs/remotes/origin/feature/auth': reference already exists

# During git commit in two sessions simultaneously (race condition):
error: Unable to create '.git/index.lock': File exists.
```

**Root cause:** Git uses lock files (`.git/index.lock`, `.git/refs/heads/.lock`) to serialise writes. If two operations race, one gets the lock and the other fails.

**Recovery:**

```bash
# For stale .lock files (only delete if you're sure no git operation is running):
rm -f .git/index.lock
rm -f .git/refs/heads/feature-auth.lock
rm -f .git/HEAD.lock

# Check for active git processes before removing locks:
lsof .git/index.lock  # if no output, safe to remove
lsof .git/refs/heads/feature-auth.lock

# For ref conflicts:
git fetch --all  # re-sync remote refs
git remote prune origin  # remove stale remote-tracking refs
```

**Prevention for multi-session setups:**

```bash
# If running multiple Claude Code sessions on the same repo simultaneously,
# stagger git fetch calls to avoid conflicts:
# In .claude/settings.json hooks:
{
  "hooks": {
    "SessionStart": [{
      "handler": {
        "type": "command",
        "command": "sleep $((RANDOM % 10)) && git fetch origin"
      }
    }]
  }
}
# The random sleep distributes the fetch timing across sessions
```

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
| Detached HEAD in worktree | Checked out a tag or commit | `git -C <worktree> checkout -b new-branch` to re-attach |
| Empty object file error | Concurrent gc + write | `git fsck --full`; delete empty objects; `git fetch --all` |
| `index.lock` file exists | Previous git operation crashed | Verify no git processes running; `rm .git/index.lock` |
| Worktree shows old branch files | Branch diverged from remote | `git -C <worktree> pull --rebase` or recreate the worktree |

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

---

## State Across Worktrees — What's Shared vs Isolated

Understanding which Claude Code state is shared between worktrees vs isolated to each worktree is critical for avoiding surprises:

```
SHARED (same file on disk — all worktrees see the same thing):
  ✓ .claude/settings.json         (project settings)
  ✓ CLAUDE.md                     (project CLAUDE.md)
  ✓ .claude/rules/*.md            (path-scoped rules)
  ✓ .claude/skills/               (skill files)
  ✓ .claude/agents/               (agent definitions)
  ✓ .claude/commands/             (custom commands)
  ✓ .mcp.json                     (MCP servers)
  ✓ Auto-Memory MEMORY.md         (project hash is same for all worktrees of same repo)

ISOLATED (separate per-worktree):
  ✗ .claude/settings.local.json   (local overrides — each worktree is a separate dir)
  ✗ CLAUDE.local.md               (personal overrides — tied to the directory)
  ✗ Active Claude Code process    (each worktree runs its own session)
  ✗ Conversation history          (separate sessions)
  ✗ TodoWrite task lists          (session-scoped)
```

**The MEMORY.md sharing implication:** Auto-Memory MEMORY.md is stored at `~/.claude/projects/<SHA256-of-project-root>/memory/MEMORY.md`. All worktrees share the same SHA256 because they all point back to the same git repository root. This means memory facts written in one worktree session are visible to other worktree sessions — which is usually what you want (project facts persist) but can be surprising if different worktree sessions write conflicting facts.

**Best practice for MEMORY.md in worktrees:** Use branch-scoped memory sections to avoid conflicts:
```markdown
# In MEMORY.md
## main branch context
[facts about main branch work]

## feature/auth-refactor context  
[facts specific to this branch]
```

---

## Worktrees + CLAUDE.local.md

`CLAUDE.local.md` is NOT shared across worktrees. Each worktree directory has its own `CLAUDE.local.md` (or lacks one). This is useful for per-branch personal overrides:

```bash
# In worktree for feature/auth-refactor:
cat > ./CLAUDE.local.md << 'EOF'
# My personal notes for this branch
- Auth refactor context: we're migrating from JWT to session tokens
- Don't touch the legacy /auth/v1 endpoints during this work
- Current focus: the AuthService class in src/services/auth/
EOF
```

This personal note only applies when Claude Code runs in that specific worktree directory — it doesn't affect the main branch session or other worktrees.

---

## Worktrees + Agent Teams

Combining worktrees and Agent Teams enables parallel cross-branch development:

```
Architecture: Multi-branch Agent Team
─────────────────────────────────────────────────────────────────
Main branch worktree                  Feature branch worktree
(orchestrator agent)                  (implementation agent)
       │                                      │
       │  Task: "Add auth refactor to         │
       │  feature/auth-refactor branch        │
       │  and keep main compatible"           │
       └──────────────────────────────────────►│
                                              │  Works in the
                                              │  feature branch
                                              │  worktree
                                              │
                                              ◄─│  Reports completion
                                                │
       Orchestrator reviews the               │
       diff and approves or requests          │
       changes                                │
```

**To set this up:**
1. Create worktrees for each branch: `/branch feature/auth-refactor`
2. Enable Agent Teams: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
3. Use the orchestrator to delegate tasks to specific branches
4. Each agent runs its Claude Code session in its own worktree directory

**Caveat:** Agent Teams is in Research Preview. File path routing to the correct worktree is not automatic — you must ensure agents set their CWD to the right worktree path in their initialization.

---

## Directory Layout After Multiple Worktrees

After running `/branch feature/auth` and `/branch hotfix/login-bug` from the main repository:

```
/projects/myapp/                     ← main repository
  .git/
  .claude/
  CLAUDE.md
  src/
  ...

~/.claude/agent-teams/               ← Agent Teams state (if using)

/projects/myapp-worktrees/           ← created by /branch command
  feature-auth/                      ← worktree for feature/auth branch
    .git                             ← symlink to main .git
    .claude/                         ← SHARED .claude/ via symlink or separate
    CLAUDE.md                        ← SHARED via git
    src/
    ...
  hotfix-login-bug/                  ← worktree for hotfix/login-bug branch
    .git
    .claude/
    CLAUDE.md
    src/
    ...
```

The exact location of worktrees depends on the `--path` argument to `/branch` or the `worktreeRootPath` setting in `settings.json`. By default, worktrees are created at `../repo-name-worktrees/branch-name`.

---

## 9. Advanced Worktree Patterns

### Pattern: Feature Branch Isolation with Shared MCP Servers

One of the most powerful patterns is using worktrees to work on multiple feature branches simultaneously, each with their own Claude Code session, while sharing a common set of MCP servers configured at the user level.

```
┌───────────────────────────────────────────────────────────────────────┐
│                    WORKTREE + MCP ARCHITECTURE                         │
├───────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   /projects/myapp/           (main repo — your working branch)         │
│     .claude/settings.json    ← project-level settings                  │
│     CLAUDE.md                ← shared project instructions              │
│     src/                                                                │
│                                                                         │
│   /projects/myapp-worktrees/                                            │
│     feature-auth/            ← worktree for feature/auth branch         │
│       .claude/               ← own settings.local.json                  │
│       CLAUDE.local.md        ← personal overrides (not committed)       │
│       src/                                                              │
│                                                                         │
│     feature-payments/        ← worktree for feature/payments branch     │
│       .claude/               ← own settings.local.json                  │
│       CLAUDE.local.md        ← personal overrides (not committed)       │
│       src/                                                              │
│                                                                         │
│   ─────────────────────── SHARED (user-level) ────────────────────────│
│                                                                         │
│   ~/.claude/CLAUDE.md        ← loaded in ALL worktrees                 │
│   ~/.claude/settings.json    ← user settings (applies everywhere)      │
│   ~/.claude/.mcp.json        ← user-level MCP servers                  │
│     ├── github MCP server    ← available in ALL sessions               │
│     ├── postgres MCP server  ← available in ALL sessions               │
│     └── slack MCP server     ← available in ALL sessions               │
│                                                                         │
└───────────────────────────────────────────────────────────────────────┘
```

**What each worktree inherits from user-level config:**

- `~/.claude/CLAUDE.md` — user-level instructions (loaded in every session)
- `~/.claude/settings.json` — user settings (model, theme, etc.)
- `~/.claude/.mcp.json` — all user-configured MCP servers

**What each worktree has isolated:**

- Working branch (different git state per worktree)
- Claude Code session (completely separate session state, separate conversation history)
- `CLAUDE.local.md` in the worktree root (personal overrides, never committed)
- `.claude/settings.local.json` in the worktree (local settings override for this branch)
- Auto-Memory `MEMORY.md` at `<worktree-path>/.claude/MEMORY.md` (separate memory per worktree path)

**Complete shell workflow:**

```bash
# Step 1: Create worktrees for the branches you want to work on simultaneously
cd /projects/myapp

git worktree add ../myapp-worktrees/feature-auth feature/auth
git worktree add ../myapp-worktrees/feature-payments feature/payments

# Step 2: Open a separate terminal for each worktree
# Terminal A — feature/auth
cd /projects/myapp-worktrees/feature-auth
claude   # starts independent Claude Code session on feature/auth

# Terminal B — feature/payments
cd /projects/myapp-worktrees/feature-payments
claude   # starts independent Claude Code session on feature/payments

# Terminal C — main repo
cd /projects/myapp
claude   # starts Claude Code session on your working branch

# All three sessions run simultaneously, independently, sharing MCP servers

# Step 3: When feature work is done, remove the worktree
git worktree remove ../myapp-worktrees/feature-auth
git worktree remove ../myapp-worktrees/feature-payments

# Prune any stale worktree metadata from git
git worktree prune
```

**Project-specific MCP servers in worktrees:**

If your project's `.claude/settings.json` configures MCP servers at the project level (not user level), those servers are available in all worktrees for that project — because all worktrees share the same `.claude/settings.json` from the main repository:

```json
// .claude/settings.json (committed to main repo, shared across all worktrees)
{
  "mcpServers": {
    "project-database": {
      "command": "npx",
      "args": ["-y", "@mycompany/db-mcp-server"],
      "env": {
        "DATABASE_URL": "${PROJECT_DB_URL}"
      }
    }
  }
}
```

### Pattern: Automated Worktree CI via SDK

Using the Claude Code SDK, you can orchestrate parallel worktree sessions programmatically — running automated analysis, code review, or generation on multiple branches simultaneously.

**Python SDK example (parallel branch analysis):**

```python
import asyncio
import subprocess
import json
from pathlib import Path

async def analyze_branch_in_worktree(repo_path: str, branch: str, worktree_base: str, prompt: str) -> dict:
    """
    Creates a git worktree for the given branch, runs Claude Code in it
    with the given prompt, and returns the result.
    """
    worktree_name = branch.replace("/", "-")
    worktree_path = Path(worktree_base) / worktree_name

    # Create the worktree
    subprocess.run(
        ["git", "worktree", "add", str(worktree_path), branch],
        cwd=repo_path,
        check=True,
        capture_output=True
    )

    try:
        # Run Claude Code SDK in the worktree directory
        result = await asyncio.create_subprocess_exec(
            "claude",
            "--output-format", "json",
            "--print",
            "--max-turns", "10",
            prompt,
            cwd=str(worktree_path),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, stderr = await result.communicate()

        return {
            "branch": branch,
            "worktree": str(worktree_path),
            "exit_code": result.returncode,
            "output": json.loads(stdout.decode()) if stdout else None,
            "error": stderr.decode() if stderr else None,
        }
    finally:
        # Always clean up the worktree, even if Claude fails
        subprocess.run(
            ["git", "worktree", "remove", "--force", str(worktree_path)],
            cwd=repo_path,
            check=False,
            capture_output=True
        )

async def parallel_branch_analysis(repo_path: str, branches: list[str]) -> list[dict]:
    """
    Analyze all branches in parallel using separate worktrees.
    """
    worktree_base = str(Path(repo_path).parent / "ci-worktrees")
    Path(worktree_base).mkdir(exist_ok=True)

    prompt = """
    Review this branch for:
    1. Security vulnerabilities in authentication code
    2. Performance regressions vs main branch
    3. Missing error handling in API handlers
    Return a JSON object with keys: security_issues, performance_issues, error_handling_issues
    """

    # Run all branch analyses in parallel
    tasks = [
        analyze_branch_in_worktree(repo_path, branch, worktree_base, prompt)
        for branch in branches
    ]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    return results

# Usage
async def main():
    results = await parallel_branch_analysis(
        repo_path="/projects/myapp",
        branches=["feature/auth", "feature/payments", "hotfix/login-bug"]
    )
    for r in results:
        print(f"Branch: {r['branch']} — exit code: {r['exit_code']}")

asyncio.run(main())
```

**TypeScript SDK example (sequential with worktree):**

```typescript
import { execSync, spawn } from "child_process";
import { mkdirSync, rmSync } from "fs";
import path from "path";

interface WorktreeAnalysisResult {
  branch: string;
  output: string;
  exitCode: number;
}

async function analyzeInWorktree(
  repoPath: string,
  branch: string,
  prompt: string
): Promise<WorktreeAnalysisResult> {
  const worktreeName = branch.replace(/\//g, "-");
  const worktreePath = path.join(repoPath, "..", `ci-${worktreeName}`);

  // Create worktree
  execSync(`git worktree add ${worktreePath} ${branch}`, {
    cwd: repoPath,
    stdio: "pipe",
  });

  try {
    // Run Claude Code in the worktree
    const output = await new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const proc = spawn(
        "claude",
        ["--print", "--output-format", "json", "--max-turns", "5", prompt],
        { cwd: worktreePath }
      );

      proc.stdout.on("data", (chunk) => chunks.push(chunk));
      proc.on("close", (code) => {
        if (code === 0) resolve(Buffer.concat(chunks).toString());
        else reject(new Error(`Claude exited with code ${code}`));
      });
    });

    return { branch, output, exitCode: 0 };
  } finally {
    execSync(`git worktree remove --force ${worktreePath}`, {
      cwd: repoPath,
      stdio: "pipe",
    });
  }
}
```

### Pattern: Agent Teams Across Worktrees

Claude Code Agent Teams (enabled via `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) can span multiple worktrees, allowing different specialist agents to work on different branches simultaneously. This pattern is particularly powerful for large feature rollouts that touch multiple branches.

**How Agent Teams + Worktrees interact:**

The Agent Teams filesystem mailbox is stored in `~/.claude/agent-teams/<team-id>/` — at the user level, not the project level. This means:

- All agents in a team share the same mailbox directory regardless of which worktree they run in
- An orchestrator in the main repo can spawn agents that run in specific worktrees
- Each agent's `cwd` (current working directory) determines which branch it operates on
- Claude Code context (CLAUDE.md, settings) is loaded from the worktree the agent is running in

**Cross-worktree Agent Team setup:**

```bash
# Enable Agent Teams
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# Start the orchestrator in the main repo
cd /projects/myapp
claude

# In the orchestrator session, define the cross-worktree team:
```

```
/agents create-team feature-rollout

/agents add auth-agent \
  --worktree ../myapp-worktrees/feature-auth \
  --role "Implement authentication changes on the feature/auth branch" \
  --model claude-sonnet-4-6

/agents add payments-agent \
  --worktree ../myapp-worktrees/feature-payments \
  --role "Implement payment integration on the feature/payments branch" \
  --model claude-sonnet-4-6

/agents add integration-agent \
  --worktree ../myapp-worktrees/feature-integration \
  --role "Coordinate integration testing across both feature branches" \
  --model claude-opus-4-8

/agents start feature-rollout
```

**CLAUDE.md for the orchestrator** (in the main repo):

```markdown
# CLAUDE.md — Main Repo Orchestrator

You are the orchestration agent for the feature-rollout team. Your responsibilities:

1. Coordinate work across three worktrees: feature-auth, feature-payments, feature-integration
2. Send implementation tasks to auth-agent and payments-agent
3. When both signal completion, instruct integration-agent to run integration tests
4. Collect test results and synthesize a rollout readiness report

## Message Protocol

Send tasks using the filesystem mailbox format. Wait for completion signals
before proceeding to the next phase.

## Worktree Paths

- feature/auth branch: ../myapp-worktrees/feature-auth
- feature/payments branch: ../myapp-worktrees/feature-payments
- Integration testing: ../myapp-worktrees/feature-integration
```

**Known limitation:** Agent Teams running in different worktrees use the same `~/.claude/agent-teams/` mailbox. Ensure team IDs are unique if you run multiple cross-worktree teams simultaneously to avoid mailbox conflicts.

---

### Worktree State Isolation — Complete Matrix

The following table documents exactly what is isolated vs. shared between the main repository and worktrees for every aspect of Claude Code operation.

| Aspect | Main Repo | Worktrees | Notes |
|--------|-----------|-----------|-------|
| **Git** | | | |
| Committed files | Independent per branch | Independent per branch | Each worktree checks out a different branch |
| `.git/` directory | Full .git | Symlink to main .git | All worktrees share the same git history |
| Unstaged changes | Isolated to working tree | Isolated to working tree | Cannot bleed between worktrees |
| Git index (staging area) | Isolated | Isolated | Separate index per worktree |
| **Claude Code Config** | | | |
| `CLAUDE.md` (project) | Loaded from main repo | Loaded from worktree root (same file via git) | Same content, but read from worktree path |
| `CLAUDE.local.md` | In main repo root | In worktree root (separate file) | Personal overrides; not committed |
| `.claude/settings.json` | Shared (same repo) | Shared (same file via git) | Project settings apply to all worktrees |
| `.claude/settings.local.json` | In main .claude/ | In worktree .claude/ (separate file) | Local overrides isolated per worktree |
| `~/.claude/CLAUDE.md` | Loaded in every session | Loaded in every session | User-level; universal |
| `~/.claude/settings.json` | Applied | Applied | User-level; universal |
| **Session State** | | | |
| Conversation history | Isolated per session | Isolated per session | Sessions are completely independent |
| Current task context | Isolated | Isolated | No shared task state |
| `/todo` list state | Isolated | Isolated | Separate TodoRead/Write state per session |
| **Memory** | | | |
| `~/.claude/MEMORY.md` | Loaded | Loaded | User-level memory; shared across all sessions |
| `<project>/.claude/MEMORY.md` | Keyed to main repo path | Keyed to worktree path | SEPARATE memory per worktree path |
| `/memory` writes | Write to worktree MEMORY.md | Write to worktree MEMORY.md | Each worktree accumulates its own memory |
| **MCP Servers** | | | |
| `~/.claude/.mcp.json` servers | Connected | Connected | User-level MCP; universal |
| `.claude/settings.json` MCP servers | Connected | Connected | Project-level MCP; shared via git |
| `.claude/settings.local.json` MCP servers | Connected | Isolated | Local MCP overrides per worktree |
| **Hooks** | | | |
| `~/.claude/settings.json` hooks | Active | Active | User-level hooks; universal |
| `.claude/settings.json` hooks | Active | Active | Project hooks; shared via git |
| `.claude/settings.local.json` hooks | Active | Isolated | Local hook overrides per worktree |
| **Rules** | | | |
| `.claude/rules/*.md` | Loaded from main repo | Loaded from worktree | Same rules files via git |
| **Skills** | | | |
| `.claude/commands/*.md` | Available | Available | Same skill files via git |
| `~/.claude/commands/*.md` | Available | Available | User skills; universal |
| **Agent Teams** | | | |
| `~/.claude/agent-teams/` mailbox | Shared mailbox directory | Shared mailbox directory | All worktrees share the same mailbox |
| Agent team state | Isolated per team ID | Isolated per team ID | Teams are isolated by ID |
| **Plugins** | | | |
| Installed plugins | Active | Active | Plugins are user-level; universal |

---

## 10. Worktree Cleanup Best Practices

### Why Cleanup Matters

Each active worktree consumes disk space (a full working tree copy of all files) and occupies a branch lock in git. If Claude Code sessions are running in worktrees when the worktree is removed, the session will encounter errors on its next file operation.

Abandoned worktrees also fragment git's internal bookkeeping over time, slowing down `git worktree list` and `git status`.

### Verifying Worktree State Before Cleanup

Always check the state of a worktree before removing it:

```bash
# List all active worktrees and their branches
git worktree list

# Expected output:
# /projects/myapp                          abc1234 [main]
# /projects/myapp-worktrees/feature-auth  def5678 [feature/auth]
# /projects/myapp-worktrees/feature-payments ghi9012 [feature/payments]

# Check if any worktree has uncommitted changes before removal
for worktree_path in $(git worktree list --porcelain | grep "^worktree" | awk '{print $2}'); do
  if git -C "$worktree_path" status --porcelain | grep -q .; then
    echo "UNCOMMITTED CHANGES in: $worktree_path"
    git -C "$worktree_path" status --short
  fi
done
```

### Automated Cleanup Script

The following script safely removes a worktree after verifying there are no uncommitted changes or active Claude Code sessions:

```bash
#!/usr/bin/env bash
# cleanup-worktree.sh — safely remove a git worktree
# Usage: ./cleanup-worktree.sh <worktree-path>

set -euo pipefail

WORKTREE_PATH="${1:?Usage: $0 <worktree-path>}"

# Verify the worktree exists
if ! git worktree list | grep -q "$WORKTREE_PATH"; then
  echo "ERROR: Worktree not found: $WORKTREE_PATH"
  exit 1
fi

# Check for uncommitted changes
if git -C "$WORKTREE_PATH" status --porcelain | grep -q .; then
  echo "ERROR: Worktree has uncommitted changes:"
  git -C "$WORKTREE_PATH" status --short
  echo ""
  echo "Commit or stash your changes before removing the worktree."
  echo "To force removal anyway: git worktree remove --force $WORKTREE_PATH"
  exit 1
fi

# Check for active Claude Code sessions (heuristic: look for .claude session files)
if ls "$WORKTREE_PATH"/.claude/session-*.json 2>/dev/null | grep -q .; then
  echo "WARNING: Active or recent Claude Code session detected in worktree."
  echo "Session files:"
  ls "$WORKTREE_PATH"/.claude/session-*.json
  echo ""
  read -p "Remove worktree anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# Remove the worktree
echo "Removing worktree: $WORKTREE_PATH"
git worktree remove "$WORKTREE_PATH"

# Prune stale references
git worktree prune

echo "Done. Active worktrees:"
git worktree list
```

### Bulk Cleanup for Merged Branches

After feature branches are merged and no longer needed, remove their worktrees in bulk:

```bash
#!/usr/bin/env bash
# cleanup-merged-worktrees.sh — remove worktrees for branches already merged to main

MAIN_BRANCH="${1:-main}"
REPO_PATH="${2:-$(git rev-parse --show-toplevel)}"

echo "Checking for merged branches with active worktrees..."

# Get list of merged branches (excluding main)
MERGED_BRANCHES=$(git branch --merged "$MAIN_BRANCH" | grep -v "^\* " | grep -v "$MAIN_BRANCH" | tr -d ' ')

for branch in $MERGED_BRANCHES; do
  # Check if there's a worktree for this branch
  WORKTREE=$(git worktree list --porcelain | awk "/^branch refs\/heads\/$branch$/{found=1} found && /^worktree/{print \$2; found=0}")

  if [ -n "$WORKTREE" ] && [ "$WORKTREE" != "$REPO_PATH" ]; then
    echo "Branch '$branch' is merged. Worktree: $WORKTREE"

    # Check for uncommitted changes before removing
    if git -C "$WORKTREE" status --porcelain | grep -q .; then
      echo "  SKIPPING — worktree has uncommitted changes"
    else
      echo "  Removing worktree..."
      git worktree remove "$WORKTREE" 2>/dev/null || \
        echo "  WARNING: Could not remove $WORKTREE (may be in use)"
    fi
  fi
done

git worktree prune
echo "Prune complete. Active worktrees:"
git worktree list
```

### Handling Failed Claude Sessions in Worktrees

If a Claude Code session in a worktree crashes or is killed mid-operation, the session may have left partial changes:

```bash
# Check if the worktree has any in-progress changes from a failed session
cd /projects/myapp-worktrees/feature-auth

# See what files were modified
git status --short

# See what the diff looks like
git diff --stat

# If changes look wrong or partial:
# Option 1: Restore specific files
git checkout -- src/middleware/auth.go

# Option 2: Reset all changes (nuclear option)
git reset --hard HEAD

# Option 3: Stash and inspect
git stash
git stash show -p  # inspect the stash
git stash drop     # discard if not needed
```

### Worktree Pruning in CI Environments

In CI/CD pipelines, worktrees can accumulate if CI jobs are cancelled or fail before cleanup steps run. Add prune steps to your pipeline:

```yaml
# .github/workflows/ci.yml (cleanup job)
jobs:
  cleanup:
    runs-on: ubuntu-latest
    if: always()  # Run even if other jobs fail
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Need full history for worktree commands

      - name: Prune stale worktrees
        run: |
          git worktree list
          git worktree prune --verbose
          git worktree list
```

---

## 11. Worktrees in GitHub Actions

Using git worktrees in GitHub Actions workflows allows you to run Claude Code analysis or generation tasks on multiple branches in parallel within a single CI job, without requiring separate job matrix entries for each branch.

### Basic Worktree + Claude Code Workflow

```yaml
# .github/workflows/claude-parallel-review.yml
name: Parallel Claude Code Review

on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read
  pull-requests: write

jobs:
  parallel-review:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository (with full history)
        uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for worktrees

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Set up worktrees for parallel analysis
        run: |
          # Create worktree for the PR branch
          git fetch origin ${{ github.head_ref }}
          git worktree add ../pr-worktree origin/${{ github.head_ref }}

          # Create worktree for main branch (for comparison)
          git worktree add ../main-worktree origin/main

          echo "Worktrees created:"
          git worktree list

      - name: Run Claude Code analysis on PR branch
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cd ../pr-worktree
          claude \
            --print \
            --output-format json \
            --max-turns 5 \
            --dangerously-skip-permissions \
            "Review the changes in this branch for security issues, missing error handling, and test coverage gaps. Return a JSON object with keys: security, error_handling, test_coverage. Each key should have a list of specific issues found, or an empty list if none." \
          > /tmp/pr-review.json

      - name: Run Claude Code analysis on main branch
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cd ../main-worktree
          claude \
            --print \
            --output-format json \
            --max-turns 5 \
            --dangerously-skip-permissions \
            "Identify the main architectural patterns used in this codebase. Return a JSON object with keys: patterns, conventions, areas_to_preserve. Brief descriptions only." \
          > /tmp/main-analysis.json

      - name: Post review comment to PR
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const prReview = JSON.parse(fs.readFileSync('/tmp/pr-review.json', 'utf8'));
            const mainAnalysis = JSON.parse(fs.readFileSync('/tmp/main-analysis.json', 'utf8'));

            const body = `## Claude Code Review

            **Security:** ${prReview.security?.length ?? 0} issue(s)
            ${prReview.security?.map(i => `- ${i}`).join('\n') ?? 'None found'}

            **Error Handling:** ${prReview.error_handling?.length ?? 0} issue(s)
            ${prReview.error_handling?.map(i => `- ${i}`).join('\n') ?? 'None found'}

            **Test Coverage:** ${prReview.test_coverage?.length ?? 0} gap(s)
            ${prReview.test_coverage?.map(i => `- ${i}`).join('\n') ?? 'None found'}
            `;

            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              body
            });

      - name: Clean up worktrees
        if: always()  # Run even if previous steps failed
        run: |
          git worktree remove --force ../pr-worktree || true
          git worktree remove --force ../main-worktree || true
          git worktree prune
```

### Matrix Build with Worktrees

For workflows that need to analyze multiple branches simultaneously, combine GitHub Actions matrix strategy with git worktrees:

```yaml
# .github/workflows/multi-branch-analysis.yml
name: Multi-Branch Claude Analysis

on:
  workflow_dispatch:
    inputs:
      branches:
        description: 'Comma-separated list of branches to analyze'
        required: true
        default: 'main,develop,staging'

jobs:
  analyze:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        branch: ${{ fromJson(format('["{0}"]', join(fromJson(format('["{}"]', replace(github.event.inputs.branches, ',', '","'))), '","'))) }}
      fail-fast: false  # Analyze all branches even if one fails

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Create worktree for branch
        run: |
          BRANCH="${{ matrix.branch }}"
          SAFE_NAME="${BRANCH//\//-}"
          git fetch origin "$BRANCH"
          git worktree add "../analyze-${SAFE_NAME}" "origin/${BRANCH}"
          echo "WORKTREE_PATH=../analyze-${SAFE_NAME}" >> $GITHUB_ENV
          echo "SAFE_NAME=${SAFE_NAME}" >> $GITHUB_ENV

      - name: Analyze branch with Claude Code
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cd "${{ env.WORKTREE_PATH }}"
          claude \
            --print \
            --output-format plain \
            --max-turns 8 \
            --dangerously-skip-permissions \
            "Analyze the codebase and identify: (1) any hardcoded credentials or secrets, (2) deprecated API usage, (3) functions with cyclomatic complexity > 10. Be specific about file paths and line numbers." \
          > /tmp/analysis-${{ env.SAFE_NAME }}.txt

      - name: Upload analysis artifact
        uses: actions/upload-artifact@v4
        with:
          name: analysis-${{ env.SAFE_NAME }}
          path: /tmp/analysis-${{ env.SAFE_NAME }}.txt
          retention-days: 7

      - name: Cleanup
        if: always()
        run: |
          git worktree remove --force "${{ env.WORKTREE_PATH }}" || true
          git worktree prune
```

### Worktree-Based Automated Code Generation in CI

A pattern for using worktrees in CI to generate code on a feature branch without affecting the CI runner's working directory:

```yaml
# .github/workflows/generate-and-pr.yml
name: Claude Code Generation via Worktree

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - name: Checkout main
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Configure git
        run: |
          git config user.name "Claude Code Bot"
          git config user.email "claude-bot@example.com"

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Create generation branch and worktree
        run: |
          BRANCH="claude/auto-update-$(date +%Y-%m-%d)"
          git checkout -b "$BRANCH"
          git push -u origin "$BRANCH"
          # Go back to main
          git checkout main
          # Create worktree for the new branch
          git worktree add ../generation-worktree "$BRANCH"
          echo "BRANCH=$BRANCH" >> $GITHUB_ENV

      - name: Run Claude Code generation in worktree
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          cd ../generation-worktree
          claude \
            --print \
            --max-turns 20 \
            --dangerously-skip-permissions \
            "Update all API client mock files in tests/mocks/ to match the current API contracts defined in api/openapi.yaml. Each mock should have accurate response shapes and status codes. After updating, run 'go test ./tests/...' to verify the mocks compile."

      - name: Commit generated changes
        run: |
          cd ../generation-worktree
          git add tests/mocks/
          if git diff --cached --quiet; then
            echo "No changes generated"
          else
            git commit -m "chore: auto-update API mocks via Claude Code"
            git push
          fi

      - name: Create pull request
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh pr create \
            --title "chore: auto-update API mocks ($(date +%Y-%m-%d))" \
            --body "Automated API mock update generated by Claude Code. Review changes before merging." \
            --base main \
            --head "${{ env.BRANCH }}" \
            --label "automated,api-mocks"

      - name: Cleanup worktree
        if: always()
        run: |
          git worktree remove --force ../generation-worktree || true
          git worktree prune
```

### Performance Tips for Worktrees in CI

```yaml
# Use sparse checkout to reduce disk usage for large monorepos
- name: Create sparse worktree
  run: |
    git worktree add --no-checkout ../sparse-worktree feature/my-branch
    cd ../sparse-worktree
    git sparse-checkout init --cone
    git sparse-checkout set src/api src/middleware tests/api
    git checkout feature/my-branch

# Cache node_modules across worktree runs (if not using npm/yarn workspaces)
- name: Cache dependencies
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ../sparse-worktree/node_modules
    key: deps-${{ hashFiles('package-lock.json') }}

# Limit parallelism to avoid API rate limits with Claude Code
jobs:
  analyze:
    strategy:
      matrix:
        branch: [main, develop, staging]
      max-parallel: 2  # Run at most 2 branches simultaneously
```
