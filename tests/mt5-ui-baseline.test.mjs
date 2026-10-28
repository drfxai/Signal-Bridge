import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../design/mt5-command-center.html',import.meta.url),'utf8');
const mq5=fs.readFileSync(new URL('../mt5/DrFX_SignalBridge_EA_v0.23.mq5',import.meta.url),'utf8');

test('approved MT5 reference contains required surfaces',()=>{
 for(const phrase of ['Live Dashboard','MT5 Settings','Telegram','MT5 Chart Panel','Risk Engine','Execution Log'])
  assert.match(html,new RegExp(phrase,'i'));
});
test('current EA remains DEMO-only by default',()=>{
 assert.match(mq5,/InpEnableDemoExecution\s*=\s*false/);
 assert.match(mq5,/ACCOUNT_TRADE_MODE_DEMO/);
 assert.match(mq5,/DEMO execution refused on non-demo account/);
});
test('EA panel reads actual terminal telemetry and broker evidence',()=>{
 assert.match(mq5,/AccountInfoDouble\(ACCOUNT_EQUITY\)/);
 assert.match(mq5,/AccountInfoDouble\(ACCOUNT_BALANCE\)/);
 assert.match(mq5,/AccountInfoDouble\(ACCOUNT_PROFIT\)/);
 assert.match(mq5,/OnTradeTransaction/);
 assert.match(mq5,/MarginMode\(\)/);
 assert.match(mq5,/HistoryHasTag/);
});
test('EA persists unresolved broker submissions before sending an order',()=>{
 assert.match(mq5,/FileOpen\(PendingFile\(\)/);
 assert.match(mq5,/RegisterPending\(tag,id\)/);
 assert.match(mq5,/ReconcilePending\(\)/);
 assert.match(mq5,/automatic replay blocked/);
});
