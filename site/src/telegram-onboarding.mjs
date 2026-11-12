import {BOT_LANGUAGES,BOT_LANGUAGE_CODES} from './telegram-i18n.mjs';
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
  '۱. فایل EA را دانلود کن و در MT5 پوشهٔ MQL5/Experts را از File ← Open Data Folder باز کن.\n۲. فایل EX5 را کپی کن. در Navigator گزینه Refresh را بزن و EA را روی چارت بگذار.\n۳. در Inputs، کد و نماد دقیق بروکر را وارد کن. Algo Trading را روشن کن و اتصال را روی حساب دمو بررسی کن.',
  '1. Download the EA. In MT5, open File → Open Data Folder → MQL5/Experts.\n2. Copy the EX5, refresh Navigator and attach the EA to a chart.\n3. In Inputs, enter the activation code and exact broker symbol. Enable Algo Trading and verify the connection on demo.'
 ],
 'scalper-install':[
  'فعال‌سازی اسکلپر پرو در MT5','Activate Scalper Pro in MT5',
  '۱. فایل EX5 را در MQL5/Experts قرار بده و Navigator را Refresh کن.\n۲. EA را روی چارت قرار بده و Algo Trading را روشن کن.\n۳. دوره آزمایشی را داخل EA شروع کن یا کلید حساب MT5 را در ENTER LICENCE KEY وارد کن و ACTIVATE را بزن.',
  '1. Copy the EX5 into MQL5/Experts and refresh Navigator.\n2. Attach the EA to a chart and enable Algo Trading.\n3. Start the in-EA trial or paste your account-bound key into ENTER LICENCE KEY and press ACTIVATE.'
 ],
 'channel-install':[
  'دریافت سیگنال تریدینگ‌ویو در کانال یا گروه','TradingView alerts in a channel or group',
  '۱. از «کانال‌ها و گروه‌ها» ربات را اضافه کن و اجازه ارسال پیام بده.\n۲. کانال یا گروه را انتخاب کن و وبهوک و قالب پیام را بگیر.\n۳. در هشدار TradingView، نشانی را در Webhook URL و قالب را در Message بچسبان. جهت را تنظیم و ارسال آزمایشی را بررسی کن.',
  '1. Add the bot from Channels & Groups and grant posting permission.\n2. Select the chat and get its webhook and alert template.\n3. Paste the URL and template into Webhook URL and Message. Set the signal side, save and verify a test alert.'
 ],
 'forward-install':[
  'فوروارد سیگنال تلگرام به MT5','Forward Telegram signals to MT5',
  '۱. سیگنال بریج را در MT5 فعال کن و در پنل، مسیر Telegram → MT5 را روشن کن.\n۲. سیگنال دارای نماد، جهت، حد ضرر و اهداف را به چت خصوصی این ربات ارسال یا فوروارد کن.\n۳. نتیجه پردازش و وضعیت معامله را در پنل یا MT5 بررسی کن. برای اولین آزمون از حساب دمو استفاده کن.',
  '1. Connect Signal Bridge in MT5 and enable Telegram → MT5 in the portal.\n2. Send or forward a signal with its symbol, direction, stop loss and targets to this private bot chat.\n3. Check the processing result and trade status in the portal or MT5. Use a demo account for your first test.'
 ]
};
const guideText={
 tr:{
  'bridge-install':'1. EA dosyasını indirin. MT5’te File → Open Data Folder → MQL5/Experts klasörünü açın.\n2. EX5’i kopyalayın, Navigator’ı yenileyin ve EA’yı grafiğe ekleyin.\n3. Inputs bölümünde lisans kodunu ve broker sembolünü girin. Algo Trading’i açın ve demo bağlantısını kontrol edin.',
  'scalper-install':'1. EX5’i MQL5/Experts klasörüne kopyalayın ve Navigator’ı yenileyin.\n2. EA’yı grafiğe ekleyip Algo Trading’i açın.\n3. ENTER LICENCE KEY bölümüne MT5 hesabınıza ait anahtarı yapıştırıp ACTIVATE düğmesine basın.',
  'channel-install':'1. Botu Kanallar ve Gruplar bölümünden ekleyin ve mesaj gönderme izni verin.\n2. Sohbeti seçin, webhook adresini ve şablonu alın.\n3. TradingView uyarısına Webhook URL ve Message alanlarını girin, yönü seçin ve deneme uyarısını doğrulayın.',
  'forward-install':'1. MT5’te Signal Bridge’i bağlayın ve panelde Telegram → MT5 yolunu açın.\n2. Sembol, yön, zarar durdurma ve hedefleri içeren sinyali botun özel sohbetine gönderin veya iletin.\n3. İlk denemeyi demo hesapta yapın ve sonucu panelde veya MT5’te kontrol edin.'
 },
 ru:{
  'bridge-install':'1. Скачайте EA. В MT5 откройте File → Open Data Folder → MQL5/Experts.\n2. Скопируйте EX5, обновите Navigator и добавьте EA на график.\n3. В Inputs укажите код активации и точный символ брокера. Включите Algo Trading и проверьте связь на демосчёте.',
  'scalper-install':'1. Скопируйте EX5 в MQL5/Experts и обновите Navigator.\n2. Добавьте EA на график и включите Algo Trading.\n3. Вставьте ключ для счёта MT5 в ENTER LICENCE KEY и нажмите ACTIVATE.',
  'channel-install':'1. Добавьте бота в канале или группе и разрешите ему отправлять сообщения.\n2. Выберите чат и скопируйте вебхук и шаблон.\n3. В TradingView заполните поля Webhook URL и Message, выберите направление и проверьте тестовое оповещение.',
  'forward-install':'1. Подключите Signal Bridge в MT5 и включите маршрут Telegram → MT5.\n2. Отправьте или перешлите в личный чат бота сигнал с символом, направлением, стоп-лоссом и целями.\n3. Используйте демосчёт для первого теста и проверьте результат в панели или MT5.'
 }
};
export const onboardingPages = Object.freeze(['onboarding','free','scalper-trial','access','more',...Object.keys(courses)]);

export function onboardingView(page, language, membership) {
 const fa=language==='fa';
 const t=(persian,english)=>fa?persian:english;
 const button=(label,target,tone='')=>({label,action:'ui:page:'+target,tone});
 const link=(label,url,tone='')=>({label,url,action:'link',tone});
 const home=button(t('منوی اصلی','Main Menu'),'home');
 const view=(title,subtitle,buttons,extra={})=>({page,language,title,subtitle,badge:'DrFXAi',buttons,...extra});
 const downloads=eaDownloadCatalog();
 if(page==='language')return view(t('انتخاب زبان','Choose language'),'',BOT_LANGUAGE_CODES.map(code=>button(BOT_LANGUAGES[code].name,'lang:'+code,code===language?'primary':'')));
 if(page==='onboarding'){
  if(membership==='member')return view(t('ورود به سایت و وب‌اپ','Sign in to the website and web app'),'',[button(t('دریافت کد عضویت','Get sign-in code'),'login','primary')]);
  if(membership==='unavailable')return view(t('بررسی عضویت در دسترس نیست','Membership check unavailable'),t('کمی بعد دوباره تلاش کن.','Try again shortly.'),[button(t('بررسی دوباره','Check again'),'onboarding','primary')]);
  return view(t('عضویت در کانال DrFXAi','Join the DrFXAi channel'),t('برای دریافت کد ورود ابتدا عضو کانال شو. سپس عضویت را بررسی کن.','Join the channel, then check your membership to get your sign-in code.'),[link(t('عضویت در @DrFXAi','Join @DrFXAi'),'https://t.me/DrFXAi','primary'),button(t('بررسی عضویت','Check membership'),'onboarding','accent')]);
 }
 if(page==='access'||page==='app')return view(t('ورود به سیگنال بریج','Open Signal Bridge'),t('با کد ورود وارد حساب شو.','Use your sign-in code to access your account.'),[link(t('باز کردن وب‌اپ','Open Web App'),'https://drfx.company/telegram','primary'),link(t('باز کردن سایت','Open Website'),'https://drfx.company/?auth=1'),home]);
 if(page==='more')return view(t('تنظیمات و پشتیبانی','Settings & Support'),'',[
  button(t('انتخاب زبان','Language'),'language'),link(t('پشتیبانی در تلگرام','Telegram Support'),'https://t.me/DrFXGOD','accent'),button(t('پشتیبانی پرداخت','Payment Support'),'support'),
  button(t('سفارش‌های من','My Orders'),'orders:0'),button(t('اتصال حساب‌ها','Linked Accounts'),'link'),home]);
 if(page==='home')return view(t('سیگنال بریج','Signal Bridge'),t('برای شروع، راهنمای نصب و فعال‌سازی را باز کن.','Start with the installation and activation guide.'),[
  button(t('آموزش نصب و فعال‌سازی','Install & Activate'),'setup','primary'),
  button(t('پروفایل و اعتبار لایسنس','Profile & License'),'account','accent'),
  link(t('دانلود EA سیگنال بریج','Download Signal Bridge EA'),downloads.signalbridge.url),
  link(t('دانلود EA اسکلپر پرو','Download Scalper Pro EA'),downloads.scalper.url),
  button(t('دریافت لایسنس رایگان','Free Licenses'),'free','accent'),
  button(t('خرید لایسنس','Buy Licenses'),'shop'),
  button(t('وب‌هوک‌ها و کانال‌ها','Webhooks & Channels'),'webhooks'),
  button(t('تاریخچه سیگنال‌ها','Signal History'),'history:0'),
  button(t('دریافت کد ورود','Get Sign-in Code'),'onboarding'),
  button(t('تنظیمات و پشتیبانی','Settings & Support'),'more')
 ]);
 if(page==='webhooks')return view(t('وب‌هوک‌های تریدینگ‌ویو','TradingView Webhooks'),t('مقصد هشدار را انتخاب کن.','Choose where your TradingView alerts should go.'),[
  button(t('وب‌هوک شخصی سیگنال بریج','Personal Signal Bridge Webhook'),'tvhook','primary'),
  button(t('وب‌هوک کانال یا گروه تلگرام','Telegram Channel or Group Webhook'),'channels','accent'),
  button(t('راهنمای اتصال تریدینگ‌ویو','TradingView Setup Guide'),'channel-install'),home]);
 if(page==='setup')return view(t('آموزش نصب و فعال‌سازی','Install & Activate'),t('آموزش مورد نیازت را انتخاب کن.','Choose a guide.'),Object.entries(courses).map(([key,course])=>button(course[fa?0:1],key,'accent')).concat(home));
 if(courses[page]){
  const course=courses[page];
  return view(course[fa?0:1],'',[...(page==='channel-install'?[button(t('وب‌هوک‌ها و کانال‌ها','Webhooks & Channels'),'webhooks','primary')]:[]),button(t('بازگشت به آموزش‌ها','Back to Guides'),'setup'),home],{pages:[guideText[language]?.[page]||course[fa?2:3]]});
 }
 if(page==='scalper-trial')return view(t('لایسنس رایگان اسکلپر پرو','Scalper Pro free license'),
  t('شمارهٔ حساب MT5 را وارد کن. برای هر کاربر و شمارهٔ حساب یک کلید ۷ روزه صادر می‌شود.','Enter your MT5 login. One 7-day key per member and account.'),
  [button(t('بازگشت','Back'),'free')]);
 if(page==='free')return view(t('لایسنس رایگان','Free Licenses'),'',[
  button(t('دریافت لایسنس سیگنال بریج','Get Signal Bridge License'),'bridgecode','primary'),
  button(t('دریافت لایسنس ۷ روزه اسکلپر پرو','Get 7-day Scalper Pro License'),'scalper-trial','accent'),
  button(t('راهنمای نصب اسکلپر پرو','Scalper Pro Setup Guide'),'scalper-install'),home]);
 return null;
}

export function localizeWorkspace(view,language) {
 if(language!=='fa')return view;
 const labels={'Scalper expiry':'انقضای اسکلپر پرو','Scalper key duration':'مدت کلید اسکلپر پرو','Check in the EA':'در پنل خود EA بررسی کن','No key issued':'هنوز کلیدی صادر نشده','Account':'حساب','Email':'ایمیل','Not linked':'متصل نشده','Telegram':'تلگرام','Connected':'متصل','annual':'سالانه','quarterly':'سه‌ماهه','Copy support command':'کپی متن درخواست پشتیبانی','Copy linking command':'کپی متن اتصال حساب','Copy command guide':'کپی راهنمای مدیریت','Registered members':'کاربران ثبت‌شده','Active accounts':'حساب‌های فعال','Suspended accounts':'حساب‌های تعلیق‌شده','Management Actions':'گزینه‌های مدیریت','Plan':'پلن','License':'لایسنس','Expiry · UTC':'انقضا (UTC)','Entry reference':'قیمت ورود','Stop Loss':'حد ضرر','Copy Signal':'کپی سیگنال','Refresh':'به‌روزرسانی','active':'فعال','trial':'آزمایشی','Starts on activation':'از زمان فعال‌سازی','No recorded signals yet.':'هنوز سیگنالی ثبت نشده است.','Remaining':'زمان باقی‌مانده','Expired':'منقضی','Revoked':'لغوشده','revoked':'لغوشده','Not started':'هنوز شروع نشده','suspended':'تعلیق‌شده','Market / not supplied':'بازار / تعیین نشده','Confirm Reset':'تأیید تغییر','Cancel':'انصراف','Signal History':'تاریخچه سیگنال‌ها','Signal Bridge':'سیگنال بریج','Scalper Pro':'اسکلپر پرو','License & activation':'لایسنس و فعال‌سازی','MT5 account-bound':'وابسته به حساب MT5'};
 const title=faLabels[view.page]||(view.page?.startsWith('history')?'تاریخچه سیگنال‌ها':view.page?.startsWith('orders')?'سفارش‌های من':view.title);
 return {...view,language,title,subtitle:labels[view.subtitle]||'',footer:'',badge:'DrFXAi',
  rows:(view.rows||[]).map(r=>({...r,label:labels[r.label]||String(r.label).replace(/^Target (\d)$/,'هدف $1').replace('Signal Bridge · 3 months','سیگنال بریج · ۳ ماه').replace('Signal Bridge · 12 months','سیگنال بریج · ۱۲ ماه').replace('Scalper Pro · 30 days','اسکلپر پرو · ۳۰ روز').replace('Scalper Pro · 90 days','اسکلپر پرو · ۹۰ روز'),
   value:labels[r.value]||String(r.value).replace(/ Stars/g,' استار').replace(/Unavailable/g,'ناموجود').replace(/(\d+) days/g,'$1 روز').replace(/\b(active|annual|quarterly|trial|revoked|suspended)\b/g,status=>labels[status])})),
  buttons:(view.buttons||[]).map(b=>{
   const buy={quarterly:'سیگنال بریج · ۳ ماه',annual:'سیگنال بریج · ۱۲ ماه',scalper_1m:'اسکلپر پرو · ۳۰ روز',scalper_3m:'اسکلپر پرو · ۹۰ روز'};
   if(b.action?.startsWith('sb:buy:'))return {...b,label:buy[b.action.slice(7)]||b.label};
   const target=b.action?.replace(/^ui:page:/,'');
   return {...b,label:faLabels[target]||labels[b.label]||(target?.startsWith('history')?'تاریخچه سیگنال‌ها':target?.startsWith('orders')?'سفارش‌های من':target?.startsWith('signal:')?'نمایش '+b.label.replace(/^Open /,''):b.label.replace('Previous','قبلی').replace('Next','بعدی'))};
  })};
}

// Native widget labels for the Turkish and Russian selections.
const widgetLabels=new Map([
 ['Choose language','Dil seçin','Выберите язык'],
 ['Main Menu','Ana menü','Главное меню'],
 ['‹ Main Menu','‹ Ana menü','‹ Главное меню'],
 ['Language','Dil','Язык'],
 ['Settings & Support','Ayarlar ve destek','Настройки и поддержка'],
 ['Telegram Support','Telegram desteği','Поддержка в Telegram'],
 ['Payment Support','Ödeme desteği','Поддержка по оплате'],
 ['My Orders','Siparişlerim','Мои заказы'],
 ['Linked Accounts','Bağlı hesaplar','Связанные аккаунты'],
 ['Start with the installation and activation guide.','Kurulum ve etkinleştirme kılavuzuyla başlayın.','Начните с руководства по установке и активации.'],
 ['Sign in to the website and web app','Siteye ve web uygulamasına giriş','Вход на сайт и в веб-приложение'],
 ['Get sign-in code','Giriş kodu al','Получить код входа'],
 ['Get Sign-in Code','Giriş kodu al','Получить код входа'],
 ['Membership check unavailable','Üyelik kontrolü kullanılamıyor','Проверка подписки недоступна'],
 ['Try again shortly.','Biraz sonra tekrar deneyin.','Повторите попытку позже.'],
 ['Check again','Tekrar kontrol et','Проверить снова'],
 ['Join the DrFXAi channel','DrFXAi kanalına katılın','Подпишитесь на канал DrFXAi'],
 ['Join the channel, then check your membership to get your sign-in code.','Kanala katılın ve giriş kodu almak için üyeliğinizi kontrol edin.','Подпишитесь на канал и проверьте подписку, чтобы получить код входа.'],
 ['Join @DrFXAi','@DrFXAi kanalına katıl','Подписаться на @DrFXAi'],
 ['Check membership','Üyeliği kontrol et','Проверить подписку'],
 ['Open Signal Bridge','Signal Bridge’i aç','Открыть Signal Bridge'],
 ['Use your sign-in code to access your account.','Hesabınıza giriş kodunuzla erişin.','Используйте код входа для доступа к аккаунту.'],
 ['Open Web App','Web uygulamasını aç','Открыть веб-приложение'],
 ['Open Website','Siteyi aç','Открыть сайт'],
 ['Open Mini App','Mini App’i aç','Открыть мини-приложение'],
 ['Install & Activate','Kurulum ve etkinleştirme','Установка и активация'],
 ['Choose a guide.','Bir kılavuz seçin.','Выберите руководство.'],
 ['Back to Guides','Kılavuzlara dön','Вернуться к руководствам'],
 ['Profile & License','Profil ve lisans','Профиль и лицензия'],
 ['Download Signal Bridge EA','Signal Bridge EA’yı indir','Скачать Signal Bridge EA'],
 ['Download Scalper Pro EA','Scalper Pro EA’yı indir','Скачать Scalper Pro EA'],
 ['Free Licenses','Ücretsiz lisanslar','Бесплатные лицензии'],
 ['Buy Licenses','Lisans satın al','Купить лицензию'],
 ['Webhooks & Channels','Webhook’lar ve kanallar','Вебхуки и каналы'],
 ['Signal History','Sinyal geçmişi','История сигналов'],
 ['No recorded signals yet.','Henüz kayıtlı sinyal yok.','Записанных сигналов пока нет.'],
 ['TradingView Webhooks','TradingView webhook’ları','Вебхуки TradingView'],
 ['Choose where your TradingView alerts should go.','TradingView uyarılarının hedefini seçin.','Выберите, куда отправлять оповещения TradingView.'],
 ['Personal Signal Bridge Webhook','Kişisel Signal Bridge webhook’u','Личный вебхук Signal Bridge'],
 ['Telegram Channel or Group Webhook','Telegram kanal veya grup webhook’u','Вебхук канала или группы Telegram'],
 ['TradingView Setup Guide','TradingView kurulum kılavuzu','Настройка TradingView'],
 ['Activate Signal Bridge in MT5','MT5’te Signal Bridge’i etkinleştirin','Активируйте Signal Bridge в MT5'],
 ['Activate Scalper Pro in MT5','MT5’te Scalper Pro’yu etkinleştirin','Активируйте Scalper Pro в MT5'],
 ['TradingView alerts in a channel or group','Kanal veya grupta TradingView uyarıları','Оповещения TradingView в канале или группе'],
 ['Forward Telegram signals to MT5','Telegram sinyallerini MT5’e iletin','Пересылайте сигналы из Telegram в MT5'],
 ['Get Signal Bridge License','Signal Bridge lisansı al','Получить лицензию Signal Bridge'],
 ['Get 7-day Scalper Pro License','7 günlük Scalper Pro lisansı al','Получить лицензию Scalper Pro на 7 дней'],
 ['Scalper Pro Setup Guide','Scalper Pro kurulum kılavuzu','Настройка Scalper Pro'],
 ['Scalper Pro free license','Ücretsiz Scalper Pro lisansı','Бесплатная лицензия Scalper Pro'],
 ['Enter your MT5 login. One 7-day key per member and account.','MT5 hesap numaranızı girin. Kullanıcı ve hesap başına bir adet 7 günlük anahtar.','Введите номер счёта MT5. Один ключ на 7 дней на пользователя и счёт.'],
 ['Back','Geri','Назад'],
 ['Account & Access','Hesap ve erişim','Аккаунт и доступ'],
 ['Manage your plan and secure account access.','Planınızı ve hesap erişimini yönetin.','Управляйте тарифом и доступом к аккаунту.'],
 ['Expiry · UTC','Bitiş · UTC','Истекает · UTC'],
 ['Remaining','Kalan süre','Осталось'],
 ['Scalper key duration','Scalper anahtar süresi','Срок действия ключа Scalper'],
 ['Scalper expiry','Scalper bitiş tarihi','Срок действия Scalper'],
 ['Check in the EA','EA içinde kontrol edin','Проверьте в EA'],
 ['No key issued','Anahtar verilmedi','Ключ не выдан'],
 ['Starts on activation','Etkinleştirmeyle başlar','Начинается при активации'],
 ['Get EA Code','EA kodu al','Получить код EA'],
 ['Get Scalper Keys','Scalper anahtarlarını al','Получить ключи Scalper'],
 ['Website Login','Siteye giriş','Вход на сайт'],
 ['Reset Login Code','Giriş kodunu sıfırla','Сбросить код входа'],
 ['My Licenses','Lisanslarım','Мои лицензии'],
 ['Buy & Renew','Satın al ve yenile','Купить или продлить'],
 ['Website and web app sign-in code','Site ve web uygulaması giriş kodu','Код входа на сайт и в веб-приложение'],
 ['Signal Bridge license','Signal Bridge lisansı','Лицензия Signal Bridge'],
 ['Scalper Pro licenses','Scalper Pro lisansları','Лицензии Scalper Pro'],
 ['7-day Scalper Pro license','7 günlük Scalper Pro lisansı','Лицензия Scalper Pro на 7 дней'],
 ['Reveal to copy','Kopyalamak için göster','Показать для копирования'],
 ['Support · @DrFXGOD','Destek · @DrFXGOD','Поддержка · @DrFXGOD'],
 ['Personal TradingView webhook','Kişisel TradingView webhook’u','Личный вебхук TradingView'],
 ['Channel or group webhook','Kanal veya grup webhook’u','Вебхук канала или группы'],
 ['Copy alert template','Uyarı şablonunu kopyala','Скопировать шаблон оповещения'],
 ['Back to channels','Kanallara dön','Вернуться к каналам'],
 ['No Telegram purchases yet.','Henüz Telegram satın alımı yok.','Покупок в Telegram пока нет.'],
 ['Admin Console','Yönetim paneli','Панель администратора'],
 ['Member Directory','Üye listesi','Список пользователей']
].map(([en,tr,ru])=>[en,{tr,ru}]));

export function widgetText(language,value){
 return widgetLabels.get(value)?.[language]??value;
}
