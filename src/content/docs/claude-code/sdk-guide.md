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
lastUpdated: 2026-06-06
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

### Basic C# Subprocess Wrapper

```csharp
using System;
using System.Diagnostics;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;

public class ClaudeCodeClient : IDisposable
{
    private readonly string _binaryPath;
    private readonly string _apiKey;

    public ClaudeCodeClient(string apiKey, string binaryPath = "claude")
    {
        _apiKey = apiKey;
        _binaryPath = binaryPath;
    }

    public async IAsyncEnumerable<ClaudeEvent> RunAsync(
        string prompt,
        string? workingDirectory = null,
        string model = "claude-sonnet-4-6",
        decimal maxBudgetUsd = 1.0m,
        int maxTurns = 30)
    {
        var psi = new ProcessStartInfo
        {
            FileName = _binaryPath,
            Arguments = $"--print --output-format stream-json --model {model} --max-turns {maxTurns}",
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            WorkingDirectory = workingDirectory ?? Environment.CurrentDirectory
        };

        psi.Environment["ANTHROPIC_API_KEY"] = _apiKey;
        psi.Environment["DISABLE_UPDATES"] = "1";
        psi.Environment["CLAUDE_CODE_MAX_BUDGET_USD"] = maxBudgetUsd.ToString("F2");

        using var process = Process.Start(psi)
            ?? throw new InvalidOperationException("Failed to start claude process");

        // Write prompt and close stdin
        await process.StandardInput.WriteLineAsync(prompt);
        process.StandardInput.Close();

        // Stream JSON events from stdout
        string? line;
        while ((line = await process.StandardOutput.ReadLineAsync()) != null)
        {
            if (string.IsNullOrWhiteSpace(line)) continue;

            ClaudeEvent? evt = null;
            try
            {
                evt = ParseEvent(line);
            }
            catch (JsonException)
            {
                // Skip malformed lines
                continue;
            }

            if (evt != null)
                yield return evt;
        }

        await process.WaitForExitAsync();
    }

    private static ClaudeEvent? ParseEvent(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var type = doc.RootElement.GetProperty("type").GetString();
        return type switch
        {
            "system"     => new SystemEvent    { Raw = json },
            "assistant"  => new AssistantEvent { Raw = json },
            "tool_result"=> new ToolResultEvent{ Raw = json },
            "result"     => new ResultEvent    { Raw = json },
            "error"      => new ErrorEvent     { Raw = json },
            _            => null
        };
    }

    public void Dispose() { }
}

// Event types
public abstract class ClaudeEvent { public required string Raw { get; init; } }
public class SystemEvent     : ClaudeEvent { }
public class AssistantEvent  : ClaudeEvent { }
public class ToolResultEvent : ClaudeEvent { }
public class ResultEvent     : ClaudeEvent { }
public class ErrorEvent      : ClaudeEvent { }
```

### Usage Example

```csharp
var client = new ClaudeCodeClient(
    apiKey: Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")!,
    binaryPath: "claude"
);

await foreach (var evt in client.RunAsync(
    prompt: "Review the authentication module in src/auth/ and report any security issues",
    workingDirectory: "/path/to/repo",
    model: "claude-opus-4-8",
    maxBudgetUsd: 2.0m))
{
    if (evt is AssistantEvent asst)
    {
        using var doc = JsonDocument.Parse(asst.Raw);
        var message = doc.RootElement.GetProperty("message");
        foreach (var content in message.GetProperty("content").EnumerateArray())
        {
            if (content.GetProperty("type").GetString() == "text")
                Console.Write(content.GetProperty("text").GetString());
        }
    }
    else if (evt is ResultEvent result)
    {
        using var doc = JsonDocument.Parse(result.Raw);
        var cost = doc.RootElement.GetProperty("costUsd").GetDecimal();
        Console.WriteLine($"\n[Session cost: ${cost:F4}]");
    }
}
```

### NuGet Package Considerations

For production use, consider wrapping this pattern in a reusable NuGet package. Key concerns:
- **Thread safety**: One `ClaudeCodeClient` instance per session; don't share across threads
- **Cancellation**: Pass `CancellationToken` through `ReadLineAsync` for graceful shutdown
- **Retry logic**: Wrap the outer `RunAsync` in a Polly retry policy for transient failures
- **Session persistence**: Parse the `sessionId` from the `system` event; store it for `/resume` support

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
