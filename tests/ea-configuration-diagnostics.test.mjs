import test from 'node:test';
import assert from 'node:assert/strict';
import {eaConfiguration} from '../worker/src/agent-hub.mjs';
test('EA configuration diagnostics whitelist build/capability/test settings and exclude credentials and account identity',()=>{
 const result=eaConfiguration({clientBuild:'0.28.0',licenseHash:'SECRET',licenseId:'PRIVATE',account:{login:'PRIVATE',server:'PRIVATE',mode:'DEMO',test_symbol:'XAUUSD.p',test_lots:0.01},capabilities:['test-config-v1']});
 assert.deepEqual(result,{build:'0.28.0',capabilities:['test-config-v1'],mode:'DEMO',test_symbol:'XAUUSD.p',test_lots:0.01});assert.doesNotMatch(JSON.stringify(result),/PRIVATE|SECRET/);
 assert.equal(eaConfiguration({clientBuild:'arbitrary header'}).build,null);
});
