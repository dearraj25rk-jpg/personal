import { useState } from "react";

/* ════════════════════════════════════════════════════════════
   Claude Code Context, Cost & Token Efficiency — Interactive Guide
   June 2026 · v2.1.126 · Updated 2026-06-07
   No external library imports — only React + inline styles
   ════════════════════════════════════════════════════════════ */

const TABS = [
  { id: "context",       label: "Context Window", icon: "◎" },
  { id: "caching",       label: "Prompt Caching",  icon: "⚡" },
  { id: "toolsearch",    label: "ToolSearch",       icon: "🔍" },
  { id: "models",        label: "Model Selection",  icon: "◆" },
  { id: "effort",        label: "Effort & Bare",    icon: "⏱" },
  { id: "output-styles", label: "Output Styles",    icon: "✍" },
  { id: "claudemd",      label: "CLAUDE.md",        icon: "📄" },
  { id: "hooks",         label: "Hooks",            icon: "🔗" },
  { id: "agents",        label: "Agents & Teams",   icon: "👥" },
  { id: "compaction",    label: "Compaction",       icon: "🗜" },
  { id: "batch",         label: "Batch & Schedule", icon: "⚙" },
  { id: "cheatsheet",    label: "Cheat Sheet",      icon: "🎯" },
];

const CcafBadge = ({ domain }) => (
  <span style={{display:"inline-block",fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:3,marginLeft:8,background:"rgba(0,212,106,0.12)",color:"#00d46a",border:"1px solid rgba(0,212,106,0.25)",letterSpacing:0.5,verticalAlign:"middle"}}>CCA-F D{domain}</span>
);
const Code = ({ children }) => (
  <code style={{background:"rgba(255,255,255,0.06)",padding:"2px 6px",borderRadius:3,fontSize:12,fontFamily:"monospace",color:"#f0c674",border:"1px solid rgba(255,255,255,0.08)"}}>{children}</code>
);
const CodeBlock = ({ code, title }) => (
  <div style={{margin:"12px 0",borderRadius:6,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)"}}>
    {title && <div style={{background:"rgba(255,255,255,0.04)",padding:"6px 12px",fontSize:11,color:"#888",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>{title}</div>}
    <pre style={{background:"rgba(0,0,0,0.3)",padding:14,margin:0,fontSize:11.5,fontFamily:"monospace",color:"#c5c8c6",overflowX:"auto",lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{code}</pre>
  </div>
);
const Metric = ({ label, value, sub, color = "#00d46a" }) => (
  <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"14px 16px",flex:"1 1 130px",minWidth:130}}>
    <div style={{fontSize:10,color:"#777",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
    <div style={{fontSize:20,fontWeight:700,color,fontFamily:"monospace"}}>{value}</div>
    {sub && <div style={{fontSize:11,color:"#666",marginTop:4}}>{sub}</div>}
  </div>
);
const Section = ({ title, children, badge, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{marginBottom:10,border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,overflow:"hidden"}}>
      <div onClick={() => setOpen(!open)} style={{padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",background:open?"rgba(255,255,255,0.04)":"transparent",transition:"background 0.2s"}}>
        <span style={{fontSize:12,color:"#555",marginRight:10,transition:"transform 0.2s",transform:open?"rotate(90deg)":"rotate(0)",display:"inline-block"}}>▶</span>
        <span style={{fontSize:14,fontWeight:600,color:"#e0e0e0",flex:1}}>{title}</span>
        {badge}
      </div>
      {open && <div style={{padding:"4px 16px 16px",lineHeight:1.75,fontSize:13,color:"#bbb"}}>{children}</div>}
    </div>
  );
};
const Table = ({ headers, rows }) => (
  <div style={{overflowX:"auto",margin:"12px 0"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11.5,fontFamily:"monospace"}}>
      <thead><tr>{headers.map((h,i) => <th key={i} style={{textAlign:"left",padding:"8px 10px",borderBottom:"2px solid rgba(255,255,255,0.1)",color:"#888",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row,ri) => (<tr key={ri} style={{background:ri%2===0?"transparent":"rgba(255,255,255,0.02)"}}>{row.map((cell,ci) => <td key={ci} style={{padding:"7px 10px",borderBottom:"1px solid rgba(255,255,255,0.04)",color:"#ccc"}}>{cell}</td>)}</tr>))}</tbody>
    </table>
  </div>
);
const Callout = ({ type = "info", children }) => {
  const c = {info:"#4d9de0",warn:"#f5a623",tip:"#00d46a",exam:"#a78bfa",danger:"#ef4444"};
  const ic = {info:"ℹ️",warn:"⚠️",tip:"💡",exam:"📝",danger:"🚨"};
  return <div style={{margin:"12px 0",padding:"12px 14px",borderRadius:6,background:`${c[type]}11`,borderLeft:`3px solid ${c[type]}`,fontSize:13,color:"#ccc",lineHeight:1.7}}><span style={{marginRight:8}}>{ic[type]}</span>{children}</div>;
};

// ─── TABS ───────────────────────────────────────────────
function ContextTab() {
  return (<>
    <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16}}>
      <Metric label="Standard Window" value="200K" sub="tokens (all models)" />
      <Metric label="Extended Window" value="1M" sub="Opus 4.7, Sonnet 4.6 — standard pricing" color="#a78bfa" />
      <Metric label="Avg Cost/Dev/Day" value="~$6" sub="90th percentile under $12" color="#f59e0b" />
    </div>
    <Section title="What fills the context window (token anatomy)" badge={<CcafBadge domain={5} />} defaultOpen>
      <p>Claude Code is <strong style={{color:"#fff"}}>stateless between turns</strong>. Every API call resends the entire payload from scratch — system prompt, tool definitions, CLAUDE.md, memory, conversation history. The context is reconstructed each turn in deliberate order (most stable first for cache optimization):</p>
      <CodeBlock title="Context reconstruction order — every single turn" code={`┌─────────────────────────────────────────────────────┐
│ 1. Tool definitions         (all built-in + MCP)    │ ← Shared across ALL users
│ 2. System prompt            (Anthropic internal)    │ ← Shared across users
│ 3. CLAUDE.md content        (project hierarchy)     │ ← Shared per-project
│ 4. Auto-memory              (MEMORY.md, ≤200 lines) │ ← Per-project
│ 5. Loaded skill descriptions                        │ ← On-demand (when invoked)
│ 6. MCP server instructions                          │ ← Per-session config
│ 7. Conversation history     (all messages + results) │ ← Unique & grows
│ 8. Path-scoped .claude/rules/                       │ ← On-demand per dir
└─────────────────────────────────────────────────────┘
Reserved: 33K–45K token "buffer" for system overhead`} />
      <Callout type="warn"><strong>Hidden costs:</strong> GitHub MCP (91 tools) = ~46K tokens = 23% of 200K window. A 5,000-token CLAUDE.md = 5,000 tokens on every turn. Studies show 40–60% of Read tokens are redundant re-reads. <strong>With effective caching, output tokens (billed at 5× input rate, no cache benefit) can drive 70–85% of dollar costs.</strong></Callout>
      <Callout type="exam"><strong>CCA-F D5 (15% weight):</strong> Input tokens = 85–92% of token count but output dominates dollar cost when caching is working well. Any context reduction compounds across every subsequent turn.</Callout>
    </Section>
    <Section title="Monitoring commands" badge={<CcafBadge domain={2} />}>
      <Table headers={["Command","Shows","When to use"]} rows={[
        ["/context","Live breakdown: system, tools, MCP, agents, skills, messages, free space","Before complex tasks — check headroom"],
        ["/usage","Per-model input/output/cache-read/cache-write + $ cost with cache-hit accounting (v2.1.118) — replaces /cost","Periodically to track spend"],
        ["/memory","Loaded memory files, per-file token costs, toggle/edit shortcuts","Audit memory token overhead"],
        ["/debug","Session internals: context sections, hook state, MCP connections, deferred tools","Diagnosing unexpected bloat"],
        ["/clear","Reset conversation, keep tools + CLAUDE.md + memory","Between unrelated tasks — highest-impact habit"],
        ["/compact [focus]","Summarize conversation with optional focus topic","Context filling but task not done"],
        ["Esc+Esc or /rewind","Partial compaction — select checkpoint","When only recent context matters"],
      ]} />
      <Callout type="warn"><strong>/cost was renamed /usage in v2.1.118.</strong> Any doc or guide that still references /cost is outdated.</Callout>
    </Section>
  </>);
}

function CachingTab() {
  const [turns, setTurns] = useState(20);
  const [ctxK, setCtxK] = useState(100);
  const [hitRate, setHitRate] = useState(90);
  const [model, setModel] = useState("sonnet");
  // Opus 4.7 = $5/MTok input, Sonnet 4.6 = $3/MTok, Haiku 4.5 = $1/MTok
  const rate = model==="opus"?5:model==="sonnet"?3:1;
  const noCacheCost = (ctxK*1000*turns*rate)/1e6;
  const withCacheCost = ((ctxK*1000*(1-hitRate/100)*rate*1.25)+(ctxK*1000*(hitRate/100)*rate*0.1))*turns/1e6;
  const savings = noCacheCost>0?((1-withCacheCost/noCacheCost)*100).toFixed(1):0;

  return (<>
    <Section title="How prompt caching works" badge={<CcafBadge domain={5} />} defaultOpen>
      <p>Per Thariq Shihipar (Claude Code engineering): <em style={{color:"#999"}}>"We build our entire harness around prompt caching. We run alerts on cache hit rate and declare SEVs if they're too low."</em></p>
      <p>The system stores <strong>KV attention cache tensors</strong> server-side. When a request shares the same byte-level prefix, the model skips recomputation. The 5-minute TTL refreshes on every hit. Caches are <strong>per-model</strong> — switching models = full cache miss.</p>
      <Callout type="tip"><strong>Why output tokens dominate dollar costs at high hit rates:</strong> Cached input = $0.30/MTok (Sonnet). Output = $15.00/MTok. At 90% cache hit rate, output tokens are <strong>50× more expensive per token</strong> than cached input. Use Output Styles (Terse tab) to cut output volume.</Callout>
    </Section>
    <Section title="Pricing multipliers (June 2026)" badge={<CcafBadge domain={5} />}>
      <Table headers={["Type","Multiplier","Sonnet 4.6","Opus 4.7/4.8","Haiku 4.5"]} rows={[
        ["Standard input","1.0×","$3/MTok","$15/MTok","$0.80/MTok"],
        ["5-min cache write","1.25×","$3.75/MTok","$18.75/MTok","$1.00/MTok"],
        ["1-hour cache write","2.0×","$6/MTok","$30/MTok","$1.60/MTok"],
        ["Cache read (hit)","0.1×","$0.30/MTok","$1.50/MTok","$0.08/MTok"],
        ["Output","—","$15/MTok","$75/MTok","$4/MTok"],
      ]} />
      <Callout type="info"><strong>Model lineup (June 2026, v2.1.126+):</strong> claude-opus-4-8 is the newest Opus model and holds the <code>opus</code> alias. All Opus models (4.6, 4.7, 4.8) share the same pricing tier ($15/$75 input/output). Opus 4.7 and 4.8 have 1M context; Opus 4.6 has 200K. Sonnet 4.6 ($3/$15) is the default and best daily driver. Haiku 4.5 ($0.80/$4) for bulk/CI workloads.</Callout>
    </Section>
    <Section title="Interactive cache savings calculator">
      <div style={{display:"flex",flexWrap:"wrap",gap:8,margin:"10px 0"}}>
        {["sonnet","opus","haiku"].map(m=>(
          <button key={m} onClick={()=>setModel(m)} style={{padding:"5px 12px",fontSize:11,fontFamily:"inherit",border:model===m?"1px solid #00d46a":"1px solid #333",background:model===m?"rgba(0,212,106,0.1)":"transparent",color:model===m?"#00d46a":"#888",borderRadius:4,cursor:"pointer",textTransform:"capitalize"}}>{m}</button>
        ))}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:16,margin:"12px 0"}}>
        {[{l:"Turns",v:turns,s:setTurns,mn:1,mx:100},{l:"Context (K tokens)",v:ctxK,s:setCtxK,mn:10,mx:1000},{l:"Cache hit %",v:hitRate,s:setHitRate,mn:0,mx:99}].map(({l,v,s,mn,mx})=>(
          <div key={l} style={{flex:"1 1 160px"}}><div style={{fontSize:11,color:"#888",marginBottom:4}}>{l}: <strong style={{color:"#fff"}}>{v}</strong></div><input type="range" min={mn} max={mx} value={v} onChange={e=>s(+e.target.value)} style={{width:"100%",accentColor:"#00d46a"}} /></div>
        ))}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
        <Metric label={`No caching (${model})`} value={`$${noCacheCost.toFixed(2)}`} color="#ef4444" />
        <Metric label="With caching" value={`$${withCacheCost.toFixed(2)}`} color="#00d46a" />
        <Metric label="Savings" value={`${savings}%`} color="#f59e0b" />
      </div>
    </Section>
    <Section title="The --resume cache regression (v2.1.69→v2.1.90)" badge={<CcafBadge domain={2} />}>
      <p><strong>Root cause:</strong> Session resume stripped <Code>deferred_tools_delta</Code> and <Code>mcp_instructions_delta</Code> attachments. Tools got re-announced → new messages shifted prefix hash → cache miss on entire history → <strong>~20× cost increase</strong>. Fixed v2.1.90.</p>
      <Callout type="exam">This bug connects D4 (ToolSearch), D5 (prompt caching), and D2 (session management) — three CCA-F domains in one failure.</Callout>
    </Section>
    <Section title="Rules for maximizing cache hits" badge={<CcafBadge domain={5} />}>
      <Table headers={["Rule","Why","Cost of violation"]} rows={[
        ["Never modify system prompt mid-session","Shifts prefix hash","1.25× write on entire context"],
        ["Never switch models mid-session","Per-model caches","Full rebuild + write cost"],
        ["Never add/remove tools mid-session","Tool defs in prefix","Prefix invalidation"],
        ["Keep messages within 5-min TTL","Cache expires idle","Full cold start"],
        ["Disable unused MCP servers via /mcp","Extra schema tokens","Wasted prefix tokens"],
        ["Prefer CLI tools (gh, aws) over MCP","No listing overhead","Extra schema tokens"],
        ["Use subagents for different-model tasks","Parent cache stays warm","Model switch kills cache"],
        ["Use model: frontmatter in skills","Cache-safe per-command routing","Avoids /model switch mid-session"],
      ]} />
    </Section>
  </>);
}

function ToolSearchTab() {
  return (<>
    <Section title="Architecture" badge={<CcafBadge domain={4} />} defaultOpen>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:14}}>
        <Metric label="Token reduction" value="85%+" sub="tool definition tokens" />
        <Metric label="Accuracy" value="79→88%" sub="Opus tool selection" color="#a78bfa" />
        <Metric label="Max catalog" value="10,000" sub="tools" color="#f59e0b" />
      </div>
      <p>ToolSearch (v2.1.7, Jan 2026) activates when MCP tool descriptions exceed <strong>10K tokens</strong>. It builds a lightweight index at startup, sends MCP tools as stubs, and discovers full definitions on-demand.</p>
      <CodeBlock title="Critical design: where tool_reference blocks go" code={`Discovered tool definitions → CONVERSATION HISTORY
                          ↓
              NOT into tool definitions prefix
                          ↓
          Cached prefix hash stays UNTOUCHED
                          ↓
    ToolSearch + prompt caching work TOGETHER ✓`} />
      <Callout type="exam"><strong>CCA-F most elegant design tradeoff:</strong> tool_reference blocks in conversation history (not prefix) means discovery never invalidates the cache. Frequently tested.</Callout>
    </Section>
    <Section title="Configuration" badge={<CcafBadge domain={4} />}>
      <CodeBlock title=".mcp.json control" code={`{
  "mcpServers": {
    "critical-server": {
      "command": "...",
      "enableToolSearch": false  // eager loading for always-needed tools
    }
  }
}
// Tool descriptions capped at 2KB (v2.1.84)
// Only mcp__ prefix tools eligible for deferral
// Built-in tools (Read, Edit, Bash) never deferred
// Vertex AI: ToolSearch off by default — opt in with ENABLE_TOOL_SEARCH=1`} />
    </Section>
    <Section title="ToolSearch failure modes" badge={<CcafBadge domain={4} />}>
      <Table headers={["Variant","Failure","Fix"]} rows={[
        ["regex","Patterns >200 chars silently truncated — empty/wrong results","Use short high-entropy patterns: (?i)finance|billing"],
        ["BM25","Long server names dominate scoring, crowding out capability keywords","Strip server name prefix from query: use 'navigate evaluate' not 'amazon-bedrock-... navigate evaluate'"],
        ["Both","Tools with similar names confuse ranking","Keep tool names distinctly different: get_user_single not get_user"],
      ]} />
    </Section>
  </>);
}

function ModelsTab() {
  return (<>
    <Section title="Model matrix (June 2026)" badge={<CcafBadge domain={2} />} defaultOpen>
      <Table headers={["Model","Input / Output (per 1M)","Context","Best For"]} rows={[
        ["claude-opus-4-8 ★ (opus alias)","$15 / $75","1M","Newest, most capable — frontier reasoning, novel architecture, hardest 5% of problems"],
        ["claude-opus-4-7","$15 / $75","1M","Complex reasoning, architecture, xhigh effort default; 1M context window"],
        ["claude-opus-4-6","$15 / $75","200K","Opus-tier for tasks not needing 1M context"],
        ["claude-sonnet-4-6 ✓ (sonnet alias)","$3 / $15","200K","Recommended daily driver — best quality/cost; handles ~90% of coding tasks"],
        ["claude-haiku-4-5 (haiku alias)","$0.80 / $4","200K","Fast, cheap; subagent tasks, CI/CD, linting, classification"],
      ]} />
      <Callout type="tip"><strong>Sonnet 4.6 is the recommended daily driver</strong> — 5× cheaper input than Opus at similar task quality for most coding tasks. Use <Code>claude-sonnet-4-6</Code> as default, <Code>claude-haiku-4-5</Code> for subagents and bulk CI work, <Code>claude-opus-4-8</Code> for the hardest problems where quality matters most.</Callout>
      <Callout type="info"><strong>Pricing note:</strong> All Opus models (4.6, 4.7, 4.8) share the same $15/$75 price tier. The differentiation is capability and context window, not cost.</Callout>
    </Section>
    <Section title="opusplan — highest ROI strategy" badge={<CcafBadge domain={2} />}>
      <CodeBlock code={`claude --model opusplan
# Plan mode (Shift+Tab×2) → Opus (deep reasoning)
# Implementation mode → Sonnet (40% cheaper input)
# Cache managed internally — no manual switching needed
# Avoids cache invalidation from manual /model switch`} />
    </Section>
    <Section title="Thinking token costs (hidden output cost)" badge={<CcafBadge domain={2} />}>
      <p>Extended thinking tokens come from the <strong>output budget</strong> and are billed at output rates ($15–25/MTok). Default ~32K thinking = $0.75/turn on Sonnet, $0.80/turn on Opus 4.7.</p>
      <CodeBlock code={`export MAX_THINKING_TOKENS=10000
# Recovers output capacity AND cuts thinking cost ~70%
# Single highest-ROI environment variable
# Use "ultrathink" in prompt for one-off deep reasoning
# Opus 4.7: MAX_THINKING_TOKENS has no effect (always adaptive)`} />
    </Section>
    <Section title="Subagent model routing" badge={<CcafBadge domain={1} />}>
      <CodeBlock code={`export CLAUDE_CODE_SUBAGENT_MODEL=haiku  # global default (~80% cheaper vs Opus)
claude --model sonnet  # main session

# Per-subagent override in frontmatter (.claude/agents/security-scan.md):
---
name: security-scan
model: opus        # override for complex tasks
effort: high
---

# Priority: frontmatter > CLAUDE_CODE_SUBAGENT_MODEL > "inherit"`} />
    </Section>
  </>);
}

function EffortTab() {
  return (<>
    <Section title="Effort levels (v2.1.126)" badge={<CcafBadge domain={2} />} defaultOpen>
      <Table headers={["Level","Thinking tokens","Use case","Token impact"]} rows={[
        ["low","0–500 (often skipped)","Formatting, linting, lookups, file moves","Saves thousands/turn"],
        ["medium","1K–8K (adaptive)","Most coding tasks","Standard allocation"],
        ["high","8K–32K","Complex debugging, architecture decisions","2–4× more thinking"],
        ["xhigh","32K–80K (Opus 4.7)","Very hard problems, cross-system refactors","5–10× medium"],
      ]} />
      <Callout type="warn"><strong>max effort was removed in v2.1.72.</strong> xhigh is the new maximum ceiling, added by v2.1.126. Default for Pro/Max users on Opus 4.6/Sonnet 4.6: high (raised in v2.1.117). Opus 4.7 always defaults to xhigh.</Callout>
      <CodeBlock title="Priority order" code={`CLAUDE_CODE_EFFORT_LEVEL env var (highest)
→ skill/subagent frontmatter
→ session /effort command
→ model default (high for API/pro tiers; xhigh for Opus 4.7)
→ "ultrathink" in prompt = high for one turn only`} />
    </Section>
    <Section title="Adaptive thinking (v2.1.74, default since Feb 2026)" badge={<CcafBadge domain={2} />}>
      <p>Opus 4.6 and Sonnet 4.6 dynamically decide thinking tokens per-turn rather than using a fixed budget. A lookup uses ~500 tokens; a multi-file refactor might use 20K. Opus 4.7 always uses adaptive reasoning — <Code>CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING</Code> has no effect on it.</p>
      <CodeBlock code={`# Revert to fixed budget (Opus 4.6 / Sonnet 4.6 only)
export CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1
export MAX_THINKING_TOKENS=10000   # fixed ceiling when adaptive is off

# For costs spiking since v2.1.117 upgrade:
export CLAUDE_CODE_EFFORT_LEVEL=medium  # revert from new 'high' default`} />
    </Section>
    <Section title="--bare mode" badge={<CcafBadge domain={2} />}>
      <p>Skips: hooks, LSP, plugin sync, skill walks, MCP servers, auto-memory, CLAUDE.md, OAuth. Only Bash + Read + Edit available. ~14% faster startup.</p>
      <CodeBlock code={`git diff origin/main...HEAD | claude -p "Review" \\
  --bare --allowedTools "Bash(git:*),Read" \\
  --output-format json

# Add context without touching CLAUDE.md prefix:
claude -p "Fix lint errors" --bare \\
  --append-system-prompt "Use ESLint from .eslintrc"
# --append-system-prompt is ephemeral — does not bloat CLAUDE.md`} />
    </Section>
  </>);
}

function OutputStylesTab() {
  const [style, setStyle] = useState("terse");
  const styles = {
    terse:    { mult: 0.3, label: "Terse",       color: "#00d46a" },
    minimal:  { mult: 0.5, label: "Minimal",     color: "#4d9de0" },
    default:  { mult: 1.0, label: "Default",     color: "#f59e0b" },
    explain:  { mult: 2.0, label: "Explanatory", color: "#f5a623" },
    arch:     { mult: 3.0, label: "Architect",   color: "#ef4444" },
  };
  const baseTokens = 10000;
  const turns = 20;
  const outputRate = 15; // Sonnet output $/MTok
  const s = styles[style];
  const cost = (baseTokens * s.mult * turns * outputRate / 1e6).toFixed(2);
  const defaultCost = (baseTokens * 1.0 * turns * outputRate / 1e6).toFixed(2);
  const saving = style !== "default" ? ((1 - s.mult) * 100).toFixed(0) : 0;

  return (<>
    <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16}}>
      <Metric label="Terse multiplier" value="0.3×" sub="70% output token reduction" />
      <Metric label="Output rate" value="50×" sub="vs cached input (Sonnet)" color="#ef4444" />
      <Metric label="Weekly savings" value="~$15–30" sub="heavy user on Sonnet" color="#f59e0b" />
    </div>

    <Section title="Why output styles matter most with caching" badge={<CcafBadge domain={3} />} defaultOpen>
      <p>With effective prompt caching (90% hit rate), cached input tokens cost <strong>$0.30/MTok</strong> on Sonnet. Output tokens cost <strong>$15.00/MTok</strong> — a <strong>50× rate differential</strong>. At high cache hit rates, output tokens drive 70–85% of dollar costs even though they represent fewer total tokens.</p>
      <p>Output styles are YAML templates stored in <Code>~/.claude/output-styles/</Code> (global) or <Code>.claude/output-styles/</Code> (project). They replace ad-hoc "be concise" prompts in CLAUDE.md — defined once, applied every turn with zero per-prompt overhead.</p>
      <Callout type="exam"><strong>CCA-F D3:</strong> Output styles belong in Prompt Engineering domain. Terse = 0.3× output tokens. Keep-coding-instructions: true is mandatory to preserve code blocks while cutting prose.</Callout>
    </Section>

    <Section title="Style multiplier calculator" defaultOpen>
      <p style={{fontSize:12,color:"#888",marginBottom:10}}>10K output tokens/turn · 20 turns · Sonnet 4.6 ($15/MTok output)</p>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,margin:"10px 0"}}>
        {Object.entries(styles).map(([k, v]) => (
          <button key={k} onClick={() => setStyle(k)} style={{padding:"5px 12px",fontSize:11,fontFamily:"inherit",border:style===k?`1px solid ${v.color}`:"1px solid #333",background:style===k?`${v.color}18`:"transparent",color:style===k?v.color:"#888",borderRadius:4,cursor:"pointer"}}>{v.label}</button>
        ))}
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10,marginTop:12}}>
        <Metric label="Multiplier" value={`${s.mult}×`} color={s.color} sub={s.label} />
        <Metric label="Session cost" value={`$${cost}`} color={s.color} sub="output tokens only" />
        <Metric label="vs Default" value={saving > 0 ? `-${saving}%` : style === "default" ? "baseline" : `+${Math.abs(saving)}%`} color={Number(saving) > 0 ? "#00d46a" : style === "default" ? "#888" : "#ef4444"} sub="savings" />
      </div>
    </Section>

    <Section title="Creating a Terse developer style" badge={<CcafBadge domain={3} />}>
      <CodeBlock title="~/.claude/output-styles/dev-terse.yaml" code={`---
name: dev-terse
description: Maximum efficiency for coding tasks
keep-coding-instructions: true   # CRITICAL: preserves code, cuts prose only
---

response_format:
  prose: minimal        # no preamble, no summaries
  code_blocks: full     # never truncate code
  skip_preamble: true   # don't say "Sure, I'll help..."
  skip_summary: true    # don't say "I've made the changes..."
  no_alternatives: true # pick the best option, don't list 3
  assume_senior: true   # skip basic concept explanations`} />
      <Callout type="danger"><strong>keep-coding-instructions: true is mandatory for coding contexts.</strong> Without it, Terse style may truncate code blocks along with prose — the opposite of what you want.</Callout>
    </Section>

    <Section title="Activating a style" badge={<CcafBadge domain={2} />}>
      <CodeBlock code={`# Global activation via settings.json
{ "outputStyle": "dev-terse" }

# Per-command via frontmatter
---
name: quick-edit
effort: low
outputStyle: dev-terse
allowed-tools: Read, Edit, Bash(git diff:*)
---

# Interactive picker
/config → Output Style`} />
    </Section>

    <Section title="When NOT to use Terse" badge={<CcafBadge domain={3} />}>
      <Table headers={["Use Terse","Use Default or Explanatory"]} rows={[
        ["Daily coding: edits, fixes, features","Explaining code to teammates or in PR reviews"],
        ["Mechanical tasks: linting, renaming","Onboarding to an unfamiliar codebase"],
        ["Clear task with verifiable output","Architecture recommendations — you want the reasoning"],
        ["Debug when you already know the area","Subtle bugs where wrong assumptions cost more turns"],
      ]} />
    </Section>
  </>);
}

function ClaudeMdTab() {
  return (<>
    <Section title="Token cost" badge={<CcafBadge domain={2} />} defaultOpen>
      <p>Injected into <strong>every API call</strong>. A 100-token unnecessary paragraph × 50 turns = 5,000 wasted tokens. Use <Code>/memory</Code> to see per-file token costs and toggle off files not earning their keep.</p>
      <CodeBlock title="Loading hierarchy" code={`1. Managed policy        ← IT-administered, cannot exclude
2. User ~/.claude/CLAUDE.md ← personal global
3. Project ./CLAUDE.md    ← repo root
4. ./CLAUDE.local.md      ← git-ignored overrides
5. Subdirectory CLAUDE.md ← on-demand (files in that dir accessed)
6. .claude/rules/ with paths ← scoped rules (on-demand)`} />
    </Section>
    <Section title="Optimization techniques" badge={<CcafBadge domain={2} />}>
      <Table headers={["Technique","How","Impact"]} rows={[
        ["Move to skills",".claude/commands/ — load on invocation only","Saves tokens every turn"],
        [".claude/rules/ + paths","Topic rules load only for matching files","Scoped injection"],
        ["@import","Reference files (max 5 hops)","Lean root CLAUDE.md"],
        ["<!-- HTML comments -->","STRIPPED before injection — zero token cost","Free team annotations"],
        ["claudeMdExcludes","Glob patterns in settings.json — skip irrelevant CLAUDE.md in monorepos","Avoid unrelated instructions"],
        [".claudeignore","Block build artifacts, lock files (like .gitignore)","Prevent accidental reads"],
        ["CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD","Load CLAUDE.md from paths outside working dir","Share team config without copying"],
      ]} />
      <Callout type="tip"><strong>HTML comments are completely stripped before API injection.</strong> Use them freely for section labels, token cost estimates, TODOs, and onboarding notes — they cost zero tokens.</Callout>
    </Section>
    <Section title="claudeMdExcludes for monorepos" badge={<CcafBadge domain={2} />}>
      <CodeBlock title="~/.claude/settings.json" code={`{
  "claudeMdExcludes": [
    "services/legacy-php/**",
    "packages/android/**",
    "infrastructure/terraform/**"
  ]
}
// Prevents loading irrelevant CLAUDE.md when navigating to those dirs`} />
    </Section>
    <Section title="Auto-memory (MEMORY.md) optimization" badge={<CcafBadge domain={5} />}>
      <p>Auto-memory lives at <Code>~/.claude/projects/&lt;project&gt;/memory/MEMORY.md</Code>. Truncated to <strong>200 lines / 25KB</strong> at session start. Memory timestamps (March 2026) enable freshness reasoning.</p>
      <CodeBlock title="Satellite file pattern — lean index" code={`<!-- MEMORY.md index — target <50 active lines -->
- [User Profile](user_role.md) — data scientist, observability focus
- [Feedback: Testing](feedback_testing.md) — integration tests must hit real DB
- [Project: Auth Rewrite](project_auth.md) — compliance-driven, due 2026-06-01

<!-- Satellite files hold full content; only index counts vs 200-line cap -->`} />
      <Callout type="warn"><strong>Subagents do NOT inherit parent memory.</strong> To share memory with a subagent, explicitly pass content in the task description, or place it in the shared project-scope MEMORY.md.</Callout>
    </Section>
    <Section title="Recommended CLAUDE.md structure" badge={<CcafBadge domain={2} />}>
      <CodeBlock title="Under 200 lines — Anthropic's scientific computing guide" code={`# Project: MyProject

## Architecture
- FastAPI + ChromaDB + Voyage AI voyage-3.5
- Sonnet for generation, Haiku for intent classification

## Conventions
- Routes: /src/api/ | Tests: /tests/ | Lint: ruff check src/
- Run tests: pytest tests/ -x --tb=short

## Known Failures (DO NOT RE-ATTEMPT)
- sentence-transformers: incompatible with Python 3.12
- rank_bm25 BM25Okapi: OOM on docs > 50K tokens

# Compact Instructions
Preserve: API schema, test commands, known failures
Discard: verbose debug output, exploratory reads`} />
    </Section>
  </>);
}

function HooksTab() {
  return (<>
    <Section title="Hooks vs instructions — the core principle" badge={<CcafBadge domain={2} />} defaultOpen>
      <p>Hooks are the <strong>deterministic alternative to prompting</strong>. Instead of "always check X before Y" in CLAUDE.md (costs tokens every turn, may not be followed), hooks enforce behaviors through code — they always run regardless of what the model decides.</p>
      <Table headers={["Use hooks when","Use CLAUDE.md instructions when"]} rows={[
        ["Behavior must be enforced every time, unconditionally","Guidance is probabilistic ('try to...')"],
        ["Action is dangerous or irreversible","Guidance is stylistic or contextual"],
        ["You want deterministic CI pipeline gates","The instruction rarely applies"],
        ["Speed matters (hooks are faster than another Claude turn)","Flexibility and judgment are needed"],
      ]} />
    </Section>
    <Section title="Efficiency-relevant hook events" badge={<CcafBadge domain={2} />}>
      <Table headers={["Event","Timing","Token efficiency use case"]} rows={[
        ["SessionStart","Once per session","Inject dynamic context; no per-turn cost — replaces static CLAUDE.md content"],
        ["UserPromptSubmit","Before each user prompt","Auto-enrich with branch name, test state, file context"],
        ["PreToolUse","Before any tool call","Gate expensive searches; cancel unnecessary reads"],
        ["PostToolUse","After any tool call","Filter large outputs before Claude sees them — community reports 40–70% cost reduction"],
        ["PreCompact","Before auto-compaction","Save task state so post-compaction context is accurate"],
        ["Stop","When Claude stops","Force continuation (exit 2); automated test gates"],
      ]} />
    </Section>
    <Section title="SessionStart: dynamic context injection" badge={<CcafBadge domain={2} />}>
      <p>Runs once per session — zero per-turn token cost. Use it to inject fresh state that would otherwise sit as stale static content in CLAUDE.md.</p>
      <CodeBlock title="~/.claude/settings.json" code={`{
  "hooks": {
    "SessionStart": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "echo \\"Branch: $(git branch --show-current)\\nLast commit: $(git log -1 --format='%h %s')\\nTest status: $(npm test --silent 2>&1 | tail -1)\\""
      }]
    }]
  }
}
// Remove from CLAUDE.md: sprint info, branch conventions, team member names
// CLAUDE.md = stable facts; SessionStart = dynamic state`} />
    </Section>
    <Section title="PostToolUse: output filtering" badge={<CcafBadge domain={4} />}>
      <p>Pre-filter tool outputs before Claude receives them. A PostToolUse hook that distills a 10K-line log to 50 matching lines can cut 95% of those token costs.</p>
      <CodeBlock title=".claude/settings.json" code={`{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "cat /dev/stdin | grep -E 'ERROR|WARN|FAIL' | head -50"
      }]
    }],
    "PostToolUse": [{
      "matcher": "Edit",
      "hooks": [{
        "type": "command",
        "command": "npx prettier --write $CLAUDE_TOOL_ARG_FILE_PATH"
      }]
    }]
  }
}
// duration_ms field now included in PostToolUse input (v2.1.119)`} />
      <Callout type="warn"><strong>Poorly written hooks compound cost.</strong> A PostToolUse that unconditionally cat's a large file adds more tokens than it saves. Use <Code>--bare</Code> mode for CI pipelines where hooks add overhead without benefit.</Callout>
    </Section>
    <Section title="PreCompact: save state before compaction" badge={<CcafBadge domain={5} />}>
      <p>The hook output is included in the compaction summary. Without PreCompact, compaction can lose active worktree state and in-flight task lists.</p>
      <CodeBlock code={`{
  "hooks": {
    "PreCompact": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "echo \\"Worktrees: $(git worktree list)\\nLast 3 commits: $(git log -3 --format='%h %s')\\""
      }]
    }]
  }
}
// Block compaction: exit 2, or return {"decision": "block", "reason": "..."}`} />
    </Section>
    <Section title="Stop hook: automated test gate" badge={<CcafBadge domain={2} />}>
      <p>Exit code 2 forces Claude to continue. Eliminates the round-trip: "Did tests pass?" → tool call → "Yes/no".</p>
      <CodeBlock title=".claude/hooks/test-gate.sh" code={`#!/bin/bash
TEST_OUTPUT=$(npm test 2>&1)
FAILURES=$(echo "$TEST_OUTPUT" | grep -c "FAIL\\|ERROR")

if [ "$FAILURES" -gt 0 ]; then
  echo "TESTS FAILED: $FAILURES failures. Fix before stopping."
  echo "$TEST_OUTPUT" | grep -E "FAIL|ERROR" | head -10
  exit 2  # Force Claude to continue
fi
exit 0`} />
    </Section>
    <Section title="Hook handler types" badge={<CcafBadge domain={4} />}>
      <Table headers={["Type","Cost","Best for"]} rows={[
        ["command","Zero overhead","Shell scripts, git commands, file reads — prefer this type"],
        ["prompt (Haiku)","Haiku output cost","Natural language validation where judgment is needed"],
        ["agent","Full subagent cost","Complex multi-step analysis — expensive, use sparingly"],
        ["http","Network latency","External service integration, webhooks"],
        ["mcp_tool","MCP overhead","Invoke MCP tools directly without subprocess (v2.1.118)"],
      ]} />
    </Section>
  </>);
}

function AgentsTab() {
  return (<>
    <Section title="Subagents vs Teams" badge={<CcafBadge domain={1} />} defaultOpen>
      <Table headers={["","Subagents (Agent tool)","Agent Teams"]} rows={[
        ["Process","Within parent process","Separate instances (2–16)"],
        ["Context","Scoped (no inheritance!)","Own 1M window each"],
        ["Communication","Vertical only (→ parent)","Lateral (mailbox + task list)"],
        ["Cost","~1×","~3–7× (commonly ~5×)"],
        ["Best for","Focused subtasks, exploration","Multi-file refactors, cross-layer"],
      ]} />
      <Callout type="exam"><strong>CCA-F trap:</strong> "Subagent inherits parent context" is WRONG. All info must be explicitly passed. Include: file paths, function names, what NOT to change, how to run tests, definition of "done".</Callout>
    </Section>
    <Section title="Custom subagent patterns" badge={<CcafBadge domain={1} />}>
      <CodeBlock code={`# .claude/agents/explore-docs.md
---
name: explore-docs
model: haiku
effort: low
description: Search and summarize docs
allowed_tools: ["Read", "Bash(grep:*)", "Bash(find:*)"]
---
Search for $ARGUMENTS. Return paths + key findings only.

# .claude/agents/security-scan.md
---
name: security-scan
model: opus
effort: high
allowed_tools: ["Read", "Bash(grep:*)", "Bash(semgrep:*)"]
---
Analyze $ARGUMENTS for injection, auth gaps, PII exposure.`} />
    </Section>
    <Section title="Cost-efficient agent architecture" badge={<CcafBadge domain={1} />}>
      <CodeBlock code={`TIER 1 — Main session (opusplan or Sonnet)
  └── Coordination, architecture, task decomposition

TIER 2 — Subagents (Haiku or Sonnet per frontmatter)
  └── CLAUDE_CODE_SUBAGENT_MODEL=haiku (global default)
  └── ~1× cost (same process, scoped context)

TIER 3 — Agent Teams (only when lateral comms needed)
  └── 2–4 teammates max, ~5× cost
  └── Use isolation: "worktree" for parallel changes`} />
    </Section>
  </>);
}

function CompactionTab() {
  return (<>
    <Section title="Three-layer system" badge={<CcafBadge domain={5} />} defaultOpen>
      <CodeBlock code={`Layer 1 — Microcompaction (automatic)
  Large tool outputs → disk. Recent = inline, older = references.

Layer 2 — Auto-compaction (at ~83.5% of window)
  Configurable: CLAUDE_AUTOCOMPACT_PCT_OVERRIDE (1-100)
  Best practice: /compact at 70%, not 83.5% (quality stays higher)
  Circuit breaker (v2.1.89): stops after 3 thrash loops

Layer 3 — Manual (/compact)
  /compact Focus on API changes  ← guided preservation
  Esc+Esc or /rewind             ← partial compaction
  Customizable via # Compact Instructions in CLAUDE.md

PreCompact hook fires before Layer 2 triggers — use to save state
PostCompact hook fires after — use to re-inject environment`} />
      <Callout type="warn"><strong>Tool results are discarded during compaction.</strong> Only the narrative conversation is summarized. Use PreCompact hook to save critical task state before it fires.</Callout>
    </Section>
    <Section title="Idle-return /clear hint" badge={<CcafBadge domain={5} />}>
      <p>After 75+ min idle → suggests <Code>/clear</Code> with token savings. Bug fix v2.1.92: now shows current context (not cumulative). The 5-min cache TTL has already expired — resuming costs a full cold-start write.</p>
    </Section>
    <Section title="Long-running sessions" badge={<CcafBadge domain={5} />}>
      <CodeBlock code={`tmux new-session -s claude-research
claude --model opus
# Detach: Ctrl+B, D | Reattach: tmux attach -t claude-research

Best practices:
- Commit after every meaningful unit
- CHANGELOG.md = portable long-term memory (incl. failures)
- Tests = verification oracle
- /compact with focus when context fills`} />
    </Section>
    <Section title="Critical fixes (March–May 2026)" badge={<CcafBadge domain={5} />}>
      <Table headers={["Bug","Fixed in"]} rows={[
        ["Nested CLAUDE.md re-injected dozens of times","v2.1.89"],
        ["Progress messages surviving compaction","v2.1.89"],
        ["Autocompact thrash loop (infinite token burn)","v2.1.89 (circuit breaker)"],
        ["--resume cache miss for deferred tools / MCP / agents","v2.1.93"],
        ["PreCompact hook added","v2.1.95"],
        ["CLAUDE_CODE_MAX_CONTEXT_TOKENS hard ceiling","v2.1.96"],
        ["DISABLE_TELEMETRY=1 falling back to 5-min cache TTL","v2.1.108"],
        ["--resume on 40MB+ sessions — 67% faster","v2.1.116"],
      ]} />
    </Section>
  </>);
}

function BatchTab() {
  return (<>
    <Section title="/batch parallel orchestration" badge={<CcafBadge domain={1} />} defaultOpen>
      <CodeBlock code={`Phase 1 — Research: Explore agents → decompose 5–30 units → plan
Phase 2 — Execute: 1 agent per unit in isolated git worktrees
           → implement → test → commit → push → open PR
Phase 3 — Track: live status table, failed units don't affect others

Speed: up to 10× faster than sequential
Best for: migrations, convention enforcement, test generation`} />
    </Section>
    <Section title="Cloud scheduled tasks" badge={<CcafBadge domain={2} />}>
      <Table headers={["Property","Detail"]} rows={[
        ["Creation","claude.ai/code/scheduled or /schedule command"],
        ["Execution","Clones repo fresh, own session, default branch"],
        ["Min interval","1 hour"],
        ["CLI task expiry","3 days (bounds forgotten loops)"],
        ["Cost","Full session each run, regardless of machine state"],
      ]} />
    </Section>
    <Section title="Cloud Auto-Fix" badge={<CcafBadge domain={2} />}>
      <CodeBlock code={`CI failure → investigate → fix → push → explain
Clear review comment → implement → push
Ambiguous comment → ask clarification (doesn't guess)
Each cycle = full API call — monitor with /usage`} />
    </Section>
    <Section title="Power commands (v2.1.101–v2.1.126)" badge={<CcafBadge domain={2} />}>
      <Table headers={["Command","Version","Description"]} rows={[
        ["/usage","v2.1.118","Merged /cost + /stats — full per-model breakdown, cache-hit accounting, plan limits"],
        ["/ultrareview [target]","v2.1.111","Cloud multi-agent code review. No args = current branch; /ultrareview <PR#> = GitHub PR"],
        ["/recap","v2.1.108","Manual session recap. Also fires automatically after absence. Opt out: CLAUDE_CODE_ENABLE_AWAY_SUMMARY=0"],
        ["/less-permission-prompts","v2.1.111","Scans transcripts, proposes allowlist for common read-only operations"],
        ["claude project purge","v2.1.126","Delete all project state (transcripts, tasks, file history). Supports --dry-run, -y, --all"],
        ["/branch","v2.1.77","Fork conversation to new branch (was /fork)"],
      ]} />
    </Section>
  </>);
}

function CheatsheetTab() {
  const items = [
    {r:1, a:"Default to Sonnet 4.6",          i:"40% input cost reduction vs Opus 4.7 — handles ~90% of tasks",          c:"settings.json: {\"model\":\"claude-sonnet-4-6\"}",                     d:"D2"},
    {r:2, a:"Set output style to Terse",        i:"70% output token reduction — output = 50× cached-input rate",           c:"settings.json: {\"outputStyle\":\"dev-terse\"}",                         d:"D3"},
    {r:3, a:"Set MAX_THINKING_TOKENS=10000",    i:"~70% reduction in thinking costs (Opus 4.6/Sonnet 4.6)",                c:"export MAX_THINKING_TOKENS=10000",                                       d:"D2"},
    {r:4, a:"/clear between unrelated tasks",   i:"Prevents stale context compounding every turn",                         c:"/clear",                                                                  d:"D5"},
    {r:5, a:"Write specific prompts naming files",i:"3-turn vs 12-turn = 50K+ token difference",                           c:"\"Fix auth bug in src/api/auth.ts line 47\"",                             d:"D3"},
    {r:6, a:"Use opusplan for architecture",    i:"Opus design + Sonnet implementation — cache managed internally",        c:"/model opusplan",                                                         d:"D2"},
    {r:7, a:"Subagent model → Haiku",           i:"~80% cheaper vs Opus 4.7 for exploration/subtasks",                    c:"export CLAUDE_CODE_SUBAGENT_MODEL=haiku",                                d:"D1"},
    {r:8, a:"CLAUDE.md under 200 lines + skills",i:"Skills load on-demand; CLAUDE.md loads every turn",                   c:"Move workflows → .claude/commands/",                                     d:"D2"},
    {r:9, a:"ToolSearch (automatic)",           i:"85%+ reduction in tool definition tokens",                              c:"Auto when MCP tools > 10K tokens",                                        d:"D4"},
    {r:10,a:"Effort: low for simple tasks",     i:"Skips thinking budget entirely (0–500 tokens vs 8K+ for medium)",      c:"Frontmatter: effort: low | /effort low",                                  d:"D2"},
  ];
  return (<>
    <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:14}}>Top 10 Cost Optimizations — Ranked by Impact</div>
    {items.map(({r,a,i,c,d})=>(
      <div key={r} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 14px",marginBottom:6,background:r<=4?"rgba(0,212,106,0.05)":"rgba(255,255,255,0.02)",border:`1px solid ${r<=4?"rgba(0,212,106,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:8}}>
        <div style={{width:28,height:28,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:r<=4?"rgba(0,212,106,0.15)":"rgba(255,255,255,0.06)",color:r<=4?"#00d46a":"#888",fontSize:13,fontWeight:700,fontFamily:"monospace",flexShrink:0}}>{r}</div>
        <div style={{flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontSize:13,fontWeight:600,color:"#e0e0e0"}}>{a}</span>
            <span style={{fontSize:9,padding:"2px 6px",background:"rgba(167,139,250,0.12)",color:"#a78bfa",borderRadius:3,fontWeight:700}}>{d}</span>
          </div>
          <div style={{fontSize:12,color:"#888",marginTop:3}}>{i}</div>
          <code style={{fontSize:10.5,color:"#f0c674",background:"rgba(255,255,255,0.04)",padding:"2px 6px",borderRadius:3,marginTop:4,display:"inline-block",wordBreak:"break-all"}}>{c}</code>
        </div>
      </div>
    ))}
    <div style={{marginTop:16,padding:14,background:"rgba(0,212,106,0.04)",border:"1px solid rgba(0,212,106,0.15)",borderRadius:8}}>
      <div style={{fontSize:12,fontWeight:700,color:"#00d46a",marginBottom:6}}>One-time setup</div>
      <div style={{fontSize:11.5,color:"#bbb",lineHeight:1.8,fontFamily:"monospace"}}>
        export MAX_THINKING_TOKENS=10000<br/>
        export CLAUDE_CODE_SUBAGENT_MODEL=haiku<br/>
        {'{ "outputStyle": "dev-terse", "model": "claude-sonnet-4-6" }  # settings.json'}
      </div>
    </div>
    <div style={{marginTop:12,padding:16,background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:8}}>
      <div style={{fontSize:13,fontWeight:700,color:"#a78bfa",marginBottom:8}}>CCA-F Exam: 60 questions / 120 min / 5 domains</div>
      <div style={{fontSize:12,color:"#bbb",lineHeight:1.8}}>
        D1 Agentic Architecture (25%) · D2 Claude Code Config (20%) · D3 Prompt Engineering (20%) · D4 Tool Design &amp; MCP (20%) · D5 Context Management (15%). 6 scenarios, 4 randomly selected per sitting.<br/><br/>
        <strong style={{color:"#fff"}}>Key principles:</strong> Programmatic enforcement beats prompt-based guidance. Subagents don't inherit context. ToolSearch tool_references go in conversation history (not prefix). Output Styles Terse = 0.3× output tokens. SessionStart hook = zero per-turn cost. /usage replaces /cost. xHigh is the new max effort (max removed v2.1.72). All Opus models (4.6/4.7/4.8) = $15/$75/MTok. Opus 4.8 = newest, holds <code>opus</code> alias, 1M context. Sonnet 4.6 = default ($3/$15). Haiku 4.5 = bulk/CI ($0.80/$4).
      </div>
    </div>
  </>);
}

// ─── MAIN ───────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("context");
  const content = {
    "context":       <ContextTab />,
    "caching":       <CachingTab />,
    "toolsearch":    <ToolSearchTab />,
    "models":        <ModelsTab />,
    "effort":        <EffortTab />,
    "output-styles": <OutputStylesTab />,
    "claudemd":      <ClaudeMdTab />,
    "hooks":         <HooksTab />,
    "agents":        <AgentsTab />,
    "compaction":    <CompactionTab />,
    "batch":         <BatchTab />,
    "cheatsheet":    <CheatsheetTab />,
  };
  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:"#0d1117",color:"#e0e0e0",borderRadius:8,overflow:"hidden"}}>
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"20px 16px 0",background:"linear-gradient(180deg,rgba(0,212,106,0.04) 0%,transparent 100%)"}}>
        <div style={{maxWidth:960,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontSize:19,fontWeight:700,color:"#fff",letterSpacing:-0.5}}>Claude Code</span>
            <span style={{fontSize:11,padding:"3px 8px",background:"rgba(0,212,106,0.12)",color:"#00d46a",borderRadius:4,fontWeight:600}}>Efficiency Guide</span>
          </div>
          <div style={{fontSize:11,color:"#666",marginBottom:14}}>June 2026 · v2.1.126 · Updated 2026-06-07</div>
          <div style={{display:"flex",gap:2,overflowX:"auto",flexWrap:"wrap"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 11px",fontSize:11,fontFamily:"inherit",fontWeight:tab===t.id?700:400,background:tab===t.id?"rgba(255,255,255,0.06)":"transparent",color:tab===t.id?"#fff":"#777",border:"none",borderBottom:tab===t.id?"2px solid #00d46a":"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",borderRadius:"6px 6px 0 0"}}>
                <span style={{marginRight:4}}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:960,margin:"0 auto",padding:"20px 16px 40px"}}>{content[tab]}</div>
    </div>
  );
}
