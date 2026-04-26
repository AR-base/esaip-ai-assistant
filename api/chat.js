// Vercel Edge Serverless Function — ESAIP AI Backend
// Exposed at /api/chat on the same Vercel domain (zero CORS issues)

export const config = { runtime: 'edge' };

const RATE_LIMIT_PER_HOUR = 30;
const MAX_TOKENS_PER_REQUEST = 2000;
const ALLOWED_MODELS = ['claude-haiku-4-5', 'claude-sonnet-4-5'];

// In-memory rate limit — resets on cold start; acceptable for low traffic
const rateMap = new Map();

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (request.method === 'GET') {
    const pwd = request.headers.get('x-school-password');
    if (pwd) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
      const hourBucket = Math.floor(Date.now() / 3_600_000);
      const key = `auth:${ip}:${hourBucket}`;
      const count = rateMap.get(key) || 0;
      if (count >= RATE_LIMIT_PER_HOUR) {
        return err('Limite atteinte. Réessayez plus tard.', 429);
      }
      rateMap.set(key, count + 1);
      if (pwd === process.env.STUDENT_PASSWORD) return ok({ valid: true, role: 'student' });
      if (pwd === process.env.FACULTY_PASSWORD) return ok({ valid: true, role: 'faculty' });
      return err('Mot de passe invalide / Invalid password', 401);
    }
    return ok({ status: 'ok', service: 'ESAIP AI Backend', version: '1.0' });
  }

  if (request.method !== 'POST') {
    return err('Method not allowed', 405);
  }

  const pwd = request.headers.get('x-school-password');
  if (!pwd || (pwd !== process.env.STUDENT_PASSWORD && pwd !== process.env.FACULTY_PASSWORD)) {
    return err('Mot de passe ESAIP invalide / Invalid ESAIP password', 401);
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const hourBucket = Math.floor(Date.now() / 3_600_000);
  const key = `${ip}:${hourBucket}`;
  const count = rateMap.get(key) || 0;
  if (count >= RATE_LIMIT_PER_HOUR) {
    return err(`Limite atteinte (${RATE_LIMIT_PER_HOUR} req/h). Réessayez plus tard.`, 429);
  }
  rateMap.set(key, count + 1);

  let body;
  try {
    body = await request.json();
  } catch {
    return err('Invalid JSON body', 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return err('Missing or invalid messages array', 400);
  }
  if (body.messages.length > 50) {
    return err('Conversation too long (max 50 messages)', 400);
  }

  const model = ALLOWED_MODELS.includes(body.model) ? body.model : 'claude-haiku-4-5';
  const maxTokens = Math.min(body.max_tokens || 1500, MAX_TOKENS_PER_REQUEST);

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        stream: true,
        system: body.system || '',
        messages: body.messages,
      }),
    });

    if (!upstream.ok) {
      const data = await upstream.json();
      return ok(data, upstream.status);
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e) {
    return err('Backend error: ' + e.message, 500);
  }
}

function ok(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function err(message, status) {
  return ok({ error: { message } }, status);
}
