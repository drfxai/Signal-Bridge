// The configured owner can sign in through either verified identity. Keep all
// licenses and routing scoped to the existing Telegram account, without merging
// or deleting records. Arbitrary admin roles do not establish this relationship.
export async function resolveOwnerSession(env,session){
 if(!session||session.telegram_id||session.role!=='admin')return session;
 const email=String(env.ADMIN_EMAIL||'').trim().toLowerCase();
 const telegramId=String(env.ADMIN_TELEGRAM_ID||'').trim();
 if(!email||String(session.email||'').trim().toLowerCase()!==email||!/^\d{1,20}$/.test(telegramId))return session;
 const primary=await env.DB.prepare('SELECT id,email,telegram_id,telegram_name,role,plan,status,created_at FROM site_users WHERE telegram_id=? LIMIT 1').bind(telegramId).first();
 if(!primary||primary.role!=='admin'||primary.id===session.id)return session;
 if(primary.status!=='active')return null;
 return {...primary,email:primary.email||session.email,token_hash:session.token_hash};
}

// Never authorize a privileged operation using a stored role alone.
// A legitimate owner may use either the configured email or Telegram identity.
export function verifiedOwnerAdmin(env,user){
 if(!user||user.role!=='admin'||user.status!=='active')return false;
 const email=String(env?.ADMIN_EMAIL||'').trim().toLowerCase();
 const telegramId=String(env?.ADMIN_TELEGRAM_ID||'').trim();
 const emailMatches=!!email&&!!user.email&&String(user.email).trim().toLowerCase()===email;
 const telegramMatches=/^\d{5,20}$/.test(telegramId)&&!!user.telegram_id&&String(user.telegram_id)===telegramId;
 return emailMatches||telegramMatches;
}
