
ALTER TABLE ingress_connections ADD COLUMN agent_id TEXT;
ALTER TABLE ingress_connections ADD COLUMN delivery_mode TEXT NOT NULL DEFAULT 'dry_run'
  CHECK(delivery_mode IN ('dry_run','demo_execute'));

CREATE TABLE IF NOT EXISTS commands (
 id TEXT PRIMARY KEY NOT NULL,
 tenant_id TEXT NOT NULL,
 signal_id TEXT,
 source_type TEXT NOT NULL CHECK(source_type IN ('tradingview','telegram','test')),
 source_ref TEXT,
 agent_id TEXT NOT NULL,
 execution_mode TEXT NOT NULL CHECK(execution_mode IN ('dry_run','demo_execute')),
 payload_json TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'PENDING'
   CHECK(status IN ('PENDING','DELIVERED','PREVIEWED','SUBMITTED','FILLED','BROKER_REJECTED','REJECTED','ACCOUNT_MISMATCH','EXPIRED','ERROR','DUPLICATE')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 delivered_at TEXT,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 broker_ticket TEXT,
 broker_retcode INTEGER,
 last_error TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_commands_signal_agent_unique ON commands(signal_id,agent_id) WHERE signal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commands_agent_time ON commands(agent_id,created_at);

CREATE TABLE IF NOT EXISTS telegram_connections (
 id TEXT PRIMARY KEY NOT NULL,
 tenant_id TEXT NOT NULL,
 label TEXT,
 secret_sha256 TEXT NOT NULL UNIQUE CHECK(length(secret_sha256)=64),
 agent_id TEXT NOT NULL,
 delivery_mode TEXT NOT NULL DEFAULT 'dry_run' CHECK(delivery_mode IN ('dry_run','demo_execute')),
 allowed_chat_id TEXT,
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','revoked')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_telegram_tenant_status ON telegram_connections(tenant_id,status);

CREATE TABLE IF NOT EXISTS telegram_updates (
 id TEXT PRIMARY KEY NOT NULL,
 tenant_id TEXT NOT NULL,
 connection_id TEXT NOT NULL REFERENCES telegram_connections(id),
 update_id INTEGER NOT NULL,
 chat_id TEXT NOT NULL,
 text_sha256 TEXT NOT NULL CHECK(length(text_sha256)=64),
 normalized_json TEXT,
 received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(connection_id,update_id)
);
CREATE INDEX IF NOT EXISTS idx_telegram_updates_conn_time ON telegram_updates(connection_id,received_at);
