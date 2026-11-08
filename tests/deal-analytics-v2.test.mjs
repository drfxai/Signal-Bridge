import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseDealBatch,ingestDealBatch,DEAL_MAX_BATCH} from '../worker/src/deal-history.mjs';
import {summarizeBrokerDeals,parseAnalyticsFilters,tradeAnalyticsEndpoint} from '../site/src/trade-analytics.mjs';

const now=Date.UTC(2026,10,7,10);
const deal=(ticket,kind='I',profit=0,tag='abcdef123456',position='200')=>
 [ticket,position,'300',String(now-1000),kind==='O'?'S':'B',kind,'XAUUSD','0.01','4000',String(profit),'-0.2','0','-0.05',tag].join(',');
const payload=parts=>'DEAL_BATCH|batch_1|'+parts.join(';');
const fakeDeal=(ticket,kind,pnl,more={})=>({deal_ticket:String(ticket),position_id:'200',order_ticket:'300',deal_time_ms:now+Number(ticket)*1000,
 agent_id:'a1',account_login:'100',account_server:'DemoServer',side:kind==='O'?'S':'B',entry_kind:kind,symbol:'XAUUSD',volume:0.01,price:4000,
 profit:pnl,commission:-0.2,swap:0,fee:0,signal_attributed:1,...more});

test('deal protocol accepts real broker profit and expense fields with exact ticket text',()=>{
 const parsed=parseDealBatch(payload([deal('9007199254740993'),deal('9007199254740994','O',5)]),now);
 assert.equal(parsed.deals.length,2);
 assert.equal(parsed.deals[0].ticket,'9007199254740993');
 assert.equal(parsed.deals[1].profit,5);
 assert.equal(parsed.deals[1].commission,-0.2);
 assert.equal(parsed.deals[1].tag,'abcdef123456');
});
test('deal protocol rejects bad counts, IDs, injections and amounts',()=>{
 assert.equal(DEAL_MAX_BATCH,8);
 assert.throws(()=>parseDealBatch(payload(Array.from({length:9},(_,i)=>deal(String(i+1)))),now),/COUNT/);
 assert.throws(()=>parseDealBatch(payload([deal('1'),deal('1')]),now),/ID/);
 assert.throws(()=>parseDealBatch(payload([deal('1').replace('XAUUSD','XAUUSD;DROP')]),now));
 assert.throws(()=>parseDealBatch(payload([deal('1').replace('0.01','Infinity')]),now),/AMOUNT/);
 assert.throws(()=>parseDealBatch(payload([deal('1').replace('abcdef123456','source')]),now),/TAG/);
 assert.throws(()=>parseDealBatch(payload([deal('1').replace(String(now-1000),String(now+172800001))]),now),/TIME/);
});
test('only recently licensed, account-bound EA may persist broker deals',async()=>{
 const stored=[],env={DB:{prepare(sql){return {bind(...args){stored.push({sql,args});return {}}}},async batch(statements){return statements.map(()=>({success:true,meta:{changes:1}}))}}};
 const a={role:'ea',tenantId:'owner',agentId:'a1',terminalOnline:true,capabilities:['deal-history-v1'],account:{login:'100',server:'DemoServer'},lastSeenAt:new Date(now).toISOString()};
 const outcome=await ingestDealBatch(env,a,payload([deal('1')]),now);
 assert.equal(outcome.accepted,1);
 assert.equal(outcome.inserted,1);
 assert.deepEqual(stored[0].args.slice(0,4),['owner','a1','100','DemoServer']);
 await assert.rejects(ingestDealBatch(env,{...a,role:'observer'},payload([deal('2')]),now),/UNAUTHORIZED/);
 await assert.rejects(ingestDealBatch(env,{...a,capabilities:[]},payload([deal('2')]),now),/UNAUTHORIZED/);
 await assert.rejects(ingestDealBatch(env,{...a,lastSeenAt:'2020-01-01'},payload([deal('2')]),now),/STALE/);
 await assert.rejects(ingestDealBatch(env,{...a,lastDealBatchAt:now-1000},payload([deal('2')]),now),/RATE_LIMIT/);
});
test('complete broker position reconciles entry commission and exit profit',()=>{
 const a=summarizeBrokerDeals([fakeDeal('1','I',0),fakeDeal('2','O',10)]);
 assert.equal(a.coverage.closed_positions,1);
 assert.equal(a.metrics.realized_net,9.6);
 assert.equal(a.metrics.win_rate,100);
 assert.equal(a.metrics.expectancy,9.6);
 assert.equal(a.metrics.profit_factor,null);
 assert.equal(a.metrics.profit_factor_note,'NO_LOSING_CLOSED_POSITIONS');
 assert.equal(a.closed_positions[0].net,9.6);
});
test('partial closes do not count as a fully closed trade; reversal is never considered closed',()=>{
 const s=summarizeBrokerDeals([fakeDeal('1','I',0,{volume:0.02}),fakeDeal('2','O',5),fakeDeal('3','R',-4,{position_id:'999'})]);
 assert.equal(s.coverage.closed_positions,0);
 assert.equal(s.metrics.win_rate,null);
 assert.equal(s.coverage.incomplete_positions,2);
});
test('attribution distinguishes manual and Signal Bridge deals; truncated sample hides ratios',()=>{
 const rows=[fakeDeal('1','I',0,{signal_attributed:1}),fakeDeal('2','O',10,{signal_attributed:0})];
 const s=summarizeBrokerDeals(rows,{truncated:true});
 assert.equal(s.metrics.win_rate,null);
 assert.equal(s.metrics.realized_net,9.6);
 assert.equal(s.metrics.signal_attributed_net,-0.2);
 assert.equal(s.coverage.unassigned_deals,1);
 assert.equal(s.closed_positions[0].signal_attributed,false);
});
test('analytics filtering is limited to ninety days and documented scopes',()=>{
 assert.equal(parseAnalyticsFilters(new URLSearchParams('days=30&scope=signal'),now).days,30);
 assert.throws(()=>parseAnalyticsFilters(new URLSearchParams('days=365'),now),/INVALID/);
 assert.throws(()=>parseAnalyticsFilters(new URLSearchParams('scope=any'),now),/INVALID/);
});
test('authenticated analytics query binds tenant identity and never uses caller userId',async()=>{
 let bound;
 const db={prepare(sql){assert.match(sql,/FROM broker_deals d WHERE d.tenant_id=\?/);assert.match(sql,/LIMIT 401/);assert.match(sql,/c.tenant_id=d.tenant_id/);return{bind(...args){bound=args;return{async all(){return {results:[fakeDeal('1','I',0),fakeDeal('2','O',5)]}}}}}}};
 const response=await tradeAnalyticsEndpoint({DB:db},{id:'owner'},new URLSearchParams('days=7&user_id=attacker'),now);
 assert.equal(response.status,200);assert.equal(bound[0],'owner');
 const body=await response.json();assert.equal(body.ok,true);
 assert.equal(body.analysis.coverage.closed_positions,1);
 const invalid=await tradeAnalyticsEndpoint({DB:db},{id:'owner'},new URLSearchParams('days=999'),now);
 assert.equal(invalid.status,400);
});
test('integration keeps license auth, opt-in EA, source isolation and D1 indexes',()=>{
 const root=new URL('../',import.meta.url);
 const read=p=>fs.readFileSync(new URL(p,root),'utf8');
 const site=read('site/src/worker.mjs'),hub=read('worker/src/agent-hub.mjs'),ea=read('mt5/DrFX_SignalBridge_EA.mq5'),ui=read('site/src/premium-portal.mjs'),migration=read('site/migrations/20261108_broker_deal_analytics.sql');
 assert.ok(site.indexOf("if(!user)return fail('UNAUTHENTICATED',401);")<site.indexOf("if(path==='/api/member/trade-analytics'"));
 assert.match(hub,/if\(!await this.licenseIsValid\(a\)\)throw Error\('LICENSE_INACTIVE'\)/);
 assert.match(hub,/ingestDealBatch\(this.env,a,message\)/);
 assert.match(ea,/InpEnableDealHistory=false/);
 assert.match(ea,/#include "DealHistory.mqh"/);
 assert.match(ui,/TRADE_JOURNAL_HTML/);
 assert.match(migration,/idx_broker_deals_tenant_time/);
 assert.match(migration,/idx_commands_deal_signal_tag/);
});
