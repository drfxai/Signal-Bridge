
CREATE TABLE IF NOT EXISTS agent_connections (
 id TEXT PRIMARY KEY NOT NULL,
 tenant_id TEXT NOT NULL,
 label TEXT,
 token_sha256 TEXT NOT NULL UNIQUE CHECK(length(token_sha256)=64),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
 account_login TEXT,
 account_server TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 last_connected_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_agent_tenant_status ON agent_connections(tenant_id,status);
