#!/usr/bin/env node
// Rudow MCP server (stdio).
//
// A local bridge to Rudow's hosted MCP server. Tool definitions are declared
// in tools.ts and listed without contacting Rudow; every tool call is
// forwarded as-is to the hosted server, authenticated with your RUDOW_MCP_KEY.
// Nothing else leaves your machine.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

import { TOOLS } from "./tools.js";

export const VERSION = "0.1.0";
export const DEFAULT_URL = "https://mcp.rudow.ai/mcp";

const TOOL_NAMES = new Set(TOOLS.map((t) => t.name));

function errorResult(message: string): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify({ error: message }) }], isError: true };
}

let upstream: Promise<Client> | null = null;

function connectUpstream(key: string, url: string): Promise<Client> {
  const client = new Client({ name: "rudow-mcp-server", version: VERSION });
  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers: { Authorization: `Bearer ${key}` } },
  });
  return client.connect(transport).then(() => client);
}

async function forward(name: string, args: Record<string, unknown>): Promise<CallToolResult> {
  const key = process.env.RUDOW_MCP_KEY;
  if (!key) {
    return errorResult(
      "RUDOW_MCP_KEY is not set. Create an MCP key in the Rudow dashboard " +
        "(Settings → Account → MCP keys) and add it to this server's env config.",
    );
  }

  upstream ??= connectUpstream(key, process.env.RUDOW_MCP_URL ?? DEFAULT_URL);
  try {
    const client = await upstream;
    return (await client.callTool({ name, arguments: args })) as CallToolResult;
  } catch (err) {
    // Drop the failed connection so the next call retries from scratch.
    upstream = null;
    const message = err instanceof Error ? err.message : String(err);
    if ((err as { code?: unknown }).code === 401) {
      return errorResult("Rudow rejected the MCP key. Check RUDOW_MCP_KEY is a valid, unrevoked key.");
    }
    return errorResult(`Could not reach Rudow: ${message}`);
  }
}

export function createServer(): Server {
  const server = new Server({ name: "rudow", version: VERSION }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    if (!TOOL_NAMES.has(name)) {
      return errorResult(`Unknown tool: ${name}`);
    }
    return forward(name, args);
  });

  return server;
}

await createServer().connect(new StdioServerTransport());
