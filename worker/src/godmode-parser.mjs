const TAG=/\[\[DRFX\]\]([\s\S]*?)\[\[\/DRFX\]\]/;
const MANAGEMENT_EXPIRES='9999-12-31T23:59:59.999Z';
const num=v=>{if(v==null||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null};
const dir=v=>{const s=String(v||'').toLowerCase();return s==='long'||s==='buy'?'BUY':s==='short'||s==='sell'?'SELL':null};
function sanitize(s){return String(s).replace(/:\s*NaN\s*([,}])/g,': null$1').replace(/:\s*-?Infinity\s*([,}])/g,': null$1')}
function riskFromStrength(v){let s=num(v);if(s==null)return .1;if(s>0&&s<=1)s*=100;s=Math.max(0,Math.min(100,s));return Math.max(.1,Math.min(1,.1+.9*(s/100)))}
function eventOf(v){const s=String(v||'').toLowerCase().trim();if(['entry','open','filled'].includes(s))return 'ENTRY';if(['tp1','t1','target1'].includes(s))return 'TP1';if(['tp2','t2','target2'].includes(s))return 'TP2';if(['tp3','t3','target3'].includes(s))return 'TP3';if(['sl','stop','stoploss','stop_loss'].includes(s))return 'SL';if(['close','exit','cancel','invalidate','invalidated'].includes(s))return 'CLOSE';return null}
function fnv(text){let h=0x811c9dc5;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,0x01000193)}return (h>>>0).toString(16).padStart(8,'0')}
function timeFromSignalId(id){const m=String(id).match(/-(\d{10,13})$/);if(!m)return null;let t=Number(m[1]);if(m[1].length===10)t*=1000;return Number.isFinite(t)?t:null}

export function parseGodModeAlert(text,nowMs=Date.now()){
 const m=String(text||'').match(TAG);if(!m)return {ok:false,reason:'NO_DRFX_TAG'};
 let p;try{p=JSON.parse(sanitize(m[1]))}catch{return {ok:false,reason:'MALFORMED_DRFX_JSON'}}
 const ev=eventOf(p.event);if(!ev)return {ok:false,reason:'BAD_EVENT'};
 const correlation=String(p.signal_id??p.signalId??'').trim();if(!correlation||correlation.length>160)return {ok:false,reason:'NO_SIGNAL_ID'};
 const signalTime=timeFromSignalId(correlation);
 const symbol=String(p.symbol||'').trim().toUpperCase();
 if(ev!=='ENTRY'){
  return {ok:true,signal:{external_signal_id:'gm-'+fnv(correlation+':'+ev),correlation_id:correlation,action:'MANAGE',management_event:ev,
   symbol:/^[A-Z0-9][A-Z0-9._-]{0,31}$/.test(symbol)?symbol:null,
   occurred_at:new Date(nowMs).toISOString(),expires_at:MANAGEMENT_EXPIRES,
   metadata:{strategy:'GOD MODE'}}};
 }
 const side=dir(p.direction||p.dir||p.side),sl=num(p.sl),tp1=num(p.tp1),tp2=num(p.tp2),tp3=num(p.tp3);
 const occurred=signalTime??nowMs;if(occurred>nowMs+30_000)return {ok:false,reason:'FUTURE_GODMODE_ENTRY'};if(nowMs-occurred>300_000)return {ok:false,reason:'STALE_GODMODE_ENTRY'};
 const tps=[tp1,tp2,tp3].filter(v=>v!=null&&v>0),ref=num(p.entry)!=null?num(p.entry):num(p.price);
 let risk=num(p.risk_pct!=null?p.risk_pct:p.riskPct);if(!(risk>0))risk=riskFromStrength(p.strength);
 if(!side)return {ok:false,reason:'NO_DIRECTION'};
 if(!/^[A-Z0-9][A-Z0-9._-]{0,31}$/.test(symbol))return {ok:false,reason:'INVALID_SYMBOL'};
 if(!(sl>0))return {ok:false,reason:'NO_STOP'};
 if(tps.length<1)return {ok:false,reason:'NO_TARGET'};
 if(!(risk>0&&risk<=10))return {ok:false,reason:'INVALID_RISK'};
 return {ok:true,signal:{schema_version:'1.0',external_signal_id:correlation,correlation_id:correlation,source_type:'tradingview',action:'OPEN',side,symbol,
  order:{type:'MARKET',volume:{mode:'RISK_PERCENT',value:risk},stop_loss:sl,take_profits:tps,...(ref>0?{reference_price:ref}:{})},
  occurred_at:new Date(occurred).toISOString(),expires_at:new Date(occurred+300_000).toISOString(),metadata:{strategy:'GOD MODE'}}};
}
