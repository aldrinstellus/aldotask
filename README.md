# AldoTask

Simple project control room for Codex-led project coordination.

- Custodian: Codex
- Worker: Claude Code
- Live POC: project status, next action, blockers, decisions, and activity

## Local

Open `index.html` directly or serve the folder with any static web server.

## Handoff

- **Custodian: Codex** — owns project direction, intake, and acceptance decisions for AldoTask.
- **Worker: Claude Code** — executes build/maintenance tasks on request; preserves the static dashboard as-is unless the custodian directs a change.
- Current state: static single-page dashboard (`index.html`), no build step, no deploy pipeline wired in this repo.
