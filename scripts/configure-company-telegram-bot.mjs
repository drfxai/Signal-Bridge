#!/usr/bin/env node
// One-time Telegram BotFather integration setup, performed from a trusted local shell.
// Reads credentials exclusively from environment variables. Never print either secret.
import { BOT_MENU_COMMANDS } from '../site/src/bot-commands.mjs';
const token=process.env.TELEGRAM_BOT_TOKEN;
const secret=process.env.TELEGRAM_WEBHOOK_SECRET;
if(!token||!secret||!/^[A-Za-z0-9_-]{16,256}$/.test(secret)){
 console.error('Provide TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET via secure environment variables; no credentials are accepted as CLI arguments.');
 process.exit(2);
}
const api='https://api.telegram.org/bot'+token+'/';
const call=async(method,body)=>{
 const response=await fetch(api+method,{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify(body)
 });
 const json=await response.json();
 if(!response.ok||json.ok!==true)throw Error(method+' failed: '+String(json.description||response.status).slice(0,160));
 return json.result;
};
try{
 await call('setWebhook',{
  url:'https://drfx.company/api/telegram/webhook',
  secret_token:secret,
  allowed_updates:['message','callback_query','my_chat_member'],
  drop_pending_updates:false,
  max_connections:10
 });
 await call('setChatMenuButton',{
  menu_button:{type:'web_app',text:'DrFX App',web_app:{url:'https://drfx.company/telegram'}}
 });
 await call('setMyCommands',{
  commands:BOT_MENU_COMMANDS
 });
 console.log('Telegram webhook, Mini App menu button and bot commands registered.');
 console.log('Check /api/config for telegram:true and test /app or /start in a PRIVATE chat.');
}catch(err){console.error(err.message);process.exit(1);}
