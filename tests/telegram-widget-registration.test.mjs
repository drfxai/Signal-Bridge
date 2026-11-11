import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const code=readFileSync(new URL('../site/src/worker.mjs',import.meta.url),'utf8');
const config=readFileSync(new URL('../site/wrangler.jsonc',import.meta.url),'utf8');

test('widget registration preserves existing Telegram webhook updates and secrets',()=>{
 assert.match(code,/async function reconcileWidgetBot\(env\)/);
 assert.match(code,/getWebhookInfo/);
 assert.match(code,/current\?\.url!==target\|\|!existing\.includes\('widget_query'\)/);
 assert.match(code,/concat\('pre_checkout_query'\)/);
 assert.match(code,/secret_token:env\.TELEGRAM_WEBHOOK_SECRET/);
 assert.match(code,/drop_pending_updates:false/);
 assert.match(code,/setMyCommands'.+commands:BOT_COMMANDS_VISIBLE/);
 assert.doesNotMatch(code,/console\.log\(env\.TELEGRAM_BOT_TOKEN/);
});

test('private bot command triggers nonblocking reconciliation; cron is low frequency',()=>{
 assert.match(code,/\['\/start','\/widget','\/signal','\/scalperwidget'\]\.includes\(command\)/);
 assert.match(code,/ctx\?\.waitUntil/);
 assert.match(code,/async scheduled\(controller,env\)/);
 assert.match(code,/Date\.now\(\)-widgetSetupLast<3600000/);
 assert.match(code,/telegramWebhook\(req,env,ctx\)/);
 assert.match(code,/return telegramWebhook\(req,env,ctx\)/);
 assert.match(config,/"crons":\s*\["0 \*\/6 \* \* \*"\]/);
});

