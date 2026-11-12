import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {I18N_JS,TRANSLATIONS,LOCALES,markCommonText} from '../site/src/i18n.mjs';
import {TOUR_EXTRA} from '../site/src/setup-tour.mjs';

test('new public pages have literal five-language translations for core UI, terms and safety',()=>{
 const required=[
  'THE DRFX SUITE','SCALPER PRO PLANS','Which symbols and timeframes does it support?',
  'No tool does. Scalper Pro shows you the setup and its historical odds on your own symbol. You decide the risk. Trading involves substantial risk of loss.',
  'YOUR CONNECTION STUDIO','03 · CHOOSE A CHANNEL','Check your connection',
  'WORKSPACE / ANALYTICS','Execution timeline','No broker data yet.',
  'Closed positions','Trade history is unavailable until the new EA and database migration are active.',
  'YOUR PRIVATE WORKSPACE','PRIVATE ACTIVATION CODE','CUSTOMER DIRECTORY',
  'Email address','Verification code','Get a licence key','Signal details'
 ];
 for(const label of required){
  const pair=Object.entries(TRANSLATIONS.en).find(([,value])=>value===label);
  assert.ok(pair,'Missing English source: '+label);
  for(const language of LOCALES){
   const translated=TRANSLATIONS[language][pair[0]];
   assert.ok(translated&&typeof translated==='string',language+' missing '+label);
   if(language!=='en')assert.notEqual(translated,label,'Untranslated '+language+': '+label);
  }
 }
});
test('portal and setup modules use five-language shared keys instead of Persian-only fallback',()=>{
 for(const path of ['member-setup.mjs','premium-portal.mjs','trade-journal.mjs']){
  const source=readFileSync(new URL('../site/src/'+path,import.meta.url),'utf8');
  assert.match(source,/window\.DrFXI18N\?\.translate/,'Missing shared translation runtime: '+path);
 }
 assert.match(markCommonText('<h1>SCALPER PRO PLANS</h1>','data-i18n'),/data-i18n="common_\d+"/);
});
test('runtime updates dynamic text and restores original English on language changes without changing secrets',()=>{
 const visible={nodeType:3,nodeValue:'Get a licence key',parentElement:{closest:()=>null}};
 const secret={nodeType:3,nodeValue:'Get a licence key',parentElement:{closest:()=>({id:'private-secret'})}};
 const body={nodeType:1,closest:()=>null,hasAttribute:()=>false};
 const events={};let listener;
 const doc={
  documentElement:{lang:'tr'},body,readyState:'complete',
  createTreeWalker(root){
   const items=root===body?[visible,secret]:[];
   let i=0;return {nextNode:()=>items[i++]||null};
  }
 };
 class Observer{constructor(cb){listener=cb}observe(){}disconnect(){}}
 const win={addEventListener:(name,fn)=>{events[name]=fn}};
 vm.runInNewContext(I18N_JS,{window:win,document:doc,MutationObserver:Observer,WeakMap,Set,Object});
 assert.equal(visible.nodeValue,'Lisans anahtarı al');
 assert.equal(secret.nodeValue,'Get a licence key');
 const newNode={nodeType:3,nodeValue:'No broker data yet.',parentElement:{closest:()=>null}};
 listener([{type:'childList',addedNodes:[newNode]}]);
 assert.equal(newNode.nodeValue,'Henüz broker verisi yok.');
 doc.documentElement.lang='ru';events['drfx-language-change']();
 assert.equal(visible.nodeValue,'Получить ключ лицензии');
 doc.documentElement.lang='en';events['drfx-language-change']();
 assert.equal(visible.nodeValue,'Get a licence key');
});

test('website hero, setup statuses and MT5 tour use all five languages',()=>{
 const required=[
  'A new standard for','signal execution.','A meticulously engineered workspace that eliminates legacy Windows DLL bridges, third-party VPS lag, and fragmented licensing between your signal source and MetaTrader 5 terminal.',
  'Webhook ready','Channel ready','Your connections are ready','Choose your channel','Continue →','Language'
 ];
 for(const english of required){
  const key=Object.keys(TRANSLATIONS.en).find(k=>TRANSLATIONS.en[k]===english);
  assert.ok(key,'Source key missing: '+english);
  for(const lang of LOCALES){
   assert.ok(TRANSLATIONS[lang][key],'Missing '+lang+' translation for '+english);
   if(lang!=='en')assert.notEqual(TRANSLATIONS[lang][key],english,'Untranslated '+lang+': '+english);
  }
 }
 for(const lang of ['tr','ru','hi']){
  assert.equal(TOUR_EXTRA[lang].titles.length,11);
  assert.equal(TOUR_EXTRA[lang].bodies.length,11);
  assert.equal(new Set(TOUR_EXTRA[lang].titles).size,11);
  for(const text of [...TOUR_EXTRA[lang].titles,...TOUR_EXTRA[lang].bodies]){
   assert.ok(text.length>10,'Empty guided-tour translation');
  }
  for(const word of ['DRFX / GUIDED SETUP','Start guided setup','End tour','Next →','Done ✓','Show'])assert.ok(TOUR_EXTRA[lang].ui[word],'Missing '+lang+' tour UI '+word);
 }
 const selector=readFileSync(new URL('../site/src/design.mjs',import.meta.url),'utf8');
 assert.match(selector,/data-site-language=\\\"hi\\\" aria-pressed=\\\"false\\\"/);
 assert.ok(selector.includes('dfx-locale-tag\\\">HI'));
 assert.ok(selector.includes('dfx-locale-check\\\">✓'));
 const setup=readFileSync(new URL('../site/src/member-setup.mjs',import.meta.url),'utf8');
 assert.match(setup,/const localized=\\(en,faText\\)=>/);
 assert.match(setup,/localized\\('Webhook ready'/);
});
