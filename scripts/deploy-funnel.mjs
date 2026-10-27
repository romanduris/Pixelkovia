// Deploy only the explicitly configured public funnel; credentials stay in env.
import {readFile,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import path from 'node:path';
const config=JSON.parse(await readFile('funnel/cloudflare.json','utf8'));
const token=(process.env.CLOUDFLARE_API_TOKEN||process.env.PIXELKOVIA_TOKEN||'').trim();
if(!token)throw Error('Cloudflare token is missing.');
if(config.hostname!=='pixelkovia.rodulab.com'||config.project_name!=='pixelkovia-funnel'||config.directory!=='dist/funnel')throw Error('Unexpected deployment target.');
const api=async(method,url,body)=>{
 const response=await fetch('https://api.cloudflare.com/client/v4'+url,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(30000)});
 const data=await response.json();
 if(!response.ok||data.success===false){if(response.status===404)return null;throw Error(`${method} ${url}: ${response.status} ${data.errors?.map(e=>e.message).join('; ')||'API failure'}`)}
 return data.result;
};
const base='/accounts/'+config.account_id+'/pages/projects';
const projectPath=base+'/'+config.project_name;
const zonePath='/zones/'+config.zone_id;
const zone=await api('GET',zonePath);
if(zone?.name!==config.zone_name||zone.account?.id!==config.account_id||zone.status!=='active')throw Error('Zone/account does not match the verified target.');
const verified=await api('GET','/user/tokens/verify');
if(verified?.status!=='active')throw Error('Inactive token.');
let project=await api('GET',projectPath);
if(project&&config.project_id&&project.id!==config.project_id)throw Error('Unexpected Pages project ID.');
const existingDns=await api('GET',zonePath+'/dns_records?name='+encodeURIComponent(config.hostname));
console.log(JSON.stringify({account:zone.account.name,zone:zone.name,project:project?.name||'(new) '+config.project_name,hostname:config.hostname,existingDns:existingDns.map(({type,name,content})=>({type,name,content})),artifact:config.directory}));
if(process.argv.includes('--check'))process.exit(0);
if(execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim()!=='main')throw Error('Deploy only main.');
if(execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim())throw Error('Commit and push the reviewed source before deployment.');
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const remote=execFileSync('git',['ls-remote','origin','refs/heads/main'],{encoding:'utf8'}).split(/\s/)[0];
if(remote!==sha)throw Error('origin/main does not match the reviewed source.');
const wrangler=process.env.WRANGLER_BIN;
if(!wrangler||!existsSync(wrangler))throw Error('Set WRANGLER_BIN to the pinned Wrangler 4.151.1 CLI.');
const forbidden=['game.html','parent.html','storyboard.html','book-before.html','book-after.html','books-preview.html','books-content','printables.html','game-data.js','app.js','site-config.js','admin','assets/printables'];
for(const file of forbidden)if(existsSync(path.join(config.directory,file)))throw Error('Private content found in public artifact: '+file);
if(!existsSync(path.join(config.directory,'404.html')))throw Error('Public artifact needs a real 404 page.');
if(!project){
 project=await api('POST',base,{name:config.project_name,production_branch:config.production_branch});
 console.log('Created Pages project '+project.name+' ('+project.id+').');
}
if(project.production_branch!==config.production_branch)throw Error('Unexpected production branch.');
if(project.canonical_deployment?.deployment_trigger?.metadata?.commit_hash===sha&&project.canonical_deployment?.latest_stage?.status==='success'){
 console.log('Reusing the successful Pages deployment for this exact source commit.');
}else{
 const result=spawnSync(process.execPath,[wrangler,'pages','deploy',config.directory,'--config','funnel/wrangler.jsonc','--project-name',config.project_name,'--branch',config.production_branch,'--commit-hash',sha,'--commit-dirty=false'],{stdio:'inherit',env:{...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:config.account_id,WRANGLER_SEND_METRICS:'false'}});
 if(result.status!==0)throw Error('Pages upload failed; DNS was not changed.');
}
project=await api('GET',projectPath);
const deployed=project.canonical_deployment;
if(deployed?.latest_stage?.status!=='success')throw Error('Deployment is not successful; DNS was not changed.');
const expected=sha;
if(deployed.deployment_trigger?.metadata?.commit_hash!==expected)throw Error('Deployment source mismatch; DNS was not changed.');
const cnameTarget=project.subdomain;
// Verify uploaded boundary on the stable Pages origin before directing the domain.
const pagesOrigin='https://'+cnameTarget;
for(const [route,status]of [['/',200],['/checkout',200],['/Supervisor',200],['/game.html',404],['/game-data.js',404],['/assets/printables/p1.pdf',404]]){
 for(let attempt=0;attempt<4;attempt++){
  let actual;
  try{actual=(await fetch(pagesOrigin+route,{signal:AbortSignal.timeout(15000)})).status;}catch{actual='network';}
  if(actual===status)break;
  if(attempt===3||![502,503,504,522,530,'network'].includes(actual))throw Error('Pages HTTP boundary failed: '+route+' '+actual);
  console.log('Waiting for the Pages origin to activate ('+route+', '+actual+').');
  await new Promise(resolve=>setTimeout(resolve,2000*(attempt+1)));
 }
}
let domain=await api('GET',projectPath+'/domains/'+config.hostname);
if(!domain)domain=await api('POST',projectPath+'/domains',{name:config.hostname});
const records=await api('GET',zonePath+'/dns_records?name='+encodeURIComponent(config.hostname));
if(records.length&&!(records.length===1&&records[0].type==='CNAME'&&records[0].content.replace(/\.$/,'')===cnameTarget.replace(/\.$/,'')))throw Error('A conflicting exact DNS record appeared; review before replacing it.');
let dns=records[0];
if(!dns)dns=await api('POST',zonePath+'/dns_records',{type:'CNAME',name:config.hostname,content:cnameTarget,ttl:300,proxied:false,comment:'Public Pixelkovia sales funnel; game hosted separately.'});
const output={project_id:project.id,project_name:project.name,hostname:config.hostname,pages_origin:pagesOrigin,deployment_id:deployed.id,source_commit:sha,dns_record_id:dns.id,dns:{type:dns.type,name:dns.name,content:dns.content,proxied:dns.proxied},domain_status:domain.status,recorded_at:new Date().toISOString()};
await writeFile('/tmp/pixelkovia-funnel-deployment.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
