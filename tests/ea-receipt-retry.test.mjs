import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {AgentHub} from '../worker/src/agent-hub.mjs';

function receiptHarness(initialStatus, sourceType = 'tradingview') {
 let reads = 0, writes = 0, status = initialStatus, fail = false, testRejected = false;
 const replies = [], broadcasts = [];
 const DB = {
  prepare(sql) {
   return {bind(...args) {
    return {
     sql,
     async first() {
      reads++;
      assert.deepEqual(args, ['command', 'agent']);
      return status ? {status, source_type: sourceType} : null;
     },
     async run() {
      assert.match(sql, /WHERE id=\? AND agent_id=\? AND status=\?/);
      if (fail) return {success: false};
      if (status !== args[6]) return {success: true, meta: {changes: 0}};
      writes++;
      status = args[0];
      return {success: true, meta: {changes: 1}};
     },
    };
   }};
  },
  async batch([rejectTest, update]) {
   assert.match(rejectTest.sql, /UPDATE connection_tests.*status='REJECTED'/);
   if (!fail) testRejected = true;
   return [{success: !fail}, await update.run()];
  },
 };
 const hub = new AgentHub({}, {DB});
 hub.broadcast = event => broadcasts.push(event);
 const ws = {send: reply => replies.push(reply), serializeAttachment() {}};
 return {
  send: status => hub.handleEaMessage(ws, `RCPT|command|${status}|42|10009|broker result`, {agentId: 'agent'}),
  fail: value => {fail = value;},
  counts: () => ({reads, writes}),
  testRejected: () => testRejected,
  replies, broadcasts,
 };
}

test('replayed stored receipts acknowledge without repeating writes or broadcasts', async () => {
 const h = receiptHarness('DELIVERED');
 await h.send('FILLED');
 await h.send('FILLED');
 assert.deepEqual(h.replies, ['RACK|command|FILLED|1', 'RACK|command|FILLED|1']);
 assert.deepEqual(h.counts(), {reads: 1, writes: 1});
 assert.equal(h.broadcasts.length, 1);
});

test('after restart an already stored final result and a late submission are acknowledged without writes', async () => {
 const h = receiptHarness('FILLED');
 await h.send('FILLED');
 await h.send('SUBMITTED');
 assert.deepEqual(h.replies, ['RACK|command|FILLED|1', 'RACK|command|SUBMITTED|1|SUPERSEDED']);
 assert.deepEqual(h.counts(), {reads: 2, writes: 0});
 assert.equal(h.broadcasts.length, 0);
});

test('missing and conflicting final receipts receive negative acknowledgments', async () => {
 const missing = receiptHarness(null);
 await missing.send('FILLED');
 await missing.send('FILLED');
 assert.deepEqual(missing.replies, Array(2).fill('RACK|command|FILLED|0|COMMAND_NOT_FOUND'));
 assert.deepEqual(missing.counts(), {reads: 1, writes: 0});
 const conflict = receiptHarness('BROKER_REJECTED');
 await conflict.send('FILLED');
 assert.deepEqual(conflict.replies, ['RACK|command|FILLED|0|INVALID_TRANSITION']);
 assert.equal(conflict.counts().writes, 0);
});

test('transient storage failure is retried and connection-test rejection commits with the receipt', async () => {
 const h = receiptHarness('DELIVERED', 'test');
 h.fail(true);
 await h.send('REJECTED');
 assert.equal(h.testRejected(), false);
 h.fail(false);
 await h.send('REJECTED');
 assert.equal(h.testRejected(), true);
 assert.deepEqual(h.replies, ['RACK|command|REJECTED|0|RETRY', 'RACK|command|REJECTED|1']);
 assert.deepEqual(h.counts(), {reads: 2, writes: 1});
});

test('EA retries each receipt independently and preserves its outbox until a positive acknowledgment', () => {
 const ea = readFileSync('mt5/DrFX_SignalBridge_EA.mq5', 'utf8');
 assert.match(ea, /void SendReceipt\(int slot,ulong now\)\{\s+if\(!LicenseReady\(\)\|\|now<g_receiptRetryAt\[slot\]\)return/);
 assert.match(ea, /g_receiptRetryAt\[slot\]=now\+delay/);
 assert.match(ea, /if\(slot>=0\)SendReceipt\(slot,GetTickCount64\(\)\)/);
 assert.match(ea, /if\(p\[0\]=="RACK"&&n>=4\)\{if\(p\[3\]=="1"\)\{ClearReceipt/);
});
