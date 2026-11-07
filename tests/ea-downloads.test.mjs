import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import worker from '../site/src/worker.mjs';
import {EA_RELEASES,eaDownloadCatalog,verifiedBinary} from '../site/src/ea-downloads.mjs';

const scalper=readFileSync(new URL('../site/public/downloads/DrFX_Scalper_Pro.ex5',import.meta.url));
const req=(name,method='GET')=>new Request('https://drfx.company/download/'+name,{method});
test('catalog delivers reviewed EX5 files with integrity metadata and no license material',()=>{
 for(const r of Object.values(eaDownloadCatalog())){assert.match(r.url,/^https:\/\/drfx\.company\/download\/[^/]+\.ex5$/);assert.equal(r.format,'EX5');assert.match(r.sha256,/^[a-f0-9]{64}$/);assert.ok(r.bytes>4096)}
 assert.equal(createHash('sha256').update(scalper).digest('hex'),EA_RELEASES.scalper.sha256);
 assert.equal(scalper.length,EA_RELEASES.scalper.bytes);
});
test('public download delivers exact compiled bytes and attachment headers without a session',async()=>{
 const env={ASSETS:{fetch:async request=>{assert.equal(new URL(request.url).pathname,EA_RELEASES.scalper.source);return new Response(scalper)}}};
 const r=await worker.fetch(req(EA_RELEASES.scalper.filename),env);
 assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'application/octet-stream');
 assert.equal(r.headers.get('content-disposition'),'attachment; filename="DrFX_Scalper_Pro.ex5"');
 assert.equal(r.headers.get('x-checksum-sha256'),EA_RELEASES.scalper.sha256);assert.deepEqual(Buffer.from(await r.arrayBuffer()),scalper);
 const head=await worker.fetch(req(EA_RELEASES.scalper.filename,'HEAD'),env);assert.equal(head.status,200);assert.equal(await head.text(),'');assert.equal(head.headers.get('content-length'),String(scalper.length));
});
test('missing, corrupt, oversized, truncated and HTML downloads fail closed',async()=>{
 const corrupt=Buffer.from(scalper);corrupt[100]^=255;
 for(const body of [Buffer.from('<html>Missing</html>'),scalper.subarray(0,100),Buffer.concat([scalper,Buffer.from([0])]),corrupt]){
  const r=await worker.fetch(req(EA_RELEASES.scalper.filename),{ASSETS:{fetch:async()=>new Response(body)}});assert.equal(r.status,503);assert.equal(r.headers.get('content-disposition'),null);
 }
 assert.equal((await worker.fetch(req(EA_RELEASES.scalper.filename),{})).status,503);
 await assert.rejects(()=>verifiedBinary(new Response('missing',{status:404}),EA_RELEASES.scalper));
});
test('source paths, unknown files and mutations cannot be downloaded',async()=>{
 for(const name of ['DrFX_SignalBridge_EA.mq5','keygen.py','licenses.json','unknown.ex5'])assert.equal((await worker.fetch(req(name),{})).status,404);
 assert.equal((await worker.fetch(req(EA_RELEASES.scalper.filename,'POST'),{})).status,405);
});
test('Signal Bridge uses only the fixed release source and rejects substituted bytes',async()=>{
 const original=globalThis.fetch;let requested;
 try{globalThis.fetch=async request=>{requested=request.url;return new Response(scalper)};
 const r=await worker.fetch(req(EA_RELEASES.signalbridge.filename),{SIGNALBRIDGE_EA_DOWNLOAD_URL:'https://example.test/source.mq5'});
 assert.equal(requested,EA_RELEASES.signalbridge.source);assert.equal(r.status,503);
 }finally{globalThis.fetch=original}
});
