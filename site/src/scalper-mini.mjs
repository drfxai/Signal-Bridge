// DrFX Scalper Pro in the Telegram Mini App. Keys are shown here; purchases happen on the
// website portal (Telegram requires Stars for digital goods sold inside Mini Apps).
export const SXM_HOME_HTML = String.raw`<button type="button" class="sxm-promo" data-jump="scalper"><span class="sxm-promo-radar" aria-hidden="true"><i></i></span><span><em>NEW</em><b>DrFX Scalper Pro</b><small>AI liquidity radar for XAUUSD · 7 days free</small></span><span class="sxm-promo-go" aria-hidden="true">→</span></button>
`;

export const SXM_NAV_HTML = String.raw`<button data-tab="scalper" type="button" aria-selected="false"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 12 18 6"/></svg><span>Scalper</span></button>
`;

export const SXM_PANEL_HTML = String.raw`<section class="tab-panel" data-panel="scalper" id="panel-scalper" hidden>
 <p class="tab-kicker">NEW · DRFX SCALPER PRO</p><h2 class="section-title">See where gold turns</h2>
 <div class="sxm-video"><video id="sxmVideo" src="/media/scalper/promo.mp4" poster="/media/scalper/poster.jpg" muted loop playsinline preload="metadata" aria-label="Scalper Pro promo video"></video><span class="sxm-scan" aria-hidden="true"></span></div>
 <article class="card gold sxm-status-card">
  <div class="split"><div><div class="micro">MY SCALPER PRO</div><div id="sxmStatus" class="value">Checking…</div></div><span class="sxm-radar" aria-hidden="true"><i></i></span></div>
  <div class="goldline"></div>
  <div id="sxmKeys" class="sxm-keys"></div>
 </article>
 <div class="sxm-features">
  <div><b>Finds the sweep</b><span>Asia range, PDH/PDL, equal highs and lows</span></div>
  <div><b>Marks the zone</b><span>FVG and Order Block behind each CHoCH/BOS</span></div>
  <div><b>Scores the trade</b><span>Win %, reach % and EV, graded A+ to C</span></div>
  <div><b>One-click orders</b><span>Risk-sized limits, or AUTO + TRADE</span></div>
 </div>
 <div class="card">
  <h2>Plans</h2>
  <div class="plan"><div><b>Free trial</b><small>7 days, every feature, inside the EA</small></div><div class="plan-price">$0</div></div>
  <div class="plan"><div><b>Monthly</b><small>30 days · key locked to your MT5 account</small></div><div class="plan-price">$19</div></div>
  <div class="plan featured"><div><b>3 Months · save 14%</b><small>90 days · best value</small></div><div class="plan-price">$49</div></div>
  <button id="sxmBuy" type="button" class="btn primary" style="width:100%;margin-top:15px">Buy a licence on drfx.company ↗</button>
  <p class="meta">You pay in your website portal with crypto. Your key appears there, in this tab and in a bot message as soon as the payment confirms.</p>
 </div>
 <div class="card">
  <h2>Install in four steps</h2><a class="btn primary" href="https://drfx.company/downloads/DrFX_Scalper_Pro.ex5" download>Download Scalper Pro · EX5 ↓</a>
  <ol class="list sxm-steps">
   <li><b>Download</b> the EA from the Scalper Pro tab of your website portal.</li>
   <li><b>Copy</b> it to MT5 → File → Open Data Folder → MQL5/Experts, then Refresh.</li>
   <li><b>Attach</b> it to an XAUUSD chart (M15) and allow Algo Trading.</li>
   <li><b>Start</b> the 7-day trial, or ENTER LICENCE KEY → paste → ACTIVATE.</li>
  </ol>
  <p class="meta">Trading involves risk. Win % and EV are historical estimates, not promises.</p>
 </div>
</section>
`;

export const SXM_CSS = String.raw`
nav.bottom{grid-template-columns:none!important;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr)}
nav.bottom button[data-tab=scalper],.sb-mobile-tabs .sxm-sb-scalper{color:#e8c77e!important}
.sb-mobile-tabs:has(.sxm-sb-scalper){grid-template-columns:repeat(5,1fr)!important}
.sxm-promo{position:relative;display:flex;align-items:center;gap:12px;width:100%;margin:12px 0;padding:14px;border-radius:15px;border:1px solid #d4af3780;background:radial-gradient(ellipse at 0 50%,#d4af3730,transparent 60%),linear-gradient(155deg,#1d1810,#111218 80%);color:#f8f8fa;text-align:left;overflow:hidden;cursor:pointer;animation:sxmIn .6s var(--easing) both}
.sxm-promo:after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 35%,#fff2 50%,transparent 65%);transform:translateX(-120%);animation:sxmGlint 4s ease-in-out infinite;pointer-events:none}
.sxm-promo em{display:inline-block;margin-bottom:3px;padding:2px 6px;border-radius:4px;background:#38db9e;color:#03130c;font:800 9px/1.2 system-ui;font-style:normal;letter-spacing:.06em}
.sxm-promo b{display:block;font-size:15px}.sxm-promo small{display:block;color:#bdb6a6;font-size:12px}
.sxm-promo-go{margin-left:auto;color:#f4d38e;font-size:20px;transition:transform .2s}.sxm-promo:active .sxm-promo-go{transform:translateX(4px)}
.sxm-promo-radar,.sxm-radar{position:relative;flex:none;width:44px;height:44px;border-radius:50%;border:1px solid #d4af3780;background:radial-gradient(circle,#38db9e30,transparent 70%)}
.sxm-promo-radar i,.sxm-radar i{position:absolute;inset:0;border-radius:50%;background:conic-gradient(#38db9e88,transparent 28%);animation:sxmRot 2.4s linear infinite}
.sxm-promo-radar:after,.sxm-radar:after{content:"";position:absolute;inset:18px;border-radius:50%;background:#38db9e;box-shadow:0 0 8px #38db9e}
.sxm-video{position:relative;margin:12px 0;border-radius:15px;overflow:hidden;border:1px solid #d4af3766;box-shadow:0 14px 40px #000a}
.sxm-video video{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;background:#07090d}
.sxm-scan{position:absolute;left:0;right:0;top:0;height:60px;background:linear-gradient(180deg,transparent,#38db9e24,transparent);animation:sxmScan 3.6s ease-in-out infinite;pointer-events:none}
.sxm-keys{display:grid;gap:10px;margin-top:12px}
.sxm-key{padding:12px;border-radius:12px;border:1px solid #3a3a44;background:#0d0e13;animation:sxmIn .5s var(--easing) both}
.sxm-key header{display:flex;justify-content:space-between;gap:8px;color:#a6a9b4;font-size:12px}.sxm-key header b{color:#fff}
.sxm-key code{display:block;margin:8px 0;padding:9px;border-radius:8px;background:#060709;border:1px solid #26262e;color:#f4d38e;font:700 11.5px/1.5 ui-monospace,monospace;word-break:break-all}
.sxm-key .buttons{display:flex;gap:8px}.sxm-key .btn{min-height:40px;flex:1}
.sxm-empty{margin:0;color:#a6a9b4;font-size:13px;line-height:1.6}
.sxm-features{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}
.sxm-features div{padding:13px;border-radius:13px;border:1px solid #35343c;background:linear-gradient(155deg,#191a20,#111218);animation:sxmIn .5s var(--easing) both}
.sxm-features div:nth-child(2){animation-delay:.06s}.sxm-features div:nth-child(3){animation-delay:.12s}.sxm-features div:nth-child(4){animation-delay:.18s}
.sxm-features b{display:block;color:#f2d48c;font-size:13px;margin-bottom:3px}.sxm-features span{color:#a6a9b4;font-size:12px;line-height:1.45}
.sxm-steps b{color:#f2d48c}
#panel-scalper:not([hidden]) .card{animation:sxmIn .55s var(--easing) both}
@keyframes sxmIn{from{opacity:0;transform:translateY(12px)}}
@keyframes sxmRot{to{transform:rotate(360deg)}}
@keyframes sxmGlint{60%,100%{transform:translateX(120%)}}
@keyframes sxmScan{from{transform:translateY(-60px)}to{transform:translateY(260px)}}
[dir=rtl] .sxm-promo{text-align:right}[dir=rtl] .sxm-promo-go{margin-left:0;margin-right:auto;transform:scaleX(-1)}
`;

export const SXM_JS = String.raw`
(()=>{'use strict';
const $=id=>document.getElementById(id),tg=window.Telegram?.WebApp||null;
const LABEL={scalper_1m:'Monthly',scalper_3m:'3 Months'};let data=null,busy=false;const shown=new Set();
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c])}
function open(url){try{if(tg?.openLink)tg.openLink(url);else location.assign(url)}catch{location.assign(url)}}
function render(){const box=$('sxmKeys'),st=$('sxmStatus');if(!box||!st)return;const keys=data?.keys||[],pending=(data?.orders||[]).some(o=>o.status==='pending');
 st.textContent=keys.length?keys.length+' key'+(keys.length>1?'s':'')+' issued':pending?'Payment being verified':'No licence yet';
 box.innerHTML=keys.length?keys.map(k=>{const v=shown.has(k.id),key=String(k.key||'');return '<div class="sxm-key"><header><span>MT5 <b>#'+esc(k.account_login)+'</b></span><span>'+esc(LABEL[k.plan]||k.plan)+' · '+esc(k.days)+' days</span></header><code>'+esc(v?key:key.slice(0,10)+'-•••••-•••••-•••••-'+key.slice(-5))+'</code><div class="buttons"><button type="button" class="btn subtle" data-sxm-show="'+esc(k.id)+'">'+(v?'Hide':'Reveal')+'</button><button type="button" class="btn primary" data-sxm-copy="'+esc(k.id)+'">Copy key</button></div></div>'}).join(''):'<p class="sxm-empty">Start with the free 7-day trial inside the EA. When you buy a licence on the website, your key shows up here.</p>';}
async function load(){if(busy)return;busy=true;try{const r=await fetch('/api/scalper',{credentials:'same-origin',headers:{accept:'application/json'}});const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.error||'SERVICE_UNAVAILABLE');data=d;render()}catch(e){const st=$('sxmStatus');if(st)st.textContent=e.message==='UNAUTHENTICATED'?'Sign in from the bot':'Unavailable right now';const box=$('sxmKeys');if(box&&!data)box.innerHTML='<p class="sxm-empty">Open this Mini App from the official DrFX bot to see your keys.</p>'}finally{busy=false}}
window.sxMiniLoad=()=>{load();const v=$('sxmVideo');if(v&&!matchMedia('(prefers-reduced-motion: reduce)').matches)v.play().catch(()=>{})};
window.sxMiniLeave=()=>{const v=$('sxmVideo');if(v)v.pause()};
$('sxmKeys')?.addEventListener('click',async e=>{const s=e.target.closest('[data-sxm-show]'),c=e.target.closest('[data-sxm-copy]');
 if(s){const id=s.dataset.sxmShow;shown.has(id)?shown.delete(id):shown.add(id);render()}
 if(c){const k=(data?.keys||[]).find(x=>x.id===c.dataset.sxmCopy);if(!k)return;try{await navigator.clipboard.writeText(k.key);c.textContent='Copied ✓';tg?.HapticFeedback?.notificationOccurred?.('success');setTimeout(()=>{c.textContent='Copy key'},1800)}catch{shown.add(k.id);render()}}});
$('sxmBuy')?.addEventListener('click',()=>open('https://drfx.company/#scalper'));
})();
`;
