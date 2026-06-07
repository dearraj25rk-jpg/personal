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

function Tag({ children, color = C.blue, bg }) {
  return (
    <span style={{
      ...mono, fontSize: 11, fontWeight: 600, color,
      background: bg || `${color}18`,
      border: `1px solid ${color}40`,
      borderRadius: 5, padding: "2px 7px",
    }}>{children}</span>
  );
}

function Badge({ children, color = C.textDim }) {
  return (
    <span style={{ ...sans, fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.8 }}>
      {children}
    </span>
  );
}

// ── Hooks events data ──────────────────────────────────────────────
const HOOK_EVENTS = {
  session: {
    label: "Session Lifecycle",
    color: C.green,
    bg: C.greenBg,
    border: C.greenBorder,
    events: [
      { name: "SessionStart", canBlock: false, when: "New or resumed session begins", payload: "session_id, is_resume, project_dir" },
      { name: "SessionEnd", canBlock: false, when: "Session exits normally", payload: "session_id, turn_count, tokens_used" },
      { name: "Notification", canBlock: false, when: "Permission prompts and idle alerts", payload: "type, message" },
      { name: "PreCompact", canBlock: false, when: "Before context compaction triggers", payload: "trigger (manual|auto), turns_count" },
    ],
  },
  tool: {
    label: "Tool Lifecycle",
    color: C.blue,
    bg: C.blueBg,
    border: C.blueBorder,
    events: [
      { name: "PreToolUse", canBlock: true, when: "Before every tool call (Read, Edit, Bash, …)", payload: "tool_name, tool_input" },
      { name: "PostToolUse", canBlock: true, when: "After every tool call completes", payload: "tool_name, tool_input, tool_response" },
    ],
  },
  agent: {
    label: "Agent Lifecycle",
    color: C.purple,
    bg: C.purpleBg,
    border: C.purpleBorder,
    events: [
      { name: "PreAgentSpawn", canBlock: true, when: "Before a subagent (Task tool) spawns", payload: "agent_name, agent_prompt, context" },
      { name: "PostAgentSpawn", canBlock: false, when: "After a subagent finishes", payload: "agent_name, result, turns" },
      { name: "AgentStart", canBlock: false, when: "Inside the subagent — its SessionStart", payload: "agent_name, session_id" },
      { name: "AgentEnd", canBlock: false, when: "Inside the subagent — its SessionEnd", payload: "agent_name, result" },
    ],
  },
  user: {
    label: "User Interaction",
    color: C.orange,
    bg: C.orangeBg,
    border: C.orangeBorder,
    events: [
      { name: "UserPromptSubmit", canBlock: true, when: "User submits a prompt (before Claude sees it)", payload: "prompt, session_id, mode" },
      { name: "Stop", canBlock: true, when: "Claude finishes (exit 2 forces continuation)", payload: "session_id, stop_reason, turn_count" },
    ],
  },
};

const HANDLER_TYPES = [
  {
    type: "command",
    label: "Shell Command",
    color: C.green,
    since: "v1.0.x",
    desc: "Runs a shell command. stdout is fed back to Claude. exit 2 blocks the action.",
    example: `{
  "type": "command",
  "command": "python3 ~/.claude/hooks/guard.py"
}`,
  },
  {
    type: "prompt",
    label: "Prompt (LLM sub-call)",
    color: C.blue,
    since: "v2.0.x",
    desc: "Sends a prompt to Claude Haiku. The response is injected into Claude's context.",
    example: `{
  "type": "prompt",
  "prompt": "Review this bash command for safety risks: {{tool_input.command}}",
  "model": "claude-haiku-4-5"
}`,
  },
  {
    type: "agent",
    label: "Agent Sub-session",
    color: C.purple,
    since: "v2.0.x",
    desc: "Spins up a full Claude agent (up to 50 turns) with its own tools. Useful for multi-step reviews.",
    example: `{
  "type": "agent",
  "agent": "security-reviewer",
  "max_turns": 10
}`,
  },
  {
    type: "http",
    label: "HTTP Webhook",
    color: C.cyan,
    since: "v2.1.63",
    desc: "POSTs event payload as JSON to a URL. Response body injected into Claude's context.",
    example: `{
  "type": "http",
  "url": "https://hooks.example.com/claude",
  "headers": { "Authorization": "Bearer {{env.HOOK_TOKEN}}" }
}`,
  },
  {
    type: "mcp_tool",
    label: "MCP Tool Call",
    color: C.orange,
    since: "v2.1.118",
    desc: "Invokes an MCP tool server method. Result fed back to Claude. Enables audit systems and policy engines.",
    example: `{
  "type": "mcp_tool",
  "server": "audit-server",
  "tool": "log_tool_use"
}`,
  },
];

const PATTERNS = [
  {
    title: "Block dangerous Bash commands",
    event: "PreToolUse",
    handler: "command",
    color: C.red,
    desc: "Exit code 2 prevents execution. stdout message is shown to Claude and user.",
    code: `#!/usr/bin/env python3
import json, sys
payload = json.load(sys.stdin)
cmd = payload.get("tool_input", {}).get("command", "")
blocked = ["rm -rf /", "DROP TABLE", ":(){:|:&};:"]
if any(p in cmd for p in blocked):
    print(f"BLOCKED: dangerous pattern detected in: {cmd}")
    sys.exit(2)`,
  },
  {
    title: "Auto-format on every file write",
    event: "PostToolUse",
    handler: "command",
    color: C.green,
    desc: "Matches Edit|Write|MultiEdit. Runs linting in-place after Claude writes a file.",
    code: `#!/bin/bash
FILE=$(echo "$HOOK_TOOL_INPUT" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('path',''))")
case "$FILE" in
  *.py) ruff format "$FILE" ;;
  *.ts|*.tsx) npx prettier --write "$FILE" ;;
  *.go) gofmt -w "$FILE" ;;
esac`,
  },
  {
    title: "Inject git context at session start",
    event: "SessionStart",
    handler: "command",
    color: C.blue,
    desc: "stdout is fed into Claude's context window at the very start of each session.",
    code: `#!/bin/bash
echo "=== Git Context ==="
echo "Branch: $(git branch --show-current 2>/dev/null)"
echo "Last commit: $(git log -1 --oneline 2>/dev/null)"
echo "Status: $(git status --short 2>/dev/null | head -10)"
echo "Open PRs: $(gh pr list --limit 3 2>/dev/null)"`,
  },
  {
    title: "Slack alert when task completes",
    event: "Stop",
    handler: "http",
    color: C.purple,
    desc: "HTTP POST to Slack webhook. exit 0 lets the session end; exit 2 forces continuation.",
    code: `{
  "Stop": [{
    "hooks": [{
      "type": "http",
      "url": "${"$"}{env.SLACK_WEBHOOK_URL}",
      "body": {
        "text": "Claude Code finished: {{session_id}} ({{turn_count}} turns)"
      }
    }]
  }]
}`,
  },
  {
    title: "LLM-based prompt safety check",
    event: "UserPromptSubmit",
    handler: "prompt",
    color: C.yellow,
    desc: "Claude Haiku reviews every user prompt for policy violations before forwarding.",
    code: `{
  "type": "prompt",
  "prompt": "Check this Claude Code prompt for policy violations.\\nPrompt: {{prompt}}\\nRespond OK or BLOCKED: <reason>.",
  "model": "claude-haiku-4-5",
  "on_block_exit": 2
}`,
  },
  {
    title: "Immutable audit trail",
    event: "PostToolUse",
    handler: "command",
    color: C.cyan,
    desc: "Appends every tool call to a JSONL file. Used for SOC2 compliance and debugging.",
    code: `#!/usr/bin/env python3
import json, sys, datetime
from pathlib import Path
log_path = Path.home() / ".claude" / "audit.jsonl"
entry = json.load(sys.stdin)
entry["timestamp"] = datetime.datetime.utcnow().isoformat()
with open(log_path, "a") as f:
    f.write(json.dumps(entry) + "\\n")`,
  },
];

// ── Session Flow Diagram ───────────────────────────────────────────
function SessionFlowTab() {
  const [activeEvent, setActiveEvent] = useState(null);

  const steps = [
    { id: "start", label: "claude", sublabel: "User launches session", type: "terminal", color: C.textDim },
    { id: "sh", label: "SessionStart", sublabel: "hooks fire (stdout → context)", type: "hook", color: C.green, canBlock: false },
    { id: "uloop", label: "User Prompt", sublabel: "User types a message", type: "step", color: C.textSoft },
    { id: "ups", label: "UserPromptSubmit", sublabel: "can inject context · exit 2 blocks", type: "hook", color: C.orange, canBlock: true },
    { id: "ai", label: "Claude API call", sublabel: "Generates tool_use blocks", type: "step", color: C.textSoft },
    { id: "ptu", label: "PreToolUse", sublabel: "fires per tool · exit 2 blocks execution", type: "hook", color: C.blue, canBlock: true },
    { id: "tool", label: "Tool executes", sublabel: "Read · Edit · Bash · Task · …", type: "step", color: C.textSoft },
    { id: "posttu", label: "PostToolUse", sublabel: "fires per tool · exit 2 blocks acceptance", type: "hook", color: C.blue, canBlock: true },
    { id: "loop", label: "↺ Loop", sublabel: "Claude processes result; may spawn more tools", type: "loop", color: C.textDim },
    { id: "stop", label: "Stop", sublabel: "Claude finishes · exit 2 forces continuation", type: "hook", color: C.orange, canBlock: true },
    { id: "se", label: "SessionEnd", sublabel: "hooks fire (exit code ignored)", type: "hook", color: C.green, canBlock: false },
  ];

  const agentSteps = [
    { id: "pag", label: "PreAgentSpawn", color: C.purple, canBlock: true, sublabel: "before Task spawns subagent" },
    { id: "ags", label: "AgentStart", color: C.purple, canBlock: false, sublabel: "inside subagent — its SessionStart" },
    { id: "age", label: "AgentEnd", color: C.purple, canBlock: false, sublabel: "inside subagent — its SessionEnd" },
    { id: "pags", label: "PostAgentSpawn", color: C.purple, canBlock: false, sublabel: "back in parent after subagent finishes" },
  ];

  return (
    <div>
      <SectionTitle color={C.blue} subtitle="Every hook trigger point from session launch to shutdown">
        Session Lifecycle — Hook Trigger Points
      </SectionTitle>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Main Flow */}
        <div style={{ flex: "1 1 340px" }}>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Main Session Flow</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0 }}>
            {steps.map((s, i) => (
              <div key={s.id}>
                {s.type === "hook" ? (
                  <div
                    onClick={() => setActiveEvent(activeEvent === s.id ? null : s.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                      background: activeEvent === s.id ? `${s.color}18` : "transparent",
                      border: `1.5px solid ${activeEvent === s.id ? s.color + "60" : s.color + "35"}`,
                      borderRadius: 8, padding: "8px 14px", marginLeft: 16, transition: "all 0.15s",
                    }}
                  >
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</div>
                      <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 1 }}>{s.sublabel}</div>
                    </div>
                    {s.canBlock && (
                      <div style={{ marginLeft: "auto", ...sans, fontSize: 10, fontWeight: 700, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 4, padding: "2px 6px" }}>
                        BLOCKABLE
                      </div>
                    )}
                  </div>
                ) : s.type === "loop" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px 6px 26px" }}>
                    <div style={{ ...sans, fontSize: 12, color: C.textDim, fontStyle: "italic" }}>{s.label} — {s.sublabel}</div>
                  </div>
                ) : s.type === "terminal" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px" }}>
                    <div style={{ ...mono, fontSize: 13, color: C.green }}>$ {s.label}</div>
                    <div style={{ ...sans, fontSize: 11, color: C.textDim }}>{s.sublabel}</div>
                  </div>
                ) : (
                  <div style={{ padding: "6px 14px 6px 26px" }}>
                    <div style={{ ...sans, fontSize: 12, color: C.textSoft }}>{s.label}</div>
                    <div style={{ ...sans, fontSize: 11, color: C.textDim }}>{s.sublabel}</div>
                  </div>
                )}
                {i < steps.length - 1 && (
                  <div style={{ width: 2, height: 12, background: C.border, marginLeft: 36 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Agent Sub-flow */}
        <div style={{ flex: "1 1 280px" }}>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Agent Spawn Sub-flow</div>
          <div style={{
            background: C.purpleBg, border: `1.5px solid ${C.purpleBorder}`, borderRadius: 12, padding: 16,
          }}>
            <div style={{ ...sans, fontSize: 12, color: C.textDim, marginBottom: 12 }}>
              When Claude calls the <span style={{ ...mono, color: C.purple }}>Task</span> tool, this additional hook chain fires:
            </div>
            {agentSteps.map((s, i) => (
              <div key={s.id}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  background: `${s.color}12`, border: `1px solid ${s.color}35`, borderRadius: 7, padding: "8px 12px",
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                  <div>
                    <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: s.color }}>{s.label}</div>
                    <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 1 }}>{s.sublabel}</div>
                  </div>
                  {s.canBlock && <div style={{ marginLeft: "auto", ...sans, fontSize: 9, fontWeight: 700, color: C.red }}>BLOCK</div>}
                </div>
                {i < agentSteps.length - 1 && <div style={{ width: 2, height: 10, background: C.purpleBorder, marginLeft: 20 }} />}
              </div>
            ))}
          </div>

          {/* Key Properties */}
          <div style={{ marginTop: 20 }}>
            <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Key Properties</div>
            {[
              ["Snapshotted at start", "Changes need /hooks reload or session restart"],
              ["Parallel execution", "All matching hooks for an event run simultaneously"],
              ["60s timeout", "Default; configurable per hook"],
              ["stdout → context", "Hook stdout is fed back to Claude as context"],
              ["stderr → log", "Appears in the Claude Code terminal log"],
              ["exit 2 = block", "For blockable events; any other non-zero = non-blocking error"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                <div style={{ ...mono, fontSize: 11, color: C.cyan, whiteSpace: "nowrap", flexShrink: 0 }}>▸ {k}</div>
                <div style={{ ...sans, fontSize: 11, color: C.textSoft }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Hook Events Reference ──────────────────────────────────────────
function EventsTab() {
  const [selected, setSelected] = useState(null);

  return (
    <div>
      <SectionTitle color={C.purple} subtitle="All hook events organised by category. Click any event for details.">
        All Hook Events Reference
      </SectionTitle>

      {Object.entries(HOOK_EVENTS).map(([key, cat]) => (
        <div key={key} style={{ marginBottom: 28 }}>
          <div style={{ ...sans, fontSize: 14, fontWeight: 700, color: cat.color, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: cat.color }} />
            {cat.label}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 10 }}>
            {cat.events.map(ev => (
              <div
                key={ev.name}
                onClick={() => setSelected(selected === ev.name ? null : ev.name)}
                style={{
                  background: selected === ev.name ? cat.bg : C.card,
                  border: `1.5px solid ${selected === ev.name ? cat.color + "60" : C.border}`,
                  borderRadius: 10, padding: "12px 16px", cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: cat.color }}>{ev.name}</span>
                  {ev.canBlock ? (
                    <span style={{ ...sans, fontSize: 10, fontWeight: 700, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 4, padding: "1px 5px" }}>exit 2 blocks</span>
                  ) : (
                    <span style={{ ...sans, fontSize: 10, fontWeight: 700, color: C.textDim, background: "#ffffff08", border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 5px" }}>observe only</span>
                  )}
                </div>
                <div style={{ ...sans, fontSize: 12, color: C.textSoft }}>{ev.when}</div>
                {selected === ev.name && (
                  <div style={{ marginTop: 10, padding: "8px 10px", background: `${cat.color}0a`, borderRadius: 6, border: `1px solid ${cat.color}25` }}>
                    <div style={{ ...sans, fontSize: 11, color: C.textDim, marginBottom: 4 }}>Payload fields:</div>
                    <div style={{ ...mono, fontSize: 11, color: cat.color }}>{ev.payload}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Handler Types ──────────────────────────────────────────────────
function HandlersTab() {
  const [selected, setSelected] = useState("command");

  const active = HANDLER_TYPES.find(h => h.type === selected);

  return (
    <div>
      <SectionTitle color={C.cyan} subtitle="Five handler types — each fires a different action in response to a hook event">
        Handler Types
      </SectionTitle>

      {/* Tab strip */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {HANDLER_TYPES.map(h => (
          <button
            key={h.type}
            onClick={() => setSelected(h.type)}
            style={{
              ...sans, fontSize: 13, fontWeight: 600, cursor: "pointer",
              padding: "8px 14px", borderRadius: 8,
              background: selected === h.type ? `${h.color}20` : C.card,
              border: `1.5px solid ${selected === h.type ? h.color + "70" : C.border}`,
              color: selected === h.type ? h.color : C.textSoft,
              transition: "all 0.15s",
            }}
          >
            {h.label}
          </button>
        ))}
      </div>

      {active && (
        <div style={{ background: C.card, border: `1.5px solid ${active.color}40`, borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <span style={{ ...mono, fontSize: 18, fontWeight: 800, color: active.color }}>{active.type}</span>
            <Tag color={active.color}>Since {active.since}</Tag>
          </div>
          <p style={{ ...sans, fontSize: 14, color: C.text, lineHeight: 1.7, marginBottom: 20 }}>{active.desc}</p>
          <div style={{ ...sans, fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
            Configuration example
          </div>
          <pre style={{
            ...mono, fontSize: 12, color: C.text,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 8, padding: 16, margin: 0, overflowX: "auto", lineHeight: 1.6,
          }}>
            {active.example}
          </pre>
        </div>
      )}

      {/* Full settings.json structure */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle color={C.blue} subtitle="How handlers nest inside settings.json">
          settings.json Structure
        </SectionTitle>
        <pre style={{
          ...mono, fontSize: 12, color: C.text,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: 16, overflowX: "auto", lineHeight: 1.7,
        }}>
{`{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",          // empty = match all events of this type
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/inject-context.sh" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",      // only fires when Bash tool is called
        "hooks": [
          { "type": "command", "command": "python3 ~/.claude/hooks/guard.py" }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",  // regex OR
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/format.sh" },
          { "type": "http",    "url": "https://audit.example.com/log" }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          { "type": "command", "command": "~/.claude/hooks/notify.sh" }
        ]
      }
    ]
  }
}`}
        </pre>
      </div>
    </div>
  );
}

// ── Practical Patterns ─────────────────────────────────────────────
function PatternsTab() {
  const [open, setOpen] = useState(0);

  return (
    <div>
      <SectionTitle color={C.orange} subtitle="Copy-paste patterns for common automation needs">
        Practical Hook Patterns
      </SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PATTERNS.map((p, i) => (
          <div
            key={p.title}
            style={{
              background: open === i ? C.card : C.surface,
              border: `1.5px solid ${open === i ? p.color + "50" : C.border}`,
              borderRadius: 10, overflow: "hidden", transition: "all 0.15s",
            }}
          >
            <div
              onClick={() => setOpen(open === i ? -1 : i)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", cursor: "pointer" }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ ...sans, fontSize: 14, fontWeight: 700, color: C.text }}>{p.title}</span>
                <span style={{ ...sans, fontSize: 12, color: C.textDim, marginLeft: 10 }}>{p.desc}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <Tag color={p.color}>{p.event}</Tag>
                <Tag color={C.textDim}>{p.handler}</Tag>
              </div>
            </div>
            {open === i && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: 16 }}>
                <pre style={{
                  ...mono, fontSize: 12, color: C.text,
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: 16, margin: 0, overflowX: "auto", lineHeight: 1.6,
                }}>
                  {p.code}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Debugging tips */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle color={C.yellow} subtitle="How to inspect and debug hooks during development">
          Debugging Hooks
        </SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {[
            { cmd: "/hooks", desc: "List all active hooks and their matchers" },
            { cmd: "/hooks reload", desc: "Re-read hooks from settings.json without restarting" },
            { cmd: "CLAUDE_HOOK_DEBUG=1 claude", desc: "Print every hook invocation to stderr" },
            { cmd: "echo '{}' | python3 my-hook.py", desc: "Manually test a hook script locally" },
            { cmd: "/hooks disable <name>", desc: "Temporarily disable a hook without editing config" },
          ].map(({ cmd, desc }) => (
            <div key={cmd} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ ...mono, fontSize: 12, color: C.yellow, marginBottom: 4 }}>{cmd}</div>
              <div style={{ ...sans, fontSize: 12, color: C.textSoft }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
const TABS = [
  { id: "flow", label: "Session Flow", color: C.green },
  { id: "events", label: "Hook Events", color: C.purple },
  { id: "handlers", label: "Handler Types", color: C.cyan },
  { id: "patterns", label: "Patterns", color: C.orange },
];

export default function HooksDiagram() {
  const [tab, setTab] = useState("flow");

  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: "28px 24px", fontFamily: sans.fontFamily, color: C.text, minHeight: 500 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ ...sans, fontSize: 24, fontWeight: 800, color: C.white, margin: 0, letterSpacing: -0.5 }}>
            Claude Code — Hooks System
          </h1>
          <p style={{ ...sans, fontSize: 13, color: C.textDim, margin: "6px 0 0" }}>
            30+ hook events · 5 handler types · Full lifecycle automation · v2.1.126
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Tag color={C.green}>v2.1.126</Tag>
          <Tag color={C.textDim}>June 2026</Tag>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...sans, fontSize: 14, fontWeight: 600, cursor: "pointer",
              padding: "10px 18px", borderRadius: "8px 8px 0 0",
              background: tab === t.id ? `${t.color}15` : "transparent",
              border: `1.5px solid ${tab === t.id ? t.color + "60" : "transparent"}`,
              borderBottom: tab === t.id ? `2px solid ${t.color}` : "1.5px solid transparent",
              color: tab === t.id ? t.color : C.textSoft,
              transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "flow" && <SessionFlowTab />}
      {tab === "events" && <EventsTab />}
      {tab === "handlers" && <HandlersTab />}
      {tab === "patterns" && <PatternsTab />}
    </div>
  );
}
