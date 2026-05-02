import { useState } from "react";

/* ════════════════════════════════════════════════════════════
   Claude Code Context, Cost & Token Efficiency — Interactive Guide
   April 2026 · CCA-F Study Reference · v2.1.92+
   No external library imports — only React + inline styles
   ════════════════════════════════════════════════════════════ */

const TABS = [
  { id: "context", label: "Context Window", icon: "◎" },
  { id: "caching", label: "Prompt Caching", icon: "⚡" },
  { id: "toolsearch", label: "ToolSearch", icon: "🔍" },
  { id: "models", label: "Model Selection", icon: "◆" },
  { id: "effort", label: "Effort & Bare", icon: "⏱" },
  { id: "claudemd", label: "CLAUDE.md", icon: "📄" },
  { id: "agents", label: "Agents & Teams", icon: "👥" },
  { id: "compaction", label: "Compaction", icon: "🗜" },
  { id: "batch", label: "Batch & Schedule", icon: "⚙" },
  { id: "cheatsheet", label: "Cheat Sheet", icon: "🎯" },
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
      <Metric label="Extended Window" value="1M" sub="claude-opus-4-5, claude-sonnet-4-5, claude-opus-4-20250514" color="#a78bfa" />
      <Metric label="Avg Cost/Dev/Day" value="~$6" sub="90th percentile under $12 (Anthropic 2025 data)" color="#f59e0b" />
    </div>
    <Section title="What fills the context window (token anatomy)" badge={<CcafBadge domain={5} />} defaultOpen>
      <p>Claude Code is <strong style={{color:"#fff"}}>stateless between turns</strong>. Every API call resends the entire payload from scratch — system prompt, tool definitions, CLAUDE.md, memory, conversation history. The context is reconstructed each turn in deliberate order (most stable first for cache optimization):</p>
      <CodeBlock title="Context reconstruction order — every single turn" code={`┌─────────────────────────────────────────────────────┐
│ 1. Tool definitions         (all built-in + MCP)    │ ← Shared across ALL users
│ 2. System prompt            (Anthropic internal)    │ ← Shared across users
│ 3. CLAUDE.md content        (project hierarchy)     │ ← Shared per-project
│ 4. Auto-memory              (MEMORY.md, ≤200 lines) │ ← Per-project
│ 5. Loaded skill descriptions                        │ ← On-demand
│ 6. MCP server instructions                          │ ← Per-session config
│ 7. Conversation history     (all messages + results) │ ← Unique & grows
│ 8. Path-scoped .claude/rules/                       │ ← On-demand per dir
└─────────────────────────────────────────────────────┘
Reserved: 33K–45K token "buffer" for system overhead`} />
      <Callout type="warn"><strong>Hidden costs:</strong> GitHub MCP (91 tools) = ~46K tokens = 23% of 200K window. A 5,000-token CLAUDE.md = 5,000 tokens on every turn. Studies show 40–60% of Read tokens are redundant re-reads.</Callout>
      <Callout type="exam"><strong>CCA-F D5 (15% weight):</strong> Input tokens = 85–92% of total API costs. Any context reduction compounds across every subsequent turn.</Callout>
    </Section>
    <Section title="Commands for monitoring" badge={<CcafBadge domain={2} />}>
      <Table headers={["Command","Shows","When to use"]} rows={[
        ["/context","Live breakdown: system, tools, MCP, agents, skills, messages, free space","Before complex tasks — check headroom"],
        ["/cost","Per-model input/output/cache-read/cache-write + $ (v2.1.92: per-model breakdown)","Periodically to track spend"],
        ["/clear","Reset conversation, keep tools + CLAUDE.md + memory","Between unrelated tasks — highest-impact habit"],
        ["/compact [focus]","Summarize conversation with optional focus topic","Context filling but task not done"],
        ["Esc+Esc or /rewind","Partial compaction — select checkpoint","When only recent context matters"],
      ]} />
    </Section>
  </>);
}

function CachingTab() {
  const [turns, setTurns] = useState(20);
  const [ctxK, setCtxK] = useState(100);
  const [hitRate, setHitRate] = useState(90);
  const [model, setModel] = useState("sonnet");
  const rate = model==="opus"?15:model==="sonnet"?3:1;
  const noCacheCost = (ctxK*1000*turns*rate)/1e6;
  const withCacheCost = ((ctxK*1000*(1-hitRate/100)*rate*1.25)+(ctxK*1000*(hitRate/100)*rate*0.1))*turns/1e6;
  const savings = noCacheCost>0?((1-withCacheCost/noCacheCost)*100).toFixed(1):0;

  return (<>
    <Section title="How prompt caching works" badge={<CcafBadge domain={5} />} defaultOpen>
      <p>Per Thariq Shihipar (Claude Code engineering): <em style={{color:"#999"}}>"We build our entire harness around prompt caching. We run alerts on cache hit rate and declare SEVs if they're too low."</em></p>
      <p>The system stores <strong>KV attention cache tensors</strong> server-side. When a request shares the same byte-level prefix, the model skips recomputation. The 5-minute TTL refreshes on every hit. Caches are <strong>per-model</strong> — switching models = full cache miss.</p>
    </Section>
    <Section title="Pricing multipliers" badge={<CcafBadge domain={5} />}>
      <Table headers={["Type","Multiplier","Sonnet 4.6","Opus 4.6","Haiku 4.5"]} rows={[
        ["Standard input","1.0×","$3/MTok","$15/MTok","$1/MTok"],
        ["5-min cache write","1.25×","$3.75/MTok","$18.75/MTok","$1.25/MTok"],
        ["1-hour cache write","2.0×","$6/MTok","$30/MTok","$2/MTok"],
        ["Cache read (hit)","0.1×","$0.30/MTok","$1.50/MTok","$0.08/MTok"],
        ["Output","—","$15/MTok","$75/MTok","$5/MTok"],
      ]} />
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
      "enableToolSearch": false  // eager loading
    }
  }
}
// Tool descriptions capped at 2KB (v2.1.84)
// Only mcp__ prefix tools eligible for deferral
// Built-in tools (Read, Edit, Bash) never deferred`} />
    </Section>
  </>);
}

function ModelsTab() {
  return (<>
    <Section title="Model matrix (April 2026)" badge={<CcafBadge domain={2} />} defaultOpen>
      <Table headers={["Model","Input/Output (per 1M)","Context","Best For"]} rows={[
        ["claude-opus-4-20250514","$15/$75","200K standard, 1M extended","Best quality, complex reasoning, extended thinking"],
        ["claude-opus-4-5","$15/$75","1M context","Highest context window, coding tasks"],
        ["claude-sonnet-4-20250514","$3/$15","200K standard, 1M extended","Best balance quality/cost; default for Claude Code"],
        ["claude-sonnet-4-5","$3/$15","1M context","Best balance with 1M context"],
        ["claude-haiku-4-20250514","$0.80/$4","200K","Fast, cheap; subagent tasks, classification"],
        ["claude-haiku-3-5","$0.80/$4","200K","Fastest response; tool-intensive pipelines"],
      ]} />
      <Callout type="tip">Sonnet handles ~90% of tasks at 80% lower cost. Use claude-sonnet-4-20250514 as default, claude-haiku-4-20250514 for subagents.</Callout>
    </Section>
    <Section title="opusplan — highest ROI strategy" badge={<CcafBadge domain={2} />}>
      <CodeBlock code={`claude --model opusplan
# Plan mode (Shift+Tab×2) → Opus (deep reasoning)
# Implementation mode → Sonnet (80% cheaper)
# Cache managed internally — no manual switching needed`} />
    </Section>
    <Section title="Thinking token costs (hidden)" badge={<CcafBadge domain={2} />}>
      <p>Extended thinking tokens come from the <strong>output budget</strong> and are billed at output rates ($15–75/MTok). Default ~32K thinking = $2.40/turn on Opus.</p>
      <CodeBlock code={`export MAX_THINKING_TOKENS=10000
# Recovers output capacity AND cuts thinking cost ~70%
# Single highest-ROI environment variable
# Use "ultrathink" in prompt for one-off deep reasoning`} />
    </Section>
    <Section title="Subagent model routing" badge={<CcafBadge domain={1} />}>
      <CodeBlock code={`export CLAUDE_CODE_SUBAGENT_MODEL=haiku  # global default
claude --model opus  # main session

# Per-subagent override:
---
name: security-scan
model: opus        # override for complex tasks
effort: high
---`} />
    </Section>
  </>);
}

function EffortTab() {
  return (<>
    <Section title="Effort levels" badge={<CcafBadge domain={2} />} defaultOpen>
      <Table headers={["Level","Thinking","Use case","Token impact"]} rows={[
        ["low","0–500 tokens","Formatting, linting, lookups","Saves thousands/turn"],
        ["medium","Balanced (default)","Most coding tasks","Standard"],
        ["high","Deep reasoning","Complex debug, architecture","2–4× more thinking"],
        ["max","Unconstrained (Opus only)","Novel algorithms, research","Maximum allocation"],
      ]} />
      <CodeBlock title="Priority order" code={`CLAUDE_CODE_EFFORT_LEVEL env var (highest)
→ skill/subagent frontmatter
→ session /effort command
→ model default (medium)
→ "ultrathink" in prompt = high for one turn`} />
    </Section>
    <Section title="/effort command & budget_tokens" badge={<CcafBadge domain={2} />}>
      <CodeBlock title="/effort slash command usage" code={`/effort high    # Sets budget_tokens ~32,000 — for complex analysis
/effort medium  # Sets budget_tokens ~8,000 — default balanced
/effort low     # Disables extended thinking — fast responses`} />
      <Callout type="warn"><strong>Billing:</strong> Thinking (extended) tokens are billed as output tokens ($15–75/MTok depending on model). Default ~32K thinking budget = $2.40/turn on Opus. Set MAX_THINKING_TOKENS=10000 to reduce by ~70%.</Callout>
    </Section>
    <Section title="--bare mode" badge={<CcafBadge domain={2} />}>
      <p>Skips: hooks, LSP, plugin sync, skill walks, MCP servers, auto-memory, CLAUDE.md, OAuth. Only Bash + Read + Edit available.</p>
      <CodeBlock code={`git diff origin/main...HEAD | claude -p "Review" \\
  --bare --allowedTools "Bash(git:*),Read" \\
  --output-format json
# ~14% faster startup. Will become default for -p mode.`} />
    </Section>
  </>);
}

function ClaudeMdTab() {
  return (<>
    <Section title="Token cost" badge={<CcafBadge domain={2} />} defaultOpen>
      <p>Injected into <strong>every API call</strong>. A 100-token unnecessary paragraph × 50 turns = 5,000 wasted tokens.</p>
      <CodeBlock title="Loading hierarchy" code={`1. Managed policy        ← IT-administered, cannot exclude
2. Project ./CLAUDE.md    ← repo root
3. User ~/.claude/CLAUDE.md ← personal global
4. ./CLAUDE.local.md      ← git-ignored overrides
5. Subdirectory CLAUDE.md ← on-demand (files in that dir accessed)
6. .claude/rules/ with paths ← scoped rules (on-demand)`} />
    </Section>
    <Section title="Optimization techniques" badge={<CcafBadge domain={2} />}>
      <Table headers={["Technique","How","Impact"]} rows={[
        ["Move to skills",".claude/commands/ — load on invocation only","Saves tokens every turn"],
        [".claude/rules/ + paths","Topic rules load only for matching files","Scoped injection"],
        ["@import","Reference files (max 5 hops)","Lean root CLAUDE.md"],
        ["<!-- comments -->","Stripped before injection","Zero token cost"],
        ["claudeMdExcludes","Skip irrelevant CLAUDE.md in monorepos","Avoid unrelated instructions"],
        [".claudeignore","Block build artifacts, lock files","Prevent accidental reads"],
      ]} />
    </Section>
    <Section title="Recommended structure" badge={<CcafBadge domain={2} />}>
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

function AgentsTab() {
  return (<>
    <Section title="Subagents vs Teams" badge={<CcafBadge domain={1} />} defaultOpen>
      <Table headers={["","Agent tool (renamed from Task in v2.1.63)","Agent Teams"]} rows={[
        ["Process","Within parent process","Separate instances (2–16)"],
        ["Context","Scoped (no inheritance!)","Own 1M window each"],
        ["Communication","Vertical only (→ parent)","Lateral (mailbox + task list)"],
        ["Cost","~1×","~3–7× (commonly ~5×)"],
        ["Best for","Focused subtasks, exploration","Multi-file refactors, cross-layer"],
      ]} />
      <Callout type="exam"><strong>CCA-F trap:</strong> "Subagent inherits parent context" is WRONG. All info must be explicitly passed.</Callout>
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
  </>);
}

function CompactionTab() {
  return (<>
    <Section title="Three-layer system" badge={<CcafBadge domain={5} />} defaultOpen>
      <CodeBlock code={`Layer 1 — Microcompaction (automatic)
  Large tool outputs → disk. Recent = inline, older = references.

Layer 2 — Auto-compaction (at ~83.5% of window)
  Configurable: CLAUDE_AUTOCOMPACT_PCT_OVERRIDE (1-100)
  Clears old tool outputs → summarizes conversation
  Preserves: user requests, key code, task state
  Circuit breaker (v2.1.89): stops after 3 thrash loops

Layer 3 — Manual (/compact)
  /compact Focus on API changes  ← guided preservation
  Esc+Esc or /rewind             ← partial compaction
  Customizable via # Compact Instructions in CLAUDE.md`} />
      <Callout type="warn"><strong>Tool results are DISCARDED:</strong> Tool call input/output pairs are discarded during compaction. Only the narrative conversation is summarized. Use PostCompact hooks to re-inject fresh context after every compaction.</Callout>
    </Section>
    <Section title="Idle-return /clear hint" badge={<CcafBadge domain={5} />}>
      <p>After 75+ min idle → suggests <Code>/clear</Code> with token savings. Bug fix v2.1.92: now shows current context (not cumulative).</p>
    </Section>
    <Section title="Long-running sessions" badge={<CcafBadge domain={5} />}>
      <CodeBlock code={`tmux new-session -s claude-research
claude --model opus
# Detach: Ctrl+B, D | Reattach: tmux attach -t claude-research
# SLURM: srun --jobid=JOBID --overlap --pty tmux attach

Best practices:
- Commit after every meaningful unit
- CHANGELOG.md = portable long-term memory (incl. failures)
- Tests = verification oracle
- /compact with focus when context fills`} />
    </Section>
    <Section title="Critical fixes (March–April 2026)" badge={<CcafBadge domain={5} />}>
      <Table headers={["Bug","Fixed in"]} rows={[
        ["Nested CLAUDE.md re-injected dozens of times","v2.1.89"],
        ["Progress messages surviving compaction","v2.1.89"],
        ["Background subagents invisible after compaction","v2.1.89"],
        ["Deferred tools losing schemas after compaction","v2.1.89"],
        ["Autocompact thrash loop (infinite token burn)","v2.1.89"],
        ["--resume truncating recent history + cache miss","v2.1.92"],
        ["Memory timestamps for freshness reasoning","March 2026"],
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
Each cycle = full API call — monitor with /cost`} />
    </Section>
  </>);
}

function CheatsheetTab() {
  const items = [
    {r:1,a:"Default to Sonnet 4.6",i:"80% input cost reduction vs Opus",c:"/model sonnet",d:"D2"},
    {r:2,a:"Set MAX_THINKING_TOKENS=10000",i:"~70% reduction in thinking costs ($15-75/MTok)",c:"export MAX_THINKING_TOKENS=10000",d:"D2"},
    {r:3,a:"/clear between unrelated tasks",i:"Prevents stale context compounding every turn",c:"/clear",d:"D5"},
    {r:4,a:"Write specific prompts naming files",i:"3-turn vs 12-turn = 50K+ token difference",c:"\"Fix auth bug in src/api/auth.ts line 47\"",d:"D3"},
    {r:5,a:"Use opusplan for architecture",i:"Opus design + Sonnet implementation",c:"/model opusplan",d:"D2"},
    {r:6,a:"Subagent model → Haiku",i:"~93% cheaper exploration",c:"export CLAUDE_CODE_SUBAGENT_MODEL=haiku",d:"D1"},
    {r:7,a:"CLAUDE.md under 200 lines",i:"Saves tokens every turn",c:"Move workflows → .claude/commands/",d:"D2"},
    {r:8,a:"ToolSearch (automatic)",i:"85%+ reduction in tool tokens",c:"Auto when MCP tools > 10K tokens",d:"D4"},
    {r:9,a:"effort: low for simple tasks",i:"Skips thinking entirely",c:"Frontmatter: effort: low",d:"D2"},
    {r:10,a:"--bare for CI/scripts",i:"~14% faster, minimal overhead",c:"claude -p '...' --bare",d:"D2"},
  ];
  return (<>
    <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:14}}>Top 10 Cost Optimizations — Ranked by Impact</div>
    {items.map(({r,a,i,c,d})=>(
        <div style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 14px",marginBottom:6,background:r<=4?"rgba(0,212,106,0.05)":"rgba(255,255,255,0.02)",border:`1px solid ${r<=4?"rgba(0,212,106,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:8}}>
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
    <div style={{marginTop:20,padding:16,background:"rgba(167,139,250,0.06)",border:"1px solid rgba(167,139,250,0.15)",borderRadius:8}}>
      <div style={{fontSize:13,fontWeight:700,color:"#a78bfa",marginBottom:8}}>CCA-F Exam: 60 questions / 120 min / 5 domains</div>
      <div style={{fontSize:12,color:"#bbb",lineHeight:1.8}}>
        D1 Agentic Architecture (25%) · D2 Claude Code Config (20%) · D3 Prompt Engineering (20%) · D4 Tool Design & MCP (20%) · D5 Context Management (15%). 6 scenarios, 4 randomly selected per sitting. <strong style={{color:"#fff"}}>Programmatic enforcement beats prompt-based guidance</strong> — hooks/gates/interceptors are deterministic; prompts are probabilistic. Key traps: subagents don't inherit context, tool descriptions route (not function names), keep 4–5 tools per agent, Batch API = latency trade with 50% savings but no SLA.
      </div>
    </div>
  </>);
}

// ─── MAIN ───────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("context");
  const content = {context:<ContextTab/>,caching:<CachingTab/>,toolsearch:<ToolSearchTab/>,models:<ModelsTab/>,effort:<EffortTab/>,claudemd:<ClaudeMdTab/>,agents:<AgentsTab/>,compaction:<CompactionTab/>,batch:<BatchTab/>,cheatsheet:<CheatsheetTab/>};
  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:"#0d1117",color:"#e0e0e0",borderRadius:8,overflow:"hidden"}}>
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"20px 16px 0",background:"linear-gradient(180deg,rgba(0,212,106,0.04) 0%,transparent 100%)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontSize:19,fontWeight:700,color:"#fff",letterSpacing:-0.5}}>Claude Code</span>
            <span style={{fontSize:11,padding:"3px 8px",background:"rgba(0,212,106,0.12)",color:"#00d46a",borderRadius:4,fontWeight:600}}>Efficiency Guide</span>
          </div>
          <div style={{fontSize:11,color:"#666",marginBottom:14}}>April 2026 · v2.1.92+ · CCA-F Domains 1–5</div>
          <div style={{display:"flex",gap:2,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 11px",fontSize:11,fontFamily:"inherit",fontWeight:tab===t.id?700:400,background:tab===t.id?"rgba(255,255,255,0.06)":"transparent",color:tab===t.id?"#fff":"#777",border:"none",borderBottom:tab===t.id?"2px solid #00d46a":"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",borderRadius:"6px 6px 0 0"}}>
                <span style={{marginRight:4}}>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:900,margin:"0 auto",padding:"20px 16px 40px"}}>{content[tab]}</div>
    </div>
  );
}
