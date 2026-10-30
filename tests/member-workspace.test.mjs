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
