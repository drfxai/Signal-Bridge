// DrFX Scalper Pro on drfx.company: website showcase, product suite, portal tabs and the
// licence purchase pane. Composed into SITE_HTML / SITE_CSS / SITE_JS by ui.mjs.
const PRICE = { m1: 19, m3: 49 };

export const SX_ANNOUNCE_HTML = String.raw`<div class="sx-progress" id="sxProgress" aria-hidden="true"></div>
<a class="sx-announce" href="#scalper" id="sxAnnounce"><span class="sx-announce-new">NEW</span><span class="sx-announce-track"><span>DrFX Scalper Pro for MT5 is live · AI liquidity radar for XAUUSD · 7-day free trial, no card ·</span><span aria-hidden="true">DrFX Scalper Pro for MT5 is live · AI liquidity radar for XAUUSD · 7-day free trial, no card ·</span></span><span class="sx-announce-cta">See it ↗</span></a>
`;

export const SX_SUITE_HTML = String.raw`<section id="suite" class="sx-suite" aria-labelledby="sxSuiteTitle">
 <div class="sx-wrap">
  <div class="sx-head sx-reveal"><span class="sx-kicker">THE DRFX SUITE</span><h2 id="sxSuiteTitle">Two engines. <em>One account.</em></h2><p>SignalBridge executes the signals you already trust. Scalper Pro finds new ones on gold. One sign-in, one command center, one Telegram bot for both.</p></div>
  <div class="sx-suite-grid">
   <a class="sx-product sx-reveal" href="#plans" data-sx-tilt>
    <span class="sx-product-glow" aria-hidden="true"></span>
    <span class="sx-product-tag">EXECUTION</span>
    <h3>SignalBridge</h3>
    <p>TradingView alerts and Telegram signals become MT5 orders in milliseconds, through your own private webhook and EA licence.</p>
    <ul><li>Private TradingView webhook</li><li>Telegram channel routing</li><li>TP1/TP2/TP3, break-even and daily drawdown guard</li></ul>
    <span class="sx-product-cta">30 days free · then from $47 <b>→</b></span>
   </a>
   <a class="sx-product sx-product-gold sx-reveal" href="#scalper" data-sx-tilt>
    <span class="sx-product-glow" aria-hidden="true"></span>
    <span class="sx-product-tag">NEW · DISCOVERY</span>
    <h3>Scalper Pro</h3>
    <p>An AI liquidity radar for XAUUSD. It maps the sweep, marks the zone smart money will defend, and scores the trade before you take it.</p>
    <ul><li>LIT sweeps, FVG and Order Blocks</li><li>Calibrated win %, reach % and EV in R</li><li>One-click limit orders with risk sizing</li></ul>
    <span class="sx-product-cta">7 days free · then $19/month <b>→</b></span>
   </a>
  </div>
 </div>
</section>
`;

export const SX_SCALPER_HTML = String.raw`<section id="scalper" class="sx-scalper" aria-labelledby="sxScalperTitle">
 <div class="sx-aurora" aria-hidden="true"><i></i><i></i><i></i></div>
 <div class="sx-wrap">
  <div class="sx-hero">
   <div class="sx-hero-copy sx-reveal">
    <span class="sx-kicker"><span class="sx-dot"></span>NEW · DRFX SCALPER PRO FOR MT5</span>
    <h2 id="sxScalperTitle">Stop guessing where gold turns. <em>See it before it moves.</em></h2>
    <p class="sx-lead">Gold sweeps the obvious highs and lows, traps late traders, then runs from a zone most people never marked. Scalper Pro reads that story in one click: the liquidity that was taken, the zone left behind, and the odds that price respects it.</p>
    <ul class="sx-checks">
     <li><b>Finds the sweep.</b> Asia range, previous-day high and low, equal highs and lows.</li>
     <li><b>Marks the zone.</b> The FVG and Order Block behind every CHoCH or BOS.</li>
     <li><b>Scores the trade.</b> Win %, reach % and expected value, graded A+ to C.</li>
     <li><b>Places it for you.</b> Risk-sized limit orders, or fully automatic with AUTO + TRADE.</li>
    </ul>
    <div class="sx-ctas">
     <button type="button" class="sx-btn sx-btn-gold" data-sx-open="scalper"><span>Start 7-day free trial</span><b>↗</b></button>
     <a class="sx-btn sx-btn-ghost" href="#sxPricing">See plans · from $${PRICE.m1}</a>
    </div>
    <p class="sx-fine">No card for the trial · every feature unlocked · one licence per MT5 account</p>
   </div>
   <div class="sx-stage sx-reveal" data-sx-tilt>
    <div class="sx-stage-frame">
     <div class="sx-stage-bar"><i></i><i></i><i></i><span>XAUUSD · M15 · DrFX Scalper Pro</span></div>
     <video id="sxVideo" class="sx-video" src="/media/scalper/promo.mp4" poster="/media/scalper/poster.jpg" muted loop playsinline preload="metadata" aria-label="Scalper Pro promo video: AI scan, setup cards and one-click orders"></video>
     <button type="button" class="sx-play" id="sxPlay" aria-label="Play or pause the promo video"><span>▶</span></button>
     <span class="sx-scanline" aria-hidden="true"></span>
    </div>
    <div class="sx-float sx-float-a"><b>A+</b><span>Win 71% · EV +0.42R</span></div>
    <div class="sx-float sx-float-b"><b>IDM ×3</b><span>Liquidity swept</span></div>
   </div>
  </div>

  <div class="sx-stats">
   <div class="sx-stat sx-reveal"><b data-sx-count="7">0</b><span>day free trial, no card</span></div>
   <div class="sx-stat sx-reveal"><b data-sx-count="8000" data-sx-sep>0</b><span>bars of your symbol trained</span></div>
   <div class="sx-stat sx-reveal"><b data-sx-count="30" data-sx-suffix=" fps">0</b><span>live canvas panel</span></div>
   <div class="sx-stat sx-reveal"><b data-sx-count="1" data-sx-suffix=" click">0</b><span>from setup to order</span></div>
  </div>

  <div class="sx-tour sx-reveal" id="sxTour">
   <div class="sx-tour-list" role="tablist" aria-label="Scalper Pro tour">
    <button type="button" role="tab" aria-selected="true" data-sx-shot="scan"><b>01 · AI Scan</b><span>A light beam sweeps the chart while the radar reads structure, liquidity and inducement.</span><i></i></button>
    <button type="button" role="tab" aria-selected="false" data-sx-shot="setups"><b>02 · Setup cards</b><span>Every zone gets a grade, a win ring, reach % and EV, drawn right onto the candles.</span><i></i></button>
    <button type="button" role="tab" aria-selected="false" data-sx-shot="live"><b>03 · Ready in seconds</b><span>Bias, H4/M15 structure and model quality at a glance.</span><i></i></button>
    <button type="button" role="tab" aria-selected="false" data-sx-shot="trial"><b>04 · Start free</b><span>Seven days with every feature. One click, no card.</span><i></i></button>
    <button type="button" role="tab" aria-selected="false" data-sx-shot="taken"><b>05 · One licence, one terminal</b><span>Move your licence to a new terminal in one click.</span><i></i></button>
   </div>
   <figure class="sx-tour-view"><img id="sxShot" src="/media/scalper/scan.webp" alt="Scalper Pro AI scan sweeping an XAUUSD chart" width="1600" height="900" loading="lazy"><figcaption>Screens are illustrative and show demonstration chart data.</figcaption></figure>
  </div>

  <div class="sx-head sx-reveal" id="sxPricing"><span class="sx-kicker">SCALPER PRO PLANS</span><h2>Pro-grade gold analysis. <em>Simple pricing.</em></h2><p>Paid days start after any time you have left, so buying during the trial never costs you a free day. Pay with crypto, get your key instantly in your portal and on Telegram.</p></div>
  <div class="sx-prices">
   <article class="sx-price sx-reveal"><span class="sx-price-tag">TRY IT</span><h3>Free trial</h3><div class="sx-amount">$0<small>/ 7 days</small></div><ul><li>Every feature unlocked</li><li>No card, no sign-up in MT5</li><li>Once per trading account</li></ul><button type="button" class="sx-btn sx-btn-ghost" data-sx-open="scalper">Download &amp; start</button></article>
   <article class="sx-price sx-reveal"><span class="sx-price-tag">FLEXIBLE</span><h3>Monthly</h3><div class="sx-amount">$${PRICE.m1}<small>/ 30 days</small></div><ul><li>Full AI scan and auto trading</li><li>Key delivered instantly</li><li>Locked to your MT5 account</li></ul><button type="button" class="sx-btn sx-btn-ghost" data-sx-open="scalper" data-sx-plan="scalper_1m">Get Monthly</button></article>
   <article class="sx-price sx-price-best sx-reveal"><span class="sx-price-ribbon">BEST VALUE · SAVE 14%</span><span class="sx-price-tag">COMMITTED</span><h3>3 Months</h3><div class="sx-amount">$${PRICE.m3}<small>/ 90 days</small></div><ul><li>Everything in Monthly</li><li>$16.33 a month</li><li>Lowest price per day</li></ul><button type="button" class="sx-btn sx-btn-gold" data-sx-open="scalper" data-sx-plan="scalper_3m">Get 3 Months</button></article>
  </div>

  <div class="sx-flow sx-reveal" aria-label="How to buy and install">
   <div class="sx-flow-step"><b>1</b><h4>Sign in</h4><p>Email or Telegram, in the Client Portal.</p></div>
   <div class="sx-flow-step"><b>2</b><h4>Enter your MT5 number</h4><p>Your key is locked to that account.</p></div>
   <div class="sx-flow-step"><b>3</b><h4>Pay with crypto</h4><p>Secure NOWPayments invoice.</p></div>
   <div class="sx-flow-step"><b>4</b><h4>Paste your key</h4><p>It appears in the portal and in Telegram. Press ACTIVATE in the EA.</p></div>
  </div>

  <div class="sx-faq sx-reveal">
   <details><summary>Which symbols and timeframes does it support?</summary><p>Scalper Pro is built and trained for XAUUSD. It works best with M15 setups and an H4 bias, and both are adjustable in the inputs.</p></details>
   <details><summary>Do I need a VPS or an internet connection for the licence?</summary><p>No. Keys are signed offline and checked inside MetaTrader. A VPS only matters if you want AUTO + TRADE to run while your computer is off.</p></details>
   <details><summary>Can I use it on two terminals?</summary><p>One licence runs on one terminal at a time. If you open it on another terminal, the panel offers to move it there in one click.</p></details>
   <details><summary>What happens when my trial ends?</summary><p>The panel locks until you enter a key. Buy in the portal and paste the key; paid days add on top of any time you have left.</p></details>
   <details><summary>Does it guarantee profits?</summary><p>No tool does. Scalper Pro shows you the setup and its historical odds on your own symbol. You decide the risk. Trading involves substantial risk of loss.</p></details>
  </div>
 </div>
</section>
`;

export const SX_MOBILE_CTA_HTML = String.raw`<div class="sx-mobile-cta" id="sxMobileCta" aria-hidden="true"><div><b>Scalper Pro</b><span>7 days free · then $${PRICE.m1}/mo</span></div><button type="button" data-sx-open="scalper" tabindex="-1">Start free</button></div>
`;

export const SX_PORTAL_SCALPER_HTML = String.raw`<section class="sx-sp" id="scalperPanel" aria-labelledby="spTitle">
 <div class="sx-sp-hero">
  <div class="sx-sp-radar" aria-hidden="true"><i></i><i></i><i></i><span></span></div>
  <div><span class="section-kicker">DRFX SCALPER PRO · XAUUSD</span><h3 id="spTitle">Your gold liquidity radar</h3><p>Buy a licence for your MT5 account and your key arrives here and in Telegram as soon as the payment confirms.</p></div>
  <span class="sx-sp-status" id="spStatus" data-state="idle">Checking…</span>
 </div>
 <div class="sx-sp-grid">
  <article class="sx-sp-card sx-sp-buy">
   <h4>Get a licence key</h4>
   <ol class="sx-sp-steps" aria-hidden="true"><li data-on>Account</li><li>Plan</li><li>Pay</li></ol>
   <label for="spLogin">MT5 ACCOUNT NUMBER</label>
   <div class="sx-sp-input"><input id="spLogin" inputmode="numeric" autocomplete="off" maxlength="19" placeholder="e.g. 51234567" aria-describedby="spLoginHint"><span id="spLoginOk" aria-hidden="true">✓</span></div>
   <p class="sx-sp-hint" id="spLoginHint">In MT5 it is the number in the Navigator under <b>Accounts</b>, or in the window title. The key only works on this account.</p>
   <div class="sx-sp-plans" role="radiogroup" aria-label="Scalper Pro plan">
    <button type="button" role="radio" aria-checked="false" data-sp-plan="scalper_1m"><b>Monthly</b><span>$${PRICE.m1}</span><small>30 days</small></button>
    <button type="button" role="radio" aria-checked="true" data-sp-plan="scalper_3m"><em>SAVE 14%</em><b>3 Months</b><span>$${PRICE.m3}</span><small>90 days</small></button>
   </div>
   <button type="button" class="sx-sp-pay" id="spPay"><span id="spPayLabel">Pay $${PRICE.m3} with crypto</span><b>→</b></button>
   <p class="sx-sp-msg" id="spMsg" role="status"></p>
   <p class="sx-sp-hint">Paid days add on top of any time you have left. Every account also gets a free 7-day trial inside the EA.</p>
  </article>
  <article class="sx-sp-card sx-sp-keys">
   <div class="sx-sp-row"><h4>My licence keys</h4><button type="button" class="plain-action" id="spRefresh">Refresh ↻</button></div>
   <div id="spKeys" class="sx-sp-list"><p class="sx-sp-empty">No keys yet. Your first key appears here right after payment.</p></div>
   <h5>Orders</h5>
   <div id="spOrders" class="sx-sp-list sx-sp-orders"><p class="sx-sp-empty">No orders yet.</p></div>
  </article>
 </div>
 <article class="sx-sp-card sx-sp-install">
  <div class="sx-sp-row"><h4>Install in four steps</h4><a class="sx-sp-download" id="spDownload" href="#" aria-disabled="true">Download EA</a></div>
  <ol class="sx-sp-guide">
   <li><b>Copy the EA.</b> MT5 → File → Open Data Folder → <code>MQL5/Experts</code>, paste <code>DrFX_Scalper_Pro.ex5</code>, then Refresh the Navigator.</li>
   <li><b>Attach it.</b> Drag DrFX Scalper Pro onto an XAUUSD chart (M15) and tick <i>Allow Algo Trading</i>.</li>
   <li><b>Start free or activate.</b> Press START 7-DAY FREE TRIAL, or ENTER LICENCE KEY → paste your key → ACTIVATE.</li>
   <li><b>Scan and trade.</b> Press AI SCAN, then BUY/SELL LIMIT on a card, or switch on AUTO + TRADE.</li>
  </ol>
  <p class="sx-sp-hint">Trading involves risk. Win % and EV are historical estimates on your symbol, not promises.</p>
 </article>
</section>
`;

export const SX_CSS = String.raw`
.sx-progress{position:fixed;top:0;left:0;height:2px;width:100%;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,#b38f24,#f3d98b,#38db9e);z-index:60;pointer-events:none}
.sx-announce{position:relative;z-index:41;display:flex;align-items:center;gap:12px;height:36px;padding:0 14px;background:linear-gradient(90deg,#1a1405,#0b0d12 40%,#0b0d12 60%,#1a1405);border-bottom:1px solid #d4af3730;color:#e8dcb8;font:500 12px/1 "Plus Jakarta Sans",system-ui,sans-serif;text-decoration:none;overflow:hidden}
.sx-announce-new{flex:none;padding:3px 7px;border-radius:5px;background:#d4af37;color:#030406;font:700 10px/1.2 "JetBrains Mono",monospace;letter-spacing:.08em;animation:sxPulse 2.4s infinite}
.sx-announce-track{flex:1;min-width:0;display:flex;gap:40px;white-space:nowrap;mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.sx-announce-track span{flex:none;animation:sxMarquee 28s linear infinite}
.sx-announce-cta{flex:none;color:#f3d98b;font-weight:700}
.sx-announce:hover .sx-announce-track span{animation-play-state:paused}
@keyframes sxMarquee{to{transform:translateX(calc(-100% - 40px))}}
@keyframes sxPulse{0%,100%{box-shadow:0 0 0 0 #d4af3780}50%{box-shadow:0 0 0 6px #d4af3700}}
.sx-wrap{max-width:80rem;margin:0 auto;padding:0 16px}
@media(min-width:640px){.sx-wrap{padding:0 32px}}
.sx-head{max-width:46rem;margin:0 auto 44px;text-align:center}
.sx-kicker{display:inline-flex;align-items:center;gap:8px;font:600 11px/1.4 "JetBrains Mono",monospace;letter-spacing:.16em;color:#d4af37;text-transform:uppercase}
.sx-dot{width:7px;height:7px;border-radius:50%;background:#38db9e;box-shadow:0 0 12px #38db9e;animation:sxPulse 2s infinite}
.sx-head h2,.sx-hero h2{margin:12px 0 0;color:#fff;font:600 clamp(30px,5vw,52px)/1.05 "Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:-.035em}
.sx-head h2 em,.sx-hero h2 em{font:italic 400 1.04em/1 "Instrument Serif",Georgia,serif;letter-spacing:-.01em;background:linear-gradient(100deg,#b38f24,#f7e7b4 45%,#d4af37 60%,#b38f24);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sxShine 6s ease-in-out infinite}
@keyframes sxShine{50%{background-position:100% 0}}
.sx-head p{margin:16px auto 0;color:#94a3b8;font-size:17px;line-height:1.7;font-weight:300}
.sx-reveal{opacity:0;transform:translateY(28px) scale(.985);transition:opacity .9s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.22,1,.36,1)}
.sx-reveal.sx-in{opacity:1;transform:none}
.sx-suite{position:relative;z-index:10;padding:96px 0;border-top:1px solid #ffffff12}
.sx-suite-grid{display:grid;gap:24px}
@media(min-width:900px){.sx-suite-grid{grid-template-columns:1fr 1fr}}
.sx-product{--rx:0deg;--ry:0deg;position:relative;display:flex;flex-direction:column;gap:14px;padding:34px;border-radius:22px;background:linear-gradient(160deg,#10141c,#07090d 70%);border:1px solid #ffffff14;color:#cbd5e1;text-decoration:none;overflow:hidden;transform:perspective(900px) rotateX(var(--rx)) rotateY(var(--ry));transition:transform .25s ease,border-color .3s,box-shadow .3s}
.sx-product:hover{border-color:#d4af3766;box-shadow:0 30px 80px #000a,0 0 0 1px #d4af3722}
.sx-suite-grid{perspective:1200px}
.sx-product.sx-in{transform:perspective(1100px) rotateX(var(--rx)) rotateY(var(--ry)) translateY(var(--sx-lift,0px));transform-style:preserve-3d;overflow:visible;isolation:isolate;transition:transform .22s ease-out,border-color .3s,box-shadow .3s}
.sx-product:before{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(420px circle at var(--sx-x,50%) var(--sx-y,50%),#f7e7b42b,transparent 65%);opacity:0;transition:opacity .25s;pointer-events:none;transform:translateZ(1px)}
.sx-product:after{content:"";position:absolute;inset:4px;border-radius:inherit;border:1px solid #d4af3726;box-shadow:0 10px 0 -3px #090e17,0 22px 50px #0009;transform:translateZ(-8px);pointer-events:none;z-index:-1}
.sx-product>:not(.sx-product-glow){position:relative;transform:translateZ(20px)}
.sx-product h3{transform:translateZ(32px)}
.sx-product-glow{transform:translateZ(2px)}
.sx-product:focus-visible{outline:2px solid #f3d98b;outline-offset:6px;border-color:#d4af3799;box-shadow:0 20px 60px #d4af3720}
@media(hover:hover) and (pointer:fine){.sx-product.sx-pointer-active{--sx-lift:-5px;border-color:#f3d98b88;box-shadow:0 28px 70px #000b,0 0 36px #d4af371a}.sx-product.sx-pointer-active:before{opacity:1}.sx-product.sx-pointer-active .sx-product-glow{opacity:1}}
@media(prefers-reduced-motion:reduce),(hover:none),(pointer:coarse){.sx-product.sx-in{transform:none!important}.sx-product>:not(.sx-product-glow),.sx-product:before,.sx-product:after,.sx-product-glow{transform:none}.sx-product-glow{animation:none}.sx-product:after{box-shadow:0 8px 22px #0006}}

.sx-product-glow{position:absolute;inset:-1px;border-radius:inherit;padding:1px;background:conic-gradient(from var(--sx-a,0deg),transparent 0 70%,#d4af37 80%,#38db9e 88%,transparent 95%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:.0;transition:opacity .4s;animation:sxSpin 5s linear infinite;pointer-events:none}
.sx-product:hover .sx-product-glow,.sx-product-gold .sx-product-glow{opacity:1}
@property --sx-a{syntax:"<angle>";inherits:false;initial-value:0deg}
@keyframes sxSpin{to{--sx-a:360deg}}
.sx-product-gold{background:radial-gradient(ellipse at 100% 0,#d4af3722,transparent 55%),linear-gradient(160deg,#141109,#07090d 70%)}
.sx-product-tag{align-self:flex-start;padding:4px 9px;border-radius:999px;border:1px solid #d4af3755;color:#f3d98b;font:600 10px/1.3 "JetBrains Mono",monospace;letter-spacing:.14em}
.sx-product h3{margin:0;color:#fff;font:600 30px/1.1 "Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:-.03em}
.sx-product p{margin:0;color:#94a3b8;line-height:1.7}
.sx-product ul{margin:4px 0 0;padding:0;list-style:none;display:grid;gap:8px;font-size:14px}
.sx-product li:before{content:"✦";color:#38db9e;margin-right:10px}
.sx-product-cta{margin-top:auto;padding-top:14px;color:#f3d98b;font:600 13px/1.4 "JetBrains Mono",monospace}
.sx-product-cta b{display:inline-block;transition:transform .25s}.sx-product:hover .sx-product-cta b{transform:translateX(6px)}
.sx-scalper{position:relative;z-index:10;padding:110px 0 96px;overflow:hidden;border-top:1px solid #ffffff12;background:linear-gradient(180deg,#05070a,#030406)}
.sx-aurora{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.sx-aurora i{position:absolute;width:520px;height:520px;border-radius:50%;filter:blur(90px);opacity:.22;animation:sxFloat 16s ease-in-out infinite}
.sx-aurora i:nth-child(1){background:#d4af37;top:-160px;right:-120px}
.sx-aurora i:nth-child(2){background:#10b981;top:35%;left:-220px;animation-delay:-5s;opacity:.12}
.sx-aurora i:nth-child(3){background:#b38f24;bottom:-200px;right:20%;animation-delay:-10s;opacity:.14}
@keyframes sxFloat{50%{transform:translate(60px,40px) scale(1.12)}}
.sx-hero{display:grid;gap:48px;align-items:center;margin-bottom:72px}
@media(min-width:1024px){.sx-hero{grid-template-columns:1fr 1.08fr}}
.sx-hero h2{font-size:clamp(32px,5vw,56px)}
.sx-lead{margin:20px 0 0;color:#cbd5e1;font-size:17px;line-height:1.75;font-weight:300}
.sx-checks{margin:24px 0 0;padding:0;list-style:none;display:grid;gap:12px;color:#94a3b8;font-size:15px;line-height:1.55}
.sx-checks li{position:relative;padding-left:30px}
.sx-checks li:before{content:"";position:absolute;left:0;top:3px;width:18px;height:18px;border-radius:6px;background:#10b98122 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2338db9e' stroke-width='3'%3E%3Cpath d='m5 12 5 5 9-10'/%3E%3C/svg%3E") center/12px no-repeat;border:1px solid #38db9e55}
.sx-checks b{color:#fff;font-weight:600}
.sx-ctas{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.sx-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;gap:10px;min-height:52px;padding:0 24px;border-radius:14px;font:600 14px/1 "Plus Jakarta Sans",system-ui,sans-serif;text-decoration:none;cursor:pointer;overflow:hidden;transition:transform .2s,box-shadow .3s,border-color .3s,background .3s}
.sx-btn:active{transform:scale(.97)}
.sx-btn-gold{border:0;color:#030406;background:linear-gradient(100deg,#d4af37,#f7e7b4 50%,#d4af37);background-size:200% 100%;box-shadow:0 14px 44px #d4af3755;animation:sxShine 5s ease-in-out infinite}
.sx-btn-gold:hover{box-shadow:0 18px 60px #d4af3788;transform:translateY(-2px)}
.sx-btn-gold:after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,#fff9 50%,transparent 70%);transform:translateX(-120%);animation:sxGlint 3.6s ease-in-out infinite}
@keyframes sxGlint{60%,100%{transform:translateX(120%)}}
.sx-btn-ghost{border:1px solid #ffffff26;color:#fff;background:#ffffff08}
.sx-btn-ghost:hover{border-color:#d4af3788;background:#d4af3714}
.sx-fine{margin:14px 0 0;color:#64748b;font:500 12px/1.5 "JetBrains Mono",monospace}
.sx-stage{--rx:0deg;--ry:0deg;position:relative;transform:perspective(1200px) rotateX(var(--rx)) rotateY(var(--ry));transition:transform .3s ease}
.sx-stage-frame{position:relative;border-radius:18px;overflow:hidden;border:1px solid #d4af3755;background:#07090d;box-shadow:0 40px 120px #000c,0 0 80px #d4af3722}
.sx-stage-bar{display:flex;align-items:center;gap:6px;height:32px;padding:0 12px;background:#0d1016;border-bottom:1px solid #ffffff12;color:#94a3b8;font:500 11px/1 "JetBrains Mono",monospace}
.sx-stage-bar i{width:9px;height:9px;border-radius:50%;background:#334155}.sx-stage-bar i:first-child{background:#ef4444aa}.sx-stage-bar i:nth-child(2){background:#eab308aa}.sx-stage-bar i:nth-child(3){background:#22c55eaa}
.sx-stage-bar span{margin-left:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sx-video{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#07090d}
.sx-play{position:absolute;right:14px;bottom:14px;width:44px;height:44px;border-radius:50%;border:1px solid #d4af3788;background:#030406cc;color:#f3d98b;font-size:14px;cursor:pointer;backdrop-filter:blur(8px);transition:transform .2s}
.sx-play:hover{transform:scale(1.08)}
.sx-scanline{position:absolute;left:0;right:0;top:32px;height:90px;background:linear-gradient(180deg,transparent,#38db9e1c,transparent);animation:sxScan 4.5s ease-in-out infinite;pointer-events:none}
@keyframes sxScan{0%{transform:translateY(-90px)}100%{transform:translateY(520px)}}
.sx-float{position:absolute;display:grid;gap:2px;padding:10px 14px;border-radius:12px;background:#0b0e14e6;border:1px solid #ffffff1f;backdrop-filter:blur(10px);box-shadow:0 18px 40px #000a;animation:sxBob 6s ease-in-out infinite}
.sx-float b{color:#38db9e;font:700 18px/1 "JetBrains Mono",monospace}.sx-float span{color:#cbd5e1;font-size:11px}
.sx-float-a{left:-14px;bottom:18%}.sx-float-b{right:-10px;top:16%;animation-delay:-3s}.sx-float-b b{color:#f3d98b}
@media(max-width:640px){.sx-float-a{left:6px;bottom:-22px}.sx-float-b{right:6px;top:-18px}}
@keyframes sxBob{50%{transform:translateY(-10px)}}
.sx-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:72px}
@media(min-width:900px){.sx-stats{grid-template-columns:repeat(4,minmax(0,1fr))}}
.sx-stat{padding:22px;border-radius:16px;border:1px solid #ffffff12;background:#ffffff05;text-align:center}
.sx-stat b{display:block;color:#f3d98b;font:600 clamp(26px,4vw,38px)/1.1 "JetBrains Mono",monospace}
.sx-stat span{display:block;margin-top:6px;color:#94a3b8;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
.sx-tour{display:grid;gap:22px;margin-bottom:96px}
@media(min-width:1024px){.sx-tour{grid-template-columns:.8fr 1.2fr;align-items:center}}
.sx-tour-list{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:4px}
@media(min-width:1024px){.sx-tour-list{flex-direction:column;overflow:visible}}
.sx-tour-list button{position:relative;flex:0 0 78%;scroll-snap-align:start;display:grid;gap:6px;text-align:left;padding:16px 18px;border-radius:14px;border:1px solid #ffffff14;background:#ffffff05;color:#94a3b8;cursor:pointer;overflow:hidden;transition:border-color .3s,background .3s}
@media(min-width:1024px){.sx-tour-list button{flex:none}}
.sx-tour-list b{color:#e2e8f0;font:600 14px/1.3 "Plus Jakarta Sans",system-ui,sans-serif}
.sx-tour-list span{font-size:13px;line-height:1.55}
.sx-tour-list i{position:absolute;left:0;bottom:0;height:2px;width:0;background:linear-gradient(90deg,#d4af37,#38db9e)}
.sx-tour-list [aria-selected=true]{border-color:#d4af3766;background:#d4af370f}
.sx-tour-list [aria-selected=true] b{color:#f3d98b}
.sx-tour-list [aria-selected=true] i{animation:sxBar 5.5s linear forwards}
.sx-tour.sx-paused [aria-selected=true] i{animation-play-state:paused}
@keyframes sxBar{to{width:100%}}
.sx-tour-view{margin:0;position:relative;border-radius:18px;overflow:hidden;border:1px solid #ffffff1a;box-shadow:0 30px 90px #000b}
.sx-tour-view img{display:block;width:100%;height:auto;transition:opacity .45s,transform .9s cubic-bezier(.22,1,.36,1)}
.sx-tour-view img.sx-swap{opacity:0;transform:scale(1.03)}
.sx-tour-view figcaption{position:absolute;left:12px;bottom:10px;padding:4px 8px;border-radius:6px;background:#030406b3;color:#94a3b8;font-size:11px}
.sx-prices{display:grid;gap:20px;margin-bottom:56px}
@media(min-width:900px){.sx-prices{grid-template-columns:repeat(3,minmax(0,1fr))}}
.sx-price{position:relative;display:flex;flex-direction:column;gap:12px;padding:30px;border-radius:20px;border:1px solid #ffffff14;background:linear-gradient(170deg,#0e1118,#07090d);transition:transform .3s,border-color .3s,box-shadow .3s}
.sx-price:hover{transform:translateY(-6px);border-color:#d4af3755;box-shadow:0 26px 70px #000a}
.sx-price h3{margin:0;color:#fff;font:600 22px/1.2 "Plus Jakarta Sans",system-ui,sans-serif}
.sx-price-tag{color:#64748b;font:600 10px/1 "JetBrains Mono",monospace;letter-spacing:.16em}
.sx-amount{color:#fff;font:600 48px/1 "JetBrains Mono",monospace;padding:12px 0 18px;border-bottom:1px solid #ffffff12}
.sx-amount small{margin-left:8px;color:#94a3b8;font-size:12px;font-weight:400}
.sx-price ul{margin:6px 0 10px;padding:0;list-style:none;display:grid;gap:10px;color:#cbd5e1;font-size:14px}
.sx-price li:before{content:"✦";color:#38db9e;margin-right:10px}
.sx-price .sx-btn{margin-top:auto;width:100%}
.sx-price-best{border-color:#d4af3788;background:radial-gradient(ellipse at 50% 0,#d4af3726,transparent 60%),linear-gradient(170deg,#141109,#07090d);box-shadow:0 0 0 1px #d4af3733,0 30px 90px #d4af3714}
.sx-price-best .sx-amount{color:#f3d98b}
.sx-price-ribbon{position:absolute;top:-12px;right:20px;padding:6px 10px;border-radius:999px;background:linear-gradient(90deg,#d4af37,#f7e7b4);color:#030406;font:700 10px/1 "JetBrains Mono",monospace;letter-spacing:.08em;box-shadow:0 8px 24px #d4af3755}
.sx-flow{position:relative;display:grid;gap:14px;margin-bottom:56px}
@media(min-width:900px){.sx-flow{grid-template-columns:repeat(4,minmax(0,1fr))}.sx-flow-step:not(:last-child):after{content:"";position:absolute;inset-inline-end:-11px;top:32px;width:6px;height:6px;border-top:1px solid #d4af3777;border-inline-end:1px solid #d4af3777;transform:rotate(45deg);pointer-events:none}body[dir=rtl] .sx-flow-step:not(:last-child):after{transform:rotate(-45deg)}}
.sx-flow-step{position:relative;padding:20px;border-radius:16px;background:#ffffff05;border:1px solid #ffffff12}
.sx-flow-step b{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#030406;border:1px solid #d4af37;color:#f3d98b;font:700 13px/1 "JetBrains Mono",monospace;box-shadow:0 0 18px #d4af3755}
.sx-flow-step h4{margin:14px 0 6px;color:#fff;font-size:15px;font-weight:600}
.sx-flow-step p{margin:0;color:#94a3b8;font-size:13px;line-height:1.6}
.sx-faq{max-width:52rem;margin:0 auto;display:grid;gap:10px}
.sx-faq details{border:1px solid #ffffff14;border-radius:14px;background:#ffffff04;transition:border-color .3s,background .3s}
.sx-faq details[open]{border-color:#d4af3755;background:#d4af370a}
.sx-faq summary{display:flex;justify-content:space-between;gap:12px;padding:16px 18px;color:#e2e8f0;font-weight:600;cursor:pointer;list-style:none}
.sx-faq summary::-webkit-details-marker{display:none}
.sx-faq summary:after{content:"+";color:#d4af37;font:400 22px/1 "JetBrains Mono",monospace;transition:transform .3s}
.sx-faq details[open] summary:after{transform:rotate(45deg)}
.sx-faq details p{margin:0;padding:0 18px 16px;color:#94a3b8;line-height:1.7}
.sx-mobile-cta{position:fixed;left:12px;right:12px;bottom:12px;z-index:45;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 10px 10px 16px;border-radius:16px;background:#0b0d12f2;border:1px solid #d4af3766;box-shadow:0 20px 50px #000c;backdrop-filter:blur(14px);transform:translateY(140%);transition:transform .45s cubic-bezier(.22,1,.36,1)}
.sx-mobile-cta.sx-show{transform:none}
.sx-mobile-cta b{display:block;color:#fff;font-size:14px}.sx-mobile-cta span{color:#94a3b8;font-size:12px}
.sx-mobile-cta button{border:0;border-radius:11px;padding:12px 16px;background:linear-gradient(100deg,#d4af37,#f7e7b4);color:#030406;font-weight:700;font-size:13px;cursor:pointer}
@media(min-width:768px){.sx-mobile-cta{display:none}}
body.sx-portal-open .sx-mobile-cta{display:none}
.sx-sp{display:grid;gap:16px;margin:18px auto 22px}
.sb-tab-scalper .sb-strip,.sb-tab-scalper .sb-kpis,.sb-tab-scalper .sb-grid,.sb-tab-scalper #executionFeedback{display:none!important}
#portalOverlay .sb-console:not(.sb-tab-scalper)~.sx-sp.sb-account-area{display:none!important}
#portalOverlay .sb-console.sb-tab-scalper~.sx-sp.sb-account-area{display:grid!important;max-width:1180px}
#portalOverlay .sb-console{position:relative;background:radial-gradient(ellipse at 100% 0,#e7c4770d,transparent 45%),#0a1019;box-shadow:0 30px 90px #000a,inset 0 1px #ffffff0a}
#portalOverlay .sb-console:before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;background:conic-gradient(from var(--sx-a,0deg),transparent 0 75%,#e7c47799 85%,#80d9e2aa 92%,transparent);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:sxSpin 9s linear infinite;pointer-events:none}
#portalOverlay .sb-top nav{position:relative}
#portalOverlay .sb-top nav button{transition:background .3s,border-color .3s,color .3s,transform .2s}
#portalOverlay .sb-top nav button.selected{box-shadow:0 0 22px #e7c47722}
#portalOverlay .sb-card{transition:transform .3s cubic-bezier(.22,1,.36,1),border-color .3s,box-shadow .3s}
#portalOverlay .sb-card:hover{transform:translateY(-2px);border-color:#e7c47755;box-shadow:0 18px 40px #0008}
#portalOverlay .sx-enter>.sb-kpis>*,#portalOverlay .sx-enter>.sb-grid>*{animation:sxPane .55s cubic-bezier(.22,1,.36,1) both}
#portalOverlay .sx-enter>.sb-grid>:nth-child(2){animation-delay:.05s}#portalOverlay .sx-enter>.sb-grid>:nth-child(3){animation-delay:.1s}#portalOverlay .sx-enter>.sb-grid>:nth-child(4){animation-delay:.15s}#portalOverlay .sx-enter>.sb-grid>:nth-child(n+5){animation-delay:.2s}
#portalOverlay .sb-dot{animation:sxPulse 2s infinite}
#portalOverlay .sx-sp.sx-enter{animation:sxPane .55s cubic-bezier(.22,1,.36,1) both}
.sx-sbtab-new{margin-left:6px;padding:2px 5px;border-radius:4px;background:#38db9e;color:#03130c;font:700 8px/1 "JetBrains Mono",monospace;letter-spacing:.05em;vertical-align:middle}
@media(max-width:760px){#portalOverlay .sb-mobile-tabs{grid-template-columns:repeat(5,1fr)!important}#portalOverlay .sb-mobile-tabs button span{font-size:10px}#portalOverlay .sb-mobile-tabs .sx-sbtab-new{display:none}#portalOverlay .sb-mobile-tabs button[data-sb-tab=scalper]{color:#f3d98b}}
@keyframes sxPane{from{opacity:0}to{opacity:1}}
.sx-sp{display:grid;gap:16px;margin:0 0 22px}
.sx-sp-hero{position:relative;display:grid;grid-template-columns:auto 1fr;gap:18px;align-items:center;padding:22px;border-radius:16px;border:1px solid #d4af3755;background:radial-gradient(ellipse at 0 50%,#d4af3720,transparent 55%),linear-gradient(160deg,#141109,#0a1019);overflow:hidden}
.sx-sp-hero h3{margin:4px 0;color:#fff;font-size:24px;letter-spacing:-.02em}
.sx-sp-hero p{margin:0;color:#a3b2c4;font-size:13px;line-height:1.6}
.sx-sp-radar{position:relative;width:76px;height:76px;border-radius:50%;border:1px solid #d4af3766;background:radial-gradient(circle,#38db9e22,transparent 70%)}
.sx-sp-radar i{position:absolute;inset:14px;border-radius:50%;border:1px solid #d4af3744}.sx-sp-radar i:nth-child(2){inset:26px}.sx-sp-radar i:nth-child(3){inset:37px;background:#38db9e;border:0;box-shadow:0 0 10px #38db9e}
.sx-sp-radar span{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,#38db9e66,transparent 25%);animation:sxRot 2.6s linear infinite}
@keyframes sxRot{to{transform:rotate(360deg)}}
.sx-sp-status{grid-column:1/-1;justify-self:start;padding:6px 10px;border-radius:999px;border:1px solid #2a3646;background:#0a1019;color:#a3b2c4;font:600 11px/1.2 "JetBrains Mono",monospace}
.sx-sp-status[data-state=active]{color:#38db9e;border-color:#38db9e66;background:#38db9e12}
.sx-sp-status[data-state=pending]{color:#f3d98b;border-color:#d4af3766}
.sx-sp-status[data-state=off]{color:#fca5a5;border-color:#ef444466}
@media(min-width:760px){.sx-sp-hero{grid-template-columns:auto 1fr auto}.sx-sp-status{grid-column:auto;justify-self:end}}
.sx-sp-grid{display:grid;gap:16px}
@media(min-width:900px){.sx-sp-grid{grid-template-columns:1fr 1fr}}
.sx-sp-card{padding:20px;border-radius:16px;border:1px solid #253545;background:#0d1520;min-width:0}
.sx-sp-card h4{margin:0 0 14px;color:#fff;font-size:17px}
.sx-sp-card h5{margin:18px 0 10px;color:#a3b2c4;font:600 11px/1 "JetBrains Mono",monospace;letter-spacing:.12em;text-transform:uppercase}
.sx-sp-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}.sx-sp-row h4{margin:0}
.sx-sp-steps{display:flex;gap:6px;margin:0 0 16px;padding:0;list-style:none;counter-reset:s}
.sx-sp-steps li{flex:1;counter-increment:s;padding-top:8px;border-top:2px solid #253545;color:#64748b;font:600 10px/1.2 "JetBrains Mono",monospace;letter-spacing:.08em;text-transform:uppercase;transition:color .3s,border-color .3s}
.sx-sp-steps li:before{content:counter(s) " · "}
.sx-sp-steps li[data-on]{border-color:#d4af37;color:#f3d98b}
.sx-sp-buy label{display:block;margin-bottom:6px;color:#a3b2c4;font:700 10px/1 "JetBrains Mono",monospace;letter-spacing:.12em}
.sx-sp-input{position:relative}
.sx-sp-input input{width:100%;min-height:50px;padding:12px 44px 12px 14px;border-radius:11px;border:1px solid #34485c;background:#081018;color:#fff;font:600 18px/1 "JetBrains Mono",monospace;letter-spacing:.06em;cursor:text!important;transition:border-color .25s,box-shadow .25s}
.sx-sp-input input:focus{outline:0;border-color:#d4af37;box-shadow:0 0 0 4px #d4af3722}
.sx-sp-input span{position:absolute;right:14px;top:50%;transform:translateY(-50%) scale(.4);opacity:0;color:#38db9e;font-weight:800;transition:.3s cubic-bezier(.34,1.56,.64,1)}
.sx-sp-input.sx-ok span{opacity:1;transform:translateY(-50%) scale(1)}
.sx-sp-input.sx-ok input{border-color:#38db9e88}
.sx-sp-hint{margin:8px 0 0;color:#7f90a4;font-size:12px;line-height:1.6}
.sx-sp-plans{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0}
.sx-sp-plans button{position:relative;display:grid!important;gap:2px;justify-items:start;text-align:left;min-height:0!important;padding:14px!important;border-radius:12px!important;border:1px solid #34485c!important;background:#0a1220!important;color:#cbd5e1;transition:transform .2s,border-color .25s,box-shadow .25s,background .25s!important}
.sx-sp-plans button b{color:#fff;font-size:14px}.sx-sp-plans button span{color:#f3d98b;font:700 22px/1.1 "JetBrains Mono",monospace}.sx-sp-plans button small{color:#7f90a4;font-size:11px}
.sx-sp-plans button em{position:absolute;top:-9px;right:10px;padding:3px 6px;border-radius:5px;background:#38db9e;color:#03130c;font:700 9px/1 "JetBrains Mono",monospace;font-style:normal}
.sx-sp-plans button[aria-checked=true]{border-color:#d4af37!important;background:linear-gradient(160deg,#1c1709,#0a1220)!important;box-shadow:0 0 0 3px #d4af3722;transform:translateY(-2px)}
.sx-sp-pay{position:relative;width:100%;display:flex!important;align-items:center;justify-content:space-between;min-height:54px!important;padding:0 18px!important;border:0!important;border-radius:12px!important;background:linear-gradient(100deg,#d4af37,#f7e7b4 50%,#d4af37)!important;background-size:200% 100%!important;color:#030406!important;font-weight:800!important;font-size:15px!important;overflow:hidden;animation:sxShine 5s ease-in-out infinite;box-shadow:0 12px 34px #d4af3744}
.sx-sp-pay:disabled{filter:grayscale(.7);opacity:.6!important;animation:none}
.sx-sp-pay b{transition:transform .25s}.sx-sp-pay:hover b{transform:translateX(5px)}
.sx-sp-pay.sx-busy b{animation:sxRot 1s linear infinite}
.sx-sp-msg{min-height:20px;margin:10px 0 0;color:#a3b2c4;font-size:13px}
.sx-sp-msg[data-tone=bad]{color:#fca5a5}.sx-sp-msg[data-tone=good]{color:#38db9e}
.sx-sp-list{display:grid;gap:10px}
.sx-sp-empty{margin:0;padding:18px;border-radius:12px;border:1px dashed #2f4256;color:#7f90a4;font-size:13px;text-align:center}
.sx-sp-key{padding:14px;border-radius:12px;border:1px solid #2f4256;background:linear-gradient(160deg,#0f1a27,#0a121c);animation:sxPane .5s cubic-bezier(.22,1,.36,1) both}
.sx-sp-key header{display:flex;justify-content:space-between;gap:8px;color:#a3b2c4;font-size:12px}
.sx-sp-key header b{color:#fff}
.sx-sp-key code{display:block;margin:10px 0;padding:10px;border-radius:9px;background:#060b12;border:1px solid #1f2d3c;color:#f3d98b;font:600 12px/1.5 "JetBrains Mono",monospace;word-break:break-all;letter-spacing:.03em}
.sx-sp-key code.sx-mask{color:#5d6f84;filter:blur(.4px)}
.sx-sp-key div{display:flex;gap:8px}
.sx-sp-key div button{flex:1;min-height:38px;padding:6px 10px;border-radius:9px;border:1px solid #34485c;background:#142131;color:#e3ebf5;font:600 12.5px/1 "Plus Jakarta Sans",system-ui,sans-serif;cursor:pointer;transition:background .2s,border-color .2s,transform .15s}.sx-sp-key div button:hover{border-color:#d4af37}.sx-sp-key div button:active{transform:scale(.97)}.sx-sp-key div button.sx-copy{border-color:#d4af37;background:linear-gradient(100deg,#d4af37,#f3d98b);color:#030406}
.sx-sp-order{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;background:#0a121c;border:1px solid #1f2d3c;color:#a3b2c4;font-size:12px}
.sx-sp-order b{color:#e2e8f0}
.sx-chip{padding:4px 8px;border-radius:999px;font:700 10px/1 "JetBrains Mono",monospace;letter-spacing:.06em;text-transform:uppercase}
.sx-chip[data-s=paid]{background:#38db9e1a;color:#38db9e}.sx-chip[data-s=pending]{background:#d4af371a;color:#f3d98b}.sx-chip[data-s=failed]{background:#ef44441a;color:#fca5a5}
.sx-sp-order a{color:#f3d98b}
.sx-sp-download{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:#d4af37;color:#030406;font-weight:700;font-size:13px;text-decoration:none}
.sx-sp-download[aria-disabled=true]{background:#1b2a3c;color:#7f90a4;pointer-events:none}
.sx-sp-guide{margin:0;padding:0;list-style:none;display:grid;gap:10px;counter-reset:g}
@media(min-width:900px){.sx-sp-guide{grid-template-columns:repeat(4,minmax(0,1fr))}}
.sx-sp-guide li{counter-increment:g;position:relative;padding:40px 14px 14px;border-radius:12px;background:#0a121c;border:1px solid #1f2d3c;color:#a3b2c4;font-size:12.5px;line-height:1.6}
.sx-sp-guide li:before{content:counter(g);position:absolute;left:14px;top:12px;display:grid;place-items:center;width:22px;height:22px;border-radius:50%;border:1px solid #d4af37;color:#f3d98b;font:700 11px/1 "JetBrains Mono",monospace}
.sx-sp-guide b{color:#fff}.sx-sp-guide code{color:#80d9e2;font-size:11.5px}
@media(max-width:759px){
 .sx-sp-hero{padding:16px}.sx-sp-radar{width:56px;height:56px}.sx-sp-hero h3{font-size:20px}
}
body[dir=rtl] .sx-checks li{padding-left:0;padding-right:30px}body[dir=rtl] .sx-checks li:before{left:auto;right:0}
body[dir=rtl] .sx-tour-list button{text-align:right}
@media(prefers-reduced-motion:reduce){.sx-reveal{opacity:1;transform:none}.sx-announce-track span{animation:none}}
`;

export const SX_JS = String.raw`
(()=>{'use strict';
const q=(s,r=document)=>r.querySelector(s),qa=(s,r=document)=>[...r.querySelectorAll(s)];
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
/* scroll progress + mobile CTA */
const bar=q('#sxProgress'),cta=q('#sxMobileCta');
let ticking=false;
function onScroll(){ticking=false;const h=document.documentElement,max=h.scrollHeight-h.clientHeight;if(bar)bar.style.transform='scaleX('+(max>0?h.scrollTop/max:0)+')';if(cta){const show=h.scrollTop>700;cta.classList.toggle('sx-show',show);cta.setAttribute('aria-hidden',String(!show));const b=q('button',cta);if(b)b.tabIndex=show?0:-1;}}
addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});onScroll();
/* reveal + counters */
function count(el){const end=+el.dataset.sxCount,suf=el.dataset.sxSuffix||'',sep='sxSep' in el.dataset,t0=performance.now(),d=reduced?1:1600;
 const fmt=v=>(sep?Math.round(v).toLocaleString('en-US'):Math.round(v))+suf;
 (function step(t){const p=Math.min(1,(t-t0)/d),e=1-Math.pow(1-p,4);el.textContent=fmt(end*e);if(p<1)requestAnimationFrame(step)})(t0);}
const io='IntersectionObserver' in window?new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){e.target.classList.add('sx-in');qa('[data-sx-count]',e.target).forEach(count);io.unobserve(e.target)}},{threshold:.14,rootMargin:'0px 0px -6% 0px'}):null;
setTimeout(()=>qa('.sx-reveal').forEach(el=>el.classList.add('sx-in')),3500);
qa('.sx-reveal').forEach((el,i)=>{el.style.transitionDelay=(i%4)*90+'ms';if(io)io.observe(el);else{el.classList.add('sx-in');qa('[data-sx-count]',el).forEach(count)}});
/* Pointer tilt is independent of the reveal animation; touch keeps native scrolling. */
const tiltMotion=matchMedia('(prefers-reduced-motion: reduce)'),tiltPointer=matchMedia('(hover: hover) and (pointer: fine)');
qa('[data-sx-tilt]').forEach(el=>{
 let frame=0,bounds=null,px=0,py=0;
 function reset(){cancelAnimationFrame(frame);frame=0;bounds=null;el.classList.remove('sx-pointer-active');el.style.setProperty('--ry','0deg');el.style.setProperty('--rx','0deg');el.style.removeProperty('--sx-x');el.style.removeProperty('--sx-y')}
 function paint(){frame=0;if(tiltMotion.matches||!tiltPointer.matches)return reset();const x=Math.max(0,Math.min(1,px)),y=Math.max(0,Math.min(1,py));el.style.setProperty('--ry',((x-.5)*12).toFixed(2)+'deg');el.style.setProperty('--rx',((.5-y)*10).toFixed(2)+'deg');el.style.setProperty('--sx-x',(x*100).toFixed(1)+'%');el.style.setProperty('--sx-y',(y*100).toFixed(1)+'%');el.classList.add('sx-pointer-active')}
 el.addEventListener('pointerenter',()=>{bounds=el.getBoundingClientRect()});
 el.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||tiltMotion.matches||!tiltPointer.matches)return;if(!bounds)bounds=el.getBoundingClientRect();px=(e.clientX-bounds.left)/bounds.width;py=(e.clientY-bounds.top)/bounds.height;if(!frame)frame=requestAnimationFrame(paint)},{passive:true});
 el.addEventListener('pointerleave',reset);el.addEventListener('pointercancel',reset);el.addEventListener('blur',reset);tiltMotion.addEventListener('change',reset);tiltPointer.addEventListener('change',reset);addEventListener('resize',reset,{passive:true});addEventListener('scroll',reset,{passive:true});
});
/* promo video: plays while on screen */
const vid=q('#sxVideo'),play=q('#sxPlay');let userPaused=false;
function vstate(){if(play)q('span',play).textContent=vid&&!vid.paused?'❚❚':'▶'}
if(vid){vid.addEventListener('play',vstate);vid.addEventListener('pause',vstate);
 if('IntersectionObserver' in window&&!reduced)new IntersectionObserver(es=>{for(const e of es){if(e.isIntersecting&&!userPaused)vid.play().catch(()=>{});else if(!e.isIntersecting)vid.pause()}},{threshold:.35}).observe(vid);
 play&&play.addEventListener('click',()=>{if(vid.paused){userPaused=false;vid.play().catch(()=>{})}else{userPaused=true;vid.pause()}});}
/* product tour */
const tour=q('#sxTour'),shot=q('#sxShot');
if(tour&&shot){const tabs=qa('[data-sx-shot]',tour),alts={scan:'Scalper Pro AI scan sweeping an XAUUSD chart',setups:'Setup cards with win rings next to FVG and OB zones',live:'Scalper Pro panel ready to scan',trial:'7-day free trial screen',taken:'Licence move prompt for a new terminal'};let idx=0,timer=null;
 qa('[data-sx-shot]',tour).forEach(b=>{const im=new Image();im.decoding='async';b.addEventListener('pointerenter',()=>{if(!im.src)im.src='/media/scalper/'+b.dataset.sxShot+'.webp'},{once:true})});
 function pick(i,user){idx=(i+tabs.length)%tabs.length;const b=tabs[idx];tabs.forEach(t=>t.setAttribute('aria-selected',String(t===b)));
  shot.classList.add('sx-swap');setTimeout(()=>{shot.src='/media/scalper/'+b.dataset.sxShot+'.webp';shot.alt=alts[b.dataset.sxShot]||'';shot.onload=()=>shot.classList.remove('sx-swap');setTimeout(()=>shot.classList.remove('sx-swap'),600)},220);
  if(user&&innerWidth<1024)b.scrollIntoView({block:'nearest',inline:'center',behavior:reduced?'auto':'smooth'});arm();}
 function arm(){clearTimeout(timer);if(!reduced)timer=setTimeout(()=>pick(idx+1),5500)}
 tabs.forEach((b,i)=>b.addEventListener('click',()=>pick(i,true)));
 tour.addEventListener('pointerenter',()=>{tour.classList.add('sx-paused');clearTimeout(timer)});tour.addEventListener('pointerleave',()=>{tour.classList.remove('sx-paused');arm()});
 if('IntersectionObserver' in window)new IntersectionObserver(es=>{for(const e of es){if(e.isIntersecting)arm();else clearTimeout(timer)}}).observe(tour);}

/* ---------- portal: Scalper Pro tab inside the command center ---------- */
const overlay=q('#portalOverlay'),root=q('#connectionActions');let want=null;
function sbTab(name){const b=root&&q('nav [data-sb-tab="'+name+'"]',root);if(b)b.click()}
function enter(el){if(!el||reduced)return;el.classList.remove('sx-enter');void el.offsetWidth;el.classList.add('sx-enter')}
if(root){root.addEventListener('click',e=>{if(e.target.closest('[data-sb-tab]'))root.classList.remove('sb-tab-scalper')},true);
 root.addEventListener('click',e=>{const b=e.target.closest('[data-sb-tab]');if(!b)return;const t=b.dataset.sbTab;root.querySelectorAll('[data-sb-tab]').forEach(x=>{x.classList.toggle('selected',x.dataset.sbTab===t);x.setAttribute('aria-pressed',String(x.dataset.sbTab===t))});
  if(t==='scalper'){spLoad();enter(q('#scalperPanel'))}else enter(root);
  if(b.closest('.sb-mobile-tabs')&&overlay)overlay.scrollTo({top:0,behavior:reduced?'auto':'smooth'})});}
if(overlay)new MutationObserver(()=>{const open=!overlay.classList.contains('hidden');document.body.classList.toggle('sx-portal-open',open);if(open&&want){const w=want;want=null;setTimeout(()=>sbTab(w),60)}}).observe(overlay,{attributes:true,attributeFilter:['class']});
/* website buttons that open the portal on Scalper Pro */
qa('[data-sx-open]').forEach(b=>b.addEventListener('click',()=>{want=b.dataset.sxOpen;if(b.dataset.sxPlan)setPlan(b.dataset.sxPlan);const o=q('#loginOpen');if(o)o.click()}));

/* ---------- portal: Scalper Pro licences ---------- */
const SP={plan:'scalper_3m',data:null,busy:false,reveal:new Set()};
const PRICES={scalper_1m:${PRICE.m1},scalper_3m:${PRICE.m3}},LABEL={scalper_1m:'Monthly',scalper_3m:'3 Months'};
const loginRe=/^[1-9][0-9]{3,18}$/;
function msg(text,tone){const m=q('#spMsg');if(m){m.textContent=text||'';m.dataset.tone=tone||''}}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])}
function setPlan(p){if(!PRICES[p])return;SP.plan=p;qa('[data-sp-plan]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.spPlan===p)));const l=q('#spPayLabel');if(l)l.textContent='Pay $'+PRICES[p]+' with crypto';steps()}
function steps(){const ok=loginRe.test((q('#spLogin')?.value||'').trim()),li=qa('.sx-sp-steps li');li.forEach((x,i)=>{if(i===0||i===1&&ok||i===2&&ok&&SP.plan)x.setAttribute('data-on','');else x.removeAttribute('data-on')});q('.sx-sp-input')?.classList.toggle('sx-ok',ok)}
qa('[data-sp-plan]').forEach(b=>b.addEventListener('click',()=>setPlan(b.dataset.spPlan)));
const login=q('#spLogin');if(login)login.addEventListener('input',()=>{const v=login.value.replace(/\D+/g,'').slice(0,19);if(v!==login.value)login.value=v;steps()});
function fmtDate(s){const d=new Date(String(s||'').replace(' ','T')+(/[zZ]|[+-]\d\d:?\d\d$/.test(String(s))?'':'Z'));return isNaN(d)?'':d.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'})}
function render(){const d=SP.data;if(!d)return;const st=q('#spStatus'),keys=d.keys||[],orders=d.orders||[];
 const pending=orders.some(o=>o.status==='pending');
 if(st){if(keys.length){st.dataset.state='active';st.textContent='● '+keys.length+' key'+(keys.length>1?'s':'')+' issued'}else if(pending){st.dataset.state='pending';st.textContent='◌ Payment being verified'}else if(!d.configured){st.dataset.state='off';st.textContent='Online purchase opens soon'}else{st.dataset.state='idle';st.textContent='7-day trial available in the EA'}}
 const pay=q('#spPay');if(pay){pay.disabled=!(d.configured&&d.payments);if(!d.configured||!d.payments)msg('Online checkout for Scalper Pro is being switched on. Message the DrFX Telegram bot to buy in the meantime.')}
 const k=q('#spKeys');if(k){if(!keys.length)k.innerHTML='<p class="sx-sp-empty">No keys yet. Your first key appears here right after payment.</p>';else k.innerHTML=keys.map(x=>{const shown=SP.reveal.has(x.id),key=String(x.key||'');return '<div class="sx-sp-key"><header><span>MT5 <b>#'+esc(x.account_login)+'</b></span><span>'+esc(LABEL[x.plan]||x.plan)+' · '+esc(x.days)+' days · '+esc(fmtDate(x.created_at))+'</span></header><code class="'+(shown?'':'sx-mask')+'">'+esc(shown?key:key.slice(0,10)+'-•••••-•••••-•••••-'+key.slice(-5))+'</code><div><button type="button" data-sp-reveal="'+esc(x.id)+'">'+(shown?'Hide':'Reveal')+'</button><button type="button" class="sx-copy" data-sp-copy="'+esc(x.id)+'">Copy key</button></div></div>'}).join('')}
 const o=q('#spOrders');if(o)o.innerHTML=orders.length?orders.map(x=>'<div class="sx-sp-order"><span><b>'+esc(LABEL[x.plan]||x.plan)+'</b> · $'+esc(x.amount_usd)+' · #'+esc(x.account_login)+'<br>'+esc(fmtDate(x.created_at))+'</span><span>'+(x.status==='pending'&&x.invoice_url?'<a href="'+esc(x.invoice_url)+'" rel="noopener">Open invoice</a> ':'')+'<span class="sx-chip" data-s="'+esc(x.status)+'">'+esc(x.status)+'</span></span></div>').join(''):'<p class="sx-sp-empty">No orders yet.</p>';
 const dl=q('#spDownload');if(dl){if(d.download_url){dl.href=d.download_url;dl.setAttribute('aria-disabled','false');dl.textContent='Download EA ↓';dl.rel='noopener'}else{dl.removeAttribute('href');dl.setAttribute('aria-disabled','true');dl.textContent='Download link coming soon'}}
 if(login&&!login.value&&keys[0]){login.value=keys[0].account_login;steps()}}
async function spLoad(){if(SP.busy)return;SP.busy=true;try{const r=await fetch('/api/scalper',{credentials:'same-origin',headers:{accept:'application/json'}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'SERVICE_UNAVAILABLE');SP.data=d;render()}catch(e){const st=q('#spStatus');if(st){st.dataset.state='off';st.textContent=e.message==='UNAUTHENTICATED'?'Sign in to continue':'Service unavailable'}}finally{SP.busy=false}}
q('#spRefresh')?.addEventListener('click',spLoad);
q('#spKeys')?.addEventListener('click',async e=>{const r=e.target.closest('[data-sp-reveal]'),c=e.target.closest('[data-sp-copy]');
 if(r){const id=r.dataset.spReveal;SP.reveal.has(id)?SP.reveal.delete(id):SP.reveal.add(id);render()}
 if(c){const x=(SP.data?.keys||[]).find(k=>k.id===c.dataset.spCopy);if(!x)return;try{await navigator.clipboard.writeText(x.key);c.textContent='Copied ✓';setTimeout(()=>{c.textContent='Copy key'},1800)}catch{SP.reveal.add(x.id);render();msg('Copy is blocked here. The key is shown, select it and copy.','bad')}}});
const ERR={INVALID_MT5_ACCOUNT:'Enter the MT5 account number (digits only).',INVALID_PLAN:'Choose a plan.',RATE_LIMITED:'Too many attempts. Wait a minute and try again.',PAYMENTS_NOT_CONFIGURED:'Crypto checkout is not switched on yet.',SCALPER_LICENSING_NOT_CONFIGURED:'Licensing is being set up. Try again soon.',UNAUTHENTICATED:'Your session ended. Sign in again.'};
q('#spPay')?.addEventListener('click',async()=>{const v=(login?.value||'').trim(),btn=q('#spPay');if(!loginRe.test(v)){msg(ERR.INVALID_MT5_ACCOUNT,'bad');login?.focus();login?.parentElement.animate?.([{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}],{duration:280});return}
 btn.disabled=true;btn.classList.add('sx-busy');msg('Creating your secure invoice…');
 try{const r=await fetch('/api/scalper/checkout',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({plan:SP.plan,account_login:v})});const d=await r.json().catch(()=>({}));if(!r.ok||!d.invoice_url)throw Error(d.error||'PAYMENT_GATEWAY_UNAVAILABLE');msg('Redirecting to the payment page…','good');location.assign(d.invoice_url)}
 catch(e){msg(ERR[e.message]||'The payment service did not respond. Try again in a moment.','bad');btn.disabled=false}finally{btn.classList.remove('sx-busy')}});
setPlan(SP.plan);
/* back from the payment page */
if(location.hash==='#scalper'&&new URLSearchParams(location.search).get('paid')){want='scalper';setTimeout(()=>{const o=q('#loginOpen');if(o)o.click()},600)}
})();
`;
