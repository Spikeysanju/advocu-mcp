# Advocu MCP

Remote MCP server on Cloudflare Workers for the Advocu GDE Personal API. Three tools: `list_activities`, `create_activity_draft`, `update_activity`. Drafts are never submitted. The caller's portal token is forwarded per request and never stored.

Deployed: `https://advocu-mcp.spikeysanju.workers.dev/mcp`

## Client config

```json
{
  "mcpServers": {
    "advocu": {
      "url": "https://advocu-mcp.spikeysanju.workers.dev/mcp",
      "headers": { "Authorization": "Bearer <advocu-personal-api-token>" }
    }
  }
}
```

Generate the token in the Advocu portal settings page.

## Develop

```bash
bun install
bun run test
bun run typecheck
bun run dev      # wrangler dev
bun run deploy   # wrangler deploy
```

Specs live in [docs/](./docs/README.md).
