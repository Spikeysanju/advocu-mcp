# Implementation

Build only what [PRD.md](./PRD.md) and [TOOLS.md](./TOOLS.md) specify. Field limits come from [API.md](./API.md).

Verify the Hono MCP imports against the current serving doc before writing code. The package split has moved. As of the last check, the path was:

- `@modelcontextprotocol/hono` — `createMcpHonoApp`
- `@modelcontextprotocol/server` — `createMcpHandler`, `McpServer`
- `hono`
- `zod`

Do not use `McpAgent`. It is the old Durable Object path. This server is stateless.

## Files

```
src/index.tsx    Hono app, /mcp, /health, /, /setup
src/setup.tsx    /setup page (JSX)
src/advocu.ts    base URL, bearer forward, error mapping
src/tools.ts     three tools and server instructions
src/validate.ts  strip and check fields per type
wrangler.jsonc
package.json
tsconfig.json
```

No KV, D1, or Durable Object bindings.

## Order

1. Confirm the current `createMcpHonoApp` example still matches `export default app`.
2. Add `src/advocu.ts`.
   - Base URL constant: `https://api.advocu.com/personal-api/v1/gde`
   - `advocuFetch(token, path, init)` sets `Authorization` and `Content-Type: application/json`.
   - Map status codes to the error strings in [TOOLS.md](./TOOLS.md).
   - Truncate error bodies at 2000 characters.
3. Add `src/validate.ts`.
   - One allow-list per draft type.
   - Strip unknown keys, empty strings, illegal `country`, and illegal `inPersonAttendees`.
   - Reject bad enums, dates, URLs, and lengths with a tool error.
4. Add `src/tools.ts`.
   - Register `list_activities`, `create_activity_draft`, `update_activity`.
   - Register the server instructions from [TOOLS.md](./TOOLS.md).
   - Read the bearer token from the request. If it is missing, return the missing-token error and do not fetch.
5. Add `src/index.tsx`.
   - `GET /health` → `{ "ok": true, "name": "advocu" }`
   - `GET /` → one line of plain text pointing at `/mcp` and the portal.
   - `ALL /mcp` → MCP handler.
6. `wrangler.jsonc`: Worker name `advocu-mcp`, `compatibility_date` current, no bindings.
7. Run the local checks in [ACCEPTANCE.md](./ACCEPTANCE.md) that do not need a token.

## Advocu calls

| Tool | Request |
| --- | --- |
| `list_activities` | `GET /activities?from&to&updatedAfter&page&size` |
| `create_activity_draft` | `POST /activity-drafts/{type}` body = stripped fields |
| `update_activity` | `PATCH /activities/{activityId}` body = `{ "data": stripped fields }` |

Encode query params with `URLSearchParams`. Do not concatenate strings by hand.

## Response shaping

`list_activities` reads `content` as an array. If `content` is missing, return the raw JSON as an error-shaped tool result only when status is >= 400. On 200 with an unexpected shape, return the raw JSON and say the page shape was not the documented `content` array.

Do not assume `totalElements`, `last`, or `next`. They are not in the saved page.

## Do not build

- A submit tool.
- A token tool.
- A tag enum of 318 values.
- Retries.
- Body logging.
