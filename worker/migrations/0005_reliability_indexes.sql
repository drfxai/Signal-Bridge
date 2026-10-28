-- One durable command per Telegram update and MT5 agent.
-- Telegram source_ref is tg:<connection_id>:<update_id>.
CREATE UNIQUE INDEX IF NOT EXISTS idx_commands_telegram_source_unique
ON commands(source_ref,agent_id)
WHERE source_type='telegram' AND source_ref IS NOT NULL;
