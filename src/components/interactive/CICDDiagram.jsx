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
  greenBg: "rgba(0,212,106,0.08)",
  greenBorder: "rgba(0,212,106,0.25)",
  blue: "#60A5FA",
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
  yellow: "#FBBF24",
  yellowBg: "rgba(251,191,36,0.08)",
  yellowBorder: "rgba(251,191,36,0.25)",
  pink: "#F472B6",
  pinkBg: "rgba(244,114,182,0.08)",
  pinkBorder: "rgba(244,114,182,0.25)",
};

const mono = { fontFamily: "'JetBrains Mono','Fira Code','SF Mono',Consolas,monospace" };
const sans = { fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" };

// ── small shared components ───────────────────────────────────────

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

function CodeBlock({ code, lang = "yaml" }) {
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

// ── Pipeline Flow ─────────────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    id: "event",
    icon: "⚡",
    label: "Git Event",
    color: C.yellow,
    desc: "Trigger",
    detail: "pull_request, issue_comment, push, workflow_dispatch — GitHub/GitLab webhook fires, payload delivered to CI runner.",
  },
  {
    id: "runner",
    icon: "🖥",
    label: "CI Runner",
    color: C.blue,
    desc: "Execution env",
    detail: "ubuntu-latest (GitHub Actions) or gitlab-runner. Checks out code, sets ANTHROPIC_API_KEY from secrets, configures cloud credentials.",
  },
  {
    id: "auth",
    icon: "🔐",
    label: "Auth / OIDC",
    color: C.purple,
    desc: "Credentials",
    detail: "Short-lived OIDC token → AWS STS AssumeRoleWithWebIdentity or GCP Workload Identity Federation. No long-lived keys in secrets.",
  },
  {
    id: "action",
    icon: "🤖",
    label: "claude-code-action",
    color: C.green,
    desc: "anthropics/claude-code-action@v1",
    detail: "Spins up the Claude Code CLI inside the runner. Receives the prompt, tools list, and allowed_tools config. Emits tool_calls JSON stream.",
  },
  {
    id: "loop",
    icon: "🔄",
    label: "Agentic Loop",
    color: C.cyan,
    desc: "Tool execution",
    detail: "Claude iteratively: reads files → calls tools (bash, read_file, write_file, search) → observes output → refines plan until task complete or max_turns reached.",
  },
  {
    id: "output",
    icon: "📤",
    label: "Output",
    color: C.orange,
    desc: "PR comment / commit / artifact",
    detail: "Result posted as GitHub PR review comment, new commit pushed to branch, or artifact uploaded. Exit code 0 = success, non-zero fails the job.",
  },
];

function PipelineFlow() {
  const [active, setActive] = useState(null);
  return (
    <div>
      <SectionTitle color={C.blue} subtitle="Click any stage to see details">
        End-to-End Pipeline Flow
      </SectionTitle>

      {/* Horizontal stepper */}
      <div style={{
        display: "flex", alignItems: "center", gap: 0,
        overflowX: "auto", paddingBottom: 8,
      }}>
        {PIPELINE_STEPS.map((step, i) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => setActive(active === step.id ? null : step.id)}
              style={{
                background: active === step.id ? `${step.color}20` : C.card,
                border: `2px solid ${active === step.id ? step.color : C.border}`,
                borderRadius: 12, padding: "14px 16px",
                cursor: "pointer", textAlign: "center", minWidth: 110,
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{step.icon}</div>
              <div style={{ ...sans, fontSize: 12, fontWeight: 700, color: step.color, marginBottom: 2 }}>{step.label}</div>
              <div style={{ ...sans, fontSize: 10, color: C.textDim }}>{step.desc}</div>
            </button>
            {i < PIPELINE_STEPS.length - 1 && (
              <div style={{ color: C.textDim, fontSize: 18, padding: "0 4px", flexShrink: 0 }}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Detail panel */}
      {active && (() => {
        const step = PIPELINE_STEPS.find(s => s.id === active);
        return (
          <div style={{
            marginTop: 16, background: `${step.color}0a`,
            border: `1.5px solid ${step.color}40`, borderRadius: 12,
            padding: "16px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{step.icon}</span>
              <span style={{ ...sans, fontSize: 16, fontWeight: 800, color: step.color }}>{step.label}</span>
              <Tag color={step.color}>{step.desc}</Tag>
            </div>
            <p style={{ ...sans, fontSize: 13, color: C.textSoft, margin: 0, lineHeight: 1.7 }}>{step.detail}</p>
          </div>
        );
      })()}
    </div>
  );
}

// ── GitHub Actions ────────────────────────────────────────────────

const GH_WORKFLOWS = {
  pr_review: {
    label: "PR Review",
    color: C.green,
    desc: "Triggers on pull_request, posts a code-review comment",
    code: `name: Claude PR Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }

      - uses: anthropics/claude-code-action@v1
        with:
          prompt: |
            Review the diff in this PR.
            Focus on correctness, security, and style.
            Post a concise review as a PR comment.
          allowed_tools: "Bash,Read,Write"
          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
          github_token: \${{ secrets.GITHUB_TOKEN }}`,
  },
  comment: {
    label: "Comment Responder",
    color: C.blue,
    desc: "Responds when a user comments /claude on a PR or issue",
    code: `name: Claude Comment Responder
on:
  issue_comment:
    types: [created]

jobs:
  respond:
    if: contains(github.event.comment.body, '/claude')
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
      issues: write
    steps:
      - uses: actions/checkout@v4

      - uses: anthropics/claude-code-action@v1
        with:
          prompt: \${{ github.event.comment.body }}
          allowed_tools: "Bash,Read,Write,Search"
          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
          github_token: \${{ secrets.GITHUB_TOKEN }}`,
  },
  dispatch: {
    label: "Action Input Reference",
    color: C.purple,
    desc: "workflow_dispatch with manual prompt input",
    code: `name: Claude Manual Task
on:
  workflow_dispatch:
    inputs:
      prompt:
        description: "Task for Claude"
        required: true
      max_turns:
        description: "Max agentic turns (default 10)"
        default: "10"

jobs:
  task:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: anthropics/claude-code-action@v1
        with:
          prompt: \${{ inputs.prompt }}
          max_turns: \${{ inputs.max_turns }}
          allowed_tools: "Bash,Read,Write,Search,mcp__github__*"
          anthropic_api_key: \${{ secrets.ANTHROPIC_API_KEY }}
          github_token: \${{ secrets.GITHUB_TOKEN }}`,
  },
};

function GitHubActions() {
  const [active, setActive] = useState("pr_review");
  const wf = GH_WORKFLOWS[active];
  return (
    <div>
      <SectionTitle color={C.green} subtitle="anthropics/claude-code-action@v1  ·  Claude Code v2.1.126">
        GitHub Actions Workflows
      </SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(GH_WORKFLOWS).map(([key, w]) => (
          <NavTab key={key} label={w.label} active={active === key} color={w.color} onClick={() => setActive(key)} />
        ))}
      </div>
      <p style={{ ...sans, fontSize: 13, color: C.textSoft, marginBottom: 12 }}>{wf.desc}</p>
      <CodeBlock code={wf.code} />
    </div>
  );
}

// ── Other CI Platforms ────────────────────────────────────────────

const OTHER_CI = {
  gitlab: {
    label: "GitLab CI",
    color: C.orange,
    code: `# .gitlab-ci.yml
claude-review:
  image: node:22-slim
  stage: review
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
  script:
    - npm install -g @anthropic-ai/claude-code
    - claude --print --max-turns 8
        "Review the MR diff and post findings to stdout"`,
  },
  shell: {
    label: "Shell Script",
    color: C.cyan,
    code: `#!/usr/bin/env bash
# ci-claude.sh — generic CI wrapper
set -euo pipefail

: "\${ANTHROPIC_API_KEY:?Set ANTHROPIC_API_KEY}"
PROMPT="\${1:-Summarise changes in this commit}"
MAX_TURNS="\${MAX_TURNS:-10}"

npx -y @anthropic-ai/claude-code \\
  --print \\
  --max-turns "\$MAX_TURNS" \\
  --allowedTools "Bash,Read,Write" \\
  "\$PROMPT"`,
  },
  azure: {
    label: "Azure DevOps",
    color: C.blue,
    code: `# azure-pipelines.yml
trigger:
  - main

pool:
  vmImage: ubuntu-latest

steps:
  - checkout: self
    fetchDepth: 0

  - task: NodeTool@0
    inputs:
      versionSpec: "22.x"

  - script: npm install -g @anthropic-ai/claude-code
    displayName: Install Claude Code

  - script: |
      claude --print --max-turns 10 \\
        "Review recent changes for security issues"
    displayName: Run Claude Review
    env:
      ANTHROPIC_API_KEY: \$(ANTHROPIC_API_KEY)`,
  },
  jenkins: {
    label: "Jenkins",
    color: C.red,
    code: `// Jenkinsfile
pipeline {
  agent { label 'linux' }

  environment {
    ANTHROPIC_API_KEY = credentials('anthropic-api-key')
  }

  stages {
    stage('Claude Review') {
      steps {
        checkout scm
        sh '''
          npm install -g @anthropic-ai/claude-code
          claude --print --max-turns 8 \\
            "Analyse this diff and report issues"
        '''
      }
    }
  }
}`,
  },
};

function OtherCI() {
  const [active, setActive] = useState("gitlab");
  const ci = OTHER_CI[active];
  return (
    <div>
      <SectionTitle color={C.orange} subtitle="Drop-in examples for any runner">
        GitLab · Shell · Azure DevOps · Jenkins
      </SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(OTHER_CI).map(([key, c]) => (
          <NavTab key={key} label={c.label} active={active === key} color={c.color} onClick={() => setActive(key)} />
        ))}
      </div>
      <CodeBlock code={ci.code} />
    </div>
  );
}

// ── Cloud Providers ───────────────────────────────────────────────

const CLOUD = {
  bedrock: {
    label: "AWS Bedrock",
    color: C.orange,
    wif: `# GitHub Actions OIDC → AWS
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/GitHubActionsRole
    aws-region: us-east-1

- uses: anthropics/claude-code-action@v1
  with:
    use_bedrock: "true"
    aws_region: us-east-1          # or set AWS_REGION env
    model: anthropic.claude-opus-4-5-20251101-v1:0
    prompt: "Review this PR"
    anthropic_api_key: ""          # leave empty; uses AWS creds`,
    notes: [
      "IAM role needs bedrock:InvokeModel permission",
      "Model IDs differ from direct API (prefix anthropic.)",
      "us-east-1 and us-west-2 have widest model availability",
      "Cross-region inference profiles supported via inference_profile_arn",
    ],
  },
  vertex: {
    label: "GCP Vertex AI",
    color: C.blue,
    wif: `# GitHub Actions OIDC → GCP WIF
- uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: >-
      projects/123/locations/global/workloadIdentityPools/gh-pool/
      providers/gh-provider
    service_account: claude-ci@my-project.iam.gserviceaccount.com

- uses: anthropics/claude-code-action@v1
  with:
    use_vertex: "true"
    gcp_project_id: my-project
    gcp_region: us-east5
    model: claude-opus-4-5@20251101
    prompt: "Review this PR"
    anthropic_api_key: ""          # leave empty; uses GCP creds`,
    notes: [
      "Service account needs roles/aiplatform.user",
      "Model IDs use @date suffix on Vertex",
      "us-east5 has the broadest Claude model support",
      "WIF avoids storing long-lived service account keys",
    ],
  },
};

function CloudProviders() {
  const [active, setActive] = useState("bedrock");
  const c = CLOUD[active];
  return (
    <div>
      <SectionTitle color={C.purple} subtitle="Use cloud-hosted Claude via OIDC — no long-lived API keys">
        Cloud Provider Integration
      </SectionTitle>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {Object.entries(CLOUD).map(([key, cl]) => (
          <NavTab key={key} label={cl.label} active={active === key} color={cl.color} onClick={() => setActive(key)} />
        ))}
      </div>
      <CodeBlock code={c.wif} />
      <div style={{
        marginTop: 16, display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10,
      }}>
        {c.notes.map((n, i) => (
          <div key={i} style={{
            background: `${c.color}0a`, border: `1px solid ${c.color}30`,
            borderRadius: 8, padding: "10px 14px",
            display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, marginTop: 5, flexShrink: 0 }} />
            <span style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.5 }}>{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Security Hardening ────────────────────────────────────────────

const SEC_ITEMS = [
  { ok: true,  label: "Use OIDC / WIF",        detail: "Replace static API keys with short-lived OIDC tokens via AWS STS or GCP WIF." },
  { ok: true,  label: "Restrict allowed_tools", detail: "Set allowed_tools to the minimum required. Avoid Bash in read-only review jobs." },
  { ok: true,  label: "Least-privilege IAM",    detail: "CI role needs only bedrock:InvokeModel or aiplatform.user — nothing else." },
  { ok: true,  label: "Pin action versions",    detail: "Use anthropics/claude-code-action@v1.2.3 (exact SHA) not @v1 floating tag." },
  { ok: true,  label: "Secrets via env map",    detail: "Never inline secrets in prompt strings. Always pass via env: block in YAML." },
  { ok: true,  label: "Set max_turns",          detail: "Default is 10. Set lower for review-only jobs to bound API cost and runtime." },
  { ok: false, label: "Avoid fork triggers",    detail: "pull_request_target gives write access on fork PRs — use pull_request instead." },
  { ok: false, label: "Sanitise comment input", detail: "If prompt comes from issue_comment, validate /claude prefix before passing to action." },
  { ok: false, label: "Never log API keys",     detail: "Ensure ANTHROPIC_API_KEY is masked; do not echo env vars in run: steps." },
];

function Security() {
  return (
    <div>
      <SectionTitle color={C.red} subtitle="OWASP CI/CD Top-10 mitigations for Claude Code pipelines">
        Security Hardening Checklist
      </SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {SEC_ITEMS.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            background: item.ok ? C.greenBg : C.redBg,
            border: `1px solid ${item.ok ? C.green : C.red}40`,
            borderRadius: 10, padding: "12px 16px",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{item.ok ? "✅" : "⚠️"}</span>
            <div>
              <div style={{ ...sans, fontSize: 13, fontWeight: 700, color: item.ok ? C.green : C.red, marginBottom: 3 }}>
                {item.label}
              </div>
              <div style={{ ...sans, fontSize: 12, color: C.textSoft, lineHeight: 1.6 }}>{item.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cost Optimisation ─────────────────────────────────────────────

const COST_TIPS = [
  {
    icon: "🎯",
    color: C.yellow,
    label: "Set max_turns low",
    detail: "Review-only jobs rarely need more than 5 turns. Set max_turns: 5 to cap token usage.",
  },
  {
    icon: "📄",
    color: C.blue,
    label: "Scope the diff",
    detail: "Pass git diff HEAD~1 output directly in the prompt rather than letting Claude call Bash to fetch it — saves one round-trip.",
  },
  {
    icon: "🗂",
    color: C.cyan,
    label: "Use allowed_tools: Read",
    detail: "Read-only jobs don't need Bash or Write. Narrower tool lists reduce token overhead from tool-schema injection.",
  },
  {
    icon: "⚡",
    color: C.green,
    label: "Cache node_modules",
    detail: "Cache Claude Code CLI install with actions/cache keyed on package-lock.json to shave 20–30 s off each run.",
  },
  {
    icon: "🔀",
    color: C.purple,
    label: "Filter triggers",
    detail: "Add path filters (paths: ['src/**']) so the job only runs when relevant files change.",
  },
  {
    icon: "📊",
    color: C.orange,
    label: "Monitor usage",
    detail: "Track anthropic_usage_output_tokens from action outputs and alert if a single run exceeds a threshold.",
  },
];

function CostOptimisation() {
  return (
    <div>
      <SectionTitle color={C.yellow} subtitle="Reduce token spend and wall-clock time">
        Cost Optimisation Strategies
      </SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
        {COST_TIPS.map((tip, i) => (
          <div key={i} style={{
            background: `${tip.color}0a`, border: `1.5px solid ${tip.color}30`,
            borderRadius: 12, padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{tip.icon}</span>
              <span style={{ ...sans, fontSize: 13, fontWeight: 700, color: tip.color }}>{tip.label}</span>
            </div>
            <p style={{ ...sans, fontSize: 12, color: C.textSoft, margin: 0, lineHeight: 1.6 }}>{tip.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Env Var Reference ─────────────────────────────────────────────

const ENV_VARS = [
  { name: "ANTHROPIC_API_KEY",   required: true,  example: "sk-ant-…",              desc: "Direct API authentication. Leave empty when using Bedrock/Vertex." },
  { name: "ANTHROPIC_MODEL",     required: false, example: "claude-opus-4-5-20251101-v1:0", desc: "Override the default model. Useful for cost vs quality trade-offs." },
  { name: "ANTHROPIC_BASE_URL",  required: false, example: "https://proxy.acme.com", desc: "Point to a proxy or self-hosted gateway instead of api.anthropic.com." },
  { name: "AWS_REGION",          required: false, example: "us-east-1",              desc: "Required when use_bedrock: true and not set via configure-aws-credentials." },
  { name: "AWS_ROLE_ARN",        required: false, example: "arn:aws:iam::…:role/…",  desc: "IAM role to assume for Bedrock. Typically set by aws-actions step." },
  { name: "GCP_PROJECT_ID",      required: false, example: "my-gcp-project",         desc: "Required when use_vertex: true." },
  { name: "GCP_REGION",          required: false, example: "us-east5",               desc: "Vertex AI region. us-east5 has broadest Claude model coverage." },
  { name: "CLAUDE_CODE_MAX_TURNS", required: false, example: "10",                   desc: "Max agentic loop iterations. Maps to --max-turns CLI flag." },
  { name: "GITHUB_TOKEN",        required: true,  example: "(auto-provided)",         desc: "Used to post PR comments and push commits. Needs pull-requests: write." },
  { name: "DISABLE_TELEMETRY",   required: false, example: "1",                      desc: "Opt out of anonymous usage telemetry sent to Anthropic." },
];

function EnvVars() {
  return (
    <div>
      <SectionTitle color={C.cyan} subtitle="All environment variables consumed by claude-code-action@v1">
        Environment Variable Reference
      </SectionTitle>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", ...sans, fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.card }}>
              {["Variable", "Required", "Example", "Description"].map(h => (
                <th key={h} style={{
                  textAlign: "left", padding: "10px 14px",
                  color: C.textDim, fontWeight: 700, fontSize: 11,
                  textTransform: "uppercase", letterSpacing: 0.6,
                  borderBottom: `1px solid ${C.border}`,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ENV_VARS.map((v, i) => (
              <tr key={v.name} style={{ background: i % 2 === 0 ? "transparent" : `${C.surface}80` }}>
                <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}40` }}>
                  <code style={{ ...mono, fontSize: 12, color: C.cyan }}>{v.name}</code>
                </td>
                <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}40` }}>
                  <Tag color={v.required ? C.green : C.textDim}>{v.required ? "required" : "optional"}</Tag>
                </td>
                <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}40` }}>
                  <code style={{ ...mono, fontSize: 11, color: C.textSoft }}>{v.example}</code>
                </td>
                <td style={{ padding: "9px 14px", borderBottom: `1px solid ${C.border}40`, color: C.textSoft, lineHeight: 1.5 }}>
                  {v.desc}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Root component ────────────────────────────────────────────────

const TABS = [
  { id: "pipeline",  label: "Pipeline Flow",    color: C.blue   },
  { id: "github",    label: "GitHub Actions",   color: C.green  },
  { id: "other",     label: "Other CI",         color: C.orange },
  { id: "cloud",     label: "Cloud Providers",  color: C.purple },
  { id: "security",  label: "Security",         color: C.red    },
  { id: "cost",      label: "Cost Optimisation", color: C.yellow },
  { id: "envvars",   label: "Env Vars",         color: C.cyan   },
];

export default function CICDDiagram() {
  const [tab, setTab] = useState("pipeline");

  const renderTab = () => {
    switch (tab) {
      case "pipeline":  return <PipelineFlow />;
      case "github":    return <GitHubActions />;
      case "other":     return <OtherCI />;
      case "cloud":     return <CloudProviders />;
      case "security":  return <Security />;
      case "cost":      return <CostOptimisation />;
      case "envvars":   return <EnvVars />;
      default:          return null;
    }
  };

  return (
    <div style={{ background: C.bg, borderRadius: 16, padding: "24px 20px", color: C.text }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 26 }}>🚀</span>
          <h1 style={{ ...sans, fontSize: 24, fontWeight: 900, color: C.white, margin: 0 }}>
            CI/CD Integration
          </h1>
        </div>
        <p style={{ ...sans, fontSize: 13, color: C.textDim, margin: 0 }}>
          Claude Code in automated pipelines · v2.1.126 · anthropics/claude-code-action@v1
        </p>
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
