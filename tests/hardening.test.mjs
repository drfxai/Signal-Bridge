import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTelegramSignal, evaluateDemoRisk} from '../design/engine.mjs';
const base = 'BUY EURUSD ENTRY 1.080 SL 1.070 TP1 1.090 TP2 1.100';
const review = (message, fragment) => {
  const r = parseTelegramSignal(message);
  assert.equal(r.approval,'REVIEW_REQUIRED');
  assert.equal(r.executable,false);
  assert.ok(r.warnings.some(s => s.includes(fragment)),JSON.stringify(r.warnings));
};
test('reject duplicate conflicting SL fields',()=>review(base+' SL 1.065','Repeated stop-loss'));
test('reject duplicate matching SL fields too',()=>review(base+' SL 1.070','Repeated stop-loss'));
test('reject duplicate TP1 at conflicting levels',()=>review(base+' TP1 1.095','Repeated take-profit'));
test('reject duplicate TP1 even when values match',()=>review(base+' TP1 1.090','Repeated take-profit'));
test('reject unlabeled plus indexed target ambiguity',()=>review(base+' TP 1.120','Mixed labeled'));
test('reject mixed instruments',()=>review(base+' GBPUSD','Conflicting instruments'));
test('allow repeated aliases for same canonical instrument without instrument conflict',()=>{
 const r=parseTelegramSignal('BUY GOLD XAUUSD ENTRY 2500 SL 2490 TP1 2510');
 assert.ok(!r.warnings.includes('Conflicting instruments.'));
 assert.equal(r.executable,false);
});
test('reject duplicate entry values',()=>review(base+' ENTRY 1.075','Repeated entry'));
test('reject invalid zero stop price',()=>review('BUY EURUSD ENTRY 1.08 SL 0 TP1 1.09','Non-positive'));
test('normalize Persian and Arabic digits',()=>{
 const r=parseTelegramSignal('BUY GOLD ENTRY ۲۵۰۰ SL ٢٤٩٠ TP1 ۲۵۱۰');
 assert.equal(r.entry,2500);assert.equal(r.stopLoss,2490);assert.deepEqual(r.takeProfits,[2510]);
 assert.equal(r.executable,false);
});
test('no entry does not produce invented entry or executable intent',()=>{
 const r=parseTelegramSignal('BUY GOLD SL 2490 TP1 2510');
 assert.equal(r.entry,null);assert.equal(r.executable,false);
});
test('reject missing lots',()=>assert.ok(evaluateDemoRisk({lots:undefined}).reasons.includes('LOT_LIMIT')));
test('reject negative spread, loss, positions, age',()=>{
 const r=evaluateDemoRisk({lots:.01,openPositions:-1,dailyLossPercent:-.01,spreadPoints:-2,ageSeconds:-1});
 assert.deepEqual(r.reasons,['POSITION_LIMIT','DAILY_LOSS_LIMIT','SPREAD_LIMIT','STALE_SIGNAL']);
});
test('reject fractional position counts',()=>assert.ok(evaluateDemoRisk({lots:.01,openPositions:1.5}).reasons.includes('POSITION_LIMIT')));
test('reject invalid policy with negative or zero ceilings',()=>{
 const r=evaluateDemoRisk({lots:.01}, {maxLots:0,maxOpen:0,dailyLoss:-2,maxSpread:-1});
 assert.equal(r.decision,'REJECTED');assert.ok(r.reasons.includes('INVALID_POLICY'));
});
test('reject non-finite and non-numeric values in inputs and policy',()=>{
 const r=evaluateDemoRisk({lots:Infinity,openPositions:NaN,dailyLossPercent:'not-a-number',spreadPoints:Infinity},{maxLots:'oops'});
 assert.ok(r.reasons.includes('INVALID_POLICY'));
 assert.ok(r.reasons.includes('LOT_LIMIT'));
 assert.ok(r.reasons.includes('POSITION_LIMIT'));
 assert.ok(r.reasons.includes('DAILY_LOSS_LIMIT'));
 assert.ok(r.reasons.includes('SPREAD_LIMIT'));
});
test('require explicit stop-loss boolean true',()=>{
 assert.deepEqual(evaluateDemoRisk({lots:.01,hasStopLoss:'true'}).reasons,['MISSING_STOP_LOSS']);
});
test('valid low loss preview remains non-executable',()=>{
 const r=evaluateDemoRisk({lots:.01,openPositions:0,dailyLossPercent:0,spreadPoints:0,ageSeconds:0,hasStopLoss:true});
 assert.equal(r.decision,'LOCAL_PREVIEW_PASS');assert.equal(r.executionAllowed,false);
});
