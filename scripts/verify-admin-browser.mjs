// Local UI fixture: no production sessions, licenses or services are used.
import {createServer} from 'node:http';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import worker from '../site/src/worker.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(require.resolve('playwright',{paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||process.cwd()]}));
const server=createServer(async(req,res)=>{try{const r=await worker.fetch(new Request('http://127.0.0.1:4201'+req.url),{});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}catch{res.writeHead(500);res.end()}});
await new Promise(r=>server.listen(4201,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,...(process.env.DRFX_TEST_CHROMIUM?{executablePath:process.env.DRFX_TEST_CHROMIUM}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
const owner='usr_'+'a'.repeat(32),key='TEST-ONLY-PRIVATE-LICENSE',user={id:owner,email:'owner@example.test',role:'admin',plan:'annual',license_status:'active',activation_code:'',mt5_account:null};
const counts={users:12,valid_licenses:11,trials:6,subscriptions:5,quarterly:3,annual:2,expiring_7d:1};
const overview={ok:true,generated_at:new Date().toISOString(),users:{total:18,new_7d:4,suspended:1},signalbridge:{...counts,orders:{paid:4,pending:1,paid_usd:306}},scalper:{users:5,issued_keys:7,monthly_keys:3,quarterly_keys:4,orders:{paid:5,paid_usd:155}},health:{licensing:true,scalper_signing:true,payments:true,telegram:true,email:true,ea_hub:true},registrations:[{day:new Date().toISOString().slice(0,10),count:4}],activity:[{id:'aud_test',action:'grant_plan',subject_id:owner,detail:'annual',telegram_name:'Owner',occurred_at:new Date().toISOString()}]};
const errors=[];await mkdir('/tmp/drfx-admin-ui',{recursive:true});
try{
 for(const [label,width,locale,role] of [['mobile-en',390,'en','admin'],['mobile-fa',360,'fa','admin'],['desktop-en',1280,'en','admin'],['member',390,'en','user']]){
  const page=await browser.newPage({viewport:{width,height:900},locale:locale==='fa'?'fa-IR':'en-US'});page.on('pageerror',e=>errors.push(label+': '+e.message));
  await page.addInitScript(locale=>localStorage.setItem('drfx-language',locale),locale);
  await page.route('https://telegram.org/**',r=>r.abort());
  await page.route('**/api/**',async route=>{
   const url=new URL(route.request().url()),p=url.pathname;let data={ok:true};
   if(p==='/api/me')data={ok:true,user:{...user,role}};
   else if(p==='/api/config')data={ok:true,telegram:false};
   else if(p==='/api/admin/overview')data=overview;
   else if(p==='/api/admin/connections')data={ok:true,counts:{checked:1,online:1,demo:1,live:0,unavailable:0},clients:[{agent_id:'ea_test',account_login:'12345678',account_server:'Demo Broker',online:true,available:true,mode:'DEMO'}],has_more:false};
   else if(p==='/api/admin/licenses')data=url.searchParams.get('product')==='scalper'?{ok:true,keys:[{key,account_login:'12345678',days:90}]}:{ok:true,license:{activation_code:key,plan:'annual',status:'active',expires_at:'2027-11-06 00:00:00'}};
   else if(p==='/api/admin/directory')data={ok:true,users:[{id:owner,email:'a-very-long-customer-email-address@example.test',telegram_name:'Owner',role:'admin',status:'active',plan:'annual',license_status:'active',scalper_keys:2,created_at:'2026-11-01 10:00:00',account_login:'12345678',account_server:'Demo Broker'}],has_more:false};
   else if(p==='/api/admin/orders')data={ok:true,orders:[{id:'ord_test',user_id:owner,product:'signalbridge',plan:'annual',amount_usd:165,status:'paid',created_at:'2026-11-06 10:00:00'}]};
   else if(p==='/api/webhook')data={ok:true,webhook:{exists:false}};
   else if(p==='/api/connection/check')data={ok:true,diagnostic:{license:'active',terminal_online:false,capabilities:[],telemetry:{}}};
   await route.fulfill({json:data});
  });
  await page.goto('http://127.0.0.1:4201/telegram',{waitUntil:'networkidle'});
  if(role==='user'){assert.equal(await page.locator('#miniAdminTab').isVisible(),false);assert.equal(await page.locator('#miniAdminShortcut').isVisible(),false);await page.close();continue}
  await page.locator('#miniAdminShortcut').click();await page.waitForFunction(()=>document.querySelector('#opsBridgeMetrics').children.length===6&&document.querySelector('#opsConnections').children.length>0);
  for(const tab of ['overview','licenses','customers','orders','activity']){
   await page.locator('[data-ops-tab="'+tab+'"]').click();
   if(tab==='customers')await page.waitForSelector('.ops-user');if(tab==='orders')await page.waitForSelector('.ops-order');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),label+' '+tab+' horizontal overflow');
   if(tab==='licenses'){
    await page.locator('[data-ops-reveal="signalbridge"]').click();await page.waitForFunction(key=>document.getElementById('opsBridgeKey').textContent.includes(key),key);
    await page.locator('[data-ops-reveal="scalper"]').click();await page.waitForFunction(key=>document.getElementById('opsScalperKey').textContent.includes(key),key);
    await page.locator('[data-ops-hide="signalbridge"]').click();assert.ok(!(await page.locator('#opsBridgeKey').textContent()).includes(key));
   }
   await page.waitForTimeout(400);
   if(tab==='overview'||(label==='mobile-fa'&&tab==='licenses'))await page.screenshot({path:'/tmp/drfx-admin-ui/'+label+'-'+tab+'.png',fullPage:true});
  }
  assert.ok(!(await page.locator('#opsScalperKey').textContent()).includes(key),'keys clear on subview exit');
  await page.locator('.bottom [data-tab="home"]').click();assert.equal(await page.locator('#panel-admin').isVisible(),false);
  await page.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS: phone EN/FA and desktop layouts; all admin views; key reveal/hide/leave; ordinary user visibility; no browser errors.');
}finally{await browser.close();server.close()}
