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
 assert.match(SITE_HTML,/Instrument Serif/);
 assert.ok(!SITE_CSS.includes('fonts.googleapis.com'));
});

