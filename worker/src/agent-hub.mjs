const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const RECEIPT_STATES=new Set(['PREVIEWED','SUBMITTED','FILLED','BROKER_REJECTED','REJECTED','ACCOUNT_MISMATCH','EXPIRED','ERROR','DUPLICATE']);
export function receiptTransitionAllowed(from,to){if(from===to)return true;if(from==='PENDING'||from==='DELIVERED')return RECEIPT_STATES.has(to);if(from==='SUBMITTED')return ['FILLED','BROKER_REJECTED','ERROR','DUPLICATE'].includes(to);return false}
export function terminalReadyAttachment(a){return !!(a&&a.terminalOnline===true&&a.account&&a.account.login&&a.account.server)}
export function shouldReplayAfterTerminalState(previousReady,currentAttachment){return previousReady!==true&&terminalReadyAttachment(currentAttachment)}
const safe=(v,n=160)=>String(v??'').replace(/[|\u0000-\u001f]/g,' ').slice(0,n);
function parseMessage(message){if(typeof message!=='string'||message.length>16384)return null;try{const b=JSON.parse(message);return b&&typeof b==='object'&&!Array.isArray(b)?b:null}catch{return null}}
function parseEaLine(message){if(typeof message!=='string'||message.length>16384)return null;const p=message.trim().split('|');return p[0]?p:null}
function eaCorrelationTag(value){
 const s=String(value||'');let a=2166136261>>>0,b=2246822519>>>0;
 for(let i=0;i<s.length;i++){const n=s.charCodeAt(i);a=Math.imul(a^n,16777619)>>>0;b=Math.imul(b^(n+i),3266489917)>>>0}
 return (a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0')).slice(0,12);
}
function encodeEaCommand(c){
 const o=c.order||{},t=Array.isArray(o.take_profits)?o.take_profits:[],expiry=c.expires_at?Date.parse(c.expires_at):0;
 return ['CMD',safe(c.command_id,64),safe(c.execution_mode,32),safe(c.action,16),safe(c.management_event||'ENTRY',16),safe(c.side||'',8),safe(c.symbol||'',32),safe(c.correlation_tag||eaCorrelationTag(c.correlation_id||c.command_id),12),safe(o.volume?.mode||'FIXED_LOTS',24),Number(o.volume?.value||0),Number(o.reference_price||0),Number(o.stop_loss||0),Number(t[0]||0),Number(t[1]||0),Number(t[2]||t[t.length-1]||0),Number.isFinite(expiry)?expiry:0,safe(c.source?.type||'unknown',24),safe(c.source?.strategy||'',80),safe(c.test_account?.mode||'',12),safe(c.test_account?.login||'',64),safe(c.test_account?.server||'',120)].join('|');
}

export class AgentHub{
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 broadcast(event){for(const ws of this.ctx.getWebSockets()){const a=ws.deserializeAttachment()||{};if(a.role==='observer'&&ws.readyState===WebSocket.OPEN){try{ws.send(JSON.stringify(event))}catch{}}}}
 currentExecutionSockets(){return this.ctx.getWebSockets().filter(ws=>{const a=ws.deserializeAttachment()||{};return (a.role==='agent'||a.role==='ea')&&ws.readyState===WebSocket.OPEN})}
 currentAgentSockets(){return this.currentExecutionSockets()}
 async licenseIsValid(a){
  if(a.role!=='ea')return true;
  if(!a.licenseId||!/^[a-f0-9]{64}$/.test(a.licenseHash||''))return false;
  const row=await this.env.DB.prepare(
   "SELECT l.status,l.expires_at,l.account_login,l.account_server,l.token_sha256,a.status AS agent_status " +
   "FROM ea_licenses l JOIN agent_connections a ON a.id=l.agent_id " +
   "WHERE l.id=? AND l.agent_id=? LIMIT 1"
  ).bind(a.licenseId,a.agentId).first();
  if(!row||row.status!=='active'||row.agent_status!=='active'||row.token_sha256!==a.licenseHash)return false;
  if(row.expires_at){const expires=Date.parse(row.expires_at.replace(' ','T')+'Z');if(!Number.isFinite(expires)||expires<=Date.now())return false;}
  a.licenseExpires=row.expires_at;
  if(a.account&&(!row.account_login||!row.account_server||
    row.account_login!==a.account.login||row.account_server!==a.account.server))return false;
  return true;
 }
 async bindEaLicense(a,account,ws){
  // Atomic first-use claim. A stolen or reused code cannot attach another account.
  const updated=await this.env.DB.prepare(
   "UPDATE ea_licenses SET account_login=?,account_server=?,activated_at=CURRENT_TIMESTAMP, " +
   "expires_at=datetime('now',duration_modifier),last_connected_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP " +
   "WHERE id=? AND agent_id=? AND status='active' AND activated_at IS NULL " +
   "AND account_login IS NULL AND account_server IS NULL AND token_sha256=?"
  ).bind(account.login,account.server,a.licenseId,a.agentId,a.licenseHash).run();
  if(!updated?.success){ws.send('ERR|LICENSE_STORAGE_UNAVAILABLE');ws.close(1011,'license store unavailable');return false}
  const row=await this.env.DB.prepare(
   "SELECT account_login,account_server,status,expires_at FROM ea_licenses WHERE id=? AND agent_id=?"
  ).bind(a.licenseId,a.agentId).first();
  if(!row||row.status!=='active'||!row.expires_at||
   !Number.isFinite(Date.parse(row.expires_at.replace(' ','T')+'Z'))||Date.parse(row.expires_at.replace(' ','T')+'Z')<=Date.now()){
   ws.send('ERR|LICENSE_EXPIRED');ws.close(1008,'license expired');return false;
  }
  if(row.account_login!==account.login||row.account_server!==account.server){
   ws.send('ERR|ACCOUNT_MISMATCH');ws.close(1008,'account mismatch');return false;
  }
  a.expectedLogin=row.account_login;a.expectedServer=row.account_server;a.licenseExpires=row.expires_at;
  return true;
 }
 sendCommand(ws,cmd,replay=false){const a=ws.deserializeAttachment()||{};if(cmd.action==='TEST'&&(a.role!=='ea'||!(a.capabilities||[]).some(c=>['timed-test-v1','timed-test-v2','live-test-v2'].includes(c))))return false;if(a.role==='ea')ws.send(encodeEaCommand(cmd));else ws.send(JSON.stringify({type:'command',...cmd,replay}))}
 async bindEaAccount(a,account,ws){
  if(a.role==='ea')return this.bindEaLicense(a,account,ws);
  if(a.expectedLogin&&a.expectedLogin!==account.login){ws.send('ERR|ACCOUNT_MISMATCH');ws.close(1008,'account mismatch');return false}
  if(a.expectedServer&&a.expectedServer!==account.server){ws.send('ERR|ACCOUNT_MISMATCH');ws.close(1008,'account mismatch');return false}
  if(!a.expectedLogin||!a.expectedServer){
   const result=await this.env.DB.prepare(`UPDATE agent_connections SET account_login=COALESCE(account_login,?),account_server=COALESCE(account_server,?) WHERE id=? AND status='active' AND (account_login IS NULL OR account_login=?) AND (account_server IS NULL OR account_server=?)`).bind(account.login,account.server,a.agentId,account.login,account.server).run();
   if(!result?.success||result.meta?.changes!==1){ws.send('ERR|ACCOUNT_MISMATCH');ws.close(1008,'account binding rejected');return false}
   a.expectedLogin=account.login;a.expectedServer=account.server;
  }
  return true;
 }
 async handleEaMessage(ws,message,a){
  const p=parseEaLine(message);if(!p){ws.send('ERR|INVALID_MESSAGE');return}
  a.lastSeenAt=new Date().toISOString();
  if(p[0]==='TEST_STATUS'){
   const status=p[2];if(!['OPEN','CLOSED','CLOSE_FAILED','REJECTED'].includes(status))return;
   await this.env.DB.prepare("UPDATE connection_tests SET status=?,broker_ticket=COALESCE(?,broker_ticket),detail=?,updated_at=CURRENT_TIMESTAMP WHERE command_id=? AND agent_id=? AND status!='CLOSED'").bind(status,safe(p[3],64)||null,safe(p[4],300),p[1],a.agentId).run();
   ws.send('TEST_ACK|'+safe(p[1],64)+'|'+status);return;
  }
  if(p[0]==='HELLO'||p[0]==='HB'){
   if(p.length<7){ws.send('ERR|INVALID_TERMINAL_STATE');return}
   const account={login:safe(p[1],64),server:safe(p[2],120),mode:safe(p[3],32),balance:Number.isFinite(Number(p[4]))?Number(p[4]):null,equity:Number.isFinite(Number(p[5]))?Number(p[5]):null,positions:Number.isFinite(Number(p[6]))?Number(p[6]):null,cloud_rtt_ms:Number.isFinite(Number(p[7]))?Math.max(0,Math.min(60000,Number(p[7]))):null};
   if(!account.login||!account.server||!await this.bindEaAccount(a,account,ws))return;
   if(!await this.licenseIsValid({...a,account})){ws.send('ERR|LICENSE_INVALID');ws.close(1008,'license invalid');return;}
   a.capabilities=String(p[8]||'').split(',').filter(c=>['timed-test-v1','timed-test-v2','live-test-v2'].includes(c));
   const wasReady=terminalReadyAttachment(a);a.account=account;a.terminalOnline=true;ws.serializeAttachment(a);
   this.broadcast({type:p[0]==='HELLO'?'terminal_state':'account_telemetry',agent_online:true,ea_online:true,terminal_online:true,account,server_time:new Date().toISOString()});
   ws.send((p[0]==='HELLO'?'HELLO_ACK':'HB_ACK')+'|'+Date.now()+'|'+(a.licenseExpires||''));
   if(shouldReplayAfterTerminalState(wasReady,a))this.ctx.waitUntil(this.replay(a.agentId,ws));return;
  }
  if(p[0]==='PING'){ws.send('PONG|'+safe(p[1],32)+'|'+Date.now());return}
  if(p[0]==='RCPT'){
   const commandId=safe(p[1],64),status=safe(p[2],32);if(!commandId||!RECEIPT_STATES.has(status)){ws.send('ERR|INVALID_RECEIPT');return}
   const ticket=safe(p[3],64)||null,retcode=Number.isFinite(Number(p[4]))?Number(p[4]):null,detail=safe(p.slice(5).join('|'),300)||null;
   const current=await this.env.DB.prepare('SELECT status,source_type FROM commands WHERE id=? AND agent_id=? LIMIT 1').bind(commandId,a.agentId).first();
   if(!current){ws.send('RACK|'+commandId+'|'+status+'|0|COMMAND_NOT_FOUND');return}
   if(!receiptTransitionAllowed(current.status,status)){ws.send('RACK|'+commandId+'|'+status+'|0|INVALID_TRANSITION');return}
   const result=await this.env.DB.prepare(`UPDATE commands SET status=?,broker_ticket=COALESCE(?,broker_ticket),broker_retcode=COALESCE(?,broker_retcode),last_error=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND agent_id=? AND status=?`).bind(status,ticket,retcode,(status==='REJECTED'||status==='BROKER_REJECTED'||status==='ERROR'||status==='ACCOUNT_MISMATCH')?detail:null,commandId,a.agentId,current.status).run();
   const stored=result?.meta?.changes===1;
   if(stored&&current.source_type==='test'&&['REJECTED','BROKER_REJECTED','EXPIRED','ACCOUNT_MISMATCH'].includes(status))await this.env.DB.prepare("UPDATE connection_tests SET status='REJECTED',detail=?,updated_at=CURRENT_TIMESTAMP WHERE command_id=? AND agent_id=? AND status='ARMED'").bind(detail,commandId,a.agentId).run();
   ws.serializeAttachment(a);if(stored)this.broadcast({type:'receipt',command_id:commandId,status,broker_ticket:ticket,broker_retcode:retcode,detail,server_time:new Date().toISOString()});ws.send('RACK|'+commandId+'|'+status+'|'+(stored?'1':'0'));return;
  }
  ws.send('ERR|UNSUPPORTED_MESSAGE');
 }
 async replay(agentId,ws){
  const attachment=ws.deserializeAttachment()||{};if(!terminalReadyAttachment(attachment)||!await this.licenseIsValid(attachment))return;
  const q=await this.env.DB.prepare("SELECT id,payload_json FROM commands WHERE agent_id=? AND status IN ('PENDING','DELIVERED') ORDER BY CASE WHEN status='PENDING' THEN 0 ELSE 1 END, created_at ASC LIMIT 200").bind(agentId).all();
  for(const row of q?.results||[]){
   let cmd;try{cmd=JSON.parse(row.payload_json)}catch{continue}
   const expiry=cmd.expires_at?Date.parse(cmd.expires_at):0;
   if(cmd.action!=='MANAGE'&&cmd.action!=='TEST'&&expiry&&expiry<=Date.now()){
    await this.env.DB.prepare("UPDATE commands SET status='EXPIRED',last_error='expired before reconnect replay',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('PENDING','DELIVERED')").bind(row.id).run();
    continue;
   }
   if(cmd.action==='TEST'&&!(attachment.capabilities||[]).some(c=>['timed-test-v1','timed-test-v2','live-test-v2'].includes(c)))continue;
   if(ws.readyState===WebSocket.OPEN){
    if(!await this.licenseIsValid(ws.deserializeAttachment()||{}))return;
    this.sendCommand(ws,cmd,true);
    await this.env.DB.prepare("UPDATE commands SET status='DELIVERED',delivered_at=COALESCE(delivered_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('PENDING','DELIVERED')").bind(row.id).run();
   }
  }
 }
 async fetch(request){
  const url=new URL(request.url);
  if(url.pathname==='/ws'){
   if((request.headers.get('upgrade')||'').toLowerCase()!=='websocket')return json({error:'UPGRADE_REQUIRED'},426);
   const agentId=request.headers.get('x-sb-agent-id')||'',tenantId=request.headers.get('x-sb-tenant-id')||'',role=request.headers.get('x-sb-client-role')==='ea'?'ea':'agent',licenseId=request.headers.get('x-sb-license-id')||'',licenseHash=request.headers.get('x-sb-license-hash')||'';if(!agentId||!tenantId||(role==='ea'&&(!licenseId||!/^[a-f0-9]{64}$/.test(licenseHash))))return json({error:'UNAUTHORIZED'},401);
   for(const old of this.currentExecutionSockets()){try{old.close(4001,'superseded by newer execution connection')}catch{}}
   const pair=new WebSocketPair(),client=pair[0],server=pair[1];this.ctx.acceptWebSocket(server);
   server.serializeAttachment({role,agentId,tenantId,licenseId:role==='ea'?licenseId:null,licenseHash:role==='ea'?licenseHash:null,expectedLogin:request.headers.get('x-sb-account-login')||null,expectedServer:request.headers.get('x-sb-account-server')||null,connectedAt:new Date().toISOString(),lastSeenAt:new Date().toISOString(),terminalOnline:false,account:null});
   if(role==='ea')server.send('READY|signalbridge-ea/1|demo_only');else server.send(JSON.stringify({type:'hello',protocol:'signalbridge-agent/1',agent_id:agentId,execution_enabled:'demo_only'}));
   const protocols=(request.headers.get('sec-websocket-protocol')||'').split(',').map(x=>x.trim());
   const wanted=role==='ea'?'signalbridge-ea-v1':'signalbridge-agent-v1',selected=protocols.includes(wanted)?wanted:null;
   return new Response(null,{status:101,webSocket:client,headers:selected?{'sec-websocket-protocol':selected}:{}});
  }
  if(url.pathname==='/observer'){
   if((request.headers.get('upgrade')||'').toLowerCase()!=='websocket')return json({error:'UPGRADE_REQUIRED'},426);
   const agentId=request.headers.get('x-sb-agent-id')||'',tenantId=request.headers.get('x-sb-tenant-id')||'';if(!agentId||!tenantId)return json({error:'UNAUTHORIZED'},401);
   const pair=new WebSocketPair(),client=pair[0],server=pair[1];this.ctx.acceptWebSocket(server);
   server.serializeAttachment({role:'observer',agentId,tenantId,connectedAt:new Date().toISOString(),lastSeenAt:new Date().toISOString()});
   const agents=this.currentExecutionSockets(),a=agents[0]?.deserializeAttachment?.()||{};
   server.send(JSON.stringify({type:'dashboard_snapshot',agent_online:agents.length>0,terminal_online:terminalReadyAttachment(a),account:a.account||null,server_time:new Date().toISOString()}));
   const protocols=(request.headers.get('sec-websocket-protocol')||'').split(',').map(x=>x.trim());
   const selected=protocols.includes('signalbridge-dashboard-v1')?'signalbridge-dashboard-v1':null;
   return new Response(null,{status:101,webSocket:client,headers:selected?{'sec-websocket-protocol':selected}:{}});
  }
  if(url.pathname==='/dispatch'&&request.method==='POST'){
   const body=await request.json().catch(()=>null);if(!body||body.protocol!=='signalbridge-command/1'||!body.command_id||(body.execution_mode==='test_execute'&&body.action!=='TEST'))return json({error:'BAD_COMMAND'},400);
   const sockets=this.currentExecutionSockets();if(!sockets.length)return json({ok:true,delivered:0,reason:'EA_OFFLINE'});
   const socket=sockets.find(ws=>terminalReadyAttachment(ws.deserializeAttachment()||{}));
   if(!socket)return json({ok:true,delivered:0,reason:'TERMINAL_OFFLINE'});
   if(!await this.licenseIsValid(socket.deserializeAttachment()||{})){
    try{socket.close(1008,'license inactive')}catch{}
    return json({ok:true,delivered:0,reason:'LICENSE_INACTIVE'});
   }
   if(body.action==='TEST'&&!((socket.deserializeAttachment()||{}).capabilities||[]).some(c=>['timed-test-v1','timed-test-v2','live-test-v2'].includes(c)))return json({ok:true,delivered:0,reason:'EA_UPDATE_REQUIRED'});
   this.sendCommand(socket,body,false);this.broadcast({type:'command_delivery',command_id:body.command_id,action:body.action,management_event:body.management_event||null,symbol:body.symbol||null,execution_mode:body.execution_mode});return json({ok:true,delivered:1,reason:null});
  }
  if(url.pathname==='/snapshot'&&request.method==='GET'){
   const clients=this.currentExecutionSockets().map(ws=>{const a=ws.deserializeAttachment()||{};return {agent_id:a.agentId||null,client_type:a.role||null,connected_at:a.connectedAt||null,last_seen_at:a.lastSeenAt||null,terminal_online:a.terminalOnline===true,account:a.account||null,capabilities:a.capabilities||[]}});
   return json({connected:clients.length,clients});
  }
  return json({error:'NOT_FOUND'},404);
 }
 async webSocketMessage(ws,message){
  const a=ws.deserializeAttachment()||{};a.lastSeenAt=new Date().toISOString();
  if(a.role==='ea'){await this.handleEaMessage(ws,message,a);return}
  const body=parseMessage(message);if(!body){ws.send(JSON.stringify({type:'error',code:'INVALID_MESSAGE'}));return}
  if(a.role==='observer'){if(body.type==='ping')ws.send(JSON.stringify({type:'pong',server_time:new Date().toISOString()}));else ws.send(JSON.stringify({type:'error',code:'OBSERVER_READ_ONLY'}));return}
  if(a.role!=='agent'){ws.send(JSON.stringify({type:'error',code:'UNAUTHORIZED_SOCKET'}));return}
  if(body.type==='terminal_state'){
   const wasReady=terminalReadyAttachment(a);
   if(body.online===false){a.terminalOnline=false;a.account=null;ws.serializeAttachment(a);this.broadcast({type:'terminal_state',agent_online:true,terminal_online:false,account:null,server_time:new Date().toISOString()});ws.send(JSON.stringify({type:'terminal_state_ack',online:false}));return}
   if(body.online!==true||!body.account||typeof body.account!=='object'){ws.send(JSON.stringify({type:'error',code:'INVALID_TERMINAL_STATE'}));return}
   const account={login:safe(body.account.login,64),server:safe(body.account.server,120),mode:safe(body.account.mode,32),balance:Number.isFinite(Number(body.account.balance))?Number(body.account.balance):null,equity:Number.isFinite(Number(body.account.equity))?Number(body.account.equity):null,positions:Number.isFinite(Number(body.account.positions))?Number(body.account.positions):null,cloud_rtt_ms:Number.isFinite(Number(body.account.cloud_rtt_ms))?Math.max(0,Math.min(60000,Number(body.account.cloud_rtt_ms))):null};
   if(!account.login||!account.server){ws.send(JSON.stringify({type:'error',code:'INVALID_TERMINAL_ACCOUNT'}));return}
   if(a.expectedLogin&&a.expectedLogin!==account.login){ws.send(JSON.stringify({type:'error',code:'ACCOUNT_MISMATCH'}));ws.close(1008,'account mismatch');return}
   if(a.expectedServer&&a.expectedServer!==account.server){ws.send(JSON.stringify({type:'error',code:'ACCOUNT_MISMATCH'}));ws.close(1008,'server mismatch');return}
   if(!a.expectedLogin||!a.expectedServer){
    const result=await this.env.DB.prepare(`UPDATE agent_connections SET account_login=COALESCE(account_login,?),account_server=COALESCE(account_server,?) WHERE id=? AND status='active' AND (account_login IS NULL OR account_login=?) AND (account_server IS NULL OR account_server=?)`).bind(account.login,account.server,a.agentId,account.login,account.server).run();
    if(!result?.success||result.meta?.changes!==1){ws.send(JSON.stringify({type:'error',code:'ACCOUNT_MISMATCH'}));ws.close(1008,'account binding rejected');return}
    a.expectedLogin=account.login;a.expectedServer=account.server;
   }
   a.account=account;a.terminalOnline=true;a.lastSeenAt=new Date().toISOString();ws.serializeAttachment(a);this.broadcast({type:'terminal_state',agent_online:true,terminal_online:true,account,server_time:new Date().toISOString()});if(shouldReplayAfterTerminalState(wasReady,a))this.ctx.waitUntil(this.replay(a.agentId,ws));ws.send(JSON.stringify({type:'terminal_state_ack',online:true}));return;
  }
  if(body.type==='latency_report'){
   const rtt=Number(body.cloud_rtt_ms);if(!Number.isFinite(rtt)||rtt<0||rtt>60000){ws.send(JSON.stringify({type:'error',code:'INVALID_LATENCY_REPORT'}));return}
   if(a.account)a.account={...a.account,cloud_rtt_ms:Math.round(rtt)};a.lastSeenAt=new Date().toISOString();ws.serializeAttachment(a);
   this.broadcast({type:'latency',cloud_rtt_ms:Math.round(rtt),server_time:new Date().toISOString()});ws.send(JSON.stringify({type:'latency_ack',cloud_rtt_ms:Math.round(rtt)}));return;
  }
  if(body.type==='heartbeat'){
   const wasReady=terminalReadyAttachment(a);
   const account=body.account&&typeof body.account==='object'?{login:safe(body.account.login,64),server:safe(body.account.server,120),mode:safe(body.account.mode,32),balance:Number.isFinite(Number(body.account.balance))?Number(body.account.balance):null,equity:Number.isFinite(Number(body.account.equity))?Number(body.account.equity):null,positions:Number.isFinite(Number(body.account.positions))?Number(body.account.positions):null,cloud_rtt_ms:Number.isFinite(Number(body.account.cloud_rtt_ms))?Math.max(0,Math.min(60000,Number(body.account.cloud_rtt_ms))):null}:null;
   if(account){
    if(a.expectedLogin&&a.expectedLogin!==account.login){ws.send(JSON.stringify({type:'error',code:'ACCOUNT_MISMATCH'}));ws.close(1008,'account mismatch');return}
    if(a.expectedServer&&a.expectedServer!==account.server){ws.send(JSON.stringify({type:'error',code:'ACCOUNT_MISMATCH'}));ws.close(1008,'server mismatch');return}
    if(!a.expectedLogin||!a.expectedServer){
     const result=await this.env.DB.prepare(`UPDATE agent_connections SET account_login=COALESCE(account_login,?),account_server=COALESCE(account_server,?) WHERE id=? AND status='active' AND (account_login IS NULL OR account_login=?) AND (account_server IS NULL OR account_server=?)`).bind(account.login,account.server,a.agentId,account.login,account.server).run();
     if(!result?.success||result.meta?.changes!==1){ws.send(JSON.stringify({type:'error',code:'ACCOUNT_MISMATCH'}));ws.close(1008,'account binding rejected');return}
     a.expectedLogin=account.login;a.expectedServer=account.server;
    }a.account=account;a.terminalOnline=true;
   }
   ws.serializeAttachment(a);if(account){this.broadcast({type:'account_telemetry',agent_online:true,terminal_online:true,account,server_time:new Date().toISOString()});if(shouldReplayAfterTerminalState(wasReady,a))this.ctx.waitUntil(this.replay(a.agentId,ws));}ws.send(JSON.stringify({type:'heartbeat_ack',server_time:new Date().toISOString()}));return;
  }
  if(body.type==='receipt'){
   const commandId=safe(body.command_id,64),status=safe(body.status,32);if(!commandId||!RECEIPT_STATES.has(status)){ws.send(JSON.stringify({type:'error',code:'INVALID_RECEIPT'}));return}
   const ticket=safe(body.broker_ticket,64)||null,retcode=Number.isFinite(Number(body.broker_retcode))?Number(body.broker_retcode):null,detail=safe(body.detail,300)||null;
   const current=await this.env.DB.prepare('SELECT status,source_type FROM commands WHERE id=? AND agent_id=? LIMIT 1').bind(commandId,a.agentId).first();
   if(!current){ws.send(JSON.stringify({type:'receipt_ack',command_id:commandId,status,stored:false,code:'COMMAND_NOT_FOUND'}));return}
   if(!receiptTransitionAllowed(current.status,status)){ws.send(JSON.stringify({type:'receipt_ack',command_id:commandId,status,stored:false,code:'INVALID_TRANSITION',from:current.status,to:status}));return}
   const result=await this.env.DB.prepare(`UPDATE commands SET status=?,broker_ticket=COALESCE(?,broker_ticket),broker_retcode=COALESCE(?,broker_retcode),last_error=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND agent_id=? AND status=?`)
    .bind(status,ticket,retcode,(status==='REJECTED'||status==='BROKER_REJECTED'||status==='ERROR'||status==='ACCOUNT_MISMATCH')?detail:null,commandId,a.agentId,current.status).run();
   const stored=result?.meta?.changes===1;
   if(stored&&current.source_type==='test'&&['REJECTED','BROKER_REJECTED','EXPIRED','ACCOUNT_MISMATCH'].includes(status))await this.env.DB.prepare("UPDATE connection_tests SET status='REJECTED',detail=?,updated_at=CURRENT_TIMESTAMP WHERE command_id=? AND agent_id=? AND status='ARMED'").bind(detail,commandId,a.agentId).run();
   ws.serializeAttachment(a);if(stored)this.broadcast({type:'receipt',command_id:commandId,status,broker_ticket:ticket,broker_retcode:retcode,detail,server_time:new Date().toISOString()});ws.send(JSON.stringify({type:'receipt_ack',command_id:commandId,status,stored}));return;
  }
  ws.send(JSON.stringify({type:'error',code:'UNSUPPORTED_MESSAGE'}));
 }
 async webSocketClose(ws,code,reason){try{ws.close(code||1000,safe(reason,120))}catch{}}
 async webSocketError(ws){try{ws.close(1011,'socket error')}catch{}}
}
