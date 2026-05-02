import { useState, useEffect, useCallback } from "react";

const tabs = [
  { id: "loop", label: "Agentic Loop", domain: 1 },
  { id: "multiagent", label: "Multi-Agent", domain: 1 },
  { id: "hooks", label: "Hooks Flow", domain: 1 },
  { id: "tools", label: "Tool Design", domain: 2 },
  { id: "config", label: "Config Hierarchy", domain: 3 },
  { id: "structured", label: "Structured Output", domain: 4 },
  { id: "context", label: "Context Mgmt", domain: 5 },
  { id: "decisions", label: "Decision Trees", domain: 0 },
];

const domainColors = {
  0: "#6366F1", 1: "#3B82F6", 2: "#10B981", 3: "#F59E0B", 4: "#8B5CF6", 5: "#EF4444"
};

// ── AGENTIC LOOP ANIMATOR ──
function AgenticLoop() {
  const [step, setStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const steps = [
    { phase: "init", title: "1. Send Prompt", desc: "Your code sends the user message + tool definitions to Claude API. The messages array starts with just the user's message.", code: 'messages = [{"role": "user", "content": user_msg}]', highlight: "user" },
    { phase: "claude", title: "2. Claude Evaluates", desc: "Claude reads the system prompt, conversation history, and tool definitions. It decides whether to respond with text, call tools, or both.", code: 'response = client.messages.create(\n  model="claude-sonnet-4-20250514",\n  tools=tools, messages=messages)', highlight: "claude" },
    { phase: "check", title: "3. Check stop_reason", desc: "This is THE decision point. The entire loop routes on this single field. Never parse text, never count iterations.", code: 'if response.stop_reason == "end_turn":\n    return response  # DONE\n# else: stop_reason == "tool_use" → continue', highlight: "check" },
    { phase: "execute", title: "4. Execute Tool(s)", desc: "For each tool_use block in Claude's response, run the corresponding function. Claude may request multiple tools in one response.", code: 'for block in response.content:\n    if block.type == "tool_use":\n        result = execute(block.name, block.input)', highlight: "tool" },
    { phase: "append", title: "5. Append to History", desc: "Add Claude's response as 'assistant' message, then tool results as 'user' message. Tool results reference tool_use_id for correlation.", code: 'messages.append({"role": "assistant",\n  "content": response.content})\nmessages.append({"role": "user",\n  "content": tool_results})', highlight: "append" },
    { phase: "loop", title: "6. Loop Back", desc: "The conversation history now includes the original prompt, Claude's reasoning, and tool results. Claude sees everything on the next iteration.", code: '# messages array has grown.\n# Claude can reference ALL prior\n# tool results in its next decision.\n# Loop continues from Step 2.', highlight: "loop" },
    { phase: "done", title: "7. Loop Ends (end_turn)", desc: "When Claude has enough information, it responds with text only (no tool calls). stop_reason is 'end_turn'. Extract and return the text.", code: '# stop_reason == "end_turn"\ntext = [b.text for b in response.content\n        if b.type == "text"]\nreturn "\\n".join(text)', highlight: "done" },
  ];

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setStep(s => (s + 1) % steps.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [autoPlay, steps.length]);

  const s = steps[step];

  const boxStyle = (id, active) => ({
    padding: "10px 14px", borderRadius: 10, textAlign: "center", fontSize: 12, fontWeight: 600,
    border: `2px solid ${active ? "#3B82F6" : "rgba(255,255,255,0.12)"}`,
    background: active ? "rgba(59,130,246,0.15)" : "#161b22",
    color: active ? "#93c5fd" : "#9ba8b0",
    transition: "all 0.4s ease",
    transform: active ? "scale(1.05)" : "scale(1)",
    boxShadow: active ? "0 4px 15px rgba(59,130,246,0.25)" : "none",
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, color: "#e0e0e0" }}>The Agentic Loop — Step by Step</h3>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setStep(Math.max(0, step - 1))} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "#161b22", cursor: "pointer", fontSize: 13 }}>← Prev</button>
          <button onClick={() => setAutoPlay(!autoPlay)} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: autoPlay ? "#EF4444" : "#3B82F6", color: "white", cursor: "pointer", fontSize: 13 }}>{autoPlay ? "⏸ Pause" : "▶ Auto"}</button>
          <button onClick={() => setStep((step + 1) % steps.length)} style={{ padding: "4px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "#161b22", cursor: "pointer", fontSize: 13 }}>Next →</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={boxStyle("user", s.highlight === "user")}>📤 Send Prompt</div>
        <div style={boxStyle("claude", s.highlight === "claude")}>🧠 Claude Evaluates</div>
        <div style={boxStyle("check", s.highlight === "check")}>🔀 Check stop_reason</div>
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 4 }}>
          <div style={{ ...boxStyle("done", s.highlight === "done"), padding: "6px 10px", fontSize: 11 }}>✅ end_turn → DONE</div>
          <div style={{ ...boxStyle("tool", s.highlight === "tool"), padding: "6px 10px", fontSize: 11 }}>🔧 tool_use → Execute</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        <div style={boxStyle("append", s.highlight === "append")}>📝 Append Results to History</div>
        <div style={boxStyle("loop", s.highlight === "loop")}>🔄 Loop Back to Claude</div>
      </div>

      <div style={{ background: "#1c2333", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          {steps.map((_, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              width: 28, height: 28, borderRadius: "50%", border: `2px solid ${i === step ? "#3B82F6" : "rgba(255,255,255,0.2)"}`,
              background: i === step ? "#3B82F6" : i < step ? "rgba(59,130,246,0.15)" : "#1c2333",
              color: i === step ? "white" : "#9ba8b0", fontSize: 11, fontWeight: 600, cursor: "pointer",
            }}>{i + 1}</button>
          ))}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 6 }}>{s.title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: "#9ba8b0", marginBottom: 12 }}>{s.desc}</div>
        <pre style={{ background: "#1E293B", color: "#A5F3FC", borderRadius: 8, padding: 12, fontSize: 12, lineHeight: 1.5, overflow: "auto", margin: 0 }}>{s.code}</pre>
      </div>

      <div style={{ marginTop: 12, padding: 12, background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#f87171", marginBottom: 4 }}>⚠️ Three Anti-Patterns (Wrong Answers on Exam)</div>
        <div style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.5 }}>
          ❌ Parsing natural language ("I'm done") for termination — use stop_reason<br/>
          ❌ Arbitrary iteration caps (for i in range(5)) as PRIMARY mechanism<br/>
          ❌ Checking for text content as completion signal — text can appear alongside tool_use
        </div>
      </div>
    </div>
  );
}

// ── MULTI-AGENT ARCHITECTURE ──
function MultiAgent() {
  const [selected, setSelected] = useState(null);

  const agents = {
    coordinator: { x: 50, y: 8, w: 200, label: "🎯 Coordinator Agent", color: "#3B82F6",
      desc: "Hub of hub-and-spoke. Decomposes tasks, delegates to subagents, aggregates results, checks quality. allowedTools must include 'Agent'. Decides WHICH subagents to invoke (not always all).",
      code: "allowedTools: ['Agent']\nagents: [search, analysis, synthesis]",
      exam: "If report misses topics → check coordinator's task decomposition (too narrow)." },
    search: { x: 10, y: 55, w: 150, label: "🔍 Search Agent", color: "#10B981",
      desc: "Specialized for web research. Has ONLY search-related tools. Cannot access write tools. Returns structured findings with source URLs and dates.",
      code: "tools: ['web_search', 'fetch_url']\nmodel: 'sonnet'",
      exam: "Subagents have ISOLATED context — they don't inherit coordinator's history." },
    analysis: { x: 125, y: 55, w: 150, label: "📊 Analysis Agent", color: "#F59E0B",
      desc: "Specialized for document analysis. Extracts structured data, identifies patterns. Returns findings with page numbers and confidence scores.",
      code: "tools: ['read_doc', 'extract_data']\nmodel: 'sonnet'",
      exam: "Coordinator must EXPLICITLY pass findings from prior agents in the prompt." },
    synthesis: { x: 240, y: 55, w: 150, label: "📝 Synthesis Agent", color: "#8B5CF6",
      desc: "Combines findings from all agents. Preserves source attribution. May have a scoped verify_fact tool for simple lookups (85% of verifications).",
      code: "tools: ['summarize', 'verify_fact']\nmodel: 'opus'",
      exam: "verify_fact for simple lookups. Complex verifications → back through coordinator." },
  };

  const connections = [
    { from: "coordinator", to: "search", label: "delegate" },
    { from: "coordinator", to: "analysis", label: "delegate" },
    { from: "coordinator", to: "synthesis", label: "delegate" },
  ];

  return (
    <div>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#e0e0e0" }}>Hub-and-Spoke Multi-Agent Architecture</h3>
      <p style={{ fontSize: 13, color: "#9ba8b0", margin: "0 0 16px" }}>Click any agent to see its configuration, exam-relevant details, and code.</p>
      
      <div style={{ position: "relative", height: 250, background: "#1c2333", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)", marginBottom: 12 }}>
        {Object.entries(agents).map(([key, a]) => (
          <button key={key} onClick={() => setSelected(selected === key ? null : key)} style={{
            position: "absolute", left: `${a.x}px`, top: `${a.y}%`,
            width: a.w, padding: "12px 8px", borderRadius: 12,
            border: `2px solid ${selected === key ? a.color : a.color + "44"}`,
            background: selected === key ? a.color + "15" : "#161b22",
            cursor: "pointer", textAlign: "center", fontSize: 13, fontWeight: 600,
            color: a.color, transition: "all 0.2s",
            boxShadow: selected === key ? `0 4px 15px ${a.color}33` : "0 1px 3px rgba(0,0,0,0.1)",
          }}>
            {a.label}
            <div style={{ fontSize: 10, fontWeight: 400, marginTop: 4, color: "#9ba8b0" }}>
              {key === "coordinator" ? "Manages all communication" : "Isolated context"}
            </div>
          </button>
        ))}
        
        {connections.map((c, i) => (
          <div key={i} style={{ position: "absolute", left: `${agents[c.from].x + agents[c.from].w / 2 - 20}px`, top: "38%", fontSize: 10, color: "#94A3B8", textAlign: "center", width: 40 }}>↓</div>
        ))}
        
        <div style={{ position: "absolute", bottom: 8, left: 10, right: 10, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", background: "rgba(245,158,11,0.08)", display: "inline-block", padding: "4px 10px", borderRadius: 6 }}>
            ⚡ Parallel: Coordinator emits multiple Agent calls in ONE response → all run concurrently
          </div>
        </div>
      </div>

      {selected && (
        <div style={{ background: agents[selected].color + "08", border: `1px solid ${agents[selected].color}33`, borderRadius: 12, padding: 16, transition: "all 0.3s" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: agents[selected].color, marginBottom: 8 }}>{agents[selected].label}</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "#9ba8b0", marginBottom: 10 }}>{agents[selected].desc}</div>
          <pre style={{ background: "#1E293B", color: "#A5F3FC", borderRadius: 8, padding: 10, fontSize: 12, margin: "0 0 10px" }}>{agents[selected].code}</pre>
          <div style={{ fontSize: 12, padding: 8, background: "rgba(239,68,68,0.08)", borderRadius: 6, color: "#f87171" }}>
            <strong>🎯 Exam Tip:</strong> {agents[selected].exam}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ padding: 10, background: "rgba(34,197,94,0.08)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.3)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#86efac" }}>✅ Context Passing Pattern</div>
          <div style={{ fontSize: 11, color: "#86efac", marginTop: 4, lineHeight: 1.5 }}>Pass complete findings from prior agents directly in the subagent's prompt. Use structured data separating content from metadata.</div>
        </div>
        <div style={{ padding: 10, background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#f87171" }}>❌ Common Mistake</div>
          <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 4, lineHeight: 1.5 }}>Assuming subagents “see” coordinator’s conversation. They DON’T. Every subagent starts with a fresh, isolated context window.</div>
        </div>
      </div>
    </div>
  );
}

// ── HOOKS FLOW ──
function HooksFlow() {
  const [scenario, setScenario] = useState("block");

  const scenarios = {
    block: {
      title: "Scenario: Block Unauthorized Refund",
      steps: [
        { label: "Claude requests: process_refund($750)", type: "action", color: "#3B82F6" },
        { label: "PreToolUse hook fires", type: "hook", color: "#F59E0B" },
        { label: "Hook checks: $750 > $500 limit", type: "check", color: "#F59E0B" },
        { label: "Hook returns: permissionDecision: 'deny'", type: "deny", color: "#EF4444" },
        { label: "Claude receives: 'Exceeds $500 limit. Use escalate_to_human'", type: "feedback", color: "#EF4444" },
        { label: "Claude calls: escalate_to_human(summary)", type: "action", color: "#10B981" },
      ],
      takeaway: "PreToolUse hooks provide DETERMINISTIC enforcement. The refund is blocked 100% of the time, not 88%."
    },
    normalize: {
      title: "Scenario: Normalize Tool Output",
      steps: [
        { label: "Claude calls: get_order_status('ORD-789')", type: "action", color: "#3B82F6" },
        { label: "Tool returns: {created_at: 1705312200, status: 2}", type: "result", color: "#64748B" },
        { label: "PostToolUse hook fires", type: "hook", color: "#F59E0B" },
        { label: "Hook converts: Unix timestamp → ISO 8601", type: "transform", color: "#F59E0B" },
        { label: "Hook converts: status code 2 → 'inactive'", type: "transform", color: "#F59E0B" },
        { label: "Claude sees: {created_at: '2025-01-15T10:30:00Z', status: 'inactive'}", type: "result", color: "#10B981" },
      ],
      takeaway: "PostToolUse hooks normalize heterogeneous data formats BEFORE Claude processes them. Zero context tokens consumed."
    },
    prerequisite: {
      title: "Scenario: Enforce Tool Ordering",
      steps: [
        { label: "Claude requests: lookup_order('ORD-789')", type: "action", color: "#3B82F6" },
        { label: "PreToolUse hook fires", type: "hook", color: "#F59E0B" },
        { label: "Hook checks: verified_customer_id is None", type: "check", color: "#F59E0B" },
        { label: "Hook returns: deny + 'Must verify customer first'", type: "deny", color: "#EF4444" },
        { label: "Claude calls: get_customer({email: 'jane@example.com'})", type: "action", color: "#3B82F6" },
        { label: "PostToolUse hook stores: verified_customer_id = 'C-12345'", type: "hook", color: "#10B981" },
        { label: "Claude retries: lookup_order('ORD-789', customer_id='C-12345')", type: "action", color: "#3B82F6" },
        { label: "PreToolUse hook: verified_customer_id exists → allow", type: "allow", color: "#10B981" },
      ],
      takeaway: "Programmatic prerequisites GUARANTEE tool ordering. This is the correct answer when the exam mentions 'identity verification before financial operations.'"
    },
  };

  const sc = scenarios[scenario];

  return (
    <div>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#e0e0e0" }}>Agent SDK Hooks — Interactive Scenarios</h3>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {Object.entries(scenarios).map(([key, val]) => (
          <button key={key} onClick={() => setScenario(key)} style={{
            padding: "6px 12px", borderRadius: 8, border: `2px solid ${scenario === key ? "#F59E0B" : "rgba(255,255,255,0.12)"}`,
            background: scenario === key ? "rgba(245,158,11,0.08)" : "#161b22", fontSize: 12, fontWeight: 600,
            color: scenario === key ? "#92400E" : "#9ba8b0", cursor: "pointer",
          }}>{val.title.replace("Scenario: ", "")}</button>
        ))}
      </div>

      <div style={{ background: "#1c2333", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e0e0e0", marginBottom: 12 }}>{sc.title}</div>
        {sc.steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: i < sc.steps.length - 1 ? 8 : 0 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
              background: s.color + "20", border: `2px solid ${s.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: s.color,
            }}>{i + 1}</div>
            <div style={{
              flex: 1, padding: "8px 12px", borderRadius: 8,
              background: s.type === "deny" ? "rgba(239,68,68,0.08)" : s.type === "allow" ? "rgba(34,197,94,0.08)" : s.type === "hook" || s.type === "transform" || s.type === "check" ? "rgba(245,158,11,0.08)" : "#161b22",
              border: `1px solid ${s.color}33`,
              fontSize: 13, color: "#9ba8b0", fontFamily: s.type === "result" ? "monospace" : "inherit",
            }}>
              {s.type === "hook" && "⚡ "}{s.type === "deny" && "🚫 "}{s.type === "allow" && "✅ "}{s.label}
            </div>
            {i < sc.steps.length - 1 && <div style={{ position: "relative", top: 24, left: -17, fontSize: 10, color: "#CBD5E1" }}>│</div>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, padding: 12, background: "rgba(59,130,246,0.08)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.3)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#93c5fd" }}>💡 Key Takeaway</div>
        <div style={{ fontSize: 13, color: "#1E3A5F", marginTop: 4, lineHeight: 1.5 }}>{sc.takeaway}</div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#9ba8b0", marginBottom: 8 }}>All 8 Hook Events</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {[
            { name: "PreToolUse", desc: "Fires before tool call — can block or modify", color: "#F59E0B" },
            { name: "PostToolUse", desc: "Fires after tool call — can observe results", color: "#10B981" },
            { name: "PostCompact", desc: "Fires after /compact or auto-compaction — inject fresh context", color: "#8B5CF6" },
            { name: "CwdChanged", desc: "Fires when working directory changes — update project context", color: "#3B82F6" },
            { name: "FileChanged", desc: "Fires when files are modified — trigger validation/tests", color: "#EF4444" },
            { name: "ConfigChange", desc: "Fires when settings/CLAUDE.md changes — reload rules", color: "#6366F1" },
            { name: "InstructionsLoaded", desc: "Fires when memory/rules load at session start", color: "#0EA5E9" },
            { name: "Elicitation", desc: "Fires when Claude requests user input — can auto-respond", color: "#EC4899" },
          ].map((h, i) => (
            <div key={i} style={{ padding: 8, background: "#1c2333", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: h.color }}>{h.name}</div>
              <div style={{ fontSize: 10, color: "#9ba8b0", marginTop: 3 }}>{h.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TOOL DESIGN ──
function ToolDesign() {
  const [view, setView] = useState("descriptions");
  
  const views = {
    descriptions: {
      title: "Tool Description Quality → Selection Accuracy",
      content: (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 14, background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>❌ Minimal Descriptions</div>
              <pre style={{ background: "#1E293B", color: "#FCA5A5", borderRadius: 6, padding: 10, fontSize: 11, margin: 0, lineHeight: 1.4 }}>{`get_customer:
  "Retrieves customer information"

lookup_order:
  "Retrieves order details"

→ 50% misrouting rate
→ Claude can't differentiate`}</pre>
            </div>
            <div style={{ padding: 14, background: "rgba(34,197,94,0.08)", borderRadius: 10, border: "1px solid rgba(34,197,94,0.3)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#86efac", marginBottom: 8 }}>✅ Detailed Descriptions</div>
              <pre style={{ background: "#1E293B", color: "#86EFAC", borderRadius: 6, padding: 10, fontSize: 11, margin: 0, lineHeight: 1.4 }}>{`get_customer:
  "Look up customer by email
   or phone. Returns ID, name,
   status, tier. Use BEFORE
   order lookups. Input: email
   or phone (at least one)."

→ Near-zero misrouting
→ Clear boundaries`}</pre>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 10, background: "rgba(59,130,246,0.08)", borderRadius: 8, fontSize: 12, color: "#93c5fd", border: "1px solid rgba(59,130,246,0.3)" }}>
            <strong>Exam Rule:</strong> When the question asks about fixing tool misrouting, the answer is ALWAYS "expand tool descriptions" — not few-shot examples, not routing classifiers, not tool consolidation. Descriptions are the #1 mechanism.
          </div>
        </div>
      )
    },
    errors: {
      title: "MCP Error Pattern: isError Flag",
      content: (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 14, background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>Access Failure (isError: true)</div>
              <pre style={{ background: "#1E293B", color: "#FCA5A5", borderRadius: 6, padding: 10, fontSize: 11, margin: 0, lineHeight: 1.5 }}>{`{
  "content": [{
    "type": "text",
    "text": "Database timeout"
  }],
  "isError": true
}
→ Agent knows: query FAILED
→ May retry or try alternative`}</pre>
            </div>
            <div style={{ padding: 14, background: "rgba(34,197,94,0.08)", borderRadius: 10, border: "1px solid rgba(34,197,94,0.3)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#86efac", marginBottom: 8 }}>Valid Empty Result (isError: false)</div>
              <pre style={{ background: "#1E293B", color: "#86EFAC", borderRadius: 6, padding: 10, fontSize: 11, margin: 0, lineHeight: 1.5 }}>{`{
  "content": [{
    "type": "text",
    "text": "No customers found"
  }],
  "isError": false
}
→ Agent knows: search WORKED
→ Just no matches. Move on.`}</pre>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 10, background: "rgba(245,158,11,0.08)", borderRadius: 8, fontSize: 12, color: "#92400E", border: "1px solid rgba(245,158,11,0.3)" }}>
            <strong>Critical Distinction:</strong> Timeout (access failure) ≠ No matches (empty result). Conflating them is an anti-pattern. isError: true goes into the LLM context window, enabling recovery.
          </div>
        </div>
      )
    },
    toolchoice: {
      title: "tool_choice Options Comparison",
      content: (
        <div style={{ display: "grid", gap: 10 }}>
          {[
            { opt: '"auto"', desc: "Claude decides freely — may or may not call a tool", when: "Default for most agentic loops", color: "#3B82F6", icon: "🤔" },
            { opt: '"any"', desc: "MUST call a tool, but can choose which one", when: "Guaranteed structured output, unknown document type", color: "#10B981", icon: "🎯" },
            { opt: '{type:"tool", name:"X"}', desc: "MUST call this specific named tool", when: "Force metadata extraction before enrichment", color: "#8B5CF6", icon: "📌" },
            { opt: '"none"', desc: "Cannot call any tools — text response only", when: "Tools defined but shouldn’t be used for this turn", color: "#9ba8b0", icon: "🚫" },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: 12, background: t.color + "08", borderRadius: 10, border: `1px solid ${t.color}22`, alignItems: "center" }}>
              <div style={{ fontSize: 24, flexShrink: 0 }}>{t.icon}</div>
              <div style={{ flex: 1 }}>
                <code style={{ fontSize: 13, fontWeight: 700, color: t.color }}>{t.opt}</code>
                <div style={{ fontSize: 12, color: "#9ba8b0", marginTop: 2 }}>{t.desc}</div>
                <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Use when: {t.when}</div>
              </div>
            </div>
          ))}
        </div>
      )
    },
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#e0e0e0" }}>Tool Design &amp; MCP Integration</h3>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {Object.entries(views).map(([key, val]) => (
          <button key={key} onClick={() => setView(key)} style={{
            padding: "6px 12px", borderRadius: 8, border: `2px solid ${view === key ? "#10B981" : "rgba(255,255,255,0.12)"}`,
            background: view === key ? "rgba(16,185,129,0.1)" : "#161b22", fontSize: 12, fontWeight: 600,
            color: view === key ? "#065F46" : "#9ba8b0", cursor: "pointer",
          }}>{val.title.split(":")[0].split("→")[0].trim()}</button>
        ))}
      </div>
      {views[view].content}
    </div>
  );
}

// ── CONFIG HIERARCHY ──
function ConfigHierarchy() {
  const [selected, setSelected] = useState(null);
  const levels = [
    { id: "user", label: "~/.claude/CLAUDE.md", scope: "User-level", shared: false, color: "#EF4444",
      detail: "Personal preferences. NOT shared via version control. Only applies to YOU. This is the #1 exam trap — if a new team member doesn't see your conventions, they're probably here.",
      example: "# My preferences\n- Use verbose logging\n- Preferred editor: vim" },
    { id: "project", label: ".claude/CLAUDE.md", scope: "Project-level", shared: true, color: "#3B82F6",
      detail: "Team standards. Shared via version control. Applies to ALL team members. This is where coding conventions, testing standards, and review criteria belong.",
      example: "# Team Standards\n- TypeScript strict mode\n- All functions need JSDoc\n- 80% test coverage minimum" },
    { id: "rules", label: ".claude/rules/*.md", scope: "Path-scoped rules", shared: true, color: "#8B5CF6",
      detail: "Topic-specific rules with optional glob patterns. Files with paths: frontmatter load ONLY when editing matching files. Perfect for test conventions across scattered test files.",
      example: "---\npaths: [\"**/*.test.*\"]\n---\n# Testing Rules\n- Use describe/it blocks\n- Mock external services" },
    { id: "directory", label: "subdir/CLAUDE.md", scope: "Directory-level", shared: true, color: "#10B981",
      detail: "Highest precedence. Loaded on-demand when Claude reads files in that directory. Good for area-specific conventions that only apply in one directory.",
      example: "# API Module Rules\n- All endpoints validate input\n- Return {data, error} shape" },
  ];

  return (
    <div>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#e0e0e0" }}>CLAUDE.md Configuration Hierarchy</h3>
      <p style={{ fontSize: 13, color: "#9ba8b0", margin: "0 0 16px" }}>Click each level to see details. Arrow direction shows increasing precedence (higher overrides lower).</p>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
        {levels.map((level, i) => (
          <div key={level.id}>
            <button onClick={() => setSelected(selected === level.id ? null : level.id)} style={{
              width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", borderRadius: 10, cursor: "pointer",
              border: `2px solid ${selected === level.id ? level.color : level.color + "33"}`,
              background: selected === level.id ? level.color + "10" : "#161b22",
              transition: "all 0.2s",
            }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: level.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: level.color }}>{i + 1}</div>
                <div style={{ textAlign: "left" }}>
                  <code style={{ fontSize: 13, fontWeight: 600, color: level.color }}>{level.label}</code>
                  <div style={{ fontSize: 11, color: "#9ba8b0" }}>{level.scope}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: level.shared ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: level.shared ? "#86efac" : "#f87171", fontWeight: 600 }}>
                  {level.shared ? "✓ Shared via VC" : "✗ NOT shared"}
                </span>
                <span style={{ fontSize: 11, color: "#94A3B8" }}>{i === 0 ? "Lowest" : i === levels.length - 1 ? "Highest" : ""} precedence</span>
              </div>
            </button>
            {selected === level.id && (
              <div style={{ margin: "4px 0 8px 42px", padding: 14, background: "#1c2333", borderRadius: 8, border: `1px solid ${level.color}22` }}>
                <div style={{ fontSize: 13, color: "#9ba8b0", lineHeight: 1.6, marginBottom: 8 }}>{level.detail}</div>
                <pre style={{ background: "#1E293B", color: "#A5F3FC", borderRadius: 6, padding: 10, fontSize: 11, margin: 0 }}>{level.example}</pre>
              </div>
            )}
            {i < levels.length - 1 && <div style={{ textAlign: "center", fontSize: 12, color: "#CBD5E1", padding: 2 }}>▼ overridden by ▼</div>}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <div style={{ padding: 10, background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#f87171" }}>🎯 Exam Trap: New Team Member</div>
          <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 4 }}>Conventions in ~/.claude/CLAUDE.md → new member doesn't have them. Fix: move to .claude/CLAUDE.md (project-level).</div>
        </div>
        <div style={{ padding: 10, background: "rgba(59,130,246,0.08)", borderRadius: 8, border: "1px solid rgba(59,130,246,0.3)" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#93c5fd" }}>🎯 Exam Trap: Scattered Test Files</div>
          <div style={{ fontSize: 11, color: "#1E3A5F", marginTop: 4 }}>Use .claude/rules/testing.md with paths: ["**/*.test.*"], NOT directory CLAUDE.md in each folder.</div>
        </div>
      </div>
      <div style={{ marginTop: 8, padding: 10, background: "rgba(34,197,94,0.08)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.3)" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#065F46" }}>📝 Also Loads at Session Start: MEMORY.md</div>
        <div style={{ fontSize: 11, color: "#047857", marginTop: 4 }}>MEMORY.md (auto-generated, v2.1.59) also loads permanently — Claude Code writes discovered facts here. Check .claude/MEMORY.md to see what Claude has learned about your project.</div>
      </div>
    </div>
  );
}

// ── STRUCTURED OUTPUT ──
function StructuredOutput() {
  const [view, setView] = useState("flow");

  return (
    <div>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#e0e0e0" }}>Structured Output via tool_use</h3>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <button onClick={() => setView("flow")} style={{ padding: "6px 12px", borderRadius: 8, border: `2px solid ${view === "flow" ? "#8B5CF6" : "rgba(255,255,255,0.12)"}`, background: view === "flow" ? "rgba(168,85,247,0.1)" : "#161b22", fontSize: 12, fontWeight: 600, color: view === "flow" ? "#d8b4fe" : "#9ba8b0", cursor: "pointer" }}>Extraction Flow</button>
        <button onClick={() => setView("errors")} style={{ padding: "6px 12px", borderRadius: 8, border: `2px solid ${view === "errors" ? "#8B5CF6" : "rgba(255,255,255,0.12)"}`, background: view === "errors" ? "rgba(168,85,247,0.1)" : "#161b22", fontSize: 12, fontWeight: 600, color: view === "errors" ? "#d8b4fe" : "#9ba8b0", cursor: "pointer" }}>Syntax vs Semantic</button>
        <button onClick={() => setView("batch")} style={{ padding: "6px 12px", borderRadius: 8, border: `2px solid ${view === "batch" ? "#8B5CF6" : "rgba(255,255,255,0.12)"}`, background: view === "batch" ? "rgba(168,85,247,0.1)" : "#161b22", fontSize: 12, fontWeight: 600, color: view === "batch" ? "#d8b4fe" : "#9ba8b0", cursor: "pointer" }}>Batch vs Real-time</button>
      </div>

      {view === "flow" && (
        <div style={{ display: "grid", gap: 8 }}>
          {[
            { step: "1", label: "Define extraction tool with JSON schema", detail: "Required fields, nullable for optional, enum with 'other' + detail", color: "#8B5CF6", icon: "📐" },
            { step: "2", label: "Set tool_choice to force/any", detail: 'tool_choice: "any" (unknown type) or forced (known type)', color: "#3B82F6", icon: "🎯" },
            { step: "3", label: "Claude responds with tool_use block", detail: "Guaranteed valid JSON matching your schema (syntax-error-free)", color: "#10B981", icon: "✅" },
            { step: "4", label: "Extract data from tool_use.input", detail: "The structured data is in block.input — already parsed", color: "#F59E0B", icon: "📦" },
            { step: "5", label: "Validate SEMANTICS separately", detail: "Check: do line items sum to total? Are dates logically consistent?", color: "#EF4444", icon: "🔍" },
            { step: "6", label: "If validation fails → retry with feedback", detail: "Include: original doc + failed extraction + specific errors", color: "#6366F1", icon: "🔄" },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: 10, background: s.color + "08", borderRadius: 8, border: `1px solid ${s.color}22`, alignItems: "center" }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: s.color }}>Step {s.step}: {s.label}</div>
                <div style={{ fontSize: 12, color: "#9ba8b0", marginTop: 2 }}>{s.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "errors" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ padding: 14, background: "rgba(34,197,94,0.08)", borderRadius: 10, border: "2px solid #22C55E" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#86efac", marginBottom: 10 }}>✅ Syntax Errors (FIXED by tool_use)</div>
            <div style={{ display: "grid", gap: 6 }}>
              {["Missing closing brace", "Invalid JSON comma", "Wrong type (string vs number)", "Missing required field", "Malformed array syntax"].map((e, i) => (
                <div key={i} style={{ fontSize: 12, padding: "4px 8px", background: "rgba(34,197,94,0.15)", borderRadius: 4, color: "#86efac" }}>✓ {e}</div>
              ))}
            </div>
          </div>
          <div style={{ padding: 14, background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "2px solid #EF4444" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 10 }}>❌ Semantic Errors (NOT fixed)</div>
            <div style={{ display: "grid", gap: 6 }}>
              {["Line items don't sum to total", "Values placed in wrong fields", "Fabricated data for missing info", "Inconsistent dates/amounts", "Hallucinated field values"].map((e, i) => (
                <div key={i} style={{ fontSize: 12, padding: "4px 8px", background: "rgba(239,68,68,0.15)", borderRadius: 4, color: "#f87171" }}>✗ {e}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "batch" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div style={{ padding: 14, background: "rgba(34,197,94,0.08)", borderRadius: 10, border: "1px solid rgba(34,197,94,0.3)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#86efac", marginBottom: 8 }}>Batch API ✅</div>
              <div style={{ fontSize: 12, color: "#86efac", lineHeight: 1.6 }}>
                50% cost savings<br/>Up to 24hr processing<br/>100K requests/batch<br/>custom_id correlation<br/>No latency SLA
              </div>
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#86efac" }}>Good for:</div>
              <div style={{ fontSize: 11, color: "#86efac" }}>Overnight reports, weekly audits, nightly test gen, bulk extraction</div>
            </div>
            <div style={{ padding: 14, background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>Batch API ❌</div>
              <div style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.6 }}>
                No multi-turn tool calling<br/>No guaranteed latency<br/>Can’t use for agentic loops<br/>Results may arrive out of order
              </div>
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: "#f87171" }}>Bad for:</div>
              <div style={{ fontSize: 11, color: "#fca5a5" }}>Blocking pre-merge checks, real-time support, interactive workflows</div>
            </div>
          </div>
          <div style={{ padding: 10, background: "rgba(245,158,11,0.08)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", fontSize: 12, color: "#92400E" }}>
            <strong>Exam Question Pattern:</strong> "Should both workflows use Batch API?" → Only the latency-tolerant one. Blocking workflows stay real-time.
          </div>
        </div>
      )}
    </div>
  );
}

// ── CONTEXT MANAGEMENT ──
function ContextMgmt() {
  const [topic, setTopic] = useState("summarization");

  const topics = {
    summarization: {
      title: "Progressive Summarization Risks",
      content: (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 14, background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>❌ After Summarization</div>
              <div style={{ fontSize: 13, color: "#fca5a5", lineHeight: 1.6 }}>“Customer had an order issue and wants a partial refund.”</div>
              <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 6 }}>Lost: amounts, dates, item name, deadline</div>
            </div>
            <div style={{ padding: 14, background: "rgba(34,197,94,0.08)", borderRadius: 10, border: "1px solid rgba(34,197,94,0.3)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#86efac", marginBottom: 8 }}>✅ Case Facts Block</div>
              <pre style={{ background: "#1E293B", color: "#86EFAC", borderRadius: 6, padding: 8, fontSize: 11, margin: 0 }}>{`order_total: $247.50
order_date: 2025-01-15
refund_req: $82.50
item: Widget Pro
deadline: 2025-02-01`}</pre>
            </div>
          </div>
          <div style={{ marginTop: 12, padding: 10, background: "rgba(59,130,246,0.08)", borderRadius: 8, fontSize: 12, color: "#93c5fd", border: "1px solid rgba(59,130,246,0.3)" }}>
            <strong>Solution:</strong> Extract transactional facts into a persistent block included in EVERY prompt, OUTSIDE summarized history. Numbers, dates, and amounts never get summarized away.
          </div>
        </div>
      )
    },
    escalation: {
      title: "Escalation Decision Framework",
      content: (
        <div style={{ display: "grid", gap: 8 }}>
          {[
            { trigger: '"I want to talk to a real person"', action: "Escalate IMMEDIATELY", color: "#EF4444", why: "Honor explicit request. No investigation first." },
            { trigger: "Policy gap (competitor price match, unlisted scenario)", action: "Escalate", color: "#F59E0B", why: "Agent can't invent policy. Human decides." },
            { trigger: "3 failed attempts to resolve", action: "Escalate", color: "#F59E0B", why: "No meaningful progress. Don't waste time." },
            { trigger: "Frustrated but solvable issue", action: "Acknowledge + attempt", color: "#10B981", why: "Escalate ONLY if customer reiterates preference." },
            { trigger: "High sentiment score / anger", action: "DO NOT auto-escalate", color: "#6366F1", why: "Sentiment ≠ complexity. This is a WRONG answer." },
            { trigger: "Low self-reported confidence", action: "DO NOT auto-escalate", color: "#6366F1", why: "LLM confidence is poorly calibrated. WRONG answer." },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: 10, background: t.color + "08", borderRadius: 8, border: `1px solid ${t.color}22` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: t.color, minWidth: 100 }}>{t.action}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#9ba8b0" }}>{t.trigger}</div>
                <div style={{ fontSize: 11, color: "#9ba8b0", marginTop: 2 }}>{t.why}</div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    middle: {
      title: "Lost in the Middle Effect",
      content: (
        <div>
          <div style={{ background: "#1c2333", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.12)", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: "#e0e0e0", fontWeight: 600 }}>Attention across context window:</div>
            </div>
            <div style={{ display: "flex", height: 60, gap: 2, alignItems: "flex-end" }}>
              {[90,85,75,60,45,35,30,28,30,35,40,38,35,30,28,30,35,45,60,75,85,90,95].map((h, i) => (
                <div key={i} style={{
                  flex: 1, height: `${h}%`, borderRadius: "3px 3px 0 0",
                  background: h > 70 ? "#22C55E" : h > 50 ? "#F59E0B" : "#EF4444",
                  transition: "all 0.3s",
                }} />
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#94A3B8" }}>
              <span>Beginning ✅</span><span>Middle ⚠️ May miss findings</span><span>End ✅</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={{ padding: 10, background: "rgba(34,197,94,0.08)", borderRadius: 8, border: "1px solid rgba(34,197,94,0.3)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#86efac" }}>✅ Mitigations</div>
              <div style={{ fontSize: 11, color: "#86efac", marginTop: 4, lineHeight: 1.5 }}>Put key findings summary at BEGINNING. Use explicit section headers. Place critical data in structured blocks at start or end.</div>
            </div>
            <div style={{ padding: 10, background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.3)" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#f87171" }}>❌ Anti-pattern</div>
              <div style={{ fontSize: 11, color: "#fca5a5", marginTop: 4, lineHeight: 1.5 }}>Dumping all findings in a flat list. Middle items get less attention. Using verbose tool outputs that push important context to the middle.</div>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#e0e0e0" }}>Context Management &amp; Reliability</h3>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {Object.entries(topics).map(([key, val]) => (
          <button key={key} onClick={() => setTopic(key)} style={{
            padding: "6px 12px", borderRadius: 8, border: `2px solid ${topic === key ? "#EF4444" : "rgba(255,255,255,0.12)"}`,
            background: topic === key ? "rgba(244,63,94,0.08)" : "#161b22", fontSize: 12, fontWeight: 600,
            color: topic === key ? "#f87171" : "#9ba8b0", cursor: "pointer",
          }}>{val.title.split(" ").slice(0, 2).join(" ")}</button>
        ))}
      </div>
      {topics[topic].content}
    </div>
  );
}

// ── DECISION TREES ──
function DecisionTrees() {
  const [tree, setTree] = useState("enforcement");
  
  const trees = {
    enforcement: {
      title: "Hooks vs Prompts Decision",
      nodes: [
        { q: "Does failure have financial/compliance consequences?", yes: 1, no: 2 },
        { answer: "✅ Use PROGRAMMATIC HOOKS (deterministic guarantee)", color: "#22C55E" },
        { q: "Is the requirement a hard rule or soft preference?", yes: 3, no: 4 },
        { answer: "✅ Use HOOKS for hard rules (must always comply)", color: "#22C55E" },
        { answer: "✅ Use PROMPT instructions for preferences (best effort OK)", color: "#3B82F6" },
      ]
    },
    session: {
      title: "Session Management Decision",
      nodes: [
        { q: "Has the codebase changed significantly since last session?", yes: 1, no: 2 },
        { answer: "✅ Start FRESH session + inject structured summary of prior findings", color: "#22C55E" },
        { q: "Do you want to explore divergent approaches from same baseline?", yes: 3, no: 4 },
        { answer: "✅ Use FORK_SESSION to create parallel branches", color: "#3B82F6" },
        { answer: "✅ Use --RESUME to continue the existing session", color: "#8B5CF6" },
      ]
    },
    planmode: {
      title: "Plan Mode vs Direct Execution",
      nodes: [
        { q: "Does the task involve architectural decisions or 7+ files?", yes: 1, no: 2 },
        { answer: "✅ Use PLAN MODE — explore and design before committing", color: "#22C55E" },
        { q: "Is the change well-understood with clear scope (single file, clear fix)?", yes: 3, no: 4 },
        { answer: "✅ Use DIRECT EXECUTION — just do it", color: "#3B82F6" },
        { answer: "✅ Use PLAN MODE first, then switch to direct execution", color: "#8B5CF6" },
      ]
    },
    toolfix: {
      title: "Fix Tool Misrouting",
      nodes: [
        { q: "Are tool descriptions detailed (purpose, inputs, boundaries)?", yes: 1, no: 2 },
        { answer: "Check system prompt for keyword-sensitive instructions that override descriptions", color: "#F59E0B" },
        { answer: "✅ FIRST FIX: Expand tool descriptions with purpose, inputs, when to use, when NOT to use", color: "#22C55E" },
      ]
    },
  };

  const t = trees[tree];

  function TreeNode({ nodeIdx, depth }) {
    const [choice, setChoice] = useState(null);
    const node = t.nodes[nodeIdx];
    if (!node) return null;
    
    if (node.answer) {
      return (
        <div style={{ padding: 12, background: node.color + "15", border: `2px solid ${node.color}`, borderRadius: 10, fontSize: 13, fontWeight: 600, color: node.color === "#22C55E" ? "#86efac" : node.color === "#3B82F6" ? "#93c5fd" : node.color === "#8B5CF6" ? "#d8b4fe" : "#92400E", marginLeft: depth * 16 }}>
          {node.answer}
        </div>
      );
    }

    return (
      <div style={{ marginLeft: depth * 16 }}>
        <div style={{ padding: 12, background: "#1c2333", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#e0e0e0", marginBottom: 8 }}>{node.q}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setChoice("yes")} style={{
              padding: "6px 16px", borderRadius: 6, border: `2px solid ${choice === "yes" ? "#22C55E" : "rgba(255,255,255,0.12)"}`,
              background: choice === "yes" ? "rgba(34,197,94,0.08)" : "#161b22", cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: choice === "yes" ? "#86efac" : "#9ba8b0",
            }}>Yes</button>
            <button onClick={() => setChoice("no")} style={{
              padding: "6px 16px", borderRadius: 6, border: `2px solid ${choice === "no" ? "#EF4444" : "rgba(255,255,255,0.12)"}`,
              background: choice === "no" ? "rgba(239,68,68,0.08)" : "#161b22", cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: choice === "no" ? "#f87171" : "#9ba8b0",
            }}>No</button>
          </div>
        </div>
        {choice === "yes" && <TreeNode nodeIdx={node.yes} depth={depth + 1} />}
        {choice === "no" && <TreeNode nodeIdx={node.no} depth={depth + 1} />}
      </div>
    );
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, color: "#e0e0e0" }}>Interactive Decision Trees</h3>
      <p style={{ fontSize: 13, color: "#9ba8b0", margin: "0 0 16px" }}>Click Yes/No to navigate to the correct answer for each exam scenario.</p>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {Object.entries(trees).map(([key, val]) => (
          <button key={key} onClick={() => setTree(key)} style={{
            padding: "6px 12px", borderRadius: 8, border: `2px solid ${tree === key ? "#6366F1" : "rgba(255,255,255,0.12)"}`,
            background: tree === key ? "rgba(99,102,241,0.1)" : "#161b22", fontSize: 12, fontWeight: 600,
            color: tree === key ? "#a5b4fc" : "#9ba8b0", cursor: "pointer",
          }}>{val.title}</button>
        ))}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 12 }}>{t.title}</div>
      <TreeNode nodeIdx={0} depth={0} />
    </div>
  );
}

// ── MAIN APP ──
export default function App() {
  const [activeTab, setActiveTab] = useState("loop");

  const renderContent = () => {
    switch (activeTab) {
      case "loop": return <AgenticLoop />;
      case "multiagent": return <MultiAgent />;
      case "hooks": return <HooksFlow />;
      case "tools": return <ToolDesign />;
      case "config": return <ConfigHierarchy />;
      case "structured": return <StructuredOutput />;
      case "context": return <ContextMgmt />;
      case "decisions": return <DecisionTrees />;
      default: return <AgenticLoop />;
    }
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", maxWidth: 750, margin: "0 auto", padding: "16px 12px", background: "#0d1117", color: "#e0e0e0", borderRadius: 8 }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a2e", margin: 0 }}>Claude Architect Cert — Visual Learning</h1>
        <p style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0" }}>Interactive diagrams for all 5 exam domains</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "6px 10px", borderRadius: 8, whiteSpace: "nowrap",
            border: `2px solid ${activeTab === tab.id ? domainColors[tab.domain] : "rgba(255,255,255,0.12)"}`,
            background: activeTab === tab.id ? domainColors[tab.domain] + "15" : "#161b22",
            color: activeTab === tab.id ? domainColors[tab.domain] : "#9ba8b0",
            fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
          }}>
            {tab.domain > 0 && <span style={{ fontSize: 10, opacity: 0.7 }}>D{tab.domain} </span>}
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ background: "#161b22", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {renderContent()}
      </div>
    </div>
  );
}
