export const EXECUTION_HTML=`<div class="execution-controls" style="display:grid;gap:10px;margin-top:14px;min-width:0">
 <label for="executionMode">TradingView execution</label><select id="executionMode" style="width:100%;padding:12px;background:#06101d;color:#ffcc62;border:1px solid #17446d;border-radius:8px"><option value="dry_run">Dry Run · no orders</option><option value="demo_execute">Demo · automatic orders</option></select>
 <button type="button" id="saveExecutionMode" class="btn btn-outline">Apply mode</button>
 <button type="button" id="startTimedTest" class="btn btn-gold">Test Connection · BUY Gold 0.01 / close after 5s</button>
 <p id="executionFeedback" role="status" aria-live="polite" style="overflow-wrap:anywhere;font-size:12px">Demo account only. Enable both EA demo execution and connection test inputs. MT5 must remain running for local timed closure.</p>
</div>`;
// This function is serialized into each client's existing JavaScript asset.
function mount(){
 const get=id=>document.getElementById(id);if(!get('startTimedTest'))return;
 let pending=false,requestBusy=false,pollTimer=null,testId=null;
 const key='signalbridge.pendingConnectionTest';
 try{testId=sessionStorage.getItem(key)}catch{}
 const say=text=>{get('executionFeedback').textContent=text};
 async function api(path,body){
  const resp=await fetch(path,{credentials:'same-origin',method:body===undefined?'GET':'POST',headers:{'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await resp.json();if(!resp.ok)throw Error(data.error||'SERVICE_UNAVAILABLE');return data;
 }
 async function poll(){
  if(!testId)return;
  try{
   const {test:t}=await api('/api/connection/test-status?id='+encodeURIComponent(testId));
   say('Test '+t.status+' · '+(t.detail||t.command_status||'Awaiting EA broker report'));
   if(['CLOSED','REJECTED'].includes(t.status)||['REJECTED','BROKER_REJECTED','ACCOUNT_MISMATCH'].includes(t.command_status)){
    pending=false;testId=null;try{sessionStorage.removeItem(key)}catch{}get('startTimedTest').disabled=false;return;
   }
  }catch(e){say('Test status unavailable: '+e.message+'. Verify the test position in MT5.');}
  pollTimer=setTimeout(poll,3000);
 }
 get('startTimedTest').addEventListener('click',async()=>{
  if(pending||requestBusy)return;
  if(!confirm('DEMO ONLY: buy XAUUSD 0.01 at market and request local closure after 5 seconds. Keep MT5 and this EA running. Broker/network delays can postpone closure. Continue?'))return;
  requestBusy=true;get('startTimedTest').disabled=true;
  try{
   const result=await api('/api/connection/test-demo',{confirm:true});
   testId=result.test_id;pending=true;try{sessionStorage.setItem(key,testId)}catch{}
   say('Test queued. Awaiting actual EA and broker evidence.');await poll();
  }catch(e){say('Test not confirmed: '+e.message+'. Check MT5 before retrying.');}
  finally{requestBusy=false;get('startTimedTest').disabled=pending;}
 });
 get('saveExecutionMode').addEventListener('click',async()=>{
  const mode=get('executionMode').value;
  if(mode==='demo_execute'&&!confirm('Enable automatic DEMO orders for future TradingView alerts? EA demo trading must also be enabled.'))return;
  const b=get('saveExecutionMode');b.disabled=true;
  try{const r=await api('/api/webhook/mode',{mode,confirm:true});say('TradingView mode: '+r.webhook.mode+'. Existing positions are unchanged.');}
  catch(e){say('Mode not changed: '+e.message)}finally{b.disabled=false;}
 });
 // Match the authoritative server mode whenever the portal fetches its webhook.
 document.addEventListener('signalbridge-webhook',event=>{if(!requestBusy)get('executionMode').value=event.detail?.mode||'dry_run';});
 if(testId){pending=true;get('startTimedTest').disabled=true;poll();}
 window.addEventListener('pagehide',()=>clearTimeout(pollTimer),{once:true});
}
export const EXECUTION_JS='\n('+mount.toString()+')();\n';
