import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash,createHmac} from 'node:crypto';
import worker from '../site/src/worker.mjs';
import {parseScalperKey} from '../site/src/scalper.mjs';

// Completely isolated in-memory test. No NOWPayments invoices, real funds,
// production users, production D1 records, or production licence keys are used.
const sortDeep=v=>Array.isArray(v)?v.map(sortDeep):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sortDeep(v[k])])):v;
function setup(){
 const db=new DatabaseSync(':memory:');
 for(const dir of ['worker/migrations','site/migrations']){
  for(const file of readdirSync(dir).filter(n=>n.endsWith('.sql')).sort()){
   db.exec(readFileSync(dir+'/'+file,'utf8'));
  }
 }
 const token='t'.repeat(43);
 db.prepare("INSERT INTO site_users(id,email) VALUES ('usr_payment_test','payment@example.test')").run();
 db.prepare("INSERT INTO site_sessions(token_hash,user_id,expires_at) VALUES (?,'usr_payment_test','2099-01-01')").run(createHash('sha256').update(token).digest('hex'));
 const statement=(sql,values=[])=>({
  bind(...xs){return statement(sql,xs)},
  async first(){return db.prepare(sql).get(...values)||null},
  async all(){return {results:db.prepare(sql).all(...values)}},
  async run(){const v=db.prepare(sql).run(...values);return {success:true,meta:{changes:Number(v.changes)}}}
 });
 const env={
  DB:{
   prepare(sql){return statement(sql)},
   async batch(statements){
    db.exec('BEGIN');
    try{const results=[];for(const st of statements)results.push(await st.run());db.exec('COMMIT');return results}
    catch(e){db.exec('ROLLBACK');throw e}
   }
  },
  LICENSE_VAULT_KEY:Buffer.alloc(32,7).toString('base64'),
  NOWPAYMENTS_API_KEY:'MOCK_ONLY',NOWPAYMENTS_IPN_SECRET:'TEST_ONLY_IPN_SECRET',
  SCALPER_LICENSE_SECRET:'TEST_ONLY_SCALPER_SECRET'
 };
 const request=(url,body)=>worker.fetch(new Request('https://drfx.company'+url,{
  method:body===undefined?'GET':'POST',
  headers:{cookie:'__Host-drfx_session='+token,origin:'https://drfx.company','content-type':'application/json'},
  ...(body===undefined?{}:{body:JSON.stringify(body)})
 }),env);
 const ipn=(payload,{valid=true}={})=>{
  const signature=createHmac('sha512',env.NOWPAYMENTS_IPN_SECRET).update(JSON.stringify(sortDeep(payload))).digest('hex');
  return worker.fetch(new Request('https://drfx.company/api/payments/ipn',{
   method:'POST',
   headers:{'content-type':'application/json','x-nowpayments-sig':valid?signature:'0'.repeat(128)},
   body:JSON.stringify(payload)
  }),env);
 };
 return {db,env,request,ipn};
}

test('four paid products: user-bound invoice, verified IPN, no duplicate grant, and correct licence',async()=>{
 const f=setup(),originalFetch=globalThis.fetch,created=[];
 const testPlans=[
  {name:'Signal Bridge · 3 months',path:'/api/checkout',plan:'quarterly',usd:47,days:null,kind:'signalbridge'},
  {name:'Signal Bridge · 1 year',path:'/api/checkout',plan:'annual',usd:165,days:null,kind:'signalbridge'},
  {name:'Scalper Pro · 1 month',path:'/api/scalper/checkout',plan:'scalper_1m',usd:19,days:30,kind:'scalper'},
  {name:'Scalper Pro · 3 months',path:'/api/scalper/checkout',plan:'scalper_3m',usd:49,days:90,kind:'scalper'}
 ];
 globalThis.fetch=async(url,opts)=>{
  if(String(url)==='https://api.nowpayments.io/v1/invoice'){
   const body=JSON.parse(opts.body),invoice='simulated-'+(created.length+1);
   created.push(body);
   return Response.json({id:invoice,invoice_url:'https://nowpayments.io/payment/?iid='+invoice});
  }
  if(String(url).includes('api.telegram.org'))return Response.json({ok:true});
  throw new Error('Unexpected outbound request in isolated payment test');
 };
 try{
  const p=await f.request('/api/me');
  assert.equal(p.status,200,'pre-provision a trial EA licence for the test user');
  const initial=await p.json();
  assert.ok(initial.user.activation_code,'test account receives an initial Signal Bridge activation code');
  assert.equal((await f.request('/api/config')).status,200);
  assert.equal((await (await f.request('/api/config')).json()).payments,true);
  for(const c of testPlans){
   const input=c.kind==='scalper'?{plan:c.plan,account_login:'12345678'}:{plan:c.plan};
   const purchase=await f.request(c.path,input);
   assert.equal(purchase.status,200,c.name+' checkout status');
   const {order_id,invoice_url}=await purchase.json();
   assert.ok(order_id.startsWith(c.kind==='scalper'?'sco_':'ord_'),c.name+' uses server-issued order ID');
   assert.ok(invoice_url.startsWith('https://nowpayments.io/payment/?iid=simulated-'),c.name+' invoice URL');
   const sent=created.at(-1);
   assert.equal(sent.order_id,order_id,c.name+' individual user-bound invoice');
   assert.equal(sent.price_amount,c.usd,c.name+' requested amount');
   assert.equal(sent.price_currency,'usd');
   assert.equal(sent.ipn_callback_url,'https://drfx.company/api/payments/ipn');

   const payload={order_id,payment_id:'mock-payment-'+created.length,payment_status:'finished',price_amount:c.usd,price_currency:'usd'};
   const rejected=await f.ipn(payload,{valid:false});
   assert.equal(rejected.status,401,c.name+' rejects spoofed IPN');
   assert.equal((await f.ipn({...payload,payment_status:'waiting'})).status,200,c.name+' ignores unconfirmed payment');
   assert.equal((await f.ipn({...payload,price_amount:c.usd+1})).status,409,c.name+' refuses wrong amount');
   const accepted=await f.ipn(payload);
   assert.equal(accepted.status,200,c.name+' accepts correctly signed final status');
   assert.equal((await accepted.json()).granted,true,c.name+' grants entitlement once');
   const duplicate=await f.ipn(payload);
   assert.equal((await duplicate.json()).duplicate,true,c.name+' duplicate event ignored');
   if(c.kind==='scalper'){
    const view=await (await f.request('/api/scalper')).json();
    const key=view.keys.find(k=>k.plan===c.plan);
    assert.ok(key,c.name+' key appears in the customer portal');
    const parsed=await parseScalperKey('TEST_ONLY_SCALPER_SECRET',key.key);
    assert.equal(parsed.account_login,'12345678',c.name+' key is MT5 account-bound');
    assert.equal(parsed.days,c.days,c.name+' validity');
    assert.equal(view.orders.find(o=>o.id===order_id).status,'paid');
    assert.ok(!JSON.stringify(f.db.prepare('SELECT * FROM scalper_keys').all()).includes(key.key),'raw key is not stored in database');
   }else{
    const orders=await (await f.request('/api/orders')).json();
    assert.equal(orders.orders.find(o=>o.id===order_id).status,'paid',c.name+' order paid');
    const profile=await (await f.request('/api/me')).json();
    assert.equal(profile.user.plan,c.plan,c.name+' membership updated');
   }
  }
  assert.equal(created.length,4,'one unique invoice per test purchase');
  assert.equal(new Set(created.map(c=>c.order_id)).size,4);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM scalper_keys').get().n,2,'one key per Scalper Pro plan');
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM site_orders WHERE status='paid'").get().n,2,'both Signal Bridge plans paid');
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM scalper_orders WHERE status='paid'").get().n,2,'both Scalper Pro plans paid');
 }finally{
  globalThis.fetch=originalFetch;
  f.db.close();
 }
});
