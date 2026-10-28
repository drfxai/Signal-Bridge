# SignalBridge Windows Agent v0.23.1

Requires Node.js 22+ only; there are no npm dependencies.

1. Copy `config.example.json` to `config.json`.
2. Paste the private 43-character Agent token.
3. Run `node agent.mjs` (or `npm start`).
4. Start MT5 and attach `DrFX_SignalBridge_EA_v0.23.mq5` (or the canonical `DrFX_SignalBridge_EA.mq5`).

Cloudflare uses a persistent WebSocket. MT5 uses TCP on `127.0.0.1:17777` with TCP_NODELAY; no internet polling is used by the EA.

Agent v0.23.1 measures the real Cloudflare WebSocket round-trip time from existing heartbeat acknowledgements and publishes it to the live dashboard without adding fast polling.
