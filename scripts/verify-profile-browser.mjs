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
await mkdir('/tmp/drfx-profile/screenshots',{recursive:true});const errors=[];
try{
 for(const [surface,width,height,locale,role] of [['site',1440,1000,'en','admin'],['site',360,800,'fa','user'],['site',844,390,'en','user'],['mini',390,844,'fa','user'],['mini',1280,900,'en','admin']]){
  if(process.env.PROFILE_SURFACE&&process.env.PROFILE_SURFACE!==surface)continue;
  const label=surface+'-'+width+'-'+locale,page=await browser.newPage({viewport:{width,height}});await page.addInitScript(()=>window.addEventListener('signalbridge-tour-started',()=>document.getElementById('stEnd')?.click()));page.on('pageerror',e=>errors.push(label+': '+e.message));
  await page.addInitScript(({locale,surface})=>{localStorage.setItem('drfx-language',locale);if(surface==='mini')window.Telegram={WebApp:{initData:'TEST-ONLY-INIT-DATA',ready(){},expand(){},setHeaderColor(){},setBackgroundColor(){}}}},{locale,surface});
  await page.route(/^https:\/\//,r=>r.abort());let authenticated=true,logoutCalls=0,telegramLogins=0,failLogout=true;
  const user={id:'profile-test-user',email:'alexandra.morgan+long-account-name@international-trading.example',telegram:'Alexandra Morgan',role,plan:'annual',license_status:'active',created_at:'2026-09-12 08:30:00',activation_code:'TEST-PRIVATE-KEY-MUST-NOT-APPEAR-IN-PROFILE',expires_at:'2027-09-12 08:30:00',mt5_account:null};
  const profile={ok:true,account:{id:user.id,name:'Alexandra Morgan',email:user.email,created_at:user.created_at,role},summary:{active_confirmed:1,bridge_trials:0,purchased_licenses:2,active_incomplete:true},signalbridge:{plan:'annual',kind:'subscription',status:'active',purchased:true,expires_at:user.expires_at,account_login:'12345678'},scalper:{issued_keys:2,purchased_keys:1,telemetry_supported:false,licenses:[{id:'example1',account_login:'12345678',days:90,created_at:user.created_at,purchased:true},{id:'example2',account_login:'87654321',days:30,created_at:user.created_at,purchased:false}]}};
  await page.route('**/api/**',async route=>{const path=new URL(route.request().url()).pathname;let data={ok:true},status=200;
   if(path==='/api/auth/telegram/webapp'){telegramLogins++;authenticated=true}
   else if(path==='/api/auth/logout'){logoutCalls++;if(failLogout){status=503;data={ok:false,error:'SERVICE_UNAVAILABLE'};failLogout=false}else authenticated=false}
   else if(['/api/me','/api/account'].includes(path)){if(!authenticated){status=401;data={ok:false,error:'UNAUTHENTICATED'}}else data=path==='/api/me'?{ok:true,user}:profile}
   else if(path==='/api/config')data={ok:true,email:true,telegram:true,payments:true,licensing:true};
   else if(path==='/api/connection/check')data={ok:true,diagnostic:{license:'active',terminal_online:false,mt5_mode:'UNKNOWN',capabilities:[],telemetry:{}}};
   else if(path==='/api/member/settings')data={ok:true,settings:{policy:{tp1:'BE',tp2:'CLOSE',tp3:'OFF',partial_percent:50,be_buffer_points:0},default_lots:.01}};
   else if(path==='/api/member/report')data={ok:true,commands:[],review:[],outbox:[]};
   else if(path==='/api/scalper')data={ok:true,keys:[],orders:[]};
   else if(path==='/api/channels')data={ok:true,telegram_linked:true,chats:[]};
   else if(path==='/api/webhook')data={ok:true,webhook:{exists:false}};
   await route.fulfill({status,json:data});
  });
  await page.goto('http://127.0.0.1:4211'+(surface==='site'?'/':'/telegram'),{waitUntil:'networkidle'});
  if(surface==='site')await page.evaluate(async()=>{await refreshProfile();show('portalOverlay')});
  await page.locator('#refAccount').waitFor({state:'visible'});await page.screenshot({path:'/tmp/drfx-profile/screenshots/'+label+'-header.png'});
  const header=await page.locator('.sb-top').evaluate(e=>e.scrollWidth<=e.clientWidth+1);assert.ok(header,label+' header overflow');
  if(surface==='site'&&role==='admin')assert.equal(await page.locator('#siteAdminOpen').isVisible(),true);
  await page.locator('#refAccount').click();await page.waitForFunction(()=>document.getElementById('profileName').textContent==='Alexandra Morgan');
  assert.equal(await page.locator('#profileEmail').textContent(),user.email);assert.ok((await page.locator('#profileJoined').textContent()).length>5);assert.equal(await page.locator('.pf-key-row').count(),2);assert.equal(await page.locator('#profileActive').textContent(),new Intl.NumberFormat(locale).format(1));assert.ok(!(await page.locator('#profilePanel').textContent()).includes(user.activation_code));
  await page.locator('#profilePanel').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));
  const box=await page.locator('#profilePanel').boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=width+1&&box.y+box.height<=height+1,label+' panel bounds');assert.ok(await page.locator('#profilePanel').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert.equal(await page.locator('#profileSignOut').isVisible(),true);
  await page.locator('#profilePanel').screenshot({path:'/tmp/drfx-profile/screenshots/'+label+'-profile.png'});
  await page.locator('#profileManage').click();assert.equal(await page.locator('#profilePanel').evaluate(e=>e.open),false);assert.equal(await page.locator('#memberSetup').isVisible(),true);
  await page.locator('#refAccount').click();await page.waitForFunction(()=>document.getElementById('profileName').textContent==='Alexandra Morgan');await page.keyboard.press('Escape');assert.equal(await page.locator('#profilePanel').evaluate(e=>e.open),false);
  await page.locator('#refAccount').click();await page.locator('#profileSignOut').click();await page.waitForFunction(()=>document.getElementById('profileNotice').dataset.error==='true');assert.equal(await page.locator('#profilePanel').evaluate(e=>e.open),true);assert.equal(authenticated,true);assert.equal(await page.locator('#profileSignOut').isEnabled(),true);
  await page.locator('#profileSignOut').click();await page.waitForFunction(()=>!document.getElementById('profilePanel').open);assert.equal(authenticated,false);assert.equal(logoutCalls,2);assert.equal(await page.locator('#profileEmail').textContent(),'—');
  if(surface==='site'){assert.equal(await page.locator('#portalOverlay').isVisible(),false);assert.equal(await page.locator('#siteAdminOpen').isVisible(),false)}else{const before=telegramLogins;await page.reload({waitUntil:'networkidle'});assert.equal(telegramLogins,before,'explicit logout must not auto-login through Telegram');assert.equal(await page.locator('#miniAdminTab').isVisible(),false)}
  await page.close();console.log('PASS '+label+': profile, licenses, layout, manage link, Escape, failed/successful logout and privacy');
 }
 assert.deepEqual(errors,[]);console.log('PASS: no browser errors.');
}finally{await browser.close();server.close()}
