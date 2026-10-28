// Verify Telegram Mini App WebAppData in the Cloudflare Worker.
// Reference: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
// A 6h signed-initData window accommodates suspended/reopened Android Telegram WebViews.
// Bot-token HMAC check includes every signed field except `hash`, including the optional
// Ed25519 `signature` field (the latter is excluded ONLY for third-party Ed25519 verification).
// Never extend this to arbitrary unbounded timestamps or trust initDataUnsafe.
// Sessions remain server-side, cancellable and cookie-protected.
export const TELEGRAM_INITDATA_MAX_AGE_SECONDS=6*60*60;
const encoder=new TextEncoder();
const hmacKey=async raw=>crypto.subtle.importKey('raw',raw,{name:'HMAC',hash:'SHA-256'},false,['sign']);
const sign=async(key,data)=>new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(data)));
const toHex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const constEq=(a,b)=>{if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;};

// "reason" contains no Telegram identity, token, timestamp or signed query string.
export async function inspectTelegramInitData(initData,botToken,now=Date.now()){
 const reject=reason=>({principal:null,reason});
 if(typeof initData!=='string'||initData.length<20||initData.length>8192)return reject('MISSING_OR_MALFORMED');
 if(typeof botToken!=='string'||!/^[0-9]{5,}:[A-Za-z0-9_-]{30,}$/.test(botToken))return reject('BOT_CONFIGURATION');
 const params=new URLSearchParams(initData);
 const keys=new Set();
 for(const [key] of params){if(keys.has(key))return reject('MALFORMED');keys.add(key);}
 const hash=params.get('hash')||'';
 if(!/^[0-9a-f]{64}$/i.test(hash))return reject('MALFORMED');
 const check=[...params].filter(([key])=>key!=='hash')
  .sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0)
  .map(([key,value])=>key+'='+value).join('\n');
 const secret=await sign(await hmacKey(encoder.encode('WebAppData')),botToken);
 const expected=toHex(await sign(await hmacKey(secret),check));
 if(!constEq(expected,hash.toLowerCase()))return reject('BAD_SIGNATURE');
 const at=params.get('auth_date')||'';
 if(!/^[0-9]{10,11}$/.test(at))return reject('MALFORMED');
 const issuedAt=Number(at),nowSec=Math.floor(now/1000);
 if(!Number.isSafeInteger(issuedAt))return reject('MALFORMED');
 if(issuedAt>nowSec+60)return reject('FUTURE_TIMESTAMP');
 if(nowSec-issuedAt>TELEGRAM_INITDATA_MAX_AGE_SECONDS)return reject('EXPIRED');
 const rawUser=params.get('user');
 if(!rawUser)return reject('MISSING_USER');
 let user;try{user=JSON.parse(rawUser)}catch{return reject('INVALID_USER');}
 if(!user||typeof user!=='object'||!Number.isSafeInteger(user.id)||user.id<=0||user.is_bot===true)return reject('INVALID_USER');
 return {principal:{id:String(user.id),name:String(user.username||user.first_name||'Telegram member').slice(0,80)},reason:null};
}

export async function verifyTelegramInitData(initData,botToken,now=Date.now()){
 const result=await inspectTelegramInitData(initData,botToken,now);
 return result.principal;
}
