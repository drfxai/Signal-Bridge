import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Usage: node scripts/issue-ea-license.mjs <tenant_id> <trial|quarterly|annual> [label]
// Run only in the operator's secure workstation. Never run this in public CI.
const [tenantId, plan, rawLabel='DrFX SignalBridge MT5'] = process.argv.slice(2);
const modifiers={trial:'+1 month',quarterly:'+3 months',annual:'+1 year'};
if(!tenantId || !/^[A-Za-z0-9_-]{2,80}$/.test(tenantId) || !Object.hasOwn(modifiers,plan) ||
   rawLabel.length>100 || /[\r\n]/.test(rawLabel)){
 console.error('Usage: node scripts/issue-ea-license.mjs <tenant_id> <trial|quarterly|annual> [label]');
 process.exitCode=1;
}else{
 const activationCode=randomBytes(32).toString('base64url');
 const licenseId='lic_'+randomUUID().replaceAll('-','');
 const agentId='ea_'+randomUUID().replaceAll('-','');
 const digest=s=>createHash('sha256').update(s).digest('hex');
 // Internal compatibility connection is never given to the customer.
 const internalHash=digest(randomBytes(32).toString('base64url'));
 const sqlQuote=s=>"'"+s.replaceAll("'","''")+"'";
 const sql=[
  '-- Treat as private operational material. No plaintext activation code is stored here.',
  'BEGIN TRANSACTION;',
  'INSERT INTO agent_connections (id,tenant_id,label,token_sha256,status) VALUES ('+
   [agentId,tenantId,rawLabel,internalHash,'active'].map(sqlQuote).join(',')+');',
  'INSERT INTO ea_licenses (id,agent_id,token_sha256,plan,duration_modifier,status) VALUES ('+
   [licenseId,agentId,digest(activationCode),plan,modifiers[plan],'active'].map(sqlQuote).join(',')+');',
  'COMMIT;',''
 ].join('\n');
 const dir=resolve('private');
 mkdirSync(dir,{recursive:true,mode:0o700});
 const file=resolve(dir,'ea-license-'+licenseId+'.sql');
 writeFileSync(file,sql,{mode:0o600,flag:'wx'});
 console.log('ACTIVATION CODE (deliver privately once): '+activationCode);
 console.log('License ID: '+licenseId);
 console.log('Plan: '+plan+' (clock starts on first successful account activation)');
 console.log('Private D1 provisioning SQL: '+file);
 console.log('Apply using: npx wrangler d1 execute signalbridge-ingress --remote --file "'+file+'"');
 console.log('Never commit the SQL file or publish the activation code.');
}
