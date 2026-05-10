---
title: CI/CD Integration — GitHub Actions & Automation
description: >
  Complete guide for integrating Claude Code into CI/CD pipelines — GitHub Actions,
  GitLab CI, permission modes, non-interactive flags, security hardening, cost controls,
  practical workflow patterns, and production deployment examples. Covers v2.1.126 (May 2026).
sidebar:
  order: 8
  label: CI/CD Integration
lastUpdated: 2026-05-09
---

# CI/CD Integration — GitHub Actions & Automation

> **Version:** v2.1.126 (May 6, 2026) · `anthropics/claude-code-action@v1`

Claude Code integrates natively with CI/CD pipelines through its non-interactive mode, the official GitHub Action, and a comprehensive set of automation flags. This guide covers everything from basic automated code review to advanced multi-agent CI pipelines.

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

### 2.2 PR Auto-Review on Every Push

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

### AWS Bedrock

```yaml
# GitHub Actions with Bedrock
env:
  CLAUDE_CODE_USE_BEDROCK: "1"
  AWS_REGION: us-east-1
  CLAUDE_CODE_BEDROCK_SERVICE_TIER: "default"  # default | flex | priority (v2.1.122+)

steps:
  - name: Configure AWS credentials
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
- `default` — standard capacity
- `flex` — lower cost, variable latency
- `priority` — highest throughput, premium pricing

### Google Cloud Vertex AI

```yaml
env:
  CLAUDE_CODE_USE_VERTEX: "1"
  CLOUD_ML_REGION: us-central1
  ANTHROPIC_VERTEX_PROJECT_ID: ${{ vars.GCP_PROJECT_ID }}

steps:
  - name: Authenticate to GCP
    uses: google-github-actions/auth@v2
    with:
      workload_identity_provider: ${{ secrets.WIF_PROVIDER }}  # WIF (v2.1.121+)
      service_account: ${{ secrets.GCP_SA_EMAIL }}

  - name: Run Claude Code
    uses: anthropics/claude-code-action@v1
    with:
      use_vertex: "true"
      prompt: "Review this PR"
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

## Related Guides

- [CLI Technical Reference](./claude-code-reference) — Section 21: GitHub Actions (full API)
- [Hooks System](./hooks-deep-dive) — hooks for CI/CD automation
- [Permissions & Security](./permissions-security) — `bypassPermissions` and allowlists
- [Agent Teams Guide](./agent-teams-guide) — multi-agent CI pipelines
- [Efficiency Reference](./claude-code-efficiency-reference) — cost optimisation for CI
