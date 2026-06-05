---
title: MCP Servers — Architecture, Configuration & Development
description: >
  Complete guide to the Model Context Protocol (MCP) in Claude Code — architecture,
  transport types, primitives, configuration scopes, building custom servers, security,
  official and community servers, .NET integration, and production deployment patterns.
  Covers MCP spec and Claude Code v2.1.126 (May 2026). Updated June 2026
sidebar:
  order: 6
  label: MCP Servers
lastUpdated: 2026-06-05
---

# MCP Servers — Architecture, Configuration & Development

> **Version:** MCP Spec 1.1 · Claude Code v2.1.126 (May 19, 2026)

The **Model Context Protocol (MCP)** is an open standard that allows AI systems like Claude Code to connect to external data sources, tools, and services. MCP servers extend Claude Code's capabilities beyond what its built-in tools provide — connecting it to databases, APIs, file systems, cloud services, development tools, and any custom backend.

**MCP is now supported by:** Claude Code, Claude Desktop, Cursor, Windsurf, VS Code (Copilot), GitHub Copilot, Gemini CLI, ChatGPT (beta), and dozens of other AI tools.

---

## 1. Architecture Overview

### Host → Client → Server Model

```
  ┌─────────────────────────────────────────────────────────────────┐
  │                     Claude Code (HOST)                           │
  │                                                                  │
  │   User prompt ──► Claude model ──► tool_use decision            │
  │                                         │                        │
  │   ┌─────────────────────────────────────┴──────────────────┐    │
  │   │                  MCP CLIENT                             │    │
  │   │   (built into Claude Code, one instance per server)    │    │
  │   │                                                         │    │
  │   │   • Manages connection lifecycle                        │    │
  │   │   • Serialises/deserialises JSON-RPC 2.0               │    │
  │   │   • Routes tool calls to the correct server            │    │
  │   │   • Handles authentication                             │    │
  │   └──────────────┬──────────────────────┬──────────────────┘    │
  └──────────────────┕──────────────────────┕──────────────────────-┘
                     │                      │
             JSON-RPC 2.0           JSON-RPC 2.0
             over stdio             over HTTP
                     │                      │
  ┌──────────────────┴──┐       ┌───────────┴───────────────────────┐
  │   LOCAL MCP SERVER  │       │        REMOTE MCP SERVER          │
  │   (stdio transport) │       │        (HTTP transport)           │
  │                     │       │                                    │
  │  ┌───────────────┐  │       │  ┌───────────┐  ┌─────────────┐  │
  │  │    Tools      │  │       │  │   Tools   │  │  Resources  │  │
  │  │  (callable    │  │       │  │           │  │             │  │
  │  │   functions)  │  │       │  └───────────┘  └─────────────┘  │
  │  └───────────────┘  │       │  ┌─────────────────────────────┐  │
  │  ┌───────────────┐  │       │  │         Prompts             │  │
  │  │   Resources   │  │       │  └─────────────────────────────┘  │
  │  │  (data URIs)  │  │       │                                    │
  │  └───────────────┘  │       │  Connects to: SaaS APIs,          │
  │  ┌───────────────┐  │       │  cloud services, databases        │
  │  │   Prompts     │  │       └───────────────────────────────────┘
  │  │  (templates)  │  │
  │  └───────────────┘  │
  │                     │
  │  Connects to: local  │
  │  DB, filesystem, CLI │
  └─────────────────────┘
```

**Model:** Host → Client → Server

- **Host**: Claude Code (the AI application)
- **Client**: Built into Claude Code; manages one connection per server
- **Server**: Your process that implements the MCP spec

**Protocol:** JSON-RPC 2.0 — every message is a structured JSON object with `method`, `params`, `id`.

### JSON-RPC 2.0 Message Flow

```
  Claude Code (Client)                    MCP Server
        │                                     │
        │── initialize ──────────────────────►│
        │◄── initialized ─────────────────────│
        │                                     │
        │── tools/list ──────────────────────►│
        │◄── tools/list result ───────────────│
        │                                     │
        │── tools/call {name, arguments} ────►│
        │                    [server executes tool]
        │◄── tools/call result ───────────────│
        │                                     │
        │── resources/list ──────────────────►│
        │◄── resources/list result ───────────│
        │                                     │
        │── resources/read {uri} ────────────►│
        │◄── resources/read result ───────────│
```

---

## 2. Transport Types

MCP supports three transports (SSE is deprecated; use HTTP streaming):

### Transport Comparison

| Feature | stdio (local) | HTTP (remote) | SSE (deprecated) |
|---------|--------------|---------------|-----------------|
| Process management | Claude Code spawns process | Server runs independently | Server runs independently |
| Scalability | 1 client per server | Many clients per server | Many clients per server |
| Security | Process isolation, no network | TLS, token auth, firewall | Same as HTTP |
| Latency | Minimal (pipe) | Network round-trip | Network + SSE overhead |
| Debugging | Easy (local logs) | Requires remote log access | Same as HTTP |
| Best for | Local tools, dev secrets | Shared team services, SaaS | Legacy only |
| Authentication | OS process isolation | Bearer token, OAuth 2.0 | Same as HTTP |
| Startup | Spawned on session start | Pre-running server | Pre-running server |

### 2.1 stdio (Local Process)

```json
{
  "mcpServers": {
    "my-server": {
      "type": "stdio",
      "command": "node",
      "args": ["~/.claude/mcp-servers/my-server/index.js"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```

- Claude Code **spawns the process** and communicates over stdin/stdout
- Best for: local tools, development, security-sensitive servers
- Process lifecycle tied to Claude Code session
- Environment variables from Claude Code process are inherited (can add extras in `env`)

**stdio startup sequence:**
```
1. Claude Code spawns: node index.js
2. Claude Code sends: {"jsonrpc":"2.0","method":"initialize","params":{...},"id":1}
3. Server responds:   {"jsonrpc":"2.0","result":{"protocolVersion":"1.1","capabilities":{...}},"id":1}
4. Claude Code sends: {"jsonrpc":"2.0","method":"initialized","params":{}}
5. Connection established — tools are now available
```

**Critical for stdio servers:** Any non-JSON output on stdout (startup banners, debug logs, print statements) will corrupt the JSON-RPC protocol and crash the connection. Always direct all debug output to stderr.

### 2.2 HTTP (Remote Server)

```json
{
  "mcpServers": {
    "remote-api": {
      "type": "http",
      "url": "https://mcp.example.com/v1",
      "headers": {
        "Authorization": "Bearer ${REMOTE_MCP_TOKEN}"
      }
    }
  }
}
```

- Claude Code connects to a running HTTP server
- Best for: shared team servers, cloud services, production APIs
- Server can serve multiple clients simultaneously
- Supports OAuth 2.0 and bearer token authentication

**HTTP request format:**
```http
POST /v1 HTTP/1.1
Host: mcp.example.com
Content-Type: application/json
Authorization: Bearer tok_...

{"jsonrpc":"2.0","method":"tools/call","params":{"name":"query_db","arguments":{"sql":"SELECT..."}},"id":42}
```

### 2.3 SSE (Server-Sent Events — Deprecated)

Legacy transport. Migrate to HTTP streaming. Still works in Claude Code for backwards compatibility but will be removed in a future version.

---

## 3. The Three MCP Primitives

MCP servers expose three types of capabilities:

### 3.1 Tools — Callable Functions

Tools are the most important primitive. Claude can call a tool to perform an action.

```typescript
// Tool definition example
{
  name: "query_database",
  description: "Execute a SQL SELECT query on the production database. Returns rows as JSON array.",
  inputSchema: {
    type: "object",
    properties: {
      sql: {
        type: "string",
        description: "SQL SELECT statement (read-only)"
      },
      limit: {
        type: "integer",
        description: "Maximum rows to return (default 100, max 1000)",
        default: 100
      }
    },
    required: ["sql"]
  }
}
```

When Claude calls this tool:
1. Claude generates a `tool_use` block with `name: "query_database"` and `input: {sql: "SELECT..."}`
2. Claude Code sends it to the MCP server via JSON-RPC
3. The server executes the query and returns results
4. Claude Code feeds the result back to Claude

**Tool design principles:**
- Write descriptions Claude can reason about — be specific about what the tool does and doesn't do
- Use JSON Schema to constrain inputs — prevents Claude from passing wrong types
- Return structured data (JSON) Claude can reason over
- Keep tools focused — one tool, one purpose
- Indicate side effects explicitly in the description ("this modifies the database")

### 3.2 Resources — Data Sources

Resources are static or dynamic data that Claude can read.

```typescript
{
  uri: "db://prod/users/schema",
  name: "Users Table Schema",
  mimeType: "application/json",
  description: "Current schema of the users table"
}
```

Resources are exposed via URI patterns. Claude can request them via `resources/read`. Unlike tools, resources don't perform actions — they provide data.

**Resource URI examples:**
- `file:///home/user/config.yaml`
- `db://production/tables/orders`
- `github://org/repo/README.md`
- `jira://PROJ/open-bugs`

### 3.3 Prompts — Reusable Templates

Prompts are pre-defined message templates with arguments.

```typescript
{
  name: "code_review",
  description: "Standard code review checklist for PRs",
  arguments: [
    { name: "language", description: "Programming language", required: true },
    { name: "focus", description: "Review focus area (security/performance/style)", required: false }
  ]
}
```

Users can invoke prompts via `/mcp` or Claude can suggest them. Prompts reduce repetition for common workflows.

---

## 4. Configuration Scopes

MCP servers can be configured at three scopes, applied in order (local overrides project overrides user):

### 4.1 Project Scope (`.mcp.json`)

```json
{
  "mcpServers": {
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"],
      "env": {
        "PGPASSWORD": "${PGPASSWORD}"
      }
    },
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

- Committed to git — shared with the team
- Lives at `<project-root>/.mcp.json`
- Supports `${ENV_VAR}` and `${ENV_VAR:-default}` variable expansion

### 4.2 User Scope (`~/.claude/.mcp.json` or `~/.claude/settings.json`)

```json
{
  "mcpServers": {
    "personal-notes": {
      "type": "stdio",
      "command": "node",
      "args": ["~/.claude/mcp-servers/notes/index.js"]
    }
  }
}
```

- Personal servers available across all projects
- Not committed to git

### 4.3 Local Scope (`.claude/mcp.local.json`)

```json
{
  "mcpServers": {
    "local-dev-api": {
      "type": "http",
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

- Auto-gitignored — machine-local only
- Use for local dev servers, personal API tokens that shouldn't be committed

### 4.4 Enterprise Scope (Managed)

```json
// /Library/Application Support/ClaudeCode/managed-mcp.json  (macOS)
// /etc/claude-code/managed-mcp.json  (Linux)
{
  "mcpServers": {
    "corporate-vault": {
      "type": "http",
      "url": "https://vault.corp.internal/mcp",
      "headers": { "Authorization": "Bearer ${VAULT_TOKEN}" }
    }
  }
}
```

Managed MCP servers are always available and cannot be removed by users. Ideal for corporate tools.

---

## 5. Managing MCP in Claude Code

```
/mcp                  # List all connected servers and their tools
/mcp status           # Detailed connection status, errors
/mcp restart <name>   # Restart a specific server
/mcp add              # Interactive wizard to add a new server
```

### Check server tools

```
> List all MCP tools available to you
```

Claude will respond with all tools from all connected MCP servers, grouped by server.

---

## 6. Building a Custom MCP Server

### 6.1 TypeScript / Node.js — Complete Example with All Primitives

This is a full-featured MCP server demonstrating Tools, Resources, and Prompts together:

```bash
npm create mcp-server@latest my-server
cd my-server
npm install
```

```typescript
// src/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'analytics-server',
  version: '1.0.0',
  description: 'Analytics and reporting MCP server',
});

// ─── TOOLS ────────────────────────────────────────────────────────────────────

// Tool 1: Query analytics data
server.tool(
  'query_analytics',
  'Query analytics data for a date range. Returns JSON with metrics.',
  {
    metric: z.enum(['pageviews', 'sessions', 'conversions', 'revenue'])
      .describe('The metric to query'),
    start_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe('Start date in YYYY-MM-DD format'),
    end_date: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .describe('End date in YYYY-MM-DD format'),
    group_by: z.enum(['day', 'week', 'month']).default('day')
      .describe('Aggregation period'),
  },
  async ({ metric, start_date, end_date, group_by }) => {
    // Implementation: query your analytics backend
    const data = await fetchAnalytics({ metric, start_date, end_date, group_by });
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    };
  }
);

// Tool 2: Get top pages
server.tool(
  'get_top_pages',
  'Get the top N pages by pageviews for a date range.',
  {
    limit: z.number().int().min(1).max(100).default(10)
      .describe('Number of top pages to return'),
    date: z.string().describe('Date in YYYY-MM-DD format (uses last 30 days from this date)'),
  },
  async ({ limit, date }) => {
    const pages = await fetchTopPages(date, limit);
    return {
      content: [{ type: 'text', text: JSON.stringify(pages) }],
    };
  }
);

// Tool 3: Export report (side-effect — documented in description)
server.tool(
  'export_report',
  'Export an analytics report to CSV. WRITES a file to /reports/. Returns the file path.',
  {
    report_type: z.enum(['weekly', 'monthly', 'custom']),
    email: z.string().email().optional()
      .describe('If provided, email the report to this address'),
  },
  async ({ report_type, email }) => {
    const filePath = await generateAndSaveReport(report_type);
    if (email) {
      await sendReportByEmail(filePath, email);
    }
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, file: filePath, emailed: !!email })
      }],
    };
  }
);

// ─── RESOURCES ────────────────────────────────────────────────────────────────

// Resource 1: Live dashboard metrics
server.resource(
  'analytics://dashboard/live',
  'Live Dashboard Metrics',
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: JSON.stringify(await fetchLiveDashboard()),
    }],
  })
);

// Resource 2: Available metrics catalog
server.resource(
  'analytics://metrics/catalog',
  'Available Metrics Catalog',
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: JSON.stringify({
        metrics: ['pageviews', 'sessions', 'bounce_rate', 'conversion_rate', 'revenue', 'arpu'],
        dimensions: ['country', 'device', 'source', 'campaign', 'page'],
        granularities: ['hour', 'day', 'week', 'month'],
      }),
    }],
  })
);

// ─── PROMPTS ──────────────────────────────────────────────────────────────────

// Prompt 1: Weekly report generation
server.prompt(
  'weekly_report',
  'Generate a weekly analytics report with insights and recommendations',
  [
    { name: 'week_ending', description: 'End date of the week (YYYY-MM-DD)', required: true },
    { name: 'focus', description: 'Focus area: conversion|acquisition|retention', required: false },
  ],
  async ({ week_ending, focus }) => ({
    messages: [{
      role: 'user',
      content: {
        type: 'text',
        text: `Generate a comprehensive weekly analytics report for the week ending ${week_ending}.
${focus ? `Focus particularly on ${focus} metrics.` : ''}
Use the query_analytics tool to fetch data. Include:
1. Key metrics summary (pageviews, sessions, conversions, revenue)
2. Week-over-week comparison
3. Top performing pages
4. Notable trends or anomalies
5. 3 actionable recommendations for next week`,
      },
    }],
  })
);

// ─── START SERVER ─────────────────────────────────────────────────────────────

// IMPORTANT: All console.log go to stderr to avoid corrupting stdio JSON-RPC
console.error('Analytics MCP server starting...');

const transport = new StdioServerTransport();
await server.connect(transport);

console.error('Analytics MCP server ready');
```

### 6.2 Python — Complete Example

```bash
pip install mcp
```

```python
# server.py — Complete Python MCP server with Tools, Resources, and Prompts
import asyncio
import json
import sys
from datetime import datetime, timedelta
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import (
    Tool, Resource, Prompt, PromptArgument,
    TextContent, EmbeddedResource
)
import mcp.types as types

# IMPORTANT: redirect all debug output to stderr
print("Server starting...", file=sys.stderr)

server = Server("analytics-python-server")


# ─── TOOLS ────────────────────────────────────────────────────────────────────

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="run_query",
            description=(
                "Run a SQL SELECT query on the analytics database. "
                "Read-only. Returns results as a JSON array of objects. "
                "Maximum 1000 rows returned."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "sql": {
                        "type": "string",
                        "description": "SQL SELECT statement"
                    },
                    "limit": {
                        "type": "integer",
                        "default": 100,
                        "maximum": 1000,
                        "description": "Maximum rows to return"
                    }
                },
                "required": ["sql"]
            }
        ),
        Tool(
            name="get_metric_summary",
            description="Get a summary of key metrics for today vs yesterday.",
            inputSchema={
                "type": "object",
                "properties": {
                    "metrics": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": ["pageviews", "sessions", "conversions", "revenue"]
                        },
                        "description": "List of metrics to summarise",
                        "default": ["pageviews", "sessions", "conversions"]
                    }
                }
            }
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "run_query":
        sql = arguments["sql"]
        limit = arguments.get("limit", 100)

        # Security: only allow SELECT
        if not sql.strip().upper().startswith("SELECT"):
            raise ValueError("Only SELECT queries are permitted")

        result = await execute_analytics_query(sql, limit)
        return [TextContent(type="text", text=json.dumps(result, default=str))]

    elif name == "get_metric_summary":
        metrics = arguments.get("metrics", ["pageviews", "sessions", "conversions"])
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)

        summary = {}
        for metric in metrics:
            today_val = await get_metric(metric, str(today))
            yesterday_val = await get_metric(metric, str(yesterday))
            pct_change = ((today_val - yesterday_val) / yesterday_val * 100) if yesterday_val else 0
            summary[metric] = {
                "today": today_val,
                "yesterday": yesterday_val,
                "change_pct": round(pct_change, 2),
            }

        return [TextContent(type="text", text=json.dumps(summary))]

    raise ValueError(f"Unknown tool: {name}")


# ─── RESOURCES ────────────────────────────────────────────────────────────────

@server.list_resources()
async def list_resources() -> list[Resource]:
    return [
        Resource(
            uri="analytics://schema",
            name="Database Schema",
            mimeType="application/json",
            description="Current analytics database schema with table descriptions",
        ),
        Resource(
            uri="analytics://kpi-targets",
            name="KPI Targets",
            mimeType="application/json",
            description="Current quarter KPI targets for all key metrics",
        ),
    ]


@server.read_resource()
async def read_resource(uri: str) -> str:
    if uri == "analytics://schema":
        schema = await get_database_schema()
        return json.dumps(schema)
    elif uri == "analytics://kpi-targets":
        targets = await get_kpi_targets()
        return json.dumps(targets)
    raise ValueError(f"Unknown resource URI: {uri}")


# ─── PROMPTS ──────────────────────────────────────────────────────────────────

@server.list_prompts()
async def list_prompts() -> list[Prompt]:
    return [
        Prompt(
            name="data_investigation",
            description="Investigate an analytics anomaly or question",
            arguments=[
                PromptArgument(
                    name="question",
                    description="The analytics question or anomaly to investigate",
                    required=True,
                ),
                PromptArgument(
                    name="time_range",
                    description="Time range to investigate (e.g. 'last 7 days', '2026-05-01 to 2026-05-15')",
                    required=False,
                ),
            ],
        ),
    ]


@server.get_prompt()
async def get_prompt(name: str, arguments: dict) -> types.GetPromptResult:
    if name == "data_investigation":
        question = arguments["question"]
        time_range = arguments.get("time_range", "last 7 days")
        return types.GetPromptResult(
            description=f"Investigate: {question}",
            messages=[
                types.PromptMessage(
                    role="user",
                    content=types.TextContent(
                        type="text",
                        text=f"""Investigate this analytics question: {question}

Time range: {time_range}

Steps:
1. Use run_query to pull relevant data
2. Look for patterns, anomalies, and correlations
3. Check the analytics://schema resource if you need table structure
4. Compare against analytics://kpi-targets if relevant
5. Provide a clear explanation with supporting data
6. Suggest follow-up queries if the investigation warrants deeper analysis""",
                    ),
                )
            ],
        )
    raise ValueError(f"Unknown prompt: {name}")


# ─── HELPERS (stubs — replace with real implementations) ──────────────────────

async def execute_analytics_query(sql: str, limit: int) -> list[dict]:
    # Replace with actual DB connection
    return [{"example": "row", "count": 42}]

async def get_metric(metric: str, date: str) -> float:
    return 1000.0  # stub

async def get_database_schema() -> dict:
    return {"tables": [{"name": "events", "columns": ["id", "event_type", "user_id", "ts"]}]}

async def get_kpi_targets() -> dict:
    return {"pageviews": 100000, "conversions": 1000, "revenue": 50000}


# ─── MAIN ─────────────────────────────────────────────────────────────────────

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
```

### 6.3 C# / .NET

```bash
dotnet add package ModelContextProtocol
```

```csharp
// Program.cs
using Microsoft.Extensions.Hosting;
using ModelContextProtocol.Server;

// CRITICAL: Use CreateEmptyApplicationBuilder to prevent non-JSON output on stdio
var builder = Host.CreateEmptyApplicationBuilder(new HostApplicationBuilderSettings
{
    Args = args,
    EnvironmentName = Environments.Production
});

builder.Services
    .AddMcpServer()
    .WithStdioTransport()
    .WithToolsFromAssembly();

var host = builder.Build();
await host.RunAsync();
```

```csharp
// Tools/DatabaseTools.cs
using ModelContextProtocol.Server;
using System.ComponentModel;

[McpServerToolType]
public class DatabaseTools
{
    private readonly IDbConnection _db;

    public DatabaseTools(IDbConnection db) => _db = db;

    [McpServerTool, Description("Execute a SQL SELECT query on the reporting database")]
    public async Task<string> RunQuery(
        [Description("SQL SELECT statement")] string sql,
        [Description("Maximum rows (default 100)")] int limit = 100)
    {
        // Validate: only SELECT allowed
        if (!sql.TrimStart().StartsWith("SELECT", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Only SELECT queries are allowed");

        var results = await _db.QueryAsync(sql + $" FETCH FIRST {Math.Min(limit, 1000)} ROWS ONLY");
        return JsonSerializer.Serialize(results);
    }
}
```

> **Why `CreateEmptyApplicationBuilder`?** The standard `WebApplication.CreateBuilder` writes startup banners and diagnostics to stdout. MCP uses stdout for the JSON-RPC protocol — any non-JSON output breaks the connection. `CreateEmptyApplicationBuilder` suppresses all banner/diagnostic output.

### 6.4 Building a Custom MCP Server — TypeScript (Low-Level API)

The examples above use `McpServer` (the high-level SDK). If you need finer control, or are integrating with an existing framework, you can use the low-level `Server` class directly:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  { name: "my-custom-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_weather",
      description: "Get current weather for a location",
      inputSchema: {
        type: "object",
        properties: {
          location: { type: "string", description: "City name or coordinates" },
        },
        required: ["location"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_weather") {
    const location = request.params.arguments?.location as string;
    // Your actual implementation here
    const weather = await fetchWeather(location);
    return {
      content: [{ type: "text", text: `Weather in ${location}: ${weather}` }],
    };
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 6.5 Building a Custom MCP Server — Python (Low-Level API)

```python
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

server = Server("my-custom-server")

@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="query_database",
            description="Execute a SQL query against the project database",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "SQL SELECT query"},
                    "limit": {"type": "integer", "default": 100},
                },
                "required": ["query"],
            },
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "query_database":
        query = arguments["query"]
        limit = arguments.get("limit", 100)
        # Validate it's a SELECT query
        if not query.strip().upper().startswith("SELECT"):
            raise ValueError("Only SELECT queries are allowed")
        results = await db.execute(f"{query} LIMIT {limit}")
        return [types.TextContent(type="text", text=str(results))]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as streams:
        await server.run(*streams, server.create_initialization_options())

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

### 6.6 Implementing MCP Resources

Resources let Claude read data from your server without you explicitly calling a tool:

```typescript
import { ReadResourceRequestSchema, ListResourcesRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: "project://schema",
      name: "Database Schema",
      description: "Current database schema",
      mimeType: "text/plain",
    },
    {
      uri: "project://config",
      name: "Project Config",
      mimeType: "application/json",
    },
  ],
}));

// Handle resource reads
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  if (uri === "project://schema") {
    const schema = await db.getSchema();
    return { contents: [{ uri, mimeType: "text/plain", text: schema }] };
  }
  throw new Error(`Resource not found: ${uri}`);
});
```

---

## 7. Official MCP Servers

Anthropic and partners maintain official servers. Install via npm:

```bash
# File system access (controlled)
npx @modelcontextprotocol/server-filesystem /allowed/path

# Git operations
npx @modelcontextprotocol/server-git

# GitHub API (issues, PRs, code)
npx @modelcontextprotocol/server-github

# PostgreSQL (read-only)
npx @modelcontextprotocol/server-postgres postgresql://localhost/mydb

# SQLite
npx @modelcontextprotocol/server-sqlite path/to/database.db

# Brave Search
npx @modelcontextprotocol/server-brave-search

# Memory (key-value store across sessions)
npx @modelcontextprotocol/server-memory

# Sequential thinking (structured reasoning)
npx @modelcontextprotocol/server-sequential-thinking

# Slack
npx @modelcontextprotocol/server-slack

# Google Drive
npx @modelcontextprotocol/server-gdrive

# Google Maps
npx @modelcontextprotocol/server-google-maps
```

### Production-grade `.mcp.json` for a typical web project

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
    },
    "postgres": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-postgres", "${DATABASE_URL}"]
    },
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "/home/user/projects/myapp"]
    },
    "memory": {
      "type": "stdio",
      "command": "npx",
      "args": ["@modelcontextprotocol/server-memory"]
    }
  }
}
```

---

## 8. Security Considerations

### MCP Security Best Practices

| Risk | Mitigation |
|------|-----------|
| Tool injection via server output | Validate all tool output before passing to Claude |
| Overprivileged tools | Scope tools to minimum required permissions |
| Secret exposure | Never include secrets in tool descriptions/schemas |
| SQL injection via MCP tools | Always parameterize queries; validate input |
| Server impersonation | Pin server versions; verify checksums |
| Prompt injection via resources | Sanitize resource content before returning |

```json
// Restrict which MCP tools Claude can use
{
  "permissions": {
    "allow": [
      "mcp:filesystem:read_file",
      "mcp:filesystem:list_directory"
    ],
    "deny": [
      "mcp:filesystem:write_file",
      "mcp:filesystem:delete_file"
    ]
  }
}
```

### MCP Prompt Injection

MCP servers can return content that contains text designed to hijack Claude's instructions. This is called **MCP prompt injection** or **tool poisoning**.

**Mitigations:**
- Only install MCP servers you control or trust explicitly
- Review server source code before installing
- Use `--disallowedTools` to restrict which MCP tools Claude can call
- Enable the `PreToolUse` hook to validate MCP tool calls before execution
- For enterprise: use enterprise-managed MCP servers only

**CVE-2025-6514** — `mcp-remote` OS command injection: a vulnerability in the `mcp-remote` proxy package allowed a malicious MCP server response to inject OS commands. Patched in `mcp-remote@0.1.3`. Update if using `mcp-remote`.

### Common MCP Security Mistakes

**Mistake 1: Hardcoding credentials in `.mcp.json`**

```json
// WRONG — credentials committed to git
{
  "mcpServers": {
    "db": {
      "command": "node",
      "args": ["server.js"],
      "env": { "DB_PASSWORD": "supersecret123" }
    }
  }
}

// RIGHT — use environment variable expansion
{
  "mcpServers": {
    "db": {
      "command": "node",
      "args": ["server.js"],
      "env": { "DB_PASSWORD": "${DB_PASSWORD}" }
    }
  }
}
```

**Mistake 2: Exposing write operations without explicit documentation**

```typescript
// WRONG — reads like a query tool but actually deletes data
server.tool(
  'manage_records',
  'Manage database records',  // ← too vague
  { id: z.string(), action: z.enum(['get', 'delete']) },
  handler
);

// RIGHT — name and describe side effects clearly
server.tool(
  'delete_record',
  'PERMANENTLY DELETES a record by ID. This cannot be undone. Requires confirmation.',
  { id: z.string(), confirm: z.literal(true).describe('Must be true to confirm deletion') },
  handler
);
```

**Mistake 3: No input validation — SQL injection via MCP**

```typescript
// WRONG — passes user-controlled SQL directly to DB
server.tool('run_sql', 'Run SQL', { sql: z.string() }, async ({ sql }) => {
  return await db.query(sql);  // ← SQL injection risk
});

// RIGHT — validate and restrict
server.tool('run_sql', 'Run read-only SQL SELECT queries', { sql: z.string() }, async ({ sql }) => {
  const cleaned = sql.trim().toUpperCase();
  if (!cleaned.startsWith('SELECT')) {
    throw new Error('Only SELECT queries are permitted');
  }
  // Use parameterised queries for any user-provided values inside SQL
  return await db.query(sql);
});
```

**Mistake 4: Printing to stdout in stdio servers (breaks the protocol)**

```python
# WRONG — corrupts JSON-RPC on stdio
print("Starting server...")       # goes to stdout → breaks protocol
print(f"Connected to DB: {url}")  # same problem

# RIGHT — always use stderr for non-protocol output
import sys
print("Starting server...", file=sys.stderr)
print(f"Connected to DB: {url}", file=sys.stderr)
```

**Mistake 5: Exceeding the token budget**

```
# Check your server's token cost:
/mcp status

# Each tool definition uses ~150–400 tokens.
# 50 tools × 300 tokens = 15,000 tokens consumed at every session start.
# Keep total MCP tokens under 20,000.
```

**Mistake 6: Running an HTTP MCP server without authentication**

```typescript
// WRONG — any network client can call your tools
app.post('/mcp', async (req, res) => {
  const transport = new HttpServerTransport(req, res);
  await server.connect(transport);
});

// RIGHT — validate token before handling
app.post('/mcp', (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== process.env.MCP_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}, async (req, res) => {
  const transport = new HttpServerTransport(req, res);
  await server.connect(transport);
});
```

### Tool Token Budget

Keep total MCP tool definitions under **20,000 tokens**. Every tool schema is loaded into Claude's context at session start. Exceeding this degrades performance significantly.

```
/mcp status    # shows token cost per server
```

### Network Isolation

For local stdio servers, Claude Code restricts the spawned process's network access by default in sandbox mode. This prevents MCP servers from exfiltrating data.

### Authentication

For HTTP MCP servers:
- Use bearer tokens: `"headers": { "Authorization": "Bearer ${TOKEN}" }`
- Rotate tokens regularly
- Use `${ENV_VAR}` — never hardcode tokens in `.mcp.json`
- For enterprise: use OAuth 2.0 with PKCE

---

## MCP Performance & Cost Optimization

### Token Cost Per Server

Each connected MCP server adds ~2,650 tokens to the system prompt (from tool schemas). This is a fixed cost paid **every session turn** that uses the MCP server.

```
Session context breakdown with 3 MCP servers:
─────────────────────────────────────────────
System prompt (base):          ~3,100 tokens
Built-in tool schemas:         ~4,800 tokens
MCP server A (github):         ~2,650 tokens
MCP server B (linear):         ~2,650 tokens
MCP server C (postgres):       ~2,650 tokens
CLAUDE.md:                     ~3,000 tokens
─────────────────────────────────────────────
Total fixed overhead:         ~18,850 tokens
Available for work (200K):   ~181,150 tokens
```

**Rule of thumb:** Connect only the MCP servers you'll use in the current session. Use `.claude/.mcp.json.local` to create a project-local subset of servers active during a specific workflow.

### Scoped MCP Server Files

| File | Scope | Git? | Use for |
|------|-------|------|---------|
| `.mcp.json` | Project | Yes | Team-shared servers (commit to git) |
| `~/.claude/.mcp.json` | User | No | Personal servers across all projects |
| `.claude/.mcp.json.local` | Project local | No | Session/workflow-specific subset |
| Enterprise managed | Org-wide | Managed | Organisation-mandated servers |

### Server Connection Health

Monitor and debug server connections at runtime:

```bash
# In Claude Code session
> /mcp                 # list all configured servers + status

# Server status values:
# "connected"   — active, tools available
# "connecting"  — startup in progress
# "error"       — failed, check ~/.claude/mcp-logs/<server-name>.log
# "disabled"    — disabled in settings

# Force-reconnect a broken server:
> /mcp disconnect <server-name>
> /mcp connect <server-name>
```

Logs for each server are at `~/.claude/mcp-logs/<server-name>.log`.

### Building Efficient MCP Servers

**Keep tool schemas concise.** Each tool's JSON schema contributes to the ~2,650 token overhead. Avoid verbose descriptions and deeply nested schemas:

```typescript
// ❌ Verbose — 150 tokens for one tool schema
server.addTool({
  name: "search_database",
  description: "This comprehensive database search tool allows you to query the PostgreSQL database with flexible filtering options. You can filter by date ranges, user IDs, statuses, and many other fields...",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "The SQL WHERE clause to filter results" },
      limit: { type: "number", description: "Maximum number of rows to return", default: 100 }
    }
  }
});

// ✅ Concise — 40 tokens for the same tool
server.addTool({
  name: "search_database",
  description: "Query the database. Returns rows matching the filter.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" },
      limit: { type: "number", default: 100 }
    }
  }
});
```

**Group related operations.** Combine multiple related tools into one with an `action` parameter to reduce schema overhead:

```typescript
// Instead of 5 separate CRUD tools (5 × ~40 tokens each):
server.addTool({ name: "create_task", ... });
server.addTool({ name: "read_task", ... });
server.addTool({ name: "update_task", ... });
server.addTool({ name: "delete_task", ... });
server.addTool({ name: "list_tasks", ... });

// Use one tool with an action parameter (saves ~160 tokens):
server.addTool({
  name: "manage_tasks",
  description: "Create, read, update, delete, or list tasks.",
  inputSchema: {
    type: "object",
    properties: {
      action: { type: "string", enum: ["create", "read", "update", "delete", "list"] },
      id: { type: "string" },
      data: { type: "object" }
    },
    required: ["action"]
  }
});
```

---

## 9. MCP Server Debugging Guide

### Enable MCP debug logging

```bash
CLAUDE_MCP_DEBUG=1 claude
```

### Check server connection

```
/mcp
```

Shows: server name, status (connected/error), tool count, resource count, last error.

### Test a stdio server manually (without Claude Code)

```bash
# Step 1: Start the server and send it an initialize request
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"1.1","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}' \
  | node my-server/index.js

# Step 2: List all tools
echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}' \
  | node my-server/index.js

# Step 3: Call a specific tool
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"my_tool","arguments":{"param":"value"}},"id":3}' \
  | node my-server/index.js
```

### Test an HTTP MCP server with curl

```bash
# Initialize
curl -X POST https://mcp.example.com/v1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"1.1","capabilities":{},"clientInfo":{"name":"curl-test","version":"1.0"}},"id":1}'

# List tools
curl -X POST https://mcp.example.com/v1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -d '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":2}'
```

### Debugging checklist

```
[ ] Server starts without errors in terminal (run it directly, not via Claude)
[ ] No non-JSON output on stdout (check with: node server.js | head -1)
[ ] JSON schema for all tools is valid (use https://jsonschema.net to validate)
[ ] All required tool input fields are in "required" array
[ ] Environment variables are set in shell before starting Claude Code
[ ] For HTTP: server is reachable from Claude Code's network
[ ] For HTTP: authentication token is correct
[ ] Token budget: /mcp status shows < 20,000 tokens total
```

### Common MCP problems

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| Server fails to start | Node/Python version mismatch | Check runtime version requirements |
| `ENOENT` error | Command not found | Use full path or check npm global bin |
| `JSON parse error` | Non-JSON output on stdio | Use `CreateEmptyApplicationBuilder` (.NET), redirect all logs to stderr |
| Tool not appearing in `/mcp` | Schema validation failed | Check inputSchema is valid JSON Schema; validate with jsonschema.net |
| Token budget exceeded | Too many tools defined | Remove unused tools, split into multiple servers |
| `401 Unauthorized` | Wrong token | Check `${ENV_VAR}` expansion, set variable in shell |
| Server connects then immediately disconnects | initialize handshake failure | Check server sends correct `initialized` response |
| Tool returns empty response | Handler returned nothing | Ensure handler returns `{ content: [{ type: 'text', text: '...' }] }` |

---

## 10. Advanced Patterns

### Pattern 1: Conditional MCP Loading via Hooks

Only enable certain MCP servers based on project type:

```bash
#!/bin/bash
# ~/.claude/hooks/load-mcp-by-project.sh
# Called in SessionStart hook

PROJECT=$(basename "$CLAUDE_PROJECT_DIR")

if [ -f "pyproject.toml" ]; then
    echo "Python project detected. Database tools available."
elif [ -f "*.csproj" ] || [ -f "*.sln" ]; then
    echo ".NET project detected. Azure tools available."
fi
```

### Pattern 2: MCP Server with Caching

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const server = new McpServer({ name: 'cached-api', version: '1.0.0' });
const cache = new Map<string, { data: any; ts: number }>();

server.tool(
  'get_product',
  'Get product details by ID (cached for 5 minutes)',
  { id: z.string().describe('Product ID') },
  async ({ id }) => {
    const cached = cache.get(id);
    const now = Date.now();

    if (cached && now - cached.ts < 5 * 60 * 1000) {
      return { content: [{ type: 'text', text: JSON.stringify(cached.data) }] };
    }

    const data = await fetchProduct(id);
    cache.set(id, { data, ts: now });
    return { content: [{ type: 'text', text: JSON.stringify(data) }] };
  }
);
```

### Pattern 3: Multi-Tool Server for a Domain

Group related tools into one server:

```typescript
// An "operations" MCP server for DevOps tools
server.tool('deploy_service', 'Deploy a service to staging', {...}, deployHandler);
server.tool('rollback_service', 'Roll back a deployment', {...}, rollbackHandler);
server.tool('get_deployment_status', 'Check deployment status', {...}, statusHandler);
server.tool('scale_service', 'Scale a service up or down', {...}, scaleHandler);
server.tool('get_logs', 'Fetch service logs from the last N minutes', {...}, logsHandler);
```

### Pattern 4: MCP Server as a RAG Interface

```typescript
server.tool(
  'search_docs',
  'Search the internal knowledge base. Returns top-5 relevant documents with excerpts.',
  { query: z.string(), collection: z.enum(['engineering', 'product', 'legal']) },
  async ({ query, collection }) => {
    const results = await vectorStore.search(query, { collection, topK: 5 });
    return {
      content: [{
        type: 'text',
        text: results.map(r => `## ${r.title}\n${r.excerpt}\n[Score: ${r.score}]`).join('\n\n')
      }]
    };
  }
);
```

### Pattern 5: HTTP MCP Server with Express

```typescript
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { HttpServerTransport } from '@modelcontextprotocol/sdk/server/http.js';

const app = express();
const server = new McpServer({ name: 'http-server', version: '1.0.0' });

// Add tools...

app.use('/mcp', express.json());
app.post('/mcp', async (req, res) => {
  const transport = new HttpServerTransport(req, res);
  await server.connect(transport);
});

app.listen(3000, () => console.error('MCP server listening on :3000'));
```

```json
{
  "mcpServers": {
    "my-http-server": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

---

## 11. Token Budget Reference

| Component | Typical token cost |
|-----------|-------------------|
| Tool name + description | ~50–100 tokens per tool |
| Tool input schema | ~100–300 tokens per tool |
| Resource list | ~50 tokens per resource |
| Prompt list | ~50 tokens per prompt |
| **Recommended max** | **<20,000 tokens total** |

```
/mcp status    # Shows per-server token usage
```

---

## 12. Minimal TypeScript MCP Server — Complete Working Example

This is a self-contained, production-ready MCP server in TypeScript that demonstrates all key patterns in the smallest possible footprint. Use this as your starting template.

```typescript
#!/usr/bin/env node
/**
 * minimal-mcp-server.ts
 * 
 * A complete, minimal MCP server with:
 *  - Tool registration via the high-level McpServer API
 *  - Request handling for two tools
 *  - Proper stdio transport setup
 *  - All output correctly routed to stderr (never stdout)
 *
 * Install:
 *   npm install @modelcontextprotocol/sdk zod
 *   npx tsx minimal-mcp-server.ts
 *
 * Configure in .mcp.json:
 *   {
 *     "mcpServers": {
 *       "my-server": {
 *         "type": "stdio",
 *         "command": "npx",
 *         "args": ["tsx", "/absolute/path/to/minimal-mcp-server.ts"]
 *       }
 *     }
 *   }
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// CRITICAL: Do NOT use console.log() — that goes to stdout and corrupts JSON-RPC.
// ALL non-protocol output must go to stderr.
console.error("[minimal-mcp-server] Starting...");

// ─── 1. Create the server instance ───────────────────────────────────────────
const server = new McpServer({
  name: "minimal-mcp-server",
  version: "1.0.0",
});

// ─── 2. Register tools ───────────────────────────────────────────────────────

// Tool 1: A simple utility tool — echo with transformation
server.tool(
  "echo_upper",                          // Tool name (must be unique on this server)
  "Echo the input text in UPPERCASE. Use this to test the MCP connection.",
  {
    // Input schema using Zod — automatically converted to JSON Schema
    text: z.string().min(1).max(1000).describe("Text to echo in uppercase"),
  },
  async ({ text }) => {
    // Handler receives validated, typed input
    const result = text.toUpperCase();

    console.error(`[minimal-mcp-server] echo_upper called: "${text.slice(0, 50)}"`);

    // Return format: { content: [{ type: "text", text: "..." }] }
    return {
      content: [{ type: "text", text: result }],
    };
  }
);

// Tool 2: A data tool — fetch and process data
server.tool(
  "get_timestamp",
  "Get the current UTC timestamp in ISO 8601 format, optionally with timezone offset.",
  {
    timezone_offset_hours: z
      .number()
      .int()
      .min(-14)
      .max(14)
      .default(0)
      .describe("Timezone offset in hours from UTC (e.g. -5 for EST, +1 for CET)"),
    format: z
      .enum(["iso", "unix", "human"])
      .default("iso")
      .describe("Output format: iso=ISO8601, unix=Unix timestamp, human=readable string"),
  },
  async ({ timezone_offset_hours, format }) => {
    const now = new Date();
    const offsetMs = timezone_offset_hours * 60 * 60 * 1000;
    const adjusted = new Date(now.getTime() + offsetMs);

    let result: string;
    switch (format) {
      case "unix":
        result = Math.floor(now.getTime() / 1000).toString();
        break;
      case "human":
        result = adjusted.toUTCString().replace("GMT", `UTC${timezone_offset_hours >= 0 ? "+" : ""}${timezone_offset_hours}`);
        break;
      case "iso":
      default:
        result = adjusted.toISOString().replace("Z", `${timezone_offset_hours >= 0 ? "+" : ""}${String(Math.abs(timezone_offset_hours)).padStart(2, "0")}:00`);
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({ timestamp: result, format, offset_hours: timezone_offset_hours }),
      }],
    };
  }
);

// ─── 3. Connect the stdio transport and start ─────────────────────────────────
// StdioServerTransport reads JSON-RPC messages from stdin and writes to stdout.
// The McpServer handles the protocol negotiation (initialize/initialized handshake)
// and routes incoming requests to your registered tool handlers.

const transport = new StdioServerTransport();

try {
  await server.connect(transport);
  console.error("[minimal-mcp-server] Ready. Waiting for requests on stdin.");
} catch (error) {
  console.error("[minimal-mcp-server] Fatal startup error:", error);
  process.exit(1);
}

// The server runs until the client disconnects (Claude Code session ends).
// No cleanup code is needed — the process exits naturally when stdin closes.
```

### Registering the server

```json
// .mcp.json in your project root
{
  "mcpServers": {
    "minimal": {
      "type": "stdio",
      "command": "npx",
      "args": ["tsx", "/home/user/my-server/minimal-mcp-server.ts"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Testing it manually

```bash
# Step 1: Verify the server starts without error output on stdout
npx tsx minimal-mcp-server.ts < /dev/null
# Should show NO output (stderr goes to terminal, stdout stays clean)

# Step 2: Send an initialize handshake
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1.1","capabilities":{},"clientInfo":{"name":"test","version":"1"}}}' \
  | npx tsx minimal-mcp-server.ts

# Step 3: Call a tool
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"echo_upper","arguments":{"text":"hello world"}}}' \
  | npx tsx minimal-mcp-server.ts
# Expected response: {"jsonrpc":"2.0","id":2,"result":{"content":[{"type":"text","text":"HELLO WORLD"}]}}
```

---

## 13. MCP Security Checklist

Use this checklist before deploying any MCP server to production or sharing it with a team.

```
MCP SERVER SECURITY CHECKLIST
══════════════════════════════════════════════════════════════════

BEFORE BUILDING
[ ] Have a clear, minimal scope — only expose what Claude actually needs
[ ] Document all tools that have side effects (writes, deletions, external calls)
[ ] Decide on authentication model before writing any code

AUTHENTICATION & SECRETS
[ ] HTTP servers: Bearer token or OAuth 2.1 required (no unauthenticated endpoints)
[ ] Tokens stored in environment variables, not hardcoded in source
[ ] .mcp.json uses ${ENV_VAR} expansion — never plain text tokens
[ ] Tokens scoped to minimum required permissions (read-only where possible)
[ ] Token rotation procedure documented and scheduled (90-day maximum)
[ ] .mcp.json is NOT in .gitignore (safe to commit) — credentials are in env vars

INPUT VALIDATION
[ ] All tool inputs validated with JSON Schema (required array complete)
[ ] No raw SQL string concatenation — use parameterised queries
[ ] File path inputs validated/normalized — prevent path traversal (../../etc/passwd)
[ ] URL inputs validated — prevent SSRF (internal network access)
[ ] Numeric inputs bounded (min/max) to prevent resource exhaustion
[ ] String inputs length-bounded to prevent token budget exhaustion

TOOL DESIGN
[ ] Destructive tools have explicit "confirm: true" parameter (prevents accidental calls)
[ ] Side effects documented in tool description ("PERMANENTLY DELETES", "WRITES TO")
[ ] Read-only tools clearly marked — Claude prefers read tools over write tools
[ ] No tools that combine read + irreversible write in a single call
[ ] MCP server total tool definitions < 20,000 tokens (check with /mcp status)

STDIO SERVERS (LOCAL)
[ ] ALL non-JSON output directed to stderr (never stdout)
[ ] No startup banners, debug prints, or log messages to stdout
[ ] .NET: using Host.CreateEmptyApplicationBuilder (not WebApplication.CreateBuilder)
[ ] Python: print(..., file=sys.stderr) for all diagnostic output
[ ] Server tested with: node server.js | head -1  (should output valid JSON only)

HTTP SERVERS (REMOTE)
[ ] HTTPS enforced (no HTTP in production)
[ ] Authentication validated before ANY handler logic runs
[ ] Rate limiting implemented to prevent abuse
[ ] Request size limits set (prevent OOM via giant tool inputs)
[ ] Health check endpoint does NOT expose sensitive config/secrets
[ ] Error responses do NOT include internal paths, stack traces, or DB details
[ ] CORS configured restrictively (whitelist origins, not wildcard)

PROMPT INJECTION DEFENSE
[ ] Tool return values are data, not instructions (don't include "Now do X..." text)
[ ] Resource content is sanitized before return — strip markdown headers that could confuse Claude
[ ] Tool descriptions don't include user-controlled text (prevents meta-injection)

DEPENDENCY SECURITY
[ ] mcp-remote >= 0.1.3 (CVE-2025-6514 OS command injection fix)
[ ] npm audit / pip audit / dotnet list package --vulnerable run clean
[ ] Dependencies pinned to specific versions in production
[ ] Supply chain: only trusted packages from official registries

MONITORING
[ ] All tool calls logged with: timestamp, tool name, caller session, input summary
[ ] Error rate monitored — spike in errors may indicate attack attempts
[ ] Response time monitored — slowdowns may indicate resource exhaustion
[ ] Alert on authentication failures (brute force detection)
```

---

## 14. OAuth 2.1 for Remote MCP Servers

Remote MCP servers (HTTP transport) that need user-level authentication use **OAuth 2.1 with PKCE** (Proof Key for Code Exchange). This is the recommended authentication standard for MCP as of spec version 1.1.

### Why OAuth 2.1, not a simple API key?

A static API key grants the same access to every Claude Code user. OAuth 2.1 allows each user to authenticate with their own identity, with consent-based scopes, and with tokens that can be revoked per user without affecting others. It also eliminates the need to distribute shared secrets.

### OAuth 2.1 Flow for MCP

```
  OAUTH 2.1 WITH PKCE — MCP AUTHENTICATION FLOW
  ══════════════════════════════════════════════════════════════════

  USER               CLAUDE CODE             MCP SERVER           AUTH SERVER
   │                      │                       │                     │
   │                      │── 1. Discover ────────►│                     │
   │                      │                       │── /.well-known/oauth-authorization-server
   │                      │◄── OAuth metadata ─────│                     │
   │                      │    (auth_endpoint,      │                     │
   │                      │     token_endpoint)     │                     │
   │                      │                       │                     │
   │  2. User launches    │                       │                     │
   │  Claude Code, which  │                       │                     │
   │  needs MCP access    │                       │                     │
   │                      │                       │                     │
   │                      │── 3. Generate ─────────►│                     │
   │                      │   PKCE challenge        │                     │
   │                      │   (code_verifier,       │                     │
   │                      │    code_challenge)      │                     │
   │                      │                       │                     │
   │◄─ 4. Redirect URL ───│                       │                     │
   │   (browser opens     │                       │                     │
   │    auth page)        │                       │                     │
   │                      │                       │                     │
   │─── 5. User logs in ──────────────────────────────────────────────►│
   │       (clicks Allow) │                       │                     │
   │                      │                       │                     │
   │◄── 6. Redirect ────────────────────────────────────────────────────│
   │   with auth code     │                       │                     │
   │                      │                       │                     │
   │── 7. Auth code ─────►│                       │                     │
   │                      │                       │                     │
   │                      │─── 8. Exchange code ──────────────────────►│
   │                      │    + code_verifier                          │
   │                      │    (PKCE verification)                      │
   │                      │                       │                     │
   │                      │◄── 9. Access token + ──────────────────────│
   │                      │    refresh token                            │
   │                      │                       │                     │
   │                      │─── 10. MCP calls ─────►│                     │
   │                      │    Authorization:       │                     │
   │                      │    Bearer <access_token>│                     │
   │                      │                       │                     │
   │                      │◄── 11. Tool results ───│                     │
   │                      │                       │                     │
```

### Server-side OAuth 2.1 implementation (TypeScript/Express)

```typescript
import express from "express";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── 1. Publish OAuth metadata (required by MCP spec) ────────────────────────
// Claude Code discovers these endpoints automatically
app.get("/.well-known/oauth-authorization-server", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json({
    issuer: baseUrl,
    authorization_endpoint: `${baseUrl}/oauth/authorize`,
    token_endpoint: `${baseUrl}/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],   // PKCE required
    token_endpoint_auth_methods_supported: ["none"], // public client (PKCE replaces secret)
    scopes_supported: ["mcp:tools", "mcp:resources", "profile"],
  });
});

// In-memory stores (use a database in production)
const authCodes = new Map<string, {
  clientId: string; userId: string; codeChallenge: string;
  codeChallengeMethod: string; expiresAt: number;
}>();
const accessTokens = new Map<string, { userId: string; scopes: string[]; expiresAt: number }>();
const refreshTokens = new Map<string, { userId: string; scopes: string[] }>();

// ─── 2. Authorization endpoint ───────────────────────────────────────────────
app.get("/oauth/authorize", (req, res) => {
  const { client_id, redirect_uri, code_challenge, code_challenge_method, state, scope } = req.query as Record<string, string>;

  // In a real app: validate client_id, show login UI, get user consent
  // Here we auto-approve for simplicity (do NOT do this in production)
  const userId = "demo-user-123";

  // Generate authorization code
  const code = crypto.randomBytes(32).toString("hex");
  authCodes.set(code, {
    clientId: client_id,
    userId,
    codeChallenge: code_challenge,
    codeChallengeMethod: code_challenge_method || "S256",
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
  });

  // Redirect back to Claude Code with the auth code
  const redirectUrl = new URL(redirect_uri);
  redirectUrl.searchParams.set("code", code);
  if (state) redirectUrl.searchParams.set("state", state);

  res.redirect(redirectUrl.toString());
});

// ─── 3. Token endpoint ───────────────────────────────────────────────────────
app.post("/oauth/token", (req, res) => {
  const { grant_type, code, code_verifier, redirect_uri, refresh_token } = req.body;

  if (grant_type === "authorization_code") {
    const authCode = authCodes.get(code);
    if (!authCode || authCode.expiresAt < Date.now()) {
      return res.status(400).json({ error: "invalid_grant", error_description: "Code expired or invalid" });
    }
    authCodes.delete(code);

    // Verify PKCE — this is what makes OAuth 2.1 safe for public clients
    const verifierHash = crypto
      .createHash("sha256")
      .update(code_verifier)
      .digest("base64url");

    if (verifierHash !== authCode.codeChallenge) {
      return res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
    }

    // Issue tokens
    const accessToken = crypto.randomBytes(32).toString("hex");
    const newRefreshToken = crypto.randomBytes(32).toString("hex");

    accessTokens.set(accessToken, {
      userId: authCode.userId,
      scopes: ["mcp:tools", "mcp:resources"],
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    });
    refreshTokens.set(newRefreshToken, {
      userId: authCode.userId,
      scopes: ["mcp:tools", "mcp:resources"],
    });

    return res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: newRefreshToken,
      scope: "mcp:tools mcp:resources",
    });
  }

  if (grant_type === "refresh_token") {
    const tokenData = refreshTokens.get(refresh_token);
    if (!tokenData) {
      return res.status(400).json({ error: "invalid_grant", error_description: "Invalid refresh token" });
    }

    // Rotate refresh token (refresh token rotation — required by OAuth 2.1)
    refreshTokens.delete(refresh_token);
    const newAccessToken = crypto.randomBytes(32).toString("hex");
    const newRefreshToken = crypto.randomBytes(32).toString("hex");

    accessTokens.set(newAccessToken, { ...tokenData, expiresAt: Date.now() + 3600_000 });
    refreshTokens.set(newRefreshToken, tokenData);

    return res.json({
      access_token: newAccessToken,
      token_type: "Bearer",
      expires_in: 3600,
      refresh_token: newRefreshToken,
    });
  }

  res.status(400).json({ error: "unsupported_grant_type" });
});

// ─── 4. Token validation middleware ──────────────────────────────────────────
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized", error_description: "Bearer token required" });
  }

  const token = authHeader.slice(7);
  const tokenData = accessTokens.get(token);

  if (!tokenData || tokenData.expiresAt < Date.now()) {
    return res.status(401).json({ error: "invalid_token", error_description: "Token expired or invalid" });
  }

  // Attach user context to request
  (req as any).userId = tokenData.userId;
  (req as any).scopes = tokenData.scopes;
  next();
}

// ─── 5. MCP endpoint — protected by OAuth ────────────────────────────────────
app.post("/mcp", requireAuth, async (req, res) => {
  const { HttpServerTransport } = await import("@modelcontextprotocol/sdk/server/http.js");
  const transport = new HttpServerTransport(req, res);
  await mcpServer.connect(transport); // your McpServer instance
});

app.listen(3000, () => console.error("MCP OAuth server running on :3000"));
```

### Configure Claude Code to use the OAuth MCP server

```json
{
  "mcpServers": {
    "my-oauth-server": {
      "type": "http",
      "url": "https://mcp.example.com/mcp"
    }
  }
}
```

When Claude Code first connects to this server, it will:
1. Discover the OAuth metadata from `/.well-known/oauth-authorization-server`
2. Open a browser window for the user to authenticate
3. Exchange the authorization code for tokens (with PKCE)
4. Store the tokens securely and use them automatically on subsequent requests
5. Refresh the access token automatically when it expires

### Key OAuth 2.1 requirements for MCP compliance

| Requirement | Why | Implementation |
|-------------|-----|----------------|
| PKCE required | Prevents auth code interception | `code_challenge_method: "S256"` |
| Refresh token rotation | Prevents replay attacks | Delete old token on refresh |
| Short access token lifetime | Limits exposure window | 1 hour maximum recommended |
| HTTPS only | Prevents token interception | Never deploy MCP over HTTP |
| No implicit grant | Removed in OAuth 2.1 | Only `authorization_code` grant |
| Metadata endpoint | Client discovery | `/.well-known/oauth-authorization-server` |

---

## 15. Debugging MCP Connections

When an MCP server isn't working as expected, follow this systematic debugging approach.

### Step 1: Check connection status

```
/mcp
```

This shows:
- Server name and status (`connected`, `error`, `starting`, `disconnected`)
- Number of tools, resources, and prompts exposed
- Last error message (if any)
- Token budget usage

### Step 2: Enable MCP debug logging

```bash
CLAUDE_MCP_DEBUG=1 claude
```

With debug mode on, every JSON-RPC message (both sent and received) is logged to the terminal. You'll see the exact initialize handshake, tool list response, and tool call/response pairs.

### Step 3: Test the server independently

**For stdio servers:**

```bash
# Full protocol test — initialize, list tools, call a tool
(
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1.1","capabilities":{},"clientInfo":{"name":"test-client","version":"1.0.0"}}}'
  echo '{"jsonrpc":"2.0","id":2,"method":"initialized","params":{}}'
  echo '{"jsonrpc":"2.0","id":3,"method":"tools/list","params":{}}'
  echo '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"YOUR_TOOL_NAME","arguments":{"param":"value"}}}'
) | node /path/to/your-server.js 2>/dev/null
# The 2>/dev/null suppresses stderr so you only see the JSON-RPC responses
```

**For HTTP servers:**

```bash
# Test with curl — initialize
curl -s -X POST https://mcp.example.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1.1","capabilities":{},"clientInfo":{"name":"curl-test","version":"1.0"}}}' \
  | jq .

# List tools
curl -s -X POST https://mcp.example.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  | jq '.result.tools[].name'

# Call a specific tool
curl -s -X POST https://mcp.example.com/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"my_tool","arguments":{"input":"test"}}}' \
  | jq .
```

### Common error codes and their fixes

| Error / Symptom | Root Cause | Fix |
|----------------|-----------|-----|
| Server fails to appear in `/mcp` | Command not found (`ENOENT`) | Use absolute path for `command`; verify `node`/`python` is in PATH |
| `JSON parse error` on connect | Non-JSON stdout on startup | Redirect all `console.log`/`print` to stderr; use `CreateEmptyApplicationBuilder` in .NET |
| Tool not appearing after connect | Invalid JSON Schema | Check `inputSchema` is valid; use `jsonschema.net` to validate; ensure `required` array matches property names |
| `401 Unauthorized` on HTTP server | Wrong or missing token | Check `${ENV_VAR}` is set in your shell; print `echo $MCP_TOKEN` to verify |
| `initialize` handshake timeout | Server crashes during startup | Run server manually and check stderr output for errors |
| Tools appear but calls fail | Handler throws uncaught exception | Add try/catch in handler; check server stderr during tool call |
| `Token budget exceeded` | Too many large tool schemas | Remove unused tools; shorten descriptions; split into multiple servers |
| Server disconnects mid-session | Process crash / OOM | Check server memory usage; add error handling for edge cases |
| `tools/list` returns empty array | Wrong handler registration | Verify you're using `server.tool()` or `setRequestHandler(ListToolsRequestSchema, ...)` |
| `"result":{"content":[]}` | Handler returns nothing | Ensure handler returns `{ content: [{ type: "text", text: "..." }] }` |
| Slow tool calls | External API latency | Add caching; implement timeouts; use connection pooling |

### Debugging checklist

```
MCP DEBUGGING CHECKLIST
══════════════════════════════════════════════════════════════════

CONNECTION FAILURES
[ ] Server process starts without errors: node server.js (check stderr)
[ ] No non-JSON output on stdout: node server.js | head -1 (should be valid JSON)
[ ] All environment variables set: printenv | grep -E "API_KEY|TOKEN|URL"
[ ] For HTTP: server is reachable: curl -I https://mcp.example.com/mcp
[ ] For HTTP: auth works: curl -H "Authorization: Bearer $TOKEN" ...

TOOL ISSUES
[ ] Tool appears in /mcp tool list
[ ] Tool inputSchema is valid JSON Schema (validate at jsonschema.net)
[ ] All required fields are in the "required" array
[ ] Enum values match exactly (case-sensitive)
[ ] Default values don't violate type constraints

RESPONSE ISSUES
[ ] Handler always returns { content: [...] } — never undefined or null
[ ] Error responses use throw new Error("...") — SDK converts to MCP error
[ ] Large responses are truncated appropriately (< 100KB recommended)
[ ] Binary data is base64-encoded, not raw bytes

PERFORMANCE
[ ] /mcp status shows < 20,000 tokens total
[ ] Tool descriptions are concise (< 200 tokens each)
[ ] Resources are paginated for large datasets
[ ] Database connections use connection pooling (not one connection per call)
```

---

## Related Guides

- [CLI Technical Reference](./claude-code-reference) — Section 9: MCP (full spec)
- [Hooks System](./hooks-deep-dive) — `mcp_tool` hook handler
- [Permissions & Security](./permissions-security) — MCP tool permissions
- [Agent Teams Guide](./agent-teams-guide) — agents using MCP tools
