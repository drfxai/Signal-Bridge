import {parseTelegramTrade} from './telegram-parser.mjs';
import {parseGodModeAlert} from './godmode-parser.mjs';
import {validateTradingView} from './validate.mjs';
// Explicit formats only. Unknown indicator prose is never guessed into an order.
export function parseSignalMessage(text,now=Date.now()){
 if(typeof text!=='string'||!text.trim()||text.length>4096)return {ok:false,reason:'EMPTY_OR_TOO_LONG'};
 const raw=text.trim();
 if(raw.includes('[[DRFX]]'))return parseGodModeAlert(raw,now);
 if(raw.startsWith('{')){
  try{return {ok:true,signal:validateTradingView(JSON.parse(raw),now)}}
  catch(e){return {ok:false,reason:e.code||'INVALID_INDICATOR_JSON'}}
 }
 return parseTelegramTrade(raw,now);
}
export function telegramMessageFresh(msg,now=Date.now()){
 const times=[msg?.date,msg?.forward_origin?.date].filter(x=>x!==undefined);
 return times.length>0&&times.every(t=>Number.isInteger(t)&&t>0&&t*1000<=now+30000&&now-t*1000<60000);
}
