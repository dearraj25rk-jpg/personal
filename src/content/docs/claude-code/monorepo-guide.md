---
title: Monorepo & Multi-Service Guide
description: >
  Claude Code patterns for monorepos and multi-service architectures — root-level and
  service-specific CLAUDE.md hierarchy, path-scoped rules for domain isolation, shared
  and per-service MCP servers, parallel worktree development across services,
  Agent Teams for cross-service coordination, CI/CD matrix builds, shared plugin
  libraries for org-wide conventions, and workspace-aware context management.
  v2.1.126 (May 2026).
sidebar:
  order: 27
lastUpdated: 2026-06-06
---

# Monorepo & Multi-Service Guide

> **Version:** v2.1.126 (May 2026) · Covers path-scoped rules, Agent Teams (v2.1.32+), `/branch` worktrees, plugin distribution, and CI matrix builds.

Monorepos are where Claude Code's power and its failure modes are most visible. Done right, Claude understands exactly which service it is working in, loads only the relevant context, and collaborates across service boundaries without confusion. Done wrong, Claude floods its context window with every service's documentation, applies auth-service conventions to the billing service, and generates code that violates domain boundaries.

This guide provides concrete, copy-paste configuration for teams operating monorepos of 2–20+ services.

---

## 1. Introduction — Why Monorepos Need Special Patterns

A standard single-service Claude Code setup works well: one `CLAUDE.md`, one technology stack, one team's conventions. In a monorepo, this breaks down immediately.

### The Core Challenges

**Context flooding.** A naive root `CLAUDE.md` that documents all services, all tech stacks, and all conventions consumes 2,000–8,000 tokens per session before Claude reads a single line of your code. At 15–20 turns per session, that wasted context costs real money and degrades response quality.

**Cross-service confusion.** Without domain isolation, Claude operating in `services/auth/` may apply `services/payments/` error handling conventions, import types from the wrong service, or propose architectural patterns appropriate for Go microservices when working in a .NET monolith.

**Conflicting conventions.** A Go service and a TypeScript service in the same repo have entirely different idioms — different test runners, different import styles, different error patterns. Without path-scoped configuration, Claude averages or confuses these conventions.

**Stale context.** As the monorepo grows, root-level documentation goes stale. A service added in 2023 may have documentation that contradicts a service added in 2025. Without service-level CLAUDE.md files owned by the teams that build those services, documentation drifts.

### What This Guide Solves

This guide provides:

1. A CLAUDE.md hierarchy that keeps root context lean and delegates to service-level files
2. Path-scoped rules that load domain-specific conventions only when Claude is working in that domain
3. MCP server layering for shared tools vs. service-specific tools
4. Worktree patterns for parallel development across multiple services simultaneously
5. Agent Teams orchestration for cross-service feature work
6. CI/CD matrix build patterns that avoid running expensive full-repo analysis on every change
7. A complete worked example you can copy into a 5-service monorepo today

---

## 2. CLAUDE.md Hierarchy in a Monorepo

Claude Code loads CLAUDE.md files from multiple levels of the directory tree. When your current working directory is `services/auth/src/middleware/`, Claude loads:

```
1. Enterprise CLAUDE.md   (/etc/claude-code/CLAUDE.md or MDM equivalent)
2. User CLAUDE.md         (~/.claude/CLAUDE.md)
3. Root CLAUDE.md         (monorepo-root/CLAUDE.md)
4. services/CLAUDE.md     (if it exists)
5. services/auth/CLAUDE.md
6. services/auth/src/CLAUDE.md   (if it exists)
7. services/auth/src/middleware/CLAUDE.md  (if it exists)
```

Each file is concatenated in load order. Deeper files do not override root files — they extend them. This additive concatenation means your token budget must account for all levels that exist between root and the deepest directory you work in.

### 2.1 Root CLAUDE.md — Lean and Authoritative

The root `CLAUDE.md` should document only what is true for the **entire repository** regardless of which service you are in. If a fact only applies to one service, it belongs in that service's CLAUDE.md.

**Token target: under 100 lines (approximately 800–1,200 tokens).**

What belongs in root CLAUDE.md:

- Repository layout and navigation
- Build system commands that work from the root (e.g., Nx, Turborepo, Bazel commands)
- Shared CI/CD pipeline overview
- Global Git conventions (branch naming, commit style, PR process)
- Where to find service-specific docs (pointer, not duplicate)
- Security policies that apply everywhere
- How to run the full test suite

What does NOT belong in root CLAUDE.md:

- Any service-specific architecture
- Technology-stack-specific conventions (put these in service CLAUDE.md or rules)
- Complete API documentation for any service
- Per-service environment variable lists
- Service-specific onboarding instructions

```markdown
<!-- monorepo-root/CLAUDE.md -->
# Acme Corp Monorepo

## Repository Layout
- `services/`       — All microservices (auth, api, billing, notifications, frontend)
- `packages/`       — Shared libraries consumed by services
- `infra/`          — Terraform, Helm charts, CDK stacks
- `tools/`          — Internal dev tooling and scripts
- `docs/`           — Architecture decision records (ADRs)

Each service has its own CLAUDE.md at `services/<name>/CLAUDE.md`.
Always start Claude Code from within the service directory you are working in,
not from the repo root, unless performing cross-service operations.

## Build System: Nx
```bash
nx build <service-name>         # Build a single service
nx test <service-name>          # Test a single service
nx affected --target=build      # Build only services changed vs main
nx affected --target=test       # Test only affected services
nx graph                        # View dependency graph
```

## Global Git Conventions
- Branch format: `<type>/<ticket>-<slug>` (e.g., `feat/ACME-1234-add-mfa`)
- Commit format: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- PRs require passing CI + one approval from service code owner
- Never commit directly to `main` or `dev`

## Shared Security Policy
@import shared/docs/security-policy.md

## Service Registry
For each service's architecture, conventions, and test commands,
see `services/<name>/CLAUDE.md`. Do not ask Claude to guess a service's
conventions from the root — navigate into the service directory first.
```

### 2.2 Service-Level CLAUDE.md — The Workhorse

Each service gets its own `CLAUDE.md` at `services/<name>/CLAUDE.md`. This file is the **primary context** for all development work on that service. It should be detailed and specific.

**Token target: under 150 lines (approximately 1,200–1,800 tokens).**

What belongs in a service CLAUDE.md:

- Service purpose in one paragraph (not one sentence, not three paragraphs)
- Technology stack: language, framework version, ORM, test runner, linter
- How to run the service locally (including required environment variables)
- How to run tests (unit, integration, e2e) with exact commands
- Build command and output location
- Key architectural patterns (e.g., "this service uses the outbox pattern for events")
- Critical do/don't conventions specific to this service
- Service owner / on-call channel

```markdown
<!-- services/auth/CLAUDE.md -->
# Auth Service

Handles all authentication and authorization for the Acme platform. Issues JWTs,
manages OAuth2 flows (Google, GitHub, SAML), and enforces RBAC policies.
This service is the identity source of truth — all other services validate tokens
against this service's JWKS endpoint.

## Stack
- **Language**: TypeScript 5.4, Node.js 22 LTS
- **Framework**: Fastify 5.x
- **Database**: PostgreSQL 16 (via Drizzle ORM)
- **Cache**: Redis 7 (via ioredis)
- **Test runner**: Vitest 2.x
- **Linter/formatter**: Biome 1.8

## Running Locally
```bash
cp .env.example .env.local     # fill in DB_URL, REDIS_URL, JWT_SECRET
pnpm install
pnpm dev                       # starts on :3001 with hot reload
```

## Test Commands
```bash
pnpm test              # all tests (unit + integration)
pnpm test:unit         # unit tests only (no DB)
pnpm test:integration  # requires running Docker Compose
pnpm test:watch        # watch mode
pnpm test:coverage     # with coverage report
```

## Architecture Patterns
- **Repository pattern**: all DB access goes through `src/repositories/`.
  Never write raw SQL in route handlers or services.
- **Service layer**: business logic lives in `src/services/`. Repositories
  are injected via constructor.
- **Error handling**: always use `AuthError` from `src/errors/auth-error.ts`.
  Never throw raw Error objects from services.
- **Token lifetimes**: access tokens = 15 min, refresh tokens = 7 days.
  These are not configurable at runtime — change requires a deploy.

## Critical Conventions
- All database migrations live in `db/migrations/`. Never modify existing migrations.
- Drizzle schema is the source of truth — do not add columns via raw SQL.
- JWT payload must never include PII beyond `sub` (user ID). Fetch user details
  from the user service, do not embed them in the token.
- All password operations must use the `argon2id` preset in `src/crypto/`.
  Never use bcrypt or custom hashing.

## Ownership
- Team: Platform Identity  |  Slack: #team-identity
- On-call: PagerDuty rotation "Identity On-Call"
```

### 2.3 Subdirectory CLAUDE.md — Surgical Guidance

For large services with complex internal structure, you can add CLAUDE.md files at the subdirectory level. Use these sparingly — only when a subsystem has conventions so distinct they would clutter the service-level CLAUDE.md.

Good candidates for subdirectory CLAUDE.md files:

- `services/auth/db/` — migration conventions, seeding patterns
- `services/frontend/components/` — component library conventions, storybook patterns
- `packages/shared-contracts/` — protobuf/OpenAPI conventions

Bad candidates (these belong in the service CLAUDE.md):

- Any directory where you occasionally work
- Any directory where the conventions are shared with the parent

### 2.4 @import for Shared Sections

When multiple services share identical guidelines (security policy, accessibility standards, data classification rules), use `@import` to reference a single source of truth rather than duplicating content across every service CLAUDE.md.

```markdown
<!-- services/billing/CLAUDE.md -->
# Billing Service

## Security Requirements
@import ../../shared/docs/security-policy.md

## PCI Compliance
@import ../../shared/docs/pci-requirements.md

## Service-Specific Conventions
...
```

The imported file's content is inserted inline at the `@import` location during context loading. Changes to the shared file propagate to all services automatically.

**@import best practices:**
- Keep imported files under 50 lines to avoid inflating every service's context
- Use imports for policies, not architecture (architecture varies by service)
- The import path is relative to the file containing the `@import` directive
- Circular imports are not supported — keep import chains shallow (max 2 levels)

### 2.5 Token Budget Strategy

| Level | Target | Rationale |
|-------|--------|-----------|
| Root CLAUDE.md | < 100 lines | Loaded for every session regardless of which service |
| Service CLAUDE.md | < 150 lines | Loaded whenever working in this service |
| Subdirectory CLAUDE.md | < 50 lines | Loaded only for deep work in that directory |
| @imported shared files | < 50 lines each | Count toward the including file's budget |

Total context budget across all loaded CLAUDE.md files: target under 400 lines (~3,000–4,000 tokens). This leaves ample room for rules, conversation history, and the actual code Claude is reading.

---

## 3. Path-Scoped Rules for Domain Isolation

Rules in `.claude/rules/*.md` can include a `paths:` frontmatter field that restricts when the rule is loaded. A rule with `paths:` is a **path-scoped rule** — Claude only loads it when it is reading or writing files that match the specified glob patterns.

This is the primary mechanism for domain isolation in monorepos.

### 3.1 Rule Frontmatter Syntax

```markdown
---
description: Auth service TypeScript conventions
paths:
  - "services/auth/**"
  - "services/auth/**/*.ts"
  - "services/auth/**/*.test.ts"
---

# Auth Service TypeScript Conventions

Always use Fastify's `FastifyRequest` and `FastifyReply` types from `fastify`.
Never import from `@fastify/core` directly...
```

The `paths:` field accepts an array of glob patterns relative to the repository root. When Claude is operating on a file that matches any of these patterns, the rule is loaded into context. When Claude moves to a file in a different service, the rule is automatically dropped.

### 3.2 Service Isolation Pattern

Create one rule file per service, scoped to that service's directory:

```
.claude/rules/
├── auth-service.md          paths: services/auth/**
├── billing-service.md       paths: services/billing/**
├── api-gateway.md           paths: services/api-gateway/**
├── notifications.md         paths: services/notifications/**
├── frontend.md              paths: services/frontend/**
├── shared-packages.md       paths: packages/**
├── infra-terraform.md       paths: infra/**/*.tf
├── security-all.md          (no paths — loads everywhere)
└── migrations-all.md        paths: **/db/migrations/**
```

Rules without `paths:` frontmatter load for every session, unconditionally. Use these for org-wide policies that must always be in force — security requirements, commit message policy, PR size limits.

### 3.3 Preventing Cross-Domain Confusion

Without path-scoped rules, Claude working in `services/billing/` might apply auth service conventions because they happen to be loaded. With path-scoped rules:

```markdown
---
description: Billing service Go conventions
paths:
  - "services/billing/**"
  - "services/billing/**/*.go"
---

# Billing Service Go Conventions

This service is written in Go 1.23 using the standard library HTTP package.
Do NOT use Gin, Echo, or Fiber — we deliberately use stdlib for this service.

Error handling: use `fmt.Errorf("billing: %w", err)` to wrap errors.
Never use `errors.New` for wrapping.

Database: pgx/v5 directly (no ORM). All queries live in `internal/store/`.
```

When Claude is in `services/auth/` (a TypeScript/Fastify service), this Go rule does not load. When Claude moves to `services/billing/`, it does. The context stays accurate for the current domain.

### 3.4 Shared Rules with Broad Paths

Some rules apply everywhere and should use no `paths:` filter, or a very broad one:

```markdown
---
description: Organisation-wide security policy
---

# Security Policy — All Services

## Secrets Management
Never hardcode secrets, API keys, or passwords in source code or configuration files.
All secrets must be referenced via environment variables or AWS Secrets Manager paths.

## Dependency Policy
All third-party dependencies must appear in the approved dependency registry
at https://deps.acme.internal. Do not add dependencies not on this list without
a security review (file a ticket in the Security project).

## Data Classification
- PII (names, emails, phone numbers): may only be stored in services/users/
  and services/auth/. Never copy PII to logs or other services.
- Payment data: handled only by services/billing/. Never log payment data.
- Credentials: handled only by services/auth/.
```

### 3.5 Rule Load Order

Within a session, path-scoped rules load when Claude encounters a matching file. Load order within a service follows alphabetical filename order. If you need a specific rule to take precedence, prefix filenames with numbers:

```
.claude/rules/
├── 01-security-all.md        # loads first, no paths filter
├── 10-auth-service.md        # auth-specific, loads second when in auth
├── 20-auth-database.md       # auth DB specifics, loads after service rule
```

### 3.6 Complete Rules Structure for a 5-Service Monorepo

```
.claude/rules/
├── 00-security-policy.md            # no paths — fires everywhere
│   ---
│   description: Global security policy
│   ---
│
├── 01-commit-conventions.md         # no paths — fires everywhere
│   ---
│   description: Conventional Commits policy
│   ---
│
├── services-auth.md
│   ---
│   description: Auth service (TypeScript/Fastify) conventions
│   paths: ["services/auth/**"]
│   ---
│
├── services-billing.md
│   ---
│   description: Billing service (Go) conventions
│   paths: ["services/billing/**"]
│   ---
│
├── services-api-gateway.md
│   ---
│   description: API Gateway (.NET 9 / ASP.NET Core) conventions
│   paths: ["services/api-gateway/**"]
│   ---
│
├── services-notifications.md
│   ---
│   description: Notifications service (Python/FastAPI) conventions
│   paths: ["services/notifications/**"]
│   ---
│
├── services-frontend.md
│   ---
│   description: Frontend (Next.js 15 / TypeScript) conventions
│   paths: ["services/frontend/**"]
│   ---
│
├── packages-shared.md
│   ---
│   description: Shared packages conventions
│   paths: ["packages/**"]
│   ---
│
├── infra-terraform.md
│   ---
│   description: Terraform/IaC conventions
│   paths: ["infra/**/*.tf", "infra/**/*.tfvars"]
│   ---
│
└── db-migrations.md
    ---
    description: Database migration conventions (all services)
    paths: ["**/db/migrations/**", "**/migrations/**"]
    ---
```

---

## 4. Service-Specific CLAUDE.md Per Service

### 4.1 When to Use Service CLAUDE.md vs Root CLAUDE.md

Use the service-level `services/<name>/CLAUDE.md` when the information:

- Is specific to one service's tech stack or architecture
- Would be confusing or irrelevant in any other service
- Is maintained by the team that owns the service, not a central platform team
- Changes independently from other services

Use root `CLAUDE.md` when the information:

- Applies to every service equally
- Is enforced centrally (build system, CI/CD, security policy)
- Would need to be duplicated across every service CLAUDE.md otherwise

**Rule of thumb:** if you find yourself writing the same section in 3+ service CLAUDE.md files, it belongs in root CLAUDE.md or a shared `@import` file. If a section only makes sense for one service, it belongs in that service's CLAUDE.md.

### 4.2 Different Tech Stacks in the Same Repository

Monorepos often contain services with radically different tech stacks. Claude Code handles this naturally through the hierarchy — each service CLAUDE.md instructs Claude in the language and idioms of that specific service.

```
services/
├── auth/            TypeScript, Fastify, Drizzle
├── billing/         Go 1.23, stdlib HTTP, pgx
├── api-gateway/     .NET 9, ASP.NET Core, Entity Framework
├── notifications/   Python 3.13, FastAPI, SQLAlchemy
└── frontend/        Next.js 15, TypeScript, Tailwind
```

When Claude is in `services/billing/`, it receives the Go-specific CLAUDE.md and Go-specific path-scoped rules. It has no reason to apply TypeScript idioms. When it moves to `services/auth/`, it gets the TypeScript context. The isolation is automatic once the configuration is set up.

**Cross-stack pitfall:** avoid starting Claude from the repository root when working on a single service. If you run `claude` from `/monorepo-root/`, Claude's CWD is the root, and it loads root context without any service-specific context until you navigate into a service directory. Always:

```bash
# Correct: start Claude from within the service
cd services/auth
claude

# Also correct: use the --cwd flag
claude --cwd services/billing

# Avoid: Claude starts with root context only
cd /monorepo-root
claude
```

### 4.3 Team Ownership via CLAUDE.md

Each service's CLAUDE.md is owned by the team that builds that service. This has important implications:

- Teams can update their service's conventions without going through a central review
- Conventions naturally stay current because the team that works in the service maintains the docs
- Code owners (via `CODEOWNERS`) can require their team's approval for changes to their service's CLAUDE.md

```
# CODEOWNERS
services/auth/CLAUDE.md         @acme/team-identity
services/billing/CLAUDE.md      @acme/team-payments
services/api-gateway/CLAUDE.md  @acme/team-platform
services/notifications/CLAUDE.md @acme/team-comms
services/frontend/CLAUDE.md     @acme/team-frontend
```

The root `CLAUDE.md` is owned by a central platform team or architecture guild and changes require broader approval.

### 4.4 Additive Concatenation in Practice

When Claude's CWD is `services/auth/src/repositories/`, the effective context it receives is:

```
[enterprise CLAUDE.md] +
[~/.claude/CLAUDE.md] +
[root CLAUDE.md] +
[services/auth/CLAUDE.md] +
[services/auth/src/CLAUDE.md]   ← only if it exists
[services/auth/src/repositories/CLAUDE.md]  ← only if it exists
```

Deeper files do not cancel or replace shallower files — they are appended. This means:

- Root conventions still apply in every service
- A service's CLAUDE.md can add to root conventions, but not cancel them
- If you want to truly override a root convention for a service, you must explicitly state it
  (e.g., "For this service, ignore the root convention about X. Instead, do Y.")

### 4.5 @import from Shared Library

For shared policy documents, use @import to avoid duplication:

```markdown
<!-- services/billing/CLAUDE.md -->
# Billing Service

## Compliance Requirements
@import ../../shared/docs/pci-dss-requirements.md
@import ../../shared/docs/security-policy.md

## Service Architecture
This service handles all payment processing...
```

The `shared/docs/` directory houses canonical policy documents maintained by the security team. All services that import these files automatically receive updates when the source files change.

---

## 5. MCP Server Architecture for Monorepos

### 5.1 MCP Configuration File Hierarchy

MCP servers are configured in `.mcp.json` files. In a monorepo, you have multiple layers where `.mcp.json` can live:

```
~/.claude/.mcp.json                  ← user-global (personal tools)
monorepo-root/.mcp.json              ← shared org tools (committed to git)
monorepo-root/.claude/.mcp.json      ← project-scoped (alternative location)
services/auth/.mcp.json              ← auth-service-specific tools
services/billing/.mcp.json          ← billing-service-specific tools
```

Claude loads MCP configurations based on CWD, using the nearest `.mcp.json` it finds walking up the directory tree. For per-user local overrides, use `.mcp.json.local` (which should be git-ignored).

### 5.2 Root .mcp.json — Shared Internal Tools

The root `.mcp.json` should contain tools useful for any developer across any service:

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    },
    "internal-docs": {
      "type": "http",
      "url": "https://docs.acme.internal/mcp/search",
      "headers": {
        "Authorization": "Bearer ${ACME_INTERNAL_TOKEN}"
      },
      "description": "Search Acme internal documentation, ADRs, and runbooks"
    },
    "issue-tracker": {
      "type": "stdio",
      "command": "node",
      "args": ["tools/mcp/jira-server.js"],
      "env": {
        "JIRA_BASE_URL": "${JIRA_BASE_URL}",
        "JIRA_TOKEN": "${JIRA_TOKEN}"
      },
      "description": "Create, read, and update Jira tickets"
    },
    "release-pipeline": {
      "type": "stdio",
      "command": "node",
      "args": ["tools/mcp/release-server.js"],
      "env": {
        "PIPELINE_TOKEN": "${PIPELINE_TOKEN}"
      },
      "description": "Query release pipeline status, trigger deployments"
    },
    "nx-graph": {
      "type": "stdio",
      "command": "node",
      "args": ["tools/mcp/nx-graph-server.js"],
      "description": "Query Nx dependency graph — find affected services, dependencies"
    }
  }
}
```

### 5.3 Service-Specific .mcp.json Files

Place service-specific tools in `.mcp.json` files within each service directory. These tools are only available when Claude's CWD is within that service.

```json
// services/auth/.mcp.json
{
  "mcpServers": {
    "auth-db-schema": {
      "type": "stdio",
      "command": "node",
      "args": ["../../tools/mcp/postgres-schema-server.js"],
      "env": {
        "DATABASE_URL": "${AUTH_DB_URL}",
        "SCHEMA": "auth"
      },
      "description": "Browse auth service PostgreSQL schema, run read-only queries"
    },
    "auth-redis-inspector": {
      "type": "stdio",
      "command": "node",
      "args": ["../../tools/mcp/redis-inspector.js"],
      "env": {
        "REDIS_URL": "${AUTH_REDIS_URL}"
      },
      "description": "Inspect auth service Redis keys and cache state"
    }
  }
}
```

```json
// services/billing/.mcp.json
{
  "mcpServers": {
    "billing-db-schema": {
      "type": "stdio",
      "command": "billing-schema-tool",
      "args": ["--readonly"],
      "env": {
        "DATABASE_URL": "${BILLING_DB_URL}",
        "SCHEMA": "billing"
      },
      "description": "Browse billing service PostgreSQL schema (billing + payments schemas)"
    },
    "stripe-sandbox": {
      "type": "http",
      "url": "https://api.stripe.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${STRIPE_TEST_KEY}"
      },
      "description": "Query Stripe test mode — customers, charges, subscriptions"
    }
  }
}
```

**Critical security note:** Never give a service's MCP database tool access to another service's schema. The `billing-db-schema` tool should only have access to billing-related schemas. Cross-schema access via MCP tools defeats the purpose of service isolation.

### 5.4 Local Dev-Only MCP Servers

For personal or machine-specific MCP servers (local database instances, personal Obsidian vault, development-only tools), use `.mcp.json.local` files. These should be in `.gitignore`.

```json
// ~/.claude/.mcp.json  (personal, not committed)
{
  "mcpServers": {
    "local-postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_URL": "postgresql://localhost:5432/acme_dev"
      }
    }
  }
}
```

Add to repo root `.gitignore`:

```
.mcp.json.local
services/**/.mcp.json.local
```

### 5.5 Example: Complete MCP Layering for 5-Service Monorepo

```
MCP Server Availability by CWD:

CWD: /monorepo-root/
  Loaded: github, internal-docs, issue-tracker, release-pipeline, nx-graph

CWD: /monorepo-root/services/auth/
  Loaded: github, internal-docs, issue-tracker, release-pipeline, nx-graph
          + auth-db-schema, auth-redis-inspector

CWD: /monorepo-root/services/billing/
  Loaded: github, internal-docs, issue-tracker, release-pipeline, nx-graph
          + billing-db-schema, stripe-sandbox

CWD: /monorepo-root/services/api-gateway/
  Loaded: github, internal-docs, issue-tracker, release-pipeline, nx-graph
          (no service-specific MCP for this service)
```

---

## 6. Parallel Development with Worktrees

### 6.1 The /branch Command

Claude Code's `/branch` command creates a Git worktree — a separate checkout of the repository linked to the same `.git` database. Each worktree can be on a different branch and supports an independent Claude Code session.

```
/branch feat/ACME-1234-add-mfa
```

This creates `../monorepo-root--feat-ACME-1234-add-mfa/` as a new worktree directory, checks out a new branch `feat/ACME-1234-add-mfa` in it, and opens a Claude Code session focused on that worktree.

```
Filesystem layout after /branch:

monorepo-root/                          ← main worktree, main branch
├── .git/                               ← shared git database
│   └── worktrees/
│       ├── feat-ACME-1234-add-mfa/
│       └── fix-ACME-1235-billing-bug/
├── services/
└── ...

monorepo-root--feat-ACME-1234-add-mfa/ ← worktree 1, feature branch
├── .git  (file, pointer to main .git)
├── services/
└── ...

monorepo-root--fix-ACME-1235-billing-bug/ ← worktree 2, fix branch
├── .git  (file, pointer to main .git)
├── services/
└── ...
```

### 6.2 Running Parallel Claude Sessions

Because each worktree is a separate filesystem directory, you can run independent Claude Code sessions simultaneously — one terminal per worktree:

```bash
# Terminal 1: working on auth service MFA feature
cd ~/code/monorepo-root--feat-ACME-1234-add-mfa/services/auth
claude

# Terminal 2: fixing a billing bug simultaneously
cd ~/code/monorepo-root--fix-ACME-1235-billing-bug/services/billing
claude

# Terminal 3: main worktree for reviewing other branches or running full builds
cd ~/code/monorepo-root
claude
```

Each session operates independently with its own conversation history, its own context window, and its own tool permissions. The sessions do not share memory or context.

### 6.3 Context Isolation Between Worktrees

Each Claude session loaded from a worktree loads its CLAUDE.md and rules from that worktree's filesystem. If you have made changes to CLAUDE.md in a feature branch, the session in that worktree uses the modified CLAUDE.md. The session in the main worktree continues using the original CLAUDE.md.

**MEMORY.md does not share across worktrees.** Auto-generated `MEMORY.md` files are stored relative to the worktree root, not the shared `.git/` directory. If Claude records something in MEMORY.md during a session in worktree 1, that information is not visible to a session in worktree 2.

For cross-worktree information sharing, use a filesystem mailbox pattern (see Section 7.3) or a shared file in the Git object database.

### 6.4 Multi-Service Parallel Development

A monorepo feature that touches 3 services benefits significantly from parallel worktrees:

```
Feature ACME-1234: Add Multi-Factor Authentication
Touches: services/auth/ (core logic), services/api-gateway/ (routing),
         services/frontend/ (UI)

Approach 1: Sequential (naive)
- Work on auth changes → commit
- Work on api-gateway changes → commit
- Work on frontend changes → commit
- Total time: 3 sessions, linear

Approach 2: Parallel worktrees
- Worktree 1: Claude works on auth/ MFA logic
- Worktree 2: Claude works on api-gateway/ MFA routing
- Worktree 3: You work on frontend/ MFA UI manually
- Total time: max(session1, session2) + manual work
- Claude sessions run simultaneously
```

Setup for parallel worktrees on a multi-service feature:

```bash
# From main worktree
git checkout -b feat/ACME-1234-add-mfa
git worktree add ../monorepo--mfa-auth feat/ACME-1234-add-mfa
git worktree add ../monorepo--mfa-gateway feat/ACME-1234-add-mfa

# Or via Claude's /branch command (creates and opens session)
# In Claude: /branch feat/ACME-1234-mfa-auth
# In new terminal: /branch feat/ACME-1234-mfa-gateway
```

**Note:** Multiple worktrees on the same branch is valid for read operations but will conflict on writes. Use separate branches per worktree, then merge them after work completes.

### 6.5 Merging Worktree Changes

After parallel work completes:

```bash
# Merge auth changes into main feature branch
git checkout feat/ACME-1234-add-mfa
git merge feat/ACME-1234-mfa-auth

# Merge gateway changes
git merge feat/ACME-1234-mfa-gateway

# Remove worktrees after merge
git worktree remove ../monorepo--mfa-auth
git worktree remove ../monorepo--mfa-gateway
```

### 6.6 When to Use Worktrees vs Sequential Development

**Use worktrees when:**
- Services have minimal code coupling (separate directories, separate packages)
- Changes to each service are independently deployable
- Development time per service is significant (> 30 minutes of Claude work)
- You can review and merge changes asynchronously

**Use sequential development when:**
- Services are tightly coupled (shared types that must stay in sync)
- One service's implementation depends on the other's API shape
- Changes are small (< 15 minutes of Claude work per service)
- You need to keep all changes in one commit or PR

---

## 7. Agent Teams for Cross-Service Work

> **Requires:** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (Research Preview, v2.1.32+)

### 7.1 Orchestrator Pattern

For complex features that span multiple services, an orchestrator Claude instance can spawn service-specialist agents that each operate in their service's subdirectory. The orchestrator coordinates, the specialists implement.

```
Orchestrator (repo root context)
├── Spawns Auth Agent    → operates in services/auth/
│   └── Loads services/auth/CLAUDE.md + auth path-scoped rules
├── Spawns API Agent     → operates in services/api-gateway/
│   └── Loads services/api-gateway/CLAUDE.md + gateway rules
└── Spawns Frontend Agent → operates in services/frontend/
    └── Loads services/frontend/CLAUDE.md + frontend rules
```

Each specialist agent has full access to its service's context without cross-contamination. The orchestrator synthesizes their output and manages dependencies between them.

### 7.2 Filesystem Mailbox for Cross-Agent Coordination

Agents communicate via a filesystem mailbox — a shared directory where agents write results, read status, and post contract proposals.

```
.agent-teams/
├── orchestrator/
│   ├── status.md           ← orchestrator's current plan and status
│   └── assignments.md      ← task assignments for each specialist
├── auth-agent/
│   ├── status.md           ← auth agent's current status
│   ├── api-contracts.md    ← API changes this agent is proposing
│   └── results.md          ← completed work summary
├── api-agent/
│   ├── status.md
│   ├── api-contracts.md
│   └── results.md
└── frontend-agent/
    ├── status.md
    ├── api-contracts.md
    └── results.md
```

Add `.agent-teams/` to `.gitignore` — these files are session-scoped coordination artifacts, not permanent project files.

### 7.3 Defining the Orchestrator and Specialist Agents

Create agent definition files at `.claude/agents/`:

```markdown
<!-- .claude/agents/monorepo-orchestrator.md -->
---
name: monorepo-orchestrator
description: Orchestrates cross-service feature development across the monorepo
model: claude-opus-4-5
tools: [Read, Write, Task, Bash]
---

You are an orchestrator for cross-service feature development in this monorepo.
Your role is to:
1. Decompose a cross-service feature into per-service work packages
2. Spawn specialist agents for each affected service
3. Monitor their progress via the filesystem mailbox at .agent-teams/
4. Resolve API contract conflicts between services
5. Produce a consolidated implementation report

Before spawning any specialist, write your plan to .agent-teams/orchestrator/status.md.
After all specialists complete, write a summary to .agent-teams/orchestrator/results.md.

Spawn specialists with their CWD set to their service directory so they load the correct
CLAUDE.md and path-scoped rules for their service.
```

```markdown
<!-- .claude/agents/auth-specialist.md -->
---
name: auth-specialist
description: Auth service specialist — TypeScript/Fastify/Drizzle
model: claude-sonnet-4-5
tools: [Read, Write, Edit, Bash, TodoWrite]
cwd: services/auth
---

You are a specialist agent for the auth service.
You have deep expertise in TypeScript, Fastify 5, and Drizzle ORM.

Before starting work, read your assignment from .agent-teams/orchestrator/assignments.md.
Write your status to .agent-teams/auth-agent/status.md as you work.
When you propose API contract changes, write them to .agent-teams/auth-agent/api-contracts.md.
When complete, write a summary of all changes to .agent-teams/auth-agent/results.md.

Always follow the conventions in services/auth/CLAUDE.md.
```

### 7.4 API Contract Negotiation

When a feature requires changing an API that other services consume, agents use the mailbox to negotiate contracts before either service commits to an implementation:

```markdown
<!-- .agent-teams/auth-agent/api-contracts.md -->
# Auth Service — Proposed API Contract Changes

## New Endpoint: POST /v2/auth/mfa/verify

### Request
```json
{
  "session_id": "string (UUID)",
  "mfa_code": "string (6 digits)",
  "device_fingerprint": "string (optional)"
}
```

### Response 200
```json
{
  "access_token": "string (JWT)",
  "refresh_token": "string (opaque)",
  "expires_in": 900
}
```

### Response 422
```json
{
  "error": "invalid_mfa_code",
  "attempts_remaining": 2
}
```

## Breaking Changes
None. New endpoint only.

## Required from API Gateway
API gateway must add route: POST /auth/v2/mfa/verify → auth service :3001
```

The orchestrator reads both agents' contract proposals, identifies conflicts, and instructs agents to resolve them before proceeding with implementation.

### 7.5 Example: MFA Feature Across Auth, API Gateway, and Frontend

```bash
# Launch orchestrator session
claude --agent monorepo-orchestrator

# Prompt the orchestrator:
# "Implement multi-factor authentication (TOTP-based) as described in ACME-1234.
# This touches the auth service (core logic), api-gateway (routing), and frontend
# (UI for MFA enrollment and verification). Coordinate the three services in parallel
# and produce a single implementation that passes all existing tests."
```

The orchestrator will:

1. Read `ACME-1234` from the issue tracker (via MCP)
2. Write its decomposition plan to `.agent-teams/orchestrator/status.md`
3. Spawn `auth-specialist` with the auth-specific work package
4. Spawn `api-specialist` with the gateway-specific work package
5. Spawn `frontend-specialist` with the UI-specific work package
6. Monitor mailboxes for progress and contract proposals
7. Detect and resolve the contract conflict (auth agent proposes `/v2/auth/mfa/verify`, gateway agent has been routing to `/v1/auth/mfa/verify`)
8. Instruct auth agent to add a `/v1/` alias for backward compatibility
9. Collect all results and post a summary PR comment

---

## 8. CI/CD Matrix Builds

### 8.1 Service Change Detection

The most expensive mistake in monorepo CI is running full analysis on every service whenever any file changes. Use `git diff` to detect which services changed and only run analysis on those.

```bash
# Detect changed services since base branch
CHANGED_SERVICES=$(git diff --name-only origin/main...HEAD \
  | grep '^services/' \
  | cut -d/ -f2 \
  | sort -u)

echo "Changed services: $CHANGED_SERVICES"
```

### 8.2 GitHub Actions Matrix Strategy

Use a matrix strategy to run per-service Claude Code analysis in parallel:

```yaml
# .github/workflows/claude-code-review.yml
name: Claude Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      services: ${{ steps.detect.outputs.services }}
      has-shared: ${{ steps.detect.outputs.has-shared }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect changed services
        id: detect
        run: |
          # Find services with changed files
          CHANGED=$(git diff --name-only origin/${{ github.base_ref }}...HEAD \
            | grep '^services/' \
            | cut -d/ -f2 \
            | sort -u \
            | jq -R -s -c 'split("\n") | map(select(length > 0))')

          SHARED=$(git diff --name-only origin/${{ github.base_ref }}...HEAD \
            | grep -q '^packages/' && echo "true" || echo "false")

          echo "services=$CHANGED" >> $GITHUB_OUTPUT
          echo "has-shared=$SHARED" >> $GITHUB_OUTPUT
          echo "Changed services: $CHANGED"
          echo "Shared packages changed: $SHARED"

  review-services:
    needs: detect-changes
    if: needs.detect-changes.outputs.services != '[]'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: ${{ fromJson(needs.detect-changes.outputs.services) }}
      max-parallel: 4
      fail-fast: false
    steps:
      - uses: actions/checkout@v4

      - name: Claude Code review — ${{ matrix.service }}
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          working_directory: services/${{ matrix.service }}
          prompt: |
            Review the changes to the ${{ matrix.service }} service in this PR.
            Focus on:
            1. Correctness and logic errors
            2. Security vulnerabilities
            3. Adherence to this service's conventions (see CLAUDE.md)
            4. Test coverage for new code
            5. Any breaking changes to APIs consumed by other services

            PR diff: $(git diff origin/${{ github.base_ref }}...HEAD -- services/${{ matrix.service }}/)

            Post a structured review comment to the PR.
          permission_mode: acceptEdits
          max_turns: 20
          max_budget_usd: "3.00"
          direct_prompt: true

  review-shared-packages:
    needs: detect-changes
    if: needs.detect-changes.outputs.has-shared == 'true'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Claude Code review — shared packages
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          working_directory: packages
          prompt: |
            Review the changes to shared packages in this PR.
            These packages are consumed by all services. Pay special attention to:
            1. Breaking changes to exported APIs
            2. Version bump strategy (patch vs minor vs major)
            3. Backward compatibility
            4. Test coverage

            Post a review identifying any services that will need updates due to
            breaking changes in the shared packages.
          permission_mode: acceptEdits
          max_turns: 15
          max_budget_usd: "2.00"
          direct_prompt: true

  cross-service-impact:
    needs: [detect-changes, review-services]
    if: |
      needs.detect-changes.outputs.has-shared == 'true' ||
      contains(fromJson(needs.detect-changes.outputs.services), 'auth') ||
      contains(fromJson(needs.detect-changes.outputs.services), 'api-gateway')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Cross-service impact analysis
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          prompt: |
            Analyse the cross-service impact of this PR.
            Changed services: ${{ needs.detect-changes.outputs.services }}
            Shared packages changed: ${{ needs.detect-changes.outputs.has-shared }}

            Identify:
            1. API contracts that may have changed
            2. Services that consume those APIs and may need updates
            3. Database schema changes and their migration strategy
            4. Required deployment order (e.g., auth must deploy before api-gateway)

            Post a cross-service impact summary as a PR comment.
          permission_mode: acceptEdits
          max_turns: 25
          max_budget_usd: "4.00"
          direct_prompt: true
```

### 8.3 Per-Service Security Scans

Run security analysis only on services with changed files, using a dedicated security-focused prompt:

```yaml
  security-scan:
    needs: detect-changes
    if: needs.detect-changes.outputs.services != '[]'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        service: ${{ fromJson(needs.detect-changes.outputs.services) }}
      max-parallel: 4
    steps:
      - uses: actions/checkout@v4

      - name: Security scan — ${{ matrix.service }}
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          working_directory: services/${{ matrix.service }}
          prompt: |
            Perform a security-focused review of the changes to the
            ${{ matrix.service }} service in this PR. Check for:
            - Injection vulnerabilities (SQL, command, path traversal)
            - Authentication/authorization bypasses
            - Insecure deserialization
            - Hardcoded secrets or credentials
            - Dependency vulnerabilities in newly added packages
            - Insecure cryptographic patterns
            - Input validation gaps

            If you find any HIGH or CRITICAL severity issues, include
            "[SECURITY-BLOCK]" in your comment to trigger mandatory human review.
          permission_mode: acceptEdits
          max_turns: 15
          max_budget_usd: "2.50"
          direct_prompt: true
```

### 8.4 Cost Optimization Strategies

| Strategy | Implementation | Savings |
|----------|---------------|---------|
| Change detection | Only run on changed services | 60–80% on typical PRs |
| `max_budget_usd` per job | Hard cap per service analysis | Prevents runaway costs |
| `max-parallel: 4` | Limit concurrent API calls | Avoids rate-limit bursts |
| `--effort low` for routine PRs | Smaller changes need less analysis | 30–40% on small PRs |
| Cache CLAUDE.md context | Not currently supported natively, planned | Future optimization |
| `--bare` flag | Faster startup for CI jobs | 14% per job |

---

## 9. Context Management in Large Monorepos

### 9.1 Preventing Context Flooding

In a large monorepo with 20+ services, a naive `Glob("**/*.ts")` from the repo root would return thousands of files. Context flooding symptoms:

- Slow responses (Claude processing huge context windows)
- Confused service conventions (auth patterns appearing in billing responses)
- High token costs per turn
- Context compaction triggered prematurely

Prevention strategies:

**Strategy 1: Start Claude in the service directory, not the repo root.**

```bash
cd services/auth
claude  # loads auth CLAUDE.md, auth rules, auth MCP servers only
```

**Strategy 2: Use service-scoped Glob patterns in rules and settings.**

```markdown
<!-- .claude/rules/auth-service.md -->
---
description: Auth service context
paths: ["services/auth/**"]
---

When working in the auth service, use Glob patterns scoped to this service:
- `services/auth/src/**/*.ts` — not `**/*.ts`
- `services/auth/tests/**` — not `**/tests/**`
```

**Strategy 3: Add a .claudeignore file to exclude generated and build artifacts.**

```
# monorepo-root/.claudeignore
**/node_modules/**
**/dist/**
**/build/**
**/.next/**
**/coverage/**
**/.nyc_output/**
**/target/**              # Rust/Go build output
**/*.pb.go                # Generated protobuf Go files
**/*.pb.ts                # Generated protobuf TypeScript files
**/generated/**           # Generated code directories
**/__generated__/**       # GraphQL generated types
**/migrations/            # Database migrations (large historical files)
**/*.snap                 # Test snapshots
infra/.terraform/**       # Terraform provider cache
```

**Strategy 4: Use `claudeMdExcludes` in `.claude/settings.json` to suppress irrelevant CLAUDE.md files.**

```json
// services/billing/.claude/settings.json
{
  "claudeMdExcludes": [
    "~/.claude/CLAUDE.md"
  ]
}
```

This is useful when a user's global `~/.claude/CLAUDE.md` contains personal preferences that conflict with or are irrelevant to the billing service.

### 9.2 MEMORY.md for Cross-Session Monorepo State

Auto-Memory (`MEMORY.md`) is Claude Code's mechanism for persisting information across sessions. In a monorepo, use MEMORY.md to track:

- Which services you recently worked in and what you changed
- Outstanding API contract changes that need coordination
- Known technical debt items by service
- Planned but not yet implemented changes

```markdown
<!-- MEMORY.md — auto-maintained by Claude Code -->
# Monorepo Working Memory

## Recent Cross-Service Work
- ACME-1234 MFA implementation: auth service complete (PR #456), 
  api-gateway changes in progress, frontend not started (2026-05-28)

## Open API Contract Changes
- auth service adding /v2/auth/mfa/* endpoints in PR #456
  → api-gateway needs to add routes (blocking frontend work)
  → api-gateway owner: @team-platform

## Known Issues
- services/billing: currency rounding bug in multi-currency checkout
  (tracked: ACME-1301, not yet assigned)
- services/notifications: email templates outdated for new design system

## Service Status
- services/auth: actively changing (ACME-1234)
- services/billing: stable
- services/api-gateway: awaiting auth PR merge before updating
```

Claude Code maintains and updates MEMORY.md automatically. You can prompt it to add entries:

```
> Add to MEMORY.md: the api-gateway service now requires AUTH_SERVICE_URL env var
  in all environments, added in PR #459
```

### 9.3 Compaction Behavior in Monorepos

When `/compact` is triggered (manually or by approaching context limits), Claude summarizes the conversation history into a compact summary. In monorepos:

**What survives compaction:**
- All CLAUDE.md files (reloaded fresh from disk)
- All path-scoped rules (reloaded as relevant)
- MEMORY.md (reloaded from disk)
- Current tool state (files open, recent edits)

**What does not survive compaction:**
- Detailed context about files Claude read but did not edit
- Intermediate reasoning steps
- Earlier conversation context about architecture decisions
- Cross-service discussions from earlier in the session

**Monorepo compaction strategy:** Before long cross-service sessions, write key architectural decisions and context to MEMORY.md explicitly. This ensures the information survives compaction:

```
> Add to MEMORY.md: the MFA implementation requires that auth service completes
  the JWT format change (adding mfa_level claim) before api-gateway can update
  its middleware. Do not allow Claude to implement api-gateway changes before
  auth PR #456 is merged.
```

---

## 10. Shared Plugin Libraries

### 10.1 Plugin Pattern for Monorepo-Wide Conventions

A shared plugin packages org-wide Claude Code extensions — commands, skills, hooks, MCP servers — into a single installable unit. Every developer in the monorepo installs the same plugin and gets consistent tooling.

```
@acme/claude-code-plugin/
├── plugin.json
├── commands/
│   ├── create-service.md         # /acme:create-service — scaffold new service
│   ├── run-migrations.md         # /acme:run-migrations
│   ├── deploy-service.md         # /acme:deploy-service
│   └── cross-service-impact.md  # /acme:cross-service-impact
├── agents/
│   ├── monorepo-orchestrator.md
│   └── service-reviewer.md
├── skills/
│   ├── conventional-commits/
│   │   └── SKILL.md             # auto-invoked for commit messages
│   └── service-scaffolding/
│       └── SKILL.md             # auto-invoked when creating new files
├── hooks/
│   └── settings.json            # hook configurations
├── mcp-servers/
│   └── internal-tools-server/   # bundled MCP server
└── bin/
    └── check-service-deps.sh    # available to Bash tool
```

```json
// @acme/claude-code-plugin/plugin.json
{
  "name": "acme",
  "version": "2.4.1",
  "description": "Acme Corp monorepo Claude Code conventions and tools",
  "minClaudeCodeVersion": "2.1.0",
  "components": {
    "commands": "commands/",
    "agents": "agents/",
    "skills": "skills/",
    "hooks": "hooks/settings.json",
    "mcpServers": {
      "acme-internal": {
        "command": "node",
        "args": ["mcp-servers/internal-tools-server/index.js"]
      }
    },
    "bin": "bin/"
  }
}
```

### 10.2 Installation and Distribution

```bash
# Install shared plugin project-wide (committed to .claude/plugins/)
claude plugin install @acme/claude-code-plugin

# Install from private registry
claude plugin install @acme/claude-code-plugin \
  --registry https://npm.acme.internal

# Install from git (for development / unreleased versions)
claude plugin install github:acme-corp/claude-code-plugin

# Install specific version (tag-based)
claude plugin install @acme/claude-code-plugin@2.4.0

# Verify plugin is active
claude plugin list
```

Commit the plugin installation to the repository so all team members get the same plugin automatically:

```json
// .claude/settings.json
{
  "plugins": {
    "@acme/claude-code-plugin": "2.4.1"
  }
}
```

When a developer clones the repo and runs `claude`, Claude Code reads `.claude/settings.json` and prompts to install declared plugins.

### 10.3 Version Management

```
Versioning strategy:

PATCH (2.4.x): Bug fixes, clarification improvements to existing commands/skills
MINOR (2.x.0): New commands, skills, or MCP tools added (backward compatible)
MAJOR (x.0.0): Breaking changes — removed commands, changed command signatures,
               incompatible hook configurations

Release process:
1. Change in plugin repo (github.com/acme-corp/claude-code-plugin)
2. Merge to main, create tag v2.4.1
3. `npm publish --access restricted` to private registry
4. Open PR in monorepo updating version in .claude/settings.json
5. Monorepo PR triggers migration notes check (via Claude Code CI job)
```

### 10.4 Per-Team Plugin Overrides

Teams may need to extend (not replace) the shared plugin with team-specific commands. Use a team plugin that extends the shared one:

```json
// @acme-identity/claude-code-plugin/plugin.json
{
  "name": "acme-identity",
  "version": "1.2.0",
  "description": "Identity team extension of shared Acme plugin",
  "extends": "@acme/claude-code-plugin",
  "components": {
    "commands": "commands/",
    "skills": "skills/"
  }
}
```

Commands and skills in the extending plugin are namespaced under `acme-identity:`. They do not override the shared plugin's components — they add to them. If a genuine override is needed, the team plugin can include a command with the same action path; the more-specific plugin wins.

---

## 11. Common Monorepo Patterns

### 11.1 Build System Integration

**Nx**

```markdown
<!-- Include in root CLAUDE.md -->
## Build System: Nx 19

nx build <project>              # Build a project and its dependencies
nx test <project>               # Run tests for a project
nx lint <project>               # Lint a project
nx affected --target=build      # Build only what changed vs main
nx affected --target=test       # Test only affected projects
nx graph                        # Open dependency graph in browser
nx show project <name>          # Show project details, dependencies, targets
nx run-many --target=test --all # Run tests for all projects
```

**Turborepo**

```markdown
## Build System: Turborepo

turbo build                     # Build all packages (cached)
turbo test                      # Test all packages (cached)
turbo build --filter=auth       # Build auth and its dependencies
turbo test --filter=...auth     # Test everything that depends on auth
turbo run build --affected      # Build only changed packages
```

**Rush**

```markdown
## Build System: Rush

rush build                      # Incremental build
rush rebuild                    # Full rebuild
rush test                       # Run tests
rush change                     # Document changes for changelog
rush publish                    # Publish changed packages
rushx test                      # Run a project-local script
```

### 11.2 Workspace Package Resolution

For pnpm/yarn workspaces, instruct Claude about the workspace resolution model:

```markdown
<!-- packages/shared-types/CLAUDE.md -->
# Shared Types Package

This package is consumed by all services via pnpm workspace protocol.
Consumers reference it as: `"@acme/shared-types": "workspace:*"`

## Versioning Policy
This package does NOT publish to npm. It is consumed only within this monorepo.
Version bumps are for internal changelog/audit purposes only.

## Breaking Changes Policy
Breaking changes to exported types require:
1. A migration period of 2 weeks with the old type deprecated (`@deprecated` JSDoc)
2. Updated type definitions with the new shape
3. A PR that updates all consumers simultaneously
Do NOT make breaking changes without updating all consumers in the same PR.
```

### 11.3 Proto/gRPC Service Definitions

Generated protobuf code should be excluded from Claude's context — it is large, auto-generated, and following conventions in generated code leads Claude astray.

```
# .claudeignore
**/*.pb.go
**/*.pb.ts
**/*_pb.js
**/*_pb.d.ts
**/generated/
**/gen/
proto/vendor/         # vendored proto dependencies
```

Include the `.proto` source files but not the generated output:

```markdown
<!-- services/billing/CLAUDE.md -->
## gRPC / Protobuf

Service definitions live in `proto/billing/v1/billing.proto`.
Generated Go code is in `internal/gen/` — do NOT edit generated files.

To regenerate after proto changes:
```bash
buf generate
```

When implementing a new RPC method:
1. Add the method to `proto/billing/v1/billing.proto`
2. Run `buf generate` to regenerate client/server stubs
3. Implement the server method in `internal/service/billing.go`
4. Add integration tests in `tests/grpc/`
```

### 11.4 Database Migrations Across Services

Each service owns its own database schema and migration history. Never let migrations from one service appear in another service's migration directory.

```
services/
├── auth/
│   └── db/migrations/
│       ├── 0001_initial.sql
│       ├── 0002_add_mfa_table.sql
│       └── 0003_add_refresh_tokens.sql
├── billing/
│   └── db/migrations/
│       ├── 0001_initial.sql
│       └── 0002_add_currency_column.sql
```

The `db-migrations.md` path-scoped rule (from Section 3.6) fires when Claude is in any `**/db/migrations/**` directory and enforces migration conventions:

```markdown
<!-- .claude/rules/db-migrations.md -->
---
description: Database migration conventions
paths: ["**/db/migrations/**"]
---

# Database Migration Conventions

Never modify an existing migration file after it has been applied to any environment.
Always create a new migration file for schema changes.

Migration filename format: `<sequence>_<descriptive_name>.sql`
- Sequence: zero-padded 4-digit number (`0042_`)
- Name: snake_case, descriptive of the change

Each migration must be:
- Idempotent where possible (use `IF NOT EXISTS`, `IF EXISTS`)
- Reversible (document the rollback SQL in a comment at the top)
- Tested in isolation before merging

Cross-service joins are not allowed. If you need data from another service's tables,
use the service's API, not a database join.
```

### 11.5 Shared Library Changes — Impact Analysis

When a shared package changes, use Agent Teams or a targeted CI job to identify all consumers that need updating:

```bash
# CI job: run after shared package changes are detected
claude --print \
  --permission-mode bypassPermissions \
  --max-turns 20 \
  "Analyse the changes to packages/$CHANGED_PACKAGE/ in this PR.
   Identify all services that import this package (search for
   @acme/$CHANGED_PACKAGE in package.json files and TypeScript imports).
   For each consuming service, assess whether the changes are breaking
   and what updates are required. Output a structured impact report." \
  --output-format json
```

---

## 12. Anti-Patterns to Avoid

### 12.1 All Service Docs in Root CLAUDE.md

**Problem:** A root `CLAUDE.md` that documents every service's conventions, technology stack, and commands. This file grows to 500–2,000 lines, consumes 4,000–16,000 tokens per session, and confuses Claude with contradictory conventions from different services.

**Symptom:** Claude applies Go error handling patterns in a TypeScript service. Claude suggests `pnpm test` when the service uses `go test`.

**Fix:** Move service-specific content to `services/<name>/CLAUDE.md`. Keep root CLAUDE.md under 100 lines. Use path-scoped rules for per-service conventions.

### 12.2 Running Claude from Repo Root for Service-Specific Work

**Problem:** Always `cd /monorepo-root && claude` regardless of which service you are working on. Claude's CWD is the root, so it loads root CLAUDE.md (not service-specific), no service path-scoped rules fire, and MCP servers configured at the service level are not loaded.

**Symptom:** "Claude doesn't know the test commands for my service." "Claude keeps suggesting root-level commands instead of service-level ones."

**Fix:** `cd services/<name> && claude`. Or use `claude --cwd services/<name>`. The service CLAUDE.md loads automatically.

### 12.3 No Path-Scoped Rules

**Problem:** All rules in `.claude/rules/` have no `paths:` frontmatter. Every rule loads for every session. A 10-service monorepo with 5 rules per service means 50 rules loading for every session, regardless of which service Claude is working in.

**Symptom:** High token costs per session. Claude confuses conventions between services. Auth-specific error handling rules appear in billing service suggestions.

**Fix:** Add `paths:` frontmatter to all service-specific rules. Only global rules (security policy, commit conventions) should have no `paths:` filter.

### 12.4 Shared MCP Database Tools Without Service-Scoped Access

**Problem:** A root `.mcp.json` exposes a database MCP tool connected to `postgres://prod-db:5432` with access to all schemas. Any Claude session has full read (or write) access to all services' production databases.

**Risk:** Claude performing a task in `services/auth/` reads or modifies data in `services/billing/`'s schema. Production data from one service leaks into context for another service's session.

**Fix:** Place database MCP tools in service-level `.mcp.json` files with credentials scoped to that service's schema only. The billing database tool should only have access to the `billing` schema with read-only credentials.

### 12.5 Large Generated Files Without .claudeignore

**Problem:** No `.claudeignore` file. Claude reads protobuf-generated code, ORM-generated migration files, GraphQL-generated type files, and `node_modules/` when scanning the codebase. These add thousands of tokens of noise and often contain patterns Claude should not imitate.

**Symptom:** Claude suggests writing code in the style of generated files. Claude imports from generated type paths that break when regenerated. Context windows fill prematurely.

**Fix:** Maintain a comprehensive `.claudeignore` file (see Section 9.1). Run `claude --print "What files are you loading?" --output-format json` periodically to audit what Claude sees.

### 12.6 One MEMORY.md Serving the Entire Monorepo

**Problem:** A single MEMORY.md at the repo root accumulates state for all services — growing to hundreds of lines, mixing service-specific context that is irrelevant to the current service's session.

**Fix:** Use the 200-line / 25KB limit as a hard ceiling. Periodically prune MEMORY.md. Consider service-level MEMORY.md files for services that have heavy, ongoing active work (Claude will automatically use the MEMORY.md nearest to its CWD).

---

## 13. Example: Complete 5-Service Monorepo Configuration

### 13.1 Directory Structure

```
acme-monorepo/
├── .claude/
│   ├── agents/
│   │   ├── monorepo-orchestrator.md
│   │   ├── auth-specialist.md
│   │   ├── billing-specialist.md
│   │   ├── api-gateway-specialist.md
│   │   ├── notifications-specialist.md
│   │   └── frontend-specialist.md
│   ├── commands/
│   │   ├── create-service.md
│   │   └── nx-affected.md
│   ├── rules/
│   │   ├── 00-security-policy.md
│   │   ├── 01-commit-conventions.md
│   │   ├── services-auth.md
│   │   ├── services-billing.md
│   │   ├── services-api-gateway.md
│   │   ├── services-notifications.md
│   │   ├── services-frontend.md
│   │   ├── packages-shared.md
│   │   ├── infra-terraform.md
│   │   └── db-migrations.md
│   └── settings.json
├── .github/
│   └── workflows/
│       ├── claude-code-review.yml
│       ├── claude-security-scan.yml
│       └── jekyll-gh-pages.yml
├── .mcp.json                    ← shared org tools
├── .claudeignore                ← generated file exclusions
├── CLAUDE.md                    ← root, < 100 lines
├── CODEOWNERS
├── nx.json
├── package.json                 ← pnpm workspace root
├── pnpm-workspace.yaml
│
├── packages/
│   ├── shared-types/            ← @acme/shared-types
│   ├── shared-errors/           ← @acme/shared-errors
│   └── shared-testing/          ← @acme/shared-testing
│
├── services/
│   ├── auth/
│   │   ├── .mcp.json           ← auth-specific MCP (db, redis)
│   │   ├── CLAUDE.md           ← auth service context
│   │   ├── package.json
│   │   ├── src/
│   │   └── db/migrations/
│   ├── billing/
│   │   ├── .mcp.json           ← billing-specific MCP (db, stripe)
│   │   ├── CLAUDE.md           ← billing service context
│   │   └── ...
│   ├── api-gateway/
│   │   ├── CLAUDE.md           ← api-gateway context
│   │   └── ...
│   ├── notifications/
│   │   ├── CLAUDE.md           ← notifications context
│   │   └── ...
│   └── frontend/
│       ├── CLAUDE.md           ← frontend context
│       └── ...
│
├── infra/
│   ├── terraform/
│   └── helm/
│
├── shared/
│   └── docs/
│       ├── security-policy.md  ← @imported by service CLAUDE.md files
│       ├── pci-requirements.md
│       └── accessibility.md
│
└── tools/
    └── mcp/
        ├── jira-server.js
        ├── release-server.js
        └── nx-graph-server.js
```

### 13.2 Complete Root CLAUDE.md

```markdown
# Acme Corp Monorepo

## Repository Layout
- `services/`       — Microservices: auth, billing, api-gateway, notifications, frontend
- `packages/`       — Shared libraries: shared-types, shared-errors, shared-testing
- `infra/`          — Terraform (AWS), Helm charts (EKS)
- `shared/docs/`    — Shared policy documents (@imported by service CLAUDE.md files)
- `tools/`          — Internal dev tooling and MCP server implementations

**Always start Claude from within the service directory you are working on.**
Service-specific context, rules, and MCP tools only load when CWD is inside the service.

## Build System: Nx 19
```bash
nx build <service>              # Build service and dependencies
nx test <service>               # Test service
nx lint <service>               # Lint service
nx affected --target=build      # Build only services changed vs main
nx affected --target=test       # Test only affected services
nx graph                        # Open dependency graph in browser
```

## Global Git Conventions
- Branch: `<type>/<TICKET>-<slug>` — e.g., `feat/ACME-1234-add-mfa`
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`)
- PRs: require passing CI + 1 approval from service CODEOWNERS
- Do not commit directly to `main` or `dev`
- PR size: < 400 lines changed preferred; > 800 lines requires architecture review

## Cross-Service API Changes
Any change to a service's external API (REST, gRPC, events) must:
1. Be documented in the PR description
2. Maintain backward compatibility for 2 sprint cycles
3. Include a `BREAKING CHANGE:` footer in the commit message if breaking

## Global Security Policy
@import shared/docs/security-policy.md

## Service Documentation
Each service has a CLAUDE.md at `services/<name>/CLAUDE.md`.
Do not ask Claude about a service's conventions from the repo root — navigate into
the service directory so the correct CLAUDE.md and rules load.
```

### 13.3 Complete Service CLAUDE.md (Auth Service)

```markdown
# Auth Service

Handles authentication and authorization for the Acme platform. Issues JWTs,
manages OAuth2 (Google, GitHub, SAML), and enforces RBAC policies. This service
is the identity source of truth — all other services validate tokens against the
JWKS endpoint at `/v1/auth/.well-known/jwks.json`.

Do NOT store or process payment data, billing information, or product catalog data
in this service. Auth is solely responsible for identity.

## Stack
- **Language**: TypeScript 5.4, Node.js 22 LTS
- **Framework**: Fastify 5.x with `@fastify/jwt`, `@fastify/redis`
- **ORM**: Drizzle ORM 0.32 → PostgreSQL 16
- **Cache**: Redis 7 via ioredis 5.x
- **Test runner**: Vitest 2.x
- **Linter**: Biome 1.8 (replaces ESLint + Prettier)

## Running Locally
```bash
cp .env.example .env.local
# Required: DATABASE_URL, REDIS_URL, JWT_SECRET, GOOGLE_CLIENT_ID/SECRET
pnpm install
pnpm dev               # starts on :3001, hot reload via tsx watch
```

## Test Commands
```bash
pnpm test              # all tests (unit + integration)
pnpm test:unit         # unit only, no external dependencies
pnpm test:integration  # requires: docker compose up -d db redis
pnpm test:watch        # watch mode for TDD
pnpm test:coverage     # generate coverage report → coverage/
```

## Architecture
- **Entry**: `src/server.ts` → Fastify instance setup
- **Routes**: `src/routes/` → thin handlers, delegate to services
- **Services**: `src/services/` → business logic, injected dependencies
- **Repositories**: `src/repositories/` → all DB access via Drizzle
- **Errors**: always use `AuthError` class from `src/errors/auth-error.ts`

## Critical Conventions
- All DB access through `src/repositories/`. No raw SQL in routes/services.
- JWT payload: only `sub` (userId), `iat`, `exp`, `jti`, `mfa_level`.
  Never embed PII, roles, or permissions in the JWT. Fetch from DB.
- Passwords: use `argon2id` preset from `src/crypto/`. Never bcrypt.
- Token TTLs: access=15min, refresh=7days. Not configurable at runtime.
- All new routes need rate limiting via `@fastify/rate-limit`.
- Migrations: `db/migrations/`. Never modify an applied migration.

## Compliance
@import ../../shared/docs/security-policy.md

## Ownership
- Team: Platform Identity  |  Slack: `#team-identity`  |  PagerDuty: `identity-oncall`
- CODEOWNERS: `@acme/team-identity`
```

### 13.4 Complete .claude/rules/ Structure

```markdown
<!-- .claude/rules/00-security-policy.md -->
---
description: Org-wide security policy — fires for all files
---

# Security Policy

Never hardcode secrets, tokens, or credentials in source code or config files.
Reference secrets via environment variables or AWS Secrets Manager paths.

New npm/pip/go dependencies must be in the approved dependency registry.
File a security review ticket before adding unapproved dependencies.

PII (names, emails, phone numbers) may only live in services/auth/ and services/users/.
Payment data only in services/billing/.
Never log PII or payment data.
```

```markdown
<!-- .claude/rules/services-auth.md -->
---
description: Auth service TypeScript/Fastify conventions
paths:
  - "services/auth/**"
---

# Auth Service Conventions

Use Fastify types: `FastifyRequest<{Body: T}>`, `FastifyReply`.
Always define Zod schemas for request/response validation in `src/schemas/`.
Use `reply.code(n).send(body)` — never `return body` from route handlers.

Error codes: use `AuthError` with these codes:
- `invalid_credentials` (401)
- `token_expired` (401)
- `insufficient_permissions` (403)
- `mfa_required` (403)
- `rate_limited` (429)

Drizzle queries: use prepared statements for frequently called queries.
All queries in `src/repositories/` — never inline SQL elsewhere.
```

```markdown
<!-- .claude/rules/services-billing.md -->
---
description: Billing service Go conventions
paths:
  - "services/billing/**"
---

# Billing Service Go Conventions

Go 1.23, stdlib HTTP only. Do not use Gin, Echo, Fiber, or Chi.

Error wrapping: `fmt.Errorf("billing.methodName: %w", err)`.
Never swallow errors — always wrap and return up the call stack.
Log at the boundary (HTTP handler), not in business logic.

Currency: always use `int64` cents/minor units. Never `float64` for money.
The `money.Amount` type from `internal/money` handles all arithmetic.
Never do money arithmetic outside this package.

Database: pgx/v5. All queries in `internal/store/`. No ORM.
```

### 13.5 Complete Root .mcp.json

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${GITHUB_TOKEN}"
      }
    },
    "internal-docs": {
      "type": "http",
      "url": "https://docs.acme.internal/mcp/v1/search",
      "headers": {
        "Authorization": "Bearer ${ACME_INTERNAL_TOKEN}",
        "X-Org": "acme"
      }
    },
    "jira": {
      "type": "stdio",
      "command": "node",
      "args": ["tools/mcp/jira-server.js"],
      "env": {
        "JIRA_BASE_URL": "${JIRA_BASE_URL}",
        "JIRA_TOKEN": "${JIRA_TOKEN}"
      }
    },
    "release-pipeline": {
      "type": "stdio",
      "command": "node",
      "args": ["tools/mcp/release-server.js"],
      "env": {
        "PIPELINE_BASE_URL": "${PIPELINE_BASE_URL}",
        "PIPELINE_TOKEN": "${PIPELINE_TOKEN}"
      }
    },
    "nx-graph": {
      "type": "stdio",
      "command": "node",
      "args": ["tools/mcp/nx-graph-server.js"]
    }
  }
}
```

### 13.6 Complete GitHub Actions Workflow

```yaml
# .github/workflows/claude-code-review.yml
name: Claude Code — Monorepo Review

on:
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:
    inputs:
      services:
        description: 'Comma-separated list of services to review (or "all")'
        required: false
        default: ''

jobs:
  # ─── Step 1: Detect what changed ──────────────────────────────────────
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      services-matrix: ${{ steps.detect.outputs.services-matrix }}
      services-list: ${{ steps.detect.outputs.services-list }}
      shared-changed: ${{ steps.detect.outputs.shared-changed }}
      infra-changed: ${{ steps.detect.outputs.infra-changed }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect changes
        id: detect
        run: |
          BASE="${{ github.base_ref || 'main' }}"

          if [[ "${{ github.event.inputs.services }}" == "all" ]]; then
            SERVICES=$(ls services/ | jq -R -s -c 'split("\n") | map(select(length > 0))')
          elif [[ -n "${{ github.event.inputs.services }}" ]]; then
            SERVICES=$(echo "${{ github.event.inputs.services }}" \
              | tr ',' '\n' \
              | jq -R -s -c 'split("\n") | map(select(length > 0))')
          else
            SERVICES=$(git diff --name-only origin/$BASE...HEAD \
              | grep '^services/' \
              | cut -d/ -f2 \
              | sort -u \
              | jq -R -s -c 'split("\n") | map(select(length > 0))')
          fi

          SHARED=$(git diff --name-only origin/$BASE...HEAD \
            | grep -q '^packages/' && echo "true" || echo "false")

          INFRA=$(git diff --name-only origin/$BASE...HEAD \
            | grep -q '^infra/' && echo "true" || echo "false")

          echo "services-matrix=$SERVICES" >> $GITHUB_OUTPUT
          echo "services-list=$(echo $SERVICES | tr -d '[]"' | tr ',' ' ')" >> $GITHUB_OUTPUT
          echo "shared-changed=$SHARED" >> $GITHUB_OUTPUT
          echo "infra-changed=$INFRA" >> $GITHUB_OUTPUT

          echo "Changed services: $SERVICES"
          echo "Shared packages changed: $SHARED"
          echo "Infra changed: $INFRA"

  # ─── Step 2: Per-service code review ──────────────────────────────────
  review-services:
    needs: detect-changes
    if: needs.detect-changes.outputs.services-matrix != '[]'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    strategy:
      matrix:
        service: ${{ fromJson(needs.detect-changes.outputs.services-matrix) }}
      max-parallel: 4
      fail-fast: false
    steps:
      - uses: actions/checkout@v4

      - name: Review ${{ matrix.service }}
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          working_directory: services/${{ matrix.service }}
          permission_mode: acceptEdits
          max_turns: 20
          max_budget_usd: "3.00"
          direct_prompt: true
          prompt: |
            Review the changes to the ${{ matrix.service }} service in PR #${{ github.event.number }}.
            
            Changed files in this service:
            $(git diff --name-only origin/${{ github.base_ref }}...HEAD -- services/${{ matrix.service }}/)
            
            Review focus:
            1. Correctness — logic errors, edge cases, error handling
            2. Security — input validation, auth checks, data exposure
            3. Service conventions — adherence to this service's CLAUDE.md
            4. Test coverage — new code covered by tests?
            5. Breaking changes — any API changes other services consume?
            
            Post a structured review comment to PR #${{ github.event.number }}.
            Start the comment with "## Claude Code Review: ${{ matrix.service }}".
            Rate severity: INFO / WARNING / ERROR.
            List any ERROR items as blocking.

  # ─── Step 3: Shared package review ────────────────────────────────────
  review-shared-packages:
    needs: detect-changes
    if: needs.detect-changes.outputs.shared-changed == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - name: Review shared packages
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          working_directory: packages
          permission_mode: acceptEdits
          max_turns: 20
          max_budget_usd: "3.00"
          direct_prompt: true
          prompt: |
            Review the changes to shared packages in PR #${{ github.event.number }}.
            
            These packages are consumed by all services. Focus on:
            1. Breaking changes to exported APIs
            2. Which services need to be updated as a result
            3. Whether the version bump is correct (patch/minor/major)
            4. Test coverage for changed code
            
            For each breaking change, identify which services import the affected symbol.
            Post a review as a PR comment starting with "## Claude Code Review: shared-packages".

  # ─── Step 4: Infra review ─────────────────────────────────────────────
  review-infra:
    needs: detect-changes
    if: needs.detect-changes.outputs.infra-changed == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - name: Review infrastructure changes
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          working_directory: infra
          permission_mode: acceptEdits
          max_turns: 15
          max_budget_usd: "2.00"
          direct_prompt: true
          prompt: |
            Review the Terraform/Helm changes in PR #${{ github.event.number }}.
            
            Focus on:
            1. Security group rules — principle of least privilege
            2. IAM policy changes — scope creep
            3. Cost impact of new resources
            4. Destructive changes (resource replacements, data loss risk)
            5. Missing required tags
            
            Flag any potentially destructive changes as BLOCKING.
            Post review as "## Claude Code Review: infrastructure".

  # ─── Step 5: Cross-service impact ─────────────────────────────────────
  cross-service-impact:
    needs: [detect-changes, review-services]
    if: |
      needs.detect-changes.outputs.shared-changed == 'true' ||
      needs.detect-changes.outputs.services-matrix != '[]' &&
      fromJson(needs.detect-changes.outputs.services-matrix) | length > 1
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - name: Cross-service impact analysis
        uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          permission_mode: acceptEdits
          max_turns: 25
          max_budget_usd: "4.00"
          direct_prompt: true
          prompt: |
            Analyse the cross-service impact of PR #${{ github.event.number }}.
            Changed services: ${{ needs.detect-changes.outputs.services-list }}
            Shared packages changed: ${{ needs.detect-changes.outputs.shared-changed }}
            
            Determine:
            1. Which API contracts changed between services?
            2. What is the required deployment order?
            3. Are there database migrations that must run before/after service deploys?
            4. Any configuration changes required in other services?
            
            Post a cross-service impact summary as "## Cross-Service Impact Analysis".
            Include a deployment checklist in markdown checkbox format.
```

---

## Quick Reference

### Starting Claude in a Monorepo

```bash
# Work on a single service — preferred
cd services/auth && claude

# Work on a single service with explicit CWD
claude --cwd services/billing

# Cross-service orchestration
claude --agent monorepo-orchestrator

# Parallel feature branches
# In Claude: /branch feat/ACME-1234-mfa
```

### CLAUDE.md Token Budget Checklist

- [ ] Root CLAUDE.md under 100 lines
- [ ] Each service CLAUDE.md under 150 lines
- [ ] @imports under 50 lines each
- [ ] No service-specific content in root CLAUDE.md
- [ ] All service-specific rules have `paths:` frontmatter
- [ ] .claudeignore excludes generated files

### Common Configuration Locations

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Root: org-wide conventions |
| `services/<name>/CLAUDE.md` | Service: tech stack, test commands, architecture |
| `.claude/rules/<name>.md` | Path-scoped or global rules |
| `.mcp.json` | Shared MCP tools |
| `services/<name>/.mcp.json` | Service-specific MCP tools |
| `.claudeignore` | Exclude generated/large files |
| `.claude/settings.json` | Project settings, plugin declarations |
| `.claude/agents/<name>.md` | Agent definitions for orchestration |
| `shared/docs/security-policy.md` | @imported shared policy documents |

---

## Related Visual Guides

- [Monorepo Patterns — Diagram](./monorepo-diagram) — Interactive CLAUDE.md hierarchy tree, path-scoped rules matcher, shared MCP server architecture, Agent Teams cross-service orchestration, and CI/CD matrix build pattern
- [Agent Teams — Architecture Diagram](./agent-teams-diagram) — Task tool vs Agent Teams comparison, subagent YAML reference, and orchestration patterns
