const TAG=/\[\[DRFX\]\]([\s\S]*?)\[\[\/DRFX\]\]/;
const num=v=>{if(v==null||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null};
const dir=v=>{const s=String(v||'').toLowerCase();return s==='long'||s==='buy'?'BUY':s==='short'||s==='sell'?'SELL':null};
function sanitize(s){return String(s).replace(/:\s*NaN\s*([,}])/g,': null$1').replace(/:\s*-?Infinity\s*([,}])/g,': null$1')}
function riskFromStrength(v){let s=num(v);if(s==null)return 0.1;if(s>0&&s<=1)s*=100;s=Math.max(0,Math.min(100,s));return Math.max(0.1,Math.min(1,0.1+0.9*(s/100)))}

export function parseGodModeAlert(text,nowMs=Date.now()){
 const m=String(text||'').match(TAG);if(!m)return {ok:false,reason:'NO_DRFX_TAG'};
 let p;try{p=JSON.parse(sanitize(m[1]))}catch{return {ok:false,reason:'MALFORMED_DRFX_JSON'}}
 const event=String(p.event||'').toLowerCase();
 if(!['entry','open','filled'].includes(event))return {ok:false,reason:'UNSUPPORTED_GODMODE_EVENT'};
 const external=String(p.signal_id??p.signalId??'').trim();
 const side=dir(p.direction||p.dir||p.side);
 const symbol=String(p.symbol||'').trim().toUpperCase();
 const sl=num(p.sl),tp1=num(p.tp1),tp2=num(p.tp2),tp3=num(p.tp3);
 const tps=[tp1,tp2,tp3].filter(v=>v!=null&&v>0);
 const ref=num(p.entry)!=null?num(p.entry):num(p.price);
 let risk=num(p.risk_pct!=null?p.risk_pct:p.riskPct);if(!(risk>0))risk=riskFromStrength(p.strength);
 if(!external||external.length>96)return {ok:false,reason:'NO_SIGNAL_ID'};
 if(!side)return {ok:false,reason:'NO_DIRECTION'};
 if(!/^[A-Z0-9][A-Z0-9._-]{0,31}$/.test(symbol))return {ok:false,reason:'INVALID_SYMBOL'};
 if(!(sl>0))return {ok:false,reason:'NO_STOP'};
 if(tps.length<1)return {ok:false,reason:'NO_TARGET'};
 if(!(risk>0&&risk<=10))return {ok:false,reason:'INVALID_RISK'};
 return {ok:true,signal:{
   schema_version:'1.0',external_signal_id:external,source_type:'tradingview',action:'OPEN',side,symbol,
   order:{type:'MARKET',volume:{mode:'RISK_PERCENT',value:risk},stop_loss:sl,take_profits:tps,...(ref>0?{reference_price:ref}:{})},
   occurred_at:new Date(nowMs).toISOString(),expires_at:new Date(nowMs+60_000).toISOString(),
   metadata:{strategy:'GOD MODE'}
 }};
}
