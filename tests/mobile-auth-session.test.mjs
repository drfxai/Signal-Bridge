import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {SITE_JS,SITE_CSS} from '../site/src/ui.mjs';

const worker=readFileSync(new URL('../site/src/worker.mjs',import.meta.url),'utf8');

test('auth UX script compiles and shows animated accessible inline send statuses',()=>{
 assert.doesNotThrow(()=>new vm.Script(SITE_JS,{filename:'site-app.js'}));
 assert.match(SITE_JS,/emailSendFeedback\.setAttribute\('aria-live','polite'\)/);
 assert.match(SITE_JS,/insertAdjacentElement\('afterend',emailSendFeedback\)/);
 assert.match(SITE_JS,/showEmailFeedback\('sending'/);
 assert.match(SITE_JS,/showEmailFeedback\('sent'/);
 assert.match(SITE_JS,/showEmailFeedback\('error'/);
 assert.match(SITE_JS,/button\.disabled=true;/);
 assert.match(SITE_JS,/emailCode'\)\.focus\(\)/);
 assert.match(SITE_CSS,/@keyframes email-send-spin/);
 assert.match(SITE_CSS,/@media\(prefers-reduced-motion:reduce\)/);
});
test('mobile client portal restores an existing authenticated session without new OTP',()=>{
 assert.match(SITE_JS,/async function restoreSavedSession\(\)/);
 assert.match(SITE_JS,/const r=await call\('\/api\/me'\);state\.user=r\.user;syncLoginEntry\(\)/);
 assert.match(SITE_JS,/window\.addEventListener\('pageshow',event=>\{if\(event\.persisted\)restoreSavedSession\(\);\}\)/);
 assert.match(SITE_JS,/\$\('loginOpen'\)\.onclick=async\(\)=>\{if\(await refreshProfile\(\)\)show\('portalOverlay'\);\}/);
 assert.match(SITE_JS,/entry\.classList\.toggle\('session-active',!!state\.user\)/);
 assert.match(SITE_JS,/if\(e\.message==='UNAUTHENTICATED'\)/);
 assert.doesNotMatch(SITE_JS,/localStorage\.setItem\([^)]*(token|session|code)/i);
});
test('30-day remember-me uses revocable server sessions and Secure HttpOnly cookies',()=>{
 assert.match(worker,/const SESSION_DAYS=30/);
 assert.match(worker,/Secure; HttpOnly; SameSite=Lax; Max-Age=/);
 assert.match(worker,/INSERT INTO site_sessions[^\n]*datetime\('now','\+30 days'\)/);
 assert.match(worker,/UPDATE site_sessions SET expires_at=datetime\('now','\+30 days'\) WHERE token_hash=\?/);
 assert.match(worker,/const token=getCookie\(req,SESSION\)/);
 assert.match(worker,/set-cookie':cookie\(token\)/);
 assert.match(worker,/DELETE FROM site_sessions WHERE token_hash=\?/);
 assert.match(worker,/cookieClear\(\)/);
});
