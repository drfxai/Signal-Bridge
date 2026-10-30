// TradingView -> Telegram channel webhooks in the Telegram Mini App.
// Three visual steps: add the bot as admin, pick the chat, copy the webhook into TradingView.
const TV_ICON='<svg class="chm-ic" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6" fill="#2962ff"/><path d="M5 16l5-5 3.4 3.2L19 8" fill="none" stroke="#fff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19" cy="8" r="1.8" fill="#fff"/></svg>';
const TG_ICON='<svg class="chm-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#2aabee"/><path d="M5.2 11.8l12.4-4.9-2.1 10.8-3.9-2.8-2 1.9-.3-3.3 5.4-4.9-6.8 4.2z" fill="#fff"/></svg>';
const BOT_ICON='<svg class="chm-ic" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="7" fill="url(#chmGold)"/><defs><linearGradient id="chmGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe296"/><stop offset="1" stop-color="#b08634"/></linearGradient></defs><path d="M6 15.5a6 6 0 0 1 12 0M5 15.5h14M9 11.8v3.7M15 11.8v3.7" fill="none" stroke="#1a1204" stroke-width="1.9" stroke-linecap="round"/></svg>';

export const CHM_HOME_HTML = String.raw`<button type="button" class="chm-promo" data-jump="channels"><span class="chm-promo-flow" aria-hidden="true">${TV_ICON}<i></i>${TG_ICON}</span><span><em>NEW</em><b>TradingView → your channel</b><small>Post alerts to a Telegram channel or group · 3 taps</small></span><span class="chm-promo-go" aria-hidden="true">→</span></button>
`;

export const CHM_NAV_HTML = String.raw`<button data-tab="channels" type="button" aria-selected="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l15-6-3 14-5-4-2 3-1-5z"/><path d="M10 13l6-5"/></svg><span>Channels</span></button>
`;

export const CHM_PANEL_HTML = String.raw`<section class="tab-panel" data-panel="channels" id="panel-channels" hidden>
 <p class="tab-kicker">NEW · TRADINGVIEW → TELEGRAM</p><h2 class="section-title">Send alerts to your <span>channel</span></h2>
 <div class="chm-hero" aria-hidden="true">
  <div class="chm-node">${TV_ICON}<small>TradingView</small></div>
  <div class="chm-wire"><i></i><i></i><i></i></div>
  <div class="chm-node">${BOT_ICON}<small>DrFX bot</small></div>
  <div class="chm-wire"><i></i><i></i><i></i></div>
  <div class="chm-node">${TG_ICON}<small>Your channel</small></div>
 </div>
 <p class="chm-lead">Alerts are posted straight to your Telegram channel or group. <b>MT5 is not involved.</b></p>
 <ol class="chm-steps">
  <li class="chm-step" id="chmStep1"><span class="chm-num"><b>1</b></span><div class="chm-body">
   <h3>Add the bot as an admin</h3><p>Allow <b>Post messages</b>. You get a message from the bot when it is in.</p>
   <div class="chm-add"><button type="button" class="btn primary" id="chmAddChannel"><span aria-hidden="true">📢</span> Add to channel</button><button type="button" class="btn" id="chmAddGroup"><span aria-hidden="true">👥</span> Add to group</button></div>
  </div></li>
  <li class="chm-step" id="chmStep2"><span class="chm-num"><b>2</b></span><div class="chm-body">
   <div class="chm-row"><h3>Pick your chat</h3><button type="button" class="chm-refresh" id="chmRefresh" aria-label="Refresh list"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4"/></svg></button></div>
   <div id="chmChats" class="chm-chats" role="listbox" aria-label="Your channels and groups"><p class="chm-empty">Loading…</p></div>
  </div></li>
  <li class="chm-step" id="chmStep3"><span class="chm-num"><b>3</b></span><div class="chm-body">
   <h3>Paste the webhook in TradingView</h3>
   <div id="chmHook"><p class="chm-empty">Pick a chat first.</p></div>
  </div></li>
 </ol>
 <details class="card chm-howto"><summary>Where do I paste it in TradingView?</summary>
  <ol class="list"><li>Open your chart and press <b>Alert</b> (the clock icon).</li><li>Go to <b>Notifications</b> and tick <b>Webhook URL</b>. Paste your link.</li><li>In <b>Message</b>, paste the template and adjust it. Plain text works too.</li><li>Press <b>Create</b>. Each alert appears in your chat in about a second.</li></ol>
  <p class="meta">For strategy alerts, use this message instead:</p><code class="chm-code" id="chmStrategyTpl"></code>
  <button type="button" class="btn subtle" data-chm-copy="chmStrategyTpl">Copy strategy template</button>
 </details>
 <p id="chmStatus" class="mini-note" role="status" aria-live="polite"></p>
</section>
`;

export const CHM_CSS = String.raw`
nav.bottom button[data-tab=channels]{color:#7cc8f0}
.chm-ic{width:100%;height:100%;display:block}
.chm-promo{position:relative;display:flex;align-items:center;gap:12px;width:100%;margin:12px 0;padding:14px;border-radius:15px;border:1px solid #2aabee70;background:radial-gradient(ellipse at 0 50%,#2962ff2e,transparent 62%),linear-gradient(155deg,#101827,#111218 80%);color:#f8f8fa;text-align:left;overflow:hidden;cursor:pointer;animation:chmIn .6s var(--easing) both .05s}
.chm-promo:after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,#ffffff14 50%,transparent 60%);transform:translateX(-120%);animation:chmGlint 4.5s ease-in-out infinite 1s}
.chm-promo em{display:inline-block;font-style:normal;font-size:10px;font-weight:800;letter-spacing:.08em;color:#06131d;background:#7cc8f0;border-radius:6px;padding:2px 6px;margin-bottom:4px}
.chm-promo b{display:block;font-size:15px}.chm-promo small{display:block;color:#a6b4c8;font-size:12px;margin-top:2px}
.chm-promo-flow{display:flex;align-items:center;gap:4px;flex:none}.chm-promo-flow .chm-ic{width:26px;height:26px}
.chm-promo-flow i{width:22px;height:2px;border-radius:2px;background:linear-gradient(90deg,#2962ff,#2aabee);background-size:200% 100%;animation:chmWire 1.2s linear infinite}
.chm-promo-go{margin-left:auto;font-size:20px;color:#7cc8f0;animation:chmNudge 1.6s ease-in-out infinite}
.chm-hero{display:flex;align-items:center;justify-content:space-between;gap:6px;margin:14px 0 6px;padding:16px 12px;border-radius:16px;border:1px solid #2a3a52;background:radial-gradient(ellipse at 50% 0,#2aabee22,transparent 70%),#0e131c}
.chm-node{display:grid;justify-items:center;gap:6px;flex:none;animation:chmPop .6s var(--easing) both}.chm-node:nth-child(3){animation-delay:.12s}.chm-node:nth-child(5){animation-delay:.24s}
.chm-node .chm-ic{width:44px;height:44px;filter:drop-shadow(0 6px 14px #0008)}.chm-node small{font-size:11px;color:#a6b4c8;font-weight:700}
.chm-wire{position:relative;flex:1;height:2px;margin-bottom:20px;border-radius:2px;background:#26344a;overflow:hidden}
.chm-wire i{position:absolute;top:-2px;left:-8px;width:6px;height:6px;border-radius:50%;background:#7cc8f0;box-shadow:0 0 10px #2aabee;animation:chmDot 1.8s linear infinite}
.chm-wire i:nth-child(2){animation-delay:.6s}.chm-wire i:nth-child(3){animation-delay:1.2s}
.chm-lead{color:#c6cfdb;font-size:13.5px;line-height:1.55;margin:10px 2px 14px}.chm-lead b{color:#7cc8f0}
.chm-steps{list-style:none;margin:0;padding:0;display:grid;gap:12px}
.chm-step{display:flex;gap:12px;padding:15px;border-radius:16px;border:1px solid #2d2d36;background:linear-gradient(155deg,#17181f,#101117);animation:chmIn .55s var(--easing) both;transition:border-color .3s,box-shadow .3s}
.chm-step:nth-child(2){animation-delay:.08s}.chm-step:nth-child(3){animation-delay:.16s}
.chm-step.active{border-color:#e8c77e99;box-shadow:0 0 0 1px #e8c77e33,0 10px 30px #0006}
.chm-step.done{border-color:#34d69866}
.chm-num{flex:none;display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#22232b;border:1px solid #3a3a44;color:#f2d48c;font-size:15px}
.chm-step.active .chm-num{background:linear-gradient(160deg,#ffe296,#b08634);color:#1a1204;border:0;animation:chmPulse 2s ease-in-out infinite}
.chm-step.done .chm-num{background:#34d698;color:#04140d;border:0;animation:chmPop .45s var(--easing)}
.chm-step.done .chm-num b{font-size:0}.chm-step.done .chm-num b:after{content:"✓";font-size:17px}
.chm-body{flex:1;min-width:0}.chm-body h3{margin:5px 0 4px;font-size:16px;color:#f8f8fa}.chm-body p{margin:0;color:#a6a9b4;font-size:13px;line-height:1.5}
.chm-add{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}.chm-add .btn{flex:1;min-height:46px;min-width:140px}
.chm-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.chm-refresh{width:36px;height:36px;border-radius:10px;border:1px solid #3a3a44;background:#1b1c23;color:#c6cfdb;display:grid;place-items:center;cursor:pointer}
.chm-refresh svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.chm-refresh.spin svg{animation:chmRot .8s linear infinite}
.chm-chats{display:grid;gap:8px;margin-top:10px}
.chm-chat{display:flex;align-items:center;gap:11px;width:100%;padding:11px 12px;border-radius:13px;border:1px solid #33333d;background:#0f1016;color:#f8f8fa;text-align:left;cursor:pointer;animation:chmIn .45s var(--easing) both;transition:transform .15s,border-color .2s,background .2s}
.chm-chat:active{transform:scale(.98)}.chm-chat[aria-selected=true]{border-color:#e8c77e;background:linear-gradient(155deg,#231d10,#121218)}
.chm-avatar{flex:none;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:18px;background:linear-gradient(160deg,#2aabee,#1c6fa8)}
.chm-chat.group .chm-avatar{background:linear-gradient(160deg,#8b7cf6,#5a4bc4)}
.chm-chat b{display:block;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chm-chat small{display:block;color:#a6a9b4;font-size:12px;margin-top:1px}
.chm-pill{margin-left:auto;flex:none;font-size:11px;font-weight:800;padding:4px 9px;border-radius:999px;border:1px solid #3a3a44;color:#c6cfdb}
.chm-pill.ok{color:#34d698;border-color:#34d69866;background:#34d6981a}.chm-pill.warn{color:#ffb35c;border-color:#ffb35c66;background:#ffb35c14}.chm-pill.new{color:#f2d48c;border-color:#e8c77e66;background:#e8c77e14}
.chm-empty{margin:8px 0 0;color:#a6a9b4;font-size:13px;line-height:1.55}
.chm-hookbox{margin-top:10px;animation:chmIn .45s var(--easing) both}
.chm-url{position:relative;display:block;padding:12px;border-radius:11px;background:#060709;border:1px solid #2aabee66;color:#9fdcff;font:700 12px/1.5 ui-monospace,monospace;word-break:break-all;overflow:hidden}
.chm-url.fresh:after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,#2aabee44 50%,transparent 65%);animation:chmGlint 1.2s ease-out 1 forwards}
.chm-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.chm-btns .btn{min-height:44px}
.chm-btns .wide{grid-column:1/-1}
.chm-meta{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;color:#a6a9b4;font-size:12px}.chm-meta b{color:#f8f8fa}
.chm-code{display:block;margin:8px 0;padding:10px;border-radius:10px;background:#060709;border:1px solid #26262e;color:#f4d38e;font:600 11.5px/1.55 ui-monospace,monospace;word-break:break-all;white-space:pre-wrap}
.chm-gen{position:relative;width:100%;min-height:52px;margin-top:10px;font-size:15px;overflow:hidden}
.chm-gen:after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 40%,#ffffff40 50%,transparent 60%);transform:translateX(-120%);animation:chmGlint 2.6s ease-in-out infinite}
.chm-danger{color:#ff8a96!important}
.chm-howto summary{cursor:pointer;font-weight:800;color:#f2d48c}.chm-howto[open] summary{margin-bottom:8px}
.chm-burst{position:fixed;pointer-events:none;z-index:80;width:8px;height:8px;border-radius:2px;animation:chmBurst .9s cubic-bezier(.2,.7,.3,1) forwards}
#panel-channels:not([hidden]) .tab-kicker,#panel-channels:not([hidden]) .section-title{animation:chmIn .5s var(--easing) both}
@keyframes chmIn{from{opacity:0;transform:translateY(12px)}}
@keyframes chmPop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}
@keyframes chmPulse{0%,100%{box-shadow:0 0 0 0 #e8c77e66}50%{box-shadow:0 0 0 8px #e8c77e00}}
@keyframes chmDot{from{left:-8px}to{left:calc(100% + 8px)}}
@keyframes chmWire{to{background-position:-200% 0}}
@keyframes chmNudge{0%,100%{transform:translateX(0)}50%{transform:translateX(4px)}}
@keyframes chmGlint{60%,100%{transform:translateX(120%)}}
@keyframes chmRot{to{transform:rotate(360deg)}}
@keyframes chmBurst{to{transform:translate(var(--dx),var(--dy)) rotate(260deg);opacity:0}}
@media (prefers-reduced-motion:reduce){.chm-promo,.chm-promo:after,.chm-promo-flow i,.chm-promo-go,.chm-node,.chm-wire i,.chm-step,.chm-chat,.chm-gen:after,.chm-hookbox,.chm-step.active .chm-num{animation:none!important}}
[dir=rtl] .chm-promo,[dir=rtl] .chm-chat{text-align:right}[dir=rtl] .chm-promo-go{margin-left:0;margin-right:auto;transform:scaleX(-1)}[dir=rtl] .chm-pill{margin-left:0;margin-right:auto}
`;

export const CHM_JS = String.raw`
(()=>{'use strict';
const $=id=>document.getElementById(id),tg=window.Telegram?.WebApp||null;
let data=null,sel=null,busy=false,fresh='',tries=0;
const ERR={LINK_TELEGRAM_FIRST:'Open this Mini App from the DrFX bot so your Telegram account is linked.',BOT_NOT_IN_CHAT:'The bot is no longer in this chat. Add it again as an admin.',BOT_CANNOT_POST:'Give the bot the "Post messages" admin permission, then tap refresh.',ADMIN_RIGHTS_REQUIRED:'Only admins of this chat can create its webhook.',BOT_NOT_CONFIGURED:'The bot is not configured yet.',RATE_LIMITED:'Too many tries. Wait a minute.',CREATE_WEBHOOK_FIRST:'Create the webhook first.',TELEGRAM_DELIVERY_FAILED:'Telegram refused the message. Check the bot is still an admin.',UNAUTHENTICATED:'Open this Mini App from the official DrFX bot to sign in.'};
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])}
function say(t){const s=$('chmStatus');if(s)s.textContent=t||''}
function haptic(kind){try{kind==='ok'?tg?.HapticFeedback?.notificationOccurred?.('success'):kind==='err'?tg?.HapticFeedback?.notificationOccurred?.('error'):tg?.HapticFeedback?.selectionChanged?.()}catch{}}
async function api(path,body){const o={credentials:'same-origin',headers:{accept:'application/json'}};if(body!==undefined){o.method='POST';o.headers['content-type']='application/json';o.body=JSON.stringify(body)}const r=await fetch(path,o);const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'SERVICE_UNAVAILABLE');return d}
function ask(msg){return new Promise(res=>{try{if(tg?.showConfirm){tg.showConfirm(msg,ok=>res(!!ok));return}}catch{}res(window.confirm(msg))})}
function openTg(url){try{if(tg?.openTelegramLink)tg.openTelegramLink(url);else window.open(url,'_blank','noopener')}catch{location.assign(url)}}
function ago(ts){if(!ts)return 'never';const s=(Date.now()-Date.parse(ts.replace(' ','T')+'Z'))/1000;if(!isFinite(s))return ts;if(s<60)return 'just now';if(s<3600)return Math.floor(s/60)+' min ago';if(s<86400)return Math.floor(s/3600)+' h ago';return Math.floor(s/86400)+' d ago'}
function burst(el){if(matchMedia('(prefers-reduced-motion: reduce)').matches||!el)return;const r=el.getBoundingClientRect(),cols=['#ffe296','#2aabee','#34d698','#2962ff','#f8f8fa'];for(let i=0;i<22;i++){const p=document.createElement('span');p.className='chm-burst';const a=Math.random()*Math.PI*2,d=60+Math.random()*90;p.style.left=(r.left+r.width/2)+'px';p.style.top=(r.top+r.height/2)+'px';p.style.background=cols[i%cols.length];p.style.setProperty('--dx',Math.cos(a)*d+'px');p.style.setProperty('--dy',Math.sin(a)*d-40+'px');document.body.append(p);setTimeout(()=>p.remove(),1000)}}
function steps(){const chats=data?.chats||[],chat=chats.find(c=>c.chat_id===sel),s1=$('chmStep1'),s2=$('chmStep2'),s3=$('chmStep3');if(!s1)return;
 const d1=chats.length>0,d2=!!chat,d3=!!chat?.webhook;
 s1.classList.toggle('done',d1);s2.classList.toggle('done',d2);s3.classList.toggle('done',d3);
 s1.classList.toggle('active',!d1);s2.classList.toggle('active',d1&&!d2);s3.classList.toggle('active',d2&&!d3);}
function renderChats(){const box=$('chmChats');if(!box)return;const chats=data?.chats||[];
 if(!data?.telegram_linked){box.innerHTML='<p class="chm-empty">'+esc(ERR.LINK_TELEGRAM_FIRST)+'</p>';return}
 if(!chats.length){box.innerHTML='<p class="chm-empty">No chats yet. Add the bot as an admin (step 1), then tap refresh ↻.</p>';return}
 box.innerHTML=chats.map((c,i)=>{const grp=c.type!=='channel',pill=!c.can_post?'<span class="chm-pill warn">Needs permission</span>':c.webhook?'<span class="chm-pill ok">● Live</span>':'<span class="chm-pill new">Connect</span>';
  return '<button type="button" role="option" class="chm-chat'+(grp?' group':'')+'" style="animation-delay:'+(i*0.05)+'s" aria-selected="'+(c.chat_id===sel)+'" data-chat="'+esc(c.chat_id)+'"><span class="chm-avatar" aria-hidden="true">'+(grp?'👥':'📢')+'</span><span style="min-width:0"><b>'+esc(c.title)+'</b><small>'+(c.username?'@'+esc(c.username):grp?'Group':'Channel')+(c.webhook?' · '+esc(c.webhook.sent_count)+' alerts':'')+'</small></span>'+pill+'</button>'}).join('')}
function renderHook(){const box=$('chmHook');if(!box)return;const chat=(data?.chats||[]).find(c=>c.chat_id===sel);
 if(!chat){box.innerHTML='<p class="chm-empty">Pick a chat first.</p>';return}
 if(!chat.can_post){box.innerHTML='<p class="chm-empty">⚠️ The bot cannot post in <b>'+esc(chat.title)+'</b> yet. Open the chat settings → Administrators → DrFX bot and turn on <b>Post messages</b>. Then tap refresh ↻.</p>';return}
 if(!chat.webhook){box.innerHTML='<p class="chm-empty">One tap creates a private link for <b>'+esc(chat.title)+'</b>.</p><button type="button" class="btn primary chm-gen" data-chm-act="create">⚡ Generate my webhook</button>';return}
 const w=chat.webhook;
 box.innerHTML='<div class="chm-hookbox"><code class="chm-url'+(fresh===chat.chat_id?' fresh':'')+'" id="chmUrl">'+esc(w.url||'Rotate to show a new link')+'</code>'+
  '<div class="chm-btns"><button type="button" class="btn primary wide" data-chm-copy="chmUrl">📋 Copy webhook URL</button><button type="button" class="btn" data-chm-act="test">🧪 Send test</button><button type="button" class="btn subtle" data-chm-act="rotate">🔄 New link</button></div>'+
  '<div class="chm-meta"><span>Sent <b>'+esc(w.sent_count)+'</b></span><span>Last alert <b>'+esc(ago(w.last_used_at))+'</b></span>'+(w.last_error?'<span class="chm-danger">⚠ '+esc(w.last_error)+'</span>':'')+'</div>'+
  '<p class="meta" style="margin-top:12px">Alert message template:</p><code class="chm-code" id="chmTpl">'+esc(data.alert_template||'')+'</code>'+
  '<div class="chm-btns"><button type="button" class="btn subtle" data-chm-copy="chmTpl">Copy template</button><button type="button" class="btn subtle chm-danger" data-chm-act="delete">Delete webhook</button></div></div>';
 fresh='';}
function render(){renderChats();renderHook();steps();const st=$('chmStrategyTpl');if(st&&data)st.textContent=data.strategy_template||''}
async function load(quiet){if(busy)return;busy=true;const rf=$('chmRefresh');rf?.classList.add('spin');
 try{data=await api('/api/channels');tries=0;const ids=(data.chats||[]).map(c=>c.chat_id);if(!ids.includes(sel))sel=ids.length===1?ids[0]:(data.chats||[]).find(c=>c.webhook)?.chat_id||null;render();if(!quiet)say('')}
 catch(e){if(e.message==='UNAUTHENTICATED'&&tries++<6){setTimeout(()=>load(true),1500)}else{say(ERR[e.message]||'Could not load your chats. Try again.');const box=$('chmChats');if(box&&!data)box.innerHTML='<p class="chm-empty">'+esc(ERR[e.message]||'Unavailable right now.')+'</p>'}}
 finally{busy=false;setTimeout(()=>rf?.classList.remove('spin'),300)}}
async function act(kind,btn){if(!sel)return;const path={create:'/api/channels/webhook',rotate:'/api/channels/rotate',delete:'/api/channels/delete',test:'/api/channels/test'}[kind];
 if(kind==='rotate'&&!await ask('Create a new link? The old link stops working at once.'))return;
 if(kind==='delete'&&!await ask('Delete this webhook? TradingView alerts to it will stop.'))return;
 const label=btn?.textContent;if(btn){btn.disabled=true;btn.textContent='Working…'}
 try{await api(path,{chat_id:sel});haptic('ok');
  if(kind==='test'){say('✅ Test sent. Check your chat.');if(btn){btn.textContent='Sent ✓';setTimeout(()=>{btn.textContent=label;btn.disabled=false},1800)}await load(true);return}
  if(kind==='create'||kind==='rotate'){fresh=sel;burst(btn);say(kind==='create'?'🎉 Your webhook is ready. Copy it into TradingView.':'🔄 New link created. Update it in TradingView.')}else say('Webhook deleted.');
  await load(true)}
 catch(e){haptic('err');say(ERR[e.message]||'Something went wrong. Try again.');if(btn){btn.disabled=false;btn.textContent=label}}}
async function copy(id,btn){const el=$(id);if(!el)return;const label=btn.textContent;try{await navigator.clipboard.writeText(el.textContent);btn.textContent='Copied ✓';haptic('ok')}catch{const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r);btn.textContent='Selected, copy it'}setTimeout(()=>{btn.textContent=label},1800)}
const panel=$('panel-channels');
panel?.addEventListener('click',e=>{const c=e.target.closest('[data-chat]'),a=e.target.closest('[data-chm-act]'),cp=e.target.closest('[data-chm-copy]');
 if(c){sel=c.dataset.chat;haptic();render();setTimeout(()=>$('chmStep3')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'}),120)}
 if(a)act(a.dataset.chmAct,a);if(cp)copy(cp.dataset.chmCopy,cp)});
$('chmRefresh')?.addEventListener('click',()=>{haptic();load()});
function addLink(kind){const l=data?.add_links;if(!l){say('Loading the bot link… try again in a second.');load(true);return}haptic();openTg(l[kind]);say('After adding the bot, come back and tap refresh ↻.')}
$('chmAddChannel')?.addEventListener('click',()=>addLink('channel'));$('chmAddGroup')?.addEventListener('click',()=>addLink('group'));
let poll=null;
window.chMiniLoad=()=>{load();clearInterval(poll);poll=setInterval(()=>{if(!document.hidden)load(true)},15000)};
window.chMiniLeave=()=>{clearInterval(poll);poll=null};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&poll)load(true)});
if(new URLSearchParams(location.search).get('tab')==='channels'||location.hash==='#channels')setTimeout(()=>document.querySelector('[data-jump=channels]')?.click(),400);
})();
`;
