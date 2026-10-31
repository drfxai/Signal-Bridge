import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {SITE_HTML,SITE_CSS,SITE_JS} from '../site/src/ui.mjs';
import {MINI_HTML,MINI_JS} from '../site/src/telegram-mini.mjs';

test('responsive website exposes exactly two account actions: unified authentication and portal',()=>{
 for(const id of ['loginOpen','clientPortalOpen','mobileAuthOpen','mobilePortalOpen']){
  assert.equal((SITE_HTML.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
 assert.match(SITE_HTML,/id="loginOpen"[^>]*>[\s\S]*?Sign In \/ Sign Up/);
 assert.match(SITE_HTML,/id="clientPortalOpen"[^>]*>[\s\S]*?Client Portal/);
 assert.match(SITE_HTML,/id="mobileAuthOpen"[^>]*>[\s\S]*?Sign In \/ Sign Up/);
 assert.match(SITE_HTML,/id="mobilePortalOpen"[^>]*>[\s\S]*?Client Portal/);
 assert.match(SITE_CSS,/\.drfx-mobile-account-actions\{display:none/);
 assert.match(SITE_CSS,/@media\(max-width:850px\)/);
 assert.match(SITE_CSS,/\.drfx-mobile-account-actions\{position:relative/);
 assert.match(SITE_CSS,/@media\(min-width:851px\)/);
 assert.doesNotThrow(()=>new vm.Script(SITE_JS,{filename:'site.js'}));
 assert.match(SITE_JS,/for\(const id of \['loginOpen','mobileAuthOpen'\]\)/);
 assert.match(SITE_JS,/for\(const id of \['clientPortalOpen','mobilePortalOpen'\]\)/);
 assert.match(SITE_JS,/if\(state\.user\)openPortal\(\);else openAuth\(\)/);
 assert.match(SITE_JS,/get\('auth'\)==='1'/);
});
test('Telegram Mini App has unified sign in/up and an authenticated Client Portal action',()=>{
 for(const id of ['miniAuthAction','miniClientPortalAction'])
  assert.equal((MINI_HTML.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 assert.match(MINI_HTML,/id="miniAuthAction"[^>]*href="https:\/\/drfx\.company\/\?auth=1"/);
 assert.match(MINI_HTML,/id="miniClientPortalAction"/);
 assert.match(MINI_HTML,/\.mini-account-actions\{display:grid;grid-template-columns:1fr 1fr/);
 assert.doesNotThrow(()=>new vm.Script(MINI_JS,{filename:'mini.js'}));
 assert.match(MINI_JS,/if\(state\.user\)\{show\('license'\);return;\}/);
 assert.match(MINI_JS,/await offerBotLaunch\(\)/);
});
