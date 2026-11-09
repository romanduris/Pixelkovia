import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from './support.mjs';
import {first,execute,hash} from '../src/db.mjs';
import {marketingEvent,marketingReport,marketingFilters,linkMarketingAttempt,pruneMarketing} from '../src/marketing.mjs';
import worker from '../src/worker.mjs';
const origin='https://pixelkovia.rodulab.com',at=Date.UTC(2026,10,10,12),day=86400000;
const req=()=>new Request(origin+'/api/marketing/event',{method:'POST',headers:{origin,'content-type':'application/json'}});
const input=(extra={})=>({type:'visit',consent:true,visitId:crypto.randomUUID(),visitorId:crypto.randomUUID(),source:'facebook_ads',campaign:'launch-2026',device:'mobile',...extra});
async function setup(){const db=fresh();await execute(db,'UPDATE marketing_state SET started_at=?',at-30*day);return {db,env:{TQ_DB:db,CUSTOMER_AUTH_SECRET:'a'.repeat(64)}};}
async function attempt(db,{visitId=null,created=at-3600000,paid=at-1000,total=2498,gift=true,selection=['episode-1','atlas-pixelkov'],refund=false,orders=true,delivery='sent'}={}){
 const id=crypto.randomUUID(),session='cs_test_'+id.replaceAll('-','');
 await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id,gift_game) VALUES(?,?,?,?,?,?,?,?)',id,'private@example.invalid','Private',JSON.stringify(selection),total,created,session,+gift);
 if(paid)await execute(db,'INSERT INTO payment_observations VALUES(?,?,?,?)',id,refund?'refunded':total===0?'free':'paid',at,paid);
 if(visitId)await execute(db,'INSERT INTO marketing_attribution VALUES(?,?,?)',id,visitId,created);
 if(orders){for(let n=0;n<(gift?2:1);n++){
  const customer=crypto.randomUUID(),order=crypto.randomUUID(),item=crypto.randomUUID();
  await execute(db,'INSERT INTO customers VALUES(?,?,?,?)',customer,'private@example.invalid','Private',created);
  await execute(db,'INSERT INTO orders VALUES(?,?,?,?,?,?,?,?)',order,customer,session+(n?':gift':''),refund?'refunded':'paid',n?999:total-(gift?999:0),'EUR',paid||created,paid);
  await execute(db,'INSERT INTO checkout_orders VALUES(?,?,?)',id,n?'gift':'primary',order);
  await execute(db,'INSERT INTO order_items VALUES(?,?,?,?,?)',item,order,'episode-1',1,1499);
  await execute(db,'INSERT INTO entitlements(id,customer_id,order_item_id,product_id,granted_at,status) VALUES(?,?,?,?,?,?)',crypto.randomUUID(),customer,item,'episode-1',paid||created,refund?'revoked':'valid');
  await execute(db,'INSERT INTO access_deliveries(order_id,customer_id,status) VALUES(?,?,?)',order,customer,delivery);
 }}
 return id;
}
test('unmeasured visits/conversions and costs stay unavailable; API requires existing admin and same origin',async()=>{
 const {db,env}=await setup();try{
  const d=await marketingReport(env,new URLSearchParams(),at);assert.equal(d.metrics.visits,null);assert.equal(d.metrics.conversion,null);assert.equal(d.cohort.attempts,null);assert.equal(d.rows[0].purchases,null);assert.equal(d.cac,null);assert.equal(d.metrics.purchases,0);
  const anonymous=await worker.fetch(new Request(origin+'/api/admin/marketing'),{...env,ADMIN_AUTH_MODE:'password'});assert.equal(anonymous.status,401);
  for(const path of ['/api/admin/marketing','/marketing.js']){const denied=await worker.fetch(new Request(origin+path),{...env,ADMIN_AUTH_MODE:'password'});assert.equal(denied.status,path.startsWith('/api/')?401:303);}
  const forged=await worker.fetch(new Request(origin+'/api/marketing/event',{method:'POST',headers:{origin:'https://attacker.invalid','content-type':'application/json'},body:JSON.stringify(input())}),env);assert.equal(forged.status,403);
  await assert.rejects(marketingEvent(req(),env,input({consent:false}),at),e=>e.status===400);
 }finally{db.close();}
});
test('visit refreshes deduplicate; unique checkout browsers differ from sessions; source remains first touch and PII is discarded',async()=>{
 const {db,env}=await setup();try{
  const v=input({email:'DO_NOT_STORE',campaign:'private@example.invalid',card:'DO_NOT_STORE'});
  await marketingEvent(req(),env,v,at-3000);await marketingEvent(req(),env,{...v,type:'checkout',source:'instagram_ads'},at-2000);
  await marketingEvent(req(),env,{...v,type:'checkout',visitId:crypto.randomUUID()},at-1000);
  const d=await marketingReport(env,new URLSearchParams({period:'today'}),at);
  assert.equal(d.metrics.visits,2);assert.equal(d.metrics.checkouts,1);assert.equal(d.rows.find(r=>r.source==='facebook_ads').visits,2);assert.equal(d.metrics.conversion,0);
  const row=await first(db,'SELECT * FROM marketing_visits LIMIT 1');assert.equal(row.campaign,'');assert.equal(row.visitor_id,await hash(v.visitorId));assert.ok(!JSON.stringify(row).includes('DO_NOT_STORE'));assert.ok(!JSON.stringify(row).includes('@'));
  await marketingEvent(req(),env,{...v,visitorId:crypto.randomUUID(),type:'checkout'},at);assert.equal((await first(db,'SELECT count(*) n FROM marketing_visits')).n,2);
 }finally{db.close();}
});
test('gift is one purchase/revenue transaction but two orders/accesses; free excluded; legacy unattributed and refunds are explicit',async()=>{
 const {db,env}=await setup();try{
  const v=input();await marketingEvent(req(),env,{...v,type:'checkout'},at-4000);
  const id=await attempt(db,{visitId:v.visitId});await attempt(db,{gift:false,total:0});await attempt(db,{gift:false,total:1499,refund:true});
  const d=await marketingReport(env,new URLSearchParams({period:'today'}),at);
  assert.equal(d.metrics.purchases,2);assert.equal(d.metrics.revenueCents,3997);assert.equal(d.metrics.orders,3);assert.equal(d.metrics.gameAccesses,2);assert.equal(d.metrics.refunds,1);assert.equal(d.metrics.conversion,1);assert.equal(d.cohort.purchases,1);assert.equal(d.cohort.attempts,1);
  assert.equal(d.addons.attempts,3);assert.equal(d.addons.gifts,1);assert.equal(d.addons.atlas,3);assert.equal(d.addons.books,0);
  assert.equal(d.rows.find(r=>r.source==='unknown').periodPurchases,1);assert.equal(d.rows.find(r=>r.source==='unknown').purchases,0);
  const fb=await marketingReport(env,new URLSearchParams({period:'today',source:'facebook_ads',device:'mobile',campaign:'launch-2026',product:'game'}),at);
  assert.equal(fb.metrics.purchases,1);assert.equal(fb.metrics.visits,null);assert.equal(fb.metrics.conversion,null);assert.match(fb.conversionReason,/Produkt/);
  assert.equal((await marketingReport(env,new URLSearchParams({source:'instagram_ads'}),at)).metrics.purchases,0);
  // No card/identity data is ever returned by this report.
  assert.ok(!JSON.stringify(d).includes('private@example'));assert.ok(!JSON.stringify(d).includes(id));
 }finally{db.close();}
});
test('calendar payments and visitor cohorts remain separate, including late payments and precollection ranges',async()=>{
 const {db,env}=await setup();try{
  const yesterday=input();await marketingEvent(req(),env,{...yesterday,type:'checkout'},at-day);
  await attempt(db,{visitId:yesterday.visitId,created:at-day,paid:at-1000});
  const today=await marketingReport(env,new URLSearchParams({period:'today'}),at);assert.equal(today.metrics.purchases,1);assert.equal(today.cohort.purchases,0);assert.equal(today.metrics.visits,0);assert.equal(today.metrics.conversion,null);
  const past=await marketingReport(env,new URLSearchParams({period:'custom',from:'2026-11-09',to:'2026-11-09'}),at);assert.equal(past.metrics.purchases,0);assert.equal(past.cohort.purchases,1);assert.equal(past.metrics.conversion,1);
  await execute(db,'UPDATE marketing_state SET started_at=?',at-1000);const partial=await marketingReport(env,new URLSearchParams({period:'today'}),at);assert.equal(partial.metrics.conversion,null);assert.match(partial.conversionReason,/začiatkom/);
  const unmeasured=await marketingReport(env,new URLSearchParams({period:'custom',from:'2026-11-09',to:'2026-11-09'}),at);assert.equal(unmeasured.metrics.visits,null);assert.equal(unmeasured.metrics.checkouts,null);assert.equal(unmeasured.cohort.attempts,null);
 }finally{db.close();}
});
test('verified payment with missing fulfillment and gift email failure count once per transaction',async()=>{
 const {db,env}=await setup();try{
  await attempt(db,{paid:at-300000,orders:false});await attempt(db,{delivery:'failed'});await attempt(db,{delivery:'sent'});
  const d=await marketingReport(env,new URLSearchParams({period:'today'}),at);assert.equal(d.metrics.accessIssues,2);assert.equal(d.metrics.accessIssueOrders,4);assert.equal(d.metrics.purchases,3);
 }finally{db.close();}
});
test('attribution requires matching random IDs and existing request key; repeat linkage is idempotent',async()=>{
 const {db,env}=await setup();try{
  const v=input();await marketingEvent(req(),env,v,at-4000);const id=await attempt(db),key=crypto.randomUUID();
  await execute(db,'INSERT INTO checkout_requests(request_key,email_key,payload_hash,attempt_id) VALUES(?,?,?,?)',await hash(key),'email-hash','payload-hash',id);
  const payload={attemptKey:key,marketingVisitId:v.visitId,marketingVisitorId:v.visitorId};
  await linkMarketingAttempt(env,{...payload,marketingVisitorId:crypto.randomUUID()},at);assert.equal((await first(db,'SELECT count(*) n FROM marketing_attribution')).n,0);
  await linkMarketingAttempt(env,payload,at);await linkMarketingAttempt(env,payload,at);assert.equal((await first(db,'SELECT count(*) n FROM marketing_attribution')).n,1);
  await pruneMarketing(env,at+367*day);assert.equal((await first(db,'SELECT count(*) n FROM marketing_visits')).n,0);assert.equal((await first(db,'SELECT count(*) n FROM checkout_attempts')).n,1);
 }finally{db.close();}
});
test('Bratislava calendar dates handle DST and reject invalid filters',()=>{
 for(const [date,hours] of [['2026-03-29',23],['2026-10-25',25]]){const f=marketingFilters(new URLSearchParams({period:'custom',from:date,to:date}),at);assert.equal((f.end-f.start)/3600000,hours);}
 for(const params of [{period:'bad'},{source:"' OR 1=1"},{campaign:'private@example.invalid'},{period:'custom',from:'2026-02-30',to:'2026-03-01'},{period:'custom',from:'2026-13-01',to:'2026-13-02'},{period:'custom',from:'2026-11-10',to:'2026-11-09'}])assert.throws(()=>marketingFilters(new URLSearchParams(params),at),e=>e.status===400);
});

test('checkout still succeeds if attribution storage fails; browser cannot forge paid analytics',async()=>{
 const {db,env}=await setup();try{
  const v=input();await marketingEvent(req(),env,v);await execute(db,'DROP TABLE marketing_attribution');
  const pending=[];const checkoutEnv={...env,PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_PUBLISHABLE_KEY:'pk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',RESEND_API_KEY:'re_fixture',STRIPE_CLIENT:{checkout:{sessions:{async create(){return {id:'cs_test_marketingfixture',status:'open',payment_status:'unpaid',ui_mode:'elements',client_secret:'fixture_client_secret'};}}}}};
  const response=await worker.fetch(new Request(origin+'/api/checkout/session',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({email:'private@example.invalid',baseId:'episode-1',books:[],atlasIncluded:true,attemptKey:crypto.randomUUID(),uiMode:'elements',marketingVisitId:v.visitId,marketingVisitorId:v.visitorId})}),checkoutEnv,{waitUntil(promise){pending.push(promise);}});
  assert.equal(response.status,200);assert.equal((await response.json()).sessionId,'cs_test_marketingfixture');await Promise.all(pending);
  assert.equal((await first(db,'SELECT count(*) n FROM orders')).n,0);
  await assert.rejects(marketingEvent(req(),env,input({type:'paid'})),e=>e.status===400);
 }finally{db.close();}
});
