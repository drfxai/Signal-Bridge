import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../site/src/worker.mjs';
import {SITE_HTML,SITE_CSS,SITE_JS} from '../site/src/ui.mjs';

test('premium site assets parse, include subscription tiers and no exposed secrets',()=>{
 assert.ok(SITE_HTML.includes('drfx')||SITE_HTML.includes('DrFX'));
 for(const price of ['$47','$165','$0']) assert.ok(SITE_HTML.includes(price));
 for(const required of ['authOverlay','portalOverlay','adminPanel','copySerial','loginTelegram'])
  assert.ok(SITE_HTML.includes('id="'+required+'"'),required);
 assert.ok(SITE_CSS.includes('@media(max-width:500px)'));
 assert.doesNotThrow(()=>new Function(SITE_JS));
 assert.doesNotMatch(SITE_HTML,/NOWPAYMENTS_(?:API_KEY|IPN_SECRET)/);
});

test('worker serves landing and styling without a database, but fails closed for API',async()=>{
 const page=await worker.fetch(new Request('https://drfx.company/'),{});
 assert.equal(page.status,200);
 assert.match(await page.text(),/SignalBridge/);
 const css=await worker.fetch(new Request('https://drfx.company/assets/app.css'),{});
 assert.equal(css.status,200);
 const api=await worker.fetch(new Request('https://drfx.company/api/me'),{});
 assert.equal(api.status,503);
 assert.equal((await api.json()).error,'DATABASE_UNAVAILABLE');
});

test('no payment entitlement without a verified IPN and provider configuration',async()=>{
 const env={DB:{},LICENSE_VAULT_KEY:null};
 const config=await worker.fetch(new Request('https://drfx.company/api/config'),env);
 assert.equal((await config.json()).payments,false);
 const res=await worker.fetch(new Request('https://drfx.company/api/payments/ipn',{method:'POST'}),env);
 assert.equal(res.status,503);
 assert.equal((await res.json()).error,'PAYMENTS_NOT_CONFIGURED');
});

test('migration schema includes identity, licensing, payment and audit records',async()=>{
 const {readFileSync}=await import('node:fs');
 const sql=readFileSync('site/migrations/0007_site_accounts.sql','utf8');
 for(const table of ['site_users','site_login_codes','site_sessions','site_licenses','site_orders','site_audit','site_rate_limits'])assert.match(sql,new RegExp('CREATE TABLE IF NOT EXISTS '+table));
});
