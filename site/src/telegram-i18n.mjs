// Telegram bot UI localization. English is the default until an explicit user choice.
// Only predefined translation text is rendered as Telegram HTML.
export const BOT_LANGUAGES=Object.freeze({
 en:{label:'🇬🇧 English',name:'English'},
 fa:{label:'🇮🇷 فارسی',name:'فارسی'},
 ar:{label:'🇸🇦 العربية',name:'العربية'},
 tr:{label:'🇹🇷 Türkçe',name:'Türkçe'},
 ru:{label:'🇷🇺 Русский',name:'Русский'},
 hi:{label:'🇮🇳 हिन्दी',name:'हिन्दी'}
});
export const BOT_LANGUAGE_CODES=Object.freeze(Object.keys(BOT_LANGUAGES));
const copy={
 en:{
 choose:'🌐 <b>Choose your language</b>\nSelect the language for DrFX Signal Bridge messages.\nDefault: English. You can change it later with /language.',
 selected:'✅ Language set to English.',
 welcome:'⚡ <b>Welcome to DrFX Company</b>\nYour website account and MT5 EA license are available.\nOpen the Mini App to manage your membership.\n/login — website sign-in key\n/resetlogin — replace website sign-in key\n/code — private MT5 EA activation serial\n/language — change language.',
 app:'📱 Open the DrFX Mini App to manage your membership and MT5 EA license.',
 loginTitle:'🔐 <b>Website sign-in key</b>',
 loginText:'Your private 32-character website key is reusable. Treat it as a password.\nEnter it only in the Telegram tab of https://drfx.company\nUse /resetlogin if exposed.\n⚠️ /code provides a separate MT5 EA serial.',
 reset:'Your old website key was revoked. Any existing website sessions were ended.',
 serialTitle:'🔑 <b>Your private MT5 EA activation serial</b>',
 serialNotice:'For MetaTrader 5 only. Do not share this code.',
 member:'👤 <b>My membership</b>',
 plan:'Plan',license:'EA license',expires:'Expires',notActivated:'Starts at first EA activation',dashboard:'Dashboard',
 tooMany:'Too many requests. Try again later.',suspended:'Your account is suspended. Contact support.',
 licensePending:'Your account is ready. EA licensing is still being configured. Try /code later.',
 loginUnavailable:'Website sign-in is temporarily unavailable. Your EA license is not affected.',
 licenseUnavailable:'EA licensing is temporarily unavailable.',languageError:'Please select one of the displayed languages.'
 },
 fa:{
 choose:'🌐 <b>زبان خود را انتخاب کنید</b>\nزبان پیام‌های بات DrFX Signal Bridge را انتخاب کنید.\nزبان پیش‌فرض انگلیسی است. برای تغییر دوباره /language را بزنید.',
 selected:'✅ زبان فارسی فعال شد.',
 welcome:'⚡ <b>به DrFX Company خوش آمدید</b>\nحساب سایت و لایسنس اکسپرت MT5 شما آماده است.\nبرای مدیریت اشتراک، مینی‌اپ را باز کنید.\n/login — کد ورود به سایت\n/resetlogin — تعویض کد ورود\n/code — کد فعال‌سازی اختصاصی EA\n/language — تغییر زبان',
 app:'📱 برای مشاهده اشتراک و لایسنس EA، مینی‌اپ DrFX را باز کنید.',
 loginTitle:'🔐 <b>کد ورود به وب‌سایت</b>',
 loginText:'کد ۳۲ کاراکتری شما برای ورود به سایت قابل استفاده مجدد است؛ آن را مانند رمز عبور محرمانه نگه دارید.\nفقط در بخش تلگرام سایت https://drfx.company وارد کنید.\nاگر افشا شد /resetlogin را بزنید.\n⚠️ دستور /code مربوط به کد جداگانه EA است.',
 reset:'کد ورود قبلی لغو و نشست‌های قبلی سایت بسته شدند.',
 serialTitle:'🔑 <b>کد فعال‌سازی اختصاصی EA</b>',
 serialNotice:'فقط برای متاتریدر ۵ است. آن را با دیگران به اشتراک نگذارید.',
 member:'👤 <b>اشتراک من</b>',
 plan:'اشتراک',license:'لایسنس EA',expires:'پایان اعتبار',notActivated:'از اولین فعال‌سازی EA شروع می‌شود',dashboard:'داشبورد',
 tooMany:'تعداد درخواست‌ها زیاد است. بعداً دوباره تلاش کنید.',suspended:'حساب شما معلق شده است. با پشتیبانی تماس بگیرید.',
 licensePending:'حساب شما آماده است؛ سرویس لایسنس در حال تنظیم است. بعداً /code را امتحان کنید.',
 loginUnavailable:'ورود سایت موقتاً در دسترس نیست. لایسنس EA شما محفوظ است.',
 licenseUnavailable:'سرویس لایسنس EA موقتاً در دسترس نیست.',languageError:'یکی از زبان‌های فهرست را انتخاب کنید.'
 },
 ar:{
 choose:'🌐 <b>اختر لغتك</b>\nاختر لغة رسائل بوت DrFX Signal Bridge.\nاللغة الافتراضية الإنجليزية. يمكنك تغييرها باستخدام /language.',
 selected:'✅ تم اختيار اللغة العربية.',
 welcome:'⚡ <b>مرحبًا بك في DrFX Company</b>\nحساب الموقع وترخيص MT5 EA جاهزان.\nافتح التطبيق المصغر لإدارة اشتراكك.\n/login — رمز الدخول إلى الموقع\n/resetlogin — استبدال رمز الدخول\n/code — رمز تفعيل MT5 EA\n/language — تغيير اللغة',
 app:'📱 افتح تطبيق DrFX المصغر لإدارة اشتراكك وترخيص MT5 EA.',
 loginTitle:'🔐 <b>رمز دخول الموقع</b>',
 loginText:'رمز الموقع المكون من 32 حرفًا قابل لإعادة الاستخدام. احتفظ به ككلمة مرور.\nأدخله فقط في قسم Telegram على https://drfx.company\nاستخدم /resetlogin إذا تم كشفه.\n⚠️ /code مخصص لرمز MT5 EA المنفصل.',
 reset:'تم إلغاء الرمز السابق وإنهاء جلسات الموقع السابقة.',
 serialTitle:'🔑 <b>رمز تفعيل MT5 EA الخاص بك</b>',
 serialNotice:'خاص بميتاتريدر 5 فقط. لا تشارك هذا الرمز.',
 member:'👤 <b>اشتراكي</b>',plan:'الخطة',license:'ترخيص EA',expires:'ينتهي',notActivated:'يبدأ عند أول تفعيل للـ EA',dashboard:'لوحة التحكم',
 tooMany:'طلبات كثيرة جدًا. حاول لاحقًا.',suspended:'حسابك موقوف. اتصل بالدعم.',
 licensePending:'حسابك جاهز، لكن الترخيص قيد الإعداد. حاول /code لاحقًا.',
 loginUnavailable:'تسجيل الدخول غير متاح مؤقتًا. ترخيص EA لم يتأثر.',
 licenseUnavailable:'خدمة ترخيص EA غير متاحة مؤقتًا.',languageError:'اختر لغة من القائمة.'
 },
 tr:{
 choose:'🌐 <b>Dilinizi seçin</b>\nDrFX Signal Bridge bot mesajlarının dilini seçin.\nVarsayılan dil İngilizcedir. /language ile değiştirebilirsiniz.',
 selected:'✅ Türkçe seçildi.',
 welcome:'⚡ <b>DrFX Company’ye hoş geldiniz</b>\nWeb hesabınız ve MT5 EA lisansınız hazır.\nÜyeliğinizi yönetmek için Mini App’i açın.\n/login — web giriş anahtarı\n/resetlogin — giriş anahtarını yenile\n/code — MT5 EA etkinleştirme kodu\n/language — dili değiştir',
 app:'📱 Üyelik ve MT5 EA lisansınızı yönetmek için DrFX Mini App’i açın.',
 loginTitle:'🔐 <b>Web sitesi giriş anahtarı</b>',
 loginText:'32 karakterlik web giriş anahtarınız yeniden kullanılabilir; parola gibi saklayın.\nYalnızca https://drfx.company adresindeki Telegram sekmesine girin.\nPaylaşıldıysa /resetlogin kullanın.\n⚠️ /code ayrı bir MT5 EA kodudur.',
 reset:'Eski web giriş anahtarı ve önceki oturumlar iptal edildi.',
 serialTitle:'🔑 <b>Özel MT5 EA etkinleştirme kodunuz</b>',
 serialNotice:'Yalnızca MetaTrader 5 içindir. Kimseyle paylaşmayın.',
 member:'👤 <b>Üyeliğim</b>',plan:'Paket',license:'EA lisansı',expires:'Bitiş',notActivated:'İlk EA etkinleştirmesinde başlar',dashboard:'Kontrol paneli',
 tooMany:'Çok fazla istek. Daha sonra deneyin.',suspended:'Hesabınız askıya alındı. Destekle görüşün.',
 licensePending:'Hesabınız hazır, EA lisansı ayarlanıyor. /code komutunu sonra deneyin.',
 loginUnavailable:'Web girişi geçici olarak kullanılamıyor. EA lisansınız etkilenmedi.',
 licenseUnavailable:'EA lisans hizmeti geçici olarak kullanılamıyor.',languageError:'Lütfen listeden bir dil seçin.'
 },
 ru:{
 choose:'🌐 <b>Выберите язык</b>\nВыберите язык сообщений бота DrFX Signal Bridge.\nПо умолчанию — английский. Изменить можно через /language.',
 selected:'✅ Выбран русский язык.',
 welcome:'⚡ <b>Добро пожаловать в DrFX Company</b>\nВаш аккаунт сайта и лицензия MT5 EA готовы.\nОткройте Mini App для управления подпиской.\n/login — ключ входа на сайт\n/resetlogin — заменить ключ входа\n/code — код активации MT5 EA\n/language — сменить язык',
 app:'📱 Откройте DrFX Mini App для управления подпиской и лицензией MT5 EA.',
 loginTitle:'🔐 <b>Ключ входа на сайт</b>',
 loginText:'Ваш 32-символьный ключ входа можно использовать повторно. Храните его как пароль.\nВводите только во вкладке Telegram на https://drfx.company\nЕсли ключ раскрыт, используйте /resetlogin.\n⚠️ /code — отдельный код для MT5 EA.',
 reset:'Прежний ключ отозван, а сеансы сайта завершены.',
 serialTitle:'🔑 <b>Ваш персональный код активации MT5 EA</b>',
 serialNotice:'Только для MetaTrader 5. Не передавайте этот код.',
 member:'👤 <b>Моя подписка</b>',plan:'Тариф',license:'Лицензия EA',expires:'Истекает',notActivated:'Начнется при первой активации EA',dashboard:'Панель',
 tooMany:'Слишком много запросов. Попробуйте позже.',suspended:'Аккаунт приостановлен. Обратитесь в поддержку.',
 licensePending:'Аккаунт готов, лицензия EA настраивается. Попробуйте /code позже.',
 loginUnavailable:'Вход на сайт временно недоступен. Лицензия EA не затронута.',
 licenseUnavailable:'Сервис лицензирования EA временно недоступен.',languageError:'Выберите язык из списка.'
 },
 hi:{
 choose:'🌐 <b>अपनी भाषा चुनें</b>\nDrFX Signal Bridge बॉट संदेशों की भाषा चुनें।\nडिफ़ॉल्ट अंग्रेज़ी है। बाद में /language से बदल सकते हैं।',
 selected:'✅ हिन्दी भाषा चुनी गई।',
 welcome:'⚡ <b>DrFX Company में स्वागत है</b>\nआपका वेबसाइट खाता और MT5 EA लाइसेंस तैयार हैं।\nसदस्यता प्रबंधित करने के लिए Mini App खोलें।\n/login — वेबसाइट लॉगिन कुंजी\n/resetlogin — लॉगिन कुंजी बदलें\n/code — MT5 EA एक्टिवेशन कोड\n/language — भाषा बदलें',
 app:'📱 सदस्यता और MT5 EA लाइसेंस प्रबंधित करने के लिए DrFX Mini App खोलें।',
 loginTitle:'🔐 <b>वेबसाइट लॉगिन कुंजी</b>',
 loginText:'आपकी 32-अक्षर वाली वेबसाइट कुंजी दोबारा इस्तेमाल हो सकती है। इसे पासवर्ड की तरह सुरक्षित रखें।\nइसे केवल https://drfx.company के Telegram टैब में डालें।\nकुंजी लीक हो तो /resetlogin इस्तेमाल करें।\n⚠️ /code अलग MT5 EA कोड है।',
 reset:'पुरानी वेबसाइट कुंजी रद्द और पुराने सेशन समाप्त किए गए।',
 serialTitle:'🔑 <b>आपका निजी MT5 EA एक्टिवेशन कोड</b>',
 serialNotice:'केवल MetaTrader 5 के लिए। यह कोड साझा न करें।',
 member:'👤 <b>मेरी सदस्यता</b>',plan:'प्लान',license:'EA लाइसेंस',expires:'समाप्ति',notActivated:'पहले EA एक्टिवेशन से शुरू होगा',dashboard:'डैशबोर्ड',
 tooMany:'बहुत अधिक अनुरोध। बाद में प्रयास करें।',suspended:'आपका खाता निलंबित है। सहायता से संपर्क करें।',
 licensePending:'खाता तैयार है, EA लाइसेंस सेट हो रहा है। बाद में /code आज़माएँ।',
 loginUnavailable:'वेबसाइट लॉगिन अभी उपलब्ध नहीं है। आपका EA लाइसेंस सुरक्षित है।',
 licenseUnavailable:'EA लाइसेंस सेवा अस्थायी रूप से उपलब्ध नहीं है।',languageError:'कृपया सूची में से कोई भाषा चुनें।'
 }
};
export const botLanguage=code=>Object.hasOwn(BOT_LANGUAGES,code)?code:'en';
export const botText=(lang,key)=>copy[botLanguage(lang)][key]||copy.en[key]||key;
export const botLanguageKeyboard=()=>({
 inline_keyboard:[
  [{text:'🇬🇧 English',callback_data:'lang:en'},{text:'🇮🇷 فارسی',callback_data:'lang:fa'}],
  [{text:'🇸🇦 العربية',callback_data:'lang:ar'},{text:'🇹🇷 Türkçe',callback_data:'lang:tr'}],
  [{text:'🇷🇺 Русский',callback_data:'lang:ru'},{text:'🇮🇳 हिन्दी',callback_data:'lang:hi'}]
 ]
});
