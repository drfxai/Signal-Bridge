// Local-only enrollment helper. Only token HASH is inserted into Cloudflare D1.
// Do not publish generated URL/token or commit the output to GitHub.
import { randomBytes, createHash } from 'node:crypto';
const [tenant,id]=process.argv.slice(2);
const valid=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{3,64}$/.test(s);
if(!valid(tenant)||!valid(id)){
  console.error('Usage: node scripts/generate-tv-connection.mjs TENANT_ID CONNECTION_ID');
  process.exitCode=1;
}else{
  const token=randomBytes(32).toString('base64url');
  const hash=createHash('sha256').update(token).digest('hex');
  process.stdout.write(`PRIVATE TOKEN (save securely; shown only once): ${token}\n\n`);
  process.stdout.write(`Private TradingView URL: https://YOUR_WORKER_DOMAIN/v1/ingress/tradingview/${token}\n\n`);
  process.stdout.write('D1 SQL to execute as administrator (contains only token hash):\n');
  process.stdout.write(`INSERT INTO ingress_connections (id,tenant_id,provider,token_sha256,status) VALUES ('${id}','${tenant}','tradingview','${hash}','active');\n`);
}
