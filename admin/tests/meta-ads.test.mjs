import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,LocalD1} from './support.mjs';
import {readFile,readdir} from 'node:fs/promises';
import {first,query,execute} from '../src/db.mjs';
import {syncMetaAds,scheduledMetaAds,metaAdsReport,metaImpressionsReport,metaReachReport,metaReachBreakdownReport,saveMetaCampaign,metaAccount,spendCents} from '../src/meta-ads.mjs';
import {marketingFilters,midnight} from '../src/marketing-query.mjs';
import worker from '../src/worker.mjs';
const at=Date.parse('2026-11-10T12:00:00Z'),day=86400000,hour=3600000;
const range={from:'2026-11-09',to:'2026-11-10'};
const row=(extra={})=>({account_id:metaAccount,account_currency:'EUR',campaign_id:'123',campaign_name:'Launch',date_start:'2026-11-10',date_stop:'2026-11-10',publisher_platform:'facebook',spend:'12.34',...extra});
function api(rows=[row()],options={}){
  const calls=[];
  const fetch=async(url,init)=>{
    calls.push({url:new URL(url),init});
    if(url.pathname.endsWith('/insights'))return options.insights?options.insights(url,init):Response.json({data:rows});
    return Response.json({account_id:metaAccount,currency:'EUR',timezone_name:'Europe/Bratislava',...options.account});
  };
  return {fetch,calls};
}
function setup(rows,options){const db=fresh(),mock=api(rows,options);return {db,mock,env:{TQ_DB:db,META_ADS_ACCESS_TOKEN:'test-token-never-in-url',META_ADS_FETCH:mock.fetch}};}
const filters=extra=>marketingFilters(new URLSearchParams({period:'custom',...range,...extra}),at);
const collection={enabled:true,startedAt:at-10*day,lastEventAt:at-1000};
test('daily import replaces a range atomically, corrects spend and records real zero days; pagination never follows URLs',async()=>{
 const {db,env,mock}=setup();try{
  let pages=0;
  env.META_ADS_FETCH=api([],{insights:url=>{pages++;return Response.json(url.searchParams.has('after')?{data:[row({publisher_platform:'instagram',spend:'0.01'})]}:{data:[row()],paging:{next:'https://attacker.invalid/?access_token=secret',cursors:{after:'page-2'}}});}}).fetch;
  await syncMetaAds(env,range,at);assert.equal(pages,2);
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,1235);
  assert.equal((await first(db,'SELECT count(*) n FROM meta_ads_days')).n,2);
  env.META_ADS_FETCH=mock.fetch;await syncMetaAds(env,range,at+61000);
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,1234);
  for(const {url,init}of mock.calls){assert.equal(url.origin,'https://graph.facebook.com');assert.equal(init.headers.Authorization,'Bearer '+env.META_ADS_ACCESS_TOKEN);assert.ok(!url.href.includes(env.META_ADS_ACCESS_TOKEN));assert.equal(init.redirect,'manual');}
  const insight=mock.calls.find(c=>c.url.pathname.endsWith('/insights')).url;assert.equal(insight.searchParams.get('breakdowns'),'publisher_platform');assert.equal(insight.searchParams.get('time_increment'),'1');
  env.META_ADS_FETCH=api([]).fetch;await syncMetaAds(env,range,at+122000);
  assert.equal((await first(db,'SELECT count(*) n FROM meta_ads_spend')).n,0);
  const report=await metaAdsReport(env,filters(),collection,at+123000);assert.equal(report.costs,0);assert.equal(report.cac,null);
 }finally{db.close();}
});
test('failed second page preserves old spend and coverage; provider errors expose codes without tokens or messages',async()=>{
 const {db,env}=setup();try{
  await syncMetaAds(env,range,at);const before=await query(db,'SELECT * FROM meta_ads_days');
  env.META_ADS_FETCH=api([],{insights:url=>Response.json(url.searchParams.has('after')?{error:{code:190,error_subcode:463,message:'private token test-token-never-in-url'}}:{data:[row({spend:'99.99'})],paging:{next:'https://graph.facebook.com/next',cursors:{after:'two'}}},{status:url.searchParams.has('after')?400:200})}).fetch;
  await assert.rejects(syncMetaAds(env,range,at+61000),e=>e.status===502&&/190 \/ 463/.test(e.message)&&!e.message.includes('test-token'));
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,1234);assert.deepEqual(await query(db,'SELECT * FROM meta_ads_days'),before);
  const report=await metaAdsReport(env,filters(),collection,at+62000);assert.equal(report.costs,1234);assert.equal(report.ads.stale,true);assert.equal(report.cac,null);assert.match(report.costReason,/190/);assert.ok(!JSON.stringify(report).includes(env.META_ADS_ACCESS_TOKEN));
 }finally{db.close();}
});
test('a transient malformed spend retries the entire read once without retaining rejected pages',async()=>{
 const {db,env}=setup();try{
  const cursors=[];
  env.META_ADS_FETCH=api([],{insights:url=>{
   cursors.push(url.searchParams.get('after'));
   if(cursors.length===1)return Response.json({data:[row({spend:'99.99'})],paging:{next:'https://graph.facebook.com/next',cursors:{after:'second-page'}}});
   if(cursors.length===2)return Response.json({data:[row({publisher_platform:'instagram',spend:'invalid'})]});
   return Response.json({data:[row({spend:'0.73',impressions:'107'}),row({publisher_platform:'instagram',spend:'0.09',impressions:'13'})]});
  }}).fetch;
  await syncMetaAds(env,range,at);
  assert.deepEqual(cursors,[null,'second-page',null]);
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,82);
  assert.equal((await first(db,'SELECT sum(impressions) n FROM meta_ads_impressions')).n,120);
  assert.equal((await first(db,'SELECT last_error FROM meta_ads_state')).last_error,null);
  let requests=0;
  env.META_ADS_FETCH=api([],{insights:()=>{requests++;return Response.json({data:[row({spend:'private token test-token-never-in-url'})]});}}).fetch;
  await assert.rejects(syncMetaAds(env,range,at+61000),error=>error.status===502&&/nepodporovaný text/.test(error.message)&&!error.message.includes('test-token'));
  assert.equal(requests,2,'persistent corruption is bounded to two reads');
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,82);
  assert.equal((await first(db,'SELECT min(synced_at) n FROM meta_ads_days')).n,at);
  assert.equal((await first(db,'SELECT last_success_at FROM meta_ads_state')).last_success_at,at);
 }finally{db.close();}
});
test('wrong account, currency, timezone, duplicate rows, invalid amounts and broken pagination cannot publish partial data',async()=>{
 for(const options of [
  {account:{account_id:'999'}},{account:{currency:'USD'}},{account:{timezone_name:'America/Los_Angeles'}},
  {insights:()=>Response.json({data:[row(),row()]})},
  {insights:()=>Response.json({data:[row({spend:'1.2.3'})]})},
  {insights:()=>Response.json({data:[row({account_id:'999'})]})},
  {insights:()=>Response.json({data:[row({date_start:'2026-11-08',date_stop:'2026-11-08'})]})},
  {insights:()=>Response.json({data:[row()],paging:{next:'https://other.invalid'}})}
 ]){
  const {db,env}=setup([],options);try{await assert.rejects(syncMetaAds(env,range,at),e=>e.status===502);assert.equal((await first(db,'SELECT count(*) n FROM meta_ads_days')).n,0);assert.equal((await first(db,'SELECT count(*) n FROM meta_ads_spend')).n,0);}finally{db.close();}
 }
 assert.equal(spendCents('0.01'),1);assert.equal(spendCents('12.3'),1230);for(const value of ['-1','1e3','NaN','1,23',12])assert.throws(()=>spendCents(value));
});
test('the shared import deadline interrupts the retry pause without a second request or partial writes',async t=>{
 const {db,env}=setup(),controller=new AbortController();
 t.mock.method(AbortSignal,'timeout',()=>controller.signal);
 try{
  await syncMetaAds(env,range,at);
  let reads=0;
  env.META_ADS_FETCH=api([],{insights:()=>{
   reads++;setTimeout(()=>controller.abort(),25);
   return Response.json({data:[row({spend:'invalid'})]});
  }}).fetch;
  await assert.rejects(syncMetaAds(env,range,at+61000),error=>error.status===502&&/časový limit/.test(error.message));
  assert.equal(reads,1);
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,1234);
  assert.equal((await first(db,'SELECT last_success_at FROM meta_ads_state')).last_success_at,at);
 }finally{db.close();}
});
test('transport and response failures remain distinct and never leak token or provider content',async()=>{
 for(const [fetch,expected]of [
  [async()=>{throw Error('private transport test-token-never-in-url');},/pred prijatím HTTP odpovede/],
  [async()=>new Response('<html>private test-token-never-in-url</html>',{status:503}),/HTTP 503: odpoveď nie je platný JSON/],
  [async()=>Response.json(null),/HTTP 200: neočakávaný formát JSON/],
  [async()=>Response.json('private test-token-never-in-url'),/HTTP 200: neočakávaný formát JSON/],
  [async()=>Response.json([]),/HTTP 200: neočakávaný formát JSON/]
 ]){
  const {db,env}=setup();try{
   await syncMetaAds(env,range,at);
   const coverage=await query(db,'SELECT * FROM meta_ads_days');env.META_ADS_FETCH=fetch;
   await assert.rejects(syncMetaAds(env,range,at+61000),e=>e.status===502&&expected.test(e.message)&&!e.message.includes('private')&&!e.message.includes(env.META_ADS_ACCESS_TOKEN));
   const state=await first(db,'SELECT last_error,lock_until FROM meta_ads_state');
   assert.match(state.last_error,expected);assert.ok(!state.last_error.includes(env.META_ADS_ACCESS_TOKEN));assert.equal(state.lock_until,0);
   assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,1234);assert.deepEqual(await query(db,'SELECT * FROM meta_ads_days'),coverage);
  }finally{db.close();}
 }
});
test('token paste trims outer whitespace but rejects embedded whitespace before making a request',async()=>{
 const {db,env,mock}=setup();try{
  env.META_ADS_ACCESS_TOKEN=' \n'+env.META_ADS_ACCESS_TOKEN+'\r\n';
  await syncMetaAds(env,range,at);assert.equal(mock.calls[0].init.headers.Authorization,'Bearer test-token-never-in-url');
  const calls=mock.calls.length;env.META_ADS_ACCESS_TOKEN='test-token\nprivate-value';
  await assert.rejects(syncMetaAds(env,range,at+61000),e=>e.status===502&&/neplatný formát/.test(e.message)&&!e.message.includes('private-value'));
  assert.equal(mock.calls.length,calls);assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,1234);
 }finally{db.close();}
});
test('a D1 write failure rolls back range replacement and coverage together',async()=>{
 const {db,env}=setup();try{
  await syncMetaAds(env,range,at);
  const amounts=await query(db,'SELECT * FROM meta_ads_spend_amounts');
  db.sqlite.exec("CREATE TRIGGER fail_meta_coverage BEFORE INSERT ON meta_ads_days BEGIN SELECT RAISE(ABORT,'private database failure'); END");
  env.META_ADS_FETCH=api([row({spend:'99.99'})]).fetch;
  await assert.rejects(syncMetaAds(env,range,at+61000),e=>e.status===502&&!e.message.includes('private database'));
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,1234);
  assert.equal((await first(db,'SELECT min(synced_at) n FROM meta_ads_days')).n,at);
  assert.equal((await first(db,'SELECT last_success_at FROM meta_ads_state')).last_success_at,at);
  assert.deepEqual(await query(db,'SELECT * FROM meta_ads_spend_amounts'),amounts);
 }finally{db.close();}
});
test('concurrent imports and automatic retries are bounded without disturbing a successful run',async()=>{
 const {db,env}=setup();try{
  let release;const barrier=new Promise(r=>release=r),upstream=env.META_ADS_FETCH;let started;const ready=new Promise(r=>started=r);
  env.META_ADS_FETCH=async(...args)=>{started();await barrier;return upstream(...args);};
  const running=syncMetaAds(env,range,at);await ready;
  await assert.rejects(syncMetaAds(env,range,at+1),e=>e.status===429);assert.deepEqual(await scheduledMetaAds(env,at+1),{skipped:true});
  release();await running;
  assert.equal((await first(db,'SELECT last_success_at FROM meta_ads_state')).last_success_at,at);
  await assert.rejects(syncMetaAds({...env,META_ADS_ACCESS_TOKEN:''},range,at+61000),e=>e.status===503);
  assert.deepEqual(await scheduledMetaAds({...env,META_ADS_ACCESS_TOKEN:''},at+61000),{skipped:true});
 }finally{db.close();}
});
test('failed scheduled imports retry after ten minutes and successful imports return to hourly refreshes',async()=>{
 const {db,env}=setup();try{
  await syncMetaAds(env,range,at);
  env.META_ADS_FETCH=api([row({spend:'invalid'})]).fetch;
  const failedAt=at+3600000;
  assert.deepEqual(await scheduledMetaAds(env,failedAt),{failed:true});
  assert.match((await first(db,'SELECT last_error FROM meta_ads_state')).last_error,/nepodporovaný text/);
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,1234);
  const recovery=api([row({spend:'0.82',impressions:'120'})]);env.META_ADS_FETCH=recovery.fetch;
  assert.deepEqual(await scheduledMetaAds(env,failedAt+599999),{skipped:true});assert.equal(recovery.calls.length,0);
  assert.equal((await scheduledMetaAds(env,failedAt+600000)).imported,true);
  assert.equal((await first(db,'SELECT last_error FROM meta_ads_state')).last_error,null);
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,82);
  const calls=recovery.calls.length;
  assert.deepEqual(await scheduledMetaAds(env,failedAt+1200000),{skipped:true});assert.equal(recovery.calls.length,calls);
 }finally{db.close();}
});
async function visit(db,source='facebook_ads',campaign='launch-2026',started=at-3600000){
 const id=crypto.randomUUID();await execute(db,'INSERT INTO marketing_visits(id,visitor_id,source,campaign,device,started_at,checkout_at,last_at,browser_id) VALUES(?,?,?,?,?,?,?,?,?)',id,'hashed-visitor',source,campaign,'mobile',started,started,started,null);return id;
}
async function paid(db,visitId,{free=false,gift=false,refund=false,paidAt=at-1000}={}){
 const id=crypto.randomUUID();await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id,gift_game) VALUES(?,?,?,?,?,?,?,?)',id,'private@example.invalid','Private','["episode-1"]',free?0:gift?2498:1499,at-200000,'cs_test_'+id,+gift);
 await execute(db,'INSERT INTO payment_observations VALUES(?,?,?,?)',id,free?'free':refund?'refunded':'paid',paidAt,paidAt);
 if(visitId)await execute(db,'INSERT INTO marketing_attribution VALUES(?,?,?)',id,visitId,at-200000);
}
test('CAC uses mapped paid advertising cohorts: gift once, free and unattributed excluded, late and refunded payments retained',async()=>{
 const {db,env}=setup([row(),row({publisher_platform:'instagram',spend:'7.66'})]);try{
  const fb=await visit(db),ig=await visit(db,'instagram_ads');
  await paid(db,fb,{gift:true});await paid(db,fb,{free:true});await paid(db,ig,{refund:true});await paid(db,null);await paid(db,fb,{paidAt:at+1000});
  await syncMetaAds(env,range,at);
  let r=await metaAdsReport(env,filters(),collection,at);assert.equal(r.costs,2000);assert.equal(r.cac,null);assert.match(r.cacReason,/priradenie/);
  await saveMetaCampaign(env,{campaignId:'123',utmCampaign:'launch-2026'});
  r=await metaAdsReport(env,filters(),collection,at);assert.equal(r.costs,2000);assert.equal(r.cac,1000);assert.equal(r.ads.attributedPurchases,2);
  r=await metaAdsReport(env,filters({source:'facebook_ads',campaign:'launch-2026'}),collection,at);assert.equal(r.costs,1234);assert.equal(r.cac,1234);assert.equal(r.ads.attributedPurchases,1);
  r=await metaAdsReport(env,filters({source:'instagram_ads'}),collection,at);assert.equal(r.costs,766);assert.equal(r.cac,766);
  r=await metaAdsReport(env,filters(),collection,at+2000);assert.equal(r.ads.attributedPurchases,3);assert.equal(r.cac,2000/3);
  assert.ok(!JSON.stringify(r).includes('private@example.invalid'));
  await assert.rejects(saveMetaCampaign(env,{campaignId:'123',utmCampaign:'email@example.invalid'}),e=>e.status===400);
  await assert.rejects(saveMetaCampaign(env,{campaignId:'456',utmCampaign:'launch'}),e=>e.status===400);
 }finally{db.close();}
});
test('unknown costs, partial collection, missing mapping, platform and unsupported filters never masquerade as zero CAC',async()=>{
 const {db,env}=setup();try{
  await syncMetaAds(env,range,at);await saveMetaCampaign(env,{campaignId:'123',utmCampaign:'launch-2026'});
  const fb=await visit(db);await paid(db,fb);
  for(const extra of [{device:'mobile'},{product:'game'},{source:'facebook'},{source:'meta'},{campaign:'unmapped'}]){const r=await metaAdsReport(env,filters(extra),collection,at);assert.equal(r.costs,null);assert.equal(r.cac,null);}
  let r=await metaAdsReport(env,marketingFilters(new URLSearchParams({period:'14'}),at),collection,at);assert.equal(r.costs,null);assert.match(r.costReason,/chýba úspešný import/);
  r=await metaAdsReport(env,filters(),collection,at+3*3600000);assert.equal(r.costs,1234);assert.equal(r.ads.stale,true);assert.match(r.costReason,/staršie/);
  for(const c of [{...collection,enabled:false},{...collection,startedAt:midnight(range.from)+1},{...collection,lastEventAt:null}]){r=await metaAdsReport(env,filters(),c,at);assert.equal(r.costs,1234);assert.equal(r.cac,null);}
  await visit(db,'facebook_ads','unmapped');r=await metaAdsReport(env,filters(),collection,at);assert.equal(r.cac,null);assert.match(r.cacReason,/priradenie/);
  env.META_ADS_FETCH=api([row({publisher_platform:'audience_network'})]).fetch;await syncMetaAds(env,range,at+61000);r=await metaAdsReport(env,filters(),collection,at+62000);assert.equal(r.costs,1234);assert.equal(r.cac,null);assert.match(r.cacReason,/iným Meta platformám/);
 }finally{db.close();}
});
test('import handles 23-hour and 25-hour days by calendar dates and accepts equivalent Prague timezone',async()=>{
 for(const [date,hours]of [['2026-03-29',23],['2026-10-25',25]]){
  const now=midnight(date)+hours*3600000-1,{db,env}=setup([row({date_start:date,date_stop:date})],{account:{timezone_name:'Europe/Prague'}});
  try{await syncMetaAds(env,{from:date,to:date},now);const f=marketingFilters(new URLSearchParams({period:'custom',from:date,to:date}),now);assert.equal(f.end-f.start,hours*3600000);assert.equal((await metaAdsReport(env,f,{...collection,startedAt:f.start-1},now)).costs,1234);}finally{db.close();}
 }
});
test('admin POSTs require an authenticated administrator and same origin; absent credentials report an honest 503',async()=>{
 const db=fresh();try{
  const post=(origin='https://pixelkovia.rodulab.com',requestOrigin=origin)=>new Request(origin+'/api/admin/marketing/ads/sync',{method:'POST',headers:{origin:requestOrigin,'content-type':'application/json'},body:JSON.stringify(range)});
  assert.equal((await worker.fetch(post(),{TQ_DB:db,ENVIRONMENT:'production',ADMIN_AUTH_MODE:'password'})).status,401);
  assert.equal((await worker.fetch(post('http://localhost','https://attacker.invalid'),{TQ_DB:db,ENVIRONMENT:'local'})).status,403);
  assert.equal((await worker.fetch(post('http://localhost'),{TQ_DB:db,ENVIRONMENT:'local'})).status,503);
  assert.equal((await first(db,'SELECT last_attempt_at FROM meta_ads_state')).last_attempt_at,null);
 }finally{db.close();}
});

test('impressions reuse the spend import, require their own coverage and respect platform/campaign filters',async()=>{
 const {db,env,mock}=setup();try{
  await syncMetaAds(env,range,at);
  let costs=await metaAdsReport(env,filters(),collection,at);
  assert.equal(costs.costs,1234);
  assert.equal((await metaImpressionsReport(env,filters(),costs,at)).total,null,'old/missing impression fields do not prove zero');
  env.META_ADS_FETCH=api([row({impressions:'80'}),row({publisher_platform:'instagram',spend:'0.00',impressions:'20'}),row({publisher_platform:'audience_network',spend:'0.00',impressions:'10'})]).fetch;
  await syncMetaAds(env,range,at+61000);
  await saveMetaCampaign(env,{campaignId:'123',utmCampaign:'launch-2026'});
  costs=await metaAdsReport(env,filters(),collection,at+62000);assert.equal(costs.costs,1234);
  let r=await metaImpressionsReport(env,filters(),costs,at+62000);
  assert.deepEqual([r.total,r.facebook,r.instagram,r.other],[110,80,20,10]);assert.equal(r.syncedAt,at+61000);
  for(const [filter,total]of [[{source:'facebook_ads'},80],[{source:'instagram_ads'},20],[{campaign:'launch-2026'},110]]){
   const f=filters(filter);r=await metaImpressionsReport(env,f,await metaAdsReport(env,f,collection,at+62000),at+62000);assert.equal(r.total,total);
  }
  for(const filter of [{source:'facebook'},{device:'mobile'},{product:'books'},{campaign:'unmapped'}]){
   const f=filters(filter);assert.equal((await metaImpressionsReport(env,f,await metaAdsReport(env,f,collection,at+62000),at+62000)).total,null);
  }
  const stale=await metaAdsReport(env,filters(),collection,at+3*3600000),saved=await metaImpressionsReport(env,filters(),stale,at+3*3600000);assert.equal(saved.total,110);assert.equal(saved.stale,true);assert.equal(saved.syncedAt,at+61000);
  const fields=mock.calls.find(c=>c.url.pathname.endsWith('/insights')).url.searchParams.get('fields');assert.ok(fields.split(',').includes('impressions'));
  env.META_ADS_FETCH=api([]).fetch;await syncMetaAds(env,range,at+122000);
  costs=await metaAdsReport(env,filters(),collection,at+123000);
  r=await metaImpressionsReport(env,filters(),costs,at+123000);assert.deepEqual([r.total,r.facebook,r.instagram,r.other],[0,0,0,0]);assert.equal(costs.costs,0);
 }finally{db.close();}
});
test('malformed impressions never invent zero or change a valid expense import',async()=>{
 for(const impressions of [undefined,null,'-1','1.5','1e3','9007199254740992',42]){
  const {db,env}=setup([row({impressions})]);try{
   await syncMetaAds(env,range,at);const costs=await metaAdsReport(env,filters(),collection,at);
   assert.equal(costs.costs,1234);assert.equal((await metaImpressionsReport(env,filters(),costs,at)).total,null);
   assert.equal((await first(db,'SELECT last_error FROM meta_ads_state')).last_error,null);
  }finally{db.close();}
 }
});
test('the existing cron bootstraps 30 days of impressions, then retains its seven-day hourly refresh',async()=>{
 const {db,env}=setup();try{
  await syncMetaAds(env,range,at-2*3600000);
  const mock=api([row({impressions:'80'})]);env.META_ADS_FETCH=mock.fetch;
  await scheduledMetaAds(env,at);
  assert.equal(JSON.parse(mock.calls.find(c=>c.url.pathname.endsWith('/insights')).url.searchParams.get('time_range')).since,'2026-10-12');
  assert.equal((await first(db,'SELECT count(*) n FROM meta_ads_impression_days WHERE synced_at IS NOT NULL')).n,30);
  assert.deepEqual(await scheduledMetaAds(env,at+1000),{skipped:true});
  mock.calls.length=0;await scheduledMetaAds(env,at+3600000);
  assert.equal(JSON.parse(mock.calls.find(c=>c.url.pathname.endsWith('/insights')).url.searchParams.get('time_range')).since,'2026-11-04');
 }finally{db.close();}
});
test('impression migration preserves existing amounts and remains compatible with the previously shipped importer',async()=>{
 const db=new LocalD1();try{
  const directory=new URL('../migrations/',import.meta.url);
  for(const name of (await readdir(directory)).filter(name=>name.endsWith('.sql')&&name<'0022_meta_impressions.sql').sort())db.sqlite.exec(await readFile(new URL(name,directory),'utf8'));
  await execute(db,'INSERT INTO meta_ads_spend VALUES(?,?,?,?,?)','2026-11-10','123','Launch','facebook',1234);
  await execute(db,'INSERT INTO meta_ads_days VALUES(?,?)','2026-11-10',at);
  await execute(db,'UPDATE meta_ads_state SET last_success_at=?,last_attempt_at=? WHERE id=1',at,at);
  const spend=await query(db,'SELECT * FROM meta_ads_spend'),coverage=await query(db,'SELECT * FROM meta_ads_days');
  db.sqlite.exec(await readFile(new URL('0022_meta_impressions.sql',directory),'utf8'));
  assert.deepEqual(await query(db,'SELECT * FROM meta_ads_spend'),spend);assert.deepEqual(await query(db,'SELECT * FROM meta_ads_days'),coverage);
  assert.equal((await first(db,'SELECT last_success_at FROM meta_ads_state')).last_success_at,at);
  assert.equal((await first(db,'SELECT last_attempt_at FROM meta_ads_state')).last_attempt_at,null);
  assert.equal((await first(db,'SELECT count(*) n FROM meta_ads_impression_days')).n,0);
  await execute(db,'INSERT INTO meta_ads_spend VALUES(?,?,?,?,?)','2026-11-09','123','Launch','facebook',100);
  await execute(db,'INSERT INTO meta_ads_days VALUES(?,?)','2026-11-09',at);
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,1334);
 }finally{db.close();}
});

test('real six-decimal Meta amounts import once; selected sums round once without floating point drift',async()=>{
 const {db,env,mock}=setup([
  row({spend:'0.290694',impressions:'163',publisher_platform:'audience_network'}),
  row({spend:'2.482083',impressions:'102'}),
  row({spend:'0.268333',impressions:'14',publisher_platform:'instagram'})
 ]);try{
  await syncMetaAds(env,range,at);
  assert.equal(mock.calls.length,2,'valid fractional cents never trigger a retry');
  assert.equal((await metaAdsReport(env,filters(),collection,at)).costs,304);
  assert.equal((await metaImpressionsReport(env,filters(),await metaAdsReport(env,filters(),collection,at),at)).total,279);
  assert.deepEqual((await query(db,'SELECT amount FROM meta_ads_spend_amounts ORDER BY platform')).map(r=>r.amount),['0.290694','2.482083','0.268333']);
  env.META_ADS_FETCH=api([row({spend:'0.004'}),row({spend:'0.004',publisher_platform:'instagram'})]).fetch;
  await syncMetaAds(env,range,at+61000);
  assert.equal((await first(db,'SELECT sum(spend_cents) n FROM meta_ads_spend')).n,0);
  assert.equal((await metaAdsReport(env,filters(),collection,at+62000)).costs,1,'0.004 + 0.004 rounds to one cent after summing');
  assert.equal((await metaAdsReport(env,filters({source:'facebook_ads'}),collection,at+62000)).costs,0,'a platform filter rounds only its selected amount');
  for(const [amount,cents]of [['0.005',1],['1.005',101],['0.00499999999999999999',0],['999999999999.99999999999999999999',100000000000000]])assert.equal(spendCents(amount),cents);
  env.META_ADS_FETCH=api([]).fetch;await syncMetaAds(env,range,at+122000);
  assert.equal((await first(db,'SELECT count(*) n FROM meta_ads_spend_amounts')).n,0);
 }finally{db.close();}
});

test('transient Meta HTTP failures retry, retain all saved metrics on failure and recover automatically',async()=>{
 const {db,env}=setup([row({impressions:'100'})]);try{
  await syncMetaAds(env,range,at);
  let attempts=0;
  env.META_ADS_FETCH=api([],{insights:()=>++attempts===1?Response.json({error:{code:2,is_transient:true}},{status:503}):Response.json({data:[row({spend:'0.123456',impressions:'110'})]})}).fetch;
  await syncMetaAds(env,range,at+61000);assert.equal(attempts,2);
  env.META_ADS_FETCH=async()=>Response.json({error:{code:190,error_subcode:463,message:'private token test-token-never-in-url'}},{status:400});
  await assert.rejects(syncMetaAds(env,range,at+122000));
  const report=await metaAdsReport(env,filters(),collection,at+123000),impressions=await metaImpressionsReport(env,filters(),report,at+123000);
  assert.equal(report.costs,12);assert.equal(report.ads.stale,true);assert.equal(report.ads.syncedAt,at+61000);
  assert.equal(impressions.total,110);assert.equal(impressions.stale,true);assert.equal(impressions.syncedAt,at+61000);
  assert.ok(!JSON.stringify({report,impressions}).includes('test-token'));
  env.META_ADS_FETCH=api([row({spend:'0.234567',impressions:'120'})]).fetch;
  assert.equal((await scheduledMetaAds(env,at+722000)).imported,true);
  const fresh=await metaAdsReport(env,filters(),collection,at+723000);
  assert.equal(fresh.ads.stale,false);assert.equal(fresh.ads.error,null);assert.equal(fresh.costs,23);
 }finally{db.close();}
});

function reachApi(total='75',impressions='180'){
 const calls=[];
 return {calls,fetch:async(url,init)=>{
  calls.push({url:new URL(url),init});
  const {since,until}=JSON.parse(url.searchParams.get('time_range'));
  return Response.json({data:total===null?[]:[{account_id:metaAccount,date_start:since,date_stop:until,reach:total,impressions}]});
 }};
}
const reachCosts=(extra={})=>({ads:{campaigns:[],lastSuccessAt:null,...extra}});
test('Reach uses one deduplicated account-level query over the exact range and caches it',async()=>{
 const {db,env}=setup(),mock=reachApi();env.META_ADS_FETCH=mock.fetch;
 try{
  const r=await metaReachReport(env,filters(),reachCosts(),at);
  assert.equal(r.total,75);assert.equal(r.impressions,180);assert.equal(r.syncedAt,at);assert.equal(r.stale,false);
  assert.equal(mock.calls.length,1);
  const {url,init}=mock.calls[0];assert.equal(url.searchParams.get('level'),'account');
  assert.equal(url.searchParams.has('time_increment'),false);assert.equal(url.searchParams.has('breakdowns'),false);
  assert.deepEqual(JSON.parse(url.searchParams.get('time_range')),{since:range.from,until:range.to});
  assert.equal(init.headers.Authorization,'Bearer '+env.META_ADS_ACCESS_TOKEN);assert.ok(!url.href.includes(env.META_ADS_ACCESS_TOKEN));
  assert.equal((await metaReachReport(env,filters(),reachCosts(),at+30000)).total,75);assert.equal(mock.calls.length,1);
  await metaReachReport(env,filters(),reachCosts({lastSuccessAt:at+61000}),at+62000);assert.equal(mock.calls.length,2,'a successful manual/cron import invalidates an older Reach snapshot');
  await metaReachReport(env,filters(),reachCosts({lastSuccessAt:at+61000}),at+63000);assert.equal(mock.calls.length,2);
 }finally{db.close();}
});
test('Reach isolates dates, platforms and all mapped campaign IDs without summing overlapping audiences',async()=>{
 const {db,env}=setup(),mock=reachApi();env.META_ADS_FETCH=mock.fetch;
 const costs=reachCosts({campaigns:[{id:'123',utm:'launch'},{id:'456',utm:'launch'}]});
 try{
  await metaReachReport(env,filters({campaign:'launch',source:'instagram_ads'}),costs,at);
  assert.deepEqual(JSON.parse(mock.calls[0].url.searchParams.get('filtering')),[{field:'publisher_platform',operator:'IN',value:['instagram']},{field:'campaign.id',operator:'IN',value:['123','456']}]);
  await metaReachReport(env,filters({campaign:'launch',source:'facebook_ads'}),costs,at);
  await metaReachReport(env,filters(),costs,at);
  await metaReachReport(env,filters({from:range.to}),costs,at);assert.equal(mock.calls.length,4);
  for(const filter of [{device:'mobile'},{product:'game'},{source:'facebook'},{campaign:'unknown'}])assert.equal((await metaReachReport(env,filters(filter),costs,at)).total,null);
  assert.equal(mock.calls.length,4,'unsupported scopes never produce guessed zeroes or API calls');
  const empty=reachApi(null);env.META_ADS_FETCH=empty.fetch;
  const r=await metaReachReport(env,filters({source:'instagram_ads'}),costs,at);assert.equal(r.total,0);assert.equal(r.impressions,0);assert.equal(r.syncedAt,at);
 }finally{db.close();}
});
test('Reach failures keep the original timestamp and retry after ten minutes; invalid first reads stay unavailable',async()=>{
 const {db,env}=setup();env.META_ADS_FETCH=reachApi().fetch;
 try{
  await metaReachReport(env,filters(),reachCosts(),at);
  let failures=0;env.META_ADS_FETCH=async()=>{failures++;return Response.json({error:{code:190,message:'private test-token-never-in-url'}},{status:400});};
  const r=await metaReachReport(env,filters(),reachCosts(),at+hour);
  assert.equal(r.total,75);assert.equal(r.impressions,180);assert.equal(r.syncedAt,at);assert.equal(r.stale,true);assert.match(r.reason,/190/);
  assert.ok(!JSON.stringify(r).includes('test-token'));
  await metaReachReport(env,filters(),reachCosts(),at+hour+599999);assert.equal(failures,1);
  env.META_ADS_FETCH=reachApi('80','200').fetch;
  const recovered=await metaReachReport(env,filters(),reachCosts(),at+hour+600000);assert.equal(recovered.total,80);assert.equal(recovered.stale,false);
  env.META_ADS_FETCH=reachApi('not-a-number').fetch;
  const missing=await metaReachReport(env,filters({source:'facebook_ads'}),reachCosts(),at);assert.equal(missing.total,null);assert.equal(missing.syncedAt,null);
 }finally{db.close();}
});
test('simultaneous Reach reads share a database lock and cannot publish an incomplete snapshot',async()=>{
 const {db,env}=setup(),mock=reachApi();let release,ready;
 const barrier=new Promise(r=>release=r),started=new Promise(r=>ready=r);
 env.META_ADS_FETCH=async(...args)=>{ready();await barrier;return mock.fetch(...args);};
 try{
  const pending=metaReachReport(env,filters(),reachCosts(),at);await started;
  const concurrent=await metaReachReport(env,filters(),reachCosts(),at+1);assert.equal(concurrent.total,null);
  release();assert.equal((await pending).total,75);assert.equal(mock.calls.length,1);
  assert.equal((await first(db,'SELECT lock_until FROM meta_ads_reach')).lock_until,0);
 }finally{release?.();db.close();}
});

test('FB and IG full-period Reach remain independent from the deduplicated total and reuse the scope cache',async()=>{
 const {db,env}=setup(),calls=[];
 env.META_ADS_FETCH=async(url,init)=>{
  calls.push({url:new URL(url),init});
  const platform=JSON.parse(url.searchParams.get('filtering')||'[]').find(f=>f.field==='publisher_platform')?.value[0];
  const range=JSON.parse(url.searchParams.get('time_range'));
  return Response.json({data:[{account_id:metaAccount,date_start:range.since,date_stop:range.until,reach:platform==='facebook'?'200':platform==='instagram'?'180':'320',impressions:platform==='facebook'?'400':platform==='instagram'?'291':'691'}]});
 };
 try{
  const r=await metaReachBreakdownReport(env,filters(),reachCosts(),at);
  assert.deepEqual([r.total,r.facebook,r.instagram,r.impressions],[320,200,180,691]);
  assert.ok(r.facebook+r.instagram>r.total,'overlapping platform reach must never replace or alter the total');
  assert.equal(r.syncedAt,at);assert.equal(r.platformsSyncedAt,at);assert.equal(r.stale,false);assert.equal(calls.length,3);
  for(const {url}of calls){assert.equal(url.searchParams.get('level'),'account');assert.equal(url.searchParams.has('breakdowns'),false);assert.equal(url.searchParams.has('time_increment'),false);assert.deepEqual(JSON.parse(url.searchParams.get('time_range')),{since:range.from,until:range.to});}
  await metaReachBreakdownReport(env,filters(),reachCosts(),at+30000);assert.equal(calls.length,3);
  const fb=await metaReachBreakdownReport(env,filters({source:'facebook_ads'}),reachCosts(),at+30000);
  assert.deepEqual([fb.total,fb.facebook,fb.instagram,fb.impressions],[200,200,0,400]);assert.equal(calls.length,3,'a selected platform reuses the already cached full-period scope');
  const ig=await metaReachBreakdownReport(env,filters({source:'instagram_ads'}),reachCosts(),at+30000);
  assert.deepEqual([ig.total,ig.facebook,ig.instagram,ig.impressions],[180,0,180,291]);assert.equal(calls.length,3);
 }finally{db.close();}
});

test('failed platform Reach refresh retains its own value and timestamp without changing a fresh total',async()=>{
 const {db,env}=setup();env.META_ADS_FETCH=reachApi('80','180').fetch;
 try{
  await metaReachBreakdownReport(env,filters(),reachCosts(),at);
  const successful=reachApi('90','200').fetch;
  env.META_ADS_FETCH=async(url,init)=>JSON.parse(url.searchParams.get('filtering')||'[]').some(f=>f.field==='publisher_platform'&&f.value[0]==='instagram')?Response.json({error:{code:190,message:'private test-token-never-in-url'}},{status:400}):successful(url,init);
  const r=await metaReachBreakdownReport(env,filters(),reachCosts(),at+hour);
  assert.deepEqual([r.total,r.facebook,r.instagram,r.impressions],[90,90,80,200]);
  assert.equal(r.stale,true);assert.equal(r.syncedAt,at);assert.equal(r.platformsSyncedAt,at);assert.match(r.platformsReason,/IG:.*190/);
  assert.ok(!JSON.stringify(r).includes('test-token'));
  const invalid=await metaReachBreakdownReport(env,filters({product:'game'}),reachCosts(),at);
  assert.deepEqual([invalid.total,invalid.facebook,invalid.instagram],[null,null,null]);
 }finally{db.close();}
});
