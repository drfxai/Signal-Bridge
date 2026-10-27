# DrFX SignalBridge — Product Requirements (PRD)
Version: 0.1 · 2026-10-27 · Status: Proposed / not implemented

## 1. Product promise
One auditable control plane connecting authorized TradingView alerts, Telegram messages, and MetaTrader 5 trading terminals. The user selects where a signal goes; the system validates and tracks every transition from alert receipt to broker-confirmed result.

**Not** a trading strategy, a profit guarantee, or a hosted MetaTrader terminal in serverless infrastructure.

## 2. Personas
- Individual trader: one MT5 demo/live account and TradingView alerts, no server administration required except a local MT5 or optional hosted terminal.
- Telegram signal follower: permission to access selected channels, channel-specific risk caps, optional manual approval.
- Signal publisher: authorized publication of TradingView alerts to Telegram groups/channels with branded templates.
- Multi-account operator: broker symbol remapping, isolated risk budgets, account-by-account audit, and fleet health.
- Support/admin: diagnostics with redaction; no default access to trade credentials.

## 3. Four canonical routes
1. TradingView → MT5: validated order intents to execution agent.
2. TradingView → Telegram: alert relay with templates and delivery states.
3. Telegram → MT5: permissioned ingestion, parsing, confidence/ambiguity gate, human confirmation as needed.
4. MT5 → Telegram: verified fill, reject, connection and safety notifications; sensitive controls require step-up verification.

Routes share one normalized signal contract and one policy engine. Their status is configurable independently.

## 4. MVP scope (P0)
- Tenant/workspace, auth, API token rotation, one MT5 demo account connection.
- TradingView webhook ingestion and JSON normalization with schema validation.
- Market BUY/SELL, CLOSE specified position, fixed lot, stop loss and take profit, configurable per-connection exposure limits.
- Symbol-map and contract-spec lookup; execute only if exact mapping is confirmed.
- Signal idempotency, expiry, account-specific order state, durable audit log and end-to-end correlation ID.
- MT5 EA heartbeat, polling, command execution acknowledgment and broker reconciliation.
- Dashboard: setup wizard, Connections, Router, Activity, Risk, Trade History, Diagnostics.
- Manual pause / emergency stop for NEW commands, distinguish cancel vs close-all.
- End-to-end demo account test and comprehensive failure/retry tests.

## 5. P1 scope
- TradingView → Telegram bot notifications with user-approved chat IDs.
- Telegram → MT5 for authorized channel sources, explicit deterministic formats, edited messages and CLOSE/UPDATE mapping.
- Multi-account routing and TP management by hedging/netting account model.
- Telegram Mini App, performance analytics, configurable approvals, paper mode.
- BYO VPS and managed Windows hosting offering (paid separately).

## 6. P2 scope
- AI-assisted multi-language parsing of ambiguous messages, image extraction with mandatory user review unless proven safe.
- Advanced risk presets, smart routing, team roles, third-party API, subscription billing, self-service provisioning.
- Optional desktop companion for persistent transport and lower latency.

## 7. Explicitly out of scope for MVP
- Automated AI trading decisions, investment recommendations or strategy signals invented by the bridge.
- Support for unauthorized private Telegram channels.
- Windows/MT5 hosting inside a Cloudflare Worker.
- Guaranteed sub-second end-to-end execution, profit or uninterrupted market access.
- Fully automatic bulk closure across all accounts via unauthenticated Telegram message.

## 8. Primary user journeys
**TV alert → demo order:** connect demo terminal → copy endpoint + secret → configure TV alert → send test → validate intent → risk decision → deliver → EA executes → record broker retcode + deal → dashboard shows terminal outcome.

**Telegram channel → demo:** user authorizes source → sample messages tested in preview → rules saved → allowlisted channel publishes → parser outputs normalized intent → fail-closed ambiguity check → risk check → approved demo execution.

**Safety:** user presses Pause New Trades → ingress may log new messages but must not dispatch any new OPEN command until resumed. Restart does not replay already executed signal.

## 9. Operational SLO targets (not guarantees)
- Webhook acknowledgment after durable acceptance: p95 < 2 seconds (measured).
- Ingest-to-command-ready latency: target p95 < 500 ms excluding external providers, tested before public claim.
- 100% command lifecycle traceability within system boundary.
- 0 duplicate orders in replay/chaos tests for identical (tenant, source, signal ID, route, account, action revision) keys.
- 100% high-risk ambiguity rejection for defined test corpus.
Actual broker execution time, fill price and outages are not controlled by this service.

## 10. Acceptance gates
- Each action has immutable event trail and broker-side evidence of completion/failure.
- Demo E2E tests pass on at least two MT5 broker configurations, hedging and netting.
- Connectivity loss, reconnect, stale signal, race conditions, restart and duplicate delivery tests pass.
- No raw auth secret in logs; least-privilege tenant isolation proven in tests.
- Mandatory live-trading safety disclosures and explicit opt-in (separate from demo).
- All application screens support empty, pending, degraded and failed states.

## 11. Product KPIs
Setup success rate, median setup duration, webhook acceptance ratio, signal parsing rejection rate, agent online rate, command reconciliation completeness, alert-to-decision latency, broker rejection frequency, retained subscribers and support tickets per 100 users.

## 12. Release policy
Current repository contains design artifacts only. Code, live connection and compliance validation are separate development deliverables.
