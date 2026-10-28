import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../design/index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../design/styles.css',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../design/app.js',import.meta.url),'utf8');
const webapp=fs.readFileSync(new URL('../design/telegram-webapp.html',import.meta.url),'utf8');
const bot=fs.readFileSync(new URL('../design/telegram-bot-flow.html',import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../worker/src/index.mjs',import.meta.url),'utf8');
const hub=fs.readFileSync(new URL('../worker/src/agent-hub.mjs',import.meta.url),'utf8');
const command=fs.readFileSync(new URL('../worker/src/command.mjs',import.meta.url),'utf8');

test('V3 product UI carries the one-EA one-webhook promise',()=>{
 assert.match(app,/No Node\.js\. No PowerShell\. No Windows Agent/);
 assert.match(app,/ONE EA/);
 assert.match(app,/ONE WEBHOOK/);
 assert.match(app,/Direct MT5 EA/i);
});

test('pricing is exactly one month free, 47 quarterly and 165 yearly',()=>{
 assert.match(app,/FIRST MONTH FREE/);
 assert.match(app,/\$47/);
 assert.match(app,/\$165/);
 assert.doesNotMatch(app,/\$59|\$69|\$129|\$149/);
});

test('responsive system explicitly covers desktop tablet and mobile',()=>{
 assert.match(app,/DESKTOP COMMAND CENTER/);
 assert.match(app,/TABLET CONTROL/);
 assert.match(app,/MOBILE QUICK VIEW/);
 assert.match(css,/@media\(max-width:1180px\)/);
 assert.match(css,/@media\(max-width:820px\)/);
 assert.match(css,/@media\(max-width:520px\)/);
 assert.match(html,/mobile-nav/);
});

test('Telegram Bot and Web App have dedicated premium surfaces',()=>{
 assert.match(app,/Telegram Bot Connector/);
 assert.match(app,/Telegram Web App/);
 assert.match(webapp,/TELEGRAM WEB APP/);
 assert.match(bot,/TELEGRAM BOT UX/);
});

test('MTProto remains visible but inactive',()=>{
 assert.match(app,/Telegram Account Connector/);
 assert.match(app,/COMING SOON/);
 assert.match(app,/به‌زودی/);
 assert.doesNotMatch(index,/\/v1\/.*mtproto/i);
});

test('direct EA endpoint and line protocol exist alongside legacy rollback transport',()=>{
 assert.match(index,/\/v1\/ea\/ws/);
 assert.match(index,/openEaSocket/);
 assert.match(hub,/signalbridge-ea-v1/);
 assert.match(hub,/encodeEaCommand/);
 assert.match(hub,/p\[0\]==='HELLO'/);
 assert.match(hub,/p\[0\]==='RCPT'/);
 assert.match(command,/correlation_tag/);
 assert.match(command,/correlationTag/);
});


test('direct EA persists broker receipts locally until cloud acknowledgement',()=>{
 const ea=fs.readFileSync(new URL('../mt5/DrFX_SignalBridge_EA_v0.24.mq5',import.meta.url),'utf8');
 assert.match(ea,/MAX_RECEIPTS 64/);
 assert.match(ea,/ReceiptFile\(\)/);
 assert.match(ea,/ReceiptSave\(\)/);
 assert.match(ea,/ReceiptLoad\(\)/);
 assert.match(ea,/QueueReceipt\(/);
 assert.match(ea,/FlushReceipts\(\)/);
 assert.match(ea,/ClearReceipt\(/);
 assert.match(ea,/SignalBridge_receipts_/);
 assert.match(ea,/INVALID_TRANSITION/);
});

test('direct EA migration derives correlation tag when an older pending command lacks it',()=>{
 assert.match(hub,/function eaCorrelationTag/);
 assert.match(hub,/c\.correlation_tag\|\|eaCorrelationTag\(c\.correlation_id\|\|c\.command_id\)/);
});
