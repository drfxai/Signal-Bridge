import { parseTelegramSignal, evaluateDemoRisk, safeText } from './engine.mjs';

/**
 * SignalBridge UI prototype v2 — all fixtures are synthetic, no API calls.
 * Only non-sensitive demo preferences can be stored locally.
 */
const ICON = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const E = safeText;
const STORAGE = 'drfx-signalbridge-ui-v2';
const nav = [
  {id:'overview', icon:'grid', label:'overview', group:'main'},
  {id:'connections', icon:'link', label:'connections', group:'main'},
  {id:'routes', icon:'route', label:'routes', group:'main'},
  {id:'activity', icon:'activity', label:'activity', group:'main'},
  {id:'risk', icon:'shield', label:'risk', group:'operations'},
  {id:'telegram', icon:'telegram', label:'telegram', group:'operations'},
  {id:'settings', icon:'settings', label:'settings', group:'operations'}
];
const dictionary = {
 en: {
  mainMenu:'WORKSPACE',controlMenu:'OPERATIONS',protectedMode:'Safe preview mode',noLiveConnection:'No live trading connection',quickSearch:'Quick search',
  overview:'Overview',connections:'Connections',routes:'Signal Routes',activity:'Event Monitor',risk:'Risk Manager',telegram:'Telegram Hub',settings:'Settings',
  demoNotice:'INTERACTIVE DESIGN PREVIEW · No broker, Telegram or TradingView connection is active. All displayed figures are simulated.',
  eyebrow:'COMMAND CENTER',dashboardTitle:'Your signals. One command center.',dashboardDescription:'Institutional-grade visibility for TradingView, Telegram and MetaTrader 5. Every event, every route, every safeguard — in one place.',
  newRoute:'Create demo route',simulate:'Simulate an event',explore:'Explore architecture',liveAccounts:'Live MT5 accounts',sampleRoutes:'Demo routes',simulatedEvents:'Simulated signals',brokerOrders:'Real orders sent',
  neverConnected:'No agent paired',localPreview:'Locally configured',mockActivity:'Synthetic test events',noTrading:'Trading not implemented',
  heroBrow:'THE AUTOMATION LAYER · SIGNALBRIDGE 2.0',heroTitle:'From alert to action.',heroEmphasis:'Without the blind spots.',
  heroDesc:'A unified workspace for secure ingestion, rule-based risk checks, controlled dispatch and broker-level reconciliation.',
  demoOnly:'Safe sandbox • zero real orders',documented:'End-to-end audit design',
  signalTraffic:'Signal throughput',sampleTrend:'Synthetic activity over time',last7:'7D',last30:'30D',received:'Received',validated:'Validated',sourceStatus:'Source health',
  routingEngine:'Routing architecture',routingSubtitle:'Designed for verified, auditable execution',
  lastStage:'Not connected',warningNoAgent:'MT5 execution agent is not yet implemented or paired. This diagram illustrates the proposed flow.',
  integrations:'Integration readiness',integrationsSub:'Connect your preferred tools when the backend becomes available',openAll:'View integrations',
  recentEvents:'Recent activity',recentSub:'Example trace events — no actual executions',viewAll:'View all events',
  securityStack:'Operational safeguards',safety1:'Account-scoped authorization',safety1Sub:'Separate access per terminal and tenant',safety2:'Command deduplication',safety2Sub:'Avoid retry-driven double orders',safety3:'Broker-side confirmation',safety3Sub:'Execution status requires verified evidence',
  architectureLabel:'How SignalBridge is designed to work',source:'Source',riskGate:'Risk gate',mt5:'MT5 Agent',
  connectionsTitle:'Build your connection stack.',connectionsDesc:'A single place to manage source integrations, agent enrollment and safe, authorized connectivity. No live endpoints are deployed.',
  configure:'Setup guide',notConfigured:'Not connected',notAvailable:'Not implemented',
  tradingviewDesc:'Receive structured Pine Script alerts through an authenticated webhook.',telegramDesc:'Send alerts or parse messages from authorized Telegram channels.',mt5Desc:'Pair an execution Expert Advisor on a local terminal or Windows VPS.',
  plannedSetup:'Connection onboarding',plannedSetupDesc:'The future live journey, mapped into four safe steps',setupOne:'Choose source',setupTwo:'Secure connection',setupThree:'Pair MT5 terminal',setupFour:'Verify on demo',
  integrationRules:'Integration constraints',integrationRulesText:'TradingView accepts HTTPS webhooks; an MQL5 EA requires an active MT5 terminal. Telegram bots can only access permitted chats.',
  routesTitle:'Route every signal with intent.',routesDesc:'Configure which approved source feeds which destination, under a defined account policy. Route switches control this preview only.',
  routeCount:'Demo routes',draft:'Local draft',noRoutes:'No demo routes yet.',sourceToTarget:'Source to target',account:'Target account',policy:'Risk policy',created:'Created in local browser',
  activityTitle:'Every event. Fully traceable.',activityDesc:'Explore a sample lifecycle with separate acceptance, validation and simulated routing states. No real trade confirmations.',
  all:'All events',accepted:'Accepted',review:'Needs review',rejected:'Rejected',filter:'Filter events',event:'Event',instrument:'Instrument',action:'Action',outcome:'Outcome',time:'Time',
  riskTitle:'Trading safety at every layer.',riskDesc:'Design exposure limits and reject invalid signals before execution. These values are local demonstration preferences.',
  limitPolicy:'Example policy controls',maxLot:'Maximum lot size',maxPositions:'Max. open positions',dailyLoss:'Daily loss threshold (%)',maxSpread:'Spread limit (points)',saveDraft:'Save demo settings',
  safetyNote:'Real validation must additionally verify broker contract specifications, live margin and account equity. None of those are available here.',
  safetySwitch:'Emergency stop design',stopDesc:'Pausing new trades is distinct from closing current positions. This demonstration can pause only local mock routes.',
  pause:'Pause demo routes',resume:'Resume demo routes',paused:'All demo routes are paused',notPaused:'Demo routes are currently enabled in this preview',
  riskTest:'Risk-rule simulator',testLot:'Proposed lot size',testOpen:'Existing positions',testLoss:'Daily loss (%)',testSpread:'Spread (points)',checkRules:'Evaluate sample',riskEmpty:'Run a sample to view the local policy result.',
  telegramTitle:'Telegram, built for control.',telegramPageDesc:'Parse example text, preview normalized data and plan secure delivery from authorized channels. This page never reads Telegram.',
  parserTitle:'Signal interpretation lab',parserSubtitle:'Deterministic English-format parser, no AI or external connection',analyze:'Analyze text',exampleText:'Example channel message',result:'Structured result',
  sourcePermissions:'Channel permissions',permissionTitle:'Explicit access is mandatory',permissionBody:'Bots cannot read arbitrary private groups or channels. Access must be granted by authorized administrators, and each source must be allowlisted.',
  templateTitle:'Notification template',templateDesc:'Preview how a validated signal could be communicated to an authorized Telegram chat.',
  settingsTitle:'Make the workspace yours.',settingsDesc:'Adjust the appearance and language of the UI prototype. Settings contain no real account credentials.',
  interfaceTitle:'Interface preferences',language:'Interface language',appearance:'Appearance',dark:'Obsidian dark',light:'Pearl light',
  dataTitle:'Demonstration workspace',reset:'Reset all demo data',resetDesc:'Clear local sample routes and risk preferences. Existing repository files are not modified.',
  documentation:'Technical foundation',docsDesc:'Architecture, MQL5 execution policy, API design and security requirements are available in the repository.',openDocs:'View documentation',
  wizardTitle:'New demo route',wizardNext:'Continue',wizardBack:'Back',wizardCreate:'Create local draft',wizardSelect:'Choose a signal origin and destination.',wizardConfig:'Define a label and select the safety profile.',wizardReview:'Confirm your draft route. No server connection will be made.',
  routeName:'Route label',target:'Destination',channel:'Telegram notifications',accountDemo:'MT5 demo (unpaired)',routeMode:'Safety mode',manual:'Manual review first',demoMode:'Simulation only',
  cancel:'Cancel',close:'Close',eventDetail:'Event details',traceDesc:'An illustrative trace — not broker evidence',eventReason:'Execution intentionally unavailable in this prototype.',
  toastLocal:'Saved locally in this browser. No changes were sent to a server.',toastSimulated:'A simulated signal event was added. No trade was sent.',toastPaused:'Local demo routes paused.',toastResumed:'Local demo routes resumed.',toastCopied:'Example alert JSON copied.',toastNoClipboard:'Copy not available; select the text manually.',
  clearConfirm:'Reset all local SignalBridge demo preferences?',searchTitle:'Navigate workspace',searchPlaceholder:'Find a screen...', emptySearch:'No matching screens',
  overviewFooter:'All displayed data is fictional. No trading services are running.', on:'Enabled',off:'Paused',
  webhookExample:'Pine Script alert payload example',copyPayload:'Copy JSON example',note:'Design specification — not connected to external services',
  modeLabel:"Connection mode",
  realOrdersLabel:"Live orders",
  demoTag:"DEMO",
  demoExample:"DEMO EXAMPLE",
  tgAccess:"Webhook / channel access",
  tgPanel:"Authenticated control panel",
  sampleLine:"Synthetic signal trend",
  noMatchingEvents:"No matching events",
  stepLabel:"Step",
  inspectEvent:"Inspect event",
  riskPass:"Demo rules passed. Broker validation is still required.",
  riskCannotTrade:"Execution disabled in this preview",
  riskReject:"Sample rejected",
  riskPreviewPass:"Demo checks passed",
  riskError:"Invalid risk policy or sample input",
  localWarning:'All controls work locally and are intended to evaluate the interface. This product does not execute orders yet.'
 },
 fa: {
  mainMenu:'فضای کاری',controlMenu:'عملیات',protectedMode:'حالت پیش‌نمایش ایمن',noLiveConnection:'هیچ اتصال معاملاتی واقعی فعال نیست',quickSearch:'جستجوی سریع',
  overview:'نمای کلی',connections:'اتصال‌ها',routes:'مسیرهای سیگنال',activity:'رویدادها',risk:'مدیریت ریسک',telegram:'هاب تلگرام',settings:'تنظیمات',
  demoNotice:'پیش‌نمایش تعاملی طراحی · هیچ اتصال واقعی به بروکر، تلگرام یا تریدینگ‌ویو فعال نیست. همه آمارها آزمایشی هستند.',
  eyebrow:'مرکز فرماندهی',dashboardTitle:'همه سیگنال‌ها، یک مرکز کنترل.',dashboardDescription:'نظارت تخصصی بر TradingView، تلگرام و MetaTrader 5؛ با نمایش مسیر سیگنال، رویدادها و محافظت‌های اجرایی در یک محیط.',
  newRoute:'ساخت مسیر آزمایشی',simulate:'شبیه‌سازی رویداد',explore:'معماری محصول',liveAccounts:'حساب‌های MT5 واقعی',sampleRoutes:'مسیرهای آزمایشی',simulatedEvents:'سیگنال شبیه‌سازی‌شده',brokerOrders:'سفارش واقعی',
  neverConnected:'هیچ ایجنتی متصل نیست',localPreview:'فقط در مرورگر',mockActivity:'داده آزمایشی',noTrading:'معاملات هنوز پیاده‌سازی نشده‌اند',
  heroBrow:'لایه اتوماسیون · SIGNALBRIDGE 2.0',heroTitle:'از هشدار تا اجرا.',heroEmphasis:'با نظارت کامل بر هر مرحله.',heroDesc:'سامانه یکپارچه برای دریافت امن سیگنال، بررسی قوانین ریسک، مسیریابی کنترل‌شده و تطبیق نتیجه با بروکر.',
  demoOnly:'محیط ایمن · بدون ارسال سفارش',documented:'طراحی ثبت و پیگیری کامل رویداد',
  signalTraffic:'حجم سیگنال‌ها',sampleTrend:'روند فعالیت شبیه‌سازی‌شده',last7:'۷ روز',last30:'۳۰ روز',received:'دریافت‌شده',validated:'اعتبارسنجی‌شده',sourceStatus:'وضعیت منابع',
  routingEngine:'معماری مسیریابی',routingSubtitle:'طراحی‌شده برای اجرای قابل‌پیگیری',lastStage:'متصل نیست',warningNoAgent:'موتور اجرای MT5 هنوز ساخته یا متصل نشده است. این نمودار فقط معماری پیشنهادی را نمایش می‌دهد.',
  integrations:'آمادگی اتصال‌ها',integrationsSub:'پس از پیاده‌سازی Backend، منابع و ترمینال‌ها قابل اتصال خواهند بود',openAll:'مشاهده اتصال‌ها',
  recentEvents:'فعالیت‌های اخیر',recentSub:'نمونه رویدادها؛ بدون اجرای واقعی',viewAll:'همه رویدادها',
  securityStack:'محافظت‌های عملیاتی',safety1:'دسترسی مستقل هر حساب',safety1Sub:'مجوزهای جداگانه برای هر ترمینال',safety2:'جلوگیری از سفارش تکراری',safety2Sub:'حفاظت در برابر تکرار ارسال',safety3:'تأیید نتیجه توسط بروکر',safety3Sub:'وضعیت اجرا بر اساس شواهد واقعی',
  architectureLabel:'SignalBridge چگونه طراحی شده است',source:'منبع',riskGate:'موتور ریسک',mt5:'ایجنت MT5',
  connectionsTitle:'اتصال‌های خود را مدیریت کنید.',connectionsDesc:'محل یکپارچه تنظیم منابع سیگنال، ثبت ایجنت و مدیریت اتصال‌های مجاز. هنوز هیچ Endpoint واقعی مستقر نشده است.',
  configure:'راهنمای راه‌اندازی',notConfigured:'متصل نیست',notAvailable:'پیاده‌سازی نشده',
  tradingviewDesc:'دریافت Alert های Pine Script از Webhook احرازشده.',telegramDesc:'انتشار هشدار یا تحلیل پیام کانال‌های مجاز تلگرام.',mt5Desc:'اتصال Expert Advisor روی متاتریدر ویندوز یا VPS.',
  plannedSetup:'مسیر راه‌اندازی اتصال',plannedSetupDesc:'مراحل پیشنهادی راه‌اندازی ایمن',setupOne:'انتخاب منبع',setupTwo:'اتصال امن',setupThree:'اتصال ترمینال MT5',setupFour:'آزمایش در دمو',
  integrationRules:'محدودیت‌های اتصال',integrationRulesText:'TradingView از Webhook HTTPS استفاده می‌کند؛ EA متاتریدر به ترمینال فعال نیاز دارد؛ ربات تلگرام فقط چت‌های مجاز را می‌خواند.',
  routesTitle:'هر سیگنال، یک مسیر مشخص.',routesDesc:'منبع مجاز را با سیاست ریسک معین به مقصد وصل کنید. کلیدهای روشن/خاموش فقط این پیش‌نمایش را تغییر می‌دهند.',
  routeCount:'مسیر آزمایشی',draft:'پیش‌نویس محلی',noRoutes:'هنوز مسیری ساخته نشده است.',sourceToTarget:'مبدأ و مقصد',account:'حساب مقصد',policy:'سیاست ریسک',created:'ثبت‌شده در همین مرورگر',
  activityTitle:'هر رویداد، قابل ردیابی.',activityDesc:'مراحل نمونه دریافت، اعتبارسنجی و مسیریابی را مشاهده کنید. هیچ تأییدیه اجرای معامله واقعی وجود ندارد.',
  all:'همه',accepted:'پذیرفته‌شده',review:'نیازمند بررسی',rejected:'ردشده',filter:'فیلتر رویداد',event:'رویداد',instrument:'نماد',action:'دستور',outcome:'نتیجه',time:'زمان',
  riskTitle:'امنیت معامله در تمام مراحل.',riskDesc:'محدودیت‌های مواجهه با ریسک و دلایل رد سیگنال را بررسی کنید. تنظیمات این بخش صرفاً آزمایشی هستند.',
  limitPolicy:'تنظیمات سیاست ریسک آزمایشی',maxLot:'حداکثر حجم لات',maxPositions:'حداکثر معاملات باز',dailyLoss:'آستانه زیان روزانه (%)',maxSpread:'حداکثر اسپرد (پوینت)',saveDraft:'ذخیره آزمایشی',
  safetyNote:'برای استفاده واقعی، مشخصات نماد، مارجین و موجودی بروکر نیز باید بررسی شوند. این اطلاعات اکنون در دسترس نیستند.',
  safetySwitch:'طراحی توقف اضطراری',stopDesc:'توقف معاملات جدید با بستن پوزیشن‌های باز تفاوت دارد؛ در این نمونه فقط مسیرهای نمایشی متوقف می‌شوند.',
  pause:'توقف مسیرهای آزمایشی',resume:'فعال‌سازی مسیرهای آزمایشی',paused:'همه مسیرهای آزمایشی متوقف هستند',notPaused:'مسیرهای آزمایشی در این پیش‌نمایش فعال‌اند',
  riskTest:'آزمایش قوانین ریسک',testLot:'حجم پیشنهادی (لات)',testOpen:'تعداد معاملات باز',testLoss:'زیان روزانه (%)',testSpread:'اسپرد (پوینت)',checkRules:'آزمایش نمونه',riskEmpty:'برای مشاهده نتیجه محلی، یک آزمایش اجرا کنید.',
  telegramTitle:'تلگرام، با کنترل کامل.',telegramPageDesc:'پیام نمونه را تحلیل و خروجی ساختاریافته را بررسی کنید؛ این صفحه هیچ پیامی از تلگرام دریافت نمی‌کند.',
  parserTitle:'آزمایشگاه تحلیل سیگنال',parserSubtitle:'تجزیه متن انگلیسی مبتنی بر قواعد؛ بدون AI یا شبکه',analyze:'تحلیل متن',exampleText:'نمونه پیام کانال',result:'خروجی ساختاریافته',
  sourcePermissions:'مجوز کانال‌ها',permissionTitle:'دسترسی صریح الزامی است',permissionBody:'ربات به کانال‌های خصوصی دلخواه دسترسی ندارد. مدیر مجاز باید دسترسی دهد و هر منبع در فهرست مجاز ثبت شود.',
  templateTitle:'قالب اعلان تلگرام',templateDesc:'پیش‌نمایش شیوه اطلاع‌رسانی یک سیگنال معتبر به چت مجاز.',
  settingsTitle:'محیط کارتان را شخصی کنید.',settingsDesc:'زبان و ظاهر پیش‌نمایش را تنظیم کنید. هیچ اطلاعات حساب واقعی در این بخش نگهداری نمی‌شود.',
  interfaceTitle:'تنظیمات رابط کاربری',language:'زبان محیط',appearance:'ظاهر',dark:'تیره حرفه‌ای',light:'روشن مدرن',
  dataTitle:'محیط آزمایشی',reset:'بازنشانی داده‌های آزمایشی',resetDesc:'پاک کردن مسیرهای نمونه و تنظیمات ریسک این مرورگر؛ فایل‌های GitHub تغییر نمی‌کنند.',
  documentation:'مستندات تخصصی',docsDesc:'معماری فنی، اجرای MQL5، قرارداد API و الزامات امنیتی در ریپازیتوری موجود است.',openDocs:'مشاهده مستندات',
  wizardTitle:'ساخت مسیر آزمایشی',wizardNext:'ادامه',wizardBack:'بازگشت',wizardCreate:'ثبت پیش‌نویس محلی',wizardSelect:'منبع و مقصد سیگنال را مشخص کنید.',wizardConfig:'نام مسیر و سیاست ایمنی را انتخاب کنید.',wizardReview:'تنظیمات را بررسی کنید. هیچ اتصال سروری ایجاد نخواهد شد.',
  routeName:'نام مسیر',target:'مقصد',channel:'اعلان تلگرام',accountDemo:'حساب دمو MT5 (بدون اتصال)',routeMode:'حالت ایمنی',manual:'تأیید دستی',demoMode:'فقط شبیه‌سازی',
  cancel:'لغو',close:'بستن',eventDetail:'جزئیات رویداد',traceDesc:'ردیابی نمایشی؛ نه تأیید بروکر',eventReason:'اجرای معامله عمداً در این نمونه غیرفعال است.',
  toastLocal:'در مرورگر ذخیره شد؛ هیچ تغییری به سرور ارسال نشد.',toastSimulated:'رویداد آزمایشی اضافه شد؛ سفارشی ارسال نشد.',toastPaused:'مسیرهای آزمایشی متوقف شدند.',toastResumed:'مسیرهای آزمایشی فعال شدند.',toastCopied:'JSON نمونه کپی شد.',toastNoClipboard:'کپی ممکن نیست؛ متن را دستی انتخاب کنید.',
  clearConfirm:'تمام تنظیمات آزمایشی SignalBridge در این مرورگر بازنشانی شوند؟',searchTitle:'حرکت بین صفحات',searchPlaceholder:'نام صفحه را جستجو کنید...',emptySearch:'صفحه‌ای پیدا نشد',
  overviewFooter:'تمام داده‌های نمایش‌داده‌شده ساختگی هستند؛ سرویس معاملاتی فعال نیست.',on:'فعال',off:'متوقف',
  webhookExample:'نمونه JSON هشدار Pine Script',copyPayload:'کپی JSON نمونه',note:'مشخصات طراحی؛ بدون اتصال به سرویس خارجی',
  modeLabel:"حالت اتصال",
  realOrdersLabel:"سفارش واقعی",
  demoTag:"آزمایشی",
  demoExample:"نمونه آزمایشی",
  tgAccess:"وب‌هوک / دسترسی کانال",
  tgPanel:"پنل کنترل احرازشده",
  sampleLine:"روند ساختگی سیگنال‌ها",
  noMatchingEvents:"رویدادی مطابق فیلتر یافت نشد",
  stepLabel:"مرحله",
  inspectEvent:"بررسی رویداد",
  riskPass:"قوانین آزمایشی تأیید شدند؛ اعتبارسنجی بروکر هنوز لازم است.",
  riskCannotTrade:"اجرای واقعی در این نسخه غیرفعال است",
  riskReject:"رد در آزمایش",
  riskPreviewPass:"تأیید آزمایشی",
  riskError:"تنظیمات یا مقادیر ریسک نامعتبر است",
  localWarning:'همه کنترل‌ها صرفاً برای ارزیابی UI در مرورگر کار می‌کنند. محصول هنوز قادر به اجرای سفارش نیست.'
 }
};
const seedEvents = [
 {id:'SIM-2481',source:'TradingView',symbol:'XAUUSD',action:'BUY',status:'accepted',time:'10:42:18', note:'Schema and local example validation passed'},
 {id:'SIM-2480',source:'Telegram',symbol:'EURUSD',action:'SELL',status:'review',time:'10:39:02', note:'Ambiguous entry range; approval required'},
 {id:'SIM-2479',source:'TradingView',symbol:'GBPUSD',action:'MODIFY',status:'accepted',time:'10:34:55', note:'Demo command prepared; no terminal paired'},
 {id:'SIM-2478',source:'Telegram',symbol:'XAUUSD',action:'BUY',status:'rejected',time:'10:28:10', note:'Missing stop loss; rejected by rule'},
 {id:'SIM-2477',source:'TradingView',symbol:'BTCUSD',action:'CLOSE',status:'accepted',time:'10:12:04', note:'Simulated close intent; no position exists'},
 {id:'SIM-2476',source:'TradingView',symbol:'US30',action:'SELL',status:'review',time:'10:09:23', note:'Unverified broker symbol mapping'}
];
const seedRoutes = [
 {id:'demo-a',source:'TradingView',target:'MT5 Demo',name:'Gold momentum · Demo',policy:'Simulation only',symbol:'XAUUSD',enabled:true},
 {id:'demo-b',source:'TradingView',target:'Telegram',name:'Signal notification feed',policy:'Manual review first',symbol:'EURUSD',enabled:true},
 {id:'demo-c',source:'Telegram',target:'MT5 Demo',name:'Permissioned channel · Demo',policy:'Manual review first',symbol:'XAUUSD',enabled:false}
];
const defaults = () => ({locale:'en',theme:'dark',view:'overview',routes:structuredClone(seedRoutes),events:structuredClone(seedEvents),risk:{maxLots:0.1,maxOpen:3,dailyLoss:3,maxSpread:50},paused:false,period:'7D',activityFilter:'all',ribbon:true});
function load(){try{const raw=JSON.parse(localStorage.getItem(STORAGE));if(!raw||typeof raw!=='object')return defaults();const init=defaults();return {...init,locale:raw.locale==='fa'?'fa':'en',theme:raw.theme==='light'?'light':'dark',routes:Array.isArray(raw.routes)?raw.routes.slice(0,40).filter(r=>r&&typeof r.id==='string'):init.routes,events:Array.isArray(raw.events)?raw.events.slice(0,150).filter(e=>e&&typeof e.id==='string'):init.events,risk:Object.fromEntries(Object.entries(init.risk).map(([key,val])=>{const candidate=raw.risk?.[key];return [key,typeof candidate==='number'&&Number.isFinite(candidate)&&candidate>=0?candidate:val];})),paused:!!raw.paused,ribbon:raw.ribbon!==false};}catch{return defaults();}}
let state=load();let modal=null;let wizard={step:0,source:'TradingView',target:'MT5 Demo',name:'New strategy route',symbol:'XAUUSD',policy:'Simulation only'};let parserValue='BUY GOLD ENTRY 2500 SL 2490 TP1 2510 TP2 2520 TP3 2530';let parsed=null;let riskTestResult=null;
const t = k => dictionary[state.locale]?.[k] || dictionary.en[k] || k;
const save = () => { try{localStorage.setItem(STORAGE,JSON.stringify({locale:state.locale,theme:state.theme,routes:state.routes,events:state.events,risk:state.risk,paused:state.paused,ribbon:state.ribbon}));}catch{} };
const toast = msg => {const root=document.getElementById('toastRoot');const el=document.createElement('div');el.className='toast';el.innerHTML=`${ICON('check')} ${E(msg)}`;root.append(el);setTimeout(()=>el.remove(),3400);};
const statusTag=(key)=>({accepted:`<span class="tag good"><span class="dot"></span>${E(t('accepted'))}</span>`,review:`<span class="tag warn"><span class="dot"></span>${E(t('review'))}</span>`,rejected:`<span class="tag bad"><span class="dot"></span>${E(t('rejected'))}</span>`}[key] || `<span class="tag info">${E(key)}</span>`);
const navButton=(item)=>`<button type="button" class="nav-button ${state.view===item.id?'active':''}" data-nav="${item.id}" aria-current="${state.view===item.id?'page':'false'}">${ICON(item.icon)}<span>${E(t(item.label))}</span>${item.id==='routes'?`<small class="nav-counter">${state.routes.length}</small>`:''}</button>`;
const title=(brow,heading,desc,action='')=>`<div class="page-head"><div><div class="eyebrow">${E(t(brow))}</div><h1>${E(t(heading))}</h1><p class="page-summary">${E(t(desc))}</p></div>${action}</div>`;
const panelHead=(name,sub,action='')=>`<div class="section-top"><div><h2>${E(t(name))}</h2>${sub?`<p>${E(t(sub))}</p>`:''}</div>${action}</div>`;
function drawChart(){
 let data=state.period==='7D'?[8,13,11,18,16,27,21,23,17,31,28,34,30,38,32,44,39,42,49,45,51,46,58,55,60,57,68,62,71,74]:[8,10,13,11,17,19,15,22,20,28,25,23,29,33,37,32,40,38,45,43,49,55,51,59,62,58,70,67,74,79];
 const width=720,height=184,yTop=10,yBot=149;const pts=data.map((v,i)=>[Math.round(i/(data.length-1)*width),Math.round(yBot-v/85*(yBot-yTop))]);
 const path='M'+pts.map(p=>p.join(',')).join(' L');const fill=path+` L${width},${yBot} L0,${yBot} Z`;
 const second=pts.map(([x,y],i)=>[x,Math.min(145,Math.round(y+28+Math.sin(i*.9)*11))]);const secondPath='M'+second.map(p=>p.join(',')).join(' L');
 const circles=pts.filter((_,i)=>i===data.length-1).map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#a39aff" stroke="var(--surface)" stroke-width="3"/>`).join('');
 return `<svg class="area-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${E(t('sampleLine'))}"> <defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#928dff" stop-opacity=".28"/><stop offset="1" stop-color="#928dff" stop-opacity="0"/></linearGradient></defs>${[22,64,107,149].map(y=>`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="var(--border)" stroke-dasharray="3,5"/>`).join('')}<path d="${fill}" fill="url(#chart-fill)"/><path d="${secondPath}" fill="none" stroke="var(--cyan)" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/><path d="${path}" fill="none" stroke="#9a91ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>${circles}${[0,1,2,3,4,5,6].map((x,i)=>`<text x="${x*120}" y="178" fill="var(--faint)" font-size="10" text-anchor="${i===0?'start':i===6?'end':'middle'}">${state.period==='7D'?['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]:'W'+(i+1)}</text>`).join('')}</svg>`;
}
const heroGraphic=()=>`<div class="hero-graphic" aria-hidden="true"><div class="hero-orbit"></div><div class="hero-orbit"></div><div class="hero-orbit"></div><div class="hero-center">⌁</div><div class="hero-node one"></div><div class="hero-node two"></div><div class="hero-node three"></div></div>`;
function eventsTable(limit=20){let rows=state.events.filter(e=>state.activityFilter==='all'||state.activityFilter===e.status).slice(0,limit);return `<div class="table-scroll"><table class="data-table"><thead><tr><th>${E(t('event'))}</th><th>${E(t('source'))}</th><th>${E(t('instrument'))}</th><th>${E(t('action'))}</th><th>${E(t('outcome'))}</th><th>${E(t('time'))}</th></tr></thead><tbody>${rows.length?rows.map(e=>`<tr data-event="${E(e.id)}" tabindex="0" role="button" aria-label="${E(t('inspectEvent'))} ${E(e.id)}"><td class="mono">${E(e.id)}</td><td>${E(e.source)}</td><td class="bolder">${E(e.symbol)}</td><td><span class="tag info">${E(e.action)}</span></td><td>${statusTag(e.status)}</td><td class="mono muted">${E(e.time)}</td></tr>`).join(''):`<tr><td colspan="6"><div class="empty-state">${E(t('noMatchingEvents'))}</div></td></tr>`}</tbody></table></div>`;}
function overview(){return `${title('eyebrow','dashboardTitle','dashboardDescription',`<button class="btn primary" data-action="route-wizard">${ICON('plus')}${E(t('newRoute'))}</button>`)}
 <section class="card hero" aria-label="Product design overview"><div class="hero-content"><div class="hero-eyebrow">${E(t('heroBrow'))}</div><h2>${E(t('heroTitle'))}<br/><span class="gradient-text">${E(t('heroEmphasis'))}</span></h2><p>${E(t('heroDesc'))}</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn primary" data-action="simulate">${ICON('play')}${E(t('simulate'))}</button><button class="btn secondary" data-nav="connections">${E(t('explore'))}${ICON('arrow')}</button></div><div class="hero-bottom"><span>${ICON('shield')}${E(t('demoOnly'))}</span><span>${ICON('activity')}${E(t('documented'))}</span></div></div>${heroGraphic()}</section>
 <section class="metrics" aria-label="Local demo statistics">
 ${[[t('liveAccounts'),'0',t('neverConnected'),'terminal'],[t('sampleRoutes'),String(state.routes.length).padStart(2,'0'),t('localPreview'),'route'],[t('simulatedEvents'),String(24+Math.max(0,state.events.length-seedEvents.length)),t('mockActivity'),'activity'],[t('brokerOrders'),'0',t('noTrading'),'shield']].map(([name,val,note,ic])=>`<article class="card metric"><div class="metric-head"><span>${E(name)}</span>${ICON(ic)}</div><div class="metric-value">${E(val)}</div><div class="metric-foot">${E(note)}</div></article>`).join('')}</section>
 <section class="grid-dashboard" aria-label="Signals and workflow">
  <article class="card graph-card">${panelHead('signalTraffic','sampleTrend',`<div class="graph-tabs"><button data-period="7D" aria-pressed="${state.period==='7D'}">${E(t('last7'))}</button><button data-period="30D" aria-pressed="${state.period==='30D'}">${E(t('last30'))}</button></div>`)}${drawChart()}<div class="chart-legend"><span><i class="sample-square"></i>${E(t('received'))}</span><span><i class="sample-square cyan"></i>${E(t('validated'))}</span><span class="align-end">SAMPLE DATA</span></div></article>
  <article class="card flow-card">${panelHead('routingEngine','routingSubtitle')}<div class="flow-graphic"><div class="flow-node"><div class="flow-icon">${ICON('chart')}</div><b>TradingView<br/>Telegram</b><small>${E(t('source'))}</small></div><div class="flow-arrow"></div><div class="flow-node engine"><div class="flow-icon">${ICON('shield')}</div><b>DrFX Router</b><small>${E(t('riskGate'))}</small></div><div class="flow-arrow right"></div><div class="flow-node"><div class="flow-icon">${ICON('terminal')}</div><b>MetaTrader 5</b><small>${E(t('lastStage'))}</small></div></div><div class="callout">${ICON('alert')}<span>${E(t('warningNoAgent'))}</span></div></article>
 </section>
 <section class="section-stack"><div class="section-top" style="margin:5px 0 -3px"><div><h2>${E(t('integrations'))}</h2><p>${E(t('integrationsSub'))}</p></div><button class="text-button" data-nav="connections">${E(t('openAll'))} ${ICON('arrow')}</button></div><div class="connector-grid">${connectorCard('TradingView','chart','tv','tradingviewDesc')}${connectorCard('Telegram','telegram','tg','telegramDesc')}${connectorCard('MetaTrader 5','terminal','mt','mt5Desc')}</div></section>
 <section class="bottom-grid"><article class="card activity-card">${panelHead('recentEvents','recentSub',`<button class="text-button" data-nav="activity">${E(t('viewAll'))} ${ICON('arrow')}</button>`)}${eventsTable(4)}</article><article class="card card-pad">${panelHead('securityStack')}<div class="side-stat"><div><b>${E(t('safety1'))}</b><p>${E(t('safety1Sub'))}</p></div>${ICON('shield')}</div><div class="side-stat"><div><b>${E(t('safety2'))}</b><p>${E(t('safety2Sub'))}</p></div>${ICON('layer')}</div><div class="side-stat"><div><b>${E(t('safety3'))}</b><p>${E(t('safety3Sub'))}</p></div>${ICON('check')}</div><div class="callout" style="margin-top:15px">${ICON('info')}<span>${E(t('note'))}</span></div></article></section>`;}
function connectorCard(name,ic,cls,desc){return `<article class="card connector-card"><div class="connector-top"><div class="product-logo ${cls}">${ICON(ic)}</div><span class="tag warn">${E(t('notConfigured'))}</span></div><div><h3>${E(name)}</h3><p>${E(t(desc))}</p></div><div class="connector-foot"><span class="muted-small">${E(t('lastStage'))}</span><button class="text-button" data-action="guide" data-guide="${E(name)}">${E(t('configure'))} ${ICON('arrow')}</button></div></article>`;}
function connections(){return `${title('controlMenu','connectionsTitle','connectionsDesc')}<div class="connector-grid" style="margin-bottom:17px">${connectorCard('TradingView','chart','tv','tradingviewDesc')}${connectorCard('Telegram','telegram','tg','telegramDesc')}${connectorCard('MetaTrader 5','terminal','mt','mt5Desc')}</div><div class="callout warning" style="margin-bottom:18px">${ICON('alert')}<span>${E(t('integrationRulesText'))}</span></div>
 <div class="two-column"><section class="card card-pad">${panelHead('plannedSetup','plannedSetupDesc')}${[['setupOne','1'],['setupTwo','2'],['setupThree','3'],['setupFour','4']].map(([key,num])=>`<div class="connection-guide"><span class="step-dot">${num}</span><div><b>${E(t(key))}</b><p>${E(['Choose TradingView or a Telegram channel','Set connection scope and token permissions','Install a trusted MQL5 Expert Advisor','Confirm a broker receipt on a demo account'][Number(num)-1])}</p></div></div>`).join('')}</section>
 <section class="card card-pad">${panelHead('webhookExample')}<p class="muted-small" style="margin-bottom:15px">${E(t('note'))}. The example is a payload design — not a working URL.</p><div class="api-example"><button class="copy-code" data-action="copy-json">${ICON('copy')}${E(t('copyPayload'))}</button><pre class="mono-block" id="webhookExample">${E(JSON.stringify(exampleSignal,null,2))}</pre></div></section></div>`;}
const exampleSignal={schema_version:'1.0',external_signal_id:'{{strategy.order.id}}',source_type:'tradingview',action:'OPEN',side:'BUY',symbol:'XAUUSD',order:{type:'MARKET',volume:{mode:'FIXED_LOTS',value:0.01},stop_loss:2490,take_profits:[2510,2520,2530]},execution_mode:'DEMO'};
function routes(){return `${title('mainMenu','routesTitle','routesDesc',`<button class="btn primary" data-action="route-wizard">${ICON('plus')}${E(t('newRoute'))}</button>`)}<div class="callout" style="margin-bottom:18px">${ICON('info')}<span>${E(t('localWarning'))}</span></div><div class="section-top"><div><h2>${E(t('routeCount'))} <span class="pill-number">${state.routes.length}</span></h2></div><span class="tag purple">${E(t('draft'))}</span></div>${state.routes.length?`<div class="subgrid">${state.routes.map(r=>`<article class="card route-card"><header><div><h3>${E(r.name)}</h3><p>${E(t('draft'))} · ${E(r.symbol)}</p></div><button class="toggle" role="switch" type="button" aria-label="Toggle local route ${E(r.name)}" aria-checked="${!state.paused&&r.enabled}" data-route-id="${E(r.id)}"></button></header><div class="route-source">${ICON(r.source==='Telegram'?'telegram':'chart')}<span>${E(r.source)}</span>${ICON('arrow')}${ICON(r.target==='Telegram'?'telegram':'terminal')}<span>${E(r.target)}</span></div><div class="route-details"><div class="route-meta"><span>${E(t('account'))}</span><b>${E(r.target)}</b></div><div class="route-meta"><span>${E(t('policy'))}</span><b>${E(r.policy)}</b></div><div class="route-meta"><span>${E(t('sourceStatus'))}</span><b>${E(t('notConfigured'))}</b></div></div><div class="routes-footer"><span>${E(t('created'))}</span><span class="tag ${!state.paused&&r.enabled?'good':'warn'}">${E(!state.paused&&r.enabled?t('on'):t('off'))}</span></div></article>`).join('')}</div>`:`<div class="card empty-state"><h3>${E(t('noRoutes'))}</h3><button class="btn primary" data-action="route-wizard">${E(t('newRoute'))}</button></div>`}`;}
function activity(){return `${title('mainMenu','activityTitle','activityDesc',`<button class="btn" data-action="simulate">${ICON('play')}${E(t('simulate'))}</button>`)}<section class="card card-pad">${panelHead('recentEvents','recentSub')}<div class="tabbar">${['all','accepted','review','rejected'].map(k=>`<button class="${state.activityFilter===k?'active':''}" data-filter="${k}">${E(t(k))}</button>`).join('')}</div>${eventsTable(100)}</section>`;}
function risk(){return `${title('controlMenu','riskTitle','riskDesc')}<div class="two-column"><div class="section-stack"><section class="card panel-content">${panelHead('limitPolicy')}<div class="callout warning" style="margin-bottom:18px">${ICON('alert')}<span>${E(t('safetyNote'))}</span></div><form id="riskPolicyForm" class="form-grid">${[['maxLots','maxLot',0.01,100,0.01],['maxOpen','maxPositions',1,100,1],['dailyLoss','dailyLoss',0.1,100,0.1],['maxSpread','maxSpread',1,10000,1]].map(([key,label,min,max,step])=>`<div class="field"><label for="policy-${key}">${E(t(label))}</label><input class="input" id="policy-${key}" name="${key}" type="number" value="${E(state.risk[key])}" min="${min}" max="${max}" step="${step}" required/></div>`).join('')}<div class="form-actions" style="grid-column:1/-1"><button type="submit" class="btn primary">${ICON('check')}${E(t('saveDraft'))}</button></div></form></section><section class="danger-zone"><div><h3>${E(t('safetySwitch'))}</h3><p>${E(t('stopDesc'))}</p><p style="margin-top:10px"><span class="tag ${state.paused?'bad':'good'}">${E(state.paused?t('paused'):t('notPaused'))}</span></p></div><button class="btn ${state.paused?'secondary':'danger'}" data-action="pause">${ICON(state.paused?'play':'pause')}${E(t(state.paused?'resume':'pause'))}</button></section></div><div class="section-stack"><section class="card panel-content">${panelHead('riskTest')}<form id="riskTestForm" class="form-grid">${[['lots','testLot','0.05','0.01','10','0.01'],['openPositions','testOpen','1','0','30','1'],['dailyLossPercent','testLoss','0.5','0','100','0.1'],['spreadPoints','testSpread','16','0','10000','1']].map(([name,label,value,min,max,step])=>`<div class="field"><label for="test-${name}">${E(t(label))}</label><input class="input" name="${name}" id="test-${name}" type="number" value="${value}" min="${min}" max="${max}" step="${step}" required/></div>`).join('')}<div class="form-actions" style="grid-column:1/-1"><button class="btn primary" type="submit">${ICON('shield')}${E(t('checkRules'))}</button></div></form><div id="riskResult">${riskTestResult?riskTestMarkup(riskTestResult):`<p class="muted-small" style="margin-top:19px">${E(t('riskEmpty'))}</p>`}</div></section><section class="card card-pad">${panelHead('securityStack')}<div class="risk-mini"><div><small>${E(t('modeLabel'))}</small><b>${E(t('demoTag'))}</b></div><div><small>${E(t('realOrdersLabel'))}</small><b>0</b></div></div></section></div></div>`;}
function riskTestMarkup(r){
 const title=r.decision==='REJECTED'?t('riskReject'):t('riskPreviewPass');
 const details=r.reasons.length?(state.locale==='fa'?t('riskError')+' · ':'' )+r.reasons.join(' · '):t('riskPass');
 return '<div class="risk-result"><span class="tag '+(r.decision==='REJECTED'?'bad':'good')+'">'+E(title)+'</span><p style="margin-top:9px">'+E(details)+'</p><p style="margin-top:7px">'+E(t('riskCannotTrade'))+'</p></div>';
}
function telegram(){return `${title('controlMenu','telegramTitle','telegramPageDesc')}<div class="two-column"><section class="card panel-content">${panelHead('parserTitle','parserSubtitle')}<div class="field"><label for="telegramMessage">${E(t('exampleText'))}</label><textarea class="textarea" id="telegramMessage" rows="4">${E(parserValue)}</textarea></div><button class="btn primary" style="margin:17px 0" data-action="parse">${ICON('play')}${E(t('analyze'))}</button><div class="section-label" style="margin-bottom:9px">${E(t('result'))}</div><pre class="mono-block" id="parserOutput">${E(parsed?JSON.stringify(parsed,null,2):'{ "parser": "deterministic-demo-v3", "executable": false }')}</pre></section><div class="section-stack"><section class="card panel-content">${panelHead('sourcePermissions')}<div class="product-logo tg" style="margin-bottom:13px">${ICON('telegram')}</div><h3>${E(t('permissionTitle'))}</h3><p class="muted-small" style="margin-top:8px">${E(t('permissionBody'))}</p><div class="status-line"><div><strong>Telegram Bot API</strong><small>${E(t('tgAccess'))}</small></div><span class="tag warn">${E(t('notConfigured'))}</span></div><div class="status-line"><div><strong>Telegram Mini App</strong><small>${E(t('tgPanel'))}</small></div><span class="tag warn">${E(t('notAvailable'))}</span></div></section><section class="card panel-content">${panelHead('templateTitle','templateDesc')}<div class="soft-panel" style="padding:16px"><div style="display:flex;align-items:center;gap:7px;color:var(--cyan);font-weight:800;font-size:11px;margin-bottom:12px">${ICON('telegram')}DrFXAi SignalBridge</div><div class="mono" style="line-height:2;font-size:11px;color:var(--text-soft)">📈 XAUUSD · BUY<br/>Entry: 2500.00<br/>SL: 2490.00<br/>TP1: 2510.00 | TP2: 2520.00<br/><span class="tag warn">${E(t('demoExample'))}</span></div></div></section></div></div>`;}
function settings(){return `${title('controlMenu','settingsTitle','settingsDesc')}<div class="two-column"><section class="card panel-content">${panelHead('interfaceTitle')}<div class="field"><label>${E(t('language'))}</label><div class="segment-tabs"><button class="${state.locale==='en'?'active':''}" data-locale="en">English</button><button class="${state.locale==='fa'?'active':''}" data-locale="fa">فارسی</button></div></div><div class="field" style="margin-top:21px"><label>${E(t('appearance'))}</label><div class="segment-tabs"><button class="${state.theme==='dark'?'active':''}" data-theme="dark">${ICON('moon')}${E(t('dark'))}</button><button class="${state.theme==='light'?'active':''}" data-theme="light">${ICON('sun')}${E(t('light'))}</button></div></div><div class="callout" style="margin-top:20px">${ICON('info')}<span>${E(t('localWarning'))}</span></div></section><div class="section-stack"><section class="card panel-content">${panelHead('documentation','docsDesc')}<a class="btn secondary" href="https://github.com/drfxai/Signal-Bridge/tree/main/docs" target="_blank" rel="noopener noreferrer">${ICON('external')}${E(t('openDocs'))}</a></section><section class="card panel-content">${panelHead('dataTitle','resetDesc')}<button class="btn danger" data-action="reset">${ICON('alert')}${E(t('reset'))}</button></section></div></div>`;}
function render(){
 document.documentElement.lang=state.locale;
 document.documentElement.dir=state.locale==='fa'?'rtl':'ltr';
 document.documentElement.dataset.theme=state.theme;
 document.getElementById('primaryNav').innerHTML=nav.filter(i=>i.group==='main').map(navButton).join('');
 document.getElementById('operationsNav').innerHTML=nav.filter(i=>i.group==='operations').map(navButton).join('');
 document.querySelectorAll('[data-i18n]').forEach(n=>{n.textContent=t(n.dataset.i18n);});
 document.getElementById('breadcrumb').textContent=t(state.view);
 document.getElementById('ribbonText').textContent=t('demoNotice');
 document.getElementById('ribbonDismiss').setAttribute('aria-label',t('close'));
 document.querySelector('.preview-ribbon').classList.toggle('hidden',!state.ribbon);
 document.getElementById('viewRoot').innerHTML=({overview,connections,routes,activity,risk,telegram,settings}[state.view]||overview)();
 document.getElementById('sidebar').classList.remove('open');document.getElementById('mobileOverlay').classList.remove('open');
 document.getElementById('themeToggle').innerHTML=ICON(state.theme==='dark'?'sun':'moon');
 save();
}
function switchView(page){if(!nav.some(n=>n.id===page))return;state.view=page;state.activityFilter='all';render();window.scrollTo({top:0,behavior:'instant'});document.getElementById('viewRoot').focus({preventScroll:true});}
function simulate(){const id='SIM-'+(2400+Math.floor(Math.random()*7000));const now=new Date().toLocaleTimeString('en-GB',{hour12:false});state.events.unshift({id,source:'TradingView',symbol:'XAUUSD',action:'BUY',status:state.paused?'rejected':'accepted',time:now,note:state.paused?'Preview gate paused, no routing':'Validated in local demonstration only; no agent connected'});state.events=state.events.slice(0,150);render();toast(t('toastSimulated'));}
function handleClick(ev){
 const button=ev.target.closest('button[data-nav],button[data-action],button[data-period],button[data-filter],button[data-route-id],button[data-locale],button[data-theme],tr[data-event]');if(!button)return;
 if(button.dataset.nav){switchView(button.dataset.nav);return;}
 if(button.dataset.period){state.period=button.dataset.period;render();return;}
 if(button.dataset.filter){state.activityFilter=button.dataset.filter;render();return;}
 if(button.dataset.locale){state.locale=button.dataset.locale;render();toast(t('toastLocal'));return;}
 if(button.dataset.theme){state.theme=button.dataset.theme;render();toast(t('toastLocal'));return;}
 if(button.dataset.routeId){const r=state.routes.find(r=>r.id===button.dataset.routeId);if(!r)return;if(state.paused){toast(t('toastPaused'));return;}r.enabled=!r.enabled;render();toast(t('toastLocal'));return;}
 if(button.dataset.event){openEvent(button.dataset.event);return;}
 switch(button.dataset.action){case 'simulate':simulate();break;case 'route-wizard':startWizard();break;case 'pause':state.paused=!state.paused;render();toast(t(state.paused?'toastPaused':'toastResumed'));break;
 case 'parse':{const textarea=document.getElementById('telegramMessage');parserValue=textarea?.value||'';parsed=parseTelegramSignal(parserValue);render();document.getElementById('parserOutput')?.scrollIntoView({block:'nearest'});break;}
 case 'guide':openGuide(button.dataset.guide);break;case 'copy-json':copyText(JSON.stringify(exampleSignal,null,2));break;
 case 'reset':if(window.confirm(t('clearConfirm'))){try{localStorage.removeItem(STORAGE);}catch{}state=defaults();parsed=null;riskTestResult=null;render();toast(t('toastLocal'));}break;
 case 'search':openSearch();break;case 'workspace':toast(t('noLiveConnection'));break;
 }
}
async function copyText(value){try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);toast(t('toastCopied'));return;}}catch{}const tmp=document.createElement('textarea');tmp.value=value;document.body.appendChild(tmp);tmp.select();const ok=document.execCommand('copy');tmp.remove();toast(t(ok?'toastCopied':'toastNoClipboard'));}
function openModal(body,heading,footer=''){const root=document.getElementById('overlayRoot');root.innerHTML=`<div class="dialog-backdrop" id="modalBackdrop"><div class="dialog-box" role="dialog" aria-modal="true" aria-labelledby="dialogHeading"><div class="dialog-head"><h2 id="dialogHeading">${E(heading)}</h2><button class="icon-button" data-modal-close aria-label="Close">${ICON('close')}</button></div><div class="dialog-body">${body}</div>${footer?`<div class="dialog-footer">${footer}</div>`:''}</div></div>`;modal=root.querySelector('.dialog-backdrop');modal.addEventListener('click',ev=>{if(ev.target===modal||ev.target.closest('[data-modal-close]'))closeModal();});modal.querySelector('button[data-modal-close]')?.focus();}
function closeModal(){document.getElementById('overlayRoot').innerHTML='';modal=null;}
function startWizard(){wizard={step:0,source:'TradingView',target:'MT5 Demo',name:'New strategy route',symbol:'XAUUSD',policy:'Simulation only'};renderWizard();}
function renderWizard(){const steps=[t('wizardSelect'),t('wizardConfig'),t('wizardReview')];let body=`<div class="wizard-tracker">${steps.map((s,i)=>`<div class="${i<=wizard.step?'done':''}" aria-label="${E(t('stepLabel'))} ${i+1}" title="${E(s)}"></div>`).join('')}</div><p class="muted-small" style="margin:0 0 17px">${E(steps[wizard.step])}</p>`;
 if(wizard.step===0){body+=`<div class="field" style="margin-bottom:17px"><label>${E(t('source'))}</label><div class="wizard-choices">${['TradingView','Telegram'].map((x)=>`<button class="choice ${wizard.source===x?'chosen':''}" data-wizard-source="${x}">${ICON(x==='Telegram'?'telegram':'chart')}<b>${E(x)}</b><small>${E(x==='Telegram'?t('telegramDesc'):t('tradingviewDesc'))}</small></button>`).join('')}</div></div><div class="field"><label>${E(t('target'))}</label><div class="wizard-choices">${['MT5 Demo','Telegram'].map(x=>`<button class="choice ${wizard.target===x?'chosen':''}" data-wizard-target="${x}">${ICON(x==='Telegram'?'telegram':'terminal')}<b>${E(x==='Telegram'?t('channel'):t('accountDemo'))}</b><small>${E(t('note'))}</small></button>`).join('')}</div></div>`;}
 if(wizard.step===1)body+=`<div class="form-grid"><div class="field"><label for="wizardName">${E(t('routeName'))}</label><input id="wizardName" class="input" required maxlength="65" value="${E(wizard.name)}"/></div><div class="field"><label for="wizardSymbol">${E(t('instrument'))}</label><select id="wizardSymbol" class="select">${['XAUUSD','EURUSD','GBPUSD','BTCUSD','US30'].map(x=>`<option ${wizard.symbol===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field" style="grid-column:1/-1"><label for="wizardPolicy">${E(t('routeMode'))}</label><select id="wizardPolicy" class="select"><option ${wizard.policy==='Simulation only'?'selected':''}>Simulation only</option><option ${wizard.policy==='Manual review first'?'selected':''}>Manual review first</option></select></div></div>`;
 if(wizard.step===2)body+=`<div class="dialog-review">${[[t('routeName'),wizard.name],[t('source'),wizard.source],[t('target'),wizard.target],[t('instrument'),wizard.symbol],[t('routeMode'),wizard.policy]].map(([k,v])=>`<div class="review-line"><span>${E(k)}</span><b>${E(v)}</b></div>`).join('')}</div><div class="callout" style="margin-top:18px">${ICON('shield')}<span>${E(t('localWarning'))}</span></div>`;
 const footer=`<button class="btn secondary" data-modal-close>${E(t('cancel'))}</button>${wizard.step>0?`<button class="btn" data-wizard-back>${E(t('wizardBack'))}</button>`:''}<button class="btn primary" data-wizard-next>${ICON(wizard.step===2?'check':'arrow')}${E(wizard.step===2?t('wizardCreate'):t('wizardNext'))}</button>`;
 openModal(body,t('wizardTitle'),footer);
}
function wizardNext(){if(wizard.step===1){const nm=document.getElementById('wizardName')?.value?.trim();if(!nm){document.getElementById('wizardName')?.focus();return;}wizard.name=nm;wizard.symbol=document.getElementById('wizardSymbol')?.value||'XAUUSD';wizard.policy=document.getElementById('wizardPolicy')?.value||'Simulation only';}if(wizard.step<2){wizard.step++;renderWizard();return;}state.routes.push({id:'draft-'+Date.now(),source:wizard.source,target:wizard.target,name:wizard.name,symbol:wizard.symbol,policy:wizard.policy,enabled:!state.paused});closeModal();switchView('routes');toast(t('toastLocal'));}
function openEvent(id){const ev=state.events.find(e=>e.id===id);if(!ev)return;openModal(`<div class="dialog-review">${[[t('event'),ev.id],[t('source'),ev.source],[t('instrument'),ev.symbol],[t('action'),ev.action],[t('outcome'),t(ev.status)],[t('time'),ev.time]].map(([k,v])=>`<div class="review-line"><span>${E(k)}</span><b>${E(v)}</b></div>`).join('')}</div><div class="callout warning" style="margin-top:17px">${ICON('alert')}<span>${E(ev.note)}. ${E(t('eventReason'))}</span></div>`,t('eventDetail'),`<button class="btn secondary" data-modal-close>${E(t('close'))}</button>`);}
function openGuide(which){let steps=which==='TradingView'?['Create a unique webhook credential (future API).','Configure TradingView alert with a structured JSON message.','Send a test event and inspect its correlated receipt.']:which==='Telegram'?['Create a bot with BotFather and grant authorized channel membership.','Verify update origin and add the channel to an explicit allowlist.','Preview messages and approve risk rules before demo routing.']:['Install the signed DrFX EA when it is available.','Allowlist the HTTPS endpoint and pair a demo MT5 terminal.','Verify account/server binding and broker receipt on a demo order.'];openModal(`<div class="callout warning" style="margin-bottom:14px">${ICON('alert')}<span>${E(t('notAvailable'))}: ${E(t('noLiveConnection'))}</span></div>${steps.map((s,i)=>`<div class="connection-guide"><span class="step-dot">${i+1}</span><div><b>${E(s)}</b></div></div>`).join('')}`,which+' · '+t('configure'),`<button class="btn primary" data-modal-close>${E(t('close'))}</button>`);}
function openSearch(){const choices=nav.map(i=>`<button class="choice" style="text-align:start;padding:12px" data-search-view="${i.id}">${ICON(i.icon)} <b style="display:inline">${E(t(i.label))}</b></button>`).join('');openModal(`<div class="field"><label for="screenSearch">${E(t('searchPlaceholder'))}</label><input class="input" id="screenSearch" autofocus placeholder="${E(t('searchPlaceholder'))}" /></div><div id="searchChoices" style="display:grid;gap:7px;margin-top:13px">${choices}</div>`,t('searchTitle'));document.getElementById('screenSearch')?.focus();}
function handleForms(e){if(e.target.id==='riskPolicyForm'){e.preventDefault();const f=e.target;if(!f.reportValidity())return;let next={};for(const k of ['maxLots','maxOpen','dailyLoss','maxSpread'])next[k]=Number(f.elements[k].value);state.risk=next;render();toast(t('toastLocal'));}if(e.target.id==='riskTestForm'){e.preventDefault();const f=e.target;if(!f.reportValidity())return;const args={};for(const k of ['lots','openPositions','dailyLossPercent','spreadPoints'])args[k]=Number(f.elements[k].value);riskTestResult=evaluateDemoRisk(args,state.risk);const el=document.getElementById('riskResult');if(el)el.innerHTML=riskTestMarkup(riskTestResult);}}
function handleModal(e){if(!modal)return;const b=e.target.closest('[data-wizard-source],[data-wizard-target],[data-wizard-next],[data-wizard-back],[data-search-view],[data-modal-close]');if(!b)return;if(b.hasAttribute('data-modal-close')){closeModal();return;}if(b.dataset.wizardSource){wizard.source=b.dataset.wizardSource;renderWizard();return;}if(b.dataset.wizardTarget){wizard.target=b.dataset.wizardTarget;renderWizard();return;}if(b.hasAttribute('data-wizard-next')){wizardNext();return;}if(b.hasAttribute('data-wizard-back')){wizard.step=Math.max(0,wizard.step-1);renderWizard();return;}if(b.dataset.searchView){closeModal();switchView(b.dataset.searchView);}}
function handleSearch(e){if(e.target.id!=='screenSearch')return;const val=e.target.value.trim().toLowerCase();document.querySelectorAll('[data-search-view]').forEach(b=>b.style.display=b.textContent.toLowerCase().includes(val)?'block':'none');}
document.getElementById('viewRoot').addEventListener('click',handleClick);
document.getElementById('viewRoot').addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.hasAttribute('data-event')){e.preventDefault();openEvent(e.target.dataset.event);}});
document.getElementById('viewRoot').addEventListener('submit',handleForms);
document.getElementById('primaryNav').addEventListener('click',handleClick);
document.getElementById('operationsNav').addEventListener('click',handleClick);
document.getElementById('overlayRoot').addEventListener('click',handleModal);
document.getElementById('overlayRoot').addEventListener('input',handleSearch);
document.getElementById('themeToggle').addEventListener('click',()=>{state.theme=state.theme==='dark'?'light':'dark';render();});
document.getElementById('notificationsButton').addEventListener('click',()=>toast(t('note')));
document.getElementById('workspaceSwitch').addEventListener('click',()=>toast(t('noLiveConnection')));
document.querySelector('.avatar-button').addEventListener('click',()=>switchView('settings'));
document.querySelector('.search-button').addEventListener('click',openSearch);
document.getElementById('mobileToggle').addEventListener('click',()=>{document.getElementById('sidebar').classList.toggle('open');document.getElementById('mobileOverlay').classList.toggle('open');});
document.getElementById('mobileOverlay').addEventListener('click',()=>{document.getElementById('sidebar').classList.remove('open');document.getElementById('mobileOverlay').classList.remove('open');});
document.getElementById('ribbonDismiss').addEventListener('click',()=>{state.ribbon=false;document.querySelector('.preview-ribbon').classList.add('hidden');save();});
document.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&modal)closeModal();if((ev.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName))||(ev.key==='k'&&(ev.ctrlKey||ev.metaKey))){ev.preventDefault();openSearch();}});
render();