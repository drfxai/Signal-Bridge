// Telegram Mini Apps: server-side WebAppData HMAC-SHA256 verification.
// Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
const encoder=new TextEncoder();
const hmacKey=async raw=>crypto.subtle.importKey('raw',raw,{name:'HMAC',hash:'SHA-256'},false,['sign']);
const sign=async(key,data)=>new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(data)));
const toHex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const constEq=(a,b)=>{if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;};

/**
 * Verify a Telegram.WebApp.initData query string.
 * Returns the authenticated Telegram identity, or null on any failure.
 * Call with a server-held BotFather token only. Never trust initDataUnsafe.
 */
export async function verifyTelegramInitData(initData,botToken,now=Date.now()){
 if(typeof initData!=='string'||initData.length<20||initData.length>8192
    ||typeof botToken!=='string'||!/^[0-9]{5,}:[A-Za-z0-9_-]{30,}$/.test(botToken))return null;
 const params=new URLSearchParams(initData);
 const seen=new Set();
 for(const [key] of params){
  if(seen.has(key))return null;
  seen.add(key);
 }
 const hash=params.get('hash');
 const at=params.get('auth_date');
 const rawUser=params.get('user');
 if(!/^[0-9a-f]{64}$/i.test(hash||'')||! /^[0-9]{10,11}$/.test(at||'')||!rawUser)return null;
 const nowSec=Math.floor(now/1000),signedAt=Number(at);
 if(!Number.isSafeInteger(signedAt)||signedAt>nowSec+60||nowSec-signedAt>900)return null;
 const entries=[...params].filter(([key])=>key!=='hash'&&key!=='signature');
 entries.sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
 const check=entries.map(([key,value])=>key+'='+value).join('\n');
 const secret=await sign(await hmacKey(encoder.encode('WebAppData')),botToken);
 const expected=toHex(await sign(await hmacKey(secret),check));
 if(!constEq(expected,hash.toLowerCase()))return null;
 let user;
 try{user=JSON.parse(rawUser);}catch{return null;}
 if(!user||typeof user!=='object'||!Number.isSafeInteger(user.id)||user.id<=0||user.is_bot===true)return null;
 return {id:String(user.id),name:String(user.username||user.first_name||'Telegram member').slice(0,80)};
}
