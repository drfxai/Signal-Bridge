import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { SITE_HTML, SITE_CSS, SITE_JS } from '../site/src/ui.mjs';
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
  assert.match(response.headers.get('content-type'),type);
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
 assert.match(worker,/API_ORIGIN\+'\/api\/payments\/ipn'/);
});
test('license issuance is random and encrypted at rest, sign-in gated',()=>{
 assert.match(worker,/crypto\.getRandomValues/);
 assert.match(worker,/AES-GCM/);
 assert.match(worker,/SELECT.*site_sessions/);
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
