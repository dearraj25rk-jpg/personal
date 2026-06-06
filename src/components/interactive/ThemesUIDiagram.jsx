import { useState } from "react";

const TABS = [
  { id: "builtin", label: "Built-in Themes", icon: "🎨" },
  { id: "command", label: "/theme Command", icon: "/" },
  { id: "custom", label: "Custom Themes", icon: "✏" },
  { id: "team", label: "Team Distribution", icon: "👥" },
  { id: "auto", label: "Auto Dark/Light", icon: "◑" },
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

const themes = [
  { name:"dark",          type:"dark",  bg:"#0d1117", fg:"#e6edf3", accent:"#58a6ff", comment:"#8b949e", string:"#a5d6ff", keyword:"#ff7b72", builtin:true },
  { name:"light",         type:"light", bg:"#ffffff", fg:"#24292f", accent:"#0969da", comment:"#6e7781", string:"#0a3069", keyword:"#cf222e", builtin:true },
  { name:"solarized-dark",type:"dark",  bg:"#002b36", fg:"#839496", accent:"#268bd2", comment:"#586e75", string:"#2aa198", keyword:"#dc322f", builtin:true },
  { name:"solarized-light",type:"light",bg:"#fdf6e3", fg:"#657b83", accent:"#268bd2", comment:"#93a1a1", string:"#2aa198", keyword:"#dc322f", builtin:true },
  { name:"monokai",       type:"dark",  bg:"#272822", fg:"#f8f8f2", accent:"#a6e22e", comment:"#75715e", string:"#e6db74", keyword:"#f92672", builtin:true },
  { name:"dracula",       type:"dark",  bg:"#282a36", fg:"#f8f8f2", accent:"#bd93f9", comment:"#6272a4", string:"#f1fa8c", keyword:"#ff79c6", builtin:true },
  { name:"github-dark",   type:"dark",  bg:"#0d1117", fg:"#c9d1d9", accent:"#58a6ff", comment:"#8b949e", string:"#79c0ff", keyword:"#d2a8ff", builtin:true },
  { name:"github-light",  type:"light", bg:"#ffffff", fg:"#24292e", accent:"#0366d6", comment:"#6a737d", string:"#032f62", keyword:"#d73a49", builtin:true },
];

function BuiltinTab() {
  const [selected, setSelected] = useState("dark");
  const theme = themes.find(t => t.name === selected);
  return (<>
    <div style={{marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12}}>Theme Gallery</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
        {themes.map(t=>(
          <div key={t.name} onClick={()=>setSelected(t.name)}
            style={{cursor:"pointer",flex:"1 1 180px",minWidth:150,padding:"12px 14px",borderRadius:8,background:t.bg,border:`2px solid ${selected===t.name?t.accent:"transparent"}`,transition:"border-color 0.2s"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <span style={{fontSize:11,fontWeight:700,color:t.fg,fontFamily:"monospace"}}>{t.name}</span>
              <span style={{fontSize:9,padding:"2px 5px",borderRadius:3,background:t.type==="dark"?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)",color:t.fg,opacity:0.7}}>{t.type}</span>
            </div>
            <div style={{display:"flex",gap:4}}>
              {[t.bg,t.fg,t.accent,t.keyword,t.string,t.comment].map((col,i)=>(
                <div key={i} style={{width:16,height:16,borderRadius:3,background:col,border:`1px solid ${t.type==="dark"?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"}`}}/>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
    {theme && (
      <div style={{marginBottom:16,padding:"14px 16px",borderRadius:8,background:theme.bg,border:`1px solid ${theme.accent}44`}}>
        <div style={{fontSize:12,fontWeight:700,color:theme.fg,marginBottom:8,fontFamily:"monospace"}}>{theme.name} — Preview</div>
        <div style={{fontFamily:"monospace",fontSize:12,lineHeight:1.8}}>
          <span style={{color:theme.comment}}># Claude Code session</span><br/>
          <span style={{color:theme.keyword}}>def</span> <span style={{color:theme.accent}}>greet</span><span style={{color:theme.fg}}>(name):</span><br/>
          <span style={{color:theme.fg}}>    </span><span style={{color:theme.keyword}}>return</span> <span style={{color:theme.string}}>f"Hello, </span><span style={{color:theme.accent}}>{'{name}'}</span><span style={{color:theme.string}}>!"</span><br/>
        </div>
      </div>
    )}
    <Section title="Theme Color Roles">
      <Table headers={["Role","Used For","Example (dark)"]} rows={[
        ["background","Terminal / UI background","#0d1117"],
        ["foreground","Default text color","#e6edf3"],
        ["accent","Highlighted items, links, active state","#58a6ff"],
        ["comment","Code comments, muted text","#8b949e"],
        ["string","String literals in code blocks","#a5d6ff"],
        ["keyword","Language keywords, commands","#ff7b72"],
        ["error","Error messages, warnings","#f85149"],
        ["success","Successful operations, confirmations","#3fb950"],
      ]}/>
    </Section>
  </>);
}

function ThemeCommandTab() {
  return (<>
    <Section title="/theme Command Walkthrough" defaultOpen>
      <CodeBlock code={`> /theme

┌─────────────────────────────────────────┐
│  Select a theme                          │
│                                          │
│  > dark            ● current             │
│    light                                 │
│    solarized-dark                        │
│    solarized-light                       │
│    monokai                               │
│    dracula                               │
│    github-dark                           │
│    github-light                          │
│    ── Custom Themes ──                   │
│    my-team-theme                         │
│                                          │
│  [↑↓ navigate]  [Enter select]           │
│  [preview updates live as you navigate]  │
└─────────────────────────────────────────┘`}/>
    </Section>
    <Section title="Session Persistence via CLAUDE_THEME" defaultOpen>
      <p>The <Code>/theme</Code> command sets the theme for the current session. To persist across sessions, set the <Code>CLAUDE_THEME</Code> environment variable:</p>
      <CodeBlock title="Persistent theme configuration" code={`# In ~/.bashrc or ~/.zshrc
export CLAUDE_THEME=dracula

# Or per-project in .env / project settings:
export CLAUDE_THEME=github-dark

# For auto-switching based on system preference:
export CLAUDE_THEME=auto

# Precedence:
# CLAUDE_THEME env var  > /theme command > default (dark)`}/>
    </Section>
    <Section title="Theme in settings.json">
      <CodeBlock title="~/.claude/settings.json" code={`{
  "theme": "monokai",
  "env": {
    "CLAUDE_THEME": "monokai"
  }
}`}/>
      <Callout type="tip">Setting both <Code>theme</Code> and <Code>CLAUDE_THEME</Code> is redundant — prefer the <Code>theme</Code> key in settings.json for the cleanest configuration.</Callout>
    </Section>
  </>);
}

function CustomThemeTab() {
  return (<>
    <Section title="Creating a Custom Theme" defaultOpen>
      <p>Custom themes live in <Code>~/.claude/themes/&lt;name&gt;.md</Code>. The filename (without <Code>.md</Code>) becomes the theme ID used in <Code>/theme</Code> and <Code>CLAUDE_THEME</Code>.</p>
      <CodeBlock title="~/.claude/themes/my-theme.md — Full Schema" code={`---
name: My Custom Theme
description: A warm dark theme inspired by old paper terminals
type: dark
author: your-name
version: 1.0.0
colors:
  # Core UI
  background: "#1a1510"
  foreground: "#e8dcc8"
  accent: "#d4a843"
  accent_muted: "#8a6e2a"

  # Surface layers
  surface_0: "#1a1510"
  surface_1: "#231e18"
  surface_2: "#2d261f"
  border: "#3d3428"

  # Text hierarchy
  text_primary: "#e8dcc8"
  text_secondary: "#b5a98a"
  text_muted: "#7a6e58"

  # Semantic colors
  success: "#7cb87c"
  warning: "#d4a843"
  error: "#c05a5a"
  info: "#6a9fc0"

  # Syntax highlighting
  syntax_comment: "#6b5f4a"
  syntax_keyword: "#c05a5a"
  syntax_string: "#7cb87c"
  syntax_number: "#d4a843"
  syntax_function: "#6a9fc0"
  syntax_variable: "#e8dcc8"
  syntax_operator: "#b5a98a"
---

# My Custom Theme

Optional markdown description of the theme.
This text appears in the theme picker preview.`}/>
    </Section>
    <Section title="Required vs Optional Fields">
      <Table headers={["Field","Required?","Default"]} rows={[
        ["name","Yes","filename"],
        ["type (dark/light)","Yes","dark"],
        ["colors.background","Yes","—"],
        ["colors.foreground","Yes","—"],
        ["colors.accent","Yes","—"],
        ["colors.error","No","#ef4444"],
        ["colors.success","No","#22c55e"],
        ["colors.syntax_*","No","Derived from type"],
        ["description","No",""],
        ["author","No",""],
        ["version","No","1.0.0"],
      ]}/>
    </Section>
    <Section title="Testing Your Theme">
      <CodeBlock code={`# Apply immediately without restarting:
/theme my-theme

# Or restart with theme:
CLAUDE_THEME=my-theme claude

# Validate theme file (syntax check):
claude --validate-theme ~/.claude/themes/my-theme.md`}/>
    </Section>
  </>);
}

function TeamTab() {
  return (<>
    <Section title="Distributing Themes via Project CLAUDE.md" defaultOpen>
      <CodeBlock title="Project CLAUDE.md" code={`---
theme: team-dark
---

# Team Theme Configuration

This project uses our team dark theme. The theme file is at
.claude/themes/team-dark.md in this repository.

To apply: run /theme team-dark or set CLAUDE_THEME=team-dark`}/>
      <Callout type="tip">Put the theme file in the repo under <Code>.claude/themes/</Code> — Claude Code automatically picks up themes from project-local <Code>.claude/themes/</Code> in addition to <Code>~/.claude/themes/</Code>.</Callout>
    </Section>
    <Section title="Distributing via Plugins" defaultOpen>
      <CodeBlock title="Plugin-bundled theme" code={`# Plugin directory structure:
my-company-plugin/
├── package.json
├── index.js
└── themes/
    ├── company-dark.md
    └── company-light.md

# package.json
{
  "name": "@mycompany/claude-plugin",
  "version": "1.0.0",
  "claudePlugin": {
    "themes": ["themes/company-dark.md", "themes/company-light.md"]
  }
}

# Install:
npm install -g @mycompany/claude-plugin
# Themes are now available as: company-dark, company-light`}/>
    </Section>
    <Section title="Shared .claude/output-styles">
      <p>For teams sharing output formatting preferences (not just colors), use <Code>.claude/output-styles/</Code>:</p>
      <CodeBlock title=".claude/output-styles/team-default.md" code={`---
name: team-default
apply: always
---

# Team Output Style

- Always use markdown code blocks with language identifiers
- Use tables for structured data comparisons
- Limit line length to 100 characters
- Prefer numbered lists for sequential steps`}/>
    </Section>
    <Section title="Onboarding Checklist">
      <Table headers={["Step","Command"]} rows={[
        ["1. Clone repo","git clone <repo>"],
        ["2. Apply team theme","/theme team-dark"],
        ["3. Persist theme","export CLAUDE_THEME=team-dark"],
        ["4. Verify","/theme (should show team-dark as active)"],
      ]}/>
    </Section>
  </>);
}

function AutoTab() {
  return (<>
    <Section title="CLAUDE_THEME=auto" defaultOpen>
      <p>Setting <Code>CLAUDE_THEME=auto</Code> enables system preference detection. Claude Code queries the terminal's <strong style={{color:"#fff"}}>OSC 11</strong> escape sequence to detect background brightness, then selects the appropriate built-in theme.</p>
      <CodeBlock code={`# Detection flow:
export CLAUDE_THEME=auto

# Claude Code queries terminal:
1. Send OSC 11 query ("what is your background color?")
2. Terminal responds with RGB background color
3. Compute luminance from RGB
4. luminance > 0.5 → apply 'light' theme
   luminance ≤ 0.5 → apply 'dark' theme
5. Re-query when session focus changes (if terminal supports it)`}/>
    </Section>
    <Section title="Terminal Support Matrix" defaultOpen>
      <Table headers={["Terminal","OSC 11 Support","Auto-switch on focus?"]} rows={[
        ["iTerm2","Yes","Yes (with Focus Reporting)"],
        ["Kitty","Yes","Yes"],
        ["Ghostty","Yes","Yes"],
        ["WezTerm","Yes","Yes"],
        ["Terminal.app","Yes","No (static detection)"],
        ["GNOME Terminal","Partial","No"],
        ["Windows Terminal","Yes","No"],
        ["VS Code terminal","Yes","Yes (theme-linked)"],
      ]}/>
    </Section>
    <Section title="Custom Auto-switch Themes">
      <p>Specify custom dark and light themes for auto-switching:</p>
      <CodeBlock title="~/.claude/settings.json" code={`{
  "theme": "auto",
  "themeAuto": {
    "dark": "my-custom-dark",
    "light": "my-custom-light"
  }
}`}/>
      <Callout type="tip">If OSC 11 is not supported by your terminal, set <Code>CLAUDE_THEME_TYPE=dark</Code> or <Code>CLAUDE_THEME_TYPE=light</Code> to force the type without changing the theme name.</Callout>
    </Section>
    <Section title="macOS Dark Mode Integration">
      <CodeBlock title="~/.zshrc — auto-update CLAUDE_THEME on macOS dark mode change" code={`# Watch for macOS dark mode changes
function update_claude_theme() {
  if [[ "$(defaults read -g AppleInterfaceStyle 2>/dev/null)" == "Dark" ]]; then
    export CLAUDE_THEME=github-dark
  else
    export CLAUDE_THEME=github-light
  fi
}

# Run on shell start
update_claude_theme

# Or use CLAUDE_THEME=auto for automatic detection`}/>
    </Section>
  </>);
}

export default function ThemesUIDiagram() {
  const [tab, setTab] = useState("builtin");
  const content = { builtin:<BuiltinTab/>, command:<ThemeCommandTab/>, custom:<CustomThemeTab/>, team:<TeamTab/>, auto:<AutoTab/> };
  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:"#09090f",color:"#e0e0e0",minHeight:"100vh"}}>
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"20px 16px 0",background:"linear-gradient(180deg,rgba(167,139,250,0.03) 0%,transparent 100%)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontSize:19,fontWeight:700,color:"#fff",letterSpacing:-0.5}}>Themes & UI</span>
            <span style={{fontSize:11,padding:"3px 8px",background:"rgba(167,139,250,0.12)",color:"#a78bfa",borderRadius:4,fontWeight:600}}>Customization</span>
          </div>
          <div style={{fontSize:11,color:"#666",marginBottom:14}}>Claude Code CLI · All built-in themes + custom · June 2026</div>
          <div style={{display:"flex",gap:2,overflowX:"auto"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 11px",fontSize:11,fontFamily:"inherit",fontWeight:tab===t.id?700:400,background:tab===t.id?"rgba(255,255,255,0.06)":"transparent",color:tab===t.id?"#fff":"#777",border:"none",borderBottom:tab===t.id?"2px solid #a78bfa":"2px solid transparent",cursor:"pointer",whiteSpace:"nowrap",borderRadius:"6px 6px 0 0"}}>
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
