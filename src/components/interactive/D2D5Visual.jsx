import { useState } from "react";

const domains = [
  { id: "d2", label: "D2: Tool Design & MCP", color: "#10B981" },
  { id: "d3", label: "D3: Claude Code Config", color: "#F59E0B" },
  { id: "d4", label: "D4: Prompt & Output", color: "#8B5CF6" },
  { id: "d5", label: "D5: Context & Reliability", color: "#EF4444" },
];

function Code({ children }) {
  return <pre style={{ background: "#1E293B", color: "#A5F3FC", borderRadius: 8, padding: 12, fontSize: 11.5, lineHeight: 1.5, overflow: "auto", margin: "8px 0" }}>{children}</pre>;
}

function Box({ type, children }) {
  const s = { exam: { bg: "rgba(245,158,11,0.08)", b: "#F59E0B", l: "🎯 EXAM" }, key: { bg: "rgba(59,130,246,0.08)", b: "#3B82F6", l: "💡 KEY" }, correct: { bg: "rgba(34,197,94,0.08)", b: "#22C55E", l: "✅" }, wrong: { bg: "rgba(239,68,68,0.08)", b: "#EF4444", l: "❌" }, warn: { bg: "rgba(249,115,22,0.08)", b: "#F97316", l: "⚠️" } }[type] || { bg: "rgba(100,116,139,0.08)", b: "#64748B", l: "📌" };
  return <div style={{ padding: 12, background: s.bg, borderLeft: `4px solid ${s.b}`, borderRadius: "0 8px 8px 0", marginBottom: 10, fontSize: 13, lineHeight: 1.6, color: "#cbd5e1" }}><span style={{ fontSize: 11, fontWeight: 700, color: s.b }}>{s.l} </span>{children}</div>;
}

function Tabs({ items, active, onSelect }) {
  return <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>{items.map((t, i) => (
    <button key={i} onClick={() => onSelect(i)} style={{ padding: "5px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", border: `2px solid ${active === i ? t.color || "#3B82F6" : "rgba(255,255,255,0.12)"}`, background: active === i ? (t.color || "#3B82F6") + "15" : "#161b22", color: active === i ? t.color || "#60a5fa" : "#9ba8b0" }}>{t.label}</button>
  ))}</div>;
}

function Compare({ left, right }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
    <div style={{ padding: 12, background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)" }}><div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", marginBottom: 6 }}>{left.title}</div>{left.content}</div>
    <div style={{ padding: 12, background: "rgba(34,197,94,0.08)", borderRadius: 10, border: "1px solid rgba(34,197,94,0.3)" }}><div style={{ fontSize: 12, fontWeight: 700, color: "#86efac", marginBottom: 6 }}>{right.title}</div>{right.content}</div>
  </div>;
}

// ═══════════════════════════════════════════════════
// DOMAIN 2: TOOL DESIGN & MCP INTEGRATION (18%)
// ═══════════════════════════════════════════════════
function D2() {
  const [tab, setTab] = useState(0);
  const tabs = [
    { label: "📝 Descriptions", color: "#10B981" },
    { label: "⚠️ isError Flag", color: "#EF4444" },
    { label: "🎯 tool_choice", color: "#3B82F6" },
    { label: "⚙️ MCP Config", color: "#F59E0B" },
    { label: "🔧 Built-in Tools", color: "#8B5CF6" },
  ];

  return <div>
    <Tabs items={tabs} active={tab} onSelect={setTab} />

    {tab === 0 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Tool Descriptions = #1 Selection Mechanism</h3>
      <Compare
        left={{ title: "❌ Minimal Descriptions", content: <Code>{`get_customer:
  "Retrieves customer information"
lookup_order:
  "Retrieves order details"

→ 50% misrouting rate
→ Claude can't tell them apart`}</Code> }}
        right={{ title: "✅ Detailed Descriptions", content: <Code>{`get_customer:
  "Look up customer by email or
   phone. Returns ID, name, status,
   tier. Use BEFORE order lookups.
   Do NOT use for order queries."
   
→ Near-zero misrouting`}</Code> }}
      />
      <Box type="exam">When the exam asks about fixing tool misrouting, the answer is ALWAYS "expand tool descriptions" — not few-shot examples (adds token overhead without fixing root cause), not routing classifiers (over-engineered), not tool consolidation (more effort than needed as "first step").</Box>
      
      <h4 style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0", marginTop: 16 }}>What Good Descriptions Include</h4>
      <div style={{ display: "grid", gap: 4, marginBottom: 12 }}>
        {["What it does (one clear sentence)", "Input format (what data it expects, types)", "Output format (what it returns)", "When to use it (specific trigger scenarios)", "When NOT to use it (boundaries with similar tools)", "Example queries that trigger this tool"].map((item, i) => (
          <div key={i} style={{ padding: "6px 10px", background: "rgba(34,197,94,0.08)", borderRadius: 6, fontSize: 12, color: "#86efac", border: "1px solid rgba(34,197,94,0.3)" }}>✓ {item}</div>
        ))}
      </div>

      <h4 style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0" }}>Splitting Generic Tools</h4>
      <Code>{`BEFORE (one generic tool):
  analyze_document → Does everything

AFTER (three specific tools):
  extract_data_points       → Pulls structured data
  summarize_content         → Creates summaries  
  verify_claim_against_source → Checks claims vs source`}</Code>

      <Box type="warn">System prompt keyword-sensitive instructions can override well-written tool descriptions. If your system prompt says "when user mentions 'order', always use search_tool" — it may override get_customer even when that's the right tool. Review system prompts for unintended keyword associations.</Box>
    </div>}

    {tab === 1 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>MCP isError Flag — Critical Distinction</h3>
      <Box type="key">Two types of MCP errors exist. Protocol-level errors (JSON-RPC error field) are NOT visible to the LLM. Tool execution errors (isError: true in result) ARE visible to the LLM, enabling self-correction.</Box>
      
      <Compare
        left={{ title: "🔴 Access Failure (isError: true)", content: <div><Code>{`{
  "content": [{
    "type": "text",
    "text": "Database timeout after 30s"
  }],
  "isError": true
}
→ Agent knows: query FAILED
→ Can retry or try alternative`}</Code><div style={{ fontSize: 12, color: "#f87171", marginTop: 6 }}>Examples: timeout, rate limit, service unavailable, authentication failure</div></div> }}
        right={{ title: "🟢 Valid Empty Result (isError: false)", content: <div><Code>{`{
  "content": [{
    "type": "text",
    "text": "No customers match criteria"
  }],
  "isError": false  
}
→ Agent knows: search WORKED
→ Zero matches. Move on.`}</Code><div style={{ fontSize: 12, color: "#86efac", marginTop: 6 }}>Examples: no matching records, empty search results, no data for date range</div></div> }}
      />

      <h4 style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0", marginTop: 12 }}>Structured Error Response Pattern</h4>
      <Code>{`# Best practice: include actionable metadata
{
  "content": [{"type": "text", "text": "..."}],
  "isError": true  // or false for success
}

# Include structured metadata in the text:
{
  "errorCategory": "transient",     // transient | validation | business | permission
  "isRetryable": true,              // Can the agent try again?
  "message": "Database timeout. Usually resolves in 30 seconds.",
  "attempted_query": "customer lookup by email",
  "partial_results": [],            // Any data retrieved before failure
  "alternative_approaches": ["Try searching by phone number instead"]
}`}</Code>

      <h4 style={{ fontSize: 13, fontWeight: 600, color: "#EF4444", marginTop: 12 }}>Three Error Anti-Patterns</h4>
      <div style={{ display: "grid", gap: 6 }}>
        {[
          { pattern: "Generic 'Operation failed'", why: "Hides context — agent can't make recovery decisions" },
          { pattern: "Suppressing errors as success (empty result + isError: false)", why: "Agent thinks search worked but found nothing, when actually search didn't complete" },
          { pattern: "Terminating entire workflow on single failure", why: "One subagent timeout shouldn't kill a 5-agent pipeline. Wastes partial results." },
        ].map((p, i) => (
          <div key={i} style={{ padding: 8, background: "rgba(239,68,68,0.08)", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#f87171" }}>❌ {p.pattern}</span>
            <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 2 }}>{p.why}</div>
          </div>
        ))}
      </div>

      <Box type="exam">Local recovery within subagents: Subagents should retry transient errors locally (exponential backoff). Only propagate to coordinator errors they cannot resolve — include failure type, what was attempted, partial results, and alternative approaches.</Box>
    </div>}

    {tab === 2 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>tool_choice Options — Complete Reference</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {[
          { opt: '"auto"', icon: "🤔", desc: "Claude decides freely — may or may not call a tool", when: "Default for most agentic loops. Conversational + tool use mixed.", color: "#64748B", code: 'tool_choice={"type": "auto"}  # Default' },
          { opt: '"any"', icon: "🎯", desc: "MUST call a tool, but can choose which one", when: "Guarantee structured output when document type is unknown. Multiple extraction schemas.", color: "#3B82F6", code: 'tool_choice={"type": "any"}  # Must use a tool' },
          { opt: '{"type":"tool","name":"X"}', icon: "📌", desc: "MUST call this specific named tool", when: "Force metadata extraction before enrichment. Ensure specific step happens first.", color: "#8B5CF6", code: 'tool_choice={"type": "tool", "name": "extract_metadata"}' },
          { opt: '"none"', icon: "🚫", desc: "Cannot call any tools — text response only", when: "Tools defined but shouldn't be used for this particular turn.", color: "#EF4444", code: 'tool_choice={"type": "none"}  # Text only' },
        ].map((t, i) => (
          <div key={i} style={{ padding: 12, background: t.color + "08", borderRadius: 10, border: `1px solid ${t.color}22` }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 20 }}>{t.icon}</span>
              <code style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.opt}</code>
            </div>
            <div style={{ fontSize: 12, color: "#9ba8b0", marginBottom: 4 }}>{t.desc}</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>Use when: {t.when}</div>
            <Code>{t.code}</Code>
          </div>
        ))}
      </div>
      <Box type="exam">When "any" or forced tool is set, Claude is PREFILLED to force tool use — no natural language precedes the tool_use block. These modes are incompatible with extended thinking. Too many tools (18) degrades selection vs 4-5 focused tools. Distribute across specialized subagents.</Box>
    </div>}

    {tab === 3 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>MCP Server Configuration</h3>
      <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
        {[
          { scope: "Project", file: ".mcp.json", shared: true, color: "#3B82F6", desc: "Shared via version control. All team members get these servers.", cmd: 'claude mcp add github --scope project' },
          { scope: "User", file: "~/.claude.json", shared: false, color: "#F59E0B", desc: "Personal config. NOT shared. For experimental servers.", cmd: 'claude mcp add myserver --scope user' },
          { scope: "Local", file: ".claude/settings.local.json", shared: false, color: "#10B981", desc: "Project-specific personal. Default scope. Gitignored.", cmd: 'claude mcp add myserver  # default scope' },
        ].map((s, i) => (
          <div key={i} style={{ padding: 12, background: s.color + "08", borderRadius: 10, border: `1px solid ${s.color}22` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <code style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.file}</code>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: s.shared ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: s.shared ? "#86efac" : "#f87171" }}>{s.shared ? "✓ Shared via VC" : "✗ NOT shared"}</span>
            </div>
            <div style={{ fontSize: 12, color: "#9ba8b0" }}>{s.desc}</div>
            <Code>{s.cmd}</Code>
          </div>
        ))}
      </div>

      <h4 style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0" }}>MCP Config Example (.mcp.json)</h4>
      <Code>{`// .mcp.json — secrets stay OUT of version control
{
  "mcpServers": {
    "db-readonly": {
      "type": "http",
      "url": "https://mcp.mycompany.com/db-readonly",
      "transport": "streamable-http",
      "headers": { "Authorization": "Bearer \${DB_API_KEY}" }
    },
    "file-tools": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-server-files"],
      "env": { "ROOT_DIR": "\${PROJECT_ROOT}" }
    }
  }
}
// Env var syntax: \${VAR} — required. \${VAR:-default} — with fallback.
// Supported in: command, args, env, url, headers`}</Code>
      <Box type="key">MCP 2.0 (2025): Streamable HTTP replaces HTTP+SSE as the production transport. Specify "transport": "streamable-http" for remote servers. Local stdio servers (command/args) remain unchanged.</Box>

      <h4 style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0", marginTop: 12 }}>MCP Resources vs Tools</h4>
      <Compare
        left={{ title: "🔧 MCP Tools (Model-controlled)", content: <div style={{ fontSize: 12, color: "#f87171", lineHeight: 1.5 }}>Execute actions. Claude decides when to call. Examples: create_ticket, send_email, query_db. Each call costs a tool-use turn.</div> }}
        right={{ title: "📚 MCP Resources (App-controlled)", content: <div style={{ fontSize: 12, color: "#86efac", lineHeight: 1.5 }}>Expose read-only data. App/user selects. Examples: database schemas, doc hierarchies. Reduce exploratory tool calls (0 calls vs 3+ to discover schema).</div> }}
      />
      <Box type="key">Prefer community MCP servers for standard integrations (GitHub, Jira, Slack, Postgres). Build custom servers only for team-specific workflows.</Box>
    </div>}

    {tab === 4 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Built-in Tools — Selection Guide</h3>
      <div style={{ display: "grid", gap: 6 }}>
        {[
          { tool: "Grep", purpose: "Search file CONTENTS for patterns", use: '"Find all files containing processRefund"', icon: "🔍", color: "#3B82F6" },
          { tool: "Glob", purpose: "Find files by NAME/EXTENSION patterns", use: '"Find all test files: **/*.test.tsx"', icon: "📂", color: "#10B981" },
          { tool: "Read", purpose: "Load full file contents (text, images, PDFs)", use: '"Read the contents of config.py"', icon: "📄", color: "#F59E0B" },
          { tool: "Edit", purpose: "Targeted find-and-replace modifications", use: '"Change MAX_RETRIES from 3 to 5"', icon: "✏️", color: "#8B5CF6" },
          { tool: "Write", purpose: "Create new files or full overwrite", use: '"Create a new utils.py file"', icon: "📝", color: "#EF4444" },
          { tool: "Bash", purpose: "Execute shell commands", use: '"Run the test suite: npm test"', icon: "💻", color: "#6366F1" },
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: 10, background: t.color + "08", borderRadius: 8, border: `1px solid ${t.color}22`, alignItems: "center" }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.tool}</div>
              <div style={{ fontSize: 12, color: "#9ba8b0" }}>{t.purpose}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>{t.use}</div>
            </div>
          </div>
        ))}
      </div>
      <Box type="key">Edit failure fallback: If Edit fails (non-unique text match), fall back to Read + Write — read the full file, modify in memory, write it back. Incremental exploration: Glob (find files) → Grep (find patterns) → Read (load content). Never read all files upfront.</Box>
      <Box type="exam">Grep searches file CONTENTS. Glob matches file NAMES. This distinction is directly tested. "Find all callers of processRefund" → Grep. "Find all .test.tsx files" → Glob.</Box>
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════
// DOMAIN 3: CLAUDE CODE CONFIG & WORKFLOWS (20%)
// ═══════════════════════════════════════════════════
function D3() {
  const [tab, setTab] = useState(0);
  const tabs = [
    { label: "📁 CLAUDE.md", color: "#F59E0B" },
    { label: "📋 Rules & Paths", color: "#8B5CF6" },
    { label: "⚡ Skills & Commands", color: "#3B82F6" },
    { label: "📐 Plan Mode", color: "#10B981" },
    { label: "🔄 Iterative Refinement", color: "#F97316" },
    { label: "🏗️ CI/CD", color: "#EF4444" },
  ];

  return <div>
    <Tabs items={tabs} active={tab} onSelect={setTab} />

    {tab === 0 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>CLAUDE.md Configuration Hierarchy</h3>
      <div style={{ fontSize: 13, color: "#9ba8b0", marginBottom: 12 }}>Lower levels override higher. All levels COMBINE — more specific rules win on conflicts.</div>
      <div style={{ display: "grid", gap: 4 }}>
        {[
          { level: "1", file: "~/.claude/CLAUDE.md", scope: "User-level", shared: false, color: "#EF4444", detail: "Personal preferences. NOT shared via VC. Only applies to YOU." },
          { level: "2", file: ".claude/CLAUDE.md or ./CLAUDE.md", scope: "Project-level", shared: true, color: "#3B82F6", detail: "Team standards. Shared via VC. Where coding conventions belong." },
          { level: "3", file: ".claude/rules/*.md", scope: "Rules (optional path-scoping)", shared: true, color: "#8B5CF6", detail: "Topic-specific files. Can load conditionally with glob patterns." },
          { level: "4", file: "subdir/CLAUDE.md", scope: "Directory-level", shared: true, color: "#10B981", detail: "Highest precedence. Loaded on-demand when editing files in that dir." },
        ].map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 10, padding: 10, borderRadius: 8, border: `2px solid ${l.color}33`, alignItems: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: l.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: l.color }}>{l.level}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <code style={{ fontSize: 12, fontWeight: 600, color: l.color }}>{l.file}</code>
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 3, background: l.shared ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: l.shared ? "#86efac" : "#f87171" }}>{l.shared ? "Shared" : "NOT shared"}</span>
              </div>
              <div style={{ fontSize: 11, color: "#9ba8b0" }}>{l.detail}</div>
            </div>
            <div style={{ fontSize: 10, color: "#94A3B8" }}>{i === 0 ? "Lowest" : i === 3 ? "Highest" : ""}</div>
          </div>
        ))}
      </div>
      <Box type="exam">Exam Trap #1: New team member doesn't see conventions → they're in ~/.claude/CLAUDE.md (user-level, not shared). Fix: move to .claude/CLAUDE.md (project-level). This is directly tested.</Box>
      <Box type="key">@import syntax: Reference external files to keep CLAUDE.md modular. Example: @docs/api-standards.md includes that file inline. /memory command: Verify which config files are loaded and diagnose inconsistent behavior.</Box>
    </div>}

    {tab === 1 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>.claude/rules/ — Path-Specific Conditional Loading</h3>
      <Code>{`# .claude/rules/testing.md
---
paths:                         # YAML frontmatter
  - "**/*.test.ts"             # Must be QUOTED (starts with *)
  - "**/*.test.tsx"
  - "**/*.spec.ts"
---
# Testing Conventions
- Use describe/it blocks with clear names
- Mock external services, never real APIs
- Assert both success and error paths

# .claude/rules/api.md
---
paths:
  - "src/api/**/*"
  - "src/routes/**/*"
---
# API Conventions
- Validate input with Zod schemas
- Return {data, error} format
- Rate limit all public endpoints

# .claude/rules/general.md
# NO paths field → applies GLOBALLY (always loaded)
# General Standards
- Meaningful variable names
- Functions under 30 lines`}</Code>
      <Box type="exam">Test files spread across the codebase (Button.test.tsx next to Button.tsx). Want same testing conventions everywhere. Solution: .claude/rules/testing.md with paths: ["**/*.test.*"]. NOT directory CLAUDE.md in each folder (doesn't scale). NOT root CLAUDE.md with inference (unreliable).</Box>
      <Box type="key">Glob syntax: * (any chars except /), ** (recursive), ? (single char), [abc] (char class), {"{a,b}"} (alternatives). Patterns starting with * or {"{"} MUST be quoted in YAML.</Box>
    </div>}

    {tab === 2 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Skills &amp; Slash Commands</h3>
      <Code>{`# .claude/skills/review/SKILL.md (project-scoped skill)
---
name: code-review
description: "Reviews code for quality and best practices"
argument-hint: [file-path]
context: fork              # Isolated subagent (verbose output stays out)
allowed-tools: Read, Grep, Glob
agent: Explore             # Use Explore subagent (Haiku, read-only)
model: sonnet              # Override model
---
Review $ARGUMENTS for quality, security, and best practices.

# .claude/commands/deploy.md (project-scoped command)
---
description: "Deploy to staging environment"
allowed-tools: Bash(npm:*), Bash(git:*)
---
Deploy the current branch. Run: !${"``"}git branch --show-current${"``"}
Current changes: !${"``"}git diff --stat${"``"}`}</Code>

      <h4 style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0", marginTop: 12 }}>SKILL.md Frontmatter Fields</h4>
      <div style={{ display: "grid", gap: 4 }}>
        {[
          { field: "name", desc: "Becomes the /slash-command name", example: "code-review" },
          { field: "description", desc: "Claude reads this to decide auto-invocation", example: "Reviews code for quality" },
          { field: "context", desc: "fork = isolated subagent. inherit = main context", example: "fork" },
          { field: "allowed-tools", desc: "Restrict tools during skill execution", example: "Read, Grep, Glob" },
          { field: "argument-hint", desc: "Prompt for required parameters. Available as $ARGUMENTS", example: "[file-path]" },
          { field: "agent", desc: "Subagent type for context: fork", example: "Explore, Plan, general-purpose" },
          { field: "model", desc: "Override model. haiku/sonnet/opus/inherit", example: "sonnet" },
        ].map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "4px 8px", background: "#1c2333", borderRadius: 4, fontSize: 12 }}>
            <code style={{ fontWeight: 600, color: "#93c5fd", minWidth: 110 }}>{f.field}</code>
            <span style={{ color: "#9ba8b0", flex: 1 }}>{f.desc}</span>
            <code style={{ color: "#9ba8b0", fontSize: 11 }}>{f.example}</code>
          </div>
        ))}
      </div>
      <Box type="exam">context: fork is critical — isolates verbose skill output from main conversation. Without it, a codebase analysis skill dumps 5000 tokens into main context, filling it faster. Skills = on-demand invocation. CLAUDE.md = always-loaded universal standards.</Box>
    </div>}

    {tab === 3 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Plan Mode vs Direct Execution</h3>
      <Compare
        left={{ title: "📐 Plan Mode (Complex Tasks)", content: <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ color: "#86efac", marginBottom: 4 }}>Use for: microservice restructuring, library migrations (45+ files), choosing between integration approaches, architectural decisions.</div>
          <div style={{ color: "#86efac" }}>Activate: Shift+Tab (twice), /plan, --permission-mode plan</div>
          <div style={{ color: "#86efac", marginTop: 4 }}>Allowed: Read, Grep, Glob, search, ask questions</div>
          <div style={{ color: "#f87171", marginTop: 4 }}>Blocked: Write, Edit, destructive Bash</div>
        </div> }}
        right={{ title: "⚡ Direct Execution (Simple Tasks)", content: <div style={{ fontSize: 12, lineHeight: 1.6 }}>
          <div style={{ color: "#86efac", marginBottom: 4 }}>Use for: single-file bug fix with clear stack trace, adding one validation check, renaming a variable.</div>
          <div style={{ color: "#86efac" }}>Just start: type your request normally</div>
          <div style={{ color: "#86efac", marginTop: 4 }}>Full access to all tools</div>
          <div style={{ color: "#9ba8b0", marginTop: 4 }}>Well-understood changes with clear scope</div>
        </div> }}
      />
      <Box type="key">Explore subagent: Built-in, read-only agent (Haiku model) for codebase exploration. Keeps verbose discovery output OUT of main context. Tools: Glob, Grep, Read, safe Bash.</Box>
      <Box type="exam">The exam asks: "monolith → microservices restructuring, dozens of files, service boundary decisions." Answer: Plan mode FIRST to explore and design, THEN direct execution to implement. Not "start with direct execution and switch if complex" — complexity is already stated in the requirements.</Box>
    </div>}

    {tab === 4 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Iterative Refinement Techniques</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {[
          { label: "📋 Input/Output Examples", desc: "When prose descriptions produce inconsistent results, provide 2-3 concrete examples.", code: `Input: "Jan 5, 2025" → Output: "2025-01-05"\nInput: "5/1/25" → Output: "2025-01-05"\nInput: "" → raises ValueError` },
          { label: "🧪 Test-Driven Iteration", desc: "Write tests first, then share failures to guide improvement. Strongest pattern for agentic coding.", code: `Step 1: Write test suite (happy path + edge cases)\nStep 2: Ask Claude to implement\nStep 3: Run tests, share ONLY the failures\nStep 4: Claude fixes the specific failing cases` },
          { label: "🤔 Interview Pattern", desc: "Have Claude ask questions BEFORE implementing to surface considerations you may not have anticipated.", code: `Claude asks: "Before I implement caching:\n1. Expected cache hit ratio? (affects eviction)\n2. Survive restarts? (in-memory vs Redis)\n3. Cache invalidation strategy?\n4. Max acceptable staleness?"` },
          { label: "📝 Batch vs Sequential", desc: "Single message when problems interact. Sequential when problems are independent.", code: `BATCH (interacting): "Fix error handler (#1),\nretry logic (#2), and logging (#3) — all related"\n\nSEQUENTIAL (independent):\nMsg 1: "Fix date parsing in utils.py"\nMsg 2: "Add rate limiting to API endpoints"` },
        ].map((t, i) => (
          <div key={i} style={{ padding: 12, background: "#1c2333", borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#e0e0e0", marginBottom: 4 }}>{t.label}</div>
            <div style={{ fontSize: 12, color: "#9ba8b0", marginBottom: 6 }}>{t.desc}</div>
            <Code>{t.code}</Code>
          </div>
        ))}
      </div>
    </div>}

    {tab === 5 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>CI/CD Integration with Claude Code</h3>
      <Box type="exam">The -p flag is the ONLY correct answer for running Claude Code in CI. CLAUDE_HEADLESS=true doesn't exist. --batch doesn't exist. stdin redirect doesn't properly address Claude Code's syntax.</Box>
      <Code>{`# Run non-interactively in CI
claude -p "Review this PR for security issues"

# Structured JSON output for automated processing
claude -p "Review changes" \\
  --output-format json \\
  --json-schema '{
    "type": "object",
    "properties": {
      "findings": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "file": {"type": "string"},
            "line": {"type": "integer"},
            "severity": {"type": "string", "enum": ["critical","warning","info"]},
            "issue": {"type": "string"}
          }
        }
      }
    }
  }'`}</Code>
      <Box type="key">Session context isolation: The same Claude session that GENERATED code is biased when REVIEWING it (retained reasoning context). Use INDEPENDENT sessions — a fresh -p call for review. Include prior findings when re-running reviews to avoid duplicate PR comments.</Box>
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════
// DOMAIN 4: PROMPT ENGINEERING & STRUCTURED OUTPUT (20%)
// ═══════════════════════════════════════════════════
function D4() {
  const [tab, setTab] = useState(0);
  const tabs = [
    { label: "🎯 Explicit Criteria", color: "#8B5CF6" },
    { label: "📝 Few-Shot", color: "#3B82F6" },
    { label: "🔧 tool_use Output", color: "#10B981" },
    { label: "🔄 Retry Loops", color: "#F59E0B" },
    { label: "📦 Batch API", color: "#EF4444" },
    { label: "👁️ Review Arch", color: "#6366F1" },
  ];

  return <div>
    <Tabs items={tabs} active={tab} onSelect={setTab} />

    {tab === 0 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Explicit Criteria Beat Vague Instructions</h3>
      <Compare
        left={{ title: '❌ Vague: "Be conservative"', content: <Code>{`"Check that comments are accurate"
"Only report high-confidence findings"
"Be conservative about flagging"

→ Inconsistent behavior every run
→ "Conservative" means different things
→ False positives erode developer trust`}</Code> }}
        right={{ title: "✅ Explicit: Specific Categories", content: <Code>{`"Flag comments ONLY when:
1. Claimed behavior contradicts code
2. Comment references non-existent var
3. Comment describes deprecated behavior

Do NOT flag:
- Minor style differences
- Correct but brief comments
- TODO/FIXME markers"`}</Code> }}
      />
      <Box type="exam">High false positive rates in ONE category undermine trust in ALL categories. Fix: temporarily DISABLE the high-FP category, improve its prompts separately, re-enable when FP rate is acceptable. Don't just add "be more conservative" — it doesn't work.</Box>
    </div>}

    {tab === 1 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Few-Shot Prompting — Format + Judgment + Generalization</h3>
      <Code>{`# 2-4 targeted examples for ambiguous scenarios:

<example>
  <input>Code: user_age = int(request.params["age"])</input>
  <output>
    severity: warning
    issue: Uncaught ValueError if 'age' is non-numeric
    pattern: unvalidated_type_cast
  </output>
  <reasoning>User input → int() without validation. Server crash on bad input.</reasoning>
</example>

<example>
  <input>Code: # Cache results for 5 minutes
  @cache(ttl=300)</input>
  <output>NO ISSUE — comment says "5 minutes", TTL is 300 seconds = correct.</output>
  <reasoning>Minor unit difference but values match. Not a bug.</reasoning>
</example>`}</Code>
      <Box type="key">Few-shot examples enable GENERALIZATION to novel patterns, not just matching shown cases. They teach judgment about ambiguous situations. 2-4 examples for ambiguous cases. Wrap in {"<example>"} XML tags. Include reasoning to show WHY an action was chosen over alternatives.</Box>
      <Box type="exam">Few-shot is the most effective technique when detailed instructions alone produce inconsistent results. It reduces hallucination in extraction tasks (handling informal measurements, varied document structures). Shows the model how to handle edge cases you can't enumerate.</Box>
    </div>}

    {tab === 2 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Structured Output via tool_use — Guarantees Syntax, Not Semantics</h3>
      <Compare
        left={{ title: "✅ Syntax Errors FIXED by tool_use", content: <div style={{ display: "grid", gap: 3 }}>{["Missing closing brace", "Invalid JSON comma", "Wrong type (string vs number)", "Missing required field", "Malformed array"].map((e,i) => <div key={i} style={{ fontSize: 12, padding: "3px 6px", background: "rgba(34,197,94,0.15)", borderRadius: 4, color: "#86efac" }}>✓ {e}</div>)}</div> }}
        right={{ title: "❌ Semantic Errors NOT caught", content: <div style={{ display: "grid", gap: 3 }}>{["Line items don't sum to total", "Values in wrong fields", "Fabricated data for missing info", "Inconsistent dates/amounts", "Hallucinated field values"].map((e,i) => <div key={i} style={{ fontSize: 12, padding: "3px 6px", background: "rgba(239,68,68,0.15)", borderRadius: 4, color: "#f87171" }}>✗ {e}</div>)}</div> }}
      />
      <Code>{`# Force extraction with schema validation
response = client.messages.create(
    tools=[{
        "name": "extract_invoice",
        "description": "Extract structured data from invoice",
        "input_schema": {
            "type": "object",
            "properties": {
                "vendor": {"type": "string"},
                "total": {"type": "number"},
                "tax_id": {"type": ["string", "null"]},  # Nullable!
                "category": {
                    "type": "string",
                    "enum": ["invoice", "receipt", "contract", "other"]
                },
                "category_detail": {"type": ["string", "null"]}
            },
            "required": ["vendor", "total"]
        }
    }],
    tool_choice={"type": "tool", "name": "extract_invoice"},
    messages=[{"role": "user", "content": doc_text}],
)
# Extract from tool_use block:
data = response.content[0].input  # Guaranteed valid JSON`}</Code>
      <Box type="exam">Make fields NULLABLE when source docs may not contain the info — prevents fabrication. Add "other" + detail string for extensible enums. Add "unclear" for ambiguous cases. strict: true eliminates ALL syntax errors via constrained decoding. Limits: max 20 strict tools, 24 optional params.</Box>
    </div>}

    {tab === 3 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Validation-Retry Loops</h3>
      <Code>{`# Retry-with-error-feedback pattern:
extraction = extract(document_text)
errors = validate(extraction)

if errors:
    retry_prompt = f"""
    ORIGINAL DOCUMENT: {document_text}
    FAILED EXTRACTION: {json.dumps(extraction)}
    SPECIFIC ERRORS: {json.dumps(errors)}
    Please re-extract, fixing these errors.
    """
    corrected = extract(retry_prompt)`}</Code>
      <Compare
        left={{ title: "✅ Retries WORK for", content: <div style={{ fontSize: 12, color: "#86efac", lineHeight: 1.6 }}>Format mismatches ("Jan 5" → "2025-01-05"), structural errors (wrong field placement), type errors (string vs number)</div> }}
        right={{ title: "❌ Retries DON'T work for", content: <div style={{ fontSize: 12, color: "#f87171", lineHeight: 1.6 }}>Information ABSENT from source document. No amount of retrying will find a tax ID that doesn't exist. Fix: make the field nullable.</div> }}
      />
      <Box type="key">detected_pattern field: Track which code patterns trigger findings. When developers dismiss findings, analyze which patterns get dismissed most → improve prompts for those. Self-correction: Extract calculated_total AND stated_total to catch semantic errors (values don't sum).</Box>
    </div>}

    {tab === 4 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Message Batches API</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
        <div style={{ padding: 12, background: "rgba(34,197,94,0.08)", borderRadius: 10, border: "1px solid rgba(34,197,94,0.3)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#86efac" }}>Key Facts</div>
          <div style={{ fontSize: 12, color: "#86efac", lineHeight: 1.8 }}>50% cost savings<br/>Up to 24hr processing window<br/>100K requests/batch max<br/>Results via custom_id correlation<br/>29-day result retention<br/>Most complete in under 1 hour</div>
        </div>
        <div style={{ padding: 12, background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171" }}>Limitations</div>
          <div style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.8 }}>No multi-turn tool calling<br/>No guaranteed latency SLA<br/>Results may arrive out of order<br/>Can't use for agentic loops<br/>Validation is asynchronous</div>
        </div>
      </div>
      <Compare
        left={{ title: "✅ Good for Batch API", content: <div style={{ fontSize: 12, color: "#86efac", lineHeight: 1.6 }}>Overnight technical debt reports. Weekly audit analysis. Nightly test generation. Bulk document extraction (100+ docs).</div> }}
        right={{ title: "❌ Bad for Batch API", content: <div style={{ fontSize: 12, color: "#f87171", lineHeight: 1.6 }}>Blocking pre-merge checks (developers waiting). Real-time customer support. Interactive code generation. Any workflow where latency matters.</div> }}
      />
      <Box type="exam">Classic exam question: "Should both workflows use Batch API — pre-merge checks AND overnight reports?" Answer: Only overnight reports. Pre-merge checks stay real-time. Match each API to its latency requirements. Handle failures by resubmitting only failed docs (identified by custom_id).</Box>
    </div>}

    {tab === 5 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Multi-Instance &amp; Multi-Pass Review</h3>
      <Box type="warn">Self-review limitation: When Claude reviews its own work in the SAME session, it retains the reasoning context that produced the original code. This creates confirmation bias — it's less likely to question its own decisions.</Box>
      <Compare
        left={{ title: "❌ Same-Session Self-Review", content: <div style={{ fontSize: 12, color: "#f87171", lineHeight: 1.6 }}>Claude generated the code → knows WHY each decision was made → unlikely to find issues in its own reasoning. Even "please review critically" doesn't fully overcome this bias.</div> }}
        right={{ title: "✅ Independent Review Instance", content: <div style={{ fontSize: 12, color: "#86efac", lineHeight: 1.6 }}>Fresh Claude session with NO prior reasoning context. Examines code without knowing why decisions were made. Catches subtle issues that self-review misses.</div> }}
      />
      <Box type="key">For large PRs (7+ files): Split into per-file local analysis passes (consistent depth) + separate cross-file integration pass (catches data flow issues). This addresses attention dilution that causes contradictory findings.</Box>
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════
// DOMAIN 5: CONTEXT MANAGEMENT & RELIABILITY (15%)
// ═══════════════════════════════════════════════════
function D5() {
  const [tab, setTab] = useState(0);
  const tabs = [
    { label: "📊 Context Preservation", color: "#EF4444" },
    { label: "🆘 Escalation", color: "#F59E0B" },
    { label: "🔗 Error Propagation", color: "#8B5CF6" },
    { label: "🏗️ Codebase Exploration", color: "#3B82F6" },
    { label: "📈 Confidence Calibration", color: "#10B981" },
    { label: "📚 Provenance", color: "#6366F1" },
  ];

  return <div>
    <Tabs items={tabs} active={tab} onSelect={setTab} />

    {tab === 0 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Context Preservation Across Long Interactions</h3>
      <Compare
        left={{ title: "❌ After Progressive Summarization", content: <Code>{`"Customer had an order issue 
and wants a partial refund."

→ LOST: exact amounts ($247.50)
→ LOST: order date (2025-01-15)
→ LOST: item name (Widget Pro)
→ LOST: deadline (2025-02-01)
→ LOST: refund amount ($82.50)`}</Code> }}
        right={{ title: '✅ Persistent "Case Facts" Block', content: <Code>{`## Active Case Facts:
customer_id: C-12345
order_total: $247.50
order_date: 2025-01-15
defective_item: Widget Pro
refund_requested: $82.50
deadline: 2025-02-01

Include in EVERY prompt, OUTSIDE
summarized history.`}</Code> }}
      />
      
      <h4 style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0", marginTop: 12 }}>“Lost in the Middle” Effect</h4>
      <div style={{ background: "#1c2333", borderRadius: 10, padding: 12, border: "1px solid rgba(255,255,255,0.12)", marginBottom: 8 }}>
        <div style={{ display: "flex", height: 40, gap: 1, alignItems: "flex-end" }}>
          {[92,88,78,62,45,35,28,25,23,25,28,30,28,25,23,25,28,35,45,62,78,88,92,96].map((h, i) => (
            <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: "2px 2px 0 0", background: h > 70 ? "#22C55E" : h > 50 ? "#F59E0B" : "#EF4444" }} />
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
          <span>Beginning ✅ High attention</span><span>Middle ❌ May miss findings</span><span>End ✅ High attention</span>
        </div>
      </div>
      <Box type="key">Mitigation: Place key findings summaries at the BEGINNING. Use explicit section headers. Put critical data in structured blocks at start or end. Trim verbose tool outputs BEFORE they enter context (e.g., keep only 5 relevant fields from 40-field order lookup).</Box>
    </div>}

    {tab === 1 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Escalation Decision Framework</h3>
      <div style={{ display: "grid", gap: 6 }}>
        {[
          { trigger: '"I want to talk to a real person"', action: "Escalate IMMEDIATELY", color: "#EF4444", why: "Honor explicit request. Do NOT attempt investigation first. Compile structured handoff summary." },
          { trigger: "Policy gap / exception", action: "Escalate", color: "#F59E0B", why: "Policy is silent on customer's request (e.g., competitor price matching). Agent can't invent policy." },
          { trigger: "No progress after retries", action: "Escalate", color: "#F59E0B", why: "Inability to make meaningful progress. Don't waste customer's time." },
          { trigger: "Frustrated but solvable issue", action: "Acknowledge + attempt", color: "#10B981", why: "\"I understand your frustration. Let me check right away.\" Escalate ONLY if customer reiterates preference." },
          { trigger: "High sentiment / anger score", action: "DO NOT auto-escalate ❌", color: "#64748B", why: "Sentiment ≠ complexity. Angry customer may have simple issue. This is a WRONG ANSWER on the exam." },
          { trigger: "Low self-reported confidence", action: "DO NOT auto-escalate ❌", color: "#64748B", why: "LLM confidence is poorly calibrated. Agent incorrectly confident on hard cases, uncertain on easy ones. WRONG ANSWER." },
          { trigger: "Multiple customer matches", action: "Ask for identifiers", color: "#3B82F6", why: "Don't select based on heuristics. Ask: \"Could you provide your account number or email?\"" },
        ].map((t, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: 8, borderRadius: 6, background: t.color + "08", border: `1px solid ${t.color}22`, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: t.color, minWidth: 90, textAlign: "center" }}>{t.action}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>{t.trigger}</div>
              <div style={{ fontSize: 11, color: "#9ba8b0" }}>{t.why}</div>
            </div>
          </div>
        ))}
      </div>
    </div>}

    {tab === 2 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Error Propagation in Multi-Agent Systems</h3>
      <Compare
        left={{ title: "❌ Generic Error (Hides Context)", content: <Code>{`# Agent returns:
{"status": "error", 
 "message": "Search unavailable"}

→ Coordinator can't make informed 
  recovery decisions
→ Doesn't know what was attempted
→ Can't try alternatives`}</Code> }}
        right={{ title: "✅ Structured Error (Enables Recovery)", content: <Code>{`{"status": "error",
 "failure_type": "timeout",
 "attempted_query": "AI clinical trials",
 "partial_results": [{...}],
 "alternative_approaches": [
   "More specific query",
   "Use document analysis instead"
 ],
 "retry_recommended": true}`}</Code> }}
      />
      <Box type="exam">Three anti-patterns: (1) Silently suppressing errors (returning empty as success) — prevents recovery. (2) Terminating entire workflow on single failure — wastes partial results. (3) Generic error statuses — hide context from coordinator. Coverage annotations: synthesis output should indicate which findings are well-supported vs which have gaps due to unavailable sources.</Box>
    </div>}

    {tab === 3 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Large Codebase Exploration Strategies</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {[
          { label: "Context Degradation", desc: "In extended sessions, models start giving inconsistent answers and referencing 'typical patterns' rather than specific classes discovered earlier. Tool results push important context deep into the window.", color: "#EF4444" },
          { label: "Scratchpad Files", desc: "Have agents maintain persistent files (SCRATCHPAD.md, claude-progress.txt) recording key findings. These survive /compact and context resets. Reference them for subsequent questions.", color: "#3B82F6" },
          { label: "Subagent Delegation", desc: "Spawn subagents (especially Explore) for verbose discovery. Each gets dedicated context. Main agent receives only summaries. Summarize findings from one phase before spawning subagents for the next.", color: "#10B981" },
          { label: "Crash Recovery (Manifests)", desc: "Each agent exports state to a known location: agent_id, status, completed_queries, pending_queries, findings_file. Coordinator loads manifests on resume and injects state into agent prompts.", color: "#8B5CF6" },
          { label: "/compact", desc: "Summarizes older messages to free context. Auto-triggers at ~95% capacity. Preserves key decisions but may lose detailed early instructions. Persistent rules belong in CLAUDE.md (re-read after compact).", color: "#F59E0B" },
        ].map((s, i) => (
          <div key={i} style={{ padding: 10, background: s.color + "08", borderRadius: 8, border: `1px solid ${s.color}22` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</div>
            <div style={{ fontSize: 12, color: "#9ba8b0", marginTop: 4, lineHeight: 1.5 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>}

    {tab === 4 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Human Review &amp; Confidence Calibration</h3>
      <Box type="warn">97% overall accuracy can MASK poor performance on specific document types: Invoices 99.5% ✓, Receipts 98% ✓, Contracts 85% ✗, Handwritten 72% ✗. Always validate by document type AND field before automating.</Box>
      <Code>{`# Field-level confidence scoring:
{
  "company_name": {"value": "Acme Corp", "confidence": 0.95},
  "total_amount": {"value": 1250.00, "confidence": 0.92},
  "tax_id":       {"value": "12-345678", "confidence": 0.65},
}

# Routing logic:
if all fields > 0.80 → auto-accept
if any field < 0.80  → human review
# PLUS: stratified random sampling of high-confidence
# extractions to detect novel error patterns`}</Code>
      <Box type="key">Stratified random sampling: Don't just review low-confidence extractions. ALSO randomly sample high-confidence ones by document type. This catches novel error patterns that confidence scores miss. Calibrate thresholds using labeled validation sets.</Box>
    </div>}

    {tab === 5 && <div>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>Information Provenance &amp; Source Attribution</h3>
      <Code>{`# Claim-source mappings (subagents must output these):
{
  "claim": "AI reduces drug discovery time by 40%",
  "sources": [{
    "url": "https://nature.com/...",
    "document_name": "Nature Medicine Vol 32",
    "relevant_excerpt": "Meta-analysis of 50 companies...",
    "publication_date": "2025-03-15"
  }]
}`}</Code>
      <Box type="key">Conflicting statistics: Annotate BOTH values with source attribution. Don't arbitrarily select one. Include temporal context (publication dates) — a 2020 stat vs 2024 stat isn't a contradiction, it's temporal change. Render by content type: financial data as tables, news as prose, technical findings as structured lists.</Box>
      <Box type="exam">Source attribution gets lost during summarization when findings are compressed without preserving claim-source mappings. Require subagents to output structured mappings that downstream agents MUST preserve through synthesis.</Box>
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════
export default function App() {
  const [domain, setDomain] = useState("d2");
  const content = { d2: <D2 />, d3: <D3 />, d4: <D4 />, d5: <D5 /> };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 780, margin: "0 auto", padding: "12px 10px", background: "#0d1117", color: "#e0e0e0", borderRadius: 8 }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#e0e0e0", margin: 0 }}>Domains 2–5: Complete Visual Learning</h1>
        <div style={{ fontSize: 12, color: "#9ba8b0" }}>Interactive diagrams, comparisons, code examples, and exam tips</div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {domains.map(d => (
          <button key={d.id} onClick={() => setDomain(d.id)} style={{
            flex: 1, padding: "8px 4px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `2px solid ${domain === d.id ? d.color : "rgba(255,255,255,0.12)"}`,
            background: domain === d.id ? d.color + "15" : "#161b22",
            color: domain === d.id ? d.color : "#9ba8b0",
          }}>{d.label}</button>
        ))}
      </div>

      <div style={{ background: "#161b22", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 16 }}>
        {content[domain]}
      </div>
    </div>
  );
}
