# SignalBridge Roadmap
Updated 2026-10-28

## Now — V3 beta

- Direct MT5 EA ↔ Cloudflare WebSocket.
- TradingView private webhook.
- Telegram Bot Connector.
- Telegram Web App UI.
- Premium responsive desktop/tablet/mobile design.
- One month free, 3 months $47, 1 year $165.
- DEMO-only execution boundary.

## Validation gates

- Compile EA v0.24 in real Windows MetaEditor.
- Direct WebSocket Production handshake test.
- TradingView → DEMO broker E2E.
- Telegram → DEMO broker E2E.
- reconnect/replay/receipt-loss tests.
- multi-broker symbol mapping.
- latency measurements from real MT5 terminals.

## Next

- Signed/precompiled `.ex5` distribution.
- Guided one-click MT5 install package if needed.
- richer Telegram Web App controls.
- account/route analytics.
- multi-account UX.

## Coming Soon

### Telegram Account Connector (MTProto)

Visible in UI but inactive. No phone/session/API ID/Hash workflow is enabled until the connector receives a separate security and product review.

## Legacy

The old Windows companion transport remains only as rollback/reference during V3 migration. It is not part of standard installation.
