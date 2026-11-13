import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from './support.mjs';
import {recordStudioVisit,studioTrafficReport} from '../src/studio-traffic.mjs';
import {marketingFilters,localDate,midnight} from '../src/marketing-query.mjs';
import {marketingReport} from '../src/marketing.mjs';
import worker from '../src/worker.mjs';
import gateway,{countableVisit} from '../../rodulab/gateway.mjs';
const visit=()=>new Request('https://rodulab.com/api/studio/visit',{method:'POST',headers:{'X-RoduLab-Visit':'document'}});
const document=(path='/',options={})=>new Request('https://rodulab.com'+path,{headers:{Accept:'text/html','User-Agent':'Mozilla/5.0','Sec-Fetch-Dest':'document',...options.headers},...options});
test('studio counts only successful document visits and forwards no visitor information to the private counter',async()=>{
  const html=()=>new Response('<h1>Studio</h1>',{headers:{'Content-Type':'text/html'}}),forwarded=[];
  const env={ASSETS:{fetch:async()=>html()},BACKEND:{fetch:async request=>{forwarded.push(request);return new Response(null,{status:204});}}};
  const pending=[];
  const response=await gateway.fetch(document('/?utm_source=private',{headers:{Accept:'text/html','User-Agent':'Mozilla/5.0',Cookie:'private=session','CF-Connecting-IP':'192.0.2.1',Referer:'https://private.example/'}}),env,{waitUntil:p=>pending.push(p)});
  await Promise.all(pending);assert.equal(response.status,200);assert.equal(forwarded.length,1);
  assert.equal(forwarded[0].url,'https://rodulab.com/api/studio/visit');assert.equal(forwarded[0].method,'POST');assert.deepEqual([...forwarded[0].headers],[['x-rodulab-visit','document']]);assert.equal(await forwarded[0].text(),'');
  for(const req of [document('/',{method:'HEAD'}),document('/assets/mark.svg'),document('/',{headers:{Accept:'text/html','User-Agent':'Googlebot'}}),document('/',{headers:{Accept:'text/html',Purpose:'prefetch'}}),document('/',{headers:{Accept:'text/html','Sec-Purpose':'prefetch;prerender'}}),document('/',{headers:{Accept:'application/json'}})])assert.equal(!!countableVisit(req,html()),false);
  for(const host of ['pixelkovia.rodulab.com','livingstones.rodulab.com','btsflightscaner.rodulab.com','www.rodulab.com','rodulab.com.example']){
    const request=new Request('https://'+host+'/',document());
    assert.equal(!!countableVisit(request,html()),false,'only the exact studio hostname counts: '+host);
    await gateway.fetch(request,env,{waitUntil:p=>pending.push(p)});
  }
  for(const path of ['/projects','/Pixelkovia','/index.html','/assets/social.jpg'])assert.equal(!!countableVisit(document(path),html()),false,'only the studio homepage counts: '+path);
  await Promise.all(pending);assert.equal(forwarded.length,1,'subdomains cannot increment the studio counter');
  assert.equal(!!countableVisit(document(),new Response('',{status:503})),false);
  assert.equal((await gateway.fetch(document('/api/studio/visit',{method:'POST'}),env)).status,404);assert.equal(forwarded.length,1);
});
test('studio aggregate handles concurrent increments and Bratislava midnight without storing people, sources or events',async()=>{
  const db=fresh(),env={TQ_DB:db};
  try{
    const before=Date.parse('2026-11-10T22:59:59Z'),after=Date.parse('2026-11-10T23:00:00Z');
    await Promise.all(Array.from({length:20},()=>recordStudioVisit(visit(),env,before)));await recordStudioVisit(visit(),env,after);
    assert.deepEqual(db.sqlite.prepare('SELECT * FROM studio_traffic_daily ORDER BY day').all().map(row=>({...row})),[{day:'2026-11-10',visits:20},{day:'2026-11-11',visits:1}]);
    assert.deepEqual(db.sqlite.prepare('PRAGMA table_info(studio_traffic_daily)').all().map(column=>column.name),['day','visits']);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM marketing_visits').get().n,0);
    for(const request of [...['pixelkovia.rodulab.com','livingstones.rodulab.com','btsflightscaner.rodulab.com'].map(host=>new Request('https://'+host+'/api/studio/visit',{method:'POST',headers:{'X-RoduLab-Visit':'document'}})),new Request('https://rodulab.com/api/studio/visit',{method:'POST'})])await assert.rejects(()=>recordStudioVisit(request,env),e=>e.status===404);
  }finally{db.close();}
});
test('studio report distinguishes unknown history from measured zero and ignores Pixelkovia acquisition filters',async()=>{
  const db=fresh(),at=Date.parse('2026-11-13T12:00:00Z'),start=Date.parse('2026-11-11T10:00:00Z');
  try{
    await db.prepare('UPDATE studio_traffic_state SET started_at=?').bind(start).run();
    await recordStudioVisit(visit(),{TQ_DB:db},start);await recordStudioVisit(visit(),{TQ_DB:db},at);
    const filters=marketingFilters(new URLSearchParams({period:'7',source:'facebook_ads',product:'books',campaign:'only-pixelkovia'}),at);
    const report=await studioTrafficReport(db,filters,at);assert.equal(report.total,2);assert.equal(report.startedAt,start);
    assert.equal(report.days.find(day=>day.date==='2026-11-10').visits,null);assert.equal(report.days.find(day=>day.date==='2026-11-11').partial,true);assert.equal(report.days.find(day=>day.date==='2026-11-12').visits,0);assert.equal(report.days.at(-1).visits,1);
    const full=await marketingReport({TQ_DB:db,MARKETING_COLLECTION_ENABLED:'true'},new URLSearchParams({period:'7',source:'facebook_ads',product:'books'}),at);assert.deepEqual(full.studioTraffic,report);assert.equal(full.metrics.visits,null);
    for(const date of ['2026-03-29','2026-10-25']){const dayStart=midnight(date);await db.prepare('UPDATE studio_traffic_state SET started_at=?').bind(dayStart).run();const dayAt=dayStart+20*3600000,days=(await studioTrafficReport(db,marketingFilters(new URLSearchParams({period:'custom',from:date,to:date}),dayAt),dayAt)).days;assert.equal(days.length,1);assert.equal(days[0].date,localDate(dayStart));}
  }finally{db.close();}
});
test('studio report stays behind the administrator session and the public Pixelkovia host cannot increment it',async()=>{
  const db=fresh();try{
    const env={TQ_DB:db,ENVIRONMENT:'production',ADMIN_AUTH_MODE:'password'};
    assert.equal((await worker.fetch(new Request('https://pixelkovia.rodulab.com/api/admin/marketing'),env)).status,401);
    assert.equal((await worker.fetch(new Request('https://pixelkovia.rodulab.com/api/studio/visit',{method:'POST',headers:{'X-RoduLab-Visit':'document'}}),env)).status,404);
    assert.equal(db.sqlite.prepare('SELECT COUNT(*) n FROM studio_traffic_daily').get().n,0);
  }finally{db.close();}
});
