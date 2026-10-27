# SignalBridge Telegram Test

Run `SignalBridge-Telegram-Setup.ps1` with your Telegram Bot token plus the Connection ID and Webhook Secret supplied in the private test config.

The first valid chat/update claims the connection's `allowed_chat_id`. Later updates from other chats are ignored.

Supported deterministic test format:

```
XAUUSD BUY
LOT 0.01
SL 2700
TP1 2720
TP2 2730
TP3 2740
```

Use prices valid for the current market and broker. Demo execution is still gated by the MT5 EA's `InpEnableDemoExecution` setting.
