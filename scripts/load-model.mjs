// Offline-only SignalBridge Cloudflare Free capacity model.
// This model performs no network I/O, DNS, sockets, or external service calls.
export const FREE_LIMITS=Object.freeze({
 workerRequestsPerDay:100_000,
 d1RowsReadPerDay:5_000_000,
 d1RowsWrittenPerDay:100_000,
 durableObjectRequestsPerDay:100_000,
 durableObjectDurationGbSecondsPerDay:13_000
});

function n(v,fallback){const x=Number(v);return Number.isFinite(x)&&x>=0?x:fallback}
export function modelCapacity(opts={}){
 const agents=n(opts.agents,500);
 const signalsPerAgent=n(opts.signalsPerAgent,20);
 const reconnectsPerAgent=n(opts.reconnectsPerAgent,1);
 const heartbeatMinutes=Math.max(1,n(opts.heartbeatMinutes,15));
 const receiptsPerSignal=n(opts.receiptsPerSignal,2);
 const d1WritesPerSignal=n(opts.d1WritesPerSignal,5);
 const d1ReadsPerSignal=n(opts.d1ReadsPerSignal,4);
 const dashboardSessions=n(opts.dashboardSessions,0);
 const dashboardReadsPerSession=n(opts.dashboardReadsPerSession,2);
 const handlerMs=n(opts.handlerMs,5);

 const signals=agents*signalsPerAgent;
 const agentWsConnections=agents*(1+reconnectsPerAgent);
 const heartbeats=agents*Math.ceil(1440/heartbeatMinutes);
 const terminalStateMessages=agents*2;
 const receiptMessages=signals*receiptsPerSignal;
 const incomingWsMessages=heartbeats+terminalStateMessages+receiptMessages;
 const doMessageBillingUnits=incomingWsMessages/20;
 const doFetchRequests=signals;
 const doRequests=agentWsConnections+dashboardSessions+doFetchRequests+doMessageBillingUnits;
 const workerRequests=signals+agentWsConnections+dashboardSessions+dashboardReadsPerSession*dashboardSessions;
 const d1Writes=signals*d1WritesPerSignal;
 const d1Reads=signals*d1ReadsPerSignal+dashboardSessions*30;
 const activeOperations=doFetchRequests+incomingWsMessages+agentWsConnections+dashboardSessions;
 const durationGbSeconds=(activeOperations*handlerMs/1000)*0.125;

 const usage={
  workerRequests:{value:workerRequests,limit:FREE_LIMITS.workerRequestsPerDay},
  d1RowsWritten:{value:d1Writes,limit:FREE_LIMITS.d1RowsWrittenPerDay},
  d1RowsRead:{value:d1Reads,limit:FREE_LIMITS.d1RowsReadPerDay},
  durableObjectRequests:{value:doRequests,limit:FREE_LIMITS.durableObjectRequestsPerDay},
  durableObjectDurationGbSeconds:{value:durationGbSeconds,limit:FREE_LIMITS.durableObjectDurationGbSecondsPerDay}
 };
 const status={};
 for(const [key,item] of Object.entries(usage)){
  const ratio=item.value/item.limit;
  status[key]=ratio>=1?'EXCEEDS_FREE':ratio>=0.7?'MIGRATE_SOON':ratio>=0.5?'WATCH':'OK';
  item.percent=ratio*100;
 }
 return {inputs:{agents,signalsPerAgent,reconnectsPerAgent,heartbeatMinutes,receiptsPerSignal,d1WritesPerSignal,d1ReadsPerSignal,dashboardSessions,dashboardReadsPerSession,handlerMs},
  derived:{signals,agentWsConnections,heartbeats,terminalStateMessages,receiptMessages,incomingWsMessages,doMessageBillingUnits},
  usage,status,
  notes:[
   'Planning model only; validate against Cloudflare analytics before increasing beta size.',
   'Incoming Durable Object WebSocket messages use the current 20:1 compute-request billing ratio; metrics still show raw messages.',
   'Outgoing WebSocket messages are not included as billed Durable Object requests.',
   'Duration estimate assumes Hibernation API and handlerMs of active JavaScript per operation.',
   'D1 read/write amplification must be replaced with measured production values when available.'
  ]};
}
function parseArgs(argv){
 const out={};for(let i=0;i<argv.length;i++){const a=argv[i];if(!a.startsWith('--'))continue;const key=a.slice(2).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());const val=argv[i+1];if(val&&!val.startsWith('--')){out[key]=Number(val);i++;}}
 return out;
}
function fmt(x){return Number(x).toLocaleString(undefined,{maximumFractionDigits:2})}
function print(result){
 console.log('SignalBridge Cloudflare Free capacity model (offline)');
 console.log('Agents:',result.inputs.agents,'Signals/agent/day:',result.inputs.signalsPerAgent,'Signals/day:',fmt(result.derived.signals));
 console.log('');
 console.log('Resource'.padEnd(34),'Usage'.padStart(14),'Limit'.padStart(14),'%'.padStart(9),'Status'.padStart(14));
 for(const [key,item] of Object.entries(result.usage))console.log(key.padEnd(34),fmt(item.value).padStart(14),fmt(item.limit).padStart(14),fmt(item.percent).padStart(8)+'%',result.status[key].padStart(14));
 console.log('');
 for(const note of result.notes)console.log('-',note);
}
if(import.meta.url===`file://${process.argv[1]}`)print(modelCapacity(parseArgs(process.argv.slice(2))));
