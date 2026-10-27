import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseGodModeAlert} from '../worker/src/godmode-parser.mjs';
import {makeCommand} from '../worker/src/command.mjs';

test('God Mode management events preserve correlation without becoming new entries',()=>{
 const p=parseGodModeAlert('[[DRFX]]{"event":"tp1","signal_id":"abc-123","symbol":"XAUUSD"}[[/DRFX]]',0);
 assert.equal(p.ok,true);assert.equal(p.signal.action,'MANAGE');assert.equal(p.signal.management_event,'TP1');assert.equal(p.signal.correlation_id,'abc-123');assert.notEqual(p.signal.external_signal_id,'abc-123');
});
test('management command carries correlation and event',()=>{
 const c=makeCommand({tenantId:'t',agentId:'a',sourceType:'tradingview',sourceRef:'x',mode:'demo_execute',commandId:'00000000-0000-0000-0000-000000000001',signal:{external_signal_id:'event-id',correlation_id:'sig-1',action:'MANAGE',management_event:'TP2',occurred_at:new Date(0).toISOString(),expires_at:new Date(1000).toISOString()}});
 assert.equal(c.correlation_id,'sig-1');assert.equal(c.management_event,'TP2');assert.equal(c.order,null);
});
test('agent/EA wire protocol includes management event and deterministic trade tag',()=>{
 const agent=fs.readFileSync(new URL('../agent-windows/agent.mjs',import.meta.url),'utf8');
 const ea=fs.readFileSync(new URL('../mt5/DrFX_SignalBridge_EA_v0.21.mq5',import.meta.url),'utf8');
 assert.match(agent,/createHash\('sha256'\)/);assert.match(agent,/management_event/);assert.match(ea,/ArraySize\(parts\)<16/);assert.match(ea,/HandleManage/);assert.match(ea,/HistoryHasTag/);
});
test('AgentHub enforces one socket and replays pending commands',()=>{
 const hub=fs.readFileSync(new URL('../worker/src/agent-hub.mjs',import.meta.url),'utf8');
 assert.match(hub,/superseded by newer agent connection/);assert.match(hub,/status IN \('PENDING','DELIVERED'\)/);assert.match(hub,/replay:true/);
});
test('Telegram requires explicit pairing before chat binding',()=>{
 const index=fs.readFileSync(new URL('../worker/src/index.mjs',import.meta.url),'utf8');
 assert.match(index,/signalbridge_pair/);assert.match(index,/PAIRING_REQUIRED/);assert.match(index,/pair_code_sha256=NULL/);
});


test('God Mode entry uses bar timestamp from signal id and rejects stale entries',()=>{
 const now=1760000300000;
 const ok=parseGodModeAlert('[[DRFX]]{"event":"entry","signal_id":"XAUUSD-1760000200000","symbol":"XAUUSD","direction":"long","entry":2750,"sl":2730,"tp1":2770}[[/DRFX]]',now);
 assert.equal(ok.ok,true);assert.equal(ok.signal.occurred_at,new Date(1760000200000).toISOString());
 const stale=parseGodModeAlert('[[DRFX]]{"event":"entry","signal_id":"XAUUSD-1759999000000","symbol":"XAUUSD","direction":"long","entry":2750,"sl":2730,"tp1":2770}[[/DRFX]]',now);
 assert.equal(stale.ok,false);assert.equal(stale.reason,'STALE_GODMODE_ENTRY');
});

test('AgentHub reconnect replay does not delay WebSocket handshake',()=>{
 const hub=fs.readFileSync(new URL('../worker/src/agent-hub.mjs',import.meta.url),'utf8');
 assert.match(hub,/waitUntil\(this\.replay/);
});
