# EA 0.28.0 — configurable tests and daily account risk

## Defaults and controls

- `InpEnableConnectionTest`, `InpEnableDemoExecution` and
  `InpEnableLiveConnectionTest`: true. Website/Mini App confirmation still required;
  LIVE tests additionally require typing LIVE. Normal LIVE signal execution remains blocked.
- `InpTestSymbol`: XAUUSD. Change to EURUSD, GBPUSD, XAUUSD.p or the exact broker symbol.
- `InpDefaultLots`: 0.01. Used for connection tests; explicit signal order sizes remain intact.
- `InpDailyDrawdownPercent`: 10.0, configurable in (0, 100].
- `InpGoldSymbol`, general prefix and suffix mapping remain supported.

The EA advertises the resolved test symbol and lots. Both portals show these actual
settings in the card and confirmation. The server builds the test from authenticated
live EA telemetry, never from browser-supplied symbol/lot overrides. Old EAs keep
their legacy fixed XAUUSD/0.01 contract.

## Risk definition and enforcement

Drawdown = max(0, (adjusted baseline equity − current account equity) /
adjusted baseline equity × 100). The baseline is the first observed equity of the
broker-server day; on first installation during a day it starts at installation,
not a reconstructed midnight equity. Subsequent broker days rebase at their first
observed tick/timer, unless HIT is already latched. Balance/credit cash flows after
the baseline are removed from trading P/L by adjusting the baseline.

At or above the threshold the EA persists HIT before liquidation. It cancels ALL
pending orders and closes ALL positions on the account, including manual trades
and other EAs, by exact ticket. Every second it retries remaining positions/orders.
All incoming SignalBridge actions, including tests, are rejected while HIT is active.
This runs locally before cloud networking and does not require a valid license or
an internet connection for the local closing attempt.

HIT does not clear at midnight, after recovery in equity, or on reattachment. State
is scoped by account login and broker server in MT5 terminal global variables.
The EA must remain running with Algo Trading and broker permissions: it cannot
close trades while MT5 is stopped/disconnected or guarantee the exact loss limit
through gaps, slippage, market closures or broker rejection. Other software/manual
users can still submit orders; while running and latched, the EA keeps flattening
them. This is not a broker-side account lock or a cross-terminal synchronization service.

## Explicit restart

The EA panel and website/Mini App show a red HIT control. Restart requires explicit
confirmation, the same account and HIT generation, and zero positions AND orders.
The new cycle uses current equity as its baseline. The portal sends a short-lived
account-bound control; only the EA can accept it. The portal stays red until a fresh
EA heartbeat reports READY. Local confirmation also works without the website.
Daily P/L and signal/exit counters do not reset on manual restart.

## Statistics

Both panels show drawdown/current limit, account daily net P/L, received OPEN
signals, TP exits and SL exits. Signal count excludes test/management commands and
counts repeated deliveries once per command ID per broker day. P/L includes today's
BUY/SELL deal profit, swap, commissions and fees plus current account floating profit.
TP/SL counts are daily broker exit deals, including confirmed SignalBridge TP/SL
management exits. A partial fill can be a separate exit deal; these are not win-rate
or strategy-performance claims.

## Validation

Tests exercise the actual MQL drawdown calculation bodies, boundary/cash-flow/latch
cases, persistence-before-liquidation and pre-dispatch blocking, account/tenant/reset
binding, arbitrary test symbol and lot dispatch, and unchanged LIVE-signal refusal.
Eight mocked browser scenarios cover both portals, DEMO/LIVE consent, configured
EURUSD.p display, HIT refusal and cancelled/confirmed restart. CI compiles with the
official MetaEditor. Maintenance tests never place broker orders. Actual broker
E2E validation remains necessary after installing the EX5.
