// Read-only broker-verified trading analysis. All queries are tenant scoped and bounded.
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store'}});
const round=v=>Math.round((v+Number.EPSILON)*1e8)/1e8;
const net=d=>Number(d.profit)+Number(d.commission)+Number(d.swap)+Number(d.fee);
export function summarizeBrokerDeals(deals,{truncated=false}={}){
 const ordered=[...deals].sort((a,b)=>Number(a.deal_time_ms)-Number(b.deal_time_ms)||String(a.deal_ticket).localeCompare(String(b.deal_ticket)));
 const positions=new Map(),daily=new Map();
 let realized=0,attributedNet=0,unassignedNet=0,unassignedDeals=0,brokerCount=0;
 for(const d of ordered){
  const pnl=net(d);
  if(!Number.isFinite(pnl))continue;
  brokerCount++;realized+=pnl;
  const attributed=!!d.signal_attributed;
  if(attributed)attributedNet+=pnl;else{unassignedNet+=pnl;unassignedDeals++;}
  // The calendar is a broker-server-date grouping, not an inferred UTC trading session.
  const day=new Date(Number(d.deal_time_ms)).toISOString().slice(0,10);
  daily.set(day,(daily.get(day)||0)+pnl);
  const key=[d.agent_id,d.account_login,d.account_server,d.position_id].join(':');
  const pos=positions.get(key)||{position_id:String(d.position_id),symbol:d.symbol,agent_id:d.agent_id,account_login:d.account_login,account_server:d.account_server,opened_at:null,closed_at:null,volume_open:0,volume_closed:0,net:0,has_entry:false,has_exit:false,reversal:false,attributed:true,deals:0};
  if(d.entry_kind==='I'){pos.has_entry=true;pos.volume_open+=Number(d.volume);pos.opened_at=pos.opened_at===null?Number(d.deal_time_ms):Math.min(pos.opened_at,Number(d.deal_time_ms));}
  else if(d.entry_kind==='O'||d.entry_kind==='C'){pos.has_exit=true;pos.volume_closed+=Number(d.volume);pos.closed_at=Math.max(pos.closed_at||0,Number(d.deal_time_ms));}
  else pos.reversal=true; // INOUT cannot be safely attributed to a completed position.
  pos.attributed&&=attributed;pos.net+=pnl;pos.deals++;
  positions.set(key,pos);
 }
 const closed=[...positions.values()].filter(p=>p.has_entry&&p.has_exit&&!p.reversal&&Math.abs(p.volume_open-p.volume_closed)<=Math.max(1e-6,p.volume_open*1e-6)).sort((a,b)=>a.closed_at-b.closed_at);
 let wins=0,losses=0,breakeven=0,grossProfit=0,grossLoss=0,maxDrawdown=0,peak=0,curve=0,winStreak=0,lossStreak=0,bestWinStreak=0,bestLossStreak=0;
 let totalDuration=0;
 for(const p of closed){const amount=round(p.net);if(amount>0){wins++;grossProfit+=amount;winStreak++;lossStreak=0;bestWinStreak=Math.max(bestWinStreak,winStreak)}else if(amount<0){losses++;grossLoss+=amount;lossStreak++;winStreak=0;bestLossStreak=Math.max(bestLossStreak,lossStreak)}else{breakeven++;winStreak=0;lossStreak=0;}totalDuration+=Math.max(0,p.closed_at-p.opened_at);curve+=amount;peak=Math.max(peak,curve);maxDrawdown=Math.max(maxDrawdown,peak-curve);}
 const hasFullSample=closed.length>0&&!truncated;
 const money=v=>round(v);
 return {coverage:{truncated,broker_deals:brokerCount,positions_observed:positions.size,closed_positions:closed.length,incomplete_positions:positions.size-closed.length,unassigned_deals:unassignedDeals,source:'MT5 broker deal ledger',timezone:'broker-server timestamp; session timezone unverified'},
  metrics:{realized_net:money(realized),signal_attributed_net:money(attributedNet),unassigned_net:money(unassignedNet),
   closed_positions:closed.length,win_rate:hasFullSample?money(wins/closed.length*100):null,
   profit_factor:hasFullSample&&grossLoss<0?money(grossProfit/Math.abs(grossLoss)):null,
   profit_factor_note:hasFullSample&&grossLoss===0?'NO_LOSING_CLOSED_POSITIONS':null,
   avg_win:hasFullSample&&wins?money(grossProfit/wins):null,
   avg_loss:hasFullSample&&losses?money(grossLoss/losses):null,
   expectancy:hasFullSample?money(closed.reduce((s,p)=>s+p.net,0)/closed.length):null,
   avg_duration_minutes:hasFullSample?money(totalDuration/closed.length/60000):null,
   max_closed_trade_drawdown:hasFullSample?money(maxDrawdown):null,
   longest_win_streak:hasFullSample?bestWinStreak:null,longest_loss_streak:hasFullSample?bestLossStreak:null,
   average_r:null,account_equity_drawdown:null},
  closed_positions:closed.slice(-100).reverse().map(p=>({position_id:p.position_id,agent_id:p.agent_id,symbol:p.symbol,account_login:p.account_login,opened_at:p.opened_at,closed_at:p.closed_at,volume:p.volume_open,net:money(p.net),signal_attributed:p.attributed,deals:p.deals})),
  calendar:[...daily].sort(([a],[b])=>a.localeCompare(b)).map(([date,value])=>({date,net:money(value)}))};
}
export function parseAnalyticsFilters(params,now=Date.now()){
 const days=Number(params.get('days')||30),scope=params.get('scope')||'account';
 if(!Number.isInteger(days)||days<1||days>90||!['account','signal'].includes(scope))throw Error('INVALID_ANALYTICS_FILTER');
 return {days,scope,minTime:now-days*86400000};
}
export async function tradeAnalyticsEndpoint(env,user,params,now=Date.now()){
 let filter;try{filter=parseAnalyticsFilters(params,now)}catch{return reply({error:'INVALID_ANALYTICS_FILTER'},400)}
 // 401 is an explicit coverage sentinel; not a full-history scan.
 const r=await env.DB.prepare(`SELECT d.agent_id,d.account_login,d.account_server,d.deal_ticket,d.position_id,d.order_ticket,d.deal_time_ms,
 d.side,d.entry_kind,d.symbol,d.volume,d.price,d.profit,d.commission,d.swap,d.fee,d.signal_tag,
 CASE WHEN d.signal_tag IS NOT NULL AND EXISTS (
  SELECT 1 FROM commands c WHERE c.tenant_id=d.tenant_id AND c.agent_id=d.agent_id
  AND c.source_type IN ('tradingview','telegram') AND json_extract(c.payload_json,'$.correlation_tag')=d.signal_tag
 ) THEN 1 ELSE 0 END AS signal_attributed
 FROM broker_deals d WHERE d.tenant_id=? AND d.deal_time_ms>=?
 ORDER BY d.deal_time_ms DESC,d.deal_ticket DESC LIMIT 401`).bind(user.id,filter.minTime).all();
 const rows=r.results||[],truncated=rows.length>400;
 const relevant=rows.slice(0,400),selected=filter.scope==='signal'?relevant.filter(d=>d.signal_attributed===1):relevant;
 const analysis=summarizeBrokerDeals(selected,{truncated});
 return reply({ok:true,scope:filter.scope,days:filter.days,partial:truncated,analysis,
  deals:selected.map(d=>({deal_ticket:d.deal_ticket,position_id:d.position_id,order_ticket:d.order_ticket,deal_time_ms:d.deal_time_ms,account_login:d.account_login,symbol:d.symbol,side:d.side,entry_kind:d.entry_kind,volume:d.volume,price:d.price,net:round(net(d)),signal_attributed:!!d.signal_attributed,signal_tag:d.signal_attributed?d.signal_tag:null}))});
}
