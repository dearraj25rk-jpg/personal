import{j as e}from"./jsx-runtime.u17CrQMm.js";import{r as d,R as f}from"./index.DrBtkhmp.js";const t={bg:"#0d1117",surface:"#161b22",card:"#1c2333",border:"rgba(255,255,255,0.08)",text:"#E8EDF5",textSoft:"#9BA8C0",textDim:"#5E6E8A",white:"#FFFFFF",green:"#00d46a",greenBg:"rgba(0,212,106,0.08)",blue:"#60A5FA",red:"#F87171",redBg:"rgba(248,113,113,0.08)",purple:"#A78BFA",cyan:"#22D3EE",orange:"#FB923C",yellow:"#FBBF24"},c={fontFamily:"'JetBrains Mono','Fira Code','SF Mono',Consolas,monospace"},l={fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"};function a({children:o,color:s=t.blue,subtitle:i}){return e.jsxs("div",{style:{marginBottom:20},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12},children:[e.jsx("div",{style:{width:4,height:28,borderRadius:2,background:s}}),e.jsx("h2",{style:{...l,fontSize:20,fontWeight:800,color:t.white,margin:0},children:o})]}),i&&e.jsx("p",{style:{...l,fontSize:13,color:t.textDim,margin:"6px 0 0 16px"},children:i})]})}function b({children:o,color:s=t.blue}){return e.jsx("span",{style:{...c,fontSize:11,fontWeight:600,color:s,background:`${s}18`,border:`1px solid ${s}40`,borderRadius:5,padding:"2px 7px"},children:o})}function h({code:o,lang:s="yaml"}){const[i,r]=d.useState(!1),n=()=>{navigator.clipboard?.writeText(o).catch(()=>{}),r(!0),setTimeout(()=>r(!1),1500)};return e.jsxs("div",{style:{position:"relative"},children:[e.jsx("pre",{style:{...c,fontSize:12,lineHeight:1.7,background:"#0a0e14",border:`1px solid ${t.border}`,borderRadius:8,padding:"14px 16px",margin:0,overflow:"auto",color:t.textSoft,whiteSpace:"pre"},children:o}),e.jsx("button",{onClick:n,style:{position:"absolute",top:8,right:8,...l,fontSize:11,fontWeight:600,background:i?t.greenBg:t.card,color:i?t.green:t.textDim,border:`1px solid ${i?t.green:t.border}`,borderRadius:5,padding:"3px 10px",cursor:"pointer"},children:i?"Copied":"Copy"})]})}function u({label:o,active:s,onClick:i,color:r=t.blue}){return e.jsx("button",{onClick:i,style:{...l,fontSize:13,fontWeight:s?700:500,color:s?r:t.textSoft,background:s?`${r}15`:"transparent",border:`1.5px solid ${s?r:"transparent"}`,borderRadius:8,padding:"7px 16px",cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s"},children:o})}const p=[{id:"event",icon:"⚡",label:"Git Event",color:t.yellow,desc:"Trigger",detail:"pull_request, issue_comment, push, workflow_dispatch — GitHub/GitLab webhook fires, payload delivered to CI runner."},{id:"runner",icon:"🖥",label:"CI Runner",color:t.blue,desc:"Execution env",detail:"ubuntu-latest (GitHub Actions) or gitlab-runner. Checks out code, sets ANTHROPIC_API_KEY from secrets, configures cloud credentials."},{id:"auth",icon:"🔐",label:"Auth / OIDC",color:t.purple,desc:"Credentials",detail:"Short-lived OIDC token → AWS STS AssumeRoleWithWebIdentity or GCP Workload Identity Federation. No long-lived keys in secrets."},{id:"action",icon:"🤖",label:"claude-code-action",color:t.green,desc:"anthropics/claude-code-action@v1",detail:"Spins up the Claude Code CLI inside the runner. Receives the prompt, tools list, and allowed_tools config. Emits tool_calls JSON stream."},{id:"loop",icon:"🔄",label:"Agentic Loop",color:t.cyan,desc:"Tool execution",detail:"Claude iteratively: reads files → calls tools (bash, read_file, write_file, search) → observes output → refines plan until task complete or max_turns reached."},{id:"output",icon:"📤",label:"Output",color:t.orange,desc:"PR comment / commit / artifact",detail:"Result posted as GitHub PR review comment, new commit pushed to branch, or artifact uploaded. Exit code 0 = success, non-zero fails the job."}];function v(){const[o,s]=d.useState(null);return e.jsxs("div",{children:[e.jsx(a,{color:t.blue,subtitle:"Click any stage to see details",children:"End-to-End Pipeline Flow"}),e.jsx("div",{style:{display:"flex",alignItems:"center",gap:0,overflowX:"auto",paddingBottom:8},children:p.map((i,r)=>e.jsxs(f.Fragment,{children:[e.jsxs("button",{onClick:()=>s(o===i.id?null:i.id),style:{background:o===i.id?`${i.color}20`:t.card,border:`2px solid ${o===i.id?i.color:t.border}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",textAlign:"center",minWidth:110,transition:"all 0.15s"},children:[e.jsx("div",{style:{fontSize:22,marginBottom:4},children:i.icon}),e.jsx("div",{style:{...l,fontSize:12,fontWeight:700,color:i.color,marginBottom:2},children:i.label}),e.jsx("div",{style:{...l,fontSize:10,color:t.textDim},children:i.desc})]}),r<p.length-1&&e.jsx("div",{style:{color:t.textDim,fontSize:18,padding:"0 4px",flexShrink:0},children:"→"})]},i.id))}),o&&(()=>{const i=p.find(r=>r.id===o);return e.jsxs("div",{style:{marginTop:16,background:`${i.color}0a`,border:`1.5px solid ${i.color}40`,borderRadius:12,padding:"16px 20px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8},children:[e.jsx("span",{style:{fontSize:20},children:i.icon}),e.jsx("span",{style:{...l,fontSize:16,fontWeight:800,color:i.color},children:i.label}),e.jsx(b,{color:i.color,children:i.desc})]}),e.jsx("p",{style:{...l,fontSize:13,color:t.textSoft,margin:0,lineHeight:1.7},children:i.detail})]})})()]})}const m={pr_review:{label:"PR Review",color:t.green,desc:"Triggers on pull_request, posts a code-review comment",code:`name: Claude PR Review
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
          github_token: \${{ secrets.GITHUB_TOKEN }}`},comment:{label:"Comment Responder",color:t.blue,desc:"Responds when a user comments /claude on a PR or issue",code:`name: Claude Comment Responder
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
          github_token: \${{ secrets.GITHUB_TOKEN }}`},dispatch:{label:"Action Input Reference",color:t.purple,desc:"workflow_dispatch with manual prompt input",code:`name: Claude Manual Task
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
          github_token: \${{ secrets.GITHUB_TOKEN }}`}};function y(){const[o,s]=d.useState("pr_review"),i=m[o];return e.jsxs("div",{children:[e.jsx(a,{color:t.green,subtitle:"anthropics/claude-code-action@v1  ·  Claude Code v2.1.126",children:"GitHub Actions Workflows"}),e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16},children:Object.entries(m).map(([r,n])=>e.jsx(u,{label:n.label,active:o===r,color:n.color,onClick:()=>s(r)},r))}),e.jsx("p",{style:{...l,fontSize:13,color:t.textSoft,marginBottom:12},children:i.desc}),e.jsx(h,{code:i.code})]})}const x={gitlab:{label:"GitLab CI",color:t.orange,code:`# .gitlab-ci.yml
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
        "Review the MR diff and post findings to stdout"`},shell:{label:"Shell Script",color:t.cyan,code:`#!/usr/bin/env bash
# ci-claude.sh — generic CI wrapper
set -euo pipefail

: "\${ANTHROPIC_API_KEY:?Set ANTHROPIC_API_KEY}"
PROMPT="\${1:-Summarise changes in this commit}"
MAX_TURNS="\${MAX_TURNS:-10}"

npx -y @anthropic-ai/claude-code \\
  --print \\
  --max-turns "$MAX_TURNS" \\
  --allowedTools "Bash,Read,Write" \\
  "$PROMPT"`},azure:{label:"Azure DevOps",color:t.blue,code:`# azure-pipelines.yml
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
      ANTHROPIC_API_KEY: $(ANTHROPIC_API_KEY)`},jenkins:{label:"Jenkins",color:t.red,code:`// Jenkinsfile
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
}`}};function _(){const[o,s]=d.useState("gitlab"),i=x[o];return e.jsxs("div",{children:[e.jsx(a,{color:t.orange,subtitle:"Drop-in examples for any runner",children:"GitLab · Shell · Azure DevOps · Jenkins"}),e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16},children:Object.entries(x).map(([r,n])=>e.jsx(u,{label:n.label,active:o===r,color:n.color,onClick:()=>s(r)},r))}),e.jsx(h,{code:i.code})]})}const g={bedrock:{label:"AWS Bedrock",color:t.orange,wif:`# GitHub Actions OIDC → AWS
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
    anthropic_api_key: ""          # leave empty; uses AWS creds`,notes:["IAM role needs bedrock:InvokeModel permission","Model IDs differ from direct API (prefix anthropic.)","us-east-1 and us-west-2 have widest model availability","Cross-region inference profiles supported via inference_profile_arn"]},vertex:{label:"GCP Vertex AI",color:t.blue,wif:`# GitHub Actions OIDC → GCP WIF
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
    anthropic_api_key: ""          # leave empty; uses GCP creds`,notes:["Service account needs roles/aiplatform.user","Model IDs use @date suffix on Vertex","us-east5 has the broadest Claude model support","WIF avoids storing long-lived service account keys"]}};function j(){const[o,s]=d.useState("bedrock"),i=g[o];return e.jsxs("div",{children:[e.jsx(a,{color:t.purple,subtitle:"Use cloud-hosted Claude via OIDC — no long-lived API keys",children:"Cloud Provider Integration"}),e.jsx("div",{style:{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16},children:Object.entries(g).map(([r,n])=>e.jsx(u,{label:n.label,active:o===r,color:n.color,onClick:()=>s(r)},r))}),e.jsx(h,{code:i.wif}),e.jsx("div",{style:{marginTop:16,display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10},children:i.notes.map((r,n)=>e.jsxs("div",{style:{background:`${i.color}0a`,border:`1px solid ${i.color}30`,borderRadius:8,padding:"10px 14px",display:"flex",alignItems:"flex-start",gap:8},children:[e.jsx("div",{style:{width:6,height:6,borderRadius:"50%",background:i.color,marginTop:5,flexShrink:0}}),e.jsx("span",{style:{...l,fontSize:12,color:t.textSoft,lineHeight:1.5},children:r})]},n))})]})}const C=[{ok:!0,label:"Use OIDC / WIF",detail:"Replace static API keys with short-lived OIDC tokens via AWS STS or GCP WIF."},{ok:!0,label:"Restrict allowed_tools",detail:"Set allowed_tools to the minimum required. Avoid Bash in read-only review jobs."},{ok:!0,label:"Least-privilege IAM",detail:"CI role needs only bedrock:InvokeModel or aiplatform.user — nothing else."},{ok:!0,label:"Pin action versions",detail:"Use anthropics/claude-code-action@v1.2.3 (exact SHA) not @v1 floating tag."},{ok:!0,label:"Secrets via env map",detail:"Never inline secrets in prompt strings. Always pass via env: block in YAML."},{ok:!0,label:"Set max_turns",detail:"Default is 10. Set lower for review-only jobs to bound API cost and runtime."},{ok:!1,label:"Avoid fork triggers",detail:"pull_request_target gives write access on fork PRs — use pull_request instead."},{ok:!1,label:"Sanitise comment input",detail:"If prompt comes from issue_comment, validate /claude prefix before passing to action."},{ok:!1,label:"Never log API keys",detail:"Ensure ANTHROPIC_API_KEY is masked; do not echo env vars in run: steps."}];function w(){return e.jsxs("div",{children:[e.jsx(a,{color:t.red,subtitle:"OWASP CI/CD Top-10 mitigations for Claude Code pipelines",children:"Security Hardening Checklist"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:8},children:C.map((o,s)=>e.jsxs("div",{style:{display:"flex",alignItems:"flex-start",gap:12,background:o.ok?t.greenBg:t.redBg,border:`1px solid ${o.ok?t.green:t.red}40`,borderRadius:10,padding:"12px 16px"},children:[e.jsx("span",{style:{fontSize:16,flexShrink:0,marginTop:1},children:o.ok?"✅":"⚠️"}),e.jsxs("div",{children:[e.jsx("div",{style:{...l,fontSize:13,fontWeight:700,color:o.ok?t.green:t.red,marginBottom:3},children:o.label}),e.jsx("div",{style:{...l,fontSize:12,color:t.textSoft,lineHeight:1.6},children:o.detail})]})]},s))})]})}const S=[{icon:"🎯",color:t.yellow,label:"Set max_turns low",detail:"Review-only jobs rarely need more than 5 turns. Set max_turns: 5 to cap token usage."},{icon:"📄",color:t.blue,label:"Scope the diff",detail:"Pass git diff HEAD~1 output directly in the prompt rather than letting Claude call Bash to fetch it — saves one round-trip."},{icon:"🗂",color:t.cyan,label:"Use allowed_tools: Read",detail:"Read-only jobs don't need Bash or Write. Narrower tool lists reduce token overhead from tool-schema injection."},{icon:"⚡",color:t.green,label:"Cache node_modules",detail:"Cache Claude Code CLI install with actions/cache keyed on package-lock.json to shave 20–30 s off each run."},{icon:"🔀",color:t.purple,label:"Filter triggers",detail:"Add path filters (paths: ['src/**']) so the job only runs when relevant files change."},{icon:"📊",color:t.orange,label:"Monitor usage",detail:"Track anthropic_usage_output_tokens from action outputs and alert if a single run exceeds a threshold."}];function I(){return e.jsxs("div",{children:[e.jsx(a,{color:t.yellow,subtitle:"Reduce token spend and wall-clock time",children:"Cost Optimisation Strategies"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12},children:S.map((o,s)=>e.jsxs("div",{style:{background:`${o.color}0a`,border:`1.5px solid ${o.color}30`,borderRadius:12,padding:"16px 18px"},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:10,marginBottom:8},children:[e.jsx("span",{style:{fontSize:20},children:o.icon}),e.jsx("span",{style:{...l,fontSize:13,fontWeight:700,color:o.color},children:o.label})]}),e.jsx("p",{style:{...l,fontSize:12,color:t.textSoft,margin:0,lineHeight:1.6},children:o.detail})]},s))})]})}const k=[{name:"ANTHROPIC_API_KEY",required:!0,example:"sk-ant-…",desc:"Direct API authentication. Leave empty when using Bedrock/Vertex."},{name:"ANTHROPIC_MODEL",required:!1,example:"claude-opus-4-5-20251101-v1:0",desc:"Override the default model. Useful for cost vs quality trade-offs."},{name:"ANTHROPIC_BASE_URL",required:!1,example:"https://proxy.acme.com",desc:"Point to a proxy or self-hosted gateway instead of api.anthropic.com."},{name:"AWS_REGION",required:!1,example:"us-east-1",desc:"Required when use_bedrock: true and not set via configure-aws-credentials."},{name:"AWS_ROLE_ARN",required:!1,example:"arn:aws:iam::…:role/…",desc:"IAM role to assume for Bedrock. Typically set by aws-actions step."},{name:"GCP_PROJECT_ID",required:!1,example:"my-gcp-project",desc:"Required when use_vertex: true."},{name:"GCP_REGION",required:!1,example:"us-east5",desc:"Vertex AI region. us-east5 has broadest Claude model coverage."},{name:"CLAUDE_CODE_MAX_TURNS",required:!1,example:"10",desc:"Max agentic loop iterations. Maps to --max-turns CLI flag."},{name:"GITHUB_TOKEN",required:!0,example:"(auto-provided)",desc:"Used to post PR comments and push commits. Needs pull-requests: write."},{name:"DISABLE_TELEMETRY",required:!1,example:"1",desc:"Opt out of anonymous usage telemetry sent to Anthropic."}];function A(){return e.jsxs("div",{children:[e.jsx(a,{color:t.cyan,subtitle:"All environment variables consumed by claude-code-action@v1",children:"Environment Variable Reference"}),e.jsx("div",{style:{overflowX:"auto"},children:e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",...l,fontSize:13},children:[e.jsx("thead",{children:e.jsx("tr",{style:{background:t.card},children:["Variable","Required","Example","Description"].map(o=>e.jsx("th",{style:{textAlign:"left",padding:"10px 14px",color:t.textDim,fontWeight:700,fontSize:11,textTransform:"uppercase",letterSpacing:.6,borderBottom:`1px solid ${t.border}`},children:o},o))})}),e.jsx("tbody",{children:k.map((o,s)=>e.jsxs("tr",{style:{background:s%2===0?"transparent":`${t.surface}80`},children:[e.jsx("td",{style:{padding:"9px 14px",borderBottom:`1px solid ${t.border}40`},children:e.jsx("code",{style:{...c,fontSize:12,color:t.cyan},children:o.name})}),e.jsx("td",{style:{padding:"9px 14px",borderBottom:`1px solid ${t.border}40`},children:e.jsx(b,{color:o.required?t.green:t.textDim,children:o.required?"required":"optional"})}),e.jsx("td",{style:{padding:"9px 14px",borderBottom:`1px solid ${t.border}40`},children:e.jsx("code",{style:{...c,fontSize:11,color:t.textSoft},children:o.example})}),e.jsx("td",{style:{padding:"9px 14px",borderBottom:`1px solid ${t.border}40`,color:t.textSoft,lineHeight:1.5},children:o.desc})]},o.name))})]})})]})}const R=[{id:"pipeline",label:"Pipeline Flow",color:t.blue},{id:"github",label:"GitHub Actions",color:t.green},{id:"other",label:"Other CI",color:t.orange},{id:"cloud",label:"Cloud Providers",color:t.purple},{id:"security",label:"Security",color:t.red},{id:"cost",label:"Cost Optimisation",color:t.yellow},{id:"envvars",label:"Env Vars",color:t.cyan}];function E(){const[o,s]=d.useState("pipeline"),i=()=>{switch(o){case"pipeline":return e.jsx(v,{});case"github":return e.jsx(y,{});case"other":return e.jsx(_,{});case"cloud":return e.jsx(j,{});case"security":return e.jsx(w,{});case"cost":return e.jsx(I,{});case"envvars":return e.jsx(A,{});default:return null}};return e.jsxs("div",{style:{background:t.bg,borderRadius:16,padding:"24px 20px",color:t.text},children:[e.jsxs("div",{style:{marginBottom:24},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12,marginBottom:6},children:[e.jsx("span",{style:{fontSize:26},children:"🚀"}),e.jsx("h1",{style:{...l,fontSize:24,fontWeight:900,color:t.white,margin:0},children:"CI/CD Integration"})]}),e.jsx("p",{style:{...l,fontSize:13,color:t.textDim,margin:0},children:"Claude Code in automated pipelines · v2.1.126 · anthropics/claude-code-action@v1"})]}),e.jsx("div",{style:{display:"flex",gap:6,flexWrap:"wrap",marginBottom:28,paddingBottom:16,borderBottom:`1px solid ${t.border}`},children:R.map(r=>e.jsx(u,{label:r.label,active:o===r.id,color:r.color,onClick:()=>s(r.id)},r.id))}),i()]})}export{E as default};
