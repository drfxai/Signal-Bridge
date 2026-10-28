# Security Policy

## Report a vulnerability privately

**Do not open a public GitHub issue containing security details, API keys,
BotFather tokens, EA activation serials, TradingView webhook credentials,
customer records, or account identifiers.**

Report responsibly using GitHub's private vulnerability reporting feature when
available, or contact the project's maintainer through the official website:
https://drfx.company.

Provide a minimal reproduction with secrets redacted. Do not attempt to access
accounts, MT5 terminals, or Cloudflare resources that do not belong to you.

## Supported and unsupported use

The currently published commercial build supports **DEMO account testing only**.
Automated execution on real-money accounts is not supported until an explicitly
reviewed, independently tested release is published.

The Connection Check reads historical license/handshake records. It does not
guarantee live connectivity. The 0.01-lot timed trade feature is not enabled
without a supported, compiled EA implementing safe position tracking and closure.

## Security controls

- Runtime credentials belong in encrypted Cloudflare Worker secrets, never Git.
- Telegram Mini App identity requires server-side verification of signed initData.
- EA activation and TradingView webhook secrets are account-scoped.
- Administrator actions require server-side authorization and audit records.
- All credential rotation or bot webhook changes must preserve production
  integrations and receive appropriate review.
