import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LOCALES,TRANSLATIONS,markCommonText} from '../site/src/i18n.mjs';
import {UI_COMPLETENESS_PHRASES} from '../site/src/ui-completeness-translations.mjs';

const admin=readFileSync(new URL('../site/src/admin-mini.mjs',import.meta.url),'utf8');
const mini=readFileSync(new URL('../site/src/telegram-mini.mjs',import.meta.url),'utf8');
const site=readFileSync(new URL('../site/src/ui.mjs',import.meta.url),'utf8');

test('admin and Mini App missing copy has complete five-language mappings',()=>{
 assert.equal(LOCALES.join(','),'en,fa,tr,ru,hi');
 assert.ok(UI_COMPLETENESS_PHRASES.length>=50);
 const english=Object.entries(TRANSLATIONS.en);
 for(const row of UI_COMPLETENESS_PHRASES){
  assert.equal(row.length,LOCALES.length);
  assert.ok(row.every(value=>typeof value==='string'&&value.trim().length>0),'Incomplete phrase '+row[0]);
  const pair=english.find(([,value])=>value===row[0]);
  assert.ok(pair,'Source missing: '+row[0]);
  for(const [index,language] of LOCALES.entries()){
   assert.equal(TRANSLATIONS[language][pair[0]],row[index],'Wrong '+language+' translation: '+row[0]);
  }
 }
});
test('every administrator data-ops-fa label is recognized outside Persian',()=>{
 const labels=[...admin.matchAll(/data-ops-fa="[^"]+"[^>]*>([^<]+)/g)]
  .map(match=>match[1].trim()).filter(Boolean);
 assert.ok(labels.length>=35);
 const dictionary=new Set(Object.values(TRANSLATIONS.en));
 for(const label of labels)assert.ok(dictionary.has(label),'Untranslated admin control: '+label);
});
test('English source text and locale-aware mobile styles preserve the account actions',()=>{
 const sample=markCommonText('<span>Sign In / Sign Up</span>','data-i18n');
 assert.match(sample,/data-i18n="common_\d+"/);
 assert.ok(mini.includes('.mini-account-action>span:first-child{min-width:0;white-space:normal;overflow-wrap:anywhere;'));
 assert.ok(mini.includes('html[dir=rtl] .mini-lang-options{right:auto;left:0}'));
 assert.ok(mini.includes("html[lang=hi] .mini-lang-options button[data-mini-lang=hi]>span"));
 assert.ok(site.includes('.drfx-mobile-account-actions .drfx-account-cta span:first-child{min-width:0;white-space:normal;overflow-wrap:anywhere;'));
 assert.ok(mini.includes("document.documentElement.dir=locale==='fa'?'rtl':'ltr'"));
});
