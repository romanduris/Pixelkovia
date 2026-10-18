// Read-only inventory. This script only sends GET requests and never logs credentials.
import fs from 'node:fs';
const tokenFile=process.env.TQ_CF_TOKEN_FILE||'/tmp/treasurequest-cloudflare-token';
const token=process.env.CLOUDFLARE_API_TOKEN||fs.readFileSync(tokenFile,'utf8').trim();
if(!token)throw Error('Cloudflare API token is missing.');
const root='https://api.cloudflare.com/client/v4';
async function get(path){const response=await fetch(root+path,{method:'GET',headers:{Authorization:'Bearer '+token}});const data=await response.json();return {ok:response.ok&&data.success!==false,status:response.status,result:data.result,pagination:data.result_info,error:data.errors?.map(e=>({code:e.code,message:e.message}))};}
async function list(path){let result=[],page=1;while(true){const response=await get(path+(path.includes('?')?'&':'?')+'page='+page+'&per_page=10');if(!response.ok)return response;const rows=Array.isArray(response.result)?response.result:response.result?.buckets||[];result.push(...rows);if(response.pagination?.total_pages?page>=response.pagination.total_pages:rows.length<10)break;if(page++>=100)throw Error('Inventory pagination needs manual review.');}return {ok:true,result};}
const verified=await get('/user/tokens/verify');if(!verified.ok||verified.result?.status!=='active')throw Error('Token verification failed; no changes attempted.');
const accounts=await list('/accounts');if(!accounts.ok)throw Error('Account listing is not permitted. Account Settings Read is needed or supply account ID.');
const selected=process.env.CLOUDFLARE_ACCOUNT_ID?accounts.result.filter(a=>a.id===process.env.CLOUDFLARE_ACCOUNT_ID):accounts.result;
if(selected.length!==1){console.log(JSON.stringify({accounts:accounts.result.map(a=>({id:a.id,name:a.name})),action:'Select exactly one CLOUDFLARE_ACCOUNT_ID; no further requests or changes performed.'},null,2));process.exit(0);}
const account=selected[0],base='/accounts/'+account.id;
const [workers,pages,d1,kv,r2,access,zones,subdomain]=await Promise.all([
 list(base+'/workers/scripts'),list(base+'/pages/projects'),list(base+'/d1/database'),list(base+'/storage/kv/namespaces'),list(base+'/r2/buckets'),list(base+'/access/apps'),list('/zones?account.id='+account.id),get(base+'/workers/subdomain')
]);
const domains=await list(base+'/workers/domains');
const zoneRoutes=[];
for(const zone of zones.ok?zones.result:[]){const routes=await get('/zones/'+zone.id+'/workers/routes');zoneRoutes.push({zone:zone.name,readable:routes.ok,status:routes.status,routes:routes.ok?routes.result.map(r=>({id:r.id,pattern:r.pattern,script:r.script})):null,error:routes.error});}
const bindings=[];
for(const worker of workers.ok?workers.result:[]){const settings=await get(base+'/workers/scripts/'+encodeURIComponent(worker.id)+'/settings');bindings.push({worker:worker.id,readable:settings.ok,bindings:(settings.result?.bindings||[]).map(b=>({name:b.name,type:b.type,database_id:b.id||b.database_id,namespace_id:b.namespace_id,bucket_name:b.bucket_name,service:b.service,environment:b.environment}))});}
const output={readOnly:true,recordedAt:new Date().toISOString(),account:{id:account.id,name:account.name},subdomain:subdomain.ok?subdomain.result:null,
 workers:workers.ok?workers.result.map(w=>({name:w.id,created_on:w.created_on,modified_on:w.modified_on})):workers,
 pages:pages.ok?pages.result.map(p=>({id:p.id,name:p.name,subdomain:p.subdomain,domains:p.domains,bindings:Object.fromEntries(Object.entries(p.deployment_configs||{}).map(([env,cfg])=>[env,{d1:cfg.d1_databases,kv:cfg.kv_namespaces,r2:cfg.r2_buckets,services:cfg.services}]))})):pages,
 d1:d1.ok?d1.result.map(d=>({id:d.uuid,name:d.name})):d1,kv:kv.ok?kv.result.map(k=>({id:k.id,name:k.title})):kv,r2:r2.ok?r2.result.map(b=>({name:b.name,creation_date:b.creation_date})):r2,
 access:access.ok?access.result.map(a=>({id:a.id,name:a.name,type:a.type,domain:a.domain})):access,
 zones:zones.ok?zones.result.map(z=>({id:z.id,name:z.name,status:z.status})):zones,bindings,
 customWorkerDomains:domains.ok?domains.result.map(d=>({id:d.id,hostname:d.hostname,service:d.service})):domains,zoneRoutes,
 purpose:'Existing resources are inventory only. Their purposes are not inferred; all stay untouched.'};
const file=new URL('../docs/cloudflare-inventory.local.json',import.meta.url);fs.writeFileSync(file,JSON.stringify(output,null,2),{mode:0o600});console.log(JSON.stringify(output,null,2));
