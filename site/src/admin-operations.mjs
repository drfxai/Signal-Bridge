// Administrative reads never return customers' activation codes or encrypted secrets.
const rows=async(stmt)=>(await stmt.all()).results||[];
const validLicense="u.status='active' AND e.status='active' AND a.status='active' AND (e.activated_at IS NULL OR e.expires_at>CURRENT_TIMESTAMP)";
export async function adminOverview(env){
 const [users,bridge,scalper,orders,activity,trend]=await Promise.all([
  env.DB.prepare("SELECT COUNT(*) total,SUM(role='user') customers,SUM(role='admin') administrators,SUM(status='suspended') suspended,SUM(created_at>=datetime('now','-7 days')) new_7d FROM site_users").first(),
  env.DB.prepare(`SELECT COUNT(*) users,SUM(CASE WHEN ${validLicense} THEN 1 ELSE 0 END) valid_licenses,SUM(CASE WHEN ${validLicense} AND e.plan='trial' THEN 1 ELSE 0 END) trials,SUM(CASE WHEN ${validLicense} AND e.plan!='trial' THEN 1 ELSE 0 END) subscriptions,SUM(CASE WHEN ${validLicense} AND e.plan='quarterly' THEN 1 ELSE 0 END) quarterly,SUM(CASE WHEN ${validLicense} AND e.plan='annual' THEN 1 ELSE 0 END) annual,SUM(e.activated_at IS NULL) awaiting_activation,SUM(e.expires_at<=CURRENT_TIMESTAMP) expired,SUM(e.status='revoked') revoked,SUM(CASE WHEN ${validLicense} AND e.expires_at BETWEEN CURRENT_TIMESTAMP AND datetime('now','+7 days') THEN 1 ELSE 0 END) expiring_7d FROM site_licenses l JOIN site_users u ON u.id=l.user_id JOIN ea_licenses e ON e.id=l.license_id JOIN agent_connections a ON a.id=l.agent_id`).first(),
  env.DB.prepare("SELECT COUNT(DISTINCT user_id) users,COUNT(*) issued_keys,SUM(plan='scalper_1m') monthly_keys,SUM(plan='scalper_3m') quarterly_keys FROM scalper_keys").first(),
  rows(env.DB.prepare("SELECT 'signalbridge' product,status,COUNT(*) count,COALESCE(SUM(amount_usd),0) amount_usd FROM site_orders GROUP BY status UNION ALL SELECT 'scalper' product,status,COUNT(*) count,COALESCE(SUM(amount_usd),0) amount_usd FROM scalper_orders GROUP BY status")),
  rows(env.DB.prepare("SELECT a.id,a.action,a.subject_id,a.detail,a.occurred_at,u.email,u.telegram_name FROM site_audit a LEFT JOIN site_users u ON u.id=a.actor_id ORDER BY a.occurred_at DESC,a.rowid DESC LIMIT 15")),
  rows(env.DB.prepare("SELECT date(created_at) day,COUNT(*) count FROM site_users WHERE created_at>=date('now','-13 days') GROUP BY date(created_at) ORDER BY day"))
 ]);
 const clean=o=>Object.fromEntries(Object.entries(o||{}).map(([k,v])=>[k,Number(v)||0]));
 const sales=product=>{const r={paid:0,pending:0,failed:0,paid_usd:0};for(const o of orders.filter(o=>o.product===product)){r[o.status]=Number(o.count);if(o.status==='paid')r.paid_usd=Number(o.amount_usd)}return r};
 // Offline issuance alone cannot establish activation, expiry, live accounts or trial usage.
 return {ok:true,generated_at:new Date().toISOString(),users:clean(users),signalbridge:{...clean(bridge),orders:sales('signalbridge')},scalper:{...clean(scalper),orders:sales('scalper'),active_subscriptions:null,online:null,demo:null,trials:null,telemetry_supported:false},activity,registrations:trend,health:{licensing:!!env.LICENSE_VAULT_KEY,scalper_signing:!!env.SCALPER_LICENSE_SECRET,payments:!!(env.NOWPAYMENTS_API_KEY&&env.NOWPAYMENTS_IPN_SECRET),telegram:!!(env.TELEGRAM_BOT_TOKEN&&env.TELEGRAM_WEBHOOK_SECRET),email:!!(env.MAIL_FROM&&(env.RESEND_API_KEY||env.EMAIL)),ea_hub:!!env.AGENT_HUB}};
}
function pageNumber(value,max=50){return Math.max(1,Math.min(max,Math.floor(Number(value)||20)))}
export async function adminDirectory(env,url){
 const q=String(url.searchParams.get('q')||'').trim().slice(0,80),product=url.searchParams.get('product'),status=url.searchParams.get('status');
 const limit=pageNumber(url.searchParams.get('limit')),offset=Math.max(0,Math.min(1000000,Math.floor(Number(url.searchParams.get('offset'))||0)));
 const where=[],args=[];
 if(q){where.push('(u.id LIKE ? OR u.email LIKE ? OR u.telegram_name LIKE ? OR u.telegram_id LIKE ?)');args.push(...Array(4).fill('%'+q+'%'))}
 if(product==='signalbridge')where.push('l.user_id IS NOT NULL');
 if(product==='scalper')where.push('EXISTS(SELECT 1 FROM scalper_keys k WHERE k.user_id=u.id)');
 if(['active','suspended'].includes(status)){where.push('u.status=?');args.push(status)}
 const clause=where.length?' WHERE '+where.join(' AND '):'';
 const users=await rows(env.DB.prepare("SELECT u.id,u.email,u.telegram_id,u.telegram_name,u.role,u.status,u.plan,u.created_at,e.status license_status,e.expires_at,e.account_login,e.account_server,e.activated_at,(SELECT COUNT(*) FROM scalper_keys k WHERE k.user_id=u.id) scalper_keys FROM site_users u LEFT JOIN site_licenses l ON l.user_id=u.id LEFT JOIN ea_licenses e ON e.id=l.license_id"+clause+' ORDER BY u.created_at DESC,u.id DESC LIMIT ? OFFSET ?').bind(...args,limit+1,offset));
 return {ok:true,users:users.slice(0,limit),has_more:users.length>limit,next_offset:users.length>limit?offset+limit:null};
}
function utc(value){return Date.parse(/Z$|[+-]\d\d:\d\d$/.test(value||'')?value:String(value||'').replace(' ','T')+'Z')}
export async function adminConnections(env,url){
 const limit=pageNumber(url.searchParams.get('limit'),20),cursor=String(url.searchParams.get('cursor')||'');
 if(cursor&&!/^ea_[a-zA-Z0-9_]{1,80}$/.test(cursor))throw Error('INVALID_CURSOR');
 const candidates=await rows(env.DB.prepare(`SELECT l.agent_id,e.account_login,e.account_server FROM site_licenses l JOIN site_users u ON u.id=l.user_id JOIN ea_licenses e ON e.id=l.license_id JOIN agent_connections a ON a.id=l.agent_id WHERE ${validLicense} AND e.account_login IS NOT NULL AND l.agent_id>? ORDER BY l.agent_id LIMIT ?`).bind(cursor,limit+1));
 const selected=candidates.slice(0,limit),counts={checked:0,online:0,demo:0,live:0,unknown_mode:0,unavailable:0};
 // At most 20 DO reads per request; clients walk pages to measure every licensed account.
 const clients=await Promise.all(selected.map(async row=>{
  counts.checked++;let result={agent_id:row.agent_id,account_login:row.account_login,account_server:row.account_server,online:false,mode:null,available:false};
  if(!env.AGENT_HUB){counts.unavailable++;return result}
  try{
   const hub=env.AGENT_HUB.get(env.AGENT_HUB.idFromName(row.agent_id));
   const r=await hub.fetch(new Request('https://agent-hub/snapshot'));
   if(!r.ok)throw Error('SNAPSHOT_UNAVAILABLE');
   const data=await r.json();result.available=true;
   const socket=(data.clients||[]).find(c=>{const age=Date.now()-utc(c.last_seen_at);return c.agent_id===row.agent_id&&c.client_type==='ea'&&c.terminal_online===true&&c.account?.login===row.account_login&&c.account?.server===row.account_server&&age>=0&&age<90000});
   if(socket){result.online=true;result.mode=['DEMO','LIVE'].includes(socket.account.mode)?socket.account.mode:'UNKNOWN';counts.online++;counts[result.mode==='DEMO'?'demo':result.mode==='LIVE'?'live':'unknown_mode']++}
  }catch{counts.unavailable++}
  return result;
 }));
 return {ok:true,measured_at:new Date().toISOString(),counts,clients,has_more:candidates.length>limit,next_cursor:candidates.length>limit?selected.at(-1).agent_id:null};
}
export async function adminOrders(env,url){
 const product=url.searchParams.get('product'),where=['signalbridge','scalper'].includes(product)?' WHERE product=?':'';
 const orders=await rows(env.DB.prepare("SELECT * FROM (SELECT id,user_id,'signalbridge' product,plan,amount_usd,status,created_at,paid_at FROM site_orders UNION ALL SELECT id,user_id,'scalper' product,plan,amount_usd,status,created_at,paid_at FROM scalper_orders)"+where+' ORDER BY created_at DESC,id DESC LIMIT 30').bind(...(where?[product]:[])));
 return {ok:true,orders};
}
