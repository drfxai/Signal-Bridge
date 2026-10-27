
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTestSignal, normalizeExecutionMode, makeCommand } from '../worker/src/command.mjs';
import { parseTelegramTrade } from '../worker/src/telegram-parser.mjs';

test('test signal validates canonical demo order',()=>{
 const now=Date.parse('2026-10-28T00:00:00Z');
 const s=validateTestSignal({side:'buy',symbol:'xauusd',volume:0.01,stop_loss:2700,take_profits:[2720,2730,2740]},now);
 assert.equal(s.side,'BUY');assert.equal(s.symbol,'XAUUSD');assert.equal(s.order.take_profits.length,3);
});

test('test signal fails closed for missing stop',()=>{
 assert.throws(()=>validateTestSignal({side:'BUY',symbol:'XAUUSD',volume:0.01,take_profits:[1]}),/INVALID_STOP_LOSS/);
});

test('execution mode defaults to dry run',()=>{
 assert.equal(normalizeExecutionMode('demo_execute'),'demo_execute');
 assert.equal(normalizeExecutionMode('anything'),'dry_run');
});

test('command contract is source-agnostic',()=>{
 const s=validateTestSignal({side:'SELL',symbol:'EURUSD',volume:0.01,stop_loss:1.2,take_profits:[1.1]},0);
 const c=makeCommand({tenantId:'t',agentId:'a',sourceType:'test',sourceRef:'ui',signal:s,mode:'dry_run',commandId:'00000000-0000-0000-0000-000000000001'});
 assert.equal(c.protocol,'signalbridge-command/1');assert.equal(c.execution_mode,'dry_run');assert.equal(c.action,'OPEN');
});

test('telegram parser accepts strict compact signal',()=>{
 const p=parseTelegramTrade('XAUUSD BUY\nLOT 0.01\nSL 2700\nTP1 2720\nTP2 2730\nTP3 2740',0);
 assert.equal(p.ok,true);assert.equal(p.signal.symbol,'XAUUSD');assert.equal(p.signal.side,'BUY');assert.equal(p.signal.order.volume.value,0.01);
});

test('telegram parser rejects missing SL',()=>{
 const p=parseTelegramTrade('XAUUSD BUY\nLOT 0.01\nTP1 2720',0);
 assert.equal(p.ok,false);assert.equal(p.reason,'STOP_LOSS_REQUIRED');
});
