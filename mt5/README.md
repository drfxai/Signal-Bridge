# SignalBridge MT5 EA

The current development source is [`DrFX_SignalBridge_EA.mq5`](DrFX_SignalBridge_EA.mq5),
**EA v0.30.3**. Older EA snapshots have been removed from the working tree;
Git history retains their previous contents.

## Setup

1. Download the [compiled EA release](https://github.com/drfxai/Signal-Bridge/releases/tag/ea-latest); verify its `README.txt` SHA-256 checksum before installation. Development builds may instead be compiled with MetaEditor.
2. Place the EX5 in `MQL5/Experts` and attach it to an MT5 **DEMO** chart (or LIVE for separately opted-in connection tests).
3. Allow `https://signalbridge.drfx.online` in **Tools → Options → Expert Advisors**.
4. Paste your private 43-character activation code into `InpActivationCode`.
5. Keep `InpEnableDemoExecution=true` until dry-run checks pass.
6. The optional BUY gold 0.01 / local five-second exit test also requires `InpEnableConnectionTest=true`.

The EA connects directly to `signalbridge.drfx.online:443` at `/v1/ea/ws`
using TLS/WebSocket. No desktop companion application is required.

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

### EA setup

In EA Properties → Inputs → **Start Here**, complete these inputs in order:

| Input | Default | Applies to |
| --- | --- | --- |
| License | Blank | Private activation code from your personal Setup page |
| Broker symbol | `XAUUSD` | XAUUSD signals and the default connection test. Copy your exact broker symbol from Market Watch, for example `XAUUSD.p`. |
| Lot size | `0.01` | Connection test. Trading signals carry their volume or risk sizing. |

The optional test-symbol override and prefix/suffix settings are for advanced setups.

### Broker symbol and MT5 comments

In the client portal or Telegram Mini App, open **Setup → MetaTrader 5 → Broker gold symbol**.
Save the exact Market Watch name, such as `XAUUSD.p`. The value applies to new
`XAUUSD` entries from TradingView and Telegram in EA 0.30.2 or later. Leave it
blank to use the EA symbol input. The connection test uses its separate EA input.

The EA keeps the SignalBridge order ID at the start of the MT5 comment. When the
alert supplies `timeframe` and `engines`, a comment can end in `T5s:Scalper`
or `T3m:Sc+LIT+ICT`. `T` means TradingView, `G` means Telegram, and
`Sc` means Scalper. The MT5 comment is limited to 31 characters, so long engine
lists may end with a count such as `+5`. Orders without metadata keep the source
label. For TradingView JSON, send `"metadata":{"timeframe":"5S","engines":["Scalper"]}`.
The tagged GOD MODE format accepts these fields directly. Plain Telegram messages
can include `TF: 3` and `Engines: Scalper, LIT, ICT` on their own lines.

### Optional daily loss limit

`InpEnableDailyDrawdown` is **off** by default. If enabled, the default
`InpDailyDrawdownPercent` is 10%. A hit closes all account positions, cancels
pending orders, and requires a manual restart once positions and orders are closed.
An existing HIT is ignored while the feature is off and is retained if protection
is re-enabled.
See [calculation, counters and limits](../docs/EA_V028_DAILY_DRAWDOWN.md).

### Approved command center — 0.29.0

Defaults are **TP1 = BE**, **TP2 = CLOSE**, **TP3 = OFF**. Both portals provide policy,
routing, preview and report controls. Native EA has Overview/Signals/Trades/Risk/
Settings tabs and compact mode. Report reset does not reset daily drawdown.
Partial exits require a hedging account; default BE/full close support netting too.
Keep MT5 running for local target actions. See the [release behavior and install
requirements](../docs/EA_V029_APPROVED_COMMAND_CENTER.md) before enabling routes.
