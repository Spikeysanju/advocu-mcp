# Advocu MCP

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Copyright](https://img.shields.io/badge/©-THISUX%20Private%20Limited-111111.svg)](LICENSE)

Remote MCP server on Cloudflare Workers for the Advocu GDE Personal API. Three tools: `list_activities`, `create_activity_draft`, `update_activity`. Drafts are never submitted. The caller's portal token is forwarded per request and never stored.

Created by [Sanju Sivalingam](https://sanju.sh), founder of [THISUX](https://thisux.com).

Deployed: `https://advocu.sanju.sh/mcp` (also `https://advocu-mcp.spikeysanju.workers.dev/mcp`)

## Client config

```json
{
  "mcpServers": {
    "advocu": {
      "url": "https://advocu.sanju.sh/mcp",
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

## Community

- [Contributing](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security](SECURITY.md)
- [Changelog](CHANGELOG.md)

## License

Copyright © 2026 [THISUX Private Limited](https://thisux.com).

Released under the [MIT License](LICENSE). You may use, modify, and distribute this project for personal and commercial purposes, provided the copyright and permission notice are retained.
