# DrFX SignalBridge — Public Release Checklist

This repository is PUBLIC but source-available with **all rights reserved**;
there is no open-source redistribution license. Review LICENSE before reuse.

## Public marketing
- [x] Landing page contains three original downloadable SVG promotional visuals
  served from /assets/promo/; illustration labels avoid fabricated metrics.
- [x] Website / Telegram Mini App expose English, Persian, Arabic, Turkish,
  Russian and Hindi selectors with language-appropriate RTL handling.
- [x] Existing Telegram bot supports six languages.
- [x] Page metadata and README explain DEMO-only product state.
- [ ] Real Android/iOS Telegram WebView visual and interaction sign-off
- [ ] Translation proofreading by native reviewers for each locale.

## Security / release integrity
- [x] LICENSE, SECURITY.md and CONTRIBUTING.md documented.
- [x] CI validates UI routes, localization dictionary keys and static promotional SVG.
- [ ] Perform complete Git **history** secret scan; checking current tree is insufficient.
- [ ] Verify separate authenticated sessions for website, Telegram and admin.
- [ ] Test per-user TradingView webhook isolation, rotation, replay rejection and
      DRY RUN mode against production D1.
- [ ] Independently verify current MT5 compiled EX5 build and its release checksums.
- [ ] Enforce protected branch reviews and prevent unsafe deploy on test failure.

## Commercial activation gates
- [ ] Resend domain verified; encrypted RESEND_API_KEY configured; real OTP tested.
- [ ] NOWPayments IPN signature and webhook replay/idempotency verified; secrets
      installed; merchant sandbox checkout and refund flows checked.
- [ ] Account suspension and license revocation tested with a DEMO EA.
- [ ] DEMO 0.01-lot timed closure implemented in EA, tested for netting/hedging
      accounts and edge cases (disconnect, order rejection, partial fill).
- [ ] REAL-money trading disabled until separately authorized and certified.

**Do not declare commercial production-ready simply because web UI deploys or
all unit tests pass.**
