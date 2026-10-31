# SignalBridge — MetaTrader 5 Direct Execution
Current documented EA: v0.29.1 · 2026-10-31

## Standard installation
Install the compiled EX5 from the [current GitHub EA release](https://github.com/drfxai/Signal-Bridge/releases/tag/ea-latest). Copy it into `MQL5/Experts`, attach it to a chart, add `https://signalbridge.drfx.online` to MT5's allowed WebRequest URLs, then enter the private SignalBridge activation code.

One EA connects outbound to `signalbridge.drfx.online:443` at `/v1/ea/ws` over TLS/WebSocket. It does not require an extra desktop relay. The protocol subprotocol is `signalbridge-ea-v1`.

## Safeguards
- Automatic signals are restricted to DEMO accounts; the EA may support separately consented, account-bound LIVE connection tests only.
- `InpEnableDemoExecution=true` is the current default; user confirmation and broker restrictions still apply.
- Set `InpGoldSymbol` to the broker's exact instrument name (`XAUUSD`, `XAUUSD.p`, `GOLD`, etc.).
- Default test symbol `XAUUSD` and default lot size `0.01` are editable, with broker lot-step and contract validation.
- The 10% daily equity drawdown guard closes all account positions and cancels pending orders, including non-bridge orders; it remains latched until explicitly reset.
- TP1 defaults to break-even, TP2 to close and TP3 to disabled. Partial closes require hedging-aware logic.
- Broker-side SL, max-lot/spread/slippage gates, source deduplication and account-specific action correlation must remain enabled.

## Delivery and reconciliation
The cloud persists pending commands. The EA reports terminal outcomes with correlation information; ambiguous disconnects require broker-history reconciliation before resubmission. Cloud acknowledgments are not guaranteed fills, and restart/replay testing must be performed independently.

## Release acceptance
- Verify compiled EX5 version and SHA-256 against the release manifest.
- Test deterministic open/close, five-second timed position exit, disconnect/reconnect, symbol mapping and hedging/netting.
- Verify expiry/revocation and cross-account isolation.
- Test consent for DEMO and LIVE connection checks without enabling ordinary LIVE signal execution.
- Refer to [public release gates](PUBLIC_RELEASE_CHECKLIST.md) before commercial claims.

**Public-source exposure:** development EA source is still present in repository history. Compiled-only distribution requires a separate private build process and source-visibility remediation.
