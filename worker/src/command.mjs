const POSITIVE=v=>typeof v==='number'&&Number.isFinite(v)&&v>0;
const SYMBOL=/^[A-Z0-9][A-Z0-9._-]{0,31}$/;
const MODES=new Set(['dry_run','demo_execute','test_execute']);

export function normalizeExecutionMode(value){return MODES.has(value)?value:'dry_run';}

export function correlationTag(value){
 const s=String(value||'');
 let a=2166136261>>>0,b=2246822519>>>0;
 for(let i=0;i<s.length;i++){
  const n=s.charCodeAt(i);
  a=Math.imul(a^n,16777619)>>>0;
  b=Math.imul(b^(n+i),3266489917)>>>0;
 }
 return (a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0')).slice(0,12);
}

export function validateTestSignal(body,nowMs=Date.now()){
 if(!body||typeof body!=='object'||Array.isArray(body))throw new Error('INVALID_TEST_SIGNAL');
 const side=String(body.side||'').toUpperCase(),symbol=String(body.symbol||'').toUpperCase();
 const volume=Number(body.volume),stopLoss=Number(body.stop_loss);
 const rawTps=Array.isArray(body.take_profits)?body.take_profits:[body.tp1,body.tp2,body.tp3].filter(v=>v!==undefined&&v!==null&&v!=='');
 const tps=rawTps.map(Number);
 if(!['BUY','SELL'].includes(side))throw new Error('INVALID_SIDE');
 if(!SYMBOL.test(symbol))throw new Error('INVALID_SYMBOL');
 if(!POSITIVE(volume)||volume>100)throw new Error('INVALID_VOLUME');
 if(!POSITIVE(stopLoss))throw new Error('INVALID_STOP_LOSS');
 if(tps.length<1||tps.length>3||!tps.every(POSITIVE)||new Set(tps).size!==tps.length)throw new Error('INVALID_TAKE_PROFITS');
 return {external_signal_id:'test-'+crypto.randomUUID(),correlation_id:'test-'+crypto.randomUUID(),action:'OPEN',side,symbol,
  order:{type:'MARKET',volume:{mode:'FIXED_LOTS',value:volume},stop_loss:stopLoss,take_profits:tps},
  occurred_at:new Date(nowMs).toISOString(),expires_at:new Date(nowMs+60_000).toISOString()};
}

export function makeCommand({tenantId,agentId,sourceType,sourceRef,signal,mode,commandId=crypto.randomUUID()}){
 return {protocol:'signalbridge-command/1',command_id:commandId,tenant_id:tenantId,agent_id:agentId,
  source:{type:sourceType,ref:sourceRef||null,strategy:signal.metadata?.strategy||null},
  correlation_id:String(signal.correlation_id||signal.external_signal_id||commandId),
  correlation_tag:correlationTag(signal.correlation_id||signal.external_signal_id||commandId),
  execution_mode:mode==='test_execute'&&signal.action!=='TEST'?'dry_run':normalizeExecutionMode(mode),action:signal.action,test_account:signal.test_account||null,
  management_event:signal.management_event||null,side:signal.side||null,symbol:signal.symbol||null,order:signal.order||null,
  occurred_at:signal.occurred_at||new Date().toISOString(),expires_at:signal.expires_at||null};
}

async function dispatchPayload(env,agentId,payload,commandId,currentStatus='PENDING'){
 const stub=env.AGENT_HUB.get(env.AGENT_HUB.idFromName(agentId));let delivered=0,reason='AGENT_OFFLINE';
 try{
  const response=await stub.fetch(new Request('https://agent-hub/dispatch',{method:'POST',headers:{'content-type':'application/json'},body:payload}));
  const result=await response.json().catch(()=>({}));delivered=Number(result?.delivered)||0;reason=String(result?.reason||'');
 }catch{delivered=0;reason='DISPATCH_UNAVAILABLE'}
 if(delivered>0){
  await env.DB.prepare("UPDATE commands SET status='DELIVERED',delivered_at=COALESCE(delivered_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='PENDING'").bind(commandId).run();
  return {status:'DELIVERED',delivered,reason:null};
 }
 return {status:currentStatus,delivered:0,reason:reason||'NOT_DELIVERED'};
}

async function findExisting(env,{signalId,sourceType,sourceRef,agentId}){
 if(signalId){
  const row=await env.DB.prepare('SELECT id,status,payload_json FROM commands WHERE signal_id=? AND agent_id=? LIMIT 1').bind(signalId,agentId).first();
  if(row)return row;
 }
 if(sourceType==='telegram'&&sourceRef){
  const row=await env.DB.prepare("SELECT id,status,payload_json FROM commands WHERE source_type='telegram' AND source_ref=? AND agent_id=? LIMIT 1").bind(sourceRef,agentId).first();
  if(row)return row;
 }
 return null;
}

export async function createAndDispatch(env,{tenantId,agentId,sourceType,sourceRef,signalId=null,signal,mode='dry_run',commandId}){
 if(!agentId)return {command_id:null,status:'NO_ROUTE',delivered:0,reason:'NO_ROUTE'};
 if(!env?.DB||!env?.AGENT_HUB)throw new Error('COMMAND_SERVICE_UNAVAILABLE');

 const prior=await findExisting(env,{signalId,sourceType,sourceRef,agentId});
 if(prior){
  if(prior.status==='PENDING'){
   const retry=await dispatchPayload(env,agentId,prior.payload_json,prior.id,prior.status);
   return {command_id:prior.id,...retry,duplicate:true};
  }
  return {command_id:prior.id,status:prior.status,delivered:0,reason:null,duplicate:true};
 }

 const command=makeCommand({tenantId,agentId,sourceType,sourceRef,signal,mode,commandId}),payload=JSON.stringify(command);
 const inserted=await env.DB.prepare(`INSERT INTO commands
  (id,tenant_id,signal_id,source_type,source_ref,agent_id,execution_mode,payload_json,status,created_at,updated_at)
  VALUES (?,?,?,?,?,?,?,?, 'PENDING',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING`)
  .bind(command.command_id,tenantId,signalId,sourceType,sourceRef||null,agentId,command.execution_mode,payload).run();
 if(!inserted?.success)throw new Error('COMMAND_PERSIST_FAILED');

 if(inserted.meta?.changes!==1){
  const raced=await findExisting(env,{signalId,sourceType,sourceRef,agentId});
  if(!raced)throw new Error('COMMAND_CONFLICT_WITHOUT_RECORD');
  if(raced.status==='PENDING'){
   const retry=await dispatchPayload(env,agentId,raced.payload_json,raced.id,raced.status);
   return {command_id:raced.id,...retry,duplicate:true};
  }
  return {command_id:raced.id,status:raced.status,delivered:0,reason:null,duplicate:true};
 }

 const sent=await dispatchPayload(env,agentId,payload,command.command_id,'PENDING');
 return {command_id:command.command_id,...sent,duplicate:false};
}
