# SignalBridge MT5 EA

The only current source is [`DrFX_SignalBridge_EA.mq5`](DrFX_SignalBridge_EA.mq5),
**EA v0.29.0**. Older EA snapshots have been removed from the working tree;
Git history retains their previous contents.

## Setup

1. Compile the source with official MetaEditor, or use an independently reviewed compiled EX5 build.
2. Place the EX5 in `MQL5/Experts` and attach it to an MT5 **DEMO** chart (or LIVE for separately opted-in connection tests).
3. Allow `https://signalbridge.drfx.online` in **Tools → Options → Expert Advisors**.
4. Paste your private 43-character activation code into `InpActivationCode`.
5. Keep `InpEnableDemoExecution=true` until dry-run checks pass.
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

[Official Windows MetaEditor workflow](https://github.com/drfxai/Signal-Bridge/actions/workflows/build-ea.yml).
Automatic signals remain demo-only; LIVE connection tests require separate consent.
Actual broker E2E/timing certification is separate from compilation.

See [DEMO/LIVE test controls and the new compact panel](../docs/EA_V027_LUXURY_TESTS.md).

### Broker symbol settings (EA 0.27.2)

In EA Properties → Inputs → **Broker Symbol Settings**, set:

| Input | Example | Applies to |
| --- | --- | --- |
| `InpGoldSymbol` | `XAUUSD.p` | Incoming XAUUSD signals and the gold position test |
| `InpTestSymbol` | blank | Optional test-only override; normally leave blank |
| `InpSymbolSuffix` | `.p` | Other incoming symbols, e.g. EURUSD → EURUSD.p |
| `InpSymbolPrefix` | blank | Optional broker prefix for other symbols |

Copy the exact case-sensitive symbol from Market Watch. An explicitly configured
but unavailable gold symbol is rejected; the EA does not silently trade a different
contract. Existing positions, spread limits and account opt-in checks still apply.

### EA 0.28.0 — ready-to-test defaults and daily drawdown

Connection-test inputs are enabled by default. `InpTestSymbol=XAUUSD` and
`InpDefaultLots=0.01` can be changed to another broker instrument and valid volume.
For this broker use `InpTestSymbol=XAUUSD.p` (or preserve InpGoldSymbol mapping).
`InpDailyDrawdownPercent=10` closes **all account positions** and cancels pending
orders at the equity-loss limit. HIT stays red until you explicitly confirm restart
in the EA or personal portal, after all positions/orders have closed.
See [calculation, counters and limits](../docs/EA_V028_DAILY_DRAWDOWN.md).

### Approved command center — 0.29.0

Defaults are **TP1 = BE**, **TP2 = CLOSE**, **TP3 = OFF**. Both portals provide policy,
routing, preview and report controls. Native EA has Overview/Signals/Trades/Risk/
Settings tabs and compact mode. Report reset does not reset daily drawdown.
Partial exits require a hedging account; default BE/full close support netting too.
Keep MT5 running for local target actions. See the [release behavior and install
requirements](../docs/EA_V029_APPROVED_COMMAND_CENTER.md) before enabling routes.
