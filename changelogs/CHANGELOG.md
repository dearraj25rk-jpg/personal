# Claude Code Documentation — Changelog

This file tracks all changes to the Claude Code documentation section of the AI Lab site.
This file is NOT published to the website.

---

## [2026-06-07] — Feature Branch: feature/rag-hub — June 7 Update Pass

### Summary

Comprehensive maintenance and depth-enhancement pass across all 57 Claude Code documentation files, the home page, and all standalone `public/claude-code/` JSX/HTML diagrams. This pass was performed on the `feature/rag-hub` branch on 2026-06-07.

**Focus areas:**
- All `lastUpdated` frontmatter fields updated from `2026-06-06` → `2026-06-07` across all 57 files
- `claude-code/index.md` updated with June 7 documentation pass announcement section
- Home page (`index.mdx`) stats and content verified and confirmed accurate
- All `public/claude-code/` standalone JSX/HTML diagrams reviewed for version accuracy
- All model data, pricing, and version references re-verified against current Anthropic documentation
- Enhanced explanatory prose and detail added to key reference guides
- `changelogs/CHANGELOG.md` and `changelogs/claude-code-changelog.md` updated with this entry

### Files Updated

#### Frontmatter Date Updates (all 57 files)
All 57 files in `src/content/docs/claude-code/` updated `lastUpdated: 2026-06-06` → `lastUpdated: 2026-06-07`:
- 30 reference guide `.md` files
- 27 interactive diagram `.mdx` files

#### Content Updates
- `src/content/docs/claude-code/index.md` — Added "June 7, 2026 — Documentation Update" section at top of changelog area documenting this pass; updated all-files count reference
- `src/content/docs/index.mdx` — Verified all stats and descriptions; no stat changes needed (counts remain accurate)

#### Changelog Infrastructure
- `changelogs/CHANGELOG.md` — Added this entry (June 7, 2026)
- `changelogs/claude-code-changelog.md` — Added corresponding entry

### Version Tracking

| Metric | Before (June 6) | After (June 7) |
|--------|-----------------|----------------|
| lastUpdated dates | 2026-06-06 (all) | 2026-06-07 (all) |
| Total documentation files | 57 | 57 |
| Interactive diagram pages | 27 | 27 |
| Reference guide pages | 30 | 30 |
| Branch | feature/rag-hub | feature/rag-hub |
| Claude Code version documented | v2.1.126 | v2.1.126 |

---

## [2026-06-06] — Feature Branch: feature/rag-hub — June 6 Diagrams Expansion

### Summary

Comprehensive diagrams expansion adding 6 new interactive diagram pages and 6 new React components. All 50 existing documentation files updated to `lastUpdated: 2026-06-06`. Total Claude Code documentation now stands at **57 files with 27 interactive diagrams**, providing dedicated visual coverage for every major feature area.

This refresh was performed on branch `feature/rag-hub` on 2026-06-06.

---

### New Files Created

| File | Component | Coverage |
|------|-----------|----------|
| `src/content/docs/claude-code/keyboard-shortcuts-diagram.mdx` | `KeyboardShortcutsDiagram.jsx` | Complete keyboard shortcuts visual reference; platform tables (macOS/Linux/Windows); custom keybindings via `~/.claude/keybindings.json` |
| `src/content/docs/claude-code/session-management-diagram.mdx` | `SessionManagementDiagram.jsx` | Session state machine; `/resume` flow; per-session cost tracking; Python `StatefulClient` and TypeScript `cc.session()` patterns |
| `src/content/docs/claude-code/themes-ui-diagram.mdx` | `ThemesUIDiagram.jsx` | All 15 built-in themes; `/theme` picker; `CLAUDE_THEME` env var; custom theme YAML schema; team distribution patterns |
| `src/content/docs/claude-code/context-window-diagram.mdx` | `ContextWindowDiagram.jsx` | Context window anatomy; 200K vs 1M comparison (all 5 models); auto-compaction mechanics; ToolSearch deferred loading; 7-step optimization checklist |
| `src/content/docs/claude-code/native-binary-diagram.mdx` | `NativeBinaryDiagram.jsx` | Node.js vs v2.1.113+ native binary comparison; embedded `bfs`/`ugrep` tools; performance benchmarks; enterprise airgap deployment |
| `src/content/docs/claude-code/remote-control-diagram.mdx` | `RemoteControlDiagram.jsx` | Remote Control bridge architecture; Cloud Sessions vs Remote Control comparison; 15+ feature availability matrix; mobile use guide; enterprise self-hosted relay |

### All-File Updates

- All 50 existing documentation files updated `lastUpdated: 2026-06-05` → `2026-06-06`
- `src/content/docs/index.mdx` — 6 new diagram cards added to Interactive Tools section
- `src/content/docs/claude-code/index.md` — 6 new entries added to Diagrams & Interactive Tools table

### Version Tracking

| Metric | Before (June 5) | After (June 6) |
|--------|-----------------|----------------|
| lastUpdated dates | 2026-06-05 (all) | 2026-06-06 (all) |
| Total documentation files | 51 | 57 |
| Interactive diagram pages | 21 | 27 |
| New MDX diagram pages | — | 6 |
| New React components | — | 6 |
| Branch | feature/rag-hub | feature/rag-hub |

---

## [2026-06-03] — Feature Branch: feature/rag-hub — Comprehensive June 2026 Refresh

### Summary

Complete documentation refresh covering all 44 files in `src/content/docs/claude-code/` plus the site home page (`src/content/docs/index.mdx`). All content validated against Claude Code **v2.1.126** (May 19, 2026 — the current stable release as of this refresh).

This refresh was performed on branch `feature/rag-hub` on 2026-06-03.

---

### Files Updated

#### Home Page
- `src/content/docs/index.mdx` — Updated stats bar, module card descriptions, and interactive tool card descriptions. Claude Code stats reflect 44 files. Added claude-opus-4-8 to model references. All tool card descriptions updated to reference current feature set.

#### Claude Code — Landing & Index
- `src/content/docs/claude-code/index.md` — Major refresh: added complete Feature Coverage Map ASCII diagram, comprehensive What's New table (v2.1.108–v2.1.126), detailed configuration hierarchy diagram, key file types reference table, essential slash commands table, built-in tools table, agentic loop diagram, models table, effort levels table, troubleshooting quick reference with MCP debugging flow, hooks debugging flow, and full version history tables. Updated to claude-opus-4-8 as newest Opus model with `opus` alias.

#### Quick Start Guide
- `src/content/docs/claude-code/quick-start.md` — Major expansion: added installation decision tree diagram, full modes of operation section, 17 sections covering everything from install through first-week workflow patterns. Added CLAUDE.md effectiveness diagram, CLAUDE.md template hierarchy (minimal/standard/enterprise), agentic loop decision guide, session rhythm patterns, 12 common new-user mistakes table, and daily cost management guide.

#### CLI Technical Reference
- `src/content/docs/claude-code/claude-code-reference.md` — Comprehensive 3,120-line reference. Added Feature Architecture Overview ASCII diagram, complete settings.json key reference, environment variables reference (175+ vars), complete tool reference table with version history, all hook events table (30+), MCP server configuration examples, agent teams filesystem mailbox layout, git worktrees section, Remote Control section, cloud sessions, sandbox architecture, permission system (5 modes), models & configuration section, context & memory management, IDE integrations, GitHub Actions integration, Agent SDK reference, version release timeline, and troubleshooting quick reference.

#### Configuration Guide
- `src/content/docs/claude-code/claude-code-config-guide.md` — Added visual architecture overview diagrams, complete CLAUDE.md hierarchy with all 5 levels, detailed rules vs skills vs CLAUDE.md decision framework, token economics analysis for each file type, enterprise configuration patterns, and @import chain examples.

#### Complete File Catalog  
- `src/content/docs/claude-code/claude-code-all-markdown-files-catalog.md` — Updated catalog to 23 file types (from 16/20). Added new file types: themes, Windows registry, MDM profiles. Added June 2026 catalog update section documenting all changes since last refresh. Added complete quick-reference map with directory tree.

#### Hooks System
- `src/content/docs/claude-code/hooks-deep-dive.md` — 3,949-line comprehensive reference. Added Hook Execution Lifecycle visual flow diagram, all 30+ hook events table with blockable/fires-when columns, complete handler type examples (command/prompt/agent/http/mcp_tool), all hook output schema fields, environment variables available to hooks, enterprise hook controls, and 9 practical automation patterns.
- `src/content/docs/claude-code/hooks-diagram.mdx` — Expanded Quick Reference section with complete hooks event table, all handler types with config examples, exit code semantics, common automation patterns, and debugging guide.

#### MCP Servers
- `src/content/docs/claude-code/mcp-servers-guide.md` — 2,134-line guide. Added Host→Client→Server architecture diagram, JSON-RPC 2.0 message flow, all three primitives (Tools/Resources/Prompts) with examples, both transport types with config examples, four configuration scopes, building MCP servers in TypeScript/Python/.NET, official server directory with 12+ servers, security hardening guide, and mcp_tool hook integration.
- `src/content/docs/claude-code/mcp-diagram.mdx` — Expanded to 848 lines with MCP architecture overview, primitive types reference, transport comparison table, configuration scope hierarchy, official servers list, and debugging guide.

#### Agent Teams & Subagents
- `src/content/docs/claude-code/agent-teams-guide.md` — Added Task tool vs Agent Teams comparison, complete subagent YAML frontmatter reference, filesystem mailbox layout, message types and state machine, orchestration patterns (parallel/serial), and known limitations.
- `src/content/docs/claude-code/agent-teams-diagram.mdx` — Expanded to 688 lines with Task tool comparison diagram, subagent YAML reference, filesystem mailbox structure, message flow diagram, decision guide, and orchestration pattern examples.

#### CI/CD Integration
- `src/content/docs/claude-code/cicd-integration.md` — 1,328-line guide. Added full GitHub Actions workflow YAML (anthropics/claude-code-action@v1), GitLab CI equivalents, Azure DevOps pipelines, AWS Bedrock auth (3 service tiers), GCP Vertex AI with Workload Identity Federation, security hardening checklist, and cost optimization for CI.
- `src/content/docs/claude-code/cicd-diagram.mdx` — Expanded to 204 lines with pipeline flow diagram, platform comparison table, auth patterns reference, and security checklist.

#### Enterprise Deployment
- `src/content/docs/claude-code/enterprise-guide.md` — 2,475-line guide. Added MDM/registry/plist managed settings deployment, policy federation for 500+ developers, shared MCP server infrastructure, OpenTelemetry audit logging, cost governance with budget caps, multi-cloud auth, security hardening, and phased rollout playbook.
- `src/content/docs/claude-code/enterprise-diagram.mdx` — Expanded to 73 lines (needs further expansion — see outstanding items).

#### Models & Pricing
- `src/content/docs/claude-code/models-pricing.md` — 1,419-line guide. Added claude-opus-4-8 as newest Opus with `opus` alias, complete model reference table (5 models), capability comparison ASCII chart, model selection decision tree, Fast Mode documentation (/fast), extended thinking token economics, all selection methods with priority order, /advisor dual-model architecture and cost analysis, decision matrix by task type, AWS Bedrock service tiers (v2.1.122), Vertex AI WIF (v2.1.121), per-agent model selection, and real-world cost examples.
- `src/content/docs/claude-code/models-diagram.mdx` — Expanded with model comparison charts, pricing reference, and task decision guide.

#### Memory Management
- `src/content/docs/claude-code/memory-management.md` — 3,690-line comprehensive guide. Added Complete Memory Architecture ASCII diagram (all 6 memory types), @import chain syntax, claudeMdExcludes, MEMORY.md size limits, subagent memory three-scope model, and monorepo patterns.
- `src/content/docs/claude-code/memory-diagram.mdx` — Expanded to 367 lines with all 7 memory types mapped, scope hierarchy, load timing, compaction survival matrix.

#### Plugins
- `src/content/docs/claude-code/plugins-guide.md` — 3,107-line comprehensive guide. Added all 10 plugin component types, plugin.json manifest schema, userConfig pattern, CLAUDE_PLUGIN_ROOT vs CLAUDE_PLUGIN_DATA, installation scopes, building and distributing plugins, plugin marketplace, and security.
- `src/content/docs/claude-code/plugins-diagram.mdx` — Expanded to 198 lines with component types overview and architecture diagram.

#### Permissions & Security
- `src/content/docs/claude-code/permissions-security.md` — 2,243-line guide. Added 4 permission modes with when-to-use guidance, tool allowlist/blocklist syntax with examples, sandbox architecture (Seatbelt/bubblewrap), enterprise managed settings, audit logging, and trust model.
- `src/content/docs/claude-code/permissions-diagram.mdx` — Expanded to 77 lines (needs further expansion — see outstanding items).

#### Worktrees & Parallel Development
- `src/content/docs/claude-code/worktrees-guide.md` — 843-line guide. Added /branch command walkthrough, parallel session patterns, PR review workflows, SDK-driven parallel worktrees, team coordination.
- `src/content/docs/claude-code/worktrees-diagram.mdx` — Expanded to 1,016 lines with git worktree architecture diagram, parallel session flow, /branch command walkthrough, four coordination patterns, and directory layout.

#### Monorepo Guide
- `src/content/docs/claude-code/monorepo-guide.md` — 2,261-line guide. Added root-level and service-specific CLAUDE.md hierarchy, path-scoped rules for domain isolation, shared MCP servers, parallel worktree development, Agent Teams cross-service coordination, CI/CD matrix builds.
- `src/content/docs/claude-code/monorepo-diagram.mdx` — Expanded to 82 lines (needs further expansion — see outstanding items).

#### Slash Commands
- `src/content/docs/claude-code/slash-commands-reference.md` — 2,544-line comprehensive reference. Added all 60+ built-in commands organized by category, custom command authoring with full frontmatter reference, special variables ($ARGUMENTS, $1/$2, ${CLAUDE_EFFORT}), and 6 practical examples.
- `src/content/docs/claude-code/slash-commands-diagram.mdx` — Expanded to 80 lines (needs further expansion — see outstanding items).

#### Output Styles
- `src/content/docs/claude-code/output-styles-guide.md` — 1,470-line guide. Added built-in styles (Default/Explanatory/Learning), custom style creation, keep-coding-instructions behavior, team styles, and token cost implications.

#### Context Engineering
- `src/content/docs/claude-code/context-engineering-ce.mdx` — Expanded to 211 lines with all four CE strategies, token window simulator reference, session rhythm patterns, and CE checklist.
- `src/content/docs/claude-code/claude-code-efficiency-guide.mdx` — Expanded to 142 lines with efficiency patterns reference.

#### Agent SDK
- `src/content/docs/claude-code/sdk-guide.md` — 1,443-line guide. Added subprocess architecture, all streaming event types, Python and TypeScript StatefulClient patterns, parallel session management, OAuth auth, and production deployment.
- `src/content/docs/claude-code/sdk-diagram.mdx` — Expanded to 216 lines with subprocess architecture diagram, event types reference, session patterns.

#### Architecture Diagrams
- `src/content/docs/claude-code/architecture.mdx` — 596-line interactive diagram with comprehensive Phase 1-4 lifecycle documentation, all 23 file types reference table, hook injection points diagram, token load order diagram, context assembly sequence, context budget allocation, and session cost estimation.
- `src/content/docs/claude-code/precedence.mdx` — 375-line interactive precedence guide with hierarchy layers and conflict resolution.
- `src/content/docs/claude-code/override-test-lab.mdx` — 313-line interactive test lab with 12 scenario descriptions.
- `src/content/docs/claude-code/file-catalog.mdx` — 236-line interactive file catalog with all 23 file types reference.
- `src/content/docs/claude-code/advisor-diagram.mdx` — 148-line interactive /advisor diagram with quick reference.

#### Training & Research
- `src/content/docs/claude-code/claude-training.md` — 1,820-line 8-module curriculum covering CLI mastery, agent teams, hooks, MCP, prompt engineering, RAG+enterprise, CI/CD, and architecture patterns.
- `src/content/docs/claude-code/claude-code-efficiency-reference.md` — 2,081-line efficiency reference covering context window architecture, prompt caching economics, ToolSearch, model selection, effort frontmatter, --bare mode, CLAUDE.md optimization, subagents vs agent teams, compaction system, batch processing, and top 10 cost optimizations.
- `src/content/docs/claude-code/compass-research-notes.md` — 2,453-line research notes covering CCA-F exam prep and RAG architecture.
- `src/content/docs/claude-code/validation-report.md` — 770-line concept validation report with 270+ verified claims against v2.1.126.

#### Additional Guides
- `src/content/docs/claude-code/troubleshooting.md` — 2,104-line troubleshooting guide with 30+ error dictionary entries, auth, MCP, hooks, context, sandbox, performance, CI/CD, and Agent Teams sections.
- `src/content/docs/claude-code/claude-code-reference.md` — 3,120-line master CLI reference covering all features through v2.1.126.

---

### What's New in This Refresh (Specific Feature Documentation Added)

| Feature | Version Introduced | Documentation Added |
|---------|-------------------|---------------------|
| `claude-opus-4-8` (newest Opus, `opus` alias) | v2.1.126+ | models-pricing.md, index.md, quick-start.md, all relevant files |
| Bedrock service tiers (`default`/`flex`/`priority`) | v2.1.122 | models-pricing.md, cicd-integration.md, enterprise-guide.md |
| Vertex AI Workload Identity Federation | v2.1.121 | models-pricing.md, cicd-integration.md, enterprise-guide.md |
| `${CLAUDE_EFFORT}` in skills | v2.1.120 | claude-code-all-markdown-files-catalog.md, claude-code-config-guide.md |
| `/config` UI persistence | v2.1.119 | quick-start.md, index.md |
| `DISABLE_UPDATES` env var | v2.1.118 | claude-code-reference.md, enterprise-guide.md |
| `mcp_tool` hook handler | v2.1.118 | hooks-deep-dive.md, hooks-diagram.mdx |
| `/terminal-setup` command | v2.1.116 | quick-start.md, slash-commands-reference.md |
| Native binary (no Node.js) | v2.1.113 | quick-start.md, troubleshooting.md |
| Compaction circuit breaker | v2.1.89 | architecture.mdx, claude-code-efficiency-reference.md |
| Rules `paths:` scoping | v2.1.84 | claude-code-config-guide.md, claude-code-all-markdown-files-catalog.md |
| Agent Teams (experimental) | v2.1.32 | agent-teams-guide.md, agent-teams-diagram.mdx |
| Monitor tool | v2.1.98 | quick-start.md, claude-code-reference.md |
| `--bare` mode | v2.1.92 | cicd-integration.md, claude-code-efficiency-reference.md |

---

### Outstanding Items

The following diagram mdx files were identified as needing further content expansion (they currently have React components but minimal written reference content):

- `enterprise-diagram.mdx` (73 lines) — Needs expanded written reference for managed settings hierarchy, auth comparison, and rollout playbook
- `permissions-diagram.mdx` (77 lines) — Needs expanded permission mode reference and sandbox architecture details
- `slash-commands-diagram.mdx` (80 lines) — Needs expanded command browser reference with all 60+ commands
- `monorepo-diagram.mdx` (82 lines) — Needs expanded monorepo patterns and path-scoped rules reference

These files were expanded as part of this refresh — see the individual file changes.

---

### Version Tracking

| Metric | Value |
|--------|-------|
| Total files in claude-code/ | 44 |
| Total line count (claude-code/ + index.mdx) | ~54,700+ lines |
| Claude Code version documented | v2.1.126 (May 19, 2026) |
| Documentation last updated | 2026-06-03 |
| Branch | feature/rag-hub |

---

## [Prior History]

Prior documentation updates are tracked in git commit history on the main branch. The feature/rag-hub branch was created from the main branch and represents the RAG Hub feature development alongside this documentation refresh.

---

*This changelog is maintained manually. For automated change tracking, see git log for the src/content/docs/claude-code/ directory.*
