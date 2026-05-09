import{j as e}from"./jsx-runtime.u17CrQMm.js";import{r as c,R as b}from"./index.DrBtkhmp.js";const t={bg:"#0d1117",surface:"#161b22",card:"#1c2333",border:"rgba(255,255,255,0.08)",text:"#E8EDF5",textSoft:"#9BA8C0",textDim:"#5E6E8A",white:"#FFFFFF",green:"#00d46a",greenBg:"rgba(0,212,106,0.08)",blue:"#60A5FA",blueBg:"rgba(96,165,250,0.08)",red:"#F87171",purple:"#A78BFA",cyan:"#22D3EE",orange:"#FB923C",yellow:"#FBBF24"},a={fontFamily:"'JetBrains Mono','Fira Code','SF Mono',Consolas,monospace"},i={fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"};function d({children:o,color:r=t.blue,subtitle:n}){return e.jsxs("div",{style:{marginBottom:20},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12},children:[e.jsx("div",{style:{width:4,height:28,borderRadius:2,background:r}}),e.jsx("h2",{style:{...i,fontSize:20,fontWeight:800,color:t.white,margin:0},children:o})]}),n&&e.jsx("p",{style:{...i,fontSize:13,color:t.textDim,margin:"6px 0 0 16px"},children:n})]})}function p({label:o,active:r,onClick:n,color:s=t.blue}){return e.jsx("button",{onClick:n,style:{...i,fontSize:13,fontWeight:r?700:500,color:r?s:t.textSoft,background:r?`${s}15`:"transparent",border:`1.5px solid ${r?s:"transparent"}`,borderRadius:8,padding:"7px 16px",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"},children:o})}function u({code:o}){const[r,n]=c.useState(!1),s=()=>{navigator.clipboard?.writeText(o).catch(()=>{}),n(!0),setTimeout(()=>n(!1),1500)};return e.jsxs("div",{style:{position:"relative"},children:[e.jsx("pre",{style:{...a,fontSize:12,lineHeight:1.75,background:"#0a0e14",border:`1px solid ${t.border}`,borderRadius:8,padding:"14px 16px",margin:0,overflow:"auto",color:t.textSoft,whiteSpace:"pre"},children:o}),e.jsx("button",{onClick:s,style:{position:"absolute",top:8,right:8,...i,fontSize:11,fontWeight:600,background:r?t.greenBg:t.card,color:r?t.green:t.textDim,border:`1px solid ${r?t.green:t.border}`,borderRadius:5,padding:"3px 10px",cursor:"pointer"},children:r?"Copied":"Copy"})]})}const f=[{label:"Your Application",color:t.blue,icon:"🖥",items:["Python / TypeScript / any language","Constructs prompt + options","Consumes JSON event stream"]},{label:"Agent SDK",color:t.purple,icon:"📦",items:["query() / StatefulClient","Manages subprocess lifecycle","Parses newline-delimited JSON"]},{label:"Claude Code CLI",color:t.cyan,icon:"⚙️",items:["subprocess: claude --output-format stream-json","Agentic loop (read → tool → observe)","Exits 0 on success, non-zero on error"]},{label:"Anthropic API / Cloud",color:t.green,icon:"☁️",items:["api.anthropic.com  ·  AWS Bedrock  ·  GCP Vertex","Streams tokens back to CLI","Tool calls dispatched inside loop"]}];function v(){const[o,r]=c.useState(null);return e.jsxs("div",{children:[e.jsx(d,{color:t.blue,subtitle:"Subprocess model — your app owns the process, SDK owns the protocol",children:"Subprocess Architecture"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:4,marginBottom:20},children:f.map((n,s)=>e.jsxs(b.Fragment,{children:[e.jsxs("button",{onClick:()=>r(o===s?null:s),style:{background:o===s?`${n.color}18`:t.card,border:`2px solid ${o===s?n.color:t.border}`,borderRadius:10,padding:"14px 18px",cursor:"pointer",textAlign:"left",width:"100%",display:"flex",alignItems:"center",gap:14,transition:"all 0.15s"},children:[e.jsx("span",{style:{fontSize:22},children:n.icon}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{style:{...i,fontSize:14,fontWeight:800,color:n.color},children:n.label}),o!==s&&e.jsx("div",{style:{...i,fontSize:11,color:t.textDim,marginTop:2},children:n.items[0]})]}),e.jsx("span",{style:{color:t.textDim,fontSize:12},children:o===s?"▲":"▼"})]}),o===s&&e.jsx("div",{style:{background:`${n.color}08`,border:`1px solid ${n.color}30`,borderRadius:8,padding:"12px 18px",marginLeft:8},children:n.items.map((l,m)=>e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:10,marginTop:m>0?8:0},children:[e.jsx("div",{style:{width:6,height:6,borderRadius:"50%",background:n.color,marginTop:5,flexShrink:0}}),e.jsx("span",{style:{...i,fontSize:13,color:t.textSoft,lineHeight:1.6},children:l})]},m))}),s<f.length-1&&e.jsx("div",{style:{textAlign:"center",color:t.textDim,fontSize:18,lineHeight:1},children:"↕"})]},n.label))}),e.jsxs("div",{style:{background:t.blueBg,border:`1px solid ${t.blue}30`,borderRadius:10,padding:"14px 18px"},children:[e.jsx("div",{style:{...i,fontSize:13,fontWeight:700,color:t.blue,marginBottom:6},children:"Data Flow"}),e.jsxs("div",{style:{...i,fontSize:12,color:t.textSoft,lineHeight:1.7},children:["App → SDK ",e.jsx("code",{style:a,children:"query(prompt, options)"})," → CLI subprocess (",e.jsx("code",{style:a,children:"--output-format stream-json --print"}),") → newline-delimited JSON events → SDK yields typed event objects → App processes results."]})]})]})}const x=[{type:"system",color:t.yellow,icon:"🔧",desc:"Emitted once at the start of the stream. Contains SDK metadata.",fields:[{name:"type",val:'"system"',desc:'Always "system"'},{name:"subtype",val:'"init"',desc:'Currently always "init"'},{name:"session_id",val:"string",desc:"Unique ID for this invocation"},{name:"tools",val:"string[]",desc:"Tool names available in this session"},{name:"model",val:"string",desc:"Model ID resolved for this run"}],example:`{"type":"system","subtype":"init",
  "session_id":"sess_01XyzAbc",
  "tools":["Bash","Read","Write"],
  "model":"claude-opus-4-5-20251101-v1:0"}`},{type:"assistant",color:t.blue,icon:"🤖",desc:"One event per model turn. Contains the full message with text and/or tool_use blocks.",fields:[{name:"type",val:'"assistant"',desc:'Always "assistant"'},{name:"message",val:"Message",desc:"Anthropic Message object"},{name:"message.role",val:'"assistant"',desc:""},{name:"message.content",val:"Block[]",desc:"TextBlock | ToolUseBlock[]"}],example:`{"type":"assistant","message":{
  "role":"assistant",
  "content":[
    {"type":"text","text":"I'll read the file first."},
    {"type":"tool_use","id":"tu_01","name":"Read",
     "input":{"file_path":"src/main.py"}}
  ]}}`},{type:"tool_result",color:t.cyan,icon:"🔩",desc:"One event per tool invocation result. Emitted after the CLI executes each tool.",fields:[{name:"type",val:'"tool_result"',desc:'Always "tool_result"'},{name:"tool_use_id",val:"string",desc:"Matches ToolUseBlock.id"},{name:"content",val:"string",desc:"Raw stdout/result from the tool"},{name:"is_error",val:"boolean",desc:"True if the tool raised an error"}],example:`{"type":"tool_result",
  "tool_use_id":"tu_01",
  "content":"def main():\\n    print(\\"hello\\")",
  "is_error":false}`},{type:"result",color:t.green,icon:"✅",desc:"Final event. Summarises the completed run — cost, turns, and text output.",fields:[{name:"type",val:'"result"',desc:'Always "result"'},{name:"subtype",val:'"success" | "error_max_turns" | "error_during_execution"',desc:""},{name:"result",val:"string",desc:"Final text output from Claude"},{name:"session_id",val:"string",desc:"Same as system init session_id"},{name:"total_cost_usd",val:"number",desc:"Accumulated cost in USD"},{name:"num_turns",val:"number",desc:"Number of agentic loop iterations"},{name:"usage",val:"Usage",desc:"input_tokens, output_tokens, cache hits"}],example:`{"type":"result","subtype":"success",
  "result":"Added error handling to main().",
  "session_id":"sess_01XyzAbc",
  "total_cost_usd":0.0034,
  "num_turns":3,
  "usage":{"input_tokens":1820,"output_tokens":312}}`},{type:"error",color:t.red,icon:"❌",desc:"Emitted when a fatal error occurs before the result event (e.g. auth failure, invalid options).",fields:[{name:"type",val:'"error"',desc:'Always "error"'},{name:"error",val:"string",desc:"Human-readable error message"},{name:"code",val:"string",desc:"Machine-readable error code"}],example:`{"type":"error",
  "error":"Authentication failed: invalid API key",
  "code":"authentication_error"}`}];function S(){const[o,r]=c.useState("system"),n=x.find(s=>s.type===o);return e.jsxs("div",{children:[e.jsx(d,{color:t.cyan,subtitle:"Newline-delimited JSON — one object per line on stdout",children:"SDK Event Types"}),e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20},children:x.map(s=>e.jsx(p,{label:`${s.icon} ${s.type}`,active:o===s.type,color:s.color,onClick:()=>r(s.type)},s.type))}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16},children:[e.jsxs("div",{children:[e.jsx("div",{style:{...i,fontSize:12,fontWeight:700,color:t.textDim,textTransform:"uppercase",letterSpacing:.7,marginBottom:10},children:"Fields"}),e.jsx("p",{style:{...i,fontSize:13,color:t.textSoft,marginBottom:12,lineHeight:1.6},children:n.desc}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:6},children:n.fields.map((s,l)=>e.jsxs("div",{style:{background:`${n.color}08`,border:`1px solid ${n.color}20`,borderRadius:8,padding:"8px 12px",display:"flex",alignItems:"flex-start",gap:12},children:[e.jsx("code",{style:{...a,fontSize:11,color:n.color,minWidth:120,flexShrink:0},children:s.name}),e.jsxs("div",{children:[e.jsx("code",{style:{...a,fontSize:11,color:t.textSoft},children:s.val}),s.desc&&e.jsx("div",{style:{...i,fontSize:11,color:t.textDim,marginTop:2},children:s.desc})]})]},l))})]}),e.jsxs("div",{children:[e.jsx("div",{style:{...i,fontSize:12,fontWeight:700,color:t.textDim,textTransform:"uppercase",letterSpacing:.7,marginBottom:10},children:"Example"}),e.jsx(u,{code:n.example})]})]})]})}const y={basic:{label:"Basic query()",color:t.blue,code:`import asyncio
from claude_code_sdk import query, ClaudeCodeOptions

async def main():
    options = ClaudeCodeOptions(
        max_turns=10,
        allowed_tools=["Read", "Write", "Bash"],
    )
    async for event in query(
        prompt="Refactor src/utils.py to use dataclasses",
        options=options,
    ):
        if event.type == "assistant":
            for block in event.message.content:
                if block.type == "text":
                    print(block.text)
        elif event.type == "result":
            print(f"Done — {event.num_turns} turns, \${event.total_cost_usd:.4f}")

asyncio.run(main())`},stateful:{label:"StatefulClient multi-turn",color:t.purple,code:`import asyncio
from claude_code_sdk import StatefulClient, ClaudeCodeOptions

async def main():
    options = ClaudeCodeOptions(max_turns=5, allowed_tools=["Read"])

    async with StatefulClient(options=options) as client:
        # Turn 1 — ask a question
        async for event in client.query("List all public functions in src/"):
            if event.type == "result":
                print("Turn 1:", event.result)

        # Turn 2 — follow-up in the same session (context preserved)
        async for event in client.query("Which ones lack docstrings?"):
            if event.type == "result":
                print("Turn 2:", event.result)

        print("Session ID:", client.session_id)

asyncio.run(main())`},parallel:{label:"Parallel sessions",color:t.cyan,code:`import asyncio
from claude_code_sdk import query, ClaudeCodeOptions

FILES = ["src/auth.py", "src/db.py", "src/api.py"]

async def review_file(path: str) -> str:
    opts = ClaudeCodeOptions(max_turns=5, allowed_tools=["Read"])
    async for event in query(
        prompt=f"Review {path} for security issues. Be concise.",
        options=opts,
    ):
        if event.type == "result":
            return f"## {path}\\n{event.result}"
    return ""

async def main():
    # Run all reviews concurrently
    results = await asyncio.gather(*[review_file(f) for f in FILES])
    print("\\n\\n".join(results))

asyncio.run(main())`}};function j(){const[o,r]=c.useState("basic"),n=y[o];return e.jsxs("div",{children:[e.jsx(d,{color:t.purple,subtitle:"claude-code-sdk · Python ≥ 3.10  ·  pip install claude-code-sdk",children:"Python — StatefulClient Patterns"}),e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16},children:Object.entries(y).map(([s,l])=>e.jsx(p,{label:l.label,active:o===s,color:l.color,onClick:()=>r(s)},s))}),e.jsx(u,{code:n.code})]})}const h={basic:{label:"Basic query()",color:t.blue,code:`import { query, type SDKMessage } from "@anthropic-ai/claude-code";

const messages: SDKMessage[] = [];

for await (const event of query({
  prompt: "Add JSDoc comments to src/utils.ts",
  options: {
    maxTurns: 10,
    allowedTools: ["Read", "Write"],
  },
})) {
  messages.push(event);

  if (event.type === "result") {
    console.log(\`Done in \${event.numTurns} turns\`);
    console.log(\`Cost: $\${event.totalCostUsd.toFixed(4)}\`);
  }
}`},stateful:{label:"StatefulClaudeCode",color:t.purple,code:`import { StatefulClaudeCode } from "@anthropic-ai/claude-code";

const client = new StatefulClaudeCode({
  options: { maxTurns: 8, allowedTools: ["Read", "Bash"] },
});

try {
  // Turn 1
  for await (const event of client.query("List test files")) {
    if (event.type === "result") console.log("T1:", event.result);
  }

  // Turn 2 — continues in same session
  for await (const event of client.query("Which tests are failing?")) {
    if (event.type === "result") console.log("T2:", event.result);
  }
} finally {
  await client.close();
}`},parallel:{label:"Parallel with Promise.all",color:t.cyan,code:`import { query } from "@anthropic-ai/claude-code";

const files = ["src/auth.ts", "src/db.ts", "src/api.ts"];

async function reviewFile(path: string): Promise<string> {
  for await (const event of query({
    prompt: \`Security review of \${path}. Be concise.\`,
    options: { maxTurns: 5, allowedTools: ["Read"] },
  })) {
    if (event.type === "result") return \`## \${path}\\n\${event.result}\`;
  }
  return "";
}

const results = await Promise.all(files.map(reviewFile));
console.log(results.join("\\n\\n"));`}};function w(){const[o,r]=c.useState("basic"),n=h[o];return e.jsxs("div",{children:[e.jsx(d,{color:t.blue,subtitle:"@anthropic-ai/claude-code  ·  npm install @anthropic-ai/claude-code",children:"TypeScript — StatefulClaudeCode Examples"}),e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16},children:Object.entries(h).map(([s,l])=>e.jsx(p,{label:l.label,active:o===s,color:l.color,onClick:()=>r(s)},s))}),e.jsx(u,{code:n.code})]})}const C=[{name:"maxTurns / max_turns",type:"number",default:"10",desc:"Maximum agentic loop iterations before stopping with error_max_turns."},{name:"allowedTools / allowed_tools",type:"string[]",default:"all",desc:"Whitelist of tool names. Pass [] to disable all tools (text-only mode)."},{name:"model",type:"string",default:"auto",desc:"Model ID override. Defaults to the Claude Code CLI default model."},{name:"systemPrompt / system_prompt",type:"string",default:"—",desc:"Prepend a system prompt before the user prompt."},{name:"appendSystemPrompt",type:"string",default:"—",desc:"Append text to the default system prompt without replacing it."},{name:"cwd",type:"string",default:"process.cwd()",desc:"Working directory for the Claude Code subprocess."},{name:"env",type:"Record<string,string>",default:"—",desc:"Extra environment variables injected into the subprocess."},{name:"mcpServers",type:"MCPServer[]",default:"—",desc:"MCP server definitions (name, command, args, env) to pass via --mcp-config."},{name:"permissionMode",type:"'default' | 'auto' | 'bypassPermissions'",default:"'default'",desc:"Tool permission strategy. bypassPermissions skips all prompts (CI only)."},{name:"verbose",type:"boolean",default:"false",desc:"Emit additional debug events on stderr."}];function _(){return e.jsxs("div",{children:[e.jsx(d,{color:t.orange,subtitle:"ClaudeCodeOptions (Python) / SDKOptions (TypeScript)",children:"Configuration Option Reference"}),e.jsx("div",{style:{overflowX:"auto"},children:e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",...i,fontSize:13},children:[e.jsx("thead",{children:e.jsx("tr",{style:{background:t.card},children:["Option","Type","Default","Description"].map(o=>e.jsx("th",{style:{textAlign:"left",padding:"10px 14px",color:t.textDim,fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:.6,borderBottom:`1px solid ${t.border}`},children:o},o))})}),e.jsx("tbody",{children:C.map((o,r)=>e.jsxs("tr",{style:{background:r%2===0?"transparent":`${t.surface}80`},children:[e.jsx("td",{style:{padding:"9px 14px",borderBottom:`1px solid ${t.border}40`},children:e.jsx("code",{style:{...a,fontSize:12,color:t.cyan},children:o.name})}),e.jsx("td",{style:{padding:"9px 14px",borderBottom:`1px solid ${t.border}40`},children:e.jsx("code",{style:{...a,fontSize:11,color:t.purple},children:o.type})}),e.jsx("td",{style:{padding:"9px 14px",borderBottom:`1px solid ${t.border}40`},children:e.jsx("code",{style:{...a,fontSize:11,color:t.textDim},children:o.default})}),e.jsx("td",{style:{padding:"9px 14px",borderBottom:`1px solid ${t.border}40`,color:t.textSoft,lineHeight:1.5},children:o.desc})]},o.name))})]})})]})}const g=[{icon:"🔄",color:t.green,label:"CI/CD Pipeline",desc:"Use query() with permissionMode: 'bypassPermissions' and a narrow allowedTools list. Capture the result event for exit-code logic.",code:`for await (const event of query({
  prompt: "Review PR diff for security issues",
  options: {
    maxTurns: 5,
    allowedTools: ["Read"],
    permissionMode: "bypassPermissions",
  },
})) {
  if (event.type === "result") {
    if (event.subtype !== "success") process.exit(1);
    console.log(event.result);
  }
}`},{icon:"🌐",color:t.blue,label:"Web App (per-request)",desc:"Create a StatefulClient per user session. Store session_id in your DB. Rehydrate with resumeSession to continue conversations.",code:`// POST /api/chat
export async function chatHandler(req, res) {
  const client = new StatefulClaudeCode({
    options: { maxTurns: 10, allowedTools: ["Read"] },
  });
  res.setHeader("Content-Type", "text/event-stream");

  for await (const event of client.query(req.body.message)) {
    if (event.type === "assistant") {
      res.write(\`data: \${JSON.stringify(event)}\\n\\n\`);
    }
    if (event.type === "result") {
      res.write(\`data: [DONE]\\n\\n\`);
      res.end();
    }
  }
}`},{icon:"⚡",color:t.cyan,label:"Parallel Workloads",desc:"Fan out N independent tasks concurrently with Promise.all / asyncio.gather. Each call spawns its own subprocess — fully isolated.",code:`const tasks = repos.map(repo =>
  query({
    prompt: \`Audit \${repo} for outdated dependencies\`,
    options: { maxTurns: 8, cwd: repo },
  })
);

const results = await Promise.all(
  tasks.map(async stream => {
    for await (const ev of stream) {
      if (ev.type === "result") return ev.result;
    }
  })
);`}];function T(){const[o,r]=c.useState(0),n=g[o];return e.jsxs("div",{children:[e.jsx(d,{color:t.green,subtitle:"Recommended patterns for real workloads",children:"Production Patterns"}),e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16},children:g.map((s,l)=>e.jsx(p,{label:`${s.icon} ${s.label}`,active:o===l,color:s.color,onClick:()=>r(l)},l))}),e.jsx("p",{style:{...i,fontSize:13,color:t.textSoft,marginBottom:14,lineHeight:1.7},children:n.desc}),e.jsx(u,{code:n.code})]})}const k=[{id:"arch",label:"Architecture",color:t.blue},{id:"events",label:"Event Types",color:t.cyan},{id:"python",label:"Python",color:t.purple},{id:"ts",label:"TypeScript",color:t.blue},{id:"config",label:"Config Reference",color:t.orange},{id:"patterns",label:"Production Patterns",color:t.green}];function D(){const[o,r]=c.useState("arch"),n=()=>{switch(o){case"arch":return e.jsx(v,{});case"events":return e.jsx(S,{});case"python":return e.jsx(j,{});case"ts":return e.jsx(w,{});case"config":return e.jsx(_,{});case"patterns":return e.jsx(T,{});default:return null}};return e.jsxs("div",{style:{background:t.bg,borderRadius:16,padding:"24px 20px",color:t.text},children:[e.jsxs("div",{style:{marginBottom:24},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:6},children:[e.jsx("span",{style:{fontSize:26},children:"📦"}),e.jsx("h1",{style:{...i,fontSize:24,fontWeight:900,color:t.white,margin:0},children:"Agent SDK"})]}),e.jsx("p",{style:{...i,fontSize:13,color:t.textDim,margin:0},children:"Subprocess architecture · JSON streaming · Agent SDK v1 · Claude Code v2.1.126"})]}),e.jsx("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:28,paddingBottom:16,borderBottom:`1px solid ${t.border}`},children:k.map(s=>e.jsx(p,{label:s.label,active:o===s.id,color:s.color,onClick:()=>r(s.id)},s.id))}),n()]})}export{D as default};
