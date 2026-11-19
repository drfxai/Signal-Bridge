-- Existing orders retain their quotes, payment IDs and fulfillment status.
-- Native Telegram Stars purchases; no plaintext activation keys.
CREATE TABLE telegram_star_orders_new (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES site_users(id),
 telegram_id TEXT NOT NULL,
 plan TEXT NOT NULL CHECK(plan IN ('quarterly','annual','scalper_1m','scalper_3m','semiannual','scalper_1y')),
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
INSERT INTO telegram_star_orders_new SELECT * FROM telegram_star_orders;
DROP TABLE telegram_star_orders;
ALTER TABLE telegram_star_orders_new RENAME TO telegram_star_orders;
ALTER TABLE telegram_star_orders ADD COLUMN checkout_query_id TEXT;
CREATE INDEX idx_telegram_star_orders_user ON telegram_star_orders(user_id,created_at DESC);

ALTER TABLE ea_licenses ADD COLUMN initial_duration_override TEXT CHECK(initial_duration_override IS NULL OR (initial_duration_override GLOB '+[1-9]* months' AND initial_duration_override=printf('+%d months',CAST(initial_duration_override AS INTEGER))));
ALTER TABLE ea_licenses ADD COLUMN stars_plan TEXT CHECK(stars_plan IS NULL OR stars_plan='semiannual');

UPDATE ea_licenses SET duration_modifier='+3 months'
WHERE plan='trial' AND status='active' AND activated_at IS NULL AND duration_modifier='+1 month'
AND id IN (SELECT license_id FROM site_licenses);
