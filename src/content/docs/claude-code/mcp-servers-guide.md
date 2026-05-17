---
title: MCP Servers — Architecture, Configuration & Development
description: >
  Complete guide to the Model Context Protocol (MCP) in Claude Code — architecture,
  transport types, primitives, configuration scopes, building custom servers, security,
  official and community servers, .NET integration, and production deployment patterns.
  Covers MCP spec and Claude Code v2.1.126 (May 2026).
sidebar:
  order: 6
  label: MCP Servers
lastUpdated: 2026-05-17
---

# MCP Servers — Architecture, Configuration & Development

> **Version:** MCP Spec 1.1 · Claude Code v2.1.126 (May 17, 2026)

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

## Related Guides

- [CLI Technical Reference](./claude-code-reference) — Section 9: MCP (full spec)
- [Hooks System](./hooks-deep-dive) — `mcp_tool` hook handler
- [Permissions & Security](./permissions-security) — MCP tool permissions
- [Agent Teams Guide](./agent-teams-guide) — agents using MCP tools
