import fs from 'node:fs';
import path from 'node:path';

const clean=v=>String(v??'').replace(/[|\r\n]/g,' ').slice(0,240);

export class ReceiptOutbox{
 constructor(filePath,{baseRetryMs=5000,maxRetryMs=300000}={}){
  this.filePath=path.resolve(filePath);this.baseRetryMs=baseRetryMs;this.maxRetryMs=maxRetryMs;this.map=new Map();
  fs.mkdirSync(path.dirname(this.filePath),{recursive:true});this.#load();
 }
 key(commandId,status){return clean(commandId)+'|'+clean(status)}
 #append(record){
  const fd=fs.openSync(this.filePath,'a');
  try{fs.writeSync(fd,JSON.stringify(record)+'\n');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
 }
 #load(){
  if(!fs.existsSync(this.filePath))return;
  for(const line of fs.readFileSync(this.filePath,'utf8').split(/\r?\n/)){
   if(!line.trim())continue;
   try{
    const x=JSON.parse(line);
    if(x.op==='add'&&x.key&&x.receipt)this.map.set(x.key,{receipt:x.receipt,attempts:0,nextRetryAt:0});
    else if(x.op==='ack'&&x.key)this.map.delete(x.key);
   }catch{}
  }
 }
 queue(receipt){
  const normalized={...receipt,command_id:clean(receipt.command_id),status:clean(receipt.status),broker_ticket:receipt.broker_ticket?clean(receipt.broker_ticket):null,detail:clean(receipt.detail)};
  const key=this.key(normalized.command_id,normalized.status),prev=this.map.get(key);
  if(!prev||JSON.stringify(prev.receipt)!==JSON.stringify(normalized)){
   this.#append({op:'add',key,receipt:normalized});this.map.set(key,{receipt:normalized,attempts:0,nextRetryAt:0});
  }
  return key;
 }
 acknowledge(commandId,status){
  const key=this.key(commandId,status);if(!this.map.has(key))return false;
  this.#append({op:'ack',key});this.map.delete(key);return true;
 }
 pending(now=Date.now(),force=false){
  const out=[];for(const [key,entry] of this.map)if(force||entry.nextRetryAt<=now)out.push({key,receipt:entry.receipt});return out;
 }
 markSent(key,now=Date.now()){
  const entry=this.map.get(key);if(!entry)return;
  entry.attempts+=1;
  const delay=Math.min(this.maxRetryMs,this.baseRetryMs*Math.pow(2,Math.min(entry.attempts-1,6)));
  entry.nextRetryAt=now+delay;
 }
 has(commandId,status){return this.map.has(this.key(commandId,status))}
 get size(){return this.map.size}
}
