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
  // Phase colors
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
};

// Shared styles
const mono = { fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace" };
const sans = { fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" };

function SectionTitle({ children, color = C.blue, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: color }} />
        <h2 style={{ ...sans, fontSize: 20, fontWeight: 800, color: C.white, margin: 0, letterSpacing: -0.3 }}>{children}</h2>
      </div>
      {subtitle && <p style={{ ...sans, fontSize: 13, color: C.textDim, margin: "6px 0 0 16px" }}>{subtitle}</p>}
    </div>
  );
}

function Arrow({ label, color = C.textDim, dashed = false, direction = "down" }) {
  const isDown = direction === "down";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: isDown ? "6px 0" : "0 6px" }}>
      <div style={{
        width: isDown ? 2 : 30,
        height: isDown ? 20 : 2,
        background: dashed ? `repeating-linear-gradient(${isDown ? "to bottom" : "to right"}, ${color} 0px, ${color} 4px, transparent 4px, transparent 8px)` : color,
      }} />
      <div style={{ fontSize: 16, color, lineHeight: 1, marginTop: isDown ? -2 : 0 }}>
        {isDown ? "▼" : "▶"}
      </div>
      {label && <div style={{ ...sans, fontSize: 10, color, marginTop: 2, fontStyle: "italic", textAlign: "center" }}>{label}</div>}
    </div>
  );
}

function FileBox({ name, path, color, bg, border, note, small, gitIcon, width }) {
  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${border}`,
      borderRadius: 10,
      padding: small ? "8px 12px" : "10px 14px",
      width: width || "auto",
      flex: width ? undefined : 1,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ ...sans, fontSize: small ? 12 : 13, fontWeight: 700, color }}>{name}</span>
        {gitIcon !== undefined && (
          <span style={{ fontSize: 10, marginLeft: "auto", flexShrink: 0 }}>{gitIcon ? "📦 git" : "🔒 local"}</span>
        )}
      </div>
      <div style={{ ...mono, fontSize: 10, color: C.textDim, marginTop: 3, wordBreak: "break-all" }}>{path}</div>
      {note && <div style={{ ...sans, fontSize: 10, color: C.textSoft, marginTop: 4, lineHeight: 1.4 }}>{note}</div>}
    </div>
  );
}

function ConnectorLine({ color = C.textDim, style: extraStyle }) {
  return <div style={{ width: 2, background: color, alignSelf: "center", minHeight: 16, ...extraStyle }} />;
}

function Badge({ children, color, bg, border }) {
  return (
    <span style={{
      ...sans, display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
      color, background: bg, border: `1px solid ${border}`,
    }}>{children}</span>
  );
}

function App() {
  return (
    <div style={{
      ...sans, background: C.bg, color: C.text,
      maxWidth: 900, margin: "0 auto", padding: "0 20px 60px", borderRadius: 8,
    }}>
      {/* ═══════════ HEADER ═══════════ */}
      <div style={{ padding: "32px 0 24px", borderBottom: `1px solid ${C.border}`, marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, letterSpacing: -0.5, lineHeight: 1.2 }}>
          <span style={{ color: C.blue }}>Claude Code</span>
          <span style={{ color: C.white }}> — Complete Markdown File Architecture</span>
        </h1>
        <p style={{ fontSize: 14, color: C.textSoft, margin: "8px 0 16px", lineHeight: 1.5 }}>
          How all 16 markdown file types load, flow, and connect across the session lifecycle
        </p>
        
        {/* Legend */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Badge color={C.green} bg={C.greenBg} border={C.greenBorder}>● Always Loaded</Badge>
          <Badge color={C.yellow} bg={C.yellowBg} border={C.yellowBorder}>● On-Demand</Badge>
          <Badge color={C.purple} bg={C.purpleBg} border={C.purpleBorder}>● User-Invoked</Badge>
          <Badge color={C.red} bg={C.redBg} border={C.redBorder}>● System Prompt Modifier</Badge>
          <Badge color={C.cyan} bg={C.cyanBg} border={C.cyanBorder}>● Auto-Generated</Badge>
          <Badge color={C.orange} bg={C.orangeBg} border={C.orangeBorder}>● Plugin-Bundled</Badge>
        </div>
      </div>

      {/* ═══════════ SECTION 1: SESSION START ═══════════ */}
      <SectionTitle color={C.green} subtitle="These files are read and injected into context the moment you run 'claude' in your terminal">
        Phase 1 — Session Start: Always-Loaded Memory
      </SectionTitle>

      {/* Priority Stack */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 20, marginBottom: 12,
      }}>
        <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
          Memory Hierarchy — Top wins on conflict (Priority ① → ⑥)
        </div>

        {/* Stack of boxes connected by arrows */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "stretch" }}>
          
          {/* Enterprise */}
          <FileBox
            name="① Enterprise CLAUDE.md"
            path="/Library/Application Support/ClaudeCode/CLAUDE.md  (macOS)"
            color={C.green} bg={C.greenBg} border={C.greenBorder}
            gitIcon={false}
            note="Highest priority. Deployed by IT via MDM/Ansible. Org-wide security policies, compliance rules."
          />
          <Arrow label="overridden by higher priority ↑  ·  merges down ↓" color={C.greenDim} />

          {/* User */}
          <FileBox
            name="② User CLAUDE.md"
            path="~/.claude/CLAUDE.md"
            color={C.green} bg={C.greenBg} border={C.greenBorder}
            gitIcon={false}
            note="Your personal preferences across ALL projects — coding style, interaction mode."
          />
          <Arrow color={C.greenDim} />

          {/* Project */}
          <div style={{ position: "relative" }}>
            <FileBox
              name="③ Project CLAUDE.md"
              path="./CLAUDE.md  OR  .claude/CLAUDE.md"
              color={C.green} bg={C.greenBg} border={C.greenBorder}
              gitIcon={true}
              note="Team-shared project identity. Tech stack, commands, conventions. Bootstrap with /init. Supports @imports."
            />
            {/* @import callout */}
            <div style={{
              position: "absolute", right: -8, top: "50%", transform: "translateY(-50%) translateX(0)",
              display: "none", // hidden on small screens, shown conceptually
            }}>
            </div>
          </div>

          {/* Import annotation */}
          <div style={{ display: "flex", gap: 8, alignItems: "stretch", marginTop: 6, marginBottom: 6, marginLeft: 30 }}>
            <div style={{ width: 2, background: C.blueBorder, borderRadius: 1 }} />
            <div style={{
              flex: 1, background: C.blueBg, border: `1px dashed ${C.blueBorder}`, borderRadius: 8,
              padding: "8px 12px",
            }}>
              <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: C.blue }}>📎 @Imported Files</div>
              <div style={{ ...mono, fontSize: 10, color: C.textDim, marginTop: 2 }}>
                @README.md &nbsp; @docs/standards.md &nbsp; @~/.claude/my-prefs.md
              </div>
              <div style={{ ...sans, fontSize: 10, color: C.textSoft, marginTop: 3 }}>
                Any file referenced with @path inside CLAUDE.md. Max 5 recursive hops. Adds to parent's token cost.
              </div>
            </div>
          </div>
          
          <Arrow color={C.greenDim} />

          {/* Local */}
          <FileBox
            name="④ CLAUDE.local.md"
            path="./CLAUDE.local.md"
            color={C.green} bg={C.greenBg} border={C.greenBorder}
            gitIcon={false}
            note="Most specific. Auto-gitignored. Your sandbox URLs, local DB, personal project overrides."
          />
          <Arrow color={C.greenDim} />

          {/* Global Rules */}
          <FileBox
            name="⑤ Global Rules (no paths: frontmatter)"
            path=".claude/rules/*.md  — files WITHOUT paths: field"
            color={C.green} bg={C.greenBg} border={C.greenBorder}
            gitIcon={true}
            note="Modular alternative to monolithic CLAUDE.md. Each .md in .claude/rules/ with no paths: field loads always. Same priority as CLAUDE.md."
          />
          <Arrow color={C.greenDim} />

          {/* Subtree (parent directories) */}
          <FileBox
            name="⑥ Parent Directory CLAUDE.md files"
            path="Walks UP from cwd to root — every CLAUDE.md found is loaded"
            color={C.green} bg={C.greenBg} border={C.greenBorder}
            gitIcon={true}
            note="In a monorepo, if cwd is /repo/packages/api, it loads CLAUDE.md from /repo/packages/api/, /repo/packages/, /repo/, etc."
          />
          <Arrow color={C.cyan} dashed />

          {/* Project MEMORY.md (Auto-Generated, Always Loaded) */}
          <FileBox
            name="⑭ MEMORY.md"
            path=".claude/MEMORY.md"
            color={C.cyan} bg={C.cyanBg} border={C.cyanBorder}
            gitIcon={true}
            note="v2.1.59+. Claude Code auto-generates this. Records discovered project facts, patterns, preferences. Capped at 200 lines. You read it; Claude writes it."
          />
        </div>

        {/* Merged result */}
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <div style={{
            display: "inline-block", background: "rgba(52,211,153,0.15)", border: `2px solid ${C.green}`,
            borderRadius: 10, padding: "10px 24px",
          }}>
            <span style={{ ...sans, fontSize: 13, fontWeight: 800, color: C.green }}>
              ✅ All merged → Claude's initial context (permanent token cost)
            </span>
          </div>
        </div>
      </div>

      {/* Also at startup: frontmatter scan */}
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 20, marginBottom: 32,
      }}>
        <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
          Also at Session Start — Lightweight Scan (frontmatter only, ~100-150 tokens each)
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px" }}>
            <FileBox
              name="Skills (frontmatter only)"
              path="~/.claude/skills/*/SKILL.md  &  .claude/skills/*/SKILL.md"
              color={C.yellow} bg={C.yellowBg} border={C.yellowBorder} small
              note="Only name + description extracted. Full body NOT loaded yet. This is how Claude knows what skills exist."
            />
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <FileBox
              name="Agent Definitions (config)"
              path="~/.claude/agents/*.md  &  .claude/agents/*.md"
              color={C.purple} bg={C.purpleBg} border={C.purpleBorder} small
              note="Frontmatter loaded so Claude knows which agents are available. Agent system prompt NOT loaded until invoked."
            />
          </div>
          <div style={{ flex: "1 1 200px" }}>
            <FileBox
              name="Command Names"
              path="~/.claude/commands/*.md  &  .claude/commands/*.md"
              color={C.purple} bg={C.purpleBg} border={C.purpleBorder} small
              note="Names + descriptions registered for /autocomplete. Command body NOT loaded until user types /command."
            />
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 2: DURING SESSION ═══════════ */}
      <SectionTitle color={C.yellow} subtitle="These files load conditionally based on what Claude is doing or what you ask for">
        Phase 2 — During Session: On-Demand Loading
      </SectionTitle>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 20, marginBottom: 12,
      }}>
        {/* Trigger → Load diagram */}
        <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 14 }}>
          Trigger → What Gets Loaded
        </div>

        {/* Each trigger-response pair */}
        {[
          {
            trigger: "Claude touches a file matching a paths: glob pattern",
            triggerIcon: "📂",
            file: "Path-Scoped Rules",
            path: ".claude/rules/*.md — files WITH paths: field",
            color: C.yellow, bg: C.yellowBg, border: C.yellowBorder,
            detail: "Rule file loads ONLY when Claude reads/writes files matching its paths: glob. Zero tokens until then.",
            example: 'paths: ["src/api/**/*.ts"] → loads only when Claude touches API files',
          },
          {
            trigger: "Claude enters a child subdirectory to read/edit files",
            triggerIcon: "📁",
            file: "Subtree CLAUDE.md",
            path: "<subdir>/CLAUDE.md (e.g. src/Domain/CLAUDE.md)",
            color: C.yellow, bg: C.yellowBg, border: C.yellowBorder,
            detail: "NOT loaded at startup. Only when Claude accesses files in that specific subdirectory.",
            example: "src/Domain/CLAUDE.md loads when Claude edits src/Domain/Policy.cs",
          },
          {
            trigger: "User message matches a skill's description (LLM reasoning)",
            triggerIcon: "🧠",
            file: "Skill Full Body",
            path: "~/.claude/skills/*/SKILL.md  OR  .claude/skills/*/SKILL.md",
            color: C.yellow, bg: C.yellowBg, border: C.yellowBorder,
            detail: "Frontmatter was already loaded. Now the FULL SKILL.md body loads as a tool result. Supporting files load only if Claude reads them.",
            example: 'User: "deploy to staging" → matches skill description → loads full deploy skill',
          },
        ].map((item, i) => (
          <div key={i} style={{ marginBottom: i < 2 ? 16 : 0 }}>
            {/* Trigger */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
              borderRadius: 8, padding: "8px 12px", marginBottom: 6,
            }}>
              <span style={{ fontSize: 18 }}>{item.triggerIcon}</span>
              <div>
                <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: C.text }}>TRIGGER: {item.trigger}</div>
                <div style={{ ...mono, fontSize: 10, color: C.textDim, marginTop: 2 }}>{item.example}</div>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 20 }}>
              <span style={{ color: C.yellow, fontSize: 14 }}>↳</span>
              <div style={{ flex: 1 }}>
                <FileBox name={item.file} path={item.path} color={item.color} bg={item.bg} border={item.border} small note={item.detail} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ SECTION 3: USER/MODEL INVOKED ═══════════ */}
      <SectionTitle color={C.purple} subtitle="These run when YOU explicitly invoke them (/command) or when Claude delegates work">
        Phase 3 — Explicit Invocation: Commands, Agents, Skills
      </SectionTitle>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 20, marginBottom: 12,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Commands */}
          <div>
            <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Slash Commands — You type /command-name
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 250px" }}>
                <FileBox
                  name="Personal Commands"
                  path="~/.claude/commands/*.md"
                  color={C.purple} bg={C.purpleBg} border={C.purpleBorder} small
                  gitIcon={false}
                  note="Available in ALL projects. Filename = /command name. Supports $ARGUMENTS, @file injection, !shell output."
                />
              </div>
              <div style={{ flex: "1 1 250px" }}>
                <FileBox
                  name="Project Commands"
                  path=".claude/commands/*.md"
                  color={C.purple} bg={C.purpleBg} border={C.purpleBorder} small
                  gitIcon={true}
                  note="Team-shared. Subdirectories organize but don't change /name. Frontmatter: description, allowed-tools, model."
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: C.border }} />

          {/* Agents */}
          <div>
            <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Subagents — Claude delegates or you ask "use the X agent"
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 250px" }}>
                <FileBox
                  name="Personal Agents"
                  path="~/.claude/agents/*.md"
                  color={C.purple} bg={C.purpleBg} border={C.purpleBorder} small
                  gitIcon={false}
                  note="YAML frontmatter = config (name, tools, model, memory, hooks). Body = system prompt. Runs in its OWN context window."
                />
              </div>
              <div style={{ flex: "1 1 250px" }}>
                <FileBox
                  name="Project Agents"
                  path=".claude/agents/*.md"
                  color={C.purple} bg={C.purpleBg} border={C.purpleBorder} small
                  gitIcon={true}
                  note="Same format. Team-shared via git. Create with /agents or manually."
                />
              </div>
            </div>

            {/* Agent invocation detail */}
            <div style={{
              marginTop: 10, marginLeft: 20, background: C.cyanBg,
              border: `1px dashed ${C.cyanBorder}`, borderRadius: 8, padding: "8px 12px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 14 }}>🧠</span>
                <span style={{ ...sans, fontSize: 11, fontWeight: 700, color: C.cyan }}>When an agent is invoked, it can auto-load:</span>
              </div>
              <div style={{ marginTop: 6 }}>
                <FileBox
                  name="MEMORY.md — Subagent Auto Memory"
                  path="~/.claude/agent-memory/<agent-name>/MEMORY.md"
                  color={C.cyan} bg={C.cyanBg} border={C.cyanBorder} small
                  note="First 200 lines loaded into the subagent's system prompt. The agent WRITES this file itself — saves learnings, patterns, discoveries across sessions. Scope: user | project | local."
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: C.border }} />

          {/* Skills (manual invoke) */}
          <div>
            <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: C.purple, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              Skills — You type /skill-name OR Claude auto-invokes
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 250px" }}>
                <FileBox
                  name="Personal Skills"
                  path="~/.claude/skills/<name>/SKILL.md"
                  color={C.yellow} bg={C.yellowBg} border={C.yellowBorder} small
                  gitIcon={false}
                  note="Can include supporting files (scripts/, templates/, *.md). Frontmatter: name, description, allowed-tools, context, agent."
                />
              </div>
              <div style={{ flex: "1 1 250px" }}>
                <FileBox
                  name="Project Skills"
                  path=".claude/skills/<name>/SKILL.md"
                  color={C.yellow} bg={C.yellowBg} border={C.yellowBorder} small
                  gitIcon={true}
                  note='Team-shared. disable-model-invocation: true → only manual /invoke. context: fork → runs in subagent.'
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 4: OUTPUT STYLES ═══════════ */}
      <SectionTitle color={C.red} subtitle="The most powerful modifier — directly REPLACES parts of Claude's default system prompt">
        Phase 4 — Output Styles: System Prompt Replacement
      </SectionTitle>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 20, marginBottom: 12,
      }}>
        {/* Comparison */}
        <div style={{
          display: "flex", gap: 1, borderRadius: 8, overflow: "hidden", marginBottom: 16,
          border: `1px solid ${C.border}`,
        }}>
          {[
            { label: "CLAUDE.md", how: "Adds user message after system prompt", power: "Low", color: C.green },
            { label: "--append-system-prompt", how: "Appends to end of system prompt", power: "Medium", color: C.blue },
            { label: "Output Styles", how: "REPLACES default SE instructions", power: "High ⚡", color: C.red },
          ].map((item, i) => (
            <div key={i} style={{ flex: 1, padding: "10px 12px", background: C.card }}>
              <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: item.color }}>{item.label}</div>
              <div style={{ ...sans, fontSize: 10, color: C.textSoft, marginTop: 4, lineHeight: 1.4 }}>{item.how}</div>
              <div style={{ ...sans, fontSize: 10, fontWeight: 700, color: item.color, marginTop: 4 }}>Power: {item.power}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <div style={{ flex: "1 1 250px" }}>
            <FileBox
              name="Personal Output Styles"
              path="~/.claude/output-styles/*.md"
              color={C.red} bg={C.redBg} border={C.redBorder} small
              gitIcon={false}
              note="Activated via /output-style command. Frontmatter: name, description, keep-coding-instructions (default: false)."
            />
          </div>
          <div style={{ flex: "1 1 250px" }}>
            <FileBox
              name="Project Output Styles"
              path=".claude/output-styles/*.md"
              color={C.red} bg={C.redBg} border={C.redBorder} small
              gitIcon={true}
              note="Team-shared. keep-coding-instructions: true preserves default SE behavior alongside custom style."
            />
          </div>
        </div>

        {/* Built-in styles */}
        <div style={{ ...sans, fontSize: 11, fontWeight: 600, color: C.textDim, marginBottom: 6 }}>Built-in Styles (no file needed):</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { name: "Default", desc: "Standard software engineering" },
            { name: "Explanatory", desc: 'Adds educational "Insights"' },
            { name: "Learning", desc: "Adds TODO(human) markers for you" },
          ].map(s => (
            <div key={s.name} style={{
              ...sans, padding: "6px 10px", borderRadius: 6,
              background: C.card, border: `1px solid ${C.border}`, fontSize: 11,
            }}>
              <span style={{ fontWeight: 700, color: C.text }}>{s.name}</span>
              <span style={{ color: C.textDim }}> — {s.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ SECTION 5: PLUGINS ═══════════ */}
      <SectionTitle color={C.orange} subtitle="Plugins bundle commands, agents, skills, and styles — same formats, namespaced">
        Phase 5 — Plugins: Bundled Components
      </SectionTitle>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 20, marginBottom: 32,
      }}>
        <div style={{ ...mono, fontSize: 12, color: C.textSoft, lineHeight: 2, marginBottom: 14 }}>
          <span style={{ color: C.orange, fontWeight: 700 }}>my-plugin/</span><br/>
          ├── <span style={{ color: C.textDim }}>.claude-plugin/</span><br/>
          │&nbsp;&nbsp; └── <span style={{ color: C.orange }}>plugin.json</span> <span style={{ color: C.textDim }}>← manifest (only required file)</span><br/>
          ├── <span style={{ color: C.purple }}>commands/*.md</span> <span style={{ color: C.textDim }}>← slash commands (namespaced: /plugin:cmd)</span><br/>
          ├── <span style={{ color: C.purple }}>agents/*.md</span> <span style={{ color: C.textDim }}>← subagent definitions</span><br/>
          ├── <span style={{ color: C.yellow }}>skills/*/SKILL.md</span> <span style={{ color: C.textDim }}>← skills with supporting files</span><br/>
          ├── <span style={{ color: C.red }}>output-styles/*.md</span> <span style={{ color: C.textDim }}>← custom output styles</span><br/>
          ├── <span style={{ color: C.textDim }}>hooks.json</span> <span style={{ color: C.textDim }}>← lifecycle hooks (JSON)</span><br/>
          ├── <span style={{ color: C.textDim }}>.mcp.json</span> <span style={{ color: C.textDim }}>← MCP server configs (JSON)</span><br/>
          └── <span style={{ color: C.textDim }}>.lsp.json</span> <span style={{ color: C.textDim }}>← language server configs (JSON)</span>
        </div>
        <div style={{ ...sans, fontSize: 11, color: C.textSoft, lineHeight: 1.5 }}>
          All markdown components use the <strong style={{ color: C.text }}>exact same format</strong> as their personal/project counterparts.
          Plugin commands are namespaced: <code style={{ ...mono, color: C.orange, fontSize: 11 }}>hello.md</code> in plugin <code style={{ ...mono, color: C.orange, fontSize: 11 }}>my-plugin</code> → <code style={{ ...mono, color: C.orange, fontSize: 11 }}>/my-plugin:hello</code>.
          Plugins are copied to a cache directory — they cannot reference files outside their root.
        </div>
      </div>

      {/* ═══════════ SECTION 6: TOKEN BUDGET ═══════════ */}
      <SectionTitle color={C.white} subtitle="How all these files consume the 200K context window">
        Context Window Budget — 200K Tokens
      </SectionTitle>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 20, marginBottom: 32, overflow: "hidden",
      }}>
        {/* Visual bar */}
        <div style={{ display: "flex", height: 32, borderRadius: 6, overflow: "hidden", marginBottom: 16, border: `1px solid ${C.border}` }}>
          {[
            { pct: 7, color: "#374151", label: "System Prompt" },
            { pct: 8, color: C.greenDim, label: "CLAUDE.md + Rules" },
            { pct: 3, color: C.yellowDim, label: "Frontmatter" },
            { pct: 8, color: C.purpleBg, label: "On-Demand", border: `1px dashed ${C.purpleBorder}` },
            { pct: 52, color: C.blueDim, label: "Conversation" },
            { pct: 22, color: "#1E293B", label: "Response Buffer" },
          ].map((item, i) => (
            <div key={i} style={{
              width: `${item.pct}%`, background: item.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRight: i < 5 ? `1px solid ${C.bg}` : "none",
              border: item.border || "none",
            }}>
              {item.pct >= 8 && (
                <span style={{ ...sans, fontSize: 9, color: "#fff", fontWeight: 600, textShadow: "0 1px 2px rgba(0,0,0,0.5)" }}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Breakdown table */}
        {[
          { label: "System Prompt (built-in)", tokens: "~5–15K", type: "fixed", color: "#6B7280" },
          { label: "Enterprise + User + Project + Local CLAUDE.md", tokens: "~2–15K", type: "fixed", color: C.green },
          { label: "Global Rules (no paths:)", tokens: "~1–5K", type: "fixed", color: C.green },
          { label: "@Imported files", tokens: "varies", type: "fixed", color: C.blue },
          { label: "Skill frontmatter + Agent defs + MCP schemas", tokens: "~1–5K", type: "fixed", color: C.yellow },
          { label: "Path-scoped Rules", tokens: "varies", type: "demand", color: C.yellow },
          { label: "Subtree CLAUDE.md", tokens: "varies", type: "demand", color: C.yellow },
          { label: "Skill full body + supporting files", tokens: "varies", type: "demand", color: C.yellow },
          { label: "Slash command content", tokens: "varies", type: "demand", color: C.purple },
          { label: "Conversation messages + tool results", tokens: "~140–150K", type: "main", color: C.blue },
          { label: "Response buffer (thinking + output)", tokens: "~40–45K", type: "reserved", color: "#6B7280" },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "6px 8px",
            borderBottom: i < 10 ? `1px solid ${C.border}` : "none",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
            <span style={{ ...sans, flex: 1, fontSize: 12, color: C.textSoft }}>{item.label}</span>
            <span style={{ ...mono, fontSize: 11, color: C.text, fontWeight: 600, flexShrink: 0 }}>{item.tokens}</span>
            <Badge
              color={item.type === "fixed" ? C.green : item.type === "demand" ? C.yellow : item.type === "main" ? C.blue : C.textDim}
              bg={item.type === "fixed" ? C.greenBg : item.type === "demand" ? C.yellowBg : item.type === "main" ? C.blueBg : "transparent"}
              border={item.type === "fixed" ? C.greenBorder : item.type === "demand" ? C.yellowBorder : item.type === "main" ? C.blueBorder : C.border}
            >
              {item.type === "fixed" ? "Always" : item.type === "demand" ? "On-Demand" : item.type === "main" ? "Conversation" : "Reserved"}
            </Badge>
          </div>
        ))}
      </div>

      {/* ═══════════ SECTION 7: COMPLETE LIFECYCLE FLOW ═══════════ */}
      <SectionTitle color={C.blue} subtitle="End-to-end flow: what happens from 'claude' to Claude's response">
        Complete Session Lifecycle Flow
      </SectionTitle>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 20, marginBottom: 32,
      }}>
        {[
          {
            step: "1",
            title: "You run `claude` in terminal",
            detail: "Claude Code starts, identifies working directory",
            color: C.textSoft,
          },
          {
            step: "2",
            title: "Memory Hierarchy Loads",
            detail: "Enterprise → User → Parent dirs → Project → Local → Global Rules → @imports — all merged into context",
            color: C.green,
          },
          {
            step: "3",
            title: "Lightweight Scan",
            detail: "Skills (frontmatter only), agent definitions (config only), command names registered for autocomplete",
            color: C.yellow,
          },
          {
            step: "4",
            title: "Output Style Applied",
            detail: "If non-default style active → replaces default SE instructions in system prompt",
            color: C.red,
          },
          {
            step: "5",
            title: "You send a message / type /command",
            detail: "Your prompt enters the context alongside all loaded memory",
            color: C.blue,
          },
          {
            step: "6",
            title: "On-Demand Loading Triggers",
            detail: "Path-scoped rules, subtree CLAUDE.md, skill bodies load based on what Claude needs",
            color: C.yellow,
          },
          {
            step: "7",
            title: "Agent Delegation (if needed)",
            detail: "Subagent spawns in separate context → loads its MEMORY.md (200 lines) → works independently → returns summary",
            color: C.purple,
          },
          {
            step: "8",
            title: "Claude Responds",
            detail: "Uses all loaded context to generate response. On-demand files stay loaded for remainder of session.",
            color: C.blue,
          },
          {
            step: "9",
            title: "Auto Memory Updates",
            detail: "Subagent MEMORY.md updated with discoveries. Session memory saved. Context carries forward until /clear or /compact.",
            color: C.cyan,
          },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 12, marginBottom: i < 8 ? 4 : 0 }}>
            {/* Step number + line */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: item.color === C.textSoft ? C.card : `${item.color}20`,
                border: `2px solid ${item.color}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                ...sans, fontSize: 12, fontWeight: 800, color: item.color,
              }}>
                {item.step}
              </div>
              {i < 8 && <div style={{ width: 2, flex: 1, minHeight: 12, background: C.border }} />}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingBottom: i < 8 ? 8 : 0 }}>
              <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: item.color }}>{item.title}</div>
              <div style={{ ...sans, fontSize: 11, color: C.textSoft, marginTop: 2, lineHeight: 1.5 }}>{item.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════ SECTION 8: QUICK DECISION GUIDE ═══════════ */}
      <SectionTitle color={C.pink} subtitle="Which file to use for what?">
        Decision Guide — Where Does Your Instruction Belong?
      </SectionTitle>

      <div style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        padding: 20, marginBottom: 20,
      }}>
        {[
          { q: "Every interaction + under 10 lines?", a: "→ CLAUDE.md", color: C.green },
          { q: "Every interaction + longer / domain-specific?", a: "→ Global Rule (.claude/rules/*.md)", color: C.green },
          { q: "Only specific file types?", a: "→ Path-scoped Rule (paths: frontmatter)", color: C.yellow },
          { q: "Only specific subdirectory?", a: "→ Subtree CLAUDE.md (subdir/CLAUDE.md)", color: C.yellow },
          { q: "Reusable prompt you invoke manually?", a: "→ Slash Command (.claude/commands/)", color: C.purple },
          { q: "Multi-step workflow with scripts/templates?", a: "→ Skill (.claude/skills/*/SKILL.md)", color: C.yellow },
          { q: "Delegated work needing own context?", a: "→ Subagent (.claude/agents/*.md)", color: C.purple },
          { q: "Change how Claude responds entirely?", a: "→ Output Style (.claude/output-styles/)", color: C.red },
          { q: "Org-wide mandatory policy?", a: "→ Enterprise CLAUDE.md (system path)", color: C.green },
          { q: "Personal prefs, all projects?", a: "→ User CLAUDE.md (~/.claude/)", color: C.green },
          { q: "Personal prefs, one project?", a: "→ CLAUDE.local.md", color: C.green },
        ].map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 0",
            borderBottom: i < 10 ? `1px solid ${C.border}` : "none",
          }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
            <span style={{ ...sans, flex: 1, fontSize: 12, color: C.textSoft }}>{item.q}</span>
            <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: item.color, flexShrink: 0 }}>{item.a}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
export default App;
