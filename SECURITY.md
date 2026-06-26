# Security Policy

Thank you for taking the time to look at this. If you find a vulnerability that lets a third party read the API key, bypass authentication, run arbitrary script in another user's browser, or burn the project's Anthropic budget, please report it privately first.

## Reporting

Email **psaianish2001@gmail.com** with:

- A brief description of the issue and its impact.
- Steps to reproduce, ideally with a minimal `curl` or browser repro.
- The commit SHA you tested against.

You should hear back within 72 hours. I'll keep you posted in writing through the disclosure window — please don't open a public issue or PR until we've agreed it's safe to.

## Scope

In scope:

- `api/chat.js` — the Edge function. Auth, rate-limit, CORS, body validation, upstream proxying.
- `js/app.js` — frontend rendering, in particular the markdown-to-HTML path (`fmt()`) and any other code that writes to `innerHTML`.
- `index.html` — markup, inline event handlers, attribute injection.
- `vercel.json` — response-header policy (CSP, HSTS, XFO, etc.).
- `DEPLOY-VERCEL.md` and `README.md` — anything in the docs that would push an operator toward an insecure configuration.

Out of scope:

- Issues that require the attacker to already control the deployed Vercel project or its env vars.
- Social-engineering an operator into revealing the school password.
- Rate-limit gaps when the shared in-memory bucket resets on Vercel cold start — this is documented in the README's *Hardening* note and the right fix is Vercel KV / Upstash.
- Vulnerabilities in upstream dependencies (Anthropic API, Vercel runtime, browser engines) — please report those upstream.

## Hardening checklist

If you operate a deployment of this project, the README and `DEPLOY-VERCEL.md` cover the env vars to set. The non-obvious ones:

- `ALLOWED_ORIGIN` — comma-separated list of allowed browser origins. Without it, every origin is accepted.
- `STUDENT_PASSWORD` / `FACULTY_PASSWORD` — generate from a real RNG, not a memorable phrase.
- For real traffic, replace the in-memory rate-limit Map with a shared store (Vercel KV / Upstash) keyed on caller IP.

## Acknowledgements

If you'd like to be credited for a finding, say so in your initial email. Otherwise reports are handled privately.
