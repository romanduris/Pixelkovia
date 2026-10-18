// Password-only admin: server secrets, bounded login attempts and opaque revocable sessions.
import {first,execute,hash,randomToken} from './db.mjs';
const encoder=new TextEncoder();
export const SESSION_MS=8*3600000;
export const IDLE_MS=30*60000;
export const WINDOW_MS=15*60000;
export const ITERATIONS=100000; // Workers' deployed WebCrypto iteration limit; separately peppered.
const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
const unhex=value=>Uint8Array.from(value.match(/../g)||[],v=>Number.parseInt(v,16));
export async function keyedHash(secret,value){
  const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(value)));
}
async function derive(password,salt,pepper){
  const input=await keyedHash(pepper,password);
  const key=await crypto.subtle.importKey('raw',input,'PBKDF2',false,['deriveBits']);
  return hex(new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:ITERATIONS,salt:unhex(salt)},key,256)));
}
export async function makePasswordSecrets(password){
  if(typeof password!=='string'||password.length<16||password.length>128)throw Error('Heslo musí mať 16 až 128 znakov.');
  const pepper=randomToken(),salt=randomToken();
  const record={algorithm:'PBKDF2-SHA256-HMAC-pepper',iterations:ITERATIONS,salt,hash:await derive(password,salt,pepper),version:randomToken()};
  return {ADMIN_PASSWORD_RECORD:JSON.stringify(record),ADMIN_PASSWORD_PEPPER:pepper};
}
function configuration(env){
  try{
    const record=JSON.parse(env.ADMIN_PASSWORD_RECORD);
    if(record.algorithm!=='PBKDF2-SHA256-HMAC-pepper'||record.iterations!==ITERATIONS||!['salt','hash','version'].every(key=>/^[a-f0-9]{64}$/.test(record[key]))||!/^[a-f0-9]{64}$/.test(env.ADMIN_PASSWORD_PEPPER))return null;
    return record;
  }catch{return null;}
}
function equal(a,b){if(a.length!==b.length)return false;let mismatch=0;for(let i=0;i<a.length;i++)mismatch|=a.charCodeAt(i)^b.charCodeAt(i);return mismatch===0;}
export function cookieToken(request){return request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-tq-admin=([a-f0-9]{64})(?:;|$)/)?.[1]||null;}
export const sessionCookie=token=>`__Host-tq-admin=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_MS/1000}`;
export const clearCookie=()=>`__Host-tq-admin=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
export async function passwordSession(request,env,at=Date.now()){
  const record=configuration(env),token=cookieToken(request);
  if(!record||!env.TQ_DB||!token)return null;
  const digest=await hash(token),session=await first(env.TQ_DB,'SELECT * FROM admin_sessions WHERE token_hash=?',digest);
  if(!session)return null;
  if(session.password_version!==record.version||session.expires_at<=at||at-session.last_seen_at>=IDLE_MS){await execute(env.TQ_DB,'DELETE FROM admin_sessions WHERE token_hash=?',digest);return null;}
  if(at-session.last_seen_at>=60000)await execute(env.TQ_DB,'UPDATE admin_sessions SET last_seen_at=? WHERE token_hash=?',at,digest);
  return {email:'Správca TreasureQuest',authMode:'password',sessionHash:digest};
}
async function consumeAttempt(db,key,limit,at){
  const row=await first(db,`INSERT INTO admin_login_attempts(scope_key,attempts,window_start) VALUES(?,1,?) ON CONFLICT(scope_key) DO UPDATE SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END RETURNING attempts,window_start`,key,at,at-WINDOW_MS,at-WINDOW_MS);
  return row.attempts>limit?Math.max(1,Math.ceil((row.window_start+WINDOW_MS-at)/1000)):0;
}
export async function passwordLogin(request,env,password,at=Date.now()){
  const record=configuration(env);
  if(!record||!env.TQ_DB)return {status:503,error:'Prihlásenie ešte nie je bezpečne nastavené.'};
  const globalWait=await consumeAttempt(env.TQ_DB,'global',100,at);
  if(globalWait)return {status:429,retryAfter:globalWait,error:'Príliš veľa pokusov o prihlásenie. Skúste to neskôr.'};
  const ipKey=hex(await keyedHash(env.ADMIN_PASSWORD_PEPPER,'admin-login:'+String(request.headers.get('CF-Connecting-IP')||'unknown')));
  const wait=await consumeAttempt(env.TQ_DB,ipKey,5,at);
  if(wait)return {status:429,retryAfter:wait,error:'Príliš veľa pokusov o prihlásenie. Skúste to neskôr.'};
  if(typeof password!=='string'||password.length<16||password.length>128||!equal(await derive(password,record.salt,env.ADMIN_PASSWORD_PEPPER),record.hash))return {status:401,error:'Heslo nie je správne.'};
  const token=randomToken();
  await env.TQ_DB.batch([
    env.TQ_DB.prepare('DELETE FROM admin_sessions WHERE expires_at<=? OR password_version<>?').bind(at,record.version),
    env.TQ_DB.prepare('DELETE FROM admin_login_attempts WHERE scope_key=? OR window_start<=?').bind(ipKey,at-86400000),
    env.TQ_DB.prepare('INSERT INTO admin_sessions VALUES(?,?,?,?,?)').bind(await hash(token),record.version,at,at,at+SESSION_MS)
  ]);
  return {status:200,token};
}
export async function passwordLogout(request,env){
  const token=cookieToken(request);if(token&&env.TQ_DB)await execute(env.TQ_DB,'DELETE FROM admin_sessions WHERE token_hash=?',await hash(token));
}
