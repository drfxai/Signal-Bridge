# Contributing

DrFX SignalBridge is publicly readable but **not licensed as open-source**.
Community feedback, issue reports, and proposed fixes are welcome. Contributions
are subject to project-maintainer review and do not grant rights in the product.

1. Open a focused issue before large changes.
2. Create a feature branch; submit a pull request.
3. Run `npm test` and `npm run check` (and the site CSS checks).
4. Include mobile and Telegram Mini App screenshots for UI changes.
5. Never commit keys, credentials, EA serials, personal account identifiers,
   order histories, or private webhook URLs.
6. Keep trading enabled only in approved DEMO environments.
7. Preserve Cloudflare free-first resources, production secret bindings,
   and the independent live MT5 ingress Worker.
8. Treat all promotional visuals as illustrative until independently verified.

An independent security and licensing review is required before enabling
real-money trading, charging users, or publishing EX5 binaries.

Owner-approved scope in EA 0.27.0: separately opted-in and explicitly confirmed LIVE connection tests, as specified in docs/EA_V027_LUXURY_TESTS.md. Ordinary signal execution remains DEMO-only. CI and maintenance work must never submit real broker orders.
