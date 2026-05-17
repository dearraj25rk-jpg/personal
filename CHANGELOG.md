# Changelog

All notable changes to this AI Lab documentation site are recorded here.
This file is **not published on the website** — it is for internal tracking only.

---

## [feature/rag-hub] — 2026-05-17

### Summary

Major content refresh of the entire Claude Code documentation section (`src/content/docs/claude-code/`). All 35 files updated with deeper content, ASCII diagrams, more code examples, and improved explanatory text. Home page stats and card descriptions updated. No content was removed — all existing content was preserved and expanded.

---

### What Changed

#### Claude Code Section — All 21 Markdown/MDX Files Updated

**Core Reference Files:**

| File | Changes |
|------|---------|
| `index.md` | Added visual architecture overview diagram, improved quick reference tables, expanded learning paths, added "choosing the right tool" section |
| `quick-start.md` | Added installation decision tree diagram, REPL first-session walkthrough, CLAUDE.md effectiveness diagram, 10 most-common first-week mistakes section, expanded tool anti-patterns |
| `claude-code-reference.md` | Added quick-navigation box, ASCII feature-category overview, version history callouts, troubleshooting reference section |
| `claude-code-all-markdown-files-catalog.md` | Added visual load-order timeline, decision flowchart for file type selection, complete attributes reference tables, anti-patterns section, enterprise configuration patterns |
| `claude-code-config-guide.md` | Added comprehensive ASCII decision tree (CLAUDE.md vs Rules vs Skills vs Commands vs Output Styles), token budget breakdown, monorepo and enterprise configuration patterns, migration guide |
| `claude-code-efficiency-reference.md` | Added ASCII token budget visualization, context window breakdown diagram, prompt caching calculation examples with before/after costs, context management playbook, auto vs manual compaction decision guide |

**Topic Guides:**

| File | Changes |
|------|---------|
| `hooks-deep-dive.md` | Added complete hook events table organized by category, full hook execution lifecycle flowchart, handler type comparison diagram, security gates pattern with full code example, "common hook mistakes" section, expanded to 12+ practical patterns |
| `mcp-servers-guide.md` | Added ASCII Host→Client→Server architecture diagram, detailed stdio vs HTTP transport comparison, complete TypeScript MCP server example (Tools + Resources + Prompts), Python server example, MCP security mistakes section, MCP debugging guide |
| `agent-teams-guide.md` | Added improved ASCII architecture diagram, sequence diagram for orchestrator→worker communication, task state machine diagram, cost estimation for agent fleets, anti-patterns section, debugging guide |
| `cicd-integration.md` | Added ASCII pipeline flow diagram, complete GitHub Actions workflow with all options, GitLab CI example, Azure DevOps example, CI cost optimization strategies, Bedrock/Vertex CI setup with WIF, security hardening checklist |
| `permissions-security.md` | Added ASCII security layer diagram, comprehensive tool allowlist syntax reference, sandbox mode comparison table, enterprise security checklist, MCP security deep-dive with prompt injection examples |
| `sdk-guide.md` | Added subprocess architecture diagram, complete streaming event types with TypeScript types, Python SDK full example with error handling, TypeScript SDK full example, parallel session patterns, StatefulClient vs fire-and-forget comparison |
| `worktrees-guide.md` | Added ASCII diagram of worktree relationships sharing .git database, visual clone vs worktree comparison, team coordination patterns, CI/CD parallel review patterns, expanded troubleshooting |

**Reference Files:**

| File | Changes |
|------|---------|
| `models-pricing.md` | Added cost calculator examples, session cost breakdown diagrams, extended cloud provider comparison, model selection mental model diagram |
| `memory-management.md` | Added ASCII memory hierarchy diagram (all 7 types), compaction survival decision chart, @import syntax deep-dive, MEMORY.md writing best practices, memory debugging section, enterprise memory patterns |
| `output-styles-guide.md` | Added style comparison (same prompt, different styles), output style creation walkthrough, keep-coding-instructions comparison, team distribution pattern |
| `plugins-guide.md` | Added plugin directory structure diagram, all 10 component types with examples, plugin.json complete schema, CLAUDE_PLUGIN_ROOT vs DATA explanation, development tutorial, debugging guide |
| `slash-commands-reference.md` | Added commands organized by category (session/context/config/tools/agent/git), complete custom command frontmatter schema, $ARGUMENTS usage patterns, @import and !shell patterns, 10 practical command examples |

**Training & Research:**

| File | Changes |
|------|---------|
| `claude-training.md` | Added learning path overview diagram, skill assessment rubric table, expanded exercises, assessment questions per module, real-world project ideas, certification prep section |
| `compass-research-notes.md` | Added study map diagram (all 5 domains), gap-fill reference section, domain summary tables, high-yield facts per domain, practice question format, cross-domain concept connections |
| `validation-report.md` | Added new May 2026 validation section, updated summary statistics (255+ claims), added models-pricing.md and worktrees-guide.md validations, updated last-reviewed date |

**MDX Interactive Diagram Wrappers (14 files) — descriptions updated for accuracy:**

- `architecture.mdx` — lifecycle flow, all 23 file types
- `precedence.mdx` — full hierarchy, conflict resolution
- `override-test-lab.mdx` — 12 precedence scenarios
- `file-catalog.mdx` — 23 file types browser
- `claude-code-efficiency-guide.mdx` — token efficiency interactive
- `context-engineering-ce.mdx` — CE strategies, token simulator
- `advisor-diagram.mdx` — dual-model /advisor flow
- `hooks-diagram.mdx` — 30+ events, 5 handler types
- `mcp-diagram.mdx` — 4-layer architecture, 3 primitives
- `agent-teams-diagram.mdx` — Task tool vs Agent Teams
- `cicd-diagram.mdx` — full pipeline, GitHub Actions, cloud auth
- `sdk-diagram.mdx` — subprocess architecture, event types
- `memory-diagram.mdx` — all 7 memory types
- `plugins-diagram.mdx` — all 10 plugin components

#### Home Page (`src/content/docs/index.mdx`)

- Updated stats bar: 35 Claude Code Docs (confirmed accurate)
- Updated Claude Code card description to include all major features
- Added new Interactive Tools section cards for new diagrams
- Updated card counts to be accurate

---

### Files NOT Changed (per user instructions)

The following sections/files were left unchanged as instructed:
- `src/content/docs/rag/` — all RAG guides
- `src/content/docs/bert/` — all BERT guides
- `src/content/docs/langchain/` — LangChain reference
- `src/content/docs/cert/` — certification prep materials
- `src/components/interactive/*.jsx` — React diagram components
- `astro.config.mjs` — site configuration
- `src/styles/custom.css` — custom styling
- All `.github/` workflow files

---

### No Content Removed

All existing content was preserved. Updates were additive only:
- New sections were appended to existing files
- New diagrams were inserted at conceptually appropriate locations
- New examples were added alongside existing ones
- Existing examples and explanations were not modified

---

## Previous Entries

### [feature/rag-hub initial] — 2026-05-07

Initial creation of the `claude-code/` documentation section on the `feature/rag-hub` branch, adding:
- All 35 markdown/MDX documentation files for Claude Code
- All 14 interactive diagram React components
- Separate `claude-code/` section in Astro sidebar
- Updated home page with Claude Code module card
- SDK diagram, advisor diagram, memory diagram, plugins diagram, CICD diagram

### [main] — 2026-05-09

- Updated all claude-code docs to v2.1.126
- Fixed sidebar ordering
- Added validation report

---

*This CHANGELOG is maintained manually. It is excluded from the Jekyll/Astro build — do not add frontmatter.*
