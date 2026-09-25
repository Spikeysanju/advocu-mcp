# Acceptance

v1 is done when every row below is true. Token rows are manual. The owner runs them with their own portal token. Do not commit a token to do it.

## Without a token

| ID | Check | Pass |
| --- | --- | --- |
| A-1 | `GET /health` returns 200 and `{ "ok": true, "name": "advocu" }`. | |
| A-2 | `GET /` does not require auth and does not echo headers. | |
| A-3 | An MCP call with no `Authorization` header does not call Advocu. | |
| A-4 | That call tells the user to put the portal token in the client header. | |
| A-5 | `create_activity_draft` with `type: github-repository` fails locally. | |
| A-6 | `create_activity_draft` with `eventFormat: Virtual` and a `country` drops `country` before any fetch. | |
| A-7 | `create_activity_draft` with `eventFormat: In-Person` and `inPersonAttendees` drops `inPersonAttendees`. | |
| A-8 | A title of 2 characters fails locally. | |
| A-9 | `activityUrl: "not a url"` fails locally. | |
| A-10 | `stories` payload with `activityDate` drops that field. | |
| A-11 | Update body sent to the fetch stub is `{ "data": ... }` and does not contain `type`. | |
| A-12 | Create body sent to the fetch stub is flat. It is not wrapped in `{ "data": ... }`. | |
| A-13 | Logs from a request that included a bearer token do not contain that token. | |
| A-14 | Tool list is exactly `list_activities`, `create_activity_draft`, `update_activity`. | |
| A-15 | `wrangler.jsonc` has no KV, D1, or Durable Object bindings. | |

## With the owner's token

Run against the deployed Worker, or `wrangler dev`, using the header. Do not paste the token into a doc or a test fixture.

| ID | Check | Pass |
| --- | --- | --- |
| B-1 | `list_activities` with `size: 1` returns a summary, not a tag dump. | |
| B-2 | `create_activity_draft` for a real draft returns an id and says it is not submitted. | |
| B-3 | That draft is visible in the Advocu portal as a draft. | |
| B-4 | `update_activity` using the id and type from `list_activities` changes only the field that was sent. | |
| B-5 | A bad token returns the 401 text and does not create a draft. | |
| B-6 | No activity was submitted by the MCP. Submit stays a portal action. | |

## Not required for v1

- A 429 drill.
- Tag membership tests.
- A draft deep link.
