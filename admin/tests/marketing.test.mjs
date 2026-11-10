import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from './support.mjs';
import {first,execute,hash} from '../src/db.mjs';
import {marketingEvent,marketingReport,marketingFilters,linkMarketingAttempt,pruneMarketing} from '../src/marketing.mjs';
import worker from '../src/worker.mjs';
import {paymentReport} from '../src/payment-monitor.mjs';
import {calendarDays} from '../src/marketing-series.mjs';
const origin='https://pixelkovia.rodulab.com',at=Date.UTC(2026,10,10,12),day=86400000;
const req=()=>new Request(origin+'/api/marketing/event',{method:'POST',headers:{origin,'content-type':'application/json'}});
const input=(extra={})=>({type:'visit',mode:'session',visitId:crypto.randomUUID(),visitorId:crypto.randomUUID(),source:'facebook_ads',campaign:'launch-2026',device:'mobile',...extra});
async function setup(){const db=fresh();await execute(db,'UPDATE marketing_state SET started_at=?',at-30*day);return {db,env:{TQ_DB:db,MARKETING_COLLECTION_ENABLED:'true',CUSTOMER_AUTH_SECRET:'a'.repeat(64)}};}
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
  for(const path of ['/api/admin/marketing','/marketing.js','/marketing-charts.js']){const denied=await worker.fetch(new Request(origin+path),{...env,ADMIN_AUTH_MODE:'password'});assert.equal(denied.status,path.startsWith('/api/')?401:303);}
  const forged=await worker.fetch(new Request(origin+'/api/marketing/event',{method:'POST',headers:{origin:'https://attacker.invalid','content-type':'application/json'},body:JSON.stringify(input())}),env);assert.equal(forged.status,403);
  await assert.rejects(marketingEvent(req(),env,input({mode:'persistent'}),at),e=>e.status===400);
  await assert.rejects(marketingEvent(req(),env,input({mode:undefined,consent:true}),at),e=>e.status===400);
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
  await execute(db,'UPDATE marketing_state SET started_at=?',at-1000);const partial=await marketingReport(env,new URLSearchParams({period:'today'}),at);assert.equal(partial.metrics.conversion,null);assert.equal(partial.metrics.visits,0);
  const unmeasured=await marketingReport(env,new URLSearchParams({period:'custom',from:'2026-11-09',to:'2026-11-09'}),at);assert.equal(unmeasured.metrics.visits,null);assert.equal(unmeasured.metrics.checkouts,null);assert.equal(unmeasured.cohort.attempts,null);
  const recent=input();await marketingEvent(req(),env,{...recent,type:'checkout'},at-800);await attempt(db,{visitId:recent.visitId,created:at-500,paid:at-100});
  const observed=await marketingReport(env,new URLSearchParams({period:'14'}),at);assert.equal(observed.partialPeriod,true);assert.equal(observed.observedStart,at-1000);assert.equal(observed.metrics.visits,1);assert.equal(observed.metrics.purchases,2);assert.equal(observed.cohort.purchases,1);assert.equal(observed.metrics.conversion,1);
 }finally{db.close();}
});
test('verified payment with missing fulfillment and gift email failure count once per transaction',async()=>{
 const {db,env}=await setup();try{
  await attempt(db,{paid:at-300000,orders:false});await attempt(db,{delivery:'failed'});await attempt(db,{delivery:'sent'});
  const d=await marketingReport(env,new URLSearchParams({period:'today'}),at);assert.equal(d.metrics.accessIssues,2);assert.equal(d.metrics.accessIssueOrders,4);assert.equal(d.metrics.purchases,3);
 }finally{db.close();}
});
test('unified overview counts calendar attempts, checkout openings and free purchases without inventing visitor conversion',async()=>{
 const {db,env}=await setup();try{
  const v=input();await marketingEvent(req(),env,v,at-day);
  await marketingEvent(req(),env,{...v,type:'checkout'},at-2000);
  await attempt(db,{visitId:v.visitId,created:at-day,paid:at-1000,gift:false});
  await attempt(db,{gift:false,total:0});
  await attempt(db,{gift:false,total:1499});
  await attempt(db,{gift:false,paid:null,orders:false});
  const d=await marketingReport(env,new URLSearchParams({period:'today'}),at);
  assert.deepEqual(d.periodMetrics,{visits:0,checkouts:1,attempts:3,purchases:2,freePurchases:1});
  assert.equal(d.metrics.conversion,null);assert.equal(d.cohort.purchases,0);
  const fb=await marketingReport(env,new URLSearchParams({period:'today',source:'facebook_ads'}),at);
  assert.deepEqual(fb.periodMetrics,{visits:0,checkouts:1,attempts:0,purchases:1,freePurchases:0});
  const product=await marketingReport(env,new URLSearchParams({period:'today',product:'game'}),at);
  assert.equal(product.periodMetrics.visits,null);assert.equal(product.periodMetrics.checkouts,null);assert.equal(product.periodMetrics.attempts,3);
  await execute(db,'UPDATE marketing_state SET started_at=?',at-500);
  const partial=await marketingReport(env,new URLSearchParams({period:'today'}),at);
  assert.equal(partial.partialPeriod,true);assert.equal(partial.periodMetrics.purchases,2);assert.equal(partial.periodMetrics.attempts,3);
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

test('since-date reports start at Bratislava midnight and keep extending to the current time',()=>{
 const params=new URLSearchParams({period:'since',from:'2026-10-25',source:'facebook'});
 const first=marketingFilters(params,at),next=marketingFilters(params,at+day);
 assert.equal(first.start,Date.parse('2026-10-24T22:00:00Z'));assert.equal(first.end,at+1);
 assert.equal(next.start,first.start);assert.equal(next.end,at+day+1);assert.equal(next.to,'2026-11-11');assert.equal(next.source,'facebook');
 for(const from of ['', '2026-02-30','2026-11-11','2025-11-09'])assert.throws(()=>marketingFilters(new URLSearchParams({period:'since',from}),at),e=>e.status===400);
});

test('disabled browser collection rejects even a cached collection request and preserves paid reporting',async()=>{
 const {db,env}=await setup();try{
  await attempt(db,{gift:false,total:1499});
  const disabled={...env,MARKETING_COLLECTION_ENABLED:'false'};
  const response=await worker.fetch(new Request(origin+'/api/marketing/event',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(input())}),disabled);
  assert.equal(response.status,410);assert.equal((await first(db,'SELECT count(*) n FROM marketing_visits')).n,0);
  const report=await marketingReport(disabled,new URLSearchParams(),at);assert.equal(report.collectionEnabled,false);assert.equal(report.metrics.purchases,1);assert.equal(report.metrics.revenueCents,1499);assert.equal(report.metrics.conversion,null);assert.match(report.conversionReason,/vypnutý/);
 }finally{db.close();}
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

test('daily sources use real Bratislava days, unique browsers deduplicate across sessions and sources without backfill',async()=>{
 const {db,env}=await setup();try{
  await execute(db,'UPDATE marketing_state SET unique_started_at=?',at-2*day);
  const browserA=crypto.randomUUID(),browserB=crypto.randomUUID();
  await marketingEvent(req(),env,input(),at-3*day);
  await marketingEvent(req(),env,input({browserId:browserA,type:'checkout'}),at-day);
  const today=input({browserId:browserA});await marketingEvent(req(),env,today,at-5000);await marketingEvent(req(),env,today,at-4500);
  await marketingEvent(req(),env,input({browserId:browserA,source:'instagram_ads',type:'checkout'}),at-4000);
  await marketingEvent(req(),env,input({browserId:browserB,source:'instagram_ads'}),at-3000);
  await marketingEvent(req(),env,input({source:'unknown'}),at-2000);
  const report=await marketingReport(env,new URLSearchParams({period:'7'}),at),charts=report.charts,todayRow=charts.days.at(-1);
  assert.equal(charts.days.length,7);assert.equal(todayRow.date,'2026-11-10');
  assert.equal(todayRow.visits,4);assert.equal(todayRow.uniqueVisitors,2);assert.equal(todayRow.checkouts,1);assert.equal(todayRow.uniqueCheckouts,1);
  assert.equal(todayRow.checkoutRate,.25);assert.equal(todayRow.uniqueCheckoutRate,.5);assert.equal(todayRow.uniquePartial,true);assert.equal(todayRow.unidentifiedVisits,1);
  assert.equal(todayRow.sources.find(row=>row.source==='facebook_ads').uniqueVisitors,1);
  assert.equal(todayRow.sources.find(row=>row.source==='instagram_ads').uniqueVisitors,1);
  assert.equal(todayRow.sources.reduce((sum,row)=>sum+row.uniqueVisitors,0),todayRow.uniqueVisitors);
  assert.equal(charts.uniqueVisitors,2);assert.equal(charts.uniqueCheckouts,1);
  assert.equal(charts.days.find(row=>row.date==='2026-11-07').uniqueVisitors,null);
  assert.equal(charts.days.find(row=>row.date==='2026-11-07').visits,1);
  const instagram=(await marketingReport(env,new URLSearchParams({period:'7',source:'instagram_ads'}),at)).charts.days.at(-1);
  assert.equal(instagram.visits,2);assert.equal(instagram.uniqueVisitors,2);assert.equal(instagram.sources.length,1);
  const unavailable=(await marketingReport(env,new URLSearchParams({product:'game'}),at)).charts;
  assert.ok(unavailable.days.every(row=>row.visits===null&&row.uniqueVisitors===null));assert.equal(unavailable.uniqueVisitors,null);
  const stored=await first(db,'SELECT browser_id FROM marketing_visits WHERE id=?',today.visitId);
  assert.equal(stored.browser_id,await hash('browser:'+browserA));assert.ok(!JSON.stringify(report).includes(browserA));
 }finally{db.close();}
});

test('daily calendar buckets cover DST once and the new 90-day preset includes today',()=>{
 for(const [date,hours]of [['2026-03-29',23],['2026-10-25',25]]){
  const f=marketingFilters(new URLSearchParams({period:'custom',from:date,to:date}),at),days=calendarDays(f);
  assert.equal(days.length,1);assert.equal((days[0].end-days[0].start)/3600000,hours);
 }
 const f=marketingFilters(new URLSearchParams({period:'90'}),at);assert.equal(calendarDays(f).length,90);assert.equal(f.to,'2026-11-10');
});

test('purchase drill-down returns the exact paid set for every report filter, including old attempts, gifts and refunds',async t=>{
 t.mock.method(Date,'now',()=>at);
 const {db,env}=await setup();try{
  const v=input();await marketingEvent(req(),env,v,at-10000);
  const gift=await attempt(db,{visitId:v.visitId,created:at-40*day});
  const refund=await attempt(db,{refund:true,gift:false,total:1499});
  await attempt(db,{gift:false,total:0});await attempt(db,{gift:false,paid:null,orders:false});
  await attempt(db,{paid:at+1000});
  const filters=[{}, {source:'facebook_ads'}, {source:'unknown'}, {campaign:'launch-2026'}, {device:'mobile'}, {product:'game'}, {source:'instagram_ads'}];
  for(const filter of filters){
   const params=new URLSearchParams({period:'today',...filter}),report=await marketingReport(env,params,at);
   params.set('scope','funnel');params.set('asOf',String(at));params.set('days','all');
   const payments=await paymentReport(env,params,true);
   assert.equal(payments.matchingTotal,report.periodMetrics.purchases,JSON.stringify(filter));
   if(!Object.keys(filter).length)assert.deepEqual(new Set(payments.rows.map(row=>row.id)),new Set([gift,refund]));
   if(filter.source==='facebook_ads')assert.deepEqual(payments.rows.map(row=>row.id),[gift]);
  }
  for(let index=0;index<45;index++)await attempt(db,{gift:false,orders:false});
  const params=new URLSearchParams({scope:'funnel',period:'today',asOf:String(at),days:'all'});
  const firstPage=await paymentReport(env,params,true);assert.equal(firstPage.matchingTotal,47);assert.equal(firstPage.rows.length,40);assert.equal(firstPage.hasMore,true);
  params.set('cursor',firstPage.nextCursor);
  const nextPage=await paymentReport(env,params,true);assert.equal(nextPage.matchingTotal,47);assert.equal(nextPage.rows.length,7);assert.equal(nextPage.hasMore,false);
  assert.equal(new Set([...firstPage.rows,...nextPage.rows].map(row=>row.id)).size,47);
  await assert.rejects(paymentReport(env,new URLSearchParams({scope:'funnel',asOf:String(at+10000)}),true),error=>error.status===400);
 }finally{db.close();}
});
