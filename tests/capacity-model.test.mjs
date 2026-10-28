import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {modelCapacity} from '../scripts/load-model.mjs';

test('capacity model is offline and never targets production network',()=>{
 const src=fs.readFileSync(new URL('../scripts/load-model.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(src,/\bfetch\s*\(/);
 assert.doesNotMatch(src,/new\s+WebSocket/);
 assert.doesNotMatch(src,/signalbridge\.drfx\.online/);
});

test('500 agents at 20 signals/day stays below hard request ceilings under baseline assumptions',()=>{
 const r=modelCapacity({agents:500,signalsPerAgent:20,reconnectsPerAgent:1,heartbeatMinutes:15,receiptsPerSignal:2,d1WritesPerSignal:5});
 assert.equal(r.derived.signals,10000);
 assert.ok(r.usage.workerRequests.value<r.usage.workerRequests.limit);
 assert.ok(r.usage.d1RowsWritten.value<r.usage.d1RowsWritten.limit);
 assert.ok(r.usage.durableObjectRequests.value<r.usage.durableObjectRequests.limit);
});

test('1000 agents at baseline write amplification reaches the migration boundary',()=>{
 const r=modelCapacity({agents:1000,signalsPerAgent:20,d1WritesPerSignal:5});
 assert.equal(r.usage.d1RowsWritten.value,100000);
 assert.equal(r.status.d1RowsWritten,'EXCEEDS_FREE');
});

test('shorter application heartbeats increase DO request pressure',()=>{
 const slow=modelCapacity({agents:500,signalsPerAgent:5,heartbeatMinutes:15});
 const fast=modelCapacity({agents:500,signalsPerAgent:5,heartbeatMinutes:1});
 assert.ok(fast.usage.durableObjectRequests.value>slow.usage.durableObjectRequests.value);
});
