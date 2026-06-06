import { useState } from "react";

const TABS = [
  { id: "arch",     label: "Architecture", icon: "🌐" },
  { id: "cloud",    label: "Cloud Sessions", icon: "☁" },
  { id: "matrix",   label: "Feature Matrix", icon: "⊡" },
  { id: "mobile",   label: "Mobile Use", icon: "📱" },
  { id: "security", label: "Security", icon: "🔒" },
  { id: "latency",  label: "Latency", icon: "⏱" },
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

function ArchTab() {
  return (<>
    <Section title="Remote Control Architecture" defaultOpen>
      <CodeBlock code={`Browser (claude.ai/code)
       │
       │  WebSocket / HTTPS (E2E encrypted)
       │
       ▼
┌────────────────────────────────┐
│      Remote Relay Server                │  hosted by Anthropic
│  (anthropic-relay.claude.ai)           │  or self-hosted (enterprise)
└────────────────────────────────┘
       │
       │  Outbound WebSocket from CLI
       │  (CLI initiates; no inbound ports needed)
       ▼
Claude Code CLI (your local machine)
  ├── Full file system access
  ├── All MCP servers you've configured
  ├── All hooks (pre/post tool)
  ├── Local shell / terminal
  ├── Local network (internal APIs, DBs)
  └── Full Claude Code feature set`}/>
    </Section>
    <Section title="Authentication Flow" defaultOpen>
      <CodeBlock code={`Step 1: Browser authenticates with Anthropic (OAuth/SSO)

Step 2: Browser requests a relay session token
        POST /relay/sessions
        → { relay_token: "rly_abc123...", relay_url: "wss://relay.anthropic.com/..." }

Step 3: Token displayed to user as QR code or short code
        [Show on screen: CONNECT CODE: XK-4821-ZP]

Step 4: User runs on local machine:
        claude --remote
        (CLI polls relay server for pending connection)

Step 5: User enters connect code in browser OR
        CLI auto-connects via shared account session

Step 6: Relay establishes bidirectional tunnel
        Browser ↔ Relay ↔ CLI

Step 7: All Claude Code features available through browser UI`}/>
    </Section>
    <Section title="Network Requirements">
      <Table headers={["Connection","Direction","Protocol","Notes"]} rows={[
        ["Browser → Relay","Outbound from browser","WSS / HTTPS","Standard web traffic; works through corporate proxies"],
        ["CLI → Relay","Outbound from CLI machine","WSS","CLI initiates; no inbound ports needed on local machine"],
        ["CLI → Anthropic API","Outbound from CLI machine","HTTPS","api.anthropic.com:443 — always required"],
        ["CLI → MCP servers","Local","stdio / SSE","No internet needed for local MCP"],
      ]}/>
      <Callout type="tip">The CLI only needs outbound connections. No port forwarding, no firewall rules, no public IP required on your local machine.</Callout>
    </Section>
  </>);
}

function CloudTab() {
  return (<>
    <Section title="Cloud Sessions vs Remote Control" defaultOpen>
      <div style={{display:"flex",flexWrap:"wrap",gap:12,margin:"12px 0"}}>
        <div style={{flex:"1 1 280px",padding:"14px 16px",background:"rgba(59,130,246,0.05)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:8}}>
          <div style={{fontSize:13,fontWeight:700,color:"#3b82f6",marginBottom:10}}>Remote Control</div>
          <div style={{fontSize:12,color:"#bbb",lineHeight:1.8}}>
            ✓ Requires local Claude Code CLI<br/>
            ✓ Browser is the UI; execution on local machine<br/>
            ✓ Full local file system access<br/>
            ✓ All configured MCP servers<br/>
            ✓ All hooks supported<br/>
            ✓ Local network access<br/>
            ✓ CLI must be running and connected
          </div>
        </div>
        <div style={{flex:"1 1 280px",padding:"14px 16px",background:"rgba(0,230,180,0.05)",border:"1px solid rgba(0,230,180,0.2)",borderRadius:8}}>
          <div style={{fontSize:13,fontWeight:700,color:"#00e6b4",marginBottom:10}}>Cloud Sessions</div>
          <div style={{fontSize:12,color:"#bbb",lineHeight:1.8}}>
            ✓ No local CLI needed<br/>
            ✓ Anthropic runs Claude Code in their cloud<br/>
            ✓ Browser is fully native interface<br/>
            ✓ Cloud file system (ephemeral)
            ╳ No local file access<br/>
            ╳ No local MCP servers<br/>
            ╳ Hooks not supported<br/>
            ╳ No local network<br/>
          </div>
        </div>
      </div>
    </Section>
    <Section title="How Cloud Sessions Work" defaultOpen>
      <CodeBlock code={`User visits claude.ai/code in browser
       │
       ▼
Browser UI detects: no CLI connected
       │
       ▼
Offer: "Start Cloud Session"
       │
       ▼
Anthropic spins up ephemeral container:
  ├── Ubuntu Linux environment
  ├── Claude Code CLI pre-installed
  ├── Cloud file system (up to 50GB)
  ├── Outbound internet access (configurable)
  └── Session duration: up to 4 hours
       │
       ▼
User works in browser terminal / chat UI
       │
       ▼
Session ends: container destroyed, files lost
  (unless exported or committed to git)`}/>
    </Section>
    <Section title="Cloud Session Persistence">
      <Table headers={["Data","Persists After Session?","How to Keep"]} rows={[
        ["Conversation history","Yes (in account)","Automatic — saved to account"],
        ["Files created","No (container destroyed)","git commit & push before session ends"],
        ["Installed packages","No","Use requirements.txt / package.json"],
        ["Environment variables","No","Store in project CLAUDE.md or settings"],
        ["Claude Code config","Yes (synced)","Synced from account settings"],
      ]}/>
      <Callout type="warn">Always commit and push your work before a Cloud Session ends. The container and all local files are permanently destroyed at session end.</Callout>
    </Section>
  </>);
}

function MatrixTab() {
  const yes = <span style={{color:"#00e6b4",fontWeight:700"}}>Yes</span>;
  const no  = <span style={{color:"#ef4444",fontWeight:700"}}>No</span>;
  const lim = <span style={{color:"#f59e0b",fontWeight:700"}}>Limited</span>;
  const partial = <span style={{color:"#f59e0b",fontWeight:700"}}>Partial</span>;
  return (<>
    <Section title="Feature Comparison Matrix" defaultOpen>
      <Table headers={["Feature","Local CLI","Remote Control","Cloud Sessions"]} rows={[
        ["File access — local filesystem",yes,yes,no],
        ["File access — cloud filesystem",no,no,yes],
        ["MCP servers (local config)",yes,yes,no],
        ["MCP servers (cloud config)",no,lim,lim],
        ["Hooks (pre/post tool)",yes,yes,no],
        ["Terminal / shell access",yes,"Yes (over relay)","Browser terminal"],
        ["Local network access",yes,yes,no],
        ["Internet access",yes,"Restricted","Anthropic cloud"],
        ["Custom themes",yes,yes,yes],
        ["Session resume (/resume)",yes,yes,partial],
        ["Cost tracking",yes,yes,yes],
        ["/context command",yes,yes,yes],
        ["Batch / scheduled tasks",yes,lim,yes],
        ["Mobile browser UI",no,yes,yes],
        ["Simultaneous users",no,"1 per CLI","1 per container"],
        ["Persistent environment",yes,yes,no],
      ]}/>
    </Section>
    <Section title="Choosing the Right Mode">
      <Table headers={["Scenario","Recommended Mode"]} rows={[
        ["Normal development on local machine","Local CLI"],
        ["Development from a tablet or mobile","Remote Control (CLI on desktop, browser on tablet)"],
        ["Quick task with no local CLI available","Cloud Sessions"],
        ["Code review from any device","Remote Control or Cloud Sessions"],
        ["Using local databases / internal APIs","Local CLI or Remote Control"],
        ["Pair programming (one machine, one browser)","Remote Control"],
        ["CI/CD tasks in cloud","Cloud Sessions"],
        ["Privacy-sensitive work","Local CLI (no relay involved)"],
      ]}/>
    </Section>
  </>);
}

function MobileTab() {
  return (<>
    <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16}}>
      <Metric label="Access URL" value="claude.ai" sub="/code on mobile browser" />
      <Metric label="Mode" value="Remote" sub="or Cloud Sessions" color="#a78bfa" />
      <Metric label="iOS" value="Safari" sub="or any browser" color="#f59e0b" />
    </div>
    <Section title="iOS / Android Setup" defaultOpen>
      <CodeBlock code={`# Option A: Remote Control (recommended for power users)

1. Start CLI on your main machine:
   claude --remote
   → shows connect code: XK-4821-ZP

2. On mobile browser, go to: claude.ai/code
3. Sign in with your Anthropic account
4. Tap "Connect to local machine"
5. Enter connect code
6. Full Claude Code accessible from phone/tablet

# Option B: Cloud Sessions (no local machine needed)

1. Go to claude.ai/code on mobile browser
2. Sign in
3. Tap "New Cloud Session"
4. Ephemeral Linux environment in browser`}/>
    </Section>
    <Section title="Mobile Typing Tips" defaultOpen>
      <Table headers={["Tip","Detail"]} rows={[
        ["Use slash commands","/ autocomplete reduces typing significantly on small keyboards"],
        ["Voice-to-text","Use device voice input for longer prompts — works well with Claude"],
        ["External keyboard","Bluetooth keyboard dramatically improves mobile coding experience"],
        ["Landscape mode","More horizontal space for code blocks and terminal output"],
        ["Pinch to zoom","Code blocks support pinch-to-zoom in mobile Safari/Chrome"],
        ["Bookmarks","Bookmark claude.ai/code for quick access"],
        ["/resume","Resume previous sessions to avoid retyping context on mobile"],
      ]}/>
    </Section>
    <Section title="Limitations on Mobile">
      <Table headers={["Limitation","Workaround"]} rows={[
        ["No local file access from phone itself","Use Remote Control to access desktop files, or Cloud Sessions"],
        ["Smaller screen for code review","Use /compact to get text summaries rather than full code"],
        ["Virtual keyboard covers terminal output","Scroll terminal up; use external keyboard"],
        ["No MCP local server on phone","Remote Control uses desktop MCP config"],
        ["Session may disconnect on app switch (iOS)","/resume to reconnect; sessions are persisted"],
        ["No multi-window","Use browser tabs for multiple sessions"],
      ]}/>
    </Section>
    <Section title="Best Mobile Workflows">
      <p>Mobile Claude Code works best for these use cases:</p>
      <Table headers={["Use Case","Mode","Why"]} rows={[
        ["Code review on the go","Remote Control","See actual local files; make edits that land on desktop"],
        ["Reading docs / asking questions","Cloud Sessions","No local machine needed"],
        ["Reviewing PR comments","Remote Control (with GitHub MCP)","Full context from local repo"],
        ["Writing / content tasks","Cloud Sessions","No code needed; simple browser interface"],
        ["Monitoring long-running tasks","Remote Control","Check on running agent from phone"],
      ]}/>
    </Section>
  </>);
}

function SecurityTab() {
  return (<>
    <Section title="End-to-End Encryption" defaultOpen>
      <CodeBlock code={`Encryption layer overview:

Browser ──TLS 1.3──► Relay Server
               (Anthropic sees: encrypted blob)
               (Cannot read message content)

Relay Server ──TLS 1.3──► CLI

Additional E2E layer (over TLS):
Browser ──X25519 + ChaCha20-Poly1305──► CLI
         (Relay cannot decrypt even with TLS)
         (Key exchange happens browser↔CLI directly)
         (Relay sees only opaque encrypted frames)`}/>
    </Section>
    <Section title="Relay Server Trust Model" defaultOpen>
      <Table headers={["Question","Answer"]} rows={[
        ["Does relay see your code?","No — E2E encrypted; relay sees only opaque frames"],
        ["Does relay see your prompts?","No — same E2E encryption applies to all messages"],
        ["Does relay see file contents?","No — all tool results are E2E encrypted"],
        ["Who hosts the relay?","Anthropic (default) or self-hosted (enterprise option)"],
        ["Is relay required for Cloud Sessions?","Cloud Sessions don't use relay; Anthropic hosts the compute directly"],
        ["What does relay store?","Only connection metadata (session IDs, timestamps) — no content"],
      ]}/>
    </Section>
    <Section title="What Data Passes Through Relay">
      <Table headers={["Data Type","Passes Through Relay?","Encrypted?"]} rows={[
        ["User chat messages","Yes (E2E)","Yes — relay cannot read"],
        ["Claude's responses","Yes (E2E)","Yes — relay cannot read"],
        ["Tool call requests (Read/Bash/etc)","Yes (E2E)","Yes"],
        ["Tool results (file contents, command output)","Yes (E2E)","Yes"],
        ["CLAUDE.md content","Yes (in system prompt, E2E)","Yes"],
        ["Session metadata (timing, byte count)","Yes","No — relay sees this"],
        ["Your Anthropic account identity","Yes","No — needed for auth"],
        ["API key","No — CLI uses it directly","N/A"],
      ]}/>
    </Section>
    <Section title="Enterprise Self-Hosted Relay">
      <CodeBlock title="Self-hosted relay configuration" code={`# In ~/.claude/settings.json:
{
  "remoteControl": {
    "relayUrl": "wss://relay.your-company.com",
    "relayApiKey": "your-relay-auth-key"
  }
}

# Self-hosted relay benefits:
# - Traffic stays in your network
# - Full audit logging under your control
# - Can restrict to company SSO only
# - Zero Anthropic infrastructure in data path

# Anthropic provides open-source relay server:
# github.com/anthropics/claude-code-relay`}/>
    </Section>
  </>);
}

function LatencyTab() {
  return (<>
    <Section title="Latency Sources" defaultOpen>
      <CodeBlock code={`Tool execution roundtrip comparison:

┌──────────────────────────────────────────────────────────┐
│ Local CLI                                             │
│ API call → tool execution → result back:              │
│   0ms   tool dispatch (in-process)                    │
│   5ms   file read / bash execution                    │
│   5ms   result processing                             │
│   Total non-API tool overhead: ~10ms                  │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│ Remote Control (browser ↔ relay ↔ CLI)                │
│ API call → tool execution → result back:              │
│   0ms    tool dispatch                                │
│   5ms    file read / bash execution                   │
│   5ms    result processing                            │
│  30-80ms relay roundtrip (browser↔relay↔CLI↔relay↔browser) │
│   Total non-API tool overhead: ~40-90ms               │
└──────────────────────────────────────────────────────────┘`}/>
    </Section>
    <Section title="Latency Impact by Scenario" defaultOpen>
      <Table headers={["Scenario","Local CLI","Remote Control","Impact"]} rows={[
        ["Single read of a file","~10ms overhead","~50ms overhead","Negligible vs API call (1-5s)"],
        ["10 file reads in sequence","~100ms","~500ms","Small but noticeable"],
        ["100 tool calls (agentic)","~1s overhead","~5-9s overhead","Meaningful for long agent runs"],
        ["Typing / interactive","N/A","~50ms key response","Imperceptible in practice"],
        ["Large file (5MB) read","~50ms","~200ms","Relay bandwidth matters"],
        ["Bash command (10s run)","10s + 10ms","10s + 50ms","Dominated by command duration"],
      ]}/>
    </Section>
    <Section title="Minimizing Remote Control Latency">
      <Table headers={["Optimization","Effect"]} rows={[
        ["Self-hosted relay in same region as CLI machine","Reduces relay RTT from 30-80ms to 5-20ms"],
        ["Use batched operations (read multiple files in one tool call)","Reduces total relay round-trips"],
        ["Prefer /compact over manual inspection loops","Fewer tool calls = fewer relay hops"],
        ["Use cloud sessions for tasks with many small tool calls","Eliminates relay; compute runs where Claude API is"],
        ["Wired ethernet on local machine","Reduces WiFi jitter in relay path"],
      ]}/>
    </Section>
    <Section title="When Latency Matters Least">
      <Callout type="tip">For <strong>interactive conversations</strong> and <strong>code review</strong>, Remote Control latency is completely imperceptible. The 40-90ms overhead only becomes noticeable when running autonomous agents that execute hundreds of tool calls in rapid succession.</Callout>
      <p>Rule of thumb: if your task takes more than 10 seconds, relay overhead is less than 1% of total time and you should not worry about it.</p>
    </Section>
  </>);
}

export default function RemoteControlDiagram() {
  const [tab, setTab] = useState("arch");
  const content = { arch:<ArchTab/>, cloud:<CloudTab/>, matrix:<MatrixTab/>, mobile:<MobileTab/>, security:<SecurityTab/>, latency:<LatencyTab/> };
  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:"#09090f",color:"#e0e0e0",minHeight:"100vh"}}>
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"20px 16px 0",background:"linear-gradient(180deg,rgba(59,130,246,0.03) 0%,transparent 100%)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontSize:19,fontWeight:700,color:"#fff",letterSpacing:-0.5}}>Remote Control</span>
            <span style={{fontSize:11,padding:"3px 8px",background:"rgba(59,130,246,0.12)",color:"#3b82f6",borderRadius:4,fontWeight:600}}>Cloud Sessions</span>
          </div>
          <div style={{fontSize:11,color:"#666",marginBottom:14}}>Claude Code · claude.ai/code · Browser + CLI bridge</div>
          <div style={{display:"flex",gap:2,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 11px",fontSize:11,fontFamily:"inherit",fontWeight:tab===t.id?700:400,background:tab===t.id?"rgba(255,255,255,0.06)":"transparent",color:tab===t.id?"#fff":"#777",border:"none",borderBottom:tab===t.id?"2px solid #3b82f6":"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",borderRadius:"6px 6px 0 0"}}>
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
