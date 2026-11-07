// Versioned MT5 broker-deal ingest. Read-only with respect to trading execution.
// Wire: DEAL_BATCH|<batch-id>|ticket,position,order,ms,side,entry,symbol,volume,price,profit,commission,swap,fee,tag[;...]
const ID=/^[0-9]{1,20}$/, HEX=/^[0-9a-f]{12}$/i, SYMBOL=/^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/;
const SIDES=new Set(['B','S']), ENTRIES=new Set(['I','O','R','C']);
export const DEAL_MAX_BATCH=8;
export function parseDealBatch(line, now=Date.now()){
 if(typeof line!=='string'||line.length>8192)throw Error('DEAL_BATCH_TOO_LARGE');
 const p=line.split('|');
 if(p.length!==3||p[0]!=='DEAL_BATCH'||!/^[A-Za-z0-9_-]{1,48}$/.test(p[1]))throw Error('INVALID_DEAL_BATCH');
 const raw=p[2].split(';');
 if(!raw.length||raw.length>DEAL_MAX_BATCH)throw Error('INVALID_DEAL_COUNT');
 const seen=new Set(),deals=raw.map(entry=>{
  const v=entry.split(',');if(v.length!==14)throw Error('INVALID_DEAL_FIELDS');
  const [ticket,position,order,time,side,direction,symbol,volume,price,profit,commission,swap,fee,tag]=v;
  if(!ID.test(ticket)||!ID.test(position)||!ID.test(order)||ticket==='0'||position==='0'||seen.has(ticket))throw Error('INVALID_DEAL_ID');
  seen.add(ticket);
  const timestamp=Number(time);
  if(!Number.isSafeInteger(timestamp)||timestamp<Date.UTC(2020,0,1)||timestamp>now+172800000)throw Error('INVALID_DEAL_TIME');
  if(!SIDES.has(side)||!ENTRIES.has(direction)||!SYMBOL.test(symbol))throw Error('INVALID_DEAL_SIDE');
  const amounts=[volume,price,profit,commission,swap,fee].map(x=>Number(x));
  if([volume,price,profit,commission,swap,fee].some(x=>x.trim()==='')||!amounts.every(Number.isFinite)||amounts[0]<=0||amounts[0]>10000||amounts[1]<=0||amounts.slice(2).some(x=>Math.abs(x)>1e12))throw Error('INVALID_DEAL_AMOUNT');
  if(tag!=='-'&&!HEX.test(tag))throw Error('INVALID_DEAL_TAG');
  return {ticket,position,order,time_ms:timestamp,side,direction,symbol,volume:amounts[0],price:amounts[1],profit:amounts[2],commission:amounts[3],swap:amounts[4],fee:amounts[5],tag:tag==='-'?null:tag.toLowerCase()};
 });
 return {batch_id:p[1],deals};
}
export function brokerDealInsert(env,attachment,deal){
 return env.DB.prepare(`INSERT INTO broker_deals
 (tenant_id,agent_id,account_login,account_server,deal_ticket,position_id,order_ticket,deal_time_ms,side,entry_kind,symbol,volume,price,profit,commission,swap,fee,signal_tag)
 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(agent_id,account_login,account_server,deal_ticket) DO NOTHING`)
 .bind(attachment.tenantId,attachment.agentId,attachment.account.login,attachment.account.server,deal.ticket,deal.position,deal.order,deal.time_ms,deal.side,deal.direction,deal.symbol,deal.volume,deal.price,deal.profit,deal.commission,deal.swap,deal.fee,deal.tag);
}
export async function ingestDealBatch(env,a,line,now=Date.now()){
 if(a.role!=='ea'||a.terminalOnline!==true||!a.account?.login||!a.account?.server||!a.agentId||!a.tenantId||!(a.capabilities||[]).includes('deal-history-v1'))throw Error('UNAUTHORIZED_DEAL_BATCH');
 if(now-Date.parse(a.lastSeenAt||'')>90000)throw Error('STALE_TERMINAL');
 const batch=parseDealBatch(line,now);
 if(now-(a.lastDealBatchAt||0)<2500)throw Error('DEAL_BATCH_RATE_LIMIT');
 // No user-supplied tenant/account IDs are accepted; identity is taken from the licensed WebSocket.
 const result=await env.DB.batch(batch.deals.map(d=>brokerDealInsert(env,a,d)));
 if(!Array.isArray(result)||result.some(x=>x.success===false))throw Error('DEAL_BATCH_STORAGE_FAILED');
 return {batch_id:batch.batch_id,accepted:batch.deals.length,inserted:result.reduce((n,x)=>n+Math.max(0,Number(x.meta?.changes)||0),0)};
}
