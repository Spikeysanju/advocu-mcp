# Contributing

Thanks for helping with Advocu MCP. This is a remote MCP server on Cloudflare Workers for the Advocu GDE Personal API. Contributions are licensed under the same [MIT License](LICENSE), with copyright held by THISUX Private Limited.

By submitting a pull request, you agree that your contribution is provided under that license and copyright.

## Setup

Requirements: [Bun](https://bun.sh) and a Cloudflare account only if you deploy.

```bash
bun install
bun run test
bun run typecheck
bun run dev      # wrangler dev
```

`bun run deploy` publishes the Worker. Do not deploy from a fork unless you own the `advocu.sanju.sh` route.

Read [docs/README.md](docs/README.md) before changing behavior. If two docs disagree: `docs/API.md` wins for Advocu fields, `docs/TOOLS.md` for the MCP contract, `docs/PRD.md` for product behavior, `docs/ARCHITECTURE.md` for layout.

## Project rules

- The exposed tools are `list_activities`, `create_activity_draft`, and `update_activity`.
- Drafts are never submitted. Do not add a submit path.
- Read the Advocu token from `Authorization: Bearer <token>` and forward it on that request only.
- Do not store the token, log it, put it in a Worker secret, or accept it as a tool argument.
- Do not invent Advocu fields that are not in `docs/API.md`.
- Do not log request or response bodies.
- Keep the Worker stateless. No KV, D1, or Durable Object storage for caller data.

## Pull requests

1. Branch from `main`.
2. Keep the change focused.
3. If you change a tool name, input, or output, update `docs/TOOLS.md` and the tests in `test/acceptance.test.ts`.
4. Run `bun run test` and `bun run typecheck`.
5. Open a pull request using the template. Do not paste tokens or private activity text.

Questions about conduct go to [hello@thisux.com](mailto:hello@thisux.com). See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md). Security reports go to the same address with subject `[security] advocu-mcp`. See [SECURITY.md](SECURITY.md). Do not file those in public issues.
