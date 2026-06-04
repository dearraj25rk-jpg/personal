import React, { useState } from "react";

const C = {
  bg: "#0d1117",
  surface: "#161b22",
  card: "#1c2333",
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.14)",
  text: "#E8EDF5",
  textSoft: "#9BA8C0",
  textDim: "#5E6E8A",
  white: "#FFFFFF",
  green: "#00d46a",
  greenDim: "#00a854",
  greenBg: "rgba(0,212,106,0.08)",
  greenBorder: "rgba(0,212,106,0.25)",
  yellow: "#FBBF24",
  yellowDim: "#D97706",
  yellowBg: "rgba(251,191,36,0.08)",
  yellowBorder: "rgba(251,191,36,0.25)",
  blue: "#60A5FA",
  blueDim: "#2563EB",
  blueBg: "rgba(96,165,250,0.08)",
  blueBorder: "rgba(96,165,250,0.25)",
  red: "#F87171",
  redBg: "rgba(248,113,113,0.08)",
  redBorder: "rgba(248,113,113,0.25)",
  purple: "#A78BFA",
  purpleBg: "rgba(167,139,250,0.08)",
  purpleBorder: "rgba(167,139,250,0.25)",
  cyan: "#22D3EE",
  cyanBg: "rgba(34,211,238,0.08)",
  cyanBorder: "rgba(34,211,238,0.25)",
  orange: "#FB923C",
  orangeBg: "rgba(251,146,60,0.08)",
  orangeBorder: "rgba(251,146,60,0.25)",
  pink: "#F472B6",
  pinkBg: "rgba(244,114,182,0.08)",
  pinkBorder: "rgba(244,114,182,0.25)",
};

const mono = { fontFamily: "'JetBrains Mono','Fira Code','SF Mono',Consolas,monospace" };
const sans = { fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" };

const COMMANDS = [
  // Session
  { cmd: "/clear", cat: "session", desc: "Reset conversation context while keeping all config loaded. Use between unrelated tasks to prevent context bleed.", usage: "/clear", shortcut: "Ctrl+L", new: false },
  { cmd: "/compact", cat: "session", desc: "Summarise conversation to free context window. Pass optional instructions: /compact Focus on auth changes — guides what gets preserved.", usage: "/compact [instructions]", shortcut: null, new: false },
  { cmd: "/rewind", cat: "session", desc: "Roll back last code change AND remove it from conversation history. Undo both the file edit and the assistant turn.", usage: "/rewind", shortcut: null, new: false },
  { cmd: "/resume", cat: "session", desc: "Open interactive session picker to continue a previous session. Sessions are stored with hash-based project identity.", usage: "/resume [session-id]", shortcut: null, new: false },
  { cmd: "/rename", cat: "session", desc: "Name the current session for easy retrieval via /resume. Run before closing a session you may want to continue.", usage: "/rename <name>", shortcut: null, new: false },
  { cmd: "/exit", cat: "session", desc: "Close Claude Code. Stop hook fires first (blockable). Session state serialised to disk for /resume.", usage: "/exit", shortcut: "Ctrl+C ×2", new: false },

  // Memory & Context
  { cmd: "/memory", cat: "memory", desc: "View and edit all loaded memory files: enterprise, user, project CLAUDE.md, and auto-memory MEMORY.md. Opens editor.", usage: "/memory", shortcut: null, new: false },
  { cmd: "/todos", cat: "memory", desc: "View and manage the current task list written by TodoWrite. Structured task tracking visible across tool calls.", usage: "/todos", shortcut: null, new: false },
  { cmd: "/usage", cat: "memory", desc: "Show token usage and estimated cost for the current session. Includes cache hit rate — target >80% on system prompt.", usage: "/usage", shortcut: null, new: false },
  { cmd: "/context", cat: "memory", desc: "Display a live token-usage breakdown grid: system, conversation, tools, and available budget. Use to spot context bloat.", usage: "/context", shortcut: null, new: false },

  // Config
  { cmd: "/config", cat: "config", desc: "Tabbed settings UI with live preview. Activate output styles, switch models, configure effort level. Saves to settings.json.", usage: "/config", shortcut: null, new: false },
  { cmd: "/model", cat: "config", desc: "Switch Claude model mid-session. Changes take effect on the next API call. Options: opus, sonnet, haiku, or full model IDs.", usage: "/model [model-id]", shortcut: null, new: false },
  { cmd: "/fast", cat: "config", desc: "Toggle Fast Mode — Opus with faster output throughput. Does NOT downgrade to Sonnet/Haiku; same model, optimised stream.", usage: "/fast", shortcut: null, new: true },
  { cmd: "/permissions", cat: "config", desc: "Manage tool allowlists and blocklists interactively. Add/remove allow and deny rules to settings.json without manual editing.", usage: "/permissions", shortcut: null, new: false },
  { cmd: "/theme", cat: "config", desc: "Browse and apply colour themes. Themes are stored as markdown files in ~/.claude/themes/. Create custom themes.", usage: "/theme [name]", shortcut: null, new: false },
  { cmd: "/keybindings", cat: "config", desc: "Create or edit ~/.claude/keybindings.json. Supports chord bindings (e.g. ctrl+k ctrl+s) and modifier combos.", usage: "/keybindings", shortcut: null, new: false },
  { cmd: "/terminal-setup", cat: "config", desc: "Configure scroll sensitivity, clipboard integration, and iTerm2 integration. Introduced v2.1.116.", usage: "/terminal-setup", shortcut: null, new: true },

  // Agents & Skills
  { cmd: "/agents", cat: "agents", desc: "List and edit subagent definitions in .claude/agents/. View YAML frontmatter, allowed tools, memory scope.", usage: "/agents", shortcut: null, new: false },
  { cmd: "/skills", cat: "agents", desc: "Browse and filter installed skills from .claude/skills/. View skill descriptions, trigger phrases, and activation status.", usage: "/skills", shortcut: null, new: false },
  { cmd: "/plan", cat: "agents", desc: "Enter plan-only mode: Claude reasons and writes plans but makes NO file writes. Use for architecture sessions.", usage: "/plan", shortcut: null, new: false },
  { cmd: "/advisor", cat: "agents", desc: "Invoke dual-model advisor: Sonnet 4.6 executes while Opus 4.7/4.8 reviews intermediate steps. Shows when economics justify.", usage: "/advisor", shortcut: null, new: false },

  // Connections
  { cmd: "/mcp", cat: "connections", desc: "Manage MCP server connections. Shows status (connected/error/connecting), tools available, and connection logs per server.", usage: "/mcp", shortcut: null, new: false },
  { cmd: "/hooks", cat: "connections", desc: "Configure automation hooks interactively. Add/remove hook handlers, view event list, test hook execution.", usage: "/hooks", shortcut: null, new: false },

  // Git
  { cmd: "/branch", cat: "git", desc: "Create a git worktree on a new branch and open a new terminal window with a fresh Claude Code session focused on it.", usage: "/branch <branch-name>", shortcut: null, new: false },

  // Debug
  { cmd: "/doctor", cat: "debug", desc: "Run health check. Press f to auto-repair common issues: missing CLAUDE.md, broken MCP connections, stale permissions. v2.1.105+", usage: "/doctor", shortcut: null, new: true },
  { cmd: "/debug", cat: "debug", desc: "Troubleshoot current session: show loaded files, active hooks, MCP connection state, and context issues.", usage: "/debug", shortcut: null, new: false },
  { cmd: "/changelog", cat: "debug", desc: "Show Claude Code release notes for recent versions. Includes version number, date, and summary of changes.", usage: "/changelog", shortcut: null, new: false },

  // Team
  { cmd: "/team-onboarding", cat: "team", desc: "Generate a codebase-aware onboarding guide for new teammates. Analyses project structure and writes a ramp-up doc. v2.1.104+", usage: "/team-onboarding", shortcut: null, new: true },
];

const CATEGORIES = [
  { id: "all", label: "All Commands", color: C.blue },
  { id: "session", label: "Session", color: C.green },
  { id: "memory", label: "Memory & Context", color: C.cyan },
  { id: "config", label: "Config", color: C.yellow },
  { id: "agents", label: "Agents & Skills", color: C.purple },
  { id: "connections", label: "Connections", color: C.orange },
  { id: "git", label: "Git", color: C.pink },
  { id: "debug", label: "Debug", color: C.red },
  { id: "team", label: "Team", color: "#7ee787" },
];

const CUSTOM_CMD_EXAMPLE = `---
description: Review the current PR for security issues
allowed-tools: Bash, Read, WebSearch
---

# Security Review — {{$ARGUMENTS}}

## Current state
Branch: !\`git branch --show-current\`
Changed files:
\`\`\`
!\`git diff --name-only main\`
\`\`\`

## Review checklist
@import .claude/standards/security-checklist.md

Perform a thorough security review focusing on:
- Input validation and sanitisation
- Authentication and authorisation checks
- SQL injection, XSS, and SSRF vectors
- Secrets in code or logs`;

const VARS_DATA = [
  { name: "$ARGUMENTS", desc: "Text typed after the slash command", example: "/review pr/123  →  $ARGUMENTS = 'pr/123'" },
  { name: "!`cmd`", desc: "Shell command output — executed at invocation time", example: '!`git log --oneline -5`  →  last 5 git commits' },
  { name: "@import path", desc: "Insert contents of another file inline", example: "@import .claude/standards/checklist.md" },
  { name: "{{var}}", desc: "Placeholder — Claude fills it in contextually (not built-in)", example: "Review {{module}} for correctness" },
];

function SectionTitle({ children, color = C.blue, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: color }} />
        <h2 style={{ ...sans, fontSize: 20, fontWeight: 800, color: C.white, margin: 0 }}>{children}</h2>
      </div>
      {subtitle && <p style={{ ...sans, fontSize: 13, color: C.textDim, margin: "6px 0 0 16px" }}>{subtitle}</p>}
    </div>
  );
}

function Tag({ children, color = C.blue }) {
  return (
    <span style={{ ...mono, fontSize: 10, fontWeight: 600, color, background: `${color}18`, border: `1px solid ${color}40`, borderRadius: 4, padding: "2px 6px" }}>
      {children}
    </span>
  );
}

function CommandCard({ cmd, cat, desc, usage, shortcut, new: isNew, highlight }) {
  const catInfo = CATEGORIES.find(c => c.id === cat);
  const color = catInfo ? catInfo.color : C.blue;
  return (
    <div style={{
      background: highlight ? `${color}10` : C.card,
      border: `1.5px solid ${highlight ? color + "40" : C.border}`,
      borderRadius: 10,
      padding: "12px 16px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ ...mono, fontSize: 14, fontWeight: 700, color }}>{cmd}</span>
        {isNew && <Tag color={C.green}>NEW</Tag>}
        <Tag color={color}>{cat}</Tag>
        {shortcut && <Tag color={C.textDim}>{shortcut}</Tag>}
      </div>
      <p style={{ ...sans, fontSize: 13, color: C.textSoft, margin: 0, lineHeight: 1.5 }}>{desc}</p>
      <div style={{ ...mono, fontSize: 11, color: C.textDim, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px" }}>{usage}</div>
    </div>
  );
}

export default function SlashCommandsDiagram() {
  const [tab, setTab] = useState("commands");
  const [catFilter, setCatFilter] = useState("all");
  const [search, setSearch] = useState("");

  const tabs = [
    { id: "commands", label: "Command Browser" },
    { id: "custom", label: "Custom Commands" },
    { id: "vars", label: "Special Variables" },
    { id: "scopes", label: "Command Scopes" },
  ];

  const filtered = COMMANDS.filter(c => {
    const matchCat = catFilter === "all" || c.cat === catFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || c.cmd.includes(q) || c.desc.toLowerCase().includes(q) || c.cat.includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: "28px 24px", maxWidth: 900, margin: "0 auto", color: C.text }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ ...mono, fontSize: 11, color: C.textDim, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 12px" }}>
            Claude Code v2.1.126
          </div>
          <div style={{ ...mono, fontSize: 11, color: C.green, background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 6, padding: "4px 12px" }}>
            {COMMANDS.length} commands
          </div>
        </div>
        <h1 style={{ ...sans, fontSize: 26, fontWeight: 900, color: C.white, margin: 0, letterSpacing: -0.5 }}>
          Slash Commands — Visual Reference
        </h1>
        <p style={{ ...sans, fontSize: 14, color: C.textSoft, margin: "8px 0 0 0" }}>
          All built-in slash commands, custom command authoring, special variables, and scope guide.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            ...sans, fontSize: 13, fontWeight: 600, padding: "7px 16px", borderRadius: 8,
            border: `1.5px solid ${tab === t.id ? C.blue : C.border}`,
            background: tab === t.id ? C.blueBg : "transparent",
            color: tab === t.id ? C.blue : C.textSoft,
            cursor: "pointer",
          }}>{t.label}</button>
        ))}
      </div>

      {/* TAB: Command Browser */}
      {tab === "commands" && (
        <div>
          {/* Category filter */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setCatFilter(cat.id)} style={{
                ...sans, fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20,
                border: `1.5px solid ${catFilter === cat.id ? cat.color : C.border}`,
                background: catFilter === cat.id ? `${cat.color}18` : "transparent",
                color: catFilter === cat.id ? cat.color : C.textSoft,
                cursor: "pointer",
              }}>{cat.label}</button>
            ))}
          </div>
          {/* Search */}
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search commands..."
            style={{
              ...mono, fontSize: 13, width: "100%", boxSizing: "border-box",
              background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 8,
              padding: "9px 14px", color: C.text, marginBottom: 16, outline: "none",
            }}
          />
          <div style={{ ...sans, fontSize: 12, color: C.textDim, marginBottom: 12 }}>
            Showing {filtered.length} of {COMMANDS.length} commands
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 10 }}>
            {filtered.map(cmd => (
              <CommandCard key={cmd.cmd} {...cmd} />
            ))}
          </div>
        </div>
      )}

      {/* TAB: Custom Commands */}
      {tab === "custom" && (
        <div>
          <SectionTitle color={C.purple} subtitle="Create team or personal commands that appear alongside built-ins">
            Custom Command Anatomy
          </SectionTitle>
          <div style={{ marginBottom: 24 }}>
            <div style={{ ...sans, fontSize: 13, color: C.textSoft, marginBottom: 12, lineHeight: 1.6 }}>
              Custom commands are markdown files stored in <code style={{ ...mono, color: C.cyan }}>.claude/commands/</code> (project) or <code style={{ ...mono, color: C.cyan }}>~/.claude/commands/</code> (personal). They appear in the slash command menu exactly like built-ins.
            </div>
            <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
              <div style={{ background: C.card, padding: "8px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ ...mono, fontSize: 11, color: C.textDim }}>.claude/commands/security-review.md</div>
                <Tag color={C.purple}>project command</Tag>
              </div>
              <pre style={{ ...mono, fontSize: 12, color: C.textSoft, margin: 0, padding: "16px 20px", overflowX: "auto", lineHeight: 1.7 }}>
                {CUSTOM_CMD_EXAMPLE}
              </pre>
            </div>
          </div>

          <SectionTitle color={C.green} subtitle="Frontmatter fields that control command behaviour">
            Frontmatter Reference
          </SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
            {[
              { field: "description", type: "string", req: true, desc: "Shown in /config and autocomplete menu" },
              { field: "allowed-tools", type: "string[]", req: false, desc: "Restrict which tools this command can use. Default: all tools." },
              { field: "disallowed-tools", type: "string[]", req: false, desc: "Block specific tools from this command context." },
              { field: "model", type: "string", req: false, desc: "Override model for this command: opus, sonnet, haiku" },
              { field: "effort", type: "string", req: false, desc: "Set effort level: low | normal | high | xhigh" },
              { field: "output-style", type: "string", req: false, desc: "Activate a named output style for this command" },
            ].map(f => (
              <div key={f.field} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.yellow }}>{f.field}</span>
                  <Tag color={C.blue}>{f.type}</Tag>
                  {f.req && <Tag color={C.red}>required</Tag>}
                </div>
                <p style={{ ...sans, fontSize: 12, color: C.textSoft, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Special Variables */}
      {tab === "vars" && (
        <div>
          <SectionTitle color={C.cyan} subtitle="Dynamic values you can use inside command markdown files">
            Special Variables
          </SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
            {VARS_DATA.map(v => (
              <div key={v.name} style={{ background: C.card, border: `1.5px solid ${C.borderLight}`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ ...mono, fontSize: 15, fontWeight: 800, color: C.cyan }}>{v.name}</span>
                </div>
                <p style={{ ...sans, fontSize: 13, color: C.textSoft, margin: "0 0 10px 0", lineHeight: 1.5 }}>{v.desc}</p>
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 12px" }}>
                  <span style={{ ...mono, fontSize: 11, color: C.textDim }}>example: </span>
                  <span style={{ ...mono, fontSize: 11, color: C.text }}>{v.example}</span>
                </div>
              </div>
            ))}
          </div>

          <SectionTitle color={C.orange} subtitle="Complete example using all special variables">
            Full Example
          </SectionTitle>
          <pre style={{ ...mono, fontSize: 12, color: C.textSoft, background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "16px 20px", overflowX: "auto", lineHeight: 1.7 }}>
{`---
description: Deploy service $ARGUMENTS to staging
allowed-tools: Bash, Read
---

# Deploy: $ARGUMENTS to Staging

## Pre-flight checks
Current git status: !\`git status --short\`
Recent commits:
!\`git log --oneline -3\`

## Standards
@import .claude/standards/deploy-checklist.md

Deploy {{$ARGUMENTS}} to the staging environment.
Verify health endpoint after deployment.`}
          </pre>
        </div>
      )}

      {/* TAB: Command Scopes */}
      {tab === "scopes" && (
        <div>
          <SectionTitle color={C.green} subtitle="Where command files live and who can see them">
            Command Scopes
          </SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14, marginBottom: 28 }}>
            {[
              {
                scope: "Built-in",
                path: "(shipped with Claude Code)",
                color: C.blue,
                git: false,
                who: "All users globally",
                examples: ["/clear", "/memory", "/config", "/model"],
              },
              {
                scope: "Personal",
                path: "~/.claude/commands/<name>.md",
                color: C.cyan,
                git: false,
                who: "Only you, across all projects",
                examples: ["/my-standup", "/daily-review"],
              },
              {
                scope: "Project",
                path: ".claude/commands/<name>.md",
                color: C.green,
                git: true,
                who: "All team members on this project",
                examples: ["/deploy", "/review", "/changelog-entry"],
              },
              {
                scope: "Plugin",
                path: "~/.claude/plugins/<n>/commands/",
                color: C.purple,
                git: false,
                who: "Plugin users (distributed via plugin)",
                examples: ["/plugin-cmd", "/plugin-deploy"],
              },
            ].map(s => (
              <div key={s.scope} style={{ background: C.card, border: `1.5px solid ${s.color}40`, borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                  <span style={{ ...sans, fontSize: 14, fontWeight: 700, color: s.color }}>{s.scope}</span>
                  {s.git && <Tag color={C.green}>git ✓</Tag>}
                  {!s.git && <Tag color={C.textDim}>local only</Tag>}
                </div>
                <div style={{ ...mono, fontSize: 11, color: C.textDim, marginBottom: 8 }}>{s.path}</div>
                <p style={{ ...sans, fontSize: 12, color: C.textSoft, margin: "0 0 10px 0" }}>{s.who}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {s.examples.map(e => <Tag key={e} color={s.color}>{e}</Tag>)}
                </div>
              </div>
            ))}
          </div>

          <SectionTitle color={C.yellow} subtitle="How to invoke commands and use tab completion">
            Invocation Patterns
          </SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { input: "> /deploy api-service", note: "Project command 'deploy' with $ARGUMENTS = 'api-service'" },
              { input: "> /my-standup", note: "Personal command with no arguments" },
              { input: "> /deploy<Tab>", note: "Tab completion shows description from frontmatter" },
              { input: "> /config", note: "Built-in command — opens tabbed settings UI" },
              { input: "> /compact Focus on auth module", note: "Built-in command with optional instructions" },
            ].map((p, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ ...mono, fontSize: 13, color: C.green, flex: "0 0 auto" }}>{p.input}</span>
                <span style={{ ...sans, fontSize: 12, color: C.textDim }}>— {p.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <span style={{ ...sans, fontSize: 12, color: C.textDim }}>Claude Code v2.1.126 · June 2026</span>
        <span style={{ ...sans, fontSize: 12, color: C.textDim }}>Full reference → Slash Commands Complete Reference</span>
      </div>
    </div>
  );
}
