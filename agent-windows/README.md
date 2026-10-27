# SignalBridge Windows Agent v0.21

Requires Node.js 22+ only; there are no npm dependencies.

1. Copy `config.example.json` to `config.json`.
2. Paste the private 43-character Agent token.
3. Run `node agent.mjs` (or `npm start`).
4. Start MT5 and attach the SignalBridge EA.

Cloudflare uses a persistent WebSocket. MT5 uses TCP on `127.0.0.1:17777` with TCP_NODELAY; no internet polling is used by the EA.
