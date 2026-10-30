// TradingView -> Telegram channel webhooks.
// A member adds the bot as an admin to a channel or group, picks it in the bot or Mini App,
// and gets a unique webhook URL. Alerts sent to that URL are formatted and posted straight to
// the chat. This path never creates MT5 commands.
const TG='https://api.telegram.org/bot';
const CHAT_ID=/^-?\d{1,20}$/;
const TOKEN=/^[A-Za-z0-9_-]{43}$/;
const CHAT_TYPES=['channel','group','supergroup'];
const ACTIVE_BOT=['administrator','creator','member'];
export const CHANNEL_HOOK_PATH='/tv/ch/';
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=(v,max=128)=>String(v??'').replace(/[\x00-\x1f]/g,' ').trim().slice(0,max);
const FOOTER='\n\n📈 <i>TradingView → Telegram · DrFX Signal Bridge</i>';

async function tg(env,method,body){
 try{
  const r=await fetch(TG+env.TELEGRAM_BOT_TOKEN+'/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});
  return await r.json();
 }catch{return {ok:false,error_code:0,description:'NETWORK'}}
}
let cachedBot='';
export async function botUsername(env){
 if(/^[A-Za-z0-9_]{5,32}$/.test(env.TELEGRAM_BOT_USERNAME||''))return env.TELEGRAM_BOT_USERNAME;
 if(cachedBot||!env.TELEGRAM_BOT_TOKEN)return cachedBot;
 const me=await tg(env,'getMe',{});if(me.ok&&me.result?.username)cachedBot=me.result.username;
 return cachedBot;
}
export const addLinks=name=>name?{channel:'https://t.me/'+name+'?startchannel=true&admin=post_messages',group:'https://t.me/'+name+'?startgroup=true&admin=post_messages'}:null;
export const ALERT_TEMPLATE='{"symbol":"{{ticker}}","side":"buy","entry":"{{close}}","sl":"","tp1":"","tp2":"","timeframe":"{{interval}}","strategy":"My strategy"}';
export const STRATEGY_TEMPLATE='{"symbol":"{{ticker}}","side":"{{strategy.order.action}}","entry":"{{strategy.order.price}}","lot":"{{strategy.order.contracts}}","strategy":"{{strategy.order.comment}}"}';

// Turn a TradingView alert body (JSON or plain text) into a safe, readable Telegram HTML message.
export function formatChannelSignal(raw){
 const text=String(raw??'').trim();
 let b=null;
 if(text.startsWith('{')){try{const v=JSON.parse(text);if(v&&typeof v==='object'&&!Array.isArray(v))b=v}catch{}}
 if(!b){
  const side=/\b(buy|long)\b/i.test(text)?'BUY':/\b(sell|short)\b/i.test(text)?'SELL':'';
  const head=side?(side==='BUY'?'🟢':'🔴')+' <b>'+side+' signal</b>':'🔔 <b>TradingView alert</b>';
  return head+'\n\n'+esc(text.slice(0,3500)||'(empty alert)')+FOOTER;
 }
 const pick=(...keys)=>{for(const k of keys){const v=b[k];if(v!==undefined&&v!==null&&typeof v!=='object'&&String(v).trim()!=='')return clean(v,64)}return ''};
 const symbol=pick('symbol','ticker','pair','instrument').toUpperCase();
 const rawSide=pick('side','action','direction','signal','order').toUpperCase();
 const side=/BUY|LONG/.test(rawSide)?'BUY':/SELL|SHORT/.test(rawSide)?'SELL':/CLOSE|EXIT|FLAT/.test(rawSide)?'CLOSE':rawSide;
 const icon=side==='BUY'?'🟢':side==='SELL'?'🔴':side==='CLOSE'?'⚪️':'🔔';
 const rows=[];
 const add=(emoji,label,value)=>{if(value)rows.push(emoji+' '+label+': <b>'+esc(value)+'</b>')};
 add('💵','Entry',pick('entry','price','open','entry_price'));
 add('🛑','Stop loss',pick('sl','stop','stop_loss','stoploss'));
 const tps=[pick('tp1','tp','take_profit','takeprofit'),pick('tp2'),pick('tp3')];
 tps.forEach((v,i)=>add('🎯','TP'+(i+1),v));
 add('📦','Lot',pick('lot','lots','volume','qty','quantity','contracts'));
 add('⏱','Timeframe',pick('timeframe','interval','tf'));
 add('🧠','Strategy',pick('strategy','strategy_name'));
 const note=['message','comment','text','note'].map(k=>typeof b[k]==='string'?clean(b[k],600):'').find(Boolean);
 if(!symbol&&!side&&!rows.length&&!note){
  const list=Object.entries(b).slice(0,12).map(([k,v])=>'• '+esc(clean(k,40))+': <b>'+esc(clean(typeof v==='object'?JSON.stringify(v):v,120))+'</b>');
  return '🔔 <b>TradingView alert</b>\n\n'+(list.join('\n')||'(empty alert)')+FOOTER;
 }
 const title=icon+' <b>'+esc([side||'ALERT',symbol].filter(Boolean).join(' '))+'</b>';
 return title+'\n━━━━━━━━━━━━━━'+(rows.length?'\n'+rows.join('\n'):'')+(note?'\n\n📝 '+esc(note):'')+FOOTER;
}

async function listChats(env,user){
 if(!user.telegram_id)return [];
 const rows=await env.DB.prepare("SELECT c.chat_id,c.title,c.chat_type,c.username,c.bot_status,c.can_post,w.id AS hook_id,w.status AS hook_status,w.encrypted_token,w.nonce,w.sent_count,w.last_used_at,w.last_error FROM tg_bot_chat_users cu JOIN tg_bot_chats c ON c.chat_id=cu.chat_id LEFT JOIN tg_channel_webhooks w ON w.chat_id=c.chat_id AND w.user_id=? WHERE cu.telegram_id=? AND c.bot_status IN ('administrator','creator','member') ORDER BY c.updated_at DESC LIMIT 25").bind(user.id,user.telegram_id).all();
 return rows.results||[];
}
const hookUrl=token=>'https://drfx.company'+CHANNEL_HOOK_PATH+token;
async function chatView(row,h){
 let webhook=null;
 if(row.hook_id){
  let url='';try{url=hookUrl(await h.decryptCode(row.encrypted_token,row.nonce))}catch{}
  webhook={url,status:row.hook_status,sent_count:Number(row.sent_count||0),last_used_at:row.last_used_at||null,last_error:row.last_error||null};
 }
 return {chat_id:row.chat_id,title:row.title||'Untitled',type:row.chat_type,username:row.username||null,can_post:row.can_post===1,webhook};
}

// Create (or return) the member's webhook for a chat after checking both admin rights.
export async function ensureChannelWebhook(env,user,chatId,h,rotate=false){
 if(!user.telegram_id)return {error:'LINK_TELEGRAM_FIRST',status:409};
 if(!CHAT_ID.test(String(chatId||'')))return {error:'INVALID_CHAT',status:400};
 chatId=String(chatId);
 const chat=await env.DB.prepare('SELECT * FROM tg_bot_chats WHERE chat_id=?').bind(chatId).first();
 if(!chat||!ACTIVE_BOT.includes(chat.bot_status))return {error:'BOT_NOT_IN_CHAT',status:409};
 if(chat.can_post!==1)return {error:'BOT_CANNOT_POST',status:409};
 if(!env.TELEGRAM_BOT_TOKEN)return {error:'BOT_NOT_CONFIGURED',status:503};
 const member=await tg(env,'getChatMember',{chat_id:chatId,user_id:Number(user.telegram_id)});
 if(!member.ok||!['creator','administrator'].includes(member.result?.status))return {error:'ADMIN_RIGHTS_REQUIRED',status:403};
 await env.DB.prepare('INSERT OR IGNORE INTO tg_bot_chat_users(chat_id,telegram_id) VALUES (?,?)').bind(chatId,user.telegram_id).run();
 const existing=await env.DB.prepare('SELECT * FROM tg_channel_webhooks WHERE user_id=? AND chat_id=?').bind(user.id,chatId).first();
 if(existing&&!rotate&&existing.status==='active'){
  try{return {url:hookUrl(await h.decryptCode(existing.encrypted_token,existing.nonce)),chat,created:false}}catch{/* fall through and re-issue */}
 }
 const token=h.b64u(h.rand(32)),hash=await h.sha(token),sealed=await h.encryptCode(token);
 await env.DB.prepare("INSERT INTO tg_channel_webhooks(id,user_id,chat_id,token_sha256,encrypted_token,nonce,status) VALUES (?,?,?,?,?,?,'active') ON CONFLICT(user_id,chat_id) DO UPDATE SET token_sha256=excluded.token_sha256,encrypted_token=excluded.encrypted_token,nonce=excluded.nonce,status='active',last_error=NULL")
  .bind(h.uid('cwh'),user.id,chatId,hash,sealed.cipher,sealed.iv).run();
 await h.audit(user.id,rotate?'channel_webhook_rotate':'channel_webhook_create',chatId);
 return {url:hookUrl(token),chat,created:true};
}

async function deliver(env,hook,text){
 const r=await tg(env,'sendMessage',{chat_id:hook.chat_id,text,parse_mode:'HTML',disable_web_page_preview:true});
 if(r.ok){
  await env.DB.prepare('UPDATE tg_channel_webhooks SET sent_count=sent_count+1,last_used_at=CURRENT_TIMESTAMP,last_error=NULL WHERE id=?').bind(hook.id).run();
  return true;
 }
 const reason=clean(r.description||'TELEGRAM_ERROR',160);
 await env.DB.prepare('UPDATE tg_channel_webhooks SET last_error=? WHERE id=?').bind(reason,hook.id).run();
 if(r.error_code===403)await env.DB.prepare("UPDATE tg_bot_chats SET can_post=0,updated_at=CURRENT_TIMESTAMP WHERE chat_id=?").bind(hook.chat_id).run();
 return false;
}

// Public endpoint for TradingView: POST /tv/ch/<token>
export async function channelIngest(req,env,token,h){
 if(!TOKEN.test(token))return h.fail('NOT_FOUND',404);
 const hash=await h.sha(token);
 if(!await h.limited(req,env,'tvch:'+hash,120))return h.fail('RATE_LIMITED',429);
 const length=Number(req.headers.get('content-length')||0);if(length>8192)return h.fail('BODY_TOO_LARGE',413);
 const raw=await req.text();if(raw.length>8192)return h.fail('BODY_TOO_LARGE',413);
 const hook=await env.DB.prepare("SELECT w.id,w.chat_id FROM tg_channel_webhooks w JOIN site_users u ON u.id=w.user_id JOIN tg_bot_chats c ON c.chat_id=w.chat_id WHERE w.token_sha256=? AND w.status='active' AND u.status='active' AND c.can_post=1").bind(hash).first();
 if(!hook)return h.fail('UNKNOWN_WEBHOOK',404);
 if(!env.TELEGRAM_BOT_TOKEN)return h.fail('BOT_NOT_CONFIGURED',503);
 if(!await deliver(env,hook,formatChannelSignal(raw)))return h.fail('TELEGRAM_DELIVERY_FAILED',502);
 return h.json({ok:true,delivered:true,route:'tradingview_to_telegram',mt5:false});
}

// Member API: /api/channels*
export async function channelApi(path,method,body,env,user,h){
 if(path==='/api/channels'&&method==='GET'){
  const name=await botUsername(env);
  const chats=await Promise.all((await listChats(env,user)).map(r=>chatView(r,h)));
  return h.json({ok:true,telegram_linked:!!user.telegram_id,bot_username:name||null,add_links:addLinks(name),alert_template:ALERT_TEMPLATE,strategy_template:STRATEGY_TEMPLATE,chats});
 }
 if(method!=='POST')return null;
 const chatId=String(body?.chat_id||'');
 if(path==='/api/channels/webhook'||path==='/api/channels/rotate'){
  if(!await h.limited(h.req,env,'channels:'+user.id,30))return h.fail('RATE_LIMITED',429);
  const r=await ensureChannelWebhook(env,user,chatId,h,path.endsWith('rotate'));
  if(r.error)return h.fail(r.error,r.status);
  return h.json({ok:true,url:r.url,created:r.created,chat_id:chatId});
 }
 if(path==='/api/channels/delete'){
  if(!CHAT_ID.test(chatId))return h.fail('INVALID_CHAT',400);
  await env.DB.prepare('DELETE FROM tg_channel_webhooks WHERE user_id=? AND chat_id=?').bind(user.id,chatId).run();
  await h.audit(user.id,'channel_webhook_delete',chatId);
  return h.json({ok:true});
 }
 if(path==='/api/channels/test'){
  if(!CHAT_ID.test(chatId))return h.fail('INVALID_CHAT',400);
  if(!await h.limited(h.req,env,'channels-test:'+user.id,10))return h.fail('RATE_LIMITED',429);
  const hook=await env.DB.prepare("SELECT w.id,w.chat_id FROM tg_channel_webhooks w JOIN tg_bot_chats c ON c.chat_id=w.chat_id WHERE w.user_id=? AND w.chat_id=? AND w.status='active' AND c.can_post=1").bind(user.id,chatId).first();
  if(!hook)return h.fail('CREATE_WEBHOOK_FIRST',409);
  const sample=JSON.stringify({symbol:'XAUUSD',side:'buy',entry:'2350.50',sl:'2338.00',tp1:'2362.00',tp2:'2375.00',timeframe:'15',strategy:'Test from DrFX Signal Bridge'});
  if(!await deliver(env,hook,'🧪 <i>Test message</i>\n'+formatChannelSignal(sample)))return h.fail('TELEGRAM_DELIVERY_FAILED',502);
  return h.json({ok:true,delivered:true});
 }
 return null;
}

// Bot side --------------------------------------------------------------------------------
const typeIcon=t=>t==='channel'?'📢':'👥';
function pickerKeyboard(rows,name,origin){
 const kb=rows.slice(0,20).map(r=>[{text:typeIcon(r.chat_type)+' '+clean(r.title||'Untitled',40)+(r.hook_id?'  ✅':'')+(r.can_post===1?'':'  ⚠️'),callback_data:'cwh:'+r.chat_id}]);
 const links=addLinks(name);
 if(links)kb.push([{text:'➕ Add to channel',url:links.channel},{text:'➕ Add to group',url:links.group}]);
 kb.push([{text:'📱 Open in Mini App',web_app:{url:origin+'/telegram?tab=channels'}}]);
 return {inline_keyboard:kb};
}

// my_chat_member: the bot was added to, promoted in, or removed from a chat.
export async function onBotMembership(update,env,h){
 const m=update.my_chat_member,chat=m?.chat;
 if(!chat||!CHAT_TYPES.includes(chat.type)||!CHAT_ID.test(String(chat.id)))return h.json({ok:true,ignored:'NOT_A_CHANNEL'});
 const st=m.new_chat_member||{},status=clean(st.status,24),admin=status==='administrator'||status==='creator';
 const canPost=chat.type==='channel'?admin&&st.can_post_messages!==false:(admin||status==='member');
 const id=String(chat.id);
 await env.DB.prepare('INSERT INTO tg_bot_chats(chat_id,title,chat_type,username,bot_status,can_post) VALUES (?,?,?,?,?,?) ON CONFLICT(chat_id) DO UPDATE SET title=excluded.title,chat_type=excluded.chat_type,username=excluded.username,bot_status=excluded.bot_status,can_post=excluded.can_post,updated_at=CURRENT_TIMESTAMP')
  .bind(id,clean(chat.title,128),chat.type,chat.username?clean(chat.username,64):null,status,canPost?1:0).run();
 const from=m.from&&!m.from.is_bot&&m.from.id?String(m.from.id):'';
 if(!from||!ACTIVE_BOT.includes(status))return h.json({ok:true,chat:id,status});
 await env.DB.prepare('INSERT OR IGNORE INTO tg_bot_chat_users(chat_id,telegram_id) VALUES (?,?)').bind(id,from).run();
 const title=esc(clean(chat.title,80)||'your chat');
 if(canPost){
  await h.botSend(from,'✅ <b>Signal Bridge joined “'+title+'”</b>\n\nTap the button to create a private TradingView webhook for this '+(chat.type==='channel'?'channel':'group')+'. Alerts go straight here, without MT5.',
   {inline_keyboard:[[{text:'⚡ Create TradingView webhook',callback_data:'cwh:'+id}],[{text:'📱 Open Channels in Mini App',web_app:{url:h.origin+'/telegram?tab=channels'}}]]});
 }else{
  await h.botSend(from,'⚠️ <b>Almost there</b>\n\nThe bot is in “'+title+'” but cannot post. Make it an admin with the <b>Post messages</b> permission, then send /channels.');
 }
 return h.json({ok:true,chat:id,status});
}

// /channels: list the member's chats as buttons.
export async function channelsCommand(env,user,chatId,h){
 const rows=await listChats(env,user),name=await botUsername(env);
 if(!rows.length){
  await h.botSend(chatId,'📡 <b>TradingView → Telegram channel</b>\n\n1️⃣ Add this bot as an <b>admin</b> to your channel or group (buttons below).\n2️⃣ Come back and send /channels.\n3️⃣ Pick the chat and copy its webhook into your TradingView alert.\n\nSignals go straight to the chat. MT5 is not involved.',pickerKeyboard([],name,h.origin));
  return;
 }
 await h.botSend(chatId,'📡 <b>Your channels and groups</b>\n\nPick one to get its TradingView webhook.\n✅ webhook ready   ⚠️ bot cannot post yet',pickerKeyboard(rows,name,h.origin));
}

const ERRORS={LINK_TELEGRAM_FIRST:'Link Telegram to your account first.',BOT_NOT_IN_CHAT:'The bot is no longer in that chat. Add it again as an admin.',BOT_CANNOT_POST:'Give the bot the “Post messages” admin permission, then try again.',ADMIN_RIGHTS_REQUIRED:'Only admins of that chat can create its webhook.',BOT_NOT_CONFIGURED:'The bot is not configured yet.',INVALID_CHAT:'Unknown chat.'};
export function webhookMessage(title,url){
 return '⚡ <b>TradingView webhook for “'+esc(clean(title,80))+'”</b>\n\n<b>1.</b> In TradingView open <i>Create alert → Notifications</i>, tick <b>Webhook URL</b> and paste:\n<code>'+esc(url)+'</code>\n\n<b>2.</b> Paste this into the alert <b>Message</b>:\n<code>'+esc(ALERT_TEMPLATE)+'</code>\n\n🔒 Keep the URL private. Rotate it any time in the Mini App.';
}

// cwh:<chat_id> button from /channels or the welcome DM.
export async function channelCallback(update,env,h){
 const cb=update.callback_query;
 const match=/^cwh:(-?\d{1,20})$/.exec(String(cb?.data||''));
 if(!match||!cb.from?.id||cb.message?.chat?.type!=='private')return null;
 const telegramId=String(cb.from.id),dm=String(cb.message.chat.id);
 await h.answer(cb.id);
 let user=await env.DB.prepare('SELECT * FROM site_users WHERE telegram_id=?').bind(telegramId).first();
 if(!user)user=await h.getOrCreateTelegram(telegramId,cb.from.username||cb.from.first_name||'Trader');
 if(user.status!=='active')return h.json({ok:true});
 const r=await ensureChannelWebhook(env,user,match[1],h);
 if(r.error){await h.botSend(dm,'⚠️ '+(ERRORS[r.error]||'Could not create the webhook.'));return h.json({ok:true,error:r.error});}
 await h.botSend(dm,webhookMessage(r.chat.title,r.url),{inline_keyboard:[[{text:'📱 Manage in Mini App',web_app:{url:h.origin+'/telegram?tab=channels'}}]]});
 return h.json({ok:true});
}
