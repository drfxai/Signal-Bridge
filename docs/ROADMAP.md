# SignalBridge — Delivery Roadmap
Updated 2026-10-28 · Free-first deployment strategy

## Infrastructure policy

Launch on Cloudflare Free. Begin Paid migration after ~500 DAU or earlier if usage reaches the operating thresholds in [CLOUDFLARE_FREE_FIRST.md](CLOUDFLARE_FREE_FIRST.md). Complete the migration before routine operation around 1,000 DAU.

## Milestone 0 — Product and architecture
- [x] Product blueprint and information architecture
- [x] Security/risk and API design
- [x] Premium responsive UI prototype
- [x] Free-first Cloudflare capacity and migration plan
- [ ] Canonical JSON Schema/golden fixtures for every trade action

## Milestone 1 — Free ingress foundation
- [x] TradingView Worker ingress code
- [x] D1 schema and connection-token helper
- [x] Persist-before-accept idempotency path
- [x] 49 automated parser/risk/ingress tests
- [ ] Provision dedicated Free `signalbridge-ingress` D1 database
- [ ] Deploy dedicated Free `drfx-signalbridge-ingress` Worker
- [ ] Apply production/staging migrations
- [ ] Measure Worker CPU and D1 row amplification
- [ ] Add quota/abuse monitoring and credential rotation

**Exit:** real TradingView demo webhook is durably stored on Cloudflare Free with measured resource cost and no trading side effects.

## Milestone 2 — Realtime Agent transport
- [ ] Implement account-scoped Durable Object Agent Hub
- [ ] Use Hibernatable WebSockets
- [ ] Build lightweight Windows SignalBridge Agent
- [ ] Agent enrollment, heartbeat and reconnect reconciliation
- [ ] Low-frequency HTTP recovery fallback
- [ ] Prove no per-terminal high-frequency polling is required
- [ ] Load test 100 → 250 → 500 simultaneous Agent sessions

**Exit:** 500 simulated agent sessions can remain connected within Free operating budgets under representative sparse signal traffic.

## Milestone 3 — MT5 demo execution
- [ ] Implement `DrFX_SignalBridge_EA.mq5`
- [ ] Bind Agent to exact account/server identity
- [ ] Demo-only market BUY/SELL and correlated CLOSE
- [ ] Symbol mapping and contract-spec validation
- [ ] Broker retcode / OnTradeTransaction reconciliation
- [ ] Restart/unknown-state/duplicate tests
- [ ] Hedging and netting demo accounts

**Exit:** one command creates at most one intended demo broker action and every outcome is reconciled.

## Milestone 4 — Telegram
- [ ] Real Telegram Bot webhook
- [ ] Per-channel authorization/allowlist
- [ ] Deterministic parser in production path
- [ ] Edited-message revisions
- [ ] TradingView → Telegram notifications
- [ ] MT5 → Telegram verified status notifications
- [ ] Mini App secure initData validation

## Milestone 5 — Free beta
- [ ] 50-user internal beta
- [ ] 100-user closed beta
- [ ] 250 DAU load/cost review
- [ ] 350 DAU capacity-watch mode
- [ ] 500 DAU scale-readiness review
- [ ] Keep normal usage <= 50–60% of critical quotas
- [ ] Preserve quota reserve for ingress and agent traffic

## Milestone 6 — Paid migration
Trigger: >500 DAU **or** sustained quota pressure, whichever comes first.

- [ ] Enable Workers Paid
- [ ] Introduce Queues + dead-letter dispatch
- [ ] Shard D1 by measured tenant/account pressure
- [ ] Increase observability/retention
- [ ] Run 1,000 DAU / burst load suite
- [ ] Complete migration before routine ~1,000 DAU operation

## Later
- Managed Windows MT5 hosting
- Advanced multi-account portfolio risk
- Enterprise roles/API
- AI-assisted extraction with deterministic safety gate
- Image signal parsing with human review

## Definition of Done

Each milestone requires code review, tests, operational documentation, resource measurements, explicit error states and auditable trade lifecycle evidence. No synthetic UI state is represented as a deployed capability.
