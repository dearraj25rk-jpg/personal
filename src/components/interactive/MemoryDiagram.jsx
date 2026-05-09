import { useState } from "react";

const DARK = {
  bg:      "#0d1117",
  panel:   "#161b22",
  border:  "#30363d",
  text:    "#e6edf3",
  muted:   "#8b949e",
  accent:  "#d2a8ff",
  teal:    "#39d353",
  blue:    "#58a6ff",
  orange:  "#ffa657",
  red:     "#f87171",
  yellow:  "#f0c060",
  card:    "#21262d",
  hover:   "#1c2129",
};

const MEMORY_TYPES = [
  {
    id: "enterprise",
    label: "1. Enterprise CLAUDE.md",
    scope: "All users on machine",
    location: "macOS: /Library/Application Support/ClaudeCode/CLAUDE.md\nLinux: /etc/claude-code/CLAUDE.md\nWindows: C:\\Program Files\\ClaudeCode\\CLAUDE.md",
    when: "Always — session start, first, highest priority",
    survives: "Yes (always re-loaded)",
    gitTracked: "No — deployed via MDM/Ansible/Intune",
    limit: "No size limit (full content loaded)",
    canExclude: "No — managed files cannot be excluded",
    tokenCost: "Permanent per-session overhead",
    color: DARK.red,
    icon: "🏢",
    priority: "Highest — cannot be overridden",
    writtenBy: "IT/DevOps via config management",
    purpose: "Org-wide coding standards, security policies, compliance requirements, approved tools.",
    example: `# Enterprise Policy — Acme Corp\n## Security\n- Never commit secrets or API keys\n- All endpoints require authentication middleware\n- Use parameterized queries only\n## Compliance\n- GDPR: All PII must be encrypted at rest\n- SOC2: Audit logging required for data access`,
  },
  {
    id: "user",
    label: "2. User CLAUDE.md",
    scope: "You — all projects",
    location: "~/.claude/CLAUDE.md",
    when: "Always — session start, after Enterprise",
    survives: "Yes (re-injected each session)",
    gitTracked: "No",
    limit: "No size limit (full content loaded)",
    canExclude: "Yes — via claudeMdExcludes in settings",
    tokenCost: "Permanent per-session overhead",
    color: DARK.blue,
    icon: "👤",
    priority: "High — after Enterprise, before Project",
    writtenBy: "You (manual)",
    purpose: "Personal coding preferences, interaction style, shortcuts that travel with you across all projects.",
    example: `# Personal Preferences — Raj\n## Coding Style\n- Prefer functional patterns\n- Always add XML doc comments on public methods\n## Interaction\n- Before changes, propose a plan first\n- Keep solutions minimal\n- When unsure, ask rather than assume`,
  },
  {
    id: "project",
    label: "3. Project CLAUDE.md",
    scope: "Team — this project",
    location: "./CLAUDE.md  or  ./.claude/CLAUDE.md",
    when: "Always — session start. ONLY file that survives /compact",
    survives: "YES — re-read from disk after /compact",
    gitTracked: "Yes — committed to repo",
    limit: "No size limit (full content loaded)",
    canExclude: "Yes — via claudeMdExcludes (per-developer)",
    tokenCost: "Permanent per-session overhead",
    color: DARK.teal,
    icon: "🏗️",
    priority: "High — after User, before Local",
    writtenBy: "Team (committed to git). Use /init to auto-generate.",
    purpose: "Team-shared conventions: tech stack, build commands, architecture overview, code style rules.",
    example: `# ACME Insurance API\n## Tech Stack\n.NET 9, EF Core, MediatR, SQL Server\n## Commands\n- dotnet build\n- dotnet test\n- dotnet run --project src/Api\n## Architecture\nClean Architecture: Domain/Application/Infrastructure/WebApi\nAll endpoints require JWT auth`,
  },
  {
    id: "local",
    label: "4. CLAUDE.local.md",
    scope: "You — this project only",
    location: "./CLAUDE.local.md (auto-gitignored)",
    when: "Always — session start",
    survives: "No — not re-loaded after /compact automatically",
    gitTracked: "No — auto-added to .gitignore",
    limit: "No size limit (full content loaded)",
    canExclude: "Yes — via claudeMdExcludes",
    tokenCost: "Permanent per-session overhead",
    color: DARK.orange,
    icon: "🔒",
    priority: "High — most specific personal override",
    writtenBy: "You (manual, personal)",
    purpose: "Personal project overrides: sandbox URLs, local test DB credentials, debugging preferences. Not shared with team.",
    example: `# My Local Settings — ACME API\n## Dev Environment\n- Sandbox API: https://raj-sandbox.azurewebsites.net\n- Test DB: Server=.\\MSSQLLocalDB;Database=AcmeTest\n## Personal Workflow\n- Use lazygit for git operations\n- Always run dotnet format before showing diffs`,
  },
  {
    id: "subtree",
    label: "5. Subtree CLAUDE.md",
    scope: "Files in that subdirectory",
    location: "Any subdirectory: src/Domain/CLAUDE.md, packages/auth/CLAUDE.md",
    when: "ON DEMAND — lazy-loaded when Claude reads/edits files in that directory",
    survives: "No — does NOT survive /compact; reloads on next dir access",
    gitTracked: "Yes (if committed)",
    limit: "No size limit (full content loaded when triggered)",
    canExclude: "Via claudeMdExcludes",
    tokenCost: "Zero until triggered; then permanent for that session",
    color: DARK.yellow,
    icon: "📁",
    priority: "High (context-specific — most targeted)",
    writtenBy: "Team (per-subdomain)",
    purpose: "Domain-specific instructions for a subsystem. Only loaded when Claude works in that area.",
    example: `# Domain Layer Rules\n- ZERO infrastructure dependencies from Domain layer\n- All entities inherit from BaseEntity<TId>\n- Value Objects for: money, dates, policy numbers\n- Aggregate roots are only public entry points\n- Result<T> for all operations that can fail`,
  },
  {
    id: "automemory",
    label: "6. Auto-Memory (MEMORY.md)",
    scope: "You — this project (all worktrees share one)",
    location: "~/.claude/projects/<project-hash>/memory/MEMORY.md\n+ satellite <topic>.md files",
    when: "Session start — first 200 lines OR 25KB (whichever first)",
    survives: "Re-injected each session from the 200-line window",
    gitTracked: "No — machine-local",
    limit: "200 lines OR 25KB hard cap at session start",
    canExclude: "CLAUDE_CODE_DISABLE_AUTO_MEMORY=1",
    tokenCost: "Up to 200 lines / 25KB per session",
    color: DARK.accent,
    icon: "🧠",
    priority: "Normal — auto-maintained by Claude",
    writtenBy: "Claude itself — when you say 'remember this'",
    purpose: "Durable cross-session learning: architecture patterns, team conventions, personal preferences learned over time.",
    example: `# Auto-Memory — ACME API\n## Architecture Patterns\n- CQRS: Queries→ViewModels, Commands→Result<T>\n- All data access via IRepository<T>\n## Team Conventions Learned\n- Always run dotnet format before commit\n- Use pnpm not npm in this project\n## Reminders\n- UserService has circular dep with NotificationService (CC-234)`,
  },
  {
    id: "subagent",
    label: "7. Subagent MEMORY.md",
    scope: "Individual subagent (per agent name)",
    location: "user: ~/.claude/agent-memory/<agent>/MEMORY.md\nproject: .claude/agent-memory/<agent>/MEMORY.md\nlocal: .claude/agent-memory/local/<agent>/MEMORY.md",
    when: "At subagent invocation — first 200 lines OR 25KB",
    survives: "Persists across invocations (written by agent)",
    gitTracked: "user: No · project: Yes · local: No",
    limit: "200 lines OR 25KB cap at invocation",
    canExclude: "Don't set memory scope in agent frontmatter",
    tokenCost: "On-use only (at invocation)",
    color: "#79c0ff",
    icon: "🤖",
    priority: "Normal (in subagent context)",
    writtenBy: "The subagent itself (auto-maintained)",
    purpose: "Persistent learning for subagents: codebase patterns, review history, architecture discoveries.",
    example: `# Code Reviewer Memory — ACME API\n## Architecture Patterns Observed\n- CQRS via MediatR, Queries→ViewModels\n## Known Issues\n- PaymentController bypasses validation — always flag\n## PR Review Checklist Learned\n- Check FluentValidation on all new commands\n- Verify new endpoints added to Swagger groups`,
  },
];

const ATIMPORT_INFO = {
  id: "import",
  label: "@import Syntax",
  description: "Any CLAUDE.md can import other files with @path/to/file syntax. Inline expansion at load time — imported content becomes part of the parent file's token cost.",
  syntax: `# CLAUDE.md\n@./standards/coding-style.md\n@./standards/security-rules.md\n@~/.claude/company-policy.md`,
  rules: [
    "Max 5 recursive hops",
    "Relative or absolute paths",
    "Not expanded inside code blocks",
    "Loaded when parent loads — adds to parent's token cost",
    "All worktrees share imports from shared paths",
  ],
};

const COMMANDS = [
  { cmd: "/memory", desc: "View all loaded files, toggle auto-memory, open memory files in editor" },
  { cmd: "/compact [instructions]", desc: "Summarize conversation, free context, restore project CLAUDE.md from disk" },
  { cmd: "/init", desc: "Auto-generate project CLAUDE.md from codebase analysis" },
  { cmd: "/clear", desc: "Reset conversation — keeps all CLAUDE.md files loaded" },
];

export default function MemoryDiagram() {
  const [selected, setSelected] = useState(MEMORY_TYPES[2]);
  const [tab, setTab] = useState("overview");

  return (
    <div style={{
      background: DARK.bg,
      color: DARK.text,
      fontFamily: "'Inter', 'system-ui', sans-serif",
      minHeight: "600px",
      borderRadius: "12px",
      padding: "24px",
      maxWidth: "1100px",
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: 0, fontSize: "1.4rem", color: DARK.accent, fontWeight: 700 }}>
          Claude Code Memory System
        </h2>
        <p style={{ margin: "6px 0 0", color: DARK.muted, fontSize: "0.875rem" }}>
          All 7 memory types — scope, load timing, limits, and survival rules · v2.1.126 (May 2026)
        </p>
      </div>

      {/* Tab Nav */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["overview", "detail", "hierarchy", "commands"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "6px 16px", borderRadius: "6px", border: "1px solid",
            borderColor: tab === t ? DARK.accent : DARK.border,
            background: tab === t ? "rgba(210,168,255,0.15)" : DARK.card,
            color: tab === t ? DARK.accent : DARK.muted,
            cursor: "pointer", fontSize: "0.85rem", fontWeight: 500, textTransform: "capitalize",
          }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div>
          <p style={{ color: DARK.muted, fontSize: "0.85rem", marginBottom: "16px" }}>
            Click any memory type to explore its properties →
          </p>
          <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {MEMORY_TYPES.map(m => (
              <div key={m.id}
                onClick={() => { setSelected(m); setTab("detail"); }}
                style={{
                  background: selected?.id === m.id ? DARK.hover : DARK.card,
                  border: `1px solid ${selected?.id === m.id ? m.color : DARK.border}`,
                  borderRadius: "10px", padding: "14px", cursor: "pointer",
                  transition: "all 0.15s",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "1.2rem" }}>{m.icon}</span>
                  <span style={{ color: m.color, fontWeight: 600, fontSize: "0.9rem" }}>{m.label}</span>
                </div>
                <div style={{ color: DARK.muted, fontSize: "0.8rem", marginBottom: "4px" }}>
                  📍 {m.scope}
                </div>
                <div style={{ color: DARK.muted, fontSize: "0.8rem" }}>
                  ⏱ {m.when.substring(0, 60)}{m.when.length > 60 ? "…" : ""}
                </div>
                <div style={{ marginTop: "8px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px",
                    background: m.gitTracked === "Yes — committed to repo" ? "rgba(57,211,83,0.15)" : "rgba(139,148,158,0.15)",
                    color: m.gitTracked === "Yes — committed to repo" ? DARK.teal : DARK.muted,
                  }}>
                    {m.gitTracked.startsWith("Yes") ? "git tracked" : "not tracked"}
                  </span>
                  <span style={{
                    fontSize: "0.7rem", padding: "2px 8px", borderRadius: "4px",
                    background: m.survives.startsWith("YES") ? "rgba(57,211,83,0.15)" : "rgba(248,113,113,0.15)",
                    color: m.survives.startsWith("YES") ? DARK.teal : DARK.red,
                  }}>
                    {m.survives.startsWith("YES") ? "survives /compact" : "lost on /compact"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "detail" && selected && (
        <div>
          <div style={{
            background: DARK.card, borderRadius: "12px", padding: "20px",
            border: `1px solid ${selected.color}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "1.6rem" }}>{selected.icon}</span>
              <div>
                <h3 style={{ margin: 0, color: selected.color, fontSize: "1.1rem" }}>{selected.label}</h3>
                <div style={{ color: DARK.muted, fontSize: "0.8rem" }}>{selected.priority}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              {[
                ["📍 Scope", selected.scope],
                ["📁 Location", selected.location],
                ["⏱ When Loaded", selected.when],
                ["🔄 Survives /compact", selected.survives],
                ["📝 Git Tracked", selected.gitTracked],
                ["📦 Size Limit", selected.limit],
                ["🚫 Can Exclude", selected.canExclude],
                ["💰 Token Cost", selected.tokenCost],
                ["✍️ Written By", selected.writtenBy],
              ].map(([k, v]) => (
                <div key={k} style={{
                  background: DARK.panel, borderRadius: "8px", padding: "10px",
                  border: `1px solid ${DARK.border}`,
                }}>
                  <div style={{ color: DARK.muted, fontSize: "0.75rem", marginBottom: "4px" }}>{k}</div>
                  <div style={{ color: DARK.text, fontSize: "0.82rem", whiteSpace: "pre-wrap" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background: DARK.panel, borderRadius: "8px", padding: "12px", marginBottom: "12px" }}>
              <div style={{ color: DARK.muted, fontSize: "0.75rem", marginBottom: "6px" }}>PURPOSE</div>
              <div style={{ color: DARK.text, fontSize: "0.85rem" }}>{selected.purpose}</div>
            </div>
            <div style={{ background: "#0d1117", borderRadius: "8px", padding: "12px" }}>
              <div style={{ color: DARK.muted, fontSize: "0.75rem", marginBottom: "6px" }}>EXAMPLE CONTENT</div>
              <pre style={{ margin: 0, fontSize: "0.78rem", color: DARK.teal, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                {selected.example}
              </pre>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
            {MEMORY_TYPES.map(m => (
              <button key={m.id} onClick={() => setSelected(m)} style={{
                padding: "4px 12px", borderRadius: "6px", border: `1px solid`,
                borderColor: selected.id === m.id ? m.color : DARK.border,
                background: selected.id === m.id ? "rgba(255,255,255,0.05)" : "transparent",
                color: selected.id === m.id ? m.color : DARK.muted,
                cursor: "pointer", fontSize: "0.78rem",
              }}>
                {m.icon} {m.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === "hierarchy" && (
        <div>
          <div style={{ background: DARK.card, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 12px", color: DARK.accent, fontSize: "1rem" }}>Load Order & Precedence</h3>
            <div style={{ fontFamily: "monospace", fontSize: "0.8rem", lineHeight: "1.8" }}>
              {MEMORY_TYPES.map((m, i) => (
                <div key={m.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "6px 0", borderBottom: i < MEMORY_TYPES.length - 1 ? `1px solid ${DARK.border}` : "none" }}>
                  <span style={{ color: m.color, width: "24px", textAlign: "center" }}>{m.icon}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ color: m.color, fontWeight: 600 }}>{m.label}</span>
                    <span style={{ color: DARK.muted, marginLeft: "8px", fontSize: "0.75rem" }}>
                      {m.when.split(" — ")[0]}
                    </span>
                  </div>
                  <span style={{
                    padding: "1px 8px", borderRadius: "4px", fontSize: "0.7rem",
                    background: m.survives.startsWith("YES") ? "rgba(57,211,83,0.15)" : "rgba(248,113,113,0.12)",
                    color: m.survives.startsWith("YES") ? DARK.teal : DARK.red,
                  }}>
                    {m.survives.startsWith("YES") ? "survives compact" : m.survives.startsWith("Re") ? "re-injected" : "lost on compact"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* @import box */}
          <div style={{ background: DARK.card, borderRadius: "12px", padding: "20px", border: `1px solid ${DARK.accent}` }}>
            <h3 style={{ margin: "0 0 10px", color: DARK.accent, fontSize: "1rem" }}>@import Syntax</h3>
            <p style={{ color: DARK.muted, fontSize: "0.82rem", margin: "0 0 10px" }}>
              {ATIMPORT_INFO.description}
            </p>
            <pre style={{ background: "#0d1117", borderRadius: "8px", padding: "12px", margin: "0 0 10px", fontSize: "0.8rem", color: DARK.teal, fontFamily: "monospace" }}>
              {ATIMPORT_INFO.syntax}
            </pre>
            <ul style={{ margin: 0, padding: "0 0 0 16px", color: DARK.muted, fontSize: "0.82rem" }}>
              {ATIMPORT_INFO.rules.map((r, i) => <li key={i} style={{ marginBottom: "4px" }}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}

      {tab === "commands" && (
        <div>
          <div style={{ background: DARK.card, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 12px", color: DARK.accent, fontSize: "1rem" }}>Memory-Related Commands</h3>
            {COMMANDS.map(c => (
              <div key={c.cmd} style={{
                display: "grid", gridTemplateColumns: "220px 1fr",
                borderBottom: `1px solid ${DARK.border}`, padding: "10px 0", gap: "16px",
              }}>
                <code style={{ color: DARK.blue, fontFamily: "monospace", fontSize: "0.85rem" }}>{c.cmd}</code>
                <span style={{ color: DARK.text, fontSize: "0.85rem" }}>{c.desc}</span>
              </div>
            ))}
          </div>

          <div style={{ background: DARK.card, borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 12px", color: DARK.accent, fontSize: "1rem" }}>Environment Variables</h3>
            <div style={{ fontFamily: "monospace", fontSize: "0.8rem", lineHeight: "2" }}>
              {[
                ["CLAUDE_CODE_DISABLE_AUTO_MEMORY=1", "Disable auto-memory for a session"],
                ["CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=...", "Load CLAUDE.md files from extra directories"],
                ["claudeMdExcludes (settings.json)", "Glob patterns to skip specific CLAUDE.md files"],
                ["autoMemoryDirectory (settings.json)", "Custom auto-memory storage directory (user settings only)"],
              ].map(([k, v]) => (
                <div key={k} style={{ borderBottom: `1px solid ${DARK.border}`, padding: "6px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <span style={{ color: DARK.orange }}>{k}</span>
                  <span style={{ color: DARK.muted }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: "20px", fontSize: "0.75rem", color: DARK.muted, textAlign: "center" }}>
        Claude Code v2.1.126 · May 2026 · code.claude.com/docs/en/memory
      </div>
    </div>
  );
}
