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

-- Three user preferences are enabled by default as requested.
-- These are routing PREFERENCES, not claims of active delivery; runtime requires EA and verified Telegram channel.
CREATE TABLE IF NOT EXISTS site_user_signal_routes (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES site_users(id),
 tradingview_mt5 INTEGER NOT NULL DEFAULT 1 CHECK(tradingview_mt5 IN (0,1)),
 tradingview_telegram INTEGER NOT NULL DEFAULT 1 CHECK(tradingview_telegram IN (0,1)),
 telegram_mt5 INTEGER NOT NULL DEFAULT 1 CHECK(telegram_mt5 IN (0,1)),
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
