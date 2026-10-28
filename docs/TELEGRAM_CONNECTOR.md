# SignalBridge — Telegram Connector
Version 3 · 2026-10-28

## Available now: Telegram Bot Connector

The Bot connector is the supported production path.

Flow:

```text
Telegram Bot update
      ↓
SignalBridge Cloudflare ingress
      ↓
Deterministic parser + allowlist
      ↓
Durable command
      ↓
Direct WebSocket
      ↓
MT5 SignalBridge EA
```

Pairing is explicit. A chat/channel cannot silently claim an execution route.

Supported deterministic parser languages currently include English, Persian and Arabic for the documented signal format.

## Telegram Web App

The Telegram Web App is the mobile-first control surface for:

- MT5 EA status;
- recent signals;
- execution receipts;
- route state;
- pairing shortcuts;
- subscription state.

Prototype:

`design/telegram-webapp.html`

Bot UX reference:

`design/telegram-bot-flow.html`

## Telegram Account Connector — MTProto

**Status: Coming Soon / inactive.**

The product UI may show this option to communicate roadmap direction, but clicking it must only display a Coming Soon message.

The current release must not:

- request a personal Telegram phone number;
- request API ID / API Hash;
- create or upload a Telegram session;
- monitor a personal account;
- expose an MTProto backend endpoint.

## Safety

Telegram messages never go straight to a broker. They enter the same canonical validation, persistence, risk and MT5 execution pipeline as TradingView.
