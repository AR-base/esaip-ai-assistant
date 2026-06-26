// Vercel Edge Serverless Function — ESAIP AI Backend
// Exposed at /api/chat. Frontend and backend share the same Vercel domain,
// so legitimate browser traffic is same-origin and no CORS header is needed.

export const config = { runtime: 'edge' };

const RATE_LIMIT_PER_HOUR = 30;
const RATE_LIMIT_AUTH_PER_HOUR = 10;  // failed-auth attempts before block
const MAX_TOKENS_PER_REQUEST = 2000;
const MAX_TEXT_MESSAGE_CHARS = 20_000;
const MAX_CONTENT_BLOCK_BYTES = 8 * 1024 * 1024;  // covers a 5 MB file as base64
const ALLOWED_MODELS = ['claude-haiku-4-5', 'claude-sonnet-4-5'];

// In-memory buckets — reset on cold start. Two buckets per IP so a brute-force
// of the password cannot evict legitimate chat budget.
const rateMap = new Map();
const authRateMap = new Map();

function bump(map, key, limit) {
  const count = map.get(key) || 0;
  if (count >= limit) return false;
  map.set(key, count + 1);
  return true;
}

function clientIp(request) {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

function hourBucket() {
  return Math.floor(Date.now() / 3_600_000);
}

// Hash both inputs and compare digests so the comparison runs in constant time
// over a fixed-length value. Removes the practical timing-attack surface even
// though jitter would already make it non-viable in this deployment.
async function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || b.length === 0) return false;
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < 32; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

async function authenticate(pwd) {
  if (!pwd) return null;
  if (await timingSafeEqual(pwd, process.env.STUDENT_PASSWORD || '')) return 'student';
  if (await timingSafeEqual(pwd, process.env.FACULTY_PASSWORD || '')) return 'faculty';
  return null;
}

// Echo the request origin only when it matches the configured allowlist.
// If ALLOWED_ORIGIN is unset, no CORS header is emitted: same-origin browser
// traffic still works, and cross-origin abuse is blocked.
function corsHeadersFor(request) {
  const allowed = (process.env.ALLOWED_ORIGIN || '').trim();
  const origin = request.headers.get('origin');
  if (!allowed || !origin) return {};
  const list = allowed.split(',').map(s => s.trim()).filter(Boolean);
  if (!list.includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-school-password',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function withCommonHeaders(request, extra = {}) {
  return {
    ...corsHeadersFor(request),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...extra,
  };
}

function ok(request, data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: withCommonHeaders(request, { 'Content-Type': 'application/json' }),
  });
}

function err(request, message, status) {
  return ok(request, { error: { message } }, status);
}

// Validate the messages array. Strings get a hard cap. Structured content
// blocks (image, document) cap on serialized size so a single oversized
// payload can't blow up the request.
function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return 'Missing or invalid messages array';
  if (messages.length > 50) return 'Conversation too long (max 50 messages)';
  for (const m of messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) return 'Invalid message role';
    if (typeof m.content === 'string') {
      if (m.content.length > MAX_TEXT_MESSAGE_CHARS) return 'A message is too long';
    } else if (Array.isArray(m.content)) {
      for (const block of m.content) {
        if (!block || typeof block.type !== 'string') return 'Invalid content block';
        if (JSON.stringify(block).length > MAX_CONTENT_BLOCK_BYTES) return 'An attachment is too large';
      }
    } else {
      return 'Invalid message content';
    }
  }
  return null;
}

export default async function handler(request) {
  const ip = clientIp(request);
  const hour = hourBucket();

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: withCommonHeaders(request) });
  }

  // Rate-limit BEFORE auth so wrong-password floods can't drown the bucket
  // and so brute-force attempts are bounded on their own counter.
  if (!bump(rateMap, `${ip}:${hour}`, RATE_LIMIT_PER_HOUR)) {
    return err(request, `Limite atteinte (${RATE_LIMIT_PER_HOUR} req/h). Réessayez plus tard.`, 429);
  }

  if (request.method === 'GET') {
    const pwd = request.headers.get('x-school-password');
    if (!pwd) {
      return ok(request, { status: 'ok', service: 'ESAIP AI Backend', version: '1.0' });
    }
    if (!bump(authRateMap, `auth:${ip}:${hour}`, RATE_LIMIT_AUTH_PER_HOUR)) {
      return err(request, 'Trop de tentatives. Réessayez plus tard.', 429);
    }
    const role = await authenticate(pwd);
    if (!role) return err(request, 'Mot de passe invalide / Invalid password', 401);
    return ok(request, { valid: true, role });
  }

  if (request.method !== 'POST') {
    return err(request, 'Method not allowed', 405);
  }

  // POST also runs through the failed-auth bucket so attackers can't
  // grind passwords using the chat endpoint either.
  const role = await authenticate(request.headers.get('x-school-password'));
  if (!role) {
    bump(authRateMap, `auth:${ip}:${hour}`, RATE_LIMIT_AUTH_PER_HOUR);
    return err(request, 'Mot de passe ESAIP invalide / Invalid ESAIP password', 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return err(request, 'Invalid JSON body', 400);
  }

  const validationError = validateMessages(body.messages);
  if (validationError) return err(request, validationError, 400);

  const model = ALLOWED_MODELS.includes(body.model) ? body.model : 'claude-haiku-4-5';
  const maxTokens = Math.min(body.max_tokens || 1500, MAX_TOKENS_PER_REQUEST);

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        stream: true,
        system: body.system
          ? [{ type: 'text', text: body.system, cache_control: { type: 'ephemeral' } }]
          : [],
        messages: body.messages,
      }),
    });

    if (!upstream.ok) {
      // Hide upstream error details from the client; surface a generic
      // message so we never leak rate-limit / billing internals.
      return err(request, 'Upstream model error. Please try again shortly.', 502);
    }

    return new Response(upstream.body, {
      status: 200,
      headers: withCommonHeaders(request, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      }),
    });
  } catch {
    return err(request, 'Backend error.', 500);
  }
}
