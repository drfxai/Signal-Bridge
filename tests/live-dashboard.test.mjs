import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const ui=fs.readFileSync(new URL('../worker/src/dashboard-ui.mjs',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../worker/src/index.mjs',import.meta.url),'utf8');
const hub=fs.readFileSync(new URL('../worker/src/agent-hub.mjs',import.meta.url),'utf8');

test('live dashboard is backed by authenticated APIs and observer websocket',()=>{
 assert.match(ui,/\/v1\/dashboard\/summary/);
 assert.match(ui,/\/v1\/dashboard\/ws/);
 assert.match(ui,/signalbridge-dashboard-v1/);
 assert.doesNotMatch(ui,/Math\.random/);
 assert.doesNotMatch(ui,/Synthetic signal|simulated figures/i);
});

test('dashboard route is the product root and retains a separate test endpoint',()=>{
 assert.match(index,/location:'\/dashboard'/);
 assert.match(index,/url\.pathname==='\/dashboard'/);
 assert.match(index,/url\.pathname==='\/test'/);
 assert.match(index,/content-security-policy/);
});

test('observer sockets cannot supersede or submit agent commands',()=>{
 assert.match(hub,/role:'observer'/);
 assert.match(hub,/a\.role==='observer'/);
 assert.match(hub,/OBSERVER_READ_ONLY/);
 assert.match(hub,/currentAgentSockets\(\)/);
 assert.match(hub,/signalbridge-dashboard-v1/);
});

test('live dashboard displays only durable/backend account state',()=>{
 for(const token of ['counts?.commands','counts?.signals','counts?.telegram_updates','terminal_online','broker_ticket'])
  assert.match(ui,new RegExp(token.replace(/[?.]/g,m=>m==='?'?'\\?':'\\.')));
});


test('MTProto Telegram Account Connector is UI-only and explicitly inactive',()=>{
 assert.match(ui,/Telegram Account Connector/);
 assert.match(ui,/MTProto/);
 assert.match(ui,/COMING SOON/);
 assert.match(ui,/به‌زودی/);
 assert.doesNotMatch(index,/\/v1\/.*mtproto/i);
 assert.doesNotMatch(index,/api_hash|api_id|phone_number|telegram_session/i);
});
