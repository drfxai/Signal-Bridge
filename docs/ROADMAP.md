# SignalBridge — Delivery Roadmap
Planning estimate: ~8–10 weeks for a small experienced team to build a scoped demo MVP, subject to validation. Production live trading requires further gates.

## Milestone 0 — Repository/decisions (now)
- [x] Product blueprint, routes, information architecture, wireframe prototype
- [x] Security, API, agent and connector design documents
- [ ] Confirm deployment vendors, tenant isolation design and product name
- [ ] Define canonical JSON Schema and golden test fixtures
**Exit:** architecture review approved and success metrics baseline set.

## Milestone 1 — Backend foundation (weeks 1–3)
- [x] Ingestion-only Worker + D1 schema + secure connection token helper + 22 contract tests
- [ ] Real D1/Wrangler staging integration, operational rate limiting and credential rotation
- [ ] TypeScript monorepo structure, lint, tests, format, CI, secret scanning
- [ ] Auth/tenant DB schema, scoped connection tokens, migrations
- [x] TradingView ingress validation; persist-before-202 and D1 idempotency (storage only; local contract tested)
- [ ] Event store + outbox, dispatcher and dead-letter pipeline
- [ ] Normalizer + account-serialized routing + basic risk gate
**Exit:** simulated webhook produces one audited command even under retries.

## Milestone 2 — MT5 demo execution (weeks 3–5)
- [ ] MQL5 EA enrollment and heartbeat
- [ ] Authenticated HTTPS polling + account verification
- [ ] Market BUY/SELL and correlated CLOSE on demo
- [ ] Broker trade retcode/events + restart reconciliation
- [ ] Contract spec / symbol mapping and basic guardrails
- [ ] E2E tests on hedging/netting accounts
**Exit:** verified broker deal events and no replay-induced second orders.

## Milestone 3 — Dashboard and Telegram (weeks 5–8)
- [ ] Responsive Next.js dashboard: Overview, Connections, Routes, Risk, Activity
- [ ] Onboarding with dry-run and agent diagnostics
- [ ] TradingView → Telegram notifications
- [ ] Permissioned Telegram → MT5 deterministic parser
- [ ] Edit/revision handling, allowlists and manual approval
- [ ] Mini App basic secure login + views
**Exit:** demo multi-route flows with audit and explicit permissions.

## Milestone 4 — Harden and release MVP (weeks 8–10)
- [ ] Replay/chaos matrix and rate-limit/latency measurements
- [ ] Privacy/ToS review, threat model, penetration checks, backup restore drill
- [ ] Product help, connection guides, error catalog, SLO dashboards
- [ ] Staged rollout: internal → closed beta → demo-access public
**Exit:** release checklist approved; live mode remains gated until broker/compliance validation.

## Beyond MVP
- [ ] Hosted Windows MT5 provisioner and billing
- [ ] Multiple accounts, advanced TP/trailing/break-even, portfolio risks
- [ ] AI-assisted parser + image signals with human verification
- [ ] Advanced analytics, alerts, enterprise roles and APIs

## Workstream ownership proposal
- Platform: API/DB/queue/security
- Execution: MQL5/MT5 integration and broker matrix
- Integrations: TradingView and Telegram adapters
- Frontend: dashboard and Telegram Mini App
- QA/SRE: replay tests, observability and operations

## Definition of Done
Code review, tests, runbook update, signal lifecycle traceability, permissions and error states tested. Demo acceptance evidenced by broker events; no slide/demo-only feature represented as implemented.

## Release risks
Access to broker demo environments, netting/hedging differences, Telegram channel permissions, external webhook rate and timeout behavior, Windows hosted MT5 infrastructure cost, regional compliance and payments.

## Update — 2026-10-28
The TradingView webhook **ingress storage** slice is implemented in a feature branch; this is not a full execution backend. No Cloudflare resources were provisioned. See [BACKEND_IMPLEMENTATION.md](BACKEND_IMPLEMENTATION.md) for authenticated intake, deployment prerequisites and missing production controls. Broker execution remains disabled.
