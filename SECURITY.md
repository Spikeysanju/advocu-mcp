# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| `main` | Yes |
| Latest GitHub release | Yes |
| Older tags | No |

## Reporting a vulnerability

Email [hello@thisux.com](mailto:hello@thisux.com) with the subject `[security] advocu-mcp`.

Include what you found, how to reproduce it, and the impact. Do not open a public GitHub issue, discussion, or pull request for a security-sensitive finding. Do not include a live Advocu personal API token in the report. A redacted header shape is enough.

We will acknowledge the report, investigate, and follow up with a fix or a reasoned decline. Please give us a chance to patch before any public write-up.

## Product rules

Token handling for this Worker is specified in [docs/SECURITY.md](docs/SECURITY.md). In short: the caller's portal token is forwarded per request and never stored, logged, or accepted as a tool argument. Drafts are never submitted.
