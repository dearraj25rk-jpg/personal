---
title: Claude Code Agent SDK — Complete Guide
description: >
  Comprehensive reference for the Claude Code Agent SDK — Python and TypeScript/Node.js
  subprocess integration, streaming message types, stateful client patterns, OAuth
  authentication, tool use in SDK sessions, error handling, cost controls, and production
  deployment examples. Covers Agent SDK v1 · Claude Code v2.1.126 (May 2026).
sidebar:
  order: 10
  label: Agent SDK
lastUpdated: 2026-06-07
---

# Claude Code Agent SDK — Complete Guide

> **Version:** Agent SDK v1 · Claude Code v2.1.126 (May 7, 2026)
> **SDKs:** `anthropic` (Python ≥ 0.52) · `@anthropic-ai/sdk` (TypeScript/Node.js ≥ 0.38)

The **Claude Code Agent SDK** lets you drive a full Claude Code session programmatically — the same agentic loop you get in the terminal, but controlled from your own application code. It speaks to Claude Code via subprocess and a structured streaming protocol, giving you file editing, shell execution, MCP access, hook support, and complete session management from Python or TypeScript.

**When to use the SDK instead of the CLI:**
- You need to embed Claude Code in a larger application or pipeline
- You want programmatic control over sessions (start, stop, inspect results)
- You need streaming output parsing (progress tracking, token counting)
- You want to orchestrate multiple Claude Code sessions in parallel
- You need OAuth integration in your own auth flow

---

## 1. Installation

### Python

```bash
pip install anthropic
```

Requires Python ≥ 3.10 and Claude Code CLI installed (`claude --version`).

### TypeScript / Node.js

```bash
npm install @anthropic-ai/sdk
```

Requires Node.js ≥ 18 and Claude Code CLI installed.

---

## 2. How the SDK Works

The SDK wraps the Claude Code CLI as a subprocess, communicating over stdin/stdout using a structured JSON streaming protocol. Claude Code runs in `--output-format stream-json` mode.

### Architecture Diagram

```
  YOUR APPLICATION
  ─────────────────────────────────────────────────────────────────
  │  Python / TypeScript code                                      │
  │                                                                │
  │  StatefulClient / OAuthClient / fire-and-forget query()        │
  └─────────────────────┬──────────────────────────────────────────
                        │  subprocess spawn
                        ▼
  CLAUDE CODE CLI PROCESS
  ─────────────────────────────────────────────────────────────────
  │  claude --output-format stream-json --print "<prompt>"         │
  │                                                                │
  │  Loads:  CLAUDE.md hierarchy                                   │
  │          .claude/settings.json + user settings                 │
  │          MCP servers (.mcp.json)                               │
  │          Hooks (PreToolUse, PostToolUse, Stop, ...)            │
  │          Agent definitions (.claude/agents/)                   │
  └─────────────────────┬──────────────────────────────────────────
                        │  JSON stream on stdout (one event per line)
                        ▼
  SDK EVENT STREAM (parsed by SDK)
  ─────────────────────────────────────────────────────────────────
  │  { type: "system"      } → session ID, model, cwd, tools      │
  │  { type: "assistant"   } → Claude text + tool_use blocks       │
  │  { type: "tool_result" } → output from tool execution         │
  │  { type: "result"      } → final summary: cost, turns, usage  │
  │  { type: "error"       } → something went wrong               │
  └─────────────────────────────────────────────────────────────────

  TRANSPORT CHARACTERISTICS
  ─────────────────────────────────────────────────────────────────
  │  • stdin/stdout pipes — no network sockets                     │
  │  • Each event is a complete JSON object on one line            │
  │  • Events arrive in causal order (no reordering)              │
  │  • "result" is always the final event                         │
  │  • subprocess inherits parent environment unless overridden    │
  └─────────────────────────────────────────────────────────────────
```

**Key properties:**
- The SDK inherits the CLI's full agentic loop — all tools, hooks, MCP servers, CLAUDE.md, and settings load normally
- Each `query()` call is one complete non-interactive session
- The SDK does NOT open an interactive REPL — it's for automation
- Session state (files, environment) is shared with the subprocess environment
- Cost and token tracking are available in the `result` message

### StatefulClient vs Fire-and-Forget

```
  FIRE-AND-FORGET (single query)            STATEFULCLIENT (multi-turn)
  ─────────────────────────────             ─────────────────────────────
  subprocess starts                         subprocess starts
       │                                         │
  prompt ──► Claude reasons                 turn 1 ──► Claude reasons
       │       └─ tool calls                     │       └─ tool calls
       │       └─ file edits                     │       └─ file edits
       │                                         │
  result event (final)                      history accumulates in context
  subprocess exits                               │
                                           turn 2 ──► Claude reasons
  Best for:                                    │       (sees turn 1 result)
  • CI/CD single tasks                          │       └─ builds on prior work
  • Parallel independent jobs                   │
  • Simple one-shot queries                turn 3 ──► continues...
  • Budget-capped batch work                     │
                                           client.reset() clears history
                                           subprocess exits on close()

                                           Best for:
                                           • Multi-step pipelines
                                           • Iterative refinement
                                           • Context-dependent workflows
                                           • Interactive web apps
```

---

## 3. Python SDK — Complete Reference

### 3.1 Basic Usage

```python
import asyncio
from anthropic import Anthropic

client = Anthropic()

async def run_claude_task():
    messages = []
    
    async with client.messages.stream(
        model="claude-opus-4-7",
        max_tokens=8096,
        messages=[{"role": "user", "content": "Summarise the codebase in 3 paragraphs."}]
    ) as stream:
        async for text in stream.text_stream:
            print(text, end="", flush=True)
    
    final = await stream.get_final_message()
    print(f"\n\nTokens: {final.usage.input_tokens} in, {final.usage.output_tokens} out")

asyncio.run(run_claude_task())
```

### 3.2 Claude Code Subprocess SDK

The Claude Code-specific SDK drives the CLI directly:

```python
import asyncio
import anthropic

async def run_code_task(prompt: str, cwd: str = "."):
    """Run a Claude Code task in a given directory."""
    
    async with anthropic.Anthropic().messages.claude_code(
        prompt=prompt,
        cwd=cwd,
        permission_mode="bypassPermissions",  # for automated use
        max_turns=30,
        allowed_tools=["Read", "Edit", "Write", "Bash", "Glob", "Grep"],
    ) as session:
        async for event in session:
            if event.type == "assistant":
                # Claude's text response (may be partial)
                print(event.message.content[0].text, end="", flush=True)
            elif event.type == "tool_use":
                print(f"\n[Tool: {event.tool_name}]")
            elif event.type == "result":
                print(f"\n\nDone in {event.num_turns} turns")
                print(f"Cost: ${event.cost_usd:.4f}")
                print(f"Tokens: {event.usage.input_tokens} in, {event.usage.output_tokens} out")
    
    return session.result

asyncio.run(run_code_task(
    "Add comprehensive docstrings to all public functions in src/api/",
    cwd="/path/to/my-project"
))
```

### 3.3 Streaming Message Types

Every event from the SDK has a `type` field. Here is the complete set:

```python
async for event in session:
    match event.type:
        case "system":
            # Session initialisation info
            print(f"Session: {event.session_id}")
            print(f"Cwd: {event.cwd}")
            print(f"Model: {event.model}")
            print(f"Tools available: {event.tools}")
            
        case "assistant":
            # Claude's response — may be chunked across multiple events
            for block in event.message.content:
                if block.type == "text":
                    print(block.text, end="")
                elif block.type == "tool_use":
                    print(f"\n[Tool: {block.name}({block.input})]")
            
        case "tool_result":
            # Result from a tool execution
            print(f"\n[Result for {event.tool_use_id}: {str(event.content)[:100]}]")
            if event.is_error:
                print(f"  ERROR: {event.content}")
            
        case "result":
            # Final summary — always the last event
            print(f"\n--- Session complete ---")
            print(f"Turns: {event.num_turns}")
            print(f"Cost: ${event.cost_usd:.4f}")
            print(f"Stop reason: {event.stop_reason}")
            # event.usage: { input_tokens, output_tokens, cache_read_tokens, cache_write_tokens }
            print(f"Cache read: {event.usage.cache_read_tokens:,} tokens (saved)")
            
        case "error":
            # Something went wrong
            print(f"\n[Error: {event.error}]")
            print(f"Error code: {event.code}")
```

### 3.3a Streaming Event Sequence — What Happens Between tool_use and tool_result

One of the most important things to understand about the SDK stream is the causal sequence of events within a single agent turn. This is not just academic — knowing the sequence determines how you track progress, display intermediate state, and implement per-tool hooks.

**Within a single agent turn, events arrive in this exact order:**

```
turn N
  │
  ▼
assistant event
  ├─ content[0]: text block  (Claude's reasoning text, if any)
  └─ content[1]: tool_use block
       ├─ id:    "toolu_01abc..."   ← this ID pairs with the tool_result
       ├─ name:  "Bash"
       └─ input: { "command": "npm test" }

  [EXECUTION GAP]
  The SDK subprocess executes the tool here.
  During this gap, no events arrive on the stream.
  This can last from milliseconds (Read) to minutes (Bash with long tests).
  
  ▼
tool_result event
  ├─ tool_use_id: "toolu_01abc..."  ← matches the tool_use id above
  ├─ content: [{ "type": "text", "text": "...stdout/stderr..." }]
  └─ is_error: false | true

  [If Claude needs another tool, it emits another assistant event]
  ▼
assistant event (next tool call OR final response)
  ...
```

**Key facts about the execution gap:**

1. **No heartbeat events**: The stream is silent during tool execution. If you are implementing a timeout, you must measure wall-clock time from the last event, not the number of events received.

2. **The `tool_use_id` is your correlation key**: Every `tool_result` event contains the `tool_use_id` that matches its corresponding `tool_use` block in the preceding `assistant` event. Use this to pair tool calls with their results when building audit logs or UI progress indicators.

3. **Multi-tool turns**: Claude can emit multiple `tool_use` blocks in a single `assistant` event when it wants to run tools in parallel (e.g., reading several files simultaneously). In this case, you will see a single `assistant` event with multiple tool_use blocks, followed by multiple `tool_result` events (one per tool), then another `assistant` event.

4. **Error tool results are normal flow**: When a tool fails (e.g., `Bash` returns exit code 1), the SDK emits a `tool_result` with `is_error: true`. Claude sees this error output in its context and decides how to respond — it may retry, try a different approach, or give up. The stream does NOT terminate on a tool error; that is Claude's decision.

5. **Hooks fire during the gap**: If you have `PreToolUse` or `PostToolUse` hooks configured, they execute during the execution gap. From the SDK consumer's perspective, the gap is simply longer.

**Practical example — tracking tool execution in real time:**

```python
import asyncio
import time

async def stream_with_tool_tracking(prompt: str):
    tool_calls = {}   # tool_use_id → {name, input, start_time}
    
    async with StatefulClient() as client:
        async for event in client.stream(prompt):
            
            if event.type == "assistant":
                for block in event.message.content:
                    if block.type == "text":
                        print(block.text, end="", flush=True)
                    elif block.type == "tool_use":
                        tool_calls[block.id] = {
                            "name": block.name,
                            "input": block.input,
                            "start_time": time.monotonic(),
                        }
                        print(f"\n[CALLING] {block.name}({_summarise(block.input)})")
            
            elif event.type == "tool_result":
                call = tool_calls.pop(event.tool_use_id, None)
                if call:
                    elapsed = time.monotonic() - call["start_time"]
                    status = "ERROR" if event.is_error else "OK"
                    print(f"[{status}] {call['name']} completed in {elapsed:.2f}s")
                    if event.is_error:
                        # Show first 200 chars of error
                        err_text = event.content[0].text if event.content else "(no output)"
                        print(f"  Error: {err_text[:200]}")
            
            elif event.type == "result":
                print(f"\n\nSession complete: {event.num_turns} turns, ${event.cost_usd:.4f}")

def _summarise(input_dict: dict, max_len: int = 80) -> str:
    s = str(input_dict)
    return s if len(s) <= max_len else s[:max_len] + "..."
```

**Multi-tool parallel execution pattern:**

```python
async def stream_with_parallel_tool_tracking(prompt: str):
    """
    Claude sometimes issues multiple tool_use blocks in one assistant event.
    Track them with a dict so you handle parallel tool calls correctly.
    """
    pending_tools: dict[str, str] = {}  # tool_use_id → tool_name
    
    async with StatefulClient() as client:
        async for event in client.stream(prompt):
            if event.type == "assistant":
                tool_uses_in_this_turn = []
                for block in event.message.content:
                    if block.type == "tool_use":
                        pending_tools[block.id] = block.name
                        tool_uses_in_this_turn.append(block.name)
                
                if tool_uses_in_this_turn:
                    print(f"\n[Parallel tools] {', '.join(tool_uses_in_this_turn)}")
            
            elif event.type == "tool_result":
                tool_name = pending_tools.pop(event.tool_use_id, "unknown")
                still_pending = list(pending_tools.values())
                print(f"[Done] {tool_name}. Still waiting: {still_pending or 'none'}")
```

### 3.4 Stateful Client — Multi-Turn Sessions

The stateful client maintains conversation context across multiple calls:

```python
import anthropic
from anthropic.claude_code import StatefulClient

async def interactive_pipeline():
    """Multi-turn session with shared context."""
    
    async with StatefulClient(
        cwd="/path/to/project",
        permission_mode="autoAccept",
        model="claude-sonnet-4-6",
    ) as client:
        
        # Turn 1: Understand the codebase
        result1 = await client.query(
            "Identify all database models in src/models/ and list their fields."
        )
        
        # Turn 2: Build on the first result (context is preserved)
        result2 = await client.query(
            "Now add a `created_at` timestamp field to each model that doesn't have one."
        )
        
        # Turn 3: Verify the changes
        result3 = await client.query(
            "Run the database migration tests and fix any failures."
        )
        
        return {
            "models_found": result1.output_text,
            "changes_made": result2.output_text,
            "test_results": result3.output_text,
        }
```

**Key StatefulClient properties:**
- Conversation history accumulates across `query()` calls
- Context compaction happens automatically when the window fills
- `client.session_id` — unique ID for this conversation
- `client.usage` — cumulative token usage across all turns
- `client.total_cost_usd` — total spend for the session
- `client.reset()` — clear conversation history while keeping config

### 3.4a Session Management Across Multiple SDK Invocations

A critical design question when building SDK-based applications is: **when does a "session" end, and how do you continue work across process boundaries?**

The SDK distinguishes two concepts that are easy to conflate:

```
SUBPROCESS LIFETIME vs CONVERSATION LIFETIME
─────────────────────────────────────────────────────────────────────────────
Subprocess lifetime:   One OS process. Starts when StatefulClient.__aenter__
                       is called. Ends when __aexit__ is called. Maximum
                       duration is bounded by timeout= parameter.

Conversation lifetime: The chain of messages (turns) Claude can "see" as
                       prior context. Can span multiple subprocesses if you
                       use session resumption. Bounded by the model's context
                       window (200K tokens) after which auto-compaction kicks in.
─────────────────────────────────────────────────────────────────────────────
```

**Pattern 1 — Single long-running subprocess (simplest)**

```python
async with StatefulClient(timeout=3600) as client:   # 1-hour limit
    r1 = await client.query("Analyse the API module")
    r2 = await client.query("Now refactor it")
    r3 = await client.query("Run tests")
    # All three queries share one subprocess and one conversation context.
    # r2 sees r1's output. r3 sees r1 and r2's outputs.
```

Best for: multi-step pipelines that complete within the timeout. The subprocess stays alive between calls; no startup overhead per query.

**Pattern 2 — Multiple subprocesses with session resumption**

Use this when: you need to span multiple program invocations (e.g., a pipeline that continues tomorrow), or when your total work exceeds the timeout.

```python
import asyncio
import json
import pathlib
from anthropic.claude_code import StatefulClient

SESSION_FILE = pathlib.Path(".claude_session_id")

async def run_phase(prompt: str, phase_name: str) -> str:
    """Run one phase, resume from prior session if available."""
    
    prior_session_id = None
    if SESSION_FILE.exists():
        prior_session_id = SESSION_FILE.read_text().strip() or None
    
    kwargs = dict(
        cwd=".",
        permission_mode="autoAccept",
        model="claude-sonnet-4-6",
        timeout=600,
    )
    if prior_session_id:
        kwargs["resume"] = prior_session_id
        print(f"[{phase_name}] Resuming session {prior_session_id}")
    else:
        print(f"[{phase_name}] Starting new session")
    
    async with StatefulClient(**kwargs) as client:
        result = await client.query(prompt)
        # Persist the session ID for the next invocation
        SESSION_FILE.write_text(client.session_id)
        print(f"[{phase_name}] Done. Cost: ${result.cost_usd:.4f}. Session: {client.session_id}")
        return result.output_text


# Day 1 — analysis phase
# asyncio.run(run_phase("Analyse all files in src/ and list quality issues", "analysis"))

# Day 2 — refactoring phase (same session, sees Day 1 analysis in context)
# asyncio.run(run_phase("Based on your analysis, implement the top 3 fixes", "refactoring"))
```

**What is preserved across session resumptions:**

| What is preserved | What is NOT preserved |
|---|---|
| Full conversation history (all turns Claude saw) | Open file handles |
| Compaction summary (if auto-compacted) | Active subprocess state |
| Tool call/result pairs | In-memory variables from prior run |
| CLAUDE.md contents (as seen by Claude in context) | OS process, PID, env |

**Important: CLAUDE.md is reloaded fresh on resume.** If your CLAUDE.md changed between sessions, Claude will see the updated version. This is generally desirable (latest instructions) but can cause subtle behavioural changes in long-running pipelines.

**Pattern 3 — Parallel independent subprocesses (no shared context)**

When tasks are independent, run them in parallel. Each subprocess has its own conversation — they do NOT share context.

```python
import asyncio
from anthropic.claude_code import StatefulClient

async def review_module(path: str, semaphore: asyncio.Semaphore) -> dict:
    async with semaphore:
        async with StatefulClient(cwd=".", permission_mode="acceptEdits") as client:
            result = await client.query(f"Review {path} for issues and suggest improvements")
        return {"path": path, "review": result.output_text, "cost": result.cost_usd}

async def run_parallel(modules: list[str], max_concurrent: int = 4):
    sem = asyncio.Semaphore(max_concurrent)
    return await asyncio.gather(*[review_module(m, sem) for m in modules])
```

**Pattern 4 — StatefulClient reset() for multi-tenant applications**

When one long-lived process serves multiple users or tasks, use `reset()` to clear conversation history without restarting the subprocess:

```python
async with StatefulClient(cwd=".", timeout=86400) as shared_client:
    # User A's task
    await shared_client.query("Task for user A...")
    user_a_session_id = shared_client.session_id
    
    # Reset before user B — clears ALL prior context
    await shared_client.reset()
    
    # User B's task — starts fresh, no knowledge of user A's task
    await shared_client.query("Task for user B...")
    
    # Caution: after reset(), resuming user_a_session_id requires a NEW
    # StatefulClient with resume=user_a_session_id. The current client
    # is now on a different conversation branch.
```

**Context window management**: The context window fills up over many turns. The `StatefulClient` triggers automatic compaction when the window reaches ~90% capacity. During compaction:
- Claude summarises the conversation so far into a compact snapshot
- The compact summary replaces the full history in context
- You will see a `system` event with `type: "context_compacted"` (or similar) in the stream
- Cost typically drops significantly on the next turn (far fewer input tokens)
- The compact snapshot is stored server-side and is accessible via the session ID

**Monitoring cumulative cost across turns:**

```python
async with StatefulClient(max_budget_usd=10.00) as client:
    for i, prompt in enumerate(prompts):
        result = await client.query(prompt)
        print(f"Turn {i+1}: ${result.cost_usd:.4f} | Cumulative: ${client.total_cost_usd:.4f}")
        
        # Early exit if approaching budget
        if client.total_cost_usd > 8.00:
            print("Approaching budget limit — stopping early")
            break
```

### 3.5 Python SDK — Full Example with Error Handling and Retry Logic

```python
#!/usr/bin/env python3
"""
Production-grade Claude Code SDK usage with retry logic,
error handling, budget controls, and structured output.
"""
import asyncio
import logging
import time
from typing import Optional
from anthropic.claude_code import (
    StatefulClient,
    ClaudeCodeError,
    SessionTimeoutError,
    BudgetExceededError,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ClaudeCodeRunner:
    """Resilient wrapper around StatefulClient with retry and budget management."""

    def __init__(
        self,
        cwd: str = ".",
        model: str = "claude-sonnet-4-6",
        max_budget_usd: float = 5.00,
        max_turns: int = 30,
        timeout: int = 300,
        max_retries: int = 3,
        retry_delay: float = 2.0,
    ):
        self.cwd = cwd
        self.model = model
        self.max_budget_usd = max_budget_usd
        self.max_turns = max_turns
        self.timeout = timeout
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        self._client: Optional[StatefulClient] = None

    async def __aenter__(self):
        self._client = StatefulClient(
            cwd=self.cwd,
            model=self.model,
            max_budget_usd=self.max_budget_usd,
            max_turns=self.max_turns,
            timeout=self.timeout,
            permission_mode="autoAccept",
        )
        await self._client.__aenter__()
        return self

    async def __aexit__(self, *args):
        if self._client:
            await self._client.__aexit__(*args)

    async def run_with_retry(
        self,
        prompt: str,
        stage: str = "unnamed",
    ) -> Optional[str]:
        """Run a prompt with retry logic on transient errors."""
        last_error = None

        for attempt in range(1, self.max_retries + 1):
            try:
                logger.info(f"[{stage}] attempt {attempt}/{self.max_retries}")
                result = await self._client.query(prompt)
                logger.info(
                    f"[{stage}] complete — {result.num_turns} turns, "
                    f"${result.cost_usd:.4f}, "
                    f"{result.usage.input_tokens:,} in / "
                    f"{result.usage.output_tokens:,} out tokens"
                )
                return result.output_text

            except BudgetExceededError as e:
                logger.error(
                    f"[{stage}] budget exceeded: ${e.spent_usd:.4f} of ${e.limit_usd:.4f}"
                )
                return None  # Non-retryable

            except SessionTimeoutError:
                logger.warning(f"[{stage}] timeout on attempt {attempt}")
                last_error = "timeout"

            except ClaudeCodeError as e:
                if e.code in ("rate_limited", "overloaded"):
                    logger.warning(
                        f"[{stage}] transient error {e.code} on attempt {attempt}"
                    )
                    last_error = str(e)
                else:
                    logger.error(f"[{stage}] fatal SDK error: {e.code} — {e.message}")
                    return None  # Non-retryable

            except Exception as e:
                logger.error(f"[{stage}] unexpected error: {e}", exc_info=True)
                return None

            if attempt < self.max_retries:
                delay = self.retry_delay * (2 ** (attempt - 1))  # exponential backoff
                logger.info(f"[{stage}] retrying in {delay:.1f}s...")
                await asyncio.sleep(delay)

        logger.error(f"[{stage}] all {self.max_retries} attempts failed. Last: {last_error}")
        return None


async def run_refactoring_pipeline(repo_path: str):
    """Multi-stage refactoring with verification and retry."""
    async with ClaudeCodeRunner(
        cwd=repo_path,
        model="claude-opus-4-7",
        max_budget_usd=10.00,
        max_turns=50,
        timeout=600,
    ) as runner:
        analysis = await runner.run_with_retry(
            "Analyse the codebase. List (1) duplicated logic, "
            "(2) god classes, (3) missing abstractions. "
            "Be specific with file paths and line ranges.",
            stage="analysis",
        )
        if not analysis:
            return {"error": "Analysis failed"}

        plan = await runner.run_with_retry(
            "Create a detailed refactoring plan based on your analysis. "
            "Order by risk (lowest first). Output a numbered list.",
            stage="planning",
        )

        impl = await runner.run_with_retry(
            "Implement items 1, 2, and 3 from your plan. "
            "Make the changes, then run the full test suite.",
            stage="implementation",
        )

        verify = await runner.run_with_retry(
            "Review all changes you made. Check: (1) tests pass, "
            "(2) no regressions, (3) code quality improved. "
            "Output: VERIFIED or ISSUES: <list>.",
            stage="verification",
        )

        return {
            "analysis": analysis,
            "plan": plan,
            "implementation": impl,
            "verification": verify,
        }


if __name__ == "__main__":
    result = asyncio.run(run_refactoring_pipeline("/path/to/my-project"))
    print(result)
```

### 3.6 Parallel Sessions

Run multiple independent Claude Code sessions simultaneously:

```python
import asyncio
import anthropic
from anthropic.claude_code import StatefulClient

async def analyse_module(module_path: str) -> dict:
    """Analyse a single module in isolation."""
    async with StatefulClient(cwd=".", permission_mode="acceptEdits") as client:
        summary = await client.query(f"Summarise the architecture of {module_path}")
        issues = await client.query(f"List any security or quality issues in {module_path}")
        return {
            "path": module_path,
            "summary": summary.output_text,
            "issues": issues.output_text,
        }

async def parallel_codebase_review():
    """Review multiple modules simultaneously."""
    modules = ["src/api/", "src/domain/", "src/infra/", "src/auth/"]
    
    # All four run at the same time, each in its own Claude Code session
    results = await asyncio.gather(*[analyse_module(m) for m in modules])
    
    return results

results = asyncio.run(parallel_codebase_review())
for r in results:
    print(f"\n=== {r['path']} ===")
    print(r['summary'])
```

**Parallelism pattern — async/await:**

```python
import asyncio
from anthropic.claude_code import StatefulClient

async def run_task(task_id: int, prompt: str, cwd: str) -> dict:
    """Single task wrapper with metadata."""
    start = asyncio.get_event_loop().time()
    async with StatefulClient(cwd=cwd, permission_mode="bypassPermissions") as client:
        result = await client.query(prompt)
    elapsed = asyncio.get_event_loop().time() - start
    return {
        "task_id": task_id,
        "output": result.output_text,
        "cost_usd": result.cost_usd,
        "elapsed_s": round(elapsed, 1),
    }

async def run_parallel_tasks(tasks: list[dict]) -> list[dict]:
    """
    Run up to N tasks in parallel with concurrency limit.
    tasks: list of {"prompt": str, "cwd": str}
    """
    semaphore = asyncio.Semaphore(5)  # max 5 concurrent sessions

    async def bounded_task(task_id, task):
        async with semaphore:
            return await run_task(task_id, task["prompt"], task["cwd"])

    return await asyncio.gather(
        *[bounded_task(i, t) for i, t in enumerate(tasks)]
    )
```

### 3.7 Error Handling

```python
from anthropic.claude_code import ClaudeCodeError, SessionTimeoutError, BudgetExceededError

async def safe_run(prompt: str):
    try:
        async with StatefulClient(
            max_turns=20,
            max_budget_usd=1.00,  # hard spend limit
            timeout=300,           # 5 minutes total
        ) as client:
            return await client.query(prompt)
    
    except BudgetExceededError as e:
        print(f"Budget limit hit: ${e.spent_usd:.4f} of ${e.limit_usd:.4f}")
        return None
    
    except SessionTimeoutError:
        print("Session timed out after 5 minutes")
        return None
    
    except ClaudeCodeError as e:
        print(f"SDK error: {e.code} — {e.message}")
        return None
```

### Error Handling in SDK Sessions

```python
import anthropic

async def run_with_error_handling():
    client = anthropic.AsyncAnthropic()
    try:
        async with client.beta.claude_code.sessions.stream(
            max_turns=10,
            initial_message="Refactor the authentication module",
        ) as stream:
            async for event in stream:
                if event.type == "result":
                    if event.subtype == "error_max_turns":
                        print(f"Max turns reached after {event.num_turns} turns")
                    elif event.subtype == "error_budget_exceeded":
                        print(f"Budget exceeded: ${event.total_cost_usd:.4f}")
                    elif event.subtype == "success":
                        print(f"Completed in {event.num_turns} turns, ${event.total_cost_usd:.4f}")
    except anthropic.BudgetExceededError as e:
        print(f"Hard budget ceiling hit: {e}")
    except anthropic.SessionTimeoutError as e:
        print(f"Session timed out: {e}")
    except anthropic.ClaudeCodeError as e:
        print(f"Claude Code error: {e.type} — {e.message}")
```

### TypeScript Error Handling

```typescript
import { ClaudeCode } from "@anthropic-ai/claude-code";

const client = new ClaudeCode.StatefulClient();

try {
  const session = await client.createSession({
    maxTurns: 10,
    maxBudgetUsd: 5.00,
  });

  for await (const event of session.stream("Fix all type errors")) {
    if (event.type === "result") {
      switch (event.subtype) {
        case "success":
          console.log(`Done: $${event.totalCostUsd.toFixed(4)}`);
          break;
        case "error_max_turns":
          console.warn("Max turns reached");
          break;
        case "error_budget_exceeded":
          console.warn(`Budget exceeded: $${event.totalCostUsd.toFixed(4)}`);
          break;
      }
    }
  }
} catch (e) {
  if (e instanceof ClaudeCode.BudgetExceededError) {
    console.error("Hard budget limit hit");
  } else {
    throw e;
  }
} finally {
  await session.close();
}
```

### Error Types Reference

| Error | Cause | Recovery |
|-------|-------|---------|
| `BudgetExceededError` | Hard `--max-budget-usd` limit | Increase budget or break into smaller tasks |
| `SessionTimeoutError` | Session idle timeout | Use `client.resumeSession(sessionId)` |
| `ClaudeCodeError` | Generic Claude Code error | Check `e.type` and `e.message` |
| `result.subtype == error_max_turns` | `--max-turns` reached | Increase turns or re-run with `/resume` |
| `result.subtype == error_budget_exceeded` | Soft budget ceiling | Check `total_cost_usd` in result |

### 3.8 Cost and Token Tracking

```python
async def cost_tracked_run(prompt: str) -> float:
    """Return the USD cost of a single Claude Code task."""
    total_cost = 0.0
    
    async with StatefulClient() as client:
        result = await client.query(prompt)
        
        print(f"Input tokens:       {result.usage.input_tokens:,}")
        print(f"Output tokens:      {result.usage.output_tokens:,}")
        print(f"Cache read tokens:  {result.usage.cache_read_tokens:,}")
        print(f"Cache write tokens: {result.usage.cache_write_tokens:,}")
        print(f"Cost (USD):         ${result.cost_usd:.4f}")
        
        total_cost = result.cost_usd
    
    return total_cost
```

### 3.9 OAuth Authentication (v2.1.121+)

For applications that need user-level OAuth authentication:

```python
from anthropic.claude_code import OAuthClient

async def user_authenticated_session(oauth_token: str):
    """Run a session authenticated as a specific user."""
    async with OAuthClient(
        oauth_token=oauth_token,
        cwd="/path/to/project",
        permission_mode="acceptEdits",
        model="claude-sonnet-4-6",
    ) as client:
        # Session runs with user's identity and permissions
        result = await client.query("Review my code for security issues.")
        return result.output_text

# OAuth flow integration example (FastAPI)
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer

app = FastAPI()
security = HTTPBearer()

@app.post("/review")
async def review_code(
    prompt: str,
    credentials = Depends(security)
):
    """Run a Claude Code session on behalf of an authenticated user."""
    try:
        output = await user_authenticated_session(
            oauth_token=credentials.credentials,
        )
        return {"result": output}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 4. TypeScript / Node.js SDK — Complete Reference

### 4.1 Basic Usage

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

async function runClaudeTask() {
  const stream = client.messages.stream({
    model: "claude-opus-4-7",
    max_tokens: 8096,
    messages: [{ role: "user", content: "Summarise this codebase." }],
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      process.stdout.write(event.delta.text);
    }
  }

  const finalMessage = await stream.finalMessage();
  console.log(`\nTokens: ${finalMessage.usage.input_tokens} in, ${finalMessage.usage.output_tokens} out`);
}

runClaudeTask();
```

### 4.2 Claude Code Subprocess SDK (TypeScript Full Example)

```typescript
import { ClaudeCode } from "@anthropic-ai/claude-code-sdk";
import * as fs from "fs/promises";
import * as path from "path";

interface SessionResult {
  output: string;
  numTurns: number;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  stopReason: string;
}

async function runCodeTask(
  prompt: string,
  cwd: string = process.cwd(),
  options: {
    maxTurns?: number;
    maxBudgetUsd?: number;
    model?: string;
    permissionMode?: "default" | "acceptEdits" | "autoAccept" | "bypassPermissions" | "plan";
    allowedTools?: string[];
  } = {}
): Promise<SessionResult> {
  const session = new ClaudeCode({
    cwd,
    permissionMode: options.permissionMode ?? "bypassPermissions",
    maxTurns: options.maxTurns ?? 30,
    maxBudgetUsd: options.maxBudgetUsd ?? 5.0,
    model: options.model ?? "claude-opus-4-7",
    allowedTools: options.allowedTools,
  });

  let outputText = "";
  let result: SessionResult | null = null;

  for await (const event of session.stream(prompt)) {
    switch (event.type) {
      case "system":
        console.log(`[system] Session ${event.sessionId} on model ${event.model}`);
        console.log(`[system] Tools: ${event.tools.join(", ")}`);
        break;

      case "assistant":
        for (const block of event.message.content) {
          if (block.type === "text") {
            process.stdout.write(block.text);
            outputText += block.text;
          } else if (block.type === "tool_use") {
            console.log(`\n[tool] ${block.name}(${JSON.stringify(block.input).slice(0, 120)})`);
          }
        }
        break;

      case "tool_result":
        if (event.isError) {
          console.error(`\n[error] Tool ${event.toolUseId}: ${JSON.stringify(event.content)}`);
        }
        break;

      case "result":
        result = {
          output: outputText,
          numTurns: event.numTurns,
          costUsd: event.costUsd,
          inputTokens: event.usage.inputTokens,
          outputTokens: event.usage.outputTokens,
          cacheReadTokens: event.usage.cacheReadTokens,
          stopReason: event.stopReason,
        };
        console.log(`\n\n[result] ${event.numTurns} turns, $${event.costUsd.toFixed(4)}`);
        console.log(
          `[result] ${event.usage.inputTokens.toLocaleString()} in / ` +
          `${event.usage.outputTokens.toLocaleString()} out / ` +
          `${event.usage.cacheReadTokens.toLocaleString()} cache-read tokens`
        );
        break;

      case "error":
        console.error(`\n[error] ${event.code}: ${event.error}`);
        break;
    }
  }

  if (!result) throw new Error("Session ended without a result event");
  return result;
}

// Example: run TypeScript strict mode migration
runCodeTask(
  "Add TypeScript strict mode and fix all resulting type errors. " +
  "Run `tsc --noEmit` to verify when done.",
  process.cwd(),
  {
    model: "claude-opus-4-7",
    permissionMode: "autoAccept",
    maxTurns: 50,
    maxBudgetUsd: 3.0,
  }
).then((result) => {
  console.log(`Stop reason: ${result.stopReason}`);
}).catch(console.error);
```

### 4.3 Stateful Client (TypeScript)

```typescript
import { StatefulClaudeCode } from "@anthropic-ai/claude-code-sdk";

async function multiTurnSession() {
  const client = new StatefulClaudeCode({
    cwd: process.cwd(),
    permissionMode: "autoAccept",
    model: "claude-sonnet-4-6",
    maxBudgetUsd: 5.0,
    timeout: 300_000, // 5 minutes in ms
  });

  try {
    // Turn 1: Understand the code
    const r1 = await client.query("What are the main modules in this codebase?");
    console.log("Modules:", r1.outputText);

    // Turn 2: Build on previous context
    const r2 = await client.query(
      "Which module has the most coupling? Suggest a refactoring."
    );
    console.log("Suggestion:", r2.outputText);

    // Turn 3: Apply the refactoring
    const r3 = await client.query(
      "Implement the refactoring you suggested. Run tests afterwards."
    );
    console.log("Result:", r3.outputText);

    // Print cumulative cost
    console.log(`\nTotal cost: $${client.totalCostUsd.toFixed(4)}`);
    console.log(`Session ID: ${client.sessionId}`);

  } finally {
    await client.close();
  }
}

multiTurnSession();
```

### 4.4 Streaming Message Types (TypeScript)

Complete TypeScript type definitions for all SDK events:

```typescript
// Full TypeScript interface for all SDK events
type SDKEvent =
  | {
      type: "system";
      sessionId: string;
      model: string;
      cwd: string;
      tools: string[];          // list of available tool names
    }
  | {
      type: "assistant";
      message: {
        id: string;
        role: "assistant";
        content: Array<
          | { type: "text"; text: string }
          | {
              type: "tool_use";
              id: string;
              name: string;
              input: Record<string, unknown>;
            }
        >;
        usage: { inputTokens: number; outputTokens: number };
      };
    }
  | {
      type: "tool_result";
      toolUseId: string;
      content: Array<{ type: "text"; text: string }>;
      isError: boolean;
    }
  | {
      type: "result";
      sessionId: string;
      numTurns: number;
      stopReason:
        | "end_turn"         // Claude finished normally
        | "max_turns"        // hit the maxTurns limit
        | "budget_exceeded"  // hit the maxBudgetUsd limit
        | "timeout"          // session timed out
        | "error";           // fatal error
      costUsd: number;
      usage: {
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens: number;   // tokens served from prompt cache (cheaper)
        cacheWriteTokens: number;  // tokens written to cache (one-time cost)
      };
    }
  | {
      type: "error";
      error: string;
      code:
        | "not_found"        // claude binary not found
        | "auth_error"       // authentication failed
        | "rate_limited"     // API rate limit hit
        | "overloaded"       // API overloaded
        | "budget_exceeded"  // budget exhausted before result
        | "timeout"          // subprocess timed out
        | "unknown";         // unexpected error
    };

// Usage example with discriminated unions
function handleEvent(event: SDKEvent): void {
  switch (event.type) {
    case "system":
      console.log(`Session: ${event.sessionId}, Model: ${event.model}`);
      console.log(`Tools: ${event.tools.join(", ")}`);
      break;

    case "assistant":
      for (const block of event.message.content) {
        if (block.type === "text") {
          process.stdout.write(block.text);
        } else {
          console.log(`\n[${block.name}(${JSON.stringify(block.input)})]`);
        }
      }
      break;

    case "tool_result":
      if (event.isError) {
        console.error(`\nTool error: ${JSON.stringify(event.content)}`);
      }
      break;

    case "result":
      console.log(`\nComplete. Turns: ${event.numTurns}, Cost: $${event.costUsd.toFixed(4)}`);
      console.log(`Stop reason: ${event.stopReason}`);
      console.log(
        `Tokens: ${event.usage.inputTokens.toLocaleString()} in / ` +
        `${event.usage.outputTokens.toLocaleString()} out / ` +
        `${event.usage.cacheReadTokens.toLocaleString()} cached`
      );
      break;

    case "error":
      console.error(`Error [${event.code}]: ${event.error}`);
      break;
  }
}
```

### 4.5 Parallel Session Pattern (TypeScript async/await)

```typescript
import { StatefulClaudeCode } from "@anthropic-ai/claude-code-sdk";

interface ModuleReview {
  path: string;
  summary: string;
  issues: string;
  costUsd: number;
}

async function reviewModule(modulePath: string): Promise<ModuleReview> {
  const client = new StatefulClaudeCode({
    cwd: process.cwd(),
    permissionMode: "acceptEdits",
    model: "claude-sonnet-4-6",
    maxBudgetUsd: 0.50,
  });

  try {
    const summary = await client.query(`Summarise the architecture of ${modulePath}`);
    const issues = await client.query(
      `List security or quality issues in ${modulePath}. ` +
      "Focus on: SQL injection, missing auth, error handling gaps."
    );
    return {
      path: modulePath,
      summary: summary.outputText,
      issues: issues.outputText,
      costUsd: client.totalCostUsd,
    };
  } finally {
    await client.close();
  }
}

async function parallelCodebaseReview(modules: string[]): Promise<ModuleReview[]> {
  // Limit concurrency to avoid overwhelming the API
  const CONCURRENCY = 4;
  const results: ModuleReview[] = [];

  for (let i = 0; i < modules.length; i += CONCURRENCY) {
    const batch = modules.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(reviewModule));
    results.push(...batchResults);
    
    const batchCost = batchResults.reduce((sum, r) => sum + r.costUsd, 0);
    console.log(`Batch ${Math.floor(i / CONCURRENCY) + 1} complete. Cost: $${batchCost.toFixed(4)}`);
  }

  return results;
}

// Run
parallelCodebaseReview(["src/api/", "src/domain/", "src/infra/", "src/auth/"])
  .then((results) => {
    const totalCost = results.reduce((sum, r) => sum + r.costUsd, 0);
    console.log(`\nTotal cost: $${totalCost.toFixed(4)}`);
    results.forEach((r) => {
      console.log(`\n=== ${r.path} ===`);
      console.log(r.summary);
      if (r.issues) console.log("Issues:", r.issues);
    });
  })
  .catch(console.error);
```

---

## 5. Tool Use in SDK Sessions

### 5.1 Restricting Tools

Limit which tools Claude can use in a session:

```python
# Python — restrict to read-only tools
async with StatefulClient(
    allowed_tools=["Read", "Glob", "Grep", "LS", "WebFetch", "WebSearch"],
    disallowed_tools=["Bash", "Edit", "Write", "MultiEdit"],
) as client:
    result = await client.query("Audit the codebase for security anti-patterns.")
```

```typescript
// TypeScript — same pattern
const client = new StatefulClaudeCode({
  allowedTools: ["Read", "Glob", "Grep", "LS"],
  disallowedTools: ["Bash", "Edit", "Write"],
});
```

### 5.2 MCP Tools in SDK Sessions

SDK sessions inherit all MCP servers configured in `~/.claude/mcp.json` and `.mcp.json`:

```python
async with StatefulClient(
    cwd="/path/to/project",   # loads .mcp.json from this directory
    allowed_tools=["Read", "Edit", "mcp__postgres__query"],
) as client:
    result = await client.query(
        "Find all users who haven't logged in for 30 days using the database."
    )
```

### 5.3 Custom Tool Definitions

Pass custom tool schemas that Claude can use:

```python
custom_tools = [
    {
        "name": "deploy_to_staging",
        "description": "Deploy the current branch to the staging environment",
        "input_schema": {
            "type": "object",
            "properties": {
                "branch": {"type": "string", "description": "Git branch to deploy"},
                "env_vars": {"type": "object", "description": "Additional env vars"},
            },
            "required": ["branch"],
        },
    }
]

async with StatefulClient(custom_tools=custom_tools) as client:
    result = await client.query("Deploy the feature branch to staging.")
```

---

## 6. SDK in Production — Environment Setup

### 6.1 All SDK Options

```python
async with StatefulClient(
    # Environment
    cwd="/path/to/project",           # working directory (default: os.getcwd())
    env={"NODE_ENV": "test"},          # additional env vars
    
    # Model & effort
    model="claude-opus-4-7",
    effort="normal",                    # low | normal | high | xhigh
    
    # Session control
    max_turns=30,                       # hard limit on agent turns
    max_budget_usd=5.00,               # hard USD spend limit
    timeout=600,                        # seconds before timeout (default: 300)
    
    # Permissions
    permission_mode="autoAccept",       # default | acceptEdits | autoAccept | bypassPermissions
    allowed_tools=["Read", "Edit"],
    disallowed_tools=["Bash"],
    
    # Context
    system_prompt="Focus on security. Never write to production databases.",
    agent="security-reviewer",          # use a custom .claude/agents/<name>.md definition
    
    # Output
    output_format="stream-json",        # text | json | stream-json
) as client:
    pass
```

### 6.2 Environment Variables

```bash
# Auth
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_CODE_USE_BEDROCK=1          # use AWS Bedrock
CLAUDE_CODE_USE_VERTEX=1           # use GCP Vertex AI

# Behaviour
CLAUDE_CODE_MAX_OUTPUT_TOKENS=8096
CLAUDE_EFFORT=high                  # session-wide effort override

# SDK-specific
CLAUDE_CODE_SDK_TIMEOUT=300         # subprocess timeout in seconds
CLAUDE_CODE_SDK_MAX_RETRIES=3       # retry count on transient errors

# Production tuning
CLAUDE_CODE_DISABLE_1M_CONTEXT=1    # force 200K context window (lower cost)
CLAUDE_CODE_DISABLE_CRON=1          # suppress scheduled task tools
DISABLE_UPDATES=1                   # pin CLI version in CI environments
```

### 6.3 Docker / CI Environment Setup

```dockerfile
# Dockerfile for Claude Code SDK automation
FROM python:3.12-slim

# Install Node.js (required for Claude Code CLI)
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install Claude Code CLI
RUN curl -fsSL https://claude.ai/install.sh | bash

# Install Python SDK
RUN pip install anthropic

# Copy application
WORKDIR /app
COPY . .

# Run with API key from environment
ENV ANTHROPIC_API_KEY=""
ENV DISABLE_UPDATES=1
ENV CLAUDE_CODE_SDK_TIMEOUT=300

CMD ["python", "main.py"]
```

```yaml
# GitHub Actions environment setup
- name: Install Claude Code
  run: |
    curl -fsSL https://claude.ai/install.sh | bash
    echo "$HOME/.local/bin" >> $GITHUB_PATH
    
- name: Verify installation
  run: claude --version

- name: Run SDK automation
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    DISABLE_UPDATES: "1"
  run: python scripts/ci-review.py
```

---

## 7. Integration Patterns

### 7.1 CI/CD Pipeline Script

```python
#!/usr/bin/env python3
"""Automated code quality enforcement in CI."""
import asyncio
import sys
from anthropic.claude_code import StatefulClient

async def ci_review(pr_diff: str) -> int:
    """Return exit code: 0 = pass, 1 = issues found, 2 = error."""
    
    async with StatefulClient(
        permission_mode="bypassPermissions",
        model="claude-sonnet-4-6",   # cost-efficient for CI
        max_turns=15,
        max_budget_usd=0.50,
    ) as client:
        
        # Feed the diff as context
        result = await client.query(
            f"Review this PR diff for security issues, bugs, and style violations.\n\n{pr_diff}\n\n"
            "Output: PASS if clean, or ISSUES: <bulleted list> if problems found."
        )
        
        output = result.output_text
        if "ISSUES:" in output:
            print(output)
            return 1
        return 0

if __name__ == "__main__":
    diff = sys.stdin.read()
    exit_code = asyncio.run(ci_review(diff))
    sys.exit(exit_code)
```

### 7.2 Web Application Integration

```python
from fastapi import FastAPI, BackgroundTasks
from anthropic.claude_code import StatefulClient
import asyncio
import uuid

app = FastAPI()
active_sessions: dict[str, StatefulClient] = {}

@app.post("/sessions")
async def create_session(project_path: str):
    """Create a new Claude Code session for a project."""
    client = StatefulClient(cwd=project_path, permission_mode="acceptEdits")
    session_id = str(uuid.uuid4())
    active_sessions[session_id] = client
    return {"session_id": session_id}

@app.post("/sessions/{session_id}/query")
async def query_session(session_id: str, prompt: str):
    """Send a prompt to an active session."""
    client = active_sessions.get(session_id)
    if not client:
        return {"error": "Session not found"}, 404
    
    result = await client.query(prompt)
    return {
        "output": result.output_text,
        "turns": result.num_turns,
        "cost_usd": result.cost_usd,
    }

@app.delete("/sessions/{session_id}")
async def close_session(session_id: str):
    """Close and clean up a session."""
    client = active_sessions.pop(session_id, None)
    if client:
        await client.close()
    return {"closed": session_id}
```

### 7.3 Automated Refactoring Pipeline

```python
async def refactor_pipeline(repo_path: str):
    """Multi-stage automated refactoring with verification."""
    
    async with StatefulClient(
        cwd=repo_path,
        permission_mode="autoAccept",
        model="claude-opus-4-7",
        max_budget_usd=10.00,
    ) as client:
        
        print("Stage 1: Analysis")
        analysis = await client.query(
            "Analyse the codebase. List: (1) duplicated logic, (2) god classes, "
            "(3) missing abstractions. Be specific with file paths and line ranges."
        )
        
        print("Stage 2: Plan")
        plan = await client.query(
            "Create a detailed refactoring plan based on your analysis. "
            "Order by risk (lowest first). Output a numbered list."
        )
        
        print("Stage 3: Implement (lowest-risk items)")
        impl = await client.query(
            "Implement items 1, 2, and 3 from your plan. "
            "Make the changes, then run the full test suite."
        )
        
        print("Stage 4: Verify")
        verify = await client.query(
            "Review all changes you made. Check: (1) tests pass, "
            "(2) no regressions, (3) code quality improved. "
            "Output: VERIFIED or ISSUES: <list>."
        )
        
        return {
            "analysis": analysis.output_text,
            "plan": plan.output_text,
            "implementation": impl.output_text,
            "verification": verify.output_text,
            "total_cost_usd": client.total_cost_usd,
        }
```

---

## 8. SDK vs CLI — When to Use Each

| Need | Use |
|------|-----|
| Interactive coding session | CLI (`claude`) |
| CI/CD pipeline step | CLI (`claude --print`) or SDK |
| Embedding in your application | SDK |
| Multi-turn context across tasks | SDK (StatefulClient) |
| Parallel independent tasks | SDK (asyncio.gather) |
| Token/cost accounting | SDK (result.usage) |
| User-level OAuth integration | SDK (OAuthClient) |
| Quick one-shot automation | CLI (`claude --print "..."`) |
| GitHub Actions workflow | CLI (via `anthropics/claude-code-action@v1`) |

---

## 9. SDK Message Type Reference

Complete TypeScript interface for all SDK events:

```typescript
type SDKEvent =
  | {
      type: "system";
      sessionId: string;
      model: string;
      cwd: string;
      tools: string[];
    }
  | {
      type: "assistant";
      message: {
        id: string;
        role: "assistant";
        content: Array<
          | { type: "text"; text: string }
          | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
        >;
        usage: { inputTokens: number; outputTokens: number };
      };
    }
  | {
      type: "tool_result";
      toolUseId: string;
      content: Array<{ type: "text"; text: string }>;
      isError: boolean;
    }
  | {
      type: "result";
      sessionId: string;
      numTurns: number;
      stopReason: "end_turn" | "max_turns" | "budget_exceeded" | "timeout";
      costUsd: number;
      usage: {
        inputTokens: number;
        outputTokens: number;
        cacheReadTokens: number;
        cacheWriteTokens: number;
      };
    }
  | {
      type: "error";
      error: string;
      code: string;
    };
```

---

## 10. Troubleshooting

| Problem | Solution |
|---------|---------|
| `ClaudeCodeNotFoundError` | Install the CLI: `curl -fsSL https://claude.ai/install.sh \| bash` |
| `AuthenticationError` | Set `ANTHROPIC_API_KEY` or run `claude auth login` |
| `SessionTimeoutError` | Increase `timeout` or break task into smaller calls |
| `BudgetExceededError` | Raise `max_budget_usd` or use a cheaper model for this task |
| High latency | Use `claude-sonnet-4-6` or `claude-haiku-4-5` for routine tasks |
| Incomplete results | Increase `max_turns` (default 30) |
| MCP tools not available | Verify `~/.claude/mcp.json` and project `.mcp.json` are configured |
| Hooks not firing | SDK sessions inherit hooks from `~/.claude/settings.json` |
| High token cost | Enable prompt caching; check `cache_read_tokens` in usage |
| Subprocess hangs | Set `CLAUDE_CODE_SDK_TIMEOUT`; add `timeout` param to StatefulClient |
| OAuthClient 401 error | Token expired; refresh OAuth token before creating client |
| Parallel sessions rate-limited | Reduce concurrency; add semaphore with limit 3-5 |

---

## 11. Next Steps

| If you want to… | Go to |
|----------------|-------|
| Understand all available tools | [CLI Technical Reference §4](./claude-code-reference#4-built-in-tools-reference) |
| Add MCP servers to SDK sessions | [MCP Servers Guide](./mcp-servers-guide) |
| Use hooks for automation | [Hooks System](./hooks-deep-dive) |
| Set up agent definitions | [Agent Teams Guide](./agent-teams-guide) |
| Parallel development workflows | [Worktrees Guide](./worktrees-guide) |
| Integrate with GitHub Actions | [CI/CD Integration](./cicd-integration) |

---

## 12. .NET / C# Subprocess Integration

There is no official C# SDK for the Claude Code Agent SDK. However, .NET and C# applications can integrate Claude Code through subprocess management. The pattern uses `System.Diagnostics.Process` to launch the Claude Code binary with `--output-format stream-json`, then parses the streaming JSON events.

### Complete Production-Grade C# Subprocess Wrapper

The following is a fully working .NET 8 implementation. It uses `System.Text.Json` source generation for AOT-compatible deserialization, `IAsyncEnumerable` for streaming, and `CancellationToken` throughout for clean shutdown.

**Step 1 — Define the event model (ClaudeEvents.cs):**

```csharp
// ClaudeEvents.cs
using System.Text.Json.Serialization;

namespace ClaudeCode;

// ── Discriminated union for all SDK event types ────────────────────────────

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(SystemEvent),     "system")]
[JsonDerivedType(typeof(AssistantEvent),  "assistant")]
[JsonDerivedType(typeof(ToolResultEvent), "tool_result")]
[JsonDerivedType(typeof(ResultEvent),     "result")]
[JsonDerivedType(typeof(ErrorEvent),      "error")]
public abstract class ClaudeEvent
{
    [JsonPropertyName("type")]
    public abstract string Type { get; }
}

// ── system event ──────────────────────────────────────────────────────────
public sealed class SystemEvent : ClaudeEvent
{
    public override string Type => "system";

    [JsonPropertyName("session_id")]
    public string SessionId { get; init; } = "";

    [JsonPropertyName("model")]
    public string Model { get; init; } = "";

    [JsonPropertyName("cwd")]
    public string Cwd { get; init; } = "";

    [JsonPropertyName("tools")]
    public IReadOnlyList<string> Tools { get; init; } = [];
}

// ── assistant event ────────────────────────────────────────────────────────
public sealed class AssistantEvent : ClaudeEvent
{
    public override string Type => "assistant";

    [JsonPropertyName("message")]
    public AssistantMessage Message { get; init; } = new();
}

public sealed class AssistantMessage
{
    [JsonPropertyName("id")]
    public string Id { get; init; } = "";

    [JsonPropertyName("role")]
    public string Role { get; init; } = "assistant";

    [JsonPropertyName("content")]
    public IReadOnlyList<ContentBlock> Content { get; init; } = [];
}

[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(TextBlock),    "text")]
[JsonDerivedType(typeof(ToolUseBlock), "tool_use")]
public abstract class ContentBlock
{
    [JsonPropertyName("type")]
    public abstract string BlockType { get; }
}

public sealed class TextBlock : ContentBlock
{
    public override string BlockType => "text";

    [JsonPropertyName("text")]
    public string Text { get; init; } = "";
}

public sealed class ToolUseBlock : ContentBlock
{
    public override string BlockType => "tool_use";

    [JsonPropertyName("id")]
    public string Id { get; init; } = "";

    [JsonPropertyName("name")]
    public string Name { get; init; } = "";

    [JsonPropertyName("input")]
    public System.Text.Json.JsonElement Input { get; init; }
}

// ── tool_result event ──────────────────────────────────────────────────────
public sealed class ToolResultEvent : ClaudeEvent
{
    public override string Type => "tool_result";

    [JsonPropertyName("tool_use_id")]
    public string ToolUseId { get; init; } = "";

    [JsonPropertyName("content")]
    public IReadOnlyList<TextBlock> Content { get; init; } = [];

    [JsonPropertyName("is_error")]
    public bool IsError { get; init; }
}

// ── result event ───────────────────────────────────────────────────────────
public sealed class ResultEvent : ClaudeEvent
{
    public override string Type => "result";

    [JsonPropertyName("session_id")]
    public string SessionId { get; init; } = "";

    [JsonPropertyName("num_turns")]
    public int NumTurns { get; init; }

    [JsonPropertyName("stop_reason")]
    public string StopReason { get; init; } = "";

    [JsonPropertyName("cost_usd")]
    public decimal CostUsd { get; init; }

    [JsonPropertyName("usage")]
    public TokenUsage Usage { get; init; } = new();
}

public sealed class TokenUsage
{
    [JsonPropertyName("input_tokens")]
    public long InputTokens { get; init; }

    [JsonPropertyName("output_tokens")]
    public long OutputTokens { get; init; }

    [JsonPropertyName("cache_read_tokens")]
    public long CacheReadTokens { get; init; }

    [JsonPropertyName("cache_write_tokens")]
    public long CacheWriteTokens { get; init; }
}

// ── error event ────────────────────────────────────────────────────────────
public sealed class ErrorEvent : ClaudeEvent
{
    public override string Type => "error";

    [JsonPropertyName("error")]
    public string Error { get; init; } = "";

    [JsonPropertyName("code")]
    public string Code { get; init; } = "";
}

// ── Session result (returned when stream completes) ────────────────────────
public sealed class ClaudeSessionResult
{
    public string SessionId { get; init; } = "";
    public string OutputText { get; init; } = "";
    public int NumTurns { get; init; }
    public decimal CostUsd { get; init; }
    public TokenUsage Usage { get; init; } = new();
    public string StopReason { get; init; } = "";
    public IReadOnlyList<ToolCallRecord> ToolCalls { get; init; } = [];
}

public sealed record ToolCallRecord(
    string ToolUseId,
    string ToolName,
    string InputJson,
    string ResultText,
    bool IsError
);
```

**Step 2 — The subprocess client (ClaudeCodeClient.cs):**

```csharp
// ClaudeCodeClient.cs
using System.Diagnostics;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;

namespace ClaudeCode;

public sealed class ClaudeCodeOptions
{
    public string BinaryPath       { get; init; } = "claude";
    public string ApiKey           { get; init; } = "";
    public string WorkingDirectory { get; init; } = "";
    public string Model            { get; init; } = "claude-sonnet-4-6";
    public decimal MaxBudgetUsd    { get; init; } = 2.0m;
    public int MaxTurns            { get; init; } = 30;
    public string PermissionMode   { get; init; } = "bypassPermissions";
    public TimeSpan Timeout        { get; init; } = TimeSpan.FromMinutes(10);
}

public sealed class ClaudeCodeClient
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly ClaudeCodeOptions _options;

    public ClaudeCodeClient(ClaudeCodeOptions options)
    {
        _options = options;
    }

    /// <summary>
    /// Stream all SDK events for a single prompt. Events arrive in causal order.
    /// The stream ends when the "result" event is received or the process exits.
    /// </summary>
    public async IAsyncEnumerable<ClaudeEvent> StreamAsync(
        string prompt,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var args = BuildArguments();
        var psi  = BuildProcessStartInfo(args);

        using var process = Process.Start(psi)
            ?? throw new InvalidOperationException("Failed to start claude process.");

        // Write prompt to stdin and close it so claude knows input is done
        await process.StandardInput.WriteLineAsync(
            prompt.AsMemory(), cancellationToken);
        await process.StandardInput.FlushAsync(cancellationToken);
        process.StandardInput.Close();

        // Begin reading stderr in background (for diagnostics)
        var stderrTask = process.StandardError.ReadToEndAsync(cancellationToken);

        // Stream stdout line-by-line
        string? line;
        while ((line = await process.StandardOutput
                    .ReadLineAsync(cancellationToken)
                    .ConfigureAwait(false)) != null)
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (string.IsNullOrWhiteSpace(line)) continue;

            ClaudeEvent? evt = ParseEvent(line);
            if (evt is not null)
                yield return evt;

            // Stop iterating after the result event — no more events follow
            if (evt is ResultEvent)
                break;
        }

        await process.WaitForExitAsync(cancellationToken);

        if (process.ExitCode != 0)
        {
            var stderr = await stderrTask;
            throw new ClaudeCodeSubprocessException(process.ExitCode, stderr);
        }
    }

    /// <summary>
    /// Run a prompt to completion and return a structured result.
    /// Collects all events internally.
    /// </summary>
    public async Task<ClaudeSessionResult> RunAsync(
        string prompt,
        IProgress<ClaudeEvent>? progress = null,
        CancellationToken cancellationToken = default)
    {
        var textBuilder  = new StringBuilder();
        var toolCalls    = new Dictionary<string, ToolCallRecord>();
        var pendingTools = new Dictionary<string, (string Name, string InputJson)>();
        ResultEvent? resultEvent = null;
        SystemEvent? systemEvent = null;

        await foreach (var evt in StreamAsync(prompt, cancellationToken))
        {
            progress?.Report(evt);

            switch (evt)
            {
                case SystemEvent sys:
                    systemEvent = sys;
                    break;

                case AssistantEvent asst:
                    foreach (var block in asst.Message.Content)
                    {
                        switch (block)
                        {
                            case TextBlock tb:
                                textBuilder.Append(tb.Text);
                                break;

                            case ToolUseBlock tu:
                                pendingTools[tu.Id] = (tu.Name, tu.Input.ToString());
                                break;
                        }
                    }
                    break;

                case ToolResultEvent tr:
                    if (pendingTools.TryGetValue(tr.ToolUseId, out var pending))
                    {
                        pendingTools.Remove(tr.ToolUseId);
                        var resultText = tr.Content.Count > 0 ? tr.Content[0].Text : "";
                        toolCalls[tr.ToolUseId] = new ToolCallRecord(
                            tr.ToolUseId, pending.Name, pending.InputJson,
                            resultText, tr.IsError);
                    }
                    break;

                case ResultEvent res:
                    resultEvent = res;
                    break;

                case ErrorEvent err:
                    throw new ClaudeCodeException(err.Code, err.Error);
            }
        }

        if (resultEvent is null)
            throw new InvalidOperationException("Stream ended without a result event.");

        return new ClaudeSessionResult
        {
            SessionId  = resultEvent.SessionId,
            OutputText = textBuilder.ToString(),
            NumTurns   = resultEvent.NumTurns,
            CostUsd    = resultEvent.CostUsd,
            Usage      = resultEvent.Usage,
            StopReason = resultEvent.StopReason,
            ToolCalls  = toolCalls.Values.ToList(),
        };
    }

    // ── Internals ──────────────────────────────────────────────────────────

    private string BuildArguments()
    {
        var sb = new StringBuilder();
        sb.Append("--print");
        sb.Append(" --output-format stream-json");
        sb.Append($" --model {_options.Model}");
        sb.Append($" --max-turns {_options.MaxTurns}");
        sb.Append($" --max-budget-usd {_options.MaxBudgetUsd:F2}");
        sb.Append($" --permission-mode {_options.PermissionMode}");
        sb.Append(" --bare");
        return sb.ToString();
    }

    private ProcessStartInfo BuildProcessStartInfo(string args)
    {
        var psi = new ProcessStartInfo
        {
            FileName               = _options.BinaryPath,
            Arguments              = args,
            RedirectStandardInput  = true,
            RedirectStandardOutput = true,
            RedirectStandardError  = true,
            UseShellExecute        = false,
            CreateNoWindow         = true,
            StandardInputEncoding  = Encoding.UTF8,
            StandardOutputEncoding = Encoding.UTF8,
            StandardErrorEncoding  = Encoding.UTF8,
            WorkingDirectory       = string.IsNullOrEmpty(_options.WorkingDirectory)
                                       ? Environment.CurrentDirectory
                                       : _options.WorkingDirectory,
        };

        if (!string.IsNullOrEmpty(_options.ApiKey))
            psi.Environment["ANTHROPIC_API_KEY"] = _options.ApiKey;

        psi.Environment["DISABLE_UPDATES"] = "1";

        return psi;
    }

    private static ClaudeEvent? ParseEvent(string json)
    {
        try
        {
            // First, peek at the "type" field to decide which class to deserialise into.
            // System.Text.Json polymorphic deserialization handles the rest.
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("type", out var typeProp))
                return null;

            return typeProp.GetString() switch
            {
                "system"      => JsonSerializer.Deserialize<SystemEvent>(json,     JsonOptions),
                "assistant"   => JsonSerializer.Deserialize<AssistantEvent>(json,  JsonOptions),
                "tool_result" => JsonSerializer.Deserialize<ToolResultEvent>(json, JsonOptions),
                "result"      => JsonSerializer.Deserialize<ResultEvent>(json,     JsonOptions),
                "error"       => JsonSerializer.Deserialize<ErrorEvent>(json,      JsonOptions),
                _             => null,
            };
        }
        catch (JsonException)
        {
            return null;  // Skip malformed lines gracefully
        }
    }
}

// ── Exceptions ─────────────────────────────────────────────────────────────

public sealed class ClaudeCodeException(string code, string message)
    : Exception($"[{code}] {message}")
{
    public string Code    { get; } = code;
    public string Details { get; } = message;
}

public sealed class ClaudeCodeSubprocessException(int exitCode, string stderr)
    : Exception($"Claude process exited with code {exitCode}. stderr: {stderr}")
{
    public int    ExitCode { get; } = exitCode;
    public string Stderr   { get; } = stderr;
}
```

**Step 3 — Usage in a console application (Program.cs):**

```csharp
// Program.cs — .NET 8 top-level program
using ClaudeCode;

var client = new ClaudeCodeClient(new ClaudeCodeOptions
{
    ApiKey           = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
                         ?? throw new InvalidOperationException("ANTHROPIC_API_KEY not set"),
    WorkingDirectory = args.Length > 0 ? args[0] : Environment.CurrentDirectory,
    Model            = "claude-sonnet-4-6",
    MaxBudgetUsd     = 2.0m,
    MaxTurns         = 30,
    PermissionMode   = "bypassPermissions",
    Timeout          = TimeSpan.FromMinutes(10),
});

const string Prompt = """
    Review the authentication module in src/auth/ for security issues.
    For each issue, report: severity (critical/high/medium/low), file path, 
    line range, description, and recommended fix.
    Format output as a numbered list.
    """;

using var cts = new CancellationTokenSource(TimeSpan.FromMinutes(15));

Console.WriteLine("Starting Claude Code session...\n");

// Option A: Stream events for real-time output
await foreach (var evt in client.StreamAsync(Prompt, cts.Token))
{
    switch (evt)
    {
        case SystemEvent sys:
            Console.WriteLine($"[Session] {sys.SessionId} | Model: {sys.Model}");
            Console.WriteLine($"[Session] Tools: {string.Join(", ", sys.Tools)}\n");
            break;

        case AssistantEvent asst:
            foreach (var block in asst.Message.Content)
            {
                if (block is TextBlock tb)
                    Console.Write(tb.Text);
                else if (block is ToolUseBlock tu)
                    Console.WriteLine($"\n[Calling] {tu.Name}({tu.Input})");
            }
            break;

        case ToolResultEvent tr:
            var status = tr.IsError ? "ERROR" : "OK";
            var snippet = tr.Content.Count > 0 ? tr.Content[0].Text[..Math.Min(100, tr.Content[0].Text.Length)] : "";
            Console.WriteLine($"\n[{status}] Tool result ({tr.ToolUseId[^8..]}): {snippet}");
            break;

        case ResultEvent res:
            Console.WriteLine($"\n\n[Complete]");
            Console.WriteLine($"  Turns:        {res.NumTurns}");
            Console.WriteLine($"  Stop reason:  {res.StopReason}");
            Console.WriteLine($"  Cost:         ${res.CostUsd:F4}");
            Console.WriteLine($"  Input tokens: {res.Usage.InputTokens:N0}");
            Console.WriteLine($"  Output tokens:{res.Usage.OutputTokens:N0}");
            Console.WriteLine($"  Cache read:   {res.Usage.CacheReadTokens:N0} (saved)");
            break;

        case ErrorEvent err:
            Console.Error.WriteLine($"\n[Error] {err.Code}: {err.Error}");
            break;
    }
}

// Option B: Collect everything and get a structured result
// ClaudeSessionResult result = await client.RunAsync(Prompt, cancellationToken: cts.Token);
// Console.WriteLine(result.OutputText);
// Console.WriteLine($"\nCost: ${result.CostUsd:F4} | Tools used: {result.ToolCalls.Count}");
```

**Step 4 — Retry with Polly (production pattern):**

```csharp
// Requires: dotnet add package Polly.Extensions
using Polly;
using Polly.Retry;

var retryPipeline = new ResiliencePipelineBuilder()
    .AddRetry(new RetryStrategyOptions
    {
        MaxRetryAttempts = 4,
        BackoffType      = DelayBackoffType.Exponential,
        Delay            = TimeSpan.FromSeconds(5),
        ShouldHandle     = new PredicateBuilder()
            // Retry on subprocess crashes and rate limits
            .Handle<ClaudeCodeSubprocessException>(e => e.ExitCode > 2)
            .Handle<ClaudeCodeException>(e => e.Code is "rate_limited" or "overloaded"),
        OnRetry = args =>
        {
            Console.WriteLine($"[Retry {args.AttemptNumber}] {args.Outcome.Exception?.Message}");
            return ValueTask.CompletedTask;
        },
    })
    .Build();

ClaudeSessionResult result = await retryPipeline.ExecuteAsync(
    async ct => await client.RunAsync(Prompt, cancellationToken: ct),
    cts.Token
);

Console.WriteLine($"Final cost: ${result.CostUsd:F4}");
```

### NuGet Package Considerations

For production use, consider wrapping this pattern in a reusable NuGet package. Key concerns:
- **Thread safety**: One `ClaudeCodeClient` instance per session; don't share across threads
- **Cancellation**: Pass `CancellationToken` through `ReadLineAsync` for graceful shutdown
- **Retry logic**: Wrap the outer `RunAsync` in a Polly retry policy for transient failures
- **Session persistence**: Parse the `sessionId` from the `system` event; store it for `/resume` support
- **AOT compatibility**: If publishing with `PublishAot=true`, ensure `JsonSerializerContext` source generation is used instead of reflection-based serialization
- **Logging**: Inject `ILogger<ClaudeCodeClient>` and log at `Debug` for each event type; log at `Warning` for `is_error: true` tool results

---

## 13. Session Resumption in SDK Sessions

SDK sessions can be resumed across program runs using the session ID from the initial run.

### Capturing Session ID (Python)

```python
import anthropic
import json

async def run_with_session_tracking(prompt: str, project_dir: str):
    client = anthropic.Anthropic()
    session_id = None
    
    async with client.claude_code.subprocess.stream(
        prompt=prompt,
        cwd=project_dir,
    ) as session:
        async for event in session:
            if event.type == "system":
                session_id = event.session_id
                print(f"Session started: {session_id}")
            elif event.type == "result":
                print(f"Complete. Cost: ${event.cost_usd:.4f}")
                # Persist session_id for potential resume
                with open(".last_session_id", "w") as f:
                    f.write(session_id or "")
    
    return session_id
```

### Resuming a Previous Session (Python)

```python
async def resume_previous_session(new_prompt: str, project_dir: str):
    try:
        with open(".last_session_id") as f:
            session_id = f.read().strip()
    except FileNotFoundError:
        session_id = None
    
    if not session_id:
        print("No previous session to resume — starting fresh")
        return await run_with_session_tracking(new_prompt, project_dir)
    
    client = anthropic.Anthropic()
    
    async with client.claude_code.subprocess.stream(
        prompt=new_prompt,
        cwd=project_dir,
        resume=session_id,          # ← resume the previous session
    ) as session:
        async for event in session:
            if event.type == "assistant":
                for block in event.message.content:
                    if block.type == "text":
                        print(block.text, end="", flush=True)
```

### Session Resumption Behavior

When resuming via the SDK:
- The previous session's conversation history is restored
- CLAUDE.md files are reloaded fresh from disk (not from the session snapshot)
- MEMORY.md is reloaded fresh from disk
- The same model and settings apply unless overridden in the new call
- If the previous session was compacted, the compact summary is the starting point

**Important:** Session IDs are project-path-specific. A session started in `/project/a` cannot be resumed in `/project/b`.

---

## 14. Error Taxonomy

The SDK throws typed exceptions for different error conditions. Understanding the full error taxonomy helps write correct retry and recovery logic.

### Python Exception Hierarchy

```
anthropic.ClaudeCodeError (base)
├── ClaudeCodeNotFoundError
│   └── The claude binary is not installed or not in PATH
│   └── Fix: install the binary; verify PATH
│
├── ClaudeCodeAuthenticationError
│   └── API key invalid, missing, or expired
│   └── For OAuth: token expired or revoked
│   └── Fix: set ANTHROPIC_API_KEY; refresh OAuth token
│
├── ClaudeCodeSessionError
│   ├── SessionTimeoutError  — session exceeded the timeout threshold
│   ├── MaxTurnsExceededError — numTurns exceeded max_turns limit
│   └── SessionInterruptedError — binary process terminated unexpectedly
│
├── ClaudeCodeBudgetError
│   └── costUsd exceeded max_budget_usd
│   └── Fix: raise max_budget_usd; use cheaper model; reduce task scope
│
├── ClaudeCodeRateLimitError
│   └── API rate limit hit; response includes retry_after seconds
│   └── Fix: add exponential backoff; reduce parallel sessions
│
└── ClaudeCodeSubprocessError
    └── Binary crashed or returned non-zero exit code
    └── Includes binary stderr in error.stderr attribute
    └── Fix: check stderr; verify binary health with `claude --version`
```

### Complete ClaudeCodeError Taxonomy — Detailed Reference

Understanding exactly when each error fires, what attributes it carries, and whether it is retryable is essential for production-grade SDK usage.

| Exception Class | `e.code` value | When it fires | Retryable? | Key attributes |
|---|---|---|---|---|
| `ClaudeCodeNotFoundError` | `not_found` | `claude` binary absent from PATH at subprocess spawn time | No — fix environment | `e.searched_paths: list[str]` |
| `ClaudeCodeAuthenticationError` | `authentication_error` | API key rejected by Anthropic; OAuth token expired or revoked | No — fix credential | `e.status_code: int` (401/403) |
| `SessionTimeoutError` | `timeout` | Wall-clock time since session start exceeded `timeout=` parameter | Yes — restart session | `e.elapsed_seconds: float` |
| `MaxTurnsExceededError` | `max_turns_exceeded` | `num_turns` hit the `max_turns=` hard limit | Partially — increase turns and re-run | `e.num_turns: int`, `e.max_turns: int` |
| `SessionInterruptedError` | `interrupted` | Subprocess terminated by signal (SIGKILL, OOM, etc.) | Yes — transient | `e.exit_code: int`, `e.stderr: str` |
| `ClaudeCodeBudgetError` | `budget_exceeded` | `cost_usd` exceeded `max_budget_usd=` hard limit | No — re-architect task | `e.spent_usd: float`, `e.limit_usd: float` |
| `ClaudeCodeRateLimitError` | `rate_limited` | Anthropic API returned 429 after the binary's internal retries | Yes — backoff required | `e.retry_after: int` (seconds) |
| `ClaudeCodeOverloadedError` | `overloaded` | Anthropic API returned 529 (capacity overload) | Yes — brief backoff | `e.retry_after: int` |
| `ClaudeCodeSubprocessError` | `subprocess_error` | Binary exited with non-zero code for unknown reason | Depends on `e.exit_code` | `e.exit_code: int`, `e.stderr: str` |
| `ClaudeCodeError` (base) | `unknown` | Catch-all for any unclassified error | Unknown | `e.message: str` |

**Retryability decision tree:**

```python
from anthropic.claude_code import (
    ClaudeCodeError,
    ClaudeCodeNotFoundError,
    ClaudeCodeAuthenticationError,
    ClaudeCodeBudgetError,
    ClaudeCodeRateLimitError,
    ClaudeCodeOverloadedError,
    SessionTimeoutError,
    MaxTurnsExceededError,
    SessionInterruptedError,
    ClaudeCodeSubprocessError,
)
import asyncio

async def run_with_full_error_handling(prompt: str, cwd: str) -> str | None:
    """
    Demonstrates the full error handling decision tree.
    Returns output text on success, None on unrecoverable error.
    """
    max_retries = 4

    for attempt in range(1, max_retries + 1):
        try:
            async with StatefulClient(
                cwd=cwd,
                timeout=300,
                max_turns=30,
                max_budget_usd=2.00,
            ) as client:
                result = await client.query(prompt)
                return result.output_text

        except ClaudeCodeNotFoundError as e:
            # Binary not installed — NOT retryable. Fix the environment.
            print(f"[FATAL] Claude binary not found. Searched: {e.searched_paths}")
            print("Install: curl -fsSL https://claude.ai/install.sh | bash")
            return None

        except ClaudeCodeAuthenticationError as e:
            # Credential rejected — NOT retryable. Fix the credential.
            print(f"[FATAL] Authentication failed (HTTP {e.status_code}).")
            print("Check ANTHROPIC_API_KEY or OAuth token validity.")
            return None

        except ClaudeCodeBudgetError as e:
            # Budget consumed — NOT retryable without changing budget.
            print(f"[FATAL] Budget exceeded: ${e.spent_usd:.4f} of ${e.limit_usd:.4f}")
            return None

        except MaxTurnsExceededError as e:
            # Task too complex for the configured turn limit.
            # Partial work may have been done — check the filesystem before retrying.
            print(f"[WARN] Max turns ({e.max_turns}) reached. {e.num_turns} turns used.")
            print("Consider: increase max_turns, or break the task into smaller prompts.")
            return None  # Partial work was done; don't blindly re-run

        except ClaudeCodeRateLimitError as e:
            # API rate limit — retryable with backoff.
            wait = e.retry_after or (30 * attempt)
            print(f"[RETRY {attempt}/{max_retries}] Rate limited. Waiting {wait}s...")
            await asyncio.sleep(wait)

        except ClaudeCodeOverloadedError as e:
            # API overloaded — retryable with shorter backoff.
            wait = e.retry_after or 10
            print(f"[RETRY {attempt}/{max_retries}] API overloaded. Waiting {wait}s...")
            await asyncio.sleep(wait)

        except SessionTimeoutError as e:
            # Session wall-clock timeout — retryable.
            print(f"[RETRY {attempt}/{max_retries}] Session timed out after {e.elapsed_seconds:.0f}s.")
            await asyncio.sleep(5 * attempt)

        except SessionInterruptedError as e:
            # Subprocess killed unexpectedly — usually retryable.
            print(f"[RETRY {attempt}/{max_retries}] Session interrupted (exit {e.exit_code}).")
            if e.stderr:
                print(f"  stderr: {e.stderr[:300]}")
            await asyncio.sleep(5)

        except ClaudeCodeSubprocessError as e:
            # Binary exited with non-zero code — check exit code.
            if e.exit_code in (1, 2):
                # Exit 1/2 often means Claude gave up gracefully
                print(f"[WARN] Subprocess exited {e.exit_code}. stderr: {e.stderr[:300]}")
                return None  # Non-retryable — the error is in the task
            else:
                # Higher exit codes suggest environment issues
                print(f"[RETRY {attempt}/{max_retries}] Subprocess error (exit {e.exit_code}).")
                await asyncio.sleep(5)

        except ClaudeCodeError as e:
            # Catch-all for any unclassified ClaudeCodeError
            print(f"[ERROR] Unclassified SDK error: {e.code} — {e.message}")
            return None

    print(f"[FATAL] All {max_retries} retries exhausted.")
    return None
```

**Distinguishing `result.subtype` soft limits from raised exceptions:**

Some limit conditions do NOT raise Python exceptions — they instead surface as `result` events with a specific `subtype`. These indicate Claude reached a limit gracefully (it finished its turn before hitting the limit) rather than the subprocess being killed:

```python
async for event in session.stream(prompt):
    if event.type == "result":
        match event.stop_reason:
            case "end_turn":
                # Normal completion — Claude finished on its own
                pass
            case "max_turns":
                # Claude exhausted max_turns but finished cleanly
                # event.output_text contains whatever was produced
                print(f"Hit turn limit after {event.num_turns} turns")
            case "budget_exceeded":
                # Cost limit hit mid-session but result was flushed
                print(f"Budget hit: ${event.cost_usd:.4f}")
            case "timeout":
                # Timeout hit but result event was still emitted
                print("Timed out — partial result available")
            case "error":
                # Fatal error — result may be empty
                print(f"Session error: {event.error_message}")
```

The distinction matters for recovery logic: a `result` event with `stop_reason="max_turns"` means you have partial output you can inspect; a raised `MaxTurnsExceededError` means the subprocess was killed before producing any result event.

### TypeScript Error Types

```typescript
import { ClaudeCodeError } from "@anthropic-ai/sdk";

try {
  for await (const event of session) {
    // ... process events
  }
} catch (err) {
  if (err instanceof ClaudeCodeError) {
    switch (err.code) {
      case "not_found":
        console.error("Claude binary not installed");
        break;
      case "authentication_error":
        console.error("Invalid API key or expired OAuth token");
        break;
      case "rate_limit_error":
        const retryAfter = err.headers?.["retry-after"];
        await sleep(parseInt(retryAfter ?? "60") * 1000);
        break;
      case "budget_exceeded":
        console.error(`Budget of $${err.budget} exceeded`);
        break;
      case "session_timeout":
        console.error("Session timed out — increase timeout or split task");
        break;
      default:
        console.error(`Unexpected error: ${err.code} — ${err.message}`);
    }
  }
}
```

### Rate Limiting in SDK Context

Rate limiting manifests differently in SDK sessions vs direct API calls:

```
SDK Rate Limiting Sequence:
─────────────────────────────────────────────────
1. SDK session starts → binary makes API call
2. API returns 429 Too Many Requests
3. Binary respects retry-after header (built-in retry)
4. If still rate-limited after 3 retries → ClaudeCodeRateLimitError
5. SDK propagates the exception to your code
6. You catch it and implement backoff at the session level

Recommendation: Do NOT retry individual tool calls within a session.
Instead, retry at the session level (restart the session after backoff).
The binary handles per-request retries internally.
```

**Rate limit strategy for parallel sessions:**

```python
import asyncio
from asyncio import Semaphore

async def process_files_safely(file_list: list[str], max_concurrent: int = 3):
    """Process files with a semaphore to avoid rate limits."""
    sem = Semaphore(max_concurrent)
    client = anthropic.Anthropic()
    
    async def process_one(file_path: str):
        async with sem:  # Only max_concurrent sessions at a time
            try:
                async with client.claude_code.subprocess.stream(
                    prompt=f"Review {file_path} for issues",
                    model="claude-haiku-4-5",   # Use cheapest model for bulk
                ) as session:
                    result = ""
                    async for event in session:
                        if event.type == "result":
                            return event.stop_reason, event.cost_usd
            except ClaudeCodeRateLimitError as e:
                await asyncio.sleep(int(e.retry_after or 60))
                return "rate_limited", 0.0
    
    results = await asyncio.gather(*[process_one(f) for f in file_list])
    return results
```

---

## 15. Bedrock Authentication in SDK Sessions

When using AWS Bedrock as the API backend, the SDK authentication uses Bedrock credentials rather than Anthropic API keys.

### Python with Bedrock (boto3)

```python
import boto3
import os
from anthropic import Anthropic

def create_bedrock_claude_client(region: str = "us-east-1") -> Anthropic:
    """
    Create an Anthropic SDK client that routes through AWS Bedrock.
    Uses boto3 for credential discovery (works with IAM roles, instance profiles,
    environment variables, ~/.aws/credentials, etc.)
    """
    # Get credentials from boto3 (handles all AWS credential sources)
    session = boto3.Session(region_name=region)
    credentials = session.get_credentials().get_frozen_credentials()
    
    # Set environment variables for Claude Code binary
    os.environ["AWS_ACCESS_KEY_ID"]     = credentials.access_key
    os.environ["AWS_SECRET_ACCESS_KEY"] = credentials.secret_key
    os.environ["AWS_SESSION_TOKEN"]     = credentials.token or ""
    os.environ["ANTHROPIC_AUTH_TYPE"]   = "bedrock"
    os.environ["ANTHROPIC_BEDROCK_BASE_URL"] = f"https://bedrock-runtime.{region}.amazonaws.com"
    
    return Anthropic()

# Usage
client = create_bedrock_claude_client(region="us-west-2")
# Now SDK sessions route through Bedrock, using your AWS credentials
```

### Bedrock Service Tier Selection in SDK

Bedrock supports three service tiers; select via environment variable:

```python
import os

# Before creating the SDK client or running a session:
os.environ["CLAUDE_CODE_BEDROCK_SERVICE_TIER"] = "flex"   # Options: default, flex, priority

# Or in settings.json:
# { "bedrock": { "serviceTier": "flex" } }
```

| Tier | Cost | Throughput | Best for |
|------|------|-----------|---------|
| `default` | Standard | Best-effort | General use, interactive sessions |
| `flex` | ~40% lower | Lower, async | CI/CD batch processing, cost-sensitive |
| `priority` | ~20% higher | Reserved throughput | SLA-bound production pipelines |

---
