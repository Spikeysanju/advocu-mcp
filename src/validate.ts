import * as z from "zod";

export const DRAFT_TYPES = [
  "content-creation",
  "interaction-with-googlers",
  "mentoring",
  "product-feedback-given",
  "public-speaking",
  "stories",
  "workshop",
] as const;

export type DraftType = (typeof DRAFT_TYPES)[number];

export const READ_ONLY_TYPES = ["github-repository", "youtube-video"] as const;

export const EVENT_FORMATS = ["In-Person", "Virtual", "Hybrid"] as const;

export function isDraftType(value: string): value is DraftType {
  return (DRAFT_TYPES as readonly string[]).includes(value);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const URL_RE = /^https?:\/\//;

const title = z.string().min(3, "title must be 3 to 200 characters").max(200, "title must be 3 to 200 characters");
const text2000 = (name: string) => z.string().max(2000, `${name} must be at most 2000 characters`);
const tags = z.array(z.string(), { error: "tags must be an array of strings" });
const privateFlag = z.boolean({ error: "private must be a boolean" });
const url = z
  .string()
  .max(500, "activityUrl must be at most 500 characters")
  .regex(URL_RE, "activityUrl must be an http(s) URL, for example https://example.com/event");
const activityDate = z.string().refine(isCalendarDate, "activityDate must be YYYY-MM-DD, for example 2026-09-01");
const metric = (name: string, min: number) =>
  z.number({ error: `${name} must be an integer` }).int(`${name} must be an integer`).min(min, `${name} must be at least ${min}`);
const oneOf = (name: string, values: readonly [string, ...string[]]) =>
  z.enum(values, { error: `${name} must be one of: ${values.join(", ")}` });

function isCalendarDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const eventFields = (attendeesLabel: string) =>
  z.object({
    title,
    description: text2000("description"),
    tags,
    metrics: z.object({ attendees: metric(`metrics.attendees (${attendeesLabel})`, 1) }).partial(),
    eventFormat: oneOf("eventFormat", EVENT_FORMATS),
    country: z.string().min(1, "country must be 1 to 100 characters").max(100, "country must be 1 to 100 characters"),
    inPersonAttendees: metric("inPersonAttendees", 0),
    activityDate,
    activityUrl: url,
    additionalInfo: text2000("additionalInfo"),
    private: privateFlag,
  });

// One allow-list per draft type, from TOOLS.md. Unknown keys are stripped by zod's default object mode.
const SCHEMAS: Record<DraftType, z.ZodObject> = {
  "content-creation": z.object({
    contentType: oneOf("contentType", ["Articles", "Books", "Code contribution", "Demos", "Newsletters", "Podcasts", "Videos"]),
    title,
    description: text2000("description"),
    tags,
    metrics: z.object({ readers: metric("metrics.readers", 1) }).partial(),
    activityDate,
    activityUrl: url,
    additionalInfo: text2000("additionalInfo"),
    private: privateFlag,
  }),
  "interaction-with-googlers": z.object({
    title,
    description: text2000("description"),
    format: oneOf("format", [
      "Survey",
      "Video feedback",
      "In-person feedback sessions",
      "Online feedback sessions",
      "Feedback summits",
      "User study / focus group",
      "Feedback submissions",
      "Other",
    ]),
    interactionType: oneOf("interactionType", [
      "Product feedback (research studies, roadmap input, Customer Advisory Boards, EAP)",
      "File bugs / help out with finding bugs",
      "GitHub",
      "Stack Overflow",
      "Industry",
      "Other interactions with Google Product Teams",
    ]),
    tags,
    metrics: z.object({ timeSpent: metric("metrics.timeSpent (minutes)", 1) }).partial(),
    activityDate,
    additionalInfo: text2000("additionalInfo"),
    additionalLinks: text2000("additionalLinks"),
    private: privateFlag,
  }),
  mentoring: eventFields("people mentored"),
  "product-feedback-given": z.object({
    title,
    description: text2000("description"),
    contentType: oneOf("contentType", ["Early access program", "Product feedback session"]),
    productDescription: z.string().max(500, "productDescription must be at most 500 characters"),
    tags,
    metrics: z.object({ timeSpent: metric("metrics.timeSpent (minutes)", 1) }).partial(),
    activityDate,
    additionalInfo: text2000("additionalInfo"),
    private: privateFlag,
  }),
  "public-speaking": eventFields("people who attended"),
  stories: z.object({
    title,
    description: text2000("description"),
    whyIsSignificant: text2000("whyIsSignificant"),
    significanceType: oneOf("significanceType", [
      "Diversity & Inclusion",
      "Helping Business",
      "Social Impact",
      "Feedback to Google",
      "Community Leading",
      "Technology / Open source",
    ]),
    activityUrl: url,
    tags,
    metrics: z.object({ impact: metric("metrics.impact", 1) }).partial(),
    additionalInfo: text2000("additionalInfo"),
    private: privateFlag,
  }),
  workshop: eventFields("people trained"),
};

export const ALLOWED_FIELDS: Record<DraftType, string[]> = Object.fromEntries(
  DRAFT_TYPES.map((t) => [t, Object.keys(SCHEMAS[t].shape)]),
) as Record<DraftType, string[]>;

export type ValidationResult = { ok: true; fields: Record<string, unknown> } | { ok: false; error: string };

/** Drop empty strings, nulls, and empty nested objects so omitted fields stay omitted. */
function dropEmpty(value: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      const nested = dropEmpty(v as Record<string, unknown>);
      if (Object.keys(nested).length > 0) out[key] = nested;
      continue;
    }
    out[key] = v;
  }
  return out;
}

/**
 * Strip and check write fields for one draft type.
 * Unknown keys, empty strings, read-only companions, and event fields that do not fit
 * the eventFormat are removed. Everything else is checked against the TOOLS.md rules.
 */
export function validateFields(type: DraftType, input: unknown): ValidationResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, error: "fields must be an object." };
  }
  const schema = SCHEMAS[type];
  const cleaned = dropEmpty(input as Record<string, unknown>);

  // Every field is optional; validate only what is present.
  const parsed = schema.partial().safeParse(cleaned);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `- ${i.message}`).join("\n");
    return { ok: false, error: `Invalid fields for ${type}. Nothing was sent to Advocu.\n${issues}` };
  }

  const fields = dropEmpty(parsed.data as Record<string, unknown>);
  if ("eventFormat" in schema.shape || "country" in schema.shape) {
    const format = fields.eventFormat;
    if (format !== "In-Person" && format !== "Hybrid") delete fields.country;
    if (format !== "Hybrid") delete fields.inPersonAttendees;
  }
  return { ok: true, fields };
}
