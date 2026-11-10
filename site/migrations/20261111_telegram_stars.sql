-- Native Telegram Stars purchases; no plaintext activation keys.
CREATE TABLE IF NOT EXISTS telegram_star_orders (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES site_users(id),
 telegram_id TEXT NOT NULL,
 plan TEXT NOT NULL CHECK(plan IN ('quarterly','annual','scalper_1m','scalper_3m')),
 stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 1000000),
 account_login TEXT,
 status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','paid','failed')),
 charge_id TEXT UNIQUE,
 invoice_message_id TEXT,
 terms_version TEXT NOT NULL,
 accepted_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 paid_at TEXT,
 notified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_telegram_star_orders_user ON telegram_star_orders(user_id,created_at DESC);
