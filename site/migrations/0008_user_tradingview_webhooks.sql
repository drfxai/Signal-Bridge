-- 0008: Each verified DrFX user owns one recoverable TradingView credential.
-- The raw opaque path token is encrypted with the existing 256-bit LICENSE_VAULT_KEY.
-- Never store it in logs, plaintext columns or telemetry.
CREATE TABLE IF NOT EXISTS site_tradingview_webhooks (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES site_users(id),
 connection_id TEXT NOT NULL UNIQUE REFERENCES ingress_connections(id),
 encrypted_token TEXT NOT NULL,
 nonce TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_site_tv_connection ON site_tradingview_webhooks(connection_id);
