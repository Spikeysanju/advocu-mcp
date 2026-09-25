import { html, raw } from "hono/html";

// The setup page. The token is typed into the page and spliced into snippets by the inline script.
// It is never sent to this Worker: no form, no fetch, no query string, no storage.
export const PORTAL_TOKEN_URL = "https://app.advocu.com/settings/integrations/personal-api";
const PLACEHOLDER = "<advocu-personal-api-token>";

export const SETUP_HEADERS = {
  "Content-Security-Policy":
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

type Client = { id: string; name: string; where: string; lang: string; snippet: (url: string) => string };

const CLIENTS: Client[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    where: "Run in your terminal.",
    lang: "bash",
    snippet: (url) => `claude mcp add --transport http advocu ${url} --header "Authorization: Bearer ${PLACEHOLDER}"`,
  },
  {
    id: "cursor",
    name: "Cursor",
    where: "Add to ~/.cursor/mcp.json (or .cursor/mcp.json in a project).",
    lang: "json",
    snippet: (url) =>
      JSON.stringify(
        { mcpServers: { advocu: { url, headers: { Authorization: `Bearer ${PLACEHOLDER}` } } } },
        null,
        2,
      ),
  },
  {
    id: "vscode",
    name: "VS Code",
    where: "Add to .vscode/mcp.json, or your user MCP config. Works with GitHub Copilot agent mode.",
    lang: "json",
    snippet: (url) =>
      JSON.stringify(
        { servers: { advocu: { type: "http", url, headers: { Authorization: `Bearer ${PLACEHOLDER}` } } } },
        null,
        2,
      ),
  },
  {
    id: "windsurf",
    name: "Windsurf",
    where: "Add to ~/.codeium/windsurf/mcp_config.json.",
    lang: "json",
    snippet: (url) =>
      JSON.stringify(
        { mcpServers: { advocu: { serverUrl: url, headers: { Authorization: `Bearer ${PLACEHOLDER}` } } } },
        null,
        2,
      ),
  },
  {
    id: "codex",
    name: "Codex",
    where: "Add to ~/.codex/config.toml.",
    lang: "toml",
    snippet: (url) =>
      `[mcp_servers.advocu]\nurl = "${url}"\nhttp_headers = { "Authorization" = "Bearer ${PLACEHOLDER}" }`,
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    where: "Add to claude_desktop_config.json. Uses the mcp-remote bridge, which needs Node.js.",
    lang: "json",
    snippet: (url) =>
      JSON.stringify(
        {
          mcpServers: {
            advocu: {
              command: "npx",
              args: ["-y", "mcp-remote", url, "--header", "Authorization:${AUTH_HEADER}"],
              env: { AUTH_HEADER: `Bearer ${PLACEHOLDER}` },
            },
          },
        },
        null,
        2,
      ),
  },
];

const TOOLS = [
  {
    name: "list_activities",
    body: "Lists your GDE activities, oldest submission first. One short row each: id, type, title, dates. Your agent calls this before an update.",
  },
  {
    name: "create_activity_draft",
    body: "Creates a draft from what you give it: photos, links, slides, notes. It is never submitted. You review it and submit it in the portal.",
  },
  {
    name: "update_activity",
    body: "Patches an existing activity. Sends only the fields that change, using the id and type from list_activities.",
  },
];

const STYLE = `
:root {
  --bg: #ffffff; --bg-2: #fafafa; --text: #171717; --text-2: #5c5c5c;
  --line: #ebebeb; --line-2: #d4d4d4; --focus: #0068d6;
  --sans: "Geist", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0a0a0a; --bg-2: #111111; --text: #ededed; --text-2: #a1a1a1;
    --line: #242424; --line-2: #3a3a3a; --focus: #52a8ff;
    color-scheme: dark;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font: 400 16px/24px var(--sans); -webkit-font-smoothing: antialiased; font-synthesis: none;
}
h1, h2, h3, p, ol { margin: 0; padding: 0; }
a { color: inherit; text-underline-offset: 3px; text-decoration-thickness: 1px; }
code, pre, .mono { font-family: var(--mono); }
:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; border-radius: 4px; }
.skip { position: absolute; left: -9999px; }
.skip:focus { left: 16px; top: 16px; padding: 8px 12px; background: var(--bg); z-index: 1; }

.shell { max-width: 1080px; margin: 0 auto; padding: 0 24px; }
.grid { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); column-gap: 24px; }
.grid > * { min-width: 0; }

.masthead { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 24px 0 0; font-size: 14px; line-height: 20px; }
.identity { font-weight: 600; letter-spacing: -0.01em; }
.meta { display: flex; gap: 20px; color: var(--text-2); }

.opening { padding: 96px 0 64px; }
.opening > div { grid-column: 1 / span 8; display: grid; gap: 16px; }
h1 { font-size: 48px; line-height: 52px; font-weight: 600; letter-spacing: -0.045em; text-wrap: balance; }
.lede { font-size: 20px; line-height: 30px; color: var(--text-2); max-width: 36em; text-wrap: pretty; }

.steps { list-style: none; }
.step { padding: 32px 0; border-top: 1px solid var(--line); row-gap: 16px; }
.step-head { grid-column: 1 / span 4; display: grid; grid-template-columns: 24px 1fr; column-gap: 12px; row-gap: 4px; align-content: start; }
.step-num { font-weight: 500; color: var(--text-2); font-variant-numeric: tabular-nums; }
.step-head h2 { font-size: 16px; line-height: 24px; font-weight: 600; letter-spacing: -0.01em; }
.step-head p { grid-column: 2; color: var(--text-2); font-size: 14px; line-height: 20px; }
.step-body { grid-column: 5 / span 8; display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; align-content: start; }

.btn {
  display: inline-flex; align-items: center; justify-self: start; height: 40px; padding: 0 16px; border-radius: 6px;
  background: var(--text); color: var(--bg); font: 500 14px/20px var(--sans); text-decoration: none; border: 0; cursor: pointer;
  transition: opacity 150ms ease, transform 150ms ease;
}
.btn:hover { opacity: 0.86; }
.btn:active, .btn-2:active { transform: scale(0.97); }
.btn-2 {
  height: 40px; padding: 0 14px; border-radius: 6px; border: 1px solid var(--line-2); background: var(--bg);
  color: var(--text); font: 500 14px/20px var(--sans); cursor: pointer; transition: background 150ms ease, transform 150ms ease;
}
.btn-2:hover { background: var(--bg-2); }
.field { display: flex; gap: 8px; }
input {
  flex: 1; min-width: 0; height: 40px; padding: 0 12px; border-radius: 6px; border: 1px solid var(--line-2);
  background: var(--bg); color: var(--text); font: 400 14px/20px var(--mono); transition: border-color 150ms ease;
}
input:hover { border-color: var(--text-2); }
input::placeholder { color: var(--text-2); font-family: var(--sans); }
.helper { color: var(--text-2); font-size: 14px; line-height: 20px; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }

.tabs { display: flex; gap: 20px; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid var(--line); }
.tabs::-webkit-scrollbar { display: none; }
[role=tab] {
  flex: none; padding: 0 0 10px; border: 0; background: none; color: var(--text-2); font: 500 14px/20px var(--sans);
  cursor: pointer; box-shadow: inset 0 -2px 0 transparent; transition: color 150ms ease, box-shadow 150ms ease;
}
[role=tab]:hover { color: var(--text); }
[role=tab][aria-selected=true] { color: var(--text); box-shadow: inset 0 -2px 0 var(--text); }
.panel { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; padding-top: 4px; }
.panel[hidden] { display: none; }
.panel code { font-size: 13px; }
.code { position: relative; border: 1px solid var(--line); border-radius: 8px; background: var(--bg-2); }
pre { margin: 0; padding: 16px 88px 16px 16px; overflow-x: auto; font-size: 13px; line-height: 20px; white-space: pre; }
.copy { position: absolute; top: 10px; right: 10px; height: 28px; padding: 0 10px; font-size: 13px; }
.copy.done { border-color: var(--text); }

.section { padding: 32px 0 96px; border-top: 1px solid var(--line); row-gap: 32px; }
.section-head { grid-column: 1 / span 4; display: grid; gap: 4px; align-content: start; }
.section-head h2 { font-size: 24px; line-height: 32px; font-weight: 600; letter-spacing: -0.03em; }
.section-head p { color: var(--text-2); }
.tools { grid-column: 5 / span 8; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.tool { display: grid; gap: 8px; align-content: start; }
.tool h3 { font: 500 14px/20px var(--mono); overflow-wrap: anywhere; }
.tool p { color: var(--text-2); font-size: 14px; line-height: 22px; }
.types { grid-column: 5 / span 8; color: var(--text-2); font-size: 14px; line-height: 22px; }
.types code { color: var(--text); font-size: 13px; }

footer { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 0 0 48px; font-size: 14px; line-height: 20px; color: var(--text-2); }
footer .identity { color: var(--text); }
footer a { color: var(--text); }

@media (max-width: 900px) {
  .opening > div, .step-head, .step-body, .section-head, .tools, .types { grid-column: 1 / -1; }
  .step-body { padding-left: 36px; }
  .opening { padding: 64px 0 48px; }
}
@media (max-width: 640px) {
  .shell { padding: 0 16px; }
  h1 { font-size: 36px; line-height: 40px; letter-spacing: -0.04em; }
  .lede { font-size: 18px; line-height: 28px; }
  .step-body { padding-left: 0; }
  .tools { grid-template-columns: 1fr; }
  .meta span { display: none; }
  footer { flex-direction: column; gap: 8px; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
`;

// Runs in the browser. Snippets are written with textContent, so pasted text is never parsed as HTML.
const SCRIPT = `
(() => {
  const PH = ${JSON.stringify(PLACEHOLDER)};
  const input = document.getElementById("token");
  const pres = document.querySelectorAll("pre[data-tpl]");
  const render = () => {
    const t = input.value.trim().replace(/^Bearer\\s+/i, "");
    pres.forEach((p) => { p.textContent = p.dataset.tpl.split(PH).join(t || PH); });
  };
  input.addEventListener("input", render);
  document.getElementById("reveal").addEventListener("click", (e) => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    e.currentTarget.textContent = show ? "Hide" : "Show";
  });
  const tabs = document.querySelectorAll("[role=tab]");
  const select = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t));
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (!d) return;
      const next = tabs[(i + d + tabs.length) % tabs.length];
      select(next); next.focus();
    });
  });
  document.querySelectorAll(".copy").forEach((b) => {
    b.addEventListener("click", async () => {
      const text = document.getElementById(b.dataset.for).textContent;
      try { await navigator.clipboard.writeText(text); b.textContent = "Copied"; b.classList.add("done"); }
      catch { b.textContent = "Select + copy"; }
      setTimeout(() => { b.textContent = "Copy"; b.classList.remove("done"); }, 1600);
    });
  });
})();
`;

export const SetupPage = ({ mcpUrl }: { mcpUrl: string }) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="referrer" content="no-referrer" />
      <title>Advocu MCP Setup</title>
      <meta name="description" content="Connect your AI agent to Advocu in two minutes. Log GDE activities as drafts from Claude, Cursor, VS Code, and more." />
      <style>{raw(STYLE)}</style>
    </head>
    <body>
      <a class="skip" href="#main">Skip to content</a>
      <div class="shell">
        <header class="masthead">
          <span class="identity">Advocu MCP</span>
          <div class="meta">
            <span>Not affiliated with Advocu or Google</span>
            <a href="https://github.com/Spikeysanju/advocu-mcp" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </header>

        <main id="main">
          <div class="opening grid">
            <div>
              <h1>Log your GDE work from your agent</h1>
              <p class="lede">
                Hand your agent the photos, links, or slides. It writes the Advocu draft. You review it and submit it in
                the portal. Setup takes two minutes.
              </p>
            </div>
          </div>

          <ol class="steps">
            <li class="step grid">
              <div class="step-head">
                <span class="step-num">1</span>
                <h2>Get your personal API token</h2>
                <p>In the portal, click “Generate your token” and copy it.</p>
              </div>
              <div class="step-body">
                <a class="btn" href={PORTAL_TOKEN_URL} target="_blank" rel="noopener noreferrer">
                  Open Advocu portal<span class="sr"> (opens in a new tab)</span>
                </a>
              </div>
            </li>

            <li class="step grid">
              <div class="step-head">
                <span class="step-num">2</span>
                <h2>Paste it here</h2>
                <p>Every snippet in the next step fills in as you type.</p>
              </div>
              <div class="step-body">
                <div class="field">
                  <label for="token" class="sr">Advocu personal API token</label>
                  <input id="token" type="password" placeholder="Paste your token" autocomplete="off" autocapitalize="off" spellcheck={false} />
                  <button id="reveal" class="btn-2" type="button">Show</button>
                </div>
                <p class="helper">The token stays in this browser tab. It is never sent to this server or saved.</p>
              </div>
            </li>

            <li class="step grid">
              <div class="step-head">
                <span class="step-num">3</span>
                <h2>Add it to your client</h2>
                <p>Copy the snippet for your client, then restart it or reload its MCP servers.</p>
              </div>
              <div class="step-body">
                <div class="tabs" role="tablist" aria-label="MCP client">
                  {CLIENTS.map((cl, i) => (
                    <button role="tab" type="button" id={`tab-${cl.id}`} aria-controls={`panel-${cl.id}`} aria-selected={i === 0 ? "true" : "false"} tabindex={i === 0 ? 0 : -1}>
                      {cl.name}
                    </button>
                  ))}
                  <button role="tab" type="button" id="tab-chatgpt" aria-controls="panel-chatgpt" aria-selected="false" tabindex={-1}>
                    ChatGPT
                  </button>
                </div>
                {CLIENTS.map((cl, i) => {
                  const tpl = cl.snippet(mcpUrl);
                  return (
                    <div class="panel" role="tabpanel" id={`panel-${cl.id}`} aria-labelledby={`tab-${cl.id}`} hidden={i !== 0}>
                      <p class="helper">{cl.where}</p>
                      <div class="code">
                        <pre id={`code-${cl.id}`} data-tpl={tpl} data-lang={cl.lang}>{tpl}</pre>
                        <button class="copy btn-2" type="button" data-for={`code-${cl.id}`}>Copy</button>
                      </div>
                    </div>
                  );
                })}
                <div class="panel" role="tabpanel" id="panel-chatgpt" aria-labelledby="tab-chatgpt" hidden>
                  <p>Not supported yet.</p>
                  <p class="helper">
                    ChatGPT connectors only offer OAuth or no auth, so they cannot send an <code>Authorization: Bearer</code>{" "}
                    header. This server never takes your token any other way.
                  </p>
                </div>
                <p class="helper">
                  Server URL <code>{mcpUrl}</code>. Any MCP client that can send an HTTP header works.
                </p>
              </div>
            </li>
          </ol>

          <section class="section grid" aria-labelledby="tools-heading">
            <div class="section-head">
              <h2 id="tools-heading">What your agent can do</h2>
              <p>Three tools. Nothing is ever submitted, archived, or deleted for you.</p>
            </div>
            <div class="tools">
              {TOOLS.map((t) => (
                <div class="tool">
                  <h3>{t.name}</h3>
                  <p>{t.body}</p>
                </div>
              ))}
            </div>
            <p class="types">
              Draft types: <code>content-creation</code>, <code>interaction-with-googlers</code>, <code>mentoring</code>,{" "}
              <code>product-feedback-given</code>, <code>public-speaking</code>, <code>stories</code>,{" "}
              <code>workshop</code>. <code>github-repository</code> and <code>youtube-video</code> can be listed, but not
              created or updated.
            </p>
          </section>
        </main>

        <footer>
          <span class="identity">Advocu MCP</span>
          <span>
            I kept losing weekends to the Advocu form, so I built this. Made with ♥ by{" "}
            <a href="https://sanju.sh" target="_blank" rel="noopener">sanju.sh</a>
          </span>
        </footer>
      </div>
      {html`<script>${raw(SCRIPT)}</script>`}
    </body>
  </html>
);
