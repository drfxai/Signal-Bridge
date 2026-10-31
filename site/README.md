# DrFX Company — SignalBridge Membership & Telegram Mini App

Public website: https://drfx.company · MT5 edge: https://signalbridge.drfx.online

## Overview
Cloudflare Worker site and customer portal, with D1-backed authentication, subscription/licensing controls, administrative operations, and a Telegram Mini App. The MT5 ingestion Worker is a separate service and must not be replaced during a website deployment.

## Current public plans
| Product | Duration | Price |
| --- | --- | ---: |
| SignalBridge | One-month trial | $0 |
| SignalBridge | Three months | $47 |
| SignalBridge | One year | $165 |
| Scalper Pro | 30 days | $19 |
| Scalper Pro | 90 days | $49 |

The checkout interface alone does not prove funds received. Server-side verified payment events and entitlement checks are required.

## Runtime and deployment
- Worker entry: `src/worker.mjs`; UI and modules under `src/`.
- Config: `site/wrangler.jsonc`; assets: `site/public/`.
- D1 binding: `DB` using the shared `signalbridge-ingress` database.
- Durable Object service binding: `AGENT_HUB` (existing transport runtime identifier; do not rename without an explicit compatibility migration).
- Apply all pending migrations from `worker/migrations/` and `site/migrations/` in verified order on a backup/test database before production.
- From `site/`, deploy through `npx wrangler deploy` using the existing authorized Cloudflare connection. Do not delete D1 bindings or overwrite production secrets.
- Verify `/api/config` readiness flags, `/api/me` sessions, product pricing, user entitlements and admin isolation after deployment.

## Cloudflare secrets (never commit)
- `LICENSE_VAULT_KEY`: stable base64-encoded 32-byte key for encrypted license records; rotation requires a data-migration plan.
- `RESEND_API_KEY` and verified `MAIL_FROM`: email code delivery.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET`: protected Telegram integration.
- `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET`: payment creation and authenticated IPN verification.
- `SCALPER_LICENSE_SECRET`: must match the private Scalper Pro EA signing key.
- Optional, verified configuration: `ADMIN_EMAIL`, `ADMIN_TELEGRAM_ID`, `SCALPER_DOWNLOAD_URL`.

Do not put actual secrets in repository, URLs, frontend JavaScript, CI logs or support messages. Replacing `LICENSE_VAULT_KEY` without re-encryption makes existing stored codes unrecoverable.

## Telegram
- Bot webhook: `POST /api/telegram/webhook`.
- Mini App: `https://drfx.company/telegram`; server verifies Telegram signed initData.
- Configure the bot menu/webhook only from an authorized environment using `node scripts/configure-company-telegram-bot.mjs` at repository root.
- Admin operations are accessible only after verified account authorization. The website and Mini App share account entitlements, not unverified identity claims.
- The bot's long-lived website sign-in code and EA activation code are different secrets. Never publish either.

## Licensing and checkout
- Email and Telegram login issue server-validated sessions; email verification feedback and repeat-login persistence need real-device regression testing.
- All NOWPayments entitlements must be issued only after an authenticated, idempotent paid IPN event. A redirect or payment link is not proof of payment.
- A Scalper Pro license is bound to the verified customer's MT5 account and must remain revocable.
- Run `npm run check` in the repository root and verify payment, login and mobile portal flows before deployment.
- Direct EA and timed tests must retain their DEMO-only automatic-trading boundary and explicit LIVE connection-test consent.

## Operational release gates
Review [the repository public release checklist](../docs/PUBLIC_RELEASE_CHECKLIST.md) before customer acquisition. GitHub CI success is not a guarantee of production email delivery, payments, broker execution or regulatory compliance.
