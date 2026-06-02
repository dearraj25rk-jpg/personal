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

// ── Permission Layers Tab ──────────────────────────────────────────
function LayersTab() {
  const [activeLayer, setActiveLayer] = useState(null);

  const layers = [
    {
      id: "enterprise",
      level: 1,
      label: "Enterprise Managed",
      sublabel: "MDM / managed configuration (highest precedence)",
      color: C.red,
      bg: C.redBg,
      border: C.redBorder,
      width: "100%",
      controls: "All Claude Code settings. Can lock any setting and prevent user override.",
      source: "Deployed via MDM (Jamf, Intune), /etc/claude/settings.json, or system-managed policy files",
      examples: [
        "Lock allowed tool list across all developer machines",
        "Mandate audit logging to corporate endpoint",
        "Disable bypassPermissions across the org",
        "Enforce enterprise API key usage",
      ],
      settingsFile: "/etc/claude/settings.json (system-wide)\n~/.claude/enterprise.json (user-scope MDM)",
    },
    {
      id: "project",
      level: 2,
      label: "Project Settings",
      sublabel: ".claude/settings.json in the project directory",
      color: C.orange,
      bg: C.orangeBg,
      border: C.orangeBorder,
      width: "88%",
      controls: "Project-scoped tool permissions, hooks, MCP servers, custom commands",
      source: "Checked into the repository. Shared across all developers working on the project.",
      examples: [
        "Allow Bash(npm:*) for this project's npm scripts",
        "Block Bash(rm:-rf*) to prevent accidental deletion",
        "Define project-specific hooks (e.g. run tests after edits)",
        "Configure MCP servers needed for the project",
      ],
      settingsFile: ".claude/settings.json",
    },
    {
      id: "user",
      level: 3,
      label: "User Settings",
      sublabel: "~/.claude/settings.json — per-developer preferences",
      color: C.yellow,
      bg: C.yellowBg,
      border: C.yellowBorder,
      width: "75%",
      controls: "Personal preferences, global tool allowances, personal MCP servers, global hooks",
      source: "The developer's home directory. Applies to all projects the user works on.",
      examples: [
        "Allow Read and Grep globally for all projects",
        "Set preferred model (claude-sonnet-4-5)",
        "Personal audit logging hooks",
        "Personal MCP servers (Slack, GitHub, etc.)",
      ],
      settingsFile: "~/.claude/settings.json",
    },
    {
      id: "local",
      level: 4,
      label: "Local Settings",
      sublabel: ".claude/settings.local.json — machine-local overrides",
      color: C.green,
      bg: C.greenBg,
      border: C.greenBorder,
      width: "62%",
      controls: "Machine-specific settings not committed to git. Local secrets, local tool paths.",
      source: "In .gitignore. Overrides project settings only for this machine.",
      examples: [
        "Local API keys or tokens not safe for git",
        "Machine-specific Bash command allowances",
        "Local debug/verbose mode settings",
        "Development-only MCP server overrides",
      ],
      settingsFile: ".claude/settings.local.json  # gitignored",
    },
  ];

  return (
    <div>
      <SectionTitle color={C.red} subtitle="Four-layer permission pyramid — higher layers take precedence. Click a layer for details.">
        Permission Layers
      </SectionTitle>

      {/* Pyramid */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginBottom: 28 }}>
        {layers.map((layer, i) => (
          <div
            key={layer.id}
            onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
            style={{
              width: layer.width, maxWidth: 700,
              background: activeLayer === layer.id ? layer.bg : C.card,
              border: `2px solid ${activeLayer === layer.id ? layer.color : layer.border}`,
              borderRadius: 10, padding: "12px 20px", cursor: "pointer",
              transition: "all 0.18s", display: "flex", alignItems: "center", gap: 14,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
              background: `${layer.color}20`, border: `2px solid ${layer.color}50`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: layer.color }}>{layer.level}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ ...sans, fontSize: 14, fontWeight: 700, color: layer.color }}>{layer.label}</div>
              <div style={{ ...sans, fontSize: 12, color: C.textDim, marginTop: 2 }}>{layer.sublabel}</div>
            </div>
            <div style={{ ...sans, fontSize: 12, color: C.textDim }}>{activeLayer === layer.id ? "▲" : "▼"}</div>
          </div>
        ))}
        {/* Precedence arrow */}
        <div style={{
          ...sans, fontSize: 12, color: C.textDim, marginTop: 4, display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ color: C.red }}>Layer 1</span>
          <span>overrides</span>
          <span style={{ color: C.orange }}>Layer 2</span>
          <span>overrides</span>
          <span style={{ color: C.yellow }}>Layer 3</span>
          <span>overrides</span>
          <span style={{ color: C.green }}>Layer 4</span>
        </div>
      </div>

      {/* Detail panel */}
      {activeLayer && (() => {
        const layer = layers.find(l => l.id === activeLayer);
        return layer ? (
          <div style={{
            background: layer.bg, border: `1.5px solid ${layer.border}`,
            borderRadius: 12, padding: 20,
          }}>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px" }}>
                <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: layer.color, marginBottom: 6 }}>What it controls</div>
                <p style={{ ...sans, fontSize: 13, color: C.text, lineHeight: 1.6, marginBottom: 14 }}>{layer.controls}</p>
                <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: layer.color, marginBottom: 6 }}>Source</div>
                <p style={{ ...sans, fontSize: 13, color: C.textSoft, lineHeight: 1.6, marginBottom: 14 }}>{layer.source}</p>
                <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: layer.color, marginBottom: 6 }}>Settings file</div>
                <pre style={{
                  ...mono, fontSize: 12, color: layer.color,
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: "8px 12px", margin: 0,
                }}>{layer.settingsFile}</pre>
              </div>
              <div style={{ flex: "1 1 240px" }}>
                <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: layer.color, marginBottom: 10 }}>Typical uses</div>
                {layer.examples.map((ex, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: layer.color, flexShrink: 0, marginTop: 2 }}>•</span>
                    <span style={{ ...sans, fontSize: 12, color: C.textSoft }}>{ex}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null;
      })()}

      {/* Merge semantics */}
      <div style={{ marginTop: 24 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          How Layers Merge
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
          {[
            { title: "Arrays — merged (allowlists)", desc: "allowedTools arrays are unioned across all layers. Any layer can add to the allow set.", color: C.green },
            { title: "Arrays — merged (blocklists)", desc: "blockedTools from any layer are unioned. Enterprise can block what user allows.", color: C.red },
            { title: "Scalars — higher layer wins", desc: "For scalar settings like mode, the highest-precedence layer that sets the value wins.", color: C.yellow },
            { title: "Enterprise lock", desc: "Enterprise layer can mark settings as locked, preventing lower layers from overriding.", color: C.red },
          ].map(p => (
            <div key={p.title} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px", borderLeft: `3px solid ${p.color}` }}>
              <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 4 }}>{p.title}</div>
              <div style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Permission Modes Tab ───────────────────────────────────────────
function ModesTab() {
  const [selected, setSelected] = useState("default");

  const modes = [
    {
      id: "default",
      label: "default",
      title: "Default Mode",
      color: C.blue,
      bg: C.blueBg,
      border: C.blueBorder,
      tagline: "Ask for permissions interactively",
      risk: "Low",
      riskColor: C.green,
      description: "Claude Code prompts the user for approval before each tool call that isn't already in an allowlist. The user can approve once, approve for the session, or deny.",
      whenToUse: "Everyday development work. Provides maximum visibility into what Claude is doing. Good default for new projects.",
      notFor: "Automated pipelines where interactive input is unavailable.",
      behavior: [
        "Bash commands: prompt unless in allowedTools",
        "File reads: prompt unless in allowedTools",
        "File writes/edits: prompt unless in allowedTools",
        "User can approve for session to avoid repeat prompts",
        "Audit trail of every approved/denied action",
      ],
      config: `// settings.json — default mode (implicit)
{
  "permissions": {
    "mode": "default"
  }
}`,
    },
    {
      id: "acceptEdits",
      label: "acceptEdits",
      title: "Accept Edits Mode",
      color: C.yellow,
      bg: C.yellowBg,
      border: C.yellowBorder,
      tagline: "Auto-approve file reads and edits",
      risk: "Medium",
      riskColor: C.yellow,
      description: "All file Read, Write, Edit, and MultiEdit operations are automatically approved without prompting. Bash commands and other tools still require approval.",
      whenToUse: "When you trust Claude to make file changes but want oversight on shell execution. Good for refactoring and documentation tasks.",
      notFor: "Untrusted code or projects where files contain secrets that shouldn't be auto-read.",
      behavior: [
        "Read: auto-approved (no prompt)",
        "Write / Edit / MultiEdit: auto-approved",
        "Bash: still prompts for each command",
        "Task (subagents): still prompts",
        "MCP tools: still prompt",
      ],
      config: `// settings.json
{
  "permissions": {
    "mode": "acceptEdits"
  }
}

// Or pass on CLI:
// claude --permission-mode acceptEdits`,
    },
    {
      id: "bypassPermissions",
      label: "bypassPermissions",
      title: "Bypass Permissions Mode",
      color: C.red,
      bg: C.redBg,
      border: C.redBorder,
      tagline: "Skip all permission checks",
      risk: "High",
      riskColor: C.red,
      description: "All permission checks are bypassed. Every tool call executes immediately without any prompts. This includes Bash commands, file operations, network requests, and subagents.",
      whenToUse: "CI/CD pipelines, automated testing, scripted workflows where the prompt set is fully controlled and interactive input is not possible.",
      notFor: "Interactive development sessions. Never expose to untrusted prompts in this mode — there is no safety net.",
      behavior: [
        "All tools: execute immediately, no prompts",
        "Allowlists/blocklists: still respected",
        "Hooks: still fire",
        "No interactive confirmation possible",
        "Audit logs still record actions",
      ],
      config: `// settings.json (project or user)
{
  "permissions": {
    "mode": "bypassPermissions"
  }
}

// CLI flag:
// claude --dangerously-skip-permissions

// CI/CD recommended pattern:
// Combine with allowedTools blocklist for defense-in-depth`,
    },
    {
      id: "autoApprove",
      label: "autoApprove",
      title: "Auto-Approve Mode",
      color: C.orange,
      bg: C.orangeBg,
      border: C.orangeBorder,
      tagline: "Approve everything matching configured rules",
      risk: "Medium-High",
      riskColor: C.orange,
      description: "Configures a set of auto-approval rules. Tools matching the rules are approved silently; tools outside the rules still prompt. More fine-grained than bypassPermissions.",
      whenToUse: "Semi-automated workflows where you know exactly which tools will be needed and want to pre-approve them without a full bypass.",
      notFor: "Cases where you need to review each individual action. Not as safe as default for exploratory tasks.",
      behavior: [
        "Tools matching autoApprove rules: silently approved",
        "Tools outside rules: prompt as usual",
        "Can combine with allowedTools for layered control",
        "Hooks still fire on auto-approved tools",
        "Finer-grained than bypassPermissions",
      ],
      config: `// settings.json
{
  "permissions": {
    "mode": "autoApprove",
    "autoApproveTools": [
      "Read",
      "Bash(npm:*)",
      "Bash(git log:*)",
      "Bash(git status:*)"
    ]
  }
}`,
    },
  ];

  const active = modes.find(m => m.id === selected);

  return (
    <div>
      <SectionTitle color={C.blue} subtitle="Four permission modes — choose based on automation level and risk tolerance">
        Permission Modes
      </SectionTitle>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => setSelected(m.id)}
            style={{
              ...mono, fontSize: 13, fontWeight: 600, cursor: "pointer",
              padding: "10px 16px", borderRadius: 8,
              background: selected === m.id ? m.bg : C.card,
              border: `2px solid ${selected === m.id ? m.color : m.border}`,
              color: selected === m.id ? m.color : C.textSoft,
              transition: "all 0.15s",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {active && (
        <div style={{ background: C.card, border: `1.5px solid ${active.color}50`, borderRadius: 12, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ ...sans, fontSize: 18, fontWeight: 800, color: active.color }}>{active.title}</span>
                <span style={{
                  ...sans, fontSize: 11, fontWeight: 700,
                  color: active.riskColor, background: `${active.riskColor}15`,
                  border: `1px solid ${active.riskColor}40`,
                  borderRadius: 4, padding: "2px 8px",
                }}>
                  Risk: {active.risk}
                </span>
              </div>
              <p style={{ ...sans, fontSize: 13, color: C.textSoft, margin: 0, fontStyle: "italic" }}>{active.tagline}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px" }}>
              <p style={{ ...sans, fontSize: 14, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>{active.description}</p>

              <div style={{ marginBottom: 14 }}>
                <div style={{ ...sans, fontSize: 12, color: active.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>When to use</div>
                <p style={{ ...sans, fontSize: 13, color: C.textSoft, lineHeight: 1.6 }}>{active.whenToUse}</p>
              </div>

              <div style={{ padding: "8px 12px", background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 7 }}>
                <span style={{ ...sans, fontSize: 12, color: C.red, fontWeight: 600 }}>Not for: </span>
                <span style={{ ...sans, fontSize: 12, color: C.textSoft }}>{active.notFor}</span>
              </div>
            </div>

            <div style={{ flex: "1 1 260px" }}>
              <div style={{ ...sans, fontSize: 12, color: active.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Tool behavior
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {active.behavior.map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: 8 }}>
                    <span style={{ color: active.color, flexShrink: 0 }}>▸</span>
                    <span style={{ ...sans, fontSize: 12, color: C.textSoft }}>{b}</span>
                  </div>
                ))}
              </div>

              <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                Configuration
              </div>
              <pre style={{
                ...mono, fontSize: 12, color: C.text,
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: 14, margin: 0,
                overflowX: "auto", lineHeight: 1.6, whiteSpace: "pre-wrap",
              }}>
                {active.config}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Allowlists Tab ─────────────────────────────────────────────────
function AllowlistsTab() {
  const [activeExample, setActiveExample] = useState(0);

  const examples = [
    {
      id: "basic",
      label: "Basic Allow/Block",
      color: C.green,
      code: `{
  "permissions": {
    "allow": [
      "Read",
      "Bash(git:*)",
      "Bash(npm run:*)",
      "Bash(npm test:*)"
    ],
    "deny": [
      "Bash(rm:-rf*)",
      "Bash(curl:*)",
      "Bash(wget:*)"
    ]
  }
}`,
      desc: "Allow common read-only and development operations. Deny destructive or network-fetching commands.",
      rules: [
        { pattern: "Read", effect: "allow", desc: "Allow all file reads unconditionally" },
        { pattern: "Bash(git:*)", effect: "allow", desc: "Allow any git subcommand" },
        { pattern: "Bash(npm run:*)", effect: "allow", desc: "Allow npm script execution" },
        { pattern: "Bash(rm:-rf*)", effect: "deny", desc: "Block recursive forced deletion" },
        { pattern: "Bash(curl:*)", effect: "deny", desc: "Block all outbound curl requests" },
      ],
    },
    {
      id: "granular",
      label: "Granular Bash Rules",
      color: C.blue,
      code: `{
  "permissions": {
    "allow": [
      "Bash(npm:*)",
      "Bash(npx tsc:*)",
      "Bash(npx eslint:*)",
      "Bash(python3 -m pytest:*)",
      "Bash(docker ps:*)",
      "Bash(docker logs:*)"
    ],
    "deny": [
      "Bash(docker rm:*)",
      "Bash(docker rmi:*)",
      "Bash(npm publish:*)",
      "Bash(git push:*)"
    ]
  }
}`,
      desc: "Allow testing and inspection commands, but block publishing, pushing, and container destruction.",
      rules: [
        { pattern: "Bash(npm:*)", effect: "allow", desc: "All npm commands (scoped further by deny)" },
        { pattern: "Bash(docker ps:*)", effect: "allow", desc: "List containers — safe read-only" },
        { pattern: "Bash(docker rm:*)", effect: "deny", desc: "Block container deletion" },
        { pattern: "Bash(npm publish:*)", effect: "deny", desc: "Block npm publish" },
        { pattern: "Bash(git push:*)", effect: "deny", desc: "Block git pushes (allow local git ops)" },
      ],
    },
    {
      id: "mcp",
      label: "MCP Tool Rules",
      color: C.purple,
      code: `{
  "permissions": {
    "allow": [
      "mcp__github__list_issues",
      "mcp__github__issue_read",
      "mcp__github__list_pull_requests",
      "mcp__github__pull_request_read",
      "mcp__slack__send_message"
    ],
    "deny": [
      "mcp__github__delete_file",
      "mcp__github__create_repository",
      "mcp__github__push_files"
    ]
  }
}`,
      desc: "Allow read-only GitHub MCP operations and Slack messaging. Block destructive write operations.",
      rules: [
        { pattern: "mcp__github__issue_read", effect: "allow", desc: "Read GitHub issues — safe" },
        { pattern: "mcp__slack__send_message", effect: "allow", desc: "Allow Slack notifications" },
        { pattern: "mcp__github__delete_file", effect: "deny", desc: "Block file deletion via GitHub MCP" },
        { pattern: "mcp__github__push_files", effect: "deny", desc: "Block pushing via MCP" },
        { pattern: "mcp__github__create_repository", effect: "deny", desc: "Block repo creation" },
      ],
    },
    {
      id: "ci",
      label: "CI/CD Locked Down",
      color: C.cyan,
      code: `{
  "permissions": {
    "mode": "bypassPermissions",
    "allow": [
      "Read",
      "Write",
      "Edit",
      "MultiEdit",
      "Bash(npm ci:*)",
      "Bash(npm test:*)",
      "Bash(npm run build:*)",
      "Bash(git commit:*)",
      "Bash(git add:*)"
    ],
    "deny": [
      "Bash(rm:-rf*)",
      "Bash(curl:*)",
      "Bash(wget:*)",
      "Bash(git push:*)",
      "Bash(npm publish:*)"
    ]
  }
}`,
      desc: "CI/CD profile: bypass prompts but restrict to build/test operations. No network requests or publishing.",
      rules: [
        { pattern: "bypassPermissions mode", effect: "allow", desc: "No interactive prompts in CI" },
        { pattern: "Bash(npm ci:*)", effect: "allow", desc: "Clean install dependencies" },
        { pattern: "Bash(git push:*)", effect: "deny", desc: "CI shouldn't push — PR/merge job handles it" },
        { pattern: "Bash(curl:*)", effect: "deny", desc: "No arbitrary network in CI agent" },
        { pattern: "Bash(npm publish:*)", effect: "deny", desc: "Publishing is a separate release job" },
      ],
    },
  ];

  const active = examples[activeExample];

  return (
    <div>
      <SectionTitle color={C.green} subtitle="Configure tool allowlists and blocklists in settings.json to control exactly what Claude can execute">
        Tool Allowlist / Blocklist
      </SectionTitle>

      {/* Syntax reference */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, marginBottom: 24 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Pattern Syntax Reference</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
          {[
            { pattern: "Read", meaning: "Match the entire Read tool (all file reads)", color: C.green },
            { pattern: "Bash(*)", meaning: "Match any Bash command (same as just 'Bash')", color: C.green },
            { pattern: "Bash(git:*)", meaning: "Match Bash calls starting with 'git'", color: C.blue },
            { pattern: "Bash(npm run:*)", meaning: "Match Bash calls starting with 'npm run'", color: C.blue },
            { pattern: "Bash(rm:-rf*)", meaning: "Match rm with -rf flag (any path)", color: C.red },
            { pattern: "mcp__server__tool", meaning: "Exact MCP server + tool name", color: C.purple },
            { pattern: "Write", meaning: "Match all Write tool calls", color: C.yellow },
            { pattern: "Edit", meaning: "Match all Edit tool calls", color: C.yellow },
          ].map(({ pattern, meaning, color }) => (
            <div key={pattern} style={{ display: "flex", gap: 10 }}>
              <code style={{ ...mono, fontSize: 12, color, background: `${color}12`, borderRadius: 4, padding: "2px 7px", flexShrink: 0 }}>
                {pattern}
              </code>
              <span style={{ ...sans, fontSize: 12, color: C.textSoft }}>{meaning}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Example tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {examples.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => setActiveExample(i)}
            style={{
              ...sans, fontSize: 13, fontWeight: 600, cursor: "pointer",
              padding: "8px 14px", borderRadius: 8,
              background: activeExample === i ? `${ex.color}18` : C.card,
              border: `1.5px solid ${activeExample === i ? ex.color + "60" : C.border}`,
              color: activeExample === i ? ex.color : C.textSoft,
              transition: "all 0.15s",
            }}
          >
            {ex.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* Code */}
        <div style={{ flex: "1 1 300px" }}>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
            settings.json
          </div>
          <pre style={{
            ...mono, fontSize: 12, color: C.text,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: 16, margin: 0,
            overflowX: "auto", lineHeight: 1.7,
          }}>
            {active.code}
          </pre>
          <p style={{ ...sans, fontSize: 13, color: C.textSoft, marginTop: 10, lineHeight: 1.6 }}>{active.desc}</p>
        </div>

        {/* Rule breakdown */}
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
            Rule Breakdown
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {active.rules.map((r, i) => (
              <div key={i} style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                background: C.card, border: `1px solid ${r.effect === "allow" ? C.greenBorder : C.redBorder}`,
                borderRadius: 8, padding: "10px 12px",
              }}>
                <div style={{
                  width: 44, flexShrink: 0, textAlign: "center",
                  ...sans, fontSize: 10, fontWeight: 700,
                  color: r.effect === "allow" ? C.green : C.red,
                  background: r.effect === "allow" ? C.greenBg : C.redBg,
                  border: `1px solid ${r.effect === "allow" ? C.greenBorder : C.redBorder}`,
                  borderRadius: 4, padding: "2px 0",
                  textTransform: "uppercase",
                }}>
                  {r.effect}
                </div>
                <div>
                  <code style={{ ...mono, fontSize: 12, color: r.effect === "allow" ? C.green : C.red }}>{r.pattern}</code>
                  <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 3 }}>{r.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Evaluation order */}
          <div style={{ marginTop: 16, padding: "10px 14px", background: C.yellowBg, border: `1px solid ${C.yellowBorder}`, borderRadius: 8 }}>
            <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: C.yellow, marginBottom: 4 }}>Evaluation Order</div>
            <div style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>
              Deny rules are checked first. If a tool matches any deny pattern, it is blocked — even if it also matches an allow pattern. Allow rules only apply when no deny matches.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sandbox Tab ────────────────────────────────────────────────────
function SandboxTab() {
  const [activeLayer, setActiveLayer] = useState(null);

  const sandboxLayers = [
    {
      id: "process",
      label: "Process Isolation",
      color: C.blue,
      platforms: ["macOS", "Linux"],
      desc: "Claude Code runs tool subprocesses in isolated child processes with limited inherited environment.",
      details: [
        "Child processes inherit only the specified environment variables",
        "stdin/stdout/stderr are piped and controlled",
        "Process group management prevents orphaned processes",
        "Timeout enforcement kills hung processes",
      ],
    },
    {
      id: "seatbelt",
      label: "Seatbelt (macOS)",
      color: C.orange,
      platforms: ["macOS"],
      desc: "Apple's Sandbox.framework (seatbelt) profiles restrict what Bash subprocesses can access.",
      details: [
        "Filesystem: can read project directory + system libraries; write restricted to project dir",
        "Network: outbound connections can be blocked or allowed per config",
        "Process: cannot spawn privileged processes or load arbitrary kernel extensions",
        "IPC: restricted access to other processes' memory and signals",
      ],
    },
    {
      id: "bubblewrap",
      label: "bubblewrap (Linux)",
      color: C.purple,
      platforms: ["Linux"],
      desc: "Bubblewrap (bwrap) creates lightweight user-namespace containers for Bash tool execution.",
      details: [
        "New mount namespace: project dir bind-mounted read/write; rest read-only or hidden",
        "New network namespace (optional): blocks outbound network from tool subprocess",
        "New user namespace: subprocess cannot gain privileges",
        "Seccomp filter: restricts available syscalls to safe subset",
      ],
    },
    {
      id: "filesystem",
      label: "Filesystem Restrictions",
      color: C.yellow,
      platforms: ["macOS", "Linux"],
      desc: "Configurable filesystem access policies applied on top of OS-level sandbox.",
      details: [
        "ALLOWED_READ_PATHS: explicit whitelist of directories Claude can read",
        "ALLOWED_WRITE_PATHS: explicit whitelist of directories Claude can write",
        "Defaults to project directory + home ~/.claude/",
        "Enterprise policy can restrict to specific project paths only",
      ],
    },
    {
      id: "network",
      label: "Network Restrictions",
      color: C.cyan,
      platforms: ["macOS", "Linux"],
      desc: "Network access control for Bash subprocesses running within Claude Code.",
      details: [
        "Default: network allowed (curl, wget, npm install all work)",
        "CLAUDE_SANDBOX_NETWORK=block: cuts all outbound from tool subprocesses",
        "Allowlist mode: only approved domains/IPs accessible",
        "Note: MCP servers have their own network access independent of this setting",
      ],
    },
  ];

  return (
    <div>
      <SectionTitle color={C.cyan} subtitle="OS-level sandboxing layers that restrict what Bash tool executions can access">
        Sandbox Architecture
      </SectionTitle>

      {/* Platform badges */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ ...sans, fontSize: 13, color: C.textDim }}>Sandbox support:</div>
        <Tag color={C.orange}>macOS (Seatbelt)</Tag>
        <Tag color={C.purple}>Linux (bubblewrap)</Tag>
      </div>

      {/* Architecture diagram */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, alignItems: "center" }}>
          {/* Claude Code outer box */}
          <div style={{ width: "100%", maxWidth: 600, border: `2px solid ${C.blueBorder}`, borderRadius: 12, padding: 16, background: C.blueBg }}>
            <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: C.blue, marginBottom: 14 }}>Claude Code Process</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {/* Claude AI */}
              <div style={{ flex: "1 1 140px", background: C.surface, border: `1.5px solid ${C.purpleBorder}`, borderRadius: 8, padding: 12 }}>
                <div style={{ ...mono, fontSize: 11, color: C.purple, marginBottom: 4 }}>Claude LLM</div>
                <div style={{ ...sans, fontSize: 11, color: C.textDim }}>Generates tool calls, reads responses</div>
              </div>
              {/* Permission engine */}
              <div style={{ flex: "1 1 140px", background: C.surface, border: `1.5px solid ${C.yellowBorder}`, borderRadius: 8, padding: 12 }}>
                <div style={{ ...mono, fontSize: 11, color: C.yellow, marginBottom: 4 }}>Permission Engine</div>
                <div style={{ ...sans, fontSize: 11, color: C.textDim }}>Checks allow/deny lists before execution</div>
              </div>
            </div>
            <div style={{ textAlign: "center", ...sans, fontSize: 12, color: C.textDim, margin: "10px 0" }}>↓ approved tool call passed to</div>
            {/* Sandbox wrapper */}
            <div style={{ border: `2px dashed ${C.orangeBorder}`, borderRadius: 8, padding: 12, background: C.orangeBg }}>
              <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: C.orange, marginBottom: 8 }}>
                Sandbox Wrapper (Seatbelt / bubblewrap)
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Filesystem\nrestrictions", color: C.yellow },
                  { label: "Network\nrestrictions", color: C.cyan },
                  { label: "Process\nisolation", color: C.blue },
                  { label: "Syscall\nfilter", color: C.purple },
                ].map(b => (
                  <div key={b.label} style={{
                    flex: "1 1 80px", background: C.surface, border: `1px solid ${b.color}30`,
                    borderRadius: 6, padding: "6px 8px", textAlign: "center",
                  }}>
                    <div style={{ ...sans, fontSize: 10, color: b.color, whiteSpace: "pre-line", lineHeight: 1.4 }}>{b.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", ...sans, fontSize: 12, color: C.textDim, margin: "8px 0" }}>↓ executes inside container</div>
              <div style={{ background: C.surface, border: `1.5px solid ${C.greenBorder}`, borderRadius: 6, padding: 10, textAlign: "center" }}>
                <div style={{ ...mono, fontSize: 12, color: C.green }}>Bash subprocess / Tool execution</div>
                <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 2 }}>Runs with restricted capabilities</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layer detail cards */}
      <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        Sandbox Layers — click to expand
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sandboxLayers.map(layer => (
          <div
            key={layer.id}
            style={{
              background: activeLayer === layer.id ? `${layer.color}10` : C.card,
              border: `1.5px solid ${activeLayer === layer.id ? layer.color + "50" : C.border}`,
              borderRadius: 10, overflow: "hidden", transition: "all 0.15s",
            }}
          >
            <div
              onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer" }}
            >
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: layer.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ ...sans, fontSize: 14, fontWeight: 700, color: layer.color }}>{layer.label}</span>
                <span style={{ ...sans, fontSize: 12, color: C.textDim, marginLeft: 10 }}>{layer.desc}</span>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {layer.platforms.map(p => <Tag key={p} color={layer.color}>{p}</Tag>)}
              </div>
              <div style={{ ...sans, fontSize: 12, color: C.textDim, marginLeft: 4 }}>{activeLayer === layer.id ? "▲" : "▼"}</div>
            </div>
            {activeLayer === layer.id && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: "12px 16px" }}>
                {layer.details.map((d, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                    <span style={{ color: layer.color, flexShrink: 0 }}>•</span>
                    <span style={{ ...sans, fontSize: 13, color: C.textSoft }}>{d}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Environment variables */}
      <div style={{ marginTop: 20 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Sandbox Environment Variables</div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
          {[
            { env: "CLAUDE_SANDBOX=1", desc: "Enable sandbox mode for all Bash tool executions" },
            { env: "CLAUDE_SANDBOX_NETWORK=block", desc: "Block all outbound network from tool subprocesses" },
            { env: "CLAUDE_SANDBOX_ALLOWED_PATHS=...", desc: "Colon-separated list of allowed read/write paths" },
            { env: "CLAUDE_SANDBOX_READONLY_PATHS=...", desc: "Paths accessible read-only only" },
          ].map(({ env, desc }) => (
            <div key={env} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
              <code style={{ ...mono, fontSize: 12, color: C.cyan, flexShrink: 0 }}>{env}</code>
              <span style={{ ...sans, fontSize: 12, color: C.textSoft }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Audit Logging Tab ──────────────────────────────────────────────
function AuditTab() {
  const [activeDestination, setActiveDestination] = useState("file");

  const destinations = [
    {
      id: "file",
      label: "File (JSONL)",
      color: C.green,
      desc: "Append-only JSONL log file. Each line is one audit event as a JSON object.",
      config: `{
  "auditLog": {
    "enabled": true,
    "destination": "file",
    "path": "~/.claude/audit.jsonl",
    "maxSizeBytes": 104857600,
    "maxFiles": 10
  }
}`,
      notes: [
        "Rotates when maxSizeBytes is exceeded",
        "maxFiles controls how many rotated logs to keep",
        "File is append-only — Claude Code never modifies existing entries",
        "Read with: jq . ~/.claude/audit.jsonl",
      ],
    },
    {
      id: "http",
      label: "HTTP Webhook",
      color: C.blue,
      desc: "POST each audit event as a JSON body to an HTTP endpoint. Good for centralized SIEM.",
      config: `{
  "auditLog": {
    "enabled": true,
    "destination": "http",
    "url": "https://siem.example.com/claude/events",
    "headers": {
      "Authorization": "Bearer ${"{env.AUDIT_TOKEN}"}",
      "X-Team": "platform-engineering"
    },
    "batchSize": 50,
    "flushIntervalMs": 5000
  }
}`,
      notes: [
        "Events are batched and flushed on interval or batch size",
        "Failed POSTs are retried with exponential backoff",
        "On persistent failure, events are written to local fallback file",
        "Supports custom headers for auth tokens and routing",
      ],
    },
    {
      id: "otel",
      label: "OpenTelemetry",
      color: C.purple,
      desc: "Emit audit events as OpenTelemetry spans to an OTLP collector. Integrates with Jaeger, Datadog, Honeycomb, etc.",
      config: `{
  "auditLog": {
    "enabled": true,
    "destination": "opentelemetry",
    "otlpEndpoint": "http://otel-collector:4317",
    "serviceName": "claude-code",
    "resourceAttributes": {
      "deployment.environment": "production",
      "team": "platform"
    }
  }
}

// Environment variable alternative:
// OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317`,
      notes: [
        "Each audit event becomes an OTLP span",
        "Tool calls become child spans of the session trace",
        "Works with any OTLP-compatible backend",
        "Full W3C Trace Context propagation supported",
      ],
    },
  ];

  const active = destinations.find(d => d.id === activeDestination);

  const eventTypes = [
    { event: "tool_use", fields: "tool_name, tool_input, tool_response, duration_ms", color: C.blue },
    { event: "tool_blocked", fields: "tool_name, tool_input, blocked_by (allow/deny rule), rule_pattern", color: C.red },
    { event: "permission_prompt", fields: "tool_name, decision (allow/deny/always), prompted_by", color: C.yellow },
    { event: "session_start", fields: "session_id, project_dir, mode, user_id, timestamp", color: C.green },
    { event: "session_end", fields: "session_id, turn_count, tokens_used, duration_ms", color: C.green },
    { event: "agent_spawn", fields: "parent_session_id, agent_session_id, agent_prompt_hash", color: C.purple },
    { event: "hook_fire", fields: "hook_type, event_name, handler_type, exit_code, output_bytes", color: C.cyan },
    { event: "context_compact", fields: "session_id, trigger, turns_before, tokens_before", color: C.orange },
  ];

  return (
    <div>
      <SectionTitle color={C.orange} subtitle="Structured audit logging for compliance, debugging, and security monitoring">
        Audit Logging
      </SectionTitle>

      {/* What gets logged */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Event Types Logged
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 8 }}>
          {eventTypes.map(ev => (
            <div key={ev.event} style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "10px 12px",
              borderLeft: `3px solid ${ev.color}`,
            }}>
              <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: ev.color, marginBottom: 4 }}>{ev.event}</div>
              <div style={{ ...mono, fontSize: 10, color: C.textDim }}>{ev.fields}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Log format example */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Log Entry Format (JSONL)
        </div>
        <pre style={{
          ...mono, fontSize: 12, color: C.text,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: 16, margin: 0,
          overflowX: "auto", lineHeight: 1.7,
        }}>
{`{"event":"tool_use","session_id":"ses_01XYZ","timestamp":"2026-06-02T14:23:01.432Z",
  "tool_name":"Bash","tool_input":{"command":"npm test"},"duration_ms":4821,
  "tool_response":{"output":"Tests passed: 42/42","exit_code":0}}

{"event":"tool_blocked","session_id":"ses_01XYZ","timestamp":"2026-06-02T14:23:07.001Z",
  "tool_name":"Bash","tool_input":{"command":"rm -rf ./dist"},"blocked_by":"deny",
  "rule_pattern":"Bash(rm:-rf*)","user_id":"alice@example.com"}

{"event":"permission_prompt","session_id":"ses_01XYZ","timestamp":"2026-06-02T14:23:09.211Z",
  "tool_name":"Bash","tool_input":{"command":"git push origin main"},
  "decision":"deny","prompted_by":"user"}`}
        </pre>
      </div>

      {/* Destination config */}
      <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        Log Destinations
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {destinations.map(d => (
          <button
            key={d.id}
            onClick={() => setActiveDestination(d.id)}
            style={{
              ...sans, fontSize: 13, fontWeight: 600, cursor: "pointer",
              padding: "9px 16px", borderRadius: 8,
              background: activeDestination === d.id ? `${d.color}18` : C.card,
              border: `1.5px solid ${activeDestination === d.id ? d.color + "60" : C.border}`,
              color: activeDestination === d.id ? d.color : C.textSoft,
              transition: "all 0.15s",
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {active && (
        <div style={{ background: C.card, border: `1.5px solid ${active.color}40`, borderRadius: 12, padding: 20 }}>
          <p style={{ ...sans, fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>{active.desc}</p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px" }}>
              <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                Configuration
              </div>
              <pre style={{
                ...mono, fontSize: 12, color: C.text,
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: 14, margin: 0,
                overflowX: "auto", lineHeight: 1.6, whiteSpace: "pre-wrap",
              }}>
                {active.config}
              </pre>
            </div>
            <div style={{ flex: "0 0 220px" }}>
              <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>
                Notes
              </div>
              {active.notes.map((n, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ color: active.color, flexShrink: 0 }}>▸</span>
                  <span style={{ ...sans, fontSize: 12, color: C.textSoft }}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Compliance note */}
      <div style={{ marginTop: 20, padding: "12px 16px", background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8 }}>
        <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: C.green, marginBottom: 4 }}>Compliance Use Cases</div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {[
            "SOC 2 Type II: evidence of access controls and tool use monitoring",
            "ISO 27001: log review and anomaly detection on Claude actions",
            "HIPAA: audit trail of file access in projects with health data",
            "Internal policy: detect misuse or policy violations by reviewing blocked events",
          ].map((use, i) => (
            <div key={i} style={{ display: "flex", gap: 6, flex: "1 1 220px" }}>
              <span style={{ color: C.green, flexShrink: 0 }}>•</span>
              <span style={{ ...sans, fontSize: 12, color: C.textSoft }}>{use}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
const TABS = [
  { id: "layers", label: "Permission Layers", color: C.red },
  { id: "modes", label: "Permission Modes", color: C.blue },
  { id: "allowlists", label: "Allowlists", color: C.green },
  { id: "sandbox", label: "Sandbox", color: C.cyan },
  { id: "audit", label: "Audit Logging", color: C.orange },
];

export default function PermissionsDiagram() {
  const [tab, setTab] = useState("layers");

  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: "28px 24px", fontFamily: sans.fontFamily, color: C.text, minHeight: 500, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ ...sans, fontSize: 24, fontWeight: 800, color: C.white, margin: 0, letterSpacing: -0.5 }}>
            Claude Code — Permissions & Security
          </h1>
          <p style={{ ...sans, fontSize: 13, color: C.textDim, margin: "6px 0 0" }}>
            4-layer permission system · 4 modes · Allowlists · OS sandbox · Audit logging
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Tag color={C.red}>Enterprise-ready</Tag>
          <Tag color={C.textDim}>v2.1.x</Tag>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28, borderBottom: `1px solid ${C.border}`, paddingBottom: 0, flexWrap: "wrap" }}>
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
      {tab === "layers" && <LayersTab />}
      {tab === "modes" && <ModesTab />}
      {tab === "allowlists" && <AllowlistsTab />}
      {tab === "sandbox" && <SandboxTab />}
      {tab === "audit" && <AuditTab />}
    </div>
  );
}
