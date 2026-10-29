import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ea=readFileSync('mt5/DrFX_SignalBridge_EA.mq5','utf8');
// Execute the actual pure MQL calculation bodies, converting only declaration syntax.
function native(name,args){const body=ea.match(new RegExp('(?:double|bool) '+name+'\\([^)]*\\)\\{([^}]+)\\}'))[1].replace(/double (\w+)=/g,'let $1=').replaceAll('MathMax','Math.max');return Function(...args,body);}
const dd=native('DailyDrawdownValue',['base','equity','netCashFlow']),latch=native('DailyRiskLatch',['hit','base','drawdown','limit']);
test('native daily drawdown math includes floating losses and adjusts deposits/withdrawals',()=>{
 assert.equal(dd(1000,900,0),10);assert.equal(dd(1000,1100,0),0);assert.equal(dd(1000,1900,1000),5);assert.equal(dd(1000,450,-500),10);
 assert.equal(latch(false,1000,9.99,10),false);assert.equal(latch(false,1000,10,10),true);assert.equal(latch(true,1000,0,10),true);assert.equal(latch(false,0,0,10),true);
});
test('account-wide risk latch persists before liquidation and checks before any command action',()=>{
 const check=ea.slice(ea.indexOf('void RiskCheck()'),ea.indexOf('bool ResetDailyRisk('));assert.ok(check.indexOf('SaveRisk();g_lastExecution')<check.indexOf('trade.PositionClose(t)'));assert.match(check,/trade.OrderDelete\(t\)/);assert.doesNotMatch(check,/POSITION_MAGIC/);
 const reset=ea.slice(ea.indexOf('bool ResetDailyRisk('),ea.indexOf('void CountSignal('));assert.match(reset,/expectedHit!=g_hitId\|\|PositionsTotal\(\)>0\|\|OrdersTotal\(\)>0/);assert.ok(reset.indexOf('g_riskBase=AccountInfoDouble')<reset.indexOf('g_riskHit=false'));
 const cmd=ea.slice(ea.indexOf('void HandleCommand('),ea.indexOf('void ProcessLine('));assert.ok(cmd.indexOf('if(g_riskHit)')<cmd.indexOf('HandleTimedTest('));assert.ok(cmd.indexOf('if(g_riskHit)')<cmd.indexOf('HandleOpen('));
});
