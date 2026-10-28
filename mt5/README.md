# SignalBridge MT5

## Install this version

Use **one** of these equivalent sources:

- `DrFX_SignalBridge_EA.mq5` — canonical current source.
- `DrFX_SignalBridge_EA_v0.23.mq5` — version-pinned current beta source.

Files `v0.20`, `v0.21` and `v0.22` are retained only as source history. Do not install multiple SignalBridge EA versions on the same account for testing.

## Current safety boundary

- MetaTrader **DEMO account only**.
- `InpEnableDemoExecution=false` by default.
- Live accounts are hard-refused.
- Windows SignalBridge Agent must be running locally on `127.0.0.1:17777`.
- Compile in MetaEditor and require zero compile errors before attaching to a chart.

## v0.23 highlights

- persistent command→trade reconciliation across terminal restart;
- broker `DEAL_POSITION_ID` / `POSITION_IDENTIFIER` tracking independent of comments;
- hedging TP1/TP2 partial close;
- netting TP1/TP2 reduction via opposite deal to an absolute target volume;
- fail-closed block if a netting symbol already has any open position;
- broker-history duplicate detection;
- local risk, spread, symbol, lot, SL/TP and DEMO checks;
- live native chart panel.

Real broker DEMO validation is still required before this source is treated as release-certified.
