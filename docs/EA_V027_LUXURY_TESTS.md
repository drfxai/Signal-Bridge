# EA 0.27.0: compact live panel and two-action account tests

The owner-approved redesign replaces the test workspace with exactly two main
actions: **Connection Check** and **Open & Close Test**. Other member features
(webhook credentials, membership and administration) remain in their existing
sections. The test workspace has no execution-mode selector or duplicate test
buttons.

## Interface

Native MT5 compact panel: **242 × 84 logical pixels**, versus the previous
430 × 170 minimum. It shows real equity, open SignalBridge positions, account
type, license remainder, RTT and connection/test state. Expanded mode groups
balance/equity, signal source, execution and license details in black/navy/gold.
Native effects include a bounded border sweep, connection pulse, recent-command
highlight and actual test elapsed-time progress. `InpAnimations` and the clamped
100–1000ms `InpUiRefreshMs` control chart animation. Networking is unchanged by
animation frames; telemetry heartbeats are every five seconds and RTT probes
every ten seconds. Broker data remains terminal-sourced.

The website and Telegram Mini App share the same two-card component, moving
border light, orbital indicators, factual test lifecycle and changing-number
fade. Reduced-motion preferences disable decorative motion. Account telemetry
refreshes every ten seconds while the workspace is visible. Confirmation uses
an accessible native dialog; it is not a browser alert.

## DEMO and LIVE test boundary

Connection Check is read-only on both DEMO and LIVE accounts. Automatic
TradingView/Telegram signal execution remains DEMO-only.

Position tests use the dedicated `test_execute` mode and a freshly verified,
licensed, exact MT5 login/server/mode. The client must confirm that exact account;
LIVE confirmation additionally requires typing `LIVE`. The server checks a
separate `live-test-v2` capability and records the account identity. The EA
checks the identity again immediately before submission. A legacy demo request
cannot authorize a LIVE order.

EA settings default off:

- `InpEnableDemoExecution`: ordinary demo signals and demo test execution.
- `InpEnableConnectionTest`: position-test opt-in on either account type.
- `InpEnableLiveConnectionTest`: separate, explicit LIVE test opt-in.

Tests remain fixed to XAUUSD BUY 0.01 lots, after quote/spread/volume/position
checks. A broker-side emergency stop is required (`InpTestEmergencySLPoints`,
default 2000 points, adjusted above broker minimum distance). The local close
target is five seconds after fill. Broker execution, gaps, fees and disconnection
can affect price/timing; keep MT5 and the EA running. LIVE tests are real orders
with spread/fees and loss risk. This change does not itself place any order.

The journal binds its recovery intent to account mode, login and server. Safety
exits continue after license expiry or after opt-in switches are turned off.
They close only the exact identified test position and retry partial/failed
closure. Recovery never reopens a trade. Old demo journals remain recoverable.

## Deployment

Apply `worker/migrations/0012_test_execution_mode.sql`, then
`site/migrations/0013_test_account_binding.sql`, before publishing either Worker.
Migration 0012 copies every command column and rebuilds the same uniqueness and
lookup indexes while allowing `test_execute`. Back up and verify command counts
before/after production migration. Deploy ingress/AgentHub and the site together,
retaining the shared D1 and external AgentHub bindings and every existing secret.
Use EA 0.27.0 for the new account-bound test flow; old EA versions retain the
legacy DEMO endpoint only.

Validation includes real SQLite endpoint tests for account changes, separate
LIVE consent/capabilities, tenant isolation and confirmation cancellation,
responsive browser screenshots, and official Windows MetaEditor compilation.
No real broker account is exercised by CI.
