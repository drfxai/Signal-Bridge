-- D1 migration: isolate connection and signal records by tenant.
-- No trade commands or order execution are supported at this stage.
CREATE TABLE IF NOT EXISTS ingress_connections (
 id TEXT PRIMARY KEY NOT NULL,
 tenant_id TEXT NOT NULL,
 provider TEXT NOT NULL CHECK(provider IN ('tradingview')),
 token_sha256 TEXT NOT NULL UNIQUE CHECK(length(token_sha256)=64),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS received_signals (
 id TEXT PRIMARY KEY NOT NULL,
 tenant_id TEXT NOT NULL,
 connection_id TEXT NOT NULL REFERENCES ingress_connections(id),
 external_signal_id TEXT NOT NULL,
 payload_sha256 TEXT NOT NULL CHECK(length(payload_sha256)=64),
 normalized_json TEXT NOT NULL,
 received_at TEXT NOT NULL,
 expires_at TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK(status='RECEIVED'),
 UNIQUE(connection_id,external_signal_id)
);
CREATE INDEX IF NOT EXISTS idx_signals_tenant_time ON received_signals(tenant_id,received_at);
CREATE INDEX IF NOT EXISTS idx_signals_connection_time ON received_signals(connection_id,received_at);
