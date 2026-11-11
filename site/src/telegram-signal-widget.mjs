import {WIDGET_THEME_CSS} from './telegram-workspace.mjs';
// Private recorded alert; no execution or fabricated performance.
export const SIGNAL_HISTORY_WIDGET_HTML = "<!doctype html><html><style>"+WIDGET_THEME_CSS+"</style><body><div class=\"shell\"><div class=\"head\"><div><div class=\"brand\"><span>◈</span> DrFXAi | Signal</div><div class=\"eyebrow\">RECORDED ALERT</div></div><span class=\"pill\">SIGNAL BRIDGE</span></div><div class=\"head\"><h2 id=\"symbol\">NO SIGNAL</h2><span class=\"side\" id=\"side\">—</span></div><div class=\"sub\" id=\"age\">No recorded timestamp</div><div class=\"rows\"><div class=\"row\"><small>◎ Entry reference</small><b class=\"gold\" id=\"entry\">—</b></div><div class=\"row\"><small>◈ Stop loss</small><b class=\"bad\" id=\"sl\">—</b></div><div class=\"row\"><small>◉ Target 1</small><b class=\"good\" id=\"tp1\">—</b></div><div class=\"row\"><small>◉ Target 2</small><b class=\"good\" id=\"tp2\">—</b></div><div class=\"row\"><small>◉ Target 3</small><b class=\"good\" id=\"tp3\">—</b></div></div><div class=\"actions\"><button id=\"refresh\" class=\"accent\">↻ Refresh</button><button id=\"copy\" class=\"primary\">Copy Signal</button><button id=\"history\">Signal History</button><button id=\"menu\">Main Menu</button></div><div class=\"foot\" id=\"message\">Recorded alert, not a live price. Broker fills and target hits require an EA receipt.</div></div><script>(function(){var T=window.TelegramWidget,d=document,s={},busy=false;try{s=JSON.parse(T&&T.chatData||'{}')}catch(x){}function e(k){return d.getElementById(k)}function set(k,v){e(k).textContent=v===null||v===undefined||v===''?'—':String(v)}function draw(){set('symbol',s.empty?'NO RECORDED SIGNAL':s.symbol||'—');set('side',s.empty?'—':s.side||'—');e('side').className='side'+(s.side==='SELL'?' sell':'');set('age',s.received||'No recorded timestamp');set('entry',s.entry===null||s.entry===undefined?'Not supplied':s.entry);set('sl',s.sl);for(var i=1;i<=3;i++)set('tp'+i,s.tps&&s.tps[i-1]);e('copy').disabled=!!s.empty||!s.symbol}e('refresh').onclick=function(){if(!T||busy)return;busy=true;e('refresh').disabled=true;set('message','Checking last recorded alert…');T.request('sb:signal:refresh').then(function(r){var a={};try{a=JSON.parse(r.result||'{}')}catch(x){}if(a.data)s=a.data;draw();set('message',a.message||'Record refreshed')},function(){set('message','Refresh unavailable. Try /signal again.')}).then(function(){busy=false;e('refresh').disabled=false})};e('copy').onclick=function(){if(T&&!s.empty)T.copyText([s.symbol+' '+s.side,'Entry: '+(s.entry||'Market'),'SL: '+(s.sl||'—')].concat((s.tps||[]).map(function(v,i){return 'TP'+(i+1)+': '+v})).join('\\n').slice(0,256))};function open(a){if(T)T.request(a).then(function(){set('message','Your workspace appears below.')},function(){set('message','Send /menu to open your workspace.')})}e('history').onclick=function(){open('ui:open:history:0')};e('menu').onclick=function(){open('ui:open:home')};if(T)T.onEvent('chatDataChanged',function(){try{s=JSON.parse(T.chatData||'{}');draw()}catch(x){}});draw();if(T&&T.ready)T.ready()})();</script></body></html>";
const safeNumber=value=>typeof value==='number'&&Number.isFinite(value)&&value>0?value:null;
export function signalHistoryWidgetData(row){
 if(!row)return JSON.stringify({empty:true});
 let s;try{s=JSON.parse(row.normalized_json||'');}catch{return JSON.stringify({empty:true});}
 if(!s||!['BUY','SELL'].includes(s.side)||!/^([A-Z0-9._-]{1,32})$/.test(String(s.symbol||''))||!s.order||!Array.isArray(s.order.take_profits)||!safeNumber(s.order.stop_loss))return JSON.stringify({empty:true});
 const tps=s.order.take_profits.slice(0,3).map(safeNumber).filter(v=>v!==null);
 const received=String(row.received_at||'').slice(0,24);
 return JSON.stringify({empty:false,symbol:s.symbol,side:s.side,entry:safeNumber(s.order.reference_price),sl:s.order.stop_loss,tps,received});
}


export function signalWidgetHtml(language) {
 if(language!=='fa')return SIGNAL_HISTORY_WIDGET_HTML;
 const labels={
  'DrFXAi | Signal':'DrFXAi | سیگنال','RECORDED ALERT':'هشدار ثبت‌شده',
  'SIGNAL BRIDGE':'سیگنال بریج','NO RECORDED SIGNAL':'سیگنالی ثبت نشده','NO SIGNAL':'بدون سیگنال',
  'No recorded timestamp':'زمان ثبت نشده','Entry reference':'قیمت ورود','Stop loss':'حد ضرر',
  'Target 1':'هدف اول','Target 2':'هدف دوم','Target 3':'هدف سوم','↻ Refresh':'به‌روزرسانی',
  'Copy Signal':'کپی سیگنال','Signal History':'تاریخچه سیگنال‌ها','Main Menu':'منوی اصلی',
  'Recorded alert, not a live price. Broker fills and target hits require an EA receipt.':'هشدار ثبت‌شده. برای تأیید اجرا یا رسیدن به هدف، گزارش MT5 را ببین.',
  'Not supplied':'تعیین نشده','Checking last recorded alert…':'در حال بررسی…','Record refreshed':'به‌روز شد',
  'Refresh unavailable. Try /signal again.':'به‌روزرسانی انجام نشد. دوباره تلاش کن.',
  'Your workspace appears below.':'ویجت در پیام بعدی باز می‌شود.','Send /menu to open your workspace.':'ویجت باز نشد. دوباره تلاش کن.'
 };
 let html=SIGNAL_HISTORY_WIDGET_HTML.replace('<div class="shell">','<div class="shell" dir="rtl">');
 for(const [english,persian] of Object.entries(labels))html=html.replaceAll(english,persian);
 return html;
}
