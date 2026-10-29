import {createServer} from 'node:http';
import {mkdir} from 'node:fs/promises';
import handler from '../site/src/worker.mjs';
import {chromium} from 'playwright';
const server=createServer(async(req,res)=>{try{const r=await handler.fetch(new Request('http://127.0.0.1:4199'+req.url),{});res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}catch{res.writeHead(500);res.end()}});
await new Promise(r=>server.listen(4199,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const dir='artifacts/ui-verification';await mkdir(dir,{recursive:true});
const user={id:'preview-user',email:'preview@example.test',role:'user',plan:'trial',license_status:'active',expires_at:'2099-01-01 00:00:00',activated_at:'2026-10-29 00:00:00',mt5_account:{login:'DEMO PREVIEW',server:'Preview broker'},activation_code:'',indicator_delivery_ready:false};
const errors=[];
for(const [label,url,width,height] of [['website-desktop','/',1440,1100],['website-tablet','/',820,1180],['website-mobile','/',390,844],['telegram-mobile','/telegram',390,844]]){
 const page=await browser.newPage({viewport:{width,height}});page.on('pageerror',e=>errors.push(label+': '+e.message));
 let testRequested=0;
 await page.route('**/api/**',async route=>{
  const path=new URL(route.request().url()).pathname;
  let data={ok:true};
  if(path==='/api/me')data={ok:true,user};
  if(path==='/api/config')data={ok:true,email:true,telegram:true,licensing:true,payments:false};
  if(path==='/api/connection/check')data={ok:true,diagnostic:{license:'active',live_snapshot_available:true,live_socket_verified:true,terminal_online:true}};
  if(path==='/api/webhook'||path==='/api/webhook/mode')data={ok:true,webhook:{exists:true,webhook_url:'https://example.test/PREVIEW-NOT-A-CREDENTIAL',mode:'dry_run',received:0}};
  if(path==='/api/connection/test-demo'){testRequested++;data={ok:true,test_id:'preview-test',command_id:'preview-command',status:'DELIVERED'}};
  if(path==='/api/connection/test-status')data={ok:true,test:{id:'preview-test',status:'CLOSED',detail:'UI preview only · no broker order',command_status:'FILLED'}};
  await route.fulfill({json:data});
 });
 await page.route(/^https:\/\/(?!127\.0\.0\.1)/,route=>route.abort());
 await page.goto('http://127.0.0.1:4199'+url,{waitUntil:'networkidle'});
 if(url==='/')await page.evaluate(async()=>{await refreshProfile();show('portalOverlay')});
 await page.locator('#startTimedTest').scrollIntoViewIfNeeded();
 await page.screenshot({path:dir+'/'+label+'.png'});
 if(!await page.locator('#startTimedTest').isVisible())throw Error('Test control not visible');
 // Cancellation must not call the trade endpoint.
 page.once('dialog',d=>d.dismiss());await page.locator('#startTimedTest').click();if(testRequested!==0)throw Error('cancel dispatched order');
 page.once('dialog',d=>d.accept());await page.locator('#startTimedTest').click();
 await page.waitForFunction(()=>document.getElementById('executionFeedback').textContent.includes('CLOSED'));
 if(testRequested!==1)throw Error('wrong number of test requests');
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
 if(overflow)throw Error(label+' has horizontal overflow');
 console.log(JSON.stringify({label,testRequested,overflow,feedback:await page.locator('#executionFeedback').textContent()}));
 await page.close();
}
await browser.close();server.close();if(errors.length)throw Error(errors.join('\n'));
