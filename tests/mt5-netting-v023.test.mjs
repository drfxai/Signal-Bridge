import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ea=fs.readFileSync(new URL('../mt5/DrFX_SignalBridge_EA_v0.23.mq5',import.meta.url),'utf8');

test('v0.23 supports deterministic partial reduction for hedging and netting',()=>{
 assert.match(ea,/ACCOUNT_MARGIN_MODE_RETAIL_HEDGING/);
 assert.match(ea,/ACCOUNT_MARGIN_MODE_RETAIL_NETTING/);
 assert.match(ea,/PositionClosePartial\(ticket,toClose\)/);
 assert.match(ea,/ptype==POSITION_TYPE_BUY\)\?trade\.Sell\(toClose/);
 assert.match(ea,/:trade\.Buy\(toClose/);
});

test('netting opens fail closed when any position already exists on symbol',()=>{
 assert.match(ea,/HasAnyPositionOnSymbol\(sym\)/);
 assert.match(ea,/merge risk blocked/);
});

test('v0.23 persists broker position identifiers independent of comments',()=>{
 assert.match(ea,/POSITION_IDENTIFIER/);
 assert.match(ea,/DEAL_POSITION_ID/);
 assert.match(ea,/GVPosId/);
 assert.match(ea,/RememberPositionFromDeal/);
 assert.match(ea,/request\.comment/);
});

test('partial targets remain absolute fractions of original volume for replay safety',()=>{
 assert.match(ea,/event=="TP1"\?0\.66:0\.33/);
 assert.match(ea,/current<=target\+step\*0\.25/);
 assert.match(ea,/current-target/);
});

test('v0.23 remains hard DEMO-only',()=>{
 assert.match(ea,/InpEnableDemoExecution=false/);
 assert.match(ea,/ACCOUNT_TRADE_MODE_DEMO/);
 assert.match(ea,/DEMO execution refused on non-demo account/);
});


test('v0.23 uses valid MQL5 array reference syntax and avoids pre-1.0 Market version warning',()=>{
 assert.match(ea,/void HandleCommand\(string &parts\[\]\)/);
 assert.doesNotMatch(ea,/#property version\s+"0\.23"/);
});
