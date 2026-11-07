// Session-scoped profile metadata. Never decrypt or return license credentials here.
export async function accountProfile(env,user){
 const [bridge,scalper,scalperStats,purchases]=await Promise.all([
  env.DB.prepare('SELECT e.plan,e.status,e.activated_at,e.expires_at,e.account_login,a.status agent_status FROM site_licenses l JOIN ea_licenses e ON e.id=l.license_id JOIN agent_connections a ON a.id=l.agent_id WHERE l.user_id=?').bind(user.id).first(),
  env.DB.prepare("SELECT k.id,k.plan,k.days,k.account_login,k.created_at,CASE WHEN o.status='paid' THEN 1 ELSE 0 END purchased FROM scalper_keys k LEFT JOIN scalper_orders o ON o.id=k.order_id AND o.user_id=k.user_id WHERE k.user_id=? ORDER BY k.created_at DESC,k.id DESC LIMIT 10").bind(user.id).all(),
  env.DB.prepare("SELECT COUNT(*) issued_keys,COALESCE(SUM(CASE WHEN o.status='paid' THEN 1 ELSE 0 END),0) purchased_keys FROM scalper_keys k LEFT JOIN scalper_orders o ON o.id=k.order_id AND o.user_id=k.user_id WHERE k.user_id=?").bind(user.id).first(),
  env.DB.prepare("SELECT COUNT(*) paid FROM site_orders WHERE user_id=? AND status='paid'").bind(user.id).first()
 ]);
 const expiry=bridge?.expires_at?Date.parse(bridge.expires_at.replace(' ','T')+'Z'):null;
 const valid=!!bridge&&bridge.status==='active'&&bridge.agent_status==='active'&&(!bridge.activated_at||(Number.isFinite(expiry)&&expiry>Date.now()));
 const active=valid&&!!bridge.activated_at,paidBridge=!!bridge&&Number(purchases?.paid)>0;
 const bridgeStatus=!bridge?'not_issued':bridge.status!=='active'||bridge.agent_status!=='active'?'inactive':!valid?'expired':active?'active':'awaiting_activation';
 const issued=Number(scalperStats?.issued_keys)||0,purchased=Number(scalperStats?.purchased_keys)||0;
 return {ok:true,account:{id:user.id,name:user.telegram_name||user.email?.split('@')[0]||'DrFX member',email:user.email||null,telegram:user.telegram_name||null,created_at:user.created_at,role:user.role},
  summary:{active_confirmed:active?1:0,bridge_trials:valid&&bridge?.plan==='trial'?1:0,purchased_licenses:(paidBridge?1:0)+purchased,active_incomplete:issued>0},
  signalbridge:bridge?{plan:bridge.plan,status:bridgeStatus,kind:bridge.plan==='trial'?'trial':'subscription',active,purchased:paidBridge,activated_at:bridge.activated_at,expires_at:bridge.expires_at,account_login:bridge.account_login}:null,
  scalper:{issued_keys:issued,purchased_keys:purchased,active:null,trial:null,telemetry_supported:false,has_more:issued>10,licenses:(scalper.results||[]).map(r=>({...r,purchased:!!r.purchased}))}};
}
