import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGodModeAlert } from '../worker/src/godmode-parser.mjs';
import { validateTradingView } from '../worker/src/validate.mjs';

test('God Mode tagged entry becomes canonical risk-percent command',()=>{
 const p=parseGodModeAlert('BUY GOLD [[DRFX]]{"event":"entry","signal_id":"gm-1","symbol":"XAUUSD","direction":"long","entry":2750,"sl":2738,"tp1":2760,"tp2":2770,"tp3":2780,"riskPct":0.8}[[/DRFX]]',0);
 assert.equal(p.ok,true);assert.equal(p.signal.order.volume.mode,'RISK_PERCENT');assert.equal(p.signal.order.volume.value,0.8);assert.equal(p.signal.order.reference_price,2750);
});
test('canonical TradingView accepts locally-sized risk percent',()=>{
 const now=Date.now();
 const x=validateTradingView({schema_version:'1.0',external_signal_id:'risk-1',source_type:'tradingview',action:'OPEN',side:'BUY',symbol:'XAUUSD',order:{type:'MARKET',volume:{mode:'RISK_PERCENT',value:0.5},reference_price:2750,stop_loss:2730,take_profits:[2770]},occurred_at:new Date(now-1000).toISOString(),expires_at:new Date(now+50000).toISOString()},now);
 assert.equal(x.order.volume.mode,'RISK_PERCENT');
});
test('God Mode management event is routed as MANAGE, not OPEN',()=>{
 const p=parseGodModeAlert('[[DRFX]]{"event":"tp1","signal_id":"gm-1","symbol":"XAUUSD"}[[/DRFX]]',0);
 assert.equal(p.ok,true);assert.equal(p.signal.action,'MANAGE');assert.equal(p.signal.management_event,'TP1');
});
