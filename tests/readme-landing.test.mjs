import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const readme=fs.readFileSync(new URL('../README.md',import.meta.url),'utf8');
const rootPkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const agentPkg=JSON.parse(fs.readFileSync(new URL('../agent-windows/package.json',import.meta.url),'utf8'));
const installer=fs.readFileSync(new URL('../install/Install-SignalBridge.ps1',import.meta.url),'utf8');

test('repository home references only committed promotional assets',()=>{
 for(const file of [
  'assets/readme/signalbridge-hero.svg',
  'assets/readme/signalbridge-mt5.svg',
  'assets/readme/signalbridge-telegram.svg',
  'assets/readme/signalbridge-quickstart.svg'
 ]){
  assert.equal(fs.existsSync(new URL('../'+file,import.meta.url)),true,file);
  assert.equal(readme.includes(file),true,file);
 }
});

test('quickstart links the real installer, dashboard and test panel',()=>{
 assert.equal(readme.includes('install\\Install-SignalBridge.ps1'),true);
 assert.equal(readme.includes('https://signalbridge.drfx.online/dashboard'),true);
 assert.equal(readme.includes('https://signalbridge.drfx.online/test'),true);
 assert.match(installer,/Start-SignalBridge-Agent\.cmd/);
 assert.match(installer,/DrFX_SignalBridge_EA\.mq5/);
});

test('installer keeps credentials local and preserves existing config',()=>{
 assert.match(installer,/LOCALAPPDATA/);
 assert.match(installer,/Existing config\.json preserved/);
 assert.equal(installer.includes('PASTE_43_CHARACTER_AGENT_TOKEN_HERE'),false);
});

test('README advertises current release metadata',()=>{
 assert.equal(readme.includes('Windows Agent: **v'+agentPkg.version+'**'),true);
 assert.equal(readme.includes('Current EA: **v0.23**'),true);
 assert.equal(rootPkg.version,'2.6.1');
});
