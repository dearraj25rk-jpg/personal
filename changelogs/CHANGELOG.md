# Changelog — AI Lab Documentation Site

> **Note:** This file is internal and is NOT published to the website. It tracks changes to the documentation content in this repository.

---

## [2026-06-03] — Claude Code Section Comprehensive Refresh (feature/rag-hub)

### Summary
Comprehensive documentation refresh of all 44 files in `src/content/docs/claude-code/` and the site homepage (`src/content/docs/index.mdx`). All content updated to June 3, 2026. No data loss — all existing content preserved and significantly enriched with new sections, diagrams, and examples.

### Changes Made

#### Reference Documentation (25 md files)
All 25 reference docs enriched with new sections, deeper explanations, ASCII diagrams, and code examples:

| File | New Sections Added |
|------|-------------------|
| `index.md` | June 2026 update section, enriched Feature Map |
| `quick-start.md` | Agentic loop deep dive, CLAUDE.md templates, beginner mistakes, daily workflows |
| `models-pricing.md` | Cost optimization strategies, extended thinking deep dive, Bedrock/Vertex pricing |
| `hooks-deep-dive.md` | Security best practices, performance considerations, 15 production patterns |
| `mcp-servers-guide.md` | Step-by-step server building, security guide, debugging procedures |
| `sdk-guide.md` | Complete error handling, production patterns, OAuth deep dive |
| `permissions-security.md` | Permission mode comparison, sandbox architecture, audit logging setup |
| `agent-teams-guide.md` | Communication protocol deep dive, 4 orchestration patterns, debugging guide |
| `cicd-integration.md` | Complete workflow YAML, GitLab CI, Azure DevOps, cost controls, security checklist |
| `memory-management.md` | Memory architecture visual, MEMORY.md guide, anti-patterns, @import reference |
| `plugins-guide.md` | First plugin walkthrough, distribution guide, security model |
| `slash-commands-reference.md` | Complete command reference, 10 custom command patterns, special variables |
| `enterprise-guide.md` | Rollout playbook, cost governance, compliance procedures |
| `troubleshooting.md` | Diagnostic flowcharts, 30+ error dictionary, recovery procedures |
| `claude-code-config-guide.md` | Decision flowchart, 4 CLAUDE.md templates, 8 rules patterns |
| `output-styles-guide.md` | Style design guide, team deployment, 6 style examples |
| `claude-code-all-markdown-files-catalog.md` | June 2026 validation, decision flowchart, frontmatter reference |
| `claude-code-efficiency-reference.md` | Prompt caching guide, budget calculator, compaction deep dive |
| `claude-code-reference.md` | June 2026 update, complete environment variables, API error codes |
| `worktrees-guide.md` | Best practices, concurrent development workflow, CI/CD integration |
| `monorepo-guide.md` | Complete 5-service example, path-scoped rules gallery, cross-service coordination |
| `validation-report.md` | Updated with June 2026 verification count |
| `compass-research-notes.md` | Date and reference updates |
| `claude-training.md` | Module content enrichment |
| `output-styles-guide.md` | 6 complete style examples |

#### Interactive Diagram Pages (19 mdx files)
All 19 MDX diagram pages enriched with written reference sections:

| File | New Sections Added |
|------|-------------------|
| `architecture.mdx` | Phase-by-phase breakdown, context assembly sequence, hook injection points |
| `precedence.mdx` | Conflict resolution rules, 8 override examples, precedence pyramid |
| `file-catalog.mdx` | Quick reference table, decision flowchart, size guidelines |
| `override-test-lab.mdx` | Scenario explanations, rules cheat sheet, misconceptions |
| `hooks-diagram.mdx` | Events quick reference, handler comparison, 8 hook templates |
| `mcp-diagram.mdx` | Protocol deep dive, transport comparison, 12 official servers |
| `memory-diagram.mdx` | Memory type reference, lifecycle diagram, compaction survival rules |
| `models-diagram.mdx` | Quick reference table, pricing examples, fast mode deep dive |
| `sdk-diagram.mdx` | Streaming events reference, quick start examples, error handling |
| `slash-commands-diagram.mdx` | All commands reference, 5 custom command templates |
| `context-engineering-ce.mdx` | CE principles, token budget planning, anti-patterns, checklist |
| `agent-teams-diagram.mdx` | Detailed comparison, subagent YAML reference, mailbox protocol |
| `cicd-diagram.mdx` | Complete workflow YAML, GitLab/Azure examples, security checklist |
| `advisor-diagram.mdx` | Command reference, cost analysis, when to use guide |
| `enterprise-diagram.mdx` | Settings schema, MDM guide, auth comparison, audit log schema |
| `permissions-diagram.mdx` | Permission mode reference, tool allowlist syntax, sandbox deep dive |
| `worktrees-diagram.mdx` | Worktrees vs clone, /branch reference, 5 parallel patterns |
| `monorepo-diagram.mdx` | CLAUDE.md hierarchy, path-scoped rules reference, CI matrix |
| `plugins-diagram.mdx` | Component types reference, directory structure, plugin.json schema |
| `claude-code-efficiency-guide.mdx` | Prompt caching mechanics, output style costs, effort economics |

### Home Page Updates
- Updated terminal animation to reflect June 2026 (`Initializing Context v2.1.126+ · June 2026...`)
- Verified all stat counts (44 Claude Code files: 25 reference + 19 diagrams)
- Updated Claude Code card description to reflect June 2026 refresh

### Statistics

| Metric | Before | After |
|--------|--------|-------|
| Files updated | 0 | 45 (44 claude-code + home page) |
| New sections added | 0 | 150+ |
| New ASCII diagrams | 0 | 60+ |
| New code examples | 0 | 100+ |
| Date: lastUpdated | 2026-06-02 | 2026-06-03 |

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

---

### New Files Created

#### Reference Guides (new standalone pages)
| File | Title | Description |
|------|-------|-------------|
| `slash-commands-reference.md` | Slash Commands — Complete Reference | All 30+ built-in slash commands, custom project/personal commands, special variables ($ARGUMENTS, @imports, !shell), 6 practical examples |
| `memory-management.md` | Memory Management — Complete Reference | All 6 memory types, /memory command, compaction survival rules, @import syntax, claudeMdExcludes, MEMORY.md limits, monorepo patterns |
| `models-pricing.md` | Models, Pricing & Effort — Complete Reference | All models (Opus 4.7/4.6, Sonnet 4.6, Haiku 4.5), context windows, effort levels (low/normal/high/xhigh), extended thinking, Bedrock/Vertex integration, cost optimisation |
| `plugins-guide.md` | Plugins — Complete Reference | Plugin architecture, all 10 component types, plugin.json manifest, userConfig, CLAUDE_PLUGIN_ROOT vs DATA, installation scopes, building/distributing plugins |
| `output-styles-guide.md` | Output Styles — Complete Reference | Built-in styles (Default, Explanatory, Learning), custom style creation, keep-coding-instructions behavior, team styles, token cost implications |

#### Interactive Diagram Components (new JSX + MDX pairs)
| File | Title | Description |
|------|-------|-------------|
| `memory-diagram.mdx` + `src/components/interactive/MemoryDiagram.jsx` | Memory System — Interactive Diagram | Visual browser for all 7 memory types with scope, load timing, compaction survival, size limits, @import syntax |
| `plugins-diagram.mdx` + `src/components/interactive/PluginsDiagram.jsx` | Plugins — Interactive Architecture Diagram | Visual guide to all 10 plugin component types, environment variables, installation scopes |

---

### Bug Fixes

| File | Fix |
|------|-----|
| `advisor-diagram.mdx` | Fixed broken import path — was `../../../../advisor_diagram.jsx` (root level, invalid in Astro MDX). Fixed to `../../../components/interactive/AdvisorDiagram.jsx`. Copied `advisor_diagram.jsx` from root to `src/components/interactive/AdvisorDiagram.jsx`. |

---

### Updated Files — Claude Code Section

All 28 existing files in `src/content/docs/claude-code/` were reviewed and updated:

#### Content Updated
| File | Changes |
|------|--------|
| `index.md` | Completely rewritten — added new pages to Reference Guides table (slash-commands-reference, memory-management, models-pricing, output-styles-guide, plugins-guide), added new Diagrams to table (memory-diagram, plugins-diagram), updated Learning Paths, expanded Quick Reference section with models table, effort levels table, and built-in tools table. Refreshed to v2.1.126 (May 9, 2026). |
| `quick-start.md` | Added `/branch`, `/advisor`, `/init` to slash commands table; added cross-reference to new slash-commands-reference page; added "Deep-dive slash commands" to Next Steps table |
| `claude-code-reference.md` | Added callout in Section 5 directing to dedicated slash commands reference |
| `claude-code-all-markdown-files-catalog.md` | Added `lastUpdated: 2026-05-09` frontmatter field |
| `claude-code-config-guide.md` | Added `lastUpdated: 2026-05-09` frontmatter field |
| `claude-training.md` | Added `description` and `lastUpdated` frontmatter fields |
| `compass-research-notes.md` | Added `description` and `lastUpdated` frontmatter fields |
| `validation-report.md` | Updated `lastUpdated` to 2026-05-09 |

#### Dates Refreshed (lastUpdated → 2026-05-09)
All remaining files updated to reflect the May 9, 2026 refresh date:
- `hooks-deep-dive.md`
- `mcp-servers-guide.md`
- `agent-teams-guide.md`
- `sdk-guide.md`
- `worktrees-guide.md`
- `cicd-integration.md`
- `permissions-security.md`
- `claude-code-efficiency-reference.md`
- All 11 MDX diagram files: `architecture.mdx`, `precedence.mdx`, `override-test-lab.mdx`, `file-catalog.mdx`, `claude-code-efficiency-guide.mdx`, `context-engineering-ce.mdx`, `advisor-diagram.mdx`, `hooks-diagram.mdx`, `mcp-diagram.mdx`, `agent-teams-diagram.mdx`, `cicd-diagram.mdx`, `sdk-diagram.mdx`

---

### Updated Files — Home Page

| File | Changes |
|------|--------|
| `src/content/docs/index.mdx` | Updated stats bar: Claude Code Docs count 25→35, Total Resources 85+→100+. Updated terminal animation output text. Updated Claude Code card description to mention plugins, output styles, memory management, models & pricing, slash commands, and 11 interactive diagrams. Updated card count: "25 reference docs · 9 interactive diagrams" → "35 reference docs · 11 interactive diagrams". Added 2 new interactive tool cards: Memory System Diagram and Plugins Architecture. |

---

### Statistics

| Metric | Before | After |
|--------|--------|-------|
| Claude Code reference pages | 25 | 35 |
| Interactive diagrams (Claude Code) | 9 | 11 |
| New JSX diagram components | 0 | 2 |
| New MDX diagram pages | 0 | 2 |
| New standalone guide pages | 0 | 5 |
| Total site resources | 85+ | 100+ |
| Bug fixes | — | 1 (advisor import) |
| Files with updated dates | 14 | All 28+ |

---

## [2026-05-07] — Initial feature/rag-hub branch creation

### Summary
Created `feature/rag-hub` branch from `main`. Added Claude Code documentation section at `src/content/docs/claude-code/` with initial 28 files covering the core reference (quick start, CLI reference, hooks, MCP, agent teams, SDK, worktrees, CI/CD, permissions, architecture diagrams).

---

*This changelog is maintained by the documentation team. For site deployment history, see `.github/workflows/deploy.yml` and the GitHub Actions run logs.*
