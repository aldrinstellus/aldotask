# AldoTask

Simple project control room for Codex-led project coordination.

- Custodian: Codex
- Worker: Claude Code
- Live POC: project status, next action, blockers, decisions, and activity

## Local

Open `index.html` directly or serve the folder with any static web server.

## Auth (Google OAuth, single-owner)

The dashboard is gated by Google OAuth. Only the Google account matching `ALLOWED_EMAIL` may enter; everyone else gets a 403 after sign-in. Sessions are HMAC-signed HttpOnly cookies (`Secure; SameSite=Lax`, 24 h), verified both in `middleware.js` (page gate) and the API endpoints.

Endpoints (Vercel serverless functions):

- `GET /api/auth/login` — redirects to Google (CSRF `state` cookie, `select_account`)
- `GET /api/auth/callback` — code exchange, allow-list check, mints the session cookie
- `GET /api/auth/me` — session check (`200 {authenticated,email}` / `401`)
- `GET /api/auth/logout` — clears the session cookie

Required environment variables (set in Vercel project settings — never committed):

| Var | Purpose |
|---|---|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth 2.0 web client |
| `ALLOWED_EMAIL` | the one Google account allowed in |
| `AUTH_SECRET` | long random string for session HMAC signing |
| `APP_URL` | canonical origin, e.g. `https://<project>.vercel.app` (no trailing slash) |

Register `${APP_URL}/api/auth/callback` as an authorized redirect URI on the Google OAuth client. All endpoints fail closed (500 "not configured") when env is missing. Local static preview (`python3 -m http.server`) still works — without the auth backend the page skips the session check.

## Handoff

- **Custodian: Codex** — owns project direction, intake, and acceptance decisions for AldoTask.
- **Worker: Claude Code** — executes build/maintenance tasks on request; preserves the static dashboard as-is unless the custodian directs a change.
- Current state: static single-page dashboard (`index.html`), no build step, no deploy pipeline wired in this repo.
