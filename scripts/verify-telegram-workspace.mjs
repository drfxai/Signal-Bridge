import {onboardingView,onboardingPages,localizeWorkspace} from '../site/src/telegram-onboarding.mjs';
import {createRequire} from 'node:module';
import {mkdir,readFile} from 'node:fs/promises';
import siteWorker from '../site/src/worker.mjs';
import assert from 'node:assert/strict';
import {BOT_WORKSPACE_WIDGET_HTML,workspaceView,widgetViewData} from '../site/src/telegram-workspace.mjs';
import {SIGNAL_HISTORY_WIDGET_HTML,signalHistoryWidgetData} from '../site/src/telegram-signal-widget.mjs';
import {STAR_PLANS,starPrice,LICENSE_TERMS} from '../site/src/telegram-commerce.mjs';
import {LOCALES} from '../site/src/i18n.mjs';
import {SIGNAL_BRIDGE_WIDGET_HTML,bridgeWidgetData} from '../site/src/telegram-widgets.mjs';
import {SCALPER_WIDGET_HTML,scalperWidgetData} from '../site/src/telegram-scalper-widget.mjs';
import {localizeNativeWidget} from '../site/src/telegram-widget-i18n.mjs';
const require=createRequire(import.meta.url),{chromium}=require('playwright');
const sample={id:'s1',normalized_json:JSON.stringify({action:'OPEN',symbol:'XAUUSD',side:'BUY',order:{reference_price:4077,stop_loss:4065,take_profits:[4085,4090,4100]}}),received_at:'2026-11-11 10:00:00'};
const env={DB:{prepare(sql){return {bind(){return this},async first(){return {total:120,active:117,suspended:3}},async all(){if(sql.includes('FROM received_signals'))return {results:[sample]};if(sql.includes('FROM telegram_star_orders'))return {results:Array.from({length:4},(_,i)=>({id:'tso_'+String(i).padStart(32,'a'),plan:'quarterly',stars:2350,status:'paid'}))};return {results:[]}}}}}};
const h={plans:STAR_PLANS,price:starPrice,terms:LICENSE_TERMS,licenseRecord:async()=>({status:'active',expires_at:'2027-01-01'})};
const user={id:'u1',telegram_id:'123',role:'admin',status:'active',plan:'trial'};
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
const errors=[];
try{
 await mkdir('artifacts/telegram-workspace',{recursive:true});
 for(const width of [320,390,600]){
  const page=await browser.newPage({viewport:{width,height:700},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(String(e)));
  for(const name of [...new Set(['home','account','licenses','shop','setup','language','terms','support','history:0','signal:0','orders:0','admin',...onboardingPages])]){
   const data=widgetViewData(onboardingView(name,'fa','not_member')||localizeWorkspace(await workspaceView(env,h,user,name),'fa'));
   const stub='<script>window.TelegramWidget={chatData:'+JSON.stringify(data).replace(/</g,'\\u003c')+',onEvent(){},ready(){},request(){return Promise.resolve({result:"{}"})},copyText(){},openLink(){}};<\/script>';
   await page.setContent(stub+BOT_WORKSPACE_WIDGET_HTML);
   const bounds=await page.locator('.shell').boundingBox();
   assert.ok(bounds.height<=560,name+' at '+width+'px height='+bounds.height);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),name+' horizontal overflow');
   if(width===390)await page.screenshot({path:'artifacts/telegram-workspace/'+name.replace(':','-')+'.png',fullPage:true});
  }
  const state=signalHistoryWidgetData(sample),stub='<script>window.TelegramWidget={chatData:'+JSON.stringify(state)+',onEvent(){},ready(){},request(){return Promise.resolve({result:"{}"})},copyText(){}};<\/script>';
  await page.setContent(stub+SIGNAL_HISTORY_WIDGET_HTML);assert.ok((await page.locator('.shell').boundingBox()).height<=560);
  if(width===390)await page.screenshot({path:'artifacts/telegram-workspace/signal-card.png',fullPage:true});
  await page.close();
 }

 const startArt=await readFile('site/public/media/signal-bridge/premium-card.jpg');
 for(const width of [320,390,600,1280]){
  const page=await browser.newPage({viewport:{width,height:750}});
  page.on('pageerror',e=>errors.push(width+'px Mini App: '+String(e)));
  await page.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url()),path=url.pathname;
   if(url.hostname==='telegram.org')return route.fulfill({contentType:'application/javascript',body:
    'window.Telegram={WebApp:{initData:"test-data",openInvoice(url,cb){window.invoice=url;cb("paid")}}}'});
   if(path==='/api/config')return route.fulfill({json:{ok:true,telegram:true}});
   if(path==='/api/me')return route.fulfill({json:{ok:true,user:{id:'u1',telegram_id:'123',role:'user',telegram:'Demo',plan:'trial',license_status:'active',activation_code:'test-code'}}});
   if(path==='/api/telegram/scalper/trial')return route.fulfill({json:{ok:true,account_login:'12345678',key:'test-trial'}});
   if(path==='/api/telegram/store/invoice'){
    assert.equal(req.postDataJSON().plan,'scalper_1y');
    assert.equal(req.postDataJSON().account_login,'12345678');
    return route.fulfill({json:{ok:true,url:'https://t.me/$test_invoice'}});
   }
   if(path.startsWith('/api/')&&path!=='/api/telegram/store')return route.fulfill({json:{ok:true}});
   if(path==='/media/signal-bridge/premium-card.jpg')return route.fulfill({body:startArt,contentType:'image/jpeg'});
   if(path.startsWith('/media/'))return route.fulfill({status:404});
   const response=await siteWorker.fetch(new Request(req.url()),{...env,TELEGRAM_STAR_PRICES:'{"semiannual":5000,"scalper_1y":6000}'});
   return route.fulfill({body:Buffer.from(await response.arrayBuffer()),status:response.status,headers:Object.fromEntries(response.headers)});
  });
  await page.goto('https://drfx.company/telegram');
  await page.waitForFunction(()=>document.querySelector('.start-art').naturalWidth>0);
  assert.equal(await page.locator('.start-art').evaluate(img=>getComputedStyle(img).objectFit),'contain');
  await page.getByRole('button',{name:'Start',exact:true}).click();
  await page.locator('[data-start-language='+ (width===390?'fa':'en') +']').click();
  assert.equal(await page.locator('html').getAttribute('dir'),width===390?'rtl':'ltr');
  for(const view of ['downloads','license','trial','plans']){
   await page.locator('[data-panel=menu] [data-jump='+view+']').click();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),view+' overflow at '+width+'px');
   if(view==='downloads')assert.equal(await page.locator('[data-panel=downloads] a').count(),2);
   if(view==='license')assert.equal(await page.locator('#setupSteps li').count(),5);
   if(view==='trial'){
    await page.waitForFunction(()=>document.querySelector('#connection').classList.contains('verified'));
    await page.locator('#trialBridgeReveal').click();
    assert.equal(await page.locator('#trialBridgeCode').innerText(),'test-code');
    await page.locator('#trialScalperLogin').fill('12345678');
    await page.locator('#trialScalperForm button').click();
    await page.locator('#trialScalperCode').waitFor();
    assert.equal(await page.locator('#trialScalperCode').innerText(),'test-trial');
   }
   if(view==='plans'){
    await page.locator('#starPlans button').last().click();
    assert.equal(await page.locator('#starPlans button').count(),5);
    await page.locator('#starMt5').fill('12345678');
    await page.locator('#starAccepted').check();
    await page.locator('#starCheckout button').click();
    await page.waitForFunction(()=>window.invoice==='https://t.me/$test_invoice');
   }
   await page.locator('#startBack').click();
  }
  if(width===390){
   await mkdir('artifacts/ui-verification',{recursive:true});
   await page.screenshot({path:'artifacts/ui-verification/telegram-mini-menu.png',fullPage:true});
  }
  await page.close();
 }

 const cards=[
  ['signal',SIGNAL_HISTORY_WIDGET_HTML,signalHistoryWidgetData(sample)],
  ['bridge',SIGNAL_BRIDGE_WIDGET_HTML,bridgeWidgetData({plan:'trial',licenseStatus:'active',accountStatus:'active'})],
  ['scalper',SCALPER_WIDGET_HTML,scalperWidgetData(null)]
 ];
 for(const width of [320,390,600]){
  const page=await browser.newPage({viewport:{width,height:700},deviceScaleFactor:1});
  page.on('pageerror',e=>errors.push(width+': '+String(e)));
  for(const locale of LOCALES){
   for(const [kind,html,data] of cards){
    const stub='<script>window.TelegramWidget={chatData:'+JSON.stringify(data).replace(/</g,'\\u003c')+',onEvent(){},ready(){},request(){return Promise.resolve({result:"{}"})},copyText(){},openLink(){}};<\/script>';
    await page.setContent(stub+localizeNativeWidget(html,locale,kind));
    const label=kind+' '+locale+' at '+width+'px';
    const bounds=await page.locator('.shell').boundingBox();
    assert.ok(bounds,label+' widget hidden');
    if(kind==='signal')assert.ok(bounds.height<=560,label+' exceeds Telegram height');
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' horizontal overflow');
    if(kind==='signal'&&width===320)await page.screenshot({path:'artifacts/telegram-workspace/signal-'+locale+'-320.png',fullPage:true});
   }
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);console.log('Telegram workspace: all pages fit 320, 390 and 600px; no browser errors.');
}finally{await browser.close()}
