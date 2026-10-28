import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {EXPERIENCE_HTML,EXPERIENCE_CSS,EXPERIENCE_JS,TELEGRAM_APP_PREVIEW_HTML,TELEGRAM_BOT_PREVIEW_HTML} from '../worker/src/experience-ui.mjs';

const worker=fs.readFileSync(new URL('../worker/src/index.mjs',import.meta.url),'utf8');
const ea=fs.readFileSync(new URL('../mt5/DrFX_SignalBridge_EA_v0.24.mq5',import.meta.url),'utf8');
const canonical=fs.readFileSync(new URL('../mt5/DrFX_SignalBridge_EA.mq5',import.meta.url),'utf8');

test('premium responsive previews are served through isolated endpoints',()=>{
 for(const path of ['/experience/','/experience/styles.css','/experience/app.js','/experience/telegram-webapp.html','/experience/telegram-bot-flow.html'])
  assert.equal(worker.includes("url.pathname==='"+path+"'"),true,path);
 assert.match(EXPERIENCE_HTML,/PRODUCT DESIGN PREVIEW/);
 assert.match(EXPERIENCE_HTML,/SAMPLE TELEMETRY/);
 assert.match(TELEGRAM_APP_PREVIEW_HTML,/NOT CONNECTED TO TELEGRAM/);
 assert.match(TELEGRAM_BOT_PREVIEW_HTML,/NOT A LIVE TELEGRAM CHAT/);
 assert.match(EXPERIENCE_CSS,/@media\(max-width:520px\)/);
 assert.match(EXPERIENCE_JS,/\$47/);
 assert.match(EXPERIENCE_JS,/\$165/);
});

test('preview does not simulate a real billing checkout or active Telegram MTProto',()=>{
 assert.match(EXPERIENCE_JS,/checkout is not connected/i);
 assert.match(EXPERIENCE_JS,/no payment will be taken here/i);
 assert.match(EXPERIENCE_JS,/COMING SOON/);
 assert.match(EXPERIENCE_JS,/one full month free|FIRST MONTH FREE/i);
});

test('EA validates RFC6455 accept before allowing command frames',()=>{
 assert.match(ea,/CRYPT_HASH_SHA1/);
 assert.match(ea,/258EAFA5-E914-47DA-95CA-C5AB0DC85B11/);
 assert.match(ea,/sec-websocket-accept/);
 assert.match(ea,/accept!=expectedAccept/);
 assert.equal(ea,canonical);
});

test('unconfirmed receipt never clears replay protection',()=>{
 assert.match(ea,/if\(p\[0\]=="RACK"&&n>=4\)\{if\(p\[3\]=="1"\)/);
 assert.doesNotMatch(ea,/INVALID_TRANSITION"\);if\(accepted\)/);
 assert.match(ea,/ClearReceipt\(p\[1\],p\[2\]\)/);
});
