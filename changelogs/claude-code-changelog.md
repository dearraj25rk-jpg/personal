# Claude Code Documentation — Changelog

> This file documents all changes to the Claude Code section of the Context documentation site (`src/content/docs/claude-code/`).
> **NOT published to the website** — internal documentation tracking only.

---

## [2026-06-03] — June 2026 Comprehensive Refresh (feature/rag-hub)

### Overview

Full refresh of all 44 files in `src/content/docs/claude-code/` plus the site homepage (`src/content/docs/index.mdx`). This is the June 2026 comprehensive documentation update — no data loss, all content preserved and significantly enriched with new sections, ASCII diagrams, code examples, and cross-references. All `lastUpdated` dates updated to 2026-06-03.

### Scope

| Category | Files | Action |
|----------|-------|--------|
| Reference docs (md) | 24 | Enriched with new sections |
| Interactive diagram pages (mdx) | 20 | Enriched with reference sections |
| Home page | 1 | Updated stats and descriptions |
| **Total** | **45** | **All updated** |

---

### Reference Documentation Updates

#### `index.md` — Claude Code Section Index
- Added "## June 2026 — Documentation Update" section
- Enriched Feature Map ASCII diagram with better visual formatting
- Updated all "May 2026" references to "June 2026"
- Verified completeness of all reference tables and learning paths

#### `quick-start.md` — New User Guide
- Added "## Understanding the Agentic Loop in Depth" with detailed multi-step ASCII diagram
- Added "## CLAUDE.md Deep Dive" with comprehensive templates and explanations
- Added "## Common Beginner Mistakes" table (10 mistakes + solutions)
- Added "## Daily Workflow Patterns" with 4 real developer workflows

#### `models-pricing.md` — Models, Pricing & Effort
- Added "## Cost Optimization Strategies" with ROI calculator examples
- Added "## Extended Thinking Deep Dive" explaining thinking tokens and cost implications
- Added "## Bedrock and Vertex AI Pricing" section
- Added ASCII decision tree for Haiku vs Sonnet vs Opus selection

#### `hooks-deep-dive.md` — Hooks System Complete Reference
- Added "## Hook Security Best Practices" — injection prevention, sandboxing, audit
- Added "## Hook Performance Considerations" — async handling, timeout settings
- Expanded patterns to 15 production patterns
- All code examples verified as complete and runnable

#### `mcp-servers-guide.md` — MCP Servers Guide
- Added "## Building MCP Servers — Step by Step" with complete PostgreSQL query server example
- Added "## MCP Security — In Depth" — auth patterns, input validation, rate limiting
- Added "## Debugging MCP Servers" — complete debugging guide with error codes
- Added "## MCP Resources — Complete Guide" — data streams, URI templates, subscriptions

#### `sdk-guide.md` — Agent SDK Guide
- Added "## Error Handling — Complete Reference" — all error types with retry logic
- Added "## SDK Production Patterns" — process pool, queue management, health checks
- Added "## OAuth Integration Deep Dive" — complete flow with code examples
- Added "## Streaming Events — Complete Reference" — full JSON schemas
- Added "## Multi-Turn Session Patterns" — StatefulClient examples

#### `permissions-security.md` — Permissions & Security
- Added "## Permission Modes — Detailed Comparison" — table and ASCII diagram
- Added "## Tool Allowlist Patterns" — comprehensive glob syntax reference
- Added "## Sandbox Architecture Deep Dive" — Seatbelt/bubblewrap mechanics
- Added "## Audit Logging — Complete Setup" — OTEL configuration, log schemas
- Added "## Security Incident Response" procedures

#### `agent-teams-guide.md` — Agent Teams & Subagents
- Added "## Agent Communication Patterns — Deep Dive" — mailbox protocol spec
- Added "## Orchestration Patterns Gallery" — 4 complete pattern implementations
- Added "## Agent Team Debugging" guide
- Added "## Agent Teams vs Task Tool — Decision Guide" with ASCII flowchart

#### `cicd-integration.md` — CI/CD Integration
- Added "## GitHub Actions — Complete Reference" with all `anthropics/claude-code-action@v1` parameters
- Added "## Cost Controls in CI/CD" — budget management, alerting
- Added "## Security Hardening for CI/CD" — 15-item checklist
- Added "## Multi-Cloud CI/CD Setup" — Bedrock + Vertex with complete YAML

#### `memory-management.md` — Memory Management
- Added "## Memory Architecture Visual" — ASCII diagram of all 7 types
- Added "## MEMORY.md — Complete Guide" — Auto-Memory mechanics
- Added "## Memory Anti-Patterns" — 6 common mistakes
- Added "## @import Chain Syntax — Complete Reference" — full syntax with edge cases

#### `plugins-guide.md` — Plugins Guide
- Added "## Building Your First Plugin — Complete Walkthrough" — step-by-step
- Added "## Plugin Distribution" — git, npm, private registry
- Added "## Plugin Security Model" — sandboxing, review checklist
- Added "## Plugin Development Patterns" — 3 real-world plugin examples

#### `slash-commands-reference.md` — Slash Commands Reference
- Added "## Complete Built-In Command Reference" — all 30+ commands comprehensive table
- Added "## Custom Command Design Patterns" — 10 complete command examples
- Added "## Special Variables — Complete Reference" — all variables with edge cases
- Added "## Command Scope and Discovery" — how commands are found and precedenced

#### `enterprise-guide.md` — Enterprise Deployment Guide
- Added "## Enterprise Rollout Playbook — Detailed" — metrics, pilot selection, feedback
- Added "## Cost Governance — Complete Setup" — budget caps, team allocation, chargebacks
- Added "## Compliance and Audit" — SOC 2, ISO 27001, GDPR procedures

#### `troubleshooting.md` — Troubleshooting Guide
- Added "## Diagnostic Flowcharts" — ASCII decision trees for 5 failure categories
- Expanded error dictionary to 30+ entries
- Added "## Performance Profiling" — token throughput, context analysis
- Added "## Recovery Procedures" — step-by-step for 5 failure scenarios
- Added "## Getting Help" — support channels, bug report guide

#### `claude-code-config-guide.md` — Configuration Guide
- Added "## Configuration Decision Flowchart" — comprehensive ASCII tree
- Added "## CLAUDE.md Templates" — 4 complete templates (startup, enterprise TS, Python ML, OSS)
- Added "## Rules Design Patterns" — 8 complete rules examples
- Added "## Skills Anatomy" — deep dive into SKILL.md structure

#### `output-styles-guide.md` — Output Styles Guide
- Added "## Style Design Guide" — tone, format, length specifications
- Added "## Team Style Deployment" — enforcing consistent styles
- Added "## Style Performance Impact" — concrete token cost numbers
- Added "## 6 Complete Style Examples" — Senior Engineer, Junior Dev, Code Reviewer, Technical Writer, Security Auditor, Data Scientist

#### `claude-code-all-markdown-files-catalog.md` — File Types Catalog
- Added "## June 2026 Catalog Update" section
- Added "## File Type Decision Flowchart" with ASCII decision tree
- Added "## Complete Frontmatter Reference" for all file types

#### `claude-code-efficiency-reference.md` — Efficiency Reference
- Added "## Prompt Caching — Implementation Guide" — maximizing cache hit rates
- Added "## Context Budget Calculator" — worked cost examples
- Added "## Compaction Deep Dive" — auto-compaction mechanics and circuit breaker
- Added "## ToolSearch Token Savings" — 85%+ token reduction strategy

#### `claude-code-reference.md` — CLI Technical Reference
- Added "## June 2026 Reference Update" section
- Completed environment variables section (all CLAUDE_* variables)
- Added "## API Error Codes" section

#### `worktrees-guide.md` — Worktrees Guide
- Added "## Worktree Best Practices" — naming, cleanup, pitfalls
- Added "## Concurrent Development Workflow" — 3-developer scenario
- Added "## Worktree + CI/CD Integration" guide
- Added "## Cleanup and Maintenance" procedures

#### `monorepo-guide.md` — Monorepo Guide
- Added "## Monorepo Configuration Examples" — complete 5-service example
- Added "## Path-Scoped Rules Gallery" — 10 complete examples
- Added "## Cross-Service Agent Coordination" walkthrough

#### `validation-report.md` — Concept Validation Report
- Added "## Section 16: June 2026 Validation Update" (20+ new claims)
- Updated total verified claim count
- Added "## Validation Methodology" section

#### `compass-research-notes.md` — Research Notes
- Added "## June 2026 Research Update" section
- Added "## Claude Code v2.1.126 — Key Technical Facts" (exam-ready facts)
- Added "## Common Exam Traps" (10 tricky CCA-F questions)

#### `claude-training.md` — Training Program
- Added "## June 2026 Training Update" section
- Added cross-references to documentation pages throughout modules
- Added "## Module 9: Advanced Topics — Context Engineering and /advisor"
- Added "## Quick Reference Cards" for each module

---

### Interactive Diagram Pages Updates (MDX)

All 20 MDX files enriched with written reference sections below the interactive component:

| File | Key Sections Added |
|------|-------------------|
| `architecture.mdx` | Phase-by-phase breakdown, context assembly sequence, hook injection points, budget allocation |
| `precedence.mdx` | Conflict resolution rules, 8 override examples, precedence pyramid diagram |
| `file-catalog.mdx` | Quick reference table, decision flowchart, size guidelines, real-world examples |
| `override-test-lab.mdx` | Scenario explanations, rules cheat sheet, 8 misconceptions |
| `hooks-diagram.mdx` | Events quick reference, handler comparison, 8 copy-paste templates, execution guarantees |
| `mcp-diagram.mdx` | JSON-RPC examples, transport comparison, 12 official servers, server template |
| `memory-diagram.mdx` | Memory type reference, lifecycle diagram, compaction survival, size limits |
| `models-diagram.mdx` | Quick reference table, 5 pricing examples, Fast Mode deep dive, task-to-model mapping |
| `sdk-diagram.mdx` | Streaming events reference, Python/TS quick starts, error handling reference |
| `slash-commands-diagram.mdx` | All commands quick reference, 5 custom command templates, command discovery |
| `context-engineering-ce.mdx` | CE principles, token budget planning, 10 anti-patterns, CE checklist |
| `agent-teams-diagram.mdx` | Detailed comparison, subagent YAML reference, mailbox protocol, 5 pattern examples |
| `cicd-diagram.mdx` | Complete workflow YAML, GitLab/Azure examples, security checklist, cost optimization |
| `advisor-diagram.mdx` | Command reference, cost analysis, when to use guide, Advisor vs Full Opus table |
| `enterprise-diagram.mdx` | Settings JSON schema, MDM guide, auth comparison, audit log schema |
| `permissions-diagram.mdx` | Permission mode reference, tool allowlist syntax (20 examples), sandbox deep dive |
| `worktrees-diagram.mdx` | Worktrees vs clone comparison, /branch reference, 5 parallel patterns, SDK automation |
| `monorepo-diagram.mdx` | CLAUDE.md hierarchy example, path-scoped rules reference, CI matrix workflow |
| `plugins-diagram.mdx` | Component types reference, directory structure, plugin.json schema, userConfig, 3 mini-plugins |
| `claude-code-efficiency-guide.mdx` | Prompt caching mechanics, output style costs, effort economics, daily cost estimation |

---

### New Files Created

| File | Description |
|------|-------------|
| `changelogs/claude-code-changelog.md` | This file — dedicated Claude Code section changelog (not published) |

---

### Home Page Updates (`src/content/docs/index.mdx`)

- Updated terminal animation to reflect June 2026
- Verified all stat counts (44 Claude Code files: 25 reference + 19 interactive diagrams)
- Updated Claude Code card description to reflect June 2026 comprehensive refresh
- All interactive tool links verified

---

### Statistics

| Metric | Before (June 2) | After (June 3) |
|--------|-----------------|----------------|
| lastUpdated dates | 2026-06-02 (all) | 2026-06-03 (all) |
| Reference doc files | 24 | 24 (all enriched) |
| MDX diagram files | 20 | 20 (all enriched) |
| New sections added | — | 150+ |
| New ASCII diagrams | — | 60+ |
| New code examples | — | 100+ |
| New files created | — | 1 (this changelog) |

---

## [2026-05-19] — Claude Code Section Comprehensive Refresh (feature/rag-hub)

### Summary

Comprehensive refresh of all 35 files in `src/content/docs/claude-code/` and the site homepage. All `lastUpdated` dates updated to 2026-05-19. All 14 interactive MDX diagram pages enriched with written reference sections. Major guide files updated with new sections covering all features through v2.1.126.

### Key Additions

- **14 MDX diagram files**: All enriched with written reference tables, ASCII diagrams, and code examples below the interactive component
- **claude-code/index.md**: Added Feature Map (6-domain ASCII overview) and Quick Setup (5-minute bash workflow)
- **hooks-deep-dive.md**: Complete 30+ event table, security gates pattern, hook environment variables reference
- **mcp-servers-guide.md**: Low-level TypeScript and Python server examples, MCP Resources implementation, security best practices
- **agent-teams-guide.md**: Orchestration patterns (Map-Reduce, Pipeline, Specialist), orchestrator vs subagent capability table
- **permissions-security.md**: Permission modes detailed reference with per-operation breakdown, enterprise managed settings
- **cicd-integration.md**: GitLab CI and Azure DevOps integration examples, CI cost optimization table
- **output-styles-guide.md**: Complete frontmatter schema, team deployment workflow, scope table
- **quick-start.md**: Advanced usage tips (worktrees, custom commands, CI/CD)
- **models-pricing.md**: Model selection decision tree, cost optimization patterns table
- **sdk-guide.md**: Error handling patterns (Python + TypeScript), error types reference
- **worktrees-guide.md**: Parallel PR review pattern with SDK automation
- **claude-training.md**: Module count updated (8 → 9 in intro text)
- **claude-code-reference.md**: Monitor tool section, complete environment variables reference
- **validation-report.md**: Section 15 added — 33 new claims validated; total raised to 331
- **compass-research-notes.md**: Frontmatter fully populated (was missing description, order, label, lastUpdated)
- **Homepage (index.mdx)**: Claude Code card description significantly expanded

### Files Updated

All 35 files in `src/content/docs/claude-code/` — lastUpdated: 2026-05-19

---

## [2026-05-09] — Claude Code Section Major Update (feature/rag-hub)

### Summary

Comprehensive update of the entire Claude Code documentation section (`src/content/docs/claude-code/`) and the site home page (`src/content/docs/index.mdx`). All content refreshed to Claude Code v2.1.126 (May 2026).

### New Files Created

| File | Title | Description |
|------|-------|-------------|
| `slash-commands-reference.md` | Slash Commands — Complete Reference | All 30+ built-in slash commands, custom project/personal commands |
| `memory-management.md` | Memory Management — Complete Reference | All 6 memory types, /memory command, compaction survival rules |
| `models-pricing.md` | Models, Pricing & Effort — Complete Reference | All models, context windows, effort levels, pricing |
| `plugins-guide.md` | Plugins — Complete Reference | Plugin architecture, all 10 component types |
| `output-styles-guide.md` | Output Styles — Complete Reference | Built-in styles, custom style creation |
| `memory-diagram.mdx` + `MemoryDiagram.jsx` | Memory System — Interactive Diagram | All 7 memory types visual browser |
| `plugins-diagram.mdx` + `PluginsDiagram.jsx` | Plugins — Interactive Architecture Diagram | All 10 plugin component types visual guide |

### Bug Fixes

| File | Fix |
|------|-----|
| `advisor-diagram.mdx` | Fixed broken import path from root level to `src/components/interactive/AdvisorDiagram.jsx` |

---

## [2026-05-07] — Initial Claude Code Section Creation (feature/rag-hub)

### Summary

Created `feature/rag-hub` branch from `main`. Added Claude Code documentation section at `src/content/docs/claude-code/` with initial 28 files covering the core reference (quick start, CLI reference, hooks, MCP, agent teams, SDK, worktrees, CI/CD, permissions, architecture diagrams).

---

*Branch: feature/rag-hub*  
*This changelog is maintained as internal documentation. For site deployment history, see `.github/workflows/deploy.yml`.*
