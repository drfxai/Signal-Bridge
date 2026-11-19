import {BOT_LANGUAGES} from './telegram-i18n.mjs';
import {eaDownloadCatalog} from './ea-downloads.mjs';

export const START_COPY={
 en:{
  terms:'License terms',planNames:{semiannual:'Signal Bridge · 6 months',annual:'Signal Bridge · 12 months',scalper_1m:'Scalper Pro · 1 month',scalper_3m:'Scalper Pro · 3 months',scalper_1y:'Scalper Pro · 1 year'},
  start:'Start',language:'Choose your language',menu:'Main menu',intro:'Download your EA, get a trial and connect MetaTrader 5.',
  downloads:'Download EA',trial:'Free trial',setup:'Setup guide',buy:'Buy with Stars',support:'Support',community:'Community',portal:'My account',
  bridgeTrial:'Signal Bridge · 3 months',scalperTrial:'Scalper Pro · 7 days',getCode:'Get activation code',claim:'Get trial key',
  mt5:'MT5 account number',accepted:'I accept the license terms.',unavailable:'Coming soon',signIn:'Open this app from the official bot to continue.',
  pending:'Payment received by Telegram. Your license will arrive in the bot after confirmation.',
  expired:'Your Signal Bridge license has expired. Open Buy with Stars to renew.',
  steps:[
   ['Download the EA','Choose Signal Bridge or Scalper Pro and save its EX5 file to the computer that runs MetaTrader 5.'],
   ['Install in MetaTrader 5','Open File → Open Data Folder → MQL5 → Experts. Copy the EX5 here. In Navigator, right-click Expert Advisors, select Refresh and drag the EA onto your broker’s chart.'],
   ['Activate your license','Signal Bridge: open the EA’s Inputs, paste your code into InpActivationCode and set InpGoldSymbol to the exact broker symbol. Allow https://signalbridge.drfx.online in Tools → Options → Expert Advisors → WebRequest. Scalper Pro: paste the key for your MT5 account into ENTER LICENCE KEY and press ACTIVATE. Enable Algo Trading in MT5.'],
   ['Create a TradingView alert','For Signal Bridge, open My account and create your personal TradingView webhook. Enable two-factor authentication in TradingView. Open Create alert, choose your indicator’s alert condition and paste the personal URL into Webhook URL. Use the alert message or template supplied by your Signal Bridge indicator.'],
   ['Verify on a demo account','Send a test alert and check TradingView’s Webhook status and MT5’s Experts tab. New personal webhooks start in preview mode. Enable execution in your account settings when you are ready to test it on demo.']
  ]
 },
 fa:{
  terms:'شرایط لایسنس',planNames:{semiannual:'سیگنال بریج · ۶ ماه',annual:'سیگنال بریج · ۱۲ ماه',scalper_1m:'اسکلپر پرو · ۱ ماه',scalper_3m:'اسکلپر پرو · ۳ ماه',scalper_1y:'اسکلپر پرو · ۱ سال'},
  start:'شروع',language:'انتخاب زبان',menu:'منوی اصلی',intro:'اکسپرت را دانلود کنید، لایسنس آزمایشی بگیرید و متاتریدر ۵ را متصل کنید.',
  downloads:'دانلود اکسپرت',trial:'دوره آزمایشی رایگان',setup:'راهنمای نصب',buy:'خرید با استار',support:'پشتیبانی',community:'کامیونتی',portal:'حساب من',
  bridgeTrial:'سیگنال بریج · ۳ ماه',scalperTrial:'اسکلپر پرو · ۷ روز',getCode:'دریافت کد فعال‌سازی',claim:'دریافت کلید آزمایشی',
  mt5:'شماره حساب MT5',accepted:'شرایط لایسنس را می‌پذیرم.',unavailable:'به‌زودی',signIn:'برای ادامه، برنامه را از بات رسمی باز کنید.',
  pending:'تلگرام پرداخت را دریافت کرد. پس از تأیید، لایسنس در بات ارسال می‌شود.',
  expired:'اعتبار لایسنس سیگنال بریج تمام شده است. برای تمدید، خرید با استار را باز کنید.',
  steps:[
   ['دانلود اکسپرت','فایل EX5 سیگنال بریج یا اسکلپر پرو را روی رایانه‌ای که متاتریدر ۵ روی آن اجرا می‌شود ذخیره کنید.'],
   ['نصب در متاتریدر ۵','مسیر File → Open Data Folder → MQL5 → Experts را باز کنید و فایل را کپی کنید. در Navigator روی Expert Advisors کلیک راست کنید، Refresh را بزنید و اکسپرت را روی چارت بروکر بکشید.'],
   ['فعال‌سازی لایسنس','سیگنال بریج: در Inputs، کد را در InpActivationCode و نماد دقیق بروکر را در InpGoldSymbol وارد کنید. در Tools → Options → Expert Advisors نشانی https://signalbridge.drfx.online را در WebRequest مجاز کنید. اسکلپر پرو: کلید حساب MT5 را در ENTER LICENCE KEY وارد کنید و ACTIVATE را بزنید. Algo Trading را روشن کنید.'],
   ['ساخت هشدار تریدینگ‌ویو','برای سیگنال بریج، از «حساب من» وب‌هوک شخصی بسازید. تأیید دومرحله‌ای را در تریدینگ‌ویو روشن کنید، در Create alert شرط هشدار اندیکاتور را انتخاب کنید، نشانی را در Webhook URL بچسبانید و از پیام یا قالب مخصوص اندیکاتور استفاده کنید.'],
   ['بررسی در حساب دمو','یک هشدار آزمایشی بفرستید و Webhook status تریدینگ‌ویو و تب Experts متاتریدر را بررسی کنید. وب‌هوک جدید در حالت پیش‌نمایش است. وقتی آماده بودید، اجرای معاملات را در تنظیمات حساب برای آزمایش دمو فعال کنید.']
  ]
 },
 tr:{
  terms:'Lisans koşulları',planNames:{semiannual:'Signal Bridge · 6 ay',annual:'Signal Bridge · 12 ay',scalper_1m:'Scalper Pro · 1 ay',scalper_3m:'Scalper Pro · 3 ay',scalper_1y:'Scalper Pro · 1 yıl'},
  start:'Başla',language:'Dil seçin',menu:'Ana menü',intro:'EA dosyanızı indirin, deneme lisansı alın ve MetaTrader 5’i bağlayın.',
  downloads:'EA indir',trial:'Ücretsiz deneme',setup:'Kurulum rehberi',buy:'Stars ile satın al',support:'Destek',community:'Topluluk',portal:'Hesabım',
  bridgeTrial:'Signal Bridge · 3 ay',scalperTrial:'Scalper Pro · 7 gün',getCode:'Etkinleştirme kodu al',claim:'Deneme anahtarı al',
  mt5:'MT5 hesap numarası',accepted:'Lisans koşullarını kabul ediyorum.',unavailable:'Yakında',signIn:'Devam etmek için uygulamayı resmî bottan açın.',
  pending:'Telegram ödemeyi aldı. Onaydan sonra lisans botta gönderilir.',expired:'Signal Bridge lisansınızın süresi doldu. Yenilemek için Stars mağazasını açın.',
  steps:[
   ['EA dosyasını indirin','EX5 dosyasını MetaTrader 5’in çalıştığı bilgisayara kaydedin.'],
   ['MT5’e kurun','File → Open Data Folder → MQL5 → Experts yolunu açın ve EX5’i kopyalayın. Navigator → Expert Advisors bölümünde Refresh seçin ve EA’yı grafiğe ekleyin.'],
   ['Lisansı etkinleştirin','Signal Bridge: Inputs bölümünde InpActivationCode ve aracı kurumunuzun tam InpGoldSymbol değerini girin. Tools → Options → Expert Advisors bölümünde https://signalbridge.drfx.online adresine WebRequest izni verin. Scalper Pro: ENTER LICENCE KEY alanına hesabınızın anahtarını girip ACTIVATE düğmesine basın. Algo Trading’i açın.'],
   ['TradingView uyarısını oluşturun','Hesabım bölümünde kişisel webhook oluşturun. TradingView’de iki adımlı doğrulamayı etkinleştirin. Create alert bölümünde gösterge koşulunu seçin, URL’yi Webhook URL alanına ve göstergenin şablonunu Message alanına yapıştırın.'],
   ['Demo hesapta doğrulayın','Bir uyarı gönderin ve TradingView Webhook status ile MT5 Experts sekmesini kontrol edin. Yeni webhook önizleme modunda başlar. Hazır olduğunuzda demo için işlem yürütmeyi açın.']
  ]
 },
 ru:{
  terms:'Условия лицензии',planNames:{semiannual:'Signal Bridge · 6 месяцев',annual:'Signal Bridge · 12 месяцев',scalper_1m:'Scalper Pro · 1 месяц',scalper_3m:'Scalper Pro · 3 месяца',scalper_1y:'Scalper Pro · 1 год'},
  start:'Начать',language:'Выберите язык',menu:'Главное меню',intro:'Скачайте советник, получите пробную лицензию и подключите MetaTrader 5.',
  downloads:'Скачать EA',trial:'Пробная лицензия',setup:'Установка',buy:'Купить за Stars',support:'Поддержка',community:'Сообщество',portal:'Мой аккаунт',
  bridgeTrial:'Signal Bridge · 3 месяца',scalperTrial:'Scalper Pro · 7 дней',getCode:'Получить код активации',claim:'Получить пробный ключ',
  mt5:'Номер счёта MT5',accepted:'Принимаю условия лицензии.',unavailable:'Скоро',signIn:'Откройте приложение из официального бота.',
  pending:'Telegram принял платёж. После подтверждения лицензия придёт в боте.',expired:'Срок лицензии Signal Bridge истёк. Продлите её в магазине Stars.',
  steps:[
   ['Скачайте советник','Сохраните файл EX5 на компьютер с MetaTrader 5.'],
   ['Установите в MT5','Откройте File → Open Data Folder → MQL5 → Experts и скопируйте EX5. В Navigator обновите Expert Advisors через Refresh и добавьте советник на график.'],
   ['Активируйте лицензию','Signal Bridge: в Inputs укажите InpActivationCode и точный символ брокера в InpGoldSymbol. В Tools → Options → Expert Advisors разрешите WebRequest для https://signalbridge.drfx.online. Scalper Pro: вставьте ключ счёта в ENTER LICENCE KEY и нажмите ACTIVATE. Включите Algo Trading.'],
   ['Создайте оповещение TradingView','В аккаунте создайте личный вебхук. Включите двухфакторную аутентификацию в TradingView. В Create alert выберите условие индикатора, вставьте адрес в Webhook URL и шаблон индикатора в Message.'],
   ['Проверьте на демосчёте','Отправьте тестовое оповещение. Проверьте Webhook status в TradingView и вкладку Experts в MT5. Новый вебхук работает в режиме предпросмотра. Включите исполнение для теста на демосчёте, когда будете готовы.']
  ]
 },
 hi:{
  terms:'लाइसेंस की शर्तें',planNames:{semiannual:'Signal Bridge · 6 महीने',annual:'Signal Bridge · 12 महीने',scalper_1m:'Scalper Pro · 1 महीना',scalper_3m:'Scalper Pro · 3 महीने',scalper_1y:'Scalper Pro · 1 साल'},
  start:'शुरू करें',language:'भाषा चुनें',menu:'मुख्य मेनू',intro:'EA डाउनलोड करें, ट्रायल लाइसेंस लें और MetaTrader 5 कनेक्ट करें।',
  downloads:'EA डाउनलोड',trial:'मुफ़्त ट्रायल',setup:'सेटअप गाइड',buy:'Stars से खरीदें',support:'सहायता',community:'समुदाय',portal:'मेरा खाता',
  bridgeTrial:'Signal Bridge · 3 महीने',scalperTrial:'Scalper Pro · 7 दिन',getCode:'एक्टिवेशन कोड लें',claim:'ट्रायल कुंजी लें',
  mt5:'MT5 खाता नंबर',accepted:'मैं लाइसेंस की शर्तें स्वीकार करता हूँ।',unavailable:'जल्द उपलब्ध',signIn:'आगे बढ़ने के लिए ऐप आधिकारिक बॉट से खोलें।',
  pending:'Telegram ने भुगतान प्राप्त किया। पुष्टि के बाद लाइसेंस बॉट में आएगा।',expired:'Signal Bridge लाइसेंस समाप्त हो गया है। Stars स्टोर से नवीनीकरण करें।',
  steps:[
   ['EA डाउनलोड करें','EX5 फ़ाइल उस कंप्यूटर पर सहेजें जहाँ MetaTrader 5 चलता है।'],
   ['MT5 में इंस्टॉल करें','File → Open Data Folder → MQL5 → Experts खोलें और EX5 कॉपी करें। Navigator में Expert Advisors रीफ़्रेश करें और EA को चार्ट पर लगाएँ।'],
   ['लाइसेंस सक्रिय करें','Signal Bridge: Inputs में InpActivationCode और ब्रोकर का सटीक InpGoldSymbol डालें। Tools → Options → Expert Advisors में https://signalbridge.drfx.online को WebRequest की अनुमति दें। Scalper Pro: ENTER LICENCE KEY में खाते की कुंजी डालें और ACTIVATE दबाएँ। Algo Trading चालू करें।'],
   ['TradingView अलर्ट बनाएँ','मेरा खाता में निजी वेबहुक बनाएँ। TradingView में दो-चरणीय सत्यापन चालू करें। Create alert में इंडिकेटर की शर्त चुनें, Webhook URL में पता और Message में इंडिकेटर का टेम्पलेट डालें।'],
   ['डेमो खाते पर जाँचें','टेस्ट अलर्ट भेजें। TradingView में Webhook status और MT5 में Experts टैब देखें। नया वेबहुक पूर्वावलोकन मोड में शुरू होता है। तैयार होने पर डेमो टेस्ट के लिए ऑर्डर निष्पादन चालू करें।']
  ]
 }
};

export const START_LANGUAGES=Object.entries(BOT_LANGUAGES).map(([id,{name}])=>[id,name]);
export const SUPPORT_URL='https://t.me/DrFXGOD';
export const COMMUNITY_URL='https://t.me/DrFXAi';
export const DOWNLOADS=eaDownloadCatalog();
