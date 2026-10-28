// DrFX Telegram Mini App (real API-only account state; no mock trading metrics).
export const MINI_HTML=String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#03070c"><title>DrFX · SignalBridge Mini App</title>
<script src="https://telegram.org/js/telegram-web-app.js?64"></script>
<style>
:root{color-scheme:dark;--bg:#03070c;--panel:#0c1724;--edge:#27405c;--gold:#ecc16a;--text:#f7f9fd;--muted:#9cafc5;--green:#54dca9;--cyan:#66c7f7}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,'Segoe UI',sans-serif}
body{background:radial-gradient(ellipse at 70% -12%,#14426a 0,#03070c 54%);padding:env(safe-area-inset-top) 0 calc(86px + env(safe-area-inset-bottom))}
body:before{content:"";pointer-events:none;position:fixed;inset:0;background:linear-gradient(150deg,transparent 45%,#27587a0a);z-index:-1}
.container{max-width:600px;margin:auto;padding:0 18px}
.bar{padding-top:22px;display:flex;justify-content:space-between;align-items:center}
.brand{display:flex;align-items:center;gap:10px;font-family:Georgia,serif;font-size:22px;font-weight:700}.mark{width:38px;height:38px;border-radius:10px;border:1px solid #cfa458;display:grid;place-items:center;color:var(--gold);font-family:system-ui;font-size:22px;background:#19190f}
.brand small{display:block;color:var(--muted);font-family:system-ui;font-size:8px;letter-spacing:.19em;margin-top:4px;font-weight:500}.chip{border:1px solid #1f6855;color:var(--green);border-radius:99px;padding:7px 10px;font-size:10px;background:#0d2523;white-space:nowrap}
.eyebrow{font-size:10px;letter-spacing:.22em;color:var(--gold);font-weight:800}
.hero{padding:38px 0 22px}.hero h1{font:700 38px/1.04 Georgia,serif;letter-spacing:-.05em;margin:15px 0 13px}.hero em{font-style:normal;color:var(--gold)}.desc{color:var(--muted);font-size:12px;line-height:1.8;max-width:430px}
.message{margin:16px 0;border:1px solid #355571;border-radius:12px;padding:13px 14px;background:#101d2b;font-size:12px;color:#c5d8e9;line-height:1.6}.message.error{border-color:#9d484b;color:#f9c5ca}.message.success{border-color:#26775e;color:#bffae5}.message[hidden]{display:none}
.card{position:relative;background:linear-gradient(145deg,#0e2132,#070e1b);border:1px solid #1d5c8a;border-radius:17px;padding:21px;margin:15px 0;box-shadow:inset 0 1px 0 #ffffff0b;overflow:hidden}
.card.gold{border-color:#b78a42;box-shadow:inset 0 1px 0 #ffffff0b,0 0 18px #d6b0641c}
.card:before{content:"";position:absolute;right:-70px;top:-70px;width:180px;height:180px;background:radial-gradient(circle,#1972b744,transparent 69%);pointer-events:none}
.card h2{font-size:15px;margin:0 0 13px;letter-spacing:-.025em}.micro{font-size:9px;color:var(--muted);letter-spacing:.11em;text-transform:uppercase}.value{font:700 25px/1.2 system-ui,sans-serif;margin:8px 0}.meta{color:var(--muted);font-size:11px;line-height:1.7}.split{display:flex;justify-content:space-between;align-items:center;gap:12px}.status{font-size:10px;color:#a9ddc5;white-space:nowrap;border:1px solid #236a53;padding:6px 9px;border-radius:50px}
.indicator{color:var(--gold);font:700 32px Georgia,serif}.goldline{height:1px;background:linear-gradient(90deg,transparent,#d5ad5a,transparent);margin:18px 0}
.btn{border:1px solid #4185af;border-radius:10px;background:#102c45;color:#f4fbff;font-size:12px;font-weight:800;padding:13px 16px;cursor:pointer;min-height:43px;transition:filter .18s}.btn:active{filter:brightness(1.3)}.btn.primary{background:linear-gradient(#ffdfa0,#d9aa57);border-color:#f1d186;color:#171108}.btn.subtle{border-color:#325a7c;background:#0b1a2b}.btn:disabled{opacity:.5;cursor:not-allowed}.buttons{display:flex;gap:9px;flex-wrap:wrap;margin-top:16px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px}.small{min-height:106px;background:linear-gradient(140deg,#0a1e32,#060d1a);border:1px solid #244d70;border-radius:13px;padding:15px}
.small strong{display:block;font-size:17px;margin:10px 0 4px}.small span{font-size:10px;color:var(--muted)}
.code{font:600 13px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace;word-break:break-all;overflow-wrap:anywhere;background:#030d19;border:1px dashed #456d92;color:#fce4af;border-radius:9px;padding:12px;margin:12px 0}
.plan{display:flex;gap:12px;align-items:center;justify-content:space-between;margin:12px 0;padding-bottom:12px;border-bottom:1px solid #203953}.plan b{font-size:15px}.plan small{display:block;color:var(--muted);font-size:10px;line-height:1.5}.plan-price{font-weight:900;font-size:21px;color:var(--gold)}
.tab-panel[hidden]{display:none}.section-title{font-size:21px;font-family:Georgia,serif;margin:4px 0 17px}.list{padding:0;list-style:none;color:#c2d2e3;font-size:12px;line-height:1.8}.list li{padding:10px 0;border-bottom:1px solid #1e354c}.list li:before{content:"✦";color:var(--gold);margin-right:9px}
nav.bottom{position:fixed;z-index:20;bottom:0;left:0;right:0;padding:8px 14px calc(9px + env(safe-area-inset-bottom));background:#060f1bf2;backdrop-filter:blur(18px);border-top:1px solid #1c4b74;display:grid;grid-template-columns:repeat(4,1fr)}
nav.bottom button{padding:8px 3px;border:0;border-radius:9px;background:none;color:#93a8c0;font-size:10px;cursor:pointer}nav.bottom button span{display:block;font-size:20px;margin-bottom:3px}nav.bottom button[aria-selected=true]{color:var(--gold);background:#242119}
.page-footer{font-size:10px;color:#6e8ba6;text-align:center;padding-top:18px}
a{color:#c4e9ff}a:focus-visible,button:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
</style><script src="/assets/telegram-mini.js?v=20261028" defer></script></head>
<body><main class="container">
<header class="bar"><div class="brand"><span class="mark">⟐</span><span>DrFX <span style="color:var(--gold)">Company</span><small>SIGNALBRIDGE · TELEGRAM</small></span></div><span id="connection" class="chip">SECURE SIGN-IN</span></header>
<section class="hero"><span class="eyebrow">YOUR PRIVATE TRADING WORKSPACE</span><h1>One account.<br><em>Every connection.</em></h1><p class="desc">Connect your SignalBridge membership, private EA activation and account status in a secure Telegram Mini App.</p></section>
<p class="message" id="statusMessage" role="status" aria-live="polite">Checking Telegram sign-in…</p>
<section class="tab-panel" id="panel-home" data-panel="home">
 <div class="card gold"><div class="split"><div><span class="micro">YOUR MEMBERSHIP</span><div class="value" id="memberPlan">Not signed in</div></div><span class="indicator">♛</span></div><div class="goldline"></div><div class="split"><span class="meta" id="memberIdentity">Open this app from your verified DrFX bot</span><span id="licenseBadge" class="status">LOCKED</span></div></div>
 <div class="grid"><div class="small"><span>MT5 LICENSE</span><strong id="mt5Status">Not connected</strong><span id="mt5Server">Binding not yet verified</span></div><div class="small"><span>EA ACTIVATION</span><strong id="activationDate">Not started</strong><span id="expiryStatus">Validity begins on first activation</span></div></div>
 <div class="card"><h2>Your private EA serial</h2><p class="meta">The code is hidden by default. Never share it or publish screenshots containing it.</p><div id="serialValue" class="code">•••• •••• •••• ••••</div><div class="buttons"><button class="btn primary" id="revealSerial" disabled>Reveal serial</button><button class="btn" id="copySerial" disabled>Copy code</button></div></div>
</section>
<section class="tab-panel" id="panel-license" data-panel="license" hidden><h2 class="section-title">MT5 Activation</h2><div class="card"><span class="micro">SIGNALBRIDGE / MT5</span><h2 style="margin-top:10px">Activate your EA</h2><ol class="list"><li>Install the DrFX EA on MetaTrader 5 using an authorized EX5 release.</li><li>Allow https://signalbridge.drfx.online in Expert Advisors.</li><li>Enter your private code as the first EA input.</li><li>Check the Experts tab for the validated license status.</li></ol><p class="meta">DEMO account testing only. Live-money execution is disabled until separately certified.</p></div></section>
<section class="tab-panel" id="panel-plans" data-panel="plans" hidden><h2 class="section-title">Membership Plans</h2><div class="card">
 <div class="plan"><div><b>One Month Free</b><small>Trial membership, private EA code</small></div><div class="plan-price">$0</div></div>
 <div class="plan"><div><b>3 Months Premium</b><small>SignalBridge and 52 premium indicators*</small></div><div class="plan-price">$47</div></div>
 <div class="plan"><div><b>Annual Elite</b><small>All features, personalized options*</small></div><div class="plan-price">$165</div></div>
 <p id="paymentStatus" class="meta">Paid checkout is not configured yet.</p><button id="openPricing" class="btn primary">Open membership website</button>
 <p class="meta">* Premium assets require independent release and authorization. No payment is collected inside this preview.</p>
 </div></section>
<section class="tab-panel" id="panel-help" data-panel="help" hidden><h2 class="section-title">Support and Security</h2><div class="card"><h2>Account safety</h2><ul class="list"><li>Telegram Mini App identity is verified by the server.</li><li>Existing email accounts are not merged without explicit linking.</li><li>Private activation codes never appear in URLs or logs.</li><li>Sign in to the main website if you need email verification or account management.</li></ul><div class="buttons"><button id="openWebsite" class="btn primary">Open DrFX Company</button><button id="refreshAccount" class="btn">Refresh status</button></div></div></section>
<footer class="page-footer">DrFXAi © 2026 · Illustrative UI only; no simulated trades or balances are represented as live.</footer></main>
<nav class="bottom" aria-label="Telegram app navigation"><button data-tab="home" aria-selected="true"><span>⌂</span>Overview</button><button data-tab="license" aria-selected="false"><span>▣</span>MT5 EA</button><button data-tab="plans" aria-selected="false"><span>♛</span>Plans</button><button data-tab="help" aria-selected="false"><span>⚙</span>Help</button></nav>
</body></html>`;
export const MINI_JS=String.raw`(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const tg = window.Telegram?.WebApp || null;
 const state = {user:null, serialVisible:false,telegramEnabled:false};
 const set = (id,text) => {const el=$(id);if(el)el.textContent=String(text??'');};
 function message(text,kind='') {const e=$('statusMessage');e.textContent=text;e.className='message '+kind;}
 function show(tab){
  document.querySelectorAll('[data-panel]').forEach(e=>e.hidden=e.dataset.panel!==tab);
  document.querySelectorAll('[data-tab]').forEach(e=>e.setAttribute('aria-selected',String(e.dataset.tab===tab)));
  tg?.HapticFeedback?.selectionChanged?.();
 }
 document.querySelectorAll('[data-tab]').forEach(e=>e.addEventListener('click',()=>show(e.dataset.tab)));
 function navigate(url){try{if(tg?.openLink)tg.openLink(url);else window.location.assign(url);}catch{window.location.assign(url);}}
 $('openWebsite').addEventListener('click',()=>navigate('https://drfx.company'));
 $('openPricing').addEventListener('click',()=>navigate('https://drfx.company/#plans'));
 async function api(path,body){
  const options={credentials:'same-origin',headers:{accept:'application/json'}};
  if(body!==undefined){options.method='POST';options.headers['content-type']='application/json';options.body=JSON.stringify(body);}
  const resp=await fetch(path,options);
  let data;try{data=await resp.json();}catch{throw Error('INVALID_SERVER_RESPONSE');}
  if(!resp.ok)throw Error(data.error||'SERVICE_UNAVAILABLE');return data;
 }
 function applyUser(user){
  state.user=user;
  state.serialVisible=false;
  set('memberPlan',({trial:'1 Month Free',quarterly:'3 Months Premium',annual:'Annual Elite'})[user.plan]||'Membership');
  set('memberIdentity',user.email||user.telegram||'Telegram account');
  set('licenseBadge',user.license_status==='active'?'ACTIVE':'INACTIVE');
  set('mt5Status',user.mt5_account?'Linked':'Not linked');
  set('mt5Server',user.mt5_account?('Account '+user.mt5_account.login+' · '+user.mt5_account.server):'Waiting for first verified EA connection');
  set('activationDate',user.activated_at?'Activated':'Not started');
  set('expiryStatus',user.expires_at?('Expires '+user.expires_at):'Starts at first verified activation');
  set('serialValue','•••• •••• •••• ••••');
  $('revealSerial').disabled=!user.activation_code;
  $('copySerial').disabled=!user.activation_code;
  $('revealSerial').textContent='Reveal serial';
 }
 async function refresh(){
  try{
   const {user}=await api('/api/me');
   applyUser(user);
   set('connection','IDENTITY VERIFIED');
   message('Your Telegram account is verified and the membership status is loaded.','success');
  }catch(error){message(error.message==='UNAUTHENTICATED'?'Sign in from your DrFX bot to access the private dashboard.':'Account service unavailable: '+error.message,'error');}
 }
 $('refreshAccount').addEventListener('click',refresh);
 $('revealSerial').addEventListener('click',()=>{
  if(!state.user?.activation_code)return;
  state.serialVisible=!state.serialVisible;
  set('serialValue',state.serialVisible?state.user.activation_code:'•••• •••• •••• ••••');
  $('revealSerial').textContent=state.serialVisible?'Hide serial':'Reveal serial';
  tg?.HapticFeedback?.impactOccurred?.('light');
 });
 $('copySerial').addEventListener('click',async()=>{
  if(!state.user?.activation_code)return;
  try{await navigator.clipboard.writeText(state.user.activation_code);message('Private EA code copied. Keep it confidential.','success');}
  catch{message('Clipboard not accessible. Reveal the serial and copy manually.','error');}
 });
 async function start(){
  try{tg?.ready?.();tg?.expand?.();tg?.setHeaderColor?.('#03070c');tg?.setBackgroundColor?.('#03070c');}catch{}
  let config;try{config=await api('/api/config');}
  catch{message('Cannot contact DrFX services. Check network access and retry.','error');return;}
  state.telegramEnabled=!!config.telegram;
  set('paymentStatus',config.payments?'Payment provider is configured on the website. Open the pricing page to check availability.':'Paid memberships are not accepting payments yet.');
  if(!config.telegram){message('Telegram bot connection is not configured yet. The interface is available for preview, but login is disabled.','error');return;}
  if(!tg?.initData){message('Open this Mini App from the official DrFX Telegram bot. Web browser preview cannot authenticate.','error');return;}
  try{
   await api('/api/auth/telegram/webapp',{init_data:tg.initData});
   await refresh();
  }catch(error){message(error.message==='INVALID_TELEGRAM_INIT_DATA'?'Telegram identity could not be verified. Reopen this Mini App from the bot.':'Telegram sign-in unavailable: '+error.message,'error');}
 }
 start();
})();`;
