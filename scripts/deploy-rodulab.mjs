// Publish the studio artifact only; preserve every other app and all mail DNS.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import path from 'node:path';
const config=JSON.parse(await readFile('rodulab/cloudflare.json','utf8'));
if(config.hostname!=='rodulab.com'||config.zone_name!=='rodulab.com'||config.project_name!=='rodulab-studio'||config.directory!=='dist/rodulab'||config.production_branch!=='main')throw Error('Unexpected studio target.');
const token=(process.env.CLOUDFLARE_API_TOKEN||process.env.PIXELKOVIA_TOKEN||'').trim();
if(!token)throw Error('Cloudflare token is missing.');
async function api(method,url,body){
  const response=await fetch('https://api.cloudflare.com/client/v4'+url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
  const data=await response.json();
  if(!response.ok||data.success===false){if(response.status===404)return null;throw Error(`${method} ${url}: ${response.status} ${data.errors?.map(e=>e.message).join('; ')||'API failure'}`);}
  return data.result;
}
const projectPath='/accounts/'+config.account_id+'/pages/projects/'+config.project_name,zonePath='/zones/'+config.zone_id;
const zone=await api('GET',zonePath),verified=await api('GET','/user/tokens/verify');
if(zone?.name!==config.zone_name||zone.account?.id!==config.account_id||zone.status!=='active'||verified?.status!=='active')throw Error('Zone/account/token does not match the verified target.');
let project=await api('GET',projectPath);
if(!project||project.id!==config.project_id||project.production_branch!=='main')throw Error('Unexpected studio Pages identity.');
if(project.deployment_configs?.production?.services?.BACKEND?.service!=='treasurequest-admin')throw Error('Studio backend binding is missing.');
const beforeDns=await api('GET',zonePath+'/dns_records?per_page=100');
const preserve=dns=>dns.filter(r=>!['rodulab.com','www.rodulab.com'].includes(r.name)||!['A','AAAA','CNAME'].includes(r.type)).map(r=>({id:r.id,type:r.type,name:r.name,content:r.content,priority:r.priority,proxied:r.proxied})).sort((a,b)=>a.id.localeCompare(b.id));
console.log(JSON.stringify({project:project.name,hostname:config.hostname,artifact:config.directory,mailRecordsPreserved:beforeDns.filter(r=>r.type==='MX').length}));
if(process.argv.includes('--check'))process.exit(0);
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
if(git(['branch','--show-current'])!=='main'||git(['status','--porcelain']))throw Error('Commit reviewed studio source on main before deployment.');
const sha=git(['rev-parse','HEAD']);if(git(['ls-remote','origin','refs/heads/main']).split(/\s/)[0]!==sha)throw Error('Push main before deployment.');
const allowed=new Set(['index.html','404.html','style.css','studio.js','robots.txt','sitemap.xml','_worker.js','_routes.json','assets']);
for(const file of await readdir(config.directory))if(!allowed.has(file))throw Error('Unexpected studio artifact file: '+file);
for(const file of ['index.html','404.html','_worker.js','assets/social.jpg'])if(!existsSync(path.join(config.directory,file)))throw Error('Incomplete studio artifact: '+file);
const wrangler=path.resolve('admin/node_modules/wrangler/bin/wrangler.js');
const version=JSON.parse(await readFile('admin/node_modules/wrangler/package.json','utf8')).version;if(version!=='4.151.1')throw Error('Use pinned Wrangler 4.151.1.');
if(project.canonical_deployment?.deployment_trigger?.metadata?.commit_hash!==sha||project.canonical_deployment?.latest_stage?.status!=='success'){
  const result=spawnSync(process.execPath,[wrangler,'pages','deploy',path.resolve(config.directory),'--project-name',config.project_name,'--branch','main','--commit-hash',sha,'--commit-dirty=false'],{cwd:'rodulab',stdio:'inherit',env:{...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:config.account_id,WRANGLER_SEND_METRICS:'false'}});
  if(result.status!==0)throw Error('Studio upload failed; DNS was not changed.');
}
project=await api('GET',projectPath);
const deployed=project.canonical_deployment;
if(deployed?.latest_stage?.status!=='success'||deployed.deployment_trigger?.metadata?.commit_hash!==sha)throw Error('Studio deployment source/status mismatch; DNS was not changed.');
const origin='https://'+project.subdomain;
for(const [route,expected]of [['/',200],['/assets/pixelkovia.jpg',200],['/api/contact',405],['/unknown-page',404],['/_protected/game.html',404],['/game-data.js',404]]){
  const response=await fetch(origin+route,{signal:AbortSignal.timeout(20000)});
  if(response.status!==expected)throw Error('Studio HTTP check failed: '+route+' '+response.status);
  if(route==='/'&&!(await response.text()).includes('RoduLab — Digital Product Studio'))throw Error('Wrong website on studio origin.');
}
for(const hostname of ['rodulab.com','www.rodulab.com']){
  let domain=await api('GET',projectPath+'/domains/'+hostname);if(!domain)domain=await api('POST',projectPath+'/domains',{name:hostname});
  const records=beforeDns.filter(r=>r.name===hostname&&['A','AAAA','CNAME'].includes(r.type));
  // Only the verified previous web host may be replaced. Root MX, SPF, DKIM,
  // autodiscover and every project's subdomain are deliberately left intact.
  for(const record of records){
    if(record.type==='CNAME'&&record.content===project.subdomain)continue;
    if(!((record.type==='A'&&record.content==='37.9.175.133')||(record.type==='AAAA'&&record.content==='2a00:4b40:aaaa:2001::7')))throw Error('Unexpected existing web DNS for '+hostname+'; no overwrite.');
  }
  for(const record of records.filter(r=>r.type==='AAAA'))await api('DELETE',zonePath+'/dns_records/'+record.id);
  const current=records.find(r=>r.type==='A'||r.type==='CNAME'),body={type:'CNAME',name:hostname,content:project.subdomain,proxied:true,ttl:1,comment:'RoduLab Digital Product Studio — separate Pages project'};
  if(current?.type==='CNAME'&&current.content===project.subdomain){if(!current.proxied)await api('PATCH',zonePath+'/dns_records/'+current.id,{proxied:true,ttl:1});}
  else if(current)await api('PUT',zonePath+'/dns_records/'+current.id,body);
  else await api('POST',zonePath+'/dns_records',body);
  console.log('Studio custom domain configured: '+hostname+' ('+domain.status+').');
}
const afterDns=await api('GET',zonePath+'/dns_records?per_page=100');
if(JSON.stringify(preserve(beforeDns))!==JSON.stringify(preserve(afterDns)))throw Error('Unrelated DNS changed during studio deployment; inspect before completion.');
const output={url:'https://rodulab.com',project_id:project.id,deployment_id:deployed.id,source_commit:sha,mail_dns_preserved:true,recorded_at:new Date().toISOString()};
await writeFile('/tmp/rodulab-deployment.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
