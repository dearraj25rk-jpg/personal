import React, { useState } from 'react';

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
  yellowBorder: "rgba(251,146,60,0.25)",
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
  // style-specific accent colours (matching spec)
  styleDefault: "#58a6ff",
  styleExplanatory: "#ffa657",
  styleLearning: "#7ee787",
  styleCustom: "#d2a8ff",
};

const mono = { fontFamily: "'JetBrains Mono','Fira Code','SF Mono',Consolas,monospace" };
const sans = { fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" };

// ── Data ──────────────────────────────────────────────────────────────

const STYLES = [
  {
    id: "default",
    label: "Default",
    activatedBy: "Always active when no style selected",
    color: C.styleDefault,
    icon: "◎",
    what: "Uses the standard SE-specific system prompt shipped with Claude Code. No modifications.",
    tokenCost: "1× baseline",
    tokenMult: 1.0,
    outputChar: "Concise, focused on correctness, minimal prose",
    codeComments: "Minimal — code speaks for itself",
    bestFor: ["Experienced developers", "Production code", "Daily work", "Speed-focused sessions"],
    replacesSePrompt: false,
  },
  {
    id: "explanatory",
    label: "Explanatory",
    activatedBy: "explanatory",
    color: C.styleExplanatory,
    icon: "◈",
    what: "Replaces the SE-specific prompt with one that includes detailed explanations, rationale for decisions, and architectural context in every response.",
    tokenCost: "1.4–1.6× default",
    tokenMult: 1.5,
    outputChar: "Verbose, includes reasoning, shows alternatives considered",
    codeComments: "Detailed — explains why, not just what",
    bestFor: ["Learning mode", "Code review sessions", "Onboarding new team members", "Architecture discussions"],
    replacesSePrompt: true,
  },
  {
    id: "learning",
    label: "Learning",
    activatedBy: "learning",
    color: C.styleLearning,
    icon: "◇",
    what: "Replaces the SE-specific prompt with teaching-focused instructions — explains concepts from first principles, adds examples, uses a progressive learning approach.",
    tokenCost: "1.8–2.2× default",
    tokenMult: 2.0,
    outputChar: "Tutorial-style, step-by-step, includes exercises and analogies",
    codeComments: "Comprehensive and educational — explains every non-trivial line",
    bestFor: ["Learning a new tech stack", "Junior developers", "Documentation generation", "Concept deep-dives"],
    replacesSePrompt: true,
  },
  {
    id: "custom",
    label: "Custom",
    activatedBy: "<your-style-name>",
    color: C.styleCustom,
    icon: "◆",
    what: "Any .md file in .claude/output-styles/ becomes a style. The frontmatter defines the name and behaviour; the body becomes the replacement SE prompt.",
    tokenCost: "Depends on style content",
    tokenMult: null,
    outputChar: "Fully user-defined",
    codeComments: "Fully user-defined",
    bestFor: ["Team-standardised output", "Domain-specific formatting", "Vertical-specific personas", "Compliance-driven output"],
    replacesSePrompt: true,
  },
];

const CUSTOM_TEMPLATE = `---
name: concise-reviewer
description: Terse code-review voice — bullet points, no prose
keep-coding-instructions: true
---

You are a senior code reviewer. Your responses follow these rules:

- Use bullet points for all feedback
- Lead each bullet with the file and line number
- Rate severity: [critical] [major] [minor] [nit]
- Never write full paragraphs; every sentence is a bullet
- For code suggestions use diff blocks
- End each review with a one-line summary score`;

const SETTINGS_JSON = `// ~/.claude/settings.json  (or project .claude/settings.json)
{
  "outputStyle": "explanatory"
}`;

const CONFIG_STEPS = [
  {
    step: "1",
    title: "Via /config command",
    color: C.blue,
    content: `> /config\n\n→ Opens the tabbed settings UI\n→ Navigate to "Output Style" tab\n→ Select a style from the dropdown\n→ Change takes effect immediately`,
  },
  {
    step: "2",
    title: "Via settings.json default",
    color: C.cyan,
    content: SETTINGS_JSON,
  },
  {
    step: "3",
    title: "Via custom command frontmatter",
    color: C.purple,
    content: `---\ndescription: Review PR with detailed explanations\noutput-style: explanatory\n---\n\nReview the current pull request thoroughly.`,
  },
];

// ── Sub-components ────────────────────────────────────────────────────

function SectionTitle({ children, color = C.blue, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 4, height: 28, borderRadius: 2, background: color }} />
        <h2 style={{ ...sans, fontSize: 20, fontWeight: 800, color: C.white, margin: 0 }}>{children}</h2>
      </div>
      {subtitle && (
        <p style={{ ...sans, fontSize: 13, color: C.textDim, margin: "6px 0 0 16px" }}>{subtitle}</p>
      )}
    </div>
  );
}

function Tag({ children, color = C.blue }) {
  return (
    <span style={{
      ...mono, fontSize: 10, fontWeight: 600, color,
      background: `${color}18`,
      border: `1px solid ${color}40`,
      borderRadius: 4, padding: "2px 6px",
    }}>
      {children}
    </span>
  );
}

function WarningBox({ children }) {
  return (
    <div style={{
      background: `${C.yellow}0f`,
      border: `1.5px solid ${C.yellow}50`,
      borderRadius: 10,
      padding: "14px 18px",
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
      <div style={{ ...sans, fontSize: 13, color: C.textSoft, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function InfoBox({ children, color = C.blue }) {
  return (
    <div style={{
      background: `${color}0f`,
      border: `1.5px solid ${color}40`,
      borderRadius: 10,
      padding: "14px 18px",
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    }}>
      <span style={{ fontSize: 15, flexShrink: 0, color }}>ℹ</span>
      <div style={{ ...sans, fontSize: 13, color: C.textSoft, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

// System Prompt Structure Diagram
function SystemPromptDiagram({ activeStyle }) {
  const style = STYLES.find(s => s.id === activeStyle) || STYLES[0];

  const layers = [
    {
      label: "Anthropic Core System Prompt",
      sublabel: "Values, safety, capabilities — never modifiable",
      color: C.red,
      height: 52,
      locked: true,
    },
    {
      label: style.id === "default"
        ? "SE-Specific Prompt (default)"
        : style.id === "custom"
        ? `SE-Specific Prompt → replaced by: ${style.activatedBy}`
        : `SE-Specific Prompt → replaced by: ${style.label} style`,
      sublabel: style.replacesSePrompt
        ? "← THIS LAYER IS REPLACED by the selected output style"
        : "Verify tests, prefer targeted edits, avoid unrelated changes…",
      color: style.replacesSePrompt ? style.color : C.green,
      height: 60,
      locked: false,
      replaced: style.replacesSePrompt,
    },
    {
      label: "CLAUDE.md / Memory Files",
      sublabel: "Project context, rules, persona — loaded from disk",
      color: C.cyan,
      height: 52,
      locked: false,
    },
    {
      label: "Conversation History",
      sublabel: "Previous turns in the current session",
      color: C.textDim,
      height: 44,
      locked: false,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 8 }}>
      {layers.map((layer, i) => (
        <div key={i} style={{
          background: layer.replaced ? `${layer.color}18` : C.card,
          border: `1.5px solid ${layer.replaced ? layer.color + "60" : C.border}`,
          borderRadius: i === 0 ? "10px 10px 0 0" : i === layers.length - 1 ? "0 0 10px 10px" : 0,
          borderTopWidth: i > 0 ? 0 : "1.5px",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: layer.height,
          transition: "all 0.25s ease",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: layer.color, flexShrink: 0 }} />
              <span style={{ ...sans, fontSize: 13, fontWeight: 700, color: layer.replaced ? layer.color : C.text }}>
                {layer.label}
              </span>
              {layer.locked && <Tag color={C.red}>locked</Tag>}
              {layer.replaced && <Tag color={layer.color}>replaced</Tag>}
            </div>
            <p style={{ ...sans, fontSize: 11, color: C.textDim, margin: "4px 0 0 16px" }}>{layer.sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Style card with expand/collapse
function StyleCard({ style, expanded, onToggle }) {
  return (
    <div
      onClick={onToggle}
      style={{
        background: expanded ? `${style.color}10` : C.card,
        border: `1.5px solid ${expanded ? style.color + "50" : C.border}`,
        borderRadius: 12,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        userSelect: "none",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, lineHeight: 1, color: style.color }}>{style.icon}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ ...sans, fontSize: 15, fontWeight: 800, color: style.color }}>{style.label}</span>
              {style.id !== "custom" && (
                <Tag color={style.color}>{style.activatedBy}</Tag>
              )}
              {style.replacesSePrompt && <Tag color={C.orange}>replaces SE prompt</Tag>}
              {!style.replacesSePrompt && <Tag color={C.green}>default</Tag>}
            </div>
            <p style={{ ...sans, fontSize: 11, color: C.textDim, margin: "3px 0 0 0" }}>
              Token cost: {style.tokenCost}
            </p>
          </div>
        </div>
        <span style={{ ...sans, fontSize: 16, color: C.textDim, transition: "transform 0.2s", display: "inline-block", transform: expanded ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <p style={{ ...sans, fontSize: 13, color: C.textSoft, margin: "0 0 12px 0", lineHeight: 1.6 }}>
              {style.what}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: C.surface, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ ...sans, fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Output Style</div>
                <div style={{ ...sans, fontSize: 12, color: C.textSoft }}>{style.outputChar}</div>
              </div>
              <div style={{ background: C.surface, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ ...sans, fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 }}>Code Comments</div>
                <div style={{ ...sans, fontSize: 12, color: C.textSoft }}>{style.codeComments}</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ ...sans, fontSize: 10, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Best for</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {style.bestFor.map(b => (
                <span key={b} style={{
                  ...sans, fontSize: 11, color: style.color,
                  background: `${style.color}12`,
                  border: `1px solid ${style.color}30`,
                  borderRadius: 20, padding: "3px 10px",
                }}>{b}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 1: Style Overview ─────────────────────────────────────────────

function TabStyleOverview() {
  const [expandedId, setExpandedId] = useState("default");
  const [diagramStyle, setDiagramStyle] = useState("default");

  return (
    <div>
      <SectionTitle
        color={C.blue}
        subtitle="Click any card to expand details. Hover the diagram to see which layer gets replaced."
      >
        Built-in Output Styles
      </SectionTitle>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
        {STYLES.filter(s => s.id !== "custom").map(style => (
          <StyleCard
            key={style.id}
            style={style}
            expanded={expandedId === style.id}
            onToggle={() => {
              setExpandedId(expandedId === style.id ? null : style.id);
              setDiagramStyle(style.id);
            }}
          />
        ))}
      </div>

      {/* System Prompt Diagram */}
      <SectionTitle
        color={C.orange}
        subtitle="Shows which layer of the system prompt is replaced when a style is active"
      >
        System Prompt Structure
      </SectionTitle>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        {STYLES.filter(s => s.id !== "custom").map(s => (
          <button
            key={s.id}
            onClick={() => setDiagramStyle(s.id)}
            style={{
              ...sans, fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20,
              border: `1.5px solid ${diagramStyle === s.id ? s.color : C.border}`,
              background: diagramStyle === s.id ? `${s.color}18` : "transparent",
              color: diagramStyle === s.id ? s.color : C.textSoft,
              cursor: "pointer",
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>
      <SystemPromptDiagram activeStyle={diagramStyle} />

      {/* Custom Styles Section */}
      <div style={{ marginTop: 28 }}>
        <SectionTitle color={C.styleCustom} subtitle="Store .md files in .claude/output-styles/ to create your own">
          Custom Output Styles
        </SectionTitle>

        <WarningBox>
          <strong style={{ color: C.yellow }}>Critical:</strong> Always include{" "}
          <code style={{ ...mono, color: C.cyan }}>keep-coding-instructions: true</code> in custom style frontmatter.
          Without it, the style <strong>completely removes</strong> the SE-specific instructions (verify tests, prefer
          targeted edits, don't hallucinate APIs, etc.) that keep Claude safe and accurate. Only omit this if you
          intentionally want to replace ALL of Claude's SE behaviour.
        </WarningBox>

        <div style={{ marginTop: 16 }}>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, marginBottom: 6 }}>
            .claude/output-styles/concise-reviewer.md
          </div>
          <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{
              background: C.card, padding: "8px 16px",
              display: "flex", alignItems: "center", gap: 8,
              borderBottom: `1px solid ${C.border}`,
            }}>
              <span style={{ ...mono, fontSize: 11, color: C.styleCustom }}>custom style template</span>
              <Tag color={C.styleCustom}>keep-coding-instructions: true</Tag>
            </div>
            <pre style={{
              ...mono, fontSize: 12, color: C.textSoft, margin: 0,
              padding: "16px 20px", overflowX: "auto", lineHeight: 1.75,
            }}>
              {CUSTOM_TEMPLATE}
            </pre>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, marginBottom: 8 }}>Frontmatter fields for custom styles</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {[
              { field: "name", type: "string", required: true, desc: "Identifier used with /config and settings.json" },
              { field: "description", type: "string", required: false, desc: "Shown in the /config style picker UI" },
              { field: "keep-coding-instructions", type: "boolean", required: false, desc: "When true, APPENDS your style to SE prompt instead of replacing it. Strongly recommended." },
            ].map(f => (
              <div key={f.field} style={{
                background: C.card,
                border: `1.5px solid ${f.field === "keep-coding-instructions" ? C.yellow + "40" : C.border}`,
                borderRadius: 10, padding: "12px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                  <span style={{ ...mono, fontSize: 13, fontWeight: 700, color: f.field === "keep-coding-instructions" ? C.yellow : C.styleCustom }}>
                    {f.field}
                  </span>
                  <Tag color={C.blue}>{f.type}</Tag>
                  {f.required && <Tag color={C.red}>required</Tag>}
                  {f.field === "keep-coding-instructions" && <Tag color={C.yellow}>important</Tag>}
                </div>
                <p style={{ ...sans, fontSize: 12, color: C.textSoft, margin: 0, lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Token Cost Impact ──────────────────────────────────────────

const MODELS = [
  { id: "sonnet", label: "Sonnet 4.6", inCost: 3, outCost: 15, color: C.blue },
  { id: "opus", label: "Opus 4.8", inCost: 15, outCost: 75, color: C.purple },
];

function TabTokenCost() {
  const [baseTokens, setBaseTokens] = useState(40000);
  const [selectedModel, setSelectedModel] = useState("sonnet");

  const model = MODELS.find(m => m.id === selectedModel);

  // Assume 30% input (system + user), 70% output (assistant responses)
  // Style multiplier applies mainly to output tokens
  const calcCost = (mult) => {
    const inputTokens = baseTokens * 0.3;
    const outputTokens = baseTokens * 0.7 * mult;
    const inputCost = (inputTokens / 1_000_000) * model.inCost;
    const outputCost = (outputTokens / 1_000_000) * model.outCost;
    return { inputTokens, outputTokens, inputCost, outputCost, total: inputCost + outputCost };
  };

  const scenarios = [
    { style: STYLES[0], mult: 1.0 },
    { style: STYLES[1], mult: 1.5 },
    { style: STYLES[2], mult: 2.0 },
  ];

  const maxCost = Math.max(...scenarios.map(s => calcCost(s.mult).total));

  const fmt = (n) => n < 0.01 ? "<$0.01" : `$${n.toFixed(3)}`;
  const fmtK = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(0);

  return (
    <div>
      <SectionTitle
        color={C.green}
        subtitle="Estimate the cost impact of switching output styles for a typical coding session"
      >
        Token Cost Impact
      </SectionTitle>

      {/* Controls */}
      <div style={{
        background: C.card,
        border: `1.5px solid ${C.border}`,
        borderRadius: 12,
        padding: "18px 20px",
        marginBottom: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <label style={{ ...sans, fontSize: 13, fontWeight: 600, color: C.textSoft }}>
              Base Session Tokens
            </label>
            <span style={{ ...mono, fontSize: 13, color: C.green }}>
              {fmtK(baseTokens)} tokens
            </span>
          </div>
          <input
            type="range"
            min={10000}
            max={100000}
            step={5000}
            value={baseTokens}
            onChange={e => setBaseTokens(Number(e.target.value))}
            style={{ width: "100%", accentColor: C.green, cursor: "pointer" }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ ...mono, fontSize: 10, color: C.textDim }}>10K</span>
            <span style={{ ...mono, fontSize: 10, color: C.textDim }}>100K</span>
          </div>
        </div>

        <div>
          <div style={{ ...sans, fontSize: 13, fontWeight: 600, color: C.textSoft, marginBottom: 8 }}>Model</div>
          <div style={{ display: "flex", gap: 8 }}>
            {MODELS.map(m => (
              <button
                key={m.id}
                onClick={() => setSelectedModel(m.id)}
                style={{
                  ...sans, fontSize: 12, fontWeight: 600, padding: "6px 16px", borderRadius: 8,
                  border: `1.5px solid ${selectedModel === m.id ? m.color : C.border}`,
                  background: selectedModel === m.id ? `${m.color}18` : "transparent",
                  color: selectedModel === m.id ? m.color : C.textSoft,
                  cursor: "pointer",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 6 }}>
            {model.label}: ${model.inCost}/M input · ${model.outCost}/M output
          </div>
        </div>
      </div>

      {/* Bar chart */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
        {scenarios.map(({ style, mult }) => {
          const { inputTokens, outputTokens, inputCost, outputCost, total } = calcCost(mult);
          const barPct = maxCost > 0 ? (total / maxCost) * 100 : 0;
          return (
            <div key={style.id} style={{
              background: C.card,
              border: `1.5px solid ${C.border}`,
              borderRadius: 12,
              padding: "14px 18px",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16, color: style.color }}>{style.icon}</span>
                  <span style={{ ...sans, fontSize: 14, fontWeight: 700, color: style.color }}>{style.label}</span>
                  <Tag color={style.color}>{style.tokenCost}</Tag>
                </div>
                <span style={{ ...mono, fontSize: 14, fontWeight: 700, color: C.white }}>{fmt(total)}</span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 12, background: C.surface, borderRadius: 6, overflow: "hidden", marginBottom: 8 }}>
                <div style={{
                  height: "100%",
                  width: `${barPct}%`,
                  background: `linear-gradient(90deg, ${style.color}bb, ${style.color})`,
                  borderRadius: 6,
                  transition: "width 0.4s ease",
                }} />
              </div>

              {/* Token breakdown */}
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ ...mono, fontSize: 11, color: C.textDim }}>
                  input: {fmtK(inputTokens)} → {fmt(inputCost)}
                </div>
                <div style={{ ...mono, fontSize: 11, color: C.textDim }}>
                  output: {fmtK(outputTokens)} → {fmt(outputCost)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trade-off insight */}
      <InfoBox color={C.cyan}>
        <div>
          <strong style={{ color: C.cyan }}>The trade-off to consider:</strong> A{" "}
          <span style={{ color: C.styleLearning }}>Learning</span> style session costs ~2× more per turn, but may
          eliminate 3–5 follow-up questions that would each consume another full turn. If explanatory output reduces
          rework and context-reloading, the net token cost can be <em>lower</em> than using the default style
          inefficiently.
        </div>
      </InfoBox>

      {/* Cost table */}
      <div style={{ marginTop: 24 }}>
        <div style={{ ...sans, fontSize: 13, fontWeight: 600, color: C.textSoft, marginBottom: 10 }}>
          Side-by-side at {fmtK(baseTokens)} base tokens — {model.label}
        </div>
        <div style={{
          background: C.card,
          border: `1.5px solid ${C.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}>
          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            background: C.surface,
            borderBottom: `1px solid ${C.border}`,
            padding: "8px 16px",
          }}>
            {["Style", "Multiplier", "Total Tokens", "Cost"].map(h => (
              <div key={h} style={{ ...sans, fontSize: 11, fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: 0.7 }}>{h}</div>
            ))}
          </div>
          {scenarios.map(({ style, mult }, i) => {
            const { inputTokens, outputTokens, total } = calcCost(mult);
            const totalTokens = inputTokens + outputTokens;
            return (
              <div key={style.id} style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr",
                padding: "10px 16px",
                borderBottom: i < scenarios.length - 1 ? `1px solid ${C.border}` : "none",
                background: "transparent",
              }}>
                <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: style.color }}>{style.label}</div>
                <div style={{ ...mono, fontSize: 12, color: C.textSoft }}>{mult.toFixed(1)}×</div>
                <div style={{ ...mono, fontSize: 12, color: C.textSoft }}>{fmtK(totalTokens)}</div>
                <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.white }}>{fmt(total)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Configuration ──────────────────────────────────────────────

function ToggleSwitch({ value, onChange, labelOn, labelOff, color = C.green }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: value ? color : C.surface,
          border: `1.5px solid ${value ? color : C.border}`,
          cursor: "pointer",
          position: "relative",
          transition: "all 0.2s ease",
          padding: 0,
        }}
      >
        <div style={{
          position: "absolute",
          width: 16, height: 16,
          borderRadius: "50%",
          background: C.white,
          top: 2,
          left: value ? 22 : 2,
          transition: "left 0.2s ease",
          boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
        }} />
      </button>
      <span style={{ ...sans, fontSize: 13, color: value ? color : C.textSoft, fontWeight: 600 }}>
        {value ? labelOn : labelOff}
      </span>
    </div>
  );
}

function TabConfiguration() {
  const [keepCodingInstructions, setKeepCodingInstructions] = useState(true);
  const [defaultStyle, setDefaultStyle] = useState("default");

  const settingsPreview = `{
  "outputStyle": "${defaultStyle}"
}`;

  const customPreviewFrontmatter = `---
name: my-style
description: My custom output style
keep-coding-instructions: ${keepCodingInstructions}
---

${keepCodingInstructions
  ? "# Additional Instructions\n\nYour style instructions here.\nThese APPEND to the SE-specific prompt."
  : "# Full Style Override\n\n⚠ WARNING: SE coding instructions are REMOVED.\nYou must restate any SE rules you want to keep."}`;

  return (
    <div>
      <SectionTitle
        color={C.cyan}
        subtitle="Three ways to activate output styles, plus the keep-coding-instructions field explained"
      >
        Activating Output Styles
      </SectionTitle>

      {/* Step cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
        {CONFIG_STEPS.map(step => (
          <div key={step.step} style={{
            background: C.card,
            border: `1.5px solid ${step.color}30`,
            borderRadius: 12,
            overflow: "hidden",
          }}>
            <div style={{
              background: `${step.color}12`,
              borderBottom: `1px solid ${step.color}25`,
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: step.color, color: C.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                ...sans, fontSize: 12, fontWeight: 800, flexShrink: 0,
              }}>{step.step}</div>
              <span style={{ ...sans, fontSize: 14, fontWeight: 700, color: step.color }}>{step.title}</span>
            </div>
            <pre style={{
              ...mono, fontSize: 12, color: C.textSoft,
              margin: 0, padding: "14px 20px",
              overflowX: "auto", lineHeight: 1.7,
            }}>{step.content}</pre>
          </div>
        ))}
      </div>

      {/* Directory Structure */}
      <SectionTitle color={C.orange} subtitle="Where Claude Code looks for output style definitions">
        Directory Structure
      </SectionTitle>
      <div style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 28,
      }}>
        {[
          { path: ".claude/", indent: 0, color: C.textDim, note: "" },
          { path: "output-styles/", indent: 1, color: C.orange, note: "← style files live here" },
          { path: "explanatory.md", indent: 2, color: C.styleExplanatory, note: "built-in (do not edit)" },
          { path: "learning.md", indent: 2, color: C.styleLearning, note: "built-in (do not edit)" },
          { path: "my-custom-style.md", indent: 2, color: C.styleCustom, note: "your custom style" },
          { path: "another-style.md", indent: 2, color: C.styleCustom, note: "another custom style" },
          { path: "commands/", indent: 1, color: C.textDim, note: "" },
          { path: "agents/", indent: 1, color: C.textDim, note: "" },
          { path: "settings.json", indent: 1, color: C.cyan, note: "set outputStyle here" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 0, lineHeight: "1.9" }}>
            <span style={{ ...mono, fontSize: 12, color: C.textDim }}>
              {"  ".repeat(item.indent)}
              {item.indent > 0 ? "├─ " : ""}
            </span>
            <span style={{ ...mono, fontSize: 12, color: item.color, fontWeight: item.indent < 2 ? 700 : 400 }}>
              {item.path}
            </span>
            {item.note && (
              <span style={{ ...mono, fontSize: 11, color: C.textDim, marginLeft: 8 }}>{item.note}</span>
            )}
          </div>
        ))}
      </div>

      {/* Interactive keep-coding-instructions demo */}
      <SectionTitle
        color={C.yellow}
        subtitle="Toggle to see what happens to the custom style template"
      >
        keep-coding-instructions Explorer
      </SectionTitle>

      <div style={{
        background: C.card,
        border: `1.5px solid ${C.border}`,
        borderRadius: 12,
        padding: "18px 20px",
        marginBottom: 16,
      }}>
        <ToggleSwitch
          value={keepCodingInstructions}
          onChange={setKeepCodingInstructions}
          labelOn="keep-coding-instructions: true  (recommended)"
          labelOff="keep-coding-instructions: false  (full override)"
          color={C.green}
        />
        <div style={{ marginTop: 14 }}>
          <div style={{
            ...sans, fontSize: 12, lineHeight: 1.6,
            color: keepCodingInstructions ? C.green : C.red,
            background: keepCodingInstructions ? C.greenBg : C.redBg,
            border: `1px solid ${keepCodingInstructions ? C.greenBorder : C.redBorder}`,
            borderRadius: 8, padding: "10px 14px",
            marginBottom: 12,
          }}>
            {keepCodingInstructions
              ? "Safe mode: Your style instructions are appended after the SE-specific prompt. Claude keeps its coding guardrails (verify tests, prefer targeted edits, don't hallucinate APIs)."
              : "Override mode: The SE-specific prompt is completely replaced. Claude will NOT verify tests, may make broad edits, and may hallucinate APIs unless you restate those rules explicitly."}
          </div>
        </div>
      </div>

      <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 28 }}>
        <div style={{
          background: C.card, padding: "8px 16px",
          display: "flex", alignItems: "center", gap: 8,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <span style={{ ...mono, fontSize: 11, color: C.styleCustom }}>.claude/output-styles/my-style.md</span>
          <Tag color={keepCodingInstructions ? C.green : C.red}>
            keep-coding-instructions: {keepCodingInstructions.toString()}
          </Tag>
        </div>
        <pre style={{
          ...mono, fontSize: 12, color: C.textSoft,
          margin: 0, padding: "14px 20px",
          overflowX: "auto", lineHeight: 1.75,
        }}>
          {customPreviewFrontmatter}
        </pre>
      </div>

      {/* Default style selector */}
      <SectionTitle color={C.purple} subtitle="Preview the settings.json output for each default style">
        Set a Default Style
      </SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {["default", "explanatory", "learning"].map(s => {
          const style = STYLES.find(st => st.id === s);
          return (
            <button
              key={s}
              onClick={() => setDefaultStyle(s)}
              style={{
                ...sans, fontSize: 12, fontWeight: 600, padding: "6px 16px", borderRadius: 8,
                border: `1.5px solid ${defaultStyle === s ? style.color : C.border}`,
                background: defaultStyle === s ? `${style.color}18` : "transparent",
                color: defaultStyle === s ? style.color : C.textSoft,
                cursor: "pointer",
              }}
            >
              {style.icon} {style.label}
            </button>
          );
        })}
      </div>
      <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{
          background: C.card, padding: "8px 16px",
          display: "flex", alignItems: "center", gap: 8,
          borderBottom: `1px solid ${C.border}`,
        }}>
          <span style={{ ...mono, fontSize: 11, color: C.cyan }}>~/.claude/settings.json</span>
          <Tag color={C.cyan}>user default</Tag>
        </div>
        <pre style={{
          ...mono, fontSize: 12, color: C.textSoft,
          margin: 0, padding: "14px 20px",
          lineHeight: 1.75,
        }}>
          {settingsPreview}
        </pre>
      </div>
    </div>
  );
}

// ── Root Component ────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Style Overview" },
  { id: "tokens", label: "Token Cost Impact" },
  { id: "config", label: "Configuration" },
];

export default function OutputStylesDiagram() {
  const [tab, setTab] = useState("overview");

  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: "28px 24px", maxWidth: 900, margin: "0 auto", color: C.text }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ ...mono, fontSize: 11, color: C.textDim, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 12px" }}>
            Claude Code · Output Styles
          </div>
          <div style={{ ...mono, fontSize: 11, color: C.green, background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 6, padding: "4px 12px" }}>
            .claude/output-styles/
          </div>
          <div style={{ ...mono, fontSize: 11, color: C.styleCustom, background: `${C.styleCustom}15`, border: `1px solid ${C.styleCustom}40`, borderRadius: 6, padding: "4px 12px" }}>
            3 built-in + custom
          </div>
        </div>
        <h1 style={{ ...sans, fontSize: 26, fontWeight: 900, color: C.white, margin: 0, letterSpacing: -0.5 }}>
          Output Styles — Interactive Reference
        </h1>
        <p style={{ ...sans, fontSize: 14, color: C.textSoft, margin: "8px 0 0 0", lineHeight: 1.5 }}>
          Output Styles replace the SE-specific portion of Claude's system prompt, changing response verbosity,
          explanation depth, and code comment density. The Anthropic core prompt is always preserved.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              ...sans, fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 8,
              border: `1.5px solid ${tab === t.id ? C.blue : C.border}`,
              background: tab === t.id ? C.blueBg : "transparent",
              color: tab === t.id ? C.blue : C.textSoft,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && <TabStyleOverview />}
      {tab === "tokens" && <TabTokenCost />}
      {tab === "config" && <TabConfiguration />}

      {/* Footer */}
      <div style={{
        marginTop: 32, paddingTop: 16,
        borderTop: `1px solid ${C.border}`,
        display: "flex", justifyContent: "space-between",
        alignItems: "center", flexWrap: "wrap", gap: 8,
      }}>
        <span style={{ ...sans, fontSize: 12, color: C.textDim }}>
          Claude Code · Output Styles Reference · June 2026
        </span>
        <span style={{ ...sans, fontSize: 12, color: C.textDim }}>
          Styles live in: .claude/output-styles/*.md
        </span>
      </div>
    </div>
  );
}
