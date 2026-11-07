import test from 'node:test';
import assert from 'node:assert/strict';
import {EXECUTION_HTML,EXECUTION_JS} from '../site/src/portal-execution.mjs';
import {ANALYTICS_HTML,ANALYTICS_CSS,ANALYTICS_JS} from '../site/src/member-analytics.mjs';

test('the authenticated member console has a separate responsive analytics workspace',()=>{
 assert.match(EXECUTION_HTML,/id="sbAnalytics"/);
 assert.match(EXECUTION_HTML,/id="sbaPlot"/);
 assert.match(EXECUTION_HTML,/id="sbaCalendar"/);
 assert.match(EXECUTION_HTML,/id="sbaHours"/);
 assert.match(EXECUTION_HTML,/id="sbaHistoryBody"/);
 assert.equal((EXECUTION_HTML.match(/data-sb-tab="analytics"/g)||[]).length,2);
 assert.match(EXECUTION_JS,/sb-tab-analytics/);
 assert.match(EXECUTION_JS,/signalbridge-analytics-data/);
});
test('only broker data can populate the earnings widgets',()=>{
 assert.match(ANALYTICS_JS,/d\.terminal_online/);
 assert.match(ANALYTICS_JS,/reports-v1/);
 assert.match(ANALYTICS_JS,/r\.series\.length===14/);
 assert.match(ANALYTICS_JS,/Verified daily broker P\/L is unavailable/);
 assert.match(ANALYTICS_JS,/not a trade win-rate|Filled/);
 assert.doesNotMatch(ANALYTICS_JS,/Math\.random|sampleTrades|mockTrades|fakePnL/);
 assert.match(ANALYTICS_HTML,/Account P\/L includes broker trades outside Signal Bridge/);
 assert.match(ANALYTICS_HTML,/Requires deal history/);
});
test('analytics uses existing account-scoped report without new high-cost D1 reads',()=>{
 assert.match(EXECUTION_JS,/api\/member\/report/);
 assert.doesNotMatch(ANALYTICS_JS,/fetch\(|\/api\/admin\/|localStorage|sessionStorage/);
 assert.match(ANALYTICS_JS,/textContent/);
 assert.match(ANALYTICS_JS,/replace\(\/\^/);
 assert.match(ANALYTICS_CSS,/@media\(max-width:700px\)/);
});
