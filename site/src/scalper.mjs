// DrFX Scalper Pro licensing for the member portal.
// Keys match tools/keygen.py and DrFX_License.mqh in the Scalper Pro repo:
// payload <QHIBB (login u64, days u16, serial u32, plan u8, format=1) + first 9 bytes of
// HMAC-SHA256(SCALPER_LICENSE_SECRET, payload), base32 (no I O 0 1), "DRFX-" + 8 groups of 5.
export const SCALPER_PLANS=Object.freeze({
 scalper_1m:{usd:19,days:30,code:1,label:'Monthly'},
 scalper_3m:{usd:49,days:90,code:3,label:'3 Months'}
});
export const SCALPER_TRIAL_DAYS=7;
const B32='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const enc=new TextEncoder();

export function validLogin(value){
 const s=String(value??'').trim();
 if(!/^[1-9][0-9]{3,18}$/.test(s))return null;
 return BigInt(s)<=0x7fffffffffffffffn?s:null;
}
function b32(bytes){
 let out='',acc=0,bits=0;
 for(const x of bytes){acc=((acc<<8)|x)&0xffff;bits+=8;while(bits>=5){out+=B32[(acc>>(bits-5))&31];bits-=5}}
 if(bits)out+=B32[(acc<<(5-bits))&31];
 return out;
}
function unb32(s){
 const out=[];let acc=0,bits=0;
 for(const ch of s){const v=B32.indexOf(ch);if(v<0)return null;acc=((acc<<5)|v)&0xffff;bits+=5;if(bits>=8){out.push((acc>>(bits-8))&255);bits-=8}}
 return Uint8Array.from(out);
}
async function mac(secret,payload){
 const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return new Uint8Array(await crypto.subtle.sign('HMAC',key,payload));
}
function pack(login,days,serial,plan){
 const p=new Uint8Array(16),v=new DataView(p.buffer);
 v.setBigUint64(0,BigInt(login),true);v.setUint16(8,days,true);v.setUint32(10,serial>>>0,true);p[14]=plan&255;p[15]=1;
 return p;
}
export async function makeScalperKey(secret,login,days,serial,plan){
 if(!secret)throw Error('SCALPER_SECRET_MISSING');
 const p=pack(login,days,serial,plan),m=await mac(secret,p),all=new Uint8Array(25);
 all.set(p);all.set(m.slice(0,9),16);
 const raw=b32(all);
 return 'DRFX-'+raw.match(/.{5}/g).join('-');
}
export async function parseScalperKey(secret,key){
 let s=String(key||'').trim().toUpperCase();
 if(s.startsWith('DRFX-'))s=s.slice(5);
 s=s.replace(/[-\s]/g,'');
 if(s.length!==40)return null;
 const b=unb32(s);if(!b||b.length!==25)return null;
 const p=b.slice(0,16),m=await mac(secret,p);
 let diff=0;for(let i=0;i<9;i++)diff|=m[i]^b[16+i];
 if(diff||p[15]!==1)return null;
 const v=new DataView(p.buffer);
 return {account_login:v.getBigUint64(0,true).toString(),days:v.getUint16(8,true),serial:v.getUint32(10,true),plan:p[14]};
}
function randomSerial(){const a=new Uint32Array(1);do crypto.getRandomValues(a);while(a[0]===0);return a[0]}

// Issue and store a key. statements=true returns D1 statements for a caller-controlled batch.
export async function issueScalperKey(env,h,{userId,login,plan,orderId=null,issuedBy=null,days=null}){
 const p=SCALPER_PLANS[plan];
 const d=days||p?.days;if(!d)throw Error('INVALID_PLAN');
 const serial=randomSerial();
 const key=await makeScalperKey(env.SCALPER_LICENSE_SECRET,login,d,serial,p?p.code:0);
 const sealed=await h.encryptCode(env,key);
 return {key,serial,days:d,id:h.uid('skey'),sealed};
}

export async function scalperOverview(env,h,user){
 const rows=(await env.DB.prepare('SELECT id,account_login,plan,days,encrypted_key,nonce,created_at FROM scalper_keys WHERE user_id=? ORDER BY created_at DESC LIMIT 50').bind(user.id).all()).results||[];
 const keys=[];
 for(const r of rows)keys.push({id:r.id,account_login:r.account_login,plan:r.plan,days:r.days,created_at:r.created_at,key:await h.decryptCode(env,r.encrypted_key,r.nonce)});
 const orders=(await env.DB.prepare('SELECT id,plan,amount_usd,account_login,status,invoice_url,created_at,paid_at FROM scalper_orders WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(user.id).all()).results||[];
 return {ok:true,configured:!!env.SCALPER_LICENSE_SECRET,payments:!!(env.NOWPAYMENTS_API_KEY&&env.NOWPAYMENTS_IPN_SECRET),
  trial_days:SCALPER_TRIAL_DAYS,download_url:env.SCALPER_DOWNLOAD_URL||'https://drfx.company/downloads/DrFX_Scalper_Pro.ex5',
  plans:Object.entries(SCALPER_PLANS).map(([id,p])=>({id,usd:p.usd,days:p.days,label:p.label})),keys,orders};
}

export async function scalperCheckout(req,env,h,user){
 if(!env.SCALPER_LICENSE_SECRET)return h.fail('SCALPER_LICENSING_NOT_CONFIGURED',503);
 if(!env.NOWPAYMENTS_API_KEY||!env.NOWPAYMENTS_IPN_SECRET)return h.fail('PAYMENTS_NOT_CONFIGURED',503);
 if(!await h.limited(req,env,'scalper:checkout',8))return h.fail('RATE_LIMITED',429);
 const b=await h.readBody(req),plan=String(b.plan||''),login=validLogin(b.account_login);
 if(!Object.hasOwn(SCALPER_PLANS,plan))return h.fail('INVALID_PLAN');
 if(!login)return h.fail('INVALID_MT5_ACCOUNT');
 const id=h.uid('sco'),usd=SCALPER_PLANS[plan].usd;
 await env.DB.prepare("INSERT INTO scalper_orders (id,user_id,plan,amount_usd,account_login,status) VALUES (?,?,?,?,?,'pending')").bind(id,user.id,plan,usd,login).run();
 const response=await fetch('https://api.nowpayments.io/v1/invoice',{method:'POST',headers:{'x-api-key':env.NOWPAYMENTS_API_KEY,'content-type':'application/json'},body:JSON.stringify({
  price_amount:usd,price_currency:'usd',order_id:id,order_description:'DrFX Scalper Pro '+SCALPER_PLANS[plan].label+' · MT5 #'+login,
  ipn_callback_url:h.origin+'/api/payments/ipn',success_url:h.origin+'/?paid=processing#scalper',cancel_url:h.origin+'/?paid=cancelled#scalper'
 })});
 if(!response.ok){await env.DB.prepare("UPDATE scalper_orders SET status='failed' WHERE id=?").bind(id).run();return h.fail('PAYMENT_GATEWAY_UNAVAILABLE',502);}
 const data=await response.json().catch(()=>null);
 let url;try{url=new URL(data?.invoice_url||'');if(url.protocol!=='https:'||!(url.hostname==='nowpayments.io'||url.hostname.endsWith('.nowpayments.io')))throw Error('bad');}
 catch{await env.DB.prepare("UPDATE scalper_orders SET status='failed' WHERE id=?").bind(id).run();return h.fail('INVALID_GATEWAY_RESPONSE',502);}
 await env.DB.prepare('UPDATE scalper_orders SET invoice_id=?,invoice_url=? WHERE id=?').bind(String(data.id||''),url.href,id).run();
 await h.audit(env,user.id,'scalper_checkout',user.id,plan+' '+login);
 return h.json({ok:true,invoice_url:url.href,order_id:id});
}

// Called by the verified NOWPayments IPN handler for "sco_" orders.
export async function scalperPaid(env,h,body){
 const orderId=String(body.order_id||''),paymentId=String(body.payment_id||'');
 const order=await env.DB.prepare('SELECT * FROM scalper_orders WHERE id=?').bind(orderId).first();
 if(!order||order.status==='failed')return h.fail('ORDER_NOT_FOUND',404);
 if(order.status==='paid')return h.json({ok:true,duplicate:true});
 if(String(body.price_currency||'').toLowerCase()!=='usd'||Number(body.price_amount)!==Number(order.amount_usd)||!paymentId)return h.fail('PAYMENT_DETAILS_MISMATCH',409);
 if(!env.SCALPER_LICENSE_SECRET)return h.fail('SCALPER_LICENSING_NOT_CONFIGURED',503);   // provider retries the IPN
 const k=await issueScalperKey(env,h,{userId:order.user_id,login:order.account_login,plan:order.plan,orderId});
 const results=await env.DB.batch([
  env.DB.prepare("INSERT INTO scalper_keys (id,user_id,order_id,account_login,plan,days,serial,encrypted_key,nonce,issued_by) "+
   "SELECT ?,?,?,?,?,?,?,?,?,'nowpayments' WHERE EXISTS(SELECT 1 FROM scalper_orders WHERE id=? AND status='pending')")
   .bind(k.id,order.user_id,orderId,order.account_login,order.plan,k.days,k.serial,k.sealed.cipher,k.sealed.iv,orderId),
  env.DB.prepare("INSERT INTO site_audit (id,actor_id,action,subject_id,detail) SELECT ?,NULL,'scalper_paid',?,? WHERE EXISTS(SELECT 1 FROM scalper_orders WHERE id=? AND status='pending')")
   .bind(h.uid('aud'),order.user_id,orderId,orderId),
  env.DB.prepare("UPDATE scalper_orders SET status='paid',payment_id=?,paid_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(paymentId,orderId)
 ]);
 const granted=results[2]?.meta?.changes===1;
 if(granted&&h.notify)await h.notify(order.user_id,k.key,order.account_login,k.days).catch(()=>{});
 return granted?h.json({ok:true,granted:true}):h.json({ok:true,duplicate:true});
}

// Admin: issue a key without payment (manual sale, support, giveaway).
export async function scalperGrant(env,h,{adminId,userId,login,plan}){
 if(!env.SCALPER_LICENSE_SECRET)throw Error('SCALPER_LICENSING_NOT_CONFIGURED');
 const valid=validLogin(login);if(!valid)throw Error('INVALID_MT5_ACCOUNT');
 if(!Object.hasOwn(SCALPER_PLANS,plan))throw Error('INVALID_PLAN');
 const k=await issueScalperKey(env,h,{userId,login:valid,plan});
 await env.DB.prepare("INSERT INTO scalper_keys (id,user_id,account_login,plan,days,serial,encrypted_key,nonce,issued_by) VALUES (?,?,?,?,?,?,?,?,?)")
  .bind(k.id,userId,valid,plan,k.days,k.serial,k.sealed.cipher,k.sealed.iv,adminId).run();
 await h.audit(env,adminId,'scalper_grant',userId,plan+' '+valid);
 return {key:k.key,days:k.days,account_login:valid};
}
