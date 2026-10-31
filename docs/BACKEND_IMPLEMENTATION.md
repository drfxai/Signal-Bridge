# SignalBridge — Cloudflare Runtime
Updated: 2026-10-31

## Components
- `drfx-signalbridge-ingress`: Cloudflare Worker for authorized TradingView ingress and direct MT5 WebSocket transport.
- `drfx-company-site`: independent membership, subscriptions, website and Telegram Mini App Worker.
- `signalbridge-ingress`: shared D1 database with carefully ordered migrations.
- Durable Object `AgentHub`: existing executable class/binding name for socket state, dispatch and broker receipt reconciliation. The name is a runtime compatibility requirement, not a user-facing product name.

## Execution
The current direct EA uses `GET /v1/ea/ws` for authenticated TLS/WebSocket sessions. The Worker authenticates the connection and forwards an authorized identity to the Durable Object. The EA sends compact protocol frames (`HELLO`, `HB`, `CMD`, `RCPT`, `RACK`) while durable records remain in D1.

Existing legacy transport routes may remain reachable for compatibility; do not decommission them without explicit deployed-client dependency tests.

## Public UI
- Member dashboard uses authenticated customer data. Preview UI may display illustrative values only with appropriate labels.
- Telegram Mini App identity requires server-side signed `initData` verification.
- Admin authorization must be verified server-side for each privileged route.
- Payment and license grants must be idempotent and contingent on authenticated provider IPN.

## Deployment boundaries
Do not change production D1 IDs, Durable Object names, webhook secrets or licensing encryption keys as part of cosmetic cleanup. Apply and test migrations before deploying Workers. Keep production changes out of repository-presentation cleanup PRs.

See [Architecture](ARCHITECTURE.md) and [Public Release Checklist](PUBLIC_RELEASE_CHECKLIST.md).
