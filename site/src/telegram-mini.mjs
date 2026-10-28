// DrFX Telegram Mini App (real API-only account state; no mock trading metrics).
export const MINI_HTML=String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#03070c"><title>DrFX · SignalBridge Mini App</title>
<script src="https://telegram.org/js/telegram-web-app.js?64"></script>
<style>
:root{color-scheme:dark;--obsidian:#030406;--panel:#0a0d14;--panel2:#10151e;--border:rgba(255,255,255,.085);--gold:#d4af37;--gold-light:#f7e7b4;--gold-bright:#ffdf91;--emerald:#10b981;--mint:#34d399;--text:#f8fafc;--muted:#99a5b8;--ease:cubic-bezier(.19,1,.22,1)}
*{box-sizing:border-box}html{background:var(--obsidian);scroll-behavior:smooth}body{margin:0;min-height:100%;background:radial-gradient(ellipse 78% 400px at 85% 6%,rgba(212,175,55,.07),transparent 75%),radial-gradient(ellipse 100% 540px at 14% 34%,rgba(16,185,129,.035),transparent 75%),var(--obsidian);color:var(--text);font-family:system-ui,-apple-system,"Segoe UI",Arial,sans-serif;line-height:1.45;overflow-x:hidden;padding:env(safe-area-inset-top) 0 calc(90px + env(safe-area-inset-bottom))}
::selection{background:rgba(212,175,55,.28);color:#fff4cb}button,a{-webkit-tap-highlight-color:transparent}a{color:#f4d987;text-decoration:none}a:focus-visible,button:focus-visible{outline:2px solid var(--gold-light);outline-offset:3px}button{font-family:inherit;cursor:pointer}
body::before{content:"";position:fixed;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.012) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.012) 1px,transparent 1px);background-size:44px 44px;mask-image:linear-gradient(180deg,#0005,transparent 58%);z-index:0}
.container{width:min(100%,600px);margin:auto;padding:0 18px;position:relative;z-index:1}
.statusbar{margin:0 -18px;padding:11px 18px;display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid rgba(255,255,255,.055);color:#97a3b2;font:600 8px/1.3 ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.075em;background:rgba(3,4,6,.6)}
.statusbar .edge{display:inline-flex;align-items:center;gap:7px;color:#92d6b7}.dot{width:7px;height:7px;background:var(--emerald);box-shadow:0 0 12px #10b98199;border-radius:50%;flex:0 0 auto}.statusbar .topright{color:#c7a958}
.bar{padding:21px 0 8px;display:flex;justify-content:space-between;align-items:center;gap:10px}
.brand{display:flex;align-items:center;gap:10px;min-width:0}
.mark{flex:0 0 auto;position:relative;width:41px;height:41px;border-radius:12px;border:1px solid #a38742;display:grid;place-items:center;color:var(--gold-light);font:800 11px ui-monospace,SFMono-Regular,monospace;letter-spacing:-.05em;background:linear-gradient(135deg,#503d1d80,#14130e 52%,#030406);box-shadow:inset 0 1px 0 #fff2,0 0 27px #d4af3727}
.mark::after{content:"";position:absolute;bottom:-3px;right:-3px;width:8px;height:8px;border:2px solid var(--obsidian);background:var(--emerald);border-radius:50%}
.brandname{min-width:0}.brandname .name{font-weight:750;letter-spacing:.065em;font-size:14px;white-space:nowrap}.brandname .name em{font-style:normal;font-size:9px;border:1px solid #7d693d60;background:#d4af3714;padding:3px 5px;border-radius:4px;color:var(--gold-light);vertical-align:1px;letter-spacing:.09em}
.brandname small{display:block;font:500 9px ui-monospace,SFMono-Regular,monospace;letter-spacing:.14em;color:#82909e;margin-top:4px}
.chip{display:inline-flex;align-items:center;gap:6px;border:1px solid #ab8c423d;background:linear-gradient(100deg,#1b180e,#100d0a);padding:9px 11px;border-radius:7px;color:var(--gold-light);font:650 9px ui-monospace,SFMono-Regular,monospace;white-space:nowrap;max-width:148px;text-overflow:ellipsis;overflow:hidden}
.chip::before{content:"";width:6px;height:6px;border-radius:50%;background:#d2a94c;box-shadow:0 0 8px #d2a94c88}
.chip.verified{color:#a8f2cd;border-color:#1d7154;background:#061e14}.chip.verified::before{background:var(--emerald);box-shadow:0 0 10px var(--emerald)}
.hero{padding:26px 0 19px;position:relative}
.eyebrow{display:inline-flex;align-items:center;gap:9px;border:1px solid #d4af3742;border-radius:100px;padding:7px 12px;background:#d4af370b;color:var(--gold-light);font:700 9px ui-monospace,SFMono-Regular,monospace;letter-spacing:.1em}
.eyebrow::before{content:"";width:5px;height:5px;border-radius:50%;background:var(--gold);box-shadow:0 0 11px var(--gold)}
.hero h1{font:400 clamp(43px,9vw,65px)/1.02 Georgia,"Times New Roman",serif;letter-spacing:-.06em;margin:19px 0 13px}
.hero h1 em{font-style:italic;background:linear-gradient(100deg,#fff7df 8%,#f7e7b4 29%,#d4af37 57%,#f8e2a4 79%,#a77c21);background-size:210% 100%;background-clip:text;-webkit-background-clip:text;color:transparent;animation:foil 9s ease-in-out infinite}
@keyframes foil{0%,100%{background-position:0% 0}50%{background-position:100% 0}}
.desc{font-size:12px;color:#b7c0ce;line-height:1.8;max-width:450px;margin:0}
.hero-kicker{display:flex;gap:12px;margin-top:19px;color:#8192a7;font:500 9px ui-monospace,Consolas,monospace;letter-spacing:.03em;flex-wrap:wrap}
.hero-kicker span{display:inline-flex;align-items:center;gap:6px}.hero-kicker i{height:5px;width:5px;background:var(--gold);border-radius:50%;font-style:normal}
.route-stage{height:192px;margin:5px 0 17px;position:relative;border:1px solid #b596423b;border-radius:15px;overflow:hidden;isolation:isolate;background:radial-gradient(ellipse at 53% 112%,#16433b71,transparent 55%),radial-gradient(ellipse at 74% 75%,#9e7a2533,transparent 48%),linear-gradient(135deg,#0e1118,#020406 72%);box-shadow:inset 0 0 24px #d4af3708,0 16px 36px #0007}
.route-stage:before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,transparent 0 29px,#ffffff06 30px),repeating-linear-gradient(90deg,transparent 0 33px,#ffffff06 34px);mask-image:linear-gradient(to bottom,#000a,transparent);z-index:0}
.route-stage svg{width:100%;height:100%;position:absolute;inset:0;display:block;z-index:1}
.route-stage .route{stroke-dasharray:8 7;animation:routeflow 5s linear infinite}.route-stage .route.alt{animation-duration:8s;animation-direction:reverse}
@keyframes routeflow{from{stroke-dashoffset:0}to{stroke-dashoffset:-150}}
.route-stage .halo{animation:halo 3.8s ease-in-out infinite}
@keyframes halo{50%{opacity:.5;transform:scale(1.12)}}
.route-stage .caption{position:absolute;top:12px;left:15px;color:#bdc3cc;z-index:3;font:650 9px ui-monospace,Consolas,monospace;letter-spacing:.075em}
.route-stage .caption small{display:block;color:var(--gold);font-size:8px;margin-top:5px;letter-spacing:.035em}
.route-stage .demo{position:absolute;right:13px;top:13px;color:#9da6b2;font:500 8px ui-monospace,monospace;letter-spacing:.12em;z-index:3;border:1px solid #ffffff19;border-radius:4px;padding:5px 7px;background:#030406ad}
.route-stage .stages{display:grid;grid-template-columns:repeat(3,1fr);position:absolute;left:0;right:0;bottom:0;z-index:3;background:linear-gradient(180deg,transparent,#030406ed 36%,#030406f7);padding:17px 8px 12px;gap:5px;text-align:center}
.route-stage .stages span{font:650 9px ui-monospace,Consolas,monospace;letter-spacing:.055em;color:#f1d78d}.route-stage .stages b{display:block;color:#a9b6c5;font-size:7px;font-weight:500;margin-top:4px}
.message{margin:14px 0;border:1px solid #866f3f81;border-radius:10px;padding:12px 14px;background:linear-gradient(110deg,#201a0e,#0a1016);font-size:11px;color:#e2cd9e;line-height:1.7;display:flex;align-items:flex-start;gap:10px}
.message:before{content:"◈";color:var(--gold);font-size:16px;line-height:1;flex:none;margin-top:2px}
.message.error{border-color:#8d4147;color:#f8b7bf;background:#240f15}.message.error:before{color:#f8b7bf;content:"!"}
.message.success{border-color:#24674e;color:#aeebc9;background:#071b16}.message.success:before{color:var(--emerald);content:"✓"}
.message[hidden]{display:none}
.subhead{display:flex;align-items:center;justify-content:space-between;gap:7px;margin:18px 0 11px}
.subhead h2{font:500 25px Georgia,serif;letter-spacing:-.03em;margin:0}.subhead small{color:#8e99a9;font:650 9px ui-monospace,Consolas,monospace;letter-spacing:.1em}
.card{position:relative;background:linear-gradient(160deg,#10151e,#080b10 72%);border:1px solid var(--border);border-radius:13px;padding:19px;margin:13px 0;box-shadow:inset 0 1px 0 #ffffff09,0 9px 28px #0005;overflow:hidden;transition:border-color .25s}
.card:before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 95% 6%,rgba(212,175,55,.08),transparent 48%);z-index:0}
.card>*{position:relative;z-index:1}
.card.gold{border-color:#bc9b4c82;box-shadow:inset 0 1px 0 #ffffff14,0 0 31px #d4af3714,0 12px 35px #0008;background:radial-gradient(ellipse at 105% 10%,#60471842,transparent 56%),linear-gradient(145deg,#1b1a16,#0a0b0d 70%)}
.card h2{font-size:15px;letter-spacing:-.025em;font-weight:650;margin:0 0 12px}
.micro{font:700 9px ui-monospace,SFMono-Regular,Consolas,monospace;letter-spacing:.14em;color:#9b9e9e;text-transform:uppercase}
.value{font:500 clamp(26px,5.8vw,37px) Georgia,serif;letter-spacing:-.038em;margin:10px 0 0;color:#fff}
.meta{color:#acb4bf;font-size:11px;line-height:1.7}.split{display:flex;align-items:center;justify-content:space-between;gap:11px;min-width:0}
.status{font:700 9px ui-monospace,Consolas,monospace;letter-spacing:.03em;border:1px solid #8c7544;border-radius:5px;background:#46341032;color:#e8d09b;padding:7px 9px;flex:0 0 auto;white-space:nowrap}
.status[data-active=true]{color:#94eabc;border-color:#236a4a;background:#06472738}
.indicator{display:flex;align-items:center;justify-content:center;width:63px;height:63px;border-radius:15px;font:500 43px Georgia,serif;color:var(--gold-light);background:linear-gradient(140deg,#d4af3733,#d4af3707);border:1px solid #ab8a3e83;text-shadow:0 0 14px #d4af3777;box-shadow:inset 0 0 18px #d4af3720}
.goldline{height:1px;background:linear-gradient(90deg,transparent,#d4af37ae,transparent);box-shadow:0 0 13px #d4af374f;margin:17px 0}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin-top:11px}
.small{min-height:113px;background:linear-gradient(145deg,#101823,#080d14);border:1px solid var(--border);border-radius:12px;padding:15px;box-shadow:inset 0 0 22px #ffffff03;position:relative;overflow:hidden}
.small:after{content:"";position:absolute;height:30px;width:30px;right:12px;top:10px;border:1px solid #d4af3733;border-radius:50%;box-shadow:0 0 10px #d4af371a}
.small>span:first-child{display:block;color:#bba46f;font:650 9px ui-monospace,Consolas,monospace;letter-spacing:.055em}
.small strong{display:block;font-size:15px;font-weight:650;margin:18px 0 4px;line-height:1.12;word-break:break-word}
.small span:not(:first-child){color:#8796a8;font-size:10px;line-height:1.6;overflow-wrap:anywhere}
.code{font:600 12px/1.85 ui-monospace,SFMono-Regular,Consolas,monospace;word-break:break-all;overflow-wrap:anywhere;letter-spacing:.04em;background:#030406;border:1px dashed #907a47;border-radius:8px;color:#fce5a8;padding:12px;margin:14px 0}
.btn{min-height:46px;border:1px solid #79704f;border-radius:8px;background:linear-gradient(#1b1a18,#0c1016);padding:12px 15px;color:#efe0c3;font:750 11px ui-monospace,Consolas,monospace;letter-spacing:.025em;transition:transform .2s,border-color .2s,box-shadow .2s;white-space:normal}
.btn:hover{border-color:var(--gold)}.btn:active{transform:scale(.98)}.btn.primary{background:linear-gradient(115deg,#ca9d31,#ffe9ac 55%,#ac8128);color:#161106;border-color:#fce0a0;box-shadow:0 3px 20px #d4af3731}
.btn.subtle{border-color:#34404d;color:#bec9d7;background:#10151d}
.btn:disabled{opacity:.48;cursor:not-allowed;box-shadow:none}
.buttons{display:flex;gap:9px;flex-wrap:wrap;margin-top:15px}.buttons .btn{flex:1 1 110px}
.plan{display:flex;gap:12px;align-items:center;justify-content:space-between;margin:0;padding:17px 0;border-bottom:1px solid #ffffff12}.plan:last-of-type{border-bottom:0}
.plan b{font-size:15px;font-weight:650}.plan small{display:block;color:#a3acb8;font-size:10px;margin-top:5px;line-height:1.5}.plan-price{color:var(--gold-light);font:500 28px Georgia,serif;letter-spacing:-.06em;white-space:nowrap}
.plan.featured{border:1px solid #d4af375f;background:linear-gradient(110deg,#3e301b73,#14130fa3);margin:12px -9px 0;padding:15px 10px;border-radius:8px}.plan.featured .plan-price{color:#fff0cb}
.tab-panel[hidden]{display:none}.section-title{font:500 29px Georgia,serif;letter-spacing:-.04em;margin:24px 0 17px}
.list{padding:0;list-style:none;color:#c0c9d5;font-size:12px;line-height:1.65;counter-reset:steps}.list li{position:relative;counter-increment:steps;padding:12px 0 13px 39px;border-bottom:1px solid #ffffff13}.list li:before{content:counter(steps,decimal-leading-zero);position:absolute;left:0;top:12px;color:var(--gold);font:700 12px ui-monospace,Consolas,monospace}.list li:last-child{border-bottom:0}
.inline-tag{display:inline-flex;color:#a8e3c8;border:1px solid #26775b;background:#061e15;border-radius:5px;padding:6px 9px;font:650 9px ui-monospace,monospace}
.tab-kicker{font:700 9px ui-monospace,Consolas,monospace;letter-spacing:.14em;color:var(--gold);margin:20px 0 4px}
nav.bottom{position:fixed;z-index:20;bottom:0;left:0;right:0;padding:9px 14px calc(11px + env(safe-area-inset-bottom));background:rgba(3,4,6,.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid #bda05b50;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;box-shadow:0 -10px 35px #0008}
nav.bottom button{position:relative;padding:9px 3px 8px;border:1px solid transparent;border-radius:9px;color:#93a0b2;background:transparent;font:650 10px ui-monospace,Consolas,monospace;letter-spacing:.01em;transition:background .2s,color .2s}
nav.bottom button span{display:block;font-size:20px;line-height:23px;margin-bottom:5px;font-family:system-ui}
nav.bottom button[aria-selected=true]{background:linear-gradient(150deg,#3e2d1266,#12110d);border-color:#d4af373c;color:var(--gold-light)}
nav.bottom button[aria-selected=true]:before{content:"";position:absolute;top:-10px;left:28%;right:28%;height:2px;background:var(--gold);box-shadow:0 0 11px var(--gold)}
.page-footer{text-align:center;color:#677788;font:500 9px/1.8 ui-monospace,Consolas,monospace;letter-spacing:.035em;padding:18px 8px 5px}
@media(min-width:700px){.container{padding:0 26px}.statusbar{margin:0 -26px;padding-inline:26px}nav.bottom{max-width:600px;left:50%;transform:translateX(-50%);border-inline:1px solid #bda05b3b;border-radius:13px 13px 0 0}.route-stage{height:226px}}
@media(max-width:370px){.container{padding:0 14px}.statusbar{margin:0 -14px;padding-inline:14px}.hero h1{font-size:40px}.chip{font-size:8px;padding:8px}.brandname .name{font-size:12px}.brandname small{font-size:8px}.card{padding:16px}.small{padding:12px}.plan b{font-size:13px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}html{scroll-behavior:auto}}
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
