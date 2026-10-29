import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash,createHmac} from 'node:crypto';
import handler from '../site/src/worker.mjs';
import {makeScalperKey,parseScalperKey,validLogin,SCALPER_PLANS} from '../site/src/scalper.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');

test('Scalper Pro keys match the EA / keygen.py format byte for byte',async()=>{
 // vectors produced by ScalperPro tools/keygen.py with secret "test-secret"
 assert.equal(await makeScalperKey('test-secret','12345678',30,77,0),'DRFX-K3S52-AAAAA-AAAHS-AKWAA-AAAAA-FB9JS-8GJZQ-8DBFD');
 assert.equal(await makeScalperKey('test-secret','9223372036854775807',90,4294967295,3),'DRFX-99999-99999-9Z8YS-A9999-992DA-FY5MQ-4GBV2-QP3EL');
 const parsed=await parseScalperKey('test-secret','drfx-k3s52-aaaaa-aaahs-akwaa-aaaaa-fb9js-8gjzq-8dbfd');
 assert.deepEqual(parsed,{account_login:'12345678',days:30,serial:77,plan:0});
 assert.equal(await parseScalperKey('other-secret','DRFX-K3S52-AAAAA-AAAHS-AKWAA-AAAAA-FB9JS-8GJZQ-8DBFD'),null);
 assert.equal(await parseScalperKey('test-secret','DRFX-K3S52-AAAAA-AAAHS-AKWAA-AAAAA-FB9JS-8GJZQ-8DBFA'),null);
});
test('MT5 account numbers are validated',()=>{
 for(const ok of ['1234','12345678','9223372036854775807'])assert.equal(validLogin(ok),ok);
 for(const bad of ['','0123','12a4','123','9223372036854775808','-5',' 1 2'])assert.equal(validLogin(bad),null);
 assert.deepEqual(Object.keys(SCALPER_PLANS),['scalper_1m','scalper_3m']);
 assert.equal(SCALPER_PLANS.scalper_1m.usd,19);assert.equal(SCALPER_PLANS.scalper_3m.usd,49);
});

function fixture(extra={}){
 const db=new DatabaseSync(':memory:');
 for(const dir of ['worker/migrations','site/migrations'])for(const name of readdirSync(dir).sort())db.exec(readFileSync(dir+'/'+name,'utf8'));
 const exec=(sql,...args)=>db.prepare(sql).run(...args);
 const token='s'.repeat(43);
 exec("INSERT INTO site_users (id,email,telegram_id) VALUES ('usr_s','s@example.test','555')");
 exec("INSERT INTO site_sessions (token_hash,user_id,expires_at) VALUES (?,?,'2099-01-01')",digest(token),'usr_s');
 function prepared(sql,args=[]){return {bind(...values){return prepared(sql,values)},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=exec(sql,...args);return {success:true,meta:{changes:Number(r.changes)}}}}}
 const env={DB:{prepare:sql=>prepared(sql),async batch(stmts){db.exec('BEGIN');try{const result=[];for(const s of stmts)result.push(await s.run());db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}}},
  LICENSE_VAULT_KEY:Buffer.alloc(32,9).toString('base64'),SCALPER_LICENSE_SECRET:'test-secret',NOWPAYMENTS_API_KEY:'np',NOWPAYMENTS_IPN_SECRET:'ipn',...extra};
 const request=(path,body)=>handler.fetch(new Request('https://drfx.company'+path,{method:body===undefined?'GET':'POST',headers:{cookie:'__Host-drfx_session='+token,origin:'https://drfx.company','content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
 return {db,env,request};
}
const sortDeep=v=>Array.isArray(v)?v.map(sortDeep):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sortDeep(v[k])])):v;
const ipn=(env,body)=>handler.fetch(new Request('https://drfx.company/api/payments/ipn',{method:'POST',headers:{'content-type':'application/json','x-nowpayments-sig':createHmac('sha512','ipn').update(JSON.stringify(sortDeep(body))).digest('hex')},body:JSON.stringify(body)}),env);

test('checkout validates plan and MT5 account, then a verified payment issues one account-bound key',async()=>{
 const f=fixture(),real=globalThis.fetch,sent=[];
 globalThis.fetch=async(url,init)=>{
  if(String(url).includes('nowpayments.io')){sent.push(JSON.parse(init.body));return Response.json({id:'inv1',invoice_url:'https://nowpayments.io/payment/?iid=inv1'})}
  if(String(url).includes('api.telegram.org')){sent.push({telegram:JSON.parse(init.body)});return Response.json({ok:true})}
  return real(url,init);
 };
 f.env.TELEGRAM_BOT_TOKEN='bot';
 try{
  assert.equal((await f.request('/api/scalper/checkout',{plan:'scalper_9m',account_login:'12345678'})).status,400);
  assert.equal((await f.request('/api/scalper/checkout',{plan:'scalper_3m',account_login:'12x'})).status,400);
  const r=await f.request('/api/scalper/checkout',{plan:'scalper_3m',account_login:'12345678'});
  assert.equal(r.status,200);const {order_id,invoice_url}=await r.json();
  assert.match(order_id,/^sco_/);assert.match(invoice_url,/nowpayments\.io/);
  assert.equal(sent[0].price_amount,49);assert.match(sent[0].order_description,/MT5 #12345678/);
  // wrong amount is refused; correct final payment grants exactly once
  assert.equal((await ipn(f.env,{order_id,payment_id:'p1',payment_status:'finished',price_amount:19,price_currency:'usd'})).status,409);
  const ok=await ipn(f.env,{order_id,payment_id:'p1',payment_status:'finished',price_amount:49,price_currency:'usd'});
  assert.deepEqual(await ok.json(),{ok:true,granted:true});
  assert.deepEqual(await (await ipn(f.env,{order_id,payment_id:'p1',payment_status:'finished',price_amount:49,price_currency:'usd'})).json(),{ok:true,duplicate:true});
  const view=await (await f.request('/api/scalper')).json();
  assert.equal(view.keys.length,1);assert.equal(view.orders[0].status,'paid');
  const k=await parseScalperKey('test-secret',view.keys[0].key);
  assert.equal(k.account_login,'12345678');assert.equal(k.days,90);assert.equal(k.plan,3);
  // the key is stored encrypted, never in clear text
  assert.ok(!JSON.stringify(f.db.prepare('SELECT * FROM scalper_keys').all()).includes(view.keys[0].key));
  // buyer receives the key in Telegram
  assert.ok(sent.some(x=>x.telegram&&x.telegram.text.includes(view.keys[0].key)));
 }finally{globalThis.fetch=real;f.db.close();}
});
test('Scalper checkout fails closed without the signing secret',async()=>{
 const f=fixture({SCALPER_LICENSE_SECRET:undefined});
 const r=await f.request('/api/scalper/checkout',{plan:'scalper_1m',account_login:'12345678'});
 assert.equal(r.status,503);assert.equal((await r.json()).error,'SCALPER_LICENSING_NOT_CONFIGURED');
 assert.equal((await (await f.request('/api/scalper')).json()).configured,false);
 f.db.close();
});
