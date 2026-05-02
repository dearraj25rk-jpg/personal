import React, { useState } from "react";

const COLORS = {
  bg: "#0d1117",
  card: "#161b22",
  cardHover: "#1c2333",
  border: "rgba(255,255,255,0.08)",
  borderActive: "#00d46a",
  text: "#e2e8f0",
  textMuted: "#94a3b8",
  textDim: "#64748b",
  accent: "#00d46a",
  accentGlow: "rgba(0, 212, 106, 0.15)",
  green: "#00d46a",
  greenBg: "rgba(0, 212, 106, 0.1)",
  greenBorder: "rgba(0, 212, 106, 0.3)",
  amber: "#f59e0b",
  amberBg: "rgba(245, 158, 11, 0.1)",
  amberBorder: "rgba(245, 158, 11, 0.3)",
  purple: "#a78bfa",
  purpleBg: "rgba(167, 139, 250, 0.1)",
  purpleBorder: "rgba(167, 139, 250, 0.3)",
  red: "#f87171",
  redBg: "rgba(248, 113, 113, 0.1)",
  redBorder: "rgba(248, 113, 113, 0.3)",
  cyan: "#22d3ee",
  cyanBg: "rgba(34, 211, 238, 0.1)",
  cyanBorder: "rgba(34, 211, 238, 0.3)",
  pink: "#f472b6",
  pinkBg: "rgba(244, 114, 182, 0.1)",
  pinkBorder: "rgba(244, 114, 182, 0.3)",
};
const PHASES = {
  ALWAYS: { label: "Always Loaded", color: COLORS.green, bg: COLORS.greenBg, border: COLORS.greenBorder, icon: "🟢" },
  ON_DEMAND: { label: "On-Demand", color: COLORS.amber, bg: COLORS.amberBg, border: COLORS.amberBorder, icon: "🟡" },
  INVOKED: { label: "User/Model Invoked", color: COLORS.purple, bg: COLORS.purpleBg, border: COLORS.purpleBorder, icon: "🟣" },
  SYSTEM_MOD: { label: "System Prompt Modifier", color: COLORS.red, bg: COLORS.redBg, border: COLORS.redBorder, icon: "🔴" },
  AUTO_GEN: { label: "Auto-Generated", color: COLORS.cyan, bg: COLORS.cyanBg, border: COLORS.cyanBorder, icon: "🔵" },
  PLUGIN: { label: "Plugin-Bundled", color: COLORS.pink, bg: COLORS.pinkBg, border: COLORS.pinkBorder, icon: "🩷" },
};

const ALL_FILES = [
  {
    id: "enterprise-claude",
    name: "Enterprise CLAUDE.md",
    shortName: "Enterprise Policy",
    path: "/Library/Application Support/ClaudeCode/CLAUDE.md",
    altPaths: ["/etc/claude-code/CLAUDE.md", "C:\\Program Files\\ClaudeCode\\CLAUDE.md"],
    scope: "Organization",
    phase: PHASES.ALWAYS,
    priority: "1 (Highest)",
    gitTracked: false,
    whoCreates: "IT / DevOps",
    sharedWith: "All devs in org",
    tokenCost: "Permanent every session",
    frontmatter: "None required",
    description: "Organization-wide coding standards, security policies, compliance requirements deployed via MDM, Ansible, or Group Policy.",
    whatBelongs: "Security mandates, compliance rules, approved tool lists, org-wide coding standards",
    example: `# Enterprise Policy — Acme Corp\n\n## Security\n- Never commit secrets or API keys\n- Parameterized queries only\n\n## Compliance\n- GDPR: Encrypt PII at rest\n- All PRs require 2 approvals`,
    category: "memory",
  },
  {
    id: "user-claude",
    name: "User CLAUDE.md",
    shortName: "User Preferences",
    path: "~/.claude/CLAUDE.md",
    scope: "Personal (all projects)",
    phase: PHASES.ALWAYS,
    priority: "2",
    gitTracked: false,
    whoCreates: "You",
    sharedWith: "Just you",
    tokenCost: "Permanent every session",
    frontmatter: "None required",
    description: "Your personal coding preferences that apply across every project you work on.",
    whatBelongs: "Personal style prefs, interaction preferences, universal shortcuts",
    example: `# My Preferences\n\n- Propose plan first, wait for OK\n- Use descriptive variable names\n- Prefer functional patterns`,
    category: "memory",
  },
  {
    id: "project-claude",
    name: "Project CLAUDE.md",
    shortName: "Project Memory",
    path: "./CLAUDE.md  or  .claude/CLAUDE.md",
    scope: "Project (team)",
    phase: PHASES.ALWAYS,
    priority: "3",
    gitTracked: true,
    whoCreates: "Team / /init command",
    sharedWith: "Team via git",
    tokenCost: "Permanent every session",
    frontmatter: "None required. Supports @imports",
    description: "The most commonly used file. Team-shared project identity, architecture, conventions, and key commands. Bootstrap with /init.",
    whatBelongs: "Tech stack, build/test/lint commands, git workflow, key paths, architecture overview. Keep under ~120 lines.",
    example: `# CLAUDE.md — MyProject\n\n## Architecture\n- .NET 8, Azure SQL, EF Core\n\n## Commands\n- Build: dotnet build\n- Test: dotnet test\n\n## Conventions\n- Conventional commits\n- Squash merge to main`,
    category: "memory",
  },
  {
    id: "local-claude",
    name: "CLAUDE.local.md",
    shortName: "Local Overrides",
    path: "./CLAUDE.local.md",
    scope: "Personal + Project",
    phase: PHASES.ALWAYS,
    priority: "4 (Most specific)",
    gitTracked: false,
    whoCreates: "You",
    sharedWith: "Just you, this project",
    tokenCost: "Permanent every session",
    frontmatter: "None required",
    description: "Auto-gitignored personal project preferences — sandbox URLs, test data, debugging strategies.",
    whatBelongs: "Personal sandbox URLs, local DB connections, debugging preferences, personal workflow shortcuts",
    example: `# My Local Settings\n\n- Sandbox: https://raj-sandbox.azurewebsites.net\n- Use port 5001 for local API\n- Prefer verbose test output`,
    category: "memory",
  },
  {
    id: "rules",
    name: ".claude/rules/*.md",
    shortName: "Rules",
    path: ".claude/rules/",
    scope: "Project (team)",
    phase: PHASES.ALWAYS,
    priority: "Same as CLAUDE.md (High)",
    gitTracked: true,
    whoCreates: "Team",
    sharedWith: "Team via git",
    tokenCost: "Global = permanent. Path-scoped = only when matching files touched",
    frontmatter: "Optional: paths: [glob patterns] for scoping",
    description: "Modular rule files. Global rules (no paths:) load always. Path-scoped rules (with paths:) load only when Claude works on matching files. Same high priority as CLAUDE.md.",
    whatBelongs: "Detailed coding patterns, framework-specific conventions, security checklists — split by domain",
    example: `---\npaths:\n  - "src/api/**/*.ts"\n---\n\n# API Rules\n- Validate input with Zod\n- Consistent error shapes\n- Log with correlation IDs`,
    category: "memory",
  },
  {
    id: "subtree-claude",
    name: "Subtree CLAUDE.md",
    shortName: "Subtree Memory",
    path: "<subdir>/CLAUDE.md (e.g. src/Domain/CLAUDE.md)",
    scope: "Subdirectory",
    phase: PHASES.ON_DEMAND,
    priority: "High (same as CLAUDE.md)",
    gitTracked: true,
    whoCreates: "Team",
    sharedWith: "Team via git",
    tokenCost: "Zero until Claude enters that directory",
    frontmatter: "None required",
    description: "CLAUDE.md files in child directories below your cwd. NOT loaded at startup — only when Claude reads/edits files in that subdirectory.",
    whatBelongs: "Domain-specific rules (DDD patterns, layer constraints), subsystem documentation",
    example: `# Domain Layer Rules\n\n- ZERO dependencies on Infrastructure\n- All entities inherit BaseEntity\n- Use Value Objects for money/dates`,
    category: "memory",
  },
  {
    id: "personal-commands",
    name: "~/.claude/commands/*.md",
    shortName: "Personal Commands",
    path: "~/.claude/commands/",
    scope: "Personal (all projects)",
    phase: PHASES.INVOKED,
    priority: "Normal (tool result)",
    gitTracked: false,
    whoCreates: "You",
    sharedWith: "Just you",
    tokenCost: "Zero until you type /command",
    frontmatter: "description, allowed-tools, model (all optional)",
    description: "Personal slash commands available across all projects. Filename = command name. Supports $ARGUMENTS, @file injection, !shell execution.",
    whatBelongs: "Reusable prompts: reviews, analysis, brainstorming workflows",
    example: `---\ndescription: Code review of recent changes\nallowed-tools: Read, Grep, Glob\n---\n\n## Changes\n!\`git diff HEAD~1\`\n\nReview for bugs, security, performance.`,
    category: "command",
  },
  {
    id: "project-commands",
    name: ".claude/commands/*.md",
    shortName: "Project Commands",
    path: ".claude/commands/",
    scope: "Project (team)",
    phase: PHASES.INVOKED,
    priority: "Normal (tool result)",
    gitTracked: true,
    whoCreates: "Team",
    sharedWith: "Team via git",
    tokenCost: "Zero until /command invoked",
    frontmatter: "description, allowed-tools, model (all optional)",
    description: "Same as personal commands but shared with team. Team members get these automatically on git pull.",
    whatBelongs: "Team workflows: deploy checklists, PR templates, release procedures",
    example: `---\ndescription: Run deployment checklist\nallowed-tools: Read, Bash(npm run *)\n---\n\n1. Run tests\n2. Check lint\n3. Build production\n4. Deploy to staging`,
    category: "command",
  },
  {
    id: "personal-agents",
    name: "~/.claude/agents/*.md",
    shortName: "Personal Agents",
    path: "~/.claude/agents/",
    scope: "Personal (all projects)",
    phase: PHASES.INVOKED,
    priority: "Runs in separate context",
    gitTracked: false,
    whoCreates: "You or /agents command",
    sharedWith: "Just you",
    tokenCost: "Definition at start (~minimal). Runs in own context window.",
    frontmatter: "name, description, tools, model, permissionMode, maxTurns, skills, memory, hooks, mcpServers",
    description: "Custom subagents with their own context window, tool restrictions, and optional persistent memory. Defined in markdown with YAML frontmatter (config) + body (system prompt).",
    whatBelongs: "Specialized workers: code reviewers, security auditors, documentation generators, research agents",
    example: `---\nname: code-reviewer\ndescription: Reviews code for quality\ntools: Read, Glob, Grep\nmodel: sonnet\nmemory:\n  scope: user\n---\n\nYou are a code reviewer.\nFocus on bugs, security, performance.`,
    category: "agent",
  },
  {
    id: "project-agents",
    name: ".claude/agents/*.md",
    shortName: "Project Agents",
    path: ".claude/agents/",
    scope: "Project (team)",
    phase: PHASES.INVOKED,
    priority: "Runs in separate context",
    gitTracked: true,
    whoCreates: "Team or /agents command",
    sharedWith: "Team via git",
    tokenCost: "Same as personal agents",
    frontmatter: "Same as personal agents",
    description: "Same as personal agents but shared with team via git. Useful for standardized team workflows.",
    whatBelongs: "Team-standard agents: shared reviewer, deployment agent, testing agent",
    example: `---\nname: deploy-agent\ndescription: Handles staging deployments\ntools: Read, Bash(npm run *)\nmodel: sonnet\n---\n\nYou handle deployments.\nAlways run tests first.`,
    category: "agent",
  },
  {
    id: "personal-skills",
    name: "~/.claude/skills/*/SKILL.md",
    shortName: "Personal Skills",
    path: "~/.claude/skills/<name>/",
    scope: "Personal (all projects)",
    phase: PHASES.ON_DEMAND,
    priority: "Normal (tool result on invoke)",
    gitTracked: false,
    whoCreates: "You",
    sharedWith: "Just you",
    tokenCost: "~100-150 tokens (frontmatter) at start. Full body only on invocation.",
    frontmatter: "name (64 char), description (1024 char), allowed-tools, disable-model-invocation, context, agent",
    description: "Model-invoked expertise packages. Claude auto-decides when to use based on description. Can include scripts, templates, references. Progressive disclosure = unbounded knowledge with minimal idle cost.",
    whatBelongs: "Complex workflows, code generators, analysis tools — anything needing scripts/templates/references",
    example: `---\nname: explain-code\ndescription: Explains code with diagrams and analogies\n---\n\n# Explain Code\n1. Start with analogy\n2. Draw ASCII diagram\n3. Walk through step-by-step\n4. Highlight gotchas`,
    category: "skill",
  },
  {
    id: "project-skills",
    name: ".claude/skills/*/SKILL.md",
    shortName: "Project Skills",
    path: ".claude/skills/<name>/",
    scope: "Project (team)",
    phase: PHASES.ON_DEMAND,
    priority: "Normal (tool result on invoke)",
    gitTracked: true,
    whoCreates: "Team",
    sharedWith: "Team via git",
    tokenCost: "Same as personal skills",
    frontmatter: "Same as personal skills",
    description: "Same as personal skills but shared with team. Can include team deployment scripts, generators, analysis tools.",
    whatBelongs: "Team workflows with supporting scripts and templates",
    example: `---\nname: generate-api\ndescription: Scaffold new API endpoint\n---\n\n# Generate API Endpoint\nUse templates in ./templates/\n1. Create controller\n2. Create service\n3. Create tests`,
    category: "skill",
  },
  {
    id: "personal-styles",
    name: "~/.claude/output-styles/*.md",
    shortName: "Personal Styles",
    path: "~/.claude/output-styles/",
    scope: "Personal (all projects)",
    phase: PHASES.SYSTEM_MOD,
    priority: "SYSTEM PROMPT level (replaces default)",
    gitTracked: false,
    whoCreates: "You",
    sharedWith: "Just you",
    tokenCost: "Replaces default SE prompt. Active until changed.",
    frontmatter: "name, description, keep-coding-instructions (bool)",
    description: "Most powerful modifier. Directly REPLACES parts of Claude Code's default system prompt. Unlike CLAUDE.md (adds user message) or rules (adds context), styles change the core behavior.",
    whatBelongs: "Completely different interaction modes: architect mode, teaching mode, minimal mode",
    example: `---\nname: architect\ndescription: System design focused responses\nkeep-coding-instructions: true\n---\n\n# Architect Mode\nAlways discuss trade-offs.\nConsider scalability and failure modes.`,
    category: "style",
  },
  {
    id: "project-styles",
    name: ".claude/output-styles/*.md",
    shortName: "Project Styles",
    path: ".claude/output-styles/",
    scope: "Project (team)",
    phase: PHASES.SYSTEM_MOD,
    priority: "SYSTEM PROMPT level",
    gitTracked: true,
    whoCreates: "Team",
    sharedWith: "Team via git",
    tokenCost: "Same as personal styles",
    frontmatter: "Same as personal styles",
    description: "Same as personal output styles but shared with team.",
    whatBelongs: "Team interaction standards",
    example: `---\nname: team-standard\ndescription: Consistent team output format\nkeep-coding-instructions: true\n---\n\nAlways include rationale.\nReference ADRs when relevant.`,
    category: "style",
  },
  {
    id: "memory-md",
    name: "MEMORY.md (Subagent)",
    shortName: "Agent Memory",
    path: "~/.claude/agent-memory/<agent>/MEMORY.md",
    altPaths: [".claude/agent-memory/<agent>/MEMORY.md"],
    scope: "Per-agent",
    phase: PHASES.AUTO_GEN,
    priority: "Normal (in subagent context)",
    gitTracked: false,
    whoCreates: "Subagent auto-writes",
    sharedWith: "Just that subagent",
    tokenCost: "First 200 lines loaded into subagent on invocation",
    frontmatter: "None",
    description: "Persistent memory that subagents build over time. The subagent writes learnings, patterns, discoveries. Next invocation loads first 200 lines automatically. Scope: user, project, or local.",
    whatBelongs: "Auto-captured: codepaths discovered, patterns learned, architectural decisions, common issues",
    example: `# Agent Memory\n\n## Patterns Discovered\n- Auth uses JWT with 15min expiry\n- All repos follow repository pattern\n\n## Key Files\n- src/Auth/JwtService.cs\n- src/Domain/BaseEntity.cs`,
    category: "auto",
  },
  {
    id: "imported-files",
    name: "@Imported Files",
    shortName: "@Imports",
    path: "Any path referenced via @path/to/file in CLAUDE.md",
    scope: "Depends on parent",
    phase: PHASES.ALWAYS,
    priority: "Same as parent CLAUDE.md",
    gitTracked: "Varies",
    whoCreates: "You (reference in CLAUDE.md)",
    sharedWith: "Same as parent file",
    tokenCost: "Adds to parent's permanent overhead",
    frontmatter: "N/A",
    description: "Any file pulled into CLAUDE.md context via @path syntax. Supports relative and absolute paths. Max 5 recursive hops. Ignored inside code blocks/spans.",
    whatBelongs: "Detailed docs, READMEs, style guides — content too long for CLAUDE.md but needed at start",
    example: `# In CLAUDE.md:\nSee @README for overview\nGit workflow: @docs/git-instructions.md\nPersonal: @~/.claude/my-project.md`,
    category: "memory",
  },
  {
    id: "project-memory",
    name: "MEMORY.md",
    shortName: "Auto-Memory",
    path: ".claude/MEMORY.md  (auto-generated)",
    scope: "Project (team)",
    phase: PHASES.AUTO_GEN,
    priority: "Same as CLAUDE.md (loads always)",
    gitTracked: true,
    whoCreates: "Claude Code (auto-generated)",
    sharedWith: "Team via git",
    tokenCost: "Permanent every session (capped at 200 lines)",
    frontmatter: "None — managed by Claude Code",
    description: "Introduced in Claude Code v2.1.59. Auto-generated file where Claude Code records persistent facts it discovers about the project — architecture decisions, team preferences, recurring patterns, discovered constraints. Capped at 200 lines to control token cost.",
    whatBelongs: "Auto-populated by Claude: discovered patterns, team preferences Claude learned, architectural facts, recurring issues. You can READ and DELETE entries but let Claude write them.",
    example: `# Auto-Memory — generated by Claude Code\n\n## Discovered Patterns\n- Team prefers async/await over Promises explicitly\n- All API endpoints validated with Zod before processing\n- Integration tests use test-containers (not mocks)\n\n## Architecture Facts\n- Database: PostgreSQL via Prisma ORM\n- Message queue: Azure Service Bus (not SQS)\n- Auth: Azure AD B2C tokens`,
    category: "memory",
  },
];

const CATEGORIES = {
  memory: { label: "Memory Files", desc: "Persistent context loaded into every session" },
  command: { label: "Slash Commands", desc: "User-invoked prompts via /command" },
  agent: { label: "Subagents", desc: "Delegated workers with own context" },
  skill: { label: "Skills", desc: "Model-invoked expertise packages" },
  style: { label: "Output Styles", desc: "System prompt modifiers" },
  auto: { label: "Auto-Generated", desc: "Written by subagents automatically" },
};

function Badge({ color, bg, border, children }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      color,
      background: bg,
      border: `1px solid ${border}`,
      whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

function PhaseIndicator({ phase }) {
  return <Badge color={phase.color} bg={phase.bg} border={phase.border}>{phase.icon} {phase.label}</Badge>;
}

function FileCard({ file, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "10px 12px",
        background: isSelected ? COLORS.accentGlow : "transparent",
        border: `1px solid ${isSelected ? COLORS.borderActive : COLORS.border}`,
        borderRadius: 8,
        cursor: "pointer",
        transition: "all 0.15s",
        marginBottom: 6,
        color: COLORS.text,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{file.shortName}</span>
        <PhaseIndicator phase={file.phase} />
      </div>
      <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 3, fontFamily: "monospace" }}>
        {file.path.length > 45 ? file.path.slice(0, 42) + "..." : file.path}
      </div>
    </button>
  );
}

function DetailPanel({ file }) {
  if (!file) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: COLORS.textDim, fontSize: 14 }}>
      ← Select a file to see details
    </div>
  );
  
  const rows = [
    ["Path", file.path],
    ...(file.altPaths ? [["Alt Paths", file.altPaths.join("\n")]] : []),
    ["Scope", file.scope],
    ["Priority", file.priority],
    ["Who Creates", file.whoCreates],
    ["Shared With", file.sharedWith],
    ["Git Tracked", file.gitTracked ? "✅ Yes" : "❌ No"],
    ["Token Cost", file.tokenCost],
    ["Frontmatter", file.frontmatter],
  ];

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: COLORS.text, margin: 0 }}>{file.name}</h2>
        <PhaseIndicator phase={file.phase} />
      </div>
      
      <p style={{ fontSize: 13, color: COLORS.textMuted, lineHeight: 1.6, margin: "0 0 16px" }}>
        {file.description}
      </p>

      <div style={{ background: COLORS.card, borderRadius: 8, border: `1px solid ${COLORS.border}`, overflow: "hidden", marginBottom: 16 }}>
        {rows.map(([label, value], i) => (
          <div key={label} style={{
            display: "flex",
            padding: "8px 12px",
            borderBottom: i < rows.length - 1 ? `1px solid ${COLORS.border}` : "none",
            fontSize: 12,
          }}>
            <span style={{ width: 120, flexShrink: 0, fontWeight: 600, color: COLORS.textDim }}>{label}</span>
            <span style={{ color: COLORS.text, fontFamily: label === "Path" || label === "Alt Paths" ? "monospace" : "inherit", whiteSpace: "pre-wrap", fontSize: label === "Path" || label === "Alt Paths" ? 11 : 12 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: file.phase.color, marginBottom: 6 }}>What Belongs Here</h3>
        <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5, margin: 0 }}>{file.whatBelongs}</p>
      </div>

      <div>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: COLORS.textDim, marginBottom: 6 }}>Example</h3>
        <pre style={{
          background: "#0d1117",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 6,
          padding: 12,
          fontSize: 11,
          lineHeight: 1.5,
          color: "#c9d1d9",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          margin: 0,
        }}>
          {file.example}
        </pre>
      </div>
    </div>
  );
}

function FlowDiagram({ onFileClick }) {
  const boxStyle = (color, bg, border) => ({
    padding: "8px 12px",
    borderRadius: 8,
    background: bg,
    border: `1.5px solid ${border}`,
    fontSize: 11,
    color,
    fontWeight: 600,
    textAlign: "center",
    cursor: "pointer",
    transition: "transform 0.1s",
  });

  const arrowDown = (label, color = COLORS.textDim) => (
    <div style={{ textAlign: "center", padding: "4px 0", color, fontSize: 10 }}>
      {"▼"} {label && <span style={{ fontStyle: "italic" }}>{label}</span>}
    </div>
  );

  const sectionTitle = (text, color) => (
    <div style={{ fontSize: 12, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, marginTop: 16 }}>{text}</div>
  );

  return (
    <div style={{ padding: "0 4px" }}>
      {sectionTitle("Phase 1 — Session Start (Always Loaded)", COLORS.green)}
      
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={boxStyle(COLORS.green, COLORS.greenBg, COLORS.greenBorder)} onClick={() => onFileClick("enterprise-claude")}>
          ① Enterprise CLAUDE.md → highest priority
        </div>
        {arrowDown("merges into")}
        <div style={boxStyle(COLORS.green, COLORS.greenBg, COLORS.greenBorder)} onClick={() => onFileClick("user-claude")}>
          ② User ~/.claude/CLAUDE.md → personal prefs
        </div>
        {arrowDown("merges into")}
        <div style={boxStyle(COLORS.green, COLORS.greenBg, COLORS.greenBorder)} onClick={() => onFileClick("project-claude")}>
          ③ Project CLAUDE.md + @imports → team context
        </div>
        {arrowDown("merges into")}
        <div style={boxStyle(COLORS.green, COLORS.greenBg, COLORS.greenBorder)} onClick={() => onFileClick("local-claude")}>
          ④ CLAUDE.local.md → personal project overrides
        </div>
        {arrowDown("merges into")}
        <div style={boxStyle(COLORS.green, COLORS.greenBg, COLORS.greenBorder)} onClick={() => onFileClick("rules")}>
          ⑤ Global Rules (no paths:) → domain instructions
        </div>
        {arrowDown("extracts frontmatter only")}
        <div style={{ display: "flex", gap: 4 }}>
          <div style={{ ...boxStyle(COLORS.amber, COLORS.amberBg, COLORS.amberBorder), flex: 1 }} onClick={() => onFileClick("personal-skills")}>
            Skills (name + desc only)
          </div>
          <div style={{ ...boxStyle(COLORS.purple, COLORS.purpleBg, COLORS.purpleBorder), flex: 1 }} onClick={() => onFileClick("personal-agents")}>
            Agent definitions
          </div>
          <div style={{ ...boxStyle(COLORS.purple, COLORS.purpleBg, COLORS.purpleBorder), flex: 1 }} onClick={() => onFileClick("personal-commands")}>
            Command list
          </div>
        </div>
      </div>

      <div style={{ background: COLORS.border, height: 1, margin: "16px 0" }} />
      
      {sectionTitle("Phase 2 — User Sends Message", COLORS.accent)}
      
      <div style={{
        background: "rgba(59, 130, 246, 0.05)",
        border: `1px solid rgba(59, 130, 246, 0.2)`,
        borderRadius: 8,
        padding: 10,
        marginBottom: 8,
        fontSize: 11,
        color: COLORS.textMuted,
        textAlign: "center",
      }}>
        Claude processes message against ALL loaded context
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 4 }}>Touches matching files?</div>
          <div style={boxStyle(COLORS.amber, COLORS.amberBg, COLORS.amberBorder)} onClick={() => onFileClick("rules")}>
            Load path-scoped Rules
          </div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 4 }}>Enters subdirectory?</div>
          <div style={boxStyle(COLORS.amber, COLORS.amberBg, COLORS.amberBorder)} onClick={() => onFileClick("subtree-claude")}>
            Load Subtree CLAUDE.md
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 4 }}>Matches skill description?</div>
          <div style={boxStyle(COLORS.amber, COLORS.amberBg, COLORS.amberBorder)} onClick={() => onFileClick("project-skills")}>
            Invoke Skill → load full SKILL.md body
          </div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 4 }}>User types /command?</div>
          <div style={boxStyle(COLORS.purple, COLORS.purpleBg, COLORS.purpleBorder)} onClick={() => onFileClick("project-commands")}>
            Run Slash Command
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 4 }}>Needs delegation?</div>
          <div style={boxStyle(COLORS.purple, COLORS.purpleBg, COLORS.purpleBorder)} onClick={() => onFileClick("project-agents")}>
            Fork Subagent → own context
          </div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 10, color: COLORS.textDim, marginBottom: 4 }}>Agent has memory?</div>
          <div style={boxStyle(COLORS.cyan, COLORS.cyanBg, COLORS.cyanBorder)} onClick={() => onFileClick("memory-md")}>
            Load MEMORY.md (200 lines)
          </div>
        </div>
      </div>

      <div style={{ background: COLORS.border, height: 1, margin: "16px 0" }} />

      {sectionTitle("Always Available — /output-style", COLORS.red)}
      <div style={boxStyle(COLORS.red, COLORS.redBg, COLORS.redBorder)} onClick={() => onFileClick("personal-styles")}>
        Output Styles → REPLACE default system prompt (most powerful)
      </div>

      <div style={{ background: COLORS.border, height: 1, margin: "16px 0" }} />

      {sectionTitle("Phase 3 — Context Budget (200K tokens)", "#fff")}
      <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
        {[
          { label: "System Prompt", tokens: "~5-15K", pct: 7, color: "#475569" },
          { label: "CLAUDE.md (all levels) + Global Rules + @imports", tokens: "~2-15K", pct: 8, color: COLORS.green },
          { label: "Skill Frontmatter + Agent Defs + MCP Schemas", tokens: "~1-5K", pct: 3, color: COLORS.amber },
          { label: "On-Demand: Skills, Path Rules, Subtree, Commands", tokens: "varies", pct: 10, color: COLORS.purple },
          { label: "🟩 Usable Conversation Space", tokens: "~140-150K", pct: 50, color: COLORS.accent },
          { label: "Response Buffer (thinking + output)", tokens: "~40-45K", pct: 22, color: "#1e293b" },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            padding: "6px 10px",
            borderBottom: i < 5 ? `1px solid ${COLORS.border}` : "none",
            fontSize: 11,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: item.color, marginRight: 8, flexShrink: 0,
            }} />
            <span style={{ flex: 1, color: COLORS.textMuted }}>{item.label}</span>
            <span style={{ fontFamily: "monospace", color: COLORS.text, fontWeight: 600, fontSize: 10 }}>{item.tokens}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeView, setActiveView] = useState("catalog");
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredFiles = activeCategory === "all" 
    ? ALL_FILES 
    : ALL_FILES.filter(f => f.category === activeCategory);

  const selectedFileData = ALL_FILES.find(f => f.id === selectedFile);

  const handleFlowClick = (id) => {
    setSelectedFile(id);
    setActiveView("catalog");
  };

  return (
    <div style={{
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      background: COLORS.bg,
      color: COLORS.text,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: `1px solid ${COLORS.border}`,
        background: "linear-gradient(180deg, #111827 0%, #0a0e1a 100%)",
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
          <span style={{ color: COLORS.accent }}>Claude Code</span>{" "}
          <span style={{ color: COLORS.text }}>Markdown File Architecture</span>
        </h1>
        <p style={{ fontSize: 12, color: COLORS.textDim, margin: "4px 0 0" }}>
          All {ALL_FILES.length} markdown file types — how they load, connect, and consume tokens
        </p>
      </div>

      {/* Legend */}
      <div style={{
        display: "flex",
        gap: 8,
        padding: "10px 20px",
        borderBottom: `1px solid ${COLORS.border}`,
        flexWrap: "wrap",
      }}>
        {Object.values(PHASES).map(phase => (
          <PhaseIndicator key={phase.label} phase={phase} />
        ))}
      </div>

      {/* View Toggle */}
      <div style={{
        display: "flex",
        padding: "8px 20px",
        gap: 4,
        borderBottom: `1px solid ${COLORS.border}`,
      }}>
        {[
          { key: "catalog", label: "📋 File Catalog" },
          { key: "flow", label: "🔄 Flow Diagram" },
        ].map(v => (
          <button
            key={v.key}
            onClick={() => setActiveView(v.key)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: `1px solid ${activeView === v.key ? COLORS.borderActive : COLORS.border}`,
              background: activeView === v.key ? COLORS.accentGlow : "transparent",
              color: activeView === v.key ? COLORS.accent : COLORS.textMuted,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Left Panel */}
        <div style={{
          width: activeView === "flow" ? "50%" : "40%",
          borderRight: `1px solid ${COLORS.border}`,
          overflowY: "auto",
          padding: "12px 16px",
        }}>
          {activeView === "catalog" ? (
            <>
              {/* Category Filter */}
              <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => setActiveCategory("all")}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 4,
                    border: `1px solid ${activeCategory === "all" ? COLORS.borderActive : COLORS.border}`,
                    background: activeCategory === "all" ? COLORS.accentGlow : "transparent",
                    color: activeCategory === "all" ? COLORS.accent : COLORS.textDim,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  All ({ALL_FILES.length})
                </button>
                {Object.entries(CATEGORIES).map(([key, cat]) => {
                  const count = ALL_FILES.filter(f => f.category === key).length;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 4,
                        border: `1px solid ${activeCategory === key ? COLORS.borderActive : COLORS.border}`,
                        background: activeCategory === key ? COLORS.accentGlow : "transparent",
                        color: activeCategory === key ? COLORS.accent : COLORS.textDim,
                        cursor: "pointer",
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {cat.label} ({count})
                    </button>
                  );
                })}
              </div>

              {/* File List */}
              {filteredFiles.map(file => (
                <FileCard
                  key={file.id}
                  file={file}
                  isSelected={selectedFile === file.id}
                  onClick={() => setSelectedFile(file.id)}
                />
              ))}
            </>
          ) : (
            <FlowDiagram onFileClick={handleFlowClick} />
          )}
        </div>

        {/* Right Panel - Detail */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
        }}>
          <DetailPanel file={selectedFileData} />
        </div>
      </div>
    </div>
  );
}
export default App;
