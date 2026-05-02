import { useState } from "react";

const modules = [
  {
    id: 0,
    emoji: "🧠",
    title: "What is RAG?",
    subtitle: "Foundations & Mental Model",
    color: "#00d4ff",
    content: "foundations"
  },
  {
    id: 1,
    emoji: "✂️",
    title: "Chunking Strategies",
    subtitle: "How to split your documents",
    color: "#00ff9d",
    content: "chunking"
  },
  {
    id: 2,
    emoji: "🔢",
    title: "Embeddings & Vector Search",
    subtitle: "Turning words into numbers",
    color: "#ffb700",
    content: "embeddings"
  },
  {
    id: 3,
    emoji: "🔀",
    title: "Hybrid Search + Re-ranking",
    subtitle: "Best of keyword + semantic",
    color: "#ff6b9d",
    content: "hybrid"
  },
  {
    id: 4,
    emoji: "🚀",
    title: "Advanced RAG",
    subtitle: "HyDE, Query Expansion, Parent-Child",
    color: "#c77dff",
    content: "advanced"
  },
  {
    id: 5,
    emoji: "🤖",
    title: "Agentic / Multi-hop RAG",
    subtitle: "RAG that thinks and reasons",
    color: "#ff9a3c",
    content: "agentic"
  },
  {
    id: 6,
    emoji: "📊",
    title: "Evaluation & Metrics",
    subtitle: "How to know if RAG is working",
    color: "#4ade80",
    content: "evaluation"
  }
];

const CodeBlock = ({ code, lang = "python" }) => {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ background: "#0d1117", borderRadius: 10, border: "1px solid #30363d", marginTop: 16, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", background: "#161b22", borderBottom: "1px solid #30363d" }}>
        <span style={{ color: "#8b949e", fontSize: 12, fontFamily: "monospace" }}>{lang}</span>
        <button onClick={() => { navigator.clipboard?.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ background: "none", border: "1px solid #30363d", color: "#8b949e", padding: "2px 10px", borderRadius: 6, cursor: "pointer", fontSize: 11 }}>
          {copied ? "✓ copied" : "copy"}
        </button>
      </div>
      <pre style={{ margin: 0, padding: "16px", overflowX: "auto", fontSize: 13, lineHeight: 1.7, color: "#e6edf3", fontFamily: "'Fira Code', 'Courier New', monospace" }}>
        {code}
      </pre>
    </div>
  );
};

const Callout = ({ type = "info", children }) => {
  const styles = {
    info:    { bg: "#0c2032", border: "#00d4ff", icon: "💡" },
    analogy: { bg: "#1a2a0f", border: "#00ff9d", icon: "🎯" },
    warning: { bg: "#2a1a0f", border: "#ffb700", icon: "⚠️" },
    key:     { bg: "#1a0f2a", border: "#c77dff", icon: "🔑" },
  };
  const s = styles[type];
  return (
    <div style={{ background: s.bg, border: `1px solid ${s.border}`, borderLeft: `4px solid ${s.border}`, borderRadius: 8, padding: "12px 16px", margin: "16px 0", display: "flex", gap: 10 }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
      <div style={{ color: "#c9d1d9", fontSize: 14, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
};

const Badge = ({ children, color }) => (
  <span style={{ background: `${color}22`, border: `1px solid ${color}55`, color, padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "inline-block", margin: "2px 4px" }}>
    {children}
  </span>
);

// ─── Diagrams ───────────────────────────────────────────────────────────────

const RAGPipelineDiagram = () => {
  const steps = [
    { icon: "📄", label: "Documents", sub: "PDFs, Web, DB" },
    { icon: "✂️", label: "Chunking", sub: "Split text" },
    { icon: "🔢", label: "Embed", sub: "To vectors" },
    { icon: "🗄️", label: "Vector DB", sub: "Store & index" },
  ];
  const querySteps = [
    { icon: "❓", label: "User Query", sub: "Question" },
    { icon: "🔢", label: "Embed Query", sub: "Same model" },
    { icon: "🔍", label: "Search", sub: "Top-K chunks" },
    { icon: "💬", label: "LLM + Context", sub: "Final answer" },
  ];
  return (
    <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 12, padding: 24, marginTop: 16 }}>
      <div style={{ color: "#8b949e", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>INDEXING PIPELINE (offline)</div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4, marginBottom: 24 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ textAlign: "center", background: "#161b22", border: "1px solid #30363d", borderRadius: 8, padding: "10px 16px", minWidth: 90 }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>{s.label}</div>
              <div style={{ color: "#8b949e", fontSize: 11 }}>{s.sub}</div>
            </div>
            {i < steps.length - 1 && <span style={{ color: "#00d4ff", fontSize: 20 }}>→</span>}
          </div>
        ))}
      </div>
      <div style={{ color: "#8b949e", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>QUERY PIPELINE (online)</div>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 4 }}>
        {querySteps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ textAlign: "center", background: "#161b22", border: `1px solid ${i === 3 ? "#00d4ff" : "#30363d"}`, borderRadius: 8, padding: "10px 16px", minWidth: 90 }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ color: "#e6edf3", fontSize: 13, fontWeight: 600 }}>{s.label}</div>
              <div style={{ color: "#8b949e", fontSize: 11 }}>{s.sub}</div>
            </div>
            {i < querySteps.length - 1 && <span style={{ color: "#ff6b9d", fontSize: 20 }}>→</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

const ChunkingDiagram = () => {
  const strategies = [
    { name: "Fixed-size", desc: "Split every N tokens/chars. Simple, but cuts mid-sentence.", color: "#ff6b6b", risk: "HIGH fragmentation" },
    { name: "Sentence-based", desc: "Split on sentence boundaries (. ! ?). Preserves grammar units.", color: "#ffb700", risk: "LOW fragmentation" },
    { name: "Paragraph-based", desc: "Split on double newlines. Best for structured docs.", color: "#00ff9d", risk: "NATURAL units" },
    { name: "Semantic / Topic", desc: "Embed sentences, detect topic shifts, split there.", color: "#00d4ff", risk: "HIGHEST quality" },
    { name: "Hierarchical", desc: "Parent chunk (big) + child chunks (small). Retrieve small, use big.", color: "#c77dff", risk: "BEST of both" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
      {strategies.map((s, i) => (
        <div key={i} style={{ background: "#0d1117", border: `1px solid ${s.color}44`, borderLeft: `4px solid ${s.color}`, borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ color: s.color, fontWeight: 700, fontSize: 14 }}>{i + 1}. {s.name}</div>
            <div style={{ color: "#8b949e", fontSize: 13, marginTop: 2 }}>{s.desc}</div>
          </div>
          <Badge color={s.color}>{s.risk}</Badge>
        </div>
      ))}
    </div>
  );
};

const EmbeddingDiagram = () => (
  <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 12, padding: 20, marginTop: 16 }}>
    <div style={{ color: "#8b949e", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 12, textTransform: "uppercase" }}>Words → Vectors → Similarity Space</div>
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        {[
          { word: '"car accident"', vec: "[0.82, 0.31, 0.67, ...]", color: "#ff6b9d" },
          { word: '"vehicle crash"', vec: "[0.79, 0.28, 0.71, ...]", color: "#ff6b9d" },
          { word: '"premium calculation"', vec: "[0.12, 0.89, 0.22, ...]", color: "#00d4ff" },
        ].map((r, i) => (
          <div key={i} style={{ marginBottom: 10, display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ background: `${r.color}22`, border: `1px solid ${r.color}55`, color: r.color, padding: "4px 10px", borderRadius: 6, fontSize: 13, fontFamily: "monospace", whiteSpace: "nowrap" }}>{r.word}</div>
            <span style={{ color: "#444" }}>→</span>
            <div style={{ color: "#8b949e", fontSize: 12, fontFamily: "monospace" }}>{r.vec}</div>
          </div>
        ))}
        <div style={{ color: "#8b949e", fontSize: 12, marginTop: 8, fontStyle: "italic" }}>
          "car accident" ≈ "vehicle crash" → high cosine similarity<br />
          "car accident" ≠ "premium calculation" → low similarity
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 200 }}>
        <svg viewBox="0 0 200 180" style={{ width: "100%", maxWidth: 220 }}>
          <rect width="200" height="180" fill="#0d1117"/>
          <line x1="10" y1="170" x2="190" y2="170" stroke="#30363d" strokeWidth="1"/>
          <line x1="10" y1="10" x2="10" y2="170" stroke="#30363d" strokeWidth="1"/>
          <text x="100" y="178" fill="#8b949e" fontSize="9" textAnchor="middle">dim 1</text>
          <text x="5" y="90" fill="#8b949e" fontSize="9" textAnchor="middle" transform="rotate(-90,5,90)">dim 2</text>
          <circle cx="80" cy="60" r="7" fill="#ff6b9d" opacity="0.9"/>
          <text x="90" y="57" fill="#ff6b9d" fontSize="9">car accident</text>
          <circle cx="95" cy="75" r="7" fill="#ff6b9d" opacity="0.7"/>
          <text x="105" y="72" fill="#ff6b9d" fontSize="9">vehicle crash</text>
          <line x1="80" y1="60" x2="95" y2="75" stroke="#ff6b9d" strokeWidth="1" strokeDasharray="3"/>
          <circle cx="155" cy="130" r="7" fill="#00d4ff" opacity="0.9"/>
          <text x="118" y="143" fill="#00d4ff" fontSize="9">premium calc</text>
          <circle cx="140" cy="145" r="6" fill="#00d4ff" opacity="0.7"/>
          <text x="95" y="110" fill="#444" fontSize="8" fontStyle="italic">far apart = different topics</text>
        </svg>
      </div>
    </div>
  </div>
);

const HybridDiagram = () => (
  <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 12, padding: 20, marginTop: 16 }}>
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
      <div style={{ flex: 1, minWidth: 180, background: "#161b22", borderRadius: 8, padding: 14, border: "1px solid #ffb70044" }}>
        <div style={{ color: "#ffb700", fontWeight: 700, marginBottom: 6 }}>🔤 BM25 (Keyword)</div>
        <div style={{ color: "#8b949e", fontSize: 13 }}>Scores based on term frequency. Great for exact keywords, product codes, policy IDs.</div>
        <Badge color="#ffb700">Sparse</Badge>
      </div>
      <div style={{ display: "flex", alignItems: "center", color: "#444", fontSize: 24 }}>+</div>
      <div style={{ flex: 1, minWidth: 180, background: "#161b22", borderRadius: 8, padding: 14, border: "1px solid #00d4ff44" }}>
        <div style={{ color: "#00d4ff", fontWeight: 700, marginBottom: 6 }}>🔢 Dense (Semantic)</div>
        <div style={{ color: "#8b949e", fontSize: 13 }}>Scores based on meaning. Finds "vehicle crash" when you search "car accident".</div>
        <Badge color="#00d4ff">Dense</Badge>
      </div>
      <div style={{ display: "flex", alignItems: "center", color: "#444", fontSize: 24 }}>→</div>
      <div style={{ flex: 1, minWidth: 180, background: "#161b22", borderRadius: 8, padding: 14, border: "1px solid #00ff9d44" }}>
        <div style={{ color: "#00ff9d", fontWeight: 700, marginBottom: 6 }}>🏆 RRF Fusion</div>
        <div style={{ color: "#8b949e", fontSize: 13 }}>Combines both ranked lists. Best chunks bubble up to the top.</div>
        <Badge color="#00ff9d">Hybrid</Badge>
      </div>
    </div>
    <div style={{ background: "#161b22", borderRadius: 8, padding: 12, border: "1px solid #c77dff44" }}>
      <div style={{ color: "#c77dff", fontWeight: 700, marginBottom: 6 }}>🎯 Re-ranking (Cross-Encoder)</div>
      <div style={{ color: "#8b949e", fontSize: 13 }}>After retrieval, a cross-encoder model reads the FULL query + chunk pair and re-scores relevance. Slower but far more accurate. Usually applied to top 20 → returns top 5.</div>
    </div>
  </div>
);

const AgenticDiagram = () => (
  <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 12, padding: 20, marginTop: 16 }}>
    <div style={{ color: "#8b949e", fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 16, textTransform: "uppercase" }}>Multi-hop ReAct Pattern</div>
    {[
      { step: "THINK", text: 'Query: "What is the max liability if a stolen car caused property damage under policy P-200?"', color: "#00d4ff" },
      { step: "ACT", text: "search('policy P-200 theft coverage') → retrieves 3 chunks about theft", color: "#ffb700" },
      { step: "OBSERVE", text: "Theft section found. But property damage limit not in these chunks.", color: "#8b949e" },
      { step: "THINK", text: "I need to also look for property damage clauses. Need second retrieval.", color: "#00d4ff" },
      { step: "ACT", text: "search('property damage liability limit P-200') → retrieves 2 new chunks", color: "#ffb700" },
      { step: "OBSERVE", text: "Found: max $50,000 property damage. Theft confirmed active.", color: "#8b949e" },
      { step: "ANSWER", text: "Max liability = $50,000. Policy P-200 covers property damage from theft.", color: "#00ff9d" },
    ].map((s, i) => (
      <div key={i} style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <div style={{ color: s.color, fontSize: 11, fontWeight: 700, fontFamily: "monospace", minWidth: 70, paddingTop: 2 }}>[{s.step}]</div>
        <div style={{ color: "#c9d1d9", fontSize: 13, lineHeight: 1.6, borderLeft: `2px solid ${s.color}44`, paddingLeft: 10 }}>{s.text}</div>
      </div>
    ))}
  </div>
);

// ─── Quiz Component ──────────────────────────────────────────────────────────

const Quiz = ({ questions }) => {
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ color: "#8b949e", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>🧪 CHECKPOINT QUIZ</div>
      {questions.map((q, qi) => (
        <div key={qi} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 10, padding: 16, marginBottom: 12 }}>
          <div style={{ color: "#e6edf3", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>{qi + 1}. {q.question}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi;
              const correct = oi === q.correct;
              const show = revealed[qi];
              let bg = "#161b22", border = "#30363d", color = "#c9d1d9";
              if (selected && !show) { bg = "#0c2032"; border = "#00d4ff"; color = "#00d4ff"; }
              if (show && correct) { bg = "#0f2a1a"; border = "#00ff9d"; color = "#00ff9d"; }
              if (show && selected && !correct) { bg = "#2a0f0f"; border = "#ff6b6b"; color = "#ff6b6b"; }
              return (
                <div key={oi} onClick={() => !revealed[qi] && setAnswers(a => ({ ...a, [qi]: oi }))}
                  style={{ background: bg, border: `1px solid ${border}`, color, borderRadius: 6, padding: "8px 12px", cursor: revealed[qi] ? "default" : "pointer", fontSize: 13, transition: "all 0.15s" }}>
                  {opt}
                  {show && correct && " ✓"}
                  {show && selected && !correct && " ✗"}
                </div>
              );
            })}
          </div>
          {answers[qi] !== undefined && !revealed[qi] && (
            <button onClick={() => setRevealed(r => ({ ...r, [qi]: true }))}
              style={{ marginTop: 10, background: "#21262d", border: "1px solid #30363d", color: "#8b949e", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
              Check Answer
            </button>
          )}
          {revealed[qi] && <div style={{ marginTop: 8, color: "#8b949e", fontSize: 12, fontStyle: "italic" }}>{q.explanation}</div>}
        </div>
      ))}
    </div>
  );
};

// ─── Module Content ──────────────────────────────────────────────────────────

const FoundationsContent = () => (
  <div>
    <h2 style={{ color: "#00d4ff", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>What is RAG?</h2>
    <p style={{ color: "#8b949e", margin: "0 0 16px", lineHeight: 1.7 }}>Retrieval-Augmented Generation — the most important LLM pattern you'll use in production.</p>

    <Callout type="analogy">
      <strong>The Open-Book Exam Analogy</strong><br/>
      Imagine two students taking an insurance exam. Student A has memorized everything — but their memory caps out at what they studied (knowledge cutoff). Student B gets to bring a library. Before answering, they look up the relevant pages, read them, then write the answer. <strong>Student B is RAG.</strong>
    </Callout>

    <h3 style={{ color: "#e6edf3", marginTop: 20, marginBottom: 8 }}>The Problem RAG Solves</h3>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {[
        { label: "❌ Without RAG", items: ["Knowledge cutoff (stale data)", "Hallucinations (makes things up)", "Can't know YOUR documents", "No source citations"], color: "#ff6b6b" },
        { label: "✅ With RAG", items: ["Always up-to-date documents", "Grounded answers from real text", "Works on private data", "Citable, auditable responses"], color: "#00ff9d" },
      ].map((col, i) => (
        <div key={i} style={{ background: "#0d1117", border: `1px solid ${col.color}44`, borderRadius: 8, padding: 14 }}>
          <div style={{ color: col.color, fontWeight: 700, marginBottom: 8 }}>{col.label}</div>
          {col.items.map((item, j) => <div key={j} style={{ color: "#8b949e", fontSize: 13, padding: "2px 0" }}>{item}</div>)}
        </div>
      ))}
    </div>

    <h3 style={{ color: "#e6edf3", marginTop: 20, marginBottom: 4 }}>The Full RAG Pipeline</h3>
    <RAGPipelineDiagram />

    <h3 style={{ color: "#e6edf3", marginTop: 20, marginBottom: 8 }}>The Two Phases in Plain English</h3>
    <div style={{ color: "#c9d1d9", fontSize: 14, lineHeight: 1.9 }}>
      <p><strong style={{ color: "#00d4ff" }}>Phase 1 — Indexing (done once, offline):</strong> You take all your documents (insurance policies, FAQs, claim forms), chop them into small pieces (chunks), convert each piece into a list of numbers (embedding vector) that captures its meaning, and store everything in a vector database.</p>
      <p><strong style={{ color: "#ff6b9d" }}>Phase 2 — Querying (done every time a user asks something):</strong> User's question → embed it → find the most similar chunks in the database → feed those chunks as context to the LLM → LLM answers using only the retrieved evidence.</p>
    </div>

    <CodeBlock lang="python" code={`# Simplest possible RAG in ~20 lines
from anthropic import Anthropic
import chromadb

client = Anthropic()
chroma = chromadb.Client()
collection = chroma.create_collection("insurance_docs")

# INDEXING PHASE
docs = ["Policy P-200 covers theft up to $50,000.",
        "Claims must be filed within 30 days of incident."]
collection.add(documents=docs, ids=["doc1", "doc2"])

# QUERY PHASE
def rag_query(question: str) -> str:
    # 1. Retrieve relevant chunks
    results = collection.query(query_texts=[question], n_results=2)
    context = "\\n".join(results["documents"][0])

    # 2. Generate answer with context
    response = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": f"Context:\\n{context}\\n\\nQuestion: {question}"
        }]
    )
    return response.content[0].text

print(rag_query("When must I file a claim?"))
# → "Claims must be filed within 30 days of incident."`} />

    <Quiz questions={[
      {
        question: "In RAG, what is the purpose of the 'embedding' step?",
        options: ["Compress documents to save space", "Convert text into numerical vectors that capture semantic meaning", "Format documents as JSON", "Encrypt documents before storage"],
        correct: 1,
        explanation: "Embeddings convert text into dense numerical vectors. Similar meanings produce similar vectors, enabling semantic search."
      },
      {
        question: "What is a 'knowledge cutoff' problem that RAG solves?",
        options: ["LLMs being too slow", "LLMs only knowing data up to their training date, not your live documents", "LLMs using too many tokens", "LLMs not speaking multiple languages"],
        correct: 1,
        explanation: "LLMs are trained on a snapshot of data. They don't know your private docs or anything after training. RAG injects fresh, real-time context at query time."
      }
    ]} />
  </div>
);

const ChunkingContent = () => (
  <div>
    <h2 style={{ color: "#00ff9d", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Chunking Strategies</h2>
    <p style={{ color: "#8b949e", margin: "0 0 16px", lineHeight: 1.7 }}>Garbage in, garbage out. How you split documents is the #1 factor affecting retrieval quality.</p>

    <Callout type="analogy">
      <strong>The Library Index Analogy</strong><br/>
      Imagine indexing a 500-page insurance manual. If your index points to the entire chapter, you'd return 50 pages for every query. If it points to paragraphs, you get exactly the right information. <strong>Chunking = deciding the granularity of your index.</strong>
    </Callout>

    <Callout type="warning">
      <strong>The Goldilocks Problem:</strong> Chunks too small → lose context ("The limit is $50,000" — limit for WHAT?). Chunks too large → retrieve irrelevant content, waste LLM context window.
    </Callout>

    <h3 style={{ color: "#e6edf3", marginTop: 20, marginBottom: 4 }}>The 5 Strategies</h3>
    <ChunkingDiagram />

    <h3 style={{ color: "#e6edf3", marginTop: 20, marginBottom: 8 }}>Hierarchical Chunking (Most Powerful)</h3>
    <div style={{ background: "#0d1117", border: "1px solid #c77dff44", borderRadius: 10, padding: 16 }}>
      <div style={{ color: "#c9d1d9", fontSize: 13, lineHeight: 1.8 }}>
        <span style={{ color: "#c77dff", fontWeight: 700 }}>Parent chunk (large)</span>: Full section — "Section 4: Theft Coverage. Policy P-200 provides theft protection for vehicles registered under the named insured..."<br/>
        <span style={{ color: "#00d4ff", fontWeight: 700 }}>Child chunks (small)</span>: "Theft limit: $50,000" | "Deductible: $1,000" | "Coverage area: APAC region"<br/><br/>
        <span style={{ color: "#8b949e" }}>→ You <strong>retrieve</strong> by child (precise matching), but <strong>return</strong> the parent (full context to LLM). Best accuracy + context!</span>
      </div>
    </div>

    <CodeBlock lang="python" code={`from llama_index.core.node_parser import (
    SentenceWindowNodeParser,
    HierarchicalNodeParser,
)

# Strategy 1: Sentence Window (great for dense text)
sentence_parser = SentenceWindowNodeParser.from_defaults(
    window_size=3,          # include 3 sentences around matched sentence
    window_metadata_key="window",
    original_text_metadata_key="original_text",
)

# Strategy 2: Hierarchical (best for structured insurance docs)
hierarchical_parser = HierarchicalNodeParser.from_defaults(
    chunk_sizes=[2048, 512, 128]  # parent → child → grandchild
)

# Strategy 3: Semantic chunking (splits on topic change)
from llama_index.core.node_parser import SemanticSplitterNodeParser
from llama_index.embeddings.voyageai import VoyageEmbedding

embed_model = VoyageEmbedding(model_name="voyage-3")  # your stack!
semantic_parser = SemanticSplitterNodeParser(
    buffer_size=1,
    breakpoint_percentile_threshold=95,  # higher = fewer, bigger chunks
    embed_model=embed_model,
)

# Parse documents
nodes = hierarchical_parser.get_nodes_from_documents(documents)`} />

    <Callout type="key">
      <strong>For a production system:</strong> Structured documents have natural hierarchy (sections, clauses, definitions). Use <strong>Hierarchical</strong> chunking with sizes ~[1024, 256, 64]. Retrieve at 64-token child level, return 1024-token parent to LLM.
    </Callout>

    <Quiz questions={[
      {
        question: "You're chunking insurance policy documents. A chunk contains: 'The limit is $50,000.' — What's wrong with this chunk?",
        options: ["It's too short", "It lacks context — limit for WHAT? Vehicle theft? Medical? Property?", "It contains a number", "Nothing is wrong"],
        correct: 1,
        explanation: "This is the 'lost context' problem. Small chunks lose the surrounding context that gives them meaning. Hierarchical chunking solves this."
      },
      {
        question: "In hierarchical chunking, what do you use for RETRIEVAL vs what you send to the LLM?",
        options: ["Retrieve large parent, send small child to LLM", "Retrieve small child, send large parent to LLM", "Use the same chunk for both", "Send all chunks to the LLM"],
        correct: 1,
        explanation: "Small child chunks enable precise semantic matching. But the LLM needs full context, so you return the parent chunk. Best of both worlds!"
      }
    ]} />
  </div>
);

const EmbeddingsContent = () => (
  <div>
    <h2 style={{ color: "#ffb700", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Embeddings & Vector Search</h2>
    <p style={{ color: "#8b949e", margin: "0 0 16px", lineHeight: 1.7 }}>The mathematical engine behind semantic search.</p>

    <Callout type="analogy">
      <strong>The GPS Coordinate Analogy</strong><br/>
      GPS turns a place into coordinates (lat, long). You can find nearby places by comparing coordinates. Embeddings turn text into coordinates in "meaning space". Similar meanings → nearby coordinates → easy to find related content.
    </Callout>

    <h3 style={{ color: "#e6edf3", marginTop: 20, marginBottom: 4 }}>How Similarity Works</h3>
    <EmbeddingDiagram />

    <h3 style={{ color: "#e6edf3", marginTop: 20, marginBottom: 8 }}>Cosine Similarity — The Math (Simple Version)</h3>
    <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 10, padding: 16 }}>
      <div style={{ color: "#c9d1d9", fontSize: 14, lineHeight: 1.8 }}>
        You have two vectors: Query vector <span style={{ color: "#ff6b9d", fontFamily: "monospace" }}>Q</span> and Chunk vector <span style={{ color: "#00d4ff", fontFamily: "monospace" }}>C</span>.<br/>
        <span style={{ color: "#ffb700", fontFamily: "monospace" }}>similarity = cos(θ) = (Q · C) / (|Q| × |C|)</span><br/>
        Range: <strong>1.0</strong> = identical meaning, <strong>0.0</strong> = unrelated, <strong>-1.0</strong> = opposite meaning.<br/>
        <span style={{ color: "#8b949e", fontSize: 12 }}>We ignore magnitude (length of vector) — only direction matters. That's what "cosine" means here.</span>
      </div>
    </div>

    <h3 style={{ color: "#e6edf3", marginTop: 20, marginBottom: 8 }}>Embedding Model Comparison (MTEB 2025)</h3>
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#161b22" }}>
            {["Model", "Dims", "MTEB", "Size", "Best For"].map(h => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#8b949e", fontWeight: 600, border: "1px solid #21262d" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            ["Gemini-embedding-exp (Google)", "3072", "73.2", "API", "Google Cloud stacks; highest API accuracy Apr 2026"],
            ["NV-Embed-v2 (NVIDIA)", "4096", "72.3", "7B", "Highest OSS accuracy; needs GPU with 16GB VRAM"],
            ["GTE-Qwen2-7B (Alibaba)", "3584", "72.1", "7B", "Open-source SoTA; strong multilingual + English"],
            ["Stella-en-1.5B-v5", "1024", "71.3", "1.5B", "Best efficiency/quality ratio; CPU-feasible"],
            ["voyage-3 (Voyage AI)", "1024", "67.1", "API", "Best for Claude/Anthropic stacks; low latency"],
            ["jina-embeddings-v3", "1024", "65.5", "570M", "8192 token context; multilingual; late chunking"],
            ["text-embedding-3-large (OpenAI)", "3072", "64.6", "API", "Best for OpenAI stacks; Matryoshka dims"],
            ["BAAI/bge-m3", "1024", "68.2", "568M", "Multilingual dense+sparse hybrid; 8192 ctx"],
            ["intfloat/e5-mistral-7b", "4096", "66.6", "7B", "Instruction-tuned; needs 'Query:' prefix"],
            ["all-MiniLM-L6-v2", "384", "41.9", "22M", "CPU-fast only; use for prototypes/edge"],
          ].map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "#0d1117" : "#0a0e13" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "8px 12px", color: j === 0 ? "#00d4ff" : j === 2 ? "#4ade80" : "#c9d1d9", border: "1px solid #21262d", fontFamily: j === 0 ? "monospace" : "inherit" }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ color: "#475569", fontSize: 11, marginTop: 6 }}>MTEB = Massive Text Embedding Benchmark (MMTEB) average retrieval score. Data: April 2026 leaderboard. Benchmarks vary by task; check MTEB Leaderboard for your specific task.</div>
    </div>

    <CodeBlock lang="python" code={`import chromadb
import voyageai

# Initialize Voyage AI client
voyage = voyageai.Client()  # reads VOYAGE_API_KEY from env

# Initialize ChromaDB
chroma = chromadb.PersistentClient(path="./chroma_db")

# Create collection (use cosine distance for normalized embeddings)
collection = chroma.get_or_create_collection(
    name="insurance_policies",
    metadata={"hnsw:space": "cosine"}
)

# Index documents — batch embedding for efficiency
docs = [
    "Policy P-200 theft limit is $50,000 for APAC vehicles.",
    "Claims must be filed within 30 days of the incident.",
    "Section 4.2: Flood coverage requires endorsement E-400.",
]
metadatas = [
    {"source": "P-200", "section": "theft", "page": 12},
    {"source": "claims_guide", "section": "process", "page": 3},
    {"source": "P-200", "section": "flood", "page": 18},
]

# Batch embed (efficient — one API call for all docs)
embeddings = voyage.embed(
    docs, model="voyage-3", input_type="document"
).embeddings  # voyage-3: 1024 dims, MTEB 67.1

collection.add(
    documents=docs,
    embeddings=embeddings,
    metadatas=metadatas,
    ids=[f"chunk_{i:03d}" for i in range(len(docs))]
)

# Query — embed query with input_type="query" (different from document!)
def rag_query(question: str, top_k: int = 3):
    query_embedding = voyage.embed(
        [question], model="voyage-3", input_type="query"
    ).embeddings[0]
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "distances", "metadatas"]
    )
    
    for doc, dist, meta in zip(
        results["documents"][0],
        results["distances"][0],
        results["metadatas"][0]
    ):
        sim = 1 - dist  # cosine distance to similarity
        print(f"Score: {sim:.3f} | Source: {meta['source']} | {doc[:60]}...")

rag_query("What is the theft coverage limit?")
# → Score: 0.947 | Source: P-200 | Policy P-200 theft limit is $50,000...`} />

    <Quiz questions={[
      {
        question: "What does a cosine similarity of 0.95 between a query and a chunk mean?",
        options: ["The chunk is 95% of the query's length", "The chunk and query have very similar semantic meaning", "The chunk appeared 0.95 times in the document", "95% of the words match exactly"],
        correct: 1,
        explanation: "High cosine similarity (close to 1.0) means the vectors point in nearly the same direction — the texts have very similar meanings."
      },
      {
        question: "Why can't you use the same embedding model for indexing and a different one for querying?",
        options: ["It would be too slow", "Each model creates its own vector space — mixing them is like mixing GPS systems", "It would use too much memory", "Embedding models can only run once"],
        correct: 1,
        explanation: "Each embedding model creates its own dimensional space. 'car accident' in Model A produces different coordinates than in Model B. You MUST use the same model for both."
      }
    ]} />
  </div>
);

const HybridContent = () => (
  <div>
    <h2 style={{ color: "#ff6b9d", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Hybrid Search + Re-ranking</h2>
    <p style={{ color: "#8b949e", margin: "0 0 16px", lineHeight: 1.7 }}>How production RAG systems hit 90%+ retrieval accuracy.</p>

    <Callout type="analogy">
      <strong>The Detective Analogy</strong><br/>
      A junior detective (BM25) finds everyone in the building who used the word "gun". A senior detective (dense embedding) finds everyone acting suspicious. A chief detective (re-ranker) looks each suspect in the eye and decides who actually did it. <strong>You need all three.</strong>
    </Callout>

    <h3 style={{ color: "#e6edf3", marginTop: 20, marginBottom: 4 }}>The Pipeline</h3>
    <HybridDiagram />

    <h3 style={{ color: "#e6edf3", marginTop: 20, marginBottom: 8 }}>Why BM25 Still Matters</h3>
    <div style={{ color: "#c9d1d9", fontSize: 14, lineHeight: 1.8 }}>
      Dense search misses exact matches. If a user searches <code style={{ background: "#21262d", padding: "1px 6px", borderRadius: 4, color: "#ffb700" }}>"clause 4.2.1(b)"</code>, no embedding model will reliably find it — but BM25 will. For insurance (policy IDs, clause references, medical codes), BM25 is critical.
    </div>

    <h3 style={{ color: "#e6edf3", marginTop: 20, marginBottom: 8 }}>Reciprocal Rank Fusion (RRF)</h3>
    <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 10, padding: 16 }}>
      <div style={{ color: "#c9d1d9", fontSize: 13, lineHeight: 1.8 }}>
        For each chunk, from each retriever: <span style={{ color: "#ffb700", fontFamily: "monospace" }}>score = 1 / (rank + k)</span> where k=60 typically.<br/>
        Final score = sum of scores from all retrievers. Chunks that rank well in BOTH retrievers win.
      </div>
    </div>

    <CodeBlock lang="python" code={`from llama_index.core.retrievers import QueryFusionRetriever
from llama_index.retrievers.bm25 import BM25Retriever
from llama_index.core import VectorStoreIndex

# Build both retrievers
vector_retriever = index.as_retriever(similarity_top_k=10)
bm25_retriever = BM25Retriever.from_defaults(
    nodes=nodes, similarity_top_k=10
)

# Hybrid retriever with RRF fusion
hybrid_retriever = QueryFusionRetriever(
    retrievers=[vector_retriever, bm25_retriever],
    similarity_top_k=10,
    num_queries=1,              # 1 = no query expansion
    mode="reciprocal_rerank",   # RRF fusion
    use_async=True,
)

# Re-ranking with cross-encoder
from llama_index.core.postprocessor import SentenceTransformerRerank

reranker = SentenceTransformerRerank(
    model="cross-encoder/ms-marco-MiniLM-L-6-v2",  # CPU-runnable!
    top_n=3  # from 10 retrieved → return best 3 to LLM
)

# Full query engine
from llama_index.core import QueryEngine
query_engine = index.as_query_engine(
    node_postprocessors=[reranker],
    similarity_top_k=10,
)

response = query_engine.query("What is the theft limit for policy P-200?")`} />

    <Quiz questions={[
      {
        question: "A user searches for 'ICD-10 code J06.9'. Which retriever will find it reliably?",
        options: ["Dense embedding search", "BM25 keyword search", "Both equally", "Neither"],
        correct: 1,
        explanation: "Exact codes, policy IDs, and specific terminology are BM25's strength. Embedding models may not reliably encode exact alphanumeric codes."
      },
      {
        question: "You have 100 chunks retrieved. The re-ranker takes the top 20 and returns 5. What does the re-ranker use to score?",
        options: ["Only the chunk, not the query", "Vector similarity from the embedding model", "A cross-encoder that reads query + chunk together", "TF-IDF score"],
        correct: 2,
        explanation: "Cross-encoders read the full (query, document) pair jointly, giving much better relevance scores than bi-encoders. They're slower but far more accurate."
      }
    ]} />
  </div>
);

const AdvancedContent = () => (
  <div>
    <h2 style={{ color: "#c77dff", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Advanced RAG Techniques</h2>
    <p style={{ color: "#8b949e", margin: "0 0 16px", lineHeight: 1.7 }}>HyDE, Query Decomposition, and Parent-Child retrieval.</p>

    <h3 style={{ color: "#e6edf3", marginTop: 8, marginBottom: 8 }}>1. HyDE — Hypothetical Document Embeddings</h3>
    <Callout type="analogy">
      <strong>The Fake Answer Trick</strong><br/>
      Queries and documents live in different "embedding zones". A question sounds different from its answer. HyDE says: <em>"Let's generate a fake answer, embed THAT, and search with the answer's vector."</em> Answer-shaped text finds answer-shaped chunks better.
    </Callout>
    <div style={{ background: "#0d1117", border: "1px solid #c77dff44", borderRadius: 10, padding: 14, marginTop: 8 }}>
      <div style={{ color: "#c9d1d9", fontSize: 13, lineHeight: 1.8 }}>
        <span style={{ color: "#8b949e" }}>User asks:</span> <span style={{ color: "#00d4ff" }}>"What's covered under P-200 for natural disasters?"</span><br/>
        <span style={{ color: "#8b949e" }}>LLM generates fake answer:</span> <span style={{ color: "#c77dff" }}>"Policy P-200 provides coverage for natural disasters including floods and earthquakes up to $X..."</span><br/>
        <span style={{ color: "#8b949e" }}>→ Embed the FAKE answer and search. Finds real answer chunks much better!</span>
      </div>
    </div>

    <h3 style={{ color: "#e6edf3", marginTop: 20, marginBottom: 8 }}>2. Query Decomposition</h3>
    <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: 10, padding: 14 }}>
      <div style={{ color: "#c9d1d9", fontSize: 13, lineHeight: 1.8 }}>
        <span style={{ color: "#ffb700", fontWeight: 600 }}>Complex query:</span> "Compare theft coverage and flood coverage under Policy P-200 and P-300"<br/>
        <span style={{ color: "#00ff9d", fontWeight: 600 }}>Decomposed into 4 sub-queries:</span><br/>
        &nbsp;&nbsp;→ "P-200 theft coverage" | "P-300 theft coverage"<br/>
        &nbsp;&nbsp;→ "P-200 flood coverage" | "P-300 flood coverage"<br/>
        <span style={{ color: "#8b949e" }}>Each sub-query retrieves independently → results merged → LLM synthesizes the comparison.</span>
      </div>
    </div>

    <CodeBlock lang="python" code={`# HyDE implementation
from llama_index.core.indices.query.query_transform import HyDEQueryTransform
from llama_index.core.query_engine import TransformQueryEngine

# 1. HyDE
hyde_transform = HyDEQueryTransform(include_original=True)
hyde_query_engine = TransformQueryEngine(
    query_engine, query_transform=hyde_transform
)
response = hyde_query_engine.query("What's covered under P-200 for flooding?")

# 2. Query Decomposition
from llama_index.core.query_engine import SubQuestionQueryEngine
from llama_index.core.tools import QueryEngineTool

tools = [
    QueryEngineTool.from_defaults(
        query_engine=p200_engine,
        name="policy_P200",
        description="Use for questions about Policy P-200"
    ),
    QueryEngineTool.from_defaults(
        query_engine=p300_engine,
        name="policy_P300",
        description="Use for questions about Policy P-300"
    ),
]
sub_question_engine = SubQuestionQueryEngine.from_defaults(
    query_engine_tools=tools,
    verbose=True
)
response = sub_question_engine.query(
    "Compare theft coverage between P-200 and P-300"
)`} />

    <Quiz questions={[
      {
        question: "Why does HyDE work? What's the core insight?",
        options: ["It's faster than regular search", "Answer-shaped text finds answer-shaped chunks better than question-shaped text", "It reduces token usage", "It avoids the vector database entirely"],
        correct: 1,
        explanation: "Queries and documents occupy different regions in embedding space. Generating a hypothetical answer bridges this gap — the fake answer 'sounds like' the real answer, finding it more precisely."
      }
    ]} />
  </div>
);

const AgenticContent = () => (
  <div>
    <h2 style={{ color: "#ff9a3c", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Agentic / Multi-hop RAG</h2>
    <p style={{ color: "#8b949e", margin: "0 0 16px", lineHeight: 1.7 }}>When one retrieval isn't enough — RAG that thinks, loops, and reasons.</p>

    <Callout type="analogy">
      <strong>The Research Analyst Analogy</strong><br/>
      Basic RAG is a librarian handing you the first book that matches. Agentic RAG is a research analyst who reads that book, realizes they need another source, looks that up too, cross-references everything, then writes a report. <strong>Multiple retrievals, guided by reasoning.</strong>
    </Callout>

    <h3 style={{ color: "#e6edf3", marginTop: 16, marginBottom: 4 }}>Single-hop vs Multi-hop</h3>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
      <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 8, padding: 12 }}>
        <div style={{ color: "#8b949e", fontWeight: 700, marginBottom: 6 }}>Single-hop RAG</div>
        <div style={{ color: "#c9d1d9", fontSize: 13 }}>Query → retrieve once → answer.<br/>Works when the answer is in one place.</div>
      </div>
      <div style={{ background: "#0d1117", border: "1px solid #ff9a3c44", borderRadius: 8, padding: 12 }}>
        <div style={{ color: "#ff9a3c", fontWeight: 700, marginBottom: 6 }}>Multi-hop RAG</div>
        <div style={{ color: "#c9d1d9", fontSize: 13 }}>Query → retrieve → think → retrieve again → synthesize.<br/>When the answer spans multiple documents/concepts.</div>
      </div>
    </div>

    <h3 style={{ color: "#e6edf3", marginBottom: 4 }}>ReAct Pattern in Action</h3>
    <AgenticDiagram />

    <CodeBlock lang="python" code={`from llama_index.core.agent import ReActAgent
from llama_index.core.tools import QueryEngineTool, FunctionTool
from llama_index.llms.anthropic import Anthropic

llm = Anthropic(model="claude-opus-4-6")

# Give the agent multiple retrieval tools
policy_tool = QueryEngineTool.from_defaults(
    query_engine=policy_engine,
    name="policy_search",
    description="Search insurance policy documents for coverage details"
)

claims_tool = QueryEngineTool.from_defaults(
    query_engine=claims_engine,
    name="claims_search",
    description="Search past claims data and procedures"
)

def calculate_premium(base: float, risk_factor: float) -> float:
    """Calculate insurance premium given base amount and risk factor."""
    return base * risk_factor * 1.15  # 15% overhead

calc_tool = FunctionTool.from_defaults(fn=calculate_premium)

# ReAct agent — automatically decides WHEN and HOW MANY TIMES to retrieve
agent = ReActAgent.from_tools(
    tools=[policy_tool, claims_tool, calc_tool],
    llm=llm,
    verbose=True,  # see the Thought → Action → Observation loop
    max_iterations=10  # safety limit
)

response = agent.chat(
    "What is the estimated premium for a theft claim on Policy P-200 "
    "with a $45,000 vehicle value and high-risk location?"
)
# Agent will: search policy → search risk factors → call calculate_premium
print(response)`} />

    <Callout type="key">
      <strong>Agentic RAG Patterns to know:</strong> ReAct (Reason + Act), FLARE (retrieve when uncertain), Self-RAG (model decides whether to retrieve at all), Corrective RAG (validates retrieved docs before using them).
    </Callout>

    <Quiz questions={[
      {
        question: "A user asks: 'What's the total payout if 3 different policy holders all file the same flood claim?' — Why does this NEED multi-hop RAG?",
        options: ["It's too long a question", "The answer requires looking up 3 different policy documents and doing arithmetic — multiple retrieval steps", "Flood claims are too complex", "Single-hop RAG can handle this easily"],
        correct: 1,
        explanation: "This question requires: (1) retrieve policy 1's flood limit, (2) retrieve policy 2's flood limit, (3) retrieve policy 3's flood limit, (4) sum them. That's at least 3 retrieval hops + a calculation."
      }
    ]} />
  </div>
);

const EvaluationContent = () => (
  <div>
    <h2 style={{ color: "#4ade80", fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>Evaluation & Metrics</h2>
    <p style={{ color: "#8b949e", margin: "0 0 16px", lineHeight: 1.7 }}>If you can't measure it, you can't improve it. The RAG evaluation framework.</p>

    <h3 style={{ color: "#e6edf3", marginBottom: 8 }}>The 3 Core RAG Metrics (RAGAS)</h3>
    {[
      { name: "Faithfulness", desc: "Is the generated answer supported by the retrieved context? Tests for hallucination.", formula: "# claims in answer supported by context / # total claims", color: "#00d4ff", bad: "LLM makes up extra details not in context" },
      { name: "Answer Relevance", desc: "Does the answer actually address the question asked?", formula: "similarity(generated questions from answer, original question)", color: "#ff6b9d", bad: "Answer is factual but off-topic" },
      { name: "Context Recall", desc: "Did we retrieve all the chunks needed to answer the question?", formula: "# relevant chunks retrieved / # total relevant chunks", color: "#ffb700", bad: "Key information was missing from retrieved chunks" },
      { name: "Context Precision", desc: "Of the retrieved chunks, how many were actually useful?", formula: "# relevant chunks retrieved / # total chunks retrieved", color: "#00ff9d", bad: "Retrieved too many irrelevant chunks" },
    ].map((m, i) => (
      <div key={i} style={{ background: "#0d1117", border: `1px solid ${m.color}44`, borderRadius: 8, padding: 14, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ color: m.color, fontWeight: 700 }}>{m.name}</div>
            <div style={{ color: "#c9d1d9", fontSize: 13, marginTop: 4 }}>{m.desc}</div>
            <div style={{ color: "#8b949e", fontSize: 12, fontFamily: "monospace", marginTop: 4 }}>{m.formula}</div>
          </div>
          <div style={{ background: "#2a0f0f", border: "1px solid #ff6b6b44", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#ff6b6b" }}>Fails when: {m.bad}</div>
        </div>
      </div>
    ))}

    <CodeBlock lang="python" code={`from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_recall,
    context_precision,
)
from datasets import Dataset

# Prepare evaluation data
eval_data = {
    "question": ["What is the theft limit for P-200?"],
    "answer": ["The theft limit for Policy P-200 is $50,000."],
    "contexts": [["Policy P-200 theft limit is $50,000 per incident."]],
    "ground_truth": ["$50,000"],
}

dataset = Dataset.from_dict(eval_data)

# Run evaluation
result = evaluate(
    dataset=dataset,
    metrics=[faithfulness, answer_relevancy, context_recall, context_precision],
)

print(result)
# {'faithfulness': 1.0, 'answer_relevancy': 0.95,
#  'context_recall': 1.0, 'context_precision': 1.0}

# Target for production: all metrics > 0.85
# Production target: ~0.94 retrieval accuracy`} />

    <Callout type="key">
      <strong>Debugging low scores:</strong> Low faithfulness → LLM hallucinating, tighten system prompt. Low context recall → chunking too fine, or wrong embedding model. Low context precision → reranker threshold too low, or k too high.
    </Callout>
  </div>
);

const contentMap = {
  foundations: FoundationsContent,
  chunking: ChunkingContent,
  embeddings: EmbeddingsContent,
  hybrid: HybridContent,
  advanced: AdvancedContent,
  agentic: AgenticContent,
  evaluation: EvaluationContent,
};

// ─── Main App ────────────────────────────────────────────────────────────────

export default function RAGAcademy() {
  const [activeModule, setActiveModule] = useState(0);
  const [completed, setCompleted] = useState(new Set());
  const current = modules[activeModule];
  const Content = contentMap[current.content];

  const go = (dir) => {
    const next = activeModule + dir;
    if (next >= 0 && next < modules.length) {
      setCompleted(c => new Set([...c, activeModule]));
      setActiveModule(next);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: 500, maxHeight: "80vh", background: "#0d1117", fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#c9d1d9", overflow: "hidden", borderRadius: 8 }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: "#0d1117", borderRight: "1px solid #21262d", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid #21262d" }}>
          <div style={{ color: "#ffffff", fontWeight: 800, fontSize: 16, letterSpacing: -0.5 }}>RAG Academy</div>
          <div style={{ color: "#8b949e", fontSize: 12, marginTop: 2 }}>From Scratch → Production</div>
          <div style={{ marginTop: 10, background: "#161b22", borderRadius: 4, height: 4, overflow: "hidden" }}>
            <div style={{ background: current.color, height: "100%", width: `${((completed.size) / modules.length) * 100}%`, transition: "width 0.5s", borderRadius: 4 }} />
          </div>
          <div style={{ color: "#8b949e", fontSize: 11, marginTop: 4 }}>{completed.size}/{modules.length} modules completed</div>
        </div>
        <div style={{ flex: 1, padding: "8px 8px" }}>
          {modules.map((m, i) => {
            const isActive = activeModule === i;
            const isDone = completed.has(i);
            return (
              <div key={i} onClick={() => setActiveModule(i)}
                style={{ padding: "10px 12px", borderRadius: 8, marginBottom: 2, cursor: "pointer", background: isActive ? `${m.color}18` : "transparent", border: isActive ? `1px solid ${m.color}44` : "1px solid transparent", transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{isDone && !isActive ? "✅" : m.emoji}</span>
                  <div>
                    <div style={{ color: isActive ? m.color : "#c9d1d9", fontSize: 13, fontWeight: isActive ? 700 : 400 }}>{m.title}</div>
                    <div style={{ color: "#8b949e", fontSize: 11 }}>{m.subtitle}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "16px 24px", borderBottom: "1px solid #21262d", background: "#0d1117", display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 24 }}>{current.emoji}</span>
          <div>
            <div style={{ color: current.color, fontWeight: 700, fontSize: 16 }}>Module {activeModule + 1} / {modules.length}</div>
            <div style={{ color: "#8b949e", fontSize: 12 }}>{current.subtitle}</div>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", maxWidth: 900 }}>
          <Content />
          {/* Nav buttons */}
          <div style={{ display: "flex", gap: 12, marginTop: 32, paddingTop: 16, borderTop: "1px solid #21262d" }}>
            {activeModule > 0 && (
              <button onClick={() => go(-1)} style={{ background: "#161b22", border: "1px solid #30363d", color: "#c9d1d9", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14 }}>← Previous</button>
            )}
            {activeModule < modules.length - 1 && (
              <button onClick={() => go(1)}
                style={{ background: current.color, border: "none", color: "#000", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, marginLeft: "auto" }}>
                Next Module →
              </button>
            )}
            {activeModule === modules.length - 1 && (
              <button onClick={() => { setCompleted(new Set(modules.map((_, i) => i))); }}
                style={{ background: "#00ff9d", border: "none", color: "#000", padding: "8px 20px", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 700, marginLeft: "auto" }}>
                🎓 Complete Course!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
