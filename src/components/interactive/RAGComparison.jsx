import { useState } from "react";

const ragData = [
  {
    id: "naive",
    emoji: "🌱",
    name: "Naive RAG",
    speed: 95,
    quality: 35,
    latency: "~200ms",
    color: "#94a3b8",
    speedLabel: "Blazing Fast",
    qualityLabel: "Basic",
    llmCalls: 1,
    dbCalls: 1,
    why: "One embed call + one vector search + one LLM call. Nothing else.",
    tradeoff: "Fast because it's minimal. Output quality suffers — no query optimization, wrong chunks often retrieved, no hallucination guard.",
    bestFor: "Demos, prototypes, FAQs with clean structured data",
  },
  {
    id: "ragfusion",
    emoji: "🔀",
    name: "RAG Fusion",
    speed: 55,
    quality: 72,
    latency: "~800ms",
    color: "#34d399",
    speedLabel: "Moderate",
    qualityLabel: "Good",
    llmCalls: 2,
    dbCalls: 4,
    why: "LLM generates 4 query variants → 4 retrievals → RRF fusion. More calls = slower.",
    tradeoff: "Better coverage on ambiguous queries. The 4x retrieval cost is worth it for vague user questions.",
    bestFor: "Customer-facing chatbots where queries are vague or conversational",
  },
  {
    id: "advanced",
    emoji: "⚡",
    name: "Advanced RAG",
    speed: 45,
    quality: 85,
    latency: "~1–2s",
    color: "#0ea5e9",
    speedLabel: "Moderate–Slow",
    qualityLabel: "High",
    llmCalls: 2,
    dbCalls: 2,
    why: "HyDE (1 LLM call) + hybrid search (2 retrievers) + cross-encoder rerank. Each step adds latency.",
    tradeoff: "The production sweet spot. ~94% retrieval accuracy. Latency is acceptable for most enterprise use cases.",
    bestFor: "Production insurance/legal/medical RAG — general production setup",
  },
  {
    id: "modular",
    emoji: "🧩",
    name: "Modular RAG",
    speed: 50,
    quality: 80,
    latency: "~1–1.5s",
    color: "#a78bfa",
    speedLabel: "Moderate",
    qualityLabel: "High",
    llmCalls: 2,
    dbCalls: 2,
    why: "Router LLM call + one specialized engine. Similar to Advanced RAG but smarter routing.",
    tradeoff: "Speed depends on which module is activated. Quality is high because each module is tuned for its domain.",
    bestFor: "Multi-domain systems (policy + claims + FAQ as separate modules)",
  },
  {
    id: "selfrag",
    emoji: "🪞",
    name: "Self-RAG",
    speed: 35,
    quality: 88,
    latency: "~2–3s",
    color: "#f59e0b",
    speedLabel: "Slow",
    qualityLabel: "Very High",
    llmCalls: 3,
    dbCalls: "0–1",
    why: "3 LLM calls: (1) decide to retrieve, (2) score relevance, (3) verify answer is grounded.",
    tradeoff: "Skips retrieval on simple queries (saves cost). But 3 LLM calls when retrieval IS needed = high latency. Reduces hallucinations significantly.",
    bestFor: "Mixed workloads where some queries are factual and some need docs",
  },
  {
    id: "crag",
    emoji: "🔧",
    name: "Corrective RAG",
    speed: 30,
    quality: 92,
    latency: "~2–4s",
    color: "#fb923c",
    speedLabel: "Slow",
    qualityLabel: "Very High",
    llmCalls: "2–3",
    dbCalls: "1–2",
    why: "Retrieve → evaluate relevance (LLM) → possibly re-retrieve or web search. Worst case: 2 retrieval rounds.",
    tradeoff: "The most trustworthy output for high-stakes domains. You pay in latency but get near-zero irrelevant context passed to LLM.",
    bestFor: "Insurance, legal, medical — domains where wrong answer = real damage",
  },
  {
    id: "speculative",
    emoji: "🎯",
    name: "Speculative RAG",
    speed: 40,
    quality: 87,
    latency: "~1.5–2.5s",
    color: "#38bdf8",
    speedLabel: "Moderate–Slow",
    qualityLabel: "Very High",
    llmCalls: 2,
    dbCalls: "1–3",
    why: "LLM drafts first (1 call) → targeted claim retrieval → verify/correct (1 call). 2 LLM calls minimum.",
    tradeoff: "Targeted retrieval (only verifies specific claims) keeps DB calls low. Good accuracy-to-cost ratio.",
    bestFor: "When LLM base knowledge is decent but needs fact-checking",
  },
  {
    id: "graphrag",
    emoji: "🕸️",
    name: "Graph RAG",
    speed: 25,
    quality: 93,
    latency: "~3–6s",
    color: "#e879f9",
    speedLabel: "Very Slow",
    qualityLabel: "Excellent",
    llmCalls: "2–3",
    dbCalls: "graph+vector",
    why: "Graph traversal + vector search + relationship resolution. Graph queries can chain multiple hops.",
    tradeoff: "Unmatched for multi-entity relational queries. But graph traversal at scale is expensive. Indexing is complex.",
    bestFor: "Complex multi-condition queries across entities (policy + coverage + region + vehicle type)",
  },
  {
    id: "multimodal",
    emoji: "👁️",
    name: "Multi-modal RAG",
    speed: 15,
    quality: 90,
    latency: "~4–8s",
    color: "#f472b6",
    speedLabel: "Slowest",
    qualityLabel: "Excellent",
    llmCalls: "2–4",
    dbCalls: 2,
    why: "Vision model calls for images are expensive. Each image description = extra LLM call. Table parsing adds overhead.",
    tradeoff: "Necessary when docs have charts/images/tables. No alternative for visual data. Worth the latency.",
    bestFor: "Scanned insurance forms, PDF tables, accident report images",
  },
  {
    id: "agentic",
    emoji: "🤖",
    name: "Agentic RAG",
    speed: 8,
    quality: 97,
    latency: "~5–30s",
    color: "#fbbf24",
    speedLabel: "Slowest",
    qualityLabel: "Highest",
    llmCalls: "3–10+",
    dbCalls: "2–8+",
    why: "ReAct loop: each iteration = 1 LLM call + 1 retrieval. Complex queries = many iterations. Unbounded.",
    tradeoff: "The most powerful — handles multi-step reasoning, tool use, cross-document synthesis. Latency is the cost of intelligence.",
    bestFor: "Complex analytical queries, comparisons, calculations, multi-document synthesis",
  },
  {
    id: "adaptive",
    emoji: "🧭",
    name: "Adaptive RAG",
    speed: 75,
    quality: 91,
    latency: "~150ms–3s",
    color: "#22d3ee",
    speedLabel: "Variable (by design)",
    qualityLabel: "Very High",
    llmCalls: "1 + N",
    dbCalls: "0–4+",
    why: "1 classifier call first. Then 0 DB calls (no retrieval), 1 call (single-hop), or 2–4 calls (multi-hop) depending on query. Avg latency is lower than always-retrieving.",
    tradeoff: "Best average-case performance. Simple queries bypass retrieval entirely (fast + cheap). Hard queries get full multi-hop retrieval. Misclassification is the only risk.",
    bestFor: "Mixed workloads where query complexity varies: support bots, assistants, general-purpose RAG",
  },
  {
    id: "contextual",
    emoji: "🧩",
    name: "Contextual Retrieval",
    speed: 65,
    quality: 88,
    latency: "~400–700ms",
    color: "#a78bfa",
    speedLabel: "Moderate",
    qualityLabel: "Very High",
    llmCalls: 2,
    dbCalls: 1,
    why: "Haiku generates context per chunk at index time (batch, not per query). Query time: 1 embed call + 1 vector search + 1 LLM generation. The indexing overhead is offline.",
    tradeoff: "49% fewer retrieval failures vs naive RAG. 69% fewer when combined with BM25 (Anthropic, 2025 follow-up). Storage grows ~50%. Worth it for docs where chunks lose meaning without context (policy sections, legal clauses).",
    bestFor: "Production systems with complex, multi-section documents where chunk context matters",
  },
  {
    id: "latechunking",
    emoji: "⏱️",
    name: "Late Chunking",
    speed: 58,
    quality: 82,
    latency: "~500–800ms",
    color: "#34d399",
    speedLabel: "Moderate",
    qualityLabel: "High",
    llmCalls: 1,
    dbCalls: 1,
    why: "Full document goes through long-context encoder (expensive for large docs). No extra LLM call vs contextual retrieval. One encoder pass + pooling per chunk. Standard 1 LLM call for generation.",
    tradeoff: "10-12% retrieval quality improvement vs traditional chunking. No extra LLM cost vs contextual retrieval. Requires jina-v3 or similar 8192+ token encoder. Best for highly inter-connected documents.",
    bestFor: "Documents with strong cross-sentence dependencies and available GPU for long-context encoding",
  },
  {
    id: "longcontext",
    emoji: "📐",
    name: "Long-Context RAG",
    speed: 20,
    quality: 85,
    latency: "~5–20s",
    color: "#22d3ee",
    speedLabel: "Slow",
    qualityLabel: "High",
    llmCalls: 1,
    dbCalls: 0,
    why: "No retrieval step at all — the 'slowness' comes from feeding 300K–900K tokens to the LLM. The LLM processes the entire corpus every query. Very expensive per query.",
    tradeoff: "Zero retrieval infrastructure. Zero chunking errors. Near-perfect recall on 'needle in haystack' tasks. But at $15+/query for large corpora with Opus 4.5. Use haiku for smaller corpora ($0.25/1M tokens).",
    bestFor: "Small-to-medium corpora (<500K tokens) with low query frequency; compliance tools, policy lookups",
  },
];

const sorted = {
  speed: [...ragData].sort((a, b) => b.speed - a.speed),
  quality: [...ragData].sort((a, b) => b.quality - a.quality),
};

const Bar = ({ value, color, max = 100 }) => (
  <div style={{ position: "relative", height: 8, background: "#0f172a", borderRadius: 4, overflow: "hidden", flex: 1 }}>
    <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)" }} />
  </div>
);

export default function RAGComparison() {
  const [view, setView] = useState("matrix"); // matrix | speed | quality | detail
  const [selected, setSelected] = useState(null);
  const active = ragData.find(r => r.id === selected);

  return (
    <div style={{ height: 640, background: "#04080f", color: "#e2e8f0", fontFamily: "'DM Mono', 'Fira Code', monospace", borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid #0d1b2a" }}>
        <div style={{ fontSize: 10, letterSpacing: 4, color: "#1e3a5f", marginBottom: 6, textTransform: "uppercase" }}>RAG Benchmark</div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#e2e8f0", letterSpacing: -0.5, fontFamily: "'DM Mono', monospace" }}>
          Speed <span style={{ color: "#334155" }}>vs</span> Quality
        </h1>
        <p style={{ margin: "6px 0 0", color: "#1e3a5f", fontSize: 12 }}>All 13 RAG architectures ranked</p>
      </div>

      {/* View toggle */}
      <div style={{ padding: "12px 28px", borderBottom: "1px solid #0d1b2a", display: "flex", gap: 4 }}>
        {[["matrix", "⬛ Matrix"], ["speed", "⚡ Speed Rank"], ["quality", "🎯 Quality Rank"]].map(([v, label]) => (
          <button key={v} onClick={() => setView(v)}
            style={{ background: view === v ? "#0ea5e9" : "#0d1b2a", border: "none", color: view === v ? "#000" : "#475569", padding: "5px 14px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: view === v ? 800 : 400, fontFamily: "inherit" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Main panel */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>

          {/* ── MATRIX VIEW ── */}
          {view === "matrix" && (
            <div>
              {/* Scatter plot */}
              <div style={{ position: "relative", height: 320, background: "#060d17", border: "1px solid #0d1b2a", borderRadius: 12, marginBottom: 24, overflow: "hidden" }}>
                {/* Grid lines */}
                {[25, 50, 75].map(v => (
                  <div key={v}>
                    <div style={{ position: "absolute", left: `${v}%`, top: 0, bottom: 0, width: 1, background: "#0d1b2a" }} />
                    <div style={{ position: "absolute", top: `${100 - v}%`, left: 0, right: 0, height: 1, background: "#0d1b2a" }} />
                  </div>
                ))}
                {/* Axis labels */}
                <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", color: "#1e3a5f", fontSize: 10, letterSpacing: 2 }}>SPEED →</div>
                <div style={{ position: "absolute", left: 6, top: "50%", transform: "translateY(-50%) rotate(-90deg)", color: "#1e3a5f", fontSize: 10, letterSpacing: 2 }}>QUALITY →</div>
                {/* Quadrant labels */}
                <div style={{ position: "absolute", right: 10, top: 10, color: "#0ea5e9", fontSize: 9, opacity: 0.6 }}>FAST + HIGH QUALITY</div>
                <div style={{ position: "absolute", left: 20, top: 10, color: "#475569", fontSize: 9, opacity: 0.6 }}>SLOW + HIGH QUALITY</div>
                <div style={{ position: "absolute", right: 10, bottom: 20, color: "#475569", fontSize: 9, opacity: 0.6 }}>FAST + LOW QUALITY</div>

                {/* Dots */}
                {ragData.map(r => (
                  <div key={r.id} onClick={() => setSelected(r.id === selected ? null : r.id)}
                    style={{
                      position: "absolute",
                      left: `${r.speed}%`,
                      top: `${100 - r.quality}%`,
                      transform: "translate(-50%, -50%)",
                      cursor: "pointer",
                      zIndex: 2,
                      transition: "transform 0.2s"
                    }}>
                    <div style={{
                      width: selected === r.id ? 44 : 36,
                      height: selected === r.id ? 44 : 36,
                      borderRadius: "50%",
                      background: `${r.color}20`,
                      border: `2px solid ${selected === r.id ? r.color : r.color + "66"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: selected === r.id ? 18 : 14,
                      transition: "all 0.2s",
                      boxShadow: selected === r.id ? `0 0 20px ${r.color}44` : "none"
                    }}>
                      {r.emoji}
                    </div>
                    <div style={{ position: "absolute", left: "50%", top: "110%", transform: "translateX(-50%)", color: r.color, fontSize: 9, whiteSpace: "nowrap", fontWeight: 700 }}>
                      {r.name.replace(" RAG", "")}
                    </div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div style={{ border: "1px solid #0d1b2a", borderRadius: 10, overflow: "hidden" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 80px 80px 80px", gap: 0 }}>
                  {["RAG Type", "Speed", "Quality", "Latency", "LLM Calls", "DB Calls"].map(h => (
                    <div key={h} style={{ padding: "8px 12px", background: "#060d17", color: "#1e3a5f", fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", borderBottom: "1px solid #0d1b2a" }}>{h}</div>
                  ))}
                  {ragData.map((r, i) => (
                    <>
                      <div key={r.id + "-name"} onClick={() => setSelected(r.id === selected ? null : r.id)}
                        style={{ padding: "10px 12px", background: selected === r.id ? `${r.color}08` : i % 2 === 0 ? "#060d17" : "#04080f", borderBottom: "1px solid #0d1b2a", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                        <span>{r.emoji}</span>
                        <span style={{ color: selected === r.id ? r.color : "#94a3b8", fontSize: 12, fontWeight: selected === r.id ? 700 : 400 }}>{r.name}</span>
                      </div>
                      <div key={r.id + "-speed"} style={{ padding: "10px 12px", background: selected === r.id ? `${r.color}08` : i % 2 === 0 ? "#060d17" : "#04080f", borderBottom: "1px solid #0d1b2a", display: "flex", alignItems: "center", gap: 8 }}>
                        <Bar value={r.speed} color={r.color} />
                        <span style={{ color: "#475569", fontSize: 10, minWidth: 30 }}>{r.speed}</span>
                      </div>
                      <div key={r.id + "-qual"} style={{ padding: "10px 12px", background: selected === r.id ? `${r.color}08` : i % 2 === 0 ? "#060d17" : "#04080f", borderBottom: "1px solid #0d1b2a", display: "flex", alignItems: "center", gap: 8 }}>
                        <Bar value={r.quality} color={r.color} />
                        <span style={{ color: "#475569", fontSize: 10, minWidth: 30 }}>{r.quality}</span>
                      </div>
                      <div key={r.id + "-lat"} style={{ padding: "10px 12px", background: selected === r.id ? `${r.color}08` : i % 2 === 0 ? "#060d17" : "#04080f", borderBottom: "1px solid #0d1b2a", color: "#475569", fontSize: 11, display: "flex", alignItems: "center" }}>{r.latency}</div>
                      <div key={r.id + "-llm"} style={{ padding: "10px 12px", background: selected === r.id ? `${r.color}08` : i % 2 === 0 ? "#060d17" : "#04080f", borderBottom: "1px solid #0d1b2a", color: "#475569", fontSize: 11, display: "flex", alignItems: "center" }}>{r.llmCalls}</div>
                      <div key={r.id + "-db"} style={{ padding: "10px 12px", background: selected === r.id ? `${r.color}08` : i % 2 === 0 ? "#060d17" : "#04080f", borderBottom: "1px solid #0d1b2a", color: "#475569", fontSize: 11, display: "flex", alignItems: "center" }}>{r.dbCalls}</div>
                    </>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SPEED RANK VIEW ── */}
          {view === "speed" && (
            <div>
              <div style={{ color: "#1e3a5f", fontSize: 11, marginBottom: 16 }}>Ranked fastest → slowest. Speed inversely correlates with quality in most cases.</div>
              {sorted.speed.map((r, i) => (
                <div key={r.id} onClick={() => setSelected(r.id === selected ? null : r.id)}
                  style={{ background: selected === r.id ? `${r.color}10` : "#060d17", border: `1px solid ${selected === r.id ? r.color + "44" : "#0d1b2a"}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ color: "#1e3a5f", fontSize: 20, fontWeight: 800, minWidth: 32 }}>#{i + 1}</div>
                    <span style={{ fontSize: 20 }}>{r.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ color: r.color, fontWeight: 700, fontSize: 14 }}>{r.name}</span>
                        <span style={{ color: "#475569", fontSize: 12 }}>{r.latency}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Bar value={r.speed} color={r.color} />
                        <span style={{ color: r.color, fontSize: 11, fontWeight: 700, minWidth: 40 }}>{r.speedLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, color: "#334155", fontSize: 12, borderTop: "1px solid #0d1b2a", paddingTop: 8 }}>
                    {r.why}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── QUALITY RANK VIEW ── */}
          {view === "quality" && (
            <div>
              <div style={{ color: "#1e3a5f", fontSize: 11, marginBottom: 16 }}>Ranked best → lowest output quality. Quality = retrieval accuracy + answer faithfulness.</div>
              {sorted.quality.map((r, i) => (
                <div key={r.id} onClick={() => setSelected(r.id === selected ? null : r.id)}
                  style={{ background: selected === r.id ? `${r.color}10` : "#060d17", border: `1px solid ${selected === r.id ? r.color + "44" : "#0d1b2a"}`, borderRadius: 10, padding: "14px 16px", marginBottom: 8, cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ color: i < 3 ? r.color : "#1e3a5f", fontSize: 20, fontWeight: 800, minWidth: 32 }}>#{i + 1}</div>
                    <span style={{ fontSize: 20 }}>{r.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ color: r.color, fontWeight: 700, fontSize: 14 }}>{r.name}</span>
                        <span style={{ color: "#475569", fontSize: 12 }}>{r.qualityLabel}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Bar value={r.quality} color={r.color} />
                        <span style={{ color: r.color, fontSize: 11, fontWeight: 700, minWidth: 24 }}>{r.quality}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginTop: 8, color: "#334155", fontSize: 12, borderTop: "1px solid #0d1b2a", paddingTop: 8 }}>
                    {r.tradeoff}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail side panel */}
        {active && (
          <div style={{ width: 300, borderLeft: "1px solid #0d1b2a", overflowY: "auto", padding: "20px 20px", flexShrink: 0, background: "#060d17" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 28 }}>{active.emoji}</span>
                <div style={{ color: active.color, fontWeight: 800, fontSize: 15, marginTop: 4 }}>{active.name}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#334155", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>

            {[
              { label: "Speed", value: active.speed, bar: true },
              { label: "Quality", value: active.quality, bar: true },
            ].map(m => (
              <div key={m.label} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "#334155", fontSize: 10, letterSpacing: 2, textTransform: "uppercase" }}>{m.label}</span>
                  <span style={{ color: active.color, fontSize: 11, fontWeight: 700 }}>{m.value}/100</span>
                </div>
                <Bar value={m.value} color={active.color} />
              </div>
            ))}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "16px 0" }}>
              {[["Latency", active.latency], ["LLM Calls", active.llmCalls], ["DB Calls", active.dbCalls], ["Best", active.speedLabel]].map(([k, v]) => (
                <div key={k} style={{ background: "#04080f", border: "1px solid #0d1b2a", borderRadius: 6, padding: "8px 10px" }}>
                  <div style={{ color: "#1e3a5f", fontSize: 9, letterSpacing: 2, textTransform: "uppercase" }}>{k}</div>
                  <div style={{ color: active.color, fontSize: 12, fontWeight: 700, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "#1e3a5f", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Why this speed?</div>
              <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.7 }}>{active.why}</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "#1e3a5f", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Speed vs Quality tradeoff</div>
              <div style={{ color: "#475569", fontSize: 12, lineHeight: 1.7 }}>{active.tradeoff}</div>
            </div>
            <div style={{ background: `${active.color}10`, border: `1px solid ${active.color}33`, borderRadius: 8, padding: 10 }}>
              <div style={{ color: "#1e3a5f", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Best For</div>
              <div style={{ color: active.color, fontSize: 12, lineHeight: 1.6 }}>{active.bestFor}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
