import { createMcpHonoApp } from "@modelcontextprotocol/hono";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { bearerToken } from "./advocu";
import { SETUP_HEADERS, SetupPage } from "./setup";
import { buildServer } from "./tools";

// One fresh MCP server per HTTP request. The token is read from that request and never stored.
const mcp = createMcpHandler(({ requestInfo }) => buildServer(bearerToken(requestInfo?.headers.get("authorization"))));

// Public remote server: skip the localhost-only DNS-rebinding guard that the default host enables.
const app = createMcpHonoApp({ host: "0.0.0.0" });

app.get("/health", (c) => c.json({ ok: true, name: "advocu" }));

app.get("/", (c) =>
  c.text(
    "Advocu MCP. Connect your MCP client to /mcp with header Authorization: Bearer <token>, using the personal API token from the Advocu portal settings page. Step-by-step setup: /setup\n",
  ),
);

// Only the request URL's origin is used. No headers are read, so nothing can be echoed.
app.get("/setup", (c) => {
  const url = new URL(c.req.url);
  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") url.protocol = "https:";
  return c.html(<SetupPage mcpUrl={`${url.origin}/mcp`} />, 200, SETUP_HEADERS);
});

// createMcpHonoApp's JSON middleware stashes the body as "parsedBody"; its Hono type does not declare it.
app.all("/mcp", (c) => mcp.fetch(c.req.raw, { parsedBody: c.get("parsedBody" as never) }));

export default app;
