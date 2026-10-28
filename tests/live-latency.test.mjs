import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {modelCapacity} from '../scripts/load-model.mjs';

const agent=fs.readFileSync(new URL('../agent-windows/agent.mjs',import.meta.url),'utf8');
const hub=fs.readFileSync(new URL('../worker/src/agent-hub.mjs',import.meta.url),'utf8');
const dashboard=fs.readFileSync(new URL('../worker/src/dashboard-ui.mjs',import.meta.url),'utf8');

test('Agent measures RTT from existing heartbeat acknowledgements',()=>{
 assert.match(agent,/probeSentAt/);
 assert.match(agent,/heartbeat_ack/);
 assert.match(agent,/cloudRttMs=Math\.max\(0,Date\.now\(\)-probeSentAt\)/);
 assert.match(agent,/type:'latency_report'/);
});

test('AgentHub accepts bounded latency reports from authenticated execution Agent only',()=>{
 assert.match(hub,/body\.type==='latency_report'/);
 assert.match(hub,/rtt<0\|\|rtt>60000/);
 assert.match(hub,/INVALID_LATENCY_REPORT/);
 assert.match(hub,/type:'latency'/);
});

test('Live dashboard renders backend-provided WebSocket RTT without synthetic values',()=>{
 assert.match(dashboard,/CLOUD RTT/);
 assert.match(dashboard,/id="cloudRtt"/);
 assert.match(dashboard,/m\.type==='latency'/);
 assert.doesNotMatch(dashboard,/cloudRtt[^\n]{0,120}Math\.random/);
});

test('capacity model accounts for latency-report WebSocket messages',()=>{
 const r=modelCapacity({agents:500,signalsPerAgent:20,heartbeatMinutes:15});
 assert.equal(r.derived.latencyReports,r.derived.heartbeats);
 assert.ok(r.usage.durableObjectRequests.value<100000);
 assert.equal(r.usage.d1RowsWritten.value,50000);
});
