# SignalBridge MT5 EA

## Current canonical source

`DrFX_SignalBridge_EA.mq5` now tracks **v0.24 direct-cloud beta**.

The standard user architecture is:

```text
SignalBridge Cloud ⇄ MT5 EA ⇄ Broker DEMO
```

No Windows companion Agent is required.

## Setup

1. Place the EA in `MQL5/Experts`.
2. Compile it in MetaEditor during source/beta testing.
3. Attach it to an MT5 **DEMO** chart.
4. Add `https://signalbridge.drfx.online` to the terminal's allowed addresses.
5. Paste the private 43-character SignalBridge Key into `InpSignalBridgeKey`.
6. Keep `InpEnableDemoExecution=false` until Preview tests pass.

## Direct transport

The EA opens a TLS connection to `signalbridge.drfx.online:443` and upgrades it to WebSocket at `/v1/ea/ws`.

## Safety

Live-account execution remains blocked.

The previous v0.20–v0.23 sources are retained for history/rollback only.

> v0.24 has not yet been compile-certified in a real Windows MetaEditor from this repository workflow. That test remains a release gate.
