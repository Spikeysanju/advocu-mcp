# Architecture

Product decisions live in [PRD.md](./PRD.md). Tool shapes live in [TOOLS.md](./TOOLS.md). This file is only the technical shape.

Thin Cloudflare Worker. Hono in front. Stateless MCP. No database.

The Advocu API already does the work. This server only checks the caller's token, forwards JSON, and returns the Advocu response.

## Why this shape

- Official MCP + Hono path in 2026: `createMcpHonoApp` + `createMcpHandler` from `@modelcontextprotocol/hono` and `@modelcontextprotocol/server`. `export default app` is a Worker.
- `McpAgent` (Durable Object) is deprecated and not needed. Nothing here must survive between requests.
- One user token per request. Do not store tokens. Do not put one token in a Worker secret. That would lock the server to one person.

## Request path

1. MCP client calls `POST /mcp` (and the other MCP methods on the same path).
2. Client sends the Advocu portal token as `Authorization: Bearer <token>`.
3. Worker refuses the call if that header is missing.
4. Tool handler calls `https://api.advocu.com/personal-api/v1/gde` with the same bearer token and `Content-Type: application/json`.
5. Worker returns Advocu's JSON, including 429s. No retries.

`/gde` is the only program in the saved settings page. Keep it a constant.

## Tools

Three tools. Not one tool per field.

| Tool | Advocu call | Notes |
| --- | --- | --- |
| `list_activities` | `GET /activities` | `from`, `to`, `updatedAfter`, `page`, `size` |
| `create_activity_draft` | `POST /activity-drafts/{type}` | Creates a draft. Does not submit. Response is `{ id }` |
| `update_activity` | `PATCH /activities/{activityId}` | Body wrapped as `{ data }` |

`type` for drafts: `content-creation`, `interaction-with-googlers`, `mentoring`, `product-feedback-given`, `public-speaking`, `stories`, `workshop`.

No write tool for `github-repository` or `youtube-video`. Those only appear on the list response.

Field rules live in `docs/API.md`. The tool schema should enforce the small enums (content type, event format, significance type) and leave tags as a string array. Do not paste all 318 tags into the tool description.

## Rate limit

Advocu allows 30 requests per minute per IP, then HTTP 429.

A Worker calls Advocu from Cloudflare egress, not from the user's home IP. Everyone on this Worker shares that limit. Fine for one person. Tight if many people use the same deployment. Do not hide 429s. Do not retry.

## Out of scope

- Token generation. That stays in the Advocu portal.
- Submitting a draft. No such route in the saved page.
- OAuth provider. The Advocu token is the credential.
- Storing activities.

## Files to add when building

```
src/index.tsx       Hono app, /mcp, /health, /setup
src/setup.tsx       /setup page, client-side token snippets
src/advocu.ts       fetch wrapper, base URL, bearer forward
src/tools.ts        the three tools
wrangler.jsonc
package.json
tsconfig.json
```
