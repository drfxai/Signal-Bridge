export const DEFAULT_POLICY=Object.freeze({tp1:'BE',tp2:'CLOSE',tp3:'OFF',partial_percent:50,be_buffer_points:0});
export function validatePolicy(p){
 if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!Object.keys(DEFAULT_POLICY).includes(k)))throw Error('INVALID_POLICY');
 for(const k of ['tp1','tp2','tp3'])if(!['BE','CLOSE','PARTIAL','OFF'].includes(p[k]))throw Error('INVALID_POLICY');
 if(![p.tp1,p.tp2,p.tp3].includes('CLOSE'))throw Error('FINAL_CLOSE_REQUIRED');
 if(!Number.isFinite(p.partial_percent)||p.partial_percent<=0||p.partial_percent>=100||!Number.isInteger(p.be_buffer_points)||p.be_buffer_points<0||p.be_buffer_points>100000)throw Error('INVALID_POLICY');
 return {...p};
}
export const BROKER_SYMBOL=/^[A-Za-z0-9][A-Za-z0-9._-]{0,31}$/;
export async function memberExecutionSettings(env,userId){
 const row=await env.DB.prepare('SELECT policy_json,broker_gold_symbol FROM member_signal_settings WHERE user_id=?').bind(userId).first();
 return {policy:row?validatePolicy(JSON.parse(row.policy_json)):null,brokerSymbol:BROKER_SYMBOL.test(row?.broker_gold_symbol||'')?row.broker_gold_symbol:null};
}
export async function memberPolicy(env,userId){const r=await env.DB.prepare('SELECT policy_json FROM member_signal_settings WHERE user_id=?').bind(userId).first();return r?validatePolicy(JSON.parse(r.policy_json)):null}
export function policyFields(p){return [p.tp1,p.tp2,p.tp3,p.partial_percent,p.be_buffer_points].join('|');}
