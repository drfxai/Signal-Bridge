# SignalBridge v2 — Premium Interface Implementation

**Scope:** frontend demonstration only, not a connected trading application.

## Deliverables
- `design/index.html`: semantic accessible application shell, inline SVG icon system, privacy-safe preview warning.
- `design/styles.css`: responsive visual system, dark/light modes, RTL-friendly layout, reduced-motion support.
- `design/app.js`: navigation and functioning local demo experiences, route wizard, event inspection, simulated activity, parser preview, risk policy UI.
- `design/engine.mjs`: pure deterministic parsing and risk **demonstration** utilities; output always disallows trading.
- `tests/engine.test.mjs`: Node built-in unit tests of parsing, risk gate and HTML escaping.

## Experience upgrade
Navigation: Overview, Connections, Signal Routes, Event Monitor, Risk Manager, Telegram Hub, Settings. Desktop persistent sidebar and compact mobile drawer.

- English and Persian UI switching (RTL for Persian), with theme toggle.
- Premium product-style charts and visual routing diagram; sample figures explicitly labelled.
- Guided three-step demo route creation with draft settings persisted in local browser storage.
- Demo event stream filtering and trace inspection, with no fabricated broker confirmations.
- Local risk guardrail simulator and pause demonstration.
- Telegram sample signal parser; ambiguous/incomplete cases need review and no orders can be sent.
- Connection setup explanations and structured TradingView JSON copy example.
- Focus indicators, keyboard search (`/` or Ctrl/Cmd+K), reduced motion, semantic form labels, mobile responsive layout.

## Launch / local preview
Requires any static HTTP server. In the repository root:

```bash
npm run dev
# open http://localhost:4173
```

`index.html` loads ES modules. Opening it as a raw `file://` can fail due to browser module security restrictions. No third-party JavaScript packages are needed.

## Quality checks

```bash
npm run check
```

The suite validates sample parsing, contradictory signals, safety checks and HTML escaping. Browser-level navigation can be smoke-tested with Chromium/Playwright.

## Productionization (NOT yet complete)
1. Implement real authenticated backend and database, with tenant and account isolation.
2. Implement and sign a Windows/MT5 EA, broker reconciliation and queue/idempotency controls.
3. Move demo routes/risk policy from localStorage to server-side tenant-scoped persistence and audit events.
4. Implement permitted Telegram bot ingestion and TradingView endpoint.
5. Integrate backend health checks rather than synthetic status cards.
6. E2E tests and WCAG accessibility audit; security and privacy assessments.
7. Only then consider enabling live trading behind opt-in and compliance gates.

**Data policy:** Browser localStorage contains only example drafts and interface preferences, never credentials or personal messages. This design makes no outgoing API calls.