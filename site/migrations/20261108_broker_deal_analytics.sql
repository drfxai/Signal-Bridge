-- FX Replay-grade broker-deal ledger: append-only, idempotent, account-bound.
-- Apply ONLY after the D1 daily read quota has reset and production read efficiency is verified.
-- No trading commands, licenses or historical records are modified.
CREATE TABLE IF NOT EXISTS broker_deals (
 tenant_id TEXT NOT NULL,
 agent_id TEXT NOT NULL,
 account_login TEXT NOT NULL,
 account_server TEXT NOT NULL,
 deal_ticket TEXT NOT NULL,
 position_id TEXT NOT NULL,
 order_ticket TEXT NOT NULL,
 deal_time_ms INTEGER NOT NULL,
 side TEXT NOT NULL CHECK(side IN ('B','S')),
 entry_kind TEXT NOT NULL CHECK(entry_kind IN ('I','O','R','C')),
 symbol TEXT NOT NULL,
 volume REAL NOT NULL CHECK(volume>0),
 price REAL NOT NULL CHECK(price>0),
 profit REAL NOT NULL,
 commission REAL NOT NULL,
 swap REAL NOT NULL,
 fee REAL NOT NULL,
 signal_tag TEXT,
 ingested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (agent_id,account_login,account_server,deal_ticket)
);
CREATE INDEX IF NOT EXISTS idx_broker_deals_tenant_time
 ON broker_deals(tenant_id,deal_time_ms DESC,deal_ticket DESC);
CREATE INDEX IF NOT EXISTS idx_broker_deals_agent_position
 ON broker_deals(agent_id,account_login,account_server,position_id,deal_time_ms);
-- Expression index ensures provenance checks do not reintroduce table scans.
CREATE INDEX IF NOT EXISTS idx_commands_deal_signal_tag
 ON commands(tenant_id,agent_id,json_extract(payload_json,'$.correlation_tag'))
 WHERE source_type IN ('tradingview','telegram');
