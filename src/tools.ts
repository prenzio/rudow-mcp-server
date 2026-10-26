// Tool definitions for the Rudow MCP server.
//
// These are the exact names, descriptions and input schemas the hosted server
// at https://mcp.rudow.ai/mcp exposes. They live here so any MCP client (or
// directory) can list Rudow's tools without an API key. Calls themselves are
// forwarded to the hosted server — see index.ts. Keep in sync with the hosted
// server using `npm run check-tools`.
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const TOOLS: Tool[] = [
  {
    "name": "list_projects",
    "description": "List the projects you have access to. Call this first to get a project_id to pass to the other tools.",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "list_sdks",
    "description": "Get setup info for Rudow's client SDKs (Node.js backend, Python backend) — package name, install command, a minimal config/usage snippet, and how to obtain a project ingest API key. Use this to help a user add logging to their own codebase: install the right package for their stack and write the snippet into their code yourself — this tool only returns information, it does not install anything or touch the user's files. It never creates or reveals an ingest API key; the user must generate one manually from the dashboard (see key_instructions in the result) and paste it in themselves.",
    "inputSchema": {
      "type": "object",
      "properties": {}
    }
  },
  {
    "name": "list_incidents",
    "description": "List incidents Rudow detected for this project (newest first). Use to answer what's broken now or recently.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "status": {
          "type": "string",
          "enum": [
            "open",
            "resolved"
          ]
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "project_id"
      ]
    }
  },
  {
    "name": "get_incident",
    "description": "Full detail of one incident: why it fired (signals with observed vs usual), top error groups, timeline.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "incident_id": {
          "type": "string"
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "incident_id",
        "project_id"
      ]
    }
  },
  {
    "name": "query_logs",
    "description": "Fetch matching log entries for this project, newest first. Use to inspect specific errors or recent activity. Call this when you need the actual log lines.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "level": {
          "type": "string",
          "enum": [
            "debug",
            "info",
            "warn",
            "error",
            "fatal"
          ],
          "description": "Filter by severity level."
        },
        "source": {
          "type": "string",
          "description": "Filter by source, e.g. 'backend' or 'browser'."
        },
        "text": {
          "type": "string",
          "description": "Case-insensitive substring match on the message."
        },
        "minutes": {
          "type": "integer",
          "maximum": 43200,
          "description": "Only entries from the last N minutes."
        },
        "before_iso": {
          "type": "string",
          "description": "Only entries before this ISO timestamp (cursor pagination)."
        },
        "limit": {
          "type": "integer",
          "description": "Max rows to return (default 50, max 200)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "project_id"
      ]
    }
  },
  {
    "name": "query_logs_batched",
    "description": "Fetch a time-bucketed sample over a larger window. Useful when logs are high-volume: returns a balanced slice across time buckets instead of only the very latest lines.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "text": {
          "type": "string",
          "description": "Optional substring filter across message and attributes."
        },
        "minutes": {
          "type": "integer",
          "maximum": 43200,
          "description": "Window size in minutes (default 60)."
        },
        "bucket_minutes": {
          "type": "integer",
          "description": "Bucket width in minutes (default 5)."
        },
        "per_bucket": {
          "type": "integer",
          "description": "Max rows per bucket (default 20)."
        },
        "limit": {
          "type": "integer",
          "description": "Total max rows returned (default 400)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "project_id"
      ]
    }
  },
  {
    "name": "aggregate_logs",
    "description": "Count log entries grouped by a dimension over a recent window. Call this to spot trends, e.g. error rate or status-code distribution.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "group_by": {
          "type": "string",
          "enum": [
            "level",
            "source",
            "status",
            "route"
          ],
          "description": "Dimension to group counts by."
        },
        "minutes": {
          "type": "integer",
          "maximum": 43200,
          "description": "Window size in minutes (default 60)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "project_id"
      ]
    }
  },
  {
    "name": "metrics_summary",
    "description": "Computed health overview from telemetry: request volume, error rate (4xx/5xx), average and p95 latency, the top routes by traffic and errors, and the latest process metrics (memory, event-loop lag, uptime). Call this to answer how the app is performing or whether it is healthy.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "minutes": {
          "type": "integer",
          "maximum": 43200,
          "description": "Window size in minutes (default 60)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "project_id"
      ]
    }
  },
  {
    "name": "metrics_overview",
    "description": "Overview section of metrics: total requests, error count & rate, average/p95 latency, and top error routes. Use this for a quick health snapshot focused on request volume and performance.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "minutes": {
          "type": "integer",
          "maximum": 43200,
          "description": "Window size in minutes (default 60)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "project_id"
      ]
    }
  },
  {
    "name": "metrics_trends",
    "description": "Trends section: request volume, error rate, and latency over time in bucketed intervals. Call this to understand how performance has changed and spot degradation or recovery patterns.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "minutes": {
          "type": "integer",
          "maximum": 43200,
          "description": "Window size in minutes (default 60)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "project_id"
      ]
    }
  },
  {
    "name": "metrics_distributions",
    "description": "Response time distribution: histogram showing the spread of latencies (p50, p75, p90, p95, p99). Use this to understand if latency is consistent or if there are outliers and slow queries.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "minutes": {
          "type": "integer",
          "maximum": 43200,
          "description": "Window size in minutes (default 60)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "project_id"
      ]
    }
  },
  {
    "name": "metrics_routes",
    "description": "Top routes by request volume and error count. Shows which endpoints are getting the most traffic and which are failing most often. Use this to identify hot spots and problem areas.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "minutes": {
          "type": "integer",
          "maximum": 43200,
          "description": "Window size in minutes (default 60)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "project_id"
      ]
    }
  },
  {
    "name": "metrics_levels",
    "description": "Distribution of log levels: count and percentage of debug, info, warn, error, and fatal entries. Use this to understand the severity profile of logs and if error rates are elevated.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "minutes": {
          "type": "integer",
          "maximum": 43200,
          "description": "Window size in minutes (default 60)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "project_id"
      ]
    }
  },
  {
    "name": "route_drilldown",
    "description": "Deep dive into a specific route: request count, error rate, average and p95 latency, errors by status code. Call this after seeing a problematic route in metrics_routes to get details.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "route": {
          "type": "string",
          "description": "The route path to drill down into, e.g. '/api/v1/chat'."
        },
        "minutes": {
          "type": "integer",
          "maximum": 43200,
          "description": "Window size in minutes (default 60)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "route",
        "project_id"
      ]
    }
  },
  {
    "name": "failed_ingest_summary",
    "description": "Summary of failed ingest requests over a recent window: count of validation failures, most recent failure, and error details. Use this to troubleshoot SDK/client issues or payload format problems.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "minutes": {
          "type": "integer",
          "maximum": 43200,
          "description": "Window size in minutes (default 60)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "project_id"
      ]
    }
  },
  {
    "name": "semantic_search",
    "description": "Find log entries whose meaning is similar to a natural-language description, using vector similarity (not substring matching). Use this when the user describes a problem in their own words rather than citing exact log text — e.g. 'requests failing because the database was down'. Covers all logs once they have been embedded (a background job embeds new logs shortly after ingest).",
    "inputSchema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Natural-language description of what to find."
        },
        "limit": {
          "type": "integer",
          "description": "Max results to return (default 20, max 50)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "query",
        "project_id"
      ]
    }
  },
  {
    "name": "fetch_window",
    "description": "Fetch the log entries immediately before and after a timestamp, to see the context around a specific event.",
    "inputSchema": {
      "type": "object",
      "properties": {
        "around_iso": {
          "type": "string",
          "description": "ISO-8601 timestamp to center the window on."
        },
        "n": {
          "type": "integer",
          "description": "Entries on each side (default 10, max 50)."
        },
        "project_id": {
          "type": "string",
          "description": "The project to query. Call list_projects first to see which ids you can use."
        }
      },
      "required": [
        "around_iso",
        "project_id"
      ]
    }
  }
];
