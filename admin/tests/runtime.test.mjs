import {test} from 'node:test';import {sessionFor} from './support.mjs';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';import {execute,first} from '../src/db.mjs';
import {createOrder} from '../src/game-service.mjs';import {checklist} from '../src/checklist.mjs';
import Stripe from 'stripe';
import {recordPaymentProgress} from '../src/payment-progress.mjs';
import {syncMetaAds,metaAccount} from '../src/meta-ads.mjs';
test('shipped Meta API fetch works in workerd, recovers malformed spend and refuses redirects before forwarding credentials',async()=>{
 for(const scenario of ['empty','spend-retry','redirect']){
  const calls=[];let insightReads=0,rejectedAt;
  const redirect=scenario==='redirect';
  const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:new URL('../.build-check/worker.js',import.meta.url).pathname,compatibilityDate:'2026-10-18',d1Databases:{TQ_DB:'meta-fetch-runtime-'+scenario},bindings:{ENVIRONMENT:'local',META_ADS_ACCESS_TOKEN:'runtime-meta-secret-fixture'},outboundService:async request=>{
   const url=new URL(request.url);calls.push(url.href);
   assert.equal(url.origin,'https://graph.facebook.com');assert.equal(request.headers.get('Authorization'),'Bearer runtime-meta-secret-fixture');
   if(redirect)return new Response(null,{status:302,headers:{location:'https://untrusted.invalid/runtime-meta-secret-fixture'}});
   if(scenario==='spend-retry'&&url.pathname.endsWith('/insights')){
    const date=JSON.parse(url.searchParams.get('time_range')).until;insightReads++;
    if(insightReads===1)rejectedAt=Date.now();
    else assert.ok(Date.now()-rejectedAt>=2900,'the shipped worker waits three seconds before retrying malformed spend');
    return Response.json({data:[{account_id:metaAccount,account_currency:'EUR',campaign_id:'123',campaign_name:'Runtime recovery',date_start:date,date_stop:date,publisher_platform:'facebook',spend:insightReads===1?'0.731':'0.73',impressions:'107'}]});
   }
   return Response.json(url.pathname.endsWith('/insights')?{data:[]}:{account_id:metaAccount,currency:'EUR',timezone_name:'Europe/Bratislava'});
  }}));
  try{
   const db=await mf.getD1Database('TQ_DB');
   for(const file of fs.readdirSync(new URL('../migrations',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())for(const sql of fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
   const from=new Date(Date.now()-2*86400000).toISOString().slice(0,10),to=new Date(Date.now()-86400000).toISOString().slice(0,10);
   const response=await mf.dispatchFetch('http://localhost/api/admin/marketing/ads/sync',{method:'POST',headers:{origin:'http://localhost','content-type':'application/json'},body:JSON.stringify({from,to})});
   const body=await response.json();assert.equal(response.status,redirect?502:200,JSON.stringify(body));
   assert.equal(calls.length,redirect?1:scenario==='spend-retry'?3:2);assert.ok(!JSON.stringify(body).includes('runtime-meta-secret-fixture'));
   const state=await first(db,'SELECT last_success_at,last_error FROM meta_ads_state');
   if(redirect){assert.match(state.last_error,/HTTP 302.*presmerovanie/);assert.equal(state.last_success_at,null);assert.equal((await first(db,'SELECT count(*) n FROM meta_ads_days')).n,0);}
   else{assert.ok(state.last_success_at);assert.equal(state.last_error,null);assert.equal((await first(db,'SELECT count(*) n FROM meta_ads_days')).n,2);assert.equal((await first(db,'SELECT count(*) n FROM meta_ads_impression_days WHERE synced_at IS NOT NULL')).n,2);}
   if(scenario==='spend-retry'){assert.equal(insightReads,2);assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,73);assert.equal((await first(db,'SELECT sum(impressions) n FROM meta_ads_impressions')).n,107);}
  }finally{await mf.dispose();}
 }
});
test('Meta import commits JSON batches and empty-day coverage in the actual Workers/D1 runtime',async()=>{
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:new URL('../.build-check/worker.js',import.meta.url).pathname,compatibilityDate:'2026-10-18',d1Databases:{TQ_DB:'meta-runtime-test'}}));
 try{
  const db=await mf.getD1Database('TQ_DB');
  for(const file of fs.readdirSync(new URL('../migrations',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())for(const sql of fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
  const rows=Array.from({length:125},(_,i)=>({account_id:metaAccount,account_currency:'EUR',campaign_id:String(i+1),campaign_name:'Runtime',date_start:'2026-11-10',date_stop:'2026-11-10',publisher_platform:'facebook',spend:'0.01',impressions:'2'}));
  const env={TQ_DB:db,META_ADS_ACCESS_TOKEN:'runtime-fixture',META_ADS_FETCH:async url=>Response.json(url.pathname.endsWith('/insights')?{data:rows}:{account_id:metaAccount,currency:'EUR',timezone_name:'Europe/Bratislava'})};
  const at=Date.parse('2026-11-10T12:00:00Z');
  await syncMetaAds(env,{from:'2026-11-09',to:'2026-11-10'},at);
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,125);
  assert.equal((await first(db,'SELECT sum(impressions) n FROM meta_ads_impressions')).n,250);
  assert.equal((await first(db,'SELECT count(*) n FROM meta_ads_days')).n,2);
  await syncMetaAds(env,{from:'2026-11-09',to:'2026-11-10'},at+61000);
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,125);
  assert.equal((await first(db,'SELECT sum(impressions) n FROM meta_ads_impressions')).n,250);
 }finally{await mf.dispose();}
});
test('actual workerd/D1 runtime: migrations, protected APIs, server checklist, device activation and answer transaction',async()=>{
 const bundle=new URL('../.build-check/worker.js',import.meta.url);assert.ok(fs.existsSync(bundle),'Run npm run build:check before the integration test.');
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:bundle.pathname,compatibilityDate:'2026-10-18',d1Databases:{TQ_DB:'tq-runtime-test'},bindings:{ENVIRONMENT:'production',STRIPE_SECRET_KEY:'sk_test_runtime_fixture',STRIPE_WEBHOOK_SECRET:'whsec_runtime_fixture'}}));
 try{
  const db=await mf.getD1Database('TQ_DB');
  for(const file of fs.readdirSync(new URL('../migrations',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())for(const sql of fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
  await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at) VALUES(?,?,?,?,?,?)','runtime-progress','progress@example.invalid','','["episode-1"]',1499,Date.now());
  const observation={type:'confirm_started',eventId:crypto.randomUUID(),method:'card'},progressEnv={TQ_DB:db};
  await Promise.all([recordPaymentProgress(progressEnv,{id:'runtime-progress'},observation,Date.now()),recordPaymentProgress(progressEnv,{id:'runtime-progress'},observation,Date.now())]);
  await recordPaymentProgress(progressEnv,{id:'runtime-progress'},{...observation,eventId:crypto.randomUUID()},Date.now());
  assert.equal((await first(db,"SELECT confirmation_count n FROM payment_progress WHERE attempt_id='runtime-progress'")).n,2,'real D1 atomic batch counts replays once and deliberate retries separately');
  const load={type:'form_loaded',eventId:crypto.randomUUID(),method:'card'};
  await Promise.all([recordPaymentProgress(progressEnv,{id:'runtime-progress'},load,Date.now()),recordPaymentProgress(progressEnv,{id:'runtime-progress'},load,Date.now())]);
  assert.equal((await first(db,"SELECT load_count n FROM payment_progress WHERE attempt_id='runtime-progress'")).n,1,'real D1 counts repeated delivery of the same form load only once');
  const payload=JSON.stringify({id:'evt_runtime_signed',type:'checkout.session.completed',data:{object:{id:'cs_test_runtime_fixture',payment_status:'unpaid'}}});
  const signature=new Stripe('sk_test_runtime_fixture').webhooks.generateTestHeaderString({payload,secret:'whsec_runtime_fixture'});
  const notification=await mf.dispatchFetch('http://localhost/api/stripe/webhook',{method:'POST',body:payload,headers:{'stripe-signature':signature}});
  assert.equal(notification.status,200,'real Workers crypto verifies a signed Stripe notification');
  assert.equal((await first(db,'SELECT COUNT(*) n FROM orders')).n,0,'a signed unpaid event grants no order');
  const at=Date.now();await execute(db,'INSERT INTO customers VALUES(?,?,?,?)','runtime-customer','runtime@example.invalid','Runtime Test',at);
  const identityCookie=await sessionFor(db,'runtime-customer');
  await createOrder(db,{customerId:'runtime-customer',productId:'episode-1',externalReference:'runtime-payment',at});
  const e=await first(db,'SELECT * FROM entitlements');
  await createOrder(db,{customerId:'runtime-customer',productId:'story-book-before',externalReference:'runtime-book-payment',at});
  const library=await mf.dispatchFetch('http://localhost/api/customer/library',{headers:{cookie:identityCookie}});assert.equal(library.status,200);assert.equal((await library.json()).books[0].owned,true);
  const book=await mf.dispatchFetch('http://localhost/api/customer/library/story-book-before',{headers:{cookie:identityCookie}});assert.equal(book.status,200);assert.equal((await book.json()).stories.length,3);
  assert.equal((await mf.dispatchFetch('http://localhost/api/customer/library/story-book-after',{headers:{cookie:identityCookie}})).status,403);
  const request=(path,body,cookie='')=>mf.dispatchFetch('http://localhost'+path,{method:'POST',headers:{origin:'http://localhost','content-type':'application/json',cookie:identityCookie+(cookie?'; '+cookie:'')},body:JSON.stringify(body)});
  assert.equal((await mf.dispatchFetch('http://localhost/api/admin/dashboard')).status,403);
  assert.equal((await request('/api/customer/activate',{entitlementId:e.id,activationKey:'runtime-activation'})).status,409);
  const prep=await request('/api/customer/checklist',{entitlementId:e.id,values:Object.fromEntries(checklist.map(s=>[s.id,true]))});assert.equal(prep.status,200);
  const activation=await request('/api/customer/activate',{entitlementId:e.id,activationKey:'runtime-activation'});assert.equal(activation.status,200);
  const cookie=activation.headers.get('set-cookie').split(';')[0];assert.ok(activation.headers.get('set-cookie').includes('HttpOnly'));
  const run=await activation.json();assert.ok(run.runId);assert.equal(run.deviceToken,undefined);
  const open=await request('/api/customer/events',{runId:run.runId,eventId:'runtime-open-event',stage:1,type:'opened'},cookie);assert.equal(open.status,200);
  const answer=await request('/api/customer/answer',{runId:run.runId,eventId:'runtime-answer-event',stage:1,answer:'741296'},cookie);assert.equal(answer.status,200);assert.equal((await answer.json()).run.current_stage,2);
  const repeated=await request('/api/customer/answer',{runId:run.runId,eventId:'runtime-answer-event',stage:1,answer:'741296'},cookie);assert.equal(repeated.status,200);assert.equal((await repeated.json()).duplicate,true);
  assert.equal((await first(db,'SELECT attempts FROM game_stage_progress')).attempts,1);
 }finally{await mf.dispose();}
});

test('password-only authentication works in actual Workers/D1 runtime and gates assets and APIs',async()=>{
 const {makePasswordSecrets}=await import('../src/password-auth.mjs');
 const password='runtime-test-only-password-84931';
 const secrets=await makePasswordSecrets(password);
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:new URL('../.build-check/worker.js',import.meta.url).pathname,compatibilityDate:'2026-10-18',d1Databases:{TQ_DB:'tq-password-runtime'},bindings:{ENVIRONMENT:'production',ADMIN_AUTH_MODE:'password',MARKETING_COLLECTION_ENABLED:'true',...secrets},serviceBindings:{ASSETS:async request=>new Response(new URL(request.url).pathname==='/'?'protected-admin':'login-asset')}}));
 try{
  const db=await mf.getD1Database('TQ_DB');
  for(const file of fs.readdirSync(new URL('../migrations',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())for(const sql of fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
  const unauth=await mf.dispatchFetch('https://admin.example.invalid/',{redirect:'manual'});assert.equal(unauth.status,303);
  assert.equal((await mf.dispatchFetch('https://admin.example.invalid/api/admin/customers')).status,401);
  assert.equal((await mf.dispatchFetch('https://admin.example.invalid/api/admin/payments')).status,401);
  assert.equal((await mf.dispatchFetch('https://admin.example.invalid/api/admin/marketing')).status,401);
  for(const path of ['sync','campaign'])assert.equal((await mf.dispatchFetch('https://admin.example.invalid/api/admin/marketing/ads/'+path,{method:'POST',headers:{origin:'https://admin.example.invalid','content-type':'application/json'},body:'{}'})).status,401);
  assert.equal((await mf.dispatchFetch('https://admin.example.invalid/login')).status,200);
  const login=await mf.dispatchFetch('https://admin.example.invalid/api/admin/login',{method:'POST',headers:{origin:'https://admin.example.invalid','content-type':'application/json'},body:JSON.stringify({password})});
  assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
  const authenticated=await mf.dispatchFetch('https://admin.example.invalid/api/admin/dashboard',{headers:{cookie}});assert.equal(authenticated.status,200);
  const marketing=await mf.dispatchFetch('https://admin.example.invalid/api/admin/marketing',{headers:{cookie}});assert.equal(marketing.status,200);assert.equal((await marketing.json()).metrics.visits,null);
  const event={mode:'session',type:'checkout',checkoutOpenId:crypto.randomUUID(),browserId:crypto.randomUUID(),visitId:crypto.randomUUID(),visitorId:crypto.randomUUID(),source:'influencer',campaign:'runtime-campaign',device:'mobile'};
  const denied=await mf.dispatchFetch('https://admin.example.invalid/api/marketing/event',{method:'POST',headers:{origin:'https://admin.example.invalid','content-type':'application/json'},body:JSON.stringify(event)});assert.equal(denied.status,403);
  const consent=await mf.dispatchFetch('https://admin.example.invalid/api/privacy/consent',{method:'POST',headers:{origin:'https://admin.example.invalid','content-type':'application/json'},body:JSON.stringify({version:'2026-11-10',analytics:true,marketing:false})});assert.equal(consent.status,200);
  const consentCookie=consent.headers.get('set-cookie').split(';')[0];
  const record=await mf.dispatchFetch('https://admin.example.invalid/api/marketing/event',{method:'POST',headers:{origin:'https://admin.example.invalid','content-type':'application/json',cookie:consentCookie},body:JSON.stringify(event)});assert.equal(record.status,200);
  const measured=await mf.dispatchFetch('https://admin.example.invalid/api/admin/marketing',{headers:{cookie}});assert.equal(measured.status,200);const funnel=await measured.json();assert.equal(funnel.metrics.visits,1);assert.equal(funnel.metrics.checkouts,1);assert.equal(funnel.rows.find(r=>r.source==='influencer').visits,1);
  const sendOpening=payload=>mf.dispatchFetch('https://admin.example.invalid/api/marketing/event',{method:'POST',headers:{origin:'https://admin.example.invalid','content-type':'application/json',cookie:consentCookie},body:JSON.stringify(payload)});
  assert.equal((await sendOpening(event)).status,200); // same document retry
  assert.equal((await sendOpening({...event,checkoutOpenId:crypto.randomUUID()})).status,200); // reload
  const openings=await (await mf.dispatchFetch('https://admin.example.invalid/api/admin/marketing',{headers:{cookie}})).json();
  assert.equal(openings.periodMetrics.checkouts,2);assert.equal(openings.uniqueMetrics.checkouts,1);assert.equal(openings.uniqueMetrics.visits,1);
  const paymentReport=await mf.dispatchFetch('https://admin.example.invalid/api/admin/payments',{headers:{cookie}});assert.equal(paymentReport.status,200);assert.equal((await paymentReport.json()).health,'attention');
  const eventId='b'.repeat(64);
  await execute(db,"INSERT INTO payment_log VALUES(?,NULL,'server','sdk_error','technical','','unknown','',?)",eventId,Date.now());
  const review=(session,origin='https://admin.example.invalid')=>mf.dispatchFetch('https://admin.example.invalid/api/admin/payments/review',{method:'POST',headers:{cookie:session,origin,'content-type':'application/json'},body:JSON.stringify({eventId,reviewed:true})});
  assert.equal((await review('')).status,401);assert.equal((await review(cookie,'https://attacker.invalid')).status,403);
  const reviewed=await review(cookie);assert.equal(reviewed.status,200);assert.equal((await reviewed.json()).reviewedBy,'Správca TreasureQuest');
  const afterReview=await (await mf.dispatchFetch('https://admin.example.invalid/api/admin/payments',{headers:{cookie}})).json();
  assert.equal(afterReview.errors24,0);assert.equal(afterReview.attention.reviewedTotal,1);assert.equal(afterReview.health,'attention','unconfigured payments still require attention');
  await execute(db,'DELETE FROM payment_log WHERE id=?',eventId);assert.equal(await first(db,'SELECT * FROM payment_event_reviews WHERE event_id=?',eventId),null);
  assert.equal((await mf.dispatchFetch('https://admin.example.invalid/',{headers:{cookie}})).status,200);
  const logout=await mf.dispatchFetch('https://admin.example.invalid/api/admin/logout',{method:'POST',headers:{origin:'https://admin.example.invalid',cookie}});assert.equal(logout.status,200);
  assert.equal((await mf.dispatchFetch('https://admin.example.invalid/api/admin/dashboard',{headers:{cookie}})).status,401);
 }finally{await mf.dispose();}
});
