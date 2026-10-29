-- Durable status of explicitly confirmed, demo-only connectivity tests.
CREATE TABLE IF NOT EXISTS connection_tests (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL,
 agent_id TEXT NOT NULL,
 command_id TEXT UNIQUE,
 status TEXT NOT NULL DEFAULT 'ARMED' CHECK(status IN ('ARMED','OPEN','CLOSED','CLOSE_FAILED','REJECTED')),
 broker_ticket TEXT,
 detail TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_connection_test ON connection_tests(agent_id)
 WHERE status IN ('ARMED','OPEN','CLOSE_FAILED');
