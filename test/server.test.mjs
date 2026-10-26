import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const entry = fileURLToPath(new URL("../dist/index.js", import.meta.url));

async function connect(env = {}) {
  const { RUDOW_MCP_KEY: _drop, ...baseEnv } = process.env;
  const client = new Client({ name: "test", version: "0.0.0" });
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [entry], env: { ...baseEnv, ...env } }));
  return client;
}

test("lists all tools without an API key", async () => {
  const client = await connect();
  const { tools } = await client.listTools();
  assert.equal(tools.length, 17);
  assert.ok(tools.some((t) => t.name === "query_logs"));
  for (const tool of tools) {
    assert.ok(tool.description, `${tool.name} has a description`);
    assert.equal(tool.inputSchema.type, "object");
  }
  await client.close();
});

test("tool call without a key explains how to get one", async () => {
  const client = await connect();
  const result = await client.callTool({ name: "list_projects", arguments: {} });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /RUDOW_MCP_KEY is not set/);
  await client.close();
});

test("unknown tool is rejected locally", async () => {
  const client = await connect({ RUDOW_MCP_KEY: "unused" });
  const result = await client.callTool({ name: "drop_database", arguments: {} });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /Unknown tool/);
  await client.close();
});

test("invalid key surfaces a clear error from the hosted server", { skip: !!process.env.CI }, async () => {
  const client = await connect({ RUDOW_MCP_KEY: "alogmcp_invalid" });
  const result = await client.callTool({ name: "list_projects", arguments: {} });
  assert.equal(result.isError, true);
  assert.match(result.content[0].text, /rejected the MCP key/);
  await client.close();
});
