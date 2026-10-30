import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import worker from '../site/src/worker.mjs';
import {BOT_LANGUAGES,BOT_LANGUAGE_CODES,botLanguage,botText,botLanguageKeyboard} from '../site/src/telegram-i18n.mjs';

const TOKEN='123456789:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
const SECRET='language-selection-secret-abc';
const who={id:123456789,first_name:'Demo',username:'example_bot_tester'};
const user={id:'usr_12345678901234567890123456789012',telegram_id:String(who.id),telegram_name:'Demo',status:'active',role:'user',plan:'trial'};
function fakeDB(){
 const preferences=new Map();
 const sqlCalls=[];
 const DB={
  prepare(sql){sqlCalls.push(sql);let args=[];
   return {
    bind(...a){args=a;return this;},
    async first(){
     if(sql.includes('FROM site_bot_preferences'))return preferences.has(args[0])?{language_code:preferences.get(args[0])}:null;
     if(sql.includes('FROM site_users WHERE telegram_id'))return user;
     if(sql.includes('FROM site_licenses sl JOIN ea_licenses'))return {
       encrypted_code:'mock-cipher',nonce:'mock-nonce',agent_id:'ea_123',plan:'trial',status:'active',
       account_login:null,account_server:null,expires_at:null,activated_at:null
     };
     return null;
    },
    async run(){
     if(sql.includes('INSERT INTO site_bot_preferences'))preferences.set(args[0],args[1]);
     return {success:true,meta:{changes:1}};
    }
   }
  }
 };
 return {DB,preferences,sqlCalls};
}
function botRequest(payload){
 return new Request('https://drfx.company/api/telegram/webhook',{
  method:'POST',headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':SECRET},
  body:JSON.stringify(payload)
 });
}
function botMessage(command){
 return {update_id:100, message:{message_id:55,from:who,chat:{id:who.id,type:'private'},text:command}};
}
function botCallback(code){
 return {update_id:101,callback_query:{
  id:'callback_12',from:who,data:'lang:'+code,
  message:{message_id:55,chat:{id:who.id,type:'private'}}
 }};
}
async function withTelegramStub(fn){
 const orig=globalThis.fetch;
 const calls=[];
 globalThis.fetch=async(url,options)=>{
  const method=String(url).split('/').pop();
  calls.push({method,body:JSON.parse(options.body)});
  return new Response(JSON.stringify({ok:true,result:true}),{headers:{'content-type':'application/json'}});
 };
 try{return await fn(calls)}finally{globalThis.fetch=orig}
}
test('English is the default and six language options are consistently defined',()=>{
 assert.deepEqual(BOT_LANGUAGE_CODES,['en','fa','ar','tr','ru','hi']);
 assert.equal(botLanguage('unknown'),'en');
 assert.equal(botLanguage(undefined),'en');
 assert.ok(botText('en','choose').includes('Choose your language'));
 const kb=botLanguageKeyboard();
 assert.equal(kb.inline_keyboard.length,3);
 assert.deepEqual(kb.inline_keyboard.flat().map(x=>x.callback_data),['lang:en','lang:fa','lang:ar','lang:tr','lang:ru','lang:hi']);
 for(const lang of BOT_LANGUAGE_CODES){
  for(const key of ['choose','selected','welcome','app','loginTitle','loginText','serialTitle','serialNotice','member','license','tooMany','licenseUnavailable','suspended']){
   assert.ok(botText(lang,key).length>4,lang+':'+key);
  }
 }
 assert.equal(BOT_LANGUAGES.fa.name,'فارسی');
});
test('/start shows native language selection before any welcome or code',async()=>{
 const env={...fakeDB(),TELEGRAM_BOT_TOKEN:TOKEN,TELEGRAM_WEBHOOK_SECRET:SECRET};
 await withTelegramStub(async(calls)=>{
  const result=await worker.fetch(botRequest(botMessage('/start')),env);
  assert.equal(result.status,200);
  assert.equal(calls.length,1);
  assert.equal(calls[0].method,'sendMessage');
  assert.match(calls[0].body.text,/Choose your language/);
  assert.equal(calls[0].body.reply_markup.inline_keyboard.flat().length,6);
  assert.equal(env.preferences.size,0);
  assert.ok(!env.sqlCalls.some(x=>x.includes('INSERT INTO site_bot_preferences')));
 });
});
test('inline-language callback saves locale and delivers localized welcome with Mini App button',async()=>{
 const env={...fakeDB(),TELEGRAM_BOT_TOKEN:TOKEN,TELEGRAM_WEBHOOK_SECRET:SECRET};
 await withTelegramStub(async(calls)=>{
  const result=await worker.fetch(botRequest(botCallback('fa')),env);
  assert.equal(result.status,200);
  assert.equal(env.preferences.get(String(who.id)),'fa');
  assert.ok(calls.some(x=>x.method==='answerCallbackQuery'));
  const welcome=calls.filter(x=>x.method==='sendMessage');
  assert.equal(welcome.length,1);
  assert.match(welcome[0].body.text,/به DrFX Company خوش آمدید/);
  assert.ok(welcome[0].body.reply_markup.inline_keyboard[0][0].web_app.url.endsWith('/telegram'));
  const second=await worker.fetch(botRequest(botMessage('/language')),env);
  assert.equal(second.status,200);
  assert.match(calls.at(-1).body.text,/زبان خود را انتخاب کنید/);
 });
});
test('all six selections persist and localize subsequent bot /start or /app',async()=>{
 const env={...fakeDB(),TELEGRAM_BOT_TOKEN:TOKEN,TELEGRAM_WEBHOOK_SECRET:SECRET};
 await withTelegramStub(async(calls)=>{
  for(const lang of BOT_LANGUAGE_CODES){
   await worker.fetch(botRequest(botCallback(lang)),env);
   assert.equal(env.preferences.get(String(who.id)),lang);
   await worker.fetch(botRequest(botMessage('/app')),env);
   assert.equal(calls.at(-1).body.text,botText(lang,'app'));
  }
 });
});
test('webhook rejects callback forgery and nonprivate selections',async()=>{
 const env={...fakeDB(),TELEGRAM_BOT_TOKEN:TOKEN,TELEGRAM_WEBHOOK_SECRET:SECRET};
 await withTelegramStub(async(calls)=>{
  const wrong=botCallback('ru');wrong.callback_query.from.id+=1;
  const first=await worker.fetch(botRequest(wrong),env);
  assert.equal(first.status,200);assert.equal(env.preferences.size,0);assert.equal(calls.length,0);
  const bad=botCallback('xx');
  await worker.fetch(botRequest(bad),env);
  assert.equal(env.preferences.size,0);
  assert.ok(calls.some(x=>x.method==='answerCallbackQuery'));
  const req=botRequest(botCallback('hi'));
  req.headers.set('x-telegram-bot-api-secret-token','wrong');
  const rejected=await worker.fetch(req,env);
  assert.equal(rejected.status,401);
  assert.equal(env.preferences.size,0);
 });
});
test('deployment command and Telegram API opt into callback_query updates',()=>{
 const ops=readFileSync(new URL('../scripts/configure-company-telegram-bot.mjs',import.meta.url),'utf8');
 const migration=readFileSync(new URL('../site/migrations/0010_bot_language.sql',import.meta.url),'utf8');
 assert.ok(ops.includes("allowed_updates:['message','callback_query','my_chat_member']"));
 assert.ok(ops.includes("command:'language'"));
 assert.ok(migration.includes('CHECK(language_code IN ('));
 assert.ok(migration.includes("'hi'"));
});
