import { useState } from "react";

const TABS = [
  { id: "anatomy", label: "Anatomy", icon: "▣" },
  { id: "extended", label: "200K vs 1M", icon: "⇔" },
  { id: "compaction", label: "Compaction", icon: "🗉" },
  { id: "measure", label: "Measurement", icon: "📊" },
  { id: "optimize", label: "Optimization", icon: "⚡" },
];

const Code = ({ children }) => (
  <code style={{background:"rgba(255,255,255,0.06)",padding:"2px 6px",borderRadius:3,fontSize:12,fontFamily:"monospace",color:"#f0c674",border:"1px solid rgba(255,255,255,0.08)"}}>{children}</code>
);
const CodeBlock = ({ code, title }) => (
  <div style={{margin:"12px 0",borderRadius:6,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)"}}>
    {title && <div style={{background:"rgba(255,255,255,0.04)",padding:"6px 12px",fontSize:11,color:"#888",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>{title}</div>}
    <pre style={{background:"rgba(0,0,0,0.3)",padding:14,margin:0,fontSize:11.5,fontFamily:"monospace",color:"#c5c8c6",overflowX:"auto",lineHeight:1.6,whiteSpace:"pre"}}>{code}</pre>
  </div>
);
const Table = ({ headers, rows }) => (
  <div style={{overflowX:"auto",margin:"12px 0"}}>
    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11.5,fontFamily:"monospace"}}>
      <thead><tr>{headers.map((h,i) => <th key={i} style={{textAlign:"left",padding:"8px 10px",borderBottom:"2px solid rgba(255,255,255,0.1)",color:"#888",fontWeight:600,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
      <tbody>{rows.map((row,ri) => (<tr key={ri} style={{background:ri%2===0?"transparent":"rgba(255,255,255,0.02)"}}>{row.map((cell,ci) => <td key={ci} style={{padding:"7px 10px",borderBottom:"1px solid rgba(255,255,255,0.04)",color:"#ccc"}}>{cell}</td>)}</tr>))}</tbody>
    </table>
  </div>
);
const Callout = ({ type = "info", children }) => {
  const c = {info:"#3b82f6",warn:"#f59e0b",tip:"#00e6b4",danger:"#ef4444"};
  const ic = {info:"ℹ",warn:"⚠",tip:"💡",danger:"🚨"};
  return <div style={{margin:"12px 0",padding:"12px 14px",borderRadius:6,background:`${c[type]}11`,borderLeft:`3px solid ${c[type]}`,fontSize:13,color:"#ccc",lineHeight:1.7}}><span style={{marginRight:8}}>{ic[type]}</span>{children}</div>;
};
const Section = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{marginBottom:10,border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,overflow:"hidden"}}>
      <div onClick={() => setOpen(!open)} style={{padding:"12px 16px",cursor:"pointer",display:"flex",alignItems:"center",background:open?"rgba(255,255,255,0.04)":"transparent"}}>
        <span style={{fontSize:12,color:"#555",marginRight:10,transform:open?"rotate(90deg)":"rotate(0)",display:"inline-block",transition:"transform 0.2s"}}>▶</span>
        <span style={{fontSize:14,fontWeight:600,color:"#e0e0e0",flex:1}}>{title}</span>
      </div>
      {open && <div style={{padding:"4px 16px 16px",lineHeight:1.75,fontSize:13,color:"#bbb"}}>{children}</div>}
    </div>
  );
};
const Metric = ({ label, value, sub, color = "#00e6b4" }) => (
  <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"14px 16px",flex:"1 1 130px",minWidth:130}}>
    <div style={{fontSize:10,color:"#777",marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
    <div style={{fontSize:20,fontWeight:700,color,fontFamily:"monospace"}}>{value}</div>
    {sub && <div style={{fontSize:11,color:"#666",marginTop:4}}>{sub}</div>}
  </div>
);

const ProgressBar = ({ label, pct, color, tokens }) => (
  <div style={{marginBottom:8}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:11,color:"#888"}}>
      <span>{label}</span>
      <span style={{fontFamily:"monospace",color:"#ccc"}}>{tokens}</span>
    </div>
    <div style={{height:16,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:4,transition:"width 0.4s",display:"flex",alignItems:"center",paddingLeft:6}}>
        {pct > 8 && <span style={{fontSize:9,color:"rgba(0,0,0,0.7)",fontWeight:700}}>{pct}%</span>}
      </div>
    </div>
  </div>
);

function AnatomyTab() {
  const [windowSize, setWindowSize] = useState(200);
  const layers = [
    { label:"System Prompt (Anthropic)",     pct:4,   color:"#3b82f6", tokens:"~8K",   note:"Shared; cached at 100% hit rate" },
    { label:"Tool Schemas (built-in)",        pct:7.5, color:"#6366f1", tokens:"~15K",  note:"Bash, Read, Edit, Write, Glob, Grep, etc." },
    { label:"MCP Tool Schemas",               pct:5,   color:"#8b5cf6", tokens:"5-50K", note:"GitHub MCP alone = ~46K tokens" },
    { label:"CLAUDE.md Hierarchy",            pct:2.5, color:"#a78bfa", tokens:"1-20K", note:"All levels: global + project + local" },
    { label:"Active Rules",                   pct:1,   color:"#c4b5fd", tokens:"~2K",   note:"Path-scoped .claude/rules/ files" },
    { label:"Conversation History",           pct:50,  color:"#00e6b4", tokens:"varies",note:"Grows each turn; compaction reclaims this" },
    { label:"Tool Results (last N turns)",    pct:15,  color:"#22d3ee", tokens:"varies",note:"Read/Bash outputs are often large" },
    { label:"Headroom (response buffer)",     pct:15,  color:"#f59e0b", tokens:"16-32K",note:"Reserved for model output" },
  ];
  return (<>
    <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16}}>
      <Metric label="Standard Window" value="200K" sub="Sonnet 4.6, Haiku 4.5" />
      <Metric label="Extended Window" value="1M" sub="Opus 4.6, Sonnet 4.6" color="#a78bfa" />
      <Metric label="Compaction Threshold" value="83.5%" sub="auto-compact triggers" color="#f59e0b" />
    </div>
    <Section title="Visual Context Window Breakdown" defaultOpen>
      <div style={{marginBottom:12,display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:12,color:"#888"}}>Window size:</span>
        {[200,500,1000].map(n=>(
          <button key={n} onClick={()=>setWindowSize(n)} style={{padding:"3px 10px",fontSize:11,fontFamily:"inherit",border:windowSize===n?"1px solid #00e6b4":"1px solid #333",background:windowSize===n?"rgba(0,230,180,0.1)":"transparent",color:windowSize===n?"#00e6b4":"#888",borderRadius:4,cursor:"pointer"}}>{n}K</button>
        ))}
      </div>
      <CodeBlock code={`┌───────────────────────────────────────┐ ${windowSize}K tokens total
│  System Prompt (Anthropic)           │ ~8K    ▶ Cached, shared
│  Tool Schemas (built-in tools)       │ ~15K   ▶ Cached, stable
│  MCP Tool Schemas                    │ 5-50K  ▶ Per-config
├───────────────────────────────────────┤
│  CLAUDE.md Hierarchy                 │ 1-20K  ▶ Every turn
│  Active .claude/rules/ files         │ ~2K    ▶ Path-scoped
├───────────────────────────────────────┤
│  Conversation History (grows)        │ ▼ grows each turn
│  Tool Results (last N turns)         │ ▼ Read/Bash outputs
├───────────────────────────────────────┤
│  Headroom (reserved for response)    │ 16-32K ▶ Always reserved
└───────────────────────────────────────┘`}/>
      <div style={{margin:"16px 0"}}>
        {layers.map(l=>(
          <div key={l.label} style={{marginBottom:10}}>
            <ProgressBar label={l.label} pct={l.pct} color={l.color} tokens={l.tokens}/>
            <div style={{fontSize:10,color:"#666",marginTop:2,paddingLeft:2}}>{l.note}</div>
          </div>
        ))}
      </div>
    </Section>
    <Section title="Context Reconstruction Order (every turn)">
      <p>Claude Code is <strong style={{color:"#fff"}}>stateless between API calls</strong>. The entire context is rebuilt from scratch each turn in this order (most stable prefix first for cache optimization):</p>
      <Table headers={["Order","Component","Cache Status"]} rows={[
        ["1","Tool definitions (built-in + MCP)","Cached — shared across users"],
        ["2","System prompt (Anthropic internal)","Cached — shared across users"],
        ["3","CLAUDE.md hierarchy (all levels)","Cached — per-project"],
        ["4","Auto-memory (MEMORY.md, ≤200 lines)","Cached — per-project"],
        ["5","Loaded skill descriptions","Cached — on-demand"],
        ["6","MCP server instructions","Cached — per-session config"],
        ["7","Conversation history","Partially cached (new turns miss)"],
        ["8","Path-scoped .claude/rules/","On-demand per directory"],
      ]}/>
    </Section>
  </>);
}

function ExtendedTab() {
  return (<>
    <Section title="200K vs 1M Window Comparison" defaultOpen>
      <Table headers={["Aspect","200K (Standard)","1M (Extended)"]} rows={[
        ["Models","Sonnet 4.6, Haiku 4.5, Opus 4.6","Opus 4.7+, Sonnet 4.6 (opt-in)"],
        ["Default?","Yes — all sessions","Opt-in: --max-context 1m"],
        ["Price surcharge","None","None since March 14, 2026 (Opus 4.7+)"],
        ["Latency impact","Baseline","+100-300ms for very large contexts"],
        ["Compaction threshold","83.5% = ~167K tokens","83.5% = ~835K tokens"],
        ["Best for","Most tasks — 95%+ of use cases","Large codebase analysis, long docs"],
      ]}/>
    </Section>
    <Section title="When 1M Window Actually Matters" defaultOpen>
      <Table headers={["Use Case","Tokens Needed","Use 1M?"]} rows={[
        ["Normal development session","20-80K","No — 200K is fine"],
        ["Large file analysis (100K loc codebase)","80-150K","No — 200K is fine"],
        ["Full repo context + long history","150-180K","Borderline — use /compact first"],
        ["Entire book / large PDF analysis","200-400K","Yes"],
        ["Multi-repo cross-reference","300-600K","Yes"],
        ["Long-running agentic tasks (1000+ turns)","200K+ compressed","Yes + compaction"],
      ]}/>
    </Section>
    <Section title="Enabling Extended Context">
      <CodeBlock code={`# CLI flag (per-session)
claude --max-context 1m

# In settings.json (persistent)
{
  "maxContext": "1m"
}

# Environment variable
export CLAUDE_MAX_CONTEXT=1m

# SDK usage
client.messages.create({
  model: "claude-opus-4-7",
  max_tokens: 8096,
  // 1M context is automatic for Opus 4.7 with large inputs
  messages: [...]
})`}/>
    </Section>
    <Section title="Cost Implications">
      <Callout type="tip">As of March 14, 2026, there is <strong>no price surcharge</strong> for extended context (1M window) on Opus 4.7 and newer models. You pay standard per-token rates regardless of window size.</Callout>
      <Table headers={["Model","Window","Input Price","Extended Price"]} rows={[
        ["claude-opus-4-7","1M","$15/MTok","$15/MTok (no surcharge)"],
        ["claude-sonnet-4-6","200K","$3/MTok","N/A"],
        ["claude-haiku-4-5","200K","$1/MTok","N/A"],
      ]}/>
    </Section>
  </>);
}

function CompactionTab() {
  return (<>
    <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16}}>
      <Metric label="Auto Threshold" value="83.5%" sub="of context used" />
      <Metric label="Circuit Breaker" value="v2.1.89+" sub="prevents infinite loops" color="#ef4444" />
      <Metric label="Manual Trigger" value="/compact" sub="optional focus topic" color="#a78bfa" />
    </div>
    <Section title="Auto-Compaction Flow" defaultOpen>
      <CodeBlock code={`Context usage reaches 83.5% (167K / 200K tokens)
       │
       ▼
Claude Code checks: is an agentic task in progress?
  │ Yes: Wait for natural pause (tool result received)
  │ No:  Compact immediately
       │
       ▼
Compaction LLM call:
  Input:  full conversation history
  Output: structured summary (what was done, key decisions,
          current state, open tasks, important artifacts)
       │
       ▼
Conversation history REPLACED with summary
Tool results for closed tasks DROPPED
System prompt + tools + CLAUDE.md PRESERVED
       │
       ▼
Context usage drops to ~20-30%
Session continues seamlessly`}/>
    </Section>
    <Section title="What Survives Compaction" defaultOpen>
      <Table headers={["Item","After Compaction","Notes"]} rows={[
        ["System prompt","Preserved intact","Never touched by compaction"],
        ["Tool schemas","Preserved intact","Never touched by compaction"],
        ["CLAUDE.md","Re-read from disk","May pick up changes made during session"],
        ["Conversation history","Replaced by summary","Summary is ~2-5K tokens vs 100K+"],
        ["Tool results (old)","Dropped","Bash/Read outputs from early turns gone"],
        ["Tool results (recent)","Included in summary","Important context preserved"],
        ["Cost accumulation","Preserved","Running total continues"],
        ["File edits made","Preserved in summary","What was changed is noted"],
      ]}/>
    </Section>
    <Section title="Circuit Breaker (v2.1.89+)">
      <p>Before v2.1.89, a bug could cause compaction to fail if the summary itself was too large, leading to an infinite compaction loop. The circuit breaker prevents this:</p>
      <CodeBlock code={`Compaction attempt 1: summary = 45K tokens -> OK
Compaction attempt 2: summary = 52K tokens -> OK
Compaction attempt 3: summary = 48K tokens -> OK

# If summary > threshold (configurable, default 60K):
Compaction attempt 4: summary = 65K tokens
  -> CIRCUIT BREAKER TRIGGERED
  -> Fallback: drop oldest 30% of turns
  -> Force-continue session
  -> Alert: [Context compaction needed manual intervention]`}/>
    </Section>
    <Section title="Manual /compact with Focus">
      <CodeBlock code={`# Compact and preserve focus on specific topic
/compact focus on the authentication refactor and open TODOs

# Compact without focus (general summary)
/compact

# The focus hint guides what the compaction LLM
# emphasizes in the summary. Without focus, it
# creates a balanced overview of all activity.`}/>
    </Section>
  </>);
}

function MeasureTab() {
  return (<>
    <Section title="/context Command Output" defaultOpen>
      <CodeBlock title="Example /context output" code={`Context window usage:
────────────────────────────────────────────
  System prompt:       8,142  (4.1%)
  Tool schemas:       15,830  (7.9%)
  MCP schemas:        46,210  (23.1%)  ⚠ GitHub MCP
  CLAUDE.md:           3,200  (1.6%)
  Rules:               1,050  (0.5%)
  Conversation:       62,400  (31.2%)
  Tool results:       24,800  (12.4%)
  ───────────────────────────────────────
  Total used:        161,632  (80.8%)
  Headroom:           38,368  (19.2%)
  Window:            200,000  tokens

  Auto-compact at:   167,000  (83.5%) — 5.4K turns est.`}/>
    </Section>
    <Section title="CLAUDE.md Size Guidelines" defaultOpen>
      <Table headers={["CLAUDE.md Size","Token Cost","Recommendation"]} rows={[
        ["< 100 lines","~500-1K tokens","Excellent — minimal overhead"],
        ["100-200 lines","~1-2K tokens","Good — acceptable overhead"],
        ["200-500 lines","~2-5K tokens","Marginal — consider splitting"],
        ["500-1000 lines","~5-10K tokens","Poor — move workflows to commands"],
        ["> 1000 lines","10K+ tokens","Bad — significant every-turn cost"],
      ]}/>
      <Callout type="warn">Every token in CLAUDE.md is paid on <strong>every single API call</strong>. A 10K token CLAUDE.md costs ~$0.03 per turn on Sonnet 4.6 — this adds up in long sessions.</Callout>
    </Section>
    <Section title="Measuring System Prompt Size">
      <CodeBlock title="Before and after CLAUDE.md changes" code={`# Step 1: /context before your change
  CLAUDE.md: 3,200 tokens

# Step 2: Edit CLAUDE.md (add/remove content)
vim CLAUDE.md

# Step 3: /context after change (in new session)
  CLAUDE.md: 4,800 tokens  (+1,600 tokens per turn)

# At $3/MTok (Sonnet), each session turn costs +$0.0048 extra
# Over 100 turns = +$0.48/session just from CLAUDE.md growth`}/>
    </Section>
    <Section title="Token Counting Without a Session">
      <CodeBlock code={`# Estimate tokens in any file (rough: 1 token ≈ 4 chars)
wc -c CLAUDE.md | awk '{print int($1/4), "tokens (estimated)"}'

# More accurate: use tiktoken (Python)
pip install tiktoken
python3 -c "
import tiktoken
enc = tiktoken.get_encoding('cl100k_base')
with open('CLAUDE.md') as f:
    text = f.read()
print(len(enc.encode(text)), 'tokens')
"`}/>
    </Section>
  </>);
}

function OptimizeTab() {
  return (<>
    <Section title="ToolSearch: Deferred Loading" defaultOpen>
      <p>ToolSearch (v2.1.7+) activates automatically when MCP tool descriptions exceed <strong style={{color:"#fff"}}>10K tokens</strong>. Tools are loaded as stubs and discovered on-demand. Full schemas land in <em>conversation history</em> (not the prefix), so cache hits are preserved.</p>
      <Table headers={["Without ToolSearch","With ToolSearch"]} rows={[
        ["All MCP schemas in prefix: ~46K tokens","MCP stubs in prefix: ~3K tokens"],
        ["Every turn pays for full schemas","Only used tools are fetched (conversation slot)"],
        ["Model sees all 91 GitHub tools","Model searches for relevant tools on demand"],
        ["Cache prefix includes full schemas","Cache prefix is smaller, hit rate improves"],
      ]}/>
    </Section>
    <Section title="@import Syntax for CLAUDE.md" defaultOpen>
      <p>Use <Code>@import</Code> to split a large CLAUDE.md into modules loaded on demand. Only the root CLAUDE.md is loaded at session start; imports are fetched when the relevant directory is accessed.</p>
      <CodeBlock code={`# CLAUDE.md (root) — keep this small
## Project Overview
This is a monorepo with frontend, backend, and infra.

@import ./frontend/CLAUDE.md   # loaded when editing frontend/
@import ./backend/CLAUDE.md    # loaded when editing backend/
@import ./infra/CLAUDE.md      # loaded when editing infra/`}/>
    </Section>
    <Section title="claudeMdExcludes">
      <CodeBlock title="settings.json — exclude specific paths" code={`{
  "claudeMdExcludes": [
    "**/node_modules/**",
    "**/dist/**",
    "**/.git/**",
    "**/vendor/**"
  ]
}`}/>
      <p>Prevents Claude Code from loading CLAUDE.md files from excluded paths, reducing accidental token bloat from generated directories.</p>
    </Section>
    <Section title="Caching ROI Calculator">
      <Table headers={["Context Size","Turns/Session","No Cache Cost","With Cache Cost","Savings"]} rows={[
        ["50K tokens","20 turns","$3.00 (Sonnet)","$0.42 (94% hit)","86%"],
        ["100K tokens","20 turns","$6.00","$0.72","88%"],
        ["150K tokens","30 turns","$13.50","$1.53","89%"],
        ["200K tokens","50 turns","$30.00","$3.30","89%"],
      ]}/>
      <Callout type="tip">The single highest-impact optimization is <strong>/clear between unrelated tasks</strong>. Every token of stale conversation history is paid every subsequent turn. Clearing resets to ~30K baseline.</Callout>
    </Section>
  </>);
}

export default function ContextWindowDiagram() {
  const [tab, setTab] = useState("anatomy");
  const content = { anatomy:<AnatomyTab/>, extended:<ExtendedTab/>, compaction:<CompactionTab/>, measure:<MeasureTab/>, optimize:<OptimizeTab/> };
  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:"#09090f",color:"#e0e0e0",minHeight:"100vh"}}>
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"20px 16px 0",background:"linear-gradient(180deg,rgba(0,230,180,0.03) 0%,transparent 100%)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontSize:19,fontWeight:700,color:"#fff",letterSpacing:-0.5}}>Context Window</span>
            <span style={{fontSize:11,padding:"3px 8px",background:"rgba(0,230,180,0.12)",color:"#00e6b4",borderRadius:4,fontWeight:600}}>Architecture & Optimization</span>
          </div>
          <div style={{fontSize:11,color:"#666",marginBottom:14}}>Claude Code CLI · v2.1.89+ · 200K standard / 1M extended</div>
          <div style={{display:"flex",gap:2,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 11px",fontSize:11,fontFamily:"inherit",fontWeight:tab===t.id?700:400,background:tab===t.id?"rgba(255,255,255,0.06)":"transparent",color:tab===t.id?"#fff":"#777",border:"none",borderBottom:tab===t.id?"2px solid #00e6b4":"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",borderRadius:"6px 6px 0 0"}}>
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
