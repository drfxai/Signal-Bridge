import test from 'node:test';
import assert from 'node:assert/strict';
import {performanceGeometry} from '../site/src/performance-chart.mjs';
test('daily broker chart accumulates signed buckets from a zero baseline',()=>{
 const g=performanceGeometry([10,-25,5]);
 assert.equal(g.total,-10);assert.equal(g.count,3);
 assert.match(g.path,/^M8 /);assert.ok(g.zero>=15&&g.zero<=105);
 assert.ok(g.last>g.zero);assert.match(g.area,/ Z$/);
});
test('empty and invalid history cannot produce a misleading chart',()=>{
 for(const value of [null,[],[1,NaN],[Infinity],['5'],[Number.MAX_VALUE,Number.MAX_VALUE]])assert.equal(performanceGeometry(value),null);
 const zero=performanceGeometry([0,0]);assert.equal(zero.total,0);assert.equal(zero.last,zero.zero);assert.doesNotMatch(zero.path,/NaN|Infinity/);
});
