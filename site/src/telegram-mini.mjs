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
.message{display:flex;align-items:flex-start;gap:10px;margin:12px 0 17px;padding:12px;border:1px solid #785c354d;border-radius:11px;background:#272014b3;color:#f3d6a2;font-size:12px;line-height:1.5;overflow-wrap:anywhere}.message:before{content:"i";display:grid;place-items:center;flex:none;width:18px;height:18px;background:#ae863c44;border-radius:50%;color:#f7d490;font-size:12px;font-weight:900}.message.error{border-color:#a34b547a;background:#2a141b;color:#ffc0c4}.message.error:before{content:"!";background:#9b414f55;color:#f5b7bd}.message.success{border-color:#3a986c55;background:#0f2922;color:#c2f8d9}.message.success:before{content:"✓";background:#1a785a;color:#baf7d4}.auth-state{margin-bottom:14px}.auth-state .message{margin-bottom:7px}.retry-auth{width:100%;min-height:43px;text-align:center}.bot-launch{display:flex;align-items:center;justify-content:center;text-decoration:none;margin-top:8px}.bot-launch[hidden]{display:none}.launch-hint{padding:8px 4px;margin:8px 0;color:#cfc2a7;font-size:13px;line-height:1.65}.otp-login{margin-top:14px;border:1px solid #a3864f99;border-radius:13px;padding:16px;background:linear-gradient(160deg,#211b13,#111318 80%)}.otp-login[hidden]{display:none!important}.otp-login h2{font-size:17px;line-height:1.35;color:#f2d48c;font-weight:800;margin:0 0 9px}.otp-login p{font-size:13px;color:#c9c3b6;line-height:1.65;margin:0 0 13px}.otp-login label{display:block;color:#e9d9ac;font-size:12px;font-weight:750;margin:0 0 7px}.otp-login form{display:grid;gap:11px}.otp-login input{width:100%;min-height:51px;background:#07090c;border:1px solid #8c7550;border-radius:10px;color:#fff4d2;padding:12px 13px;font:600 16px ui-monospace,Consolas,monospace;outline-offset:2px}.otp-login input:focus{outline:2px solid #f0c56e}.otp-login .otp-status{margin-top:10px;min-height:1em;color:#f5c1c1}.otp-login .otp-status.success{color:#a7eac6}
.section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:22px 0 12px}.section-head h2{margin:0;font-size:22px;font-weight:800;letter-spacing:-.04em}.section-head small{font-size:11px;color:#b7a983;font-weight:700}.card{position:relative;overflow:hidden;padding:18px;border:1px solid #35343c;border-radius:15px;background:linear-gradient(155deg,#191a20,#111218 80%);box-shadow:inset 0 1px #ffffff08,0 7px 20px #0004;margin:12px 0}.card.gold{border-color:#c9a45675;background:radial-gradient(ellipse at 88% 10%,#78602d49,transparent 51%),linear-gradient(145deg,#231f19,#121316 70%);box-shadow:0 7px 25px #0005,inset 0 1px #e1c7851a}.card h2{font-size:16px;font-weight:800;letter-spacing:-.018em;margin:0 0 8px}.card p{margin:9px 0 0}.micro{color:#b7ae99;font-size:11px;font-weight:750;letter-spacing:.045em;text-transform:uppercase}.value{font-size:25px;line-height:1.1;font-weight:850;letter-spacing:-.04em;margin:9px 0 0;color:#fff}.split{display:flex;align-items:center;justify-content:space-between;gap:14px;min-width:0}.split>div{min-width:0}.indicator{width:48px;height:48px;flex:none;border:1px solid #c4a04a80;background:#d4af371c;display:grid;place-items:center;border-radius:14px;color:#fce4a5;font-size:26px}.status{display:flex;align-items:center;gap:5px;background:#3a302025;border:1px solid #977a4b;border-radius:6px;color:#efd19b;font-size:10px;font-weight:850;padding:6px 8px;white-space:nowrap}.status[data-active=true]{background:#0e3325;border-color:#228859;color:#7aefaf}.meta{color:#adb2bf;font-size:13px;line-height:1.55;overflow-wrap:anywhere}.goldline{height:1px;background:linear-gradient(90deg,#ad854500,#d4af3788,#ad854500);margin:16px 0}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.small{min-width:0;min-height:116px;padding:15px 13px;background:#121920;border:1px solid #293947;border-radius:13px}.small>span:first-child{color:#b7c2ce;font-size:10px;line-height:1.2;font-weight:800;letter-spacing:.03em}.small strong{display:block;margin:15px 0 3px;font-size:15px;font-weight:800;line-height:1.25}.small span:not(:first-child){display:block;font-size:11px;color:#a5b0bc;line-height:1.35;overflow-wrap:anywhere}
.code{font:650 14px/1.55 ui-monospace,"SFMono-Regular",Consolas,monospace;overflow-wrap:anywhere;word-break:break-all;padding:13px;margin:12px 0 0;background:#08090d;border:1px dashed #bd95529c;color:#f9e6b6;border-radius:10px;letter-spacing:.03em;min-height:50px}
.btn{border:1px solid #686373;background:#23242b;color:#f0f0f4;min-height:45px;border-radius:10px;padding:11px 12px;font-size:13px;font-weight:750;line-height:1.3;transition:transform .15s,background .15s}.btn.primary{background:linear-gradient(115deg,#e0b663,#f5dd9e,#c99a40);border-color:#f6daa0;color:#21180c;box-shadow:0 3px 12px #d9a44818}.btn.subtle{background:#15171d;border-color:#353944;color:#d7d6db}.btn:active{transform:scale(.97)}.btn:disabled{cursor:not-allowed;opacity:.42;box-shadow:none}.buttons{display:flex;gap:9px;flex-wrap:wrap;margin:14px 0 0}.buttons .btn{flex:1 1 135px}.action-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.action-grid .btn{min-height:55px;text-align:left}
.tab-panel[hidden]{display:none}.tab-panel{padding-bottom:6px}.section-title{margin:23px 0 13px;font-size:28px;font-weight:800;letter-spacing:-.045em}.section-title span{color:var(--gold-light)}.tab-kicker{color:#e4be77;font-size:11px;font-weight:800;letter-spacing:.08em;margin:22px 0 6px}.list{padding:0;margin:6px 0 14px;list-style:none;counter-reset:step}.list li{counter-increment:step;position:relative;padding:13px 0 13px 34px;border-bottom:1px solid #ffffff18;color:#c4c7d0;font-size:13px;line-height:1.55}.list li:before{content:counter(step,decimal-leading-zero);position:absolute;top:14px;left:0;color:#efcb7e;font-size:11px;font-weight:900}.inline-tag{display:inline-flex;align-items:center;background:#10261b;border:1px solid #28744c;color:#9eebbf;font-size:10px;font-weight:800;padding:7px 9px;border-radius:7px}.plan{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:16px 0;border-bottom:1px solid #ffffff18}.plan b{font-size:15px}.plan small{display:block;font-size:12px;line-height:1.45;margin-top:4px;color:#abaeb8}.plan-price{font-size:24px;line-height:1;font-weight:900;color:#f0c777;white-space:nowrap}.plan.featured{margin:10px -9px 0;padding:13px 9px;background:#47351d55;border:1px solid #98754467;border-radius:10px}.plan.featured+.plan{border-top:0}
.page-footer{font-size:11px;color:#777e8d;text-align:center;line-height:1.65;padding:19px 9px 10px}
nav.bottom{position:fixed;left:0;right:0;bottom:0;width:100%;z-index:50;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding:9px max(9px,env(safe-area-inset-left)) calc(9px + env(safe-area-inset-bottom)) max(9px,env(safe-area-inset-right));background:#0d0e13f7;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-top:1px solid #65533390;box-shadow:0 -8px 24px #0007}
nav.bottom button{border:1px solid transparent;min-width:0;background:transparent;border-radius:10px;color:#b0adb6;padding:8px 3px;display:grid;place-items:center;gap:3px;min-height:58px;font-size:11px;font-weight:750}nav.bottom button svg{display:block;width:21px;height:21px;stroke:currentColor;fill:none;stroke-width:1.8}nav.bottom button[aria-selected=true]{background:#b18a3840;color:#f4d38e;border-color:#bb984d60}nav.bottom button:active{background:#ffffff12}
body.admin-visible nav.bottom{grid-template-columns:repeat(5,minmax(0,1fr))}
.mini-tools{background:linear-gradient(135deg,#201b13,#0d151c);border:1px solid #bd9a506e;border-radius:15px;padding:17px;margin:17px 0}
.mini-tools-head{display:grid;gap:4px}.mini-tools-head span{font-size:10px;color:#e7ca81;font-weight:800;letter-spacing:.08em}
.mini-tools-head strong{font-size:21px;font-weight:850}
.mini-status-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:15px 0}
.mini-status-grid>div{min-width:0;background:#111a21;border:1px solid #31414d;border-radius:10px;padding:12px}
.mini-status-grid small{font-size:10px;color:#a2b4c7}.mini-status-grid strong{display:block;margin-top:10px;font-size:13px;color:#f6dcaa;overflow-wrap:anywhere}
.mini-wide{width:100%}.mini-note{font-size:12px;line-height:1.65;color:#c0c6d2;overflow-wrap:anywhere}
.mini-tools h3{font-size:17px;margin:20px 0 5px}
.mini-webhook-url{display:block;overflow-wrap:anywhere;word-break:break-all;background:#050a11;color:#f4d58c;font-size:11px;line-height:1.7;border:1px dashed #89734b;padding:12px;border-radius:9px;margin:12px 0}
.mini-admin-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin:17px 0}
.mini-admin-metrics>div{border:1px solid #856f4b6b;background:#1b1917;padding:15px;border-radius:12px}
.mini-admin-metrics span{color:#c3b08b;font-size:11px;text-transform:capitalize}.mini-admin-metrics strong{display:block;color:#ffdfa1;font-size:25px;font-weight:850;margin-top:4px}
.mini-admin-directory{background:#11151d;padding:15px;border:1px solid #35404e;border-radius:13px}
.mini-admin-directory>label{font-size:11px;color:#b9c6d2;font-weight:850}
.mini-admin-search{display:flex;gap:8px;margin:10px 0 15px}.mini-admin-search input{width:100%;min-width:0;color:#fff;background:#060b12;border:1px solid #4c5262;border-radius:9px;padding:12px;font-size:14px}
.mini-admin-users{display:grid;gap:10px}.mini-admin-user{border:1px solid #3b3e47;border-radius:11px;padding:13px;background:#1b1e25}
.mini-admin-user-head{display:flex;justify-content:space-between;gap:8px}.mini-admin-user-head strong{overflow-wrap:anywhere;font-size:13px}
.mini-admin-user-head span{font-size:11px;color:#ecce86}.mini-admin-user-meta{font-size:11px;color:#9caab9;overflow-wrap:anywhere;margin:7px 0}
.mini-admin-user-actions{display:flex;gap:8px;margin-top:12px}.mini-admin-user-actions select{min-width:0;flex:1;background:#090d13;color:#e2e8f2;border:1px solid #515565;border-radius:8px;padding:9px}
.mini-admin-user-actions button{flex:0 0 80px;font-size:12px}

body[data-tab=license] .hero,body[data-tab=license] .route-stage,body[data-tab=plans] .hero,body[data-tab=plans] .route-stage,body[data-tab=help] .hero,body[data-tab=help] .route-stage{display:none}
body[data-tab=license] #statusMessage,body[data-tab=plans] #statusMessage,body[data-tab=help] #statusMessage{margin-top:15px}
html[dir=rtl] .container{text-align:right}html[dir=rtl] .bar,html[dir=rtl] .route-steps,html[dir=rtl] nav.bottom,html[dir=rtl] .brand-bar{direction:ltr}html[dir=rtl] .brandname{text-align:left}html[dir=rtl] .list li{padding:13px 34px 13px 0}html[dir=rtl] .list li:before{right:0;left:auto}html[dir=rtl] .action-grid .btn{text-align:right}
@media(max-width:360px){.container{padding:0 12px}.brandname .name{font-size:14px}.chip{font-size:9px;padding:7px}.hero h1{font-size:29px}.card{padding:15px}.grid{gap:8px}.small{padding:12px 11px}.micro{font-size:10px}.action-grid{grid-template-columns:1fr}.route-head{padding:11px 11px 4px}}
@media(min-width:681px){nav.bottom{padding-inline:max(16px,calc((100% - 660px)/2))}.container{padding-inline:22px}.hero{padding-top:33px}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important;scroll-behavior:auto!important}}
</style>
<script src="/assets/telegram-mini.js?v=20261028-mobile-v6" defer></script></head>
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
<div class="auth-state" role="group" aria-label="Account sign-in status"><p class="message" id="statusMessage" role="status" aria-live="polite">Checking your Telegram identity…</p><button id="retrySignIn" class="btn subtle retry-auth" type="button" hidden>Retry connection ↻</button><a id="openBot" class="btn primary bot-launch" href="#" target="_blank" rel="noopener noreferrer" hidden>Open Signal Bridge bot ↗</a><p id="launchHint" class="launch-hint" hidden>In the Signal Bridge bot, send /start and tap <strong>Open DrFX Mini App</strong> under the bot's message. Do not use Open website.</p>
 <section id="otpLogin" class="otp-login" hidden aria-labelledby="otpHeading">
  <h2 id="otpHeading">Sign in with a Telegram code</h2>
  <p id="otpInstructions">Send <strong>/login</strong> to your Signal Bridge bot, then paste its <strong>one-time sign-in code</strong> below. This opens your existing membership and EA license. Do not enter your EA activation code here.</p>
  <form id="otpForm" autocomplete="off"><label for="otpInput">One-time sign-in code</label><input id="otpInput" name="login_code" type="text" inputmode="text" autocomplete="one-time-code" autocapitalize="off" spellcheck="false" maxlength="64" minlength="8" pattern="[A-Za-z0-9_-]{8,64}" required placeholder="Paste code from /login" aria-describedby="otpInstructions otpStatus"/><button id="otpSubmit" class="btn primary" type="submit">Sign in securely</button></form>
  <p id="otpStatus" class="otp-status" role="status" aria-live="polite"></p>
 </section></div>
<section class="tab-panel" data-panel="home" id="panel-home">
 <div class="section-head"><h2 data-tr="command">Your dashboard</h2><small data-tr="privateCaption">PRIVATE ACCOUNT</small></div>
 <article class="card gold">
  <div class="split"><div><div class="micro" data-tr="memberCaption">CURRENT MEMBERSHIP</div><div id="memberPlan" class="value">Not signed in</div></div><span class="indicator" aria-hidden="true">♛</span></div>
  <div class="goldline"></div><div class="split"><span id="memberIdentity" class="meta" data-tr="memberHint">Sign in from the official Telegram bot</span><span id="licenseBadge" class="status" data-active="false">LOCKED</span></div>
 </article>
 <div class="grid">
  <article class="small"><span data-tr="mt5Caption">MT5 CONNECTION</span><strong id="mt5Status">Not connected</strong><span id="mt5Server" data-tr="mt5Hint">Account not yet verified</span></article>
  <article class="small"><span data-tr="eaCaption">EA ACTIVATION</span><strong id="activationDate">Not started</strong><span id="expiryStatus" data-tr="expiryHint">Valid after activation</span></article>
 </div>
 <article class="card">
  <div class="split"><h2 data-tr="privateKey">Your activation key</h2><span class="micro">SECURE</span></div>
  <p class="meta" data-tr="licenseNote">Your unique EA code is hidden until you choose to reveal or copy it. Never share it in screenshots.</p>
  <div class="code" id="serialValue" aria-live="polite">•••• •••• •••• ••••</div>
  <div class="buttons"><button type="button" id="revealSerial" class="btn primary" data-tr="reveal" disabled>Reveal code</button><button type="button" id="copySerial" class="btn" data-tr="copy" disabled>Copy code</button></div>
 </article>
 <section class="mini-tools" aria-label="SignalBridge account tools"><div class="mini-tools-head"><span>PERSONAL SIGNALBRIDGE</span><strong>Connection & Webhook</strong></div>
 <div class="mini-status-grid"><div><small>EA LICENSE</small><strong id="miniConnectionLicense">Not checked</strong></div><div><small>LAST HANDSHAKE</small><strong id="miniConnectionLast">Not checked</strong></div></div>
 <button type="button" id="miniTestConnection" class="btn primary mini-wide">Test Connection · No Trade</button>
 <p class="mini-note" id="miniConnectionInfo" role="status">Reads the last EA handshake. It does not place a market order.</p>
 <h3>My TradingView Webhook</h3><p class="mini-note">Private endpoint for your TradingView alerts, initially Dry Run. Do not share this URL.</p>
 <code class="mini-webhook-url" id="miniWebhookUrl">No webhook created</code>
 <div class="buttons"><button type="button" class="btn primary" id="miniCreateWebhook">Create Webhook</button><button type="button" class="btn" id="miniCopyWebhook" disabled>Copy URL</button><button type="button" class="btn subtle" id="miniRotateWebhook" disabled>Regenerate</button></div>
 <p id="miniWebhookInfo" class="mini-note" role="status">Create your private endpoint to receive TradingView alerts.</p>
 <button type="button" class="btn subtle mini-wide" disabled title="Requires a newer compiled EA">DEMO XAUUSD Buy 0.01 → Close 5s · EA update required</button>
 </section><div class="action-grid"><button type="button" class="btn subtle" data-jump="license" data-tr="guide">MT5 setup guide ↗</button><button type="button" class="btn subtle" data-jump="plans" data-tr="explore">Explore plans ↗</button></div>
</section>
<section class="tab-panel" data-panel="license" id="panel-license" hidden>
 <p class="tab-kicker" data-tr="eaKicker">EXPERT ADVISOR</p><h2 class="section-title" data-tr="connect">Connect your <span>MT5 account</span></h2>
 <div class="card gold"><div class="micro">ONE EA · ONE PRIVATE CODE</div><h2 style="font-size:22px;margin-top:10px" data-tr="setupTitle">Set up SignalBridge</h2>
  <ol class="list"><li data-tr="step1">Install the official compiled DrFX EX5 Expert Advisor in MetaTrader 5.</li><li data-tr="step2">Allow https://signalbridge.drfx.online in MT5 Expert Advisors.</li><li data-tr="step3">Enter your activation code as the first EA setting.</li><li data-tr="step4">Check the MT5 Experts tab for the verified license state.</li></ol>
  <span class="inline-tag" data-tr="demoOnly">DEMO ACCOUNT ONLY · LIVE TRADING DISABLED</span>
 </div><button class="btn primary" type="button" data-jump="home" data-tr="back">View activation code ↗</button>
</section>
<section class="tab-panel" data-panel="plans" id="panel-plans" hidden>
 <p class="tab-kicker" data-tr="plansKicker">DRFX MEMBERSHIP</p><h2 class="section-title" data-tr="advantage">Choose your plan</h2>
 <div class="card">
  <div class="plan"><div><b>One Month Free</b><small>Free trial and private EA activation</small></div><div class="plan-price">$0</div></div>
  <div class="plan featured"><div><b>3 Months Premium</b><small>SignalBridge and 52 premium indicators*</small></div><div class="plan-price">$47</div></div>
  <div class="plan"><div><b>Annual Elite</b><small>All features and personalized options*</small></div><div class="plan-price">$165</div></div>
  <p id="paymentStatus" class="meta" role="status">Paid checkout is not configured yet.</p>
  <button id="openPricing" type="button" class="btn primary" style="width:100%;margin-top:15px" data-tr="pricing">View website plans ↗</button>
  <p class="meta" data-tr="premiumNote">* Premium content requires separate authorized release. This Mini App does not collect payments.</p>
 </div>
</section>
<section class="tab-panel" data-panel="help" id="panel-help" hidden>
 <p class="tab-kicker" data-tr="helpKicker">SUPPORT &amp; ACCOUNT SAFETY</p><h2 class="section-title" data-tr="support">Help &amp; security</h2>
 <div class="card"><h2 data-tr="securityTitle">Keep your account protected</h2>
  <ol class="list"><li data-tr="help1">Open the Mini App from the official Telegram bot to verify your identity.</li><li data-tr="help2">Email and Telegram accounts can only be linked after explicit verification.</li><li data-tr="help3">EA activation keys never belong in screenshots or chat messages.</li><li data-tr="help4">Use your main website dashboard for account management.</li></ol>
  <div class="buttons"><button id="openWebsite" class="btn primary" type="button" data-tr="website">Open DrFX website ↗</button><button id="refreshAccount" class="btn subtle" type="button" data-tr="refresh">Refresh ↻</button></div>
 </div>
</section>
<section class="tab-panel" data-panel="admin" id="panel-admin" hidden>
 <div class="tab-kicker">DRFX / ADMIN</div><h2 class="section-title">Operations Center</h2>
 <p class="mini-note">Administrator-only customer accounts, membership controls and EA access management.</p>
 <div class="mini-admin-metrics" id="miniAdminMetrics"></div>
 <div class="mini-admin-directory"><label for="miniAdminSearch">CUSTOMER DIRECTORY</label><div class="mini-admin-search"><input id="miniAdminSearch" autocomplete="off" placeholder="Email, Telegram, user ID"><button type="button" id="miniAdminRefresh" class="btn subtle">Refresh</button></div>
 <div id="miniAdminUsers" class="mini-admin-users"></div></div>
 <p id="miniAdminStatus" class="mini-note" role="status"></p>
 </section>
<footer class="page-footer">© 2026 DrFXAi · SignalBridge<br>Connection diagram is illustrative. No simulated trades are presented as live.</footer>
</main>
<nav class="bottom" aria-label="Telegram Mini App navigation">
 <button data-tab="home" type="button" aria-selected="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/></svg><span data-tr="navHome">Home</span></button>
 <button data-tab="license" type="button" aria-selected="false"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg><span data-tr="navEA">MT5 EA</span></button>
 <button data-tab="plans" type="button" aria-selected="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 9 4 4 5-8 5 8 4-4-2 10H5z"/></svg><span data-tr="navPlans">Plans</span></button>
 <button data-tab="help" type="button" aria-selected="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a3 3 0 0 1 5.3 1.9c0 2-2.8 2.4-2.8 4.1M12 18h.01"/></svg><span data-tr="navHelp">Help</span></button>
<button id="miniAdminTab" type="button" data-tab="admin" aria-selected="false" hidden><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5h16v14zM4 10h16M9 5v14"/></svg><span>Admin</span></button>
</nav></body></html>`;
export const MINI_JS=String.raw`(() => {
 'use strict';
 const $ = id => document.getElementById(id);
 const tg = window.Telegram?.WebApp || null;
 const state = {user:null, serialVisible:false,telegramEnabled:false};

 // Recover readable mobile sizing when a Telegram external/custom tab enforces a desktop-width layout.
 // Do not apply to tablets, ordinary desktop browsers or correctly sized Telegram WebViews.
 function normalizeViewport(){
  const w=window.innerWidth||0,sw=window.screen?.width||0;
  if(navigator.maxTouchPoints>0&&sw>=270&&sw<=600&&w>sw*1.6){
   const scale=Math.min(3.5,w/sw);
   document.documentElement.style.zoom=String(scale);
   document.documentElement.dataset.mobileViewportFixed='true';
  }
 }
 normalizeViewport();


 const fa={eyebrow:'محیط اختصاصی معامله‌گری',hero1:'دقت بالا.',hero2:'در هر حرکت.',desc:'مرکز فرمان شخصی شما؛ هویت امن تلگرام، اشتراک سیگنال‌بریج و فعال‌سازی متاتریدر ۵ در یک محیط.',command:'مرکز فرمان',privateKey:'کد فعال‌سازی اختصاصی',connect:'اتصال به متاتریدر ۵',advantage:'اشتراک‌های شما',support:'امنیت و پشتیبانی',reveal:'نمایش کد',hide:'مخفی‌کردن کد',copy:'کپی کد فعال‌سازی',guide:'راهنمای MT5 ←',explore:'اشتراک‌ها ←',back:'بازگشت به کد فعال‌سازی ←',pricing:'مشاهده طرح‌ها در سایت ←',website:'باز کردن سایت DrFX ←',refresh:'به‌روزرسانی حساب ↻',navHome:'خانه',navEA:'اکسپرت',navPlans:'اشتراک',navHelp:'راهنما',licenseNote:'کد شخصی EA تا زمان درخواست شما مخفی است. آن را در تصاویر یا پیام‌ها منتشر نکنید.',eaKicker:'اکسپرت متاتریدر',plansKicker:'اشتراک دکتر اف‌ایکس',helpKicker:'پشتیبانی و امنیت حساب',memberCaption:'اشتراک فعلی',privateCaption:'حساب اختصاصی',mt5Caption:'اتصال متاتریدر ۵',eaCaption:'فعال‌سازی EA',memberHint:'از داخل بات رسمی تلگرام وارد شوید',mt5Hint:'حساب معاملاتی هنوز تأیید نشده است',expiryHint:'اعتبار پس از فعال‌سازی آغاز می‌شود',setupTitle:'راه‌اندازی سیگنال‌بریج',step1:'نسخه رسمی و کامپایل‌شده EX5 را در متاتریدر ۵ نصب کنید.',step2:'آدرس https://signalbridge.drfx.online را در تنظیمات Expert Advisors مجاز کنید.',step3:'کد فعال‌سازی شخصی را در اولین ورودی اکسپرت وارد کنید.',step4:'در تب Experts وضعیت تأیید لایسنس را بررسی کنید.',demoOnly:'فقط حساب دمو · معاملات واقعی غیرفعال',help1:'مینی‌اپ را از داخل بات رسمی تلگرام برای تأیید هویت باز کنید.',help2:'اتصال حساب ایمیل و تلگرام فقط پس از تأیید مالکیت انجام می‌شود.',help3:'کد فعال‌سازی EA را در تصویر یا پیام عمومی قرار ندهید.',help4:'برای مدیریت کامل حساب از داشبورد سایت استفاده کنید.',premiumNote:'* محصولات پریمیوم به انتشار و مجوز مستقل نیاز دارند. این مینی‌اپ پرداخت دریافت نمی‌کند.',securityTitle:'امنیت حساب شما'};
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
  if(state.user){set('memberPlan',planLabel(state.user.plan));set('mt5Status',ui(state.user.mt5_account?'Linked':'Not connected',state.user.mt5_account?'متصل':'متصل نیست'));set('licenseBadge',ui(state.user.license_status==='active'?'ACTIVE':'INACTIVE',state.user.license_status==='active'?'فعال':'غیرفعال'));set('activationDate',ui(state.user.activated_at?'Activated':'Not started',state.user.activated_at?'فعال شده':'شروع نشده'));}
  else {set('memberPlan',ui('Not signed in','وارد نشده'));set('mt5Status',ui('Not connected','متصل نیست'));}
  $('revealSerial').textContent=state.serialVisible?ui('Hide serial','مخفی‌کردن کد'):ui('Reveal serial','نمایش کد');
 }
 function planLabel(plan){return ({
  trial:ui('1 Month Free','یک ماه رایگان'),quarterly:ui('3 Months Premium','پریمیوم سه‌ماهه'),annual:ui('Annual Elite','الیت سالانه')
 })[plan]||ui('Membership','اشتراک');}
 $('langToggle').addEventListener('click',()=>{language(locale==='en'?'fa':'en');tg?.HapticFeedback?.selectionChanged?.()});

 async function offerBotLaunch(){
  $('launchHint').hidden=false;
  $('otpLogin').hidden=false;
  $('launchHint').textContent=ui(
   'Return to the official Signal Bridge bot. Send /code to receive your private EA serial, or tap Open DrFX Mini App for the dashboard — not Open website.',
   'به بات رسمی Signal Bridge برگردید. برای دریافت کد EA دستور /code را بفرستید یا دکمه Open DrFX Mini App را بزنید؛ نه Open website.'
  );
  try{
   const health=await api('/api/telegram/health');
   const username=health.bot_username;
   if(typeof username==='string'&&/^[A-Za-z0-9_]{5,32}$/.test(username)){
    $('openBot').href='https://t.me/'+username;
    $('openBot').hidden=false;
    $('openBot').textContent=ui('Open Signal Bridge bot ↗','باز کردن بات Signal Bridge ←');
   }
  }catch{ /* The launch instructions remain visible if bot info is temporarily unavailable. */ }
 }
 const set = (id,text) => {const el=$(id);if(el)el.textContent=String(text??'');};
 function message(text,kind='') {const e=$('statusMessage');e.textContent=text;e.className='message '+kind;}
 function clearPrivateAccount(){
  state.user=null;state.serialVisible=false;
  $('miniAdminTab').hidden=true;document.body.classList.remove('admin-visible');
  $('miniWebhookUrl').textContent='No webhook created';$('miniCopyWebhook').disabled=true;$('miniRotateWebhook').disabled=true;
  set('memberPlan',ui('Not signed in','وارد نشده'));
  set('memberIdentity',ui('Sign in from the official Telegram bot','از داخل بات رسمی تلگرام وارد شوید'));
  set('licenseBadge',ui('LOCKED','قفل'));$('licenseBadge').dataset.active='false';
  set('mt5Status',ui('Not connected','متصل نیست'));
  set('mt5Server',ui('Account not yet verified','حساب معاملاتی هنوز تأیید نشده است'));
  set('activationDate',ui('Not started','شروع نشده'));
  set('expiryStatus',ui('Valid after activation','اعتبار پس از فعال‌سازی آغاز می‌شود'));
  set('serialValue','•••• •••• •••• ••••');
  $('revealSerial').disabled=true;$('copySerial').disabled=true;
  $('revealSerial').textContent=ui('Reveal code','نمایش کد');
  $('connection').classList.remove('verified');
  set('connection',ui('Sign-in needed','ورود لازم است'));
 }
 function show(tab){
  if(!['home','license','plans','help','admin'].includes(tab))return;
  if(tab==='admin'&&state.user?.role!=='admin')return;
  if(tab==='admin')loadMiniAdmin();
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
async function refreshMiniConnection(){
 if(!state.user)return;
 try{
  const [c,w]=await Promise.all([api('/api/connection/check'),api('/api/webhook')]);
  const d=c.diagnostic||{};
  set('miniConnectionLicense',d.license==='active'?'ACTIVE':'INACTIVE');
  set('miniConnectionLast',d.last_handshake||'Not seen');
  set('miniConnectionInfo','Last recorded handshake only, not a live WebSocket ping or order.');
  displayMiniWebhook(w.webhook);
 }catch(e){set('miniConnectionInfo','Connection status unavailable: '+e.message);}
}
function displayMiniWebhook(w){
 const available=!!w?.exists;
 set('miniWebhookUrl',available?w.webhook_url:'No webhook created');
 $('miniCreateWebhook').disabled=available;
 $('miniCopyWebhook').disabled=!available;
 $('miniRotateWebhook').disabled=!available;
 set('miniWebhookInfo',available?'Dry Run · '+Number(w.received||0)+' alerts received. Keep this URL private.':'Create a personal TradingView webhook to start in Dry Run.');
}
$('miniTestConnection').addEventListener('click',refreshMiniConnection);
$('miniCreateWebhook').addEventListener('click',async()=>{try{const r=await api('/api/webhook/create',{});displayMiniWebhook(r.webhook)}catch(e){set('miniWebhookInfo',e.message)}});
$('miniCopyWebhook').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('miniWebhookUrl').textContent);set('miniWebhookInfo','Copied. Keep the private URL safe.')}catch{set('miniWebhookInfo','Copy not allowed on this device.')}});
$('miniRotateWebhook').addEventListener('click',async()=>{if(!confirm('Regenerate URL? Your old TradingView alerts will stop reaching SignalBridge.'))return;try{const r=await api('/api/webhook/rotate',{});displayMiniWebhook(r.webhook)}catch(e){set('miniWebhookInfo',e.message)}});
async function loadMiniAdmin(){
 if(state.user?.role!=='admin')return;
 try{
  const [s,users]=await Promise.all([api('/api/admin/stats'),api('/api/admin/users?q='+encodeURIComponent($('miniAdminSearch').value.trim()))]);
  const stats=$('miniAdminMetrics');stats.replaceChildren();
  for(const [label,value] of Object.entries(s.stats||{})){
   const card=document.createElement('div'),caption=document.createElement('span'),num=document.createElement('strong');
   caption.textContent=label;num.textContent=String(value??0);card.append(caption,num);stats.append(card);
  }
  const grid=$('miniAdminUsers');grid.replaceChildren();
  for(const user of users.users||[]){
   const card=document.createElement('article');card.className='mini-admin-user';
   const title=document.createElement('div');title.className='mini-admin-user-head';
   const identity=document.createElement('strong');identity.textContent=user.email||user.telegram_name||user.telegram_id||'User';
   const state=document.createElement('span');state.textContent=user.status;title.append(identity,state);
   const meta=document.createElement('div');meta.className='mini-admin-user-meta';meta.textContent=user.plan+' · '+user.id;
   const actions=document.createElement('div');actions.className='mini-admin-user-actions';
   const select=document.createElement('select');for(const op of ['grant_trial','grant_quarterly','grant_annual','suspend','resume','revoke_license']){
    const option=document.createElement('option');option.value=op;option.textContent=op.replaceAll('_',' ');select.append(option);
   }
   const apply=document.createElement('button');apply.className='btn primary';apply.textContent='Apply';
   apply.addEventListener('click',async()=>{if(!confirm('Apply '+select.value+' to this account?'))return;apply.disabled=true;try{await api('/api/admin/user',{user_id:user.id,action:select.value});set('miniAdminStatus','Account updated.');await loadMiniAdmin()}catch(e){set('miniAdminStatus',e.message)}finally{apply.disabled=false}});
   actions.append(select,apply);card.append(title,meta,actions);grid.append(card);
  }
  set('miniAdminStatus',(users.users||[]).length+' users loaded · Administrator access verified');
 }catch(e){set('miniAdminStatus','Admin dashboard unavailable: '+e.message);}
}
$('miniAdminRefresh').addEventListener('click',loadMiniAdmin);
$('miniAdminSearch').addEventListener('change',loadMiniAdmin);
 function applyUser(user){
  state.user=user;
  state.serialVisible=false;
  $('miniAdminTab').hidden=user.role!=='admin';document.body.classList.toggle('admin-visible',user.role==='admin');
  refreshMiniConnection();
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
 async function refresh(mode='session'){
  try{
   const result=await api('/api/me');
   if(!result.user)throw Error('INVALID_ACCOUNT_RESPONSE');
   applyUser(result.user);
   set('connection',ui('IDENTITY VERIFIED','هویت تأیید شد'));
   $('connection').classList.add('verified');
   $('retrySignIn').hidden=true;
   $('openBot').hidden=true;
   $('launchHint').hidden=true;
   $('otpLogin').hidden=true;
   $('otpInput').value='';
   message(mode==='telegram'?ui('Your Telegram identity and membership are verified.','هویت تلگرام و وضعیت اشتراک شما تأیید شد.'):ui('Your existing DrFX session is verified.','نشست معتبر حساب DrFX شما تأیید شد.'),'success');
   return true;
  }catch(error){
   clearPrivateAccount();
   const unauth=error.message==='UNAUTHENTICATED';
   message(unauth?ui('Open this Mini App from the official bot to sign in.','برای ورود، مینی‌اپ را از داخل بات رسمی باز کنید.'):ui('Account could not be refreshed. Please retry.','دریافت اطلاعات حساب ممکن نیست. دوباره تلاش کنید.'),'error');
   $('retrySignIn').hidden=false;
   return false;
  }
 }
 $('refreshAccount').addEventListener('click',()=>refresh());
 $('otpForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const code=$('otpInput').value.trim();
  if(!/^[A-Za-z0-9_-]{8,64}$/.test(code)){
   $('otpStatus').textContent=ui('Enter the code provided by /login, not your EA serial.','کد پیام /login را وارد کنید؛ نه سریال فعال‌سازی EA.');
   return;
  }
  const button=$('otpSubmit');
  if(button.disabled)return;
  button.disabled=true;$('otpStatus').textContent=ui('Verifying your one-time code…','در حال بررسی کد یک‌بارمصرف…');
  try{
   // One-time bot OTP is verified against the same D1 user; never request a second EA license.
   await api('/api/auth/telegram/code',{code});
   $('otpInput').value='';
   if(await refresh('session')){
    show('home');
    $('otpStatus').textContent='';
   }else{
    $('otpStatus').textContent=ui('Signed in but the account could not be loaded; retry.','ورود انجام شد اما حساب بارگذاری نشد؛ دوباره تلاش کنید.');
   }
  }catch(error){
   const invalid=['INVALID_OR_EXPIRED_CODE','INVALID_CODE','CODE_ALREADY_USED'].includes(error.message);
   $('otpStatus').textContent=invalid
    ?ui('Code invalid, expired or already used. Send /login to the bot for a new code.','کد نامعتبر، منقضی یا مصرف‌شده است؛ برای کد جدید /login را به بات بفرستید.')
    :ui('Sign-in unavailable. Please retry without sharing the code.','ورود فعلاً ممکن نیست. بدون به‌اشتراک‌گذاشتن کد دوباره امتحان کنید.');
  }finally{button.disabled=false;}
 });
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
 let signInRunning=false;
 async function start(){
  if(signInRunning)return;
  signInRunning=true;$('retrySignIn').disabled=true;$('retrySignIn').hidden=true;
  try{
   try{tg?.ready?.();tg?.expand?.();tg?.setHeaderColor?.('#030406');tg?.setBackgroundColor?.('#030406');}catch{}
   const config=await api('/api/config');
   state.telegramEnabled=!!config.telegram;
   set('paymentStatus',config.payments?ui('The payment provider is configured on the website.','درگاه پرداخت در سایت پیکربندی شده است.'):ui('Paid memberships are not accepting payments yet.','پرداخت اشتراک هنوز فعال نیست.'));
   if(tg?.initData&&state.telegramEnabled){
    // Verify the signed Telegram principal before reading a user session.
    await api('/api/auth/telegram/webapp',{init_data:tg.initData});
    await refresh('telegram');
   }else{
    // Ordinary browsers may reuse an already-authenticated drfx.company cookie.
    // Never manufacture Telegram identity when initData is absent.
    const signedIn=await refresh('session');
    if(!signedIn){
     if(!state.telegramEnabled)message(ui('Telegram sign-in is currently unavailable.','ورود با تلگرام فعلاً در دسترس نیست.'),'error');
     else if(!tg?.initData){message(ui('This is a browser preview, not an authenticated Telegram Mini App session.','این صفحه پیش‌نمایش مرورگر است و ورود تأییدشده تلگرام ندارد.'),'error');await offerBotLaunch();}
    }
   }
  }catch(error){
   clearPrivateAccount();
   let reason;
   if(error.message==='TELEGRAM_INIT_DATA_EXPIRED'){
     reason=ui('This Telegram session is too old. Fully close the Mini App and launch it from the bot again.','اطلاعات ورود تلگرام قدیمی است. مینی‌اپ را کاملاً ببندید و دوباره از داخل بات باز کنید.');
   }else if(error.message==='INVALID_TELEGRAM_INIT_DATA'){
     reason=ui('Telegram identity could not be verified. Reopen through the official bot, not a browser link.','امضای هویت تلگرام تأیید نشد. مینی‌اپ را از دکمه بات رسمی باز کنید، نه لینک مرورگر.');
   }else if(error.message==='RATE_LIMITED'){
     reason=ui('Too many sign-in attempts. Try again after a short break.','تلاش‌های ورود بیش از حد است؛ کمی بعد دوباره امتحان کنید.');
   }else if(error.message==='LICENSING_NOT_READY'){
     reason=ui('Telegram sign-in reached the server, but EA licensing is temporarily unavailable. You can request your code using /code in the bot.','ورود تلگرام به سرور رسید اما سرویس لایسنس در دسترس نیست. دستور /code را در بات امتحان کنید.');
   }else{
     reason=ui('Connection unavailable. Retry or reopen the Mini App from the bot.','ارتباط برقرار نشد. دوباره تلاش کنید یا مینی‌اپ را از بات باز کنید.');
   }
   message(reason,'error');$('retrySignIn').hidden=false;
   if(!tg?.initData||['INVALID_TELEGRAM_INIT_DATA','TELEGRAM_INIT_DATA_EXPIRED','LICENSING_NOT_READY'].includes(error.message))await offerBotLaunch();
  }finally{signInRunning=false;$('retrySignIn').disabled=false;}
 }
 $('retrySignIn').addEventListener('click',start);
 language(navigator.language?.toLowerCase().startsWith('fa')?'fa':'en');
 show('home');
 start();
})();`;
