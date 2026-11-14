import {HttpError} from './auth.mjs';
import {query} from './db.mjs';
import {attemptsCTE,conditions,sources} from './marketing-query.mjs';
import {calendarDays} from './marketing-series.mjs';
import {operatingSystems} from './marketing-audience.mjs';

export const browsers={chrome:'Chrome',safari:'Safari',firefox:'Firefox',edge:'Edge',other:'Iný prehliadač',unknown:'Neznámy / nemeraný'};
export const inApps={facebook:'Facebook',instagram:'Instagram',other:'Iný interný prehliadač',unknown:'Neznámy / nerozpoznaný'};
const sourceLabels={...sources,audience_network_ads:'Audience Network reklama'};
const deviceLabels={mobile:'Mobil',tablet:'Tablet',desktop:'Desktop',unknown:'Neznáme zariadenie'};
const flags=['html_loaded','meta_requested','meta_attempted','meta_failed','meta_timeout','internal_failed','resource_failed','js_failed'];
const flagKeys=['htmlLoaded','metaRequested','metaAttempted','metaFailed','metaTimeout','internalFailed','resourceFailed','jsFailed'];
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
export const environment=value=>({browser:Object.hasOwn(browsers,value.browser)?value.browser:'unknown',inApp:Object.hasOwn(inApps,value.inApp)?value.inApp:'unknown'});
export const entrySource=(input,source)=>source==='unknown'&&input.entrySource==='audience_network_ads'?'audience_network_ads':source;
const timing=value=>Number.isInteger(value)&&value>=0&&value<=120000?Math.round(value/100)*100:null;

export function diagnosticStatement(db,input,{at,visitorHash,source,campaign,device,marketing,recorded=false}){
  const d=input.diagnostic;
  if(!d||d.page!=='/'||input.type!=='visit'||typeof d.pageId!=='string'||!uuid.test(d.pageId))throw new HttpError(400,'Neplatný diagnostický dokument.');
  // Marketing outcomes are accepted only while the server also verifies that
  // purpose. Old allowed outcomes may remain after a later revocation.
  const bits=flagKeys.map(key=>Number(d[key]===true&&(!key.startsWith('meta')||marketing===true)));
  return db.prepare(`INSERT INTO marketing_diagnostics
    (id,visit_id,visitor_id,source,entry_source,campaign,device,first_at,last_at,${flags.join(',')},internal_recorded,marketing_allowed,ttfb_ms,dom_ms,load_ms)
    VALUES(?,?,?,?,?,?,?,?,?,${flags.map(()=>'?').join(',')},CASE WHEN ? AND EXISTS(SELECT 1 FROM marketing_visits WHERE id=? AND visitor_id=?) THEN 1 ELSE 0 END,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET last_at=excluded.last_at,
      ${flags.map(key=>`${key}=max(${key},excluded.${key})`).join(',')},
      internal_recorded=max(internal_recorded,excluded.internal_recorded),marketing_allowed=excluded.marketing_allowed,
      ttfb_ms=coalesce(ttfb_ms,excluded.ttfb_ms),dom_ms=coalesce(dom_ms,excluded.dom_ms),load_ms=coalesce(load_ms,excluded.load_ms)
    WHERE visit_id=excluded.visit_id AND visitor_id=excluded.visitor_id AND first_at>=?`)
    .bind(d.pageId,input.visitId,visitorHash,source,entrySource(input,source),campaign,device,at,at,...bits,Number(recorded),input.visitId,visitorHash,Number(marketing===true),timing(d.ttfbMs),timing(d.domMs),timing(d.loadMs),at-1800000);
}

export async function visitDiagnostics(db,f,state,at){
  const reason=f.product?'Produkt pred checkoutom nepoznáme. Odstráňte filter produktu.':!state.last_event_at?'Čakáme na prvú internú návštevu.':f.end<=state.started_at?'Obdobie je pred začiatkom merania návštev.':null;
  const filter=conditions({...f,product:''},'v');
  const dimensions={source:sourceLabels,browser:browsers,os:operatingSystems,in_app:inApps,device:deviceLabels};
  const groups={};
  if(!reason){
    const rows=await query(db,attemptsCTE+`, cohort AS (
      SELECT coalesce(v.entry_source,v.source) source,coalesce(v.browser,'unknown') browser,coalesce(v.os,'unknown') os,
      coalesce(v.in_app,'unknown') in_app,v.device,v.checkout_at,coalesce(p.purchases,0) purchases
      FROM marketing_visits v LEFT JOIN (SELECT visit_id,count(*) purchases FROM a WHERE paid=1 AND paid_at<=? GROUP BY visit_id) p ON p.visit_id=v.id
      WHERE v.started_at>=? AND v.started_at<?${filter.sql}
    ) ${Object.keys(dimensions).map(key=>`SELECT '${key}' dimension,${key} value,count(*) visits,sum(checkout_at IS NOT NULL) checkouts,sum(purchases) purchases FROM cohort GROUP BY ${key}`).join(' UNION ALL ')}`,
      at-600000,at-120000,at,Math.max(f.start,state.started_at),f.end,...filter.values);
    for(const [key,labels]of Object.entries(dimensions))groups[key]=rows.filter(r=>r.dimension===key).map(r=>({...r,label:labels[r.value]||labels.unknown})).sort((a,b)=>b.visits-a.visits);
  }
  const startedAt=state.diagnostics_started_at,retainedFrom=Math.max(startedAt||at,at-30*86400000);
  const measured=!f.product&&startedAt!=null&&f.end>retainedFrom;
  const days=calendarDays(f),pageFilter=conditions({...f,product:''},'p');
  const counts=measured?await query(db,`WITH days AS (SELECT json_extract(value,'$.date') date,json_extract(value,'$.start') start,json_extract(value,'$.end') end FROM json_each(?))
    SELECT days.date,count(*) js_started,${[...flags,'internal_recorded'].map(key=>`sum(${key}) ${key}`).join(',')},
    sum(marketing_allowed=1) marketing_yes,sum(marketing_allowed=0) marketing_no,
    sum(meta_attempted=1 AND entry_source IN('facebook_ads','instagram_ads','audience_network_ads')) paid_meta_attempted,
    sum(entry_source IN('facebook_ads','instagram_ads','audience_network_ads')) paid_documents,
    sum(load_ms>=5000) slow_loads,count(load_ms) load_samples,round(avg(ttfb_ms)) ttfb_ms,round(avg(dom_ms)) dom_ms,round(avg(load_ms)) load_ms
    FROM days JOIN marketing_diagnostics p ON p.first_at>=days.start AND p.first_at<days.end
    WHERE p.first_at>=?${pageFilter.sql} GROUP BY days.date`,JSON.stringify(days),Math.max(f.start,retainedFrom),...pageFilter.values):[];
  const sumKeys=['js_started',...flags,'internal_recorded','marketing_yes','marketing_no','paid_meta_attempted','paid_documents','slow_loads','load_samples'];
  const daily=days.map(day=>{
    const available=measured&&day.end>retainedFrom,row=counts.find(r=>r.date===day.date);
    return {date:day.date,partial:available&&day.start<retainedFrom,...Object.fromEntries(sumKeys.map(k=>[k,available?(row?.[k]||0):null])),ttfb_ms:row?.ttfb_ms??null,dom_ms:row?.dom_ms??null,load_ms:row?.load_ms??null};
  });
  const totals=Object.fromEntries(sumKeys.map(k=>[k,measured?daily.reduce((s,r)=>s+(r[k]||0),0):null]));
  const warnings=[];
  if(totals.internal_failed)warnings.push(`${totals.internal_failed} dokumentov hlásilo neúspešný interný analytický request. Zachytené sú iba chyby, ktorých diagnostika sa neskôr doručila.`);
  if(totals.meta_failed)warnings.push(`${totals.meta_failed} dokumentov hlásilo chybu načítania Pixelu alebo volania PageView. Príčinou môže byť sieť, blokovanie alebo skript; samotný signál ich nerozlišuje.`);
  if(totals.meta_timeout)warnings.push(`${totals.meta_timeout} dokumentov čakalo na Pixel viac než 12 sekúnd. Nie je to dôkaz jeho zablokovania.`);
  if(totals.resource_failed||totals.js_failed)warnings.push(`Zachytené klientské chyby: zdroje ${totals.resource_failed||0}, JavaScript ${totals.js_failed||0}. Neukladáme URL ani text chyby.`);
  if(totals.slow_loads)warnings.push(`${totals.slow_loads} z ${totals.load_samples} dostupných načítaní trvalo aspoň 5 sekúnd. Ide len o dokumenty s analytickým súhlasom.`);
  if(totals.paid_documents>totals.paid_meta_attempted)warnings.push(`Známe platené vstupy: ${totals.paid_documents} dokumentov; PageView pokus: ${totals.paid_meta_attempted}. Rozdiel môže zahŕňať nesúhlas, čakanie aj chybu; nie je počtom stratených ľudí.`);
  return {startedAt,retainedFrom,partial:f.start<retainedFrom,reason,groups,totals,days:daily,warnings,arrival:null,metaReceived:null};
}
