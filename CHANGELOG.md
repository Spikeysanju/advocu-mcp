# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- License is the Apache License, Version 2.0. Copyright remains THISUX Private Limited.

## [0.1.0] - 2026-09-25

### Added

- Remote MCP server on Cloudflare Workers for the Advocu GDE Personal API.
- Tools: `list_activities`, `create_activity_draft`, and `update_activity`. Drafts are never submitted.
- Per-request forwarding of the caller's portal token. The token is not stored.
- THISUX community health files.

[Unreleased]: https://github.com/thisuxhq/advocu-mcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/thisuxhq/advocu-mcp/releases/tag/v0.1.0
