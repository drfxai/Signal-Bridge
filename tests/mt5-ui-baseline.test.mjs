import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../design/mt5-command-center.html',import.meta.url),'utf8');
const mq5=fs.readFileSync(new URL('../mt5/DrFX_SignalBridge_EA.mq5',import.meta.url),'utf8');

test('approved MT5 reference contains required surfaces',()=>{
  for(const phrase of ['MT5 Command Center','MT5 Chart Panel','Telegram','Risk engine'])
    assert.match(html,new RegExp(phrase,'i'));
});

test('EA UI milestone cannot submit orders',()=>{
  assert.match(mq5,/InpEnableTrading\s*=\s*false/);
  assert.match(mq5,/ORDER EXECUTION DISABLED/);
  assert.doesNotMatch(mq5,/trade\.(Buy|Sell|PositionClose|OrderOpen)\s*\(/);
});

test('EA panel reads actual terminal telemetry',()=>{
  assert.match(mq5,/AccountInfoDouble\(ACCOUNT_EQUITY\)/);
  assert.match(mq5,/AccountInfoDouble\(ACCOUNT_BALANCE\)/);
  assert.match(mq5,/AccountInfoDouble\(ACCOUNT_PROFIT\)/);
  assert.match(mq5,/OnTradeTransaction/);
  assert.match(mq5,/MarginMode\(\)/);
});
