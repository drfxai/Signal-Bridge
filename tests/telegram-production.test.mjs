import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTelegramTrade} from '../worker/src/telegram-parser.mjs';

test('production Telegram parser accepts compact English signal',()=>{
 const p=parseTelegramTrade('BUY XAUUSD LOT 0.01 SL 2700 TP1 2720 TP2 2730 TP3 2740',0);
 assert.equal(p.ok,true);assert.equal(p.signal.side,'BUY');assert.equal(p.signal.symbol,'XAUUSD');assert.equal(p.signal.order.volume.value,0.01);
});

test('production Telegram parser accepts Persian labels and digits deterministically',()=>{
 const p=parseTelegramTrade('طلا خرید\nلات ۰.۰۱\nحد ضرر ۲۷۰۰\nهدف 1 ۲۷۲۰\nهدف 2 ۲۷۳۰',0);
 assert.equal(p.ok,true);assert.equal(p.signal.side,'BUY');assert.equal(p.signal.symbol,'XAUUSD');assert.deepEqual(p.signal.order.take_profits,[2720,2730]);
});

test('production Telegram parser accepts Arabic labels deterministically',()=>{
 const p=parseTelegramTrade('ذهب شراء\nحجم 0.01\nوقف الخسارة 2700\nالهدف 1 2720',0);
 assert.equal(p.ok,true);assert.equal(p.signal.side,'BUY');assert.equal(p.signal.symbol,'XAUUSD');
});

test('same instrument aliases do not create a false conflict',()=>{
 const p=parseTelegramTrade('GOLD XAU XAUUSD BUY LOT 0.01 SL 2700 TP1 2720',0);
 assert.equal(p.ok,true);assert.equal(p.signal.symbol,'XAUUSD');
});

test('conflicting directions fail closed',()=>{
 const p=parseTelegramTrade('XAUUSD BUY فروش LOT 0.01 SL 2700 TP1 2720',0);
 assert.deepEqual(p,{ok:false,reason:'CONFLICTING_DIRECTION'});
});

test('conflicting instruments fail closed',()=>{
 const p=parseTelegramTrade('GOLD BTC BUY LOT 0.01 SL 2700 TP1 2720',0);
 assert.deepEqual(p,{ok:false,reason:'CONFLICTING_SYMBOLS'});
});

test('repeated critical fields fail closed even when values match',()=>{
 assert.equal(parseTelegramTrade('XAUUSD BUY LOT 0.01 LOT 0.01 SL 2700 TP1 2720',0).reason,'DUPLICATE_LOT');
 assert.equal(parseTelegramTrade('XAUUSD BUY LOT 0.01 SL 2700 SL 2700 TP1 2720',0).reason,'DUPLICATE_STOP_LOSS');
 assert.equal(parseTelegramTrade('XAUUSD BUY LOT 0.01 SL 2700 TP1 2720 TP1 2720',0).reason,'DUPLICATE_TP1');
});

test('target sequence and unique target prices are enforced',()=>{
 assert.equal(parseTelegramTrade('XAUUSD BUY LOT 0.01 SL 2700 TP1 2720 TP3 2740',0).reason,'TP_SEQUENCE_GAP');
 assert.equal(parseTelegramTrade('XAUUSD BUY LOT 0.01 SL 2700 TP1 2720 TP2 2720',0).reason,'DUPLICATE_TAKE_PROFIT_PRICE');
});

test('explicit reference price activates direction geometry checks',()=>{
 assert.equal(parseTelegramTrade('XAUUSD BUY LOT 0.01 ENTRY 2750 SL 2760 TP1 2770',0).reason,'INVALID_PRICE_GEOMETRY');
 const p=parseTelegramTrade('XAUUSD SELL LOT 0.01 ENTRY 2750 SL 2770 TP1 2730',0);
 assert.equal(p.ok,true);assert.equal(p.signal.order.reference_price,2750);
});

test('invalid or excessive numeric fields fail closed',()=>{
 assert.equal(parseTelegramTrade('XAUUSD BUY LOT 101 SL 2700 TP1 2720',0).reason,'INVALID_LOT');
 assert.equal(parseTelegramTrade('XAUUSD BUY LOT 0.01 SL -1 TP1 2720',0).reason,'INVALID_STOP_LOSS');
});
