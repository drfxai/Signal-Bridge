# SignalBridge — Commercial Model (Hypotheses)
Prices below are preliminary **DrFX product suggestions**, not vendor quotes or measured unit economics.

## Packaging hypothesis
| Plan | Monthly USD | Proposed entitlements |
| --- | ---: | --- |
| Demo Free | $0 | 1 demo connection, limited alerts, dry-run |
| Starter | $12 | 1 MT5 account, TradingView → MT5 |
| Pro | $29 | Up to 3 accounts, Telegram routes, more risk controls |
| Business | $69 | Up to 10 accounts, advanced auditing, API |
| Hosted MT5 | Add-on | Windows hosted terminal(s), metered separately |

Set fair-use event quotas after real load testing. Regulatory/broker terms and country availability require review.

## Differentiation
- One signal contract for TradingView and Telegram.
- Evidence-backed command tracking: accepted vs submitted vs broker-confirmed.
- Granular safeguards and visibility across user-owned terminals.
- Demo-first onboarding and optional BYO Windows VPS.
- Permissioned Telegram parsing, with explainable validation rather than black-box AI trade choices.

## Unit economics worksheet
Contribution margin = subscription net of payment processing − edge/queue/DB/log costs − notifications/LLM parsing − expected support burden − managed terminal costs − refunds. Hosted Windows MT5 should be quoted by measured resources, separate from base software.

## Go-to-market
1. Invite-only beta with technically experienced MT5/TradingView users.
2. Document independent interoperability with public Pine Script templates.
3. Validate funnel: register → pairing → dry-run → broker-confirmed demo trade.
4. Introduce Telegram source parsing and paid plans only after failure matrix passes.
5. Expansion: agencies, signal providers with legal consent, team accounts.

## Decision metrics
Conversion from onboarding to first demo-trade, active connected accounts, critical errors per 1,000 signals, retention, churn, support cost, incident count, gross margin by tier.

## Payments
External web checkout and Telegram Mini App checkout have different platform constraints. Validate the current Telegram Stars rules for digital goods/services sold inside Telegram before implementation.

## Competitive research caveat
PineConnector and @tfwebhook_bot are comparison references, not dependencies or approved partners. Pricing/features change; verify directly before external market-facing claims.
