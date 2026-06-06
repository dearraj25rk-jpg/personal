import { useState } from "react";

const TABS = [
  { id: "overview", label: "Overview", icon: "⌨" },
  { id: "macos", label: "macOS", icon: "" },
  { id: "linux", label: "Linux/Windows", icon: "🐧" },
  { id: "terminal", label: "Terminal Setup", icon: "⚙" },
  { id: "readline", label: "Readline/Vi", icon: "✏" },
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
        <span style={{fontSize:12,color:"#555",marginRight:10,transition:"transform 0.2s",transform:open?"rotate(90deg)":"rotate(0)",display:"inline-block"}}>▶</span>
        <span style={{fontSize:14,fontWeight:600,color:"#e0e0e0",flex:1}}>{title}</span>
      </div>
      {open && <div style={{padding:"4px 16px 16px",lineHeight:1.75,fontSize:13,color:"#bbb"}}>{children}</div>}
    </div>
  );
};
const KeyBadge = ({ k }) => (
  <kbd style={{display:"inline-block",padding:"2px 7px",borderRadius:4,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.15)",borderBottom:"3px solid rgba(255,255,255,0.1)",fontSize:11,fontFamily:"monospace",color:"#e0e0e0",margin:"0 2px",whiteSpace:"nowrap"}}>{k}</kbd>
);

function OverviewTab() {
  const categories = [
    { name: "Session Control", color: "#ef4444", keys: ["Ctrl+C","Ctrl+D","Ctrl+L"], desc: "Interrupt, exit, clear" },
    { name: "Line Editing", color: "#f59e0b", keys: ["Ctrl+A","Ctrl+E","Ctrl+W","Ctrl+U"], desc: "Navigate & delete" },
    { name: "History", color: "#3b82f6", keys: ["↑↓","Ctrl+R"], desc: "Browse & search" },
    { name: "Completion", color: "#00e6b4", keys: ["Tab","Escape"], desc: "Autocomplete & cancel" },
    { name: "Multi-line", color: "#a78bfa", keys: ["Shift+Enter","Ctrl+Enter"], desc: "New line & submit" },
  ];
  const heatmap = [
    { key:"Tab",       freq:"★★★★★", color:"#00e6b4" },
    { key:"Ctrl+C",    freq:"★★★★★", color:"#ef4444" },
    { key:"↑ (history)",freq:"★★★★☆",color:"#f59e0b" },
    { key:"Ctrl+R",    freq:"★★★★☆", color:"#3b82f6" },
    { key:"Ctrl+L",    freq:"★★★☆☆", color:"#f59e0b" },
    { key:"Ctrl+A/E",  freq:"★★★☆☆", color:"#a78bfa" },
    { key:"Ctrl+D",    freq:"★★☆☆☆", color:"#ef4444" },
    { key:"Ctrl+W",    freq:"★★☆☆☆", color:"#888" },
    { key:"Shift+Enter",freq:"★★☆☆☆",color:"#a78bfa" },
    { key:"Ctrl+Enter",freq:"★★☆☆☆", color:"#a78bfa" },
  ];
  return (<>
    <div style={{marginBottom:18}}>
      <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12}}>Key Categories</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
        {categories.map(cat => (
          <div key={cat.name} style={{flex:"1 1 160px",background:"rgba(255,255,255,0.03)",border:`1px solid ${cat.color}33`,borderRadius:8,padding:"12px 14px"}}>
            <div style={{fontSize:11,fontWeight:700,color:cat.color,marginBottom:8,textTransform:"uppercase",letterSpacing:0.5}}>{cat.name}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>{cat.keys.map(k=><KeyBadge key={k} k={k}/>)}</div>
            <div style={{fontSize:11,color:"#666"}}>{cat.desc}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{marginBottom:18}}>
      <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:12}}>Usage Frequency Heat Map</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {heatmap.map(h => (
          <div key={h.key} style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:120,flexShrink:0}}><KeyBadge k={h.key}/></div>
            <div style={{fontSize:13,color:h.color,fontFamily:"monospace",letterSpacing:2}}>{h.freq}</div>
          </div>
        ))}
      </div>
    </div>
    <Callout type="tip">Run <Code>/terminal-setup</Code> after installing Claude Code to configure your terminal for optimal multi-line input, scroll sensitivity, and clipboard integration.</Callout>
    <CodeBlock title="Quick reference — most-used shortcuts" code={`Ctrl+C   Interrupt current operation (session stays alive)
Ctrl+D   Exit session (prompts if unsaved work)
Ctrl+L   Clear terminal display (keep session context)
Escape   Cancel current line input
Tab      Autocomplete slash commands and file paths
↑ / ↓    Navigate command history
Ctrl+R   Reverse-search history (type to filter)
Ctrl+A   Jump to start of line
Ctrl+E   Jump to end of line`}/>
  </>);
}

function MacOSTab() {
  return (<>
    <Callout type="info">All shortcuts apply to Claude Code CLI running in any macOS terminal (Terminal.app, iTerm2, Warp, Ghostty). Some require terminal-level bindings — see Terminal Setup tab.</Callout>
    <Section title="Session Control" defaultOpen>
      <Table headers={["Shortcut","Action","Notes"]} rows={[
        [<KeyBadge k="Ctrl+C"/>,"Interrupt current operation","Session stays alive; safe to use mid-generation"],
        [<KeyBadge k="Ctrl+D"/>,"Exit session","Prompts if conversation has unsaved work"],
        [<KeyBadge k="Ctrl+L"/>,"Clear terminal display","Keeps full session context and conversation history"],
        [<KeyBadge k="Ctrl+Z"/>,"Suspend process","fg to resume; avoid — use Ctrl+C instead"],
      ]}/>
    </Section>
    <Section title="Line Editing" defaultOpen>
      <Table headers={["Shortcut","Action","Notes"]} rows={[
        [<KeyBadge k="Ctrl+A"/>,"Jump to start of line","Readline default"],
        [<KeyBadge k="Ctrl+E"/>,"Jump to end of line","Readline default"],
        [<KeyBadge k="Ctrl+W"/>,"Delete word backward","Deletes back to last space or delimiter"],
        [<KeyBadge k="Ctrl+U"/>,"Clear line before cursor","Cuts to clipboard in some terminals"],
        [<KeyBadge k="Ctrl+K"/>,"Delete to end of line","Readline kill-line"],
        [<KeyBadge k="Ctrl+Y"/>,"Paste killed text","Yank from readline kill ring"],
        [<KeyBadge k="Alt+B"/>,"Move word backward","May need Option key as Meta in iTerm2"],
        [<KeyBadge k="Alt+F"/>,"Move word forward","May need Option key as Meta in iTerm2"],
        [<KeyBadge k="Alt+D"/>,"Delete word forward","Readline kill-word"],
        [<KeyBadge k="Escape"/>,"Cancel current line","Clears input without executing"],
      ]}/>
    </Section>
    <Section title="History Navigation">
      <Table headers={["Shortcut","Action","Notes"]} rows={[
        [<KeyBadge k="↑"/>,"Previous command","Scrolls backward through history"],
        [<KeyBadge k="↓"/>,"Next command","Scrolls forward through history"],
        [<KeyBadge k="Ctrl+R"/>,"Reverse-search history","Type to filter; Ctrl+R again for older match"],
        [<KeyBadge k="Ctrl+S"/>,"Forward-search history","May conflict with terminal flow control (stty -ixon to fix)"],
        [<KeyBadge k="Ctrl+P"/>,"Previous (vi-style)","Same as ↑ in readline emacs mode"],
        [<KeyBadge k="Ctrl+N"/>,"Next (vi-style)","Same as ↓ in readline emacs mode"],
      ]}/>
    </Section>
    <Section title="Completion">
      <Table headers={["Shortcut","Action","Notes"]} rows={[
        [<KeyBadge k="Tab"/>,"Autocomplete","Completes slash commands, file paths, model names"],
        [<KeyBadge k="Tab Tab"/>,"List completions","Shows all available completions"],
      ]}/>
    </Section>
    <Section title="Multi-line Input">
      <Table headers={["Shortcut","Action","Notes"]} rows={[
        [<KeyBadge k="Shift+Enter"/>,"Insert newline (iTerm2)","Requires terminal-level binding — see Terminal Setup"],
        [<KeyBadge k="Ctrl+Enter"/>,"Submit multi-line input","Sends the full multi-line message"],
        [<KeyBadge k="Backslash+Enter"/>,"Line continuation","Shell-style continuation — works in all terminals"],
      ]}/>
      <Callout type="warn">Shift+Enter for multi-line requires configuring your terminal to send the correct escape sequence. See Terminal Setup tab for iTerm2 instructions.</Callout>
    </Section>
  </>);
}

function LinuxTab() {
  return (<>
    <Callout type="info">Linux, WSL2, and Windows Terminal shortcuts are nearly identical to macOS. Key differences: Meta/Alt behavior, clipboard integration, and multi-line input setup differ by terminal emulator.</Callout>
    <Section title="Core Shortcuts (identical across platforms)" defaultOpen>
      <Table headers={["Shortcut","Action","macOS","Linux/WSL","Windows Terminal"]} rows={[
        [<KeyBadge k="Ctrl+C"/>,"Interrupt","✓","✓","✓"],
        [<KeyBadge k="Ctrl+D"/>,"Exit","✓","✓","✓"],
        [<KeyBadge k="Ctrl+L"/>,"Clear screen","✓","✓","✓"],
        [<KeyBadge k="Ctrl+A"/>,"Start of line","✓","✓","✓"],
        [<KeyBadge k="Ctrl+E"/>,"End of line","✓","✓","✓"],
        [<KeyBadge k="Ctrl+R"/>,"History search","✓","✓","✓"],
        [<KeyBadge k="Tab"/>,"Autocomplete","✓","✓","✓"],
      ]}/>
    </Section>
    <Section title="Platform Differences" defaultOpen>
      <Table headers={["Shortcut","macOS","Linux","WSL2","Windows Terminal"]} rows={[
        [<KeyBadge k="Alt+B/F"/>,"Option+B/F (configure in terminal)","Alt+B/F native","Alt+B/F native","Alt+B/F native"],
        [<KeyBadge k="Shift+Enter"/>,"iTerm2: configure binding","GNOME Terminal: works","Windows Terminal: works natively","Works natively"],
        ["Clipboard paste","Cmd+V","Ctrl+Shift+V or middle-click","Ctrl+Shift+V","Ctrl+V or Ctrl+Shift+V"],
        ["Clipboard copy","Cmd+C (terminal)","Ctrl+Shift+C","Ctrl+Shift+C","Ctrl+C (no text selected)"],
        ["Meta key","Option (configure as Esc+)","Alt native","Alt native","Alt native"],
        [<KeyBadge k="Ctrl+S"/>,"Flow control off by default","stty -ixon needed","stty -ixon needed","Not applicable"],
      ]}/>
    </Section>
    <Section title="WSL2 Specific Tips">
      <CodeBlock title="~/.bashrc or ~/.zshrc additions for WSL2" code={`# Disable flow control to enable Ctrl+S for history search
stty -ixon

# Enable Meta/Alt key for readline word navigation
bind '"\e[1;5C": forward-word'   # Ctrl+Right
bind '"\e[1;5D": backward-word'  # Ctrl+Left

# Enable Shift+Enter for multi-line (Windows Terminal sends \\e[13;2u)
bind '"\e[13;2u": "\\n"'`}/>
    </Section>
    <Section title="Windows Terminal (native, no WSL)">
      <Callout type="info">Claude Code on native Windows requires Node.js or the native binary. Most readline shortcuts work via the Windows Console API in Windows Terminal.</Callout>
      <Table headers={["Shortcut","Action","Notes"]} rows={[
        [<KeyBadge k="Ctrl+C"/>,"Interrupt","Works as expected"],
        [<KeyBadge k="Ctrl+L"/>,"Clear screen","cls equivalent"],
        [<KeyBadge k="Alt+B/F"/>,"Word navigation","Native in Windows Terminal"],
        [<KeyBadge k="Ctrl+Enter"/>,"Submit multi-line","Works in Windows Terminal"],
      ]}/>
    </Section>
  </>);
}

function TerminalSetupTab() {
  return (<>
    <Section title="/terminal-setup command" defaultOpen>
      <p>Run <Code>/terminal-setup</Code> inside a Claude Code session to get guided terminal configuration. It detects your terminal emulator and shell, then outputs exact setup steps.</p>
      <CodeBlock title="What /terminal-setup configures" code={`1. Shift+Enter → multi-line newline insertion
2. Scroll sensitivity (200 lines recommended)
3. Clipboard integration (pbcopy/xclip/xsel)
4. Option/Alt as Meta key (macOS iTerm2)
5. Font with powerline glyphs (optional)
6. Color scheme compatibility check`}/>
    </Section>
    <Section title="iTerm2: Shift+Enter Multi-line Binding" defaultOpen>
      <p>iTerm2 does not send Shift+Enter by default. Configure it manually:</p>
      <CodeBlock title="iTerm2 Key Binding Setup" code={`1. Open iTerm2 → Preferences → Profiles → Keys
2. Click [+] to add new key binding
3. Keyboard Shortcut: Shift+Return
4. Action: Send Escape Sequence
5. Escape Sequence: [13;2u

Alternatively, use Send Text with value: \\n (literal newline)

Verify: In Claude Code, press Shift+Enter
→ cursor should move to next line without submitting`}/>
      <Callout type="tip">The escape sequence <Code>\e[13;2u</Code> is the "CSI u" (kitty keyboard protocol) encoding of Shift+Enter. Modern terminals like Kitty, Ghostty, and WezTerm support this natively.</Callout>
    </Section>
    <Section title="Scroll Sensitivity">
      <Table headers={["Terminal","Setting","Recommended Value"]} rows={[
        ["iTerm2","Preferences → Pointer → Scroll wheel sends arrow keys when in alternate screen","Disabled for Claude Code"],
        ["iTerm2","Preferences → Advanced → Scroll Speed","3-5x for faster history browsing"],
        ["Terminal.app","Preferences → Window → Scrollback Buffer","10,000 lines"],
        ["Windows Terminal","settings.json → scrollbackBufferSize","10000"],
        ["GNOME Terminal","Preferences → Scrolling → Scrollback lines","Unlimited"],
      ]}/>
    </Section>
    <Section title="Clipboard Integration">
      <CodeBlock title="Shell aliases for clipboard in Claude Code workflows" code={`# macOS (built-in)
alias copy='pbcopy'
alias paste='pbpaste'

# Linux (install xclip)
alias copy='xclip -selection clipboard'
alias paste='xclip -selection clipboard -o'

# WSL2
alias copy='clip.exe'
alias paste='powershell.exe -command Get-Clipboard'

# Usage with Claude Code output:
# claude -p 'explain this code' < file.py | copy`}/>
    </Section>
    <Section title="Kitty / Ghostty / WezTerm (modern terminals)">
      <p>These terminals implement the <strong style={{color:"#fff"}}>kitty keyboard protocol</strong> (CSI u) natively, which means Shift+Enter, Ctrl+Enter, and other modified keys work out of the box with Claude Code.</p>
      <Table headers={["Terminal","Shift+Enter","Ctrl+Enter","Alt as Meta"]} rows={[
        ["Kitty","Native","Native","Native"],
        ["Ghostty","Native","Native","Native"],
        ["WezTerm","Native","Native","Configure: send_composed_key_when_left_alt_is_pressed = false"],
        ["iTerm2","Configure binding","Configure binding","Configure: Option key as +Esc"],
        ["Terminal.app","Not supported","Not supported","Use Esc+B/F instead"],
      ]}/>
    </Section>
  </>);
}

function ReadlineViTab() {
  return (<>
    <Section title="Readline Modes" defaultOpen>
      <p>Claude Code's input uses readline (or a readline-compatible library). Two editing modes are available:</p>
      <Table headers={["Mode","Default?","Activate","Style"]} rows={[
        ["Emacs mode","Yes","set -o emacs or bind -m emacs","Ctrl+A/E, Ctrl+R, Ctrl+W — standard shortcuts"],
        ["Vi mode","No","set -o vi or bind -m vi","Normal/insert modes; j/k for history"],
      ]}/>
    </Section>
    <Section title="Vi Mode Reference" defaultOpen>
      <Callout type="info">Enable vi mode: add <Code>set -o vi</Code> to your <Code>~/.bashrc</Code> or <Code>~/.zshrc</Code>. Press Escape to enter normal mode from insert mode.</Callout>
      <Table headers={["Key (Normal Mode)","Action"]} rows={[
        ["Escape","Switch to normal mode from insert"],
        ["i","Switch to insert mode"],
        ["a","Insert after cursor"],
        ["A","Insert at end of line"],
        ["0 / $","Start / end of line"],
        ["b / w","Word backward / forward"],
        ["dw","Delete word"],
        ["dd","Delete entire line"],
        ["k / j","Previous / next history entry"],
        ["/","Search history (vi-style)"],
        ["u","Undo last change"],
      ]}/>
    </Section>
    <Section title="Custom Keybindings via ~/.claude/keybindings.json">
      <p>Claude Code supports custom keybindings via <Code>~/.claude/keybindings.json</Code>. This lets you remap shortcuts, add chord bindings, and define macros.</p>
      <CodeBlock title="~/.claude/keybindings.json example" code={`{
  "keybindings": [
    {
      "key": "ctrl+shift+c",
      "command": "/clear",
      "description": "Clear conversation"
    },
    {
      "key": "ctrl+shift+r",
      "command": "/resume",
      "description": "Resume last session"
    },
    {
      "key": "alt+enter",
      "command": "insert_newline",
      "description": "Insert newline (multi-line input)"
    },
    {
      "key": "ctrl+shift+u",
      "command": "/usage",
      "description": "Show token usage"
    }
  ]
}`}/>
      <Callout type="tip">Use the <Code>/keybindings</Code> command inside Claude Code to view current bindings and detect conflicts. Run <Code>/keybindings reset</Code> to restore defaults.</Callout>
    </Section>
    <Section title="Readline Configuration (~/.inputrc)">
      <CodeBlock title="~/.inputrc — global readline settings" code={`# Case-insensitive completion
set completion-ignore-case on

# Show completion candidates immediately
set show-all-if-ambiguous on

# Single Tab to list (no double-tap needed)
set show-all-if-unmodified on

# Colored completion for file types
set colored-stats on

# History search with Up/Down (match current prefix)
"\\e[A": history-search-backward
"\\e[B": history-search-forward

# Ctrl+Left/Right word navigation
"\\e[1;5C": forward-word
"\\e[1;5D": backward-word`}/>
    </Section>
  </>);
}

export default function KeyboardShortcutsDiagram() {
  const [tab, setTab] = useState("overview");
  const content = {
    overview: <OverviewTab/>,
    macos: <MacOSTab/>,
    linux: <LinuxTab/>,
    terminal: <TerminalSetupTab/>,
    readline: <ReadlineViTab/>,
  };
  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:"#09090f",color:"#e0e0e0",minHeight:"100vh"}}>
      <div style={{borderBottom:"1px solid rgba(255,255,255,0.06)",padding:"20px 16px 0",background:"linear-gradient(180deg,rgba(0,230,180,0.03) 0%,transparent 100%)"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
            <span style={{fontSize:19,fontWeight:700,color:"#fff",letterSpacing:-0.5}}>Keyboard Shortcuts</span>
            <span style={{fontSize:11,padding:"3px 8px",background:"rgba(0,230,180,0.12)",color:"#00e6b4",borderRadius:4,fontWeight:600}}>Terminal Integration</span>
          </div>
          <div style={{fontSize:11,color:"#666",marginBottom:14}}>Claude Code CLI · All platforms · v2.1+</div>
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
