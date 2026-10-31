# SignalBridge — Integration Contract
Updated: 2026-10-31. This is an integration guide, not a promise that every historical design endpoint is deployed.

## Trust boundary
- TradingView alerts use a unique private webhook token; never put broker credentials in alert bodies.
- Telegram events are accepted only through an authenticated bot webhook with source authorization.
- Every MT5 execution connection must authenticate and present a verified, licensed terminal/account identity.
- All credentials are scoped, revocable and stored server-side. A successful HTTP response does not imply a broker fill.

## Current endpoints
- `POST /v1/ingress/tradingview/<private_token>` — configured TradingView alert ingress.
- `GET /v1/ea/ws` — direct EA TLS/WebSocket upgrade (`signalbridge-ea-v1`).
- `GET /v1/dashboard/summary` and `GET /v1/dashboard/ws` — authenticated telemetry and read-only observer.
- `POST /api/telegram/webhook` on `drfx.company` — verified Telegram bot updates.
- `POST /api/payments/ipn` on `drfx.company` — payment notification with provider-side signature verification.
- `GET /api/me` and site portal routes — authenticated membership operations.

The authoritative public contracts are the current Worker routers in `worker/src/index.mjs` and `site/src/worker.mjs`. All route permissions, status codes, request shapes and idempotency rules must be confirmed against deployed code before integration.

## Example TradingView payload
```json
{
  "symbol": "XAUUSD",
  "side": "BUY",
  "lot": 0.01,
  "sl": 2490.0,
  "tp1": 2510.0,
  "tp2": 2520.0
}
```

Prices are illustrative. Validate broker symbol, contract, direction, tick size, price and risk limits before dispatch. Never infer a BUY/SELL default from a failed parse.

## Execution lifecycle
Validation → durable signal identity → risk authorization → direct EA command → broker result → durable receipt. The EA must distinguish submitted/pending from filled and reconcile broker state before retrying unacknowledged work.

## Security
- Per-user webhook isolation, expiry/rotation and replay rejection must be tested.
- Unknown execution states fail closed.
- DEMO-only automatic execution; separately opted-in LIVE connection tests follow a distinct consent flow.
- Do not log activation codes, Telegram secrets, session identifiers or provider credentials.

Further guidance: [Architecture](ARCHITECTURE.md), [MT5 execution](MT5_EXECUTION.md) and [Public Release Checklist](PUBLIC_RELEASE_CHECKLIST.md).
