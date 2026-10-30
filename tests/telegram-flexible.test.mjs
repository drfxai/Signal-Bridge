import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTelegramTrade} from '../worker/src/telegram-parser.mjs';
test('emoji repeated targets and implicit entry normalize without guessing volume',()=>{
 const r=parseTelegramTrade('GOLD SELL 3916.5\n💰 TP : 3912.5 💰 TP : 3906.5 💰 TP : 3886.5\n⚠️ SL : 3931',Date.now(),{defaultLots:.01});
 assert.equal(r.ok,true);assert.deepEqual(r.signal.order.take_profits,[3912.5,3906.5,3886.5]);assert.equal(r.signal.order.reference_price,3916.5);
});
test('additional entry is recognized as requiring review',()=>{
 assert.equal(parseTelegramTrade('GOLD SELL 3916.5MORE SELL 3926.5\nTP:3912.5\nSL:3931',Date.now(),{defaultLots:.01}).reason,'MULTIPLE_ENTRIES_REQUIRES_REVIEW');
});
