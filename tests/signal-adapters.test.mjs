import test from 'node:test';
import assert from 'node:assert/strict';
import {parseSignalMessage,telegramMessageFresh} from '../worker/src/signal-adapters.mjs';
import {makeCommand} from '../worker/src/command.mjs';
const now=Date.now();
const canonical={schema_version:'1.0',external_signal_id:'my-indicator-1',source_type:'tradingview',action:'OPEN',side:'BUY',symbol:'XAUUSD',order:{type:'MARKET',volume:{mode:'FIXED_LOTS',value:0.01},stop_loss:2700,take_profits:[2720,2730]},occurred_at:new Date(now).toISOString(),expires_at:new Date(now+60000).toISOString(),metadata:{strategy:'My indicator'}};
test('Telegram accepts human signals, canonical indicator JSON and tagged GOD MODE',()=>{
 assert.equal(parseSignalMessage('GOLD BUY LOT 0.01 SL 2700 TP1 2720',now).ok,true);
 const json=parseSignalMessage(JSON.stringify(canonical),now);assert.equal(json.ok,true);
 const command=makeCommand({tenantId:'u',agentId:'a',sourceType:'telegram',sourceRef:'tg:1',signal:json.signal,mode:'dry_run'});
 assert.equal(command.source.strategy,'My indicator');assert.equal(command.source.type,'telegram');
 const tagged=parseSignalMessage('[[DRFX]]{"event":"tp1","signal_id":"gm-1","symbol":"XAUUSD"}[[/DRFX]]',now);
 assert.equal(tagged.ok,true);assert.equal(tagged.signal.action,'MANAGE');
});
test('ambiguous prose, malformed JSON, stale JSON and missing stops never become trades',()=>{
 for(const raw of ['maybe buy gold tomorrow','{bad json}',JSON.stringify({...canonical,expires_at:new Date(now-1).toISOString()}),JSON.stringify({...canonical,order:{...canonical.order,stop_loss:0}})])assert.equal(parseSignalMessage(raw,now).ok,false);
});
test('Telegram timestamps and original forwarded timestamps prevent revived signals',()=>{
 const date=Math.floor(now/1000);
 assert.equal(telegramMessageFresh({date},now),true);
 for(const msg of [{},{date:0},{date:date-70},{date:date+60},{date,forward_origin:{date:date-100}},{date:'123'}])assert.equal(telegramMessageFresh(msg,now),false);
});
