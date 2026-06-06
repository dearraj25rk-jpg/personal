import { useState } from "react";

const TABS = [
  { id: "lifecycle", label: "Lifecycle", icon: "♻" },
  { id: "resume", label: "Resume Flow", icon: "▶" },
  { id: "commands", label: "Commands", icon: "/" },
  { id: "cost", label: "Cost Tracking", icon: "$" },
  { id: "sdk", label: "SDK Sessions", icon: "⟨⟩" },
  { id: "security", label: "Security", icon: "🔒" },
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

function LifecycleTab() {
  const states = [
    { id:"new",       label:"new",         color:"#3b82f6", desc:"claude command invoked" },
    { id:"init",      label:"initializing",color:"#f59e0b", desc:"loading CLAUDE.md, tools, MCP servers" },
    { id:"active",    label:"active",       color:"#00e6b4", desc:"processing user messages" },
    { id:"compacting",label:"compacting",   color:"#a78bfa", desc:"auto-compaction at 83.5% context" },
    { id:"completing",label:"completing",   color:"#f59e0b", desc:"finishing last tool calls" },
    { id:"ended",     label:"ended",        color:"#666",    desc:"session file written, process exits" },
  ];
  const transitions = [
    { from:"new",       to:"initializing",  trigger:"process start" },
    { from:"initializing",to:"active",      trigger:"ready prompt" },
    { from:"active",    to:"compacting",    trigger:">83.5% context used" },
    { from:"active",    to:"completing",    trigger:"Ctrl+D or /exit" },
    { from:"compacting",to:"active",        trigger:"compaction done" },
    { from:"completing",to:"ended",         trigger:"all tools finish" },
    { from:"active",    to:"active",        trigger:"/compact (manual)" },
    { from:"ended",     to:"active",        trigger:"/resume" },
  ];
  return (<>
    <Section title="State Machine" defaultOpen>
      <CodeBlock code={`      ┌─────────────────────────────────────────────────┐
      │              SESSION LIFECYCLE                  │
      └─────────────────────────────────────────────────┘

  ┌────────┐  process    ┌──────────────┐  ready    ┌────────┐
  │  new   │ ──────────► │ initializing │ ─────────► │ active │
  └────────┘  start      └──────────────┘  prompt    └────┬───┘
                                                          │
                    /resume  ◄──────────────────── ended ◄┤ Ctrl+D
                                  session file            │
                                  written                 │
                                                 >83.5% ctx│
                    ┌──────────────┐ compaction  ┌────────▼───────┐
                    │    active    │ ◄─────────── │  compacting    │
                    └──────────────┘   done       └────────────────┘`}/>
    </Section>
    <Section title="States Detail" defaultOpen>
      <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:8}}>
        {states.map(s=>(
          <div key={s.id} style={{flex:"1 1 180px",padding:"10px 12px",borderRadius:6,background:"rgba(255,255,255,0.03)",border:`1px solid ${s.color}44`}}>
            <div style={{fontSize:12,fontWeight:700,color:s.color,fontFamily:"monospace",marginBottom:4}}>{s.label}</div>
            <div style={{fontSize:11,color:"#888"}}>{s.desc}</div>
          </div>
        ))}
      </div>
    </Section>
    <Section title="Transitions Table">
      <Table headers={["From","To","Trigger"]} rows={transitions.map(t=>[t.from,t.to,t.trigger])}/>
    </Section>
    <Section title="Session Persistence">
      <p>On exit, Claude Code writes a session file to disk. The session captures:</p>
      <Table headers={["Data","Persisted?","Notes"]} rows={[
        ["Conversation messages","Yes","Full turn-by-turn history"],
        ["Tool call results","Yes","Read/Edit/Bash outputs"],
        ["Cost totals","Yes","Input/output/cache tokens and $"],
        ["Working directory","Yes","Restored on /resume"],
        ["CLAUDE.md content","No","Re-read from disk on resume"],
        ["MCP server connections","No","Re-established on resume"],
        ["Environment variables","No","Re-inherited on resume"],
      ]}/>
    </Section>
  </>);
}

function ResumeFlowTab() {
  return (<>
    <Section title="Session Storage Location" defaultOpen>
      <CodeBlock title="Session file paths" code={`# Primary location (per-project)
~/.claude/projects/<project-hash>/sessions/<session-id>.json

# Global sessions (no project context)
~/.claude/sessions/<session-id>.json

# Session ID format: UUID v4
# Example: a3f7c891-42b1-4d8e-9c12-0f5e8a3d1b67

# List all sessions for current project:
ls ~/.claude/projects/$(echo $PWD | md5sum | cut -c1-8)/sessions/`}/>
    </Section>
    <Section title="/resume Flow" defaultOpen>
      <CodeBlock code={`User types: /resume
       │
       ▼
┌─────────────────────────────────────────────┐
│  Session Picker (interactive list)           │
│                                              │
│  > My API refactor (2h ago)  $1.24  42 turns │
│    Fix CI pipeline  (1d ago)  $0.87  28 turns │
│    Code review task (3d ago)  $2.10  67 turns │
│                                              │
│  [↑↓ navigate]  [Enter select]  [/ search]  │
└─────────────────────────────────────────────┘
       │
       ▼ (select session)
┌─────────────────────────────────────────────┐
│  Restoring session a3f7c891...               │
│  ✓ Conversation history (42 turns)           │
│  ✓ Cost tracking ($1.24 accumulated)         │
│  ✓ Working directory (/home/user/myproject)  │
│  ✓ Config (model: sonnet, effort: normal)    │
│  ↻ MCP servers (re-connecting...)            │
│  ↻ CLAUDE.md (re-reading from disk)          │
└─────────────────────────────────────────────┘
       │
       ▼
  Session active — context reconstructed`}/>
    </Section>
    <Section title="What Gets Restored">
      <Table headers={["Item","Restored?","Source"]} rows={[
        ["Conversation history","Yes — full","session JSON"],
        ["Accumulated cost","Yes","session JSON"],
        ["Session name / ID","Yes","session JSON"],
        ["Working directory","Yes (best effort)","session JSON"],
        ["Model selection","Yes","session JSON"],
        ["CLAUDE.md content","Re-read live","current disk state"],
        ["MCP connections","Re-established","current .mcp.json"],
        ["Tool permissions","Re-read","current settings.json"],
        ["Environment variables","Re-inherited","current shell"],
      ]}/>
    </Section>
    <Section title="Resuming from CLI">
      <CodeBlock title="Command-line resume options" code={`# Resume most recent session
claude --resume

# Resume specific session by ID
claude --resume a3f7c891-42b1-4d8e-9c12-0f5e8a3d1b67

# Resume and immediately send a message
claude --resume --print 'Continue where we left off'

# List sessions without launching
claude --list-sessions`}/>
    </Section>
  </>);
}

function CommandsTab() {
  return (<>
    <Callout type="info">These slash commands are available inside any active Claude Code session. Type them at the input prompt.</Callout>
    <Section title="Session Commands Reference" defaultOpen>
      <Table headers={["Command","Description","Notes"]} rows={[
        ["/resume","Open session picker to restore a previous session","Keeps current working directory unless session has different one"],
        ["/rename <name>","Rename current session","Names appear in session picker; default is auto-generated from first message"],
        ["/usage","Show token usage breakdown for current session","Shows input, output, cache-read, cache-write tokens and cost"],
        ["/context","Show live context window breakdown","System, tools, CLAUDE.md, history, free space — helps plan before big tasks"],
        ["/clear","Reset conversation history","Keeps tools, CLAUDE.md, MCP connections; start fresh without restarting"],
        ["/compact [focus]","Summarize conversation and compact to save tokens","Optional focus topic guides what the summary retains"],
        ["/rewind","Open rewind picker to restore a previous checkpoint","Esc+Esc also triggers quick rewind to last checkpoint"],
        ["/cost","Show accumulated cost for this session","Per-model breakdown in v2.1.92+"],
        ["/exit","Exit session cleanly","Same as Ctrl+D; writes session file first"],
        ["/help","List all available commands","Includes custom commands from .claude/commands/"],
      ]}/>
    </Section>
    <Section title="/compact vs /clear">
      <Table headers={["Action","/compact","/clear"]} rows={[
        ["Conversation history","Summarized (compressed)","Deleted entirely"],
        ["Tool results","Summarized","Deleted"],
        ["System prompt / tools","Preserved","Preserved"],
        ["CLAUDE.md","Preserved","Preserved"],
        ["Cost accumulation","Continues","Resets"],
        ["Use when","Task ongoing, context filling","Switching to unrelated task"],
      ]}/>
    </Section>
    <Section title="/rewind Checkpoints">
      <p>Claude Code automatically creates checkpoints before and after each tool execution. <Code>/rewind</Code> lets you roll back to any checkpoint without restarting.</p>
      <CodeBlock title="Checkpoint lifecycle" code={`Turn 1: User message → [CHECKPOINT saved]
Turn 1: Tool call (Read file) → executes
Turn 1: Tool result → [CHECKPOINT saved]
Turn 1: Claude response
Turn 2: User message → [CHECKPOINT saved]
...

/rewind → picker shows all checkpoints with timestamps
Esc+Esc → quick-rewind to last checkpoint (1 step back)`}/>
    </Section>
  </>);
}

function CostTab() {
  return (<>
    <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16}}>
      <Metric label="Avg Cost/Dev/Day" value="~$6" sub="90th pct under $12" />
      <Metric label="Cache Hit Rate" value="85-95%" sub="well-configured sessions" color="#a78bfa" />
      <Metric label="Budget Flag" value="--max-budget-usd" sub="hard session cap" color="#f59e0b" />
    </div>
    <Section title="/usage Output Breakdown" defaultOpen>
      <CodeBlock title="Example /usage output (v2.1.92+)" code={`Session cost breakdown:
─────────────────────────────────────────────
Model: claude-sonnet-4-6

  Input tokens:        84,320   $0.253
  ├─ Cache writes:     12,100   $0.045  (1.25x)
  ├─ Cache reads:      68,200   $0.020  (0.1x)
  └─ Cache miss:        4,020   $0.012  (1.0x)

  Output tokens:        6,840   $0.103

  Cache hit rate: 94.3%

Total session cost: $0.433
─────────────────────────────────────────────
All-time: $47.82  (since 2026-01-15)`}/>
    </Section>
    <Section title="Token Component Breakdown" defaultOpen>
      <Table headers={["Component","Typical Size","Cached?","Notes"]} rows={[
        ["System prompt (Anthropic)","~8K tokens","Yes — shared","Same across all users; highest cache hit rate"],
        ["Tool schemas (built-in)","~15K tokens","Yes — shared","Bash, Read, Edit, etc. — stable prefix"],
        ["MCP tool schemas","5K-50K tokens","Yes — per-config","Varies hugely; GitHub MCP = ~46K"],
        ["CLAUDE.md content","1K-20K tokens","Yes — per-project","Every turn; keep under 5K for efficiency"],
        ["Conversation history","Grows with turns","Partial","Only new turns miss cache"],
        ["Tool results (Bash/Read)","Variable","No","Output content not cached"],
      ]}/>
    </Section>
    <Section title="--max-budget-usd Flag">
      <CodeBlock title="Budget enforcement" code={`# Hard cap per session: stops with error if exceeded
claude --max-budget-usd 2.00

# In settings.json for persistent cap:
{
  "env": {
    "CLAUDE_MAX_BUDGET_USD": "5.00"
  }
}

# Per-project cap in project CLAUDE.md:
<!-- budget: 1.50 -->

# Budget warning at 80% threshold:
[Budget warning: $1.20 / $1.50 used (80%)]`}/>
    </Section>
    <Section title="Cost Optimization Habits">
      <Table headers={["Habit","Why","Impact"]} rows={[
        ["/clear between tasks","Resets growing history; avoids paying for old turns","High"],
        ["Short CLAUDE.md (< 200 lines)","Runs every turn — size directly multiplies cost","High"],
        ["Disable unused MCP servers","Tool schemas are paid on every input","Medium-High"],
        ["Use Haiku for subagents","$1/MTok vs $3/MTok (Sonnet)","High for multi-agent"],
        ["/compact when > 60% context","Prevents expensive full rebuilds","Medium"],
        ["Name sessions with /rename","Easier to find and not accidentally abandon","Low (ergonomic)"],
      ]}/>
    </Section>
  </>);
}

function SDKTab() {
  return (<>
    <Section title="Python: Multi-turn Sessions" defaultOpen>
      <CodeBlock title="Python SDK — stateful multi-turn" code={`import anthropic

client = anthropic.Anthropic()

# Create a session (maintains history server-side)
session = client.beta.messages.sessions.create(
    model="claude-sonnet-4-6",
    system="You are a helpful coding assistant."
)

# First turn
response1 = client.beta.messages.sessions.send(
    session_id=session.id,
    messages=[{"role": "user", "content": "Explain async/await in Python"}]
)
print(response1.content[0].text)

# Second turn — history maintained automatically
response2 = client.beta.messages.sessions.send(
    session_id=session.id,
    messages=[{"role": "user", "content": "Show me an example"}]
)
print(response2.content[0].text)

# Save session ID for later resumption
print(f"Session ID: {session.id}")`}/>
    </Section>
    <Section title="TypeScript: Session Management" defaultOpen>
      <CodeBlock title="TypeScript SDK — session persistence" code={`import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function runSession() {
  // Create session
  const session = await client.beta.messages.sessions.create({
    model: "claude-sonnet-4-6",
    system: "You are a code reviewer."
  });

  // Store session.id to Redis/DB for resumption across processes
  await saveToDatabase({ sessionId: session.id });

  const response = await client.beta.messages.sessions.send({
    session_id: session.id,
    messages: [{ role: "user", content: "Review this PR diff: ..." }]
  });

  return response;
}

// Resume in a different process / Lambda invocation
async function resumeSession(sessionId: string, userMessage: string) {
  return client.beta.messages.sessions.send({
    session_id: sessionId,
    messages: [{ role: "user", content: userMessage }]
  });
}`}/>
    </Section>
    <Section title="Session Pooling for Parallelism">
      <CodeBlock title="Parallel session pool pattern" code={`import asyncio
import anthropic

client = anthropic.AsyncAnthropic()

async def process_task(session_id: str, task: str):
    response = await client.beta.messages.sessions.send(
        session_id=session_id,
        messages=[{"role": "user", "content": task}]
    )
    return response.content[0].text

async def main():
    # Create pool of specialized sessions
    architect_session = await client.beta.messages.sessions.create(
        model="claude-opus-4-6",
        system="You are a system architect. Focus on design."
    )
    reviewer_session = await client.beta.messages.sessions.create(
        model="claude-sonnet-4-6",
        system="You are a code reviewer. Focus on correctness."
    )

    # Run in parallel
    results = await asyncio.gather(
        process_task(architect_session.id, "Design a payment service"),
        process_task(reviewer_session.id, "Review auth.py")
    )
    return results`}/>
    </Section>
  </>);
}

function SecurityTab() {
  return (<>
    <Section title="Session File Locations" defaultOpen>
      <Table headers={["Location","Contents","Permissions"]} rows={[
        ["~/.claude/projects/<hash>/sessions/","Per-project session JSON files","600 (user read/write only)"],
        ["~/.claude/sessions/","Global sessions (no project)","600"],
        ["~/.claude/settings.json","Permissions, hooks, env vars","600"],
        ["~/.claude/logs/","Debug logs (if enabled)","600"],
      ]}/>
    </Section>
    <Section title="What Data is Persisted" defaultOpen>
      <Table headers={["Data Type","In Session File?","Privacy Notes"]} rows={[
        ["Conversation text","Yes","Full user and assistant messages stored in plaintext JSON"],
        ["File contents read by Bash/Read","Yes (in tool results)","Any file Claude reads is in the session file"],
        ["API keys / secrets (echoed)","Yes (if echoed in terminal)","Avoid echoing secrets; they land in session history"],
        ["Git credentials","No (handled by git)","Git operations don't write credentials to session"],
        ["Cost/token data","Yes","Non-sensitive metadata"],
        ["CLAUDE.md content","No","Re-read from disk; not persisted in session"],
      ]}/>
    </Section>
    <Section title="Clearing Sessions">
      <CodeBlock title="Session cleanup commands" code={`# Delete all sessions for current project
rm -rf ~/.claude/projects/$(echo $PWD | md5sum | cut -c1-8)/sessions/

# Delete all sessions globally
rm -rf ~/.claude/sessions/

# Delete a specific session
rm ~/.claude/projects/<hash>/sessions/<session-id>.json

# Via Claude Code (inside session)
/clear     # clears conversation (doesn't delete file)
/exit      # exits but preserves file for /resume`}/>
    </Section>
    <Section title="Enterprise Session Management">
      <Table headers={["Concern","Recommendation"]} rows={[
        ["PII in sessions","Configure CLAUDE_SESSIONS_DISABLED=1 for zero persistence; all sessions are in-memory only"],
        ["Audit trail","Session files are plaintext JSON — parse for compliance logging"],
        ["Storage limits","Add cron job to prune sessions older than N days"],
        ["Multi-user machines","Each Unix user has separate ~/.claude — no cross-user leakage"],
        ["Container environments","Mount ~/.claude as ephemeral volume for stateless execution"],
      ]}/>
    </Section>
  </>);
}

export default function SessionManagementDiagram() {
  const [tab, setTab] = useState("lifecycle");
  const content = { lifecycle:<LifecycleTab/>, resume:<ResumeFlowTab/>, commands:<CommandsTab/>, cost:<CostTab/>, sdk:<SDKTab/>, security:<SecurityTab/> };
  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:"#09090f",color:"#e0e0e0",minHeight:"100vh"}}>
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"20px 16px 0",background:"linear-gradient(180deg,rgba(0,230,180,0.03) 0%,transparent 100%)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontSize:19,fontWeight:700,color:"#fff",letterSpacing:-0.5}}>Session Management</span>
            <span style={{fontSize:11,padding:"3px 8px",background:"rgba(0,230,180,0.12)",color:"#00e6b4",borderRadius:4,fontWeight:600}}>Lifecycle & Control</span>
          </div>
          <div style={{fontSize:11,color:"#666",marginBottom:14}}>Claude Code CLI · v2.1.92+ · June 2026</div>
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
