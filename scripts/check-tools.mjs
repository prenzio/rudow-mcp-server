// Compares the tool definitions in src/tools.ts with what the hosted server
// actually exposes. Run before each release:
//   RUDOW_MCP_KEY=alogmcp_... npm run check-tools
import { isDeepStrictEqual } from "node:util";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { TOOLS } from "../dist/tools.js";

const key = process.env.RUDOW_MCP_KEY;
if (!key) {
  console.error("Set RUDOW_MCP_KEY to compare against the hosted server.");
  process.exit(2);
}

const url = process.env.RUDOW_MCP_URL ?? "https://mcp.rudow.ai/mcp";
const client = new Client({ name: "rudow-check-tools", version: "0.0.0" });
await client.connect(
  new StreamableHTTPClientTransport(new URL(url), {
    requestInit: { headers: { Authorization: `Bearer ${key}` } },
  }),
);
const { tools: remote } = await client.listTools();
await client.close();

const pick = ({ name, description, inputSchema }) => ({ name, description, inputSchema });
const local = new Map(TOOLS.map((t) => [t.name, pick(t)]));
const hosted = new Map(remote.map((t) => [t.name, pick(t)]));
const problems = [];

for (const name of hosted.keys()) if (!local.has(name)) problems.push(`missing locally: ${name}`);
for (const name of local.keys()) if (!hosted.has(name)) problems.push(`not on hosted server: ${name}`);
for (const [name, tool] of local) {
  if (hosted.has(name) && !isDeepStrictEqual(tool, hosted.get(name))) problems.push(`definition differs: ${name}`);
}

if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`OK — ${local.size} tools match ${url}`);
