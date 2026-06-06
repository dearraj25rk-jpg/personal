---
title: Themes & UI Customization — Complete Reference
description: >
  Complete reference for Claude Code themes and UI customization — built-in themes,
  /theme command usage, custom theme authoring, team distribution, dark/light mode
  auto-switching, terminal color support, accessibility themes, and troubleshooting.
  Claude Code v2.1.126 (May 2026).
sidebar:
  order: 30
  label: Themes & UI
lastUpdated: 2026-06-06
---

# Themes & UI Customization — Complete Reference

> **Version:** v2.1.126 (May 19, 2026) · Documentation updated June 2026

---

## 1. Overview

Claude Code renders entirely in your terminal. Unlike a GUI application, it has no windows, panels, or images — everything is text, colors, and Unicode box-drawing characters. The theme system controls every visible aspect of that rendering: background colors, foreground text colors, syntax highlighting, borders, diff colors, status indicators, and the overall visual density of output.

Understanding the theme system lets you:

- Match Claude Code's appearance to your terminal and personal preference
- Distribute a consistent look-and-feel to your entire team
- Configure accessibility-optimized palettes for reduced eye strain
- Tune output formatting for readability on narrow or wide terminals
- Diagnose color rendering problems when themes look wrong

### What Themes Control

```
┌─────────────────────────────────────────────────────────────────┐
│              THEME SCOPE — WHAT IS CUSTOMIZABLE                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  CHROME (always visible):                                         │
│    • Status bar colors (top/bottom)                              │
│    • Input prompt color and symbol                               │
│    • Spinner / progress indicator colors                         │
│    • Panel borders and separators                                │
│    • Header and footer text colors                               │
│                                                                   │
│  CONTENT (varies by context):                                     │
│    • Code block background and foreground                         │
│    • Syntax highlighting palette (16 token types)                │
│    • Diff: added/removed/unchanged line colors                   │
│    • Error, warning, info, success message colors                │
│    • File path display color                                     │
│    • Command output foreground                                   │
│                                                                   │
│  FORMATTING (output layout):                                      │
│    • Output width (column limit)                                 │
│    • Word-wrap behavior                                          │
│    • Compact vs comfortable line spacing                         │
│    • Code block padding                                          │
│                                                                   │
│  NOT CONTROLLED BY THEMES:                                        │
│    • Font face (set in your terminal emulator)                   │
│    • Font size (set in your terminal emulator)                   │
│    • Cursor style (set in your terminal emulator)                │
│    • Window chrome / titlebar (set in your OS/terminal)          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Built-in Themes

Claude Code ships with eight built-in themes. They are embedded in the binary and cannot be modified in place, but any of them can be used as a base when authoring a custom theme.

### Theme Overview Table

| Theme Name | Base | Background | Best For |
|------------|------|------------|----------|
| `dark` | Dark | `#1a1a2e` navy-black | Default; most terminals |
| `light` | Light | `#f8f8f2` near-white | Bright office environments |
| `solarized-dark` | Dark | `#002b36` Solarized base03 | Solarized terminal fans |
| `solarized-light` | Light | `#fdf6e3` Solarized base3 | Solarized + bright room |
| `monokai` | Dark | `#272822` Monokai classic | VS Code Monokai users |
| `github` | Light | `#ffffff` white | GitHub-style reading |
| `high-contrast-dark` | Dark | `#000000` true black | Accessibility / WCAG AA |
| `high-contrast-light` | Light | `#ffffff` true white | Accessibility / WCAG AA |

### Theme Previews (ASCII Art Mockups)

#### `dark` — Default Theme

```
╔══════════════════════════════════════════════════════════════════════╗
║  Claude Code  v2.1.126    [dark]              ● claude-sonnet-4-6   ║  ← #4a9eff blue status bar
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  > how does the auth middleware work?                                 ║  ← #e2e8f0 user input
║                                                                       ║
║  The auth middleware in src/middleware/auth.go:                       ║  ← #cbd5e1 response text
║                                                                       ║
║  ┌─ src/middleware/auth.go ──────────────────────────────────────┐  ║  ← #334155 code bg
║  │  func AuthMiddleware(next http.Handler) http.Handler {         │  ║  ← #7dd3fc keyword
║  │      return http.HandlerFunc(func(w http.ResponseWriter,       │  ║
║  │          r *http.Request) {                                    │  ║
║  │          token := r.Header.Get("Authorization")                │  ║  ← #a3e635 string
║  │          if !validateToken(token) {                            │  ║  ← #f87171 error/control
║  │              w.WriteHeader(http.StatusUnauthorized)            │  ║
║  │          }                                                     │  ║
║  │      })                                                        │  ║
║  │  }                                                             │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ║  ← separator
╚══════════════════════════════════════════════════════════════════════╝
  Background: #1a1a2e  Foreground: #e2e8f0  Accent: #4a9eff
```

#### `light` — Light Theme

```
╔══════════════════════════════════════════════════════════════════════╗
║  Claude Code  v2.1.126    [light]             ● claude-sonnet-4-6   ║  ← #1d4ed8 blue status bar
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  > how does the auth middleware work?                                 ║  ← #1e293b user input
║                                                                       ║
║  The auth middleware in src/middleware/auth.go:                       ║  ← #334155 response text
║                                                                       ║
║  ┌─ src/middleware/auth.go ──────────────────────────────────────┐  ║  ← #f1f5f9 code bg
║  │  func AuthMiddleware(next http.Handler) http.Handler {         │  ║  ← #1d4ed8 keyword
║  │      return http.HandlerFunc(func(w http.ResponseWriter,       │  ║
║  │          r *http.Request) {                                    │  ║
║  │          token := r.Header.Get("Authorization")                │  ║  ← #15803d string
║  │          if !validateToken(token) {                            │  ║  ← #dc2626 error/control
║  │              w.WriteHeader(http.StatusUnauthorized)            │  ║
║  │          }                                                     │  ║
║  │      })                                                        │  ║
║  │  }                                                             │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
  Background: #f8f8f2  Foreground: #1e293b  Accent: #1d4ed8
```

#### `solarized-dark` — Solarized Dark Theme

```
╔══════════════════════════════════════════════════════════════════════╗
║  Claude Code  v2.1.126  [solarized-dark]      ● claude-sonnet-4-6   ║  ← #268bd2 blue
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  > how does the auth middleware work?                                 ║  ← #839496 base0
║                                                                       ║
║  ┌─ src/middleware/auth.go ──────────────────────────────────────┐  ║  ← #073642 base02 code bg
║  │  func AuthMiddleware(next http.Handler) http.Handler {         │  ║  ← #268bd2 blue keyword
║  │          token := r.Header.Get("Authorization")                │  ║  ← #2aa198 cyan string
║  │          if !validateToken(token) {                            │  ║  ← #dc322f red control
║  │      })                                                        │  ║
║  │  }                                                             │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
╚══════════════════════════════════════════════════════════════════════╝
  Background: #002b36 (base03)  Foreground: #839496 (base0)  Accent: #268bd2
```

#### `monokai` — Monokai Theme

```
╔══════════════════════════════════════════════════════════════════════╗
║  Claude Code  v2.1.126    [monokai]           ● claude-sonnet-4-6   ║  ← #a6e22e green
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  > how does the auth middleware work?                                 ║  ← #f8f8f2 near-white
║                                                                       ║
║  ┌─ src/middleware/auth.go ──────────────────────────────────────┐  ║  ← #3e3d32 dark code bg
║  │  func AuthMiddleware(next http.Handler) http.Handler {         │  ║  ← #66d9e8 cyan keyword
║  │          token := r.Header.Get("Authorization")                │  ║  ← #e6db74 yellow string
║  │          if !validateToken(token) {                            │  ║  ← #f92672 pink control
║  │      })                                                        │  ║
║  │  }                                                             │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════╝
  Background: #272822  Foreground: #f8f8f2  Accent: #a6e22e
```

#### `high-contrast-dark` — Accessibility Dark Theme

```
╔══════════════════════════════════════════════════════════════════════╗
║  Claude Code  v2.1.126  [high-contrast-dark]  ● claude-sonnet-4-6   ║  ← #ffff00 yellow (high-vis)
╠══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  > how does the auth middleware work?                                 ║  ← #ffffff pure white
║                                                                       ║
║  ┌─ src/middleware/auth.go ──────────────────────────────────────┐  ║  ← #111111 near-black code bg
║  │  func AuthMiddleware(next http.Handler) http.Handler {         │  ║  ← #00ffff cyan keyword
║  │          token := r.Header.Get("Authorization")                │  ║  ← #00ff00 green string
║  │          if !validateToken(token) {                            │  ║  ← #ff4444 bright red control
║  │      })                                                        │  ║
║  │  }                                                             │  ║
║  └────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════╝
  Background: #000000  Foreground: #ffffff  Accent: #ffff00
  WCAG AA compliant (contrast ratio ≥ 4.5:1 for all text/background pairs)
```

---

## 3. The `/theme` Command

The `/theme` slash command is the primary interface for theme management. It provides subcommands for listing, previewing, setting, and resetting themes.

### Command Reference

| Subcommand | Description | Example |
|------------|-------------|---------|
| `/theme` | List all available themes (built-in + custom) | `/theme` |
| `/theme <name>` | Apply a theme immediately | `/theme monokai` |
| `/theme preview <name>` | Preview a theme without applying it | `/theme preview solarized-dark` |
| `/theme reset` | Reset to the default `dark` theme | `/theme reset` |
| `/theme show` | Display the currently active theme name and source | `/theme show` |
| `/theme reload` | Reload custom themes from `~/.claude/themes/` | `/theme reload` |
| `/theme export <name>` | Export a built-in theme as a custom `.md` file you can edit | `/theme export monokai` |

### Listing All Themes

```
/theme

Available themes:
────────────────────────────────────────────────────────────────────
BUILT-IN (8 themes)
  dark                   [active ✓]  Default dark theme
  light                              Light background theme
  solarized-dark                     Solarized dark palette
  solarized-light                    Solarized light palette
  monokai                            Monokai classic palette
  github                             GitHub-style light theme
  high-contrast-dark                 WCAG AA dark accessibility
  high-contrast-light                WCAG AA light accessibility

CUSTOM (2 themes from ~/.claude/themes/)
  nord                               Arctic, north-bluish color palette
  one-dark-pro                       Atom One Dark Pro port

Type /theme <name> to apply a theme.
Type /theme preview <name> to preview without applying.
```

### Setting a Theme

Themes are applied immediately. The selection is saved to `~/.claude/settings.json` under the `theme` key and persists across sessions:

```
/theme monokai

✓ Theme set to "monokai"
  Saved to ~/.claude/settings.json

  Colors now active:
    Background:   #272822
    Foreground:   #f8f8f2
    Accent:       #a6e22e
    Code blocks:  #3e3d32
```

### Previewing Without Applying

The `/theme preview` command renders a sample output block using the named theme without changing your active theme:

```
/theme preview github

── Preview: github ─────────────────────────────────────────────────────
                                                                         
  The auth middleware validates JWT tokens on each request:               
                                                                         
  ┌─ src/middleware/auth.go ──────────────────────────────────────────┐  
  │  func validateToken(token string) bool {                           │  
  │      claims, err := jwt.Parse(token, keyFunc)                     │  
  │      return err == nil && claims.Valid()                          │  
  │  }                                                                 │  
  └────────────────────────────────────────────────────────────────────┘  
                                                                         
── End preview ─────────────────────────────────────────────────────────
Active theme is still: dark
Run /theme github to apply.
```

### Exporting a Built-in Theme for Customization

The `/theme export` command writes a built-in theme's full definition to `~/.claude/themes/` so you can customize it:

```
/theme export monokai

✓ Exported to ~/.claude/themes/monokai.md
  Edit the file to customize colors.
  Run /theme reload to pick up changes.
  Run /theme monokai to apply.
```

---

## 4. Custom Theme Authoring

Custom themes are Markdown files with YAML frontmatter stored in `~/.claude/themes/`. Claude Code scans this directory at startup and makes all discovered themes available via `/theme`.

### File Location

```
~/.claude/
  themes/
    my-theme.md          ← user custom theme (this session)
    team-theme.md        ← shared team theme (copied from plugin)
    nord.md              ← downloaded from community
    one-dark-pro.md      ← downloaded from community
```

> **Tip:** Theme files discovered by plugins are automatically added to the themes directory. See [Section 6](#6-installing-themes) for plugin-based theme installation.

### Minimal Custom Theme

A minimal theme file requires only `name` and `base` in frontmatter. All other values inherit from the named `base` theme:

```markdown
---
name: my-warm-dark
base: dark
description: "A warm dark theme with amber accents"
author: "Your Name"
version: "1.0.0"

# Override only what you want to change
accent: "#f59e0b"
accentDim: "#d97706"
---

# My Warm Dark Theme

This theme uses the dark base with amber accent colors.
The body of the .md file is displayed in /theme list as the theme description.
```

### Full Custom Theme (All Fields)

```markdown
---
name: my-full-theme
base: dark
description: "Complete custom theme with all fields specified"
author: "Your Name"
version: "1.2.0"

# ──────────────────────────────────────────────────────────────────
# CHROME COLORS — the persistent UI elements visible in every session
# ──────────────────────────────────────────────────────────────────

# Main backgrounds
background: "#1e1e2e"         # Terminal background (used if terminal supports it)
backgroundAlt: "#181825"      # Slightly darker variant for panels and code blocks
backgroundSubtle: "#313244"   # Hover/selection highlight background

# Main text
foreground: "#cdd6f4"         # Primary text color
foregroundDim: "#a6adc8"      # Secondary/muted text (timestamps, hints, paths)
foregroundSubtle: "#585b70"   # Very muted text (line numbers, decorations)

# Accent — the primary brand/highlight color
accent: "#89b4fa"             # Primary accent (links, active items, cursor)
accentDim: "#74c7ec"          # Slightly dimmer accent (hover states)
accentSubtle: "#313244"       # Very subtle accent background (selection bg)

# Status bar colors
statusBarBackground: "#1e1e2e"
statusBarForeground: "#cdd6f4"
statusBarBorder: "#313244"

# ──────────────────────────────────────────────────────────────────
# SEMANTIC COLORS — convey meaning in tool output and messages
# ──────────────────────────────────────────────────────────────────

success: "#a6e3a1"            # ✓ success messages, added lines in diffs
successBackground: "#1e2d1f"  # Background for success callouts
warning: "#f9e2af"            # ⚠ warning messages, caution indicators
warningBackground: "#2d2516"  # Background for warning callouts
error: "#f38ba8"              # ✗ error messages, failed operations
errorBackground: "#2d1b1e"    # Background for error callouts
info: "#89dceb"               # ℹ informational messages
infoBackground: "#1a2530"     # Background for info callouts

# ──────────────────────────────────────────────────────────────────
# DIFF COLORS — used in code diffs and file comparison output
# ──────────────────────────────────────────────────────────────────

diffAdded: "#a6e3a1"          # Added line foreground color
diffAddedBackground: "#1e2d1f"# Added line background (the full line width)
diffRemoved: "#f38ba8"        # Removed line foreground color
diffRemovedBackground: "#2d1b1e" # Removed line background
diffModified: "#f9e2af"       # Modified line foreground
diffModifiedBackground: "#2d2516" # Modified line background
diffContext: "#585b70"        # Unchanged context lines (dimmed)
diffLineNumber: "#45475a"     # Line number gutter foreground

# ──────────────────────────────────────────────────────────────────
# CODE BLOCK COLORS — syntax highlighting palette
# Token types follow TextMate / VS Code grammar categories
# ──────────────────────────────────────────────────────────────────

codeBackground: "#181825"     # Code block background
codeForeground: "#cdd6f4"     # Default code text (unstyled identifiers)
codeBorder: "#313244"         # Code block border line

# Syntax token colors (16 categories)
syntaxKeyword: "#cba6f7"      # Language keywords: if, for, return, func, class
syntaxBuiltin: "#89b4fa"      # Built-in functions/types: len, print, int, string
syntaxType: "#89dceb"         # Type names: MyStruct, UserResponse, HttpHandler
syntaxFunction: "#89b4fa"     # Function/method names at declaration site
syntaxParameter: "#fab387"    # Function parameter names
syntaxVariable: "#cdd6f4"     # Variable names (plain identifiers)
syntaxConstant: "#fab387"     # Constants and enum values
syntaxString: "#a6e3a1"       # String literals (quoted content)
syntaxNumber: "#fab387"       # Numeric literals: 42, 3.14, 0xff
syntaxBoolean: "#cba6f7"      # true / false / nil / null
syntaxOperator: "#89dceb"     # Operators: +, -, *, /, &&, ||, ==
syntaxPunctuation: "#cdd6f4"  # Brackets, parens, semicolons, commas
syntaxComment: "#6c7086"      # Comments (// and /* */ style)
syntaxDocComment: "#74c7ec"   # Documentation comments (///, /** */)
syntaxAttribute: "#fab387"    # Decorators, attributes, annotations
syntaxInvalid: "#f38ba8"      # Syntax errors detected by highlighter

# ──────────────────────────────────────────────────────────────────
# BORDER AND SEPARATOR COLORS
# ──────────────────────────────────────────────────────────────────

border: "#313244"             # Primary border color (panels, boxes)
borderStrong: "#45475a"       # Emphasized borders (active panels)
separator: "#313244"          # Horizontal separator lines (─────)

# ──────────────────────────────────────────────────────────────────
# OUTPUT FORMATTING (optional — overrides settings.json values)
# ──────────────────────────────────────────────────────────────────

outputWidth: 100              # Maximum output column width (characters)
codeBlockPadding: 1           # Lines of padding above/below code blocks (0–3)
lineSpacing: "comfortable"    # "compact" | "comfortable" | "spacious"
---

# My Full Custom Theme

A complete custom theme with all available color fields specified.
This description appears in `/theme list` output and `/theme show`.

## Attribution

Based loosely on the Catppuccin Mocha palette.
Source: https://github.com/catppuccin/catppuccin
```

### Theme Frontmatter Schema Reference

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique theme identifier (used in `/theme <name>`) |
| `base` | string | Built-in base to inherit from: `dark`, `light`, `solarized-dark`, `solarized-light`, `monokai`, `github`, `high-contrast-dark`, `high-contrast-light` |

#### Optional Metadata Fields

| Field | Type | Description |
|-------|------|-------------|
| `description` | string | Short description shown in `/theme list` |
| `author` | string | Theme author name or email |
| `version` | string | Theme version (semver recommended) |
| `license` | string | License identifier (e.g., `MIT`) |
| `homepage` | string | URL to theme homepage or repository |

#### Chrome Color Fields

| Field | Type | Format | Inherits From Base |
|-------|------|--------|--------------------|
| `background` | string | CSS hex (`#rrggbb`) | Yes |
| `backgroundAlt` | string | CSS hex | Yes |
| `backgroundSubtle` | string | CSS hex | Yes |
| `foreground` | string | CSS hex | Yes |
| `foregroundDim` | string | CSS hex | Yes |
| `foregroundSubtle` | string | CSS hex | Yes |
| `accent` | string | CSS hex | Yes |
| `accentDim` | string | CSS hex | Yes |
| `accentSubtle` | string | CSS hex | Yes |
| `statusBarBackground` | string | CSS hex | Yes |
| `statusBarForeground` | string | CSS hex | Yes |
| `statusBarBorder` | string | CSS hex | Yes |

#### Semantic Color Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | string | Success message foreground |
| `successBackground` | string | Success callout background |
| `warning` | string | Warning message foreground |
| `warningBackground` | string | Warning callout background |
| `error` | string | Error message foreground |
| `errorBackground` | string | Error callout background |
| `info` | string | Info message foreground |
| `infoBackground` | string | Info callout background |

#### Diff Color Fields

| Field | Type | Description |
|-------|------|-------------|
| `diffAdded` | string | Added line text color |
| `diffAddedBackground` | string | Added line background |
| `diffRemoved` | string | Removed line text color |
| `diffRemovedBackground` | string | Removed line background |
| `diffModified` | string | Modified line text color |
| `diffModifiedBackground` | string | Modified line background |
| `diffContext` | string | Unchanged context line color |
| `diffLineNumber` | string | Line number gutter color |

#### Syntax Token Color Fields

| Field | Covers |
|-------|--------|
| `syntaxKeyword` | Language keywords (`if`, `for`, `return`, `class`) |
| `syntaxBuiltin` | Built-in functions and types (`len`, `int`, `print`) |
| `syntaxType` | User-defined type names |
| `syntaxFunction` | Function/method names at declaration |
| `syntaxParameter` | Function parameter names |
| `syntaxVariable` | Plain variable identifiers |
| `syntaxConstant` | Constants and enum members |
| `syntaxString` | String literals |
| `syntaxNumber` | Numeric literals |
| `syntaxBoolean` | Boolean and null literals |
| `syntaxOperator` | Operators and arrows |
| `syntaxPunctuation` | Brackets, braces, commas |
| `syntaxComment` | Inline and block comments |
| `syntaxDocComment` | Documentation comments |
| `syntaxAttribute` | Decorators and annotations |
| `syntaxInvalid` | Syntax error highlighting |

#### Border Fields

| Field | Description |
|-------|-------------|
| `border` | Primary border color |
| `borderStrong` | Emphasized border color |
| `separator` | Horizontal separator line color |

#### Formatting Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `outputWidth` | integer | `120` | Maximum characters per output line |
| `codeBlockPadding` | integer | `1` | Blank lines around code blocks (0–3) |
| `lineSpacing` | string | `"comfortable"` | `"compact"` \| `"comfortable"` \| `"spacious"` |

---

## 5. Installing Themes

### Manual Installation

Download a `.md` theme file and place it in `~/.claude/themes/`:

```bash
# Download a community theme
curl -o ~/.claude/themes/nord.md \
  https://raw.githubusercontent.com/nordtheme/claude-code/main/nord.md

# Verify it was discovered
claude --print '/theme' | grep nord
```

Then reload themes in a running session:

```
/theme reload

✓ Reloaded ~/.claude/themes/ (3 themes)
  nord                  — newly discovered
```

### Installation via the Claude Code CLI

If the theme is published as an npm package with a `claude-theme` keyword, you can install it with:

```bash
npm install -g @nordtheme/claude-code-theme
claude /theme reload
```

Themes distributed as npm packages must follow the npm package format described in the [Plugins Guide](/claude-code/plugins-guide).

### Verifying Installation

```
/theme show

Active theme: nord
Source:       ~/.claude/themes/nord.md
Author:       Arctic Ice Studio & Sven Greb
Version:      0.19.0
Base:         dark

Colors (selected):
  background:  #2e3440
  foreground:  #d8dee9
  accent:      #88c0d0
```

---

## 6. Team Theme Distribution

### Via Plugin (Recommended)

The most reliable way to distribute a team theme is via a Claude Code plugin. The plugin bundles the theme file and installs it to `~/.claude/themes/` when the plugin is activated.

**Plugin structure:**

```
my-company-claude-plugin/
  package.json
  index.js               ← plugin entry point
  themes/
    company-dark.md      ← theme file
    company-light.md     ← second theme variant
```

**Plugin `index.js` (theme registration):**

```javascript
module.exports = {
  name: 'my-company-claude-plugin',
  version: '1.0.0',
  themes: [
    {
      name: 'company-dark',
      file: './themes/company-dark.md',
    },
    {
      name: 'company-light',
      file: './themes/company-light.md',
    },
  ],
};
```

When a user activates the plugin, Claude Code copies the theme files to their `~/.claude/themes/` directory and makes them available via `/theme`.

### Via Project Settings

For a simpler distribution that does not require a plugin, you can commit theme files to the repository and reference them in `.claude/settings.json`:

```json
{
  "theme": {
    "name": "company-dark",
    "file": ".claude/themes/company-dark.md"
  }
}
```

When Claude Code starts in this project, it reads the project-relative theme file and applies it. The user's personal theme preference is overridden for this project.

**Important:** Project-level theme settings override user-level theme settings. If the user has `/theme monokai` in their personal settings, the project settings will take precedence when working in that project directory.

### Theme Priority Order

```
1. Project .claude/settings.json { "theme": ... }   ← highest priority
2. ~/.claude/settings.json { "theme": ... }
3. CLAUDE_THEME environment variable
4. Default: "dark"                                    ← lowest priority
```

### Distributing Team Themes via Git

A common pattern for distributed teams:

```
# In the shared team repository:
.claude/
  settings.json        ← includes "theme": { "name": "team-theme", "file": ".claude/themes/team-theme.md" }
  themes/
    team-theme.md      ← committed to git, shared with all team members

# team-theme.md example:
---
name: team-theme
base: dark
description: "Acme Corp standard dark theme"
author: "Acme Corp Platform Team"
version: "2.1.0"
accent: "#ff6b35"             # Acme brand orange
---
```

Every team member working in the repo automatically gets the team theme applied when they open Claude Code in that directory.

---

## 7. Dark/Light Mode Configuration

### Manual Mode Selection

Set your preferred mode explicitly via the theme name:

```bash
# Dark mode
claude settings set theme dark

# Light mode
claude settings set theme light

# Or use /theme command
/theme dark
/theme light
```

### Automatic OS Mode Detection

Claude Code can automatically switch between dark and light themes based on your operating system's dark mode preference. Enable this with the `autoDarkLight` setting in `~/.claude/settings.json`:

```json
{
  "theme": {
    "autoDarkLight": {
      "enabled": true,
      "darkTheme": "dark",
      "lightTheme": "light"
    }
  }
}
```

With this configuration, Claude Code reads the OS color scheme preference at startup and selects the appropriate theme. The theme is re-evaluated each time a new Claude Code session starts.

**Operating system support:**

| OS | Detection Method | Notes |
|----|-----------------|-------|
| macOS | `defaults read -g AppleInterfaceStyle` | Automatic, no config needed |
| Windows 11 | Registry `HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize` | Automatic |
| Linux (GNOME) | `gsettings get org.gnome.desktop.interface color-scheme` | Requires GNOME 42+ |
| Linux (KDE) | `lookandfeeltool --current` | Requires Plasma 5.23+ |
| Linux (other) | `COLORFGBG` environment variable heuristic | Fallback only |

### Custom Dark/Light Pair

Use the `autoDarkLight` setting with custom theme names to automatically switch between your custom dark and light variants:

```json
{
  "theme": {
    "autoDarkLight": {
      "enabled": true,
      "darkTheme": "company-dark",
      "lightTheme": "company-light"
    }
  }
}
```

### Disabling Auto-Switch

To lock to a specific theme regardless of OS preference:

```json
{
  "theme": {
    "name": "dark",
    "autoDarkLight": {
      "enabled": false
    }
  }
}
```

---

## 8. Output Formatting Options

Output formatting controls how Claude Code lays out text in the terminal. These options are independent of color themes — you can configure them separately in `~/.claude/settings.json` or include them in a custom theme's frontmatter.

### Configuration in settings.json

```json
{
  "output": {
    "width": 100,
    "wordWrap": true,
    "lineSpacing": "comfortable",
    "codeBlockPadding": 1,
    "showLineNumbers": true,
    "truncateLongLines": false,
    "indentSize": 2
  }
}
```

### Output Width

The `width` setting controls the maximum column width for prose output. Code blocks always respect their original formatting and are not word-wrapped.

```
Default: 120 columns
Minimum: 60 columns
Maximum: 300 columns (but wider than your terminal is not useful)
```

**Recommended values:**

| Terminal Width | Recommended `width` | Notes |
|---------------|---------------------|-------|
| 80 columns | 78 | Leave 2 columns for border |
| 100 columns | 96 | Comfortable reading width |
| 120 columns | 116 | Default; works for most wide terminals |
| 160+ columns | 120–140 | Wider than ~140 reduces readability |

**Example: narrow terminal (80 columns)**

```json
{
  "output": {
    "width": 78,
    "lineSpacing": "compact"
  }
}
```

### Word Wrap

When `wordWrap: true` (the default), long prose lines are wrapped at the `width` boundary. When `false`, lines are never wrapped (useful when piping output to a file or another program):

```bash
# Disable word wrap for machine-readable output
claude --output-format plain --no-word-wrap "list all functions in auth.go"
```

### Line Spacing

The `lineSpacing` option controls blank lines between output blocks:

| Value | Description | Blank lines between blocks |
|-------|-------------|---------------------------|
| `"compact"` | Dense output, minimal whitespace | 0 |
| `"comfortable"` | Default; balanced readability | 1 |
| `"spacious"` | Generous whitespace; easier to scan | 2 |

**Compact mode example:**

```
The middleware validates tokens.
┌─ auth.go ─────────────────┐
│  func validate() bool {   │
│      return true          │
│  }                        │
└───────────────────────────┘
Three files were modified.
```

**Spacious mode example:**

```
The middleware validates tokens.

┌─ auth.go ─────────────────┐
│  func validate() bool {   │
│      return true          │
│  }                        │
└───────────────────────────┘

Three files were modified.
```

### Code Block Padding

The `codeBlockPadding` setting (0–3) adds blank lines inside code blocks, above the first line and below the last:

```
codeBlockPadding: 0          codeBlockPadding: 1 (default)
─────────────────────        ─────────────────────────────
┌─ auth.go ─────────┐        ┌─ auth.go ─────────────────┐
│  func foo() {     │        │                            │
│      return 42    │        │  func foo() {              │
│  }                │        │      return 42             │
└───────────────────┘        │  }                         │
                             │                            │
                             └────────────────────────────┘
```

### Show Line Numbers

When `showLineNumbers: true`, code blocks include a line number gutter:

```
┌─ auth.go ──────────────────────────────────────────────┐
│   1  package middleware                                  │
│   2                                                      │
│   3  import (                                            │
│   4      "net/http"                                      │
│   5      "github.com/golang-jwt/jwt/v5"                  │
│   6  )                                                   │
│   7                                                      │
│   8  func AuthMiddleware(next http.Handler) http.Handler │
└─────────────────────────────────────────────────────────┘
```

---

## 9. Terminal Color Support

### Color Depth Detection

Claude Code automatically detects your terminal's color depth at startup and adjusts its rendering:

```
Startup sequence:
  1. Check COLORTERM environment variable
     COLORTERM=truecolor → 24-bit (16.7 million colors)
     COLORTERM=24bit     → 24-bit
  2. Check TERM_PROGRAM variable
     iTerm.app, Hyper, WezTerm, Kitty → truecolor assumed
  3. Check TERM variable
     xterm-256color → 8-bit (256 colors) fallback
     xterm          → 4-bit (16 ANSI colors) fallback
  4. If none match → 4-bit (16 ANSI colors) fallback
```

### Color Depth Capabilities

| Depth | Colors | How Colors Are Specified | Theme Behavior |
|-------|--------|--------------------------|----------------|
| 4-bit (16 colors) | 16 | ANSI escape codes 30–37, 90–97 | Hex colors mapped to nearest ANSI color |
| 8-bit (256 colors) | 256 | ESC[38;5;Nm | Hex colors quantized to xterm 256-color palette |
| 24-bit (truecolor) | 16,777,216 | ESC[38;2;R;G;Bm | Hex colors used exactly as specified |

### Overriding Color Detection

If auto-detection is wrong (for example, your terminal supports truecolor but Claude Code detects 256-color):

**Environment variable override:**

```bash
# Force truecolor
export COLORTERM=truecolor

# Force 256-color
export TERM=xterm-256color

# Disable all colors (plain text output)
export NO_COLOR=1
```

**settings.json override:**

```json
{
  "terminal": {
    "colorDepth": "truecolor"
  }
}
```

Valid values: `"4bit"` (16 colors), `"8bit"` (256 colors), `"truecolor"` (24-bit), `"none"` (no color).

### Popular Terminal Color Support

| Terminal | Platform | Truecolor | Notes |
|----------|----------|-----------|-------|
| iTerm2 | macOS | Yes | Set `COLORTERM=truecolor` in profile |
| Terminal.app | macOS | No | 256-color only; consider upgrading to iTerm2 |
| WezTerm | Cross-platform | Yes | Auto-detected |
| Kitty | Cross-platform | Yes | Auto-detected |
| Alacritty | Cross-platform | Yes | Auto-detected |
| Windows Terminal | Windows | Yes | Auto-detected in WT 1.0+ |
| cmd.exe | Windows | No | 16 colors only |
| GNOME Terminal | Linux | Yes | Auto-detected |
| Konsole | Linux | Yes | Auto-detected |
| tmux | N/A (multiplexer) | Depends | Requires `set -g default-terminal "tmux-256color"` and `set -ag terminal-overrides ",xterm-256color:Tc"` |

### tmux Color Configuration

tmux intercepts escape codes from applications running inside it. Without correct configuration, truecolor themes will appear degraded. Add to `~/.tmux.conf`:

```bash
# ~/.tmux.conf — truecolor support for Claude Code themes
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",xterm-256color:RGB"
set -ag terminal-overrides ",xterm-256color:Tc"

# Verify with:
# tmux info | grep -e RGB -e Tc
```

After updating `.tmux.conf`, restart tmux or run `tmux source ~/.tmux.conf`.

### The NO_COLOR Standard

Setting `NO_COLOR=1` in your environment disables all color output from Claude Code, producing plain text. This is useful for:

- Piping output to files or other programs
- Screen readers and accessibility tools that read plain text
- Logging environments where ANSI codes appear as garbage characters
- CI/CD pipelines where color is not rendered

```bash
# Pipe Claude Code output to a file (no ANSI codes)
NO_COLOR=1 claude "summarize all TODO comments" > todos.txt
```

---

## 10. Accessibility Themes

### High-Contrast Themes

Claude Code ships two WCAG AA-compliant high-contrast themes:

**`high-contrast-dark`:**

```
Background:  #000000 (pure black)
Foreground:  #ffffff (pure white)
Contrast ratio body text: 21:1  (WCAG AAA)

Accent:      #ffff00 (yellow)   — contrast 19.6:1 on black
Success:     #00ff00 (green)    — contrast 15.3:1 on black
Warning:     #ffaa00 (amber)    — contrast 11.4:1 on black
Error:       #ff4444 (red)      — contrast 5.2:1 on black (WCAG AA minimum)
```

**`high-contrast-light`:**

```
Background:  #ffffff (pure white)
Foreground:  #000000 (pure black)
Contrast ratio body text: 21:1  (WCAG AAA)

Accent:      #0000cc (dark blue) — contrast 9.7:1 on white
Success:     #006600 (dark green)— contrast 8.9:1 on white
Warning:     #775500 (brown)    — contrast 7.8:1 on white
Error:       #cc0000 (dark red) — contrast 5.9:1 on white (WCAG AA)
```

### Creating a Custom Accessibility Theme

If neither built-in high-contrast theme meets your specific needs, author a custom theme using `high-contrast-dark` or `high-contrast-light` as the base and override specific colors:

```markdown
---
name: my-accessibility-dark
base: high-contrast-dark
description: "Custom high-contrast dark with larger text cues"

# Override red error to a more accessible orange
error: "#ff8800"
errorBackground: "#2a1500"

# Make success more distinct (not just green for red-green color blindness)
success: "#00ccff"
successBackground: "#001a2a"

# Use bold separator lines (theme cannot control font weight, but can use
# a brighter separator color to simulate visual weight)
separator: "#888888"
border: "#666666"
borderStrong: "#aaaaaa"
---
```

### Color-Blindness Considerations

The built-in high-contrast themes use hue plus brightness contrast, making them readable for common color-blindness types. If you author a custom theme for color-blind users:

| Color-Blindness Type | Affected | Recommendation |
|---------------------|---------|----------------|
| Deuteranopia (red-green, ~6% of males) | Cannot distinguish red from green | Use blue/orange for success/error instead of green/red |
| Protanopia (red, ~1% of males) | Red appears dark/absent | Same as deuteranopia; use blue/orange |
| Tritanopia (blue-yellow, rare) | Blue/yellow confusion | Use red/green; avoid blue-yellow pairs |
| Monochromacy | No color perception | Use `high-contrast-dark` or `high-contrast-light` |

**Color-blind-friendly semantic palette example:**

```markdown
---
name: accessible-deuteranopia-dark
base: dark
description: "Red-green color-blind friendly dark theme"
success: "#0ea5e9"      # Sky blue instead of green
error: "#f97316"        # Orange instead of red
warning: "#a855f7"      # Purple for warning
info: "#e2e8f0"         # Near-white for info
diffAdded: "#0ea5e9"    # Blue for added
diffRemoved: "#f97316"  # Orange for removed
---
```

### Reduced-Motion Considerations

Claude Code uses animated spinners and progress indicators during tool execution. While Claude Code does not currently read the OS `prefers-reduced-motion` preference, you can disable all animations manually:

```json
{
  "terminal": {
    "animations": false,
    "spinner": "none"
  }
}
```

Available `spinner` values:

| Value | Behavior |
|-------|----------|
| `"dots"` | Animated dot spinner (default) |
| `"line"` | Animated line: `— \ | /` |
| `"none"` | No spinner; shows static `…` |
| `"minimal"` | Single character `·` with no animation |

---

## 11. The `CLAUDE_THEME` Environment Variable

The `CLAUDE_THEME` environment variable allows you to set the active theme without editing settings files. This is particularly useful for:

- Shell scripts that invoke Claude Code with a specific appearance
- CI/CD pipelines that need a specific output style
- Switching themes on a per-terminal-session basis without affecting the global config

### Usage

```bash
# Apply a built-in theme for this session
CLAUDE_THEME=monokai claude "refactor the auth module"

# Apply a custom theme (must exist in ~/.claude/themes/)
CLAUDE_THEME=company-dark claude --dangerously-skip-permissions "run tests"

# Apply a theme from a file path (absolute or relative to cwd)
CLAUDE_THEME=/path/to/custom.md claude "explain this code"

# Disable all colors (equivalent to NO_COLOR=1 for themes)
CLAUDE_THEME=none claude "generate the API docs"
```

### Export for the Current Shell Session

```bash
# Set for all Claude Code invocations in this shell
export CLAUDE_THEME=solarized-dark

# Verify
claude /theme show
```

### Priority with Other Theme Settings

```
1. CLAUDE_THEME env var (highest priority — overrides all settings.json)
2. Project .claude/settings.json { "theme": ... }
3. ~/.claude/settings.json { "theme": ... }
4. Default: "dark" (lowest priority)
```

> **Note:** If both `CLAUDE_THEME` and `autoDarkLight.enabled: true` are set, `CLAUDE_THEME` wins and auto-switching is disabled for that session.

---

## 12. Troubleshooting Theme Issues

### Issue: Theme Not Loading

**Symptom:** `/theme list` does not show your custom theme, or `/theme my-theme` returns "Theme not found."

**Diagnosis and fix:**

```bash
# 1. Check the file exists in the correct location
ls ~/.claude/themes/

# 2. Check the file has a .md extension (not .yaml or .json)
ls ~/.claude/themes/*.md

# 3. Check the file has valid YAML frontmatter
# The frontmatter must start with --- on line 1
head -5 ~/.claude/themes/my-theme.md
# Expected output:
# ---
# name: my-theme
# base: dark

# 4. Check the name field matches what you're calling
grep "^name:" ~/.claude/themes/my-theme.md
# Expected: name: my-theme

# 5. Reload themes in a running session
# /theme reload

# 6. Check for YAML parse errors by running:
python3 -c "
import sys
# Simple YAML frontmatter check
with open('$HOME/.claude/themes/my-theme.md') as f:
    content = f.read()
if not content.startswith('---'):
    print('ERROR: File does not start with ---')
else:
    print('Frontmatter delimiters found')
"
```

### Issue: Colors Look Wrong / Washed Out

**Symptom:** The theme is applied but colors look degraded — grays instead of blues, similar shades for different token types.

**Cause:** Claude Code detected a lower color depth than your terminal supports. It is using 256-color or 16-color fallback mode.

**Fix:**

```bash
# Check what Claude Code detected
claude /theme show --verbose
# Look for: "Terminal color depth: 8bit (256 colors)"

# Check your COLORTERM variable
echo $COLORTERM
# Should be "truecolor" or "24bit" for full color support

# Fix: set COLORTERM correctly
export COLORTERM=truecolor

# Or override in settings.json
# { "terminal": { "colorDepth": "truecolor" } }
```

### Issue: Colors Conflict with Terminal Background

**Symptom:** Code block backgrounds are invisible (same color as terminal background), or text is unreadable.

**Cause:** Your theme's `background` and `codeBackground` colors are too close to your terminal emulator's background color.

**Fix:** Override just the conflicting colors without changing your entire theme:

```markdown
---
name: dark-terminal-fix
base: dark
description: "Dark theme with adjusted code block background"
# Make code blocks more distinct from terminal background
codeBackground: "#2a2a3e"    # Slightly lighter than terminal bg
codeBorder: "#4a4a6e"        # More visible border
---
```

### Issue: Theme Works in Interactive Mode but Not in `--print` Mode

**Symptom:** Colors appear correctly in the interactive REPL but are absent or garbled when using `claude --print`.

**Cause:** `--print` mode checks `isatty()` to detect whether the output is a terminal. When piping, it defaults to no-color mode.

**Fix:** Force color output in pipe mode:

```bash
# Force color in --print mode
FORCE_COLOR=1 claude --print "explain auth.go" | less -R

# Or use the --color flag (v2.1.100+)
claude --print --color always "explain auth.go"
```

### Issue: ANSI Escape Codes Appear as Raw Characters

**Symptom:** Output contains literal `^[[38;2;137;180;250m` sequences instead of rendering as colors.

**Cause:** Your terminal does not support ANSI escape codes, or output is being captured by a non-terminal tool.

**Fix:**

```bash
# Option 1: Disable all colors
NO_COLOR=1 claude "explain auth.go"

# Option 2: Use plain text output mode
claude --output-format plain "explain auth.go"

# Option 3: Set color depth to none
# In ~/.claude/settings.json:
# { "terminal": { "colorDepth": "none" } }
```

### Issue: Custom Theme Not Applying in Project Sessions

**Symptom:** Your custom theme appears in your home directory sessions but not when working in a specific project.

**Cause:** The project's `.claude/settings.json` has a `theme` key that overrides your personal settings.

**Fix:** Check and, if desired, remove the project-level theme setting:

```bash
cat .claude/settings.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('theme', 'not set'))"
```

If the project setting is intentional (team theme), you can still override it for your personal use with the `CLAUDE_THEME` environment variable:

```bash
CLAUDE_THEME=monokai claude
```

### Issue: Theme Resets After Each Session

**Symptom:** You set a theme with `/theme`, it works for the current session, but the next session reverts to the default.

**Cause:** The `/theme` command may have failed to write to `~/.claude/settings.json` (permissions issue), or the file was not persisted.

**Fix:**

```bash
# Check if settings.json is writable
ls -la ~/.claude/settings.json

# Check current theme in settings
cat ~/.claude/settings.json | python3 -m json.tool | grep theme

# Set the theme explicitly via the CLI
claude settings set theme monokai

# Verify
cat ~/.claude/settings.json | python3 -m json.tool | grep theme
# Expected: "theme": "monokai"
```

### Issue: `/theme export` Produces a File with Wrong Colors

**Symptom:** After `/theme export monokai`, the exported file has different hex values than what you see in the UI.

**Cause:** Claude Code adapts color values based on detected color depth. The export reflects the original hex values, not the adapted ones.

**Fix:** This is expected behavior. Edit the exported file to set your desired colors, then reload:

```
/theme export monokai
# Edit ~/.claude/themes/monokai.md
/theme reload
/theme monokai
```

---

## 13. Theme Configuration Reference Summary

### settings.json Full Theme Configuration

```json
{
  "theme": {
    "name": "dark",
    "autoDarkLight": {
      "enabled": false,
      "darkTheme": "dark",
      "lightTheme": "light"
    }
  },
  "output": {
    "width": 120,
    "wordWrap": true,
    "lineSpacing": "comfortable",
    "codeBlockPadding": 1,
    "showLineNumbers": false,
    "truncateLongLines": false,
    "indentSize": 2
  },
  "terminal": {
    "colorDepth": "truecolor",
    "animations": true,
    "spinner": "dots"
  }
}
```

### Environment Variables Summary

| Variable | Effect | Example |
|----------|--------|---------|
| `CLAUDE_THEME` | Set active theme by name or file path | `CLAUDE_THEME=monokai` |
| `NO_COLOR` | Disable all ANSI color output | `NO_COLOR=1` |
| `FORCE_COLOR` | Force color output even in non-tty | `FORCE_COLOR=1` |
| `COLORTERM` | Override terminal color depth detection | `COLORTERM=truecolor` |
| `TERM` | Standard terminal type (color depth hint) | `TERM=xterm-256color` |

### Quick Reference: Common Theme Tasks

```bash
# List all available themes
claude '/theme'

# Apply a built-in theme
/theme monokai

# Apply a custom theme
/theme my-custom-theme

# Preview a theme without applying
/theme preview solarized-dark

# Export a built-in theme for editing
/theme export dark

# Reload custom themes after editing
/theme reload

# Show current theme details
/theme show

# Reset to default
/theme reset

# Set theme via CLI (persists to settings.json)
claude settings set theme monokai

# Set theme via environment variable (session only)
CLAUDE_THEME=monokai claude

# Disable colors entirely
NO_COLOR=1 claude "explain auth.go"

# Force truecolor (if auto-detection failed)
export COLORTERM=truecolor

# Set output width
claude settings set output.width 100

# Set line spacing
claude settings set output.lineSpacing compact
```

---

## Related Documentation

- [Output Styles Guide](/claude-code/output-styles-guide) — controlling output format, verbosity, and rendering modes
- [Plugins Guide](/claude-code/plugins-guide) — distributing themes and settings via plugins
- [Settings Reference](/claude-code/claude-code-reference) — complete settings.json schema
- [Slash Commands Reference](/claude-code/slash-commands-reference) — `/theme` command details
- [Troubleshooting](/claude-code/troubleshooting) — broader Claude Code troubleshooting
