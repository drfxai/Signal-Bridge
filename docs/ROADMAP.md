# SignalBridge — Delivery Roadmap
Updated 2026-10-28

## Milestone 0 — Product and architecture
- [x] Product blueprint and security model
- [x] Premium UI references
- [x] Free-first Cloudflare capacity plan
- [x] Realtime Windows Agent architecture

## Milestone 1 — Cloudflare ingress
- [x] Dedicated D1 database
- [x] Deployed Worker on `signalbridge.drfx.online`
- [x] TradingView token authentication and durable idempotency
- [x] GOD MODE tagged alert parser
- [x] Telegram webhook + one-time pairing
- [x] D1 command state
- [x] Durable Object Agent Hub
- [x] PENDING redispatch and Telegram partial-failure recovery
- [ ] Production quota/abuse dashboards and alerting
- [ ] Final zone rate-limit policy verification

## Milestone 2 — Realtime Agent transport
- [x] Hibernatable Durable Object WebSocket
- [x] Windows Agent
- [x] localhost TCP MT5 bridge
- [x] separate Agent-online vs MT5-online state
- [x] read-only dashboard observer WebSocket
- [x] no high-frequency terminal HTTP polling
- [x] offline 100 → 250 → 500 Free-plan capacity model
- [ ] validate capacity model with measured staging/production analytics

## Milestone 3 — MT5 DEMO execution
- [x] DEMO-only BUY/SELL
- [x] broker-side SL/TP/spread/volume validation
- [x] risk-percent sizing from broker contract values
- [x] broker retcode and `OnTradeTransaction`
- [x] persistent pending-submission ledger in EA v0.23
- [x] restart reconciliation / unresolved-replay block
- [x] GOD MODE TP/SL/CLOSE correlation
- [x] hedging TP1/TP2 partial management
- [ ] MetaEditor compile certification
- [ ] real DEMO E2E execution test
- [x] netting TP1/TP2 implementation with absolute-volume replay guards
- [ ] real broker validation of netting TP1/TP2 behavior
- [ ] broker matrix / symbol suffix validation

## Milestone 4 — Live Dashboard
- [x] backend-backed `/dashboard`
- [x] authenticated D1 summary
- [x] realtime terminal/account observer socket
- [x] realtime broker receipt events
- [x] integrated test-signal control
- [ ] production owner/session authentication
- [ ] multi-Agent/account selector
- [ ] richer charts/latency/quota telemetry

## Milestone 5 — Telegram expansion
- [x] Telegram → MT5 deterministic DEMO route
- [x] chat/channel pairing
- [x] retry-safe update idempotency
- [x] deterministic English/Persian/Arabic production parser with conflict/duplicate guards
- [ ] edited-message revision workflow
- [ ] TradingView → Telegram notifications
- [ ] MT5 → Telegram execution/status notifications
- [ ] Telegram Mini App

## Milestone 6 — Free beta and scale
- [ ] 50-user internal beta
- [ ] 100-user closed beta
- [ ] 250 DAU cost/reliability review
- [ ] 350 DAU capacity watch
- [ ] 500 DAU paid-migration decision gate

## Paid migration
Begin after >500 DAU or earlier sustained quota pressure. Complete before routine ~1,000 DAU operation.

Planned additions:
- Workers Paid
- Queues + dead-letter dispatch where measured usage justifies it
- D1 sharding by tenant/account pressure
- longer observability retention
- 1,000 DAU burst/load suite

## Definition of Done

A feature is complete only when code, tests, operational documentation, measured resource usage and failure behavior agree. Synthetic UI state must never be represented as live production telemetry.
