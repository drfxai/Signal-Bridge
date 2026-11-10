import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {SCALPER_WIDGET_HTML,scalperWidgetData} from '../site/src/telegram-scalper-widget.mjs';

test('Scalper Pro widget follows Telegram native HTML limits',()=>{
 assert.ok(Buffer.byteLength(SCALPER_WIDGET_HTML)<=32768);
 assert.ok(deflateSync(Buffer.from(SCALPER_WIDGET_HTML),{level:9}).length<=4096);
 assert.match(SCALPER_WIDGET_HTML,/TelegramWidget/);
 assert.match(SCALPER_WIDGET_HTML,/sb:scalper:refresh/);
 assert.doesNotMatch(SCALPER_WIDGET_HTML,/fetch\s*\(/);
});
test('Scalper issuance state excludes activation code and MT5 identifier',()=>{
 const data=scalperWidgetData({plan:'scalper_3m',days:90,created_at:'2026-11-10 11:30:00',total:2,encrypted_key:'secret-key',account_login:'123456'});
 const state=JSON.parse(data);
 assert.deepEqual(state,{total:2,plan:'scalper_3m',days:90,issued:'2026-11-10 11:30:00'});
 assert.doesNotMatch(data,/secret-key|123456|encrypted_key|account_login/);
 assert.deepEqual(JSON.parse(scalperWidgetData(null)),{total:0,plan:null,days:null,issued:null});
 assert.ok(Buffer.byteLength(data)<=1024);
});
test('Scalper widget uses tenant-owned issuance rows and no write operations',()=>{
 const worker=readFileSync(new URL('../site/src/worker.mjs',import.meta.url),'utf8');
 assert.match(worker,/SELECT plan,days,created_at,\(SELECT COUNT\(\*\) FROM scalper_keys WHERE user_id=\?\)/);
 assert.match(worker,/FROM scalper_keys WHERE user_id=\? ORDER BY created_at DESC LIMIT 1/);
 assert.match(worker,/sb:scalper:refresh/);
 assert.match(worker,/sendScalperWidget\(env,chatId,user\)/);
});
