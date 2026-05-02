import React, { useState } from "react";

// Color palette
const COLORS = {
  enterprise: { bg: "#DC2626", light: "rgba(220,38,38,0.12)", border: "#EF4444", text: "#fca5a5" },
  project: { bg: "#2563EB", light: "rgba(37,99,235,0.12)", border: "#3B82F6", text: "#93c5fd" },
  user: { bg: "#7C3AED", light: "rgba(124,58,237,0.12)", border: "#8B5CF6", text: "#c4b5fd" },
  local: { bg: "#059669", light: "rgba(5,150,105,0.12)", border: "#10B981", text: "#6ee7b7" },
  auto: { bg: "#D97706", light: "rgba(217,119,6,0.12)", border: "#F59E0B", text: "#fcd34d" },
  plugin: { bg: "#EC4899", light: "rgba(236,72,153,0.12)", border: "#F472B6", text: "#f9a8d4" },
  system: { bg: "#475569", light: "rgba(71,85,105,0.12)", border: "#94A3B8", text: "#cbd5e1" },
};

// ───────────────────── SECTION 1: MASTER PRECEDENCE PYRAMID ─────────────────────
function PrecedencePyramid() {
  const [hoveredLevel, setHoveredLevel] = useState(null);
  
  const levels = [
    {
      id: "enterprise",
      label: "ENTERPRISE / MANAGED",
      priority: "Priority 1 (HIGHEST)",
      color: COLORS.enterprise,
      width: "40%",
      files: ["managed-settings.json", "managed-mcp.json", "Enterprise CLAUDE.md"],
      description: "Deployed by IT/DevOps via MDM. Cannot be overridden by any lower level. If enterprise says 'deny rm -rf', no one can allow it.",
      analogy: "Think of this as company law — like a government rule that every citizen must follow.",
      overrides: "Overrides EVERYTHING below it",
      overriddenBy: "Nothing — this is the absolute top"
    },
    {
      id: "cli",
      label: "CLI ARGUMENTS",
      priority: "Priority 2",
      color: { bg: "#0F172A", light: "rgba(51,65,85,0.12)", border: "#334155", text: "#cbd5e1" },
      width: "50%",
      files: ["--model", "--dangerously-skip-permissions", "--append-system-prompt", "--agents"],
      description: "Temporary, session-only overrides passed when launching Claude Code. Gone when the session ends.",
      analogy: "Like a temporary override pass — valid only for this one visit.",
      overrides: "Overrides Local, Project, and User settings",
      overriddenBy: "Enterprise/Managed settings"
    },
    {
      id: "local",
      label: "LOCAL PROJECT",
      priority: "Priority 3",
      color: COLORS.local,
      width: "60%",
      files: [".claude/settings.local.json", "CLAUDE.local.md"],
      description: "Your personal overrides for THIS project only. Auto-gitignored — never shared with your team.",
      analogy: "Like sticky notes on YOUR monitor — only you see them, only for this workspace.",
      overrides: "Overrides Shared Project and User settings",
      overriddenBy: "Enterprise and CLI args"
    },
    {
      id: "project",
      label: "SHARED PROJECT",
      priority: "Priority 4",
      color: COLORS.project,
      width: "72%",
      files: [".claude/settings.json", "./CLAUDE.md", ".claude/rules/*.md", ".claude/agents/*.md", ".claude/skills/*/SKILL.md", ".claude/commands/*.md", ".claude/output-styles/*.md", ".mcp.json", ".claude/MEMORY.md"],
      description: "Team-wide settings committed to version control. Everyone on the team gets the same rules. Includes auto-generated MEMORY.md (v2.1.59) where Claude records discovered project facts.",
      analogy: "Like the team handbook — everyone follows the same standards.",
      overrides: "Overrides User settings",
      overriddenBy: "Enterprise, CLI, and Local settings"
    },
    {
      id: "user",
      label: "USER (PERSONAL)",
      priority: "Priority 5 (LOWEST)",
      color: COLORS.user,
      width: "85%",
      files: ["~/.claude/settings.json", "~/.claude/CLAUDE.md", "~/.claude/rules/*.md", "~/.claude/agents/*.md", "~/.claude/skills/*/SKILL.md", "~/.claude/commands/*.md", "~/.claude/output-styles/*.md", "~/.claude.json"],
      description: "Your personal defaults that apply to ALL projects. The baseline that everything builds on.",
      analogy: "Like your personal preferences — how you like to work, regardless of which project.",
      overrides: "This is the foundation — defaults for everything",
      overriddenBy: "Everything above it"
    },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-center mb-2" style={{ color: "#e0e0e0" }}>
        🏔️ The Precedence Pyramid — Who Overrides Whom?
      </h2>
      <p className="text-center text-sm text-gray-500 mb-4">
        Higher position = higher priority. Click any level for details.
      </p>
      
      <div className="flex flex-col items-center gap-1">
        {levels.map((level) => (
          <div
            key={level.id}
            className="cursor-pointer transition-all duration-200 rounded-lg"
            style={{
              width: level.width,
              backgroundColor: hoveredLevel === level.id ? level.color.light : level.color.bg,
              color: hoveredLevel === level.id ? level.color.text : "white",
              border: `2px solid ${level.color.border}`,
              padding: "8px 14px",
              transform: hoveredLevel === level.id ? "scale(1.02)" : "scale(1)",
            }}
            onClick={() => setHoveredLevel(hoveredLevel === level.id ? null : level.id)}
            onMouseEnter={() => setHoveredLevel(level.id)}
            onMouseLeave={() => setHoveredLevel(null)}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">{level.label}</span>
              <span className="text-xs opacity-80">{level.priority}</span>
            </div>
          </div>
        ))}
      </div>
      
      {hoveredLevel && (() => {
        const level = levels.find(l => l.id === hoveredLevel);
        return (
          <div className="mt-4 p-4 rounded-lg border-2" style={{ borderColor: level.color.border, backgroundColor: level.color.light }}>
            <h3 className="font-bold text-base mb-1" style={{ color: level.color.text }}>
              {level.label} — {level.priority}
            </h3>
            <p className="text-sm text-gray-700 mb-2">{level.description}</p>
            <p className="text-sm italic text-gray-600 mb-2">💡 {level.analogy}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2 rounded border">
                <span className="font-bold text-green-700">✅ Overrides:</span>
                <p className="text-gray-700">{level.overrides}</p>
              </div>
              <div className="bg-white p-2 rounded border">
                <span className="font-bold text-red-700">❌ Overridden by:</span>
                <p className="text-gray-700">{level.overriddenBy}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xs font-bold text-gray-600">Files at this level:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {level.files.map((f, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-white rounded border" style={{ borderColor: level.color.border }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// ───────────────────── SECTION 2: MARKDOWN FILE CARDS ─────────────────────
function MarkdownFileCard({ file, isExpanded, onToggle }) {
  return (
    <div 
      className="border-2 rounded-lg mb-3 overflow-hidden transition-all cursor-pointer"
      style={{ borderColor: file.color.border, backgroundColor: isExpanded ? file.color.light : "transparent" }}
      onClick={onToggle}
    >
      <div className="flex items-center justify-between p-3" style={{ backgroundColor: file.color.bg }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{file.icon}</span>
          <span className="font-bold text-white text-sm">{file.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-white" style={{ color: file.color.text }}>
            {file.loadBehavior}
          </span>
          <span className="text-white text-xs">{isExpanded ? "▲" : "▼"}</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 text-sm space-y-3">
          <div>
            <span className="font-bold text-gray-800">📍 Location:</span>
            <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">{file.location}</code>
          </div>
          
          <div>
            <span className="font-bold text-gray-800">🎯 Purpose:</span>
            <p className="text-gray-700 mt-1">{file.purpose}</p>
          </div>
          
          <div>
            <span className="font-bold text-gray-800">🔄 When it loads:</span>
            <p className="text-gray-700 mt-1">{file.whenLoads}</p>
          </div>
          
          <div>
            <span className="font-bold text-gray-800">🏆 Priority:</span>
            <p className="text-gray-700 mt-1">{file.priority}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 p-2 rounded border border-green-200">
              <span className="font-bold text-green-700 text-xs">✅ Wins against:</span>
              <p className="text-xs text-gray-700 mt-1">{file.winsAgainst}</p>
            </div>
            <div className="bg-red-50 p-2 rounded border border-red-200">
              <span className="font-bold text-red-700 text-xs">❌ Loses to:</span>
              <p className="text-xs text-gray-700 mt-1">{file.losesTo}</p>
            </div>
          </div>
          
          <div>
            <span className="font-bold text-gray-800">👥 Shared with team?</span>
            <span className="ml-2 text-gray-700">{file.shared}</span>
          </div>
          
          <div>
            <span className="font-bold text-gray-800">💰 Token cost:</span>
            <span className="ml-2 text-gray-700">{file.tokenCost}</span>
          </div>
          
          {file.example && (
            <div>
              <span className="font-bold text-gray-800">📝 Example content:</span>
              <pre className="mt-1 bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                {file.example}
              </pre>
            </div>
          )}
          
          {file.specialNotes && (
            <div className="bg-yellow-50 p-2 rounded border border-yellow-300">
              <span className="font-bold text-yellow-800 text-xs">⚠️ Important:</span>
              <p className="text-xs text-gray-700 mt-1">{file.specialNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ───────────────────── SECTION 3: CONFLICT SCENARIOS ─────────────────────
function ConflictScenarios() {
  const scenarios = [
    {
      title: "User says '2-space indent' but Project says '4-space indent'",
      userFile: "~/.claude/CLAUDE.md",
      projectFile: "./CLAUDE.md",
      winner: "Project wins — 4-space indent",
      reason: "Project-level is more specific than user-level. The project rule overrides.",
      color: COLORS.project,
    },
    {
      title: "Project allows 'npm run *' but Enterprise denies it",
      userFile: ".claude/settings.json → allow",
      projectFile: "managed-settings.json → deny",
      winner: "Enterprise wins — command is BLOCKED",
      reason: "Enterprise/Managed has highest priority. Deny rules from managed settings can never be overridden.",
      color: COLORS.enterprise,
    },
    {
      title: "Project denies 'curl *' but your Local settings allow it",
      userFile: ".claude/settings.json → deny",
      projectFile: ".claude/settings.local.json → allow",
      winner: "Local wins — curl is ALLOWED (for you only)",
      reason: "Local project (priority 3) beats shared project (priority 4). But ONLY for you — teammates still get the deny.",
      color: COLORS.local,
    },
    {
      title: "User skill 'deploy' vs Project skill 'deploy'",
      userFile: "~/.claude/skills/deploy/SKILL.md",
      projectFile: ".claude/skills/deploy/SKILL.md",
      winner: "Project skill wins — overrides by name",
      reason: "Skills override by name: managed > CLI > project > user > plugin. Same-name project skill replaces user skill.",
      color: COLORS.project,
    },
    {
      title: "CLAUDE.md says 'use TypeScript' but Output Style says 'write Python only'",
      userFile: "./CLAUDE.md (adds to user message)",
      projectFile: "output-styles/python.md (replaces system prompt)",
      winner: "Both apply but output style is MORE POWERFUL",
      reason: "Output styles replace the system prompt. CLAUDE.md adds context as user message. Both load, but system prompt instructions carry more weight.",
      color: { bg: "#0F172A", light: "rgba(51,65,85,0.12)", border: "#334155", text: "#cbd5e1" },
    },
    {
      title: "Deny at ANY level vs Allow at ANY level (permissions)",
      userFile: "Any settings.json → allow: ['Bash(rm *)']",
      projectFile: "Any settings.json → deny: ['Bash(rm *)']",
      winner: "DENY always wins — regardless of which level",
      reason: "Special rule: For permissions, deny is evaluated FIRST. A deny at any tier cannot be overridden by an allow at any tier. This is a safety mechanism.",
      color: COLORS.enterprise,
    },
  ];

  const [expandedIdx, setExpandedIdx] = useState(null);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-2" style={{ color: "#e0e0e0" }}>
        ⚔️ Real Conflict Scenarios — Who Wins?
      </h2>
      <p className="text-sm text-gray-500 mb-3">Click each scenario to see the detailed resolution.</p>
      
      {scenarios.map((s, i) => (
        <div
          key={i}
          className="border rounded-lg mb-2 cursor-pointer overflow-hidden transition-all"
          style={{ borderColor: expandedIdx === i ? s.color.border : "#30363d" }}
          onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
        >
          <div className="flex items-center justify-between p-3 bg-gray-50">
            <span className="font-medium text-sm text-gray-800">❓ {s.title}</span>
            <span className="text-xs text-gray-400">{expandedIdx === i ? "▲" : "▼"}</span>
          </div>
          
          {expandedIdx === i && (
            <div className="p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-100 p-2 rounded">
                  <span className="font-bold text-gray-600">File A:</span>
                  <p className="text-gray-700">{s.userFile}</p>
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  <span className="font-bold text-gray-600">File B:</span>
                  <p className="text-gray-700">{s.projectFile}</p>
                </div>
              </div>
              <div className="p-2 rounded-lg" style={{ backgroundColor: s.color.light, border: `2px solid ${s.color.border}` }}>
                <span className="font-bold text-sm" style={{ color: s.color.text }}>🏆 {s.winner}</span>
                <p className="text-xs text-gray-700 mt-1">{s.reason}</p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ───────────────────── SECTION 4: LOADING TIMELINE ─────────────────────
function LoadingTimeline() {
  const phases = [
    {
      phase: "Phase 1: Session Start",
      label: "Always loaded (permanent token cost)",
      color: "#059669",
      items: [
        "Enterprise CLAUDE.md",
        "~/.claude/CLAUDE.md (User)",
        "./CLAUDE.md (Project)",
        "./CLAUDE.local.md (Local)",
        "Parent directory CLAUDE.md files",
        "@imported files from all CLAUDE.md",
        "All global rules (.claude/rules/*.md without paths: frontmatter)",
        "~/.claude/rules/*.md (user rules)",
        "MEMORY.md (first 200 lines)",
        "All skill/agent/command frontmatter (names + descriptions only)",
      ],
    },
    {
      phase: "Phase 2: On-Demand",
      label: "Loaded when Claude enters relevant area",
      color: "#D97706",
      items: [
        "Path-scoped rules (when matching files are touched)",
        "Subtree/child CLAUDE.md (when Claude reads files in that directory)",
        "Skill full body (when Claude decides to use it or user invokes /skill)",
        "MEMORY.md topic files (when Claude reads them)",
      ],
    },
    {
      phase: "Phase 3: User-Invoked",
      label: "Loaded only when you explicitly trigger",
      color: "#7C3AED",
      items: [
        "Slash commands (/command-name)",
        "Sub-agents (via delegation or explicit call)",
        "Skills (via /skill-name or auto-invocation)",
        "Output styles (via /output-style command)",
      ],
    },
    {
      phase: "Phase 4: Auto-Generated",
      label: "Claude writes these — not you",
      color: "#EC4899",
      items: [
        "MEMORY.md + topic files (~/.claude/projects/<project>/memory/)",
        "Sub-agent MEMORY.md (persistent across invocations)",
      ],
    },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-2" style={{ color: "#e0e0e0" }}>
        ⏱️ When Does Each File Load?
      </h2>
      <p className="text-sm text-gray-500 mb-3">Files load at different times — earlier = more token cost.</p>
      
      <div className="space-y-3">
        {phases.map((p, i) => (
          <div key={i} className="rounded-lg border-2 overflow-hidden" style={{ borderColor: p.color }}>
            <div className="px-3 py-2 text-white font-bold text-sm flex justify-between" style={{ backgroundColor: p.color }}>
              <span>{p.phase}</span>
              <span className="text-xs opacity-80">{p.label}</span>
            </div>
            <div className="p-3 grid grid-cols-2 gap-1">
              {p.items.map((item, j) => (
                <div key={j} className="text-xs text-gray-700 flex items-start gap-1">
                  <span style={{ color: p.color }}>●</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────── SECTION 5: SETTINGS.JSON HIERARCHY ─────────────────────
function SettingsHierarchy() {
  const tiers = [
    { tier: 1, name: "Managed", file: "managed-settings.json", loc: "macOS: /Library/Application Support/ClaudeCode/  |  Linux: /etc/claude-code/  |  Windows: C:\\ProgramData\\ClaudeCode\\", desc: "IT-deployed, cannot be overridden. Also: server-managed settings from Anthropic for Enterprise.", color: COLORS.enterprise },
    { tier: 2, name: "CLI Args", file: "command line flags", loc: "claude --model opus --dangerously-skip-permissions", desc: "Session-only. Overrides everything except Managed.", color: { bg: "#0F172A", light: "rgba(51,65,85,0.12)", border: "#334155", text: "#cbd5e1" } },
    { tier: 3, name: "Local Project", file: ".claude/settings.local.json", loc: ".claude/settings.local.json (auto-gitignored)", desc: "Your personal project overrides. Not shared with team.", color: COLORS.local },
    { tier: 4, name: "Shared Project", file: ".claude/settings.json", loc: ".claude/settings.json (version-controlled)", desc: "Team settings. Everyone gets same config.", color: COLORS.project },
    { tier: 5, name: "User", file: "~/.claude/settings.json", loc: "~/.claude/settings.json", desc: "Your personal global defaults for all projects.", color: COLORS.user },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-2" style={{ color: "#e0e0e0" }}>
        ⚙️ Settings.json — 5-Tier Hierarchy
      </h2>
      <p className="text-sm text-gray-500 mb-3">Settings MERGE across tiers. Higher tier wins on conflicts. Special rule: DENY always wins.</p>
      
      <div className="space-y-2">
        {tiers.map((t) => (
          <div key={t.tier} className="flex items-stretch gap-2 rounded-lg border-2 overflow-hidden" style={{ borderColor: t.color.border }}>
            <div className="flex items-center justify-center px-3 text-white font-bold text-lg" style={{ backgroundColor: t.color.bg, minWidth: "42px" }}>
              {t.tier}
            </div>
            <div className="flex-1 p-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: t.color.text }}>{t.name}</span>
                <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{t.file}</code>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">{t.desc}</p>
              <p className="text-xs text-gray-400 mt-0.5 italic">{t.loc}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
        <p className="text-sm font-bold text-red-800">🚨 Critical Rule for Permissions</p>
        <p className="text-xs text-red-700 mt-1">
          DENY rules always win regardless of tier. If <strong>any</strong> settings file at <strong>any</strong> level says <code>deny: ["Bash(rm -rf *)"]</code>, 
          no allow rule at any other level can override it. Evaluation order: deny first → ask second → allow last.
        </p>
      </div>
    </div>
  );
}

// ───────────────────── SECTION 6: COMPLETE DIRECTORY MAP ─────────────────────
function DirectoryMap() {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-2" style={{ color: "#e0e0e0" }}>
        📁 Complete Directory Map — Every File Claude Code Reads
      </h2>
      
      <div className="grid grid-cols-2 gap-3">
        {/* User-level */}
        <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: COLORS.user.border }}>
          <div className="px-3 py-2 text-white font-bold text-sm" style={{ backgroundColor: COLORS.user.bg }}>
            👤 User Level (~/.claude/)
          </div>
          <pre className="p-3 text-xs text-gray-700 bg-gray-50 leading-relaxed whitespace-pre-wrap">{`~/.claude/
├── CLAUDE.md          ← Personal memory
├── settings.json      ← Global settings
├── rules/             ← Personal rules
│   └── *.md
├── agents/            ← Personal subagents
│   └── *.md
├── skills/            ← Personal skills
│   └── */SKILL.md
├── commands/          ← Personal commands
│   └── *.md
├── output-styles/     ← Personal styles
│   └── *.md
├── projects/          ← Auto memory
│   └── <project>/memory/
│       ├── MEMORY.md
│       └── *.md (topics)
└── plugins/cache/     ← Plugin cache`}</pre>
        </div>
        
        {/* Project-level */}
        <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: COLORS.project.border }}>
          <div className="px-3 py-2 text-white font-bold text-sm" style={{ backgroundColor: COLORS.project.bg }}>
            📦 Project Level (./ and .claude/)
          </div>
          <pre className="p-3 text-xs text-gray-700 bg-gray-50 leading-relaxed whitespace-pre-wrap">{`project-root/
├── CLAUDE.md          ← Project memory
├── CLAUDE.local.md    ← Personal (gitignored)
├── .mcp.json          ← MCP servers
├── .claude/
│   ├── CLAUDE.md      ← Alt project memory
│   ├── settings.json  ← Team settings
│   ├── settings.local.json ← Personal
│   ├── rules/         ← Project rules
│   │   └── *.md
│   ├── agents/        ← Project subagents
│   │   └── *.md
│   ├── skills/        ← Project skills
│   │   └── */SKILL.md
│   ├── commands/      ← Project commands
│   │   └── *.md
│   └── output-styles/ ← Project styles
│       └── *.md
└── child-dir/
    └── CLAUDE.md      ← Subtree memory`}</pre>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-3">
        {/* Enterprise */}
        <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: COLORS.enterprise.border }}>
          <div className="px-3 py-2 text-white font-bold text-sm" style={{ backgroundColor: COLORS.enterprise.bg }}>
            🏢 Enterprise Level (System dirs)
          </div>
          <pre className="p-3 text-xs text-gray-700 bg-gray-50 leading-relaxed whitespace-pre-wrap">{`macOS:
/Library/Application Support/ClaudeCode/
├── CLAUDE.md              ← Org instructions
├── managed-settings.json  ← Enforced settings
└── managed-mcp.json       ← Enforced MCP

Linux:
/etc/claude-code/
├── CLAUDE.md
├── managed-settings.json
└── managed-mcp.json

Windows:
C:\\ProgramData\\ClaudeCode\\
├── CLAUDE.md
├── managed-settings.json
└── managed-mcp.json`}</pre>
        </div>
        
        {/* Plugin */}
        <div className="border-2 rounded-lg overflow-hidden" style={{ borderColor: COLORS.plugin.border }}>
          <div className="px-3 py-2 text-white font-bold text-sm" style={{ backgroundColor: COLORS.plugin.bg }}>
            🔌 Plugin Structure
          </div>
          <pre className="p-3 text-xs text-gray-700 bg-gray-50 leading-relaxed whitespace-pre-wrap">{`my-plugin/
├── .claude-plugin/
│   └── plugin.json    ← Manifest (optional)
├── commands/          ← /plugin-name:cmd
│   └── *.md
├── agents/            ← Subagents
│   └── *.md
├── skills/            ← Skills
│   └── */SKILL.md
├── hooks/
│   └── hooks.json     ← Lifecycle hooks
├── output-styles/
│   └── *.md
├── .mcp.json          ← MCP servers
└── .lsp.json          ← LSP servers

Cached at: ~/.claude/plugins/cache/
Commands namespaced: /plugin-name:cmd`}</pre>
        </div>
      </div>
    </div>
  );
}

// ───────────────────── SECTION 7: OVERRIDE RULES TABLE ─────────────────────
function OverrideRulesTable() {
  const rules = [
    { fileType: "CLAUDE.md", mechanism: "ADDITIVE (all levels combine)", resolution: "More specific wins on conflicts. Enterprise > Project > User. Child dir overrides parent for files in that subtree.", merge: "Combine" },
    { fileType: "Rules (.claude/rules/)", mechanism: "ADDITIVE (all rules load)", resolution: "Path-scoped rules only load when matching files touched. When active, they effectively override global rules for those files.", merge: "Combine" },
    { fileType: "Settings.json", mechanism: "MERGE across tiers", resolution: "Higher tier wins for same key. Managed > CLI > Local > Project > User. Deny rules always win across all tiers.", merge: "Merge" },
    { fileType: "Skills", mechanism: "OVERRIDE by name", resolution: "Same-name skill: managed > CLI > project > user > plugin. Higher priority replaces lower.", merge: "Replace" },
    { fileType: "Sub-agents", mechanism: "OVERRIDE by name", resolution: "Same-name agent: managed > CLI > project > user > plugin.", merge: "Replace" },
    { fileType: "Commands", mechanism: "OVERRIDE by name", resolution: "Same-name command: project > user > plugin.", merge: "Replace" },
    { fileType: "Output Styles", mechanism: "ONE active at a time", resolution: "Only one style active. Selection stored in settings.local.json. Can be set at any tier via outputStyle key.", merge: "Replace" },
    { fileType: "MCP Servers", mechanism: "OVERRIDE by name", resolution: "Same-name server: enterprise > local > project > user.", merge: "Replace" },
    { fileType: "Hooks", mechanism: "MERGE all tiers", resolution: "All matching hooks from ALL tiers fire in parallel. They never override — they combine.", merge: "Combine" },
    { fileType: "Permissions", mechanism: "DENY always wins", resolution: "Deny evaluated first at every tier. Allow cannot override deny. Ask falls back to user prompt.", merge: "Special" },
  ];

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-2" style={{ color: "#e0e0e0" }}>
        📋 Master Override Rules — Every File Type
      </h2>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-4 gap-0 bg-gray-800 text-white text-xs font-bold">
          <div className="p-2 border-r border-gray-600">File Type</div>
          <div className="p-2 border-r border-gray-600">How They Interact</div>
          <div className="p-2 border-r border-gray-600">Conflict Resolution</div>
          <div className="p-2">Behavior</div>
        </div>
        {rules.map((r, i) => (
          <div key={i} className={`grid grid-cols-4 gap-0 text-xs ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
            <div className="p-2 font-bold text-gray-800 border-r border-gray-200">{r.fileType}</div>
            <div className="p-2 text-gray-700 border-r border-gray-200">{r.mechanism}</div>
            <div className="p-2 text-gray-700 border-r border-gray-200">{r.resolution}</div>
            <div className="p-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                r.merge === "Combine" ? "bg-green-100 text-green-800" :
                r.merge === "Merge" ? "bg-blue-100 text-blue-800" :
                r.merge === "Replace" ? "bg-orange-100 text-orange-800" :
                "bg-red-100 text-red-800"
              }`}>
                {r.merge}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────── MAIN APP ─────────────────────
function App() {
  const allFiles = [
    {
      name: "Enterprise CLAUDE.md",
      icon: "🏢",
      location: "/Library/Application Support/ClaudeCode/CLAUDE.md (macOS) | /etc/claude-code/CLAUDE.md (Linux)",
      color: COLORS.enterprise,
      loadBehavior: "Always at start",
      purpose: "Organization-wide instructions deployed by IT/DevOps. Contains company coding standards, security policies, and compliance requirements. Every developer in the org sees these instructions.",
      whenLoads: "Loaded first at every session start. Permanent token cost.",
      priority: "HIGHEST priority (Priority 1). Cannot be overridden by any other CLAUDE.md file.",
      winsAgainst: "Everything — User CLAUDE.md, Project CLAUDE.md, Local CLAUDE.md, all rules, all settings",
      losesTo: "Nothing. This is the absolute top of the hierarchy.",
      shared: "Yes — all users in organization via MDM/Group Policy/Ansible deployment",
      tokenCost: "Permanent — every token counts against every session for every user",
      example: `# Company Policy\n- All code must pass security scan before commit\n- Use approved libraries only (see @/shared/approved-libs.md)\n- Never commit API keys or secrets\n- Follow SOC 2 compliance standards`,
      specialNotes: "Deployed via configuration management systems. Individual developers cannot edit this file. If enterprise says 'always use TypeScript', no project or user setting can say otherwise."
    },
    {
      name: "User CLAUDE.md",
      icon: "👤",
      location: "~/.claude/CLAUDE.md",
      color: COLORS.user,
      loadBehavior: "Always at start",
      purpose: "Your personal preferences that apply to ALL your projects. Code style preferences, personal tool shortcuts, communication preferences.",
      whenLoads: "Loaded at every session start, after Enterprise but before Project files.",
      priority: "LOWEST priority among CLAUDE.md files (Priority 5). Overridden by Project and Local files.",
      winsAgainst: "Nothing in the CLAUDE.md hierarchy — this is the baseline foundation",
      losesTo: "Enterprise CLAUDE.md, Project CLAUDE.md, CLAUDE.local.md, and child-directory CLAUDE.md files",
      shared: "No — personal to you only, applies across all your projects",
      tokenCost: "Permanent — loaded every session. Keep under 50 lines.",
      example: `# Personal Preferences\n- I prefer early returns in functions\n- Use descriptive variable names\n- Comments in English\n- Concise responses, no emojis\n- When in doubt, ask before making changes`,
      specialNotes: "If User says '2-space indent' but Project says '4-space indent', the Project wins. User is the fallback when no project-level instruction exists."
    },
    {
      name: "Project CLAUDE.md",
      icon: "📦",
      location: "./CLAUDE.md or ./.claude/CLAUDE.md (root preferred if both exist)",
      color: COLORS.project,
      loadBehavior: "Always at start",
      purpose: "Team-shared project instructions committed to version control. Architecture decisions, coding standards, build commands, testing conventions.",
      whenLoads: "Loaded at session start. If both ./CLAUDE.md and ./.claude/CLAUDE.md exist, the root location (./CLAUDE.md) is preferred.",
      priority: "Medium-high (Priority 4). Overrides User but overridden by Local and Enterprise.",
      winsAgainst: "User CLAUDE.md (~/.claude/CLAUDE.md) on any conflicting instruction",
      losesTo: "Enterprise CLAUDE.md, CLI args, and CLAUDE.local.md",
      shared: "Yes — version-controlled, shared with entire team via git",
      tokenCost: "Permanent — loaded every session. Keep under 300 lines. Use @imports for detail files.",
      example: `# MyProject\n## Tech Stack\nNext.js 14, TypeScript strict, Prisma + PostgreSQL\n\n## Commands\n- Build: npm run build\n- Test: npm test\n- Lint: npm run lint\n\n## Conventions\n- Use Server Components by default\n- Validate inputs with Zod\n\nSee @docs/architecture.md for full details`,
      specialNotes: "Use /init to auto-generate this file. The @import syntax pulls in additional files (max 5 recursive hops). This is the single most important file for team collaboration."
    },
    {
      name: "CLAUDE.local.md",
      icon: "🔒",
      location: "./CLAUDE.local.md (auto-added to .gitignore)",
      color: COLORS.local,
      loadBehavior: "Always at start",
      purpose: "Your personal overrides for THIS project only. Machine-specific URLs, sandbox configs, WIP notes, debugging strategies.",
      whenLoads: "Loaded at session start, after Project CLAUDE.md.",
      priority: "Highest among project-level CLAUDE.md files (Priority 3). Overrides Project CLAUDE.md.",
      winsAgainst: "Project CLAUDE.md and User CLAUDE.md on any conflicting instruction",
      losesTo: "Enterprise CLAUDE.md and CLI arguments only",
      shared: "No — auto-gitignored. Only exists on your machine.",
      tokenCost: "Permanent — loaded every session. Use for machine-specific context only.",
      example: `# My Local Setup\n- Database: postgresql://localhost:5432/myapp_dev\n- Redis: localhost:6379\n- Currently working on: auth refactor (branch: feature/auth)\n- My sandbox: https://sandbox-123.example.com`,
      specialNotes: "Only exists in one worktree. For multi-worktree setups, use @~/.claude/my-project-notes.md import from Project CLAUDE.md instead."
    },
    {
      name: "Parent Directory CLAUDE.md",
      icon: "📂",
      location: "Any CLAUDE.md found recursing upward from cwd toward /",
      color: COLORS.project,
      loadBehavior: "Always at start",
      purpose: "Provides context from parent directories in monorepos. If you run Claude in foo/bar/, it loads both foo/CLAUDE.md and foo/bar/CLAUDE.md.",
      whenLoads: "All found files loaded in full at session start.",
      priority: "Closer-to-cwd files are more specific and win conflicts with parent files.",
      winsAgainst: "CLAUDE.md files in directories further from your cwd",
      losesTo: "Enterprise, Local, and CLAUDE.md files closer to your current directory",
      shared: "Depends on whether they're version-controlled",
      tokenCost: "Permanent — ALL found parent files are loaded. Be careful in deep directory structures.",
      example: `# In monorepo-root/CLAUDE.md:\nThis is a monorepo with React frontend and Node backend.\n\n# In monorepo-root/packages/api/CLAUDE.md:\nThis package uses Express.js with middleware pattern.`,
      specialNotes: "Claude searches upward but stops BEFORE the filesystem root (/). This enables layered instructions in monorepos."
    },
    {
      name: "Child/Subtree CLAUDE.md",
      icon: "🌿",
      location: "CLAUDE.md in any subdirectory below cwd",
      color: { bg: "#0D9488", light: "#CCFBF1", border: "#14B8A6", text: "#115E59" },
      loadBehavior: "On-demand",
      purpose: "Provides module-specific context when Claude reads files in that subdirectory. Loaded lazily to save tokens.",
      whenLoads: "NOT loaded at start. Only loaded when Claude reads files in that specific subtree.",
      priority: "Most specific when active — overrides parent CLAUDE.md for files in its subtree.",
      winsAgainst: "Parent directory CLAUDE.md and root CLAUDE.md for files within this subtree",
      losesTo: "Enterprise and CLAUDE.local.md",
      shared: "Yes if version-controlled",
      tokenCost: "ZERO until triggered — then costs tokens for the rest of the session.",
      example: `# src/api/CLAUDE.md\n## API Module Standards\n- Use Zod for input validation\n- Return 400 with field-level errors\n- Cursor-based pagination, max 100 per page\n- Rate limit: 1000 req/hr authenticated`,
      specialNotes: "This is how you achieve zero-cost-until-needed context. Put specialized instructions in subdirectories instead of bloating root CLAUDE.md."
    },
    {
      name: "Global Rules (.claude/rules/*.md)",
      icon: "📏",
      location: ".claude/rules/*.md (no paths: frontmatter)",
      color: COLORS.project,
      loadBehavior: "Always at start",
      purpose: "Modular project instructions that apply globally. Equivalent to putting the content in CLAUDE.md but organized into separate files.",
      whenLoads: "All .md files in .claude/rules/ discovered recursively at session start (if no paths: frontmatter).",
      priority: "Same as Project CLAUDE.md. Loaded alongside project memory.",
      winsAgainst: "User-level rules and User CLAUDE.md",
      losesTo: "Enterprise, Local, and path-scoped rules (when matching files are active)",
      shared: "Yes — version-controlled with the project",
      tokenCost: "Permanent — every rule without paths: costs tokens at startup.",
      example: `# .claude/rules/testing.md\n# Testing Standards\n- Use Vitest for unit tests\n- Mock external APIs in tests\n- Aim for 80% coverage on new code\n- Test error cases, not just happy path`,
      specialNotes: "Supports subdirectories for organization. Supports symlinks for sharing across projects."
    },
    {
      name: "Path-Scoped Rules",
      icon: "🎯",
      location: ".claude/rules/*.md (WITH paths: frontmatter)",
      color: { bg: "#0284C7", light: "#E0F2FE", border: "#0EA5E9", text: "#0C4A6E" },
      loadBehavior: "On-demand",
      purpose: "Rules that only activate when Claude works with files matching specific glob patterns. The key mechanism for context-aware, zero-cost loading.",
      whenLoads: "NOT loaded at start. Only loaded when Claude reads/edits files matching the paths: globs.",
      priority: "When active, effectively overrides global rules for matching files due to greater specificity.",
      winsAgainst: "Global rules for the matching files, because path-scoped rules are more specific",
      losesTo: "Enterprise policy",
      shared: "Yes — version-controlled",
      tokenCost: "ZERO until triggered. This is how you keep context lean.",
      example: `---\npaths:\n  - "src/api/**/*.ts"\n  - "tests/api/**/*.test.ts"\n---\n# API Security Rules\n- Always validate JWT tokens\n- Rate limit all endpoints\n- Log suspicious access patterns\n- Never expose internal error details`,
      specialNotes: "Glob patterns support brace expansion: src/**/*.{ts,tsx}. Known issue: path-scoped rules may sometimes load at start in some versions."
    },
    {
      name: "User-Level Rules",
      icon: "👤📏",
      location: "~/.claude/rules/*.md",
      color: COLORS.user,
      loadBehavior: "Always at start",
      purpose: "Personal rules that apply to all your projects. Universal preferences and workflows.",
      whenLoads: "Loaded at session start, before project-level rules.",
      priority: "Lower than project rules. Project rules override on conflict.",
      winsAgainst: "These are the baseline — overridden by everything more specific",
      losesTo: "Project rules, Local, Enterprise",
      shared: "No — personal to you",
      tokenCost: "Permanent — loaded every session across all projects.",
      example: `# ~/.claude/rules/preferences.md\n- I prefer functional programming patterns\n- Use early returns\n- Keep functions under 30 lines\n- TypeScript strict mode always`,
      specialNotes: "Known issue: paths: frontmatter in user-level rules may be ignored in some versions."
    },
    {
      name: "Skills (.claude/skills/*/SKILL.md)",
      icon: "🛠️",
      location: ".claude/skills/<skill-name>/SKILL.md (project) | ~/.claude/skills/<skill-name>/SKILL.md (user)",
      color: { bg: "#B45309", light: "#FEF3C7", border: "#F59E0B", text: "#78350F" },
      loadBehavior: "Progressive disclosure",
      purpose: "Reusable multi-step workflows. Only metadata loads at start; full instructions load on-demand when invoked.",
      whenLoads: "Phase 1: name + description from frontmatter loaded at start (~100 tokens). Phase 2: Full SKILL.md body loaded only when Claude invokes it.",
      priority: "Override by name: managed > CLI > project > user > plugin.",
      winsAgainst: "User skill (same name) if this is a project skill",
      losesTo: "Managed/CLI skill with same name",
      shared: "Project skills: yes. User skills: no.",
      tokenCost: "Minimal at start (~100 tokens per skill for frontmatter). Full body loaded on-demand only.",
      example: `---\nname: deploy\ndescription: "Deploy the application to staging or production"\nallowed-tools: Bash, Read\n---\n# Deploy Skill\n1. Run tests: npm test\n2. Build: npm run build\n3. Deploy to $1 environment\n4. Verify health check`,
      specialNotes: "Skills replaced slash commands as the primary extension mechanism. Commands still work. $ARGUMENTS and $1/$2 placeholders are supported."
    },
    {
      name: "Slash Commands (.claude/commands/*.md)",
      icon: "⚡",
      location: ".claude/commands/*.md (project) | ~/.claude/commands/*.md (user)",
      color: { bg: "#6D28D9", light: "#EDE9FE", border: "#8B5CF6", text: "#4C1D95" },
      loadBehavior: "User-invoked",
      purpose: "Predecessor to skills. Quick command templates invoked via /command-name. Still fully supported.",
      whenLoads: "Frontmatter scanned at start for autocomplete. Full content loaded only when user types /command-name.",
      priority: "If a skill and command share the same name, the skill takes precedence.",
      winsAgainst: "User commands if this is a project command",
      losesTo: "Same-name skill",
      shared: "Project commands: yes. User commands: no.",
      tokenCost: "Minimal at start (frontmatter only). Full content on invocation.",
      example: `---\ndescription: "Review code for best practices"\nallowed-tools: Read, Grep, Glob\n---\nReview the code in $ARGUMENTS for:\n1. Security vulnerabilities\n2. Performance issues\n3. Code style violations\nProvide actionable suggestions.`,
      specialNotes: "Subdirectories create namespace labels: .claude/commands/frontend/component.md creates /component with label '(project:frontend)'."
    },
    {
      name: "Sub-agents (.claude/agents/*.md)",
      icon: "🤖",
      location: ".claude/agents/*.md (project) | ~/.claude/agents/*.md (user)",
      color: { bg: "#0369A1", light: "#E0F2FE", border: "#0284C7", text: "#0C4A6E" },
      loadBehavior: "Always at start",
      purpose: "Specialized AI instances with their own context window, tool permissions, and system prompt. Run independently from main session.",
      whenLoads: "Loaded at session start. Run in separate context windows when delegated to.",
      priority: "Override by name: managed > CLI (--agents) > project > user > plugin.",
      winsAgainst: "User agent (same name) if this is a project agent",
      losesTo: "Managed/CLI agent with same name",
      shared: "Project agents: yes. User agents: no.",
      tokenCost: "Frontmatter at start (~100-200 tokens). Execution uses SEPARATE context window — does not consume main session tokens.",
      example: `---\nname: code-reviewer\ndescription: "Reviews code for quality and security"\ntools: Read, Grep, Glob\nmodel: sonnet\n---\nYou are a senior code reviewer.\nFocus on security, performance, and maintainability.\nProvide specific line-number references.`,
      specialNotes: "Sub-agents cannot spawn other sub-agents (no infinite nesting). Built-in agents: Explore (Haiku, read-only), Plan (Sonnet, research), General (Sonnet, full)."
    },
    {
      name: "Output Styles (.claude/output-styles/*.md)",
      icon: "🎨",
      location: ".claude/output-styles/*.md (project) | ~/.claude/output-styles/*.md (user)",
      color: { bg: "#BE185D", light: "#FCE7F3", border: "#EC4899", text: "#831843" },
      loadBehavior: "User-invoked",
      purpose: "MOST POWERFUL file type. Directly REPLACES Claude Code's system prompt default instructions. Can repurpose Claude Code beyond software engineering.",
      whenLoads: "Loaded when user selects via /output-style. Selection persists in settings.local.json.",
      priority: "Only one style active at a time. Can be set at any settings tier via outputStyle key.",
      winsAgainst: "Default system prompt instructions. CLAUDE.md adds context; output styles REPLACE the foundation.",
      losesTo: "Nothing in terms of system prompt control — this is the most powerful override",
      shared: "Project styles: yes. User styles: no.",
      tokenCost: "Replaces existing system prompt text — no additional cost, may even reduce tokens.",
      example: `---\nname: concise\ndescription: "Minimal output, no explanations"\nkeep-coding-instructions: true\n---\nBe extremely concise. No pleasantries.\nCode only, no explanations unless asked.\nMaximum 5 lines of non-code text per response.`,
      specialNotes: "CRITICAL: Without keep-coding-instructions: true, the default software engineering instructions are REMOVED. Built-in styles: Default, Explanatory, Learning."
    },
    {
      name: "Auto Memory (MEMORY.md)",
      icon: "🧠",
      location: "~/.claude/projects/<project>/memory/MEMORY.md + topic files",
      color: COLORS.auto,
      loadBehavior: "First 200 lines at start",
      purpose: "Claude writes these notes FOR ITSELF. Learnings, patterns, and insights discovered during sessions. You don't write these — Claude does.",
      whenLoads: "First 200 lines of MEMORY.md loaded at every session start. Topic files (debugging.md, etc.) loaded on-demand when Claude reads them.",
      priority: "Informational — does not override CLAUDE.md instructions. Both combine additively.",
      winsAgainst: "No conflict with other files — additive information",
      losesTo: "Explicit CLAUDE.md instructions always take priority over auto-discovered patterns",
      shared: "No — stored outside the repo at ~/.claude/projects/",
      tokenCost: "First 200 lines permanent. Topic files on-demand.",
      example: `# MEMORY.md (written by Claude)\n## Project Patterns\n- Uses pnpm, not npm\n- Tests require local Redis instance\n- API follows REST conventions with Zod validation\n\n## Debugging Notes\nSee debugging.md for PostgreSQL connection patterns`,
      specialNotes: "Control with CLAUDE_CODE_DISABLE_AUTO_MEMORY env var (0=force on, 1=force off). Use /memory to edit. Per-project, derived from git root."
    },
    {
      name: "@Imported Files",
      icon: "📎",
      location: "Any file referenced via @path/to/file in CLAUDE.md",
      color: COLORS.system,
      loadBehavior: "With parent file",
      purpose: "Pull external files into CLAUDE.md context. Enables modular documentation without bloating the main file.",
      whenLoads: "Loaded when the parent CLAUDE.md file loads. Imports are recursive up to 5 hops deep.",
      priority: "Same as the parent CLAUDE.md that imports them.",
      winsAgainst: "Same as parent file",
      losesTo: "Same as parent file",
      shared: "Depends on where the parent CLAUDE.md is stored",
      tokenCost: "ADDS to parent's permanent token cost. Every imported file is loaded every session.",
      example: `# In CLAUDE.md:\nSee @README.md for overview\nGit workflow: @docs/git-instructions.md\nPersonal prefs: @~/.claude/my-project-notes.md`,
      specialNotes: "Relative paths resolve from the importing file's location, NOT the working directory. Not evaluated inside markdown code blocks. First use in a project shows an approval dialog."
    },
  ];

  const [expandedFile, setExpandedFile] = useState(null);
  const [activeTab, setActiveTab] = useState("pyramid");

  const tabs = [
    { id: "pyramid", label: "🏔️ Precedence", desc: "Who overrides whom" },
    { id: "files", label: "📄 All Files", desc: "Every markdown file" },
    { id: "conflicts", label: "⚔️ Conflicts", desc: "Real scenarios" },
    { id: "timeline", label: "⏱️ Loading", desc: "When files load" },
    { id: "settings", label: "⚙️ Settings", desc: "JSON hierarchy" },
    { id: "dirs", label: "📁 Directories", desc: "Complete map" },
    { id: "rules", label: "📋 Rules Table", desc: "Override rules" },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 font-sans" style={{ background: "#0d1117", color: "#e0e0e0" }}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#e0e0e0" }}>
          Claude Code: Complete File Hierarchy & Precedence Guide
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Every markdown file, every config, every conflict resolution rule
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-6 justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? "bg-gray-800 text-white shadow-md"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            <div>{tab.label}</div>
            <div className="text-xs opacity-70">{tab.desc}</div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "pyramid" && <PrecedencePyramid />}
      
      {activeTab === "files" && (
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "#e0e0e0" }}>
            📄 Every Markdown File Claude Code Reads
          </h2>
          <p className="text-sm text-gray-500 mb-3">Click any file for complete details including examples, priority, and conflict behavior.</p>
          {allFiles.map((file, i) => (
            <MarkdownFileCard
              key={i}
              file={file}
              isExpanded={expandedFile === i}
              onToggle={() => setExpandedFile(expandedFile === i ? null : i)}
            />
          ))}
        </div>
      )}
      
      {activeTab === "conflicts" && <ConflictScenarios />}
      {activeTab === "timeline" && <LoadingTimeline />}
      {activeTab === "settings" && <SettingsHierarchy />}
      {activeTab === "dirs" && <DirectoryMap />}
      {activeTab === "rules" && <OverrideRulesTable />}
      
      {/* Footer legend */}
      <div className="mt-6 p-3 bg-gray-100 rounded-lg border">
        <p className="text-xs font-bold text-gray-600 mb-2">Color Legend:</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "Enterprise", color: COLORS.enterprise.bg },
            { label: "Project", color: COLORS.project.bg },
            { label: "User", color: COLORS.user.bg },
            { label: "Local", color: COLORS.local.bg },
            { label: "Auto-generated", color: COLORS.auto.bg },
            { label: "Plugin", color: COLORS.plugin.bg },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1 text-xs text-gray-700">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default App;
