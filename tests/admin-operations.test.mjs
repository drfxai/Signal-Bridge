import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import worker from '../site/src/worker.mjs';
import {adminConnections} from '../site/src/admin-operations.mjs';
import {normalizeBotCommand} from '../site/src/bot-commands.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
function fixture(){
 const db=new DatabaseSync(':memory:');for(const dir of ['worker/migrations','site/migrations'])for(const name of readdirSync(dir).sort())db.exec(readFileSync(dir+'/'+name,'utf8'));
 const run=(sql,...args)=>db.prepare(sql).run(...args),owner='usr_'+'a'.repeat(32),member='usr_'+'b'.repeat(32),otherAdmin='usr_'+'c'.repeat(32);
 for(const [id,role,name,telegram] of [[owner,'admin','Owner','123'],[member,'user','Member','456'],[otherAdmin,'admin','Second','789']]){run('INSERT INTO site_users(id,email,telegram_id,telegram_name,role) VALUES (?,?,?,?,?)',id,name+'@example.test',telegram,name,role);run("INSERT INTO site_sessions(token_hash,user_id,expires_at) VALUES (?,?,datetime('now','+1 day'))",digest(id.slice(-1).repeat(43)),id)}
 function prepared(sql,args=[]){return {bind(...a){return prepared(sql,a)},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){return {success:true,meta:{changes:Number(run(sql,...args).changes)}}}}}
 const env={LICENSE_VAULT_KEY:Buffer.alloc(32,9).toString('base64'),SCALPER_LICENSE_SECRET:'test-secret',DB:{prepare:sql=>prepared(sql),async batch(stmts){db.exec('BEGIN');try{const out=[];for(const s of stmts)out.push(await s.run());db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}}};
 const request=(path,{user=owner,body,method}={})=>worker.fetch(new Request('https://drfx.company'+path,{method:method||(body===undefined?'GET':'POST'),headers:{...(user?{cookie:'__Host-drfx_session='+user.slice(-1).repeat(43)}:{}),origin:'https://drfx.company','content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
 return {db,run,owner,member,otherAdmin,env,request};
}

test('account profile is self-scoped metadata and never returns license credentials',async()=>{
 const f=fixture();try{
  assert.equal((await f.request('/api/account',{user:null})).status,401);
  const grant=await(await f.request('/api/admin/user',{body:{action:'grant_scalper_3m',user_id:f.owner,account_login:'8718098'}})).json();
  const own=await(await f.request('/api/account')).json();assert.equal(own.account.email,'Owner@example.test');assert.ok(own.account.created_at);assert.equal(own.scalper.issued_keys,1);assert.equal(own.scalper.purchased_keys,0);assert.equal(own.scalper.active,null);assert.equal(own.scalper.trial,null);assert.equal(own.scalper.licenses[0].purchased,false);
  const r=await f.request('/api/account?user_id='+f.owner,{user:f.member}),member=await r.json();assert.equal(member.account.id,f.member);assert.equal(member.scalper.issued_keys,0);assert.equal(member.signalbridge,null);assert.equal(r.headers.get('cache-control'),'no-store');
  const text=JSON.stringify(own);for(const name of ['activation_code','encrypted_key','encrypted_code','nonce',grant.scalper.key])assert.ok(!text.includes(name),name);
 }finally{f.db.close()}
});

test('profile distinguishes activation, expiration, trial and verified purchases',async()=>{
 const f=fixture();try{
  await f.request('/api/me');let d=await(await f.request('/api/account')).json();assert.equal(d.signalbridge.status,'awaiting_activation');assert.equal(d.summary.active_confirmed,0);assert.equal(d.summary.bridge_trials,1);
  f.run("UPDATE ea_licenses SET activated_at=datetime('now'),expires_at=datetime('now','+1 month') WHERE id=(SELECT license_id FROM site_licenses WHERE user_id=?)",f.owner);
  d=await(await f.request('/api/account')).json();assert.equal(d.summary.active_confirmed,1);assert.equal(d.summary.bridge_trials,1);
  f.run("UPDATE ea_licenses SET expires_at=datetime('now','-1 day') WHERE id=(SELECT license_id FROM site_licenses WHERE user_id=?)",f.owner);
  d=await(await f.request('/api/account')).json();assert.equal(d.signalbridge.status,'expired');assert.equal(d.summary.active_confirmed,0);assert.equal(d.summary.bridge_trials,0);
  await f.request('/api/admin/user',{body:{action:'grant_scalper_1m',user_id:f.owner,account_login:'8718098'}});
  f.run("INSERT INTO scalper_orders(id,user_id,plan,amount_usd,account_login,status) VALUES('profile_paid',?,'scalper_1m',19,'8718098','paid')",f.owner);
  f.run("UPDATE scalper_keys SET order_id='profile_paid' WHERE user_id=?",f.owner);
  d=await(await f.request('/api/account')).json();assert.equal(d.scalper.purchased_keys,1);assert.equal(d.summary.purchased_licenses,1);assert.equal(d.scalper.licenses[0].purchased,true);assert.equal(d.summary.active_incomplete,true);
 }finally{f.db.close()}
});

test('profile logout deletes the session and prevents subsequent profile access',async()=>{
 const f=fixture();try{
  assert.equal((await f.request('/api/account')).status,200);const r=await f.request('/api/auth/logout',{body:{}});assert.equal(r.status,200);assert.match(r.headers.get('set-cookie'),/Max-Age=0/);assert.equal((await f.request('/api/account')).status,401);assert.equal((await f.request('/api/me')).status,401);
 }finally{f.db.close()}
});

test('Signal Bridge accepts the requested alias and valid Telegram menu names only as exact commands',()=>{
 for(const x of ['/Signal Bridge','/signal bridge',' /SIGNAL   BRIDGE ','/signalbridge','/SignalBridge@ExampleBot','/signal_bridge','/Signal@ExampleBot Bridge'])assert.equal(normalizeBotCommand(x),'/signalbridge',x);
 assert.equal(normalizeBotCommand('/Signal Bridge user123'),'/signal');assert.equal(normalizeBotCommand('/code@ExampleBot'),'/code');
});

test('every administration read denies anonymous and ordinary authenticated users',async()=>{
 const f=fixture();try{for(const path of ['/api/admin/overview','/api/admin/directory','/api/admin/connections','/api/admin/orders','/api/admin/licenses?product=signalbridge','/api/admin/licenses?product=scalper']){
 assert.equal((await f.request(path,{user:null})).status,401,path);assert.equal((await f.request(path,{user:f.member})).status,403,path);
 }}finally{f.db.close()}
});

test('private vault is self-scoped even when a second administrator supplies the owner ID',async()=>{
 const f=fixture();try{
  const granted=await f.request('/api/admin/user',{body:{action:'grant_scalper_3m',user_id:f.owner,account_login:'8718098'}});assert.equal(granted.status,200);const {scalper}=await granted.json();
  const own=await(await f.request('/api/admin/licenses?product=scalper')).json();assert.equal(own.keys[0].key,scalper.key);
  const other=await(await f.request('/api/admin/licenses?product=scalper&user_id='+f.owner,{user:f.otherAdmin})).json();assert.deepEqual(other.keys,[]);
  const response=await f.request('/api/admin/licenses?product=signalbridge');const bridge=await response.json();assert.match(bridge.license.activation_code,/^[A-Za-z0-9_-]{43}$/);assert.equal(response.headers.get('cache-control'),'no-store');
  const otherBridge=await(await f.request('/api/admin/licenses?product=signalbridge&user_id='+f.owner,{user:f.otherAdmin})).json();assert.notEqual(otherBridge.license.activation_code,bridge.license.activation_code);
  for(const path of ['/api/admin/overview','/api/admin/directory','/api/admin/orders']){const text=await(await f.request(path)).text();assert.ok(!text.includes(scalper.key));assert.ok(!text.includes(bridge.license.activation_code));assert.ok(!text.includes('encrypted_key'));assert.ok(!text.includes('encrypted_code'))}
  assert.equal((await f.request('/api/admin/licenses?product=unknown')).status,400);
 }finally{f.db.close()}
});

test('overview separates products, expired licenses, free trials, sales and administrative grants',async()=>{
 const f=fixture();try{
  for(const id of [f.owner,f.member,f.otherAdmin])await f.request('/api/me',{user:id});
  await f.request('/api/admin/user',{body:{action:'grant_annual',user_id:f.owner}});
  f.run("UPDATE ea_licenses SET activated_at=datetime('now','-2 years'),expires_at=datetime('now','-1 year') WHERE id=(SELECT license_id FROM site_licenses WHERE user_id=?)",f.otherAdmin);
  await f.request('/api/admin/user',{body:{action:'grant_scalper_3m',user_id:f.owner,account_login:'8718098'}});
  f.run("INSERT INTO site_orders(id,user_id,plan,amount_usd,status) VALUES('ord_paid',?,'annual',165,'paid'),('ord_pending',?,'quarterly',47,'pending')",f.member,f.member);
  f.run("INSERT INTO scalper_orders(id,user_id,plan,amount_usd,account_login,status) VALUES('sco_paid',?,'scalper_1m',19,'12345','paid')",f.member);
  const d=await(await f.request('/api/admin/overview')).json();assert.equal(d.users.total,3);assert.equal(d.users.customers,1);assert.equal(d.signalbridge.users,3);assert.equal(d.signalbridge.valid_licenses,2);assert.equal(d.signalbridge.trials,1);assert.equal(d.signalbridge.subscriptions,1);assert.equal(d.signalbridge.expired,1);assert.equal(d.signalbridge.orders.paid_usd,165);assert.equal(d.signalbridge.orders.pending,1);
  assert.equal(d.scalper.issued_keys,1);assert.equal(d.scalper.users,1);assert.equal(d.scalper.orders.paid_usd,19);for(const field of ['online','demo','trials','active_subscriptions'])assert.equal(d.scalper[field],null);
 }finally{f.db.close()}
});

test('directory paginates and filters products and Telegram names without exposing keys',async()=>{
 const f=fixture();try{
  await f.request('/api/me');await f.request('/api/admin/user',{body:{action:'grant_scalper_1m',user_id:f.member,account_login:'12345678'}});
  const first=await(await f.request('/api/admin/directory?limit=2')).json();assert.equal(first.users.length,2);assert.equal(first.has_more,true);const last=await(await f.request('/api/admin/directory?limit=2&offset='+first.next_offset)).json();assert.equal(last.users.length,1);assert.ok(!first.users.some(u=>u.id===last.users[0].id));
  const bridge=await(await f.request('/api/admin/directory?product=signalbridge')).json();assert.equal(bridge.users.length,1);assert.equal(bridge.users[0].id,f.owner);
  const scalper=await(await f.request('/api/admin/directory?product=scalper&q=Member')).json();assert.equal(scalper.users.length,1);assert.equal(scalper.users[0].scalper_keys,1);
  assert.equal((await f.request('/api/admin/connections?cursor=bad')).status,400);
 }finally{f.db.close()}
});

test('online counts require fresh matching EA sockets and distinguish demo, live, stale and unavailable',async()=>{
 const f=fixture();try{
  for(const [i,id] of [f.owner,f.member,f.otherAdmin].entries()){
   await f.request('/api/me',{user:id});f.run("UPDATE ea_licenses SET account_login=?,account_server='Broker',activated_at=datetime('now'),expires_at=datetime('now','+1 year') WHERE id=(SELECT license_id FROM site_licenses WHERE user_id=?)",String(10000+i),id);
  }
  const licenses=f.db.prepare('SELECT l.agent_id,e.account_login FROM site_licenses l JOIN ea_licenses e ON e.id=l.license_id ORDER BY l.agent_id').all();
  f.env.AGENT_HUB={idFromName:id=>id,get:id=>({fetch:async()=>{
   const i=licenses.findIndex(l=>l.agent_id===id),row=licenses[i];return Response.json({clients:[{agent_id:id,client_type:'ea',terminal_online:true,last_seen_at:new Date(Date.now()-(i===2?90001:0)).toISOString(),account:{login:row.account_login,server:'Broker',mode:i===0?'DEMO':'LIVE'}}]})
  }})};
  const page=await adminConnections(f.env,new URL('https://drfx.company/api/admin/connections?limit=2'));assert.equal(page.counts.online,2);assert.equal(page.counts.demo,1);assert.equal(page.counts.live,1);assert.equal(page.has_more,true);
  const next=await adminConnections(f.env,new URL('https://drfx.company/api/admin/connections?cursor='+page.next_cursor));assert.equal(next.counts.online,0);assert.equal(next.counts.checked,1);assert.equal(next.has_more,false);
  f.env.AGENT_HUB.get=id=>({fetch:async()=>Response.json({clients:[{agent_id:id,client_type:'observer',terminal_online:true,last_seen_at:new Date().toISOString(),account:{login:'wrong',server:'Broker',mode:'DEMO'}}]})});
  assert.equal((await adminConnections(f.env,new URL('https://drfx.company'))).counts.online,0);
  f.env.AGENT_HUB.get=()=>({fetch:async()=>{throw Error('unavailable')}});const failed=await adminConnections(f.env,new URL('https://drfx.company'));assert.equal(failed.counts.online,0);assert.equal(failed.counts.unavailable,3);
 }finally{f.db.close()}
});

test('private Telegram /Signal Bridge returns only the signed sender license; groups are ignored',async()=>{
 const f=fixture(),real=globalThis.fetch,sent=[];f.env.TELEGRAM_BOT_TOKEN='bot-test';f.env.TELEGRAM_WEBHOOK_SECRET='test-webhook-secret';globalThis.fetch=async(url,init)=>{assert.match(String(url),/^https:\/\/api.telegram.org\/botbot-test\//);sent.push(JSON.parse(init.body));return Response.json({ok:true,result:{}})};
 const webhook=body=>worker.fetch(new Request('https://drfx.company/api/telegram/webhook',{method:'POST',headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':'test-webhook-secret'},body:JSON.stringify(body)}),f.env);
 try{
  const own=await(await f.request('/api/admin/licenses?product=signalbridge')).json();
  assert.equal((await webhook({message:{chat:{id:123,type:'private'},from:{id:123},text:'/Signal Bridge'}})).status,200);assert.ok(sent.some(x=>x.chat_id==='123'&&x.text.includes(own.license.activation_code)));
  sent.length=0;await webhook({message:{chat:{id:456,type:'private'},from:{id:456},text:'/Signal Bridge'}});assert.ok(sent.length>0);assert.ok(sent.every(x=>!x.text?.includes(own.license.activation_code)));
  sent.length=0;await webhook({message:{chat:{id:-1,type:'group'},from:{id:123},text:'/Signal Bridge'}});assert.equal(sent.length,0);
 }finally{globalThis.fetch=real;f.db.close()}
});

test('bot command synchronization requires admin and uses server-bound credentials',async()=>{
 const f=fixture(),real=globalThis.fetch;try{
  assert.equal((await f.request('/api/admin/bot/commands',{user:null,body:{}})).status,401);
  assert.equal((await f.request('/api/admin/bot/commands',{user:f.member,body:{}})).status,403);
  assert.equal((await f.request('/api/admin/bot/commands',{body:{}})).status,503);
  f.env.TELEGRAM_BOT_TOKEN='bot-test';globalThis.fetch=async(url,init)=>{assert.equal(String(url),'https://api.telegram.org/botbot-test/setMyCommands');const body=JSON.parse(init.body);assert.ok(body.commands.some(c=>c.command==='signalbridge'));assert.ok(body.commands.some(c=>c.command==='scalper'));assert.ok(body.commands.every(c=>/^[a-z_]+$/.test(c.command)));return Response.json({ok:true})};
  const r=await f.request('/api/admin/bot/commands',{body:{}});assert.equal(r.status,200);assert.ok(!(await r.text()).includes('bot-test'));
 }finally{globalThis.fetch=real;f.db.close()}
});
