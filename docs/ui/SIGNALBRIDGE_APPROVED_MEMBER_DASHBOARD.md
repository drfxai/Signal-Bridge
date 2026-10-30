# SignalBridge approved member dashboard
Visual reference: user-provided Daily overview + Setup images for desktop 1200x800, tablet 720x960, phone 390x844.

## Layout
- Full-width responsive workspace; midnight-blue cards, thin cyan outlines, premium gold active Daily/Setup tab, green EA status only with verified telemetry.
- Daily: true EA status, 2x2 KPI tiles on mobile (net P/L, equity, received signals, floating P/L), performance curve only with broker records, exactly two test actions, risk, latest signal, position, route preferences.
- Setup: three visible, independent route switches (TradingView→MT5, TradingView→Telegram, Telegram→MT5), each user preference ON by default; compact MT5 license/EX5 card, personal TradingView webhook, Telegram channel setup; use 3 columns desktop, stacked or 2 columns tablet, guided steps mobile.
- Admin: role-gated account controls in website and Telegram web app, authenticated server actions.
- Never fill missing live metrics with demo values. Live connection and execution status require verification; no false badges.

## Execution safety
- A route preference ON is not permission for a broker order. TradingView→MT5 routing defaults ON in Dry Run.
- A separate user-confirmed control enables DEMO broker execution. Ordinary LIVE execution is not implied by routing.
- When the TradingView→MT5 preference is OFF, the ingress must not dispatch MT5 commands, while independently enabled TradingView→Telegram signals may still be relayed.
- Tests must preserve these distinctions.

## Release order
1. Apply migration site/migrations/0016_tv_mt5_route_preference.sql to shared production D1.
2. Deploy both company-site and signalbridge-ingress Workers using matching Git SHA while retaining secret/D1/Durable Object bindings.
3. Verify real user settings and test DRY RUN ON, route OFF, Telegram relay, optional explicit DEMO mode, and responsive viewport snapshots before declaring production complete.
