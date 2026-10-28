# SignalBridge Backend — Deployed DEMO Beta
Updated 2026-10-28

## Deployment

The Cloudflare backend is deployed at:

`https://signalbridge.drfx.online`

Core bindings:

- D1 `signalbridge-ingress`
- Durable Object `AgentHub`
- deployment tier `free`

The Worker supports DEMO execution routing but does **not** authorize live-account trading.

## Main endpoints

- `GET /health` — edge/binding status.
- `GET /dashboard` — realtime backend-backed command center.
- `GET /test` — focused manual pipeline test UI.
- `POST /v1/ingress/tradingview/{connection_token}` — TradingView JSON or GOD MODE tagged text.
- `POST /v1/ingress/telegram/{connection_id}` — Telegram Bot API webhook with secret header and paired chat allowlist.
- `GET /v1/agent/ws` — authenticated execution Agent WebSocket.
- `GET /v1/agent/status` — authenticated Agent/terminal snapshot.
- `GET /v1/dashboard/ws` — authenticated read-only dashboard observer WebSocket.
- `GET /v1/dashboard/summary` — authenticated recent command/account summary.
- `POST /v1/test/signal` — authenticated dry-run or DEMO test command.
- `GET /v1/commands/{id}` — authenticated command status.

## Persistence and idempotency

TradingView events are unique by `(connection_id, external_signal_id)`.

Telegram updates are unique by `(connection_id, update_id)`; their normalized payload is retained so a provider retry can safely recover command creation after a partial failure. Telegram commands use an update-scoped source reference and a partial unique index per Agent.

Commands are persisted as PENDING before realtime dispatch. A duplicate source event can retry a PENDING command instead of silently returning without dispatch.

## MT5 readiness gate

AgentHub dispatches only when:

- the authenticated Windows Agent socket is connected; and
- the Agent has explicitly reported the local MT5 terminal online with a bound account/server.

This avoids treating an Agent process as proof that MT5 itself is ready.

## WebSocket roles

Execution Agent and dashboard observer are different socket roles.

- execution Agent: may send terminal state and receipts;
- dashboard observer: read-only, receives account/terminal/receipt events and measured Agent↔Cloudflare RTT;
- observer connections never replace the execution Agent.

The secret-bearing WebSocket protocol is consumed for authentication; only a public protocol identifier is echoed by the server.

## Security

- 16 KiB request-body limit.
- SHA-256 token hashes stored in D1.
- one-time Telegram pairing code.
- no broker password stored in Cloudflare.
- CSP/frame restrictions on Worker-served HTML.
- receipt state transitions validated.
- no blind broker retry after unknown outcome.
- live account execution hard-refused in EA v0.23.

## Validation

Run:

```bash
npm run check
```

GitHub Actions runs syntax and contract/regression tests on Worker, parsers, Agent, dashboard, and static MT5 safety assertions.

## Still required before public beta

- real MetaEditor compile and DEMO broker E2E test;
- Cloudflare dashboard/test rate limiting is active; measured quota/usage alerting remains to be added;
- owner/session auth for multi-user dashboard use;
- chaos/reconnect testing;
- load testing;
