-- DrFX Company unified website / Telegram accounts; same D1 as SignalBridge licensing.
CREATE TABLE IF NOT EXISTS site_users (
 id TEXT PRIMARY KEY NOT NULL,
 email TEXT UNIQUE,
 telegram_id TEXT UNIQUE,
 telegram_name TEXT,
 role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','suspended')),
 plan TEXT NOT NULL DEFAULT 'trial' CHECK(plan IN ('trial','quarterly','annual')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CHECK(email IS NOT NULL OR telegram_id IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS site_login_codes (
 code_hash TEXT PRIMARY KEY NOT NULL,
 purpose TEXT NOT NULL CHECK(purpose IN ('email','telegram','link')),
 target TEXT NOT NULL,
 user_id TEXT,
 expires_at TEXT NOT NULL,
 used_at TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_site_login_target ON site_login_codes(target,purpose,created_at);
CREATE TABLE IF NOT EXISTS site_sessions (
 token_hash TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES site_users(id),
 expires_at TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_site_sessions_expiry ON site_sessions(expires_at);
CREATE TABLE IF NOT EXISTS site_licenses (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES site_users(id),
 agent_id TEXT UNIQUE NOT NULL REFERENCES agent_connections(id),
 license_id TEXT UNIQUE NOT NULL REFERENCES ea_licenses(id),
 encrypted_code TEXT NOT NULL,
 nonce TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS site_orders (
 id TEXT PRIMARY KEY NOT NULL,
 user_id TEXT NOT NULL REFERENCES site_users(id),
 plan TEXT NOT NULL CHECK(plan IN ('quarterly','annual')),
 amount_usd INTEGER NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','failed','paid')),
 invoice_id TEXT,
 invoice_url TEXT,
 payment_id TEXT,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 paid_at TEXT
);
CREATE TABLE IF NOT EXISTS site_audit (
 id TEXT PRIMARY KEY NOT NULL,
 actor_id TEXT,
 action TEXT NOT NULL,
 subject_id TEXT,
 detail TEXT,
 occurred_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS site_rate_limits (
 id TEXT PRIMARY KEY NOT NULL,
 requests INTEGER NOT NULL DEFAULT 1,
 expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_site_users_created ON site_users(created_at);
CREATE INDEX IF NOT EXISTS idx_site_orders_user ON site_orders(user_id,created_at);
