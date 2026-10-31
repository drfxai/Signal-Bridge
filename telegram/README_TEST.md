# SignalBridge — Telegram Signal Test

The standard user flow uses the existing Telegram bot and the [Client Portal](https://drfx.company/). No separate local setup script is required for users.

1. Sign in to your account, open Setup and enable Telegram → MT5 routing.
2. Authorize your intended Telegram channel or group through the account's available pairing flow.
3. Confirm the connected MetaTrader 5 EA is logged into the correct account and licensed.
4. Test a deterministic message in an approved channel using valid broker-specific prices:

```text
XAUUSD BUY
LOT 0.01
SL 2700
TP1 2720
TP2 2730
TP3 2740
```

Only use prices suitable for the current quote and a DEMO account. Confirm signal ingestion, dashboard state, MT5 execution receipts and any broker rejection in the logs. Ordinary live-account automation is not supported.

The test does not authorize an unpaired channel or bypass authenticated account and routing controls.
