-- Reduce D1 rows_read from frequently refreshed member report history.
-- Both indexes match the tenant/user filter followed by newest-first ordering.
-- Safe and idempotent; no existing rows are deleted or modified.
CREATE INDEX IF NOT EXISTS idx_commands_tenant_created
  ON commands(tenant_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_tg_outbox_user_created
  ON telegram_signal_outbox(user_id, created_at DESC, id DESC);
