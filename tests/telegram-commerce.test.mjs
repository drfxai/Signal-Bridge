import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {STAR_PLANS,starPrice,matchesPayment,purchaseQuote,acceptStarQuote,starPreCheckout,starSuccessfulPayment,sendPrivateLicenses} from '../site/src/telegram-commerce.mjs';
import {LICENSE_SHOP_WIDGET_HTML} from '../site/src/telegram-license-shop.mjs';

function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec("CREATE TABLE site_users(id TEXT PRIMARY KEY,telegram_id TEXT,status TEXT,plan TEXT,updated_at TEXT); INSERT INTO site_users VALUES('u1','123','active','trial',NULL); CREATE TABLE site_audit(id TEXT PRIMARY KEY,actor_id TEXT,action TEXT,subject_id TEXT,detail TEXT); CREATE TABLE ea_licenses(agent_id TEXT PRIMARY KEY,plan TEXT,duration_modifier TEXT,status TEXT,expires_at TEXT,activated_at TEXT,updated_at TEXT); INSERT INTO ea_licenses VALUES('ea1','trial','+1 month','active','2099-01-01','2026-01-01',NULL);");
 db.exec(readFileSync(new URL('../site/migrations/0014_scalper_pro.sql',import.meta.url),'utf8'));
 db.exec(readFileSync(new URL('../site/migrations/20261111_telegram_stars.sql',import.meta.url),'utf8'));
 const DB={prepare(sql){
  const stmt=db.prepare(sql);
  return {bind(...params){
   const run=()=>({meta:{changes:Number(stmt.run(...params).changes)}});
   return {_run:run,run:async()=>run(),first:async()=>stmt.get(...params)||null,all:async()=>({results:stmt.all(...params)})};
  }};
 },async batch(statements){db.exec('BEGIN');try{const rows=statements.map(s=>s._run());db.exec('COMMIT');return rows}catch(e){db.exec('ROLLBACK');throw e}}};
 const env={DB,LICENSE_VAULT_KEY:'test-vault',SCALPER_LICENSE_SECRET:'test-signing-secret'};
 const calls=[];
 const h={api:async(e,method,body)=>{calls.push({method,body});return {message_id:100}},licenseRecord:async()=>({agent_id:'ea1',encrypted_code:'sealed',nonce:'iv',status:'active',plan:'quarterly'}),encryptCode:async()=>({cipher:'sealed-key',iv:'nonce'}),decryptCode:async()=>('test-activation-code'),uid:p=>p+'_'+crypto.randomUUID()};
 const user={id:'u1',telegram_id:'123',status:'active'};
 const order=(id='tso_'+('a'.repeat(32)),plan='quarterly',stars=2350)=>{db.prepare("INSERT INTO telegram_star_orders(id,user_id,telegram_id,plan,stars,account_login,status,terms_version,accepted_at) VALUES(?,'u1','123',?,?,'12345678','pending','2026-11-11',CURRENT_TIMESTAMP)").run(id,plan,stars);return id};
 const payment=(id,charge='charge-1')=>({chat:{id:123,type:'private'},from:{id:123},successful_payment:{invoice_payload:id,currency:'XTR',total_amount:2350,telegram_payment_charge_id:charge}});
 return {db,env,h,calls,user,order,payment};
}
test('shop fits widget limits, has no network and preserves private keys outside widget state',()=>{
 assert.ok(Buffer.byteLength(LICENSE_SHOP_WIDGET_HTML)<=32768);
 assert.ok(deflateSync(Buffer.from(LICENSE_SHOP_WIDGET_HTML),{level:9}).length<=4096);
 assert.doesNotMatch(LICENSE_SHOP_WIDGET_HTML,/fetch\s*\(|<input|<iframe|activation_code/);
 assert.match(LICENSE_SHOP_WIDGET_HTML,/sb:license/);
 assert.match(LICENSE_SHOP_WIDGET_HTML,/sb:buy:/);
});
test('prices are integers, allow server overrides, and fail closed on invalid configuration',()=>{
 assert.equal(starPrice({},'quarterly'),2350);
 assert.equal(starPrice({TELEGRAM_STAR_PRICES:'{"quarterly":4000}'},'quarterly'),4000);
 for(const v of ['null','[]','{bad','{"quarterly":-1}','{"quarterly":"2350"}'])assert.equal(starPrice({TELEGRAM_STAR_PRICES:v},'quarterly'),null);
 assert.equal(starPrice({},'constructor'),null);
 assert.equal(Object.keys(STAR_PLANS).length,4);
});
test('quotes require MT5 login for Scalper; acceptance sends just one invoice on repeated taps',async()=>{
 const f=fixture();
 await purchaseQuote(f.env,f.h,f.user,'scalper_1m');
 assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM telegram_star_orders').get().n,0);
 await purchaseQuote(f.env,f.h,f.user,'quarterly');
 const o=f.db.prepare('SELECT * FROM telegram_star_orders').get();
 assert.equal(o.status,'draft');
 const q={id:'cb',data:'tgpay:'+o.id,from:{id:123},message:{chat:{id:123,type:'private'}}};
 await acceptStarQuote({...q,from:{id:456}},f.env,f.h);
 assert.equal(f.calls.filter(c=>c.method==='sendInvoice').length,0);
 await acceptStarQuote(q,f.env,f.h);await acceptStarQuote(q,f.env,f.h);
 assert.equal(f.calls.filter(c=>c.method==='sendInvoice').length,1);
 const invoice=f.calls.find(c=>c.method==='sendInvoice').body;
 assert.equal(invoice.currency,'XTR');assert.equal(invoice.payload,o.id);
 assert.equal(f.db.prepare('SELECT status FROM telegram_star_orders').get().status,'pending');
});
test('precheckout rejects wrong owner, amount, currency, expired order or suspended user',async()=>{
 const f=fixture(),id=f.order(),base={id:'q',from:{id:123},invoice_payload:id,currency:'XTR',total_amount:2350};
 for(const q of [{...base,from:{id:999}},{...base,total_amount:1},{...base,currency:'USD'}]){
  await starPreCheckout(q,f.env,f.h);assert.equal(f.calls.at(-1).body.ok,false);
 }
 await starPreCheckout(base,f.env,f.h);assert.equal(f.calls.at(-1).body.ok,true);
 f.db.exec("UPDATE site_users SET status='suspended'");
 await starPreCheckout(base,f.env,f.h);assert.equal(f.calls.at(-1).body.ok,false);
 f.db.exec("UPDATE site_users SET status='active'; UPDATE telegram_star_orders SET created_at='2000-01-01'");
 await starPreCheckout(base,f.env,f.h);assert.equal(f.calls.at(-1).body.ok,false);
 assert.equal(matchesPayment(null,123,base),false);
});
test('payment grants exactly once and preserves the existing activation code',async()=>{
 const f=fixture(),id=f.order(),msg=f.payment(id);
 const bad=f.payment(id);bad.successful_payment.total_amount=1;
 await assert.rejects(starSuccessfulPayment(bad,f.env,f.h),/MISMATCH/);
 assert.equal(f.db.prepare('SELECT plan FROM ea_licenses').get().plan,'trial');
 await Promise.all([starSuccessfulPayment(msg,f.env,f.h),starSuccessfulPayment(msg,f.env,f.h)]);
 const license=f.db.prepare('SELECT * FROM ea_licenses').get();
 assert.equal(license.plan,'quarterly');assert.equal(license.expires_at,'2099-04-01 00:00:00');
 assert.equal(f.db.prepare('SELECT charge_id FROM telegram_star_orders').get().charge_id,'charge-1');
 assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM site_audit WHERE action='telegram_stars_paid'").get().n,1);
 assert.equal(f.calls.filter(c=>c.method==='sendMessage'&&c.body.text.includes('Payment received')).length,1);
 assert.ok(f.calls.some(c=>c.body.protect_content&&c.body.text?.includes('test-activation-code')));
 await assert.rejects(starSuccessfulPayment(f.payment(id,'different-charge'),f.env,f.h),/DUPLICATE_CHARGE/);
});
test('same charge on a second order rolls back the entitlement change',async()=>{
 const f=fixture(),id=f.order();await starSuccessfulPayment(f.payment(id),f.env,f.h);
 const second=f.order('tso_'+('b'.repeat(32)));
 await assert.rejects(starSuccessfulPayment(f.payment(second),f.env,f.h));
 assert.equal(f.db.prepare('SELECT expires_at FROM ea_licenses').get().expires_at,'2099-04-01 00:00:00');
 assert.equal(f.db.prepare('SELECT status FROM telegram_star_orders WHERE id=?').get(second).status,'pending');
});
test('Scalper purchase binds an encrypted key to the invoice MT5 account without changing Bridge',async()=>{
 const f=fixture(),id=f.order('tso_'+('c'.repeat(32)),'scalper_1m',950),msg=f.payment(id);
 msg.successful_payment.total_amount=950;
 await starSuccessfulPayment(msg,f.env,f.h);await starSuccessfulPayment(msg,f.env,f.h);
 const keys=f.db.prepare('SELECT * FROM scalper_keys').all();
 assert.equal(keys.length,1);assert.equal(keys[0].account_login,'12345678');assert.equal(keys[0].encrypted_key,'sealed-key');assert.equal(keys[0].days,30);
 assert.equal(f.db.prepare('SELECT plan FROM ea_licenses').get().plan,'trial');
});
test('failed chat delivery never loses paid entitlement and own code remains retrievable',async()=>{
 const f=fixture(),id=f.order(),real=f.h.api;
 f.h.api=async()=>{throw Error('network timeout')};
 await starSuccessfulPayment(f.payment(id),f.env,f.h);
 assert.equal(f.db.prepare('SELECT status,notified_at FROM telegram_star_orders').get().status,'paid');
 f.h.api=real;await sendPrivateLicenses(f.env,f.h,f.user);
 assert.ok(f.calls.some(c=>c.body.text?.includes('test-activation-code')));
});
