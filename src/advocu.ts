export const ADVOCU_BASE_URL = "https://api.advocu.com/personal-api/v1/gde";

const MAX_ERROR_BODY = 2000;

export const MISSING_TOKEN_TEXT =
  "Missing Authorization: Bearer token. Add the Advocu personal API token from the portal settings page to the MCP client header.";

export type AdvocuResult = { ok: true; status: number; body: unknown } | { ok: false; error: string };

/** Pull the bearer token from an Authorization header value. Returns undefined if absent or not Bearer. */
export function bearerToken(header: string | null | undefined): string | undefined {
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token ? token : undefined;
}

function truncate(text: string): string {
  return text.length > MAX_ERROR_BODY ? `${text.slice(0, MAX_ERROR_BODY)}…` : text;
}

/**
 * Call the Advocu Personal API with the caller's own token.
 * Logs only method, path, status, and duration. Never the token or a body.
 */
export async function advocuFetch(
  token: string,
  path: string,
  init: { method: "GET" | "POST" | "PATCH"; body?: unknown } = { method: "GET" },
): Promise<AdvocuResult> {
  const started = Date.now();
  const logPath = path.split("?")[0];
  let res: Response;
  try {
    res = await fetch(`${ADVOCU_BASE_URL}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  } catch (err) {
    console.log(JSON.stringify({ advocu: init.method, path: logPath, status: "network_error", ms: Date.now() - started }));
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Could not reach Advocu. ${message.split(token).join("[redacted]")}` };
  }
  console.log(JSON.stringify({ advocu: init.method, path: logPath, status: res.status, ms: Date.now() - started }));

  const text = await res.text();

  if (res.status === 401 || res.status === 403) {
    return {
      ok: false,
      error: `Advocu rejected the token (HTTP ${res.status}). Generate a new token in the Advocu portal settings and update the MCP client header.`,
    };
  }
  if (res.status === 429) {
    return {
      ok: false,
      error: "Advocu rate limit reached (HTTP 429, 30 requests per minute per IP). Wait. Do not retry now.",
    };
  }
  if (res.status >= 400) {
    const body = truncate(text.split(token).join("[redacted]"));
    return { ok: false, error: `Advocu returned HTTP ${res.status}.${body ? `\n${body}` : ""}` };
  }

  let body: unknown = text;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }
  return { ok: true, status: res.status, body };
}
