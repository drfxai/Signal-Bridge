// Isolated fixtures: guided setup only; no email, broker or production mutation.
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {default:worker}=await import(process.env.SB_WORKER_BUNDLE||'../site/src/worker.mjs');
const require=createRequire(import.meta.url),{chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const server=createServer(async(req,res)=>{try{const r=await worker.fetch(new Request('http://127.0.0.1:4211'+req.url),{});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}catch{res.writeHead(500);res.end()}});
await new Promise(r=>server.listen(4211,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.DRFX_TEST_CHROMIUM?{executablePath:process.env.DRFX_TEST_CHROMIUM}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir('/tmp/drfx-tour',{recursive:true});const errors=[];
try{
 for(const [surface,width,height,locale,role] of [['site',390,844,'en','user'],['mini',390,844,'en','user']]){
  if(process.env.PROFILE_SURFACE&&process.env.PROFILE_SURFACE!==surface)continue;
  const label=surface+'-'+width+'-'+locale,page=await browser.newPage({viewport:{width,height},locale:'fa-IR'});page.on('pageerror',e=>errors.push(label+': '+e.message));
  await page.addInitScript(({locale,surface})=>{if(locale!=='en')localStorage.setItem('drfx-language',locale);if(surface==='mini')window.Telegram={WebApp:{initData:'TEST-ONLY-INIT-DATA',ready(){},expand(){},setHeaderColor(){},setBackgroundColor(){}}}},{locale,surface});
  await page.route(/^https:\/\//,r=>r.abort());let verifyCalls=0,tradeCalls=0,linked=true;const settings={policy:{tp1:'BE',tp2:'CLOSE',tp3:'OFF',partial_percent:50,be_buffer_points:0},default_lots:.01,tv_to_mt5:true,tv_to_telegram:true,telegram_to_mt5:true,telegram_verified:false};let authenticated=true,logoutCalls=0,telegramLogins=0,failLogout=true;
  const user={id:'profile-test-user',email:'alexandra.morgan+long-account-name@international-trading.example',telegram:'Alexandra Morgan',role,plan:'annual',license_status:'active',created_at:'2026-09-12 08:30:00',activation_code:'TEST-PRIVATE-KEY-MUST-NOT-APPEAR-IN-PROFILE',expires_at:'2027-09-12 08:30:00',mt5_account:null};
  const profile={ok:true,account:{id:user.id,name:'Alexandra Morgan',email:user.email,created_at:user.created_at,role},summary:{active_confirmed:1,bridge_trials:0,purchased_licenses:2,active_incomplete:true},signalbridge:{plan:'annual',kind:'subscription',status:'active',purchased:true,expires_at:user.expires_at,account_login:'12345678'},scalper:{issued_keys:2,purchased_keys:1,telemetry_supported:false,licenses:[{id:'example1',account_login:'12345678',days:90,created_at:user.created_at,purchased:true},{id:'example2',account_login:'87654321',days:30,created_at:user.created_at,purchased:false}]}};
  await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;let data={ok:true},status=200;
   if(path==='/api/auth/telegram/webapp'){telegramLogins++;authenticated=true}
   else if(path==='/api/auth/logout'){logoutCalls++;if(failLogout){status=503;data={ok:false,error:'SERVICE_UNAVAILABLE'};failLogout=false}else authenticated=false}
   else if(['/api/me','/api/account'].includes(path)){if(!authenticated){status=401;data={ok:false,error:'UNAUTHENTICATED'}}else data=path==='/api/me'?{ok:true,user:{...user,telegram_id:linked?'123456789':null}}:profile}
   else if(path==='/api/config')data={ok:true,email:true,telegram:true,payments:true,licensing:true};
   else if(path==='/api/connection/check')data={ok:true,diagnostic:{license:'active',terminal_online:false,mt5_mode:'UNKNOWN',capabilities:[],telemetry:{}}};
   else if(path==='/api/member/settings'){if(route.request().method()==='POST')Object.assign(settings,route.request().postDataJSON());data={ok:true,settings}}
   else if(path==='/api/member/telegram/verify'){verifyCalls++;assert.equal(route.request().postDataJSON().chat_id,'123456789');settings.telegram_verified=true;settings.tv_to_telegram=false;settings.telegram_to_mt5=false;data={ok:true,settings}}
   else if(path==='/api/connection/test'){tradeCalls++;throw Error('unexpected trade')}
   else if(path==='/api/member/report')data={ok:true,commands:[],review:[],outbox:[]};
   else if(path==='/api/scalper')data={ok:true,keys:[],orders:[]};
   else if(path==='/api/channels')data={ok:true,telegram_linked:true,chats:[]};
   else if(path==='/api/webhook')data={ok:true,webhook:{exists:false}};
   await route.fulfill({status,json:data});
  });
  await page.goto('http://127.0.0.1:4211'+(surface==='site'?'/':'/telegram'),{waitUntil:'networkidle'});
  if(surface==='site')await page.evaluate(async()=>{await refreshProfile();show('portalOverlay')});
  await page.waitForFunction(()=>!document.getElementById('setupTour').hidden&&!document.getElementById('stNext').disabled);await page.locator('#stEnd').click();
  await page.evaluate(()=>document.querySelector('.sb-top nav [data-sb-tab=setup]').click());
  for(const [id,key] of [['setupTvTelegram','tv_to_telegram'],['setupTelegramEnable','telegram_to_mt5']]){
   await page.locator('#'+id).click();await page.waitForFunction(id=>!document.getElementById(id).disabled,id);assert.equal(await page.locator('#'+id).getAttribute('aria-checked'),'false','off must work without Telegram verification');assert.equal(verifyCalls,0);
  }
  await page.locator('#setupTvTelegram').click();await page.waitForFunction(()=>!document.getElementById('setupTvTelegram').disabled);assert.equal(await page.locator('#setupTvTelegram').getAttribute('aria-checked'),'true');assert.equal(verifyCalls,1);
  await page.locator('#setupTelegramEnable').click();await page.waitForFunction(()=>!document.getElementById('setupTelegramEnable').disabled);assert.equal(await page.locator('#setupTelegramEnable').getAttribute('aria-checked'),'true');assert.equal(verifyCalls,1);
  await page.evaluate(()=>document.querySelector('.sb-top nav [data-sb-tab=overview]').click());await page.evaluate(()=>document.querySelector('.sb-top nav [data-sb-tab=setup]').click());await page.waitForTimeout(150);assert.equal(await page.locator('#setupTvTelegram').getAttribute('aria-checked'),'true');assert.equal(await page.locator('#setupTelegramEnable').getAttribute('aria-checked'),'true');
  settings.telegram_verified=false;linked=false;
  await page.locator('#setupTelegramEnable').click();await page.waitForFunction(()=>!document.getElementById('setupTelegramEnable').disabled);assert.equal(await page.locator('#setupTelegramEnable').getAttribute('aria-checked'),'false');await page.locator('#setupTelegramEnable').click();await page.waitForFunction(()=>!document.getElementById('setupTelegramEnable').disabled);assert.equal(await page.locator('#setupTelegramEnable').getAttribute('aria-checked'),'false','unlinked enable must remain off');assert.match(await page.locator('#setupTelegramRouteStatus').textContent(),/Link your Telegram/);
  assert.equal(tradeCalls,0);await page.close();console.log('PASS '+label+': disable unverified, verify own Telegram, enable both, persisted reload, unlinked error');
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();server.close()}
