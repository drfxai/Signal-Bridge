export const DEFAULT_POLICY=Object.freeze({tp1:'BE',tp2:'CLOSE',tp3:'OFF',partial_percent:50,be_buffer_points:0});
export function validatePolicy(p){
 if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!Object.keys(DEFAULT_POLICY).includes(k)))throw Error('INVALID_POLICY');
 for(const k of ['tp1','tp2','tp3'])if(!['BE','CLOSE','PARTIAL','OFF'].includes(p[k]))throw Error('INVALID_POLICY');
 if(![p.tp1,p.tp2,p.tp3].includes('CLOSE'))throw Error('FINAL_CLOSE_REQUIRED');
 if(!Number.isFinite(p.partial_percent)||p.partial_percent<=0||p.partial_percent>=100||!Number.isInteger(p.be_buffer_points)||p.be_buffer_points<0||p.be_buffer_points>100000)throw Error('INVALID_POLICY');
 return {...p};
}
export async function memberPolicy(env,userId){try{const r=await env.DB.prepare('SELECT policy_json FROM member_signal_settings WHERE user_id=?').bind(userId).first();return r?validatePolicy(JSON.parse(r.policy_json)):{...DEFAULT_POLICY}}catch{return {...DEFAULT_POLICY}}}
export function policyFields(p){return [p.tp1,p.tp2,p.tp3,p.partial_percent,p.be_buffer_points].join('|');}
