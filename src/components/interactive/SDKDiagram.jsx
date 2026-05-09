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
  yellowBorder: "rgba(251,191,36,0.25)",
};

const mono = { fontFamily: "'JetBrains Mono','Fira Code','SF Mono',Consolas,monospace" };
const sans = { fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" };

// ── Shared primitives ─────────────────────────────────────────────

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

function NavTab({ label, active, onClick, color = C.blue }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...sans, fontSize: 13, fontWeight: active ? 700 : 500,
        color: active ? color : C.textSoft,
        background: active ? `${color}15` : "transparent",
        border: `1.5px solid ${active ? color : "transparent"}`,
        borderRadius: 8, padding: "7px 16px",
        cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s",
      }}
    >{label}</button>
  );
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ position: "relative" }}>
      <pre style={{
        ...mono, fontSize: 12, lineHeight: 1.75,
        background: "#0a0e14", border: `1px solid ${C.border}`,
        borderRadius: 8, padding: "14px 16px",
        margin: 0, overflow: "auto", color: C.textSoft, whiteSpace: "pre",
      }}>{code}</pre>
      <button
        onClick={copy}
        style={{
          position: "absolute", top: 8, right: 8,
          ...sans, fontSize: 11, fontWeight: 600,
          background: copied ? C.greenBg : C.card,
          color: copied ? C.green : C.textDim,
          border: `1px solid ${copied ? C.green : C.border}`,
          borderRadius: 5, padding: "3px 10px", cursor: "pointer",
        }}
      >{copied ? "Copied" : "Copy"}</button>
    </div>
  );
}

// ── Architecture Diagram ──────────────────────────────────────────

const ARCH_LAYERS = [
  {
    label: "Your Application",
    color: C.blue,
    icon: "🖥",
    items: ["Python / TypeScript / any language", "Constructs prompt + options", "Consumes JSON event stream"],
  },
  {
    label: "Agent SDK",
    color: C.purple,
    icon: "📦",
    items: ["query() / StatefulClient", "Manages subprocess lifecycle", "Parses newline-delimited JSON"],
  },
  {
    label: "Claude Code CLI",
    color: C.cyan,
    icon: "⚙️",
    items: ["subprocess: claude --output-format stream-json", "Agentic loop (read → tool → observe)", "Exits 0 on success, non-zero on error"],
  },
  {
    label: "Anthropic API / Cloud",
    color: C.green,
    icon: "☁️",
    items: ["api.anthropic.com  ·  AWS Bedrock  ·  GCP Vertex", "Streams tokens back to CLI", "Tool calls dispatched inside loop"],
  },
];

function Architecture() {
  const [active, setActive] = useState(null);
  return (
    <div>
      <SectionTitle color={C.blue} subtitle="Subprocess model — your app owns the process, SDK owns the protocol">
        Subprocess Architecture
      </SectionTitle>

      {/* Stack diagram */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 20 }}>
        {ARCH_LAYERS.map((layer, i) => (
          <React.Fragment key={layer.label}>
            <button
              onClick={() => setActive(active === i ? null : i)}
              style={{
                background: active === i ? `${layer.color}18` : C.card,
                border: `2px solid ${active === i ? layer.color : C.border}`,
                borderRadius: 10, padding: "14px 18px",
                cursor: "pointer", textAlign: "left", width: "100%",
                display: "flex", alignItems: "center", gap: 14,
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 22 }}>{layer.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ ...sans, fontSize: 14, fontWeight: 800, color: layer.color }}>{layer.label}</div>
                {active !== i && (
                  <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 2 }}>
                    {layer.items[0]}
                  </div>
                )}
              </div>
              <span style={{ color: C.textDim, fontSize: 12 }}>{active === i ? "▲" : "▼"}</span>
            </button>
            {active === i && (
              <div style={{
                background: `${layer.color}08`, border: `1px solid ${layer.color}30`,
                borderRadius: 8, padding: "12px 18px", marginLeft: 8,
              }}>
                {layer.items.map((item, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: j > 0 ? 8 : 0 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: layer.color, marginTop: 5, flexShrink: 0 }} />
                    <span style={{ ...sans, fontSize: 13, color: C.textSoft, lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
            {i < ARCH_LAYERS.length - 1 && (
              <div style={{ textAlign: "center", color: C.textDim, fontSize: 18, lineHeight: 1 }}>↕</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Data flow note */}
      <div style={{
        background: C.blueBg, border: `1px solid ${C.blue}30`,
        borderRadius: 10, padding: "14px 18px",
      }}>
        <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: C.blue, marginBottom: 6 }}>Data Flow</div>
        <div style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.7 }}>
          App → SDK <code style={mono}>query(prompt, options)</code> → CLI subprocess
          (<code style={mono}>--output-format stream-json --print</code>) →
          newline-delimited JSON events → SDK yields typed event objects → App processes results.
        </div>
      </div>
    </div>
  );
}

// ── Event Types ───────────────────────────────────────────────────

const EVENTS = [
  {
    type: "system",
    color: C.yellow,
    icon: "🔧",
    desc: "Emitted once at the start of the stream. Contains SDK metadata.",
    fields: [
      { name: "type",       val: '"system"',     desc: "Always \"system\"" },
      { name: "subtype",    val: '"init"',        desc: "Currently always \"init\"" },
      { name: "session_id", val: "string",        desc: "Unique ID for this invocation" },
      { name: "tools",      val: "string[]",      desc: "Tool names available in this session" },
      { name: "model",      val: "string",        desc: "Model ID resolved for this run" },
    ],
    example: `{"type":"system","subtype":"init",
  "session_id":"sess_01XyzAbc",
  "tools":["Bash","Read","Write"],
  "model":"claude-opus-4-5-20251101-v1:0"}`,
  },
  {
    type: "assistant",
    color: C.blue,
    icon: "🤖",
    desc: "One event per model turn. Contains the full message with text and/or tool_use blocks.",
    fields: [
      { name: "type",    val: '"assistant"',  desc: "Always \"assistant\"" },
      { name: "message", val: "Message",      desc: "Anthropic Message object" },
      { name: "message.role",    val: '"assistant"', desc: "" },
      { name: "message.content", val: "Block[]",     desc: "TextBlock | ToolUseBlock[]" },
    ],
    example: `{"type":"assistant","message":{
  "role":"assistant",
  "content":[
    {"type":"text","text":"I'll read the file first."},
    {"type":"tool_use","id":"tu_01","name":"Read",
     "input":{"file_path":"src/main.py"}}
  ]}}`,
  },
  {
    type: "tool_result",
    color: C.cyan,
    icon: "🔩",
    desc: "One event per tool invocation result. Emitted after the CLI executes each tool.",
    fields: [
      { name: "type",        val: '"tool_result"', desc: "Always \"tool_result\"" },
      { name: "tool_use_id", val: "string",        desc: "Matches ToolUseBlock.id" },
      { name: "content",     val: "string",        desc: "Raw stdout/result from the tool" },
      { name: "is_error",    val: "boolean",       desc: "True if the tool raised an error" },
    ],
    example: `{"type":"tool_result",
  "tool_use_id":"tu_01",
  "content":"def main():\\n    print(\\"hello\\")",
  "is_error":false}`,
  },
  {
    type: "result",
    color: C.green,
    icon: "✅",
    desc: "Final event. Summarises the completed run — cost, turns, and text output.",
    fields: [
      { name: "type",            val: '"result"',  desc: "Always \"result\"" },
      { name: "subtype",         val: '"success" | "error_max_turns" | "error_during_execution"', desc: "" },
      { name: "result",          val: "string",    desc: "Final text output from Claude" },
      { name: "session_id",      val: "string",    desc: "Same as system init session_id" },
      { name: "total_cost_usd",  val: "number",    desc: "Accumulated cost in USD" },
      { name: "num_turns",       val: "number",    desc: "Number of agentic loop iterations" },
      { name: "usage",           val: "Usage",     desc: "input_tokens, output_tokens, cache hits" },
    ],
    example: `{"type":"result","subtype":"success",
  "result":"Added error handling to main().",
  "session_id":"sess_01XyzAbc",
  "total_cost_usd":0.0034,
  "num_turns":3,
  "usage":{"input_tokens":1820,"output_tokens":312}}`,
  },
  {
    type: "error",
    color: C.red,
    icon: "❌",
    desc: "Emitted when a fatal error occurs before the result event (e.g. auth failure, invalid options).",
    fields: [
      { name: "type",    val: '"error"',  desc: "Always \"error\"" },
      { name: "error",   val: "string",  desc: "Human-readable error message" },
      { name: "code",    val: "string",  desc: "Machine-readable error code" },
    ],
    example: `{"type":"error",
  "error":"Authentication failed: invalid API key",
  "code":"authentication_error"}`,
  },
];

function EventTypes() {
  const [active, setActive] = useState("system");
  const ev = EVENTS.find(e => e.type === active);
  return (
    <div>
      <SectionTitle color={C.cyan} subtitle="Newline-delimited JSON — one object per line on stdout">
        SDK Event Types
      </SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {EVENTS.map(e => (
          <NavTab key={e.type} label={`${e.icon} ${e.type}`} active={active === e.type} color={e.color} onClick={() => setActive(e.type)} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Field reference */}
        <div>
          <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>
            Fields
          </div>
          <p style={{ ...sans, fontSize: 13, color: C.textSoft, marginBottom: 12, lineHeight: 1.6 }}>{ev.desc}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ev.fields.map((f, i) => (
              <div key={i} style={{
                background: `${ev.color}08`, border: `1px solid ${ev.color}20`,
                borderRadius: 8, padding: "8px 12px",
                display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <code style={{ ...mono, fontSize: 11, color: ev.color, minWidth: 120, flexShrink: 0 }}>{f.name}</code>
                <div>
                  <code style={{ ...mono, fontSize: 11, color: C.textSoft }}>{f.val}</code>
                  {f.desc && <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 2 }}>{f.desc}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example JSON */}
        <div>
          <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 10 }}>
            Example
          </div>
          <CodeBlock code={ev.example} />
        </div>
      </div>
    </div>
  );
}

// ── Python Examples ───────────────────────────────────────────────

const PY_EXAMPLES = {
  basic: {
    label: "Basic query()",
    color: C.blue,
    code: `import asyncio
from claude_code_sdk import query, ClaudeCodeOptions

async def main():
    options = ClaudeCodeOptions(
        max_turns=10,
        allowed_tools=["Read", "Write", "Bash"],
    )
    async for event in query(
        prompt="Refactor src/utils.py to use dataclasses",
        options=options,
    ):
        if event.type == "assistant":
            for block in event.message.content:
                if block.type == "text":
                    print(block.text)
        elif event.type == "result":
            print(f"Done — {event.num_turns} turns, \${event.total_cost_usd:.4f}")

asyncio.run(main())`,
  },
  stateful: {
    label: "StatefulClient multi-turn",
    color: C.purple,
    code: `import asyncio
from claude_code_sdk import StatefulClient, ClaudeCodeOptions

async def main():
    options = ClaudeCodeOptions(max_turns=5, allowed_tools=["Read"])

    async with StatefulClient(options=options) as client:
        # Turn 1 — ask a question
        async for event in client.query("List all public functions in src/"):
            if event.type == "result":
                print("Turn 1:", event.result)

        # Turn 2 — follow-up in the same session (context preserved)
        async for event in client.query("Which ones lack docstrings?"):
            if event.type == "result":
                print("Turn 2:", event.result)

        print("Session ID:", client.session_id)

asyncio.run(main())`,
  },
  parallel: {
    label: "Parallel sessions",
    color: C.cyan,
    code: `import asyncio
from claude_code_sdk import query, ClaudeCodeOptions

FILES = ["src/auth.py", "src/db.py", "src/api.py"]

async def review_file(path: str) -> str:
    opts = ClaudeCodeOptions(max_turns=5, allowed_tools=["Read"])
    async for event in query(
        prompt=f"Review {path} for security issues. Be concise.",
        options=opts,
    ):
        if event.type == "result":
            return f"## {path}\\n{event.result}"
    return ""

async def main():
    # Run all reviews concurrently
    results = await asyncio.gather(*[review_file(f) for f in FILES])
    print("\\n\\n".join(results))

asyncio.run(main())`,
  },
};

function PythonExamples() {
  const [active, setActive] = useState("basic");
  const ex = PY_EXAMPLES[active];
  return (
    <div>
      <SectionTitle color={C.purple} subtitle="claude-code-sdk · Python ≥ 3.10  ·  pip install claude-code-sdk">
        Python — StatefulClient Patterns
      </SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(PY_EXAMPLES).map(([key, e]) => (
          <NavTab key={key} label={e.label} active={active === key} color={e.color} onClick={() => setActive(key)} />
        ))}
      </div>
      <CodeBlock code={ex.code} />
    </div>
  );
}

// ── TypeScript Examples ───────────────────────────────────────────

const TS_EXAMPLES = {
  basic: {
    label: "Basic query()",
    color: C.blue,
    code: `import { query, type SDKMessage } from "@anthropic-ai/claude-code";

const messages: SDKMessage[] = [];

for await (const event of query({
  prompt: "Add JSDoc comments to src/utils.ts",
  options: {
    maxTurns: 10,
    allowedTools: ["Read", "Write"],
  },
})) {
  messages.push(event);

  if (event.type === "result") {
    console.log(\`Done in \${event.numTurns} turns\`);
    console.log(\`Cost: $\${event.totalCostUsd.toFixed(4)}\`);
  }
}`,
  },
  stateful: {
    label: "StatefulClaudeCode",
    color: C.purple,
    code: `import { StatefulClaudeCode } from "@anthropic-ai/claude-code";

const client = new StatefulClaudeCode({
  options: { maxTurns: 8, allowedTools: ["Read", "Bash"] },
});

try {
  // Turn 1
  for await (const event of client.query("List test files")) {
    if (event.type === "result") console.log("T1:", event.result);
  }

  // Turn 2 — continues in same session
  for await (const event of client.query("Which tests are failing?")) {
    if (event.type === "result") console.log("T2:", event.result);
  }
} finally {
  await client.close();
}`,
  },
  parallel: {
    label: "Parallel with Promise.all",
    color: C.cyan,
    code: `import { query } from "@anthropic-ai/claude-code";

const files = ["src/auth.ts", "src/db.ts", "src/api.ts"];

async function reviewFile(path: string): Promise<string> {
  for await (const event of query({
    prompt: \`Security review of \${path}. Be concise.\`,
    options: { maxTurns: 5, allowedTools: ["Read"] },
  })) {
    if (event.type === "result") return \`## \${path}\\n\${event.result}\`;
  }
  return "";
}

const results = await Promise.all(files.map(reviewFile));
console.log(results.join("\\n\\n"));`,
  },
};

function TypeScriptExamples() {
  const [active, setActive] = useState("basic");
  const ex = TS_EXAMPLES[active];
  return (
    <div>
      <SectionTitle color={C.blue} subtitle="@anthropic-ai/claude-code  ·  npm install @anthropic-ai/claude-code">
        TypeScript — StatefulClaudeCode Examples
      </SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(TS_EXAMPLES).map(([key, e]) => (
          <NavTab key={key} label={e.label} active={active === key} color={e.color} onClick={() => setActive(key)} />
        ))}
      </div>
      <CodeBlock code={ex.code} />
    </div>
  );
}

// ── Configuration Reference ───────────────────────────────────────

const CONFIG_OPTIONS = [
  { name: "maxTurns / max_turns",           type: "number",    default: "10",      desc: "Maximum agentic loop iterations before stopping with error_max_turns." },
  { name: "allowedTools / allowed_tools",   type: "string[]",  default: "all",     desc: "Whitelist of tool names. Pass [] to disable all tools (text-only mode)." },
  { name: "model",                           type: "string",    default: "auto",    desc: "Model ID override. Defaults to the Claude Code CLI default model." },
  { name: "systemPrompt / system_prompt",   type: "string",    default: "—",       desc: "Prepend a system prompt before the user prompt." },
  { name: "appendSystemPrompt",             type: "string",    default: "—",       desc: "Append text to the default system prompt without replacing it." },
  { name: "cwd",                             type: "string",    default: "process.cwd()", desc: "Working directory for the Claude Code subprocess." },
  { name: "env",                             type: "Record<string,string>", default: "—", desc: "Extra environment variables injected into the subprocess." },
  { name: "mcpServers",                      type: "MCPServer[]", default: "—",    desc: "MCP server definitions (name, command, args, env) to pass via --mcp-config." },
  { name: "permissionMode",                 type: "'default' | 'auto' | 'bypassPermissions'", default: "'default'", desc: "Tool permission strategy. bypassPermissions skips all prompts (CI only)." },
  { name: "verbose",                         type: "boolean",   default: "false",   desc: "Emit additional debug events on stderr." },
];

function ConfigReference() {
  return (
    <div>
      <SectionTitle color={C.orange} subtitle="ClaudeCodeOptions (Python) / SDKOptions (TypeScript)">
        Configuration Option Reference
      </SectionTitle>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", ...sans, fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.card }}>
              {["Option", "Type", "Default", "Description"].map(h => (
                <th key={h} style={{
                  textAlign: "left", padding: "10px 14px",
                  color: C.textDim, fontWeight: 700, fontSize: 11,
                  textTransform: "uppercase", letterSpacing: 0.6,
                  borderBottom: `1px solid ${C.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CONFIG_OPTIONS.map((opt, i) => (
              <tr key={opt.name} style={{ background: i % 2 === 0 ? "transparent" : `${C.surface}80` }}>
                <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}40` }}>
                  <code style={{ ...mono, fontSize: 12, color: C.cyan }}>{opt.name}</code>
                </td>
                <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}40` }}>
                  <code style={{ ...mono, fontSize: 11, color: C.purple }}>{opt.type}</code>
                </td>
                <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}40` }}>
                  <code style={{ ...mono, fontSize: 11, color: C.textDim }}>{opt.default}</code>
                </td>
                <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}40`, color: C.textSoft, lineHeight: 1.5 }}>
                  {opt.desc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Production Patterns ───────────────────────────────────────────

const PROD_PATTERNS = [
  {
    icon: "🔄",
    color: C.green,
    label: "CI/CD Pipeline",
    desc: "Use query() with permissionMode: 'bypassPermissions' and a narrow allowedTools list. Capture the result event for exit-code logic.",
    code: `for await (const event of query({
  prompt: "Review PR diff for security issues",
  options: {
    maxTurns: 5,
    allowedTools: ["Read"],
    permissionMode: "bypassPermissions",
  },
})) {
  if (event.type === "result") {
    if (event.subtype !== "success") process.exit(1);
    console.log(event.result);
  }
}`,
  },
  {
    icon: "🌐",
    color: C.blue,
    label: "Web App (per-request)",
    desc: "Create a StatefulClient per user session. Store session_id in your DB. Rehydrate with resumeSession to continue conversations.",
    code: `// POST /api/chat
export async function chatHandler(req, res) {
  const client = new StatefulClaudeCode({
    options: { maxTurns: 10, allowedTools: ["Read"] },
  });
  res.setHeader("Content-Type", "text/event-stream");

  for await (const event of client.query(req.body.message)) {
    if (event.type === "assistant") {
      res.write(\`data: \${JSON.stringify(event)}\\n\\n\`);
    }
    if (event.type === "result") {
      res.write(\`data: [DONE]\\n\\n\`);
      res.end();
    }
  }
}`,
  },
  {
    icon: "⚡",
    color: C.cyan,
    label: "Parallel Workloads",
    desc: "Fan out N independent tasks concurrently with Promise.all / asyncio.gather. Each call spawns its own subprocess — fully isolated.",
    code: `const tasks = repos.map(repo =>
  query({
    prompt: \`Audit \${repo} for outdated dependencies\`,
    options: { maxTurns: 8, cwd: repo },
  })
);

const results = await Promise.all(
  tasks.map(async stream => {
    for await (const ev of stream) {
      if (ev.type === "result") return ev.result;
    }
  })
);`,
  },
];

function ProductionPatterns() {
  const [active, setActive] = useState(0);
  const p = PROD_PATTERNS[active];
  return (
    <div>
      <SectionTitle color={C.green} subtitle="Recommended patterns for real workloads">
        Production Patterns
      </SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {PROD_PATTERNS.map((pat, i) => (
          <NavTab key={i} label={`${pat.icon} ${pat.label}`} active={active === i} color={pat.color} onClick={() => setActive(i)} />
        ))}
      </div>
      <p style={{ ...sans, fontSize: 13, color: C.textSoft, marginBottom: 14, lineHeight: 1.7 }}>{p.desc}</p>
      <CodeBlock code={p.code} />
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────

const TABS = [
  { id: "arch",     label: "Architecture",    color: C.blue   },
  { id: "events",   label: "Event Types",     color: C.cyan   },
  { id: "python",   label: "Python",          color: C.purple },
  { id: "ts",       label: "TypeScript",      color: C.blue   },
  { id: "config",   label: "Config Reference", color: C.orange },
  { id: "patterns", label: "Production Patterns", color: C.green },
];

export default function SDKDiagram() {
  const [tab, setTab] = useState("arch");

  const renderTab = () => {
    switch (tab) {
      case "arch":     return <Architecture />;
      case "events":   return <EventTypes />;
      case "python":   return <PythonExamples />;
      case "ts":       return <TypeScriptExamples />;
      case "config":   return <ConfigReference />;
      case "patterns": return <ProductionPatterns />;
      default:         return null;
    }
  };

  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: "24px 20px", color: C.text }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 26 }}>📦</span>
          <h1 style={{ ...sans, fontSize: 24, fontWeight: 900, color: C.white, margin: 0 }}>
            Agent SDK
          </h1>
        </div>
        <p style={{ ...sans, fontSize: 13, color: C.textDim, margin: 0 }}>
          Subprocess architecture · JSON streaming · Agent SDK v1 · Claude Code v2.1.126
        </p>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 6, flexWrap: "wrap",
        marginBottom: 28, paddingBottom: 16,
        borderBottom: `1px solid ${C.border}`,
      }}>
        {TABS.map(t => (
          <NavTab key={t.id} label={t.label} active={tab === t.id} color={t.color} onClick={() => setTab(t.id)} />
        ))}
      </div>

      {renderTab()}
    </div>
  );
}
