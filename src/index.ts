#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { GraphQLClient } from "graphql-request";
import { Handlers } from "./handlers.js";

const AHA_API_TOKEN = process.env.AHA_API_TOKEN;
const AHA_DOMAIN = process.env.AHA_DOMAIN;

if (!AHA_API_TOKEN) {
  throw new Error("AHA_API_TOKEN environment variable is required");
}

if (!AHA_DOMAIN) {
  throw new Error("AHA_DOMAIN environment variable is required");
}

const ahaApiToken: string = AHA_API_TOKEN;
const ahaDomain: string = AHA_DOMAIN;

const client = new GraphQLClient(
  `https://${ahaDomain}.aha.io/api/v2/graphql`,
  {
    headers: {
      Authorization: `Bearer ${ahaApiToken}`,
    },
  }
);

class AhaMcp {
  private server: Server;
  private handlers: Handlers;

  constructor() {
    this.server = new Server(
      {
        name: "aha-mcp",
        version: "1.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.handlers = new Handlers(
      client,
      `https://${ahaDomain}.aha.io/api/v1`,
      ahaApiToken
    );
    this.setupToolHandlers();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_record",
          description:
            "Get an Aha! feature, requirement, initiative, or epic by reference number",
          inputSchema: {
            type: "object",
            properties: {
              reference: {
                type: "string",
                description:
                  "Reference number (e.g., DEVELOP-123, ADT-123-1, ABC-S-123, or ABC-E-123)",
              },
            },
            required: ["reference"],
          },
        },
        {
          name: "get_page",
          description:
            "Get an Aha! page by reference number with optional relationships",
          inputSchema: {
            type: "object",
            properties: {
              reference: {
                type: "string",
                description: "Reference number (e.g., ABC-N-213)",
              },
              includeParent: {
                type: "boolean",
                description: "Include parent page in the response",
                default: false,
              },
            },
            required: ["reference"],
          },
        },
        {
          name: "search_documents",
          description: "Search for Aha! documents",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query string",
              },
              searchableType: {
                type: "string",
                description: "Type of document to search for (e.g., Page)",
                default: "Page",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_custom_pivot",
          description:
            "Run a saved Aha! custom report (list report or pivot table) and return its data. List view returns column titles plus rows of plain values (all pages). Pivot view returns aggregated cells, each with its row/column header path and field title.",
          inputSchema: {
            type: "object",
            properties: {
              report: {
                type: "string",
                description:
                  "Report ID (e.g. 7498703245593563916) or a URL like https://<domain>.aha.io/bookmarks/custom_pivots/7498703245593563916/...",
              },
              view: {
                type: "string",
                enum: ["list", "pivot"],
                description:
                  "list = underlying records as a table; pivot = aggregated pivot table as configured in Aha!",
                default: "list",
              },
              raw: {
                type: "boolean",
                description:
                  "Return the unmodified Aha! response (includes large HTML-rendered values)",
                default: false,
              },
            },
            required: ["report"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === "get_record") {
        return this.handlers.handleGetRecord(request);
      } else if (request.params.name === "get_page") {
        return this.handlers.handleGetPage(request);
      } else if (request.params.name === "search_documents") {
        return this.handlers.handleSearchDocuments(request);
      } else if (request.params.name === "get_custom_pivot") {
        return this.handlers.handleGetCustomPivot(request);
      }

      throw new McpError(
        ErrorCode.MethodNotFound,
        `Unknown tool: ${request.params.name}`
      );
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Aha! MCP server running on stdio");
  }
}

const server = new AhaMcp();
server.run().catch(console.error);
