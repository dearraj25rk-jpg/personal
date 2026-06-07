---
title: CI/CD Integration — GitHub Actions & Automation
description: >
  Complete guide for integrating Claude Code into CI/CD pipelines — GitHub Actions,
  GitLab CI, permission modes, non-interactive flags, security hardening, cost controls,
  practical workflow patterns, and production deployment examples. Covers v2.1.126 (May 2026).
sidebar:
  order: 8
  label: CI/CD Integration
lastUpdated: 2026-06-07
---

# CI/CD Integration — GitHub Actions & Automation

> **Version:** v2.1.126 (May 19, 2026) · `anthropics/claude-code-action@v1`

Claude Code integrates natively with CI/CD pipelines through its non-interactive mode, the official GitHub Action, and a comprehensive set of automation flags. This guide covers everything from basic automated code review to advanced multi-agent CI pipelines.

```
┌─────────────────── CI/CD PIPELINE FLOW ─────────────────────────┐
│                                                                   │
│  Git Event (push/PR/comment/schedule)                            │
│       │                                                           │
│       ▼                                                           │
│  CI Runner (GitHub Actions / GitLab / Azure DevOps)              │
│       │                                                           │
│       ├─ Checkout repository                                      │
│       ├─ Configure Claude Code                                    │
│       │   (ANTHROPIC_API_KEY or Bedrock/Vertex credentials)      │
│       │                                                           │
│       ▼                                                           │
│  claude --print "task" --permission-mode bypassPermissions       │
│         --max-turns 30 --max-budget-usd 5.00 --bare             │
│       │                                                           │
│       ▼  Agentic Loop                                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Claude reads codebase → executes tools → writes result  │    │
│  │  (Read, Edit, Bash, Task, TodoWrite, ...)               │    │
│  └─────────────────────────────────────────────────────────┘    │
│       │                                                           │
│       ├─ JSON output captured (--output-format json)             │
│       ├─ Post PR comment / create issue / push commit            │
│       └─ OTel traces exported to observability stack             │
│                                                                   │
│  CLOUD OPTIONS:                                                   │
│  • Direct Anthropic API (ANTHROPIC_API_KEY)                      │
│  • AWS Bedrock (CLAUDE_CODE_USE_BEDROCK=1 + IAM role)           │
│  • GCP Vertex AI (CLAUDE_CODE_USE_VERTEX=1 + WIF)              │
└───────────────────────────────────────────────────────────────────┘
```

---

## 1. Non-Interactive Mode

Claude Code can run headlessly (no TTY) with the `--print` flag:

```bash
claude --print "Summarise the changes in this PR"
```

This prints Claude's response to stdout and exits — no REPL, no prompts, no user interaction.

### Core automation flags

| Flag | Purpose |
|------|---------|
| `--print "prompt"` | Non-interactive: run prompt, print result, exit |
| `--permission-mode <mode>` | Permission strategy (see below) |
| `--max-turns <n>` | Hard limit on agent turns (prevents runaway sessions) |
| `--max-budget-usd <n>` | Hard spend limit in USD per session |
| `--model <model>` | Override model for this session |
| `--effort <level>` | Override effort level (`low`, `normal`, `high`, `xhigh`) |
| `--output-format <format>` | `text` (default) or `json` |
| `--output-format json` | Machine-readable output with usage stats |
| `--agent <name>` | Use a specific agent definition |
| `--no-markdown` | Plain text output (no markdown formatting) |
| `-c` | Resume most recent session |
| `-r` | Interactive session picker (not useful in CI) |
| `--bare` | CI-optimised mode (v2.1.92+): 14% faster, skips non-essential startup |

### Permission modes

| Mode | Behaviour | Use case |
|------|-----------|----------|
| `default` | Prompts for each tool (blocks in CI) | Interactive sessions only |
| `acceptEdits` | Auto-accepts file edits, prompts for Bash | Supervised automation |
| `autoAccept` | Auto-accepts all tools | Trusted automation |
| `bypassPermissions` | Bypasses all permission checks | CI with sandboxing |
| `plan` | Never executes tools, plan only | Dry runs |

**For CI/CD:** use `bypassPermissions` inside a properly sandboxed environment (Docker container, GitHub Actions runner with no production access). Use `autoAccept` for less-sandboxed environments where you want some protection.

### JSON output format

```bash
claude --print "Analyse src/api/" \
       --output-format json \
       --permission-mode bypassPermissions
```

Returns:

```json
{
  "response": "Analysis: ...",
  "usage": {
    "input_tokens": 12453,
    "output_tokens": 823,
    "cache_read_input_tokens": 8200,
    "cost_usd": 0.043
  },
  "session_id": "sess_01abc...",
  "turns": 7
}
```

### Why `--output-format stream-json` matters in CI

When Claude Code processes a complex task, it runs an agentic loop — multiple turns, multiple tool calls, potentially many minutes of work. The three output formats behave very differently in this context:

```
--output-format text        (default)
  Streams Claude's final response text to stdout.
  Tool call results are NOT emitted on stdout.
  You see the final answer, but nothing in between.
  Suitable for: human-readable one-shot queries.
  Problem in CI: you can't distinguish Claude's reasoning from errors;
  you can't track cost or token usage; you can't detect tool failures.

--output-format json
  Waits until the ENTIRE session completes, then emits one JSON blob.
  The blob contains the final response text and usage stats.
  Suitable for: simple CI tasks where you only care about the final answer.
  Problem in CI: the runner appears hung with no output during long tasks.
  Many CI systems have "no output" timeouts (e.g., GitHub Actions kills
  jobs with no stdout for 10 minutes). Also blocks on OOM if output is large.

--output-format stream-json
  Emits one JSON object per line on stdout as each event occurs.
  Events: system, assistant (per turn), tool_result (per tool call), result.
  The stream is live — you see events within milliseconds of them happening.
  Suitable for: all CI/CD use cases, SDK usage, progress tracking, cost attribution.
  This is the format the SDK uses internally.
```

**Key advantages of `stream-json` in CI:**

1. **Prevents "silent timeout" kills**: Since events stream continuously during tool execution, the runner always has recent output. CI systems that kill jobs for inactivity (no stdout for N minutes) will not kill an active Claude Code job using `stream-json`.

2. **Per-turn cost visibility**: Each `result` event (end of a turn) contains `cost_usd`, `input_tokens`, and `output_tokens`. You can track spend in real time and kill the job early if cost is anomalous.

3. **Tool-level audit logging**: Every `tool_result` event includes the tool name, its inputs, and its output. This lets you build complete audit trails of what Claude read, wrote, or executed — critical for compliance in regulated environments.

4. **Structured error detection**: An `error` event with `is_error: true` is machine-readable. With `text` output, you have to parse Claude's natural language explanation of an error, which is fragile.

5. **Progress indicators**: CI dashboards can show "Turn 7/30 | Tool: Bash | Cost so far: $0.12" by parsing the stream, rather than showing a blank progress bar.

**Using `stream-json` in shell scripts:**

```bash
# Parse stream-json output in bash using jq
claude --print "Review src/api/ for security issues" \
       --output-format stream-json \
       --permission-mode bypassPermissions \
       --max-budget-usd 2.00 \
       --bare | while IFS= read -r line; do
    
    TYPE=$(echo "$line" | jq -r '.type // empty' 2>/dev/null)
    
    case "$TYPE" in
        system)
            SESSION_ID=$(echo "$line" | jq -r '.session_id')
            echo "[CI] Session: $SESSION_ID"
            ;;
        assistant)
            # Print text blocks in real time
            echo "$line" | jq -r '.message.content[] | select(.type=="text") | .text' 2>/dev/null
            ;;
        tool_result)
            IS_ERROR=$(echo "$line" | jq -r '.is_error')
            if [ "$IS_ERROR" = "true" ]; then
                echo "[WARN] Tool error detected"
            fi
            ;;
        result)
            COST=$(echo "$line" | jq -r '.cost_usd')
            TURNS=$(echo "$line" | jq -r '.num_turns')
            STOP=$(echo "$line" | jq -r '.stop_reason')
            echo "[CI] Done: $TURNS turns, \$$COST, stop=$STOP"
            ;;
        error)
            CODE=$(echo "$line" | jq -r '.code')
            ERR=$(echo "$line" | jq -r '.error')
            echo "[ERROR] $CODE: $ERR" >&2
            exit 1
            ;;
    esac
done
```

**Recommendation**: Always use `--output-format stream-json` in CI/CD, especially for tasks that take more than 30 seconds. Use `--output-format json` only for fast, simple queries where you just need the final answer and silence during execution is acceptable.

---

## 2. GitHub Actions — Official Integration

### 2.1 The `anthropics/claude-code-action@v1`

The official GitHub Action lets Claude Code respond to PR comments, run automated reviews, and execute tasks triggered by GitHub events.

**Setup (one-time):**

1. Add `ANTHROPIC_API_KEY` to your repository's Actions secrets
2. Add the workflow file

### 2.2 Complete Workflow — All Available Inputs

This reference shows every available input for `claude-code-action@v1`:

```yaml
# .github/workflows/claude-all-options.yml
name: Claude Code — Full Input Reference

on:
  pull_request:
    types: [opened, synchronize, reopened]
  issue_comment:
    types: [created]

jobs:
  claude:
    runs-on: ubuntu-latest
    permissions:
      contents: write          # required for file edits + commits
      pull-requests: write     # required for PR comments
      issues: write            # required for issue comments
      checks: write            # optional: for check run status
      id-token: write          # required for OIDC (Bedrock/Vertex WIF)

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0        # full history (important for git diff)

      - name: Claude Code Action
        uses: anthropics/claude-code-action@v1
        with:
          # ── Authentication (pick ONE approach) ──────────────────────────
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          # use_bedrock: "true"                      # use AWS Bedrock
          # use_vertex: "true"                       # use GCP Vertex
          # aws_region: "us-east-1"
          # gcp_project_id: ${{ vars.GCP_PROJECT_ID }}

          # ── Model ────────────────────────────────────────────────────────
          model: "claude-sonnet-4-6"
          # model: "claude-haiku-4-5"                # fast + cheap
          # model: "claude-opus-4-7"                 # max capability

          # ── Effort ───────────────────────────────────────────────────────
          effort: "normal"                           # low | normal | high | xhigh

          # ── The prompt ───────────────────────────────────────────────────
          prompt: |
            Review this pull request for quality and security.

          # ── Comment trigger phrase ───────────────────────────────────────
          # trigger_phrase: "@claude"

          # ── Permission mode ──────────────────────────────────────────────
          permission_mode: "bypassPermissions"
          # permission_mode: "autoAccept"            # less strict
          # permission_mode: "acceptEdits"           # edits only, prompts for Bash

          # ── Limits ───────────────────────────────────────────────────────
          max_turns: "20"
          max_budget_usd: "2.00"

          # ── Output ───────────────────────────────────────────────────────
          output_format: "text"                      # text | json

          # ── Additional environment variables ─────────────────────────────
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          DISABLE_UPDATES: "1"                       # block auto-update in CI
```

### 2.3 PR Auto-Review on Every Push

```yaml
# .github/workflows/claude-review.yml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Claude Code Review
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Review this pull request for:
            1. Security vulnerabilities (SQL injection, XSS, command injection, hardcoded secrets)
            2. Performance issues (N+1 queries, missing indexes, O(n²) loops)
            3. Missing error handling and edge cases
            4. Test coverage for new/changed functions
            5. Breaking API changes not reflected in version bump

            For each issue found, provide:
            - File path and line number
            - Severity: critical / major / minor
            - Explanation
            - Suggested fix

            If no issues are found, say "LGTM ✓" with a brief summary.
          permission_mode: bypassPermissions
          max_turns: "20"
```

### 2.3 Respond to PR Comments

Claude responds when someone mentions `@claude` in a PR comment:

```yaml
# .github/workflows/claude-on-comment.yml
name: Claude Responds to Comments

on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  claude-respond:
    if: contains(github.event.comment.body, '@claude')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write

    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha || github.sha }}
          fetch-depth: 0

      - name: Claude responds to comment
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          trigger_phrase: "@claude"
          permission_mode: autoAccept
          max_turns: "30"
          max_budget_usd: "2.00"
```

Now anyone on the team can ask Claude to fix issues, explain code, or implement suggestions directly in PR comments:

```
@claude Fix the null pointer exception on line 47 of UserService.cs
@claude Add unit tests for the updateUser method
@claude Explain why this regex is correct
```

### 2.4 Automated Bug Fixer

```yaml
# .github/workflows/claude-fix-tests.yml
name: Auto-Fix Failing Tests

on:
  push:
    branches: [main, dev]

jobs:
  fix-if-failing:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - name: Run tests
        id: tests
        run: npm test
        continue-on-error: true

      - name: Claude fixes failing tests
        if: steps.tests.outcome == 'failure'
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            The test suite is failing. Your job:
            1. Run the tests to see the failures: `npm test`
            2. Analyse each failure
            3. Fix the root cause (not just the tests themselves)
            4. Run tests again to confirm they pass
            5. Create a commit with a descriptive message
            
            Rules:
            - Fix actual bugs, not test expectations (unless tests were wrong)
            - Don't use `--force` or skip any tests
            - If you can't fix something, explain why and leave a TODO comment
          permission_mode: autoAccept
          max_turns: "40"
          max_budget_usd: "5.00"

      - name: Create PR with fixes
        if: steps.tests.outcome == 'failure'
        run: |
          git config user.name "Claude Code"
          git config user.email "claude@anthropic.com"
          BRANCH="claude/fix-tests-$(date +%Y%m%d-%H%M%S)"
          git checkout -b "$BRANCH"
          git push origin "$BRANCH"
          gh pr create --title "fix: auto-fix failing tests [Claude]" \
            --body "Automated fix generated by Claude Code" \
            --base main
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 2.5 Security Audit on Schedule

```yaml
# .github/workflows/weekly-security-audit.yml
name: Weekly Security Audit

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am UTC
  workflow_dispatch:

jobs:
  security-audit:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Claude Security Audit
        id: audit
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Perform a comprehensive security audit of this codebase.
            Focus on:
            - OWASP Top 10 vulnerabilities
            - Dependency vulnerabilities (check package.json / requirements.txt / *.csproj)
            - Hardcoded secrets or credentials
            - Insecure cryptography usage
            - Input validation gaps
            - Authentication/authorisation bypasses
            - Sensitive data exposure
            
            Output a JSON report with structure:
            { "critical": [...], "high": [...], "medium": [...], "info": [...] }
            where each item is: { "file": "...", "line": N, "issue": "...", "recommendation": "..." }
          permission_mode: bypassPermissions
          output_format: json
          max_turns: "50"

      - name: Create GitHub Issue with Report
        uses: actions/github-script@v7
        with:
          script: |
            const report = JSON.parse('${{ steps.audit.outputs.response }}');
            const critical = report.critical || [];
            const high = report.high || [];
            
            if (critical.length + high.length === 0) return;
            
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `Security Audit — ${new Date().toISOString().split('T')[0]}`,
              body: `## Weekly Security Audit\n\n${JSON.stringify(report, null, 2)}`,
              labels: ['security', 'automated']
            });
```

---

## 3. GitLab CI Integration

### Basic Merge Request Review

```yaml
# .gitlab-ci.yml
claude-review:
  stage: review
  image: node:20
  before_script:
    - npm install -g @anthropic-ai/claude-code
  script:
    - |
      claude --print "
        Review the changes in this merge request.
        Diff: $(git diff origin/main...HEAD)
        
        Focus on: security, performance, maintainability.
        Output in GitLab markdown format.
      " \
      --permission-mode bypassPermissions \
      --max-turns 20 \
      --bare
  only:
    - merge_requests
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
```

### GitLab CI Integration

```yaml
# .gitlab-ci.yml
claude-code-review:
  stage: review
  image: node:22-slim
  before_script:
    - npm install -g @anthropic-ai/claude-code
  script:
    - claude -p "Review this MR for bugs, security issues, and style problems.
        Output findings as a structured report." \
        --permission-mode default \
        --max-turns 15 \
        --bare \
        --output-format json > review-output.json
    - cat review-output.json
  artifacts:
    paths:
      - review-output.json
    expire_in: 7 days
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY    # Set in GitLab CI/CD variables

# With Bedrock (no API key needed)
claude-code-bedrock:
  stage: review
  image: public.ecr.aws/amazonlinux/amazonlinux:2023
  script:
    - pip install @anthropic-ai/claude-code
    - claude -p "Analyse for security vulnerabilities" \
        --permission-mode autoAccept \
        --bare
  variables:
    CLAUDE_CODE_USE_BEDROCK: "1"
    AWS_DEFAULT_REGION: "us-east-1"
  id_tokens:
    AWS_OIDC_TOKEN:
      aud: sts.amazonaws.com
```

### Full GitLab CI Multi-Stage Pipeline

```yaml
# .gitlab-ci.yml — Multi-stage Claude pipeline with security gate, review, and comment posting
stages:
  - validate
  - analyse
  - report

variables:
  DISABLE_UPDATES: "1"
  # ANTHROPIC_API_KEY must be set in GitLab CI/CD → Variables (masked)

# ── Stage 1: Fast security scan ────────────────────────────────────────────────
claude-security-scan:
  stage: validate
  image: node:20-slim
  before_script:
    - npm install -g @anthropic-ai/claude-code@latest --silent
  script:
    - |
      CHANGED=$(git diff origin/$CI_MERGE_REQUEST_TARGET_BRANCH_NAME...HEAD --name-only 2>/dev/null || git diff HEAD~1 --name-only)
      
      RESULT=$(claude --print "
        Security scan of changed files: $CHANGED
        
        Check for: hardcoded secrets, SQL injection, XSS, SSRF, command injection.
        Output CLEAN if no issues found.
        Otherwise list: SEVERITY|FILE:LINE|ISSUE
        Use CRITICAL for exploitable vulnerabilities.
      " \
      --model claude-haiku-4-5 \
      --permission-mode bypassPermissions \
      --max-turns 10 \
      --max-budget-usd 0.50 \
      --bare 2>/dev/null)
      
      echo "$RESULT"
      
      # Block merge if critical issues found
      if echo "$RESULT" | grep -q "^CRITICAL"; then
        echo "SECURITY GATE: Critical vulnerabilities detected. Merge blocked."
        exit 1
      fi
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
  environment:
    name: security-scan

# ── Stage 2: Code quality review ───────────────────────────────────────────────
claude-code-review:
  stage: analyse
  image: node:20-slim
  needs:
    - job: claude-security-scan
      optional: false
  before_script:
    - npm install -g @anthropic-ai/claude-code@latest --silent
    - apt-get update -q && apt-get install -yq git curl jq
  script:
    - |
      claude --print "
        Review this GitLab merge request for code quality.
        MR: $CI_MERGE_REQUEST_TITLE ($CI_MERGE_REQUEST_SOURCE_BRANCH_NAME → $CI_MERGE_REQUEST_TARGET_BRANCH_NAME)
        Project: $CI_PROJECT_NAME
        
        Check the changed files. Provide a structured review:
        1. Summary of what changed
        2. Code quality issues (file:line references)
        3. Test coverage gaps
        4. Performance concerns
        5. Positive highlights
        
        Format as GitLab Flavored Markdown.
      " \
      --model claude-sonnet-4-6 \
      --permission-mode bypassPermissions \
      --max-turns 25 \
      --max-budget-usd 2.00 \
      --bare > code-review.md 2>/dev/null
      
      cat code-review.md
  artifacts:
    paths:
      - code-review.md
    expire_in: 2 weeks
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

# ── Stage 3: Post review as MR comment ─────────────────────────────────────────
post-mr-comment:
  stage: report
  image: alpine:latest
  needs:
    - job: claude-code-review
      artifacts: true
  before_script:
    - apk add --no-cache curl jq
  script:
    - |
      REVIEW=$(cat code-review.md | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || cat code-review.md)
      
      curl --silent --fail \
        --request POST \
        --header "PRIVATE-TOKEN: $GITLAB_TOKEN" \
        --header "Content-Type: application/json" \
        --data "{\"body\": \"## Claude Code Review\n\n$(cat code-review.md)\"}" \
        "$CI_API_V4_URL/projects/$CI_PROJECT_ID/merge_requests/$CI_MERGE_REQUEST_IID/notes"
      
      echo "Review posted to MR #$CI_MERGE_REQUEST_IID"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      when: on_success
```

---

## 4. Bash / Shell Integration

### One-off task runner

```bash
#!/bin/bash
# scripts/claude-run.sh — generic Claude task runner for shell scripts

PROMPT="$1"
MAX_TURNS="${2:-20}"
BUDGET="${3:-2.00}"

claude --print "$PROMPT" \
       --permission-mode bypassPermissions \
       --max-turns "$MAX_TURNS" \
       --max-budget-usd "$BUDGET" \
       --bare \
       --output-format json
```

### Pre-commit hook integration

```bash
#!/bin/bash
# .git/hooks/pre-commit

STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)
if [ -z "$STAGED_FILES" ]; then exit 0; fi

echo "Running Claude security check on staged files..."

RESULT=$(echo "Check these staged files for security issues: $STAGED_FILES" | \
  claude --print "$(cat)" \
         --permission-mode bypassPermissions \
         --max-turns 5 \
         --bare 2>/dev/null)

if echo "$RESULT" | grep -qi "critical\|CRITICAL"; then
  echo "Claude detected a critical security issue:"
  echo "$RESULT"
  echo "Commit blocked. Fix the issue or use --no-verify to bypass."
  exit 1
fi

exit 0
```

### Makefile integration

```makefile
# Makefile
.PHONY: ai-review ai-fix ai-docs

ai-review:
	claude --print "Review all files changed since last commit for issues" \
	       --permission-mode bypassPermissions \
	       --max-turns 20 \
	       --bare

ai-fix:
	claude --print "Run all tests, fix any failures, then run tests again to confirm" \
	       --permission-mode autoAccept \
	       --max-turns 40 \
	       --bare

ai-docs:
	claude --print "Update all docstrings and JSDoc comments for recently changed functions" \
	       --permission-mode autoAccept \
	       --max-turns 30 \
	       --bare
```

---

## 5. Bedrock & Vertex in CI/CD

### AWS Bedrock — with OIDC (Recommended)

Using GitHub Actions OIDC avoids storing long-lived AWS credentials as secrets. GitHub Actions authenticates directly with AWS using short-lived tokens:

```yaml
# .github/workflows/claude-bedrock-oidc.yml
name: Claude via Bedrock (OIDC)

permissions:
  id-token: write        # required for OIDC token exchange
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      # OIDC authentication — no long-lived credentials stored in secrets
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsClaudeRole
          role-session-name: claude-code-ci
          aws-region: us-east-1

      - name: Run Claude via Bedrock
        uses: anthropics/claude-code-action@v1
        with:
          use_bedrock: "true"
          aws_region: us-east-1
          model: claude-sonnet-4-6
          prompt: "Review this PR for security and code quality"
          permission_mode: bypassPermissions
          max_turns: "20"
          max_budget_usd: "2.00"
        env:
          CLAUDE_CODE_USE_BEDROCK: "1"
          CLAUDE_CODE_BEDROCK_SERVICE_TIER: "default"  # default | flex | priority
```

**AWS IAM policy for the GitHub Actions role:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockClaudeAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6-*",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-haiku-4-5-*",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-opus-4-7-*"
      ]
    }
  ]
}
```

**Trust policy for the OIDC role (allows GitHub Actions from your repo):**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:your-org/your-repo:*"
        }
      }
    }
  ]
}
```

### AWS Bedrock — with Static Access Keys (not recommended)

```yaml
# Use OIDC above instead. Static keys are included for reference only.
env:
  CLAUDE_CODE_USE_BEDROCK: "1"
  AWS_REGION: us-east-1
  CLAUDE_CODE_BEDROCK_SERVICE_TIER: "default"

steps:
  - name: Configure AWS credentials (static keys)
    uses: aws-actions/configure-aws-credentials@v4
    with:
      aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
      aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      aws-region: us-east-1

  - name: Run Claude Code
    uses: anthropics/claude-code-action@v1
    with:
      use_bedrock: "true"
      aws_region: us-east-1
      prompt: "Review this PR"
```

**Service tiers (v2.1.122+):**
- `default` — standard capacity, predictable latency
- `flex` — lower cost, variable latency (best for non-time-critical CI)
- `priority` — highest throughput, premium pricing (best for blocking checks)

### Google Cloud Vertex AI — with Workload Identity Federation

Workload Identity Federation (WIF) eliminates the need for service account key files in CI:

```yaml
# .github/workflows/claude-vertex-wif.yml
name: Claude via Vertex AI (WIF)

permissions:
  id-token: write        # required for WIF token exchange
  contents: read
  pull-requests: write

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      # WIF authentication — no service account JSON key stored in secrets
      - name: Authenticate to GCP (WIF)
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          # Format: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID
          service_account: ${{ secrets.GCP_SA_EMAIL }}
          # Format: sa-name@project-id.iam.gserviceaccount.com

      - name: Run Claude via Vertex AI
        uses: anthropics/claude-code-action@v1
        with:
          use_vertex: "true"
          prompt: "Review this PR for security and code quality"
          permission_mode: bypassPermissions
          max_turns: "20"
          max_budget_usd: "2.00"
        env:
          CLAUDE_CODE_USE_VERTEX: "1"
          CLOUD_ML_REGION: us-central1
          ANTHROPIC_VERTEX_PROJECT_ID: ${{ vars.GCP_PROJECT_ID }}
```

**GCP setup commands for WIF:**

```bash
PROJECT_ID="your-project-id"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
REPO="your-org/your-repo"
SA_NAME="claude-code-ci"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Create the service account
gcloud iam service-accounts create $SA_NAME \
  --project=$PROJECT_ID \
  --display-name="Claude Code CI Service Account"

# Grant Vertex AI access
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/aiplatform.user"

# Create Workload Identity Pool
gcloud iam workload-identity-pools create "github-actions" \
  --project=$PROJECT_ID \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc "github" \
  --project=$PROJECT_ID \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Allow GitHub Actions from your repo to impersonate the SA
gcloud iam service-accounts add-iam-policy-binding "$SA_EMAIL" \
  --project=$PROJECT_ID \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-actions/attribute.repository/${REPO}"

# Get the WIF provider resource name (set as WIF_PROVIDER secret)
gcloud iam workload-identity-pools providers describe "github" \
  --project=$PROJECT_ID \
  --location="global" \
  --workload-identity-pool="github-actions" \
  --format="value(name)"
```

---

## 6. Security Hardening for CI/CD

### 6.1 Principle of least privilege

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write",
      "Edit",
      "MultiEdit",
      "Bash(git:*)",
      "Bash(npm test)",
      "Bash(npm run lint)",
      "Bash(python -m pytest)"
    ],
    "deny": [
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(ssh:*)",
      "WebFetch",
      "WebSearch"
    ]
  }
}
```

### 6.2 Secret handling

```yaml
# Never pass secrets in prompt text — use env vars
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  DATABASE_URL: ${{ secrets.DATABASE_URL }}  # Available to hooks/scripts but NOT in prompts
```

### 6.3 Budget limits — `--max-budget-usd` in depth

Always set `--max-budget-usd` in CI:

```bash
claude --print "..." \
       --max-budget-usd 5.00 \
       --max-turns 30
```

The session terminates if either limit is hit. This prevents runaway costs from infinite loops.

**How `--max-budget-usd` works internally:**

The budget is checked at the end of each agent turn (after each Claude API response completes). If the cumulative `cost_usd` for the session exceeds the limit, Claude Code:

1. Stops calling tools immediately (no partial tool execution)
2. Emits a `result` event with `stop_reason: "budget_exceeded"` and the accumulated output so far
3. Exits with code 0 (not a crash — it is a clean stop)

This means: any work Claude completed before the limit was hit is preserved. If Claude edited 5 files before the budget ran out, those 5 edits exist on disk. You get partial output, not nothing.

**What cost does the budget count?**

The `cost_usd` counter includes:
- All input tokens (including the CLAUDE.md loaded into context)
- All output tokens (Claude's reasoning and responses)
- Cache write tokens (one-time cost for populating the prompt cache)
- Cache read tokens (discounted, but still counted)

It does NOT include: your tool execution cost (running `npm test` costs nothing in the budget counter), MCP server calls, or external API calls your code makes.

**Recommended budget limits by task type:**

| Task | Recommended budget | Notes |
|---|---|---|
| PR diff security scan (Haiku) | `$0.10–0.25` | Simple pattern matching |
| PR code review (Sonnet) | `$0.50–1.00` | Full diff analysis |
| Automated test fix (Sonnet) | `$1.00–3.00` | May need multiple fix-test cycles |
| Codebase refactoring (Opus) | `$5.00–15.00` | Complex, multi-file changes |
| Full security audit (Opus) | `$5.00–20.00` | Whole codebase scan |
| One-off CI syntax check (Haiku) | `$0.05` | Trivial tasks |

**Budget vs turns — which limit fires first?**

Use both limits together. They guard against different failure modes:

```
--max-turns guards against:  Infinite reasoning loops where Claude repeatedly
                              calls tools but makes no progress. Cost per turn
                              may be low, but turns accumulate.

--max-budget-usd guards against: A single expensive turn (e.g., Claude reads
                              a massive codebase in one tool call, generating
                              100K input tokens). One turn can exhaust the
                              budget even with max-turns=50.

Best practice: Set both. Use max-turns ~3× higher than you expect the task
to take, and max-budget-usd at your actual spend ceiling.
```

**Detecting a budget stop in shell scripts:**

```bash
OUTPUT=$(claude --print "..." \
    --output-format stream-json \
    --max-budget-usd 1.00 \
    --max-turns 20 \
    --bare)

STOP_REASON=$(echo "$OUTPUT" | jq -r 'select(.type=="result") | .stop_reason')

if [ "$STOP_REASON" = "budget_exceeded" ]; then
    echo "[WARNING] Budget limit reached. Partial output may be available."
    # Inspect what was completed before the limit
    echo "$OUTPUT" | jq -r 'select(.type=="assistant") | .message.content[].text // empty'
    exit 2   # Distinct exit code for budget stops
fi
```

**Setting organisation-wide budget defaults:**

For teams with many pipelines, set a default budget in `managed-settings.json` so individual pipelines that forget `--max-budget-usd` still have a fallback:

```json
{
  "env": {
    "CLAUDE_BUDGET_USD": "5.00",
    "CLAUDE_MAX_TURNS": "30"
  }
}
```

Individual `--max-budget-usd` flags override these defaults.

### 6.4 Network isolation

In Docker:

```dockerfile
FROM ubuntu:24.04
RUN apt-get install -y claude-code

# Block internet access except Anthropic API
RUN iptables -A OUTPUT -d api.anthropic.com -j ACCEPT && \
    iptables -A OUTPUT -j DROP
```

Or use GitHub's `permissions: {}` to restrict GITHUB_TOKEN scope.

---

## 7. Cost Optimisation for CI/CD

### Model selection strategy

```bash
# Simple tasks: use Haiku (10-20× cheaper)
claude --print "Check if these files have syntax errors: $FILES" \
       --model claude-haiku-4-5 \
       --effort low

# Complex reasoning: use Sonnet
claude --print "Review the architectural decisions in this PR" \
       --model claude-sonnet-4-6 \
       --effort normal

# Critical analysis: use Opus
claude --print "Perform a complete security audit" \
       --model claude-opus-4-7 \
       --effort high
```

### Prompt caching in CI

For workflows with a large, stable system prompt (code review checklist, style guide, etc.), enable caching:

```yaml
env:
  ANTHROPIC_CACHE_ENABLED: "1"
  CLAUDE_CODE_DISABLE_TELEMETRY: "0"  # Telemetry required for cache TTL fix (v2.1.108+)
```

First run: full cost. Subsequent runs within 1 hour: ~90% reduction on cached tokens.

### `--bare` mode (v2.1.92+)

```bash
claude --print "..." --bare
```

`--bare` skips non-essential startup operations (animation, tips, update checks) — **14% faster** in CI.

### Cost Optimization in CI

| Technique | Savings | Implementation |
|-----------|---------|---------------|
| Use `--bare` mode | 14% faster/cheaper | Always add `--bare` to CI commands |
| Use Haiku for simple tasks | 80% cheaper | `--model haiku claude ...` |
| Set `--max-budget-usd` | Prevent runaway costs | `--max-budget-usd 0.50` for PR reviews |
| Set `--max-turns` | Prevent long loops | `--max-turns 10` for most CI tasks |
| Cache prompt context | 70-75% token savings | Same API key, same CLAUDE.md = cache hits |
| Use `--output-format json` | Structured parsing | Avoid post-processing text output |
| Run only on changed files | Scope reduction | `git diff --name-only HEAD~1 \| claude -p "review: $(cat -)"` |

---

## 8. OpenTelemetry / Observability

Claude Code emits OpenTelemetry traces for all tool calls, turns, and sessions.

```bash
# Enable OpenTelemetry export
export OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
export OTEL_SERVICE_NAME=claude-code-ci

claude --print "..." --permission-mode bypassPermissions
```

Traces include:
- Session ID, session duration
- Per-turn token counts (input, output, cache_read, cache_write)
- Per-tool-call name, arguments, duration, success/failure
- Model name and effort level
- Cost estimate per turn

---

## 9. Complete Production Workflow Example

A real-world CI pipeline for a team that uses Claude Code for automated quality assurance:

```yaml
# .github/workflows/ai-qa-pipeline.yml
name: AI Quality Assurance Pipeline

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  # Job 1: Fast security scan (Haiku, cheap)
  security-scan:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          model: claude-haiku-4-5
          effort: normal
          max_turns: "10"
          max_budget_usd: "0.50"
          permission_mode: bypassPermissions
          prompt: |
            Scan changed files for: hardcoded secrets, SQL injection, XSS, SSRF.
            List only critical and high issues. Format: SEVERITY|FILE:LINE|ISSUE.
            Output CLEAN if no issues found.

  # Job 2: Comprehensive review (Sonnet, balanced)
  code-review:
    runs-on: ubuntu-latest
    needs: security-scan
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          model: claude-sonnet-4-6
          effort: normal
          max_turns: "25"
          max_budget_usd: "2.00"
          permission_mode: bypassPermissions
          prompt: |
            Review this PR for code quality, performance, and maintainability.
            Post your review as a PR comment with GitHub markdown.
            Include: summary, issues found (with file:line references), suggestions.

  # Job 3: Test gap analysis (Sonnet)
  test-analysis:
    runs-on: ubuntu-latest
    needs: security-scan
    permissions:
      pull-requests: write
      contents: read
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          model: claude-sonnet-4-6
          effort: normal
          max_turns: "15"
          max_budget_usd: "1.00"
          permission_mode: bypassPermissions
          prompt: |
            Identify all new and changed functions in this PR.
            Check if each has adequate test coverage.
            List functions that need tests added.
```

---

## 10. Environment Variables Reference (CI/CD)

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | API authentication (direct Anthropic) |
| `CLAUDE_CODE_USE_BEDROCK=1` | Route to AWS Bedrock |
| `CLAUDE_CODE_USE_VERTEX=1` | Route to GCP Vertex |
| `CLAUDE_CODE_BEDROCK_SERVICE_TIER` | `default` / `flex` / `priority` (v2.1.122+) |
| `CLOUD_ML_REGION` | Vertex region |
| `ANTHROPIC_VERTEX_PROJECT_ID` | GCP project ID |
| `CLAUDE_CODE_DISABLE_TELEMETRY=1` | Disable telemetry (note: may affect cache TTL) |
| `DISABLE_UPDATES=1` | Block auto-update (v2.1.118+) — essential in CI |
| `CLAUDE_MAX_TURNS` | Default max turns (overridden by `--max-turns`) |
| `CLAUDE_BUDGET_USD` | Default budget (overridden by `--max-budget-usd`) |

---

## 11. Azure DevOps Integration

### Azure DevOps Integration

```yaml
# azure-pipelines.yml
trigger:
  - main
  - feature/*

pool:
  vmImage: 'ubuntu-latest'

steps:
  - task: NodeTool@0
    inputs:
      versionSpec: '22.x'
    displayName: 'Install Node.js'

  - script: npm install -g @anthropic-ai/claude-code
    displayName: 'Install Claude Code'

  - script: |
      claude -p "$(reviewPrompt)" \
        --permission-mode autoAccept \
        --max-turns 20 \
        --bare \
        --output-format json
    displayName: 'Run Claude Code Review'
    env:
      ANTHROPIC_API_KEY: $(ANTHROPIC_API_KEY)  # From Azure Key Vault / pipeline variable
      reviewPrompt: "Review this PR for correctness, security issues, and test coverage"

  # With Azure AI (Vertex equivalent)
  - script: |
      claude -p "$(reviewPrompt)" --permission-mode autoAccept
    env:
      CLAUDE_CODE_USE_VERTEX: "1"
      GOOGLE_CLOUD_PROJECT: $(GCP_PROJECT_ID)
      GOOGLE_APPLICATION_CREDENTIALS: /tmp/sa-key.json
    displayName: 'Run with Vertex AI'
```

### Full Azure DevOps Multi-Stage Pipeline

```yaml
# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
      - feature/*
pr:
  branches:
    include:
      - main

pool:
  vmImage: ubuntu-latest

variables:
  ANTHROPIC_API_KEY: $(anthropicApiKey)  # Set in Library → Variable Groups
  DISABLE_UPDATES: "1"

stages:
  - stage: ClaudeReview
    displayName: Claude Code Quality Gate
    jobs:
      - job: SecurityScan
        displayName: Security Scan (Haiku, fast)
        steps:
          - checkout: self
            fetchDepth: 0
          - script: |
              npm install -g @anthropic-ai/claude-code
              claude --print "Scan changed files for OWASP Top 10 security issues. Output JSON: {issues: [{severity, file, line, desc}]}" \
                     --model claude-haiku-4-5 \
                     --effort normal \
                     --permission-mode bypassPermissions \
                     --max-turns 10 \
                     --max-budget-usd 0.50 \
                     --bare \
                     --output-format json > $(Build.ArtifactStagingDirectory)/security-scan.json
            displayName: Run Claude Security Scan
            env:
              ANTHROPIC_API_KEY: $(anthropicApiKey)
          - publish: $(Build.ArtifactStagingDirectory)/security-scan.json
            artifact: security-report

      - job: CodeReview
        displayName: Code Review (Sonnet, balanced)
        dependsOn: SecurityScan
        steps:
          - checkout: self
            fetchDepth: 0
          - script: |
              npm install -g @anthropic-ai/claude-code
              claude --print "Review this PR for code quality, performance, and test coverage. Post findings as markdown." \
                     --model claude-sonnet-4-6 \
                     --effort normal \
                     --permission-mode bypassPermissions \
                     --max-turns 20 \
                     --max-budget-usd 2.00 \
                     --bare
            displayName: Run Claude Code Review
            env:
              ANTHROPIC_API_KEY: $(anthropicApiKey)
```

### Azure with AWS Bedrock

```yaml
variables:
  CLAUDE_CODE_USE_BEDROCK: "1"
  AWS_REGION: us-east-1
  CLAUDE_CODE_BEDROCK_SERVICE_TIER: flex  # Cost-optimised for CI

steps:
  - task: AWSShellScript@1
    inputs:
      awsCredentials: MyAWSServiceConnection
      regionName: us-east-1
      scriptType: inline
      inlineScript: |
        npm install -g @anthropic-ai/claude-code
        claude --print "Review this PR" \
               --permission-mode bypassPermissions \
               --max-turns 20 \
               --bare
```

---

## 12. CI/CD Security Hardening Checklist

```
BEFORE DEPLOYING CLAUDE IN CI/CD:

Authentication
  ☐ API key stored in secrets manager (not hardcoded, not in logs)
  ☐ IAM role for Bedrock (no static keys if possible)
  ☐ WIF for Vertex AI (no service account keys in CI)
  ☐ Minimum permissions on GITHUB_TOKEN (contents: read, pull-requests: write)

Spend Control
  ☐ --max-budget-usd set on every automated run
  ☐ --max-turns set on every automated run
  ☐ DISABLE_UPDATES=1 to prevent unexpected version changes
  ☐ Budget alert configured in billing (Anthropic Console / AWS / GCP)

Network Isolation
  ☐ Docker container with iptables / network policy restricting egress
  ☐ WebFetch and WebSearch in deny list (unless explicitly needed)
  ☐ Bash curl/wget/ssh in deny list

Access Control
  ☐ MCP servers configured with minimum-scope tokens
  ☐ Tool allowlist defined in .claude/settings.json
  ☐ No production database or deployment access from CI Claude
  ☐ Separate CI-specific API key (not developer's personal key)

Observability
  ☐ OTel exporter configured → observability stack
  ☐ Session logs retained for audit (JSONL at ~/.claude/logs/)
  ☐ Spend monitoring dashboard configured
  ☐ Alert on spend anomalies (e.g., >$10/run is unusual)

Content Safety
  ☐ PR comments from users don't directly control Claude's actions
     (use trigger_phrase pattern, not raw comment body)
  ☐ Prompt injection mitigations in place (validate input before passing to Claude)
  ☐ Claude output reviewed before being posted publicly if sensitive
```

---

## Related Guides

- [CLI Technical Reference](./claude-code-reference) — Section 21: GitHub Actions (full API)
- [Hooks System](./hooks-deep-dive) — hooks for CI/CD automation
- [Permissions & Security](./permissions-security) — `bypassPermissions` and allowlists
- [Agent Teams Guide](./agent-teams-guide) — multi-agent CI pipelines
- [Models & Pricing](./models-pricing) — CI/CD cost optimisation with Haiku and Bedrock
- [Efficiency Reference](./claude-code-efficiency-reference) — cost optimisation for CI

---

## Azure Workload Identity Federation

Parallel to GCP Workload Identity Federation (WIF), Azure offers Workload Identity Federation for authentication without storing service principal credentials in CI/CD secrets. This allows Azure DevOps pipelines to authenticate to Vertex AI or directly to Anthropic APIs without storing long-lived credentials.

### Azure WIF with GCP Vertex AI

If your organization uses both Azure DevOps and GCP Vertex AI, you can combine Azure WIF with GCP WIF for keyless authentication:

```yaml
# azure-pipelines.yml — Claude Code with Azure WIF → GCP Vertex AI
trigger:
  branches:
    include: [main]

pool:
  vmImage: ubuntu-latest

steps:
  - task: AzureCLI@2
    displayName: 'Configure GCP Workload Identity Federation'
    inputs:
      azureSubscription: '$(AZURE_SERVICE_CONNECTION)'
      scriptType: bash
      scriptLocation: inlineScript
      inlineScript: |
        # Exchange Azure token for GCP token via WIF
        AZURE_TOKEN=$(az account get-access-token --query accessToken -o tsv)
        
        # Configure gcloud to use WIF
        gcloud auth login --brief --cred-file=<(echo '{
          "type": "external_account",
          "audience": "//iam.googleapis.com/projects/PROJECT_NUM/locations/global/workloadIdentityPools/POOL_ID/providers/PROVIDER_ID",
          "subject_token_type": "urn:ietf:params:oauth:token-type:jwt",
          "token_url": "https://sts.googleapis.com/v1/token",
          "credential_source": {
            "file": "/tmp/azure-token.txt"
          }
        }')
        
        echo "$AZURE_TOKEN" > /tmp/azure-token.txt
        
        # Get GCP token for Vertex AI
        GCP_TOKEN=$(gcloud auth print-access-token)
        echo "##vso[task.setvariable variable=GCP_ACCESS_TOKEN;issecret=true]$GCP_TOKEN"

  - script: |
      export ANTHROPIC_AUTH_TOKEN="$(GCP_ACCESS_TOKEN)"
      export ANTHROPIC_VERTEX_PROJECT_ID="$(GCP_PROJECT_ID)"
      export ANTHROPIC_VERTEX_REGION="us-east5"
      
      claude --print --no-interactive \
        "Review the PR diff and report any issues" \
        < diff.txt
    displayName: 'Run Claude Code review'
```

### DISABLE_UPDATES in CI

Always set `DISABLE_UPDATES=1` in CI/CD environments. This prevents Claude Code from:
1. Making outbound requests to check for updates during pipeline runs
2. Downloading and installing new versions mid-pipeline (which could change behavior)
3. Showing update prompts that interfere with `--print` / non-interactive mode

```yaml
# GitHub Actions
- name: Run Claude Code
  env:
    DISABLE_UPDATES: '1'
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
  run: |
    claude --print --no-interactive "Analyze the changes in this PR"

# GitLab CI
claude_review:
  variables:
    DISABLE_UPDATES: "1"
  script:
    - claude --print "Analyze changes"

# Azure DevOps
- script: claude --print "..."
  env:
    DISABLE_UPDATES: '1'
```

**For enterprise/managed deployments:** Set `DISABLE_UPDATES: "1"` in `managed-settings.json` so it applies to all sessions organization-wide, without needing to set it in every pipeline definition.

---

## Jenkins Pipeline Integration

Jenkins remains widely used in enterprise environments. Here is a complete Jenkinsfile with Claude Code integration:

### Declarative Jenkinsfile

```groovy
// Jenkinsfile — Claude Code PR review pipeline

pipeline {
    agent { label 'linux-amd64' }

    environment {
        ANTHROPIC_API_KEY = credentials('anthropic-api-key')
        DISABLE_UPDATES   = '1'
        CLAUDE_MODEL      = 'claude-sonnet-4-6'
    }

    stages {
        stage('Install Claude Code') {
            steps {
                sh '''
                    if ! command -v claude &> /dev/null; then
                        curl -fsSL https://claude.ai/install.sh | bash
                        export PATH="$HOME/.local/bin:$PATH"
                    fi
                    claude --version
                '''
            }
        }

        stage('Get PR Diff') {
            steps {
                script {
                    env.PR_DIFF = sh(
                        script: 'git diff origin/main...HEAD',
                        returnStdout: true
                    ).trim()
                }
            }
        }

        stage('Claude Code Review') {
            steps {
                sh '''
                    export PATH="$HOME/.local/bin:$PATH"
                    
                    REVIEW=$(echo "$PR_DIFF" | claude --print --no-interactive \
                        "Review this PR diff for correctness, security issues, and code quality. \
                         Format the output as markdown with sections: Summary, Issues, Suggestions")
                    
                    echo "$REVIEW" > review.md
                    cat review.md
                '''
            }
        }

        stage('Post Review to PR') {
            when {
                expression { env.CHANGE_ID != null }  // Only on PRs
            }
            steps {
                publishChecks(
                    name: 'Claude Code Review',
                    title: 'Automated Code Review',
                    summary: readFile('review.md')
                )
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'review.md', allowEmptyArchive: true
        }
    }
}
```

### Jenkins with Bedrock Auth

```groovy
pipeline {
    agent { label 'linux-amd64' }

    environment {
        DISABLE_UPDATES          = '1'
        ANTHROPIC_AUTH_TYPE      = 'bedrock'
        AWS_DEFAULT_REGION       = 'us-east-1'
        ANTHROPIC_BEDROCK_BASE_URL = "https://bedrock-runtime.${AWS_DEFAULT_REGION}.amazonaws.com"
    }

    stages {
        stage('Assume IAM Role') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding',
                                  credentialsId: 'aws-claude-bedrock-role']]) {
                    sh '''
                        # Credentials automatically injected as env vars by the Jenkins AWS plugin
                        # AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY set automatically
                        claude --print --no-interactive "Summarise the changes in this commit"
                    '''
                }
            }
        }
    }
}
```

---

## CircleCI Integration

### Basic `.circleci/config.yml`

```yaml
version: 2.1

orbs:
  node: circleci/node@5.2.0

executors:
  claude-executor:
    docker:
      - image: cimg/base:stable
    environment:
      DISABLE_UPDATES: "1"

jobs:
  claude-review:
    executor: claude-executor
    steps:
      - checkout

      - run:
          name: Install Claude Code
          command: curl -fsSL https://claude.ai/install.sh | bash

      - run:
          name: Run Claude Code Review
          command: |
            export PATH="$HOME/.local/bin:$PATH"
            
            # Get PR diff
            git fetch origin main:main
            DIFF=$(git diff main...HEAD)
            
            # Run review
            echo "$DIFF" | claude --print --no-interactive \
              "Review this diff for bugs and security issues" \
              > /tmp/review.md
            
            cat /tmp/review.md

      - store_artifacts:
          path: /tmp/review.md
          destination: claude-review

workflows:
  pr-review:
    jobs:
      - claude-review:
          filters:
            branches:
              ignore: main
```

### Complete CircleCI Pipeline with Multi-Stage Reviews and Cost Tracking

```yaml
# .circleci/config.yml — Full Claude Code integration with parallel stages,
# stream-json parsing, and cost attribution

version: 2.1

# ── Reusable commands ────────────────────────────────────────────────────────
commands:
  install-claude:
    description: Install Claude Code CLI (with optional cache restore)
    steps:
      - restore_cache:
          keys:
            - claude-binary-v1-{{ arch }}
      - run:
          name: Install Claude Code
          command: |
            if [ ! -f "$HOME/.local/bin/claude" ]; then
              curl -fsSL https://claude.ai/install.sh | bash
            fi
            echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$BASH_ENV"
            source "$BASH_ENV"
            claude --version
      - save_cache:
          key: claude-binary-v1-{{ arch }}
          paths:
            - ~/.local/bin/claude

  get-pr-diff:
    description: Compute the diff between this branch and main
    steps:
      - run:
          name: Compute PR diff
          command: |
            git fetch origin main:main
            git diff main...HEAD > /tmp/pr-diff.txt
            echo "Diff size: $(wc -l < /tmp/pr-diff.txt) lines"

# ── Executors ────────────────────────────────────────────────────────────────
executors:
  claude-base:
    docker:
      - image: cimg/base:stable
    resource_class: medium
    environment:
      DISABLE_UPDATES: "1"

# ── Jobs ─────────────────────────────────────────────────────────────────────
jobs:

  # Fast security scan (Haiku — cheap and quick)
  security-scan:
    executor: claude-base
    steps:
      - checkout
      - install-claude
      - get-pr-diff
      - run:
          name: Run security scan
          command: |
            source "$BASH_ENV"
            
            STREAM=$(claude --print \
              --output-format stream-json \
              --model claude-haiku-4-5 \
              --permission-mode bypassPermissions \
              --max-turns 10 \
              --max-budget-usd 0.20 \
              --bare \
              "Scan this diff for OWASP Top 10 vulnerabilities. Output CLEAN if safe, or CRITICAL/HIGH/MEDIUM/LOW: <description> for each issue." \
              < /tmp/pr-diff.txt)
            
            # Parse and display results
            echo "$STREAM" | jq -r 'select(.type=="assistant") | .message.content[].text // empty' | tee /tmp/security-result.txt
            
            # Extract cost for attribution
            COST=$(echo "$STREAM" | jq -r 'select(.type=="result") | .cost_usd // 0')
            TURNS=$(echo "$STREAM" | jq -r 'select(.type=="result") | .num_turns // 0')
            echo ""
            echo "[CircleCI] Security scan: $TURNS turns, \$$COST"
            
            # Gate: fail if critical issues found
            if grep -q "^CRITICAL" /tmp/security-result.txt; then
              echo "SECURITY GATE FAILED"
              exit 1
            fi
      - store_artifacts:
          path: /tmp/security-result.txt
          destination: security-scan
      - persist_to_workspace:
          root: /tmp
          paths:
            - security-result.txt

  # Full code review (Sonnet — balanced)
  code-review:
    executor: claude-base
    steps:
      - checkout
      - install-claude
      - get-pr-diff
      - attach_workspace:
          at: /tmp
      - run:
          name: Run code review
          command: |
            source "$BASH_ENV"
            
            # Include security scan result as context
            SECURITY_CONTEXT=$(cat /tmp/security-result.txt 2>/dev/null || echo "Security scan not available")
            
            STREAM=$(claude --print \
              --output-format stream-json \
              --model claude-sonnet-4-6 \
              --permission-mode bypassPermissions \
              --max-turns 25 \
              --max-budget-usd 1.50 \
              --bare \
              "Security scan already found: $SECURITY_CONTEXT
              
              Now do a full code review of this PR. Focus on:
              1. Correctness and edge cases
              2. Performance implications
              3. Test coverage gaps
              4. API contract changes
              
              Format as markdown with ## headings." \
              < /tmp/pr-diff.txt)
            
            echo "$STREAM" | jq -r 'select(.type=="assistant") | .message.content[].text // empty' | tee /tmp/code-review.md
            
            COST=$(echo "$STREAM"  | jq -r 'select(.type=="result") | .cost_usd // 0')
            TURNS=$(echo "$STREAM" | jq -r 'select(.type=="result") | .num_turns // 0')
            STOP=$(echo "$STREAM"  | jq -r 'select(.type=="result") | .stop_reason // "unknown"')
            
            echo ""
            echo "[CircleCI] Code review: $TURNS turns, \$$COST, stop=$STOP"
            
            # Persist cost for reporting
            echo "{\"job\":\"code-review\",\"cost\":$COST,\"turns\":$TURNS,\"stop\":\"$STOP\",\"build\":\"$CIRCLE_BUILD_NUM\",\"branch\":\"$CIRCLE_BRANCH\"}" \
              > /tmp/cost-report.json
      - store_artifacts:
          path: /tmp/code-review.md
          destination: code-review
      - store_artifacts:
          path: /tmp/cost-report.json
          destination: cost-report
      - persist_to_workspace:
          root: /tmp
          paths:
            - code-review.md
            - cost-report.json

  # Post results as PR comment (via GitHub API if using GitHub + CircleCI)
  post-comment:
    executor: claude-base
    steps:
      - attach_workspace:
          at: /tmp
      - run:
          name: Post review as PR comment
          command: |
            # Requires GITHUB_TOKEN and CIRCLE_PR_NUMBER env vars
            if [ -z "$CIRCLE_PR_NUMBER" ] || [ -z "$GITHUB_TOKEN" ]; then
              echo "Not a PR build or GITHUB_TOKEN not set — skipping comment"
              exit 0
            fi
            
            REVIEW=$(cat /tmp/code-review.md)
            COST=$(jq -r '.cost' /tmp/cost-report.json 2>/dev/null || echo "N/A")
            TURNS=$(jq -r '.turns' /tmp/cost-report.json 2>/dev/null || echo "N/A")
            
            BODY="## Claude Code Review\n\n${REVIEW}\n\n---\n*${TURNS} turns | Cost: \$${COST} | [CircleCI build ${CIRCLE_BUILD_NUM}](${CIRCLE_BUILD_URL})*"
            
            curl -s -X POST \
              "https://api.github.com/repos/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}/issues/${CIRCLE_PR_NUMBER}/comments" \
              -H "Authorization: token $GITHUB_TOKEN" \
              -H "Content-Type: application/json" \
              -d "{\"body\": \"$BODY\"}"

# ── Workflows ─────────────────────────────────────────────────────────────────
workflows:
  pr-quality-gate:
    jobs:
      - security-scan:
          context: anthropic-api   # CircleCI context with ANTHROPIC_API_KEY
          filters:
            branches:
              ignore: main

      - code-review:
          requires:
            - security-scan        # Only runs if security scan passes
          context: anthropic-api
          filters:
            branches:
              ignore: main

      - post-comment:
          requires:
            - code-review
          context:
            - anthropic-api
            - github-token         # Context with GITHUB_TOKEN
          filters:
            branches:
              ignore: main
```

### CircleCI with OIDC-based AWS Auth (no stored secrets)

```yaml
version: 2.1

jobs:
  claude-bedrock:
    docker:
      - image: cimg/base:stable
    environment:
      DISABLE_UPDATES: "1"
      AWS_REGION: "us-east-1"
    steps:
      - checkout

      - run:
          name: Configure AWS credentials via OIDC
          command: |
            # CircleCI OIDC token is in $CIRCLE_OIDC_TOKEN
            # This requires enabling "Enable OIDC token in job" in project settings
            ROLE_ARN="arn:aws:iam::123456789:role/CircleCI-Claude-Role"
            
            CREDENTIALS=$(aws sts assume-role-with-web-identity \
              --role-arn "$ROLE_ARN" \
              --role-session-name "circleci-claude-$CIRCLE_BUILD_NUM" \
              --web-identity-token "$CIRCLE_OIDC_TOKEN" \
              --query 'Credentials' \
              --output json)
            
            # Write credentials to a profile file so subsequent steps inherit them
            echo "export AWS_ACCESS_KEY_ID=$(echo $CREDENTIALS | jq -r .AccessKeyId)"     >> "$BASH_ENV"
            echo "export AWS_SECRET_ACCESS_KEY=$(echo $CREDENTIALS | jq -r .SecretAccessKey)" >> "$BASH_ENV"
            echo "export AWS_SESSION_TOKEN=$(echo $CREDENTIALS | jq -r .SessionToken)"    >> "$BASH_ENV"
            echo "export CLAUDE_CODE_USE_BEDROCK=1"                                        >> "$BASH_ENV"
            echo "export ANTHROPIC_BEDROCK_BASE_URL=https://bedrock-runtime.${AWS_REGION}.amazonaws.com" >> "$BASH_ENV"
            # Use flex tier for CI — lower cost, variable latency acceptable
            echo "export CLAUDE_CODE_BEDROCK_SERVICE_TIER=flex"                            >> "$BASH_ENV"

      - run:
          name: Install and run Claude Code via Bedrock
          command: |
            source "$BASH_ENV"
            curl -fsSL https://claude.ai/install.sh | bash
            export PATH="$HOME/.local/bin:$PATH"
            
            git fetch origin main:main
            git diff main...HEAD > /tmp/diff.txt
            
            claude --print \
              --output-format stream-json \
              --model claude-sonnet-4-6 \
              --permission-mode bypassPermissions \
              --max-turns 20 \
              --max-budget-usd 1.00 \
              --bare \
              "Analyze this PR for quality and security" \
              < /tmp/diff.txt \
              | jq -r 'select(.type=="assistant") | .message.content[].text // empty'
```

---

## Bitbucket Pipelines Integration

### Basic `bitbucket-pipelines.yml`

```yaml
image: atlassian/default-image:4

definitions:
  caches:
    claude-binary: ~/.local/bin

pipelines:
  pull-requests:
    '**':
      - step:
          name: Claude Code Review
          caches:
            - claude-binary
          script:
            - apt-get update -qq && apt-get install -y -qq curl jq
            
            # Install Claude Code (cached after first run)
            - |
              if [ ! -f "$HOME/.local/bin/claude" ]; then
                curl -fsSL https://claude.ai/install.sh | bash
              fi
            
            # Run review
            - |
              export PATH="$HOME/.local/bin:$PATH"
              export DISABLE_UPDATES=1
              
              # Get diff against main
              git fetch origin main
              git diff origin/main...HEAD > /tmp/pr-diff.txt
              
              cat /tmp/pr-diff.txt | claude --print --no-interactive \
                "Review this PR diff for issues. Be concise." \
                > /tmp/review.md
              
              echo "=== Claude Code Review ==="
              cat /tmp/review.md

          artifacts:
            - /tmp/review.md
```

### Multi-Stage Bitbucket Pipeline with Cost Tracking

```yaml
# bitbucket-pipelines.yml — Full multi-stage pipeline with security gate and cost attribution
image: atlassian/default-image:4

definitions:
  caches:
    claude-binary: ~/.local/bin

  # Reusable step for installing Claude Code
  steps:
    - step: &install-claude
        name: Install Claude Code
        script:
          - apt-get update -qq && apt-get install -y -qq curl jq bc
          - |
            if [ ! -f "$HOME/.local/bin/claude" ]; then
              curl -fsSL https://claude.ai/install.sh | bash
            fi
          - echo "$HOME/.local/bin" >> "$BASH_ENV"
        caches:
          - claude-binary

pipelines:
  pull-requests:
    '**':
      - parallel:
          - step:
              name: 1. Security Scan (fast)
              caches:
                - claude-binary
              script:
                - apt-get update -qq && apt-get install -y -qq curl jq
                - export PATH="$HOME/.local/bin:$PATH"
                - export DISABLE_UPDATES=1
                
                # Install if not cached
                - if [ ! -f "$HOME/.local/bin/claude" ]; then curl -fsSL https://claude.ai/install.sh | bash; fi
                
                - git fetch origin "$BITBUCKET_PR_DESTINATION_BRANCH"
                - git diff "origin/$BITBUCKET_PR_DESTINATION_BRANCH"...HEAD > /tmp/diff.txt
                
                # Run fast security scan with Haiku
                - |
                  STREAM=$(claude --print \
                    --output-format stream-json \
                    --model claude-haiku-4-5 \
                    --permission-mode bypassPermissions \
                    --max-turns 10 \
                    --max-budget-usd 0.25 \
                    --bare \
                    "Scan this diff for: hardcoded secrets, SQL injection, XSS, SSRF. Output CLEAN or ISSUES: <list>" \
                    < /tmp/diff.txt)
                  
                  echo "$STREAM" | jq -r 'select(.type=="assistant") | .message.content[].text // empty' > /tmp/security-scan.txt
                  COST=$(echo "$STREAM" | jq -r 'select(.type=="result") | .cost_usd // 0')
                  echo "Security scan cost: \$$COST"
                  cat /tmp/security-scan.txt
                  
                  # Block PR if critical issues found
                  if grep -qi "^ISSUES:" /tmp/security-scan.txt; then
                    echo "SECURITY GATE FAILED — review /tmp/security-scan.txt"
                    exit 1
                  fi
              artifacts:
                - /tmp/security-scan.txt

          - step:
              name: 2. Code Quality Review (parallel)
              caches:
                - claude-binary
              script:
                - apt-get update -qq && apt-get install -y -qq curl jq
                - export PATH="$HOME/.local/bin:$PATH"
                - export DISABLE_UPDATES=1
                - if [ ! -f "$HOME/.local/bin/claude" ]; then curl -fsSL https://claude.ai/install.sh | bash; fi
                
                - git fetch origin "$BITBUCKET_PR_DESTINATION_BRANCH"
                - git diff "origin/$BITBUCKET_PR_DESTINATION_BRANCH"...HEAD > /tmp/diff.txt
                
                - |
                  STREAM=$(claude --print \
                    --output-format stream-json \
                    --model claude-sonnet-4-6 \
                    --permission-mode bypassPermissions \
                    --max-turns 20 \
                    --max-budget-usd 1.00 \
                    --bare \
                    "Review this PR for code quality, performance, and test coverage.
                     Format your response as: ## Summary\n## Issues\n## Suggestions" \
                    < /tmp/diff.txt)
                  
                  echo "$STREAM" | jq -r 'select(.type=="assistant") | .message.content[].text // empty' > /tmp/code-review.md
                  COST=$(echo "$STREAM" | jq -r 'select(.type=="result") | .cost_usd // 0')
                  TURNS=$(echo "$STREAM" | jq -r 'select(.type=="result") | .num_turns // 0')
                  echo "Code review cost: \$$COST ($TURNS turns)"
                  cat /tmp/code-review.md
              artifacts:
                - /tmp/code-review.md

      - step:
          name: 3. Post review to PR (Bitbucket API)
          script:
            - apt-get update -qq && apt-get install -y -qq curl jq
            - |
              REVIEW=$(cat /tmp/code-review.md 2>/dev/null || echo "Review not available")
              SECURITY=$(cat /tmp/security-scan.txt 2>/dev/null || echo "Security scan not available")
              
              # Post comment via Bitbucket REST API
              curl -s -X POST \
                "https://api.bitbucket.org/2.0/repositories/$BITBUCKET_REPO_FULL_NAME/pullrequests/$BITBUCKET_PR_ID/comments" \
                -H "Authorization: Bearer $BITBUCKET_ACCESS_TOKEN" \
                -H "Content-Type: application/json" \
                -d "{
                  \"content\": {
                    \"raw\": \"## Claude Code Review\n\n### Security Scan\n\`\`\`\n${SECURITY}\n\`\`\`\n\n### Code Quality\n${REVIEW}\"
                  }
                }"
              
              echo "Review posted to PR #$BITBUCKET_PR_ID"
          trigger: automatic

  # Schedule: weekly security audit
  custom:
    weekly-security-audit:
      - step:
          name: Full Security Audit
          caches:
            - claude-binary
          script:
            - apt-get update -qq && apt-get install -y -qq curl jq
            - export PATH="$HOME/.local/bin:$PATH"
            - export DISABLE_UPDATES=1
            - if [ ! -f "$HOME/.local/bin/claude" ]; then curl -fsSL https://claude.ai/install.sh | bash; fi
            - |
              STREAM=$(claude --print \
                --output-format stream-json \
                --model claude-opus-4-7 \
                --permission-mode bypassPermissions \
                --max-turns 50 \
                --max-budget-usd 10.00 \
                --bare \
                "Perform a comprehensive OWASP Top 10 security audit of this codebase.
                 Output a JSON report: {critical:[], high:[], medium:[], info:[]}
                 Each item: {file, line, issue, recommendation}")
              
              echo "$STREAM" | jq -r 'select(.type=="result") | .cost_usd' | xargs -I{} echo "Audit cost: \${}"
              echo "$STREAM" | jq -r 'select(.type=="assistant") | .message.content[].text // empty' > /tmp/security-audit.json
          artifacts:
            - /tmp/security-audit.json
```

### Bitbucket with AWS Bedrock (OIDC)

Bitbucket Pipelines supports OIDC for keyless AWS authentication:

```yaml
# bitbucket-pipelines.yml
image: atlassian/default-image:4

pipelines:
  pull-requests:
    '**':
      - step:
          name: Claude Review via Bedrock
          oidc: true   # Enable OIDC — provides $BITBUCKET_STEP_OIDC_TOKEN
          script:
            - apt-get update -qq && apt-get install -y -qq curl jq awscli
            - if [ ! -f "$HOME/.local/bin/claude" ]; then curl -fsSL https://claude.ai/install.sh | bash; fi
            - export PATH="$HOME/.local/bin:$PATH"
            
            # Exchange OIDC token for AWS credentials
            - |
              CREDENTIALS=$(aws sts assume-role-with-web-identity \
                --role-arn "arn:aws:iam::$AWS_ACCOUNT_ID:role/BitbucketClaudeRole" \
                --role-session-name "bb-claude-$BITBUCKET_BUILD_NUMBER" \
                --web-identity-token "$BITBUCKET_STEP_OIDC_TOKEN" \
                --query 'Credentials' --output json)
              
              export AWS_ACCESS_KEY_ID=$(echo $CREDENTIALS | jq -r .AccessKeyId)
              export AWS_SECRET_ACCESS_KEY=$(echo $CREDENTIALS | jq -r .SecretAccessKey)
              export AWS_SESSION_TOKEN=$(echo $CREDENTIALS | jq -r .SessionToken)
              export CLAUDE_CODE_USE_BEDROCK=1
              export AWS_DEFAULT_REGION=us-east-1
              export DISABLE_UPDATES=1
            
            - git diff origin/main...HEAD > /tmp/diff.txt
            - |
              claude --print \
                --output-format stream-json \
                --model claude-sonnet-4-6 \
                --permission-mode bypassPermissions \
                --max-turns 20 \
                --max-budget-usd 1.00 \
                --bare \
                "Review this PR for issues" \
                < /tmp/diff.txt \
                | jq -r 'select(.type=="assistant") | .message.content[].text // empty'
          variables:
            AWS_ACCOUNT_ID: "123456789012"
```

---

## Cost Attribution Per PR

Track and report Claude Code costs per PR for budget management. Without cost attribution, it is impossible to know which PRs, repositories, teams, or pipeline stages are driving Claude Code spend.

### Why Cost Attribution Matters in CI

In a typical team using Claude Code for PR reviews:
- Each PR may trigger 2–5 Claude Code jobs (security scan, code review, test analysis, etc.)
- Costs vary widely by PR size: a 5-file PR costs ~$0.10; a 500-file PR costs ~$3–10
- Without attribution, the billing page shows a lump sum — no way to identify outliers or optimize

**What to capture per CI run:**

| Field | Source in stream-json | Use |
|---|---|---|
| `cost_usd` | `result` event | Primary cost metric |
| `input_tokens` | `result.usage.input_tokens` | Diagnose expensive prompts |
| `output_tokens` | `result.usage.output_tokens` | Measure response verbosity |
| `cache_read_tokens` | `result.usage.cache_read_tokens` | Measure cache effectiveness |
| `num_turns` | `result.num_turns` | Detect runaway sessions |
| `stop_reason` | `result.stop_reason` | Detect budget/turn limit hits |
| `session_id` | `system` or `result` event | Correlate with Anthropic console logs |

### GitHub Actions: Post Cost as PR Comment

```yaml
- name: Run Claude Code with cost tracking
  id: claude-review
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    DISABLE_UPDATES: "1"
  run: |
    # Run with stream-json to capture all events including cost
    STREAM=$(claude --print --output-format stream-json \
      --max-budget-usd 2.00 \
      --max-turns 25 \
      --bare \
      "Review the PR changes for issues" \
      < diff.txt)
    
    # Extract cost, turns, stop reason from result event
    COST=$(echo "$STREAM"    | jq -r 'select(.type=="result") | .cost_usd // 0')
    TURNS=$(echo "$STREAM"   | jq -r 'select(.type=="result") | .num_turns // 0')
    STOP=$(echo "$STREAM"    | jq -r 'select(.type=="result") | .stop_reason // "unknown"')
    IN_TOK=$(echo "$STREAM"  | jq -r 'select(.type=="result") | .usage.input_tokens // 0')
    OUT_TOK=$(echo "$STREAM" | jq -r 'select(.type=="result") | .usage.output_tokens // 0')
    CACHE=$(echo "$STREAM"   | jq -r 'select(.type=="result") | .usage.cache_read_tokens // 0')
    SESSION=$(echo "$STREAM" | jq -r 'select(.type=="system") | .session_id // "n/a"')
    
    # Set outputs for downstream steps
    echo "cost=$COST"        >> $GITHUB_OUTPUT
    echo "turns=$TURNS"      >> $GITHUB_OUTPUT
    echo "stop=$STOP"        >> $GITHUB_OUTPUT
    echo "session=$SESSION"  >> $GITHUB_OUTPUT
    
    # Extract the review text from assistant events
    echo "$STREAM" | jq -r 'select(.type=="assistant") | .message.content[] | select(.type=="text") | .text' \
      > review.md
    
    # Warn if budget was hit
    if [ "$STOP" = "budget_exceeded" ]; then
      echo "::warning::Claude Code budget limit reached on this PR review"
    fi

- name: Post review comment with cost
  uses: marocchino/sticky-pull-request-comment@v2
  with:
    message: |
      ## Claude Code Review
      
      $(cat review.md)
      
      ---
      <details><summary>Cost details</summary>
      
      | Metric | Value |
      |--------|-------|
      | Cost | ${{ steps.claude-review.outputs.cost }} |
      | Turns | ${{ steps.claude-review.outputs.turns }} |
      | Stop reason | ${{ steps.claude-review.outputs.stop }} |
      | Session ID | ${{ steps.claude-review.outputs.session }} |
      
      </details>
```

### Centralised Cost Logging — Send to a Database

For teams that want full cost history across all PRs and repositories:

```bash
#!/bin/bash
# log-claude-cost.sh — parse stream-json output and log cost to a central store

STREAM_FILE="$1"   # path to captured stream-json output file
REPO="$2"          # e.g. "my-org/my-repo"
PR_NUMBER="$3"     # e.g. "142"
JOB_NAME="$4"      # e.g. "code-review"

# Parse the result event
COST=$(jq -r    'select(.type=="result") | .cost_usd // 0'                STREAM_FILE)
TURNS=$(jq -r   'select(.type=="result") | .num_turns // 0'               "$STREAM_FILE")
STOP=$(jq -r    'select(.type=="result") | .stop_reason // "unknown"'      "$STREAM_FILE")
SESSION=$(jq -r 'select(.type=="system") | .session_id // ""'              "$STREAM_FILE")
IN_TOK=$(jq -r  'select(.type=="result") | .usage.input_tokens // 0'      "$STREAM_FILE")
OUT_TOK=$(jq -r 'select(.type=="result") | .usage.output_tokens // 0'     "$STREAM_FILE")
CACHE=$(jq -r   'select(.type=="result") | .usage.cache_read_tokens // 0' "$STREAM_FILE")

TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Log to a cost tracking endpoint (replace with your actual backend)
curl -s -X POST "$COST_TRACKING_ENDPOINT/events" \
  -H "Authorization: Bearer $COST_TRACKING_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"timestamp\":      \"$TIMESTAMP\",
    \"repository\":     \"$REPO\",
    \"pr_number\":      $PR_NUMBER,
    \"job\":            \"$JOB_NAME\",
    \"session_id\":     \"$SESSION\",
    \"cost_usd\":       $COST,
    \"num_turns\":      $TURNS,
    \"stop_reason\":    \"$STOP\",
    \"input_tokens\":   $IN_TOK,
    \"output_tokens\":  $OUT_TOK,
    \"cache_tokens\":   $CACHE
  }"

echo "[cost-log] $REPO PR#$PR_NUMBER $JOB_NAME: \$$COST ($TURNS turns, session $SESSION)"
```

### Budget Alert Hook

Trigger an alert when a single CI run exceeds a budget threshold:

```bash
#!/bin/bash
# post-claude.sh — run after each Claude Code job, alert if cost > threshold

COST="$1"         # Pass in the cost_usd from the result event
THRESHOLD="0.50"  # Alert if a single run costs more than $0.50
PR_URL="$2"       # Pass in the PR URL for context

if (( $(echo "$COST > $THRESHOLD" | bc -l) )); then
  curl -s -X POST "$SLACK_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"Claude Code CI cost alert: \$${COST} (threshold: \$${THRESHOLD})\n${PR_URL}\"
    }"
fi
```

### Cost Attribution by Team Using Labels

If multiple teams share one GitHub organisation, use PR labels or repository prefixes to attribute costs:

```yaml
# In your GitHub Actions workflow:
- name: Run Claude with team attribution
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    # Pass team context as env var for hook-based logging
    CLAUDE_TEAM_LABEL: ${{ github.event.pull_request.labels[0].name || 'unlabelled' }}
    CLAUDE_REPO: ${{ github.repository }}
  run: |
    STREAM=$(claude --print --output-format stream-json \
      --max-budget-usd 2.00 --bare \
      "Review this PR" < diff.txt)
    
    COST=$(echo "$STREAM" | jq -r 'select(.type=="result") | .cost_usd')
    
    # Tag cost by team label for reporting
    echo "Team: $CLAUDE_TEAM_LABEL | Repo: $CLAUDE_REPO | Cost: $COST"
    
    # Append to a cost ledger artifact
    echo "$CLAUDE_TEAM_LABEL,$CLAUDE_REPO,${{ github.event.number }},$COST,$(date -u +%Y-%m-%d)" \
      >> /tmp/cost-ledger.csv
```

Then aggregate `cost-ledger.csv` artifacts across workflow runs for team-level reporting.

---

## Prompt Cache Warming in CI

Prompt caching significantly reduces costs when Claude Code reads the same CLAUDE.md and source files across multiple CI runs on the same PR. Understanding and optimising cache hit rates can reduce Claude Code CI costs by 40–70%.

### How Cache Works in CI

```
First CI run on a PR:
  1. CLAUDE.md loaded → cache miss → written to cache
  2. Source files read → cache miss → written to cache
  3. Total cost: full input rate ($3.00/M for Sonnet)
  
Second CI run (same files, same CLAUDE.md):
  1. CLAUDE.md loaded → cache hit → $0.30/M (10× cheaper)
  2. Unchanged source files → cache hit → $0.30/M
  3. New/changed files → cache miss → $3.00/M
  
Savings: ~70% on repeat runs, depending on how much changed
```

### Maximising Cache Hit Rate

1. **Use a stable CLAUDE.md**: If your CLAUDE.md changes on every commit, it invalidates the cache. Keep project instructions stable; put PR-specific context in the prompt, not in CLAUDE.md.

2. **Use the same model**: Cache is per-model. Switching from `claude-sonnet-4-6` to `claude-opus-4-8` mid-PR loses the cache.

3. **Structure prompts for cache stability**: Put stable content (CLAUDE.md context, tool instructions) first. Put variable content (the PR diff) last. Cache is prefix-based.

4. **Monitor cache metrics in the result event**:

```bash
# Parse cache metrics from the result JSON event
RESULT=$(claude --print --output-format json "Review PR" < diff.txt)

CACHE_READ=$(echo "$RESULT" | jq 'select(.type=="result") | .usage.cacheReadTokens')
CACHE_WRITE=$(echo "$RESULT" | jq 'select(.type=="result") | .usage.cacheWriteTokens')
TOTAL_INPUT=$(echo "$RESULT" | jq 'select(.type=="result") | .usage.inputTokens')

HIT_RATE=$(echo "scale=2; $CACHE_READ / $TOTAL_INPUT * 100" | bc)

echo "Cache hit rate: ${HIT_RATE}%"
echo "Cache read tokens: $CACHE_READ"
echo "Cache write tokens: $CACHE_WRITE"
```

---

## Multi-Stage CI Pipeline Pattern

Use Claude Code in multiple pipeline stages for a staged review process.

```yaml
# github-actions/multi-stage.yml
name: Multi-Stage Claude Review

on: [pull_request]

jobs:
  # Stage 1: Fast security scan (Haiku — cheap and fast)
  security-scan:
    runs-on: ubuntu-latest
    outputs:
      security-issues: ${{ steps.scan.outputs.issues }}
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: Install Claude Code
        run: curl -fsSL https://claude.ai/install.sh | bash
      - name: Security Scan
        id: scan
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          DISABLE_UPDATES: "1"
        run: |
          export PATH="$HOME/.local/bin:$PATH"
          git diff origin/main...HEAD > diff.txt
          
          RESULT=$(claude --print --output-format json \
            --model claude-haiku-4-5 \
            "List any security issues in this diff. Reply with a JSON array of issues. Reply [] if none." \
            < diff.txt)
          
          ISSUES=$(echo "$RESULT" | jq -r 'select(.type=="assistant") | .message.content[0].text')
          echo "issues=$ISSUES" >> $GITHUB_OUTPUT

  # Stage 2: Deep code review (Sonnet — only if security scan passes)
  code-review:
    needs: security-scan
    if: ${{ needs.security-scan.outputs.security-issues == '[]' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: Install Claude Code
        run: curl -fsSL https://claude.ai/install.sh | bash
      - name: Deep Code Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          DISABLE_UPDATES: "1"
        run: |
          export PATH="$HOME/.local/bin:$PATH"
          git diff origin/main...HEAD > diff.txt
          
          claude --print --no-interactive \
            "Do a thorough code review. Focus on correctness, maintainability, and test coverage." \
            < diff.txt \
            > review.md
          
          cat review.md

  # Stage 3: Architecture review (Opus — only for large changes)
  arch-review:
    needs: code-review
    if: ${{ github.event.pull_request.additions + github.event.pull_request.deletions > 500 }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - name: Install Claude Code
        run: curl -fsSL https://claude.ai/install.sh | bash
      - name: Architecture Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          DISABLE_UPDATES: "1"
        run: |
          export PATH="$HOME/.local/bin:$PATH"
          git diff origin/main...HEAD > diff.txt
          
          claude --print --no-interactive \
            --model claude-opus-4-8 \
            "Review the architectural impact of these changes. Are there better approaches?" \
            < diff.txt \
            > arch-review.md
          
          cat arch-review.md
```

---

## CI Concurrency Management

When many PRs are open simultaneously, all triggering Claude Code jobs, you can hit API rate limits. Here are strategies to manage concurrency:

### GitHub Actions Concurrency Groups

```yaml
# Limit Claude Code reviews to one at a time per branch
concurrency:
  group: claude-review-${{ github.ref }}
  cancel-in-progress: false  # Queue, don't cancel
```

### Rate Limit Retry Wrapper

```bash
#!/bin/bash
# claude-with-retry.sh — wrap claude with exponential backoff for rate limits

MAX_RETRIES=4
RETRY_DELAY=30  # seconds, doubles each retry

for i in $(seq 1 $MAX_RETRIES); do
  OUTPUT=$(claude --print --no-interactive "$@" 2>&1)
  EXIT_CODE=$?
  
  if [ $EXIT_CODE -eq 0 ]; then
    echo "$OUTPUT"
    exit 0
  fi
  
  if echo "$OUTPUT" | grep -q "rate_limit\|429\|TooManyRequests"; then
    WAIT=$((RETRY_DELAY * (2 ** (i - 1))))
    echo "[Retry $i/$MAX_RETRIES] Rate limited. Waiting ${WAIT}s..."
    sleep $WAIT
  else
    echo "$OUTPUT" >&2
    exit $EXIT_CODE
  fi
done

echo "Max retries reached. Exiting." >&2
exit 1
```

Usage in pipeline:
```yaml
- run: bash claude-with-retry.sh "Review this PR" < diff.txt
```
