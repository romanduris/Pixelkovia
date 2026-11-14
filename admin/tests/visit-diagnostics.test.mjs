import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from './support.mjs';
import {execute,first,query} from '../src/db.mjs';
import {marketingEvent,marketingReport,pruneMarketing} from '../src/marketing.mjs';
import {syncMetaAds,scheduledMetaAds,metaTrafficReport,metaAdsReport,metaAccount} from '../src/meta-ads.mjs';
import {marketingFilters,midnight} from '../src/marketing-query.mjs';
import worker from '../src/worker.mjs';
const at=Date.parse('2026-11-14T12:00:00Z'),origin='http://127.0.0.1';
const request=()=>new Request(origin+'/api/marketing/event',{method:'POST',headers:{origin,'content-type':'application/json'}});
const input=extra=>({type:'visit',mode:'session',visitId:crypto.randomUUID(),visitorId:crypto.randomUUID(),source:'facebook_ads',campaign:'launch',device:'mobile',browser:'chrome',os:'android',inApp:'facebook',diagnostic:{page:'/',pageId:crypto.randomUUID(),htmlLoaded:true,metaRequested:true,metaAttempted:true,ttfbMs:123,loadMs:6200},...extra});
async function setup(){const db=fresh();await execute(db,'UPDATE marketing_state SET started_at=?,diagnostics_started_at=?',at-86400000,at-3600000);return {db,env:{TQ_DB:db,ENVIRONMENT:'local',MARKETING_COLLECTION_ENABLED:'true',CUSTOMER_AUTH_SECRET:'a'.repeat(64)}};}

test('diagnostics deduplicate documents, protect ownership and cannot manufacture visits or marketing consent',async()=>{
 const {db,env}=await setup();try{
  const v=input();await marketingEvent(request(),env,v,at,{marketing:true});
  await marketingEvent(request(),env,v,at+1,{marketing:true});
  assert.equal((await first(db,'SELECT count(*) n FROM marketing_visits')).n,1);
  let row=await first(db,'SELECT * FROM marketing_diagnostics');assert.equal(row.internal_recorded,1);assert.equal(row.meta_attempted,1);assert.equal(row.ttfb_ms,100);
  assert.equal(row.visitor_id.length,64);assert.notEqual(row.visitor_id,v.visitorId);
  await marketingEvent(request(),env,{...v,mode:'diagnostic',visitorId:crypto.randomUUID(),diagnostic:{...v.diagnostic,internalFailed:true}},at+2,{marketing:true});
  assert.equal((await first(db,'SELECT internal_failed FROM marketing_diagnostics')).internal_failed,0);
  const failed=input({mode:'diagnostic'});await marketingEvent(request(),env,{...failed,diagnostic:{...failed.diagnostic,internalFailed:true}},at+3,{marketing:false});
  row=await first(db,'SELECT * FROM marketing_diagnostics WHERE id=?',failed.diagnostic.pageId);
  assert.equal(row.internal_failed,1);assert.equal(row.internal_recorded,0);assert.equal(row.meta_attempted,0);assert.equal(row.marketing_allowed,0);
  assert.equal((await first(db,'SELECT count(*) n FROM marketing_visits')).n,1);
  assert.ok(!JSON.stringify(row).includes('http'));
  await assert.rejects(marketingEvent(request(),env,{...v,diagnostic:{...v.diagnostic,page:'/checkout'}},at),e=>e.status===400);
  await assert.rejects(marketingEvent(request(),env,{...v,diagnostic:{page:'/',pageId:'not-a-uuid'}},at),e=>e.status===400);
  await assert.rejects(marketingEvent(request(),env,{...v,diagnostic:{page:'/',pageId:[v.diagnostic.pageId]}},at),e=>e.status===400);
 }finally{db.close();}
});

test('endpoint preserves independent consents, origin, size/rate limits and admin authentication',async()=>{
 const {db,env}=await setup();try{
  const send=(body,cookie='',extra={})=>worker.fetch(new Request(origin+'/api/marketing/event',{method:'POST',headers:{origin,'content-type':'application/json',cookie,...extra},body:JSON.stringify(body)}),env);
  const consent=async(analytics,marketing)=>{
   const r=await worker.fetch(new Request(origin+'/api/privacy/consent',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify({version:'2026-11-10',analytics,marketing})}),env);return r.headers.get('set-cookie').split(';')[0];
  };
  assert.equal((await send(input())).status,403);
  assert.equal((await send(input({mode:'diagnostic'}),await consent(false,true))).status,403);
  assert.equal((await send(input(),await consent(false,false))).status,403);
  const cookie=await consent(true,false);
  assert.equal((await send(input(),cookie)).status,200);
  assert.equal((await first(db,'SELECT meta_attempted FROM marketing_diagnostics')).meta_attempted,0);
  assert.equal((await send(input(),cookie,{origin:'https://attacker.invalid'})).status,403);
  assert.equal((await send({...input(),unused:'x'.repeat(20000)},cookie)).status,413);
  for(let n=0;n<59;n++)assert.equal((await send(input({mode:'diagnostic'}),cookie)).status,200);
  assert.equal((await send(input({mode:'diagnostic'}),cookie)).status,429);
  for(const path of ['/api/admin/marketing','/marketing-diagnostics.js']){
   const r=await worker.fetch(new Request('https://pixelkovia.rodulab.com'+path),{...env,ENVIRONMENT:'production',ADMIN_AUTH_MODE:'password'});
   assert.equal(r.status,path.startsWith('/api')?401:303);
  }
 }finally{db.close();}
});

test('environment and daily reports preserve historical unknowns, visit cohorts, day boundaries and retention',async()=>{
 const {db,env}=await setup();try{
  const v=input({source:'unknown',entrySource:'audience_network_ads'});
  await marketingEvent(request(),env,v,at,{marketing:true});
  await marketingEvent(request(),env,{...v,type:'checkout',diagnostic:undefined},at+1);
  await marketingEvent(request(),env,{...v,diagnostic:{...v.diagnostic,pageId:crypto.randomUUID(),internalFailed:true}},at+2,{marketing:true});
  const legacy=input({browser:undefined,inApp:undefined,os:undefined,diagnostic:undefined});await marketingEvent(request(),env,legacy,at-7200000);
  const id=crypto.randomUUID();await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id,gift_game) VALUES(?,?,?,?,?,?,?,1)',id,'excluded@example.invalid','Secret','["episode-1"]',2498,at,'cs_test_diagnostics');
  await execute(db,'INSERT INTO payment_observations VALUES(?,?,?,?)',id,'refunded',at,at);
  await execute(db,'INSERT INTO marketing_attribution VALUES(?,?,?)',id,v.visitId,at);
  const report=await marketingReport(env,new URLSearchParams({period:'today'}),at+1000);
  const a=report.diagnostics;
  assert.equal(a.groups.source.find(r=>r.value==='audience_network_ads').visits,1);
  assert.equal(a.groups.source.find(r=>r.value==='audience_network_ads').checkouts,1);
  assert.equal(a.groups.source.find(r=>r.value==='audience_network_ads').purchases,1,'one paid attempt including gift/refund');
  assert.equal(a.groups.browser.find(r=>r.value==='unknown').visits,1);
  assert.equal(a.totals.js_started,2);assert.equal(a.totals.meta_attempted,2);assert.equal(a.totals.internal_failed,1);assert.equal(a.totals.slow_loads,2);
  assert.equal(report.metrics.visits,2);assert.equal(report.metrics.purchases,1);assert.equal(report.metrics.revenueCents,2498);
  assert.equal(a.arrival,null);assert.equal(a.metaReceived,null);assert.ok(!JSON.stringify(a).includes('excluded@example'));
  const filtered=await marketingReport(env,new URLSearchParams({period:'today',source:'unknown'}),at+1000);assert.equal(filtered.diagnostics.totals.js_started,2);
  const product=await marketingReport(env,new URLSearchParams({period:'today',product:'game'}),at+1000);assert.equal(product.diagnostics.totals.js_started,null);assert.match(product.diagnostics.reason,/Produkt/);
  const old=await marketingReport(env,new URLSearchParams({period:'custom',from:'2026-11-13',to:'2026-11-13'}),at);assert.equal(old.diagnostics.days[0].js_started,null);
  const midnightAt=midnight('2026-11-15');await execute(db,'UPDATE marketing_state SET diagnostics_started_at=?',at-40*86400000);
  await marketingEvent(request(),env,input(),midnightAt-1,{marketing:true});await marketingEvent(request(),env,input(),midnightAt,{marketing:true});
  const daily=await marketingReport(env,new URLSearchParams({period:'custom',from:'2026-11-14',to:'2026-11-15'}),midnightAt+1000);assert.deepEqual(daily.diagnostics.days.map(d=>d.js_started),[3,1]);
  await pruneMarketing(env,at+31*86400000);assert.equal((await first(db,'SELECT count(*) n FROM marketing_diagnostics')).n,0);assert.equal((await first(db,'SELECT count(*) n FROM marketing_visits')).n,4);assert.equal((await first(db,'SELECT count(*) n FROM checkout_attempts')).n,1);
 }finally{db.close();}
});

test('Meta traffic reuses complete imports, distinguishes Audience Network and keeps costs unchanged',async()=>{
 const {db,env}=await setup();try{
  const range={from:'2026-11-13',to:'2026-11-14'},f=marketingFilters(new URLSearchParams({period:'custom',...range}),at);
  const rows=[['facebook','8','2','1.23'],['audience_network','31','0','0.33053'],['instagram','0','0','0.09']].map(([platform,clicks,lpv,spend])=>({account_id:metaAccount,account_currency:'EUR',campaign_id:'123',campaign_name:'Launch',date_start:'2026-11-14',date_stop:'2026-11-14',publisher_platform:platform,spend,impressions:'100',inline_link_clicks:clicks,...clicks!=='0'?{outbound_clicks:[{action_type:'outbound_click',value:clicks}],actions:[{action_type:'landing_page_view',value:lpv},{action_type:'omni_landing_page_view',value:lpv}]}:{}}));
  const calls=[];env.META_ADS_ACCESS_TOKEN='test-not-a-secret';env.META_ADS_FETCH=async url=>{calls.push(new URL(url));return Response.json(url.pathname.endsWith('/insights')?{data:rows}:{account_id:metaAccount,currency:'EUR',timezone_name:'Europe/Bratislava'});};
  const collection={enabled:true,startedAt:at-86400000,lastEventAt:at};
  let costs=await metaAdsReport(env,f,collection,at);assert.equal((await metaTrafficReport(env,f,costs,at)).total,null);
  await syncMetaAds(env,range,at);costs=await metaAdsReport(env,f,collection,at);
  const report=await metaTrafficReport(env,f,costs,at);
  assert.equal(calls.length,2,'no extra API calls for diagnostics');assert.match(calls[1].searchParams.get('fields'),/inline_link_clicks,outbound_clicks,actions/);
  assert.deepEqual(report.total,{impressions:300,link_clicks:39,outbound_clicks:39,landing_views:2,spendCents:165});assert.equal(report.total.spendCents,costs.costs);
  assert.equal(report.platforms.find(p=>p.platform==='audience_network').outbound_clicks,31);assert.equal(report.platforms.find(p=>p.platform==='instagram').landing_views,0);
  assert.equal(report.days[0].link_clicks,0,'verified empty day');
  const fb=await metaTrafficReport(env,{...f,source:'facebook_ads'},costs,at);assert.equal(fb.total.link_clicks,8);assert.equal(fb.platforms.length,1);
  const other=await metaTrafficReport(env,{...f,device:'mobile'},costs,at);assert.equal(other.total,null);
  await execute(db,"UPDATE meta_ads_traffic SET link_clicks=NULL WHERE platform='facebook'");assert.equal((await metaTrafficReport(env,f,costs,at)).total.link_clicks,null);
  assert.equal((await metaAdsReport(env,f,collection,at)).costs,165);
  await execute(db,'UPDATE meta_ads_state SET last_error=?','Meta API HTTP 400 · kód 190.');assert.equal((await metaTrafficReport(env,f,await metaAdsReport(env,f,collection,at),at)).stale,true);
  rows[0].actions=[null];rows[0].outbound_clicks=[{action_type:'outbound_click',value:'8'},{action_type:'outbound_click',value:'8'}];
  await syncMetaAds(env,range,at+60001);
  const malformed=await metaTrafficReport(env,f,await metaAdsReport(env,f,collection,at+60001),at+60001);
  assert.equal(malformed.total.landing_views,null);assert.equal(malformed.total.outbound_clicks,null);
  assert.equal(malformed.total.spendCents,165,'malformed actions cannot suppress or change valid costs');
 }finally{db.close();}
});

test('the existing cron bootstraps 30 days of traffic even when expenses and impressions were already imported',async()=>{
 const {db,env}=await setup();try{
  await execute(db,'UPDATE meta_ads_state SET last_success_at=?,last_attempt_at=?',at-7200000,at-7200000);
  await execute(db,'INSERT INTO meta_ads_impression_days VALUES(?,?)','2026-11-14',at-7200000);
  const ranges=[];env.META_ADS_ACCESS_TOKEN='isolated-qa-token';env.META_ADS_FETCH=async url=>{
   if(url.pathname.endsWith('/insights')){ranges.push(JSON.parse(url.searchParams.get('time_range')));return Response.json({data:[]});}
   return Response.json({account_id:metaAccount,currency:'EUR',timezone_name:'Europe/Bratislava'});
  };
  assert.equal((await scheduledMetaAds(env,at)).imported,true);
  assert.deepEqual(ranges[0],{since:'2026-10-16',until:'2026-11-14'});
  assert.equal((await first(db,'SELECT count(*) n FROM meta_ads_traffic_days')).n,30);
  assert.equal((await scheduledMetaAds(env,at+3600001)).imported,true);
  assert.deepEqual(ranges[1],{since:'2026-11-08',until:'2026-11-14'});
 }finally{db.close();}
});
