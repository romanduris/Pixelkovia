import {first,execute,hash,randomToken} from './db.mjs';
import {keyedHash} from './password-auth.mjs';
const enc=new TextEncoder(),hex=b=>Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');
const unhex=s=>Uint8Array.from(s.match(/../g)||[],x=>parseInt(x,16));
export const emailAddress=value=>typeof value==='string'&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)?value.trim().toLowerCase():null;
export const customerToken=request=>request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-pixelkovia=([a-f0-9]{64})(?:;|$)/)?.[1];
export const customerCookie=token=>`__Host-pixelkovia=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${token?2592000:0}`;
export async function passwordHash(password,salt,secret){
  const input=await keyedHash(secret,password),key=await crypto.subtle.importKey('raw',input,'PBKDF2',false,['deriveBits']);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:100000,salt:unhex(salt)},key,256)));
}
export async function credentials(email,password,secret,at=Date.now()){
  const salt=randomToken();
  return {lookup:hex(await keyedHash(secret,email+'\0'+password)),salt,hash:await passwordHash(password,salt,secret),at};
}
export async function customerSession(request,env,at=Date.now()){
  const token=customerToken(request);if(!token||!env.TQ_DB)return null;
  return first(env.TQ_DB,'SELECT c.id customerId,c.email,c.name FROM customer_sessions s JOIN customers c ON c.id=s.customer_id WHERE s.token_hash=? AND s.expires_at>?',await hash(token),at);
}
export async function customerLogin(request,env,input,at=Date.now()){
  if(!env.CUSTOMER_AUTH_SECRET)return {status:503,error:'Prihlasovanie sa pripravuje.'};
  const email=emailAddress(input?.email),password=input?.password;
  const scope=hex(await keyedHash(env.CUSTOMER_AUTH_SECRET,'login:'+String(request.headers.get('CF-Connecting-IP')||'unknown')));
  const attempt=await first(env.TQ_DB,`INSERT INTO customer_login_attempts VALUES(?,1,?) ON CONFLICT(scope_key) DO UPDATE SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END RETURNING attempts`,scope,at,at-900000,at-900000);
  if(attempt.attempts>10)return {status:429,error:'Príliš veľa pokusov. Skúste to o 15 minút.'};
  if(!email||typeof password!=='string'||password.length<16||password.length>128)return {status:401,error:'E-mail alebo heslo nie je správne.'};
  const lookup=hex(await keyedHash(env.CUSTOMER_AUTH_SECRET,email+'\0'+password));
  const record=await first(env.TQ_DB,'SELECT * FROM customer_credentials WHERE lookup_hash=?',lookup);
  // A full password derivation is also performed for unknown credentials.
  const derived=await passwordHash(password,record?.salt||'0'.repeat(64),env.CUSTOMER_AUTH_SECRET);
  if(!record||derived!==record.password_hash)return {status:401,error:'E-mail alebo heslo nie je správne.'};
  const token=randomToken();
  await env.TQ_DB.batch([
    env.TQ_DB.prepare('DELETE FROM customer_sessions WHERE expires_at<=?').bind(at),
    env.TQ_DB.prepare('DELETE FROM customer_login_attempts WHERE scope_key=? OR window_start<?').bind(scope,at-86400000),
    env.TQ_DB.prepare('INSERT INTO customer_sessions VALUES(?,?,?,?)').bind(await hash(token),record.customer_id,at,at+2592000000)
  ]);
  return {status:200,token};
}
export async function customerLogout(request,env){const token=customerToken(request);if(token)await execute(env.TQ_DB,'DELETE FROM customer_sessions WHERE token_hash=?',await hash(token));}
