// Security-filtered Telegram configuration diagnostics.
// Never return, log or reflect BotFather tokens, webhook secrets or Telegram user identities.
const EXPECTED_WEBHOOK='https://drfx.company/api/telegram/webhook';
const EXPECTED_MINI_APP='https://drfx.company/telegram';
let cached=null,expires=0;
const bool=x=>x===true;
async function probe(botToken,method,fetcher){
 try{
  const result=await fetcher('https://api.telegram.org/bot'+botToken+'/'+method,{method:'POST',headers:{'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});
  if(!result.ok)return null;
  const body=await result.json();
  return body?.ok===true?body.result:null;
 }catch{return null;}
}
export async function telegramHealth(env,fetcher=fetch,now=Date.now()){
 const hasToken=typeof env.TELEGRAM_BOT_TOKEN==='string'&&/^[0-9]{5,}:[A-Za-z0-9_-]{30,}$/.test(env.TELEGRAM_BOT_TOKEN);
 const validSecret=typeof env.TELEGRAM_WEBHOOK_SECRET==='string'&&/^[A-Za-z0-9_-]{16,256}$/.test(env.TELEGRAM_WEBHOOK_SECRET);
 const validAdminId=typeof env.ADMIN_TELEGRAM_ID==='string'&&/^[0-9]{5,20}$/.test(env.ADMIN_TELEGRAM_ID);
 const configured=hasToken&&validSecret;
 if(cached&&now<expires&&cached.configured===configured&&cached.admin_id_format_valid===validAdminId&&cached.webhook_secret_format_valid===validSecret)return cached;
 let bot=null,hook=null,menu=null;
 if(hasToken){
  [bot,hook,menu]=await Promise.all([
   probe(env.TELEGRAM_BOT_TOKEN,'getMe',fetcher),
   probe(env.TELEGRAM_BOT_TOKEN,'getWebhookInfo',fetcher),
   probe(env.TELEGRAM_BOT_TOKEN,'getChatMenuButton',fetcher)
  ]);
 }
 const out={
  ok:true,
  configured,
  bot_token_valid:!!(bot&&bot.is_bot===true),
  // Public @username only; never expose bot token, webhook secret or user information.
  bot_username:bot?.is_bot===true&&/^[A-Za-z0-9_]{5,32}$/.test(bot.username||'')?bot.username:null,
  webhook_secret_format_valid:validSecret,
  admin_id_format_valid:validAdminId,
  webhook_registered:typeof hook?.url==='string'&&hook.url.length>0,
  webhook_matches:hook?.url===EXPECTED_WEBHOOK,
  mini_app_menu_configured:menu?.type==='web_app'&&menu.web_app?.url===EXPECTED_MINI_APP,
  webhook_pending_updates:typeof hook?.pending_update_count==='number'?hook.pending_update_count:null
 };
 cached=out;expires=now+60_000;
 return out;
}
