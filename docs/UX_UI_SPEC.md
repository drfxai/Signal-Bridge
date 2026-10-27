# DrFX SignalBridge — UI/UX Product Design
## Design direction
Premium, precise trading infrastructure: dark neutral surfaces, restrained cyan/blue highlights, monospace metrics, strong contrast and minimal decoration. High-density information without sacrificing legibility. English default; scalable RTL layout for Persian and Arabic, with Turkish/Russian/Hindi future localization if prioritized.

## IA / navigation
- Overview: routes, connection health, recent signal pipeline and summary KPIs.
- Connections: TradingView webhook, MT5 EA, Telegram bot/channel pairing.
- Signal Router: source → target → filter/policy mapping with explicit enable state.
- Risk Manager: fixed lots/% risk, guardrails, market hours, spread, daily drawdown and pause.
- Accounts: MT5 broker/account mode, balance/equity snapshots, agent heartbeat and symbol mappings.
- Activity: immutable signal timeline, correlation ID, parse/risk/rejection reason, broker retcodes.
- Telegram: channels, permission diagnostics, parser preview, notifications.
- Analytics: command throughput, error budget, broker rejection and latency distributions.
- Settings/Billing: roles, tokens, alert preferences, plans, regional disclosures.

## Core layout
Desktop >= 1200px: persistent left navigation 248px, 12-column content, top bar with workspace, DEMO/LIVE pill, terminal heartbeat and emergency pause. Between 768–1199px use collapsed rail and responsive two-column cards. Under 768px use slide-out nav, horizontally scrollable event table or stacked activity cards, full-width main CTAs.

## Design tokens (starting point)
- Canvas #070D17; panel #101A29; elevated #152338.
- Border #26374B; primary text #E8F2FC; muted #94A9BD.
- Primary #42C6EE; success #43D7A7; warning #F1BC63; danger #FC7681.
- Font: system/UI sans for content, tabular numerals for metrics.
- Radius 14px cards, 10px controls; focus outline 2px solid primary.
- Spacing scale 4/8/12/16/24/32. Respect reduced-motion settings.

## Key screens
**Overview**: hero 'Connect. Validate. Execute.' and a 4-step signal journey: Received → Validated → Routed → Broker Confirmed. Never call Accepted = Executed.
**New route wizard**: Step 1 Source → Step 2 Target account → Step 3 Risk → Step 4 Demo dry run → Step 5 Explicit enable.
**Connection status**: clear Connected, Degraded, Disconnected; last heartbeat timestamp, never a fake always-green status.
**Signal details**: original source metadata (with redaction), normalized intent, validation checklist, risk decision, command attempts, broker ticket and transaction evidence.
**Telegram parser preview**: example message, extracted fields, conflict warnings, mock trade calculation and consent.
**Safety controls**: always-visible Pause New Trades; dangerous actions require confirmation.

## UX behavior
- First render: no false connected statuses; default empty states explain what to connect.
- Demo mode prominent and live environment opt-in explicit.
- Form errors beside fields; recoverable action feedback with correlation ID.
- Accessible keyboard flow, contrast >= WCAG AA, aria-live status, reduced animation.
- i18n: externalized strings and logical CSS properties for RTL.
- Tables maintain timezone UTC with user-local presentation.
- No fake financial performance statistics in real product.

## Prototype
`design/index.html` shows interaction and styling with illustrative sample data only. All user actions remain local to browser (no trading request / no secret storage). It must be labeled demonstrative and not be mistaken for a running MT5 connector.
