import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {EXECUTION_JS} from '../site/src/portal-execution.mjs';

test('trade click waits for an ongoing connection check before opening account confirmation',async()=>{
 const elements=new Map();
 const get=id=>{if(!elements.has(id))elements.set(id,{textContent:'',style:{setProperty(){}},dataset:{},setAttribute(){},replaceChildren(){},append(){},value:'',classList:{toggle(){},add(){},remove(){}},querySelectorAll:()=>[],animate(){},getClientRects:()=>[{}],showModal(){this.open=true},close(){this.open=false}});return elements.get(id)};
 let resolve,calls=0;const response=new Promise(r=>resolve=r);
 runInNewContext(EXECUTION_JS,{document:{createElement:()=>({textContent:''}),getElementById:get,documentElement:{lang:'en'},visibilityState:'visible'},window:{addEventListener(){}},sessionStorage:{getItem:()=>null},fetch:()=>{calls++;return response},setTimeout(){},setInterval(){},clearInterval(){},matchMedia:()=>({matches:true})});
 get('checkConnectionAction').onclick();
 const pending=get('startTimedTest').onclick();
 assert.equal(calls,1);assert.equal(get('tradeTestConfirm').open,undefined);
 resolve({ok:true,json:async()=>({diagnostic:{terminal_online:true,mt5_mode:'DEMO',mt5_account:{login:'123',server:'Fixture'},capabilities:['timed-test-v2']}})});
 await new Promise(r=>setImmediate(r));
 assert.equal(get('tradeTestConfirm').open,true);
 get('cancelTradeTest').onclick();await pending;
 assert.equal(calls,1);assert.equal(get('startTimedTest').disabled,false);
});
