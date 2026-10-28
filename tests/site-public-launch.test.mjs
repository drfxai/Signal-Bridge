import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {TRANSLATIONS,LOCALES,I18N_JS} from '../site/src/i18n.mjs';
import {PROMO_ASSETS,PROMO_NAMES} from '../site/src/promo.mjs';
import {SITE_HTML,SITE_JS} from '../site/src/ui.mjs';
import {MINI_HTML,MINI_JS} from '../site/src/telegram-mini.mjs';
import handler from '../site/src/worker.mjs';

test('Public release has license, security policy and no misleading open-source claim',()=>{
 for(const file of ['LICENSE','SECURITY.md','CONTRIBUTING.md','docs/PUBLIC_RELEASE_CHECKLIST.md'])assert.ok(existsSync(new URL('../'+file,import.meta.url)),file);
 const license=readFileSync(new URL('../LICENSE',import.meta.url),'utf8');
 assert.match(license,/source-available/);
 assert.match(license,/All rights reserved/);
 const readme=readFileSync(new URL('../README.md',import.meta.url),'utf8');
 assert.match(readme,/DEMO-only execution/);
 assert.match(readme,/Product Gallery/);
 assert.match(readme,/assets\/promo\/dashboard\.svg/);
 assert.match(readme,/assets\/promo\/mobile\.svg/);
 assert.match(readme,/assets\/promo\/admin\.svg/);
});
test('All website and Mini App language keys have complete translations in 6 locales',()=>{
 assert.deepEqual(LOCALES,['en','fa','ar','tr','ru','hi']);
 const en=Object.keys(TRANSLATIONS.en).sort();
 assert.ok(en.length>=90);
 for(const lang of LOCALES){
  assert.deepEqual(Object.keys(TRANSLATIONS[lang]).sort(),en,lang);
  assert.ok(Object.values(TRANSLATIONS[lang]).every(v=>typeof v==='string'&&v.trim().length>0),lang);
 }
 const siteKeys=[...SITE_HTML.matchAll(/data-i18n="([^"]+)"/g)].map(x=>x[1]);
 const miniKeys=[...MINI_HTML.matchAll(/data-tr="([^"]+)"/g)].map(x=>x[1]);
 assert.ok(siteKeys.length>=30);
 assert.ok(miniKeys.length>=40);
 for(const lang of LOCALES){
  for(const key of [...siteKeys,...miniKeys])assert.ok(TRANSLATIONS[lang][key],lang+'/'+key);
 }
 assert.match(I18N_JS,/window\.DrFXI18N/);
 assert.match(SITE_HTML,/id="lang"[^>]*><option value="hi">HI<\/option>/);
 assert.match(MINI_HTML,/id="langToggle"[^>]*><option value="hi">HI<\/option>/);
 assert.match(SITE_HTML,/\/assets\/i18n\.js/);
 assert.match(MINI_HTML,/\/assets\/i18n\.js/);
 assert.match(SITE_JS,/document\.documentElement\.dir=\['fa','ar'\]/);
 assert.match(MINI_JS,/document\.documentElement\.dir=\['fa','ar'\]/);
 assert.ok(!MINI_JS.includes('initDataUnsafe'));
 assert.doesNotThrow(()=>new Function(SITE_JS));
 assert.doesNotThrow(()=>new Function(MINI_JS));
});
test('Three premium promotional image assets render without fake PnL, fills or execution metrics',async()=>{
 assert.deepEqual([...PROMO_NAMES].sort(),['admin.svg','dashboard.svg','mobile.svg']);
 assert.match(SITE_HTML,/id="product-gallery"/);
 for(const name of PROMO_NAMES){
  const svg=PROMO_ASSETS[name];
  assert.match(svg,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg,/CONCEPT PREVIEW — NO LIVE PERFORMANCE DATA/);
  assert.ok(!svg.includes('<script'));
  assert.ok(!svg.includes('99.9%'));
  assert.ok(!svg.includes('0.8s'));
  assert.ok(SITE_HTML.includes('/assets/promo/'+name));
  const res=await handler.fetch(new Request('https://drfx.company/assets/promo/'+name),{});
  assert.equal(res.status,200,name);
  assert.match(res.headers.get('content-type'),/image\/svg\+xml/);
  assert.match(await res.text(),/CONCEPT PREVIEW/);
 }
 const forbidden=await handler.fetch(new Request('https://drfx.company/assets/promo/not-real.svg'),{});
 assert.equal(forbidden.status,404);
 const i18n=await handler.fetch(new Request('https://drfx.company/assets/i18n.js'),{});
 assert.equal(i18n.status,200);
 assert.match(await i18n.text(),/DrFXI18N/);
});
