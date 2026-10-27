# SignalBridge TradingView Ingress — Backend Milestone (2026-10-28)

> **Implemented but NOT deployed:** A Cloudflare Worker with authenticated TradingView webhook ingress and durable D1 signal capture. **No brokerage execution, MT5 terminal or Telegram bot exists yet.**

## What is implemented
- `GET /health` returns service status with `execution_enabled:false`, not a broker connection.
- `POST /v1/ingress/tradingview/{connection_token}` receives JSON signal envelopes, verifies a connection-specific random token using its SHA-256 digest in D1, rejects unsupported schema/actions/metadata and enforces a 16-KiB request limit.
- Time-limited canonical OPEN / BUY or SELL / MARKET / FIXED_LOTS intents are stored as **RECEIVED only**. This is a storage receipt, *not a trading command*.
- D1 unique constraint on `(connection_id, external_signal_id)` provides deduplication: duplicate payload returns HTTP 200 with original ID, conflicting payload returns HTTP 409.
- Authentication failure, invalid schema and database outage fail closed; persistence must succeed before HTTP 202.
- Local token-enrollment helper generates 256-bit opaque URL token and SQL that stores **only its hash**.
- Node contract tests include retries, stale alerts, invalid actions, duplicate identifiers, malformed JSON and disabled execution. UI remains synthetic.

## Security notes
TradingView alerts cannot attach arbitrary custom HTTP headers. Therefore this implementation uses a connection-specific opaque secret **in a private URL path**. Treat the URL like a password: do not include in public screenshots, analytics, issue reports or logs. Database stores only SHA-256 and cannot recover original token. Revoke by setting `ingress_connections.status = 'revoked'`.

Security baseline is not sufficient for an unrestricted production deployment. Add Cloudflare WAF/rate limiting, token rotation UI, deletion/retention policies, explicit tenant RBAC, monitoring and independent security review before public exposure. Do not include broker account credentials in the alert JSON.

## Local setup — after creating your own Cloudflare resources
1. Create an isolated D1 database named `signalbridge-ingress` (Cloudflare dashboard or `npx wrangler d1 create signalbridge-ingress`).
2. Replace the placeholder D1 `database_id` in root `wrangler.toml` with your actual database UUID; do not publish credentials.
3. Run `npx wrangler d1 migrations apply signalbridge-ingress --local` to prepare a **local** D1 environment.
4. Create a test connection: `node scripts/generate-tv-connection.mjs tenant-demo conn-demo`. Keep the generated token and private URL in a password vault.
5. Run its generated SQL statement (containing a SHA-256 digest, **not the plaintext token**) against the local database using Wrangler or a trusted D1 admin console.
6. Start `npx wrangler dev --local` (install current Wrangler CLI separately). Only your own local worker can now receive authorized requests. The static UI (`npm run dev`) continues using synthetic demo data.
7. Before any remote deployment: provision environment-specific DB and domain, review security configuration and manually apply the migration to the intended Cloudflare environment. **No deployment, token or D1 database was created by this GitHub change.**

## Signal envelope (example expires; regenerate timestamps for tests)
```json
{
  "schema_version": "1.0",
  "source_type": "tradingview",
  "external_signal_id": "unique-alert-20261028-001",
  "action": "OPEN",
  "side": "BUY",
  "symbol": "XAUUSD",
  "order": {
    "type": "MARKET",
    "volume": {"mode": "FIXED_LOTS", "value": 0.01},
    "stop_loss": 2500,
    "take_profits": [2510, 2520, 2530]
  },
  "occurred_at": "2026-10-28T10:00:00Z",
  "expires_at": "2026-10-28T10:01:00Z"
}
```

## Responses
| HTTP | Meaning |
|---|---|
| 202 | Authenticated and durably recorded, `execution_enabled:false` |
| 200 | Identical, already recorded signal; no additional row |
| 400 | Invalid JSON/encoding or disallowed query string |
| 401 | Unknown or revoked token |
| 405 | Wrong method |
| 409 | Duplicate external signal ID with different valid content |
| 413 | Body exceeds 16 KiB |
| 415 | Expected application/json |
| 422 | Invalid/expired schema, stop/TP/volume or unsupported action |
| 503 | Database unavailable / write not confirmed |

The request is not signed by TradingView; secrecy of the 256-bit URL token is the authorization boundary. Payloads have a five-minute maximum validity window and must be transmitted over HTTPS in deployment.

## Tests
Run `npm run check` (UI + parser + Worker contract checks). A test-double models D1 query behavior; **real Cloudflare D1 integration tests are a separate pending gate**, as are live TradingView alert delivery checks and measured latency.

## Next milestones
- Durable outbox and independently authorized account-scoped routing with risk policies.
- Authenticated read-only signal history, tenant-scoped UI and audit logs, WAF/rate limits, retention controls.
- MQL5 demo-only execution agent, broker-side reconciliation and restart/unknown-order safety.
- Telegram bot ingestion with explicit channel permissions, source allowlists and human approval policies.
- Staging/production threat modeling and controlled rollout. There is **no real trading execution** at this milestone.
