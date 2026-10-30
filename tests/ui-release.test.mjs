import test from 'node:test';
import assert from 'node:assert/strict';
import {SITE_HTML} from '../site/src/ui.mjs';
import {MINI_HTML} from '../site/src/telegram-mini.mjs';
import {UI_RELEASE,versionUiAssets} from '../site/src/ui-release.mjs';
test('website and mini app share current release URLs for their local UI assets',()=>{
 for(const html of [SITE_HTML,MINI_HTML]){
  const urls=[...html.matchAll(/(?:src|href)=["'](\/assets\/(?:app\.(?:js|css)|design\.js|i18n\.js|telegram-mini\.js|tailwind\.css)[^"']*)/g)].map(m=>m[1]);
  assert.ok(urls.length>=2);assert.ok(urls.every(url=>url.endsWith('?v='+UI_RELEASE)));
  assert.ok(html.includes('YOUR TRADING WORKSPACE · '+UI_RELEASE));
 }
});
test('cache versioning does not rewrite external scripts or media',()=>{
 const html='<script src="https://telegram.org/js/telegram-web-app.js?64"></script><img src="/media/scalper/poster.jpg">';
 assert.equal(versionUiAssets(html),html);
});
