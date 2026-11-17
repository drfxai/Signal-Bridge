// TradingView timeframe.period uses bare numbers for minutes and S/D/W/M suffixes.
export function normalizeTimeframe(value){
 if(typeof value!=='string'&&typeof value!=='number')return null;
 const match=String(value).trim().match(/^(\d{1,4})?([sShHdDwWMm])?$/);
 if(!match||(!match[1]&&!/[DWM]/.test(match[2]||'')))return null;
 const n=Number(match[1]||1);
 if(n<1)return null;
 const unit=match[2]==='M'?'M':(match[2]||'m').toLowerCase();
 return n+unit;
}

export function normalizeEngines(value){
 const list=typeof value==='string'?value.split(/[,+;|]/):value;
 if(!Array.isArray(list)||list.length>32)return [];
 return [...new Map(list.filter(v=>typeof v==='string').map(v=>v.trim())
  .filter(v=>/^[A-Za-z0-9][A-Za-z0-9 _&-]{0,23}$/.test(v))
  .map(v=>[v.toLowerCase(),v])).values()];
}

export function signalMetadata({strategy,timeframe,engines}={}){
 const tf=normalizeTimeframe(timeframe), names=normalizeEngines(engines);
 return {...(strategy?{strategy}:{}),...(tf?{timeframe:tf}:{}),...(names.length?{engines:names}:{})};
}

export function tradeComment({type,timeframe,engines}={}){
 const tf=normalizeTimeframe(timeframe),names=normalizeEngines(engines);
 if(!tf&&!names.length)return '';
 const source=type==='tradingview'?'T':type==='telegram'?'G':'B';
 const prefix=source+(tf||'')+':';
 const budget=15-prefix.length;
 const compact=names.map(name=>name.toLowerCase()==='scalper'&&names.length>1?'Sc':name.replace(/[ _-]/g,''));
 const full=compact.join('+');
 if(full.length<=budget)return prefix+full;
 for(let n=compact.length-1;n>=1;n--){
  const suffix='+'+(compact.length-n);
  const visible=compact.slice(0,n).join('+');
  if(visible.length+suffix.length<=budget)return prefix+visible+suffix;
 }
 const suffix=compact.length>1?'+'+(compact.length-1):'';
 return prefix+compact[0].slice(0,budget-suffix.length)+suffix;
}
