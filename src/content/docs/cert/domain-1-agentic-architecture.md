---
title: "Domain 1: Agentic Architecture & Orchestration"
description: "The highest-weighted domain (27%). Covers agentic loops, multi-agent hub-and-spoke patterns, hooks, session management, and task decomposition."
sidebar:
  order: 1
---

# Domain 1: Agentic Architecture & Orchestration

## Weight: 27% — The Highest Priority Domain (~16 questions)

**Appears in Scenarios:** 1 (Customer Support), 3 (Multi-Agent Research), 4 (Developer Productivity)

---

## What This Domain Tests

You must be able to:
- Implement the agentic loop correctly at the API level (stop_reason routing, tool result appending)
- Design hub-and-spoke multi-agent systems with proper context isolation
- Choose between hooks (deterministic) and prompts (probabilistic) for compliance
- Decompose tasks into subtasks appropriately for different complexity levels
- Manage sessions: resume, fork, compact, crash recovery

---

## Task Statement 1.1: The Agentic Loop Lifecycle

### What Is an Agentic Loop?

An agentic loop is how Claude runs autonomously. Instead of one prompt → one answer, Claude can call tools repeatedly until it decides the task is done. **The key insight: Claude controls when to stop — your code just checks a signal called `stop_reason`.**

### Complete Agentic Loop Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AGENTIC LOOP                                 │
│                                                                     │
│   ┌──────────────┐                                                  │
│   │  YOUR CODE   │                                                  │
│   │              │ 1. Send prompt + tools + conversation history    │
│   │  messages = [│─────────────────────────────────────────────►   │
│   │   {role:user}│                                              │   │
│   │  ]           │                                   ┌──────────┴──┐│
│   └──────────────┘                                   │ CLAUDE API  ││
│                                                      │             ││
│                                                      │ 2. Evaluates││
│                                                      │    prompt + ││
│                                                      │    tools    ││
│                                                      └──────┬──────┘│
│                                                             │       │
│                                              3. Returns response    │
│                                               with stop_reason     │
│                                                             │       │
│                                    ┌────────────────────────▼────┐ │
│                                    │    CHECK stop_reason        │ │
│                                    └──────┬──────────────┬───────┘ │
│                                           │              │         │
│                              "end_turn"   │              │ "tool_use"
│                                           │              │         │
│                              ┌────────────▼─┐   ┌────────▼──────┐ │
│                              │    DONE      │   │ 4. Execute    │ │
│                              │              │   │    each tool  │ │
│                              │ Return text  │   │    in response│ │
│                              └──────────────┘   └────────┬──────┘ │
│                                                          │        │
│                                              5. Append to messages:│
│                                                 assistant response │
│                                                 + tool results     │
│                                                          │        │
│                                                          └──► LOOP │
│                                                             again  │
└─────────────────────────────────────────────────────────────────────┘
```

### All stop_reason Values — Memorize These

| stop_reason | Meaning | Your Code Should... |
|---|---|---|
| `"end_turn"` | Claude finished naturally. Most common. | Terminate loop. Return text. |
| `"tool_use"` | Claude wants to call tools. | Execute tools → append results → loop. |
| `"max_tokens"` | Response truncated at your max_tokens limit. | Handle truncation or increase max_tokens. |
| `"stop_sequence"` | Hit a custom stop sequence you defined. | Treat like end_turn for that sequence. |
| `"refusal"` | Safety classifier declined the request. | Surface to user or log for review. |
| `"pause_turn"` | Server-side loop hit its iteration limit (default 10). | Send response back as-is to continue. |
| `"model_context_window_exceeded"` | Hit the context window limit. | Compact/truncate context. |

> **Exam trap:** Never parse Claude's text output to decide when to stop. Never use arbitrary iteration caps as the primary stopping mechanism. Always route on `stop_reason`.

### The Three Anti-Patterns (These Appear as Wrong Answers)

```
❌ ANTI-PATTERN 1: Parsing natural language for termination
   if "I'm done" in response.content[0].text:   # WRONG
       break
   → Always check response.stop_reason == "end_turn"

❌ ANTI-PATTERN 2: Arbitrary iteration cap as primary stop
   for i in range(5):                           # WRONG as primary mechanism
       response = call_claude()
   → Use max_turns/max_budget_usd as safety limits, not primary control

❌ ANTI-PATTERN 3: Text content routing
   if "use_order_tool" in response.text:        # WRONG
       call_order_tool()
   → Let Claude's tool_use blocks drive routing
```

### Complete Code Example — Python (Raw API)

```python
import anthropic

client = anthropic.Anthropic()

tools = [
    {
        "name": "get_customer",
        "description": (
            "Look up a customer by email or phone. Returns customer ID, name, "
            "account status, and loyalty tier. "
            "Use BEFORE any order lookups or refund processing to verify identity. "
            "Do NOT call with only a name — must have email or phone."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "email": {"type": "string", "description": "Customer email address"},
                "phone": {"type": "string", "description": "Customer phone number"}
            }
        }
    },
    {
        "name": "lookup_order",
        "description": (
            "Retrieve order details by order ID. Returns items, amounts, status, "
            "shipping info, and return eligibility. "
            "REQUIRES verified customer_id from get_customer first."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string"},
                "customer_id": {"type": "string", "description": "From get_customer"}
            },
            "required": ["order_id", "customer_id"]
        }
    }
]

def execute_tool(name: str, tool_input: dict) -> str:
    if name == "get_customer":
        return '{"customer_id": "C-12345", "name": "Jane Smith", "status": "active"}'
    elif name == "lookup_order":
        return '{"order_id": "ORD-789", "total": 99.99, "status": "delivered"}'
    return '{"error": "Unknown tool"}'

def agent_loop(user_message: str) -> str:
    messages = [{"role": "user", "content": user_message}]

    while True:
        # Step 1: Call Claude with full conversation history
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=4096,
            tools=tools,
            messages=messages,
        )

        # Step 2: Append FULL assistant response (text + tool_use blocks)
        messages.append({"role": "assistant", "content": response.content})

        # Step 3: Route on stop_reason — NEVER on text content
        if response.stop_reason == "end_turn":
            return "\n".join(
                block.text for block in response.content if block.type == "text"
            )

        # Step 4: Execute each tool_use block
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                result = execute_tool(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,  # MUST match tool_use block id
                    "content": result,
                })

        # Step 5: Append tool results as a USER message
        messages.append({"role": "user", "content": tool_results})
        # Loop continues automatically
```

### Agent SDK Version (Abstracts the Loop)

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage

async def main():
    async for message in query(
        prompt="Check order #12345 for customer jane@example.com",
        options=ClaudeAgentOptions(
            allowed_tools=["Read", "Edit", "Glob"],
            permission_mode="acceptEdits",
            max_turns=10,           # Safety limit (not primary stop mechanism)
            max_budget_usd=0.50,    # Cost safety limit
        ),
    ):
        if isinstance(message, AssistantMessage):
            for block in message.content:
                if hasattr(block, "text"):
                    print(block.text)
        elif isinstance(message, ResultMessage):
            # ResultMessage.subtype: "success" | "error_max_turns" | "error_budget"
            print(f"Ended: {message.subtype}")
            print(f"Stop reason: {message.stop_reason}")
            print(f"Cost: ${message.total_cost_usd}")
            print(f"Turns: {message.num_turns}")
```

---

## Task Statement 1.2: Multi-Agent Hub-and-Spoke Orchestration

### Why Multi-Agent Systems?

One agent with too many tools and too much context makes poor decisions. Specialized agents with focused tools and scoped context perform much better.

### The Hub-and-Spoke Pattern

```
                        ┌──────────────────────┐
                        │   COORDINATOR AGENT  │
                        │   (Hub/Orchestrator) │
                        │                      │
                        │  Responsibilities:   │
                        │  1. Task decompose   │
                        │  2. Delegate & route │
                        │  3. Aggregate results│
                        │                      │
                        │  Tools: [Agent only] │
                        └──┬────────┬────────┬─┘
                           │        │        │
              Spawn ───────┘        │        └──────── Spawn
              (parallel)            │                 (parallel)
                           │        │        │
               ┌───────────▼─┐ ┌───▼────────▼──┐ ┌──────────────┐
               │ WEB SEARCH  │ │  DOCUMENT      │ │  SYNTHESIS   │
               │   AGENT     │ │  ANALYSIS      │ │    AGENT     │
               │             │ │    AGENT       │ │              │
               │ Tools:      │ │                │ │ Tools:       │
               │ [web_search,│ │ Tools:         │ │ [summarize,  │
               │  fetch_url] │ │ [read_doc,     │ │  verify,     │
               │             │ │  extract_data] │ │  format]     │
               │ Context:    │ │                │ │              │
               │ ISOLATED    │ │ Context:       │ │ Context:     │
               │ (fresh)     │ │ ISOLATED       │ │ ISOLATED     │
               └──────┬──────┘ └───────┬────────┘ └──────┬───────┘
                      │                │                  │
                      │ Returns        │ Returns          │ Returns
                      │ summary only   │ summary only     │ summary only
                      └────────────────┴──────────────────┘
                                       │
                            Coordinator aggregates
                            all summaries, produces
                            final response
```

### Critical: Subagent Context Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONTEXT ISOLATION RULE                       │
│                                                                 │
│  COORDINATOR has:                                               │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ User message + full conversation history + tool results │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  SUBAGENT starts with: (ONLY what coordinator explicitly sends) │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Fresh prompt: "Search for AI drug discovery papers.    │    │
│  │  Focus on clinical trials. Return top 5 findings with  │    │
│  │  sources. Format: {claim, source_url, date}"           │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Subagent does NOT see:                                         │
│  ✗ Coordinator's conversation history                           │
│  ✗ What other subagents are doing                              │
│  ✗ The user's original question (unless coordinator includes it)│
│                                                                 │
│  Subagent returns: (its final message only — internal          │
│  tool calls and intermediate reasoning are NOT forwarded)       │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Concise structured result — NOT the full transcript     │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

> **Exam trap:** If the final report misses topics or subagents misinterpret their task — the root cause is almost always the coordinator's task decomposition, not the subagent itself.

### Parallel Subagent Spawning

A coordinator can emit multiple `Agent` tool calls in a single response. The SDK executes them **concurrently**:

```python
# Coordinator emits this response (three Agent calls at once):
response.content = [
    ToolUseBlock(name="Agent", id="t1", input={
        "prompt": "Search for AI drug discovery. Return 5 findings with sources.",
        "agent": "web-search-agent"
    }),
    ToolUseBlock(name="Agent", id="t2", input={
        "prompt": "Analyze the pre-loaded research database for clinical trial data.",
        "agent": "doc-analysis-agent"
    }),
    ToolUseBlock(name="Agent", id="t3", input={
        "prompt": "Search recent conference proceedings for AI pharma innovations.",
        "agent": "web-search-agent"
    }),
]
# SDK runs t1, t2, t3 in parallel → up to 90% faster than sequential
```

### Task Complexity Scaling Guidelines

```
SIMPLE FACT-FINDING
  → 1 agent with 3–10 tool calls
  Example: "What is the capital of France?" or "Find the function signature for X"

DIRECT COMPARISONS / STRUCTURED RESEARCH
  → 2–4 subagents with 10–15 tool calls each
  Example: "Compare three approaches to distributed caching"

COMPLEX, OPEN-ENDED RESEARCH
  → 10+ subagents
  Example: "Comprehensive analysis of AI adoption in healthcare globally"
  Warning: Early mistake was spawning 50 subagents for simple queries.
           Right-size based on actual complexity.
```

### Pattern 3: Parallel Fan-Out (Broadcast)

Fan-out launches multiple specialist agents simultaneously for independent subtasks, then merges results. This is the pattern behind `/ultrareview` and multi-perspective analysis.

```
                    PARALLEL FAN-OUT PATTERN
                    ─────────────────────────────────────────

              User Request
                    │
                    ▼
        ┌───────────────────────┐
        │   ORCHESTRATOR        │
        │                       │
        │  1. Decompose task    │
        │  2. Launch N agents   │
        │     in parallel       │
        │  3. Await all results │
        │  4. Merge + synthesize│
        └──────────┬────────────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │Agent A  │ │Agent B  │ │Agent C  │
  │(domain 1│ │(domain 2│ │(domain 3│
  │ specialist│ specialist│ specialist│
  └────┬────┘ └────┬────┘ └────┬────┘
       │           │           │
       └───────────┼───────────┘
                   │
                   ▼
        ┌──────────────────┐
        │  MERGE / SYNTHESIS│
        │  Deduplicate,     │
        │  rank, format     │
        └──────────────────┘
                   │
                   ▼
               Final Result


Key properties:
  ✓ Each agent has FRESH context (no parent conversation)
  ✓ Agents run concurrently → N× faster than sequential
  ✓ Orchestrator aggregates, not individual agents
  ✓ Use for: code review, multi-perspective research, parallel validation
  ✗ Not for: tasks with dependencies between subtasks (use pipeline instead)
```

**Exam pattern:** Fan-out = fresh context per agent + parallel + merge. The exam tests that you know subagents NEVER inherit coordinator context.

---

## Task Statement 1.3: Subagent Invocation and Context Passing

### AgentDefinition — Exact Configuration

> **Note:** The `Agent` tool was renamed from `Task` in v2.1.63. Both `Task(...)` and `Agent(...)` work as aliases.

```typescript
// TypeScript — Full AgentDefinition type
type AgentDefinition = {
  description: string;                              // REQUIRED: When to use this agent
  prompt: string;                                   // REQUIRED: Agent's system prompt
  tools?: string[];                                 // Allowed tool names (omit = inherit all)
  disallowedTools?: string[];                       // Block specific tools
  model?: "sonnet" | "opus" | "haiku" | "inherit"; // Route to different model
  mcpServers?: AgentMcpServerSpec[];                // MCP servers for this agent
  skills?: string[];                                // Skills to preload
  maxTurns?: number;                                // Turn limit for this agent
};
```

```python
# Python — Dataclass (fewer fields than TypeScript)
@dataclass
class AgentDefinition:
    description: str                              # Required
    prompt: str                                   # Required
    tools: list[str] | None = None               # None = inherit all
    model: Literal["sonnet","opus","haiku","inherit"] | None = None
```

### Configuring a Multi-Agent System (TypeScript)

```typescript
import { query } from "@anthropic-ai/agent-sdk";

for await (const message of query({
  prompt: "Research AI applications in drug discovery and write a comprehensive report",
  options: {
    allowedTools: ["Agent"],   // ← MUST include "Agent" for coordinator to spawn subagents
    agents: {
      "web-researcher": {
        description: "Searches the web for academic papers, news, and reports. "
                     "Use for any query requiring current web information.",
        prompt: "You are a research specialist. Search thoroughly and return "
                "structured findings with source URLs and publication dates.",
        tools: ["web_search", "fetch_url"],
        model: "sonnet"
      },
      "doc-analyzer": {
        description: "Analyzes uploaded documents, PDFs, and structured data files. "
                     "Use for local document processing, NOT web content.",
        prompt: "You are a document analysis specialist. Extract structured data "
                "with field-level confidence scores.",
        tools: ["Read", "Grep", "Glob"],
        model: "haiku"   // Cheaper model for simpler doc tasks
      },
      "synthesizer": {
        description: "Combines research findings into coherent reports. "
                     "Use AFTER web-researcher and doc-analyzer have returned results.",
        prompt: "You are a synthesis specialist. Combine provided findings into "
                "well-structured reports with proper source attribution.",
        tools: ["summarize", "verify_fact"],
        model: "opus"    // Most capable for final synthesis
      }
    }
  }
})) { /* handle messages */ }
```

### What Goes in the Coordinator's Prompt

When spawning a subagent, the coordinator must explicitly include everything the subagent needs:

```
✅ GOOD coordinator prompt for subagent:
  "Search the web for AI drug discovery papers published in 2024–2025.
   Focus specifically on: (1) clinical trial phase data, (2) FDA approval timelines.
   
   User's original question: 'How is AI changing drug discovery timelines?'
   
   Return exactly 5 findings in this format:
   {claim: string, source_url: string, publication_date: string, relevance_score: 1-5}
   
   Do NOT include papers older than 2024."

❌ BAD coordinator prompt for subagent:
  "Search for relevant papers"
  → Subagent has no context, no scope, no output format → poor results
```

### allowedTools Rules

```
COORDINATOR agent:
  allowedTools: ["Agent"]          ← Must include "Agent" to spawn subagents
  (Also include any tools coordinator uses directly)

SUBAGENT:
  tools: ["Read", "Grep", "Glob"] ← Never include "Agent" in subagent tools
  (Prevents infinite nesting — subagents cannot spawn their own subagents)
```

---

## Task Statement 1.4: Programmatic Enforcement vs. Prompt-Based Guidance

### The Core Distinction

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  PROMPT INSTRUCTIONS          PROGRAMMATIC HOOKS                 │
│  ─────────────────────        ──────────────────────────         │
│  "Always verify customer      PreToolUse hook blocks             │
│   ID before processing        process_refund if no               │
│   refunds."                   customer_id in state               │
│                                                                  │
│  Compliance: ~95–99%          Compliance: 100%                   │
│  (Still fails ~1–5%)          (Cannot be bypassed)               │
│                                                                  │
│  Use for: Guidance,           Use for: Financial operations,     │
│  best practices,              compliance requirements,           │
│  stylistic preferences        security controls                  │
└──────────────────────────────────────────────────────────────────┘
```

### When to Use Each

| Scenario | Choice | Why |
|---|---|---|
| Block refunds > $500 automatically | **Hook (PreToolUse)** | Financial compliance — must be deterministic |
| Normalize timestamps before model sees them | **Hook (PostToolUse)** | Consistent data format — predictable |
| Instruct agent to be polite | **Prompt** | Style guidance — acceptable if occasional failure |
| Require customer verification before order lookup | **Hook (PreToolUse)** | Identity verification — zero-tolerance failure |
| Tell agent to prefer metric units | **Prompt** | Format preference — minor if fails |
| Block dangerous bash commands | **Hook (PreToolUse)** | Security — must be deterministic |

### Permission Decision Flow

```
Tool call requested
        │
        ▼
┌───────────────────┐
│  PreToolUse Hook  │ ← Fires FIRST. Can block, allow, or ask.
└──────┬────────────┘   Can also modify tool inputs (updatedInput).
       │
       ▼
┌───────────────────┐
│   Deny Rules      │ ← Explicit deny list (e.g., bash commands)
└──────┬────────────┘
       │
       ▼
┌───────────────────┐
│   Allow Rules     │ ← Explicit allow list
└──────┬────────────┘
       │
       ▼
┌───────────────────┐
│    Ask Rules      │ ← Requires user confirmation
└──────┬────────────┘
       │
       ▼
┌───────────────────┐
│ Permission Mode   │ ← auto / acceptEdits / bypassPermissions / plan
│     Check         │
└──────┬────────────┘
       │
       ▼
┌───────────────────┐
│ canUseTool        │ ← Custom callback for fine-grained control
│   Callback        │
└──────┬────────────┘
       │
       ▼
   Tool executes
        │
        ▼
┌───────────────────┐
│ PostToolUse Hook  │ ← Fires AFTER execution. Cannot undo the action.
└───────────────────┘   Can add additionalContext or modify MCP output.
```

---

## Task Statement 1.5: Agent SDK Hooks in Detail

### PreToolUse Hook

Fires **before** a tool executes. Can block, allow, or modify.

```python
from claude_agent_sdk import PreToolUseHook, HookResult

def refund_guard_hook(input_data: dict, tool_use_id: str | None, context) -> HookResult:
    """Block refunds over $500 — deterministic financial compliance."""
    
    if input_data.get("tool_name") != "process_refund":
        return HookResult(continue_=True)  # Not our tool, pass through
    
    refund_amount = input_data.get("tool_input", {}).get("amount", 0)
    
    if refund_amount > 500:
        return HookResult(
            continue_=False,
            hook_specific_output={
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": (
                    f"Refund of ${refund_amount} exceeds $500 limit. "
                    "Escalate to human agent for approval."
                )
            }
        )
    
    return HookResult(
        continue_=True,
        hook_specific_output={
            "hookEventName": "PreToolUse",
            "permissionDecision": "allow"
        }
    )

# Modifying tool input (e.g., sanitizing before execution):
def sanitize_query_hook(input_data: dict, tool_use_id: str | None, context) -> HookResult:
    if input_data.get("tool_name") == "search_database":
        cleaned_input = {
            **input_data["tool_input"],
            "query": sanitize_sql(input_data["tool_input"]["query"])
        }
        return HookResult(
            continue_=True,
            hook_specific_output={
                "hookEventName": "PreToolUse",
                "permissionDecision": "allow",
                "updatedInput": cleaned_input   # Modified input used instead
            }
        )
    return HookResult(continue_=True)
```

### PostToolUse Hook

Fires **after** a tool executes. Cannot undo. Used to normalize data before the model sees it.

```python
def timestamp_normalizer_hook(input_data: dict, tool_use_id: str | None, context) -> HookResult:
    """Convert Unix timestamps to ISO 8601 before model processes them."""
    
    tool_response = input_data.get("tool_response", {})
    
    if "created_at" in tool_response:
        # Convert Unix timestamp to ISO 8601 string
        unix_ts = tool_response["created_at"]
        iso_str = datetime.utcfromtimestamp(unix_ts).isoformat() + "Z"
        
        return HookResult(
            continue_=True,
            hook_specific_output={
                "hookEventName": "PostToolUse",
                "additionalContext": (
                    f"Note: created_at has been converted from Unix timestamp "
                    f"({unix_ts}) to ISO 8601 ({iso_str}) for consistency."
                )
            }
        )
    
    return HookResult(continue_=True)
```

### Hook input_data Fields

| Field | Available In | Description |
|---|---|---|
| `hook_event_name` | Both | "PreToolUse" or "PostToolUse" |
| `session_id` | Both | Current session identifier |
| `transcript_path` | Both | Path to conversation transcript file |
| `cwd` | Both | Current working directory |
| `permission_mode` | Both | Current permission mode |
| `tool_name` | Both | Name of the tool being called |
| `tool_input` | Both | Tool arguments dict |
| `tool_use_id` | Both | Correlates Pre and Post events |
| `tool_response` | PostToolUse only | The tool's return value |

> **Key exam fact:** Hooks run in the application process and consume **zero context window tokens**. They operate entirely outside the model's context.

### Hook Use Cases Summary

```
PreToolUse → BLOCK dangerous actions:
  ✓ Block process_refund > $500
  ✓ Block bash commands with rm -rf
  ✓ Block write access to production config files
  ✓ Verify customer identity before financial operations

PreToolUse → MODIFY inputs:
  ✓ Sanitize SQL queries before execution
  ✓ Add required fields to API calls
  ✓ Override file paths to sandbox directories

PostToolUse → NORMALIZE outputs:
  ✓ Convert Unix timestamps → ISO 8601
  ✓ Redact sensitive fields (SSN, credit card numbers)
  ✓ Add metadata context to tool results
  ✓ Log all tool executions for compliance audit
```

---

## Task Statement 1.6: Task Decomposition Strategies

### Fixed Pipeline vs. Dynamic Decomposition

```
FIXED SEQUENTIAL PIPELINE (Prompt Chaining)
  Step 1 → Step 2 → Step 3 → Done
  
  Use when: Steps are known in advance. Order is fixed.
  Example: "Extract data" → "Validate" → "Load to database"
  Called "workflows" in Anthropic's "Building Effective Agents" post

DYNAMIC ADAPTIVE DECOMPOSITION (True Agents)
  Task → Agent decides what steps → Adjusts based on findings → Done
  
  Use when: Required steps can't be predicted. Open-ended research.
  Example: "Investigate why our API latency spiked yesterday"
  The agent might find it's a database issue and pivot to DB investigation
```

### The Per-File + Cross-File Review Pattern

For large PRs (e.g., 14 files), a single review misses cross-file integration bugs:

```
PHASE 1 — Parallel Per-File Analysis:
  Spawn one subagent per file (or group of files)
  
  Subagent A: "Review auth.ts for: bugs, type errors, unhandled exceptions"
  Subagent B: "Review users.ts for: bugs, type errors, unhandled exceptions"
  Subagent C: "Review db.ts for: bugs, type errors, unhandled exceptions"
  
  Each subagent focuses on ONE file → consistent depth
  All run in PARALLEL → fast

PHASE 2 — Cross-File Integration Pass:
  Coordinator with summaries from Phase 1:
  
  "Given these per-file findings:
   auth.ts exports: verifyToken(token: string): User | null
   users.ts imports: verifyToken and passes JWT directly
   db.ts: User type requires non-null id
   
   Check cross-file integration:
   - Does auth.ts export match what users.ts imports?
   - Are error types from errors.ts handled in api.ts?
   - Does null User from verifyToken cause issues downstream?"
   
  → Catches integration bugs per-file review would miss
```

### Adaptive Investigation Strategy

```
START WIDE — Map the landscape before diving deep:
  1. Coordinator assesses tools, complexity, and scope
  2. Spawns 2–5 subagents for broad initial coverage
  3. Synthesizes initial findings

NARROW DOWN — Follow leads that emerge:
  4. If subagent A finds a promising lead → spawn focused follow-up
  5. If subagent B hits a dead end → pivot to alternative approach
  6. Continue iterating until coverage is sufficient

MEMORY TOOL — When context exceeds 200K tokens:
  7. Lead agent uses memory tool to persist research plan
  8. Summaries replace verbose tool results
```

---

## Task Statement 1.7: Session State, Resumption, and Forking

### Session Management Options

```
┌─────────────────────────────────────────────────────────────────┐
│                    SESSION MANAGEMENT                           │
│                                                                 │
│  FRESH SESSION                                                  │
│  ┌─────────────────────────────────┐                           │
│  │ query(prompt="...", options={}) │  ← No resume parameter    │
│  └─────────────────────────────────┘                           │
│  Use when: Clean context needed. Starting new task.             │
│                                                                 │
│  RESUME SESSION                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ query(prompt="...", options={resume: sessionId})         │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Use when: Continuing incomplete work. Follow-up questions.     │
│  CLI: claude --resume <session-name>                            │
│  CLI: claude --continue (resumes most recent session)           │
│                                                                 │
│  FORK SESSION                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ query(prompt="...", options={resume: sessionId,          │   │
│  │                              forkSession: true})          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  Use when: Trying alternative approaches. A/B exploration.      │
│  Original session: UNCHANGED (can still be resumed)             │
│  New session: Independent branch from same baseline             │
└─────────────────────────────────────────────────────────────────┘
```

### Fork Session — Parallel Exploration

```python
# Establish baseline context
baseline_result = await query(
    prompt="Analyze the authentication module and identify the core issue",
    options={}
)
session_id = baseline_result.session_id

# Fork A: Try REST approach
fork_a = await query(
    prompt="Propose a REST API redesign to fix the auth issue",
    options={"resume": session_id, "forkSession": True}
)
# Original session_id is UNCHANGED

# Fork B: Try GraphQL approach (from same baseline)
fork_b = await query(
    prompt="Propose a GraphQL API redesign to fix the auth issue",
    options={"resume": session_id, "forkSession": True}
)
# Both forks see the same initial analysis — neither affects the other
```

### /compact and Context Compression

```
WHEN TO USE /compact:
  Before context window is 80%+ full
  Before starting a new phase of work
  When responses become inconsistent or reference "typical patterns"
  
WHAT IT DOES:
  Summarizes conversation history into a compact representation
  Preserves key findings
  Frees context window space
  
  Before: 180K tokens used (95% of 200K context window)
  After:   45K tokens used (25% of 200K context window)

AUTOMATIC COMPACTION:
  Triggers when context approaches window limit
  Emits SystemMessage with subtype "compact_boundary"
  
PRECOMPACT HOOK:
  Runs before compaction
  Receives trigger: 'manual' | 'auto'
  Use to persist critical state before summary

⚠️  WARNING: After compaction, specific instructions from early
    conversation may not be preserved. Put persistent rules in
    CLAUDE.md, not the initial prompt.
```

### Crash Recovery with State Manifests

```python
import json
from datetime import datetime

# Each agent exports its state to a known location
def save_manifest(agent_id: str, status: str, completed: list, pending: list, findings_file: str):
    manifest = {
        "agent_id": agent_id,
        "status": status,           # "running" | "partial" | "complete"
        "completed_queries": completed,
        "pending_queries": pending,
        "findings_file": findings_file,
        "last_checkpoint": datetime.utcnow().isoformat() + "Z"
    }
    with open(f"manifests/{agent_id}.json", "w") as f:
        json.dump(manifest, f)

# On resume, coordinator loads all manifests and resumes partial work
def resume_after_crash():
    manifests = load_all_manifests("manifests/")
    
    for manifest in manifests:
        if manifest["status"] == "partial":
            # Resume from where it stopped
            resume_agent(
                agent_id=manifest["agent_id"],
                pending_queries=manifest["pending_queries"],
                existing_findings=manifest["findings_file"]
            )
        elif manifest["status"] == "complete":
            # Already done — load results
            load_findings(manifest["findings_file"])
```

---

## Practice Questions — Domain 1

### Question 1 (Core Loop)
Your agent sometimes runs indefinitely without stopping. You're using `max_iterations = 10` as the stopping mechanism but Claude occasionally produces empty responses at the end. What is the correct fix?

**A)** Increase `max_iterations` to 50 to ensure enough room for completion  
**B)** Check if response text contains "Task complete" and break the loop  
**C)** Route the loop on `stop_reason == "end_turn"` and treat empty `end_turn` responses as successful completion  
**D)** Switch to streaming mode which handles termination automatically

**Correct Answer: C**  
`stop_reason == "end_turn"` is the correct termination signal. Empty responses at `end_turn` are normal (Claude signaling completion without text). `max_iterations` is a safety limit, not a primary mechanism. B parses natural language — an anti-pattern. D doesn't address the root cause.

---

### Question 2 (Hooks vs. Prompts)
Your customer support agent needs to verify customer identity (call `get_customer`) before processing any refund (call `process_refund`). Currently it skips this step 8% of the time. What's the correct fix?

**A)** Add "ALWAYS call get_customer before process_refund" to the system prompt in bold  
**B)** Add a PreToolUse hook that blocks `process_refund` if no `customer_id` is present in the session state  
**C)** Add few-shot examples showing the correct order  
**D)** Give the agent access to fewer tools so it can't skip steps  

**Correct Answer: B**  
Financial operations require deterministic compliance. A prompt instruction (A, C) is probabilistic — it will still fail some percentage of the time. B uses a PreToolUse hook to programmatically enforce the ordering guarantee. D doesn't address the routing issue.

---

### Question 3 (Context Isolation)
Your multi-agent research pipeline produces incomplete reports. The web search agent returns findings but the synthesis agent's output is missing 3 of the 5 requested topics. Where should you look first?

**A)** The synthesis agent's summarization logic — it may be dropping topics during synthesis  
**B)** The web search agent's search queries — it may not be finding data on those topics  
**C)** The coordinator's task decomposition — it may not have assigned those topics to any agent  
**D)** The context window — the synthesis agent may be running out of tokens  

**Correct Answer: C**  
When multi-agent reports have coverage gaps, the first place to check is always the coordinator's task decomposition. Subagents only work on what they're assigned. If topics weren't in the coordinator's task breakdown, no subagent will cover them. The other options blame downstream agents when the coordinator is the source of the problem.

---

## Quick Reference — Domain 1 Cheat Sheet

| Concept | Key Fact |
|---|---|
| **Loop termination** | `stop_reason == "end_turn"` only. Never parse text. |
| **stop_reason: tool_use** | Execute tools → append results → continue loop |
| **stop_reason: pause_turn** | Server hit iteration limit. Send response back to continue. |
| **Tool results format** | User message with `tool_result` blocks referencing `tool_use_id` |
| **Hub-and-spoke** | Coordinator spawns specialized subagents with isolated context |
| **Subagent context** | Fresh conversation. Does NOT inherit coordinator history. |
| **allowedTools: Agent** | Must include "Agent" in coordinator's allowed tools |
| **"Agent" tool** | Renamed from "Task" in v2.1.63. Both work as aliases. |
| **ExitWorktree tool** | Agent Teams: teammate exits worktree context, returns to main workspace (v2.1.72) |
| **CronCreate tool** | Schedules recurring background tasks (v2.1.71). Suppress with `CLAUDE_CODE_DISABLE_CRON=1`. |
| **SendMessage tool** | Peer-to-peer messaging between Agent Team members; JSON inbox on filesystem |
| **Monitor tool** | Background filesystem/process watcher; notifies Claude when condition met (v2.1.98) |
| **1M context window** | Opus 4.6 on Max/Team/Enterprise. Use `CLAUDE_CODE_DISABLE_1M_CONTEXT=1` to opt out. |
| **AgentDefinition: description** | What Claude reads to decide WHEN to delegate |
| **AgentDefinition: tools** | Restrict tool access (omit = inherit all) |
| **AgentDefinition: model** | Route expensive/cheap models per agent role |
| **Parallel spawning** | Multiple Agent calls in one response → concurrent execution |
| **Hooks = deterministic** | 100% compliance. Use for financial/compliance/security. |
| **Prompts = probabilistic** | ~95–99% compliance. Use for style/guidance. |
| **PreToolUse** | Fires before execution. Can block/allow/ask/modify inputs. |
| **PostToolUse** | Fires after execution. Cannot undo. Can add context. |
| **updatedInput** | PreToolUse field to modify tool inputs before execution |
| **Hooks context window** | Zero tokens consumed — runs in application process |
| **Permission flow order** | PreToolUse → Deny → Allow → Ask → PermMode → canUseTool → PostToolUse |
| **fork_session** | Creates independent branch. Original unchanged. |
| **resume** | Restores full session context for continuity |
| **--continue** | CLI flag for resuming most recent session |
| **/compact** | Compresses context. Rules in CLAUDE.md, not initial prompt. |
| **Decomposition gap** | Missing topics = coordinator didn't assign them |
| **Task complexity** | Simple: 1 agent. Comparisons: 2–4. Complex: 10+ |
| **Per-file + cross-file** | Two-pass review for large PRs |
| **State manifests** | Persist agent progress for crash recovery |
