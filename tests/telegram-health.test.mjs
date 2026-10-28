import test from 'node:test';
import assert from 'node:assert/strict';
import { telegramHealth } from '../site/src/telegram-health.mjs';
import { readFileSync } from 'node:fs';
const token='123456789:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const secret='abcdefghijklmnopqrstuvwxyz0123456789';
const env={TELEGRAM_BOT_TOKEN:token,TELEGRAM_WEBHOOK_SECRET:secret,ADMIN_TELEGRAM_ID:'912345670'};
const mocked=(methodData)=>async url=>{
 const method=url.split('/').at(-1);
 const result=methodData[method];
 if(result===undefined)return new Response(JSON.stringify({ok:false,description:'not permitted'}),{status:401});
 return new Response(JSON.stringify({ok:true,result}),{status:200,headers:{'content-type':'application/json'}});
};
const good={
 getMe:{id:123456789,is_bot:true,first_name:'DrFX Bot',username:'SignalBridgeDemoBot'},
 getWebhookInfo:{url:'https://drfx.company/api/telegram/webhook',pending_update_count:0,last_error_message:'private provider info'},
 getChatMenuButton:{type:'web_app',text:'Open App',web_app:{url:'https://drfx.company/telegram'}}
};
test('Telegram diagnostics confirms real webhook and menu without leaking private fields',async()=>{
 const status=await telegramHealth(env,mocked(good),Date.now());
 assert.deepEqual(status,{
  ok:true,configured:true,bot_token_valid:true,bot_username:'SignalBridgeDemoBot',webhook_secret_format_valid:true,
  admin_id_format_valid:true,webhook_registered:true,webhook_matches:true,
  mini_app_menu_configured:true,webhook_pending_updates:0
 });
 const text=JSON.stringify(status);
 assert.ok(!text.includes(token));
 assert.ok(!text.includes(secret));
 assert.ok(!text.includes('private provider info'));
 assert.ok(!text.includes('DrFX Bot'));
});
test('Telegram diagnostics detects missing webhook or wrong menu and wrong admin ID type',async()=>{
 const status=await telegramHealth({...env,ADMIN_TELEGRAM_ID:'@BotName'},mocked({
  ...good,getWebhookInfo:{url:'',pending_update_count:8},
  getChatMenuButton:{type:'default'}
 }),Date.now()+61_000);
 assert.equal(status.configured,true);
 assert.equal(status.bot_token_valid,true);
 assert.equal(status.bot_username,'SignalBridgeDemoBot');
 assert.equal(status.webhook_registered,false);
 assert.equal(status.webhook_matches,false);
 assert.equal(status.mini_app_menu_configured,false);
 assert.equal(status.admin_id_format_valid,false);
 assert.equal(status.webhook_pending_updates,8);
});
test('Telegram diagnostics reports invalid webhook secret and bad token without leaking it',async()=>{
 const status=await telegramHealth({TELEGRAM_BOT_TOKEN:'invalid',TELEGRAM_WEBHOOK_SECRET:'https://drfx.company/api/telegram/webhook',ADMIN_TELEGRAM_ID:'12345'},
  mocked({}),Date.now()+122_000);
 assert.equal(status.configured,false);
 assert.equal(status.bot_token_valid,false);
 assert.equal(status.bot_username,null);
 assert.equal(status.webhook_secret_format_valid,false);
 assert.equal(status.webhook_matches,false);
 assert.ok(!JSON.stringify(status).includes('https://drfx.company/api/telegram/webhook'));
});
test('Telegram health endpoint retains per-IP rate-limit guard',()=>{
 const source=readFileSync(new URL('../site/src/worker.mjs',import.meta.url),'utf8');
 assert.match(source,/path==='\/api\/telegram\/health'/);
 assert.match(source,/limited\(req,env,'public:telegram-health',5\)/);
 assert.match(source,/return json\(await telegramHealth\(env\)\)/);
});
