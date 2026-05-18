---
title: "GraphRAG & Knowledge Graphs"
description: Microsoft GraphRAG (2024), LightRAG (2024), NodeRAG (2025), HippoRAG (2024), Graph-R1 (2026) — community detection for global queries, dual-level graph retrieval, Neo4j integration — when entity relationships beat vector similarity, with Anthropic SDK and LangChain implementations.
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

## NodeRAG (Microsoft, 2025)

**Paper:** "NodeRAG: Structuring Graph as Nodes for Retrieval-Augmented Generation" (2025)

NodeRAG introduces a fundamentally different indexing strategy compared to GraphRAG. Rather than grouping entities into communities and generating LLM summaries for each community (which requires many LLM calls and significant compute), NodeRAG creates a **unified node type system** where every element of the knowledge structure — entities, semantic units, relationships, and attributes — becomes a directly retrievable node.

```
  GRAPHRAG INDEXING vs. NODERAG INDEXING
  ─────────────────────────────────────────────────────────────

  GRAPHRAG:
  Chunks → Extract entities → Build graph
        → Detect communities (Leiden)
        → LLM summarizes EACH community at EACH level
        → Store: entities + communities + summaries

  LLM calls at index time:
    extraction:       1 call per chunk
    community summaries: 1 call per community × N levels
    Total: O(chunks + communities × levels)
    Cost example: 1000 chunks × ~10 entities each = ~10,000
                  extraction calls + community summary calls

  NODERAG:
  Chunks → Extract entities → Build heterogeneous node graph
        → Each node type is directly queryable:
          - Atomic entity nodes (people, orgs, concepts)
          - Semantic unit nodes (paragraphs with context)
          - Relationship nodes (edges become retrievable nodes)
          - Attribute nodes (properties with values)
        → NO community summarization step

  LLM calls at index time:
    extraction only: 1 call per chunk
    Cost: ~3× cheaper than GraphRAG
    Speed: ~3× faster to build index
```

### NodeRAG Node Types

```
  NODERAG UNIFIED NODE SCHEMA
  ─────────────────────────────────────────────────────────────

  Atomic Entity Node:
  ┌─────────────────────────────────────────────────────────┐
  │  id: "entity_openai"                                    │
  │  type: ENTITY                                           │
  │  name: "OpenAI"                                         │
  │  entity_type: ORGANIZATION                              │
  │  description: "AI safety and research company..."       │
  │  embedding: [0.23, -0.11, ...]  ← retrievable by vec   │
  └─────────────────────────────────────────────────────────┘

  Relationship Node (edges become nodes):
  ┌─────────────────────────────────────────────────────────┐
  │  id: "rel_ms_openai_001"                                │
  │  type: RELATIONSHIP                                     │
  │  subject: "Microsoft"                                   │
  │  predicate: "INVESTED_IN"                               │
  │  object: "OpenAI"                                       │
  │  context: "$10B investment, January 2023"               │
  │  embedding: [...]  ← retrievable by vector search       │
  └─────────────────────────────────────────────────────────┘

  Semantic Unit Node (context-preserving chunk):
  ┌─────────────────────────────────────────────────────────┐
  │  id: "sem_unit_042"                                     │
  │  type: SEMANTIC_UNIT                                    │
  │  content: "Microsoft's $10B investment in OpenAI..."    │
  │  linked_entities: ["Microsoft", "OpenAI"]               │
  │  embedding: [...]                                       │
  └─────────────────────────────────────────────────────────┘
```

### NodeRAG vs. GraphRAG vs. LightRAG — Comparison

| Metric | Microsoft GraphRAG | LightRAG | NodeRAG |
|---|---|---|---|
| Index build cost | Very high (community LLM calls) | Medium | Low (~3x cheaper than GraphRAG) |
| Index build speed | Very slow | Medium | Fast |
| Query latency | High (community lookup) | Medium | Low |
| Multi-hop QA accuracy | Good | Good | Best |
| Global synthesis | Best (deep community hierarchy) | Good | Good |
| Narrow/specific queries | Good | Good | Best |
| Setup complexity | High | Medium | Medium |
| Storage overhead | High (summaries at every level) | Medium | Low |
| Recommended for new projects | No (cost) | Maybe | Yes (2025+) |

NodeRAG is the recommended starting point for new graph RAG implementations when indexing speed and query efficiency matter. GraphRAG remains superior for global corpus synthesis questions that require multi-level community hierarchies.

---

## HippoRAG (Princeton/Ohio State, 2024)

**Paper:** Gutierrez et al., "HippoRAG: Neurobiologically Inspired Long-Term Memory for Large Language Models" (Princeton / Ohio State, NeurIPS 2024)

HippoRAG draws an explicit analogy to the hippocampus — the brain region responsible for associative memory. The hippocampus doesn't store memories as isolated facts; it encodes them as **relational networks** where concepts activate related concepts through learned associations. HippoRAG replaces vector cosine similarity with **Personalized PageRank (PPR)** on a knowledge graph, enabling associative spreading activation similar to how human memory retrieves related facts.

### Architecture

```
  HIPPORAG PIPELINE
  ─────────────────────────────────────────────────────────────

  OFFLINE: KNOWLEDGE GRAPH CONSTRUCTION
  ─────────────────────────────────────────────────────────────

  Step 1: LLM extracts open IE triples from each passage
  ─────────────────────────────────────────────────────
  Passage: "Sam Altman, CEO of OpenAI, announced GPT-4 in March 2023.
            GPT-4 was trained on diverse internet text."

  Extracted triples:
  (Sam Altman, is_CEO_of, OpenAI)
  (Sam Altman, announced, GPT-4)
  (GPT-4, announced_in, March 2023)
  (GPT-4, trained_on, diverse internet text)

  Step 2: Build knowledge graph (KG)
  ──────────────────────────────────
  Nodes: all entities from all triples across the corpus
  Edges: relationships between entities
  Also: link each triple → source passage for retrieval

  ONLINE: QUERY-TIME RETRIEVAL
  ─────────────────────────────────────────────────────────────

  Step 3: Query entity extraction
  ────────────────────────────────
  Query: "Who announced GPT-4 and what company do they lead?"

  LLM extracts query entities: ["GPT-4", "company"]
  Embed query entities → find matching KG nodes

  Step 4: Personalized PageRank (PPR)
  ────────────────────────────────────
  Seed nodes = query entity nodes in KG
  PPR propagates relevance through the graph:
  - Nodes directly connected to seeds get high scores
  - Scores decay with graph distance
  - Restart probability r controls locality

  PPR score vector s(v) for all nodes v:
  s = r × e_seed + (1-r) × A^T × s
  where:
    r = restart probability (typically 0.15)
    e_seed = indicator vector over seed nodes
    A = row-normalized adjacency matrix

  Step 5: Passage retrieval
  ─────────────────────────
  Top-PPR-scored nodes → linked source passages
  Return passages as context for LLM

  ─────────────────────────────────────────────────────────────

  WHY PPR BEATS COSINE SIMILARITY:
  Query: "Who co-founded OpenAI with Sam Altman?"
  Vector RAG: finds passages with "co-founded" + "Sam Altman"
  HippoRAG: seeds on "Sam Altman" → PPR spreads to
            "Elon Musk", "Greg Brockman", "Ilya Sutskever"
            via CO_FOUNDED_WITH edges → finds answer even if
            no passage says "co-founded" and "Sam Altman" together
```

### Benchmark Results

```
  HIPPORAG vs. STANDARD RAG — MULTI-HOP QA BENCHMARKS
  ─────────────────────────────────────────────────────────────

  Dataset: MuSiQue (multi-hop reasoning, 2-4 hops required)
  ─────────────────────────────────────────────────────────────
  Standard RAG (BM25)          42.3% F1
  Standard RAG (dense)         48.1% F1
  HippoRAG                     58.4% F1    (+21% over dense)

  Dataset: 2WikiMultiHopQA
  ─────────────────────────────────────────────────────────────
  Standard RAG (BM25)          51.2% F1
  Standard RAG (dense)         54.8% F1
  HippoRAG                     63.1% F1    (+15% over dense)

  Dataset: HotpotQA
  ─────────────────────────────────────────────────────────────
  Standard RAG (dense)         62.4% F1
  HippoRAG                     68.2% F1    (+9% over dense)
```

### NetworkX PPR Implementation

```python
"""
hipporag.py — HippoRAG-inspired retrieval using Personalized PageRank
pip install networkx anthropic numpy
"""
import anthropic
import networkx as nx
import numpy as np
import json
from dataclasses import dataclass, field

client = anthropic.Anthropic()


@dataclass
class Triple:
    subject: str
    predicate: str
    obj: str
    source_passage_id: int


def extract_triples(passage: str) -> list[tuple[str, str, str]]:
    """Extract open IE (subject, predicate, object) triples from a passage."""
    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": (
                "Extract factual (subject, predicate, object) triples from this text.\n"
                "Return JSON: {\"triples\": [[\"subject\", \"predicate\", \"object\"], ...]}\n"
                "Use short, specific predicates. Only extract explicit facts.\n\n"
                f"Text: {passage}"
            ),
        }],
    )
    raw = response.content[0].text.strip()
    if "```" in raw:
        raw = raw.split("```")[1].lstrip("json").strip()
    try:
        data = json.loads(raw)
        return [tuple(t) for t in data.get("triples", [])]
    except Exception:
        return []


class HippoRAG:
    """
    HippoRAG: Knowledge graph + Personalized PageRank for retrieval.
    Associative memory via graph spreading activation.
    """

    def __init__(self, passages: list[str]):
        self.passages = passages
        self.graph = nx.Graph()        # undirected for PPR spreading
        self.entity_to_passages: dict[str, list[int]] = {}
        self.triples: list[Triple] = []

        # Build KG
        self._build_knowledge_graph()

    def _build_knowledge_graph(self):
        print(f"Building HippoRAG knowledge graph from {len(self.passages)} passages...")
        for passage_id, passage in enumerate(self.passages):
            raw_triples = extract_triples(passage)
            for subj, pred, obj in raw_triples:
                # Add nodes
                for entity in [subj, obj]:
                    if entity not in self.graph:
                        self.graph.add_node(entity)
                    self.entity_to_passages.setdefault(entity, []).append(passage_id)

                # Add edge (weighted by frequency)
                if self.graph.has_edge(subj, obj):
                    self.graph[subj][obj]["weight"] += 1
                else:
                    self.graph.add_edge(subj, obj, predicate=pred, weight=1.0)

                self.triples.append(Triple(subj, pred, obj, passage_id))

        print(f"  Graph: {self.graph.number_of_nodes()} nodes, {self.graph.number_of_edges()} edges")

    def _personalized_pagerank(
        self,
        seed_nodes: list[str],
        restart_prob: float = 0.15,
        max_iter: int = 100,
    ) -> dict[str, float]:
        """
        Run Personalized PageRank from seed nodes.

        restart_prob (alpha): probability of teleporting back to seeds
                              0.15 = standard (explores broadly)
                              0.50 = stays close to seeds (precise)

        Returns dict of node → PPR score.
        Higher score = more relevant to the seeds.
        """
        if not seed_nodes or not self.graph.number_of_nodes():
            return {}

        # Filter to nodes that exist in graph
        valid_seeds = [n for n in seed_nodes if n in self.graph]
        if not valid_seeds:
            return {}

        # Personalization vector: uniform over seed nodes
        personalization = {
            node: (1.0 / len(valid_seeds) if node in valid_seeds else 0.0)
            for node in self.graph.nodes()
        }

        ppr_scores = nx.pagerank(
            self.graph,
            alpha=1 - restart_prob,   # NetworkX: alpha = damping = 1 - restart
            personalization=personalization,
            max_iter=max_iter,
            weight="weight",
        )
        return ppr_scores

    def _extract_query_entities(self, query: str) -> list[str]:
        """Extract entities from query to use as PPR seeds."""
        response = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": (
                    f"Extract the key entity names from this query for knowledge graph lookup.\n"
                    f"Return JSON: {{\"entities\": [\"Entity1\", \"Entity2\"]}}\n\n"
                    f"Query: {query}\n\n"
                    f"Known graph entities (sample): {list(self.graph.nodes())[:30]}"
                ),
            }],
        )
        raw = response.content[0].text.strip()
        if "```" in raw:
            raw = raw.split("```")[1].lstrip("json").strip()
        try:
            return json.loads(raw).get("entities", [])
        except Exception:
            return []

    def retrieve(
        self,
        query: str,
        k: int = 5,
        restart_prob: float = 0.15,
    ) -> list[dict]:
        """
        Retrieve passages using HippoRAG: entity extraction → PPR → passage ranking.
        """
        # Step 1: Extract query entities
        query_entities = self._extract_query_entities(query)
        print(f"  Query entities: {query_entities}")

        # Step 2: PPR from query entity seeds
        ppr_scores = self._personalized_pagerank(query_entities, restart_prob)

        # Step 3: Score passages by aggregating PPR scores of their entities
        passage_scores: dict[int, float] = {}
        for node, ppr_score in ppr_scores.items():
            for passage_id in self.entity_to_passages.get(node, []):
                passage_scores[passage_id] = passage_scores.get(passage_id, 0.0) + ppr_score

        # Step 4: Return top-k passages
        ranked = sorted(passage_scores.items(), key=lambda x: x[1], reverse=True)
        return [
            {
                "passage": self.passages[pid],
                "score": score,
                "passage_id": pid,
            }
            for pid, score in ranked[:k]
        ]

    def answer(self, query: str, k: int = 5) -> str:
        """Full HippoRAG QA: retrieve passages → synthesize answer."""
        results = self.retrieve(query, k=k)
        context = "\n\n---\n\n".join(
            f"[Passage {r['passage_id']+1}]\n{r['passage']}"
            for r in results
        )
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system="Answer precisely using the provided passages.",
            messages=[{
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {query}",
            }],
        )
        return response.content[0].text


# ─── Usage ───────────────────────────────────────────────────

if __name__ == "__main__":
    passages = [
        "Sam Altman co-founded OpenAI in 2015 with Elon Musk and Greg Brockman.",
        "OpenAI created GPT-4, which powers ChatGPT and GitHub Copilot.",
        "Microsoft invested $10 billion in OpenAI in 2023.",
        "Elon Musk departed OpenAI's board in 2018 due to conflicts of interest.",
        "GitHub Copilot is developed by GitHub, a Microsoft subsidiary.",
    ]

    hippo = HippoRAG(passages)
    answer = hippo.answer("Who co-founded OpenAI with Sam Altman?")
    print(answer)
```

---

## NodeRAG (Microsoft, 2025)

NodeRAG demonstrates performance advantages over both Microsoft GraphRAG and LightRAG in indexing time, query efficiency, and multi-hop QA accuracy. The key innovation: rather than treating communities as retrieval units, NodeRAG makes **individual graph nodes** (entities, relationships, passages) directly retrievable — enabling finer-grained retrieval without community summarization overhead.

See the [NodeRAG section](#noderag-microsoft-2025) above for the full comparison table and node type schemas.

---

## Graph-R1 — Reinforcement Learning GraphRAG (2026)

**Paper:** "Graph-R1: Towards Agentic GraphRAG Framework via End-to-End Reinforcement Learning" (2026)

Graph-R1 applies **reinforcement learning** (specifically GRPO — Group Relative Policy Optimization) to graph traversal for RAG. Rather than using hand-coded routing rules (local vs. global) or static community summaries, the agent learns which graph traversal paths lead to correct answers through trial and error on QA datasets.

```
  GRAPH-R1 ARCHITECTURE
  ─────────────────────────────────────────────────────────────

  STANDARD GRAPHRAG (static):
  ─────────────────────────────────────────────────────────────
  Query → rule-based router → fixed traversal strategy
        → answer

  Path selection: human-designed heuristics
  Improvement: manual re-engineering

  GRAPH-R1 (RL-trained):
  ─────────────────────────────────────────────────────────────
  Query → RL agent → dynamic traversal strategy selection
        ↑  │              │
        │  ▼              ▼
        │  State:       Actions:
        │  - Query emb  - Expand neighborhood
        │  - Current    - Follow specific edge type
        │    graph pos  - Jump to community summary
        │  - Hops taken - Stop and synthesize
        │
        └── Reward: answer correctness on training QA set
            GRPO updates policy to prefer paths that led to
            correct answers

  TRAINING:
  - Environment: knowledge graph (static, pre-built)
  - Reward function: exact match / F1 on QA dataset
  - Policy: transformer that maps (query, graph_state) → action
  - Training data: multi-hop QA datasets (MuSiQue, HotpotQA)

  INFERENCE:
  Query → trained agent → autonomous traversal → answer
  Agent decides: how many hops, which edge types to follow,
  when to use community summaries vs. raw entity data

  ─────────────────────────────────────────────────────────────
  RESULTS (2026):
  +15% over static GraphRAG on multi-hop QA benchmarks
  Particularly strong on 3+ hop questions where static
  heuristics fail to identify the correct traversal path
```

Graph-R1 represents the shift from rule-based to learned graph traversal. The RL agent discovers traversal strategies that human engineers would not have encoded manually.

---

## Cost and Scale Considerations

Building a graph index involves many LLM calls. Understanding the cost model helps decide whether GraphRAG is justified for a given corpus.

```
  GRAPHRAG INDEX BUILD COST MODEL
  ─────────────────────────────────────────────────────────────

  Cost driver: LLM calls for entity extraction + community summaries

  Entity extraction:
    Input: each text chunk (500 tokens)
    Output: entities + relationships (JSON, ~300 tokens)
    Cost per chunk: ~800 tokens × $0.001/1K = $0.0008

  Typical extraction yield per page:
    1 document page ≈ 500 tokens
    1 page → 5-15 entities
    1 page → 3-8 relationships
    Each entity/relationship: ~2 LLM passes (extract + deduplicate)

  ─────────────────────────────────────────────────────────────
  WORKED EXAMPLE: 1,000-page corpus

  Chunks:         1,000 pages × 1 chunk/page = 1,000 chunks
  Extraction:     1,000 calls × $0.0008       = $0.80
  Entities:       1,000 × 10 avg             = 10,000 entities
  Deduplication:  ~20% merge rate             → ~8,000 unique

  Community detection (Leiden): free (CPU algorithm)
  Community count: ~80 communities (Leiden, default resolution)
  Community summaries (4 levels):
    80 communities × 4 levels × 400 tokens = 128,000 tokens
    128,000 × $0.001/1K = $0.13

  TOTAL BUILD COST: ~$0.93 for 1,000 pages
  (Using claude-haiku at $0.80/MTok input, $4/MTok output)
  ─────────────────────────────────────────────────────────────

  Scaling:
    10,000 pages:   ~$9.30
    100,000 pages:  ~$93
    1,000,000 pages: ~$930 (consider incremental updates)
```

**When the build cost is justified:**

```
  WORTH IT:
  - The graph enables queries that vector search CANNOT answer
    (multi-hop relationships, global corpus synthesis)
  - Corpus is stable (built once, queried many times)
  - High-value domain (legal, biomedical, enterprise knowledge base)
    where retrieval errors are expensive

  NOT WORTH IT:
  - Simple FAQ or customer support (vector RAG is sufficient)
  - Real-time corpus (graph rebuild too slow for live updates)
  - Small corpus (<100 docs) — just use long-context LLM
  - General prose without clear entity relationships
```

**Incremental graph updates — avoiding full rebuild:**

```python
def add_documents_to_graph(
    new_chunks: list[str],
    existing_graph: KnowledgeGraph,
    existing_community_summaries: list[str],
) -> KnowledgeGraph:
    """
    Add new documents to an existing graph without full rebuild.

    Strategy:
    1. Extract entities/relations from new chunks only
    2. Merge new entities into existing graph
       (entity deduplication by name matching)
    3. Run community detection on merged graph
    4. Regenerate summaries ONLY for communities that changed
       (community change detection by membership diff)

    This avoids O(total_corpus) LLM calls on each update.
    Rebuild cost = O(new_chunks + changed_communities)
    """
    print(f"Adding {len(new_chunks)} new chunks to existing graph...")

    # Track existing community memberships for change detection
    old_communities = existing_graph.get_community_entities()
    old_membership = {
        entity: i
        for i, community in enumerate(old_communities)
        for entity in community
    }

    # Add new chunks (entity extraction only)
    for i, chunk in enumerate(new_chunks):
        existing_graph.add_chunk(chunk, f"new_chunk_{i}")

    # Re-detect communities on merged graph
    new_communities = existing_graph.get_community_entities()

    # Find which communities changed membership
    changed_community_indices = []
    for i, community in enumerate(new_communities):
        for entity in community:
            old_community_idx = old_membership.get(entity)
            if old_community_idx is None or old_community_idx != i:
                changed_community_indices.append(i)
                break

    print(f"  {len(changed_community_indices)} communities require summary regeneration")

    # Regenerate summaries only for changed communities
    for idx in changed_community_indices:
        new_summary = summarize_community(new_communities[idx], existing_graph)
        if idx < len(existing_community_summaries):
            existing_community_summaries[idx] = new_summary
        else:
            existing_community_summaries.append(new_summary)

    return existing_graph
```

---

## When to Use Graph RAG

```
  USE GRAPH RAG WHEN:                    AVOID GRAPH RAG WHEN:
  ──────────────────────────────────     ──────────────────────────────
  Queries need entity relationships      Documents are unrelated prose
  "How is X connected to Y?"            No clear entities/relationships
  Multi-hop reasoning required           Questions about specific passages
  Global corpus summarization            Small corpus (<100 docs)
  Knowledge bases (org charts,           Real-time/streaming data
    drug interactions, org hierarchy)    Very short latency required
  Research literature (citations,        Numerical/statistical queries
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

## Comparison: GraphRAG Variants and Related Approaches

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

  ┌──────────────────┬──────────────┬─────────────┬─────────────┐
  │                  │  GraphRAG    │  NodeRAG    │  HippoRAG   │
  ├──────────────────┼──────────────┼─────────────┼─────────────┤
  │ Build cost       │ High         │ Low         │ Medium      │
  │ Multi-hop QA     │ Good         │ Best        │ Best        │
  │ Global synthesis │ Best         │ Good        │ Poor        │
  │ Associative mem  │ No           │ No          │ Yes (PPR)   │
  │ Query latency    │ High         │ Low         │ Medium      │
  │ Recommended      │ Global Q     │ Narrow Q    │ Multi-hop   │
  │ for              │             │ efficiency  │ reasoning   │
  └──────────────────┴──────────────┴─────────────┴─────────────┘
```

---

## See Also

- [Vectorless RAG Hub](../pageindex-vectorless-rag) — all vectorless approaches overview
- [BM25 & Sparse Retrieval](../bm25-sparse-retrieval) — keyword retrieval for exact term matching
- [Contextual Retrieval](../contextual-retrieval) — Anthropic's hybrid chunk contextualization
- [Agentic RAG](../agentic-rag) — multi-step retrieval agents that can combine graph + vector
- [Advanced RAG](../advanced-rag) — RAPTOR (hierarchical summaries, similar to GraphRAG communities)
