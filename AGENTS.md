# AGENTS.md

Instructions for coding agents working in this repo.

Advocu MCP is a stateless Cloudflare Worker. It exposes three MCP tools for the Advocu GDE Personal API. It forwards the caller's portal token and returns Advocu's JSON. It does not own activities, users, or credentials.

Created by [Sanju Sivalingam](https://sanju.sh), founder of [THISUX](https://thisux.com). Copyright © 2026 Sanju Sivalingam. Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).

## Read before changing behavior

Follow [docs/README.md](docs/README.md). If two docs disagree:

1. [docs/API.md](docs/API.md) for Advocu fields and routes.
2. [docs/TOOLS.md](docs/TOOLS.md) for the MCP contract.
3. [docs/PRD.md](docs/PRD.md) for product behavior.
4. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for process and file layout.

Do not invent a field, route, enum, or error shape that is not in `docs/API.md`. The saved settings page is not a public OpenAPI spec.

## Hard rules

- Tools are only `list_activities`, `create_activity_draft`, and `update_activity`.
- Drafts are never submitted. Do not add a submit, archive, or delete path.
- Read the token from `Authorization: Bearer <token>` on that request. Forward that exact token to `https://api.advocu.com/personal-api/v1/gde`.
- Do not store the token. No KV, D1, Durable Objects, logs, analytics, Worker secrets, or tool arguments.
- Do not log request or response bodies. Activity text can be private. Headers can hold the token.
- Do not retry Advocu calls. Return HTTP 429 as a rate limit. Do not hide it.
- `github-repository` and `youtube-video` can be listed. They cannot be created or updated.
- Do not set `private` unless the user asked for private or public.
- Do not invent metrics, attendee counts, countries, cities, or links. Omit fields the user did not give.
- `GET /health` and `GET /` must not echo headers.

Product token rules: [docs/SECURITY.md](docs/SECURITY.md). Vulnerability reports: [SECURITY.md](SECURITY.md), email hi@sanju.sh, subject `[security] advocu-mcp`. Do not open a public issue for those.

## Layout

```
src/index.ts     Hono app, /mcp, /health, /
src/advocu.ts    fetch wrapper, bearer forward, base URL
src/tools.ts     the three tools
src/validate.ts  draft types, allowed fields, enums
test/acceptance.test.ts
wrangler.jsonc   Worker name advocu-mcp, route advocu.sanju.sh
docs/            product and API specs
```

One fresh MCP server per HTTP request. `export default app` is the Worker. Do not introduce `McpAgent` or any store that survives a request.

## Commands

```bash
bun install
bun run test
bun run typecheck
bun run dev       # wrangler dev
bun run deploy    # wrangler deploy — only if the user asked
```

Run `bun run test` and `bun run typecheck` before finishing a code change. If a tool name, input, or output changes, update `docs/TOOLS.md` and `test/acceptance.test.ts` in the same change.

## Do not

- Commit tokens, `.dev.vars`, or private activity text. The test fixture token is fake. Leave it fake.
- Deploy unless the user asked. Deploy publishes the Worker on `advocu.sanju.sh`.
- Change GitHub visibility, license, or copyright unless the user asked.
- Add dependencies for work the Advocu API already does.
