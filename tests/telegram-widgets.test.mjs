import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {SIGNAL_BRIDGE_WIDGET_HTML,bridgeWidgetData} from '../site/src/telegram-widgets.mjs';

test('Signal Bridge native widget is within Telegram 10.4 limits',()=>{
 assert.ok(Buffer.byteLength(SIGNAL_BRIDGE_WIDGET_HTML)<=32768);
 assert.ok(deflateSync(Buffer.from(SIGNAL_BRIDGE_WIDGET_HTML),{level:9}).length<=4096);
 assert.match(SIGNAL_BRIDGE_WIDGET_HTML,/TelegramWidget/);
 assert.match(SIGNAL_BRIDGE_WIDGET_HTML,/request\('sb:refresh'\)/);
 assert.doesNotMatch(SIGNAL_BRIDGE_WIDGET_HTML,/<(?:input|iframe|textarea|script\s+src)/i);
 assert.doesNotMatch(SIGNAL_BRIDGE_WIDGET_HTML,/fetch\s*\(/);
});

test('widget data is read only and excludes credentials',()=>{
 const s=bridgeWidgetData({plan:'trial',licenseStatus:'active',expiresAt:'2027-01-01',accountStatus:'active'});
 assert.deepEqual(JSON.parse(s),{plan:'trial',license:'active',expires:'2027-01-01',account:'active'});
 assert.ok(Buffer.byteLength(s)<=1024);
 assert.doesNotMatch(s,/token|secret|email|activation_code/i);
 const weird=bridgeWidgetData({plan:'<img src=x>',licenseStatus:'x'.repeat(100)});
 assert.equal(JSON.parse(weird).plan,'<img src=x>');
 assert.equal(JSON.parse(weird).license.length,36);
 assert.ok(!SIGNAL_BRIDGE_WIDGET_HTML.includes('<img src=x>'));
});

test('existing secure bot webhook processes widget_query but never executes a trade',()=>{
 const worker=readFileSync(new URL('../site/src/worker.mjs',import.meta.url),'utf8');
 const setup=readFileSync(new URL('../scripts/configure-company-telegram-bot.mjs',import.meta.url),'utf8');
 assert.match(worker,/if\(data\.widget_query\)return signalBridgeWidgetQuery/);
 assert.match(worker,/String\(q\.chat\.id\)===String\(q\.from\.id\)/);
 assert.match(worker,/\['sb:refresh','sb:signal:refresh','sb:scalper:refresh'\]\.includes\(q\.data\)/);
 assert.match(worker,/telegram_id=\?/);
 assert.match(worker,/editMessageWidgetData/);
 assert.match(setup,/allowed_updates:\['message','callback_query','widget_query','my_chat_member'\]/);
});
