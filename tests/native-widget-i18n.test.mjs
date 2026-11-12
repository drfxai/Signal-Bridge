import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {SIGNAL_BRIDGE_WIDGET_HTML} from '../site/src/telegram-widgets.mjs';
import {SCALPER_WIDGET_HTML} from '../site/src/telegram-scalper-widget.mjs';
import {SIGNAL_HISTORY_WIDGET_HTML,signalWidgetHtml} from '../site/src/telegram-signal-widget.mjs';
import {localizeNativeWidget,widgetCaption,WIDGET_LANGUAGE_CODES} from '../site/src/telegram-widget-i18n.mjs';
import {localizeWorkspace} from '../site/src/telegram-onboarding.mjs';
import {TRANSLATIONS,LOCALES,markCommonText} from '../site/src/i18n.mjs';

const expected={
 en:['YOUR EXECUTION LICENSE','YOUR SCALPER ACCESS','NO RECORDED SIGNAL'],
 fa:['لایسنس اجرای معاملات شما','دسترسی اسکلپر شما','سیگنالی ثبت نشده'],
 tr:['İŞLEM LİSANSINIZ','SCALPER ERİŞİMİNİZ','KAYITLI SİNYAL YOK'],
 ru:['ВАША ТОРГОВАЯ ЛИЦЕНЗИЯ','ВАШ ДОСТУП К SCALPER','НЕТ СОХРАНЁННОГО СИГНАЛА'],
 hi:['आपका ट्रेडिंग लाइसेंस','आपका स्कैल्पर एक्सेस','कोई रिकॉर्ड किया सिग्नल नहीं']
};
const components=[
 ['bridge',SIGNAL_BRIDGE_WIDGET_HTML,'sb:refresh'],
 ['scalper',SCALPER_WIDGET_HTML,'sb:scalper:refresh'],
 ['signal',SIGNAL_HISTORY_WIDGET_HTML,'sb:signal:refresh']
];
test('language list is aligned across website, mini app, bot and widgets',()=>{
 assert.deepEqual([...WIDGET_LANGUAGE_CODES],LOCALES);
 for(const lang of LOCALES){
  for(const key of Object.keys(TRANSLATIONS.en)){
   assert.ok(typeof TRANSLATIONS[lang]?.[key]==='string',lang+': missing '+key);
  }
 }
});
test('each native widget renders its selected language without changing command callbacks',()=>{
 for(const [language,labels] of Object.entries(expected)){
  components.forEach(([kind,source,action],index)=>{
   const html=localizeNativeWidget(source,language,kind);
   assert.ok(html.includes(labels[index]),kind+' '+language);
   assert.ok(html.includes(action),kind+': action changed');
   assert.ok(html.includes('TelegramWidget'),kind+': widget bridge changed');
   assert.equal((html.match(/<script>/g)||[]).length,1,'self-contained script count');
   assert.ok(Buffer.byteLength(html)<=32768,kind+': Telegram HTML limit');
   assert.ok(deflateSync(Buffer.from(html),{level:9}).byteLength<=4096,kind+': Telegram compression limit');
   if(language!=='en'){
    assert.match(html,new RegExp('<html lang="'+language+'" dir="'+(language==='fa'?'rtl':'ltr')+'">'));
   }else assert.equal(html,source);
   assert.doesNotMatch(html,/api\.telegram\.org|bot\d+:[A-Za-z0-9_-]{20,}/);
  });
  assert.equal(signalWidgetHtml(language),localizeNativeWidget(SIGNAL_HISTORY_WIDGET_HTML,language,'signal'));
  assert.ok(widgetCaption('bridge',language).includes('DrFXAi'));
  assert.ok(widgetCaption('signal',language).includes('DrFXAi'));
  assert.ok(widgetCaption('scalper',language).includes('DrFXAi'));
 }
 assert.equal(localizeNativeWidget(SIGNAL_BRIDGE_WIDGET_HTML,'xx','bridge'),SIGNAL_BRIDGE_WIDGET_HTML);
});
test('non-Persian workspace elements follow the selected language',()=>{
 const view={page:'home',title:'Main Menu',subtitle:'Settings & Support',footer:'My Orders',
  rows:[{label:'Linked Accounts',value:'No key issued'}],
  buttons:[{label:'Main Menu',action:'ui:page:home'}]};
 for(const language of ['tr','ru','hi']){
  const translated=localizeWorkspace(view,language);
  assert.notEqual(translated.title,view.title);
  assert.notEqual(translated.subtitle,view.subtitle);
  assert.notEqual(translated.rows[0].label,view.rows[0].label);
  assert.equal(translated.buttons[0].action,view.buttons[0].action);
 }
 assert.equal(localizeWorkspace(view,'en'),view);
});
test('localizable accessibility attributes preserve their original English values',()=>{
 const html=markCommonText('<button aria-label="Open menu" title="Choose app language">Language</button><input placeholder="Paste code from /login">','data-i18n');
 assert.match(html,/aria-label="Open menu" data-i18n-attr-aria-label="attr_12"/);
 assert.match(html,/title="Choose app language" data-i18n-attr-title="attr_1"/);
 assert.match(html,/placeholder="Paste code from \/login" data-i18n-attr-placeholder="attr_6"/);
 for(const code of LOCALES){
  assert.ok(TRANSLATIONS[code].attr_1.length>3);
  assert.ok(TRANSLATIONS[code].attr_6.length>3);
  assert.ok(TRANSLATIONS[code].attr_12.length>3);
 }
});
test('website and mini app explicitly bind all localization keys',()=>{
 const files=['../site/src/ui.mjs','../site/src/telegram-mini.mjs','../site/src/admin-mini.mjs'];
 for(const path of files){
  const source=readFileSync(new URL(path,import.meta.url),'utf8');
  if(path.endsWith('/ui.mjs')||path.endsWith('/telegram-mini.mjs'))assert.match(source,/data-i18n-attr-aria-label/);
  const keys=[...source.matchAll(/data-(?:i18n|tr|i)="([^"]+)"/g)].map(m=>m[1].replaceAll('-','_'));
  for(const key of keys)assert.ok(Object.hasOwn(TRANSLATIONS.en,key),path+' missing '+key);
 }
 const worker=readFileSync(new URL('../site/src/worker.mjs',import.meta.url),'utf8');
 assert.match(worker,/html:localizeNativeWidget\(SIGNAL_BRIDGE_WIDGET_HTML,lang,'bridge'\)/);
 assert.match(worker,/html:localizeNativeWidget\(SCALPER_WIDGET_HTML,lang,'scalper'\)/);
 assert.match(worker,/html:signalWidgetHtml\(lang\)/);
 assert.match(worker,/caption:widgetCaption\('signal',lang\)/);
});
