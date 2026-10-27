# SignalBridge hardening pass — 2026-10-27

## Scope (frontend preview only)
This change is a safety and localization improvement to the browser-only SignalBridge design preview; it does NOT add authenticated webhook ingress, Telegram channel access, broker integration, a trading EA, or any capability to submit a real order.

### Parser improvements
- Parse multiple stop-loss fields and require manual review if repeated, even if the prices happen to be equal.
- Reject duplicate take-profit identifiers such as two distinct `TP1` prices.
- Reject mixtures of numbered and unnumbered take-profit entries.
- Detect multiple distinct instruments and repeated entry fields.
- Normalize Arabic/Persian numerals used inside otherwise English-format signals.
- Never infer missing price/entry fields or consider extracted text executable.
- Parser output version: `deterministic-demo-v3`; numeric extraction is advisory only.

### Risk validation
- Reject negative spread, negative daily loss, negative age, fractional position counts, invalid/nonfinite lot sizes and invalid policies.
- Keep `executionAllowed: false` unconditionally.
- Restore safe defaults for malformed values found in locally stored preview preferences.
- Translate core risk feedback and status labels for Persian locale.

### Regression tests
- 9 original safety/parser tests plus 18 new cases = **27 Node unit tests**.
- `npm run check` runs syntax checks and test suite in GitHub Actions.
- Chromium smoke review was carried out locally on 1440px and 390px viewports, including navigation, route wizard, Telegram parser, risk simulator, and Persian RTL.

### Known limitations
- Parser supports a constrained English-format command grammar, not unrestricted natural-language interpretation or full Persian-language trading instructions.
- A parser output with `PENDING_BROKER_VALIDATION` is never an approval to trade.
- A real MT5 connector requires authorization, idempotent durable ingress, broker contract-spec validation, account-scoped risk gates and reconciliation after every uncertain execution.
- Visual text localization beyond the core safety feedback remains iterative, and end-to-end automated accessibility tests are still pending.
- No production service or Github Release was created by this hardening pass.

## Further engineering sequence
1. Explicit JSON schemas, event IDs, risk policy validation and audited storage.
2. Authenticated TradingView webhook ingestion with demo-only route targets.
3. Signed MT5 EA for demo accounts, broker transaction tracking and restart reconciliation.
4. Authorized Telegram Bot webhook and permissioned channel sources.
5. Expanded browser E2E, CI security gates and controlled beta.
