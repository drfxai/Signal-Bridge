-- D1 read efficiency: Telegram route lookups are member- and agent-scoped.
-- Applied independently after deploying the matching source changes.
-- Partial indexes reduce writes compared with indexing all rows.

CREATE INDEX IF NOT EXISTS idx_ingress_active_tenant_agent_recent
 ON ingress_connections(tenant_id,agent_id,created_at DESC,id DESC)
 WHERE provider='tradingview' AND status='active';

CREATE INDEX IF NOT EXISTS idx_member_tg_chat_active
 ON member_signal_settings(telegram_chat_id,user_id)
 WHERE telegram_verified=1 AND telegram_to_mt5=1;
