import {HttpError,requireAdmin,requireCustomer,localRequest,sameOrigin} from './auth.mjs';
import {query,first} from './db.mjs';
import {customerLibrary,readBook} from './library-service.mjs';
import {dashboard,analytics,customers,customerDetail,orders,filters} from './analytics.mjs';
import {entitlement,readChecklist,saveChecklist,portalVisit,activate,requireRun,gameEvent,publicRun} from './game-service.mjs';
import {templates} from './email-templates.mjs';
import {passwordLogin,passwordLogout,sessionCookie,clearCookie} from './password-auth.mjs';
import {fakeCustomerCount} from './fake-customers.mjs';
const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'};
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers});
async function body(request){
  if(!request.headers.get('content-type')?.includes('application/json'))throw new HttpError(415,'Vyžaduje sa JSON.');
  if(Number(request.headers.get('content-length')||0)>16384)throw new HttpError(413,'Požiadavka je príliš veľká.');
  const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Chýba JSON.');
  let text='',size=0;const decoder=new TextDecoder();
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();throw new HttpError(413,'Požiadavka je príliš veľká.');}text+=decoder.decode(value,{stream:true});}
  try{return JSON.parse(text+decoder.decode());}catch{throw new HttpError(400,'Neplatný JSON.');}
}
async function customerApi(request,env,path){
  const identity=await requireCustomer(request,env),db=env.TQ_DB,id=identity.customerId;
  sameOrigin(request);
  if(path==='/api/customer/library'||path.startsWith('/api/customer/library/')){
    if(request.method!=='GET')throw new HttpError(405,'Knižnica je dostupná iba na čítanie.');
    return json(path==='/api/customer/library'?await customerLibrary(db,id):await readBook(db,id,path.slice('/api/customer/library/'.length)));
  }
  const params=new URL(request.url).searchParams;
  if(path==='/api/customer/entitlements'&&request.method==='GET')return json(await query(db,`SELECT e.id,e.product_id,e.status,e.expires_at,e.activated_at,e.first_completed_at,e.replay_until FROM entitlements e JOIN order_items i ON i.id=e.order_item_id JOIN orders o ON o.id=i.order_id WHERE e.customer_id=? AND o.status='paid'`,id));
  const input=request.method==='GET'?null:await body(request),entitlementId=params.get('entitlement')||input?.entitlementId;
  if(path==='/api/customer/checklist')return json(request.method==='GET'?await readChecklist(db,id,entitlementId):await saveChecklist(db,id,entitlementId,input.values));
  if(path==='/api/customer/portal-visits'&&request.method==='POST')return json(await portalVisit(db,id,entitlementId,input.visitKey));
  if(['/api/customer/activate','/api/customer/replay'].includes(path)&&request.method==='POST'){
    if(env.UNFINISHED_TTL_HOURS && !/^[1-9][0-9]{0,4}$/.test(env.UNFINISHED_TTL_HOURS))throw new HttpError(503,'Neplatná konfigurácia platnosti hry.');
    const active=await activate(db,id,entitlementId,input.activationKey,{replay:path.endsWith('/replay'),unfinishedTtlHours:env.UNFINISHED_TTL_HOURS?Number(env.UNFINISHED_TTL_HOURS):null});
    const result=json({runId:active.runId,runNumber:active.runNumber});
    result.headers.set('Set-Cookie',`__Host-tq-run=${active.deviceToken}; HttpOnly; Secure; SameSite=Strict; Path=/`);
    return result;
  }
  if(path==='/api/customer/device-transfer')throw new HttpError(501,'Bezpečný prenos telefónu ešte nie je pripojený.');
  const runId=params.get('run')||input?.runId,token=request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-tq-run=([a-f0-9]{64})(?:;|$)/)?.[1];
  const run=await requireRun(db,id,runId,token);
  if(path==='/api/customer/progress'&&request.method==='GET')return json(await publicRun(db,run.id));
  if(path==='/api/customer/events'&&request.method==='POST'){
    if(!['opened','heartbeat','hint'].includes(input.type))throw new HttpError(400,'Tento výsledok môže potvrdiť iba server.');
    return json(await gameEvent(db,run,input));
  }
  if(path==='/api/customer/answer'&&request.method==='POST')return json(await gameEvent(db,run,{...input,type:'answer'}));
  if(path==='/api/customer/complete'&&request.method==='POST')return json(await gameEvent(db,run,{...input,type:'complete'}));
  throw new HttpError(404,'Endpoint neexistuje.');
}
export default {async fetch(request,env){
  try{
    const url=new URL(request.url),path=url.pathname;
    if(env.ENVIRONMENT==='local'&&!localRequest(request,env))throw new HttpError(403,'Lokálny režim nie je povolený na verejnej adrese.');
    if(path==='/api/customer/library'||path.startsWith('/api/customer/library/'))return await libraryApi(request,env,path);
    if(path.startsWith('/api/customer/'))return await customerApi(request,env,path);
    if(env.ADMIN_AUTH_MODE==='password' && ['/login','/login.html','/login.css','/login.js'].includes(path) && ['GET','HEAD'].includes(request.method)){
      // Assets resolves extensionless HTML itself; requesting /login.html redirects back to /login.
      const target=new URL(request.url);if(path==='/login.html')target.pathname='/login';
      return secureAsset(await env.ASSETS.fetch(new Request(target,request)));
    }
    if(path==='/api/admin/login'&&request.method==='POST'&&env.ADMIN_AUTH_MODE==='password'){
      sameOrigin(request);const input=await body(request);
      const login=await passwordLogin(request,env,input?.password);
      const response=json(login.status===200?{authenticated:true}:{error:login.error},login.status);
      if(login.token)response.headers.set('Set-Cookie',sessionCookie(login.token));
      if(login.retryAfter)response.headers.set('Retry-After',String(login.retryAfter));
      return response;
    }
    if(path==='/api/admin/logout'&&request.method==='POST'&&env.ADMIN_AUTH_MODE==='password'){
      sameOrigin(request);await passwordLogout(request,env);const response=json({authenticated:false});response.headers.set('Set-Cookie',clearCookie());return response;
    }
    let admin;
    try{admin=await requireAdmin(request,env);}catch(error){
      if(env.ADMIN_AUTH_MODE==='password'&&error.status===401&&!path.startsWith('/api/')&&['GET','HEAD'].includes(request.method))return new Response(null,{status:303,headers:{Location:'/login','Cache-Control':'no-store'}});
      throw error;
    }
    sameOrigin(request);
    if(request.method!=='GET'&&request.method!=='HEAD')throw new HttpError(405,'Administrátorské rozhranie je v tejto etape iba na čítanie.');
    if(path==='/api/admin/context')return json({admin:admin.email,authMode:admin.authMode||'access',environment:env.ENVIRONMENT||'production',demo:localRequest(request,env)&&env.DEMO_MODE==='true',fakeCustomers:await fakeCustomerCount(env.TQ_DB),webUrl:env.WEB_URL||null,timeZone:'Europe/Bratislava',customerAuthConnected:!!env.CUSTOMER_AUTH});
    if(path==='/api/admin/products')return json(await query(env.TQ_DB,'SELECT * FROM products ORDER BY id'));
    if(path==='/api/admin/dashboard')return json(await dashboard(env.TQ_DB,filters(url.searchParams)));
    if(path==='/api/admin/analytics')return json(await analytics(env.TQ_DB,filters(url.searchParams)));
    if(path==='/api/admin/customers')return json(await customers(env.TQ_DB,url.searchParams));
    if(/^\/api\/admin\/customers\/[^/]+$/.test(path))return json(await customerDetail(env.TQ_DB,decodeURIComponent(path.split('/').at(-1))));
    if(path==='/api/admin/orders')return json(await orders(env.TQ_DB,url.searchParams));
    if(path==='/api/admin/emails')return json({templates,events:await query(env.TQ_DB,'SELECT ee.*,c.email FROM email_events ee LEFT JOIN customers c ON c.id=ee.customer_id ORDER BY ee.created_at DESC LIMIT 200'),sendingEnabled:false});
    if(path==='/api/admin/events')return json(await query(env.TQ_DB,'SELECT id,run_id,stage,type,occurred_at FROM game_events ORDER BY occurred_at DESC LIMIT 200'));
    if(path.startsWith('/api/'))throw new HttpError(404,'Endpoint neexistuje.');
    // Never return the demo UI on a remote host, even if a local configuration is accidentally deployed.
    if(env.ENVIRONMENT==='local'&&!localRequest(request,env))throw new HttpError(403,'Lokálny režim nie je povolený na verejnej adrese.');
    return secureAsset(await env.ASSETS.fetch(request));
  }catch(error){return json({error:error instanceof HttpError?error.message:'Požiadavku sa nepodarilo spracovať.'},error instanceof HttpError?error.status:500);}
}};

function secureAsset(response){
  const secured=new Response(response.body,response);
  for(const [key,value] of Object.entries(headers))if(key!=='Content-Type')secured.headers.set(key,value);
  secured.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  return secured;
}

// The parent portal may have a different origin from the customer API. Only its
// configured origin receives credentialed, read-only access to the library.
async function libraryApi(request,env,path){
  const origin=request.headers.get('Origin'),ownOrigin=new URL(request.url).origin;
  let portalOrigin;try{portalOrigin=new URL(env.WEB_URL).origin;}catch{}
  if(origin&&origin!==ownOrigin&&origin!==portalOrigin)throw new HttpError(403,'Neplatný pôvod požiadavky.');
  let response;
  if(request.method==='OPTIONS'){
    const method=request.headers.get('Access-Control-Request-Method');
    const requestedHeaders=(request.headers.get('Access-Control-Request-Headers')||'').split(',').map(h=>h.trim().toLowerCase()).filter(Boolean);
    if(method!=='GET'||requestedHeaders.some(h=>h!=='authorization'))throw new HttpError(403,'Knižnica je dostupná iba na čítanie.');
    response=new Response(null,{status:204,headers:{'Cache-Control':'no-store','Access-Control-Allow-Methods':'GET','Access-Control-Allow-Headers':'Authorization'}});
  }else if(request.method!=='GET'){
    response=json({error:'Knižnica je dostupná iba na čítanie.'},405);
  }else{
    try{response=await customerApi(request,env,path);}catch(error){response=json({error:error instanceof HttpError?error.message:'Knižnicu sa nepodarilo načítať.'},error instanceof HttpError?error.status:500);}
  }
  response.headers.set('Vary','Origin');
  if(origin){response.headers.set('Access-Control-Allow-Origin',origin);response.headers.set('Access-Control-Allow-Credentials','true');}
  return response;
}
