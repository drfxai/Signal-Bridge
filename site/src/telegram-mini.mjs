// DrFX Telegram Mini App: mobile-first full-width UI, authenticated account state.
export const MINI_HTML=String.raw`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"><meta name="theme-color" content="#050609"><title>DrFX · SignalBridge Mini App</title>
<script src="https://telegram.org/js/telegram-web-app.js?64"></script>
<style>
:root{color-scheme:dark;--obsidian:#030406;--gold:#d4af37;--gold-light:#f7e7b4;--emerald:#10b981;--mint:#38db9e;--white:#f8f8fa;--muted:#a6a9b4;--ink:#08090d;--border:#32313a;--surface:#101116;--surface-2:#17181e;--easing:cubic-bezier(.22,1,.36,1)}
*,*::before,*::after{box-sizing:border-box}html{width:100%;min-height:100%;background:#050609;scroll-behavior:smooth;-webkit-text-size-adjust:100%}body{width:100%;min-width:0;min-height:100dvh;margin:0;background:radial-gradient(ellipse 90% 310px at 54% 0%,#43351d50,transparent 80%),linear-gradient(#090a0f,#050609 55%);color:var(--white);font:400 15px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;overflow-x:hidden;padding:env(safe-area-inset-top) 0 calc(100px + env(safe-area-inset-bottom));-webkit-tap-highlight-color:transparent}
button{font:inherit;cursor:pointer}button:focus-visible,a:focus-visible{outline:2px solid var(--gold-light);outline-offset:3px}a{color:var(--gold-light)}[hidden]{display:none!important}::selection{background:#edc66a50;color:#fff}
.container{position:relative;margin:0 auto;max-width:680px;width:100%;padding:0 16px}
.brand-bar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:18px 0 16px;border-bottom:1px solid #ffffff12}
.brand{display:flex;align-items:center;gap:10px;min-width:0}.mark{display:grid;place-items:center;flex:none;width:40px;height:40px;border-radius:11px;border:1px solid #bc9c5f;background:linear-gradient(140deg,#423522,#141316 70%);box-shadow:inset 0 1px #fff2,0 0 15px #cb9c4423;color:#f5d592;font-size:15px;font-weight:900;letter-spacing:-.1em}.brandname{min-width:0}.brandname .name{display:block;font-weight:800;letter-spacing:.01em;font-size:16px;line-height:1.1;white-space:nowrap}.brandname .name em{color:var(--gold-light);font-style:normal}.brandname small{display:block;color:#b0a88f;font-size:10px;font-weight:700;letter-spacing:.1em;margin-top:5px}
.header-actions{display:flex;align-items:center;gap:8px}.lang-toggle{height:36px;min-width:46px;border:1px solid #716044;border-radius:9px;background:#15130f;color:#f6dea4;font-size:11px;font-weight:800}.chip{display:flex;align-items:center;gap:6px;max-width:122px;border-radius:9px;background:#1b1913;border:1px solid #8b744550;color:#d8c18b;padding:8px 9px;font-size:10px;font-weight:800;line-height:1.1;letter-spacing:.01em;text-align:center}.chip::before{content:"";width:6px;height:6px;flex:none;border-radius:50%;background:#dbac50;box-shadow:0 0 8px #dbac50}.chip.verified{background:#10251e;border-color:#296c4f;color:#97edc4}.chip.verified::before{background:#4bebac;box-shadow:0 0 7px #4bebac}
.hero{padding:23px 1px 16px}.eyebrow{display:flex;align-items:center;gap:8px;color:#e5bd6c;font-size:11px;font-weight:800;letter-spacing:.09em}.eyebrow::before{content:"";height:7px;width:7px;border-radius:2px;transform:rotate(45deg);background:#edc96e;box-shadow:0 0 8px #edc96e90}
.hero h1{font:800 clamp(29px,8.5vw,42px)/1.1 -apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif;letter-spacing:-.045em;margin:11px 0 10px}.hero h1 em{font-style:normal;color:#ebc77d}.desc{margin:0;color:#c2c1c8;font-size:14px;line-height:1.6;max-width:560px}
.hero-kicker{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:14px}.hero-kicker span{border:1px solid #ffffff1a;background:#ffffff09;border-radius:6px;padding:5px 8px;font-size:10px;color:#bab6ad;font-weight:700}.hero-kicker i{display:inline-block;margin-right:5px;background:#43daa1;width:6px;height:6px;border-radius:50%}
.route-stage{position:relative;isolation:isolate;overflow:hidden;margin:3px 0 13px;min-height:104px;border:1px solid #b6975255;border-radius:14px;background:radial-gradient(ellipse at 52% 60%,#66502c36,transparent 59%),linear-gradient(120deg,#171820,#0c1116 55%,#151710);box-shadow:inset 0 0 30px #f0c76d06}
.route-head{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:12px 13px 4px}.route-head strong{font-size:12px;letter-spacing:.04em}.route-head small{font-size:9px;font-weight:700;color:#b9a47c}
.route-steps{display:grid;grid-template-columns:1fr 30px 1fr 30px 1fr;align-items:center;gap:2px;padding:12px 9px 14px;text-align:center}.route-node{display:grid;place-items:center;gap:4px;min-width:0}.route-node svg{height:22px;width:22px;stroke:#f1d48f;stroke-width:1.7;fill:none}.route-node:nth-of-type(3) svg{stroke:#6cedb2}.route-node b{font-size:11px;line-height:1.1}.route-node small{font-size:9px;color:#a9a8ac}.route-line{height:1px;position:relative;background:linear-gradient(90deg,#8e815c,#d4af37,#4fc897)}.route-line:after{content:"";height:5px;width:5px;position:absolute;top:-2px;left:0;background:#f4d281;box-shadow:0 0 9px #f4d281;border-radius:50%;animation:routePulse 3s linear infinite}.route-line:nth-of-type(4):after{animation-delay:-1.4s}
@keyframes routePulse{to{left:100%}}
.message{display:flex;align-items:flex-start;gap:10px;margin:12px 0 17px;padding:12px;border:1px solid #785c354d;border-radius:11px;background:#272014b3;color:#f3d6a2;font-size:12px;line-height:1.5;overflow-wrap:anywhere}.message:before{content:"i";display:grid;place-items:center;flex:none;width:18px;height:18px;background:#ae863c44;border-radius:50%;color:#f7d490;font-size:12px;font-weight:900}.message.error{border-color:#a34b547a;background:#2a141b;color:#ffc0c4}.message.error:before{content:"!";background:#9b414f55;color:#f5b7bd}.message.success{border-color:#3a986c55;background:#0f2922;color:#c2f8d9}.message.success:before{content:"✓";background:#1a785a;color:#baf7d4}
.section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:22px 0 12px}.section-head h2{margin:0;font-size:22px;font-weight:800;letter-spacing:-.04em}.section-head small{font-size:11px;color:#b7a983;font-weight:700}.card{position:relative;overflow:hidden;padding:18px;border:1px solid #35343c;border-radius:15px;background:linear-gradient(155deg,#191a20,#111218 80%);box-shadow:inset 0 1px #ffffff08,0 7px 20px #0004;margin:12px 0}.card.gold{border-color:#c9a45675;background:radial-gradient(ellipse at 88% 10%,#78602d49,transparent 51%),linear-gradient(145deg,#231f19,#121316 70%);box-shadow:0 7px 25px #0005,inset 0 1px #e1c7851a}.card h2{font-size:16px;font-weight:800;letter-spacing:-.018em;margin:0 0 8px}.card p{margin:9px 0 0}.micro{color:#b7ae99;font-size:11px;font-weight:750;letter-spacing:.045em;text-transform:uppercase}.value{font-size:25px;line-height:1.1;font-weight:850;letter-spacing:-.04em;margin:9px 0 0;color:#fff}.split{display:flex;align-items:center;justify-content:space-between;gap:14px;min-width:0}.split>div{min-width:0}.indicator{width:48px;height:48px;flex:none;border:1px solid #c4a04a80;background:#d4af371c;display:grid;place-items:center;border-radius:14px;color:#fce4a5;font-size:26px}.status{display:flex;align-items:center;gap:5px;background:#3a302025;border:1px solid #977a4b;border-radius:6px;color:#efd19b;font-size:10px;font-weight:850;padding:6px 8px;white-space:nowrap}.status[data-active=true]{background:#0e3325;border-color:#228859;color:#7aefaf}.meta{color:#adb2bf;font-size:13px;line-height:1.55;overflow-wrap:anywhere}.goldline{height:1px;background:linear-gradient(90deg,#ad854500,#d4af3788,#ad854500);margin:16px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.small{min-width:0;min-height:116px;padding:15px 13px;background:#121920;border:1px solid #293947;border-radius:13px}.small>span:first-child{color:#b7c2ce;font-size:10px;line-height:1.2;font-weight:800;letter-spacing:.03em}.small strong{display:block;margin:15px 0 3px;font-size:15px;font-weight:800;line-height:1.25}.small span:not(:first-child){display:block;font-size:11px;color:#a5b0bc;line-height:1.35;overflow-wrap:anywhere}
.code{font:650 14px/1.55 ui-monospace,"SFMono-Regular",Consolas,monospace;overflow-wrap:anywhere;word-break:break-all;padding:13px;margin:12px 0 0;background:#08090d;border:1px dashed #bd95529c;color:#f9e6b6;border-radius:10px;letter-spacing:.03em;min-height:50px}
.btn{border:1px solid #686373;background:#23242b;color:#f0f0f4;min-height:45px;border-radius:10px;padding:11px 12px;font-size:13px;font-weight:750;line-height:1.3;transition:transform .15s,background .15s}.btn.primary{background:linear-gradient(115deg,#e0b663,#f5dd9e,#c99a40);border-color:#f6daa0;color:#21180c;box-shadow:0 3px 12px #d9a44818}.btn.subtle{background:#15171d;border-color:#353944;color:#d7d6db}.btn:active{transform:scale(.97)}.btn:disabled{cursor:not-allowed;opacity:.42;box-shadow:none}.buttons{display:flex;gap:9px;flex-wrap:wrap;margin:14px 0 0}.buttons .btn{flex:1 1 135px}.action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.action-grid .btn{min-height:55px;text-align:left}
.tab-panel[hidden]{display:none}.tab-panel{padding-bottom:6px}.section-title{margin:23px 0 13px;font-size:28px;font-weight:800;letter-spacing:-.045em}.section-title span{color:var(--gold-light)}.tab-kicker{color:#e4be77;font-size:11px;font-weight:800;letter-spacing:.08em;margin:22px 0 6px}.list{padding:0;margin:6px 0 14px;list-style:none;counter-reset:step}.list li{counter-increment:step;position:relative;padding:13px 0 13px 34px;border-bottom:1px solid #ffffff18;color:#c4c7d0;font-size:13px;line-height:1.55}.list li:before{content:counter(step,decimal-leading-zero);position:absolute;top:14px;left:0;color:#efcb7e;font-size:11px;font-weight:900}.inline-tag{display:inline-flex;align-items:center;background:#10261b;border:1px solid #28744c;color:#9eebbf;font-size:10px;font-weight:800;padding:7px 9px;border-radius:7px}.plan{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 0;border-bottom:1px solid #ffffff18}.plan b{font-size:15px}.plan small{display:block;font-size:12px;line-height:1.45;margin-top:4px;color:#abaeb8}.plan-price{font-size:24px;line-height:1;font-weight:900;color:#f0c777;white-space:nowrap}.plan.featured{margin:10px -9px 0;padding:13px 9px;background:#47351d55;border:1px solid #98754467;border-radius:10px}.plan.featured+.plan{border-top:0}
.page-footer{font-size:11px;color:#777e8d;text-align:center;line-height:1.65;padding:19px 9px 10px}
nav.bottom{position:fixed;left:0;right:0;bottom:0;width:100%;z-index:50;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:9px max(9px,env(safe-area-inset-left)) calc(9px + env(safe-area-inset-bottom)) max(9px,env(safe-area-inset-right));background:#0d0e13f7;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-top:1px solid #65533390;box-shadow:0 -8px 24px #0007}
nav.bottom button{border:1px solid transparent;min-width:0;background:transparent;border-radius:10px;color:#b0adb6;padding:8px 3px;display:grid;place-items:center;gap:3px;min-height:58px;font-size:11px;font-weight:750}nav.bottom button svg{display:block;width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:1.8}nav.bottom button[aria-selected=true]{background:#b18a3840;color:#f4d38e;border-color:#bb984d60}nav.bottom button:active{background:#ffffff12}
body[data-tab=license] .hero,body[data-tab=license] .route-stage,body[data-tab=plans] .hero,body[data-tab=plans] .route-stage,body[data-tab=help] .hero,body[data-tab=help] .route-stage{display:none}
body[data-tab=license] #statusMessage,body[data-tab=plans] #statusMessage,body[data-tab=help] #statusMessage{margin-top:15px}
html[dir=rtl] .container{text-align:right}html[dir=rtl] .bar,html[dir=rtl] .route-steps,html[dir=rtl] nav.bottom,html[dir=rtl] .brand-bar{direction:ltr}html[dir=rtl] .brandname{text-align:left}html[dir=rtl] .list li{padding:13px 34px 13px 0}html[dir=rtl] .list li:before{right:0;left:auto}html[dir=rtl] .action-grid .btn{text-align:right}
@media(max-width:360px){.container{padding:0 12px}.brandname .name{font-size:14px}.chip{font-size:9px;padding:7px}.hero h1{font-size:29px}.card{padding:15px}.grid{gap:8px}.small{padding:12px 11px}.micro{font-size:10px}.action-grid{grid-template-columns:1fr}.route-head{padding:11px 11px 4px}}
@media(min-width:681px){nav.bottom{padding-inline:max(16px,calc((100% - 660px)/2))}.container{padding-inline:22px}.hero{padding-top:33px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
</style>
<script src="/assets/telegram-mini.js?v=20261028-mobile-v2" defer></script></head>
<body data-tab="home"><main class="container">
<header class="brand-bar">
 <div class="brand"><div class="mark" aria-hidden="true">DFX</div><div class="brandname"><span class="name">DrFX <em>Company</em></span><small>SignalBridge · Private access</small></div></div>
 <div class="header-actions"><button id="langToggle" class="lang-toggle" type="button" aria-label="Change language" aria-pressed="false">FA</button><span id="connection" class="chip">Checking</span></div>
</header>
<section class="hero">
 <span class="eyebrow" data-tr="eyebrow">YOUR TRADING WORKSPACE</span>
 <h1><span data-tr="hero1">Trade smarter.</span><br><em data-tr="hero2">Stay connected.</em></h1>
 <p class="desc" data-tr="desc">Your membership, MT5 Expert Advisor and private activation key — together in one secure dashboard.</p>
 <div class="hero-kicker"><span><i></i> Private license</span><span>Telegram verified sign-in</span></div>
</section>
<div class="route-stage" aria-label="Illustrative route from alerts through SignalBridge to MetaTrader 5">
 <div class="route-head"><strong>SignalBridge</strong><small>CONNECTION FLOW · ILLUSTRATION</small></div>
 <div class="route-steps">
  <div class="route-node"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="15" rx="3"/><path d="M7 16l3-4 3 2 4-6"/></svg><b>Alerts</b><small>TradingView / TG</small></div>
  <div class="route-line"></div>
  <div class="route-node"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="5"/><path d="M8 12h8M12 8v8"/></svg><b>Bridge</b><small>Cloudflare</small></div>
  <div class="route-line"></div>
  <div class="route-node"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="17" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg><b>MT5 EA</b><small>Execution</small></div>
 </div>
</div>
<p class="message" id="statusMessage" role="status" aria-live="polite">Checking your Telegram identity…</p>
<section class="tab-panel" data-panel="home" id="panel-home">
 <div class="section-head"><h2 data-tr="command">Your dashboard</h2><small>PRIVATE ACCOUNT</small></div>
 <article class="card gold">
  <div class="split"><div><div class="micro">CURRENT MEMBERSHIP</div><div id="memberPlan" class="value">Not signed in</div></div><span class="indicator" aria-hidden="true">♛</span></div>
  <div class="goldline"></div><div class="split"><span id="memberIdentity" class="meta">Sign in from the official Telegram bot</span><span id="licenseBadge" class="status" data-active="false">LOCKED</span></div>
 </article>
 <div class="grid">
  <article class="small"><span>MT5 CONNECTION</span><strong id="mt5Status">Not connected</strong><span id="mt5Server">Account not yet verified</span></article>
  <article class="small"><span>EA ACTIVATION</span><strong id="activationDate">Not started</strong><span id="expiryStatus">Valid after activation</span></article>
 </div>
 <article class="card">
  <div class="split"><h2 data-tr="privateKey">Your activation key</h2><span class="micro">SECURE</span></div>
  <p class="meta">Your unique EA code is hidden until you choose to reveal or copy it. Never share it in screenshots.</p>
  <div class="code" id="serialValue" aria-live="polite">•••• •••• •••• ••••</div>
  <div class="buttons"><button type="button" id="revealSerial" class="btn primary" data-tr="reveal" disabled>Reveal code</button><button type="button" id="copySerial" class="btn" data-tr="copy" disabled>Copy code</button></div>
 </article>
 <div class="action-grid"><button type="button" class="btn subtle" data-jump="license" data-tr="guide">MT5 setup guide ↗</button><button type="button" class="btn subtle" data-jump="plans" data-tr="explore">Explore plans ↗</button></div>
</section>
<section class="tab-panel" data-panel="license" id="panel-license" hidden>
 <p class="tab-kicker">EXPERT ADVISOR</p><h2 class="section-title" data-tr="connect">Connect your <span>MT5 account</span></h2>
 <div class="card gold"><div class="micro">ONE EA · ONE PRIVATE CODE</div><h2 style="font-size:22px;margin-top:10px">Set up SignalBridge</h2>
  <ol class="list"><li>Install the official compiled DrFX EX5 Expert Advisor in MetaTrader 5.</li><li>Allow https://signalbridge.drfx.online in MT5 Expert Advisors.</li><li>Enter your activation code as the first EA setting.</li><li>Check the MT5 Experts tab for the verified license state.</li></ol>
  <span class="inline-tag">DEMO ACCOUNT ONLY · LIVE TRADING DISABLED</span>
 </div><button class="btn primary" type="button" data-jump="home" data-tr="back">View activation code ↗</button>
</section>
<section class="tab-panel" data-panel="plans" id="panel-plans" hidden>
 <p class="tab-kicker">DRFX MEMBERSHIP</p><h2 class="section-title" data-tr="advantage">Choose your plan</h2>
 <div class="card">
  <div class="plan"><div><b>One Month Free</b><small>Free trial and private EA activation</small></div><div class="plan-price">$0</div></div>
  <div class="plan featured"><div><b>3 Months Premium</b><small>SignalBridge and 52 premium indicators*</small></div><div class="plan-price">$47</div></div>
  <div class="plan"><div><b>Annual Elite</b><small>All features and personalized options*</small></div><div class="plan-price">$165</div></div>
  <p id="paymentStatus" class="meta" role="status">Paid checkout is not configured yet.</p>
  <button id="openPricing" type="button" class="btn primary" style="width:100%;margin-top:15px" data-tr="pricing">View website plans ↗</button>
  <p class="meta">* Premium content requires separate authorized release. This Mini App does not collect payments.</p>
 </div>
</section>
<section class="tab-panel" data-panel="help" id="panel-help" hidden>
 <p class="tab-kicker">SUPPORT &amp; ACCOUNT SAFETY</p><h2 class="section-title" data-tr="support">Help &amp; security</h2>
 <div class="card"><h2>Keep your account protected</h2>
  <ol class="list"><li>Open the Mini App from the official Telegram bot to verify your identity.</li><li>Email and Telegram accounts can only be linked after explicit verification.</li><li>EA activation keys never belong in screenshots or chat messages.</li><li>Use your main website dashboard for account management.</li></ol>
  <div class="buttons"><button id="openWebsite" class="btn primary" type="button" data-tr="website">Open DrFX website ↗</button><button id="refreshAccount" class="btn subtle" type="button" data-tr="refresh">Refresh ↻</button></div>
 </div>
</section>
<footer class="page-footer">© 2026 DrFXAi · SignalBridge<br>Connection diagram is illustrative. No simulated trades are presented as live.</footer>
</main>
<nav class="bottom" aria-label="Mini App navigation">
 <button data-tab="home" type="button" aria-selected="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/></svg><span data-tr="navHome">Home</span></button>
 <button data-tab="license" type="button" aria-selected="false"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg><span data-tr="navEA">MT5 EA</span></button>
 <button data-tab="plans" type="button" aria-selected="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 4 4 5-8 5 8 4-4-2 10H5z"/></svg><span data-tr="navPlans">Plans</span></button>
 <button data-tab="help" type="button" aria-selected="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a3 3 0 0 1 5.3 1.9c0 2-2.8 2.4-2.8 4.1M12 18h.01"/></svg><span data-tr="navHelp">Help</span></button>
</nav></body></html>`;
export const MINI_JS=String.raw`(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const tg = window.Telegram?.WebApp || null;
 const state = {user:null, serialVisible:false,telegramEnabled:false};

 const fa={eyebrow:'محیط اختصاصی معامله‌گری',hero1:'دقت بالا.',hero2:'در هر حرکت.',desc:'مرکز فرمان شخصی شما؛ هویت امن تلگرام، اشتراک سیگنال‌بریج و فعال‌سازی متاتریدر ۵ در یک محیط.',command:'مرکز فرمان',privateKey:'کد فعال‌سازی اختصاصی',connect:'اتصال به متاتریدر ۵',advantage:'اشتراک‌های شما',support:'امنیت و پشتیبانی',reveal:'نمایش کد',hide:'مخفی‌کردن کد',copy:'کپی کد فعال‌سازی',guide:'راهنمای MT5 ←',explore:'اشتراک‌ها ←',back:'بازگشت به کد فعال‌سازی ←',pricing:'مشاهده طرح‌ها در سایت ←',website:'باز کردن سایت DrFX ←',refresh:'به‌روزرسانی حساب ↻',navHome:'خانه',navEA:'اکسپرت',navPlans:'اشتراک',navHelp:'راهنما'};
 const english=Object.fromEntries([...document.querySelectorAll('[data-tr]')].map(el=>[el.dataset.tr,el.textContent]));
 let locale='en';
 const ui=(en,faText)=>locale==='fa'?faText:en;
 function language(lang){
  locale=lang==='fa'?'fa':'en';
  document.documentElement.lang=locale;
  document.documentElement.dir=locale==='fa'?'rtl':'ltr';
  document.querySelectorAll('[data-tr]').forEach(el=>{const key=el.dataset.tr;el.textContent=locale==='fa'?(fa[key]||english[key]):english[key]});
  $('langToggle').setAttribute('aria-pressed',String(locale==='fa'));
  $('langToggle').textContent=locale==='fa'?'EN / FA':'FA / EN';
  if(state.user){set('memberPlan',planLabel(state.user.plan));set('mt5Status',ui(state.user.mt5_account?'Linked':'Not connected',state.user.mt5_account?'متصل':'متصل نیست'));}
  else {set('memberPlan',ui('Not signed in','وارد نشده'));set('mt5Status',ui('Not connected','متصل نیست'));}
  $('revealSerial').textContent=state.serialVisible?ui('Hide serial','مخفی‌کردن کد'):ui('Reveal serial','نمایش کد');
 }
 function planLabel(plan){return ({
  trial:ui('1 Month Free','یک ماه رایگان'),quarterly:ui('3 Months Premium','پریمیوم سه‌ماهه'),annual:ui('Annual Elite','الیت سالانه')
 })[plan]||ui('Membership','اشتراک');}
 $('langToggle').addEventListener('click',()=>{language(locale==='en'?'fa':'en');tg?.HapticFeedback?.selectionChanged?.()});

 const set = (id,text) => {const el=$(id);if(el)el.textContent=String(text??'');};
 function message(text,kind='') {const e=$('statusMessage');e.textContent=text;e.className='message '+kind;}
 function show(tab){
  if(!['home','license','plans','help'].includes(tab))return;
  document.body.dataset.tab=tab;
  document.querySelectorAll('[data-panel]').forEach(e=>e.hidden=e.dataset.panel!==tab);
  document.querySelectorAll('[data-tab]').forEach(e=>e.setAttribute('aria-selected',String(e.dataset.tab===tab)));
  if(tg?.BackButton){if(tab==='home')tg.BackButton.hide();else tg.BackButton.show();}
  window.scrollTo({top:0,behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'instant':'smooth'});
  tg?.HapticFeedback?.selectionChanged?.();
 }
 document.querySelectorAll('[data-tab]').forEach(e=>e.addEventListener('click',()=>show(e.dataset.tab)));
 document.querySelectorAll('[data-jump]').forEach(e=>e.addEventListener('click',()=>show(e.dataset.jump)));
 tg?.BackButton?.onClick?.(()=>show('home'));

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
  set('memberPlan',planLabel(user.plan));
  set('memberIdentity',user.email||user.telegram||'Telegram account');
  set('licenseBadge',ui(user.license_status==='active'?'ACTIVE':'INACTIVE',user.license_status==='active'?'فعال':'غیرفعال'));
  $('licenseBadge').dataset.active=String(user.license_status==='active');
  set('mt5Status',ui(user.mt5_account?'Linked':'Not connected',user.mt5_account?'متصل':'متصل نیست'));
  set('mt5Server',user.mt5_account?('Account '+user.mt5_account.login+' · '+user.mt5_account.server):'Waiting for first verified EA connection');
  set('activationDate',ui(user.activated_at?'Activated':'Not started',user.activated_at?'فعال شده':'شروع نشده'));
  set('expiryStatus',user.expires_at?('Expires '+user.expires_at):'Starts at first verified activation');
  set('serialValue','•••• •••• •••• ••••');
  $('revealSerial').disabled=!user.activation_code;
  $('copySerial').disabled=!user.activation_code;
  $('revealSerial').textContent=ui('Reveal serial','نمایش کد');
 }
 async function refresh(){
  try{
   const {user}=await api('/api/me');
   applyUser(user);
   set('connection',ui('IDENTITY VERIFIED','هویت تأیید شد'));
   $('connection').classList.add('verified');
   message(ui('Your Telegram account is verified and the membership status is loaded.','هویت تلگرام تأیید و اطلاعات عضویت بارگذاری شد.'),'success');
  }catch(error){message(error.message==='UNAUTHENTICATED'?'Sign in from your DrFX bot to access the private dashboard.':'Account service unavailable: '+error.message,'error');}
 }
 $('refreshAccount').addEventListener('click',refresh);
 $('revealSerial').addEventListener('click',()=>{
  if(!state.user?.activation_code)return;
  state.serialVisible=!state.serialVisible;
  set('serialValue',state.serialVisible?state.user.activation_code:'•••• •••• •••• ••••');
  $('revealSerial').textContent=state.serialVisible?ui('Hide serial','مخفی‌کردن کد'):ui('Reveal serial','نمایش کد');
  tg?.HapticFeedback?.impactOccurred?.('light');
 });
 $('copySerial').addEventListener('click',async()=>{
  if(!state.user?.activation_code)return;
  try{await navigator.clipboard.writeText(state.user.activation_code);message(ui('Private EA code copied. Keep it confidential.','کد فعال‌سازی کپی شد. آن را محرمانه نگه دارید.'),'success');}
  catch{message(ui('Clipboard unavailable. Reveal your serial to copy it.','دسترسی به کلیپ‌بورد ممکن نیست. کد را نمایش داده و دستی کپی کنید.'),'error');}
 });
 async function start(){
  try{tg?.ready?.();tg?.expand?.();tg?.setHeaderColor?.('#030406');tg?.setBackgroundColor?.('#030406');}catch{}
  let config;try{config=await api('/api/config');}
  catch{message('Cannot contact DrFX services. Check network access and retry.','error');return;}
  state.telegramEnabled=!!config.telegram;
  set('paymentStatus',config.payments?'Payment provider is configured on the website. Open the pricing page to check availability.':'Paid memberships are not accepting payments yet.');
  if(!config.telegram){message('Telegram bot connection is not configured yet. The interface is available for preview, but login is disabled.','error');return;}
  if(!tg?.initData){message(ui('Open this Mini App from the official DrFX Telegram bot. Web browser preview cannot authenticate.','مینی‌اپ را از داخل بات رسمی DrFX باز کنید. نسخه مرورگر نمی‌تواند هویت شما را تأیید کند.'),'error');return;}
  try{
   await api('/api/auth/telegram/webapp',{init_data:tg.initData});
   await refresh();
  }catch(error){message(error.message==='INVALID_TELEGRAM_INIT_DATA'?'Telegram identity could not be verified. Reopen this Mini App from the bot.':'Telegram sign-in unavailable: '+error.message,'error');}
 }
 language('en');
 show('home');
 start();
})();`;
