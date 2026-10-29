import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { authenticateEaLicense, EA_LICENSE_PLANS } from '../worker/src/ea-license.mjs';
import { readFileSync } from 'node:fs';
import { AgentHub } from '../worker/src/agent-hub.mjs';

const code=randomBytes(32).toString('base64url');
const hash=createHash('sha256').update(code).digest('hex');

test('EA login only accepts an opaque credential and queries active, unexpired license',async()=>{
 let query='',bound='';
 const env={DB:{prepare(sql){query=sql;return{bind(value){bound=value;return{first:async()=>({id:'ea_1',license_id:'lic_1'})};}};}}};
 const request=new Request('https://signalbridge.drfx.online/v1/ea/ws',{headers:{'sec-websocket-protocol':'signalbridge-ea-v1, sb-token.'+code}});
 const license=await authenticateEaLicense(request,env);
 assert.equal(license.license_id,'lic_1');
 assert.equal(bound,hash);
 assert.match(query,/ea_licenses/);
 assert.match(query,/expires_at>CURRENT_TIMESTAMP/);
 assert.match(query,/a\.status='active'/);
});

test('invalid, missing and short codes are rejected before the database',async()=>{
 const env={DB:{prepare(){throw new Error('DB should not be accessed')}}};
 for(const token of ['','test','x'.repeat(42)]){
  const headers=token?{'sec-websocket-protocol':'signalbridge-ea-v1, sb-token.'+token}:{};
  assert.equal(await authenticateEaLicense(new Request('https://example.com',{headers}),env),null);
 }
});
test('only three explicitly defined plans and expected durations',()=>{
 assert.deepEqual(EA_LICENSE_PLANS,{trial:'+1 month',quarterly:'+3 months',annual:'+1 year'});
});
test('migration and issuer do not persist plaintext code and have revocation/binding fields',()=>{
 const m=readFileSync('worker/migrations/0006_ea_licenses.sql','utf8');
 const script=readFileSync('scripts/issue-ea-license.mjs','utf8');
 assert.match(m,/token_sha256 TEXT NOT NULL UNIQUE/);
 assert.match(m,/account_login TEXT/);
 assert.match(m,/expires_at TEXT/);
 assert.match(m,/CHECK\(status IN \('active','revoked'\)\)/);
 assert.match(script,/randomBytes\(32\)/);
 assert.match(script,/writeFileSync\(file,sql,\{mode:0o600,flag:'wx'\}\)/);
 assert.doesNotMatch(script,/digest\(activationCode\)\s*\+\s*activationCode/);
});

test('active EA sockets lose command access after personal code rotation',async()=>{
 const active='a'.repeat(64),replaced='b'.repeat(64);
 const row={status:'active',agent_status:'active',token_sha256:replaced,expires_at:'2099-01-01 00:00:00',account_login:'10023',account_server:'Demo-Broker'};
 const env={DB:{prepare(sql){assert.match(sql,/token_sha256/);return {bind(id,agent){assert.equal(id,'lic_1');assert.equal(agent,'ea_1');return {first:async()=>row}}}}}};
 const hub=new AgentHub({},env);
 const attached={role:'ea',licenseId:'lic_1',agentId:'ea_1',licenseHash:active,account:{login:'10023',server:'Demo-Broker'}};
 assert.equal(await hub.licenseIsValid(attached),false,'rotated code must immediately revoke previous WebSocket');
 row.token_sha256=active;
 assert.equal(await hub.licenseIsValid(attached),true,'matching fingerprint is authorized');
 row.status='revoked';
 assert.equal(await hub.licenseIsValid(attached),false,'admin revocation blocks existing socket');
});


test('EA v0.27.2 reports activation and connectivity errors without exposing the code',()=>{
 const mq5=readFileSync('mt5/DrFX_SignalBridge_EA.mq5','utf8');
 assert.match(mq5,/#property version\s+"0\.272"/);
 assert.match(mq5,/bool ValidActivationCode\(string code\)/);
 assert.match(mq5,/ACTIVATION CODE REQUIRED/);
 assert.match(mq5,/WEBSOCKET REFUSED \(HTTP\)/);
 assert.match(mq5,/INVALID WEBSOCKET RESPONSE/);
 assert.match(mq5,/CANNOT CONNECT TO CLOUD/);
 assert.match(mq5,/g_connStage/);
 assert.match(mq5,/if\(now-g_lastUiUpdate>=\(ulong\)UiRefresh\(\)\)/);
 assert.match(mq5,/if\(AccountInfoInteger\(ACCOUNT_TRADE_MODE\)!=ACCOUNT_TRADE_MODE_DEMO\)/);
 assert.match(mq5,/InpEnableDemoExecution=false/);
 assert.match(mq5,/AccountInfoInteger\(ACCOUNT_TRADE_MODE\)!=ACCOUNT_TRADE_MODE_DEMO/);
});
