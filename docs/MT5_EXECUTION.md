# MT5 Execution Agent
Current release source: `mt5/DrFX_SignalBridge_EA_v0.22.mq5`
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

EA v0.22 writes the pending correlation tag → command ID mapping to terminal common-file storage before broker submission.

On restart it:

1. reloads unresolved submissions;
2. checks current SignalBridge positions;
3. checks broker deal history;
4. reports verified evidence when found;
5. blocks automatic OPEN replay if the previous broker outcome is still unresolved.

This is intentionally fail-closed. It is safer to require reconciliation than to create a second order.

## Broker evidence

The EA uses `CTrade` result codes plus `OnTradeTransaction` and broker history/positions. HTTP/Cloudflare delivery does not imply FILLED.

Current command states include `SUBMITTED`, `FILLED`, `BROKER_REJECTED`, `REJECTED`, `EXPIRED`, `ERROR` and `DUPLICATE`.

## GOD MODE management

ENTRY uses risk-based or fixed-lot sizing depending on the normalized command.

TP3, SL and CLOSE close the correlated position.

TP1/TP2 partial management is currently implemented for hedging accounts. Netting-account partial semantics remain a release gate and must be implemented/tested before claiming full netting support.

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
- netting TP1/TP2 behavior;
- multiple charts/EA duplicate-instance protection if required.

Live-money mode is outside the current release boundary.
