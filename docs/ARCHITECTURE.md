# SignalBridge — Technical Architecture
Version 0.1 · Decision record / proposed design

## Design constraints
- Cloud edge cannot host a Windows MetaTrader 5 terminal or an MQL5 Expert Advisor.
- MT5 trade execution occurs through an installed, authorized terminal/EA on local Windows or Windows VPS/managed Windows instance.
- Signal delivery over queues is at-least-once; use application idempotency and reconciliation, not optimistic exactly-once assumptions.
- HTTP 2xx at webhook ingress means accepted by ingress, **not filled by broker**.
- Every tenant, connection and command is isolated.

## Logical data flow

¤¤¤mermaid
flowchart TD
    TV[TradingView webhook] --> W[Cloudflare Worker ingress]
    TG[Authorized Telegram bot/webhook] --> W
    W --> A[Authenticate, parse, rate-limit]
    A --> DB[(Command + Event Store)]
    DB --> Q[Outbox + durable dispatcher]
    Q --> N[Normalizer + Risk/Policy engine]
    N -->|rejected| AU[Auditable rejection]
    N -->|approved| C[Account command queue]
    C --> EA[MT5 Execution EA on Windows]
    EA --> BROKER[MT5 / broker]
    EA --> RESULT[Results + broker reconciliation]
    RESULT --> DB
    DB --> UI[Web / Mini App dashboard]
    DB --> BOT[Telegram notifier]
¤¤¤

## Deployable components
1. **Web app:** Next.js/TypeScript, responsive and accessible; tenant-scoped API via backend.
2. **Edge API:** Cloudflare Workers; TV and Telegram webhook receivers, independent secrets, synchronous input validation.
3. **Durable state:** PostgreSQL recommended for trading journal and transactional outbox; Cloudflare D1 is an optional MVP substitute after concurrency review.
4. **Dispatcher:** Cloudflare Queues for async work; per-account ordering controlled by coordinator (Durable Objects or DB lease).
5. **Risk and policy service:** canonical checks independent of channel. Fail closed on stale specs, missing terminal account state or violated cap.
6. **MT5 agent:** MQL5 Expert Advisor with outbound TLS polling initially; optional desktop service later for persistent connections.
7. **Telegram adapter:** Bot API for channels/groups where the bot is authorized; never silently scrape user chats.
8. **Observability:** structured events, metrics, traces, encrypted secret store, role-scoped support diagnostics.

## Boundary diagram

¤¤¤mermaid
sequenceDiagram
    participant V as TradingView
    participant I as Webhook ingress
    participant D as Durable store/outbox
    participant R as Router/Risk
    participant E as MT5 EA
    participant B as Broker
    V->>I: POST signal + scoped secret
    I->>D: Persist raw-safe envelope + idempotency key
    D-->>I: Commit accepted
    I-->>V: 202 accepted + correlation_id
    D->>R: Dispatch queued intent
    R->>D: Record decision / command
    E->>D: Poll next authorized command
    D-->>E: Command + monotonic revision
    E->>B: Send request after local checks
    B-->>E: Retcode / order or deal events
    E->>D: Receipt and reconciliation evidence
    D-->>R: Final state / notification
¤¤¤

## Suggested deploy topology
- Static/SSR dashboard: Cloudflare-compatible web hosting, or Railway if operational requirements favor Node runtime.
- API and Telegram bot webhook: Cloudflare Workers.
- Queue: Cloudflare Queues with controlled consumer concurrency; dead-letter support.
- Account coordinator: Durable Object per tenant/account or serialized worker with DB advisory lock.
- Database: managed PostgreSQL with migrations, PITR backups and transactional outbox.
- Secret encryption: KMS-backed key hierarchy and rotated tokens.
- Agent: MT5 desktop/VPS with OS/terminal watchdog. Dedicated tenant terminal isolation for hosted plans.

## Why a transactional outbox
A webhook is ACKed only after persisting signal + outbox entry in the same transaction. A dispatcher replays unsent outbox records safely. Consumer processing may repeat: unique constraints and account-scoped state prevent duplicate order submissions.

## Command state machine
RECEIVED → VALIDATED → {REJECTED | APPROVAL_REQUIRED | QUEUED} → CLAIMED → SUBMITTED → {BROKER_REJECTED | FILLED | PARTIAL | UNKNOWN_RECONCILE} → SETTLED.
Only verified account/deal evidence may mark FILLED. UNKNOWN_RECONCILE blocks blind retry and initiates broker query.

## Ordering and editing
Maintain monotonic command version per source message, account and intent. Telegram edits emit an UPDATE revision referencing original signal ID, not a new OPEN. CLOSE and MODIFY may not overtake OPEN; reconcile if earlier step unresolved.

## Storage core tables
- tenants, users, memberships, connections, source_allowlists
- signals (normalized, raw redacted payload reference, received_at, expires_at)
- routes, risk_policies, symbol_mappings, instrument_specs
- commands (idempotency_key UNIQUE, state, version, intent, account_id)
- command_events (append-only), executions, broker_orders, broker_deals
- agent_heartbeats, approvals, notification_deliveries, audit_events
Use tenant_id in every row and composite tenant-scoped constraints.

## Risk-critical implementation notes
- No reliance on queue ordering for trading actions; serialize per account.
- Do not use a generic blind HTTP retry after unknown broker result.
- Map client-order-intent IDs to MT5 order/deal IDs; broker may not support native client order IDs, so maintain resilient terminal reconciliation.
- Server-side risk approval is necessary but insufficient: local EA re-checks symbol, volume, market status and account constraints.
- On changing broker, account or symbol contract, invalidate cached execution assumptions.

## Deployment environments
Development, staging, demo-broker integration, production with separate keys/secrets/queues/databases. Live execution is disabled by default until release approval.
