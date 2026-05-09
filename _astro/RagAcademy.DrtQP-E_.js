import{j as e}from"./jsx-runtime.u17CrQMm.js";import{r as x}from"./index.DrBtkhmp.js";const c=[{id:0,emoji:"🧠",title:"What is RAG?",subtitle:"Foundations & Mental Model",color:"#00d4ff",content:"foundations"},{id:1,emoji:"✂️",title:"Chunking Strategies",subtitle:"How to split your documents",color:"#00ff9d",content:"chunking"},{id:2,emoji:"🔢",title:"Embeddings & Vector Search",subtitle:"Turning words into numbers",color:"#ffb700",content:"embeddings"},{id:3,emoji:"🔀",title:"Hybrid Search + Re-ranking",subtitle:"Best of keyword + semantic",color:"#ff6b9d",content:"hybrid"},{id:4,emoji:"🚀",title:"Advanced RAG",subtitle:"HyDE, Query Expansion, Parent-Child",color:"#c77dff",content:"advanced"},{id:5,emoji:"🤖",title:"Agentic / Multi-hop RAG",subtitle:"RAG that thinks and reasons",color:"#ff9a3c",content:"agentic"},{id:6,emoji:"📊",title:"Evaluation & Metrics",subtitle:"How to know if RAG is working",color:"#4ade80",content:"evaluation"}],m=({code:t,lang:o="python"})=>{const[r,i]=x.useState(!1);return e.jsxs("div",{style:{background:"#0d1117",borderRadius:10,border:"1px solid #30363d",marginTop:16,overflow:"hidden"},children:[e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 16px",background:"#161b22",borderBottom:"1px solid #30363d"},children:[e.jsx("span",{style:{color:"#8b949e",fontSize:12,fontFamily:"monospace"},children:o}),e.jsx("button",{onClick:()=>{navigator.clipboard?.writeText(t),i(!0),setTimeout(()=>i(!1),2e3)},style:{background:"none",border:"1px solid #30363d",color:"#8b949e",padding:"2px 10px",borderRadius:6,cursor:"pointer",fontSize:11},children:r?"✓ copied":"copy"})]}),e.jsx("pre",{style:{margin:0,padding:"16px",overflowX:"auto",fontSize:13,lineHeight:1.7,color:"#e6edf3",fontFamily:"'Fira Code', 'Courier New', monospace"},children:t})]})},d=({type:t="info",children:o})=>{const i={info:{bg:"#0c2032",border:"#00d4ff",icon:"💡"},analogy:{bg:"#1a2a0f",border:"#00ff9d",icon:"🎯"},warning:{bg:"#2a1a0f",border:"#ffb700",icon:"⚠️"},key:{bg:"#1a0f2a",border:"#c77dff",icon:"🔑"}}[t];return e.jsxs("div",{style:{background:i.bg,border:`1px solid ${i.border}`,borderLeft:`4px solid ${i.border}`,borderRadius:8,padding:"12px 16px",margin:"16px 0",display:"flex",gap:10},children:[e.jsx("span",{style:{fontSize:18,flexShrink:0},children:i.icon}),e.jsx("div",{style:{color:"#c9d1d9",fontSize:14,lineHeight:1.7},children:o})]})},j=({children:t,color:o})=>e.jsx("span",{style:{background:`${o}22`,border:`1px solid ${o}55`,color:o,padding:"2px 10px",borderRadius:20,fontSize:12,fontWeight:600,display:"inline-block",margin:"2px 4px"},children:t}),S=()=>{const t=[{icon:"📄",label:"Documents",sub:"PDFs, Web, DB"},{icon:"✂️",label:"Chunking",sub:"Split text"},{icon:"🔢",label:"Embed",sub:"To vectors"},{icon:"🗄️",label:"Vector DB",sub:"Store & index"}],o=[{icon:"❓",label:"User Query",sub:"Question"},{icon:"🔢",label:"Embed Query",sub:"Same model"},{icon:"🔍",label:"Search",sub:"Top-K chunks"},{icon:"💬",label:"LLM + Context",sub:"Final answer"}];return e.jsxs("div",{style:{background:"#0d1117",border:"1px solid #21262d",borderRadius:12,padding:24,marginTop:16},children:[e.jsx("div",{style:{color:"#8b949e",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:16},children:"INDEXING PIPELINE (offline)"}),e.jsx("div",{style:{display:"flex",alignItems:"center",flexWrap:"wrap",gap:4,marginBottom:24},children:t.map((r,i)=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:4},children:[e.jsxs("div",{style:{textAlign:"center",background:"#161b22",border:"1px solid #30363d",borderRadius:8,padding:"10px 16px",minWidth:90},children:[e.jsx("div",{style:{fontSize:24},children:r.icon}),e.jsx("div",{style:{color:"#e6edf3",fontSize:13,fontWeight:600},children:r.label}),e.jsx("div",{style:{color:"#8b949e",fontSize:11},children:r.sub})]}),i<t.length-1&&e.jsx("span",{style:{color:"#00d4ff",fontSize:20},children:"→"})]},i))}),e.jsx("div",{style:{color:"#8b949e",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:16},children:"QUERY PIPELINE (online)"}),e.jsx("div",{style:{display:"flex",alignItems:"center",flexWrap:"wrap",gap:4},children:o.map((r,i)=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:4},children:[e.jsxs("div",{style:{textAlign:"center",background:"#161b22",border:`1px solid ${i===3?"#00d4ff":"#30363d"}`,borderRadius:8,padding:"10px 16px",minWidth:90},children:[e.jsx("div",{style:{fontSize:24},children:r.icon}),e.jsx("div",{style:{color:"#e6edf3",fontSize:13,fontWeight:600},children:r.label}),e.jsx("div",{style:{color:"#8b949e",fontSize:11},children:r.sub})]}),i<o.length-1&&e.jsx("span",{style:{color:"#ff6b9d",fontSize:20},children:"→"})]},i))})]})},w=()=>{const t=[{name:"Fixed-size",desc:"Split every N tokens/chars. Simple, but cuts mid-sentence.",color:"#ff6b6b",risk:"HIGH fragmentation"},{name:"Sentence-based",desc:"Split on sentence boundaries (. ! ?). Preserves grammar units.",color:"#ffb700",risk:"LOW fragmentation"},{name:"Paragraph-based",desc:"Split on double newlines. Best for structured docs.",color:"#00ff9d",risk:"NATURAL units"},{name:"Semantic / Topic",desc:"Embed sentences, detect topic shifts, split there.",color:"#00d4ff",risk:"HIGHEST quality"},{name:"Hierarchical",desc:"Parent chunk (big) + child chunks (small). Retrieve small, use big.",color:"#c77dff",risk:"BEST of both"}];return e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:10,marginTop:16},children:t.map((o,r)=>e.jsxs("div",{style:{background:"#0d1117",border:`1px solid ${o.color}44`,borderLeft:`4px solid ${o.color}`,borderRadius:8,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8},children:[e.jsxs("div",{children:[e.jsxs("div",{style:{color:o.color,fontWeight:700,fontSize:14},children:[r+1,". ",o.name]}),e.jsx("div",{style:{color:"#8b949e",fontSize:13,marginTop:2},children:o.desc})]}),e.jsx(j,{color:o.color,children:o.risk})]},r))})},_=()=>e.jsxs("div",{style:{background:"#0d1117",border:"1px solid #21262d",borderRadius:12,padding:20,marginTop:16},children:[e.jsx("div",{style:{color:"#8b949e",fontSize:11,fontWeight:700,letterSpacing:2,marginBottom:12,textTransform:"uppercase"},children:"Words → Vectors → Similarity Space"}),e.jsxs("div",{style:{display:"flex",gap:20,flexWrap:"wrap"},children:[e.jsxs("div",{style:{flex:1,minWidth:220},children:[[{word:'"car accident"',vec:"[0.82, 0.31, 0.67, ...]",color:"#ff6b9d"},{word:'"vehicle crash"',vec:"[0.79, 0.28, 0.71, ...]",color:"#ff6b9d"},{word:'"premium calculation"',vec:"[0.12, 0.89, 0.22, ...]",color:"#00d4ff"}].map((t,o)=>e.jsxs("div",{style:{marginBottom:10,display:"flex",gap:8,alignItems:"center"},children:[e.jsx("div",{style:{background:`${t.color}22`,border:`1px solid ${t.color}55`,color:t.color,padding:"4px 10px",borderRadius:6,fontSize:13,fontFamily:"monospace",whiteSpace:"nowrap"},children:t.word}),e.jsx("span",{style:{color:"#444"},children:"→"}),e.jsx("div",{style:{color:"#8b949e",fontSize:12,fontFamily:"monospace"},children:t.vec})]},o)),e.jsxs("div",{style:{color:"#8b949e",fontSize:12,marginTop:8,fontStyle:"italic"},children:['"car accident" ≈ "vehicle crash" → high cosine similarity',e.jsx("br",{}),'"car accident" ≠ "premium calculation" → low similarity']})]}),e.jsx("div",{style:{flex:1,minWidth:200},children:e.jsxs("svg",{viewBox:"0 0 200 180",style:{width:"100%",maxWidth:220},children:[e.jsx("rect",{width:"200",height:"180",fill:"#0d1117"}),e.jsx("line",{x1:"10",y1:"170",x2:"190",y2:"170",stroke:"#30363d",strokeWidth:"1"}),e.jsx("line",{x1:"10",y1:"10",x2:"10",y2:"170",stroke:"#30363d",strokeWidth:"1"}),e.jsx("text",{x:"100",y:"178",fill:"#8b949e",fontSize:"9",textAnchor:"middle",children:"dim 1"}),e.jsx("text",{x:"5",y:"90",fill:"#8b949e",fontSize:"9",textAnchor:"middle",transform:"rotate(-90,5,90)",children:"dim 2"}),e.jsx("circle",{cx:"80",cy:"60",r:"7",fill:"#ff6b9d",opacity:"0.9"}),e.jsx("text",{x:"90",y:"57",fill:"#ff6b9d",fontSize:"9",children:"car accident"}),e.jsx("circle",{cx:"95",cy:"75",r:"7",fill:"#ff6b9d",opacity:"0.7"}),e.jsx("text",{x:"105",y:"72",fill:"#ff6b9d",fontSize:"9",children:"vehicle crash"}),e.jsx("line",{x1:"80",y1:"60",x2:"95",y2:"75",stroke:"#ff6b9d",strokeWidth:"1",strokeDasharray:"3"}),e.jsx("circle",{cx:"155",cy:"130",r:"7",fill:"#00d4ff",opacity:"0.9"}),e.jsx("text",{x:"118",y:"143",fill:"#00d4ff",fontSize:"9",children:"premium calc"}),e.jsx("circle",{cx:"140",cy:"145",r:"6",fill:"#00d4ff",opacity:"0.7"}),e.jsx("text",{x:"95",y:"110",fill:"#444",fontSize:"8",fontStyle:"italic",children:"far apart = different topics"})]})})]})]}),A=()=>e.jsxs("div",{style:{background:"#0d1117",border:"1px solid #21262d",borderRadius:12,padding:20,marginTop:16},children:[e.jsxs("div",{style:{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16},children:[e.jsxs("div",{style:{flex:1,minWidth:180,background:"#161b22",borderRadius:8,padding:14,border:"1px solid #ffb70044"},children:[e.jsx("div",{style:{color:"#ffb700",fontWeight:700,marginBottom:6},children:"🔤 BM25 (Keyword)"}),e.jsx("div",{style:{color:"#8b949e",fontSize:13},children:"Scores based on term frequency. Great for exact keywords, product codes, policy IDs."}),e.jsx(j,{color:"#ffb700",children:"Sparse"})]}),e.jsx("div",{style:{display:"flex",alignItems:"center",color:"#444",fontSize:24},children:"+"}),e.jsxs("div",{style:{flex:1,minWidth:180,background:"#161b22",borderRadius:8,padding:14,border:"1px solid #00d4ff44"},children:[e.jsx("div",{style:{color:"#00d4ff",fontWeight:700,marginBottom:6},children:"🔢 Dense (Semantic)"}),e.jsx("div",{style:{color:"#8b949e",fontSize:13},children:'Scores based on meaning. Finds "vehicle crash" when you search "car accident".'}),e.jsx(j,{color:"#00d4ff",children:"Dense"})]}),e.jsx("div",{style:{display:"flex",alignItems:"center",color:"#444",fontSize:24},children:"→"}),e.jsxs("div",{style:{flex:1,minWidth:180,background:"#161b22",borderRadius:8,padding:14,border:"1px solid #00ff9d44"},children:[e.jsx("div",{style:{color:"#00ff9d",fontWeight:700,marginBottom:6},children:"🏆 RRF Fusion"}),e.jsx("div",{style:{color:"#8b949e",fontSize:13},children:"Combines both ranked lists. Best chunks bubble up to the top."}),e.jsx(j,{color:"#00ff9d",children:"Hybrid"})]})]}),e.jsxs("div",{style:{background:"#161b22",borderRadius:8,padding:12,border:"1px solid #c77dff44"},children:[e.jsx("div",{style:{color:"#c77dff",fontWeight:700,marginBottom:6},children:"🎯 Re-ranking (Cross-Encoder)"}),e.jsx("div",{style:{color:"#8b949e",fontSize:13},children:"After retrieval, a cross-encoder model reads the FULL query + chunk pair and re-scores relevance. Slower but far more accurate. Usually applied to top 20 → returns top 5."})]})]}),T=()=>e.jsxs("div",{style:{background:"#0d1117",border:"1px solid #21262d",borderRadius:12,padding:20,marginTop:16},children:[e.jsx("div",{style:{color:"#8b949e",fontSize:11,fontWeight:700,letterSpacing:2,marginBottom:16,textTransform:"uppercase"},children:"Multi-hop ReAct Pattern"}),[{step:"THINK",text:'Query: "What is the max liability if a stolen car caused property damage under policy P-200?"',color:"#00d4ff"},{step:"ACT",text:"search('policy P-200 theft coverage') → retrieves 3 chunks about theft",color:"#ffb700"},{step:"OBSERVE",text:"Theft section found. But property damage limit not in these chunks.",color:"#8b949e"},{step:"THINK",text:"I need to also look for property damage clauses. Need second retrieval.",color:"#00d4ff"},{step:"ACT",text:"search('property damage liability limit P-200') → retrieves 2 new chunks",color:"#ffb700"},{step:"OBSERVE",text:"Found: max $50,000 property damage. Theft confirmed active.",color:"#8b949e"},{step:"ANSWER",text:"Max liability = $50,000. Policy P-200 covers property damage from theft.",color:"#00ff9d"}].map((t,o)=>e.jsxs("div",{style:{display:"flex",gap:12,marginBottom:8},children:[e.jsxs("div",{style:{color:t.color,fontSize:11,fontWeight:700,fontFamily:"monospace",minWidth:70,paddingTop:2},children:["[",t.step,"]"]}),e.jsx("div",{style:{color:"#c9d1d9",fontSize:13,lineHeight:1.6,borderLeft:`2px solid ${t.color}44`,paddingLeft:10},children:t.text})]},o))]}),p=({questions:t})=>{const[o,r]=x.useState({}),[i,h]=x.useState({});return e.jsxs("div",{style:{marginTop:24},children:[e.jsx("div",{style:{color:"#8b949e",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",marginBottom:12},children:"🧪 CHECKPOINT QUIZ"}),t.map((u,s)=>e.jsxs("div",{style:{background:"#0d1117",border:"1px solid #21262d",borderRadius:10,padding:16,marginBottom:12},children:[e.jsxs("div",{style:{color:"#e6edf3",fontSize:14,fontWeight:600,marginBottom:10},children:[s+1,". ",u.question]}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:6},children:u.options.map((a,n)=>{const l=o[s]===n,f=n===u.correct,g=i[s];let y="#161b22",b="#30363d",v="#c9d1d9";return l&&!g&&(y="#0c2032",b="#00d4ff",v="#00d4ff"),g&&f&&(y="#0f2a1a",b="#00ff9d",v="#00ff9d"),g&&l&&!f&&(y="#2a0f0f",b="#ff6b6b",v="#ff6b6b"),e.jsxs("div",{onClick:()=>!i[s]&&r(k=>({...k,[s]:n})),style:{background:y,border:`1px solid ${b}`,color:v,borderRadius:6,padding:"8px 12px",cursor:i[s]?"default":"pointer",fontSize:13,transition:"all 0.15s"},children:[a,g&&f&&" ✓",g&&l&&!f&&" ✗"]},n)})}),o[s]!==void 0&&!i[s]&&e.jsx("button",{onClick:()=>h(a=>({...a,[s]:!0})),style:{marginTop:10,background:"#21262d",border:"1px solid #30363d",color:"#8b949e",padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:12},children:"Check Answer"}),i[s]&&e.jsx("div",{style:{marginTop:8,color:"#8b949e",fontSize:12,fontStyle:"italic"},children:u.explanation})]},s))]})},R=()=>e.jsxs("div",{children:[e.jsx("h2",{style:{color:"#00d4ff",fontSize:22,fontWeight:700,margin:"0 0 8px"},children:"What is RAG?"}),e.jsx("p",{style:{color:"#8b949e",margin:"0 0 16px",lineHeight:1.7},children:"Retrieval-Augmented Generation — the most important LLM pattern you'll use in production."}),e.jsxs(d,{type:"analogy",children:[e.jsx("strong",{children:"The Open-Book Exam Analogy"}),e.jsx("br",{}),"Imagine two students taking an insurance exam. Student A has memorized everything — but their memory caps out at what they studied (knowledge cutoff). Student B gets to bring a library. Before answering, they look up the relevant pages, read them, then write the answer. ",e.jsx("strong",{children:"Student B is RAG."})]}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:20,marginBottom:8},children:"The Problem RAG Solves"}),e.jsx("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12},children:[{label:"❌ Without RAG",items:["Knowledge cutoff (stale data)","Hallucinations (makes things up)","Can't know YOUR documents","No source citations"],color:"#ff6b6b"},{label:"✅ With RAG",items:["Always up-to-date documents","Grounded answers from real text","Works on private data","Citable, auditable responses"],color:"#00ff9d"}].map((t,o)=>e.jsxs("div",{style:{background:"#0d1117",border:`1px solid ${t.color}44`,borderRadius:8,padding:14},children:[e.jsx("div",{style:{color:t.color,fontWeight:700,marginBottom:8},children:t.label}),t.items.map((r,i)=>e.jsx("div",{style:{color:"#8b949e",fontSize:13,padding:"2px 0"},children:r},i))]},o))}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:20,marginBottom:4},children:"The Full RAG Pipeline"}),e.jsx(S,{}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:20,marginBottom:8},children:"The Two Phases in Plain English"}),e.jsxs("div",{style:{color:"#c9d1d9",fontSize:14,lineHeight:1.9},children:[e.jsxs("p",{children:[e.jsx("strong",{style:{color:"#00d4ff"},children:"Phase 1 — Indexing (done once, offline):"})," You take all your documents (insurance policies, FAQs, claim forms), chop them into small pieces (chunks), convert each piece into a list of numbers (embedding vector) that captures its meaning, and store everything in a vector database."]}),e.jsxs("p",{children:[e.jsx("strong",{style:{color:"#ff6b9d"},children:"Phase 2 — Querying (done every time a user asks something):"})," User's question → embed it → find the most similar chunks in the database → feed those chunks as context to the LLM → LLM answers using only the retrieved evidence."]})]}),e.jsx(m,{lang:"python",code:`# Simplest possible RAG in ~20 lines
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
# → "Claims must be filed within 30 days of incident."`}),e.jsx(p,{questions:[{question:"In RAG, what is the purpose of the 'embedding' step?",options:["Compress documents to save space","Convert text into numerical vectors that capture semantic meaning","Format documents as JSON","Encrypt documents before storage"],correct:1,explanation:"Embeddings convert text into dense numerical vectors. Similar meanings produce similar vectors, enabling semantic search."},{question:"What is a 'knowledge cutoff' problem that RAG solves?",options:["LLMs being too slow","LLMs only knowing data up to their training date, not your live documents","LLMs using too many tokens","LLMs not speaking multiple languages"],correct:1,explanation:"LLMs are trained on a snapshot of data. They don't know your private docs or anything after training. RAG injects fresh, real-time context at query time."}]})]}),P=()=>e.jsxs("div",{children:[e.jsx("h2",{style:{color:"#00ff9d",fontSize:22,fontWeight:700,margin:"0 0 8px"},children:"Chunking Strategies"}),e.jsx("p",{style:{color:"#8b949e",margin:"0 0 16px",lineHeight:1.7},children:"Garbage in, garbage out. How you split documents is the #1 factor affecting retrieval quality."}),e.jsxs(d,{type:"analogy",children:[e.jsx("strong",{children:"The Library Index Analogy"}),e.jsx("br",{}),"Imagine indexing a 500-page insurance manual. If your index points to the entire chapter, you'd return 50 pages for every query. If it points to paragraphs, you get exactly the right information. ",e.jsx("strong",{children:"Chunking = deciding the granularity of your index."})]}),e.jsxs(d,{type:"warning",children:[e.jsx("strong",{children:"The Goldilocks Problem:"}),' Chunks too small → lose context ("The limit is $50,000" — limit for WHAT?). Chunks too large → retrieve irrelevant content, waste LLM context window.']}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:20,marginBottom:4},children:"The 5 Strategies"}),e.jsx(w,{}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:20,marginBottom:8},children:"Hierarchical Chunking (Most Powerful)"}),e.jsx("div",{style:{background:"#0d1117",border:"1px solid #c77dff44",borderRadius:10,padding:16},children:e.jsxs("div",{style:{color:"#c9d1d9",fontSize:13,lineHeight:1.8},children:[e.jsx("span",{style:{color:"#c77dff",fontWeight:700},children:"Parent chunk (large)"}),': Full section — "Section 4: Theft Coverage. Policy P-200 provides theft protection for vehicles registered under the named insured..."',e.jsx("br",{}),e.jsx("span",{style:{color:"#00d4ff",fontWeight:700},children:"Child chunks (small)"}),': "Theft limit: $50,000" | "Deductible: $1,000" | "Coverage area: APAC region"',e.jsx("br",{}),e.jsx("br",{}),e.jsxs("span",{style:{color:"#8b949e"},children:["→ You ",e.jsx("strong",{children:"retrieve"})," by child (precise matching), but ",e.jsx("strong",{children:"return"})," the parent (full context to LLM). Best accuracy + context!"]})]})}),e.jsx(m,{lang:"python",code:`from llama_index.core.node_parser import (
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
nodes = hierarchical_parser.get_nodes_from_documents(documents)`}),e.jsxs(d,{type:"key",children:[e.jsx("strong",{children:"For a production system:"})," Structured documents have natural hierarchy (sections, clauses, definitions). Use ",e.jsx("strong",{children:"Hierarchical"})," chunking with sizes ~[1024, 256, 64]. Retrieve at 64-token child level, return 1024-token parent to LLM."]}),e.jsx(p,{questions:[{question:"You're chunking insurance policy documents. A chunk contains: 'The limit is $50,000.' — What's wrong with this chunk?",options:["It's too short","It lacks context — limit for WHAT? Vehicle theft? Medical? Property?","It contains a number","Nothing is wrong"],correct:1,explanation:"This is the 'lost context' problem. Small chunks lose the surrounding context that gives them meaning. Hierarchical chunking solves this."},{question:"In hierarchical chunking, what do you use for RETRIEVAL vs what you send to the LLM?",options:["Retrieve large parent, send small child to LLM","Retrieve small child, send large parent to LLM","Use the same chunk for both","Send all chunks to the LLM"],correct:1,explanation:"Small child chunks enable precise semantic matching. But the LLM needs full context, so you return the parent chunk. Best of both worlds!"}]})]}),z=()=>e.jsxs("div",{children:[e.jsx("h2",{style:{color:"#ffb700",fontSize:22,fontWeight:700,margin:"0 0 8px"},children:"Embeddings & Vector Search"}),e.jsx("p",{style:{color:"#8b949e",margin:"0 0 16px",lineHeight:1.7},children:"The mathematical engine behind semantic search."}),e.jsxs(d,{type:"analogy",children:[e.jsx("strong",{children:"The GPS Coordinate Analogy"}),e.jsx("br",{}),'GPS turns a place into coordinates (lat, long). You can find nearby places by comparing coordinates. Embeddings turn text into coordinates in "meaning space". Similar meanings → nearby coordinates → easy to find related content.']}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:20,marginBottom:4},children:"How Similarity Works"}),e.jsx(_,{}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:20,marginBottom:8},children:"Cosine Similarity — The Math (Simple Version)"}),e.jsx("div",{style:{background:"#0d1117",border:"1px solid #21262d",borderRadius:10,padding:16},children:e.jsxs("div",{style:{color:"#c9d1d9",fontSize:14,lineHeight:1.8},children:["You have two vectors: Query vector ",e.jsx("span",{style:{color:"#ff6b9d",fontFamily:"monospace"},children:"Q"})," and Chunk vector ",e.jsx("span",{style:{color:"#00d4ff",fontFamily:"monospace"},children:"C"}),".",e.jsx("br",{}),e.jsx("span",{style:{color:"#ffb700",fontFamily:"monospace"},children:"similarity = cos(θ) = (Q · C) / (|Q| × |C|)"}),e.jsx("br",{}),"Range: ",e.jsx("strong",{children:"1.0"})," = identical meaning, ",e.jsx("strong",{children:"0.0"})," = unrelated, ",e.jsx("strong",{children:"-1.0"})," = opposite meaning.",e.jsx("br",{}),e.jsx("span",{style:{color:"#8b949e",fontSize:12},children:`We ignore magnitude (length of vector) — only direction matters. That's what "cosine" means here.`})]})}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:20,marginBottom:8},children:"Embedding Model Comparison (MTEB 2025)"}),e.jsxs("div",{style:{overflowX:"auto"},children:[e.jsxs("table",{style:{width:"100%",borderCollapse:"collapse",fontSize:13},children:[e.jsx("thead",{children:e.jsx("tr",{style:{background:"#161b22"},children:["Model","Dims","MTEB","Size","Best For"].map(t=>e.jsx("th",{style:{padding:"8px 12px",textAlign:"left",color:"#8b949e",fontWeight:600,border:"1px solid #21262d"},children:t},t))})}),e.jsx("tbody",{children:[["Gemini-embedding-exp (Google)","3072","73.2","API","Google Cloud stacks; highest API accuracy Apr 2026"],["NV-Embed-v2 (NVIDIA)","4096","72.3","7B","Highest OSS accuracy; needs GPU with 16GB VRAM"],["GTE-Qwen2-7B (Alibaba)","3584","72.1","7B","Open-source SoTA; strong multilingual + English"],["Stella-en-1.5B-v5","1024","71.3","1.5B","Best efficiency/quality ratio; CPU-feasible"],["voyage-3 (Voyage AI)","1024","67.1","API","Best for Claude/Anthropic stacks; low latency"],["jina-embeddings-v3","1024","65.5","570M","8192 token context; multilingual; late chunking"],["text-embedding-3-large (OpenAI)","3072","64.6","API","Best for OpenAI stacks; Matryoshka dims"],["BAAI/bge-m3","1024","68.2","568M","Multilingual dense+sparse hybrid; 8192 ctx"],["intfloat/e5-mistral-7b","4096","66.6","7B","Instruction-tuned; needs 'Query:' prefix"],["all-MiniLM-L6-v2","384","41.9","22M","CPU-fast only; use for prototypes/edge"]].map((t,o)=>e.jsx("tr",{style:{background:o%2===0?"#0d1117":"#0a0e13"},children:t.map((r,i)=>e.jsx("td",{style:{padding:"8px 12px",color:i===0?"#00d4ff":i===2?"#4ade80":"#c9d1d9",border:"1px solid #21262d",fontFamily:i===0?"monospace":"inherit"},children:r},i))},o))})]}),e.jsx("div",{style:{color:"#475569",fontSize:11,marginTop:6},children:"MTEB = Massive Text Embedding Benchmark (MMTEB) average retrieval score. Data: April 2026 leaderboard. Benchmarks vary by task; check MTEB Leaderboard for your specific task."})]}),e.jsx(m,{lang:"python",code:`import chromadb
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
# → Score: 0.947 | Source: P-200 | Policy P-200 theft limit is $50,000...`}),e.jsx(p,{questions:[{question:"What does a cosine similarity of 0.95 between a query and a chunk mean?",options:["The chunk is 95% of the query's length","The chunk and query have very similar semantic meaning","The chunk appeared 0.95 times in the document","95% of the words match exactly"],correct:1,explanation:"High cosine similarity (close to 1.0) means the vectors point in nearly the same direction — the texts have very similar meanings."},{question:"Why can't you use the same embedding model for indexing and a different one for querying?",options:["It would be too slow","Each model creates its own vector space — mixing them is like mixing GPS systems","It would use too much memory","Embedding models can only run once"],correct:1,explanation:"Each embedding model creates its own dimensional space. 'car accident' in Model A produces different coordinates than in Model B. You MUST use the same model for both."}]})]}),B=()=>e.jsxs("div",{children:[e.jsx("h2",{style:{color:"#ff6b9d",fontSize:22,fontWeight:700,margin:"0 0 8px"},children:"Hybrid Search + Re-ranking"}),e.jsx("p",{style:{color:"#8b949e",margin:"0 0 16px",lineHeight:1.7},children:"How production RAG systems hit 90%+ retrieval accuracy."}),e.jsxs(d,{type:"analogy",children:[e.jsx("strong",{children:"The Detective Analogy"}),e.jsx("br",{}),'A junior detective (BM25) finds everyone in the building who used the word "gun". A senior detective (dense embedding) finds everyone acting suspicious. A chief detective (re-ranker) looks each suspect in the eye and decides who actually did it. ',e.jsx("strong",{children:"You need all three."})]}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:20,marginBottom:4},children:"The Pipeline"}),e.jsx(A,{}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:20,marginBottom:8},children:"Why BM25 Still Matters"}),e.jsxs("div",{style:{color:"#c9d1d9",fontSize:14,lineHeight:1.8},children:["Dense search misses exact matches. If a user searches ",e.jsx("code",{style:{background:"#21262d",padding:"1px 6px",borderRadius:4,color:"#ffb700"},children:'"clause 4.2.1(b)"'}),", no embedding model will reliably find it — but BM25 will. For insurance (policy IDs, clause references, medical codes), BM25 is critical."]}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:20,marginBottom:8},children:"Reciprocal Rank Fusion (RRF)"}),e.jsx("div",{style:{background:"#0d1117",border:"1px solid #21262d",borderRadius:10,padding:16},children:e.jsxs("div",{style:{color:"#c9d1d9",fontSize:13,lineHeight:1.8},children:["For each chunk, from each retriever: ",e.jsx("span",{style:{color:"#ffb700",fontFamily:"monospace"},children:"score = 1 / (rank + k)"})," where k=60 typically.",e.jsx("br",{}),"Final score = sum of scores from all retrievers. Chunks that rank well in BOTH retrievers win."]})}),e.jsx(m,{lang:"python",code:`from llama_index.core.retrievers import QueryFusionRetriever
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

response = query_engine.query("What is the theft limit for policy P-200?")`}),e.jsx(p,{questions:[{question:"A user searches for 'ICD-10 code J06.9'. Which retriever will find it reliably?",options:["Dense embedding search","BM25 keyword search","Both equally","Neither"],correct:1,explanation:"Exact codes, policy IDs, and specific terminology are BM25's strength. Embedding models may not reliably encode exact alphanumeric codes."},{question:"You have 100 chunks retrieved. The re-ranker takes the top 20 and returns 5. What does the re-ranker use to score?",options:["Only the chunk, not the query","Vector similarity from the embedding model","A cross-encoder that reads query + chunk together","TF-IDF score"],correct:2,explanation:"Cross-encoders read the full (query, document) pair jointly, giving much better relevance scores than bi-encoders. They're slower but far more accurate."}]})]}),W=()=>e.jsxs("div",{children:[e.jsx("h2",{style:{color:"#c77dff",fontSize:22,fontWeight:700,margin:"0 0 8px"},children:"Advanced RAG Techniques"}),e.jsx("p",{style:{color:"#8b949e",margin:"0 0 16px",lineHeight:1.7},children:"HyDE, Query Decomposition, and Parent-Child retrieval."}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:8,marginBottom:8},children:"1. HyDE — Hypothetical Document Embeddings"}),e.jsxs(d,{type:"analogy",children:[e.jsx("strong",{children:"The Fake Answer Trick"}),e.jsx("br",{}),'Queries and documents live in different "embedding zones". A question sounds different from its answer. HyDE says: ',e.jsx("em",{children:`"Let's generate a fake answer, embed THAT, and search with the answer's vector."`})," Answer-shaped text finds answer-shaped chunks better."]}),e.jsx("div",{style:{background:"#0d1117",border:"1px solid #c77dff44",borderRadius:10,padding:14,marginTop:8},children:e.jsxs("div",{style:{color:"#c9d1d9",fontSize:13,lineHeight:1.8},children:[e.jsx("span",{style:{color:"#8b949e"},children:"User asks:"})," ",e.jsx("span",{style:{color:"#00d4ff"},children:`"What's covered under P-200 for natural disasters?"`}),e.jsx("br",{}),e.jsx("span",{style:{color:"#8b949e"},children:"LLM generates fake answer:"})," ",e.jsx("span",{style:{color:"#c77dff"},children:'"Policy P-200 provides coverage for natural disasters including floods and earthquakes up to $X..."'}),e.jsx("br",{}),e.jsx("span",{style:{color:"#8b949e"},children:"→ Embed the FAKE answer and search. Finds real answer chunks much better!"})]})}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:20,marginBottom:8},children:"2. Query Decomposition"}),e.jsx("div",{style:{background:"#0d1117",border:"1px solid #21262d",borderRadius:10,padding:14},children:e.jsxs("div",{style:{color:"#c9d1d9",fontSize:13,lineHeight:1.8},children:[e.jsx("span",{style:{color:"#ffb700",fontWeight:600},children:"Complex query:"}),' "Compare theft coverage and flood coverage under Policy P-200 and P-300"',e.jsx("br",{}),e.jsx("span",{style:{color:"#00ff9d",fontWeight:600},children:"Decomposed into 4 sub-queries:"}),e.jsx("br",{}),'  → "P-200 theft coverage" | "P-300 theft coverage"',e.jsx("br",{}),'  → "P-200 flood coverage" | "P-300 flood coverage"',e.jsx("br",{}),e.jsx("span",{style:{color:"#8b949e"},children:"Each sub-query retrieves independently → results merged → LLM synthesizes the comparison."})]})}),e.jsx(m,{lang:"python",code:`# HyDE implementation
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
)`}),e.jsx(p,{questions:[{question:"Why does HyDE work? What's the core insight?",options:["It's faster than regular search","Answer-shaped text finds answer-shaped chunks better than question-shaped text","It reduces token usage","It avoids the vector database entirely"],correct:1,explanation:"Queries and documents occupy different regions in embedding space. Generating a hypothetical answer bridges this gap — the fake answer 'sounds like' the real answer, finding it more precisely."}]})]}),C=()=>e.jsxs("div",{children:[e.jsx("h2",{style:{color:"#ff9a3c",fontSize:22,fontWeight:700,margin:"0 0 8px"},children:"Agentic / Multi-hop RAG"}),e.jsx("p",{style:{color:"#8b949e",margin:"0 0 16px",lineHeight:1.7},children:"When one retrieval isn't enough — RAG that thinks, loops, and reasons."}),e.jsxs(d,{type:"analogy",children:[e.jsx("strong",{children:"The Research Analyst Analogy"}),e.jsx("br",{}),"Basic RAG is a librarian handing you the first book that matches. Agentic RAG is a research analyst who reads that book, realizes they need another source, looks that up too, cross-references everything, then writes a report. ",e.jsx("strong",{children:"Multiple retrievals, guided by reasoning."})]}),e.jsx("h3",{style:{color:"#e6edf3",marginTop:16,marginBottom:4},children:"Single-hop vs Multi-hop"}),e.jsxs("div",{style:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16},children:[e.jsxs("div",{style:{background:"#0d1117",border:"1px solid #30363d",borderRadius:8,padding:12},children:[e.jsx("div",{style:{color:"#8b949e",fontWeight:700,marginBottom:6},children:"Single-hop RAG"}),e.jsxs("div",{style:{color:"#c9d1d9",fontSize:13},children:["Query → retrieve once → answer.",e.jsx("br",{}),"Works when the answer is in one place."]})]}),e.jsxs("div",{style:{background:"#0d1117",border:"1px solid #ff9a3c44",borderRadius:8,padding:12},children:[e.jsx("div",{style:{color:"#ff9a3c",fontWeight:700,marginBottom:6},children:"Multi-hop RAG"}),e.jsxs("div",{style:{color:"#c9d1d9",fontSize:13},children:["Query → retrieve → think → retrieve again → synthesize.",e.jsx("br",{}),"When the answer spans multiple documents/concepts."]})]})]}),e.jsx("h3",{style:{color:"#e6edf3",marginBottom:4},children:"ReAct Pattern in Action"}),e.jsx(T,{}),e.jsx(m,{lang:"python",code:`from llama_index.core.agent import ReActAgent
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
print(response)`}),e.jsxs(d,{type:"key",children:[e.jsx("strong",{children:"Agentic RAG Patterns to know:"})," ReAct (Reason + Act), FLARE (retrieve when uncertain), Self-RAG (model decides whether to retrieve at all), Corrective RAG (validates retrieved docs before using them)."]}),e.jsx(p,{questions:[{question:"A user asks: 'What's the total payout if 3 different policy holders all file the same flood claim?' — Why does this NEED multi-hop RAG?",options:["It's too long a question","The answer requires looking up 3 different policy documents and doing arithmetic — multiple retrieval steps","Flood claims are too complex","Single-hop RAG can handle this easily"],correct:1,explanation:"This question requires: (1) retrieve policy 1's flood limit, (2) retrieve policy 2's flood limit, (3) retrieve policy 3's flood limit, (4) sum them. That's at least 3 retrieval hops + a calculation."}]})]}),E=()=>e.jsxs("div",{children:[e.jsx("h2",{style:{color:"#4ade80",fontSize:22,fontWeight:700,margin:"0 0 8px"},children:"Evaluation & Metrics"}),e.jsx("p",{style:{color:"#8b949e",margin:"0 0 16px",lineHeight:1.7},children:"If you can't measure it, you can't improve it. The RAG evaluation framework."}),e.jsx("h3",{style:{color:"#e6edf3",marginBottom:8},children:"The 3 Core RAG Metrics (RAGAS)"}),[{name:"Faithfulness",desc:"Is the generated answer supported by the retrieved context? Tests for hallucination.",formula:"# claims in answer supported by context / # total claims",color:"#00d4ff",bad:"LLM makes up extra details not in context"},{name:"Answer Relevance",desc:"Does the answer actually address the question asked?",formula:"similarity(generated questions from answer, original question)",color:"#ff6b9d",bad:"Answer is factual but off-topic"},{name:"Context Recall",desc:"Did we retrieve all the chunks needed to answer the question?",formula:"# relevant chunks retrieved / # total relevant chunks",color:"#ffb700",bad:"Key information was missing from retrieved chunks"},{name:"Context Precision",desc:"Of the retrieved chunks, how many were actually useful?",formula:"# relevant chunks retrieved / # total chunks retrieved",color:"#00ff9d",bad:"Retrieved too many irrelevant chunks"}].map((t,o)=>e.jsx("div",{style:{background:"#0d1117",border:`1px solid ${t.color}44`,borderRadius:8,padding:14,marginBottom:10},children:e.jsxs("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8},children:[e.jsxs("div",{children:[e.jsx("div",{style:{color:t.color,fontWeight:700},children:t.name}),e.jsx("div",{style:{color:"#c9d1d9",fontSize:13,marginTop:4},children:t.desc}),e.jsx("div",{style:{color:"#8b949e",fontSize:12,fontFamily:"monospace",marginTop:4},children:t.formula})]}),e.jsxs("div",{style:{background:"#2a0f0f",border:"1px solid #ff6b6b44",borderRadius:6,padding:"4px 10px",fontSize:11,color:"#ff6b6b"},children:["Fails when: ",t.bad]})]})},o)),e.jsx(m,{lang:"python",code:`from ragas import evaluate
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
# Production target: ~0.94 retrieval accuracy`}),e.jsxs(d,{type:"key",children:[e.jsx("strong",{children:"Debugging low scores:"})," Low faithfulness → LLM hallucinating, tighten system prompt. Low context recall → chunking too fine, or wrong embedding model. Low context precision → reranker threshold too low, or k too high."]})]}),q={foundations:R,chunking:P,embeddings:z,hybrid:B,advanced:W,agentic:C,evaluation:E};function L(){const[t,o]=x.useState(0),[r,i]=x.useState(new Set),h=c[t],u=q[h.content],s=a=>{const n=t+a;n>=0&&n<c.length&&(i(l=>new Set([...l,t])),o(n))};return e.jsxs("div",{style:{display:"flex",minHeight:500,maxHeight:"80vh",background:"#0d1117",fontFamily:"'Segoe UI', system-ui, sans-serif",color:"#c9d1d9",overflow:"hidden",borderRadius:8},children:[e.jsxs("div",{style:{width:260,background:"#0d1117",borderRight:"1px solid #21262d",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"},children:[e.jsxs("div",{style:{padding:"20px 16px",borderBottom:"1px solid #21262d"},children:[e.jsx("div",{style:{color:"#ffffff",fontWeight:800,fontSize:16,letterSpacing:-.5},children:"RAG Academy"}),e.jsx("div",{style:{color:"#8b949e",fontSize:12,marginTop:2},children:"From Scratch → Production"}),e.jsx("div",{style:{marginTop:10,background:"#161b22",borderRadius:4,height:4,overflow:"hidden"},children:e.jsx("div",{style:{background:h.color,height:"100%",width:`${r.size/c.length*100}%`,transition:"width 0.5s",borderRadius:4}})}),e.jsxs("div",{style:{color:"#8b949e",fontSize:11,marginTop:4},children:[r.size,"/",c.length," modules completed"]})]}),e.jsx("div",{style:{flex:1,padding:"8px 8px"},children:c.map((a,n)=>{const l=t===n,f=r.has(n);return e.jsx("div",{onClick:()=>o(n),style:{padding:"10px 12px",borderRadius:8,marginBottom:2,cursor:"pointer",background:l?`${a.color}18`:"transparent",border:l?`1px solid ${a.color}44`:"1px solid transparent",transition:"all 0.15s"},children:e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx("span",{style:{fontSize:16},children:f&&!l?"✅":a.emoji}),e.jsxs("div",{children:[e.jsx("div",{style:{color:l?a.color:"#c9d1d9",fontSize:13,fontWeight:l?700:400},children:a.title}),e.jsx("div",{style:{color:"#8b949e",fontSize:11},children:a.subtitle})]})]})},n)})})]}),e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"},children:[e.jsxs("div",{style:{padding:"16px 24px",borderBottom:"1px solid #21262d",background:"#0d1117",display:"flex",alignItems:"center",gap:12,flexShrink:0},children:[e.jsx("span",{style:{fontSize:24},children:h.emoji}),e.jsxs("div",{children:[e.jsxs("div",{style:{color:h.color,fontWeight:700,fontSize:16},children:["Module ",t+1," / ",c.length]}),e.jsx("div",{style:{color:"#8b949e",fontSize:12},children:h.subtitle})]})]}),e.jsxs("div",{style:{flex:1,overflowY:"auto",padding:"24px 32px",maxWidth:900},children:[e.jsx(u,{}),e.jsxs("div",{style:{display:"flex",gap:12,marginTop:32,paddingTop:16,borderTop:"1px solid #21262d"},children:[t>0&&e.jsx("button",{onClick:()=>s(-1),style:{background:"#161b22",border:"1px solid #30363d",color:"#c9d1d9",padding:"8px 20px",borderRadius:8,cursor:"pointer",fontSize:14},children:"← Previous"}),t<c.length-1&&e.jsx("button",{onClick:()=>s(1),style:{background:h.color,border:"none",color:"#000",padding:"8px 20px",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:700,marginLeft:"auto"},children:"Next Module →"}),t===c.length-1&&e.jsx("button",{onClick:()=>{i(new Set(c.map((a,n)=>n)))},style:{background:"#00ff9d",border:"none",color:"#000",padding:"8px 20px",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:700,marginLeft:"auto"},children:"🎓 Complete Course!"})]})]})]})]})}export{L as default};
