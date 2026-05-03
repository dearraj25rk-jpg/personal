---
title: "LangChain: Deep Reference Guide"
---

### Architecture · Patterns · Production · v1.1

> **Audience:** This guide assumes Python proficiency, familiarity with LLM APIs, and working knowledge of RAG systems. It does not hand-hold on Python syntax — it goes directly into LangChain mechanics, decision rationale, and production trade-offs. Every section connects back to real production use cases.

---

## 1. Mental Model & Core Philosophy

### What LangChain Actually Is

LangChain is not a magical AI framework — it is a **standardisation layer** over patterns that already exist in every LLM application. If you have ever written code that: formats a string prompt, calls an LLM API, extracts text from the response, passes that text to a vector database query, and feeds the results back into another prompt — you have already implemented LangChain. You just did it without the vocabulary.

The framework's value is in three areas. First, **interface standardisation**: every model provider, every vector store, every retriever, every loader exposes the same Python interface regardless of the underlying vendor. You can swap Claude for GPT-4, or ChromaDB for Pinecone, with a one-line change. Second, **composition primitives**: the `|` pipe operator and the `Runnable` interface let you chain arbitrarily complex pipelines without writing glue code. Third, **battle-tested abstractions**: patterns like hybrid search, multi-query retrieval, and contextual compression have been implemented, tested, and optimised once so you don't have to.

What LangChain is **not** is an oracle. It does not make your prompts better. It does not improve retrieval quality by itself. It does not make your agents smarter. All of those outcomes still depend on your design decisions. LangChain just ensures that when you make good decisions, they compose cleanly.

### The Three-Layer Mental Model

Think of every LangChain application as operating across three layers.

The **data layer** is everything before the LLM sees anything: loading documents, splitting them into chunks, embedding them, storing them in vector indexes, and retrieving relevant chunks at query time. This is the `langchain-text-splitters`, `langchain-community` (loaders), and vectorstore packages.

The **orchestration layer** is the chain itself: prompt templates that structure the LLM's input, the model call, and output parsers that transform the response. This is `langchain-core` and `langchain`. LCEL lives here.

The **agent layer** is where the LLM takes control: tools that the model can call, a loop that feeds tool results back to the model, and memory that persists state across turns. This is `langgraph` and the agent utilities in `langchain`.

Most RAG applications primarily operate in the data and orchestration layers. Agentic RAG extends into the agent layer.

---

## 2. Ecosystem & Package Architecture

### The Package Split (v1.1 — Current as of May 2026)

LangChain v1.0, released October 2025 (v1.1 March 2026), completed a major restructuring that had been underway since v0.1. Understanding this split is mandatory before writing any code, because importing from the wrong package is a frequent source of `ImportError` and unexpected behaviour.

```
langchain-core          # Base abstractions: Runnable, BaseMessage, BaseLanguageModel, BaseRetriever
    │                   # Pure interfaces — no concrete implementations, minimal dependencies
    │
    ├── langchain       # Chains, retrievers, memory, agents (high-level composition)
    │       │
    │       ├── langchain-anthropic     # Claude-specific: ChatAnthropic, AnthropicEmbeddings
    │       ├── langchain-openai        # OpenAI-specific: ChatOpenAI, OpenAIEmbeddings
    │       ├── langchain-voyageai      # Voyage AI embeddings
    │       ├── langchain-chroma        # ChromaDB vectorstore
    │       ├── langchain-google-*      # Google integrations
    │       └── (30+ first-party partner packages)
    │
    ├── langchain-community  # 500+ community integrations (loaders, tools, vectorstores)
    │                        # Less stable, higher maintenance burden, slower updates
    │
    ├── langchain-text-splitters  # Document chunking utilities (separated for lighter install)
    │
    └── langgraph           # Stateful, cyclic graph execution — separate from langchain
                            # Built on langchain-core but architecturally independent
```

The critical design decision here is that `langchain-core` has zero LLM-specific dependencies. It defines the `Runnable` abstract base class, the `BaseMessage` hierarchy, and the `BaseLanguageModel` interface. This means you can build custom Runnables, custom retrievers, and entire pipeline architectures without importing any LLM provider code. This separation enables clean unit testing.

**Provider packages vs community**: when a provider-specific package exists (like `langchain-anthropic`, `langchain-voyageai`, `langchain-chroma`), always prefer it over the `langchain-community` equivalent. Provider packages are maintained by the vendor or a dedicated team, have stricter typing, get security updates faster, and expose provider-specific features. The community package is a catch-all that often lags behind.

### Installation Strategy

For an MyApp-like stack, the minimal production install is:

```bash
# Core + orchestration
pip install langchain langchain-core langchain-text-splitters  # 1.0.3 / 1.2.20

# Your specific providers
pip install langchain-anthropic      # 1.4 — Claude claude-3-7-sonnet-latest, etc. (Sonnet for generation, Haiku for classification)
pip install langchain-voyageai       # voyage-3.5 embeddings
pip install langchain-chroma         # 1.1.0

# Advanced workflows
pip install langgraph                # 1.1.0 — type-safe streaming v2, CRAG, multi-agent

# Community integrations (loaders, BM25)
pip install langchain-community      # PyPDFLoader, BM25Retriever, etc.
# Legacy: all deprecated classes (LLMChain, AgentExecutor, old chains)
# pip install langchain-classic  # preserves 0.x APIs unchanged


# Cross-encoder for reranking (HuggingFace)
pip install sentence-transformers    # cross-encoder/ms-marco-MiniLM-L-6-v2
```

You can verify the installed versions with `pip show langchain langchain-core langgraph`. Version alignment matters — `langchain` and `langchain-core` should be from the same release cycle.

### Version Compatibility Matrix (v1.1 — March 2026)

| langchain | langchain-core | langgraph  | Python  |
|-----------|---------------|-----------|--------|
| 1.0.x     | 1.2.x         | 1.1.x     | 3.10+  |
| 0.3.x     | 0.3.x         | 0.2.x     | 3.9+   |

The old `LLMChain`, `SequentialChain`, `ConversationalRetrievalChain`, and `RetrievalQA` classes have been **moved to `langchain-classic`** as of v1.0. They are no longer in the main `langchain` package. Every guide that uses these is outdated — LCEL and `create_agent` replace all of them.

### Recommended Model IDs (May 2026)

| Task | Model | Package |
|------|-------|--------|
| Main agent / complex reasoning | `claude-sonnet-4-6` | `langchain-anthropic` |
| High-stakes / long doc analysis | `claude-opus-4-6` | `langchain-anthropic` |
| Fast classification / grading | `claude-haiku-4-5` | `langchain-anthropic` |
| Embeddings | `voyage-3.5` | `langchain-voyageai` |

```python
from langchain.chat_models import init_chat_model

# Standard pattern (May 2026)
sonnet = init_chat_model("anthropic:claude-sonnet-4-6", temperature=0.0)
opus   = init_chat_model("anthropic:claude-opus-4-6",  temperature=0.0)
haiku  = init_chat_model("anthropic:claude-haiku-4-5", temperature=0.0)
```

---

## 3. The Runnable Interface — LCEL Core

### What a Runnable Is

Every component in LangChain — models, prompts, output parsers, retrievers, custom functions — implements the `Runnable` abstract base class from `langchain_core.runnables`. This is the single most important concept in modern LangChain because it is what makes the `|` pipe operator work.

The `Runnable` interface specifies these methods:

```python
from langchain_core.runnables import Runnable
from typing import Any, AsyncIterator, Iterator

class Runnable:
    # Synchronous execution — single input, single output
    def invoke(self, input: Any, config: RunnableConfig | None = None) -> Any: ...
    
    # Synchronous streaming — yields chunks progressively
    def stream(self, input: Any, config: RunnableConfig | None = None) -> Iterator[Any]: ...
    
    # Parallel batch execution — list of inputs, list of outputs
    def batch(self, inputs: list[Any], config: RunnableConfig | None = None) -> list[Any]: ...
    
    # Async variants of all three
    async def ainvoke(self, input: Any, ...) -> Any: ...
    async def astream(self, input: Any, ...) -> AsyncIterator[Any]: ...
    async def abatch(self, inputs: list[Any], ...) -> list[Any]: ...
    
    # Composition operators
    def __or__(self, other: Runnable) -> RunnableSequence: ...   # enables the | operator
    def __ror__(self, other: Runnable) -> RunnableSequence: ...  # enables dict | runnable
```

When you write `prompt | model | parser`, Python calls `prompt.__or__(model)` which returns a `RunnableSequence(steps=[prompt, model])`. Then it calls `RunnableSequence.__or__(parser)` which returns `RunnableSequence(steps=[prompt, model, parser])`. Nothing executes during composition — it is purely declarative. Execution happens when you call `.invoke()`, `.stream()`, or `.batch()`.

### Type Flow Through a Chain

One of the most important debugging skills in LangChain is knowing what type flows out of each component. Mismatched types are the most common source of `TypeError` in chains.

```
ChatPromptTemplate.invoke(dict) → ChatPromptValue
ChatPromptValue is automatically converted to List[BaseMessage] by the model

ChatAnthropic.invoke(List[BaseMessage]) → AIMessage
AIMessage has fields: .content (str), .tool_calls (list), .response_metadata (dict)

StrOutputParser.invoke(AIMessage) → str
JsonOutputParser.invoke(AIMessage) → dict
PydanticOutputParser.invoke(AIMessage) → YourPydanticModel

VectorStoreRetriever.invoke(str) → List[Document]
Document has fields: .page_content (str), .metadata (dict)

RunnableLambda(fn).invoke(any) → fn(any)  # whatever your function returns
```

### LCEL Composition Patterns

**Linear sequence** — the fundamental pattern:

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

chain = (
    ChatPromptTemplate.from_template("Answer: {question}")
    | ChatAnthropic(model="claude-sonnet-4-6")
    | StrOutputParser()
)

# These are all equivalent invocations
result = chain.invoke({"question": "What is product domain?"})
result = chain.invoke("What is product domain?")  # single-variable templates accept str directly
```

**Dict passthrough** — runs branches in parallel before merging. This is the idiomatic RAG pattern:

```python
from langchain_core.runnables import RunnablePassthrough

rag_chain = (
    {
        "context": retriever | format_docs,  # branch 1: retrieve + format
        "question": RunnablePassthrough(),   # branch 2: pass input unchanged
    }
    | rag_prompt   # receives dict {"context": "...", "question": "..."}
    | model
    | StrOutputParser()
)
```

The dict shorthand `{key: runnable}` is syntactic sugar for `RunnableParallel({key: runnable})`. Both branches execute concurrently.

**Assign** — adds fields to a dict without replacing:

```python
from langchain_core.runnables import RunnablePassthrough

# Input: {"question": "..."}
# After assign: {"question": "...", "context": [...], "standalone_question": "..."}
chain = (
    RunnablePassthrough.assign(
        context=lambda x: retriever.invoke(x["question"]),
        standalone_question=lambda x: rewriter.invoke(x["question"])
    )
    | rag_prompt
    | model
    | StrOutputParser()
)
```

**Configuration** — pass runtime configuration without changing chain structure:

```python
from langchain_core.runnables import RunnableConfig

# Different temperature for different use cases
config: RunnableConfig = {
    "configurable": {"temperature": 0.0},  # for factual queries
    "callbacks": [my_tracer],
    "tags": ["production", "insure-chat"],
    "metadata": {"user_id": "raj-001"},
    "max_concurrency": 5,  # for .batch()
}

result = chain.invoke({"question": "..."}, config=config)
```

### RunnableConfig in Depth

`RunnableConfig` is passed through every step of a chain. Key fields:

| Field | Type | Purpose |
|-------|------|---------|
| `configurable` | `dict` | Runtime-configurable values (model params, thresholds, etc.) |
| `callbacks` | `list[BaseCallbackHandler]` | Tracing, logging, LangSmith |
| `tags` | `list[str]` | Tag this run for filtering in LangSmith |
| `metadata` | `dict` | Arbitrary metadata attached to traces |
| `run_name` | `str` | Human-readable name for the run in traces |
| `max_concurrency` | `int` | Max parallel executions in `.batch()` |
| `recursion_limit` | `int` | For LangGraph: max graph recursion depth |

---

## 4. LLM & Chat Model Wrappers

### Chat Models vs LLMs

LangChain distinguishes between `BaseLLM` (text-in, text-out, old completion models) and `BaseChatModel` (messages-in, message-out, modern chat models). Claude, GPT-4, Gemini are all chat models. You will almost never use `BaseLLM` directly in 2025.

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

model = ChatAnthropic(
    model="claude-sonnet-4-6",   # model identifier
    api_key=os.getenv("ANTHROPIC_API_KEY"),  # or set ANTHROPIC_API_KEY env var
    temperature=0.0,          # 0.0 for factual/RAG, 0.3-0.7 for creative
    max_tokens=4096,          # max output tokens
    timeout=60,               # request timeout in seconds
    max_retries=3,            # automatic retry on rate limits/errors
    stop_sequences=["</answer>"],  # stop generation at these strings
)

# Invoke with message list (low-level)
response: AIMessage = model.invoke([
    SystemMessage(content="You are an domain expert."),
    HumanMessage(content="What is threshold?"),
])

print(response.content)          # text of the response
print(response.response_metadata) # token counts, model name, stop reason
print(response.usage_metadata)    # {"input_tokens": 42, "output_tokens": 156}
```


### `init_chat_model` — Provider-Agnostic Factory (v1.0+)

LangChain 1.0 introduced `init_chat_model` as the preferred provider-agnostic way
to instantiate models — particularly useful in multi-provider or A/B-testing setups:

```python
from langchain.chat_models import init_chat_model

# Infers provider from model string prefix
model = init_chat_model("anthropic:claude-sonnet-4-6", temperature=0.0)
model = init_chat_model("openai:gpt-4o", temperature=0.0)
model = init_chat_model("google_genai:gemini-2.0-flash", temperature=0.0)

# All produce a ChatModel implementing the same Runnable interface
chain = prompt | model | StrOutputParser()
```

`ChatAnthropic(model=...)` remains fully valid and preferred when you need
provider-specific parameters (e.g., `thinking`, `betas`).

### Model Selection Strategy for MyApp

Claude 3.5 Sonnet is the right choice for primary response generation — it has the best instruction following, longest effective context, and best structured output compliance. Claude 3 Haiku is the right choice for classification, query rewriting, and document grading — it is 13× cheaper and nearly as good for short structured tasks.

```python
# For RAG generation, complex reasoning, structured extraction
sonnet = ChatAnthropic(model="claude-sonnet-4-6", temperature=0.0)

# For intent classification, query rewriting, document grading
haiku = ChatAnthropic(model="claude-3-haiku-20240307", temperature=0.0)

# Cost-optimised: use haiku for intermediate steps, sonnet only for final response
# MyApp classification step: ~50 input tokens, ~5 output = $0.000025 per call (Haiku)
# MyApp generation step: ~2000 input tokens, ~500 output = $0.009 per call (Sonnet)
```

### Structured Output — `.with_structured_output()`

This is the most reliable way to get structured data from Claude. It uses Claude's native tool-calling mechanism (which is constrained at the API level) rather than prompting the model to format its output (which it can deviate from).

```python
from pydantic import BaseModel, Field
from typing import Literal, Optional

class InsuranceIntent(BaseModel):
    """Classification of user intent in an chatbot."""
    intent: Literal["REQUESTS", "COVERAGE", "RENEWAL", "PRICING", "COMPLAINT", "OTHER"]
    confidence: float = Field(ge=0.0, le=1.0, description="Confidence score 0-1")
    sub_intent: Optional[str] = Field(default=None, description="More specific intent label if applicable")
    requires_agent: bool = Field(description="Whether this needs a human agent")

# Bind the schema to the model — uses function calling under the hood
structured_haiku = ChatAnthropic(model="claude-3-haiku-20240307").with_structured_output(
    InsuranceIntent,
    method="function_calling",  # default for Claude; also "json_mode" supported
    include_raw=False,          # True returns {"raw": AIMessage, "parsed": model, "parsing_error": ...}
)

# Returns an InsuranceIntent object — guaranteed to be valid or raises ValidationError
intent: InsuranceIntent = structured_haiku.invoke(
    "I had an accident last night and I need to file a request urgently"
)

print(intent.intent)           # → "REQUESTS"
print(intent.confidence)       # → 0.97
print(intent.requires_agent)   # → True
```

When `include_raw=True`, you get access to the underlying `AIMessage` so you can inspect token usage even when structured output is active. This is useful for cost tracking.

### Configurable Models — Runtime Switching

For cases where you want to expose the model choice as a configurable parameter (useful for A/B testing or multi-tenant scenarios):

```python
from langchain_core.runnables import ConfigurableField

model = ChatAnthropic(model="claude-sonnet-4-6").configurable_fields(
    model=ConfigurableField(
        id="model",
        name="Claude Model",
        description="The Claude model to use for generation",
    )
)

# Use sonnet by default
result = chain.invoke({"question": "..."})

# Override to haiku for this specific call
result = chain.invoke(
    {"question": "..."},
    config={"configurable": {"model": "claude-3-haiku-20240307"}}
)
```

---

## 5. Prompt Templates — All Patterns

### Template Types and When to Use Each

`PromptTemplate` produces a single formatted string — it is the pre-chat-model pattern and you will rarely use it directly with Claude. `ChatPromptTemplate` produces a list of `BaseMessage` objects with roles, which is the correct format for all modern chat models. `FewShotChatMessagePromptTemplate` injects example input/output pairs. `MessagesPlaceholder` inserts a variable-length message list (for conversation history).

### ChatPromptTemplate in Depth

```python
from langchain_core.prompts import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
    AIMessagePromptTemplate,
    MessagesPlaceholder,
)
from langchain_core.messages import SystemMessage, HumanMessage

# Method 1: Tuple shorthand (most readable)
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are MyApp. Today's date: {date}. Market: {market}."),
    ("human", "{question}"),
])

# Method 2: Message object list (for messages with no variables)
prompt = ChatPromptTemplate.from_messages([
    SystemMessage(content="You are MyApp."),
    HumanMessagePromptTemplate.from_template("{question}"),
])

# Method 3: With conversation history placeholder
# This is the pattern for multi-turn chat
prompt_with_history = ChatPromptTemplate.from_messages([
    ("system", """You are MyApp, a domain assistant.
You have access to the following record context:
{context}

Instructions:
- Answer only from the provided context
- If information is not in context, say "I don't have that information"
- Always cite the section of the reference document
- For requests, always ask for the record ID if not provided"""),
    MessagesPlaceholder(variable_name="chat_history"),  # list[BaseMessage] injected here
    ("human", "{question}"),
])

# Invoke to inspect what gets sent to the model
messages = prompt_with_history.invoke({
    "context": "Section 5.2: Standard threshold is $500...",
    "chat_history": [
        HumanMessage(content="What is my threshold?"),
        AIMessage(content="Your standard threshold is $500 for at-fault requests."),
    ],
    "question": "What about non-fault requests?",
})

print(messages.to_messages())
# → [SystemMessage(...), HumanMessage("What is my threshold?"), AIMessage("..."), HumanMessage("What about non-fault?")]
```

### FewShotChatMessagePromptTemplate — For Classification

This is the cleanest way to implement few-shot classification. It is superior to manually constructing example strings because it respects the chat message format (the model sees examples as real turns, not embedded strings):

```python
from langchain_core.prompts import FewShotChatMessagePromptTemplate

# Define your examples
examples = [
    {"input": "I want to file a request for my accident yesterday",   "output": "REQUESTS"},
    {"input": "Does my record cover overseas medical expenses?",     "output": "COVERAGE"},
    {"input": "My price renewal is next month, what are my options?", "output": "RENEWAL"},
    {"input": "How much would product domain cost for a 35-year-old?", "output": "PRICING"},
    {"input": "I've been waiting 3 weeks for my request to be processed", "output": "COMPLAINT"},
    {"input": "Can you explain what spec means?",                    "output": "OTHER"},
]

# Template for formatting each individual example as a human/ai exchange
example_prompt = ChatPromptTemplate.from_messages([
    ("human", "{input}"),
    ("ai", "{output}"),
])

# The few-shot template itself
few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt,
    examples=examples,
    # Optional: example_selector for dynamic selection (see below)
)

# Final prompt: system + examples + actual query
classifier_prompt = ChatPromptTemplate.from_messages([
    ("system", "Classify customer intent. Respond with exactly one label."),
    few_shot_prompt,  # expands to all the example pairs
    ("human", "{query}"),
])

# Compose with Haiku (cheap, fast for classification)
classifier = classifier_prompt | ChatAnthropic(model="claude-3-haiku-20240307") | StrOutputParser()
label = classifier.invoke({"query": "I need to add my wife to my product record"})
# → "COVERAGE"
```

### Dynamic Example Selection with SemanticSimilarityExampleSelector

When your example bank grows beyond ~10 examples, injecting all of them wastes tokens. The `SemanticSimilarityExampleSelector` picks the `k` most semantically relevant examples for each query:

```python
from langchain_core.example_selectors import SemanticSimilarityExampleSelector
from langchain_chroma import Chroma
from langchain_voyageai import VoyageAIEmbeddings

# Build a vectorstore of examples
selector = SemanticSimilarityExampleSelector.from_examples(
    examples=examples,            # your example dicts
    embeddings=VoyageAIEmbeddings(model="voyage-3-5"),
    vectorstore_cls=Chroma,
    k=3,                          # return 3 most similar examples
)

few_shot_prompt = FewShotChatMessagePromptTemplate(
    example_prompt=example_prompt,
    example_selector=selector,    # selector replaces static examples list
    input_variables=["query"],    # variables that selector uses for similarity search
)
```

### Partial Templates — Pre-filling Variables

Partial templates let you lock in some variables at build time (computed once) while leaving others for runtime:

```python
from datetime import datetime, timezone

base_prompt = ChatPromptTemplate.from_messages([
    ("system", "You are MyApp. Date: {date}. Environment: {env}. Version: {version}."),
    MessagesPlaceholder("chat_history"),
    ("human", "{question}"),
])

# Pre-fill date and environment at startup — these don't change per request
request_prompt = base_prompt.partial(
    date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
    env=os.getenv("ENVIRONMENT", "production"),
    version="3.0.0",
)

# At request time, only supply chat_history and question
messages = request_prompt.invoke({
    "chat_history": [],
    "question": "What is my threshold?",
})
```

### Prompt Serialisation — Saving and Loading

LangChain prompts can be serialised to JSON/YAML for version control. This is valuable for production prompt management:

```python
# Save prompt to disk
prompt.save("prompts/rag_prompt_v3.json")

# Load prompt from disk
from langchain_core.prompts import load_prompt
loaded_prompt = load_prompt("prompts/rag_prompt_v3.json")
```

---

## 6. Output Parsers — All Types

### The Parser Taxonomy

Output parsers sit at the end of a chain and transform raw `AIMessage` output into structured Python types. Every parser implements `Runnable` so it composes with `|`. Each parser has two key methods: `.parse(text)` (direct parse from string) and `.get_format_instructions()` (returns text to inject into the prompt so the model knows what format to produce).

**When to use which parser:**

| Parser | Use Case | Reliability | Cost |
|--------|----------|-------------|------|
| `StrOutputParser` | Chat responses, general text | Perfect | Lowest |
| `with_structured_output()` | Structured extraction (preferred) | Excellent | Low (uses tool call) |
| `PydanticOutputParser` | Structured extraction (fallback) | Good | Low |
| `JsonOutputParser` | When model returns arbitrary JSON | Good | Low |
| `JsonOutputToolsParser` | When using tool calling in LCEL | Excellent | Low |
| `CommaSeparatedListOutputParser` | Keyword lists, options | Good | Lowest |
| `NumberedListOutputParser` | Numbered action lists | Good | Lowest |
| `XMLOutputParser` | XML-formatted responses | Good | Low |
| `EnumOutputParser` | Fixed category classification | Good | Lowest |
| `DatetimeOutputParser` | Date extraction from text | Moderate | Low |
| `PandasDataFrameOutputParser` | Tabular data extraction | Moderate | Moderate |

### StrOutputParser — The Default

```python
from langchain_core.output_parsers import StrOutputParser

# Extracts .content from AIMessage as a plain string
parser = StrOutputParser()

# Behaviour with different input types:
parser.invoke(AIMessage(content="Hello"))           # → "Hello"
parser.invoke("Already a string")                   # → "Already a string" (pass-through)
parser.invoke(AIMessage(content=[{"type": "text", "text": "Hi"}]))  # → "Hi" (handles list content)
```

### PydanticOutputParser — Validated Structured Extraction

```python
from langchain_core.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal

class RecordClause(BaseModel):
    """A single coverage clause extracted from a reference document."""
    clause_id: str = Field(description="Unique clause identifier (e.g., 'SEC-5-2')")
    title: str = Field(description="Short descriptive title of the clause")
    coverage_type: Literal["INCLUSION", "EXCLUSION", "CONDITION"] = Field(
        description="Whether this clause adds, removes, or conditions coverage"
    )
    amount: Optional[float] = Field(default=None, description="Dollar amount if applicable (USD)")
    applies_to: List[str] = Field(default_factory=list, description="List of request types this clause applies to")
    
    @field_validator("clause_id")
    @classmethod
    def validate_clause_id(cls, v):
        if not v.startswith(("SEC-", "CLS-", "APP-")):
            raise ValueError(f"clause_id must start with SEC-, CLS-, or APP-. Got: {v}")
        return v.upper()

parser = PydanticOutputParser(pydantic_object=RecordClause)

# CRITICAL: Inject format instructions into your prompt
# Without this, the model doesn't know what JSON schema to produce
format_instructions = parser.get_format_instructions()
# Produces something like:
# "The output should be formatted as a JSON instance that conforms to the JSON schema below.
# {"properties": {"clause_id": {"title": "Clause Id", "type": "string"}, ...}}"

prompt = ChatPromptTemplate.from_messages([
    ("system", "Extract record clauses. {format_instructions}"),
    ("human", "Extract the coverage clause from: {text}"),
]).partial(format_instructions=format_instructions)

chain = prompt | ChatAnthropic(model="claude-sonnet-4-6") | parser

result: RecordClause = chain.invoke({
    "text": "Section 5.2: The standard threshold for at-fault request handling is $500."
})
```

### JsonOutputParser — Streaming-Compatible Structured Output

`JsonOutputParser` is particularly useful when you need to stream structured output, because it is a **partial JSON parser** that yields incremental Python objects as chunks arrive:

```python
from langchain_core.output_parsers import JsonOutputParser

parser = JsonOutputParser()

# Stream a JSON response and get incremental updates
for partial_result in (prompt | model | parser).stream(input):
    print(partial_result)
# Output as tokens arrive:
# {}
# {"title": ""}
# {"title": "Comprehensive"}
# {"title": "Comprehensive Motor"}
# {"title": "Comprehensive Motor", "threshold": 500}
# (final complete dict)
```

### OpenAI-style Tool Parsers

When using tool calling in LCEL (vs `.with_structured_output()`), use these specialised parsers:

```python
from langchain_core.output_parsers.openai_tools import (
    JsonOutputToolsParser,       # returns list of {"type": "tool_call", "name": ..., "args": ...}
    PydanticToolsParser,         # returns list of Pydantic model instances
)
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool

@tool
def get_record(record_id: str) -> str:
    """Get record details by number."""
    return f"Record {record_id}: Motor Comprehensive"

# Bind tools to model (explicit tool calling, not agent mode)
model_with_tools = ChatAnthropic(model="claude-sonnet-4-6").bind_tools(
    [get_record],
    tool_choice="auto",   # "auto" | "any" | "none" | {"type": "tool", "name": "..."}
)

# Parse tool calls from the response
parser = PydanticToolsParser(tools=[get_record])
chain = prompt | model_with_tools | parser
```

---

## 7. Runnable Primitives

### RunnablePassthrough — Transparent Data Flow

`RunnablePassthrough` passes its input to the output unchanged. Its primary use is in the parallel dict pattern where you need the original input alongside computed values:

```python
from langchain_core.runnables import RunnablePassthrough

# In a RAG chain, you need both the retrieved context AND the original question
# Input to this dict: "What is my threshold?"
rag_input = {
    "context": retriever | RunnableLambda(format_docs),  # runs retriever, formats result
    "question": RunnablePassthrough(),                   # passes "What is my threshold?" unchanged
}
# Output of this dict: {"context": "Section 5.2...", "question": "What is my threshold?"}

# RunnablePassthrough.assign() — adds keys to an existing dict without replacing
enriched = RunnablePassthrough.assign(
    context=lambda x: retriever.invoke(x["question"]),    # adds "context" key
    date=lambda x: datetime.now().isoformat(),            # adds "date" key
    # "question" key from input is preserved automatically
)
```

### RunnableLambda — Arbitrary Python Functions

`RunnableLambda` wraps any Python callable as a `Runnable`. This is your primary tool for injecting custom logic — PII masking, logging, format conversion, business logic — into a chain:

```python
from langchain_core.runnables import RunnableLambda

# Simple wrapping
format_docs = RunnableLambda(lambda docs: "\n\n".join(d.page_content for d in docs))

# With error handling — important for production
def safe_parse_date(text: str) -> str:
    try:
        from dateutil import parser
        return parser.parse(text).isoformat()
    except Exception:
        return text  # return original if parsing fails

safe_date_parser = RunnableLambda(safe_parse_date)

# The @chain decorator — equivalent to RunnableLambda but with type annotation support
from langchain_core.runnables import chain

@chain
def mask_pii(text: str) -> str:
    """Runs Microsoft Presidio PII detection and masking."""
    # presidio_analyzer and presidio_anonymizer logic here
    return anonymized_text

@chain
async def async_db_lookup(record_id: str) -> dict:
    """Async database lookup — works with ainvoke/astream."""
    async with AsyncSession() as session:
        result = await session.get(Record, record_id)
        return result.to_dict()

# Both work identically in chains despite one being sync, one async
chain = mask_pii | rag_chain | async_db_lookup
```

### RunnableParallel — Concurrent Execution

`RunnableParallel` executes multiple Runnables simultaneously and returns a dict of their results. It is IO-bound, so concurrent HTTP calls (to APIs, vector stores) happen in parallel threads:

```python
from langchain_core.runnables import RunnableParallel

# Retrieve from two collections simultaneously
dual_retrieval = RunnableParallel({
    "app_docs": record_retriever,           # retrieves from record collection
    "faq_docs": faq_retriever,                 # retrieves from FAQ collection simultaneously
    "question": RunnablePassthrough(),
})

# Both retrieval calls execute in parallel — ~2× faster than sequential
result = dual_retrieval.invoke("What is covered under comprehensive product?")
# → {"app_docs": [...], "faq_docs": [...], "question": "What is covered..."}

# Merge the results before passing to prompt
def merge_docs(x):
    all_docs = x["app_docs"] + x["faq_docs"]
    # Deduplicate by content hash
    seen = set()
    unique = [d for d in all_docs if (h := hash(d.page_content)) not in seen and not seen.add(h)]
    return "\n\n".join(d.page_content for d in unique[:5])

chain = dual_retrieval | RunnableLambda(merge_docs) | rag_prompt | model | StrOutputParser()
```

### RunnableBranch — Conditional Routing

`RunnableBranch` evaluates conditions in order and routes to the first matching branch:

```python
from langchain_core.runnables import RunnableBranch

# Route between specialised prompts based on classified intent
branch = RunnableBranch(
    # (condition_function, runnable_if_true) — evaluated in order
    (lambda x: x.get("intent") == "REQUESTS",    requests_chain),
    (lambda x: x.get("intent") == "PRICING",   pricing_chain),
    (lambda x: x.get("intent") == "RENEWAL",   renewal_chain),
    general_rag_chain,  # default — no condition, always matches
)

# Input must be a dict with "intent" key
result = branch.invoke({"intent": "REQUESTS", "question": "How do I file?"})
```

### RunnableWithFallbacks — Resilience

`RunnableWithFallbacks` tries the primary Runnable and falls back to alternatives on failure. Essential for production reliability:

```python
# Primary: Claude 3.5 Sonnet; fallback: Claude 3 Haiku
resilient_model = ChatAnthropic(model="claude-sonnet-4-6").with_fallbacks(
    [ChatAnthropic(model="claude-3-haiku-20240307")],
    exceptions_to_handle=(anthropic.RateLimitError, anthropic.APIStatusError),
)

# Primary RAG chain with fallback to simple LLM response
resilient_rag = rag_chain.with_fallbacks(
    [simple_chain],
    exceptions_to_handle=(Exception,),  # catch-all for RAG failures
)
```

### RunnableRetry — Automatic Retries

```python
# Retry flaky external tool calls
flaky_api_chain = (
    api_call_runnable
    .with_retry(
        stop_after_attempt=3,
        wait_exponential_jitter=True,   # exponential backoff with jitter
        retry_if_exception_type=(TimeoutError, ConnectionError),
    )
)
```

---

## 8. Document Loaders

### Architecture of Document Loaders

Every loader in LangChain returns `List[Document]` where each `Document` contains `page_content: str` and `metadata: dict`. The metadata is as important as the content because it enables filtering, citation, and traceability in RAG systems. Good metadata design is often the difference between a good and great RAG system.

Loaders come in two variants: `BaseLoader` (synchronous, `.load()`) and `BaseLoader` with async support (`.alazy_load()` for memory-efficient streaming). For large document sets, prefer lazy loading.

### PDF Loaders — Comparison

Multiple PDF loaders exist, each with different extraction capabilities:

```python
from langchain_community.document_loaders import (
    PyPDFLoader,            # fast, basic text extraction, one doc per page
    PyMuPDFLoader,          # faster, better formatting preservation
    PDFMinerLoader,         # best layout analysis, slowest
    UnstructuredPDFLoader,  # best for complex layouts (tables, multi-column)
    AmazonTextractPDFLoader, # for scanned PDFs via AWS Textract OCR
)

# PyPDFLoader — recommended for standard record PDFs
loader = PyPDFLoader(
    file_path="docs/spec_comprehensive_2024.pdf",
    extract_images=False,   # True uses pytesseract for OCR on embedded images
)
docs = loader.load()
# Returns one Document per page
# metadata: {"source": "docs/spec_...", "page": 0, "total_pages": 42}

# Lazy load for large PDFs (avoids loading all into memory at once)
for doc in loader.lazy_load():
    process_document(doc)

# PyMuPDFLoader — better for PDFs with tables or formatted text
loader = PyMuPDFLoader("docs/requests_guide.pdf")
docs = loader.load()
# metadata includes more detail: {"source": ..., "page": 0, "author": "...", "creationDate": ...}

# UnstructuredPDFLoader — best quality extraction, requires extra dependencies
# pip install "unstructured[pdf]"
loader = UnstructuredPDFLoader(
    "docs/complex_record.pdf",
    mode="elements",   # "single" (one doc) | "paged" (one per page) | "elements" (semantic elements)
    strategy="hi_res", # "auto" | "fast" | "hi_res" (hi_res uses layout detection model)
)
```

### Directory Loading with Parallelism

```python
from langchain_community.document_loaders import DirectoryLoader
from langchain_community.document_loaders import TextLoader

# Load all PDFs in a directory with parallel processing
loader = DirectoryLoader(
    path="./record_library/",
    glob="**/*.pdf",              # recursive glob pattern
    loader_cls=PyPDFLoader,       # loader to use for each file
    loader_kwargs={},             # kwargs passed to each loader instance
    show_progress=True,           # tqdm progress bar
    use_multithreading=True,      # parallel loading
    max_concurrency=8,            # thread pool size
    silent_errors=True,           # skip files that fail to load
    exclude=["**/archive/**"],    # exclude patterns
)

all_docs = loader.load()
print(f"Loaded {len(all_docs)} documents from {len(set(d.metadata['source'] for d in all_docs))} files")
```

### Web and URL Loaders

```python
from langchain_community.document_loaders import (
    WebBaseLoader,              # simple HTML fetching via BeautifulSoup
    RecursiveUrlLoader,         # crawls links recursively
    SitemapLoader,              # loads from sitemap.xml
    PlaywrightURLLoader,        # JavaScript-rendered pages (headless browser)
)

# WebBaseLoader — best for simple HTML pages
loader = WebBaseLoader(
    web_paths=["https://api.yourinsurer.com/docs", "https://api.yourinsurer.com/changelog"],
    header_template={"User-Agent": "MyApp/3.0 (RAG Indexer)"},
    verify_ssl=True,
    bs_get_text_kwargs={"separator": "\n", "strip": True},  # BeautifulSoup text extraction kwargs
)

# RecursiveUrlLoader — crawl entire documentation site
from langchain_community.document_loaders.recursive_url_loader import RecursiveUrlLoader

loader = RecursiveUrlLoader(
    url="https://api.yourinsurer.com/docs",
    max_depth=3,           # crawl 3 levels deep
    extractor=lambda x: BeautifulSoup(x, "html.parser").get_text(),
    prevent_outside=True,  # don't leave the base domain
    exclude_dirs=["/changelog", "/sitemap"],  # skip these paths
)
```

### Database and Structured Data Loaders

```python
from langchain_community.document_loaders import (
    JSONLoader,
    CSVLoader,
    DataFrameLoader,
    SQLDatabaseLoader,
)

# JSONLoader with jq schema for nested JSON
loader = JSONLoader(
    file_path="products.json",
    jq_schema=".products[] | {id: .id, name: .name, description: .description, coverage: .coverage_details[]}",
    text_content=False,    # False = include all fields as text; True = only text field
    metadata_func=lambda record, metadata: {**metadata, "product_id": record.get("id")},
)

# CSVLoader — one document per row
loader = CSVLoader(
    file_path="faq.csv",
    csv_args={"delimiter": ",", "quotechar": '"'},
    source_column="question",  # use this column as page_content
    metadata_columns=["category", "last_updated"],  # add these as metadata
    encoding="utf-8",
)

# DataFrameLoader — from a pandas DataFrame (useful for database query results)
import pandas as pd
df = pd.read_sql("SELECT * FROM record_faq WHERE active = 1", db_conn)
loader = DataFrameLoader(df, page_content_column="answer")
```

### Custom Loader — Implementing BaseLoader

For any data source not covered by existing loaders:

```python
from langchain_core.document_loaders import BaseLoader
from langchain_core.documents import Document
from typing import Iterator

class MyAppRecordLoader(BaseLoader):
    """Loads reference documents from the MyApp internal API."""
    
    def __init__(self, api_url: str, api_key: str, record_ids: list[str]):
        self.api_url = api_url
        self.api_key = api_key
        self.record_ids = record_ids
    
    def lazy_load(self) -> Iterator[Document]:
        """Yield Documents one at a time — memory efficient."""
        for record_id in self.record_ids:
            response = requests.get(
                f"{self.api_url}/policies/{record_id}",
                headers={"Authorization": f"Bearer {self.api_key}"},
            )
            data = response.json()
            yield Document(
                page_content=data["record_text"],
                metadata={
                    "source": f"record_api:{record_id}",
                    "record_id": record_id,
                    "product_type": data["product_type"],
                    "effective_date": data["effective_date"],
                    "market": data["market"],
                    "version": data["version"],
                },
            )
    
    def load(self) -> list[Document]:
        return list(self.lazy_load())
```

---

## 9. Text Splitters — Strategy Guide

### Why Chunking Strategy Matters More Than People Think

Chunking is not a preprocessing detail — it is a fundamental architectural decision that affects retrieval precision, context quality, and ultimately answer quality. The classic failure modes are:

**Chunks too large**: each chunk contains multiple topics, so when retrieved it brings noise alongside signal. The retriever gives a high score to the chunk because part of it is relevant, but the model receives diluted context.

**Chunks too small**: each chunk lacks sufficient context to be self-contained. A sentence like "the threshold is $500" means nothing without knowing which record, which request type, and which circumstance it refers to.

**No overlap**: when a semantic unit (a clause, a definition) spans a chunk boundary, neither chunk contains the complete idea. Overlap `chunk_overlap` mitigates this by duplicating content at boundaries.

**Wrong separator strategy**: splitting on fixed character counts can split sentences, which destroys semantic coherence. `RecursiveCharacterTextSplitter` tries larger separators first (paragraphs, then sentences, then words, then characters), preserving semantics as much as possible.

### RecursiveCharacterTextSplitter — The Gold Standard

```python
from langchain_text_splitters import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,          # target size in characters (not tokens)
    chunk_overlap=200,        # overlap between consecutive chunks in characters
    length_function=len,      # function used to measure size (swap for token counter)
    
    # Separator list: tries each in order, falls back to next if chunk would be too large
    # Default covers most English text well:
    separators=[
        "\n\n",   # paragraph break (highest preference — best semantic boundary)
        "\n",     # line break
        " ",      # word boundary
        "",       # character boundary (last resort)
    ],
    
    add_start_index=True,     # adds metadata["start_index"] = character offset from document start
    is_separator_regex=False, # set True if separators are regex patterns
)

chunks = splitter.split_documents(docs)

# Inspect chunk size distribution
import statistics
sizes = [len(c.page_content) for c in chunks]
print(f"Count: {len(chunks)}, Mean: {statistics.mean(sizes):.0f}, "
      f"Stdev: {statistics.stdev(sizes):.0f}, Max: {max(sizes)}")
```

### Token-Based Splitting — For Embedding Model Alignment

Character-based splitting is an approximation. Token-based splitting aligns precisely with your embedding model's context window. This matters when chunks are near the model's maximum input length:

```python
from langchain_text_splitters import TokenTextSplitter
from langchain_text_splitters import SentenceTransformersTokenTextSplitter

# Basic token splitter (uses tiktoken — optimised for OpenAI/similar tokenisers)
token_splitter = TokenTextSplitter(
    encoding_name="cl100k_base",  # tiktoken encoding
    chunk_size=256,               # 256 tokens ≈ ~1000 characters for English
    chunk_overlap=32,
)

# SentenceTransformers-specific token splitter
# For all-MiniLM-L6-v2 (which you've studied), max is 512 tokens
st_splitter = SentenceTransformersTokenTextSplitter(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    chunk_size=256,      # safe margin below 512 token limit
    chunk_overlap=32,
)

# For Voyage AI (voyage-3.5):
# - Context window: 32,000 tokens
# - Optimal chunk: 256-512 tokens for most RAG tasks
# - voyage-3.5 doesn't have a published tokeniser, so character-based (1 token ≈ 4 chars) is a reasonable approximation
```

### Structure-Aware Splitters

When documents have semantic structure (headers, sections), use structure-aware splitters that preserve the hierarchy in metadata:

```python
from langchain_text_splitters import (
    MarkdownHeaderTextSplitter,
    HTMLHeaderTextSplitter,
    RecursiveJsonSplitter,
)

# MarkdownHeaderTextSplitter — best for API documentation, README files
md_splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=[
        ("#",   "h1"),    # H1 → metadata["h1"]
        ("##",  "h2"),    # H2 → metadata["h2"]
        ("###", "h3"),    # H3 → metadata["h3"]
    ],
    strip_headers=False,          # keep headers in content (recommended — adds context)
    return_each_line=False,       # True = one doc per line (rarely useful)
)

md_chunks = md_splitter.split_text(markdown_text)
# Each chunk has metadata like: {"h1": "Requests Process", "h2": "Motor Requests", "h3": "Documentation Required"}

# Best practice: chain with RecursiveCharacterTextSplitter for final sizing
final_chunks = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100).split_documents(md_chunks)
# Result: metadata contains both header hierarchy AND start_index

# HTMLHeaderTextSplitter — for web-scraped content
html_splitter = HTMLHeaderTextSplitter(
    headers_to_split_on=[
        ("h1", "section"),
        ("h2", "subsection"),
        ("h3", "topic"),
    ]
)
```

### Chunking Parameters by Document Type

This table is derived from empirical testing across reference document types. Use as a starting point and tune based on your retrieval eval metrics:

| Document Type | chunk_size | chunk_overlap | Splitter | Notes |
|--------------|-----------|--------------|----------|-------|
| spec / Record Wording | 800–1200 chars | 150–200 | Recursive | Prefer paragraph boundaries |
| API Documentation (.md) | 600–900 chars | 100–150 | MarkdownHeader → Recursive | Preserves endpoint context |
| FAQ (Q&A pairs) | 300–500 chars | 50–80 | Recursive | One Q&A pair per chunk ideally |
| Legal / Regulatory text | 1200–1500 chars | 250–300 | Recursive | Dense text needs more context |
| Product brochures | 500–800 chars | 100–150 | Recursive | Mix of tables and prose |
| Requests guides | 700–1000 chars | 150–200 | Recursive | Step-by-step instructions |
| Financial schedules / tables | 400–600 chars | 50–100 | Custom | Preserve row/column structure |

### The Parent Document Pattern — Deferred to Module 11

For hierarchical RAG (your MyApp Phase 3), you index small chunks but retrieve larger parent chunks. The `ParentDocumentRetriever` implements this. See Section 12.

---

## 10. Embeddings — Deep Reference

### How Embeddings Work in LangChain

Every LangChain embedding class implements `BaseEmbeddings` which specifies two methods: `.embed_documents(texts: list[str]) -> list[list[float]]` for batch embedding documents during indexing, and `.embed_query(text: str) -> list[float]` for embedding a single query during retrieval. The distinction matters for asymmetric embedding models like Voyage AI, where the model uses different encodings for documents vs queries to optimise semantic alignment.

### VoyageAIEmbeddings — Your Stack

```python
from langchain_voyageai import VoyageAIEmbeddings

# For INDEXING time (building the vectorstore)
doc_embedder = VoyageAIEmbeddings(
    voyage_api_key=os.getenv("VOYAGE_API_KEY"),
    model="voyage-3-5",           # voyage-3.5 (note: API uses "voyage-3-5")
    input_type="document",        # CRITICAL: "document" for indexing, "query" for search
    truncation=True,              # Truncate inputs exceeding context limit (True = safe)
    batch_size=72,                # Max batch size for voyage-3.5 (check API limits)
    show_progress_bar=True,       # tqdm progress for large batches
)

# For QUERY time (at retrieval)
query_embedder = VoyageAIEmbeddings(
    voyage_api_key=os.getenv("VOYAGE_API_KEY"),
    model="voyage-3-5",
    input_type="query",           # DIFFERENT from doc_embedder
    batch_size=1,                 # Single query at retrieval time
)

# voyage-3.5 specifications:
# Dimensions: 1024 (default) or 256, 512, 1024 (configurable)
# Max input tokens: 32,000
# Similarity function: cosine (recommended)
# Context: optimised for retrieval-augmented generation

# Dimension reduction (256d) — much faster storage and search, ~5% quality loss
compact_embedder = VoyageAIEmbeddings(
    model="voyage-3-5",
    output_dimension=256,         # 256 | 512 | 1024 (default)
    input_type="document",
)
```

### Voyage AI Model Selection

| Model | Dimensions | Max Tokens | Specialty |
|-------|-----------|-----------|----------|
| `voyage-3-5` | 1024 (default) | 32,000 | Latest general purpose, best quality |
| `voyage-3-lite` | 512 | 4,000 | Faster, cheaper, good for high-volume |
| `voyage-finance-2` | 1024 | 4,000 | Finance/your domain specialisation |
| `voyage-law-2` | 1024 | 16,000 | Legal document specialisation |
| `voyage-code-2` | 1536 | 16,000 | Code and technical documentation |

For MyApp, `voyage-finance-2` or `voyage-3-5` are the top two choices. `voyage-finance-2` has domain-specific training on financial documents (which overlaps heavily with domain) and may give better recall on terminology-heavy queries. Test both with your actual documents.

### CacheBackedEmbeddings — Cost Optimisation

Recomputing embeddings is expensive. `CacheBackedEmbeddings` wraps any embedder and caches results to avoid redundant API calls:

```python
from langchain.embeddings import CacheBackedEmbeddings
from langchain.storage import LocalFileStore, InMemoryByteStore

# File-based cache — persists across sessions
file_store = LocalFileStore("./embedding_cache/")
cached_embedder = CacheBackedEmbeddings.from_bytes_store(
    underlying_embeddings=doc_embedder,
    document_embedding_cache=file_store,
    namespace=doc_embedder.model,  # separate caches per model
    query_embedding_cache=InMemoryByteStore(),  # queries cached in memory (transient)
)

# First call: hits Voyage AI API, stores result
vectors = cached_embedder.embed_documents(["Motor domain covers..."])

# Second call with same text: returns from cache, zero API cost
vectors = cached_embedder.embed_documents(["Motor domain covers..."])
```

### Embedding Quality Evaluation

Before committing to an embedding model for production, evaluate it on a retrieval benchmark using your actual documents:

```python
from langchain.evaluation import load_evaluator

# RAGAS-style: compare retrieved docs to ground truth relevant docs
evaluator = load_evaluator(
    "labeled_pairwise_string",
    criteria="relevance",
    llm=ChatAnthropic(model="claude-3-haiku-20240307"),
)

# Build eval set: 20-50 question/expected_answer pairs from your domain
eval_questions = [
    {"query": "What is the standard threshold for request handling?", "expected": "$500"},
    {"query": "What documents are needed to file a health request?", "expected": "..."},
    # ...
]
```

---

## 11. Vectorstores — Complete Reference

### Chroma in Depth

```python
from langchain_chroma import Chroma
from langchain_voyageai import VoyageAIEmbeddings

embeddings = VoyageAIEmbeddings(model="voyage-3-5", input_type="document")

# ─── Creating from documents ──────────────────────────────────────────────
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name="app_docs_v3",
    persist_directory="./chroma_db",
    collection_metadata={
        "hnsw:space": "cosine",          # similarity function: "cosine" | "l2" | "ip"
        "hnsw:construction_ef": 200,     # index build quality (higher = better, slower)
        "hnsw:search_ef": 100,           # search quality (higher = better, slower)
        "hnsw:M": 16,                    # HNSW M parameter (16 is default, 32 for high precision)
    },
)

# ─── Loading existing vectorstore ─────────────────────────────────────────
vectorstore = Chroma(
    collection_name="app_docs_v3",
    embedding_function=embeddings,
    persist_directory="./chroma_db",
    # Note: embedding_function here is used only for query-time embedding
    # The stored vectors were embedded at index time
)

# ─── Similarity search variants ───────────────────────────────────────────

# Basic — returns List[Document]
results = vectorstore.similarity_search("product domain threshold", k=5)

# With scores — returns List[Tuple[Document, float]]
# Score is cosine similarity [0, 1] — higher is more similar
scored_results = vectorstore.similarity_search_with_relevance_scores(
    query="threshold product comprehensive",
    k=5,
    score_threshold=0.6,   # only return results above this threshold
)
for doc, score in scored_results:
    print(f"{score:.3f}: {doc.page_content[:80]}")

# With metadata filtering — filter documents BEFORE similarity search
filtered_results = vectorstore.similarity_search(
    query="request process",
    k=5,
    filter={"$and": [
        {"document_type": {"$eq": "spec"}},
        {"effective_year": {"$gte": 2024}},
        {"product_type": {"$in": ["product", "comprehensive"]}},
    ]},
)

# Chroma filter operators: $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $and, $or

# MMR (Maximal Marginal Relevance) — diversity-aware retrieval
mmr_results = vectorstore.max_marginal_relevance_search(
    query="domain exclusions",
    k=4,           # return k results
    fetch_k=20,    # candidate pool size (fetch this many, pick k most diverse)
    lambda_mult=0.5,  # diversity-relevance tradeoff: 0=max diversity, 1=max relevance
    filter={"document_type": "spec"},
)
```

### Managing Multiple Collections for MyApp

```python
# your application: two separate collections with different documents and purposes
customer_portal_store = Chroma(
    collection_name="insure_customer_portal_v3",    # customer-facing reference documents
    embedding_function=VoyageAIEmbeddings(model="voyage-3-5", input_type="query"),
    persist_directory="./chroma_db",
)

support_store = Chroma(
    collection_name="insure_api_docs_v3",     # developer-facing API documentation
    embedding_function=VoyageAIEmbeddings(model="voyage-3-5", input_type="query"),
    persist_directory="./chroma_db",
)

# Index versioning — never overwrite a running collection
def reindex_collection(new_chunks: list[Document], version: str) -> Chroma:
    """Create a new versioned collection for zero-downtime reindexing."""
    new_name = f"insure_customer_portal_{version}"
    new_store = Chroma.from_documents(
        documents=new_chunks,
        embedding=VoyageAIEmbeddings(model="voyage-3-5", input_type="document"),
        collection_name=new_name,
        persist_directory="./chroma_db",
    )
    return new_store
# After validation, update the ACTIVE_COLLECTION env var and reload the app
```

### Incremental Indexing and Deletion

```python
# Add new documents to an existing collection
new_record_chunks = loader.load()
new_record_chunks = splitter.split_documents(new_record_chunks)

ids = vectorstore.add_documents(
    documents=new_record_chunks,
    ids=[f"doc_{i}" for i in range(len(new_record_chunks))],  # optional explicit IDs
)
print(f"Added {len(ids)} chunks")

# Delete documents by metadata filter
vectorstore.delete(where={"source": "docs/spec_product_2023.pdf"})  # delete old version
# Then add new version: vectorstore.add_documents(new_2024_chunks)

# Check collection size
client = vectorstore._client  # access underlying chromadb.Client
collection = client.get_collection("app_docs_v3")
print(f"Collection has {collection.count()} documents")
```

---

## 12. Retrievers — Basic to Advanced

### The Retriever Interface

All retrievers implement `BaseRetriever` which has one method: `.invoke(query: str) -> List[Document]`. This single method is what makes retrievers composable in LCEL chains and interchangeable with one another. The async variant is `.ainvoke()`.

### Vectorstore Retriever — All Configuration Options

```python
# Convert a vectorstore to a retriever
retriever = vectorstore.as_retriever(
    search_type="similarity",           # "similarity" | "mmr" | "similarity_score_threshold"
    search_kwargs={
        "k": 5,                         # number of results to return
        "filter": {"year": {"$gte": 2024}},  # metadata filter
        "score_threshold": 0.65,        # for "similarity_score_threshold" mode only
        "fetch_k": 20,                  # for "mmr" mode only — candidate pool size
        "lambda_mult": 0.5,             # for "mmr" mode only — diversity weight
    },
)

# Direct invocation
docs: list[Document] = retriever.invoke("What is the threshold for request handling?")

# In a chain
chain = {"context": retriever | format_docs, "question": RunnablePassthrough()} | prompt | model | StrOutputParser()
```

### BM25Retriever — Keyword / Sparse Retrieval

BM25 is a lexical retrieval algorithm based on term frequency and inverse document frequency. It excels at retrieving documents that contain the exact terminology used in the query — critical for domain queries where precise terms like "threshold", "spec", "third-party liability" must match exactly:

```python
from langchain_community.retrievers import BM25Retriever
import Stemmer  # pip install PyStemmer

# Build from documents
bm25_retriever = BM25Retriever.from_documents(
    documents=chunks,
    k=5,                              # number of results
    # Optional: custom tokeniser for domain terminology
    preprocess_func=lambda text: text.lower().split(),
)

# Build from texts (if documents not yet created)
bm25_retriever = BM25Retriever.from_texts(
    texts=[c.page_content for c in chunks],
    metadatas=[c.metadata for c in chunks],
    k=5,
)

# BM25 persistence — save to disk (in-memory by default, lost on restart)
import pickle
with open("bm25_index.pkl", "wb") as f:
    pickle.dump(bm25_retriever, f)

with open("bm25_index.pkl", "rb") as f:
    bm25_retriever = pickle.load(f)
```

### EnsembleRetriever — Hybrid Search with RRF

This is your BM25 + semantic hybrid. `EnsembleRetriever` merges results from multiple retrievers using Reciprocal Rank Fusion (RRF). RRF combines ranked lists by assigning scores of `1/(k + rank)` where `k=60` is a stabilising constant, then summing scores across retrievers. Results are re-ranked by combined score.

```python
from langchain.retrievers import EnsembleRetriever

# Weight configuration: semantic search typically scores higher on paraphrased queries,
# BM25 scores higher on exact terminology matches.
# For domain (where exact terms matter): 0.4 BM25, 0.6 semantic is a good starting point
hybrid_retriever = EnsembleRetriever(
    retrievers=[bm25_retriever, semantic_retriever],
    weights=[0.4, 0.6],       # must sum to 1.0
    c=60,                     # RRF constant (default 60; larger = smaller score differences)
    id_key=None,              # optional: field name to use as doc ID for deduplication
)

# Three-way hybrid: BM25 + semantic (record docs) + semantic (FAQs)
triple_hybrid = EnsembleRetriever(
    retrievers=[bm25_retriever, record_semantic_retriever, faq_semantic_retriever],
    weights=[0.3, 0.5, 0.2],
)
```

### MultiQueryRetriever — Query Expansion

The LLM generates multiple rephrasings of the original query. Each rephrasing is used for an independent retrieval pass. All results are deduplicated and returned. This dramatically improves recall when the user's phrasing doesn't match the document's phrasing:

```python
from langchain.retrievers import MultiQueryRetriever
from langchain_anthropic import ChatAnthropic
import logging

# Enable logging to see generated queries (useful during development)
logging.basicConfig()
logging.getLogger("langchain.retrievers.multi_query").setLevel(logging.INFO)

mq_retriever = MultiQueryRetriever.from_llm(
    retriever=hybrid_retriever,           # underlying retriever to call per query
    llm=ChatAnthropic(model="claude-3-haiku-20240307"),
    parser_key="lines",                   # how to parse generated queries (default: newlines)
    include_original=True,               # also retrieve for the original query
)

# Custom prompt for query generation (optional — override default)
from langchain_core.prompts import PromptTemplate

QUERY_PROMPT = PromptTemplate(
    input_variables=["question"],
    template="""You are an AI assistant helping to retrieve reference document information.
Generate 4 different versions of the following question to improve document retrieval.
The documents are reference document documents from your markets.
Focus on: synonyms, different phrasings, specific terminology, and implicit intent.

Original question: {question}
Output 4 alternative questions, one per line:""",
)

mq_retriever = MultiQueryRetriever.from_llm(
    retriever=hybrid_retriever,
    llm=ChatAnthropic(model="claude-3-haiku-20240307"),
    prompt=QUERY_PROMPT,
    include_original=True,
)
```

### HyDE — Hypothetical Document Embeddings

HyDE generates a hypothetical answer to the query, then embeds that hypothetical answer (rather than the raw query) for retrieval. The rationale is that a hypothetical answer is semantically closer to real document chunks than the short user query. Implement it as an LCEL chain:

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

# Step 1: Generate hypothetical document
hyde_prompt = ChatPromptTemplate.from_messages([
    ("system", """Generate a hypothetical reference document excerpt that would answer the user's question.
Write it as if it were an extract from an actual spec document (specification document).
Be specific, use domain terminology, and include realistic details like amounts in USD.
Write 3-4 sentences only."""),
    ("human", "{question}"),
])

hyde_generator = hyde_prompt | ChatAnthropic(model="claude-3-haiku-20240307") | StrOutputParser()

# Step 2: Use the hypothetical document to retrieve real ones
# The hypothetical doc is embedded and matched against the real document vectors
hyde_retriever = hyde_generator | semantic_retriever.with_config(run_name="HyDE Retrieval")

# Step 3: Combine HyDE results with direct retrieval (belt and suspenders)
from langchain.retrievers import EnsembleRetriever

robust_retriever = EnsembleRetriever(
    retrievers=[
        hyde_retriever,               # HyDE: embeds hypothetical answer
        hybrid_retriever,             # Direct: BM25 + semantic on original query
    ],
    weights=[0.4, 0.6],
)
```

### ContextualCompressionRetriever — Re-ranking and Filtering

This wrapper adds a post-processing step after retrieval. The "compressor" takes the retrieved documents and either filters out irrelevant ones, extracts relevant passages, or reorders them by relevance to the query:

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import (
    CrossEncoderReranker,           # cross-encoder re-ranking (highest quality)
    LLMChainExtractor,              # LLM extracts relevant passages (slowest, most precise)
    LLMChainFilter,                 # LLM filters out irrelevant docs (moderate cost)
    EmbeddingsFilter,               # embedding similarity filter (fast, low cost)
    EmbeddingsRedundantFilter,      # remove near-duplicate chunks
    DocumentCompressorPipeline,     # chain multiple compressors
)
from langchain_community.cross_encoders import HuggingFaceCrossEncoder

# ─── Option 1: Cross-encoder re-ranking (recommended for MyApp) ───────────
# Cross-encoders jointly encode query+document, giving a relevance score
# Much more accurate than bi-encoder (embedding) similarity
cross_encoder = HuggingFaceCrossEncoder(
    model_name="cross-encoder/ms-marco-MiniLM-L-6-v2",  # fast, 80MB
    # Alternatives by quality (in descending order):
    # "cross-encoder/ms-marco-MiniLM-L-12-v2"  (130MB, slightly better)
    # "cross-encoder/ms-marco-electra-base"     (435MB, best quality)
    # "BAAI/bge-reranker-large"                 (1.3GB, SOTA)
)

reranker = CrossEncoderReranker(
    model=cross_encoder,
    top_n=3,    # return top 3 after reranking (from however many hybrid returned)
)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=reranker,
    base_retriever=hybrid_retriever,  # or any retriever
)

# ─── Option 2: LLM-based extraction (highest precision, expensive) ──────────────
extractor = LLMChainExtractor.from_llm(
    ChatAnthropic(model="claude-3-haiku-20240307")
)
# Extracts ONLY the relevant passage from each document, discarding irrelevant content

# ─── Option 3: Pipeline — deduplicate then rerank ────────────────────────────────
pipeline_compressor = DocumentCompressorPipeline(
    transformers=[
        EmbeddingsRedundantFilter(
            embeddings=VoyageAIEmbeddings(model="voyage-3-5"),
            similarity_threshold=0.95,  # remove docs with >95% similarity to each other
        ),
        reranker,  # then rerank the deduplicated set
    ]
)

full_pipeline = ContextualCompressionRetriever(
    base_compressor=pipeline_compressor,
    base_retriever=hybrid_retriever,
)
```

### ParentDocumentRetriever — Hierarchical RAG

Index small chunks (for precision), but retrieve large parent chunks (for context). The retriever maintains a mapping from small chunk IDs to their parent document IDs:

```python
from langchain.retrievers import ParentDocumentRetriever
from langchain.storage import InMemoryStore, LocalFileStore
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Child splitter: creates small precise chunks for indexing
child_splitter = RecursiveCharacterTextSplitter(chunk_size=200, chunk_overlap=30)

# Parent splitter: creates larger context-rich chunks for retrieval
parent_splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)

# Storage for parent documents (separate from the vectorstore)
parent_store = LocalFileStore("./parent_doc_store/")  # persists to disk

retriever = ParentDocumentRetriever(
    vectorstore=vectorstore,           # stores child chunk embeddings
    docstore=parent_store,             # stores full parent documents
    child_splitter=child_splitter,
    parent_splitter=parent_splitter,   # None = whole documents are parents
    child_metadata_fields=["source", "page"],  # metadata to preserve on children
)

# Indexing: splits into parents, then splits parents into children
retriever.add_documents(docs, ids=None)

# Retrieval: queries match child chunks, but return parent documents
# Query on a small, specific clause → get back the full record section
results = retriever.invoke("threshold $500 product comprehensive")
# Results are the PARENT chunks (large), not the small child chunks that matched
```

### MultiVectorRetriever — Multiple Representations

Index multiple vector representations per document (full text, summary, hypothetical questions). At retrieval time, any representation can match:

```python
from langchain.retrievers import MultiVectorRetriever
from langchain.storage import InMemoryStore
import uuid

docstore = InMemoryStore()

retriever = MultiVectorRetriever(
    vectorstore=vectorstore,
    docstore=docstore,
    id_key="doc_id",    # metadata key linking vectors to documents
)

# Generate summaries for each document chunk
summary_chain = (
    ChatPromptTemplate.from_messages([
        ("system", "Summarise this reference document section in 2-3 sentences."),
        ("human", "{text}"),
    ])
    | ChatAnthropic(model="claude-3-haiku-20240307")
    | StrOutputParser()
)

# Add original docs + their summaries to the retriever
doc_ids = [str(uuid.uuid4()) for _ in chunks]
summaries = [summary_chain.invoke({"text": c.page_content}) for c in chunks]

# Index summaries (for matching) but store originals (for context)
summary_docs = [Document(page_content=s, metadata={"doc_id": doc_ids[i]}) for i, s in enumerate(summaries)]
retriever.vectorstore.add_documents(summary_docs)
retriever.docstore.mset(list(zip(doc_ids, chunks)))  # store original chunks by ID
```

---

## 13. Memory & Conversation State

### The Memory Landscape in LangChain v1.0+

LangChain v1.0 moved the old `ConversationBufferMemory`, `ConversationSummaryMemory`, etc. classes to `langchain-classic`. The current approach is managing conversation history as message lists directly in chain inputs. The recommended pattern is to maintain `List[BaseMessage]` in your application state and pass it to `MessagesPlaceholder`.

LangGraph's `InMemorySaver` and `SqliteSaver` are the production-grade memory solutions for agents.

### Direct Message History Management (for LCEL chains)

```python
from langchain_core.chat_history import BaseChatMessageHistory, InMemoryChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

# In-memory history per session (dev/testing)
session_store: dict[str, BaseChatMessageHistory] = {}

def get_session_history(session_id: str) -> BaseChatMessageHistory:
    if session_id not in session_store:
        session_store[session_id] = InMemoryChatMessageHistory()
    return session_store[session_id]

# Wrap your chain with message history management
chain_with_history = RunnableWithMessageHistory(
    runnable=rag_chain,
    get_session_history=get_session_history,
    input_messages_key="question",         # which input key contains the human message
    history_messages_key="chat_history",   # which placeholder to inject history into
    output_messages_key="answer",          # optional: if chain returns dict with this key
)

# Invoke with session config — history is automatically loaded and saved
response = chain_with_history.invoke(
    {"question": "What is my threshold?", "context": "..."},
    config={"configurable": {"session_id": "user-001-session-42"}},
)

# Second turn — history automatically includes first turn
response = chain_with_history.invoke(
    {"question": "And what about non-fault requests?", "context": "..."},
    config={"configurable": {"session_id": "user-001-session-42"}},
)
```

### SQLite-Backed Chat History (Production)

```python
from langchain_community.chat_message_histories import SQLChatMessageHistory

def get_session_history(session_id: str) -> SQLChatMessageHistory:
    return SQLChatMessageHistory(
        session_id=session_id,
        connection="sqlite:///insurechat_history.db",  # or PostgreSQL URL
        table_name="chat_history",                      # custom table name
    )

# In FastAPI
@app.post("/chat/{session_id}")
async def chat(session_id: str, message: str):
    response = await chain_with_history.ainvoke(
        {"question": message, "context": "..."},
        config={"configurable": {"session_id": session_id}},
    )
    return {"answer": response}
```

### Conversation Summarisation — Managing Long Contexts

For long conversations, the full history may exceed the model's context window. Summarisation compresses old history while retaining key facts:

```python
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_anthropic import ChatAnthropic

async def summarise_and_trim(
    messages: list[BaseMessage],
    max_messages: int = 10,
    llm: ChatAnthropic = None,
) -> list[BaseMessage]:
    """Summarise messages beyond max_messages, prepend as system context."""
    if len(messages) <= max_messages:
        return messages
    
    # Messages to summarise: everything except the last max_messages
    to_summarise = messages[:-max_messages]
    to_keep = messages[-max_messages:]
    
    summary_prompt = f"""Summarise this customer support conversation in 3-4 sentences.
Preserve: record IDs mentioned, request IDs, agreed facts, user preferences.

Conversation:
{chr(10).join(f'{m.__class__.__name__}: {m.content}' for m in to_summarise)}"""
    
    summary = await llm.ainvoke([HumanMessage(content=summary_prompt)])
    
    return [
        SystemMessage(content=f"Previous conversation summary: {summary.content}"),
        *to_keep,
    ]
```

---

## 14. Agents — ReAct & Tool Calling

### What an Agent Is and Isn't

An agent is not a magical autonomous system. It is an LLM that, at each step, receives a description of available tools and the current conversation context, and outputs either a tool call or a final answer. The "intelligence" is entirely in the LLM's ability to read tool descriptions and decide which tool to call with what arguments.

The agent framework provides: the loop that alternates between LLM calls and tool executions, the message history that accumulates tool calls and results, the stopping condition (LLM says "I have enough information"), and the callback infrastructure for tracing and debugging.

### ReAct Loop Mechanics

The ReAct (Reason + Act) pattern works as follows. The conversation history accumulates messages of four types: `HumanMessage` (user query), `AIMessage` with `tool_calls` (model decides to call a tool), `ToolMessage` (result of the tool execution), and `AIMessage` without `tool_calls` (final answer). The loop continues until the model produces an `AIMessage` with no tool calls.

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langchain.agents import create_agent  # v1.0+
from langgraph.checkpoint.memory import InMemorySaver

# Define tools (see Section 15 for deep dive)
@tool
def retrieve_record_info(query: str) -> str:
    """Search the MyApp knowledge base for record information.
    Use this for questions about coverage, exclusions, request procedures, or record terms.
    Args:
        query: Natural language query about reference document
    """
    docs = compression_retriever.invoke(query)
    return "\n\n".join(
        f"[Source: {d.metadata.get('source', 'unknown')}, p.{d.metadata.get('page', '?')}]\n{d.page_content}"
        for d in docs
    )

@tool
def get_record_by_number(record_id: str) -> str:
    """Retrieve specific record details by record ID.
    Args:
        record_id: Record number in format REC-YYYY-NNNN
    """
    # Database lookup
    ...

@tool
def calculate_price_estimate(
    product_type: str,
    age: int,
    sum_insured: float,
    market: str = "your city",
) -> str:
    """Calculate estimated price for an domain product.
    Args:
        product_type: Type of domain ("product", "health", "property", "travel")
        age: Primary insured's age
        sum_insured: Coverage amount in USD
        market: your market ("your city", "Region B", "Region C", "Region D")
    """
    ...

# Create agent with InMemorySaver for conversation persistence
agent = create_agent(
    model=ChatAnthropic(
        model="claude-sonnet-4-6",
        max_tokens=4096,
    ),
    tools=[retrieve_record_info, get_record_by_number, calculate_price_estimate],
    checkpointer=InMemorySaver(),
    state_modifier="""You are MyApp, an expert your domain assistant.

Guidelines:
- Always retrieve record information before answering specific coverage questions
- For request-related queries, ask for the record ID if not provided
- Quote specific record sections when answering
- Never invent coverage details — only use information from retrieved documents
- For pricing, always clarify that estimates are indicative and final prices may vary
- Escalate to a human agent when: the customer is distressed, the request is complex, or you're unsure""",
)

# Invoke with session config
config = {"configurable": {"thread_id": "session-001"}, "recursion_limit": 25}

result = agent.invoke(
    {"messages": [("human", "I had a product accident. What do I do?")]},
    config=config,
)

# Access the final response
final_message = result["messages"][-1]
print(final_message.content)

# Access intermediate steps (tool calls + results)
for msg in result["messages"]:
    if hasattr(msg, "tool_calls") and msg.tool_calls:
        for tc in msg.tool_calls:
            print(f"Tool called: {tc['name']} with {tc['args']}")
```

### Streaming Agent Output

```python
from langchain_core.messages import AIMessage, ToolMessage

async def stream_agent_response(user_message: str, session_id: str):
    """Stream agent output including tool call visibility."""
    config = {"configurable": {"thread_id": session_id}}
    
    async for event in agent.astream_events(
        {"messages": [("human", user_message)]},
        config=config,
        version="v2",   # always use v2 for latest event format
    ):
        kind = event["event"]
        
        if kind == "on_chat_model_stream":
            # Streaming tokens from the LLM
            chunk = event["data"]["chunk"]
            if chunk.content:
                yield {"type": "token", "content": chunk.content}
        
        elif kind == "on_tool_start":
            # Tool is about to be called — show in UI
            yield {
                "type": "tool_call",
                "tool": event["name"],
                "input": event["data"].get("input"),
            }
        
        elif kind == "on_tool_end":
            # Tool returned a result
            yield {
                "type": "tool_result",
                "tool": event["name"],
                "output": str(event["data"].get("output", ""))[:200],
            }
```

---

## 15. Tools — Design Patterns & Best Practices

### The Tool Contract with the LLM

A tool in LangChain is not just a Python function — it is a contract between you and the LLM. The LLM reads the tool's name, description, and argument schema to decide: does this tool address my current need? What arguments should I pass? The quality of your tool design directly determines the quality of your agent's decisions. A tool with a vague description will be called inappropriately. A tool with ambiguous arguments will be called with wrong values.

### @tool Decorator — Comprehensive Usage

```python
from langchain_core.tools import tool
from pydantic import BaseModel, Field
from typing import Optional, List

@tool(
    name="search_record_documents",    # override auto-generated name (default: function name)
    description="""Search MyApp's record knowledge base.
    
    USE THIS TOOL when the user asks about:
    - Coverage inclusions or exclusions
    - Request procedures or requirements  
    - Record terms, conditions, or definitions
    - Price structures or discounts
    
    DO NOT USE for: request status checks, price calculations, or account-specific queries.
    
    Returns: Relevant reference document excerpts with source citations.""",
    return_direct=False,  # True = skip LLM reasoning, return tool result directly as final answer
    infer_schema=True,    # auto-generate Pydantic schema from type hints (default True)
)
def search_record_documents(
    query: str,
    product_type: Optional[str] = None,
    market: Optional[str] = None,
    max_results: int = 3,
) -> str:
    """
    Search the record knowledge base.
    
    Args:
        query: Natural language search query about content coverage or procedures
        product_type: Filter by product type ("product", "health", "property", "travel"). 
                      Leave None to search across all products.
        market: your market to filter by ("your city", "Region B", "Region C"). 
                Leave None to search all markets.
        max_results: Maximum number of document excerpts to return (1-5)
    
    Returns:
        Formatted string with relevant record excerpts and source citations
    """
    # Build metadata filter
    filter_dict = {}
    if product_type:
        filter_dict["product_type"] = {"$eq": product_type.lower()}
    if market:
        filter_dict["market"] = {"$eq": market}
    
    docs = vectorstore.similarity_search(
        query=query,
        k=max_results,
        filter=filter_dict if filter_dict else None,
    )
    
    if not docs:
        return f"No reference documents found for query: '{query}'. The agent should ask for clarification or try different search terms."
    
    results = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("source", "unknown")
        page = doc.metadata.get("page", "?")
        results.append(f"[{i}] {source}, p.{page}:\n{doc.page_content}")
    
    return "\n\n".join(results)
```

### StructuredTool with Complex Input Schemas

```python
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field, field_validator
from typing import Literal

class RequestSubmissionInput(BaseModel):
    """Input schema for submitting an domain request."""
    record_id: str = Field(
        description="Record number in format REC-YYYY-NNNN (e.g., REC-2024-0042)"
    )
    incident_date: str = Field(
        description="Date of incident in YYYY-MM-DD format"
    )
    request_type: Literal["product_own_damage", "product_third_party", "health", "property", "travel"] = Field(
        description="Type of request being submitted"
    )
    incident_description: str = Field(
        description="Brief description of what happened (50-200 characters)",
        min_length=20,
        max_length=500,
    )
    estimated_loss_sgd: Optional[float] = Field(
        default=None,
        description="Estimated loss amount in your city Dollars. Leave None if unknown.",
        ge=0,
    )
    
    @field_validator("record_id")
    @classmethod
    def validate_record_id(cls, v):
        import re
        if not re.match(r'^REC-\d{4}-\d{4}$', v):
            raise ValueError("Record number must be in format REC-YYYY-NNNN")
        return v
    
    @field_validator("incident_date")
    @classmethod
    def validate_date(cls, v):
        from datetime import date
        try:
            incident = date.fromisoformat(v)
            if incident > date.today():
                raise ValueError("Incident date cannot be in the future")
            return v
        except ValueError as e:
            raise ValueError(f"Invalid date format: {e}")

def _submit_request(
    record_id: str,
    incident_date: str,
    request_type: str,
    incident_description: str,
    estimated_loss_sgd: Optional[float] = None,
) -> dict:
    """Actual implementation — separate from schema for testability."""
    # In production: call your operations API
    request_id = f"REQ-{request_type[:3].upper()}-{incident_date[:7]}-{random.randint(1000, 9999)}"
    return {
        "request_id": request_id,
        "status": "submitted",
        "estimated_processing_days": 5,
        "next_steps": "You will receive a call from our assessor within 24 hours.",
    }

submit_request_tool = StructuredTool.from_function(
    func=_submit_request,
    name="submit_domain_request",
    description="""Submit a new domain request for a recordholder.
    
    USE THIS TOOL when a customer explicitly wants to file/lodge/submit a request.
    Before calling: ensure you have the record ID. If missing, ask for it.
    After calling: confirm the request ID and next steps to the customer.""",
    args_schema=RequestSubmissionInput,
    return_direct=False,
    handle_tool_error=True,  # if tool raises, return error message to agent instead of crashing
)
```

### handle_tool_error — Graceful Failure

```python
# When handle_tool_error=True, any exception is converted to an error string
# that the agent receives as the tool result and can reason about

def handle_error(error: Exception) -> str:
    """Custom error handler — called when the tool raises an exception."""
    if isinstance(error, ValueError):
        return f"Invalid input: {str(error)}. Please ask the user to correct their information."
    elif isinstance(error, ConnectionError):
        return "The requests system is temporarily unavailable. Please try again in a few minutes."
    else:
        return f"An unexpected error occurred: {type(error).__name__}. Please escalate to a human agent."

tool_with_error_handling = submit_request_tool.copy(
    update={"handle_tool_error": handle_error}
)
```

### Tool Annotations — Injected (Hidden) Parameters

Sometimes a tool needs parameters that should be injected by the system (like user ID, session ID, request context) rather than generated by the LLM. Use `InjectedToolArg` for this:

```python
from langchain_core.tools import InjectedToolArg
from typing import Annotated

@tool
def get_my_requests(
    status_filter: Optional[str],
    # user_id is INJECTED — not visible to the LLM, not in the schema
    user_id: Annotated[str, InjectedToolArg],
) -> str:
    """Get all requests for the current user.
    Args:
        status_filter: Filter by status ("pending", "approved", "rejected"). Leave None for all.
    """
    requests = db.query(Requests).filter(Requests.user_id == user_id, ...)
    return format_requests(requests)

# At agent invocation time, inject the user_id
result = agent.invoke(
    {"messages": [("human", "Show me my pending requests")]},
    config={
        "configurable": {
            "thread_id": session_id,
            "user_id": current_user.id,   # injected
        }
    },
)
```

---

## 16. LangGraph — StateGraph Architecture

### Why LangGraph Exists

LCEL chains are Directed Acyclic Graphs (DAGs): data flows forward, never back. This is sufficient for standard RAG pipelines. But many AI workflows require **cycles**: an agent that retrieves, decides it needs more information, retrieves again with a different query, then generates. A CRAG that grades document relevance and loops back if documents are poor. A multi-agent system where a supervisor decides which worker to call, hears the result, and decides what to do next.

LangGraph introduces `StateGraph` — a framework for defining stateful, cyclic workflows where each step reads from and writes to a shared state dictionary. It is built on top of `langchain-core` (so all Runnables work inside nodes) but is architecturally separate from `langchain`.

### State Design — The Most Important Decision

The state in a LangGraph graph is a `TypedDict` (or Pydantic model) that is the shared memory for the entire execution. Every node reads the state as input and returns a partial update (not the full state). The `Annotated` type with a reducer function controls how updates are merged:

```python
from typing import TypedDict, Annotated, List, Optional
from langchain_core.messages import BaseMessage
import operator

class MyAppGraphState(TypedDict):
    # --- Accumulated fields (use operator.add to append) ---
    messages: Annotated[List[BaseMessage], operator.add]
    # operator.add for lists means: new values are APPENDED, not replaced
    # e.g., if state["messages"] = [msg1] and update is {"messages": [msg2]},
    #        result is [msg1, msg2]
    
    # --- Overwrite fields (no annotation = last-write-wins) ---
    question: str
    intent: str
    retrieved_docs: List               # overwritten each retrieval
    rewrite_count: int
    user_context: Optional[dict]       # user account info, preferences
    
    # --- Optional aggregated fields ---
    tool_calls_made: Annotated[List[str], operator.add]  # accumulate all tools called
    errors: Annotated[List[str], operator.add]           # accumulate errors for logging
```

### Node Functions — Contract and Conventions

Node functions have one job: read from state, do work, return a partial state update:

```python
from langgraph.graph import StateGraph, END, START

# Node signature: (state: YourStateType) -> dict
# The returned dict is merged into the state
# You only need to include keys you're updating

def classify_intent_node(state: MyAppGraphState) -> dict:
    """
    Reads: state["messages"] (latest human message)
    Updates: state["intent"]
    """
    latest_msg = state["messages"][-1].content
    
    result: InsuranceIntent = structured_haiku.invoke(latest_msg)
    
    return {
        "intent": result.intent,
        # NOT including "messages" here = messages unchanged
    }

def retrieve_node(state: MyAppGraphState) -> dict:
    """
    Reads: state["question"], state["intent"]
    Updates: state["retrieved_docs"]
    """
    # Build metadata filter based on intent
    filter_hint = {
        "REQUESTS": {"document_type": {"$in": ["requests_guide", "spec"]}},
        "PRICING": {"document_type": {"$eq": "product_summary"}},
    }.get(state["intent"], {})
    
    docs = compression_retriever.invoke(state["question"])
    
    return {"retrieved_docs": docs}

def generate_node(state: MyAppGraphState) -> dict:
    """
    Reads: state["messages"], state["retrieved_docs"]
    Updates: state["messages"] (appends AIMessage)
    """
    context = "\n\n".join(d.page_content for d in state["retrieved_docs"])
    
    response = ChatAnthropic(model="claude-sonnet-4-6").invoke(
        state["messages"] + [HumanMessage(content=f"Context:\n{context}\n\nUse only this context.")]
    )
    
    # operator.add means this AIMessage is APPENDED to messages list
    return {"messages": [response]}

def rewrite_query_node(state: MyAppGraphState) -> dict:
    """
    Reads: state["question"], state["rewrite_count"]
    Updates: state["question"], state["rewrite_count"]
    """
    new_question = rewriter_chain.invoke(state["question"])
    return {
        "question": new_question,
        "rewrite_count": state["rewrite_count"] + 1,
    }
```

### Graph Construction — Full API

```python
graph = StateGraph(MyAppGraphState)

# ─── Register nodes ──────────────────────────────────────────────────────
graph.add_node("classify", classify_intent_node)
graph.add_node("retrieve", retrieve_node)
graph.add_node("grade", grade_documents_node)
graph.add_node("rewrite", rewrite_query_node)
graph.add_node("generate", generate_node)
graph.add_node("escalate", escalate_to_human_node)  # for complex cases

# ─── Entry point ─────────────────────────────────────────────────────────
graph.set_entry_point("classify")
# Equivalent: graph.add_edge(START, "classify")

# ─── Regular edges ───────────────────────────────────────────────────────
graph.add_edge("retrieve", "grade")    # always go from retrieve to grade
graph.add_edge("generate", END)        # always end after generate
graph.add_edge("escalate", END)

# ─── Conditional edges ───────────────────────────────────────────────────
def route_by_intent(state: MyAppGraphState) -> str:
    """Returns name of next node based on classified intent."""
    if state["intent"] in ("REQUESTS", "COMPLAINT"):
        return "escalate"   # these always go to human agent
    return "retrieve"       # everything else goes through RAG

graph.add_conditional_edges(
    source="classify",
    path=route_by_intent,
    # path_map can be omitted if function returns node names directly
    path_map={
        "escalate": "escalate",
        "retrieve": "retrieve",
    },
)

def route_after_grading(state: MyAppGraphState) -> str:
    """Decide to generate (docs are good), rewrite (docs are poor), or escalate (max retries)."""
    if state["rewrite_count"] >= 2:
        return "generate"    # give up rewriting, generate with what we have
    if state["retrieved_docs"]:
        return "generate"    # we have relevant docs
    return "rewrite"         # no relevant docs, try different query

graph.add_conditional_edges("grade", route_after_grading)

# Rewrite loops back to retrieve — this is the CYCLE that makes it agentic
graph.add_edge("rewrite", "retrieve")

# ─── Compile ─────────────────────────────────────────────────────────────
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.checkpoint.sqlite import SqliteSaver  # pip install langgraph-checkpoint-sqlite  # separate package since langgraph-checkpoint 4.x

# For production: SQLite or PostgreSQL checkpointer
import sqlite3
conn = sqlite3.connect("insurechat.db", check_same_thread=False)
checkpointer = SqliteSaver(conn)

app = graph.compile(
    checkpointer=checkpointer,
    interrupt_before=["escalate"],     # pause and ask for human approval before escalating
    interrupt_after=[],                # pause after these nodes (optional)
    debug=False,                       # True = verbose logging
)

# ─── Visualise the graph ─────────────────────────────────────────────────
# Requires: pip install pygraphviz
print(app.get_graph().draw_mermaid())  # Mermaid.js diagram syntax
app.get_graph().draw_png("graph.png")  # requires pygraphviz
```

### LangGraph 1.1 — Type-Safe Invocation (`version="v2"`)

LangGraph 1.1 (March 2026) introduces opt-in type-safe streaming and invocation:

```python
from langgraph.types import GraphOutput, StreamPart

# version="v2" → returns GraphOutput, not a plain dict
result = app.invoke(input_state, config=config, version="v2")
result.value       # the output state (dict, Pydantic model, or dataclass)
result.interrupts  # tuple[Interrupt, ...], empty if none occurred

# Streaming with version="v2" → yields typed StreamPart objects
for part in app.stream(input_state, config=config, version="v2"):
    print(part["type"])  # "values" | "updates" | "messages" | "checkpoint" | ...
    print(part["data"])  # strongly-typed payload

# version="v1" (default) — unchanged, all existing code works
result = app.invoke(input_state, config=config)  # plain dict, backward-compatible
```

Old dict-style access on `GraphOutput` still works but emits a deprecation warning:
```python
result["messages"]  # works, delegates to result.value["messages"], but deprecated
```

### Inspecting and Resuming Graph State

```python
config = {"configurable": {"thread_id": "session-abc-001"}, "recursion_limit": 25}

# Invoke and get full result
result = app.invoke(
    {
        "messages": [HumanMessage(content="How do I request for water damage?")],
        "question": "How do I request for water damage?",
        "intent": "",
        "retrieved_docs": [],
        "rewrite_count": 0,
        "user_context": None,
        "tool_calls_made": [],
        "errors": [],
    },
    config=config,
)

# Inspect current state of the thread
state_snapshot = app.get_state(config)
print(state_snapshot.values)     # current state dict
print(state_snapshot.next)       # ("escalate",) if interrupted
print(state_snapshot.tasks)      # pending tasks
print(state_snapshot.config)     # config used for this checkpoint

# Resume from interrupted state (after human approval)
result = app.invoke(None, config=config)  # None = resume from checkpoint

# Manually update state before resuming
app.update_state(
    config=config,
    values={"user_context": {"approved": True, "approver": "supervisor-001"}},
    as_node="escalate",  # pretend the update came from this node
)

# Get full history of all states in a thread
for state in app.get_state_history(config):
    print(f"Step: {state.config['configurable'].get('checkpoint_id')}")
    print(f"Next: {state.next}")
```

---

## 17. LangGraph — Advanced Patterns

### CRAG — Corrective Retrieval Augmented Generation

CRAG addresses a fundamental RAG failure mode: when retrieval fails to find relevant documents, a standard RAG chain silently generates a poor answer. CRAG adds a grading step and a corrective loop.

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from pydantic import BaseModel, Field
from typing import Literal

# ─── Document relevance grader ───────────────────────────────────────────
class GradeDocuments(BaseModel):
    """Binary grade for document relevance."""
    binary_score: Literal["yes", "no"] = Field(
        description="'yes' if document is relevant to the query, 'no' otherwise"
    )
    reasoning: str = Field(description="One sentence explaining the grade")

grade_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a relevance grader for an reference document retrieval system.
    
Grade the retrieved document's relevance to the user's question.
Score 'yes' if the document contains information that DIRECTLY addresses the question.
Score 'no' if the document is on a different topic or only tangentially related.

Be strict: 'yes' means the document would genuinely help answer the question."""),
    ("human", "User question: {question}\n\nDocument:\n{document}"),
])

relevance_grader = grade_prompt | ChatAnthropic(
    model="claude-3-haiku-20240307"
).with_structured_output(GradeDocuments)

def grade_documents_node(state: CRAGState) -> dict:
    question = state["question"]
    docs = state["documents"]
    
    relevant_docs = []
    for doc in docs:
        grade = relevance_grader.invoke({
            "question": question,
            "document": doc.page_content,
        })
        if grade.binary_score == "yes":
            relevant_docs.append(doc)
    
    return {"documents": relevant_docs}

# ─── Query rewriter ──────────────────────────────────────────────────────
rewrite_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a query optimisation specialist for reference document retrieval.

The initial query did not retrieve relevant documents. Rewrite the query to:
1. Use more specific domain terminology
2. Break down complex questions into simpler retrieval targets
3. Include alternative phrasings of key concepts

Output only the rewritten query, nothing else."""),
    ("human", "Original query: {question}"),
])

query_rewriter = rewrite_prompt | ChatAnthropic(model="claude-3-haiku-20240307") | StrOutputParser()

def rewrite_query_node(state: CRAGState) -> dict:
    new_question = query_rewriter.invoke({"question": state["question"]})
    return {
        "question": new_question,
        "rewrite_count": state["rewrite_count"] + 1,
    }

# ─── Web search fallback ─────────────────────────────────────────────────
# If rewriting fails too, fall back to web search for general domain knowledge
from langchain_community.tools.tavily_search import TavilySearchResults

web_search_tool = TavilySearchResults(max_results=3)

def web_search_node(state: CRAGState) -> dict:
    """Fallback when local knowledge base has no relevant docs."""
    results = web_search_tool.invoke({"query": state["question"] + " domain your city"})
    web_docs = [Document(page_content=r["content"], metadata={"source": r["url"], "type": "web"})
                for r in results]
    return {"documents": web_docs, "used_web_search": True}

# ─── Routing logic ───────────────────────────────────────────────────────
def route_after_grading(state: CRAGState) -> str:
    has_relevant = len(state["documents"]) > 0
    at_max_rewrites = state["rewrite_count"] >= 2
    
    if has_relevant:
        return "generate"
    elif at_max_rewrites:
        return "web_search"    # last resort: web search
    else:
        return "rewrite"       # try again with better query
```

### Multi-Agent Supervisor Pattern

```python
from langgraph.graph import StateGraph, END, START
from typing import Literal

# ─── Worker agents (specialised sub-agents) ──────────────────────────────
data_agent_runnable = create_agent(
    model=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[retrieve_record_info, search_spec_documents],
    state_modifier="You are the Data Specialist agent. Answer ONLY content coverage questions. Be precise and cite sources.",
    checkpointer=None,  # workers are stateless — supervisor maintains state
)

ops_agent_runnable = create_agent(
    model=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[get_request_status, submit_request, get_required_documents],
    state_modifier="You are the Operations Specialist agent. Handle request submissions, status checks, and documentation requirements.",
    checkpointer=None,
)

pricing_agent_runnable = create_agent(
    model=ChatAnthropic(model="claude-sonnet-4-6"),
    tools=[calculate_price, get_product_pricing, apply_discount],
    state_modifier="You are the Pricing Specialist agent. Handle price calculations and pricing queries only.",
    checkpointer=None,
)

# ─── Supervisor decision schema ───────────────────────────────────────────
class SupervisorDecision(BaseModel):
    """Supervisor routing decision."""
    next: Literal["data_agent", "ops_agent", "pricing_agent", "FINISH"] = Field(
        description="Which agent to call next, or FINISH if the question is fully answered"
    )
    reasoning: str = Field(description="Brief explanation of why this agent was chosen")
    task_for_agent: str = Field(description="Specific task description for the chosen agent")

supervisor_prompt = ChatPromptTemplate.from_messages([
    ("system", """You are the MyApp supervisor. Coordinate specialist agents to answer customer questions.

Available agents:
- data_agent: Coverage questions, record terms, exclusions, spec document search
- ops_agent: Request filing, request status, required documentation for requests
- pricing_agent: Price calculations, product pricing, available discounts

Rules:
1. Call the most appropriate specialist for each part of the question
2. You may call multiple agents if the question spans topics
3. Return FINISH only when the question is fully answered
4. Do not repeat the same agent call with the same task"""),
    MessagesPlaceholder("messages"),
])

structured_supervisor = ChatAnthropic(model="claude-sonnet-4-6").with_structured_output(
    SupervisorDecision
)

def supervisor_node(state: SupervisorState) -> dict:
    decision: SupervisorDecision = structured_supervisor.invoke(
        supervisor_prompt.format_messages(messages=state["messages"])
    )
    return {
        "next": decision.next,
        "messages": [AIMessage(content=f"Routing to {decision.next}: {decision.reasoning}")]
        if decision.next != "FINISH" else [],
    }

# ─── Worker wrapper nodes ─────────────────────────────────────────────────
def run_agent_node(agent_runnable, agent_name: str):
    """Factory function: creates a node that runs a specific agent."""
    def node(state: SupervisorState) -> dict:
        # Run the agent with current message history
        result = agent_runnable.invoke({"messages": state["messages"]})
        # Extract the final AI response and add agent attribution
        final_response = result["messages"][-1]
        final_response.content = f"[{agent_name}]: {final_response.content}"
        return {"messages": [final_response]}
    return node

# ─── Build supervisor graph ───────────────────────────────────────────────
supervisor_graph = StateGraph(SupervisorState)
supervisor_graph.add_node("supervisor", supervisor_node)
supervisor_graph.add_node("data_agent", run_agent_node(data_agent_runnable, "Data Specialist"))
supervisor_graph.add_node("ops_agent", run_agent_node(ops_agent_runnable, "Operations Specialist"))
supervisor_graph.add_node("pricing_agent", run_agent_node(pricing_agent_runnable, "Pricing Specialist"))

supervisor_graph.add_edge(START, "supervisor")
supervisor_graph.add_conditional_edges(
    "supervisor",
    lambda x: x["next"],
    {
        "data_agent": "data_agent",
        "ops_agent": "ops_agent",
        "pricing_agent": "pricing_agent",
        "FINISH": END,
    }
)
# All workers report back to supervisor for next routing decision
for worker in ["data_agent", "ops_agent", "pricing_agent"]:
    supervisor_graph.add_edge(worker, "supervisor")

multi_agent_app = supervisor_graph.compile(
    checkpointer=SqliteSaver(conn),
    recursion_limit=20,   # max 20 agent hops before forced termination
)
```

---

## 18. Callbacks & Observability

### The Callback System

LangChain's callback system lets you hook into every step of a chain or agent execution. Every invocation fires events: `on_chain_start/end/error`, `on_llm_start/end/error`, `on_retriever_start/end/error`, `on_tool_start/end/error`. Callbacks are how LangSmith tracing works.

```python
from langchain_core.callbacks import BaseCallbackHandler, AsyncCallbackHandler
from langchain_core.outputs import LLMResult
import time

class MyAppLogger(BaseCallbackHandler):
    """Custom callback for logging chain execution to your analytics system."""
    
    def __init__(self):
        self.chain_start_time = None
        self.token_count = 0
    
    def on_chain_start(self, serialized: dict, inputs: dict, **kwargs) -> None:
        self.chain_start_time = time.time()
        print(f"[CHAIN START] {serialized.get('name', 'unknown')}")
    
    def on_chain_end(self, outputs: dict, **kwargs) -> None:
        elapsed = time.time() - self.chain_start_time
        print(f"[CHAIN END] Elapsed: {elapsed:.2f}s")
    
    def on_llm_start(self, serialized: dict, prompts: list, **kwargs) -> None:
        print(f"[LLM CALL] Model: {serialized.get('name')}")
    
    def on_llm_end(self, response: LLMResult, **kwargs) -> None:
        if response.llm_output:
            usage = response.llm_output.get("usage", {})
            print(f"[LLM END] Input tokens: {usage.get('input_tokens', '?')}, "
                  f"Output tokens: {usage.get('output_tokens', '?')}")
    
    def on_retriever_start(self, serialized: dict, query: str, **kwargs) -> None:
        print(f"[RETRIEVAL] Query: {query[:80]}")
    
    def on_retriever_end(self, documents, **kwargs) -> None:
        print(f"[RETRIEVAL] Returned {len(documents)} documents")
    
    def on_tool_start(self, serialized: dict, input_str: str, **kwargs) -> None:
        print(f"[TOOL] Calling: {serialized.get('name')} with {input_str[:100]}")
    
    def on_tool_error(self, error: Exception, **kwargs) -> None:
        print(f"[TOOL ERROR] {type(error).__name__}: {str(error)}")

# Use in a chain
logger = MyAppLogger()
result = chain.invoke(
    {"question": "What is my threshold?"},
    config={"callbacks": [logger]},
)
```

### LangSmith Integration — Production Tracing

```python
import os

# Set LangSmith environment variables
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-langsmith-api-key"
os.environ["LANGCHAIN_PROJECT"] = "MyApp-v3.0-production"

# All chain/agent invocations are now automatically traced
# No code changes required — tracing is transparent

# For specific run metadata (user tracking, A/B testing)
result = chain.invoke(
    {"question": "..."},
    config={
        "tags": ["production", "customer_portal-chatbot", "v3.0"],
        "metadata": {
            "user_id": "user-001",
            "session_id": "session-abc",
            "ab_test": "variant-B",
        },
        "run_name": "MyApp-Customer Portal-RAG",
    }
)

# Evaluate traces programmatically
from langsmith import Client
from langsmith.evaluation import evaluate, LangChainStringEvaluator

client = Client()

# Create a dataset from your test cases
dataset = client.create_dataset("MyApp-RAG-Eval-v1")
client.create_examples(
    inputs=[{"question": "What is the product threshold?"}],
    outputs=[{"answer": "The standard threshold is $500 for at-fault requests."}],
    dataset_id=dataset.id,
)

# Run evaluation
results = evaluate(
    target=lambda x: chain.invoke(x),
    data="MyApp-RAG-Eval-v1",
    evaluators=[
        LangChainStringEvaluator("qa", config={"llm": ChatAnthropic(model="claude-sonnet-4-6")}),
        LangChainStringEvaluator("context_qa", ...),
    ],
    experiment_prefix="rag-v3-hybrid-retrieval",
)
```

---

## 19. Async, Streaming & Batching

### Async Patterns for FastAPI

Every LangChain Runnable has async variants (`ainvoke`, `astream`, `abatch`). In FastAPI with `async def` endpoints, always use the async variants to avoid blocking the event loop:

```python
from fastapi import FastAPI, Request
from fastapi.responses import StreamingResponse
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
import asyncio

app = FastAPI()

chain = (
    ChatPromptTemplate.from_messages([
        ("system", "You are MyApp."),
        ("human", "{question}"),
    ])
    | ChatAnthropic(model="claude-sonnet-4-6")
    | StrOutputParser()
)

# Non-streaming: await ainvoke
@app.post("/chat")
async def chat(question: str) -> dict:
    answer = await chain.ainvoke({"question": question})
    return {"answer": answer}

# Streaming: Server-Sent Events
@app.get("/chat/stream")
async def chat_stream(question: str):
    async def generate():
        async for chunk in chain.astream({"question": question}):
            # SSE format
            yield f"data: {chunk}\n\n"
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",   # Nginx: disable buffering
        },
    )

# Batch processing: parallel execution
@app.post("/batch/classify")
async def batch_classify(questions: list[str]) -> list[dict]:
    """Classify multiple questions concurrently."""
    # abatch runs them with controlled concurrency
    results = await classifier_chain.abatch(
        [{"question": q} for q in questions],
        config={"max_concurrency": 10},  # max 10 concurrent API calls
    )
    return [{"question": q, "intent": r} for q, r in zip(questions, results)]
```

### astream_events — Fine-Grained Streaming

`astream_events` gives you granular control over what to stream — you can show tool calls, LLM tokens, retrieval results, and chain steps separately:

```python
@app.get("/chat/events")
async def chat_events(question: str, session_id: str):
    """Stream all agent events including tool calls."""
    
    async def generate():
        async for event in agent.astream_events(
            {"messages": [("human", question)]},
            config={"configurable": {"thread_id": session_id}},
            version="v2",
            include_types=["on_chat_model_stream", "on_tool_start", "on_tool_end"],
        ):
            if event["event"] == "on_chat_model_stream":
                content = event["data"]["chunk"].content
                if content:
                    yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"
            
            elif event["event"] == "on_tool_start":
                yield f"data: {json.dumps({'type': 'tool_start', 'tool': event['name']})}\n\n"
            
            elif event["event"] == "on_tool_end":
                yield f"data: {json.dumps({'type': 'tool_end', 'tool': event['name']})}\n\n"
        
        yield "data: [DONE]\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
```

### Batch Processing at Scale

```python
from langchain_core.runnables import RunnableConfig

# Process 1000 documents for batch embedding + RAG evaluation
questions = ["Q1", "Q2", ...]  # 1000 questions

# Controlled batch with rate limit awareness
# LangChain's abatch handles rate limiting via max_concurrency
results = await chain.abatch(
    [{"question": q} for q in questions],
    config=RunnableConfig(
        max_concurrency=20,          # 20 concurrent API calls
        callbacks=[cost_tracker],    # track token usage across all calls
    ),
    return_exceptions=True,          # don't stop on individual failures
)

# Separate successes and failures
successes = [(q, r) for q, r in zip(questions, results) if not isinstance(r, Exception)]
failures = [(q, r) for q, r in zip(questions, results) if isinstance(r, Exception)]
print(f"Success: {len(successes)}, Failures: {len(failures)}")
```

---

## 20. Production Deployment Patterns

### Environment and Configuration Management

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class MyAppSettings(BaseSettings):
    # API keys
    anthropic_api_key: str
    voyage_api_key: str
    langsmith_api_key: str = ""
    
    # Model configuration
    generation_model: str = "claude-sonnet-4-6"
    classification_model: str = "claude-3-haiku-20240307"
    embedding_model: str = "voyage-3-5"
    
    # Retrieval configuration
    retrieval_k: int = 8
    retrieval_rerank_top_n: int = 3
    bm25_weight: float = 0.4
    semantic_weight: float = 0.6
    score_threshold: float = 0.65
    
    # Application
    environment: str = "production"
    max_conversation_turns: int = 20
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> MyAppSettings:
    return MyAppSettings()
```

### Chain Dependency Injection — Singleton Pattern

```python
from functools import lru_cache
from langchain_voyageai import VoyageAIEmbeddings
from langchain_chroma import Chroma
from langchain.retrievers import EnsembleRetriever, ContextualCompressionRetriever

@lru_cache()
def get_embeddings() -> VoyageAIEmbeddings:
    s = get_settings()
    return VoyageAIEmbeddings(
        voyage_api_key=s.voyage_api_key,
        model=s.embedding_model,
        input_type="query",
    )

@lru_cache()
def get_vectorstore() -> Chroma:
    return Chroma(
        collection_name="app_docs_v3",
        embedding_function=get_embeddings(),
        persist_directory="./chroma_db",
    )

@lru_cache()
def get_retriever() -> ContextualCompressionRetriever:
    s = get_settings()
    vs = get_vectorstore()
    bm25 = get_bm25_retriever()  # load from pickle
    
    semantic = vs.as_retriever(search_kwargs={"k": s.retrieval_k})
    hybrid = EnsembleRetriever(
        retrievers=[bm25, semantic],
        weights=[s.bm25_weight, s.semantic_weight],
    )
    cross_encoder = HuggingFaceCrossEncoder(model_name="cross-encoder/ms-marco-MiniLM-L-6-v2")
    reranker = CrossEncoderReranker(model=cross_encoder, top_n=s.retrieval_rerank_top_n)
    
    return ContextualCompressionRetriever(base_compressor=reranker, base_retriever=hybrid)

# In FastAPI
from fastapi import Depends

@app.post("/chat")
async def chat(
    message: str,
    retriever: ContextualCompressionRetriever = Depends(get_retriever),
):
    ...
```

### Health Checks and Graceful Shutdown

```python
@app.get("/health")
async def health_check():
    checks = {}
    
    # Check vector store connectivity
    try:
        vs = get_vectorstore()
        count = vs._collection.count()
        checks["vectorstore"] = {"status": "ok", "document_count": count}
    except Exception as e:
        checks["vectorstore"] = {"status": "error", "message": str(e)}
    
    # Check Anthropic API (minimal call)
    try:
        model = ChatAnthropic(model="claude-3-haiku-20240307")
        model.invoke("ping", max_tokens=1)
        checks["anthropic"] = {"status": "ok"}
    except Exception as e:
        checks["anthropic"] = {"status": "error", "message": str(e)}
    
    overall = "healthy" if all(c["status"] == "ok" for c in checks.values()) else "degraded"
    return {"status": overall, "checks": checks}

@app.on_event("shutdown")
async def shutdown():
    # Close database connections
    conn.close()
    # Flush any pending traces to LangSmith
    ...
```

---

## 21. Application Stack Mapping

This section maps every component of your your application PRD to the precise LangChain abstractions that implement it.

### Dual Chatbot Architecture

| App Component | LangChain Abstraction | Key Class |
|---------------------|----------------------|-----------|
| Customer Chatbot (customer) | LCEL RAG chain with history | `RunnableWithMessageHistory` |
| Developer Chatbot (developer) | LCEL RAG chain, different collection | Same, different `Chroma` collection |
| Intent Router | `RunnableBranch` | Routes by intent to Customer Portal or Support chain |
| Claude Haiku classifier | `ChatAnthropic.with_structured_output()` | `InsuranceIntent` Pydantic model |
| Claude Sonnet generator | `ChatAnthropic` | In generation chain |

### RAG Pipeline

| App Component | LangChain Abstraction | Key Class |
|---------------------|----------------------|-----------|
| Voyage AI voyage-3.5 | `VoyageAIEmbeddings` | `langchain_voyageai` |
| ChromaDB (two collections) | `Chroma` | `langchain_chroma` |
| BM25 keyword search | `BM25Retriever` | `langchain_community` |
| Semantic vector search | `VectorStoreRetriever` | `Chroma.as_retriever()` |
| BM25 + semantic hybrid | `EnsembleRetriever` | `langchain.retrievers` |
| HyDE query expansion | LCEL chain → retriever | Custom `hyde_generator | semantic_retriever` |
| Cross-encoder re-ranking | `CrossEncoderReranker` | `langchain.retrievers.document_compressors` |
| Full pipeline | `ContextualCompressionRetriever` | Wraps `EnsembleRetriever` |

### Security & PII

| App Component | LangChain Abstraction | Implementation |
|---------------------|----------------------|----------------|
| Microsoft Presidio PII gate | `RunnableLambda` | `RunnableLambda(presidio_mask)` inserted before LLM call |
| PII detection on output | `RunnableLambda` | Inserted after LLM, before returning to user |
| Audit logging | `BaseCallbackHandler` | `on_llm_start/end` logs to SQLite analytics |

### Agentic RAG Phases

| Phase | Pattern | LangChain Implementation |
|-------|---------|-------------------------|
| Phase 1 (Current) | Advanced RAG | LCEL chain with `EnsembleRetriever` + `ContextualCompressionRetriever` |
| Phase 2 (CRAG) | Corrective RAG | `StateGraph` with grading + rewrite loop |
| Phase 3 (Hierarchical) | Parent-child retrieval | `ParentDocumentRetriever` or `MultiVectorRetriever` |
| Phase 4 (Agentic) | Supervisor multi-agent | `StateGraph` with `data_agent`, `ops_agent`, `pricing_agent` workers |

### MCP Tool Specs

| MCP Tool | LangChain Tool Pattern | Notes |
|--------------------|----------------------|-------|
| `get_record_details` | `@tool` decorated function | DB lookup |
| `submit_request` | `StructuredTool` with `RequestSubmissionInput` schema | Complex input validation |
| `get_request_status` | `@tool` | Simple DB lookup |
| `calculate_price` | `@tool` | Formula-based computation |
| `search_knowledge_base` | `BaseTool` subclass | Wraps `compression_retriever` |

### SQLite Analytics → LangSmith

Your planned SQLite analytics layer (tracking queries, retrieval results, response quality) can be implemented either via `BaseCallbackHandler` writing to SQLite, or by routing everything through LangSmith and using its evaluation APIs. LangSmith gives you token usage, latency histograms, trace replay, and dataset-based evaluation out of the box.

---

*End of LangChain Deep Reference Guide — v1.1 · General Edition · Updated March 2026*

*Next recommended study: LangSmith evaluation cookbook, LangGraph Platform deployment, and the `MultiVectorRetriever` for Hierarchical RAG implementation.*


---

## 21. Deep Agents v0.4 (February 2026)

> Deep Agents is a separate LangChain product (not a package) for deploying long-running, persistent agents with pluggable sandboxes. Released February 2026 as v0.4.

### What Deep Agents Adds

Standard LangGraph agents are in-process: they start, run, and finish in a single Python process. Deep Agents add:

1. **Persistent state across sessions** - conversations and memory survive individual runs; state stored in configurable backends (Redis, Postgres, or managed LangSmith storage)
2. **Pluggable execution sandbox** - agent tools run in isolated containers (Docker, E2B, or custom); prevents tool code from affecting the host process
3. **Smarter conversation summarization** - v0.4 introduced a hybrid summarizer that preserves semantic precision for code and SQL arguments while aggressively compressing natural language history
4. **Event streaming** - real-time SSE/WebSocket event stream from long-running agents; clients subscribe via token
5. **Built-in interrupt/resume** - agents can be paused at any tool boundary and resumed later (supports human-in-the-loop) without losing state

### Architecture

```
Client (browser/app)
   |  SSE / WebSocket events
   v
Deep Agents API Server (FastAPI)
   |  Task queue (Celery / BullMQ)
   v
Agent Worker Pool
   |  LangGraph agent + tool calls
   v
Sandbox (E2B / Docker)     <-- tools run here (code, bash, browser)
   |
   v
State Backend (Redis / Postgres / LangSmith)
```

### When to Use Deep Agents vs LangGraph

| Feature | LangGraph (in-process) | Deep Agents |
|---------|----------------------|-------------|
| Setup complexity | Low (just Python) | High (server + sandbox) |
| Persistence | Manual (checkpointer) | Built-in |
| Isolation | No | Yes (sandbox) |
| Long-running (hours) | Fragile | Designed for it |
| Real-time streaming | Via callbacks | Native SSE |
| Cost | No infrastructure | Infra + API server |
| Best for | Dev/prototyping | Production agents |

Deep Agents v0.4 is the right choice when your agents run for minutes or hours, execute actual code (code interpreter pattern), or need interrupt/resume for human approval flows.

---

## 22. LangSmith Fleet (March 2026)

> **LangSmith Fleet** is the renamed and expanded version of what was previously called **LangSmith Agent Builder** (renamed March 19, 2026). It is the managed platform for deploying, monitoring, and scaling LangGraph agents.

### What Fleet Provides

- **Hosted deployment:** Upload a LangGraph agent; Fleet manages containers, scaling, and rollouts
- **Fleet dashboard:** Monitor all deployed agents across environments (dev/staging/prod)
- **Live agent inspection:** Pause any running agent, inspect its state, inject messages, resume
- **A/B deployment:** Canary releases for agent updates with automatic rollback on error rate threshold
- **Evaluation pipelines:** Connect to LangSmith datasets for continuous regression testing
- **Cost tracking:** Per-agent token usage and latency breakdown across model providers

### Fleet vs LangSmith (Observability)

LangSmith (the observability product) and LangSmith Fleet (the deployment product) are complementary:

`
LangSmith (observe)         LangSmith Fleet (deploy)
-----------------------     ----------------------------
Traces & spans              Hosted agent runtime
Evaluation / datasets       Agent lifecycle management
Prompt monitoring           Scaling / rollout control
Feedback collection         Live state inspection
`

Both are accessed from smith.langchain.com. Fleet is a paid add-on to the LangSmith Team/Enterprise tier.

### Quick Start with Fleet

```python
# 1. Define your agent as a LangGraph StateGraph (standard pattern)
from langgraph.graph import StateGraph
graph = StateGraph(MyAgentState)
# ... add nodes, edges

# 2. Compile to get a LangGraph app
app = graph.compile()

# 3. Deploy to Fleet via LangSmith CLI
# pip install langsmith-cli
# langsmith fleet deploy --name my-agent --graph app
```

---

## 23. New in LangChain v1.1 (May 2026)

### `create_agent` API — The New Standard

LangChain v1.1 introduces `create_agent` as the idiomatic way to build agents, replacing the older `initialize_agent` and `AgentExecutor` constructs:

```python
from langchain.agents import create_agent
from langchain_anthropic import ChatAnthropic
from langchain_community.tools import DuckDuckGoSearchRun

llm = ChatAnthropic(model="claude-sonnet-4-5")
tools = [DuckDuckGoSearchRun()]

# New clean API
agent = create_agent(
    llm=llm,
    tools=tools,
    system_message="You are a research assistant.",
    middleware=[                          # NEW: composable middleware
        "pii_redaction",                 # strip PII before LLM sees it
        "human_approval",                # human-in-the-loop gate
    ],
)

result = agent.invoke({"input": "What is the latest LangChain version?"})
```

**Migration from old API:**

```python
# OLD (v0.x / early v1.0) — deprecated
from langchain.agents import initialize_agent, AgentType
agent = initialize_agent(tools, llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION)

# NEW (v1.1) — preferred
from langchain.agents import create_agent
agent = create_agent(llm=llm, tools=tools)
```

### Model Profiles

Every LLM/chat model now exposes a `.profile` attribute for programmatic capability introspection:

```python
from langchain_anthropic import ChatAnthropic

llm = ChatAnthropic(model="claude-sonnet-4-5")

print(llm.profile.supports_vision)          # True
print(llm.profile.supports_tool_calling)    # True
print(llm.profile.context_window)           # 200000
print(llm.profile.supports_streaming)       # True
print(llm.profile.modalities)               # ["text", "image", "pdf"]
```

**Use case:** Write model-agnostic code that adapts at runtime:

```python
def build_pipeline(llm):
    if llm.profile.supports_vision:
        return multimodal_chain
    else:
        return text_only_chain
```

### Structured Content Blocks

All model responses are now structured content blocks rather than plain strings:

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage

llm = ChatAnthropic(model="claude-sonnet-4-5")
response = llm.invoke([HumanMessage(content="What is Python?")])

# v1.1 response structure
print(response.content)          # list of content blocks
# [{"type": "text", "text": "Python is..."}]

# For tool calls:
# [{"type": "tool_use", "id": "toolu_01", "name": "search", "input": {...}}]
```

### `langchain-classic` for Backward Compatibility

Legacy chains and patterns moved to `langchain-classic`:

```bash
pip install langchain-classic    # old patterns, backward compat
```

```python
# Accessing deprecated legacy chains
from langchain_classic.chains import LLMChain, StuffDocumentsChain
```

### LangSmith → Fleet Rebranding

LangSmith has been rebranded as **Fleet** with expanded features:

```python
import os
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_API_KEY"] = "your-fleet-api-key"
os.environ["LANGCHAIN_PROJECT"] = "my-rag-project"

# Fleet (formerly LangSmith) now includes:
# - Experiment tracking with version comparison
# - Cost tracking across all LLM calls
# - On-prem / self-hosted deployment option
# - A/B testing for prompt variants
```

---

*End of LangChain Deep Reference Guide - v1.1 - General Edition - Updated May 2026*

*Next recommended study: Fleet evaluation cookbook, Deep Agents v0.4 sandbox configuration, MultiVectorRetriever for Hierarchical RAG, and Fleet deployment guide.*
