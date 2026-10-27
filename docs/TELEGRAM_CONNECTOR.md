# Telegram Connector Specification
## Product routes
1. TradingView → Telegram: bot posts formatted text/optional media to approved chat IDs.
2. Telegram → MT5: parse messages from channels/groups where bot has appropriate access, route through common risk gate.
3. MT5 → Telegram: push execution events, account health, alerts and selected authenticated control intents.
4. Mini App: route settings, simulation, logs and agent status, with server-side initData verification.

## Permission models
- Bot API: a bot receives channel posts when appropriately added to that channel; group access depends on membership, admin rights and privacy settings.
- An ordinary bot cannot read arbitrary private Telegram channels or direct messages of unrelated users.
- Optional user-account MTProto connector is **not** MVP; would require separate consent, session encryption/revocation, operational/legal review and careful handling of Telegram terms. Never request raw session strings through the UI.
- Explicit per-channel allowlist and user-visible access status.

## Parsing pipeline
Telegram update → verify origin → deduplicate update_id/message_id/edit revision → classify signal/non-signal → deterministic parse → normalized candidate → symbol resolver → ambiguity gate → risk policy → command route.

Recognize actions OPEN, MODIFY_SL, MODIFY_TP, PARTIAL_CLOSE, CLOSE, CANCEL with evidence from source and correlation to prior trade. Edited Telegram messages become revisions, never brand-new OPEN by default.

**Examples for tests only**
- 'BUY GOLD 2500 SL 2490 TP1 2510 TP2 2520 TP3 2530'
- 'Sell XAUUSD now, SL 10 pips, TP 20 pips' → reject/confirm if pip size/instrument context undefined.
- 'Close half of signal 42' → require resolved original execution and account-specific quantities.

## Ambiguity policy
- Confidence is an extraction metric, not trading accuracy.
- AI is optional and cannot create missing entry, SL or action values.
- If multiple entries, conflicting updates, stale quotes or missing mapping: PREVIEW / APPROVAL_REQUIRED / REJECT, never auto-execute.
- Multilingual extraction requires a curated fixtures corpus with Arabic/Persian/English and explicit separators/decimal conventions.
- Image/OCR signals are P2 and default to manual review.

## Notifications and security
- Separate notification bot and trading control privileges when practical.
- Delivery status: QUEUED, SENT, FAILED (never infer delivered/read without provider evidence).
- Sensitive control commands require verified user, explicit account selection, step-up confirmation and audit log.
- Rate-limits, per-channel noise filtering, exponential retry on HTTP 429 and retention limits.
- Follow Telegram Bot API and Mini App security specifications.

## Telegram Mini App screens
Quick start, Connections, Channel Sources, Parser Preview, Routes, Risk, Trades/Receipts, Notifications, Billing. All controls indicate DEMO vs LIVE clearly and visually.
