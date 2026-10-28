# DrFX Company / SignalBridge Membership Platform

Cloudflare-hosted standalone Worker to deploy at https://drfx.company. Uses the existing \`signalbridge-ingress\` D1 database and licensed direct EA transport; does not alter the live \`signalbridge.drfx.online\` ingress Worker.

## Plans
- Trial: 1 month SignalBridge, $0.
- Quarterly: 3 months SignalBridge and 52 premium indicators, $47.
- Annual: All product features, premium indicators, and a personalized-indicator consultation with the technical team, $165.

The premium indicator archive and EX5 installer must be separately supplied as private authorized downloads. The site never claims an asset is ready if not uploaded.

## Security and setup
1. Merge and deploy the EA licensing migration \`worker/migrations/0006_ea_licenses.sql\` to the existing D1 database, then \`site/migrations/0007_site_accounts.sql\`. **Do not deploy site authentication before migrations**.
2. Deploy \`site/src/worker.mjs\` together with \`site/src/ui.mjs\`, as a module Worker with a \`DB\` D1 binding to \`signalbridge-ingress\` and production custom domain \`drfx.company\`.
3. Set \`LICENSE_VAULT_KEY\`: 32-byte random key, base64-encoded, kept only as Cloudflare secret. Rotating it without re-encryption makes stored serials unrecoverable.
4. Set \`ADMIN_EMAIL\` to the founder's **verified** email address, or \`ADMIN_TELEGRAM_ID\` to a verified numeric Telegram ID. Role is set only after email code verification or authenticated Telegram webhook.
5. Connect a verified transactional sender: \`RESEND_API_KEY\`, \`MAIL_FROM\` (e.g., activation@drfx.company). Until these are set, email sign-in returns 503 and does not pretend to send anything.
6. Telegram: set \`TELEGRAM_BOT_TOKEN\` and independent \`TELEGRAM_WEBHOOK_SECRET\`, then register webhook with Telegram API to \`https://drfx.company/api/telegram/webhook\` using the secret token. With no token, the bot interface is disabled.
7. Payments: \`NOWPAYMENTS_API_KEY\` and \`NOWPAYMENTS_IPN_SECRET\` are required; checkout is disabled until both are set. Verify provider IPN and paid invoices before granting entitlements. Do not put either key in JS, URLs, source, or GitHub.
8. Test email sign-in, Telegram sign-up and login-code exchange, first-time EA account binding, expired/revoked licenses, admin controls and NOWPayments sandbox before advertising subscriptions.
9. Configure Cloudflare Turnstile/WAF, rate limits, MFA for Cloudflare/GitHub administrators, and privacy/terms content before public acquisition.

## Endpoints
- GET \`/\` responsive marketing site
- GET \`/api/config\` configuration readiness (no secrets)
- GET \`/api/me\`, \`/api/admin/users\`
- POST \`/api/auth/email/start\`, \`/api/auth/email/verify\`, \`/api/auth/telegram/code\`, \`/api/auth/logout\`
- POST \`/api/license/rotate\`, \`/api/checkout\`
- POST \`/api/admin/user\`
- POST \`/api/telegram/webhook\`, \`/api/payments/ipn\`

A verified email session can link a Telegram account by issuing a one-time link code, then sending \`/link <code>\` to the bot. The bot can issue a one-time web-login code with \`/login\`. No email or Telegram login credentials are stored.

Trial codes use 256-bit secure random values, hashed in \`ea_licenses\` and encrypted in \`site_licenses\`. Expiration starts on first successful EA activation. A new/rotated serial disables the old one. The EA and server must be deployed as a matching version; no unsupported or legacy connection keys authorize the premium EA.

## Not automatically included
Actual NOWPayments merchant credentials, Telegram BotFather token, email-sender verification, actual 52 indicator file licenses, independently signed production EX5, or published privacy/terms documents.

## Telegram admin commands
After setting `ADMIN_TELEGRAM_ID` to your own verified Telegram numeric user ID and completing webhook registration, use `/admin` for summary, `/users` for recent members, `/detail usr_...` for account status, `/grant usr_... trial|quarterly|annual` for plan assignment, and `/suspend usr_...`, `/resume usr_...`, `/revoke usr_...` for account/license control. Only the admin account can invoke them.

## Transactional email cost
Cloudflare Email Sending to arbitrary recipients requires Workers Paid as of October 2026. On Workers Free, configure Resend instead (`RESEND_API_KEY` as Cloudflare secret and `MAIL_FROM` as your authenticated sender); it offers a no-cost limited volume, subject to current provider quotas.

## Deployment and account verification
The Worker `drfx-company-site` has been deployed to Cloudflare with a D1 binding, and the D1 schema migrations are applied. Email delivery, Telegram BotFather credentials, payment merchant secrets, published EX5 and downloadable indicator packages remain external release gates. Do not send test real-money orders; canonical EA is DEMO-only.
