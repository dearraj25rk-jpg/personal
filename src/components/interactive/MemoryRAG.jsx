import { useState } from "react";

const Callout = ({ type = "info", children }) => {
  const s = {
    info:    { bg: "#0c1f35", border: "#38bdf8", icon: "💡" },
    analogy: { bg: "#0f2a1a", border: "#4ade80", icon: "🎯" },
    warning: { bg: "#2a1a0a", border: "#fb923c", icon: "⚠️" },
    key:     { bg: "#1a0f2a", border: "#c084fc", icon: "🔑" },
    live:    { bg: "#0a2a1a", border: "#34d399", icon: "🌐" },
  }[type];
  return (
    <div style={{ background: s.bg, borderLeft: `4px solid ${s.border}`, border: `1px solid ${s.border}44`, borderRadius: 8, padding: "12px 16px", margin: "14px 0", display: "flex", gap: 10 }}>
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{s.icon}</span>
      <div style={{ color: "#cbd5e1", fontSize: 13.5, lineHeight: 1.8 }}>{children}</div>
    </div>
  );
};

const Code = ({ code, lang = "python" }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 10, overflow: "hidden", margin: "14px 0" }}>
      <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "6px 14px", display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#334155", fontSize: 11, fontFamily: "monospace" }}>{lang}</span>
        <button onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 11 }}>{copied ? "✓ copied" : "copy"}</button>
      </div>
      <pre style={{ margin: 0, padding: "14px 16px", fontSize: 12, lineHeight: 1.75, color: "#94a3b8", fontFamily: "'Fira Code', monospace", overflowX: "auto" }}>{code}</pre>
    </div>
  );
};

const Tag = ({ children, color = "#38bdf8" }) => (
  <span style={{ background: `${color}18`, border: `1px solid ${color}44`, color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, margin: "2px 3px", display: "inline-block" }}>{children}</span>
);

// ─── Memory Tier Diagram ─────────────────────────────────────────────────────
const MemoryTierDiagram = () => {
  const [hovered, setHovered] = useState(null);
  const tiers = [
    {
      id: "sensory",
      label: "Sensory / In-Context",
      icon: "👁️",
      color: "#f87171",
      storage: "LLM Context Window",
      duration: "Current turn only",
      example: "The exact current message + immediate chat history",
      analogy: "What you see RIGHT NOW on your screen",
      tokens: "Up to 200k tokens",
    },
    {
      id: "short",
      label: "Short-Term Memory",
      icon: "🧠",
      color: "#fb923c",
      storage: "Redis / In-Memory Store",
      duration: "Session duration (minutes–hours)",
      example: "Last 10 messages of this insurance claim conversation",
      analogy: "Working memory — what you remember from today's meeting",
      tokens: "Last k turns (sliding window)",
    },
    {
      id: "episodic",
      label: "Episodic Memory",
      icon: "📼",
      color: "#facc15",
      storage: "Vector DB (ChromaDB / Qdrant / pgvector)",
      duration: "Days to weeks",
      example: "Summary of last 5 sessions with this customer; their prior claim C-789 filed Jan 10",
      analogy: "Specific past events you can recall — 'that conversation last week where they mentioned the accident'",
      tokens: "Compressed summaries (100–300 tokens each), searchable by semantic similarity",
    },
    {
      id: "semantic",
      label: "Semantic / Long-Term Memory",
      icon: "🗂️",
      color: "#4ade80",
      storage: "Vector DB + SQL (PostgreSQL / Qdrant)",
      duration: "Permanent",
      example: "User prefers Hindi, policy P-200 (APAC flood endorsement), filed 2 claims, high-value tier",
      analogy: "Facts you just know — 'my friend likes tea, not coffee, and hates Mondays'",
      tokens: "Key-value facts + vector embeddings; cross-session user profile",
    },
    {
      id: "procedural",
      label: "Procedural Memory",
      icon: "⚙️",
      color: "#818cf8",
      storage: "System Prompt / Config",
      duration: "Permanent (baked in)",
      example: "Always respond in formal tone, never quote premiums without disclaimer",
      analogy: "Muscle memory — how to ride a bike without thinking",
      tokens: "Fixed system prompt rules",
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {tiers.map((t, i) => (
          <div key={t.id} onMouseEnter={() => setHovered(t.id)} onMouseLeave={() => setHovered(null)}
            style={{ background: hovered === t.id ? `${t.color}12` : "#0a0f1e", border: `1px solid ${hovered === t.id ? t.color + "66" : t.color + "22"}`, borderLeft: `4px solid ${t.color}`, borderRadius: 8, padding: "12px 16px", cursor: "default", transition: "all 0.15s" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{t.icon}</span>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ color: t.color, fontWeight: 700, fontSize: 14 }}>{i + 1}. {t.label}</div>
                <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{t.storage} · {t.duration}</div>
                {hovered === t.id && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#475569" }}>Example: </span>{t.example}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 13, marginBottom: 4 }}>
                      <span style={{ color: "#475569" }}>Analogy: </span>{t.analogy}
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: 13 }}>
                      <span style={{ color: "#475569" }}>Scope: </span>{t.tokens}
                    </div>
                  </div>
                )}
              </div>
              {!hovered || hovered !== t.id ? <div style={{ color: "#334155", fontSize: 11 }}>hover for details →</div> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Pipeline Diagram ────────────────────────────────────────────────────────
const MemoryRAGPipeline = () => {
  const [step, setStep] = useState(null);
  const steps = [
    { n: 1, icon: "💬", label: "User Query", color: "#38bdf8", desc: "Customer asks: 'What's the status of my claim?' — This is not the first interaction. They talked to us yesterday too." },
    { n: 2, icon: "🧵", label: "Load Short-Term Memory", color: "#fb923c", desc: "Redis fetches last 5 turns of THIS session. Injected directly into context window. The LLM can 'see' what was said earlier today." },
    { n: 3, icon: "🔍", label: "Retrieve Episodic Memory", color: "#facc15", desc: "Vector DB searched for past sessions related to 'claim status' for this user. Returns: 'User filed claim C-789 on Jan 10, last told processing takes 7 days.'" },
    { n: 4, icon: "👤", label: "Load Semantic Memory", color: "#4ade80", desc: "User profile pulled: 'Preferred language: Hindi, Policy: P-200, High-value customer, prefers formal responses.' This personalises the reply." },
    { n: 5, icon: "📄", label: "RAG: Retrieve Docs", color: "#c084fc", desc: "Standard RAG (optionally with Contextual Retrieval + BM25 hybrid) retrieves relevant policy/claim procedure documents — 'Claims processed in 5–7 business days per SLA section 4.2.' Up to 67% fewer retrieval failures vs naive RAG when using contextual retrieval." },
    { n: 6, icon: "🧩", label: "Merge All Context", color: "#f472b6", desc: "Memory orchestrator combines: short-term turns + episodic summaries + semantic user facts + RAG doc chunks. Builds ONE enriched prompt." },
    { n: 7, icon: "🤖", label: "LLM Generates Answer", color: "#818cf8", desc: "Claude receives the full merged context and generates a personalised, grounded, contextually-aware answer." },
    { n: 8, icon: "💾", label: "Update Memory", color: "#34d399", desc: "After response: this turn appended to short-term (Redis). Session summary updated in episodic store. User facts refreshed if anything new learned." },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ color: "#475569", fontSize: 12, marginBottom: 12 }}>Click any step to understand it deeply:</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
        {steps.map(s => (
          <div key={s.n} onClick={() => setStep(step === s.n ? null : s.n)}
            style={{ background: step === s.n ? `${s.color}18` : "#0a0f1e", border: `1px solid ${step === s.n ? s.color + "66" : s.color + "22"}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "center", transition: "all 0.15s" }}>
            <div style={{ fontSize: 20 }}>{s.icon}</div>
            <div style={{ color: s.color, fontSize: 11, fontWeight: 700, marginTop: 4 }}>{s.n}. {s.label}</div>
          </div>
        ))}
      </div>
      {step && (() => {
        const s = steps.find(x => x.n === step);
        return (
          <div style={{ background: `${s.color}10`, border: `1px solid ${s.color}44`, borderLeft: `4px solid ${s.color}`, borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{s.icon} Step {s.n}: {s.label}</div>
            <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7 }}>{s.desc}</div>
          </div>
        );
      })()}
    </div>
  );
};

// ─── Memory vs No-Memory Simulation ─────────────────────────────────────────
const ConversationDemo = () => {
  const [mode, setMode] = useState("naive");
  const conversations = {
    naive: [
      { role: "user", msg: "Hi, I want to check my claim status." },
      { role: "bot", msg: "Sure! Please provide your policy number and claim ID." },
      { role: "user", msg: "It's policy P-200, claim C-789." },
      { role: "bot", msg: "Your claim C-789 under P-200 is under review. Processing takes 5–7 days." },
      { role: "user", msg: "When did I file it?" },
      { role: "bot", bad: true, msg: "I'm sorry, I don't have access to your previous messages. Could you please provide the claim filing date?" },
      { role: "user", msg: "I told you last session it was January 10th!" },
      { role: "bot", bad: true, msg: "I apologize, but I don't have access to previous sessions. Could you repeat the details?" },
    ],
    memory: [
      { role: "user", msg: "Hi, I want to check my claim status." },
      { role: "bot", msg: "Hello! I can see you're following up on claim C-789 under policy P-200 that you filed on January 10th. It's currently under review — you're on day 4 of the 5–7 day processing window.", memory: ["episodic: filed C-789 on Jan 10", "semantic: policy P-200"] },
      { role: "user", msg: "When will it be resolved?" },
      { role: "bot", msg: "Based on your January 10th filing, you should expect a resolution by January 17th at the latest.", memory: ["short-term: Jan 10 filing date from this session"] },
      { role: "user", msg: "What if it takes longer?" },
      { role: "bot", msg: "If your claim isn't resolved by January 17th, you can escalate under section 4.2 of your P-200 policy, which guarantees a manager review within 48 hours.", memory: ["semantic: policy P-200 holder", "RAG: SLA clause 4.2"] },
    ],
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {[["naive", "❌ Without Memory (Naive RAG)"], ["memory", "✅ With Memory RAG"]].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            style={{ background: mode === m ? (m === "naive" ? "#ff000022" : "#00ff0022") : "#0a0f1e", border: `1px solid ${mode === m ? (m === "naive" ? "#ef4444" : "#4ade80") : "#1e293b"}`, color: mode === m ? (m === "naive" ? "#ef4444" : "#4ade80") : "#475569", padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: mode === m ? 700 : 400 }}>
            {label}
          </button>
        ))}
      </div>
      <div style={{ background: "#060d17", border: "1px solid #1e293b", borderRadius: 10, padding: 16, maxHeight: 380, overflowY: "auto" }}>
        {conversations[mode].map((turn, i) => (
          <div key={i} style={{ display: "flex", flexDirection: turn.role === "user" ? "row-reverse" : "row", gap: 8, marginBottom: 12, alignItems: "flex-start" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: turn.role === "user" ? "#1e3a5f" : turn.bad ? "#2a0f0f" : "#0f2a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
              {turn.role === "user" ? "👤" : turn.bad ? "❌" : "🤖"}
            </div>
            <div style={{ maxWidth: "75%" }}>
              <div style={{ background: turn.role === "user" ? "#1e293b" : turn.bad ? "#2a0f0f" : "#0f172a", border: `1px solid ${turn.bad ? "#ef444444" : turn.role === "user" ? "#334155" : "#1e3a5f"}`, borderRadius: 10, padding: "8px 12px", fontSize: 13, color: turn.bad ? "#f87171" : "#cbd5e1", lineHeight: 1.6 }}>
                {turn.msg}
              </div>
              {turn.memory && (
                <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {turn.memory.map((m, j) => (
                    <span key={j} style={{ background: "#0f2a1a", border: "1px solid #166534", color: "#4ade80", fontSize: 10, padding: "1px 7px", borderRadius: 10 }}>📎 {m}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {mode === "naive" && (
        <div style={{ marginTop: 8, color: "#ef4444", fontSize: 12, textAlign: "center" }}>
          ⚠️ Naive RAG forgets everything between turns and sessions — frustrating for users!
        </div>
      )}
      {mode === "memory" && (
        <div style={{ marginTop: 8, color: "#4ade80", fontSize: 12, textAlign: "center" }}>
          ✅ Memory RAG remembers claim details, policy, and previous sessions automatically
        </div>
      )}
    </div>
  );
};

// ─── Memory Scoring ──────────────────────────────────────────────────────────
const MemoryScoringDemo = () => {
  const memories = [
    { fact: "User filed claim C-789 on Jan 10", recency: 90, importance: 85, similarity: 70, final: 84 },
    { fact: "User prefers formal responses", recency: 40, importance: 70, similarity: 30, final: 48 },
    { fact: "User's policy is P-200", recency: 60, importance: 95, similarity: 80, final: 80 },
    { fact: "User mentioned liking cricket", recency: 30, importance: 20, similarity: 10, final: 19 },
    { fact: "SLA breach escalation right: 48h", recency: 55, importance: 90, similarity: 88, final: 79 },
  ];
  const Bar = ({ val, color }) => (
    <div style={{ flex: 1, background: "#0a0f1e", borderRadius: 3, height: 6, overflow: "hidden" }}>
      <div style={{ width: `${val}%`, height: "100%", background: color, borderRadius: 3 }} />
    </div>
  );
  return (
    <div style={{ marginTop: 16, background: "#060d17", border: "1px solid #1e293b", borderRadius: 10, padding: 16 }}>
      <div style={{ color: "#475569", fontSize: 11, marginBottom: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
        Query: "What's my claim status?" — Memory Scoring
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
        {["Memory Fact", "Recency", "Importance", "Similarity", "SCORE"].map(h => (
          <div key={h} style={{ color: "#334155", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{h}</div>
        ))}
      </div>
      {memories.sort((a, b) => b.final - a.final).map((m, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: 8, alignItems: "center", padding: "8px 0", borderTop: "1px solid #0f172a" }}>
          <div style={{ color: i === 0 ? "#4ade80" : "#64748b", fontSize: 12 }}>{i === 0 ? "✅ " : ""}{m.fact}</div>
          <Bar val={m.recency} color="#fb923c" />
          <Bar val={m.importance} color="#c084fc" />
          <Bar val={m.similarity} color="#38bdf8" />
          <div style={{ color: i === 0 ? "#4ade80" : "#475569", fontWeight: i === 0 ? 800 : 400, fontSize: 13 }}>{m.final}</div>
        </div>
      ))}
      <div style={{ marginTop: 10, color: "#334155", fontSize: 11 }}>
        Score = 0.4×Recency + 0.35×Importance + 0.25×Similarity
      </div>
    </div>
  );
};

// ─── RAG vs Memory ───────────────────────────────────────────────────────────
const RAGvsMemory = () => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
    {[
      { title: "📄 RAG", color: "#38bdf8", answers: "What does THIS DOCUMENT say?", stateful: false, scope: "Documents / Knowledge base", example: "Policy P-200 covers theft up to $50k.", forget: "Forgets you immediately.", items: ["Static knowledge retrieval", "Same answer for all users", "Document-grounded truth", "Read-only"] },
      { title: "🧠 Memory", color: "#4ade80", answers: "What does THIS USER need?", stateful: true, scope: "User-specific context", example: "This user filed claim C-789 on Jan 10.", forget: "Remembers you across sessions.", items: ["Dynamic user context", "Personalised per user", "Behavioural continuity", "Read + Write"] },
    ].map((col, i) => (
      <div key={i} style={{ background: "#0a0f1e", border: `1px solid ${col.color}33`, borderTop: `3px solid ${col.color}`, borderRadius: 8, padding: 16 }}>
        <div style={{ color: col.color, fontWeight: 800, fontSize: 16, marginBottom: 6 }}>{col.title}</div>
        <div style={{ color: "#94a3b8", fontSize: 13, fontStyle: "italic", marginBottom: 10 }}>"{col.answers}"</div>
        {col.items.map((item, j) => (
          <div key={j} style={{ color: "#64748b", fontSize: 13, padding: "3px 0", display: "flex", gap: 6 }}>
            <span style={{ color: col.color }}>→</span> {item}
          </div>
        ))}
        <div style={{ marginTop: 10, background: "#060d17", borderRadius: 6, padding: "8px 10px", color: "#475569", fontSize: 12, fontStyle: "italic" }}>
          "{col.example}"<br/><span style={{ color: col.stateful ? "#4ade80" : "#ef4444" }}>{col.forget}</span>
        </div>
      </div>
    ))}
    <div style={{ gridColumn: "1 / -1", background: "#0f2a1a", border: "1px solid #166534", borderRadius: 8, padding: 12 }}>
      <span style={{ color: "#4ade80", fontWeight: 700 }}>Production truth: </span>
      <span style={{ color: "#94a3b8", fontSize: 13 }}>Most production AI systems need BOTH. RAG = knowledge. Memory = personalization. A general production system uses RAG for knowledge retrieval and Memory for user context across conversations.</span>
    </div>
  </div>
);

// ─── MemoRAG ─────────────────────────────────────────────────────────────────
const MemoRAGSection = () => (
  <div style={{ marginTop: 16 }}>
    <div style={{ background: "#0a0f1e", border: "1px solid #7c3aed44", borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <div style={{ color: "#a78bfa", fontWeight: 700, marginBottom: 8 }}>MemoRAG — Accepted at WebConf 2025</div>
      <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.8 }}>
        Traditional RAG fails on <strong style={{ color: "#e2e8f0" }}>implicit queries</strong> — questions where the answer isn't directly in one chunk but requires understanding the whole document. MemoRAG solves this with a <strong style={{ color: "#a78bfa" }}>dual-system architecture</strong>:
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
        {[
          { name: "Memory Model (light)", desc: "Reads the ENTIRE document corpus. Creates a global memory via KV compression. Generates 'draft clues' to guide retrieval.", color: "#38bdf8" },
          { name: "Generation Model (heavy)", desc: "Receives the targeted evidence found by the memory model's clues. Generates the final precise, contextually-rich answer.", color: "#a78bfa" },
        ].map((s, i) => (
          <div key={i} style={{ background: "#060d17", border: `1px solid ${s.color}33`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 13 }}>{s.name}</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4, lineHeight: 1.7 }}>{s.desc}</div>
          </div>
        ))}
      </div>
    </div>
    <Code lang="python" code={`# MemoRAG — production-grade global memory RAG
from memorag import MemoRAGLite

pipe = MemoRAGLite()

# Feed entire insurance document corpus into memory model
# Processes millions of tokens in one pass
context = open("insurance_policies_full.txt").read()
pipe.memorize(context, save_dir="./insurance_memory", print_stats=True)

# Now query — memory model generates clues, retriever finds evidence
query = "What are all the exclusion clauses that apply to P-200 in flood scenarios?"

# Standard RAG would MISS this — no single chunk says "all exclusions for P-200 floods"
# MemoRAG's memory model generates: ["P-200 exclusions section", "flood clause 7.3", "force majeure"]
# Then retrieves targeted evidence and generates complete answer
response = pipe(query)
print(response)`} />
  </div>
);

// ─── Observational Memory ─────────────────────────────────────────────────────
const ObservationalSection = () => (
  <div style={{ marginTop: 16 }}>
    <div style={{ background: "#0a0f1e", border: "1px solid #34d39944", borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
        <div style={{ color: "#34d399", fontWeight: 700 }}>Observational Memory (Mastra 1.0 — Feb 2026)</div>
        <Tag color="#34d399">LATEST</Tag>
      </div>
      <div style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.8, marginTop: 8 }}>
        Scored <strong style={{ color: "#34d399" }}>94.87%</strong> on LongMemEval vs RAG's ~80%. <strong style={{ color: "#e2e8f0" }}>10x cheaper</strong> than vector-based memory. Uses two background agents:
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        {[
          { name: "Observer Agent", desc: "When unobserved messages hit 30k tokens, compresses them into dated observation notes.", color: "#34d399" },
          { name: "Reflector Agent", desc: "Periodically reviews all observations and extracts higher-level insights and patterns.", color: "#818cf8" },
        ].map((a, i) => (
          <div key={i} style={{ flex: 1, minWidth: 200, background: "#060d17", border: `1px solid ${a.color}33`, borderRadius: 8, padding: 12 }}>
            <div style={{ color: a.color, fontWeight: 700, fontSize: 13 }}>{a.name}</div>
            <div style={{ color: "#64748b", fontSize: 12, marginTop: 4, lineHeight: 1.7 }}>{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
    <Code lang="python" code={`# Observational Memory — Mastra pattern (Feb 2026)
# No vector DB needed! Compressed text blocks only.

OBSERVER_PROMPT = """
You are the Observer. Given this conversation history, 
extract key observations as dated, concise notes.

Format: [DATE] OBSERVATION: <fact>

Conversation:
{messages}

Extract observations:"""

REFLECTOR_PROMPT = """
You are the Reflector. Review these observations and 
extract higher-level patterns and user preferences.

Observations:
{observations}

Higher-level insights:"""

class ObservationalMemory:
    def __init__(self):
        self.observations = []       # Block 1: compressed dated notes
        self.current_messages = []   # Block 2: raw recent history
        self.threshold = 30_000      # tokens before compression
    
    def add_message(self, role: str, content: str):
        self.current_messages.append({"role": role, "content": content})
        
        # Auto-compress when threshold hit
        if self._count_tokens() > self.threshold:
            self._observe()
    
    def _observe(self):
        # Observer agent compresses current messages
        new_obs = llm(OBSERVER_PROMPT.format(
            messages=self.current_messages
        ))
        self.observations.extend(new_obs)
        self.current_messages = []  # Clear — now compressed
    
    def build_context(self) -> str:
        return f"""
=== MEMORY (Observations) ===
{chr(10).join(self.observations)}

=== CURRENT SESSION ===
{self.current_messages}
"""
# Context window stays STABLE — no vector search needed
# 10x cheaper, 94.87% accuracy on LongMemEval`} />
  </div>
);

// ─── General Integration ─────────────────────────────────────────────────────
const GeneralMemory = () => (
  <div style={{ marginTop: 16 }}>
    <div style={{ background: "#0c1a2e", border: "1px solid #1e40af44", borderRadius: 10, padding: 16, marginBottom: 12 }}>
      <div style={{ color: "#60a5fa", fontWeight: 700, marginBottom: 12 }}>🏗️ Memory RAG Design — General Architecture</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { layer: "Sensory", tech: "LLM Context Window", what: "Current turn + system prompt", why: "Always present, no extra engineering" },
          { layer: "Short-Term", tech: "Redis (TTL=2h)", what: "Last 10 messages of current session", why: "Sliding window keeps claim conversation coherent" },
          { layer: "Episodic", tech: "ChromaDB (existing!)", what: "Session summaries, past claim interactions", why: "Retrieve relevant past sessions semantically" },
          { layer: "Semantic", tech: "PostgreSQL / SQLite", what: "User profile: policy, claims, preferences, language", why: "Personalise every response, no repeated questions" },
          { layer: "Procedural", tech: "CLAUDE.md / System Prompt", what: "Tone rules, disclaimer rules, escalation rules", why: "Always-on behaviour rules" },
        ].map((row, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #1e293b" }}>
            <div style={{ minWidth: 100, color: "#60a5fa", fontWeight: 700, fontSize: 12 }}>{row.layer}</div>
            <div style={{ minWidth: 180, color: "#38bdf8", fontSize: 12, fontFamily: "monospace" }}>{row.tech}</div>
            <div style={{ flex: 1, color: "#64748b", fontSize: 12 }}>{row.what}</div>
            <div style={{ minWidth: 200, color: "#94a3b8", fontSize: 12, fontStyle: "italic" }}>{row.why}</div>
          </div>
        ))}
      </div>
    </div>
    <Code lang="python" code={`# General Memory-Augmented RAG
import redis
import json
from anthropic import Anthropic
import chromadb

client = Anthropic()
r = redis.Redis(host='localhost', port=6379, decode_responses=True)
chroma = chromadb.Client()
memory_collection = chroma.get_or_create_collection("session_summaries")

def get_user_profile(user_id: str) -> dict:
    """Semantic memory — user facts from DB"""
    # SQLite/PostgreSQL lookup
    return {
        "policy": "P-200",
        "active_claims": ["C-789"],
        "preferred_language": "English",
        "tier": "premium"
    }

def get_short_term(session_id: str, k: int = 10) -> list:
    """Short-term memory — Redis sliding window"""
    messages = r.lrange(f"session:{session_id}", -k * 2, -1)
    return [json.loads(m) for m in messages]

def get_episodic(user_id: str, query: str) -> list:
    """Episodic memory — semantic search over past sessions"""
    results = memory_collection.query(
        query_texts=[query],
        where={"user_id": user_id},
        n_results=3
    )
    return results["documents"][0] if results["documents"] else []

def get_rag_docs(query: str) -> list:
    """Standard RAG — policy/procedure documents"""
    policy_collection = chroma.get_collection("insurance_policies")
    results = policy_collection.query(query_texts=[query], n_results=3)
    return results["documents"][0]

def memory_rag_query(user_id: str, session_id: str, query: str) -> str:
    # 1. Load all memory layers
    profile     = get_user_profile(user_id)
    short_term  = get_short_term(session_id)
    episodic    = get_episodic(user_id, query)
    rag_docs    = get_rag_docs(query)

    # 2. Build enriched prompt
    system = f"""You are a helpful assistant.

USER PROFILE (Semantic Memory):
{json.dumps(profile, indent=2)}

PAST SESSION SUMMARIES (Episodic Memory):
{chr(10).join(episodic) if episodic else "No past sessions."}

POLICY DOCUMENTS (RAG):
{chr(10).join(rag_docs)}

Rules: Always address by policy number. Never repeat questions 
already answered in session history."""

    messages = short_term + [{"role": "user", "content": query}]

    # 3. Generate
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=1024,
        system=system,
        messages=messages
    )
    answer = response.content[0].text

    # 4. Update short-term memory (Redis)
    r.rpush(f"session:{session_id}", json.dumps({"role": "user", "content": query}))
    r.rpush(f"session:{session_id}", json.dumps({"role": "assistant", "content": answer}))
    r.expire(f"session:{session_id}", 7200)  # 2h TTL

    return answer

# Usage
response = memory_rag_query(
    user_id="user_123",
    session_id="sess_abc",
    query="What's the current status of my claim?"
)
# → "Your claim C-789 under policy P-200 is under review. 
#    Based on your January 10th filing, resolution expected by January 17th."`} />
  </div>
);

// ─── Tabs ────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "what", label: "🧠 What is it?", },
  { id: "types", label: "📚 5 Memory Types" },
  { id: "pipeline", label: "🔄 Pipeline" },
  { id: "demo", label: "💬 Live Demo" },
  { id: "scoring", label: "🏆 Memory Scoring" },
  { id: "vs", label: "⚔️ RAG vs Memory" },
  { id: "memorag", label: "🔬 MemoRAG (2025)" },
  { id: "observational", label: "🆕 Observational (2026)" },
  { id: "general", label: "🏗️ General" },
];

export default function MemoryRAG() {
  const [tab, setTab] = useState("what");

  return (
    <div style={{ background: "#0d1117", color: "#e2e8f0", fontFamily: "'DM Sans', system-ui, sans-serif", borderRadius: 8, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#161b22" }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#1e3a5f", marginBottom: 6, textTransform: "uppercase" }}>Deep Dive</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
          🧠 Memory RAG
        </h1>
        <div style={{ color: "#334155", fontSize: 13, marginTop: 4 }}>RAG that remembers — across turns, sessions, and users</div>
        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 6 }}>
          <Tag color="#38bdf8">Session Memory</Tag>
          <Tag color="#4ade80">Long-Term Memory</Tag>
          <Tag color="#fb923c">Redis</Tag>
          <Tag color="#c084fc">ChromaDB</Tag>
          <Tag color="#f472b6">Personalization</Tag>
          <Tag color="#34d399">MemoRAG 2025</Tag>
          <Tag color="#facc15">Observational Memory 2026</Tag>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ padding: "0 12px", background: "#060d17", borderBottom: "1px solid #0f172a", display: "flex", overflowX: "auto", gap: 2 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ background: tab === t.id ? "#0ea5e910" : "none", border: "none", borderBottom: tab === t.id ? "2px solid #0ea5e9" : "2px solid transparent", color: tab === t.id ? "#0ea5e9" : "#334155", padding: "10px 14px", cursor: "pointer", fontSize: 12, fontWeight: tab === t.id ? 700 : 400, whiteSpace: "nowrap", fontFamily: "inherit" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "24px 28px", maxWidth: 860 }}>

        {tab === "what" && (
          <div>
            <h2 style={{ color: "#38bdf8", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>What is Memory RAG?</h2>
            <p style={{ color: "#64748b", margin: "0 0 16px", lineHeight: 1.7 }}>Standard RAG retrieves from documents. Memory RAG also retrieves from <em>history</em> — what this user said, did, and needs.</p>

            <Callout type="analogy">
              <strong>The Doctor Analogy</strong><br />
              A doctor who only reads your current test results (Naive RAG) vs a doctor who also checks your full medical history, remembers your allergies, knows you were here last month with the same complaint, and recalls you prefer direct answers without jargon. <strong>The second doctor is Memory RAG.</strong>
            </Callout>

            <Callout type="info">
              <strong>The core problem it solves:</strong> LLMs are stateless — they have zero memory between API calls. Every time a user sends a message, the LLM starts completely fresh. Memory RAG engineers the illusion of continuity by retrieving and injecting relevant history at each turn.
            </Callout>

            <h3 style={{ color: "#e2e8f0", marginTop: 20, fontSize: 16 }}>What Memory RAG adds to standard RAG:</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                ["Within-session continuity", "Remembers what was said 3 messages ago", "#fb923c"],
                ["Cross-session continuity", "Remembers what was said last week", "#facc15"],
                ["User personalisation", "Knows your policy, preferences, language", "#4ade80"],
                ["Implicit query enrichment", "Query becomes richer using prior context", "#38bdf8"],
                ["Learning over time", "Gets smarter about YOU with each interaction", "#c084fc"],
              ].map(([title, desc, color], i) => (
                <div key={i} style={{ display: "flex", gap: 10, background: "#0a0f1e", border: `1px solid ${color}22`, borderLeft: `3px solid ${color}`, borderRadius: 6, padding: "10px 14px" }}>
                  <div>
                    <div style={{ color, fontWeight: 700, fontSize: 13 }}>{title}</div>
                    <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "types" && (
          <div>
            <h2 style={{ color: "#38bdf8", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>The 5 Types of Memory</h2>
            <p style={{ color: "#64748b", margin: "0 0 4px", lineHeight: 1.7 }}>Inspired by cognitive science. Hover each tier to see details.</p>
            <MemoryTierDiagram />
          </div>
        )}

        {tab === "pipeline" && (
          <div>
            <h2 style={{ color: "#38bdf8", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Memory RAG Pipeline</h2>
            <p style={{ color: "#64748b", margin: "0 0 4px", lineHeight: 1.7 }}>8-step flow — from user query to memory-enriched answer.</p>
            <MemoryRAGPipeline />
            <Callout type="warning">
              <strong>The key difference from Naive RAG:</strong> Steps 2, 3, 4 don't exist in Naive RAG at all. And step 8 (memory update) is the most important — this is what makes the system get smarter over time.
            </Callout>
          </div>
        )}

        {tab === "demo" && (
          <div>
            <h2 style={{ color: "#38bdf8", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Live Conversation Comparison</h2>
            <p style={{ color: "#64748b", margin: "0 0 4px", lineHeight: 1.7 }}>Same insurance conversation — with and without Memory RAG.</p>
            <ConversationDemo />
          </div>
        )}

        {tab === "scoring" && (
          <div>
            <h2 style={{ color: "#38bdf8", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>How Memory is Scored & Retrieved</h2>
            <p style={{ color: "#64748b", margin: "0 0 4px", lineHeight: 1.7 }}>Unlike RAG (pure similarity), memory scoring balances 3 factors:</p>
            <Callout type="key">
              <strong>score = 0.4 × Recency + 0.35 × Importance + 0.25 × Similarity</strong><br/>
              Pure similarity (what RAG does) would surface "user likes cricket" over "user is allergic to X" if cricket happened to be the closer vector. That's dangerous. Importance weighting prevents this.
            </Callout>
            <MemoryScoringDemo />
          </div>
        )}

        {tab === "vs" && (
          <div>
            <h2 style={{ color: "#38bdf8", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>RAG vs Memory — What's the difference?</h2>
            <p style={{ color: "#64748b", margin: "0 0 4px", lineHeight: 1.7 }}>Commonly confused — but they solve different problems.</p>
            <RAGvsMemory />
          </div>
        )}

        {tab === "memorag" && (
          <div>
            <h2 style={{ color: "#a78bfa", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>MemoRAG — WebConf 2025</h2>
            <p style={{ color: "#64748b", margin: "0 0 4px", lineHeight: 1.7 }}>The research breakthrough: global memory of the ENTIRE corpus, not just retrieved chunks.</p>
            <MemoRAGSection />
          </div>
        )}

        {tab === "observational" && (
          <div>
            <h2 style={{ color: "#34d399", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Observational Memory — Feb 2026</h2>
            <p style={{ color: "#64748b", margin: "0 0 4px", lineHeight: 1.7 }}>The newest approach — no vector DB, 10x cheaper, 94.87% on LongMemEval.</p>
            <Callout type="live">
              <strong>Live as of February 2026 (Mastra 1.0):</strong> This is the most recent memory architecture. It outperforms RAG-based memory on benchmarks while being dramatically cheaper. Available as open-source plugins for LangChain and Vercel AI SDK.
            </Callout>
            <ObservationalSection />
          </div>
        )}

        {tab === "general" && (
          <div>
            <h2 style={{ color: "#60a5fa", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Memory RAG — General Architecture</h2>
            <p style={{ color: "#64748b", margin: "0 0 4px", lineHeight: 1.7 }}>Full architecture design for a general production system.</p>
            <GeneralMemory />
          </div>
        )}
      </div>
    </div>
  );
}
