
export const TEST_UI = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SignalBridge Live Test</title>
<style>
:root{color-scheme:dark;font-family:Inter,Segoe UI,Arial,sans-serif;background:#070b12;color:#edf5ff}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 80% 0,#112843,#070b12 38%);min-height:100vh}
main{max-width:960px;margin:auto;padding:28px}.head{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-bottom:20px}
h1{font-size:28px;margin:0}.sub{color:#8da1b8;font-size:13px;margin-top:7px}.pill{border:1px solid #28475d;background:#0d2231;color:#7fe1ff;padding:7px 10px;border-radius:999px;font:700 11px Consolas}
.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.card{background:#0e1726;border:1px solid #22334c;border-radius:14px;padding:18px;box-shadow:0 20px 50px #0005}
label{display:block;font-size:10px;color:#8da1b8;font-weight:800;text-transform:uppercase;letter-spacing:.7px;margin:11px 0 5px}
input,select{width:100%;border:1px solid #2a405c;background:#08111e;color:#eef7ff;padding:11px;border-radius:9px;outline:none}
.two{display:grid;grid-template-columns:1fr 1fr;gap:9px}.three{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
button{margin-top:15px;border:0;border-radius:9px;padding:12px 15px;background:linear-gradient(110deg,#55d7f7,#7a83ff);color:#061018;font-weight:900;cursor:pointer}
button:disabled{opacity:.5}.status{display:grid;gap:8px}.row{border:1px solid #20324a;background:#0a1422;border-radius:9px;padding:11px;display:flex;justify-content:space-between;gap:10px;font:12px Consolas}
.good{color:#4bd7a1}.warn{color:#f2bd66}.bad{color:#ff7583}.log{margin-top:12px;min-height:230px;white-space:pre-wrap;font:11px/1.7 Consolas;background:#07101c;border:1px solid #20324a;border-radius:10px;padding:12px;color:#9eb4cb}
.notice{margin-top:13px;border:1px solid #67522d;background:#271f14;color:#e5c180;border-radius:9px;padding:11px;font-size:11px;line-height:1.6}
@media(max-width:800px){.grid{grid-template-columns:1fr}.two,.three{grid-template-columns:1fr}}
</style></head><body><main>
<div class="head"><div><div class="pill">SIGNALBRIDGE · REAL BACKEND TEST</div><h1>Send a test signal to MT5</h1><div class="sub">Measures edge acceptance, WebSocket delivery and terminal/broker state.</div></div><div id="health" class="pill">checking…</div></div>
<div class="grid"><section class="card">
<label>Agent token (kept in memory only)</label><input id="token" type="password" autocomplete="off" placeholder="43-character Agent token">
<div class="two"><div><label>Symbol</label><input id="symbol" value="XAUUSD"></div><div><label>Side</label><select id="side"><option>BUY</option><option>SELL</option></select></div></div>
<div class="two"><div><label>Lot</label><input id="volume" type="number" step="0.01" value="0.01"></div><div><label>Mode</label><select id="mode"><option value="dry_run">Preview only</option><option value="demo_execute">Open on DEMO</option></select></div></div>
<label>Stop Loss</label><input id="sl" type="number" step="0.01" placeholder="required">
<div class="three"><div><label>TP1</label><input id="tp1" type="number" step="0.01"></div><div><label>TP2</label><input id="tp2" type="number" step="0.01"></div><div><label>TP3</label><input id="tp3" type="number" step="0.01"></div></div>
<button id="send">Send Test Signal</button>
<div class="notice">DEMO execution is accepted only when the MT5 EA is running on a Demo account and its local Demo Execution switch is enabled. Live accounts are rejected.</div>
</section><section class="card">
<div class="status"><div class="row"><span>Edge round-trip</span><b id="edge">—</b></div><div class="row"><span>Command</span><b id="cmd">—</b></div><div class="row"><span>Status</span><b id="state">IDLE</b></div><div class="row"><span>Broker ticket</span><b id="ticket">—</b></div></div>
<div id="log" class="log">Ready.</div>
</section></div></main>
<script>
const $=id=>document.getElementById(id), log=(x)=>{$('log').textContent=new Date().toLocaleTimeString()+'  '+x+'\n'+$('log').textContent};
async function health(){try{const r=await fetch('/health');const j=await r.json();$('health').textContent=j.ok?'● BACKEND LIVE':'BACKEND ERROR';}catch{$('health').textContent='BACKEND ERROR'}}
health();
$('send').onclick=async()=>{
 const token=$('token').value.trim(); if(!token){log('Agent token required');return}
 const tps=[$('tp1').value,$('tp2').value,$('tp3').value].filter(Boolean).map(Number);
 const body={symbol:$('symbol').value.trim().toUpperCase(),side:$('side').value,volume:Number($('volume').value),stop_loss:Number($('sl').value),take_profits:tps,mode:$('mode').value};
 $('send').disabled=true;$('state').textContent='SENDING'; const t0=performance.now();
 try{
  const r=await fetch('/v1/test/signal',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},body:JSON.stringify(body)});
  const j=await r.json(); $('edge').textContent=Math.round(performance.now()-t0)+' ms';
  if(!r.ok){$('state').textContent=j?.error?.code||'ERROR';log(JSON.stringify(j));return}
  $('cmd').textContent=j.command_id;$('state').textContent=j.status;log('Edge accepted: '+JSON.stringify(j));
  const id=j.command_id; const until=Date.now()+20000;
  while(Date.now()<until){
    await new Promise(x=>setTimeout(x,250));
    const s=await fetch('/v1/commands/'+encodeURIComponent(id),{headers:{authorization:'Bearer '+token}});
    const d=await s.json(); if(!s.ok){log('Status error '+JSON.stringify(d));break}
    $('state').textContent=d.status; $('ticket').textContent=d.broker_ticket||'—';
    if(['PREVIEWED','FILLED','BROKER_REJECTED','REJECTED','ACCOUNT_MISMATCH','EXPIRED','ERROR'].includes(d.status)){log('Terminal result: '+JSON.stringify(d));break}
  }
 }catch(e){$('state').textContent='NETWORK ERROR';log(String(e))}
 finally{$('send').disabled=false}
};
</script></body></html>`;
