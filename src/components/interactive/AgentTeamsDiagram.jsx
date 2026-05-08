import { useState } from 'react';

const TABS = ['Overview', 'Subagents (Task Tool)', 'Agent Teams', 'Decision Guide'];

const SUBAGENT_FRONTMATTER = `---
name: code-reviewer
description: >
  Reviews code changes for security vulnerabilities,
  code smells, and SOLID violations. Auto-invoked
  after significant edits to TypeScript or Python files.
model: claude-opus-4-7
effort: high
tools:
  - Read
  - Glob
  - Grep
  - WebFetch
context: fork
max-turns: 30
memory: true
memory-scope: project
---

# Code Reviewer

You are a senior engineer specialising in security
and code quality. Always return:
  - Summary paragraph
  - Issues list (critical/major/minor)
  - Suggested fixes with code snippets
  - Verdict: approve | request-changes`;

const TEAM_MANIFEST = `{
  "name": "feature-team",
  "members": [
    { "id": "orchestrator", "role": "coordinator" },
    { "id": "architect",    "role": "design" },
    { "id": "engineer",     "role": "implementation" },
    { "id": "reviewer",     "role": "review" }
  ],
  "created": "2026-05-08T09:00:00Z"
}`;

const DECISION_STEPS = [
  {
    q: 'Need parallel independent tasks?',
    yes: 'Task tool (multiple Task calls)',
    no: null,
  },
  {
    q: 'Need bidirectional communication between agents?',
    yes: 'Agent Teams (Research Preview)',
    no: null,
  },
  {
    q: 'Need persistent state across invocations?',
    yes: 'Agent Teams (Research Preview)',
    no: null,
  },
  {
    q: 'Is this CI/CD or a production pipeline?',
    yes: 'Task tool with --agent flag',
    no: 'Task tool for simple cases',
  },
];

export default function AgentTeamsDiagram() {
  const [tab, setTab] = useState(0);
  const [decisionStep, setDecisionStep] = useState(0);
  const [decisionResult, setDecisionResult] = useState(null);

  function resetDecision() {
    setDecisionStep(0);
    setDecisionResult(null);
  }

  function decide(yes) {
    const step = DECISION_STEPS[decisionStep];
    if (yes && step.yes) {
      setDecisionResult(step.yes);
    } else if (!yes) {
      if (decisionStep < DECISION_STEPS.length - 1) {
        setDecisionStep(decisionStep + 1);
      } else {
        setDecisionResult(step.no);
      }
    } else {
      setDecisionResult(step.yes);
    }
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto', padding: 8 }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button
            key={i}
            onClick={() => setTab(i)}
            style={{
              padding: '8px 16px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontWeight: tab === i ? 700 : 400,
              background: tab === i ? '#d2a8ff' : '#2d2d2d',
              color: tab === i ? '#0d1117' : '#e6edf3',
              fontSize: 13,
              transition: 'all 0.15s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <div>
          <h2 style={{ color: '#d2a8ff', margin: '0 0 12px' }}>Multi-Agent Architecture in Claude Code</h2>
          <p style={{ color: '#8b949e', marginBottom: 20, lineHeight: 1.6 }}>
            Claude Code supports two levels of multi-agent operation — the <strong style={{ color: '#e6edf3' }}>Task tool</strong> for
            lightweight parallel subagents, and <strong style={{ color: '#e6edf3' }}>Agent Teams</strong> for persistent,
            bidirectional peer-to-peer coordination.
          </p>
          <div style={{ overflowX: 'auto', marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#161b22' }}>
                  {['Feature', 'Subagents (Task Tool)', 'Agent Teams'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#8b949e', fontWeight: 600, borderBottom: '1px solid #30363d' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Status', 'GA (v1.0+)', 'Research Preview (v2.1.32+)'],
                  ['Communication', 'One-way fire-and-forget', 'Bidirectional peer-to-peer'],
                  ['Persistence', 'Ephemeral per call', 'Persistent filesystem mailbox'],
                  ['Parallelism', 'Yes — multiple Task calls', 'Yes — dedicated worker sessions'],
                  ['Context', 'fork (own context window)', 'Separate terminal sessions'],
                  ['Best for', 'Isolated subtasks, analysis', 'Complex coordinated workflows'],
                  ['Setup', 'Zero config required', 'Requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1'],
                ].map(([f, a, b], i) => (
                  <tr key={i} style={{ background: i % 2 ? '#0d1117' : '#161b22' }}>
                    <td style={{ padding: '9px 14px', color: '#8b949e', borderBottom: '1px solid #30363d', fontWeight: 500 }}>{f}</td>
                    <td style={{ padding: '9px 14px', color: '#7ee787', borderBottom: '1px solid #30363d' }}>{a}</td>
                    <td style={{ padding: '9px 14px', color: '#ffa657', borderBottom: '1px solid #30363d' }}>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 style={{ color: '#e6edf3', marginBottom: 14, fontSize: 14, fontWeight: 600 }}>Session Architecture</h3>
          <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <Box color="#d2a8ff" label="Your Session (Orchestrator)" sub="claude --session-id sess_01abc" />
              <Arrow />
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Box color="#7ee787" label="Subagent A" sub="Task tool → fork context" small />
                <Box color="#7ee787" label="Subagent B" sub="Task tool → fork context" small />
                <Box color="#7ee787" label="Subagent C" sub="Task tool → fork context" small />
              </div>
              <div style={{ color: '#8b949e', fontSize: 11, marginTop: 4 }}>Each runs in its own context window — fully parallel</div>
            </div>
          </div>
          <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Box color="#d2a8ff" label="Orchestrator Terminal" sub="claude --agent-team feature-team" small />
                <Box color="#ffa657" label="Architect Terminal" sub="claude --agent-team feature-team --agent-name architect" small />
                <Box color="#58a6ff" label="Engineer Terminal" sub="claude --agent-team feature-team --agent-name engineer" small />
              </div>
              <ArrowDown />
              <Box color="#f78166" label="Filesystem Mailbox" sub="~/.claude/teams/feature-team/inboxes/" />
              <div style={{ color: '#8b949e', fontSize: 11 }}>Atomic JSON messages — tempfile + os.replace for consistency</div>
            </div>
          </div>
        </div>
      )}

      {tab === 1 && (
        <div>
          <h2 style={{ color: '#7ee787', margin: '0 0 12px' }}>Subagents — Task Tool</h2>
          <p style={{ color: '#8b949e', marginBottom: 20, lineHeight: 1.6 }}>
            The Task tool spawns an independent Claude instance with its own context window and tool access.
            Define custom subagents in <code style={{ color: '#7ee787' }}>.claude/agents/&lt;name&gt;.md</code> to
            give them specialised instructions, model selection, and restricted tool access.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <InfoCard color="#7ee787" title="File Locations" items={[
              '.claude/agents/code-reviewer.md  ← project scope',
              '.claude/agents/test-writer.md',
              '~/.claude/agents/my-analyst.md   ← user scope',
              '.claude/agent-memory/<name>/MEMORY.md',
            ]} mono />
            <InfoCard color="#7ee787" title="YAML Frontmatter Fields" items={[
              'name: (required) identifier in /agents',
              'description: (required) auto-invocation trigger',
              'model: claude-opus-4-7 | sonnet | haiku',
              'effort: normal | high | xhigh',
              'tools: [] — restrict tool access',
              'context: fork | inherit',
              'max-turns: 1–100 (default 50)',
              'memory: true | false',
              'memory-scope: user | project | local',
            ]} mono />
          </div>
          <h3 style={{ color: '#e6edf3', marginBottom: 10, fontSize: 14, fontWeight: 600 }}>Example Agent Definition</h3>
          <pre style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 16, fontSize: 11, color: '#7ee787', overflowX: 'auto', lineHeight: 1.6, marginBottom: 20 }}>
            {SUBAGENT_FRONTMATTER}
          </pre>
          <h3 style={{ color: '#e6edf3', marginBottom: 10, fontSize: 14, fontWeight: 600 }}>Agent Memory Lifecycle</h3>
          <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Pill color="#58a6ff" text="Agent invoked" />
              <span style={{ color: '#8b949e' }}>→</span>
              <Pill color="#7ee787" text="Load MEMORY.md (≤200 lines / 25KB)" />
              <span style={{ color: '#8b949e' }}>→</span>
              <Pill color="#d2a8ff" text="Execute task" />
              <span style={{ color: '#8b949e' }}>→</span>
              <Pill color="#ffa657" text="Update MEMORY.md" />
              <span style={{ color: '#8b949e' }}>→</span>
              <Pill color="#f78166" text="Session ends" />
            </div>
            <p style={{ color: '#8b949e', fontSize: 12, margin: '12px 0 0', lineHeight: 1.5 }}>
              Memory persists across invocations. The first 200 lines or 25 KB are injected automatically at the start of every agent invocation.
            </p>
          </div>
          <InfoCard color="#7ee787" title="Common Subagent Patterns" items={[
            'Parallel analysis: spawn agents for each module simultaneously',
            'Specialist routing: code-reviewer → test-writer → security-auditor',
            'Read-only analyst: restrict tools to [Read, Glob, Grep] for safety',
            'CI/CD agent: claude --print ... --agent code-reviewer --permission-mode bypassPermissions',
            'Budget control: max-turns: 15 + model: claude-haiku-4-5 for bulk tasks',
          ]} />
        </div>
      )}

      {tab === 2 && (
        <div>
          <h2 style={{ color: '#ffa657', margin: '0 0 4px' }}>Agent Teams — Research Preview</h2>
          <div style={{ background: '#1c1400', border: '1px solid #3d2800', borderRadius: 6, padding: '8px 14px', marginBottom: 16, fontSize: 12, color: '#ffa657' }}>
            ⚠ Enable with: <code>export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1</code>
          </div>
          <p style={{ color: '#8b949e', marginBottom: 20, lineHeight: 1.6 }}>
            Agent Teams enable persistent, bidirectional communication between specialised agents running in
            separate terminal sessions. Each agent has its own inbox directory.
          </p>
          <h3 style={{ color: '#e6edf3', marginBottom: 10, fontSize: 14, fontWeight: 600 }}>Filesystem Layout</h3>
          <pre style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 16, fontSize: 11, color: '#ffa657', overflowX: 'auto', lineHeight: 1.6, marginBottom: 20 }}>
{`~/.claude/
└── teams/
    └── feature-team/
        ├── manifest.json
        ├── tasks/
        │   └── task-001.json
        └── inboxes/
            ├── orchestrator/
            ├── architect/
            └── engineer/`}
          </pre>
          <h3 style={{ color: '#e6edf3', marginBottom: 10, fontSize: 14, fontWeight: 600 }}>Team Manifest</h3>
          <pre style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 8, padding: 16, fontSize: 11, color: '#e6edf3', overflowX: 'auto', lineHeight: 1.6, marginBottom: 20 }}>
            {TEAM_MANIFEST}
          </pre>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <InfoCard color="#ffa657" title="Team Tools" items={[
              'TeamCreate — create team + register members',
              'TaskCreate — create and assign a task',
              'TaskUpdate — update task status or add results',
              'TaskList — list tasks and their states',
              'SendMessage — send to a specific agent',
              'TeamDelete — dissolve team, clean up files',
            ]} mono />
            <InfoCard color="#ffa657" title="Message Types" items={[
              'message — direct text to one agent',
              'broadcast — to all team members',
              'shutdown_request — graceful shutdown',
              'shutdown_response — confirms shutdown',
              'plan_approval_response — plan review',
              'task_update — task state notification',
            ]} mono />
          </div>
          <InfoCard color="#f78166" title="Known Limitations (v2.1.126)" items={[
            'No session resumption for team members',
            'No nested teams',
            'No cross-machine teams (shared filesystem required)',
            'Manual agent startup',
            'No built-in load balancing',
            'Practical max ~10 members',
            'TeamDelete required to clean up team files',
          ]} />
        </div>
      )}

      {tab === 3 && (
        <div>
          <h2 style={{ color: '#58a6ff', margin: '0 0 12px' }}>Which Pattern Should I Use?</h2>
          {decisionResult ? (
            <div style={{ background: '#0d1117', border: '2px solid #58a6ff', borderRadius: 10, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 8 }}>Recommendation:</div>
              <div style={{ fontSize: 22, color: '#58a6ff', fontWeight: 700, marginBottom: 16 }}>{decisionResult}</div>
              <button onClick={resetDecision} style={{ padding: '8px 20px', borderRadius: 6, border: 'none', background: '#161b22', color: '#e6edf3', cursor: 'pointer', fontSize: 13 }}>
                Start Over
              </button>
            </div>
          ) : (
            <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 10, padding: 24 }}>
              <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 8 }}>Question {decisionStep + 1} of {DECISION_STEPS.length}</div>
              <div style={{ fontSize: 17, color: '#e6edf3', fontWeight: 600, marginBottom: 20 }}>{DECISION_STEPS[decisionStep].q}</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button onClick={() => decide(true)} style={{ padding: '10px 28px', borderRadius: 6, border: 'none', background: '#238636', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Yes</button>
                <button onClick={() => decide(false)} style={{ padding: '10px 28px', borderRadius: 6, border: '1px solid #30363d', background: '#161b22', color: '#e6edf3', cursor: 'pointer', fontSize: 14 }}>No</button>
              </div>
            </div>
          )}
          <h3 style={{ color: '#e6edf3', marginBottom: 14, fontSize: 14, fontWeight: 600, marginTop: 28 }}>Full Decision Tree</h3>
          <div style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 8, padding: 16 }}>
            <pre style={{ fontSize: 12, color: '#e6edf3', margin: 0, lineHeight: 1.8 }}>
{`Need parallel tasks?
  YES → Task tool (multiple Task calls)
  NO  → Need bidirectional communication?
    YES → Agent Teams (Research Preview)
    NO  → Need persistent state?
      YES → Agent Teams (Research Preview)
      NO  → Is this CI/CD?
        YES → Task tool with --agent flag
        NO  → Task tool (simpler, more stable)`}
            </pre>
          </div>
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: '#0d2500', border: '1px solid #238636', borderRadius: 8, padding: 14 }}>
              <div style={{ color: '#7ee787', fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Task Tool — Best For</div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', color: '#8b949e', fontSize: 12, lineHeight: 1.7 }}>
                <li>Parallel independent analyses</li>
                <li>Context isolation</li>
                <li>CI/CD automation pipelines</li>
                <li>Production-grade stability needed</li>
              </ul>
            </div>
            <div style={{ background: '#1c1000', border: '1px solid #3d2800', borderRadius: 8, padding: 14 }}>
              <div style={{ color: '#ffa657', fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Agent Teams — Best For</div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', color: '#8b949e', fontSize: 12, lineHeight: 1.7 }}>
                <li>Long-running coordinated workflows</li>
                <li>Agents that need to send results back</li>
                <li>Complex feature development pipelines</li>
                <li>Experimental features acceptable</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Box({ color, label, sub, small }) {
  return (
    <div style={{ border: `2px solid ${color}`, borderRadius: 8, padding: small ? '8px 14px' : '10px 20px', textAlign: 'center', minWidth: small ? 160 : 280 }}>
      <div style={{ color, fontWeight: 700, fontSize: small ? 12 : 14 }}>{label}</div>
      {sub && <div style={{ color: '#8b949e', fontSize: 11, marginTop: 2, fontFamily: 'monospace' }}>{sub}</div>}
    </div>
  );
}

function Arrow() {
  return <div style={{ color: '#30363d', fontSize: 20, lineHeight: 1 }}>↕</div>;
}

function ArrowDown() {
  return <div style={{ color: '#30363d', fontSize: 20, lineHeight: 1 }}>↓</div>;
}

function Pill({ color, text }) {
  return (
    <span style={{ background: color + '22', border: `1px solid ${color}`, borderRadius: 4, padding: '3px 8px', color, fontSize: 12, fontWeight: 500 }}>
      {text}
    </span>
  );
}

function InfoCard({ color, title, items, mono }) {
  return (
    <div style={{ background: '#0d1117', border: `1px solid ${color}33`, borderRadius: 8, padding: 14 }}>
      <div style={{ color, fontWeight: 600, marginBottom: 10, fontSize: 13 }}>{title}</div>
      <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
        {items.map((item, i) => (
          <li key={i} style={{ color: '#8b949e', fontSize: 12, lineHeight: 1.7, fontFamily: mono ? 'monospace' : 'inherit' }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
