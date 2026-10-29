-- DrFX Scalper Pro: paid plans bought in the member portal; keys are account-bound
-- HMAC-signed serials that the EA verifies offline. Separate from SignalBridge orders.
CREATE TABLE IF NOT EXISTS scalper_orders (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES site_users(id),
 plan TEXT NOT NULL CHECK(plan IN ('scalper_1m','scalper_3m')),
 amount_usd INTEGER NOT NULL,
 account_login TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','failed','paid')),
 invoice_id TEXT,
 invoice_url TEXT,
 payment_id TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 paid_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_scalper_orders_user ON scalper_orders(user_id,created_at);
CREATE TABLE IF NOT EXISTS scalper_keys (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES site_users(id),
 order_id TEXT UNIQUE,
 account_login TEXT NOT NULL,
 plan TEXT NOT NULL,
 days INTEGER NOT NULL CHECK(days BETWEEN 1 AND 65535),
 serial INTEGER NOT NULL UNIQUE,
 encrypted_key TEXT NOT NULL,
 nonce TEXT NOT NULL,
 issued_by TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scalper_keys_user ON scalper_keys(user_id,created_at);
