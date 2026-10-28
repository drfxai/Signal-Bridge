import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SITE_HTML, SITE_CSS, SITE_JS, DESIGN_JS } from '../site/src/ui.mjs';
import handler from '../site/src/worker.mjs';

const worker=fs.readFileSync(new URL('../site/src/worker.mjs',import.meta.url),'utf8');
const migration=fs.readFileSync(new URL('../site/migrations/0007_site_accounts.sql',import.meta.url),'utf8');

test('site modules compile; JS client is valid JavaScript',()=>{
 assert.doesNotThrow(()=>new Function(SITE_JS));
 assert.equal(typeof handler.fetch,'function');
 assert.match(SITE_HTML,/<!doctype html>/i);
 assert.match(SITE_HTML,/52 premium indicators/i);
 assert.match(SITE_HTML,/\$47/);
 assert.match(SITE_HTML,/\$165/);
 assert.match(SITE_CSS,/prefers-reduced-motion/);
 assert.match(SITE_HTML,/portalOverlay/);
 assert.match(SITE_HTML,/adminPanel/);
});
test('site runtime exposes marketing HTML and assets without database',async()=>{
 for(const [path,type] of [['/','text/html'],['/assets/app.css','text/css'],['/assets/app.js','text/javascript']]){
  const response=await handler.fetch(new Request('https://drfx.company'+path),{});
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type'),new RegExp(type));
 }
});
test('API fails closed without required D1',async()=>{
 const r=await handler.fetch(new Request('https://drfx.company/api/me'),{});
 assert.equal(r.status,503);
});
test('no live checkout when payment keys are absent',()=>{
 assert.match(worker,/PAYMENTS_NOT_CONFIGURED/);
 assert.match(worker,/NOWPAYMENTS_IPN_SECRET/);
 assert.match(worker,/x-nowpayments-sig/);
 assert.match(worker,/HMAC/);
 assert.match(worker,/payment_status!=='finished'/);
 assert.match(worker,/site_orders WHERE id=\? AND status='pending'/);
 assert.match(worker,/env.DB.batch/);
 assert.match(worker,/url.hostname===\x27nowpayments.io\x27/);
 assert.match(worker,/API_ORIGIN\+'\/api\/payments\/ipn'/);
});
test('license issuance is random and encrypted at rest, sign-in gated',()=>{
 assert.match(worker,/crypto\.getRandomValues/);
 assert.match(worker,/AES-GCM/);
 assert.match(worker,/FROM site_sessions/);
 assert.match(worker,/__Host-drfx_session/);
 assert.match(worker,/SameSite=Lax/);
 assert.match(worker,/sha\(code\)/);
 assert.match(migration,/token_hash TEXT PRIMARY KEY/);
 assert.match(migration,/site_licenses/);
 assert.match(migration,/site_orders/);
});
test('admin operations are role gated and email sign-in verifies code',()=>{
 assert.match(worker,/user\.role!=='admin'/);
 assert.match(worker,/consumeCode\(env,'email'/);
 assert.match(worker,/ADMIN_EMAIL/);
 assert.match(worker,/telegramWebhook/);
});

test('Telegram bot exposes admin user lookup, grant and suspension operations behind admin gate',()=>{
 for(const cmd of ['/users','/detail','/grant','/suspend','/resume','/revoke']) assert.ok(worker.includes("command==='"+cmd+"'")||worker.includes("'/"+cmd.slice(1)+"'"),cmd);
 assert.match(worker,/user.role==='admin'/);
 assert.match(worker,/botSend/);
});


test('supplied cinematic design is wired to production actions',()=>{
 assert.ok(SITE_HTML.includes('Precision.'));
 assert.ok(SITE_HTML.includes('Without compromise.'));
 assert.ok(SITE_HTML.includes('id="signalEngineCanvas"'));
 assert.ok(SITE_HTML.includes('id="globeCanvas"'));
 assert.ok(SITE_HTML.includes('id="network"'));
 assert.ok(SITE_HTML.includes('id="plans"'));
 assert.ok(SITE_HTML.includes('data-plan="trial"'));
 assert.ok(SITE_HTML.includes('data-plan="quarterly"'));
 assert.ok(SITE_HTML.includes('data-plan="annual"'));
 assert.ok(SITE_HTML.includes('$0'));
 assert.ok(SITE_HTML.includes('$47'));
 assert.ok(SITE_HTML.includes('$165'));
 assert.ok(SITE_HTML.includes('cinema-card'));
 assert.ok(SITE_CSS.includes('.overlay'));
 assert.ok(!SITE_HTML.includes('completeDemoLogin'));
 assert.ok(!SITE_HTML.includes('regenerateSerialKey'));
 assert.doesNotThrow(()=>new Function(DESIGN_JS));
});
test('first animation removed and second reimplemented at native display resolution',async()=>{
 assert.equal((SITE_HTML.match(/<video /g)||[]).length,0);
 assert.ok(!SITE_HTML.includes('48356-globe.mp4'));
 assert.ok(!SITE_HTML.includes('48355-connections.mp4'));
 assert.ok(!worker.includes("from './media.mjs'"));
 assert.ok(!worker.includes('serveVideo(request'));
 assert.ok(SITE_JS.includes('devicePixelRatio'));
 assert.ok(SITE_JS.includes('requestAnimationFrame'));
 assert.ok(SITE_JS.includes('ResizeObserver'));
 assert.ok(SITE_JS.includes('IntersectionObserver'));
 assert.ok(SITE_JS.includes('prefers-reduced-motion'));
 assert.ok(SITE_JS.includes('navigator.connection?.saveData'));
 assert.ok(SITE_JS.includes('visibilitychange'));
 assert.ok(SITE_JS.includes('quadraticCurveTo'));
 const noOld=await handler.fetch(new Request('https://drfx.company/assets/media/48356-globe.mp4'),{});
 assert.equal(noOld.status,404);
});
test('preserves account, pricing, MT5 setup and admin experience',()=>{
 for(const id of ['authOverlay','portalOverlay','adminPanel','sendEmail','verifyEmail','loginTelegram','serial','copySerial','rotateSerial','linkTelegram','adminRows','bottomJoin','loginOpen','lang'])assert.ok(SITE_HTML.includes('id="'+id+'"'),id);
 for(const route of ['/api/auth/email/start','/api/auth/email/verify','/api/auth/telegram/code','/api/me','/api/checkout'])assert.ok(worker.includes(route),route);
 assert.ok(SITE_HTML.includes('https://signalbridge.drfx.online'));
 assert.ok(SITE_CSS.includes('body[dir=rtl]'));
});


test('JS and CSS assets are cache-safe across production UI deploys',async()=>{
 const html=await handler.fetch(new Request('https://drfx.company/'),{});
 assert.equal(html.status,200);
 assert.match(html.headers.get('cache-control'),/no-store/);
 const markup=await html.text();
 assert.match(markup,/\/assets\/app\.css\?v=[0-9a-z-]+/);
 assert.match(markup,/\/assets\/app\.js\?v=[0-9a-z-]+/);
 for(const p of ['/assets/app.css','/assets/app.js']){
  const response=await handler.fetch(new Request('https://drfx.company'+p+'?v=20261028-fix-cache-navigation'),{});
  assert.equal(response.status,200);
  assert.match(response.headers.get('cache-control'),/no-cache/);
 }
});
test('mobile navigation is available, accessible, closable and translated',()=>{
 assert.ok(SITE_HTML.includes('id="mobileNav"'));
 assert.ok(SITE_HTML.includes('id="menuToggle"'));
 assert.ok(SITE_HTML.includes('aria-controls="mobileNav"'));
 assert.ok(SITE_HTML.includes('aria-expanded="false"'));
 assert.ok(SITE_HTML.includes('href="#plans"'));
 assert.ok(SITE_HTML.includes('href="#how"'));
 assert.match(SITE_CSS,/\.overlay\.hidden/);
 assert.match(SITE_CSS,/\[hidden\]/);
 assert.match(SITE_JS,/function closeMobileNav/);
 assert.match(SITE_JS,/mobileNav\.querySelectorAll\('a'\)/);
 assert.ok(SITE_JS.includes("document.querySelectorAll('[data-i=\"'+key+'\"]')"));
});
test('pricing handoff and sign out are guarded against stale auth states',()=>{
 assert.match(SITE_JS,/state\.plan!=='trial'/);
 assert.match(SITE_JS,/await checkout\(selected\)/);
 assert.ok(SITE_JS.includes("url.hostname==='nowpayments.io'||url.hostname.endsWith('.nowpayments.io')"));
 assert.ok(!SITE_JS.includes("!url.hostname.endsWith('nowpayments.io')"));
 assert.match(SITE_JS,/Logout request could not be confirmed/);
 assert.match(SITE_HTML,/Instrument(?:\+| )Serif/);
 assert.ok(!SITE_CSS.includes('fonts.googleapis.com'));
});


test('approved HTML is production-ready with self-hosted Tailwind and real membership controls',async()=>{
 const { TAILWIND_CSS } = await import('../site/src/tailwind.mjs');
 assert.ok(TAILWIND_CSS.length>18000);
 assert.match(TAILWIND_CSS,/\.bg-obsidian/);
 assert.match(TAILWIND_CSS,/\.text-gold/);
 assert.ok(SITE_HTML.includes('/assets/tailwind.css?v=20261028-cinematic'));
 assert.ok(!SITE_HTML.includes('cdn.tailwindcss.com'));
 assert.ok(!SITE_HTML.includes('tailwind.config'));
 assert.ok(!SITE_JS.includes('simulateAuthCodeSend'));
 assert.ok(!DESIGN_JS.includes('completeDemoLogin'));
 assert.ok(!DESIGN_JS.includes('regenerateSerialKey'));
 assert.ok(SITE_HTML.includes('data-plan="quarterly"'));
 assert.ok(SITE_HTML.includes('data-plan="annual"'));
 assert.ok(SITE_HTML.includes('SIMULATED'));
 assert.ok(SITE_HTML.includes('DEMO CHART'));
 assert.ok(DESIGN_JS.includes('DEMO · XAUUSD BUY'));
 const response=await handler.fetch(new Request('https://drfx.company/assets/tailwind.css'),{});
 assert.equal(response.status,200);
 assert.match(response.headers.get('content-type'),/text\/css/);
 assert.ok((await response.text()).length>18000);
 assert.ok(!worker.includes('cdn.tailwindcss.com'));
});

test('live feature readiness is reflected honestly in account and checkout UI',async()=>{
 assert.ok(SITE_HTML.includes('id="serviceReadiness"'));
 assert.ok(SITE_HTML.includes('id="checkoutReadiness"'));
 assert.match(SITE_JS,/loadServiceReadiness/);
 assert.match(SITE_JS,/\/api\/config/);
 assert.match(SITE_JS,/readiness\.payments===false/);
 assert.match(SITE_JS,/\$\('sendEmail'\)\.disabled=!readiness\.email/);
 assert.match(SITE_JS,/Account service is temporarily unavailable/);
 assert.match(SITE_JS,/state\.user=null;hide\('portalOverlay'\)/);
 assert.ok(SITE_HTML.includes('loaderFallback'));
 const r=await handler.fetch(new Request('https://drfx.company/api/config'),{DB:{},LICENSE_VAULT_KEY:'configured-but-not-shared'});
 assert.equal(r.status,200);
 assert.deepEqual(await r.json(),{ok:true,email:false,telegram:false,payments:false,licensing:true});
});
test('cinematic render loops reuse canvas pixel buffers rather than reallocating at every frame',()=>{
 assert.match(DESIGN_JS,/indCanvas\.width !== wpx/);
 assert.match(DESIGN_JS,/globeCanvas\.width !== wpx/);
 assert.match(DESIGN_JS,/Math\.min\(window\.devicePixelRatio \|\| 1, 2\)/);
});


test('website explicitly distinguishes one-time Telegram login and EA activation serial',async()=>{
 const {DESIGN_HTML}=await import('../site/src/design.mjs');
 assert.ok(DESIGN_HTML.includes('Sign in with your existing Signal Bridge account'));
 assert.ok(DESIGN_HTML.includes('Send <code>/login</code> — not <code>/code</code>'));
 assert.ok(DESIGN_HTML.includes('16-character'));
 assert.ok(DESIGN_HTML.includes('43-character EA activation code'));
 assert.ok(DESIGN_HTML.includes('id="openLoginBot"'));
 assert.ok(DESIGN_HTML.includes('id="tgCodeHint"'));
 assert.ok(SITE_CSS.includes('.telegram-login-guide'));
 assert.ok(SITE_CSS.includes('@media(max-width:600px)'));
 assert.ok(SITE_CSS.includes('font-size:16px;min-height:48px'));
 assert.ok(SITE_JS.includes('function validateWebsiteLoginCode()'));
 assert.ok(SITE_JS.includes('code.length===43'));
 assert.ok(SITE_JS.includes('code.length!==16'));
 assert.ok(SITE_JS.includes("switchAuthTab('telegram')"));
 assert.ok(SITE_JS.includes('loadTelegramBotLink()'));
 assert.ok(SITE_JS.includes("'/api/telegram/health'"));
 assert.ok(SITE_JS.includes("'/api/auth/telegram/code'"));
 assert.ok(SITE_JS.includes("$('tgCode').value=''"));
 assert.doesNotThrow(()=>new Function(SITE_JS));
});

test('Telegram website login refuses a 43-character EA serial before querying login tokens',async()=>{
 // Rate-limit-only D1 stub. A 43-char serial must be rejected before login-code lookup.
 const queries=[];
 const DB={prepare(sql){
  queries.push(sql);
  return {bind(){return this},async run(){return {success:true}},async first(){return {requests:1}}};
 }};
 const response=await handler.fetch(new Request('https://drfx.company/api/auth/telegram/code',{
  method:'POST',headers:{origin:'https://drfx.company','content-type':'application/json'},
  body:JSON.stringify({code:'A'.repeat(43)})
 }),{DB});
 assert.equal(response.status,400);
 assert.deepEqual(await response.json(),{ok:false,error:'EA_CODE_NOT_LOGIN_CODE'});
 assert.equal(queries.filter(x=>x.includes('site_login_codes')).length,0);
});
test('Telegram website sign-in bot issues dedicated random 16-character OTP distinct from EA serial',()=>{
 assert.ok(worker.includes('const code=b64u(rand(12))'));
 assert.ok(worker.includes('16-character code, one time, 10 minutes'));
 assert.ok(worker.includes('EA_CODE_NOT_LOGIN_CODE'));
 assert.ok(worker.includes('INVALID_LOGIN_CODE_FORMAT'));
 assert.ok(worker.includes("purpose='telegram'"));
 assert.ok(worker.includes('used_at IS NULL'));
 assert.ok(worker.includes('__Host-drfx_session'));
});


test('mobile header and premium administration dashboard use responsive, role-protected controls',async()=>{
 const {DESIGN_HTML}=await import('../site/src/design.mjs');
 for(const id of ['adminPanel','adminRows','adminStats','adminSearch','runConnectionCheck','runDemoTrade','personalWebhookUrl','createWebhook','rotateWebhook','copyWebhook'])assert.ok(DESIGN_HTML.includes('id="'+id+'"'),id);
 assert.ok(DESIGN_HTML.includes('Operations Center'));
 assert.ok(DESIGN_HTML.includes('data-admin-only'));
 assert.ok(SITE_CSS.includes('@media(max-width:850px)'));
 assert.ok(SITE_CSS.includes('header.sticky>div'));
 assert.ok(SITE_CSS.includes('.admin-stats'));
 assert.ok(SITE_CSS.includes('.portal-bridge-tools'));
 assert.ok(SITE_JS.includes("u.role==='admin'"));
 assert.ok(SITE_JS.includes("'/api/webhook/create'"));
 assert.ok(SITE_JS.includes("'/api/webhook/rotate'"));
 assert.ok(SITE_JS.includes("'/api/connection/check'"));
 assert.ok(SITE_JS.includes('const d=check.diagnostic'));
 assert.doesNotThrow(()=>new Function(SITE_JS));
});
test('user TradingView credentials are encrypted, isolated and created in dry-run',()=>{
 assert.ok(worker.includes('site_tradingview_webhooks'));
 assert.ok(worker.includes('FROM site_tradingview_webhooks w'));
 assert.ok(worker.includes('c.tenant_id=w.user_id'));
 assert.ok(worker.includes("delivery_mode) VALUES (?,?,'tradingview',?,'active',?,'dry_run')"));
 assert.ok(worker.includes('encrypted_token'));
 assert.ok(worker.includes('encryptCode(env,token)'));
 assert.ok(worker.includes('decryptCode(env,row.encrypted_token,row.nonce)'));
 assert.ok(worker.includes("path==='/api/webhook/create'"));
 assert.ok(worker.includes("path==='/api/webhook/rotate'"));
 assert.ok(worker.includes('previous webhook URL revoked'));
 assert.ok(worker.includes('uid('+"'tv'"+')'));
});
test('connection check never claims active socket or silently creates a demo trade',async()=>{
 assert.ok(worker.includes("path==='/api/connection/check'"));
 assert.ok(worker.includes("live_socket_verified:false,trade_executed:false"));
 assert.ok(worker.includes("DEMO_TRADE_TEST_REQUIRES_UPDATED_EA"));
 assert.ok(SITE_HTML.includes('DEMO · Coming with EA update'));
 const p=new Request('https://drfx.company/api/connection/test-demo',{method:'POST',headers:{origin:'https://drfx.company'}});
 const r=await handler.fetch(p,{});
 assert.equal(r.status,503); // no D1 => endpoint cannot trade or authenticate
});

test('last connection ATTEMPT is never misrepresented as live broker execution',()=>{
 assert.ok(worker.includes('AS last_connection_attempt'));
 assert.ok(worker.includes('last_connection_attempt:row.last_connection_attempt||null'));
 assert.ok(worker.includes('live_socket_verified:false,trade_executed:false'));
 assert.ok(SITE_JS.includes('d.last_connection_attempt'));
 assert.ok(SITE_JS.includes('Last recorded EA connection attempt'));
 assert.ok(SITE_JS.includes("$('personalWebhookUrl').textContent='No webhook created'"));
});
