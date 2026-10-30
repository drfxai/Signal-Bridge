import test from 'node:test';
import assert from 'node:assert/strict';
import {EXECUTION_HTML,EXECUTION_JS} from '../site/src/portal-execution.mjs';
import {SITE_HTML} from '../site/src/ui.mjs';
import {MINI_HTML} from '../site/src/telegram-mini.mjs';
test('unified website and mini workspace retain unique backend control targets',()=>{
 for(const html of [EXECUTION_HTML,SITE_HTML,MINI_HTML]){
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  for(const id of ['reportNet','reportSignals','reportProfit','reportLoss','reportTP1','reportTP2','reportStops','reportFloating','resetReport','checkConnectionAction','startTimedTest','dailyDD','workspaceDetail','workspaceRefresh','workspaceEquity'])assert.equal(ids.filter(v=>v===id).length,1,id);
 }
});
test('generated member runtime remains valid after adding drawers and metric animation',()=>{
 assert.doesNotThrow(()=>new Function(EXECUTION_JS));
 assert.match(EXECUTION_HTML,/aria-labelledby="workspaceDetailTitle"/);
 assert.match(EXECUTION_HTML,/aria-label="Chart display"/);
 assert.match(EXECUTION_HTML,/id="workspaceLicenseSummary"/);
});
test('setup is shared by both surfaces with distinct personal and channel hooks',()=>{
 for(const html of [SITE_HTML,MINI_HTML]){
  for(const id of ['memberSetup','setupBridgeDownload','setupScalperDownload','setupLicense','setupChannel','setupMt5Hook','setupChannelHook'])assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id);
 }
 assert.match(EXECUTION_JS,/\/api\/channels\/webhook/);
 assert.match(EXECUTION_JS,/\/api\/downloads/);
 assert.match(EXECUTION_JS,/setupLicense'\)\.type='password'/);
});

test('reference signal routes default ON but execution requires separate explicit approval',async()=>{
 const {SETUP_HTML,SETUP_JS}=await import('../site/src/member-setup.mjs');
 const {readFileSync}=await import('node:fs');
 const controls=readFileSync('site/src/member-controls.mjs','utf8');
 const ingress=readFileSync('worker/src/index.mjs','utf8');
 const migration=readFileSync('site/migrations/0016_tv_mt5_route_preference.sql','utf8');
 for(const id of ['setupTvMt5','setupTvTelegram','setupTelegramEnable','setupExecutionMode'])
  assert.ok(SETUP_HTML.includes('id="'+id+'"'),id);
 assert.match(SETUP_JS,/routeSettings\?\.tv_to_mt5!==false/);
 assert.match(SETUP_JS,/toggleRoute\('tv_to_mt5'\)/);
 assert.match(SETUP_JS,/if\(key==='tv_to_mt5'\)/);
 assert.match(SETUP_JS,/Enable DEMO execution/);
 assert.match(SETUP_JS,/confirm\('Enable DEMO execution/);
 assert.ok(controls.includes('tv_to_mt5:r?.tv_to_mt5!==0'));
 assert.ok(controls.includes('tv_to_mt5=excluded.tv_to_mt5'));
 assert.match(migration,/DEFAULT 1 CHECK\(tv_to_mt5 IN \(0,1\)\)/);
 assert.ok(ingress.includes("SELECT tv_to_mt5 FROM member_signal_settings"));
 assert.ok(ingress.includes("status:'ROUTE_DISABLED'"));
 assert.doesNotThrow(()=>new Function(SETUP_JS));
});
