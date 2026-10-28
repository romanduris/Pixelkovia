// Reuse the existing Resend domain and Cloudflare zone. No secrets are logged.
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {emailRecordName,funnelDns} from './email-dns.mjs';

const config=JSON.parse(await readFile('funnel/cloudflare.json','utf8'));
const token=process.env.PIXELKOVIA_TOKEN||process.env.CLOUDFLARE_API_TOKEN;
const mailKey=process.env.RESEND_API_KEY,destination=process.env.SUPPORT_FORWARD_TO?.trim();
if(!token||!mailKey||!destination||!/^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/.test(destination))throw Error('Cloudflare, Resend and private SUPPORT_FORWARD_TO environment settings are required.');
if(config.hostname!=='pixelkovia.rodulab.com'||config.receiving_mx!=='receive-euw1.forge.rmta.net')throw Error('Unexpected support domain.');
async function api(origin,key,method,path,body){
  const response=await fetch(origin+path,{method,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
  const data=await response.json();
  if(!response.ok||data.success===false)throw Error('Support configuration API failed (HTTP '+response.status+').');
  return data.result??data;
}
const cf=(method,path,body)=>api('https://api.cloudflare.com/client/v4',token,method,path,body);
const resend=async(method,path,body)=>{await new Promise(r=>setTimeout(r,650));return api('https://api.resend.com',mailKey,method,path,body);};
async function secret(name,value){
  const result=spawnSync('gh',['secret','set',name,'--app','codespaces','--repo','romanduris/Pixelkovia'],{input:value,encoding:'utf8'});
  if(result.status!==0)throw Error('Could not persist '+name+' in Codespaces.');
  await cf('PUT',`/accounts/${config.account_id}/workers/scripts/treasurequest-admin/secrets`,{name,type:'secret_text',text:value});
  console.log('Private runtime and Codespaces setting saved: '+name);
}
const domains=await resend('GET','/domains'),found=domains.data.find(d=>d.name===config.hostname);
if(!found)throw Error('The existing verified Resend domain is required.');
await resend('PATCH','/domains/'+found.id,{capabilities:{sending:'enabled',receiving:'enabled'}});
const domain=await resend('GET','/domains/'+found.id);
if(domain.capabilities?.sending!=='enabled'||!domain.records.filter(r=>r.record==='DKIM'||r.record==='SPF').every(r=>r.status==='verified'))throw Error('Preserve and verify the existing sender before configuring support.');
const zone='/zones/'+config.zone_id,dnsPath=zone+'/dns_records';
const records=await cf('GET',dnsPath+'?name='+config.hostname);
// Check conflict protection before changing the site's proxy setting.
const cname=funnelDns(records.map(r=>r.type==='CNAME'?{...r,proxied:true}:r),config.project_name+'.pages.dev',config.receiving_mx);
if(!cname)throw Error('The existing Pages CNAME is required.');
const incoming=domain.records.filter(r=>r.record==='Receiving');
if(incoming.length!==1||incoming[0].type!=='MX'||incoming[0].value!==config.receiving_mx||emailRecordName(incoming[0].name,config.hostname,config.zone_name)!==config.hostname)throw Error('Unexpected receiving DNS requirements.');
const endpoint='https://'+config.hostname+'/api/support/webhook';
const hooks=await resend('GET','/webhooks');
let hook=hooks.data.find(h=>h.endpoint===endpoint);
if(hook){hook=await resend('GET','/webhooks/'+hook.id);await resend('PATCH','/webhooks/'+hook.id,{status:'enabled',events:['email.received']});}
else hook=await resend('POST','/webhooks',{endpoint,events:['email.received']});
if(!hook.signing_secret)throw Error('The support webhook signing secret is unavailable.');
await secret('RESEND_WEBHOOK_SECRET',hook.signing_secret);
await secret('SUPPORT_FORWARD_TO',destination);
if(!records.find(r=>r.id===cname.id).proxied)await cf('PATCH',dnsPath+'/'+cname.id,{proxied:true,ttl:1});
if(!records.some(r=>r.type==='MX'))await cf('POST',dnsPath,{name:config.hostname,type:'MX',content:config.receiving_mx,priority:10,ttl:300,comment:'Pixelkovia support inboxes via existing Resend account'});
await resend('POST','/domains/'+found.id+'/verify');
const verified=await resend('GET','/domains/'+found.id);
console.log(JSON.stringify({domain:config.hostname,capabilities:verified.capabilities,receiving:verified.records.filter(r=>r.record==='Receiving').map(r=>({type:r.type,status:r.status})),webhook:hook.id,endpoint}));
