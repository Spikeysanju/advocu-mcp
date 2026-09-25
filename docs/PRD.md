# PRD: Advocu MCP

Status: ready to build. v1 only.

Product name: **Advocu MCP**. MCP server name: `advocu`.

## 1. Problem

Logging GDE work means opening Advocu and filling a form. The facts already exist in the chat: title, link, date, what happened. Copying them across is the work this product removes.

The portal already exposes a personal API and a token. There is no MCP in front of it.

## 2. Outcome

From an MCP client, with a portal token in the client config, a GDE can:

1. List their activities.
2. Create a draft for a type the API can write.
3. Update an existing activity.

They still submit the draft in the Advocu portal. This product does not submit.

## 3. Users

| User | Need |
| --- | --- |
| GDE | Turn a chat into a draft. Fix an activity they already logged. |
| MCP client | A remote server at `/mcp` that accepts a bearer token. |
| Builder | A spec that maps 1:1 onto `API.md`. No guessed routes. |

v1 is one deployment, many callers, each with their own token. It is not a multi-program platform. The only base path in the saved page is `/personal-api/v1/gde`.

## 4. User journeys

### J1. Draft a talk

1. The GDE has already put their token in the MCP client header.
2. They say: "I gave a hybrid talk called Agents on the edge in Bengaluru on 1 Sep 2026. 80 people, 40 in the room. Link: https://gdg.community.dev/events/example."
3. The model calls `create_activity_draft` with `type: public-speaking`.
4. The tool returns the draft id and says it is not submitted.
5. The GDE reviews and submits in the portal.

### J2. Draft a post

Same path with `type: content-creation`. Needs a content type, title, link, and date when the user supplied them.

### J3. See what is already logged

1. The GDE asks what they logged this month.
2. The model calls `list_activities` with `from` and `to`.
3. The tool returns a short list: id, type, title, dates. Not the full tag dump.

### J4. Correct an activity

1. The model lists activities and takes `activityId` and `type` from a row.
2. It calls `update_activity` with only the fields that change.
3. The tool patches Advocu and returns the updated summary.

### J5. Bad or missing token

1. The header is missing or Advocu returns 401.
2. No write is attempted on a missing header.
3. The tool tells the user to generate a token in the portal settings and put it in the client header.

## 5. Scope

### In v1

- Remote MCP on Cloudflare Workers, Hono in front, stateless.
- Bearer token forwarded to Advocu. Not stored.
- Three tools, specified in [TOOLS.md](./TOOLS.md).
- Local checks for formats we already know (dates, URLs, enums, conditional event fields).
- Plain errors for 401, 403, 429, and other Advocu failures.
- `GET /health` for deploy checks.

### Out of v1

- Generating or refreshing tokens.
- Submitting, archiving, or deleting a draft or activity. Those routes are not in the saved page.
- Writing `github-repository` or `youtube-video`.
- A token argument on a tool. That would put the secret in the model transcript.
- OAuth, accounts, KV, D1, Durable Objects.
- A web UI.
- Retrying 429s.
- Validating tags against the 81- or 318-value lists. Those lists drift. Pass tags through. If Advocu rejects one, return the error.
- Other programs besides GDE. The base path stays a constant.

## 6. Requirements

Must. A v1 that skips one of these is not done.

| ID | Requirement |
| --- | --- |
| FR-1 | MCP endpoint is `/mcp`. Worker export is the Hono app. |
| FR-2 | Every MCP call requires `Authorization: Bearer <advocu-token>`. Missing header returns a tool or protocol error and does not call Advocu. |
| FR-3 | The same bearer token is sent to `https://api.advocu.com/personal-api/v1/gde`. `Content-Type` is `application/json`. |
| FR-4 | `list_activities` calls `GET /activities` with only the documented query params. |
| FR-5 | `create_activity_draft` calls `POST /activity-drafts/{type}` with a flat JSON body. It does not wrap the body in `{ data }`. |
| FR-6 | `update_activity` calls `PATCH /activities/{activityId}` with `{ data }`. `type` is not sent to Advocu. |
| FR-7 | Draft types are only the seven write types in [TOOLS.md](./TOOLS.md). |
| FR-8 | A successful draft response includes the id and the sentence that it is a draft and is not submitted. |
| FR-9 | The server does not invent metrics, URLs, countries, or dates the user did not provide. Omitted fields are omitted, not sent as empty strings. |
| FR-10 | `country` is sent only when `eventFormat` is `In-Person` or `Hybrid`. `inPersonAttendees` is sent only when `eventFormat` is `Hybrid`. Other values are stripped before the request. |
| FR-11 | Write bodies never include read-only companions: `*_plain_text`, `imageUrl`, `countryIso`, `city`, `cityPlaceId`, `cityState`. |
| FR-12 | 401, 403, and 429 from Advocu are returned as those failures. 429 is not retried. |
| FR-13 | `GET /health` returns 200 without a token. |
| FR-14 | Server instructions tell the model: drafts are not submitted, do not invent numbers, take `activityId` and `type` from `list_activities` before an update. |

Should. Do these unless they block the musts.

| ID | Requirement |
| --- | --- |
| SR-1 | `list_activities` returns a short summary by default. Full `data` only when `verbose` is true. |
| SR-2 | If a list page comes back full (`content.length === size`), say another page may exist. The saved page does not document a total count. |
| SR-3 | `GET /` returns a short plain-text hint: this is the Advocu MCP, tools are at `/mcp`, tokens come from the portal. |
| SR-4 | Known enum fields are rejected locally before the Advocu call. |
| SR-5 | URLs that fail `^https?://` are rejected locally. |

Will not.

| ID | Non-requirement |
| --- | --- |
| NR-1 | No confirm flag on write tools. The MCP client's own approval UI is the confirm. A `confirm: true` argument is fake safety. |
| NR-2 | No second copy of the 318 tags inside the tool description. |
| NR-3 | No background sync, cron, or cache of activities. |

## 7. Product rules the model must follow

These go in the MCP server instructions, word for word enough that the behavior is stable:

- You create Advocu drafts. You do not submit them. Say that after every create.
- Do not invent metrics, attendee counts, countries, or links. Omit the field.
- Do not mark an activity private or public unless the user said so.
- Before `update_activity`, call `list_activities` and copy `activityId` and `type` from that row. Do not guess the id.
- `github-repository` and `youtube-video` can be listed. They cannot be created or updated here.
- If the tool returns 429, stop. Do not call again in the same turn.

## 8. Auth

The credential is the Advocu personal API token from the portal settings page ("Generate your token").

Client config shape:

```json
{
  "mcpServers": {
    "advocu": {
      "url": "https://<worker-host>/mcp",
      "headers": {
        "Authorization": "Bearer <advocu-personal-api-token>"
      }
    }
  }
}
```

A client that cannot send that header is unsupported in v1. Do not fall back to a tool argument.

Details: [SECURITY.md](./SECURITY.md).

## 9. Data rules

Dates:

- Activity dates in bodies are `YYYY-MM-DD`.
- List filters are ISO-8601 timestamps, for example `2026-01-01T00:00:00Z`. `from` is inclusive. `to` is exclusive.
- Pass filters through. Do not rewrite a date into a range. If the format is wrong, return a tool error that states the expected format.

Text limits on writes, from the saved page:

- `title`: 3 to 200 when present.
- `description`, `whyIsSignificant`, `additionalInfo`, `additionalLinks`: max 2000 on draft and update.
- `productDescription`: max 500 on draft and update.
- `activityUrl`: max 500, must look like an http(s) URL.

`private` is a boolean. Omit it unless the user was explicit.

Tags are a string array. Do not validate membership in v1.

## 10. Errors

| Case | What the caller sees |
| --- | --- |
| No Authorization header | Ask for the portal token in the MCP client header. Do not call Advocu. |
| Advocu 401 or 403 | Token was rejected. Generate a new one in portal settings. |
| Advocu 429 | Rate limit is 30 requests per minute per IP. Wait. Do not retry now. |
| Other 4xx or 5xx | Status plus Advocu's response body. Do not wrap it in a success. |
| Local validation failure | What was wrong and the expected shape. Do not call Advocu. |

The saved page does not document the error JSON. Do not invent fields like `error.code`. Return the body as text.

## 11. Rate limit

Advocu counts 30 requests per minute per IP. This Worker calls Advocu from Cloudflare egress, so callers share that bucket. v1 accepts that. Surface 429. Do not add a queue.

One draft is one request. Listing one page is one request. Do not fan out.

## 12. Assumptions

- The portal token is a bearer token accepted by `Authorization: Bearer`.
- `PATCH` picks the activity variant from the stored activity. We do not send `type`.
- A full page means there may be more. This is a hint, not a documented cursor.
- GDE is the only program this deployment serves.

## 13. Open questions

These do not block v1. Do not guess an implementation for them.

| Question | Why it is open |
| --- | --- |
| Exact 401 and 400 body shape | Not in the saved page. |
| Draft deep link in the portal | Not in the saved page. Do not invent a URL. |
| Whether a Worker egress IP makes 30/min too tight for many GDEs | Known risk. Revisit only if 429s show up in real use. |
| Other program base paths besides `/gde` | Not in the saved page. |

## 14. Release bar

v1 ships when [ACCEPTANCE.md](./ACCEPTANCE.md) passes. No token is required to ship the code. A live draft against Advocu is a manual check the owner runs with their own token.

## 15. Doc map

Builder path: [IMPLEMENTATION.md](./IMPLEMENTATION.md), then [TOOLS.md](./TOOLS.md), [API.md](./API.md), [ARCHITECTURE.md](./ARCHITECTURE.md).
