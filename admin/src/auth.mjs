import {createRemoteJWKSet,jwtVerify} from 'jose';
import {passwordSession} from './password-auth.mjs';
import {customerSession} from './customer-auth.mjs';
const keys=new Map();
export class HttpError extends Error {constructor(status,message){super(message);this.status=status;}}
export function localRequest(request,env){
  const host=new URL(request.url).hostname;
  return env.ENVIRONMENT==='local' && ['127.0.0.1','localhost','[::1]'].includes(host);
}
export async function verifyAdminToken(token,env,resolver){
  const issuer='https://'+env.ACCESS_TEAM_DOMAIN;
  const {payload}=await jwtVerify(token,resolver,{issuer,audience:env.ACCESS_AUD,algorithms:['RS256'],requiredClaims:['sub','email','exp','iat']});
  const allowed=env.ADMIN_EMAILS.split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  if(!allowed.includes(String(payload.email).toLowerCase()))throw Error('forbidden');
  return {email:payload.email,sub:payload.sub};
}
export async function requireAdmin(request,env){
  if(localRequest(request,env))return {email:'lokalny-vyvojar',local:true,authMode:'local'};
  if(env.ADMIN_AUTH_MODE==='password'){
    const session=await passwordSession(request,env);
    if(!session)throw new HttpError(401,'Vyžaduje sa heslo do administrácie.');
    return session;
  }
  if(!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD || !env.ADMIN_EMAILS)throw new HttpError(403,'Administrácia čaká na konfiguráciu Cloudflare Access.');
  const issuer='https://'+env.ACCESS_TEAM_DOMAIN;
  if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN))throw new HttpError(403,'Neplatná konfigurácia Access.');
  const token=request.headers.get('Cf-Access-Jwt-Assertion');
  if(!token)throw new HttpError(401,'Vyžaduje sa prihlásenie administrátora.');
  try{
    if(!keys.has(issuer))keys.set(issuer,createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')));
    return await verifyAdminToken(token,env,keys.get(issuer));
  }catch{throw new HttpError(403,'Prístup administrátora nebol overený.');}
}
export async function requireCustomer(request,env){
  const session=await customerSession(request,env);
  if(session)return {...session,role:'customer'};
  throw new HttpError(401,'Prihláste sa e-mailom a heslom z objednávky.');
}
export function sameOrigin(request){
  if(!['GET','HEAD'].includes(request.method) && request.headers.get('Origin')!==new URL(request.url).origin)throw new HttpError(403,'Neplatný pôvod požiadavky.');
}
