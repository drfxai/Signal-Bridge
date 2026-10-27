# SignalBridge MT5 UI — Approved Baseline

Status: approved by product owner on 2026-10-28.

## Reference reviewed
The MT5 implementation in the private `drfxai/DrFXQuant` repository was reviewed before this milestone. SignalBridge reuses the strong execution/telemetry patterns, not God Mode strategy identity.

Patterns retained:
- account/broker identity and Live/Demo distinction;
- hedging/netting awareness;
- local terminal risk checks and broker-side SL/TP;
- open-book and execution telemetry;
- account-scoped credentials and revocation;
- broker evidence rather than optimistic execution status.

Patterns changed:
- the five-line chart status block becomes a rich native MT5 panel;
- future command transport is WebSocket-first through the Windows SignalBridge Agent, not five-second per-terminal HTTP polling;
- Telegram is a first-class source/notification connector;
- the EA is source-agnostic: TradingView and Telegram normalize into one command model.

## Approved surfaces
### MT5 Live Command Center
Shows terminal/account state, signal routing, positions, broker events, latency and risk state.

### Native MT5 chart panel
Required information:
- terminal connection state;
- broker/account/margin mode;
- balance/equity/floating P&L;
- SignalBridge-managed position count;
- latest canonical signal;
- latest execution/broker receipt;
- risk-gate state;
- recent terminal/trade events;
- compact/expanded mode.

No chart-panel control may silently place, close or resize a trade.

### MT5 Settings
Account binding, Agent credentials, risk caps, spread/deviation/slippage guards, min-lot protection, broker-side TP, break-even/partials, Magic Number and symbol mapping.

### Telegram Hub
Authorized chats/channels, deterministic parsing, normalized preview, revision handling and the same downstream Risk → MT5 route.

## Current milestone
`mt5/DrFX_SignalBridge_EA.mq5` implements the native chart-panel foundation with actual local account telemetry and `OnTradeTransaction` events. It deliberately does not connect to Cloudflare or submit orders yet.

`design/mt5-command-center.html` is the approved executable reference for the Command Center, settings, Telegram and chart-panel composition.

## Next gates
1. Compile/visual QA in MetaEditor/MT5 on Windows.
2. Implement the Windows SignalBridge Agent and Agent Hub transport.
3. Bind live Agent telemetry into the web Command Center.
4. Add authenticated enrollment/account binding.
5. Implement command receipt/reconciliation before demo execution.
6. Demo-broker E2E tests on hedging and netting accounts.

No live trading is enabled by this UI milestone.
