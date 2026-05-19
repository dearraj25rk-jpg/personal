import { useState, useMemo } from "react"

const C = {
  text1:"#e6e4de", text2:"#9b9895", text3:"#6a6865",
  bg1:"#272c27",   bg2:"#1e231e", bg3:"#0e100e",
  border:"rgba(255,255,255,0.14)", borderMd:"rgba(255,255,255,0.24)",
  infoBg:"rgba(88,166,255,0.18)",  infoBd:"rgba(88,166,255,0.42)",   infoT:"#58a6ff",
  okBg:  "rgba(0,212,106,0.18)",   okBd:  "rgba(0,212,106,0.48)",    okT:  "#00d46a",
  warnBg:"rgba(245,166,35,0.18)",  warnBd:"rgba(245,166,35,0.48)",   warnT:"#f5a623",
  errBg: "rgba(248,113,113,0.18)", errBd: "rgba(248,113,113,0.48)",  errT: "#f87171",
}

// ── GROUND-TRUTH MODEL DATA (May 19, 2026) ──────────────────────────────────
const MODELS = {
  // Sonnet 4.6, Opus 4.6, Opus 4.7 → 1M tokens natively (GA, no beta header, standard pricing)
  // Haiku 4.5 → 200K only (no 1M option)
  "sonnet-4-6": {
    label:"Claude Sonnet 4.6",
    short:"Sonnet 4.6",
    ctx:1000000,
    maxOut:64000,
    inPrice:3.00,
    outPrice:15.00,
    cacheWrite:3.75,
    cacheRead:0.30,
    thinking:true,
    xhigh:false,
    desc:"Best balance of speed and intelligence. 1M ctx natively at standard pricing (GA Mar 13, 2026). Default model for most Claude Code sessions.",
    bestFor:"Daily coding, most tasks",
    color:"#534AB7",
  },
  "opus-4-6": {
    label:"Claude Opus 4.6",
    short:"Opus 4.6",
    ctx:1000000,
    maxOut:128000,
    inPrice:5.00,
    outPrice:25.00,
    cacheWrite:6.25,
    cacheRead:0.50,
    thinking:true,
    xhigh:false,
    desc:"Previous flagship. 1M ctx natively (GA). Same $5/$25 pricing as Opus 4.7. Suitable for complex tasks where Opus 4.7 migration hasn't been done yet.",
    bestFor:"Complex reasoning, large codebases",
    color:"#185FA5",
  },
  "opus-4-7": {
    label:"Claude Opus 4.7",
    short:"Opus 4.7",
    ctx:1000000,
    maxOut:128000,
    inPrice:5.00,
    outPrice:25.00,
    cacheWrite:6.25,
    cacheRead:0.50,
    thinking:true,
    xhigh:true,
    desc:"Most capable GA model (Apr 16, 2026). 1M ctx natively. Step-change in agentic coding. New xhigh effort, new tokenizer (+0–35% tokens vs 4.6). API breaking changes — see migration guide.",
    bestFor:"Most complex agentic work, refactors, migrations",
    color:"#0F6E56",
  },
  "haiku-4-5": {
    label:"Claude Haiku 4.5",
    short:"Haiku 4.5",
    ctx:200000,   // ← ONLY current model with 200K — no 1M option
    maxOut:64000,
    inPrice:1.00,
    outPrice:5.00,
    cacheWrite:1.25,
    cacheRead:0.10,
    thinking:true,
    xhigh:false,
    desc:"Fastest model with near-frontier intelligence. 200K context only — no 1M option. Best for mechanical, fast, cheap tasks.",
    bestFor:"Renaming, formatting, quick lookups",
    color:"#1D9E75",
  },
}

const EFFORT_LEVELS = {
  low:   {label:"Low",   tokMult:0.2,  costMult:0.3,  thinking:false, desc:"No extended thinking. Fast, cheap. Use for mechanical tasks: renaming, formatting, adding log lines."},
  medium:{label:"Medium",tokMult:1.0,  costMult:1.0,  thinking:true,  desc:"Default since March 2026 (was high before). Adaptive thinking decides depth per turn. Can cause 'rush to completion' fabrications on complex tasks."},
  high:  {label:"High",  tokMult:2.2,  costMult:2.5,  thinking:true,  desc:"Recommended for multi-file engineering work, debugging, and architectural changes. Fixed reasoning budget per turn."},
  xhigh: {label:"xHigh", tokMult:3.5,  costMult:4.0,  thinking:true,  desc:"New in Opus 4.7 only. Between high and max. Use for the hardest reasoning tasks. Not available on Sonnet/Haiku."},
  max:   {label:"Max",   tokMult:5.0,  costMult:6.0,  thinking:true,  desc:"Maximum reasoning budget. Very expensive. Community reports 'desperate' behaviour at max — over-explaining, second-guessing, looping. Use sparingly."},
}

const SESSION_MODES = {
  normal: {label:"Normal mode",  overhead:0,    desc:"Standard coding mode. Claude reads files, runs bash, makes edits. All tool outputs accumulate in context."},
  plan:   {label:"Plan mode",    overhead:0.15, desc:"Ctrl+G to enter. Claude explores and plans without making changes. Adds ~15% overhead for the planning pass, but avoids wasted wrong-approach implementation cycles."},
  auto:   {label:"Auto mode",    overhead:-0.08,desc:"(Research preview) Classifier handles permission prompts. Safe actions run without interruption. Reduces interruption-driven context re-sends (~8% token saving). Risky actions still blocked."},
}

// Token cost reference data
const TOKEN_REFS = [
  {item:"Minimal CLAUDE.md (100 lines)",       tokens:800,   note:"Target ceiling for project root"},
  {item:"Typical CLAUDE.md (200 lines)",        tokens:1600,  note:"Aim: keep under 200 lines"},
  {item:"Bloated CLAUDE.md (500 lines)",        tokens:4000,  note:"Permanently wastes 4K tokens per turn"},
  {item:"MCP server tool schemas",              tokens:2500,  note:"Per connected server, ~26.5K for 10 servers"},
  {item:"Single MCP server",                   tokens:2650,  note:"Fixed overhead per session"},
  {item:"500-line TypeScript file",             tokens:4000,  note:"Representative file read cost"},
  {item:"1000-line TypeScript file",            tokens:8000,  note:"Large component or service"},
  {item:"Detailed Claude response",             tokens:2000,  note:"Range: 1,500–3,000 tokens"},
  {item:"CoT reasoning trace (medium effort)",  tokens:8000,  note:"Range: 2K–30K+ depending on task"},
  {item:"Compaction event (firing at 83.5%)",   tokens:150000,note:"Costs 100–200K tokens per firing"},
  {item:"Computer use system prompt overhead",  tokens:480,   note:"Adds 466–499 tokens to system prompt"},
  {item:"Tool schema (standard, pre-ToolSearch)",  tokens:2900,  note:"Per tool — loaded upfront without ToolSearch"},
  {item:"Tool schema (deferred, ToolSearch)",       tokens:80,    note:"Only name+desc loaded; full schema lazy-loaded on first use"},
  {item:"ToolSearch lazy-load savings (typical)",   tokens:22000, note:"60–80% tool schema overhead reduction in most sessions"},
]

// ── Micro-components ──────────────────────────────────────────────────────────
const InfoBox  = ({children}) => <div style={{background:C.infoBg,border:`0.5px solid ${C.infoBd}`,borderRadius:8,padding:"9px 13px",fontSize:13,color:C.infoT,margin:"10px 0",lineHeight:1.5}}>{children}</div>
const WarnBox  = ({children}) => <div style={{background:C.warnBg,border:`0.5px solid ${C.warnBd}`,borderRadius:8,padding:"9px 13px",fontSize:13,color:C.warnT,margin:"10px 0",lineHeight:1.5}}>{children}</div>
const ErrBox   = ({children}) => <div style={{background:C.errBg, border:`0.5px solid ${C.errBd}`, borderRadius:8,padding:"9px 13px",fontSize:13,color:C.errT, margin:"10px 0",lineHeight:1.5}}>{children}</div>
const OkBox    = ({children}) => <div style={{background:C.okBg,  border:`0.5px solid ${C.okBd}`,  borderRadius:8,padding:"9px 13px",fontSize:13,color:C.okT,  margin:"10px 0",lineHeight:1.5}}>{children}</div>
const Card     = ({children,border,style={}}) => <div style={{background:C.bg1,border:`0.5px solid ${border||C.border}`,borderRadius:12,padding:"13px 15px",marginBottom:8,...style}}>{children}</div>
const MC       = ({label,value,note,color}) => <div style={{background:C.bg2,borderRadius:8,padding:"11px 13px"}}><div style={{fontSize:11,color:C.text3,marginBottom:3,letterSpacing:.3,minHeight:"2.8em",lineHeight:1.4}}>{label}</div><div style={{fontSize:20,fontWeight:500,lineHeight:1.2,color:color||C.text1}}>{value}</div>{note&&<div style={{fontSize:11,color:C.text3,marginTop:2}}>{note}</div>}</div>
const SecH2    = ({children}) => <h2 style={{fontSize:19,fontWeight:500,margin:"0 0 5px",paddingBottom:10,borderBottom:`0.5px solid ${C.border}`,borderLeft:"none",paddingLeft:0,marginLeft:0,color:C.text1}}>{children}</h2>
const Sub      = ({children}) => <h3 style={{fontSize:14,fontWeight:500,margin:"18px 0 8px",color:C.text1,borderLeft:"none",paddingLeft:0,marginLeft:0}}>{children}</h3>
const Body     = ({children}) => <p style={{fontSize:13,color:C.text2,lineHeight:1.7,margin:"10px 0 14px"}}>{children}</p>
const G2       = ({children}) => <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,margin:"10px 0"}}>{children}</div>
const G3       = ({children}) => <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,margin:"10px 0"}}>{children}</div>
const G4       = ({children}) => <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,margin:"12px 0"}}>{children}</div>
const Code     = ({children}) => <code style={{background:C.bg2,padding:"1px 5px",borderRadius:4,fontSize:12,fontFamily:"monospace"}}>{children}</code>
const CodeBlock= ({children}) => <pre style={{background:"#111110",color:"#e8e6de",borderRadius:8,padding:"12px 14px",fontSize:11,lineHeight:1.7,overflowX:"auto",margin:"8px 0",fontFamily:"'JetBrains Mono','Fira Code',monospace"}}>{children}</pre>
const Quote    = ({children,cite}) => <div style={{borderLeft:`2px solid ${C.borderMd}`,padding:"7px 13px",margin:"12px 0",fontSize:13,color:C.text2,lineHeight:1.6}}>{children}{cite&&<cite style={{display:"block",fontSize:11,color:C.text3,marginTop:4,fontStyle:"normal"}}>— {cite}</cite>}</div>
const TH       = ({cols}) => <div style={{display:"flex",gap:4,fontSize:11,fontWeight:500,color:C.text3,letterSpacing:.3,padding:"5px 0",borderBottom:`0.5px solid ${C.borderMd}`}}>{cols.map((c,i)=><div key={i} style={{flex:c.flex||1,padding:"0 4px"}}>{c.label}</div>)}</div>
const TR       = ({cells,last,bg}) => <div style={{display:"flex",gap:4,fontSize:13,borderBottom:last?"none":`0.5px solid ${C.border}`,background:bg||"transparent"}}>{cells.map((cell,i)=><div key={i} style={{flex:cell.flex||1,color:cell.bold?C.text1:C.text2,fontWeight:cell.bold?500:400,padding:"6px 4px"}}>{cell.v}</div>)}</div>
const NewTag   = () => <span style={{fontSize:10,fontWeight:500,padding:"1px 5px",borderRadius:3,background:C.okBg,color:C.okT,marginLeft:5,verticalAlign:"middle",border:`0.5px solid ${C.okBd}`}}>NEW</span>
const PreviewTag=() => <span style={{fontSize:10,fontWeight:500,padding:"1px 5px",borderRadius:3,background:C.warnBg,color:C.warnT,marginLeft:5,verticalAlign:"middle",border:`0.5px solid ${C.warnBd}`}}>PREVIEW</span>

const Sel = ({value,onChange,options,style={}}) => (
  <select value={value} onChange={e=>onChange(e.target.value)} style={{fontSize:12,padding:"5px 8px",borderRadius:6,border:`0.5px solid ${C.borderMd}`,background:C.bg1,color:C.text1,fontFamily:"sans-serif",cursor:"pointer",width:"100%",...style}}>
    {options.map(([v,l])=><option key={v} value={v}>{l}</option>)}
  </select>
)
const Slider = ({label,value,min,max,step=1,unit="",onChange,color}) => (
  <div style={{display:"flex",alignItems:"center",gap:8,margin:"6px 0"}}>
    <div style={{fontSize:12,color:C.text2,minWidth:160}}>{label}</div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)} style={{flex:1,accentColor:color||C.okT}}/>
    <div style={{fontSize:12,fontWeight:500,minWidth:55,textAlign:"right"}}>{value.toLocaleString()}{unit}</div>
  </div>
)
const Toggle = ({label,checked,onChange,note}) => (
  <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"7px 0",borderBottom:`0.5px solid ${C.border}`}}>
    <div onClick={()=>onChange(!checked)} style={{width:32,height:18,borderRadius:9,background:checked?C.okT:C.border,position:"relative",cursor:"pointer",flexShrink:0,marginTop:1,transition:"background .15s"}}>
      <div style={{width:14,height:14,borderRadius:7,background:"#fff",position:"absolute",top:2,left:checked?16:2,transition:"left .15s"}}/>
    </div>
    <div><div style={{fontSize:13,color:C.text1,fontWeight:500}}>{label}</div>{note&&<div style={{fontSize:11,color:C.text3,marginTop:2,lineHeight:1.4}}>{note}</div>}</div>
  </div>
)

// ── Arrow defs ────────────────────────────────────────────────────────────────
const AD = ({id="a"}) => <defs><marker id={id} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></marker></defs>
const Th = ({x,y,color,children}) => <text x={x} y={y} textAnchor="middle" dominantBaseline="central" style={{fontSize:14,fontWeight:500,fill:color||C.text1,fontFamily:"sans-serif"}}>{children}</text>
const Ts = ({x,y,anchor="middle",color,children}) => <text x={x} y={y} textAnchor={anchor} style={{fontSize:12,fill:color||C.text2,fontFamily:"sans-serif"}}>{children}</text>
const TBar = ({segs,h=26}) => <div style={{display:"flex",height:h,borderRadius:6,overflow:"hidden",margin:"10px 0",border:`0.5px solid ${C.border}`}}>{segs.map(([w,bg,label],i)=><div key={i} style={{width:w,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:500,color:"#fff",overflow:"hidden",whiteSpace:"nowrap",padding:"0 3px",transition:"width .25s"}}>{label}</div>)}</div>
const Term = ({lines}) => <div style={{background:"#111110",color:"#e8e6de",borderRadius:12,padding:"14px 16px",fontSize:12,fontFamily:"'JetBrains Mono','Fira Code',monospace",lineHeight:1.8,margin:"10px 0",border:"0.5px solid rgba(255,255,255,0.1)"}}>{lines.map((l,i)=><div key={i} style={{color:l.c||"#e8e6de"}}>{l.t}</div>)}</div>

// ── SVG diagrams ──────────────────────────────────────────────────────────────
const SessionLoadSVG = () => (
  <svg width="100%" viewBox="0 0 680 248" style={{display:"block"}}>
    <AD id="sl"/>
    {/* Column 1 */}
    <rect x="20" y="10" width="180" height="228" rx="10" strokeWidth="0.5" fill={C.bg2} stroke={C.border}/>
    <Ts x="110" y="30" color={C.text3}>Before you type anything</Ts>
    <rect x="32" y="40" width="156" height="36" rx="6" strokeWidth="0.5" fill={C.warnBg} stroke={C.warnBd}/>
    <Th x="110" y="58" color={C.warnT}>CLAUDE.md (all levels)</Th>
    <rect x="32" y="84" width="156" height="36" rx="6" strokeWidth="0.5" fill={C.bg2} stroke={C.borderMd}/>
    <Th x="110" y="102">Auto memory + timestamps</Th>
    <rect x="32" y="128" width="156" height="36" rx="6" strokeWidth="0.5" fill={C.bg2} stroke={C.borderMd}/>
    <Th x="110" y="146">MCP tool schemas</Th>
    <rect x="32" y="172" width="156" height="36" rx="6" strokeWidth="0.5" fill={C.bg2} stroke={C.borderMd}/>
    <Th x="110" y="190">Named agent definitions</Th>
    <Ts x="110" y="222" color={C.text3}>~28K–50K tokens fixed</Ts>
    {/* Column 2 */}
    <rect x="220" y="10" width="180" height="228" rx="10" strokeWidth="0.5" fill={C.bg2} stroke={C.border}/>
    <Ts x="310" y="30" color={C.text3}>As Claude works</Ts>
    <rect x="232" y="40" width="156" height="36" rx="6" strokeWidth="0.5" fill={C.infoBg} stroke={C.infoBd}/>
    <Th x="310" y="58" color={C.infoT}>File reads (JIT)</Th>
    <rect x="232" y="84" width="156" height="36" rx="6" strokeWidth="0.5" fill={C.infoBg} stroke={C.infoBd}/>
    <Th x="310" y="102" color={C.infoT}>Bash / tool outputs</Th>
    <rect x="232" y="128" width="156" height="36" rx="6" strokeWidth="0.5" fill={C.infoBg} stroke={C.infoBd}/>
    <Th x="310" y="146" color={C.infoT}>Path-scoped rules</Th>
    <rect x="232" y="172" width="156" height="36" rx="6" strokeWidth="0.5" fill={C.infoBg} stroke={C.infoBd}/>
    <Th x="310" y="190" color={C.infoT}>Thinking tokens (output)</Th>
    <Ts x="310" y="222" color={C.text3}>grows with session</Ts>
    {/* Column 3 */}
    <rect x="420" y="10" width="240" height="228" rx="10" strokeWidth="0.5" fill={C.bg2} stroke={C.border}/>
    <Ts x="540" y="30" color={C.text3}>Subagents / named agents</Ts>
    <rect x="432" y="40" width="216" height="100" rx="8" strokeWidth="0.5" fill={C.okBg} stroke={C.okBd}/>
    <Th x="540" y="68" color={C.okT}>Isolated context window</Th>
    <Ts x="540" y="88" color={C.okT}>Own 200K window</Ts>
    <Ts x="540" y="106" color={C.okT}>Large reads stay out of yours</Ts>
    <rect x="432" y="152" width="216" height="60" rx="8" strokeWidth="0.5" fill={C.bg2} stroke={C.borderMd}/>
    <Th x="540" y="176">Returns summary only</Th>
    <Ts x="540" y="196" color={C.text2}>Isolate strategy in action</Ts>
    <Ts x="540" y="222" color={C.text3}>Named agents: defined tool set + effort</Ts>
  </svg>
)

const CLAUDEHierarchySVG = () => (
  <svg width="100%" viewBox="0 0 680 236" style={{display:"block"}}>
    <AD id="ch"/>
    <rect x="20" y="10" width="370" height="54" rx="8" strokeWidth="0.5" fill={C.bg2} stroke={C.borderMd}/>
    <Th x="205" y="30">~/.claude/CLAUDE.md</Th>
    <Ts x="205" y="50">Global · every project · personal preferences & style</Ts>
    <rect x="404" y="22" width="120" height="30" rx="6" strokeWidth="0.5" fill={C.okBg} stroke={C.okBd}/>
    <Ts x="464" y="37" color={C.okT}>Always loaded</Ts>
    <line x1="390" y1="37" x2="403" y2="37" stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#ch)"/>
    <rect x="40" y="90" width="330" height="54" rx="8" strokeWidth="0.5" fill={C.warnBg} stroke={C.warnBd}/>
    <Th x="205" y="110" color={C.warnT}>/project-root/CLAUDE.md</Th>
    <Ts x="205" y="130" color={C.warnT}>Project root · always loaded · architecture, commands, conventions</Ts>
    <rect x="404" y="102" width="120" height="30" rx="6" strokeWidth="0.5" fill={C.okBg} stroke={C.okBd}/>
    <Ts x="464" y="117" color={C.okT}>Always loaded</Ts>
    <line x1="370" y1="117" x2="403" y2="117" stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#ch)"/>
    <rect x="60" y="172" width="290" height="54" rx="8" strokeWidth="0.5" fill={C.infoBg} stroke={C.infoBd}/>
    <Th x="205" y="192" color={C.infoT}>/project/src/api/CLAUDE.md</Th>
    <Ts x="205" y="212" color={C.infoT}>Path-scoped · loaded when a file in that dir is touched</Ts>
    <rect x="404" y="182" width="170" height="30" rx="6" strokeWidth="0.5" fill={C.infoBg} stroke={C.infoBd}/>
    <Ts x="489" y="197" color={C.infoT}>On matching file read</Ts>
    <line x1="350" y1="197" x2="403" y2="197" stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#ch)"/>
    <line x1="205" y1="64" x2="205" y2="90" stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#ch)"/>
    <line x1="205" y1="144" x2="205" y2="172" stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#ch)"/>
  </svg>
)

const JITRetrievalSVG = () => (
  <svg width="100%" viewBox="0 0 680 180" style={{display:"block"}}>
    <AD id="jit"/>
    <rect x="20" y="68" width="90" height="44" rx="8" strokeWidth="0.5" fill={C.bg2} stroke={C.borderMd}/>
    <Th x="65" y="90">Task</Th>
    {[["glob",20],["grep",70],["bash",120]].map(([name,y])=>(
      <g key={name}><rect x="138" y={y} width="90" height="40" rx="6" strokeWidth="0.5" fill={C.okBg} stroke={C.okBd}/><Th x="183" y={y+20} color={C.okT}>{name}</Th></g>
    ))}
    <rect x="268" y="68" width="100" height="44" rx="8" strokeWidth="0.5" fill={C.warnBg} stroke={C.warnBd}/>
    <Th x="318" y="86" color={C.warnT}>read_file</Th>
    <Ts x="318" y="103" color={C.warnT}>targeted only</Ts>
    <rect x="400" y="35" width="140" height="110" rx="10" strokeWidth="0.5" fill={C.bg2} stroke={C.border}/>
    <Ts x="470" y="55" color={C.text3}>Context window</Ts>
    <rect x="412" y="64" width="116" height="26" rx="4" strokeWidth="0.5" fill={C.warnBg} stroke={C.warnBd}/>
    <Ts x="470" y="77" color={C.warnT}>CLAUDE.md (pre-loaded)</Ts>
    <rect x="412" y="96" width="116" height="26" rx="4" strokeWidth="0.5" fill={C.infoBg} stroke={C.infoBd}/>
    <Ts x="470" y="109" color={C.infoT}>Relevant files only</Ts>
    <rect x="412" y="128" width="116" height="12" rx="2" strokeWidth="0.5" fill={C.bg2} stroke={C.border}/>
    <Ts x="470" y="134" color={C.text3}>rest of codebase: not loaded</Ts>
    <rect x="570" y="55" width="90" height="70" rx="8" strokeWidth="0.5" fill={C.bg2} stroke={C.border}/>
    <Ts x="615" y="78" color={C.text3}>Filesystem</Ts>
    <Ts x="615" y="96" color={C.text3}>(all files)</Ts>
    <Ts x="615" y="114" color={C.text3}>unchanged</Ts>
    <line x1="110" y1="90" x2="138" y2="40"  stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#jit)"/>
    <line x1="110" y1="90" x2="138" y2="90"  stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#jit)"/>
    <line x1="110" y1="90" x2="138" y2="140" stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#jit)"/>
    <line x1="228" y1="40"  x2="268" y2="80"  stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#jit)"/>
    <line x1="228" y1="90"  x2="268" y2="90"  stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#jit)"/>
    <line x1="228" y1="140" x2="268" y2="100" stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#jit)"/>
    <line x1="368" y1="90" x2="400" y2="109" stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#jit)"/>
    <line x1="540" y1="90" x2="570" y2="90"  stroke={C.borderMd} strokeWidth="0.5" markerEnd="url(#jit)"/>
    <Ts x="340" y="172" color={C.text3}>Only files Claude explicitly reads land in context — everything else stays on disk</Ts>
  </svg>
)

const CompactionSVG = () => (
  <svg width="100%" viewBox="0 0 680 200" style={{display:"block"}}>
    <AD id="cp"/>
    <rect x="20" y="20" width="240" height="160" rx="10" strokeWidth="0.5" fill={C.bg2} stroke={C.border}/>
    <Ts x="140" y="38" color={C.text3}>Before (~83.5% = ~167K tokens)</Ts>
    <rect x="32" y="46" width="216" height="22" rx="4" strokeWidth="0.5" fill={C.warnBg} stroke={C.warnBd}/>
    <Ts x="140" y="57" color={C.warnT}>CLAUDE.md</Ts>
    <rect x="32" y="72" width="216" height="15" rx="3" strokeWidth="0.5" fill={C.infoBg} stroke={C.infoBd}/>
    <Ts x="140" y="79" color={C.infoT}>file reads × 20</Ts>
    <rect x="32" y="91" width="216" height="15" rx="3" strokeWidth="0.5" fill={C.bg2} stroke={C.border}/>
    <Ts x="140" y="98">assistant turns × 40</Ts>
    <rect x="32" y="110" width="216" height="15" rx="3" strokeWidth="0.5" fill={C.bg2} stroke={C.border}/>
    <Ts x="140" y="117">bash + thinking tokens</Ts>
    <rect x="32" y="129" width="216" height="15" rx="3" strokeWidth="0.5" fill={C.errBg} stroke={C.errBd}/>
    <Ts x="140" y="136" color={C.errT}>redundant tool results × many</Ts>
    <rect x="32" y="148" width="216" height="22" rx="4" strokeWidth="0.5" fill={C.bg2} stroke={C.borderMd}/>
    <Ts x="140" y="159">path-scoped CLAUDE.md</Ts>
    <line x1="260" y1="100" x2="300" y2="100" stroke={C.text1} strokeWidth="1.5" markerEnd="url(#cp)"/>
    <Ts x="280" y="93">compaction</Ts>
    <Ts x="280" y="107" color={C.errT}>costs 100–200K</Ts>
    <rect x="300" y="20" width="360" height="160" rx="10" strokeWidth="0.5" fill={C.bg2} stroke={C.border}/>
    <Ts x="480" y="38" color={C.text3}>After (~30% full, fresh 70% available)</Ts>
    <rect x="312" y="46" width="336" height="22" rx="4" strokeWidth="0.5" fill={C.warnBg} stroke={C.warnBd}/>
    <Ts x="480" y="57" color={C.warnT}>CLAUDE.md (root — reloaded from disk)</Ts>
    <rect x="312" y="72" width="336" height="28" rx="4" strokeWidth="0.5" fill={C.okBg} stroke={C.okBd}/>
    <Ts x="480" y="80" color={C.okT}>Compressed summary (decisions, bugs,</Ts>
    <Ts x="480" y="93" color={C.okT}>implementation details preserved)</Ts>
    <rect x="312" y="104" width="336" height="22" rx="4" strokeWidth="0.5" fill={C.infoBg} stroke={C.infoBd}/>
    <Ts x="480" y="115" color={C.infoT}>5 most recently accessed files</Ts>
    <rect x="312" y="130" width="336" height="22" rx="4" strokeWidth="0.5" fill={C.bg2} stroke={C.borderMd}/>
    <Ts x="480" y="141">Skills re-injected (up to cap, oldest dropped)</Ts>
    <Ts x="480" y="168" color={C.text3}>Redundant tool results, old turns, path-scoped rules: discarded</Ts>
  </svg>
)

// ── CONTEXT SIMULATOR (Section 8) ─────────────────────────────────────────────
const S_SIMULATOR = () => {
  const [modelKey,    setModelKey]    = useState("sonnet-4-6")
  const [effortKey,   setEffortKey]   = useState("medium")
  const [sessionMode, setSessionMode] = useState("normal")
  const [mcpServers,  setMcpServers]  = useState(2)
  const [claudeMdTok, setClaudeMdTok] = useState(1600)
  const [fileReads,   setFileReads]   = useState(8)
  const [bashOutputs, setBashOutputs] = useState(5)
  const [turns,       setTurns]       = useState(15)
  const [cacheHit,    setCacheHit]    = useState(75)
  const [compactions, setCompactions] = useState(0)

  const model  = MODELS[modelKey]
  const effort = EFFORT_LEVELS[effortKey]
  const mode   = SESSION_MODES[sessionMode]
  // ctx is now the real native window — 1M for Sonnet 4.6/Opus 4.6/Opus 4.7, 200K for Haiku 4.5
  const ctxWindow = model.ctx

  // Token breakdown (Sonnet 4.6 baseline = 200K window)
  const tSystemBuiltin = 22900   // built-in tool schemas
  const tMCP           = mcpServers * 2650
  const tClaudeMd      = claudeMdTok
  const tAgentDefs     = 2800
  const tFileReads     = fileReads * 4000
  const tBashOutputs   = bashOutputs * 3000
  const tTurns         = turns * 2000
  const tThinking      = effort.thinking ? turns * (effortKey==="low"?0:effortKey==="medium"?8000:effortKey==="high"?18000:effortKey==="xhigh"?30000:45000) : 0
  const tCompaction    = compactions * 150000
  const tModeOverhead  = Math.round(tTurns * mode.overhead)
  const compactionReserve = Math.round(ctxWindow * 0.165) // 16.5% reserve = compaction fires at 83.5%

  const tTotal = tSystemBuiltin + tMCP + tClaudeMd + tAgentDefs + tFileReads + tBashOutputs + tTurns + tThinking + tCompaction + tModeOverhead
  const tPct   = Math.round(tTotal / ctxWindow * 100)
  const tAvail = Math.max(0, ctxWindow - tTotal)

  // Cost calculation
  const cacheHitPct = cacheHit / 100
  const inputNonCached = tTotal * (1 - cacheHitPct)
  const inputCached    = tTotal * cacheHitPct
  const outputToks     = turns * 2000 + tThinking
  const costInput      = (inputNonCached / 1e6) * model.inPrice
  const costCacheRead  = (inputCached / 1e6) * model.cacheRead
  const costOutput     = (outputToks / 1e6) * model.outPrice
  const costCompact    = compactions > 0 ? (compactions * 150000 / 1e6) * (model.inPrice + model.outPrice * 0.3) : 0
  const totalCost      = costInput + costCacheRead + costOutput + costCompact

  const fmtTok = n => n >= 1000 ? (n/1000).toFixed(1)+"K" : n.toString()
  const fmtPct = n => n + "%"
  const fmtCost = n => "$" + n.toFixed(4)

  const statusColor = tPct >= 100 ? C.errT : tPct >= 83.5 ? "#c04828" : tPct >= 70 ? C.warnT : C.okT
  const statusLabel = tPct >= 100 ? "OVERFLOW — redesign required" : tPct >= 83.5 ? "CRITICAL — auto-compaction will fire" : tPct >= 70 ? "TIGHT — compact proactively" : tPct >= 50 ? "MODERATE — monitor growth" : "HEALTHY — good working room"

  const effortOpts = Object.entries(EFFORT_LEVELS)
    .filter(([k]) => k !== "xhigh" || model.xhigh)
    .map(([k,v]) => [k, v.label])

  const breakdownRows = [
    {label:"Built-in tool schemas",  toks:tSystemBuiltin, color:"#534AB7", fixed:true},
    {label:`MCP servers (${mcpServers}×)`,toks:tMCP,       color:"#993C1D", fixed:false},
    {label:"CLAUDE.md",              toks:tClaudeMd,      color:"#BA7517", fixed:false},
    {label:"Named agent defs",       toks:tAgentDefs,     color:"#686660", fixed:true},
    {label:`File reads (${fileReads} files)`,    toks:tFileReads,  color:"#185FA5", fixed:false},
    {label:`Bash outputs (${bashOutputs} cmds)`, toks:tBashOutputs,color:"#0F6E56", fixed:false},
    {label:`Conversation (${turns} turns)`,      toks:tTurns,      color:"#1D9E75", fixed:false},
    {label:"Thinking tokens",        toks:tThinking,      color:"#EF9F27", fixed:false},
    {label:"Mode overhead",          toks:Math.abs(tModeOverhead), color:"#888780", fixed:false, sign: mode.overhead < 0 ? "-" : "+"},
    {label:`Compaction events (${compactions}×)`,toks:tCompaction, color:"#E24B4A", fixed:false},
  ].filter(r => r.toks > 0)

  return (
    <div>
      <SecH2>
        Context window simulator — by model, mode & effort
      </SecH2>
      <Body>A precise, model-aware simulator that accounts for extended thinking costs, MCP overhead, session mode, effort level, and prompt caching. Every value is calibrated to real-world Claude Code data. Adjust the controls — the token breakdown and cost estimate update live.</Body>

      {/* ── TOP CONTROLS ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,margin:"14px 0 8px",alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column"}}>
          <div style={{fontSize:11,color:C.text3,marginBottom:5,fontWeight:500,letterSpacing:.3}}>MODEL</div>
          <Sel value={modelKey} onChange={v=>{setModelKey(v);if(EFFORT_LEVELS["xhigh"]&&v!=="opus-4-7"&&effortKey==="xhigh")setEffortKey("high")}} options={Object.entries(MODELS).map(([k,v])=>[k,v.short])}/>
        </div>
        <div style={{display:"flex",flexDirection:"column"}}>
          <div style={{fontSize:11,color:C.text3,marginBottom:5,fontWeight:500,letterSpacing:.3}}>EFFORT LEVEL</div>
          <Sel value={effortKey} onChange={setEffortKey} options={effortOpts}/>
        </div>
        <div style={{display:"flex",flexDirection:"column"}}>
          <div style={{fontSize:11,color:C.text3,marginBottom:5,fontWeight:500,letterSpacing:.3}}>SESSION MODE</div>
          <Sel value={sessionMode} onChange={setSessionMode} options={Object.entries(SESSION_MODES).map(([k,v])=>[k,v.label])}/>
        </div>
      </div>

      {/* Model info card */}
      <Card style={{marginBottom:8,borderColor:model.color+"66"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontSize:13,fontWeight:500,color:model.color}}>{model.label}</div>
            <div style={{fontSize:12,color:C.text2,marginTop:3,lineHeight:1.5}}>{model.desc}</div>
          </div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",flexShrink:0}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,color:C.text3}}>Context</div><div style={{fontSize:13,fontWeight:500,color:model.ctx===1000000?C.okT:C.text1}}>{model.ctx===1000000?"1M":"200K"}</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,color:C.text3}}>Max out</div><div style={{fontSize:13,fontWeight:500}}>{(model.maxOut/1000).toFixed(0)}K</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:11,color:C.text3}}>In/Out $/MTok</div><div style={{fontSize:13,fontWeight:500}}>${model.inPrice}/${model.outPrice}</div></div>
          </div>
        </div>
        {model.ctx===200000 && (
          <div style={{fontSize:12,color:C.warnT,marginTop:6,borderTop:`0.5px solid ${C.border}`,paddingTop:6}}>
            Haiku 4.5 is the only current model with a 200K context window. There is no 1M option for Haiku 4.5.
          </div>
        )}
        <div style={{fontSize:12,color:C.text3,marginTop:6,borderTop:`0.5px solid ${C.border}`,paddingTop:6}}>
          <strong>Effort: </strong>{effort.label} — {effort.desc}
        </div>
        <div style={{fontSize:12,color:C.text3,marginTop:4}}>
          <strong>Mode: </strong>{mode.label} — {mode.desc}
        </div>
      </Card>

      {/* ── CONTEXT SLIDERS ── */}
      <Sub>Session configuration</Sub>
      <Slider label="MCP servers connected" value={mcpServers} min={0} max={15} onChange={setMcpServers} color="#993C1D"/>
      <Slider label="CLAUDE.md tokens" value={claudeMdTok} min={200} max={8000} step={100} onChange={setClaudeMdTok} color="#BA7517"/>
      <Slider label="File reads (files)" value={fileReads} min={0} max={60} onChange={setFileReads} color="#185FA5"/>
      <Slider label="Bash outputs (cmds)" value={bashOutputs} min={0} max={40} onChange={setBashOutputs} color="#0F6E56"/>
      <Slider label="Conversation turns" value={turns} min={1} max={80} onChange={setTurns} color="#1D9E75"/>
      <Slider label="Cache hit rate" value={cacheHit} min={0} max={95} unit="%" onChange={setCacheHit} color="#534AB7"/>
      <Slider label="Manual /compact events" value={compactions} min={0} max={5} onChange={setCompactions} color="#E24B4A"/>

      {/* ── VISUAL BAR ── */}
      <Sub>Context usage — {ctxWindow.toLocaleString()} token window</Sub>
      <div style={{display:"flex",height:32,borderRadius:6,overflow:"hidden",margin:"10px 0",border:`0.5px solid ${C.border}`}}>
        {breakdownRows.map((r,i)=>{
          const w = Math.max(0,r.toks/ctxWindow*100).toFixed(1)
          return <div key={i} style={{width:`${w}%`,background:r.color,flexShrink:0,transition:"width .3s"}}/>
        })}
        {tAvail > 0 && <div style={{flex:1,background:"#e8e6de",opacity:0.2}}/>}
      </div>
      {/* Legend */}
      <div style={{display:"flex",flexWrap:"wrap",gap:8,fontSize:11,color:C.text2,margin:"4px 0 10px"}}>
        {breakdownRows.map((r,i)=>(
          <span key={i} style={{display:"flex",alignItems:"center",gap:3}}>
            <span style={{width:8,height:8,borderRadius:2,background:r.color,flexShrink:0}}/>
            {r.label}: {fmtTok(r.toks)}
          </span>
        ))}
      </div>

      {/* ── STATUS BADGE ── */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:8,border:`1.5px solid ${statusColor}33`,background:statusColor+"11",margin:"8px 0"}}>
        <div style={{fontSize:22,fontWeight:500,color:statusColor,lineHeight:1}}>{tPct}%</div>
        <div>
          <div style={{fontSize:13,fontWeight:500,color:statusColor}}>{statusLabel}</div>
          <div style={{fontSize:12,color:C.text2,marginTop:2}}>{fmtTok(tTotal)} / {fmtTok(ctxWindow)} tokens used · {fmtTok(tAvail)} available · Compaction fires at {fmtTok(Math.round(ctxWindow*0.835))}</div>
        </div>
      </div>

      {tPct >= 83.5 && !compactions && (
        <ErrBox>At this usage level, auto-compaction will fire — costing an additional 100–200K tokens per event. Add a manual /compact event above to model the effect, or reduce session size.</ErrBox>
      )}
      {compactions > 0 && (
        <WarnBox>Each compaction event costs ~150K tokens to summarise context. At {compactions} event{compactions>1?"s":""}, that's ~{fmtTok(tCompaction)} tokens ({fmtCost(costCompact)}) in compaction overhead alone. Compact earlier and more proactively to keep per-compaction cost lower.</WarnBox>
      )}

      {/* ── TOKEN BREAKDOWN TABLE ── */}
      <Sub>Token breakdown by source</Sub>
      <Card>
        <TH cols={[{label:"Source",flex:2},{label:"Tokens",flex:1},{label:"% of window",flex:1},{label:"Fixed / var",flex:1}]}/>
        {breakdownRows.map((r,i)=>(
          <TR key={i} cells={[
            {v:<span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:8,height:8,borderRadius:2,background:r.color,flexShrink:0}}/>{r.sign&&<span style={{fontSize:10,color:r.sign==="-"?C.okT:C.errT}}>{r.sign}</span>}{r.label}</span>,flex:2},
            {v:fmtTok(r.toks),bold:true,flex:1},
            {v:fmtPct(Math.round(r.toks/ctxWindow*100)),flex:1},
            {v:r.fixed?"Fixed":"Variable",flex:1},
          ]}/>
        ))}
        <div style={{display:"flex",justifyContent:"space-between",padding:"8px 4px 0",fontWeight:500,fontSize:13,borderTop:`0.5px solid ${C.borderMd}`,marginTop:4}}>
          <span>Total</span>
          <span style={{color:statusColor}}>{fmtTok(tTotal)} ({tPct}%)</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"2px 4px 0",fontSize:13}}>
          <span style={{color:C.text2}}>Available</span>
          <span style={{fontWeight:500,color:C.okT}}>{fmtTok(tAvail)} ({Math.max(0,100-tPct)}%)</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",padding:"2px 4px 0",fontSize:13}}>
          <span style={{color:C.text2}}>Compaction reserve (16.5%)</span>
          <span style={{fontWeight:500,color:C.text3}}>{fmtTok(compactionReserve)}</span>
        </div>
      </Card>

      {/* ── COST BREAKDOWN ── */}
      <Sub>Estimated session cost ({model.short} · {effort.label} effort · {cacheHit}% cache hit)</Sub>
      <Card>
        <TH cols={[{label:"Cost component",flex:2},{label:"Tokens",flex:1},{label:"Rate $/MTok",flex:1},{label:"Cost",flex:1}]}/>
        <TR cells={[{v:"Non-cached input",flex:2},{v:fmtTok(Math.round(inputNonCached)),flex:1},{v:`$${model.inPrice}`,flex:1},{v:fmtCost(costInput),bold:true,flex:1}]}/>
        <TR cells={[{v:`Cached input (${cacheHit}% hit rate)`,flex:2},{v:fmtTok(Math.round(inputCached)),flex:1},{v:`$${model.cacheRead}`,flex:1},{v:fmtCost(costCacheRead),bold:true,flex:1}]}/>
        <TR cells={[{v:"Output + thinking tokens",flex:2},{v:fmtTok(outputToks),flex:1},{v:`$${model.outPrice}`,flex:1},{v:fmtCost(costOutput),bold:true,flex:1}]}/>
        {compactions > 0 && (
          <TR cells={[{v:"Compaction events",flex:2},{v:fmtTok(tCompaction),flex:1},{v:"mixed",flex:1},{v:fmtCost(costCompact),bold:true,flex:1}]}/>
        )}
        <div style={{display:"flex",justifyContent:"space-between",padding:"8px 4px 0",fontWeight:500,fontSize:14,borderTop:`0.5px solid ${C.borderMd}`,marginTop:4}}>
          <span>Total session cost</span>
          <span style={{color:totalCost>1?C.errT:totalCost>0.1?C.warnT:C.okT}}>{fmtCost(totalCost)}</span>
        </div>
        {cacheHit > 60 && (
          <div style={{fontSize:11,color:C.text3,marginTop:4}}>Cache savings vs no-cache: {fmtCost((inputCached/1e6)*(model.inPrice-model.cacheRead))} saved this session</div>
        )}
      </Card>
      <InfoBox>90%+ of tokens in heavy Claude Code sessions are cache reads. On subscription plans (Pro/Max), cache reads are included in the flat rate. On API pay-as-you-go, cache reads cost $0.30/MTok (Sonnet 4.6) or $0.50/MTok (Opus) — roughly 10% of standard input pricing. Maximise cache hit rate by keeping your system prompt and CLAUDE.md stable across turns.</InfoBox>

      {/* ── COST TRAPS ── */}
      <Sub>Cost trap reference — real-world incident patterns</Sub>
      <Card>
        <TH cols={[{label:"Trap",flex:2},{label:"Token impact",flex:1},{label:"Prevention",flex:2}]}/>
        {[
          ["Session idle >1 hour","Full context resent as cache_creation — billed at standard input rates, not cached rates","Checkpoint to NOTES.md, /clear, restart with compressed context"],
          ["Auto-compaction fires unexpectedly","100–200K tokens per event; can fire 3× per turn on large sessions","Run /compact proactively at 70%. Compaction at 83.5% costs more."],
          ["Retry loop in long session","Full context resent on each retry: 50K–300K tokens per prompt","Keep sessions lean; use /compact between major task blocks"],
          ["Default thinking budget uncapped","Tens of thousands of tokens per request at $25/MTok output","Set MAX_THINKING_TOKENS=8000 for routine tasks; use /effort low"],
          ["Subagent chain without cap","49 subagents reported at $8K–$15K; 23 agents at $47K over 3 days","Cap parallelism in CLAUDE.md; never leave subagent chains unattended"],
          ["Bloated CLAUDE.md","5,000 token CLAUDE.md = 5,000 tokens deducted before every turn, every session","Keep under 200 lines; move specialised instructions to Skills"],
          ["March 2026 caching bug (v2.1.89)","10–20× token inflation with no warning","Pin to stable channel; check /cost for anomalous output spend"],
        ].map((r,i,arr)=>(
          <TR key={i} last={i===arr.length-1} cells={[{v:r[0],flex:2},{v:r[1],flex:1},{v:r[2],flex:2,bold:true}]}/>
        ))}
      </Card>

      {/* ── TOKEN REFERENCE TABLE ── */}
      <Sub>Token cost reference — per operation</Sub>
      <Card>
        <TH cols={[{label:"Operation / object",flex:2},{label:"Tokens",flex:1},{label:"Note",flex:2}]}/>
        {TOKEN_REFS.map((r,i)=>(
          <TR key={i} last={i===TOKEN_REFS.length-1} cells={[{v:r.item,flex:2},{v:fmtTok(r.tokens),bold:true,flex:1},{v:r.note,flex:2}]}/>
        ))}
      </Card>

      {/* ── EFFORT DEEP DIVE ── */}
      <Sub>Effort level deep dive</Sub>
      <Card>
        <TH cols={[{label:"Level"},{label:"Thinking",flex:1},{label:"Cost multiplier"},{label:"Best for",flex:2},{label:"Available on",flex:1.5}]}/>
        {Object.entries(EFFORT_LEVELS).map(([k,v],i,arr)=>(
          <TR key={k} last={i===arr.length-1} cells={[
            {v:<span style={{fontWeight:k===effortKey?500:400,color:k===effortKey?C.text1:C.text2}}>{v.label}{k===effortKey?" ✓":""}</span>},
            {v:v.thinking?"On":"Off",flex:1},
            {v:`~${v.costMult}×`,bold:true},
            {v:v.desc,flex:2},
            {v:k==="xhigh"?"Opus 4.7 only":"All models",flex:1.5},
          ]}/>
        ))}
      </Card>
      <WarnBox><strong>Default effort changed March 2026:</strong> The default dropped from <strong>high</strong> to <strong>medium</strong>. Medium effort uses adaptive thinking, which decides reasoning depth per turn. On complex multi-file tasks, this causes 'rush to completion' behaviour — fabricating API versions instead of checking docs. Always explicitly set <Code>/effort high</Code> before starting complex engineering sessions. Set <Code>MAX_THINKING_TOKENS=8000</Code> in your environment for a cost ceiling.</WarnBox>
    </div>
  )
}

// ── Section 0: CC as CE system ────────────────────────────────────────────────
const S0 = () => (
  <div>
    <SecH2>Claude Code is a CE system — not just a coding tool</SecH2>
    <Body>Claude Code is one of the most sophisticated context engineering implementations publicly available. It uses a deliberate hybrid approach: <strong>CLAUDE.md files are pre-loaded upfront</strong> (always-available background context), while <strong>file contents are retrieved just-in-time</strong> via glob, grep, and bash as the task demands. Every design decision — from path-scoped rules to auto-compaction to effort levels — is a live implementation of the four core CE strategies.</Body>
    <G4>
      <MC label="Sonnet/Opus 4.x" value="1M ctx" note="Native GA — no beta header"/>
      <MC label="Haiku 4.5 ctx" value="200K" note="Only model without 1M"/>
      <MC label="MCP / server" value="2,650" note="Tokens — fixed per session"/>
      <MC label="Compaction at" value="83.5%" note="835K of 1M window"/>
    </G4>
    <Quote cite="Anthropic engineering blog, 'Effective Context Engineering for AI Agents' (Sep 2025)">"Claude Code loads CLAUDE.md files naively upfront, while primitives like glob and grep allow it to navigate its environment just-in-time. This self-managed context window keeps the agent focused on relevant subsets rather than drowning in exhaustive but potentially irrelevant information."</Quote>
    <Sub>What loads in every Claude Code session</Sub>
    <SessionLoadSVG/>
    <Sub>Four ground-truth facts</Sub>
    <G4>
      {[
        {title:"Current models — context",body:"Opus 4.7 — 1M natively (Apr 16, 2026). Opus 4.6 — 1M natively (GA Mar 13, 2026). Sonnet 4.6 — 1M natively (GA Mar 13, 2026). Haiku 4.5 — 200K only (no 1M option). Sonnet 4/4.5 1M beta retires Apr 30 → migrate now."},
        {title:"Real cost benchmarks",body:"Average: ~$13/developer/active day, $150–250/month enterprise. A 500-line TS file ≈ 4,000 tokens. Detailed response ≈ 1,500–3,000 tokens. Single prompt in a long session can consume 50K–300K tokens due to full context being resent on retry."},
        {title:"Effort system change",body:"Default effort dropped from high → medium in March 2026. Medium uses adaptive thinking — decides reasoning depth per turn. Can cause 'rush to completion' fabrications. Always set /effort high explicitly for complex multi-file work. New xhigh level in Opus 4.7 only."},
        {title:"ToolSearch lazy loading (v2.1.7+)",body:"Deferred tools only load their full schema when first used. Result: 60–80% reduction in tool schema overhead for most sessions. Built-in tools stay eager (always loaded). MCP tools, WebSearch, and ToolSearch itself are deferred. Check with /context — 'deferred tools' line shows how many are loaded vs waiting."},
      ].map((c,i)=>(
        <Card key={i}><div style={{fontSize:13,fontWeight:500,marginBottom:5}}>{c.title}</div><div style={{fontSize:12,color:C.text2,lineHeight:1.5}}>{c.body}</div></Card>
      ))}
    </G4>
  </div>
)

// ── Section 1: Context anatomy ────────────────────────────────────────────────
const S1 = () => (
  <div>
    <SecH2>Context window anatomy — real numbers</SecH2>
    <Body>Run <Code>/context</Code> in any Claude Code session to see your live breakdown. The output below is a representative real-world example from a session with <strong>Claude Sonnet 4.6</strong> (1M token window). Notice how the percentages differ sharply from the older 200K examples you may have seen — with 1M tokens the same absolute overhead becomes a much smaller fraction of the available budget.</Body>
    <Sub>Live /context output — representative Sonnet 4.6 session (1M window)</Sub>
    <Term lines={[
      {t:"$ /context",c:"#686660"},{t:""},
      {t:"185k/1,000k tokens used (18.5%)",c:"#5dcaa5"},
      {t:"████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",c:"#5dcaa5"},{t:""},
      {t:"System prompt:    3,100 tokens ( 0.3%)  ░",c:"#fac775"},
      {t:"Built-in tools:  19,800 tokens ( 2.0%)  ██░",c:"#fac775"},
      {t:"MCP tools:       13,250 tokens ( 1.3%)  █░   (5 servers × 2,650)",c:"#f09595"},
      {t:"Custom agents:    2,800 tokens ( 0.3%)  ░",c:"#686660"},
      {t:"CLAUDE.md:        1,600 tokens ( 0.2%)  ░",c:"#85b7eb"},
      {t:"Thinking tokens: 40,000 tokens ( 4.0%)  ████░  (medium effort, 15 turns)",c:"#fac775"},
      {t:"File reads:      48,000 tokens ( 4.8%)  █████░  (12 files × ~4K)",c:"#85b7eb"},
      {t:"Conversation:    56,450 tokens ( 5.6%)  ██████░",c:"#5dcaa5"},
      {t:"Compaction res: 165,000 tokens (16.5%)  ████████████████░  (fires at 835K)",c:"#686660"},
      {t:"Available:     ~815,000 tokens (81.5%)  remaining",c:"#5dcaa5"},
    ]}/>
    <TBar segs={[["0.3%","#BA7517",""],["2%","#534AB7","Built-in 2%"],["1.3%","#993C1D","MCP 1.3%"],["0.3%","#686660",""],["0.2%","#185FA5",""],["4%","#EF9F27","Thinking 4%"],["4.8%","#85b7eb","Files 4.8%"],["5.6%","#1D9E75","Conv 5.6%"],["16.5%","#3B3B38","Reserve 16.5%"],["65.0%","#2a3a2a","available 81.5%"]]}/>
    <div style={{fontSize:12,color:C.text2,margin:"6px 0 10px",lineHeight:1.6}}>
      With a 1M token window, the same MCP overhead that consumed <strong>13.3%</strong> of a 200K session now consumes just <strong>1.3%</strong>. The compaction reserve drops from 22% to 16.5% in absolute terms. The practical effect: a well-configured Sonnet 4.6 session starts at under 10% usage and only fills meaningfully through actual work — file reads and thinking tokens. This is why migrating from Sonnet 4.5 to Sonnet 4.6 often feels dramatically less constrained, even though the per-turn costs are identical.
    </div>
    <ErrBox><strong>Old 200K behaviour for reference:</strong> On Sonnet 4.5 (200K), the same session overhead (3.1K system + 19.8K built-in + 26.5K MCP + 4K CLAUDE.md + 44K reserve) consumed <strong>51% of the window before any work began</strong>. On Sonnet 4.6 (1M), that same overhead is only <strong>9.8%</strong>. This is the single most impactful reason to migrate to current models.</ErrBox>
    <Sub>What consumes tokens as your session grows — with real costs</Sub>
    <Card>
      <TH cols={[{label:"Source"},{label:"Tokens",flex:1},{label:"$/turn @ Sonnet 4.6",flex:1.2},{label:"Management strategy",flex:2}]}/>
      {[
        ["Each file read (500 lines)","~4,000","$0.000012/turn","Stays in context until /clear or compaction"],
        ["ToolSearch lazy loading (active)","saves ~22K","saves ~$0.066/session","Deferred tools load only when needed — automatic, no config required (v2.1.7+)"],
        ["Bash command output","Varies (can be huge)","$0.000+","Ask for compressed summaries, not raw output"],
        ["Each assistant response","1,500–3,000","$0.030–0.045","Accumulates — compaction eventually summarises"],
        ["CoT thinking (medium)","~8,000/turn","$0.120/turn","Set /effort low for mechanical tasks; cap with MAX_THINKING_TOKENS"],
        ["CoT thinking (high)","~18,000/turn","$0.270/turn","Use for complex tasks only; cost adds up fast"],
        ["Path-scoped CLAUDE.md","500–2,000","fixed per dir","Loaded on file touch; reloads after compaction"],
        ["Compaction event","100–200K","$0.45–0.90","Compact proactively at 70% — later compaction costs more tokens"],
      ].map((r,i,arr)=>(
        <TR key={i} last={i===arr.length-1} cells={[{v:r[0]},{v:r[1],flex:1,bold:true},{v:r[2],flex:1.2,bold:true},{v:r[3],flex:2}]}/>
      ))}
    </Card>
    <WarnBox><strong>Adaptive thinking (Feb 2026):</strong> The model now decides how long to think per turn instead of using a fixed reasoning budget. Default effort dropped from high to medium in March 2026. This causes 'rush to completion' behaviour on complex tasks — fabricating API versions, skipping verification steps. Always explicitly set <Code>/effort high</Code> for serious multi-file engineering. Set <Code>MAX_THINKING_TOKENS=8000</Code> in your environment as a cost ceiling.</WarnBox>
  </div>
)

// ── Section 2: CLAUDE.md ──────────────────────────────────────────────────────
const S2 = () => (
  <div>
    <SecH2>CLAUDE.md — your context engineering control panel</SecH2>
    <Body>CLAUDE.md is injected into the system prompt and is the only context that persists across session restarts and survives compaction at the project root level. It is the system prompt you write for your own codebase. CLAUDE.md loads before Claude reads your code, before it reads your task, before anything — every token in it is a constant baseline cost you carry on every turn, every session.</Body>
    <Sub>The three-level hierarchy</Sub>
    <CLAUDEHierarchySVG/>
    <InfoBox>Path-scoped CLAUDE.md files are summarised away during compaction (they live in message history), but reload automatically the next time Claude reads a file in that directory. If a rule must persist through compaction, put it in the project-root CLAUDE.md, not a subdirectory file.</InfoBox>
    <Sub>What to put in each level — and what to avoid</Sub>
    <Card>
      <TH cols={[{label:"Level"},{label:"Best contents",flex:2},{label:"Avoid — wastes tokens",flex:1.5}]}/>
      {[
        ["~/.claude (global)","Output style, response language, personal preferences, tool usage defaults","Project-specific anything"],
        ["Project root","Stack, key commands (exactly as typed), architecture decisions, coding conventions, current sprint","File contents, lengthy docs, historical context, step-by-step workflows (→ use Skills)"],
        ["Path-scoped","Directory-specific: API auth patterns, DB query conventions, component structures","Rules that must survive compaction — those belong in project root"],
      ].map((r,i,arr)=>(
        <TR key={i} last={i===arr.length-1} cells={[{v:r[0]},{v:r[1],flex:2},{v:r[2],flex:1.5}]}/>
      ))}
    </Card>
    <Body>Skills (on-demand loaded files) are the right home for specialised instructions. If your CLAUDE.md contains detailed instructions for PR reviews or database migrations, those tokens are present even when you're doing unrelated work. Move them to Skills — they load only when invoked. Aim to keep CLAUDE.md under 200 lines.</Body>
    <Sub>A production-quality CLAUDE.md template</Sub>
    <CodeBlock>{`# CLAUDE.md — [Project Name]
# Keep under 200 lines / ~1,600 tokens. Details → Skills.

## Tech stack
- Frontend: Next.js 15, App Router, TypeScript strict
- Backend:  Node.js 20, Express, Prisma ORM
- Database: PostgreSQL 15
- Auth:     NextAuth v5, Google provider
- Testing:  Vitest (unit), Playwright (e2e)

## Critical commands (copy-pasteable)
\`\`\`bash
npm run dev          # dev server → http://localhost:3000
npm run test         # unit tests (Vitest)
npm run test:e2e     # e2e tests (Playwright)
npm run build        # production build
npm run lint         # ESLint + Prettier
npx prisma migrate dev  # run pending migrations
npx prisma studio    # open DB GUI on port 5555
\`\`\`

## Architecture — read before touching any file
- All API routes use tRPC v11. Never create REST endpoints.
- Compound component pattern: ParentComponent + ChildComponent,
  exported together from /components/<name>/index.ts
- Shared state: Zustand stores in /stores. Never useState across trees.
- DB access: /lib/db (Prisma client singleton). Never raw SQL.
- Error handling: throw AppError from /lib/errors. Always typed.

## Conventions
- File names: kebab-case. Component names: PascalCase.
- No \`any\` types — strict mode, always.
- React Query for all async state. No useEffect for data fetching.
- CSS: Tailwind utility classes only. No inline styles.

## Current sprint focus
[Update this line when switching features — e.g. "User dashboard. Payment next."]

## Established patterns (add here when new ones are agreed)
[Example: "All API routes validate request body with Zod before handler"]

## Hard rules — never do these
- No direct DOM manipulation (use refs)
- No client-side secrets (use server actions or API routes)
- No raw fetch() to our API from client (use tRPC hooks)`}</CodeBlock>
    <Sub>Token budget guidance</Sub>
    <TBar segs={[["2%","#185FA5","CLAUDE.md ~2%"],["10%","#534AB7","Built-in 9.9%"],["14%","#993C1D","MCP 13.3%"],["74%","#2a2a28","rest of window"]]}/>
    <Body>Target: keep project-root CLAUDE.md under 200 lines (~1,600 tokens). A 5,000-token CLAUDE.md costs 5,000 tokens before you've typed a word — on every turn, every session. That's a permanent tax you can't avoid without rewriting the file.</Body>
  </div>
)

// ── Section 3: JIT retrieval ──────────────────────────────────────────────────
const S3 = () => (
  <div>
    <SecH2>Just-in-time retrieval — how Claude Code reads your codebase</SecH2>
    <Body>Claude Code does not load your entire codebase into context upfront. It navigates the filesystem like an experienced developer — reading files on demand as the task requires. A full dump of even a medium project would exhaust the context window before any work was done. The official Anthropic recommendation is to <strong>explore first, then plan, then code</strong> — always using Plan Mode to separate codebase exploration from implementation.</Body>
    <Sub>The JIT retrieval pattern</Sub>
    <JITRetrievalSVG/>
    <Sub>Explore-first workflow (official Anthropic best practice)</Sub>
    <Card>
      <TH cols={[{label:"Phase"},{label:"Mode",flex:1},{label:"Action",flex:3}]}/>
      {[
        ["1 — Explore","Plan Mode (Ctrl+G)","Read files, answer questions, understand patterns. Claude reads without making changes. Safe, no side effects."],
        ["2 — Plan","Plan Mode","Ask Claude to create a detailed implementation plan. Press Ctrl+G to open the plan in your editor for direct editing before Claude proceeds."],
        ["3 — Implement","Normal Mode","Switch back. Claude codes against its plan, runs tests, fixes failures. Verify against defined success criteria."],
        ["4 — Commit","Normal Mode","Ask Claude to commit with a descriptive message and open a PR. Plan Mode overhead pays for itself by avoiding wrong-approach cycles."],
      ].map((r,i,arr)=>(
        <TR key={i} last={i===arr.length-1} cells={[{v:r[0],bold:true},{v:r[1],flex:1},{v:r[2],flex:3}]}/>
      ))}
    </Card>
    <Sub>The three JIT tools and how to direct Claude toward each</Sub>
    <G3>
      {[
        {title:"glob — file discovery",color:C.okT,
         body:"Finds files matching patterns without reading contents. Returns paths only — extremely token efficient. Guide Claude here first before any read_file call. Costs near-zero tokens.",
         code:`glob("src/**/*.ts")\nglob("**/*.test.ts")\nglob("**/migrations/*.sql")`},
        {title:"grep — content search",color:C.okT,
         body:"Searches contents for patterns without loading whole files. Returns matching lines + paths only. Used for: finding where a function is defined, which files import a module, how an error pattern is used.",
         code:`grep("useAuth", "src/**")\ngrep("TODO:", "**/*.ts")\ngrep("class.*implements", "**")`},
        {title:"bash / head / tail",color:C.okT,
         body:"head and tail sample large files without loading entirely. Key for large logs and datasets. Always ask for a summary of bash output — raw outputs can be thousands of tokens.",
         code:`bash("head -50 large.log")\nbash("tail -100 error.log")\nbash("wc -l src/**/*.ts")`},
      ].map((c,i)=>(
        <Card key={i}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:5,color:c.color}}>{c.title}</div>
          <div style={{fontSize:12,color:C.text2,lineHeight:1.5,marginBottom:8}}>{c.body}</div>
          <CodeBlock>{c.code}</CodeBlock>
        </Card>
      ))}
    </G3>
    <Sub>Prompting for JIT efficiency vs forcing bulk loading</Sub>
    <Card>
      <TH cols={[{label:"Instead of (bulk load — expensive)"},{label:"Use this (JIT — targeted)",flex:1.5}]}/>
      {[
        ['"Read all files in src/"','"Find which files handle auth, then read only those"'],
        ['"Show me the whole architecture"','"Grep for entry points, then read the top 3"'],
        ['"Run tests and show all output"','"Run tests — give me a 3-line pass/fail summary"'],
        ['"Read all migration files"','"Show me the last 5 migrations with head -20 each"'],
        ['"What does this codebase do?"','"Read README.md and list the top-3 entry points. Then explore those only."'],
      ].map((r,i,arr)=>(
        <TR key={i} last={i===arr.length-1} cells={[{v:r[0]},{v:r[1],flex:1.5,bold:true}]}/>
      ))}
    </Card>
    <InfoBox>Claude performs dramatically better when it can verify its own work. Provide tests, screenshots, or expected outputs so Claude can check itself. Without clear success criteria, it might produce something that looks right but doesn't work — and every mistake requires your attention. This is the single highest-leverage practice beyond context management.</InfoBox>
  </div>
)

// ── Section 4: Auto-compaction ────────────────────────────────────────────────
const S4 = () => (
  <div>
    <SecH2>Auto-compaction — mechanics, costs, and control</SecH2>
    <Body>When a Claude Code session reaches approximately 83.5% context usage (~167K of 200K), auto-compaction triggers. Claude summarises the conversation history to create a compressed version that fits. <strong>Critical fact: each compaction event costs 100–200K tokens to execute</strong> — it is not free. Auto-compaction can fire up to 3 times per turn on large sessions. On Opus with the 1M window, it has been reported to fire at 76K tokens, wasting 92% of the available context. Always compact proactively.</Body>
    <Sub>Before and after compaction</Sub>
    <CompactionSVG/>
    <G2>
      <Card border={C.okBd}>
        <div style={{fontSize:13,fontWeight:500,marginBottom:5,color:C.okT}}>Survives compaction</div>
        <div style={{fontSize:12,color:C.text2,lineHeight:1.6}}>Project-root CLAUDE.md (reloaded from disk) · MEMORY.md (auto-memory — fully reloaded, not summarised) · Architectural decisions summarised · Unresolved bugs and open tasks · Key implementation details · 5 most recently accessed files · Skills (re-injected up to per-skill cap, oldest dropped) · Custom auto-memory directory contents (with timestamps)</div>
      </Card>
      <Card border={C.errBd}>
        <div style={{fontSize:13,fontWeight:500,marginBottom:5,color:C.errT}}>Discarded by compaction</div>
        <div style={{fontSize:12,color:C.text2,lineHeight:1.6}}>Redundant tool outputs · Repeated messages · Path-scoped CLAUDE.md (auto-reloads next time matching file is read) · Raw bash outputs from completed tasks · Old conversation turns whose conclusion has been summarised · Thinking token traces from prior turns</div>
      </Card>
    </G2>
    <Sub>How to help compaction preserve critical context</Sub>
    <Card>
      <TH cols={[{label:"Tactic"},{label:"Why it works",flex:2}]}/>
      {[
        ["Update CLAUDE.md with key decisions mid-session","Root CLAUDE.md reloads from disk after compaction — decision survives permanently"],
        ["Write a NOTES.md or TODO.md during long tasks","Agent re-reads these files; written notes persist entirely outside the context window"],
        ["Use path-scoped CLAUDE.md for directory rules","Reloads automatically the next time a file in that directory is touched"],
        ["Put critical SKILL.md instructions at the very top","Truncation keeps the start of the file — critical rules must be above the fold"],
        ["Run /compact at ~70% rather than waiting for 83.5%","Earlier compaction is cheaper — less context to summarise, fewer tokens consumed"],
        ["Checkpoint before breaks >1 hour","After 1 hour idle, entire conversation is resent as cache_creation at standard input rates — not cached rates. /clear and restart saves cost."],
      ].map((r,i,arr)=>(
        <TR key={i} last={i===arr.length-1} cells={[{v:r[0]},{v:r[1],flex:2}]}/>
      ))}
    </Card>
    <InfoBox>Pattern from Anthropic's team: maintain a NOTES.md or TODO.md file during complex tasks. This lets the agent track progress across dozens of tool calls, maintaining critical context that would otherwise be lost to compaction.</InfoBox>
  </div>
)

// ── Section 5: 4 CE strategies ────────────────────────────────────────────────
const S5 = () => (
  <div>
    <SecH2>The 4 CE strategies — mapped to Claude Code primitives (2026)</SecH2>
    <Body>Every one of the four core context engineering strategies maps directly to a specific Claude Code primitive. Recognising this mapping lets you apply the right tool at the right moment.</Body>
    <G2>
      {[
        {label:"WRITE — persist to storage",color:C.warnT,border:C.warnBd,title:"Store what must survive",
         body:"In Claude Code: update CLAUDE.md with architectural decisions, create NOTES.md / TODO.md for in-progress work, use the Memory tool (MCP) to store structured facts, write intermediate results to files. Custom auto-memory directory support (March 2026) — memory files now carry timestamps for freshness tracking.",
         code:`# Persist a decision:
"Update CLAUDE.md with the auth pattern
we just established for all API routes"

# In-session memory:
"Write our progress to NOTES.md including
the 3 unresolved bugs and next steps"`},
        {label:"SELECT — retrieve just what's needed",color:C.infoT,border:C.infoBd,title:"JIT loading over bulk loading",
         body:"In Claude Code: guide Claude to use glob before read_file, grep for specific patterns rather than reading entire modules, avoid 'read the entire codebase' prompts. Only connect MCP servers needed for this task. Use per-tool result-size overrides (up to 500K) to cap expensive MCP tool outputs.",
         code:`# Good — targeted:
"Find which files handle auth via grep,
then read only the 2 most relevant"

# Bad — bulk load:
"Read all files in src/ and explain
the architecture"                     # 60× the token cost`},
        {label:"COMPRESS — shrink before keeping",color:C.okT,border:C.okBd,title:"/compact, /effort, and summary requests",
         body:"In Claude Code: run /compact proactively at ~70% (auto-compaction at 83.5% is more expensive), ask Claude to summarise long bash outputs, use /clear to start fresh between unrelated tasks. Use /effort to tune reasoning depth — lower effort for mechanical tasks to reduce CoT overhead. Set MAX_THINKING_TOKENS=8000 as a cost ceiling.",
         code:`# Proactive compaction (before 83.5%):
/compact

# Tune reasoning for the task:
/effort                # interactive slider
MAX_THINKING_TOKENS=8000 claude ...

# Compressed bash output:
"Run tests — give me a 3-line summary"`},
        {label:"ISOLATE — separate context windows",color:C.errT,border:C.errBd,title:"Subagents, named agents, Ultraplan",
         body:"In Claude Code: delegate research-heavy subtasks to subagents (own 200K window), use named sub-agents for specialised tasks with defined tool sets and effort levels, use /clear between unrelated tasks. Ultraplan runs planning in the cloud — planning context never enters your local session's token budget.",
         code:`# Delegate to subagent:
"Use a subagent to analyse all migration
files and summarise schema evolution"

# Named agent for specialised work:
/agents  # configure agent with tool set

# Cloud planning (no local budget cost):
/ultraplan  # plan in web editor, run remote`},
      ].map((s,i)=>(
        <Card key={i} border={s.border}>
          <div style={{fontSize:11,fontWeight:500,color:s.color,marginBottom:5,letterSpacing:.4}}>{s.label}</div>
          <div style={{fontSize:16,fontWeight:500,marginBottom:8}}>{s.title}</div>
          <div style={{fontSize:12,color:C.text2,lineHeight:1.6,marginBottom:8}}>{s.body}</div>
          <CodeBlock>{s.code}</CodeBlock>
        </Card>
      ))}
    </G2>
  </div>
)

// ── Section 6: Commands ───────────────────────────────────────────────────────
const S6 = () => (
  <div>
    <SecH2>Commands — CE control panel (v2.1.126)</SecH2>
    <Body>Claude Code ships with a set of slash commands and CLI flags that are your context engineering control panel. Several new CE-relevant commands shipped in Q1 2026. The most impactful addition for CE is <Code>/effort</Code>, which directly controls the single largest variable cost in most sessions.</Body>
    <Sub>Core CE commands — full reference</Sub>
    <Card>
      <TH cols={[{label:"Command",flex:1},{label:"What it does",flex:2},{label:"CE impact",flex:1.5}]}/>
      {[
        ["/context","Live token breakdown by category with optimisation suggestions. Run at session start and before large tasks.","Primary monitoring tool — know your budget"],
        ["/clear","Wipes all conversation history. Starts fresh. CLAUDE.md reloads from disk automatically.","Full isolate — no context pollution across tasks"],
        ["/compact","Manually triggers compaction now. Cheaper to run at 70% than waiting for auto at 83.5%.","Compress strategy — on your schedule, not auto"],
        ["/effort","Opens interactive slider: low / medium / high / xhigh (Opus 4.7 only) / max. Arrow keys + Enter.","Controls thinking token budget — biggest cost lever"],
        ["/model","Switch model within a session. Also shows effort level selector.","Model + effort selection together"],
        ["/config","Toggle extended thinking on/off, set behaviour flags.","Disable thinking entirely for non-reasoning tasks"],
        ["/memory","View and edit persistent memory entries injected into every session.","Inspect what's in the fixed startup context"],
        ["/agents","List, create, configure named sub-agents with defined tool sets and effort levels.","Set up isolated CE contexts per task type"],
        ["/powerup","Interactive tutorial system — learn new features since last update.","Post-update orientation"],
        ["/loop","Run a task in a self-paced loop; omit interval for auto-pacing.","Recurring monitoring without manual re-prompting"],
        ["/team-onboarding","Packages your Claude Code setup into a replayable guide.","Standardise CE patterns across teams"],
        ["/autofix-pr","Enable PR auto-fix from your terminal. Runs in isolated context.","Isolate CI fix loop from main session"],
        ["/ultraplan","Draft a plan in cloud web editor; run it remotely or pull back local.","Planning context never enters local session budget"],
        ["/advisor","Activates dual-model mode: Sonnet 4.6 executor + Opus 4.7 advisor. Advisor reviews context periodically and provides strategic guidance. Use for complex decisions without paying full-Opus cost for every turn.","CE superpower — Opus reasoning at Sonnet cost for most turns"],
        ["/branch","Create a git worktree with its own Claude Code session. Each worktree is an isolated context window. Run multiple tasks in true parallel without sharing context.","ISOLATE strategy — true parallel CE windows"],
        ["/status","Real-time dashboard of all running sessions, subagent states, and costs. Single view across parallel sessions.","Monitor parallel CE contexts"],
        ["/debug","Diagnose session issues: context corruption, tool failures, caching anomalies. Shows raw context stats.","Debug when /context doesn't tell the whole story"],
      ].map((r,i,arr)=>(
        <TR key={i} last={i===arr.length-1} cells={[{v:<Code>{r[0]}</Code>,flex:1},{v:r[1],flex:2},{v:r[2],flex:1.5,bold:true}]}/>
      ))}
    </Card>
    <Sub>Session continuation flags</Sub>
    <Card>
      <TH cols={[{label:"Flag",flex:1},{label:"Behaviour",flex:2},{label:"CE implication",flex:1.5}]}/>
      {[
        ["--continue","Resumes the last session with full context restored","Budget is where you left it — check /context first"],
        ["--resume <id>","Resumes a specific past session by session ID","Parallel feature streams on different sessions"],
        ["--append-system-prompt","Appends extra text to the system prompt alongside CLAUDE.md","CI/CD pipelines, output style overrides, one-time context"],
      ].map((r,i,arr)=>(
        <TR key={i} last={i===arr.length-1} cells={[{v:<Code>{r[0]}</Code>,flex:1},{v:r[1],flex:2},{v:r[2],flex:1.5}]}/>
      ))}
    </Card>
    <Sub>Update channels</Sub>
    <Card>
      <TH cols={[{label:"Channel"},{label:"Behaviour"},{label:"Recommendation"}]}/>
      <TR cells={[{v:<Code>latest</Code>},{v:"Default. Immediate features, same day as release."},{v:"Individual use, experimentation"}]}/>
      <TR last cells={[{v:<Code>stable</Code>},{v:"1-week delay; skips releases with known regressions. Avoids incidents like the March 2026 v2.1.89 caching bug (10-20× token inflation)."},{v:"Production work, team environments",bold:true}]}/>
    </Card>
    <Sub>The recommended session rhythm</Sub>
    <CodeBlock>{`# Session start
/context                    # Check starting token budget
/effort high                # Set explicitly — default is medium since Mar 2026
# MAX_THINKING_TOKENS=8000  # Optional cost ceiling in env

# Before a large task
/context                    # How much room do I have?
/compact                    # Compress if already > 70% used

# During long sessions
# Ask Claude to update NOTES.md or CLAUDE.md with key decisions
# Use Plan Mode (Ctrl+G) for exploration before implementation
# Delegate research / large-file analysis to a subagent

# After 1 hour idle — DON'T just resume
# Full context will be resent at standard input rates (not cached)
# Better: /clear and restart with compressed context in NOTES.md

# Switching to a different feature
/clear                      # Clean slate — no context pollution

# Debugging degraded responses
/context                    # Is context usage >70%? Likely cause.
/effort high                # Did default medium cause fabrications?
/compact                    # Compress and continue, OR
/clear                      # Fresh start for new task`}</CodeBlock>
  </div>
)

// ── Section 7: Checklist ──────────────────────────────────────────────────────
const CHECKLIST = [
  {cat:"Project setup — once per project", items:[
    {text:"Create a project-root CLAUDE.md with: tech stack, key commands (copy-pasteable), architecture decisions, coding conventions",tag:"Foundation"},
    {text:"Keep CLAUDE.md under 200 lines (~1,600 tokens) — move specialised instructions (PR review, migrations) to Skills",tag:"Token budget"},
    {text:"Put the most critical rules at the very top — they survive truncation and get the highest primacy attention",tag:"Positioning"},
    {text:"Create path-scoped CLAUDE.md files for directory-specific conventions (e.g. /src/api/CLAUDE.md)",tag:"Hierarchy"},
    {text:"Audit which MCP servers you actually need — each costs ~2,650 tokens of fixed overhead per session",tag:"MCP budget"},
    {text:"Set up ~/.claude/CLAUDE.md for personal output style preferences and cross-project defaults",tag:"Global"},
    {text:"Choose update channel: run 'claude update --channel stable' for production work to avoid regressions like the March 2026 caching incident",tag:"Stability"},
  ]},
  {cat:"Session start", items:[
    {text:"Run /context immediately — know your starting token budget before writing a single prompt",tag:"Monitor"},
    {text:"Run /effort high before complex multi-file work — default is medium since March 2026, which causes fabrications on hard tasks",tag:"Effort"},
    {text:"If continuing with --continue, check /context to see where the budget stands before starting new work",tag:"Monitor"},
    {text:"If switching to a completely new task, use /clear — prior context pollutes new task reasoning",tag:"Isolate"},
    {text:"Only connect MCP servers needed for this specific task — disconnect others to preserve token budget",tag:"Select"},
    {text:"Set MAX_THINKING_TOKENS=8000 in env for routine sessions to cap unexpected thinking cost spikes",tag:"Cost"},
    {text:"Check /status if you have parallel sessions — see which ones are still consuming budget",tag:"Monitor"},
    {text:"Use /advisor for complex architectural decisions — gets Opus reasoning without paying full-Opus for every turn",tag:"Advisor"},
  ]},
  {cat:"During long sessions", items:[
    {text:"Use Plan Mode (Ctrl+G) to explore and plan before implementation — avoids costly wrong-approach cycles",tag:"Plan Mode"},
    {text:"When Claude makes an architectural decision, ask it to update CLAUDE.md — root CLAUDE.md survives compaction",tag:"Write"},
    {text:"For complex multi-step tasks, ask Claude to maintain a NOTES.md or TODO.md with current progress and unresolved bugs",tag:"Write"},
    {text:"Check /context at 60% and again at 70% — auto-compaction fires at 83.5% and costs 100–200K tokens",tag:"Monitor"},
    {text:"Run /compact proactively at ~70% — earlier compaction is cheaper than later auto-compaction",tag:"Compress"},
    {text:"Delegate large research tasks (reading many docs, analysing many files) to a subagent with its own 200K window",tag:"Isolate"},
    {text:"Guide Claude to use glob/grep before read_file — avoid 'read all files in src/' style prompts",tag:"Select"},
    {text:"Use named sub-agents (/agents) for specialised recurring tasks — each has its own defined tool set and effort level",tag:"Agents"},
    {text:"ToolSearch is active by default (v2.1.7+) — deferred tools only load when first used, saving 60–80% tool schema overhead",tag:"ToolSearch"},
    {text:"If using /advisor, it fires every N turns automatically — use '/advisor now' to trigger immediately at a decision point",tag:"Advisor"},
    {text:"Write key decisions to MEMORY.md via '/memory add' — these survive compaction and reload in every future session",tag:"Memory"},
  ]},
  {cat:"Cost management", items:[
    {text:"For mechanical tasks (renaming, formatting, quick lookups), use /effort low to disable thinking tokens",tag:"Cost"},
    {text:"Avoid blanket CoT on long agentic tasks — thinking tokens (output price) add up to 5× more than input tokens",tag:"Cost"},
    {text:"Before breaks >1 hour, checkpoint to NOTES.md then /clear and restart — idle resumes rebill the full context at standard rates",tag:"Cost"},
    {text:"Cap subagent parallelism in CLAUDE.md — never leave parallel agent chains running unattended",tag:"Cost"},
    {text:"Check /cost output for anomalous output token spend — if output is disproportionate to what you asked, suspect a compaction or caching bug",tag:"Cost"},
  ]},
  {cat:"CLAUDE.md maintenance", items:[
    {text:"After any major architectural decision: 'Add this pattern to CLAUDE.md for consistency'",tag:"Write"},
    {text:"Update the 'Current sprint focus' line when switching features or sprints",tag:"Write"},
    {text:"Periodically audit CLAUDE.md for stale content — every token is a permanent deduction from your budget, every turn",tag:"Compress"},
    {text:"After adding a new MCP server, remove from CLAUDE.md anything the MCP now makes redundant",tag:"Budget"},
    {text:"If CLAUDE.md exceeds 200 lines, move specialised sections to Skills (on-demand load) to reduce baseline cost",tag:"Budget"},
    {text:"Use MEMORY.md (auto-memory) for project-specific facts that should persist indefinitely — separate from CLAUDE.md conventions",tag:"Memory"},
  ]},
  {cat:"Debugging degraded responses", items:[
    {text:"If Claude ignores instructions: run /context first — context usage >70% is the most common cause",tag:"Debug"},
    {text:"If Claude fabricates API versions or package names: set /effort high — default medium is insufficient for complex tasks",tag:"Debug"},
    {text:"If Claude forgets decisions after compaction: check if they were committed to CLAUDE.md or NOTES.md",tag:"Debug"},
    {text:"If costs are 10-20× higher than expected: check if you've hit a caching bug (compare with March 2026 incident); check if model was switched mid-session",tag:"Debug"},
    {text:"If auto-compaction fires unexpectedly early (at 76K on 1M window): known Opus 1M issue — use manual /compact or cap context lower",tag:"Debug"},
    {text:"If tool schema is unexpectedly large: check if ToolSearch deferred loading is active — /context shows 'deferred tools N' if working correctly",tag:"ToolSearch"},
    {text:"If /advisor is giving generic advice: the context window passed to the advisor may be truncated — compact before invoking /advisor for best results",tag:"Advisor"},
  ]},
]
const S7 = () => {
  const flat=CHECKLIST.flatMap(cat=>cat.items.map(item=>({...item,done:false})))
  const [items,setItems]=useState(flat)
  const total=items.length,done=items.filter(i=>i.done).length,pct=Math.round(done/total*100)
  let g=0
  const toggle=(idx)=>setItems(prev=>prev.map((it,i)=>i===idx?{...it,done:!it.done}:it))
  return (
    <div>
      <SecH2>Claude Code CE checklist</SecH2>
      <Body>Comprehensive checklist calibrated to current Claude Code behaviour. Includes all updates from the March–April cycle: effort system changes, compaction cost data, caching bug awareness, and new commands.</Body>
      <div style={{fontSize:12,color:C.text2,marginBottom:4}}>{done} of {total} complete</div>
      <div style={{background:C.bg2,borderRadius:4,height:4,overflow:"hidden",marginBottom:10}}><div style={{width:`${pct}%`,height:"100%",borderRadius:4,background:C.okT,transition:"width .3s"}}/></div>
      {CHECKLIST.map(cat=>(
        <div key={cat.cat}>
          <div style={{fontSize:11,fontWeight:500,color:C.text3,textTransform:"uppercase",letterSpacing:.4,padding:"10px 0 5px",borderBottom:`0.5px solid ${C.borderMd}`,marginTop:6}}>{cat.cat}</div>
          {cat.items.map(item=>{
            const idx=g++,checked=items[idx]?.done
            return (
              <div key={idx} onClick={()=>toggle(idx)} style={{display:"flex",alignItems:"flex-start",gap:9,padding:"8px 0",borderBottom:`0.5px solid ${C.border}`,cursor:"pointer",userSelect:"none"}}>
                <div style={{width:15,height:15,border:`1.5px solid ${checked?C.okT:C.borderMd}`,borderRadius:3,flexShrink:0,marginTop:2,background:checked?C.okBg:"transparent",transition:"all .12s"}}/>
                <div>
                  <div style={{fontSize:13,lineHeight:1.4,textDecoration:checked?"line-through":"none",color:checked?C.text3:C.text1}}>{item.text}</div>
                  <div style={{fontSize:11,color:C.text3}}>{item.tag}</div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
const TABS=["CE System","Anatomy","CLAUDE.md","JIT","Compaction","Strategies","Commands","Checklist","Simulator"]
const SECTIONS=[S0,S1,S2,S3,S4,S5,S6,S7,S_SIMULATOR]

export default function ContextEngineeringClaudeCode() {
  const [active,setActive]=useState(0)
  const Section=SECTIONS[active]
  return (
    <div style={{maxWidth:820,margin:"0 auto",padding:"0 20px 80px",fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",background:C.bg3,color:C.text1,lineHeight:1.6,fontSize:15}}>
      <div style={{padding:"12px 0 16px",borderBottom:`0.5px solid ${C.borderMd}`}}>
        <p style={{fontSize:13,color:C.text2,margin:0}}>v2.1.126 · Models: Opus 4.7, Opus 4.6, Sonnet 4.6, Haiku 4.5 · Source: Anthropic docs, Claude Code best practices, community data</p>
      </div>
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none",padding:"12px 0",borderBottom:`0.5px solid ${C.border}`,position:"sticky",top:"var(--sl-nav-height)",background:C.bg3,zIndex:20}}>
        <div style={{display:"flex",flexWrap:"nowrap",gap:3}}>
          {TABS.map((tab,i)=>(
            <button key={i} onClick={()=>setActive(i)} style={{padding:"5px 10px 3px",fontSize:12,fontWeight:400,fontFamily:"inherit",lineHeight:"1.4",borderRadius:0,border:"none",borderBottom:`2px solid ${i===active?C.okT:"transparent"}`,cursor:"pointer",color:i===active?C.text1:C.text2,background:"transparent",transition:"all .12s",whiteSpace:"nowrap",flexShrink:0,boxSizing:"border-box",WebkitAppearance:"none",appearance:"none"}}>
              {tab}{i===8?" ⚙":""}
            </button>
          ))}
        </div>
      </div>
      <div style={{paddingTop:20}}><Section/></div>
    </div>
  )
}
