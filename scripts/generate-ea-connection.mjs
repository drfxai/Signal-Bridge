import { createHash, randomBytes, randomUUID } from 'node:crypto';

const token=randomBytes(32).toString('base64url');
const hash=createHash('sha256').update(token).digest('hex');
const id='ea_'+randomUUID().replaceAll('-','');
const tenant=process.argv[2] || 'tenant_demo';
const label=process.argv[3] || 'MT5 Direct EA';
console.log(JSON.stringify({
  execution_connection_id:id,
  tenant_id:tenant,
  signalbridge_key:token,
  token_sha256:hash,
  insert_sql:`INSERT INTO agent_connections (id,tenant_id,label,token_sha256,status) VALUES ('${id}','${tenant.replaceAll("'","''")}','${label.replaceAll("'","''")}','${hash}','active');`
},null,2));
