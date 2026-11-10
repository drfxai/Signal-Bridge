/**
 * Telegram Bot API 10.4 private-chat account status widget.
 * Fixed HTML, data-only state, no external network or trading action.
 * https://core.telegram.org/bots/widgets
 */
export const SIGNAL_BRIDGE_WIDGET_HTML = String.raw`<!doctype html>
<html><style>
body{margin:0;padding:12px;font:14px system-ui,sans-serif;color:var(--tg-theme-text-color)}
section{border-radius:13px;border:1px solid var(--tg-theme-section-separator-color);padding:13px}
h3{margin:0;font-size:1.1em}small{color:var(--tg-theme-hint-color)}
.top{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:15px}
.pill{font-weight:700;color:var(--tg-theme-accent-text-color)}
.metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.metric{padding:10px;border-radius:10px;background:var(--tg-theme-secondary-bg-color)}
.label{color:var(--tg-theme-hint-color);font-size:.8em}
.value{font-size:1em;font-weight:700;margin-top:4px;overflow-wrap:anywhere}
.actions{display:flex;gap:8px;margin-top:12px}
button,.link{flex:1;text-align:center;padding:10px 7px;border:0;border-radius:10px;font:700 13px system-ui,sans-serif;text-decoration:none}
button{background:var(--tg-theme-button-color);color:var(--tg-theme-button-text-color)}
.link{background:var(--tg-theme-secondary-bg-color);color:var(--tg-theme-link-color)}
#message{margin-top:11px;min-height:16px}
</style><body><section>
<div class="top"><div><h3>DrFXAi · Signal Bridge</h3><small>Private account status</small></div><span class="pill" id="state">—</span></div>
<div class="metrics">
<div class="metric"><div class="label">Membership</div><div class="value" id="plan">—</div></div>
<div class="metric"><div class="label">EA license</div><div class="value" id="license">—</div></div>
<div class="metric" style="grid-column:span 2"><div class="label">License expiry</div><div class="value" id="expires">—</div></div>
</div>
<div class="actions"><button id="refresh">↻ Refresh</button><a class="link" href="https://drfx.company/telegram">Open dashboard</a></div>
<small id="message">Read-only status. No trading is triggered.</small>
</section><script>
(function(){
var T=window.TelegramWidget,d=document,s={};
try{s=JSON.parse(T&&T.chatData||'{}')}catch(e){}
function e(n){return d.getElementById(n)}
function draw(){
e('state').textContent=s.account==='active'?'ACTIVE':'ACCOUNT';
e('plan').textContent=s.plan||'—';
e('license').textContent=s.license||'—';
e('expires').textContent=s.expires||'Not activated';
}
e('refresh').onclick=function(){
if(!T){e('message').textContent='Preview mode';return;}
e('message').textContent='Checking...';
T.request('sb:refresh').then(function(r){
var v={};try{v=JSON.parse(r.result||'{}')}catch(x){}
if(v.account)s=v;
draw();e('message').textContent=v.message||'Status checked';
},function(x){e('message').textContent='Refresh failed: '+(x.code||'FAILED')});
};
if(T)T.onEvent('chatDataChanged',function(){try{s=JSON.parse(T.chatData||'{}');draw()}catch(x){}});
draw();
})();
</script></body></html>`;

export function bridgeWidgetData({plan,licenseStatus,expiresAt,accountStatus}={}){
 // No secret/license key, MT5 account identifier or personal email is included.
 return JSON.stringify({
  plan:String(plan||'trial').slice(0,36),
  license:String(licenseStatus||'pending').slice(0,36),
  expires:String(expiresAt||'Not activated').slice(0,40),
  account:String(accountStatus||'active').slice(0,18)
 });
}
