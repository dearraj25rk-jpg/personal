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

function Tag({ children, color = C.blue }) {
  return (
    <span style={{
      ...mono, fontSize: 11, fontWeight: 600, color,
      background: `${color}18`, border: `1px solid ${color}40`,
      borderRadius: 5, padding: "2px 7px",
    }}>{children}</span>
  );
}

function NavTab({ label, active, onClick, color = C.blue }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...sans, fontSize: 13, fontWeight: active ? 700 : 500,
        color: active ? color : C.textSoft,
        background: active ? `${color}15` : "transparent",
        border: `1.5px solid ${active ? color : "transparent"}`,
        borderRadius: 8, padding: "7px 16px",
        cursor: "pointer", whiteSpace: "nowrap",
        transition: "all 0.15s",
      }}
    >{label}</button>
  );
}

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ position: "relative" }}>
      <pre style={{
        ...mono, fontSize: 12, lineHeight: 1.7,
        background: "#0a0e14", border: `1px solid ${C.border}`,
        borderRadius: 8, padding: "14px 16px",
        margin: 0, overflow: "auto", color: C.textSoft,
        whiteSpace: "pre",
      }}>{code}</pre>
      <button
        onClick={copy}
        style={{
          position: "absolute", top: 8, right: 8,
          ...sans, fontSize: 11, fontWeight: 600,
          background: copied ? C.greenBg : C.card,
          color: copied ? C.green : C.textDim,
          border: `1px solid ${copied ? C.green : C.border}`,
          borderRadius: 5, padding: "3px 10px", cursor: "pointer",
        }}
      >{copied ? "Copied" : "Copy"}</button>
    </div>
  );
}

// ── Tab 1: CLAUDE.md Hierarchy ─────────────────────────────────────

const TREE_NODES = [
  {
    id: "root",
    path: "CLAUDE.md",
    label: "Root CLAUDE.md",
    depth: 0,
    color: C.blue,
    loadWhen: "Always — loaded at every session start",
    tokens: "~4,000 tk",
    purpose: "Shared context for all services: repo layout, coding standards, git conventions, team glossary, CI overview",
    example: `# Monorepo — Shared Context
## Services
- services/api/     — Express REST API (Node 22, TypeScript)
- services/frontend/ — Next.js 15 app
- services/worker/  — BullMQ background jobs
- packages/shared/  — Shared types and utilities

## Conventions
- PRs must pass all service tests
- Conventional commits enforced via commitlint
- All services use pnpm workspaces`,
  },
  {
    id: "api",
    path: "services/api/CLAUDE.md",
    label: "API service CLAUDE.md",
    depth: 1,
    color: C.green,
    loadWhen: "When cwd is inside services/api/ OR when file is explicitly @-imported",
    tokens: "~2,200 tk",
    purpose: "API-specific: Express routes pattern, auth middleware, database schema, migration conventions",
    example: `# API Service Context
## Stack: Express 5, Prisma ORM, PostgreSQL 16
## Auth: JWT + refresh tokens in httpOnly cookies
## Route pattern: src/routes/<resource>/
  - index.ts (router)
  - handlers.ts (business logic)
  - schema.ts (zod validation)
## DB migrations: pnpm prisma migrate dev`,
  },
  {
    id: "frontend",
    path: "services/frontend/CLAUDE.md",
    label: "Frontend CLAUDE.md",
    depth: 1,
    color: C.purple,
    loadWhen: "When cwd is inside services/frontend/ OR explicitly @-imported",
    tokens: "~1,800 tk",
    purpose: "Next.js conventions, component library, state management, i18n setup",
    example: `# Frontend Service Context
## Stack: Next.js 15 App Router, Tailwind CSS, Zustand
## Components: src/components/ (shadcn/ui base)
## Data fetching: React Query + generated API client
## i18n: next-intl, locales in messages/
## Testing: Playwright for E2E, Vitest for units`,
  },
  {
    id: "worker",
    path: "services/worker/CLAUDE.md",
    label: "Worker CLAUDE.md",
    depth: 1,
    color: C.orange,
    loadWhen: "When cwd is inside services/worker/ OR explicitly @-imported",
    tokens: "~1,400 tk",
    purpose: "BullMQ job definitions, Redis config, retry/backoff conventions, job monitoring",
    example: `# Worker Service Context
## Stack: BullMQ 5, Redis 7, TypeScript
## Job definitions: src/jobs/<name>.job.ts
## Queue names: email-queue, report-queue, sync-queue
## Retry: exponential backoff, max 3 attempts
## Monitoring: Bull Board at /admin/queues (internal only)`,
  },
  {
    id: "shared",
    path: "packages/shared/CLAUDE.md",
    label: "Shared package CLAUDE.md",
    depth: 1,
    color: C.cyan,
    loadWhen: "When cwd is inside packages/shared/ OR explicitly @-imported",
    tokens: "~900 tk",
    purpose: "Shared types, utility functions, validation schemas used across all services",
    example: `# Shared Package Context
## Exports: types/, utils/, schemas/
## Versioning: bump package.json + run pnpm build:shared
## Never import circular dependencies back into services
## Zod schemas are the source of truth for all types`,
  },
  {
    id: "api-rules",
    path: ".claude/rules/api-rules.md",
    label: "api-rules.md",
    depth: 2,
    color: C.green,
    loadWhen: "Auto-loaded when active file matches glob: services/api/**",
    tokens: "~600 tk",
    purpose: "API-specific lint rules, banned patterns, required security middleware checks",
    example: `---
description: Rules for API service files
globs: ["services/api/**"]
---
- ALWAYS validate request bodies with Zod before processing
- NEVER return raw Prisma errors to clients
- Use res.locals.user for authenticated user context
- Rate-limit all public endpoints via express-rate-limit
- Log structured JSON via pino, never console.log`,
  },
  {
    id: "frontend-rules",
    path: ".claude/rules/frontend-rules.md",
    label: "frontend-rules.md",
    depth: 2,
    color: C.purple,
    loadWhen: "Auto-loaded when active file matches glob: services/frontend/**",
    tokens: "~500 tk",
    purpose: "React/Next.js patterns, accessibility requirements, performance rules",
    example: `---
description: Rules for frontend files
globs: ["services/frontend/**"]
---
- Use Server Components by default; add 'use client' only when needed
- All images must use next/image with explicit width/height
- aria-label required on all interactive elements
- No inline styles — use Tailwind classes only
- Dynamic imports for components >50 KB`,
  },
  {
    id: "shared-rules",
    path: ".claude/rules/shared-rules.md",
    label: "shared-rules.md",
    depth: 2,
    color: C.cyan,
    loadWhen: "Auto-loaded when active file matches glob: packages/**",
    tokens: "~400 tk",
    purpose: "Shared package purity rules: no side-effects, full tree-shaking, no service-specific imports",
    example: `---
description: Rules for shared packages
globs: ["packages/**"]
---
- No side-effects in module scope (no console, no fetch)
- Export everything named — no default exports
- All functions must have JSDoc with @param and @returns
- Zero dependencies on service-internal modules
- Every export must have a corresponding unit test`,
  },
];

function ClaudemdHierarchyTab() {
  const [selected, setSelected] = useState("root");
  const node = TREE_NODES.find(n => n.id === selected);

  const renderNode = (n) => {
    const indent = n.depth * 24;
    const isSelected = selected === n.id;
    return (
      <div
        key={n.id}
        onClick={() => setSelected(n.id)}
        style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          paddingLeft: indent, marginBottom: 6, cursor: "pointer",
        }}
      >
        {n.depth > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0, marginTop: 2 }}>
            {Array.from({ length: n.depth }).map((_, i) => (
              <div key={i} style={{ width: 16, height: 1, background: `${n.color}30` }} />
            ))}
            <div style={{ ...mono, fontSize: 12, color: `${n.color}60`, marginRight: 4 }}>
              {n.depth === 2 ? "├─" : "├─"}
            </div>
          </div>
        )}
        <div style={{
          flex: 1, background: isSelected ? `${n.color}12` : C.card,
          border: `1.5px solid ${isSelected ? n.color + "60" : C.border}`,
          borderRadius: 8, padding: "8px 12px", transition: "all 0.15s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <code style={{ ...mono, fontSize: 12, fontWeight: 700, color: n.color }}>{n.path}</code>
            <Tag color={n.color}>{n.tokens}</Tag>
            {n.depth === 0 && <Tag color={C.green}>Always loaded</Tag>}
            {n.depth === 1 && <Tag color={C.yellow}>Subdir / @-import</Tag>}
            {n.depth === 2 && <Tag color={C.purple}>Glob-scoped</Tag>}
          </div>
          {isSelected && (
            <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 4 }}>{n.purpose}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <SectionTitle color={C.blue} subtitle="5-service monorepo CLAUDE.md layout — showing load timing and token costs">
        CLAUDE.md Hierarchy
      </SectionTitle>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Tree */}
        <div>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            File Tree — click any node for details
          </div>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "16px 14px" }}>
            {TREE_NODES.map(renderNode)}
          </div>

          {/* Load timing legend */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { color: C.green, badge: "Always loaded", desc: "Root CLAUDE.md — loaded at init, always in context" },
              { color: C.yellow, badge: "Subdir / @-import", desc: "Service CLAUDE.md — loaded when cwd matches or @-imported" },
              { color: C.purple, badge: "Glob-scoped", desc: "Rules files — auto-injected when active file matches glob" },
            ].map((row) => (
              <div key={row.badge} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Tag color={row.color}>{row.badge}</Tag>
                <span style={{ ...sans, fontSize: 11, color: C.textDim }}>{row.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div>
          {node && (
            <>
              <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                {node.label}
              </div>
              <div style={{
                background: `${node.color}08`, border: `1px solid ${node.color}30`,
                borderRadius: 8, padding: "12px 14px", marginBottom: 12,
              }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <Tag color={node.color}>{node.tokens}</Tag>
                </div>
                <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: node.color, marginBottom: 4 }}>
                  Load trigger:
                </div>
                <div style={{ ...sans, fontSize: 12, color: C.textSoft, marginBottom: 8 }}>{node.loadWhen}</div>
                <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: node.color, marginBottom: 4 }}>
                  Purpose:
                </div>
                <div style={{ ...sans, fontSize: 12, color: C.textSoft }}>{node.purpose}</div>
              </div>
              <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Example content
              </div>
              <CodeBlock code={node.example} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab 2: Path-Scoped Rules ───────────────────────────────────────

const EXAMPLE_PATHS = [
  {
    path: "services/api/src/auth/login.ts",
    color: C.green,
    matches: ["api-rules.md"],
    noMatch: ["frontend-rules.md", "shared-rules.md"],
    reason: "services/api/** matches — API auth handler",
    context: ["Root CLAUDE.md", "services/api/CLAUDE.md", ".claude/rules/api-rules.md"],
  },
  {
    path: "services/frontend/src/components/LoginForm.tsx",
    color: C.purple,
    matches: ["frontend-rules.md"],
    noMatch: ["api-rules.md", "shared-rules.md"],
    reason: "services/frontend/** matches — React component",
    context: ["Root CLAUDE.md", "services/frontend/CLAUDE.md", ".claude/rules/frontend-rules.md"],
  },
  {
    path: "packages/shared/src/types/user.ts",
    color: C.cyan,
    matches: ["shared-rules.md"],
    noMatch: ["api-rules.md", "frontend-rules.md"],
    reason: "packages/** matches — shared type definition",
    context: ["Root CLAUDE.md", "packages/shared/CLAUDE.md", ".claude/rules/shared-rules.md"],
  },
  {
    path: "services/worker/src/jobs/email.job.ts",
    color: C.orange,
    matches: [],
    noMatch: ["api-rules.md", "frontend-rules.md", "shared-rules.md"],
    reason: "No rules glob matches services/worker/** — only service CLAUDE.md loads",
    context: ["Root CLAUDE.md", "services/worker/CLAUDE.md"],
  },
  {
    path: "services/api/src/routes/users/handlers.ts",
    color: C.green,
    matches: ["api-rules.md"],
    noMatch: ["frontend-rules.md", "shared-rules.md"],
    reason: "services/api/** matches — API route handler",
    context: ["Root CLAUDE.md", "services/api/CLAUDE.md", ".claude/rules/api-rules.md"],
  },
];

const RULES_GLOBS = [
  { file: "api-rules.md",      glob: "services/api/**",      color: C.green },
  { file: "frontend-rules.md", glob: "services/frontend/**", color: C.purple },
  { file: "shared-rules.md",   glob: "packages/**",          color: C.cyan },
];

function PathScopedRulesTab() {
  const [selected, setSelected] = useState(0);
  const example = EXAMPLE_PATHS[selected];

  const matchesGlob = (filePath, glob) => {
    const prefix = glob.replace("/**", "");
    return filePath.startsWith(prefix);
  };

  return (
    <div>
      <SectionTitle color={C.green} subtitle="Click a file path to see which rules files load — visualising glob match logic">
        Path-Scoped Rules Selector
      </SectionTitle>

      {/* Glob reference */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Rules Files and Their Path Globs
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {RULES_GLOBS.map((r) => (
            <div key={r.file} style={{
              background: `${r.color}0a`, border: `1.5px solid ${r.color}30`,
              borderRadius: 8, padding: "10px 14px", flex: "1 1 220px",
            }}>
              <code style={{ ...mono, fontSize: 12, fontWeight: 700, color: r.color }}>{r.file}</code>
              <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 4 }}>
                Activates for: <span style={{ ...mono, color: C.textSoft }}>{r.glob}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File path selector */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
          Select a File Path to Simulate
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {EXAMPLE_PATHS.map((ex, i) => (
            <button
              key={ex.path}
              onClick={() => setSelected(i)}
              style={{
                background: selected === i ? `${ex.color}12` : C.card,
                border: `1.5px solid ${selected === i ? ex.color : C.border}`,
                borderRadius: 8, padding: "10px 14px",
                cursor: "pointer", textAlign: "left",
                display: "flex", alignItems: "center", gap: 12,
                transition: "all 0.15s",
              }}
            >
              <code style={{ ...mono, fontSize: 12, color: selected === i ? ex.color : C.textSoft }}>{ex.path}</code>
              {selected === i && (
                <div style={{ marginLeft: "auto", ...sans, fontSize: 11, color: C.textDim }}>{ex.reason}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Match result */}
      {example && (
        <div style={{
          background: `${example.color}08`, border: `1.5px solid ${example.color}40`,
          borderRadius: 12, padding: "20px 24px",
        }}>
          <div style={{ ...sans, fontSize: 14, fontWeight: 700, color: example.color, marginBottom: 16 }}>
            Active context for: <code style={{ ...mono }}>{example.path}</code>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Context window contents */}
            <div>
              <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                Loaded into context window
              </div>
              {example.context.map((item) => (
                <div key={item} style={{
                  display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
                  background: C.greenBg, border: `1px solid ${C.greenBorder}`,
                  borderRadius: 6, padding: "7px 10px",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
                  <code style={{ ...mono, fontSize: 12, color: C.green }}>{item}</code>
                </div>
              ))}
            </div>

            {/* Glob match trace */}
            <div>
              <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                Glob Match Trace
              </div>
              {RULES_GLOBS.map((r) => {
                const matched = matchesGlob(example.path, r.glob);
                return (
                  <div key={r.file} style={{
                    display: "flex", alignItems: "center", gap: 10, marginBottom: 6,
                    background: matched ? `${r.color}10` : C.redBg,
                    border: `1px solid ${matched ? r.color + "40" : C.redBorder}`,
                    borderRadius: 6, padding: "8px 12px",
                  }}>
                    <div style={{
                      ...mono, fontSize: 10, fontWeight: 800,
                      color: matched ? r.color : C.red,
                      background: matched ? `${r.color}20` : C.redBg,
                      border: `1px solid ${matched ? r.color + "40" : C.redBorder}`,
                      borderRadius: 4, padding: "2px 5px", flexShrink: 0,
                    }}>
                      {matched ? "MATCH" : "SKIP"}
                    </div>
                    <div>
                      <code style={{ ...mono, fontSize: 11, color: matched ? r.color : C.textDim }}>{r.file}</code>
                      <div style={{ ...mono, fontSize: 10, color: C.textDim, marginTop: 2 }}>{r.glob}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 3: Shared MCP Servers ──────────────────────────────────────

const ROOT_MCP_JSON = `// .mcp.json (repo root — shared by all services)
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
}`;

const SERVICE_MCP_CONFIGS = {
  api: {
    label: "services/api/.mcp.json",
    color: C.green,
    servers: ["github", "linear", "monitoring", "postgres", "redis-cache"],
    code: `// services/api/.mcp.json (merged with root)
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
}`,
  },
  frontend: {
    label: "services/frontend/.mcp.json",
    color: C.purple,
    servers: ["github", "linear", "monitoring", "figma", "lighthouse"],
    code: `// services/frontend/.mcp.json (merged with root)
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
}`,
  },
  worker: {
    label: "services/worker/.mcp.json",
    color: C.orange,
    servers: ["github", "linear", "monitoring", "redis-queues", "s3"],
    code: `// services/worker/.mcp.json (merged with root)
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
}`,
  },
};

function SharedMCPServersTab() {
  const [activeService, setActiveService] = useState("api");
  const svc = SERVICE_MCP_CONFIGS[activeService];

  return (
    <div>
      <SectionTitle color={C.cyan} subtitle="Root .mcp.json shared across all services, merged with per-service configs">
        Shared MCP Server Architecture
      </SectionTitle>

      {/* Merge diagram */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <div style={{
          background: C.blueBg, border: `1.5px solid ${C.blueBorder}`,
          borderRadius: 10, padding: "14px 20px", textAlign: "center", minWidth: 160,
        }}>
          <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: C.blue, marginBottom: 4 }}>.mcp.json</div>
          <div style={{ ...sans, fontSize: 11, color: C.textDim }}>Repo root</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {["github", "linear", "monitoring"].map(s => (
              <div key={s} style={{ ...mono, fontSize: 10, color: C.blue, background: `${C.blue}15`, borderRadius: 4, padding: "2px 6px" }}>{s}</div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ ...sans, fontSize: 20, color: C.textDim }}>+</div>
        </div>

        <div style={{
          background: `${svc.color}0a`, border: `1.5px solid ${svc.color}40`,
          borderRadius: 10, padding: "14px 20px", textAlign: "center", minWidth: 160,
        }}>
          <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: svc.color, marginBottom: 4 }}>service/.mcp.json</div>
          <div style={{ ...sans, fontSize: 11, color: C.textDim }}>{activeService}</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {svc.servers.filter(s => !["github", "linear", "monitoring"].includes(s)).map(s => (
              <div key={s} style={{ ...mono, fontSize: 10, color: svc.color, background: `${svc.color}15`, borderRadius: 4, padding: "2px 6px" }}>{s}</div>
            ))}
          </div>
        </div>

        <div style={{ ...sans, fontSize: 20, color: C.textDim }}>=</div>

        <div style={{
          background: C.greenBg, border: `1.5px solid ${C.greenBorder}`,
          borderRadius: 10, padding: "14px 20px", textAlign: "center", minWidth: 160,
        }}>
          <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 4 }}>Active servers</div>
          <div style={{ ...sans, fontSize: 11, color: C.textDim }}>{svc.servers.length} total</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {svc.servers.map(s => (
              <div key={s} style={{ ...mono, fontSize: 10, color: C.green, background: C.greenBg, borderRadius: 4, padding: "2px 6px" }}>{s}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Service selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {Object.entries(SERVICE_MCP_CONFIGS).map(([key, s]) => (
          <NavTab key={key} label={s.label} active={activeService === key} color={s.color} onClick={() => setActiveService(key)} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Root .mcp.json (shared)
          </div>
          <CodeBlock code={ROOT_MCP_JSON} />
        </div>
        <div>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            {svc.label}
          </div>
          <CodeBlock code={svc.code} />
        </div>
      </div>

      <div style={{
        marginTop: 16, background: C.yellowBg, border: `1px solid ${C.yellowBorder}`,
        borderRadius: 8, padding: "10px 14px",
      }}>
        <div style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.6 }}>
          <span style={{ color: C.yellow, fontWeight: 700 }}>Merge behavior: </span>
          Claude Code reads root .mcp.json first, then the nearest ancestor .mcp.json files.
          Service-level files extend — not replace — the root config. Keys in service files
          take precedence if the same server name appears in both. All active servers are
          available as tools during the session.
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Agent Teams Cross-Service ──────────────────────────────

const AGENT_TASKS = [
  {
    id: "api",
    label: "API Agent",
    color: C.green,
    scope: "services/api/",
    worktree: "git worktree add ../repo-api-agent services/api-feature",
    claude_md: "services/api/CLAUDE.md",
    task: "Implement POST /users/:id/avatar endpoint with file upload to S3, update Prisma schema, write migration",
    tools: ["Read", "Edit", "Bash", "Task"],
    model: "claude-sonnet-4-5",
  },
  {
    id: "frontend",
    label: "Frontend Agent",
    color: C.purple,
    scope: "services/frontend/",
    worktree: "git worktree add ../repo-frontend-agent services/frontend-feature",
    claude_md: "services/frontend/CLAUDE.md",
    task: "Build AvatarUpload React component with drag-and-drop, progress indicator, crop tool, and error states",
    tools: ["Read", "Edit", "Bash"],
    model: "claude-sonnet-4-5",
  },
  {
    id: "worker",
    label: "Worker Agent",
    color: C.orange,
    scope: "services/worker/",
    worktree: "git worktree add ../repo-worker-agent services/worker-feature",
    claude_md: "services/worker/CLAUDE.md",
    task: "Create image-processing BullMQ job to resize/compress uploaded avatar images asynchronously",
    tools: ["Read", "Edit", "Bash"],
    model: "claude-haiku-4-5",
  },
];

const ORCHESTRATOR_PROMPT = `# Cross-Service Feature: User Avatar Upload

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
- Open 3 draft PRs when all agents finish`;

function AgentTeamsCrossServiceTab() {
  const [selectedAgent, setSelectedAgent] = useState("api");
  const agent = AGENT_TASKS.find(a => a.id === selectedAgent);

  return (
    <div>
      <SectionTitle color={C.purple} subtitle="Orchestrator delegates to scoped agents — each with their own worktree and CLAUDE.md">
        Agent Teams: Cross-Service Feature Development
      </SectionTitle>

      {/* Architecture diagram */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
          {/* Orchestrator */}
          <div style={{
            background: C.purpleBg, border: `1.5px solid ${C.purpleBorder}`,
            borderRadius: 10, padding: "14px 24px", textAlign: "center", width: "60%",
          }}>
            <div style={{ ...sans, fontSize: 13, fontWeight: 800, color: C.purple }}>Orchestrator Agent</div>
            <div style={{ ...mono, fontSize: 11, color: C.textDim, marginTop: 4 }}>
              claude --model claude-opus-4-5
            </div>
            <div style={{ ...sans, fontSize: 11, color: C.textSoft, marginTop: 4 }}>
              Root CLAUDE.md + all service context visible
            </div>
          </div>

          {/* Connector lines */}
          <div style={{ display: "flex", gap: 80, alignItems: "flex-start" }}>
            {AGENT_TASKS.map(() => (
              <div key={Math.random()} style={{ width: 2, height: 24, background: C.border }} />
            ))}
          </div>

          {/* Service agents */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {AGENT_TASKS.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAgent(a.id)}
                style={{
                  flex: "1 1 220px", maxWidth: 260,
                  background: selectedAgent === a.id ? `${a.color}15` : C.card,
                  border: `1.5px solid ${selectedAgent === a.id ? a.color : C.border}`,
                  borderRadius: 10, padding: "14px 16px",
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}
              >
                <div style={{ ...sans, fontSize: 12, fontWeight: 800, color: a.color, marginBottom: 4 }}>{a.label}</div>
                <div style={{ ...mono, fontSize: 10, color: C.textDim, marginBottom: 6 }}>scope: {a.scope}</div>
                <Tag color={a.color}>{a.model}</Tag>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Agent detail + orchestrator prompt */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Selected agent detail */}
        {agent && (
          <div>
            <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              {agent.label} — Configuration
            </div>
            <div style={{
              background: `${agent.color}08`, border: `1px solid ${agent.color}30`,
              borderRadius: 10, padding: "16px 18px",
            }}>
              {[
                ["Scope", agent.scope],
                ["CLAUDE.md", agent.claude_md],
                ["Model", agent.model],
                ["Tools", agent.tools.join(", ")],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                  <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: agent.color, width: 70, flexShrink: 0 }}>{k}</div>
                  <code style={{ ...mono, fontSize: 11, color: C.textSoft }}>{v}</code>
                </div>
              ))}
              <div style={{ marginTop: 4 }}>
                <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: agent.color, marginBottom: 4 }}>Task</div>
                <div style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.6 }}>{agent.task}</div>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: agent.color, marginBottom: 6 }}>Worktree setup</div>
                <CodeBlock code={agent.worktree} />
              </div>
            </div>
          </div>
        )}

        {/* Orchestrator prompt */}
        <div>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Orchestrator System Prompt
          </div>
          <CodeBlock code={ORCHESTRATOR_PROMPT} />
        </div>
      </div>

      {/* Key properties */}
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 10 }}>
        {[
          { color: C.green, label: "Isolated worktrees", desc: "Each agent works in its own git worktree — no file conflicts between parallel agents" },
          { color: C.blue, label: "Scoped context", desc: "Service CLAUDE.md + path-scoped rules inject automatically when cwd matches service" },
          { color: C.purple, label: "Model tiering", desc: "Use Opus for orchestrator, Sonnet for complex services, Haiku for simpler workers" },
          { color: C.orange, label: "Contract-first", desc: "Orchestrator waits for API agent to define endpoint contract before spawning frontend agent" },
        ].map((prop) => (
          <div key={prop.label} style={{
            background: `${prop.color}0a`, border: `1px solid ${prop.color}25`,
            borderRadius: 8, padding: "12px 14px",
          }}>
            <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: prop.color, marginBottom: 4 }}>{prop.label}</div>
            <div style={{ ...sans, fontSize: 11, color: C.textSoft, lineHeight: 1.5 }}>{prop.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 5: CI/CD Matrix ────────────────────────────────────────────

const MATRIX_WORKFLOW = `name: Monorepo CI — Claude Code Matrix
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
          github_token: \${{ secrets.GITHUB_TOKEN }}`;

const MATRIX_SERVICES = [
  {
    name: "api",
    changed: true,
    color: C.green,
    files: 4,
    status: "Running review",
    findings: ["Missing input validation on /upload", "No rate limiting on endpoint"],
  },
  {
    name: "frontend",
    changed: true,
    color: C.purple,
    files: 7,
    status: "Running review",
    findings: ["Component missing aria-label", "Large bundle — missing dynamic import"],
  },
  {
    name: "worker",
    changed: false,
    color: C.orange,
    files: 0,
    status: "Skipped (no changes)",
    findings: [],
  },
];

function CICDMatrixTab() {
  const [view, setView] = useState("workflow");

  return (
    <div>
      <SectionTitle color={C.orange} subtitle="GitHub Actions matrix that runs parallel Claude Code reviews per changed service">
        CI/CD Matrix Build
      </SectionTitle>

      {/* Matrix visualization */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Matrix Run Visualization
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* detect-changes job */}
          <div style={{
            background: C.yellowBg, border: `1px solid ${C.yellowBorder}`,
            borderRadius: 8, padding: "10px 14px",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: C.yellow }} />
            <code style={{ ...mono, fontSize: 12, color: C.yellow }}>detect-changes</code>
            <div style={{ ...sans, fontSize: 11, color: C.textDim }}>dorny/paths-filter — outputs: api=true, frontend=true, worker=false</div>
            <Tag color={C.green}>Done</Tag>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 20 }}>
            <div style={{ width: 2, height: 12, background: C.border }} />
          </div>

          {/* Matrix jobs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {MATRIX_SERVICES.map((svc) => (
              <div key={svc.name} style={{
                flex: "1 1 200px",
                background: svc.changed ? `${svc.color}0a` : C.surface,
                border: `1.5px solid ${svc.changed ? svc.color + "40" : C.border}`,
                borderRadius: 10, padding: "12px 14px",
                opacity: svc.changed ? 1 : 0.5,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: svc.changed ? svc.color : C.textDim,
                  }} />
                  <code style={{ ...mono, fontSize: 12, fontWeight: 700, color: svc.changed ? svc.color : C.textDim }}>
                    claude-review ({svc.name})
                  </code>
                </div>
                <div style={{ ...sans, fontSize: 11, color: C.textDim, marginBottom: 6 }}>
                  {svc.status} {svc.changed && `· ${svc.files} files`}
                </div>
                {svc.findings.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {svc.findings.map((f, i) => (
                      <div key={i} style={{
                        ...sans, fontSize: 10, color: C.yellow,
                        background: C.yellowBg, borderRadius: 4, padding: "3px 6px",
                      }}>{f}</div>
                    ))}
                  </div>
                )}
                {!svc.changed && (
                  <div style={{ ...sans, fontSize: 11, color: C.textDim, fontStyle: "italic" }}>Skipped via if: condition</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workflow toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <NavTab label="Full Workflow YAML" active={view === "workflow"} color={C.orange} onClick={() => setView("workflow")} />
        <NavTab label="Cost Tips" active={view === "tips"} color={C.cyan} onClick={() => setView("tips")} />
      </div>

      {view === "workflow" && <CodeBlock code={MATRIX_WORKFLOW} />}

      {view === "tips" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
          {[
            { color: C.green, label: "Change detection first", desc: "Use dorny/paths-filter to skip services with no changes — avoids paying for unnecessary Claude runs" },
            { color: C.blue, label: "Haiku for CI reviews", desc: "claude-haiku-4-5 is 10-20x cheaper than Sonnet. Review tasks rarely need deep reasoning — Haiku suffices" },
            { color: C.purple, label: "max_turns: 5 for reviews", desc: "Read-only review jobs need at most 5 turns. Set a hard cap to prevent runaway cost in CI" },
            { color: C.orange, label: "allowed_tools: Read,Bash", desc: "CI review jobs don't need Edit/Write. Restricting tools reduces prompt overhead and prevents accidents" },
            { color: C.yellow, label: "Cache node_modules", desc: "Cache @anthropic-ai/claude-code install between runs with actions/cache — saves 20-30s per job" },
            { color: C.cyan, label: "Parallel matrix jobs", desc: "fail-fast: false lets passing services complete even if one fails — don't block the merge on unrelated services" },
          ].map((tip) => (
            <div key={tip.label} style={{
              background: `${tip.color}0a`, border: `1.5px solid ${tip.color}25`,
              borderRadius: 10, padding: "14px 16px",
            }}>
              <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: tip.color, marginBottom: 6 }}>{tip.label}</div>
              <div style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{tip.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Root Component ─────────────────────────────────────────────────

const TABS = [
  { id: "hierarchy",  label: "CLAUDE.md Hierarchy",      color: C.blue   },
  { id: "rules",      label: "Path-Scoped Rules",         color: C.green  },
  { id: "mcp",        label: "Shared MCP Servers",        color: C.cyan   },
  { id: "agents",     label: "Agent Teams Cross-Service", color: C.purple },
  { id: "cicd",       label: "CI/CD Matrix",              color: C.orange },
];

export default function MonorepoDiagram() {
  const [tab, setTab] = useState("hierarchy");

  const renderTab = () => {
    switch (tab) {
      case "hierarchy": return <ClaudemdHierarchyTab />;
      case "rules":     return <PathScopedRulesTab />;
      case "mcp":       return <SharedMCPServersTab />;
      case "agents":    return <AgentTeamsCrossServiceTab />;
      case "cicd":      return <CICDMatrixTab />;
      default:          return null;
    }
  };

  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: "28px 24px", color: C.text, minHeight: 500 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ ...sans, fontSize: 24, fontWeight: 800, color: C.white, margin: 0, letterSpacing: -0.5 }}>
            Claude Code Monorepo Patterns
          </h1>
          <p style={{ ...sans, fontSize: 13, color: C.textDim, margin: "6px 0 0" }}>
            CLAUDE.md hierarchy · Path-scoped rules · Shared MCP servers · Agent teams · CI/CD matrix
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Tag color={C.green}>v2.1.126</Tag>
          <Tag color={C.textDim}>June 2026</Tag>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: "flex", gap: 6, flexWrap: "wrap",
        marginBottom: 28, paddingBottom: 16,
        borderBottom: `1px solid ${C.border}`,
      }}>
        {TABS.map(t => (
          <NavTab key={t.id} label={t.label} active={tab === t.id} color={t.color} onClick={() => setTab(t.id)} />
        ))}
      </div>

      {/* Active panel */}
      {renderTab()}
    </div>
  );
}
