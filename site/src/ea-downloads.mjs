// Public binaries contain no customer licenses. Entitlements are issued separately.
export const EA_RELEASES=Object.freeze({
 signalbridge:Object.freeze({filename:'DrFX_SignalBridge_EA.ex5',version:'Current compiled build',bytes:307016,sha256:'43db78d1785c84aed0d53c75661c4093236a9393c03da2e8b8ed0ce870551ea5',source:'https://github.com/drfxai/Signal-Bridge/releases/download/ea-latest/DrFX_SignalBridge_EA.ex5'}),
 scalper:Object.freeze({filename:'DrFX_Scalper_Pro.ex5',version:'Current compiled build',bytes:207554,sha256:'a3f6ee91d469b6ba20eb07a59b43564f1dec54b0cceb6c67e62da3589a0ca815',source:'/downloads/DrFX_Scalper_Pro.ex5'})
});
export function eaDownloadCatalog(){return Object.fromEntries(Object.entries(EA_RELEASES).map(([product,r])=>[product,{version:r.version,url:'https://drfx.company/download/'+r.filename,format:'EX5',bytes:r.bytes,sha256:r.sha256}]))}

// Bound buffering to the reviewed binary size; reject HTML, source, truncation or replacement.
export async function verifiedBinary(response,release){
 if(!response.ok||!response.body)throw Error('BINARY_UNAVAILABLE');
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>release.bytes)throw Error('BINARY_SIZE');chunks.push(value)}}
 catch(e){await reader.cancel().catch(()=>{});throw e}finally{reader.releaseLock()}
 if(size!==release.bytes)throw Error('BINARY_SIZE');
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
 if(bytes[0]!==69||bytes[1]!==88||bytes[2]!==53||bytes[3]!==2)throw Error('BINARY_FORMAT');
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 if(digest!==release.sha256)throw Error('BINARY_INTEGRITY');
 return bytes;
}
export async function eaDownload(request,env){
 const path=new URL(request.url).pathname;
 const release=Object.values(EA_RELEASES).find(r=>path==='/download/'+r.filename);
 const headers={'cache-control':'no-store','x-content-type-options':'nosniff'};
 if(!release)return new Response('Not found',{status:404,headers});
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405,headers:{...headers,allow:'GET, HEAD'}});
 try{
  const source=new Request(new URL(release.source,'https://drfx.company'),{signal:AbortSignal.timeout(20000),headers:{'user-agent':'DrFX-SignalBridge-Downloads','accept':'application/octet-stream'}});
  const response=release.source.startsWith('/')?await env.ASSETS.fetch(source):await fetch(source);
  const bytes=await verifiedBinary(response,release);
  return new Response(request.method==='HEAD'?null:bytes,{headers:{...headers,'content-type':'application/octet-stream','content-disposition':'attachment; filename="'+release.filename+'"','content-length':String(bytes.length),'x-checksum-sha256':release.sha256}});
 }catch{return new Response('Compiled download temporarily unavailable. Please retry.',{status:503,headers:{...headers,'retry-after':'60'}})}
}

