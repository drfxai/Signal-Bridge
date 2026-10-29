import {DEFAULT_POLICY,validatePolicy} from '../../worker/src/member-policy.mjs';
import {parseSignalMessage} from '../../worker/src/signal-adapters.mjs';
const reply=(b,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{'content-type':'application/json','cache-control':'no-store'}});
export async function memberSettings(env,user){const r=await env.DB.prepare('SELECT * FROM member_signal_settings WHERE user_id=?').bind(user.id).first();return {policy:r?JSON.parse(r.policy_json):{...DEFAULT_POLICY},telegram_chat_id:r?.telegram_chat_id||user.telegram_id||'',telegram_verified:!!r?.telegram_verified,tv_to_telegram:!!r?.tv_to_telegram,telegram_to_mt5:!!r?.telegram_to_mt5,default_lots:r?.default_lots||0.01,report_since:r?.report_since||null};}
export async function memberControls(path,b,env,user,diagnostic){
 if(path==='/api/member/settings'&&b===undefined)return reply({ok:true,settings:await memberSettings(env,user)});
 if(path==='/api/member/settings'){
  let policy;try{policy=validatePolicy(b.policy)}catch(e){return reply({error:e.message},400)}
  if(!Number.isFinite(b.default_lots)||b.default_lots<=0||b.default_lots>100)return reply({error:'INVALID_LOTS'},400);
  const old=await memberSettings(env,user),enabled=!!b.tv_to_telegram||!!b.telegram_to_mt5;
  if(enabled&&!old.telegram_verified)return reply({error:'TELEGRAM_VERIFICATION_REQUIRED'},409);
  if(b.telegram_to_mt5&&b.confirm!==true)return reply({error:'EXPLICIT_CONFIRMATION_REQUIRED'},400);
  await env.DB.prepare("INSERT INTO member_signal_settings(user_id,policy_json,default_lots,tv_to_telegram,telegram_to_mt5) VALUES (?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET policy_json=excluded.policy_json,default_lots=excluded.default_lots,tv_to_telegram=excluded.tv_to_telegram,telegram_to_mt5=excluded.telegram_to_mt5,updated_at=CURRENT_TIMESTAMP").bind(user.id,JSON.stringify(policy),b.default_lots,b.tv_to_telegram?1:0,b.telegram_to_mt5?1:0).run();
  return reply({ok:true,settings:await memberSettings(env,user),note:'Policy applies to new positions. EA 0.29.0 required.'});
 }
 if(path==='/api/member/telegram/verify'){
  const id=String(b.chat_id||'');if(!user.telegram_id||!/^[-]?\d{1,20}$/.test(id))return reply({error:'LINK_TELEGRAM_FIRST'},409);
  if(id!==user.telegram_id){
   if(!env.TELEGRAM_BOT_TOKEN)return reply({error:'BOT_NOT_CONFIGURED'},503);
   const req=async(method,body)=>{const r=await fetch('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(8000)});const j=await r.json();if(!j.ok)throw Error('CHAT_ACCESS_DENIED');return j.result};
   try{const owner=await req('getChatMember',{chat_id:id,user_id:user.telegram_id}),me=await req('getMe',{}),bot=await req('getChatMember',{chat_id:id,user_id:me.id});if(!['creator','administrator'].includes(owner.status)||!['creator','administrator'].includes(bot.status)||(bot.can_post_messages===false))throw Error('ADMIN_RIGHTS_REQUIRED')}catch(e){return reply({error:e.message==='ADMIN_RIGHTS_REQUIRED'?e.message:'CHAT_ACCESS_DENIED'},409)}
  }
  await env.DB.prepare("INSERT INTO member_signal_settings(user_id,telegram_chat_id,telegram_verified) VALUES (?,?,1) ON CONFLICT(user_id) DO UPDATE SET telegram_chat_id=excluded.telegram_chat_id,telegram_verified=1,tv_to_telegram=0,telegram_to_mt5=0,updated_at=CURRENT_TIMESTAMP").bind(user.id,id).run();return reply({ok:true,settings:await memberSettings(env,user)});
 }
 if(path==='/api/member/preview'){
  const s=await memberSettings(env,user);return reply({ok:true,parsed:parseSignalMessage(String(b.text||''),Date.now(),{defaultLots:s.default_lots})});
 }
 if(path==='/api/member/report'){
  const [d,rows,review,outbox]=await Promise.all([diagnostic(),env.DB.prepare("SELECT id,source_type,status,last_error,created_at,json_extract(payload_json,'$.symbol') AS symbol,json_extract(payload_json,'$.side') AS side,json_extract(payload_json,'$.order.volume.value') AS lots FROM commands WHERE tenant_id=? ORDER BY created_at DESC LIMIT 60").bind(user.id).all(),env.DB.prepare('SELECT id,reason,created_at FROM signal_review_queue WHERE user_id=? ORDER BY created_at DESC LIMIT 10').bind(user.id).all(),env.DB.prepare('SELECT status,detail,created_at FROM telegram_signal_outbox WHERE user_id=? ORDER BY created_at DESC LIMIT 8').bind(user.id).all()]);
  return reply({ok:true,diagnostic:d,commands:rows.results||[],review:review.results||[],outbox:outbox.results||[]});
 }
 if(path==='/api/member/report/range'){const d=await diagnostic();if(!['today','7d','30d','all'].includes(b.period))return reply({error:'INVALID_PERIOD'},400);if(!d.terminal_online||!d.capabilities.includes('reports-v1'))return reply({error:'UPDATED_EA_REQUIRED'},409);const hub=env.AGENT_HUB.get(env.AGENT_HUB.idFromName(d.agent_id));const r=await hub.fetch(new Request('https://agent-hub/report-range',{method:'POST',body:JSON.stringify({period:b.period,agent_id:d.agent_id,account_login:d.mt5_account.login,account_server:d.mt5_account.server})}));return reply(await r.json(),r.status);}
 if(path==='/api/member/report/reset'){
  if(b.confirm!==true)return reply({error:'EXPLICIT_CONFIRMATION_REQUIRED'},400);const d=await diagnostic();
  if(!d.terminal_online||!d.fresh||!d.license_unexpired||!d.capabilities.includes('reports-v1'))return reply({error:'UPDATED_EA_REQUIRED'},409);
  const requestId=crypto.randomUUID(),hub=env.AGENT_HUB.get(env.AGENT_HUB.idFromName(d.agent_id));const r=await hub.fetch(new Request('https://agent-hub/report-reset',{method:'POST',body:JSON.stringify({request_id:requestId,agent_id:d.agent_id,account_login:d.mt5_account.login,account_server:d.mt5_account.server})}));return reply(await r.json(),r.status);
 }
 return null;
}
