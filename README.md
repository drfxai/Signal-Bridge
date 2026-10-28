# DrFX SignalBridge

**TradingView ↔ MetaTrader 5 ↔ Telegram**

SignalBridge is a low-latency, replay-safe signal bridge built around Cloudflare edge ingress, Durable Object WebSockets, a Windows companion Agent and a MetaTrader 5 Expert Advisor.

> **Current status (2026-10-28): deployed DEMO beta.** The Cloudflare Worker is live at `signalbridge.drfx.online`, backed by D1 and an account-scoped Durable Object Agent Hub. TradingView/GOD MODE and paired Telegram ingestion can create durable commands for the Windows Agent and MT5 EA. **Live-account execution is hard-blocked in the EA.**

## Implemented

- Authenticated TradingView webhook ingress with durable D1 idempotency.
- GOD MODE `[[DRFX]]` entry + TP1/TP2/TP3/SL/CLOSE lifecycle parsing.
- Explicit Telegram one-time chat/channel pairing and deterministic signal parsing.
- Durable command state with retry-safe PENDING redispatch.
- Account-scoped Durable Object WebSocket transport.
- Read-only realtime dashboard observer WebSocket that does not replace the execution Agent.
- Windows SignalBridge Agent v0.23.1 using persistent Cloudflare WebSocket + localhost TCP to MT5, with measured Cloudflare RTT telemetry.
- MT5 EA v0.23 with:
  - DEMO-only execution gate;
  - broker-side SL/TP/spread/lot checks;
  - risk-percent sizing from real broker contract values;
  - command correlation and duplicate checks;
  - persistent pending-submission ledger;
  - restart reconciliation against open positions and broker history;
  - fail-closed handling for unresolved prior submissions.
- Realtime backend-backed dashboard at `/dashboard`.
- Manual end-to-end test surface at `/test`.
- Automated Node/contract tests in GitHub Actions.

## Route status

| Route | Status |
| --- | --- |
| TradingView → MT5 | DEMO beta pipeline implemented |
| Telegram → MT5 | DEMO beta pipeline implemented |
| TradingView → Telegram | Planned |
| MT5 → Telegram | Planned |

## Architecture

`TradingView / Telegram → Cloudflare Worker → D1 → Durable Object Agent Hub → Windows Agent → localhost TCP → MT5 EA → Broker`

The dashboard uses authenticated API reads plus a separate read-only observer WebSocket. It is **not** a static/synthetic production dashboard and does not poll every few seconds.

## Safety boundary

- Live MT5 accounts are refused by the current EA.
- `InpEnableDemoExecution=false` by default.
- HTTP acceptance is not broker fill evidence.
- Unknown broker outcomes are never blindly resubmitted.
- Source/Agent credentials are opaque scoped secrets and are not committed to this repository.
- Broker credentials are not required by Cloudflare.

## Remaining release gates

- Compile/QA EA v0.23 in real MetaEditor/MT5 and confirm zero compile errors.
- Run real DEMO end-to-end tests for TradingView and Telegram, including hedging and netting accounts.
- Cloudflare dashboard/test rate limiting is active; add quota/usage alerting from measured analytics.
- Run reconnect/chaos tests and validate the offline 100 → 250 → 500 capacity model against measured Cloudflare analytics.
- Add production owner/session authentication before multi-user dashboard rollout.
- Independent security review before any live-money mode is considered.

## Development

```bash
npm run check
```

The canonical EA is `mt5/DrFX_SignalBridge_EA.mq5`; versioned release source is currently `mt5/DrFX_SignalBridge_EA_v0.23.mq5`.

## Attribution

DrFX SignalBridge is an independent implementation. Third-party products referenced in research or comparisons are not affiliated with this project.
