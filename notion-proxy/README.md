# Notion MCP Proxy Server

Local development server that wraps Notion MCP tool calls in HTTP endpoints for the AAE Dashboard.

## Architecture

```
AAE Dashboard (tRPC) → HTTP → Notion Proxy (this server) → Notion MCP Tools → Notion API
```

## Why This Exists

The AAE Dashboard backend runs in Cloudflare Workers (serverless environment) which cannot directly access MCP tools. This proxy server runs locally in the Claude Code session and provides HTTP endpoints that the dashboard can call during development.

For production, migrate to direct Notion API integration within Cloudflare Workers.

## Setup

```bash
cd notion-proxy
npm install  # or pnpm install
npm run dev
```

Server will start on `http://localhost:3001`

## Endpoints

### GET /acrrm/entries
Query ACRRM Resource Development Pipeline database from Notion.

**Response:**
```json
{
  "success": true,
  "entries": [
    {
      "id": "page-id",
      "content_title": "...",
      "analysis_status": "Analysis Complete",
      "assigned_agent": "Claude (Analysis)",
      ...
    }
  ],
  "total": 11
}
```

### PATCH /acrrm/entries/:id/status
Update Analysis Status for an ACRRM entry.

**Request:**
```json
{
  "status": "Approved for Output"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Entry updated to Approved for Output",
  "updatedAt": "2025-12-11T..."
}
```

### GET /health
Health check endpoint.

## Environment Variables

- `NOTION_PROXY_PORT` - Port to run on (default: 3001)
- `NOTION_DATABASE_ID` - ACRRM database ID (default: d431098f-103a-4d3e-9cb5-82143e42d75b)

## Integration with Dashboard

The AAE Dashboard tRPC router ([server/routers/acrrm.ts](../server/routers/acrrm.ts)) calls these endpoints:

```typescript
// Query entries
const entries = await trpc.acrrm.listEntries.useQuery();

// Update status
await trpc.acrrm.updateStatus.mutate({
  id: "page-id",
  status: "Approved for Output"
});
```

## Production Migration

For production deployment:
1. Use Notion's official REST API directly
2. Store Notion API token in Cloudflare Workers environment variables
3. Remove dependency on this proxy server
4. Update tRPC endpoints to call Notion API instead of localhost:3001

See: https://developers.notion.com/reference/intro
