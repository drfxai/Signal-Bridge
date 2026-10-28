import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SITE_HTML, SITE_CSS, SITE_JS } from '../site/src/ui.mjs';
import handler from '../site/src/worker.mjs';
import { MEDIA_B64, MEDIA_INFO } from '../site/src/media.mjs';
import { createHash } from 'node:crypto';

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

test('two globe motion placements are lazy, muted, mobile-safe and reduced-motion-aware',()=>{
 const videos=SITE_HTML.match(/<video /g)||[];
 assert.equal(videos.length,2);
 assert.ok(SITE_HTML.includes('data-video-source="/assets/media/48356-globe.mp4"'));
 assert.ok(SITE_HTML.includes('data-video-source="/assets/media/48355-connections.mp4"'));
 assert.equal((SITE_HTML.match(/muted loop playsinline preload="none"/g)||[]).length,2);
 assert.match(SITE_JS,/IntersectionObserver/);
 assert.match(SITE_JS,/prefers-reduced-motion/);
 assert.match(SITE_JS,/visibilitychange/);
 assert.match(SITE_CSS,/networkFallbackPulse/);
});

test('real uploaded globe clips exactly match optimized original binary hashes',()=>{
 const expected=['48356-globe.mp4','48355-connections.mp4'];
 assert.deepEqual(Object.keys(MEDIA_B64),expected);
 for(const name of expected){
  const bytes=Buffer.from(MEDIA_B64[name],'base64');
  assert.equal(bytes.length,MEDIA_INFO[name].bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),MEDIA_INFO[name].sha256);
  assert.equal(bytes.subarray(4,8).toString('ascii'),'ftyp');
 }
});
test('Cloudflare video routes return actual MP4 bytes, caching and byte range',async()=>{
 for(const name of ['48356-globe.mp4','48355-connections.mp4']){
  const url='https://drfx.company/assets/media/'+name;
  const full=await handler.fetch(new Request(url),{});
  assert.equal(full.status,200);
  assert.equal(full.headers.get('content-type'),'video/mp4');
  assert.equal(full.headers.get('accept-ranges'),'bytes');
  assert.equal((await full.arrayBuffer()).byteLength,MEDIA_INFO[name].bytes);
  const partial=await handler.fetch(new Request(url,{headers:{range:'bytes=0-15'}}),{});
  assert.equal(partial.status,206);
  assert.equal(partial.headers.get('content-range'),'bytes 0-15/'+MEDIA_INFO[name].bytes);
  assert.equal((await partial.arrayBuffer()).byteLength,16);
  const head=await handler.fetch(new Request(url,{method:'HEAD'}),{});
  assert.equal(head.status,200);
  assert.equal(head.headers.get('content-length'),String(MEDIA_INFO[name].bytes));
  const invalid=await handler.fetch(new Request(url,{headers:{range:'bytes=999999999-'}}),{});
  assert.equal(invalid.status,416);
 }
});
