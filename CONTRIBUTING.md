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

Current safety boundary: automatic signals execute on DEMO only. Separately consented, account-bound LIVE connection tests are distinct from ordinary signals. Connection-test behavior and the 10% default account-wide drawdown guard must be preserved with explicit confirmation, auditability and broker-side safeguards. CI must never place real broker orders.

For a public change, avoid adding internal tooling instructions, session transcripts, private prompts, account metadata or secrets. Preserve executable runtime contracts; internal transport identifiers are not public product branding.
