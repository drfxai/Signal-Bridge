import { validateTradingView, ValidationError, stableStringify } from './validate.mjs';
import { authenticateAgent } from './agent-auth.mjs';
import { createAndDispatch, validateTestSignal } from './command.mjs';
import { parseTelegramTrade } from './telegram-parser.mjs';
import { parseGodModeAlert } from './godmode-parser.mjs';
import { TEST_UI } from './test-ui.mjs';
export { AgentHub } from './agent-hub.mjs';

const MAX_BYTES=16_384;
const AUTH_PATTERN=/^[A-Za-z0-9_-]{43}$/;
const ENCODER=new TextEncoder();
const headers={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{...headers,'content-type':'application/json; charset=utf-8'}});
const error=(code,status)=>json({error:{code,retryable:status>=500}},status);
const html=value=>new Response(value,{headers:{...headers,'content-type':'text/html; charset=utf-8'}});

export async function sha256(text){
 const digest=await crypto.subtle.digest('SHA-256',ENCODER.encode(text));
 return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}

async function readBounded(request){
 const length=request.headers.get('content-length');
 if(length!==null&&(!/^\d+$/.test(length)||Number(length)>MAX_BYTES))throw new ValidationError('BODY_TOO_LARGE');
 if(!request.body)throw new ValidationError('INVALID_JSON');
 const reader=request.body.getReader(),chunks=[];let total=0;
 try{
  while(true){
   const {value,done}=await reader.read();if(done)break;
   total+=value.byteLength;
   if(total>MAX_BYTES){await reader.cancel().catch(()=>{});throw new ValidationError('BODY_TOO_LARGE')}
   chunks.push(value);
  }
 }finally{reader.releaseLock()}
 const bytes=new Uint8Array(total);let offset=0;
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
 return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
}

async function readJson(request){
 try{return JSON.parse(await readBounded(request))}
 catch(e){throw new ValidationError(e instanceof ValidationError?e.code:(e instanceof SyntaxError?'INVALID_JSON':'INVALID_ENCODING'))}
}

async function acceptTradingView(request,env,token){
 if(!AUTH_PATTERN.test(token))return error('UNAUTHORIZED',401);
 if(!env?.DB)return error('SERVICE_UNAVAILABLE',503);

 const digest=await sha256(token);
 const conn=await env.DB.prepare(
  "SELECT id,tenant_id,agent_id,delivery_mode FROM ingress_connections WHERE token_sha256=? AND provider='tradingview' AND status='active' LIMIT 1"
 ).bind(digest).first();
 if(!conn)return error('UNAUTHORIZED',401);

 const contentType=request.headers.get('content-type')||'';
 let signal,sourceHash=null;

 if(/^application\/json(?:\s*;|\s*$)/i.test(contentType)){
  let incoming;try{incoming=await readJson(request)}catch(e){return error(e.code,e.code==='BODY_TOO_LARGE'?413:400)}
  try{signal=validateTradingView(incoming)}catch(e){return error(e instanceof ValidationError?e.code:'INVALID_SIGNAL_SCHEMA',422)}
 }else if(/^text\/plain(?:\s*;|\s*$)/i.test(contentType)){
  let raw;try{raw=await readBounded(request)}catch(e){return error(e.code,e.code==='BODY_TOO_LARGE'?413:400)}
  if(!raw.includes('[[DRFX]]'))return error('UNSUPPORTED_MEDIA_TYPE',415);
  const parsed=parseGodModeAlert(raw);
  if(!parsed.ok)return error(parsed.reason,422);
  signal=parsed.signal;
  sourceHash=await sha256(raw.trim());
 }else{
  return error('UNSUPPORTED_MEDIA_TYPE',415);
 }

 const payload=stableStringify(signal);
 const hash=sourceHash||await sha256(payload);
 const id=crypto.randomUUID(),received=new Date().toISOString();
 const result=await env.DB.prepare(
  `INSERT INTO received_signals (id,tenant_id,connection_id,external_signal_id,payload_sha256,normalized_json,received_at,expires_at,status)
   VALUES (?,?,?,?,?,?,?,?, 'RECEIVED')
   ON CONFLICT(connection_id,external_signal_id) DO NOTHING`
 ).bind(id,conn.tenant_id,conn.id,signal.external_signal_id,hash,payload,received,signal.expires_at).run();
 if(!result?.success)throw new Error('D1 write not confirmed');

 let signalId=id,duplicate=result.meta?.changes!==1;
 if(duplicate){
  const existing=await env.DB.prepare(
   'SELECT id,payload_sha256 FROM received_signals WHERE connection_id=? AND external_signal_id=? LIMIT 1'
  ).bind(conn.id,signal.external_signal_id).first();
  if(!existing)throw new Error('D1 conflict without record');
  if(existing.payload_sha256!==hash)return error('SIGNAL_ID_CONFLICT',409);
  signalId=existing.id;
 }

 const dispatch=await createAndDispatch(env,{
  tenantId:conn.tenant_id,agentId:conn.agent_id,sourceType:'tradingview',sourceRef:conn.id,
  signalId,signal,mode:conn.delivery_mode
 });
 return json({
  accepted:true,duplicate,signal_id:signalId,status:'RECEIVED',execution_enabled:false,demo_execution_supported:true,
  command_id:dispatch.command_id,dispatch_status:dispatch.status,delivered:dispatch.delivered,execution_mode:conn.delivery_mode
 },duplicate?200:202);
}

async function openAgentSocket(request,env){
 if((request.headers.get('upgrade')||'').toLowerCase()!=='websocket')return error('UPGRADE_REQUIRED',426);
 const agent=await authenticateAgent(request,env);
 if(!agent)return error('UNAUTHORIZED',401);
 const stub=env.AGENT_HUB.get(env.AGENT_HUB.idFromName(agent.id));
 const h=new Headers(request.headers);
 h.set('x-sb-agent-id',agent.id);h.set('x-sb-tenant-id',agent.tenant_id);
 if(agent.account_login)h.set('x-sb-account-login',agent.account_login);
 if(agent.account_server)h.set('x-sb-account-server',agent.account_server);
 h.delete('authorization');
 await env.DB.prepare('UPDATE agent_connections SET last_connected_at=CURRENT_TIMESTAMP WHERE id=?').bind(agent.id).run();
 return stub.fetch(new Request('https://agent-hub/ws',{method:'GET',headers:h}));
}

async function handleTestSignal(request,env){
 const agent=await authenticateAgent(request,env);if(!agent)return error('UNAUTHORIZED',401);
 let body;try{body=await readJson(request)}catch(e){return error(e.code,e.code==='BODY_TOO_LARGE'?413:400)}
 let signal;try{signal=validateTestSignal(body)}catch(e){return error(e.message||'INVALID_TEST_SIGNAL',422)}
 const mode=body.mode==='demo_execute'?'demo_execute':'dry_run';
 const dispatch=await createAndDispatch(env,{tenantId:agent.tenant_id,agentId:agent.id,sourceType:'test',sourceRef:'dashboard',signal,mode});
 return json({...dispatch,execution_mode:mode},202);
}

async function handleCommandStatus(request,env,id){
 const agent=await authenticateAgent(request,env);if(!agent)return error('UNAUTHORIZED',401);
 const row=await env.DB.prepare(
  'SELECT id,status,execution_mode,created_at,delivered_at,updated_at,broker_ticket,broker_retcode,last_error FROM commands WHERE id=? AND agent_id=? LIMIT 1'
 ).bind(id,agent.id).first();
 return row?json(row):error('NOT_FOUND',404);
}

async function handleAgentStatus(request,env){
 const agent=await authenticateAgent(request,env);if(!agent)return error('UNAUTHORIZED',401);
 const stub=env.AGENT_HUB.get(env.AGENT_HUB.idFromName(agent.id));
 return stub.fetch(new Request('https://agent-hub/snapshot'));
}

async function handleTelegram(request,env,connectionId){
 if(!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type')||''))return json({ok:true,ignored:'UNSUPPORTED_MEDIA_TYPE'});
 const secret=request.headers.get('x-telegram-bot-api-secret-token')||'';
 if(!AUTH_PATTERN.test(secret))return error('UNAUTHORIZED',401);

 const conn=await env.DB.prepare(
  "SELECT id,tenant_id,secret_sha256,agent_id,delivery_mode,allowed_chat_id,pair_code_sha256 FROM telegram_connections WHERE id=? AND status='active' LIMIT 1"
 ).bind(connectionId).first();
 if(!conn||await sha256(secret)!==conn.secret_sha256)return error('UNAUTHORIZED',401);

 let update;try{update=await readJson(request)}catch{return json({ok:true,ignored:'INVALID_JSON'})}
 const updateId=Number(update?.update_id);if(!Number.isInteger(updateId))return json({ok:true,ignored:'NO_UPDATE_ID'});
 if(update.edited_message||update.edited_channel_post)return json({ok:true,ignored:'EDITED_MESSAGE_REQUIRES_REVIEW'});
 const msg=update.message||update.channel_post;
 if(!msg||typeof msg.text!=='string')return json({ok:true,ignored:'NO_TEXT'});
 const chatId=String(msg.chat?.id??'');if(!chatId)return json({ok:true,ignored:'NO_CHAT'});

 if(conn.allowed_chat_id&&conn.allowed_chat_id!==chatId)return json({ok:true,ignored:'CHAT_NOT_ALLOWED'});

 if(!conn.allowed_chat_id){
  const pairParts=msg.text.trim().split(/\s+/);
  const code=pairParts.length===2&&pairParts[0]==='/signalbridge_pair'&&/^[A-Za-z0-9_-]{8,64}$/.test(pairParts[1])?pairParts[1]:null;
  if(!code||!conn.pair_code_sha256)return json({ok:true,ignored:'PAIRING_REQUIRED'});
  if(await sha256(code)!==conn.pair_code_sha256)return json({ok:true,ignored:'PAIRING_CODE_INVALID'});
  const claim=await env.DB.prepare(
   'UPDATE telegram_connections SET allowed_chat_id=?,pair_code_sha256=NULL WHERE id=? AND allowed_chat_id IS NULL AND pair_code_sha256=?'
  ).bind(chatId,conn.id,conn.pair_code_sha256).run();
  if(!claim?.success||claim.meta?.changes!==1)return json({ok:true,ignored:'PAIRING_RACE_RETRY'});
  return json({ok:true,paired:true});
 }

 const parsed=parseTelegramTrade(msg.text);
 const normalized=parsed.ok?JSON.stringify(parsed.signal):null;
 const textHash=await sha256(msg.text);
 const ins=await env.DB.prepare(
  'INSERT INTO telegram_updates (id,tenant_id,connection_id,update_id,chat_id,text_sha256,normalized_json) VALUES (?,?,?,?,?,?,?) ON CONFLICT(connection_id,update_id) DO NOTHING'
 ).bind(crypto.randomUUID(),conn.tenant_id,conn.id,updateId,chatId,textHash,normalized).run();
 if(!ins?.success)return error('SERVICE_UNAVAILABLE',503);

 let signal=parsed.ok?parsed.signal:null,duplicate=ins.meta?.changes!==1;
 if(duplicate){
  const prior=await env.DB.prepare('SELECT text_sha256,normalized_json FROM telegram_updates WHERE connection_id=? AND update_id=? LIMIT 1').bind(conn.id,updateId).first();
  if(!prior)return error('SERVICE_UNAVAILABLE',503);
  if(prior.text_sha256!==textHash)return json({ok:true,ignored:'UPDATE_ID_CONFLICT'});
  if(!prior.normalized_json)return json({ok:true,duplicate:true,ignored:parsed.ok?'PREVIOUSLY_IGNORED':parsed.reason});
  try{signal=JSON.parse(prior.normalized_json)}catch{return error('SERVICE_UNAVAILABLE',503)}
 }
 if(!signal)return json({ok:true,ignored:parsed.reason});

 const sourceRef='tg:'+conn.id+':'+updateId;
 const dispatch=await createAndDispatch(env,{tenantId:conn.tenant_id,agentId:conn.agent_id,sourceType:'telegram',sourceRef,signal,mode:conn.delivery_mode});
 return json({ok:true,duplicate,command_id:dispatch.command_id,dispatch_status:dispatch.status,delivered:dispatch.delivered,reason:dispatch.reason||null});
}

export async function handleRequest(request,env){
 const url=new URL(request.url);
 if(url.pathname==='/'&&request.method==='GET')return new Response(null,{status:302,headers:{location:'/test'}});
 if(url.pathname==='/test'&&request.method==='GET')return html(TEST_UI);
 if(url.pathname==='/health'&&request.method==='GET')return json({
  service:'signalbridge-ingress',ok:true,deployment_tier:env?.DEPLOYMENT_TIER||'unknown',
  d1:!!env?.DB,agent_hub:!!env?.AGENT_HUB,websocket_agent_transport:true,execution_enabled:false,demo_execution_supported:true
 });
 if(url.pathname==='/v1/agent/ws'){
  if(request.method!=='GET')return new Response(null,{status:405,headers:{...headers,allow:'GET'}});
  try{return await openAgentSocket(request,env)}catch(e){console.error('agent ws',e?.name||'Error');return error('SERVICE_UNAVAILABLE',503)}
 }
 if(url.pathname==='/v1/agent/status'&&request.method==='GET')return handleAgentStatus(request,env);
 if(url.pathname==='/v1/test/signal'&&request.method==='POST')return handleTestSignal(request,env);

 const commandMatch=url.pathname.match(/^\/v1\/commands\/([0-9a-f-]{36})$/i);
 if(commandMatch&&request.method==='GET')return handleCommandStatus(request,env,commandMatch[1]);

 const tg=url.pathname.match(/^\/v1\/ingress\/telegram\/([A-Za-z0-9_-]{8,80})$/);
 if(tg){
  if(request.method!=='POST')return new Response(null,{status:405,headers:{...headers,allow:'POST'}});
  try{return await handleTelegram(request,env,tg[1])}
  catch(e){console.error('telegram ingress',e?.name||'Error');return error('SERVICE_UNAVAILABLE',503)}
 }

 if(/^\/v1\/ingress\/tradingview\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)){
  if(request.method!=='POST')return new Response(null,{status:405,headers:{...headers,allow:'POST'}});
  if(url.search)return error('QUERY_NOT_ALLOWED',400);
  try{return await acceptTradingView(request,env,url.pathname.split('/')[4])}
  catch(e){console.error('tv ingress',e?.name||'Error');return error('SERVICE_UNAVAILABLE',503)}
 }

 return error('NOT_FOUND',404);
}
export default {fetch:handleRequest};
