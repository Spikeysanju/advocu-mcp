# Vision and mission

## Vision

A GDE logs community work from the chat they already have open. Advocu gets a draft. The portal form is not the starting point.

## Mission

Ship a small remote MCP on Cloudflare Workers that turns the Advocu Personal API into three tools: list activities, create a draft, update an activity. The user brings their own portal token. The server does not keep it.

## Who it is for

A Google Developer Expert who already has an Advocu personal API token for the GDE program.

They are in Claude, Cursor, or another MCP client. They just gave a talk, published a post, ran a workshop, mentored someone, or gave product feedback. They want that captured as an Advocu draft without retyping the form.

They are not looking for a second Advocu UI. They are not looking for a token vault.

## What this is

A pass-through. Advocu already validates and stores the activity. This MCP only:

- takes the caller's bearer token
- maps a small tool call onto the documented routes
- returns Advocu's result in words the model can use

## What this is not

- Not an Advocu account system. Tokens are created in the portal.
- Not a publisher. The API creates drafts. It does not submit them.
- Not a database. Nothing about the user is stored on our side.
- Not a cover for activity types the saved page cannot write (`github-repository`, `youtube-video`).

## Principles

1. **Do not invent API behavior.** If the saved page does not show a route, field, or error shape, do not add one.
2. **Draft means draft.** Every write response says the activity is not submitted.
3. **The user holds the token.** One request, one token, then it is gone.
4. **Small surface.** Three tools. Not one tool per field, and not one tool per activity type.
5. **Fail in the open.** 401 and 429 are returned as those errors. No silent retry.
6. **Do not invent facts.** If the user did not give a metric, a country, or a URL, omit the field. Do not guess a number.

## Success

A GDE can say "draft this talk" in chat and get back an Advocu draft id. They can list recent activities and correct one. A bad token fails before any write. The Worker stores nothing.
