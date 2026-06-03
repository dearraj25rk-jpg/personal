---
title: CI/CD Integration — GitHub Actions & Automation
description: >
  Complete guide for integrating Claude Code into CI/CD pipelines — GitHub Actions,
  GitLab CI, permission modes, non-interactive flags, security hardening, cost controls,
  practical workflow patterns, and production deployment examples. Covers v2.1.126 (May 2026).
sidebar:
  order: 8
  label: CI/CD Integration
lastUpdated: 2026-06-03
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

### 6.3 Budget limits

Always set `--max-budget-usd` in CI:

```bash
claude --print "..." \
       --max-budget-usd 5.00 \
       --max-turns 30
```

The session terminates if either limit is hit. This prevents runaway costs from infinite loops.

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
