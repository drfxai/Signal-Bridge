Signal Bridge - Telegram 10.4 Native Widgets

Phase 1: private member status

Send /widget in the existing Signal Bridge bot private chat. The bot loads the authenticated member's actual D1 account and license records and sends a native widget showing plan, license state and expiry. It never includes an activation key, personal email or MT5 login.

Refresh uses TelegramWidget.request('sb:refresh') and the existing webhook route. The server checks that the message is in a private chat, that Telegram sender ID matches chat ID, then queries the account by telegram_id. It answers with answerWidgetQuery and updates the message's chat_data via editMessageWidgetData. Refresh does not place trades, alter licenses or relay signals.

Deployment checklist:
1. Review this PR and run npm run check. Source HTML must be within 32768 bytes and 4096 bytes after zlib-9 compression.
2. Test on an isolated Worker with a test bot first. Do not replace the production bot webhook for a demo.
3. Verify the existing /api/telegram/webhook accepts widget_query. The setup script subscribes without dropping existing updates.
4. Test on current Telegram Android, desktop and iOS, light/dark and larger fonts.
5. Check legacy commands /start, /app, /code, /signalbridge and Telegram-to-MT5 signal flow for regressions.
6. Monitor D1 read volume. Do not add background polling.
7. Add validated real signal cards later using server-owned signal data. Never label mock prices as live.

Rollback: revert this PR and redeploy the previous Worker. No D1 migration is needed.

Platform limitation: production widgets currently work in bot private chats only, not channels, groups or forwards.
Reference: https://core.telegram.org/bots/widgets
