# Security

The only secret in this system is the caller's Advocu personal API token.

## Rules

1. Read the token from `Authorization: Bearer <token>` on the incoming MCP request.
2. Forward that exact token to Advocu on that request.
3. Do not write it to KV, D1, Durable Object storage, logs, analytics, or error strings.
4. Do not put it in a Worker secret. A Worker secret is one token for every caller.
5. Do not accept the token as a tool argument. Tool arguments land in the model transcript.
6. Do not log request or response bodies. Activity text can be private. Headers can hold the token.
7. Logs may include MCP method, Advocu path, HTTP status, and duration. Nothing else from the request.
8. `GET /health` and `GET /` must not echo headers.

## Missing or bad token

- Missing header: reject before `fetch`.
- Advocu 401 or 403: tell the user to rotate the token in the portal. Do not retry with a different credential. There is no other credential.

## Transport

The MCP client talks to the Worker over HTTPS. The Worker talks to `https://api.advocu.com` over HTTPS. Do not add a proxy that stores the request.

v1 does not add an OAuth provider. The portal token is the credential. A client that cannot attach the bearer header is unsupported.

## Data we are willing to see

The Worker sees activity titles, descriptions, and the token in memory for the life of the request. That is required to forward the call. It is not a license to store them.

`private: true` on an activity is Advocu's flag. This server does not add its own visibility model.

## Rate limit is not a security control

30 requests per minute per IP is Advocu's limit. Do not build a bypass. Returning 429 is the correct behavior.

## Out of scope

- Token encryption at rest. There is no rest.
- Per-user isolation beyond the token they send.
- Scanning activity text.
