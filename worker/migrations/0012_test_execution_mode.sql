-- Dedicated account-bound test execution mode; regular routes retain demo-only settings.
CREATE TABLE commands_v27 (
 id TEXT PRIMARY KEY NOT NULL,
 tenant_id TEXT NOT NULL,
 signal_id TEXT,
 source_type TEXT NOT NULL CHECK(source_type IN ('tradingview','telegram','test')),
 source_ref TEXT,
 agent_id TEXT NOT NULL,
 execution_mode TEXT NOT NULL CHECK(execution_mode IN ('dry_run','demo_execute','test_execute')),
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

INSERT INTO commands_v27 SELECT * FROM commands;
DROP TABLE commands;
ALTER TABLE commands_v27 RENAME TO commands;
CREATE UNIQUE INDEX IF NOT EXISTS idx_commands_signal_agent_unique ON commands(signal_id,agent_id) WHERE signal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commands_agent_time ON commands(agent_id,created_at);

CREATE UNIQUE INDEX idx_commands_telegram_source_unique ON commands(source_ref,agent_id) WHERE source_type='telegram' AND source_ref IS NOT NULL;
