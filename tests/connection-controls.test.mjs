import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import handler from '../site/src/worker.mjs';
import {AgentHub} from '../worker/src/agent-hub.mjs';
import {demoReadiness,makeConnectionTest} from '../site/src/execution-control.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
function fixture(){
 const db=new DatabaseSync(':memory:');
 for(const dir of ['worker/migrations','site/migrations'])for(const name of readdirSync(dir).sort())db.exec(readFileSync(dir+'/'+name,'utf8'));
 const exec=(sql,...args)=>db.prepare(sql).run(...args);
 const token='a'.repeat(43),other='b'.repeat(43);
 for(const [id,session] of [['usr_a',token],['usr_b',other]]){
  exec('INSERT INTO site_users (id,email) VALUES (?,?)',id,id+'@example.test');
  exec("INSERT INTO site_sessions (token_hash,user_id,expires_at) VALUES (?,?,'2099-01-01')",digest(session),id);
 }
 exec("INSERT INTO agent_connections (id,tenant_id,token_sha256) VALUES ('ea_a','usr_a',?)",digest('agent'));
 exec("INSERT INTO ea_licenses (id,agent_id,token_sha256,plan,duration_modifier,account_login,account_server,activated_at,expires_at) VALUES ('lic_a','ea_a',?,'trial','+1 month','123','Demo','2026-01-01','2099-01-01 00:00:00')",digest('license'));
 exec("INSERT INTO site_licenses (user_id,agent_id,license_id,encrypted_code,nonce) VALUES ('usr_a','ea_a','lic_a','placeholder','placeholder')");
 const calls=[];
 const snapshot={agent_id:'ea_a',client_type:'ea',terminal_online:true,account:{login:'123',server:'Demo',mode:'DEMO'},last_seen_at:new Date().toISOString(),capabilities:['timed-test-v1']};
 function prepared(sql,args=[]){return {bind(...values){return prepared(sql,values)},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=exec(sql,...args);return {success:true,meta:{changes:Number(r.changes)}}}}}
 const env={DB:{prepare:sql=>prepared(sql),async batch(stmts){db.exec('BEGIN');try{const result=[];for(const s of stmts)result.push(await s.run());db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}}},LICENSE_VAULT_KEY:Buffer.alloc(32,7).toString('base64'),AGENT_HUB:{idFromName:id=>id,get(id){assert.equal(id,'ea_a');return {async fetch(req){if(new URL(req.url).pathname==='/snapshot')return Response.json({clients:[snapshot]});calls.push(await req.json());return Response.json({delivered:1})}}}}};
 const request=(path,body,session=token)=>handler.fetch(new Request('https://drfx.company'+path,{method:body===undefined?'GET':'POST',headers:{cookie:'__Host-drfx_session='+session,origin:'https://drfx.company','content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
 return {db,env,request,calls,snapshot,other};
}
test('demo readiness requires active unexpired license, fresh socket, demo and timed capability',()=>{
 const ready={license:'active',agent_status:'active',license_unexpired:true,fresh:true,live_socket_verified:true,terminal_online:true,mt5_mode:'DEMO',capabilities:['timed-test-v1']};
 assert.equal(demoReadiness(ready,{timedTest:true}),null);
 for(const patch of [{license:'revoked'},{license_unexpired:false},{fresh:false},{terminal_online:false},{mt5_mode:'LIVE'},{capabilities:[]}])assert.ok(demoReadiness({...ready,...patch},{timedTest:true}));
 const s=makeConnectionTest('t',0);assert.equal(s.action,'TEST');assert.equal(s.order.volume.value,0.01);assert.equal(Date.parse(s.expires_at),15000);
});
test('test confirmation and tenant ownership enforced before dispatch',async()=>{
 const f=fixture();assert.equal((await f.request('/api/connection/test-demo',{})).status,400);
 assert.equal((await f.request('/api/connection/test-demo',{confirm:true},f.other)).status,409);
 assert.equal(f.calls.length,0);f.db.close();
});
test('confirmed test persists exact command, blocks concurrent test and isolates status',async()=>{
 const f=fixture();const response=await f.request('/api/connection/test-demo',{confirm:true});assert.equal(response.status,202);
 const result=await response.json();assert.equal(f.calls.length,1);const cmd=f.calls[0];
 assert.equal(cmd.action,'TEST');assert.equal(cmd.side,'BUY');assert.equal(cmd.symbol,'XAUUSD');assert.equal(cmd.order.volume.value,0.01);assert.equal(cmd.command_id,result.command_id);
 assert.equal(f.db.prepare('SELECT status FROM connection_tests').get().status,'ARMED');
 assert.equal((await f.request('/api/connection/test-status?id='+result.test_id,undefined,f.other)).status,404);
 assert.equal((await f.request('/api/connection/test-status?id='+result.test_id)).status,200);
 assert.equal((await f.request('/api/connection/test-demo',{confirm:true})).status,429);
 f.db.exec('DELETE FROM site_rate_limits');assert.equal((await f.request('/api/connection/test-demo',{confirm:true})).status,409);assert.equal(f.calls.length,1);f.db.close();
});
test('offline, stale, live and old EA cannot create a trading command',async()=>{
 for(const patch of [{terminal_online:false},{last_seen_at:'2000-01-01T00:00:00Z'},{capabilities:[]},{account:{login:'123',server:'Demo',mode:'LIVE'}}]){
  const f=fixture();Object.assign(f.snapshot,patch);assert.equal((await f.request('/api/connection/test-demo',{confirm:true})).status,409);assert.equal(f.calls.length,0);f.db.close();
 }
});
test('webhook mode requires confirmation and demo account, permits safe disable offline',async()=>{
 const f=fixture();assert.equal((await f.request('/api/webhook/create',{})).status,201);
 assert.equal((await f.request('/api/webhook/mode',{mode:'live'})).status,400);
 assert.equal((await f.request('/api/webhook/mode',{mode:'demo_execute'})).status,400);
 assert.equal((await f.request('/api/webhook/mode',{mode:'demo_execute',confirm:true})).status,200);
 assert.equal(f.db.prepare('SELECT delivery_mode FROM ingress_connections').get().delivery_mode,'demo_execute');
 f.snapshot.terminal_online=false;
 assert.equal((await f.request('/api/webhook/mode',{mode:'demo_execute',confirm:true})).status,409);
 assert.equal((await f.request('/api/webhook/mode',{mode:'dry_run'})).status,200);
 assert.equal((await f.request('/api/webhook/mode',{mode:'dry_run'},f.other)).status,404);f.db.close();
});
test('durable test close is independent from entry receipt and cannot be overwritten by late OPEN',async()=>{
 const f=fixture();const response=await f.request('/api/connection/test-demo',{confirm:true});const {command_id}=await response.json();
 const sent=[];const hub=new AgentHub({},f.env);const ws={send:s=>sent.push(s)};const a={role:'ea',agentId:'ea_a'};
 await hub.handleEaMessage(ws,'TEST_STATUS|'+command_id+'|CLOSED||broker exit confirmed',a);
 await hub.handleEaMessage(ws,'TEST_STATUS|'+command_id+'|OPEN||late report',a);
 assert.equal(f.db.prepare('SELECT status FROM connection_tests').get().status,'CLOSED');
 assert.equal(f.db.prepare('SELECT status FROM commands').get().status,'DELIVERED');
 await hub.handleEaMessage(ws,'TEST_STATUS|'+command_id+'|REJECTED||wrong agent',{role:'ea',agentId:'someone_else'});
 assert.equal(f.db.prepare('SELECT status FROM connection_tests').get().status,'CLOSED');f.db.close();
});
test('EA timed recovery runs before blocking cloud reconnect and is persisted before broker submission',()=>{
 const mq=readFileSync('mt5/DrFX_SignalBridge_EA.mq5','utf8');
 const tick=mq.slice(mq.indexOf('void OnTimer()'));assert.ok(tick.indexOf('CloseTimedTest();')<tick.indexOf('EnsureCloud();'));
 const start=mq.slice(mq.indexOf('void HandleTimedTest('),mq.indexOf('void HandleCommand('));assert.ok(start.indexOf('SaveTimedTest()')<start.indexOf('trade.Buy('));
 assert.match(mq,/trade\.PositionClose\(ticket\)/);assert.match(mq,/HistorySelectByPosition/);assert.match(mq,/HELLO_ACK"\|\|p\[0\]=="HB_ACK/);assert.match(mq,/LicenseRemaining/);
 assert.match(mq,/if\(TimedTestActive\(\)\)g_testDeadlineTick=GetTickCount64\(\)/);
 assert.match(mq,/CloseTimedTest\(\);if\(!TimedTestActive\(\)\)EnsureCloud\(\)/);
});

test('license heartbeat refreshes expiry and rejects corrupted expiry dates',async()=>{
 const f=fixture(),hub=new AgentHub({},f.env);
 const a={role:'ea',agentId:'ea_a',licenseId:'lic_a',licenseHash:digest('license'),account:{login:'123',server:'Demo'}};
 assert.equal(await hub.licenseIsValid(a),true);assert.equal(a.licenseExpires,'2099-01-01 00:00:00');
 f.db.prepare("UPDATE ea_licenses SET expires_at='2099-02-01 00:00:00'").run();assert.equal(await hub.licenseIsValid(a),true);assert.equal(a.licenseExpires,'2099-02-01 00:00:00');
 f.db.prepare("UPDATE ea_licenses SET expires_at='invalid'").run();assert.equal(await hub.licenseIsValid(a),false);f.db.close();
});
