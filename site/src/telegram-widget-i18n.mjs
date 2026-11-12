// Fixed native Telegram widget copy. Server-side only: no external scripts or data.
import {botLanguage} from './telegram-i18n.mjs';

export const WIDGET_LANGUAGE_CODES=Object.freeze(['en','fa','tr','ru','hi']);
const columns={en:0,fa:1,tr:2,ru:3,hi:4};
// [English, Persian, Turkish, Russian, Hindi]. Keep stable command names and MT5 values untranslated.
const copy={
 bridge:[
  ['AUTOMATION ACCESS CENTER','مرکز دسترسی خودکار','OTOMASYON ERİŞİM MERKEZİ','ЦЕНТР АВТОМАТИЗАЦИИ','ऑटोमेशन एक्सेस केंद्र'],
  ['● ACCOUNT ACTIVE','● حساب فعال','● HESAP AKTİF','● АККАУНТ АКТИВЕН','● खाता सक्रिय'],
  ['● ACCOUNT STATUS','● وضعیت حساب','● HESAP DURUMU','● СОСТОЯНИЕ АККАУНТА','● खाते की स्थिति'],
  ['● ACCOUNT','● حساب','● HESAP','● АККАУНТ','● खाता'],
  ['YOUR EXECUTION LICENSE','لایسنس اجرای معاملات شما','İŞLEM LİSANSINIZ','ВАША ТОРГОВАЯ ЛИЦЕНЗИЯ','आपका ट्रेडिंग लाइसेंस'],
  ['TradingView and Telegram → MT5 infrastructure','زیرساخت اتصال تریدینگ‌ویو و تلگرام به MT5','TradingView ve Telegram → MT5 altyapısı','Инфраструктура TradingView и Telegram → MT5','TradingView और Telegram → MT5 प्रणाली'],
  ['LICENSE STATE','وضعیت لایسنس','LİSANS DURUMU','СТАТУС ЛИЦЕНЗИИ','लाइसेंस की स्थिति'],
  ['EXPIRES (UTC)','انقضا (UTC)','BİTİŞ (UTC)','ИСТЕКАЕТ (UTC)','समाप्ति (UTC)'],
  ['SIGNAL ROUTING','مسیریابی سیگنال','SİNYAL YÖNLENDİRME','МАРШРУТИЗАЦИЯ СИГНАЛОВ','सिग्नल रूटिंग'],
  ['Workflow · status not verified','فرایند · وضعیت تأیید نشده','İş akışı · durum doğrulanmadı','Маршрут · статус не проверен','कार्यप्रवाह · स्थिति अप्रमाणित'],
  ['Get activation code','دریافت کد فعال‌سازی','Etkinleştirme kodunu al','Получить код активации','एक्टिवेशन कोड लें'],
  ['Plans & renew','پلن‌ها و تمدید','Paketler ve yenileme','Тарифы и продление','प्लान और नवीनीकरण'],
  ['↻ Refresh License','↻ به‌روزرسانی لایسنس','↻ Lisansı yenile','↻ Обновить лицензию','↻ लाइसेंस अपडेट करें'],
  ['Open Dashboard','باز کردن داشبورد','Paneli aç','Открыть панель','डैशबोर्ड खोलें'],
  ['Private account status. This view cannot execute a trade.','وضعیت حساب خصوصی است؛ این ویجت معامله‌ای اجرا نمی‌کند.','Özel hesap durumu. Bu görünüm işlem açamaz.','Статус личного аккаунта. Здесь нельзя открыть сделку.','निजी खाते की स्थिति। यह विजेट ट्रेड नहीं खोल सकता।'],
  ['SECURE VIEW','نمایش امن','GÜVENLİ GÖRÜNÜM','ЗАЩИЩЁННЫЙ ПРОСМОТР','सुरक्षित दृश्य'],
  ['Membership','اشتراک','Üyelik','Подписка','सदस्यता'],
  ['Unknown','نامشخص','Bilinmiyor','Неизвестно','अज्ञात'],
  ['Not activated','فعال نشده','Etkinleştirilmedi','Не активирована','सक्रिय नहीं हुआ'],
  ['Browser preview mode','حالت پیش‌نمایش مرورگر','Tarayıcı önizleme modu','Режим просмотра в браузере','ब्राउज़र प्रीव्यू मोड'],
  ['Checking membership…','در حال بررسی اشتراک…','Üyelik kontrol ediliyor…','Проверка подписки…','सदस्यता जाँची जा रही है…'],
  ['Account refreshed','حساب به‌روزرسانی شد','Hesap yenilendi','Аккаунт обновлён','खाता अपडेट हुआ'],
  ['Refresh failed: ','به‌روزرسانی ناموفق: ','Yenileme başarısız: ','Ошибка обновления: ','अपडेट विफल: '],
  ['Open this widget in Telegram','این ویجت را در تلگرام باز کنید','Bu widgetı Telegram içinde açın','Откройте этот виджет в Telegram','इस विजेट को Telegram में खोलें'],
  ['Check this chat','این گفتگو را بررسی کنید','Bu sohbeti kontrol edin','Проверьте этот чат','यह चैट देखें'],
  ['Request failed. Try /licenses in this chat.','درخواست ناموفق بود. در این گفتگو /licenses را بفرستید.','İstek başarısız. Bu sohbette /licenses deneyin.','Запрос не удался. Отправьте /licenses в этот чат.','अनुरोध विफल। इस चैट में /licenses भेजें।']
 ],
 scalper:[
  ['SMART MONEY SYSTEM','سیستم اسمارت مانی','AKILLI PARA SİSTEMİ','СИСТЕМА SMART MONEY','स्मार्ट मनी सिस्टम'],
  ['◆ PREMIUM','◆ ویژه','◆ PREMIUM','◆ ПРЕМИУМ','◆ प्रीमियम'],
  ['VISUAL CONCEPT · NOT A MARKET CHART','طرح نمایشی · نمودار واقعی بازار نیست','GÖRSEL ÖRNEK · PİYASA GRAFİĞİ DEĞİLDİR','ИЛЛЮСТРАЦИЯ · НЕ РЕАЛЬНЫЙ ГРАФИК','दृश्य उदाहरण · वास्तविक मार्केट चार्ट नहीं'],
  ['YOUR SCALPER ACCESS','دسترسی اسکلپر شما','SCALPER ERİŞİMİNİZ','ВАШ ДОСТУП К SCALPER','आपका स्कैल्पर एक्सेस'],
  ['Issued license records','تعداد لایسنس‌های صادرشده','Verilen lisans kayıtları','Выданные лицензии','जारी किए गए लाइसेंस'],
  ['LICENSE SUMMARY','خلاصه لایسنس‌ها','LİSANS ÖZETİ','СВОДКА ЛИЦЕНЗИЙ','लाइसेंस सारांश'],
  ['LATEST PLAN','آخرین پلن','SON PAKET','ПОСЛЕДНИЙ ТАРИФ','नवीनतम प्लान'],
  ['DURATION','مدت اعتبار','SÜRE','СРОК','अवधि'],
  ['Last issued (UTC)','آخرین صدور (UTC)','Son veriliş (UTC)','Последняя выдача (UTC)','अंतिम जारी (UTC)'],
  ['◈ LIQUIDITY','◈ نقدینگی','◈ LİKİDİTE','◈ ЛИКВИДНОСТЬ','◈ लिक्विडिटी'],
  ['▣ ORDER BLOCK','▣ اردر بلاک','▣ EMİR BLOĞU','▣ ОРДЕР-БЛОК','▣ ऑर्डर ब्लॉक'],
  ['↗ DIVERGENCE','↗ واگرایی','↗ UYUMSUZLUK','↗ ДИВЕРГЕНЦИЯ','↗ डाइवर्जेंस'],
  ['Get my keys','دریافت کلیدهای من','Anahtarlarımı al','Получить мои ключи','मेरी कुंजियाँ लें'],
  ['Buy / renew','خرید / تمدید','Satın al / yenile','Купить / продлить','खरीदें / नवीनीकरण'],
  ['↻ Refresh','↻ به‌روزرسانی','↻ Yenile','↻ Обновить','↻ रीफ़्रेश'],
  ['Manage Licenses','مدیریت لایسنس‌ها','Lisansları yönet','Управление лицензиями','लाइसेंस प्रबंधित करें'],
  ['Issued keys only; activation and live trade performance are not verified.','فقط کلیدهای صادرشده نمایش داده می‌شوند؛ فعال‌سازی و عملکرد معاملات تأیید نشده‌اند.','Yalnızca verilen anahtarlar; etkinleştirme ve canlı işlem performansı doğrulanmadı.','Только выданные ключи; активация и результаты торговли не подтверждены.','केवल जारी कुंजियाँ; सक्रियण और लाइव ट्रेड प्रदर्शन अप्रमाणित हैं।'],
  ['No key issued','هنوز کلیدی صادر نشده','Henüz anahtar verilmedi','Ключ пока не выдан','अभी कोई कुंजी जारी नहीं हुई'],
  ['Unknown','نامشخص','Bilinmiyor','Неизвестно','अज्ञात'],
  [' days',' روز',' gün',' дней',' दिन'],
  ['Browser preview mode','حالت پیش‌نمایش مرورگر','Tarayıcı önizleme modu','Режим просмотра в браузере','ब्राउज़र प्रीव्यू मोड'],
  ['Checking licensed records…','در حال بررسی لایسنس‌ها…','Lisans kayıtları kontrol ediliyor…','Проверка лицензий…','लाइसेंस रिकॉर्ड जाँचे जा रहे हैं…'],
  ['Licenses refreshed','لایسنس‌ها به‌روزرسانی شدند','Lisanslar yenilendi','Лицензии обновлены','लाइसेंस अपडेट हुए'],
  ['Refresh failed: ','به‌روزرسانی ناموفق: ','Yenileme başarısız: ','Ошибка обновления: ','अपडेट विफल: '],
  ['Open this widget in Telegram','این ویجت را در تلگرام باز کنید','Bu widgetı Telegram içinde açın','Откройте этот виджет в Telegram','इस विजेट को Telegram में खोलें'],
  ['Check this chat','این گفتگو را بررسی کنید','Bu sohbeti kontrol edin','Проверьте этот чат','यह चैट देखें'],
  ['Request failed. Try /licenses in this chat.','درخواست ناموفق بود. در این گفتگو /licenses را بفرستید.','İstek başarısız. Bu sohbette /licenses deneyin.','Запрос не удался. Отправьте /licenses в этот чат.','अनुरोध विफल। इस चैट में /licenses भेजें।']
 ],
 signal:[
  ['DrFXAi | Signal','DrFXAi | سیگنال','DrFXAi | Sinyal','DrFXAi | Сигнал','DrFXAi | सिग्नल'],
  ['RECORDED ALERT','هشدار ثبت‌شده','KAYITLI UYARI','СОХРАНЁННЫЙ СИГНАЛ','रिकॉर्ड किया गया अलर्ट'],
  ['SIGNAL BRIDGE','سیگنال بریج','SIGNAL BRIDGE','SIGNAL BRIDGE','सिग्नल ब्रिज'],
  ['NO RECORDED SIGNAL','سیگنالی ثبت نشده','KAYITLI SİNYAL YOK','НЕТ СОХРАНЁННОГО СИГНАЛА','कोई रिकॉर्ड किया सिग्नल नहीं'],
  ['NO SIGNAL','بدون سیگنال','SİNYAL YOK','НЕТ СИГНАЛА','कोई सिग्नल नहीं'],
  ['No recorded timestamp','زمان ثبت نشده','Kayıt zamanı yok','Время записи неизвестно','रिकॉर्ड का समय उपलब्ध नहीं'],
  ['Entry reference','قیمت ورود','Referans giriş','Ориентир входа','एंट्री संदर्भ'],
  ['Stop loss','حد ضرر','Zararı durdur','Стоп-лосс','स्टॉप लॉस'],
  ['Target 1','هدف اول','Hedef 1','Цель 1','लक्ष्य 1'],
  ['Target 2','هدف دوم','Hedef 2','Цель 2','लक्ष्य 2'],
  ['Target 3','هدف سوم','Hedef 3','Цель 3','लक्ष्य 3'],
  ['↻ Refresh','↻ به‌روزرسانی','↻ Yenile','↻ Обновить','↻ रीफ़्रेश'],
  ['Copy Signal','کپی سیگنال','Sinyali kopyala','Скопировать сигнал','सिग्नल कॉपी करें'],
  ['Signal History','تاریخچه سیگنال‌ها','Sinyal geçmişi','История сигналов','सिग्नल इतिहास'],
  ['Main Menu','منوی اصلی','Ana menü','Главное меню','मुख्य मेनू'],
  ['Recorded alert, not a live price. Broker fills and target hits require an EA receipt.','هشدار ثبت‌شده است، نه قیمت لحظه‌ای؛ تأیید اجرا و تارگت‌ها نیازمند گزارش EA است.','Kayıtlı uyarı, canlı fiyat değil. İşlem ve hedef onayı için EA kaydı gerekir.','Сохранённый сигнал, не текущая цена. Исполнение и цели подтверждаются отчётом EA.','रिकॉर्ड किया अलर्ट, लाइव मूल्य नहीं। निष्पादन और लक्ष्य की पुष्टि के लिए EA रिकॉर्ड चाहिए।'],
  ['Not supplied','تعیین نشده','Belirtilmedi','Не указано','दिया नहीं गया'],
  ['Checking last recorded alert…','در حال بررسی آخرین هشدار…','Son kayıtlı uyarı kontrol ediliyor…','Проверка последнего сигнала…','अंतिम रिकॉर्ड किया अलर्ट जाँचा जा रहा है…'],
  ['Record refreshed','رکورد به‌روزرسانی شد','Kayıt güncellendi','Запись обновлена','रिकॉर्ड अपडेट हुआ'],
  ['Refresh unavailable. Try /signal again.','به‌روزرسانی ممکن نیست. دوباره /signal را بفرستید.','Yenileme yapılamadı. /signal komutunu tekrar deneyin.','Обновление недоступно. Повторите /signal.','रीफ़्रेश उपलब्ध नहीं। /signal फिर भेजें।'],
  ['Your workspace appears below.','فضای کار شما در پیام بعدی نمایش داده می‌شود.','Çalışma alanınız aşağıda görünecek.','Рабочая панель появится ниже.','आपका वर्कस्पेस नीचे दिखाई देगा।'],
  ['Send /menu to open your workspace.','برای باز کردن فضای کار /menu را بفرستید.','Çalışma alanını açmak için /menu gönderin.','Чтобы открыть панель, отправьте /menu.','वर्कस्पेस खोलने के लिए /menu भेजें।']
 ]
};
const captions={
 bridge:['DrFXAi Signal Bridge · Private member status','DrFXAi Signal Bridge · وضعیت خصوصی اشتراک','DrFXAi Signal Bridge · Özel üyelik durumu','DrFXAi Signal Bridge · Личный статус подписки','DrFXAi Signal Bridge · निजी सदस्यता स्थिति'],
 signal:['DrFXAi · Latest recorded signal · Broker execution unverified','DrFXAi · آخرین سیگنال ثبت‌شده · اجرا در بروکر تأیید نشده','DrFXAi · Son kayıtlı sinyal · Broker işlemi doğrulanmadı','DrFXAi · Последний сигнал · Исполнение у брокера не подтверждено','DrFXAi · अंतिम रिकॉर्ड किया सिग्नल · ब्रोकर निष्पादन अप्रमाणित'],
 scalper:['DrFXAi Scalper Pro · Private issuance overview (no keys)','DrFXAi Scalper Pro · خلاصه صدور لایسنس خصوصی (بدون کلید)','DrFXAi Scalper Pro · Özel lisans özeti (anahtar yok)','DrFXAi Scalper Pro · Личная сводка лицензий (без ключей)','DrFXAi Scalper Pro · निजी लाइसेंस सारांश (कुंजी नहीं)']
};
export function widgetCaption(kind,language='en'){
 const code=botLanguage(language);
 return (captions[kind]||captions.bridge)[columns[code]];
}
// HTML payload is fixed, so replacements touch presentation copy only and never chatData.
// Replace all labels in one pass to avoid cascaded translation.
export function localizeNativeWidget(html,language='en',kind='bridge'){
 const code=botLanguage(language);
 if(code==='en')return html;
 const labels=copy[kind]||copy.bridge;
 const map=new Map(labels.map(row=>[row[0],row[columns[code]]]));
 const escape=value=>value.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
 const pattern=new RegExp([...map.keys()].sort((a,b)=>b.length-a.length).map(escape).join('|'),'g');
 return html.replace('<html>','<html lang="'+code+'" dir="'+(code==='fa'?'rtl':'ltr')+'">')
  .replace(pattern,value=>map.get(value)||value);
}
