import { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod";
import { advocuFetch, MISSING_TOKEN_TEXT } from "./advocu";
import { ALLOWED_FIELDS, DRAFT_TYPES, isDraftType, READ_ONLY_TYPES, validateFields, type DraftType } from "./validate";

export const SERVER_INSTRUCTIONS = `Advocu MCP creates drafts and updates activities on the GDE personal API. It does not submit them.
After every create, say the activity is a draft and is not submitted.
Do not invent metrics, attendee counts, countries, cities, or links. Omit a field the user did not give you.
Do not set private unless the user asked for private or public.
Before update_activity, call list_activities and copy activityId and type from that row.
github-repository and youtube-video can be listed. They cannot be created or updated.
If a tool returns HTTP 429, stop. Do not call Advocu again in this turn.`;

const ISO_TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };

const ok = (text: string): ToolResult => ({ content: [{ type: "text", text }] });
const fail = (text: string): ToolResult => ({ content: [{ type: "text", text }], isError: true });

const fieldsHelp = DRAFT_TYPES.map((t) => `  ${t}: ${ALLOWED_FIELDS[t].join(", ")}`).join("\n");

const FIELDS_DESCRIPTION = `Activity fields for this type. Only include fields the user actually gave you. Allowed keys per type:
${fieldsHelp}
metrics is an object, for example {"attendees": 80} (public-speaking, workshop, mentoring), {"readers": 500} (content-creation), {"timeSpent": 60} minutes (interaction-with-googlers, product-feedback-given), {"impact": 10} (stories).
activityDate is YYYY-MM-DD. activityUrl is an http(s) URL. eventFormat is In-Person, Virtual, or Hybrid; country only applies to In-Person or Hybrid, inPersonAttendees only to Hybrid.
Enums: content-creation contentType = Articles | Books | Code contribution | Demos | Newsletters | Podcasts | Videos. product-feedback-given contentType = Early access program | Product feedback session. stories significanceType = Diversity & Inclusion | Helping Business | Social Impact | Feedback to Google | Community Leading | Technology / Open source.
tags is an array of Advocu tag strings.`;

function checkType(type: string, action: "created" | "updated"): DraftType | ToolResult {
  if (isDraftType(type)) return type;
  if ((READ_ONLY_TYPES as readonly string[]).includes(type)) {
    return fail(
      action === "updated"
        ? "This type cannot be updated through the MCP. The saved API page has no update model for it."
        : `${type} cannot be created through the MCP. The saved API page has no draft route for it.`,
    );
  }
  return fail(`Unknown activity type "${type}". Use one of: ${DRAFT_TYPES.join(", ")}.`);
}

type Activity = {
  activityId?: unknown;
  type?: unknown;
  submissionDate?: unknown;
  updatedDate?: unknown;
  data?: Record<string, unknown>;
};

function summarize(activity: Activity, verbose: boolean): string {
  const lines: string[] = [];
  const push = (label: string, value: unknown) => {
    if (value !== undefined && value !== null && value !== "") lines.push(`  ${label}: ${String(value)}`);
  };
  push("id", activity.activityId);
  push("type", activity.type);
  push("title", activity.data?.title);
  push("submissionDate", activity.submissionDate);
  push("updatedDate", activity.updatedDate);
  push("private", activity.data?.private);
  push("activityUrl", activity.data?.activityUrl);
  if (lines[0] !== undefined) lines[0] = `- ${lines[0].trimStart()}`;
  else lines.push("- (activity with no summary fields)");
  if (verbose && activity.data !== undefined) {
    lines.push(`  data: ${JSON.stringify(activity.data, null, 2).split("\n").join("\n  ")}`);
  }
  return lines.join("\n");
}

/** Build a fresh MCP server for one request. The token lives only in this closure. */
export function buildServer(token: string | undefined): McpServer {
  const server = new McpServer({ name: "advocu", version: "0.1.0" }, { instructions: SERVER_INSTRUCTIONS });

  server.registerTool(
    "list_activities",
    {
      title: "List Advocu activities",
      description:
        "List the caller's Advocu GDE activities, sorted by submission date ascending. Returns a short summary per activity (id, type, title, dates). Use this before update_activity to get activityId and type.",
      inputSchema: z.object({
        from: z.string().optional().describe("ISO-8601 timestamp, inclusive. Example 2026-01-01T00:00:00Z"),
        to: z.string().optional().describe("ISO-8601 timestamp, exclusive. Example 2026-02-01T00:00:00Z"),
        updatedAfter: z.string().optional().describe("ISO-8601 timestamp. Only activities updated after this."),
        page: z.number().int().min(0).optional().describe("Page number, default 0."),
        size: z.number().int().min(1).max(100).optional().describe("Page size 1-100, default 10."),
        verbose: z.boolean().optional().describe("Include the full data object for each activity. Default false."),
      }),
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ from, to, updatedAfter, page, size, verbose }) => {
      if (!token) return fail(MISSING_TOKEN_TEXT);
      for (const [name, value] of Object.entries({ from, to, updatedAfter })) {
        if (value !== undefined && !ISO_TIMESTAMP_RE.test(value)) {
          return fail(`${name} must be an ISO-8601 timestamp, for example 2026-01-01T00:00:00Z.`);
        }
      }
      const pageNum = page ?? 0;
      const sizeNum = size ?? 10;
      const query = new URLSearchParams();
      if (from) query.set("from", from);
      if (to) query.set("to", to);
      if (updatedAfter) query.set("updatedAfter", updatedAfter);
      query.set("page", String(pageNum));
      query.set("size", String(sizeNum));

      const res = await advocuFetch(token, `/activities?${query.toString()}`, { method: "GET" });
      if (!res.ok) return fail(res.error);

      const content = (res.body as { content?: unknown } | null)?.content;
      if (!Array.isArray(content)) {
        return ok(
          `The page shape was not the documented content array. Raw response:\n${JSON.stringify(res.body, null, 2)}`,
        );
      }
      const header = `page ${pageNum}, size ${sizeNum}, returned ${content.length}`;
      if (content.length === 0) return ok(`${header}\nNo activities in this page.`);
      const lines = [header];
      if (content.length === sizeNum) lines.push("Another page may exist.");
      for (const activity of content) lines.push(summarize(activity as Activity, verbose ?? false));
      return ok(lines.join("\n"));
    },
  );

  server.registerTool(
    "create_activity_draft",
    {
      title: "Create an Advocu activity draft",
      description:
        "Create a DRAFT activity in Advocu. It is not submitted; the user reviews and submits it in the Advocu portal. Only include fields the user gave you. Do not invent metrics, countries, or links.",
      inputSchema: z.object({
        type: z
          .string()
          .describe(`Activity type. One of: ${DRAFT_TYPES.join(", ")}. github-repository and youtube-video cannot be created.`),
        fields: z.record(z.string(), z.unknown()).describe(FIELDS_DESCRIPTION),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ type, fields }) => {
      if (!token) return fail(MISSING_TOKEN_TEXT);
      const checked = checkType(type, "created");
      if (typeof checked !== "string") return checked;
      const valid = validateFields(checked, fields);
      if (!valid.ok) return fail(valid.error);

      const res = await advocuFetch(token, `/activity-drafts/${checked}`, { method: "POST", body: valid.fields });
      if (!res.ok) return fail(res.error);

      const id = (res.body as { id?: unknown } | null)?.id;
      if (typeof id === "string" && id) {
        return ok(
          `Draft created. It is not submitted.\nid: ${id}\ntype: ${checked}\nReview it in the Advocu portal before submitting.`,
        );
      }
      return ok(
        `Draft created. It is not submitted.\ntype: ${checked}\nAdvocu did not return an id string. Raw response:\n${JSON.stringify(res.body, null, 2)}\nReview it in the Advocu portal before submitting.`,
      );
    },
  );

  server.registerTool(
    "update_activity",
    {
      title: "Update an Advocu activity",
      description:
        "Patch fields on an existing Advocu activity. First call list_activities and copy activityId and type from that row. Send only the fields that change.",
      inputSchema: z.object({
        activityId: z.string().min(1).describe("activityId copied from list_activities."),
        type: z.string().describe(`Activity type copied from list_activities. One of: ${DRAFT_TYPES.join(", ")}.`),
        fields: z.record(z.string(), z.unknown()).describe(`Only the fields that change. ${FIELDS_DESCRIPTION}`),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ activityId, type, fields }) => {
      if (!token) return fail(MISSING_TOKEN_TEXT);
      const checked = checkType(type, "updated");
      if (typeof checked !== "string") return checked;
      const valid = validateFields(checked, fields);
      if (!valid.ok) return fail(valid.error);
      if (Object.keys(valid.fields).length === 0) {
        return fail(
          `No allowed fields to update for ${checked}. Allowed keys: ${ALLOWED_FIELDS[checked].join(", ")}. Nothing was sent to Advocu.`,
        );
      }

      const res = await advocuFetch(token, `/activities/${encodeURIComponent(activityId)}`, {
        method: "PATCH",
        body: { data: valid.fields },
      });
      if (!res.ok) return fail(res.error);

      const head = `Activity updated.\nid: ${activityId}\ntype: ${checked}`;
      const body = res.body as Activity | null;
      if (body && typeof body === "object" && body.activityId && body.type && body.data?.title !== undefined) {
        return ok(`${head}\n${summarize(body, false)}`);
      }
      return ok(`${head}\n${JSON.stringify(res.body, null, 2)}`);
    },
  );

  return server;
}
