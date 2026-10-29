# EA 0.26.0 — connection controls and signal compatibility

## Deployment order

1. Apply `site/migrations/0011_connection_tests.sql` to the **shared** site/ingress D1 database, after existing migrations 0001–0010. This adds a test status table and one-active-test-per-agent index; it does not enable trading.
2. Deploy the ingress Worker (`worker/src/index.mjs`) and its AgentHub class, then the company site Worker (`site/src/worker.mjs`). Keep existing credentials and bindings. Both require the same database and AgentHub namespace.
3. Compile the main EA source with official MetaEditor; install the resulting 0.26.0 EA on a **demo account**. Existing 0.25.1 clients retain ordinary signal support but cannot run the timed test.
4. Enable Algo Trading, `InpEnableDemoExecution` and (separately) `InpEnableConnectionTest`. Both inputs default to false. Configure broker symbol prefix/suffix if gold is named `XAUUSDm`, etc.
5. Use the existing read-only connection check first. Explicitly confirm the timed test in either the website or Telegram Mini App. Use the authoritative status display to distinguish queued, opened, closed and retrying.

No production deployment or real-money execution is implied by merging these changes. The existing independent review requirement for distributing EX5 binaries remains in force.

## Timed connectivity test

The server requires an active unexpired license, exact bound login/server, fresh EA heartbeat (under 90 seconds), demo account and the advertised timed-test capability. The command is fixed: BUY XAUUSD, exactly 0.01 lots, market entry and a local close target of five seconds after a confirmed fill. The server command expires after 15 seconds; no caller-supplied lot, side or instrument is accepted.

EA checks broker lot constraints, spread, symbol availability, maximum positions and its explicit test/demo switches. It refuses the test while any position exists on that symbol, including manual positions. It serializes its test journal per account/server/magic with an exclusive lock and persists the exit intent **before** sending the order. Unknown broker submission outcomes are reconciled without submitting a second order.

Timed exit runs before cloud reconnect and from tick events. Blocking reconnect/network work is suspended during test/recovery. Recovery identifies the exact correlation-tagged position and closes by ticket. It retries failed/partial closure; it does not close unrelated positions or reopen a test. Restart recovery attempts immediate closure using broker position/deal evidence and the persisted journal; it does not wait for an untrusted wall-clock deadline. A pending test is not automatically assumed closed when a position temporarily disappears.

**The five-second interval is a target, not a guaranteed fill/exit time.** Broker execution, disabled Algo Trading, a stopped terminal/removed EA, machine downtime or absent market connectivity can delay closure. MT5 and the EA must remain running. A test order has no SL/TP and is demo-only. A corrupt journal or uncertain order outcome blocks another test and requires inspection in MT5. Demo entry controls/licensing never prevent local recovery from attempting a safety close.

`connection_tests.status` tracks test lifecycle separately from entry command receipts: `ARMED`, `OPEN`, `CLOSED`, `CLOSE_FAILED`, `REJECTED`. `FILLED` on the entry command means the entry filled; it does **not** mean the test closed. Final reports persist locally until acknowledged. The status API is restricted to the owning user. Repeat requests are rate limited and only one unresolved test per agent is permitted.

## Personal TradingView execution mode

`POST /api/webhook/mode` accepts only `dry_run` or `demo_execute`. Enabling demo execution requires explicit confirmation and a currently verified demo EA. Users can return to dry run while offline. Every change is audited and scoped to the authenticated user's connection. It affects subsequent alerts; existing positions and previously persisted commands are not cancelled.

## EA license and panel

HELLO and heartbeat acknowledgements both refresh expiry. The remaining duration advances using server UTC plus a monotonic timer, rather than trusting local wall-clock changes. New commands require a nonexpired license and a verification age below 90 seconds. The server rechecks rotation, revocation, account binding and expiry before dispatch. Expiry refreshes after plan changes. Invalid database date values fail closed.

The black/navy/gold panel shows verification, remaining days/hours/minutes, UTC expiry, balance/equity, open positions, P/L, RTT, latest source/strategy/signal, execution and test recovery. Compact mode remains available. No activation secret is displayed.

## Signal formats

| Source | Supported input | Notes |
| --- | --- | --- |
| TradingView | Canonical JSON schema 1.0 | Any indicator capable of emitting the documented contract can integrate; Pine source itself is not executed by MT5. |
| TradingView | Tagged `[[DRFX]]…[[/DRFX]]` | Existing GOD MODE entry and management events. |
| Authorized Telegram bot connection | Standard English/Persian/Arabic text | Explicit direction, symbol, lot, SL and TP1 required. No guessed fields. |
| Authorized Telegram bot connection | Canonical JSON schema 1.0 | Strategy metadata is carried to the EA panel. |
| Authorized Telegram bot connection | Tagged GOD MODE | Entry, TP1/TP2/TP3, SL and CLOSE using the original correlation ID. |

Telegram connections still require the existing webhook secret and exact authorized chat binding. Membership/sign-in bot commands are separate from the trading-ingress bot endpoint. Freshness is checked against message time and original forwarded time (less than 60 seconds); edits require review and are not executed. Malformed JSON does not fall through to prose parsing. Ambiguous proprietary formats, images/OCR and arbitrary indicator code are not automatically supported.

For another indicator, emit the JSON contract in `docs/API_CONTRACT.md` with a stable unique `external_signal_id`, real UTC `occurred_at`/`expires_at`, and `metadata.strategy`. Test with dry run first. Receiving an alert is not proof of broker execution.

## PR reconciliation

PRs #49 and #56 contain earlier versions of features already superseded on `main`: admin centers, private webhooks, six-language picker and factual marketing. Their snapshots would regress later authentication/language work. This change preserves the newer implementations and replaces the obsolete disabled-test placeholder. The old PRs can be closed as superseded after this replacement is reviewed.

## Validation

`npm run check` syntax-checks JavaScript across site, worker, design, Windows agent, scripts and tests, then runs the full Node test suite. SQLite-backed endpoint tests apply every migration and cover ownership, confirmation, demo/freshness/capability gates, durable dispatch, concurrency, webhook modes and lifecycle status. The Windows Actions workflow compiles EA 0.26.0 using official MetaEditor; actual broker timing/restart tests remain an explicit manual verification step.

Browser CI renders desktop, tablet, mobile website and Telegram Mini App controls with fictional test data. Screenshots are uploaded as `portal-responsive-ui-previews`; they are UI previews, not evidence of live trading. Confirmation cancellation must send no trade request, and accepted confirmation must send exactly one.

## Production connectivity repair — 2026-10-29

A source merge alone does not publish Cloudflare Workers. Production previously
lacked the connection-test table, the site-to-ingress Durable Object binding,
and the current test controls in both JavaScript assets.

`site/wrangler.jsonc` now declares the shared D1 database and the **external**
`AgentHub` class from `drfx-signalbridge-ingress`. Never create a separate site
namespace: both Workers must resolve exactly the same EA object IDs.

When deploying, apply migration 0011 before either Worker update. Preserve
existing secret bindings (particularly `LICENSE_VAULT_KEY`, Telegram token and
webhook secret), plain-text variables and domain routes. If using Wrangler,
use the site config with `--keep-vars`; if using multipart API uploads, retain
secret bindings with `keep_bindings: ["secret_text"]`. Ingress must continue
declaring `AgentHub` as an existing SQLite Durable Object export.

`GET /api/config` exposes `ea_hub` and a non-secret release marker for verifying
the deployed site. A failed EA readiness check no longer consumes the timed-test
rate limit. The panel explains old/disabled EA capabilities and the required
`InpEnableDemoExecution` / `InpEnableConnectionTest` inputs. The read-only
connection check no longer depends on the optional webhook credential request
succeeding.

Production verification: both public JavaScript assets contain the test/status handlers, `/api/config` reports the new release and `ea_hub: true`, and ingress health is healthy. An isolated temporary authenticated QA fixture verified the real site → D1 → external Durable Object snapshot path (HTTP 200, snapshot available, no trade), and correctly rejected an offline demo-test attempt with `EA_NOT_READY` (HTTP 409). The temporary QA account/license/session rows were removed afterward. No broker position was opened.
