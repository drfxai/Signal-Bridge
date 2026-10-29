const POSITIVE=v=>Number.isFinite(v)&&v>0;
const DIGITS={'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
const NUM='[-+]?[0-9]+(?:\\.[0-9]+)?';
const WORD_EDGE='A-Z0-9_\\u0600-\\u06FF';

function normalize(raw){
 return String(raw??'').normalize('NFKC')
  .replace(/[۰-۹٠-٩]/g,c=>DIGITS[c]||c)
  .replace(/\u066B/g,'.')
  .replace(/(\d)[,\u066C](?=\d{3}(?:\D|$))/g,'$1')
  .replace(/[\u200c\u200d]/g,' ')
  .replace(/\r/g,'')
  .trim();
}
function tokenRe(source,flags='i'){return new RegExp('(?:^|[^'+WORD_EDGE+'])(?:'+source+')(?=$|[^'+WORD_EDGE+'])',flags)}
function hasToken(text,source){return tokenRe(source,'i').test(text)}
function valuesAfter(text,labelSource){
 const re=new RegExp('(?:^|[\\s;,|])(?:'+labelSource+')\\s*[:=]?\\s*('+NUM+')(?=$|[\\s,;|])','gim');
 return [...text.matchAll(re)].map(m=>Number(m[1]));
}
function oneField(text,labelSource,{required=false,code='INVALID_FIELD'}={}){
 const values=valuesAfter(text,labelSource);
 if(values.length>1)return {error:'DUPLICATE_'+code};
 if(!values.length)return required?{error:code+'_REQUIRED'}:{value:null};
 if(!POSITIVE(values[0]))return {error:'INVALID_'+code};
 return {value:values[0]};
}
function canonicalSymbols(text){
 const found=new Set();
 const direct=/\b(XAUUSD|XAGUSD|BTCUSD|ETHUSD|US30|NAS100|[A-Z]{3}(?:USD|EUR|JPY|GBP|CHF|AUD|CAD|NZD))\b/g;
 for(const m of text.toUpperCase().matchAll(direct))found.add(m[1]);
 const aliases=[
  ['XAUUSD','GOLD|XAU|طلا|ذهب'],
  ['XAGUSD','SILVER|XAG|نقره|فضة'],
  ['BTCUSD','BTC|BITCOIN|بیت\\s*کوین|بيت\\s*كوين'],
  ['ETHUSD','ETH|ETHEREUM|اتریوم|ايثيريوم']
 ];
 for(const [symbol,source] of aliases)if(hasToken(text,source))found.add(symbol);
 return [...found];
}
function directions(text){
 const out=new Set();
 if(hasToken(text,'BUY|LONG|خرید|خريد|شراء'))out.add('BUY');
 if(hasToken(text,'SELL|SHORT|فروش|بيع'))out.add('SELL');
 return [...out];
}

export function parseTelegramTrade(text,nowMs=Date.now(),options={}){
 let raw=normalize(text).replace(/[,;|](?=[A-Za-z])/g,' ' );
 if(/\b(?:BUY|SELL)\s+(?:LIMIT|STOP)\b/i.test(raw))return {ok:false,reason:'PENDING_ORDER_REQUIRES_REVIEW'};
 if(/(?:ENTRY|ZONE|ورود)\s*[:=@]?\s*\d+(?:\.\d+)?\s*[-–]\s*\d/i.test(raw))return {ok:false,reason:'ENTRY_RANGE_REQUIRES_REVIEW'};
 if(!/(?:^|\s)(?:LOT|LOTS|VOLUME|لات|حجم)(?=$|[\s:=])/i.test(raw)&&Number.isFinite(options.defaultLots)&&options.defaultLots>0)raw+='\nLOT: '+options.defaultLots;
 const list=raw.match(/(?:^|\n)\s*(?:TP|TARGETS?|اهداف)\s*[:=]\s*([0-9.\s,\/]+)(?=$|\n)/i);
 if(list){const values=list[1].trim().split(/[\s,\/]+/).filter(Boolean);if(values.length>3)return {ok:false,reason:'TOO_MANY_TARGETS_REQUIRES_REVIEW'};raw=raw.replace(list[0],'\n'+values.map((v,i)=>'TP'+(i+1)+': '+v).join('\n'));}
 if(!raw||raw.length>4096)return {ok:false,reason:'EMPTY_OR_TOO_LONG'};

 const dirs=directions(raw);
 if(dirs.length!==1)return {ok:false,reason:dirs.length>1?'CONFLICTING_DIRECTION':'DIRECTION_REQUIRED'};

 const symbols=canonicalSymbols(raw);
 if(symbols.length!==1)return {ok:false,reason:symbols.length>1?'CONFLICTING_SYMBOLS':'SYMBOL_REQUIRED'};
 const symbol=symbols[0];

 const volume=oneField(raw,'LOT|LOTS|VOLUME|لات|حجم',{required:true,code:'LOT'});
 if(volume.error)return {ok:false,reason:volume.error};
 if(volume.value>100)return {ok:false,reason:'INVALID_LOT'};

 const sl=oneField(raw,'SL|STOP\\s*LOSS|STOPLOSS|حد\\s*ضرر|وقف\\s*الخسارة',{required:true,code:'STOP_LOSS'});
 if(sl.error)return {ok:false,reason:sl.error};

 const tp1=oneField(raw,'TP\\s*1|TP1|TARGET\\s*1|TARGET1|هدف\\s*1|الهدف\\s*1',{required:true,code:'TP1'});
 if(tp1.error)return {ok:false,reason:tp1.error};
 const tp2=oneField(raw,'TP\\s*2|TP2|TARGET\\s*2|TARGET2|هدف\\s*2|الهدف\\s*2',{code:'TP2'});
 if(tp2.error)return {ok:false,reason:tp2.error};
 const tp3=oneField(raw,'TP\\s*3|TP3|TARGET\\s*3|TARGET3|هدف\\s*3|الهدف\\s*3',{code:'TP3'});
 if(tp3.error)return {ok:false,reason:tp3.error};
 if(tp3.value!=null&&tp2.value==null)return {ok:false,reason:'TP_SEQUENCE_GAP'};

 const tps=[tp1.value,tp2.value,tp3.value].filter(v=>v!=null);
 if(new Set(tps).size!==tps.length)return {ok:false,reason:'DUPLICATE_TAKE_PROFIT_PRICE'};
if(tps.some((v,i)=>i>0&&(dirs[0]==='BUY'?v<=tps[i-1]:v>=tps[i-1])))return {ok:false,reason:'INVALID_TARGET_ORDER'};

 const entry=oneField(raw.replace(/@\s*(\d+(?:\.\d+)?)/g,' ENTRY: $1'),'ENTRY|PRICE|ENTRY\\s*PRICE|ورود|قیمت\\s*ورود|سعر\\s*الدخول',{code:'REFERENCE_PRICE'});
 if(entry.error)return {ok:false,reason:entry.error};

 if(entry.value!=null){
  if(dirs[0]==='BUY'&&(sl.value>=entry.value||tps.some(x=>x<=entry.value)))return {ok:false,reason:'INVALID_PRICE_GEOMETRY'};
  if(dirs[0]==='SELL'&&(sl.value<=entry.value||tps.some(x=>x>=entry.value)))return {ok:false,reason:'INVALID_PRICE_GEOMETRY'};
 }

 return {ok:true,signal:{
  action:'OPEN',side:dirs[0],symbol,
  order:{type:'MARKET',volume:{mode:'FIXED_LOTS',value:volume.value},stop_loss:sl.value,take_profits:tps,...(entry.value!=null?{reference_price:entry.value}:{})},
  occurred_at:new Date(nowMs).toISOString(),
  expires_at:new Date(nowMs+60_000).toISOString()
 }};
}
