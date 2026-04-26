// Vercel Serverless Function — ESAIP AI Backend
// File location: /api/chat.js
// Vercel will auto-deploy this and expose it at /api/chat

export const config = { runtime: 'edge' };

const RATE_LIMIT_PER_HOUR = 30;
const MAX_TOKENS_PER_REQUEST = 2000;
const ALLOWED_MODELS = ['claude-haiku-4-5', 'claude-sonnet-4-5'];

// Simple in-memory rate limit (resets when function cold-starts; fine for low traffic)
const rateMap = new Map();

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export default async function handler(request) {
  // ── OPTIONS (CORS preflight) ──
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ── Health check ──
  if (request.method === 'GET') {
    return jsonResponse({
      status: 'ok',
      service: 'ESAIP AI Backend (Vercel)',
      version: '1.0',
    }, 200);
  }

  // ── Only POST allowed ──
  if (request.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  // ── Verify school password ──
  const pwd = request.headers.get('x-school-password');
  if (!pwd || pwd !== process.env.SCHOOL_PASSWORD) {
    return jsonError('Mot de passe ESAIP invalide / Invalid ESAIP password', 401);
  }

  // ── Rate limiting per IP ──
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const hourBucket = Math.floor(Date.now() / 3600000);
  const key = `${ip}:${hourBucket}`;
  const count = rateMap.get(key) || 0;
  if (count >= RATE_LIMIT_PER_HOUR) {
    return jsonError(`Limite atteinte (${RATE_LIMIT_PER_HOUR} requêtes/heure). Réessayez plus tard.`, 429);
  }
  rateMap.set(key, count + 1);

  // ── Parse request ──
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body', 400);
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonError('Missing or invalid messages array', 400);
  }
  if (body.messages.length > 50) {
    return jsonError('Conversation too long (max 50 messages)', 400);
  }

  const model = ALLOWED_MODELS.includes(body.model) ? body.model : 'claude-haiku-4-5';
  const maxTokens = Math.min(body.max_tokens || 1500, MAX_TOKENS_PER_REQUEST);

  // ── Forward to Anthropic ──
  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: body.system || '',
        messages: body.messages,
      }),
    });

    const data = await claudeResponse.json();
    return jsonResponse(data, claudeResponse.status);
  } catch (err) {
    return jsonError('Backend error: ' + err.message, 500);
  }
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function jsonError(message, status) {
  return jsonResponse({ error: { message } }, status);
}
