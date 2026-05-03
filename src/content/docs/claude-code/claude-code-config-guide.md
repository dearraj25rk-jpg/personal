---
title: CLAUDE.md vs Skills vs Rules — Architecture Guide
sidebar:
  order: 3
---

# CLAUDE.md vs Skills vs Rules — Complete Architecture & Best Practices Guide

> **Last updated: May 2026 — reflects Claude Code v2.1.121+**

## 1. The Core Problem These Three Files Solve

When you launch Claude Code, it starts with zero knowledge of your project. It doesn't know your tech stack, your team's conventions, your testing commands, or your deployment workflow. Every session would require re-explaining all of this from scratch — burning tokens, wasting time, and producing inconsistent output.

Claude Code solves this with three distinct configuration mechanisms that serve fundamentally different purposes:

| Mechanism | File(s) | Analogy | When It Loads | Purpose |
|-----------|---------|---------|---------------|---------|
| **CLAUDE.md** | `CLAUDE.md`, `CLAUDE.local.md` | Your project's **constitution** — always in force | Always at session start | Persistent project memory, conventions, and identity |
| **Rules** | `.claude/rules/*.md` | **Modular bylaws** — targeted regulations | Always at session start (or path-scoped on demand) | Organized, domain-specific instructions that decompose what would be a bloated CLAUDE.md |
| **Skills** | `.claude/skills/*/SKILL.md` | **Specialist consultants** — called on demand | Only when Claude decides to invoke them (or via `/slash` commands) | On-demand, task-specific expertise with supporting scripts and templates |

The key architectural insight is that **CLAUDE.md and Rules are "always-on" memory**, while **Skills are "on-demand" expertise**. This distinction directly impacts your token budget and how you should architect your Claude Code configuration.

---

## 2. CLAUDE.md — The Always-On Project Memory

### 2.1 What It Is

CLAUDE.md is a Markdown file that Claude Code reads **automatically at the start of every session**. Think of it as your project's identity card and operating manual combined. Claude treats its contents with **high priority** — meaning these instructions carry significant weight in Claude's decision-making, similar to how a system prompt works.

### 2.2 The Hierarchy (Precedence Order)

Claude Code supports multiple CLAUDE.md files in a strict hierarchy, where higher-level files take precedence and are loaded first:

```
┌─────────────────────────────────────────────────────┐
│  1. ENTERPRISE POLICY (Highest Priority)            │
│     macOS: /Library/Application Support/             │
│            ClaudeCode/CLAUDE.md                      │
│     Linux: /etc/claude-code/CLAUDE.md                │
│     Windows: C:\Program Files\ClaudeCode\CLAUDE.md   │
│     → Deployed by IT/DevOps via MDM, Ansible, etc.  │
├─────────────────────────────────────────────────────┤
│  2. USER MEMORY (Personal, All Projects)            │
│     ~/.claude/CLAUDE.md                              │
│     → Your personal coding preferences everywhere   │
├─────────────────────────────────────────────────────┤
│  3. PROJECT MEMORY (Team-Shared)                    │
│     ./CLAUDE.md  or  ./.claude/CLAUDE.md             │
│     → Committed to git, shared with team            │
├─────────────────────────────────────────────────────┤
│  4. PROJECT LOCAL (Personal + Project-Specific)     │
│     ./CLAUDE.local.md                                │
│     → Auto-added to .gitignore, just for you        │
└─────────────────────────────────────────────────────┘
```

**How recursive discovery works**: Claude Code starts from your current working directory (cwd) and walks upward toward the root directory `/`, loading every `CLAUDE.md` and `CLAUDE.local.md` it finds along the way. This means if you run Claude Code in `foo/bar/`, it will load memories from both `foo/CLAUDE.md` and `foo/bar/CLAUDE.md`.

**Subtree (child directory) loading**: CLAUDE.md files nested in directories *below* your cwd are NOT loaded at startup. They are loaded **on demand** — only when Claude reads files in those subdirectories. This is a critical token-saving design.

**HTML comment stripping**: Block-level HTML comments (`<!-- like this -->`) are stripped from ALL CLAUDE.md files before the content is injected into Claude's context. Comments inside code blocks are preserved. Use them for maintainer notes (dates, authors, review status) without paying token cost.

**Compaction survival**: After `/compact`, Claude re-reads the **project-root** CLAUDE.md (`./CLAUDE.md` or `./.claude/CLAUDE.md`) from disk and re-injects it. All other CLAUDE.md files (user, subtree) do NOT automatically survive compaction — they reload the next time Claude encounters their directory.

**Excluding specific CLAUDE.md files**: Use `claudeMdExcludes` in `.claude/settings.local.json` to skip files you don't want loaded for personal reasons. Managed (enterprise) CLAUDE.md files cannot be excluded.

### 2.3 The Import System

CLAUDE.md files can pull in additional files using the `@path/to/file` syntax:

```markdown
# My Project CLAUDE.md

See @README for project overview and @package.json for available commands.

## Additional Instructions
- Git workflow: @docs/git-instructions.md
- Personal preferences: @~/.claude/my-project-instructions.md
```

Imports support both relative and absolute paths. Relative paths resolve relative to the file containing the import (not the working directory). Imported files can recursively import additional files, with a **max depth of 5 hops**. Imports inside markdown code spans and code blocks are intentionally ignored to prevent collisions.

### 2.4 Token & Context Impact

This is where understanding CLAUDE.md becomes critical for your token budget:

**The 200K context window budget:**
```
┌──────────────────────────────────────────────────┐
│            200K Token Context Window              │
├──────────────────────────────────────────────────┤
│  System Prompt           ~5–15K tokens           │
│  CLAUDE.md files         ~1–10K tokens (varies)  │
│  .claude/rules/*.md      ~variable               │
│  MCP Tool Schemas        ~500–2K per server      │
│  ─────────────────────────────────────────────── │
│  Response Buffer         ~40–45K tokens reserved │
│  ─────────────────────────────────────────────── │
│  ═══════════════════════════════════════════════ │
│  USABLE CONVERSATION     ~140–150K tokens        │
│  (prompts, tool results, code, conversation)     │
└──────────────────────────────────────────────────┘
```

Because CLAUDE.md is **always loaded in full** at launch, every line you add permanently consumes tokens from your available conversation space. This is why the community has converged on keeping CLAUDE.md slim — around **100–150 lines** of concise, high-signal content.

**The "100–150 instruction" insight**: Research from practitioners suggests that Claude reliably follows about 100–150 custom instructions per session. Your system prompt already uses approximately 50 of that budget, leaving roughly 100 for your CLAUDE.md + always-on rules. When everything is marked high-priority, nothing is effectively high-priority — Claude struggles to determine what's actually relevant.

### 2.5 What Belongs in CLAUDE.md

Think of CLAUDE.md as the **minimum viable context** Claude needs for every single interaction:

```markdown
# CLAUDE.md — MyProject

## Architecture
- Backend: .NET 8 Web API, Clean Architecture
- Database: Azure SQL with Entity Framework Core
- Messaging: Azure Service Bus
- CI/CD: Azure DevOps Pipelines

## Common Commands
- Build: `dotnet build src/MyProject.sln`
- Test: `dotnet test --no-build --verbosity normal`
- Lint: `dotnet format --verify-no-changes`

## Coding Conventions
- Use nullable reference types everywhere
- Prefer record types for DTOs
- All public methods must have XML doc comments
- Use MediatR for CQRS pattern

## Git Workflow
- Conventional commits (feat:, fix:, chore:)
- One issue per PR, squash merge to main
- Never commit directly to main

## Key Paths
- Domain entities: src/Domain/Entities/
- API endpoints: src/WebApi/Controllers/
- Integration tests: tests/IntegrationTests/
```

### 2.6 What Does NOT Belong in CLAUDE.md

Move these to Rules or Skills instead:

- Detailed framework-specific patterns (move to path-scoped rules)
- Step-by-step deployment procedures (move to a skill)
- Complete style guides longer than 10 lines (move to rules)
- Workflow instructions for specific tasks (move to skills)
- Documentation or reference material (reference via `@import` or put in skills)

### 2.7 Best Practices for CLAUDE.md

1. **Keep it under ~120 lines.** Every line costs tokens on every session. If it's growing beyond this, split content into `.claude/rules/` files.

2. **Be specific, not vague.** "Use 2-space indentation" beats "Format code properly." Claude follows concrete instructions far more reliably than abstract guidance.

3. **Use bullet points and markdown headings** to structure the file. Claude parses structured content more effectively than dense prose.

4. **Include your most-used commands** (build, test, lint, deploy) so Claude doesn't waste tokens searching for them.

5. **Review periodically.** As your project evolves, stale instructions cause Claude to make mistakes. Run a monthly review.

6. **Use `@imports`** to keep the main file lean while pulling in additional context only when needed.

7. **Use CLAUDE.local.md** for personal preferences (sandbox URLs, debugging strategies, test data paths) that shouldn't be committed to git.

8. **Bootstrap with `/init`** — Claude Code's `/init` command auto-generates a CLAUDE.md by analyzing your codebase, giving you a solid starting point.

---

## 3. Rules — Modular, Path-Scoped Instructions

### 3.1 What Rules Are

Rules (introduced in Claude Code v2.0.64) are individual `.md` files placed in the `.claude/rules/` directory. They provide a **modular alternative to a monolithic CLAUDE.md**. Instead of stuffing everything into one file, you organize instructions into focused rule files that Claude loads as project memory.

The critical design detail from Anthropic: **Rules files load with the same high priority as CLAUDE.md.** Claude treats them as equally authoritative instructions.

### 3.2 Architecture & File Structure

```
your-project/
├── .claude/
│   ├── CLAUDE.md                  # Main project memory (slim)
│   └── rules/
│       ├── code-style.md          # Always loaded (no path filter)
│       ├── testing.md             # Always loaded
│       ├── security.md            # Always loaded
│       ├── backend/
│       │   ├── api.md             # Path-scoped → src/api/**
│       │   └── database.md        # Path-scoped → src/data/**
│       └── frontend/
│           ├── react.md           # Path-scoped → src/components/**
│           └── styling.md         # Path-scoped → src/styles/**
└── CLAUDE.md                      # Project root memory
```

Every `.md` file in `.claude/rules/` is **automatically discovered** by Claude Code. No registration or configuration is needed — just create the file and it's active.

### 3.3 Path-Scoped Rules (The Key Differentiator)

This is where rules become powerful. You can target rules to specific file patterns using YAML frontmatter. **Since v2.1.84, `paths:` accepts a YAML list of multiple glob patterns:**

```markdown
---
paths:
  - "src/api/**/*.ts"
  - "src/controllers/**/*.cs"
  - "tests/api/**"
---

# API Development Rules

- All endpoints must validate input with Zod schemas
- Return consistent error shapes: { error: string, code: number }
- Log all requests with correlation IDs
- Use pagination for list endpoints (limit + offset)
```

**Single path** (original v2.0.64 syntax — still works):
```yaml
---
paths: src/api/**/*.ts
---
```

**How path scoping works**: This rule **only activates when Claude works on files matching any of the listed patterns**. Your API guidelines stay completely out of context when you're editing React components, database migrations, or configuration files. This directly saves tokens and reduces noise.

**Rules without `paths:` frontmatter** apply globally — they are loaded every session, just like content in CLAUDE.md.

### 3.4 Token & Context Impact

Rules have a nuanced token story compared to CLAUDE.md:

**Global rules** (no `paths:` frontmatter): These are loaded at session start alongside CLAUDE.md. They consume tokens from your fixed overhead budget for the entire session. Treat them exactly like CLAUDE.md content for budget purposes.

**Path-scoped rules** (with `paths:` frontmatter): These are loaded **only when Claude works on matching files**. This is a significant token optimization — your backend API rules don't consume tokens when you're working on frontend components. However, once loaded, they remain in context for the rest of the session.

```
Session Start Token Budget:
┌────────────────────────────────────────────────┐
│  CLAUDE.md (all levels)        ~1–10K tokens   │
│  Global rules (no paths:)      ~1–5K tokens    │
│  MCP tools, system prompt      ~5–17K tokens   │
│  ──────────────────────────────────────────── │
│  Fixed overhead total          ~7–32K tokens   │
│                                                 │
│  Path-scoped rules: loaded ON DEMAND            │
│  (only when Claude touches matching files)      │
└────────────────────────────────────────────────┘
```

### 3.5 When to Use Rules vs. CLAUDE.md

| Put in CLAUDE.md | Put in Rules |
|------------------|-------------|
| Project identity (tech stack, architecture overview) | Detailed coding patterns for specific domains |
| Most-used commands (build, test, lint) | Framework-specific conventions (React patterns, API patterns) |
| Universal coding conventions (naming, git workflow) | Security checklists scoped to sensitive directories |
| Key file paths and directory structure | Testing requirements for different test types |
| Things Claude needs on literally every interaction | Anything that only matters when working on specific files |

### 3.6 Best Practices for Rules

1. **Start with CLAUDE.md, split into rules as it grows.** Don't over-engineer from day one. When CLAUDE.md exceeds ~120 lines, extract domain-specific sections into rule files.

2. **Use path scoping aggressively.** Every rule that only applies to specific files should have a `paths:` frontmatter. This is free token savings.

3. **One concern per file.** `security.md`, `testing.md`, `api-patterns.md` — not `everything-about-backend.md`.

4. **Keep individual rule files focused.** Each file should be scannable in under 30 seconds. If a rule file exceeds ~50 lines, consider whether it should be split further or moved to a skill.

5. **Verify what's loaded** using the `/memory` command during a session. This shows you exactly which CLAUDE.md files and rules are active.

6. **Use subdirectories** for organization (`rules/frontend/`, `rules/backend/`), but remember the files themselves are what get loaded — directories are just for your organizational clarity.

7. **Commit rules to git.** Unlike CLAUDE.local.md, rules in `.claude/rules/` are meant to be shared with your team for consistent AI-assisted development.

---

## 4. Skills — On-Demand Expertise Packages

### 4.1 What Skills Are

Skills are the most architecturally distinct of the three mechanisms. They are **modular capability packages** that Claude discovers and invokes **on demand** based on the task at hand. Unlike CLAUDE.md and rules (which are always-on memory), skills follow a **progressive disclosure** pattern — their content is loaded into context only when needed.

Each skill is a folder containing a `SKILL.md` file with optional supporting scripts, templates, and reference documents.

### 4.2 Architecture & File Structure

```
~/.claude/skills/                          # Personal skills (all projects)
├── explain-code/
│   └── SKILL.md
└── commit-helper/
    └── SKILL.md

your-project/.claude/skills/               # Project skills (team-shared)
├── deploy/
│   ├── SKILL.md
│   ├── scripts/
│   │   ├── deploy.sh
│   │   └── rollback.sh
│   └── templates/
│       └── deploy-checklist.md
├── pdf-processing/
│   ├── SKILL.md
│   ├── FORMS.md                           # Reference file (loaded on demand)
│   ├── REFERENCE.md
│   └── scripts/
│       ├── fill_form.py
│       └── validate.py
└── api-generator/
    ├── SKILL.md
    └── templates/
        ├── controller.template.cs
        └── service.template.cs
```

### 4.3 The SKILL.md File — Anatomy

Every skill requires a `SKILL.md` file with two parts: YAML frontmatter (metadata for discovery) and markdown body (instructions Claude follows when the skill is active):

```markdown
---
name: deploy-production
description: >
  Deploy application to production environment with safety checks.
  Use when user says "deploy", "push to production", "release",
  or "ship it". Includes rollback procedures.
allowed-tools: Read, Bash(npm run *), Bash(git *)
---

# Production Deployment

## Pre-flight Checks
1. Verify all tests pass: `npm run test`
2. Check lint: `npm run lint`
3. Verify no uncommitted changes

## Deployment Steps
1. Tag the release: `git tag -a v{version} -m "Release v{version}"`
2. Push tag: `git push origin v{version}`
3. Run deployment: `npm run deploy:prod`

## Rollback Procedure
If deployment fails, see [rollback script](scripts/rollback.sh)

## Post-Deployment
- Verify health check: `curl https://api.example.com/health`
- Monitor logs for 15 minutes
```

### 4.4 Frontmatter Fields Explained

| Field | Required? | Purpose | Max Length |
|-------|-----------|---------|-----------|
| `name` | Recommended | Becomes the `/slash-command` identifier. Lowercase letters, numbers, hyphens only. | 64 chars |
| `description` | **Strongly recommended** | Tells Claude **when** to use this skill. This is the most critical field — it appears in Claude's available skills list in the system prompt. | 1024 chars |
| `allowed-tools` | Optional | Restricts which tools Claude can use when this skill is active (e.g., `Read, Grep, Glob`). Tools listed here are auto-approved without per-use permission prompts. | — |
| `disable-model-invocation` | Optional | If `true`, Claude won't auto-invoke this skill — it can only be triggered via `/slash-command`. | — |
| `context` | Optional | Set to `fork` to run the skill in a separate subagent context (keeps main context clean). | — |
| `agent` | Optional | Specifies which subagent to use (e.g., `Explore`, `Plan`, or a custom agent from `.claude/agents/`). | — |
| `model` | Optional | Model override for this skill: alias (`sonnet`, `opus`, `haiku`) or full model ID (e.g., `claude-sonnet-4-6`). | — |
| `hooks` | Optional | Lifecycle hooks scoped to this skill's active lifetime. Use `once: true` on a hook handler to run it once per session, then discard. | — |

### 4.5 How Skill Discovery & Invocation Works

This is a fascinating piece of architecture. There is **no algorithmic routing, no regex matching, no ML classifier** deciding which skill to use. The process is pure LLM reasoning:

```
┌──────────────────────────────────────────────────────┐
│                    SESSION START                      │
│                                                       │
│  Claude Code scans skill directories:                 │
│    ~/.claude/skills/*/SKILL.md (personal)             │
│    .claude/skills/*/SKILL.md  (project)               │
│    Plugin-provided skills                             │
│                                                       │
│  Extracts ONLY frontmatter (name + description)       │
│  from each SKILL.md                                   │
│                                                       │
│  Embeds this list into the Skill tool definition:     │
│  ┌────────────────────────────────────────────┐      │
│  │ <available_skills>                         │      │
│  │   <skill>                                  │      │
│  │     <name>deploy-production</name>         │      │
│  │     <description>Deploy app to prod...     │      │
│  │     </description>                         │      │
│  │   </skill>                                 │      │
│  │   <skill>                                  │      │
│  │     <name>pdf-processing</name>            │      │
│  │     <description>Extract text, fill...     │      │
│  │     </description>                         │      │
│  │   </skill>                                 │      │
│  │ </available_skills>                        │      │
│  └────────────────────────────────────────────┘      │
│                                                       │
│  NOTE: Only frontmatter is in context at this stage.  │
│  The full SKILL.md body is NOT loaded yet.            │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│                  USER SENDS MESSAGE                   │
│  "Can you deploy the latest changes to production?"  │
│                                                       │
│  Claude reads the message and evaluates it against    │
│  the available_skills list in the tool definition.    │
│                                                       │
│  Claude's reasoning (inside the model's forward pass):│
│  "This request matches 'deploy-production' skill      │
│   which handles deployments. Let me invoke it."       │
│                                                       │
│  → Claude calls the Skill tool with                   │
│    name="deploy-production"                           │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│              SKILL INVOCATION (RUNTIME)               │
│                                                       │
│  System loads the FULL SKILL.md body into context     │
│  as a tool result message. Claude now has:            │
│                                                       │
│  1. The complete instructions from SKILL.md body      │
│  2. Knowledge of supporting files in the skill folder │
│  3. Allowed-tools permissions applied                 │
│                                                       │
│  Claude can then:                                     │
│  - Follow step-by-step instructions                   │
│  - Read additional files (FORMS.md, REFERENCE.md)     │
│  - Execute scripts (scripts/deploy.sh)                │
│  - Use templates                                      │
│                                                       │
│  This is "progressive disclosure" — only loading      │
│  full context when actually needed.                   │
└──────────────────────────────────────────────────────┘
```

### 4.6 Token & Context Impact

Skills have the **best token economics** of the three mechanisms because of progressive disclosure:

**At session start**: Only the frontmatter (name + description) from each skill is in context. With 10 skills, this might add only ~500–1500 tokens to the system prompt. This is dramatically cheaper than putting all that expertise in CLAUDE.md.

**When invoked**: The full SKILL.md body is loaded as a tool result, consuming tokens from your conversation space. Supporting files are loaded only if Claude decides to read them.

**The unbounded context trick**: Because skills can reference additional files that Claude reads on demand, the effective knowledge package is **unbounded** — you can bundle extensive documentation, scripts, and templates that Claude accesses only when needed.

```
Token Budget Impact Comparison:

CLAUDE.md (100 lines):
  → ~800–1500 tokens loaded EVERY session
  → Cannot be avoided, always in context

Rules (5 global + 5 path-scoped):
  → Global: ~500–1000 tokens EVERY session
  → Path-scoped: loaded only when matching files are touched

Skills (10 skills):
  → Frontmatter only: ~500–1500 tokens EVERY session
  → Full skill body: ~500–3000 tokens ONLY when invoked
  → Supporting files: loaded ONLY when Claude reads them
```

### 4.7 Two Types of Skill Content

Understanding what kind of content your skill provides helps you write better SKILL.md files:

**Reference Content** (runs inline): Adds knowledge Claude applies to your current work — conventions, patterns, style guides, domain knowledge. This content runs inline in the main conversation context.

```markdown
---
name: api-conventions
description: API design patterns for this codebase
---
When writing API endpoints:
- Use RESTful naming conventions
- Return consistent error formats
- Include request validation
```

**Task Content** (step-by-step): Gives Claude step-by-step instructions for a specific action — deployments, code generation, analysis workflows. Can optionally run in a forked subagent context to keep the main thread clean.

```markdown
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---
Research $ARGUMENTS thoroughly:
1. Find relevant files using Glob and Grep
2. Read and analyze the code
3. Summarize findings with specific file references
```

### 4.8 Skills vs. Slash Commands — Now Unified (v2.1.3+)

> **v2.1.3 update:** Skills and slash commands are now **architecturally unified**. A `SKILL.md` in `.claude/skills/<name>/` automatically creates a `/name` slash command. The distinction below is now about *how* a skill is triggered — whether Claude auto-invokes it based on context, or you call it explicitly via `/name`. Both use the same file format.

| Aspect | Auto-invoked (skill) | User-invoked (`/slash-command`) |
|--------|--------|----------------|
| Trigger | **Model decides** — Claude matches your request to skill descriptions | **You type** `/command-name` explicitly |
| Discovery | Claude reads `description:` frontmatter to decide | You browse/autocomplete from `/` menu |
| Files | Folder with `SKILL.md` + supporting files | Same `SKILL.md` file in `.claude/skills/` |
| Disable auto | Add `disable-model-invocation: true` | Not needed — user controls invocation |
| Context | Can run in subagents (forked context) | Can run in subagents (forked context) |

To **force user-only invocation** (e.g., for destructive operations), use:
```yaml
---
name: deploy-production
disable-model-invocation: true  # Won't auto-trigger; /deploy-production only
---
```

### 4.9 Best Practices for Skills

1. **The description is everything.** It's the only thing Claude sees at session start to decide whether to invoke the skill. Include both *what* the skill does AND *when* to use it, with specific trigger keywords.

   **Weak**: `description: Helps with documents`  
   **Strong**: `description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when the user mentions PDFs, forms, or document extraction.`

2. **One skill = one capability.** "PDF form filling", not "Document processing." If a skill does too many things, Claude may invoke it inappropriately or miss opportunities to use it.

3. **Use progressive disclosure.** Keep SKILL.md focused on core instructions (~500 lines max). Put detailed documentation, reference material, and examples in separate files that Claude reads only when needed.

4. **Specify `allowed-tools`** for read-only skills (like code review) to prevent unintended modifications. This also has a UX benefit — Claude won't ask for permission for the listed tools.

5. **Use `disable-model-invocation: true`** for dangerous or expensive skills (like production deployment) that should only run when you explicitly invoke them via `/slash-command`.

6. **Store personal skills in `~/.claude/skills/`** and project skills in `.claude/skills/`. Project skills get committed to git and are automatically available to your team.

7. **Test by asking matching questions.** After creating a skill, test it with prompts that should trigger it — and prompts that shouldn't.

---

## 5. Complete Architecture Flow Diagram

Here is the complete lifecycle of how all three mechanisms work together during a Claude Code session:

```
╔══════════════════════════════════════════════════════════════╗
║                    CLAUDE CODE SESSION START                  ║
╠══════════════════════════════════════════════════════════════╣
║                                                               ║
║  PHASE 1: LOAD FIXED CONTEXT (Always Happens)                ║
║  ┌──────────────────────────────────────────────────────┐    ║
║  │ 1. System Prompt                         ~5-15K tok  │    ║
║  │ 2. Enterprise CLAUDE.md (if exists)      ~varies     │    ║
║  │ 3. User ~/.claude/CLAUDE.md              ~varies     │    ║
║  │ 4. Walk up directory tree loading all               │    ║
║  │    CLAUDE.md and CLAUDE.local.md files   ~1-10K tok  │    ║
║  │ 5. Process @imports in all loaded files              │    ║
║  │ 6. Load ALL .claude/rules/*.md files                │    ║
║  │    (global rules = no paths: frontmatter) ~1-5K tok  │    ║
║  │ 7. Scan skill directories, extract frontmatter      │    ║
║  │    only (name + description)              ~0.5-1.5K  │    ║
║  │ 8. Load MCP tool schemas                 ~0.5-2K ea  │    ║
║  └──────────────────────────────────────────────────────┘    ║
║                                                               ║
║  PHASE 2: USER INTERACTION LOOP                               ║
║  ┌──────────────────────────────────────────────────────┐    ║
║  │ User sends a message                                  │    ║
║  │                          │                            │    ║
║  │                          ▼                            │    ║
║  │  ┌─────────────────────────────────────────┐         │    ║
║  │  │ Claude processes message with ALL        │         │    ║
║  │  │ loaded context:                          │         │    ║
║  │  │  • CLAUDE.md instructions (high prio)    │         │    ║
║  │  │  • Global rules (high priority)          │         │    ║
║  │  │  • Available skills list (frontmatter)   │         │    ║
║  │  │  • Conversation history                  │         │    ║
║  │  └──────────┬──────────────────────────────┘         │    ║
║  │             │                                         │    ║
║  │      ┌──────┴──────┐                                 │    ║
║  │      │ Does task   │                                 │    ║
║  │      │ touch files │───YES──┐                        │    ║
║  │      │ matching a  │        ▼                        │    ║
║  │      │ path-scoped │  Load matching                  │    ║
║  │      │ rule?       │  path-scoped rules              │    ║
║  │      └──────┬──────┘  into context                   │    ║
║  │             │NO                                       │    ║
║  │             ▼                                         │    ║
║  │      ┌──────────────┐                                │    ║
║  │      │ Does task    │                                │    ║
║  │      │ match a      │───YES──┐                       │    ║
║  │      │ skill's      │        ▼                       │    ║
║  │      │ description? │  Invoke Skill tool:            │    ║
║  │      └──────┬───────┘  Load full SKILL.md body       │    ║
║  │             │NO        into context, apply           │    ║
║  │             │          allowed-tools, optionally     │    ║
║  │             │          fork to subagent              │    ║
║  │             ▼                                         │    ║
║  │      Claude responds using available context          │    ║
║  │             │                                         │    ║
║  │      ┌──────┴──────────────────┐                     │    ║
║  │      │ If Skill is active,     │                     │    ║
║  │      │ Claude may read          │                     │    ║
║  │      │ supporting files on      │                     │    ║
║  │      │ demand (progressive      │                     │    ║
║  │      │ disclosure)              │                     │    ║
║  │      └─────────────────────────┘                     │    ║
║  └──────────────────────────────────────────────────────┘    ║
║                                                               ║
║  PHASE 3: CONTEXT MANAGEMENT                                  ║
║  ┌──────────────────────────────────────────────────────┐    ║
║  │ Monitor: /status shows token usage percentage        │    ║
║  │                                                       │    ║
║  │ 0-50%   GREEN   → Optimal performance                │    ║
║  │ 50-70%  YELLOW  → Still good, be mindful             │    ║
║  │ 70-90%  ORANGE  → Consider /compact                  │    ║
║  │ 90%+    RED     → Auto-compaction triggers            │    ║
║  │                                                       │    ║
║  │ /compact → Summarizes conversation, fresh context     │    ║
║  │ /clear   → Wipes conversation entirely                │    ║
║  │ /memory  → Shows loaded memory files                  │    ║
║  │ /context → Detailed token breakdown                   │    ║
║  └──────────────────────────────────────────────────────┘    ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 6. Side-by-Side Comparison Table

| Dimension | CLAUDE.md | Rules (.claude/rules/) | Skills (.claude/skills/) | Plugins (.claude/plugins/) |
|-----------|-----------|------------------------|--------------------------|--------------------------|
| **When loaded** | Always at session start | Global: always at start. Path-scoped: on demand | Frontmatter only at start. Body: on invocation | Manifest at start; skills/hooks/CLAUDE.md content merged on load |
| **Priority** | High (authoritative) | High (same as CLAUDE.md) | Normal (tool result) | Depends on content type |
| **Token cost** | Permanent overhead every session | Global = permanent. Path-scoped = conditional | Minimal overhead (~description tokens). Full cost only on use | Depends on bundled CLAUDE.md size |
| **Invocation** | Automatic | Automatic (global) or file-pattern triggered (path-scoped) | Model-decided or user `/slash-command` | Enabled per-user; `/reload-plugins` to hot-reload |
| **Scope** | Entire project | Per-domain or per-path | Per-task or per-capability | Cross-project (user-installed) or enterprise-distributed |
| **Supports scripts?** | No | No | Yes (supporting files) | Yes (via bundled skills) |
| **Supports templates?** | No (just text) | No (just text) | Yes (full folder structure) | Yes |
| **Path filtering** | Via directory hierarchy | Yes (`paths:` frontmatter with glob patterns) | No (matched by description, not file path) | No |
| **Git-shared** | Yes (CLAUDE.md) / No (CLAUDE.local.md) | Yes | Yes (project skills) / No (personal skills) | Via `managed-settings.d/` (enterprise) |
| **Best for** | Project identity, universal conventions, key commands | Domain-specific rules, coding patterns scoped to file types | Complex workflows, deployment, code generation, analysis tasks | Reusable tooling packages, enterprise-wide standards |
| **Edit command** | `/memory` or direct edit | Direct edit | Direct edit | `claude plugin install/enable/disable` |
| **Max recommended size** | ~120 lines | ~50 lines per file | ~500 lines in SKILL.md (unbounded with supporting files) |

---

## 7. Real-World Architecture Example

Here's how these three mechanisms work together for a typical .NET + Azure insurance project:

```
my-insurance-api/
├── CLAUDE.md                              # ~80 lines
│   ├── Architecture overview (.NET 8, Azure, EF Core)
│   ├── Build/test/lint commands
│   ├── Git workflow (conventional commits)
│   ├── Key directory paths
│   └── @imports → docs/adr-index.md
│
├── CLAUDE.local.md                        # Personal, not committed
│   ├── My Azure sandbox connection string
│   ├── My preferred debugging approach
│   └── Local dev overrides
│
├── .claude/
│   ├── rules/
│   │   ├── code-style.md                  # Global: naming, formatting
│   │   ├── testing.md                     # Global: test requirements
│   │   ├── security.md                    # Global: OWASP, auth patterns
│   │   │
│   │   ├── api-endpoints.md               # paths: src/WebApi/**/*.cs
│   │   │   → Controller patterns, validation, error responses
│   │   │
│   │   ├── domain-entities.md             # paths: src/Domain/**/*.cs
│   │   │   → DDD patterns, value objects, aggregate roots
│   │   │
│   │   ├── ef-migrations.md               # paths: src/Infrastructure/Migrations/**
│   │   │   → Migration conventions, index naming
│   │   │
│   │   └── claims-processing.md           # paths: src/Domain/Claims/**
│   │       → Insurance domain rules, claim states, validation
│   │
│   └── skills/
│       ├── deploy-staging/
│       │   ├── SKILL.md                   # Deploy to Azure staging
│       │   └── scripts/
│       │       ├── deploy.sh
│       │       └── smoke-test.sh
│       │
│       ├── generate-api-endpoint/
│       │   ├── SKILL.md                   # Scaffold new controller + service + tests
│       │   └── templates/
│       │       ├── controller.template.cs
│       │       ├── service.template.cs
│       │       └── test.template.cs
│       │
│       ├── claims-analysis/
│       │   ├── SKILL.md                   # Analyze claims processing logic
│       │   ├── domain-glossary.md
│       │   └── state-machine-reference.md
│       │
│       └── qa-test-generation/
│           ├── SKILL.md                   # Generate tests from Jira/Confluence
│           ├── scripts/
│           │   └── extract-acceptance-criteria.py
│           └── templates/
│               ├── unit-test.template.cs
│               └── integration-test.template.cs
│
└── src/
    ├── Domain/
    │   ├── CLAUDE.md                      # Subtree memory for domain layer
    │   └── ...
    └── WebApi/
        └── ...
```

---

## 8. Decision Framework — What Goes Where?

When you have new instructions or knowledge to give Claude, use this decision tree:

```
START: "I have instructions/knowledge for Claude"
  │
  ├─→ Does Claude need this on EVERY interaction?
  │     │
  │     YES → Is it under 5-10 lines?
  │     │      │
  │     │      YES → Put in CLAUDE.md
  │     │      │
  │     │      NO → Does it apply only to specific file types?
  │     │             │
  │     │             YES → Create a path-scoped rule in .claude/rules/
  │     │             │
  │     │             NO → Create a global rule in .claude/rules/
  │     │
  │     NO → Does it involve a multi-step workflow or need scripts/templates?
  │           │
  │           YES → Create a Skill in .claude/skills/
  │           │
  │           NO → Is it reference knowledge for a specific task type?
  │                 │
  │                 YES → Create a Skill (reference content type)
  │                 │
  │                 NO → Do you need to bundle & distribute this to a team?
  │                       │
  │                       YES → Package as a Plugin (.claude/plugin.json)
  │                       │
  │                       NO → Add it as an @imported file from CLAUDE.md
  │                             or use a path-scoped rule
```

---

## 9. Common Anti-Patterns to Avoid

**Anti-Pattern 1: The Monolithic CLAUDE.md.** Putting everything in a single 500-line CLAUDE.md. Claude's attention degrades when everything competes for high priority. Symptoms: ignored instructions, inconsistent behavior. Fix: Split into rules and skills.

**Anti-Pattern 2: Duplicating instructions across files.** Having the same "use conventional commits" rule in CLAUDE.md, a rule file, AND a skill. This wastes tokens and can cause conflicts. Fix: Single source of truth — put each instruction in exactly one place.

**Anti-Pattern 3: Vague skill descriptions.** Using `description: Helps with code` means Claude will either invoke it for everything or never. Fix: Include specific trigger words and use cases.

**Anti-Pattern 4: Making everything a skill.** Simple conventions ("use 2-space indentation") don't need the overhead of a skill folder. Fix: Use CLAUDE.md or rules for simple instructions.

**Anti-Pattern 5: No path scoping on rules.** Having 20 global rule files means ~20 files loaded every session regardless of task. Fix: Add `paths:` frontmatter to every rule that applies to specific file types.

**Anti-Pattern 6: Ignoring token budget.** Not monitoring context usage and wondering why Claude "forgets" instructions at the end of long sessions. Fix: Use `/status` to monitor, `/compact` proactively, and keep fixed overhead minimal.

---

## 10. Additional Topics You Should Know

### 10.1 The # Shortcut for Quick Memory Additions

During a session, start your input with `#` to quickly add a memory:

```
# Always run prettier before committing
```

Claude Code will prompt you to choose which memory file to store it in (CLAUDE.md, CLAUDE.local.md, user memory, auto-memory, etc.).

### 10.2 Plugin System (Complementary Mechanism)

The Plugin System provides a package manager for bundling and distributing skills, agents, output styles, MCP servers, hooks, monitors, themes, and LSP servers as a single versioned artifact.

**Plugin components** (complete list as of 2026):
- `commands/` or `skills/` — Slash commands and skills (namespaced `plugin-name:skill`)
- `agents/` — Subagents (namespaced; hooks/mcpServers/permissionMode blocked for security)
- `output-styles/` — Custom output styles
- `monitors/` — Background watchers that deliver stdout to Claude as notifications (requires v2.1.105+)
- `themes/` — Color themes available in `/theme`
- `bin/` — Executables added to the Bash tool's PATH
- `hooks/hooks.json` — Lifecycle hooks
- `.mcp.json` — MCP server definitions
- `.lsp.json` — Language server configurations
- `settings.json` — Default settings applied at plugin enable time
- `.claude-plugin/plugin.json` — Optional manifest (`name` is the only required field)

**CLI commands:**
```bash
claude plugin install <name>[@marketplace]   # Install from marketplace
claude plugin install <name> --scope project  # Install for team (writes to .claude/settings.json)
claude plugin uninstall <name>               # Remove plugin
claude plugin uninstall <name> --keep-data   # Remove but keep persistent data
claude plugin prune                          # Remove orphaned auto-installed dependencies (v2.1.121+)
claude plugin enable <name>                  # Enable a disabled plugin
claude plugin disable <name>                 # Disable without uninstalling
claude plugin update <name>                  # Update to latest version
claude plugin list                           # List installed plugins
claude plugin list --json --available        # Include marketplace listings
```

**Plugin manifest** (`.claude-plugin/plugin.json`) — optional but recommended:
```json
{
  "name": "dotnet-azure-ops",
  "version": "1.2.0",
  "description": "Production .NET/Azure workflow pack",
  "skills": "./skills/",
  "agents": ["./agents/reviewer.md"],
  "hooks": "./hooks/hooks.json",
  "mcpServers": "./.mcp.json",
  "monitors": "./monitors/monitors.json",
  "themes": "./themes/",
  "userConfig": {
    "api_endpoint": { "type": "string", "title": "API endpoint", "description": "Your staging URL" }
  }
}
```

**Plugin environment variables** (in hook commands, MCP/LSP configs, skill content):
- `${CLAUDE_PLUGIN_ROOT}` — plugin's installation directory (changes on update — don't write here)
- `${CLAUDE_PLUGIN_DATA}` — persistent data directory that survives updates (`~/.claude/plugins/data/<id>/`)
- `${user_config.KEY}` — values from `userConfig` prompts; also exported as `CLAUDE_PLUGIN_OPTION_<KEY>`

**Enterprise managed plugins**: Administrators can force-enable plugins via `enabledPlugins` in `managed-settings.json`. Plugins force-enabled this way are exempt from `allowManagedHooksOnly` restrictions, allowing trusted hooks to run even when user/project hooks are blocked.

### 10.3 Hooks (Complementary Mechanism)

Hooks are handlers that run automatically at specific lifecycle events. They are NOT the same as rules or skills — they are code execution triggers, not knowledge/instruction files. Use hooks for mechanical enforcement (lint check, secret scanning, policy validation) and rules/skills for nuanced judgment.

**Complete hook event list** (as of May 2026):

| Category | Events |
|----------|--------|
| Session lifecycle | `SessionStart`, `Setup`, `SessionEnd` |
| Turn level | `UserPromptSubmit`, `UserPromptExpansion`, `Stop`, `StopFailure`, `PostToolBatch`, `PostCompact`, `PreCompact` |
| Tool execution | `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`, `PermissionDenied` |
| Agents/subagents | `SubagentStart`, `SubagentStop`, `TeammateIdle` |
| Tasks | `TaskCreated`, `TaskCompleted` |
| File/environment | `CwdChanged`, `FileChanged`, `ConfigChange`, `WorktreeCreate`, `WorktreeRemove` |
| User interaction | `Notification`, `Elicitation`, `ElicitationResult` |
| Instructions | `InstructionsLoaded` |

**Hook handler types**: `command` (shell script), `http` (POST request), `mcp_tool` (call MCP server tool), `prompt` (LLM single-turn evaluation), `agent` (subagent with tools — experimental).

**Key hook capabilities**:
- `PreToolUse` → can block, allow, deny, ask, or defer tool calls; can modify tool input before execution
- `Stop` / `SubagentStop` → can prevent Claude from stopping (force continuation)
- `WorktreeCreate` → can replace default git behavior entirely (hook prints worktree path to stdout)
- `asyncRewake: true` → hook runs in background; if it exits 2, wakes Claude with the failure message
- `once: true` → only honored in skill/agent frontmatter; runs once per session then removed
- `InstructionsLoaded` → observability-only; fires when any CLAUDE.md or rules file loads (session_start, nested_traversal, path_glob_match, include, compact)

**Where hooks are defined** (all merge):
1. `managed-settings.json` (organization-wide, unless `allowManagedHooksOnly` blocks non-managed)
2. `.claude/settings.json` (project, git-tracked)
3. `~/.claude/settings.json` (user, personal)
4. `.claude/settings.local.json` (local overrides, gitignored)
5. Skill frontmatter (scoped to skill lifetime)
6. Agent/subagent frontmatter (scoped to agent lifetime)
7. Plugin `hooks/hooks.json` (bundled with plugin)

### 10.4 Auto-Memory System

Claude Code has a **built-in persistent learning system** that saves project knowledge across sessions. When you ask Claude to "remember" something or Claude learns important context, it writes to `MEMORY.md` in the auto-memory directory.

**Key facts:**
- Storage: `~/.claude/projects/<project>/memory/MEMORY.md` (derived from git root)
- All worktrees in the same git repo share **one** memory directory
- Machine-local — not synced across machines; not shared with teammates
- First **200 lines OR 25 KB** (whichever comes first) loaded at session start — hard cap, unlike CLAUDE.md files which load in full with no size limit
- Can create satellite topic files (e.g., `database.md`, `deployment.md`) alongside `MEMORY.md`
- This is **separate** from subagent MEMORY.md (which lives in `agent-memory/<name>/MEMORY.md`)

**Configure:**
```json
// ~/.claude/settings.json — user setting only, not valid in project settings
{
  "autoMemoryDirectory": "~/my-memory-dir"
}
```

**Disable:**
```bash
CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 claude
```

**In-session control:** Run `/memory` to toggle, browse files, or open them in your editor. Type `#` at the start of input to immediately save a note:
```
# Use vertical slice architecture, not Clean Architecture, in this project
```

**What Claude saves**: Things you explicitly ask it to remember, recurring conventions it notices, architectural decisions, key file paths. You see "Writing memory" in the interface when it's active.

### 10.5 Enterprise Managed Settings

For enterprise deployments, Claude Code supports **multiple managed settings delivery mechanisms** — all taking the highest precedence, overriding user and project settings. Only **one managed source tier** is used at a time; they do not merge across tiers.

**Precedence within managed tier** (highest to lowest):
1. Server-managed (from Claude.ai admin console)
2. MDM/OS-level (macOS plist, Windows HKLM Registry)
3. File-based (`managed-settings.json` + `managed-settings.d/*.json`)
4. HKCU Registry (Windows user-level — lowest managed tier)

**File-based (all platforms):**
```
macOS:   /Library/Application Support/ClaudeCode/managed-settings.json
Linux:   /etc/claude-code/managed-settings.json
Windows: C:\Program Files\ClaudeCode\managed-settings.json

Drop-in directory (alongside managed-settings.json):
  managed-settings.d/
  ├── 10-security.json       # Merged alphabetically on top of base
  ├── 20-plugins.json        # Later files win on scalar values
  └── 30-mcp-servers.json    # Arrays concatenate and deduplicate
```

**macOS MDM delivery:**
```bash
# Deploy via Jamf, Kandji (Iru), Mosyle — domain: com.anthropic.claudecode
defaults write com.anthropic.claudecode permissions.allow -array "Read" "Grep" "Glob"
defaults write com.anthropic.claudecode sandbox.enabled -bool true
```

**Windows Registry:**
```
Admin:       HKLM\SOFTWARE\Policies\ClaudeCode  (Settings value, REG_SZ JSON)
User-level:  HKCU\SOFTWARE\Policies\ClaudeCode  (only if no HKLM source)
Deploy via:  Group Policy or Intune
```

**WSL note**: Set `wslInheritsWindowsSettings: true` in the Windows HKLM registry key to make WSL Claude Code sessions read Windows managed settings too.

**Drop-in directory merge rules (v2.1.83)**:
- `managed-settings.json` merged first as base
- `*.json` files in `managed-settings.d/` sorted alphabetically and merged on top
- Scalar values: later files override earlier ones
- Arrays: concatenated and de-duplicated
- Objects: deep-merged
- Use numeric prefixes to control order: `10-telemetry.json`, `20-security.json`

**Key managed-only settings**:
- `allowManagedHooksOnly` — blocks all user/project/non-managed-plugin hooks
- `allowManagedMcpServersOnly` — only allowlisted MCP servers apply
- `allowManagedPermissionRulesOnly` — only managed allow/ask/deny rules apply
- `strictKnownMarketplaces` — controls which plugin marketplaces users may add
- `forceRemoteSettingsRefresh` — block startup until remote managed settings are fetched (fail-closed)
- `companyAnnouncements` — messages shown at startup, cycled at random
- `channelsEnabled` — allow message channel delivery (Team/Enterprise)

### 10.6 MCP Servers (Complementary Mechanism)

MCP (Model Context Protocol) servers add new tools Claude can use. Skills can reference MCP tools. Each MCP server adds ~500–2000 tokens of tool schema to your context, so disable unused servers with `/mcp` to conserve tokens.

**MCP server scopes**: User scope in `~/.claude.json`; project scope in `.claude/.mcp.json`; managed scope in `managed-mcp.json` (same directory as `managed-settings.json`).

### 10.7 Subagents and Skills

Skills with `context: fork` run in a forked subagent with its own context window. This keeps your main conversation thread clean — the subagent does the work, summarizes results, and returns them. This is particularly valuable for research-heavy skills that would otherwise bloat your main context.

**Subagent frontmatter** (full field reference):
```yaml
---
name: agent-name           # Required
description: ...           # Required — drives auto-delegation; include "use proactively" if desired
model: inherit             # inherit | sonnet | opus | haiku | full model ID (e.g. claude-opus-4-7)
effort: medium             # low | medium | high | xhigh — thinking budget
maxTurns: 50               # Max agentic loop iterations before stopping
tools: Read, Grep          # Allowlist — only these tools available
disallowedTools: Write     # Denylist — block specific tools
isolation: worktree        # "worktree" only — runs in isolated git worktree copy of repo
background: true           # Run agent as background task (experimental)
skills: [skill-name]       # Inject skills into agent context at startup (no discovery needed)
memory:
  scope: user              # user | project | local
permissionMode: default    # default | plan | acceptEdits | auto | bypassPermissions
hooks: ...                 # Lifecycle hooks, scoped to agent lifetime
mcpServers: [...]          # Inline or reference already-connected MCP servers
---
```

**Critical subagent constraint**: Subagents **cannot spawn other subagents**. The `Agent` tool is unavailable inside a subagent context. This is a hard architectural limit.

**Session-wide subagent**: Use `claude --agent <name>` to run the entire session as a named subagent. For plugin agents: `claude --agent <plugin-name>:<agent-name>`. List all configured agents with `claude agents`.

### 10.8 The /memory Command

Run `/memory` at any time to see what memory files are currently loaded, verify path-scoped rules are activating correctly, toggle auto-memory on/off, and open any memory file for editing in your system editor.

---

## 11. Sources

All information sourced from official documentation as of May 2026:
- Memory management: https://code.claude.com/docs/en/memory
- Skills: https://code.claude.com/docs/en/skills
- Subagents: https://code.claude.com/docs/en/sub-agents
- Output styles: https://code.claude.com/docs/en/output-styles
- Settings: https://code.claude.com/docs/en/settings
- Plugins: https://code.claude.com/docs/en/plugins
- Plugins reference: https://code.claude.com/docs/en/plugins-reference
- Hooks reference: https://code.claude.com/docs/en/hooks
- Best practices: https://code.claude.com/docs/en/best-practices
- How Claude Code works: https://code.claude.com/docs/en/how-claude-code-worksude/settings.json` (project, git-tracked)
3. `~/.claude/settings.json` (user, personal)
4. `.claude/settings.local.json` (local overrides, gitignored)
5. Skill frontmatter (scoped to skill lifetime)
6. Agent/subagent frontmatter (scoped to agent lifetime)
7. Plugin `hooks/hooks.json` (bundled with plugin)

### 10.4 Auto-Memory System

Claude Code has a **built-in persistent learning system** that saves project knowledge across sessions. When you ask Claude to "remember" something or Claude learns important context, it writes to `MEMORY.md` in the auto-memory directory.

**Key facts:**
- Storage: `~/.claude/projects/<project>/memory/MEMORY.md` (derived from git root)
- All worktrees in the same git repo share **one** memory directory
- Machine-local — not synced across machines; not shared with teammates
- First **200 lines OR 25 KB** (whichever comes first) loaded at session start — hard cap, unlike CLAUDE.md files which load in full with no size limit
- Can create satellite topic files (e.g., `database.md`, `deployment.md`) alongside `MEMORY.md`
- This is **separate** from subagent MEMORY.md (which lives in `agent-memory/<name>/MEMORY.md`)

**Configure:**
```json
// ~/.claude/settings.json — user setting only, not project
{
  "autoMemoryDirectory": "~/my-memory-dir"
}
```

**Disable:**
```bash
CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 claude
```

**In-session control:** Run `/memory` to toggle, browse files, or open them in your editor. Type `#` at the start of input to immediately save a note:
```
# Use vertical slice architecture, not Clean Architecture, in this project
```

**What Claude saves**: Things you explicitly ask it to remember, recurring conventions it notices, architectural decisions, key file paths. You see "Writing memory" in the interface when it's active.

### 10.5 Enterprise Managed Settings

For enterprise deployments, Claude Code supports **multiple managed settings delivery mechanisms** — all taking the highest precedence, overriding user and project settings. Only **one managed source tier** is used at a time; they do not merge across tiers.

**Precedence within managed tier** (highest to lowest):
1. Server-managed (from Claude.ai admin console)
2. MDM/OS-level (macOS plist, Windows HKLM Registry)
3. File-based (`managed-settings.json` + `managed-settings.d/*.json`)
4. HKCU Registry (Windows user-level — lowest managed tier)

**File-based (all platforms):**
```
macOS:   /Library/Application Support/ClaudeCode/managed-settings.json
Linux:   /etc/claude-code/managed-settings.json
Windows: C:\Program Files\ClaudeCode\managed-settings.json

Drop-in directory (alongside managed-settings.json):
  managed-settings.d/
  ├── 10-security.json       # Merged alphabetically on top of base
  ├── 20-plugins.json        # Later files win on scalar values
  └── 30-mcp-servers.json    # Arrays concatenate and deduplicate
```

**macOS MDM delivery:**
```bash
# Deploy via Jamf, Kandji (Iru), Mosyle, or manual `defaults write`
# Managed plist domain: com.anthropic.claudecode
defaults write com.anthropic.claudecode permissions.allow -array "Read" "Grep" "Glob"
defaults write com.anthropic.claudecode sandbox.enabled -bool true
```

**Windows Registry:**
```
Admin:       HKLM\SOFTWARE\Policies\ClaudeCode  (Settings value, REG_SZ JSON)
User-level:  HKCU\SOFTWARE\Policies\ClaudeCode  (only if no HKLM source)
Deploy via:  Group Policy or Intune
```

**WSL note**: Set `wslInheritsWindowsSettings: true` in the Windows HKLM registry key to make WSL Claude Code sessions read Windows managed settings too.

**Drop-in directory merge rules (v2.1.83)**:
- `managed-settings.json` merged first as base
- `*.json` files in `managed-settings.d/` sorted alphabetically and merged on top
- Scalar values: later files override earlier ones
- Arrays: concatenated and de-duplicated
- Objects: deep-merged
- Hidden files starting with `.` are ignored
- Use numeric prefixes to control order: `10-telemetry.json`, `20-security.json`

**Key managed-only settings**:
- `allowManagedHooksOnly` — blocks all user/project/non-managed-plugin hooks
- `allowManagedMcpServersOnly` — only allowlisted MCP servers apply
- `allowManagedPermissionRulesOnly` — only managed allow/ask/deny rules apply
- `strictKnownMarketplaces` — controls which plugin marketplaces users may add
- `forceRemoteSettingsRefresh` — block startup until remote managed settings are fetched (fail-closed)
- `companyAnnouncements` — messages shown at startup, cycled at random
- `channelsEnabled` — allow message channel delivery (Team/Enterprise)

### 10.6 MCP Servers (Complementary Mechanism)

MCP (Model Context Protocol) servers add new tools Claude can use. Skills can reference MCP tools. Each MCP server adds ~500–2000 tokens of tool schema to your context, so disable unused servers with `/mcp` to conserve tokens.

**MCP server scopes**: User scope in `~/.claude.json`; project scope in `.claude/.mcp.json`; managed scope in `managed-mcp.json`.

### 10.7 Subagents and Skills

Skills with `context: fork` run in a forked subagent with its own context window. This keeps your main conversation thread clean — the subagent does the work, summarizes results, and returns them. This is particularly valuable for research-heavy skills that would otherwise bloat your main context.

**Subagent frontmatter** (full list for reference):
```yaml
---
name: agent-name           # Required
description: ...           # Required — drives auto-delegation
model: inherit             # inherit | sonnet | opus | haiku | full model ID
effort: medium             # low | medium | high | xhigh
maxTurns: 50               # Max loop iterations
tools: Read, Grep          # Allowlist
disallowedTools: Write     # Denylist
isolation: worktree        # Run in isolated git worktree copy
background: true           # Background task (experimental)
skills: [skill-name]       # Inject skills into agent context at startup
memory:
  scope: user              # user | project | local
permissionMode: default    # default | plan | acceptEdits | auto | bypassPermissions
hooks: ...                 # Lifecycle hooks (scoped to agent lifetime)
mcpServers: [...]          # Inline or reference MCP servers
---
```

**Critical subagent constraint**: Subagents **cannot spawn other subagents**. The `Agent` tool is unavailable inside a subagent context.

### 10.8 The /memory Command

Run `/memory` at any time to see what memory files are currently loaded, verify path-scoped rules are activating correctly, toggle auto-memory on/off, and open any memory file for editing in your system editor.

---

## 11. Sources

All information sourced from official documentation as of May 2026:
- Memory management: https://code.claude.com/docs/en/memory
- Skills: https://code.claude.com/docs/en/skills
- Subagents: https://code.claude.com/docs/en/sub-agents
- Output styles: https://code.claude.com/docs/en/output-styles
- Settings: https://code.claude.com/docs/en/settings
- Plugins: https://code.claude.com/docs/en/plugins
- Plugins reference: https://code.claude.com/docs/en/plugins-reference
- Hooks reference: https://code.claude.com/docs/en/hooks
- Best practices: https://code.claude.com/docs/en/best-practices
- How Claude Code works: https://code.claude.com/docs/en/how-claude-code-works
ude/settings.json` (project, git-tracked)
3. `~/.claude/settings.json` (user, personal)
4. `.claude/settings.local.json` (local overrides, gitignored)
5. Skill frontmatter (scoped to skill lifetime)
6. Agent/subagent frontmatter (scoped to agent lifetime)
7. Plugin `hooks/hooks.json` (bundled with plugin)

### 10.4 Auto-Memory System

Claude Code has a **built-in persistent learning system** that saves project knowledge across sessions. When you ask Claude to "remember" something or Claude learns important context, it writes to `MEMORY.md` in the auto-memory directory.

**Key facts:**
- Storage: `~/.claude/projects/<project>/memory/MEMORY.md` (derived from git root)
- All worktrees in the same git repo share **one** memory directory
- Machine-local — not synced across machines; not shared with teammates
- First **200 lines OR 25 KB** (whichever comes first) loaded at session start — hard cap, unlike CLAUDE.md files which load in full with no size limit
- Can create satellite topic files (e.g., `database.md`, `deployment.md`) alongside `MEMORY.md`
- This is **separate** from subagent MEMORY.md (which lives in `agent-memory/<name>/MEMORY.md`)

**Configure:**
```json
// ~/.claude/settings.json — user setting only, not valid in project settings
{
  "autoMemoryDirectory": "~/my-memory-dir"
}
```

**Disable:**
```bash
CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 claude
```

**In-session control:** Run `/memory` to toggle, browse files, or open them in your editor. Type `#` at the start of input to immediately save a note:
```
# Use vertical slice architecture, not Clean Architecture, in this project
```

**What Claude saves**: Things you explicitly ask it to remember, recurring conventions it notices, architectural decisions, key file paths. You see "Writing memory" in the interface when it's active.

### 10.5 Enterprise Managed Settings

For enterprise deployments, Claude Code supports **multiple managed settings delivery mechanisms** — all taking the highest precedence, overriding user and project settings. Only **one managed source tier** is used at a time; they do not merge across tiers.

**Precedence within managed tier** (highest to lowest):
1. Server-managed (from Claude.ai admin console)
2. MDM/OS-level (macOS plist, Windows HKLM Registry)
3. File-based (`managed-settings.json` + `managed-settings.d/*.json`)
4. HKCU Registry (Windows user-level — lowest managed tier)

**File-based (all platforms):**
```
macOS:   /Library/Application Support/ClaudeCode/managed-settings.json
Linux:   /etc/claude-code/managed-settings.json
Windows: C:\Program Files\ClaudeCode\managed-settings.json

Drop-in directory (alongside managed-settings.json):
  managed-settings.d/
  ├── 10-security.json       # Merged alphabetically on top of base
  ├── 20-plugins.json        # Later files win on scalar values
  └── 30-mcp-servers.json    # Arrays concatenate and deduplicate
```

**macOS MDM delivery:**
```bash
# Deploy via Jamf, Kandji (Iru), Mosyle — domain: com.anthropic.claudecode
defaults write com.anthropic.claudecode permissions.allow -array "Read" "Grep" "Glob"
defaults write com.anthropic.claudecode sandbox.enabled -bool true
```

**Windows Registry:**
```
Admin:       HKLM\SOFTWARE\Policies\ClaudeCode  (Settings value, REG_SZ JSON)
User-level:  HKCU\SOFTWARE\Policies\ClaudeCode  (only if no HKLM source)
Deploy via:  Group Policy or Intune
```

**WSL note**: Set `wslInheritsWindowsSettings: true` in the Windows HKLM registry key to make WSL Claude Code sessions read Windows managed settings too.

**Drop-in directory merge rules (v2.1.83)**:
- `managed-settings.json` merged first as base
- `*.json` files in `managed-settings.d/` sorted alphabetically and merged on top
- Scalar values: later files override earlier ones
- Arrays: concatenated and de-duplicated
- Objects: deep-merged
- Use numeric prefixes to control order: `10-telemetry.json`, `20-security.json`

**Key managed-only settings**:
- `allowManagedHooksOnly` — blocks all user/project/non-managed-plugin hooks
- `allowManagedMcpServersOnly` — only allowlisted MCP servers apply
- `allowManagedPermissionRulesOnly` — only managed allow/ask/deny rules apply
- `strictKnownMarketplaces` — controls which plugin marketplaces users may add
- `forceRemoteSettingsRefresh` — block startup until remote managed settings are fetched (fail-closed)
- `companyAnnouncements` — messages shown at startup, cycled at random
- `channelsEnabled` — allow message channel delivery (Team/Enterprise)

### 10.6 MCP Servers (Complementary Mechanism)

MCP (Model Context Protocol) servers add new tools Claude can use. Skills can reference MCP tools. Each MCP server adds ~500–2000 tokens of tool schema to your context, so disable unused servers with `/mcp` to conserve tokens.

**MCP server scopes**: User scope in `~/.claude.json`; project scope in `.claude/.mcp.json`; managed scope in `managed-mcp.json` (same directory as `managed-settings.json`).

### 10.7 Subagents and Skills

Skills with `context: fork` run in a forked subagent with its own context window. This keeps your main conversation thread clean — the subagent does the work, summarizes results, and returns them. This is particularly valuable for research-heavy skills that would otherwise bloat your main context.

**Subagent frontmatter** (full field reference):
```yaml
---
name: agent-name           # Required
description: ...           # Required — drives auto-delegation; include "use proactively" if desired
model: inherit             # inherit | sonnet | opus | haiku | full model ID (e.g. claude-opus-4-7)
effort: medium             # low | medium | high | xhigh — thinking budget
maxTurns: 50               # Max agentic loop iterations before stopping
tools: Read, Grep          # Allowlist — only these tools available
disallowedTools: Write     # Denylist — block specific tools
isolation: worktree        # "worktree" only — runs in isolated git worktree copy of repo
background: true           # Run agent as background task (experimental)
skills: [skill-name]       # Inject skills into agent context at startup (no discovery needed)
memory:
  scope: user              # user | project | local
permissionMode: default    # default | plan | acceptEdits | auto | bypassPermissions
hooks: ...                 # Lifecycle hooks, scoped to agent lifetime
mcpServers: [...]          # Inline or reference already-connected MCP servers
---
```

**Critical subagent constraint**: Subagents **cannot spawn other subagents**. The `Agent` tool is unavailable inside a subagent context. This is a hard architectural limit.

**Session-wide subagent**: Use `claude --agent <name>` to run the entire session as a named subagent. For plugin agents: `claude --agent <plugin-name>:<agent-name>`. List all configured agents with `claude agents`.

### 10.8 The /memory Command

Run `/memory` at any time to see what memory files are currently loaded, verify path-scoped rules are activating correctly, toggle auto-memory on/off, and open any memory file for editing in your system editor.

---

## 11. Sources

All information sourced from official documentation as of May 2026:
- Memory management: https://code.claude.com/docs/en/memory
- Skills: https://code.claude.com/docs/en/skills
- Subagents: https://code.claude.com/docs/en/sub-agents
- Output styles: https://code.claude.com/docs/en/output-styles
- Settings: https://code.claude.com/docs/en/settings
- Plugins: https://code.claude.com/docs/en/plugins
- Plugins reference: https://code.claude.com/docs/en/plugins-reference
- Hooks reference: https://code.claude.com/docs/en/hooks
- Best practices: https://code.claude.com/docs/en/best-practices
- How Claude Code works: https://code.claude.com/docs/en/how-claude-code-works
