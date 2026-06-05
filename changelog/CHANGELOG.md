# Claude Code Documentation — Changelog

> This file tracks documentation changes and is NOT published to the website.

---

## [2026-06-05] — Comprehensive Depth Pass: All 48 Files Updated (feature/rag-hub)

### Scope
Branch: `feature/rag-hub` — full update of all 48 files in `src/content/docs/claude-code/` + homepage.
Claude Code version baseline: v2.1.126 (May 19, 2026). Current date: June 5, 2026.

### New Files Added

| File | Description |
|------|-------------|
| `src/content/docs/claude-code/keyboard-shortcuts.md` | NEW: Complete keyboard shortcuts and terminal integration guide — all built-in shortcuts, mode cycling, multiline input methods, custom keybindings.json schema, /terminal-setup walkthrough for iTerm2/WezTerm/Ghostty, readline shortcuts, terminal compatibility matrix |
| `src/content/docs/claude-code/session-management.md` | NEW: Session lifecycle, /resume, /rename, session persistence, non-interactive session management, Python/TypeScript SDK StatefulClient, cost tracking per session, multi-session patterns |
| `src/content/docs/claude-code/themes-ui.md` | NEW: Themes and UI customization — built-in themes, /theme command, custom theme authoring, ~/.claude/themes/*.md frontmatter schema, team theme distribution via plugins, dark/light auto-switch, CLAUDE_THEME env var |

### Reference Guide Enhancements

| File | Sections Added | Lines Added (approx.) |
|------|---------------|----------------------|
| `sdk-guide.md` | §12: .NET/C# Subprocess Integration pattern (System.Diagnostics.Process, IAsyncEnumerable streaming); §13: Session Resumption across SDK runs (session ID persistence, resume param); §14: Error Taxonomy (full exception hierarchy, TypeScript error codes, rate limit strategy); §15: Bedrock Auth in SDK (boto3 credential discovery, service tier selection) | ~300 |
| `cicd-integration.md` | Jenkins Declarative Jenkinsfile + Bedrock auth; CircleCI config.yml + OIDC-based AWS auth; Bitbucket Pipelines config; Cost Attribution per PR (GitHub comment with cost); Budget alert hook script; Prompt Cache Warming analysis and strategies; Multi-stage pipeline pattern (Haiku security scan → Sonnet review → Opus arch review for large PRs); CI Concurrency Management (concurrency groups, rate limit retry wrapper) | ~400 |
| `worktrees-guide.md` | §9: Advanced Worktree Patterns (Feature Branch Isolation with Shared MCP Servers, Automated CI via SDK, Agent Teams Across Worktrees, full state isolation matrix); §10: Cleanup Best Practices; §11: Worktrees in GitHub Actions | ~200 |
| `agent-teams-guide.md` | Advanced patterns: Hub-and-Spoke Orchestration, Pipeline Pattern, Peer Review Pattern, External Services integration, Debugging Agent Teams, Performance Tuning guidance | ~250 |
| `context-window-guide.md` | Surgical Context Loading, @import Composition Pattern, Compaction-Aware Session Design, Rules as Context Budget Multipliers, Context Window Budget Calculator, Haiku vs Sonnet vs Opus decision guide | ~200 |
| `native-binary-guide.md` | Additional platform-specific binary path details, update mechanism deep dive, binary integrity verification, bfs symlink and ugrep behavioral nuances | ~150 |
| `remote-control-guide.md` | Extended mobile UX patterns, Cloud Sessions container tooling matrix, latency model explanation, enterprise self-hosted relay configuration | ~150 |

### Interactive Diagram MDX Enhancements

All 21 MDX files: `lastUpdated` updated to `2026-06-05`.

### Home Page Updates
- `src/content/docs/index.mdx`: Claude Code card description updated to reflect new guides (keyboard shortcuts, session management, themes)
- Stats bar: count updated from 48 to 51 (three new reference docs added)
- Terminal animation version references confirmed for v2.1.126

### Changelog
- This entry added (tracking the June 5, 2026 comprehensive update pass)

---

## [2026-06-02] — Major Update: New Diagrams & Content Enhancement

### New Interactive Diagrams Added
- `worktrees-diagram.mdx` + `WorktreesDiagram.jsx` — Git worktrees and parallel development visual guide
- `permissions-diagram.mdx` + `PermissionsDiagram.jsx` — Permissions, sandbox, and security layers visual
- `enterprise-diagram.mdx` + `EnterpriseDiagram.jsx` — Enterprise deployment architecture visual
- `monorepo-diagram.mdx` + `MonorepoDiagram.jsx` — Monorepo patterns and CLAUDE.md hierarchy visual
- `slash-commands-diagram.mdx` + `SlashCommandsDiagram.jsx` — Interactive slash command reference visual

### Updated Files (Content Enhancement & Date Refresh)
- All `lastUpdated` dates updated to 2026-06-02
- `index.md` — Added 5 new diagram entries, updated stats, enhanced What's New section
- `quick-start.md` — Enhanced installation decision tree, added June 2026 tips
- `hooks-deep-dive.md` — Added new hook patterns, deepened handler examples
- `mcp-servers-guide.md` — Added MCP 1.1 spec details, additional server examples
- `architecture.mdx` — Updated token table, enhanced compaction section
- `models-pricing.md` — Updated claude-opus-4-8 notes, /fast mode details
- `troubleshooting.md` — Added 10+ new error entries
- `permissions-security.md` — Expanded sandbox and audit sections
- `enterprise-guide.md` — Added Vertex WIF details, cost governance examples
- `monorepo-guide.md` — Added Agent Teams cross-service patterns
- `worktrees-guide.md` — Added coordination patterns, SDK worktree examples
- All other files — `lastUpdated: 2026-06-02` date update

### Home Page (index.mdx) Updates
- Claude Code Docs card count updated: 24 reference docs · 19 interactive diagrams
- Stats bar: Claude Code count updated to 44
- Added 5 new interactive tool cards for new diagrams

### Version Notes
- Content reflects Claude Code v2.1.126 (May 19, 2026) — latest stable as of June 2026
- All feature claims verified against official Anthropic documentation
- claude-opus-4-8 remains the newest Opus model (no new models released since May 2026)

## [2026-05-31] — Previous Update

### Files Updated
- `index.md` — Added Opus 4.8 to What's New, updated model table
- `models-pricing.md` — Added claude-opus-4-8 section with detailed notes  
- `quick-start.md` — Refreshed installation options, added WinGet
- `architecture.mdx` — Enhanced compaction survival matrix

### Version Notes
- Claude Code v2.1.126 (May 19, 2026)
- claude-opus-4-8 added as newest Opus model

## [2026-05-23] — Content Audit & Verification

### Files Updated
- `claude-code-reference.md` — Full feature audit through v2.1.126
- `hooks-deep-dive.md` — Added mcp_tool handler (v2.1.118)
- `mcp-servers-guide.md` — Added MCP spec 1.1 details
- `agent-teams-guide.md` — Added filesystem mailbox protocol
- `claude-code-all-markdown-files-catalog.md` — Updated to 23 file types

### New Files
- `validation-report.md` — 270+ claims verified
- `compass-research-notes.md` — Deep technical research notes

## [2026-05-19] — Foundation

### Files Created
- All core documentation pages established
- 14 interactive JSX diagram components created
- Jekyll → Astro Starlight migration completed
