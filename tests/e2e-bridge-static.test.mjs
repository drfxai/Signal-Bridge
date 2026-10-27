import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ea=fs.readFileSync(new URL('../mt5/DrFX_SignalBridge_EA_v0.20.mq5',import.meta.url),'utf8');
const agent=fs.readFileSync(new URL('../agent-windows/agent.mjs',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../worker/src/test-ui.mjs',import.meta.url),'utf8');

test('MT5 demo EA has a hard live-account execution guard',()=>{
  assert.match(ea,/ACCOUNT_TRADE_MODE_DEMO/);
  assert.match(ea,/DEMO execution refused on non-demo account/);
  assert.match(ea,/InpEnableDemoExecution\s*=\s*false/);
});

test('MT5 bridge is localhost TCP, not cloud polling',()=>{
  assert.match(ea,/InpAgentHost\s*=\s*"127\.0\.0\.1"/);
  assert.match(agent,/127\.0\.0\.1/);
  assert.match(agent,/setNoDelay\(true\)/);
  assert.doesNotMatch(ea,/WebRequest\s*\(/);
});

test('demo EA supports actual CTrade open after safety gates',()=>{
  assert.match(ea,/trade\.Buy\(/);
  assert.match(ea,/trade\.Sell\(/);
  assert.match(ea,/OnTradeTransaction/);
  assert.match(ea,/BROKER_REJECTED/);
});

test('live test UI exposes preview and demo execution modes',()=>{
  assert.match(ui,/Send Test Signal/);
  assert.match(ui,/dry_run/);
  assert.match(ui,/demo_execute/);
  assert.match(ui,/\/v1\/test\/signal/);
});
