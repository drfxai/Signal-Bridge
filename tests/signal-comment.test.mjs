import test from 'node:test';
import assert from 'node:assert/strict';
import {parseGodModeAlert} from '../worker/src/godmode-parser.mjs';
import {tradeComment} from '../worker/src/signal-metadata.mjs';

test('tagged signals preserve engine names and chart timeframe within the MT5 comment limit',()=>{
 const p={event:'entry',signal_id:'gold-5s',symbol:'XAUUSD',side:'BUY',sl:2300,tp1:2350,tp2:2360,tf:'5S',engines:['Scalper']};
 const parse=x=>parseGodModeAlert('[[DRFX]]'+JSON.stringify(x)+'[[/DRFX]]');
 const comment=x=>tradeComment({type:'tradingview',...parse(x).signal.metadata});
 assert.equal(comment(p),'T5s:Scalper');
 assert.equal(comment({...p,tf:'3',engines:['Scalper','LIT','ICT']}),'T3m:Sc+LIT+ICT');
 assert.equal(comment({...p,tf:undefined,engines:undefined}),'');
 const many=comment({...p,engines:['Scalper','Silver Bullet','Opening Range','Supply Demand','ICT','LIT']});
 assert.match(many,/^T5s:.*\+5$/);
 assert.ok(('SB:123456789012:'+many).length<=31);
});
