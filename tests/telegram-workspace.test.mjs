import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {deflateSync} from 'node:zlib';
import worker from '../site/src/worker.mjs';
import {BOT_WORKSPACE_WIDGET_HTML,workspaceView,widgetViewData,unpackWorkspaceView,workspaceQueryPage,signalRecords,sendBotNotice} from '../site/src/telegram-workspace.mjs';
import {STAR_PLANS,starPrice,LICENSE_TERMS} from '../site/src/telegram-commerce.mjs';
const user={id:'usr_'+('a'.repeat(32)),telegram_id:'123',status:'active',role:'user',plan:'trial'};
const signal=(symbol,side='BUY')=>({action:'OPEN',symbol,side,order:{reference_price:4077,stop_loss:4065,take_profits:[4085,4090,4100]}});
function fixture(role='user'){
 const sql=[],preferences=new Map();
 const env={TELEGRAM_BOT_TOKEN:'test:token',TELEGRAM_WEBHOOK_SECRET:'workspace-test-secret',DB:{prepare(query){let args=[];sql.push({query,get args(){return args}});return {bind(...a){args=a;return this},async first(){
  if(query.includes('FROM site_users WHERE telegram_id'))return {...user,role};
  if(query.includes('FROM site_bot_preferences'))return {language_code:preferences.get(args[0])||'en'};
  if(query.includes('FROM site_licenses sl JOIN ea_licenses'))return {status:'active',expires_at:null};
  if(query.includes('COUNT(*) AS total'))return {total:12,active:10,suspended:2};return null;
 },async all(){
  if(query.includes('FROM received_signals'))return {results:[{id:'tv1',normalized_json:JSON.stringify(signal('XAUUSD')),received_at:'2026-11-11 10:00:00'}]};
  if(query.includes('FROM commands'))return {results:[{id:'tg1',normalized_json:JSON.stringify(signal('EURUSD','SELL')),received_at:'2026-11-11 10:30:00'},{id:'manage',normalized_json:JSON.stringify({action:'MANAGE'}),received_at:'2026-11-11 10:35:00'}]};
  if(query.includes('FROM telegram_star_orders'))return {results:Array.from({length:4},(_,i)=>({id:'tso_'+String(i).padStart(32,'a'),plan:'quarterly',stars:2350,status:'paid',created_at:'2026-11-11 10:00:00'}))};
  if(query.includes('FROM site_users'))return {results:[{...user,email:'test@example.test',telegram_name:'Example member'}]};return {results:[]};
 },async run(){if(query.includes('INSERT INTO site_bot_preferences'))preferences.set(args[0],args[1]);return {success:true,meta:{changes:1}}}}}}};
 return {env,sql,preferences};
}
const helpers={plans:STAR_PLANS,price:starPrice,terms:LICENSE_TERMS,licenseRecord:async()=>({status:'active',expires_at:null})};
test('workspace HTML and every populated page fit native Telegram limits',async()=>{
 assert.ok(Buffer.byteLength(BOT_WORKSPACE_WIDGET_HTML)<32768);
 assert.ok(deflateSync(Buffer.from(BOT_WORKSPACE_WIDGET_HTML),{level:9}).length<4096);
 assert.doesNotMatch(BOT_WORKSPACE_WIDGET_HTML,/<(?:input|textarea|iframe)|fetch\s*\(|innerHTML/);
 const {env}=fixture('admin');
 for(const page of ['home','account','licenses','shop','setup','help','app','link','language','resetconfirm','terms','support','history:0','signal:0','orders:0','admin','users:0','adminhelp']){
  const view=await workspaceView(env,helpers,{...user,role:'admin'},page);
  const data=widgetViewData(view);assert.ok(Buffer.byteLength(data)<=1024,page);
  assert.ok(view.buttons.length<=10,page);
  for(const b of view.buttons)assert.ok(Buffer.byteLength(b.action)<=64,page);
  assert.equal(unpackWorkspaceView(JSON.parse(data)).title,view.title);
 }
});
test('history combines only tenant-owned TradingView and Telegram opening alerts',async()=>{
 const f=fixture(),rows=await signalRecords(f.env,user);
 assert.equal(rows.length,2);assert.equal(rows[0].source,'Telegram');assert.equal(rows[0].signal.symbol,'EURUSD');
 assert.equal(rows[1].source,'TradingView');
 for(const call of f.sql){assert.match(call.query,/tenant_id=\?/);assert.equal(call.args[0],user.id);assert.match(call.query,/LIMIT 20/);}
});
test('navigation accepts only known pages and bounded paging arguments',()=>{
 for(const action of ['ui:page:home','ui:open:history:0','ui:page:lang:fa','ui:page:signal:10'])assert.ok(workspaceQueryPage(action));
 for(const action of ['ui:page:eval','ui:page:users:-1','ui:page:history:9999','ui:page:lang:xx','ui:page:home;DROP TABLE','ui:page:admin:other'])assert.equal(workspaceQueryPage(action),null);
});
test('secrets stay out of widget state and use protected captions and native copy buttons',async()=>{
 const calls=[],raw=async(e,method,body)=>{calls.push({method,body});return {message_id:1}};
 const secret='private-example-activation-code';
 await sendBotNotice({}, {raw},'123','Your code\n<code>'+secret+'</code>',{inline_keyboard:[[{text:'Copy',copy_text:{text:secret}}]]});
 assert.equal(calls[0].method,'sendWidget');assert.equal(calls[0].body.protect_content,true);
 assert.ok(calls[0].body.caption.includes(secret));assert.ok(!calls[0].body.chat_data.includes(secret));
 assert.equal(calls[0].body.reply_markup.inline_keyboard[0][0].copy_text.text,secret);
});
test('long notices are split without losing text or exceeding state limits',async()=>{
 const calls=[],raw=async(e,method,body)=>{calls.push({method,body});return {message_id:1}};
 const text='A'.repeat(1900);
 await sendBotNotice({}, {raw},'123',text);
 assert.ok(calls.length>1);
 assert.equal(calls.map(c=>unpackWorkspaceView(JSON.parse(c.body.chat_data)).pages.join('')).join(''),text);
 for(const c of calls)assert.ok(Buffer.byteLength(c.body.chat_data)<=1024);
});
test('unsupported widget delivery falls back to a protected native response',async()=>{
 const methods=[],raw=async(e,m,b)=>{methods.push(m);if(m==='sendWidget')throw Error('Unsupported');return {message_id:1}};
 await sendBotNotice({}, {raw},'123','Please retry later.');
 assert.deepEqual(methods,['sendWidget','sendMessage']);
});
function request(payload){return new Request('https://drfx.company/api/telegram/webhook',{method:'POST',headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':'workspace-test-secret'},body:JSON.stringify(payload)})}
function query(action,from=123){return {widget_query:{id:'q',from:{id:from},chat:{id:123,type:'private'},message_id:10,type:{type:'data'},data:action}}}
async function stub(fn){const original=globalThis.fetch,calls=[];globalThis.fetch=async(url,options)=>{calls.push({method:String(url).split('/').pop(),body:JSON.parse(options.body)});return Response.json({ok:true,result:{message_id:1}})};try{return await fn(calls)}finally{globalThis.fetch=original}}
test('command aliases open functioning widgets, with protected native Mini App launch',async()=>{
 const {env}=fixture();
 await stub(async calls=>{
  for(const [cmd,page] of [['/menu','home'],['/setup','setup'],['/help','help'],['/licenses','licenses'],['/buy','shop'],['/me','account'],['/orders','orders:0']]){
   const r=await worker.fetch(request({message:{text:cmd,from:{id:123},chat:{id:123,type:'private'}}}),env);
   assert.equal(r.status,200);const c=calls.at(-1);assert.equal(c.method,'sendWidget');
   assert.equal(unpackWorkspaceView(JSON.parse(c.body.chat_data)).page,page);
   assert.ok(c.body.reply_markup.inline_keyboard[0][0].web_app.url.endsWith('/telegram'));
  }
 });
});
test('a workspace click edits state on its own message without executing trades',async()=>{
 const f=fixture();await stub(async calls=>{
  const r=await worker.fetch(request(query('ui:page:history:0')),f.env);assert.equal(r.status,200);
  const edit=calls.find(c=>c.method==='editMessageWidgetData');assert.equal(edit.body.chat_id,'123');assert.equal(edit.body.message_id,10);
  const view=unpackWorkspaceView(JSON.parse(edit.body.chat_data));assert.equal(view.rows[0].value,'EURUSD SELL');
  assert.ok(calls.some(c=>c.method==='answerWidgetQuery'));
  assert.ok(!f.sql.some(c=>/INSERT INTO commands|UPDATE commands/.test(c.query)));
 });
});
test('cross-user and non-data queries cannot edit state or access account data',async()=>{
 for(const payload of [query('ui:page:account',456),{widget_query:{...query('ui:page:account').widget_query,type:{type:'sent_transaction'}}}]){
  const f=fixture();await stub(async calls=>{await worker.fetch(request(payload),f.env);assert.ok(!calls.some(c=>c.method==='editMessageWidgetData'));assert.equal(f.sql.length,0)});
 }
});
test('admin pages are denied both by the data builder and the authenticated query handler',async()=>{
 const f=fixture();await assert.rejects(workspaceView(f.env,helpers,user,'admin'),/FORBIDDEN/);
 await stub(async calls=>{await worker.fetch(request(query('ui:page:users:0')),f.env);assert.ok(!calls.some(c=>c.method==='editMessageWidgetData'));assert.ok(!f.sql.some(c=>c.query.includes('LIMIT 4 OFFSET')))});
});
test('workspace language selection preserves bot language preferences',async()=>{
 const f=fixture();await stub(async calls=>{await worker.fetch(request(query('ui:page:lang:fa')),f.env);assert.equal(f.preferences.get('123'),'fa');assert.ok(calls.some(c=>c.method==='editMessageWidgetData'))});
});
test('client buttons request pages, copy command templates and redraw on server state changes',async()=>{
 const els=new Map(),events=new Map(),calls=[],get=id=>{if(!els.has(id))els.set(id,{});return els.get(id)};
 const widget={chatData:widgetViewData(await workspaceView(fixture().env,helpers,user,'home')),ready(){calls.push('ready')},onEvent(n,f){events.set(n,f)},request(a){calls.push(a);return Promise.resolve({result:'{"message":"Updated"}'})},copyText(t){calls.push(t)}};
 const script=BOT_WORKSPACE_WIDGET_HTML.match(/<script>([\s\S]*?)<\/script>/)[1];
 vm.runInNewContext(script,{window:{TelegramWidget:widget},document:{getElementById:get}},{timeout:1000});
 get('action0').onclick();await new Promise(r=>setImmediate(r));assert.ok(calls.includes('ui:page:history:0'));
 widget.chatData=widgetViewData(await workspaceView(fixture().env,helpers,user,'support'));events.get('chatDataChanged')();
 get('action0').onclick();assert.ok(calls.includes('/paysupport ORDER_ID YOUR_MESSAGE'));
});

test('native Main Menu opens the same workspace as /menu',async()=>{
 const f=fixture();
 await stub(async calls=>{
  const callback={id:'back',data:'workspace:home',from:{id:123},message:{chat:{id:123,type:'private'}}};
  const r=await worker.fetch(request({callback_query:callback}),f.env);
  assert.equal(r.status,200);
  const widget=calls.find(c=>c.method==='sendWidget');
  assert.equal(unpackWorkspaceView(JSON.parse(widget.body.chat_data)).page,'home');
  assert.ok(calls.some(c=>c.method==='answerCallbackQuery'));
 });
});

test('channel detail keeps its controls and provides matching native and widget navigation',async()=>{
 const calls=[];
 const raw=async(e,method,body)=>calls.push({method,body});
 await sendBotNotice({}, {raw},'123','Your webhook <code>example</code>',{inline_keyboard:[[{text:'Manage in Mini App',web_app:{url:'https://drfx.company/telegram?tab=channels'}}]]},'channel-detail');
 const body=calls[0].body;
 const buttons=body.reply_markup.inline_keyboard.flat();
 assert.deepEqual(buttons.slice(1).map(b=>b.callback_data),['workspace:channels','workspace:home']);
 const view=unpackWorkspaceView(JSON.parse(body.chat_data));
 assert.equal(view.title,'Channels & Groups');
 assert.deepEqual(view.buttons.map(b=>b.action),['ui:page:channels','ui:page:home']);
});
