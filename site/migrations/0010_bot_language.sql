-- Per-Telegram-account language preferences, independent of license or account linking.
-- English is the implicit default until the user selects a language.
CREATE TABLE IF NOT EXISTS site_bot_preferences (
 telegram_id TEXT PRIMARY KEY NOT NULL,
 language_code TEXT NOT NULL DEFAULT 'en' CHECK(language_code IN ('en','fa','ar','tr','ru','hi')),
 selected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
