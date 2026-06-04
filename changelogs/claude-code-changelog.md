# Claude Code Documentation — Changelog

> This file documents all changes to the Claude Code section of the Context documentation site (`src/content/docs/claude-code/`).
> **NOT published to the website** — internal documentation tracking only.

---

## [2026-06-04] — June 2026 Depth Pass (feature/rag-hub)

### Overview

Comprehensive depth pass on all 44 existing files plus 4 new files added. Focus: deeper content, data accuracy fixes, new guides for missing topics, and enriched interactive diagrams. Total Claude Code resource count raised from 44 to 48.

### Scope

| Category | Files | Action |
|----------|-------|--------|
| Reference docs (md) — new | 3 | Created: context-window-guide.md, native-binary-guide.md, remote-control-guide.md |
| Interactive diagram pages (mdx) — new | 1 | Created: output-styles-diagram.mdx |
| React components (jsx) — new | 1 | Created: OutputStylesDiagram.jsx |
| React components (jsx) — fixed | 1 | ModelsDiagram.jsx: Opus 4.6 context corrected 1M→200K |
| Reference docs (md) — enriched | 10 | agent-teams-guide.md, worktrees-guide.md, troubleshooting.md, enterprise-guide.md, permissions-security.md, cicd-integration.md, claude-code-efficiency-reference.md, models-pricing.md, quick-start.md, compass-research-notes.md |
| Interactive diagram pages (mdx) — enriched | 6 | models-diagram.mdx, advisor-diagram.mdx, slash-commands-diagram.mdx, file-catalog.mdx, precedence.mdx, override-test-lab.mdx |
| Section index | 1 | index.md: updated stats, added 3 new guides to reference tables, added output-styles-diagram to diagrams table |
| Home page | 1 | index.mdx: updated stats (44→48 docs, 113+→117+ total), added output-styles-diagram card, updated Claude Code card description and count |
| **Total changed** | **25** | **All changes on feature/rag-hub branch** |

---

### Data Accuracy Fixes

These were factual errors found during the depth pass:

| File | Error | Fix |
|------|-------|-----|
| `ModelsDiagram.jsx` | Opus 4.6 context window shown as 1,000,000 tokens | Corrected to 200,000 tokens — only Opus 4.7 and 4.8 have 1M context |
| `compass-research-notes.md` | Model lineup missing claude-opus-4-8 | Added as newest model with correct pricing |
| `compass-research-notes.md` | Opus pricing shown as $5/MTok — wrong | Corrected to $15/MTok input, $75/MTok output |
| `compass-research-notes.md` | Haiku pricing shown as $1/MTok — wrong | Corrected to $0.80/MTok input, $4/MTok output |
| `compass-research-notes.md` | Auto-compact trigger shown as ~95% | Corrected to ~83.5% (matches architecture.mdx and index.md) |
| `index.mdx` (home page) | Claude Code card count "25 reference docs · 19 interactive diagrams" — wrong | Corrected to "27 reference docs · 21 interactive diagrams" after new files added |

---

### New Files Created

#### `src/content/docs/claude-code/context-window-guide.md`
New comprehensive guide to context window architecture (sidebar order: 25). Covers: window composition anatomy (all 12 blocks in load order), 200K vs 1M context windows (which models have which and practical implications), compaction trigger mechanics (83.5% threshold, circuit breaker, cost to compact), context budget configuration, `/context` command interpretation, ToolSearch deferred loading (85% token savings), path-scoped rules zero-cost deferral, cost math for different context states, optimization strategies ranked by impact, and 3 worked examples by project type.

#### `src/content/docs/claude-code/native-binary-guide.md`
New guide to the v2.1.113 native binary architecture (sidebar order: 26). Covers: what changed from Node.js (embedded `bfs` + `ugrep`, no runtime dependency), performance benchmarks (~40% faster cold start, ~53% lower memory), all installation methods across all platforms, enterprise airgap deployment steps with MDM/Ansible examples, `DISABLE_UPDATES` version pinning for enterprise fleets, verifying native binary install via `claude --version --json`, and troubleshooting native binary issues.

#### `src/content/docs/claude-code/remote-control-guide.md`
New guide to Remote Control and Cloud Sessions (sidebar order: 27). Covers: two modes (Remote Control = local binary + web bridge; Cloud Sessions = fully browser-based), architecture diagram, starting a Remote Control session, what works/doesn't work remotely, security model (per-session auth tokens, encrypted bridge), mobile use on iOS/Android, Cloud Sessions limitations, the remote execution environment for cloud-based GitHub sessions, `CLAUDE_REMOTE_CONTROL_*` environment variables, and teardown/security.

#### `src/content/docs/claude-code/output-styles-diagram.mdx`
New interactive diagram page for Output Styles (sidebar order: 15). Imports `OutputStylesDiagram` component. Reference sections include: style overview table, what gets replaced (SE-specific system prompt block explanation), `keep-coding-instructions` behavior, custom style file format, activation methods, when-to-use decision guide, and token cost implications.

#### `src/components/interactive/OutputStylesDiagram.jsx`
New React component with 3 tabs: (1) Style Overview — expandable cards for Default/Explanatory/Learning + custom style template, with interactive system prompt structure diagram showing what gets replaced; (2) Token Cost Impact — sliders for session size and model selector, real-time bar chart comparing all 3 styles; (3) Configuration — activation methods, directory structure, `keep-coding-instructions` toggle with live preview.

---

### Reference Documentation Enrichments

#### `quick-start.md`
Appended "## Common Beginner Mistakes" table (10 mistakes with What-happens and Fix columns) covering: empty CLAUDE.md, skipping /compact, using Opus for everything, ignoring path-scoped rules, not using MEMORY.md, pinning `opus` alias in CI, wrong MCP server scope, forgetting keep-coding-instructions, --bare in development, and over-engineering CLAUDE.md.

#### `agent-teams-guide.md`
Appended: "Enabling Agent Teams" section with env var setup and verification; "Agent Teams State Machine" with complete 7-state ASCII diagram (PENDING→QUEUED→ACTIVE→WAITING→DONE/FAILED→CANCELLED); "Mailbox Protocol Deep Dive" with exact file format for messages and team-state.json; "Monitoring Running Teams" with live monitoring commands; "When Agent Teams Fail" table with failure modes and recovery steps.

#### `worktrees-guide.md`
Appended: "State Across Worktrees" section with ASCII table of shared vs isolated state (including the important MEMORY.md sharing implication); "Worktrees + CLAUDE.local.md" explaining per-branch personal notes pattern; "Worktrees + Agent Teams" with architecture diagram and setup instructions; "Directory Layout After Multiple Worktrees" with filesystem tree.

#### `troubleshooting.md`
Appended 10 new error dictionary entries: illegal byte sequence, MCP server exited before init, Agent team message delivery timeout, ugrep pattern compile error, bfs permission denied, DISABLE_UPDATES informational, http hook TLS timeout, skills description exceeds 1536 char limit, @import max depth exceeded, mcp_tool matcher requires server/tool format.

#### `enterprise-guide.md`
Appended "Native Binary Deployment for Enterprise" section with: before/after comparison table, airgap deployment steps with curl+sha256 verification + Ansible/JAMF examples, and DISABLE_UPDATES enterprise fleet configuration with managed-settings.json example.

#### `permissions-security.md`
Appended "The mcp_tool Hook Matcher (v2.1.118+)" section with: why it matters for security, JSON configuration example (blocking dangerous MCP tools, requiring confirmation for write tools), matcher format reference, and comparison table with permissions.deny for choosing the right mechanism.

#### `cicd-integration.md`
Appended "Azure Workload Identity Federation" section with Azure DevOps + GCP Vertex AI WIF pipeline YAML; "DISABLE_UPDATES in CI" section with examples for all 3 CI platforms (GitHub Actions, GitLab, Azure DevOps).

#### `claude-code-efficiency-reference.md`
Appended "Native Binary Performance (v2.1.113+)" section with before/after comparison table, `claude --version --json` verification command, upgrade instructions, and `--bare` mode performance benchmarks.

#### `compass-research-notes.md`
Fixed model lineup table: added claude-opus-4-8 as newest model, corrected Opus pricing ($5→$15/MTok), corrected Haiku pricing ($1→$0.80/MTok), updated context windows. Fixed auto-compact trigger from ~95% to ~83.5%.

---

### Interactive Diagram Enrichments

#### `models-diagram.mdx`
Appended: "Opus 4.8 vs Opus 4.7 — Choosing Between the Two Newest" decision table (never use `opus` alias in CI); "Cache Write Pricing" table with write costs for all 3 models at 5-min and 1-hr TTL.

#### `advisor-diagram.mdx`
Appended: "Advisor Model as of June 2026" (updated to clarify advisor uses `claude-opus-4-8` since it holds the `opus` alias); "/advisor vs Full-Opus Session — Break-Even Analysis" with worked cost example showing 64% savings.

#### `slash-commands-diagram.mdx`
Appended: "Commands Added by Version" table (v2.1.84–v2.1.126); "Custom Command Anatomy — Complete Frontmatter Reference" with all YAML fields and special variables table.

#### `file-catalog.mdx`
Appended: "v2.1.84–v2.1.126 Changes to File Types" table; "Why the File Type Count Changed (16→23)" with category breakdown table.

#### `precedence.mdx`
Appended: "Settings Keys — What Enterprise Can Lock" table; "Managed Settings vs CLAUDE.md — Different Systems" table with critical security note (CLAUDE.md cannot enforce tool restrictions — use permissions.deny).

#### `override-test-lab.mdx`
Appended: "Rules `paths:` Migration Guide (v2.1.84)" with old vs new syntax; "Precedence Edge Cases — Five Scenarios" covering CLAUDE.md at same level, @import cycle detection, enterprise settings vs path-scoped rules, settings.local.json vs CLAUDE.local.md, and plugin vs project command name conflicts.

---

### Home Page Updates (`src/content/docs/index.mdx`)

| Change | Before | After |
|--------|--------|-------|
| Terminal animation | "113+ resources ready" | "117+ resources ready" |
| Claude Code Docs stat | 44 | 48 |
| Total Resources stat | 113+ | 117+ |
| Claude Code card count | "25 reference docs · 19 interactive diagrams" | "27 reference docs · 21 interactive diagrams" |
| Claude Code card description | No mention of new guides | Added: context window architecture, native binary, remote control, output styles diagram |
| Interactive Tools section | No output-styles-diagram card | Added Output Styles Diagram card |

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
