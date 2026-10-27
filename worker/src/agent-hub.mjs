const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
const RECEIPT_STATES=new Set(['PREVIEWED','SUBMITTED','FILLED','BROKER_REJECTED','REJECTED','ACCOUNT_MISMATCH','EXPIRED','ERROR','DUPLICATE']);
const safe=(v,n=160)=>String(v??'').replace(/[\u0000-\u001f]/g,' ').slice(0,n);
function parseMessage(message){if(typeof message!=='string'||message.length>16384)return null;try{const b=JSON.parse(message);return b&&typeof b==='object'&&!Array.isArray(b)?b:null}catch{return null}}

export class AgentHub{
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 async replay(agentId,ws){
  const q=await this.env.DB.prepare("SELECT id,payload_json FROM commands WHERE agent_id=? AND status IN ('PENDING','DELIVERED') ORDER BY created_at ASC LIMIT 50").bind(agentId).all();
  for(const row of q?.results||[]){
   let cmd;try{cmd=JSON.parse(row.payload_json)}catch{continue}
   const expiry=cmd.expires_at?Date.parse(cmd.expires_at):0;
   if(expiry&&expiry<=Date.now()){
    await this.env.DB.prepare("UPDATE commands SET status='EXPIRED',last_error='expired before reconnect replay',updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('PENDING','DELIVERED')").bind(row.id).run();
    continue;
   }
   if(ws.readyState===WebSocket.OPEN){
    ws.send(JSON.stringify({type:'command',...cmd,replay:true}));
    await this.env.DB.prepare("UPDATE commands SET status='DELIVERED',delivered_at=COALESCE(delivered_at,CURRENT_TIMESTAMP),updated_at=CURRENT_TIMESTAMP WHERE id=? AND status IN ('PENDING','DELIVERED')").bind(row.id).run();
   }
  }
 }
 async fetch(request){
  const url=new URL(request.url);
  if(url.pathname==='/ws'){
   if((request.headers.get('upgrade')||'').toLowerCase()!=='websocket')return json({error:'UPGRADE_REQUIRED'},426);
   const agentId=request.headers.get('x-sb-agent-id')||'',tenantId=request.headers.get('x-sb-tenant-id')||'';if(!agentId||!tenantId)return json({error:'UNAUTHORIZED'},401);
   for(const old of this.ctx.getWebSockets()){try{old.close(4001,'superseded by newer agent connection')}catch{}}
   const pair=new WebSocketPair(),client=pair[0],server=pair[1];this.ctx.acceptWebSocket(server);
   server.serializeAttachment({agentId,tenantId,expectedLogin:request.headers.get('x-sb-account-login')||null,expectedServer:request.headers.get('x-sb-account-server')||null,connectedAt:new Date().toISOString(),lastSeenAt:new Date().toISOString(),account:null});
   server.send(JSON.stringify({type:'hello',protocol:'signalbridge-agent/1',agent_id:agentId,execution_enabled:'demo_only'}));
   this.ctx.waitUntil(this.replay(agentId,server));
   const selected=(request.headers.get('sec-websocket-protocol')||'').split(',').map(x=>x.trim()).find(x=>x.startsWith('sb-token.'));
   return new Response(null,{status:101,webSocket:client,headers:selected?{'sec-websocket-protocol':selected}:{}});
  }
  if(url.pathname==='/dispatch'&&request.method==='POST'){
   const body=await request.json().catch(()=>null);if(!body||body.protocol!=='signalbridge-command/1'||!body.command_id)return json({error:'BAD_COMMAND'},400);
   const sockets=this.ctx.getWebSockets().filter(ws=>ws.readyState===WebSocket.OPEN);if(!sockets.length)return json({ok:true,delivered:0});
   sockets[0].send(JSON.stringify({type:'command',...body}));return json({ok:true,delivered:1});
  }
  if(url.pathname==='/snapshot'&&request.method==='GET'){
   const clients=this.ctx.getWebSockets().map(ws=>{const a=ws.deserializeAttachment()||{};return {agent_id:a.agentId||null,connected_at:a.connectedAt||null,last_seen_at:a.lastSeenAt||null,account:a.account||null}});
   return json({connected:clients.length,clients});
  }
  return json({error:'NOT_FOUND'},404);
 }
 async webSocketMessage(ws,message){
  const body=parseMessage(message);if(!body){ws.send(JSON.stringify({type:'error',code:'INVALID_MESSAGE'}));return}
  const a=ws.deserializeAttachment()||{};a.lastSeenAt=new Date().toISOString();
  if(body.type==='heartbeat'){
   const account=body.account&&typeof body.account==='object'?{login:safe(body.account.login,64),server:safe(body.account.server,120),mode:safe(body.account.mode,32),balance:Number.isFinite(Number(body.account.balance))?Number(body.account.balance):null,equity:Number.isFinite(Number(body.account.equity))?Number(body.account.equity):null,positions:Number.isFinite(Number(body.account.positions))?Number(body.account.positions):null}:null;
   if(account){
    if(a.expectedLogin&&a.expectedLogin!==account.login){ws.send(JSON.stringify({type:'error',code:'ACCOUNT_MISMATCH'}));ws.close(1008,'account mismatch');return}
    if(a.expectedServer&&a.expectedServer!==account.server){ws.send(JSON.stringify({type:'error',code:'ACCOUNT_MISMATCH'}));ws.close(1008,'server mismatch');return}
    if(!a.expectedLogin||!a.expectedServer){
     const result=await this.env.DB.prepare(`UPDATE agent_connections SET account_login=COALESCE(account_login,?),account_server=COALESCE(account_server,?) WHERE id=? AND status='active' AND (account_login IS NULL OR account_login=?) AND (account_server IS NULL OR account_server=?)`).bind(account.login,account.server,a.agentId,account.login,account.server).run();
     if(!result?.success||result.meta?.changes!==1){ws.send(JSON.stringify({type:'error',code:'ACCOUNT_MISMATCH'}));ws.close(1008,'account binding rejected');return}
     a.expectedLogin=account.login;a.expectedServer=account.server;
    }a.account=account;
   }
   ws.serializeAttachment(a);ws.send(JSON.stringify({type:'heartbeat_ack',server_time:new Date().toISOString()}));return;
  }
  if(body.type==='receipt'){
   const commandId=safe(body.command_id,64),status=safe(body.status,32);if(!commandId||!RECEIPT_STATES.has(status)){ws.send(JSON.stringify({type:'error',code:'INVALID_RECEIPT'}));return}
   const ticket=safe(body.broker_ticket,64)||null,retcode=Number.isFinite(Number(body.broker_retcode))?Number(body.broker_retcode):null,detail=safe(body.detail,300)||null;
   const result=await this.env.DB.prepare(`UPDATE commands SET status=?,broker_ticket=COALESCE(?,broker_ticket),broker_retcode=COALESCE(?,broker_retcode),last_error=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND agent_id=?`)
    .bind(status,ticket,retcode,(status==='REJECTED'||status==='BROKER_REJECTED'||status==='ERROR'||status==='ACCOUNT_MISMATCH')?detail:null,commandId,a.agentId).run();
   ws.serializeAttachment(a);ws.send(JSON.stringify({type:'receipt_ack',command_id:commandId,stored:result?.meta?.changes===1}));return;
  }
  ws.send(JSON.stringify({type:'error',code:'UNSUPPORTED_MESSAGE'}));
 }
 async webSocketClose(ws,code,reason){try{ws.close(code||1000,safe(reason,120))}catch{}}
 async webSocketError(ws){try{ws.close(1011,'socket error')}catch{}}
}
