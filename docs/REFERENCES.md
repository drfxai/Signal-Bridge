# Primary References and Assumptions
Research starting point: 2026-10-27. Revalidate before shipping or publishing comparative marketing.

## Reference products
- [PineConnector](https://www.pineconnector.com/)
- [PineConnector Documentation](https://docs.pineconnector.com/)
- [Telegram @tfwebhook_bot](https://t.me/tfwebhook_bot) — public entry point. Do not infer undocumented MT5 capabilities from bot name alone.

## Official platform documentation
- [TradingView webhook configuration](https://www.tradingview.com/support/solutions/43000529348-how-to-configure-webhook-alerts/)
- [TradingView alerts help](https://www.tradingview.com/support/solutions/43000597494-alerts-on-alert-function/)
- [MQL5 WebRequest docs](https://www.mql5.com/en/docs/network/webrequest)
- [MQL5 CTrade](https://www.mql5.com/en/docs/standardlibrary/tradeclasses/ctrade)
- [MQL5 OnTradeTransaction](https://www.mql5.com/en/docs/event_handlers/ontradetransaction)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram Mini Apps validation](https://core.telegram.org/bots/webapps)
- [Cloudflare Queues](https://developers.cloudflare.com/queues/)
- [Cloudflare Durable Objects](https://developers.cloudflare.com/durable-objects/)

## Open questions
1. Do we support Windows only for MT5, or officially support user-managed Wine deployments with warning?
2. Is a managed Windows MT5 hosted offering commercially necessary for launch?
3. Does the Telegram channel-access scope require a separately consented client-account connector later?
4. How should users specify partial-exit TP allocation and netting-account behavior?
5. Which jurisdictions, payment providers, and broker partners will be served?
6. What is the verified latency distribution at the edge/agent/broker boundaries?

## Evidence policy
- Treat competitor feature/price comparisons as time-bound, not product requirements or guarantees.
- No claim of guaranteed fill, real-time profit, fixed delay, or unrestricted Telegram access.
- References document external constraints; the repository's actual implementation status is the source of truth.
