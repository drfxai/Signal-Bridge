# DrFX SignalBridge — Product Requirements
Updated: 2026-10-31 · Implementation-aligned reference; feature status is defined by deployed code and test evidence.

## Product scope
SignalBridge accepts authorized TradingView alerts or Telegram signal messages, validates them, and routes explicit execution instructions to a licensed MetaTrader 5 terminal. It provides account controls and receipt-based feedback; it is not an automated strategy generator or an investment-advice system.

## Supported routes
1. TradingView → MT5: authenticated private webhook to direct EA execution.
2. TradingView → Telegram: per-chat webhook relay and verified chat selection.
3. Telegram → MT5: authorized chat/channel ingestion and deterministic signal parsing.
4. MT5 → dashboard/notifications: broker receipts, connectivity and account-control state.

## User experience
- Installation uses one MT5 EA and one personal TradingView webhook; no companion application.
- Member portal provides sign-in, account entitlements, setup, connection tests, logs and routing options.
- Website, desktop and Telegram Mini App support localized labels and responsive layouts.
- Scalper Pro licensing is a separate product entitlement with its own download and verification rules.

## Core controls
- Bound credentials and server-side authorization for every action.
- Per-user webhook separation, secret rotation, request validation and replay/idempotency handling.
- Broker symbol and volume checks; deterministic SL/TP management and account-specific correlation.
- Automatic signals execute only in DEMO mode. A LIVE connection test requires explicit, separately verified consent.
- Default daily account drawdown guard is 10%, closes all account positions when triggered and stays latched until explicit restart.
- Failed, delayed or ambiguous broker results must not be represented as confirmed fills.

## Explicit exclusions
- Fabricated performance statistics, guaranteed fill prices or guaranteed latency.
- Autonomous model-generated trading orders or unreviewed ambiguous-signal execution.
- Unapproved access to Telegram private accounts or broker accounts.
- LIVE automatic trading without independent certification and authorization.

## Release acceptance
- Compile and independently checksum the distributable EX5.
- Verify reconnect, partial fill, broker rejection, duplicate delivery, timeout and safety behavior.
- Verify OTP/Telegram sessions, suspension, licensing and NOWPayments IPN on real provider environments.
- Complete secret scan of current tree and Git history, and protect proprietary build material.
- Verify mobile, tablet, desktop and Telegram WebView with real devices.

Implementation and operational gates: [Architecture](ARCHITECTURE.md), [Security](../SECURITY.md), [Public Release Checklist](PUBLIC_RELEASE_CHECKLIST.md).
