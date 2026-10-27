# MT5 Execution Agent Design
Planned filename: `DrFX_SignalBridge_EA.mq5`. No EA source code is present yet.

## Runtime architecture
MQL5 Expert Advisor installed on a supported MT5 Windows terminal (local or Windows VPS). User pairs terminal/account to SignalBridge via short-lived enrollment. EA verifies the account number/server against authorized binding; mismatch disables trading.

## EA components
1. Config + Enrollment Manager: endpoint allowlist, connection tokens, demo/live indicator, heartbeat.
2. Command Receiver: polling over HTTPS with `OnTimer`, token refresh and command version check.
3. Validator: expiry, account identity, symbol mapping, volume step/min/max, stops level, freeze level, trading sessions.
4. Position Ledger: correlated order/deal/position IDs and split TP children.
5. Execution Manager: `CTrade` requests with full retcode and trade event handling.
6. Local Safety Gate: duplicate receipt cache, pause, daily loss, exposure and order-rate guards.
7. Reconciler: start-up and ambiguity reconciliation from order/deal history and current positions.
8. Telemetry: status, heartbeat, masked diagnostics and outcome receipts.

## Execution lifecycle
- Claim work: only account-scoped, unexpired command from authenticated server.
- Persist local receipt intent BEFORE broker submission when feasible; prevent the same command's blind repeat after crash.
- Validate market rules; reject if quote stale or spread beyond configured cap.
- Submit order, inspect trade method result and retcode. Do not infer fill solely from request accepted.
- Track `OnTradeTransaction` and query live orders/history to reconcile position/deal identifiers.
- Report transitions to backend; classify uncertain submission as UNKNOWN and query broker before any new attempt.
- On restart, reconcile commands marked CLAIMED/SUBMITTED/UNKNOWN. Never simply replay queue.

## MQL5-specific constraints
- `WebRequest` is synchronous; call in timer path, not performance-critical UI ticks; add backoff, timeouts and outage indicators.
- Allowed URLs must be configured in terminal options; ship onboarding instructions.
- `WebRequest` cannot be tested inside Strategy Tester; separate pure strategy/risk unit tests from demo-terminal integration tests.
- Hedge mode: TP legs may use separate positions. Netting mode: manage target quantities with account-level position semantics and partial close support.
- Trade server can reject/requote/partially fill; report exact broker state and deviation.

## Safety defaults
- Demo mode default; live disabled until explicitly enabled.
- Fixed lot = min of requested and policy maximum, or reject if rounding materially changes risk. Never silently increase lots.
- Price decimals determined from contract spec, not guessed from asset class.
- CLOSE/MODIFY must match an existing correlated position/ticket.
- Default stop on disconnected risk backend or missing account state for NEW trades.
- Kill switch pauses new OPEN; account liquidation is a separate protected action.

## Test matrix
- Hedging vs netting, symbol suffixes, broker digits/tick sizes, min lot/step, invalid SL/TP, spread spikes, market closed.
- Invalid tokens, repeated command, delayed ACK, terminal restart after submit, server disconnect/reconnect, stale alerts.
- Partial fills, TP1/2/3 behavior, reject/requote, unknown broker state, competing routes, high-frequency signals.
- Account switch while EA running, strategy tester limitations and user permission errors.

## Distribution
Provide signed installer package or manually installable MQ5/EX5 after review; never embed customer secrets in distributions. Keep release channels demo/beta/stable distinct.
