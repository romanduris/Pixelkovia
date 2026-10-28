// Run from this checkout. Credentials are read from env or a hidden terminal
// prompt, persisted as Codespaces secrets and sent directly to Cloudflare.
import Stripe from '../admin/node_modules/stripe/esm/stripe.esm.node.js';
import {spawnSync} from 'node:child_process';
import {emailRecordName} from './email-dns.mjs';
import {readCredential} from './commerce-credentials.mjs';
const account='033ec39e1948bd5785d92d1993a8036f',zone='e21f155e1a6e43b9a57bd7a093f1ee42',worker='treasurequest-admin',host='pixelkovia.rodulab.com';
const cfToken=process.env.PIXELKOVIA_TOKEN||process.env.CLOUDFLARE_API_TOKEN;
if(!cfToken)throw Error('Missing PIXELKOVIA_TOKEN Codespaces secret.');
async function cf(method,endpoint,body){const r=await fetch('https://api.cloudflare.com/client/v4'+endpoint,{method,headers:{Authorization:'Bearer '+cfToken,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});const d=await r.json();if(!r.ok||d.success===false)throw Error('Cloudflare configuration failed: HTTP '+r.status);return d.result;}
function persist(name,value){const r=spawnSync('gh',['secret','set',name,'--app','codespaces','--repo','romanduris/Pixelkovia'],{input:value,encoding:'utf8'});if(r.status!==0)throw Error('Could not persist '+name+' as a Codespaces secret.');console.log('Codespaces secret saved: '+name);}
async function runtimeSecret(name,value){await cf('PUT',`/accounts/${account}/workers/scripts/${worker}/secrets`,{name,type:'secret_text',text:value});}
async function main(){
const key=await readCredential('STRIPE_SECRET_KEY'),publicKey=await readCredential('STRIPE_PUBLISHABLE_KEY'),mailKey=await readCredential('RESEND_API_KEY');
const stripe=new Stripe(key,{apiVersion:'2026-08-26.dahlia'});
const merchant=await stripe.accounts.retrieve();if(merchant.id!=='acct_1UVB5BGle1VvIsLT'||merchant.charges_enabled!==true)throw Error('Stripe account is not the approved, charge-enabled Pixelkovia account.');
for(const [name,value]of Object.entries({STRIPE_SECRET_KEY:key,STRIPE_PUBLISHABLE_KEY:publicKey,RESEND_API_KEY:mailKey}))persist(name,value);
const resend=async(method,endpoint,body)=>{const r=await fetch('https://api.resend.com'+endpoint,{method,headers:{Authorization:'Bearer '+mailKey,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('Resend configuration failed: HTTP '+r.status);return r.json();};
const domains=await resend('GET','/domains');let domain=domains.data.find(d=>d.name===host);
if(!domain)domain=await resend('POST','/domains',{name:host,region:'eu-west-1'});
domain=await resend('GET','/domains/'+domain.id);
const dnsZone=await cf('GET',`/zones/${zone}`);
for(const record of domain.records.filter(r=>['TXT','MX','CNAME'].includes(r.type))){
  const name=emailRecordName(record.name,host,dnsZone.name);
  const existing=await cf('GET',`/zones/${zone}/dns_records?name=${encodeURIComponent(name)}&type=${record.type}`);
  const matches=existing.some(r=>r.content.replaceAll('"','')===record.value.replaceAll('"',''));
  if(existing.length&&!matches)throw Error('Conflicting DNS record; existing email settings were preserved.');
  if(!matches)await cf('POST',`/zones/${zone}/dns_records`,{name,type:record.type,content:record.value,ttl:300,...(record.type==='MX'?{priority:record.priority||10}:{}),...(record.type==='CNAME'?{proxied:false}:{}),comment:'Pixelkovia transactional email sender'});
}
await resend('POST','/domains/'+domain.id+'/verify');
let verified=domain.status==='verified';
for(let attempt=0;!verified&&attempt<5;attempt++){await new Promise(resolve=>setTimeout(resolve,3000));domain=await resend('GET','/domains/'+domain.id);verified=domain.status==='verified';}
let signingSecret=process.env.STRIPE_WEBHOOK_SECRET;
const hooks=await stripe.webhookEndpoints.list({limit:100});
const existingHook=hooks.data.find(h=>h.url==='https://'+host+'/api/stripe/webhook'&&h.status==='enabled');
if(existingHook&&!signingSecret)throw Error('The payment webhook already exists. Restore STRIPE_WEBHOOK_SECRET from Codespaces secrets; do not create another endpoint.');
if(!existingHook){const hook=await stripe.webhookEndpoints.create({url:'https://'+host+'/api/stripe/webhook',enabled_events:['checkout.session.completed','checkout.session.async_payment_succeeded','charge.refunded'],api_version:'2026-08-26.dahlia',description:'Pixelkovia paid orders and automatic customer access'},{idempotencyKey:'pixelkovia-order-access-webhook-v1'});signingSecret=hook.secret;persist('STRIPE_WEBHOOK_SECRET',signingSecret);}
for(const [name,value]of Object.entries({STRIPE_SECRET_KEY:key,STRIPE_PUBLISHABLE_KEY:publicKey,RESEND_API_KEY:mailKey,STRIPE_WEBHOOK_SECRET:signingSecret,MAIL_DOMAIN_VERIFIED:String(verified),PAYMENTS_ENABLED:String(verified)}))await runtimeSecret(name,value);
console.log(verified?'Live checkout configured; sender Piko@pixelkovia.rodulab.com verified.':'Keys are persisted; email DNS verification is pending. Payments remain disabled. Rerun after DNS propagates.');

}
main().catch(error=>{console.error(error.type?.startsWith('Stripe')?'Stripe configuration failed (HTTP '+(error.statusCode||'unknown')+'). No credentials were logged.':error.message);process.exitCode=1;});
