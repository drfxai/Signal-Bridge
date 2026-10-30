-- 0016: A signal route preference is independent of broker order-execution mode.
-- Existing members retain their selected TradingView delivery mode; TV->MT5
-- preference defaults to ON, while new webhook connections remain DRY RUN.
ALTER TABLE member_signal_settings ADD COLUMN tv_to_mt5 INTEGER NOT NULL DEFAULT 1 CHECK(tv_to_mt5 IN (0,1));
