import {createServer} from 'node:http';
import {mkdir} from 'node:fs/promises';
const {default:handler}=await import(process.env.SB_WORKER_BUNDLE||'../site/src/worker.mjs');
import {chromium} from 'playwright';
const server=createServer(async(req,res)=>{try{const r=await handler.fetch(new Request('http://127.0.0.1:4199'+req.url),{});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}catch{res.writeHead(500);res.end()}});
await new Promise(r=>server.listen(4199,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const dir='artifacts/ui-verification';await mkdir(dir,{recursive:true});
const user={id:'preview-user',email:'preview@example.test',role:'user',plan:'trial',license_status:'active',expires_at:'2099-01-01 00:00:00',activated_at:'2026-10-29 00:00:00',mt5_account:{login:'DEMO PREVIEW',server:'Preview broker'},activation_code:'',indicator_delivery_ready:false};
const errors=[];
for(const [label,url,width,height] of [['website-desktop','/',1440,1000],['website-wide','/',1920,1080],['website-small-phone','/',360,800],['website-tablet','/',820,1180],['website-mobile','/',390,844],['telegram-mobile','/telegram',390,844],['telegram-tablet','/telegram',820,1180],['telegram-desktop','/telegram',1440,1000],['website-live','/',390,844],['telegram-live','/telegram',390,844],['website-risk-hit','/',390,844],['telegram-risk-hit','/telegram',390,844]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(label+': '+e.message));
 let testRequested=0,riskResetRequested=0,riskHit=label.includes('risk-hit'),reportResets=0;
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  let data={ok:true};
  if(path==='/api/me')data={ok:true,user};
  if(path==='/api/config')data={ok:true,email:true,telegram:true,licensing:true,payments:false};
  if(path==='/api/connection/check')data={ok:true,diagnostic:{license:'active',capabilities:['timed-test-v2','live-test-v2','test-config-v1','risk-v1','reports-v1','exit-policy-v1'],expires_at:'2099-01-01 00:00:00',mt5_mode:label.includes('live')?'LIVE':'DEMO',mt5_account:{login:'PREVIEW',server:'TEST'},telemetry:{report:{signals:reportResets?0:128,tp1:reportResets?0:34,tp2:reportResets?0:22,tp3:0,stops:reportResets?0:9,profit:reportResets?0:240,loss:reportResets?0:-84,net:reportResets?0:156,floating:0,since:Math.floor(Date.now()/1000)-3600,series:[2,3,-2,1,6,-2,4]},equity:1000,test_symbol:'EURUSD.p',test_lots:0.01,risk:{state:riskHit?'HIT':'READY',hit_id:'12345',drawdown_pct:riskHit?10:0,limit_pct:10,daily_profit:riskHit?-100:20,signals:42,targets:3,stops:1}},live_snapshot_available:true,live_socket_verified:true,terminal_online:true}};
  if(path==='/api/member/settings')data={ok:true,settings:{policy:{tp1:'BE',tp2:'CLOSE',tp3:'OFF',partial_percent:50,be_buffer_points:0},default_lots:0.01,telegram_chat_id:'DEMO',telegram_verified:false,tv_to_telegram:false,telegram_to_mt5:false}};
  if(path==='/api/member/report')data={ok:true,commands:Array.from({length:12},(_,i)=>({id:'preview-'+i,source_type:i%2?'telegram':'tradingview',symbol:'XAUUSD.p',side:i%3?'BUY':'SELL',lots:0.01,status:['FILLED','DELIVERED','PREVIEWED','REJECTED'][i%4],last_error:i%4===3?'Review · example fixture':'',created_at:'2026-10-29 12:00:00'})),review:[],outbox:[]};
  if(path==='/api/member/report/reset'){reportResets++;data={ok:true,status:'AWAITING_EA'};}
  if(path==='/api/webhook'||path==='/api/webhook/mode')data={ok:true,webhook:{exists:true,webhook_url:'https://example.test/PREVIEW-NOT-A-CREDENTIAL',mode:'dry_run',received:0}};
  if(path==='/api/risk/reset'){riskResetRequested++;riskHit=false;data={ok:true,status:'AWAITING_EA'};}
  if(path==='/api/connection/test'){testRequested++;data={ok:true,test_id:'preview-test',command_id:'preview-command',status:'DELIVERED'}};
  if(path==='/api/connection/test-status')data={ok:true,test:{id:'preview-test',status:'CLOSED',detail:'UI preview only · no broker order',command_status:'FILLED'}};
  await route.fulfill({json:data});
 });
 await page.route(/^https:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
 await page.goto('http://127.0.0.1:4199'+url,{waitUntil:'networkidle'});
 if(['website-desktop','website-tablet','website-mobile'].includes(label)){
  await page.locator('#preloader').waitFor({state:'hidden'});
  await page.evaluate(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=innerHeight*.8){scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,90))}scrollTo({top:0,behavior:'instant'})});
  await page.waitForFunction(()=>[...document.querySelectorAll('.sx-reveal.sx-in,.reveal-cinema.active')].every(e=>Number(getComputedStyle(e).opacity)>.99));
  const badgeBox=await page.locator('.drfx-gallery-badge').boundingBox();
  if(!badgeBox||badgeBox.height>40||badgeBox.width>300)throw Error('Showcase badge must stay compact');
  const headBox=await page.locator('.drfx-gallery-head').boundingBox();
  const gridBox=await page.locator('.drfx-gallery-grid').boundingBox();
  if(headBox.y+headBox.height>gridBox.y+1)throw Error('Showcase heading overlaps previews');
  await page.locator('#product-gallery').screenshot({path:dir+'/'+label+'-showcase.png'});
  await page.locator('#plans').screenshot({path:dir+'/'+label+'-membership.png'});
  await page.evaluate(()=>document.querySelector('#suite').scrollIntoView({block:'center',behavior:'instant'}));
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  if(label==='website-desktop'){
   const card=page.locator('.sx-product').first(),box=await card.boundingBox();
   await page.mouse.move(box.x+box.width*.8,box.y+box.height*.3);
   await page.waitForFunction(()=>document.querySelector('.sx-product').classList.contains('sx-pointer-active'));
   await page.waitForTimeout(300);
   if(!await card.evaluate(e=>getComputedStyle(e).transform.startsWith('matrix3d(')))throw Error('Reveal style overrides product 3D tilt');
   if(await card.evaluate(e=>getComputedStyle(e,':before').opacity)!=='1')throw Error('Pointer spotlight is hidden');
   await page.locator('#suite').screenshot({path:dir+'/'+label+'-suite-hover.png'});
   await page.mouse.move(0,0);await page.waitForTimeout(300);
   if(await card.evaluate(e=>e.classList.contains('sx-pointer-active')||e.style.getPropertyValue('--rx')!=='0deg'))throw Error('Tilt does not reset');
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.waitForFunction(()=>getComputedStyle(document.querySelector('.sx-product')).transform==='none');
   await page.emulateMedia({reducedMotion:'no-preference'});
  }
  await page.locator('#suite').screenshot({path:dir+'/'+label+'-suite.png'});
  if(await page.locator('.sx-flow').evaluate(e=>getComputedStyle(e,':before').content)!=='none')throw Error('Installation line still crosses cards');
  await page.locator('.sx-flow').screenshot({path:dir+'/'+label+'-install-steps.png'});

  await page.screenshot({path:dir+'/'+label+'-landing.png',fullPage:true});
 }
 if(url==='/')await page.evaluate(async()=>{await refreshProfile();show('portalOverlay')});
 await page.locator('#startTimedTest').scrollIntoViewIfNeeded();
 await page.locator('#checkConnectionAction').click();await page.waitForFunction(()=>document.getElementById('reportSignals').textContent==='128');await page.locator('#exitTP1').waitFor({state:'attached'});await page.evaluate(()=>{const portal=document.querySelector('.portal-content');if(portal)portal.scrollTop=0;const shell=document.querySelector('.portal');if(shell)shell.scrollTop=0;const overlay=document.getElementById('portalOverlay');if(overlay)overlay.scrollTop=0;window.scrollTo(0,0)});await page.screenshot({path:dir+'/'+label+'.png',fullPage:url!=='/'});

 // Verify focused tabs, real CSS sizing and accessible touch inputs at every breakpoint.
 if(await page.locator('.sb-policy').isVisible()||await page.locator('.sb-routes').isVisible())throw Error('Overview contains setup panels');
 if(width>700&&url==='/'){
  const box=await page.locator('#portalOverlay .portal').boundingBox();
  if(box.width>1231||box.width>=width)throw Error('Desktop workspace is not constrained');
 }
 if(width<=700){
  const box=await page.locator('.sb-kpis').boundingBox();if(box.height>330)throw Error('Mobile KPI stack too tall');
  if(await page.locator('.sb-stream').isVisible())throw Error('Mobile overview contains signal history');
 }
 const nav=width<=700?'.sb-mobile-tabs':'.sb-top nav';
 for(const tab of ['signals','routes','settings']){
  await page.locator(nav+' [data-sb-tab='+tab+']').click();
  const target={signals:'.sb-stream',routes:'.sb-routes',settings:'.sb-policy'}[tab];
  if(!await page.locator(target).isVisible())throw Error('Tab not reachable: '+tab);
  if(tab==='settings'&&await page.locator('.sb-account-group').count()&&await page.locator('.sb-account-group').first().getAttribute('open')!==null)throw Error('Account setup should start collapsed');
  if(width<=700&&tab==='signals'){await page.locator('#signalRows td[data-label=Status]').first().waitFor();if(await page.locator('.sb-table-scroll table').evaluate(e=>getComputedStyle(e).display)!=='block')throw Error('Mobile history must use readable cards');if(await page.locator('#signalRows tr').count()!==8)throw Error('Mobile history should start with eight signals');await page.locator('#moreSignalHistory').click();if(await page.locator('#signalRows tr').count()!==12)throw Error('Older signals are not reachable');}
  if(await page.locator(nav+' [data-sb-tab='+tab+']').getAttribute('aria-pressed')!=='true')throw Error('Tab state not accessible');
  if(width<=700&&tab==='routes'){
   const font=await page.locator('#signalPreviewText').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));if(font<16)throw Error('Mobile input would auto-zoom');
  }
  await page.waitForFunction(()=>[...document.querySelectorAll('.sb-grid > .sb-card')].every(e=>!e.getClientRects().length||Number(getComputedStyle(e).opacity)>.99));
  await page.screenshot({path:dir+'/'+label+'-'+tab+'.png',fullPage:url!=='/'});
 }
 await page.locator(nav+' [data-sb-tab=overview]').click();
 await page.evaluate(()=>{const p=document.querySelector('.portal-content');if(p)p.scrollTop=0;window.scrollTo(0,0)});
 if(!await page.locator('#startTimedTest').isVisible())throw Error('Test control not visible');
 // Cancellation must not call the trade endpoint.
 if(await page.locator('.sb-actions button').count()!==2)throw Error('Expected exactly two test actions');
 await page.locator('#checkConnectionAction').click();await page.waitForFunction(()=>document.getElementById('dailySignals').textContent==='42');if(testRequested!==0)throw Error('Read-only check traded');
 if(label.includes('risk-hit')){
  await page.locator('#resetDailyRisk').scrollIntoViewIfNeeded();
  if(!await page.locator('#dailyRiskPanel').evaluate(e=>e.classList.contains('hit')))throw Error('Missing red risk HIT');
  await page.screenshot({path:dir+'/'+label+'-red.png'});
  await page.locator('#startTimedTest').click();if(testRequested!==0)throw Error('HIT dispatched a test');
  page.once('dialog',d=>d.dismiss());await page.locator('#resetDailyRisk').click();if(riskResetRequested!==0)throw Error('Cancel reset sent a control');
  page.once('dialog',d=>d.accept());await page.locator('#resetDailyRisk').click();
  await page.waitForFunction(()=>document.getElementById('resetDailyRisk').textContent.includes('READY'));
  if(riskResetRequested!==1||testRequested!==0)throw Error('Wrong reset/order count');
  await page.screenshot({path:dir+'/'+label+'-green.png'});console.log(JSON.stringify({label,riskResetRequested,testRequested}));await page.close();continue;
 }
 if(!await page.locator('#testOrderSummary').textContent().then(t=>t.includes('EURUSD.p')))throw Error('Configured symbol not displayed');
 await page.locator('#startTimedTest').click();await page.locator('#tradeTestConfirm[open]').waitFor();
 await page.locator('#cancelTradeTest').click();if(testRequested!==0)throw Error('cancel dispatched order');
 await page.locator('#startTimedTest').click();await page.locator('#tradeTestConfirm[open]').waitFor();
 if(label.includes('live')){await page.locator('#confirmTradeTest').click();if(testRequested!==0)throw Error('Unconfirmed live order');await page.locator('#liveConfirmInput').fill('LIVE');}
 await page.screenshot({path:dir+'/'+label+'-confirmation.png'});
 await page.locator('#confirmTradeTest').click();
 await page.waitForFunction(()=>document.getElementById('executionFeedback').textContent.includes('CLOSED'));
 if(testRequested!==1)throw Error('wrong number of test requests');
 page.once('dialog',d=>d.dismiss());await page.locator('#resetReport').click();if(reportResets!==0)throw Error('Cancelled report reset posted');const resetResponse=page.waitForResponse(r=>new URL(r.url()).pathname==='/api/member/report/reset');page.once('dialog',d=>d.accept());await page.locator('#resetReport').click();await resetResponse;if(reportResets!==1)throw Error('Report reset not requested');if(riskResetRequested!==0)throw Error('Report reset touched drawdown');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 if(overflow)throw Error(label+' has horizontal overflow');
 console.log(JSON.stringify({label,testRequested,overflow,feedback:await page.locator('#executionFeedback').textContent()}));
 await page.close();
}

// Email and Telegram sign-in, including short landscape and RTL layouts.
for(const [label,width,height,rtl] of [['phone',390,844,false],['small-phone',360,740,false],['tablet',820,1180,false],['desktop',1440,1000,false],['landscape',844,390,false],['rtl-phone',390,844,true]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(label+': '+e.message));
 await page.route('**/api/**',r=>r.fulfill({json:{ok:true,email:false,telegram:true,licensing:true,payments:false,bot_token_valid:true,bot_username:'PreviewDrfxBot'}}));
 await page.route(/^https:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
 await page.goto('http://127.0.0.1:4199/',{waitUntil:'networkidle'});
 await page.evaluate(rtl=>{document.documentElement.dir=rtl?'rtl':'ltr';document.body.dir=rtl?'rtl':'ltr';show('authOverlay')},rtl);
 for(const tab of ['email','telegram']){
  await page.locator('#authOverlay [data-tab='+tab+']').click();
  const dialog=page.locator('#authOverlay .dialog'),box=await dialog.boundingBox();
  if(box.width>441||box.x<0||box.y<0||box.y+box.height>height+1)throw Error('Sign-in dialog outside viewport '+label);
  const input=page.locator(tab==='email'?'#email':'#tgCode');
  if(await input.evaluate(e=>parseFloat(getComputedStyle(e).fontSize))<16)throw Error('Unreadable sign-in input');
  await input.fill(tab==='email'?'preview@example.test':'x'.repeat(32));
  const button=page.locator(tab==='email'?'#verifyEmail':'#loginTelegram');await button.scrollIntoViewIfNeeded();
  if(!await button.isVisible())throw Error('Sign-in action inaccessible');
  await dialog.evaluate(e=>e.scrollTop=0);await page.screenshot({path:dir+'/signin-'+label+'-'+tab+'.png'});
  if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw Error('Sign-in page overflow');
 }
 await page.close();console.log(JSON.stringify({label:'signin-'+label,ok:true}));
}
await browser.close();server.close();if(errors.length)throw Error(errors.join('\n'));
