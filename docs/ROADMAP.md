# SignalBridge — Product Roadmap
Updated: 2026-10-31

## Current product
- Direct MetaTrader 5 EA connection over TLS/WebSocket; personal TradingView webhook.
- Authorized Telegram signal routing and Telegram Mini App/member portal.
- SignalBridge plans: one full month free, $47 / three months, $165 / year.
- Scalper Pro plans: $19 / 30 days, $49 / 90 days.
- Automatic trade signals are restricted to DEMO accounts. LIVE connection tests require distinct explicit consent.
- The EA v0.29.1 compiled release is published separately; a source file is still visible in this public repository.

## Release verification still required
- Independent broker DEMO end-to-end tests for TradingView, Telegram, hedging/netting and multi-broker symbols.
- License expiration, revocation, wallet payment IPN signature, idempotency and billing entitlement tests.
- Real-device website, tablet and Telegram Mini App validation, including RTL translations.
- Source-code licensing and Git history confidentiality review; move proprietary EA builds out of public CI.
- Confirm release-binary checksum and require branch protections before commercial readiness.

## Planned (not announced as available)
- Telegram personal-account connectivity, subject to separate security approval.
- Additional trading-account and broker compatibility improvements.
- Stronger observability and customer-facing support diagnostics.

## Release policy
Published UI, a successful CI run or an EX5 asset is not equivalent to production or real-money trading certification.
Refer to [Public Release Checklist](PUBLIC_RELEASE_CHECKLIST.md) for unresolved gates.
