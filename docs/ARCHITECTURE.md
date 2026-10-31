# SignalBridge — Direct-EA Architecture
Technical description aligned to EA v0.29.1 · 2026-10-31

## Product rule

The standard installation path is intentionally reduced to:

1. one MetaTrader 5 EA;
2. one private SignalBridge Key inside the EA;
3. one private TradingView webhook URL.

No Node.js, PowerShell or local companion service is required in the standard flow.

## Production edge

- Worker: `drfx-signalbridge-ingress`
- Custom domain: `signalbridge.drfx.online`
- D1: `signalbridge-ingress`
- Durable Object: `AgentHub` (existing runtime class name; handles direct execution sockets and compatibility traffic)
- Direct EA WebSocket endpoint: `/v1/ea/ws`
- Backward-compatibility endpoint: `/v1/agent/ws` (not used for new installations)

## Realtime data flow

```mermaid
flowchart TD
 TV[TradingView Alert] --> W[Cloudflare Worker]
 TG[Telegram Bot] --> W
 DASH[Web Dashboard / Telegram Web App] --> W
 W --> DB[(D1)]
 W --> HUB[Durable Object execution hub]
 HUB <-->|Direct TLS/WebSocket| EA[MT5 SignalBridge EA v0.29.1]
 HUB <-->|Read-only WebSocket| DASH
 EA --> BROKER[Broker DEMO]
 BROKER --> EA
 EA --> HUB
 HUB --> DB
```

## Direct EA protocol

The EA establishes an outbound TLS connection to `signalbridge.drfx.online:443`, upgrades it to WebSocket and selects `signalbridge-ea-v1`.

Authentication uses the existing high-entropy execution-connection token. The token is consumed at the Worker boundary; the Durable Object receives only the authenticated connection identity.

The direct EA transport intentionally uses a compact text protocol inside WebSocket frames:

- `HELLO|...`
- `HB|...`
- `PING|...`
- `CMD|...`
- `RCPT|...`
- `RACK|...`

This avoids embedding a general JSON parser inside the EA while preserving durable command acknowledgments and broker reconciliation.

## Command durability

1. Authenticate source.
2. Validate fail-closed.
3. Persist source event.
4. Create durable command with deterministic correlation tag.
5. Dispatch only to a verified execution socket.
6. Keep undelivered work PENDING.
7. Replay PENDING/DELIVERED only after MT5 account readiness is known.
8. Reconcile broker evidence before accepting a retry as a new order.
9. Keep local pending state until a cloud `RACK` confirms the terminal result was stored.

## TradingView

TradingView posts to:

```text
POST /v1/ingress/tradingview/<private_connection_token>
```

The Worker validates, persists, normalizes and dispatches through the same execution hub.

## Telegram

Telegram Bot updates enter:

```text
POST /v1/ingress/telegram/<connection_id>
```

Bot pairing remains explicit. Telegram Web App is a control/monitoring surface.

The personal-account **MTProto connector is Coming Soon and inactive**. No personal Telegram session is created in the current release.

## Dashboard

The live dashboard remains backend-backed. It observes the execution hub through a read-only observer WebSocket and displays MT5 state, account telemetry, recent commands, cloud RTT and broker receipts.

## Compatibility boundary

`agent-windows/` and `/v1/agent/ws` are runtime compatibility artifacts. They are not AI coding assistants or requirements for a new installation. Remove them only after a separate dependency and rollback review.

## Current safety boundary

- DEMO execution only.
- Live MT5 account execution remains hard-blocked.
- Broker-side SL and local risk checks stay inside the EA.
- Unknown/ambiguous state fails closed.

## Release gates

The EA has a compiled release artifact; compilation does not establish broker end-to-end certification. Before full broker release certification:
- run direct TLS/WebSocket handshake against Production;
- validate reconnect + replay on DEMO;
- validate broker-rejection receipt recovery;
- run end-to-end TradingView → Cloudflare → EA → DEMO broker tests;
- repeat Telegram Bot → EA DEMO tests;
- security review of the direct WebSocket implementation.
