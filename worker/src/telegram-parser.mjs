
const POSITIVE = v => Number.isFinite(v) && v>0;
const DIGITS = {'۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9','٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
const normalizeDigits = s => String(s||'').replace(/[۰-۹٠-٩]/g,c=>DIGITS[c]||c);

function numberAfter(text,label) {
  const re=new RegExp('(?:^|\\n)\\s*'+label+'\\s*[:=]?\\s*([0-9]+(?:\\.[0-9]+)?)','im');
  const m=text.match(re);
  return m?Number(m[1]):null;
}

export function parseTelegramTrade(text,nowMs=Date.now()) {
  const raw=normalizeDigits(text).replace(/\r/g,'').trim();
  if(!raw || raw.length>4096) return {ok:false,reason:'EMPTY_OR_TOO_LONG'};
  const upper=raw.toUpperCase();
  const buy=/\bBUY\b/.test(upper), sell=/\bSELL\b/.test(upper);
  if(buy===sell) return {ok:false,reason:'DIRECTION_REQUIRED'};
  const symbolMatch=upper.match(/\b([A-Z]{2,8}(?:USD|USDT|EUR|JPY|GBP|BTC|XAU|XAG)[A-Z0-9._-]{0,8}|XAUUSD|XAGUSD|US30|NAS100|BTCUSD|ETHUSD)\b/);
  if(!symbolMatch) return {ok:false,reason:'SYMBOL_REQUIRED'};
  const volume=numberAfter(upper,'(?:LOT|LOTS|VOLUME)');
  const sl=numberAfter(upper,'(?:SL|STOP\\s*LOSS)');
  const tps=[numberAfter(upper,'TP1'),numberAfter(upper,'TP2'),numberAfter(upper,'TP3')].filter(POSITIVE);
  if(!POSITIVE(volume)) return {ok:false,reason:'LOT_REQUIRED'};
  if(!POSITIVE(sl)) return {ok:false,reason:'STOP_LOSS_REQUIRED'};
  if(tps.length<1) return {ok:false,reason:'TAKE_PROFIT_REQUIRED'};
  return {ok:true,signal:{
    action:'OPEN',
    side:buy?'BUY':'SELL',
    symbol:symbolMatch[1],
    order:{type:'MARKET',volume:{mode:'FIXED_LOTS',value:volume},stop_loss:sl,take_profits:tps},
    occurred_at:new Date(nowMs).toISOString(),
    expires_at:new Date(nowMs+60_000).toISOString()
  }};
}
