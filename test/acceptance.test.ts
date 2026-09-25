import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import app from "../src/index";

const TOKEN = "test-token-abc123-SECRET";

type Captured = { url: string; method: string; headers: Headers; body: unknown };
let calls: Captured[];
let nextResponse: () => Response;

beforeEach(() => {
  calls = [];
  nextResponse = () => Response.json({ id: "draft-1" });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({
        url,
        method: init?.method ?? "GET",
        headers: new Headers(init?.headers),
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      });
      return nextResponse();
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

let rpcId = 0;
async function rpc(method: string, params: unknown, token: string | null = TOKEN) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await app.request("/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
  });
  const text = await res.text();
  // Response may be a JSON body or an SSE stream with one data frame.
  const json = text.trimStart().startsWith("{")
    ? JSON.parse(text)
    : JSON.parse(
        text
          .split("\n")
          .filter((l) => l.startsWith("data:"))
          .map((l) => l.slice(5))
          .join(""),
      );
  return { status: res.status, json };
}

async function callTool(name: string, args: unknown, token: string | null = TOKEN) {
  const { json } = await rpc("tools/call", { name, arguments: args }, token);
  const result = json.result as { content: { text: string }[]; isError?: boolean };
  return { text: result.content.map((c) => c.text).join("\n"), isError: result.isError === true };
}

describe("without a token", () => {
  it("A-1 GET /health", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, name: "advocu" });
  });

  it("A-2 GET / needs no auth and does not echo headers", async () => {
    const res = await app.request("/", { headers: { authorization: `Bearer ${TOKEN}`, "x-probe": "echo-me" } });
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("/mcp");
    expect(body).not.toContain(TOKEN);
    expect(body).not.toContain("echo-me");
  });

  it("A-3/A-4 no Authorization header: no Advocu call, tells user to add the token", async () => {
    for (const [name, args] of [
      ["list_activities", {}],
      ["create_activity_draft", { type: "public-speaking", fields: { title: "Agents on the edge" } }],
      ["update_activity", { activityId: "a1", type: "stories", fields: { title: "New title" } }],
    ] as const) {
      const r = await callTool(name, args, null);
      expect(r.isError).toBe(true);
      expect(r.text).toContain("Missing Authorization: Bearer token");
      expect(r.text).toContain("MCP client header");
    }
    expect(calls).toHaveLength(0);
  });

  it("A-5 create github-repository fails locally", async () => {
    const r = await callTool("create_activity_draft", { type: "github-repository", fields: { title: "Repo" } });
    expect(r.isError).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it("A-6 Virtual + country drops country", async () => {
    const r = await callTool("create_activity_draft", {
      type: "public-speaking",
      fields: { title: "Agents on the edge", eventFormat: "Virtual", country: "India" },
    });
    expect(r.isError).toBe(false);
    expect(calls[0]!.body).toEqual({ title: "Agents on the edge", eventFormat: "Virtual" });
  });

  it("A-7 In-Person + inPersonAttendees drops inPersonAttendees, keeps country", async () => {
    await callTool("create_activity_draft", {
      type: "workshop",
      fields: { title: "Workshop", eventFormat: "In-Person", country: "India", inPersonAttendees: 40 },
    });
    expect(calls[0]!.body).toEqual({ title: "Workshop", eventFormat: "In-Person", country: "India" });
  });

  it("Hybrid keeps country and inPersonAttendees", async () => {
    await callTool("create_activity_draft", {
      type: "public-speaking",
      fields: { title: "Talk", eventFormat: "Hybrid", country: "India", inPersonAttendees: 40, metrics: { attendees: 80 } },
    });
    expect(calls[0]!.body).toEqual({
      title: "Talk",
      eventFormat: "Hybrid",
      country: "India",
      inPersonAttendees: 40,
      metrics: { attendees: 80 },
    });
  });

  it("A-8 two-character title fails locally", async () => {
    const r = await callTool("create_activity_draft", { type: "content-creation", fields: { title: "ab" } });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("title must be 3 to 200");
    expect(calls).toHaveLength(0);
  });

  it("A-9 activityUrl 'not a url' fails locally", async () => {
    const r = await callTool("create_activity_draft", {
      type: "content-creation",
      fields: { title: "Post", activityUrl: "not a url" },
    });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("activityUrl");
    expect(calls).toHaveLength(0);
  });

  it("A-10 stories drops activityDate", async () => {
    await callTool("create_activity_draft", {
      type: "stories",
      fields: { title: "A story", activityDate: "2026-09-01" },
    });
    expect(calls[0]!.body).toEqual({ title: "A story" });
  });

  it("A-11 update body is { data } without type", async () => {
    nextResponse = () =>
      Response.json({ activityId: "act-9", type: "content-creation", data: { title: "Better title" } });
    const r = await callTool("update_activity", {
      activityId: "act-9",
      type: "content-creation",
      fields: { title: "Better title" },
    });
    expect(r.isError).toBe(false);
    expect(r.text).toContain("Activity updated.");
    expect(calls[0]!.method).toBe("PATCH");
    expect(calls[0]!.url).toBe("https://api.advocu.com/personal-api/v1/gde/activities/act-9");
    expect(calls[0]!.body).toEqual({ data: { title: "Better title" } });
  });

  it("A-12 create body is flat, forwards the bearer token, says draft not submitted", async () => {
    const r = await callTool("create_activity_draft", {
      type: "content-creation",
      fields: {
        contentType: "Articles",
        title: "Post",
        activityDate: "2026-09-01",
        description: "",
        imageUrl: "https://x/y.png",
        title_plain_text: "Post",
      },
    });
    expect(calls[0]!.method).toBe("POST");
    expect(calls[0]!.url).toBe("https://api.advocu.com/personal-api/v1/gde/activity-drafts/content-creation");
    expect(calls[0]!.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
    expect(calls[0]!.headers.get("content-type")).toBe("application/json");
    expect(calls[0]!.body).toEqual({ contentType: "Articles", title: "Post", activityDate: "2026-09-01" });
    expect(r.text).toContain("Draft created. It is not submitted.");
    expect(r.text).toContain("id: draft-1");
  });

  it("A-13 logs never contain the token", async () => {
    const logs: string[] = [];
    for (const level of ["log", "info", "warn", "error", "debug"] as const) {
      vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
        logs.push(args.map(String).join(" "));
      });
    }
    nextResponse = () => new Response(`bad token ${TOKEN}`, { status: 400 });
    const r = await callTool("list_activities", {});
    await callTool("create_activity_draft", { type: "mentoring", fields: { title: "Mentor" } });
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.join("\n")).not.toContain(TOKEN);
    expect(r.text).not.toContain(TOKEN);
  });

  it("A-14 tool list is exactly the three tools, with server instructions", async () => {
    const { json } = await rpc("tools/list", {}, null);
    const names = (json.result.tools as { name: string }[]).map((t) => t.name).sort();
    expect(names).toEqual(["create_activity_draft", "list_activities", "update_activity"]);
  });

  it("A-15 wrangler.jsonc has no KV, D1, or Durable Object bindings", async () => {
    const { readFileSync } = await import("node:fs");
    const cfg = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
    expect(cfg).not.toMatch(/kv_namespaces|d1_databases|durable_objects/);
  });
});

describe("list_activities shaping", () => {
  it("summarizes, hints another page when full, sends only documented query params", async () => {
    nextResponse = () =>
      Response.json({
        content: [
          {
            activityId: "a1",
            type: "public-speaking",
            submissionDate: "2026-09-01T00:00:00Z",
            updatedDate: "2026-09-02T00:00:00Z",
            data: { title: "Agents on the edge", private: false, tags: ["x", "y"] },
          },
        ],
      });
    const r = await callTool("list_activities", { from: "2026-09-01T00:00:00Z", size: 1, verbose: false });
    expect(r.text).toContain("page 0, size 1, returned 1");
    expect(r.text).toContain("Another page may exist.");
    expect(r.text).toContain("- id: a1");
    expect(r.text).toContain("title: Agents on the edge");
    expect(r.text).not.toContain("tags");
    const url = new URL(calls[0]!.url);
    expect(url.pathname).toBe("/personal-api/v1/gde/activities");
    expect([...url.searchParams.keys()].sort()).toEqual(["from", "page", "size"]);
  });

  it("empty page", async () => {
    nextResponse = () => Response.json({ content: [] });
    const r = await callTool("list_activities", {});
    expect(r.text).toBe("page 0, size 10, returned 0\nNo activities in this page.");
  });

  it("rejects a bad timestamp locally", async () => {
    const r = await callTool("list_activities", { from: "last week" });
    expect(r.isError).toBe(true);
    expect(calls).toHaveLength(0);
  });
});

describe("error mapping", () => {
  it("401 → token rejected text", async () => {
    nextResponse = () => new Response("nope", { status: 401 });
    const r = await callTool("list_activities", {});
    expect(r.isError).toBe(true);
    expect(r.text).toContain("Advocu rejected the token (HTTP 401)");
  });

  it("429 → rate limit text, no retry", async () => {
    nextResponse = () => new Response("slow down", { status: 429 });
    const r = await callTool("create_activity_draft", { type: "stories", fields: { title: "Story" } });
    expect(r.isError).toBe(true);
    expect(r.text).toContain("HTTP 429");
    expect(calls).toHaveLength(1);
  });

  it("500 → status plus truncated body", async () => {
    nextResponse = () => new Response("x".repeat(5000), { status: 500 });
    const r = await callTool("list_activities", {});
    expect(r.text.startsWith("Advocu returned HTTP 500.")).toBe(true);
    expect(r.text.length).toBeLessThan(2100);
  });

  it("update rejects read-only types with the documented text", async () => {
    const r = await callTool("update_activity", { activityId: "a", type: "youtube-video", fields: { title: "abc" } });
    expect(r.text).toBe(
      "This type cannot be updated through the MCP. The saved API page has no update model for it.",
    );
    expect(calls).toHaveLength(0);
  });
});
