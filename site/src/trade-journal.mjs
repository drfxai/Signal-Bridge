// Broker-verified trade journal for the approved premium portal.
// All figures come from the authenticated, bounded D1 ledger; no example profits.
export const TRADE_JOURNAL_HTML=String.raw`
<section class="pp-card tj-panel" id="tradeJournal" aria-label="Broker-verified trade journal">
 <header class="tj-header"><div><small class="tj-kicker">MT5 · BROKER VERIFIED</small><h3 data-tj-text="heading">Trade Journal & Performance</h3><p class="pp-caption" data-tj-text="intro">Real deals and closed positions. No simulated results.</p></div><button type="button" id="tjRefresh" data-tj-text="refresh">Refresh</button></header>
 <div class="tj-controls"><label><span data-tj-text="period">Period</span><select id="tjPeriod"><option value="7">7 days</option><option value="30" selected>30 days</option><option value="90">90 days</option></select></label><label><span data-tj-text="scope">Scope</span><select id="tjScope"><option value="account">All MT5 deals</option><option value="signal">Signal Bridge-attributed only</option></select></label><button type="button" id="tjExport" data-tj-text="csv">Export verified deals</button></div>
 <p id="tjStatus" class="tj-status" role="status">Open Analytics to load your private MT5 trade history.</p>
 <div class="tj-metrics">
  <div><small data-tj-text="net">Net realized P/L</small><strong id="tjNet">—</strong></div>
  <div><small data-tj-text="wins">Win rate</small><strong id="tjWins">—</strong></div>
  <div><small data-tj-text="factor">Profit factor</small><strong id="tjFactor">—</strong></div>
  <div><small data-tj-text="closed">Closed positions</small><strong id="tjClosed">—</strong></div>
  <div><small data-tj-text="expectancy">Expectancy</small><strong id="tjExpectancy">—</strong></div>
  <div><small data-tj-text="drawdown">Closed-trade drawdown</small><strong id="tjDrawdown">—</strong></div>
 </div>
 <div class="tj-visuals"><div><h4 data-tj-text="curve">Broker-deal P/L curve</h4><div id="tjCurve" class="tj-curve" role="img" aria-label="Cumulative net P/L from verified broker deals"><p class="pp-empty">No verified broker deals yet.</p></div></div><div><h4 data-tj-text="calendar">Broker-date performance</h4><div id="tjCalendar" class="tj-calendar"></div></div></div>
 <div class="tj-tables"><div><h4 data-tj-text="positions">Reconciled closed positions</h4><div id="tjPositions" class="tj-scroll"></div></div><div><h4 data-tj-text="deals">Broker deal ledger</h4><div id="tjDeals" class="tj-scroll"></div></div></div>
 <p class="tj-footnote" data-tj-text="footnote">Fees included. Incomplete trades excluded from win rate. Session R, true equity drawdown and strategy R require further broker/risk data.</p>
</section>`;
export const TRADE_JOURNAL_CSS=String.raw`
#connectionActions .tj-panel{grid-column:1/-1;margin-top:18px;padding:22px}.tj-header{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.tj-header h3{font-size:19px!important;margin:4px 0}.tj-kicker{color:#dfc782;font-size:10px;letter-spacing:.15em}.tj-controls{display:flex;flex-wrap:wrap;align-items:end;gap:10px;margin:14px 0}.tj-controls label{display:grid;gap:4px;flex:1;min-width:145px;font-size:10px;color:#a7bfd5}.tj-controls select,#connectionActions .tj-panel button{min-height:37px;background:#152839;border:1px solid #38516b;border-radius:7px;color:#e6edf4;padding:8px 11px;font-size:11px}.tj-status{font-size:11px;color:#d6c491;margin:10px 0}.tj-metrics{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin:12px 0 20px}.tj-metrics>div{min-width:0;background:#0d1927;border:1px solid #2b4156;padding:13px 12px;border-radius:9px}.tj-metrics small{display:block;font-size:9px;color:#96b0cb}.tj-metrics strong{display:block;font-size:19px;overflow-wrap:anywhere;margin-top:7px;color:#e5ecf5}.tj-visuals,.tj-tables{display:grid;grid-template-columns:1fr 1fr;gap:16px}.tj-visuals>div,.tj-tables>div{min-width:0;padding:14px;background:#0e1b2a;border:1px solid #293e52;border-radius:10px}.tj-panel h4{font-size:12px;color:#c7d7e7;margin:0 0 13px}.tj-curve{min-height:145px}.tj-curve svg{width:100%;height:150px;display:block}.tj-calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;align-content:start}.tj-calendar>span{min-width:0;overflow:hidden;font-size:9px;text-align:center;background:#19372f;color:#67ddbd;padding:7px 3px;border-radius:5px}.tj-calendar>span.loss{background:#3c2730;color:#ef9eaf}.tj-calendar>span.empty{background:#1a2c3e;color:#8ba4bf}.tj-calendar small{display:block;font-size:8px}.tj-tables{margin-top:16px}.tj-scroll{max-height:320px;overflow:auto}.tj-row{display:grid;grid-template-columns:minmax(60px,1fr) minmax(70px,1fr) minmax(60px,.75fr) minmax(75px,1fr);gap:8px;padding:10px 4px;border-bottom:1px solid #2a4158;font-size:10px;align-items:center}.tj-row b{font-size:11px}.tj-row span{overflow-wrap:anywhere}.tj-row .win{color:#58d6b5}.tj-row .loss{color:#f09eb1}.tj-footnote{color:#91a8bf;font-size:10px;line-height:1.7;margin:18px 0 0}@media(max-width:1020px){.tj-metrics{grid-template-columns:repeat(3,minmax(0,1fr))}}@media(max-width:680px){#connectionActions .tj-panel{padding:13px}.tj-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.tj-visuals,.tj-tables{grid-template-columns:1fr}.tj-controls label{min-width:125px}.tj-calendar{grid-template-columns:repeat(7,minmax(0,1fr))}}@container workspace (max-width:650px){.tj-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.tj-visuals,.tj-tables{grid-template-columns:1fr}}
`;
export const TRADE_JOURNAL_JS=String.raw`
(()=>{const root=document.getElementById('tradeJournal');if(!root)return;
const $=id=>document.getElementById(id),t=(en,fa)=>document.documentElement.lang==='fa'?fa:en;
let data=null,loaded=0,busy=false,loggedOut=false,serial=0;
const esc=x=>String(x??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cash=x=>typeof x==='number'&&Number.isFinite(x)?x.toLocaleString(undefined,{maximumFractionDigits:2,minimumFractionDigits:2}):'—';
const money=x=>x===null||!Number.isFinite(Number(x))?'—':cash(Number(x));
const date=ms=>Number.isFinite(Number(ms))?new Date(Number(ms)).toISOString().slice(0,16).replace('T',' '):'—';
const positive=x=>Number(x)>=0?'win':'loss';
function active(){return !loggedOut&&!root.closest('[data-pp-view]')?.hidden&&document.querySelector('[data-pp-product=bridge]')?.getAttribute('aria-pressed')==='true'}
function state(message){$('tjStatus').textContent=message}
function drawCurve(rows){const el=$('tjCurve');if(!rows.length){el.textContent=t('No broker data yet.','هنوز داده‌ای از بروکر وجود ندارد.');return}
let running=0;const vals=[0,...rows.map(d=>(running+=Number(d.net)||0))],min=Math.min(...vals),max=Math.max(...vals),span=max-min||1;
const coords=vals.map((v,i)=>[12+i*456/(vals.length-1),145-(v-min)/span*130]),d=coords.map(([x,y],i)=>(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1)).join(' ');
el.innerHTML='<svg viewBox="0 0 480 160" role="img" aria-label="Verified broker realized P/L"><path d="M12 145 H468" stroke="#34495f" fill="none"/><path d="'+d+'" fill="none" stroke="#63c3e5" stroke-width="2.8" stroke-linecap="round"/></svg>';}
function render(){
const a=data?.analysis,metric=a?.metrics||{},coverage=a?.coverage||{};$('tjNet').textContent=money(metric.realized_net);
$('tjWins').textContent=metric.win_rate===null||metric.win_rate===undefined?'—':money(metric.win_rate)+'%';
$('tjFactor').textContent=money(metric.profit_factor);$('tjClosed').textContent=a?String(metric.closed_positions):'—';
$('tjExpectancy').textContent=money(metric.expectancy);$('tjDrawdown').textContent=money(metric.max_closed_trade_drawdown);
const deals=data?.deals||[],positions=a?.closed_positions||[];
const rows=a?.calendar||[];drawCurve(rows);
$('tjCalendar').innerHTML=rows.length?rows.slice(-35).map(d=>'<span class="'+positive(d.net)+'" title="'+esc(d.date)+'"><small>'+esc(d.date.slice(5))+'</small>'+esc(cash(d.net))+'</span>').join(''):'<p class="pp-empty">'+esc(t('Waiting for broker deals','در انتظار معاملات بروکر'))+'</p>';
$('tjPositions').innerHTML=positions.length?positions.slice(0,40).map(p=>'<div class="tj-row"><b>'+esc(p.symbol)+'</b><span>'+esc(date(p.closed_at))+'</span><span>'+esc(cash(p.volume))+'</span><span class="'+positive(p.net)+'">'+esc(cash(p.net))+'</span></div>').join(''):'<p class="pp-empty">'+esc(t('No fully reconciled closed positions','پوزیشن بسته‌شدهٔ کامل شناسایی نشد'))+'</p>';
$('tjDeals').innerHTML=deals.length?deals.slice(0,60).map(d=>'<div class="tj-row"><b>'+esc(d.symbol)+'</b><span>'+esc(date(d.deal_time_ms))+'</span><span>'+esc(d.entry_kind)+' · '+esc(d.side)+'</span><span class="'+positive(d.net)+'">'+esc(cash(d.net))+'</span></div>').join(''):'<p class="pp-empty">'+esc(t('No verified deals','دیل تأییدشده‌ای ثبت نشده'))+'</p>';
const msg=!a?t('No deal history loaded. Enable optional broker history in EA v0.30.0.','اطلاعاتی دریافت نشده؛ تاریخچه معاملات را در EA نسخه 0.30.0 فعال کنید.'):
 data.partial?t('Partial 400-deal window; full-account performance statistics withheld.','تنها بخشی از ۴۰۰ دیل اخیر نمایش داده می‌شود؛ آمار کامل حساب در دسترس نیست.'):
 t('Broker deals: ','دیل‌های بروکر: ')+coverage.broker_deals+' · '+t('Closed positions: ','پوزیشن‌های بسته‌شده: ')+coverage.closed_positions+' · '+t('Unassigned deals: ','دیل‌های فاقد تطبیق: ')+coverage.unassigned_deals;
state(msg);
}
async function load(force=false){
 if(!active()||busy||(!force&&Date.now()-loaded<60000))return;
 const id=++serial;busy=true;state(t('Loading broker-verified data…','در حال دریافت اطلاعات واقعی بروکر…'));
 try{
  const q=new URLSearchParams({days:$('tjPeriod').value,scope:$('tjScope').value});
  const response=await fetch('/api/member/trade-analytics?'+q,{credentials:'same-origin',headers:{accept:'application/json'},cache:'no-store'});
  const body=await response.json();if(!response.ok||!body.ok)throw Error(body.error||'ANALYTICS_UNAVAILABLE');
  if(id!==serial||loggedOut)return;data=body;loaded=Date.now();render();
 }catch(e){if(id===serial){data=null;render();state(t('Trade history is unavailable until the new EA and database migration are active.','تاریخچه تا فعال‌شدن نسخه جدید EA و مهاجرت دیتابیس در دسترس نیست.'));}}finally{busy=false;}
}
const labels={heading:['Trade Journal & Performance','ژورنال و تحلیل معاملات'],intro:['Real deals and closed positions. No simulated results.','دیل‌ها و پوزیشن‌های واقعی بدون آمار ساختگی'],refresh:['Refresh','تازه‌سازی'],period:['Period','بازه زمانی'],scope:['Scope','محدوده'],csv:['Export verified deals','دریافت CSV معاملات'],net:['Net realized P/L','سود و زیان خالص'],wins:['Win rate','درصد برد'],factor:['Profit factor','ضریب سود'],closed:['Closed positions','پوزیشن‌های بسته‌شده'],expectancy:['Expectancy','امید ریاضی'],drawdown:['Closed-trade drawdown','افت سرمایه معاملات بسته‌شده'],curve:['Broker-deal P/L curve','نمودار سود و زیان بروکر'],calendar:['Broker-date performance','تقویم عملکرد بروکر'],positions:['Reconciled closed positions','پوزیشن‌های بسته‌شدهٔ تطبیق‌یافته'],deals:['Broker deal ledger','دفتر دیل‌های بروکر'],footnote:['Fees included. Incomplete trades excluded from win rate. Session R, true equity drawdown and strategy R require further broker/risk data.','هزینه‌ها لحاظ شده‌اند؛ معاملات ناقص از درصد برد حذف شده‌اند. تحلیل R و افت واقعی اکوییتی به داده‌های بیشتر نیاز دارد.']};
function translate(){for(const n of root.querySelectorAll('[data-tj-text]')){const a=labels[n.dataset.tjText];if(a)n.textContent=t(...a)}}
window.addEventListener('signalbridge-workspace-tab',e=>{if(e.detail==='analytics'){translate();load()}});
window.addEventListener('signalbridge-authenticated',()=>{loggedOut=false;loaded=0});
window.addEventListener('signalbridge-signed-out',()=>{loggedOut=true;serial++;loaded=0;data=null;render();state(t('Sign in to view private trade history.','برای دیدن اطلاعات شخصی وارد شوید.'))});
document.querySelector('#premiumPortal')?.addEventListener('click',e=>{if(e.target.closest('[data-pp-product]')){loaded=0;queueMicrotask(()=>load())}});
$('tjPeriod').addEventListener('change',()=>{loaded=0;load()});$('tjScope').addEventListener('change',()=>{loaded=0;load()});
$('tjRefresh').addEventListener('click',()=>{loaded=0;load(true)});
$('tjExport').addEventListener('click',()=>{if(!data?.deals?.length)return;
 const cells=[['Deal ticket','MT5 broker time','Symbol','Side','Entry','Volume','Price','Net P/L','Source attributed'],...data.deals.map(x=>[x.deal_ticket,date(x.deal_time_ms),x.symbol,x.side,x.entry_kind,x.volume,x.price,x.net,x.signal_attributed?'yes':'no'])];
 const csv=cells.map(row=>row.map(v=>{let s=String(v??'');if(s && ('=+-@'.includes(s[0])||[9,13].includes(s.charCodeAt(0))))s="'"+s;return '"'+s.replace(/"/g,'""')+'"'}).join(',')).join('\r\n');
 const url=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='drfx-broker-verified-deals.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
new MutationObserver(translate).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});translate();render();
})();`;
