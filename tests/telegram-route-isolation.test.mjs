import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {parseSignalMessage,telegramMessageFresh} from '../worker/src/signal-adapters.mjs';

const routing=readFileSync(new URL('../site/src/signal-routing.mjs',import.meta.url),'utf8');
const SQL="SELECT delivery_mode FROM ingress_connections WHERE tenant_id=? AND agent_id=? AND provider='tradingview' AND status='active' ORDER BY created_at DESC,id DESC LIMIT 1";

test('Telegram-to-MT5 execution mode must be scoped to the exact member and EA',()=>{
 assert.ok(routing.includes(SQL),'route query must match both tenant and agent');
 assert.match(routing,/\.bind\(row\.user_id,row\.agent_id\)\.first\(\)/);
 assert.match(routing,/route\?\.delivery_mode\|\|'dry_run'/);
 assert.match(routing,/Execution is confirmed only by an EA\/broker receipt/);
});

test('two independent EA routes cannot inherit another account or agent execution mode',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(`CREATE TABLE ingress_connections (
    id TEXT PRIMARY KEY, tenant_id TEXT, agent_id TEXT, provider TEXT,
    status TEXT, delivery_mode TEXT, created_at TEXT);`);
  const insert=db.prepare('INSERT INTO ingress_connections VALUES (?,?,?,?,?,?,?)');
  insert.run('c1','uA','agent1','tradingview','active','demo_execute','2026-01-02');
  insert.run('c2','uA','agent2','tradingview','active','dry_run','2026-01-03');
  insert.run('c3','uB','agent1','tradingview','active','demo_execute','2026-01-04');
  insert.run('c4','uA','agent3','tradingview','revoked','demo_execute','2026-01-05');
  const get=db.prepare(SQL);
  assert.equal(get.get('uA','agent1').delivery_mode,'demo_execute');
  assert.equal(get.get('uA','agent2').delivery_mode,'dry_run');
  assert.equal(get.get('uA','agent3'),undefined);
  assert.equal(get.get('uC','agent1'),undefined);
 }finally{db.close();}
});

test('forwarded old trade and ambiguous entry range are reviewed, never executed automatically',()=>{
 const now=Date.now();
 const newDate=Math.floor(now/1000),oldDate=newDate-300;
 assert.equal(telegramMessageFresh({date:newDate,forward_origin:{date:oldDate}},now),false);
 assert.equal(telegramMessageFresh({date:newDate,forward_origin:{date:newDate}},now),true);
 const ambiguous=parseSignalMessage('GOLD BUY ENTRY 4075-4079 SL 4065 TP1 4085 TP2 4090 TP3 4100',now,{defaultLots:0.01});
 assert.equal(ambiguous.ok,false);
 assert.equal(ambiguous.reason,'ENTRY_RANGE_REQUIRES_REVIEW');
});
