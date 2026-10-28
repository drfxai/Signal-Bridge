# MT5 Execution Agent
Current release source: `mt5/DrFX_SignalBridge_EA_v0.23.mq5`
Canonical source: `mt5/DrFX_SignalBridge_EA.mq5`

## Current runtime

SignalBridge uses a Windows companion Agent and localhost TCP. The EA does **not** poll Cloudflare directly.

`Cloudflare AgentHub WebSocket → Windows Agent → 127.0.0.1:17777 → MT5 EA`

This keeps Cloudflare request usage low and avoids synchronous internet `WebRequest` calls inside the EA timer path.

## Safety mode

- DEMO account required.
- `InpEnableDemoExecution=false` by default.
- real/live accounts are hard-refused.
- broker-side SL is mandatory.
- requested lot/risk is capped by local EA settings.
- symbol, spread, price deviation and broker volume limits are revalidated locally.

## Replay and restart safety

EA v0.23 writes the pending correlation tag → command ID mapping to terminal common-file storage before broker submission.

On restart it:

1. reloads unresolved submissions;
2. checks current SignalBridge positions;
3. checks broker deal history;
4. reports verified evidence when found;
5. blocks automatic OPEN replay if the previous broker outcome is still unresolved.

This is intentionally fail-closed. It is safer to require reconciliation than to create a second order.

The EA no longer clears a pending submission merely because a receipt was written to the localhost TCP socket. The Windows Agent first persists that receipt to an fsync-backed outbox and then returns a local `RACK` acknowledgement. Only broker-evidenced terminal outcomes such as `FILLED`, `BROKER_REJECTED` or `DUPLICATE` clear the pending entry after that local persistence acknowledgement.

Cloudflare reconnect replay is also gated by verified MT5 terminal readiness; connecting the Windows Agent process alone does not trigger execution replay.

## Broker evidence

The EA uses `CTrade` result codes plus `OnTradeTransaction` and broker history/positions. HTTP/Cloudflare delivery does not imply FILLED.

Current command states include `SUBMITTED`, `FILLED`, `BROKER_REJECTED`, `REJECTED`, `EXPIRED`, `ERROR` and `DUPLICATE`.

## GOD MODE management

ENTRY uses risk-based or fixed-lot sizing depending on the normalized command.

TP3, SL and CLOSE close the correlated position.

TP1/TP2 partial management supports both hedging and retail-netting account modes. Hedging uses `PositionClosePartial`. Retail netting reduces the existing position with an opposite market deal to an absolute remaining-volume target, preserving replay idempotency. To prevent ownership ambiguity, a new SignalBridge OPEN on a netting symbol is rejected whenever **any** position already exists on that symbol.

## Native panel

The chart panel displays real terminal/account information, Agent connection state, balance/equity/floating P&L, managed position count, latest signal, latest execution result and DEMO gate state.

## Required certification before public beta

- MetaEditor compile with zero errors/warnings that affect execution.
- DEMO tests on at least one hedging and one netting broker.
- restart after broker submission but before receipt;
- Agent/cloud disconnect/reconnect;
- duplicate/replayed commands;
- invalid symbol suffixes, volume steps and stops;
- market closed, spread spikes and stale quotes;
- partial fills and broker rejection;
- hedging and netting TP1/TP2 behavior;
- multiple charts/EA duplicate-instance protection if required.

Live-money mode is outside the current release boundary.
