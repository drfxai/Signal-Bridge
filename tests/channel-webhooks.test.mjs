import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import handler from '../site/src/worker.mjs';
import {formatChannelSignal,addLinks} from '../site/src/channel-webhooks.mjs';
import {MINI_HTML,MINI_JS} from '../site/src/telegram-mini.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
const CHAT='-1001234567890';

function fixture(){
 const db=new DatabaseSync(':memory:');
 for(const dir of ['worker/migrations','site/migrations'])for(const name of readdirSync(dir).sort())db.exec(readFileSync(dir+'/'+name,'utf8'));
 const exec=(sql,...args)=>db.prepare(sql).run(...args);
 const token='c'.repeat(43);
 exec("INSERT INTO site_users (id,email,telegram_id) VALUES ('usr_c','c@example.test','777')");
 exec("INSERT INTO site_sessions (token_hash,user_id,expires_at) VALUES (?,?,'2099-01-01')",digest(token),'usr_c');
 function prepared(sql,args=[]){return {bind(...values){return prepared(sql,values)},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=exec(sql,...args);return {success:true,meta:{changes:Number(r.changes)}}}}}
 const env={DB:{prepare:sql=>prepared(sql),async batch(stmts){const out=[];for(const s of stmts)out.push(await s.run());return out}},
  LICENSE_VAULT_KEY:Buffer.alloc(32,7).toString('base64'),TELEGRAM_BOT_TOKEN:'123456:'+'a'.repeat(35),TELEGRAM_WEBHOOK_SECRET:'hook-secret-123456',TELEGRAM_BOT_USERNAME:'DrFXSignalBot'};
 const request=(path,body)=>handler.fetch(new Request('https://drfx.company'+path,{method:body===undefined?'GET':'POST',headers:{cookie:'__Host-drfx_session='+token,origin:'https://drfx.company','content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}),env);
 const bot=update=>handler.fetch(new Request('https://drfx.company/api/telegram/webhook',{method:'POST',headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':'hook-secret-123456'},body:JSON.stringify(update)}),env);
 const tv=(url,body,type='application/json')=>handler.fetch(new Request(url,{method:'POST',headers:{'content-type':type},body}),env);
 return {db,env,request,bot,tv};
}
function telegramMock(state={admin:true}){
 const calls=[],real=globalThis.fetch;
 globalThis.fetch=async(url,init)=>{
  const u=String(url);
  if(!u.includes('api.telegram.org'))return real(url,init);
  const method=u.split('/').pop(),body=JSON.parse(init.body||'{}');calls.push({method,body});
  if(method==='getChatMember')return Response.json({ok:true,result:{status:state.admin?'administrator':'member'}});
  if(method==='sendMessage'&&state.blocked)return Response.json({ok:false,error_code:403,description:'Forbidden: bot is not a member of the channel chat'});
  return Response.json({ok:true,result:{message_id:1}});
 };
 return {calls,restore:()=>{globalThis.fetch=real}};
}
const added=(status='administrator',extra={})=>({update_id:1,my_chat_member:{chat:{id:Number(CHAT),title:'Gold <Signals>',type:'channel',username:'goldsignals'},from:{id:777,is_bot:false,first_name:'Ana'},date:1,old_chat_member:{status:'left',user:{id:1,is_bot:true}},new_chat_member:{status,user:{id:1,is_bot:true},can_post_messages:true,...extra}}});

test('alerts are formatted with emojis and HTML-escaped',()=>{
 const json=formatChannelSignal(JSON.stringify({symbol:'xauusd',side:'buy',entry:'2350.5',sl:'2340',tp1:'2360',tp2:'2370',strategy:'<b>x</b>'}));
 assert.match(json,/^🟢 <b>BUY XAUUSD<\/b>/);
 assert.match(json,/💵 Entry: <b>2350.5<\/b>/);assert.match(json,/🛑 Stop loss: <b>2340<\/b>/);assert.match(json,/🎯 TP2: <b>2370<\/b>/);
 assert.match(json,/🧠 Strategy: <b>&lt;b&gt;x&lt;\/b&gt;<\/b>/);assert.match(json,/TradingView → Telegram/);
 assert.match(formatChannelSignal('{"ticker":"EURUSD","action":"SHORT"}'),/^🔴 <b>SELL EURUSD<\/b>/);
 assert.match(formatChannelSignal('Long BTCUSD now <script>'),/^🟢 <b>BUY signal<\/b>\n\nLong BTCUSD now &lt;script&gt;/);
 assert.match(formatChannelSignal('price crossed 1.0850'),/^🔔 <b>TradingView alert<\/b>/);
 assert.match(formatChannelSignal('{"foo":"bar"}'),/• foo: <b>bar<\/b>/);
 assert.deepEqual(addLinks('DrFXSignalBot'),{channel:'https://t.me/DrFXSignalBot?startchannel=true&admin=post_messages',group:'https://t.me/DrFXSignalBot?startgroup=true&admin=post_messages'});
});

test('bot added as admin -> chat listed -> unique webhook posts TradingView alerts to the channel, never to MT5',async()=>{
 const f=fixture(),tg=telegramMock();
 try{
  assert.equal((await f.bot(added())).status,200);
  const dm=tg.calls.find(c=>c.method==='sendMessage');
  assert.equal(dm.body.chat_id,'777');assert.match(dm.body.text,/Gold &lt;Signals&gt;/);
  assert.equal(dm.body.reply_markup.inline_keyboard[0][0].callback_data,'cwh:'+CHAT);
  let list=await (await f.request('/api/channels')).json();
  assert.equal(list.bot_username,'DrFXSignalBot');assert.match(list.add_links.channel,/startchannel=true&admin=post_messages/);
  assert.equal(list.chats.length,1);assert.equal(list.chats[0].title,'Gold <Signals>');assert.equal(list.chats[0].can_post,true);assert.equal(list.chats[0].webhook,null);
  const created=await (await f.request('/api/channels/webhook',{chat_id:CHAT})).json();
  assert.equal(created.created,true);assert.match(created.url,/^https:\/\/drfx\.company\/tv\/ch\/[A-Za-z0-9_-]{43}$/);
  assert.ok(tg.calls.some(c=>c.method==='getChatMember'&&c.body.user_id===777));
  // same link is returned again and visible in the list; the token itself is never stored in clear text
  assert.equal((await (await f.request('/api/channels/webhook',{chat_id:CHAT})).json()).url,created.url);
  list=await (await f.request('/api/channels')).json();assert.equal(list.chats[0].webhook.url,created.url);
  const tokenPart=created.url.split('/').pop();
  assert.ok(!JSON.stringify(f.db.prepare('SELECT * FROM tg_channel_webhooks').all()).includes(tokenPart));
  const before=tg.calls.length,commands=f.db.prepare('SELECT COUNT(*) n FROM commands').get().n;
  const r=await f.tv(created.url,JSON.stringify({symbol:'XAUUSD',side:'sell',entry:'2351',sl:'2360',tp1:'2340'}));
  assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,delivered:true,route:'tradingview_to_telegram',mt5:false});
  const post=tg.calls.slice(before).find(c=>c.method==='sendMessage');
  assert.equal(post.body.chat_id,CHAT);assert.equal(post.body.parse_mode,'HTML');assert.match(post.body.text,/^🔴 <b>SELL XAUUSD<\/b>/);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM commands').get().n,commands);
  assert.equal(f.db.prepare('SELECT sent_count FROM tg_channel_webhooks').get().sent_count,1);
  // plain-text TradingView alerts work as well
  assert.equal((await f.tv(created.url,'BUY XAUUSD {{close}}','text/plain')).status,200);
  // test button posts a sample
  assert.equal((await f.request('/api/channels/test',{chat_id:CHAT})).status,200);
  assert.match(tg.calls.at(-1).body.text,/Test message/);
  // rotation kills the old link
  const rotated=await (await f.request('/api/channels/rotate',{chat_id:CHAT})).json();
  assert.notEqual(rotated.url,created.url);
  assert.equal((await f.tv(created.url,'{"symbol":"X"}')).status,404);
  assert.equal((await f.tv(rotated.url,'{"symbol":"X","side":"buy"}')).status,200);
  // bot removed from the channel -> link stops, chat disappears from the list
  await f.bot(added('left'));
  assert.equal((await f.tv(rotated.url,'{"symbol":"X"}')).status,404);
  assert.equal((await (await f.request('/api/channels')).json()).chats.length,0);
  // delete
  await f.bot(added());
  assert.equal((await f.request('/api/channels/delete',{chat_id:CHAT})).status,200);
  assert.equal(f.db.prepare('SELECT COUNT(*) n FROM tg_channel_webhooks').get().n,0);
 }finally{tg.restore()}
});

test('only chat admins get a webhook; the bot needs the post permission; bad tokens are rejected',async()=>{
 const f=fixture(),state={admin:false},tg=telegramMock(state);
 try{
  await f.bot(added());
  const denied=await f.request('/api/channels/webhook',{chat_id:CHAT});
  assert.equal(denied.status,403);assert.equal((await denied.json()).error,'ADMIN_RIGHTS_REQUIRED');
  state.admin=true;
  await f.bot(added('administrator',{can_post_messages:false}));
  assert.match(tg.calls.filter(c=>c.method==='sendMessage').at(-1).body.text,/Post messages/);
  assert.equal((await (await f.request('/api/channels/webhook',{chat_id:CHAT})).json()).error,'BOT_CANNOT_POST');
  assert.equal((await f.request('/api/channels/webhook',{chat_id:'abc'})).status,400);
  assert.equal((await f.tv('https://drfx.company/tv/ch/short','{}')).status,404);
  assert.equal((await f.tv('https://drfx.company/tv/ch/'+'z'.repeat(43),'{}')).status,404);
  // Telegram refusing the post is reported and marks the chat
  await f.bot(added());
  const {url}=await (await f.request('/api/channels/webhook',{chat_id:CHAT})).json();
  state.blocked=true;
  assert.equal((await f.tv(url,'{"symbol":"X"}')).status,502);
  assert.equal(f.db.prepare('SELECT can_post FROM tg_bot_chats').get().can_post,0);
 }finally{tg.restore()}
});

test('/channels lists chats as buttons and the cwh: button sends the webhook in a DM',async()=>{
 const f=fixture(),tg=telegramMock();
 try{
  await f.bot({update_id:2,message:{message_id:5,chat:{id:777,type:'private'},from:{id:777,first_name:'Ana'},text:'/channels'}});
  const empty=tg.calls.filter(c=>c.method==='sendMessage').at(-1).body;
  assert.match(empty.text,/Add this bot as an <b>admin<\/b>/);
  assert.ok(JSON.stringify(empty.reply_markup).includes('startchannel=true'));
  await f.bot(added());
  await f.bot({update_id:3,message:{message_id:6,chat:{id:777,type:'private'},from:{id:777,first_name:'Ana'},text:'/channels'}});
  const listMsg=tg.calls.filter(c=>c.method==='sendMessage').at(-1).body;
  assert.equal(listMsg.reply_markup.inline_keyboard[0][0].callback_data,'cwh:'+CHAT);
  await f.bot({update_id:4,callback_query:{id:'cb1',from:{id:777,first_name:'Ana'},data:'cwh:'+CHAT,message:{message_id:7,chat:{id:777,type:'private'}}}});
  assert.ok(tg.calls.some(c=>c.method==='answerCallbackQuery'));
  const hook=tg.calls.filter(c=>c.method==='sendMessage').at(-1).body;
  assert.match(hook.text,/TradingView webhook for “Gold &lt;Signals&gt;”/);
  assert.match(hook.text,/<code>https:\/\/drfx\.company\/tv\/ch\/[A-Za-z0-9_-]{43}<\/code>/);
  assert.equal(hook.reply_markup.inline_keyboard[0][0].web_app.url,'https://drfx.company/telegram?tab=channels');
 }finally{tg.restore()}
});

test('Mini App ships the Channels flow, nav entry and home card',()=>{
 for(const id of ['panel-channels','chmAddChannel','chmAddGroup','chmChats','chmHook','chmStep1','chmStep2','chmStep3'])assert.ok(MINI_HTML.includes('id="'+id+'"'),id);
 assert.ok(MINI_HTML.includes('data-tab="channels"'));assert.ok(MINI_HTML.includes('class="chm-promo" data-jump="channels"'));
 assert.ok(MINI_JS.includes("'/api/channels'"));assert.ok(MINI_JS.includes('window.chMiniLoad'));
 assert.ok(MINI_JS.includes("['home','license','plans','scalper','channels','help','admin']"));
 const ops=readFileSync(new URL('../scripts/configure-company-telegram-bot.mjs',import.meta.url),'utf8');
 assert.ok(ops.includes("command:'channels'"));
});

test('EA labels positions and the panel with the signal source',()=>{
 const ea=readFileSync(new URL('../mt5/DrFX_SignalBridge_EA.mq5',import.meta.url),'utf8');
 assert.match(ea,/string OrderNote\(string tag\)\{return StringSubstr\("SB:"\+tag\+":"\+SourceName\(g_lastSource\),0,31\);\}/);
 assert.match(ea,/trade\.Buy\(lots,sym,0\.0,sl,finalTp,note\)/);
 assert.match(ea,/if\(k==1\)return "TradingView";if\(k==2\)return "Telegram"/);
 assert.match(ea,/NoteSource\(PositionGetString\(POSITION_COMMENT\)\)/);
 assert.match(ea,/TERMINAL_SCREEN_DPI/);
 // the longest comment fits MT5's 31-character limit
 assert.ok(('SB:'+'x'.repeat(12)+':TradingView').length<=31);
});
