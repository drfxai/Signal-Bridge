# Agent protocol compatibility tools

This Node.js client and its durable receipt outbox are retained for compatibility
with the existing authenticated `/v1/agent/ws` backend and its regression tests.
They are developer tools, not an installer or a companion requirement for the
current product.

**EA v0.26.0 connects directly to Cloudflare. It does not connect to this legacy
TCP client.** Use [the current MT5 setup](../mt5/README.md) for installations.

The configuration example is only for exercising agent-protocol compatibility.
No earlier EA source is bundled; historical transports can be inspected in Git
history. Never store real credentials or receipt journals in the repository.
