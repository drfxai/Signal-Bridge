
import { validateTradingView, ValidationError, stableStringify } from './validate.mjs';
import { authenticateAgent } from './agent-auth.mjs';
export { AgentHub } from './agent-hub.mjs';

const MAX_BYTES = 16_384;
const AUTH_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const ENCODER = new TextEncoder();
const headers = { 'cache-control':'no-store', 'x-content-type-options':'nosniff', 'referrer-policy':'no-referrer' };
const json = (value,status=200) => new Response(JSON.stringify(value),{status,headers:{...headers,'content-type':'application/json; charset=utf-8'}});
const error = (code,status) => json({error:{code,retryable:status>=500}},status);

export async function sha256(text) {
  const digest=await crypto.subtle.digest('SHA-256', ENCODER.encode(text));
  return Array.from(new Uint8Array(digest), byte=>byte.toString(16).padStart(2,'0')).join('');
}

async function readBounded(request) {
  const length=request.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length)>MAX_BYTES)) throw new ValidationError('BODY_TOO_LARGE');
  if (!request.body) throw new ValidationError('INVALID_JSON');
  const reader=request.body.getReader();
  const chunks=[];let total=0;
  try {
    while(true){
      const {value,done}=await reader.read();if(done) break;
      total+=value.byteLength;
      if(total>MAX_BYTES){await reader.cancel().catch(()=>{});throw new ValidationError('BODY_TOO_LARGE');}
      chunks.push(value);
    }
  }finally{reader.releaseLock();}
  const bytes=new Uint8Array(total);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}

async function acceptTradingView(request,env,token) {
  if (!AUTH_PATTERN.test(token)) return error('UNAUTHORIZED',401);
  if (!env?.DB || typeof env.DB.prepare !== 'function') return error('SERVICE_UNAVAILABLE',503);
  const digest=await sha256(token);
  const conn=await env.DB.prepare(
    "SELECT id,tenant_id FROM ingress_connections WHERE token_sha256=? AND provider='tradingview' AND status='active' LIMIT 1"
  ).bind(digest).first();
  if(!conn) return error('UNAUTHORIZED',401);
  if(!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type')||'')) return error('UNSUPPORTED_MEDIA_TYPE',415);

  let incoming;
  try { incoming=JSON.parse(await readBounded(request)); }
  catch(e){return error(e instanceof ValidationError?e.code:(e instanceof SyntaxError?'INVALID_JSON':'INVALID_ENCODING'),e?.code==='BODY_TOO_LARGE'?413:400);}

  let signal;
  try { signal=validateTradingView(incoming); }
  catch(e){ return error(e instanceof ValidationError?e.code:'INVALID_SIGNAL_SCHEMA',422); }

  const payload=stableStringify(signal), hash=await sha256(payload);
  const id=crypto.randomUUID(),received=new Date().toISOString();
  const result=await env.DB.prepare(
    `INSERT INTO received_signals (id,tenant_id,connection_id,external_signal_id,payload_sha256,normalized_json,received_at,expires_at,status)
     VALUES (?,?,?,?,?,?,?,?, 'RECEIVED')
     ON CONFLICT(connection_id,external_signal_id) DO NOTHING`
  ).bind(id,conn.tenant_id,conn.id,signal.external_signal_id,hash,payload,received,signal.expires_at).run();
  if(!result?.success) throw new Error('D1 write not confirmed');
  if(result.meta?.changes === 1) return json({accepted:true,duplicate:false,signal_id:id,status:'RECEIVED',execution_enabled:false},202);

  const existing=await env.DB.prepare(
    'SELECT id,payload_sha256 FROM received_signals WHERE connection_id=? AND external_signal_id=? LIMIT 1'
  ).bind(conn.id,signal.external_signal_id).first();
  if(!existing) throw new Error('D1 conflict without matching record');
  if(existing.payload_sha256 !== hash) return error('SIGNAL_ID_CONFLICT',409);
  return json({accepted:true,duplicate:true,signal_id:existing.id,status:'RECEIVED',execution_enabled:false},200);
}

async function openAgentSocket(request, env) {
  if ((request.headers.get('upgrade') || '').toLowerCase() !== 'websocket') return error('UPGRADE_REQUIRED',426);
  if (!env?.AGENT_HUB || !env?.DB) return error('SERVICE_UNAVAILABLE',503);

  const agent = await authenticateAgent(request, env);
  if (!agent) return error('UNAUTHORIZED',401);

  const id = env.AGENT_HUB.idFromName(agent.id);
  const stub = env.AGENT_HUB.get(id);
  const h = new Headers(request.headers);
  h.set('x-sb-agent-id', agent.id);
  h.set('x-sb-tenant-id', agent.tenant_id);
  h.delete('authorization');

  await env.DB.prepare(
    'UPDATE agent_connections SET last_connected_at=CURRENT_TIMESTAMP WHERE id=?'
  ).bind(agent.id).run();

  return stub.fetch(new Request('https://agent-hub/ws',{method:'GET',headers:h}));
}

export async function handleRequest(request,env) {
  const url=new URL(request.url);

  if(url.pathname==='/health' && request.method==='GET') {
    return json({
      service:'signalbridge-ingress',
      ok:true,
      deployment_tier:env?.DEPLOYMENT_TIER || 'unknown',
      d1:!!env?.DB,
      agent_hub:!!env?.AGENT_HUB,
      websocket_agent_transport:true,
      execution_enabled:false
    });
  }

  if(url.pathname==='/v1/agent/ws') {
    if(request.method!=='GET') return new Response(null,{status:405,headers:{...headers,allow:'GET'}});
    try { return await openAgentSocket(request,env); }
    catch(e){ console.error('Agent websocket failure',e?.name||'Error'); return error('SERVICE_UNAVAILABLE',503); }
  }

  if(/^\/v1\/ingress\/tradingview\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)){
    if(request.method!=='POST') return new Response(null,{status:405,headers:{...headers,allow:'POST'}});
    if(url.search) return error('QUERY_NOT_ALLOWED',400);
    const token=url.pathname.split('/')[4];
    try{return await acceptTradingView(request,env,token);}
    catch(e){
      console.error('TradingView ingress persistence failure',e?.name||'Error');
      return error('SERVICE_UNAVAILABLE',503);
    }
  }

  return error('NOT_FOUND',404);
}
export default {fetch:handleRequest};
