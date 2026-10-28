import { parseAgentToken, sha256Hex } from './agent-auth.mjs';

export const EA_LICENSE_PLANS = Object.freeze({
 trial: '+1 month',
 quarterly: '+3 months',
 annual: '+1 year',
});

// The key is an opaque, uniformly random 256-bit credential, not a reversible
// serial derived from an email, MT5 account number or other personal data.
export async function authenticateEaLicense(request, env) {
 const code = parseAgentToken(request);
 if (!code || !env?.DB) return null;
 const hash = await sha256Hex(code);
 return env.DB.prepare(
  "SELECT l.id AS license_id, l.agent_id AS id, a.tenant_id, " +
  "l.account_login, l.account_server, l.plan, l.expires_at, l.token_sha256 AS license_token_sha256 " +
  "FROM ea_licenses l JOIN agent_connections a ON a.id=l.agent_id " +
  "WHERE l.token_sha256=? AND l.status='active' AND a.status='active' " +
  "AND (l.expires_at IS NULL OR l.expires_at>CURRENT_TIMESTAMP) LIMIT 1"
 ).bind(hash).first();
}
