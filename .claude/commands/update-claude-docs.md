---
description: Full update routine for src/content/docs/claude-code/ and home page. Phase 1 = mechanical fixes (dates, versions, frontmatter via bash — no AI). Phase 2 = AI content refresh (adds only missing diagrams/sections). Phase 3 = verification report. Phase 4 = commit + push. Usage: /update-claude-docs [version] [YYYY-MM-DD] — both args optional.
allowed-tools: Bash, Read, Edit, Write
---

# Claude Code Docs — Full Update Routine

**Arguments:** $ARGUMENTS  
Parse: first token = new version string (e.g. `v2.1.130`), second = override date (e.g. `2026-06-15`). Both optional.

Run every phase in order. Do not skip any phase. Do not stop early.

---

## Phase 1 — Mechanical Fixes (bash only, zero AI file reading)

### 1.1 Set working variables

```bash
TODAY=$(date +%Y-%m-%d)
HUMAN_DATE=$(date "+%B %-d, %Y")
BRANCH=$(git branch --show-current)
echo "TODAY=$TODAY | HUMAN=$HUMAN_DATE | BRANCH=$BRANCH"
```

If `$ARGUMENTS` contains a date override (second token matching `[0-9]{4}-[0-9]{2}-[0-9]{2}`), use that instead of `$TODAY`. If `$ARGUMENTS` contains a version (first token matching `v[0-9]+\.[0-9]+\.[0-9]+`), capture it as `NEW_VERSION`.

### 1.2 Update all frontmatter `lastUpdated`

```bash
find src/content/docs/claude-code src/content/docs/index.mdx \
  -type f \( -name "*.md" -o -name "*.mdx" \) \
  -exec grep -l "lastUpdated:" {} \; \
  | xargs sed -i "s/lastUpdated: [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/lastUpdated: $TODAY/g"
```

### 1.3 Update inline version-date strings

These are the `(Month D, YYYY)` patterns that appear in `> **Version:**` and `> **Last updated:**` lines:

```bash
# Update (Month D, YYYY) patterns — version header parentheses
find src/content/docs/claude-code -type f -name "*.md" \
  | xargs sed -i -E "s/\([A-Z][a-z]+ [0-9]{1,2}, 202[0-9]\)/($HUMAN_DATE)/g"

# Update "Last updated: Month D, YYYY" patterns
find src/content/docs/claude-code -type f -name "*.md" \
  | xargs sed -i -E "s/(\*\*Last [Uu]pdated[:\*]+[ ]*)([A-Z][a-z]+ [0-9]{1,2}, 202[0-9])/\1$HUMAN_DATE/g"

# Update "Last Updated: Month D, YYYY" (plain text variant)
find src/content/docs/claude-code -type f -name "*.md" \
  | xargs sed -i -E "s/(Last Updated: )([A-Z][a-z]+ [0-9]{1,2}, 202[0-9])/\1$HUMAN_DATE/g"
```

### 1.4 Update version number across all files (only if NEW_VERSION provided)

Detect the current version from index.md, then replace across all files:

```bash
CURRENT_VER=$(grep -o "v2\.[0-9]*\.[0-9]*" src/content/docs/claude-code/index.md | sort -V | tail -1)
echo "Current version detected: $CURRENT_VER"
# If NEW_VERSION was parsed from $ARGUMENTS and differs from CURRENT_VER:
# find src/content/docs/claude-code src/content/docs/index.mdx \
#   -type f \( -name "*.md" -o -name "*.mdx" \) \
#   | xargs sed -i "s/$CURRENT_VER/$NEW_VERSION/g"
```

Only run the replacement lines if a new version was explicitly provided. Otherwise skip.

### 1.5 Phase 1 summary

```bash
echo "=== Phase 1 complete ==="
git diff --stat src/content/docs/claude-code/ src/content/docs/index.mdx
```

---

## Phase 2 — Content Audit and Refresh

**Token efficiency rule:** Run `grep` checks BEFORE reading any file. Only read and edit files where required sections are confirmed missing. Never read a full file — use `tail -50` to find the append point, or `grep -n` to locate a specific section.

**Never duplicate existing content.** If `grep -q "PATTERN" FILE` exits 0, that section already exists — skip it.

### 2.1 Audit all files in one pass

```bash
echo "=== Content Audit ==="
for f in src/content/docs/claude-code/*.md src/content/docs/claude-code/*.mdx; do
  sections=$(grep -c "^## " "$f" 2>/dev/null || echo 0)
  has_ascii=$(grep -cP "┌|│|└|╔|╗|═" "$f" 2>/dev/null || echo 0)
  wc_lines=$(wc -l < "$f")
  echo "$f  lines=$wc_lines  h2_sections=$sections  ascii_blocks=$has_ascii"
done
```

Review this output. Files with `ascii_blocks=0` or very few sections likely need content work.

### 2.2 Per-file required sections checklist

For each file, run the grep check first. Add the section only if the grep exits non-zero (not found).

| File | grep check pattern | What to add if missing |
|------|--------------------|------------------------|
| `index.md` | `CLAUDE CODE ECOSYSTEM` | ASCII ecosystem overview diagram showing Configure/Extend/Integrate/Models quadrants |
| `quick-start.md` | `first-week mistakes\|Installation.*Tree\|decision tree` | Installation decision tree + top-10 first-week mistakes section |
| `hooks-deep-dive.md` | `LIFECYCLE\|lifecycle flowchart\|Security Gate` | Hook lifecycle ASCII flowchart + security gates code pattern |
| `mcp-servers-guide.md` | `Host.*Client.*Server\|stdio vs HTTP` | Host→Client→Server ASCII diagram + stdio/HTTP transport comparison table |
| `agent-teams-guide.md` | `Sequence\|sequence diagram\|Cost Estimation` | Orchestrator→worker sequence diagram + cost estimation table |
| `cicd-integration.md` | `Azure DevOps\|PIPELINE FLOW\|Security Hardening Checklist` | Pipeline flow diagram + Azure DevOps YAML + security checklist |
| `permissions-security.md` | `SECURITY LAYER\|Security Layer\|Enterprise.*Checklist` | Security layer ASCII diagram + enterprise checklist |
| `sdk-guide.md` | `SUBPROCESS\|subprocess architecture\|Streaming Event` | Subprocess architecture diagram + streaming event types table |
| `models-pricing.md` | `Model Selection.*Flow\|selection flowchart\|Cost Scenario` | Model selection flowchart + 3 real-world cost examples |
| `memory-management.md` | `7.*[Mm]emory\|memory hierarchy\|Compaction.*[Dd]ecision` | 7-type memory hierarchy diagram + compaction decision guide |
| `output-styles-guide.md` | `Style Comparison\|style comparison\|Creation Walkthrough` | Style comparison table (same prompt, 4 styles) + creation walkthrough |
| `plugins-guide.md` | `Plugin.*[Dd]ebug\|debug guide\|directory structure` | Plugin directory structure diagram + debugging guide |
| `slash-commands-reference.md` | `[Bb]y [Cc]ategory\|Practical Example\|practical example` | Commands organized by category + 10 practical command examples |
| `claude-code-all-markdown-files-catalog.md` | `[Ll]oad-[Oo]rder\|Anti-[Pp]attern\|decision flowchart` | Load-order timeline diagram + anti-patterns section |
| `claude-code-config-guide.md` | `Decision Tree\|[Mm]onorepo.*[Pp]attern` | CLAUDE.md vs Rules vs Skills ASCII decision tree + monorepo patterns |
| `claude-code-efficiency-reference.md` | `Token Budget\|token budget\|[Cc]aching.*[Ee]xample` | Token budget visualization + prompt caching calculation examples |
| `claude-code-reference.md` | `Quick Navigation\|Troubleshooting Reference` | Quick Navigation box + troubleshooting reference section |
| `worktrees-guide.md` | `[Ww]orktree.*[Rr]elationship\|[Cc]lone vs\|CI.*[Pp]arallel` | Worktree relationship ASCII diagram + clone vs worktree comparison |
| `claude-training.md` | `Learning Path\|learning path\|Assessment Rubric` | Learning path overview diagram + skill assessment rubric table |
| `compass-research-notes.md` | `[Dd]omain [Mm]ap\|[Hh]igh-[Yy]ield` | 5-domain study map diagram + high-yield facts per domain |
| `validation-report.md` | `$(date +%Y).*[Vv]alidat\|May 2026\|May 17, 2026` | Current-month validation section with updated claim totals |
| `index.mdx` (home page) | `35 Claude Code\|21 reference\|Interactive Tools` | Updated stats bar + all interactive tool card links |

### 2.3 Processing instructions

For each file where the grep check shows a missing section:

1. Run: `grep -n "^## " <file> | tail -10` — see the last few sections
2. Run: `tail -30 <file>` — find where to append
3. Write the missing section using the Edit tool, inserting before the final `---` + sources line
4. Use ASCII box-drawing characters for all diagrams (`┌ ─ ┐ │ └ ┘ ├ ┤ ╔ ═ ╗ ║ ╚ ╝`)
5. No Mermaid syntax — not configured in this site
6. Each added section should be self-contained: heading + diagram/table/code + brief explanation

Process files in batches of 3 where grep checks can run in parallel. Only serialize the Edit calls (one file at a time to avoid conflicts).

---

## Phase 3 — Verification Report

```bash
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║           CLAUDE CODE DOCS — UPDATE REPORT           ║"
echo "╠══════════════════════════════════════════════════════╣"
echo "  Date   : $(date +%Y-%m-%d)"
echo "  Branch : $(git branch --show-current)"
echo "  Commit : (pending)"
echo "╠══════════════════════════════════════════════════════╣"

# All files in scope
ALL_FILES=$(find src/content/docs/claude-code -type f \( -name "*.md" -o -name "*.mdx" \) | sort)
TOTAL_FILES=$(echo "$ALL_FILES" | wc -l)

# Files modified in this session (against HEAD)
MODIFIED=$(git diff --name-only src/content/docs/claude-code/ src/content/docs/index.mdx | sort)
MODIFIED_COUNT=$(echo "$MODIFIED" | grep -c . || echo 0)

echo "  Total files in scope : $TOTAL_FILES"
echo "  Modified this run    : $MODIFIED_COUNT"
echo "╠══════════════════════════════════════════════════════╣"
echo "  MODIFIED:"
echo "$MODIFIED" | sed 's|src/content/docs/claude-code/|    ✓ |; s|src/content/docs/||'

# Find files NOT modified
NOT_MODIFIED=$(comm -23 \
  <(echo "$ALL_FILES" | sed 's|src/content/docs/||') \
  <(echo "$MODIFIED" | sed 's|src/content/docs/||'))

echo "╠══════════════════════════════════════════════════════╣"
echo "  NOT MODIFIED (verify these are intentionally skipped):"
if [ -z "$(echo $NOT_MODIFIED | tr -d ' ')" ]; then
  echo "    (none — all files updated)"
else
  echo "$NOT_MODIFIED" | sed 's/^/    ✗ /'
fi
echo "╠══════════════════════════════════════════════════════╣"
git diff --stat src/content/docs/claude-code/ src/content/docs/index.mdx | tail -1 | sed 's/^/  /'
echo "╚══════════════════════════════════════════════════════╝"
```

**If any file appears in "NOT MODIFIED" unexpectedly:** go back to Phase 2 and process it before continuing to Phase 4.

---

## Phase 4 — Commit and Push

Stage all changes:

```bash
git add src/content/docs/claude-code/ src/content/docs/index.mdx
git status --short
```

Review the staged files. Then commit:

```bash
DATE_TAG=$(date +%Y-%m-%d)
VER_TAG=$(grep -o "v2\.[0-9]*\.[0-9]*" src/content/docs/claude-code/index.md | sort -V | tail -1)

git commit -m "docs: claude-code section update $DATE_TAG ($VER_TAG)

Phase 1: mechanical — frontmatter dates, inline version strings normalized
Phase 2: content — missing diagrams and sections added where absent
Phase 3: all files verified in report before commit

Generated by /update-claude-docs slash command."
```

Push to current branch:

```bash
git push -u origin $(git branch --show-current)
echo "✓ Pushed | Branch: $(git branch --show-current) | Commit: $(git rev-parse --short HEAD)"
```

---

## Notes

- **Idempotent:** grep checks in Phase 2 prevent duplicate sections. Running twice is safe.
- **No data loss:** Phase 2 only appends. Existing content is never modified or deleted.
- **Skip Phase 4** if you want to review the diff before committing: just stop after Phase 3.
- **Version bump:** Pass new version as first argument: `/update-claude-docs v2.1.130` to update version strings sitewide.
- **Date override:** Pass a specific date as second argument: `/update-claude-docs v2.1.130 2026-06-01`.
