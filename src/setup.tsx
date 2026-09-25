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
  --bg: #fbfaf8; --surface: #ffffff; --text: #1d1c1a; --muted: #6b6862; --line: #e7e4de;
  --accent: #1a73e8; --accent-text: #ffffff; --code-bg: #f4f2ee; --ok: #188038; --warn-bg: #fdf6e3; --warn: #8a6100;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #131312; --surface: #1c1b1a; --text: #eceae6; --muted: #9c9891; --line: #2e2c29;
    --accent: #8ab4f8; --accent-text: #0b1a33; --code-bg: #232220; --ok: #81c995; --warn-bg: #2a2416; --warn: #e6c36a;
    color-scheme: dark;
  }
}
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0; background: var(--bg); color: var(--text);
  font: 16px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
main { max-width: 720px; margin: 0 auto; padding: 56px 16px 32px; }
h1 { font-size: 32px; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 12px; text-wrap: balance; }
h2 { font-size: 18px; margin: 0 0 4px; letter-spacing: -0.01em; }
p { margin: 0; }
.lede { color: var(--muted); font-size: 17px; max-width: 58ch; text-wrap: pretty; }
.eyebrow { font-size: 13px; font-weight: 600; color: var(--accent); letter-spacing: 0.02em; margin-bottom: 10px; }
section { margin-top: 40px; }
.step { display: grid; grid-template-columns: 28px 1fr; gap: 14px; }
.num {
  width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--line); background: var(--surface);
  display: grid; place-items: center; font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums;
}
.hint { color: var(--muted); font-size: 14px; margin-bottom: 14px; }
.btn {
  display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 10px;
  background: var(--accent); color: var(--accent-text); font: inherit; font-size: 15px; font-weight: 600;
  text-decoration: none; border: 0; cursor: pointer; transition: transform 120ms ease, opacity 120ms ease;
}
.btn:hover { opacity: 0.92; }
.btn:active { transform: scale(0.97); }
.field { display: flex; gap: 8px; }
input {
  flex: 1; min-width: 0; height: 44px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--line);
  background: var(--surface); color: var(--text); font: 15px ui-monospace, SFMono-Regular, Menlo, monospace;
}
input:focus-visible, .btn:focus-visible, .ghost:focus-visible, [role=tab]:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.ghost {
  height: 44px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--line); background: var(--surface);
  color: var(--text); font: inherit; font-size: 14px; cursor: pointer;
}
.ghost:active { transform: scale(0.97); }
.private { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 13px; margin-top: 8px; }
.private svg { flex: none; }
.tabs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid var(--line); margin-bottom: 14px; }
.tabs::-webkit-scrollbar { display: none; }
[role=tab] {
  flex: none; padding: 8px 12px; border: 0; background: none; color: var(--muted); font: inherit; font-size: 14px;
  cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px;
}
[role=tab][aria-selected=true] { color: var(--text); border-bottom-color: var(--accent); font-weight: 600; }
[role=tab].off { font-style: italic; }
.panel[hidden] { display: none; }
.code { position: relative; border: 1px solid var(--line); border-radius: 12px; background: var(--code-bg); }
pre {
  margin: 0; padding: 16px; padding-right: 88px; overflow-x: auto;
  font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre;
}
.copy {
  position: absolute; top: 8px; right: 8px; height: 30px; padding: 0 12px; border-radius: 8px;
  border: 1px solid var(--line); background: var(--surface); color: var(--text); font: inherit; font-size: 13px; cursor: pointer;
}
.copy.done { color: var(--ok); }
.note { padding: 14px 16px; border-radius: 12px; background: var(--warn-bg); color: var(--warn); font-size: 14px; }
.tools { display: grid; gap: 10px; margin-top: 14px; }
.tool { padding: 16px; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
.tool code { font: 600 14px ui-monospace, SFMono-Regular, Menlo, monospace; }
.tool p { color: var(--muted); font-size: 14px; margin-top: 4px; }
.fine { color: var(--muted); font-size: 13px; margin-top: 12px; }
.fine code, .hint code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.92em; }
footer { max-width: 720px; margin: 24px auto 0; padding: 24px 16px 48px; border-top: 1px solid var(--line); color: var(--muted); font-size: 14px; }
footer p + p { margin-top: 6px; }
footer a { color: var(--text); text-underline-offset: 3px; }
.heart { color: #d93025; }
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

const Lock = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

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
      <main>
        <div class="eyebrow">Advocu MCP</div>
        <h1>Log your GDE work from your agent</h1>
        <p class="lede">
          Hand your agent the photos, links, or slides. It writes the Advocu draft. You review it and submit it in the
          portal. Setup takes two minutes.
        </p>

        <section class="step">
          <div class="num">1</div>
          <div>
            <h2>Get your personal API token</h2>
            <p class="hint">Open the Advocu portal, click “Generate your token”, then copy it.</p>
            <a class="btn" href={PORTAL_TOKEN_URL} target="_blank" rel="noopener noreferrer">
              Open Advocu portal
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M7 17 17 7M8 7h9v9" />
              </svg>
            </a>
          </div>
        </section>

        <section class="step">
          <div class="num">2</div>
          <div>
            <h2>Paste it here</h2>
            <p class="hint">Every snippet below fills in as you type.</p>
            <div class="field">
              <label for="token" style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)">
                Advocu personal API token
              </label>
              <input id="token" type="password" placeholder="Paste your token" autocomplete="off" autocapitalize="off" spellcheck={false} />
              <button id="reveal" class="ghost" type="button">Show</button>
            </div>
            <p class="private">
              <Lock /> Stays in this browser tab. It is never sent to this server or saved.
            </p>
          </div>
        </section>

        <section class="step">
          <div class="num">3</div>
          <div style="min-width:0">
            <h2>Add it to your client</h2>
            <p class="hint">Copy the snippet for your client. Then restart it or reload its MCP servers.</p>
            <div class="tabs" role="tablist" aria-label="MCP client">
              {CLIENTS.map((cl, i) => (
                <button role="tab" type="button" id={`tab-${cl.id}`} aria-controls={`panel-${cl.id}`} aria-selected={i === 0 ? "true" : "false"} tabindex={i === 0 ? 0 : -1}>
                  {cl.name}
                </button>
              ))}
              <button role="tab" type="button" class="off" id="tab-chatgpt" aria-controls="panel-chatgpt" aria-selected="false" tabindex={-1}>
                ChatGPT
              </button>
            </div>
            {CLIENTS.map((cl, i) => {
              const tpl = cl.snippet(mcpUrl);
              return (
                <div class="panel" role="tabpanel" id={`panel-${cl.id}`} aria-labelledby={`tab-${cl.id}`} hidden={i !== 0}>
                  <p class="hint">{cl.where}</p>
                  <div class="code">
                    <pre id={`code-${cl.id}`} data-tpl={tpl} data-lang={cl.lang}>{tpl}</pre>
                    <button class="copy" type="button" data-for={`code-${cl.id}`}>Copy</button>
                  </div>
                </div>
              );
            })}
            <div class="panel" role="tabpanel" id="panel-chatgpt" aria-labelledby="tab-chatgpt" hidden>
              <p class="note">
                Not supported yet. ChatGPT connectors only offer OAuth or no auth, and cannot send an{" "}
                <code>Authorization: Bearer</code> header. This server never takes your token any other way.
              </p>
            </div>
            <p class="fine">
              Server URL: <code>{mcpUrl}</code>. Any MCP client that can send an HTTP header works.
            </p>
          </div>
        </section>

        <section>
          <h2>What your agent can do</h2>
          <p class="hint">Three tools. Nothing is ever submitted, archived, or deleted for you.</p>
          <div class="tools">
            {TOOLS.map((t) => (
              <div class="tool">
                <code>{t.name}</code>
                <p>{t.body}</p>
              </div>
            ))}
          </div>
          <p class="fine">
            Drafts: <code>content-creation</code>, <code>interaction-with-googlers</code>, <code>mentoring</code>,{" "}
            <code>product-feedback-given</code>, <code>public-speaking</code>, <code>stories</code>, <code>workshop</code>.{" "}
            <code>github-repository</code> and <code>youtube-video</code> can be listed, but not created or updated.
          </p>
        </section>
      </main>

      <footer>
        <p>
          I kept losing weekends to the Advocu form, so I built this. Made with <span class="heart">♥</span> by{" "}
          <a href="https://sanju.sh" target="_blank" rel="noopener">sanju.sh</a>.
        </p>
        <p>
          Open source on{" "}
          <a href="https://github.com/Spikeysanju/advocu-mcp" target="_blank" rel="noopener noreferrer">GitHub</a>, Apache-2.0.
          Not affiliated with Advocu or Google.
        </p>
      </footer>
      {html`<script>${raw(SCRIPT)}</script>`}
    </body>
  </html>
);
