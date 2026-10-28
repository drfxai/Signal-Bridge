import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ea=fs.readFileSync(new URL('../mt5/DrFX_SignalBridge_EA_v0.24.mq5',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../worker/src/index.mjs',import.meta.url),'utf8');
const hub=fs.readFileSync(new URL('../worker/src/agent-hub.mjs',import.meta.url),'utf8');
const ui=fs.readFileSync(new URL('../worker/src/test-ui.mjs',import.meta.url),'utf8');

test('MT5 direct EA keeps the hard DEMO execution guard',()=>{
 assert.match(ea,/ACCOUNT_TRADE_MODE_DEMO/);
 assert.match(ea,/DEMO execution refused on non-demo account/);
 assert.match(ea,/InpEnableDemoExecution\s*=\s*false/);
});

test('standard transport is direct TLS WebSocket from the EA',()=>{
 assert.match(ea,/InpCloudHost="signalbridge\.drfx\.online"/);
 assert.match(ea,/InpCloudPath="\/v1\/ea\/ws"/);
 assert.match(ea,/SocketConnect\(/);
 assert.match(ea,/SocketTlsSend\(/);
 assert.match(ea,/Sec-WebSocket-Protocol: signalbridge-ea-v1/);
 assert.doesNotMatch(ea,/InpAgentHost/);
 assert.doesNotMatch(ea,/WebRequest\s*\(/);
 assert.match(index,/url\.pathname==='\/v1\/ea\/ws'/);
 assert.match(hub,/role==='ea'/);
});

test('direct EA command frame remains replay-safe and broker-aware',()=>{
 assert.match(ea,/ArraySize\(parts\)<16/);
 assert.match(ea,/volumeMode=parts\[8\]/);
 assert.match(ea,/referencePrice=StringToDouble\(parts\[10\]\)/);
 assert.match(ea,/PendingSave\(\)/);
 assert.match(ea,/automatic replay blocked/);
 assert.match(ea,/ACCOUNT_MARGIN_MODE_RETAIL_NETTING/);
 assert.match(ea,/DEAL_POSITION_ID/);
 assert.match(ea,/RACK/);
});

test('demo EA supports actual CTrade open after safety gates',()=>{
 assert.match(ea,/trade\.Buy\(/);
 assert.match(ea,/trade\.Sell\(/);
 assert.match(ea,/OnTradeTransaction/);
 assert.match(ea,/BROKER_REJECTED/);
});

test('test UI exposes preview and demo execution modes',()=>{
 assert.match(ui,/Send Test Signal/);
 assert.match(ui,/dry_run/);
 assert.match(ui,/demo_execute/);
 assert.match(ui,/\/v1\/test\/signal/);
});
