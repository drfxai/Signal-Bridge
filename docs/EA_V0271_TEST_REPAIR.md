# EA 0.27.1: connection-test repair

A production test command reached MT5 and was rejected with the combined message
`test symbol busy or unavailable`. This confirms delivery for that attempt, but
cannot distinguish a missing broker symbol, an existing position, the position
limit or unavailable quotes. No broker order was submitted during maintenance.

The test now preserves configured prefix/suffix and exact XAUUSD first. If those
are absent it searches broker metadata for a single tradable XAU/USD contract.
Multiple candidates are rejected rather than guessed. `InpTestSymbol` explicitly
selects the broker's exact gold symbol (for example its suffixed XAUUSD or GOLD).
This input is for the test only; normal signal mapping remains unchanged.

Each preflight rejection now names its cause and affected symbol. Existing
positions are never closed to make room for the test. Spread, 0.01 lot size,
emergency stop, account binding and explicit LIVE consent remain enforced.

The shared site/Mini App workspace now awaits an in-flight connection check
instead of reporting a false offline result. It checks advertised test capability
before opening confirmation and identifies the required DEMO/LIVE inputs.

Validation: automated concurrency regression (one network check, correct account
confirmation, cancel produces no POST), full repository suite, MetaEditor CI.
Install the new EX5 and reattach it to apply the new input. If more than one gold
contract is available, set InpTestSymbol to the exact desired broker symbol.
