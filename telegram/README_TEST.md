# SignalBridge Telegram Test

Run `SignalBridge-Telegram-Setup.ps1` with the Telegram Bot token, Connection ID, Webhook Secret and one-time Pair Code supplied in the private test configuration.

The connection does **not** bind to the first arbitrary message. The intended chat/channel must first send:

```
/signalbridge_pair <PAIR_CODE>
```

A successful one-time pairing stores that chat ID and invalidates the Pair Code. Messages from other chats are ignored.

Supported deterministic test format:

```
XAUUSD BUY
LOT 0.01
SL 2700
TP1 2720
TP2 2730
TP3 2740
```

Use prices valid for the current broker quote. Demo execution remains gated by `InpEnableDemoExecution` and a MetaTrader **DEMO** account.
