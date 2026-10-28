-- Stable, revocable Telegram website sign-in secrets.
-- Code is generated once per user (24 random bytes / 192-bit entropy), stored as SHA256 for lookup
-- and AES-GCM ciphertext (existing LICENSE_VAULT_KEY) solely for private bot redisplay.
-- Never use the EA activation serial as a website password.
CREATE TABLE IF NOT EXISTS site_permanent_logins (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES site_users(id),
 code_hash TEXT NOT NULL UNIQUE,
 encrypted_code TEXT NOT NULL,
 nonce TEXT NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 rotated_at TEXT,
 last_used_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_permanent_login_hash ON site_permanent_logins(code_hash);
