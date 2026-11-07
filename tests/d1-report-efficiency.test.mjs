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
