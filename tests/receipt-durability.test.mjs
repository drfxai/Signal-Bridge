import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ReceiptOutbox} from '../agent-windows/receipt-outbox.mjs';

function tempJournal(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'signalbridge-outbox-'));
 return {dir,file:path.join(dir,'receipt-outbox.jsonl')};
}
const receipt=(status='FILLED',detail='broker confirmed')=>({type:'receipt',command_id:'cmd-1',status,broker_ticket:'12345',broker_retcode:10009,detail});

test('receipt outbox survives Agent restart until explicit acknowledgement',()=>{
 const {dir,file}=tempJournal();
 try{
  const a=new ReceiptOutbox(file);a.queue(receipt());
  assert.equal(a.size,1);assert.equal(a.has('cmd-1','FILLED'),true);
  const restarted=new ReceiptOutbox(file);
  assert.equal(restarted.size,1);assert.equal(restarted.pending(0,true)[0].receipt.broker_ticket,'12345');
  assert.equal(restarted.acknowledge('cmd-1','FILLED'),true);
  assert.equal(new ReceiptOutbox(file).size,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('same command/status replaces receipt evidence instead of creating duplicate keys',()=>{
 const {dir,file}=tempJournal();
 try{
  const a=new ReceiptOutbox(file);a.queue(receipt('FILLED','first'));a.queue(receipt('FILLED','updated'));
  assert.equal(a.size,1);assert.equal(a.pending(0,true)[0].receipt.detail,'updated');
  const restarted=new ReceiptOutbox(file);
  assert.equal(restarted.size,1);assert.equal(restarted.pending(0,true)[0].receipt.detail,'updated');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('receipt retry uses exponential backoff but force flush bypasses the timer',()=>{
 const {dir,file}=tempJournal();
 try{
  const a=new ReceiptOutbox(file,{baseRetryMs:5000,maxRetryMs:300000}),key=a.queue(receipt());
  assert.equal(a.pending(1000,false).length,1);
  a.markSent(key,1000);
  assert.equal(a.pending(5999,false).length,0);
  assert.equal(a.pending(6000,false).length,1);
  assert.equal(a.pending(1001,true).length,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('journal fsync log is append-only and malformed trailing lines do not destroy prior receipts',()=>{
 const {dir,file}=tempJournal();
 try{
  const a=new ReceiptOutbox(file);a.queue(receipt());
  fs.appendFileSync(file,'{broken json\n');
  const restarted=new ReceiptOutbox(file);
  assert.equal(restarted.has('cmd-1','FILLED'),true);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
