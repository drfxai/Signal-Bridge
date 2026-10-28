# SignalBridge — Cloudflare Deployment
V3 · 2026-10-28

## Production

- Worker: `drfx-signalbridge-ingress`
- Domain: `signalbridge.drfx.online`
- D1: `signalbridge-ingress`
- Durable Object class: `AgentHub` (legacy internal class name)
- Standard execution endpoint: `/v1/ea/ws`

## Bindings

```toml
[[d1_databases]]
binding = "DB"

[[durable_objects.bindings]]
name = "AGENT_HUB"
class_name = "AgentHub"
```

The binding/class names are retained to avoid a risky migration. Product terminology is **Execution Hub / Direct EA**, not Windows Agent.

## Standard routing

```text
TradingView / Telegram
        ↓
Worker validation + D1
        ↓
Durable Object execution hub
        ⇅
Direct MT5 EA WebSocket
```

## Authentication

TradingView uses a scoped private webhook token.

The MT5 EA uses a separate 43-character SignalBridge Key. The key is accepted at the Worker boundary via WebSocket protocol metadata and is not forwarded to the Durable Object.

Telegram Bot webhooks retain their independent Telegram webhook secret.

## Deploy rule

Do not modify unrelated Cloudflare resources. Production deployment must preserve the current D1 binding, Durable Object class and custom domain mapping.
