import {HttpError,requireAdmin,requireCustomer,localRequest,sameOrigin} from './auth.mjs';
import {query,first} from './db.mjs';
import {dashboard,analytics,customers,customerDetail,orders,filters} from './analytics.mjs';
import {entitlement,readChecklist,saveChecklist,portalVisit,activate,requireRun,gameEvent,publicRun} from './game-service.mjs';
import {templates} from './email-templates.mjs';
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
    if(path.startsWith('/api/customer/'))return await customerApi(request,env,path);
    const admin=await requireAdmin(request,env);sameOrigin(request);
    if(request.method!=='GET'&&request.method!=='HEAD')throw new HttpError(405,'Administrátorské rozhranie je v tejto etape iba na čítanie.');
    if(path==='/api/admin/context')return json({admin:admin.email,environment:env.ENVIRONMENT||'production',demo:localRequest(request,env)&&env.DEMO_MODE==='true',webUrl:env.WEB_URL||null,timeZone:'Europe/Bratislava',customerAuthConnected:!!env.CUSTOMER_AUTH});
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
    const response=await env.ASSETS.fetch(request);
    const secured=new Response(response.body,response);for(const [key,value] of Object.entries(headers))if(key!=='Content-Type')secured.headers.set(key,value);
    secured.headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    return secured;
  }catch(error){return json({error:error instanceof HttpError?error.message:'Požiadavku sa nepodarilo spracovať.'},error instanceof HttpError?error.status:500);}
}};
