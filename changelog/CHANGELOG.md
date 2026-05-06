# Content Changelog

> **Note:** This file tracks documentation changes and is NOT published to the website.
> It is stored in `changelog/` at the repo root — outside `src/content/docs/` — so Astro/Starlight
> never picks it up as a content page.

---

## [feature/rag-hub] — 2026-05-06

**Branch:** `feature/rag-hub`
**Scope:** Full update of `src/content/docs/claude-code/` and home page (`src/content/docs/index.mdx`)
**Baseline:** Claude Code v2.1.126 (May 6, 2026)
**Author:** Claude Code (automated)

---

### New Files Added

#### `src/content/docs/claude-code/quick-start.md`

- **Sidebar order:** 2 (immediately after section index)
- **Coverage:**
  - Installation on all platforms: macOS, Linux, WSL2, Windows PowerShell/CMD, Homebrew, WinGet, apt/dnf/pacman/AUR, npm
  - Authentication: Anthropic API key, AWS Bedrock, GCP Vertex AI
  - First session walkthrough with example prompts
  - Agentic loop diagram (ASCII flow)
  - All essential keyboard shortcuts table
  - All essential slash commands table
  - Modes of operation: Normal, Auto-Accept, Plan, Non-Interactive (CI/CD)
  - CLAUDE.md setup with recommended template and scope table
  - All 16+ built-in tools with category and purpose
  - Configuration hierarchy with precedence explanation
  - 6 common first-week patterns (codebase exploration, bug fix, feature, code review, TDD, docs)
  - Session management (resume, name, checkpoint/rewind, context compaction)
  - Cost management tips table
  - Learning path with links to next steps
  - Troubleshooting table for common problems

---

#### `src/content/docs/claude-code/hooks-deep-dive.md`

- **Sidebar order:** 5
- **Coverage:**
  - Hook architecture overview with ASCII flow diagram
  - All 30+ hook events in 4 categories: Session Lifecycle, Tool Lifecycle, Agent Lifecycle, User Interaction
  - Per-event JSON payload examples and configuration snippets
  - 5 handler types with full configuration examples:
    - `command` — shell command handler
    - `prompt` — Claude Haiku sub-LLM handler
    - `agent` — Claude sub-session handler (up to 50 turns)
    - `http` — HTTP webhook handler (v2.1.63+)
    - `mcp_tool` — MCP tool invocation handler (v2.1.118+)
  - Exit code behaviour table per event type
  - Regex matcher reference with common patterns
  - Full settings.json structure example
  - 9 practical patterns with complete code:
    1. Block dangerous Bash commands (Python guard script)
    2. Auto-format after edits (Bash, multi-language)
    3. Audit log every tool call (Python JSONL logger)
    4. Test gate — don't stop until tests pass
    5. Slack notification on task complete
    6. Inject git context at session start
    7. Prompt hook for natural language rule enforcement
    8. HTTP webhook for observability
    9. MCP tool hook for external audit system
  - Full JSON hook payload reference (TypeScript interface)
  - Tool-specific `tool_input` shapes for all major tools
  - Debugging guide: /hooks, /hooks reload, CLAUDE_HOOK_DEBUG, manual testing
  - Common hook problems table
  - Performance considerations
  - Enterprise use cases: compliance gate (PII), SOC2 audit trail (immutable log), policy enforcement

---

#### `src/content/docs/claude-code/mcp-servers-guide.md`

- **Sidebar order:** 6
- **Coverage:**
  - Architecture overview with ASCII diagram (Host → Client → Server)
  - JSON-RPC 2.0 protocol explanation
  - 3 transport types: stdio (local process), HTTP (remote), SSE (deprecated)
  - 3 MCP primitives with examples:
    - Tools — callable functions with JSON Schema input validation
    - Resources — data sources with URI patterns
    - Prompts — reusable templates with arguments
  - 4 configuration scopes: project (.mcp.json), user, local, enterprise (managed-mcp.json)
  - Environment variable expansion (`${VAR}` and `${VAR:-default}`)
  - `/mcp` management commands
  - Building custom MCP servers in 3 languages:
    - TypeScript/Node.js (with Zod, SDK tools/resources/prompts)
    - Python (with mcp package, async handlers)
    - C#/.NET (with ModelContextProtocol NuGet, DI, `CreateEmptyApplicationBuilder` note)
  - Official MCP servers list with npm install commands (12 servers)
  - Production `.mcp.json` example for typical web project
  - Security section: prompt injection, CVE-2025-6514 (mcp-remote), tool token budget, network isolation, authentication patterns
  - 5 advanced patterns: conditional loading via hooks, caching server, multi-tool domain server, MCP as RAG interface, HTTP server with Express
  - Debugging guide: CLAUDE_MCP_DEBUG, /mcp, manual JSON-RPC testing
  - Common MCP problems table
  - Token budget reference table

---

#### `src/content/docs/claude-code/agent-teams-guide.md`

- **Sidebar order:** 7
- **Coverage:**
  - Comparison table: Task tool (subagents) vs Agent Teams
  - Subagent section:
    - When to use (parallelism, isolation, specialisation, long-running tasks)
    - Spawning subagents with example prompts
    - Agent definition files (.claude/agents/<name>.md)
    - Complete YAML frontmatter schema (name, description, model, effort, tools, context, max-turns, memory, memory-scope)
    - Full agent definition example (code-reviewer)
    - Subagent memory scope (user/project/local)
    - Agent memory MEMORY.md example with project-specific rules
  - Agent Teams section (Research Preview):
    - Enable flag and settings.json configuration
    - Architecture diagram with ASCII art
    - All 6 team tools with purpose
    - 5 message types
    - 2 task states (pending → in_progress → completed/failed)
    - Filesystem layout (~/.claude/teams/<name>/)
  - 5 orchestration patterns with prompts/code:
    1. Parallel code analysis (multiple simultaneous Task calls)
    2. Orchestrator → Specialists (sequenced specialist agents)
    3. Agent Teams — feature development pipeline (4-terminal setup)
    4. CI/CD agent team (GitHub Actions with --agent flag)
    5. Subagent with custom tool restrictions (readonly-analyst)
  - 4 orchestration best practices
  - Subagent vs Agent Teams decision flowchart (ASCII)
  - Agent Teams limitations table (Research Preview, v2.1.126)
  - Complete YAML frontmatter reference for agent definitions
  - /agents management commands

---

#### `src/content/docs/claude-code/cicd-integration.md`

- **Sidebar order:** 8
- **Coverage:**
  - Non-interactive mode (`--print` flag)
  - All automation flags with purpose table
  - Permission modes table with appropriate use case
  - JSON output format with complete response structure
  - GitHub Actions (`anthropics/claude-code-action@v1`):
    - PR auto-review on every push (complete workflow YAML)
    - Respond to PR comments with @claude trigger (complete workflow YAML)
    - Automated bug fixer with PR creation (complete workflow YAML)
    - Weekly security audit with GitHub Issue creation (complete workflow YAML)
  - GitLab CI integration (complete .gitlab-ci.yml)
  - Bash/shell integration:
    - Generic task runner script
    - Pre-commit hook with security check
    - Makefile targets (ai-review, ai-fix, ai-docs)
  - AWS Bedrock in CI:
    - GitHub Actions configuration
    - Service tiers (default/flex/priority, v2.1.122+)
  - GCP Vertex AI in CI:
    - WIF authentication (v2.1.121+)
  - Security hardening: least privilege permissions JSON, secret handling, budget limits, network isolation (Docker iptables)
  - Cost optimisation: model selection strategy by task type, prompt caching, `--bare` mode
  - OpenTelemetry/observability: traces, spans, what's traced
  - Complete production workflow (3-job parallel pipeline: security-scan + code-review + test-analysis)
  - Environment variables reference table (12 variables)

---

#### `src/content/docs/claude-code/permissions-security.md`

- **Sidebar order:** 9
- **Coverage:**
  - 4-layer security model overview
  - Permission modes: 5 modes with behaviour and appropriate use
  - Tool allowlists:
    - Syntax reference (`ToolName`, `ToolName(*)`, `ToolName(value)`, `ToolName(prefix:*)`)
    - settings.json configuration
    - Precedence rule (Enterprise > deny > allow > permission mode)
    - /permissions interactive management commands
    - 3 common allowlist patterns (read-only analyst, CI/CD pipeline, developer workstation)
    - `--allowedTools` and `--disallowedTools` CLI flags
  - Sandbox architecture:
    - What the sandbox does (file system, network, process isolation)
    - Configuration options
    - 3 sandbox modes (disabled, standard, strict)
    - Cloud sessions (claude.ai/code) as fully managed sandbox
  - Enterprise managed settings:
    - Platform-specific paths (macOS, Linux, Windows, MDM/GPO)
    - 4-tier hierarchy diagram
    - Complete managed-settings.json example
    - Drop-in policy fragments
    - Enterprise CLAUDE.md (highest priority, use cases)
  - Audit logging:
    - Built-in JSONL session log format
    - Hook-based immutable audit log (Python)
    - OpenTelemetry integration
  - Security best practices for 4 audiences (individual, team, CI/CD, enterprise)
  - MCP security: prompt injection, --disallowedTools for MCP, CVE-2025-6514
  - Claude Code trust model (Operators > Users > Humans)

---

### Updated Files

#### `src/content/docs/claude-code/index.md`

Changes:
- `title` description updated to reflect new content scope
- Added `lastUpdated: 2026-05-06`
- Updated "What's New" table: added v2.1.63 (http hook handler) and v2.1.32 (Agent Teams Research Preview)
- Added "Getting Started" section with link to quick-start.md
- Redesigned Reference Guides section — now includes quick-start.md entry
- Added Topic Guides section (5 new guides)
- Added Diagrams & Interactive Tools section (7 items)
- Updated Training & Research section — added validation report entry note (229 claims)
- Added All 23 File Types at a Glance table (complete with location, scope, load condition)
- Updated Essential Slash Commands table (22 commands — added /branch, /debug, /keybindings, /team-onboarding)
- Added Built-In Tools complete table (16+ tools with category)
- Added Models Available table (4 models with context, use case, relative cost)
- Added Keyboard Shortcuts table (13 shortcuts)
- Added Deployment Surfaces table (9 surfaces)
- Added Learning Paths section with 4 paths (New, Intermediate, Advanced, CCA-F Exam)

---

#### `src/content/docs/claude-code/validation-report.md`

Changes:
- Updated frontmatter: added `description` and `lastUpdated: 2026-05-06`
- Added Section 12 with 6 sub-sections (one per new guide):
  - 12.1 quick-start.md — 11 claims
  - 12.2 hooks-deep-dive.md — 14 claims
  - 12.3 mcp-servers-guide.md — 11 claims
  - 12.4 agent-teams-guide.md — 12 claims
  - 12.5 cicd-integration.md — 11 claims
  - 12.6 permissions-security.md — 10 claims
- Updated Overall Authenticity Assessment:
  - Claims: 132 → 229 total
  - Verified: 115 → 205
  - Partial: 10 → 17
  - Unverifiable: 7 → 7 (unchanged)
  - Pass rate: 87% → 90%

---

#### `src/content/docs/claude-code/architecture.mdx`
- Updated description to explain what the diagram shows
- `sidebar.order`: 7 → 11
- Added `lastUpdated: 2026-05-06`

#### `src/content/docs/claude-code/precedence.mdx`
- Updated description with detail about pyramid, conflict resolution, scope boundaries
- `sidebar.order`: 8 → 12
- Added `lastUpdated: 2026-05-06`

#### `src/content/docs/claude-code/override-test-lab.mdx`
- Updated description with detail about 12 scenarios and what they cover
- `sidebar.order`: 9 → 13
- Added `lastUpdated: 2026-05-06`

#### `src/content/docs/claude-code/file-catalog.mdx`
- Updated description with detail about filter capabilities
- `sidebar.order`: 10 → 14
- Added `lastUpdated: 2026-05-06`

#### `src/content/docs/claude-code/claude-code-efficiency-guide.mdx`
- Updated description: version reference updated to v2.1.126, added token window simulator
- `sidebar.order`: 6 → 15
- Added `lastUpdated: 2026-05-06`

#### `src/content/docs/claude-code/context-engineering-ce.mdx`
- `sidebar.order`: 15 → 16
- Added `lastUpdated: 2026-05-06`

#### `src/content/docs/claude-code/advisor-diagram.mdx`
- `sidebar.order`: 14 → 17
- Added `lastUpdated: 2026-05-06`

---

#### `src/content/docs/index.mdx` (home page)

Changes:
- Terminal modules line: `docs` → `claude-code` (reflects actual section name)
- Terminal output: `30+` → `75+` resources ready
- Stats bar: Claude Code Docs count `14` → `20`
- Stats bar: Total Resources `60+` → `75+`
- Claude Code section card description: updated to mention quick start, 5 new guides, 7 interactive diagrams
- Claude Code section card count: `14 reference docs` → `20 reference docs · 7 interactive guides`

---

### Files Intentionally NOT Changed

These files were already comprehensive and up to date through v2.1.126:

| File | Lines | Reason |
|------|-------|--------|
| `claude-code-reference.md` | 2,704 | Covers all features through v2.1.126 exhaustively |
| `claude-code-all-markdown-files-catalog.md` | 1,276 | Complete 23-file-type catalog, current |
| `claude-code-config-guide.md` | 1,439 | Full decision framework, current |
| `claude-code-efficiency-reference.md` | 1,344 | Complete efficiency reference, current |
| `claude-training.md` | 1,344 | 8-module training curriculum, current |
| `compass-research-notes.md` | 1,955 | CCA-F exam research, all 5 domains, current |

---

### Summary Statistics

| Metric | Before | After |
|--------|--------|-------|
| Total files in claude-code/ | 15 | 21 |
| New .md guide files | 0 | 6 |
| Total content lines (claude-code/) | ~10,700 | ~17,000+ |
| Validated claims | 132 | 229 |
| Claim pass rate | 87% | 90% |
| Home page "Claude Code Docs" count | 14 | 20 |
| Home page total resources | 60+ | 75+ |
