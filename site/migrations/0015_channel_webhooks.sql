-- TradingView -> Telegram channel webhooks (no MT5 involved).
-- tg_bot_chats: channels/groups the bot was added to, kept in sync from my_chat_member updates.
CREATE TABLE IF NOT EXISTS tg_bot_chats (
  chat_id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  chat_type TEXT NOT NULL,
  username TEXT,
  bot_status TEXT NOT NULL,
  can_post INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Telegram users who added or promoted the bot in a chat (used to list "my channels").
CREATE TABLE IF NOT EXISTS tg_bot_chat_users (
  chat_id TEXT NOT NULL,
  telegram_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (chat_id, telegram_id)
);
CREATE INDEX IF NOT EXISTS idx_tg_bot_chat_users_user ON tg_bot_chat_users(telegram_id);
-- One unique webhook per member and chat. Only the SHA-256 of the token is used for lookup;
-- the token itself is AES-GCM encrypted with LICENSE_VAULT_KEY so the member can copy it again.
CREATE TABLE IF NOT EXISTS tg_channel_webhooks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  chat_id TEXT NOT NULL,
  token_sha256 TEXT NOT NULL UNIQUE,
  encrypted_token TEXT NOT NULL,
  nonce TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  sent_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  last_used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, chat_id)
);
CREATE INDEX IF NOT EXISTS idx_tg_channel_webhooks_user ON tg_channel_webhooks(user_id);
