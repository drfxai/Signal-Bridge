import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_POLICY,validatePolicy,policyFields} from '../worker/src/member-policy.mjs';
import {parseSignalMessage,parseManagement} from '../worker/src/signal-adapters.mjs';
import {telegramSignalText} from '../site/src/signal-routing.mjs';
import {readFileSync} from 'node:fs';
test('approved exit policy defaults and invalid profiles fail closed',()=>{
 assert.deepEqual(DEFAULT_POLICY,{tp1:'BE',tp2:'CLOSE',tp3:'OFF',partial_percent:50,be_buffer_points:0});
 assert.equal(policyFields(validatePolicy(DEFAULT_POLICY)),'BE|CLOSE|OFF|50|0');
 for(const p of [{...DEFAULT_POLICY,tp2:'OFF'},{...DEFAULT_POLICY,partial_percent:100},{...DEFAULT_POLICY,be_buffer_points:-1},{...DEFAULT_POLICY,tp1:'OPEN'},{...DEFAULT_POLICY,extra:true}])assert.throws(()=>validatePolicy(p));
});
test('common text, multilingual numbers and explicit JSON adapt without guessing stop or target',()=>{
 const messages=['BUY GOLD\nSL: 2300\nTP1: 2350\nTP2: 2360','خرید طلا\nحد ضرر: ۲۳۰۰\nهدف 1: ۲۳۵۰\nهدف 2: ۲۳۶۰',JSON.stringify({action:'buy',symbol:'GOLD',sl:2300,tp:[2350,2360]})];
 for(const text of messages){const r=parseSignalMessage(text,Date.now(),{defaultLots:0.01});assert.equal(r.ok,true,JSON.stringify(r));assert.equal(r.signal.symbol,'XAUUSD');assert.equal(r.signal.order.volume.value,0.01);assert.deepEqual(r.signal.order.take_profits,[2350,2360]);}
 for(const text of ['BUY GOLD TP1: 2350 TP2: 2360','BUY GOLD ENTRY: 2300-2305 SL: 2290 TP1: 2340','BUY LIMIT GOLD SL: 2300 TP1: 2350','BUY SELL GOLD SL: 2300 TP1: 2350'])assert.equal(parseSignalMessage(text,Date.now(),{defaultLots:0.01}).ok,false);
 assert.equal(parseSignalMessage('BUY GOLD\nSL: 2300\nTP: 2350 / 2360',Date.now(),{defaultLots:0.01}).ok,true);
});
test('reply management recognition is explicit and never invents a position reference',()=>{
 assert.equal(parseManagement('TP1 HIT'),'TP1');assert.equal(parseManagement('TP 2 reached'),'TP2');assert.equal(parseManagement('CLOSE POSITION'),'CLOSE');assert.equal(parseManagement('SL HIT'),'SL');assert.equal(parseManagement('close all accounts now'),null);
});
test('outgoing signal text carries values and loop identity without private credentials',()=>{
 const text=telegramSignalText({side:'BUY',symbol:'XAUUSD',order:{volume:{value:0.01},stop_loss:2300,take_profits:[2350,2360]}},'public-signal-id');assert.match(text,/Signal ID: public-signal-id/);assert.match(text,/TP2: 2360/);assert.doesNotMatch(text,/license|activation|token|webhook/i);
});
test('native target snapshots precede broker entry, preserve protection and separate report reset from risk',()=>{
 const ea=readFileSync('mt5/DrFX_SignalBridge_EA.mq5','utf8'),open=ea.slice(ea.indexOf('void HandleOpen('),ea.indexOf('void HandleManage('));assert.ok(open.indexOf('SavePositionPolicy(')<open.indexOf('trade.Buy('));assert.match(open,/PolicyClosePrice/);assert.match(ea,/trade.PositionModify\(ticket,wanted,tp\)/);assert.match(ea,/SYMBOL_TRADE_FREEZE_LEVEL/);assert.match(ea,/Partial submission uncertain/);assert.match(ea,/ACCOUNT_MARGIN_MODE_RETAIL_HEDGING/);
 const reset=ea.slice(ea.indexOf('void ResetReport('),ea.indexOf('string ReportSeries('));assert.doesNotMatch(reset,/g_riskHit\s*=|g_riskBase\s*=|PositionClose|OrderDelete/);
});
test('configured volume fallback never overrides an explicitly invalid volume label',()=>{
 for(const lot of ['banana','-1','0','NaN'])assert.equal(parseSignalMessage('BUY GOLD\nLOT: '+lot+'\nSL: 2300\nTP1: 2350\nTP2: 2360',Date.now(),{defaultLots:0.01}).ok,false);
});
test('simple JSON preserves explicit signal ID while invalid IDs are rejected',()=>{
 const signal={id:'test:source:123',action:'BUY',symbol:'GOLD',sl:2300,tp:[2350,2360]};assert.equal(parseSignalMessage(JSON.stringify(signal),Date.now(),{defaultLots:0.01}).signal.external_signal_id,'test:source:123');assert.equal(parseSignalMessage(JSON.stringify({...signal,id:'bad id'}),Date.now(),{defaultLots:0.01}).ok,false);
});
