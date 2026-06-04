---
title: Remote Control & Cloud Sessions — Mobile and Web Integration
description: >
  Complete guide to Claude Code Remote Control (bridge between local CLI and claude.ai/code)
  and Cloud Sessions (browser-native sessions without a local binary) — architecture, security
  model, mobile use on iOS/Android, available features, and setup instructions.
  Claude Code v2.1.126 (May 2026).
sidebar:
  order: 27
  label: Remote Control Guide
lastUpdated: 2026-06-04
---

# Remote Control & Cloud Sessions — Mobile and Web Integration

> **Version:** v2.1.126 (May 19, 2026) · Remote Control introduced in v2.1.98 (January 2026)

---

## 1. Two Ways to Use Claude Code Remotely

Claude Code can be used outside of a local terminal through two distinct mechanisms. Understanding the difference between them is essential before choosing which to use.

### Remote Control

**Remote Control** is a bridge between a running local Claude Code process and a browser or mobile device. Your local `claude` binary continues to do all the actual work — reading files, executing bash commands, calling APIs. The browser is just a remote terminal interface that sends your inputs and displays outputs over an authenticated WebSocket connection.

Key characteristic: **your local files and shell are fully accessible** because the process with access to them is running locally.

### Cloud Sessions

**Cloud Sessions** are fully browser-based Claude Code sessions with no local binary involved. The Claude Code process runs inside Anthropic's infrastructure (typically an ephemeral container provisioned per session). You interact with it through the claude.ai/code web interface.

Key characteristic: **your local files are not accessible by default** because there is no process running on your machine. Cloud Sessions can access remote repositories (GitHub/GitLab) by cloning them into the ephemeral container.

### Choosing Between Them

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WHICH SHOULD I USE?                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Do you need to access local files or run local shell commands?     │
│                                                                      │
│  YES → Remote Control                                                │
│    • You have a machine running claude locally                       │
│    • You want to monitor/approve from your phone                     │
│    • You want to run commands on a remote dev server from your iPad  │
│    • You need hooks, local MCP servers, or local git operations      │
│                                                                      │
│  NO → Cloud Sessions                                                 │
│    • Quick edits to a GitHub repo without cloning locally            │
│    • Onboarding demo without any local setup                         │
│    • Reviewing and asking questions about a public repository        │
│    • Shared pair-programming on a remote repository                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Remote Control Architecture

### How the Bridge Works

```
  ┌──────────────────────────────────────────────────────────────────────┐
  │                  REMOTE CONTROL ARCHITECTURE                          │
  └──────────────────────────────────────────────────────────────────────┘

  ┌──────────────────┐     HTTPS/WSS     ┌──────────────────────────────┐
  │  Your Browser    │ ◄─────────────── ► │  claude.ai/code              │
  │  or Mobile App   │   (TLS encrypted) │  (WebSocket relay server)    │
  │                  │                   │                              │
  │  - Input prompt  │                   │  - Routes messages           │
  │  - View output   │                   │  - Manages session tokens    │
  │  - Approve tools │                   │  - No access to your data    │
  └──────────────────┘                   └──────────────┬───────────────┘
                                                        │
                                                        │ WebSocket (outbound
                                                        │ from your machine)
                                                        │
  ┌──────────────────────────────────────────────────────▼───────────────┐
  │                  YOUR LOCAL MACHINE                                   │
  │                                                                       │
  │  ┌─────────────────────────────────────────────────────────────────┐ │
  │  │  claude --remote-control process                                 │ │
  │  │                                                                   │ │
  │  │  - Maintains WebSocket connection to relay                        │ │
  │  │  - Receives prompts from bridge                                   │ │
  │  │  - Executes tool calls locally (Bash, Read, Write, etc.)         │ │
  │  │  - Streams responses back through bridge                         │ │
  │  └─────────────────────────────────────────────────────────────────┘ │
  │                          │                                            │
  │              ┌───────────┴──────────┐                                │
  │              ▼                      ▼                                 │
  │     Your Files & Codebase    Your Shell & Tools                      │
  │     (full read/write access) (full command execution)               │
  └───────────────────────────────────────────────────────────────────────┘

  DATA FLOW:
  You type prompt in browser → relay → local claude process
  Local claude thinks, calls tools, reads files → relay → browser displays output

  NOTE: The relay server (claude.ai) sees only the prompts and responses.
        It never has direct access to your file system or shell.
```

### The WebSocket Connection Direction

An important security detail: the WebSocket connection is **initiated outbound from your local machine** to the claude.ai relay. The relay does not make inbound connections to your machine. This means:

- No firewall rules need to be opened
- No port forwarding required
- Works behind NAT and corporate firewalls that allow outbound HTTPS
- Compatible with most enterprise network configurations

---

## 3. Starting a Remote Control Session

### Basic Start

```bash
# Start with the --remote-control flag
claude --remote-control

# Alternative: explicit subcommand
claude remote-control start
```

Both commands start an interactive Claude Code session with the remote control bridge active. The CLI prints the bridge URL:

```
Claude Code v2.1.126

Remote Control active
Bridge URL: https://claude.ai/code/r/a3f9b2c1-8e4d-47f2-9b1a-5c7d8e9f0a1b
Session: my-macbook-pro

Open the URL above in any browser or send it to your mobile device.
The session will remain active until you exit (Ctrl+C).

> 
```

### Session Naming

By default, the session is named after your machine's hostname. Customize it with the `--remote-control-session-name-prefix` flag to make sessions identifiable when working across multiple machines:

```bash
claude --remote-control --remote-control-session-name-prefix "api-server-refactor"
# Session: api-server-refactor-my-macbook-pro
```

Or with just a prefix that overrides the hostname:

```bash
claude --remote-control --remote-control-session-name-prefix "work"
# Session: work-my-macbook-pro
```

### Connecting from Another Device

Copy the bridge URL from the terminal output and open it in any browser — desktop or mobile. No additional login is required if you are already logged into claude.ai in that browser. If you are not logged in, you will be prompted to authenticate with your Anthropic account.

**From your phone:** text or email the URL to yourself, or use a QR code generator:

```bash
# Generate a QR code in the terminal (requires qrencode)
qrencode -t ANSIUTF8 "https://claude.ai/code/r/a3f9b2c1-..."
```

You can scan the QR code with your phone's camera to open the URL directly.

### Non-Interactive Mode (Headless)

For use cases where you want to start the bridge without an interactive terminal (e.g., a background service):

```bash
claude remote-control start --no-interactive &

# Retrieve the session URL
claude remote-control status
# Prints the active bridge URL
```

---

## 4. What Works Remotely

Because Remote Control runs a full local Claude Code process, **everything available in a normal local session is available remotely**. There are no feature restrictions imposed by the remote control layer.

### Full Feature Availability

| Feature | Available Remotely? | Notes |
|---------|---------------------|-------|
| File reads (Read tool) | YES | Reads files on the local machine |
| File writes (Write, Edit tools) | YES | Writes to local machine |
| Bash execution | YES | Runs on local machine; full shell access |
| Git operations | YES | All git commands available |
| CLAUDE.md loading | YES | Loaded from local project directories |
| Hooks (pre/post tool) | YES | Hooks run locally as configured |
| MCP servers | YES | All locally-configured MCP servers |
| Path-matched rules | YES | Rules loaded from local .claude/ directory |
| Slash commands | YES | All commands work, including /compact, /memory |
| Todo list | YES | Persisted locally |
| Subagents | YES | Subagents spawn as local processes |
| Auto-compaction | YES | Context management works normally |
| /context command | YES | Shows the local process's context state |

### Interactive Approval

Tool use confirmations and permission prompts appear in the browser interface. You can approve or deny tool calls from your phone just as you would from a local terminal. This is a primary use case: letting Claude run a long agentic task on your workstation while you monitor and approve critical operations from your phone.

---

## 5. What Does Not Work Remotely

### Path Resolution Is Local

The most important behavioral difference: **all file paths resolve on the machine running the local process**, not on the machine where the browser is open.

```
# You type from your iPhone:
"Read the file ./src/App.tsx"

# What Claude does:
# Resolves ./src/App.tsx relative to the working directory on your laptop
# Returns the file from your laptop's filesystem
# The iPhone has no role in path resolution

# This is correct behavior — the file is on your laptop
# But be aware: if you say "read /tmp/notes.txt", it reads /tmp/notes.txt
# from your laptop, not from your phone or browser's filesystem
```

If you want Claude to access a file on your phone, you need to either upload it somewhere accessible from the local machine or inline its contents in your message.

### Camera and Microphone

Browser-based access to hardware peripherals (camera, microphone) is not forwarded to the local Claude Code process. The browser interface is text-only (as is the local CLI). There is no vision input capability through Remote Control.

### Clipboard Access

The browser interface does not have direct access to your local machine's clipboard. You can paste content from your phone's clipboard into the browser's prompt input, but the local Claude Code process cannot access the local machine's clipboard programmatically.

### Local GUI Applications

Claude Code can invoke local shell commands via the Bash tool. From a Remote Control session, you could run `open /Applications/Xcode.app` or `code .` — but these GUI applications would open on the local machine (your laptop), not on the device you're controlling from (your phone).

---

## 6. Security Model

### Session Token Architecture

Each Remote Control session generates a **single-use session token** that is embedded in the bridge URL. The token:

- Is a 128-bit random value generated cryptographically on the local machine at session start
- Is valid for the duration of the session only
- Is revoked immediately when the session ends (Ctrl+C, `claude remote-control stop`, or process termination)
- Is specific to one session — a new token is generated each time `claude --remote-control` is started

```
Bridge URL anatomy:
https://claude.ai/code/r/a3f9b2c1-8e4d-47f2-9b1a-5c7d8e9f0a1b
                                   └────────────────────────────┘
                                   128-bit session token (UUID v4)
```

### Who Can Connect

Anyone who has the bridge URL can connect to the session, provided they are authenticated with a valid Anthropic account. **The authentication requirement is important**: the URL alone is not sufficient — the connecting user must also be logged into claude.ai.

To restrict access to only your own account, this means:
1. Do not share the bridge URL with others
2. Ensure other users are not logged into claude.ai on shared devices

For team use cases (e.g., a team reviewing Claude's work together), sharing the URL with specific colleagues allows collaborative oversight of the session.

### Transport Encryption

All data in transit is encrypted:
- Browser to relay: HTTPS/WSS (TLS 1.3)
- Local process to relay: WSS (TLS 1.3)
- The relay (claude.ai infrastructure) sees the prompts and responses as they transit through, but does not store session content after the session ends

### What the Relay Server Cannot Do

The Anthropic relay server acts as a message broker only:
- It cannot initiate connections to your local machine
- It cannot access your filesystem
- It cannot execute commands on your machine
- It does not retain session content after the session ends
- It does not have access to your local API keys or credentials

### Ending a Session Safely

```bash
# Method 1: Ctrl+C in the terminal where claude --remote-control is running
# This immediately terminates the local process and invalidates the token

# Method 2: Explicit stop command (from another terminal)
claude remote-control stop

# Method 3: The session auto-terminates if the local machine goes to sleep
# for more than the session timeout (configurable via CLAUDE_REMOTE_CONTROL_TIMEOUT)
```

After the session ends, the bridge URL becomes invalid. Anyone who navigated to that URL will see a "Session ended" message.

---

## 7. Mobile Use — iOS and Android

### The Browser Interface

Claude Code Remote Control works in any modern mobile browser. The claude.ai/code interface is mobile-responsive with a touch-friendly design:

- **Input area** at the bottom of the screen (above the keyboard)
- **Scrollable output** occupies most of the screen
- **Tool approval cards** appear as modal overlays with large tap targets
- **Session status indicator** shows connection state (connected / reconnecting / disconnected)

No native iOS or Android app is required. Safari (iOS), Chrome (Android/iOS), Firefox (Android), and Edge (iOS/Android) all work.

### Keyboard Limitations and Workarounds

Mobile keyboards lack some keys available in a desktop terminal:

| Missing Key | Workaround |
|-------------|------------|
| Tab key for code indentation | Use 2-space indentation; Claude handles the rest |
| Arrow keys for cursor navigation | Tap to position cursor in input field |
| Ctrl+C, Ctrl+D | Use the dedicated stop/cancel button in the UI |
| Terminal shortcuts (Ctrl+R, etc.) | Not needed — you're not typing commands into a shell |

For complex prompts with code snippets, it is often faster to compose the prompt in a notes app on your phone, copy it, and paste it into the claude.ai input field.

### Copy-Paste Patterns from Mobile

**Pattern 1: Long-form instructions**
1. Open Notes (iOS) or Keep (Android) on your phone
2. Compose your detailed instructions
3. Copy all text
4. Paste into claude.ai/code input field

**Pattern 2: Sharing file content**
1. Open Files app and navigate to the file (if synced via iCloud/Google Drive)
2. Copy the file content
3. Paste into the message with a brief description

**Pattern 3: Pasting error messages**
1. Take a screenshot of the error
2. Use the device's built-in OCR (iOS: Live Text; Android: Google Lens) to copy the text
3. Paste the extracted text into claude.ai/code

### Practical Mobile Workflows

**Monitoring long-running tasks:**
Start a long agentic task on your workstation, then switch to your phone to monitor progress. The session streams updates in real time. You can approve tool calls without returning to your laptop.

```
Workstation:
  claude --remote-control "Refactor all 47 API handlers to use the new auth middleware.
  Commit each handler change separately with a descriptive message."

Phone (later):
  [Opens bridge URL]
  [Watches Claude work through handlers one by one]
  [Approves each Bash("git commit") tool call]
  [Goes back to sleep while Claude continues]
```

**Code review from bed:**
After a day of coding, quickly review what Claude did:

```
Phone:
  "Show me a summary of all files changed in the last commit
   and explain the key decisions made"
```

**Emergency hot fixes:**
If an issue is found in production at 2am and you only have your phone:

```
Phone:
  "The /api/auth/login endpoint is returning 500 for users with OAuth accounts.
   Find the bug, fix it, run the auth tests, and create a PR."
```

Because Remote Control has full local shell access, Claude can run your tests, check logs, and create the PR — all from your phone.

---

## 8. Cloud Sessions — Fully Browser-Based

### What Cloud Sessions Are

Cloud Sessions are Claude Code instances running in Anthropic's cloud infrastructure. When you visit claude.ai/code without starting a Remote Control session, you are using a Cloud Session. There is no local binary involved — the entire Claude Code process runs in an ephemeral container provisioned for your session.

### How Cloud Sessions Work

```
  ┌──────────────────────────────────────────────────────────────┐
  │                  CLOUD SESSION ARCHITECTURE                    │
  └──────────────────────────────────────────────────────────────┘

  ┌──────────────────┐     HTTPS     ┌──────────────────────────────┐
  │  Your Browser    │ ◄───────────► │  claude.ai/code UI           │
  │  (no local       │               │                              │
  │   binary needed) │               └──────────────────────────────┘
  └──────────────────┘                           │
                                                 │
                                    ┌────────────▼────────────┐
                                    │  Anthropic Cloud         │
                                    │                          │
                                    │  ┌──────────────────┐   │
                                    │  │  Claude Code     │   │
                                    │  │  Process         │   │
                                    │  │  (ephemeral      │   │
                                    │  │   container)     │   │
                                    │  └────────┬─────────┘   │
                                    │           │              │
                                    │    ┌──────▼──────┐      │
                                    │    │  Ephemeral  │      │
                                    │    │  Filesystem │      │
                                    │    │  (cloned    │      │
                                    │    │  repo or    │      │
                                    │    │  empty)     │      │
                                    │    └─────────────┘      │
                                    └─────────────────────────┘
```

### When Cloud Sessions Are Useful

| Use Case | Suitable for Cloud Sessions? |
|----------|------------------------------|
| Quick edits to a GitHub repo | YES — clone, edit, push |
| Reviewing a public open-source repo | YES — read-only analysis |
| Onboarding demo for a new team member | YES — no setup required |
| Pair programming on a shared repository | YES — both users on the same cloud session |
| Accessing local files | NO — no local filesystem access |
| Running local MCP servers | NO — local MCP not accessible |
| Using local hooks | NO — hooks are not configured in the cloud environment |
| Long-running agentic tasks | MAYBE — session timeouts apply |

### Limitations of Cloud Sessions

**No access to your local filesystem.** If you need to work on files on your machine, use Remote Control instead.

**No local MCP servers.** MCP servers configured in your local `~/.claude/settings.json` are not available in cloud sessions. Anthropic may offer cloud-hosted MCP servers in the future; as of v2.1.126 (May 2026), only HTTP-based MCP servers with publicly reachable endpoints work in cloud sessions.

**Restricted Bash execution.** The container environment has limited tools installed. System-specific tools (company-internal CLIs, specialized compilers, local databases) are not available.

**Session timeouts.** Cloud Sessions are ephemeral. If you are inactive for more than ~30 minutes, the session may be reclaimed. Files written to the container filesystem (outside of a committed git repository) are lost when the session ends.

**No CLAUDE.md from your local machine.** Your personal CLAUDE.md files (`~/.claude/CLAUDE.md`, project CLAUDE.md) do not exist in the cloud session. You can create a CLAUDE.md in the cloned repository to provide context for cloud sessions.

---

## 9. The Remote Execution Environment

### GitHub/GitLab Integration in Cloud Sessions

When launching a Cloud Session from a GitHub repository page (via the "Open in Claude Code" button, available through a browser extension or GitHub Marketplace app), Claude Code provisions an ephemeral container with:

1. Your repository cloned at the HEAD of the default branch (or the specified branch)
2. A standard Ubuntu LTS environment with common developer tools pre-installed
3. A configured git identity allowing push to your repository (via OAuth token)
4. Any CLAUDE.md file in the repository root, loaded normally

```
Ephemeral container pre-installed tools (as of May 2026):
  Languages: Node.js 20, Python 3.12, Go 1.22, Ruby 3.3, Java 21
  Build tools: npm, pip, go, maven, gradle, cargo (Rust)
  CLI tools: git, curl, wget, jq, ripgrep, tree
  Editors: nano, vim (for scripts)
  NOT included: Docker, kubectl, company-internal tools, databases
```

### Making Changes Persist

Changes to files in the cloned repository persist only if you push them to git before the session ends. Standard workflow:

```
1. Claude makes code changes
2. Claude (or you) runs: git add . && git commit -m "fix: description"
3. Claude (or you) runs: git push origin <branch>
4. Changes are now on GitHub; session can end safely
```

If the session ends before pushing, uncommitted changes are lost. Claude Code will warn you if there are uncommitted changes when a session is nearing its timeout.

### Container Isolation

Each Cloud Session gets its own isolated container. Multiple users on the same repository do not share a container unless they are explicitly in the same collaborative session (see collaborative mode in future docs). This means:

- Your session's bash history does not leak to other users
- Installed packages (via `pip install`, `npm install`) are session-specific
- The container is destroyed when the session ends

---

## 10. `CLAUDE_REMOTE_CONTROL_*` Environment Variables

### CLAUDE_REMOTE_CONTROL_HOST

Overrides the relay server hostname. Default is `wss://remote.claude.ai`. Useful for enterprise deployments with a self-hosted relay (available for Enterprise contract customers).

```bash
export CLAUDE_REMOTE_CONTROL_HOST="wss://claude-relay.internal.company.com"
claude --remote-control
```

### CLAUDE_REMOTE_CONTROL_PORT

Overrides the relay server port. Default is `443` (standard WSS port). Usually not needed unless using a self-hosted relay on a non-standard port.

```bash
export CLAUDE_REMOTE_CONTROL_PORT=8443
claude --remote-control
```

### CLAUDE_REMOTE_CONTROL_TIMEOUT

Controls how long (in seconds) the local process waits for the relay connection before assuming the connection is lost and attempting reconnection. Default is `30`.

```bash
# For high-latency connections (e.g., satellite internet)
export CLAUDE_REMOTE_CONTROL_TIMEOUT=60
```

Also controls the idle session timeout: if no messages are sent or received for this duration × 10, the session auto-terminates. Default idle timeout: 5 minutes.

```bash
# Keep session alive for up to 30 minutes of inactivity
# (useful for monitoring tasks where Claude is working silently)
export CLAUDE_REMOTE_CONTROL_TIMEOUT=180
```

### CLAUDE_REMOTE_CONTROL_AUTH_MODE

Controls authentication requirements for connecting to the session. Default is `"anthropic-account"` (connecting browser must be logged into claude.ai).

Available modes:
- `"anthropic-account"` (default) — requires Anthropic account authentication
- `"session-token-only"` — allows connection with the session token URL alone, without account login (use with caution — anyone with the URL can connect)
- `"disabled"` — turns off remote control entirely even if `--remote-control` flag is passed

```bash
# For demos where you want to share a URL without requiring login
export CLAUDE_REMOTE_CONTROL_AUTH_MODE="session-token-only"
claude --remote-control
```

### CLAUDE_REMOTE_CONTROL_LOG_LEVEL

Sets the verbosity of remote control connection logs. Default is `"error"`. Set to `"debug"` to troubleshoot connection issues.

```bash
export CLAUDE_REMOTE_CONTROL_LOG_LEVEL="debug"
claude --remote-control
# Now prints detailed WebSocket handshake, message routing, reconnection events
```

---

## 11. Teardown and Security

### How to End a Remote Control Session Safely

**Normal termination (interactive):**
```bash
# Press Ctrl+C in the terminal where claude --remote-control is running
# This gracefully closes the WebSocket, invalidates the session token, prints summary
^C

Remote Control session ended.
Bridge URL is now invalid.
Session duration: 47m 23s
```

**Forced termination (if the process is stuck):**
```bash
# Find the process
ps aux | grep "claude --remote-control"

# Kill it
kill <PID>

# Or from another terminal using the stop command
claude remote-control stop
```

The session token is automatically invalidated when the local process terminates, whether gracefully or forcefully. The relay server detects the disconnection and marks the session as ended within 5 seconds.

### Verifying No Orphaned Processes

After termination, verify no claude processes are still running:

```bash
# Check for any running claude processes
pgrep -l claude

# If any are found unexpectedly
pkill -f "claude --remote-control"
```

### Audit Logging of Remote Sessions

Claude Code logs remote control session events to `~/.claude/logs/remote-control.log`:

```
2026-06-04T09:23:11Z  SESSION_START  token=a3f9b2c1...  machine=my-macbook-pro
2026-06-04T09:23:45Z  CLIENT_CONNECT  ip=192.168.1.15  user=raj@example.com
2026-06-04T09:23:52Z  TOOL_CALL      tool=Bash  command="git status"
2026-06-04T09:24:03Z  TOOL_CALL      tool=Read  path=src/App.tsx
2026-06-04T09:24:41Z  TOOL_CALL      tool=Write path=src/App.tsx
2026-06-04T10:10:34Z  SESSION_END    duration=47m23s  reason=ctrl_c
```

This log is useful for auditing what was done during a remote session, particularly in team environments where multiple people might connect to a session.

### Bridge Token Rotation

Session tokens are single-use per session — they cannot be rotated mid-session. If you believe a session token has been compromised (e.g., you accidentally posted the URL publicly), the correct response is to terminate the current session immediately and start a new one with a fresh token.

```bash
# Terminate current session
claude remote-control stop

# Start a new session with a fresh token
claude --remote-control
# New URL: https://claude.ai/code/r/<new-token>
```

### Enterprise Audit Requirements

For enterprise deployments that require complete audit trails of all remote sessions:

1. Enable session logging at the enterprise settings level:
```json
// /etc/claude-code/settings.json
{
  "remoteControl": {
    "auditLog": "/var/log/claude-code/remote-sessions.log",
    "logLevel": "info",
    "retentionDays": 90
  }
}
```

2. The audit log captures all session events, tool calls, and connection events
3. Logs can be forwarded to SIEM systems using standard log forwarding tools

For environments where remote control must be completely disabled:

```json
// /etc/claude-code/settings.json
{
  "CLAUDE_REMOTE_CONTROL_AUTH_MODE": "disabled"
}
```

This prevents remote control sessions from being started on managed machines, even if users attempt to use the `--remote-control` flag.

---

## Related Documentation

- [Quick Start](/claude-code/quick-start) — initial setup and authentication
- [Enterprise Guide](/claude-code/enterprise-guide) — enterprise deployment and managed settings
- [Permissions & Security](/claude-code/permissions-security) — full security model for Claude Code
- [Hooks System](/claude-code/hooks-deep-dive) — hooks available in Remote Control sessions
- [MCP Servers Guide](/claude-code/mcp-servers-guide) — MCP server behavior in Remote Control vs Cloud Sessions
- [Troubleshooting](/claude-code/troubleshooting) — Remote Control connection issues and common errors
