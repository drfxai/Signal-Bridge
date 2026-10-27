
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const ENCODER = new TextEncoder();

export function parseBearer(request) {
  const value = request.headers.get('authorization') || '';
  const match = value.match(/^Bearer\s+([A-Za-z0-9_-]{43})$/i);
  return match ? match[1] : null;
}

export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest('SHA-256', ENCODER.encode(text));
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,'0')).join('');
}

export async function authenticateAgent(request, env) {
  const token = parseBearer(request);
  if (!token || !TOKEN_RE.test(token) || !env?.DB) return null;
  const hash = await sha256Hex(token);
  return env.DB.prepare(
    "SELECT id,tenant_id,label FROM agent_connections WHERE token_sha256=? AND status='active' LIMIT 1"
  ).bind(hash).first();
}
