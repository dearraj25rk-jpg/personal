import{j as e}from"./jsx-runtime.u17CrQMm.js";import{r as d}from"./index.DrBtkhmp.js";const n={bg:"#0d1117",panel:"#161b22",border:"#30363d",text:"#e6edf3",muted:"#8b949e",accent:"#ffa657",green:"#39d353",blue:"#58a6ff",purple:"#d2a8ff",red:"#f87171",yellow:"#f0c060",card:"#21262d"},r=[{id:"commands",icon:"/",label:"Commands",path:"commands/*.md",namespace:"/plugin-name:command-name",color:n.blue,description:"Slash commands bundled with the plugin. Same format as project commands — use $ARGUMENTS, @file imports, !shell execution. Automatically namespaced.",invocation:"User types /plugin-name:command-name",security:"Full command capabilities",example:`---
description: Check deployment status
allowed-tools: Bash(kubectl *), Read
---

Check current deployment:
!kubectl get pods -n production

Status for: $ARGUMENTS`,notes:["Namespaced automatically","Same frontmatter as project commands","Appear in /help with plugin prefix"]},{id:"agents",icon:"🤖",label:"Agents",path:"agents/*.md",namespace:"plugin-name:agent-name",color:n.purple,description:"Subagent definitions bundled with the plugin. RESTRICTED: cannot set hooks, mcpServers, or permissionMode (security isolation). All other frontmatter fields supported.",invocation:"Claude auto-delegates or user @-mentions",security:"⚠️ No hooks, mcpServers, or permissionMode allowed",example:`---
name: security-reviewer
description: Reviews code for security vulnerabilities.
  Auto-invoked for security audits and after auth changes.
tools: Read, Glob, Grep
model: sonnet
effort: high
maxTurns: 30
---

You are a security specialist...`,notes:["Security-restricted frontmatter","Invoked as plugin-name:agent-name","Can use skills and memory"]},{id:"skills",icon:"⚡",label:"Skills",path:"skills/*/SKILL.md",namespace:"/plugin-name:skill-name",color:n.green,description:"On-demand capabilities bundled with the plugin. Claude auto-invokes based on description match. Same format as project skills with auto-namespacing.",invocation:"Claude auto-invokes from description OR /plugin-name:skill",security:"Full skill capabilities",example:`---
name: pdf-extract
description: >
  Extract text and data from PDF files.
  Use when asked to read, parse, or analyze PDFs.
allowed-tools: Bash(python3 *), Read
---

Extract content from PDF:
$ARGUMENTS`,notes:["Auto-invocable from description","Supporting files in skill folder","Use ${CLAUDE_PLUGIN_ROOT}/scripts/"]},{id:"output-styles",icon:"🎨",label:"Output Styles",path:"output-styles/*.md",namespace:"Available in /config Output Style menu",color:n.yellow,description:"Custom response format styles that appear in the /config Output Style menu alongside built-in styles (Default, Explanatory, Learning).",invocation:"User selects in /config → Output Style",security:"Modifies Claude's system prompt",example:`---
name: Terse CI Mode
description: Minimal output for CI/CD pipelines
keep-coding-instructions: true
---

Respond with code only.
No explanations, no markdown prose.
Output must be parseable by scripts.`,notes:["Appears in /config menu","keep-coding-instructions: true recommended","Takes effect next new session"]},{id:"monitors",icon:"📡",label:"Monitors",path:"monitors/monitors.json",namespace:"Background process → stdout → Claude notifications",color:n.red,description:"Background processes that run for the session lifetime, delivering every stdout line to Claude as a notification. Requires v2.1.105+. Unsandboxed at hook trust level.",invocation:"Automatic (session start) or on-skill-invoke:skillname",security:"Hook trust level — unsandboxed",example:`[
  {
    "name": "deploy-status",
    "command": "\${CLAUDE_PLUGIN_ROOT}/poll-deploy.sh",
    "description": "Deployment status watcher"
  },
  {
    "name": "error-log",
    "command": "tail -F ./logs/error.log",
    "when": "on-skill-invoke:debug"
  }
]`,notes:["Requires v2.1.105+","when: always OR on-skill-invoke:name","Interactive sessions only","Each stdout line → Claude notification"]},{id:"themes",icon:"🌈",label:"Themes",path:"themes/*.json",namespace:"Available in /theme alongside built-in presets",color:"#79c0ff",description:"Color themes that appear in /theme. Users can press Ctrl+E to copy a plugin theme to ~/.claude/themes/ for personal editing. Base preset + sparse overrides format.",invocation:"User selects in /theme",security:"UI only — no code execution",example:`{
  "name": "Dracula",
  "base": "dark",
  "overrides": {
    "claude": "#bd93f9",
    "error": "#ff5555",
    "success": "#50fa7b",
    "warning": "#ffb86c"
  }
}`,notes:["Ctrl+E to copy for user editing","base: dark | light | system","Persisted as custom:plugin-name:slug"]},{id:"bin",icon:"⚙️",label:"Bin Executables",path:"bin/*",namespace:"Added to Bash tool PATH",color:n.muted,description:"Raw executables and scripts added to the Bash tool's PATH when the plugin is enabled. Invokable as bare commands in shell tool calls.",invocation:"Available as bare commands in Bash tool",security:"Full execution — same as Bash tool",example:`# bin/format-code
#!/bin/bash
# Custom code formatter
set -e
prettier --write "$1"
gofmt -w "$1" 2>/dev/null || true`,notes:["Must be executable (chmod +x)","Available in all Bash tool calls","Use ${CLAUDE_PLUGIN_DATA} for mutable state"]},{id:"hooks",icon:"🔗",label:"Hooks",path:"hooks/hooks.json",namespace:"Event-driven lifecycle hooks",color:n.accent,description:"Event hooks using ${CLAUDE_PLUGIN_ROOT} for paths. Same event types as session hooks: SessionStart, PreToolUse, PostToolUse, Stop, etc.",invocation:"Automatic — fired at lifecycle events",security:"Hook trust level",example:`{
  "PostToolUse": [{
    "matcher": "Edit|Write",
    "hooks": [{
      "type": "command",
      "command": "\${CLAUDE_PLUGIN_ROOT}/bin/lint.sh"
    }]
  }]
}`,notes:["Use ${CLAUDE_PLUGIN_ROOT} for paths","Same events as session hooks","Runs in hook trust level"]},{id:"mcp",icon:"🔌",label:"MCP Servers",path:".mcp.json",namespace:"Auto-started when plugin enabled",color:n.green,description:"MCP server configurations that start automatically when the plugin is enabled. Use ${CLAUDE_PLUGIN_ROOT} for server path and ${CLAUDE_PLUGIN_DATA} for persistent data.",invocation:"Auto-started at session start when plugin enabled",security:"MCP trust level",example:`{
  "mcpServers": {
    "my-db": {
      "type": "stdio",
      "command": "node",
      "args": ["\${CLAUDE_PLUGIN_ROOT}/mcp-server.js"],
      "env": {
        "DB_PATH": "\${CLAUDE_PLUGIN_DATA}/db.sqlite"
      }
    }
  }
}`,notes:["${CLAUDE_PLUGIN_ROOT} for server binary","${CLAUDE_PLUGIN_DATA} for persistent files","Auto-starts with plugin"]},{id:"lsp",icon:"🔤",label:"LSP Servers",path:".lsp.json",namespace:"Language Server Protocol configurations",color:"#79c0ff",description:"Language Server Protocol configurations for code intelligence features. Provides hover docs, go-to-definition, and inline diagnostics within Claude Code's editor integration.",invocation:"Auto-configured based on file type",security:"LSP process trust level",example:`{
  "servers": [{
    "name": "rust-analyzer",
    "command": "\${CLAUDE_PLUGIN_ROOT}/bin/rust-analyzer",
    "languages": ["rust"]
  }]
}`,notes:["Language-aware code intelligence","Auto-configures for matching file types","Uses ${CLAUDE_PLUGIN_ROOT} for binaries"]}],c=[{name:"${CLAUDE_PLUGIN_ROOT}",desc:"Absolute path to plugin installation directory. Changes on plugin update. Do NOT write files here — use CLAUDE_PLUGIN_DATA instead.",safe:!1},{name:"${CLAUDE_PLUGIN_DATA}",desc:"Persistent directory for mutable plugin data: ~/.claude/plugins/data/<plugin-id>/. Survives plugin updates. Use for node_modules, caches, databases, generated files.",safe:!0},{name:"${user_config.KEY}",desc:"User-configured value from userConfig in plugin.json. Available in hook commands, MCP/LSP configs, and skill content. Non-sensitive values from settings.json, sensitive from keychain.",safe:!0},{name:"CLAUDE_PLUGIN_OPTION_KEY",desc:"Same userConfig value exported as environment variable to plugin subprocesses. Uppercase KEY from userConfig.",safe:!0}],p=[{scope:"user",file:"~/.claude/settings.json",desc:"Personal plugins across all projects (default)"},{scope:"project",file:".claude/settings.json",desc:"Team plugins shared via version control"},{scope:"local",file:".claude/settings.local.json",desc:"Per-machine overrides, gitignored"},{scope:"managed",file:"System managed-settings.json",desc:"Org-wide plugins, read-only, highest priority"}];function g(){const[s,a]=d.useState(r[0]),[t,l]=d.useState("components");return e.jsxs("div",{style:{background:n.bg,color:n.text,fontFamily:"'Inter', 'system-ui', sans-serif",minHeight:"600px",borderRadius:"12px",padding:"24px",maxWidth:"1100px",margin:"0 auto"},children:[e.jsxs("div",{style:{marginBottom:"24px"},children:[e.jsx("h2",{style:{margin:0,fontSize:"1.4rem",color:n.accent,fontWeight:700},children:"Claude Code Plugin Architecture"}),e.jsx("p",{style:{margin:"6px 0 0",color:n.muted,fontSize:"0.875rem"},children:"All 10 plugin component types, environment variables, installation scopes · v2.1.126 (May 2026)"})]}),e.jsx("div",{style:{display:"flex",gap:"8px",marginBottom:"20px",flexWrap:"wrap"},children:["components","detail","env-vars","install"].map(o=>e.jsx("button",{onClick:()=>l(o),style:{padding:"6px 16px",borderRadius:"6px",border:"1px solid",borderColor:t===o?n.accent:n.border,background:t===o?"rgba(255,166,87,0.12)":n.card,color:t===o?n.accent:n.muted,cursor:"pointer",fontSize:"0.85rem",fontWeight:500,textTransform:"capitalize"},children:o.replace("-"," ")},o))}),t==="components"&&e.jsxs("div",{children:[e.jsx("p",{style:{color:n.muted,fontSize:"0.85rem",marginBottom:"16px"},children:"Click any component type to see details, path, and example →"}),e.jsx("div",{style:{display:"grid",gap:"8px",gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))"},children:r.map(o=>e.jsxs("div",{onClick:()=>{a(o),l("detail")},style:{background:n.card,border:`1px solid ${s?.id===o.id?o.color:n.border}`,borderRadius:"10px",padding:"14px",cursor:"pointer",transition:"border-color 0.15s"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"},children:[e.jsx("span",{style:{fontSize:"1.2rem"},children:o.icon}),e.jsx("span",{style:{color:o.color,fontWeight:600,fontSize:"0.9rem"},children:o.label})]}),e.jsxs("div",{style:{color:n.muted,fontSize:"0.78rem",marginBottom:"4px",fontFamily:"monospace"},children:["📁 ",o.path]}),e.jsxs("div",{style:{color:n.muted,fontSize:"0.78rem"},children:[o.description.substring(0,80),"…"]})]},o.id))}),e.jsxs("div",{style:{background:n.card,borderRadius:"12px",padding:"20px",marginTop:"20px",border:`1px solid ${n.border}`},children:[e.jsx("h3",{style:{margin:"0 0 12px",color:n.accent,fontSize:"0.95rem"},children:"Complete Plugin Directory Layout"}),e.jsx("pre",{style:{margin:0,fontFamily:"monospace",fontSize:"0.78rem",color:n.text,lineHeight:1.7},children:`my-plugin/
├── .claude-plugin/
│   └── plugin.json            ← Optional manifest (name, version, userConfig, ...)
├── commands/
│   └── status.md              ← /my-plugin:status
├── agents/
│   └── security-reviewer.md   ← my-plugin:security-reviewer
├── skills/
│   └── pdf-processor/
│       ├── SKILL.md           ← /my-plugin:pdf-processor
│       └── scripts/extract.py
├── output-styles/
│   └── terse.md               ← Appears in /config Output Style
├── themes/
│   └── dracula.json           ← Appears in /theme
├── monitors/
│   └── monitors.json          ← Background watchers
├── hooks/
│   └── hooks.json             ← Lifecycle hooks
├── bin/
│   └── format-tool            ← Added to Bash PATH
├── .mcp.json                  ← Auto-started MCP servers
├── .lsp.json                  ← LSP server configs
└── settings.json              ← Plugin default settings`})]})]}),t==="detail"&&s&&e.jsxs("div",{children:[e.jsxs("div",{style:{background:n.card,borderRadius:"12px",padding:"20px",border:`1px solid ${s.color}`},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:"10px",marginBottom:"16px"},children:[e.jsx("span",{style:{fontSize:"1.6rem"},children:s.icon}),e.jsxs("div",{children:[e.jsx("h3",{style:{margin:0,color:s.color,fontSize:"1.1rem"},children:s.label}),e.jsx("code",{style:{color:n.muted,fontSize:"0.8rem",fontFamily:"monospace"},children:s.path})]})]}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(240px, 1fr))",gap:"10px",marginBottom:"16px"},children:[["Namespace / Access",s.namespace],["Invocation",s.invocation],["Security Model",s.security]].map(([o,i])=>e.jsxs("div",{style:{background:n.panel,borderRadius:"8px",padding:"10px",border:`1px solid ${n.border}`},children:[e.jsx("div",{style:{color:n.muted,fontSize:"0.73rem",marginBottom:"4px"},children:o}),e.jsx("div",{style:{color:n.text,fontSize:"0.82rem"},children:i})]},o))}),e.jsx("p",{style:{color:n.text,fontSize:"0.85rem",marginBottom:"14px"},children:s.description}),e.jsxs("div",{style:{background:"#0d1117",borderRadius:"8px",padding:"12px",marginBottom:"12px"},children:[e.jsx("div",{style:{color:n.muted,fontSize:"0.73rem",marginBottom:"6px"},children:"EXAMPLE"}),e.jsx("pre",{style:{margin:0,fontFamily:"monospace",fontSize:"0.78rem",color:n.green,whiteSpace:"pre-wrap"},children:s.example})]}),e.jsxs("div",{children:[e.jsx("div",{style:{color:n.muted,fontSize:"0.73rem",marginBottom:"8px"},children:"KEY NOTES"}),e.jsx("ul",{style:{margin:0,padding:"0 0 0 16px"},children:s.notes.map((o,i)=>e.jsx("li",{style:{color:n.text,fontSize:"0.82rem",marginBottom:"4px"},children:o},i))})]})]}),e.jsx("div",{style:{display:"flex",gap:"6px",marginTop:"12px",flexWrap:"wrap"},children:r.map(o=>e.jsxs("button",{onClick:()=>a(o),style:{padding:"4px 10px",borderRadius:"6px",border:"1px solid",borderColor:s.id===o.id?o.color:n.border,background:"transparent",color:s.id===o.id?o.color:n.muted,cursor:"pointer",fontSize:"0.75rem"},children:[o.icon," ",o.label]},o.id))})]}),t==="env-vars"&&e.jsxs("div",{children:[e.jsxs("div",{style:{background:n.card,borderRadius:"12px",padding:"20px"},children:[e.jsx("h3",{style:{margin:"0 0 16px",color:n.accent,fontSize:"1rem"},children:"Plugin Environment Variables"}),c.map(o=>e.jsxs("div",{style:{borderBottom:`1px solid ${n.border}`,padding:"14px 0",display:"grid",gridTemplateColumns:"280px 1fr",gap:"16px",alignItems:"start"},children:[e.jsxs("div",{children:[e.jsx("code",{style:{color:o.safe?n.green:n.red,fontFamily:"monospace",fontSize:"0.82rem"},children:o.name}),e.jsx("div",{style:{fontSize:"0.7rem",marginTop:"4px",color:o.safe?n.green:n.red},children:o.safe?"✓ Safe to use":"⚠ Read-only — do not write here"})]}),e.jsx("div",{style:{color:n.text,fontSize:"0.82rem"},children:o.desc})]},o.name))]}),e.jsxs("div",{style:{background:n.card,borderRadius:"12px",padding:"20px",marginTop:"16px"},children:[e.jsx("h3",{style:{margin:"0 0 10px",color:n.accent,fontSize:"1rem"},children:"Key Principle"}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px"},children:[e.jsxs("div",{style:{background:"rgba(248,113,113,0.08)",border:`1px solid ${n.red}`,borderRadius:"8px",padding:"14px"},children:[e.jsx("div",{style:{color:n.red,fontWeight:600,marginBottom:"6px"},children:"❌ CLAUDE_PLUGIN_ROOT"}),e.jsx("div",{style:{color:n.muted,fontSize:"0.82rem"},children:"Installation directory — changes on every plugin update. Never write files here. Only use for reading your plugin's own bundled files."})]}),e.jsxs("div",{style:{background:"rgba(57,211,83,0.08)",border:`1px solid ${n.green}`,borderRadius:"8px",padding:"14px"},children:[e.jsx("div",{style:{color:n.green,fontWeight:600,marginBottom:"6px"},children:"✓ CLAUDE_PLUGIN_DATA"}),e.jsx("div",{style:{color:n.muted,fontSize:"0.82rem"},children:"Persistent data directory — survives updates. Use for node_modules, databases, caches, generated files, anything mutable."})]})]})]})]}),t==="install"&&e.jsxs("div",{children:[e.jsxs("div",{style:{background:n.card,borderRadius:"12px",padding:"20px",marginBottom:"16px"},children:[e.jsx("h3",{style:{margin:"0 0 16px",color:n.accent,fontSize:"1rem"},children:"Installation Scopes"}),p.map(o=>e.jsxs("div",{style:{borderBottom:`1px solid ${n.border}`,padding:"12px 0",display:"grid",gridTemplateColumns:"80px 1fr 1fr",gap:"16px",alignItems:"start"},children:[e.jsx("span",{style:{color:n.accent,fontWeight:600,fontSize:"0.88rem",textTransform:"uppercase"},children:o.scope}),e.jsx("code",{style:{color:n.blue,fontFamily:"monospace",fontSize:"0.78rem"},children:o.file}),e.jsx("span",{style:{color:n.muted,fontSize:"0.82rem"},children:o.desc})]},o.scope))]}),e.jsxs("div",{style:{background:n.card,borderRadius:"12px",padding:"20px"},children:[e.jsx("h3",{style:{margin:"0 0 12px",color:n.accent,fontSize:"1rem"},children:"Install Commands"}),e.jsx("pre",{style:{background:"#0d1117",borderRadius:"8px",padding:"14px",margin:0,fontFamily:"monospace",fontSize:"0.82rem",color:n.green,lineHeight:1.8},children:`# Install from npm (user scope by default)
claude plugin install my-plugin

# Install from local path
claude plugin install ./path/to/my-plugin

# Install to project scope (shared via git)
claude plugin install my-plugin --scope project

# Install to local scope (gitignored)
claude plugin install my-plugin --scope local

# List all installed plugins
claude plugin list

# Remove a plugin
claude plugin remove my-plugin

# Install specific version
claude plugin install my-plugin@2.1.0`})]})]}),e.jsx("div",{style:{marginTop:"20px",fontSize:"0.75rem",color:n.muted,textAlign:"center"},children:"Claude Code v2.1.126 · May 2026 · code.claude.com/docs/en/plugins"})]})}export{g as default};
