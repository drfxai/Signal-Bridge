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
body[data-tab="license"] .hero,body[data-tab="license"] .route-stage,body[data-tab="plans"] .hero,body[data-tab="plans"] .route-stage,body[data-tab="help"] .hero,body[data-tab="help"] .route-stage{display:none}
body[data-tab="license"] #statusMessage,body[data-tab="plans"] #statusMessage,body[data-tab="help"] #statusMessage{margin-top:22px}
nav.bottom button{touch-action:manipulation}
.lang-toggle{border:1px solid #7c693d66;background:#18140c;color:#f7e7b4;border-radius:7px;padding:9px 7px;font:700 9px ui-monospace,Consolas,monospace;letter-spacing:.02em}
.bar-actions{display:flex;align-items:center;gap:6px}
html[dir="rtl"] .container,html[dir="rtl"] .bar,html[dir="rtl"] .hero{text-align:right}
html[dir="rtl"] .brand,html[dir="rtl"] .statusbar,html[dir="rtl"] .hero-kicker,html[dir="rtl"] nav.bottom{direction:ltr}
html[dir="rtl"] .route-stage{direction:ltr}
html[dir="rtl"] .list li{padding:12px 39px 13px 0}
html[dir="rtl"] .list li:before{left:auto;right:0}
html[dir="rtl"] .brandname{text-align:left}
nav.bottom{position:fixed;z-index:20;bottom:0;left:0;right:0;padding:9px 14px calc(11px + env(safe-area-inset-bottom));background:rgba(3,4,6,.94);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-top:1px solid #bda05b50;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;box-shadow:0 -10px 35px #0008}
nav.bottom button{position:relative;padding:9px 3px 8px;border:1px solid transparent;border-radius:9px;color:#93a0b2;background:transparent;font:650 10px ui-monospace,Consolas,monospace;letter-spacing:.01em;transition:background .2s,color .2s}
nav.bottom button>span:first-child{display:block;font-size:20px;line-height:23px;margin-bottom:5px;font-family:system-ui}nav.bottom button>span:last-child{display:block;font-size:10px;line-height:14px}
nav.bottom button[aria-selected=true]{background:linear-gradient(150deg,#3e2d1266,#12110d);border-color:#d4af373c;color:var(--gold-light)}
nav.bottom button[aria-selected=true]:before{content:"";position:absolute;top:-10px;left:28%;right:28%;height:2px;background:var(--gold);box-shadow:0 0 11px var(--gold)}
.page-footer{text-align:center;color:#677788;font:500 9px/1.8 ui-monospace,Consolas,monospace;letter-spacing:.035em;padding:18px 8px 5px}
@media(min-width:700px){.container{padding:0 26px}.statusbar{margin:0 -26px;padding-inline:26px}nav.bottom{max-width:600px;left:50%;transform:translateX(-50%);border-inline:1px solid #bda05b3b;border-radius:13px 13px 0 0}.route-stage{height:226px}}
@media(max-width:370px){.container{padding:0 14px}.statusbar{margin:0 -14px;padding-inline:14px}.hero h1{font-size:40px}.chip{font-size:8px;padding:8px}.brandname .name{font-size:12px}.brandname small{font-size:8px}.card{padding:16px}.small{padding:12px}.plan b{font-size:13px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}html{scroll-behavior:auto}}
</style><script src="/assets/telegram-mini.js?v=20261028" defer></script></head>
<body><main class="container">
<div class="statusbar"><span class="edge"><span class="dot"></span> DRFX · SIGNALBRIDGE NETWORK</span><span class="topright">TELEGRAM MINI APP / 01</span></div>
<header class="bar">
 <div class="brand"><span class="mark" aria-hidden="true">DFX</span><span class="brandname"><span class="name">DrFX <em>COMPANY</em></span><small>PRECISION IN MOTION</small></span></div>
 <div class="bar-actions"><button type="button" id="langToggle" class="lang-toggle" aria-label="Change language" aria-pressed="false">FA / EN</button><span id="connection" class="chip">CHECKING IDENTITY</span></div>
</header>
<section class="hero" aria-label="SignalBridge personal command center">
 <span class="eyebrow" data-tr="eyebrow">THE DRFX PRIVATE WORKSPACE</span>
 <h1><span data-tr="hero1">Precision.</span><br><em data-tr="hero2">In Motion.</em></h1>
 <p class="desc" data-tr="desc">Your private trading command center. Secure Telegram identity, SignalBridge membership and MT5 activation — in one experience.</p>
 <div class="hero-kicker"><span><i></i> ONE PRIVATE ACCOUNT</span><span><i></i> MT5 EXPERT ADVISOR</span></div>
</section>
<div class="route-stage" aria-label="Illustration of TradingView and Telegram connected through Cloudflare to MT5">
 <span class="caption">SIGNAL BRIDGE <small>GLOBAL ROUTING ARCHITECTURE</small></span><span class="demo">DESIGN VISUALIZATION</span>
 <svg viewBox="0 0 520 200" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
  <defs>
   <radialGradient id="orbGrad" cx=".5" cy=".28" r=".76"><stop stop-color="#3b493e" stop-opacity=".95"/><stop offset=".37" stop-color="#11312b"/><stop offset=".75" stop-color="#09171b"/><stop offset="1" stop-color="#030406"/></radialGradient>
   <linearGradient id="arcGold" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#10b981"/><stop offset=".45" stop-color="#e1bc61"/><stop offset="1" stop-color="#f7e7b4"/></linearGradient>
   <linearGradient id="lineFade" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#0f936d"/><stop offset=".55" stop-color="#e2b861"/><stop offset="1" stop-color="#5dbe9a"/></linearGradient>
   <filter id="nodeGlow"><feGaussianBlur stdDeviation="5"/></filter>
  </defs>
  <g transform="translate(258 154)" opacity=".85">
   <circle r="112" fill="url(#orbGrad)" stroke="#e1bd64" stroke-opacity=".37" stroke-width=".9"/>
   <circle r="104" fill="none" stroke="#ab944c" stroke-opacity=".26" stroke-width=".7"/>
   <ellipse rx="112" ry="40" fill="none" stroke="#b79b5b" stroke-opacity=".25"/>
   <ellipse rx="66" ry="112" fill="none" stroke="#a4b7a4" stroke-opacity=".17"/>
   <ellipse rx="28" ry="112" fill="none" stroke="#a4b7a4" stroke-opacity=".1"/>
   <path d="M-104-37H104M-110 0H110M-104 37H104" fill="none" stroke="#d4af37" stroke-opacity=".16" stroke-width=".9"/>
   <path d="M-56-64L-27-88L-4-72L0-45L23-32L36-13L14 8L20 29L-6 38L-22 17L-44 15L-61-11Z" fill="#6bbf82" fill-opacity=".15" stroke="#6dab81" stroke-opacity=".14"/>
   <path d="M48-56L71-34L86-13L75 10L52 3L40 23L24 11L34-17L22-39Z" fill="#77bd77" fill-opacity=".18"/>
   <path d="M-58 40L-35 49L-21 74L-38 103L-59 73Z" fill="#77ba83" fill-opacity=".13"/>
  </g>
  <g fill="none" stroke="url(#arcGold)" stroke-width="1.5" stroke-linecap="round">
   <path class="route" d="M74 138Q152 18 258 116"/>
   <path class="route alt" d="M152 168Q192 63 258 116"/>
   <path class="route" d="M258 116Q363 12 451 128"/>
   <path class="route alt" d="M258 116Q353 74 417 178"/>
  </g>
  <g class="halo" style="transform-origin:258px 116px"><circle cx="258" cy="116" r="14" fill="#d4af37" opacity=".24" filter="url(#nodeGlow)"/><circle cx="258" cy="116" r="5" fill="#ffefa9"/><circle cx="258" cy="116" r="10" fill="none" stroke="#e1c46f" stroke-opacity=".6"/></g>
  <g>
   <circle cx="74" cy="138" r="4" fill="#5bdcaf"/><circle cx="152" cy="168" r="3.5" fill="#68bfaf"/>
   <circle cx="451" cy="128" r="4" fill="#f7e7b4"/><circle cx="417" cy="178" r="3.5" fill="#d8ae5c"/>
   <g fill="#a9b7b5" font-family="monospace" font-size="9" font-weight="700">
    <text x="54" y="127">TV</text><text x="128" y="160">TG</text><text x="441" y="116">MT5</text><text x="243" y="101" fill="#f2da97">EDGE</text>
   </g>
  </g>
 </svg>
 <div class="stages"><span>01 / SOURCE<b>TradingView + Telegram</b></span><span>02 / BRIDGE<b>Cloudflare · SignalBridge</b></span><span>03 / EXECUTE<b>MetaTrader 5 EA</b></span></div>
</div>
<p class="message" id="statusMessage" role="status" aria-live="polite">Verifying your Telegram identity…</p>
<section class="tab-panel" id="panel-home" data-panel="home">
 <div class="subhead"><h2 data-tr="command">Command Center</h2><small>PERSONAL / SECURE</small></div>
 <article class="card gold">
  <div class="split"><div><span class="micro">YOUR MEMBERSHIP</span><div class="value" id="memberPlan">Not signed in</div></div><span class="indicator" aria-hidden="true">♛</span></div>
  <div class="goldline"></div>
  <div class="split"><span class="meta" id="memberIdentity">Verified Telegram login required</span><span id="licenseBadge" class="status">LOCKED</span></div>
 </article>
 <div class="grid"><article class="small"><span>MT5 CONNECTION</span><strong id="mt5Status">Not connected</strong><span id="mt5Server">No verified account binding</span></article><article class="small"><span>ACTIVATION STATUS</span><strong id="activationDate">Not started</strong><span id="expiryStatus">Validity begins on EA activation</span></article></div>
 <article class="card">
  <div class="split"><h2 data-tr="privateKey">Private activation key</h2><span class="micro">AES-GCM / PRIVATE</span></div>
  <p class="meta">Your unique 43-character serial is protected. Reveal only when setting up your EA — do not share screenshots of it.</p>
  <div id="serialValue" class="code" aria-live="polite">•••• •••• •••• ••••</div>
  <div class="buttons"><button type="button" class="btn primary" id="revealSerial" data-tr="reveal" disabled>Reveal serial</button><button type="button" class="btn" id="copySerial" data-tr="copy" disabled>Copy activation code</button></div>
 </article>
 <div class="buttons"><button type="button" class="btn subtle" data-jump="license" data-tr="guide">MT5 Setup Guide ↗</button><button type="button" class="btn subtle" data-jump="plans" data-tr="explore">Explore Membership ↗</button></div>
</section>
<section class="tab-panel" id="panel-license" data-panel="license" hidden>
 <p class="tab-kicker">EXPERT ADVISOR / ACTIVATION</p><h2 class="section-title" data-tr="connect">Connect to MT5.</h2>
 <article class="card gold"><span class="micro">SIGNALBRIDGE · META TRADER 5</span><h2 style="font:500 26px Georgia,serif;letter-spacing:-.035em;margin:12px 0 7px">One EA. One serial.</h2><p class="meta">Activate the same licensed MT5 Expert Advisor associated with your DrFX membership.</p><div class="goldline"></div><ol class="list"><li>Install an authorized compiled DrFX EX5 on MetaTrader 5.</li><li>Allow <strong>https://signalbridge.drfx.online</strong> in MT5 Expert Advisors.</li><li>Use the private code from your Command Center as the <strong>first EA input</strong>.</li><li>Confirm the license status from the <strong>Experts</strong> tab.</li></ol><span class="inline-tag">DEMO ACCOUNT TESTING · LIVE TRADING DISABLED</span></article>
 <button class="btn primary" type="button" data-jump="home" data-tr="back">Back to activation code ↗</button>
</section>
<section class="tab-panel" id="panel-plans" data-panel="plans" hidden>
 <p class="tab-kicker">DRFX COMPANY / MEMBERSHIP</p><h2 class="section-title" data-tr="advantage">Your Advantage.</h2>
 <article class="card">
  <div class="plan"><div><span class="micro">START HERE</span><b style="display:block;margin-top:5px">One Month Free</b><small>Trial account, private EA license</small></div><div class="plan-price">$0</div></div>
  <div class="plan featured"><div><span class="micro" style="color:#e4c27d">MOST POPULAR</span><b style="display:block;margin-top:5px">3 Months Premium</b><small>SignalBridge + 52 premium indicators*</small></div><div class="plan-price">$47</div></div>
  <div class="plan"><div><span class="micro">MAXIMUM VALUE</span><b style="display:block;margin-top:5px">Annual Elite</b><small>Full access, personalized options*</small></div><div class="plan-price">$165</div></div>
  <div class="goldline"></div><p id="paymentStatus" class="meta" role="status">Paid checkout is not configured yet.</p>
  <button type="button" id="openPricing" class="btn primary" style="width:100%;margin-top:13px" data-tr="pricing">Explore Plans on DrFX Website ↗</button>
  <p class="meta" style="margin-top:14px">* Premium assets require separate release and authorization. No payment is taken inside this Mini App.</p>
 </article>
</section>
<section class="tab-panel" id="panel-help" data-panel="help" hidden>
 <p class="tab-kicker">HELP CENTER / SECURE ACCESS</p><h2 class="section-title" data-tr="support">Trust &amp; Support.</h2>
 <article class="card"><span class="micro">PRIVATE ACCOUNT · SECURITY FIRST</span><h2 style="margin-top:13px">Your data stays yours.</h2><ol class="list"><li>Telegram identity is cryptographically verified on the server.</li><li>Email and Telegram accounts are linked only with explicit verification.</li><li>EA activation keys are private and never displayed in website URLs.</li><li>Use the official website for full account administration.</li></ol><div class="buttons"><button type="button" id="openWebsite" class="btn primary" data-tr="website">Open DrFX Website ↗</button><button type="button" id="refreshAccount" class="btn subtle" data-tr="refresh">Refresh account ↻</button></div></article>
</section>
<footer class="page-footer">© 2026 DrFXAi · PRIVATE SIGNALBRIDGE WORKSPACE<br>Routing illustration is conceptual, not live performance or broker activity.</footer></main>
<nav class="bottom" aria-label="Telegram Mini App navigation"><button type="button" data-tab="home" aria-selected="true"><span aria-hidden="true">⌂</span><span data-tr="navHome">Home</span></button><button type="button" data-tab="license" aria-selected="false"><span aria-hidden="true">▣</span><span data-tr="navEA">MT5 EA</span></button><button type="button" data-tab="plans" aria-selected="false"><span aria-hidden="true">♛</span><span data-tr="navPlans">Plans</span></button><button type="button" data-tab="help" aria-selected="false"><span aria-hidden="true">⚙</span><span data-tr="navHelp">Help</span></button></nav>
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
