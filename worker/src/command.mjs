
const POSITIVE = v => typeof v === 'number' && Number.isFinite(v) && v > 0;
const SYMBOL = /^[A-Z0-9][A-Z0-9._-]{0,31}$/;
const MODES = new Set(['dry_run','demo_execute']);

export function normalizeExecutionMode(value) {
  return MODES.has(value) ? value : 'dry_run';
}

export function validateTestSignal(body, nowMs=Date.now()) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('INVALID_TEST_SIGNAL');
  const side=String(body.side||'').toUpperCase();
  const symbol=String(body.symbol||'').toUpperCase();
  const volume=Number(body.volume);
  const stopLoss=Number(body.stop_loss);
  const rawTps=Array.isArray(body.take_profits) ? body.take_profits : [body.tp1,body.tp2,body.tp3].filter(v=>v!==undefined&&v!==null&&v!=='');
  const tps=rawTps.map(Number);
  if (!['BUY','SELL'].includes(side)) throw new Error('INVALID_SIDE');
  if (!SYMBOL.test(symbol)) throw new Error('INVALID_SYMBOL');
  if (!POSITIVE(volume) || volume>100) throw new Error('INVALID_VOLUME');
  if (!POSITIVE(stopLoss)) throw new Error('INVALID_STOP_LOSS');
  if (tps.length<1 || tps.length>3 || !tps.every(POSITIVE) || new Set(tps).size!==tps.length) throw new Error('INVALID_TAKE_PROFITS');
  return {
    action:'OPEN',side,symbol,
    order:{type:'MARKET',volume:{mode:'FIXED_LOTS',value:volume},stop_loss:stopLoss,take_profits:tps},
    occurred_at:new Date(nowMs).toISOString(),
    expires_at:new Date(nowMs+60_000).toISOString()
  };
}

export function makeCommand({tenantId,agentId,sourceType,sourceRef,signal,mode,commandId=crypto.randomUUID()}) {
  return {
    protocol:'signalbridge-command/1',
    command_id:commandId,
    tenant_id:tenantId,
    agent_id:agentId,
    source:{type:sourceType,ref:sourceRef||null},
    execution_mode:normalizeExecutionMode(mode),
    action:signal.action,
    side:signal.side,
    symbol:signal.symbol,
    order:signal.order,
    occurred_at:signal.occurred_at,
    expires_at:signal.expires_at
  };
}

export async function createAndDispatch(env,{tenantId,agentId,sourceType,sourceRef,signalId=null,signal,mode='dry_run'}) {
  if (!agentId) return {command_id:null,status:'NO_ROUTE',delivered:0};
  if (!env?.DB || !env?.AGENT_HUB) throw new Error('COMMAND_SERVICE_UNAVAILABLE');

  if (signalId) {
    const existing=await env.DB.prepare(
      'SELECT id,status FROM commands WHERE signal_id=? AND agent_id=? LIMIT 1'
    ).bind(signalId,agentId).first();
    if(existing) return {command_id:existing.id,status:existing.status,delivered:0,duplicate:true};
  }

  const command=makeCommand({tenantId,agentId,sourceType,sourceRef,signal,mode});
  const payload=JSON.stringify(command);
  const inserted=await env.DB.prepare(
    `INSERT INTO commands
       (id,tenant_id,signal_id,source_type,source_ref,agent_id,execution_mode,payload_json,status,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?, 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO NOTHING`
  ).bind(command.command_id,tenantId,signalId,sourceType,sourceRef||null,agentId,command.execution_mode,payload).run();
  if(!inserted?.success) throw new Error('COMMAND_PERSIST_FAILED');

  const stub=env.AGENT_HUB.get(env.AGENT_HUB.idFromName(agentId));
  let delivered=0;
  try {
    const response=await stub.fetch(new Request('https://agent-hub/dispatch',{
      method:'POST',
      headers:{'content-type':'application/json'},
      body:payload
    }));
    const result=await response.json().catch(()=>({}));
    delivered=Number(result?.delivered)||0;
  } catch {
    delivered=0;
  }

  if(delivered>0) {
    await env.DB.prepare(
      "UPDATE commands SET status='DELIVERED',delivered_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='PENDING'"
    ).bind(command.command_id).run();
  }
  return {command_id:command.command_id,status:delivered>0?'DELIVERED':'PENDING',delivered,duplicate:false};
}
