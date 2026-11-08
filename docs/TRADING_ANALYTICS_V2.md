# Broker-verified Trade Analytics V2 (FX Replay-style)

Status: **staged on a feature branch; NOT production-ready**. This is the first end-to-end, opt-in broker-deal ingestion and journal slice, not a claim that all FX Replay features have shipped.

## Safety invariants

- No changes to order dispatch, drawdown, license issuance, ordinary LIVE execution restrictions or account protections.
- Account-specific historical trade import is **OFF by default** (`InpEnableDealHistory=false`).
- Only a valid, licensed, bound EA socket with a verified MT5 account and `deal-history-v1` can upload.
- Max 8 deal rows per batch, 8 KiB wire limit, minimum 2.5 seconds between accepted batches; duplicates are idempotent.
- A batch is acknowledged only after D1 stores all statements; the MT5 cursor advances only on a matching ACK. Restart/reconnect safely replays unacknowledged deals.
- The Client Portal GET endpoint uses the authenticated server-side tenant and D1 indexes; caller-provided user IDs cannot expand its scope.
- The GET is **explicitly capped to 401 rows** with at most 400 analyzed; no live polling is introduced.
- No fabricated trade outcomes. Incomplete positions and INOUT netting reversals are excluded from win-rate denominators. Partial windows display a coverage warning and withhold ratios.
- Account-wide realized net includes broker commissions, swaps and fees recorded on the imported buy/sell deals. Independent broker balance adjustments are not yet ingested; those require a separate contract.
- Signal attribution requires the account's own tagged TradingView/Telegram command with a matching EA/tenant, not just a caller-provided tag.
- Broker server time zone remains unverified; calendars are **broker-date groups**, not certified UTC session attribution.
- No EA credentials, user email or raw MT5 deal comments are stored in the new ledger.

## Ingestion protocol

After HELLO/HB account binding and successful license verification:

```
DEAL_BATCH|<batch-id>|dealTicket,positionId,orderTicket,brokerTimeMs,side,entry,symbol,volume,price,profit,commission,swap,fee,tag[;...]
DEAL_ACK|<batch-id>|<accepted-row-count>
DEAL_NACK|<batch-id>|<safe-error-code>
```

Side: B/S; entry: I = IN, O = OUT, C = OUT_BY, R = INOUT reversal; tag is 12-char lowercase correlation tag or `-`. The server validates all rows before executing a transactional batch and binds tenant, agent, account login and server from the authenticated socket. Deal tickets are strings to avoid IEEE-754 precision loss.

## Deployment gates

1. Resolve D1 free-tier rows-read exhaustion and measure baseline after the next midnight UTC reset.
2. Test migrations against a snapshot/staging clone, then apply `site/migrations/20261108_broker_deal_analytics.sql` on `signalbridge-ingress`. Verify `EXPLAIN QUERY PLAN` uses `idx_broker_deals_tenant_time` and `idx_commands_deal_signal_tag`.
3. Deploy the updated ingress Worker **after** migration. Do not enable EA upload on old ingress.
4. Deploy `drfx-company-site` from the tested build; verify tenant isolation, anonymous 401s, ledger empty state, mobile/desktop/Mini App and D1 read budget.
5. Compile `mt5/DrFX_SignalBridge_EA.mq5` **with `mt5/DealHistory.mqh`** in MetaEditor, validate EX5 signature/hash, demo broker testing, reconnect/duplicate replay, netting, hedging, and opt-in consent. Do not replace public customer downloads before these gates pass.
6. Opt in on one authorized DEMO account; compare imported deal tickets and net fees to MT5 Account History. Expand deployment only after load and privacy checks.

## Current UI

The Analytics tab adds a real broker-deal chart, 7/30/90 day filters, account vs verified Signal Bridge attribution, monthly-style broker-date cells, a closed-position journal, deal ledger and CSV export. Existing premium UI remains intact, with explicit empty/partial/unavailable states.

## Remaining work to close Issue #113

- Broker reconciliation across full lifecycle beyond bounded 90-day imports, including legacy positions, reversals, missing fees and split close cycles.
- User-defined journal notes/tags and strategy annotations; verified TP1/TP2/TP3/SL replay timeline.
- Snapshot/incremental aggregates and historical equity that scale past the 400-deal response window.
- Correct account timezone/UTC offsets and DST, Asia/London/New York session analytics, hourly breakout and full-year calendar.
- Per-trade initial-risk metadata for true R and risk-adjusted stats.
- Monte Carlo with minimum sample thresholds and hypothetical labels.
- Standalone Scalper Pro deal telemetry (the current product has no verified online reporting source).
- Full MQL compilation, two-broker end-to-end demo and shadow production soak tests.

No production database migration or EA activation has been performed by this branch.
