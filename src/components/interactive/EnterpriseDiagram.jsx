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

// ── Tab 1: Managed Settings ────────────────────────────────────────

const MANAGED_KEYS = [
  { key: "ANTHROPIC_BASE_URL", desc: "Redirect all API calls to corporate proxy", locked: true, example: "https://claude-proxy.corp.example.com" },
  { key: "DISABLE_TELEMETRY", desc: "Block anonymous usage telemetry", locked: true, example: "1" },
  { key: "ANTHROPIC_MODEL", desc: "Enforce approved model across all users", locked: true, example: "claude-sonnet-4-5-20251101" },
  { key: "CLAUDE_CODE_MAX_OUTPUT_TOKENS", desc: "Cap token spend per response", locked: true, example: "8192" },
  { key: "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", desc: "Block version checks and telemetry pings", locked: true, example: "1" },
  { key: "HTTP_PROXY / HTTPS_PROXY", desc: "Route traffic through corporate proxy", locked: true, example: "http://proxy.corp.example.com:8080" },
  { key: "theme", desc: "Locked visual theme for brand compliance", locked: true, example: "dark" },
  { key: "preferredNotifChannel", desc: "User can choose their notification channel", locked: false, example: "terminal | system" },
  { key: "autoUpdates", desc: "User may opt in/out of auto-updates", locked: false, example: "true | false" },
];

const MANAGED_JSON = `// /Library/Managed Preferences/com.anthropic.claudecode.plist  (macOS)
// HKLM\\SOFTWARE\\Anthropic\\Claude\\ManagedSettings         (Windows)
// Deployed via MDM / JAMF / Intune / Group Policy

{
  "ANTHROPIC_BASE_URL": "https://claude-proxy.corp.example.com",
  "DISABLE_TELEMETRY": "1",
  "ANTHROPIC_MODEL": "claude-sonnet-4-5-20251101",
  "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "8192",
  "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
  "HTTP_PROXY": "http://proxy.corp.example.com:8080",
  "HTTPS_PROXY": "http://proxy.corp.example.com:8080"
}`;

function ManagedSettingsTab() {
  const [selected, setSelected] = useState(null);

  const layers = [
    {
      label: "Enterprise MDM / JAMF / Intune",
      sublabel: "Pushes managed-settings.json to every managed device",
      color: C.red,
      icon: "SERVER",
      width: "100%",
    },
    {
      label: "OS-Level Policy Store",
      sublabel: "Windows: HKCU\\SOFTWARE\\Anthropic\\Claude  |  macOS: /Library/Managed Preferences/",
      color: C.orange,
      icon: "OS",
      width: "88%",
    },
    {
      label: "Claude Code reads managed keys at startup",
      sublabel: "Managed values OVERRIDE user settings.json — cannot be changed by end users",
      color: C.yellow,
      icon: "LOCK",
      width: "76%",
    },
    {
      label: "~/.claude/settings.json (user-writable)",
      sublabel: "Only non-managed keys may be set here — managed keys are silently ignored",
      color: C.green,
      icon: "USER",
      width: "64%",
    },
  ];

  return (
    <div>
      <SectionTitle color={C.orange} subtitle="How MDM-pushed settings override user preferences — with a full key reference">
        Managed Settings Hierarchy
      </SectionTitle>

      {/* Pyramid layers */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginBottom: 32 }}>
        {layers.map((layer, i) => (
          <div key={i} style={{
            width: layer.width, background: `${layer.color}12`,
            border: `1.5px solid ${layer.color}50`,
            borderRadius: i === 0 ? "10px 10px 0 0" : i === layers.length - 1 ? "0 0 10px 10px" : "0",
            padding: "14px 20px",
            display: "flex", alignItems: "center", gap: 14,
            transition: "all 0.15s",
          }}>
            <div style={{
              ...mono, fontSize: 9, fontWeight: 800, color: layer.color,
              background: `${layer.color}20`, border: `1px solid ${layer.color}40`,
              borderRadius: 4, padding: "3px 6px", flexShrink: 0, letterSpacing: 0.5,
            }}>{layer.icon}</div>
            <div>
              <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: layer.color }}>{layer.label}</div>
              <div style={{ ...sans, fontSize: 11, color: C.textDim, marginTop: 2 }}>{layer.sublabel}</div>
            </div>
            {i < 3 && (
              <div style={{ marginLeft: "auto", ...sans, fontSize: 18, color: layer.color, opacity: 0.6 }}>↓</div>
            )}
          </div>
        ))}
      </div>

      {/* Key reference */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Manageable Keys — click any row for details
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {MANAGED_KEYS.map((k) => (
            <div
              key={k.key}
              onClick={() => setSelected(selected === k.key ? null : k.key)}
              style={{
                background: selected === k.key ? (k.locked ? C.redBg : C.greenBg) : C.card,
                border: `1.5px solid ${selected === k.key ? (k.locked ? C.redBorder : C.greenBorder) : C.border}`,
                borderRadius: 8, padding: "10px 14px",
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 12,
              }}
            >
              <div style={{
                ...sans, fontSize: 10, fontWeight: 800,
                color: k.locked ? C.red : C.green,
                background: k.locked ? C.redBg : C.greenBg,
                border: `1px solid ${k.locked ? C.redBorder : C.greenBorder}`,
                borderRadius: 4, padding: "2px 6px", flexShrink: 0, letterSpacing: 0.5,
              }}>
                {k.locked ? "LOCKED" : "USER"}
              </div>
              <div style={{ flex: 1 }}>
                <code style={{ ...mono, fontSize: 12, color: k.locked ? C.orange : C.green }}>{k.key}</code>
                {selected === k.key && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ ...sans, fontSize: 12, color: C.textSoft }}>{k.desc}</div>
                    <div style={{ ...mono, fontSize: 11, color: C.textDim, marginTop: 4 }}>
                      Example: <span style={{ color: C.cyan }}>{k.example}</span>
                    </div>
                  </div>
                )}
                {selected !== k.key && (
                  <div style={{ ...sans, fontSize: 11, color: C.textDim }}>{k.desc}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* JSON example */}
      <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
        managed-settings.json — example deployment payload
      </div>
      <CodeBlock code={MANAGED_JSON} />
    </div>
  );
}

// ── Tab 2: Auth Providers ──────────────────────────────────────────

const AUTH_PROVIDERS = {
  direct: {
    label: "Anthropic Direct",
    color: C.blue,
    icon: "ANT",
    items: [
      { key: "ANTHROPIC_API_KEY", desc: "Personal or service account API key", example: "sk-ant-api03-…" },
      { key: "claude.ai OAuth", desc: "Browser-based login for interactive users; no key management needed", example: "claude auth login" },
      { key: "ANTHROPIC_BASE_URL", desc: "Override default endpoint for proxies", example: "https://api.anthropic.com" },
      { key: "ANTHROPIC_AUTH_TOKEN", desc: "Bearer token override (alternative to API key)", example: "Bearer sk-ant-…" },
    ],
    note: "API keys are project-scoped. Create one key per team via console.anthropic.com → API Keys.",
    code: `# Direct API — simplest setup
export ANTHROPIC_API_KEY="sk-ant-api03-REDACTED"
claude "Implement the auth module"

# Or via .env file (never commit):
ANTHROPIC_API_KEY=sk-ant-api03-REDACTED
ANTHROPIC_BASE_URL=https://claude-proxy.corp.example.com`,
  },
  bedrock: {
    label: "AWS Bedrock",
    color: C.orange,
    icon: "AWS",
    items: [
      { key: "AWS_REGION", desc: "Bedrock region — us-east-1 / us-west-2 have widest coverage", example: "us-east-1" },
      { key: "IAM Role (OIDC)", desc: "bedrock:InvokeModel on arn:aws:bedrock:*::foundation-model/anthropic.*", example: "arn:aws:iam::123:role/ClaudeCodeRole" },
      { key: "CLAUDE_CODE_BEDROCK_SERVICE_TIER", desc: "Controls throughput class for Bedrock invocations", example: "default | flex | priority" },
      { key: "CLAUDE_CODE_USE_BEDROCK", desc: "Activate Bedrock mode — no API key needed", example: "1" },
    ],
    note: "Service tiers: default (shared capacity), flex (on-demand), priority (reserved throughput). Priority requires Bedrock provisioned throughput ARN.",
    code: `# Service tier env var (Bedrock only)
export CLAUDE_CODE_USE_BEDROCK=1
export AWS_REGION=us-east-1
export CLAUDE_CODE_BEDROCK_SERVICE_TIER=priority

# IAM policy for Claude Code (minimum permissions):
{
  "Effect": "Allow",
  "Action": ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
  "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.*"
}`,
  },
  vertex: {
    label: "GCP Vertex AI",
    color: C.green,
    icon: "GCP",
    items: [
      { key: "CLAUDE_CODE_USE_VERTEX", desc: "Activate Vertex AI mode — no API key needed", example: "1" },
      { key: "CLOUD_ML_REGION", desc: "Vertex AI region — us-east5 recommended", example: "us-east5" },
      { key: "ANTHROPIC_VERTEX_PROJECT_ID", desc: "GCP project ID with Vertex AI API enabled", example: "my-corp-project" },
      { key: "Workload Identity Federation", desc: "Exchange GitHub/CI OIDC token for GCP credentials — no service account keys", example: "WIF pool + provider" },
    ],
    note: "WIF is strongly preferred over service account key files. Never store .json key files in repositories.",
    code: `# WIF config — no service account key files stored
export CLAUDE_CODE_USE_VERTEX=1
export CLOUD_ML_REGION=us-east5
export ANTHROPIC_VERTEX_PROJECT_ID=my-corp-project

# gcloud WIF setup (run once):
gcloud iam workload-identity-pools create "github-pool" \\
  --location="global" \\
  --display-name="GitHub Actions Pool"

gcloud iam workload-identity-pools providers create-oidc "github-provider" \\
  --location="global" \\
  --workload-identity-pool="github-pool" \\
  --attribute-mapping="google.subject=assertion.sub" \\
  --issuer-uri="https://token.actions.githubusercontent.com"`,
  },
};

function AuthProvidersTab() {
  const [active, setActive] = useState("direct");
  const p = AUTH_PROVIDERS[active];

  return (
    <div>
      <SectionTitle color={C.blue} subtitle="Three authentication paths — Anthropic direct, AWS Bedrock, and GCP Vertex AI">
        Authentication Providers
      </SectionTitle>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {Object.entries(AUTH_PROVIDERS).map(([key, prov]) => (
          <NavTab key={key} label={prov.label} active={active === key} color={prov.color} onClick={() => setActive(key)} />
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Key/config items */}
        <div>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Configuration Keys
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {p.items.map((item) => (
              <div key={item.key} style={{
                background: `${p.color}0a`, border: `1px solid ${p.color}30`,
                borderRadius: 8, padding: "10px 14px",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                  <code style={{ ...mono, fontSize: 12, color: p.color, fontWeight: 700 }}>{item.key}</code>
                </div>
                <div style={{ ...sans, fontSize: 12, color: C.textSoft, marginBottom: 4 }}>{item.desc}</div>
                <div style={{ ...mono, fontSize: 11, color: C.textDim }}>
                  e.g. <span style={{ color: C.cyan }}>{item.example}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 12, background: `${p.color}08`,
            border: `1px solid ${p.color}25`, borderRadius: 8, padding: "10px 14px",
          }}>
            <div style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.6 }}>
              <span style={{ color: p.color, fontWeight: 700 }}>Note: </span>{p.note}
            </div>
          </div>
        </div>

        {/* Code example */}
        <div>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Setup Example
          </div>
          <CodeBlock code={p.code} />
        </div>
      </div>

      {/* Comparison table */}
      <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10, marginTop: 8 }}>
        Provider Comparison
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", ...sans, fontSize: 12 }}>
          <thead>
            <tr style={{ background: C.card }}>
              {["Criterion", "Anthropic Direct", "AWS Bedrock", "GCP Vertex AI"].map(h => (
                <th key={h} style={{
                  textAlign: "left", padding: "9px 12px", color: C.textDim,
                  fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6,
                  borderBottom: `1px solid ${C.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ["Credential type", "API key / OAuth", "IAM role (OIDC)", "WIF / SA key"],
              ["Key in secrets manager", "Yes", "No (OIDC)", "No (WIF)"],
              ["Data residency", "Anthropic infra", "Your AWS region", "Your GCP region"],
              ["Private networking", "Via proxy only", "VPC endpoints", "VPC Service Controls"],
              ["Service tiers", "N/A", "default/flex/priority", "N/A"],
              ["Model IDs", "claude-sonnet-4-5-…", "anthropic.claude-…", "claude-sonnet-4-5@…"],
            ].map(([feature, ant, aws, gcp], i) => (
              <tr key={feature} style={{ background: i % 2 === 0 ? "transparent" : `${C.surface}80` }}>
                <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}40`, color: C.textSoft, fontWeight: 600 }}>{feature}</td>
                <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}40`, color: C.blue }}>{ant}</td>
                <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}40`, color: C.orange }}>{aws}</td>
                <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}40`, color: C.green }}>{gcp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tab 3: Audit Logging ───────────────────────────────────────────

const AUDIT_DESTINATIONS = {
  file: {
    label: "Local File",
    color: C.cyan,
    desc: "Appends JSONL entries to ~/.claude/audit.log — no network, zero latency, ideal for dev machines",
    code: `#!/usr/bin/env python3
# ~/.claude/hooks/audit-log.py
# Hook type: command  |  Event: PostToolUse
import json, sys, datetime
from pathlib import Path

entry = json.load(sys.stdin)
entry["timestamp"] = datetime.datetime.utcnow().isoformat() + "Z"

log_path = Path.home() / ".claude" / "audit.log"
log_path.parent.mkdir(exist_ok=True)
with open(log_path, "a") as f:
    f.write(json.dumps(entry) + "\\n")

# No stdout → Claude sees no injected context
# No non-zero exit → execution continues normally`,
  },
  http: {
    label: "HTTP Webhook",
    color: C.purple,
    desc: "POSTs every tool-use event to a central audit endpoint — SIEM, Splunk, Datadog, or custom API",
    code: `# settings.json hook configuration
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "",
      "hooks": [{
        "type": "http",
        "url": "https://audit.corp.example.com/claude/events",
        "headers": {
          "Authorization": "Bearer {{env.AUDIT_WEBHOOK_TOKEN}}",
          "X-Source": "claude-code",
          "Content-Type": "application/json"
        },
        "timeout_ms": 3000
      }]
    }],
    "SessionStart": [{
      "matcher": "",
      "hooks": [{
        "type": "http",
        "url": "https://audit.corp.example.com/claude/sessions",
        "headers": { "Authorization": "Bearer {{env.AUDIT_WEBHOOK_TOKEN}}" }
      }]
    }]
  }
}`,
  },
  otel: {
    label: "OpenTelemetry",
    color: C.orange,
    desc: "Emits structured spans to an OTEL collector — integrates with Jaeger, Tempo, Datadog APM",
    code: `#!/usr/bin/env python3
# ~/.claude/hooks/otel-audit.py
# Requires: pip install opentelemetry-sdk opentelemetry-exporter-otlp
import json, sys, os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

provider = TracerProvider()
provider.add_span_processor(
    BatchSpanProcessor(OTLPSpanExporter(
        endpoint=os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
    ))
)
trace.set_tracer_provider(provider)
tracer = trace.get_tracer("claude-code-audit")

payload = json.load(sys.stdin)
with tracer.start_as_current_span("claude.tool_use") as span:
    span.set_attribute("claude.session_id",  payload.get("session_id", ""))
    span.set_attribute("claude.tool",        payload.get("tool_name", ""))
    span.set_attribute("claude.tool_input",  json.dumps(payload.get("tool_input", {})))
    span.set_attribute("claude.result_type", payload.get("tool_response", {}).get("type", ""))`,
  },
};

const AUDIT_LOG_SAMPLE = `{
  "timestamp": "2026-06-02T14:23:11.847Z",
  "session_id": "sess_01XkR9mNpQwLtVbC3dF7gH",
  "turn_count": 12,
  "tool_name": "Bash",
  "tool_input": {
    "command": "git diff HEAD~1 --stat"
  },
  "tool_response": {
    "type": "tool_result",
    "content": " src/auth/login.ts | 24 ++++++--\\n 1 file changed",
    "exit_code": 0
  },
  "user": "alice@corp.example.com",
  "project_dir": "/home/alice/projects/myapp"
}`;

function AuditLoggingTab() {
  const [active, setActive] = useState("file");
  const dest = AUDIT_DESTINATIONS[active];

  const flowSteps = [
    { label: "Claude Code session", color: C.blue, sub: "user types a prompt" },
    { label: "Tool call executes", color: C.cyan, sub: "Bash · Edit · Read · Task · …" },
    { label: "PostToolUse fires", color: C.purple, sub: "hook receives JSON payload" },
    { label: "Handler runs", color: C.orange, sub: "command · http · mcp_tool" },
  ];

  return (
    <div>
      <SectionTitle color={C.purple} subtitle="Capture every tool invocation for compliance, debugging, and cost analysis">
        Audit Logging Architecture
      </SectionTitle>

      {/* Flow diagram */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28, flexWrap: "wrap", rowGap: 12 }}>
        {flowSteps.map((step, i) => (
          <React.Fragment key={step.label}>
            <div style={{
              background: `${step.color}10`, border: `1.5px solid ${step.color}40`,
              borderRadius: 10, padding: "10px 16px", textAlign: "center", minWidth: 130,
            }}>
              <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: step.color }}>{step.label}</div>
              <div style={{ ...sans, fontSize: 10, color: C.textDim, marginTop: 3 }}>{step.sub}</div>
            </div>
            {i < flowSteps.length - 1 && (
              <div style={{ color: C.textDim, fontSize: 18, padding: "0 6px", flexShrink: 0 }}>→</div>
            )}
          </React.Fragment>
        ))}
        <div style={{ color: C.textDim, fontSize: 18, padding: "0 6px" }}>→</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {Object.values(AUDIT_DESTINATIONS).map((d) => (
            <div key={d.label} style={{
              background: `${d.color}10`, border: `1.5px solid ${d.color}40`,
              borderRadius: 8, padding: "8px 12px", textAlign: "center",
            }}>
              <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: d.color }}>{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Destination selector */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(AUDIT_DESTINATIONS).map(([key, d]) => (
          <NavTab key={key} label={d.label} active={active === key} color={d.color} onClick={() => setActive(key)} />
        ))}
      </div>

      <div style={{
        background: `${dest.color}08`, border: `1px solid ${dest.color}30`,
        borderRadius: 8, padding: "10px 14px", marginBottom: 16,
      }}>
        <div style={{ ...sans, fontSize: 13, color: C.textSoft, lineHeight: 1.6 }}>{dest.desc}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Implementation
          </div>
          <CodeBlock code={dest.code} />
        </div>
        <div>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Log Entry Structure (JSON)
          </div>
          <CodeBlock code={AUDIT_LOG_SAMPLE} />
        </div>
      </div>
    </div>
  );
}

// ── Tab 4: Cost Governance ─────────────────────────────────────────

const MODEL_TIERS = [
  {
    model: "claude-haiku-4-5",
    color: C.green,
    use: "CI pipelines, bulk analysis, linting hooks",
    inputCost: "$0.80",
    outputCost: "$4.00",
    speed: "Fastest",
    recommend: "Use for: test generation, diff summaries, code search, auto-format checks",
  },
  {
    model: "claude-sonnet-4-5",
    color: C.blue,
    use: "Daily developer tasks, feature implementation",
    inputCost: "$3.00",
    outputCost: "$15.00",
    speed: "Balanced",
    recommend: "Use for: feature development, refactoring, code review, debugging",
  },
  {
    model: "claude-opus-4-5",
    color: C.purple,
    use: "Architecture decisions, complex multi-file changes",
    inputCost: "$15.00",
    outputCost: "$75.00",
    speed: "Deepest reasoning",
    recommend: "Use for: system design, security audits, complex migrations, root cause analysis",
  },
];

const USAGE_OUTPUT = `$ claude /usage

Session Usage Summary
─────────────────────────────────────────────
Model                   Input       Output
claude-sonnet-4-5      142,340 tk   18,920 tk
claude-haiku-4-5        28,100 tk    4,200 tk
─────────────────────────────────────────────
Session total          170,440 tk   23,120 tk

Estimated cost (direct API):
  Input:   $0.511  ($3.00 / MTok)
  Output:  $0.347  ($15.00 / MTok)
  Total:   $0.858

Cache performance:
  Cache write tokens:    34,200
  Cache read tokens:    108,140  (63% cache hit rate)
  Cache savings:        ~$0.324 vs uncached

Monthly projection (20 working days):
  At today's rate:      ~$17.16 / month / user`;

function CostGovernanceTab() {
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-5");
  const model = MODEL_TIERS.find(m => m.model === selectedModel);

  return (
    <div>
      <SectionTitle color={C.yellow} subtitle="Model tiering, prompt caching ROI, and per-user budget controls">
        Cost Governance Dashboard
      </SectionTitle>

      {/* Model tiers */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Model Tiering Strategy
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          {MODEL_TIERS.map((m) => (
            <button
              key={m.model}
              onClick={() => setSelectedModel(m.model)}
              style={{
                flex: "1 1 200px",
                background: selectedModel === m.model ? `${m.color}15` : C.card,
                border: `1.5px solid ${selectedModel === m.model ? m.color : C.border}`,
                borderRadius: 10, padding: "14px 16px",
                cursor: "pointer", textAlign: "left", transition: "all 0.15s",
              }}
            >
              <div style={{ ...mono, fontSize: 13, fontWeight: 700, color: m.color, marginBottom: 4 }}>{m.model}</div>
              <div style={{ ...sans, fontSize: 11, color: C.textSoft, marginBottom: 8 }}>{m.use}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <Tag color={m.color}>{m.inputCost}/MTok in</Tag>
                <Tag color={m.color}>{m.outputCost}/MTok out</Tag>
              </div>
            </button>
          ))}
        </div>
        {model && (
          <div style={{
            background: `${model.color}08`, border: `1px solid ${model.color}30`,
            borderRadius: 8, padding: "12px 16px",
            display: "flex", alignItems: "flex-start", gap: 12,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: model.color, marginTop: 4, flexShrink: 0 }} />
            <div>
              <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: model.color, marginBottom: 4 }}>{model.speed}</div>
              <div style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.6 }}>{model.recommend}</div>
            </div>
          </div>
        )}
      </div>

      {/* Cache ROI */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Prompt Caching ROI
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
          {[
            { label: "Cache write cost", value: "25% of input", sub: "One-time write fee", color: C.orange },
            { label: "Cache read cost", value: "10% of input", sub: "Per subsequent hit", color: C.green },
            { label: "Break-even", value: "2 reads", sub: "ROI positive after 2nd hit", color: C.blue },
            { label: "80% hit rate =", value: "73% cost reduction", sub: "On cached token portion", color: C.purple },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: `${stat.color}0a`, border: `1.5px solid ${stat.color}30`,
              borderRadius: 10, padding: "14px 16px",
            }}>
              <div style={{ ...sans, fontSize: 11, color: C.textDim, marginBottom: 6 }}>{stat.label}</div>
              <div style={{ ...sans, fontSize: 18, fontWeight: 800, color: stat.color, marginBottom: 4 }}>{stat.value}</div>
              <div style={{ ...sans, fontSize: 11, color: C.textSoft }}>{stat.sub}</div>
            </div>
          ))}
        </div>
        <div style={{
          background: C.greenBg, border: `1px solid ${C.greenBorder}`,
          borderRadius: 8, padding: "10px 14px",
        }}>
          <div style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.6 }}>
            <span style={{ color: C.green, fontWeight: 700 }}>Best practices: </span>
            Place large static context (CLAUDE.md, codebase summaries, documentation) at the top of the conversation.
            Claude automatically writes cache checkpoints at 1024-token intervals. CLAUDE.md files are cached across sessions.
          </div>
        </div>
      </div>

      {/* Budget config + /usage output */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Budget Controls (settings.json)
          </div>
          <CodeBlock code={`{
  // Per-session cost cap (USD)
  "maxCostPerSession": 5.00,

  // Max tokens per context window
  "maxTokensPerSession": 200000,

  // Default model (Haiku for CI jobs)
  "model": "claude-haiku-4-5",

  // Auto-compact when context is 80% full
  "autoCompact": true,

  // Warn before expensive model upgrades
  "warnOnModelUpgrade": true
}`} />
        </div>
        <div>
          <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            /usage Command Output
          </div>
          <CodeBlock code={USAGE_OUTPUT} />
        </div>
      </div>
    </div>
  );
}

// ── Tab 5: Rollout Playbook ────────────────────────────────────────

const ROLLOUT_PHASES = [
  {
    phase: "Week 1",
    label: "Pilot Group",
    color: C.blue,
    icon: "1",
    group: "5–10 senior devs",
    tasks: [
      "Install Claude Code on pilot machines manually",
      "Set ANTHROPIC_API_KEY in shell profiles",
      "Create root CLAUDE.md with team context",
      "Document initial prompting patterns",
      "Collect friction points and UX feedback",
    ],
    kpi: "Adoption rate, first-session success rate",
  },
  {
    phase: "Weeks 2–3",
    label: "Managed Rollout",
    color: C.cyan,
    icon: "2",
    group: "Engineering teams (~50 devs)",
    tasks: [
      "Deploy managed-settings.json via JAMF / Intune",
      "Configure ANTHROPIC_BASE_URL to corporate proxy",
      "Distribute CLAUDE.md templates per team via Git",
      "Enable audit logging hooks (PostToolUse → SIEM)",
      "Set maxCostPerSession limits in managed config",
    ],
    kpi: "% using managed settings, cost per developer-day",
  },
  {
    phase: "Week 4",
    label: "Full Team Rollout",
    color: C.green,
    icon: "3",
    group: "All engineering (~200 devs)",
    tasks: [
      "Broadcast CLAUDE.md + .claude/rules/ to all repos",
      "Enable PreToolUse safety hooks for dangerous commands",
      "Run training session on advanced prompting",
      "Create Slack channel for Claude Code support",
      "Monitor /usage across teams via webhook aggregation",
    ],
    kpi: "Tickets resolved with Claude, daily active users",
  },
  {
    phase: "Month 2",
    label: "Advanced Automation",
    color: C.orange,
    icon: "4",
    group: "Platform team",
    tasks: [
      "Deploy custom .claude/agents/ definitions per team",
      "Implement LLM-based prompt safety hooks (UserPromptSubmit)",
      "Distribute shared skill libraries via ~/.claude/commands/",
      "Integrate with GitHub Actions for PR review automation",
      "Connect MCP servers: GitHub, Linear, Datadog",
    ],
    kpi: "Hook coverage, agent invocations per day",
  },
  {
    phase: "Month 3",
    label: "Full Automation",
    color: C.purple,
    icon: "5",
    group: "Full org",
    tasks: [
      "Enable Agent Teams for feature development pipelines",
      "Deploy internal MCP server fleet (DBs, observability, deployments)",
      "Implement per-team cost budgets via webhook aggregator",
      "Quarterly review: update CLAUDE.md templates with learned patterns",
      "Internal Claude Code champion programme launched",
    ],
    kpi: "Feature velocity, cost ROI, support ticket deflection",
  },
];

function RolloutPlaybookTab() {
  const [open, setOpen] = useState(0);

  return (
    <div>
      <SectionTitle color={C.green} subtitle="Phased enterprise deployment from 5-person pilot to full org automation">
        Enterprise Rollout Playbook
      </SectionTitle>

      {/* Timeline bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, overflowX: "auto" }}>
        {ROLLOUT_PHASES.map((phase, i) => (
          <React.Fragment key={phase.phase}>
            <button
              onClick={() => setOpen(open === i ? -1 : i)}
              style={{
                flex: "1 1 120px",
                background: open === i ? `${phase.color}15` : C.card,
                border: `1.5px solid ${open === i ? phase.color : C.border}`,
                borderRadius: i === 0 ? "8px 0 0 8px" : i === ROLLOUT_PHASES.length - 1 ? "0 8px 8px 0" : "0",
                padding: "12px 14px", cursor: "pointer",
                textAlign: "center", transition: "all 0.15s", minWidth: 100,
              }}
            >
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: open === i ? phase.color : `${phase.color}30`,
                color: open === i ? C.bg : phase.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                ...mono, fontSize: 12, fontWeight: 800,
                margin: "0 auto 6px",
              }}>{phase.icon}</div>
              <div style={{ ...sans, fontSize: 11, fontWeight: 700, color: open === i ? phase.color : C.textSoft }}>{phase.phase}</div>
              <div style={{ ...sans, fontSize: 10, color: C.textDim, marginTop: 2 }}>{phase.label}</div>
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Detail panel */}
      {open >= 0 && ROLLOUT_PHASES[open] && (() => {
        const phase = ROLLOUT_PHASES[open];
        return (
          <div style={{
            background: `${phase.color}08`, border: `1.5px solid ${phase.color}40`,
            borderRadius: 12, padding: "20px 24px", marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: phase.color, color: C.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                ...mono, fontSize: 14, fontWeight: 800, flexShrink: 0,
              }}>{phase.icon}</div>
              <div>
                <div style={{ ...sans, fontSize: 16, fontWeight: 800, color: phase.color }}>{phase.phase}: {phase.label}</div>
                <div style={{ ...sans, fontSize: 12, color: C.textDim }}>Target group: {phase.group}</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Tag color={phase.color}>KPI: {phase.kpi}</Tag>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 8 }}>
              {phase.tasks.map((task, i) => (
                <div key={i} style={{
                  display: "flex", gap: 10, alignItems: "flex-start",
                  background: `${phase.color}06`, border: `1px solid ${phase.color}20`,
                  borderRadius: 7, padding: "8px 12px",
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: phase.color, marginTop: 5, flexShrink: 0 }} />
                  <span style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{task}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Success metrics */}
      <div style={{ marginTop: 8 }}>
        <div style={{ ...sans, fontSize: 12, color: C.textDim, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
          Success Metrics by Phase
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", ...sans, fontSize: 12 }}>
            <thead>
              <tr style={{ background: C.card }}>
                {["Phase", "Target Group", "Key Milestone", "KPI"].map(h => (
                  <th key={h} style={{
                    textAlign: "left", padding: "9px 12px", color: C.textDim,
                    fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6,
                    borderBottom: `1px solid ${C.border}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLLOUT_PHASES.map((p, i) => (
                <tr key={p.phase} style={{ background: i % 2 === 0 ? "transparent" : `${C.surface}80` }}>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}40` }}>
                    <span style={{ ...sans, fontSize: 12, fontWeight: 700, color: p.color }}>{p.phase}</span>
                  </td>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}40`, color: C.textSoft }}>{p.group}</td>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}40`, color: C.textSoft }}>{p.label}</td>
                  <td style={{ padding: "8px 12px", borderBottom: `1px solid ${C.border}40`, color: C.textDim, fontSize: 11 }}>{p.kpi}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Root Component ─────────────────────────────────────────────────

const TABS = [
  { id: "managed",  label: "Managed Settings", color: C.orange },
  { id: "auth",     label: "Auth Providers",   color: C.blue   },
  { id: "audit",    label: "Audit Logging",    color: C.purple },
  { id: "cost",     label: "Cost Governance",  color: C.yellow },
  { id: "rollout",  label: "Rollout Playbook", color: C.green  },
];

export default function EnterpriseDiagram() {
  const [tab, setTab] = useState("managed");

  const renderTab = () => {
    switch (tab) {
      case "managed": return <ManagedSettingsTab />;
      case "auth":    return <AuthProvidersTab />;
      case "audit":   return <AuditLoggingTab />;
      case "cost":    return <CostGovernanceTab />;
      case "rollout": return <RolloutPlaybookTab />;
      default:        return null;
    }
  };

  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: "28px 24px", color: C.text, minHeight: 500 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <div>
          <h1 style={{ ...sans, fontSize: 24, fontWeight: 800, color: C.white, margin: 0, letterSpacing: -0.5 }}>
            Enterprise Claude Code Deployment
          </h1>
          <p style={{ ...sans, fontSize: 13, color: C.textDim, margin: "6px 0 0" }}>
            Managed settings · Auth providers · Audit logging · Cost governance · Rollout playbook
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
