-- Personal EA activation codes are 256-bit random secrets.
-- Only SHA-256 digests are stored; never store plaintext activation codes in D1.
-- Issued licenses start on the first successfully bound MT5 account.
CREATE TABLE IF NOT EXISTS ea_licenses (
 id TEXT PRIMARY KEY NOT NULL,
 agent_id TEXT NOT NULL UNIQUE REFERENCES agent_connections(id),
 token_sha256 TEXT NOT NULL UNIQUE CHECK(length(token_sha256)=64),
 plan TEXT NOT NULL CHECK(plan IN ('trial','quarterly','annual')),
 duration_modifier TEXT NOT NULL CHECK(duration_modifier IN ('+1 month','+3 months','+1 year')),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
 account_login TEXT,
 account_server TEXT,
 activated_at TEXT,
 expires_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 last_connected_at TEXT,
 CHECK ((account_login IS NULL AND account_server IS NULL) OR
        (account_login IS NOT NULL AND account_server IS NOT NULL)),
 CHECK ((activated_at IS NULL AND expires_at IS NULL) OR
        (activated_at IS NOT NULL AND expires_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_ea_licenses_agent_status
 ON ea_licenses(agent_id,status,expires_at);
