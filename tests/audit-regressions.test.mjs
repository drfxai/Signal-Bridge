import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseGodModeAlert} from '../worker/src/godmode-parser.mjs';
import {receiptTransitionAllowed,terminalReadyAttachment,shouldReplayAfterTerminalState} from '../worker/src/agent-hub.mjs';

test('management events remain replayable across ordinary reconnect windows',()=>{
 const p=parseGodModeAlert('[[DRFX]]{"event":"close","signal_id":"gm-1","symbol":"XAUUSD"}[[/DRFX]]',0);
 assert.equal(p.ok,true);assert.equal(p.signal.action,'MANAGE');assert.equal(p.signal.expires_at,'9999-12-31T23:59:59.999Z');
});
test('receipt state machine rejects terminal-state rewrites',()=>{
 assert.equal(receiptTransitionAllowed('DELIVERED','SUBMITTED'),true);
 assert.equal(receiptTransitionAllowed('SUBMITTED','FILLED'),true);
 assert.equal(receiptTransitionAllowed('FILLED','SUBMITTED'),false);
 assert.equal(receiptTransitionAllowed('BROKER_REJECTED','FILLED'),false);
 assert.equal(receiptTransitionAllowed('FILLED','FILLED'),true);
});
test('dispatch readiness requires explicit MT5 terminal state and account identity',()=>{
 assert.equal(terminalReadyAttachment({terminalOnline:false,account:{login:'1',server:'s'}}),false);
 assert.equal(terminalReadyAttachment({terminalOnline:true,account:null}),false);
 assert.equal(terminalReadyAttachment({terminalOnline:true,account:{login:'1',server:'s'}}),true);
});
test('replay starts only on the offline-to-ready MT5 transition',()=>{
 const ready={terminalOnline:true,account:{login:'1',server:'s'}};
 assert.equal(shouldReplayAfterTerminalState(false,ready),true);
 assert.equal(shouldReplayAfterTerminalState(true,ready),false);
 assert.equal(shouldReplayAfterTerminalState(false,{terminalOnline:false,account:ready.account}),false);
});
test('Windows Agent never silently evicts oldest command on queue overflow',()=>{
 const agent=fs.readFileSync(new URL('../agent-windows/agent.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(agent,/queue\.shift\(\)/);
 assert.match(agent,/local MT5 queue full; command not forwarded/);
 assert.match(agent,/terminal_state/);
 assert.match(agent,/signalbridge-agent-v1/);
 assert.match(agent,/ReceiptOutbox/);
 assert.match(agent,/receipt_ack/);
});
test('Telegram retry path can recreate or redispatch its durable command',()=>{
 const index=fs.readFileSync(new URL('../worker/src/index.mjs',import.meta.url),'utf8');
 const command=fs.readFileSync(new URL('../worker/src/command.mjs',import.meta.url),'utf8');
 assert.match(index,/sourceRef='tg:'\+conn\.id\+':'\+updateId/);
 assert.match(index,/SELECT text_sha256,normalized_json FROM telegram_updates/);
 assert.match(command,/source_type='telegram' AND source_ref=\?/);
 assert.match(command,/prior\.status==='PENDING'/);
});
