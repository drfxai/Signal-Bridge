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

test('God Mode fixed lots propagate to an MT5 FIXED_LOTS command without risk conversion',()=>{
 const now=Date.now();
 const id='gm-XAUUSD-5S-100-'+now;
 const payload={event:'entry',signal_id:id,symbol:'XAUUSD',direction:'long',entry:3850.145,sl:3845.145,tp1:3851.145,tp2:3852.145,tp3:3853.145,lots:0.01,tf:'5S',engines:'SCLP,ICT,S&D'};
 const result=parseGodModeAlert('[[DRFX]]'+JSON.stringify(payload)+'[[/DRFX]]',now);
 assert.equal(result.ok,true);
 assert.equal(result.signal.external_signal_id,id);
 assert.deepEqual(result.signal.order.volume,{mode:'FIXED_LOTS',value:0.01});
 assert.equal(result.signal.metadata.timeframe,'5s');
 assert.deepEqual(result.signal.metadata.engines,['SCLP','ICT','S&D']);
});
test('God Mode risk percent remains RISK_PERCENT and multi-timeframe IDs differ',()=>{
 const now=Date.now();
 const base={event:'entry',symbol:'XAUUSD',direction:'short',entry:3850,sl:3860,tp1:3848,tp2:3846,tp3:3844,riskPct:0.25};
 const p=(tf)=>parseGodModeAlert('[[DRFX]]'+JSON.stringify({...base,signal_id:'gm-XAUUSD-'+tf+'-100-'+now})+'[[/DRFX]]',now);
 assert.equal(p('5S').ok,true);assert.equal(p('1').ok,true);
 assert.notEqual(p('5S').signal.external_signal_id,p('1').signal.external_signal_id);
 assert.deepEqual(p('5S').signal.order.volume,{mode:'RISK_PERCENT',value:0.25});
});
test('God Mode fails closed for malformed or ambiguous fixed sizing',()=>{
 const now=Date.now();const base={event:'entry',signal_id:'gm-XAUUSD-5S-1-'+now,symbol:'XAUUSD',direction:'long',sl:3800,tp1:3900};
 for(const props of [{lots:0},{lots:-0.01},{lots:101},{lots:null},{lots:0.01,riskPct:1},{riskPct:0}]){
  const r=parseGodModeAlert('[[DRFX]]'+JSON.stringify({...base,...props})+'[[/DRFX]]',now);
  assert.equal(r.ok,false);
  assert.ok(['INVALID_LOTS','AMBIGUOUS_SIZE','INVALID_RISK'].includes(r.reason));
 }
});
