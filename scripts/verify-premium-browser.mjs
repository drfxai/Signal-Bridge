// Isolated fixtures: profile metadata only; no email, broker or production mutation.
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {default:worker}=await import(process.env.SB_WORKER_BUNDLE||'../site/src/worker.mjs');
const require=createRequire(import.meta.url),{chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const server=createServer(async(req,res)=>{try{const r=await worker.fetch(new Request('http://127.0.0.1:4211'+req.url),{});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}catch{res.writeHead(500);res.end()}});
await new Promise(r=>server.listen(4211,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.DRFX_TEST_CHROMIUM?{executablePath:process.env.DRFX_TEST_CHROMIUM}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const screenshotDir='artifacts/ui-verification/premium';await mkdir(screenshotDir,{recursive:true});const errors=[];
try{
 for(const [surface,width,height,locale,role,hostWidth] of [['site',1440,1000,'en','admin'],['site',360,800,'fa','user'],['site',844,390,'en','user'],['mini',390,844,'fa','user'],['mini',1280,900,'en','admin'],['site',980,900,'en','user',390],['mini',1440,1000,'en','user',720]]){
  if(process.env.PREMIUM_CASE&&process.env.PREMIUM_CASE!==surface+'-'+width+'-'+locale)continue;
  if(process.env.PROFILE_SURFACE&&process.env.PROFILE_SURFACE!==surface)continue;
  const label=surface+'-'+width+'-'+locale,page=await browser.newPage({viewport:{width,height}});await page.addInitScript(()=>window.addEventListener('signalbridge-tour-started',()=>document.getElementById('stEnd')?.click()));page.on('pageerror',e=>errors.push(label+': '+e.message));
  await page.addInitScript(({locale,surface})=>{localStorage.setItem('drfx-language',locale);if(surface==='mini')window.Telegram={WebApp:{initData:'TEST-ONLY-INIT-DATA',ready(){},expand(){},setHeaderColor(){},setBackgroundColor(){}}}},{locale,surface});
  await page.route(/^https:\/\//,r=>r.abort());const report={net:150,profit:250,loss:100,signals:7,tp1:3,tp2:2,tp3:0,stops:1,floating:12,since:1700000000,series:[2,-1,3,8,-2,4,5,3,-1,2,8,4,2,3]};const diagnostic={license:'active',terminal_online:true,mt5_mode:'DEMO',mt5_account:{login:'123456',server:'Demo'},capabilities:['timed-test-v2','live-test-v2','test-config-v1'],telemetry:{test_symbol:'XAUUSD',test_lots:.01,equity:12864.57,report,risk:{state:'READY',drawdown_pct:2.1,limit_pct:10}}};let tradeCalls=0;let authenticated=true,logoutCalls=0,telegramLogins=0,failLogout=true;
  const user={id:'profile-test-user',email:'alexandra.morgan+long-account-name@international-trading.example',telegram:'Alexandra Morgan',role,plan:'annual',license_status:'active',created_at:'2026-09-12 08:30:00',activation_code:'TEST-PRIVATE-KEY-MUST-NOT-APPEAR-IN-PROFILE',expires_at:'2027-09-12 08:30:00',mt5_account:null};
  const profile={ok:true,account:{id:user.id,name:'Alexandra Morgan',email:user.email,created_at:user.created_at,role},summary:{active_confirmed:1,bridge_trials:0,purchased_licenses:2,active_incomplete:true},signalbridge:{plan:'annual',kind:'subscription',status:'active',purchased:true,expires_at:user.expires_at,account_login:'12345678'},scalper:{issued_keys:2,purchased_keys:1,telemetry_supported:false,licenses:[{id:'example1',account_login:'12345678',days:90,created_at:user.created_at,purchased:true},{id:'example2',account_login:'87654321',days:30,created_at:user.created_at,purchased:false}]}};
  await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;let data={ok:true},status=200;
   if(path==='/api/connection/test'){tradeCalls++;throw Error('Unexpected trade submission during UI verification')}
   if(path==='/api/auth/telegram/webapp'){telegramLogins++;authenticated=true}
   else if(path==='/api/auth/logout'){logoutCalls++;if(failLogout){status=503;data={ok:false,error:'SERVICE_UNAVAILABLE'};failLogout=false}else authenticated=false}
   else if(['/api/me','/api/account'].includes(path)){if(!authenticated){status=401;data={ok:false,error:'UNAUTHENTICATED'}}else data=path==='/api/me'?{ok:true,user}:profile}
   else if(path==='/api/config')data={ok:true,email:true,telegram:true,payments:true,licensing:true};
   else if(path==='/api/connection/check')data={ok:true,diagnostic};
   else if(path==='/api/member/settings')data={ok:true,settings:{policy:{tp1:'BE',tp2:'CLOSE',tp3:'OFF',partial_percent:50,be_buffer_points:0},default_lots:.01}};
   else if(path==='/api/member/report')data={ok:true,diagnostic,commands:[{id:'cmd_a',symbol:'XAUUSD',side:'BUY',source_type:'tradingview',status:'FILLED',lots:.01,entry:2671.2,sl:2667,tp1:2675,tp2:2679,created_at:'2026-11-07 10:24:18',updated_at:'2026-11-07 10:24:21'},{id:'cmd_b',symbol:'EURUSD',side:'SELL',source_type:'telegram',status:'DELIVERED',created_at:'2026-11-07 10:00:00'},{id:'cmd_c',symbol:'GOLD',source_type:'test',status:'REJECTED',last_error:'No quote'}],review:[{reason:'Ambiguous entry'}],events:[],outbox:[]};
   else if(path==='/api/scalper')data={ok:true,keys:[],orders:[]};
   else if(path==='/api/channels')data={ok:true,telegram_linked:true,chats:[]};
   else if(path==='/api/webhook')data={ok:true,webhook:{exists:false}};
   await route.fulfill({status,json:data});
  });
  await page.goto('http://127.0.0.1:4211'+(surface==='site'?'/':'/telegram'),{waitUntil:'networkidle'});
  if(surface==='site')await page.evaluate(async()=>{await refreshProfile();show('portalOverlay')});
  if(hostWidth)await page.addStyleTag({content:(surface==='site'?'#portalOverlay .portal-content':'#panel-home')+'{width:'+hostWidth+'px!important;max-width:'+hostWidth+'px!important}'});
  await page.waitForFunction(()=>!['—',''].includes(document.getElementById('ppNet').textContent));
  await page.evaluate(()=>document.querySelector('.sb-top nav [data-sb-tab=overview]').click());
  await page.waitForFunction(()=>document.getElementById('ppOverviewChart').querySelector('svg'));
  const navigate=async tab=>page.evaluate(tab=>document.querySelector('.sb-top nav [data-sb-tab='+tab+']').click(),tab);
  for(const tab of ['overview','analytics','signals']){
   await navigate(tab);await page.waitForTimeout(120);
   assert.equal(await page.locator('[data-pp-view='+tab+']').isVisible(),true);
   if(width<=900||hostWidth){const nav=await page.locator('.sb-mobile-tabs').evaluate(e=>({display:getComputedStyle(e).display,columns:getComputedStyle(e).gridTemplateColumns.split(' ').length}));assert.equal(nav.display,'grid');assert.equal(nav.columns,4);}
   assert.ok(await page.locator('#premiumPortal').evaluate(e=>e.scrollWidth<=e.clientWidth+1),label+' '+tab+' overflow');
   await page.screenshot({path:screenshotDir+'/'+label+'-'+tab+'.png',fullPage:surface==='mini'});
  }
  assert.equal(await page.locator('#ppWin').textContent(),'—');assert.equal(await page.locator('#ppExecuted').textContent(),new Intl.NumberFormat(locale).format(1));assert.equal(await page.locator('#ppRejected').textContent(),new Intl.NumberFormat(locale).format(1));
  await page.locator('#ppSearch').fill('EURUSD');assert.equal(await page.locator('[data-pp-signal]').count(),1);await page.locator('#ppSearch').fill('');await page.locator('[data-pp-signal=cmd_a]').click();assert.ok((await page.locator('#ppInspector').textContent()).includes(new Intl.NumberFormat(locale,{minimumFractionDigits:2,maximumFractionDigits:2}).format(2671.2)));assert.ok(!(await page.locator('#ppInspector').innerHTML()).includes('<img'));
  await page.locator('[data-pp-product=scalper]').click();assert.equal(await page.locator('#ppReturn').textContent(),'—');assert.equal(await page.locator('#ppSignalRows [data-pp-signal]').count(),0);await page.locator('[data-pp-product=bridge]').click();
  await page.locator('#ppSetup').click();assert.equal(await page.locator('#memberSetup').isVisible(),true);await navigate('overview');await page.locator('#checkConnectionAction').click();
  await page.locator('#ppTools').evaluate(e=>e.open=true);await page.locator('#startTimedTest').click();await page.locator('#tradeTestConfirm').waitFor({state:'visible'});await page.locator('#cancelTradeTest').click();assert.equal(tradeCalls,0);if(surface==='site'&&width===1440){diagnostic.mt5_mode='LIVE';await page.locator('#startTimedTest').click();await page.locator('#tradeTestConfirm').waitFor({state:'visible'});await page.locator('#confirmTradeTest').click();assert.equal(await page.locator('#tradeTestConfirm').evaluate(e=>e.open),true);assert.equal(tradeCalls,0);await page.locator('#cancelTradeTest').click();diagnostic.mt5_mode='DEMO'}
  await page.close();console.log('PASS '+label+': approved portal views, live values, honest missing metrics, filters, inspector, product isolation, Setup and connection check');
 }
 assert.deepEqual(errors,[]);console.log('PASS: no browser errors.');
}finally{await browser.close();server.close()}
