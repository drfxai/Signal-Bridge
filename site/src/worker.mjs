import { SITE_HTML, SITE_CSS, SITE_JS } from './ui.mjs';

const HEAD={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY','permissions-policy':'camera=(),microphone=(),geolocation=()'};
const PRICES={quarterly:47,annual:165};
const DURATION={trial:'+1 month',quarterly:'+3 months',annual:'+1 year'};
const ADMIN_ACTIONS=new Set(['suspend','resume','grant_trial','grant_quarterly','grant_annual','revoke_license']);
const API_ORIGIN='https://drfx.company';
const encoder=new TextEncoder();
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...HEAD,'content-type':'application/json; charset=utf-8',...extra}});
const fail=(code,status=400)=>json({ok:false,error:code},status);
const asset=(body,type)=>new Response(body,{headers:{...HEAD,'content-type':type,'cache-control':'public,max-age=3600','content-security-policy':"default-src 'none'; style-src 'self'; script-src 'self'"}});
const uid=prefix=>prefix+'_'+crypto.randomUUID().replaceAll('-','');
const rand=(size=32)=>{const a=new Uint8Array(size);crypto.getRandomValues(a);return a;};
const b64=a=>btoa(String.fromCharCode(...a));
const b64u=a=>b64(a).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const sha=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
const emailValid=e=>/^[^\s@<>]{1,64}@[^\s@<>]{1,190}$/.test(e);
const safeText=(v,max=120)=>String(v??'').replace(/[\x00-\x1f<>]/g,' ').trim().slice(0,max);
const safeEq=(a,b)=>{a=encoder.encode(String(a));b=encoder.encode(String(b));let diff=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)diff|=(a[i]||0)^(b[i]||0);return diff===0};
const nowMs=()=>Date.now();
const isoIn=minutes=>new Date(Date.now()+minutes*60000).toISOString().slice(0,19).replace('T',' ');
const errorIsMissingKey=env=>!env?.LICENSE_VAULT_KEY;
async function readBody(req,max=4096){
 const length=Number(req.headers.get('content-length')||0);if(length>max)throw Error('BODY_TOO_LARGE');
 const value=await req.text();if(value.length>max)throw Error('BODY_TOO_LARGE');
 try{const result=JSON.parse(value);if(!result||typeof result!=='object'||Array.isArray(result))throw Error('BAD_JSON');return result;}catch(e){throw Error('BAD_JSON')}
}
function originSafe(req){const origin=req.headers.get('origin');return !origin||origin===API_ORIGIN}
async function limited(req,env,scope,max=10){
 const ip=req.headers.get('cf-connecting-ip')||'unknown';
 const bucket=Math.floor(Date.now()/600000);
 const key=await sha(scope+'|'+ip+'|'+bucket);
 const expires=isoIn(11);
 await env.DB.prepare("INSERT INTO site_rate_limits (id,requests,expires_at) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET requests=requests+1").bind(key,expires).run();
 const row=await env.DB.prepare('SELECT requests FROM site_rate_limits WHERE id=?').bind(key).first();
 return Number(row?.requests||0)<=max;
}
async function vaultKey(env){
 if(!env.LICENSE_VAULT_KEY)throw Error('LICENSE_VAULT_NOT_CONFIGURED');
 const bytes=Uint8Array.from(atob(env.LICENSE_VAULT_KEY),c=>c.charCodeAt(0));
 if(bytes.length!==32)throw Error('LICENSE_VAULT_BAD_LENGTH');
 return crypto.subtle.importKey('raw',bytes,'AES-GCM',false,['encrypt','decrypt']);
}
async function encryptCode(env,code){
 const iv=rand(12),key=await vaultKey(env);
 const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(code)));
 return {cipher:b64(encrypted),iv:b64(iv)};
}
async function decryptCode(env,cipher,nonce){
 const key=await vaultKey(env);
 const bytes=Uint8Array.from(atob(cipher),c=>c.charCodeAt(0));
 const iv=Uint8Array.from(atob(nonce),c=>c.charCodeAt(0));
 return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv},key,bytes));
}
function getCookie(req,name){
 const cookie=req.headers.get('cookie')||'';
 const match=cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='));
 return match?match.slice(name.length+1):null;
}
const SESSION='__Host-drfx_session';
const cookie=value=>SESSION+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=604800';
const cookieClear=()=>SESSION+'=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0';
async function authUser(req,env){
 const token=getCookie(req,SESSION);
 if(!token||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;
 return env.DB.prepare(
 "SELECT u.id,u.email,u.telegram_id,u.telegram_name,u.role,u.plan,u.status,u.created_at,s.token_hash " +
 "FROM site_sessions s JOIN site_users u ON u.id=s.user_id " +
 "WHERE s.token_hash=? AND s.expires_at>CURRENT_TIMESTAMP AND u.status='active' LIMIT 1"
 ).bind(await sha(token)).first();
}
async function login(env,userId){
 const token=b64u(rand()),hash=await sha(token);
 await env.DB.prepare("INSERT INTO site_sessions (token_hash,user_id,expires_at) VALUES (?,?,datetime('now','+7 days'))").bind(hash,userId).run();
 return cookie(token);
}
async function audit(env,actor,action,subject,detail=''){
 await env.DB.prepare('INSERT INTO site_audit (id,actor_id,action,subject_id,detail) VALUES (?,?,?,?,?)').bind(uid('aud'),actor,action,subject,safeText(detail,240)).run();
}
async function licenseRecord(env,user){
 const row=await env.DB.prepare(
 "SELECT sl.encrypted_code,sl.nonce,sl.agent_id,el.plan,el.status,el.account_login,el.account_server,el.expires_at,el.activated_at " +
 "FROM site_licenses sl JOIN ea_licenses el ON el.id=sl.license_id WHERE sl.user_id=?"
 ).bind(user.id).first();
 if(row)return row;
 const code=b64u(rand(32)),authKey=b64u(rand(32)),encrypted=await encryptCode(env,code);
 const agentId=uid('ea'),licenseId=uid('lic'),hash=await sha(code);
 // D1 batch is transactional. Never expose a code if D1 did not confirm inserts.
 await env.DB.batch([
  env.DB.prepare("INSERT INTO agent_connections (id,tenant_id,label,token_sha256,status) VALUES (?,?,?,?, 'active')").bind(agentId,user.id,'DrFX Company EA',await sha(authKey)),
  env.DB.prepare("INSERT INTO ea_licenses (id,agent_id,token_sha256,plan,duration_modifier,status) VALUES (?,?,?,?,?,'active')").bind(licenseId,agentId,hash,'trial',DURATION.trial),
  env.DB.prepare("INSERT INTO site_licenses (user_id,agent_id,license_id,encrypted_code,nonce) VALUES (?,?,?,?,?)").bind(user.id,agentId,licenseId,encrypted.cipher,encrypted.iv)
 ]);
 return {encrypted_code:encrypted.cipher,nonce:encrypted.iv,agent_id:agentId,plan:'trial',status:'active',account_login:null,account_server:null,expires_at:null,activated_at:null};
}
async function profile(env,user){
 const row=await licenseRecord(env,user);
 return {id:user.id,email:user.email||null,telegram:user.telegram_name||user.telegram_id||null,role:user.role,plan:user.plan,
  account_status:user.status,license_status:row.status,activated_at:row.activated_at,expires_at:row.expires_at,
  mt5_account:row.account_login?{login:row.account_login,server:row.account_server}:null,
  activation_code:await decryptCode(env,row.encrypted_code,row.nonce),
  pricing:{quarterly:47,annual:165},indicator_delivery_ready:false,ex5_download_ready:false};
}
async function getOrCreateEmail(env,email){
 let user=await env.DB.prepare('SELECT * FROM site_users WHERE email=?').bind(email).first();
 if(user)return user;
 const id=uid('usr'),role=env.ADMIN_EMAIL&&email===env.ADMIN_EMAIL.trim().toLowerCase()?'admin':'user';
 await env.DB.prepare("INSERT INTO site_users (id,email,role) VALUES (?,?,?)").bind(id,email,role).run();
 user=await env.DB.prepare('SELECT * FROM site_users WHERE id=?').bind(id).first();
 return user;
}
async function getOrCreateTelegram(env,id,username){
 let user=await env.DB.prepare('SELECT * FROM site_users WHERE telegram_id=?').bind(id).first();
 if(user)return user;
 const userId=uid('usr'),role=env.ADMIN_TELEGRAM_ID&&safeEq(id,env.ADMIN_TELEGRAM_ID)?'admin':'user';
 await env.DB.prepare("INSERT INTO site_users (id,telegram_id,telegram_name,role) VALUES (?,?,?,?)").bind(userId,id,safeText(username,80),role).run();
 user=await env.DB.prepare('SELECT * FROM site_users WHERE id=?').bind(userId).first();
 return user;
}
async function issueCode(env,purpose,target,userId=null,minutes=10){
 const code=b64u(rand(12));
 const digest=await sha(code);
 await env.DB.prepare('INSERT INTO site_login_codes (code_hash,purpose,target,user_id,expires_at) VALUES (?,?,?,?,?)')
  .bind(digest,purpose,target,userId,isoIn(minutes)).run();
 return code;
}
async function consumeCode(env,purpose,target,code){
 if(!/^[A-Za-z0-9_-]{8,64}$/.test(String(code||'')))return null;
 const hash=await sha(code);
 const row=await env.DB.prepare(
 "SELECT code_hash,user_id FROM site_login_codes WHERE code_hash=? AND purpose=? AND target=? AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP"
 ).bind(hash,purpose,target).first();
 if(!row)return null;
 const applied=await env.DB.prepare('UPDATE site_login_codes SET used_at=CURRENT_TIMESTAMP WHERE code_hash=? AND used_at IS NULL').bind(hash).run();
 return applied.meta?.changes===1?row:null;
}
async function emailStart(req,env){
 if(!env.MAIL_FROM||(!env.RESEND_API_KEY&&!env.EMAIL))return fail('EMAIL_NOT_CONFIGURED',503);
 if(!await limited(req,env,'email:start',6))return fail('RATE_LIMITED',429);
 const body=await readBody(req),email=String(body.email||'').trim().toLowerCase();
 if(!emailValid(email))return fail('INVALID_EMAIL');
 if(!await limited(req,env,'email:'+email,8))return fail('RATE_LIMITED',429);
 const code=await issueCode(env,'email',email,null);
 if(env.EMAIL){
  try{await env.EMAIL.send({from:env.MAIL_FROM,to:email,subject:'DrFX Company · Your sign-in code',text:'Your DrFX sign-in code: '+code+'\nValid for 10 minutes. Ignore if you did not request it.'});}
  catch{return fail('EMAIL_DELIVERY_FAILED',502);}
 }else{
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{'Authorization':'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({
   from:env.MAIL_FROM,to:[email],subject:'DrFX Company · Your sign-in code',text:'Your DrFX sign-in code is: '+code+'\nValid for 10 minutes. If you did not request this, ignore it.'
  })});
  if(!response.ok)return fail('EMAIL_DELIVERY_FAILED',502);
 }
 return json({ok:true,message:'CHECK_EMAIL'});
}
async function emailVerify(req,env){
 if(!await limited(req,env,'email:verify',15))return fail('RATE_LIMITED',429);
 const body=await readBody(req),email=String(body.email||'').trim().toLowerCase();
 const challenge=await consumeCode(env,'email',email,String(body.code||'').trim());
 if(!challenge)return fail('INVALID_OR_EXPIRED_CODE',401);
 const user=await getOrCreateEmail(env,email);
 if(user.status!=='active')return fail('ACCOUNT_SUSPENDED',403);
 try{await licenseRecord(env,user);}catch{ return fail('LICENSING_NOT_READY',503); }
 return json({ok:true,user:{id:user.id,role:user.role}},200,{'set-cookie':await login(env,user.id)});
}
async function loginFromTelegram(req,env){
 if(!await limited(req,env,'telegram:web-login',15))return fail('RATE_LIMITED',429);
 const body=await readBody(req),code=String(body.code||'').trim();
 if(!/^[A-Za-z0-9_-]{8,64}$/.test(code))return fail('INVALID_CODE',401);
 const digest=await sha(code);
 const row=await env.DB.prepare("SELECT user_id,target FROM site_login_codes WHERE code_hash=? AND purpose='telegram' AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP").bind(digest).first();
 if(!row)return fail('INVALID_OR_EXPIRED_CODE',401);
 const consumed=await consumeCode(env,'telegram',row.target,code);if(!consumed)return fail('CODE_ALREADY_USED',401);
 const user=await env.DB.prepare("SELECT * FROM site_users WHERE id=? AND status='active'").bind(row.user_id).first();
 if(!user)return fail('ACCOUNT_UNAVAILABLE',403);
 try{await licenseRecord(env,user);}catch{return fail('LICENSING_NOT_READY',503);}
 return json({ok:true},200,{'set-cookie':await login(env,user.id)});
}
async function rotateLicense(env,user,adminId=null){
 const old=await licenseRecord(env,user),code=b64u(rand(32)),encrypted=await encryptCode(env,code),hash=await sha(code);
 await env.DB.batch([
  env.DB.prepare("UPDATE ea_licenses SET token_sha256=?,updated_at=CURRENT_TIMESTAMP WHERE agent_id=?").bind(hash,old.agent_id),
  env.DB.prepare("UPDATE site_licenses SET encrypted_code=?,nonce=? WHERE user_id=?").bind(encrypted.cipher,encrypted.iv,user.id)
 ]);
 await audit(env,adminId||user.id,'rotate_ea_code',user.id,'previous serial invalidated');
 return code;
}
async function applyPlan(env,userId,plan,actorId){
 const license=await env.DB.prepare('SELECT agent_id FROM site_licenses WHERE user_id=?').bind(userId).first();
 if(!license)return false;
 const duration=DURATION[plan];if(!duration)return false;
 await env.DB.batch([
  env.DB.prepare("UPDATE ea_licenses SET plan=?,duration_modifier=?,status='active'," +
   "expires_at=CASE WHEN activated_at IS NULL THEN NULL ELSE datetime(CASE WHEN expires_at>CURRENT_TIMESTAMP THEN expires_at ELSE CURRENT_TIMESTAMP END, ?) END,"+
   "updated_at=CURRENT_TIMESTAMP WHERE agent_id=?").bind(plan,duration,duration,license.agent_id),
  env.DB.prepare("UPDATE site_users SET plan=?,status='active',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(plan,userId),
  env.DB.prepare('INSERT INTO site_audit (id,actor_id,action,subject_id,detail) VALUES (?,?,?,?,?)').bind(uid('aud'),actorId,'grant_plan',userId,plan)
 ]);
 return true;
}
async function adminUpdate(req,env,admin){
 const b=await readBody(req);if(!ADMIN_ACTIONS.has(b.action)||!/^usr_[0-9a-f]{32}$/.test(b.user_id||''))return fail('INVALID_ACTION');
 const user=await env.DB.prepare('SELECT * FROM site_users WHERE id=?').bind(b.user_id).first();
 if(!user)return fail('NOT_FOUND',404);
 if(user.id===admin.id && (b.action==='suspend'||b.action==='revoke_license'))return fail('SELF_LOCKOUT_REFUSED',409);
 if(b.action.startsWith('grant_')){await licenseRecord(env,user);await applyPlan(env,user.id,b.action.slice(6),admin.id);}
 else if(b.action==='suspend'||b.action==='resume'){
  const status=b.action==='suspend'?'suspended':'active';
  await env.DB.batch([
   env.DB.prepare('UPDATE site_users SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(status,user.id),
   env.DB.prepare("UPDATE ea_licenses SET status=?,updated_at=CURRENT_TIMESTAMP WHERE agent_id=(SELECT agent_id FROM site_licenses WHERE user_id=?)").bind(b.action==='suspend'?'revoked':'active',user.id)
  ]);await audit(env,admin.id,b.action,user.id);
 }else if(b.action==='revoke_license'){
  await env.DB.prepare("UPDATE ea_licenses SET status='revoked',updated_at=CURRENT_TIMESTAMP WHERE agent_id=(SELECT agent_id FROM site_licenses WHERE user_id=?)").bind(user.id).run();
  await audit(env,admin.id,b.action,user.id);
 }
 return json({ok:true});
}
async function createCheckout(req,env,user){
 if(!env.NOWPAYMENTS_API_KEY||!env.NOWPAYMENTS_IPN_SECRET)return fail('PAYMENTS_NOT_CONFIGURED',503);
 if(!await limited(req,env,'checkout',8))return fail('RATE_LIMITED',429);
 const b=await readBody(req),plan=String(b.plan||'');
 if(!Object.hasOwn(PRICES,plan))return fail('INVALID_PLAN');
 const id=uid('ord'),usd=PRICES[plan];
 await env.DB.prepare("INSERT INTO site_orders (id,user_id,plan,amount_usd,status) VALUES (?,?,?,?,'pending')").bind(id,user.id,plan,usd).run();
 const response=await fetch('https://api.nowpayments.io/v1/invoice',{method:'POST',headers:{'x-api-key':env.NOWPAYMENTS_API_KEY,'content-type':'application/json'},body:JSON.stringify({
  price_amount:usd,price_currency:'usd',order_id:id,order_description:'DrFX Company '+plan+' membership',
  ipn_callback_url:API_ORIGIN+'/api/payments/ipn',success_url:API_ORIGIN+'/?paid=processing',cancel_url:API_ORIGIN+'/?paid=cancelled'
 })});
 if(!response.ok){await env.DB.prepare("UPDATE site_orders SET status='failed' WHERE id=?").bind(id).run();return fail('PAYMENT_GATEWAY_UNAVAILABLE',502);}
 const data=await response.json().catch(()=>null);
 let url;try{url=new URL(data?.invoice_url||'');if(url.protocol!=='https:'||!url.hostname.endsWith('nowpayments.io'))throw Error('bad');}
 catch{await env.DB.prepare("UPDATE site_orders SET status='failed' WHERE id=?").bind(id).run();return fail('INVALID_GATEWAY_RESPONSE',502);}
 await env.DB.prepare('UPDATE site_orders SET invoice_id=?,invoice_url=? WHERE id=?').bind(String(data.id||''),url.href,id).run();
 return json({ok:true,invoice_url:url.href,order_id:id});
}
function deepSort(value){
 if(Array.isArray(value))return value.map(deepSort);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,deepSort(value[k])]));
 return value;
}
async function ipnHandler(req,env){
 if(!env.NOWPAYMENTS_IPN_SECRET)return fail('PAYMENTS_NOT_CONFIGURED',503);
 const signature=req.headers.get('x-nowpayments-sig')||'';
 if(!/^[a-f0-9]{128}$/i.test(signature))return fail('INVALID_SIGNATURE',401);
 const body=await readBody(req,8192);
 const key=await crypto.subtle.importKey('raw',encoder.encode(env.NOWPAYMENTS_IPN_SECRET),{name:'HMAC',hash:'SHA-512'},false,['sign']);
 const signatureHex=Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(JSON.stringify(deepSort(body))))),b=>b.toString(16).padStart(2,'0')).join('');
 if(!safeEq(signature.toLowerCase(),signatureHex))return fail('INVALID_SIGNATURE',401);
 if(body.payment_status!=='finished')return json({ok:true,ignored:'NOT_FINAL'});
 const orderId=String(body.order_id||''),paymentId=String(body.payment_id||'');
 const order=await env.DB.prepare('SELECT * FROM site_orders WHERE id=?').bind(orderId).first();
 if(!order||order.status==='failed')return fail('ORDER_NOT_FOUND',404);
 if(order.status==='paid')return json({ok:true,duplicate:true});
 if(String(body.price_currency||'').toLowerCase()!=='usd'||Number(body.price_amount)!==Number(order.amount_usd)||!paymentId)return fail('PAYMENT_DETAILS_MISMATCH',409);
 const lic=await env.DB.prepare('SELECT agent_id FROM site_licenses WHERE user_id=?').bind(order.user_id).first();
 if(!lic)return fail('LICENSE_MISSING',503);
 // A single transaction grants once, never on invoice creation, mere redirect, or partially_paid.
 const claimed=await env.DB.prepare("UPDATE site_orders SET status='paid',payment_id=?,paid_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(paymentId,orderId).run();
 if(claimed.meta?.changes!==1)return json({ok:true,duplicate:true});
 const results=await env.DB.batch([
  env.DB.prepare("UPDATE ea_licenses SET plan=?,duration_modifier=?,status='active',"+
   "expires_at=CASE WHEN activated_at IS NULL THEN NULL ELSE datetime(CASE WHEN expires_at>CURRENT_TIMESTAMP THEN expires_at ELSE CURRENT_TIMESTAMP END, ?) END,updated_at=CURRENT_TIMESTAMP WHERE agent_id=?").bind(order.plan,DURATION[order.plan],DURATION[order.plan],lic.agent_id),
  env.DB.prepare("UPDATE site_users SET plan=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(order.plan,order.user_id),
  env.DB.prepare('INSERT INTO site_audit (id,actor_id,action,subject_id,detail) VALUES (?,?,?,?,?)').bind(uid('aud'),null,'nowpayments_paid',order.user_id,orderId)
 ]);
 return json({ok:true,granted:results[0]?.meta?.changes===1});
}
async function botSend(env,chatId,text,keyboard){
 if(!env.TELEGRAM_BOT_TOKEN)return;
 const body={chat_id:chatId,text,parse_mode:'HTML',disable_web_page_preview:true};
 if(keyboard)body.reply_markup={inline_keyboard:[[ {text:'Open DrFX Dashboard',url:API_ORIGIN} ]]};
 await fetch('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/sendMessage',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)
 });
}
async function telegramWebhook(req,env){
 if(!env.TELEGRAM_BOT_TOKEN||!env.TELEGRAM_WEBHOOK_SECRET)return fail('BOT_NOT_CONFIGURED',503);
 const secret=req.headers.get('x-telegram-bot-api-secret-token')||'';
 if(!safeEq(secret,env.TELEGRAM_WEBHOOK_SECRET))return fail('UNAUTHORIZED',401);
 const data=await readBody(req,16384),msg=data.message;
 if(!msg||msg.chat?.type!=='private'||!msg.from?.id)return json({ok:true,ignored:'NO_PRIVATE_MESSAGE'});
 const telegramId=String(msg.from.id),chatId=String(msg.chat.id),username=msg.from.username||msg.from.first_name||'Trader';
 const text=safeText(msg.text||'',220);
 const command=text.split(' ')[0].split('@')[0];
 if(!['/start','/login','/me','/code','/link','/admin','/grant'].includes(command))return json({ok:true,ignored:'UNKNOWN_COMMAND'});
 let user=await env.DB.prepare('SELECT * FROM site_users WHERE telegram_id=?').bind(telegramId).first();
 if(command!=='/link'&&!user)user=await getOrCreateTelegram(env,telegramId,username);
 if(user&&user.status!=='active'){await botSend(env,chatId,'Your account is suspended. Contact support.');return json({ok:true});}
 if(command==='/start'){
  try{await licenseRecord(env,user);}
  catch{await botSend(env,chatId,'Account created. Licensing is being configured; try /code later.');return json({ok:true});}
  await botSend(env,chatId,'⚡ <b>Welcome to DrFX Company</b>\nYour unified website account is ready.\nUse /login to get a one-time web sign-in code.\nUse /code for your EA activation serial.',true);
 }else if(command==='/login'){
  if(!await limited(req,env,'bot:code:'+telegramId,200)){await botSend(env,chatId,'Try again later.');return json({ok:true});}
  const code=await issueCode(env,'telegram',telegramId,user.id,10);
  await botSend(env,chatId,'🔐 Your web login code (valid 10 minutes, one-time):\n<code>'+code+'</code>\nEnter at '+API_ORIGIN);
 }else if(command==='/code'){
  try{const record=await licenseRecord(env,user);const code=await decryptCode(env,record.encrypted_code,record.nonce);
    await botSend(env,chatId,'🔑 <b>Your private EA activation code</b>\n<code>'+code+'</code>\nDo not share it.');}
  catch{await botSend(env,chatId,'Licensing service is not configured.');}
 }else if(command==='/me'){
  const rec=await licenseRecord(env,user);
  await botSend(env,chatId,'👤 Your account\nPlan: '+user.plan+'\nEA: '+rec.status+'\nExpires: '+(rec.expires_at||'Starts on first EA activation')+'\nDashboard: '+API_ORIGIN,true);
 }else if(command==='/link'){
  const code=text.split(/\s+/)[1]||'';
  if(!/^[A-Za-z0-9_-]{8,64}$/.test(code)){await botSend(env,chatId,'Usage: /link CODE');return json({ok:true});}
  const digest=await sha(code);
  const entry=await env.DB.prepare("SELECT user_id FROM site_login_codes WHERE code_hash=? AND purpose='link' AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP").bind(digest).first();
  if(!entry){await botSend(env,chatId,'Invalid or expired linking code.');return json({ok:true});}
  const target=await env.DB.prepare("SELECT * FROM site_users WHERE id=? AND status='active'").bind(entry.user_id).first();
  if(!target?.email||target.telegram_id){await botSend(env,chatId,'This website account cannot be linked.');return json({ok:true});}
  if(user.id===target.id){await botSend(env,chatId,'Already linked.');return json({ok:true});}
  const secondary=await env.DB.prepare("SELECT sl.agent_id,el.activated_at FROM site_licenses sl JOIN ea_licenses el ON el.id=sl.license_id WHERE sl.user_id=?").bind(user.id).first();
  const activity=await env.DB.prepare("SELECT id FROM site_orders WHERE user_id=? AND status='paid' LIMIT 1").bind(user.id).first();
  if(user.plan!=='trial'||secondary?.activated_at||activity){
   await botSend(env,chatId,'Your Telegram account has used or paid membership. Contact support for a verified account merge.');return json({ok:true});
  }
  try{
   const statements=[
    env.DB.prepare("UPDATE site_login_codes SET used_at=CURRENT_TIMESTAMP WHERE code_hash=? AND used_at IS NULL").bind(digest),
    env.DB.prepare("DELETE FROM site_sessions WHERE user_id=?").bind(user.id),
    env.DB.prepare("DELETE FROM site_login_codes WHERE user_id=? AND code_hash<>?").bind(user.id,digest),
    env.DB.prepare("DELETE FROM site_licenses WHERE user_id=?").bind(user.id),
    env.DB.prepare("DELETE FROM ea_licenses WHERE agent_id=? AND activated_at IS NULL").bind(secondary?.agent_id||'none'),
    env.DB.prepare("DELETE FROM agent_connections WHERE id=?").bind(secondary?.agent_id||'none'),
    env.DB.prepare("DELETE FROM site_orders WHERE user_id=? AND status<>'paid'").bind(user.id),
    env.DB.prepare("DELETE FROM site_users WHERE id=? AND telegram_id=? AND plan='trial'").bind(user.id,telegramId),
    env.DB.prepare("UPDATE site_users SET telegram_id=?,telegram_name=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND telegram_id IS NULL").bind(telegramId,safeText(username,80),target.id)
   ];
   const results=await env.DB.batch(statements);
   if(results[0]?.meta?.changes!==1||results[7]?.meta?.changes!==1||results[8]?.meta?.changes!==1)throw Error('LINK_CONFLICT');
   await audit(env,user.id,'link_telegram_account',target.id);
   await botSend(env,chatId,'✅ Telegram linked to your existing verified email account. Use /login to open it on the website.');
  }catch{await botSend(env,chatId,'Could not link accounts. Request a fresh code.');}
 }else if(command==='/admin'&&user.role==='admin'){
  const stats=await env.DB.prepare('SELECT COUNT(*) AS total,SUM(CASE WHEN plan="quarterly" THEN 1 ELSE 0 END) AS quarter,SUM(CASE WHEN plan="annual" THEN 1 ELSE 0 END) AS annual FROM site_users').first();
  await botSend(env,chatId,'DrFX Admin\nUsers: '+stats.total+'\nQuarterly: '+stats.quarter+'\nAnnual: '+stats.annual+'\nFull management: '+API_ORIGIN);
 }else if(command==='/grant'&&user.role==='admin'){
  const args=text.split(/\s+/),target=args[1],plan=args[2];
  if(!/^usr_[0-9a-f]{32}$/.test(target||'')||!['trial','quarterly','annual'].includes(plan)){
   await botSend(env,chatId,'Use: /grant usr_... trial|quarterly|annual');return json({ok:true});
  }
  const recipient=await env.DB.prepare('SELECT * FROM site_users WHERE id=?').bind(target).first();
  if(!recipient){await botSend(env,chatId,'User not found.');return json({ok:true});}
  await licenseRecord(env,recipient);await applyPlan(env,target,plan,user.id);
  await botSend(env,chatId,'✅ Plan updated for '+target);
 }
 return json({ok:true});
}
async function api(req,env){
 const u=new URL(req.url),path=u.pathname;
 if(path==='/api/telegram/webhook'&&req.method==='POST')return telegramWebhook(req,env);
 if(path==='/api/payments/ipn'&&req.method==='POST')return ipnHandler(req,env);
 if(path==='/api/config'&&req.method==='GET')return json({ok:true,email:!!(env.MAIL_FROM&&(env.RESEND_API_KEY||env.EMAIL)),telegram:!!(env.TELEGRAM_BOT_TOKEN&&env.TELEGRAM_WEBHOOK_SECRET),payments:!!(env.NOWPAYMENTS_API_KEY&&env.NOWPAYMENTS_IPN_SECRET),licensing:!!env.LICENSE_VAULT_KEY});
 if(req.method==='POST'&&!originSafe(req))return fail('ORIGIN_REJECTED',403);
 if(path==='/api/auth/email/start'&&req.method==='POST')return emailStart(req,env);
 if(path==='/api/auth/email/verify'&&req.method==='POST')return emailVerify(req,env);
 if(path==='/api/auth/telegram/code'&&req.method==='POST')return loginFromTelegram(req,env);
 const user=await authUser(req,env);
 if(path==='/api/me'&&req.method==='GET'){
  if(!user)return fail('UNAUTHENTICATED',401);
  return json({ok:true,user:await profile(env,user)});
 }
 if(path==='/api/auth/logout'&&req.method==='POST'){
  if(user)await env.DB.prepare('DELETE FROM site_sessions WHERE token_hash=?').bind(user.token_hash).run();
  return json({ok:true},200,{'set-cookie':cookieClear()});
 }
 if(!user)return fail('UNAUTHENTICATED',401);
 if(path==='/api/auth/link/create'&&req.method==='POST'){
  if(!user.email)return fail('VERIFIED_EMAIL_REQUIRED',403);
  if(!await limited(req,env,'link-code',10))return fail('RATE_LIMITED',429);
  return json({ok:true,code:await issueCode(env,'link',user.id,user.id,10)});
 }
 if(path==='/api/license/rotate'&&req.method==='POST'){
  if(!await limited(req,env,'rotate',4))return fail('RATE_LIMITED',429);
  const code=await rotateLicense(env,user);return json({ok:true,activation_code:code});
 }
 if(path==='/api/checkout'&&req.method==='POST')return createCheckout(req,env,user);
 if(path==='/api/orders'&&req.method==='GET'){
  const rows=await env.DB.prepare('SELECT id,plan,amount_usd,status,invoice_url,created_at,paid_at FROM site_orders WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(user.id).all();
  return json({ok:true,orders:rows.results||[]});
 }
 if(!path.startsWith('/api/admin/'))return fail('NOT_FOUND',404);
 if(user.role!=='admin')return fail('FORBIDDEN',403);
 if(path==='/api/admin/users'&&req.method==='GET'){
  const q=safeText(u.searchParams.get('q')||'',80),n=Math.max(1,Math.min(100,Number(u.searchParams.get('limit')||50)||50));
  const query=q?'WHERE id LIKE ? OR email LIKE ? OR telegram_id LIKE ?':'';
  const stmt=env.DB.prepare('SELECT id,email,telegram_id,telegram_name,role,status,plan,created_at FROM site_users '+query+' ORDER BY created_at DESC LIMIT ?');
  const rows=q?await stmt.bind('%'+q+'%','%'+q+'%','%'+q+'%',n).all():await stmt.bind(n).all();
  return json({ok:true,users:rows.results||[]});
 }
 if(path==='/api/admin/stats'&&req.method==='GET'){
  const stats=await env.DB.prepare("SELECT COUNT(*) AS total,SUM(plan='trial') AS trial,SUM(plan='quarterly') AS quarterly,SUM(plan='annual') AS annual,SUM(status='suspended') AS suspended FROM site_users").first();
  return json({ok:true,stats});
 }
 if(path==='/api/admin/user'&&req.method==='POST')return adminUpdate(req,env,user);
 return fail('NOT_FOUND',404);
}
export default {
 async fetch(request,env){
  const url=new URL(request.url);
  if(request.method==='GET'&&url.pathname==='/')return new Response(SITE_HTML,{headers:{...HEAD,'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; upgrade-insecure-requests"}});
  if(request.method==='GET'&&url.pathname==='/assets/app.css')return asset(SITE_CSS,'text/css; charset=utf-8');
  if(request.method==='GET'&&url.pathname==='/assets/app.js')return asset(SITE_JS,'text/javascript; charset=utf-8');
  if(url.pathname.startsWith('/api/')){
   if(!env?.DB)return fail('DATABASE_UNAVAILABLE',503);
   try{return await api(request,env)}catch(error){
    console.error('site request failed',url.pathname,error?.name||'Error');
    if(error?.message==='BAD_JSON'||error?.message==='BODY_TOO_LARGE')return fail(error.message,400);
    if(error?.message==='LICENSE_VAULT_NOT_CONFIGURED')return fail('LICENSING_NOT_READY',503);
    return fail('SERVICE_UNAVAILABLE',503);
   }
  }
  return new Response('Not found',{status:404,headers:HEAD});
 }
};
