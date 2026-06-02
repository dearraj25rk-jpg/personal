import React, { useState } from "react";

const C = {
  bg: "#0d1117",
  surface: "#161b22",
  card: "#1c2333",
  border: "rgba(255,255,255,0.08)",
  borderLight: "rgba(255,255,255,0.14)",
  text: "#E8EDF5",
  textSoft: "#9BA8C0",
  textDim: "#5E6E8A",
  white: "#FFFFFF",
  green: "#00d46a",
  greenDim: "#00a854",
  greenBg: "rgba(0,212,106,0.08)",
  greenBorder: "rgba(0,212,106,0.25)",
  yellow: "#FBBF24",
  yellowDim: "#D97706",
  yellowBg: "rgba(251,191,36,0.08)",
  yellowBorder: "rgba(251,191,36,0.25)",
  blue: "#60A5FA",
  blueDim: "#2563EB",
  blueBg: "rgba(96,165,250,0.08)",
  blueBorder: "rgba(96,165,250,0.25)",
  red: "#F87171",
  redBg: "rgba(248,113,113,0.08)",
  redBorder: "rgba(248,113,113,0.25)",
  purple: "#A78BFA",
  purpleBg: "rgba(167,139,250,0.08)",
  purpleBorder: "rgba(167,139,250,0.25)",
  cyan: "#22D3EE",
  cyanBg: "rgba(34,211,238,0.08)",
  cyanBorder: "rgba(34,211,238,0.25)",
  orange: "#FB923C",
  orangeBg: "rgba(251,146,60,0.08)",
  orangeBorder: "rgba(251,146,60,0.25)",
  pink: "#F472B6",
  pinkBg: "rgba(244,114,182,0.08)",
  pinkBorder: "rgba(244,114,182,0.25)",
};

const mono = { fontFamily: "'JetBrains Mono','Fira Code','SF Mono',Consolas,monospace" };
const sans = { fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" };

function SectionTitle({ children, color = C.blue, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: color }} />
        <h2 style={{ ...sans, fontSize: 20, fontWeight: 800, color: C.white, margin: 0 }}>{children}</h2>
      </div>
      {subtitle && <p style={{ ...sans, fontSize: 13, color: C.textDim, margin: "6px 0 0 16px" }}>{subtitle}</p>}
    </div>
  );
}

function Tag({ children, color = C.blue, bg }) {
  return (
    <span style={{
      ...mono, fontSize: 11, fontWeight: 600, color,
      background: bg || `${color}18`,
      border: `1px solid ${color}40`,
      borderRadius: 5, padding: "2px 7px",
    }}>{children}</span>
  );
}

function Badge({ children, color = C.textDim }) {
  return (
    <span style={{ ...sans, fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: 0.8 }}>
      {children}
    </span>
  );
}

// ── Architecture Tab ───────────────────────────────────────────────
function ArchitectureTab() {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div>
      <SectionTitle color={C.green} subtitle="git worktree shares a single .git directory while providing separate working trees">
        Worktree Architecture
      </SectionTitle>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* git clone comparison */}
        <div style={{ flex: "1 1 300px" }}>
          <div style={{ ...sans, fontSize: 12, color: C.red, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 700 }}>
            git clone (heavyweight)
          </div>
          <div style={{ background: C.card, border: `1.5px solid ${C.redBorder}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { path: "~/projects/myapp/", label: "Full clone #1", icon: "📁", color: C.red },
                { path: "  .git/", label: "Full git history", icon: "🗄", color: C.textDim },
                { path: "  src/ node_modules/ ...", label: "All working files", icon: "📄", color: C.textDim },
                { path: "", label: "", icon: "", color: "transparent" },
                { path: "~/projects/myapp-feat/", label: "Full clone #2", icon: "📁", color: C.red },
                { path: "  .git/", label: "Duplicated history", icon: "🗄", color: C.textDim },
                { path: "  src/ node_modules/ ...", label: "All working files again", icon: "📄", color: C.textDim },
              ].map((row, i) => row.path ? (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ ...mono, fontSize: 12, color: row.color, flex: 1 }}>{row.path}</span>
                  <span style={{ ...sans, fontSize: 11, color: C.textDim }}>{row.label}</span>
                </div>
              ) : <div key={i} style={{ height: 8 }} />)}
            </div>
            <div style={{ marginTop: 14, padding: "8px 12px", background: C.redBg, borderRadius: 8, border: `1px solid ${C.redBorder}` }}>
              <div style={{ ...sans, fontSize: 12, color: C.red }}>
                Duplicates full git history + all files. Disk-heavy. node_modules must be reinstalled per clone.
              </div>
            </div>
          </div>
        </div>

        {/* git worktree */}
        <div style={{ flex: "1 1 300px" }}>
          <div style={{ ...sans, fontSize: 12, color: C.green, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, fontWeight: 700 }}>
            git worktree (lightweight)
          </div>
          <div style={{ background: C.card, border: `1.5px solid ${C.greenBorder}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { path: "~/projects/myapp/", label: "Primary worktree", icon: "📁", color: C.green },
                { path: "  .git/", label: "Shared git store (ONE copy)", icon: "🗄", color: C.yellow },
                { path: "    worktrees/feature-auth/", label: "Worktree metadata", icon: "🔗", color: C.blue },
                { path: "    worktrees/fix-bug-42/", label: "Worktree metadata", icon: "🔗", color: C.blue },
                { path: "", label: "", icon: "", color: "transparent" },
                { path: "~/projects/myapp-feature-auth/", label: "Worktree #1 checkout", icon: "📁", color: C.blue },
                { path: "  .git", label: "→ points to main .git", icon: "🔗", color: C.yellow },
                { path: "  src/ ...", label: "Only working files", icon: "📄", color: C.textDim },
                { path: "~/projects/myapp-fix-bug-42/", label: "Worktree #2 checkout", icon: "📁", color: C.blue },
                { path: "  .git", label: "→ points to main .git", icon: "🔗", color: C.yellow },
                { path: "  src/ ...", label: "Only working files", icon: "📄", color: C.textDim },
              ].map((row, i) => row.path ? (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ ...mono, fontSize: 11, color: row.color, flex: 1 }}>{row.path}</span>
                  <span style={{ ...sans, fontSize: 11, color: C.textDim }}>{row.label}</span>
                </div>
              ) : <div key={i} style={{ height: 8 }} />)}
            </div>
            <div style={{ marginTop: 14, padding: "8px 12px", background: C.greenBg, borderRadius: 8, border: `1px solid ${C.greenBorder}` }}>
              <div style={{ ...sans, fontSize: 12, color: C.green }}>
                Single .git store shared across all worktrees. Only working files duplicated. Branches are truly isolated.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key properties */}
      <div style={{ marginTop: 24 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Key Properties
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 10 }}>
          {[
            { title: "Shared Object Store", desc: "All worktrees read/write the same .git/objects — no history duplication", color: C.yellow },
            { title: "Branch Isolation", desc: "Each worktree checks out a different branch — no switching needed", color: C.green },
            { title: "Lightweight", desc: "Only working-tree files are duplicated, not the git database", color: C.blue },
            { title: "Independent Index", desc: "Each worktree has its own index (staging area) and HEAD pointer", color: C.purple },
            { title: "Shared Remotes", desc: "All worktrees share the same remote configuration and fetch cache", color: C.cyan },
            { title: "Linked Worktrees", desc: "Listed via git worktree list; pruned via git worktree prune", color: C.orange },
          ].map(p => (
            <div
              key={p.title}
              style={{
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 8, padding: "10px 14px",
                borderLeft: `3px solid ${p.color}`,
              }}
            >
              <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: p.color, marginBottom: 4 }}>{p.title}</div>
              <div style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Commands reference */}
      <div style={{ marginTop: 24 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Essential Commands
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
          {[
            { cmd: "git worktree add ../myapp-feat feature/auth", desc: "Create worktree at path on existing branch" },
            { cmd: "git worktree add -b feature/new ../myapp-new", desc: "Create worktree + new branch simultaneously" },
            { cmd: "git worktree list", desc: "List all linked worktrees with paths and branches" },
            { cmd: "git worktree remove ../myapp-feat", desc: "Remove worktree (branch is preserved)" },
            { cmd: "git worktree prune", desc: "Clean up stale worktree references" },
            { cmd: "git worktree lock ../myapp-feat", desc: "Lock a worktree to prevent accidental removal" },
          ].map(({ cmd, desc }) => (
            <div key={cmd} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
              <span style={{ ...mono, fontSize: 12, color: C.green, flex: "0 0 auto", whiteSpace: "nowrap" }}>$</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...mono, fontSize: 12, color: C.text, wordBreak: "break-all" }}>{cmd}</div>
                <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 2 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Parallel Flow Tab ──────────────────────────────────────────────
function ParallelFlowTab() {
  const [activeSession, setActiveSession] = useState(null);

  const sessions = [
    {
      id: "auth",
      branch: "feature/auth",
      path: "~/projects/myapp-auth/",
      task: "Implement OAuth2 login flow",
      color: C.blue,
      bg: C.blueBg,
      border: C.blueBorder,
      claudeMd: "Focus: auth module only\nNo side-effects to other modules",
      context: "OAuth2, JWT, user model",
      status: "Running",
      turns: 14,
    },
    {
      id: "fix",
      branch: "fix/issue-99",
      path: "~/projects/myapp-fix/",
      task: "Fix memory leak in parser",
      color: C.green,
      bg: C.greenBg,
      border: C.greenBorder,
      claudeMd: "Focus: parser performance\nRun benchmarks before/after",
      context: "Parser, memory profiler",
      status: "Running",
      turns: 7,
    },
    {
      id: "refactor",
      branch: "refactor/db-layer",
      path: "~/projects/myapp-db/",
      task: "Migrate from raw SQL to ORM",
      color: C.purple,
      bg: C.purpleBg,
      border: C.purpleBorder,
      claudeMd: "Focus: database layer only\nMaintain backwards compat",
      context: "SQLAlchemy, schema migrations",
      status: "Waiting",
      turns: 3,
    },
  ];

  return (
    <div>
      <SectionTitle color={C.blue} subtitle="Three independent Claude Code sessions running simultaneously in separate worktrees">
        Parallel Session Flow
      </SectionTitle>

      {/* Shared repo at top */}
      <div style={{
        background: C.surface, border: `1.5px solid ${C.yellowBorder}`,
        borderRadius: 12, padding: "12px 20px", marginBottom: 24,
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: C.yellow, flexShrink: 0 }} />
        <div>
          <div style={{ ...sans, fontSize: 14, fontWeight: 700, color: C.yellow }}>~/projects/myapp/ (primary)</div>
          <div style={{ ...sans, fontSize: 12, color: C.textDim }}>Shared .git/ object store — single source of truth for all branches and history</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <Tag color={C.yellow}>main branch</Tag>
        </div>
      </div>

      {/* Arrow down from shared repo */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <div style={{ ...sans, fontSize: 18, color: C.textDim }}>↓ git worktree add</div>
      </div>

      {/* Three sessions */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        {sessions.map(s => (
          <div
            key={s.id}
            onClick={() => setActiveSession(activeSession === s.id ? null : s.id)}
            style={{
              flex: "1 1 220px", background: activeSession === s.id ? s.bg : C.card,
              border: `2px solid ${activeSession === s.id ? s.color : s.border}`,
              borderRadius: 12, padding: 16, cursor: "pointer", transition: "all 0.18s",
            }}
          >
            {/* Terminal header */}
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
              <span style={{ ...mono, fontSize: 10, color: C.textDim, marginLeft: 6 }}>Terminal {sessions.indexOf(s) + 1}</span>
            </div>
            <div style={{ ...mono, fontSize: 11, color: s.color, marginBottom: 6 }}>{s.path}</div>
            <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>{s.task}</div>
            <div style={{ marginBottom: 8 }}>
              <Tag color={s.color}>{s.branch}</Tag>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ ...sans, fontSize: 11, color: s.status === "Running" ? C.green : C.textDim }}>
                ● {s.status}
              </span>
              <span style={{ ...sans, fontSize: 11, color: C.textDim }}>{s.turns} turns</span>
            </div>

            {activeSession === s.id && (
              <div style={{ marginTop: 14, borderTop: `1px solid ${s.border}`, paddingTop: 12 }}>
                <div style={{ ...sans, fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>
                  CLAUDE.md context
                </div>
                <pre style={{
                  ...mono, fontSize: 11, color: s.color,
                  background: C.surface, borderRadius: 6, padding: "8px 10px",
                  margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap",
                }}>
                  {s.claudeMd}
                </pre>
                <div style={{ marginTop: 8 }}>
                  <span style={{ ...sans, fontSize: 11, color: C.textDim }}>Active context: </span>
                  <span style={{ ...sans, fontSize: 11, color: s.color }}>{s.context}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ ...sans, fontSize: 12, color: C.textDim, textAlign: "center", marginBottom: 24 }}>
        Click any session card to expand its CLAUDE.md and context details
      </div>

      {/* Key isolation properties */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          What Each Session Owns Independently
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 }}>
          {[
            { item: "CLAUDE.md", desc: "Project instructions scoped to the worktree path", color: C.blue },
            { item: "Branch + HEAD", desc: "Different branch checked out, separate staging area", color: C.green },
            { item: "Context window", desc: "No shared memory between sessions — full isolation", color: C.purple },
            { item: "Tool permissions", desc: "Each session has its own permission state", color: C.yellow },
            { item: "Working files", desc: "File edits only affect the worktree, not others", color: C.cyan },
            { item: "Shell environment", desc: "Separate terminal, separate env vars if desired", color: C.orange },
          ].map(p => (
            <div key={p.item} style={{ display: "flex", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0, marginTop: 5 }} />
              <div>
                <span style={{ ...mono, fontSize: 12, color: p.color }}>{p.item}</span>
                <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 2 }}>{p.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── /branch Command Tab ────────────────────────────────────────────
function BranchCommandTab() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "invoke",
      label: "User types /branch",
      color: C.green,
      code: "/branch feature/auth",
      detail: "The /branch slash command is invoked inside an active Claude Code session. Claude Code intercepts this before sending to the LLM.",
      note: "Works inside any Claude Code session terminal",
    },
    {
      id: "validate",
      label: "Branch name validated",
      color: C.yellow,
      code: "Checking for existing branch: feature/auth\nChecking for conflicting worktrees...\nBranch name valid ✓",
      detail: "Claude Code checks that the branch name is valid git syntax, doesn't already have a checked-out worktree, and that the current repo is clean enough to proceed.",
      note: "Warns if branch already exists — prompts to reuse",
    },
    {
      id: "worktree",
      label: "Worktree created",
      color: C.blue,
      code: "$ git worktree add ../myapp-feature-auth -b feature/auth\nPreparing worktree (new branch 'feature/auth')\nHEAD is now at a1b2c3d Initial commit",
      detail: "A new directory is created adjacent to the primary repo. Git initializes the branch at the current HEAD of the primary worktree (or specified base commit).",
      note: "Directory: ../<repo-name>-<branch-slug>/",
    },
    {
      id: "claudemd",
      label: "CLAUDE.md injected",
      color: C.purple,
      code: "Creating .claude/CLAUDE.md in worktree...\nInheriting project CLAUDE.md from primary worktree\nAdding branch-specific context: feature/auth",
      detail: "Claude Code creates (or inherits) a CLAUDE.md in the new worktree directory. Any branch-specific instructions can be added. The parent project's CLAUDE.md is also read via the import chain.",
      note: "Worktree CLAUDE.md takes precedence over project CLAUDE.md",
    },
    {
      id: "terminal",
      label: "New terminal opens",
      color: C.cyan,
      code: "Opening new terminal window...\ncd ~/projects/myapp-feature-auth\nclaude --session-name 'feature/auth'",
      detail: "Claude Code launches a new terminal window or tab (system-dependent) and changes into the new worktree directory. A fresh Claude Code session starts automatically.",
      note: "On macOS: new Terminal tab. On Linux: depends on terminal emulator",
    },
    {
      id: "isolated",
      label: "Session runs in isolation",
      color: C.orange,
      code: "Claude Code session started\nProject: myapp (worktree: feature/auth)\nContext: ~/projects/myapp-feature-auth/\n\n> How can I help with feature/auth?",
      detail: "The new Claude Code session is fully isolated. It only reads files in the worktree directory, uses the worktree's CLAUDE.md, and operates on the feature/auth branch. The original session continues unaffected.",
      note: "Original session continues on main branch simultaneously",
    },
  ];

  return (
    <div>
      <SectionTitle color={C.cyan} subtitle="Step-by-step flow of what happens when you run /branch feature/auth">
        /branch Command — Full Flow
      </SectionTitle>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* Step list */}
        <div style={{ flex: "0 0 200px", display: "flex", flexDirection: "column", gap: 0 }}>
          {steps.map((s, i) => (
            <div key={s.id}>
              <div
                onClick={() => setActiveStep(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
                  padding: "10px 12px", borderRadius: 8,
                  background: activeStep === i ? `${s.color}15` : "transparent",
                  border: `1.5px solid ${activeStep === i ? s.color + "50" : "transparent"}`,
                  transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                  background: activeStep === i ? s.color : C.surface,
                  border: `2px solid ${s.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: activeStep === i ? C.bg : s.color }}>{i + 1}</span>
                </div>
                <span style={{ ...sans, fontSize: 13, fontWeight: 600, color: activeStep === i ? s.color : C.textSoft }}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div style={{ width: 2, height: 16, background: C.border, marginLeft: 22 }} />
              )}
            </div>
          ))}
        </div>

        {/* Step detail */}
        <div style={{ flex: 1, minWidth: 280 }}>
          {(() => {
            const s = steps[activeStep];
            return (
              <div style={{
                background: C.card, border: `1.5px solid ${s.color}40`,
                borderRadius: 12, padding: 20, height: "100%",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
                  <span style={{ ...sans, fontSize: 16, fontWeight: 700, color: s.color }}>{s.label}</span>
                  <span style={{ ...mono, fontSize: 11, color: C.textDim, marginLeft: "auto" }}>Step {activeStep + 1}/{steps.length}</span>
                </div>
                <p style={{ ...sans, fontSize: 13, color: C.text, lineHeight: 1.7, marginBottom: 16 }}>{s.detail}</p>
                <pre style={{
                  ...mono, fontSize: 12, color: C.text,
                  background: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 8, padding: 14, margin: 0, overflowX: "auto",
                  lineHeight: 1.6, whiteSpace: "pre-wrap",
                }}>
                  {s.code}
                </pre>
                <div style={{
                  marginTop: 12, padding: "8px 12px",
                  background: `${s.color}10`, borderRadius: 6, border: `1px solid ${s.color}30`,
                }}>
                  <span style={{ ...sans, fontSize: 11, color: s.color }}>Note: {s.note}</span>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  {activeStep > 0 && (
                    <button
                      onClick={() => setActiveStep(activeStep - 1)}
                      style={{
                        ...sans, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        padding: "7px 14px", borderRadius: 7,
                        background: C.surface, border: `1px solid ${C.border}`,
                        color: C.textSoft, transition: "all 0.15s",
                      }}
                    >
                      ← Previous
                    </button>
                  )}
                  {activeStep < steps.length - 1 && (
                    <button
                      onClick={() => setActiveStep(activeStep + 1)}
                      style={{
                        ...sans, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        padding: "7px 14px", borderRadius: 7,
                        background: `${s.color}20`, border: `1px solid ${s.color}50`,
                        color: s.color, transition: "all 0.15s",
                      }}
                    >
                      Next →
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ── Coordination Patterns Tab ──────────────────────────────────────
function CoordinationTab() {
  const [expanded, setExpanded] = useState(null);

  const patterns = [
    {
      id: "feature",
      title: "Feature Isolation",
      subtitle: "Separate worktree per in-flight feature",
      color: C.green,
      bg: C.greenBg,
      border: C.greenBorder,
      icon: "⚙",
      when: "When building multiple features simultaneously without branch-switching overhead",
      workflow: [
        "Create worktree per feature: git worktree add ../myapp-feat-A -b feature/A",
        "Start Claude Code in each worktree independently",
        "Each session only sees and edits its own feature branch",
        "PR from each branch when feature is complete",
        "Clean up: git worktree remove ../myapp-feat-A after merge",
      ],
      benefit: "Zero risk of accidentally committing to the wrong branch. No stash/pop cycles.",
      example: `# Terminal 1 — Feature A
cd ~/projects/myapp-feature-auth
claude  # works on feature/auth branch

# Terminal 2 — Feature B
cd ~/projects/myapp-feature-payments
claude  # works on feature/payments branch

# Both run simultaneously, zero interference`,
    },
    {
      id: "prreview",
      title: "PR Review",
      subtitle: "Review a PR while continuing active work",
      color: C.blue,
      bg: C.blueBg,
      border: C.blueBorder,
      icon: "🔍",
      when: "When asked to review a colleague's PR but you have active uncommitted work",
      workflow: [
        "Fetch the PR branch: git fetch origin pull/42/head:pr-42",
        "Create worktree for the PR: git worktree add ../myapp-pr-42 pr-42",
        "Run Claude Code in that worktree to review the PR",
        "Your main session continues uninterrupted on your branch",
        "Remove the worktree when review is done",
      ],
      benefit: "No need to stash or switch branches. Primary work session is undisturbed.",
      example: `# Fetch PR branch
git fetch origin pull/42/head:review/pr-42

# Create dedicated worktree for review
git worktree add ../myapp-review-pr42 review/pr-42

# Start review session
cd ../myapp-review-pr42
claude "Review this PR for correctness and security issues"

# Meanwhile, original session keeps running on main`,
    },
    {
      id: "ci",
      title: "CI Worktree",
      subtitle: "Run tests in isolated worktree without disturbing dev session",
      color: C.yellow,
      bg: C.yellowBg,
      border: C.yellowBorder,
      icon: "🔄",
      when: "When you want to run a full test suite or build without affecting the working directory state",
      workflow: [
        "Create a clean worktree on the current commit: git worktree add ../myapp-ci HEAD",
        "Run the test suite or build process inside that worktree",
        "Dev session continues with file edits, hot reload, etc.",
        "Tests complete in isolation — no file locking or test database conflicts",
        "Remove the CI worktree after the run",
      ],
      benefit: "Full test suite can run against a clean snapshot while dev continues. Prevents test pollution.",
      example: `# Create CI worktree at current HEAD
git worktree add ../myapp-ci-run HEAD

# Run tests in the isolated worktree
cd ../myapp-ci-run
npm ci && npm test -- --coverage

# Or kick off Claude Code to interpret results
claude "Run the full test suite and summarize failures"

# Dev session is unaffected throughout`,
    },
    {
      id: "agents",
      title: "Agent Teams — Worktrees",
      subtitle: "Run parallel Claude Code Agent Teams across services",
      color: C.purple,
      bg: C.purpleBg,
      border: C.purpleBorder,
      icon: "🤖",
      when: "Coordinating multiple Claude Code Agent Teams working on different microservices or modules simultaneously",
      workflow: [
        "Create one worktree per service/module",
        "Launch a Claude Code agent session in each worktree",
        "Agents work autonomously on their assigned scope",
        "Coordination via shared files, Git commits, or a parent orchestrator session",
        "Merge results via standard PRs from each worktree branch",
      ],
      benefit: "True parallelism for large codebases. Each agent has a focused context window without noise from other services.",
      example: `# Orchestrator sets up agent worktrees
git worktree add ../service-api    -b agents/api-refactor
git worktree add ../service-auth   -b agents/auth-refactor
git worktree add ../service-worker -b agents/worker-refactor

# Launch agents in parallel (each in own terminal)
cd ../service-api    && claude --agent "Refactor API layer to OpenAPI 3.1"
cd ../service-auth   && claude --agent "Migrate auth to OAuth2 + PKCE"
cd ../service-worker && claude --agent "Convert to async job queue pattern"

# Agents run simultaneously, no context cross-contamination`,
    },
  ];

  return (
    <div>
      <SectionTitle color={C.yellow} subtitle="Four coordination patterns using worktrees for parallel Claude Code development">
        Coordination Patterns
      </SectionTitle>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {patterns.map(p => (
          <div
            key={p.id}
            style={{
              background: expanded === p.id ? p.bg : C.card,
              border: `1.5px solid ${expanded === p.id ? p.color : p.border}`,
              borderRadius: 12, overflow: "hidden", transition: "all 0.18s",
            }}
          >
            <div
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
              style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", cursor: "pointer" }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: `${p.color}20`,
                border: `1.5px solid ${p.color}40`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, flexShrink: 0,
              }}>
                {p.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...sans, fontSize: 15, fontWeight: 700, color: p.color }}>{p.title}</div>
                <div style={{ ...sans, fontSize: 12, color: C.textSoft, marginTop: 2 }}>{p.subtitle}</div>
              </div>
              <div style={{ ...sans, fontSize: 13, color: C.textDim }}>{expanded === p.id ? "▲" : "▼"}</div>
            </div>

            {expanded === p.id && (
              <div style={{ borderTop: `1px solid ${p.border}`, padding: 20 }}>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <div style={{ flex: "1 1 240px" }}>
                    <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>When to use</div>
                    <p style={{ ...sans, fontSize: 13, color: C.text, lineHeight: 1.6, marginBottom: 16 }}>{p.when}</p>

                    <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Workflow</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {p.workflow.map((step, i) => (
                        <div key={i} style={{ display: "flex", gap: 10 }}>
                          <span style={{ ...mono, fontSize: 11, color: p.color, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                          <span style={{ ...sans, fontSize: 12, color: C.textSoft }}>{step}</span>
                        </div>
                      ))}
                    </div>

                    <div style={{ marginTop: 14, padding: "8px 12px", background: `${p.color}12`, borderRadius: 7, border: `1px solid ${p.color}30` }}>
                      <span style={{ ...sans, fontSize: 12, color: p.color, fontWeight: 600 }}>Key benefit: </span>
                      <span style={{ ...sans, fontSize: 12, color: C.textSoft }}>{p.benefit}</span>
                    </div>
                  </div>

                  <div style={{ flex: "1 1 280px" }}>
                    <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Example</div>
                    <pre style={{
                      ...mono, fontSize: 11, color: C.text,
                      background: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: 8, padding: 14, margin: 0,
                      overflowX: "auto", lineHeight: 1.6, whiteSpace: "pre-wrap",
                    }}>
                      {p.example}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Directory Layout Tab ───────────────────────────────────────────
function DirectoryLayoutTab() {
  const [highlighted, setHighlighted] = useState(null);

  const tree = [
    { depth: 0, name: "~/projects/", type: "dir", color: C.white, id: "root", desc: "Parent directory containing all worktrees" },
    { depth: 1, name: "myapp/", type: "dir", color: C.yellow, id: "primary", desc: "Primary worktree — main branch checked out here" },
    { depth: 2, name: ".git/", type: "dir", color: C.yellow, id: "git", desc: "The single shared git object store for ALL worktrees" },
    { depth: 3, name: "objects/", type: "dir", color: C.textDim, id: "objects", desc: "All commits, trees, blobs shared across worktrees" },
    { depth: 3, name: "refs/", type: "dir", color: C.textDim, id: "refs", desc: "All branch and tag references" },
    { depth: 3, name: "worktrees/", type: "dir", color: C.blue, id: "worktrees-meta", desc: "Metadata directory — one subdirectory per linked worktree" },
    { depth: 4, name: "myapp-feature-auth/", type: "dir", color: C.blue, id: "wt-meta-auth", desc: "Metadata for the feature/auth worktree" },
    { depth: 5, name: "gitdir", type: "file", color: C.textSoft, id: "gitdir-auth", desc: "Points back to the .git directory in the worktree checkout" },
    { depth: 5, name: "HEAD", type: "file", color: C.textSoft, id: "head-auth", desc: "Which branch this worktree is on: refs/heads/feature/auth" },
    { depth: 5, name: "index", type: "file", color: C.textSoft, id: "index-auth", desc: "Staging area index — independent per worktree" },
    { depth: 4, name: "myapp-fix-issue-99/", type: "dir", color: C.blue, id: "wt-meta-fix", desc: "Metadata for the fix/issue-99 worktree" },
    { depth: 5, name: "gitdir", type: "file", color: C.textSoft, id: "gitdir-fix", desc: "Points back to .git in fix worktree checkout" },
    { depth: 5, name: "HEAD", type: "file", color: C.textSoft, id: "head-fix", desc: "refs/heads/fix/issue-99" },
    { depth: 5, name: "index", type: "file", color: C.textSoft, id: "index-fix", desc: "Independent staging index for fix worktree" },
    { depth: 2, name: "src/", type: "dir", color: C.textDim, id: "src-primary", desc: "Working files checked out on main branch" },
    { depth: 2, name: "CLAUDE.md", type: "file", color: C.purple, id: "claude-primary", desc: "Primary project CLAUDE.md — read by all sessions" },
    { depth: 1, name: "myapp-feature-auth/", type: "dir", color: C.green, id: "wt-auth", desc: "Worktree checkout — feature/auth branch" },
    { depth: 2, name: ".git", type: "file", color: C.yellow, id: "wt-auth-git", desc: "Text file containing: gitdir: ../myapp/.git/worktrees/myapp-feature-auth" },
    { depth: 2, name: "src/", type: "dir", color: C.textDim, id: "wt-auth-src", desc: "Working files for feature/auth — independent from primary" },
    { depth: 2, name: "CLAUDE.md", type: "file", color: C.purple, id: "claude-auth", desc: "Worktree-specific CLAUDE.md — overrides primary for this session" },
    { depth: 1, name: "myapp-fix-issue-99/", type: "dir", color: C.green, id: "wt-fix", desc: "Worktree checkout — fix/issue-99 branch" },
    { depth: 2, name: ".git", type: "file", color: C.yellow, id: "wt-fix-git", desc: "Text file pointing to: ../myapp/.git/worktrees/myapp-fix-issue-99" },
    { depth: 2, name: "src/", type: "dir", color: C.textDim, id: "wt-fix-src", desc: "Working files for fix/issue-99 branch" },
    { depth: 2, name: "CLAUDE.md", type: "file", color: C.purple, id: "claude-fix", desc: "Worktree-specific CLAUDE.md for fix session" },
  ];

  return (
    <div>
      <SectionTitle color={C.orange} subtitle="Full filesystem layout of a project with two active worktrees. Click any row for details.">
        Directory Layout
      </SectionTitle>

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        {/* Tree view */}
        <div style={{ flex: "1 1 340px" }}>
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 12, padding: 16, fontFamily: mono.fontFamily,
          }}>
            {/* Terminal header */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFBD2E" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
              <span style={{ ...mono, fontSize: 10, color: C.textDim, marginLeft: 6 }}>filesystem tree</span>
            </div>
            {tree.map(node => (
              <div
                key={node.id}
                onClick={() => setHighlighted(highlighted === node.id ? null : node.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 0,
                  padding: "3px 6px", borderRadius: 5, cursor: "pointer",
                  background: highlighted === node.id ? `${node.color}15` : "transparent",
                  transition: "background 0.12s",
                }}
              >
                <span style={{ color: C.border, userSelect: "none" }}>
                  {"  ".repeat(node.depth)}
                  {node.depth > 0 ? "├─ " : ""}
                </span>
                <span style={{
                  fontSize: 13, color: node.color,
                  fontWeight: node.type === "dir" ? 600 : 400,
                }}>
                  {node.name}
                </span>
                {node.type === "dir" && <span style={{ fontSize: 11, color: C.textDim, marginLeft: 4 }}>/</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Description panel */}
        <div style={{ flex: "0 0 260px" }}>
          {highlighted ? (
            (() => {
              const node = tree.find(n => n.id === highlighted);
              return node ? (
                <div style={{
                  background: C.card, border: `1.5px solid ${node.color}40`,
                  borderRadius: 12, padding: 16,
                }}>
                  <div style={{ ...mono, fontSize: 14, fontWeight: 700, color: node.color, marginBottom: 8 }}>
                    {node.name}
                  </div>
                  <Tag color={node.type === "dir" ? C.blue : C.textDim}>{node.type}</Tag>
                  <p style={{ ...sans, fontSize: 13, color: C.text, lineHeight: 1.6, marginTop: 12 }}>
                    {node.desc}
                  </p>
                </div>
              ) : null;
            })()
          ) : (
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: 16,
            }}>
              <div style={{ ...sans, fontSize: 13, color: C.textDim, lineHeight: 1.6 }}>
                Click any file or directory in the tree to see a description of its role in the worktree setup.
              </div>
              <div style={{ marginTop: 16 }}>
                <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Legend</div>
                {[
                  { color: C.yellow, label: "Shared .git store" },
                  { color: C.green, label: "Worktree checkouts" },
                  { color: C.blue, label: "Worktree metadata" },
                  { color: C.purple, label: "CLAUDE.md files" },
                  { color: C.textDim, label: "Working files" },
                ].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color, flexShrink: 0 }} />
                    <span style={{ ...sans, fontSize: 12, color: C.textSoft }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick facts */}
          <div style={{ marginTop: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14 }}>
            <div style={{ ...sans, fontSize: 11, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 10 }}>Quick Facts</div>
            {[
              { fact: "The .git in a worktree", detail: "is a plain file, not a directory — contains a single gitdir: pointer" },
              { fact: "CLAUDE.md resolution", detail: "Worktree CLAUDE.md → project CLAUDE.md → user CLAUDE.md" },
              { fact: "Branch exclusivity", detail: "The same branch cannot be checked out in two worktrees simultaneously" },
              { fact: "Disk usage", detail: "Only working files duplicated — shared objects compress to near-zero overhead" },
            ].map(({ fact, detail }) => (
              <div key={fact} style={{ marginBottom: 10 }}>
                <div style={{ ...mono, fontSize: 11, color: C.cyan }}>{fact}</div>
                <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 2 }}>{detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────
const TABS = [
  { id: "arch", label: "Architecture", color: C.green },
  { id: "parallel", label: "Parallel Flow", color: C.blue },
  { id: "branch", label: "/branch Command", color: C.cyan },
  { id: "coordination", label: "Coordination Patterns", color: C.yellow },
  { id: "layout", label: "Directory Layout", color: C.orange },
];

export default function WorktreesDiagram() {
  const [tab, setTab] = useState("arch");

  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: "28px 24px", fontFamily: sans.fontFamily, color: C.text, minHeight: 500, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ ...sans, fontSize: 24, fontWeight: 800, color: C.white, margin: 0, letterSpacing: -0.5 }}>
            Git Worktrees & Parallel Development
          </h1>
          <p style={{ ...sans, fontSize: 13, color: C.textDim, margin: "6px 0 0" }}>
            Parallel Claude Code sessions · Shared .git store · /branch command · Agent Teams
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Tag color={C.green}>git worktree</Tag>
          <Tag color={C.textDim}>Claude Code</Tag>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: "flex", gap: 6, marginBottom: 28, borderBottom: `1px solid ${C.border}`, paddingBottom: 0, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...sans, fontSize: 14, fontWeight: 600, cursor: "pointer",
              padding: "10px 18px", borderRadius: "8px 8px 0 0",
              background: tab === t.id ? `${t.color}15` : "transparent",
              border: `1.5px solid ${tab === t.id ? t.color + "60" : "transparent"}`,
              borderBottom: tab === t.id ? `2px solid ${t.color}` : "1.5px solid transparent",
              color: tab === t.id ? t.color : C.textSoft,
              transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "arch" && <ArchitectureTab />}
      {tab === "parallel" && <ParallelFlowTab />}
      {tab === "branch" && <BranchCommandTab />}
      {tab === "coordination" && <CoordinationTab />}
      {tab === "layout" && <DirectoryLayoutTab />}
    </div>
  );
}
