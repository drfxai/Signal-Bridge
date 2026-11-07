import {ADMIN_PANEL_HTML,ADMIN_CSS,ADMIN_JS} from './admin-mini.mjs';

export const SITE_ADMIN_BUTTON='<button id="siteAdminOpen" type="button" hidden aria-haspopup="dialog"><span>Admin</span></button>';
export const SITE_ADMIN_HTML=`<dialog id="siteAdminDialog" aria-labelledby="opsTitle"><div class="site-admin-toolbar"><button id="siteAdminClose" type="button">Close ×</button></div><button id="miniAdminShortcut" hidden type="button"></button>${ADMIN_PANEL_HTML}</dialog>`;
export const SITE_ADMIN_CSS=ADMIN_CSS+`
#siteAdminOpen[hidden]{display:none!important}
#siteAdminOpen{width:auto!important;min-width:56px;padding:5px 9px!important;border:1px solid #be9d52!important;border-radius:9px!important;background:#342a15!important;color:#f4d78d!important;font-size:12px!important;font-weight:700!important}
#siteAdminDialog{box-sizing:border-box;width:min(1180px,calc(100vw - 24px));max-width:none;height:calc(100dvh - 24px);max-height:none;margin:auto;padding:18px;border:1px solid #9d8048;border-radius:18px;background:#060c17;color:#edf2fb;overflow:auto}
#siteAdminDialog::backdrop{background:#02060de8;backdrop-filter:blur(8px)}
#siteAdminDialog .site-admin-toolbar{display:flex;justify-content:flex-end;position:sticky;top:0;z-index:2;pointer-events:none}
#siteAdminClose{pointer-events:auto;padding:9px 15px;border:1px solid #63728b;border-radius:9px;background:#101c2d;color:#f4d78d;font:inherit;font-size:13px;font-weight:600;line-height:1.4;cursor:pointer}
#siteAdminDialog .ops{padding-top:8px}#adminPanel,#memberAdminWorkspace{display:none!important}
@media(max-width:700px){#siteAdminDialog{padding:12px;width:calc(100vw - 12px);height:calc(100dvh - 12px);border-radius:12px}#siteAdminOpen{min-width:50px;font-size:11px!important}}
`;

// The website and Mini App share the console; only their navigation shells differ.
export const SITE_ADMIN_JS=String.raw`
(()=>{
 const dialog=$('siteAdminDialog'),entry=$('siteAdminOpen');if(!dialog||!entry)return;
 let locale=document.documentElement.lang||'en',previousTab=null,opening=false;
 const set=(id,value)=>{$(id).textContent=value};
 async function api(path,body){
  try{return await call(path,body===undefined?'GET':'POST',body??null)}
  catch(e){if(e.message==='UNAUTHENTICATED'||e.message==='FORBIDDEN'){if(e.message==='UNAUTHENTICATED')state.user=null;else if(state.user)state.user={...state.user,role:'user'};closeConsole();syncAccess()}throw e}
 }
`+ADMIN_JS+String.raw`
 function closeConsole(){
  leaveMiniAdmin(true);if(dialog.open)dialog.close();
  if(previousTab===null)delete document.body.dataset.tab;else document.body.dataset.tab=previousTab;
  previousTab=null;
 }
 function syncAccess(){
  const allowed=state.user?.role==='admin';entry.hidden=!allowed;
  if(!allowed){leaveMiniAdmin(true);if(dialog.open)closeConsole()}
 }
 async function openConsole(){
  if(opening||state.user?.role!=='admin')return;opening=true;const identity=state.user.id;
  try{
   const d=await call('/api/me');if(state.user?.id!==identity)return;
   state.user=d.user;syncAccess();if(state.user?.role!=='admin')return;
   if(!dialog.open){previousTab=document.body.dataset.tab??null;document.body.dataset.tab='admin';$('panel-admin').hidden=false;dialog.showModal()}
   locale=document.documentElement.lang||'en';adminLanguage();opsSelectView('overview');await loadMiniAdmin();
  }catch(e){if(e.message==='UNAUTHENTICATED'){state.user=null;syncAccess()}else notice(e.message)}
  finally{opening=false}
 }
 entry.addEventListener('click',openConsole);
 if($('memberAdmin'))$('memberAdmin').onclick=openConsole;
 $('siteAdminClose').onclick=closeConsole;
 dialog.addEventListener('cancel',e=>{e.preventDefault();closeConsole()});
 dialog.addEventListener('close',()=>{if(document.body.dataset.tab==='admin')closeConsole()});
 window.addEventListener('pagehide',closeConsole);
 const legacy=$('adminPanel');if(legacy)new MutationObserver(syncAccess).observe(legacy,{attributes:true,attributeFilter:['class']});
 const portal=$('portalOverlay');if(portal)new MutationObserver(syncAccess).observe(portal,{attributes:true,attributeFilter:['class','aria-hidden']});
 new MutationObserver(()=>{locale=document.documentElement.lang||'en';entry.querySelector('span').textContent=locale==='fa'?'مدیریت':'Admin';$('siteAdminClose').textContent=locale==='fa'?'بستن ×':'Close ×';adminLanguage();if(opsActive())loadMiniAdmin()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 entry.querySelector('span').textContent=locale==='fa'?'مدیریت':'Admin';$('siteAdminClose').textContent=locale==='fa'?'بستن ×':'Close ×';syncAccess();
})();
`;
