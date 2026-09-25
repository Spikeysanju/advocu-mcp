# Advocu MCP docs

Read in this order. Do not start coding from memory.

| Order | Doc | Use it for |
| --- | --- | --- |
| 1 | [VISION.md](./VISION.md) | Why this exists. Vision, mission, principles. |
| 2 | [PRD.md](./PRD.md) | What to build. Requirements, journeys, non-goals. |
| 3 | [TOOLS.md](./TOOLS.md) | The MCP contract. Tool names, inputs, outputs, validation. |
| 4 | [SECURITY.md](./SECURITY.md) | Token handling. What must never be stored or logged. |
| 5 | [API.md](./API.md) | Advocu Personal API, extracted from the saved settings page. |
| 6 | [ARCHITECTURE.md](./ARCHITECTURE.md) | Worker shape. Hono, stateless MCP, file layout. |
| 7 | [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Build order. |
| 8 | [ACCEPTANCE.md](./ACCEPTANCE.md) | Done when these checks pass. |

Source of truth if two docs disagree:

1. `API.md` for Advocu fields and routes.
2. `TOOLS.md` for what the MCP exposes.
3. `PRD.md` for product behavior.
4. `ARCHITECTURE.md` for process and file layout.

The saved settings page is not a public OpenAPI spec. If a field is not in `API.md`, do not invent it.
