# Rudow MCP Server

[Rudow](https://rudow.ai) watches your app's logs and tells you what's broken. This [Model Context Protocol](https://modelcontextprotocol.io) server lets your AI assistant — Claude, Cursor, Windsurf, VS Code and others — query your Rudow projects directly: logs, metrics, incidents and semantic search.

Ask things like:

- *"Why is checkout failing right now?"*
- *"What's our p95 latency on `/api/orders` over the last 24 hours?"*
- *"Show me the errors around 14:32 yesterday."*
- *"Are there any open incidents?"*

## Get an MCP key

1. Sign in to the [Rudow dashboard](https://app.rudow.ai).
2. Go to **Settings → Account → MCP keys** and click **Create MCP key**.
3. Pick which projects the key can reach, then copy the key (it starts with `alogmcp_` and is shown once).

## Connect

There are two ways to connect. Both use the same key and give the same tools.

### Option 1: hosted server (recommended)

If your client supports remote MCP servers, point it at:

- **URL:** `https://mcp.rudow.ai/mcp` (Streamable HTTP)
- **Header:** `Authorization: Bearer <your MCP key>`

**Claude Code**

```sh
claude mcp add --transport http rudow https://mcp.rudow.ai/mcp \
  --header "Authorization: Bearer alogmcp_..."
```

**Cursor** (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "rudow": {
      "url": "https://mcp.rudow.ai/mcp",
      "headers": { "Authorization": "Bearer alogmcp_..." }
    }
  }
}
```

### Option 2: local package (stdio)

For clients that only run local servers, use this package. It runs on your machine and forwards each tool call to the hosted server.

**Claude Desktop** (`claude_desktop_config.json`), **Cursor**, **Windsurf** and most other clients:

```json
{
  "mcpServers": {
    "rudow": {
      "command": "npx",
      "args": ["-y", "rudow-mcp-server"],
      "env": { "RUDOW_MCP_KEY": "alogmcp_..." }
    }
  }
}
```

**Claude Code**

```sh
claude mcp add rudow --env RUDOW_MCP_KEY=alogmcp_... -- npx -y rudow-mcp-server
```

**Docker**

```sh
docker build -t rudow-mcp-server .
docker run -i --rm -e RUDOW_MCP_KEY=alogmcp_... rudow-mcp-server
```

## Tools

Start with `list_projects`. Every other data tool takes the `project_id` it returns.

| Tool | What it does |
|---|---|
| `list_projects` | Lists the projects your key can access. |
| `list_sdks` | Setup info for Rudow's SDKs, so your assistant can add logging to your codebase. |
| `list_incidents` | Incidents Rudow detected, newest first. |
| `get_incident` | Why an incident fired, top error groups and timeline. |
| `query_logs` | Log entries filtered by level, source, text and time. |
| `query_logs_batched` | A time-balanced sample over a large window. |
| `aggregate_logs` | Counts grouped by level, source, status or route. |
| `semantic_search` | Finds logs by meaning, from a plain-English description. |
| `fetch_window` | The log lines just before and after a timestamp. |
| `metrics_summary` | Health overview: volume, error rate, latency, top routes and process metrics. |
| `metrics_overview` | Requests, error rate, latency and top error routes. |
| `metrics_trends` | Volume, error rate and latency over time. |
| `metrics_distributions` | Latency percentiles (p50–p99). |
| `metrics_routes` | Busiest and most-failing routes. |
| `metrics_levels` | Breakdown of log levels. |
| `route_drilldown` | Deep dive into one route. |
| `failed_ingest_summary` | Rejected ingest requests, for SDK and payload issues. |

Full input schemas are in [`src/tools.ts`](src/tools.ts).

All tools are **read-only**. Your key only reaches the projects you chose when you created it, and you can revoke it from the dashboard at any time.

## Configuration

| Variable | Required | Default |
|---|---|---|
| `RUDOW_MCP_KEY` | yes | — |
| `RUDOW_MCP_URL` | no | `https://mcp.rudow.ai/mcp` |

## Development

```sh
npm install
npm test                                  # build and run tests
RUDOW_MCP_KEY=alogmcp_... npm run check-tools   # compare src/tools.ts with the hosted server
```

## License

[MIT](LICENSE)
