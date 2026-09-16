import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';import {spawnSync} from 'node:child_process';import path from 'node:path';
const root=process.cwd(),journal=path.join(root,'.wrangler','local-migrations.json');
let applied=[];try{applied=JSON.parse(await readFile(journal,'utf8'))}catch{}
const files=(await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort();
for(const file of files){if(applied.includes(file)){console.log('Already applied locally:',file);continue}const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state','--file',`drizzle/${file}`],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);applied.push(file);await mkdir(path.dirname(journal),{recursive:true});await writeFile(journal,JSON.stringify(applied,null,2)+'\n');}
console.log('Local migrations are current.');
