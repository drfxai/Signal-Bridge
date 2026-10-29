import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const readme=fs.readFileSync(new URL('../README.md',import.meta.url),'utf8');
const rootPkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));

test('repository home points to the premium product UI and live surfaces',()=>{
 assert.match(readme,/design\/index\.html/);
 assert.match(readme,/design\/telegram-webapp\.html/);
 assert.match(readme,/design\/telegram-bot-flow\.html/);
 assert.match(readme,/https:\/\/signalbridge\.drfx\.online\/dashboard/);
 assert.match(readme,/https:\/\/signalbridge\.drfx\.online\/test/);
});

test('standard V3 install is one EA and one webhook without companion setup',()=>{
 assert.match(readme,/One MT5 EA/i);
 assert.match(readme,/one TradingView webhook/i);
 assert.match(readme,/no Node\.js, no PowerShell, no local Windows Agent/i);
 assert.doesNotMatch(readme,/Install-SignalBridge\.ps1/);
 assert.doesNotMatch(readme,/Start-SignalBridge-Agent\.cmd/);
});

test('README advertises exact launch pricing',()=>{
 assert.match(readme,/\$0 for 1 month/);
 assert.match(readme,/\$47/);
 assert.match(readme,/\$165/);
 assert.match(readme,/one full month free/i);
});

test('README advertises current direct-EA metadata',()=>{
 assert.match(readme,/EA v0\.27\.1/);
 assert.match(readme,/\/v1\/ea\/ws/);
 assert.equal(rootPkg.version,'3.0.0');
});
