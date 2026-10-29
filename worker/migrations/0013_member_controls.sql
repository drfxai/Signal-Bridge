CREATE TABLE IF NOT EXISTS member_signal_settings (
 user_id TEXT PRIMARY KEY, policy_json TEXT NOT NULL DEFAULT '{"tp1":"BE","tp2":"CLOSE","tp3":"OFF","partial_percent":50,"be_buffer_points":0}',
 telegram_chat_id TEXT, telegram_verified INTEGER NOT NULL DEFAULT 0,
 tv_to_telegram INTEGER NOT NULL DEFAULT 0, telegram_to_mt5 INTEGER NOT NULL DEFAULT 0,
 default_lots REAL NOT NULL DEFAULT 0.01, report_since TEXT, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS telegram_signal_outbox (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, signal_id TEXT NOT NULL, chat_id TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'PENDING', message_id TEXT, detail TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(user_id,signal_id)
);
CREATE TABLE IF NOT EXISTS signal_review_queue (
 id TEXT PRIMARY KEY,user_id TEXT NOT NULL,source_ref TEXT NOT NULL,reason TEXT NOT NULL,
 normalized_preview TEXT,created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,UNIQUE(user_id,source_ref)
);
CREATE TABLE IF NOT EXISTS position_events (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL, agent_id TEXT NOT NULL, tag TEXT NOT NULL,
 target_index INTEGER NOT NULL, state INTEGER NOT NULL, action INTEGER NOT NULL,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_position_events_user_time ON position_events(user_id,created_at);
