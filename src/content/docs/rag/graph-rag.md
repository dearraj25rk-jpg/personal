---
title: "GraphRAG & Knowledge Graphs"
description: Microsoft GraphRAG (2024), LightRAG (2024), NodeRAG (2025), Graph-R1 (2026) — community detection for global queries, dual-level graph retrieval, Neo4j integration — when entity relationships beat vector similarity, with Anthropic SDK and LangChain implementations.
sidebar:
  order: 18
---

> **Current as of May 2026.**

## Why Graphs for Retrieval?

Standard RAG retrieves isolated text chunks. Graphs retrieve **relationships between entities**. This matters when answers require understanding connections, not just finding nearby text.

```
  STANDARD RAG                       GRAPH RAG
  ──────────────────────────         ──────────────────────────────
  Query: "How is Acme Corp           Query: "How is Acme Corp
  connected to the supply            connected to the supply
  chain disruption?"                 chain disruption?"
        │                                  │
        ▼                                  ▼
  Finds chunks mentioning            Traverses graph:
  "Acme Corp" AND                    Acme Corp
  "supply chain disruption"            → SUPPLIES → Widget Factory
                                         → AFFECTED_BY → Disruption X
  Misses:                                → CAUSED_BY → Port Strike Y
  - Indirect connections                 → IMPACTS → Tech Inc
  - Chain of relationships               → DELAYED → Product Z
  - Multi-hop paths
  - Global patterns across
    the whole corpus
```

**Graph RAG wins when:**
- Queries require traversing relationships ("what companies are affected by X through their suppliers?")
- Questions are about the **whole corpus**, not a specific passage ("what are the main themes across all documents?")
- Entities and their connections are more important than raw text

---

## The Two Problems Graph RAG Solves

```
  PROBLEM 1: LOCAL QUERIES — finding specific entity relationships
  ──────────────────────────────────────────────────────────────────
  "Who are OpenAI's main investors and when did they invest?"
  "Which drugs interact with metformin?"
  "What subsidiaries does Berkshire Hathaway own?"

  Standard RAG: may find some, but misses multi-hop chains
  Graph RAG:    traverses entity relationships precisely


  PROBLEM 2: GLOBAL QUERIES — understanding the whole corpus
  ──────────────────────────────────────────────────────────────────
  "What are the main themes across all these research papers?"
  "What is the overall sentiment about our product in these reviews?"
  "Summarize the key risks mentioned across all SEC filings"

  Standard RAG: no single chunk answers a "whole corpus" question
  Vector RAG:   retrieves local chunks, misses global patterns
  Graph RAG:    builds community summaries over the entire corpus,
                enabling global synthesis
```

---

## Microsoft GraphRAG (2024)

**Paper:** Edge et al., "From Local to Global: A Graph RAG Approach to Query-Focused Summarization" (Microsoft Research, April 2024, arXiv:2404.16130)

GraphRAG builds a **hierarchical knowledge graph with community summaries** — allowing both precise entity lookup (local queries) and corpus-wide synthesis (global queries).

### Architecture Overview

```
  ┌─────────────────────────────────────────────────────────────┐
  │               MICROSOFT GRAPHRAG PIPELINE                    │
  └───────────────────────────┬─────────────────────────────────┘
                              │
                              ▼
  ╔═════════════════════════════════════════════════════════════╗
  ║  PHASE 1: ENTITY & RELATIONSHIP EXTRACTION                  ║
  ║                                                             ║
  ║  Input text chunks → LLM extracts:                         ║
  ║                                                             ║
  ║  ENTITIES:                          RELATIONSHIPS:          ║
  ║  • OpenAI (Organization)            • OpenAI FUNDED_BY      ║
  ║  • Sam Altman (Person)                Microsoft              ║
  ║  • GPT-4 (Technology)              • Sam Altman CEO_OF      ║
  ║  • Microsoft (Organization)           OpenAI                ║
  ║  • ChatGPT (Product)               • GPT-4 POWERS           ║
  ║                                       ChatGPT               ║
  ╚═════════════════════════════════════╦═══════════════════════╝
                                        ║
                                        ▼
  ╔═════════════════════════════════════════════════════════════╗
  ║  PHASE 2: KNOWLEDGE GRAPH CONSTRUCTION                      ║
  ║                                                             ║
  ║  Nodes = entities                                           ║
  ║  Edges = relationships + weight (co-occurrence frequency)   ║
  ║                                                             ║
  ║     Microsoft ──INVESTED_IN──▶ OpenAI                       ║
  ║         │                        │                          ║
  ║  PARTNER_OF              CREATED_BY                         ║
  ║         │                        │                          ║
  ║      GitHub             Sam Altman ──CEO_OF──▶ OpenAI       ║
  ║                              │                              ║
  ║                         ANNOUNCED                           ║
  ║                              │                              ║
  ║                           GPT-4 ──POWERS──▶ ChatGPT        ║
  ╚═════════════════════════════════════╦═══════════════════════╝
                                        ║
                                        ▼
  ╔═════════════════════════════════════════════════════════════╗
  ║  PHASE 3: COMMUNITY DETECTION (Leiden Algorithm)            ║
  ║                                                             ║
  ║  Groups strongly-connected entities into "communities"      ║
  ║                                                             ║
  ║  Community 1: AI Safety                                     ║
  ║  ├── OpenAI, Sam Altman, Ilya Sutskever                    ║
  ║  └── GPT-4, Constitutional AI, RLHF                        ║
  ║                                                             ║
  ║  Community 2: AI Investment                                 ║
  ║  ├── Microsoft, OpenAI, Sequoia Capital                    ║
  ║  └── Funding rounds, valuations, partnerships              ║
  ║                                                             ║
  ║  Community 3: AI Products                                   ║
  ║  ├── ChatGPT, Copilot, DALL-E                              ║
  ║  └── User metrics, revenue, competitors                    ║
  ╚═════════════════════════════════════╦═══════════════════════╝
                                        ║
                                        ▼
  ╔═════════════════════════════════════════════════════════════╗
  ║  PHASE 4: HIERARCHICAL COMMUNITY SUMMARIES                  ║
  ║                                                             ║
  ║  LLM writes a summary for EACH community:                   ║
  ║                                                             ║
  ║  Level 0 (leaf):  "OpenAI's GPT-4 model, created by..."   ║
  ║  Level 1:         "OpenAI's AI safety work includes..."    ║
  ║  Level 2:         "The AI industry's safety vs. capability ║
  ║                    debate centers on..."                    ║
  ║  Level 3 (root):  "AI industry overview: key players..."   ║
  ║                                                             ║
  ║  Stored as: community_report_{level}_{community_id}        ║
  ╚═════════════════════════════════════════════════════════════╝
```

### Query Time — Local vs. Global

```
  QUERY TYPE ROUTING
  ─────────────────────────────────────────────────────────────

  LOCAL QUERY (specific entity/relationship):
  "Who are OpenAI's investors?"
        │
        ▼
  Search entity graph:
  OpenAI node → INVESTED_BY edges → [Microsoft $10B, Tiger Global,
                                      Sequoia Capital, a16z...]
        │
        ▼
  Return entity relationships + source text citations


  GLOBAL QUERY (corpus-wide theme/synthesis):
  "What are the main concerns about AI safety across all articles?"
        │
        ▼
  Read community summaries at appropriate level (not raw graph):
  Community 1 summary: "AI safety concerns center on..."
  Community 4 summary: "Regulatory debate includes..."
  Community 7 summary: "Technical alignment research..."
        │
        ▼
  LLM synthesizes across community summaries → global answer

  ─────────────────────────────────────────────────────────────

  KEY INSIGHT: Global queries NEVER look at raw text chunks.
  They read pre-computed community summaries → faster, broader.
```

---

## LightRAG (2024)

**Paper:** Guo et al., "LightRAG: Simple and Fast Retrieval-Augmented Generation" (October 2024, arXiv:2410.05779)

LightRAG is a simpler alternative to Microsoft GraphRAG, designed to be lighter and faster while retaining dual-level retrieval (local + global).

```
  LIGHTRAG vs. MICROSOFT GRAPHRAG
  ─────────────────────────────────────────────────────────────
                        LightRAG        Microsoft GraphRAG
  ─────────────────────────────────────────────────────────────
  Graph construction    Simple          Leiden community detection
  Summary depth         2 levels        4+ levels
  Retrieval modes       Local, Global,  Local, Global
                        Hybrid, Naive
  Setup complexity      Low             High
  API available         Yes             Microsoft-managed
  Open source           Yes (Apache)    Yes (MIT)
  Best for              Medium corpora  Large enterprise corpora
  Cost                  Lower           Higher
  ─────────────────────────────────────────────────────────────
```

LightRAG's retrieval modes:
- **Naive**: simple chunk retrieval (baseline)
- **Local**: entity + relationship focused
- **Global**: high-level concept summaries
- **Hybrid**: combines local + global (recommended)

---

## Implementation — Simple GraphRAG with Anthropic SDK

```python
"""
graph_rag.py — GraphRAG implementation using Anthropic SDK
pip install anthropic networkx numpy
"""
import json
import anthropic
import networkx as nx
from dataclasses import dataclass, field
from collections import defaultdict

client = anthropic.Anthropic()


# ─── Data structures ──────────────────────────────────────────

@dataclass
class Entity:
    name: str
    entity_type: str        # PERSON, ORGANIZATION, TECHNOLOGY, PRODUCT, etc.
    description: str
    source_chunks: list[str] = field(default_factory=list)

@dataclass
class Relationship:
    source: str             # entity name
    target: str             # entity name
    relation_type: str      # INVESTED_IN, CEO_OF, CREATED, etc.
    description: str
    weight: float = 1.0
    source_chunks: list[str] = field(default_factory=list)


# ─── Phase 1: Entity & Relationship Extraction ────────────────

EXTRACTION_PROMPT = """Extract all entities and relationships from the following text.

Return a JSON object with this exact structure:
{
  "entities": [
    {
      "name": "Entity Name",
      "type": "PERSON|ORGANIZATION|TECHNOLOGY|PRODUCT|EVENT|CONCEPT",
      "description": "Brief description of this entity"
    }
  ],
  "relationships": [
    {
      "source": "Entity Name",
      "target": "Entity Name",
      "type": "RELATIONSHIP_TYPE",
      "description": "Description of the relationship"
    }
  ]
}

Guidelines:
- Extract ALL named entities (people, companies, products, technologies, concepts)
- Use UPPERCASE_UNDERSCORE for relationship types (e.g., CEO_OF, INVESTED_IN, CREATED)
- Be specific: prefer "ACQUIRED_BY" over "RELATED_TO"
- Only extract relationships that are explicitly stated in the text

Text:
{text}"""


def extract_entities_and_relations(chunk: str) -> dict:
    """Extract entities and relationships from a text chunk using Claude."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",    # fast + cheap for bulk extraction
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": EXTRACTION_PROMPT.format(text=chunk),
        }],
    )

    raw = response.content[0].text.strip()
    # Strip code fences if present
    if "```" in raw:
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]

    try:
        return json.loads(raw.strip())
    except json.JSONDecodeError:
        return {"entities": [], "relationships": []}


# ─── Phase 2: Build Knowledge Graph ──────────────────────────

class KnowledgeGraph:
    """
    Builds and queries a knowledge graph from extracted entities/relationships.
    Uses NetworkX for graph operations.
    """

    def __init__(self):
        self.graph = nx.DiGraph()       # directed graph (source → target)
        self.entities: dict[str, Entity] = {}
        self.relationships: list[Relationship] = []

    def add_chunk(self, chunk: str, chunk_id: str):
        """Process a chunk and add its entities/relationships to the graph."""
        extracted = extract_entities_and_relations(chunk)

        # Add entities
        for e in extracted.get("entities", []):
            name = e["name"]
            if name not in self.entities:
                self.entities[name] = Entity(
                    name=name,
                    entity_type=e.get("type", "UNKNOWN"),
                    description=e.get("description", ""),
                    source_chunks=[chunk_id],
                )
            else:
                # Entity seen before — merge descriptions, add source
                self.entities[name].source_chunks.append(chunk_id)

            # Add node to NetworkX graph
            self.graph.add_node(
                name,
                entity_type=e.get("type", "UNKNOWN"),
                description=e.get("description", ""),
            )

        # Add relationships
        for r in extracted.get("relationships", []):
            src = r["source"]
            tgt = r["target"]
            rel_type = r.get("type", "RELATED_TO")

            # Add nodes if they don't exist yet
            for node in [src, tgt]:
                if node not in self.graph:
                    self.graph.add_node(node)

            # Add or update edge (increase weight if seen multiple times)
            if self.graph.has_edge(src, tgt):
                self.graph[src][tgt]["weight"] += 1
            else:
                self.graph.add_edge(
                    src, tgt,
                    relation_type=rel_type,
                    description=r.get("description", ""),
                    weight=1.0,
                    sources=[chunk_id],
                )

            self.relationships.append(Relationship(
                source=src,
                target=tgt,
                relation_type=rel_type,
                description=r.get("description", ""),
                source_chunks=[chunk_id],
            ))

    def build_from_corpus(self, chunks: list[str]):
        """Build the full graph from a list of text chunks."""
        for i, chunk in enumerate(chunks):
            print(f"Extracting from chunk {i+1}/{len(chunks)}...")
            self.add_chunk(chunk, f"chunk_{i}")

    # ─── Graph queries ────────────────────────────────────────

    def get_entity_neighborhood(
        self,
        entity_name: str,
        hops: int = 2,
    ) -> dict:
        """
        Get all entities and relationships within N hops of a given entity.
        Used for LOCAL queries.
        """
        if entity_name not in self.graph:
            # Try case-insensitive match
            matches = [n for n in self.graph.nodes if n.lower() == entity_name.lower()]
            if not matches:
                return {"entities": [], "relationships": [], "found": False}
            entity_name = matches[0]

        # Get subgraph within N hops
        subgraph_nodes = nx.ego_graph(self.graph, entity_name, radius=hops).nodes()
        subgraph = self.graph.subgraph(subgraph_nodes)

        entities = [
            {
                "name": n,
                "type": subgraph.nodes[n].get("entity_type", ""),
                "description": subgraph.nodes[n].get("description", ""),
            }
            for n in subgraph_nodes
        ]

        relationships = [
            {
                "source": u,
                "target": v,
                "type": data.get("relation_type", ""),
                "description": data.get("description", ""),
                "weight": data.get("weight", 1.0),
            }
            for u, v, data in subgraph.edges(data=True)
        ]

        return {
            "center_entity": entity_name,
            "entities": entities,
            "relationships": relationships,
            "found": True,
        }

    def get_path(self, source: str, target: str) -> list[str] | None:
        """Find the shortest relationship path between two entities."""
        try:
            path = nx.shortest_path(self.graph, source, target)
            return path
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None

    def get_community_entities(self, min_community_size: int = 3) -> list[list[str]]:
        """
        Detect communities using connected components.
        For production, use python-louvain or igraph for Leiden algorithm.
        """
        undirected = self.graph.to_undirected()
        communities = list(nx.connected_components(undirected))
        return [list(c) for c in communities if len(c) >= min_community_size]


# ─── Phase 3: Community Summaries ────────────────────────────

def summarize_community(
    community_entities: list[str],
    graph: KnowledgeGraph,
) -> str:
    """
    Generate a summary for a community of related entities.
    This is what GraphRAG uses for GLOBAL queries.
    """
    # Collect all relationships within this community
    community_set = set(community_entities)
    relationships = []

    for u, v, data in graph.graph.edges(data=True):
        if u in community_set and v in community_set:
            relationships.append(
                f"{u} --[{data.get('relation_type', 'RELATED')}]--> {v}: "
                f"{data.get('description', '')}"
            )

    entity_descriptions = [
        f"- {e} ({graph.entities.get(e, Entity(e,'','',[])).entity_type}): "
        f"{graph.entities.get(e, Entity(e,'','',[])).description}"
        for e in community_entities[:20]    # cap at 20 entities per community
    ]

    prompt = f"""Summarize the following group of related entities and their relationships.
Write a coherent paragraph that explains what this group represents and how the entities relate.

Entities:
{chr(10).join(entity_descriptions)}

Relationships:
{chr(10).join(relationships[:30])}

Write a 3-5 sentence summary:"""

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=300,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()


# ─── Phase 4: Query Answering ────────────────────────────────

def local_graph_query(question: str, graph: KnowledgeGraph) -> str:
    """
    LOCAL query: find relevant entities, traverse graph, synthesize.
    Best for: "What is X connected to?", "How does A relate to B?"
    """
    # Step 1: Identify entities mentioned in the question
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=200,
        messages=[{
            "role": "user",
            "content": f"""Given this question, list the entity names that appear in the knowledge graph.
Return as JSON: {{"entities": ["Entity1", "Entity2"]}}

Question: {question}

Known entities (first 50): {list(graph.graph.nodes)[:50]}"""
        }],
    )
    try:
        raw = response.content[0].text
        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json")
        mentioned = json.loads(raw.strip()).get("entities", [])
    except Exception:
        mentioned = []

    # Step 2: Get neighborhoods for each mentioned entity
    all_context = []
    for entity in mentioned[:3]:    # limit to 3 entities
        neighborhood = graph.get_entity_neighborhood(entity, hops=2)
        if neighborhood["found"]:
            rels = "\n".join(
                f"  {r['source']} --[{r['type']}]--> {r['target']}: {r['description']}"
                for r in neighborhood["relationships"][:20]
            )
            all_context.append(
                f"Entity: {entity}\nConnections:\n{rels}"
            )

    if not all_context:
        return "No relevant entities found in the knowledge graph."

    context = "\n\n".join(all_context)

    # Step 3: Synthesize answer
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system="Answer the question using the knowledge graph context. Be specific about entity relationships.",
        messages=[{
            "role": "user",
            "content": f"Knowledge Graph Context:\n{context}\n\nQuestion: {question}",
        }],
    )
    return response.content[0].text


def global_graph_query(
    question: str,
    graph: KnowledgeGraph,
    community_summaries: list[str],
) -> str:
    """
    GLOBAL query: read community summaries, synthesize across the corpus.
    Best for: "What are the main themes?", "Summarize key patterns"
    """
    # Use all community summaries as context
    context = "\n\n---\n\n".join(
        f"[Community {i+1}]\n{summary}"
        for i, summary in enumerate(community_summaries)
    )

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system="""You are answering a global question about a document corpus.
You have access to community summaries that describe clusters of related entities and concepts.
Synthesize across ALL communities to give a comprehensive answer.""",
        messages=[{
            "role": "user",
            "content": f"Community Summaries:\n{context}\n\nQuestion: {question}",
        }],
    )
    return response.content[0].text


# ─── Full pipeline ────────────────────────────────────────────

def build_and_query_graph(chunks: list[str], question: str) -> dict:
    """End-to-end GraphRAG pipeline."""

    # Build graph
    print("Building knowledge graph...")
    graph = KnowledgeGraph()
    graph.build_from_corpus(chunks)
    print(f"Graph: {graph.graph.number_of_nodes()} nodes, {graph.graph.number_of_edges()} edges")

    # Build community summaries (for global queries)
    print("Detecting communities and building summaries...")
    communities = graph.get_community_entities(min_community_size=2)
    community_summaries = [
        summarize_community(community, graph)
        for community in communities[:10]    # limit to 10 communities
    ]

    # Route query (simple: check for "overall", "themes", "across all" → global)
    global_keywords = ["overall", "themes", "across", "main", "summary", "pattern", "broadly"]
    is_global = any(kw in question.lower() for kw in global_keywords)

    if is_global:
        print("Routing to GLOBAL query...")
        answer = global_graph_query(question, graph, community_summaries)
        mode = "global"
    else:
        print("Routing to LOCAL query...")
        answer = local_graph_query(question, graph)
        mode = "local"

    return {
        "answer": answer,
        "mode": mode,
        "graph_stats": {
            "nodes": graph.graph.number_of_nodes(),
            "edges": graph.graph.number_of_edges(),
            "communities": len(communities),
        },
    }


# ─── Usage ────────────────────────────────────────────────────

if __name__ == "__main__":
    chunks = [
        "Microsoft invested $10 billion in OpenAI in January 2023. Sam Altman is the CEO of OpenAI.",
        "OpenAI created GPT-4, which powers ChatGPT. ChatGPT has over 100 million users.",
        "Microsoft integrated OpenAI's technology into Copilot, their AI assistant for Office 365.",
        "Anthropic was founded by former OpenAI employees including Dario Amodei. They created Claude.",
        "Google DeepMind developed Gemini, which competes with GPT-4 in AI benchmarks.",
    ]

    result = build_and_query_graph(
        chunks,
        "What is the relationship between Microsoft and the AI industry?"
    )
    print(f"\nMode: {result['mode']}")
    print(f"Answer: {result['answer']}")
    print(f"Graph: {result['graph_stats']}")
```

---

## Implementation — LangChain + Neo4j

For production, use Neo4j as the graph database with LangChain's built-in graph QA chain:

```python
"""
graph_rag_langchain.py — LangChain + Neo4j Graph RAG
pip install langchain langchain-community langchain-anthropic neo4j
"""
from langchain_community.graphs import Neo4jGraph
from langchain_community.vectorstores import Neo4jVector
from langchain_anthropic import ChatAnthropic
from langchain_community.chains.graph_qa.cypher import GraphCypherQAChain
from langchain_core.prompts import PromptTemplate
from langchain_community.embeddings import HuggingFaceEmbeddings


# ─── Neo4j Connection ─────────────────────────────────────────

# Start Neo4j: docker run -p 7474:7474 -p 7687:7687 neo4j:latest

graph = Neo4jGraph(
    url="bolt://localhost:7687",
    username="neo4j",
    password="your_password",
)

# ─── Ingest entities and relationships ───────────────────────

def ingest_to_neo4j(entities: list[dict], relationships: list[dict]):
    """
    Load extracted entities and relationships into Neo4j.
    Called after running extract_entities_and_relations() per chunk.
    """
    # Create entity nodes
    for entity in entities:
        graph.query("""
            MERGE (e:Entity {name: $name})
            SET e.type = $type, e.description = $description
        """, params=entity)

    # Create relationship edges
    for rel in relationships:
        graph.query(f"""
            MATCH (s:Entity {{name: $source}})
            MATCH (t:Entity {{name: $target}})
            MERGE (s)-[r:{rel['type']}]->(t)
            SET r.description = $description
        """, params=rel)


# ─── GraphCypherQAChain — LLM writes Cypher queries ──────────

# This chain lets the LLM generate Cypher queries to answer questions.
# No manual graph traversal needed — the LLM learns the schema and queries it.

llm = ChatAnthropic(model="claude-sonnet-4-6", max_tokens=1024)

CYPHER_GENERATION_PROMPT = PromptTemplate(
    template="""You are a Neo4j Cypher expert. Generate a Cypher query to answer the question.

Schema:
{schema}

Question: {question}

Rules:
- Use MATCH to find entities
- Use relationships like (a)-[:INVESTED_IN]->(b)
- Return meaningful properties
- Limit results to 10 unless asked for more
- Return only the Cypher query, no explanation

Cypher query:""",
    input_variables=["schema", "question"],
)

cypher_chain = GraphCypherQAChain.from_llm(
    llm=llm,
    graph=graph,
    cypher_prompt=CYPHER_GENERATION_PROMPT,
    verbose=True,
    return_intermediate_steps=True,
)


# ─── Vector search over graph text (hybrid) ──────────────────

# Neo4jVector stores both the graph and vector embeddings
# allowing hybrid vector + graph search

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

neo4j_vector = Neo4jVector.from_existing_graph(
    embeddings,
    url="bolt://localhost:7687",
    username="neo4j",
    password="your_password",
    node_label="Entity",
    text_node_properties=["name", "description"],
    embedding_node_property="embedding",
)

vector_retriever = neo4j_vector.as_retriever(search_kwargs={"k": 5})


# ─── Usage ────────────────────────────────────────────────────

if __name__ == "__main__":
    # Graph query (generates Cypher)
    result = cypher_chain.invoke(
        "Who invested in OpenAI and how much?"
    )
    print("Graph answer:", result["result"])
    print("Cypher used:", result["intermediate_steps"][0]["query"])

    # Vector search over graph text
    docs = vector_retriever.invoke("AI safety research organizations")
    for doc in docs:
        print(doc.page_content[:100])
```

---

## Leiden Algorithm — Community Detection Deep Dive

Microsoft GraphRAG uses the **Leiden algorithm** for community detection. Here's an intuitive explanation:

```
  WHAT IS COMMUNITY DETECTION?
  ──────────────────────────────────────────────────────────────
  Given a graph of entities, find groups where entities are
  MORE connected to each other than to the rest of the graph.

  Example graph:
  OpenAI ── GPT-4 ── ChatGPT ── DALL-E
    │                              │
  Sam Altman                   Midjourney
    │
  Anthropic ── Claude ── Constitutional AI
    │
  Dario Amodei ── Safety Research ── RLHF

  Community 1 (OpenAI products):      [GPT-4, ChatGPT, DALL-E]
  Community 2 (OpenAI leadership):    [OpenAI, Sam Altman, Anthropic]
  Community 3 (AI safety research):   [Anthropic, Claude, Constitutional AI, RLHF]

  ──────────────────────────────────────────────────────────────
  WHY LEIDEN OVER LOUVAIN?
  ──────────────────────────────────────────────────────────────
  Louvain algorithm (older):  can produce disconnected communities
                              (a community where nodes don't all
                               connect to each other)
  
  Leiden algorithm (2019):    guarantees well-connected communities
                              faster convergence
                              better modularity optimization
  ──────────────────────────────────────────────────────────────
```

```python
# Using the leidenalg package for Leiden community detection
# pip install leidenalg python-igraph

import igraph as ig
import leidenalg
import networkx as nx

def leiden_communities(G: nx.DiGraph, resolution: float = 1.0) -> list[list[str]]:
    """
    Apply Leiden algorithm for high-quality community detection.
    
    resolution: higher → smaller, more communities
                lower  → fewer, larger communities
    """
    # Convert NetworkX to igraph
    nodes = list(G.nodes())
    node_to_idx = {n: i for i, n in enumerate(nodes)}

    edges = [(node_to_idx[u], node_to_idx[v]) for u, v in G.edges()]
    g = ig.Graph(n=len(nodes), edges=edges, directed=True)
    g.vs["name"] = nodes

    # Run Leiden
    partition = leidenalg.find_partition(
        g,
        leidenalg.RBConfigurationVertexPartition,
        resolution_parameter=resolution,
        n_iterations=-1,    # run until stable
    )

    # Convert back to node name lists
    communities = []
    for community in partition:
        communities.append([nodes[i] for i in community])

    print(f"Leiden found {len(communities)} communities")
    return communities
```

---

## NodeRAG (2025)

**Paper:** NodeRAG — "Structuring Graph as Nodes for Retrieval-Augmented Generation" (2025)

NodeRAG demonstrates performance advantages over both Microsoft GraphRAG and LightRAG in indexing time, query efficiency, and multi-hop QA accuracy. The key innovation: rather than treating communities as retrieval units, NodeRAG makes **individual graph nodes** (entities, relationships, passages) directly retrievable — enabling finer-grained retrieval without community summarization overhead.

### NodeRAG vs. GraphRAG vs. LightRAG

| Metric | Microsoft GraphRAG | LightRAG | NodeRAG |
|---|---|---|---|
| Indexing time | Very slow (community detection) | Fast | Fast |
| Query latency | High (community summary lookup) | Medium | Low |
| Multi-hop QA | Good | Good | **Best** |
| Global synthesis | **Best** | Good | Good |
| Setup complexity | High | Medium | Medium |
| Storage overhead | High (summaries) | Medium | Low |

NodeRAG is the recommended starting point for new graph RAG implementations in 2025–2026 when indexing speed and query efficiency matter.

---

## Graph-R1 — Reinforcement Learning GraphRAG (2026)

**Paper:** "Graph-R1: Towards Agentic GraphRAG Framework via End-to-End Reinforcement Learning" (2026)

Graph-R1 treats retrieval as a **multi-turn agent-environment interaction**, trained with reinforcement learning rather than supervised graph extraction. Key innovations:

- **Lightweight knowledge hypergraph**: replaces heavy Leiden community detection with learned hyperedges
- **RL-trained retrieval agent**: learns which graph paths to traverse for a given query — not hand-coded routing
- **End-to-end training**: both graph construction and retrieval policy are jointly optimized

Graph-R1 outperforms traditional GraphRAG in reasoning accuracy and retrieval efficiency, particularly on multi-hop reasoning benchmarks where static community summaries are insufficient.

---

## Hyper-RAG (2025)

**Paper:** "Hyper-RAG: Combating LLM Hallucinations using Hypergraph-driven Retrieval-Augmented Generation" (2025)  
**Key claim:** 12.3% accuracy improvement over direct LLM use; outperforms both GraphRAG and LightRAG on domain-specific tasks.

### Why Hypergraphs?

Standard graphs model **pairwise** relationships (A → B). Hypergraphs model **many-to-many** relationships — a single hyperedge can connect multiple entities simultaneously. This is critical for domains like medicine, law, and finance where facts involve multiple co-participants.

```
STANDARD GRAPH EDGE:          HYPEREDGE:
Drug_A ──── interacts_with ──── Drug_B     Drug_A, Drug_B, Drug_C ──── "interact under condition X"
(pairwise only)                            (all three implicated simultaneously)
```

### Architecture

```
                    HYPER-RAG PIPELINE
                    ─────────────────────────────────────────

 Documents
     │
     ▼ Entity + Relation Extraction (LLM)
 ┌────────────────────────────────────────┐
 │  HYPERGRAPH CONSTRUCTION               │
 │                                        │
 │  Nodes: entities (drugs, diseases,     │
 │         companies, clauses, ...)       │
 │                                        │
 │  Hyperedges: relationships connecting  │
 │  2+ entities simultaneously            │
 │                                        │
 │  Example hyperedge:                    │
 │  {Metformin, Kidney_Disease, Elderly}  │
 │   → "Avoid high doses in this group"  │
 └────────────────┬───────────────────────┘
                  │
     ┌────────────▼────────────────┐
     │   DUAL RETRIEVAL ENGINE     │
     │                             │
     │   1. Standard vector search │  ← finds relevant hyperedges by semantic similarity
     │                             │
     │   2. Hyperedge traversal    │  ← follows connected hyperedges (multi-entity paths)
     └────────────┬────────────────┘
                  │
     ┌────────────▼────────────────┐
     │   CONTEXT ASSEMBLY          │
     │                             │
     │   Merge retrieved hyperedge │
     │   text + supporting chunks  │
     └────────────┬────────────────┘
                  │
                  ▼
           LLM Generation
```

### When to Use Hyper-RAG

- **Medical / Pharmaceutical:** Drug interaction tables, contraindication reasoning
- **Legal:** Multi-party contract clause analysis
- **Financial compliance:** Rules that apply only when multiple conditions are met simultaneously

### Python Quick Start

```python
# pip install hyperrag  (community package)
from hyperrag import HyperRAGPipeline

pipeline = HyperRAGPipeline(
    llm_model="claude-opus-4-5",
    embedding_model="BAAI/bge-large-en-v1.5",
    hyperedge_extraction_prompt="Extract entities and multi-party relationships...",
)

# Index documents
pipeline.index(documents)

# Query
result = pipeline.query("What drugs should be avoided in elderly patients with kidney disease?")
print(result.answer)
print(result.hyperedge_evidence)   # which hyperedges were used
```

### Benchmarks

| System | MedQA Accuracy | HotpotQA F1 |
|---|---|---|
| Direct LLM | 68.2% | 71.4% |
| GraphRAG | 74.1% | 78.2% |
| LightRAG | 75.8% | 79.6% |
| **Hyper-RAG** | **80.5%** | **82.3%** |

---

## When to Use Graph RAG

```
  USE GRAPH RAG WHEN:                    AVOID GRAPH RAG WHEN:
  ──────────────────────────────────     ──────────────────────────────
  ✓ Queries need entity relationships    ✗ Documents are unrelated prose
  ✓ "How is X connected to Y?"           ✗ No clear entities/relationships
  ✓ Multi-hop reasoning required         ✗ Questions about specific passages
  ✓ Global corpus summarization          ✗ Small corpus (<100 docs)
  ✓ Knowledge bases (org charts,         ✗ Real-time/streaming data
    drug interactions, org hierarchy)    ✗ Very short latency required
  ✓ Research literature (citations,      ✗ Numerical/statistical queries
    author networks, topic clusters)       (use SQL retrieval instead)

  DOCUMENT TYPES:
  Best:     Internal knowledge bases, Wikipedia-like corpora,
            research paper collections, enterprise org data,
            drug/biomedical databases, legal case networks
  
  Moderate: Financial filings (use PageIndex first, add GraphRAG
            for entity relationship queries)
  
  Avoid:    Raw news articles, customer support tickets,
            general Q&A datasets, product documentation
```

---

## Comparison: GraphRAG vs. Other Vectorless Approaches

```
  ┌──────────────────┬──────────────┬─────────────┬─────────────┐
  │                  │  GraphRAG    │  PageIndex  │  BM25       │
  ├──────────────────┼──────────────┼─────────────┼─────────────┤
  │ Relationships    │ Excellent    │ Poor        │ Poor        │
  │ Global synthesis │ Excellent    │ Good        │ Poor        │
  │ Exact numbers    │ Poor         │ Excellent   │ Good        │
  │ Table data       │ Poor         │ Excellent   │ Moderate    │
  │ Setup cost       │ High         │ Medium      │ Low         │
  │ Query latency    │ Medium       │ Medium      │ Very low    │
  │ Corpus size      │ Scales well  │ Per-doc     │ Scales well │
  │ Structured PDFs  │ No           │ Yes         │ Partial     │
  └──────────────────┴──────────────┴─────────────┴─────────────┘
```

---

## See Also

- [Vectorless RAG Hub](../pageindex-vectorless-rag) — all vectorless approaches overview
- [BM25 & Sparse Retrieval](../bm25-sparse-retrieval) — keyword retrieval for exact term matching
- [Contextual Retrieval](../contextual-retrieval) — Anthropic's hybrid chunk contextualization
- [Agentic RAG](../agentic-rag) — multi-step retrieval agents that can combine graph + vector
- [Advanced RAG](../advanced-rag) — RAPTOR (hierarchical summaries, similar to GraphRAG communities)
