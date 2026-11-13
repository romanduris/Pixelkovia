import {HttpError,sameOrigin} from './auth.mjs';
import {first,hash} from './db.mjs';

const address=value=>typeof value==='string'&&value.length<=254&&/^[^\s<>@,;\x00-\x1f\x7f]+@[^\s<>@,;\x00-\x1f\x7f]+\.[^\s<>@,;\x00-\x1f\x7f]+$/.test(value);
async function readInput(request){
  const type=request.headers.get('Content-Type')?.split(';')[0].trim();
  if(!['application/json','application/x-www-form-urlencoded'].includes(type))throw new HttpError(415,'Nepodporovaný formát správy.');
  if(Number(request.headers.get('Content-Length')||0)>16384)throw new HttpError(413,'Správa je príliš dlhá.');
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Správa je prázdna.');
  const chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();throw new HttpError(413,'Správa je príliš dlhá.');}chunks.push(value);}
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  const text=new TextDecoder().decode(bytes);
  try{const input=type==='application/json'?JSON.parse(text):Object.fromEntries(new URLSearchParams(text));if(!input||typeof input!=='object'||Array.isArray(input))throw Error();return input;}catch{throw new HttpError(400,'Neplatný formulár.');}
}
async function throttle(env,key,limit,duration){
  const at=Date.now(),cutoff=at-duration;
  const state=await first(env.TQ_DB,`INSERT INTO customer_login_attempts(scope_key,attempts,window_start) VALUES(?,1,?) ON CONFLICT(scope_key) DO UPDATE SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END RETURNING attempts`,key,at,cutoff,cutoff);
  if(state.attempts>limit)throw new HttpError(429,'Príliš veľa správ. Skúste to neskôr alebo napíšte na info@rodulab.com.');
}
export async function studioContact(request,env){
  if(new URL(request.url).hostname!=='rodulab.com')throw new HttpError(404,'Endpoint neexistuje.');
  sameOrigin(request);
  const input=await readInput(request);
  if(input.website)return {sent:true};
  const name=typeof input.name==='string'?input.name.trim():'',email=typeof input.email==='string'?input.email.trim():'',message=typeof input.message==='string'?input.message.trim():'';
  if(!address(email)||name.length>100||/[\x00-\x1f\x7f]/.test(name)||message.length<10||message.length>3000||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(message))throw new HttpError(400,'Skontrolujte e-mail a správu (10 až 3 000 znakov).');
  if(!env.RESEND_API_KEY||!address(env.SUPPORT_FORWARD_TO)||!env.CUSTOMER_AUTH_SECRET)throw new HttpError(503,'Formulár je dočasne nedostupný. Napíšte na info@rodulab.com.');
  const requestId=input.requestId??crypto.randomUUID();
  if(typeof requestId!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(requestId))throw new HttpError(400,'Obnovte stránku a skúste odoslanie znova.');
  // Reuse the existing D1 throttle table with a separate scope. The key is
  // secret-salted and changes daily; no message, name, email or raw IP is stored.
  const day=Math.floor(Date.now()/86400000),ip=request.headers.get('CF-Connecting-IP')||'unknown';
  const scope='studio:'+await hash(env.CUSTOMER_AUTH_SECRET+':'+day+':'+ip);
  await throttle(env,scope,3,600000);
  await throttle(env,'studio:daily',100,86400000);
  await env.TQ_DB.prepare('DELETE FROM customer_login_attempts WHERE scope_key LIKE ? AND window_start<?').bind('studio:%',Date.now()-172800000).run();
  const contentHash=await hash(JSON.stringify({name,email,message}));
  let response;
  try{response=await fetch('https://api.resend.com/emails',{
    method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':'rodulab-contact/'+requestId+'/'+contentHash},
    body:JSON.stringify({from:'RoduLab <studio@pixelkovia.rodulab.com>',to:[env.SUPPORT_FORWARD_TO],reply_to:email,subject:'RoduLab — nový dopyt z webu',text:`Nový dopyt z rodulab.com\n\nMeno: ${name||'(neuvedené)'}\nE-mail: ${email}\n\n${message}`}),signal:AbortSignal.timeout(18000)
  });}catch{throw new HttpError(502,'Odoslanie sa nepotvrdilo. Skúste to znova alebo napíšte na info@rodulab.com.');}
  if(!response.ok)throw new HttpError(502,'Správu sa nepodarilo odoslať. Skúste to znova alebo napíšte na info@rodulab.com.');
  const delivered=await response.json();
  if(!delivered.id)throw new HttpError(502,'Odoslanie sa nepotvrdilo. Skúste to znova.');
  return {sent:true};
}
