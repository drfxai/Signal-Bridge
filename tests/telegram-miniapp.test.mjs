import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyTelegramInitData } from '../site/src/telegram-auth.mjs';
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
 const joined=[...new URLSearchParams(params)].filter(([k])=>k!=='hash'&&k!=='signature')
   .sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0).map(([k,v])=>k+'='+v).join('\n');
 const hash=Array.from(await hmac(key,joined),b=>b.toString(16).padStart(2,'0')).join('');
 const p=new URLSearchParams(params);p.append('hash',hash);return p.toString();
};

test('server validates authentic Telegram Mini App HMAC, identity and expiry',async()=>{
 const now=Date.now(),at=String(Math.floor(now/1000)-60);
 const data=await signed([['user',JSON.stringify({id:912345670,first_name:'Ada',username:'secure_trader'})],['query_id','AA_demo'],['auth_date',at]]);
 const identity=await verifyTelegramInitData(data,token,now);
 assert.deepEqual(identity,{id:'912345670',name:'secure_trader'});
 assert.equal(await verifyTelegramInitData(data,token,now+16*60*1000),null);
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
 assert.match(source,/verifyTelegramInitData\(body\.init_data,env\.TELEGRAM_BOT_TOKEN\)/);
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
