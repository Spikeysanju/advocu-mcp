# MCP tool contract

This is the build contract. Names and shapes below are v1. Do not add a fourth tool.

Server:

- name: `advocu`
- version: `0.1.0`
- endpoint: `/mcp`

Server instructions (put this on the MCP server so the model sees it):

```
Advocu MCP creates drafts and updates activities on the GDE personal API. It does not submit them.
After every create, say the activity is a draft and is not submitted.
Do not invent metrics, attendee counts, countries, cities, or links. Omit a field the user did not give you.
Do not set private unless the user asked for private or public.
Before update_activity, call list_activities and copy activityId and type from that row.
github-repository and youtube-video can be listed. They cannot be created or updated.
If a tool returns HTTP 429, stop. Do not call Advocu again in this turn.
```

Auth on every tool call is the request header `Authorization: Bearer <token>`. It is not a tool argument.

## Shared types

```ts
type DraftType =
  | "content-creation"
  | "interaction-with-googlers"
  | "mentoring"
  | "product-feedback-given"
  | "public-speaking"
  | "stories"
  | "workshop";

type EventFormat = "In-Person" | "Virtual" | "Hybrid";
```

Write fields the server may send, by type. All are optional. Drop unknown keys. Drop empty strings.

### content-creation

`POST /activity-drafts/content-creation`

| Field | Rule |
| --- | --- |
| `contentType` | `Articles`, `Books`, `Code contribution`, `Demos`, `Newsletters`, `Podcasts`, `Videos` |
| `title` | 3 to 200 chars |
| `description` | max 2000 |
| `tags` | string array |
| `metrics.readers` | integer, minimum 1 |
| `activityDate` | `YYYY-MM-DD` |
| `activityUrl` | http(s) URL, max 500 |
| `additionalInfo` | max 2000 |
| `private` | boolean |

### interaction-with-googlers

`POST /activity-drafts/interaction-with-googlers`

| Field | Rule |
| --- | --- |
| `title` | 3 to 200 |
| `description` | max 2000 |
| `format` | `Survey`, `Video feedback`, `In-person feedback sessions`, `Online feedback sessions`, `Feedback summits`, `User study / focus group`, `Feedback submissions`, `Other` |
| `interactionType` | `Product feedback (research studies, roadmap input, Customer Advisory Boards, EAP)`, `File bugs / help out with finding bugs`, `GitHub`, `Stack Overflow`, `Industry`, `Other interactions with Google Product Teams` |
| `tags` | string array |
| `metrics.timeSpent` | integer minutes, minimum 1 |
| `activityDate` | `YYYY-MM-DD` |
| `additionalInfo` | max 2000 |
| `additionalLinks` | max 2000 |
| `private` | boolean |

### mentoring

`POST /activity-drafts/mentoring`

| Field | Rule |
| --- | --- |
| `title` | 3 to 200 |
| `description` | max 2000 |
| `tags` | string array |
| `metrics.attendees` | integer, minimum 1. People mentored. |
| `eventFormat` | `In-Person`, `Virtual`, `Hybrid` |
| `country` | 1 to 100. Send only for `In-Person` or `Hybrid`. |
| `inPersonAttendees` | integer, minimum 0. Send only for `Hybrid`. |
| `activityDate` | `YYYY-MM-DD` |
| `activityUrl` | http(s) URL, max 500 |
| `additionalInfo` | max 2000 |
| `private` | boolean |

### product-feedback-given

`POST /activity-drafts/product-feedback-given`

| Field | Rule |
| --- | --- |
| `title` | 3 to 200 |
| `description` | max 2000 |
| `contentType` | `Early access program`, `Product feedback session` |
| `productDescription` | max 500 |
| `tags` | string array |
| `metrics.timeSpent` | integer minutes, minimum 1 |
| `activityDate` | `YYYY-MM-DD` |
| `additionalInfo` | max 2000 |
| `private` | boolean |

### public-speaking

`POST /activity-drafts/public-speaking`

Same fields as mentoring. `metrics.attendees` means people who attended the talk. `activityUrl` is the event link.

### stories

`POST /activity-drafts/stories`

| Field | Rule |
| --- | --- |
| `title` | 3 to 200 |
| `description` | max 2000 |
| `whyIsSignificant` | max 2000 |
| `significanceType` | `Diversity & Inclusion`, `Helping Business`, `Social Impact`, `Feedback to Google`, `Community Leading`, `Technology / Open source` |
| `activityUrl` | http(s) URL, max 500 |
| `tags` | string array |
| `metrics.impact` | integer, minimum 1 |
| `additionalInfo` | max 2000 |
| `private` | boolean |

No `activityDate` on this draft route. Do not send one.

### workshop

`POST /activity-drafts/workshop`

Same fields as public-speaking. `metrics.attendees` means people trained. `activityUrl` is optional in the saved page. Still validate it when present.

## Tool: list_activities

Calls `GET /activities`.

Input:

| Field | Type | Rule |
| --- | --- | --- |
| `from` | string, optional | ISO-8601 timestamp. Inclusive. Example `2026-01-01T00:00:00Z`. |
| `to` | string, optional | ISO-8601 timestamp. Exclusive. |
| `updatedAfter` | string, optional | ISO-8601 timestamp. |
| `page` | integer, optional | Default 0. Minimum 0. |
| `size` | integer, optional | Default 10. Minimum 1. Maximum 100. |
| `verbose` | boolean, optional | Default false. |

Query string only includes `from`, `to`, `updatedAfter`, `page`, `size`. Never send `verbose` to Advocu.

Output, text, when `verbose` is false:

```
page 0, size 10, returned 2
Another page may exist.
- id: <activityId>
  type: public-speaking
  title: Agents on the edge
  submissionDate: 2026-09-01T00:00:00Z
  updatedDate: 2026-09-02T00:00:00Z
  private: false
  activityUrl: https://example.com/event
```

Title comes from `data.title` when present. Skip a line when the field is missing. If `content.length < size`, do not claim another page exists. If it equals `size`, add "Another page may exist."

When `verbose` is true, append the `data` object as JSON after each summary. Still do not dump undocumented pagination fields.

Empty page:

```
page 0, size 10, returned 0
No activities in this page.
```

## Tool: create_activity_draft

Calls `POST /activity-drafts/{type}`.

Input:

| Field | Type | Rule |
| --- | --- | --- |
| `type` | DraftType | Required. Path segment. Not part of the JSON body. |
| `fields` | object | Required. Keys from that type's table only. |

Use a discriminated union on `type` if the SDK makes that natural. A flat `fields` object plus server-side stripping is also fine. The wire body to Advocu is the stripped fields object. No wrapper.

Local rejects, before fetch:

- unknown `type`
- enum value not in the table
- title present and shorter than 3 or longer than 200
- text field over its max
- bad date or URL
- metric present and below its minimum
- `inPersonAttendees` when format is not `Hybrid` — strip, do not error
- `country` when format is `Virtual` or missing — strip, do not error

Success text:

```
Draft created. It is not submitted.
id: <id>
type: public-speaking
Review it in the Advocu portal before submitting.
```

If Advocu returns 2xx without an `id` string, return the raw JSON and still say it is a draft and is not submitted.

## Tool: update_activity

Calls `PATCH /activities/{activityId}`.

Input:

| Field | Type | Rule |
| --- | --- | --- |
| `activityId` | string | Required. Path only. |
| `type` | DraftType | Required locally so the server knows which fields are legal. Not sent to Advocu. |
| `fields` | object | At least one allowed field. Same keys as that type's draft table. All optional. |

Wire body:

```json
{ "data": { } }
```

`data` contains only stripped, present fields.

Success text:

```
Activity updated.
id: <activityId>
type: content-creation
```

Then a short summary from the response if Advocu returns `activityId`, `type`, and `data.title`. If the response shape differs, return the raw JSON after the first two lines.

Do not offer this tool for `github-repository` or `youtube-video`. If the model passes those types, reject locally: "This type cannot be updated through the MCP. The saved API page has no update model for it."

## Error text

Return MCP tool errors (`isError: true`) for local failures and for Advocu status >= 400.

| Case | Text |
| --- | --- |
| Missing bearer token | `Missing Authorization: Bearer token. Add the Advocu personal API token from the portal settings page to the MCP client header.` |
| 401 or 403 | `Advocu rejected the token (HTTP <status>). Generate a new token in the Advocu portal settings and update the MCP client header.` |
| 429 | `Advocu rate limit reached (HTTP 429, 30 requests per minute per IP). Wait. Do not retry now.` |
| Other HTTP error | `Advocu returned HTTP <status>.` plus the response body, truncated at 2000 characters. |
| Network failure | `Could not reach Advocu. <error message>` |

Do not include the token in any of these strings.

## Health

`GET /health` is not a tool.

```json
{ "ok": true, "name": "advocu" }
```

No auth.
