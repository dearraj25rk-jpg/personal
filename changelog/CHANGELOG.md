# Documentation Changelog

> **Note:** This file tracks documentation changes and is NOT published to the website.
> It is stored in `changelog/` which is excluded from the site build.

---

## [Unreleased] — Branch: feature/rag-hub

### Updated: May 6, 2026

#### Claude Code Section (`src/content/docs/claude-code/`)

**Major Updates:**

- **`claude-code-reference.md`** — Updated `lastUpdated` to 2026-05-06. Added ASCII diagrams:
  - Section 3.1.1: Agentic Loop visual flow (three-phase loop with control mechanisms)
  - Section 3.2.1: Context window composition (200K/1M token budget breakdown)
  - Hook execution lifecycle (session lifecycle with injection points)
  - Agent team topology (Lead/Teammates vs SubAgent comparison)

- **`claude-code-config-guide.md`** — Added 5 new sections:
  - Document scope metadata line (v2.1.126, May 6, 2026)
  - Visual Architecture Overview ASCII diagram (always-loaded vs on-demand vs settings)
  - Section 3.4: Path-Scoping Decision Map with decision tree
  - Section 4.3.1: SKILL.md Frontmatter complete field reference
  - Section 5.2: Context Load Order detailed sequence (13-step order)

- **`claude-code-efficiency-reference.md`** — Added 6 new sections:
  - `lastUpdated: 2026-05-06` frontmatter
  - Section 1.2: Context Assembly Order table (10-row, with cache eligibility)
  - Section 2.3: Cache Hit/Miss Flow ASCII decision diagram
  - Compaction Decision Logic ASCII diagram
  - Section 11.1: Cost Impact Visualization (cumulative savings chart)
  - Sources date updated to May 6, 2026

- **`claude-training.md`** — Major expansion (677 → ~1800+ lines):
  - Added Learning Objectives to all 8 modules
  - Added ASCII diagrams (agent topology, hook lifecycle, MCP architecture, RAG pipeline)
  - Expanded code examples for all major features
  - Added Common Mistakes sections
  - Added Quick Reference tables
  - Made content general (not just .NET/Azure)
  - Expanded Conclusion with "Next Steps"

- **`claude-code-all-markdown-files-catalog.md`** — Added:
  - Configuration Layers visual precedence map
  - Token Budget Summary by Load Tier table

- **`compass-research-notes.md`** — Added Appendix:
  - v2.1.x feature timeline table (v2.1.32–v2.1.126)
  - Five most-tested CCA exam concepts
  - Common CCA exam traps table

- **`validation-report.md`** — Updated:
  - Last reviewed date to May 6, 2026
  - Added Section 11: Additional verified claims (v2.1.108–v2.1.126)
  - Updated Overall Authenticity Assessment totals

- **`index.md`** (section landing) — Added:
  - "What's New (v2.1.108–v2.1.126)" table
  - "Getting Started" section with learning paths

- **`file-catalog.mdx`** — Updated description: "16 file types" → "23 file types"
- **`architecture.mdx`** — Updated description: "16 markdown file types" → "23 markdown file types"

#### Home Page (`src/content/docs/index.mdx`)

- Updated terminal initialization string to "Context v2.1.126"
- Updated Claude Code card description: "16 file types" → "23 file types"
- Updated Architecture Diagram card description: "16" → "23" markdown file types

---

## Previous History

For earlier documentation history, see git log on the `dev` and `main` branches.
