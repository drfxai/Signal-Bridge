# EA 0.29.0 — approved command center

Implements the owner-approved website, mobile Mini App and MT5 full/compact concepts.
AMOLED black, deep navy #061A2D, blue borders #17446D and gold #FFCC62; live cyan,
confirmed green and failure red. No generated example statistics ship in production.

## Dashboard

A shared responsive dashboard serves both authenticated portals: seven KPI cards,
source-filtered live signal table, saved exit policy, independent daily account-risk
status, two existing test actions, routing controls, parse preview, review/delivery
status and actual 14-day broker P/L bars. Member activation, membership, account
and admin controls remain under Settings. The mobile dashboard owns its four-tab
navigation; old navigation is suppressed only within this new workspace. Core
navigation/headings are localized in the existing six languages with RTL support.
Native MT5 uses chart objects for matching full/compact layouts and working tabs.
Native fonts, chart DPI and MT5 object rendering differ from raster design concepts.

## Exit policy

Defaults: TP1 BE, TP2 CLOSE, TP3 OFF. Each target supports OFF / BE / CLOSE / PARTIAL.
At least one full-close target is required. New positions snapshot policy and target
levels before broker entry. The first configured full-close target is also set as
broker TP. Missing required close targets reject entry. Existing positions retain
their saved policy when defaults change. Local inputs and portal policy can be
updated; changed local inputs synchronize before new signal execution.

The EA monitors BUY bid / SELL ask locally and recovers persisted state. A crossed
full-close target takes priority over BE or partial actions on a price gap. BE
preserves TP, never worsens an existing protective SL and waits for broker stop /
freeze distances. The fee buffer is in broker points; BE does not guarantee no loss.
Partial exits reduce to a deterministic remaining size, require a hedging account,
and respect lot minimum/step. An uncertain submission is reconciled, never blindly
resent. Netting accounts support default BE and full close; partials are blocked
with a visible reason. A broker-side TP is backup if the terminal is unavailable.
Local BE and partial handling require a running, connected terminal.

Target HIT and action APPLIED/UNCERTAIN are separate. Pending target events persist
locally and receive an ACK only after idempotent database storage. Received signals,
confirmed broker orders and target lifecycle events are never treated as synonyms.

## Reports

SignalBridge signal/target counters, account SL exits, realized positive/negative
cash P/L after trading costs, net P/L and floating P/L are explicit. Filters query
broker Today / 7 days / 30 days / since reset history. Reset report changes only
its cutoff, keeps raw broker history and position policy, and cannot clear the
daily drawdown latch or change its baseline. First upgraded signal/target counts
start with this EA's persisted observations; unavailable historical signal events
are not reconstructed or invented. Report reset uses broker-second resolution.

## Authorized Telegram routes

Users link their Telegram identity and verify a destination/source chat. A channel
requires both the user and bot to have administrative access. Reverification turns
routes off until explicitly saved again. Route switches default off; saving an
exit policy alone cannot activate an unsaved route switch.

TradingView forwarding uses a TELEGRAM_RELAY service binding to the existing member
Worker. The raw webhook credential stays in backend request headers, is verified
against its existing hash, and is never put into Telegram messages or log records.
Only the persisted, tenant-owned signal and verified destination can be sent.
The outbox is idempotent; unknown delivery results do not automatically resend.

Authorized Telegram signals use their chat/message identity for deduplication.
Self-relayed DrFX messages are ignored to prevent loops. Reply-bound TP/SL/CLOSE
updates resolve only the original tenant's position correlation. Edited messages,
unknown management references, ambiguous entry ranges, conflicting direction,
missing SL and unsupported pending order formats go to review, not guessed orders.

The parser supports strict TradingView JSON, DRFX tagged alerts, explicit simple
JSON, labeled multiline/compact text, configured default lots, TP lists, recognized
symbol aliases, and Persian/Arabic digits. Market orders are executable; recognized
pending formats remain review-only. Arbitrary prose is not a promise of recognition.
Ordinary LIVE signals remain DEMO-gated; the already-approved consented LIVE test
is separate. No maintenance validation submits real broker orders or chat messages.

## Deployment and validation

Apply worker migration 0013_member_controls.sql first. Add ingress service binding
TELEGRAM_RELAY → drfx-company-site. Preserve all existing secrets, D1 and AgentHub
bindings. Deploy member Worker then ingress Worker; install the new EX5 separately.
Tests use in-memory SQLite and mocked Telegram/MT5/browser traffic, including route
ownership, duplicate suppression, uncertain delivery, policy validation, report-reset
isolation, target ACKs and eight responsive DEMO/LIVE/HIT scenarios. MetaEditor
builds the actual EX5; broker E2E target management needs user-run DEMO validation.

TradingView labeled-text alerts require a stable `ID: event-123` line; simple JSON
requires `id` or `external_signal_id`. Retries preserve identity and cannot extend
the original command expiry. For example:

```text
ID: strategy-symbol-bar-time
BUY GOLD
LOT: 0.01
SL: 2300
TP1: 2350
TP2: 2360
```

These are illustrative format values, not current market prices or a trade recommendation.
A profile saved from the new portal cannot execute on an EA lacking exit-policy-v1;
install the new EA first. Activation/membership, language selection and administrator
access remain reachable from Settings; the existing Mini App account pages retain
their original navigation when opened.
