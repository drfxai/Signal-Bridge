# SignalBridge MT5 EA

The only current source is [`DrFX_SignalBridge_EA.mq5`](DrFX_SignalBridge_EA.mq5),
**EA v0.26.0**. Older EA snapshots have been removed from the working tree;
Git history retains their previous contents.

## Setup

1. Compile the source with official MetaEditor, or use an independently reviewed compiled EX5 build.
2. Place the EX5 in `MQL5/Experts` and attach it to an MT5 **DEMO** chart.
3. Allow `https://signalbridge.drfx.online` in **Tools → Options → Expert Advisors**.
4. Paste your private 43-character activation code into `InpActivationCode`.
5. Keep `InpEnableDemoExecution=false` until dry-run checks pass.
6. The optional BUY gold 0.01 / local five-second exit test also requires `InpEnableConnectionTest=true`.

The EA connects directly to `signalbridge.drfx.online:443` at `/v1/ea/ws`
using TLS/WebSocket. No Windows companion Agent is required.

## Current features

- Personal license verification, server-based remaining-time display and heartbeat renewal.
- TradingView and authorized Telegram signals through the shared command pipeline.
- Demo-only entry and management, broker receipts and replay protection.
- Hedging/netting-aware management and broker-position reconciliation.
- Persistent timed-test exit recovery and black/navy/gold compact/full panel.

See [connection controls and deployment order](../docs/EA_V026_CONNECTION_CONTROLS.md)
for supported formats and test restrictions.

## Verification

[Official Windows MetaEditor build](https://github.com/drfxai/Signal-Bridge/actions/runs/40847595192):
zero compile errors; one pre-1.0 Market-version warning. The product remains demo-only.
Actual broker E2E/timing certification is separate from compilation.
