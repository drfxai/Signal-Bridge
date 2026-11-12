import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {I18N_JS,TRANSLATIONS,LOCALES,markCommonText} from '../site/src/i18n.mjs';

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
