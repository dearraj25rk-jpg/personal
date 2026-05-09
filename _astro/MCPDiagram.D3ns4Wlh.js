import{j as e}from"./jsx-runtime.u17CrQMm.js";import{r as c}from"./index.DrBtkhmp.js";const o={bg:"#0d1117",surface:"#161b22",card:"#1c2333",border:"rgba(255,255,255,0.08)",borderLight:"rgba(255,255,255,0.14)",text:"#E8EDF5",textSoft:"#9BA8C0",textDim:"#5E6E8A",white:"#FFFFFF",green:"#00d46a",greenBg:"rgba(0,212,106,0.08)",greenBorder:"rgba(0,212,106,0.25)",blue:"#60A5FA",red:"#F87171",redBg:"rgba(248,113,113,0.08)",redBorder:"rgba(248,113,113,0.25)",purple:"#A78BFA",cyan:"#22D3EE",orange:"#FB923C",yellow:"#FBBF24"},l={fontFamily:"'JetBrains Mono','Fira Code','SF Mono',Consolas,monospace"},i={fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"};function d({children:s,color:n=o.blue,subtitle:t}){return e.jsxs("div",{style:{marginBottom:20},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12},children:[e.jsx("div",{style:{width:4,height:28,borderRadius:2,background:n}}),e.jsx("h2",{style:{...i,fontSize:20,fontWeight:800,color:o.white,margin:0},children:s})]}),t&&e.jsx("p",{style:{...i,fontSize:13,color:o.textDim,margin:"6px 0 0 16px"},children:t})]})}function h({children:s,color:n=o.blue}){return e.jsx("span",{style:{...l,fontSize:11,fontWeight:600,color:n,background:`${n}18`,border:`1px solid ${n}40`,borderRadius:5,padding:"2px 7px"},children:s})}function f(){const[s,n]=c.useState(null),t=[{id:"host",label:"Host Application",sublabel:"Claude Code",color:o.blue,desc:"The AI application. Contains the MCP client and manages all server connections.",details:["Manages lifecycle of all MCP server connections","Exposes MCP tools to Claude as additional capabilities","Routes tool calls to appropriate servers","Handles auth, retries, and error recovery"]},{id:"client",label:"MCP Client",sublabel:"Built into Claude Code",color:o.cyan,desc:"One client instance per server. Handles JSON-RPC 2.0 message framing.",details:["One client per server (1:1 relationship)","Speaks JSON-RPC 2.0 over the chosen transport","Discovers server capabilities on connect","Manages tool/resource/prompt schemas"]},{id:"protocol",label:"JSON-RPC 2.0",sublabel:"Over stdio · HTTP · (SSE deprecated)",color:o.yellow,desc:"The wire protocol. Every message is a JSON object with method, params, id.",details:["Request: { jsonrpc:'2.0', id, method, params }","Response: { jsonrpc:'2.0', id, result|error }","Notification: { jsonrpc:'2.0', method, params } (no id, no response)","Bidirectional — server can also call client methods"]},{id:"server",label:"MCP Server",sublabel:"Your code · any language",color:o.green,desc:"Implements the MCP spec. Exposes Tools, Resources, and Prompts.",details:["Any language: TypeScript, Python, C#, Go, Rust, …","Can be a local process (stdio) or remote service (HTTP)","Connects to databases, APIs, file systems, cloud services","Official SDK available: @modelcontextprotocol/sdk, mcp (Python), ModelContextProtocol (.NET)"]}];return e.jsxs("div",{children:[e.jsx(d,{color:o.blue,subtitle:"How Claude Code connects to MCP servers via the JSON-RPC 2.0 protocol",children:"MCP Architecture Overview"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:0,marginBottom:28},children:t.map((r,a)=>e.jsxs("div",{style:{width:"100%",maxWidth:640},children:[e.jsxs("div",{onClick:()=>n(s===r.id?null:r.id),style:{background:s===r.id?`${r.color}18`:o.card,border:`1.5px solid ${s===r.id?r.color+"70":o.border}`,borderRadius:12,padding:"16px 20px",cursor:"pointer",transition:"all 0.15s"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between"},children:[e.jsxs("div",{children:[e.jsx("div",{style:{...i,fontSize:15,fontWeight:800,color:r.color},children:r.label}),e.jsx("div",{style:{...i,fontSize:12,color:o.textDim,marginTop:2},children:r.sublabel})]}),e.jsx("div",{style:{...i,fontSize:12,color:o.textSoft,maxWidth:280,textAlign:"right"},children:r.desc})]}),s===r.id&&e.jsx("div",{style:{marginTop:12,display:"flex",flexWrap:"wrap",gap:8},children:r.details.map((x,g)=>e.jsx("div",{style:{...i,fontSize:11,color:o.textSoft,background:`${r.color}0a`,border:`1px solid ${r.color}20`,borderRadius:6,padding:"4px 10px"},children:x},g))})]}),a<t.length-1&&e.jsx("div",{style:{display:"flex",justifyContent:"center",padding:"4px 0"},children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center"},children:[e.jsx("div",{style:{width:2,height:14,background:o.borderLight}}),e.jsx("div",{style:{fontSize:12,color:o.textDim},children:"▼"})]})})]},r.id))}),e.jsxs("div",{style:{marginTop:8},children:[e.jsx("div",{style:{...i,fontSize:12,color:o.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:12},children:"MCP is supported by these hosts (as of May 2026)"}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:8},children:["Claude Code","Claude Desktop","VS Code (Copilot)","Cursor","Windsurf","GitHub Copilot","Gemini CLI","ChatGPT (beta)","Zed Editor","Continue.dev"].map(r=>e.jsx(h,{color:o.blue,children:r},r))})]})]})}const p=[{name:"Tools",color:o.orange,icon:"⚙️",desc:"Callable functions that Claude can invoke. Defined with a name, description, and JSON Schema input validation. The core primitive — most MCP servers are tool collections.",useCases:["Execute database queries","Call REST APIs","Read/write files","Run shell commands","Trigger webhooks"],example:`// TypeScript MCP server — tool definition
server.tool(
  "query_database",
  "Run a SQL SELECT query (read-only)",
  {
    query: z.string().describe("SQL SELECT statement"),
    limit: z.number().default(100),
  },
  async ({ query, limit }) => {
    const rows = await db.query(query + \` LIMIT \${limit}\`);
    return { content: [{ type: "text", text: JSON.stringify(rows) }] };
  }
);`},{name:"Resources",color:o.purple,icon:"📂",desc:"Data sources with URI patterns. Expose files, database records, or any structured data for Claude to read. Resources are discoverable — Claude can list and read them by URI.",useCases:["Expose log files","Share database schemas","Serve config documents","Provide live metrics dashboards","Stream API responses"],example:`// Resource with URI template
server.resource(
  "log-file",
  new ResourceTemplate("logs://{filename}", { list: undefined }),
  async (uri) => {
    const filename = uri.pathname.slice(1);
    const content = await fs.readFile(\`/var/log/\${filename}\`, "utf-8");
    return {
      contents: [{ uri: uri.href, mimeType: "text/plain", text: content }]
    };
  }
);`},{name:"Prompts",color:o.cyan,icon:"💬",desc:"Reusable prompt templates with parameterised arguments. The server defines a prompt shape; Claude fills in the arguments at runtime. Useful for enforcing consistent task patterns.",useCases:["Standardised code review format","Bug report templates","API documentation generation","Security audit checklists","Commit message generation"],example:`// Prompt template with arguments
server.prompt(
  "code-review",
  "Structured code review with security focus",
  [
    { name: "language", description: "Programming language", required: true },
    { name: "focus", description: "Review focus area", required: false },
  ],
  async ({ language, focus }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: \`Review this \${language} code for \${focus ?? "general quality"}. Check: security, performance, readability, edge cases.\`
      }
    }]
  })
);`}];function b(){const[s,n]=c.useState("Tools"),t=p.find(r=>r.name===s);return e.jsxs("div",{children:[e.jsx(d,{color:o.orange,subtitle:"Three building blocks every MCP server can expose",children:"MCP Primitives"}),e.jsx("div",{style:{display:"flex",gap:10,marginBottom:24},children:p.map(r=>e.jsxs("button",{onClick:()=>n(r.name),style:{...i,fontSize:14,fontWeight:700,cursor:"pointer",padding:"10px 20px",borderRadius:10,background:s===r.name?`${r.color}18`:o.card,border:`1.5px solid ${s===r.name?r.color+"60":o.border}`,color:s===r.name?r.color:o.textSoft,transition:"all 0.15s"},children:[r.icon," ",r.name]},r.name))}),t&&e.jsxs("div",{style:{display:"flex",gap:20,flexWrap:"wrap"},children:[e.jsxs("div",{style:{flex:"1 1 300px"},children:[e.jsxs("div",{style:{background:`${t.color}0a`,border:`1.5px solid ${t.color}40`,borderRadius:12,padding:20,marginBottom:16},children:[e.jsx("div",{style:{...i,fontSize:15,fontWeight:700,color:t.color,marginBottom:10},children:"What it does"}),e.jsx("p",{style:{...i,fontSize:14,color:o.text,lineHeight:1.7,margin:0},children:t.desc})]}),e.jsx("div",{style:{...i,fontSize:12,color:o.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10},children:"Common use cases"}),t.useCases.map((r,a)=>e.jsxs("div",{style:{display:"flex",gap:8,marginBottom:8},children:[e.jsx("div",{style:{width:6,height:6,borderRadius:"50%",background:t.color,marginTop:6,flexShrink:0}}),e.jsx("div",{style:{...i,fontSize:13,color:o.textSoft},children:r})]},a))]}),e.jsxs("div",{style:{flex:"2 1 400px"},children:[e.jsx("div",{style:{...i,fontSize:12,color:o.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:8},children:"TypeScript example"}),e.jsx("pre",{style:{...l,fontSize:12,color:o.text,background:o.surface,border:`1px solid ${o.border}`,borderRadius:8,padding:16,margin:0,overflowX:"auto",lineHeight:1.6},children:t.example})]})]})]})}const m=[{name:"stdio",label:"stdio (Standard I/O)",status:"Recommended",statusColor:o.green,color:o.green,when:"Local process on the same machine as Claude Code",pros:["Zero network config","Secure by default (no open ports)","Simplest setup","Works everywhere"],cons:["Local only — can't share across machines","One server per process"],config:`// .mcp.json — stdio server
{
  "mcpServers": {
    "my-server": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/my-server/index.js"],
      "env": {
        "DB_URL": "\${DATABASE_URL}",
        "API_KEY": "\${MY_API_KEY}"
      }
    }
  }
}`},{name:"http",label:"HTTP (Streamable HTTP)",status:"Current",statusColor:o.blue,color:o.blue,when:"Remote server, shared team server, or cloud-hosted MCP service",pros:["Works across machines and networks","Shareable — one server, many users","Supports authentication headers","Scalable"],cons:["Requires network access","Needs auth configuration","Higher latency than stdio"],config:`// .mcp.json — HTTP server
{
  "mcpServers": {
    "remote-server": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer \${MCP_API_TOKEN}"
      }
    }
  }
}`},{name:"sse",label:"SSE (Server-Sent Events)",status:"Deprecated",statusColor:o.red,color:o.textDim,when:"Legacy — do not use for new implementations",pros:["Was useful for streaming responses"],cons:["Deprecated in MCP spec 1.1","Replaced by HTTP streaming","No new server should implement this"],config:`// .mcp.json — SSE (deprecated — migrate to http)
{
  "mcpServers": {
    "old-server": {
      "type": "sse",
      "url": "https://mcp.example.com/sse"
    }
  }
}`}];function v(){const[s,n]=c.useState("stdio"),t=m.find(r=>r.name===s);return e.jsxs("div",{children:[e.jsx(d,{color:o.cyan,subtitle:"Three transport mechanisms for MCP communication. Use stdio for local, HTTP for remote.",children:"Transport Types"}),e.jsx("div",{style:{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"},children:m.map(r=>e.jsxs("button",{onClick:()=>n(r.name),style:{...i,fontSize:13,fontWeight:700,cursor:"pointer",padding:"10px 18px",borderRadius:10,background:s===r.name?`${r.color}18`:o.card,border:`1.5px solid ${s===r.name?r.color+"60":o.border}`,color:s===r.name?r.color:o.textSoft,transition:"all 0.15s"},children:[r.label,e.jsx("span",{style:{marginLeft:8,...i,fontSize:10,fontWeight:700,color:r.statusColor,background:`${r.statusColor}18`,border:`1px solid ${r.statusColor}40`,borderRadius:4,padding:"1px 5px"},children:r.status})]},r.name))}),t&&e.jsxs("div",{style:{display:"flex",gap:20,flexWrap:"wrap"},children:[e.jsxs("div",{style:{flex:"1 1 260px"},children:[e.jsxs("div",{style:{...i,fontSize:13,color:o.textDim,marginBottom:14},children:[e.jsx("strong",{style:{color:o.textSoft},children:"Best for:"})," ",t.when]}),e.jsxs("div",{style:{marginBottom:16},children:[e.jsx("div",{style:{...i,fontSize:12,color:o.green,fontWeight:700,marginBottom:8},children:"✓ Pros"}),t.pros.map((r,a)=>e.jsxs("div",{style:{...i,fontSize:12,color:o.textSoft,marginBottom:5},children:["• ",r]},a))]}),e.jsxs("div",{children:[e.jsx("div",{style:{...i,fontSize:12,color:o.red,fontWeight:700,marginBottom:8},children:"✗ Cons"}),t.cons.map((r,a)=>e.jsxs("div",{style:{...i,fontSize:12,color:o.textSoft,marginBottom:5},children:["• ",r]},a))]})]}),e.jsxs("div",{style:{flex:"2 1 380px"},children:[e.jsx("div",{style:{...i,fontSize:12,color:o.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:8},children:".mcp.json configuration"}),e.jsx("pre",{style:{...l,fontSize:12,color:o.text,background:o.surface,border:`1px solid ${o.border}`,borderRadius:8,padding:16,margin:0,overflowX:"auto",lineHeight:1.6},children:t.config})]})]})]})}const u=[{scope:"Project",file:".mcp.json",color:o.blue,who:"All project contributors",desc:"Commit to version control. Shared across the whole team.",locked:!1,example:`// .mcp.json (commit to git)
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres"],
      "env": { "DATABASE_URL": "\${DATABASE_URL}" }
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "\${GITHUB_TOKEN}" }
    }
  }
}`},{scope:"User",file:"~/.claude/mcp.json",color:o.purple,who:"Your personal servers (all projects)",desc:"Global personal config. Loaded for every project you open.",locked:!1,example:`// ~/.claude/mcp.json (personal — not committed)
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/home/user"]
    },
    "slack": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-slack"],
      "env": { "SLACK_TOKEN": "\${SLACK_BOT_TOKEN}" }
    }
  }
}`},{scope:"Local",file:".claude/mcp.local.json",color:o.green,who:"Project + machine specific",desc:"Add to .gitignore. Local credentials that shouldn't be committed.",locked:!1,example:`// .claude/mcp.local.json (gitignore this)
{
  "mcpServers": {
    "local-db": {
      "type": "stdio",
      "command": "node",
      "args": ["./scripts/db-server.js"],
      "env": {
        "DB_HOST": "localhost",
        "DB_PORT": "5432",
        "DB_PASS": "\${MY_LOCAL_DB_PASSWORD}"
      }
    }
  }
}`},{scope:"Enterprise",file:"managed-mcp.json",color:o.red,who:"All users in the organisation",desc:"Managed by IT/security. Users cannot override or remove these servers.",locked:!0,example:`// /Library/Application Support/ClaudeCode/managed-mcp.json
// (macOS — set by MDM; users cannot modify)
{
  "mcpServers": {
    "audit-server": {
      "type": "http",
      "url": "https://mcp-audit.corp.example.com/mcp",
      "headers": {
        "Authorization": "Bearer \${CORP_MCP_TOKEN}"
      }
    },
    "jira": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-jira"],
      "env": { "JIRA_URL": "https://corp.atlassian.net" }
    }
  }
}`}];function y(){const[s,n]=c.useState("Project"),t=u.find(r=>r.scope===s);return e.jsxs("div",{children:[e.jsx(d,{color:o.purple,subtitle:"Four configuration levels — from project-wide to enterprise-managed",children:"Configuration Scopes"}),e.jsx("div",{style:{display:"flex",gap:10,marginBottom:24,flexWrap:"wrap"},children:u.map(r=>e.jsxs("button",{onClick:()=>n(r.scope),style:{...i,fontSize:13,fontWeight:700,cursor:"pointer",padding:"10px 18px",borderRadius:10,background:s===r.scope?`${r.color}18`:o.card,border:`1.5px solid ${s===r.scope?r.color+"60":o.border}`,color:s===r.scope?r.color:o.textSoft,transition:"all 0.15s"},children:[r.scope,r.locked&&e.jsx("span",{style:{marginLeft:6,fontSize:12},children:"🔒"})]},r.scope))}),t&&e.jsxs("div",{style:{display:"flex",gap:20,flexWrap:"wrap"},children:[e.jsxs("div",{style:{flex:"1 1 240px"},children:[e.jsxs("div",{style:{background:`${t.color}0a`,border:`1.5px solid ${t.color}40`,borderRadius:10,padding:16,marginBottom:14},children:[e.jsx("div",{style:{...l,fontSize:13,color:t.color,marginBottom:6},children:t.file}),e.jsx("div",{style:{...i,fontSize:12,color:o.textSoft,marginBottom:8},children:t.desc}),e.jsxs("div",{style:{...i,fontSize:12,color:o.textDim},children:[e.jsx("strong",{style:{color:o.textSoft},children:"Who:"})," ",t.who]}),t.locked&&e.jsx("div",{style:{marginTop:10,...i,fontSize:11,color:o.red,background:o.redBg,border:`1px solid ${o.redBorder}`,borderRadius:6,padding:"6px 10px"},children:"🔒 Managed — users cannot override or remove these server definitions"})]}),e.jsxs("div",{style:{...i,fontSize:11,color:o.textDim,background:o.surface,border:`1px solid ${o.border}`,borderRadius:8,padding:12},children:[e.jsx("div",{style:{fontWeight:700,color:o.textSoft,marginBottom:6},children:"Precedence (highest → lowest)"}),["Enterprise (managed-mcp.json)","Project (.mcp.json)","User (~/.claude/mcp.json)","Local (.claude/mcp.local.json)"].map((r,a)=>e.jsxs("div",{style:{display:"flex",gap:8,marginBottom:4,opacity:t.scope===r.split(" ")[0]?1:.5},children:[e.jsxs("span",{style:{color:a===0?o.red:a===1?o.blue:a===2?o.purple:o.green},children:[a+1,"."]}),e.jsx("span",{children:r})]},a))]})]}),e.jsxs("div",{style:{flex:"2 1 380px"},children:[e.jsx("div",{style:{...i,fontSize:12,color:o.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:8},children:"Example configuration"}),e.jsx("pre",{style:{...l,fontSize:12,color:o.text,background:o.surface,border:`1px solid ${o.border}`,borderRadius:8,padding:16,margin:0,overflowX:"auto",lineHeight:1.6},children:t.example})]})]}),e.jsxs("div",{style:{marginTop:28},children:[e.jsx(d,{color:o.green,subtitle:"Install with: npx @modelcontextprotocol/server-<name>",children:"Official MCP Servers"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))",gap:10},children:[{name:"filesystem",desc:"Read/write local files with path restrictions"},{name:"postgres",desc:"Read-only PostgreSQL queries and schema inspection"},{name:"sqlite",desc:"SQLite database read/write with query support"},{name:"github",desc:"Repos, PRs, issues, files — full GitHub API"},{name:"gitlab",desc:"GitLab repositories, MRs, issues"},{name:"google-drive",desc:"List, read, search Google Drive files"},{name:"slack",desc:"Read channels, send messages, search history"},{name:"puppeteer",desc:"Browser automation and web scraping"},{name:"brave-search",desc:"Web and local search via Brave API"},{name:"fetch",desc:"HTTP fetch with Markdown conversion"},{name:"memory",desc:"Knowledge graph-based persistent memory"},{name:"sequentialthinking",desc:"Dynamic multi-step reasoning tool"}].map(r=>e.jsxs("div",{style:{background:o.card,border:`1px solid ${o.border}`,borderRadius:8,padding:"12px 14px"},children:[e.jsxs("div",{style:{...l,fontSize:12,color:o.green,marginBottom:4},children:["server-",r.name]}),e.jsx("div",{style:{...i,fontSize:11,color:o.textSoft},children:r.desc})]},r.name))})]})]})}const S=[{id:"arch",label:"Architecture",color:o.blue},{id:"primitives",label:"Primitives",color:o.orange},{id:"transports",label:"Transports",color:o.cyan},{id:"config",label:"Configuration",color:o.purple}];function T(){const[s,n]=c.useState("arch");return e.jsxs("div",{style:{background:o.bg,borderRadius:16,padding:"28px 24px",fontFamily:i.fontFamily,color:o.text,minHeight:500},children:[e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:24},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{...i,fontSize:24,fontWeight:800,color:o.white,margin:0,letterSpacing:-.5},children:"Model Context Protocol (MCP)"}),e.jsx("p",{style:{...i,fontSize:13,color:o.textDim,margin:"6px 0 0"},children:"Architecture · Primitives · Transports · Configuration · Official Servers · MCP Spec 1.1"})]}),e.jsxs("div",{style:{display:"flex",gap:8},children:[e.jsx("span",{style:{...l,fontSize:11,color:o.green,background:o.greenBg,border:`1px solid ${o.greenBorder}`,borderRadius:5,padding:"2px 7px"},children:"MCP Spec 1.1"}),e.jsx("span",{style:{...l,fontSize:11,color:o.textDim,background:"#ffffff08",border:`1px solid ${o.border}`,borderRadius:5,padding:"2px 7px"},children:"v2.1.126"})]})]}),e.jsx("div",{style:{display:"flex",gap:6,marginBottom:28,borderBottom:`1px solid ${o.border}`,paddingBottom:0},children:S.map(t=>e.jsx("button",{onClick:()=>n(t.id),style:{...i,fontSize:14,fontWeight:600,cursor:"pointer",padding:"10px 18px",borderRadius:"8px 8px 0 0",background:s===t.id?`${t.color}15`:"transparent",border:`1.5px solid ${s===t.id?t.color+"60":"transparent"}`,borderBottom:s===t.id?`2px solid ${t.color}`:"1.5px solid transparent",color:s===t.id?t.color:o.textSoft,transition:"all 0.15s",marginBottom:-1},children:t.label},t.id))}),s==="arch"&&e.jsx(f,{}),s==="primitives"&&e.jsx(b,{}),s==="transports"&&e.jsx(v,{}),s==="config"&&e.jsx(y,{})]})}export{T as default};
