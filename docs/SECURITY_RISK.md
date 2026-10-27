# Security, Trade Safety and Reliability
**Status:** design threat model; controls below are REQUIRED before live release.

## Threats and mitigations
| Threat | Required mitigation |
| --- | --- |
| Stolen URL/connection token | Opaque scoped credential, revocation, rotation, anomaly rate limits; do not log URL query/path secret |
| Replayed webhook/Telegram update | Persisted source/revision idempotency keys; timestamps/TTLs |
| Duplicate queue delivery | Unique DB constraint + terminal receipt cache + broker reconciliation |
| Forged agent receipt | Device/account binding, authenticated agent session, monotonic command revision |
| Cross-tenant data access | Tenant-scoped query enforcement, authorization integration tests |
| LLM hallucinated instructions | Deterministic schema, no missing-value inference, policy engine outside AI |
| Compromised Telegram account | Session validation, source allowlist, step-up trade-control approvals |
| Broker outage/partial fill | Unknown state workflow; no blind submission retry |
| Terminal account switch | Re-enroll/rebind account; refuse orders on mismatch |
| Leaked broker credentials | Do not collect MT5 password for BYO deployments; encrypted vault for hosted if unavoidable |

## Risk decision order
1. Ensure route active and user explicitly opted in to requested execution mode.
2. Ensure source is allowlisted, fresh, not duplicated and command version is current.
3. Ensure target agent/account matches exact authorized broker and instrument.
4. Resolve instrument specifications, market status, quote freshness and pricing conventions.
5. Check broker margin/leverage constraints and lot min/max/step; never silently increase exposure.
6. Check risk budget: total exposure, max open positions, per-trade cap, daily loss cap, spread/deviation and order frequency.
7. Validate stops, TPs, position ownership and partial close quantities.
8. Approve, reject with machine-readable reason, or request human approval.

Risk should use broker account state and available verified specs, not only a user-input balance. Define whether sizing uses balance vs equity; differentiate points, pips, ticks and account-currency conversion.

## Kill-switch semantics
- PAUSE_NEW: reject dispatch of new OPEN commands; can optionally permit safety-reducing close/modify under separate policy.
- EMERGENCY_STOP: immediate suspension and alert, audit + step-up; it does NOT silently liquidate positions.
- CLOSE_ALL: distinct high-impact operation with verified selected accounts, confirmation and idempotency.

## Fail closed
- Invalid payload, unresolved mapping, stale signal, missing account heartbeat, unknown trade state, ambiguous source message, unsafe margin or exceeded risk → no new trade.
- External services unavailable → log pending/blocked event with reason; no silent fallback to market order.

## Security implementation checklist
- TLS, strict CORS, CSRF protection for cookie auth, CSP for Mini App/web, dependency pinning and SCA, secrets management, MFA.
- All trading actions require tenant ownership and least-privilege role; support access separately audited and consent-gated.
- Encryption at rest for credentials; redact all tokens, account identifiers as appropriate and private Telegram message data in logs.
- Audit events append-only, data retention and deletion plan, backups plus restore drills, incident response, penetration tests.
- Privacy terms, broker platform terms and jurisdictional compliance review before paid launch.

## Reliability tests
- Chaos: at-least-once re-delivery, lost ACK, 5xx, 429, DB failover, agent restart after order submission.
- Conflict: two simultaneous routers to same account, edit arrives before initial post processed, close before fill.
- Acceptance: no double execution in replay harness; no unverified FILLED status; operator can trace every attempt.

## Disclosure
Product automates user-selected trade instructions; trading risks, leverage, slippage, margin calls and broker rejection remain. Backtesting or demos are not evidence of guaranteed profits.
