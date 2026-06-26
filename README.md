# ESAIP AI Assistant

> Bilingual chat assistant for ESAIP students and faculty, powered by Claude.

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Lint](https://github.com/AR-base/esaip-ai-assistant/actions/workflows/lint.yml/badge.svg)
![Vercel](https://img.shields.io/badge/deploy-vercel-black.svg)
![Claude](https://img.shields.io/badge/model-Claude%20Haiku%204.5-orange.svg)

A small bilingual (FR / EN) assistant for ESAIP. Students get help understanding their programmes, schedules, and coursework. Faculty get a teaching-tools companion. The Anthropic API key never leaves the server.

| | |
|---|---|
| **Live** | https://esaip-ai-assistant.vercel.app |
| **Frontend** | Static HTML + CSS + vanilla JS |
| **Backend** | Vercel Edge Function (`api/chat.js`) |
| **Model** | Claude Haiku 4.5 (Sonnet 4.5 optional) |
| **Auth** | Shared school passwords (student / faculty roles) |

---

## Features

- **Bilingual** — full FR / EN parity in the UI and prompts.
- **Streaming replies** — server-sent events from Anthropic relayed straight to the browser.
- **Two roles** — different system prompts and quick-start chips for students vs faculty.
- **File attachments** — upload an image, PDF, or text document (up to 5 MB) and ask questions about it.
- **Markdown rendering** — bold, italics, code, links, tables, lists, and inline headings, all HTML-escaped before any pattern runs.
- **Theme + history** — dark mode toggle, conversation export to `.txt`.
- **Same-domain by design** — frontend and backend share the Vercel domain, so legitimate browser traffic needs no CORS header at all.

## Security posture

| Concern | What's in place |
|---|---|
| API key exposure | Held in Vercel env var; only the Edge Function reads it |
| XSS via model output | Inputs are HTML-escaped *before* markdown patterns run; link regex forbids quotes; anchors get `rel="noopener noreferrer"` |
| Password storage | `sessionStorage`, not `localStorage` — dies with the tab |
| Brute-force auth | Separate rate-limit bucket for failed-auth attempts (10 / hr / IP) |
| Constant-time compare | Password equality runs on SHA-256 digests, not raw `===` |
| CORS abuse | Optional `ALLOWED_ORIGIN` allowlist; no `*` |
| Body amplification | Per-message text cap and per-content-block size cap |
| Upstream error leakage | Anthropic errors are wrapped in a generic 502 — never proxied verbatim |
| Transport / headers | HSTS, CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy set in `vercel.json` |

See [SECURITY.md](SECURITY.md) for the reporting policy.

## Architecture

```
  Browser                           Vercel Edge                     Anthropic
  ───────                           ───────────                     ─────────
  js/app.js   ── POST /api/chat ─► api/chat.js  ── POST /messages ─► Claude API
              ◄── SSE stream ────                ◄── SSE stream ────
```

All UI logic lives in `js/app.js` (one orchestrator, no framework). The course catalog (`COURSE_DATA`) is embedded in the system prompt with `cache_control: ephemeral` so prompt caching cuts the cost of repeated queries.

## Run locally

```bash
npm i -g vercel
cp .env.example .env.local      # paste your ANTHROPIC_API_KEY + STUDENT_PASSWORD + FACULTY_PASSWORD
vercel dev
```

Visit `http://localhost:3000`.

> ⚠️ Don't open `index.html` directly with `file://` — the chat needs `/api/chat`, which only exists when `vercel dev` is running.

## Deploy to Vercel

Full step-by-step in [DEPLOY-VERCEL.md](DEPLOY-VERCEL.md). The short version:

```bash
vercel                          # initial deploy
vercel env add ANTHROPIC_API_KEY
vercel env add STUDENT_PASSWORD
vercel env add FACULTY_PASSWORD
vercel env add ALLOWED_ORIGIN   # optional; e.g. https://esaip-ai-assistant.vercel.app
vercel --prod
```

Generate the passwords from a real RNG, not a memorable phrase:

```bash
openssl rand -base64 24
```

## Project layout

```
api/chat.js          Edge function — auth, rate-limit, CORS, Claude proxy
js/app.js            Frontend orchestrator (rendering, streaming, file upload, i18n)
css/app.css          Styles + design tokens, dark mode
index.html           Markup + chip / role / language affordances
vercel.json          Routing + response headers (CSP, HSTS, XFO, …)
DEPLOY-VERCEL.md     Long-form deployment guide
SECURITY.md          Reporting policy
```

## Cost

Claude Haiku 4.5 at $1 / $5 per million tokens. A typical chat turn is ~$0.001. Set a spending limit in the Anthropic console; the Edge function caps `max_tokens` at 2000 anyway.

## License

MIT — see [LICENSE](LICENSE).
