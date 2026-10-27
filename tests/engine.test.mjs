import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSymbol,parseTelegramSignal,evaluateDemoRisk,safeText} from '../design/engine.mjs';

test('aliases map to canonical symbols',()=>{assert.equal(normalizeSymbol(' Gold '),'XAUUSD');assert.equal(normalizeSymbol('eurusd'),'EURUSD')});
test('parse a structured signal, but NEVER mark executable',()=>{
 const r=parseTelegramSignal('BUY GOLD ENTRY 2500 SL 2490 TP1 2510 TP2 2520');
 assert.equal(r.side,'BUY');assert.equal(r.symbol,'XAUUSD');assert.equal(r.entry,2500);assert.deepEqual(r.takeProfits,[2510,2520]);assert.equal(r.executable,false);
});
test('reject contradictory buy and sell',()=>{const r=parseTelegramSignal('BUY SELL GOLD ENTRY 2500 SL 2490 TP 2510');assert.equal(r.approval,'REVIEW_REQUIRED');assert.equal(r.side,null)});
test('reject absent stop and targets',()=>{const r=parseTelegramSignal('BUY EURUSD');assert.equal(r.approval,'REVIEW_REQUIRED');assert.ok(r.warnings.length>=2)});
test('detect incoherent stops and targets',()=>{const r=parseTelegramSignal('SELL EURUSD ENTRY 1.08 SL 1.07 TP 1.10');assert.equal(r.approval,'REVIEW_REQUIRED');});
test('enforce demo lot cap and daily loss',()=>{const p={maxLots:.1,maxOpen:3,dailyLoss:3,maxSpread:50};const r=evaluateDemoRisk({lots:.4,openPositions:3,dailyLossPercent:4,spreadPoints:60},p);assert.equal(r.decision,'REJECTED');assert.deepEqual(r.reasons,['LOT_LIMIT','POSITION_LIMIT','DAILY_LOSS_LIMIT','SPREAD_LIMIT']);assert.equal(r.executionAllowed,false)});
test('passing demonstration rules never allows execution',()=>{assert.deepEqual(evaluateDemoRisk({lots:.01,openPositions:0,dailyLossPercent:0,spreadPoints:5}),{decision:'LOCAL_PREVIEW_PASS',reasons:[],executionAllowed:false})});
test('stale and no-stop signals reject',()=>{assert.deepEqual(evaluateDemoRisk({lots:.01,ageSeconds:45,hasStopLoss:false}).reasons,['STALE_SIGNAL','MISSING_STOP_LOSS'])});
test('HTML escaping prevents injection',()=>{assert.equal(safeText('<img src=x onerror="1">'),'&lt;img src=x onerror=&quot;1&quot;&gt;')});