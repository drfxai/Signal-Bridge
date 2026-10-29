import {routeTelegramSignal,relayTradingView} from '../site/src/signal-routing.mjs';
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

test('failed preflight does not consume the test rate-limit budget',async()=>{
 const f=fixture();f.snapshot.capabilities=[];
 assert.equal((await f.request('/api/connection/test-demo',{confirm:true})).status,409);
 assert.equal(f.db.prepare('SELECT count(*) AS n FROM site_rate_limits').get().n,0);
 f.snapshot.capabilities=['timed-test-v1'];
 assert.equal((await f.request('/api/connection/test-demo',{confirm:true})).status,202);f.db.close();
});
test('missing site-to-ingress hub binding is reported explicitly without dispatch',async()=>{
 const f=fixture();delete f.env.AGENT_HUB;
 const response=await f.request('/api/connection/test-demo',{confirm:true});assert.equal(response.status,503);
 assert.equal((await response.json()).error,'EA_HUB_NOT_CONFIGURED');assert.equal(f.calls.length,0);
 const config=await (await f.request('/api/config')).json();assert.equal(config.ea_hub,false);assert.equal(config.release,'signalbridge-design-20261029.2');f.db.close();
});

test('v2 DEMO test is explicitly account-bound with dedicated execution mode',async()=>{
 const f=fixture();f.snapshot.capabilities=['timed-test-v2'];
 const body={confirm:true,account_mode:'DEMO',account_login:'123',account_server:'Demo'};
 assert.equal((await f.request('/api/connection/test',{...body,account_login:'wrong'})).status,409);
 const response=await f.request('/api/connection/test',body);assert.equal(response.status,202);
 assert.equal(f.calls[0].execution_mode,'test_execute');assert.deepEqual(f.calls[0].test_account,{mode:'DEMO',login:'123',server:'Demo'});
 assert.equal(f.db.prepare('SELECT account_mode FROM connection_tests').get().account_mode,'DEMO');f.db.close();
});
test('LIVE test requires live capability, exact account identity and explicit separate confirmation',async()=>{
 const f=fixture();f.snapshot.account.mode='LIVE';f.snapshot.capabilities=['live-test-v2'];
 const body={confirm:true,account_mode:'LIVE',account_login:'123',account_server:'Demo'};
 assert.equal((await f.request('/api/connection/test',body)).status,400);
 assert.equal(f.calls.length,0);assert.equal(f.db.prepare('SELECT count(*) AS n FROM site_rate_limits').get().n,0);
 assert.equal((await f.request('/api/connection/test',{...body,confirm_live:'CONFIRM LIVE TEST'})).status,202);
 assert.equal(f.calls[0].test_account.mode,'LIVE');assert.equal(f.calls[0].execution_mode,'test_execute');
 assert.equal((await f.request('/api/webhook/mode',{mode:'demo_execute',confirm:true})).status,409);f.db.close();
});
test('LIVE test capability cannot be substituted with demo or legacy support',async()=>{
 for(const caps of [['timed-test-v1'],['timed-test-v2'],[]]){
  const f=fixture();f.snapshot.account.mode='LIVE';f.snapshot.capabilities=caps;
  assert.equal((await f.request('/api/connection/test',{confirm:true,account_mode:'LIVE',account_login:'123',account_server:'Demo',confirm_live:'CONFIRM LIVE TEST'})).status,409);assert.equal(f.calls.length,0);f.db.close();
 }
});

test('new EA test configuration comes from authenticated telemetry, never request overrides',async()=>{
 const f=fixture();f.snapshot.capabilities=['timed-test-v2','test-config-v1'];Object.assign(f.snapshot.account,{test_symbol:'EURUSD.p',test_lots:0.02});
 const r=await f.request('/api/connection/test',{confirm:true,account_mode:'DEMO',account_login:'123',account_server:'Demo',test_symbol:'EURUSD.p',test_lots:0.02,symbol:'GBPUSD',lots:1});
 assert.equal(r.status,202);assert.equal(f.calls[0].symbol,'EURUSD.p');assert.equal(f.calls[0].order.volume.value,0.02);f.db.close();
});
test('drawdown HIT prevents test dispatch and invalid configured lots do not consume budget',async()=>{
 for(const patch of [{risk:{state:'HIT'}},{test_symbol:'EURUSD',test_lots:-1}]){
  const f=fixture();f.snapshot.capabilities=['timed-test-v2','test-config-v1'];Object.assign(f.snapshot.account,{test_symbol:'EURUSD',test_lots:0.01},patch);
  const r=await f.request('/api/connection/test',{confirm:true,account_mode:'DEMO',account_login:'123',account_server:'Demo'});assert.equal(r.status,409);assert.equal(f.calls.length,0);assert.equal(f.db.prepare('SELECT count(*) AS n FROM site_rate_limits').get().n,0);f.db.close();
 }
});
test('risk reset requires user consent, tenant account binding and exact HIT generation',async()=>{
 const f=fixture();f.snapshot.capabilities=['risk-v1'];f.snapshot.account.risk={state:'HIT',hit_id:'12345'};
 const b={confirm:true,hit_id:'12345',account_login:'123',account_server:'Demo'};
 assert.equal((await f.request('/api/risk/reset',{})).status,400);
 assert.equal((await f.request('/api/risk/reset',b,f.other)).status,409);
 for(const patch of [{hit_id:'old'},{account_login:'999'},{account_server:'Other'}])assert.equal((await f.request('/api/risk/reset',{...b,...patch})).status,409);
 assert.equal(f.calls.length,0);assert.equal((await f.request('/api/risk/reset',b)).status,200);assert.equal(f.calls.length,1);assert.equal(f.calls[0].agent_id,'ea_a');f.db.close();
});
test('hub reset sends a short-lived bound non-trading control and rejects stale HIT',async()=>{
 const f=fixture(),sent=[];let a={role:'ea',agentId:'ea_a',licenseId:'lic_a',licenseHash:digest('license'),lastSeenAt:new Date().toISOString(),capabilities:['risk-v1'],account:{login:'123',server:'Demo',risk:{state:'HIT',hit_id:'12345'}}};
 const ws={readyState:1,deserializeAttachment:()=>a,send:x=>sent.push(x)};globalThis.WebSocket??={OPEN:1};const hub=new AgentHub({getWebSockets:()=>[ws]},f.env);
 const req=b=>new Request('https://hub/risk-reset',{method:'POST',body:JSON.stringify(b)}),b={agent_id:'ea_a',account_login:'123',account_server:'Demo',hit_id:'12345'};
 assert.equal((await hub.fetch(req({...b,hit_id:'old'}))).status,409);assert.equal(sent.length,0);
 assert.equal((await hub.fetch(req(b))).status,202);assert.match(sent[0],/^RISK_RESET\|[^|]+\|123\|Demo\|CONFIRM\|12345\|\d+$/);assert.ok(Number(sent[0].split('|')[6])<=Date.now()+15000);a.account.risk.state='READY';assert.equal((await hub.fetch(req(b))).status,409);f.db.close();
});
test('EA configuration changes after browser confirmation require fresh consent',async()=>{
 const f=fixture();f.snapshot.capabilities=['timed-test-v2','test-config-v1'];Object.assign(f.snapshot.account,{test_symbol:'GBPUSD',test_lots:0.01});
 const r=await f.request('/api/connection/test',{confirm:true,account_mode:'DEMO',account_login:'123',account_server:'Demo',test_symbol:'EURUSD',test_lots:0.01});
 assert.equal(r.status,409);assert.equal((await r.json()).error,'TEST_SETTINGS_CHANGED');assert.equal(f.calls.length,0);f.db.close();
});

test('member policy settings are tenant scoped and route activation requires verification',async()=>{
 const f=fixture();const initial=await (await f.request('/api/member/settings')).json();assert.equal(initial.settings.policy.tp1,'BE');
 const body={policy:{tp1:'BE',tp2:'OFF',tp3:'CLOSE',partial_percent:50,be_buffer_points:5},default_lots:0.01,tv_to_telegram:false,telegram_to_mt5:false};
 assert.equal((await f.request('/api/member/settings',body)).status,200);assert.equal(f.db.prepare('SELECT count(*) AS n FROM member_signal_settings WHERE user_id=\'usr_b\'').get().n,0);
 assert.equal((await f.request('/api/member/settings',{...body,telegram_to_mt5:true,confirm:true})).status,409);
 const r=await f.request('/api/connection/test',{confirm:true,account_mode:'DEMO',account_login:'123',account_server:'Demo'});assert.equal(r.status,409);f.db.close();
});
test('report reset requires updated EA and confirmation, never modifies daily drawdown',async()=>{
 const f=fixture();assert.equal((await f.request('/api/member/report/reset',{})).status,400);assert.equal((await f.request('/api/member/report/reset',{confirm:true})).status,409);f.snapshot.capabilities.push('reports-v1');
 assert.equal((await f.request('/api/member/report/reset',{confirm:true},f.other)).status,409);assert.equal((await f.request('/api/member/report/reset',{confirm:true})).status,200);assert.equal(f.calls[0].agent_id,'ea_a');assert.equal(f.db.prepare('SELECT count(*) AS n FROM member_signal_settings').get().n,0);f.db.close();
});
test('target lifecycle events are account-scoped, deduplicated and acknowledged after durable storage',async()=>{
 const f=fixture(),sent=[];let attached;const ws={send:x=>sent.push(x),serializeAttachment:a=>{attached=a}};const a={role:'ea',agentId:'ea_a',tenantId:'usr_a',licenseId:'lic_a',licenseHash:digest('license'),account:{login:'123',server:'Demo'}};const hub=new AgentHub({},f.env);
 await hub.handleEaMessage(ws,'TARGET_EVENT|abcdef123456|0|2|1',a);await hub.handleEaMessage(ws,'TARGET_EVENT|abcdef123456|0|2|1',a);
 assert.equal(f.db.prepare('SELECT count(*) AS n FROM position_events').get().n,1);assert.equal(f.db.prepare('SELECT user_id FROM position_events').get().user_id,'usr_a');assert.equal(sent.at(-1),'EVENT_ACK|abcdef123456|0|2');
 await hub.handleEaMessage(ws,'TARGET_EVENT|bad|0|2|1',a);assert.equal(f.db.prepare('SELECT count(*) AS n FROM position_events').get().n,1);f.db.close();
});
test('authorized Telegram route preserves owner and deduplicates replies, unknown messages go to review',async()=>{
 const f=fixture();await f.request('/api/webhook/create',{});await f.request('/api/webhook/mode',{mode:'demo_execute',confirm:true});
 f.db.prepare("INSERT INTO member_signal_settings(user_id,telegram_chat_id,telegram_verified,telegram_to_mt5) VALUES ('usr_a','-100123',1,1)").run();
 const update={update_id:1,message:{message_id:20,date:Math.floor(Date.now()/1000),chat:{id:-100123},from:{id:9},text:'BUY GOLD\nSL: 2300\nTP1: 2350\nTP2: 2360'}};
 assert.equal((await routeTelegramSignal(update,f.env)).status,200);assert.equal(f.calls.length,1);assert.equal(f.calls[0].tenant_id,'usr_a');assert.equal(f.calls[0].execution_mode,'demo_execute');
 await routeTelegramSignal(update,f.env);assert.equal(f.calls.length,1);
 await routeTelegramSignal({...update,message:{...update.message,message_id:21,text:'TP1 HIT',reply_to_message:{message_id:20}}},f.env);assert.equal(f.calls.length,2);assert.equal(f.calls[1].action,'MANAGE');assert.equal(f.calls[1].correlation_id,f.calls[0].correlation_id);
 await routeTelegramSignal({...update,message:{...update.message,message_id:22,text:'maybe buy gold later'}},f.env);assert.equal(f.calls.length,2);assert.equal(f.db.prepare('SELECT count(*) AS n FROM signal_review_queue').get().n,1);
 assert.equal(await routeTelegramSignal({...update,message:{...update.message,chat:{id:-999}}},f.env),null);assert.equal(f.calls.length,2);f.db.close();
});
test('TradingView Telegram outbox sends only authorized persisted signals, deduplicates and never blindly retries uncertain delivery',async()=>{
 const f=fixture(),token='c'.repeat(43);f.db.prepare("INSERT INTO ingress_connections(id,tenant_id,provider,token_sha256,agent_id) VALUES ('relay_c','usr_a','tradingview',?,'ea_a')").run(digest(token));f.db.prepare("INSERT INTO member_signal_settings(user_id,telegram_chat_id,telegram_verified,tv_to_telegram) VALUES ('usr_a','123',1,1)").run();
 const signal={side:'BUY',symbol:'XAUUSD',order:{volume:{value:0.01},stop_loss:2300,take_profits:[2350,2360]}};
 for(const id of ['relay_s1','relay_s2'])f.db.prepare("INSERT INTO received_signals(id,tenant_id,connection_id,external_signal_id,payload_sha256,normalized_json,received_at,expires_at) VALUES (?,'usr_a','relay_c',?,?,?,CURRENT_TIMESTAMP,'2099-01-01')").run(id,id,digest(id),JSON.stringify(signal));
 f.env.TELEGRAM_BOT_TOKEN='fixture-not-a-secret';let sends=0,uncertain=false;const original=globalThis.fetch;globalThis.fetch=async(url,options)=>{sends++;assert.match(url,/api.telegram.org/);assert.equal(JSON.parse(options.body).chat_id,'123');if(uncertain)throw Error('simulated dropped reply');return Response.json({ok:true,result:{message_id:42}})};
 const request=(id,key=token)=>new Request('https://member/internal/signal-relay',{method:'POST',headers:{authorization:'Bearer '+key},body:JSON.stringify({signal_id:id})});
 try{await relayTradingView(request('relay_s1','d'.repeat(43)),f.env);assert.equal(sends,0);await relayTradingView(request('relay_s1'),f.env);await relayTradingView(request('relay_s1'),f.env);assert.equal(sends,1);assert.equal(f.db.prepare("SELECT status FROM telegram_signal_outbox WHERE signal_id='relay_s1'").get().status,'SENT');uncertain=true;await relayTradingView(request('relay_s2'),f.env);await relayTradingView(request('relay_s2'),f.env);assert.equal(sends,2);assert.equal(f.db.prepare("SELECT status FROM telegram_signal_outbox WHERE signal_id='relay_s2'").get().status,'UNKNOWN');assert.equal(f.calls.length,0);}finally{globalThis.fetch=original;f.db.close();}
});
