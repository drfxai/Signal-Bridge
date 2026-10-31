# SignalBridge — Public Release Checklist

Status on 2026-10-31: this GitHub repository is already **PUBLIC** and distributed as **commercial source-available / all rights reserved**, not an open-source license grant.

## Repository presentation
- [x] Public README, commercial LICENSE, SECURITY.md and CONTRIBUTING.md are present.
- [x] README identifies direct EA deployment, primary routes, pricing and DEMO-only automatic execution.
- [x] Public images are labelled as illustrative, not broker-verified performance.
- [ ] Native-speaker review for English, Persian, Arabic, Turkish, Russian and Hindi.
- [ ] Real-device UI validation on Android, iOS, desktop and Telegram WebView.

## Intellectual property and provenance
- [x] No tracked developer-tool instruction manifest was found by the initial tree listing.
- [ ] **BLOCKER:** the proprietary `mt5/DrFX_SignalBridge_EA.mq5` is still tracked in this already-public repository and included in history. Separate the private build/release pipeline before claiming compiled-only distribution.
- [ ] Full Git history scan for secrets, credentials, proprietary source and unwanted internal development metadata; the working-tree audit alone is insufficient.
- [ ] Identify any credential actually disclosed and rotate it; history edits alone do not revoke secrets or remove forks/caches.
- [ ] Review third-party assets and licenses, including imagery, JS dependencies and executable releases.
- [ ] Configure protected branches and required status checks.

## Security and transaction verification
- [ ] Revalidate real email OTP and Telegram login against isolated customer/admin sessions.
- [ ] Validate personal webhook isolation, rotation, replay rejection and queue/risk fail-closed behavior.
- [ ] Verify NOWPayments IPN signature, replay rejection, idempotency, plan mapping and license entitlement on provider endpoints.
- [ ] Test account suspension, EA license expiry/renewal and serial revocation.
- [ ] Verify no tokens, personal data, payment keys or secret URLs appear in build artifacts or logs.

## MT5 and commercial readiness
- [x] An `ea-latest` EX5 release asset exists on GitHub; a listed asset does not establish test certification.
- [ ] Independently verify build SHA-256 and official MetaEditor compiler output for current EA v0.29.1.
- [ ] Independently validate DEMO trading end-to-end with hedging/netting, reconnect, partial fills and timed closures.
- [ ] Validate broker risk controls, including account-wide daily drawdown and test-consent boundaries.
- [ ] LIVE automatic execution stays prohibited pending separate authorization and certification.
- [ ] Review privacy/terms, refunds, customer support and jurisdictional compliance before expanding commercial acquisition.

**Do not mark the product commercially production-ready until each blocker and required independent test is cleared.**
