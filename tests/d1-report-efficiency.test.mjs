import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';

function migratedDatabase(){
 const db=new DatabaseSync(':memory:');
 for(const dir of ['worker/migrations','site/migrations']){
  for(const name of readdirSync(dir).filter(name=>name.endsWith('.sql')).sort()){
   db.exec(readFileSync(dir+'/'+name,'utf8'));
  }
 }
 return db;
}

function queryPlan(db,sql){
 return db.prepare('EXPLAIN QUERY PLAN '+sql).all('usr_example')
  .map(row=>row.detail).join(' | ');
}

test('recent member commands use tenant/time index without full scans or temp sort',()=>{
 const db=migratedDatabase();
 try{
  const plan=queryPlan(db,"SELECT id,source_type,status,last_error,created_at,json_extract(payload_json,'$.symbol') AS symbol FROM commands WHERE tenant_id=? ORDER BY created_at DESC,id DESC LIMIT 60");
  assert.match(plan,/SEARCH commands USING INDEX idx_commands_tenant_created/);
  assert.doesNotMatch(plan,/SCAN commands|USE TEMP B-TREE/);
 }finally{db.close()}
});

test('Telegram delivery history uses user/time index without temp sort',()=>{
 const db=migratedDatabase();
 try{
  const plan=queryPlan(db,'SELECT status,detail,created_at FROM telegram_signal_outbox WHERE user_id=? ORDER BY created_at DESC,id DESC LIMIT 8');
  assert.match(plan,/SEARCH telegram_signal_outbox USING INDEX idx_tg_outbox_user_created/);
  assert.doesNotMatch(plan,/SCAN telegram_signal_outbox|USE TEMP B-TREE/);
 }finally{db.close()}
});

test('report history polling stays slower than connection-state updates',()=>{
 const code=readFileSync('site/src/portal-execution.mjs','utf8');
 assert.match(code,/const memberRefresh=setInterval\([\s\S]*?\},60000\)/);
 assert.match(code,/const refresh=setInterval\([\s\S]*?\},5000\)/);
 assert.match(code,/Date\.now\(\)-lastReportAt<30000/);
 assert.match(code,/loadReport\(true\)/);
});


test('Telegram route query plans use account and channel indexes instead of full table scans',()=>{
 const db=migratedDatabase();
 try{
  const index=(sql,param)=>db.prepare('EXPLAIN QUERY PLAN '+sql).all(param).map(x=>x.detail).join(' | ');
  const joins='SELECT m.*,sl.agent_id FROM member_signal_settings m JOIN site_users u ON u.id=m.user_id JOIN site_licenses sl ON sl.user_id=u.id WHERE ';
  const tail=" AND m.telegram_verified=1 AND m.telegram_to_mt5=1 AND u.status='active'";
  const privatePlan=index(joins+'u.telegram_id=?'+tail,'987654321');
  const channelPlan=index(joins+'m.telegram_chat_id=?'+tail,'-100777');
  const modePlan=db.prepare("EXPLAIN QUERY PLAN SELECT delivery_mode FROM ingress_connections WHERE tenant_id=? AND agent_id=? AND provider='tradingview' AND status='active' ORDER BY created_at DESC,id DESC LIMIT 1").all('usr_example','ea_example').map(x=>x.detail).join(' | ');
  assert.match(privatePlan,/SEARCH u USING INDEX/);
  assert.doesNotMatch(privatePlan,/SCAN u/);
  assert.match(channelPlan,/SEARCH m USING INDEX idx_member_tg_chat_active/);
  assert.doesNotMatch(channelPlan,/SCAN u/);
  assert.match(modePlan,/SEARCH ingress_connections USING INDEX idx_ingress_active_tenant_agent_recent/);
  assert.doesNotMatch(modePlan,/SCAN ingress_connections|USE TEMP B-TREE/);
 }finally{db.close();}
});
test('Telegram routing code keeps private sender identity separate from verified channel ownership',()=>{
 const source=readFileSync('site/src/signal-routing.mjs','utf8');
 assert.match(source,/PRIVATE_SENDER_MISMATCH/);
 assert.match(source,/privateChat\?'u\.telegram_id=\?'\:'m\.telegram_chat_id=\?'/);
 assert.doesNotMatch(source,/m\.telegram_chat_id=\? OR \(u\.telegram_id=\?/);
});
