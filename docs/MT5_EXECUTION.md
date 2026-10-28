# SignalBridge — MT5 Execution
Version 0.24 direct-cloud beta · 2026-10-28

## Standard user path

The standard V3 installation uses a single MetaTrader 5 EA.

```text
SignalBridge Cloud
      ⇅ TLS/WebSocket
DrFX_SignalBridge_EA v0.24
      ↓
Broker DEMO
```

No Windows companion process is required.

## Connection

The EA connects outbound to:

```text
signalbridge.drfx.online:443
/v1/ea/ws
```

The WebSocket subprotocol is `signalbridge-ea-v1`.

MT5 requires the destination address to be explicitly allowed by the user in Tools → Options → Expert Advisors. This is a terminal security requirement and cannot be silently bypassed.

## Execution safety

- DEMO accounts only.
- `InpEnableDemoExecution=false` by default.
- Live accounts are refused.
- Broker-side stop loss.
- volume/min/max/step validation.
- spread gate.
- price-deviation gate.
- symbol mapping.
- max open trade gate.
- hedging and retail-netting aware management.

## Reliability

The EA persists pending command/correlation state before broker submission.

A pending command is cleared only after the cloud returns `RACK` for a terminal result. On reconnect, unresolved pending state is reconciled against open positions and broker history before retry.

Command lifecycle remains:

`PENDING → DELIVERED → PREVIEWED`

or:

`PENDING → DELIVERED → SUBMITTED → FILLED`

with fail-closed terminal outcomes such as BROKER_REJECTED, REJECTED, ACCOUNT_MISMATCH, EXPIRED, ERROR and DUPLICATE.

## Current release gate

The v0.24 source has not yet been certified by an actual Windows MetaEditor compile in this repository workflow. It must not be described as compile-certified until that external test passes.
