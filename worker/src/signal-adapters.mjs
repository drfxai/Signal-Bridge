import {parseTelegramTrade} from './telegram-parser.mjs';
import {parseGodModeAlert} from './godmode-parser.mjs';
import {validateTradingView} from './validate.mjs';
// Explicit formats only. Unknown indicator prose is never guessed into an order.
export function parseSignalMessage(text,now=Date.now(),options={}){
 if(typeof text!=='string'||!text.trim()||text.length>4096)return {ok:false,reason:'EMPTY_OR_TOO_LONG'};
 const raw=text.trim();
 if(raw.includes('[[DRFX]]'))return parseGodModeAlert(raw,now);
 if(raw.startsWith('{')){
  try{const b=JSON.parse(raw);if(b.schema_version)return {ok:true,signal:validateTradingView(b,now)};const allowed=['symbol','action','side','entry','sl','tp','tp1','tp2','tp3','lot','volume'];if(!b||Array.isArray(b)||Object.keys(b).some(k=>!allowed.includes(k)))return {ok:false,reason:'INVALID_SIMPLE_JSON'};const tps=Array.isArray(b.tp)?b.tp:[b.tp1,b.tp2,b.tp3].filter(v=>v!=null);const lines=[b.side||b.action,b.symbol,...(b.entry!=null?['ENTRY: '+b.entry]:[]),'SL: '+b.sl,...tps.map((v,i)=>'TP'+(i+1)+': '+v),...(b.lot!=null||b.volume!=null?['LOT: '+(b.lot??b.volume)]:[])];return parseTelegramTrade(lines.join('\n'),now,options)}
  catch(e){return {ok:false,reason:e.code||'INVALID_INDICATOR_JSON'}}
 }
 return parseTelegramTrade(raw,now,options);
}
export function telegramMessageFresh(msg,now=Date.now()){
 const times=[msg?.date,msg?.forward_origin?.date].filter(x=>x!==undefined);
 return times.length>0&&times.every(t=>Number.isInteger(t)&&t>0&&t*1000<=now+30000&&now-t*1000<60000);
}

export function parseManagement(text){const raw=String(text||'').normalize('NFKC').trim();if(raw.length>300)return null;const m=raw.match(/^(?:TP\s*([123])\s*(?:HIT|REACHED|DONE)?|(?:STOP\s*LOSS|SL)\s*(?:HIT|REACHED)?|CLOSE(?:\s+(?:ALL|POSITION))?|بستن|استاپ\s*خورد)\s*[.!✅]*$/i);if(!m)return null;return m[1]?'TP'+m[1]:/^(?:SL|STOP|استاپ)/i.test(raw)?'SL':'CLOSE';}
