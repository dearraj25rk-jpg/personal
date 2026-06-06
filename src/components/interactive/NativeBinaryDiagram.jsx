import { useState } from "react";

const TABS = [
  { id: "arch", label: "Architecture", icon: "⛪" },
  { id: "tools", label: "Embedded Tools", icon: "🔧" },
  { id: "perf", label: "Performance", icon: "⚡" },
  { id: "install", label: "Installation", icon: "⬇" },
  { id: "enterprise", label: "Enterprise", icon: "🏢" },
  { id: "updates", label: "DISABLE_UPDATES", icon: "🔒" },
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
    <div style={{display:"flex",flexWrap:"wrap",gap:10,marginBottom:16}}>
      <Metric label="Introduced" value="v2.1.113" sub="native binary" />
      <Metric label="Cold Start" value="~350ms" sub="vs ~800ms (Node.js)" color="#f59e0b" />
      <Metric label="Binary Size" value="~45MB" sub="self-contained" color="#a78bfa" />
    </div>
    <Section title="Before vs After v2.1.113" defaultOpen>
      <div style={{display:"flex",flexWrap:"wrap",gap:12,margin:"12px 0"}}>
        <div style={{flex:"1 1 300px",padding:"14px 16px",background:"rgba(239,68,68,0.05)",border:"1px solid rgba(239,68,68,0.2)",borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:700,color:"#ef4444",marginBottom:10}}>Before v2.1.113 (Node.js)</div>
          <CodeBlock code={`# Installation
npm install -g @anthropic-ai/claude-code

# Creates:
~/.npm/lib/node_modules/
  @anthropic-ai/claude-code/
    node_modules/     # 200MB+
    index.js
    ...

# Requires:
- Node.js runtime (v18+)
- npm or npx
- ~200MB disk space
- node_modules on PATH

# Cold start: load V8, init Node,
#   resolve require() tree
#   → ~800ms`}/>
        </div>
        <div style={{flex:"1 1 300px",padding:"14px 16px",background:"rgba(0,230,180,0.05)",border:"1px solid rgba(0,230,180,0.2)",borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:700,color:"#00e6b4",marginBottom:10}}>After v2.1.113 (Native Binary)</div>
          <CodeBlock code={`# Installation
curl -fsSL https://claude.ai/install.sh | sh

# Creates:
~/.claude/bin/claude  # single file

# Requires:
- Nothing (fully self-contained)
- ~45MB disk space
- No runtime dependency

# Embedded inside binary:
- bfs  (built-in file search)
- ugrep (built-in grep)
- All JS compiled + bundled

# Cold start: OS loads binary
#   → ~300-500ms`}/>
        </div>
      </div>
    </Section>
    <Section title="Embedded Rust Tools">
      <p>The native binary embeds two native tools compiled from Rust/C that replace system tools for better performance and consistency:</p>
      <Table headers={["Tool","Replaces","Language","Key Advantages"]} rows={[
        ["bfs","find (system)","C",".gitignore-aware, BFS algorithm, symlink control"],
        ["ugrep","ripgrep / grep","C++","Unicode-first, PCRE2, multiline mode"],
      ]}/>
    </Section>
    <Section title="Binary Locations">
      <CodeBlock code={`# Default install location
~/.claude/bin/claude

# symlinked to PATH by installer:
/usr/local/bin/claude -> ~/.claude/bin/claude

# Verify which binary is running:
which claude
claude --version  # shows binary build info

# Check if native binary or Node.js wrapper:
file $(which claude)
# Native:  ELF 64-bit LSB executable (Linux)
# Native:  Mach-O 64-bit executable (macOS)
# Node.js: POSIX shell script`}/>
    </Section>
  </>);
}

function ToolsTab() {
  return (<>
    <Section title="bfs vs find" defaultOpen>
      <div style={{display:"flex",flexWrap:"wrap",gap:12,margin:"12px 0"}}>
        <div style={{flex:"1 1 260px",padding:"12px 14px",background:"rgba(0,230,180,0.05)",border:"1px solid rgba(0,230,180,0.2)",borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:700,color:"#00e6b4",marginBottom:8}}>bfs (built-in)</div>
          <Table headers={["Feature","Value"]} rows={[
            ["Algorithm","BFS (breadth-first)"],
            [".gitignore","Automatic awareness"],
            ["Symlinks","Fine-grained control"],
            ["Performance","30-50% faster on repos"],
            ["Consistency","Same on all platforms"],
            ["Hidden files","Configurable"],
          ]}/>
        </div>
        <div style={{flex:"1 1 260px",padding:"12px 14px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:700,color:"#888",marginBottom:8}}>find (system)</div>
          <Table headers={["Feature","Value"]} rows={[
            ["Algorithm","DFS (depth-first)"],
            [".gitignore","Not aware"],
            ["Symlinks","-L flag only"],
            ["Performance","Baseline"],
            ["Consistency","Varies by OS/version"],
            ["Hidden files","Included by default"],
          ]}/>
        </div>
      </div>
      <CodeBlock title="bfs usage (available inside Bash tool)" code={`# bfs is on PATH inside Claude Code's Bash tool
bfs . -name '*.ts' -not -path '*/node_modules/*'

# Respects .gitignore automatically:
bfs . -type f -name '*.py'
# → skips .gitignore'd files without -not -path flags

# Control symlink behavior:
bfs . -follow -name '*.json'  # follow symlinks
bfs . -nohidden -name '*.md'  # skip hidden dirs`}/>
    </Section>
    <Section title="ugrep vs ripgrep/grep" defaultOpen>
      <div style={{display:"flex",flexWrap:"wrap",gap:12,margin:"12px 0"}}>
        <div style={{flex:"1 1 260px",padding:"12px 14px",background:"rgba(0,230,180,0.05)",border:"1px solid rgba(0,230,180,0.2)",borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:700,color:"#00e6b4",marginBottom:8}}>ugrep (built-in)</div>
          <Table headers={["Feature","Value"]} rows={[
            ["Encoding","Unicode-first"],
            ["Regex","PCRE2 + extended"],
            ["Multiline","Native support"],
            ["Format","Structured output"],
            [".gitignore","Aware"],
            ["Binary files","Smart skip"],
          ]}/>
        </div>
        <div style={{flex:"1 1 260px",padding:"12px 14px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8}}>
          <div style={{fontSize:12,fontWeight:700,color:"#888",marginBottom:8}}>ripgrep (system, if installed)</div>
          <Table headers={["Feature","Value"]} rows={[
            ["Encoding","UTF-8 primary"],
            ["Regex","Fancy regex (subset)"],
            ["Multiline","--multiline flag"],
            ["Format","Text output"],
            [".gitignore","Aware"],
            ["Binary files","Skip"],
          ]}/>
        </div>
      </div>
      <Callout type="tip">Claude Code's Grep tool uses ugrep internally. It is always available regardless of whether ripgrep is installed on the system.</Callout>
    </Section>
  </>);
}

function PerfTab() {
  const benchmarks = [
    { metric:"Cold start time",    before:"~800ms", after:"~350ms", delta:"-56%",  good:true },
    { metric:"Glob (10K files)",   before:"~420ms", after:"~240ms", delta:"-43%",  good:true },
    { metric:"Search throughput",  before:"~1.2 GB/s", after:"~1.4 GB/s", delta:"+17%", good:true },
    { metric:"Memory (idle)",      before:"~85MB",  after:"~55MB",  delta:"-35%",  good:true },
    { metric:"npm install time",   before:"~12s",   after:"0s (none)",delta:"eliminated", good:true },
    { metric:"Binary size",        before:"~200MB (node_modules)",after:"~45MB",delta:"-78%",good:true },
  ];
  return (<>
    <Section title="Performance Benchmarks" defaultOpen>
      <Table headers={["Metric","Before (Node.js)","After (Native)","Change"]} rows={benchmarks.map(b=>[
        b.metric,
        <span style={{color:"#ef4444"}}>{b.before}</span>,
        <span style={{color:"#00e6b4"}}>{b.after}</span>,
        <span style={{color:b.good?"#00e6b4":"#ef4444",fontWeight:700}}>{b.delta}</span>,
      ])}/>
    </Section>
    <Section title="Cold Start Deep Dive">
      <CodeBlock code={`# Node.js startup profile (before v2.1.113):
0ms:    OS creates process
50ms:   Node.js V8 engine initializes
150ms:  CommonJS require() resolution begins
400ms:  node_modules loaded (axios, zod, ink, ...)
650ms:  Application code parsed
750ms:  CLI argument parsing
800ms:  First prompt appears

# Native binary startup (v2.1.113+):
0ms:    OS loads binary (ELF/Mach-O)
50ms:   Static initializers run
200ms:  Bundled JS runtime init (QuickJS)
300ms:  Config files read
350ms:  First prompt appears`}/>
    </Section>
    <Section title="When Performance Matters Most">
      <Table headers={["Scenario","Impact","Notes"]} rows={[
        ["npx claude (on-demand)","High — eliminated 12s install + 800ms","npx always re-resolved package; native binary is instant"],
        ["CI/CD pipeline tasks","High — multiplied by job count","50 parallel jobs × 800ms saved = 40s/run"],
        ["Short tasks (--print)","High — startup is large fraction","350ms vs 800ms matters when task is 2-3 seconds"],
        ["Long interactive sessions","Low — startup is one-time","100ms less startup negligible vs 30min session"],
        ["Docker images","High — no Node.js layer needed","Reduces image size; faster pull"],
      ]}/>
    </Section>
  </>);
}

function InstallTab() {
  return (<>
    <Section title="Installation Methods" defaultOpen>
      <Table headers={["Method","Command","Recommended For"]} rows={[
        ["curl (recommended)","curl -fsSL https://claude.ai/install.sh | sh","Most users — installs native binary"],
        ["npm (legacy)","npm install -g @anthropic-ai/claude-code","Node.js-centric environments"],
        ["Homebrew (macOS)","brew install anthropic/tap/claude-code","macOS users who prefer brew"],
        ["Manual binary","Download from releases — chmod +x — move to PATH","Airgap / enterprise"],
      ]}/>
    </Section>
    <Section title="curl Install Details" defaultOpen>
      <CodeBlock code={`# Full install command
curl -fsSL https://claude.ai/install.sh | sh

# What the script does:
1. Detects OS (Linux x64/arm64, macOS x64/arm64)
2. Downloads signed binary from releases CDN
3. Verifies SHA256 hash
4. Places binary at ~/.claude/bin/claude
5. Adds ~/.claude/bin to PATH in ~/.bashrc / ~/.zshrc
6. Creates symlink at /usr/local/bin/claude (if writable)
7. Prints version confirmation

# Verify installation:
claude --version
which claude  # should show ~/.claude/bin/claude or /usr/local/bin/claude`}/>
    </Section>
    <Section title="Binary Hash Verification">
      <CodeBlock code={`# Download binary and verify SHA256:
curl -L https://github.com/anthropics/claude-code/releases/download/v2.1.113/claude-linux-x64 \
     -o claude

# Download expected hash:
curl -L https://github.com/anthropics/claude-code/releases/download/v2.1.113/claude-linux-x64.sha256 \
     -o claude.sha256

# Verify:
sha256sum --check claude.sha256
# claude: OK

# Install if verified:
chmod +x claude
mv claude ~/.claude/bin/claude`}/>
    </Section>
    <Section title="Version Management">
      <CodeBlock code={`# Check current version:
claude --version

# Update to latest:
claude update

# Install specific version:
claude update --version 2.1.113

# List available versions:
claude update --list

# Roll back:
claude update --version 2.1.100`}/>
    </Section>
  </>);
}

function EnterpriseTab() {
  return (<>
    <Section title="Airgap Deployment" defaultOpen>
      <CodeBlock title="Step-by-step airgap deployment" code={`# Step 1: Download binary on internet-connected machine
curl -L https://github.com/anthropics/claude-code/releases/download/v2.1.113/claude-linux-x64 \
     -o claude-linux-x64
# Download hash file too:
curl -L https://github.com/anthropics/claude-code/releases/download/v2.1.113/claude-linux-x64.sha256 \
     -o claude-linux-x64.sha256

# Step 2: Verify hash
sha256sum --check claude-linux-x64.sha256

# Step 3: Transfer to airgapped machines (USB, internal repo, etc.)
scp claude-linux-x64 airgap-machine:~/.claude/bin/claude

# Step 4: On airgapped machine
chmod +x ~/.claude/bin/claude
export DISABLE_UPDATES=1  # prevent update checks
export ANTHROPIC_API_KEY=your-key

# Step 5: Verify it runs
claude --version

# Note: Binary requires HTTPS to Anthropic API only
# All other network calls (MCP, tools) are via your own config`}/>
    </Section>
    <Section title="DISABLE_UPDATES for Version Pinning" defaultOpen>
      <CodeBlock title="Version pinning in enterprise" code={`# In ~/.bashrc / /etc/profile.d/claude.sh:
export DISABLE_UPDATES=1

# Or in ~/.claude/settings.json:
{
  "env": {
    "DISABLE_UPDATES": "1"
  }
}

# Effect:
# - claude update command is disabled
# - Auto-update checks suppressed
# - No background update downloads
# - Version stays pinned until you manually replace binary

# Deploy new version:
# 1. Test new binary in staging
# 2. Replace binary file on all machines
# 3. No restart needed (binary is exec'd fresh each time)`}/>
    </Section>
    <Section title="Enterprise Distribution Patterns">
      <Table headers={["Pattern","How","Best For"]} rows={[
        ["Shared NFS mount","One binary on shared mount; all machines use it via PATH","Homogeneous Linux clusters"],
        ["Internal apt/yum repo","Package binary as .deb/.rpm; managed by OS package tools","Large Linux fleets"],
        ["Docker base image","COPY claude binary into base image; no Node.js layer needed","Container-based CI"],
        ["Ansible playbook","Distribute binary via Ansible files module with checksum verify","Config management"],
        ["Homebrew enterprise tap","Host private tap; brew install your-tap/claude-code","macOS fleets"],
      ]}/>
    </Section>
  </>);
}

function UpdatesTab() {
  return (<>
    <Section title="DISABLE_UPDATES Explained" defaultOpen>
      <Table headers={["Aspect","Detail"]} rows={[
        ["Env var","DISABLE_UPDATES=1"],
        ["Scope","Per-process (set in shell profile for persistence)"],
        ["Effect","Disables update checks, claude update command, background downloads"],
        ["API calls","No change — only update machinery is disabled"],
        ["Manual updates","Still possible by replacing the binary file"],
        ["Managed settings","Can be set in managed settings.json for enterprise push"],
      ]}/>
    </Section>
    <Section title="Normal Update Mechanism (without DISABLE_UPDATES)" defaultOpen>
      <CodeBlock code={`# How auto-update works:
1. On startup, Claude Code checks releases API
   GET https://releases.anthropic.com/claude-code/latest

2. If newer version available:
   - Downloads binary in background
   - Verifies SHA256
   - Swaps binary on next restart (not current process)

3. Manual update:
   claude update
   claude update --version 2.1.113  # specific version

4. Update check frequency:
   - Once per 24 hours maximum
   - Suppressed during active tasks
   - Never interrupts running session`}/>
    </Section>
    <Section title="Interaction with Managed Settings">
      <CodeBlock title="Enterprise managed settings (pushed via MDM)" code={`# /etc/claude/managed-settings.json (read-only, overrides user)
{
  "env": {
    "DISABLE_UPDATES": "1"
  },
  "allowedModels": ["claude-sonnet-4-6"],
  "maxBudgetUsd": 10.00
}

# Users cannot override managed settings:
# DISABLE_UPDATES=0 claude  # ✓ env var ignored if managed setting says 1`}/>
      <Callout type="warn">DISABLE_UPDATES prevents the <Code>claude update</Code> command from working. Ensure you have an alternative distribution pipeline before enabling in production.</Callout>
    </Section>
    <Section title="When to Use DISABLE_UPDATES">
      <Table headers={["Scenario","Use DISABLE_UPDATES?","Reason"]} rows={[
        ["Airgapped machine","Yes","No internet access for update checks"],
        ["CI/CD pipeline","Yes","Pin version for reproducibility"],
        ["Enterprise managed fleet","Yes","Control rollout via internal tooling"],
        ["Personal development machine","No","Auto-updates bring bug fixes and features"],
        ["Docker container","Yes","Image is versioned; updates happen via image rebuild"],
        ["Testing a specific version","Yes (temporarily)","Use for regression testing"],
      ]}/>
    </Section>
  </>);
}

export default function NativeBinaryDiagram() {
  const [tab, setTab] = useState("arch");
  const content = { arch:<ArchTab/>, tools:<ToolsTab/>, perf:<PerfTab/>, install:<InstallTab/>, enterprise:<EnterpriseTab/>, updates:<UpdatesTab/> };
  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:"#09090f",color:"#e0e0e0",minHeight:"100vh"}}>
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"20px 16px 0",background:"linear-gradient(180deg,rgba(249,115,22,0.03) 0%,transparent 100%)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontSize:19,fontWeight:700,color:"#fff",letterSpacing:-0.5}}>Native Binary</span>
            <span style={{fontSize:11,padding:"3px 8px",background:"rgba(249,115,22,0.12)",color:"#f97316",borderRadius:4,fontWeight:600}}>v2.1.113+ Guide</span>
          </div>
          <div style={{fontSize:11,color:"#666",marginBottom:14}}>Claude Code CLI · Self-contained binary · No Node.js required</div>
          <div style={{display:"flex",gap:2,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 11px",fontSize:11,fontFamily:"inherit",fontWeight:tab===t.id?700:400,background:tab===t.id?"rgba(255,255,255,0.06)":"transparent",color:tab===t.id?"#fff":"#777",border:"none",borderBottom:tab===t.id?"2px solid #f97316":"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",borderRadius:"6px 6px 0 0"}}>
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
