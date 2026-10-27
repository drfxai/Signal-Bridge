
# Live Cloudflare Deployment

Deployment target: Cloudflare Free plan.

## Production resources
- Worker: `drfx-signalbridge-ingress`
- D1: `signalbridge-ingress`
- D1 ID: `9439ff03-b1ec-47e6-b2b6-b8f2e7d33559`
- Custom hostname target: `signalbridge.drfx.online`
- Durable Object: `AgentHub` (SQLite-backed)
- Queue: intentionally not used on the Free critical path.

## Runtime endpoints
- `GET /health` — deployment/binding health.
- `POST /v1/ingress/tradingview/:connection_token` — authenticated TradingView JSON ingestion.
- `GET /v1/agent/ws` — authenticated Agent WebSocket upgrade using `Authorization: Bearer <agent token>`.

## Safety boundary
The deployed service receives and stores signals and hosts an authenticated realtime transport. It does not enable broker order execution. The MT5 EA remains in the UI/telemetry milestone until demo-account reconciliation tests pass.

## Agent enrollment
Generate an agent credential offline:

```bash
node scripts/generate-agent-connection.mjs tenant_id "My MT5"
```

Store only `token_sha256` in D1. The raw token is shown once to the user/agent and is not committed.

## Free-plan behavior
The Agent Hub uses Durable Object WebSocket hibernation. High-frequency terminal HTTP polling is prohibited. D1 is used for durable source records and enrollment state, while connection heartbeats remain on the realtime channel.
