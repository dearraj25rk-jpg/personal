---
title: Models, Pricing & Effort — Complete Reference
description: >
  Complete reference for Claude model selection in Claude Code — all available models 
  (Opus 4.7, Opus 4.6, Sonnet 4.6, Haiku 4.5), context windows, pricing, effort levels
  (low/normal/high/xhigh), model selection strategies, extended thinking, the /advisor
  command, Bedrock and Vertex AI deployment, model environment variables, and cost
  optimization. Claude Code v2.1.126 (May 2026).
sidebar:
  order: 16
  label: Models & Pricing
lastUpdated: 2026-05-19
---

# Models, Pricing & Effort — Complete Reference

> **Version**: Claude Code v2.1.126 | **Last Updated**: May 19, 2026

---

## 1. Available Models (May 2026)

Claude Code supports four model tiers as of v2.1.126. All models are members of the Claude 4 generation. The tier names (Opus, Sonnet, Haiku) reflect capability level; the version number reflects the release generation within that tier.

### Complete Model Reference Table

| Model ID | Alias | Context Window | Input $/M | Output $/M | Cache Read $/M | Best Use Case |
|---|---|---|---|---|---|---|
| `claude-opus-4-7` | `opus` | 1,000,000 tokens | $15.00 | $75.00 | $1.50 | Architecture, complex debugging, ambiguous requirements |
| `claude-opus-4-6` | — | 200,000 tokens | $15.00 | $75.00 | $1.50 | Opus tasks where 1M context not needed |
| `claude-sonnet-4-6` | `sonnet` | 200,000 tokens | $3.00 | $15.00 | $0.30 | Daily development, feature work, code review |
| `claude-haiku-4-5` | `haiku` | 200,000 tokens | $0.80 | $4.00 | $0.08 | Bulk operations, CI/CD, simple edits, formatting |

**Notes on pricing:**
- Prices are in USD per million tokens
- Cache read pricing applies when prompt caching hits (automatically enabled in Claude Code)
- Extended thinking tokens (reasoning tokens) are charged at output rates for Opus, discounted rate for Sonnet

### Opus 4.7: The 1M Context Window

Claude Opus 4.7 introduced a 1,000,000-token context window — effectively the ability to hold an entire large codebase in context simultaneously. As of March 14, 2026, this extended context is available at **standard Opus pricing with no surcharge**. Prior to that date, context beyond 200K was subject to an extended-context premium.

Practical implications of 1M token context with Opus 4.7:

```
1,000,000 tokens ≈ 750,000 words ≈ 3,000 pages of text

Typical usage:
  - A 200K-line Go codebase ≈ 600K tokens (fits in one context)
  - A 50K-line TypeScript project ≈ 150K tokens (comfortable margin)
  - An entire PostgreSQL schema + all migrations ≈ 20K tokens
  - 6 months of conversation history ≈ 100K tokens

For very large monorepos:
  - Selective file loading still often faster than full-repo context
  - But whole-codebase architectural analysis is now practical
```

**When the 1M window matters:** Cross-file refactoring where you need many related files in context simultaneously; whole-codebase security audits; migrating APIs where you need to see every callsite at once; architecture analysis spanning many services.

### Model Capability Comparison

```
Capability:  ██████████████████████████████  Opus 4.7
             █████████████████████████       Opus 4.6
             ████████████████████            Sonnet 4.6
             ████████████                    Haiku 4.5

Speed:       ██████████                      Opus 4.7
             ████████████                    Opus 4.6
             ████████████████████████        Sonnet 4.6
             ███████████████████████████████ Haiku 4.5

Cost (input):$15.00/M                        Opus 4.7 & 4.6
             $3.00/M                         Sonnet 4.6
             $0.80/M                         Haiku 4.5
```

### Model Selection Decision Tree

```
What is your task?
│
├── Simple, deterministic (format, rename, small edit)
│   └── → Haiku 4.5 (cheapest, fastest)
│
├── Standard feature work (add function, fix bug, write test)
│   └── → Sonnet 4.6 (default) with effort=normal
│
├── Complex multi-file refactor or architecture
│   ├── Context < 50K tokens → Sonnet 4.6 with effort=high
│   └── Context > 50K tokens → Opus 4.6 (or Opus 4.7 for 1M window)
│
├── Critical debugging, ambiguous requirements, strategic decisions
│   └── → Opus 4.7 with effort=xhigh (or use /advisor)
│
└── Long document analysis (legal, architecture docs > 200K tokens)
    └── → Opus 4.7 (1M context window)
```

---

## 2. Default Model

### Current Default (v2.1.117+)

Claude Code v2.1.117 changed the default model behavior:

- **Default model**: `claude-sonnet-4-6`
- **Default effort when using Opus 4.7**: `xhigh` (maximum thinking budget)

Prior to v2.1.117, the default was also Sonnet, but effort defaulted to `normal` for all models. The change to `xhigh` for Opus reflects that if you're explicitly choosing Opus (a deliberate, cost-conscious choice), you likely want full capability.

### How to Change the Default Model

There are four mechanisms for setting the default model, applied in this priority order (highest first):

**1. CLI flag (highest priority, session-only):**
```bash
claude --model claude-opus-4-7
claude --model opus          # alias resolves to claude-opus-4-7
claude --model haiku         # alias resolves to claude-haiku-4-5
```

**2. Environment variable (shell-level default):**
```bash
# In ~/.bashrc, ~/.zshrc, or .env
export ANTHROPIC_MODEL=claude-opus-4-7

# Useful for: setting a personal default across all projects
# Without overriding team settings
```

**3. Settings file (project or user-level):**
```json
// ~/.claude/settings.json (user-level default)
{
  "model": "claude-sonnet-4-6",
  "effort": "high"
}

// .claude/settings.json (project-level default)
{
  "model": "claude-haiku-4-5",
  "effort": "normal"
}
```

**4. /model slash command (mid-session):**
```
> /model

Current model: claude-sonnet-4-6 (effort: normal)

Available models:
  1. claude-opus-4-7    (alias: opus)    — Most capable, 1M context
  2. claude-opus-4-6    (alias: —)       — Opus capability, 200K context
  3. claude-sonnet-4-6  (alias: sonnet)  — Balanced [CURRENT]
  4. claude-haiku-4-5   (alias: haiku)   — Fast and economical

Select model: 1

Switched to claude-opus-4-7 (effort: xhigh)
Model change applies immediately to subsequent messages.
```

The `/model` command takes effect immediately — subsequent messages in the same session use the new model. Previous conversation history stays in context.

### Alias Resolution

Model aliases always resolve to the **latest released model in that family**:

| Alias | Resolves to (May 2026) | When might change |
|---|---|---|
| `opus` | `claude-opus-4-7` | When Opus 4.8 is released |
| `sonnet` | `claude-sonnet-4-6` | When Sonnet 4.7 is released |
| `haiku` | `claude-haiku-4-5` | When Haiku 4.6 is released |

**Important**: If you pin production CI/CD to `opus`, the model will silently upgrade when a new Opus is released. For reproducible CI, always use full model IDs (`claude-opus-4-7`) rather than aliases.

---

## 3. Effort Levels

Effort controls how much computational work Claude does before responding. Higher effort uses Claude's extended thinking capability, which generates internal reasoning tokens before producing a response.

### The Four Effort Levels

| Effort | Extended Thinking | Thinking Budget | Best For | Cost Impact |
|---|---|---|---|---|
| `low` | Disabled | 0 tokens | Simple lookups, formatting, trivial edits | Baseline cost |
| `normal` | Minimal | ~1,000–5,000 tokens | Standard development tasks | ~1.1–1.3× baseline |
| `high` | Substantial | ~10,000–20,000 tokens | Complex features, architecture review | ~1.5–2× baseline |
| `xhigh` | Maximum | ~32,000+ tokens | Very complex problems, ambiguous requirements, multi-system design | ~2–4× baseline |

### Setting Effort Level

**CLI flag:**
```bash
claude --effort low      # Fast, cheapest
claude --effort normal   # Default for Sonnet
claude --effort high     # More thinking
claude --effort xhigh    # Maximum thinking (default for Opus 4.7)
```

**Settings file:**
```json
{
  "model": "claude-opus-4-7",
  "effort": "xhigh"
}
```

**Mid-session toggle (Tab key):**
In interactive mode, pressing `Tab` cycles through effort levels:
```
[Tab] → effort: low → normal → high → xhigh → low → ...
```
The current effort level is shown in the status line. This lets you quickly dial up effort for a complex question, then dial back down for routine tasks.

### When to Use Each Effort Level

**`low` effort:**
- Renaming variables or functions
- Formatting code (adding whitespace, restructuring imports)
- Generating boilerplate from a template
- Looking up an API signature
- Simple string manipulation or data transformation
- Running commands and reporting output

```bash
# Appropriate for low effort:
claude --effort low "format this JSON file with 2-space indentation"
claude --effort low "rename all instances of `userId` to `user_id` in this file"
```

**`normal` effort:**
- Writing a new function with clear requirements
- Adding a feature to an existing module
- Writing unit tests for a known function
- Code review for style and obvious bugs
- Standard daily development tasks

```bash
# Normal effort (default) is fine here:
claude "implement a pagination helper for the users API endpoint"
claude "write tests for the formatCurrency function"
```

**`high` effort:**
- Debugging a non-obvious bug across multiple files
- Designing a moderately complex feature
- Reviewing code for subtle security issues
- Optimizing a slow query or algorithm
- Migrating code between API versions

```bash
claude --effort high "find why the user session sometimes expires unexpectedly"
claude --effort high "design the caching layer for the recommendation service"
```

**`xhigh` effort:**
- Designing a distributed system or microservice architecture
- Debugging a Heisenbug (intermittent, hard-to-reproduce failure)
- Analyzing complex trade-offs (consistency vs. availability, performance vs. maintainability)
- Understanding a large unfamiliar codebase at a deep level
- Planning a major refactoring spanning many services
- Evaluating ambiguous requirements and asking the right clarifying questions

```bash
claude --effort xhigh "design the event sourcing architecture for the billing domain"
claude --model opus --effort xhigh "why does our distributed lock sometimes fail under high contention?"
```

### Effort vs. Model: What Changes What

Effort and model are independent dimensions:

```
                LOW EFFORT          HIGH EFFORT (xhigh)
              ┌─────────────────────────────────────────┐
  HAIKU       │ Fastest, cheapest   │ Fast, more thinking│
  (cheapest)  │ Trivial tasks only  │ Moderate complexity│
              │─────────────────────────────────────────│
  SONNET      │ Good speed/cost     │ Deep thinking,     │
  (balanced)  │ Most daily work     │ complex features   │
              │─────────────────────────────────────────│
  OPUS        │ Opus capability,    │ MAXIMUM POWER:     │
  (most cap.) │ no extended think   │ Best results for   │
              │ (unusual choice)    │ hardest problems   │
              └─────────────────────────────────────────┘
```

Haiku with `xhigh` effort gives you an economical model that thinks harder than it would by default. Opus with `low` effort gives you Opus's knowledge and capability without the extended thinking overhead — useful when you want the best model but on a simple task.

---

## 4. Extended Thinking

### What Extended Thinking Is

Extended thinking is Claude's internal scratchpad. Before generating a response, Claude produces "thinking tokens" — reasoning chains, hypotheses, working memory, plan formation — that are never shown directly to the user but inform the final response.

```
User prompt
    ↓
┌─────────────────────────────────────────────────┐
│ EXTENDED THINKING (internal, not shown)          │
│                                                  │
│ Let me think about this architecture problem...  │
│ Option A: Event sourcing — pros: audit trail,    │
│   eventual consistency. Cons: complexity, query  │
│   patterns change fundamentally...               │
│ Option B: CQRS with read models — more aligned  │
│   with current team expertise...                 │
│ The team has 2 senior devs with event sourcing  │
│ experience. The read load is 10:1 vs write.     │
│ Recommendation: start with CQRS + domain events │
│ without full event sourcing, evaluate in 6mo... │
└─────────────────────────────────────────────────┘
    ↓
User-visible response (informed by thinking)
```

### Why Extended Thinking Helps

Without extended thinking, Claude must produce its response token by token, left-to-right, in a single pass. With extended thinking, Claude can explore multiple approaches, reject dead ends, and arrive at the response only after working through the problem.

Tasks that benefit most:
- **Complex debugging**: Forming and testing hypotheses about root cause
- **Architecture planning**: Weighing alternatives before committing to a design
- **Trade-off analysis**: Genuinely considering both sides before recommending
- **Ambiguous requirements**: Identifying what's unclear before asking questions
- **Mathematical or logical reasoning**: Multi-step derivations that require backtracking
- **Security analysis**: Considering attack vectors systematically

Tasks that don't benefit much:
- **Simple lookups**: Retrieving a known fact — no reasoning needed
- **Boilerplate generation**: Filling in a known template
- **Reformatting**: Restructuring without semantic change
- **Command execution**: Running a tool and reporting its output

### Token Economics of Extended Thinking

Extended thinking tokens are **charged at output rates** but typically do not appear in the response. This means higher effort = higher output token cost, even though you don't see the thinking in the response.

```
Example: Sonnet 4.6, "design the caching strategy for our API"

  effort: normal
    Input:   2,000 tokens  @ $3.00/M  = $0.006
    Thinking:  3,000 tokens  @ $15.00/M = $0.045   ← output rate
    Output:  1,500 tokens  @ $15.00/M = $0.0225
    Total: ~$0.074

  effort: xhigh
    Input:   2,000 tokens  @ $3.00/M  = $0.006
    Thinking: 25,000 tokens  @ $15.00/M = $0.375   ← output rate
    Output:  2,000 tokens  @ $15.00/M = $0.030
    Total: ~$0.411

  → xhigh costs ~5.5× more than normal for this prompt
  → But the xhigh response is substantially more thorough
```

The tradeoff: high-effort responses are more expensive but often reduce total session cost by reducing back-and-forth, catching more issues in one pass, and producing fewer follow-up questions.

---

## 5. Selecting Models

### All Selection Methods

Claude Code provides six distinct ways to select the active model. Here's the complete priority order (highest priority wins):

```
Priority 1: --model CLI flag             claude --model opus
Priority 2: /model slash command         /model claude-haiku-4-5
Priority 3: ANTHROPIC_MODEL env var      ANTHROPIC_MODEL=claude-sonnet-4-6
Priority 4: model in settings.json       { "model": "claude-opus-4-7" }
Priority 5: per-agent frontmatter        model: claude-haiku-4-5
Priority 6: Claude Code internal default claude-sonnet-4-6
```

**Per-agent frontmatter** (discussed in detail in section 12) lets individual subagents use different models than the orchestrating session.

**Per-command model in skill frontmatter:**

```markdown
---
name: security-review
description: Performs comprehensive security review
model: claude-opus-4-7
effort: xhigh
---

You are a security-focused code reviewer...
```

This security review skill always uses Opus at maximum effort — appropriate for the task's importance — regardless of what model the user has selected for their interactive session.

### Comparing Model Selection Mechanisms

| Mechanism | Scope | Persists? | Use Case |
|---|---|---|---|
| `--model` flag | One session | No | Testing a different model today |
| `/model` command | One session (from that message) | No | Switching mid-session for a hard problem |
| `ANTHROPIC_MODEL` env | All sessions in this shell | Shell session | Personal shell preference |
| `settings.json` (user) | All sessions, all projects | Yes | Personal permanent default |
| `settings.json` (project) | All sessions in this project | Yes | Team-agreed project default |
| Agent frontmatter | Per agent invocation | Yes | Cost-optimized agent fleet |
| Skill frontmatter | Per skill invocation | Yes | Task-appropriate model |

---

## 6. The /advisor Command

### Overview

`/advisor` is a dual-model architecture within Claude Code that uses two models in tandem:

- **Executor** (Sonnet 4.6): Handles fast, efficient task execution — reading files, running tools, generating routine code
- **Advisor** (Opus 4.7): Invoked at key decision points to provide deep analysis, architectural guidance, and complex reasoning

The result is a session that feels like Sonnet's speed (for most operations) but benefits from Opus's depth at critical decision moments.

### When /advisor Activates

The advisor model fires on:

1. **Ambiguous requirements**: When the executor encounters a request with multiple valid interpretations and needs to reason about which is correct
2. **Architectural decisions**: When choosing between design patterns, data structures, or system architectures
3. **Trade-off analysis**: When evaluating competing approaches (performance vs. maintainability, consistency vs. availability)
4. **Complex debugging**: When the executor has tried several hypotheses and needs fresh strategic thinking
5. **Unclear constraints**: When business rules are implicit and need to be surfaced before proceeding

### Triggering /advisor Explicitly

You can invoke the advisor mode directly:

```
> /advisor

Advisor mode active. Sonnet will execute tasks; Opus will be consulted 
for strategic decisions. This session will cost more than standard Sonnet 
but less than full Opus for all turns.

> Design the database schema for a multi-tenant SaaS billing system
  with support for usage-based pricing, flat subscriptions, and hybrid plans.

[Sonnet: Reading existing schema files, understanding current data model...]
[Opus consulted: Analyzing billing domain complexity, evaluating multi-tenancy 
 strategies: row-level tenant isolation vs. schema-per-tenant vs. database-per-tenant...]
[Sonnet: Generating schema based on Opus recommendation: row-level isolation 
 with tenant_id on all tables, RLS policies, separate pricing_tiers table...]
```

### Token Cost of /advisor Sessions

```
Standard Sonnet session:
  100 turns × 5,000 input tokens × $3.00/M = $1.50 input
  100 turns × 2,000 output tokens × $15.00/M = $3.00 output
  Total: ~$4.50/session

/advisor session (Opus consulted ~15% of turns):
  85 Sonnet turns × 5,000 input × $3.00/M = $1.28
  85 Sonnet turns × 2,000 output × $15.00/M = $2.55
  15 Opus turns × 5,000 input × $15.00/M = $1.13
  15 Opus turns × 2,000 output × $75.00/M = $2.25
  Total: ~$7.21/session

Full Opus session (for comparison):
  100 turns × 5,000 input × $15.00/M = $7.50
  100 turns × 2,000 output × $75.00/M = $15.00
  Total: ~$22.50/session
```

The `/advisor` pattern delivers ~80% of full-Opus quality at ~32% of full-Opus cost. For teams doing significant architectural work, `/advisor` is often the most cost-effective option.

---

## 7. Model Selection by Task Type

### Decision Matrix

Use this matrix to choose the right model and effort level for common task types.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     MODEL × EFFORT DECISION MATRIX                          │
├──────────────────────────────┬─────────────────────┬────────────────────────┤
│ Task Type                    │ Recommended          │ Rationale              │
├──────────────────────────────┼─────────────────────┼────────────────────────┤
│ ARCHITECTURE & DESIGN                                                        │
│ New service architecture     │ Opus 4.7, xhigh      │ Maximum depth needed   │
│ Database schema design       │ Opus 4.7, high       │ Trade-offs matter      │
│ API contract design          │ Sonnet, high         │ Balanced depth/speed   │
│ Technology selection         │ Opus 4.7, xhigh      │ Long-term implications │
├──────────────────────────────┼─────────────────────┼────────────────────────┤
│ DEBUGGING                                                                    │
│ Obvious bug (stack trace)    │ Sonnet, normal       │ Fast, clear cause      │
│ Intermittent/timing bug      │ Opus 4.7, xhigh      │ Hypothesis exploration │
│ Performance bottleneck       │ Sonnet, high         │ Analysis, not guessing │
│ Security vulnerability       │ Opus 4.7, high       │ Miss nothing           │
├──────────────────────────────┼─────────────────────┼────────────────────────┤
│ FEATURE DEVELOPMENT                                                          │
│ Well-specified feature       │ Sonnet, normal       │ Efficient execution    │
│ Ambiguous requirements       │ Opus 4.7, high       │ Clarification matters  │
│ Complex business logic       │ Sonnet, high         │ More thinking          │
│ Integration with 3rd-party   │ Sonnet, normal       │ Read docs, implement   │
├──────────────────────────────┼─────────────────────┼────────────────────────┤
│ CODE REVIEW                                                                  │
│ Style and formatting         │ Haiku, low           │ Rules are deterministic│
│ Logic and correctness        │ Sonnet, normal       │ Balanced               │
│ Security review              │ Opus 4.7, high       │ Miss nothing           │
│ Architecture review          │ Opus 4.7, xhigh      │ Deep analysis          │
├──────────────────────────────┼─────────────────────┼────────────────────────┤
│ TESTING                                                                      │
│ Unit tests for known fn      │ Haiku, normal        │ Mechanical, fast       │
│ Integration test design      │ Sonnet, normal       │ Needs context          │
│ Test strategy planning       │ Sonnet, high         │ Broader thinking       │
│ Edge case identification     │ Opus 4.7, high       │ Adversarial thinking   │
├──────────────────────────────┼─────────────────────┼────────────────────────┤
│ DOCUMENTATION                                                                │
│ Inline code comments         │ Haiku, low           │ Fastest, adequate      │
│ API documentation            │ Sonnet, normal       │ Needs accuracy         │
│ Architecture docs            │ Sonnet, normal       │ Prose generation       │
│ README / getting started     │ Sonnet, low          │ Structured output      │
├──────────────────────────────┼─────────────────────┼────────────────────────┤
│ CI/CD & AUTOMATION                                                           │
│ Linting / formatting         │ Haiku, low           │ Pure mechanical        │
│ PR description generation    │ Haiku, normal        │ Templated output       │
│ Changelog generation         │ Haiku, normal        │ Diff-to-text           │
│ Security scanning report     │ Sonnet, normal       │ Synthesis needed       │
│ Cost-sensitive bulk ops      │ Haiku, low           │ Volume × cost matters  │
├──────────────────────────────┼─────────────────────┼────────────────────────┤
│ INTERACTIVE DAILY DEVELOPMENT                                                │
│ Default interactive session  │ Sonnet, normal       │ The sweet spot         │
│ Complex day (arch + features)│ /advisor command     │ Dynamic model switching│
│ Learning / exploration       │ Sonnet, normal       │ Responsive, capable    │
│ On a budget                  │ Haiku, normal        │ 75% less than Sonnet   │
└──────────────────────────────┴─────────────────────┴────────────────────────┘
```

---

## 8. AWS Bedrock Models

### Setup Overview

Claude Code can run against AWS Bedrock instead of the Anthropic API. This is common in enterprise environments with existing AWS contracts, VPC endpoints, or compliance requirements around data residency.

### Required Environment Variables

```bash
# Enable Bedrock mode
export CLAUDE_CODE_USE_BEDROCK=1

# AWS region — use a region with Claude models available
export AWS_REGION=us-east-1
# or
export AWS_DEFAULT_REGION=us-east-1

# Optional: Custom Bedrock endpoint (for VPC endpoints, govcloud, etc.)
export ANTHROPIC_BEDROCK_BASE_URL=https://bedrock-runtime.us-east-1.amazonaws.com

# AWS credentials — use standard AWS auth chain:
# IAM role (recommended), env vars, ~/.aws/credentials, or instance profile
export AWS_ACCESS_KEY_ID=AKI...
export AWS_SECRET_ACCESS_KEY=...
# OR just use an IAM role if running on EC2/ECS/Lambda/etc.
```

### Bedrock Model IDs

Bedrock uses cross-region inference profile IDs rather than direct model IDs. Claude Code handles this mapping internally, but for reference:

| Claude Model | Bedrock Cross-Region Inference Profile ID |
|---|---|
| claude-opus-4-7 | `us.anthropic.claude-opus-4-7-20261001-v1:0` |
| claude-opus-4-6 | `us.anthropic.claude-opus-4-6-20260601-v1:0` |
| claude-sonnet-4-6 | `us.anthropic.claude-sonnet-4-6-20260301-v1:0` |
| claude-haiku-4-5 | `us.anthropic.claude-haiku-4-5-20260101-v1:0` |

Note: Cross-region inference profile IDs include the `us.` prefix (for US-based inference routing). Equivalent `eu.` and `ap.` prefixed profiles exist for GDPR/APAC regional routing.

### Bedrock Service Tiers (Added v2.1.122)

AWS Bedrock offers three service tiers for Claude models, selectable via the `CLAUDE_CODE_BEDROCK_SERVICE_TIER` environment variable:

```bash
# Default tier: standard performance, pay-per-token
export CLAUDE_CODE_BEDROCK_SERVICE_TIER=default

# Flex tier: lower priority, lower cost, may have higher latency
export CLAUDE_CODE_BEDROCK_SERVICE_TIER=flex

# Priority tier: reserved throughput, lowest latency, highest cost
export CLAUDE_CODE_BEDROCK_SERVICE_TIER=priority
```

**Use cases by tier:**

| Tier | Latency | Cost | Best For |
|---|---|---|---|
| `default` | Medium | Standard | Most Claude Code usage |
| `flex` | Variable/higher | 20–40% lower | CI/CD, batch processing, non-interactive work |
| `priority` | Lowest | 30–50% higher | Real-time interactive sessions at scale, SLA-bound pipelines |

### AWS Bedrock Service Tiers (v2.1.122+)

```bash
# Three service tier options
CLAUDE_CODE_BEDROCK_SERVICE_TIER=default    # Standard (default)
CLAUDE_CODE_BEDROCK_SERVICE_TIER=flex       # Flexible capacity
CLAUDE_CODE_BEDROCK_SERVICE_TIER=priority   # Priority throughput
```

| Tier | Throughput | Latency | Best for |
|------|-----------|---------|---------|
| `default` | Standard | Standard | Normal development work |
| `flex` | Flexible (scales) | Variable | Batch/async workloads |
| `priority` | High (reserved) | Low | Time-sensitive CI/CD |

### Bedrock Authentication Patterns

```bash
# IAM Role (recommended for EC2/ECS/Lambda):
# Just set CLAUDE_CODE_USE_BEDROCK=1 — the SDK picks up the role automatically

# IAM User (dev workstations):
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# AWS Profile (when you have multiple accounts configured):
export AWS_PROFILE=my-production-account

# IAM Identity Center (SSO):
aws sso login --profile my-sso-profile
export AWS_PROFILE=my-sso-profile
```

### Bedrock Limitations vs. Direct API

| Feature | Direct API | Bedrock |
|---|---|---|
| Prompt caching | Yes | Yes (some regions) |
| Extended thinking | Yes | Yes |
| Streaming | Yes | Yes |
| Batch API | Yes | Via Bedrock Batch |
| Model IDs | claude-opus-4-7 | Cross-region inference profile IDs |
| Pricing | Anthropic pricing | AWS Bedrock pricing (typically similar, may include reserved throughput options) |
| Data residency | Anthropic servers | AWS regions of your choice |
| VPC isolation | No | Yes (VPC endpoints) |

---

## 9. Google Cloud Vertex AI

### Setup Overview

Claude Code supports Google Cloud Vertex AI as an alternative to the Anthropic API. Use Vertex when your organization has existing GCP infrastructure, needs data residency in GCP regions, or has committed GCP spend.

### Required Environment Variables

```bash
# Enable Vertex AI mode
export CLAUDE_CODE_USE_VERTEX=1

# GCP region with Vertex AI Claude availability
export CLOUD_ML_REGION=us-east5
# Common options: us-east5, us-central1, europe-west4, asia-southeast1

# GCP project ID where Vertex AI is enabled
export ANTHROPIC_VERTEX_PROJECT_ID=my-gcp-project-12345

# Authentication — use Application Default Credentials:
gcloud auth application-default login
# Or set GOOGLE_APPLICATION_CREDENTIALS for service account key file:
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### Model IDs in Vertex

Vertex AI uses simplified model IDs (no date suffix required for stable releases):

| Claude Model | Vertex AI Model ID |
|---|---|
| claude-opus-4-7 | `claude-opus-4@7` |
| claude-opus-4-6 | `claude-opus-4@6` |
| claude-sonnet-4-6 | `claude-sonnet-4@6` |
| claude-haiku-4-5 | `claude-haiku-4@5` |

Claude Code translates the standard Anthropic model IDs to Vertex format automatically when `CLAUDE_CODE_USE_VERTEX=1` is set.

### Workload Identity Federation (Added v2.1.121)

Workload Identity Federation (WIF) allows Claude Code running in GCP environments to authenticate without service account key files — using the machine's own identity instead.

```bash
# No key file needed when running on:
# - GKE (Google Kubernetes Engine) with Workload Identity
# - Cloud Run
# - Cloud Functions
# - Compute Engine with a service account

# Just set:
export CLAUDE_CODE_USE_VERTEX=1
export CLOUD_ML_REGION=us-east5
export ANTHROPIC_VERTEX_PROJECT_ID=my-gcp-project

# Authentication is automatic via the workload's service account
```

WIF configuration in GKE:
```yaml
# kubernetes deployment with Workload Identity
apiVersion: apps/v1
kind: Deployment
metadata:
  name: claude-code-agent
spec:
  template:
    metadata:
      annotations:
        iam.gke.io/gcp-service-account: claude-code-sa@my-project.iam.gserviceaccount.com
    spec:
      serviceAccountName: claude-code-ksa
      containers:
      - name: agent
        env:
        - name: CLAUDE_CODE_USE_VERTEX
          value: "1"
        - name: CLOUD_ML_REGION
          value: us-east5
        - name: ANTHROPIC_VERTEX_PROJECT_ID
          value: my-gcp-project
```

### Model Garden vs. Direct API

Vertex AI provides two access paths to Claude models:

| Path | When to Use |
|---|---|
| **Model Garden** | UI-based testing, one-off experiments, team exploration without code |
| **Direct API** (used by Claude Code) | Production use, CI/CD integration, programmatic access |

Claude Code always uses the direct Vertex API — not Model Garden. Model Garden is for manual, interactive exploration in the GCP console.

---

## 10. Pricing Deep-Dive

### How Claude Code Session Costs Are Calculated

A Claude Code session cost is the sum of all API calls made during the session. Each API call charges:

```
Cost = (input_tokens × input_price) 
     + (output_tokens × output_price)
     + (cache_read_tokens × cache_read_price)
     - (cache_write_overhead is minimal and typically not shown separately)
```

**What counts as input tokens:**
- Your messages (the text you type)
- System prompt (injected by Claude Code)
- All loaded CLAUDE.md files (injected each turn)
- Tool results (results from bash, file reads, etc. fed back into context)
- Conversation history from previous turns in this session
- Reasoning context injected by Claude Code

**What counts as output tokens:**
- Claude's text responses
- Tool call parameters (the JSON arguments when Claude calls a tool)
- Extended thinking tokens (reasoning tokens, at output rates)

**What counts as cache read tokens:**
- Previous turns' content that hit the prompt cache
- Claude Code aggressively caches: conversation history, CLAUDE.md content, and system prompts are cached whenever possible
- Cache reads are ~90% cheaper than regular input tokens

### Prompt Caching Impact

Prompt caching is automatically enabled in Claude Code. Its effect on session costs is dramatic:

```
WITHOUT caching:
  Turn 1: 5,000 input tokens (fresh)
  Turn 2: 10,000 input tokens (5K new + 5K prior)
  Turn 3: 15,000 input tokens (5K new + 10K prior)
  Turn 50: 255,000 input tokens (5K new + 250K prior)
  
  Total input: 5K + 10K + 15K + ... + 255K = 6.5M tokens
  At $3/M (Sonnet): $19.50

WITH caching (Claude Code default):
  Turn 1: 5,000 input tokens @ $3.00/M = $0.015
  Turn 2: 5,000 new + 5,000 cached @ ($3.00/M + $0.30/M) = $0.017
  Turn 3: 5,000 new + 10,000 cached @ ($3.00/M + $0.30/M) = $0.018
  ...
  Turn 50: 5,000 new + 250,000 cached @ ($3.00 + $0.30/M)
  
  Total: ~$3.85 (vs $19.50 without caching — 80% reduction)
```

### Typical Cost Ranges

These ranges represent actual developer usage patterns, not theoretical minima:

```
Developer Type: ACTIVE DAILY DEVELOPMENT (8 hours)

  Budget developer (Haiku, normal effort):
    Typical: $1–4/active day
    Max: ~$8/active day
    Use: Simple edits, documentation, formatting

  Standard developer (Sonnet, normal effort):
    Typical: $5–15/active day
    Max: ~$30/active day
    Use: Feature development, code review, debugging

  Power developer (Sonnet high + Opus for hard problems):
    Typical: $15–40/active day
    Max: ~$80/active day
    Use: Architecture work, complex debugging

  Heavy Opus user (Opus, xhigh effort):
    Typical: $40–120/active day
    Max: ~$250/active day
    Use: All-day complex architecture/debugging sessions

Note: "active day" means actively prompting Claude.
      Idle time doesn't cost anything.
```

### The /usage Command

Track your token usage for the current session:

```
> /usage

Session Usage (started 2026-05-17 09:15)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Model: claude-sonnet-4-6 (effort: normal)
Elapsed: 3h 42m

Input tokens:       2,847,391
  Cache reads:      2,651,482 (93.1% cache hit)
  Fresh input:        195,909

Output tokens:        283,441
  Response tokens:    221,830
  Tool call tokens:    42,180
  Thinking tokens:     19,431

Estimated cost:
  Input (fresh):        $0.59
  Input (cached):       $0.80
  Output:               $4.25
  Total:               ~$5.64

At this rate:
  Cost/hour:           ~$1.52
  Projected 8hr day:   ~$12.16
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Hard Budget Limits

To prevent runaway costs (especially in CI/CD or automated pipelines):

```bash
# Hard stop when session cost exceeds $5
claude --max-budget-usd 5.00 "refactor the entire authentication module"

# Claude stops and reports when limit approaches:
# "This session has used $4.73 of the $5.00 budget. 
#  Continuing may exceed your limit. Proceed? (y/n)"
```

In settings.json:
```json
{
  "maxBudgetUsd": 10.00,
  "budgetWarningThresholdPercent": 80
}
```

---

## 11. Cost Optimization Strategies

### Cost Optimization Patterns

| Pattern | Savings | Implementation |
|---------|---------|---------------|
| Use Haiku for bulk edits | 80–90% | `--model haiku` for formatting/docs |
| Use low effort for simple tasks | 40–60% | `CLAUDE_CODE_EFFORT=low` |
| Warm prompt cache | 70–75% (cached tokens) | Send CLAUDE.md content before heavy work |
| Use minimal output style | 30–50% (output tokens) | `/config` → select Minimal output style |
| Set max budget | Prevent runaway costs | `--max-budget-usd 2.00` |
| Use /compact frequently | 30–50% | Compact at milestones: `/compact "keep: ..."` |
| Batch CI reviews | Cache reuse | Run multiple PR reviews in same session |
| Use --bare in CI | 14% faster | `claude -p --bare "..."` |

### Strategy 1: Right-Size Model and Effort

The single highest-impact optimization. Using Haiku instead of Sonnet for appropriate tasks saves 75% per token. Using `normal` instead of `xhigh` effort saves 50–300% on thinking tokens.

```bash
# Before (expensive):
claude --model opus --effort xhigh "add a docstring to this function"

# After (appropriate):
claude --model haiku --effort low "add a docstring to this function"

# Cost difference: ~20-50× cheaper for the same output quality on this task
```

### Strategy 2: Use Prompt Caching (Automatic)

Prompt caching is on by default and requires no configuration. It caches:
- The system prompt and CLAUDE.md content
- Conversation history
- Large tool results

The only thing you can do to help caching: **keep CLAUDE.md files stable**. Changing CLAUDE.md mid-session invalidates the cache for that content. Write once, don't modify during active sessions.

### Strategy 3: Use /compact Proactively

Run `/compact` before context history grows very large. This:
1. Summarizes history (reduces input tokens for future turns)
2. Resets the cache (old turns no longer in context = smaller input)
3. Preserves project CLAUDE.md (re-read from disk)

Rule of thumb: if `/usage` shows more than 500K input tokens in a session, consider compacting.

### Strategy 4: Keep CLAUDE.md Concise

Every token in CLAUDE.md is paid on every turn. A 10,000-token CLAUDE.md across 50 turns = 500,000 input tokens in overhead alone ($1.50 at Sonnet pricing, just for memory overhead).

Practical CLAUDE.md sizes:
- Enterprise: < 2,000 tokens (only essential policy)
- User: < 3,000 tokens (genuine cross-project preferences)
- Project: < 5,000 tokens (including @imports)
- Subtree: < 2,000 tokens each (domain-specific only)

### Strategy 5: Scope Tool Access

When Claude reads a tool result, that result enters the context window and is cached forward. Avoid:
- Reading entire large files when you only need a section
- Running commands that produce thousands of lines of output
- Using `grep` patterns that return too many results

Use:
```
> Read just the function signature at line 47 of service.go
> Show me only the failing test output (not the full test run)
> List only Go files in the src/ directory, not recursively
```

### Strategy 6: Use --effort low for Simple Tasks

When you know a task is mechanical, specify low effort:

```bash
# These don't need extended thinking:
claude --effort low "run pnpm lint and show me the output"
claude --effort low "add a TODO comment before the processPayment function"
claude --effort low "list all files that import from src/auth/"
claude --effort low "format this JSON: $(cat data.json)"
```

### Strategy 7: Per-Agent Model Selection

In multi-agent pipelines, use model heterogeneity to minimize cost:

```
Agent Fleet Cost Optimization:

  Orchestrator (Opus, high):    Plans work, delegates tasks      $0.50/session
  Code writer (Sonnet, normal): Implements what orchestrator plans $2.00/session  
  Test writer (Haiku, normal):  Generates mechanical test stubs    $0.30/session
  Linter (Haiku, low):         Runs checks, reports results       $0.10/session
  Reviewer (Opus, xhigh):      Critical security/arch review      $1.50/session
  ──────────────────────────────────────────────────────────────────────────────
  Total: $4.40/session vs. all-Opus: $22.50/session  (80% cost reduction)
```

---

## 12. Per-Agent and Per-Skill Model Selection

### Why Per-Agent Model Selection Matters

In Claude Code's multi-agent mode, you often have:
- One orchestrating agent (needs complex reasoning)
- Many executing agents (do mechanical work)
- Specialized agents (security reviewer needs Opus; doc writer is fine with Haiku)

Forcing all agents onto the same model wastes money on simple agents and may underpower complex ones.

### Model Resolution Order for Agents

When Claude Code launches a subagent, the model is determined by this priority chain:

```
Priority 1: CLAUDE_CODE_SUBAGENT_MODEL env var
Priority 2: Per-invocation model parameter (set by orchestrating agent)
Priority 3: Agent definition frontmatter model field
Priority 4: Main session model (inherited)
```

**Priority 1: Environment override (all subagents):**
```bash
# Force ALL subagents to use Haiku regardless of their frontmatter
export CLAUDE_CODE_SUBAGENT_MODEL=claude-haiku-4-5
```

Use this for cost-sensitive CI environments where you want to override agent definitions without editing them.

**Priority 3: Agent frontmatter:**
```markdown
---
name: architecture-advisor
description: Advises on system architecture and design trade-offs
model: claude-opus-4-7
effort: xhigh
tools:
  - read_file
  - list_directory
  - web_search
memory:
  scope: project
---

You are a senior software architect specializing in distributed systems...
```

```markdown
---
name: doc-writer
description: Generates documentation from code and comments
model: claude-haiku-4-5
effort: low
tools:
  - read_file
  - write_file
---

You generate clear, accurate documentation from code...
```

### Practical Multi-Model Agent Pipeline

```markdown
<!-- .claude/agents/orchestrator.md -->
---
name: orchestrator
description: Plans and coordinates complex development tasks
model: claude-sonnet-4-6
effort: high
---

You are the orchestrator. For each task:
1. Analyze complexity and determine which specialist agents to invoke
2. For architecture questions: delegate to architecture-advisor (Opus)
3. For code implementation: delegate to code-writer (Sonnet)
4. For tests: delegate to test-writer (Haiku)
5. For documentation: delegate to doc-writer (Haiku)
6. Synthesize results and provide the user a coherent summary
```

```markdown
<!-- .claude/agents/test-writer.md -->
---
name: test-writer
description: Writes unit and integration tests for specified functions
model: claude-haiku-4-5
effort: normal
tools:
  - read_file
  - write_file
  - bash
---

Generate comprehensive test cases for the provided code.
Follow the project's testing conventions in CLAUDE.md.
Use table-driven tests where appropriate.
```

### Cost Implications of Per-Agent Model Selection

```
Scenario: New feature development pipeline
(design → implement → test → document → review)

All-Sonnet pipeline (naive):
  Design:      Sonnet $0.12
  Implement:   Sonnet $0.45
  Test:        Sonnet $0.23
  Document:    Sonnet $0.18
  Review:      Sonnet $0.31
  Total: $1.29/feature

Optimized pipeline:
  Design:      Opus, xhigh   $0.85  ← Worth the premium
  Implement:   Sonnet, normal $0.45  ← Sweet spot
  Test:        Haiku, normal  $0.06  ← 75% cheaper, same output
  Document:    Haiku, low     $0.04  ← Mechanical task
  Review:      Opus, high     $0.62  ← Critical quality gate
  Total: $2.02/feature

Wait — optimized is MORE expensive?

Yes — because we deliberately upgraded the design and review phases
to Opus. The insight: optimize for quality at quality-critical phases,
optimize for cost at mechanical phases.

The all-Sonnet pipeline may seem cheaper, but Sonnet architecture
design often produces rework, and Sonnet security review misses issues
that Opus catches. Total cost including rework favors the Opus-at-gates
pattern for quality-critical work.

For pure cost minimization (e.g., CI/CD pipelines):
  All tasks: Haiku, normal
  Total: $0.09/feature
  Use when: Documentation generation, changelog creation, 
            lint report summarization, PR description generation
```

### CLAUDE_CODE_SUBAGENT_MODEL in CI/CD

```yaml
# .github/workflows/claude-review.yml
- name: Claude Code PR Review
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    # Force all agents to Haiku for CI cost control
    CLAUDE_CODE_SUBAGENT_MODEL: claude-haiku-4-5
    # But the main session can use Sonnet
    ANTHROPIC_MODEL: claude-sonnet-4-6
  run: |
    claude --max-budget-usd 2.00 \
           "Review this PR for obvious bugs and style issues. 
            Generate a markdown summary of findings."
```

---

## Summary Reference Card

```
┌──────────────────────────────────────────────────────────────────────┐
│              MODELS & PRICING QUICK REFERENCE (v2.1.126)             │
├─────────────────┬──────────┬───────────┬──────────────────────────────┤
│ Model           │ Ctx      │ Input $/M │ Best For                     │
├─────────────────┼──────────┼───────────┼──────────────────────────────┤
│ claude-opus-4-7 │ 1M       │ $15.00    │ Architecture, hard debugging  │
│ claude-opus-4-6 │ 200K     │ $15.00    │ Opus tasks, smaller context  │
│ claude-sonnet-4-6│ 200K    │ $3.00     │ Daily dev, feature work      │
│ claude-haiku-4-5│ 200K     │ $0.80     │ Bulk ops, CI, simple tasks   │
├─────────────────┴──────────┴───────────┴──────────────────────────────┤
│ EFFORT LEVELS                                                         │
│   low    — No extended thinking. Fastest, cheapest.                  │
│   normal — Minimal thinking. Default for Sonnet.                     │
│   high   — Substantial thinking. Complex features.                   │
│   xhigh  — Maximum thinking. Default for Opus 4.7.                  │
├────────────────────────────────────────────────────────────────────── ┤
│ SELECTION PRIORITY (highest first)                                    │
│   1. --model flag                                                     │
│   2. /model command                                                   │
│   3. ANTHROPIC_MODEL env var                                          │
│   4. model in settings.json                                           │
│   5. Agent/skill frontmatter                                          │
│   6. Claude Code default (Sonnet 4.6)                                 │
├──────────────────────────────────────────────────────────────────────┤
│ COST OPTIMIZATION                                                     │
│   • Use Haiku for CI/CD and bulk operations                          │
│   • Prompt caching on by default (90% cheaper for cached tokens)     │
│   • /compact to reduce context growth                                │
│   • --effort low for mechanical tasks                                │
│   • --max-budget-usd for hard cost limits                            │
│   • CLAUDE_CODE_SUBAGENT_MODEL=claude-haiku-4-5 for CI agents        │
├──────────────────────────────────────────────────────────────────────┤
│ CLOUD DEPLOYMENT                                                      │
│   AWS Bedrock:   CLAUDE_CODE_USE_BEDROCK=1 + AWS credentials         │
│   Vertex AI:     CLAUDE_CODE_USE_VERTEX=1 + GCP credentials          │
│   Bedrock tiers: CLAUDE_CODE_BEDROCK_SERVICE_TIER=default|flex|prio  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 13. Model Selection Flowchart

Use this decision flowchart when you are not sure which model and effort level to use:

```
START: What is the task?
    │
    ├─ Formatting, renaming, boilerplate, docs?
    │   └─► Haiku, low effort  ($0.80/M input, fastest)
    │
    ├─ Standard daily dev (new function, unit tests, simple bug)?
    │   └─► Sonnet, normal effort  ($3.00/M input, default)
    │
    ├─ Complex feature, multi-file refactor, non-obvious bug?
    │   └─► Sonnet, high effort  ($3.00/M + thinking overhead)
    │
    ├─ Architecture design, ambiguous requirements, security review?
    │   └─► Opus, high effort  ($15.00/M input)
    │
    ├─ Hardest problems: distributed systems, Heisenbugs, trade-off analysis?
    │   └─► Opus 4.7, xhigh effort  ($15.00/M + heavy thinking)
    │
    ├─ Mixed session (some routine, some complex)?
    │   └─► /advisor command  (Sonnet + Opus on demand, ~32% of all-Opus cost)
    │
    └─ Bulk CI/CD, PR descriptions, changelog generation?
        └─► Haiku, low effort  + CLAUDE_CODE_SUBAGENT_MODEL=claude-haiku-4-5
```

### The 80/20 Rule for Model Selection

In practice, the majority of Claude Code usage follows a simple pattern:

```
80% of prompts → Sonnet, normal effort
15% of prompts → Opus, high/xhigh effort  (architecture, hard bugs)
 5% of prompts → Haiku, low effort  (mechanical, bulk, CI)

For a standard 8-hour development day:
  If 80% Sonnet + 15% Opus + 5% Haiku:
    ≈ $8–15/day total
    (much less than all-Opus: $40–120/day)
    (much more capable than all-Haiku: $1–3/day)
```

The 80/20 rule gives you near-Opus quality on the tasks that matter, at a fraction of the cost.

---

## 14. Real-World Cost Examples

### Example 1: Feature Sprint (5 days)

```
Task: Implement user notification system end-to-end
  (schema, API, service layer, tests, docs, PR description)

Day 1 — Architecture (Opus, xhigh):
  Design review, schema proposal, API contract
  Tokens: 500K input, 50K output (incl. thinking)
  Cost: $500K × $15/M + $50K × $75/M = $7.50 + $3.75 = $11.25

Days 2-4 — Implementation (Sonnet, normal, with caching):
  3 × 8 hours of feature development
  Tokens: 3M input (mostly cached), 300K output
  Cost: ~3M × $0.30/M (cached) + 300K × $15/M = $0.90 + $4.50 = $5.40/day
  3 days: $16.20

Day 5 — Review + PR (Sonnet for review, Haiku for PR description):
  Security review (Sonnet, high): $2.50
  PR description generation (Haiku, low): $0.10
  Day 5: $2.60

Total 5-day sprint: $11.25 + $16.20 + $2.60 = ~$30/sprint
Compare: Same work without Claude Code estimate: 15–20 developer hours
```

### Example 2: CI/CD Integration Review Pipeline

```
GitHub Action triggered on every PR:
  1. Haiku reads the diff (avg 2K tokens)     → $0.0016
  2. Haiku generates PR summary               → $0.0008
  3. Sonnet checks for obvious bugs           → $0.0060
  4. Haiku writes test stubs if gaps found    → $0.0016
  Total per PR: ~$0.01

At 20 PRs/day, 250 working days/year:
  5,000 PRs × $0.01 = $50/year for automated review
```

### Example 3: Codebase Understanding Session

```
New team member ramping up on a 100K-line codebase:

With Opus 4.7 (1M context):
  Load entire codebase at once: ~300K tokens
  10 architecture questions across 3 hours
  Total: ~$15 (one-time investment for full context comprehension)

With Sonnet (200K context, selective loading):
  Load 5 key modules per question
  10 questions × 20K tokens per question = 200K tokens total
  Total: ~$0.60

Choose Opus 4.7 when:
  - You need cross-file relationship understanding
  - You are debugging a non-obvious cross-cutting issue
  - One-time whole-codebase architecture session

Choose Sonnet when:
  - You are working on a specific module or feature area
  - Questions are self-contained within a subsystem
  - Cost is constrained
```
