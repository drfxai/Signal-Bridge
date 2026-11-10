import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {deflateSync} from 'node:zlib';
import {SIGNAL_HISTORY_WIDGET_HTML,signalHistoryWidgetData} from '../site/src/telegram-signal-widget.mjs';

const sample={
 normalized_json:JSON.stringify({schema_version:'1.0',source_type:'tradingview',
 action:'OPEN',side:'BUY',symbol:'XAUUSD',
 order:{type:'MARKET',reference_price:2645,stop_loss:2635,
  volume:{mode:'FIXED_LOTS',value:0.01},take_profits:[2653,2660,2670]}}),
 received_at:'2026-11-10 14:00:00'
};

test('last-signal widget fits Telegram 10.4 profile and size',()=>{
 assert.ok(Buffer.byteLength(SIGNAL_HISTORY_WIDGET_HTML)<=32768);
 assert.ok(deflateSync(Buffer.from(SIGNAL_HISTORY_WIDGET_HTML),{level:9}).byteLength<=4096);
 assert.match(SIGNAL_HISTORY_WIDGET_HTML,/TelegramWidget/);
 assert.match(SIGNAL_HISTORY_WIDGET_HTML,/request\('sb:signal:refresh'\)/);
 assert.doesNotMatch(SIGNAL_HISTORY_WIDGET_HTML,/<(?:input|textarea|iframe|script\s+src)/i);
 assert.doesNotMatch(SIGNAL_HISTORY_WIDGET_HTML,/fetch\s*\(/);
 assert.match(SIGNAL_HISTORY_WIDGET_HTML,/not live price/i);
});

test('registered TradingView alert uses broker-unverified server record without invented prices',()=>{
 const obj=JSON.parse(signalHistoryWidgetData(sample));
 assert.equal(obj.symbol,'XAUUSD');
 assert.equal(obj.side,'BUY');
 assert.equal(obj.sl,2635);
 assert.deepEqual(obj.tps,[2653,2660,2670]);
 assert.equal(obj.entry,2645);
 assert.equal(obj.received,sample.received_at);
 assert.equal(obj.empty,false);
 assert.ok(Buffer.byteLength(signalHistoryWidgetData(sample))<=1024);
});

test('missing, malformed and stale-free empty data are visibly empty, not live',()=>{
 assert.deepEqual(JSON.parse(signalHistoryWidgetData(null)),{empty:true});
 assert.deepEqual(JSON.parse(signalHistoryWidgetData({normalized_json:'{bad'})),{empty:true});
 assert.deepEqual(JSON.parse(signalHistoryWidgetData({normalized_json:'{}'})),{empty:true});
 const none={...sample,normalized_json:JSON.stringify({side:'HOLD',symbol:'XAUUSD',order:{stop_loss:1,take_profits:[]}})};
 assert.deepEqual(JSON.parse(signalHistoryWidgetData(none)),{empty:true});
});

test('the latest alert query is tenant-scoped and read-only',()=>{
 const worker=readFileSync(new URL('../site/src/worker.mjs',import.meta.url),'utf8');
 assert.match(worker,/FROM received_signals WHERE tenant_id=\?/);
 assert.match(worker,/sb:signal:refresh/);
 assert.match(worker,/sendLatestSignalWidget\(env,chatId,user\)/);
 assert.match(worker,/editMessageWidgetData/);
 assert.match(worker,/!user\|\|user.status!=='active'/);
});
