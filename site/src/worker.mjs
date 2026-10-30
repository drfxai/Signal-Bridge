import {UI_RELEASE} from './ui-release.mjs';
import {memberControls} from './member-controls.mjs';
import {relayTradingView,routeTelegramSignal} from './signal-routing.mjs';
import { createAndDispatch } from '../../worker/src/command.mjs';
import { demoReadiness, testReadiness, makeConnectionTest } from './execution-control.mjs';
import { SITE_HTML, SITE_CSS, SITE_JS, DESIGN_JS } from './ui.mjs';
import { TAILWIND_CSS } from './tailwind.mjs';
import { MINI_HTML, MINI_JS } from './telegram-mini.mjs';
import { inspectTelegramInitData } from './telegram-auth.mjs';
import { telegramHealth } from './telegram-health.mjs';
import { botLanguage, botText, botLanguageKeyboard } from './telegram-i18n.mjs';
import { I18N_JS } from './i18n.mjs';
import { PROMO_ASSETS } from './promo.mjs';
import { channelApi, channelIngest, onBotMembership, channelsCommand, channelCallback, CHANNEL_HOOK_PATH } from './channel-webhooks.mjs';
import { scalperOverview, scalperCheckout, scalperPaid, scalperGrant, SCALPER_PLANS } from './scalper.mjs';

const HEAD={'x-drfx-ui-release':UI_RELEASE,'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY','permissions-policy':'camera=(),microphone=(),geolocation=()'};
const PRICES={quarterly:47,annual:165};
const DURATION={trial:'+1 month',quarterly:'+3 months',annual:'+1 year'};
const ADMIN_ACTIONS=new Set(['suspend','resume','grant_trial','grant_quarterly','grant_annual','revoke_license','grant_scalper_1m','grant_scalper_3m']);
const API_ORIGIN='https://drfx.company';
const encoder=new TextEncoder();
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...HEAD,'content-type':'application/json; charset=utf-8',...extra}});
const fail=(code,status=400)=>json({ok:false,error:code},status);
const asset=(body,type)=>new Response(body,{headers:{...HEAD,'content-type':type,'cache-control':'no-store, no-cache, max-age=0, must-revalidate','content-security-policy':"default-src 'none'; style-src 'self'; script-src 'self'"}});
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
// Shared helpers handed to the Scalper Pro module.
const channelHelpers=(env,req)=>({json,fail,sha,rand,b64u,uid,limited,req,origin:API_ORIGIN,
 encryptCode:code=>encryptCode(env,code),decryptCode:(c,n)=>decryptCode(env,c,n),audit:(actor,action,subject)=>audit(env,actor,action,subject),
 botSend:(chatId,text,keyboard)=>botSend(env,chatId,text,keyboard),answer:id=>botAnswerCallback(env,id),getOrCreateTelegram:(id,name)=>getOrCreateTelegram(env,id,name)});
const scalperHelpers=env=>({json,fail,readBody,limited,encryptCode,decryptCode,uid,audit,origin:API_ORIGIN,
 notify:async(userId,key,login,days)=>{
  const u=await env.DB.prepare('SELECT telegram_id FROM site_users WHERE id=?').bind(userId).first();
  if(u?.telegram_id)await botSend(env,u.telegram_id,'🔑 <b>DrFX Scalper Pro key</b>\nMT5 #'+login+' · '+days+' days\n<code>'+key+'</code>\nPaste it on the panel: ENTER LICENCE KEY → ACTIVATE.');
 }});
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
 // The verified email admin may have registered before ADMIN_EMAIL was configured.
 // Promote only an exact, freshly verified email identity; do not trust a request body alone.
 const verifiedAdmin=!!(env.ADMIN_EMAIL&&email===String(env.ADMIN_EMAIL).trim().toLowerCase());
 if(user){
  if(verifiedAdmin&&user.role!=='admin'){
   const updated=await env.DB.prepare("UPDATE site_users SET role='admin',updated_at=CURRENT_TIMESTAMP WHERE id=? AND email=? AND role!='admin'").bind(user.id,email).run();
   if(updated.meta?.changes===1){user={...user,role:'admin'};await audit(env,user.id,'verified_email_admin_granted',user.id);}
   else user=await env.DB.prepare('SELECT * FROM site_users WHERE id=?').bind(user.id).first();
  }
  return user;
 }
 const id=uid('usr'),role=verifiedAdmin?'admin':'user';
 await env.DB.prepare("INSERT INTO site_users (id,email,role) VALUES (?,?,?)").bind(id,email,role).run();
 user=await env.DB.prepare('SELECT * FROM site_users WHERE id=?').bind(id).first();
 return user;
}
async function getOrCreateTelegram(env,id,username){
 let user=await env.DB.prepare('SELECT * FROM site_users WHERE telegram_id=?').bind(id).first();
 // Only the cryptographically verified numeric Telegram sender can inherit the
 // ADMIN_TELEGRAM_ID role, even when the user existed before this secret was set.
 const verifiedAdmin=!!(env.ADMIN_TELEGRAM_ID&&safeEq(id,String(env.ADMIN_TELEGRAM_ID).trim()));
 if(user){
  if(verifiedAdmin&&user.role!=='admin'){
   const updated=await env.DB.prepare("UPDATE site_users SET role='admin',updated_at=CURRENT_TIMESTAMP WHERE id=? AND telegram_id=? AND role!='admin'").bind(user.id,id).run();
   if(updated.meta?.changes===1){user={...user,role:'admin'};await audit(env,user.id,'verified_telegram_admin_granted',user.id);}
   else user=await env.DB.prepare('SELECT * FROM site_users WHERE id=?').bind(user.id).first();
  }
  return user;
 }
 const userId=uid('usr'),role=verifiedAdmin?'admin':'user';
 await env.DB.prepare("INSERT OR IGNORE INTO site_users (id,telegram_id,telegram_name,role) VALUES (?,?,?,?)").bind(userId,id,safeText(username,80),role).run();
 user=await env.DB.prepare('SELECT * FROM site_users WHERE id=?').bind(userId).first();
 return user;
}
// A stable website credential is a password, not a disposable Telegram OTP.
// Random 192-bit value is SHA-256 indexed, AES-GCM encrypted for private chat redisplay.
async function telegramWebsiteCredential(env,user,rotate=false){
 if(!user?.telegram_id)throw Error('TELEGRAM_ACCOUNT_REQUIRED');
 if(!rotate){
  const previous=await env.DB.prepare("SELECT encrypted_code,nonce FROM site_permanent_logins WHERE user_id=?").bind(user.id).first();
  if(previous)return decryptCode(env,previous.encrypted_code,previous.nonce);
 }
 const code=b64u(rand(24)),encrypted=await encryptCode(env,code),hash=await sha(code);
 if(rotate){
  const result=await env.DB.batch([
   env.DB.prepare("INSERT INTO site_permanent_logins(user_id,code_hash,encrypted_code,nonce,rotated_at) VALUES (?,?,?,?,CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET code_hash=excluded.code_hash,encrypted_code=excluded.encrypted_code,nonce=excluded.nonce,rotated_at=CURRENT_TIMESTAMP").bind(user.id,hash,encrypted.cipher,encrypted.iv),
   // An old compromised credential may have been used to create sessions; revoke them.
   env.DB.prepare("DELETE FROM site_sessions WHERE user_id=?").bind(user.id)
  ]);
  if(result[0]?.meta?.changes!==1)throw Error('CREDENTIAL_NOT_PROVISIONED');
  await audit(env,user.id,'website_login_credential_rotated',user.id,'all_website_sessions_revoked');
  return code;
 }
 await env.DB.prepare("INSERT OR IGNORE INTO site_permanent_logins(user_id,code_hash,encrypted_code,nonce) VALUES (?,?,?,?)")
  .bind(user.id,hash,encrypted.cipher,encrypted.iv).run();
 // Concurrent /login commands must both return the stored winner, never an unusable code.
 const stored=await env.DB.prepare("SELECT encrypted_code,nonce FROM site_permanent_logins WHERE user_id=?").bind(user.id).first();
 if(!stored)throw Error('CREDENTIAL_NOT_PROVISIONED');
 return decryptCode(env,stored.encrypted_code,stored.nonce);
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
 // EA activation serials are 43 chars and MUST NOT be used as website sign-in credentials.
 if(/^[A-Za-z0-9_-]{43}$/.test(code))return fail('EA_CODE_NOT_LOGIN_CODE',400);
 // 32-character reusable website credential, or a legacy 16-character OTP while it expires.
 if(!/^[A-Za-z0-9_-]{32}$/.test(code)&&!/^[A-Za-z0-9_-]{16}$/.test(code))return fail('INVALID_LOGIN_CODE_FORMAT',400);
 const digest=await sha(code);
 let user=null;
 if(code.length===32){
  user=await env.DB.prepare(
   "SELECT u.* FROM site_permanent_logins c JOIN site_users u ON u.id=c.user_id WHERE c.code_hash=? AND u.status='active' LIMIT 1"
  ).bind(digest).first();
 }else{
  // The previously issued 10-minute tokens work only until their normal expiration.
  const row=await env.DB.prepare("SELECT user_id,target FROM site_login_codes WHERE code_hash=? AND purpose='telegram' AND used_at IS NULL AND expires_at>CURRENT_TIMESTAMP").bind(digest).first();
  if(row){
   const consumed=await consumeCode(env,'telegram',row.target,code);
   if(consumed)user=await env.DB.prepare("SELECT * FROM site_users WHERE id=? AND status='active'").bind(row.user_id).first();
  }
 }
 if(!user)return fail('INVALID_LOGIN_CREDENTIAL',401);
 if(!user)return fail('ACCOUNT_UNAVAILABLE',403);
 try{await licenseRecord(env,user);}catch{return fail('LICENSING_NOT_READY',503);}
 if(code.length===32)await env.DB.prepare("UPDATE site_permanent_logins SET last_used_at=CURRENT_TIMESTAMP WHERE code_hash=? AND user_id=?").bind(digest,user.id).run();
 await audit(env,user.id,'website_login',user.id,code.length===32?'permanent_telegram_credential':'legacy_otp');
 return json({ok:true},200,{'set-cookie':await login(env,user.id)});
}
async function loginFromTelegramMiniApp(req,env){
 if(!env.TELEGRAM_BOT_TOKEN||!env.TELEGRAM_WEBHOOK_SECRET)return fail('BOT_NOT_CONFIGURED',503);
 if(!await limited(req,env,'telegram:mini-login',12))return fail('RATE_LIMITED',429);
 const body=await readBody(req,9000);
 const validation=await inspectTelegramInitData(body.init_data,env.TELEGRAM_BOT_TOKEN);
 if(!validation.principal){
  // Expose only a generic, safe code; never emit signed initData, timestamps or account identifiers.
  if(validation.reason==='EXPIRED')return fail('TELEGRAM_INIT_DATA_EXPIRED',401);
  if(validation.reason==='BOT_CONFIGURATION')return fail('BOT_NOT_CONFIGURED',503);
  return fail('INVALID_TELEGRAM_INIT_DATA',401);
 }
 const principal=validation.principal;
 const user=await getOrCreateTelegram(env,principal.id,principal.name);
 if(!user||user.status!=='active')return fail('ACCOUNT_SUSPENDED',403);
 try{await licenseRecord(env,user);}catch{return fail('LICENSING_NOT_READY',503);}
 await audit(env,user.id,'telegram_mini_sign_in',user.id);
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
// TradingView webhook credentials belong to the authenticated DrFX account.
// Reuse the same D1 tenant/agent as its EA license; default to DRY RUN.
const TV_ORIGIN='https://signalbridge.drfx.online/v1/ingress/tradingview/';
async function userWebhook(env,user,includeToken=true){
 const row=await env.DB.prepare(
  "SELECT w.connection_id,w.encrypted_token,w.nonce,w.created_at,c.delivery_mode,c.status FROM site_tradingview_webhooks w " +
  "JOIN ingress_connections c ON c.id=w.connection_id AND c.tenant_id=w.user_id " +
  "WHERE w.user_id=? LIMIT 1"
 ).bind(user.id).first();
 if(!row)return {exists:false,mode:'dry_run'};
 const token=includeToken?await decryptCode(env,row.encrypted_token,row.nonce):null;
 const usage=await env.DB.prepare(
  "SELECT COUNT(*) AS received,MAX(received_at) AS last_received FROM received_signals WHERE connection_id=?"
 ).bind(row.connection_id).first();
 return {exists:true,mode:row.delivery_mode,status:row.status,webhook_url:token?TV_ORIGIN+token:null,
  received:Number(usage?.received||0),last_received:usage?.last_received||null,created_at:row.created_at};
}
async function provisionUserWebhook(req,env,user){
 if(!await limited(req,env,'tv:create:'+user.id,3))return fail('RATE_LIMITED',429);
 const existing=await env.DB.prepare("SELECT connection_id FROM site_tradingview_webhooks WHERE user_id=?").bind(user.id).first();
 if(existing)return json({ok:true,webhook:await userWebhook(env,user)});
 const license=await licenseRecord(env,user);
 const token=b64u(rand(32)),encrypted=await encryptCode(env,token),connectionId=uid('tv');
 // Creating a credential and linking it to this exact EA agent must be atomic.
 await env.DB.batch([
  env.DB.prepare("INSERT INTO ingress_connections (id,tenant_id,provider,token_sha256,status,agent_id,delivery_mode) VALUES (?,?,'tradingview',?,'active',?,'dry_run')")
   .bind(connectionId,user.id,await sha(token),license.agent_id),
  env.DB.prepare("INSERT INTO site_tradingview_webhooks (user_id,connection_id,encrypted_token,nonce) VALUES (?,?,?,?)")
   .bind(user.id,connectionId,encrypted.cipher,encrypted.iv)
 ]);
 await audit(env,user.id,'tv_webhook_created',user.id,'dry_run');
 return json({ok:true,webhook:await userWebhook(env,user)},201);
}
async function rotateUserWebhook(req,env,user){
 if(!await limited(req,env,'tv:rotate:'+user.id,2))return fail('RATE_LIMITED',429);
 const existing=await env.DB.prepare("SELECT connection_id FROM site_tradingview_webhooks WHERE user_id=?").bind(user.id).first();
 if(!existing)return fail('WEBHOOK_NOT_CREATED',404);
 const token=b64u(rand(32)),encrypted=await encryptCode(env,token);
 await env.DB.batch([
  env.DB.prepare("UPDATE ingress_connections SET token_sha256=? WHERE id=? AND tenant_id=?").bind(await sha(token),existing.connection_id,user.id),
  env.DB.prepare("UPDATE site_tradingview_webhooks SET encrypted_token=?,nonce=?,updated_at=CURRENT_TIMESTAMP WHERE user_id=? AND connection_id=?")
   .bind(encrypted.cipher,encrypted.iv,user.id,existing.connection_id)
 ]);
 await audit(env,user.id,'tv_webhook_rotated',user.id,'previous webhook URL revoked');
 return json({ok:true,webhook:await userWebhook(env,user)});
}
async function connectionDiagnostic(env,user){
 const row=await env.DB.prepare(
  "SELECT sl.agent_id,el.status,el.plan,el.activated_at,el.expires_at,el.account_login,el.account_server," +
  "a.status AS agent_status,a.last_connected_at FROM site_licenses sl " +
  "JOIN ea_licenses el ON el.id=sl.license_id JOIN agent_connections a ON a.id=sl.agent_id " +
  "WHERE sl.user_id=? LIMIT 1"
 ).bind(user.id).first();
 if(!row)return {license:'missing',mt5_bound:false,last_handshake:null,live_socket_verified:false,trade_executed:false};
 let live=false,terminal=false,connectedAt=null,snapshotAvailable=false,fresh=false,mt5Mode=null,capabilities=[],telemetry=null;
 if(env.AGENT_HUB){
  try{
   const hub=env.AGENT_HUB.get(env.AGENT_HUB.idFromName(row.agent_id));
   const resp=await hub.fetch(new Request('https://agent-hub/snapshot'));
   if(resp.ok){
    const state=await resp.json();
    snapshotAvailable=true;
    const socket=(state.clients||[]).find(c=>c.agent_id===row.agent_id&&c.client_type==='ea');
    const matches=!!socket&&!!row.account_login&&!!row.account_server&&
      socket.account?.login===row.account_login&&socket.account?.server===row.account_server;
    fresh=matches&&Number.isFinite(Date.parse(socket.last_seen_at))&&Date.now()-Date.parse(socket.last_seen_at)>=0&&Date.now()-Date.parse(socket.last_seen_at)<90000;
     live=matches&&fresh;terminal=matches&&socket.terminal_online===true&&fresh;
     telemetry=matches?socket.account:null;mt5Mode=matches?socket.account?.mode:null;capabilities=matches?(socket.capabilities||[]):[];
    connectedAt=matches?socket.connected_at||null:null;
   }
  }catch{ /* A failed read-only snapshot never counts as an online EA. */ }
 }
 return {agent_id:row.agent_id,license:row.status,agent_status:row.agent_status,plan:row.plan,
  mt5_bound:!!(row.account_login&&row.account_server),
  mt5_account:row.account_login?{login:row.account_login,server:row.account_server}:null,
  last_handshake:row.last_connected_at||null,activated_at:row.activated_at||null,
  live_socket_verified:live,terminal_online:terminal,live_snapshot_available:snapshotAvailable,
  expires_at:row.expires_at,telemetry:live?telemetry:null,connected_at:connectedAt,fresh,mt5_mode:mt5Mode,capabilities,
   license_unexpired:!!row.expires_at&&Date.parse(row.expires_at.replace(' ','T')+'Z')>Date.now(),trade_executed:false,
  note:snapshotAvailable?'Live Durable Object EA snapshot; no order was placed.':!env.AGENT_HUB?'EA hub binding is missing from the site deployment.':'Live socket could not be independently verified. Database history shown only.'};
}
async function setWebhookMode(req,env,user){
 const b=await readBody(req);
 if(!['dry_run','demo_execute'].includes(b.mode))return fail('INVALID_EXECUTION_MODE');
 if(b.mode==='demo_execute'){
  if(b.confirm!==true)return fail('EXPLICIT_CONFIRMATION_REQUIRED');
  const reason=demoReadiness(await connectionDiagnostic(env,user));if(reason)return fail(reason,409);
 }
 const result=await env.DB.prepare("UPDATE ingress_connections SET delivery_mode=? WHERE tenant_id=? AND id=(SELECT connection_id FROM site_tradingview_webhooks WHERE user_id=?) AND status='active'").bind(b.mode,user.id,user.id).run();
 if(result.meta?.changes!==1)return fail('WEBHOOK_NOT_CREATED',404);
 await audit(env,user.id,'tv_execution_mode',user.id,b.mode);
 return json({ok:true,webhook:await userWebhook(env,user)});
}
async function runConnectionTest(req,env,user,legacy=false){
 const b=await readBody(req);if(b.confirm!==true)return fail('EXPLICIT_CONFIRMATION_REQUIRED');
 if(!env.AGENT_HUB)return fail('EA_HUB_NOT_CONFIGURED',503);
 const d=await connectionDiagnostic(env,user),reason=legacy?demoReadiness(d,{timedTest:true}):testReadiness(d);
 if(reason)return fail(reason,409);
 if(!legacy&&(b.account_mode!==d.mt5_mode||b.account_login!==d.mt5_account?.login||b.account_server!==d.mt5_account?.server))return fail('TEST_ACCOUNT_CHANGED',409);
 if(d.mt5_mode==='LIVE'&&b.confirm_live!=='CONFIRM LIVE TEST')return fail('LIVE_CONFIRMATION_REQUIRED',400);
 if(!legacy&&d.capabilities.includes('test-config-v1')&&(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/.test(d.telemetry?.test_symbol||'')||!Number.isFinite(d.telemetry?.test_lots)||d.telemetry.test_lots<=0||d.telemetry.test_lots>100))return fail('INVALID_EA_TEST_SETTINGS',409);
 if(!legacy&&d.capabilities.includes('test-config-v1')&&(b.test_symbol!==d.telemetry.test_symbol||b.test_lots!==d.telemetry.test_lots))return fail('TEST_SETTINGS_CHANGED',409);
 if(!await limited(req,env,'demo:test:'+user.id,1))return fail('RATE_LIMITED',429);
 const id=uid('test'),commandId=crypto.randomUUID();
 const inserted=await env.DB.prepare("INSERT INTO connection_tests (id,user_id,agent_id,command_id,account_mode,account_login,account_server) VALUES (?,?,?,?,?,?,?) ON CONFLICT DO NOTHING").bind(id,user.id,d.agent_id,commandId,d.mt5_mode,d.mt5_account?.login,d.mt5_account?.server).run();
 if(inserted.meta?.changes!==1)return fail('TEST_ALREADY_PENDING',409);
 await audit(env,user.id,'connection_test',user.id,id+' '+d.mt5_mode);
 // Persist before dispatch. An uncertain dispatch must never be blindly repeated.
 const dispatch=await createAndDispatch(env,{tenantId:user.id,agentId:d.agent_id,sourceType:'test',sourceRef:id,commandId,signal:makeConnectionTest(id,Date.now(),legacy?null:{mode:d.mt5_mode,...d.mt5_account},!legacy&&d.capabilities.includes('test-config-v1')?{symbol:d.telemetry.test_symbol,lots:d.telemetry.test_lots}:null),mode:legacy?'demo_execute':'test_execute'});
 return json({ok:true,test_id:id,command_id:dispatch.command_id,status:dispatch.status,trade_executed:false},202);
}
async function resetDailyRisk(req,env,user){
 const b=await readBody(req);if(b.confirm!==true)return fail('EXPLICIT_CONFIRMATION_REQUIRED');
 const d=await connectionDiagnostic(env,user);
 if(!d.live_socket_verified||!d.terminal_online||!d.fresh)return fail('EA_NOT_READY',409);
 if(d.license!=='active'||!d.license_unexpired)return fail('LICENSE_INACTIVE',409);
 if(!d.capabilities.includes('risk-v1')||d.telemetry?.risk?.state!=='HIT'||String(b.hit_id)!==d.telemetry.risk.hit_id||b.account_login!==d.mt5_account?.login||b.account_server!==d.mt5_account?.server)return fail('RISK_STATE_CHANGED',409);
 const hub=env.AGENT_HUB.get(env.AGENT_HUB.idFromName(d.agent_id));
 const r=await hub.fetch(new Request('https://agent-hub/risk-reset',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({agent_id:d.agent_id,account_login:b.account_login,account_server:b.account_server,hit_id:b.hit_id})}));
 const result=await r.json();if(r.ok)await audit(env,user.id,'daily_risk_reset_requested',user.id,String(b.hit_id));return json(result,r.status);
}
// Read-only latest test outcome. Never create a trade while diagnosing a failure.
async function lastConnectionTest(env,user){
 const row=await env.DB.prepare(
  "SELECT t.id,t.status,substr(t.detail,1,240) AS detail,t.created_at,t.updated_at,"+
  "c.status AS command_status FROM connection_tests t LEFT JOIN commands c ON c.id=t.command_id "+
  "WHERE t.user_id=? ORDER BY t.created_at DESC,t.rowid DESC LIMIT 1"
 ).bind(user.id).first();
 return json({ok:true,test:row||null});
}
async function testStatus(req,env,user){
 const id=new URL(req.url).searchParams.get('id');
 const test=await env.DB.prepare("SELECT t.id,t.status,t.broker_ticket,t.detail,t.updated_at,c.status AS command_status FROM connection_tests t LEFT JOIN commands c ON c.id=t.command_id WHERE t.id=? AND t.user_id=?").bind(id,user.id).first();
 if(!test)return fail('TEST_NOT_FOUND',404);
 return json({ok:true,test});
}
async function adminUpdate(req,env,admin){
 const b=await readBody(req);if(!ADMIN_ACTIONS.has(b.action)||!/^usr_[0-9a-f]{32}$/.test(b.user_id||''))return fail('INVALID_ACTION');
 const user=await env.DB.prepare('SELECT * FROM site_users WHERE id=?').bind(b.user_id).first();
 if(!user)return fail('NOT_FOUND',404);
 if(user.id===admin.id && (b.action==='suspend'||b.action==='revoke_license'))return fail('SELF_LOCKOUT_REFUSED',409);
 if(b.action.startsWith('grant_scalper_')){
  try{const k=await scalperGrant(env,scalperHelpers(env),{adminId:admin.id,userId:user.id,login:b.account_login,plan:b.action.slice(6)});return json({ok:true,scalper:k});}
  catch(e){return fail(e.message==='INVALID_MT5_ACCOUNT'||e.message==='INVALID_PLAN'?e.message:'SCALPER_LICENSING_NOT_CONFIGURED',e.message==='SCALPER_LICENSING_NOT_CONFIGURED'?503:400);}
 }
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
 let url;try{url=new URL(data?.invoice_url||'');if(url.protocol!=='https:'||!(url.hostname==='nowpayments.io'||url.hostname.endsWith('.nowpayments.io')))throw Error('bad');}
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
 if(orderId.startsWith('sco_'))return scalperPaid(env,scalperHelpers(env),body);
 const order=await env.DB.prepare('SELECT * FROM site_orders WHERE id=?').bind(orderId).first();
 if(!order||order.status==='failed')return fail('ORDER_NOT_FOUND',404);
 if(order.status==='paid')return json({ok:true,duplicate:true});
 if(String(body.price_currency||'').toLowerCase()!=='usd'||Number(body.price_amount)!==Number(order.amount_usd)||!paymentId)return fail('PAYMENT_DETAILS_MISMATCH',409);
 const lic=await env.DB.prepare('SELECT agent_id FROM site_licenses WHERE user_id=?').bind(order.user_id).first();
 if(!lic)return fail('LICENSE_MISSING',503);
 // D1 batch statements execute sequentially in one transaction, including status claim.
 // The entitlement updates are conditional on the order still being pending.
 const results=await env.DB.batch([
  env.DB.prepare("UPDATE ea_licenses SET plan=?,duration_modifier=?,status='active',"+
   "expires_at=CASE WHEN activated_at IS NULL THEN NULL ELSE datetime(CASE WHEN expires_at>CURRENT_TIMESTAMP THEN expires_at ELSE CURRENT_TIMESTAMP END, ?) END,updated_at=CURRENT_TIMESTAMP "+
   "WHERE agent_id=? AND EXISTS(SELECT 1 FROM site_orders WHERE id=? AND status='pending')").bind(order.plan,DURATION[order.plan],DURATION[order.plan],lic.agent_id,orderId),
  env.DB.prepare("UPDATE site_users SET plan=?,updated_at=CURRENT_TIMESTAMP WHERE id=? "+
   "AND EXISTS(SELECT 1 FROM site_orders WHERE id=? AND status='pending')").bind(order.plan,order.user_id,orderId),
  env.DB.prepare("INSERT INTO site_audit (id,actor_id,action,subject_id,detail) "+
   "SELECT ?,NULL,'nowpayments_paid',?,? WHERE EXISTS(SELECT 1 FROM site_orders WHERE id=? AND status='pending')").bind(uid('aud'),order.user_id,orderId,orderId),
  env.DB.prepare("UPDATE site_orders SET status='paid',payment_id=?,paid_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(paymentId,orderId)
 ]);
 return results[3]?.meta?.changes===1?json({ok:true,granted:true}):json({ok:true,duplicate:true});
}
async function botSend(env,chatId,text,keyboard){
 if(!env.TELEGRAM_BOT_TOKEN)return;
 const body={chat_id:chatId,text,parse_mode:'HTML',disable_web_page_preview:true};
 if(keyboard===true)body.reply_markup={inline_keyboard:[[ {text:'Open DrFX Mini App',web_app:{url:API_ORIGIN+'/telegram'}} ],[ {text:'Open website',url:API_ORIGIN} ]]};
 else if(keyboard&&typeof keyboard==='object')body.reply_markup=keyboard;
 await fetch('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/sendMessage',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)
 });
}
async function userBotLocale(env,telegramId){
 const row=await env.DB.prepare("SELECT language_code FROM site_bot_preferences WHERE telegram_id=?").bind(telegramId).first();
 return botLanguage(row?.language_code);
}
async function setBotLocale(env,telegramId,language){
 const lang=botLanguage(language);
 if(lang!==language)throw Error('INVALID_LANGUAGE_SELECTION');
 await env.DB.prepare("INSERT INTO site_bot_preferences (telegram_id,language_code) VALUES (?,?) ON CONFLICT(telegram_id) DO UPDATE SET language_code=excluded.language_code,selected_at=CURRENT_TIMESTAMP")
  .bind(telegramId,lang).run();
 return lang;
}
async function botAnswerCallback(env,callbackId){
 if(!env.TELEGRAM_BOT_TOKEN||!callbackId)return;
 try{await fetch('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/answerCallbackQuery',{
  method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({callback_query_id:callbackId})
 });}catch{/* Telegram may have expired the callback; language selection still persists. */}
}
async function botWelcome(env,chatId,user,lang){
 try{await licenseRecord(env,user);}
 catch{
  await botSend(env,chatId,botText(lang,'licensePending'));
  return;
 }
 await botSend(env,chatId,botText(lang,'selected')+'\n\n'+botText(lang,'welcome'),true);
}
async function botLanguageCallback(update,env){
 const cb=update?.callback_query;
 if(!cb?.id||!cb.from?.id||cb.message?.chat?.type!=='private'||!cb.message?.chat?.id||
  String(cb.from.id)!==String(cb.message.chat.id))return json({ok:true,ignored:'CALLBACK_NOT_PRIVATE'});
 const match=/^lang:(en|fa|ar|tr|ru|hi)$/.exec(String(cb.data||''));
 if(!match){await botAnswerCallback(env,cb.id);return json({ok:true,ignored:'UNKNOWN_CALLBACK'});}
 const telegramId=String(cb.from.id),chatId=String(cb.message.chat.id);
 let user=await env.DB.prepare('SELECT * FROM site_users WHERE telegram_id=?').bind(telegramId).first();
 if(!user)user=await getOrCreateTelegram(env,telegramId,cb.from.username||cb.from.first_name||'Trader');
 if(user.status!=='active'){await botAnswerCallback(env,cb.id);await botSend(env,chatId,botText('en','suspended'));return json({ok:true});}
 const lang=await setBotLocale(env,telegramId,match[1]);
 await botAnswerCallback(env,cb.id);
 await botWelcome(env,chatId,user,lang);
 return json({ok:true});
}
async function telegramWebhook(req,env){
 if(!env.TELEGRAM_BOT_TOKEN||!env.TELEGRAM_WEBHOOK_SECRET)return fail('BOT_NOT_CONFIGURED',503);
 const secret=req.headers.get('x-telegram-bot-api-secret-token')||'';
 if(!safeEq(secret,env.TELEGRAM_WEBHOOK_SECRET))return fail('UNAUTHORIZED',401);
 const data=await readBody(req,16384);
 if(data.my_chat_member)return onBotMembership(data,env,channelHelpers(env,req));
 if(data.callback_query){const handled=await channelCallback(data,env,channelHelpers(env,req));if(handled)return handled;return botLanguageCallback(data,env);}
 const routed=await routeTelegramSignal(data,env);if(routed)return routed;
 const msg=data.message;
 if(!msg||msg.chat?.type!=='private'||!msg.from?.id)return json({ok:true,ignored:'NO_PRIVATE_MESSAGE'});
 const telegramId=String(msg.from.id),chatId=String(msg.chat.id),username=msg.from.username||msg.from.first_name||'Trader';
 const text=safeText(msg.text||'',220);
 const command=text.split(' ')[0].split('@')[0];
 if(!['/start','/language','/lang','/app','/login','/resetlogin','/me','/code','/link','/scalper','/channels','/admin','/users','/detail','/grant','/scalperkey','/suspend','/resume','/revoke'].includes(command))return json({ok:true,ignored:'UNKNOWN_COMMAND'});
 let user=await env.DB.prepare('SELECT * FROM site_users WHERE telegram_id=?').bind(telegramId).first();
 if(command!=='/link'&&!user)user=await getOrCreateTelegram(env,telegramId,username);
 const language=await userBotLocale(env,telegramId);
 const tx=key=>botText(language,key);
 if(user&&user.status!=='active'){await botSend(env,chatId,tx('suspended'));return json({ok:true});}
 if(command==='/start'||command==='/language'||command==='/lang'){
  await botSend(env,chatId,tx('choose'),botLanguageKeyboard());
 }else if(command==='/app'){
  await botSend(env,chatId,tx('app'),true);
 }else if(command==='/login'||command==='/resetlogin'){
  if(!await limited(req,env,'bot:code:'+telegramId,8)){await botSend(env,chatId,tx('tooMany'));return json({ok:true});}
  try{
   const code=await telegramWebsiteCredential(env,user,command==='/resetlogin');
   await botSend(env,chatId,
    tx('loginTitle')+'\n<code>'+code+'</code>\n'+
    (command==='/resetlogin'?tx('reset')+'\n':'')+tx('loginText')
   );
  }catch{await botSend(env,chatId,tx('loginUnavailable'));}
 }else if(command==='/code'){
  try{const record=await licenseRecord(env,user);const code=await decryptCode(env,record.encrypted_code,record.nonce);
    await botSend(env,chatId,tx('serialTitle')+'\n<code>'+code+'</code>\n'+tx('serialNotice'));}
  catch{await botSend(env,chatId,tx('licenseUnavailable'));}
 }else if(command==='/me'){
  const rec=await licenseRecord(env,user);
  await botSend(env,chatId,tx('member')+'\n'+tx('plan')+': '+user.plan+'\n'+tx('license')+': '+rec.status+'\n'+tx('expires')+': '+(rec.expires_at||tx('notActivated'))+'\n'+tx('dashboard')+': '+API_ORIGIN,true);
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
 }else if(command==='/channels'){
  await channelsCommand(env,user,chatId,channelHelpers(env,req));
 }else if(command==='/scalper'){
  const rows=(await env.DB.prepare('SELECT account_login,days,encrypted_key,nonce,created_at FROM scalper_keys WHERE user_id=? ORDER BY created_at DESC LIMIT 5').bind(user.id).all()).results||[];
  let out='⚡ <b>DrFX Scalper Pro</b>\nThe AI liquidity radar for XAUUSD on MT5. 7 days free inside the EA, then '+
   Object.values(SCALPER_PLANS).map(p=>p.label+' $'+p.usd).join(' · ')+'.\n';
  for(const r of rows)out+='\nMT5 #'+r.account_login+' · '+r.days+' days\n<code>'+await decryptCode(env,r.encrypted_key,r.nonce)+'</code>';
  out+=rows.length?'\n\nPaste a key on the panel: ENTER LICENCE KEY → ACTIVATE.':'\n\nBuy a plan in your dashboard: '+API_ORIGIN+'/#scalper';
  await botSend(env,chatId,out,true);
 }else if(command==='/scalperkey'&&user.role==='admin'){
  const args=text.split(/\s+/),login=args[1],plan=({'1m':'scalper_1m','3m':'scalper_3m'})[args[2]],target=args[3]||user.id;
  if(!login||!plan||!/^usr_[0-9a-z_]{1,40}$/.test(target)){await botSend(env,chatId,'Use: /scalperkey MT5_LOGIN 1m|3m [usr_...]');return json({ok:true});}
  const recipient=await env.DB.prepare('SELECT id FROM site_users WHERE id=?').bind(target).first();
  if(!recipient){await botSend(env,chatId,'User not found.');return json({ok:true});}
  try{const k=await scalperGrant(env,scalperHelpers(env),{adminId:user.id,userId:target,login,plan});
   await botSend(env,chatId,'✅ Scalper Pro key for MT5 #'+k.account_login+' ('+k.days+' days)\n<code>'+k.key+'</code>');}
  catch(e){await botSend(env,chatId,'Could not issue key: '+safeText(e.message,60));}
 }else if(command==='/admin'&&user.role==='admin'){
  const stats=await env.DB.prepare('SELECT COUNT(*) AS total,SUM(CASE WHEN plan="quarterly" THEN 1 ELSE 0 END) AS quarter,SUM(CASE WHEN plan="annual" THEN 1 ELSE 0 END) AS annual FROM site_users').first();
  await botSend(env,chatId,'DrFX Admin\nUsers: '+stats.total+'\nQuarterly: '+stats.quarter+'\nAnnual: '+stats.annual+'\nFull management: '+API_ORIGIN);
 }else if(command==='/users'&&user.role==='admin'){
  const r=await env.DB.prepare("SELECT id,email,telegram_name,telegram_id,plan,status FROM site_users ORDER BY created_at DESC LIMIT 15").all();
  const message=(r.results||[]).map(x=>'<code>'+x.id+'</code> | '+safeText(x.email||x.telegram_name||x.telegram_id||'member',60)+' | '+x.plan+' | '+x.status).join('\n');
  await botSend(env,chatId,'👥 <b>Recent DrFX members</b>\n'+(message||'No users')+'\nFull management: '+API_ORIGIN);
 }else if(['/detail','/suspend','/resume','/revoke'].includes(command)&&user.role==='admin'){
  const target=text.split(/\s+/)[1]||'';
  if(!/^usr_[0-9a-f]{32}$/.test(target)){await botSend(env,chatId,'Usage: '+command+' usr_...');return json({ok:true});}
  const recipient=await env.DB.prepare('SELECT * FROM site_users WHERE id=?').bind(target).first();
  if(!recipient){await botSend(env,chatId,'User not found.');return json({ok:true});}
  if(command==='/detail'){
   const lic=await env.DB.prepare("SELECT l.status,l.expires_at,l.account_login,l.account_server FROM site_licenses sl JOIN ea_licenses l ON sl.license_id=l.id WHERE sl.user_id=?").bind(target).first();
   await botSend(env,chatId,'<b>Member</b>\n<code>'+recipient.id+'</code>\nEmail: '+safeText(recipient.email||'Not linked')+'\nTelegram: '+safeText(recipient.telegram_id||'Not linked')+'\nPlan: '+recipient.plan+'\nStatus: '+recipient.status+'\nLicense: '+(lic?.status||'None')+'\nExpires: '+(lic?.expires_at||'Not activated')+'\nMT5: '+safeText(lic?.account_login||'Not bound'));
  }else{
   if(target===user.id){await botSend(env,chatId,'Cannot suspend or revoke your own admin account.');return json({ok:true});}
   if(command==='/revoke'){
    await env.DB.prepare("UPDATE ea_licenses SET status='revoked',updated_at=CURRENT_TIMESTAMP WHERE agent_id=(SELECT agent_id FROM site_licenses WHERE user_id=?)").bind(target).run();
   }else{
    await env.DB.batch([
     env.DB.prepare('UPDATE site_users SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(command==='/suspend'?'suspended':'active',target),
     env.DB.prepare("UPDATE ea_licenses SET status=?,updated_at=CURRENT_TIMESTAMP WHERE agent_id=(SELECT agent_id FROM site_licenses WHERE user_id=?)").bind(command==='/suspend'?'revoked':'active',target)
    ]);
   }
   await audit(env,user.id,'bot_'+command.slice(1),target);
   await botSend(env,chatId,'✅ '+command.slice(1)+' applied to <code>'+target+'</code>');
  }
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
 if(path==='/api/config'&&req.method==='GET')return json({ok:true,email:!!(env.MAIL_FROM&&(env.RESEND_API_KEY||env.EMAIL)),telegram:!!(env.TELEGRAM_BOT_TOKEN&&env.TELEGRAM_WEBHOOK_SECRET),payments:!!(env.NOWPAYMENTS_API_KEY&&env.NOWPAYMENTS_IPN_SECRET),licensing:!!env.LICENSE_VAULT_KEY,scalper:!!env.SCALPER_LICENSE_SECRET,ea_hub:!!env.AGENT_HUB,release:'signalbridge-design-20261029.2'});
 if(path==='/api/telegram/health'&&req.method==='GET'){
  if(!await limited(req,env,'public:telegram-health',5))return fail('RATE_LIMITED',429);
  return json(await telegramHealth(env));
 }
 if(req.method==='POST'&&!originSafe(req))return fail('ORIGIN_REJECTED',403);
 if(path==='/api/auth/email/start'&&req.method==='POST')return emailStart(req,env);
 if(path==='/api/auth/email/verify'&&req.method==='POST')return emailVerify(req,env);
 if(path==='/api/auth/telegram/code'&&req.method==='POST')return loginFromTelegram(req,env);
 if(path==='/api/auth/telegram/webapp'&&req.method==='POST')return loginFromTelegramMiniApp(req,env);
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
 if(path==='/api/downloads'&&req.method==='GET')return json({ok:true,signalbridge:{version:env.SIGNALBRIDGE_EA_VERSION||'Latest compiled build',url:env.SIGNALBRIDGE_EA_DOWNLOAD_URL||'https://github.com/drfxai/Signal-Bridge/releases/download/ea-latest/DrFX_SignalBridge_EA.ex5'}});
 if(path==='/api/webhook'&&req.method==='GET')return json({ok:true,webhook:await userWebhook(env,user)});
 if(path==='/api/webhook/create'&&req.method==='POST')return provisionUserWebhook(req,env,user);
 if(path==='/api/webhook/rotate'&&req.method==='POST')return rotateUserWebhook(req,env,user);
 if(path.startsWith('/api/member/')&&['GET','POST'].includes(req.method)){const result=await memberControls(path,req.method==='POST'?await readBody(req):undefined,env,user,()=>connectionDiagnostic(env,user));if(result)return result;}
 if(path==='/api/risk/reset'&&req.method==='POST')return resetDailyRisk(req,env,user);
 if(path==='/api/connection/check'&&req.method==='GET')return json({ok:true,diagnostic:await connectionDiagnostic(env,user)});
 if(path==='/api/connection/test-demo'&&req.method==='POST')return runConnectionTest(req,env,user,true);
 if(path==='/api/connection/test'&&req.method==='POST')return runConnectionTest(req,env,user);
 if(path==='/api/connection/test-status'&&req.method==='GET')return testStatus(req,env,user);
 if(path==='/api/connection/test-last'&&req.method==='GET')return lastConnectionTest(env,user);
 if(path==='/api/webhook/mode'&&req.method==='POST')return setWebhookMode(req,env,user);
 if(path==='/api/checkout'&&req.method==='POST')return createCheckout(req,env,user);
 if(path.startsWith('/api/channels')){const result=await channelApi(path,req.method,req.method==='POST'?await readBody(req):undefined,env,user,channelHelpers(env,req));if(result)return result;}
 if(path==='/api/scalper'&&req.method==='GET')return json(await scalperOverview(env,scalperHelpers(env),user));
 if(path==='/api/scalper/checkout'&&req.method==='POST')return scalperCheckout(req,env,scalperHelpers(env),user);
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
  if(request.method==='GET'&&url.pathname==='/')return new Response(SITE_HTML,{headers:{...HEAD,'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'self'; img-src 'self' data:; media-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; upgrade-insecure-requests"}});
  if(request.method==='GET'&&(url.pathname==='/telegram'||url.pathname==='/telegram/'))return new Response(MINI_HTML,{headers:{...HEAD,'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'none'; script-src 'self' https://telegram.org; connect-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self'; base-uri 'none'; object-src 'none'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests"}});
  if(request.method==='GET'&&url.pathname==='/assets/i18n.js')return asset(I18N_JS,'text/javascript; charset=utf-8');
  if(request.method==='GET'&&url.pathname.startsWith('/assets/promo/')){
   const name=url.pathname.slice('/assets/promo/'.length);
   if(!Object.hasOwn(PROMO_ASSETS,name))return new Response('Not found',{status:404,headers:HEAD});
   return new Response(PROMO_ASSETS[name],{headers:{'content-type':'image/svg+xml; charset=utf-8','x-content-type-options':'nosniff','cache-control':'public, max-age=86400','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; sandbox"}});
  }
  if(request.method==='GET'&&url.pathname==='/assets/telegram-mini.js')return asset(MINI_JS,'text/javascript; charset=utf-8');
  if(request.method==='GET'&&url.pathname==='/assets/app.css')return asset(SITE_CSS,'text/css; charset=utf-8');
  if(request.method==='GET'&&url.pathname==='/assets/tailwind.css')return asset(TAILWIND_CSS,'text/css; charset=utf-8');
  if(request.method==='GET'&&url.pathname==='/assets/app.js')return asset(SITE_JS,'text/javascript; charset=utf-8');
  if(request.method==='GET'&&url.pathname==='/assets/design.js')return asset(DESIGN_JS+"\nfunction showToast(message){const t=document.getElementById('toast');if(!t)return;t.textContent=message;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),3400)}\nfunction copyToClipboard(value,message){navigator.clipboard.writeText(value).then(()=>showToast(message)).catch(()=>showToast('Clipboard unavailable'))}\n",'text/javascript; charset=utf-8');
  if(url.pathname==='/internal/signal-relay'&&request.method==='POST'){try{return await relayTradingView(request,env)}catch{return fail('RELAY_UNAVAILABLE',503)}}
  if(url.pathname.startsWith(CHANNEL_HOOK_PATH)&&request.method==='POST'){
   if(!env?.DB)return fail('DATABASE_UNAVAILABLE',503);
   try{return await channelIngest(request,env,url.pathname.slice(CHANNEL_HOOK_PATH.length),channelHelpers(env,request))}catch{return fail('SERVICE_UNAVAILABLE',503)}
  }
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

