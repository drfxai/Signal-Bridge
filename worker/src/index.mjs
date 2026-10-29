import { validateTradingView, ValidationError, stableStringify } from './validate.mjs';
import { authenticateAgent } from './agent-auth.mjs';
import { authenticateEaLicense } from './ea-license.mjs';
import { createAndDispatch, validateTestSignal } from './command.mjs';
import { parseSignalMessage, telegramMessageFresh } from './signal-adapters.mjs';
import { parseGodModeAlert } from './godmode-parser.mjs';
import { TEST_UI } from './test-ui.mjs';
import { DASHBOARD_UI } from './dashboard-ui.mjs';
import { EXPERIENCE_HTML, EXPERIENCE_CSS, EXPERIENCE_JS, TELEGRAM_APP_PREVIEW_HTML, TELEGRAM_BOT_PREVIEW_HTML } from './experience-ui.mjs';
export { AgentHub } from './agent-hub.mjs';

const MAX_BYTES=16_384;
const AUTH_PATTERN=/^[A-Za-z0-9_-]{43}$/;
const ENCODER=new TextEncoder();
const headers={'cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{...headers,'content-type':'application/json; charset=utf-8'}});
const error=(code,status)=>json({error:{code,retryable:status>=500}},status);
const html=value=>new Response(value,{headers:{...headers,'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self' wss: ws:; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",'permissions-policy':'camera=(), microphone=(), geolocation=()'}});

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

async function acceptTradingView(request,env,token,ctx){
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
  if(incoming&&!incoming.schema_version&&typeof incoming==='object'&&'sl' in incoming){const settings=await env.DB.prepare('SELECT default_lots FROM member_signal_settings WHERE user_id=?').bind(conn.tenant_id).first();const parsed=parseSignalMessage(JSON.stringify(incoming),Date.now(),{defaultLots:settings?.default_lots||0.01});if(!parsed.ok)return error(parsed.reason,422);if(!parsed.signal.external_signal_id)return error('SIGNAL_ID_REQUIRED',422);signal=parsed.signal;sourceHash=await sha256(stableStringify(incoming));}else{try{signal=validateTradingView(incoming)}catch(e){return error(e instanceof ValidationError?e.code:'INVALID_SIGNAL_SCHEMA',422)}}
 }else if(/^text\/plain(?:\s*;|\s*$)/i.test(contentType)){
  let raw;try{raw=await readBounded(request)}catch(e){return error(e.code,e.code==='BODY_TOO_LARGE'?413:400)}
  if(raw.trim().startsWith('{'))return error('UNSUPPORTED_MEDIA_TYPE',415);
  const settings=raw.includes('[[DRFX]]')?null:await env.DB.prepare('SELECT default_lots FROM member_signal_settings WHERE user_id=?').bind(conn.tenant_id).first();
  const parsed=raw.includes('[[DRFX]]')?parseGodModeAlert(raw):parseSignalMessage(raw,Date.now(),{defaultLots:settings?.default_lots||0.01});
  if(parsed.ok&&!parsed.signal.external_signal_id){const id=raw.match(/(?:^|\n)\s*(?:ID|SIGNAL_ID)\s*[:=]\s*([A-Za-z0-9][A-Za-z0-9_.:-]{0,95})\s*(?=$|\n)/i)?.[1];if(!id)return error('SIGNAL_ID_REQUIRED',422);parsed.signal.external_signal_id=id;}
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

 if(env.TELEGRAM_RELAY&&ctx){ctx.waitUntil(env.TELEGRAM_RELAY.fetch(new Request('https://member-site/internal/signal-relay',{method:'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({signal_id:signalId})})).catch(()=>{}));}
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
 const protocols=(request.headers.get('sec-websocket-protocol')||'').split(',').map(x=>x.trim());
 if(protocols.includes('signalbridge-agent-v1'))h.set('sec-websocket-protocol','signalbridge-agent-v1');else h.delete('sec-websocket-protocol');
 await env.DB.prepare('UPDATE agent_connections SET last_connected_at=CURRENT_TIMESTAMP WHERE id=?').bind(agent.id).run();
 return stub.fetch(new Request('https://agent-hub/ws',{method:'GET',headers:h}));
}

async function openEaSocket(request,env){
 if((request.headers.get('upgrade')||'').toLowerCase()!=='websocket')return error('UPGRADE_REQUIRED',426);
 // A legacy agent connection key cannot authorize the paid EA endpoint.
 const license=await authenticateEaLicense(request,env);
 if(!license)return error('LICENSE_INVALID_OR_EXPIRED',401);
 const stub=env.AGENT_HUB.get(env.AGENT_HUB.idFromName(license.id));
 const h=new Headers(request.headers);
 h.set('x-sb-agent-id',license.id);
 h.set('x-sb-tenant-id',license.tenant_id);
 h.set('x-sb-client-role','ea');
 h.set('x-sb-license-id',license.license_id);
 h.set('x-sb-license-hash',license.license_token_sha256);
 if(license.account_login)h.set('x-sb-account-login',license.account_login);
 if(license.account_server)h.set('x-sb-account-server',license.account_server);
 h.delete('authorization');
 const protocols=(request.headers.get('sec-websocket-protocol')||'').split(',').map(x=>x.trim());
 if(protocols.includes('signalbridge-ea-v1'))h.set('sec-websocket-protocol','signalbridge-ea-v1');else h.delete('sec-websocket-protocol');
 await env.DB.prepare('UPDATE agent_connections SET last_connected_at=CURRENT_TIMESTAMP WHERE id=?').bind(license.id).run();
 return stub.fetch(new Request('https://agent-hub/ws',{method:'GET',headers:h}));
}

async function openDashboardSocket(request,env){
 if((request.headers.get('upgrade')||'').toLowerCase()!=='websocket')return error('UPGRADE_REQUIRED',426);
 const agent=await authenticateAgent(request,env);if(!agent)return error('UNAUTHORIZED',401);
 const stub=env.AGENT_HUB.get(env.AGENT_HUB.idFromName(agent.id)),h=new Headers(request.headers);
 h.set('x-sb-agent-id',agent.id);h.set('x-sb-tenant-id',agent.tenant_id);h.delete('authorization');
 const protocols=(request.headers.get('sec-websocket-protocol')||'').split(',').map(x=>x.trim());
 if(protocols.includes('signalbridge-dashboard-v1'))h.set('sec-websocket-protocol','signalbridge-dashboard-v1');else h.delete('sec-websocket-protocol');
 return stub.fetch(new Request('https://agent-hub/observer',{method:'GET',headers:h}));
}

async function handleDashboardSummary(request,env){
 const agent=await authenticateAgent(request,env);if(!agent)return error('UNAUTHORIZED',401);
 const stub=env.AGENT_HUB.get(env.AGENT_HUB.idFromName(agent.id));
 const [cmdRows,commandCount,signalCount,tgCount,snapshotResponse]=await Promise.all([
  env.DB.prepare('SELECT id,source_type,execution_mode,status,created_at,updated_at,broker_ticket,broker_retcode,last_error FROM commands WHERE agent_id=? ORDER BY created_at DESC LIMIT 30').bind(agent.id).all(),
  env.DB.prepare('SELECT COUNT(*) AS n FROM commands WHERE agent_id=?').bind(agent.id).first(),
  env.DB.prepare('SELECT COUNT(*) AS n FROM received_signals s JOIN ingress_connections i ON i.id=s.connection_id WHERE i.agent_id=?').bind(agent.id).first(),
  env.DB.prepare('SELECT COUNT(*) AS n FROM telegram_updates u JOIN telegram_connections t ON t.id=u.connection_id WHERE t.agent_id=?').bind(agent.id).first(),
  stub.fetch(new Request('https://agent-hub/snapshot'))
 ]);
 const snapshot=await snapshotResponse.json().catch(()=>({connected:0,clients:[]}));
 return json({agent_id:agent.id,tenant_id:agent.tenant_id,agent:snapshot,counts:{commands:Number(commandCount?.n)||0,signals:Number(signalCount?.n)||0,telegram_updates:Number(tgCount?.n)||0},commands:cmdRows?.results||[]});
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

 if(!telegramMessageFresh(msg))return json({ok:true,ignored:'STALE_OR_INVALID_MESSAGE_TIME'});
 const parsed=parseSignalMessage(msg.text);
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

export async function handleRequest(request,env,ctx){
 const url=new URL(request.url);
 if(url.pathname==='/'&&request.method==='GET')return new Response(null,{status:302,headers:{location:'/dashboard'}});
 if(request.method==='GET'&&url.pathname==='/experience')return new Response(null,{status:302,headers:{location:'/experience/'}});
 if(request.method==='GET'&&url.pathname==='/experience/')return html(EXPERIENCE_HTML);
 if(request.method==='GET'&&url.pathname==='/experience/styles.css')return new Response(EXPERIENCE_CSS,{headers:{...headers,'content-type':'text/css; charset=utf-8'}});
 if(request.method==='GET'&&url.pathname==='/experience/app.js')return new Response(EXPERIENCE_JS,{headers:{...headers,'content-type':'text/javascript; charset=utf-8'}});
 if(request.method==='GET'&&url.pathname==='/experience/telegram-webapp.html')return html(TELEGRAM_APP_PREVIEW_HTML);
 if(request.method==='GET'&&url.pathname==='/experience/telegram-bot-flow.html')return html(TELEGRAM_BOT_PREVIEW_HTML);
 if(url.pathname==='/dashboard'&&request.method==='GET')return html(DASHBOARD_UI);
 if(url.pathname==='/test'&&request.method==='GET')return html(TEST_UI);
 if(url.pathname==='/health'&&request.method==='GET')return json({
  service:'signalbridge-ingress',ok:true,deployment_tier:env?.DEPLOYMENT_TIER||'unknown',
  d1:!!env?.DB,agent_hub:!!env?.AGENT_HUB,direct_ea_websocket:true,legacy_agent_transport:true,execution_enabled:false,demo_execution_supported:true
 });
 if(url.pathname==='/v1/ea/ws'){
  if(request.method!=='GET')return new Response(null,{status:405,headers:{...headers,allow:'GET'}});
  try{return await openEaSocket(request,env)}catch(e){console.error('ea ws',e?.name||'Error');return error('SERVICE_UNAVAILABLE',503)}
 }
 if(url.pathname==='/v1/agent/ws'){
  if(request.method!=='GET')return new Response(null,{status:405,headers:{...headers,allow:'GET'}});
  try{return await openAgentSocket(request,env)}catch(e){console.error('agent ws',e?.name||'Error');return error('SERVICE_UNAVAILABLE',503)}
 }
 if(url.pathname==='/v1/agent/status'&&request.method==='GET')return handleAgentStatus(request,env);
 if(url.pathname==='/v1/dashboard/summary'&&request.method==='GET')return handleDashboardSummary(request,env);
 if(url.pathname==='/v1/dashboard/ws'){
  if(request.method!=='GET')return new Response(null,{status:405,headers:{...headers,allow:'GET'}});
  try{return await openDashboardSocket(request,env)}catch(e){console.error('dashboard ws',e?.name||'Error');return error('SERVICE_UNAVAILABLE',503)}
 }
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
  try{return await acceptTradingView(request,env,url.pathname.split('/')[4],ctx)}
  catch(e){console.error('tv ingress',e?.name||'Error');return error('SERVICE_UNAVAILABLE',503)}
 }

 return error('NOT_FOUND',404);
}
export default {fetch:handleRequest};
