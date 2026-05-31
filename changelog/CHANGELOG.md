# Content Changelog

> **Note:** This file tracks documentation changes and is NOT published to the website.
> It is stored in `changelog/` at the repo root — outside `src/content/docs/` — so Astro/Starlight
> never picks it up as a content page.

---

## [feature/rag-hub] — 2026-05-31 (Update: Opus 4.8 + Fast Mode + Models Diagram)

**Branch:** `feature/rag-hub`  
**Scope:** Add claude-opus-4-8 model throughout, add /fast command documentation, new Models Comparison interactive diagram  
**Baseline:** Claude Code v2.1.126+ (May 2026)  
**Author:** Claude Code (automated)

### New Files Created

| File | Description |
|------|-------------|
| `src/components/interactive/ModelsDiagram.jsx` | New interactive React component — 3-tab diagram: Model Comparison cards (5 models with capability scores), Task Decision Guide (task complexity → model recommendation), Pricing Calculator (real-time cost with cache hit rate slider) |
| `src/content/docs/claude-code/models-diagram.mdx` | New interactive page wrapping ModelsDiagram — includes Models Quick Reference table, Fast Mode documentation, model switching commands, Bedrock/Vertex model IDs. `sidebar.order: 16` |

### Updated Files

#### Content Updates (new model + /fast command)

| File | Key changes |
|------|-------------|
| `src/content/docs/claude-code/index.md` | Added claude-opus-4-8 to models table; /fast to slash commands table; new models-diagram entry in Diagrams section; updated ECOSYSTEM block model line |
| `src/content/docs/claude-code/models-pricing.md` | Added claude-opus-4-8 as first row in models table; added Fast Mode section with /fast docs; updated all model comparisons |
| `src/content/docs/claude-code/quick-start.md` | Added claude-opus-4-8 to model selection guidance and mistake table |
| `src/content/docs/claude-code/slash-commands-reference.md` | Added /fast to commands table; added dedicated /fast section with full usage guide |
| `src/content/docs/claude-code/architecture.mdx` | Updated model references to include Opus 4.8 |
| `src/content/docs/index.mdx` | +1 Claude Code doc count (38→39); added Models Comparison interactive card; updated Claude Code card description with Opus 4.8 |

#### Date Updates
All files updated `lastUpdated` to `2026-05-31`.

---

## [feature/rag-hub] — 2026-05-30 (Update: Gap-Fill Pass + Diagram Expansions)

**Branch:** `feature/rag-hub`  
**Scope:** Three new reference guides, expanded quick-reference on 8 diagram pages, home page stats + cards update  
**Baseline:** Claude Code v2.1.126 (May 2026)  
**Author:** Claude Code (automated)

### New Files Created

| File | Description |
|------|-------------|
| `src/content/docs/claude-code/troubleshooting.md` | Comprehensive troubleshooting guide — auth failures (API key, Bedrock, Vertex), MCP connection issues, hook failures, context/compaction problems, sandbox permission errors, performance debugging, CI/CD pipeline issues, error message dictionary with 26 entries, diagnostic commands reference. `sidebar.order: 25` (~2003 lines) |
| `src/content/docs/claude-code/enterprise-guide.md` | Enterprise deployment guide — managed settings via MDM/registry/plist, policy federation for 500+ developer orgs, shared MCP server infrastructure, audit logging with OpenTelemetry, cost governance and budget caps, multi-cloud auth (Bedrock service tiers, Vertex WIF), security hardening checklist, CLAUDE.md distribution via plugins, phased org rollout playbook. `sidebar.order: 26` |
| `src/content/docs/claude-code/monorepo-guide.md` | Monorepo & multi-service patterns — root/service/subdirectory CLAUDE.md hierarchy, path-scoped rules for domain isolation, per-service and shared MCP servers, parallel worktree development, Agent Teams for cross-service coordination, CI/CD matrix builds with service change detection, shared plugin libraries, complete 5-service example config. `sidebar.order: 27` |

### Updated Files

#### Interactive Diagram Pages (.mdx) — Expanded Quick Reference

All updated files had `lastUpdated` changed from `2026-05-19` to `2026-05-30`.

| File | Key additions to Quick Reference section |
|------|------------------------------------------|
| `mcp-diagram.mdx` | JSON-RPC 2.0 message flow diagram, TypeScript minimal server example, full `.mcp.json` config examples (stdio + HTTP), tool description best practices table, security checklist |
| `memory-diagram.mdx` | Auto-Memory mechanics walkthrough with step-by-step example, when-to-use decision table, @import chain example (monorepo), compaction survival flow diagram |
| `plugins-diagram.mdx` | Plugin vs direct config decision table, full `plugin.json` schema with all fields, install/update/remove commands, distribution patterns (npm registry/git/local symlink), component activation modes table |
| `agent-teams-diagram.mdx` | Complete built-in subagent types reference, full subagent frontmatter schema with all fields, Agent Teams message protocol (v2.1.32+) with message structure JSON, sequential/parallel/specialist-pool orchestration patterns, cost comparison table |
| `sdk-diagram.mdx` | Full Python SDK configuration options (all parameters), TypeScript StatefulClient full PR review example, parallel sessions `asyncio.gather` pattern, OAuth authentication flow |
| `cicd-diagram.mdx` | Production GitHub Actions workflow YAML (with concurrency, permissions, all flags), GitLab CI configuration, AWS Bedrock integration, GCP Vertex AI + WIF integration, cost optimisation table |
| `advisor-diagram.mdx` | Detailed /advisor session flow diagram with turns breakdown, when-advisor-provides-value table by task type, /advisor vs full Opus cost comparison with real numbers, model selection quick reference |
| `claude-code-efficiency-guide.mdx` | Context Engineering Checklist (6 categories: CLAUDE.md health, rules setup, session start, model & effort selection, caching strategy), token budget guide by task type, optimal session rhythm diagram |

#### Index and Navigation

| File | Changes |
|------|---------|
| `src/content/docs/claude-code/index.md` | Added 3 new entries to Reference Guides, Topic Guides, and Advanced Learning Path; added troubleshooting link in Quick Reference section; `lastUpdated: 2026-05-30` |
| `src/content/docs/index.mdx` | Claude Code stat 35→38; total resources 100+→105+; updated Claude Code card description to include enterprise/monorepo/troubleshooting; added 3 new interactive tool cards (Troubleshooting, Enterprise Deployment, Monorepo Guide); updated terminal init message |

### Files Audited — No Changes Needed

All previously updated files (2875–3120 lines each) were reviewed and found accurate for v2.1.126. No content was removed or altered in those files.

---

## [feature/rag-hub] — 2026-05-19 (Update: Comprehensive Content Refresh)

**Branch:** `feature/rag-hub`  
**Scope:** Comprehensive refresh of all `src/content/docs/claude-code/` files (35 files) and homepage (`src/content/docs/index.mdx`)  
**Baseline:** Claude Code v2.1.126 (May 19, 2026)  
**Author:** Claude Code (automated)  
**Purpose:** Ensure all documentation is current, comprehensive, and no content is missing. Added rich reference sections to all interactive diagram pages, improved homepage Claude Code card description, added Feature Map and Quick Setup sections to claude-code/index.md, fixed compass-research-notes.md frontmatter.

---

### Files Updated — `src/content/docs/claude-code/`

#### All Files: `lastUpdated` refreshed to `2026-05-19`

All 35 files in `src/content/docs/claude-code/` had their `lastUpdated` frontmatter field updated from `2026-05-17` to `2026-05-19`.

---

#### `architecture.mdx` — Added rich reference section

Added "Session Lifecycle — Quick Reference" section below the interactive React component:
- Phase 1: Initialization — complete table of all files loaded at startup with order and notes
- Phase 2: Tool Loop — ASCII flow diagram showing stop_reason routing
- Phase 3: Compaction — trigger threshold, MEMORY.md survival, circuit breaker (v2.1.89+)
- Phase 4: Shutdown — hook events at shutdown
- All 23 File Types — Quick Index table with Load Phase, Scope, Git? columns

#### `precedence.mdx` — Added rich reference section

Added "Precedence Hierarchy — Quick Reference" section:
- Full 12-level precedence stack with numbered ASCII hierarchy diagram
- Conflict Resolution Rules table (7 scenarios)
- Override Syntax Examples: settings.json allow/deny, rules file with paths:

#### `override-test-lab.mdx` — Added reference section

Added "Precedence Rules — Conceptual Reference" section:
- Complete list of all 12 test scenarios covered by the lab
- Key Conflict Resolution Rules table

#### `file-catalog.mdx` — Added reference section

Added "File Types — Quick Reference Table":
- All 23 Claude Code file types numbered in order
- Columns: File, Location, Loaded (timing), Scope, Git?, Purpose

#### `context-engineering-ce.mdx` — Added reference section

Added "Context Engineering — Quick Reference":
- The Four CE Strategies table (Priming, Anchoring, Pruning, Checkpointing)
- Token Budget breakdown for 200K model
- Auto-Compaction Thresholds by version
- Session Rhythm: 4-step workflow
- Key CE Commands reference table

#### `claude-code-efficiency-guide.mdx` — Added reference section

Added "Efficiency Quick Reference":
- Cost Optimisation Decision Tree (ASCII)
- Effort Level Cost Impact table (all 4 levels)
- Prompt Caching Economics table (3 scenarios)
- Output Style Cost Impact table
- Model Pricing table (all 4 models, May 2026)

#### `hooks-diagram.mdx` — Added rich reference section

Added "Hooks Quick Reference":
- All 30+ Hook Events table (Event, Category, Blockable, Fires when)
- Five Handler Types table (Type, Since, Protocol, Use for)
- Exit Code Protocol table (all 4 exit codes with meanings)

#### `mcp-diagram.mdx` — Added rich reference section

Added "MCP Quick Reference":
- Architecture Layers ASCII diagram (Host → Client → JSON-RPC → Server)
- Three Primitives table (Tools, Resources, Prompts with analogies)
- Transport Types table (stdio recommended, HTTP current, SSE deprecated)
- Configuration Scopes table (Project, User, Local, Enterprise)
- All 12 Official MCP Servers table with package names

#### `memory-diagram.mdx` — Added rich reference section

Added "Memory System Quick Reference":
- All 7 Memory Types table (Location, Scope, Persists?, Compaction?, Size limit)
- Precedence ASCII hierarchy diagram
- @import Syntax examples
- Memory Commands reference
- Environment Variables reference

#### `plugins-diagram.mdx` — Added rich reference section

Added "Plugins Quick Reference":
- All 10 Plugin Component Types table
- Plugin Directory Structure (ASCII tree)
- plugin.json Manifest example (JSON)
- Installation Scopes table (User, Project, Local, Managed)
- Environment Variables (CLAUDE_PLUGIN_ROOT, CLAUDE_PLUGIN_DATA)

#### `agent-teams-diagram.mdx` — Added rich reference section

Added "Agent Patterns Quick Reference":
- Pattern Comparison: Task Tool vs Agent Teams (7-aspect table)
- Subagent YAML Frontmatter complete example
- Task Tool Usage code example
- Agent Teams Filesystem Mailbox ASCII tree

#### `cicd-diagram.mdx` — Added rich reference section

Added "CI/CD Quick Reference":
- Official GitHub Action complete YAML example
- Non-Interactive Flags table (all CI flags with purpose)
- Cloud Provider Integration table (Bedrock, Bedrock WIF, Bedrock tier, Vertex AI, Vertex WIF)
- Security Hardening Checklist (6 items)

#### `sdk-diagram.mdx` — Added rich reference section

Added "Agent SDK Quick Reference":
- Architecture ASCII diagram (stdin/stdout JSON streaming protocol)
- All SDK Event Types table (type, subtype, contains)
- Python Minimal Usage code example
- TypeScript StatefulClient code example

#### `advisor-diagram.mdx` — Added reference section

Added "/advisor Quick Reference":
- Architecture comparison ASCII diagram (normal vs /advisor activated)
- When Advisor Fires table (4 triggers)
- Cost Comparison table (Sonnet only vs /advisor vs Opus only)
- Activating /advisor command examples

---

#### `claude-code/index.md` — New sections and improvements

- **Frontmatter description updated**: Added hooks handler count, MCP transport details, WIF auth, exact model names, CE strategies
- **Version date updated**: "May 17, 2026" → "May 19, 2026"
- **New Feature Map section**: ASCII coverage grid showing all 6 domains (Configure, Extend, Integrate, Core Tools, Efficiency, Security)
- **New Quick Setup section**: 4-step bash workflow for getting started in 5 minutes

---

#### `compass-research-notes.md` — Frontmatter fix

- **Added comprehensive `description` field**: Previously had no description, which meant the page had no SEO/search description
- **Corrected sidebar order**: Changed from 12 to 22 (to place it in the training/research section at the end)
- **Added `label: Research Notes`**: Cleaner sidebar label
- **Added `lastUpdated: 2026-05-19`**: Was completely missing

---

### Files Updated — `src/content/docs/` (Homepage)

#### `index.mdx` — Claude Code card description improved

- **Claude Code section card**: Updated `card-desc` to be more comprehensive, listing all major subsystems with technical detail: CLI version range, all 23 file types, configuration hierarchy levels, hook events/handler types/blockable distinction, MCP transport types/primitives/official servers, Agent SDK protocol details, WIF auth, plugin manifest/scopes, memory types, effort levels, CE strategies

---

### Quality Metrics

| Metric | Value |
|--------|-------|
| Files updated (claude-code/) | 35 of 35 |
| MDX files enriched with reference content | 14 of 14 |
| New sections added | 18 |
| Homepage improvements | 1 |
| Data loss | None |
| Version baseline | Claude Code v2.1.126 |

---

## [feature/rag-hub] — 2026-05-07

**Branch:** `feature/rag-hub`
**Scope:** Extended update of `src/content/docs/claude-code/`, `src/components/interactive/`, and home page (`src/content/docs/index.mdx`)
**Baseline:** Claude Code v2.1.126 (May 7, 2026)
**Author:** Claude Code (automated)

### New Files Added

#### `src/components/interactive/HooksDiagram.jsx`

New interactive React component for the Hooks System:
- **Tab 1 — Session Flow:** Full session lifecycle diagram with all hook trigger points, blockable/observe-only labels, and agent sub-flow for Task tool spawning. Key properties panel (snapshot, parallel, timeout, stdout/stderr, exit codes).
- **Tab 2 — Hook Events:** All 30+ events organised into 4 categories (Session Lifecycle, Tool Lifecycle, Agent Lifecycle, User Interaction). Each event card shows: event name, blockable flag, when it fires, and payload fields on click.
- **Tab 3 — Handler Types:** Interactive panel for all 5 handler types (command, prompt, agent, http, mcp_tool). Each shows description, `since` version, and full configuration JSON example. Full `settings.json` structure example with regex matchers and multiple handlers.
- **Tab 4 — Patterns:** 6 accordion-style copy-paste patterns: block dangerous Bash, auto-format on write, inject git context at start, Slack alert on stop, LLM-based prompt safety check, immutable audit trail.

#### `src/content/docs/claude-code/hooks-diagram.mdx`

- **Sidebar order:** 18
- MDX wrapper importing `HooksDiagram` component
- Description: session lifecycle flow, 30+ events, 5 handler types, 6 patterns

---

#### `src/components/interactive/MCPDiagram.jsx`

New interactive React component for MCP Architecture:
- **Tab 1 — Architecture:** 4-layer stack (Host → MCP Client → JSON-RPC 2.0 → MCP Server). Click any layer to expand details. MCP host ecosystem list (10 tools).
- **Tab 2 — Primitives:** Interactive selector for Tools, Resources, Prompts. Each shows: description, use cases, and TypeScript code example.
- **Tab 3 — Transports:** Selector for stdio (Recommended), HTTP (Current), SSE (Deprecated). Each shows pros/cons and `.mcp.json` configuration.
- **Tab 4 — Configuration:** 4 scope buttons (Project, User, Local, Enterprise). Each shows file path, who it applies to, lockout status for Enterprise, and a complete `.mcp.json` example. Official MCP servers grid (12 servers with descriptions).

#### `src/content/docs/claude-code/mcp-diagram.mdx`

- **Sidebar order:** 19
- MDX wrapper importing `MCPDiagram` component
- Description: four-layer architecture, three primitives, transport types, config scopes, official servers

---

#### `src/content/docs/claude-code/sdk-guide.md`

New comprehensive Agent SDK reference guide (sidebar.order: 10)

#### `src/content/docs/claude-code/worktrees-guide.md`

New Git worktrees & parallel development guide (sidebar.order: 11)

---

### Summary Statistics

| Metric | Before (May 6) | After (May 7) |
|--------|----------------|---------------|
| Total files in claude-code/ | 21 | 25 |
| New JSX diagram components | 0 | 2 |
| New .md guide files | 0 | 2 |
| New .mdx diagram wrappers | 0 | 2 |
| Total content lines (claude-code/) | ~17,000 | ~20,000+ |

---

## [feature/rag-hub] — 2026-05-06

**Branch:** `feature/rag-hub`
**Scope:** Full update of `src/content/docs/claude-code/` and home page (`src/content/docs/index.mdx`)
**Baseline:** Claude Code v2.1.126 (May 6, 2026)
**Author:** Claude Code (automated)

### New Files Added (2026-05-06)

- `src/content/docs/claude-code/quick-start.md` (sidebar.order: 2)
- `src/content/docs/claude-code/hooks-deep-dive.md` (sidebar.order: 5)
- `src/content/docs/claude-code/mcp-servers-guide.md` (sidebar.order: 6)
- `src/content/docs/claude-code/agent-teams-guide.md` (sidebar.order: 7)
- `src/content/docs/claude-code/cicd-integration.md` (sidebar.order: 8)
- `src/content/docs/claude-code/permissions-security.md` (sidebar.order: 9)

### Summary Statistics (2026-05-06)

| Metric | Before | After |
|--------|--------|-------|
| Total files in claude-code/ | 15 | 21 |
| New .md guide files | 0 | 6 |
| Total content lines | ~10,700 | ~17,000+ |
| Validated claims | 132 | 229 |
| Home page "Claude Code Docs" | 14 | 20 |
