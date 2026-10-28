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

## Cinematic website redesign — approved visual reference (2026-10-28)

- Site uses the approved DrFX luxury mockup structure: high-contrast midnight black/deep navy background, static trading-terminal hero, SignalBridge/MT5/license feature cards, a single animated cinematic world connection panel, and three pricing cards ($0 / $47 / $165).
- The **first hero animation is removed**. The old low-resolution MP4 assets and Worker media routes were removed, and `site/src/media.mjs` was deleted. There are no videos or large remote image dependencies.
- The remaining global network visual is an original, high-DPI 2D Canvas renderer with projected geographic silhouettes, city lights, luminous routing arcs, atmospheric rim and sunrise. It sizes to devicePixelRatio (capped at 2), uses ResizeObserver and IntersectionObserver, pauses when hidden, respects `prefers-reduced-motion` and Save-Data, and runs without external API keys.
- Hero market quotes and network paths are **illustrations**, not live data, confirmed broker execution statistics or a guarantee of trading performance. Never add fabricated uptime or user-count claims.
- English and Persian website translations are included; customer/administrator dialogs and existing email/Telegram flows remain connected to the existing D1-backed API.
- Cloudflare deployment requires **two** Worker modules: `worker.mjs` and `ui.mjs`. Preserve all existing D1 and secret bindings; never rotate `LICENSE_VAULT_KEY`.
- This design deployment does not imply email, Telegram, NOWPayments, live trading, EA EX5 delivery or indicator releases have completed their separate operational gates.

## Account provider onboarding — email first, Telegram second, billing last (2026-10-28)

The public GET https://drfx.company/api/config returns readiness flags: email, telegram, payments and licensing. These booleans never disclose credentials. The following steps require the actual provider account credentials.

### 1. Verify email sender

1. Verify drfx.company in a transactional email provider such as Resend. Add **only the DNS records Resend generates** for the domain, including SPF/DKIM and suitable DMARC; do not create speculative records or duplicate SPF entries.
2. Add the encrypted Cloudflare Worker secret RESEND_API_KEY to drfx-company-site. MAIL_FROM=activation@drfx.company is already supplied as plain text.
3. Use a real mailbox to test sign-in code sending, receipt and one-time code validation. The email login code is hashed in D1 and expires after 10 minutes.
4. Check that email=true on /api/config. Without a verified domain and working provider, leave signup disabled.

### 2. Configure dedicated Telegram bot

1. Create/select the DrFX Company membership bot with BotFather. Do not repurpose an unrelated trading webhook bot without confirmation of its existing functions.
2. Add Cloudflare Worker encrypted secrets TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET (random 16–256 characters using alphanumerics, underscores or hyphens) to the same drfx-company-site Worker. Optionally set ADMIN_TELEGRAM_ID to the verified numeric admin user ID.
3. From a trusted local terminal with secrets loaded as environment variables, execute:
   node scripts/configure-company-telegram-bot.mjs
   This installs the secret-protected Telegram webhook, private-chat Mini App menu button and user commands without printing credentials.
4. Send /start, then /app in a private chat. Users request /login to view their *reusable* 32-character website password; /resetlogin replaces it and revokes website sessions. Link a verified email account with its unique website-generated /link CODE; never merge accounts based on unverified contact details.

### 3. Telegram Mini App

The dedicated Mini App is https://drfx.company/telegram and loads in an ordinary browser only as a non-authenticated preview. The Telegram WebView supplies Telegram.WebApp.initData. The server POST /api/auth/telegram/webapp validates an HMAC-SHA-256 signature (WebAppData), signed timestamp (15-minute maximum age, future clock skew at most 60s), absence of duplicate parameters, and a valid Telegram identity before creating a site session.

After login, GET /api/me displays the same membership, trial period and encrypted-at-rest license record as the main site. The serial is masked by default. The web app never trusts initDataUnsafe and does not auto-merge email and Telegram identities. For verification run tests/telegram-miniapp.test.mjs, then test in Telegram on Android/iOS and desktop, including expired/revoked accounts.

### 4. NOWPayments after identity and EA testing

Only after email → Telegram bot → Mini App → first EA DEMO license activation and revocation tests pass, configure encrypted NOWPAYMENTS_API_KEY and NOWPAYMENTS_IPN_SECRET and run independent sandbox IPN checks. Quarterly remains $47, annual $165. Browser success URLs do not grant subscriptions. Do not modify the running signalbridge ingress Worker in this onboarding.

## Permanent Telegram website login (2026-10-28)

Each verified Telegram member has exactly one long-lived, 32-character high-entropy DrFX website sign-in credential (24 random bytes, 192 bits) created via `/login`. Repeat `/login` returns the **same code**, not another one-time OTP. A permanent code does not expire on a timer or after use, but is revoked by `/resetlogin`, administrator suspension, or a future security action. Password hashes (SHA-256 of random high-entropy tokens) are used for lookup and AES-GCM-encrypted copies for authenticated bot redisplay. The underlying EA activation code from `/code` is separate and is never an account password.

`/resetlogin` replaces the credential and invalidates website sessions; users then sign back in with the new code. Treat this code as a password: do not paste it into support chats, screenshots, public logs, git or TradingView alerts. The website browser session cookie expires after 7 days, but this does **not** expire the permanent login code. The initial legacy 16-character OTPs are accepted only until their original 10-minute expiry to support migration.

D1 migration `site/migrations/0009_permanent_telegram_logins.sql` must be applied to the shared production D1 **before** deployment. Only the website Worker changes; SignalBridge EA ingress and existing Telegram webhook must not be replaced. The Telegram bot's command-menu descriptions are updated in `scripts/configure-company-telegram-bot.mjs`; running that script requires the existing secure environment credentials and modifies the menu/webhook, so avoid re-running it unnecessarily.
