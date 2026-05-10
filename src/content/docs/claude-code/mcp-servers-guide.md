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
lastUpdated: 2026-05-09
---

# MCP Servers — Architecture, Configuration & Development

> **Version:** MCP Spec 1.1 · Claude Code v2.1.126 (May 6, 2026)

The **Model Context Protocol (MCP)** is an open standard that allows AI systems like Claude Code to connect to external data sources, tools, and services. MCP servers extend Claude Code's capabilities beyond what its built-in tools provide — connecting it to databases, APIs, file systems, cloud services, development tools, and any custom backend.

**MCP is now supported by:** Claude Code, Claude Desktop, Cursor, Windsurf, VS Code (Copilot), GitHub Copilot, Gemini CLI, ChatGPT (beta), and dozens of other AI tools.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────┐
│         Claude Code (Host)          │
│  ┌───────────────────────────────┐  │
│  │       MCP Client              │  │
│  │  (built into Claude Code)     │  │
│  └───────────┬───────────────┘  │
└─────────────┕───────────────────────┘
              │ JSON-RPC 2.0
              │ (stdio / HTTP / SSE)
              ▼
┌─────────────────────────────────────┐
│         MCP Server                  │
│  ┌──────────┐ ┌────────┐ ┌───────┐ │
│  │  Tools   │ │Resources│ │Prompts│ │
│  └──────────┘ └────────┘ └───────┘ │
│                                     │
│   Connects to: DB / API / FS / etc  │
└─────────────────────────────────────┘
```

**Model:** Host → Client → Server

- **Host**: Claude Code (the AI application)
- **Client**: Built into Claude Code; manages one connection per server
- **Server**: Your process that implements the MCP spec

**Protocol:** JSON-RPC 2.0 — every message is a structured JSON object with `method`, `params`, `id`.

---

## 2. Transport Types

MCP supports three transports (SSE is deprecated; use HTTP streaming):

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

### 6.1 TypeScript / Node.js

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
  name: 'my-server',
  version: '1.0.0',
});

// Define a tool
server.tool(
  'get_weather',
  'Get current weather for a city',
  {
    city: z.string().describe('City name, e.g. "London"'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
  },
  async ({ city, units }) => {
    // Your implementation here
    const weather = await fetchWeather(city, units);
    return {
      content: [{ type: 'text', text: JSON.stringify(weather) }],
    };
  }
);

// Define a resource
server.resource(
  'config://app-settings',
  'Application Settings',
  async (uri) => ({
    contents: [{
      uri: uri.href,
      mimeType: 'application/json',
      text: JSON.stringify({ theme: 'dark', language: 'en' }),
    }],
  })
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 6.2 Python

```bash
pip install mcp
```

```python
# server.py
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import mcp.types as types

server = Server("my-python-server")

@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="run_query",
            description="Run a SQL SELECT query on the analytics database",
            inputSchema={
                "type": "object",
                "properties": {
                    "sql": {"type": "string", "description": "SQL SELECT statement"},
                    "limit": {"type": "integer", "default": 100}
                },
                "required": ["sql"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "run_query":
        result = await execute_query(arguments["sql"], arguments.get("limit", 100))
        return [TextContent(type="text", text=str(result))]
    raise ValueError(f"Unknown tool: {name}")

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(read_stream, write_stream, server.create_initialization_options())

if __name__ == "__main__":
    import asyncio
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

## 9. Advanced Patterns

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

app.listen(3000, () => console.log('MCP server listening on :3000'));
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

## 10. Debugging MCP Servers

### Enable MCP debug logging

```bash
CLAUDE_MCP_DEBUG=1 claude
```

### Check server connection

```
/mcp
```

Shows: server name, status (connected/error), tool count, resource count, last error.

### Test a server manually

```bash
# For stdio servers: pipe JSON-RPC directly
echo '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}' \
  | node my-server/index.js
```

### Common MCP problems

| Problem | Likely cause | Fix |
|---------|-------------|-----|
| Server fails to start | Node/Python version mismatch | Check runtime version requirements |
| `ENOENT` error | Command not found | Use full path or check npm global bin |
| `JSON parse error` | Non-JSON output on stdio | Use `CreateEmptyApplicationBuilder` (.NET), suppress logs |
| Tool not appearing in `/mcp` | Schema validation failed | Check inputSchema is valid JSON Schema |
| Token budget exceeded | Too many tools defined | Remove unused tools, split into multiple servers |
| `401 Unauthorized` | Wrong token | Check `${ENV_VAR}` expansion, set variable in shell |

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
