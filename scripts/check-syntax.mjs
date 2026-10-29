import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):/\.(mjs|js|cjs)$/.test(e.name)?[`${dir}/${e.name}`]:[])}
for(const file of ['site','worker','design','agent-windows','scripts','tests'].flatMap(walk)){
 const r=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);
}
