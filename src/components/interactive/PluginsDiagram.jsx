import { useState } from "react";

const DARK = {
  bg:     "#0d1117",
  panel:  "#161b22",
  border: "#30363d",
  text:   "#e6edf3",
  muted:  "#8b949e",
  accent: "#ffa657",
  green:  "#39d353",
  blue:   "#58a6ff",
  purple: "#d2a8ff",
  red:    "#f87171",
  yellow: "#f0c060",
  card:   "#21262d",
};

const COMPONENTS = [
  {
    id: "commands",
    icon: "/",
    label: "Commands",
    path: "commands/*.md",
    namespace: "/plugin-name:command-name",
    color: DARK.blue,
    description: "Slash commands bundled with the plugin. Same format as project commands — use $ARGUMENTS, @file imports, !shell execution. Automatically namespaced.",
    invocation: "User types /plugin-name:command-name",
    security: "Full command capabilities",
    example: `---\ndescription: Check deployment status\nallowed-tools: Bash(kubectl *), Read\n---\n\nCheck current deployment:\n!kubectl get pods -n production\n\nStatus for: $ARGUMENTS`,
    notes: ["Namespaced automatically", "Same frontmatter as project commands", "Appear in /help with plugin prefix"],
  },
  {
    id: "agents",
    icon: "🤖",
    label: "Agents",
    path: "agents/*.md",
    namespace: "plugin-name:agent-name",
    color: DARK.purple,
    description: "Subagent definitions bundled with the plugin. RESTRICTED: cannot set hooks, mcpServers, or permissionMode (security isolation). All other frontmatter fields supported.",
    invocation: "Claude auto-delegates or user @-mentions",
    security: "⚠️ No hooks, mcpServers, or permissionMode allowed",
    example: `---\nname: security-reviewer\ndescription: Reviews code for security vulnerabilities.\n  Auto-invoked for security audits and after auth changes.\ntools: Read, Glob, Grep\nmodel: sonnet\neffort: high\nmaxTurns: 30\n---\n\nYou are a security specialist...`,
    notes: ["Security-restricted frontmatter", "Invoked as plugin-name:agent-name", "Can use skills and memory"],
  },
  {
    id: "skills",
    icon: "⚡",
    label: "Skills",
    path: "skills/*/SKILL.md",
    namespace: "/plugin-name:skill-name",
    color: DARK.green,
    description: "On-demand capabilities bundled with the plugin. Claude auto-invokes based on description match. Same format as project skills with auto-namespacing.",
    invocation: "Claude auto-invokes from description OR /plugin-name:skill",
    security: "Full skill capabilities",
    example: `---\nname: pdf-extract\ndescription: >\n  Extract text and data from PDF files.\n  Use when asked to read, parse, or analyze PDFs.\nallowed-tools: Bash(python3 *), Read\n---\n\nExtract content from PDF:\n$ARGUMENTS`,
    notes: ["Auto-invocable from description", "Supporting files in skill folder", "Use ${CLAUDE_PLUGIN_ROOT}/scripts/"],
  },
  {
    id: "output-styles",
    icon: "🎨",
    label: "Output Styles",
    path: "output-styles/*.md",
    namespace: "Available in /config Output Style menu",
    color: DARK.yellow,
    description: "Custom response format styles that appear in the /config Output Style menu alongside built-in styles (Default, Explanatory, Learning).",
    invocation: "User selects in /config → Output Style",
    security: "Modifies Claude's system prompt",
    example: `---\nname: Terse CI Mode\ndescription: Minimal output for CI/CD pipelines\nkeep-coding-instructions: true\n---\n\nRespond with code only.\nNo explanations, no markdown prose.\nOutput must be parseable by scripts.`,
    notes: ["Appears in /config menu", "keep-coding-instructions: true recommended", "Takes effect next new session"],
  },
  {
    id: "monitors",
    icon: "📡",
    label: "Monitors",
    path: "monitors/monitors.json",
    namespace: "Background process → stdout → Claude notifications",
    color: DARK.red,
    description: "Background processes that run for the session lifetime, delivering every stdout line to Claude as a notification. Requires v2.1.105+. Unsandboxed at hook trust level.",
    invocation: "Automatic (session start) or on-skill-invoke:skillname",
    security: "Hook trust level — unsandboxed",
    example: `[\n  {\n    \"name\": \"deploy-status\",\n    \"command\": \"${CLAUDE_PLUGIN_ROOT}/poll-deploy.sh\",\n    \"description\": \"Deployment status watcher\"\n  },\n  {\n    \"name\": \"error-log\",\n    \"command\": \"tail -F ./logs/error.log\",\n    \"when\": \"on-skill-invoke:debug\"\n  }\n]`,
    notes: ["Requires v2.1.105+", "when: always OR on-skill-invoke:name", "Interactive sessions only", "Each stdout line → Claude notification"],
  },
  {
    id: "themes",
    icon: "🌈",
    label: "Themes",
    path: "themes/*.json",
    namespace: "Available in /theme alongside built-in presets",
    color: "#79c0ff",
    description: "Color themes that appear in /theme. Users can press Ctrl+E to copy a plugin theme to ~/.claude/themes/ for personal editing. Base preset + sparse overrides format.",
    invocation: "User selects in /theme",
    security: "UI only — no code execution",
    example: `{\n  \"name\": \"Dracula\",\n  \"base\": \"dark\",\n  \"overrides\": {\n    \"claude\": \"#bd93f9\",\n    \"error\": \"#ff5555\",\n    \"success\": \"#50fa7b\",\n    \"warning\": \"#ffb86c\"\n  }\n}`,
    notes: ["Ctrl+E to copy for user editing", "base: dark | light | system", "Persisted as custom:plugin-name:slug"],
  },
  {
    id: "bin",
    icon: "⚙️",
    label: "Bin Executables",
    path: "bin/*",
    namespace: "Added to Bash tool PATH",
    color: DARK.muted,
    description: "Raw executables and scripts added to the Bash tool's PATH when the plugin is enabled. Invokable as bare commands in shell tool calls.",
    invocation: "Available as bare commands in Bash tool",
    security: "Full execution — same as Bash tool",
    example: `# bin/format-code\n#!/bin/bash\n# Custom code formatter\nset -e\nprettier --write \"$1\"\ngofmt -w \"$1\" 2>/dev/null || true`,
    notes: ["Must be executable (chmod +x)", "Available in all Bash tool calls", "Use ${CLAUDE_PLUGIN_DATA} for mutable state"],
  },
  {
    id: "hooks",
    icon: "🔗",
    label: "Hooks",
    path: "hooks/hooks.json",
    namespace: "Event-driven lifecycle hooks",
    color: DARK.accent,
    description: "Event hooks using ${CLAUDE_PLUGIN_ROOT} for paths. Same event types as session hooks: SessionStart, PreToolUse, PostToolUse, Stop, etc.",
    invocation: "Automatic — fired at lifecycle events",
    security: "Hook trust level",
    example: `{\n  \"PostToolUse\": [{\n    \"matcher\": \"Edit|Write\",\n    \"hooks\": [{\n      \"type\": \"command\",\n      \"command\": \"${CLAUDE_PLUGIN_ROOT}/bin/lint.sh\"\n    }]\n  }]\n}`,
    notes: ["Use ${CLAUDE_PLUGIN_ROOT} for paths", "Same events as session hooks", "Runs in hook trust level"],
  },
  {
    id: "mcp",
    icon: "🔌",
    label: "MCP Servers",
    path: ".mcp.json",
    namespace: "Auto-started when plugin enabled",
    color: DARK.green,
    description: "MCP server configurations that start automatically when the plugin is enabled. Use ${CLAUDE_PLUGIN_ROOT} for server path and ${CLAUDE_PLUGIN_DATA} for persistent data.",
    invocation: "Auto-started at session start when plugin enabled",
    security: "MCP trust level",
    example: `{\n  \"mcpServers\": {\n    \"my-db\": {\n      \"type\": \"stdio\",\n      \"command\": \"node\",\n      \"args\": [\"${CLAUDE_PLUGIN_ROOT}/mcp-server.js\"],\n      \"env\": {\n        \"DB_PATH\": \"${CLAUDE_PLUGIN_DATA}/db.sqlite\"\n      }\n    }\n  }\n}`,
    notes: ["${CLAUDE_PLUGIN_ROOT} for server binary", "${CLAUDE_PLUGIN_DATA} for persistent files", "Auto-starts with plugin"],
  },
  {
    id: "lsp",
    icon: "🔤",
    label: "LSP Servers",
    path: ".lsp.json",
    namespace: "Language Server Protocol configurations",
    color: "#79c0ff",
    description: "Language Server Protocol configurations for code intelligence features. Provides hover docs, go-to-definition, and inline diagnostics within Claude Code's editor integration.",
    invocation: "Auto-configured based on file type",
    security: "LSP process trust level",
    example: `{\n  \"servers\": [{\n    \"name\": \"rust-analyzer\",\n    \"command\": \"${CLAUDE_PLUGIN_ROOT}/bin/rust-analyzer\",\n    \"languages\": [\"rust\"]\n  }]\n}`,
    notes: ["Language-aware code intelligence", "Auto-configures for matching file types", "Uses ${CLAUDE_PLUGIN_ROOT} for binaries"],
  },
];

const ENV_VARS = [
  { name: "${CLAUDE_PLUGIN_ROOT}", desc: "Absolute path to plugin installation directory. Changes on plugin update. Do NOT write files here — use CLAUDE_PLUGIN_DATA instead.", safe: false },
  { name: "${CLAUDE_PLUGIN_DATA}", desc: "Persistent directory for mutable plugin data: ~/.claude/plugins/data/<plugin-id>/. Survives plugin updates. Use for node_modules, caches, databases, generated files.", safe: true },
  { name: "${user_config.KEY}", desc: "User-configured value from userConfig in plugin.json. Available in hook commands, MCP/LSP configs, and skill content. Non-sensitive values from settings.json, sensitive from keychain.", safe: true },
  { name: "CLAUDE_PLUGIN_OPTION_KEY", desc: "Same userConfig value exported as environment variable to plugin subprocesses. Uppercase KEY from userConfig.", safe: true },
];

const INSTALL_SCOPES = [
  { scope: "user", file: "~/.claude/settings.json", desc: "Personal plugins across all projects (default)" },
  { scope: "project", file: ".claude/settings.json", desc: "Team plugins shared via version control" },
  { scope: "local", file: ".claude/settings.local.json", desc: "Per-machine overrides, gitignored" },
  { scope: "managed", file: "System managed-settings.json", desc: "Org-wide plugins, read-only, highest priority" },
];

export default function PluginsDiagram() {
  const [selected, setSelected] = useState(COMPONENTS[0]);
  const [tab, setTab] = useState("components");

  return (
    <div style={{
      background: DARK.bg,
      color: DARK.text,
      fontFamily: "'Inter', 'system-ui', sans-serif",
      minHeight: "600px",
      borderRadius: "12px",
      padding: "24px",
      maxWidth: "1100px",
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", color: DARK.accent, fontWeight: 700 }}>
          Claude Code Plugin Architecture
        </h2>
        <p style={{ margin: "6px 0 0", color: DARK.muted, fontSize: "0.875rem" }}>
          All 10 plugin component types, environment variables, installation scopes · v2.1.126 (May 2026)
        </p>
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["components", "detail", "env-vars", "install"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "6px 16px", borderRadius: "6px", border: "1px solid",
            borderColor: tab === t ? DARK.accent : DARK.border,
            background: tab === t ? "rgba(255,166,87,0.12)" : DARK.card,
            color: tab === t ? DARK.accent : DARK.muted,
            cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, textTransform: "capitalize",
          }}>
            {t.replace("-", " ")}
          </button>
        ))}
      </div>

      {tab === "components" && (
        <div>
          <p style={{ color: DARK.muted, fontSize: "0.85rem", marginBottom: "16px" }}>
            Click any component type to see details, path, and example →
          </p>
          <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {COMPONENTS.map(c => (
              <div key={c.id}
                onClick={() => { setSelected(c); setTab("detail"); }}
                style={{
                  background: DARK.card,
                  border: `1px solid ${selected?.id === c.id ? c.color : DARK.border}`,
                  borderRadius: "10px", padding: "14px", cursor: "pointer",
                  transition: "border-color 0.15s",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "1.2rem" }}>{c.icon}</span>
                  <span style={{ color: c.color, fontWeight: 600, fontSize: "0.9rem" }}>{c.label}</span>
                </div>
                <div style={{ color: DARK.muted, fontSize: "0.78rem", marginBottom: "4px", fontFamily: "monospace" }}>
                  📁 {c.path}
                </div>
                <div style={{ color: DARK.muted, fontSize: "0.78rem" }}>
                  {c.description.substring(0, 80)}…
                </div>
              </div>
            ))}
          </div>

          {/* Plugin Directory Overview */}
          <div style={{ background: DARK.card, borderRadius: "12px", padding: "20px", marginTop: "20px", border: `1px solid ${DARK.border}` }}>
            <h3 style={{ margin: "0 0 12px", color: DARK.accent, fontSize: "0.95rem" }}>Complete Plugin Directory Layout</h3>
            <pre style={{ margin: 0, fontFamily: "monospace", fontSize: "0.78rem", color: DARK.text, lineHeight: 1.7 }}>
{`my-plugin/
├── .claude-plugin/
│   └── plugin.json            ← Optional manifest (name, version, userConfig, ...)
├── commands/
│   └── status.md              ← /my-plugin:status
├── agents/
│   └── security-reviewer.md   ← my-plugin:security-reviewer
├── skills/
│   └── pdf-processor/
│       ├── SKILL.md           ← /my-plugin:pdf-processor
│       └── scripts/extract.py
├── output-styles/
│   └── terse.md               ← Appears in /config Output Style
├── themes/
│   └── dracula.json           ← Appears in /theme
├── monitors/
│   └── monitors.json          ← Background watchers
├── hooks/
│   └── hooks.json             ← Lifecycle hooks
├── bin/
│   └── format-tool            ← Added to Bash PATH
├── .mcp.json                  ← Auto-started MCP servers
├── .lsp.json                  ← LSP server configs
└── settings.json              ← Plugin default settings`}
            </pre>
          </div>
        </div>
      )}

      {tab === "detail" && selected && (
        <div>
          <div style={{
            background: DARK.card, borderRadius: "12px", padding: "20px",
            border: `1px solid ${selected.color}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "1.6rem" }}>{selected.icon}</span>
              <div>
                <h3 style={{ margin: 0, color: selected.color, fontSize: "1.1rem" }}>{selected.label}</h3>
                <code style={{ color: DARK.muted, fontSize: "0.8rem", fontFamily: "monospace" }}>{selected.path}</code>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "10px", marginBottom: "16px" }}>
              {[
                ["Namespace / Access", selected.namespace],
                ["Invocation", selected.invocation],
                ["Security Model", selected.security],
              ].map(([k, v]) => (
                <div key={k} style={{ background: DARK.panel, borderRadius: "8px", padding: "10px", border: `1px solid ${DARK.border}` }}>
                  <div style={{ color: DARK.muted, fontSize: "0.73rem", marginBottom: "4px" }}>{k}</div>
                  <div style={{ color: DARK.text, fontSize: "0.82rem" }}>{v}</div>
                </div>
              ))}
            </div>

            <p style={{ color: DARK.text, fontSize: "0.85rem", marginBottom: "14px" }}>{selected.description}</p>

            <div style={{ background: "#0d1117", borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <div style={{ color: DARK.muted, fontSize: "0.73rem", marginBottom: "6px" }}>EXAMPLE</div>
              <pre style={{ margin: 0, fontFamily: "monospace", fontSize: "0.78rem", color: DARK.green, whiteSpace: "pre-wrap" }}>
                {selected.example}
              </pre>
            </div>

            <div>
              <div style={{ color: DARK.muted, fontSize: "0.73rem", marginBottom: "8px" }}>KEY NOTES</div>
              <ul style={{ margin: 0, padding: "0 0 0 16px" }}>
                {selected.notes.map((n, i) => (
                  <li key={i} style={{ color: DARK.text, fontSize: "0.82rem", marginBottom: "4px" }}>{n}</li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", marginTop: "12px", flexWrap: "wrap" }}>
            {COMPONENTS.map(c => (
              <button key={c.id} onClick={() => setSelected(c)} style={{
                padding: "4px 10px", borderRadius: "6px", border: "1px solid",
                borderColor: selected.id === c.id ? c.color : DARK.border,
                background: "transparent",
                color: selected.id === c.id ? c.color : DARK.muted,
                cursor: "pointer", fontSize: "0.75rem",
              }}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "env-vars" && (
        <div>
          <div style={{ background: DARK.card, borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 16px", color: DARK.accent, fontSize: "1rem" }}>Plugin Environment Variables</h3>
            {ENV_VARS.map(v => (
              <div key={v.name} style={{
                borderBottom: `1px solid ${DARK.border}`, padding: "14px 0",
                display: "grid", gridTemplateColumns: "280px 1fr", gap: "16px", alignItems: "start",
              }}>
                <div>
                  <code style={{ color: v.safe ? DARK.green : DARK.red, fontFamily: "monospace", fontSize: "0.82rem" }}>
                    {v.name}
                  </code>
                  <div style={{ fontSize: "0.7rem", marginTop: "4px", color: v.safe ? DARK.green : DARK.red }}>
                    {v.safe ? "✓ Safe to use" : "⚠ Read-only — do not write here"}
                  </div>
                </div>
                <div style={{ color: DARK.text, fontSize: "0.82rem" }}>{v.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ background: DARK.card, borderRadius: "12px", padding: "20px", marginTop: "16px" }}>
            <h3 style={{ margin: "0 0 10px", color: DARK.accent, fontSize: "1rem" }}>Key Principle</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ background: "rgba(248,113,113,0.08)", border: `1px solid ${DARK.red}`, borderRadius: "8px", padding: "14px" }}>
                <div style={{ color: DARK.red, fontWeight: 600, marginBottom: "6px" }}>❌ CLAUDE_PLUGIN_ROOT</div>
                <div style={{ color: DARK.muted, fontSize: "0.82rem" }}>Installation directory — changes on every plugin update. Never write files here. Only use for reading your plugin's own bundled files.</div>
              </div>
              <div style={{ background: "rgba(57,211,83,0.08)", border: `1px solid ${DARK.green}`, borderRadius: "8px", padding: "14px" }}>
                <div style={{ color: DARK.green, fontWeight: 600, marginBottom: "6px" }}>✓ CLAUDE_PLUGIN_DATA</div>
                <div style={{ color: DARK.muted, fontSize: "0.82rem" }}>Persistent data directory — survives updates. Use for node_modules, databases, caches, generated files, anything mutable.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "install" && (
        <div>
          <div style={{ background: DARK.card, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 16px", color: DARK.accent, fontSize: "1rem" }}>Installation Scopes</h3>
            {INSTALL_SCOPES.map(s => (
              <div key={s.scope} style={{
                borderBottom: `1px solid ${DARK.border}`, padding: "12px 0",
                display: "grid", gridTemplateColumns: "80px 1fr 1fr", gap: "16px", alignItems: "start",
              }}>
                <span style={{ color: DARK.accent, fontWeight: 600, fontSize: "0.88rem", textTransform: "uppercase" }}>{s.scope}</span>
                <code style={{ color: DARK.blue, fontFamily: "monospace", fontSize: "0.78rem" }}>{s.file}</code>
                <span style={{ color: DARK.muted, fontSize: "0.82rem" }}>{s.desc}</span>
              </div>
            ))}
          </div>

          <div style={{ background: DARK.card, borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 12px", color: DARK.accent, fontSize: "1rem" }}>Install Commands</h3>
            <pre style={{ background: "#0d1117", borderRadius: "8px", padding: "14px", margin: 0, fontFamily: "monospace", fontSize: "0.82rem", color: DARK.green, lineHeight: 1.8 }}>
{`# Install from npm (user scope by default)
claude plugin install my-plugin

# Install from local path
claude plugin install ./path/to/my-plugin

# Install to project scope (shared via git)
claude plugin install my-plugin --scope project

# Install to local scope (gitignored)
claude plugin install my-plugin --scope local

# List all installed plugins
claude plugin list

# Remove a plugin
claude plugin remove my-plugin

# Install specific version
claude plugin install my-plugin@2.1.0`}
            </pre>
          </div>
        </div>
      )}

      <div style={{ marginTop: "20px", fontSize: "0.75rem", color: DARK.muted, textAlign: "center" }}>
        Claude Code v2.1.126 · May 2026 · code.claude.com/docs/en/plugins
      </div>
    </div>
  );
}
