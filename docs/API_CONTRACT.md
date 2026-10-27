# SignalBridge — API Contract (proposed v1)
This is a **design specification**, not a deployed API.

## Authentication and trust
- Every ingress connection gets a high-entropy, revocable scoped secret.
- TradingView supports fixed configured webhook URLs and JSON bodies; avoid broker credentials or secrets in alert text. Use a unique opaque path token and configure source-specific controls.
- Telegram callback: verify Telegram webhook secret header and bot identity; Mini App initData must be verified server-side.
- Agent: outbound mTLS or short-lived scoped token with rotation, linked to a provisioned account and device.
- Replay controls: timestamp window for sources that provide it; otherwise receive-time TTL, opaque connection secret, rate limits and unique event IDs.

## Ingress
**POST /v1/ingress/tradingview/{connection_token}**
JSON body; returns 202 when durably accepted, 400 on schema error, 401/403 unauthorized, 409 for conflicting duplicate contents, 429 rate cap. Timing of API response is not a trade-fill signal.

**POST /v1/ingress/telegram/{bot_route}**
Telegram update envelope; validate source allowlist and updates.

**GET /v1/signals/{id}**, **GET /v1/commands/{id}**
Owner-scoped read status and immutable lifecycle events.

**POST /v1/routes/{route_id}/pause**
Pause NEW trade intents; separate **POST /v1/accounts/{id}/emergency-stop** for administrative safety gate with required step-up approval.

**GET /v1/agent/commands?account_id=...**
Authenticated agent pulls approved commands in sequence with a lease.

**POST /v1/agent/receipts**
Authenticated agent posts durable receipt with broker identifiers and evidence; local reconcile needed for ambiguous result.

## Canonical signal example
¤¤¤json
{
  "schema_version": "1.0",
  "external_signal_id": "tv-alert-uuid-001",
  "source_type": "tradingview",
  "action": "OPEN",
  "side": "BUY",
  "symbol": "XAUUSD",
  "order": {
    "type": "MARKET",
    "volume": { "mode": "FIXED_LOTS", "value": 0.01 },
    "stop_loss": 2490.0,
    "take_profits": [2510.0, 2520.0, 2530.0]
  },
  "occurred_at": "2026-10-27T18:00:00Z",
  "expires_at": "2026-10-27T18:00:30Z",
  "metadata": { "strategy": "example-not-financial-advice" }
}
¤¤¤

Fields not supplied by user/strategy must not be guessed by LLM. Action OPEN/MODIFY/CLOSE must be tied to explicit source intent; position-specific MODIFY/CLOSE requires a known execution correlation.

## Normalized command example
¤¤¤json
{
  "command_id": "cmd_01example",
  "tenant_id": "tenant_01",
  "account_id": "mt5_demo_01",
  "signal_id": "sig_01",
  "route_id": "route_01",
  "version": 1,
  "idempotency_key": "sha256-derived-server-side",
  "action": "OPEN",
  "symbol": "XAUUSDm",
  "order_type": "MARKET",
  "side": "BUY",
  "lots": 0.01,
  "sl": 2490.0,
  "tps": [2510.0, 2520.0, 2530.0],
  "valid_until": "2026-10-27T18:00:30Z",
  "risk_policy_version": 3,
  "execution_mode": "DEMO"
}
¤¤¤

The idempotency key must be scoped to (tenant, source connection, external signal ID, route, account, action, revision), not to text alone. Different targeted accounts legitimately create different commands.

## Agent receipt example
¤¤¤json
{
  "command_id": "cmd_01example",
  "command_version": 1,
  "agent_id": "agent_demo_01",
  "outcome": "BROKER_ACCEPTED_PENDING_RECONCILIATION",
  "terminal_ticket": "1234567",
  "broker_retcode": 10009,
  "observed_at": "2026-10-27T18:00:02Z"
}
¤¤¤

## Error envelope
¤¤¤json
{
  "error": {
    "code": "SYMBOL_MAPPING_UNRESOLVED",
    "message": "Account instrument mapping must be confirmed",
    "correlation_id": "req_01example",
    "retryable": false
  }
}
¤¤¤

## Contract evolution
JSON Schema files are a future implementation deliverable. Introduce schema versions, additive fields, golden fixture tests, and rejection of unsupported action types. Never interpret a failed parse as a BUY/SELL default.
