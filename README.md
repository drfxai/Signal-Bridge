# DrFX SignalBridge

**TradingView ↔ MetaTrader 5 ↔ Telegram**  
Product blueprint and interactive interface prototype by **DrFXAi**.

> **Status: Product design / architecture / non-trading UI prototype.** No executable trade connector, brokerage integration, or production deployment is included yet.

## Vision
An auditable, security-first signal automation platform that receives authorized TradingView alerts and Telegram signals and routes validated commands to independently deployed MT5 Execution Agents. It can also publish TradingView alerts and MT5 status notifications to Telegram.

### Four product routes

| Route | Purpose | MVP status |
| --- | --- | --- |
| TradingView → MT5 | Alert-to-trade with broker-side reconciliation | Planned |
| TradingView → Telegram | Publish alert notifications to authorized chats | Planned |
| Telegram → MT5 | Parse permitted channels, validate, then execute | Planned |
| MT5 → Telegram | Position/event notifications and approved controls | Planned |

## Repository contents

- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [System architecture](docs/ARCHITECTURE.md)
- [Signal API contract](docs/API_CONTRACT.md)
- [MetaTrader 5 agent specification](docs/MT5_EXECUTION.md)
- [Telegram connector specification](docs/TELEGRAM_CONNECTOR.md)
- [Security and risk controls](docs/SECURITY_RISK.md)
- [UI/UX design system](docs/UX_UI_SPEC.md)
- [Delivery roadmap](docs/ROADMAP.md)
- [Pricing and operations](docs/BUSINESS_MODEL.md)
- [References and assumptions](docs/REFERENCES.md)
- [Interactive UI concept](design/index.html)

## View the UI prototype
Open `design/index.html` in a browser. It is a dependency-free responsive HTML/CSS/JS **mock UI**, using sample data only. No real credentials or order execution.

## Proposed architecture
`TradingView / Telegram → Edge ingress → normalization → policy & risk validation → durable command state → MT5 Execution Agent → broker reconciliation → notifications / analytics`

A local or VPS-hosted MT5 terminal remains necessary for MQL5 Expert Advisor-based trade execution. Serverless services do not by themselves run a MetaTrader terminal.

## Delivery principles
1. Begin with TradingView-to-MT5 on **demo accounts**.
2. Deterministic parsers first; AI extraction remains non-authoritative.
3. Reject ambiguous commands; fail closed when account state cannot be verified.
4. Deduplicate signals and reconcile on restart before any retry.
5. Use explicit user authorization, least-privilege credentials and audit trails.
6. Never advertise guaranteed profitability, execution latency, or zero slippage.

## خلاصه فارسی
DrFX SignalBridge یک محصول مستقل برای اتصال TradingView، MT5 و Telegram با چهار مسیر ارتباطی است. نسخه فعلی این ریپازیتوری **فقط طرح محصول، معماری و نمونه رابط کاربری** را در بر می‌گیرد. اجرای واقعی معامله پس از توسعه EA اختصاصی، آزمون امنیتی، تست حساب دمو و تأیید صحت عملکرد انجام خواهد شد.

## Attribution
PineConnector and Telegram bot references are for comparative product research only. DrFX SignalBridge is an independent proposed implementation and has no claimed affiliation with those providers.
