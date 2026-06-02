# Claude Code Documentation — Changelog

> This file tracks documentation changes and is NOT published to the website.

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
