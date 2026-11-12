import {onboardingView,onboardingPages,localizeWorkspace} from '../site/src/telegram-onboarding.mjs';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {BOT_WORKSPACE_WIDGET_HTML,workspaceView,widgetViewData,localizePrivateWidget} from '../site/src/telegram-workspace.mjs';
import {SIGNAL_HISTORY_WIDGET_HTML,signalHistoryWidgetData} from '../site/src/telegram-signal-widget.mjs';
import {STAR_PLANS,starPrice,licenseTerms} from '../site/src/telegram-commerce.mjs';
import {LOCALES} from '../site/src/i18n.mjs';
import {SIGNAL_BRIDGE_WIDGET_HTML} from '../site/src/telegram-widgets.mjs';
import {SCALPER_WIDGET_HTML} from '../site/src/telegram-scalper-widget.mjs';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const sample={id:'s1',normalized_json:JSON.stringify({action:'OPEN',symbol:'XAUUSD',side:'BUY',order:{reference_price:4077,stop_loss:4065,take_profits:[4085,4090,4100]}}),received_at:'2026-11-11 10:00:00'};
const env={DB:{prepare(sql){return {bind(){return this},async first(){return {total:120,active:117,suspended:3}},async all(){if(sql.includes('FROM received_signals'))return {results:[sample]};if(sql.includes('FROM telegram_star_orders'))return {results:Array.from({length:4},(_,i)=>({id:'tso_'+String(i).padStart(32,'a'),plan:'quarterly',stars:2350,status:'paid'}))};return {results:[]}}}}}};
const h={plans:STAR_PLANS,price:starPrice,licenseRecord:async()=>({status:'active',expires_at:'2027-01-01'})};
const user={id:'u1',telegram_id:'123',role:'admin',status:'active',plan:'trial'};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
const errors=[];
try{
 await mkdir('artifacts/telegram-workspace',{recursive:true});
 for(const width of [320,390,600]){
  const page=await browser.newPage({viewport:{width,height:700},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(String(e)));
  for(const language of LOCALES){
  for(const name of [...new Set(['home','account','licenses','shop','setup','language','terms','terms:1','terms:2','support','webhooks','history:0','signal:0','orders:0','admin',...onboardingPages])]){
   const data=widgetViewData(onboardingView(name,language,'not_member')||{...localizeWorkspace(await workspaceView(env,{...h,language,terms:licenseTerms(language)},user,name),language),language});
   const stub='<script>window.TelegramWidget={chatData:'+JSON.stringify(data).replace(/</g,'\\u003c')+',onEvent(){},ready(){},request(){return Promise.resolve({result:"{}"})},copyText(){},openLink(){}};<\/script>';
   await page.setContent(stub+BOT_WORKSPACE_WIDGET_HTML);
   const bounds=await page.locator('.shell').boundingBox();
   assert.ok(bounds.height<=560,language+' '+name+' at '+width+'px height='+bounds.height);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' horizontal overflow');
   if(width===390&&language==='fa')await page.screenshot({path:'artifacts/telegram-workspace/'+name.replace(':','-')+'.png',fullPage:true});
  }
  const state=signalHistoryWidgetData(sample),stub='<script>window.TelegramWidget={chatData:'+JSON.stringify(state)+',onEvent(){},ready(){},request(){return Promise.resolve({result:"{}"})},copyText(){}};<\/script>';
  for(const [name,html] of [['signal-card',SIGNAL_HISTORY_WIDGET_HTML],['member-card',SIGNAL_BRIDGE_WIDGET_HTML],['scalper-card',SCALPER_WIDGET_HTML]]){
   await page.setContent(stub+localizePrivateWidget(html,language));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),language+' '+name+' horizontal overflow');
  }
  await page.setContent(stub+localizePrivateWidget(SIGNAL_HISTORY_WIDGET_HTML,language));assert.ok((await page.locator('.shell').boundingBox()).height<=560);
  if(width===390&&language==='fa')await page.screenshot({path:'artifacts/telegram-workspace/signal-card.png',fullPage:true});
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);console.log('Telegram workspace: all pages fit 320, 390 and 600px in five languages; no browser errors.');
}finally{await browser.close()}
