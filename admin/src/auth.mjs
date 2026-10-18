import {createRemoteJWKSet,jwtVerify} from 'jose';
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
  if(localRequest(request,env))return {email:'lokalny-vyvojar',local:true};
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
  // Future identity service. Never trust an incoming customer ID/email header or localStorage.
  if(!env.CUSTOMER_AUTH)throw new HttpError(501,'Zákaznícke prihlasovanie ešte nie je pripojené.');
  const response=await env.CUSTOMER_AUTH.fetch(new Request('https://identity.internal/session',{headers:{cookie:request.headers.get('cookie')||'',authorization:request.headers.get('authorization')||''}}));
  if(!response.ok)throw new HttpError(401,'Prihlásenie zákazníka sa nepodarilo overiť.');
  const identity=await response.json();
  if(!identity.customerId || identity.role!=='customer')throw new HttpError(403,'Vyžaduje sa zákaznícke oprávnenie.');
  return identity;
}
export function sameOrigin(request){
  if(!['GET','HEAD'].includes(request.method) && request.headers.get('Origin')!==new URL(request.url).origin)throw new HttpError(403,'Neplatný pôvod požiadavky.');
}
