import { useState, useEffect } from "react";

const C = {
  bg: "#0d1117", card: "#161b22", ink: "#e0e0e0", muted: "#9ba8b0",
  faint: "#1c2333", border: "rgba(255,255,255,0.1)", orange: "#fb923c", teal: "#00a854",
  blue: "#4d9de0", rose: "#f87171", amber: "#f5a623", green: "#00d46a",
};

const Box = ({ title, color, icon, children }) => (
  <div style={{ background: `${color}10`, border: `1.5px solid ${color}44`, borderLeft: `4px solid ${color}`, borderRadius: 10, padding: 16, marginBottom: 14 }}>
    {title && <div style={{ color, fontWeight: 800, fontSize: 13, marginBottom: 8 }}>{icon} {title}</div>}
    <div style={{ color: C.ink, fontSize: 13.5, lineHeight: 1.8 }}>{children}</div>
  </div>
);

const Pill = ({ children, color }) => (
  <span style={{ background: `${color}18`, border: `1.5px solid ${color}55`, color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700, display: "inline-block", margin: "2px 3px" }}>{children}</span>
);

const ChatBubble = ({ children, who }) => (
  <div style={{ display: "flex", justifyContent: who === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
    {who !== "user" && <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginRight: 8, flexShrink: 0 }}>🤖</div>}
    <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: who === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: who === "user" ? C.blue : C.card, border: `1.5px solid ${who === "user" ? C.blue : C.border}`, color: who === "user" ? "#fff" : C.ink, fontSize: 13, lineHeight: 1.7 }}>{children}</div>
    {who === "user" && <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginLeft: 8, flexShrink: 0 }}>👤</div>}
  </div>
);

const DOCS = [
  { id: "A", emoji: "📄", title: "School Rules - Page 1", text: "Students must wear uniforms every day. School starts at 8:00 AM. Late arrivals must sign in at the office. Lunch break is from 12:30 PM to 1:15 PM." },
  { id: "B", emoji: "📄", title: "School Rules - Page 2", text: "Library books can be borrowed for 2 weeks. Late returns attract a fine of Rs.5 per day. Students must be quiet in the library. No food or drinks allowed." },
  { id: "C", emoji: "📄", title: "Holiday Notice", text: "School will be closed on 15th August for Independence Day. Summer vacation runs from May 1st to June 15th. Diwali break is for 5 days in October." },
  { id: "D", emoji: "📄", title: "Sports Day Info", text: "Annual Sports Day is on 20th November. Students must register for events by 10th November. Winners receive gold, silver, and bronze medals." },
  { id: "E", emoji: "📄", title: "Fee Structure", text: "Tuition fee is Rs.5,000 per month. Bus fee is Rs.1,500 per month. The last date to pay fees is the 10th of every month. Late fee penalty is Rs.200." },
];

const QUERY = "What is the fine for returning library books late?";

const ALL_CHUNKS = [
  { id: 1, from: "A", text: "Students must wear uniforms every day. School starts at 8:00 AM.", score: 0.12 },
  { id: 2, from: "B", text: "Library books can be borrowed for 2 weeks. Late returns attract a fine of Rs.5 per day.", score: 0.94, topK: true },
  { id: 3, from: "B", text: "Students must be quiet in the library. No food or drinks allowed.", score: 0.38, topK: true },
  { id: 4, from: "C", text: "School will be closed on 15th August for Independence Day.", score: 0.08 },
  { id: 5, from: "D", text: "Annual Sports Day is on 20th November.", score: 0.05 },
  { id: 6, from: "E", text: "Tuition fee is Rs.5,000 per month. Late fee penalty is Rs.200.", score: 0.32, topK: true },
];

function PageIntro() {
  return (
    <div>
      <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
        <div style={{ fontSize: 52, marginBottom: 8 }}>📚</div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.ink }}>The School Library Story</h2>
        <p style={{ color: C.muted, fontSize: 14, marginTop: 6 }}>We will learn Naive RAG using a school chatbot that anyone can relate to.</p>
      </div>
      <Box color={C.orange} icon="🎯" title="The Problem RAG Solves">
        A regular AI only knows what it learned during training. It knows nothing about your school rules, company policies, or hospital procedures.
        <br /><br />
        <strong>RAG fixes this</strong> — it lets the AI read YOUR documents first, then answer based on what it read.
      </Box>
      <Box color={C.teal} icon="📖" title="The Librarian Analogy">
        Think of Naive RAG like a very smart librarian:
        <br />1. You give the librarian all your books (documents)
        <br />2. They <strong>read and index</strong> every page
        <br />3. You ask a question
        <br />4. They <strong>find the most relevant pages</strong> instantly
        <br />5. They read those pages and <strong>give you a precise answer</strong>
        <br /><br />
        That is Naive RAG!
      </Box>
      <div style={{ background: C.faint, borderRadius: 12, padding: 16 }}>
        <div style={{ fontWeight: 800, color: C.ink, marginBottom: 10, fontSize: 14 }}>Our Use Case Today</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>5 SCHOOL DOCUMENTS</div>
            {DOCS.map(d => <div key={d.id} style={{ fontSize: 13, color: C.ink, padding: "2px 0" }}>{d.emoji} {d.title}</div>)}
          </div>
          <div>
            <div style={{ color: C.muted, fontSize: 11, fontWeight: 700, marginBottom: 6 }}>QUESTION WE WILL ASK</div>
            <div style={{ background: `${C.blue}18`, border: `1.5px solid ${C.blue}55`, borderRadius: 8, padding: 10, color: C.blue, fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>"{QUERY}"</div>
            <div style={{ color: C.muted, fontSize: 12, marginTop: 6 }}>A student asking about the library fine.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageLoadDocs() {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 42 }}>📥</div>
        <h2 style={{ margin: "4px 0", fontSize: 22, fontWeight: 900, color: C.orange }}>Step 1: Load Documents</h2>
        <p style={{ color: C.muted, fontSize: 14 }}>Feed all your documents into the system</p>
      </div>
      <Box color={C.orange} icon="💡" title="What happens here?">
        You give the RAG system all your documents — PDFs, Word files, text files, web pages. The system reads them all and prepares to process them. This is the very first step.
      </Box>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 800, color: C.ink, marginBottom: 10, fontSize: 14 }}>Our 5 School Documents:</div>
        {DOCS.map(d => (
          <div key={d.id} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.orange}18`, border: `1.5px solid ${C.orange}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{d.emoji}</div>
            <div>
              <div style={{ fontWeight: 700, color: C.ink, fontSize: 13 }}>Doc {d.id}: {d.title}</div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{d.text.substring(0, 70)}...</div>
            </div>
          </div>
        ))}
      </div>
      <Box color={C.amber} icon="⚠️" title="Real World Scale">
        In production you would load hundreds or thousands of documents. For a general production system, this would be all your domain-specific PDFs, procedure manuals, and FAQ documents.
      </Box>
    </div>
  );
}

function PageChunking() {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 42 }}>✂️</div>
        <h2 style={{ margin: "4px 0", fontSize: 22, fontWeight: 900, color: C.teal }}>Step 2: Chunking</h2>
        <p style={{ color: C.muted, fontSize: 14 }}>Cut big documents into small, searchable pieces</p>
      </div>
      <Box color={C.teal} icon="💡" title="Why cut documents into chunks?">
        If you store the whole document, you would have to return the ENTIRE document to the AI when a user asks a question. That is expensive and the AI would lose focus.
        <br /><br />
        Instead, we cut each document into small pieces of 2-4 sentences. This way we can find and return ONLY the exact piece that answers the question.
        <br /><br />
        <strong>Too big</strong> = returns too much irrelevant text<br />
        <strong>Too small</strong> = loses context ("fine is Rs.5" — fine for WHAT?)<br />
        <strong>Just right</strong> = 2-4 sentences covering one complete idea
      </Box>
      <div style={{ background: C.faint, borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: C.ink, marginBottom: 10 }}>Cutting Doc B into 2 chunks:</div>
        <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: 12, marginBottom: 8, fontSize: 13, color: C.ink, lineHeight: 1.7 }}>
          <span style={{ color: C.teal, fontWeight: 700 }}>Doc B (original):</span>
          <br />"Library books can be borrowed for 2 weeks. Late returns attract a fine of Rs.5 per day. Students must be quiet in the library. No food or drinks allowed."
        </div>
        <div style={{ textAlign: "center", fontSize: 16, margin: "6px 0", color: C.muted }}>split into two chunks below</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ background: `${C.teal}12`, border: `1.5px solid ${C.teal}55`, borderRadius: 8, padding: 10 }}>
            <Pill color={C.teal}>Chunk B-1</Pill>
            <div style={{ fontSize: 12, color: C.ink, marginTop: 6, lineHeight: 1.6 }}>"Library books can be borrowed for 2 weeks. Late returns attract a fine of Rs.5 per day."</div>
          </div>
          <div style={{ background: `${C.teal}12`, border: `1.5px solid ${C.teal}55`, borderRadius: 8, padding: 10 }}>
            <Pill color={C.teal}>Chunk B-2</Pill>
            <div style={{ fontSize: 12, color: C.ink, marginTop: 6, lineHeight: 1.6 }}>"Students must be quiet in the library. No food or drinks allowed."</div>
          </div>
        </div>
      </div>
      <div style={{ fontWeight: 800, color: C.ink, marginBottom: 8, fontSize: 14 }}>All Chunks After Splitting:</div>
      {ALL_CHUNKS.map(chunk => (
        <div key={chunk.id} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 6, display: "flex", gap: 10, alignItems: "center" }}>
          <Pill color={C.teal}>Doc {chunk.from} - Chunk {chunk.id}</Pill>
          <span style={{ fontSize: 12, color: C.muted, flex: 1 }}>{chunk.text}</span>
        </div>
      ))}
    </div>
  );
}

function PageEmbedding() {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 42 }}>🔢</div>
        <h2 style={{ margin: "4px 0", fontSize: 22, fontWeight: 900, color: C.blue }}>Step 3: Embedding</h2>
        <p style={{ color: C.muted, fontSize: 14 }}>Convert every chunk of text into a list of numbers</p>
      </div>
      <Box color={C.blue} icon="💡" title="Why convert text to numbers?">
        Computers cannot compare text directly — but they CAN compare numbers! An embedding model reads a sentence and converts it into hundreds of numbers. These numbers capture the <strong>meaning</strong> of the sentence.
        <br /><br />
        <strong>Key insight:</strong> Sentences with similar meanings produce similar numbers. So "library fine" and "late return penalty" will produce very similar number lists!
      </Box>
      <Box color={C.amber} icon="🗺️" title="GPS Analogy">
        Mumbai is at coordinates (19.07, 72.87). Pune is at (18.52, 73.85). They are close in numbers because they are geographically close.
        <br /><br />
        Embeddings work the same way — but for <strong>meaning</strong> instead of location. Two sentences about "library fine" will be close in the number space!
      </Box>
      <div style={{ fontWeight: 800, color: C.ink, marginBottom: 8, fontSize: 14 }}>Text converted to numbers (simplified to 5 dimensions for learning):</div>
      <div style={{ overflowX: "auto", marginBottom: 6 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: `${C.blue}18` }}>
              <th style={{ padding: "8px 10px", textAlign: "left", color: C.muted, border: `1px solid ${C.border}` }}>Chunk</th>
              <th style={{ padding: "8px 10px", textAlign: "left", color: C.muted, border: `1px solid ${C.border}` }}>Text (shortened)</th>
              <th style={{ padding: "8px 10px", textAlign: "left", color: C.muted, border: `1px solid ${C.border}` }}>Vector</th>
            </tr>
          </thead>
          <tbody>
            {[
              { label: "B-1", text: "Library books... fine Rs.5 per day", vec: "[0.82, 0.71, 0.15, 0.91, 0.34, ...]" },
              { label: "B-2", text: "Be quiet in library. No food.", vec: "[0.12, 0.68, 0.09, 0.55, 0.21, ...]" },
              { label: "A-1", text: "Wear uniforms. School at 8 AM.", vec: "[0.23, 0.11, 0.78, 0.19, 0.45, ...]" },
              { label: "E-1", text: "Tuition fee Rs.5000. Late penalty.", vec: "[0.61, 0.22, 0.44, 0.38, 0.77, ...]" },
            ].map((row, i) => (
              <tr key={row.label} style={{ background: i % 2 === 0 ? C.card : C.faint }}>
                <td style={{ padding: "8px 10px", fontWeight: 700, color: C.blue, border: `1px solid ${C.border}` }}>{row.label}</td>
                <td style={{ padding: "8px 10px", color: C.ink, border: `1px solid ${C.border}` }}>{row.text}</td>
                <td style={{ padding: "8px 10px", fontFamily: "monospace", color: C.teal, border: `1px solid ${C.border}` }}>{row.vec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ color: C.muted, fontSize: 11, marginBottom: 14 }}>* Real embeddings have 384-1536 dimensions. Simplified here to 5 for clarity.</div>
      <Box color={C.green} icon="✅" title="After this step">
        Every chunk now has a vector (list of numbers). This is stored in the Vector Database along with the original text. Ready to search!
      </Box>
    </div>
  );
}

function PageVectorDB() {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 42 }}>🗄️</div>
        <h2 style={{ margin: "4px 0", fontSize: 22, fontWeight: 900, color: C.rose }}>Step 4: Store in Vector Database</h2>
        <p style={{ color: C.muted, fontSize: 14 }}>Save all chunks plus their number representations</p>
      </div>
      <Box color={C.rose} icon="💡" title="What is a Vector Database?">
        A Vector Database stores three things per chunk:
        <br />1. The <strong>original text</strong> of the chunk
        <br />2. The <strong>vector (numbers)</strong> representing its meaning
        <br />3. <strong>Metadata</strong> — which document it came from, page number, etc.
        <br /><br />
        It can search millions of chunks in milliseconds using cosine similarity math.
      </Box>
      <div style={{ fontWeight: 800, color: C.ink, marginBottom: 8, fontSize: 14 }}>Inside our Vector Database:</div>
      <div style={{ background: "#0a0f1e", borderRadius: 12, padding: 16, overflowX: "auto", marginBottom: 14 }}>
        <div style={{ color: "#475569", fontSize: 10, fontWeight: 700, marginBottom: 8, letterSpacing: 2 }}>CHROMADB - 10 CHUNKS STORED</div>
        {[
          { id: "chunk_001", text: "Students must wear uniforms...", vec: "[0.23, 0.11, ...]", src: "Doc A", hl: false },
          { id: "chunk_002", text: "Library books... fine Rs.5 per day.", vec: "[0.82, 0.71, ...]", src: "Doc B", hl: true },
          { id: "chunk_003", text: "Be quiet in the library...", vec: "[0.12, 0.68, ...]", src: "Doc B", hl: false },
          { id: "chunk_004", text: "School closed on 15th August...", vec: "[0.34, 0.22, ...]", src: "Doc C", hl: false },
          { id: "chunk_005", text: "Tuition fee Rs.5,000 per month...", vec: "[0.61, 0.22, ...]", src: "Doc E", hl: false },
        ].map(row => (
          <div key={row.id} style={{ display: "flex", gap: 10, padding: "5px 0", borderBottom: "1px solid #1e293b" }}>
            <span style={{ color: row.hl ? "#4ade80" : "#475569", fontSize: 11, fontFamily: "monospace", minWidth: 95, flexShrink: 0 }}>{row.id}</span>
            <span style={{ color: row.hl ? "#e2e8f0" : "#64748b", fontSize: 11, flex: 1 }}>{row.text}</span>
            <span style={{ color: "#334155", fontSize: 10, fontFamily: "monospace", minWidth: 100, flexShrink: 0 }}>{row.vec}</span>
            <span style={{ color: row.hl ? "#4ade80" : "#334155", fontSize: 10, minWidth: 40, flexShrink: 0 }}>{row.src}</span>
          </div>
        ))}
        <div style={{ color: "#1e3a5f", fontSize: 11, marginTop: 8, textAlign: "center" }}>... 5 more chunks ...</div>
      </div>
      <Box color={C.green} icon="✅" title="Indexing Complete — Steps 1-4 done only ONCE!">
        This whole process happens only when you first set up the system. After this the vector database is ready. You do not redo this unless your documents change.
      </Box>
    </div>
  );
}

function PageQuestion() {
  const [animStep, setAnimStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setAnimStep(prev => {
        if (prev < 4) return prev + 1;
        clearInterval(timer);
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const steps = [
    "The question is received by the RAG system",
    "The question is sent to the same embedding model used for indexing",
    "The question is converted into a vector (list of numbers)",
    "That vector is used to search the vector database",
  ];

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 42 }}>❓</div>
        <h2 style={{ margin: "4px 0", fontSize: 22, fontWeight: 900, color: C.amber }}>Step 5: User Asks a Question</h2>
        <p style={{ color: C.muted, fontSize: 14 }}>The query phase begins — this runs every time someone asks</p>
      </div>
      <Box color={C.amber} icon="💡" title="Indexing vs Querying">
        Steps 1-4 were the <strong>indexing phase</strong> — done once, offline. From Step 5 onwards is the <strong>query phase</strong> — this happens in real-time every time a user asks a question.
      </Box>
      <div style={{ background: C.faint, borderRadius: 12, padding: 20, marginBottom: 18 }}>
        <ChatBubble who="user">{QUERY}</ChatBubble>
        <div style={{ textAlign: "center", color: C.muted, fontSize: 12, marginTop: 4 }}>A student asks this to the school chatbot</div>
      </div>
      <div style={{ fontWeight: 800, color: C.ink, marginBottom: 10, fontSize: 14 }}>What happens next — in milliseconds:</div>
      {steps.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", background: animStep > i ? `${C.amber}12` : C.card, border: `1.5px solid ${animStep > i ? `${C.amber}55` : C.border}`, borderRadius: 8, marginBottom: 6, transition: "all 0.3s" }}>
          <span style={{ fontSize: 18 }}>{animStep > i ? "✅" : "⏳"}</span>
          <span style={{ fontSize: 13, color: animStep > i ? C.ink : C.muted }}>{i + 1}. {s}</span>
        </div>
      ))}
      <Box color={C.rose} icon="🔑" title="Critical Rule">
        You MUST use the <strong>same embedding model</strong> for both indexing (Step 3) and querying (Step 5). Different models produce different number scales — like comparing km and miles. The search will fail if they do not match.
      </Box>
    </div>
  );
}

function PageSearch() {
  const [selected, setSelected] = useState(null);
  const sorted = [...ALL_CHUNKS].sort((a, b) => b.score - a.score);

  const scoreColor = (score) => {
    if (score >= 0.7) return C.green;
    if (score >= 0.3) return C.amber;
    return C.muted;
  };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 42 }}>🔍</div>
        <h2 style={{ margin: "4px 0", fontSize: 22, fontWeight: 900, color: C.teal }}>Step 6: Similarity Search</h2>
        <p style={{ color: C.muted, fontSize: 14 }}>Find the chunks most similar to the question</p>
      </div>
      <Box color={C.teal} icon="💡" title="How similarity search works">
        The question's vector is compared to every chunk's vector using Cosine Similarity — a math formula that returns a score from 0 to 1.
        <br /><br />
        <strong>1.0</strong> = identical meaning | <strong>0.5</strong> = somewhat related | <strong>0.0</strong> = completely different
        <br /><br />
        The system picks the <strong>Top-K chunks</strong> (usually K=3 to K=5) with the highest scores.
      </Box>
      <div style={{ background: `${C.blue}10`, border: `1.5px solid ${C.blue}44`, borderRadius: 10, padding: 12, marginBottom: 12 }}>
        <div style={{ color: C.blue, fontWeight: 700, fontSize: 13 }}>Query: "{QUERY}"</div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 4, fontFamily: "monospace" }}>Query vector: [0.79, 0.74, 0.11, 0.88, 0.28, ...]</div>
      </div>
      <div style={{ fontWeight: 800, color: C.ink, marginBottom: 8, fontSize: 14 }}>All Chunks Ranked by Similarity (click any row to expand):</div>
      {sorted.map((chunk, i) => {
        const col = scoreColor(chunk.score);
        const isOpen = selected === chunk.id;
        return (
          <div key={chunk.id} onClick={() => setSelected(isOpen ? null : chunk.id)} style={{ background: chunk.topK ? `${col}10` : C.card, border: `1.5px solid ${isOpen ? col : chunk.topK ? `${col}44` : C.border}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer", transition: "all 0.15s", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: chunk.topK ? `${col}22` : C.faint, border: `1.5px solid ${col}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: col, flexShrink: 0 }}>
                {chunk.topK ? "V" : i + 1}
              </div>
              <span style={{ flex: 1, fontSize: 12, color: C.ink }}>{chunk.text.substring(0, 62)}...</span>
              <span style={{ color: col, fontWeight: 800, fontSize: 15, minWidth: 36, textAlign: "right" }}>{chunk.score}</span>
              <div style={{ width: 70, flexShrink: 0 }}>
                <div style={{ background: C.faint, borderRadius: 3, height: 7, overflow: "hidden" }}>
                  <div style={{ width: `${chunk.score * 100}%`, height: "100%", background: col, borderRadius: 3 }} />
                </div>
              </div>
            </div>
            {chunk.topK && <div style={{ marginTop: 4 }}><Pill color={col}>TOP-3 RETRIEVED</Pill></div>}
            {isOpen && (
              <div style={{ marginTop: 8, background: `${col}10`, borderRadius: 6, padding: 8, fontSize: 12, color: C.ink }}>
                <strong>Full text:</strong> "{chunk.text}"
                <br /><strong>From:</strong> Doc {chunk.from} | <strong>Score:</strong> {chunk.score}
                <br />{chunk.topK ? "SELECTED for context" : "Not selected — score too low"}
              </div>
            )}
          </div>
        );
      })}
      <Box color={C.green} icon="✅" title="Result: Top-3 chunks selected">
        Only the 3 highest-scoring chunks are passed to the next step. The rest are discarded. This keeps the AI prompt short and focused.
      </Box>
    </div>
  );
}

function PagePrompt() {
  const topChunks = ALL_CHUNKS.filter(c => c.topK).sort((a, b) => b.score - a.score);
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 42 }}>📋</div>
        <h2 style={{ margin: "4px 0", fontSize: 22, fontWeight: 900, color: C.rose }}>Step 7: Build the Prompt</h2>
        <p style={{ color: C.muted, fontSize: 14 }}>Combine retrieved chunks and question into one message for the AI</p>
      </div>
      <Box color={C.rose} icon="💡" title="What is a prompt?">
        A prompt is the complete message sent to the AI (LLM). In Naive RAG the prompt has 3 parts:
        <br />1. <strong>System instruction</strong> — tells the AI how to behave
        <br />2. <strong>Context</strong> — the top-K retrieved chunks (the evidence)
        <br />3. <strong>Question</strong> — what the user actually asked
        <br /><br />
        The AI is told: "Answer ONLY using the context provided. Do not make things up."
      </Box>
      <div style={{ fontWeight: 800, color: C.ink, marginBottom: 8, fontSize: 14 }}>The 3 Retrieved Chunks added as Context:</div>
      {topChunks.map((c, i) => {
        const col = i === 0 ? C.green : C.amber;
        return (
          <div key={c.id} style={{ background: `${col}10`, border: `1.5px solid ${col}44`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <Pill color={col}>Chunk #{i + 1}</Pill>
              <span style={{ color: col, fontWeight: 700, fontSize: 12 }}>Score: {c.score}</span>
            </div>
            <div style={{ fontSize: 13, color: C.ink }}>"{c.text}"</div>
          </div>
        );
      })}
      <div style={{ fontWeight: 800, color: C.ink, marginTop: 16, marginBottom: 8, fontSize: 14 }}>Final Prompt Sent to the AI:</div>
      <div style={{ background: "#0a0f1e", borderRadius: 12, padding: 16, fontFamily: "monospace", fontSize: 11.5, lineHeight: 2 }}>
        <div style={{ color: "#f59e0b" }}>SYSTEM:</div>
        <div style={{ color: "#e2e8f0", marginBottom: 12 }}>You are a helpful school assistant. Answer ONLY based on the context below. If the answer is not in the context, say "I don't know."</div>
        <div style={{ color: "#f59e0b" }}>CONTEXT:</div>
        <div style={{ color: "#4ade80", marginBottom: 4 }}>1. "Library books can be borrowed for 2 weeks. Late returns attract a fine of Rs.5 per day."</div>
        <div style={{ color: "#94a3b8", marginBottom: 4 }}>2. "Students must be quiet in the library. No food or drinks allowed."</div>
        <div style={{ color: "#94a3b8", marginBottom: 12 }}>3. "Tuition fee is Rs.5,000 per month. Late fee penalty is Rs.200."</div>
        <div style={{ color: "#f59e0b" }}>QUESTION:</div>
        <div style={{ color: "#38bdf8" }}>What is the fine for returning library books late?</div>
      </div>
    </div>
  );
}

function PageAnswer() {
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 42 }}>🤖</div>
        <h2 style={{ margin: "4px 0", fontSize: 22, fontWeight: 900, color: C.green }}>Step 8: LLM Generates the Answer</h2>
        <p style={{ color: C.muted, fontSize: 14 }}>The AI reads the context and produces the final response</p>
      </div>
      <Box color={C.green} icon="💡" title="What the LLM does">
        The LLM (like Claude) reads the full prompt — system instruction + context chunks + question — and writes a natural language answer. It stays strictly within the context provided and does not guess.
      </Box>
      <div style={{ background: C.faint, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <ChatBubble who="user">{QUERY}</ChatBubble>
        <div style={{ textAlign: "center", color: C.muted, fontSize: 12, margin: "6px 0" }}>1-2 seconds later...</div>
        <ChatBubble who="bot">
          The fine for returning library books late is <strong>Rs.5 per day</strong>. Library books can be borrowed for up to 2 weeks, so please return them on time to avoid charges!
        </ChatBubble>
      </div>
      <div style={{ fontWeight: 800, color: C.ink, marginBottom: 8, fontSize: 14 }}>Why this answer is trustworthy:</div>
      {[
        { icon: "✅", text: "Chunk 1 (score 0.94) was the most relevant — it had both the fine amount and the borrowing period.", color: C.green },
        { icon: "✅", text: "The Rs.5 figure came directly from the context. The AI did not invent it.", color: C.green },
        { icon: "✅", text: "Chunk 3 mentioned Rs.200 penalty — but for tuition fees. The AI correctly understood the difference.", color: C.green },
        { icon: "⚠️", text: "If the library fine was NOT in any document, the AI should say 'I don't know' instead of guessing.", color: C.amber },
      ].map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: `${r.color}10`, border: `1.5px solid ${r.color}33`, borderRadius: 8, padding: "8px 12px", marginBottom: 6 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>{r.icon}</span>
          <span style={{ color: C.ink, fontSize: 13 }}>{r.text}</span>
        </div>
      ))}
      <Box color={C.rose} icon="🛡️" title="The Grounding Guarantee">
        The whole point of RAG is that answers are <strong>grounded in retrieved evidence</strong>. The AI is not generating from memory — it is reading specific passages and summarising them. This makes RAG far more reliable than a plain LLM for domain-specific questions.
      </Box>
    </div>
  );
}

function PageSummary() {
  const phase1 = [
    { icon: "📥", label: "Load Docs", color: C.orange, n: 1 },
    { icon: "✂️", label: "Chunking", color: C.teal, n: 2 },
    { icon: "🔢", label: "Embedding", color: C.blue, n: 3 },
    { icon: "🗄️", label: "Vector DB", color: C.rose, n: 4 },
  ];
  const phase2 = [
    { icon: "❓", label: "User Question", color: C.amber, n: 5 },
    { icon: "🔍", label: "Search", color: C.teal, n: 6 },
    { icon: "📋", label: "Build Prompt", color: C.rose, n: 7 },
    { icon: "🤖", label: "LLM Answer", color: C.green, n: 8 },
  ];

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 42 }}>🎓</div>
        <h2 style={{ margin: "4px 0", fontSize: 22, fontWeight: 900, color: C.ink }}>Full Picture — Naive RAG A to Z</h2>
      </div>

      <div style={{ background: `${C.orange}12`, border: `1.5px solid ${C.orange}44`, borderRadius: 10, padding: 12, marginBottom: 10 }}>
        <div style={{ color: C.orange, fontWeight: 800, fontSize: 13, marginBottom: 8 }}>PHASE 1: INDEXING — runs once, offline</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {phase1.map(s => (
            <div key={s.n} style={{ background: C.card, border: `1.5px solid ${s.color}44`, borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 700, marginTop: 4 }}>{s.n}. {s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: `${C.teal}12`, border: `1.5px solid ${C.teal}44`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
        <div style={{ color: C.teal, fontWeight: 800, fontSize: 13, marginBottom: 8 }}>PHASE 2: QUERYING — runs on every user question</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {phase2.map(s => (
            <div key={s.n} style={{ background: C.card, border: `1.5px solid ${s.color}44`, borderRadius: 8, padding: 10, textAlign: "center" }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 700, marginTop: 4 }}>{s.n}. {s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontWeight: 800, color: C.ink, marginBottom: 8, fontSize: 14 }}>Naive RAG is great for:</div>
      {["Simple Q&A over a fixed document set", "FAQs — school rules, HR policies, product manuals", "Fast to build — works in under 50 lines of Python", "Good baseline before adding advanced features"].map((t, i) => (
        <div key={i} style={{ background: `${C.green}10`, border: `1.5px solid ${C.green}33`, borderRadius: 6, padding: "6px 12px", marginBottom: 5, fontSize: 13, color: C.ink }}>✅ {t}</div>
      ))}

      <div style={{ fontWeight: 800, color: C.ink, marginBottom: 8, marginTop: 14, fontSize: 14 }}>Naive RAG struggles with:</div>
      {["No query optimization — searches exactly as typed, no rephrasing", "Fixed chunking — may split important context across two chunks", "No re-ranking — highest similarity score is not always the most useful answer", "No memory — forgets previous questions in the same conversation", "Misses exact keywords like policy IDs — needs BM25 hybrid search"].map((t, i) => (
        <div key={i} style={{ background: `${C.rose}10`, border: `1.5px solid ${C.rose}33`, borderRadius: 6, padding: "6px 12px", marginBottom: 5, fontSize: 13, color: C.ink }}>❌ {t}</div>
      ))}

      <Box color={C.blue} icon="🚀" title="What is next: Advanced RAG">
        Naive RAG is the foundation. Advanced RAG (the production stack) adds HyDE for better queries, Hybrid Search (BM25 + dense vectors), and Re-ranking. Each addition fixes one of the weaknesses above.
      </Box>
    </div>
  );
}

const PAGES = [
  { id: "intro", icon: "🏫", label: "Introduction", color: C.ink, Component: PageIntro },
  { id: "s1", icon: "📥", label: "Load Documents", color: C.orange, Component: PageLoadDocs },
  { id: "s2", icon: "✂️", label: "Chunking", color: C.teal, Component: PageChunking },
  { id: "s3", icon: "🔢", label: "Embedding", color: C.blue, Component: PageEmbedding },
  { id: "s4", icon: "🗄️", label: "Vector Database", color: C.rose, Component: PageVectorDB },
  { id: "s5", icon: "❓", label: "User Question", color: C.amber, Component: PageQuestion },
  { id: "s6", icon: "🔍", label: "Similarity Search", color: C.teal, Component: PageSearch },
  { id: "s7", icon: "📋", label: "Build Prompt", color: C.rose, Component: PagePrompt },
  { id: "s8", icon: "🤖", label: "LLM Answers", color: C.green, Component: PageAnswer },
  { id: "summary", icon: "🎓", label: "Full Picture", color: C.ink, Component: PageSummary },
];

export default function NaiveRAG() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [visited, setVisited] = useState(new Set([0]));

  const goTo = (i) => {
    setActiveIdx(i);
    setVisited(v => new Set([...v, i]));
  };

  const page = PAGES[activeIdx];
  const PageContent = page.Component;

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "Georgia, serif", color: C.ink, overflow: "hidden" }}>
      <div style={{ width: 215, background: C.card, borderRight: `1.5px solid ${C.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "16px 14px 12px", borderBottom: `1.5px solid ${C.border}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: C.muted, textTransform: "uppercase" }}>Interactive Guide</div>
          <div style={{ fontSize: 16, fontWeight: 900, color: C.ink, marginTop: 4, lineHeight: 1.3 }}>Naive RAG<br />Simply Explained</div>
          <div style={{ marginTop: 10, background: C.faint, borderRadius: 4, height: 5, overflow: "hidden" }}>
            <div style={{ background: C.orange, height: "100%", borderRadius: 4, transition: "width 0.5s", width: `${(visited.size / PAGES.length) * 100}%` }} />
          </div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{visited.size}/{PAGES.length} explored</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {PAGES.map((p, i) => {
            const isActive = activeIdx === i;
            const isDone = visited.has(i) && !isActive;
            return (
              <div key={p.id} onClick={() => goTo(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: isActive ? `${p.color}18` : isDone ? `${p.color}08` : C.card, border: `1.5px solid ${isActive ? p.color : isDone ? `${p.color}44` : C.border}`, borderRadius: 8, cursor: "pointer", marginBottom: 4, transition: "all 0.15s", opacity: isDone || isActive ? 1 : 0.55 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: isActive ? p.color : isDone ? `${p.color}22` : C.faint, border: `1.5px solid ${isActive || isDone ? p.color : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, color: isActive ? "#fff" : p.color }}>
                  {isDone ? "✓" : p.icon}
                </div>
                <div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>{i === 0 ? "INTRO" : i === 9 ? "SUMMARY" : `STEP ${i}`}</div>
                  <div style={{ fontSize: 12, fontWeight: isActive ? 700 : 600, color: isActive ? p.color : C.ink }}>{p.label}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: 10, borderTop: `1.5px solid ${C.border}`, fontSize: 10, color: C.muted, lineHeight: 1.8 }}>
          <span style={{ color: C.orange }}>●</span> Steps 1-4: Indexing (once)<br />
          <span style={{ color: C.teal }}>●</span> Steps 5-8: Querying (live)
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "10px 22px", borderBottom: `1.5px solid ${C.border}`, background: C.card, display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>{page.icon}</span>
          <div>
            <div style={{ color: page.color, fontWeight: 800, fontSize: 15 }}>
              {activeIdx > 0 && activeIdx < 9 ? `Step ${activeIdx}: ` : ""}{page.label}
            </div>
            <div style={{ color: C.muted, fontSize: 11 }}>Use case: School Library Chatbot</div>
          </div>
          <div style={{ marginLeft: "auto", background: C.faint, borderRadius: 20, padding: "3px 12px", fontSize: 11, color: C.muted }}>{activeIdx + 1} / {PAGES.length}</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 26px", maxWidth: 720 }}>
          <PageContent />
          <div style={{ display: "flex", gap: 10, marginTop: 28, paddingTop: 16, borderTop: `1.5px solid ${C.border}` }}>
            {activeIdx > 0 && (
              <button onClick={() => goTo(activeIdx - 1)} style={{ background: C.card, border: `1.5px solid ${C.border}`, color: C.muted, padding: "9px 20px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontFamily: "Georgia, serif" }}>
                Previous
              </button>
            )}
            {activeIdx < PAGES.length - 1 && (
              <button onClick={() => goTo(activeIdx + 1)} style={{ background: page.color, border: "none", color: "#fff", padding: "9px 22px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800, marginLeft: "auto", fontFamily: "Georgia, serif" }}>
                Next Step
              </button>
            )}
            {activeIdx === PAGES.length - 1 && (
              <button onClick={() => { goTo(0); setVisited(new Set(PAGES.map((_, i) => i))); }} style={{ background: C.green, border: "none", color: "#fff", padding: "9px 22px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 800, marginLeft: "auto", fontFamily: "Georgia, serif" }}>
                Done! Restart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
