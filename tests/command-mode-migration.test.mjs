import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {makeCommand} from '../worker/src/command.mjs';
test('test-mode migration preserves historical commands, receipts and uniqueness indexes',()=>{
 const db=new DatabaseSync(':memory:');for(const p of readdirSync('worker/migrations').sort().filter(p=>!p.startsWith('0012')))db.exec(readFileSync('worker/migrations/'+p,'utf8'));
 db.prepare("INSERT INTO commands (id,tenant_id,source_type,source_ref,agent_id,execution_mode,payload_json,status,broker_ticket,last_error) VALUES ('old','u','telegram','tg:1','a','demo_execute','{}','FILLED','broker-proof',NULL)").run();
 const before=db.prepare('SELECT * FROM commands').get();db.exec(readFileSync('worker/migrations/0012_test_execution_mode.sql','utf8'));
 assert.deepEqual(db.prepare('SELECT * FROM commands').get(),before);
 assert.throws(()=>db.prepare("INSERT INTO commands (id,tenant_id,source_type,source_ref,agent_id,execution_mode,payload_json) VALUES ('duplicate','u','telegram','tg:1','a','demo_execute','{}')").run());
 db.prepare("INSERT INTO commands (id,tenant_id,source_type,agent_id,execution_mode,payload_json) VALUES ('new','u','test','a','test_execute','{}')").run();
 assert.equal(db.prepare('SELECT count(*) AS n FROM commands').get().n,2);db.close();
});
test('dedicated test execution mode cannot enable an ordinary OPEN signal',()=>{
 const c=makeCommand({tenantId:'u',agentId:'a',sourceType:'tradingview',mode:'test_execute',signal:{action:'OPEN'}});assert.equal(c.execution_mode,'dry_run');
});
