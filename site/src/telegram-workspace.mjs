// Native Telegram command workspace. Widget state never contains credentials.
export const WIDGET_THEME_CSS=`*{box-sizing:border-box}body{margin:0;padding:0;font:13px system-ui,sans-serif;color:#eef8ff;background:#091722}.shell{padding:14px;border:1px solid #31bdc5;border-radius:17px;background:linear-gradient(145deg,#142b37,#0a1722 70%);overflow:hidden}.brand{display:flex;align-items:center;gap:8px;font-size:17px;font-weight:850;letter-spacing:-.3px}.brand svg{width:25px;height:25px}.brand span{color:#e8c66e}.eyebrow{font-size:9px;color:#8faaba;letter-spacing:1.4px;margin-top:4px}.head{display:flex;align-items:center;justify-content:space-between;gap:8px}.pill{font-size:9px;font-weight:750;color:#e9cc7e;border:1px solid #8a764b;border-radius:14px;padding:4px 7px;white-space:nowrap}h2{font-size:22px;line-height:1.15;letter-spacing:-.5px;margin:16px 0 5px}.sub{font-size:11px;line-height:1.5;color:#a8c0ce}.rows{margin-top:12px}.row{padding:9px 10px;margin-top:5px;border:1px solid #315261;border-radius:9px;background:#152c39;display:flex;align-items:center;justify-content:space-between;gap:10px}.row small{color:#a0bac8;font-size:10px}.row b{font-size:12px;line-height:1.35;text-align:right;overflow-wrap:anywhere;font-variant-numeric:tabular-nums}.row .good{color:#70e4c8}.row .bad{color:#ffa6b2}.row .gold{color:#f0d28b}.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:13px}button{min-width:0;min-height:42px;padding:10px 7px;border:1px solid #386073;border-radius:10px;color:#e6f3fa;background:linear-gradient(135deg,#1d3848,#142733);font:750 11px system-ui;text-align:center;cursor:pointer}button.primary{color:#15242c;border-color:#efcf81;background:linear-gradient(120deg,#e3ba5d,#f6dda1)}button.accent{border-color:#34babd;color:#90f2e4}button:disabled{opacity:.55}button[hidden],[hidden]{display:none}.foot{font-size:9px;color:#8faaba;line-height:1.5;margin-top:11px;border-top:1px solid #25404f;padding-top:9px}.body{font-size:12px;line-height:1.5;white-space:pre-wrap;overflow-wrap:anywhere;margin-top:12px;color:#d6e4ee}.pager{display:flex;gap:7px;margin-top:9px}.pager button{flex:1;min-height:32px;padding:7px}.pager span{font-size:10px;color:#a8c0ce;align-self:center}.side{font-size:16px;font-weight:850;color:#70e4c8}.side.sell{color:#ff9aaa}@media(max-width:360px){.shell{padding:12px}h2{font-size:20px;margin-top:12px}.sub{font-size:10px}.row{padding:6px 8px;gap:7px}.row small{width:46%;flex:none}.row b{font-size:11px;flex:1;min-width:0}.actions{gap:6px;margin-top:10px}button{font-size:10px;min-height:38px;padding:8px 5px}.foot{margin-top:8px;padding-top:7px}}@media(prefers-reduced-motion:no-preference){button{transition:background .2s}}`;
const LOGO='<svg viewBox="0 0 25 25"><path d="M3 15h4v8H3zM10 9h4v14h-4zM17 3h4v20h-4z" fill="#e9c770"/></svg>';
export const BOT_WORKSPACE_WIDGET_HTML='<!doctype html><html><style>'+WIDGET_THEME_CSS+'</style><body><div class="shell"><div class="head"><div><div class="brand">'+LOGO+'DrFX<span>Ai</span></div><div class="eyebrow">SIGNAL BRIDGE · WORKSPACE</div></div><span class="pill" id="badge">ACCOUNT</span></div><h2 id="title">Your trading workspace</h2><div class="sub" id="subtitle"></div><div class="rows" id="rows">'+Array.from({length:5},(_,i)=>'<div class="row" id="row'+i+'" hidden><small id="label'+i+'"></small><b id="value'+i+'"></b></div>').join('')+'</div><div class="body" id="body" hidden></div><div class="pager" id="pager" hidden><button id="prev">Previous</button><span id="page"></span><button id="next">Next</button></div><div class="actions">'+Array.from({length:10},(_,i)=>'<button id="action'+i+'" hidden></button>').join('')+'</div><div class="foot" id="foot">Private account workspace</div></div><script>(function(){var T=window.TelegramWidget,d=document,s={},busy=false,part=0,status="";function e(k){return d.getElementById(k)}function set(k,v){e(k).textContent=v==null?"":String(v)}function load(){try{s=JSON.parse(T&&T.chatData||"{}");if(s.t)s={page:s.p,title:s.t,subtitle:s.s,badge:s.g,footer:s.f,rows:(s.r||[]).map(function(r){return {label:r[0],value:r[1],tone:r[2]}}),buttons:(s.b||[]).map(function(b){return {label:b[0],action:b[1],tone:b[2],url:b[3]}}),pages:s.x,copy:s.c}}catch(x){s={}}part=0}function draw(){set("badge",s.badge||"ACCOUNT");set("title",s.title||"Your trading workspace");set("subtitle",s.subtitle);set("foot",status||s.footer||"Private account workspace");for(var i=0;i<5;i++){var r=s.rows&&s.rows[i];e("row"+i).hidden=!r;if(r){set("label"+i,r.label);set("value"+i,r.value);e("value"+i).className=r.tone||""}}var pages=s.pages||[];e("body").hidden=!pages.length;set("body",pages[part]||"");e("pager").hidden=pages.length<2;set("page",(part+1)+" / "+pages.length);e("prev").disabled=part===0;e("next").disabled=part>=pages.length-1;for(var j=0;j<10;j++){var b=s.buttons&&s.buttons[j],el=e("action"+j);el.hidden=!b;el.disabled=busy;if(b){el.textContent=b.label;el.className=b.tone||""}}}function action(b){if(!T){set("foot","Open this widget inside the official Telegram bot.");return}if(b.action==="copy"){T.copyText(s.copy||"");return}if(b.url){T.openLink(b.url);return}if(busy)return;busy=true;draw();set("foot","Loading…");T.request(b.action).then(function(r){var a={};try{a=JSON.parse(r.result||"{}")}catch(x){}if(a.view){s=a.view;part=0;status=""}else status=a.message||""},function(){status="Request unavailable. Send /menu to reopen your workspace."}).then(function(){busy=false;draw()})}for(var i=0;i<10;i++)(function(n){e("action"+n).onclick=function(){var b=s.buttons&&s.buttons[n];if(b)action(b)}})(i);e("prev").onclick=function(){part=Math.max(0,part-1);draw()};e("next").onclick=function(){part=Math.min((s.pages||[]).length-1,part+1);draw()};load();draw();if(T){T.onEvent("chatDataChanged",function(){load();status="";draw()});T.ready()}})();</script></body></html>';
export const pageButton=(label,page,tone='')=>({label,action:'ui:page:'+page,tone});
export function unpackWorkspaceView(s){
 if(!s||!s.t)return s||{};
 return {page:s.p,title:s.t,subtitle:s.s,badge:s.g,footer:s.f,rows:(s.r||[]).map(r=>({label:r[0],value:r[1],tone:r[2]})),buttons:(s.b||[]).map(b=>({label:b[0],action:b[1],tone:b[2],url:b[3]})),pages:s.x,copy:s.c};
}
export function widgetViewData(view){
 const s={z:crypto.randomUUID().slice(0,8),p:view.page,t:view.title,s:view.subtitle,g:view.badge,f:view.footer,r:(view.rows||[]).map(r=>[r.label,r.value,r.tone||'']),b:(view.buttons||[]).map(b=>[b.label,b.action,b.tone||'',...(b.url?[b.url]:[])]),x:view.pages,c:view.copy};
 let value=JSON.stringify(s);
 if(new TextEncoder().encode(value).length>1024){delete s.f;delete s.s;value=JSON.stringify(s);}
 if(new TextEncoder().encode(value).length>1024)throw Error('WORKSPACE_DATA_TOO_LARGE');
 return value;
}
const back=()=>pageButton('‹ Main Menu','home');
const plain=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>');
export function noticeView(text){
 const value=plain(text),pages=[];let remaining=value;
 while(remaining){let n=remaining.length<=450?remaining.length:remaining.lastIndexOf('\n',450);if(n<100)n=Math.min(450,remaining.length);pages.push(remaining.slice(0,n));remaining=remaining.slice(n).trimStart();}
 return {page:'notice',title:'Account update',subtitle:'DrFXAi · Private response',badge:'PRIVATE',pages,buttons:[back(),pageButton('My Licenses','licenses')],footer:'Keep account details private.'};
}
export const BOT_NAVIGATION = Object.freeze({ home: 'workspace:home', channels: 'workspace:channels' });

export function navigationKeyboard(keyboard, section) {
 const rows = [...(keyboard?.inline_keyboard || [])];
 if (section === 'channel-detail') {
  rows.push([{text:'‹ Back to Channels & Groups',callback_data:BOT_NAVIGATION.channels}]);
 }
 rows.push([{text:'⌂ Main Menu',callback_data:BOT_NAVIGATION.home}]);
 return {...keyboard,inline_keyboard:rows};
}

export async function sendBotNotice(env,h,chatId,text,keyboard,section){
 keyboard=navigationKeyboard(keyboard,section);
 // Activation codes, sign-in codes and webhook tokens stay in protected native captions.
 const sensitive=/<code[\s>]|DRFX-[A-Z2-9-]{20,}|\/v1\/ingress\//i.test(text);
 if(sensitive&&String(text).length>1000)return h.raw(env,'sendMessage',{chat_id:chatId,text,parse_mode:'HTML',protect_content:true,...(keyboard?{reply_markup:keyboard}:{})});
 const view=sensitive?{page:'notice',title:'Your private account details',subtitle:'Your code is in the protected caption below.',badge:'SECURE',buttons:[back(),pageButton('My Licenses','licenses')],footer:'Copy the code from the message below. Never share it.'}:noticeView(text);
 if(section==='channels'||section==='channel-detail'){
  view.title='Channels & Groups';
  view.subtitle=sensitive?'Your private TradingView setup is below.':'Manage TradingView alerts in Telegram.';
  view.buttons=section==='channel-detail'?[pageButton('‹ Back to Channels & Groups','channels'),back()]:[back()];
 }
 try{
  const pages=view.pages?.length?view.pages:[null];let result;
  for(let i=0;i<pages.length;i++)result=await h.raw(env,'sendWidget',{chat_id:chatId,html:BOT_WORKSPACE_WIDGET_HTML,chat_data:widgetViewData({...view,pages:pages[i]?[pages[i]]:undefined,subtitle:pages.length>1?'Details · '+(i+1)+' / '+pages.length:view.subtitle}),caption:sensitive?String(text):'DrFXAi · Account response',...(sensitive?{parse_mode:'HTML'}:{}),allow_queries:true,protect_content:true,...(i===pages.length-1?{reply_markup:keyboard}:{reply_markup:navigationKeyboard(undefined,section)})});
  return result;
 }
 catch{return h.raw(env,'sendMessage',{chat_id:chatId,text,parse_mode:'HTML',protect_content:true,...(keyboard?{reply_markup:keyboard}:{})});}
}
export async function sendWorkspacePage(env,h,user,page='home',messageId=null){
 const view=await workspaceView(env,h,user,page);if(h.subtitle)view.subtitle=h.subtitle;
 const chat_data=widgetViewData(view);
 if(messageId)await h.raw(env,'editMessageWidgetData',{chat_id:user.telegram_id,message_id:messageId,chat_data});
 else {
  const miniApp={text:'Open DrFX Mini App',web_app:{url:'https://drfx.company/telegram'}};
  const reply_markup=page==='home'?{inline_keyboard:[[miniApp]]}:navigationKeyboard({inline_keyboard:[[miniApp]]});
  try{
   await h.raw(env,'sendWidget',{chat_id:user.telegram_id,html:BOT_WORKSPACE_WIDGET_HTML,chat_data,caption:'DrFXAi · '+view.title,allow_queries:true,protect_content:true,reply_markup});
  }catch{
   if(page!=='home')throw Error('WORKSPACE_WIDGET_UNAVAILABLE');
   await h.raw(env,'sendMessage',{chat_id:user.telegram_id,text:'Main Menu · DrFX Signal Bridge\n\nUse /signal for your latest signal or /licenses for your licenses.',protect_content:true,reply_markup:{inline_keyboard:[[{text:'Channels & Groups',callback_data:BOT_NAVIGATION.channels}],[miniApp]]}});
  }
 }
 return view;
}
export async function signalRecords(env,user){
 const tv=(await env.DB.prepare('SELECT id,normalized_json,received_at FROM received_signals WHERE tenant_id=? ORDER BY received_at DESC LIMIT 20').bind(user.id).all()).results||[];
 const tg=(await env.DB.prepare("SELECT id,payload_json AS normalized_json,created_at AS received_at FROM commands WHERE tenant_id=? AND source_type='telegram' ORDER BY created_at DESC LIMIT 20").bind(user.id).all()).results||[];
 const rows=[...tv.map(r=>({...r,source:'TradingView'})),...tg.map(r=>({...r,source:'Telegram'}))];
 return rows.map(r=>{try{const s=JSON.parse(r.normalized_json);if(s.action&&s.action!=='OPEN')return null;if(!['BUY','SELL'].includes(s.side)||!s.symbol||!s.order)return null;return {...r,signal:s}}catch{return null}}).filter(Boolean).sort((a,b)=>b.received_at.replace('T',' ').localeCompare(a.received_at.replace('T',' '))||b.id.localeCompare(a.id));
}
export function workspaceQueryPage(action){
 const m=/^ui:(page|open):(home|account|licenses|shop|setup|help|channels|language|app|link|terms|support|login|resetconfirm|reset|bridgecode|scalperkeys|admin|adminhelp|history(?::[0-9]{1,2})?|signal:[0-9]{1,2}|orders(?::[0-9]{1,2})?|users(?::[0-9]{1,3})?|lang:(?:en|fa|ar|tr|ru|hi))$/.exec(String(action||''));
 return m?{mode:m[1],page:m[2]}:null;
}
export async function workspaceView(env,h,user,page){
 const root={page,badge:String(user.plan||'account').toUpperCase(),footer:'DrFXAi · Private trading workspace',rows:[],buttons:[]};
 const view=(title,subtitle,rows,buttons)=>({...root,title,subtitle,rows,buttons});
 if(page==='home')return view('Your trading workspace','Signals, access and automation in one place.',[],[pageButton('◈ Signals','history:0','accent'),pageButton('⚿ My Licenses','licenses','primary'),pageButton('★ Buy & Renew','shop'),pageButton('▣ Connect MT5','setup'),pageButton('Channels & Groups','channels'),pageButton('? Help','help'),pageButton('◯ Account','account'),pageButton('◎ Language','language'),...(user.role==='admin'?[pageButton('Admin Console','admin','accent')]:[])]);
 if(page==='account'){
  const r=await h.licenseRecord(env,user);
  return view('Account & Access','Manage your plan and secure account access.',[{label:'Account',value:user.status,tone:'good'},{label:'Plan',value:user.plan,tone:'gold'},{label:'License',value:r.status},{label:'Expiry · UTC',value:r.expires_at||'Starts on activation'}],[pageButton('Get EA Code','bridgecode','primary'),pageButton('Website Login','login'),pageButton('Linked Accounts','link'),pageButton('Reset Login Code','resetconfirm'),pageButton('Open Mini App','app'),back()]);
 }
 if(page==='licenses')return view('My Licenses','Your DrFXAi products and private activation codes.',[{label:'Signal Bridge',value:'License & activation',tone:'gold'},{label:'Scalper Pro',value:'MT5 account-bound'}],[pageButton('Get Bridge Code','bridgecode','primary'),pageButton('Get Scalper Keys','scalperkeys','primary'),pageButton('Buy & Renew','shop'),pageButton('My Orders','orders:0'),pageButton('Setup Guide','setup'),back()]);
 if(page==='shop')return {...view('Buy & Renew','Choose a plan. Review terms before paying.',Object.keys(h.plans).map(p=>({label:h.plans[p].label,value:(h.price(env,p)||'Unavailable')+' Stars',tone:'gold'})),Object.keys(h.plans).filter(p=>h.price(env,p)).map(p=>({label:'Review '+(p==='quarterly'?'Bridge 3m':p==='annual'?'Bridge 12m':p==='scalper_1m'?'Scalper 30d':'Scalper 90d'),action:'sb:buy:'+p,tone:'accent'})).concat([pageButton('Terms & Support','terms'),back()])),footer:'Scalper Pro needs an MT5 account number. Website USD prices are separate.'};
 if(page==='setup'||page==='help')return view(page==='setup'?'Setup & Help':'How can we help?','Get connected in four clear steps.',[{label:'01 · Get your license',value:'Private activation code'},{label:'02 · Download the EA',value:'From your member account'},{label:'03 · Activate in MT5',value:'Paste your code into the EA'},{label:'04 · Connect alerts',value:'TradingView or Telegram'}],[pageButton('Get License','licenses','primary'),pageButton('Channels & Groups','channels'),pageButton('Open Mini App','app'),pageButton('Payment Support','support'),pageButton('Language','language'),back()]);
 if(page==='app')return view('Your DrFX Mini App','Tap Open DrFX Mini App beneath this widget.',[{label:'Secure sign-in',value:'Telegram account'},{label:'Workspace',value:'Setup · analytics · channels'}],[pageButton('Setup Guide','setup'),back()]);
 if(page==='link')return {...view('Linked Accounts','Link an existing verified website account securely.',[{label:'Email',value:user.email||'Not linked'},{label:'Telegram',value:user.telegram_name||'Connected'}],[{label:'Copy linking command',action:'copy'},pageButton('Open Mini App','app'),back()]),copy:'/link YOUR_LINKING_CODE',footer:'Get a fresh linking code from your verified website account. Paste it into the command in this chat.'};
 if(page==='language')return view('Language','Choose your preferred bot language.',[],['en','fa','ar','tr','ru','hi'].map((p,i)=>pageButton(['English','فارسی','العربية','Türkçe','Русский','हिन्दी'][i],'lang:'+p)).concat([back()]));
 if(page==='resetconfirm')return view('Replace your login code?','Your existing website login code will stop working.',[],[pageButton('Confirm Reset','reset','primary'),pageButton('Cancel','account')]);
 if(page==='terms')return {...noticeView(h.terms),page,title:'License Terms',badge:'TERMS',buttons:[pageButton('Buy & Renew','shop'),pageButton('Payment Support','support'),back()]};
 if(page==='support')return {...view('Payment Support','For payment, delivery or refund help, include your order ID.',[],[{label:'Copy support command',action:'copy'},pageButton('My Orders','orders:0'),pageButton('Terms','terms'),back()]),copy:'/paysupport ORDER_ID YOUR_MESSAGE',footer:'Paste the command in this chat, add your message and send. Your request is recorded for the DrFX admin.'};
 if(page.startsWith('history')||page.startsWith('signal:')){
  const rows=await signalRecords(env,user),n=Math.min(39,Math.max(0,Number(page.split(':')[1])||0));
  if(page.startsWith('signal:')){
   const r=rows[n];if(!r)return view('No recorded signal','Connect your alerts to see signals here.',[],[pageButton('Channels & Groups','channels'),back()]);
   const s=r.signal,o=s.order,copy=[s.symbol+' '+s.side,'Entry: '+(o.reference_price||'Market'),'SL: '+o.stop_loss,...(o.take_profits||[]).slice(0,3).map((v,i)=>'TP'+(i+1)+': '+v)].join('\n');
   return {...view(s.symbol+' · '+s.side,r.source+' · '+String(r.received_at).slice(0,19)+' UTC',[{label:'Entry reference',value:o.reference_price||'Market / not supplied',tone:'gold'},{label:'Stop Loss',value:o.stop_loss||'Not supplied',tone:'bad'},...(o.take_profits||[]).slice(0,3).map((v,i)=>({label:'Target '+(i+1),value:v,tone:'good'}))],[{label:'Copy Signal',action:'copy',tone:'primary'},pageButton('Refresh','signal:'+n),pageButton('Signal History','history:0'),back()]),copy,badge:'RECORDED',footer:'Recorded alert only. Broker execution and target hits require an EA receipt.'};
  }
  const offset=Math.min(36,n),selected=rows.slice(offset,offset+3);
  return view('Signal History',selected.length?'Latest recorded alerts · '+(offset+1)+'–'+(offset+selected.length):'No recorded signals yet.',selected.map(r=>({label:r.source+' · '+String(r.received_at).slice(5,16),value:r.signal.symbol+' '+r.signal.side,tone:r.signal.side==='SELL'?'bad':'good'})),selected.map((r,i)=>pageButton('Open '+r.signal.symbol+' '+r.signal.side,'signal:'+(offset+i),'accent')).concat([...(offset?[pageButton('‹ Previous','history:'+Math.max(0,offset-3))]:[]),...(rows.length>offset+3?[pageButton('Next ›','history:'+(offset+3))]:[]),pageButton('Refresh','history:'+offset),back()]));
 }
 if(page.startsWith('orders')){
  const offset=Math.min(96,Number(page.split(':')[1])||0),rows=(await env.DB.prepare('SELECT id,plan,stars,status,created_at FROM telegram_star_orders WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 4 OFFSET ?').bind(user.id,offset).all()).results||[];
  return view('My Orders',rows.length?'Telegram Stars purchases · '+(offset+1)+'–'+(offset+Math.min(3,rows.length)):'No Telegram purchases yet.',rows.slice(0,3).map(r=>({label:h.plans[r.plan]?.label||r.plan,value:r.stars+' Stars · '+r.status+'\n'+r.id,tone:r.status==='paid'?'good':'gold'})),[...(offset?[pageButton('‹ Previous','orders:'+Math.max(0,offset-3))]:[]),...(rows.length>3&&offset<96?[pageButton('Next ›','orders:'+(offset+3))]:[]),pageButton('Buy & Renew','shop'),pageButton('Payment Support','support'),back()]);
 }
 if(page==='admin'||page==='adminhelp'||page.startsWith('users')){
  if(user.role!=='admin')throw Error('FORBIDDEN');
  if(page.startsWith('users')){
   const offset=Math.min(996,Number(page.split(':')[1])||0),rows=(await env.DB.prepare('SELECT id,telegram_name,email,plan,status FROM site_users ORDER BY created_at DESC,id DESC LIMIT 4 OFFSET ?').bind(offset).all()).results||[];
   return view('Member Directory','Admin-only · latest members',rows.slice(0,3).map(r=>({label:r.telegram_name||r.email||r.id,value:r.plan+' · '+r.status+'\n'+r.id})),[...(offset?[pageButton('‹ Previous','users:'+Math.max(0,offset-3))]:[]),...(rows.length>3&&offset<996?[pageButton('Next ›','users:'+(offset+3))]:[]),pageButton('Management Actions','adminhelp'),pageButton('Admin Console','admin'),back()]);
  }
  if(page==='adminhelp')return {...view('Management Actions','Use the authenticated Admin Mini App for complete member controls.',[],[{label:'Copy command guide',action:'copy'},pageButton('Members','users:0'),pageButton('Admin Console','admin'),back()]),copy:'/detail USER_ID\n/grant USER_ID trial|quarterly|annual\n/scalperkey MT5_LOGIN 1m|3m USER_ID\n/suspend USER_ID\n/resume USER_ID\n/revoke USER_ID',footer:'Replace placeholders in this chat. Commands remain admin-only. License changes require an explicit command.'};
  const stats=await env.DB.prepare("SELECT COUNT(*) AS total,SUM(status='active') AS active,SUM(status='suspended') AS suspended FROM site_users").first();
  return view('Admin Console','Private administration · DrFXAi',[{label:'Registered members',value:stats?.total||0},{label:'Active accounts',value:stats?.active||0,tone:'good'},{label:'Suspended accounts',value:stats?.suspended||0}],[pageButton('Members','users:0'),pageButton('Management Actions','adminhelp'),pageButton('Open Mini App','app'),pageButton('My Licenses','licenses'),back()]);
 }
 throw Error('UNKNOWN_WORKSPACE_PAGE');
}
