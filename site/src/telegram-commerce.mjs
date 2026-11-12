import {widgetText} from './telegram-onboarding.mjs';
import {validLogin,issueScalperKey} from './scalper.mjs';

export const STAR_PLANS=Object.freeze({
 quarterly:{label:'Signal Bridge · 3 months',duration:'+3 months',stars:2350},
 annual:{label:'Signal Bridge · 12 months',duration:'+1 year',stars:8250},
 scalper_1m:{label:'Scalper Pro · 30 days',days:30,stars:950},
 scalper_3m:{label:'Scalper Pro · 90 days',days:90,stars:2450}
});
export const TERMS_VERSION='2026-11-11';
export const LICENSE_TERMS='DrFX digital license terms · '+TERMS_VERSION+'\nSignal Bridge: duration starts on first activation; renewals extend the current expiry.\nScalper Pro: the key is bound to the MT5 account shown on your invoice. Check that account before paying. Purchases do not guarantee trading returns.\nFor billing, delivery or refund requests use /paysupport and include your order ID. Payment uses Telegram Stars; website USD prices are separate. Your license and receipt stay in your private account.';
const localTerms={
 tr:[
  'DrFX dijital lisans koşulları',
  'Signal Bridge: Lisans süresi ilk etkinleştirmeyle başlar. Yenileme mevcut bitiş tarihini uzatır.',
  'Scalper Pro: Anahtar faturada görünen MT5 hesabına bağlıdır. Ödemeden önce hesabı kontrol edin. Satın alımlar işlem getirisi garantilemez.',
  'Faturalama, teslimat ve iade talepleri için sipariş kimliğiyle /paysupport kullanın. Telegram ödemeleri Stars ile yapılır; web sitesindeki USD fiyatları ayrıdır. Lisans ve makbuz özel hesabınızda kalır.'
 ],
 ru:[
  'Условия цифровой лицензии DrFX',
  'Signal Bridge: Срок начинается при первой активации. Продление увеличивает текущий срок действия.',
  'Scalper Pro: Ключ привязан к счёту MT5, указанному в счёте на оплату. Проверьте этот счёт перед оплатой. Покупка не гарантирует доходность торговли.',
  'По вопросам оплаты, получения или возврата отправьте /paysupport и укажите номер заказа. Оплата в Telegram производится в Stars; цены в долларах на сайте отдельные. Лицензия и квитанция хранятся в личном аккаунте.'
 ],
 hi:[
  'DrFX डिजिटल लाइसेंस की शर्तें',
  'Signal Bridge: अवधि पहली बार सक्रिय करने पर शुरू होती है। नवीनीकरण मौजूदा समाप्ति तारीख को आगे बढ़ाता है।',
  'Scalper Pro: कुंजी इनवॉइस पर दिखाए गए MT5 खाते से जुड़ी है। भुगतान से पहले खाता जाँचें। खरीद से ट्रेडिंग रिटर्न की गारंटी नहीं मिलती।',
  'बिलिंग, डिलीवरी या रिफ़ंड के लिए ऑर्डर ID के साथ /paysupport भेजें। Telegram में भुगतान Stars से होता है। वेबसाइट पर USD कीमतें अलग हैं। लाइसेंस और रसीद आपके निजी खाते में रहती हैं।'
 ],
 fa:[
  'شرایط لایسنس دیجیتال DrFXAi',
  'سیگنال بریج: مدت اعتبار با نخستین فعال‌سازی شروع می‌شود. تمدید به اعتبار فعلی اضافه می‌شود.',
  'اسکلپر پرو: کلید به حساب MT5 درج‌شده در فاکتور وابسته است. قبل از پرداخت شماره حساب را بررسی کنید. خرید، سود معاملاتی را تضمین نمی‌کند.',
  'برای پرداخت، تحویل یا درخواست بازپرداخت، /paysupport را با شناسهٔ سفارش بفرستید. پرداخت تلگرام با Stars است. قیمت دلاری سایت جداست. لایسنس و رسید در حساب خصوصی شما می‌مانند.'
 ]
};
export function licenseTerms(language){
 const terms=Object.hasOwn(localTerms,language)?localTerms[language]:null;
 return terms?[terms[0]+' · '+TERMS_VERSION,...terms.slice(1)].join('\n'):LICENSE_TERMS;
}
export const LICENSE_TERMS_FA=licenseTerms('fa');
export function starPrice(env,plan){
 if(!Object.hasOwn(STAR_PLANS,plan))return null;
 let prices={};try{prices=JSON.parse(env.TELEGRAM_STAR_PRICES||'{}')}catch{return null}
 if(!prices||typeof prices!=='object'||Array.isArray(prices))return null;
 const n=Object.hasOwn(prices,plan)?prices[plan]:STAR_PLANS[plan].stars;
 return Number.isSafeInteger(n)&&n>0&&n<=1000000?n:null;
}
export function matchesPayment(order,from,payment){
 return !!order&&String(from)===order.telegram_id&&payment.currency==='XTR'&&
  Number.isSafeInteger(payment.total_amount)&&payment.total_amount===order.stars&&
  payment.invoice_payload===order.id;
}
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
export async function sendPrivateLicenses(env,h,user,product='bridge'){
 const t=text=>widgetText(h.language,text);
 if(product==='scalper'){
  const rows=(await env.DB.prepare('SELECT account_login,days,encrypted_key,nonce FROM scalper_keys WHERE user_id=? ORDER BY created_at DESC LIMIT 5').bind(user.id).all()).results||[];
  if(!rows.length){await h.api(env,'sendMessage',{chat_id:user.telegram_id,text:t('No Scalper Pro key issued yet. The EA includes a 7-day trial.')});return;}
  let text='<b>'+esc(t('Your Scalper Pro licenses'))+'</b>';
  for(const r of rows)text+='\nMT5 #'+esc(r.account_login)+' · '+r.days+' '+esc(t('days'))+'\n<code>'+esc(await h.decryptCode(env,r.encrypted_key,r.nonce))+'</code>';
  await h.api(env,'sendMessage',{chat_id:user.telegram_id,text,parse_mode:'HTML',protect_content:true});
 }else{
  const r=await h.licenseRecord(env,user);
  if(r.status!=='active'){await h.api(env,'sendMessage',{chat_id:user.telegram_id,text:t('Your license is not active. Use the menu to renew or get help.')});return;}
  const key=await h.decryptCode(env,r.encrypted_code,r.nonce);
  const text=['<b>'+esc(t('Your Signal Bridge activation code'))+'</b>','<code>'+esc(key)+'</code>',
   esc(t('Plan'))+': '+esc(r.plan),esc(t('Expires'))+': '+esc(r.expires_at||t('Starts on first activation')),
   esc(t('Paste this code into the MT5 EA license setting.'))].join('\n');
  await h.api(env,'sendMessage',{chat_id:user.telegram_id,text,parse_mode:'HTML',protect_content:true,reply_markup:{inline_keyboard:[[{text:t('Copy activation code'),copy_text:{text:key}}]]}});
 }
}

export async function purchaseQuote(env,h,user,plan,accountLogin){
 if(h.reconcile)await h.reconcile(env);
 const p=STAR_PLANS[plan],stars=starPrice(env,plan);
 if(!p||!stars)throw Error('PLAN_UNAVAILABLE');
 if(!env.LICENSE_VAULT_KEY||(p.days&&!env.SCALPER_LICENSE_SECRET))throw Error('LICENSING_NOT_CONFIGURED');
 const login=p.days?validLogin(accountLogin):null;
 const t=text=>widgetText(h.language,text);
 if(p.days&&!login){
  await h.api(env,'sendMessage',{chat_id:user.telegram_id,text:[t('Scalper Pro needs your MT5 account number before purchase.'),'/buy '+plan+' YOUR_MT5_LOGIN','/buy '+plan+' 12345678',t('The account will be shown again before payment.')].join('\n')});
  return {message:t('Scalper Pro needs your MT5 account number before purchase.')};
 }
 if(!p.days)await h.licenseRecord(env,user);
 const id='tso_'+crypto.randomUUID().replace(/-/g,'');
 await env.DB.prepare('INSERT INTO telegram_star_orders (id,user_id,telegram_id,plan,stars,account_login,terms_version) VALUES (?,?,?,?,?,?,?)').bind(id,user.id,String(user.telegram_id),plan,stars,login,TERMS_VERSION).run();
 const summary=[t(p.label),t('Price')+': '+stars+' Telegram Stars',
  ...(login?[t('MT5 account')+': '+login]:[]),t('Order')+': '+id,'',licenseTerms(h.language),'',
  t('Tap Accept & pay to accept these terms and open your invoice.')].join('\n');
 await h.api(env,'sendMessage',{chat_id:user.telegram_id,text:summary,protect_content:true,reply_markup:{inline_keyboard:[[{text:t('Accept & pay')+' · '+stars+' Stars',callback_data:'tgpay:'+id}]]}});
 return {message:t('Review the order and terms in the new message, then tap Accept & pay.')};
}
export async function acceptStarQuote(q,env,h){
 if(!q?.data?.startsWith('tgpay:'))return false;
 const id=q.data.slice(6),from=String(q.from?.id||''),chat=q.message?.chat;
 let language=h.language;
 const t=text=>widgetText(language,text);
 let message='This order is unavailable. Send /buy for a new order.';
 if(chat?.type==='private'&&String(chat.id)===from&&/^tso_[a-f0-9]{32}$/.test(id)){
  const o=await env.DB.prepare("SELECT o.* FROM telegram_star_orders o JOIN site_users u ON u.id=o.user_id WHERE o.id=? AND o.telegram_id=? AND u.telegram_id=? AND u.status='active'").bind(id,from,from).first();
  if(o&&h.locale)language=await h.locale(env,from).catch(()=>language);
  if(o?.status==='draft'&&STAR_PLANS[o.plan]){
   const claimed=await env.DB.prepare("UPDATE telegram_star_orders SET status='pending',accepted_at=CURRENT_TIMESTAMP WHERE id=? AND status='draft' AND created_at>datetime('now','-1 hour')").bind(id).run();
   if(claimed.meta?.changes===1){
    // Claim before sendInvoice: repeated taps never send a second payable invoice.
    await h.api(env,'answerCallbackQuery',{callback_query_id:q.id,text:t('Preparing invoice…')});
    const p=STAR_PLANS[o.plan];
    const invoice=await h.api(env,'sendInvoice',{chat_id:from,title:t(p.label),description:t(p.label)+(o.account_login?' · MT5 #'+o.account_login:'')+' · '+t('Terms accepted')+' '+TERMS_VERSION,payload:o.id,provider_token:'',currency:'XTR',prices:[{label:t(p.label),amount:o.stars}],start_parameter:o.id,protect_content:true});
    await env.DB.prepare('UPDATE telegram_star_orders SET invoice_message_id=? WHERE id=?').bind(String(invoice.message_id),id).run();
    return true;
   }
  }else if(o?.status==='pending')message='Invoice already requested. Check the previous message, or send /buy to start again.';
  else if(o?.status==='paid')message='Already paid. Use /code or /scalper to retrieve your license.';
 }
 await h.api(env,'answerCallbackQuery',{callback_query_id:q.id,text:t(message),show_alert:true});
 return true;
}
export async function starPreCheckout(q,env,h){
 const o=await env.DB.prepare("SELECT o.*,u.status AS user_status FROM telegram_star_orders o JOIN site_users u ON u.id=o.user_id AND u.telegram_id=o.telegram_id WHERE o.id=? AND o.created_at>datetime('now','-1 hour')").bind(String(q.invoice_payload||'')).first();
 const ok=matchesPayment(o,q.from?.id,q)&&o.status==='pending'&&!!o.accepted_at&&o.user_status==='active';
 const language=!ok&&o&&String(q.from?.id)===o.telegram_id&&h.locale?await h.locale(env,o.telegram_id).catch(()=>h.language):h.language;
 await h.api(env,'answerPreCheckoutQuery',{pre_checkout_query_id:q.id,ok,...(!ok?{error_message:widgetText(language,'Order expired, unavailable or payment details changed. Send /buy for a new invoice.')}:{})});
 return {ok:true};
}
export async function starSuccessfulPayment(msg,env,h){
 const payment=msg.successful_payment;
 const o=await env.DB.prepare('SELECT * FROM telegram_star_orders WHERE id=?').bind(String(payment.invoice_payload||'')).first();
 if(msg.chat?.type!=='private'||String(msg.chat.id)!==String(msg.from?.id)||!matchesPayment(o,msg.from?.id,payment)||
  typeof payment.telegram_payment_charge_id!=='string'||!payment.telegram_payment_charge_id||payment.telegram_payment_charge_id.length>512)throw Error('STAR_PAYMENT_MISMATCH');
 if(o.status==='paid'){
  if(o.charge_id!==payment.telegram_payment_charge_id)throw Error('STAR_DUPLICATE_CHARGE');
  return {ok:true,duplicate:true};
 }
 if(o.status!=='pending'||!o.accepted_at)throw Error('STAR_ORDER_NOT_PENDING');
 const user=await env.DB.prepare('SELECT * FROM site_users WHERE id=? AND telegram_id=?').bind(o.user_id,o.telegram_id).first();
 if(!user)throw Error('STAR_USER_MISSING');
 const plan=STAR_PLANS[o.plan];if(!plan)throw Error('STAR_PLAN_MISSING');
 const statements=[];
 if(plan.days){
  const k=await issueScalperKey(env,h,{userId:user.id,login:o.account_login,plan:o.plan,orderId:o.id});
  statements.push(env.DB.prepare("INSERT INTO scalper_keys (id,user_id,order_id,account_login,plan,days,serial,encrypted_key,nonce,issued_by) SELECT ?,?,?,?,?,?,?,?,?,'telegram_stars' WHERE EXISTS(SELECT 1 FROM telegram_star_orders WHERE id=? AND status='pending')").bind(k.id,user.id,o.id,o.account_login,o.plan,k.days,k.serial,k.sealed.cipher,k.sealed.iv,o.id));
 }else{
  const r=await h.licenseRecord(env,user);
  statements.push(env.DB.prepare("UPDATE ea_licenses SET plan=?,duration_modifier=?,status='active',expires_at=CASE WHEN activated_at IS NULL THEN NULL ELSE datetime(CASE WHEN expires_at>CURRENT_TIMESTAMP THEN expires_at ELSE CURRENT_TIMESTAMP END,?) END,updated_at=CURRENT_TIMESTAMP WHERE agent_id=? AND EXISTS(SELECT 1 FROM telegram_star_orders WHERE id=? AND status='pending')").bind(o.plan,plan.duration,plan.duration,r.agent_id,o.id));
  statements.push(env.DB.prepare("UPDATE site_users SET plan=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND EXISTS(SELECT 1 FROM telegram_star_orders WHERE id=? AND status='pending')").bind(o.plan,user.id,o.id));
 }
 statements.push(env.DB.prepare("INSERT INTO site_audit (id,actor_id,action,subject_id,detail) SELECT ?,?,'telegram_stars_paid',?,? WHERE EXISTS(SELECT 1 FROM telegram_star_orders WHERE id=? AND status='pending')").bind(h.uid('aud'),user.id,user.id,o.id+' · '+o.plan+' · '+o.stars+' Stars',o.id));
 statements.push(env.DB.prepare("UPDATE telegram_star_orders SET status='paid',charge_id=?,paid_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'").bind(payment.telegram_payment_charge_id,o.id));
 // All entitlement writes and the unique charge claim commit together or roll back together.
 const results=await env.DB.batch(statements);
 if(results.at(-1)?.meta?.changes!==1)return {ok:true,duplicate:true};
 try{
  const language=h.locale?await h.locale(env,o.telegram_id).catch(()=>h.language):h.language;
  await h.api(env,'sendMessage',{chat_id:o.telegram_id,text:widgetText(language,'Payment received')+' · '+o.stars+' Stars\n'+widgetText(language,plan.label)+'\n'+widgetText(language,'Order')+': '+o.id+'\n'+widgetText(language,'Retrieve your license anytime with')+' '+(plan.days?'/scalper':'/code')+'.',protect_content:true});
  await sendPrivateLicenses(env,{...h,language},user,plan.days?'scalper':'bridge');
  await env.DB.prepare('UPDATE telegram_star_orders SET notified_at=CURRENT_TIMESTAMP WHERE id=?').bind(o.id).run();
 }catch{console.warn('Telegram Stars license delivery pending; retrieve with /code or /scalper');}
 return {ok:true,granted:true};
}
export async function starOrders(env,h,user){
 const rows=(await env.DB.prepare('SELECT id,plan,stars,status,created_at FROM telegram_star_orders WHERE user_id=? ORDER BY created_at DESC LIMIT 10').bind(user.id).all()).results||[];
 await h.api(env,'sendMessage',{chat_id:user.telegram_id,text:rows.length?rows.map(o=>o.id+'\n'+widgetText(h.language,STAR_PLANS[o.plan].label)+' · '+o.stars+' Stars · '+o.status+'\n'+o.created_at+' UTC').join('\n\n'):widgetText(h.language,'No Telegram Stars orders yet. Send /buy to view plans.'),protect_content:true});
}

