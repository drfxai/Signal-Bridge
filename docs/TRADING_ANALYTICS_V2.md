# Signal Bridge trading analytics — FX Replay–inspired product specification

**Status:** Phase A implemented as an account-scoped, broker-verified analytics view; Phase B/C require an EA and backend schema upgrade. Visual hierarchy is inspired by the provided reference screenshots, not a copy of proprietary branding or assets.

## Existing verified inputs

- Authenticated \`/api/member/report\` returns the requesting tenant's recent commands, review queue, outbox, the active EA diagnosis, and reports-v1 broker telemetry.
- EA \`ReportSeries\` sends 14 broker-day net P/L buckets, with no date labels. The selected EA report period affects KPI totals independently of the 14-day plot.
- EA reports live balance, equity, realized profit, realized loss, floating P/L, signal/TP/SL counters. **Realized P/L is at broker-account scope and can include manual/other-EA positions.**
- Command status (received, queued, submitted, filled, rejected) is not a trade outcome. Do not use command status as win rate.

## Phase A — implemented in this branch

- Separate Analytics tab in the authenticated website and Telegram Mini App member workspace.
- Refreshed cards for net P/L, gross profit/loss, live balance, equity and EA signal totals; 14-day broker P/L curve/daily bars, short heatmap, inbound-signal activity per UTC hour, command delivery breakdown and latest 60 command records.
- Report source and coverage are explicitly labeled. Missing or disconnected EA data remains unavailable rather than displaying samples, fake zeros or extrapolated metrics.
- Browser-only CSV export for the authenticated member's recent commands (formula-safe cell escaping). No new database tables, secrets, browser token storage, external analytic SDKs or extra DB reads.
- Responsive dark dashboard; existing setup, license and execution safety controls remain unchanged.
- Advanced statistics, annual calendar, win rate, per-session profit, journal and Monte Carlo are marked as requiring trade-level data.

## Phase B — exact signal-outcome analytics prerequisites

1. EA capability negotiation: \`deal-history-v1\` in addition to \`reports-v1\`. Only new supported EA builds send individual deal records. Do **not** infer deals from \`TARGET_EVENT\` or \`FILLED\`.
2. In MT5, collect actual deal-close records from \`OnTradeTransaction\` / \`HistorySelect\` with replay checkpoints and deduplication. Capture immutable identifiers (account server+login binding, broker deal ticket, position ID, order ticket, time in broker UTC equivalent, symbol, entry/exit type, side, quantity, price, profit, swap, commission, fees, currency) and an EA-owned correlation key/magic for the original signal.
3. Send batches through the existing authenticated EA→Agent Hub transport, never via a public unauthenticated ingestion URL. Validate licensed EA identity, tenant/account binding, maximum batch length, types, timestamps and idempotency. Treat broker tickets as account-scoped, not global.
4. Store immutable trades/deals in a tenant-partitioned table with unique \`(account_key, deal_ticket)\`; write only new deals, no accountwide scans, no query logging of identifying account data. Use compact daily/hourly/materialized read models or a scheduled/batched aggregation strategy to protect the Cloudflare D1 read budget. Audit and paginate by user + account + time.
5. Build a signal→command→broker order→position→close-deals correlation chain. Handle partial fills, multiple TP legs, netting vs hedging, duplicate forwards, modified stops, manual intervention, gaps and terminal reconnects. Mark ambiguous outcomes **unattributed**; never force attribution.
6. Compute realized **net** P/L from verified exit deals and associated fees in the correct account currency. Report account-wide and attributed-to-SignalBridge P/L in separate, filterable scopes. Do not imply every broker deal is attributable to an incoming signal.
7. Expose \`GET /api/member/analytics?period=&source=&account=&symbol=&cursor=\` authorized by existing HttpOnly session and tenancy, with strict validation, bounded pagination and no N+1 reads. An admin route must not bypass tenant scope without explicit role verification. Never use frontend-supplied user_id as authorization.

### Formula policy

- Trade win rate = winning **completed positions** / completed positions with a known nonzero realized result; show breakeven separately. Specify whether counting positions, legs or strategies.
- Average R multiple requires independently recorded risk-at-entry: \`initial_entry−initial_SL\`, volume, tick value and currency conversion; missing/changed initial stop is **unknown R**, not zero.
- Equity curve needs actual account balance/equity snapshots and cash-flow events. A line based on net realized daily P/L is a **P/L curve**, not equity, until those inputs exist.
- Profit factor = sum of positive realized net trades / abs(sum of negative realized net trades), with zero-loss case shown as unbounded or unavailable rather than fabricated.
- Drawdown needs a documented starting equity/balance baseline and cash-flow treatment. Never mix open floating P/L with realized P/L without labeling.
- Daily, monthly and yearly calendars must use explicit broker time zone and DST handling; avoid guessing dates for legacy 14-point arrays.

## Phase C — feature-equivalent analytics

- 12-month performance heatmap with daily details and per-trade drilldowns.
- Hour / weekday / month performance segmented by source, symbol, EA, demo/live and account.
- Session analytics for Asia, London and New York using zoneinfo and published session definitions, with a distinct overlap grouping.
- Verified trade journal with notes, screenshots and strategy tags stored with user-scoped access checks; no other customer's data.
- Monte Carlo: bootstrap **verified completed trades** (sufficient sample threshold, fixed seed, configurable run count) and chart percentiles and drawdown risk; clearly distinguish hypothetical simulations from realized results.
- Separate owner/admin analytics for Signal Bridge vs Scalper Pro, with safe aggregate cross-user statistics and no normal-user access to admin data.

## Release gates

- Unit tests: account isolation, broker/deal correlation, idempotent replay, partial exits, fee handling, DST, sparse history, zero trades, stale EA, annual/period boundaries, extreme values, formulas.
- Verify demo and live MT5 separately, hedging and netting, disconnect/reconnect, total balance vs attributed performance reconciliation.
- Run \`npm run check\` and mobile/web UI visual checks; verify the shared D1 read budget after staging. Production must not be deployed solely because the static UI renders.
- Keep \`drfx.company\` operational site, licensing, NOWPayments IPN, Telegram bot and MT5 execution semantics unchanged until the above tests are satisfied.
