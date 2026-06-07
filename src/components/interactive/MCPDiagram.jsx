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
  greenBg: "rgba(0,212,106,0.08)",
  greenBorder: "rgba(0,212,106,0.25)",
  blue: "#60A5FA",
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
  yellow: "#FBBF24",
  yellowBg: "rgba(251,191,36,0.08)",
  yellowBorder: "rgba(251,146,60,0.25)",
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

function Tag({ children, color = C.blue }) {
  return (
    <span style={{
      ...mono, fontSize: 11, fontWeight: 600, color,
      background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: 5, padding: "2px 7px",
    }}>{children}</span>
  );
}

function Box({ title, subtitle, items, color, icon }) {
  return (
    <div style={{
      background: `${color}0a`, border: `1.5px solid ${color}40`,
      borderRadius: 12, padding: "16px 18px", flex: 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        {icon && <span style={{ fontSize: 18 }}>{icon}</span>}
        <div>
          <div style={{ ...sans, fontSize: 14, fontWeight: 800, color }}>{title}</div>
          {subtitle && <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      {items && items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, marginTop: 5, flexShrink: 0 }} />
          <div style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{item}</div>
        </div>
      ))}
    </div>
  );
}

// ── Architecture Tab ────────────────────────────────────────────────
function ArchitectureTab() {
  const [highlight, setHighlight] = useState(null);

  const layers = [
    {
      id: "host",
      label: "Host Application",
      sublabel: "Claude Code",
      color: C.blue,
      desc: "The AI application. Contains the MCP client and manages all server connections.",
      details: [
        "Manages lifecycle of all MCP server connections",
        "Exposes MCP tools to Claude as additional capabilities",
        "Routes tool calls to appropriate servers",
        "Handles auth, retries, and error recovery",
      ],
    },
    {
      id: "client",
      label: "MCP Client",
      sublabel: "Built into Claude Code",
      color: C.cyan,
      desc: "One client instance per server. Handles JSON-RPC 2.0 message framing.",
      details: [
        "One client per server (1:1 relationship)",
        "Speaks JSON-RPC 2.0 over the chosen transport",
        "Discovers server capabilities on connect",
        "Manages tool/resource/prompt schemas",
      ],
    },
    {
      id: "protocol",
      label: "JSON-RPC 2.0",
      sublabel: "Over stdio · HTTP · (SSE deprecated)",
      color: C.yellow,
      desc: "The wire protocol. Every message is a JSON object with method, params, id.",
      details: [
        "Request: { jsonrpc:'2.0', id, method, params }",
        "Response: { jsonrpc:'2.0', id, result|error }",
        "Notification: { jsonrpc:'2.0', method, params } (no id, no response)",
        "Bidirectional — server can also call client methods",
      ],
    },
    {
      id: "server",
      label: "MCP Server",
      sublabel: "Your code · any language",
      color: C.green,
      desc: "Implements the MCP spec. Exposes Tools, Resources, and Prompts.",
      details: [
        "Any language: TypeScript, Python, C#, Go, Rust, …",
        "Can be a local process (stdio) or remote service (HTTP)",
        "Connects to databases, APIs, file systems, cloud services",
        "Official SDK available: @modelcontextprotocol/sdk, mcp (Python), ModelContextProtocol (.NET)",
      ],
    },
  ];

  return (
    <div>
      <SectionTitle color={C.blue} subtitle="How Claude Code connects to MCP servers via the JSON-RPC 2.0 protocol">
        MCP Architecture Overview
      </SectionTitle>

      {/* Stack diagram */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0, marginBottom: 28 }}>
        {layers.map((layer, i) => (
          <div key={layer.id} style={{ width: "100%", maxWidth: 640 }}>
            <div
              onClick={() => setHighlight(highlight === layer.id ? null : layer.id)}
              style={{
                background: highlight === layer.id ? `${layer.color}18` : C.card,
                border: `1.5px solid ${highlight === layer.id ? layer.color + "70" : C.border}`,
                borderRadius: 12, padding: "16px 20px", cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ ...sans, fontSize: 15, fontWeight: 800, color: layer.color }}>{layer.label}</div>
                  <div style={{ ...sans, fontSize: 12, color: C.textDim, marginTop: 2 }}>{layer.sublabel}</div>
                </div>
                <div style={{ ...sans, fontSize: 12, color: C.textSoft, maxWidth: 280, textAlign: "right" }}>{layer.desc}</div>
              </div>
              {highlight === layer.id && (
                <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {layer.details.map((d, j) => (
                    <div key={j} style={{ ...sans, fontSize: 11, color: C.textSoft, background: `${layer.color}0a`, border: `1px solid ${layer.color}20`, borderRadius: 6, padding: "4px 10px" }}>
                      {d}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {i < layers.length - 1 && (
              <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ width: 2, height: 14, background: C.borderLight }} />
                  <div style={{ fontSize: 12, color: C.textDim }}>▼</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Supported hosts */}
      <div style={{ marginTop: 8 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          MCP is supported by these hosts (as of June 2026)
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["Claude Code", "Claude Desktop", "VS Code (Copilot)", "Cursor", "Windsurf", "GitHub Copilot", "Gemini CLI", "ChatGPT (beta)", "Zed Editor", "Continue.dev"].map(h => (
            <Tag key={h} color={C.blue}>{h}</Tag>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Primitives Tab ──────────────────────────────────────────────────
const PRIMITIVES = [
  {
    name: "Tools",
    color: C.orange,
    icon: "⚙️",
    desc: "Callable functions that Claude can invoke. Defined with a name, description, and JSON Schema input validation. The core primitive — most MCP servers are tool collections.",
    useCases: ["Execute database queries", "Call REST APIs", "Read/write files", "Run shell commands", "Trigger webhooks"],
    example: `// TypeScript MCP server — tool definition
server.tool(
  "query_database",
  "Run a SQL SELECT query (read-only)",
  {
    query: z.string().describe("SQL SELECT statement"),
    limit: z.number().default(100),
  },
  async ({ query, limit }) => {
    const rows = await db.query(query + \` LIMIT \${limit}\`);
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  }
);`,
  },
  {
    name: "Resources",
    color: C.purple,
    icon: "📂",
    desc: "Data sources with URI patterns. Expose files, database records, or any structured data for Claude to read. Resources are discoverable — Claude can list and read them by URI.",
    useCases: ["Expose log files", "Share database schemas", "Serve config documents", "Provide live metrics dashboards", "Stream API responses"],
    example: `// Resource with URI template
server.resource(
  "log-file",
  new ResourceTemplate("logs://{filename}", { list: undefined }),
  async (uri) => {
    const filename = uri.pathname.slice(1);
    const content = await fs.readFile(\`/var/log/\${filename}\`, "utf-8");
    return {
      contents: [{ uri: uri.href, mimeType: "text/plain", text: content }]
    };
  }
);`,
  },
  {
    name: "Prompts",
    color: C.cyan,
    icon: "💬",
    desc: "Reusable prompt templates with parameterised arguments. The server defines a prompt shape; Claude fills in the arguments at runtime. Useful for enforcing consistent task patterns.",
    useCases: ["Standardised code review format", "Bug report templates", "API documentation generation", "Security audit checklists", "Commit message generation"],
    example: `// Prompt template with arguments
server.prompt(
  "code-review",
  "Structured code review with security focus",
  [
    { name: "language", description: "Programming language", required: true },
    { name: "focus", description: "Review focus area", required: false },
  ],
  async ({ language, focus }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: \`Review this \${language} code for \${focus ?? "general quality"}. Check: security, performance, readability, edge cases.\`
      }
    }]
  })
);`,
  },
];

function PrimitivesTab() {
  const [selected, setSelected] = useState("Tools");
  const active = PRIMITIVES.find(p => p.name === selected);

  return (
    <div>
      <SectionTitle color={C.orange} subtitle="Three building blocks every MCP server can expose">
        MCP Primitives
      </SectionTitle>

      {/* Selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {PRIMITIVES.map(p => (
          <button
            key={p.name}
            onClick={() => setSelected(p.name)}
            style={{
              ...sans, fontSize: 14, fontWeight: 700, cursor: "pointer",
              padding: "10px 20px", borderRadius: 10,
              background: selected === p.name ? `${p.color}18` : C.card,
              border: `1.5px solid ${selected === p.name ? p.color + "60" : C.border}`,
              color: selected === p.name ? p.color : C.textSoft,
              transition: "all 0.15s",
            }}
          >
            {p.icon} {p.name}
          </button>
        ))}
      </div>

      {active && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 300px" }}>
            <div style={{
              background: `${active.color}0a`, border: `1.5px solid ${active.color}40`,
              borderRadius: 12, padding: 20, marginBottom: 16,
            }}>
              <div style={{ ...sans, fontSize: 15, fontWeight: 700, color: active.color, marginBottom: 10 }}>What it does</div>
              <p style={{ ...sans, fontSize: 14, color: C.text, lineHeight: 1.7, margin: 0 }}>{active.desc}</p>
            </div>
            <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Common use cases</div>
            {active.useCases.map((uc, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: active.color, marginTop: 6, flexShrink: 0 }} />
                <div style={{ ...sans, fontSize: 13, color: C.textSoft }}>{uc}</div>
              </div>
            ))}
          </div>
          <div style={{ flex: "2 1 400px" }}>
            <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>TypeScript example</div>
            <pre style={{
              ...mono, fontSize: 12, color: C.text,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: 16, margin: 0, overflowX: "auto", lineHeight: 1.6,
            }}>
              {active.example}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Transports Tab ──────────────────────────────────────────────────
const TRANSPORTS = [
  {
    name: "stdio",
    label: "stdio (Standard I/O)",
    status: "Recommended",
    statusColor: C.green,
    color: C.green,
    when: "Local process on the same machine as Claude Code",
    pros: ["Zero network config", "Secure by default (no open ports)", "Simplest setup", "Works everywhere"],
    cons: ["Local only — can't share across machines", "One server per process"],
    config: `// .mcp.json — stdio server
{
  "mcpServers": {
    "my-server": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/my-server/index.js"],
      "env": {
        "DB_URL": "\${DATABASE_URL}",
        "API_KEY": "\${MY_API_KEY}"
      }
    }
  }
}`,
  },
  {
    name: "http",
    label: "HTTP (Streamable HTTP)",
    status: "Current",
    statusColor: C.blue,
    color: C.blue,
    when: "Remote server, shared team server, or cloud-hosted MCP service",
    pros: ["Works across machines and networks", "Shareable — one server, many users", "Supports authentication headers", "Scalable"],
    cons: ["Requires network access", "Needs auth configuration", "Higher latency than stdio"],
    config: `// .mcp.json — HTTP server
{
  "mcpServers": {
    "remote-server": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer \${MCP_API_TOKEN}"
      }
    }
  }
}`,
  },
  {
    name: "sse",
    label: "SSE (Server-Sent Events)",
    status: "Deprecated",
    statusColor: C.red,
    color: C.textDim,
    when: "Legacy — do not use for new implementations",
    pros: ["Was useful for streaming responses"],
    cons: ["Deprecated in MCP spec 1.1", "Replaced by HTTP streaming", "No new server should implement this"],
    config: `// .mcp.json — SSE (deprecated — migrate to http)
{
  "mcpServers": {
    "old-server": {
      "type": "sse",
      "url": "https://mcp.example.com/sse"
    }
  }
}`,
  },
];

function TransportsTab() {
  const [selected, setSelected] = useState("stdio");
  const active = TRANSPORTS.find(t => t.name === selected);

  return (
    <div>
      <SectionTitle color={C.cyan} subtitle="Three transport mechanisms for MCP communication. Use stdio for local, HTTP for remote.">
        Transport Types
      </SectionTitle>

      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {TRANSPORTS.map(t => (
          <button
            key={t.name}
            onClick={() => setSelected(t.name)}
            style={{
              ...sans, fontSize: 13, fontWeight: 700, cursor: "pointer",
              padding: "10px 18px", borderRadius: 10,
              background: selected === t.name ? `${t.color}18` : C.card,
              border: `1.5px solid ${selected === t.name ? t.color + "60" : C.border}`,
              color: selected === t.name ? t.color : C.textSoft,
              transition: "all 0.15s",
            }}
          >
            {t.label}
            <span style={{ marginLeft: 8, ...sans, fontSize: 10, fontWeight: 700, color: t.statusColor, background: `${t.statusColor}18`, border: `1px solid ${t.statusColor}40`, borderRadius: 4, padding: "1px 5px" }}>
              {t.status}
            </span>
          </button>
        ))}
      </div>

      {active && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <div style={{ ...sans, fontSize: 13, color: C.textDim, marginBottom: 14 }}>
              <strong style={{ color: C.textSoft }}>Best for:</strong> {active.when}
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ ...sans, fontSize: 12, color: C.green, fontWeight: 700, marginBottom: 8 }}>✓ Pros</div>
              {active.pros.map((p, i) => (
                <div key={i} style={{ ...sans, fontSize: 12, color: C.textSoft, marginBottom: 5 }}>• {p}</div>
              ))}
            </div>
            <div>
              <div style={{ ...sans, fontSize: 12, color: C.red, fontWeight: 700, marginBottom: 8 }}>✗ Cons</div>
              {active.cons.map((c, i) => (
                <div key={i} style={{ ...sans, fontSize: 12, color: C.textSoft, marginBottom: 5 }}>• {c}</div>
              ))}
            </div>
          </div>
          <div style={{ flex: "2 1 380px" }}>
            <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              .mcp.json configuration
            </div>
            <pre style={{
              ...mono, fontSize: 12, color: C.text,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: 16, margin: 0, overflowX: "auto", lineHeight: 1.6,
            }}>
              {active.config}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Configuration Scopes ────────────────────────────────────────────
const CONFIG_SCOPES = [
  {
    scope: "Project",
    file: ".mcp.json",
    color: C.blue,
    who: "All project contributors",
    desc: "Commit to version control. Shared across the whole team.",
    locked: false,
    example: `// .mcp.json (commit to git)
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": { "DATABASE_URL": "\${DATABASE_URL}" }
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "\${GITHUB_TOKEN}" }
    }
  }
}`,
  },
  {
    scope: "User",
    file: "~/.claude/mcp.json",
    color: C.purple,
    who: "Your personal servers (all projects)",
    desc: "Global personal config. Loaded for every project you open.",
    locked: false,
    example: `// ~/.claude/mcp.json (personal — not committed)
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/home/user"]
    },
    "slack": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-slack"],
      "env": { "SLACK_TOKEN": "\${SLACK_BOT_TOKEN}" }
    }
  }
}`,
  },
  {
    scope: "Local",
    file: ".claude/mcp.local.json",
    color: C.green,
    who: "Project + machine specific",
    desc: "Add to .gitignore. Local credentials that shouldn't be committed.",
    locked: false,
    example: `// .claude/mcp.local.json (gitignore this)
{
  "mcpServers": {
    "local-db": {
      "type": "stdio",
      "command": "node",
      "args": ["./scripts/db-server.js"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_PASS": "\${MY_LOCAL_DB_PASSWORD}"
      }
    }
  }
}`,
  },
  {
    scope: "Enterprise",
    file: "managed-mcp.json",
    color: C.red,
    who: "All users in the organisation",
    desc: "Managed by IT/security. Users cannot override or remove these servers.",
    locked: true,
    example: `// /Library/Application Support/ClaudeCode/managed-mcp.json
// (macOS — set by MDM; users cannot modify)
{
  "mcpServers": {
    "audit-server": {
      "type": "http",
      "url": "https://mcp-audit.corp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer \${CORP_MCP_TOKEN}"
      }
    },
    "jira": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-jira"],
      "env": { "JIRA_URL": "https://corp.atlassian.net" }
    }
  }
}`,
  },
];

function ConfigScopesTab() {
  const [selected, setSelected] = useState("Project");
  const active = CONFIG_SCOPES.find(s => s.scope === selected);

  return (
    <div>
      <SectionTitle color={C.purple} subtitle="Four configuration levels — from project-wide to enterprise-managed">
        Configuration Scopes
      </SectionTitle>

      {/* Scope selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        {CONFIG_SCOPES.map(s => (
          <button
            key={s.scope}
            onClick={() => setSelected(s.scope)}
            style={{
              ...sans, fontSize: 13, fontWeight: 700, cursor: "pointer",
              padding: "10px 18px", borderRadius: 10,
              background: selected === s.scope ? `${s.color}18` : C.card,
              border: `1.5px solid ${selected === s.scope ? s.color + "60" : C.border}`,
              color: selected === s.scope ? s.color : C.textSoft,
              transition: "all 0.15s",
            }}
          >
            {s.scope}
            {s.locked && <span style={{ marginLeft: 6, fontSize: 12 }}>🔒</span>}
          </button>
        ))}
      </div>

      {active && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 240px" }}>
            <div style={{ background: `${active.color}0a`, border: `1.5px solid ${active.color}40`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
              <div style={{ ...mono, fontSize: 13, color: active.color, marginBottom: 6 }}>{active.file}</div>
              <div style={{ ...sans, fontSize: 12, color: C.textSoft, marginBottom: 8 }}>{active.desc}</div>
              <div style={{ ...sans, fontSize: 12, color: C.textDim }}>
                <strong style={{ color: C.textSoft }}>Who:</strong> {active.who}
              </div>
              {active.locked && (
                <div style={{ marginTop: 10, ...sans, fontSize: 11, color: C.red, background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 6, padding: "6px 10px" }}>
                  🔒 Managed — users cannot override or remove these server definitions
                </div>
              )}
            </div>

            {/* Precedence reminder */}
            <div style={{ ...sans, fontSize: 11, color: C.textDim, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 700, color: C.textSoft, marginBottom: 6 }}>Precedence (highest → lowest)</div>
              {["Enterprise (managed-mcp.json)", "Project (.mcp.json)", "User (~/.claude/mcp.json)", "Local (.claude/mcp.local.json)"].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4, opacity: active.scope === item.split(" ")[0] ? 1 : 0.5 }}>
                  <span style={{ color: i === 0 ? C.red : i === 1 ? C.blue : i === 2 ? C.purple : C.green }}>{i + 1}.</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ flex: "2 1 380px" }}>
            <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Example configuration
            </div>
            <pre style={{
              ...mono, fontSize: 12, color: C.text,
              background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 8, padding: 16, margin: 0, overflowX: "auto", lineHeight: 1.6,
            }}>
              {active.example}
            </pre>
          </div>
        </div>
      )}

      {/* Official servers */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle color={C.green} subtitle="Install with: npx @modelcontextprotocol/server-<name>">
          Official MCP Servers
        </SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {[
            { name: "filesystem", desc: "Read/write local files with path restrictions" },
            { name: "postgres", desc: "Read-only PostgreSQL queries and schema inspection" },
            { name: "sqlite", desc: "SQLite database read/write with query support" },
            { name: "github", desc: "Repos, PRs, issues, files — full GitHub API" },
            { name: "gitlab", desc: "GitLab repositories, MRs, issues" },
            { name: "google-drive", desc: "List, read, search Google Drive files" },
            { name: "slack", desc: "Read channels, send messages, search history" },
            { name: "puppeteer", desc: "Browser automation and web scraping" },
            { name: "brave-search", desc: "Web and local search via Brave API" },
            { name: "fetch", desc: "HTTP fetch with Markdown conversion" },
            { name: "memory", desc: "Knowledge graph-based persistent memory" },
            { name: "sequentialthinking", desc: "Dynamic multi-step reasoning tool" },
          ].map(s => (
            <div key={s.name} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ ...mono, fontSize: 12, color: C.green, marginBottom: 4 }}>server-{s.name}</div>
              <div style={{ ...sans, fontSize: 11, color: C.textSoft }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
const TABS = [
  { id: "arch", label: "Architecture", color: C.blue },
  { id: "primitives", label: "Primitives", color: C.orange },
  { id: "transports", label: "Transports", color: C.cyan },
  { id: "config", label: "Configuration", color: C.purple },
];

export default function MCPDiagram() {
  const [tab, setTab] = useState("arch");

  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: "28px 24px", fontFamily: sans.fontFamily, color: C.text, minHeight: 500 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ ...sans, fontSize: 24, fontWeight: 800, color: C.white, margin: 0, letterSpacing: -0.5 }}>
            Model Context Protocol (MCP)
          </h1>
          <p style={{ ...sans, fontSize: 13, color: C.textDim, margin: "6px 0 0" }}>
            Architecture · Primitives · Transports · Configuration · Official Servers · MCP Spec 1.1
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ ...mono, fontSize: 11, color: C.green, background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 5, padding: "2px 7px" }}>MCP Spec 1.1</span>
          <span style={{ ...mono, fontSize: 11, color: C.textDim, background: "#ffffff08", border: `1px solid ${C.border}`, borderRadius: 5, padding: "2px 7px" }}>v2.1.126</span>
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

      {tab === "arch" && <ArchitectureTab />}
      {tab === "primitives" && <PrimitivesTab />}
      {tab === "transports" && <TransportsTab />}
      {tab === "config" && <ConfigScopesTab />}
    </div>
  );
}
