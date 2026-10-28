import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import {createHash} from 'node:crypto';
import {ReceiptOutbox} from './receipt-outbox.mjs';

const configPath=path.resolve(process.argv[2]||'./config.json');
if(!fs.existsSync(configPath))throw new Error('Missing config.json. Copy config.example.json and add your Agent token.');
const cfg=JSON.parse(fs.readFileSync(configPath,'utf8'));
const cloudUrl=cfg.cloud_url||'wss://signalbridge.drfx.online/v1/agent/ws';
const token=String(cfg.agent_token||''),host='127.0.0.1',port=Number(cfg.local_port||17777);
const receiptJournalPath=path.resolve(cfg.receipt_outbox||path.join(path.dirname(configPath),'receipt-outbox.jsonl'));
if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw new Error('agent_token must be the 43-character SignalBridge token.');
if(typeof WebSocket==='undefined')throw new Error('Node.js 22+ is required.');
fs.mkdirSync(path.dirname(receiptJournalPath),{recursive:true});

let ws=null,mt5=null,mt5Buffer='',reconnectMs=250,reconnectTimer=null,queue=[],lastAccount=null,lastHeartbeatAt=0,probeSentAt=0,lastLatencyMeasuredAt=0,cloudRttMs=null;
const MAX_QUEUE=100,HB_INTERVAL=15*60*1000,RECEIPT_RETRY_BASE_MS=5000,RECEIPT_RETRY_MAX_MS=300000;
const FINAL_LOCAL_ACK_STATES=new Set(['FILLED','BROKER_REJECTED','DUPLICATE']);
const log=(...x)=>console.log(new Date().toISOString(),...x);
const clean=v=>String(v??'').replace(/[|\r\n]/g,' ').slice(0,240);
const tagFor=v=>createHash('sha256').update(String(v||'')).digest('hex').slice(0,12);
const wsSend=v=>{if(ws?.readyState===WebSocket.OPEN){ws.send(JSON.stringify(v));return true}return false};
const sendTerminalState=online=>wsSend({type:'terminal_state',online:online===true,account:online===true?lastAccount:null});

const receiptOutbox=new ReceiptOutbox(receiptJournalPath,{baseRetryMs:RECEIPT_RETRY_BASE_MS,maxRetryMs:RECEIPT_RETRY_MAX_MS});
function sendRack(commandId,status){if(mt5&&!mt5.destroyed&&mt5.writable)mt5.write('RACK|'+clean(commandId)+'|'+clean(status)+'\n')}
function flushReceiptOutbox(force=false){
 if(ws?.readyState!==WebSocket.OPEN)return;
 const now=Date.now();
 for(const {key,receipt} of receiptOutbox.pending(now,force)){ws.send(JSON.stringify(receipt));receiptOutbox.markSent(key,now)}
}
function queueReceipt(commandId,status,ticket='',retcode='',detail=''){
 const receipt={type:'receipt',command_id:clean(commandId),status:clean(status),broker_ticket:ticket?clean(ticket):null,broker_retcode:retcode===''?null:Number(retcode),detail:clean(detail)};
 receiptOutbox.queue(receipt);sendRack(receipt.command_id,receipt.status);flushReceiptOutbox(true);
}
function acknowledgeReceipt(message){
 if(message.stored===true||message.code==='INVALID_TRANSITION'){
  if(receiptOutbox.acknowledge(message.command_id,message.status))log('receipt acknowledged',message.command_id,message.status,message.stored?'stored':message.code);
 }
}
function sendHeartbeat(force=false){
 if(!lastAccount||ws?.readyState!==WebSocket.OPEN)return;
 const now=Date.now();if(!force&&now-lastHeartbeatAt<HB_INTERVAL)return;
 lastHeartbeatAt=now;if(now-lastLatencyMeasuredAt>=60_000&&probeSentAt===0)probeSentAt=now;
 wsSend({type:'heartbeat',account:{...lastAccount,cloud_rtt_ms:cloudRttMs}});
}
function encodeCommand(c){
 const order=c.order||{},tps=Array.isArray(order.take_profits)?order.take_profits:[],tp1=tps[0]??0,tp2=tps[1]??0,tp3=tps[2]??tps[tps.length-1]??0,expiry=Date.parse(c.expires_at)||0;
 return ['CMD',clean(c.command_id),clean(c.execution_mode),clean(c.action),clean(c.management_event||'ENTRY'),clean(c.side||''),clean(c.symbol||''),tagFor(c.correlation_id||c.command_id),
  clean(order.volume?.mode||'FIXED_LOTS'),Number(order.volume?.value||0),Number(order.reference_price||0),Number(order.stop_loss||0),Number(tp1),Number(tp2),Number(tp3),expiry].join('|')+'\n';
}
function pruneExpiredQueue(){
 const now=Date.now(),keep=[];for(const c of queue){const expiry=Date.parse(c.expires_at)||0;if(c.action==='OPEN'&&expiry&&expiry<=now)queueReceipt(c.command_id,'EXPIRED','','','expired in local MT5 queue');else keep.push(c)}queue=keep;
}
function deliver(c){
 const line=encodeCommand(c);
 if(mt5&&!mt5.destroyed&&mt5.writable){mt5.write(line);log('command -> MT5',c.command_id,c.action,c.management_event||'',c.symbol||'');return true}
 pruneExpiredQueue();
 if(queue.some(x=>x.command_id===c.command_id)){log('duplicate command already queued',c.command_id);return false}
 if(queue.length>=MAX_QUEUE){queueReceipt(c.command_id,'ERROR','','','local MT5 queue full; command not forwarded');log('rejected command; local queue full',c.command_id);return false}
 queue.push(c);log('queued command; MT5 not connected',c.command_id);return false;
}
function flushCommands(){if(!mt5||mt5.destroyed)return;const q=queue;queue=[];for(const c of q)deliver(c)}
function parseMt5Line(line){
 const p=line.trim().split('|');if(!p[0])return;
 if(p[0]==='HELLO'||p[0]==='HB'){lastAccount={login:clean(p[1]),server:clean(p[2]),mode:clean(p[3]),balance:Number(p[4]||0),equity:Number(p[5]||0),positions:Number(p[6]||0)};if(p[0]==='HELLO')sendTerminalState(true);sendHeartbeat(p[0]==='HELLO');return}
 if(p[0]==='RCPT'&&p.length>=4){queueReceipt(clean(p[1]),clean(p[2]),clean(p[3]),clean(p[4]),p.slice(5).join('|'));if(FINAL_LOCAL_ACK_STATES.has(p[2]))sendHeartbeat(true)}
}
const server=net.createServer(socket=>{
 if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(socket.remoteAddress)){socket.destroy();return}
 if(mt5&&!mt5.destroyed)mt5.destroy();mt5=socket;mt5.setNoDelay(true);mt5.setKeepAlive(true,30000);log('MT5 connected on localhost');
 socket.on('data',buf=>{mt5Buffer+=buf.toString('utf8');for(;;){const i=mt5Buffer.indexOf('\n');if(i<0)break;const line=mt5Buffer.slice(0,i);mt5Buffer=mt5Buffer.slice(i+1);parseMt5Line(line)}});
 socket.on('close',()=>{if(mt5===socket){mt5=null;lastAccount=null;sendTerminalState(false)}log('MT5 disconnected')});
 socket.on('error',e=>log('MT5 socket error',e.message));flushCommands();
});
server.listen(port,host,()=>log('local MT5 bridge',host+':'+port));

function connectCloud(){
 if(reconnectTimer){clearTimeout(reconnectTimer);reconnectTimer=null}
 log('connecting',cloudUrl);ws=new WebSocket(cloudUrl,['signalbridge-agent-v1','sb-token.'+token]);
 ws.addEventListener('open',()=>{reconnectMs=250;log('Cloudflare WebSocket connected');if(lastAccount)sendTerminalState(true);sendHeartbeat(true);flushReceiptOutbox(true)});
 ws.addEventListener('message',ev=>{
  let m;try{m=JSON.parse(typeof ev.data==='string'?ev.data:String(ev.data))}catch{return}
  if(m.type==='hello'){log('AgentHub hello',m.agent_id);sendHeartbeat(true);return}
  if(m.type==='heartbeat_ack'){if(probeSentAt>0){cloudRttMs=Math.max(0,Date.now()-probeSentAt);probeSentAt=0;lastLatencyMeasuredAt=Date.now();if(lastAccount)lastAccount={...lastAccount,cloud_rtt_ms:cloudRttMs};wsSend({type:'latency_report',cloud_rtt_ms:cloudRttMs});log('Cloudflare RTT',cloudRttMs+'ms')}return}
  if(m.type==='receipt_ack'){acknowledgeReceipt(m);return}
  if(m.type==='command'){if(m.action==='OPEN'&&Date.parse(m.expires_at)&&Date.parse(m.expires_at)<=Date.now()){queueReceipt(m.command_id,'EXPIRED','','','expired before local delivery');return}deliver(m);return}
  if(m.type==='error')log('AgentHub error',m.code);
 });
 ws.addEventListener('close',ev=>{log('Cloudflare WebSocket closed',ev.code,ev.reason||'');scheduleReconnect()});
 ws.addEventListener('error',()=>log('Cloudflare WebSocket error'));
}
function scheduleReconnect(){if(reconnectTimer)return;const wait=reconnectMs;reconnectMs=Math.min(5000,Math.round(reconnectMs*1.8));reconnectTimer=setTimeout(()=>{reconnectTimer=null;connectCloud()},wait)}
connectCloud();
setInterval(()=>{sendHeartbeat(false);flushReceiptOutbox(false)},5000).unref();
process.on('SIGINT',()=>{try{ws?.close()}catch{};try{mt5?.destroy()}catch{};server.close(()=>process.exit(0))});
