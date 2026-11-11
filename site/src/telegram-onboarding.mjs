import {eaDownloadCatalog} from './ea-downloads.mjs';

export const MEMBERSHIP_CHANNEL = '@DrFXAi';
export const BOT_COMMANDS_VISIBLE = Object.freeze([]);

export async function channelMembership(api, env, telegramId) {
 try {
  const member = await api(env, 'getChatMember', {chat_id:MEMBERSHIP_CHANNEL,user_id:Number(telegramId)});
  if (['creator','administrator','member'].includes(member?.status) ||
      (member?.status==='restricted' && member.is_member===true)) return 'member';
  if (['left','kicked','restricted'].includes(member?.status)) return 'not_member';
 } catch { /* An unavailable membership check cannot authorize credentials. */ }
 return 'unavailable';
}

const faLabels = {
 home:'منوی اصلی',language:'انتخاب زبان',onboarding:'عضویت و ورود',login:'دریافت کد ورود',
 setup:'آموزش نصب و فعال‌سازی',free:'دریافت لایسنس رایگان',shop:'خرید لایسنس',
 account:'پروفایل و اعتبار لایسنس',channels:'کانال‌ها و گروه‌ها',app:'وب‌اپ سیگنال بریج',
 licenses:'لایسنس‌های من',bridgecode:'دریافت لایسنس سیگنال بریج',scalperkeys:'لایسنس‌های اسکلپر پرو',
 help:'راهنما',support:'پشتیبانی',terms:'شرایط خرید',link:'اتصال حساب‌ها',resetconfirm:'تغییر کد ورود',
 admin:'پنل مدیریت',adminhelp:'راهنمای مدیریت',reset:'تأیید تغییر کد'
};
const courses = {
 'bridge-install':[
  'فعال‌سازی سیگنال بریج در MT5','Activate Signal Bridge in MT5',
  '۱. فایل EA را دانلود کن و در MT5 از File → Open Data Folder پوشه MQL5/Experts را باز کن.\n۲. فایل EX5 را کپی کن. در Navigator گزینه Refresh را بزن و EA را روی چارت بگذار.\n۳. Algo Trading را روشن کن و لایسنس را در تنظیمات EA وارد کن. در پنل وضعیت اتصال را بررسی کن.',
  '1. Download the EA. In MT5, open File → Open Data Folder → MQL5/Experts.\n2. Copy the EX5, refresh Navigator and attach the EA to a chart.\n3. Enable Algo Trading, enter your license and verify the connection in the portal.'
 ],
 'scalper-install':[
  'فعال‌سازی اسکلپر پرو در MT5','Activate Scalper Pro in MT5',
  '۱. فایل EX5 را در MQL5/Experts قرار بده و Navigator را Refresh کن.\n۲. EA را روی چارت قرار بده و Algo Trading را روشن کن.\n۳. دوره آزمایشی را داخل EA شروع کن یا کلید حساب MT5 را در ENTER LICENCE KEY وارد کن و ACTIVATE را بزن.',
  '1. Copy the EX5 into MQL5/Experts and refresh Navigator.\n2. Attach the EA to a chart and enable Algo Trading.\n3. Start the in-EA trial or paste your account-bound key into ENTER LICENCE KEY and press ACTIVATE.'
 ],
 'channel-install':[
  'دریافت سیگنال تریدینگ‌ویو در کانال یا گروه','TradingView alerts in a channel or group',
  '۱. از «کانال‌ها و گروه‌ها» ربات را اضافه کن و اجازه ارسال پیام بده.\n۲. کانال یا گروه را انتخاب کن و وبهوک و قالب پیام را بگیر.\n۳. در ساخت هشدار TradingView، نشانی Webhook URL و قالب Message را وارد و هشدار را ذخیره کن.',
  '1. Add the bot from Channels & Groups and grant posting permission.\n2. Select the chat and get its webhook and alert template.\n3. Enter the Webhook URL and Message template in your TradingView alert and save it.'
 ],
 'forward-install':[
  'فوروارد سیگنال تلگرام به MT5','Forward Telegram signals to MT5',
  '۱. سیگنال بریج را در MT5 فعال کن و در پنل، مسیر Telegram → MT5 را روشن کن.\n۲. سیگنال دارای نماد، جهت، حد ضرر و اهداف را به چت خصوصی این ربات ارسال یا فوروارد کن.\n۳. نتیجه پردازش و وضعیت معامله را در پنل یا MT5 بررسی کن. برای اولین آزمون از حساب دمو استفاده کن.',
  '1. Connect Signal Bridge in MT5 and enable Telegram → MT5 in the portal.\n2. Send or forward a signal with its symbol, direction, stop loss and targets to this private bot chat.\n3. Check the processing result and trade status in the portal or MT5. Use a demo account for your first test.'
 ]
};
export const onboardingPages = Object.freeze(['onboarding','free','access','more',...Object.keys(courses)]);

export function onboardingView(page, language, membership) {
 const fa=language==='fa';
 const t=(persian,english)=>fa?persian:english;
 const button=(label,target,tone='')=>({label,action:'ui:page:'+target,tone});
 const link=(label,url,tone='')=>({label,url,action:'link',tone});
 const home=button(t('منوی اصلی','Main Menu'),'home');
 const view=(title,subtitle,buttons,extra={})=>({page,language,title,subtitle,badge:'DrFXAi',buttons,...extra});
 const downloads=eaDownloadCatalog();
 if(page==='language')return view('انتخاب زبان · Choose language','',[button('فارسی','lang:fa','primary'),button('English','lang:en','accent')]);
 if(page==='onboarding'){
  if(membership==='member')return view(t('ورود به سایت و وب‌اپ','Sign in to the website and web app'),'',[button(t('دریافت کد عضویت','Get sign-in code'),'login','primary')]);
  if(membership==='unavailable')return view(t('بررسی عضویت در دسترس نیست','Membership check unavailable'),t('کمی بعد دوباره تلاش کن.','Try again shortly.'),[button(t('بررسی دوباره','Check again'),'onboarding','primary')]);
  return view(t('عضویت در کانال DrFXAi','Join the DrFXAi channel'),t('برای دریافت کد ورود ابتدا عضو کانال شو. سپس عضویت را بررسی کن.','Join the channel, then check your membership to get your sign-in code.'),[link(t('عضویت در @DrFXAi','Join @DrFXAi'),'https://t.me/DrFXAi','primary'),button(t('بررسی عضویت','Check membership'),'onboarding','accent')]);
 }
 if(page==='access'||page==='app')return view(t('ورود به سیگنال بریج','Open Signal Bridge'),t('با کد ورود وارد حساب شو.','Use your sign-in code to access your account.'),[link(t('باز کردن وب‌اپ','Open Web App'),'https://drfx.company/telegram','primary'),link(t('باز کردن سایت','Open Website'),'https://drfx.company/?auth=1'),home]);
 if(page==='more')return view(t('تنظیمات و پشتیبانی','Settings & Support'),'',[
  button(t('انتخاب زبان','Language'),'language'),button(t('پشتیبانی پرداخت','Payment Support'),'support'),
  button(t('سفارش‌های من','My Orders'),'orders:0'),button(t('اتصال حساب‌ها','Linked Accounts'),'link'),home]);
 if(page==='home')return view(t('سیگنال بریج','Signal Bridge'),t('برای شروع، راهنمای نصب و فعال‌سازی را باز کن.','Start with the installation and activation guide.'),[
  button(t('آموزش نصب و فعال‌سازی','Install & Activate'),'setup','primary'),
  button(t('پروفایل و اعتبار لایسنس','Profile & License'),'account','accent'),
  link(t('دانلود EA سیگنال بریج','Download Signal Bridge EA'),downloads.signalbridge.url),
  link(t('دانلود EA اسکلپر پرو','Download Scalper Pro EA'),downloads.scalper.url),
  button(t('دریافت لایسنس رایگان','Free Licenses'),'free','accent'),
  button(t('خرید لایسنس','Buy Licenses'),'shop'),
  button(t('کانال‌ها و گروه‌ها','Channels & Groups'),'channels'),
  button(t('تاریخچه سیگنال‌ها','Signal History'),'history:0'),
  button(t('دریافت کد ورود','Get Sign-in Code'),'onboarding'),
  button(t('تنظیمات و پشتیبانی','Settings & Support'),'more')
 ]);
 if(page==='setup')return view(t('آموزش نصب و فعال‌سازی','Install & Activate'),t('آموزش مورد نیازت را انتخاب کن.','Choose a guide.'),Object.entries(courses).map(([key,course])=>button(course[fa?0:1],key,'accent')).concat(home));
 if(courses[page]){
  const course=courses[page];
  return view(course[fa?0:1],'',[...(page==='channel-install'?[button(t('کانال‌ها و گروه‌ها','Channels & Groups'),'channels','primary')]:[]),button(t('بازگشت به آموزش‌ها','Back to Guides'),'setup'),home],{pages:[course[fa?2:3]]});
 }
 if(page==='free')return view(t('لایسنس رایگان','Free Licenses'),t('اسکلپر پرو دورهٔ آزمایشی ۷ روزه را از داخل EA فعال می‌کند.','Activate the 7-day Scalper Pro trial inside its EA.'),[button(t('دریافت لایسنس سیگنال بریج','Get Signal Bridge License'),'bridgecode','primary'),button(t('فعال‌سازی آزمایشی اسکلپر پرو','Activate Scalper Pro Trial'),'scalper-install','accent'),home]);
 return null;
}

export function localizeWorkspace(view,language) {
 if(language!=='fa')return view;
 const labels={'Account':'حساب','Copy support command':'کپی متن درخواست پشتیبانی','Copy linking command':'کپی متن اتصال حساب','Copy command guide':'کپی راهنمای مدیریت','Registered members':'کاربران ثبت‌شده','Active accounts':'حساب‌های فعال','Suspended accounts':'حساب‌های تعلیق‌شده','Management Actions':'گزینه‌های مدیریت','Plan':'پلن','License':'لایسنس','Expiry · UTC':'انقضا (UTC)','Entry reference':'قیمت ورود','Stop Loss':'حد ضرر','Copy Signal':'کپی سیگنال','Refresh':'به‌روزرسانی','active':'فعال','trial':'آزمایشی','Starts on activation':'از زمان فعال‌سازی','No recorded signals yet.':'هنوز سیگنالی ثبت نشده است.','Remaining':'زمان باقی‌مانده','Expired':'منقضی','Revoked':'لغوشده','revoked':'لغوشده','Not started':'هنوز شروع نشده','suspended':'تعلیق‌شده','Market / not supplied':'بازار / تعیین نشده','Confirm Reset':'تأیید تغییر','Cancel':'انصراف','Signal History':'تاریخچه سیگنال‌ها','Signal Bridge':'سیگنال بریج','Scalper Pro':'اسکلپر پرو','License & activation':'لایسنس و فعال‌سازی','MT5 account-bound':'وابسته به حساب MT5'};
 const title=faLabels[view.page]||(view.page?.startsWith('history')?'تاریخچه سیگنال‌ها':view.page?.startsWith('orders')?'سفارش‌های من':view.title);
 return {...view,language,title,subtitle:labels[view.subtitle]||'',footer:'',badge:'DrFXAi',
  rows:(view.rows||[]).map(r=>({...r,label:labels[r.label]||String(r.label).replace(/^Target (\d)$/,'هدف $1').replace('Signal Bridge · 3 months','سیگنال بریج · ۳ ماه').replace('Signal Bridge · 12 months','سیگنال بریج · ۱۲ ماه').replace('Scalper Pro · 30 days','اسکلپر پرو · ۳۰ روز').replace('Scalper Pro · 90 days','اسکلپر پرو · ۹۰ روز'),
   value:labels[r.value]||String(r.value).replace(/ Stars/g,' استار').replace(/Unavailable/g,'ناموجود').replace(/(\d+) days/g,'$1 روز')})),
  buttons:(view.buttons||[]).map(b=>{
   const buy={quarterly:'سیگنال بریج · ۳ ماه',annual:'سیگنال بریج · ۱۲ ماه',scalper_1m:'اسکلپر پرو · ۳۰ روز',scalper_3m:'اسکلپر پرو · ۹۰ روز'};
   if(b.action?.startsWith('sb:buy:'))return {...b,label:buy[b.action.slice(7)]||b.label};
   const target=b.action?.replace(/^ui:page:/,'');
   return {...b,label:faLabels[target]||labels[b.label]||(target?.startsWith('history')?'تاریخچه سیگنال‌ها':target?.startsWith('orders')?'سفارش‌های من':target?.startsWith('signal:')?'نمایش '+b.label.replace(/^Open /,''):b.label.replace('Previous','قبلی').replace('Next','بعدی'))};
  })};
}
