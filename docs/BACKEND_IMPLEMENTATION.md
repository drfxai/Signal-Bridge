# SignalBridge Backend Implementation
V3 direct-EA architecture · 2026-10-28

## Edge components

- Cloudflare Worker ingress.
- D1 durable source/command records.
- Durable Object execution hub (class remains named `AgentHub` internally for migration compatibility).
- Read-only dashboard observer WebSocket.
- Direct MT5 EA execution WebSocket.

## Endpoints

- `POST /v1/ingress/tradingview/:token`
- `POST /v1/ingress/telegram/:connectionId`
- `GET /v1/ea/ws` — standard direct MT5 execution transport.
- `GET /v1/dashboard/ws` — read-only UI observer.
- `GET /v1/dashboard/summary`
- `POST /v1/test/signal`
- `GET /v1/commands/:id`

The old `/v1/agent/ws` endpoint remains available only as a rollback transport while V3 is validated.

## Direct EA protocol

At the Worker boundary a high-entropy SignalBridge Key is authenticated against the execution connection record.

The Worker strips credentials before forwarding identity to the Durable Object.

The EA-facing WebSocket uses compact text frames so the MQL5 client does not need a JSON parser:

- `READY`
- `HELLO`
- `HB`
- `PING/PONG`
- `CMD`
- `RCPT`
- `RACK`

Commands are still persisted as canonical JSON in D1. The compact frame is only a transport representation.

## Dispatch

A command is not dispatched unless an authenticated execution socket has a verified MT5 account identity. PENDING commands are replayed only after an offline → ready transition.

## Dashboard

Dashboard observer sockets are read-only and can never supersede an execution connection or submit broker commands.
