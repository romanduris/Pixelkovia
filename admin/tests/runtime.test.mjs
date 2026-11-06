import {test} from 'node:test';import {sessionFor} from './support.mjs';import assert from 'node:assert/strict';import fs from 'node:fs';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';import {execute,first} from '../src/db.mjs';
import {createOrder} from '../src/game-service.mjs';import {checklist} from '../src/checklist.mjs';
import Stripe from 'stripe';
test('actual workerd/D1 runtime: migrations, protected APIs, server checklist, device activation and answer transaction',async()=>{
 const bundle=new URL('../.build-check/worker.js',import.meta.url);assert.ok(fs.existsSync(bundle),'Run npm run build:check before the integration test.');
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:bundle.pathname,compatibilityDate:'2026-10-18',d1Databases:{TQ_DB:'tq-runtime-test'},bindings:{ENVIRONMENT:'production',STRIPE_SECRET_KEY:'sk_test_runtime_fixture',STRIPE_WEBHOOK_SECRET:'whsec_runtime_fixture'}}));
 try{
  const db=await mf.getD1Database('TQ_DB');
  for(const file of fs.readdirSync(new URL('../migrations',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())for(const sql of fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
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
 const mf=new Miniflare(convertV4MiniflareOptions({modules:true,scriptPath:new URL('../.build-check/worker.js',import.meta.url).pathname,compatibilityDate:'2026-10-18',d1Databases:{TQ_DB:'tq-password-runtime'},bindings:{ENVIRONMENT:'production',ADMIN_AUTH_MODE:'password',...secrets},serviceBindings:{ASSETS:async request=>new Response(new URL(request.url).pathname==='/'?'protected-admin':'login-asset')}}));
 try{
  const db=await mf.getD1Database('TQ_DB');
  for(const file of fs.readdirSync(new URL('../migrations',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())for(const sql of fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8').split(';').map(s=>s.trim()).filter(Boolean))await db.prepare(sql).run();
  const unauth=await mf.dispatchFetch('https://admin.example.invalid/',{redirect:'manual'});assert.equal(unauth.status,303);
  assert.equal((await mf.dispatchFetch('https://admin.example.invalid/api/admin/customers')).status,401);
  assert.equal((await mf.dispatchFetch('https://admin.example.invalid/api/admin/payments')).status,401);
  assert.equal((await mf.dispatchFetch('https://admin.example.invalid/login')).status,200);
  const login=await mf.dispatchFetch('https://admin.example.invalid/api/admin/login',{method:'POST',headers:{origin:'https://admin.example.invalid','content-type':'application/json'},body:JSON.stringify({password})});
  assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
  const authenticated=await mf.dispatchFetch('https://admin.example.invalid/api/admin/dashboard',{headers:{cookie}});assert.equal(authenticated.status,200);
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
