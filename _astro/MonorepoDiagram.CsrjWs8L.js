import{j as e}from"./jsx-runtime.u17CrQMm.js";import{r as p}from"./index.DrBtkhmp.js";const r={bg:"#0d1117",surface:"#161b22",card:"#1c2333",border:"rgba(255,255,255,0.08)",text:"#E8EDF5",textSoft:"#9BA8C0",textDim:"#5E6E8A",white:"#FFFFFF",green:"#00d46a",greenBg:"rgba(0,212,106,0.08)",greenBorder:"rgba(0,212,106,0.25)",yellow:"#FBBF24",yellowBg:"rgba(251,191,36,0.08)",yellowBorder:"rgba(251,191,36,0.25)",blue:"#60A5FA",blueBg:"rgba(96,165,250,0.08)",blueBorder:"rgba(96,165,250,0.25)",red:"#F87171",redBg:"rgba(248,113,113,0.08)",redBorder:"rgba(248,113,113,0.25)",purple:"#A78BFA",purpleBg:"rgba(167,139,250,0.08)",purpleBorder:"rgba(167,139,250,0.25)",cyan:"#22D3EE",orange:"#FB923C"},a={fontFamily:"'JetBrains Mono','Fira Code','SF Mono',Consolas,monospace"},i={fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"};function h({children:n,color:l=r.blue,subtitle:o}){return e.jsxs("div",{style:{marginBottom:20},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12},children:[e.jsx("div",{style:{width:4,height:28,borderRadius:2,background:l}}),e.jsx("h2",{style:{...i,fontSize:20,fontWeight:800,color:r.white,margin:0},children:n})]}),o&&e.jsx("p",{style:{...i,fontSize:13,color:r.textDim,margin:"6px 0 0 16px"},children:o})]})}function c({children:n,color:l=r.blue}){return e.jsx("span",{style:{...a,fontSize:11,fontWeight:600,color:l,background:`${l}18`,border:`1px solid ${l}40`,borderRadius:5,padding:"2px 7px"},children:n})}function u({label:n,active:l,onClick:o,color:s=r.blue}){return e.jsx("button",{onClick:o,style:{...i,fontSize:13,fontWeight:l?700:500,color:l?s:r.textSoft,background:l?`${s}15`:"transparent",border:`1.5px solid ${l?s:"transparent"}`,borderRadius:8,padding:"7px 16px",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"},children:n})}function g({code:n}){const[l,o]=p.useState(!1),s=()=>{navigator.clipboard?.writeText(n).catch(()=>{}),o(!0),setTimeout(()=>o(!1),1500)};return e.jsxs("div",{style:{position:"relative"},children:[e.jsx("pre",{style:{...a,fontSize:12,lineHeight:1.7,background:"#0a0e14",border:`1px solid ${r.border}`,borderRadius:8,padding:"14px 16px",margin:0,overflow:"auto",color:r.textSoft,whiteSpace:"pre"},children:n}),e.jsx("button",{onClick:s,style:{position:"absolute",top:8,right:8,...i,fontSize:11,fontWeight:600,background:l?r.greenBg:r.card,color:l?r.green:r.textDim,border:`1px solid ${l?r.green:r.border}`,borderRadius:5,padding:"3px 10px",cursor:"pointer"},children:l?"Copied":"Copy"})]})}const f=[{id:"root",path:"CLAUDE.md",label:"Root CLAUDE.md",depth:0,color:r.blue,loadWhen:"Always — loaded at every session start",tokens:"~4,000 tk",purpose:"Shared context for all services: repo layout, coding standards, git conventions, team glossary, CI overview",example:`# Monorepo — Shared Context
## Services
- services/api/     — Express REST API (Node 22, TypeScript)
- services/frontend/ — Next.js 15 app
- services/worker/  — BullMQ background jobs
- packages/shared/  — Shared types and utilities

## Conventions
- PRs must pass all service tests
- Conventional commits enforced via commitlint
- All services use pnpm workspaces`},{id:"api",path:"services/api/CLAUDE.md",label:"API service CLAUDE.md",depth:1,color:r.green,loadWhen:"When cwd is inside services/api/ OR when file is explicitly @-imported",tokens:"~2,200 tk",purpose:"API-specific: Express routes pattern, auth middleware, database schema, migration conventions",example:`# API Service Context
## Stack: Express 5, Prisma ORM, PostgreSQL 16
## Auth: JWT + refresh tokens in httpOnly cookies
## Route pattern: src/routes/<resource>/
  - index.ts (router)
  - handlers.ts (business logic)
  - schema.ts (zod validation)
## DB migrations: pnpm prisma migrate dev`},{id:"frontend",path:"services/frontend/CLAUDE.md",label:"Frontend CLAUDE.md",depth:1,color:r.purple,loadWhen:"When cwd is inside services/frontend/ OR explicitly @-imported",tokens:"~1,800 tk",purpose:"Next.js conventions, component library, state management, i18n setup",example:`# Frontend Service Context
## Stack: Next.js 15 App Router, Tailwind CSS, Zustand
## Components: src/components/ (shadcn/ui base)
## Data fetching: React Query + generated API client
## i18n: next-intl, locales in messages/
## Testing: Playwright for E2E, Vitest for units`},{id:"worker",path:"services/worker/CLAUDE.md",label:"Worker CLAUDE.md",depth:1,color:r.orange,loadWhen:"When cwd is inside services/worker/ OR explicitly @-imported",tokens:"~1,400 tk",purpose:"BullMQ job definitions, Redis config, retry/backoff conventions, job monitoring",example:`# Worker Service Context
## Stack: BullMQ 5, Redis 7, TypeScript
## Job definitions: src/jobs/<name>.job.ts
## Queue names: email-queue, report-queue, sync-queue
## Retry: exponential backoff, max 3 attempts
## Monitoring: Bull Board at /admin/queues (internal only)`},{id:"shared",path:"packages/shared/CLAUDE.md",label:"Shared package CLAUDE.md",depth:1,color:r.cyan,loadWhen:"When cwd is inside packages/shared/ OR explicitly @-imported",tokens:"~900 tk",purpose:"Shared types, utility functions, validation schemas used across all services",example:`# Shared Package Context
## Exports: types/, utils/, schemas/
## Versioning: bump package.json + run pnpm build:shared
## Never import circular dependencies back into services
## Zod schemas are the source of truth for all types`},{id:"api-rules",path:".claude/rules/api-rules.md",label:"api-rules.md",depth:2,color:r.green,loadWhen:"Auto-loaded when active file matches glob: services/api/**",tokens:"~600 tk",purpose:"API-specific lint rules, banned patterns, required security middleware checks",example:`---
description: Rules for API service files
globs: ["services/api/**"]
---
- ALWAYS validate request bodies with Zod before processing
- NEVER return raw Prisma errors to clients
- Use res.locals.user for authenticated user context
- Rate-limit all public endpoints via express-rate-limit
- Log structured JSON via pino, never console.log`},{id:"frontend-rules",path:".claude/rules/frontend-rules.md",label:"frontend-rules.md",depth:2,color:r.purple,loadWhen:"Auto-loaded when active file matches glob: services/frontend/**",tokens:"~500 tk",purpose:"React/Next.js patterns, accessibility requirements, performance rules",example:`---
description: Rules for frontend files
globs: ["services/frontend/**"]
---
- Use Server Components by default; add 'use client' only when needed
- All images must use next/image with explicit width/height
- aria-label required on all interactive elements
- No inline styles — use Tailwind classes only
- Dynamic imports for components >50 KB`},{id:"shared-rules",path:".claude/rules/shared-rules.md",label:"shared-rules.md",depth:2,color:r.cyan,loadWhen:"Auto-loaded when active file matches glob: packages/**",tokens:"~400 tk",purpose:"Shared package purity rules: no side-effects, full tree-shaking, no service-specific imports",example:`---
description: Rules for shared packages
globs: ["packages/**"]
---
- No side-effects in module scope (no console, no fetch)
- Export everything named — no default exports
- All functions must have JSDoc with @param and @returns
- Zero dependencies on service-internal modules
- Every export must have a corresponding unit test`}];function S(){const[n,l]=p.useState("root"),o=f.find(t=>t.id===n),s=t=>{const d=t.depth*24,m=n===t.id;return e.jsxs("div",{onClick:()=>l(t.id),style:{display:"flex",alignItems:"flex-start",gap:10,paddingLeft:d,marginBottom:6,cursor:"pointer"},children:[t.depth>0&&e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:0,flexShrink:0,marginTop:2},children:[Array.from({length:t.depth}).map((z,j)=>e.jsx("div",{style:{width:16,height:1,background:`${t.color}30`}},j)),e.jsx("div",{style:{...a,fontSize:12,color:`${t.color}60`,marginRight:4},children:(t.depth===2,"├─")})]}),e.jsxs("div",{style:{flex:1,background:m?`${t.color}12`:r.card,border:`1.5px solid ${m?t.color+"60":r.border}`,borderRadius:8,padding:"8px 12px",transition:"all 0.15s"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"},children:[e.jsx("code",{style:{...a,fontSize:12,fontWeight:700,color:t.color},children:t.path}),e.jsx(c,{color:t.color,children:t.tokens}),t.depth===0&&e.jsx(c,{color:r.green,children:"Always loaded"}),t.depth===1&&e.jsx(c,{color:r.yellow,children:"Subdir / @-import"}),t.depth===2&&e.jsx(c,{color:r.purple,children:"Glob-scoped"})]}),m&&e.jsx("div",{style:{...i,fontSize:11,color:r.textDim,marginTop:4},children:t.purpose})]})]},t.id)};return e.jsxs("div",{children:[e.jsx(h,{color:r.blue,subtitle:"5-service monorepo CLAUDE.md layout — showing load timing and token costs",children:"CLAUDE.md Hierarchy"}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24},children:[e.jsxs("div",{children:[e.jsx("div",{style:{...i,fontSize:12,color:r.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:12},children:"File Tree — click any node for details"}),e.jsx("div",{style:{background:r.surface,border:`1px solid ${r.border}`,borderRadius:10,padding:"16px 14px"},children:f.map(s)}),e.jsx("div",{style:{marginTop:16,display:"flex",flexDirection:"column",gap:6},children:[{color:r.green,badge:"Always loaded",desc:"Root CLAUDE.md — loaded at init, always in context"},{color:r.yellow,badge:"Subdir / @-import",desc:"Service CLAUDE.md — loaded when cwd matches or @-imported"},{color:r.purple,badge:"Glob-scoped",desc:"Rules files — auto-injected when active file matches glob"}].map(t=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10},children:[e.jsx(c,{color:t.color,children:t.badge}),e.jsx("span",{style:{...i,fontSize:11,color:r.textDim},children:t.desc})]},t.badge))})]}),e.jsx("div",{children:o&&e.jsxs(e.Fragment,{children:[e.jsx("div",{style:{...i,fontSize:12,color:r.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10},children:o.label}),e.jsxs("div",{style:{background:`${o.color}08`,border:`1px solid ${o.color}30`,borderRadius:8,padding:"12px 14px",marginBottom:12},children:[e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8},children:e.jsx(c,{color:o.color,children:o.tokens})}),e.jsx("div",{style:{...i,fontSize:12,fontWeight:700,color:o.color,marginBottom:4},children:"Load trigger:"}),e.jsx("div",{style:{...i,fontSize:12,color:r.textSoft,marginBottom:8},children:o.loadWhen}),e.jsx("div",{style:{...i,fontSize:12,fontWeight:700,color:o.color,marginBottom:4},children:"Purpose:"}),e.jsx("div",{style:{...i,fontSize:12,color:r.textSoft},children:o.purpose})]}),e.jsx("div",{style:{...i,fontSize:12,color:r.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:8},children:"Example content"}),e.jsx(g,{code:o.example})]})})]})]})}const v=[{path:"services/api/src/auth/login.ts",color:r.green,matches:["api-rules.md"],noMatch:["frontend-rules.md","shared-rules.md"],reason:"services/api/** matches — API auth handler",context:["Root CLAUDE.md","services/api/CLAUDE.md",".claude/rules/api-rules.md"]},{path:"services/frontend/src/components/LoginForm.tsx",color:r.purple,matches:["frontend-rules.md"],noMatch:["api-rules.md","shared-rules.md"],reason:"services/frontend/** matches — React component",context:["Root CLAUDE.md","services/frontend/CLAUDE.md",".claude/rules/frontend-rules.md"]},{path:"packages/shared/src/types/user.ts",color:r.cyan,matches:["shared-rules.md"],noMatch:["api-rules.md","frontend-rules.md"],reason:"packages/** matches — shared type definition",context:["Root CLAUDE.md","packages/shared/CLAUDE.md",".claude/rules/shared-rules.md"]},{path:"services/worker/src/jobs/email.job.ts",color:r.orange,matches:[],noMatch:["api-rules.md","frontend-rules.md","shared-rules.md"],reason:"No rules glob matches services/worker/** — only service CLAUDE.md loads",context:["Root CLAUDE.md","services/worker/CLAUDE.md"]},{path:"services/api/src/routes/users/handlers.ts",color:r.green,matches:["api-rules.md"],noMatch:["frontend-rules.md","shared-rules.md"],reason:"services/api/** matches — API route handler",context:["Root CLAUDE.md","services/api/CLAUDE.md",".claude/rules/api-rules.md"]}],y=[{file:"api-rules.md",glob:"services/api/**",color:r.green},{file:"frontend-rules.md",glob:"services/frontend/**",color:r.purple},{file:"shared-rules.md",glob:"packages/**",color:r.cyan}];function k(){const[n,l]=p.useState(0),o=v[n],s=(t,d)=>{const m=d.replace("/**","");return t.startsWith(m)};return e.jsxs("div",{children:[e.jsx(h,{color:r.green,subtitle:"Click a file path to see which rules files load — visualising glob match logic",children:"Path-Scoped Rules Selector"}),e.jsxs("div",{style:{marginBottom:24},children:[e.jsx("div",{style:{...i,fontSize:12,color:r.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10},children:"Rules Files and Their Path Globs"}),e.jsx("div",{style:{display:"flex",gap:10,flexWrap:"wrap"},children:y.map(t=>e.jsxs("div",{style:{background:`${t.color}0a`,border:`1.5px solid ${t.color}30`,borderRadius:8,padding:"10px 14px",flex:"1 1 220px"},children:[e.jsx("code",{style:{...a,fontSize:12,fontWeight:700,color:t.color},children:t.file}),e.jsxs("div",{style:{...i,fontSize:11,color:r.textDim,marginTop:4},children:["Activates for: ",e.jsx("span",{style:{...a,color:r.textSoft},children:t.glob})]})]},t.file))})]}),e.jsxs("div",{style:{marginBottom:20},children:[e.jsx("div",{style:{...i,fontSize:12,color:r.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10},children:"Select a File Path to Simulate"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:6},children:v.map((t,d)=>e.jsxs("button",{onClick:()=>l(d),style:{background:n===d?`${t.color}12`:r.card,border:`1.5px solid ${n===d?t.color:r.border}`,borderRadius:8,padding:"10px 14px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12,transition:"all 0.15s"},children:[e.jsx("code",{style:{...a,fontSize:12,color:n===d?t.color:r.textSoft},children:t.path}),n===d&&e.jsx("div",{style:{marginLeft:"auto",...i,fontSize:11,color:r.textDim},children:t.reason})]},t.path))})]}),o&&e.jsxs("div",{style:{background:`${o.color}08`,border:`1.5px solid ${o.color}40`,borderRadius:12,padding:"20px 24px"},children:[e.jsxs("div",{style:{...i,fontSize:14,fontWeight:700,color:o.color,marginBottom:16},children:["Active context for: ",e.jsx("code",{style:{...a},children:o.path})]}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20},children:[e.jsxs("div",{children:[e.jsx("div",{style:{...i,fontSize:12,color:r.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10},children:"Loaded into context window"}),o.context.map(t=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:6,background:r.greenBg,border:`1px solid ${r.greenBorder}`,borderRadius:6,padding:"7px 10px"},children:[e.jsx("div",{style:{width:6,height:6,borderRadius:"50%",background:r.green,flexShrink:0}}),e.jsx("code",{style:{...a,fontSize:12,color:r.green},children:t})]},t))]}),e.jsxs("div",{children:[e.jsx("div",{style:{...i,fontSize:12,color:r.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10},children:"Glob Match Trace"}),y.map(t=>{const d=s(o.path,t.glob);return e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:6,background:d?`${t.color}10`:r.redBg,border:`1px solid ${d?t.color+"40":r.redBorder}`,borderRadius:6,padding:"8px 12px"},children:[e.jsx("div",{style:{...a,fontSize:10,fontWeight:800,color:d?t.color:r.red,background:d?`${t.color}20`:r.redBg,border:`1px solid ${d?t.color+"40":r.redBorder}`,borderRadius:4,padding:"2px 5px",flexShrink:0},children:d?"MATCH":"SKIP"}),e.jsxs("div",{children:[e.jsx("code",{style:{...a,fontSize:11,color:d?t.color:r.textDim},children:t.file}),e.jsx("div",{style:{...a,fontSize:10,color:r.textDim,marginTop:2},children:t.glob})]})]},t.file)})]})]})]})]})}const w=`// .mcp.json (repo root — shared by all services)
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "description": "GitHub issues, PRs, repos — shared across all services"
    },
    "linear": {
      "type": "http",
      "url": "https://mcp.linear.app/sse",
      "description": "Issue tracking — all teams"
    },
    "monitoring": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@acme/datadog-mcp-server"],
      "env": { "DD_API_KEY": "\${DD_API_KEY}" },
      "description": "Metrics, traces, logs — shared observability"
    }
  }
}`,b={api:{label:"services/api/.mcp.json",color:r.green,servers:["github","linear","monitoring","postgres","redis-cache"],code:`// services/api/.mcp.json (merged with root)
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "\${DATABASE_URL}"
      },
      "description": "API service database — Prisma schema access"
    },
    "redis-cache": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@acme/redis-mcp-server"],
      "env": { "REDIS_URL": "\${REDIS_URL}" },
      "description": "Cache inspection for API session data"
    }
  }
}`},frontend:{label:"services/frontend/.mcp.json",color:r.purple,servers:["github","linear","monitoring","figma","lighthouse"],code:`// services/frontend/.mcp.json (merged with root)
{
  "mcpServers": {
    "figma": {
      "type": "http",
      "url": "https://figma.com/api/mcp",
      "headers": { "X-Figma-Token": "\${FIGMA_TOKEN}" },
      "description": "Figma design tokens and component specs"
    },
    "lighthouse": {
      "type": "stdio",
      "command": "node",
      "args": ["/usr/local/bin/lighthouse-mcp"],
      "description": "Core Web Vitals and performance audits"
    }
  }
}`},worker:{label:"services/worker/.mcp.json",color:r.orange,servers:["github","linear","monitoring","redis-queues","s3"],code:`// services/worker/.mcp.json (merged with root)
{
  "mcpServers": {
    "redis-queues": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@acme/bullmq-mcp-server"],
      "env": { "REDIS_URL": "\${WORKER_REDIS_URL}" },
      "description": "BullMQ queue inspection and job management"
    },
    "s3": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@acme/s3-mcp-server"],
      "env": { "AWS_REGION": "us-east-1" },
      "description": "S3 bucket access for worker output files"
    }
  }
}`}};function C(){const[n,l]=p.useState("api"),o=b[n];return e.jsxs("div",{children:[e.jsx(h,{color:r.cyan,subtitle:"Root .mcp.json shared across all services, merged with per-service configs",children:"Shared MCP Server Architecture"}),e.jsxs("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:28,flexWrap:"wrap"},children:[e.jsxs("div",{style:{background:r.blueBg,border:`1.5px solid ${r.blueBorder}`,borderRadius:10,padding:"14px 20px",textAlign:"center",minWidth:160},children:[e.jsx("div",{style:{...a,fontSize:13,fontWeight:700,color:r.blue,marginBottom:4},children:".mcp.json"}),e.jsx("div",{style:{...i,fontSize:11,color:r.textDim},children:"Repo root"}),e.jsx("div",{style:{marginTop:8,display:"flex",flexDirection:"column",gap:4},children:["github","linear","monitoring"].map(s=>e.jsx("div",{style:{...a,fontSize:10,color:r.blue,background:`${r.blue}15`,borderRadius:4,padding:"2px 6px"},children:s},s))})]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:6},children:e.jsx("div",{style:{...i,fontSize:20,color:r.textDim},children:"+"})}),e.jsxs("div",{style:{background:`${o.color}0a`,border:`1.5px solid ${o.color}40`,borderRadius:10,padding:"14px 20px",textAlign:"center",minWidth:160},children:[e.jsx("div",{style:{...a,fontSize:12,fontWeight:700,color:o.color,marginBottom:4},children:"service/.mcp.json"}),e.jsx("div",{style:{...i,fontSize:11,color:r.textDim},children:n}),e.jsx("div",{style:{marginTop:8,display:"flex",flexDirection:"column",gap:4},children:o.servers.filter(s=>!["github","linear","monitoring"].includes(s)).map(s=>e.jsx("div",{style:{...a,fontSize:10,color:o.color,background:`${o.color}15`,borderRadius:4,padding:"2px 6px"},children:s},s))})]}),e.jsx("div",{style:{...i,fontSize:20,color:r.textDim},children:"="}),e.jsxs("div",{style:{background:r.greenBg,border:`1.5px solid ${r.greenBorder}`,borderRadius:10,padding:"14px 20px",textAlign:"center",minWidth:160},children:[e.jsx("div",{style:{...a,fontSize:12,fontWeight:700,color:r.green,marginBottom:4},children:"Active servers"}),e.jsxs("div",{style:{...i,fontSize:11,color:r.textDim},children:[o.servers.length," total"]}),e.jsx("div",{style:{marginTop:8,display:"flex",flexDirection:"column",gap:4},children:o.servers.map(s=>e.jsx("div",{style:{...a,fontSize:10,color:r.green,background:r.greenBg,borderRadius:4,padding:"2px 6px"},children:s},s))})]})]}),e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:20},children:Object.entries(b).map(([s,t])=>e.jsx(u,{label:t.label,active:n===s,color:t.color,onClick:()=>l(s)},s))}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20},children:[e.jsxs("div",{children:[e.jsx("div",{style:{...i,fontSize:12,color:r.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10},children:"Root .mcp.json (shared)"}),e.jsx(g,{code:w})]}),e.jsxs("div",{children:[e.jsx("div",{style:{...i,fontSize:12,color:r.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10},children:o.label}),e.jsx(g,{code:o.code})]})]}),e.jsx("div",{style:{marginTop:16,background:r.yellowBg,border:`1px solid ${r.yellowBorder}`,borderRadius:8,padding:"10px 14px"},children:e.jsxs("div",{style:{...i,fontSize:12,color:r.textSoft,lineHeight:1.6},children:[e.jsx("span",{style:{color:r.yellow,fontWeight:700},children:"Merge behavior: "}),"Claude Code reads root .mcp.json first, then the nearest ancestor .mcp.json files. Service-level files extend — not replace — the root config. Keys in service files take precedence if the same server name appears in both. All active servers are available as tools during the session."]})})]})}const x=[{id:"api",label:"API Agent",color:r.green,scope:"services/api/",worktree:"git worktree add ../repo-api-agent services/api-feature",claude_md:"services/api/CLAUDE.md",task:"Implement POST /users/:id/avatar endpoint with file upload to S3, update Prisma schema, write migration",tools:["Read","Edit","Bash","Task"],model:"claude-sonnet-4-5"},{id:"frontend",label:"Frontend Agent",color:r.purple,scope:"services/frontend/",worktree:"git worktree add ../repo-frontend-agent services/frontend-feature",claude_md:"services/frontend/CLAUDE.md",task:"Build AvatarUpload React component with drag-and-drop, progress indicator, crop tool, and error states",tools:["Read","Edit","Bash"],model:"claude-sonnet-4-5"},{id:"worker",label:"Worker Agent",color:r.orange,scope:"services/worker/",worktree:"git worktree add ../repo-worker-agent services/worker-feature",claude_md:"services/worker/CLAUDE.md",task:"Create image-processing BullMQ job to resize/compress uploaded avatar images asynchronously",tools:["Read","Edit","Bash"],model:"claude-haiku-4-5"}],A=`# Cross-Service Feature: User Avatar Upload

You are the orchestrator agent for a monorepo with 3 services.
Your task: Implement user avatar upload across all services.

## Service Agents
Spawn parallel Task agents for each service:

1. API Agent (services/api/) — worktree: ../repo-api-agent
   Task: Implement POST /users/:id/avatar endpoint,
         S3 presigned URL generation, Prisma schema update

2. Frontend Agent (services/frontend/) — worktree: ../repo-frontend-agent
   Task: Build AvatarUpload component with drag-drop,
         progress, crop UI

3. Worker Agent (services/worker/) — worktree: ../repo-worker-agent
   Task: Create image-processing BullMQ job

## Coordination
- Wait for API agent before frontend (needs endpoint contract)
- Worker and frontend can run in parallel after API
- Collect results and verify cross-service contract alignment
- Open 3 draft PRs when all agents finish`;function R(){const[n,l]=p.useState("api"),o=x.find(s=>s.id===n);return e.jsxs("div",{children:[e.jsx(h,{color:r.purple,subtitle:"Orchestrator delegates to scoped agents — each with their own worktree and CLAUDE.md",children:"Agent Teams: Cross-Service Feature Development"}),e.jsx("div",{style:{marginBottom:28},children:e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:0},children:[e.jsxs("div",{style:{background:r.purpleBg,border:`1.5px solid ${r.purpleBorder}`,borderRadius:10,padding:"14px 24px",textAlign:"center",width:"60%"},children:[e.jsx("div",{style:{...i,fontSize:13,fontWeight:800,color:r.purple},children:"Orchestrator Agent"}),e.jsx("div",{style:{...a,fontSize:11,color:r.textDim,marginTop:4},children:"claude --model claude-opus-4-5"}),e.jsx("div",{style:{...i,fontSize:11,color:r.textSoft,marginTop:4},children:"Root CLAUDE.md + all service context visible"})]}),e.jsx("div",{style:{display:"flex",gap:80,alignItems:"flex-start"},children:x.map(()=>e.jsx("div",{style:{width:2,height:24,background:r.border}},Math.random()))}),e.jsx("div",{style:{display:"flex",gap:12,flexWrap:"wrap",justifyContent:"center"},children:x.map(s=>e.jsxs("button",{onClick:()=>l(s.id),style:{flex:"1 1 220px",maxWidth:260,background:n===s.id?`${s.color}15`:r.card,border:`1.5px solid ${n===s.id?s.color:r.border}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",textAlign:"left",transition:"all 0.15s"},children:[e.jsx("div",{style:{...i,fontSize:12,fontWeight:800,color:s.color,marginBottom:4},children:s.label}),e.jsxs("div",{style:{...a,fontSize:10,color:r.textDim,marginBottom:6},children:["scope: ",s.scope]}),e.jsx(c,{color:s.color,children:s.model})]},s.id))})]})}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20},children:[o&&e.jsxs("div",{children:[e.jsxs("div",{style:{...i,fontSize:12,color:r.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10},children:[o.label," — Configuration"]}),e.jsxs("div",{style:{background:`${o.color}08`,border:`1px solid ${o.color}30`,borderRadius:10,padding:"16px 18px"},children:[[["Scope",o.scope],["CLAUDE.md",o.claude_md],["Model",o.model],["Tools",o.tools.join(", ")]].map(([s,t])=>e.jsxs("div",{style:{display:"flex",gap:12,marginBottom:10},children:[e.jsx("div",{style:{...i,fontSize:11,fontWeight:700,color:o.color,width:70,flexShrink:0},children:s}),e.jsx("code",{style:{...a,fontSize:11,color:r.textSoft},children:t})]},s)),e.jsxs("div",{style:{marginTop:4},children:[e.jsx("div",{style:{...i,fontSize:11,fontWeight:700,color:o.color,marginBottom:4},children:"Task"}),e.jsx("div",{style:{...i,fontSize:12,color:r.textSoft,lineHeight:1.6},children:o.task})]}),e.jsxs("div",{style:{marginTop:12},children:[e.jsx("div",{style:{...i,fontSize:11,fontWeight:700,color:o.color,marginBottom:6},children:"Worktree setup"}),e.jsx(g,{code:o.worktree})]})]})]}),e.jsxs("div",{children:[e.jsx("div",{style:{...i,fontSize:12,color:r.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:10},children:"Orchestrator System Prompt"}),e.jsx(g,{code:A})]})]}),e.jsx("div",{style:{marginTop:20,display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(250px, 1fr))",gap:10},children:[{color:r.green,label:"Isolated worktrees",desc:"Each agent works in its own git worktree — no file conflicts between parallel agents"},{color:r.blue,label:"Scoped context",desc:"Service CLAUDE.md + path-scoped rules inject automatically when cwd matches service"},{color:r.purple,label:"Model tiering",desc:"Use Opus for orchestrator, Sonnet for complex services, Haiku for simpler workers"},{color:r.orange,label:"Contract-first",desc:"Orchestrator waits for API agent to define endpoint contract before spawning frontend agent"}].map(s=>e.jsxs("div",{style:{background:`${s.color}0a`,border:`1px solid ${s.color}25`,borderRadius:8,padding:"12px 14px"},children:[e.jsx("div",{style:{...i,fontSize:12,fontWeight:700,color:s.color,marginBottom:4},children:s.label}),e.jsx("div",{style:{...i,fontSize:11,color:r.textSoft,lineHeight:1.5},children:s.desc})]},s.label))})]})}const B=`name: Monorepo CI — Claude Code Matrix
on:
  push:
    branches: [main, "feature/**"]
  pull_request:

jobs:
  # Step 1: Detect which services changed
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      api:      \${{ steps.changes.outputs.api }}
      frontend: \${{ steps.changes.outputs.frontend }}
      worker:   \${{ steps.changes.outputs.worker }}
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 2 }
      - uses: dorny/paths-filter@v3
        id: changes
        with:
          filters: |
            api:
              - 'services/api/**'
              - 'packages/shared/**'
            frontend:
              - 'services/frontend/**'
              - 'packages/shared/**'
            worker:
              - 'services/worker/**'
              - 'packages/shared/**'

  # Step 2: Parallel Claude Code review per changed service
  claude-review:
    needs: detect-changes
    if: |
      needs.detect-changes.outputs.api == 'true' ||
      needs.detect-changes.outputs.frontend == 'true' ||
      needs.detect-changes.outputs.worker == 'true'
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        service:
          - name: api
            path: services/api
            changed: \${{ needs.detect-changes.outputs.api }}
            model: claude-haiku-4-5
          - name: frontend
            path: services/frontend
            changed: \${{ needs.detect-changes.outputs.frontend }}
            model: claude-haiku-4-5
          - name: worker
            path: services/worker
            changed: \${{ needs.detect-changes.outputs.worker }}
            model: claude-haiku-4-5
    steps:
      - uses: actions/checkout@v4
        if: matrix.service.changed == 'true'

      - uses: anthropics/claude-code-action@v1
        if: matrix.service.changed == 'true'
        with:
          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
          model: \${{ matrix.service.model }}
          max_turns: "5"
          allowed_tools: "Read,Bash"
          prompt: |
            Review changed files in \${{ matrix.service.path }}.
            Focus on: correctness, security, test coverage gaps.
            Post findings as a concise PR comment.
            Service CLAUDE.md is at \${{ matrix.service.path }}/CLAUDE.md.
          github_token: \${{ secrets.GITHUB_TOKEN }}`,D=[{name:"api",changed:!0,color:r.green,files:4,status:"Running review",findings:["Missing input validation on /upload","No rate limiting on endpoint"]},{name:"frontend",changed:!0,color:r.purple,files:7,status:"Running review",findings:["Component missing aria-label","Large bundle — missing dynamic import"]},{name:"worker",changed:!1,color:r.orange,files:0,status:"Skipped (no changes)",findings:[]}];function T(){const[n,l]=p.useState("workflow");return e.jsxs("div",{children:[e.jsx(h,{color:r.orange,subtitle:"GitHub Actions matrix that runs parallel Claude Code reviews per changed service",children:"CI/CD Matrix Build"}),e.jsxs("div",{style:{marginBottom:24},children:[e.jsx("div",{style:{...i,fontSize:12,color:r.textDim,textTransform:"uppercase",letterSpacing:1,marginBottom:12},children:"Matrix Run Visualization"}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6},children:[e.jsxs("div",{style:{background:r.yellowBg,border:`1px solid ${r.yellowBorder}`,borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"center",gap:12},children:[e.jsx("div",{style:{width:10,height:10,borderRadius:"50%",background:r.yellow}}),e.jsx("code",{style:{...a,fontSize:12,color:r.yellow},children:"detect-changes"}),e.jsx("div",{style:{...i,fontSize:11,color:r.textDim},children:"dorny/paths-filter — outputs: api=true, frontend=true, worker=false"}),e.jsx(c,{color:r.green,children:"Done"})]}),e.jsx("div",{style:{display:"flex",alignItems:"center",gap:4,paddingLeft:20},children:e.jsx("div",{style:{width:2,height:12,background:r.border}})}),e.jsx("div",{style:{display:"flex",gap:12,flexWrap:"wrap"},children:D.map(o=>e.jsxs("div",{style:{flex:"1 1 200px",background:o.changed?`${o.color}0a`:r.surface,border:`1.5px solid ${o.changed?o.color+"40":r.border}`,borderRadius:10,padding:"12px 14px",opacity:o.changed?1:.5},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8,marginBottom:8},children:[e.jsx("div",{style:{width:8,height:8,borderRadius:"50%",background:o.changed?o.color:r.textDim}}),e.jsxs("code",{style:{...a,fontSize:12,fontWeight:700,color:o.changed?o.color:r.textDim},children:["claude-review (",o.name,")"]})]}),e.jsxs("div",{style:{...i,fontSize:11,color:r.textDim,marginBottom:6},children:[o.status," ",o.changed&&`· ${o.files} files`]}),o.findings.length>0&&e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:4},children:o.findings.map((s,t)=>e.jsx("div",{style:{...i,fontSize:10,color:r.yellow,background:r.yellowBg,borderRadius:4,padding:"3px 6px"},children:s},t))}),!o.changed&&e.jsx("div",{style:{...i,fontSize:11,color:r.textDim,fontStyle:"italic"},children:"Skipped via if: condition"})]},o.name))})]})]}),e.jsxs("div",{style:{display:"flex",gap:8,marginBottom:14},children:[e.jsx(u,{label:"Full Workflow YAML",active:n==="workflow",color:r.orange,onClick:()=>l("workflow")}),e.jsx(u,{label:"Cost Tips",active:n==="tips",color:r.cyan,onClick:()=>l("tips")})]}),n==="workflow"&&e.jsx(g,{code:B}),n==="tips"&&e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(260px, 1fr))",gap:12},children:[{color:r.green,label:"Change detection first",desc:"Use dorny/paths-filter to skip services with no changes — avoids paying for unnecessary Claude runs"},{color:r.blue,label:"Haiku for CI reviews",desc:"claude-haiku-4-5 is 10-20x cheaper than Sonnet. Review tasks rarely need deep reasoning — Haiku suffices"},{color:r.purple,label:"max_turns: 5 for reviews",desc:"Read-only review jobs need at most 5 turns. Set a hard cap to prevent runaway cost in CI"},{color:r.orange,label:"allowed_tools: Read,Bash",desc:"CI review jobs don't need Edit/Write. Restricting tools reduces prompt overhead and prevents accidents"},{color:r.yellow,label:"Cache node_modules",desc:"Cache @anthropic-ai/claude-code install between runs with actions/cache — saves 20-30s per job"},{color:r.cyan,label:"Parallel matrix jobs",desc:"fail-fast: false lets passing services complete even if one fails — don't block the merge on unrelated services"}].map(o=>e.jsxs("div",{style:{background:`${o.color}0a`,border:`1.5px solid ${o.color}25`,borderRadius:10,padding:"14px 16px"},children:[e.jsx("div",{style:{...i,fontSize:12,fontWeight:700,color:o.color,marginBottom:6},children:o.label}),e.jsx("div",{style:{...i,fontSize:12,color:r.textSoft,lineHeight:1.5},children:o.desc})]},o.label))})]})}const E=[{id:"hierarchy",label:"CLAUDE.md Hierarchy",color:r.blue},{id:"rules",label:"Path-Scoped Rules",color:r.green},{id:"mcp",label:"Shared MCP Servers",color:r.cyan},{id:"agents",label:"Agent Teams Cross-Service",color:r.purple},{id:"cicd",label:"CI/CD Matrix",color:r.orange}];function $(){const[n,l]=p.useState("hierarchy"),o=()=>{switch(n){case"hierarchy":return e.jsx(S,{});case"rules":return e.jsx(k,{});case"mcp":return e.jsx(C,{});case"agents":return e.jsx(R,{});case"cicd":return e.jsx(T,{});default:return null}};return e.jsxs("div",{style:{background:r.bg,borderRadius:16,padding:"28px 24px",color:r.text,minHeight:500},children:[e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:24},children:[e.jsxs("div",{children:[e.jsx("h1",{style:{...i,fontSize:24,fontWeight:800,color:r.white,margin:0,letterSpacing:-.5},children:"Claude Code Monorepo Patterns"}),e.jsx("p",{style:{...i,fontSize:13,color:r.textDim,margin:"6px 0 0"},children:"CLAUDE.md hierarchy · Path-scoped rules · Shared MCP servers · Agent teams · CI/CD matrix"})]}),e.jsxs("div",{style:{display:"flex",gap:8},children:[e.jsx(c,{color:r.green,children:"v2.1.126"}),e.jsx(c,{color:r.textDim,children:"June 2026"})]})]}),e.jsx("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:28,paddingBottom:16,borderBottom:`1px solid ${r.border}`},children:E.map(s=>e.jsx(u,{label:s.label,active:n===s.id,color:s.color,onClick:()=>l(s.id)},s.id))}),o()]})}export{$ as default};
