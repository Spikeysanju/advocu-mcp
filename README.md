# Advocu MCP

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Copyright](https://img.shields.io/badge/©-Sanju%20Sivalingam-111111.svg)](LICENSE)

Remote MCP server on Cloudflare Workers for the Advocu GDE Personal API. Three tools: `list_activities`, `create_activity_draft`, `update_activity`. Drafts are never submitted. The caller's portal token is forwarded per request and never stored.

Created by [Sanju Sivalingam](https://sanju.sh), founder of [THISUX](https://thisux.com).

> [!TIP]
> **We contribute a lot. Then we forget to write it down.**
>
> You spend the weekend traveling state to state. You give the talk. You inspire people, teach them something, and share what you learned. By Monday that work is already gone, because it never made it into the portal. A contribution that is not logged may as well not have happened.
>
> That was my problem. I am excited for the event, the community, the chance to show up. Sitting down afterward to fill every field is a different job. It is slow, and it is boring. I do not have the patience for it. If that is you too, this is the fix.
>
> This MCP is already deployed. Get a personal API token from the [Advocu portal](https://app.advocu.com/settings/integrations/personal-api) and ask your agent to connect this server with that token. Then hand it the photos, the links, or the slides. It pulls out what it can, asks what it still needs, and creates a draft. You read it and submit it in the portal. The weekend stays about the people. The form does not get another evening.

## Tools

Auth is the request header `Authorization: Bearer <token>`. It is not a tool argument. Field rules are in [docs/TOOLS.md](docs/TOOLS.md).

| Tool | What it does | Inputs |
| --- | --- | --- |
| `list_activities` | Lists the caller's GDE activities, oldest submission first. Short summary per row: id, type, title, dates. Call this before an update. | `from`, `to`, `updatedAfter` (ISO-8601), `page` (default 0), `size` (1–100, default 10), `verbose` |
| `create_activity_draft` | Creates a draft. It is not submitted. The caller reviews and submits it in the Advocu portal. | `type`, `fields` |
| `update_activity` | Patches an existing activity. Copy `activityId` and `type` from `list_activities`. Send only fields that change. | `activityId`, `type`, `fields` |

Draft types for create and update: `content-creation`, `interaction-with-googlers`, `mentoring`, `product-feedback-given`, `public-speaking`, `stories`, `workshop`. `github-repository` and `youtube-video` can be listed. They cannot be created or updated.

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

Copyright © 2026 [Sanju Sivalingam](https://sanju.sh).

Released under the [Apache License, Version 2.0](LICENSE). You may use, modify, and distribute this project for personal and commercial purposes, provided you keep the copyright, patent, and attribution notices. See [NOTICE](NOTICE).
