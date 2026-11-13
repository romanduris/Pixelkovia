import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fresh,LocalD1} from './support.mjs';
import {execute,first} from '../src/db.mjs';
import {marketingEvent,marketingReport} from '../src/marketing.mjs';
const at=Date.UTC(2026,10,13,12),day=86400000;
const req=()=>new Request('https://pixelkovia.rodulab.com/api/marketing/event',{method:'POST',headers:{'User-Agent':'DO_NOT_STORE_RAW_UA'}});
const visit=extra=>({mode:'session',type:'visit',visitId:crypto.randomUUID(),visitorId:crypto.randomUUID(),source:'facebook_ads',campaign:'alpha',device:'mobile',...extra});
test('OS migration preserves existing visits, identifiers and attribution fields without inferring history',async()=>{
 const db=new LocalD1();try{
  const dir=new URL('../migrations/',import.meta.url);
  for(const name of fs.readdirSync(dir).filter(name=>name.endsWith('.sql')&&name<'0024_').sort())db.sqlite.exec(fs.readFileSync(new URL(name,dir),'utf8'));
  await execute(db,'INSERT INTO marketing_visits VALUES(?,?,?,?,?,?,?,?,?)','legacy','hashed-visitor','facebook','alpha','mobile',at,null,at,'hashed-browser');
  const before=await first(db,'SELECT * FROM marketing_visits');
  db.sqlite.exec(fs.readFileSync(new URL('0024_marketing_systems.sql',dir),'utf8'));
  const {os,...after}=await first(db,'SELECT * FROM marketing_visits');assert.equal(os,null);assert.deepEqual(after,{...before});
  assert.ok((await first(db,'SELECT os_started_at FROM marketing_state')).os_started_at>0);
 }finally{db.close();}
});
test('audience aggregates visits with consistent denominators, unknown history, first-touch OS and report filters',async()=>{
 const db=fresh(),env={TQ_DB:db,MARKETING_COLLECTION_ENABLED:'true'};try{
  await execute(db,'UPDATE marketing_state SET started_at=?,os_started_at=?',at-30*day,at-120000);
  const legacy=visit({source:'direct',device:'desktop'}),iphone=visit({os:'ios'}),android=visit({os:'android',browserId:crypto.randomUUID()});
  for(const [index,input]of [legacy,iphone,android,visit({source:'instagram',campaign:'beta',device:'tablet',os:'ios'}),visit({source:'direct',device:'desktop',os:'windows'}),visit({source:'unknown',device:'private@example.invalid',os:'private@example.invalid',email:'DO_NOT_STORE'}),visit({os:'android',browserId:android.browserId})].entries())await marketingEvent(req(),env,input,at-20000+index*1000);
  await marketingEvent(req(),env,{...iphone,type:'checkout',os:'android',device:'desktop'},at-1000);
  await marketingEvent(req(),env,{...legacy,os:'windows'},at-500);
  assert.equal((await first(db,'SELECT os FROM marketing_visits WHERE id=?',legacy.visitId)).os,null,'revisiting a legacy session does not backfill its OS');
  assert.equal((await first(db,'SELECT os FROM marketing_visits WHERE id=?',iphone.visitId)).os,'ios');
  const report=await marketingReport(env,new URLSearchParams({period:'today'}),at),a=report.audience;
  assert.equal(a.total,7);assert.equal(a.total,report.metrics.visits);assert.equal(a.osStartedAt,at-120000);
  assert.deepEqual(a.devices.map(row=>[row.id,row.visits]),[['mobile',3],['tablet',1],['desktop',2],['unknown',1]]);
  assert.deepEqual(a.systems.filter(row=>row.visits).map(row=>[row.id,row.visits]),[['ios',2],['android',2],['windows',1],['unknown',2]]);
  for(const rows of [a.devices,a.systems]){assert.equal(rows.reduce((sum,row)=>sum+row.visits,0),a.total);assert.ok(Math.abs(rows.reduce((sum,row)=>sum+row.share,0)-1)<1e-12);}
  assert.ok(!JSON.stringify(db.sqlite.prepare('SELECT * FROM marketing_visits').all()).includes('DO_NOT_STORE'));assert.ok(!JSON.stringify(a).includes('@'));
  for(const [filters,total]of [[{source:'facebook_ads'},3],[{device:'tablet'},1],[{campaign:'alpha'},6],[{source:'influencer'},0]]){
   const filtered=await marketingReport(env,new URLSearchParams({period:'today',...filters}),at);assert.equal(filtered.audience.total,total);assert.equal(filtered.audience.total,filtered.metrics.visits);
  }
  const product=await marketingReport(env,new URLSearchParams({period:'today',product:'game'}),at);assert.equal(product.audience.total,null);assert.match(product.audience.reason,/produktu/);assert.ok(product.audience.devices.every(row=>row.visits===null&&row.share===null));
  const frozen=await marketingReport({...env,MARKETING_COLLECTION_ENABLED:'false'},new URLSearchParams({period:'today'}),at);assert.deepEqual(frozen.audience,a);
  const past=await marketingReport(env,new URLSearchParams({period:'custom',from:'2026-09-01',to:'2026-09-01'}),at);assert.equal(past.audience.total,null);
 }finally{db.close();}
});
test('audience distinguishes unavailable collection from measured zero and zero has no invented percentage',async()=>{
 const db=fresh(),env={TQ_DB:db,MARKETING_COLLECTION_ENABLED:'true'};try{
  await execute(db,'UPDATE marketing_state SET started_at=?',at-day);
  const empty=await marketingReport(env,new URLSearchParams({period:'today'}),at);assert.equal(empty.audience.total,null);assert.match(empty.audience.reason,/prvú/);
  await marketingEvent(req(),env,visit({os:'android'}),at-day+1000);
  const zero=await marketingReport(env,new URLSearchParams({period:'today'}),at);assert.equal(zero.audience.total,0);assert.equal(zero.audience.reason,null);assert.ok(zero.audience.devices.every(row=>row.visits===0&&row.share===null));
 }finally{db.close();}
});
