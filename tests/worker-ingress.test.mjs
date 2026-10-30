import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {handleRequest,sha256} from '../worker/src/index.mjs';
import {validateTradingView, ValidationError,stableStringify} from '../worker/src/validate.mjs';

const token=randomBytes(32).toString('base64url');
const endpoint=`https://signalbridge.example/v1/ingress/tradingview/${token}`;
const iso=(ms)=>new Date(ms).toISOString();
function fixture(overrides={}){const now=Date.now();return {
 schema_version:'1.0',source_type:'tradingview',external_signal_id:'alert-001',action:'OPEN',side:'BUY',symbol:'XAUUSD',
 order:{type:'MARKET',volume:{mode:'FIXED_LOTS',value:0.01},stop_loss:2500,take_profits:[2520,2540]},
 occurred_at:iso(now-1000),expires_at:iso(now+59000),...overrides};}

class MemoryDB {
 constructor(hash){this.connections=new Map([[hash,{id:'conn-1',tenant_id:'tenant-1'}]]);this.signals=new Map();this.broken=false;this.writes=0;this.tvMt5=1;}
 prepare(sql){let args=[];const that=this;return {
  bind(...a){args=a;return this;},
  async first(){if(that.broken)throw Error('DB unavailable');
   if(sql.includes('SELECT tv_to_mt5 FROM member_signal_settings'))return {tv_to_mt5:that.tvMt5};
   if(sql.includes('FROM ingress_connections'))return that.connections.get(args[0])||null;
   if(sql.includes('FROM received_signals'))return that.signals.get(`${args[0]}/${args[1]}`)||null;
   throw Error('Unexpected query: '+sql);},
  async run(){if(that.broken)throw Error('DB unavailable');
   if(!sql.includes('INSERT INTO received_signals'))throw Error('Unexpected write');
   const [id,tenant,connection,external,hash,payload,received,expires]=args;
   const key=`${connection}/${external}`;
   if(that.signals.has(key))return {success:true,meta:{changes:0}};
   that.signals.set(key,{id,tenant_id:tenant,payload_sha256:hash,normalized_json:payload,received_at:received,expires_at:expires});that.writes++;
   return {success:true,meta:{changes:1}};
  }
 };}
}
async function setup(){return new MemoryDB(await sha256(token));}
function req(body=fixture(),{path=endpoint,contentType='application/json'}={}){return new Request(path,{method:'POST',headers:{'content-type':contentType},body:typeof body==='string'?body:JSON.stringify(body)});}
async function read(response){return await response.json();}

test('health exposes no broker execution and does not require DB',async()=>{const r=await handleRequest(new Request('https://signalbridge.example/health'),{});assert.equal(r.status,200);assert.equal((await read(r)).execution_enabled,false);});
test('ingress accepts valid signal and writes exactly one durable row',async()=>{const db=await setup();const r=await handleRequest(req(),{DB:db});assert.equal(r.status,202);const body=await read(r);assert.equal(body.accepted,true);assert.equal(body.execution_enabled,false);assert.equal(db.writes,1);assert.equal(db.signals.size,1);});
test('duplicate same signal id and payload returns same ID without extra write',async()=>{const db=await setup();const payload=fixture();const a=await read(await handleRequest(req(payload),{DB:db}));const r=await handleRequest(req(payload),{DB:db});const b=await read(r);assert.equal(r.status,200);assert.equal(b.duplicate,true);assert.equal(b.signal_id,a.signal_id);assert.equal(db.writes,1);});
test('duplicate with changed content becomes 409 without write',async()=>{const db=await setup();const payload=fixture();await handleRequest(req(payload),{DB:db});const r=await handleRequest(req({...payload,side:'SELL'}),{DB:db});assert.equal(r.status,409);assert.equal((await read(r)).error.code,'SIGNAL_ID_CONFLICT');assert.equal(db.writes,1);});
test('equivalent JSON whitespace and object key ordering deduplicates',async()=>{const db=await setup();const payload=fixture();await handleRequest(req(JSON.stringify(payload)),{DB:db});const rearranged=Object.fromEntries(Object.entries(payload).reverse());const r=await handleRequest(req(JSON.stringify(rearranged,null,2)),{DB:db});assert.equal(r.status,200);assert.equal(db.writes,1);});
test('different signal IDs each persist independently',async()=>{const db=await setup();const p=fixture();await handleRequest(req(p),{DB:db});await handleRequest(req({...p,external_signal_id:'alert-002'}),{DB:db});assert.equal(db.writes,2);});
test('unknown/revoked token cannot insert and is 401',async()=>{const db=await setup();const r=await handleRequest(req(fixture(),{path:`https://signalbridge.example/v1/ingress/tradingview/${randomBytes(32).toString('base64url')}`}),{DB:db});assert.equal(r.status,401);assert.equal(db.writes,0);});
test('non-json content type rejected',async()=>{const db=await setup();const r=await handleRequest(req(fixture(),{contentType:'text/plain'}),{DB:db});assert.equal(r.status,415);assert.equal(db.writes,0);});
test('query parameter is rejected to avoid URL credential confusion',async()=>{const db=await setup();const r=await handleRequest(req(fixture(),{path:endpoint+'?foo=bar'}),{DB:db});assert.equal(r.status,400);assert.equal(db.writes,0);});
test('request > 16KiB rejected even with omitted content-length',async()=>{const db=await setup();const payload=JSON.stringify({...fixture(),extra:'a'.repeat(20000)});const r=await handleRequest(req(payload),{DB:db});assert.equal(r.status,413);assert.equal(db.writes,0);});
test('malformed JSON returns 400',async()=>{const db=await setup();const r=await handleRequest(req('{not json'),{DB:db});assert.equal(r.status,400);assert.equal(db.writes,0);});
test('stale alert never stored',async()=>{const db=await setup();const p=fixture({occurred_at:iso(Date.now()-400_000),expires_at:iso(Date.now()-300_000)});const r=await handleRequest(req(p),{DB:db});assert.equal(r.status,422);assert.equal(db.writes,0);});
test('future alert never stored',async()=>{const db=await setup();const p=fixture({occurred_at:iso(Date.now()+80_000),expires_at:iso(Date.now()+100_000)});const r=await handleRequest(req(p),{DB:db});assert.equal(r.status,422);assert.equal(db.writes,0);});
test('unsupported close command is rejected while no MT5 exists',async()=>{const db=await setup();const r=await handleRequest(req(fixture({action:'CLOSE'})),{DB:db});assert.equal(r.status,422);assert.equal(db.writes,0);});
test('broker-side uncertainty: accepting signals never creates execution commands',async()=>{const db=await setup();const response=await read(await handleRequest(req(),{DB:db}));assert.equal(response.status,'RECEIVED');assert.equal(response.execution_enabled,false);assert.equal('broker_order_id' in response,false);});
test('DB outage refuses acceptance 503 and does not claim success',async()=>{const db=await setup();db.broken=true;const response=await handleRequest(req(),{DB:db});assert.equal(response.status,503);assert.equal((await read(response)).error.retryable,true);});
test('missing DB refuses acceptance 503',async()=>{const response=await handleRequest(req(),{});assert.equal(response.status,503);});
test('invalid source, symbol or order values fail closed',()=>{for(const change of [
 {source_type:'telegram'},{symbol:'../../etc/passwd'},{side:'HOLD'},{order:{type:'MARKET',volume:{mode:'FIXED_LOTS',value:-0.01},stop_loss:1,take_profits:[2]}},{order:{type:'MARKET',volume:{mode:'FIXED_LOTS',value:1},stop_loss:1,take_profits:[2,2]}},{order:{type:'LIMIT',volume:{mode:'FIXED_LOTS',value:1},stop_loss:1,take_profits:[2]}},
 ])assert.throws(()=>validateTradingView(fixture(change)),ValidationError);});
test('nested unexpected properties reject',()=>assert.throws(()=>validateTradingView(fixture({order:{...fixture().order,broker_password:'hidden'}})),ValidationError));
test('object serialization is canonical',()=>assert.equal(stableStringify({b:1,a:{z:2,y:3}}),'{"a":{"y":3,"z":2},"b":1}'));
test('method and path restrictions',async()=>{const db=await setup();assert.equal((await handleRequest(new Request(endpoint),{DB:db})).status,405);assert.equal((await handleRequest(new Request('https://signalbridge.example/private'),{DB:db})).status,404);});
test('retry after D1 failure did not persist any signal',async()=>{const db=await setup();db.broken=true;assert.equal((await handleRequest(req(),{DB:db})).status,503);db.broken=false;assert.equal((await handleRequest(req(),{DB:db})).status,202);assert.equal(db.writes,1);});

test('TV→MT5 OFF stores alert but does not dispatch to EA and leaves TV→Telegram relay independent',async()=>{
 const db=await setup();db.tvMt5=0;
 const r=await handleRequest(req(),{DB:db});
 assert.equal(r.status,202);
 const body=await read(r);
 assert.equal(body.accepted,true);
 assert.equal(body.execution_enabled,false);
 assert.equal(body.dispatch_status,'ROUTE_DISABLED');
 assert.equal(body.command_id,null);
 assert.equal(db.writes,1);
});
