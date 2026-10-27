# SignalBridge Windows Agent v0.20

Purpose: low-latency bridge between Cloudflare AgentHub and the MT5 EA.

## Run
1. Install Node.js 22 LTS.
2. Copy `config.example.json` to `config.json`.
3. Put the one-time Agent token in `config.json`.
4. Run:
   ```
   npm install
   npm start
   ```
5. Keep the process running while MT5 is open.

Cloud path is persistent WebSocket. MT5 path is TCP on `127.0.0.1:17777`; no internet polling is used between the EA and Agent.
