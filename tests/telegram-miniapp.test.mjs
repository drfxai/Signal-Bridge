import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyTelegramInitData, inspectTelegramInitData, TELEGRAM_INITDATA_MAX_AGE_SECONDS } from '../site/src/telegram-auth.mjs';
import { MINI_HTML, MINI_JS } from '../site/src/telegram-mini.mjs';
import worker from '../site/src/worker.mjs';
import { readFileSync } from 'node:fs';

const token='123456789:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const enc=new TextEncoder();
const hmac=async(key,value)=>{
 const keyObj=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-256'},false,['sign']);
 return new Uint8Array(await crypto.subtle.sign('HMAC',keyObj,enc.encode(value)));
};
const signed=async(params)=>{
 const key=await hmac(enc.encode('WebAppData'),token);
 const joined=[...new URLSearchParams(params)].filter(([k])=>k!=='hash')
   .sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0).map(([k,v])=>k+'='+v).join('\n');
 const hash=Array.from(await hmac(key,joined),b=>b.toString(16).padStart(2,'0')).join('');
 const p=new URLSearchParams(params);p.append('hash',hash);return p.toString();
};

test('server validates authentic Telegram Mini App HMAC, identity and expiry',async()=>{
 const now=Date.now(),at=String(Math.floor(now/1000)-60);
 const data=await signed([['user',JSON.stringify({id:912345670,first_name:'Ada',username:'secure_trader'})],['query_id','AA_demo'],['auth_date',at]]);
 const identity=await verifyTelegramInitData(data,token,now);
 assert.deepEqual(identity,{id:'912345670',name:'secure_trader'});
 assert.deepEqual(await verifyTelegramInitData(data,token,now+2*60*60*1000),identity); // Telegram Android may resume an older Mini App WebView.
 assert.equal(await verifyTelegramInitData(data,token,now+7*60*60*1000),null);
 const tampered=data.replace('secure_trader','impostor');
 assert.equal(await verifyTelegramInitData(tampered,token,now),null);
 assert.equal(await verifyTelegramInitData(data,token+'a',now),null);
 const future=await signed([['user',JSON.stringify({id:912345670})],['auth_date',String(Math.floor(now/1000)+500)]]);
 assert.equal(await verifyTelegramInitData(future,token,now),null);
});

test('Mini App initData rejects duplicate keys, malformed identities and bots',async()=>{
 const now=Date.now(),at=String(Math.floor(now/1000));
 const valid=await signed([['auth_date',at],['user',JSON.stringify({id:123456789})]]);
 assert.equal(await verifyTelegramInitData(valid+'&user=impostor',token,now),null);
 const bot=await signed([['auth_date',at],['user',JSON.stringify({id:123456789,is_bot:true})]]);
 assert.equal(await verifyTelegramInitData(bot,token,now),null);
 const noUser=await signed([['auth_date',at]]);
 assert.equal(await verifyTelegramInitData(noUser,token,now),null);
 assert.equal(await verifyTelegramInitData('fake=1',token,now),null);
 assert.equal(await verifyTelegramInitData(valid,'',now),null);
});

test('Telegram mini app renders premium UI and does not expose dummy metrics or credentials',async()=>{
 assert.match(MINI_HTML,/Telegram Mini App/);
 assert.match(MINI_HTML,/\/assets\/telegram-mini\.js/);
 assert.match(MINI_HTML,/telegram\.org\/js\/telegram-web-app\.js/);
 for(const text of ['$0','$47','$165','One Month Free','3 Months Premium','Annual Elite'])assert.ok(MINI_HTML.includes(text),text);
 for(const id of ['statusMessage','serialValue','memberPlan','revealSerial','copySerial','panel-license','panel-plans','paymentStatus'])assert.ok(MINI_HTML.includes('id="'+id+'"'),id);
 assert.doesNotThrow(()=>new Function(MINI_JS));
 assert.match(MINI_JS,/tg\.initData/);
 assert.match(MINI_JS,/\/api\/auth\/telegram\/webapp/);
 assert.match(MINI_JS,/\/api\/me/);
 assert.match(MINI_JS,/state\.serialVisible/);
 assert.ok(!MINI_JS.includes('initDataUnsafe'));
 assert.ok(!MINI_HTML.includes('API_KEY'));
 assert.ok(!MINI_HTML.includes('bot123'));
 const html=await worker.fetch(new Request('https://drfx.company/telegram'),{});
 assert.equal(html.status,200);
 assert.match(html.headers.get('content-security-policy'),/script-src 'self' https:\/\/telegram\.org/);
 assert.match(await html.text(),/SignalBridge Mini App/);
 const script=await worker.fetch(new Request('https://drfx.company/assets/telegram-mini.js'),{});
 assert.equal(script.status,200);
 assert.match(script.headers.get('content-type'),/text\/javascript/);
});

test('Telegram Mini App does not authenticate without BotFather secrets',async()=>{
 const r=await worker.fetch(new Request('https://drfx.company/api/auth/telegram/webapp',{
  method:'POST',headers:{'origin':'https://drfx.company','content-type':'application/json'},body:JSON.stringify({init_data:'fake'})
 }),{DB:{}});
 assert.equal(r.status,503);
 assert.deepEqual(await r.json(),{ok:false,error:'BOT_NOT_CONFIGURED'});
});

test('the existing bot uses Telegram web_app buttons and does not silently merge identities',()=>{
 const source=readFileSync(new URL('../site/src/worker.mjs',import.meta.url),'utf8');
 assert.match(source,/web_app:\{url:API_ORIGIN\+'\/telegram'\}/);
 assert.match(source,/command==='\/app'/);
 assert.match(source,/getOrCreateTelegram\(env,principal\.id,principal\.name\)/);
 assert.match(source,/inspectTelegramInitData\(body\.init_data,env\.TELEGRAM_BOT_TOKEN\)/);
 assert.match(source,/if\(user\.plan!=='trial'\|\|secondary\?\.activated_at\|\|activity\)/);
 assert.match(source,/\/api\/auth\/telegram\/code/);
});


test('mobile-first design is readable, wide, and retains DrFX brand colors',()=>{
 for(const token of [
   '--obsidian:#030406','--gold:#d4af37','--gold-light:#f7e7b4','--emerald:#10b981',
   'Trade smarter.','Stay connected.','Your dashboard','route-stage',
   'CONNECTION FLOW · ILLUSTRATION','SignalBridge','TradingView / TG',
   'MT5 EA','data-tr="navHome"','data-tr="navPlans"','id="langToggle"',
   'prefers-reduced-motion:reduce','env(safe-area-inset-bottom)',
   'width:100%','max-width:680px','data-panel="home"',
   'min-height:58px','font-size:14px','font-size:13px'
 ])assert.ok(MINI_HTML.includes(token),token);
 assert.match(MINI_HTML,/viewport-fit=cover/);
 assert.match(MINI_HTML,/width=device-width/);
 assert.match(MINI_HTML,/role="status"/);
 assert.match(MINI_HTML,/aria-live="polite"/);
 assert.match(MINI_HTML,/nav\.bottom\{position:fixed;left:0;right:0;bottom:0;width:100%/);
 assert.ok(!MINI_HTML.includes('width:min(100%,600px)'));
 assert.ok(!MINI_HTML.includes('AES-GCM / PRIVATE'));
 assert.ok(!MINI_HTML.includes('10.8ms'));
 assert.ok(!MINI_HTML.includes('TLS 1.3 VERIFIED'));
 assert.ok(!MINI_HTML.includes('LIVE EXECUTIONS'));
});
test('desktop-mode mobile viewport is recovered only on touch phones',()=>{
 assert.match(MINI_JS,/function normalizeViewport/);
 assert.match(MINI_JS,/navigator\.maxTouchPoints>0/);
 assert.match(MINI_JS,/w>sw\*1\.6/);
 assert.match(MINI_JS,/sw<=600/);
 assert.match(MINI_JS,/document\.documentElement\.style\.zoom/);
 assert.match(MINI_JS,/normalizeViewport\(\)/);
});
test('Telegram navigation, bilingual mode and license privacy remain functional',()=>{
 for(const token of [
  "document.querySelectorAll('[data-jump]')","document.body.dataset.tab=tab",
  "tg?.BackButton?.onClick","language(locale==='en'?'fa':'en')",
  "document.documentElement.dir=locale==='fa'?'rtl':'ltr'",
  "state.serialVisible","'/api/auth/telegram/webapp'",
  "'/api/me'","tg?.initData"
 ]) assert.ok(MINI_JS.includes(token),token);
 assert.ok(MINI_HTML.includes('id="serialValue"'));
 assert.ok(MINI_HTML.includes('id="revealSerial"'));
 assert.ok(MINI_HTML.includes('id="copySerial"'));
 assert.ok(MINI_HTML.includes('data-jump="license"'));
 assert.ok(!MINI_JS.includes('initDataUnsafe'));
 assert.doesNotThrow(()=>new Function(MINI_JS));
});

test('Mini App recovers an authenticated browser session without Telegram initData',()=>{
 assert.match(MINI_JS,/const signedIn=await refresh\('session'\)/);
 assert.match(MINI_JS,/const config=await api\('\/api\/config'\)/);
 assert.match(MINI_JS,/if\(tg\?\.initData&&state\.telegramEnabled\)/);
 assert.match(MINI_JS,/await api\('\/api\/auth\/telegram\/webapp',\{init_data:tg\.initData\}\)/);
 assert.match(MINI_JS,/if\(!signedIn\)/);
 assert.match(MINI_JS,/document\.documentElement\.lang=locale/);
 assert.match(MINI_JS,/navigator\.language\?\.toLowerCase\(\)\.startsWith\('fa'\)/);
});
test('Mini App clears private EA activation material on failed session refresh',()=>{
 assert.match(MINI_JS,/function clearPrivateAccount\(\)/);
 assert.match(MINI_JS,/state\.user=null;state\.serialVisible=false/);
 assert.match(MINI_JS,/set\('serialValue','•••• •••• •••• ••••'\)/);
 assert.match(MINI_JS,/\$\('revealSerial'\)\.disabled=true;\$\('copySerial'\)\.disabled=true/);
 assert.match(MINI_JS,/catch\(error\)\{\s*clearPrivateAccount\(\)/);
 assert.match(MINI_HTML,/id="retrySignIn"[^>]*hidden/);
 assert.match(MINI_JS,/\$\('retrySignIn'\)\.addEventListener\('click',start\)/);
 assert.match(MINI_HTML,/telegram-mini\.js\?v=20261028-mobile-v5/);
});
test('Persian translation covers account safety, MT5 onboarding, and error states',()=>{
 for(const label of [
  'data-tr="licenseNote"','data-tr="step1"','data-tr="step2"','data-tr="step3"','data-tr="step4"',
  'data-tr="help1"','data-tr="help2"','data-tr="help3"','data-tr="help4"',
  'data-tr="memberCaption"','data-tr="mt5Caption"','data-tr="eaCaption"',
  'data-tr="premiumNote"','data-tr="securityTitle"'
 ])assert.ok(MINI_HTML.includes(label),label);
 assert.match(MINI_JS,/مینی‌اپ را از داخل بات رسمی/);
 assert.match(MINI_JS,/کد فعال‌سازی/);
 assert.match(MINI_JS,/خطا|دوباره تلاش کنید|ارتباط برقرار نشد/);
 assert.doesNotThrow(()=>new Function(MINI_JS));
});

test('external mobile browser offers a verified Telegram bot link instead of pretending to authenticate',()=>{
 assert.match(MINI_HTML,/id="openBot"[^>]+hidden/);
 assert.match(MINI_HTML,/id="launchHint"[^>]+hidden/);
 assert.match(MINI_JS,/const health=await api\('\/api\/telegram\/health'\)/);
 assert.match(MINI_JS,/https:\/\/t\.me\/['+]/);
 assert.match(MINI_JS,/if\(typeof username==='string'&&\/\^\[A-Za-z0-9_\]\{5,32\}\$\/\.test\(username\)\)/);
 assert.match(MINI_JS,/await offerBotLaunch\(\)/);
 assert.match(MINI_JS,/if\(tg\?\.initData&&state\.telegramEnabled\)/);
 assert.ok(!MINI_JS.includes('initDataUnsafe'));
 assert.ok(MINI_HTML.includes('telegram-mini.js?v=20261028-mobile-v6'));
 assert.doesNotThrow(()=>new Function(MINI_JS));
});


test('official Telegram signed initData reference verifies cryptographically',async()=>{
 // Public reference vector from Telegram Mini Apps documentation, not a real user secret.
 const sampleToken='5768337691:AAH5YkoiEuPk8-FZa32hStHTqXiLPtAEhx8';
 const raw='query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22Vladislav%22%2C%22last_name%22%3A%22Kibenko%22%2C%22username%22%3A%22vdkfrost%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%7D&auth_date=1662771648&hash=c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2e2b2';
 const result=await inspectTelegramInitData(raw,sampleToken,1662771700*1000);
 assert.equal(result.reason,null);
 assert.deepEqual(result.principal,{id:'279058397',name:'vdkfrost'});
});
test('separate signed expiration from bad signature without exposing sensitive data',async()=>{
 assert.equal(TELEGRAM_INITDATA_MAX_AGE_SECONDS,21600);
 const now=Date.now(),at=String(Math.floor(now/1000)-2*60*60);
 const valid=await signed([['auth_date',at],['user',JSON.stringify({id:912345670,first_name:'Ada'})]]);
 const good=await inspectTelegramInitData(valid,token,now);
 assert.equal(good.reason,null);
 const expired=await inspectTelegramInitData(valid,token,now+7*60*60*1000);
 assert.equal(expired.principal,null);
 assert.equal(expired.reason,'EXPIRED');
 const bad=await inspectTelegramInitData(valid.replace('Ada','Mallory'),token,now);
 assert.equal(bad.principal,null);
 assert.equal(bad.reason,'BAD_SIGNATURE');
 const backend=readFileSync(new URL('../site/src/worker.mjs',import.meta.url),'utf8');
 assert.match(backend,/if\(validation\.reason==='EXPIRED'\)return fail\('TELEGRAM_INIT_DATA_EXPIRED',401\)/);
 assert.match(MINI_JS,/error\.message==='TELEGRAM_INIT_DATA_EXPIRED'/);
 assert.match(MINI_JS,/error\.message==='INVALID_TELEGRAM_INIT_DATA'/);
 assert.match(MINI_JS,/\/code/);
 assert.ok(!JSON.stringify(expired).includes('Ada'));
});


test('Telegram bot HMAC includes optional Ed25519 signature field in signed data',async()=>{
 const now=Date.now();
 const data=await signed([
  ['query_id','demo_query'],
  ['auth_date',String(Math.floor(now/1000)-5)],
  ['user',JSON.stringify({id:785643210,first_name:'Trading user'})],
  ['signature','eHVtbXlfcHVibGljLXNpZ25hdHVyZQ']
 ]);
 const ok=await inspectTelegramInitData(data,token,now);
 assert.equal(ok.reason,null);
 assert.equal(ok.principal.id,'785643210');
 assert.equal((await inspectTelegramInitData(data.replace('signature=eHV','signature=bad%2BeHV'),token,now)).reason,'BAD_SIGNATURE');
 const without=await signed([
  ['auth_date',String(Math.floor(now/1000))],
  ['user',JSON.stringify({id:785643210})]
 ]);
 assert.equal((await inspectTelegramInitData(without,token,now)).reason,null);
});
test('Mini App provides safe one-time bot /login code UI without exposing EA secret',()=>{
 for(const token of ['id="otpLogin"','id="otpForm"','id="otpInput"','id="otpSubmit"','id="otpStatus"',
  'autocomplete="one-time-code"','inputmode="text"','/login',
  'id="revealSerial"','id="copySerial"','telegram-mini.js?v=20261028-mobile-v6'])
   assert.ok(MINI_HTML.includes(token),token);
 for(const token of ["'/api/auth/telegram/code'","await api('/api/auth/telegram/code',{code})",
  "await refresh('session')","$('otpLogin').hidden=false",
  "code=$('otpInput').value.trim()","invalid, expired or already used",
  "event.preventDefault()"])
   assert.ok(MINI_JS.includes(token),token);
 assert.match(MINI_JS,/\\^\\[A-Za-z0-9_\\-\\]\\{8,64\\}\\$/);
 assert.ok(!MINI_JS.includes('initDataUnsafe'));
 assert.doesNotThrow(()=>new Function(MINI_JS));
 const source=readFileSync(new URL('../site/src/worker.mjs',import.meta.url),'utf8');
 assert.match(source,/if\(path==='\\/api\\/auth\\/telegram\\/code'&&req\.method==='POST'\)return loginFromTelegram\(req,env\)/);
 assert.match(source,/const consumed=await consumeCode\(env,'telegram',row\.target,code\)/);
 assert.match(source,/return json\(\{ok:true\},200,\{'set-cookie':await login\(env,user\.id\)\}\)/);
});
