import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {SIGNAL_BRIDGE_WIDGET_HTML,bridgeWidgetData} from '../site/src/telegram-widgets.mjs';
import {SIGNAL_HISTORY_WIDGET_HTML,signalHistoryWidgetData} from '../site/src/telegram-signal-widget.mjs';
import {SCALPER_WIDGET_HTML,scalperWidgetData} from '../site/src/telegram-scalper-widget.mjs';

function boot(html,initial,responses={}){
 const els=new Map(),events=new Map(),calls=[];
 const get=id=>{if(!els.has(id))els.set(id,{textContent:'',className:'',disabled:false,hidden:false});return els.get(id)};
 const widget={
  chatData:initial,
  onEvent(name,handler){events.set(name,handler)},
  ready(){calls.push('ready')},
  request(action){calls.push(action);return Promise.resolve({result:JSON.stringify(responses[action]||{message:'Updated'})})}
 };
 const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 assert.equal(scripts.length,1,'one self-contained script per widget');
 vm.runInNewContext(scripts[0],{window:{TelegramWidget:widget},document:{getElementById:get},console},{timeout:1000});
 return {get,calls,events,widget};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('private member widget renders D1-derived plan and updates after refresh',async()=>{
 const data=bridgeWidgetData({plan:'trial',licenseStatus:'active',expiresAt:'2026-12-10',accountStatus:'active'});
 const w=boot(SIGNAL_BRIDGE_WIDGET_HTML,data,{'sb:refresh':{account:'active',plan:'annual',license:'active',expires:'2027-11-10',message:'Account refreshed'}});
 assert.equal(w.get('plan').textContent,'TRIAL');
 assert.equal(w.get('license').textContent,'ACTIVE');
 assert.equal(w.get('expires').textContent,'2026-12-10');
 w.get('refresh').onclick();
 await tick();
 assert.ok(w.calls.includes('sb:refresh'));
 assert.equal(w.get('plan').textContent,'ANNUAL');
 assert.equal(w.get('expires').textContent,'2027-11-10');
});
test('signal card renders only the recorded alert and refreshes through its own callback',async()=>{
 const initial=signalHistoryWidgetData({normalized_json:JSON.stringify({symbol:'XAUUSD',side:'BUY',order:{reference_price:4075,stop_loss:4065,take_profits:[4085,4090,4100]}}),received_at:'2026-11-10 10:00:00'});
 const newer={empty:false,symbol:'EURUSD',side:'SELL',entry:1.10,sl:1.11,tps:[1.09],received:'2026-11-10 10:30:00'};
 const w=boot(SIGNAL_HISTORY_WIDGET_HTML,initial,{'sb:signal:refresh':{data:newer,message:'Record refreshed'}});
 assert.equal(w.get('symbol').textContent,'XAUUSD');
 assert.equal(w.get('tp3').textContent,'4100');
 w.get('refresh').onclick();await tick();
 assert.ok(w.calls.includes('sb:signal:refresh'));
 assert.equal(w.get('symbol').textContent,'EURUSD');
 assert.equal(w.get('side').textContent,'SELL');
 assert.equal(w.get('tp2').textContent,'—');
});
test('Scalper card renders issued licenses but never reveals secret keys',async()=>{
 const init=scalperWidgetData({total:2,plan:'quarterly',days:90,created_at:'2026-11-10 10:00:00'});
 const w=boot(SCALPER_WIDGET_HTML,init,{'sb:scalper:refresh':{data:{total:3,plan:'annual',days:365,issued:'2026-11-10'},message:'Licenses refreshed'}});
 assert.equal(w.get('total').textContent,2);
 assert.equal(w.get('days').textContent,'90 days');
 w.get('refresh').onclick();await tick();
 assert.ok(w.calls.includes('sb:scalper:refresh'));
 assert.equal(w.get('total').textContent,3);
 assert.equal(w.get('plan').textContent,'annual');
 for(const html of [SIGNAL_BRIDGE_WIDGET_HTML,SIGNAL_HISTORY_WIDGET_HTML,SCALPER_WIDGET_HTML])assert.doesNotMatch(html,/api\.telegram\.org|bot\d+:[A-Za-z0-9_-]{20,}/);
});
test('chatDataChanged redraws the widget without a network call',()=>{
 const w=boot(SCALPER_WIDGET_HTML,JSON.stringify({total:1,plan:'trial'}));
 w.widget.chatData=JSON.stringify({total:6,plan:'annual',days:365});
 w.events.get('chatDataChanged')();
 assert.equal(w.get('total').textContent,6);
 assert.deepEqual(w.calls,['ready']);
});
