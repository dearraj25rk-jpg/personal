---
title: Output Styles — Complete Reference
description: >
  Complete guide to Claude Code Output Styles — how output styles modify Claude's system
  prompt, the three built-in styles (Default, Explanatory, Learning), creating custom styles,
  keep-coding-instructions behavior, token cost implications, project-level team styles,
  and practical examples for architecture, teaching, terse CI, and documentation workflows.
  Claude Code v2.1.126 (May 2026).
sidebar:
  order: 14
  label: Output Styles
lastUpdated: 2026-05-19
---

# Output Styles — Complete Reference

> **Version:** v2.1.126 (May 19, 2026) · Output styles introduced in v2.0.0.

Output styles are the **most invasive configuration lever** in Claude Code. They directly replace the software-engineering-specific portion of Claude's system prompt, changing not just what Claude says but how it reasons, structures its responses, and behaves during coding sessions.

Use them deliberately. This guide explains exactly what they do, when to use them, and how to build your own.

---

## 1. What Output Styles Do

### The Configuration Mechanism Landscape

Claude Code has several ways to influence Claude's behavior. Understanding where output styles fit is essential:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Claude's Effective Prompt                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Core System Prompt (Anthropic-controlled, immutable)    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            +                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SE-Specific System Prompt Block                         │  │
│  │  (software engineering instructions)                     │  │
│  │                                                          │  │
│  │  ◄── OUTPUT STYLE REPLACES THIS BLOCK ────────────────►  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            +                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  --append-system-prompt                                  │  │
│  │  (appended verbatim to system prompt)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                            +                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  CLAUDE.md content                                       │  │
│  │  (injected as first human turn, not system prompt)       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Each mechanism is distinct:**

| Mechanism | What it does | Position | Best for |
|-----------|-------------|----------|---------|
| `CLAUDE.md` | Project context, coding standards, architecture notes | First human turn (not system prompt) | Project-specific knowledge |
| `--append-system-prompt` | Appends text to the system prompt | After all system prompt blocks | Session-level overrides |
| Output Style | **Replaces** the SE-specific system prompt block | Replaces a block | Changing how Claude codes and responds |

### What the SE-Specific Block Contains

The SE-specific system prompt block (the block output styles can replace) contains instructions that make Claude Code a coding assistant rather than a general assistant. By default it includes instructions like:

- "Verify your changes compile and tests pass before presenting them as complete"
- "Read relevant documentation and existing code before making changes"
- "Prefer targeted edits over rewrites"
- "When uncertain, ask a clarifying question rather than guessing"
- "Format code consistently with the surrounding codebase"

When you apply an output style without `keep-coding-instructions: true`, **all of these disappear** and are replaced by your style's content. That is why `keep-coding-instructions` matters so much (see [Section 4](#4-keep-coding-instructions-behavior)).

### Impact on Token Costs

Output styles affect both input and output token counts:

- **Input tokens:** Your style content is injected into the system prompt on every turn. First-turn input is larger; subsequent turns benefit from prompt caching.
- **Output tokens:** Styles like Explanatory and Learning produce significantly longer responses. This is the dominant cost driver.

A verbose custom style can double Claude's output token usage compared to Default. Plan accordingly for high-volume or CI contexts.

---

## 2. How Styles Are Applied

### Activation Methods

**Method 1: Via `/config` in-session**

```
/config → Output Style → [select a style]
```

The selection is saved to your user settings (`~/.claude/settings.json`) and takes effect for the **next new session**.

**Method 2: Via settings.json**

```json
{
  "outputStyle": "explanatory"
}
```

Valid values: `"default"`, `"explanatory"`, `"learning"`, or the name of any custom style file (without the `.md` extension).

**Method 3: Plugin styles**

Plugin-contributed styles appear in the `/config` menu automatically. Reference them by their namespaced name:

```json
{
  "outputStyle": "deploy-helper: concise"
}
```

### Why Changes Don't Take Effect Mid-Session

Output styles are part of the system prompt. The system prompt is **fixed at session start** and does not change during a session. This is not a limitation — it is intentional:

**Prompt cache stability.** Claude Code maintains a prompt cache (both with Anthropic's infrastructure and locally). Mid-session system prompt changes would invalidate the cache, dramatically increasing latency and cost for the remainder of the session.

If you change your output style in `/config` mid-session, you will see: `Output style updated. Takes effect at next session start.`

Start a new session (`/exit` then `claude`) to activate the new style immediately.

---

## 3. Built-in Styles

Claude Code ships with three built-in output styles.

### 3.1 Default

The standard Claude Code software engineering system prompt. This is what you get with no output style configured.

**What it instructs Claude to do:**
- Verify changes compile and tests pass before claiming success
- Read relevant source files and documentation before editing
- Make targeted, minimal changes rather than rewrites
- Follow existing code conventions
- Ask clarifying questions when requirements are ambiguous
- Use available tools (Read, Bash, Grep) proactively to understand context

**Best for:** Everyday software development. All other styles are departures from this baseline — understand what you are giving up before switching.

**Response length:** Moderate. Claude explains what it did and why, but keeps explanations proportionate to complexity.

---

### 3.2 Explanatory

Adds structured "Insights" sections between coding steps. Every significant code action is accompanied by an explanation of the trade-offs considered, alternatives rejected, and architectural principles applied.

**What it adds to the system prompt (in addition to core SE instructions):**

> After each meaningful code change, add an **Insights** section that explains: the trade-off considered, alternatives you rejected and why, any patterns or principles this decision follows or breaks, and what a future maintainer should know about this choice.

**Example response shape:**

```
I'll update the authentication middleware to support OAuth2.

[code changes]

**Insights**
- Chose the Authorization Code Flow over Client Credentials because the app acts
  on behalf of users (not machine-to-machine).
- Rejected storing tokens in localStorage due to XSS exposure; using httpOnly
  cookies with SameSite=Strict instead.
- The `refreshToken` function follows the existing `retryWithBackoff` pattern
  already used in `apiClient.ts` — deliberately consistent.
- Future maintainers: the token refresh is triggered by a 401 interceptor in
  `apiClient.ts:47`, not at the call site. This is intentional to centralize refresh logic.
```

**Best for:**
- Learning an unfamiliar codebase
- Code review preparation — Insights surface what to look for
- Onboarding new team members
- Complex architectural decisions that need documentation

**Response length:** Significantly longer than Default. Each Insight section adds 100–300 tokens of output per code block.

---

### 3.3 Learning

Collaborative, learn-by-doing mode. Claude acts as a tutor rather than an implementer. It explains what needs to be done and why, then leaves implementation gaps marked with `TODO(human)` for you to fill in.

**What it instructs Claude to do:**

> This is a deliberate learning session. Do not write complete implementations. Instead:
> - Explain the problem and the approach
> - Write the structure and interfaces
> - Mark implementation gaps with `TODO(human): [what to implement and why]`
> - After each gap, explain what the implementation should accomplish
> - When the user fills in a TODO, review it and give specific feedback

**Example response shape:**

```
To implement the binary search, let's start with the interface and structure:

```python
def binary_search(arr: list[int], target: int) -> int:
    """
    Returns the index of target in arr, or -1 if not found.
    Assumes arr is sorted in ascending order.
    """
    left, right = 0, len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2  # Why not (left + right) / 2?
        
        # TODO(human): Compare arr[mid] to target.
        # If equal: return mid.
        # If target is greater: which half do we search next?
        # If target is smaller: which half?
        # Think about what makes binary search O(log n).
        pass
    
    return -1
```

The `mid = (left + right) // 2` expression is deliberate — can you think of a case where `(left + right) / 2` would overflow in a language with fixed-width integers?
```

**Best for:**
- Deliberate practice of algorithms and patterns
- Learning a new language or framework by doing
- Interview preparation
- Mentoring — run Learning mode when pair-programming to teach

**Response length:** Moderate. Less code produced than Default (gaps left for human), but more prose explanation.

---

## 4. `keep-coding-instructions` Behavior

This single frontmatter key in custom styles is the most important flag to understand correctly.

### When `false` (the default)

The SE-specific system prompt block is **removed entirely** and replaced with your style's content.

```
System Prompt = [Core Anthropic Prompt] + [Your Style Content]
```

Claude no longer has instructions to verify changes, run tests, read documentation first, or follow coding conventions. It will produce responses shaped entirely by your style.

> **Warning:** Setting `keep-coding-instructions: false` for a coding-focused style is almost always a mistake. Use it only for styles that are explicitly replacing coding behavior entirely (for example, a style that turns Claude into a documentation-only assistant that never touches code).

### When `true`

The SE-specific system prompt block is **kept**, and your style content is appended after it.

```
System Prompt = [Core Anthropic Prompt] + [SE-Specific Block] + [Your Style Content]
```

Claude retains all its software engineering discipline — it still verifies changes, runs tests, reads docs — while also following your additional style instructions.

> **Best practice:** Always set `keep-coding-instructions: true` for any custom style intended for use during coding sessions.

### Decision Guide

```
Is this style for use during coding tasks?
├── Yes → keep-coding-instructions: true
│          (add behavior on top of SE instructions)
└── No  → keep-coding-instructions: false (default)
           (replace SE block — only for non-coding styles)
```

---

## 5. Creating Custom Output Styles

### File Format

Custom output styles are markdown files with YAML frontmatter:

```markdown
---
name: "Architect"
description: "System design focused — trade-offs, patterns, ADRs"
keep-coding-instructions: true
---

When responding to any coding or design task:

1. Before implementing anything, state the key architectural decision being made
2. Identify at least two alternative approaches and explain why you chose this one
3. Note any patterns this decision follows (CQRS, event sourcing, hexagonal, etc.)
4. If the decision has significant trade-offs, flag them explicitly
5. For significant changes, offer to draft an Architecture Decision Record (ADR)

Format: Use headers to separate Design Decision, Implementation, and Trade-offs sections.
```

### Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name shown in `/config` menu |
| `description` | string | Yes | One-line description shown in menu and settings |
| `keep-coding-instructions` | boolean | No | Default `false` — see [Section 4](#4-keep-coding-instructions-behavior) |

### Custom Style Frontmatter Reference

```markdown
---
name: technical-review              # Required: unique style identifier
description: >                      # Required: shown in /config menu
  Structured technical review format with severity ratings
  and actionable recommendations. Best for code review tasks.
keep_coding_instructions: true      # Optional: preserve existing session instructions
model_preference: claude-opus-4-7   # Optional: prefer specific model for this style
effort_preference: high             # Optional: effort level hint
---

# Technical Review Style

When activated, respond in this format for all code review requests:

## Review Summary
**Severity level:** [Critical | High | Medium | Low | Info]
**Files reviewed:** [list]

## Findings

### [Issue Title] — [Severity]
**File:** `path/to/file.ts:42`  
**Impact:** [What breaks if not fixed]  
**Fix:** [Specific code change]

## Test Coverage
[Assessment of test gaps]

## Recommendations
1. [Priority fix]
2. [Secondary fix]
```

### Storage Locations

**Personal styles** — travel with you across all projects:

```
~/.claude/output-styles/
├── architect.md
├── terse.md
└── teaching.md
```

**Project styles** — shared with the team via git:

```
.claude/output-styles/
├── team-architect.md
└── team-terse.md
```

When both personal and project styles exist with the same name, project styles take precedence (following the standard settings hierarchy).

**Plugin styles** — contributed by plugins (see [Section 9](#9-output-styles-in-plugins)):

```
~/.claude/plugins/node_modules/@myorg/my-plugin/output-styles/
└── concise.md
```

### Activating a Custom Style

After placing the file in the correct directory:

1. Open a new Claude Code session
2. `/config` → Output Style → find your style by its `name` field
3. Select it — the setting is saved to `~/.claude/settings.json`

Or set directly in settings:

```json
{
  "outputStyle": "Architect"
}
```

The value matches the `name` field in the frontmatter (case-insensitive).

---

## 6. Practical Style Examples

### 6.1 `architect.md` — System Design Focused

```markdown
---
name: "Architect"
description: "System design focus — surfaces trade-offs, patterns, and ADRs on every significant decision"
keep-coding-instructions: true
---

You are operating in Architect mode. For every significant code change or design task:

**Before implementing:**
- Identify the core design decision being made
- State at least two alternative approaches
- Explain your choice concisely (1-3 sentences)

**While implementing:**
- Call out pattern usage explicitly: "Following Repository Pattern here..."
- Flag coupling or boundary violations as you encounter them
- Note where this code will interact with other system components

**After implementing:**
- Provide a "Design Summary" section with:
  - Decision made
  - Alternatives considered
  - Key trade-offs accepted
  - Offer to write an ADR if the decision is significant

**Format guidance:**
Use `### Design Decision`, `### Implementation`, and `### Trade-offs` headers for
responses involving significant architectural choices.
```

---

### 6.2 `terse.md` — Minimal CI/CD Output

```markdown
---
name: "Terse"
description: "Minimal output — code only, no explanations. Ideal for CI/automated contexts."
keep-coding-instructions: true
---

Respond with the absolute minimum necessary. Rules:

- No preamble ("Sure!", "Of course", "I'll help you...")
- No explanation unless explicitly asked
- No "Here's the code:" before code blocks
- For code changes: show diffs or the changed code only, not unchanged context
- For Bash commands: show the command and exit code only
- For errors: state the error and the fix, nothing else
- For questions: answer in one sentence when possible

If you must explain, use a single sentence. If a list is needed, keep items to five words or fewer.
```

---

### 6.3 `teaching.md` — Socratic Method

```markdown
---
name: "Teaching"
description: "Step-by-step teaching with Socratic questioning — for deliberate learning sessions"
keep-coding-instructions: true
---

You are in Teaching mode. Your goal is the user's understanding, not task completion speed.

**Core behaviors:**

1. **Define before using.** If you introduce a concept, define it in one sentence first.

2. **Ask before telling.** Before explaining something, ask "What do you think X does?" or
   "Why might we choose Y over Z here?" Wait for a response before continuing.

3. **Explain the why before the how.** Never show code without first explaining what problem
   it solves and why this approach addresses it.

4. **Check understanding.** After each significant concept, ask a check question:
   "Does that distinction between X and Y make sense?"

5. **Build incrementally.** Show the simplest possible version first, then add complexity.
   Never show a final solution when a partial solution teaches better.

6. **Celebrate correct reasoning.** When the user reasons correctly, acknowledge it
   specifically: "Exactly — you identified why memoization helps here."

7. **Redirect, don't correct.** When the user is wrong, ask a question that leads them
   to discover the mistake rather than stating it directly.

**Do not:**
- Write complete implementations unprompted
- Use `TODO(human)` (that is Learning mode) — in Teaching mode, discuss before coding
- Skip the Socratic check even when the user says "just show me"
  (redirect: "I will, but first — what's your intuition about why we'd need this?")
```

---

### 6.4 `documentation.md` — Doc-First Development

```markdown
---
name: "Documentation"
description: "Doc-first style — always generates documentation alongside code changes"
keep-coding-instructions: true
---

You are in Documentation mode. Every code change is accompanied by documentation.

**Rules:**

For every function, method, or class you create or significantly modify:
1. Write or update the docstring/JSDoc/XML doc comment first
2. Include: purpose, parameters (with types), return value, exceptions/errors, example usage
3. If the function is complex, add inline comments at non-obvious decision points

For every file you modify significantly:
1. Check if there is a README or module-level docstring — update it if needed
2. If a public API changes, note it explicitly: "Public API change: [what changed]"

For architectural changes:
1. Offer to update or create an Architecture Decision Record (ADR) in `docs/adr/`
2. Format: `NNNN-short-title.md` using the MADR template

**Documentation quality bar:**
- A new team member should understand the purpose of any function from its docstring alone
- Avoid documenting *what* the code does (the code shows that); document *why* and *when to use it*
- Examples in docstrings should be copy-paste runnable
```

---

## 7. Token Cost Implications

Understanding the token economics of output styles helps you choose the right style for the right context.

### Input Token Costs

Every Claude Code turn has a system prompt. Output styles affect the size of the SE-specific block:

| Style | SE Block Size (approx) | Notes |
|-------|----------------------|-------|
| Default | ~800 tokens | Standard SE instructions |
| Explanatory | ~900 tokens | Default + Insights instruction |
| Learning | ~850 tokens | Modified SE block |
| Custom (terse) | ~200 tokens | Short instruction |
| Custom (architect) | ~600 tokens | Medium instruction |
| Custom (teaching) | ~700 tokens | Rich instruction |

**After turn 1:** Claude Code benefits from prompt caching. The system prompt (including your style) is cached, so subsequent turns pay only for the cache read cost, not full input pricing. For long sessions this makes system prompt size nearly irrelevant to overall cost.

### Output Token Costs

Output tokens are almost always the dominant cost driver when using verbose styles:

| Style | Relative Output Token Volume | Why |
|-------|-------------------------------|-----|
| Default | 1x (baseline) | Balanced explanations |
| Explanatory | 2–3x | Insights sections per change |
| Learning | 0.7x | Code gaps reduce output |
| Terse | 0.3x | Minimal prose |
| Architect | 1.5–2x | Design summaries |
| Teaching | 1.5x | Explanations + questions |
| Documentation | 1.8x | Docstrings + docs |

### Measuring Your Style's Cost

Use `/usage` within a session to see cumulative token counts:

```
/usage

Session token usage:
  Input tokens:    48,291  (42,000 cached + 6,291 uncached)
  Output tokens:   31,847
  Cache writes:    12,440
  Estimated cost:  $0.34
```

To measure style overhead:
1. Run a representative task in Default style; note output tokens
2. Run the same task in your custom style; note output tokens
3. The ratio is your style's output multiplier

### When Cost Matters Most

- **CI/CD pipelines** — use Terse to minimize output tokens; you rarely need explanations in automated contexts
- **Interactive development** — Explanatory or Architect are worth the cost; understanding beats speed
- **High-volume tasks** (processing many files) — prefer Default or Terse
- **Learning sessions** — Learning mode is actually economical; you produce the implementation, not Claude

---

## 8. Activating Styles via settings.json

### User-Global Configuration

Stored in `~/.claude/settings.json`. Applies to all sessions for the current user:

```json
{
  "outputStyle": "Architect"
}
```

### Project-Level Configuration

Stored in `.claude/settings.json` (committed to the repo). Shared with the whole team:

```json
{
  "outputStyle": "team-architect"
}
```

The style name must match a `name` field in a style file accessible to all team members — meaning it must live in `.claude/output-styles/` (also committed to the repo).

### Precedence

The standard Claude Code settings hierarchy applies:

```
Managed policy  (highest)
    ↓
Local settings  (.claude/settings.local.json)
    ↓
Project settings (.claude/settings.json)
    ↓
User settings   (~/.claude/settings.json)
    ↓
Default         (lowest)
```

A project-level `outputStyle` overrides the user's personal preference. Teams can enforce a consistent style this way.

### Style Name Resolution

When Claude Code resolves `"outputStyle": "MyStyle"`:

1. Check built-in styles: `"default"`, `"explanatory"`, `"learning"`
2. Check personal styles: `~/.claude/output-styles/<name>.md` (case-insensitive `name` field match)
3. Check project styles: `.claude/output-styles/<name>.md`
4. Check plugin styles: all loaded plugin output styles (namespaced)
5. If not found: fall back to Default and log a warning

---

## 9. Output Styles in Plugins

Plugins can contribute output styles that appear in the `/config` → Output Style menu alongside built-in and personal styles.

### Plugin Style Location

Within the plugin package:

```
my-plugin/
└── output-styles/
    ├── concise.md
    └── verbose-debug.md
```

The `outputStyles` key in `plugin.json` points to the directory:

```json
{
  "outputStyles": "output-styles"
}
```

### Namespacing

Plugin styles are displayed in the menu with the plugin name as a prefix:

```
Built-in:  Default | Explanatory | Learning
Personal:  Architect | Terse
Plugin:    deploy-helper: concise | deploy-helper: verbose-debug
```

The `name` field in the style frontmatter is the display name after the namespace prefix.

### Referencing Plugin Styles in settings.json

```json
{
  "outputStyle": "deploy-helper: concise"
}
```

The value is `"plugin-name: style-name"` where `style-name` matches the `name` field in the style file.

### Plugin Style Format

Plugin styles use the identical format as personal styles:

```markdown
---
name: "concise"
description: "Minimal output — deployment actions only, no commentary"
keep-coding-instructions: true
---

For deployment and release tasks: output commands and their results only.
No explanation. No preamble. No post-action commentary unless there is an error.
```

---

## 10. Best Practices

### Choosing the Right Mechanism

```
What do you need?
│
├── Project context (architecture, standards, patterns)
│   → CLAUDE.md  (human turn, always available, no token cost tradeoff)
│
├── Session-level behavior override (single flag, one session)
│   → --append-system-prompt  (quick, ephemeral)
│
├── How Claude structures all responses (verbosity, format, focus)
│   → Output Style  (persistent, affects all sessions using it)
│
└── None of the above fits?
    → Combine: CLAUDE.md for knowledge + Output Style for behavior
```

### Team Coordination

When using project-level output styles (committed to `.claude/settings.json`):

1. **Discuss the choice** — a Terse style committed to the project means everyone loses explanations; make sure the team agrees
2. **Document the reason** — add a comment in `.claude/settings.json`:
   ```json
   {
     "_comment": "Terse style used in CI via environment; change locally with --append-system-prompt",
     "outputStyle": "team-terse"
   }
   ```
3. **Allow personal overrides** — individuals can use `.claude/settings.local.json` (git-ignored) to override the project style for their own sessions
4. **Version control the style files** — keep `.claude/output-styles/` committed alongside `.claude/settings.json`

### Always Use `keep-coding-instructions: true`

Unless you have a deliberate reason to disable SE behavior, include this in every custom coding style:

```markdown
---
name: "My Style"
description: "..."
keep-coding-instructions: true   ← always, for coding contexts
---
```

Forgetting this produces a style where Claude does not verify its changes, does not read docs before editing, and does not follow existing code conventions. This is a common source of subtle regressions.

### Keep Style Instructions Actionable

Vague style instructions produce inconsistent results. Prefer concrete rules:

```markdown
# Bad — vague
Be more thoughtful and thorough when responding.

# Good — actionable
Before implementing any solution:
1. Read the existing code in the affected files
2. State the approach in one sentence
3. Identify any edge cases you will handle
```

### Test New Styles on Representative Tasks

Before committing a project style or publishing a plugin style:

1. Start a fresh session with the style active
2. Run 5–10 representative tasks (the kinds of things your team actually does)
3. Check that `keep-coding-instructions: true` is working (does Claude still verify changes?)
4. Measure output length — is it what you expected?
5. Check that the style does not conflict with your CLAUDE.md instructions

### Measure Before Committing to Verbose Styles

Run a week of development under Explanatory or Architect before making it your team default. The extra output is valuable — but it comes at a real cost in time spent reading (and dollars in API usage).

---

## Quick Reference

```
Built-in Styles
  default       Standard SE system prompt
  explanatory   + Insights sections between coding steps (educational)
  learning      Collaborative; leaves TODO(human) gaps for you to fill

Custom Style Location
  Personal:  ~/.claude/output-styles/<name>.md
  Project:   .claude/output-styles/<name>.md   (committed to git)

Frontmatter
  name:                      Display name in /config menu
  description:               One-line description
  keep-coding-instructions:  true (recommended) | false (default)

Activation
  /config → Output Style → select
  settings.json: { "outputStyle": "My Style Name" }
  Takes effect at NEXT new session (not mid-session)

Token Impact
  Input:   system prompt size (cached after turn 1 — minimal impact)
  Output:  dominant cost driver; Explanatory/Architect 2-3x vs Default

Project Style Workflow
  1. Create .claude/output-styles/team-style.md
  2. Set .claude/settings.json: { "outputStyle": "team-style" }
  3. Commit both files
  4. Individuals override via .claude/settings.local.json (git-ignored)
```

---

## 11. Side-by-Side Style Comparison

The same prompt — "Add input validation to the createUser function" — produces radically different responses depending on which output style is active. This section shows exactly what changes.

### The Prompt

```
> Add input validation to the createUser function in src/users/service.ts
```

### Response: Default Style

```
I'll add input validation to createUser.

[reads src/users/service.ts]

I'll use Zod for validation, consistent with the rest of the codebase:

// src/users/service.ts
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user', 'viewer']).default('user'),
});

export async function createUser(input: unknown): Promise<User> {
  const data = CreateUserSchema.parse(input);
  // ... rest of function unchanged
}

Tests updated in src/users/service.test.ts with validation edge cases.
All tests pass.
```

**Characteristics:** Concise. Shows the change. Mentions test update. Done.

---

### Response: Explanatory Style

```
I'll add input validation to createUser. Let me first read the existing
implementation to understand the current shape.

[reads src/users/service.ts]
[reads src/users/service.test.ts]

I see the codebase uses Zod v4 elsewhere (src/api/validators.ts). I'll
be consistent with that.

// src/users/service.ts
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user', 'viewer']).default('user'),
});

export async function createUser(input: unknown): Promise<User> {
  const data = CreateUserSchema.parse(input);
  // ... rest of function
}

**Insights**
- Chose Zod over manual validation because it's already the project
  standard (avoiding a second validation library with different semantics).
- Used `z.parse` (throws ZodError) rather than `z.safeParse` (returns
  result object) because the existing error middleware in src/api/middleware/
  errors.ts already handles ZodError and formats it as a 400 response —
  the throw is intentional, not accidental.
- The `role` default inside the schema keeps the default co-located with
  the type definition. An alternative was setting the default in the
  database, but that would require reading the DB to know the default —
  worse for documentation and testing.
- Future maintainers: if you add a new field to User, add it here first.
  The schema is the single source of truth for what createUser accepts.
```

**Characteristics:** Same code change, plus Insights explaining why Zod (vs alternatives), why `.parse` (vs `.safeParse`), and an explicit note for future maintainers.

---

### Response: Learning Style

```
Let's add validation to createUser. Before I write the code, let me
explain the approach.

Input validation sits at the boundary between untrusted external data
and your trusted internal domain. The goal is to reject invalid data
early, with a clear error, before it reaches business logic or the database.

Here's the structure with a gap for you to fill in:

// src/users/service.ts
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  // TODO(human): What should the valid values for `role` be?
  // Look at the Role enum in src/types/user.ts for the options.
  // Should there be a default value? If so, what and why?
  role: ???,
});

export async function createUser(input: unknown): Promise<User> {
  // TODO(human): Call the schema to validate `input`.
  // Hint: Zod has two parse methods — one throws on invalid input,
  // one returns a result object. Which is better here and why?
  const data = ???;
  
  return db.users.create({ data });
}

What role values are valid here, and what should happen if no role is provided?
```

**Characteristics:** Leaves two intentional gaps. Forces the developer to think about valid role values and the choice of parse method. Ends with a question, not a complete solution.

---

### Response: Terse Style (Custom)

```
[reads src/users/service.ts]

// src/users/service.ts
+import { z } from 'zod';
+
+const CreateUserSchema = z.object({
+  email: z.string().email(),
+  name: z.string().min(1).max(100),
+  role: z.enum(['admin', 'user', 'viewer']).default('user'),
+});
+
 export async function createUser(input: unknown): Promise<User> {
+  const data = CreateUserSchema.parse(input);
   return db.users.create({ data });
 }
```

**Characteristics:** Diff only. No preamble. No explanation. Fastest to read; zero prose overhead.

---

### Comparison Table

```
┌────────────────┬──────────┬──────────────────────┬──────────────────────┐
│ Style          │ Code     │ Explanation          │ Best For             │
├────────────────┼──────────┼──────────────────────┼──────────────────────┤
│ Default        │ Full     │ Brief (what/how)     │ Everyday development  │
│ Explanatory    │ Full     │ Extended (why/alts)  │ Learning codebases   │
│ Learning       │ Partial  │ Conceptual + gaps    │ Deliberate practice  │
│ Terse (custom) │ Diff     │ None                 │ CI, fast iteration   │
│ Architect      │ Full     │ Design decision doc  │ Architectural work   │
│ Teaching       │ Partial  │ Socratic dialogue    │ Mentoring sessions   │
└────────────────┴──────────┴──────────────────────┴──────────────────────┘
```

---

## 12. Output Style Creation Walkthrough

This section builds a complete custom output style from scratch — the "Code Reviewer" style that makes Claude behave like a meticulous senior engineer reviewing every change it makes.

### Step 1: Decide What You Want to Change

Before writing a style, articulate exactly what behavior you want:

```
Problem: Claude makes changes confidently but doesn't always tell me
what could go wrong or what I should watch for.

Desired behavior: Every code change includes a "Watch for" section
that flags potential issues I should verify before committing —
edge cases not covered by tests, performance assumptions, integration risks.
```

### Step 2: Choose `keep-coding-instructions` Setting

```
Is this style used during coding sessions? → Yes → keep-coding-instructions: true
Does it replace all SE behavior?           → No  → keep-coding-instructions: true
```

For the Code Reviewer style: `keep-coding-instructions: true` — we want Claude to still read files, run tests, and follow conventions. We're adding behavior, not replacing it.

### Step 3: Write the Style File

```
~/.claude/output-styles/code-reviewer.md
```

```markdown
---
name: "Code Reviewer"
description: "Adds a 'Watch for' section to every code change — surfaces edge cases, assumptions, and integration risks"
keep-coding-instructions: true
---

You are operating in Code Reviewer mode. After every meaningful code change:

**Mandatory: Add a "Watch for" section** formatted as follows:

---
Watch for:
- [Specific edge case this change might break]: [one line explanation]
- [Performance assumption being made]: [what to verify]
- [Integration point this touches]: [what downstream behavior might change]
---

Rules for the "Watch for" section:
1. Minimum 2 items, maximum 5. Be selective — only real risks.
2. Each item must be specific to THIS change, not generic advice.
3. If a risk is covered by an existing test, note that: "[risk] — covered by test X"
4. If a risk is NOT covered by a test, flag it: "[risk] — NO TEST — verify manually"
5. When there are no meaningful risks (trivial change), write: "Watch for: Nothing notable — low-risk change."

Example of a good "Watch for" section:
---
Watch for:
- Email validation rejects '+' in local part (e.g., user+tag@example.com) — NO TEST — verify manually
- The `role` default now happens at the service layer, not DB — downstream consumers that previously read the DB default directly will see 'user' where they expected NULL — NO TEST — check mobile app API client
- ZodError format differs from the previous TypeError format — covered by src/api/middleware/errors.test.ts
---
```

### Step 4: Place the File and Activate

```bash
# Personal style (works in all sessions)
mkdir -p ~/.claude/output-styles
cp code-reviewer.md ~/.claude/output-styles/

# OR project style (shared with team)
mkdir -p .claude/output-styles
cp code-reviewer.md .claude/output-styles/
```

Activate:
```
/config → Output Style → Code Reviewer
```

Or in settings.json:
```json
{ "outputStyle": "Code Reviewer" }
```

### Step 5: Test on a Representative Task

Start a fresh session (styles apply at session start). Make a code change and verify the "Watch for" section appears and is substantive. Check:

1. Does the section appear after every meaningful change?
2. Is the content specific to the change (not generic)?
3. Are NO TEST flags appearing where they should?
4. Does Claude still verify its changes compile and tests pass? (Confirms `keep-coding-instructions: true` is working)

### Step 6: Refine

Common refinements after testing:

```markdown
# If items are too generic, add an example of bad vs good:

Bad: "Watch for: Edge cases in input validation"
Good: "Watch for: Empty string passes the .min(1) check if it's whitespace-only — verify `name: '   '` is handled"

# Add this to your style body:
Each "Watch for" item must name a SPECIFIC value, path, state, or condition —
not a category of risk. "Edge cases" is never specific enough.
```

---

## 13. `keep-coding-instructions: true` vs `false` — Deep Comparison

This flag controls whether the SE-specific system prompt block is preserved or replaced. The difference is substantial.

### What the SE-Specific Block Contains

The block output styles can replace includes instructions like:

```
- Read relevant source files and documentation before proposing changes
- Verify that changes compile and all tests pass before claiming success
- Prefer targeted edits over complete rewrites
- Format code consistently with the surrounding codebase
- When requirements are ambiguous, ask a clarifying question
- Use available tools (Read, Bash, Grep) proactively to understand context
- Never claim a task is complete until you have verified it works
```

This is the engineering discipline layer. It is what separates Claude Code from a general chat assistant.

### With `keep-coding-instructions: false` (the default)

```
┌─────────────────────────────────────────────────────────┐
│  System Prompt                                          │
│  ─────────────────────────────────────────────────────  │
│  [Core Anthropic Prompt — always present]               │
│                                                         │
│  [Your Style Content]     ← replaces SE block entirely  │
│                                                         │
│  [SE Block — REMOVED]     ← gone, no engineering rules  │
└─────────────────────────────────────────────────────────┘
```

**Observed behavior differences:**

| Behavior | Default (SE block present) | keep-coding-instructions: false |
|----------|---------------------------|----------------------------------|
| Reads files before editing | Yes, proactively | Only if your style says to |
| Runs tests after changes | Yes | Only if explicitly instructed |
| Makes targeted edits | Yes | May rewrite more aggressively |
| Asks clarifying questions | Yes, when ambiguous | Less likely |
| Follows code conventions | Yes | Only if specified in your style |
| Claims success without verifying | Rarely | More often |

**When `false` is appropriate:**
- A documentation-only style where Claude should never touch code
- A style that completely redefines Claude's behavior for a non-coding use case
- A content generation style where engineering discipline is irrelevant

**When `false` is a mistake:**
- Any style used during coding sessions
- Styles that add formatting or educational content but keep coding behavior
- Most custom styles people write

### With `keep-coding-instructions: true` (recommended)

```
┌─────────────────────────────────────────────────────────┐
│  System Prompt                                          │
│  ─────────────────────────────────────────────────────  │
│  [Core Anthropic Prompt — always present]               │
│                                                         │
│  [SE Block — PRESERVED]   ← all engineering discipline  │
│                                                         │
│  [Your Style Content]     ← appended after SE block     │
└─────────────────────────────────────────────────────────┘
```

The SE block is kept intact. Your style content adds to it. Claude behaves like a disciplined engineer AND follows your additional instructions.

### Diagnosing Whether the Flag Is Working

After activating a new style, run this test:

```
> Update the getUser function to return null instead of throwing an error when the user doesn't exist.
```

If `keep-coding-instructions: true` is working:
- Claude reads the file first before editing
- Claude updates the tests (which now need to test for `null` instead of catching an error)
- Claude runs the tests and verifies they pass before finishing

If Claude skips reading the file, skips updating tests, and just returns the code change, your style likely has `keep-coding-instructions: false` (or missing, which defaults to `false`).

---

## 14. When to Use Each Built-in Style

### Choosing the Right Style

```
What is your primary goal for this session?
│
├── Ship production code efficiently and correctly
│   └── Default
│       Why: All SE discipline intact. Balanced explanations.
│            No overhead. The right tool for everyday work.
│
├── Learn a new codebase or unfamiliar patterns
│   └── Explanatory
│       Why: Insights sections surface trade-offs you might miss.
│            Builds understanding of WHY decisions are made.
│            Worth the extra output tokens when learning.
│
├── Deliberately practice a skill (algorithm, pattern, language)
│   └── Learning
│       Why: TODO(human) gaps force you to think, not just read.
│            Cheaper than Explanatory (less code generated).
│            The gap-then-feedback loop accelerates retention.
│
├── Run automated tasks (CI, bulk file processing, scripted review)
│   └── Terse (custom)
│       Why: Minimal prose = lower cost + less noise to parse.
│            Explanations waste tokens when no human reads them.
│
├── Design system architecture or make major decisions
│   └── Architect (custom) or Explanatory
│       Why: You need the alternatives and trade-off analysis.
│            Decision rationale is as valuable as the code.
│
└── Teach or mentor another developer
    └── Teaching (custom) or Learning
        Why: Socratic questioning builds the mentee's model.
             Giving answers directly produces shallow understanding.
```

### Style vs. Situation Matrix

| Situation | Recommended Style | Why |
|-----------|------------------|-----|
| Daily feature work | Default | No overhead; full discipline |
| Code review for a PR | Explanatory | Insights prepare review talking points |
| Algorithm practice | Learning | Gaps force actual thinking |
| Onboarding to new team | Explanatory | Understand the why behind decisions |
| Writing infrastructure/IaC | Default | Need correctness, not explanation |
| Architecture spike | Architect | Trade-off docs are the deliverable |
| CI pipeline review | Terse | Automated — no human reads explanations |
| Interview prep | Learning | Practice, not hand-holding |
| Mentoring a junior | Teaching | Socratic method builds mental models |
| Debugging production issue | Default | Speed and correctness matter most |
| Writing documentation | Documentation | Doc-first forces good documentation |

---

## 15. Team Output Style Distribution

When a project commits `.claude/settings.json` with an `outputStyle`, every team member gets that style. This section covers how to design a team style strategy.

### Deploying Styles to Your Team

Share output styles via git by committing to `.claude/output-styles/`:

```bash
# Add a team output style
mkdir -p .claude/output-styles
cat > .claude/output-styles/pr-review.md << 'EOF'
---
name: pr-review
description: Standard PR review format for our team
---
# PR Review Format
Review using our team standard: [Summary] → [Issues by severity] → [Approval verdict]
EOF

# Commit to git
git add .claude/output-styles/pr-review.md
git commit -m "add: team pr-review output style"
```

Team members activate it with `/config` → select "pr-review" style.

### Output Style Scope

| Style location | Who can use it | Overridable? |
|----------------|---------------|-------------|
| `.claude/output-styles/` | All project contributors | Yes (user local style wins) |
| `~/.claude/output-styles/` | You, all projects | Yes (local wins) |
| Plugin output styles | Plugin users | Depends on plugin scope |
| Enterprise managed styles | All org users | No (enterprise wins) |

### Option A: Project Style for All (Opinionated)

Commit a project-level style that all developers use by default:

```
.claude/
├── settings.json              ← { "outputStyle": "team-standard" }
└── output-styles/
    └── team-standard.md       ← style file committed to git
```

**Best for:** Teams that want consistency; large codebases where documentation quality matters; projects with many contributors.

**Team communication template:**

```markdown
<!-- Add to CLAUDE.md or CONTRIBUTING.md -->

## Claude Code Output Style

We use the `team-standard` output style, configured in `.claude/settings.json`.

This style adds:
- A "Watch for" section to every code change
- Mandatory test coverage notes

To override for your personal sessions (without affecting teammates):
Create `.claude/settings.local.json` (git-ignored):
  { "outputStyle": "explanatory" }
```

### Option B: CI-Only Override

Use the default style for development but a Terse style for CI runs:

```bash
# .github/workflows/claude-review.yml
- name: Run Claude Code review
  env:
    CLAUDE_OUTPUT_STYLE: terse    # environment override if supported
  run: claude --append-system-prompt "Be extremely concise." review
```

Or commit a separate CI-specific project config:

```json
// .claude/settings.json (committed)
{
  "_comment": "Use terse in CI; developers override locally with settings.local.json",
  "outputStyle": "team-terse"
}
```

```json
// .claude/settings.local.json (git-ignored, each developer creates their own)
{
  "outputStyle": "explanatory"
}
```

### Option C: Role-Based Styles

Different team members have different needs. Use personal styles rather than a project setting:

```
Junior developer:  ~/.claude/settings.json → "outputStyle": "explanatory"
Senior developer:  ~/.claude/settings.json → "outputStyle": "default"
Technical lead:    ~/.claude/settings.json → "outputStyle": "architect"
CI system:         project .claude/settings.json → "outputStyle": "team-terse"
```

The CI system's project-level setting wins in automated runs. Developers override via their personal settings (which override the project setting per the precedence hierarchy).

### Precedence Reminder

```
Managed policy   (highest — IT enforced)
    ↓
Local settings   (.claude/settings.local.json)
    ↓
Project settings (.claude/settings.json)
    ↓
User settings    (~/.claude/settings.json)
    ↓
Default          (lowest — "default" style)
```

A local settings file overrides a project setting. This is the correct escape hatch for individual style preferences on projects with a committed team style.

---

## 16. Performance and Token Cost Implications

### Full Cost Breakdown by Style

Input token cost matters mostly on the first turn (before caching kicks in). Output tokens are the real cost driver for verbose styles.

```
COST COMPARISON — same coding session, 50 turns

                 Input (turn 1)  Input (turns 2-50)   Output/turn   Relative cost
                 ─────────────  ──────────────────    ──────────    ─────────────
Default          800 tokens      ~80 (cached)          ~400          1.0x (baseline)
Explanatory      900 tokens      ~90 (cached)          ~900          2.1x
Learning         850 tokens      ~85 (cached)          ~280          0.7x
Terse (custom)   200 tokens      ~20 (cached)          ~120          0.3x
Architect        600 tokens      ~60 (cached)          ~750          1.8x
Teaching         700 tokens      ~70 (cached)          ~600          1.5x
Documentation    650 tokens      ~65 (cached)          ~720          1.7x
```

Note: These are illustrative estimates. Actual costs vary significantly by task type. Use `/usage` to measure your actual style overhead.

### Why Output Tokens Dominate

After turn 1, the system prompt is cached. You pay ~10% of the input token price for cache reads, making input tokens nearly free for long sessions. But output tokens are never cached — every word Claude writes costs full output token price.

A style that doubles Claude's prose output doubles your session cost. This is worth paying when the additional content is valuable (Explanatory during architecture work, Teaching during mentoring). It is not worth paying when content is automatically processed (CI) or when you just want fast iteration.

### Measuring Your Style's Actual Cost

```
# Step 1: Run a typical 20-turn session with Default style
/usage
→ Note output tokens: 8,000

# Step 2: Run the same task type with your custom style
/usage
→ Note output tokens: 15,000

# Step 3: Calculate multiplier
15,000 / 8,000 = 1.875x output overhead

# Step 4: Estimate monthly cost impact
Assume: 5 sessions/day × 20 days/month = 100 sessions
Default:         100 × 8,000 × $15/million  = $12.00/month
Custom style:    100 × 15,000 × $15/million = $22.50/month
Overhead:        $10.50/month per developer for this style
```

### Cost Optimization Strategies

**For high-volume workflows:**

```markdown
# Use Terse for anything automated
CI/CD reviews, bulk file processing, scripted analysis:
{ "outputStyle": "terse" }

# Use Default for most daily work
Feature development, debugging, refactoring:
{ "outputStyle": "default" }

# Reserve verbose styles for high-value sessions
Architecture decisions, learning sessions, onboarding:
{ "outputStyle": "explanatory" }
```

**For API-integrated usage:**

```python
# If calling Claude Code programmatically, pin to Terse
# to keep output predictable and minimal
import subprocess
result = subprocess.run(
    ["claude", "--append-system-prompt",
     "Be maximally concise. Code only, no explanations."],
    input=prompt,
    capture_output=True
)
```

**Monitor and adjust:**

```
/usage        → Check output token ratio in current session
/context      → See if style content is a significant % of input
```

If output tokens are 3x+ what you'd expect for the task, your style may be too verbose. If you're in a learning/architecture context, that's intentional. If you're in a CI context, switch to Terse.
