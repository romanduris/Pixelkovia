import {HttpError} from './auth.mjs';
import {execute,first} from './db.mjs';

const host='pixelkovia.rodulab.com';
const aliases={guardy:{name:'Guardy',prefix:'CHARGEBACK'},miky:{name:'Miky',prefix:'QUESTION'}};
const encoder=new TextEncoder();
const clean=value=>String(value||'').replace(/[\r\n\x00-\x1f\x7f]/g,' ').slice(0,250);
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function address(value){
  const raw=String(value||'').trim(),email=(raw.match(/<([^<>]+)>$/)?.[1]||raw).trim();
  return /^[^\s<>@,;\x00-\x1f\x7f]+@[^\s<>@,;\x00-\x1f\x7f]+\.[^\s<>@,;\x00-\x1f\x7f]+$/.test(email)?email:null;
}
const bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
function base64(value){let text='';for(let i=0;i<value.length;i+=8192)text+=String.fromCharCode(...value.subarray(i,i+8192));return btoa(text);}

// Svix signs the original bytes, including the delivery ID and timestamp.
// Web Crypto verifies HMAC in constant time and also works in Cloudflare Workers.
export async function verifiedEvent(request,secret){
  if(!secret)throw new HttpError(503,'Príjem správ nie je nastavený.');
  const id=request.headers.get('svix-id'),timestamp=request.headers.get('svix-timestamp'),signatures=request.headers.get('svix-signature');
  if(!id||!timestamp||!/^\d+$/.test(timestamp)||Math.abs(Date.now()/1000-Number(timestamp))>300||!signatures)throw new HttpError(400,'Neplatný podpis správy.');
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Chýba správa.');
  const chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536){await reader.cancel();throw new HttpError(413,'Správa je príliš veľká.');}chunks.push(value);}
  const payload=new Uint8Array(size);let offset=0;for(const chunk of chunks){payload.set(chunk,offset);offset+=chunk.length;}
  const prefix=encoder.encode(id+'.'+timestamp+'.'),signed=new Uint8Array(prefix.length+payload.length);signed.set(prefix);signed.set(payload,prefix.length);
  let valid=false;
  try{
    const key=await crypto.subtle.importKey('raw',bytes(secret.replace(/^whsec_/,'')),{name:'HMAC',hash:'SHA-256'},false,['verify']);
    for(const signature of signatures.split(/\s+/)){
      const [version,value]=signature.split(',');if(version!=='v1'||!value)continue;
      try{if(await crypto.subtle.verify('HMAC',key,bytes(value),signed)){valid=true;break;}}catch{}
    }
  }catch{}
  if(!valid)throw new HttpError(400,'Neplatný podpis správy.');
  try{return JSON.parse(new TextDecoder().decode(payload));}catch{throw new HttpError(400,'Neplatná správa.');}
}

async function resend(env,path,options={}){
  let response;
  for(let attempt=0;attempt<3;attempt++){
    response=await fetch('https://api.resend.com'+path,{...options,headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(20000)});
    if(response.status!==429)break;
    await response.body?.cancel();
    await new Promise(resolve=>setTimeout(resolve,Math.min(3000,Math.max(1000,Number(response.headers.get('retry-after')||1)*1000))));
  }
  if(!response.ok)throw new HttpError(502,'Poštová služba je dočasne nedostupná.');
  return response.json();
}
async function attachments(env,email){
  if(!email.attachments?.length)return {items:[],note:''};
  // Keep large original messages in the provider's private inbox, without
  // exhausting the Worker's memory or silently dropping an attachment.
  const tooLarge='Prílohy nájdete v pôvodnej správe v súkromnej schránke Resend: https://resend.com/emails/receiving/'+email.id;
  if(email.attachments.reduce((sum,a)=>sum+Number(a.size||0),0)>15*1024*1024)return {items:[],note:tooLarge};
  const list=await resend(env,'/emails/receiving/'+email.id+'/attachments');
  if(list.has_more)return {items:[],note:tooLarge};
  const items=[];let total=0;
  for(const a of list.data||[]){
    const url=new URL(a.download_url);
    if(url.protocol!=='https:'||!(url.hostname.endsWith('.resend.com')||url.hostname.endsWith('.cloudfront.net')))throw new HttpError(502,'Neplatný odkaz na prílohu.');
    const response=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'error'});
    if(!response.ok)throw new HttpError(502,'Prílohu sa nepodarilo načítať.');
    const reader=response.body.getReader(),chunks=[];let length=0;
    while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;total+=value.length;if(total>15*1024*1024){await reader.cancel();return {items:[],note:tooLarge};}chunks.push(value);}
    const content=new Uint8Array(length);let offset=0;for(const c of chunks){content.set(c,offset);offset+=c.length;}
    items.push({filename:clean(a.filename)||'priloha',content:base64(content),content_type:a.content_type||'application/octet-stream',...(a.content_id?{content_id:a.content_id.replace(/^<|>$/g,'')}: {})});
  }
  return {items,note:''};
}

export async function supportWebhook(request,env){
  const event=await verifiedEvent(request,env.RESEND_WEBHOOK_SECRET);
  if(event.type!=='email.received')return {received:true};
  const emailId=event.data?.email_id;
  if(typeof emailId!=='string'||!/^[a-f0-9-]{36}$/i.test(emailId))throw new HttpError(400,'Neplatná správa.');
  const destination=address(env.SUPPORT_FORWARD_TO);
  if(!destination||!env.RESEND_API_KEY)throw new HttpError(503,'Preposielanie nie je nastavené.');
  // Fetch the canonical message: webhook metadata never chooses the destination,
  // sender, body or attachments. No email contents are copied into D1 or logs.
  const email=await resend(env,'/emails/receiving/'+emailId+'?html_format=cid');
  if(email.id!==emailId)throw new HttpError(502,'Nesprávna správa.');
  const sender=address(email.from);if(!sender)return {received:true,ignored:true};
  const recipients=[...new Set([...(email.to||[]),...(email.cc||[]),...(email.bcc||[]),...(email.received_for||[])].map(address).filter(Boolean).map(a=>a.toLowerCase()))];
  const targets=Object.keys(aliases).filter(alias=>recipients.includes(alias+'@'+host));
  if(!targets.length||Object.keys(aliases).some(a=>sender.toLowerCase()===a+'@'+host))return {received:true,ignored:true};
  const forwarded=[];let files;
  for(const alias of targets){
    if(await first(env.TQ_DB,'SELECT 1 FROM support_forwards WHERE email_id=? AND alias=?',emailId,alias))continue;
    files??=await attachments(env,email);
    const recipient=alias+'@'+host,config=aliases[alias],subject=config.prefix+' - Pixelkovia - '+clean(sender.split('@')[0]);
    const intro=`Preposlané pre: ${recipient}\nOd: ${clean(email.from)}\nPôvodný predmet: ${clean(email.subject)}${files.note?'\n'+files.note:''}`;
    const response=await resend(env,'/emails',{method:'POST',headers:{'Idempotency-Key':'support/'+emailId+'/'+alias},body:JSON.stringify({from:config.name+' · Pixelkovia <'+recipient+'>',to:[destination],reply_to:sender,subject,text:intro+'\n\n'+(email.text||''),html:'<p>'+escape(intro).replaceAll('\n','<br>')+'</p><hr>'+(email.html||'<pre>'+escape(email.text||'')+'</pre>'),...(files.items.length?{attachments:files.items}: {})})});
    if(!response.id)throw new HttpError(502,'Preposlanie sa nepotvrdilo.');
    await execute(env.TQ_DB,'INSERT OR IGNORE INTO support_forwards(email_id,alias,provider_id,forwarded_at) VALUES(?,?,?,?)',emailId,alias,response.id,Date.now());
    forwarded.push(alias);
  }
  return {received:true,forwarded};
}
