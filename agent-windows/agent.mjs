import fs from 'node:fs';
import net from 'node:net';
import process from 'node:process';
import {createHash} from 'node:crypto';

const configPath=process.argv[2]||'./config.json';
if(!fs.existsSync(configPath))throw new Error('Missing config.json. Copy config.example.json and add your Agent token.');
const cfg=JSON.parse(fs.readFileSync(configPath,'utf8')),cloudUrl=cfg.cloud_url||'wss://signalbridge.drfx.online/v1/agent/ws',token=String(cfg.agent_token||''),host='127.0.0.1',port=Number(cfg.local_port||17777);
if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw new Error('agent_token must be the 43-character SignalBridge token.');
if(typeof WebSocket==='undefined')throw new Error('Node.js 22+ is required.');

let ws=null,mt5=null,mt5Buffer='',reconnectMs=250,reconnectTimer=null,queue=[],lastAccount=null,lastHeartbeatAt=0;
const MAX_QUEUE=100,HB_INTERVAL=15*60*1000;
const log=(...x)=>console.log(new Date().toISOString(),...x);
const clean=v=>String(v??'').replace(/[|\r\n]/g,' ').slice(0,240);
const tagFor=v=>createHash('sha256').update(String(v||'')).digest('hex').slice(0,12);
const wsSend=v=>{if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(v))};
function sendHeartbeat(force=false){if(!lastAccount||ws?.readyState!==WebSocket.OPEN)return;const now=Date.now();if(!force&&now-lastHeartbeatAt<HB_INTERVAL)return;lastHeartbeatAt=now;wsSend({type:'heartbeat',account:lastAccount})}
function receipt(commandId,status,ticket='',retcode='',detail=''){wsSend({type:'receipt',command_id:commandId,status,broker_ticket:ticket||null,broker_retcode:retcode===''?null:Number(retcode),detail:clean(detail)})}
function encodeCommand(c){
 const order=c.order||{},tps=Array.isArray(order.take_profits)?order.take_profits:[],tp1=tps[0]??0,tp2=tps[1]??0,tp3=tps[2]??tps[tps.length-1]??0,expiry=Date.parse(c.expires_at)||0;
 return ['CMD',clean(c.command_id),clean(c.execution_mode),clean(c.action),clean(c.management_event||'ENTRY'),clean(c.side||''),clean(c.symbol||''),tagFor(c.correlation_id||c.command_id),
  clean(order.volume?.mode||'FIXED_LOTS'),Number(order.volume?.value||0),Number(order.reference_price||0),Number(order.stop_loss||0),Number(tp1),Number(tp2),Number(tp3),expiry].join('|')+'\n';
}
function deliver(c){const line=encodeCommand(c);if(mt5&&!mt5.destroyed&&mt5.writable){mt5.write(line);log('command -> MT5',c.command_id,c.action,c.management_event||'',c.symbol||'');return true}if(queue.length>=MAX_QUEUE)queue.shift();queue.push(c);log('queued command; MT5 not connected',c.command_id);return false}
function flush(){if(!mt5||mt5.destroyed)return;const q=queue;queue=[];for(const c of q)deliver(c)}
function parseMt5Line(line){const p=line.trim().split('|');if(!p[0])return;if(p[0]==='HELLO'||p[0]==='HB'){lastAccount={login:clean(p[1]),server:clean(p[2]),mode:clean(p[3]),balance:Number(p[4]||0),equity:Number(p[5]||0),positions:Number(p[6]||0)};sendHeartbeat(p[0]==='HELLO');return}if(p[0]==='RCPT'&&p.length>=4){receipt(clean(p[1]),clean(p[2]),clean(p[3]),clean(p[4]),p.slice(5).join('|'));if(['FILLED','BROKER_REJECTED','REJECTED','ERROR','ACCOUNT_MISMATCH','EXPIRED'].includes(p[2]))sendHeartbeat(true)}}
const server=net.createServer(socket=>{if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(socket.remoteAddress)){socket.destroy();return}if(mt5&&!mt5.destroyed)mt5.destroy();mt5=socket;mt5.setNoDelay(true);mt5.setKeepAlive(true,30000);log('MT5 connected on localhost');socket.on('data',buf=>{mt5Buffer+=buf.toString('utf8');for(;;){const i=mt5Buffer.indexOf('\n');if(i<0)break;const line=mt5Buffer.slice(0,i);mt5Buffer=mt5Buffer.slice(i+1);parseMt5Line(line)}});socket.on('close',()=>{if(mt5===socket){mt5=null;lastAccount=null}log('MT5 disconnected')});socket.on('error',e=>log('MT5 socket error',e.message));flush()});
server.listen(port,host,()=>log('local MT5 bridge',host+':'+port));
function connectCloud(){if(reconnectTimer){clearTimeout(reconnectTimer);reconnectTimer=null}log('connecting',cloudUrl);ws=new WebSocket(cloudUrl,'sb-token.'+token);ws.addEventListener('open',()=>{reconnectMs=250;log('Cloudflare WebSocket connected');sendHeartbeat(true)});ws.addEventListener('message',ev=>{let m;try{m=JSON.parse(typeof ev.data==='string'?ev.data:String(ev.data))}catch{return}if(m.type==='hello'){log('AgentHub hello',m.agent_id);sendHeartbeat(true);return}if(m.type==='command'){if(m.action==='OPEN'&&Date.parse(m.expires_at)&&Date.parse(m.expires_at)<=Date.now()){receipt(m.command_id,'EXPIRED','','','expired before local delivery');return}deliver(m);return}if(m.type==='error')log('AgentHub error',m.code)});ws.addEventListener('close',ev=>{log('Cloudflare WebSocket closed',ev.code,ev.reason||'');scheduleReconnect()});ws.addEventListener('error',()=>log('Cloudflare WebSocket error'))}
function scheduleReconnect(){if(reconnectTimer)return;const wait=reconnectMs;reconnectMs=Math.min(5000,Math.round(reconnectMs*1.8));reconnectTimer=setTimeout(()=>{reconnectTimer=null;connectCloud()},wait)}
connectCloud();setInterval(()=>sendHeartbeat(false),60_000).unref();
process.on('SIGINT',()=>{try{ws?.close()}catch{};try{mt5?.destroy()}catch{};server.close(()=>process.exit(0))});
