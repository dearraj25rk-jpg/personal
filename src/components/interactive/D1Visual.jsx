import { useState, useEffect, useCallback } from "react";

const tabs = [
  { id: "loop", label: "🔄 Agentic Loop" },
  { id: "stop", label: "🛑 stop_reason Map" },
  { id: "multi", label: "🏗️ Multi-Agent" },
  { id: "context", label: "📦 Context Passing" },
  { id: "hooks", label: "⚡ Hooks System" },
  { id: "enforce", label: "🔒 Enforcement" },
  { id: "decomp", label: "✂️ Decomposition" },
  { id: "session", label: "💾 Sessions" },
  { id: "anti", label: "⚠️ Anti-Patterns" },
];

function Section({ title, children, color = "#3B82F6" }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ margin: "0 0 12px", fontSize: 16, fontWeight: 700, color: "#e0e0e0", borderBottom: `3px solid ${color}`, paddingBottom: 6, display: "inline-block" }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoBox({ type, children }) {
  const styles = {
      exam: { bg: "rgba(245,158,11,0.08)", border: "#F59E0B", icon: "🎯", label: "EXAM TIP" },
    correct: { bg: "rgba(34,197,94,0.08)", border: "#22C55E", icon: "✅", label: "CORRECT" },
    wrong: { bg: "rgba(239,68,68,0.08)", border: "#EF4444", icon: "❌", label: "WRONG" },
    key: { bg: "rgba(59,130,246,0.08)", border: "#3B82F6", icon: "💡", label: "KEY CONCEPT" },
    code: { bg: "rgba(100,116,139,0.08)", border: "#64748B", icon: "💻", label: "CODE" },
    warn: { bg: "rgba(249,115,22,0.08)", border: "#F97316", icon: "⚠️", label: "WARNING" },
  };
  const s = styles[type] || styles.key;
  return (
    <div style={{ padding: 12, background: s.bg, border: `1px solid ${s.border}44`, borderLeft: `4px solid ${s.border}`, borderRadius: "0 8px 8px 0", marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: s.border, marginBottom: 4 }}>{s.icon} {s.label}</div>
      <div style={{ fontSize: 13, lineHeight: 1.6, color: "#cbd5e1" }}>{children}</div>
    </div>
  );
}

function Code({ children }) {
  return <pre style={{ background: "#1E293B", color: "#A5F3FC", borderRadius: 8, padding: 12, fontSize: 11.5, lineHeight: 1.5, overflow: "auto", margin: "8px 0" }}>{children}</pre>;
}

function StepFlow({ steps }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
        {steps.map((s, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `2px solid ${i === active ? s.color || "#3B82F6" : "rgba(255,255,255,0.12)"}`,
            background: i === active ? (s.color || "#3B82F6") + "20" : "#161b22",
            color: i === active ? s.color || "#60a5fa" : "#9ba8b0",
          }}>{s.label}</button>
        ))}
      </div>
      <div style={{ background: "#161b22", borderRadius: 12, padding: 16, border: `1px solid ${steps[active].color || "#3B82F6"}33`, minHeight: 120 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>{steps[active].title}</div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: "#9ba8b0" }}>{steps[active].content}</div>
        {steps[active].code && <Code>{steps[active].code}</Code>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// AGENTIC LOOP - ANIMATED STEP BY STEP
// ═══════════════════════════════════════
function AgenticLoop() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(false);

  const steps = [
    { label: "1️⃣ Send", title: "Step 1: Send Prompt + Tools to Claude", color: "#3B82F6",
      content: "Your code sends the user's message along with tool definitions to the Claude API. On the first iteration, messages contains just the user message. On subsequent iterations, it contains the full conversation history including all prior tool calls and results.",
      code: `# Python
messages = [{"role": "user", "content": user_message}]
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    tools=tools,          # Tool definitions
    messages=messages,    # Full conversation history
    # Optional: extended_thinking={"type": "enabled", "budget_tokens": 8000}
)

// TypeScript
const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  tools,
  messages,
  // Optional: extended_thinking: { type: "enabled", budget_tokens: 8000 }
});` },
    { label: "2️⃣ Claude", title: "Step 2: Claude Evaluates and Responds", color: "#8B5CF6",
      content: "Claude reads the system prompt, all tool definitions, and the full conversation history. It then decides: should I respond with text, call one or more tools, or both? Claude's response.content is an array that can contain both text blocks and tool_use blocks simultaneously.",
      code: `# Claude's response.content might look like:
[
  {"type": "text", "text": "Let me look up that order..."},
  {"type": "tool_use", "id": "toolu_abc123",
   "name": "lookup_order", 
   "input": {"order_id": "ORD-789"}}
]
# Text AND tool_use in the same response!` },
    { label: "3️⃣ Check", title: "Step 3: Check stop_reason (THE Decision Point)", color: "#F59E0B",
      content: "This is the ONLY correct way to control the loop. Check response.stop_reason: if it's 'end_turn', Claude is done — extract text and return. If it's 'tool_use', Claude wants tools executed — continue the loop. NEVER parse Claude's text output to decide.",
      code: `# Python
if response.stop_reason == "end_turn":
    # DONE — extract and return text
    return [b.text for b in response.content 
            if b.type == "text"]
# else: stop_reason == "tool_use" → continue

// TypeScript  
if (response.stop_reason === "end_turn") {
  return response.content
    .filter(b => b.type === "text")
    .map(b => b.text).join("\\n");
}` },
    { label: "4️⃣ Append", title: "Step 4: Append Claude's Response to History", color: "#10B981",
      content: "BEFORE executing tools, append Claude's complete response (including both text and tool_use blocks) as an assistant message. This preserves Claude's reasoning chain in the conversation history so it can reference its own prior decisions on the next iteration.",
      code: `# Append Claude's FULL response as assistant message
messages.append({
    "role": "assistant", 
    "content": response.content  # Includes text + tool_use blocks
})` },
    { label: "5️⃣ Execute", title: "Step 5: Execute All Requested Tools", color: "#EF4444",
      content: "For each tool_use block in Claude's response, run the corresponding tool function and collect the result. Claude may request multiple tools in a single response — execute ALL of them. Each result must include the tool_use_id to correlate with the request.",
      code: `# Execute each tool and collect results
tool_results = []
for block in response.content:
    if block.type == "tool_use":
        result = execute_tool(block.name, block.input)
        tool_results.append({
            "type": "tool_result",
            "tool_use_id": block.id,  # MUST match
            "content": result,
        })` },
    { label: "6️⃣ Return", title: "Step 6: Return Results as User Message", color: "#6366F1",
      content: "Append tool results as a USER message (not assistant, not system). This is how Claude 'sees' tool outputs — they're injected as user messages with tool_result blocks. Then LOOP BACK to Step 1. The conversation history now has the original prompt, Claude's reasoning, and tool results for the next iteration.",
      code: `# Tool results go as a USER message
messages.append({
    "role": "user",        # YES, user role!
    "content": tool_results
})
# Loop back → Claude sees everything` },
  ];

  useEffect(() => {
    if (!auto) return;
    const t = setInterval(() => setStep(s => (s + 1) % steps.length), 4000);
    return () => clearInterval(t);
  }, [auto, steps.length]);

  const s = steps[step];
  return (
    <div>
      <Section title="The Agentic Loop — Complete Animated Walkthrough">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={() => setStep(Math.max(0, step - 1))} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "#161b22", cursor: "pointer", fontSize: 12 }}>← Prev</button>
            <button onClick={() => setAuto(!auto)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: auto ? "#EF4444" : "#3B82F6", color: "white", cursor: "pointer", fontSize: 12 }}>{auto ? "⏸ Pause" : "▶ Auto-Play"}</button>
            <button onClick={() => setStep((step + 1) % steps.length)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.12)", background: "#161b22", cursor: "pointer", fontSize: 12 }}>Next →</button>
          </div>
          <div style={{ fontSize: 12, color: "#94A3B8" }}>Step {step + 1} of {steps.length}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4, marginBottom: 12 }}>
          {steps.map((st, i) => (
            <button key={i} onClick={() => setStep(i)} style={{
              padding: "8px 4px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
              border: `2px solid ${i === step ? st.color : "rgba(255,255,255,0.12)"}`,
              background: i === step ? st.color + "15" : i < step ? "rgba(34,197,94,0.08)" : "#161b22",
              color: i === step ? st.color : "#9ba8b0",
              transition: "all 0.3s",
              transform: i === step ? "scale(1.05)" : "scale(1)",
              boxShadow: i === step ? `0 2px 8px ${st.color}33` : "none",
            }}>{st.label}</button>
          ))}
        </div>

        <div style={{ background: s.color + "08", borderRadius: 12, padding: 16, border: `2px solid ${s.color}33`, transition: "all 0.3s" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: s.color, marginBottom: 8 }}>{s.title}</div>
          <div style={{ fontSize: 13, lineHeight: 1.7, color: "#9ba8b0", marginBottom: 8 }}>{s.content}</div>
          <Code>{s.code}</Code>
        </div>
      </Section>

      <InfoBox type="key">The complete loop in one sentence: Send prompt → Claude responds → Check stop_reason → If "tool_use": execute tools, append results as user message, loop back → If "end_turn": return text, done.</InfoBox>

      <Section title="Agent SDK Version (Simplified)">
        <div style={{ fontSize: 13, lineHeight: 1.6, color: "#9ba8b0", marginBottom: 8 }}>The Claude Agent SDK abstracts the raw loop. You consume a stream of messages — the SDK handles tool execution, context management, and retries internally.</div>
        <Code>{`# Python Agent SDK
from claude_agent_sdk import query, ClaudeAgentOptions
from claude_agent_sdk import AssistantMessage, ResultMessage

async for message in query(
    prompt="Review utils.py for bugs and fix them",
    options=ClaudeAgentOptions(
        allowed_tools=["Read", "Edit", "Glob"],
        permission_mode="acceptEdits",
        max_turns=10,         # Safety limit (not primary)
        max_budget_usd=0.50,  # Cost safety limit
    ),
):
    if isinstance(message, AssistantMessage):
        for block in message.content:
            if hasattr(block, "text"):
                print(block.text)
    elif isinstance(message, ResultMessage):
        print(f"Done: {message.subtype}")
        # subtype: "success" | "error_max_turns"
        #        | "error_max_budget_usd" 
        #        | "error_during_execution"

// TypeScript Agent SDK
for await (const msg of query({
  prompt: "Review utils.py for bugs",
  options: {
    allowedTools: ["Read", "Edit", "Glob"],
    permissionMode: "acceptEdits",
    maxTurns: 10,
    maxBudgetUsd: 0.50,
  },
})) {
  if (msg.type === "result") {
    console.log(msg.subtype, msg.stop_reason);
  }
}`}</Code>
      </Section>

      <InfoBox type="exam">The SDK yields 5 message types: SystemMessage (init, compact_boundary), AssistantMessage (Claude's response each turn), UserMessage (tool results), StreamEvent (raw API events), ResultMessage (always the LAST message — contains result, cost, usage, session_id).</InfoBox>
    </div>
  );
}

// ═══════════════════════════════════════
// STOP_REASON COMPLETE MAP
// ═══════════════════════════════════════
function StopReasonMap() {
  const [selected, setSelected] = useState(null);
  const reasons = [
    { value: "end_turn", action: "STOP the loop", icon: "✅", color: "#22C55E", freq: "Most common",
      detail: "Claude finished the task naturally. Extract text from response.content and return it. This is the PRIMARY and ONLY correct loop termination signal.",
      code: `if response.stop_reason == "end_turn":
    text = [b.text for b in response.content if b.type == "text"]
    return "\\n".join(text)  # DONE` },
    { value: "tool_use", action: "CONTINUE the loop", icon: "🔧", color: "#3B82F6", freq: "Every tool-calling turn",
      detail: "Claude wants to call one or more tools. Execute ALL tool_use blocks, append results as user message, and loop back. Claude may emit text alongside tool_use blocks — this is NOT a signal to stop.",
      code: `# Execute tools, append results, loop back
for block in response.content:
    if block.type == "tool_use":
        result = execute_tool(block.name, block.input)
        tool_results.append({
            "type": "tool_result",
            "tool_use_id": block.id,
            "content": result
        })
messages.append({"role": "user", "content": tool_results})` },
    { value: "max_tokens", action: "Response was TRUNCATED", icon: "✂️", color: "#F59E0B", freq: "When output is long",
      detail: "Claude hit the max_tokens limit you set. The response was cut off mid-generation. Consider increasing max_tokens or asking Claude to continue in a follow-up message.",
      code: `if response.stop_reason == "max_tokens":
    # Option 1: Increase max_tokens
    # Option 2: Send response back + ask to continue` },
    { value: "refusal", action: "Claude DECLINED", icon: "🚫", color: "#EF4444", freq: "Rare (safety)",
      detail: "Safety classifiers intervened and Claude refused to generate. Check response for any partial content. Handle gracefully — log the event and provide a user-friendly message.",
      code: `if response.stop_reason == "refusal":
    log_safety_event(response)
    return "I'm unable to help with that request."` },
    { value: "pause_turn", action: "Server tool needs more cycles", icon: "⏸️", color: "#8B5CF6", freq: "With server tools",
      detail: "Server-side tools (like web_search) hit their iteration limit. Send the response back as-is to let Claude continue. Similar to tool_use but for server-managed tools.",
      code: `if response.stop_reason == "pause_turn":
    # Send response back to continue
    messages.append({"role": "assistant", "content": response.content})
    # Make another API call — Claude will continue` },
    { value: "stop_sequence", action: "Hit custom stop sequence", icon: "🛑", color: "#64748B", freq: "Only if configured",
      detail: "Claude encountered one of the stop_sequences you defined in the request. The response was terminated at that point. Rarely tested on the exam.",
      code: `# Only happens if you set stop_sequences
response = client.messages.create(
    stop_sequences=["END", "STOP"],
    ...
)` },
  ];

  return (
    <Section title="Complete stop_reason Reference Map">
      <div style={{ fontSize: 13, color: "#9ba8b0", marginBottom: 12 }}>Click each stop_reason to see its full details, code handling, and exam relevance.</div>
      <div style={{ display: "grid", gap: 6 }}>
        {reasons.map((r, i) => (
          <div key={i}>
            <button onClick={() => setSelected(selected === i ? null : i)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderRadius: 10, cursor: "pointer", textAlign: "left",
              border: `2px solid ${selected === i ? r.color : r.color + "33"}`,
              background: selected === i ? r.color + "10" : "#161b22", transition: "all 0.2s",
            }}>
              <span style={{ fontSize: 18 }}>{r.icon}</span>
              <code style={{ fontSize: 13, fontWeight: 700, color: r.color, minWidth: 120 }}>"{r.value}"</code>
              <span style={{ fontSize: 12, color: "#9ba8b0", flex: 1 }}>{r.action}</span>
              <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: r.color + "20", color: r.color }}>{r.freq}</span>
            </button>
            {selected === i && (
              <div style={{ margin: "4px 0 8px 28px", padding: 12, background: "#1c2333", borderRadius: 8, border: `1px solid ${r.color}22` }}>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: "#9ba8b0", marginBottom: 8 }}>{r.detail}</div>
                <Code>{r.code}</Code>
              </div>
            )}
          </div>
        ))}
      </div>
      <InfoBox type="exam">For the exam, only two matter most: "tool_use" (continue) and "end_turn" (stop). The loop control is: while stop_reason == "tool_use": keep going. Everything else is edge cases.</InfoBox>
    </Section>
  );
}

// ═══════════════════════════════════════
// MULTI-AGENT ARCHITECTURE
// ═══════════════════════════════════════
function MultiAgent() {
  const [sel, setSel] = useState(null);
  const agents = [
    { id: "coord", label: "🎯 Coordinator", color: "#3B82F6", y: 0,
      role: "Hub of hub-and-spoke. Decomposes tasks, delegates to subagents, aggregates results, checks quality gaps.",
      config: `allowedTools: ["Agent"]  # MUST include this — renamed from 'Task' in v2.1.63
agents: {
  "search": searchAgentDef,
  "analysis": analysisAgentDef,
  "synthesis": synthesisAgentDef,
}
# Extended thinking: enable per-subagent if needed`,

      rules: "1) Decides WHICH subagents to invoke (not always all)\n2) Passes complete context in subagent prompts\n3) Evaluates output for gaps → re-delegates if needed\n4) Can emit multiple Agent calls in ONE response (parallel)",
      exam: "If report misses topics → check coordinator's task decomposition first (too narrow). Subagents executed correctly — the problem is what they were assigned." },
    { id: "search", label: "🔍 Search Agent", color: "#10B981", y: 1,
      role: "Specialized for web research. Has ONLY search tools. Returns structured findings with source URLs and dates.",
      config: `AgentDefinition(
  description="Searches the web for current info",
  prompt="You are a web research specialist...",
  tools=["web_search", "fetch_url"],
  model="sonnet"
)`,
      rules: "1) Has ISOLATED context (doesn't see coordinator history)\n2) Receives research scope in its prompt\n3) Returns structured claim-source mappings\n4) Handles local retry for transient errors",
      exam: "Subagents don't inherit coordinator conversation. If search agent misses topics, it's because the coordinator didn't include them in the delegation prompt." },
    { id: "analysis", label: "📊 Analysis Agent", color: "#F59E0B", y: 1,
      role: "Processes documents and extracts structured data. Returns findings with page numbers and confidence scores.",
      config: `AgentDefinition(
  description="Analyzes documents, extracts data",
  prompt="You are a document analysis specialist...",
  tools=["read_doc", "extract_data"],
  model="sonnet"  
)`,
      rules: "1) Receives documents directly in prompt (not by reference)\n2) Outputs structured findings with metadata\n3) Includes source locations and page numbers\n4) Flags ambiguous or conflicting data",
      exam: "Always pass complete document content in the subagent's prompt. Don't assume the analysis agent can 'access' documents the coordinator saw." },
    { id: "synthesis", label: "📝 Synthesis Agent", color: "#8B5CF6", y: 1,
      role: "Combines findings from all agents. Preserves source attribution. Has scoped verify_fact tool for quick lookups.",
      config: `AgentDefinition(
  description="Synthesizes research findings",
  prompt="Combine findings, preserve citations",
  tools=["summarize", "verify_fact"],
  model="opus"  # Higher capability for synthesis
)`,
      rules: "1) Receives ALL prior findings in its prompt\n2) verify_fact for simple lookups (85% of cases)\n3) Complex verifications → back through coordinator\n4) Annotates coverage gaps when sources failed",
      exam: "Giving synthesis agent a scoped verify_fact tool reduces round-trips by 40% for simple fact-checks while maintaining system reliability." },
  ];

  return (
    <Section title="Hub-and-Spoke Multi-Agent Architecture">
      <div style={{ fontSize: 13, color: "#9ba8b0", marginBottom: 12 }}>Click any agent to explore its configuration, rules, and exam-relevant details.</div>
      
      <div style={{ display: "grid", gap: 6, marginBottom: 12 }}>
        {agents.map(a => (
          <div key={a.id}>
            <button onClick={() => setSel(sel === a.id ? null : a.id)} style={{
              width: "100%", padding: "12px 16px", borderRadius: 10, cursor: "pointer", textAlign: "left",
              border: `2px solid ${sel === a.id ? a.color : a.color + "33"}`,
              background: sel === a.id ? a.color + "10" : "#161b22",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: a.color }}>{a.label}</div>
                <div style={{ fontSize: 12, color: "#9ba8b0", marginTop: 2 }}>{a.role}</div>
              </div>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: a.y === 0 ? "rgba(59,130,246,0.08)" : "#1c2333", color: a.y === 0 ? "#93c5fd" : "#9ba8b0" }}>
                {a.y === 0 ? "COORDINATOR" : "SUBAGENT"}
              </span>
            </button>
            {sel === a.id && (
              <div style={{ margin: "4px 0 8px 0", padding: 14, background: a.color + "08", borderRadius: 10, border: `1px solid ${a.color}22` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0", marginBottom: 6 }}>Configuration:</div>
                <Code>{a.config}</Code>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#e0e0e0", marginBottom: 6, marginTop: 10 }}>Rules:</div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: "#9ba8b0", whiteSpace: "pre-line" }}>{a.rules}</div>
                <InfoBox type="exam">{a.exam}</InfoBox>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <InfoBox type="key">Parallel spawning: Coordinator emits multiple Agent tool calls in ONE response. All subagents run concurrently, cutting research time by up to 90%.</InfoBox>
        <InfoBox type="key">AgentDefinition fields: description (when to use), prompt (system prompt), tools (allowed tools), model (sonnet/opus/haiku/inherit).</InfoBox>
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════
// CONTEXT PASSING
// ═══════════════════════════════════════
function ContextPassing() {
  return (
    <Section title="Context Passing Between Agents — The #1 Failure Point">
      <InfoBox type="warn">Subagents operate with ISOLATED context. They do NOT inherit the coordinator's conversation history. Every piece of information a subagent needs must be EXPLICITLY included in its prompt.</InfoBox>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ padding: 14, background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 8 }}>❌ WRONG — Assuming Inherited Context</div>
          <Code>{`# Coordinator discussed findings...
# Then spawns synthesis agent:
synthesis_prompt = "Synthesize the findings"
# ❌ Synthesis agent has NO IDEA
# what "the findings" refers to!
# It has an empty conversation.`}</Code>
        </div>
        <div style={{ padding: 14, background: "rgba(34,197,94,0.08)", borderRadius: 10, border: "1px solid rgba(34,197,94,0.3)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#86efac", marginBottom: 8 }}>✅ CORRECT — Explicit Context</div>
          <Code>{`synthesis_prompt = f"""
Synthesize these findings:

## Web Search Results:
{json.dumps(search_results)}

## Document Analysis:
{json.dumps(analysis_results)}

Preserve source attribution.
"""`}</Code>
        </div>
      </div>

      <Section title="Structured Data Format for Context Passing">
        <div style={{ fontSize: 13, lineHeight: 1.6, color: "#9ba8b0", marginBottom: 8 }}>Separate content from metadata to preserve attribution across agents:</div>
        <Code>{`{
  "findings": [
    {
      "claim": "AI reduces drug discovery time by 40%",
      "evidence": "Meta-analysis of 50 pharmaceutical companies...",
      "source_url": "https://nature.com/articles/...",
      "document_name": "Nature Medicine Vol 32",
      "page_number": 15,
      "publication_date": "2025-03-15",
      "relevance_score": 5
    }
  ],
  "coverage_gaps": ["Clinical trial phase data limited"],
  "total_sources_reviewed": 15
}`}</Code>
      </Section>

      <InfoBox type="exam">When the synthesis subagent is missing citations from web search results even though the search agent returned them correctly, the root cause is almost always: the coordinator didn't pass the findings to the synthesis agent's prompt.</InfoBox>
    </Section>
  );
}

// ═══════════════════════════════════════
// HOOKS SYSTEM
// ═══════════════════════════════════════
function HooksSystem() {
  const [scenario, setScenario] = useState(0);
  const scenarios = [
    { title: "🚫 Block: Refund > $500", color: "#EF4444",
      steps: [
        { label: "Claude requests: process_refund($750)", bg: "rgba(59,130,246,0.08)" },
        { label: "⚡ PreToolUse hook fires (v2.0+) — can block, modify, or approve", bg: "rgba(245,158,11,0.08)" },
        { label: "Hook checks: $750 > $500 limit → DENY", bg: "rgba(239,68,68,0.08)" },
        { label: "Hook returns: permissionDecision: 'deny'", bg: "rgba(239,68,68,0.08)" },
        { label: "Claude receives: 'Exceeds limit. Use escalate_to_human'", bg: "rgba(239,68,68,0.08)" },
        { label: "Claude calls: escalate_to_human(summary) ✅", bg: "rgba(34,197,94,0.08)" },
      ],
      code: `def pre_tool_hook(tool_name, tool_input, tool_use_id, ctx):
    if tool_name == "process_refund":
        amount = tool_input.get("amount", 0)
        if amount > 500:
            return {
                "permissionDecision": "deny",
                "additionalContext": (
                    f"Refund of \${amount} exceeds $500 limit. "
                    "Use escalate_to_human with refund details."
                )
            }
    return {"permissionDecision": "allow"}` },
    { title: "🔄 Normalize: Unix Timestamps → ISO 8601", color: "#10B981",
      steps: [
        { label: "Claude calls: get_order_status('ORD-789')", bg: "rgba(59,130,246,0.08)" },
        { label: "Tool returns: {created_at: 1705312200, status: 2}", bg: "#1c2333" },
        { label: "⚡ PostToolUse hook fires", bg: "rgba(245,158,11,0.08)" },
        { label: "Hook converts: 1705312200 → '2025-01-15T10:30:00Z'", bg: "rgba(245,158,11,0.08)" },
        { label: "Hook converts: status 2 → 'inactive'", bg: "rgba(245,158,11,0.08)" },
        { label: "Claude sees normalized data ✅", bg: "rgba(34,197,94,0.08)" },
      ],
      code: `def post_tool_hook(tool_name, tool_result, tool_use_id, ctx):
    result = json.loads(tool_result)
    # Normalize Unix timestamps to ISO 8601
    for key in ["created_at", "updated_at"]:
        if key in result and isinstance(result[key], (int, float)):
            result[key] = datetime.fromtimestamp(
                result[key]).isoformat()
    # Normalize status codes to strings
    status_map = {1: "active", 2: "inactive", 3: "suspended"}
    if "status" in result and isinstance(result["status"], int):
        result["status"] = status_map.get(result["status"])
    return {"result": json.dumps(result)}` },
    { title: "🔒 Prerequisite: Verify Customer Before Order Lookup", color: "#3B82F6",
      steps: [
        { label: "Claude requests: lookup_order('ORD-789')", bg: "rgba(59,130,246,0.08)" },
        { label: "⚡ PreToolUse hook fires", bg: "rgba(245,158,11,0.08)" },
        { label: "Hook checks: verified_customer_id is None → DENY", bg: "rgba(239,68,68,0.08)" },
        { label: "Claude calls: get_customer(email='jane@...')", bg: "rgba(59,130,246,0.08)" },
        { label: "⚡ PostToolUse stores: verified_customer_id = 'C-12345'", bg: "rgba(34,197,94,0.08)" },
        { label: "Claude retries: lookup_order with customer_id → ALLOW ✅", bg: "rgba(34,197,94,0.08)" },
      ],
      code: `verified_customer_id = None

def pre_tool_hook(tool_name, tool_input, tool_use_id, ctx):
    global verified_customer_id
    if tool_name == "get_customer":
        return {"permissionDecision": "allow"}
    if tool_name in ["lookup_order", "process_refund"]:
        if verified_customer_id is None:
            return {
                "permissionDecision": "deny",
                "additionalContext": "Must verify customer first."
            }
    return {"permissionDecision": "allow"}

def post_tool_hook(tool_name, tool_result, tool_use_id, ctx):
    global verified_customer_id
    if tool_name == "get_customer":
        result = json.loads(tool_result)
        verified_customer_id = result.get("customer_id")` },
  ];

  const sc = scenarios[scenario];
  return (
    <Section title="Agent SDK Hooks — Interactive Scenarios">
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {scenarios.map((s, i) => (
          <button key={i} onClick={() => setScenario(i)} style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
            border: `2px solid ${scenario === i ? s.color : "rgba(255,255,255,0.12)"}`,
            background: scenario === i ? s.color + "15" : "#161b22",
            color: scenario === i ? s.color : "#9ba8b0",
          }}>{s.title.split(":")[0]}</button>
        ))}
      </div>

      <div style={{ fontSize: 14, fontWeight: 700, color: sc.color, marginBottom: 10 }}>{sc.title}</div>
      <div style={{ display: "grid", gap: 4, marginBottom: 12 }}>
        {sc.steps.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: sc.color + "20", border: `2px solid ${sc.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: sc.color, flexShrink: 0 }}>{i + 1}</div>
            <div style={{ flex: 1, padding: "6px 10px", borderRadius: 6, background: s.bg, fontSize: 12, color: "#9ba8b0", border: "1px solid rgba(255,255,255,0.12)" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <Code>{sc.code}</Code>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
        <InfoBox type="key">PreToolUse: Fires BEFORE tool runs. Can block (deny), allow, modify input (updatedInput), or ask user. Use for enforcement, validation, redirection.</InfoBox>
        <InfoBox type="key">PostToolUse: Fires AFTER tool runs. Can normalize output, add context (additionalContext). Cannot undo actions. Use for data transformation, auditing.</InfoBox>
      </div>
      <InfoBox type="exam">Hooks run in YOUR application process — they consume ZERO context window tokens. They are invisible to Claude. This makes them fundamentally different from prompt instructions.</InfoBox>
    </Section>
  );
}

// ═══════════════════════════════════════
// ENFORCEMENT: HOOKS vs PROMPTS
// ═══════════════════════════════════════
function Enforcement() {
  return (
    <Section title="Programmatic Enforcement vs Prompt-Based Guidance" color="#EF4444">
      <InfoBox type="exam">This is THE most tested concept in Domain 1. When the question mentions financial consequences, regulatory requirements, or compliance — the answer is ALWAYS programmatic hooks, never prompt-only.</InfoBox>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <div style={{ padding: 14, background: "rgba(34,197,94,0.08)", borderRadius: 10, border: "2px solid #22C55E" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#86efac", marginBottom: 10 }}>✅ Hooks (Deterministic)</div>
          <div style={{ fontSize: 12, color: "#86efac", lineHeight: 1.6 }}>
            100% compliance rate. Physically impossible to bypass. Tool call is blocked before execution. Works regardless of prompt wording, context length, or model behavior.
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#86efac", marginTop: 8 }}>Use for:</div>
          <div style={{ fontSize: 12, color: "#86efac", lineHeight: 1.6 }}>
            Identity verification before financial ops. Refund limits. PII handling. Regulatory compliance. Any rule that MUST be followed 100% of the time.
          </div>
        </div>
        <div style={{ padding: 14, background: "rgba(239,68,68,0.08)", borderRadius: 10, border: "2px solid #EF4444" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#f87171", marginBottom: 10 }}>⚠️ Prompts (Probabilistic)</div>
          <div style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.6 }}>
            ~88-95% compliance rate. Non-zero failure rate. Claude may skip instructions under certain contexts, long conversations, or ambiguous situations.
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#f87171", marginTop: 8 }}>Use for:</div>
          <div style={{ fontSize: 12, color: "#fca5a5", lineHeight: 1.6 }}>
            Code style preferences. Best practices suggestions. Tone and formatting guidelines. Any rule where occasional non-compliance is acceptable.
          </div>
        </div>
      </div>

      <Section title="Decision Framework">
        <div style={{ display: "grid", gap: 6 }}>
          {[
            { scenario: "Identity verification before refund", answer: "HOOKS", color: "#22C55E", why: "Financial consequences if skipped" },
            { scenario: "Block refunds > $500", answer: "HOOKS", color: "#22C55E", why: "Business rule requires 100% enforcement" },
            { scenario: "Prefer async/await over callbacks", answer: "PROMPT", color: "#3B82F6", why: "Style preference, not compliance" },
            { scenario: "Always use parameterized SQL queries", answer: "HOOKS", color: "#22C55E", why: "Security — SQL injection prevention" },
            { scenario: "Add JSDoc to public functions", answer: "PROMPT", color: "#3B82F6", why: "Best practice, not critical" },
            { scenario: "PII masking before logging", answer: "HOOKS", color: "#22C55E", why: "Regulatory requirement" },
          ].map((r, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: 8, borderRadius: 6, background: r.color + "08", border: `1px solid ${r.color}22`, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: r.color, minWidth: 60 }}>{r.answer}</span>
              <span style={{ fontSize: 12, color: "#9ba8b0", flex: 1 }}>{r.scenario}</span>
              <span style={{ fontSize: 11, color: "#9ba8b0" }}>{r.why}</span>
            </div>
          ))}
        </div>
      </Section>
    </Section>
  );
}

// ═══════════════════════════════════════
// TASK DECOMPOSITION
// ═══════════════════════════════════════
function Decomposition() {
  return (
    <Section title="Task Decomposition Strategies">
      <StepFlow steps={[
        { label: "Prompt Chaining", title: "Fixed Sequential Pipeline (Prompt Chaining)", color: "#3B82F6",
          content: "Steps are predetermined and predictable. Best for multi-aspect reviews where all steps are known in advance. Each step feeds its output to the next.",
          code: `# Code Review Pipeline (fixed sequence):
Step 1: Per-file local analysis (each file individually)
Step 2: Cross-file integration pass (data flow between files)
Step 3: Compile structured findings report

# The steps don't change based on what's discovered.
# Every PR gets the same pipeline.` },
        { label: "Dynamic Decomp", title: "Dynamic Adaptive Decomposition", color: "#10B981",
          content: "Steps are generated based on what's discovered. Best for open-ended investigation tasks where required steps can't be predicted. The plan adapts as dependencies emerge.",
          code: `# Legacy Codebase Test Coverage (adaptive):
Step 1: Map project structure → discovers 20 modules
Step 2: Identify high-impact areas → auth, payments (most complex)
Step 3: Create prioritized test plan for auth module
Step 4: Implement auth tests → discover hidden dependency on sessions
Step 5: UPDATE PLAN → add session testing first
Step 6: Implement session tests → then back to auth
# Plan changes based on discoveries!` },
        { label: "Per-File + Cross-File", title: "Per-File Local + Cross-File Integration", color: "#8B5CF6",
          content: "For large PRs (7+ files), split into focused passes to avoid attention dilution. First analyze each file individually (consistent depth), then run a cross-file pass for integration issues.",
          code: `# 14-file PR review:

# PASS 1 — Local Analysis (parallel, per file):
file1.py → [finding1, finding2]
file2.py → [finding3]
...
file14.py → [finding20]

# PASS 2 — Cross-File Integration:
"Does auth.ts export match what users.ts imports?"
"Are error types handled consistently across modules?"
"Do database queries match the schema?"` },
      ]} />

      <InfoBox type="exam">When a single-pass review of 14 files produces inconsistent depth and contradictory findings, the correct fix is ALWAYS "split into per-file + cross-file passes" — not a larger context window, not requiring smaller PRs, not consensus-based filtering.</InfoBox>
    </Section>
  );
}

// ═══════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════
function SessionMgmt() {
  return (
    <Section title="Session State, Resumption, and Forking">
      <StepFlow steps={[
        { label: "--resume", title: "Named Session Resumption", color: "#3B82F6",
          content: "Continue a specific prior conversation with all its context. Use when the codebase hasn't changed significantly since the last session. The agent picks up exactly where it left off.",
          code: `# CLI
claude --resume "auth-refactor"  # Named session
claude --resume                   # Most recent session

# Python SDK
async for msg in query(
    prompt="Continue analyzing the remaining modules",
    options=ClaudeAgentOptions(
        resume=session_id,  # From ResultMessage.session_id
    ),
): ...

// TypeScript SDK
for await (const msg of query({
  prompt: "Continue the analysis",
  options: { resume: sessionId },
})) { ... }` },
        { label: "fork_session", title: "Fork Session (Parallel Branches)", color: "#10B981",
          content: "Create independent branches from a shared analysis baseline. Both branches have the shared context but diverge from there. The original session is untouched and can still be resumed independently.",
          code: `# Python: Fork from existing session
async for msg in query(
    prompt="Try OAuth2 approach instead",
    options=ClaudeAgentOptions(
        resume=session_id,      # Original session
        fork_session=True,      # Create new branch
    ),
): ...
# Original session unchanged!
# Forked session has new ID.

// TypeScript
for await (const msg of query({
  prompt: "Try GraphQL approach",
  options: { resume: sessionId, forkSession: true },
})) { ... }` },
        { label: "Fresh + Summary", title: "Fresh Session with Injected Summaries", color: "#F59E0B",
          content: "When prior tool results are stale (files changed significantly), start fresh and inject a structured summary. MORE RELIABLE than resuming with stale context because Claude won't reason based on outdated file contents.",
          code: `# When codebase changed significantly overnight:
summary = """
Previous analysis found:
- 15 modules with circular dependencies
- Auth module: 3 critical vulnerabilities
- Database layer: deprecated connection pooling

CHANGED SINCE LAST SESSION:
- auth.py: Complete rewrite (JWT → OAuth2)
- db.py: Connection pool upgraded
- utils.py: Helper functions moved

Please re-analyze auth.py, db.py, utils.py specifically.
"""
async for msg in query(
    prompt=summary,
    options=ClaudeAgentOptions(),  # Fresh session, no resume
): ...` },
        { label: "/compact", title: "Compact Context During Long Sessions", color: "#8B5CF6",
          content: "Summarizes conversation to reduce context usage. Auto-triggers at ~95% capacity. Preserves key decisions and findings but may lose detailed early instructions. Persistent rules should live in CLAUDE.md, not the initial prompt.",
          code: `# Manual: type /compact in Claude Code
# With custom focus:
/compact Focus on the API migration plan

# Auto-trigger: at ~95% context capacity
# Emits SystemMessage with subtype "compact_boundary"
# CLAUDE.md is re-read from disk after compact
# (so persistent rules survive compaction)

# PreCompact hook fires before compaction:
# trigger: "manual" | "auto"
# pre_tokens: count before compact` },
      ]} />

      <InfoBox type="exam">Decision: Resume when context is mostly valid. Fork when exploring alternatives from shared baseline. Fresh + summary when files changed significantly. /compact when context fills during long sessions.</InfoBox>
    </Section>
  );
}

// ═══════════════════════════════════════
// ANTI-PATTERNS
// ═══════════════════════════════════════
function AntiPatterns() {
  const patterns = [
    { title: "Parsing Natural Language for Loop Termination", domain: "D1",
      wrong: `while True:
    response = call_claude(messages)
    if "I have completed" in response.text:  # ❌
        break
    if "task is done" in response.text.lower():  # ❌
        break`,
      right: `while True:
    response = call_claude(messages)
    if response.stop_reason == "end_turn":  # ✅
        return extract_text(response)
    # continue if stop_reason == "tool_use"`,
      why: "Claude's text is non-deterministic. It might phrase completion differently each time, or include 'done' while still needing tools. stop_reason is the ONLY reliable signal." },
    { title: "Arbitrary Iteration Caps as Primary Mechanism", domain: "D1",
      wrong: `for i in range(5):  # ❌ Primary control
    response = call_claude(messages)
    process(response)
# Might cut off too early or run too long`,
      right: `options = ClaudeAgentOptions(
    max_turns=20,  # ✅ SAFETY NET only
    max_budget_usd=1.00,
)
# Loop STILL terminates via stop_reason
# max_turns is backup, not primary`,
      why: "Fixed iteration caps either truncate tasks too early or waste tokens. max_turns as a SAFETY NET is fine; as the PRIMARY mechanism, it's wrong." },
    { title: "Checking Text Content as Completion Signal", domain: "D1",
      wrong: `if any(b.type == "text" for b in response.content):  # ❌
    return extract_text(response)
# Claude often emits text ALONGSIDE tool_use!`,
      right: `# Claude's response can contain BOTH text and tool_use:
# [text: "Let me check...", tool_use: lookup_order]
# Only stop_reason tells you if Claude is done.
if response.stop_reason == "end_turn":  # ✅
    return extract_text(response)`,
      why: "Claude frequently includes explanatory text alongside tool calls. The presence of text doesn't mean the task is complete." },
    { title: "Assuming Subagents Inherit Coordinator Context", domain: "D1",
      wrong: `# After coordinator discusses findings...
synthesis_prompt = "Synthesize the findings"
# ❌ Subagent has NO context about what
# "the findings" are!`,
      right: `synthesis_prompt = f"""
Synthesize these specific findings:
{json.dumps(search_results)}
{json.dumps(analysis_results)}
Preserve all source attribution.
"""  # ✅ Explicitly pass everything`,
      why: "Subagents start with a fresh, isolated context window. They don't see anything the coordinator discussed. Every piece of needed context must be in the subagent's prompt." },
    { title: "Using Prompt Instructions for Financial Compliance", domain: "D1+D2",
      wrong: `system_prompt = \"\"\"
IMPORTANT: Always verify customer identity
before processing any refund.
\"\"\"
# ❌ ~88% compliance. 12% failure = financial risk`,
      right: `# PreToolUse hook blocks process_refund
# until get_customer has succeeded.
# 100% compliance. Deterministic. Zero exceptions.
def pre_tool_hook(tool_name, tool_input):
    if tool_name == "process_refund":
        if not verified_customer_id:
            return {"permissionDecision": "deny"}
    return {"permissionDecision": "allow"}`,
      why: "Prompt instructions have a non-zero failure rate. When errors have financial consequences, programmatic enforcement (hooks) provides deterministic guarantees." },
    { title: "Generic Tool Descriptions Causing Misrouting", domain: "D2",
      wrong: `get_customer: "Retrieves customer information"
lookup_order: "Retrieves order details"
# ❌ Nearly identical. 50% misrouting.`,
      right: `get_customer: "Look up customer by email or phone.
  Returns ID, name, status, tier. Use BEFORE any
  order lookups. Input: email or phone required."
lookup_order: "Get order details by order ID.
  Requires verified customer_id from get_customer.
  Returns items, amounts, status, shipping."
# ✅ Clear purpose, inputs, boundaries.`,
      why: "Tool descriptions are the #1 mechanism for selection. When they're minimal, Claude can't differentiate similar tools. The first fix is ALWAYS to expand descriptions." },
  ];

  return (
    <Section title="Anti-Patterns Reference (These ARE the Wrong Answers)" color="#EF4444">
      <div style={{ fontSize: 13, color: "#9ba8b0", marginBottom: 12 }}>Every anti-pattern below appears as a distractor (wrong answer) on the exam. Know WHY each is wrong.</div>
      <div style={{ display: "grid", gap: 12 }}>
        {patterns.map((p, i) => (
          <div key={i} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)", overflow: "hidden" }}>
            <div style={{ padding: "8px 14px", background: "#1c2333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e0e0e0" }}>⚠️ {p.title}</div>
              <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(59,130,246,0.08)", color: "#93c5fd" }}>{p.domain}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <div style={{ padding: 10, background: "rgba(239,68,68,0.08)", borderRight: "1px solid rgba(255,255,255,0.12)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#f87171", marginBottom: 4 }}>❌ Wrong Pattern</div>
                <Code>{p.wrong}</Code>
              </div>
              <div style={{ padding: 10, background: "rgba(34,197,94,0.08)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#86efac", marginBottom: 4 }}>✅ Correct Pattern</div>
                <Code>{p.right}</Code>
              </div>
            </div>
            <div style={{ padding: "8px 14px", background: "rgba(245,158,11,0.08)", fontSize: 12, color: "#fcd34d" }}>
              <strong>Why:</strong> {p.why}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// ═══════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("loop");

  const content = {
    loop: <AgenticLoop />,
    stop: <StopReasonMap />,
    multi: <MultiAgent />,
    context: <ContextPassing />,
    hooks: <HooksSystem />,
    enforce: <Enforcement />,
    decomp: <Decomposition />,
    session: <SessionMgmt />,
    anti: <AntiPatterns />,
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", maxWidth: 780, margin: "0 auto", padding: "12px 10px", background: "#0d1117", color: "#e0e0e0", borderRadius: 8 }}>
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: "#e0e0e0", margin: 0 }}>Domain 1: Agentic Architecture &amp; Orchestration</h1>
        <div style={{ fontSize: 12, color: "#60a5fa", fontWeight: 600 }}>27% of exam — Highest priority domain</div>
      </div>

      <div style={{ display: "flex", gap: 3, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "5px 8px", borderRadius: 6, whiteSpace: "nowrap", fontSize: 11, fontWeight: 600, cursor: "pointer",
            border: `2px solid ${tab === t.id ? "#3B82F6" : "rgba(255,255,255,0.12)"}`,
            background: tab === t.id ? "rgba(59,130,246,0.15)" : "#161b22",
            color: tab === t.id ? "#60a5fa" : "#9ba8b0",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background: "#161b22", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", padding: 16 }}>
        {content[tab]}
      </div>
    </div>
  );
}
