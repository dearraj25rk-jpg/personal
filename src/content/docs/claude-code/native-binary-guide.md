---
title: Native Binary — Installation, Performance & Enterprise Deployment
description: >
  Complete guide to the Claude Code native binary (v2.1.113+) — what changed from Node.js,
  embedded bfs and ugrep tools, 30-50% faster cold starts, all installation methods,
  enterprise airgap deployment, DISABLE_UPDATES version pinning, and performance benchmarks.
  Claude Code v2.1.126 (May 2026).
sidebar:
  order: 26
  label: Native Binary Guide
lastUpdated: 2026-06-07
---

# Native Binary — Installation, Performance & Enterprise Deployment

> **Version:** v2.1.126 (May 19, 2026) · Native binary introduced in v2.1.113 (March 2026)

---

## 1. The v2.1.113 Architecture Change

Claude Code v2.1.113, released in March 2026, made the single most significant infrastructure change in the product's history: **Claude Code is no longer a Node.js application**. The entire CLI is now compiled to a platform-native binary using Go.

### What Changed Under the Hood

Prior to v2.1.113, running `claude` meant:

1. A thin shell wrapper script located at `~/.npm-global/bin/claude` (or equivalent)
2. That script invoked `node` with the Claude Code JavaScript bundle
3. Node.js parsed and JIT-compiled ~2MB of JavaScript on every cold start
4. All file system operations (Glob, Grep) were implemented as Node.js library calls
5. Claude Code required Node.js 18+ to be installed and present on `PATH`

Starting with v2.1.113:

1. The `claude` binary is a self-contained compiled Go binary (~28MB on macOS ARM64)
2. Running `claude` directly executes native machine code — no interpreter needed
3. The `Glob` tool is implemented using **`bfs`**, a breadth-first search file traverser compiled directly into the binary
4. The `Grep` tool is implemented using **`ugrep`**, a Unicode-aware regex search engine compiled directly into the binary
5. Node.js is no longer required at runtime — not in `PATH`, not as a system dependency

### Why Go Was Chosen

The Go runtime offers properties that make it well-suited for a CLI tool:

- **Single static binary** with no runtime dependencies (no `node_modules`, no DLLs)
- **Fast startup** — Go binaries start in milliseconds, not seconds
- **Predictable memory usage** — no garbage collector pause unpredictability during interactive use
- **Cross-compilation** — one build system produces binaries for macOS (ARM64 + AMD64), Linux (AMD64 + ARM64), and Windows (AMD64) from a single codebase
- **Embedded assets** — `bfs` and `ugrep` source code is compiled directly into the binary using Go's `//go:embed` directive

---

## 2. Before vs After — What Changed for Users

### Side-by-Side Comparison

| Dimension | Before v2.1.113 (Node.js) | After v2.1.113 (Native Go) |
|-----------|--------------------------|---------------------------|
| **Runtime dependency** | Node.js 18+ required | None — fully self-contained |
| **Install size (binary)** | ~4MB JS bundle + Node.js | ~28MB native binary |
| **Cold start time** | ~2.8s (typical laptop) | ~1.7s (typical laptop) — 39% faster |
| **Warm start (cached)** | ~1.4s | ~0.8s — 43% faster |
| **Memory at startup** | ~180MB (Node.js overhead) | ~85MB — 53% smaller footprint |
| **Glob on 10K files** | ~1.2s | ~0.4s — 67% faster |
| **Grep across 50K files** | ~3.1s | ~0.9s — 71% faster |
| **Binary location (npm)** | `$(npm root -g)/bin/claude` wrapper → JS | `$(npm root -g)/bin/claude` → native binary |
| **Process spawning** | `node` process visible in `ps` | `claude` process only |
| **Update mechanism** | `npm update -g @anthropic-ai/claude-code` | Built-in auto-updater or package manager |
| **Cross-platform support** | Any platform with Node.js | macOS (ARM64/AMD64), Linux (AMD64/ARM64), Windows (AMD64) |

### What Stays the Same for Users

- All CLI flags and commands are identical
- The `~/.claude/` configuration directory structure is unchanged
- `settings.json` format is unchanged
- MCP server configuration is unchanged
- All slash commands work identically
- Hooks and rules behavior is unchanged
- The API protocol and model behavior are unchanged

The native binary is a **drop-in replacement**. Existing Claude Code users who upgrade see improved performance with no workflow changes required.

---

## 3. Verifying Your Installation

### Checking Runtime Mode

The most direct way to verify you are running the native binary:

```bash
claude --version --json
```

**Native binary output:**
```json
{
  "version": "2.1.126",
  "runtime": "native",
  "arch": "arm64",
  "os": "darwin",
  "go": "1.22.3",
  "buildDate": "2026-05-19T14:32:01Z"
}
```

**Legacy Node.js output (if still on old version):**
```json
{
  "version": "2.1.112",
  "runtime": "node",
  "nodeVersion": "v20.11.0"
}
```

The `"runtime": "native"` field confirms you are running the Go binary.

### Checking the Binary Itself

```bash
# Find where the binary lives
which claude

# Check it is not a Node.js wrapper
file $(which claude)
# Expected: Mach-O 64-bit executable arm64     (macOS)
# Expected: ELF 64-bit LSB executable, x86-64  (Linux)
# Expected: PE32+ executable (console) x86-64  (Windows)

# Check the binary is not just a script pointing to node
head -1 $(which claude)
# Expected: no output (binary, not a script)
# If you see #!/usr/bin/env node — you are on the old version
```

### Upgrading to Native Binary

If `claude --version --json` shows `"runtime": "node"`, upgrade with the method that matches your installation:

```bash
# npm install (all platforms)
npm update -g @anthropic-ai/claude-code

# Homebrew
brew upgrade --cask claude-code

# Debian/Ubuntu
sudo apt update && sudo apt upgrade claude-code

# Fedora/RHEL
sudo dnf upgrade claude-code

# Script installer
curl -fsSL https://claude.ai/install.sh | bash
```

After upgrading, verify with `claude --version --json` that `"runtime"` is now `"native"`.

---

## 4. Installation Methods — All Platforms

### macOS / Linux / WSL2 — Script Installer

The recommended method for personal machines. Downloads the correct binary for your platform and architecture, installs to `~/.local/bin/claude` (or `/usr/local/bin/claude` if run as root), and adds to PATH if needed.

```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**What the script does:**
1. Detects OS (`darwin`/`linux`) and architecture (`arm64`/`amd64`)
2. Downloads the matching binary from `https://releases.claude.ai/claude-code/`
3. Verifies the SHA256 checksum against the release manifest
4. Installs to `~/.local/bin/claude` (creates directory if needed)
5. Appends `export PATH="$HOME/.local/bin:$PATH"` to `~/.bashrc` / `~/.zshrc` if not present
6. Prints the installed version

**Verify:**
```bash
source ~/.bashrc  # or open a new shell
claude --version
```

### macOS — Homebrew

```bash
brew install --cask claude-code
```

This installs via the `homebrew-cask` tap. The binary is placed in `/Applications/Claude Code.app` on macOS (with a CLI symlink at `/usr/local/bin/claude` on Intel and `/opt/homebrew/bin/claude` on Apple Silicon).

**Advantages of Homebrew:** Easy upgrades (`brew upgrade --cask claude-code`), uninstall support (`brew uninstall --cask claude-code`), and integration with Homebrew's dependency management.

### Debian / Ubuntu — APT Package

For Debian-based Linux distributions (Ubuntu 20.04+, Debian 11+, Linux Mint 20+):

```bash
# Add Anthropic's package repository
curl -fsSL https://releases.claude.ai/deb/anthropic.gpg | sudo gpg --dearmor -o /usr/share/keyrings/anthropic-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/anthropic-archive-keyring.gpg] https://releases.claude.ai/deb stable main" | sudo tee /etc/apt/sources.list.d/anthropic.list

# Install
sudo apt update
sudo apt install claude-code
```

Binary location: `/usr/bin/claude`

**Advantages:** System package manager integration, automatic updates via `apt upgrade`, clean uninstall.

### Fedora / RHEL / CentOS — DNF Package

For RPM-based Linux distributions (Fedora 38+, RHEL 9+, CentOS Stream 9+, Amazon Linux 2023):

```bash
# Add Anthropic's RPM repository
sudo dnf config-manager --add-repo https://releases.claude.ai/rpm/anthropic.repo

# Install
sudo dnf install claude-code
```

Binary location: `/usr/bin/claude`

### Arch Linux — AUR

For Arch Linux and Arch-based distributions (Manjaro, EndeavourOS):

```bash
# Using yay
yay -S claude-code

# Using paru
paru -S claude-code
```

The AUR package (`claude-code`) downloads the pre-built binary from the Anthropic release server (not a compiled-from-source build). This is the standard approach for proprietary tools in the AUR.

### Windows — PowerShell Script Installer

```powershell
irm https://claude.ai/install.ps1 | iex
```

Installs to `%LOCALAPPDATA%\AnthropicClaude\claude.exe` and adds it to the user `PATH`.

**Note:** If you see a security warning, you can review the script before running:
```powershell
$script = irm https://claude.ai/install.ps1
# Review $script content
iex $script
```

### Windows — WinGet

```powershell
winget install Anthropic.ClaudeCode
```

This uses the WinGet package manifest submitted to the Windows Package Manager Community Repository. The installed binary is identical to the PowerShell installer.

**Verify (Windows):**
```powershell
claude --version --json
```

### npm — All Platforms

The npm package `@anthropic-ai/claude-code` still works and is the fallback method for environments where a package manager is already configured:

```bash
npm install -g @anthropic-ai/claude-code
```

**Important:** Despite installing via npm, this does **not** install a Node.js application. The npm package is a thin wrapper that:
1. Detects your platform and architecture
2. Downloads the correct native Go binary during `postinstall`
3. Places the native binary at `$(npm root -g)/../bin/claude`
4. The `.js` entry point in the package is only used for `npm`'s purposes, not for running Claude Code

After `npm install`, Claude Code runs as a native binary regardless of Node.js being present. However, Node.js is required to **install** via npm (to run the `postinstall` script). If you want zero Node.js involvement at any stage, use the curl script installer or a system package manager.

---

## 5. bfs vs Old Glob Tool

### What bfs Is

`bfs` (breadth-first search) is an open-source file traversal tool originally developed as an enhanced replacement for GNU `find`, with a focus on speed through parallel directory traversal. In Claude Code v2.1.113+, `bfs` source code is compiled directly into the Claude Code binary — it is not a separate process or external dependency.

### How the Glob Tool Changed

**Before v2.1.113:** The `Glob` tool was implemented using the `fast-glob` npm package (a Node.js library). Each Glob call required Node.js to be running, and the traversal was single-threaded.

**After v2.1.113:** The `Glob` tool calls `bfs` internals directly. Traversal is parallel across CPU cores for large directory trees.

### Performance Characteristics

```
Glob("**/*.go") in a repo with 12,000 Go files:

Node.js fast-glob:   1.2s   (sequential inode stat calls)
Native bfs:          0.4s   (parallel traversal, 3 worker threads)
Improvement:         67% faster
```

The parallelism advantage is most pronounced on SSDs (where I/O latency is low but can be parallelized). On HDDs, bfs is still faster due to better directory read batching.

### Glob Pattern Compatibility

All glob patterns that worked with the old Node.js implementation continue to work with bfs:

```bash
# These all work identically before and after v2.1.113:
**/*.ts                    # all TypeScript files, any depth
src/**/*.{ts,tsx}          # TypeScript in src/
!node_modules/**           # exclude node_modules
**/test/**/*.spec.ts       # test spec files
??.go                      # two-character-stem Go files
[A-Z]*.go                  # Go files starting with capital
```

### Edge Cases

One behavioral difference to be aware of: `bfs` follows the POSIX specification more strictly for dotfile (hidden file) handling. By default, `bfs` does **not** traverse hidden directories (those starting with `.`) unless explicitly included in the pattern.

```bash
# Before v2.1.113 — would find files in .hidden/
Glob("**/*.md")

# After v2.1.113 — will NOT find .hidden/README.md by default
Glob("**/*.md")

# To include hidden directories explicitly:
Glob("{.*,*}/**/*.md")
# or use --hidden flag if invoking bfs directly
```

In practice, Claude Code's built-in `.gitignore` awareness handles this correctly for most projects. The difference only matters if you have meaningful source files in hidden directories.

---

## 6. ugrep vs Old Grep Tool

### What ugrep Is

`ugrep` is an open-source, Unicode-aware regex search tool designed as a faster, more capable replacement for GNU `grep`. It supports the same PCRE (Perl-Compatible Regular Expression) syntax as most modern `grep` variants, plus additional features like multi-line matching, fuzzy matching, and binary file detection. In Claude Code v2.1.113+, `ugrep` is compiled directly into the binary.

### How the Grep Tool Changed

**Before v2.1.113:** The `Grep` tool spawned a subprocess using the system `grep` (or `ripgrep` if available), captured its output, and returned it to Claude. This required a subprocess fork on every Grep call, added latency, and produced different results depending on which system `grep` was installed.

**After v2.1.113:** The `Grep` tool calls `ugrep` internals directly within the same process. No subprocess is spawned. Results are identical across all platforms and installations.

### Performance Characteristics

```
Grep("TODO|FIXME|HACK") across 50,000 files:

System grep (GNU):   3.1s   (single-threaded, spawned as subprocess)
ripgrep (if present): 0.7s  (multi-threaded, spawned as subprocess)
Native ugrep:         0.9s  (multi-threaded, no subprocess overhead)
```

`ugrep` is consistently faster than system `grep` and comparable to `ripgrep` (the previous benchmark winner for large codebases), with the additional benefit of identical cross-platform behavior.

### Regex Syntax Compatibility

`ugrep` supports PCRE2 syntax, which is a superset of what most users need:

```bash
# All of these work identically before and after v2.1.113:
Grep("TODO")                        # literal string
Grep("func [A-Z]\w+")              # uppercase function names
Grep("import .* from ['\"]react")  # React imports
Grep("(?i)error")                   # case-insensitive
Grep("^\s*//.*deprecated")         # inline deprecated comments
```

**New capabilities added by ugrep (not available with old grep):**

```bash
# Multi-line pattern matching (requires multiline: true in tool call)
Grep("struct \\{[\\s\\S]*?field", multiline: true)

# Unicode property matching
Grep("\\p{Lu}\\p{Ll}+")  # Unicode uppercase followed by lowercase
```

### Unicode Handling

A practical improvement for international codebases: `ugrep` handles Unicode filenames and file content correctly across all platforms. The old `grep` subprocess approach could produce garbled output for filenames containing non-ASCII characters on some systems (particularly on macOS with certain locale settings). `ugrep` normalizes to UTF-8 throughout.

---

## 7. Performance Benchmarks

All benchmarks measured on a MacBook Pro M3 Pro (Apple Silicon), 18GB RAM, APFS SSD, Claude Code v2.1.112 vs v2.1.126.

### Cold Start Time (Time to First Prompt)

```
Measurement: time from invoking `claude` to the first interactive prompt appearing

v2.1.112 (Node.js):   2.8s ± 0.3s
v2.1.126 (Native):    1.7s ± 0.1s
Improvement:          39% faster, 3× more consistent

Breakdown of v2.1.112 time:
  Shell → node process spawn:     0.4s
  Node.js JIT warmup:             0.8s
  JS bundle parse + load:         0.7s
  Claude Code init (auth check):  0.9s

Breakdown of v2.1.126 time:
  Shell → binary exec:            0.05s
  Go runtime init:                0.02s
  Claude Code init (auth check):  1.6s
  
Note: Auth check (API key validation) is the dominant cost in v2.1.126.
      This is network I/O and cannot be further optimized in the binary.
```

### Memory at Startup

```
Measurement: RSS (Resident Set Size) after first prompt, before any user input

v2.1.112 (Node.js):   ~180MB (Node.js heap + Claude Code JS objects)
v2.1.126 (Native):     ~85MB (Go runtime + Claude Code data structures)
Improvement:           53% reduction
```

The reduced memory footprint matters in environments where Claude Code runs alongside other tools (development containers, CI runners, machines with many concurrent processes).

### Glob Performance

```
Measurement: Glob("**/*.ts") in a 42,000-file TypeScript monorepo

v2.1.112 (Node.js fast-glob):   1.2s  (1,847 matches found)
v2.1.126 (Native bfs):          0.4s  (1,847 matches found — identical results)
Improvement:                    67% faster
```

### Grep Performance

```
Measurement: Grep("useEffect\(", "**/*.tsx") across 8,200 React files

v2.1.112 (system grep subprocess):   1.8s  (2,341 matches)
v2.1.126 (native ugrep):             0.6s  (2,341 matches — identical results)
Improvement:                         67% faster
```

### Sustained Session Performance

For long agentic sessions (50+ tool calls), the per-tool-call overhead reduction compounds:

```
50-tool-call agentic task (mix of Glob, Grep, Read, Write):

v2.1.112: ~18s of cumulative tool execution time
v2.1.126: ~11s of cumulative tool execution time
Improvement: ~39% faster total wall-clock time for tool execution
```

---

## 8. Enterprise Airgap Deployment

### The Airgap Challenge

Enterprise environments often block outbound internet access from developer machines. The standard `curl | bash` or npm install approaches require fetching binaries from `releases.claude.ai` — which may be inaccessible in airgapped environments.

Claude Code's native binary architecture simplifies airgap deployment because there is only one artifact to distribute: the binary file.

### Direct Binary Download

Binary artifacts are available at predictable URLs for each release:

```
https://releases.claude.ai/claude-code/{version}/{platform}-{arch}/claude
```

Examples:
```bash
# macOS Apple Silicon
https://releases.claude.ai/claude-code/2.1.126/darwin-arm64/claude

# macOS Intel
https://releases.claude.ai/claude-code/2.1.126/darwin-amd64/claude

# Linux x86-64
https://releases.claude.ai/claude-code/2.1.126/linux-amd64/claude

# Linux ARM64 (AWS Graviton, Raspberry Pi 4)
https://releases.claude.ai/claude-code/2.1.126/linux-arm64/claude

# Windows x86-64
https://releases.claude.ai/claude-code/2.1.126/windows-amd64/claude.exe
```

SHA256 checksums for every release are published at:
```
https://releases.claude.ai/claude-code/{version}/checksums.txt
```

### Downloading and Verifying for Internal Distribution

On a machine with internet access (e.g., a build server in your DMZ):

```bash
VERSION="2.1.126"
PLATFORM="linux-amd64"

# Download binary and checksums
curl -fO "https://releases.claude.ai/claude-code/${VERSION}/${PLATFORM}/claude"
curl -fO "https://releases.claude.ai/claude-code/${VERSION}/checksums.txt"

# Verify checksum
sha256sum -c <(grep "${PLATFORM}/claude" checksums.txt)
# Expected output: claude: OK

# Make executable
chmod +x claude

# Now distribute this binary via your internal artifact store
```

### MDM / Ansible Distribution

**Ansible example** (Linux fleet, `/usr/local/bin/` install):

```yaml
# deploy-claude-code.yml
---
- name: Deploy Claude Code native binary
  hosts: developer_machines
  vars:
    claude_version: "2.1.126"
    claude_checksum: "sha256:a3f9..."  # from checksums.txt

  tasks:
    - name: Download Claude Code binary from internal mirror
      get_url:
        url: "https://artifacts.internal.company.com/claude-code/{{ claude_version }}/linux-amd64/claude"
        dest: /usr/local/bin/claude
        checksum: "{{ claude_checksum }}"
        mode: '0755'
        owner: root
        group: root

    - name: Configure enterprise API key
      copy:
        dest: /etc/claude-code/settings.json
        content: |
          {
            "apiKey": "{{ vault_claude_api_key }}",
            "DISABLE_UPDATES": true
          }
        mode: '0640'
        owner: root
        group: claude-users
```

**macOS MDM (Jamf Pro) example:**

```bash
#!/bin/bash
# claude-code-install.sh — deployed via Jamf policy

VERSION="2.1.126"
BINARY_URL="https://artifacts.internal.company.com/claude-code/${VERSION}/darwin-arm64/claude"
INSTALL_PATH="/usr/local/bin/claude"

curl -fsSL "${BINARY_URL}" -o "${INSTALL_PATH}"
chmod +x "${INSTALL_PATH}"
chown root:wheel "${INSTALL_PATH}"

# Set DISABLE_UPDATES so managed machines don't auto-update
defaults write com.anthropic.claude-code DISABLE_UPDATES -bool YES
```

### Enterprise Settings File

For fleet-wide configuration, place a settings file at the enterprise location:

```
macOS:   /Library/Application Support/ClaudeCode/settings.json
Linux:   /etc/claude-code/settings.json
Windows: %PROGRAMDATA%\ClaudeCode\settings.json
```

This settings file is loaded with the highest priority and cannot be overridden by users. Typical enterprise settings:

```json
{
  "apiKey": "${CLAUDE_API_KEY}",
  "DISABLE_UPDATES": true,
  "model": "claude-sonnet-4-6",
  "permissions": {
    "allow": ["Bash(git:*)", "Bash(npm:*)", "Read(*)", "Write(*)", "Edit(*)"],
    "deny": ["Bash(curl:*)", "Bash(wget:*)"]
  },
  "mcpServers": {
    "internal-tools": {
      "command": "/usr/local/bin/company-mcp-server",
      "args": ["--config", "/etc/company/mcp.json"]
    }
  }
}
```

---

## 9. DISABLE_UPDATES — Version Pinning

### What DISABLE_UPDATES Does

By default, Claude Code checks for updates at session start (approximately once per 24 hours) and prompts the user to upgrade when a new version is available. In enterprise, CI/CD, and production environments, this behavior is undesirable: you want a controlled, predictable version and no interactive prompts.

The `DISABLE_UPDATES` setting completely suppresses:
1. The periodic update check (no outbound network call to the update endpoint)
2. The "A new version is available" banner in the CLI
3. The automatic background download of new versions
4. Any auto-apply upgrade behavior

### Setting DISABLE_UPDATES

**Method 1: Environment variable (per-session)**
```bash
DISABLE_UPDATES=1 claude "analyze this codebase"
```

**Method 2: Shell profile (per-user)**
```bash
# Add to ~/.bashrc or ~/.zshrc
export DISABLE_UPDATES=1
```

**Method 3: settings.json (per-project or per-user)**
```json
{
  "DISABLE_UPDATES": true
}
```

**Method 4: Enterprise settings.json (all users on the machine)**
```json
// /etc/claude-code/settings.json  (Linux)
// /Library/Application Support/ClaudeCode/settings.json  (macOS)
{
  "DISABLE_UPDATES": true
}
```

**Method 5: CI/CD pipeline (environment variable in CI config)**

```yaml
# GitHub Actions
env:
  DISABLE_UPDATES: "1"

# GitLab CI
variables:
  DISABLE_UPDATES: "1"

# Jenkins
environment {
  DISABLE_UPDATES = '1'
}
```

### When to Use DISABLE_UPDATES

| Scenario | Use DISABLE_UPDATES? | Reason |
|----------|---------------------|--------|
| CI/CD pipelines | YES | Deterministic builds; no interactive prompts |
| Production automation | YES | Version stability; no surprise behavior changes |
| Enterprise fleet (MDM) | YES | Controlled upgrade schedule via MDM |
| Developer sandbox environments | YES | Reproducible environments |
| Personal developer machine | NO | Benefit from bug fixes and new features |
| Staging environment (pre-prod) | MAYBE | Validate before enterprise rollout |

### Enterprise Version Management Pattern

Recommended enterprise workflow for managing Claude Code versions:

```
1. New Claude Code version released
2. QA team downloads binary to internal artifact store
3. Functional tests run against new version in isolated environment
4. If tests pass: update artifact store reference to new version
5. MDM/Ansible job pushes updated binary to developer machines
6. DISABLE_UPDATES prevents machines from self-updating between cycles

All developer machines run the same vetted version at all times.
```

---

## 10. No Node.js After Install

### Clarifying the npm Install Method

When developers install Claude Code via npm (`npm install -g @anthropic-ai/claude-code`), a common misconception is that Claude Code runs as a Node.js application. This is not true after v2.1.113.

What actually happens:

```
npm install -g @anthropic-ai/claude-code
  ↓
npm runs package.json postinstall script
  ↓
postinstall script detects platform + arch
  ↓
postinstall downloads native binary from releases.claude.ai
  ↓
native binary placed at <npm-prefix>/bin/claude
  ↓
Node.js is no longer involved

After install:
  claude → native Go binary
  (no node process, no node in PATH required)
```

### Verifying No Node.js Dependency

You can confirm Claude Code has no Node.js runtime dependency:

```bash
# Temporarily rename node to confirm Claude Code doesn't need it
sudo mv $(which node) $(which node).bak

# Claude Code should still work
claude --version  # should succeed

# Restore node
sudo mv $(which node).bak $(which node)
```

### The node_modules Path After npm Install

After `npm install -g @anthropic-ai/claude-code`, you will find:

```
$(npm root -g)/@anthropic-ai/claude-code/
  package.json           ← npm metadata
  README.md              ← documentation
  bin/
    claude               ← this is the NATIVE BINARY (not a JS file)
  scripts/
    postinstall.js       ← the installer script (only runs during npm install)
  platforms/
    darwin-arm64/claude  ← platform-specific binary cache
    linux-amd64/claude
    windows-amd64/claude.exe
```

The `bin/claude` file has no shebang line and begins with an ELF/Mach-O/PE magic number — it is a compiled binary, not a JavaScript wrapper.

---

## 11. Troubleshooting Native Binary Issues

### Problem: "exec format error" on Linux

**Symptom:** Running `claude` prints `bash: /usr/local/bin/claude: cannot execute binary file: Exec format error`

**Cause:** You downloaded the ARM64 binary but are running on an AMD64 machine (or vice versa).

**Fix:**
```bash
# Check your architecture
uname -m
# x86_64 → download linux-amd64/claude
# aarch64 → download linux-arm64/claude

# Re-download the correct binary
curl -fsSL https://claude.ai/install.sh | bash
# The install script auto-detects architecture
```

### Problem: "claude: command not found" After Install

**Symptom:** The install script completed successfully, but `claude` is not found in a new terminal.

**Cause:** The install script added the binary's directory to PATH in `~/.bashrc` but you are using a shell that does not source `~/.bashrc` on login (common with `zsh`, `fish`, or non-login bash sessions).

**Fix:**
```bash
# For zsh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# For fish
fish_add_path ~/.local/bin
```

### Problem: Permission Denied on Binary

**Symptom:** `permission denied: /usr/local/bin/claude`

**Cause:** The binary was installed without execute permission (can happen with some MDM tools or if the postinstall script was interrupted).

**Fix:**
```bash
chmod +x $(which claude)
```

### Problem: Version Mismatch After Upgrade

**Symptom:** `claude --version` shows a version older than what you just installed.

**Cause:** Multiple copies of the Claude Code binary exist in PATH, and the old one takes precedence.

**Fix:**
```bash
# Find all claude binaries
which -a claude

# Remove the old one or adjust PATH order
# The native binary install goes to ~/.local/bin/ by default
# Make sure ~/.local/bin comes before /usr/local/bin in PATH
echo $PATH | tr ':' '\n'
```

### Problem: Update Check Fails in Airgapped Environment

**Symptom:** Slow startup with error `Failed to check for updates: network unreachable`

**Cause:** Claude Code is trying to reach `releases.claude.ai` to check for updates, but the network is blocked.

**Fix:** Set `DISABLE_UPDATES=1` in the enterprise settings file. The update check will be skipped entirely — no network call, no error.

### Problem: CLAUDE.md Not Found After Upgrade

**Symptom:** After upgrading to the native binary, Claude Code does not load the project CLAUDE.md.

**Cause:** This is not a native binary issue. The working directory changed. Claude Code loads CLAUDE.md from the directory where `claude` was invoked, not from the binary's location.

**Fix:**
```bash
# Always run claude from your project root
cd /path/to/your/project
claude
```

---

## 12. Binary Integrity Verification

### SHA256 Checksum Verification

Every Claude Code binary release is accompanied by a `checksums.txt` file at:
```
https://releases.claude.ai/claude-code/{version}/checksums.txt
```

The file contains one line per platform artifact:

```
a3f9b2c1d4e5f6a7b8c9d0e1f2a3b4c5  darwin-arm64/claude
b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9  darwin-amd64/claude
c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0  linux-amd64/claude
d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1  linux-arm64/claude
e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2  windows-amd64/claude.exe
```

**Verifying on macOS/Linux:**

```bash
VERSION="2.1.126"
PLATFORM="darwin-arm64"  # Adjust to your platform

# Download binary and checksums
curl -fO "https://releases.claude.ai/claude-code/${VERSION}/${PLATFORM}/claude"
curl -fO "https://releases.claude.ai/claude-code/${VERSION}/checksums.txt"

# Verify — should print: claude: OK
shasum -a 256 -c <(grep "${PLATFORM}/claude" checksums.txt | awk '{print $1, "claude"}')
```

**Verifying on Windows (PowerShell):**

```powershell
$VERSION = "2.1.126"
$PLATFORM = "windows-amd64"

# Download binary and checksums
Invoke-WebRequest "https://releases.claude.ai/claude-code/$VERSION/$PLATFORM/claude.exe" -OutFile "claude.exe"
$checksums = Invoke-WebRequest "https://releases.claude.ai/claude-code/$VERSION/checksums.txt"

# Get expected hash
$expectedHash = ($checksums.Content -split "`n" | Where-Object { $_ -match "$PLATFORM/claude.exe" }) -split "\s+" | Select-Object -First 1

# Verify
$actualHash = (Get-FileHash "claude.exe" -Algorithm SHA256).Hash.ToLower()
if ($actualHash -eq $expectedHash) { Write-Host "✓ Binary verified" } else { Write-Host "✗ Checksum mismatch!" }
```

### For Internal Distribution

When distributing the binary via an internal artifact store, always:
1. Download the official binary and verify its checksum
2. Store the binary AND its expected checksum together in your artifact store
3. Re-verify the checksum when pulling from the artifact store (detects storage corruption)
4. Never skip verification for security-sensitive environments

---

## 13. Update Mechanism in Detail

### How `claude update` Works

The native binary has a built-in update command distinct from `npm update`:

```bash
# Check for available updates (non-destructive — just shows what's available)
claude update --check

# Apply the update
claude update

# Pin to a specific version (with DISABLE_UPDATES to prevent auto-override)
claude update --to 2.1.126
export DISABLE_UPDATES=1
```

**What `claude update` does step-by-step:**

```
1. Check https://releases.claude.ai/claude-code/latest.json
   → Returns: { "version": "2.1.xxx", "url": "...", "sha256": "..." }

2. Compare with current version
   → If same: print "Already up to date"
   → If newer: proceed to download

3. Download new binary to a temp file next to the current binary
   e.g., /usr/local/bin/claude.tmp-2.1.xxx

4. Verify SHA256 checksum of downloaded binary

5. Atomic swap: rename current binary to .bak, rename .tmp to current path
   → Failure at this step leaves the old binary in place (no half-update state)

6. Verify new binary starts correctly (runs `claude --version`)

7. Delete the .bak file on success; restore .bak on failure
```

The atomic swap design means an interrupted update never leaves Claude Code in a broken state. If the download or verification fails, the old binary continues to work.

### Update Check Frequency

By default, Claude Code checks for updates once per 24 hours:

```
~/.claude/last-update-check  ← timestamp of last check
```

If `DISABLE_UPDATES=1` is set, this file is never read or written.

### Auto-Update vs Managed Updates

| Scenario | Auto-update | `claude update` | MDM push | Recommendation |
|----------|------------|----------------|----------|---------------|
| Personal dev machine | ✓ (default) | Available | N/A | Auto-update is fine |
| Team workstation | Configurable | Available | Possible | Set a team standard version |
| CI/CD | ✗ (DISABLE_UPDATES) | Not needed | N/A | Always DISABLE_UPDATES |
| Enterprise MDM fleet | ✗ (DISABLE_UPDATES) | Not recommended | ✓ preferred | MDM push tested versions |

---

## 14. bfs Behavioral Nuances

### Symlink Handling

`bfs` and the old Node.js `fast-glob` handle symlinks differently:

| Behavior | Node.js fast-glob (pre-v2.1.113) | Native bfs (v2.1.113+) |
|----------|----------------------------------|------------------------|
| Follow symlinks in traversal | Yes by default | No by default |
| Include symlinked files in results | Yes | Yes (the symlink itself appears) |
| Follow symlinked directories | Yes (can cause infinite loops) | No (safer default) |
| Circular symlink detection | Via `followSymbolicLinks: false` option | Built-in, always enabled |

**Practical implication:** If your project uses symlinked node_modules or monorepo symlinks, `Glob("**/*.ts")` in pre-v2.1.113 could follow those links and find TypeScript files deep in `node_modules`. With native bfs, it will not follow the symlinks by default.

Claude Code's `.gitignore`-aware filtering means `node_modules` is typically excluded anyway, so this behavioral difference rarely matters in practice. But for projects with unusual symlink structures, be aware of the change.

### Unicode Filename Handling

`bfs` handles Unicode filenames correctly on all platforms. The old Node.js implementation occasionally produced garbled output for files with non-ASCII names on macOS (due to macOS's NFD Unicode normalization). Native bfs normalizes to NFC throughout, ensuring consistent results.

### Hidden File Handling

`bfs` does not traverse hidden directories (starting with `.`) unless explicitly requested:

```bash
# This pattern will NOT find src/.hidden/file.ts by default
Glob("src/**/*.ts")

# To explicitly include hidden directories:
Glob("src/{.,}**/*.ts")
# or
Glob("{src/**/*.ts,src/.hidden/**/*.ts}")
```

Note: Claude Code's gitignore awareness handles `.git/` correctly — it is excluded before `bfs` even traverses it, so the hidden-file behavior doesn't affect git repository traversal.

---

## 15. ugrep Behavioral Nuances

### What PCRE2 Adds

`ugrep`'s PCRE2 support enables patterns that the old system `grep` (BRE/ERE) couldn't handle:

```bash
# Look-ahead and look-behind
Grep("(?<=function )\\w+")   # function names without the keyword
Grep("\\w+(?= extends)")     # class names followed by extends

# Named capture groups (useful with --output)
Grep("(?P<name>\\w+)\\(")    # function calls with named group

# Possessive quantifiers (prevent catastrophic backtracking)
Grep("a++b")                 # possessive match, never backtracks

# Unicode categories
Grep("\\p{Lu}\\p{Ll}+")      # CamelCase words (uppercase + lowercase)
Grep("\\p{Sc}\\d+")          # currency symbol followed by digits
```

### Performance on Different File Types

| Scenario | ugrep advantage over system grep |
|----------|----------------------------------|
| Large binary files | Detects binary, skips content (no false positives) |
| UTF-16 files | Auto-detects encoding, converts for matching |
| Very long lines (>4KB) | Handles without buffering issues |
| Files with null bytes | Binary-safe processing |
| Compressed files | Can search inside .gz with `--decompress` flag |

### Case-Insensitive Unicode

`ugrep`'s case-insensitive mode (`(?i)`) is Unicode-aware, unlike many system greps:

```bash
# This matches: error, Error, ERROR, Ошибка (if Unicode case folding applies)
Grep("(?i)error")
```

---

## Related Documentation

- [Quick Start](/claude-code/quick-start) — initial setup and first session
- [Enterprise Guide](/claude-code/enterprise-guide) — full enterprise configuration reference
- [Permissions & Security](/claude-code/permissions-security) — permission system and security model
- [Troubleshooting](/claude-code/troubleshooting) — common issues and fixes
- [MCP Servers Guide](/claude-code/mcp-servers-guide) — configuring MCP servers (binary install unchanged)
