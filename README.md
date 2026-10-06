# aha-mcp

> [!IMPORTANT]
> This repository is replaced by the hosted [Aha! remote MCP server](https://support.aha.io/aha-develop/integrations/mcp-server/remote-mcp-server~7611250482619899159) instead.
>
> The remote MCP server connects directly from your AI tool to `https://[your-aha-domain].aha.io/api/v1/mcp`, uses your Aha! permissions, and has broader capabilities, including creating and editing records. 

Model Context Protocol (MCP) server for accessing Aha! records through the MCP. This integration enables seamless interaction with Aha! features, requirements, and pages directly through the Model Context Protocol.

## Prerequisites

- Node.js v20 or higher
- npm (usually comes with Node.js)
- An Aha! account with API access

## Installation

### Using npx

```bash
npx -y aha-mcp@latest
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/aha-develop/aha-mcp.git
cd aha-mcp

# Install dependencies
npm install

# Run the server
npm run mcp-start
```

## Authentication Setup

1. Log in to your Aha! account at `<yourcompany>.aha.io`
2. Visit [secure.aha.io/settings/api_keys](https://secure.aha.io/settings/api_keys)
3. Click "Create new API key"
4. Copy the token immediately (it won't be shown again)

For more details about authentication and API usage, see the [Aha! API documentation](https://www.aha.io/api).

## Environment Variables

This MCP server requires the following environment variables:

- `AHA_API_TOKEN`: Your Aha! API token
- `AHA_DOMAIN`: Your Aha! domain (e.g., yourcompany if you access aha at yourcompany.aha.io)

## IDE Integration

For security reasons, we recommend using your preferred secure method for managing environment variables rather than storing API tokens directly in editor configurations. Each editor has different security models and capabilities for handling sensitive information.

Below are examples of how to configure various editors to use the aha-mcp server. You should adapt these examples to use your preferred secure method for providing the required environment variables.

### VSCode

The instructions below were copied from the instructions [found here](https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server).

Add this to your `.vscode/settings.json`, using your preferred method to securely provide the environment variables:

```json
{
  "mcp": {
    "servers": {
      "aha-mcp": {
        "command": "npx",
        "args": ["-y", "aha-mcp"]
        // Environment variables should be provided through your preferred secure method
      }
    }
  }
}
```

### Cursor

1. Go to Cursor Settings > MCP
2. Click + Add new Global MCP Server
3. Add a configuration similar to:

```json
{
  "mcpServers": {
    "aha-mcp": {
      "command": "npx",
      "args": ["-y", "aha-mcp"]
      // Environment variables should be provided through your preferred secure method
    }
  }
}
```

### Cline

Add a configuration to your `cline_mcp_settings.json` via Cline MCP Server settings:

```json
{
  "mcpServers": {
    "aha-mcp": {
      "command": "npx",
      "args": ["-y", "aha-mcp"]
      // Environment variables should be provided through your preferred secure method
    }
  }
}
```

### RooCode

Open the MCP settings by either:

- Clicking "Edit MCP Settings" in RooCode settings, or
- Using the "RooCode: Open MCP Config" command in VS Code's command palette

Then add:

```json
{
  "mcpServers": {
    "aha-mcp": {
      "command": "npx",
      "args": ["-y", "aha-mcp"]
      // Environment variables should be provided through your preferred secure method
    }
  }
}
```

### Claude Desktop

Add a configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "aha-mcp": {
      "command": "npx",
      "args": ["-y", "aha-mcp"]
      // Environment variables should be provided through your preferred secure method
    }
  }
}
```

## Available MCP Tools

### 1. get_record

Retrieves an Aha! record (feature, requirement, epic, or initiative) by reference number, returning rich fields including workflow status, custom fields, and assigned user information.

**Parameters:**

- `reference` (required): Reference number of the record (e.g., "DEVELOP-123" for features, "DEVELOP-123-1" for requirements, "DEVELOP-E-1" for epics, "DEVELOP-S-1" for initiatives)

**Example:**

```json
{
  "reference": "DEVELOP-123"
}
```

**Response:**

```json
{
  "id": "DEVELOP-123",
  "name": "Feature name",
  "description": {
    "markdownBody": "Feature description with rich formatting"
  },
  "workflowStatus": {
    "id": "123456",
    "name": "In development",
    "color": 16711680
  },
  "customFieldValues": [
    {
      "id": "custom_1",
      "value": "Priority: High"
    }
  ],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-08-04T14:22:00Z",
  "assignedToUser": {
    "id": "user_123",
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "release": {
    "id": "release_1",
    "name": "Q4 2024",
    "referenceNum": "Q4"
  },
  "epic": {
    "id": "epic_1",
    "name": "Platform Modernization",
    "referenceNum": "DEVELOP-10"
  },
  "requirements": [
    {
      "id": "req_1",
      "name": "Database migration",
      "referenceNum": "DEVELOP-123-1"
    }
  ]
}
```

### 2. get_page

Gets an Aha! page by reference number.

**Parameters:**

- `reference` (required): Reference number of the page (e.g., "ABC-N-213")
- `includeParent` (optional): Include parent page information. Defaults to false.

**Example:**

```json
{
  "reference": "ABC-N-213",
  "includeParent": true
}
```

**Response:**

```json
{
  "reference_num": "ABC-N-213",
  "name": "Page title",
  "body": "Page content",
  "parent": {
    "reference_num": "ABC-N-200",
    "name": "Parent page"
  }
}
```

### 3. search_documents

Searches for Aha! documents.

**Parameters:**

- `query` (required): Search query string
- `searchableType` (optional): Type of document to search for (e.g., "Page"). Defaults to "Page"

**Example:**

```json
{
  "query": "product roadmap",
  "searchableType": "Page"
}
```

**Response:**

```json
{
  "results": [
    {
      "reference_num": "ABC-N-123",
      "name": "Product Roadmap 2025",
      "type": "Page",
      "url": "https://company.aha.io/pages/ABC-N-123"
    }
  ],
  "total_results": 1
}
```

### 4. get_custom_pivot

Runs a saved custom report (list report or pivot table) via `GET /api/v1/bookmarks/custom_pivots/:id` and returns its data. Any saved report works regardless of how it is configured; the token's user must be able to see it.

**Parameters:**

- `report` (required): Report ID, or the report URL (`https://<domain>.aha.io/bookmarks/custom_pivots/<id>/...`)
- `view` (optional): `list` (default) returns the underlying records, following all pages; `pivot` returns the aggregated pivot table
- `raw` (optional): Return the unmodified Aha! response, including HTML-rendered values. Defaults to `false`

**Response (list view, compact):**

```json
{
  "view": "list",
  "totalRecords": 2,
  "columns": [{ "title": "Product name", "table": "projects", "field": "name" }],
  "rows": [["Product A"], ["Product B"]],
  "truncated": false
}
```

**Response (pivot view, compact):** each cell carries its row and column header path.

```json
{
  "view": "pivot",
  "rowGrouping": ["Product name", "Quarter"],
  "columnGrouping": ["Status"],
  "cells": [{ "row": ["Product A", "2026-Q4"], "column": ["Done"], "field": "Estimate", "value": 40 }]
}
```

## Example Queries

- "Get feature DEVELOP-123"
- "Fetch the product roadmap page ABC-N-213"
- "Search for pages about launch planning"
- "Get requirement ADT-123-1"
- "Find all pages mentioning Q2 goals"

## Configuration Options

| Variable        | Description                                 | Default  |
| --------------- | ------------------------------------------- | -------- |
| `AHA_API_TOKEN` | Your Aha! API token                         | Required |
| `AHA_DOMAIN`    | Your Aha! domain (e.g., yourcompany.aha.io) | Required |
| `LOG_LEVEL`     | Logging level (debug, info, warn, error)    | info     |
| `PORT`          | Port for SSE transport                      | 3000     |
| `TRANSPORT`     | Transport type (stdio or sse)               | stdio    |

## Troubleshooting

<details>
<summary>Common Issues</summary>

1. Authentication errors:

   - Verify your API token is correct and properly set in your environment
   - Ensure the token has the necessary permissions in Aha!
   - Confirm you're using the correct Aha! domain

2. Server won't start:

   - Ensure all dependencies are installed
   - Check the Node.js version is v20 or higher
   - Verify the TypeScript compilation succeeds
   - Confirm environment variables are properly set and accessible

3. Connection issues:

   - Check your network connection
   - Verify your Aha! domain is accessible
   - Ensure your API token has not expired

4. API Request failures:

   - Check the reference numbers are correct
   - Verify the searchable type is valid
   - Ensure you have permissions to access the requested resources

5. Environment variable issues:
   - Make sure environment variables are properly set and accessible to the MCP server
   - Check that your secure storage method is correctly configured
   - Verify that the environment variables are being passed to the MCP server process
   </details>
