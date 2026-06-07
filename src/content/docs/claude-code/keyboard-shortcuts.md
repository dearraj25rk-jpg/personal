---
title: Keyboard Shortcuts & Terminal Integration — Complete Reference
description: >
  Complete reference for all Claude Code keyboard shortcuts and terminal integration —
  built-in session controls, mode cycling via Shift+Tab, multiline input methods,
  custom keybindings via ~/.claude/keybindings.json, the /terminal-setup command,
  readline shortcuts in the REPL, terminal compatibility matrix, accessibility
  considerations, and troubleshooting keybinding conflicts with tmux, vim, and IDE terminals.
  Claude Code v2.1.126 (May 2026).
sidebar:
  order: 28
  label: Keyboard Shortcuts
lastUpdated: 2026-06-07
---

# Keyboard Shortcuts & Terminal Integration — Complete Reference

> **Version:** v2.1.126 (May 19, 2026) · `/terminal-setup` introduced in v2.1.116 · Custom keybindings introduced in v2.1.100

Keyboard shortcuts in Claude Code span three layers: **built-in REPL bindings** (hardcoded into the binary), **readline-compatible shell bindings** (inherited from your terminal emulator), and **custom keybindings** (defined in `~/.claude/keybindings.json`). This reference covers all three layers with complete syntax, per-terminal compatibility notes, and troubleshooting guidance.

---

## 1. Quick-Reference Table — All Built-in Shortcuts

The following table lists every keyboard shortcut built into Claude Code v2.1.126. Shortcuts marked **Universal** work regardless of terminal emulator or operating system. Those marked **macOS** require a Mac keyboard and a terminal that passes Option key sequences correctly.

| Shortcut | Category | What it does | Availability |
|----------|----------|--------------|--------------|
| `Shift+Tab` | Mode | Cycle through Normal → Auto-Accept → Plan modes | Universal |
| `Ctrl+C` | Session | Interrupt current operation / cancel pending prompt | Universal |
| `Ctrl+D` | Session | Exit Claude Code (sends EOF) | Universal |
| `Ctrl+R` | Input | Search command/prompt history (reverse incremental) | Universal |
| `Option+Enter` | Input | Insert newline for multiline prompt (macOS) | macOS only |
| `Backslash+Enter` | Input | Insert newline for multiline prompt | Universal |
| `Shift+Enter` | Input | Insert newline after `/terminal-setup` (v2.1.116+) | Configured terminals |
| `!` (at line start) | Input | Enter bash passthrough mode | Universal |
| `@` (at line start) | Input | Trigger file path autocomplete | Universal |
| `Tab` | Input | Toggle extended thinking mode on/off | Universal |
| `Esc` `Esc` (double) | Navigation | Open session rewind menu | Universal |
| `Ctrl+B` | Navigation | Background Claude Code, drop to shell | Universal |
| `Ctrl+S` | Utility | Capture stats screenshot to clipboard | Universal |
| `/` (at line start) | Input | Open slash command picker with autocomplete | Universal |
| `Esc` | Input | Dismiss autocomplete picker / cancel selection | Universal |
| `↑` / `↓` | Input | Navigate history / autocomplete list | Universal |
| `Tab` (in picker) | Input | Confirm autocomplete selection | Universal |
| `Ctrl+L` | Display | Clear terminal screen (readline passthrough) | Universal |
| `Ctrl+A` | Input | Move cursor to beginning of line | Universal |
| `Ctrl+E` | Input | Move cursor to end of line | Universal |
| `Ctrl+K` | Input | Delete from cursor to end of line | Universal |
| `Ctrl+U` | Input | Delete from cursor to beginning of line | Universal |
| `Ctrl+W` | Input | Delete word before cursor | Universal |
| `Alt+F` | Input | Move cursor forward one word | Universal |
| `Alt+B` | Input | Move cursor backward one word | Universal |

---

## 2. Session Control Shortcuts

### `Ctrl+C` — Interrupt

`Ctrl+C` sends `SIGINT` to the currently running operation within Claude Code. Its behavior depends on what is happening at the moment you press it:

| State when pressed | Result |
|--------------------|--------|
| Claude is generating a response | Stops generation immediately; partial output shown |
| Claude is executing a tool (Read, Write, Bash) | Interrupts tool execution; Claude receives cancellation signal |
| Claude is waiting for tool approval | Cancels the pending operation without executing it |
| Prompt input field is active | Clears current input line |
| Nothing is running (idle) | No visible effect |

After `Ctrl+C`, Claude Code remains in the session. The interrupted turn is added to history as a cancelled operation. You can inspect what happened and continue normally.

```
┌─────────────────────────────────────────────────────────────────┐
│  CTRL+C BEHAVIOR DURING TOOL EXECUTION                          │
│                                                                  │
│  Claude: "Let me read all 200 files..."                          │
│  [Glob tool running: 47/200 files scanned]                       │
│       ↑                                                          │
│  User presses Ctrl+C                                             │
│       ↓                                                          │
│  Tool receives cancellation                                      │
│  Partial results returned to Claude                              │
│  Claude notified: "Operation interrupted by user"                │
│  Claude responds with what it found so far                       │
└─────────────────────────────────────────────────────────────────┘
```

**Important:** `Ctrl+C` does **not** exit Claude Code. To exit, use `Ctrl+D` or type `/exit`.

### `Ctrl+D` — Exit

`Ctrl+D` sends the end-of-file (EOF) signal to Claude Code's stdin. This is the standard Unix way to signal that input is complete.

- If the input field is **empty**: Claude Code exits cleanly, session is saved to disk
- If the input field is **non-empty**: Ctrl+D is ignored (prevents accidental exits mid-typing)
- In non-interactive (piped) mode: EOF on stdin triggers graceful shutdown

The exit behavior is identical to typing `/exit` and pressing Enter.

### `Ctrl+B` — Background to Shell

`Ctrl+B` suspends Claude Code and returns you to your shell prompt without ending the session:

```bash
$ claude
> Claude Code session active...
> Help me refactor the auth module

[Claude is working...]

User presses Ctrl+B

[1]+  Stopped                 claude
$ _                          ← You are now in your shell
```

To return to Claude Code:

```bash
$ fg                         # Bring Claude Code back to foreground
# OR
$ %1                         # If you have multiple background jobs
```

The session remains fully intact. Any in-progress generation is paused, not cancelled. This is equivalent to the standard Unix `Ctrl+Z` (SIGTSTP) — Claude Code intercepts `Ctrl+B` to avoid conflicts with terminal multiplexers that bind `Ctrl+Z`.

**Use cases for `Ctrl+B`:**
- Quickly run a shell command without opening a new terminal tab
- Check git status while Claude is thinking
- Copy a file path from `ls` output to paste into your Claude prompt
- Run a test suite to check if Claude's last edit worked

---

## 3. Mode Cycling via Shift+Tab

`Shift+Tab` cycles Claude Code through three distinct operating modes. The current mode is always shown in the status bar at the bottom of the REPL.

### The Three Modes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     SHIFT+TAB MODE CYCLING                               │
│                                                                          │
│   ┌──────────────┐    Shift+Tab    ┌──────────────────┐                 │
│   │    NORMAL    │ ─────────────▶  │   AUTO-ACCEPT    │                 │
│   │    MODE      │                 │      MODE        │                 │
│   └──────────────┘                 └──────────────────┘                 │
│          ▲                                  │                            │
│          │           Shift+Tab              │ Shift+Tab                  │
│          │                                  ▼                            │
│          │                         ┌──────────────────┐                 │
│          └─────────────────────────│   PLAN MODE      │                 │
│                   Shift+Tab        └──────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

### Normal Mode (Default)

**Status bar indicator:** `[NORMAL]` or no indicator (default state)

In Normal mode, Claude Code operates with its standard permission model:
- Read-only tools (Read, Glob, Grep, List) execute without prompting
- Write tools (Write, Edit, MultiEdit) prompt for approval based on your `settings.json` permissions
- Bash tool prompts based on allowlist rules
- Each approval decision can be set to "always allow" for that session

This is the mode Claude Code starts in for every new session.

### Auto-Accept Mode

**Status bar indicator:** `[AUTO-ACCEPT]` (shown in yellow/orange)

In Auto-Accept mode, Claude Code executes **all** tools without requesting individual approvals:
- Write operations happen immediately without confirmation dialogs
- Bash commands run without approval (regardless of allowlist)
- File deletions proceed without review
- All tool calls are logged but not blocked

```
⚠ WARNING: Auto-Accept mode bypasses all approval gates.
  Claude can modify, delete, or overwrite files without showing you
  what it is about to do. Only use this mode when you:
  (a) trust the current task completely, AND
  (b) have all files under version control so mistakes are recoverable.
```

**When to use Auto-Accept:**
- Running a fully-specified, well-understood refactoring task
- Bulk file formatting where every change is mechanical
- Filling in boilerplate across many files from a clear specification
- Within a git working tree where `git diff` can review results afterward

**When NOT to use Auto-Accept:**
- Exploratory tasks where you want to review each step
- Any task involving deletion, database writes, or network calls
- When working with secrets or credentials files

### Plan Mode

**Status bar indicator:** `[PLAN MODE]` (shown in blue)

In Plan mode, Claude Code is restricted to read-only operations:
- Read tools (Read, Glob, Grep, List, WebFetch) work normally
- All write tools (Write, Edit, MultiEdit) are **blocked** — Claude describes what it would do instead
- Bash tool is blocked for any command that modifies state
- MCP tools that write data are blocked

Plan mode is designed for the "show me the plan first" workflow. You use it to let Claude analyze your codebase and produce a detailed implementation plan, review the plan, then switch back to Normal mode and ask Claude to execute it.

```bash
# Typical Plan Mode workflow

> [Press Shift+Tab twice to reach Plan Mode]
> Status bar shows: [PLAN MODE]

> "Analyze the auth module and tell me what needs to change
>  to support OAuth 2.0 with PKCE"

Claude reads files, analyzes code, produces detailed plan.
No files are modified.

> [Press Shift+Tab to return to Normal Mode]
> "Execute the plan you just outlined"

Claude implements the changes with normal approval flow.
```

Plan mode is also activatable from the CLI:

```bash
claude --permission-mode plan
```

### Mode Persistence

Modes are **session-local** — they reset to Normal when you start a new session. There is no way to persist a non-Normal mode as the default. If you always want to start in Plan mode, use a shell alias:

```bash
alias claudeplan='claude --permission-mode plan'
```

---

## 4. Text Input Shortcuts

### `Ctrl+R` — Reverse History Search

`Ctrl+R` opens an incremental reverse search through your prompt history. As you type, Claude Code filters previous prompts that match your query.

```
(reverse-i-search)`refact': Refactor the payment module to use the new stripe SDK
```

- Type characters to narrow the search
- `Ctrl+R` again to cycle to the next older match
- `Enter` to execute the matched prompt
- `Ctrl+G` or `Esc` to cancel without executing

History is stored per-project in `~/.claude/projects/<hash>/history`. The history file retains up to 10,000 entries across all sessions for that project.

### `↑` / `↓` — Sequential History Navigation

When the input field is empty or the cursor is at the start, `↑` navigates backward through history one entry at a time. `↓` navigates forward. This is simpler than `Ctrl+R` when you know the command was recent.

### `Ctrl+A` and `Ctrl+E` — Line Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl+A` | Move cursor to beginning of current line |
| `Ctrl+E` | Move cursor to end of current line |
| `Home` | Same as Ctrl+A |
| `End` | Same as Ctrl+E |

These work within multiline input blocks as well as single-line prompts.

### `Ctrl+K` and `Ctrl+U` — Kill Line

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Delete from cursor position to end of line |
| `Ctrl+U` | Delete from cursor position to beginning of line |

The deleted text goes to the readline kill ring and can be retrieved with `Ctrl+Y` (yank).

### `Ctrl+W` — Kill Word Backward

Deletes the word immediately before the cursor. "Word" is defined as a run of non-whitespace characters. Useful for correcting the last word you typed without reaching for the mouse.

### `Alt+F` and `Alt+B` — Word Navigation

| Shortcut | Action |
|----------|--------|
| `Alt+F` (or `Option+F` on macOS) | Move cursor forward one word |
| `Alt+B` (or `Option+B` on macOS) | Move cursor backward one word |

**macOS caveat:** Many macOS terminals intercept `Option+F` and `Option+B` for character insertion (special characters). To get word navigation:
- **iTerm2:** Preferences → Profiles → Keys → Left Option key → "Esc+"
- **macOS Terminal:** Preferences → Profiles → Keyboard → "Use Option as Meta key"
- **WezTerm:** Set `send_composed_key_when_left_alt_is_pressed = false` in config

### `Ctrl+Y` — Yank (Paste Kill Ring)

Inserts the most recently killed text at the cursor position. Works with text deleted via `Ctrl+K`, `Ctrl+U`, or `Ctrl+W`. Successive `Alt+Y` presses cycle through the kill ring for older deletions.

---

## 5. Multiline Input — All Three Methods

Claude Code supports three methods for entering multiline prompts. All three produce identical results — a prompt with embedded newlines.

### Method 1: Option+Enter (macOS)

Press and hold `Option`, then press `Enter`. A newline is inserted at the cursor position without submitting the prompt.

```
> Here is my prompt that needs
> multiple lines of context:
> [Option+Enter pressed here]
> - First item
> - Second item
> [Enter to submit]
```

**Requirements:**
- macOS keyboard with Option key
- Terminal must pass Option+Enter as a distinct sequence (most do by default)
- Does NOT work on Linux or Windows keyboards

**Terminals where Option+Enter works by default:**
- iTerm2: Yes
- macOS Terminal.app: Yes
- WezTerm (macOS): Yes
- Ghostty (macOS): Yes
- VS Code integrated terminal (macOS): Yes

### Method 2: Backslash+Enter (Universal)

Type a backslash `\` as the last character on a line, then press `Enter`. The backslash acts as a line continuation character:

```
> Here is my prompt that needs \
> multiple lines of context: \
> - First item \
> - Second item
> [Enter to submit]
```

The backslash is consumed — it does not appear in the submitted prompt. This method works on all operating systems and all terminal emulators because it relies on no special key sequences.

**Best for:**
- Linux and Windows users
- SSH sessions where modifier key sequences may not transmit correctly
- CI/CD contexts where prompts are scripted
- Terminals running inside tmux or screen

### Method 3: Shift+Enter (After `/terminal-setup`)

After running the `/terminal-setup` command (v2.1.116+, see Section 8), Claude Code configures your terminal to send a special escape sequence when you press `Shift+Enter`. Claude Code intercepts this sequence and inserts a newline instead of submitting.

```
> Here is my prompt that needs
> multiple lines of context:
> [Shift+Enter pressed here]
> - First item
> - Second item
> [Enter to submit]
```

This is the most ergonomic method — `Shift+Enter` is the de facto standard for "soft newline" in many applications (Slack, Notion, Gmail). It requires:
- Running `/terminal-setup` once per terminal profile
- A compatible terminal (see Section 8 for the compatibility list)

### Comparing the Three Methods

| Method | Works on | Requires setup | Most natural |
|--------|----------|----------------|--------------|
| `Option+Enter` | macOS only | No | Moderate |
| `Backslash+Enter` | All platforms | No | Low (visual noise) |
| `Shift+Enter` | Configured terminals | `/terminal-setup` once | High |

### Multiline Prompt Editing

Once in a multiline block, standard cursor navigation works across lines:
- `↑` and `↓` move between lines within the block
- `Ctrl+A` goes to the beginning of the current line in the block
- `Ctrl+E` goes to the end of the current line in the block
- `Backspace` at the start of a line joins it with the line above

---

## 6. Special Input Modes

### `!` Prefix — Bash Passthrough Mode

Typing `!` as the very first character of your input and then pressing Enter enters bash passthrough mode. Claude Code passes the remainder of the line directly to your shell:

```
> !git status
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean

> _
```

The shell command runs in a subprocess with your current working directory. stdout and stderr are both displayed in the Claude Code REPL. The exit code is shown if non-zero.

**Why use `!` instead of `Ctrl+B`?**
- `!` keeps you in Claude Code — no fg/bg required
- Output is captured in the REPL pane, making it easy to reference in the next prompt
- Claude Code can see the output if you then ask "what does that output mean?"
- `!` is faster for quick, single commands

**Limitations of `!` mode:**
- Interactive commands (editors, pagers, REPLs) do not work — use `Ctrl+B` instead
- The subprocess does not inherit any shell aliases or functions from your interactive shell
- Environment variables set with `!export FOO=bar` do not persist to subsequent `!` commands

### `@` Prefix — File Path Autocomplete

Typing `@` triggers the file path autocomplete picker. As you type additional characters, Claude Code filters against all files in the current project:

```
> Please review the changes in @src/auth/
                                         ^
                               Autocomplete picker opens:
                               ┌─────────────────────────┐
                               │ src/auth/index.ts        │
                               │ src/auth/oauth.ts        │
                               │ src/auth/middleware.ts   │
                               │ src/auth/types.ts        │
                               └─────────────────────────┘
```

- `↑` / `↓` to navigate the list
- `Tab` or `Enter` to select
- `Esc` to dismiss without selecting
- Continue typing to narrow the filter

Selected paths are inserted as absolute paths or relative-to-cwd paths (project configuration controls which). Multiple `@` references can appear in a single prompt.

The file autocomplete uses the same index as the Glob tool — it searches the project root recursively but respects `.gitignore` and Claude Code's built-in exclusion rules (node_modules, .git, build artifacts).

### `Tab` — Extended Thinking Toggle

Pressing `Tab` while the input field is focused (and not in an autocomplete picker) toggles Claude's extended thinking mode:

| State | What it means |
|-------|---------------|
| Thinking OFF (default) | Claude uses standard chain-of-thought; responses faster |
| Thinking ON | Claude uses extended thinking budget; slower but deeper reasoning |

When thinking is enabled, the status bar shows `[THINKING]`. Claude's internal reasoning steps are displayed in a collapsible block above the response.

**Note:** Extended thinking mode is only available with models that support extended thinking (Claude 3.7 Sonnet and newer). Toggling it on a model that does not support it has no effect and shows a brief warning in the status bar.

### `/` Prefix — Slash Command Picker

Typing `/` opens the slash command autocomplete picker. This is documented in depth in the Slash Commands reference. Key keyboard interactions:

| Key | Action in picker |
|-----|-----------------|
| Continue typing | Filter commands by name |
| `↑` / `↓` | Navigate filtered list |
| `Tab` | Confirm selection |
| `Esc` | Dismiss picker |
| `Enter` | Execute selected command |

---

## 7. Navigation Shortcuts

### `Esc Esc` (Double Escape) — Session Rewind Menu

Pressing `Esc` twice in rapid succession opens the session rewind menu. This is one of Claude Code's most powerful recovery features.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SESSION REWIND MENU                             │
│                                                                      │
│  Select a checkpoint to rewind to:                                   │
│                                                                      │
│  ● [Now]  Current state — no rewind                                  │
│  ○ [T-1]  After: "Refactor auth module"  (2 min ago)                │
│  ○ [T-2]  After: "Read src/auth/index.ts"  (4 min ago)              │
│  ○ [T-3]  After: "List project structure"  (7 min ago)              │
│  ○ [T-4]  Session start  (12 min ago)                               │
│                                                                      │
│  Use ↑↓ to navigate, Enter to rewind, Esc to cancel                 │
└─────────────────────────────────────────────────────────────────────┘
```

Selecting a checkpoint:
- Discards conversation history after that point
- **Does NOT undo file system changes** (writes, edits, deletions that happened after the checkpoint remain on disk)
- Restores Claude's context to the selected point so you can try a different approach

To undo file changes, use `git` — Claude Code does not provide filesystem rollback.

### `Ctrl+S` — Stats Screenshot

`Ctrl+S` captures a formatted screenshot of the current session statistics to your clipboard:

```
Claude Code Session Stats
─────────────────────────
Session:      auth-refactor
Model:        claude-sonnet-4-5
Duration:     47 minutes
Turns:        23

Token Usage
  Input (non-cached):   42,318
  Input (cache hit):    89,441
  Output:                8,203
  Cache writes:          3,102

Estimated cost:  $0.187
Cache savings:   $0.134

Mode:         Normal
Tools used:   Read ×31, Write ×8, Bash ×14
```

The output is copied to your clipboard as plain text. This is useful for:
- Sharing session context with a colleague
- Adding to a task tracker or ticket
- Debugging unexpected cost spikes

---

## 8. Custom Keybindings via `~/.claude/keybindings.json`

Claude Code supports user-defined keyboard shortcuts through a JSON configuration file. Custom keybindings can invoke slash commands, insert text snippets, or trigger any action expressible as a REPL command.

### File Location and Structure

```
~/.claude/keybindings.json
```

The file uses a simple JSON array of binding objects:

```json
[
  {
    "key": "ctrl+shift+k",
    "command": "/compact"
  },
  {
    "key": "ctrl+shift+r",
    "command": "/resume"
  },
  {
    "key": "ctrl+shift+p",
    "command": "/plan"
  }
]
```

Each binding object requires exactly two fields:

| Field | Type | Description |
|-------|------|-------------|
| `key` | string | Key combination in the format described below |
| `command` | string | REPL command or text to send when key is pressed |

### Key Format Syntax

Keys are described using a string with modifier names joined by `+`, followed by the key name:

```
"ctrl+shift+k"          ← Ctrl, Shift, and K
"ctrl+k"                ← Ctrl and K
"alt+enter"             ← Alt/Option and Enter
"shift+tab"             ← (Reserved — already used for mode cycling)
"ctrl+shift+alt+f12"    ← All three modifiers plus F12
```

**Valid modifier names:**

| In keybindings.json | Physical key (macOS) | Physical key (Linux/Windows) |
|---------------------|---------------------|------------------------------|
| `ctrl` | Control (⌃) | Ctrl |
| `shift` | Shift (⇧) | Shift |
| `alt` | Option (⌥) | Alt |
| `meta` | Command (⌘) | Windows key |

**Valid key names (non-letter keys):**

| Name | Key |
|------|-----|
| `enter` | Enter / Return |
| `tab` | Tab |
| `escape` | Escape |
| `space` | Space bar |
| `backspace` | Backspace / Delete |
| `delete` | Forward delete |
| `f1`–`f12` | Function keys |
| `home` | Home |
| `end` | End |
| `pageup` | Page Up |
| `pagedown` | Page Down |
| `up` `down` `left` `right` | Arrow keys |

Letter and digit keys are specified as their character: `"a"`, `"b"`, `"0"`, `"9"`, etc.

### Command Field Syntax

The `command` field can be:

**1. A slash command (with or without arguments):**
```json
{ "key": "ctrl+shift+c", "command": "/compact" }
{ "key": "ctrl+shift+n", "command": "/clear" }
{ "key": "ctrl+shift+m", "command": "/model claude-opus-4-5" }
```

**2. A text snippet inserted at cursor:**
```json
{ "key": "ctrl+shift+t", "command": "Please write tests for the function above" }
{ "key": "ctrl+shift+d", "command": "Please add JSDoc documentation to this function" }
```

**3. A bash passthrough command:**
```json
{ "key": "ctrl+shift+g", "command": "!git diff --staged" }
{ "key": "ctrl+shift+l", "command": "!git log --oneline -10" }
```

### Chord Bindings

Claude Code supports two-key chord bindings (press key A, then key B within 2 seconds):

```json
[
  {
    "key": "ctrl+k ctrl+f",
    "command": "/compact focus on the current file"
  },
  {
    "key": "ctrl+k ctrl+r",
    "command": "/resume"
  },
  {
    "key": "ctrl+k ctrl+c",
    "command": "/clear"
  }
]
```

Chord bindings use the same `key` string format with a space separating the two key combinations. The two-second timeout is not configurable in v2.1.126.

### Complete Example `~/.claude/keybindings.json`

```json
[
  {
    "key": "ctrl+shift+k",
    "command": "/compact",
    "description": "Compact conversation history"
  },
  {
    "key": "ctrl+shift+n",
    "command": "/clear",
    "description": "Clear conversation and start fresh"
  },
  {
    "key": "ctrl+shift+r",
    "command": "/resume",
    "description": "Open session resume picker"
  },
  {
    "key": "ctrl+shift+p",
    "command": "/plan",
    "description": "Switch to plan-only mode"
  },
  {
    "key": "ctrl+shift+m",
    "command": "/model",
    "description": "Open model selector"
  },
  {
    "key": "ctrl+shift+u",
    "command": "/usage",
    "description": "Show session token usage and cost"
  },
  {
    "key": "ctrl+shift+h",
    "command": "/help",
    "description": "Show help"
  },
  {
    "key": "ctrl+shift+t",
    "command": "Please write comprehensive tests for the code above, including edge cases",
    "description": "Insert test generation prompt"
  },
  {
    "key": "ctrl+shift+d",
    "command": "Please add complete JSDoc/docstring documentation to the function(s) above",
    "description": "Insert documentation prompt"
  },
  {
    "key": "ctrl+shift+e",
    "command": "Please explain what this code does in plain English",
    "description": "Insert explain prompt"
  },
  {
    "key": "ctrl+shift+g",
    "command": "!git diff --staged",
    "description": "Show staged git diff"
  },
  {
    "key": "ctrl+shift+l",
    "command": "!git log --oneline -10",
    "description": "Show recent git log"
  },
  {
    "key": "ctrl+k ctrl+f",
    "command": "/compact focus on the current task",
    "description": "Chord: compact with focus instruction"
  },
  {
    "key": "ctrl+k ctrl+s",
    "command": "/session-summary",
    "description": "Chord: show session summary"
  }
]
```

The optional `description` field is used in the `/keybindings` command output (see below) but has no functional effect.

### Applying Changes

Changes to `~/.claude/keybindings.json` are applied on the next Claude Code startup. There is no hot-reload in v2.1.126 — you must restart the REPL.

To verify your keybindings loaded correctly:

```
/keybindings
```

### The `/keybindings` Slash Command

The `/keybindings` command (v2.1.100+) shows all currently loaded custom keybindings:

```
/keybindings

Custom Keybindings (from ~/.claude/keybindings.json)
──────────────────────────────────────────────────────
  Ctrl+Shift+K    →  /compact
  Ctrl+Shift+N    →  /clear
  Ctrl+Shift+R    →  /resume
  Ctrl+Shift+P    →  /plan
  Ctrl+Shift+M    →  /model
  Ctrl+Shift+U    →  /usage
  Ctrl+Shift+T    →  [text snippet: 47 chars]
  Ctrl+K Ctrl+F   →  /compact focus on the current task

Use /keybindings edit to open ~/.claude/keybindings.json in your editor.
```

`/keybindings edit` opens `~/.claude/keybindings.json` in `$EDITOR` (or `vi` if not set).

### Conflicts with Built-in Bindings

If a custom keybinding conflicts with a built-in binding, the **built-in binding takes precedence** and the custom binding is silently ignored. A warning is printed to the REPL on startup:

```
Warning: custom keybinding 'shift+tab' conflicts with built-in 'mode cycle' — ignored
```

Built-in bindings that cannot be overridden:

| Built-in | Reason |
|----------|--------|
| `Ctrl+C` | POSIX signal handling — cannot be intercepted |
| `Ctrl+D` | EOF signal — cannot be intercepted |
| `Shift+Tab` | Mode cycling |
| `Esc Esc` | Session rewind |
| `Ctrl+B` | Shell background |

---

## 9. The `/terminal-setup` Command (v2.1.116+)

The `/terminal-setup` command (introduced in v2.1.116) configures your terminal emulator to support enhanced keyboard integration with Claude Code. It writes terminal-specific configuration files and/or prints instructions for your specific terminal.

### What `/terminal-setup` Does

Running `/terminal-setup` detects your current terminal emulator and performs or guides you through:

1. **Shift+Enter multiline binding** — configures the terminal to send `\x1b[13;2u` when Shift+Enter is pressed, which Claude Code intercepts as a "soft newline" request
2. **Scroll sensitivity** — increases terminal scroll speed for better navigation of long Claude responses
3. **Clipboard integration** — ensures Claude Code can read from and write to the system clipboard for the `Ctrl+S` stats screenshot feature
4. **True color support** — enables 24-bit color for Claude Code's syntax highlighting if the terminal supports it

### Running `/terminal-setup`

```
> /terminal-setup

Detected terminal: iTerm2 3.5.2 on macOS

Configuring Shift+Enter multiline binding...
  ✓ Written to: ~/Library/Application Support/iTerm2/Scripts/claude-code-setup.py
  ✓ iTerm2 Key Bindings updated

Configuring scroll sensitivity...
  ✓ Scroll multiplier set to 3x (was 1x)

Clipboard integration: ✓ Already configured

True color support: ✓ iTerm2 supports true color natively

Setup complete. Restart iTerm2 to apply all changes.
```

### Per-Terminal Setup Guide

#### macOS Terminal.app

```
> /terminal-setup

Detected terminal: macOS Terminal 2.14

Manual steps required (Terminal.app does not support programmatic configuration):

1. Open Terminal → Settings → Profiles → Keyboard
2. Click the "+" button to add a new key binding
3. Set:
     Key: Return
     Modifier: Shift
     Action: Send Text
     Text: \x1b[13;2u    (paste this exactly, including \x1b prefix)
4. Click OK and close Settings

After completing these steps, restart Claude Code to activate Shift+Enter multiline input.
```

**Note:** macOS Terminal.app has limited programmability. Option+Enter and Backslash+Enter remain available as alternatives.

#### iTerm2

```
> /terminal-setup

Detected terminal: iTerm2

Configuration applied automatically:
  ✓ Shift+Enter → Send Escape Sequence [13;2u
  ✓ Option key set to Esc+ (enables Alt+F, Alt+B word navigation)
  ✓ Scroll sensitivity: 3x
  ✓ Clipboard: OSC 52 enabled

Restart iTerm2 to apply changes.
```

iTerm2 stores key binding overrides per profile. The setup writes to your current profile. If you use multiple profiles, run `/terminal-setup` once in each profile's terminal window.

#### WezTerm

`/terminal-setup` prints a configuration snippet to add to your `~/.wezterm.lua`:

```lua
-- Add to ~/.wezterm.lua (generated by claude /terminal-setup)
local wezterm = require 'wezterm'
local config = {}

-- Shift+Enter sends the CSI u sequence for multiline input in Claude Code
config.keys = {
  {
    key = 'Enter',
    mods = 'SHIFT',
    action = wezterm.action.SendString '\x1b[13;2u',
  },
}

-- Option key as Alt for word navigation (Alt+F, Alt+B)
config.send_composed_key_when_left_alt_is_pressed = false
config.send_composed_key_when_right_alt_is_pressed = true

return config
```

After adding this to `~/.wezterm.lua`, WezTerm applies it immediately (no restart required — WezTerm hot-reloads its config).

#### Ghostty

`/terminal-setup` prints a configuration snippet to add to `~/.config/ghostty/config`:

```
# Add to ~/.config/ghostty/config (generated by claude /terminal-setup)
# Shift+Enter sends CSI u sequence for Claude Code multiline input
keybind = shift+enter=text:\x1b[13;2u

# Option key as Alt for readline compatibility
macos-option-as-alt = left
```

Ghostty also hot-reloads its config — changes apply to new windows immediately.

#### Windows Terminal

`/terminal-setup` writes a JSON fragment to add to your Windows Terminal `settings.json`:

```json
{
    "actions": [
        {
            "command": {
                "action": "sendInput",
                "input": "[13;2u"
            },
            "keys": "shift+enter",
            "name": "Claude Code multiline input"
        }
    ]
}
```

To apply:
1. Open Windows Terminal
2. Settings → Open JSON file (`Ctrl+Shift+,`)
3. Add the action to the `"actions"` array
4. Save and restart Windows Terminal

#### VS Code Integrated Terminal

VS Code's integrated terminal supports terminal escape sequences but requires a specific keybinding in `keybindings.json`:

Add to VS Code `keybindings.json` (`Ctrl+Shift+P` → "Open Keyboard Shortcuts (JSON)"):

```json
{
    "key": "shift+enter",
    "command": "workbench.action.terminal.sendSequence",
    "args": { "text": "[13;2u" },
    "when": "terminalFocus"
}
```

This only affects the integrated terminal when it has focus — it does not interfere with VS Code's Shift+Enter behavior in the editor.

---

## 10. Readline Shortcuts in the Claude Code REPL

Claude Code's REPL implements GNU Readline-compatible line editing. The following shortcuts work at the input field and are identical to their behavior in bash, zsh, and other readline-using applications.

### Cursor Movement

| Shortcut | Action | Notes |
|----------|--------|-------|
| `Ctrl+A` | Beginning of line | Same as Home key |
| `Ctrl+E` | End of line | Same as End key |
| `Ctrl+F` | Forward one character | Same as → |
| `Ctrl+B` | Backward one character | **Note:** In Claude Code, Ctrl+B is intercepted for shell background. Use ← instead |
| `Alt+F` | Forward one word | Requires correct Option/Alt configuration |
| `Alt+B` | Backward one word | Requires correct Option/Alt configuration |
| `Ctrl+X Ctrl+X` | Toggle between current pos and start of line | Chord binding |

### Text Editing

| Shortcut | Action |
|----------|--------|
| `Ctrl+D` | Delete character at cursor (or EOF if line empty) |
| `Backspace` | Delete character before cursor |
| `Ctrl+H` | Same as Backspace |
| `Alt+D` | Delete word forward from cursor |
| `Ctrl+W` | Delete word backward from cursor |
| `Ctrl+K` | Kill (delete) to end of line |
| `Ctrl+U` | Kill (delete) to beginning of line |
| `Ctrl+Y` | Yank (paste) most recently killed text |
| `Alt+Y` | Cycle through kill ring (after Ctrl+Y) |
| `Ctrl+T` | Transpose characters before cursor |
| `Alt+T` | Transpose words before cursor |
| `Alt+U` | Uppercase word from cursor |
| `Alt+L` | Lowercase word from cursor |
| `Alt+C` | Capitalize word from cursor |

### History Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Previous history entry (same as ↑) |
| `Ctrl+N` | Next history entry (same as ↓) |
| `Ctrl+R` | Reverse incremental search |
| `Ctrl+S` | Forward incremental search (may conflict with terminal flow control) |
| `Alt+<` | First entry in history |
| `Alt+>` | Last entry in history (current) |

### Display

| Shortcut | Action |
|----------|--------|
| `Ctrl+L` | Clear screen (keeps current input line) |
| `Ctrl+X Ctrl+E` | Open current line in `$EDITOR` for multiline editing |

**`Ctrl+X Ctrl+E` for complex prompts:** This chord opens your `$EDITOR` (vim, nano, VS Code, etc.) with the current input line. When you save and exit the editor, the content is pasted back into the Claude Code prompt. Useful for composing long, complex prompts with full editor capabilities.

---

## 11. Terminal Compatibility Matrix

Not all keyboard shortcuts work in all terminals. This matrix documents confirmed behavior as of Claude Code v2.1.126.

### Built-in Shortcuts Compatibility

| Shortcut | macOS Terminal | iTerm2 | WezTerm | Ghostty | Windows Terminal | Alacritty | tmux (inner) |
|----------|---------------|--------|---------|---------|-----------------|-----------|--------------|
| `Ctrl+C` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `Ctrl+D` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `Ctrl+R` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `Ctrl+B` (background) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ (prefix key) |
| `Shift+Tab` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `Esc Esc` (rewind) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `Ctrl+S` (screenshot) | ✓ | ✓ | ✓ | ✓ | ✓ | Partial | ✗ |
| `Tab` (thinking toggle) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `!` bash mode | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `@` file autocomplete | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### Multiline Input Compatibility

| Method | macOS Terminal | iTerm2 | WezTerm | Ghostty | Windows Terminal | Alacritty | SSH session |
|--------|---------------|--------|---------|---------|-----------------|-----------|-------------|
| `Option+Enter` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| `Backslash+Enter` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `Shift+Enter` (setup) | Manual | Auto | Manual | Manual | Manual | ✗ | ✗ |

### Readline Shortcut Compatibility

| Shortcut | Works everywhere | Notes |
|----------|-----------------|-------|
| `Ctrl+A/E` | ✓ | Universal |
| `Ctrl+K/U` | ✓ | Universal |
| `Ctrl+W` | ✓ | Universal |
| `Ctrl+Y` | ✓ | Universal |
| `Ctrl+L` | ✓ | Universal |
| `Alt+F/B` | Partial | Requires Option→Esc+ config on macOS |
| `Alt+D` | Partial | Same requirement as Alt+F/B |
| `Ctrl+X Ctrl+E` | Partial | Requires $EDITOR set |
| `Ctrl+S` (search) | Partial | Conflicts with XON/XOFF flow control in some terminals |

---

## 12. Accessibility Considerations

### Keyboard-Only Navigation

Claude Code is designed to be fully operable without a mouse. All interactive UI elements are reachable via keyboard:

| UI Element | Keyboard access |
|------------|----------------|
| Slash command picker | `/` to open, `↑↓` to navigate, `Tab` to confirm |
| File path autocomplete | `@` to open, type to filter, `↑↓` to navigate |
| Tool approval dialogs | `y`/`n`/`a` (yes/no/always allow) |
| Session rewind menu | `Esc Esc` to open, `↑↓` to navigate, `Enter` to confirm |
| Model selector | `/model` then `↑↓` to navigate |
| Settings toggles | Keyboard only (no mouse interaction required) |

### Screen Reader Compatibility

Claude Code outputs text to a terminal emulator, making it compatible with screen readers that work with terminal output (NVDA + Windows Terminal, VoiceOver + macOS Terminal/iTerm2, Orca + Linux terminals).

**Recommended screen reader configurations:**

**VoiceOver (macOS) + iTerm2:**
```
iTerm2 Preferences → Accessibility:
  ✓ Speak when text changes (helps with Claude's streaming output)
  ✓ Announce when selection changes
```

**NVDA + Windows Terminal:**
- Enable "Speak typed characters" in NVDA speech settings
- Windows Terminal's accessibility mode (`accessibility_mode: true` in settings.json) improves announcement of new content

**Known limitations:**
- Streaming output (Claude typing character-by-character) can overwhelm screen readers. The `--no-stream` flag outputs each response atomically: `claude --no-stream`
- ASCII diagrams in Claude responses are not inherently accessible — they are decorative
- The progress spinner during tool execution reads as noise to some screen readers

### Reducing Animation

Claude Code's progress indicators and spinners can be disabled for users with vestibular disorders or who prefer reduced motion:

```bash
# Add to ~/.claude/settings.json
{
  "display": {
    "animationsEnabled": false,
    "spinnerEnabled": false
  }
}
```

Or via environment variable:

```bash
export CLAUDE_NO_ANIMATION=1
```

### High Contrast and Color Blindness

Claude Code respects your terminal's color scheme. If you use a high-contrast terminal theme, Claude Code's syntax highlighting adapts accordingly.

To disable all color output:

```bash
export NO_COLOR=1         # Standard NO_COLOR spec (https://no-color.org)
claude                    # Launches with no ANSI color codes
```

---

## 13. Troubleshooting Keybinding Issues

### Common Issues and Resolutions

#### `Ctrl+B` Does Not Background Claude Code — Goes to tmux Instead

**Problem:** You are running Claude Code inside a tmux session. tmux intercepts `Ctrl+B` as its prefix key before Claude Code can receive it.

**Solution 1:** Change your tmux prefix key to something Claude Code does not use:

```bash
# ~/.tmux.conf
set -g prefix C-a        # Use Ctrl+A as prefix instead of Ctrl+B
unbind C-b
bind C-a send-prefix
```

**Solution 2:** Use `Ctrl+B Ctrl+B` to send a literal `Ctrl+B` through tmux to Claude Code (tmux default passthrough for the prefix key).

**Solution 3:** Use `Ctrl+Z` followed by `fg` for shell backgrounding (tmux does not intercept `Ctrl+Z`).

#### `Option+Enter` Inserts a Special Character Instead of a Newline

**Problem:** The terminal is interpreting `Option+Enter` as a macOS input method shortcut and inserting `↵` or another character.

**Solution — iTerm2:**
1. Preferences → Profiles → Keys → Left Option Key → Set to **Esc+**
2. Restart iTerm2

**Solution — macOS Terminal:**
1. Preferences → Profiles → Keyboard → Check "Use Option as Meta key"
2. Restart Terminal

**Alternative:** Use Backslash+Enter or configure Shift+Enter via `/terminal-setup`.

#### `Shift+Tab` Does Not Cycle Modes

**Problem:** Some terminals and terminal multiplexers intercept `Shift+Tab` or convert it to a different sequence.

**Diagnosis:** Run this in your terminal to check what sequence `Shift+Tab` actually sends:

```bash
cat -v
# Press Shift+Tab
# Expected output: ^[[Z
# If you see something else, your terminal is not sending the right sequence
```

**Solution for tmux:** Add to `~/.tmux.conf`:

```bash
# Pass Shift+Tab through to applications
bind-key -n S-Tab send-keys -H 1b 5b 5a
```

**Solution for screen:** Add to `~/.screenrc`:

```
# Fix Shift+Tab
bindkey "\033[Z" "backtab"
```

#### Custom Keybindings Not Working

**Checklist:**

1. Confirm `~/.claude/keybindings.json` is valid JSON:
   ```bash
   python3 -m json.tool ~/.claude/keybindings.json
   ```

2. Restart Claude Code (keybindings are only read at startup)

3. Run `/keybindings` to confirm bindings were loaded

4. Check for conflicts with built-in bindings (built-in wins silently)

5. Check for conflicts with your terminal emulator — the terminal must pass the key sequence to the process, not intercept it for its own use

6. Verify the key format string is valid — common mistakes:
   ```json
   // WRONG:
   { "key": "Ctrl+Shift+K" }    // Capital letters not allowed
   { "key": "control+k" }       // Full word not allowed
   { "key": "cmd+k" }           // Use "meta" not "cmd"

   // CORRECT:
   { "key": "ctrl+shift+k" }
   { "key": "ctrl+k" }
   { "key": "meta+k" }
   ```

#### `Ctrl+S` Freezes the Terminal (XON/XOFF)

**Problem:** `Ctrl+S` triggers XON/XOFF software flow control in the terminal, freezing the display. `Ctrl+Q` unfreezes it.

**Solution:** Disable XON/XOFF in your terminal or shell:

```bash
# Add to ~/.bashrc or ~/.zshrc
stty -ixon

# Or for the current session only:
stty -ixon
```

After disabling XON/XOFF, `Ctrl+S` correctly activates Claude Code's stats screenshot.

#### `Esc Esc` (Double Escape) Opens Shell Escape Instead of Rewind Menu

**Problem:** In some terminals, `Esc Esc` is intercepted for terminal-specific functions (e.g., some vim-mode terminal configurations use Esc to enter normal mode).

**Solution:** Check your shell's `vi-mode` or `emacs-mode` settings:

```bash
# zsh — check vi mode
bindkey -l    # Lists current keymap

# If using vi mode:
bindkey -M main "^[^[" self-insert    # Prevents zsh from consuming Esc Esc
```

Claude Code detects the double-Esc at the application level, but the shell's readline layer may intercept the first `Esc` before it reaches Claude Code.

### Getting Help

For keybinding issues not covered above:

```bash
# Check what escape sequences your key combinations send:
cat -v    # Press the key, see the raw sequence

# Check if a sequence reaches Claude Code:
claude --debug    # Enables key event logging
```

The debug log shows every keypress with its decoded name, making it easy to see if the right sequence is being received.

---

## 14. Summary Reference Card

```
╔═══════════════════════════════════════════════════════════════════════╗
║              CLAUDE CODE KEYBOARD SHORTCUTS — QUICK REFERENCE         ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  SESSION CONTROL                                                      ║
║  Ctrl+C          Interrupt current operation                          ║
║  Ctrl+D          Exit Claude Code                                     ║
║  Ctrl+B          Background to shell (fg to return)                  ║
║  Ctrl+S          Copy session stats to clipboard                      ║
║                                                                       ║
║  MODE CYCLING (Shift+Tab cycles through all three)                   ║
║  [NORMAL]        Standard approval flow                               ║
║  [AUTO-ACCEPT]   All tools execute without confirmation               ║
║  [PLAN MODE]     Read-only — Claude describes but does not write      ║
║                                                                       ║
║  MULTILINE INPUT                                                      ║
║  Option+Enter    New line (macOS)                                     ║
║  Backslash+Enter New line (universal)                                 ║
║  Shift+Enter     New line (after /terminal-setup)                    ║
║                                                                       ║
║  SPECIAL MODES                                                        ║
║  !<command>      Run shell command directly                           ║
║  @<path>         File path autocomplete                               ║
║  Tab             Toggle extended thinking                             ║
║  /<command>      Slash command picker                                 ║
║                                                                       ║
║  NAVIGATION                                                           ║
║  Esc Esc         Open session rewind menu                            ║
║  Ctrl+R          Reverse history search                               ║
║  ↑ / ↓           History navigation                                  ║
║                                                                       ║
║  CURSOR & EDITING (Readline)                                          ║
║  Ctrl+A / Ctrl+E Start / End of line                                 ║
║  Ctrl+K / Ctrl+U Kill to end / Kill to start                         ║
║  Ctrl+W          Kill word backward                                   ║
║  Ctrl+Y          Yank (paste killed text)                             ║
║  Alt+F / Alt+B   Word forward / backward                             ║
║  Ctrl+L          Clear screen                                         ║
║                                                                       ║
║  CUSTOM KEYBINDINGS                                                   ║
║  ~/.claude/keybindings.json    User keybinding configuration          ║
║  /keybindings                  Show loaded keybindings                ║
║  /keybindings edit             Edit keybindings file                  ║
║  /terminal-setup               Configure terminal integration         ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```
