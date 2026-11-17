import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Structural regression: actual MetaEditor compilation and a DEMO broker smoke
// test remain required before claiming end-to-end execution.
const ea=readFileSync(new URL('../mt5/DrFX_SignalBridge_EA.mq5',import.meta.url),'utf8');
const open=ea.slice(ea.indexOf('void HandleOpen('),ea.indexOf('void HandleManage('));

test('exact gold commands use broker symbol resolver, not strict currency metadata alone',()=>{
 assert.match(ea,/bool BrokerGoldSymbolValid\(string requested\)/);
 assert.match(ea,/SymbolSelect\(requested,true\)/);
 assert.match(ea,/SYMBOL_CURRENCY_BASE/);
 assert.match(ea,/SYMBOL_CURRENCY_PROFIT/);
 assert.match(ea,/StringFind\(name,"XAUUSD"\)==0/);
 assert.match(ea,/StringFind\(name,"GOLD"\)==0/);
 assert.match(open,/if\(exactGoldSymbol\)\{\s*if\(BrokerGoldSymbolValid\(requested\)\)sym=requested/);
 assert.doesNotMatch(open,/SYMBOL_CURRENCY_BASE|SYMBOL_CURRENCY_PROFIT/);
});

test('symbol override never bypasses existing execution and anti-replay guards',()=>{
 assert.match(open,/if\(FindPosition\(tag/);
 assert.match(open,/HistoryHasTag\(tag/);
 assert.match(open,/ResolvePending\(tag\)/);
 assert.match(open,/StopsValid\(sym,buy,sl,finalTp\)/);
 assert.match(open,/LotsForRisk\(sym,buy,sl,volumeValue\)/);
 assert.match(open,/DemoGate\(id\)/);
 assert.match(open,/InpMaxOpenTrades/);
 assert.match(open,/trade\.Buy\(lots/);
 assert.match(open,/trade\.Sell\(lots/);
});
