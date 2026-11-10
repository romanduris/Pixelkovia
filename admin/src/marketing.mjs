import {HttpError} from './auth.mjs';
import {first,query,execute,hash} from './db.mjs';
import {dailyMarketing} from './marketing-series.mjs';
import {attemptFor} from './payment-monitor.mjs';
import {metaAdsReport} from './meta-ads.mjs';

import {sources,safeCampaign,marketingFilters,attemptsCTE,conditions} from './marketing-query.mjs';
export {sources,safeCampaign,marketingFilters} from './marketing-query.mjs';
const devices=['mobile','desktop','tablet','unknown'];
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const validId=value=>typeof value==='string'&&uuid.test(value);
const day=86400000;
// No raw URL, referrer, UA, IP, email, form value or arbitrary event properties.
export async function marketingEvent(request,env,input,at=Date.now()){
  if(input.mode!=='session'||!['visit','checkout'].includes(input.type)||!validId(input.visitId)||!validId(input.visitorId))throw new HttpError(400,'Neplatná analytická udalosť alebo režim návštevnej relácie.');
  const db=env.TQ_DB,scope='marketing:'+await hash((env.CUSTOMER_AUTH_SECRET||'local')+':'+(request.headers.get('CF-Connecting-IP')||'unknown'));
  const limit=await first(db,`INSERT INTO customer_login_attempts VALUES(?,1,?) ON CONFLICT(scope_key) DO UPDATE SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END RETURNING attempts`,scope,at,at-60000,at-60000);
  if(limit.attempts>60)throw new HttpError(429,'Príliš veľa udalostí.');
  const source=Object.hasOwn(sources,input.source)?input.source:'unknown',device=devices.includes(input.device)?input.device:'unknown';
  await db.batch([
    db.prepare(`INSERT INTO marketing_visits(id,visitor_id,source,campaign,device,started_at,checkout_at,last_at,browser_id) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET last_at=max(last_at,excluded.last_at),checkout_at=coalesce(checkout_at,excluded.checkout_at),browser_id=coalesce(browser_id,excluded.browser_id) WHERE visitor_id=excluded.visitor_id`).bind(input.visitId,await hash(input.visitorId),source,safeCampaign(input.campaign),device,at,input.type==='checkout'?at:null,at,validId(input.browserId)?await hash('browser:'+input.browserId):null),
    db.prepare('UPDATE marketing_state SET last_event_at=? WHERE id=1').bind(at)
  ]);
  return {recorded:true};
}
// Best effort only: attribution must never delay or fail the existing checkout.
export async function linkMarketingAttempt(env,input,at=Date.now()){
  if(!validId(input.marketingVisitId)||!validId(input.marketingVisitorId))return;
  const visit=await first(env.TQ_DB,'SELECT id FROM marketing_visits WHERE id=? AND visitor_id=? AND last_at>=?',input.marketingVisitId,await hash(input.marketingVisitorId),at-1800000);
  if(!visit)return;
  const attempt=await attemptFor(env,{attemptKey:input.attemptKey});
  if(attempt)await execute(env.TQ_DB,'INSERT OR IGNORE INTO marketing_attribution VALUES(?,?,?)',attempt.id,visit.id,at);
}
export async function marketingReport(env,params,at=Date.now()){
  const db=env.TQ_DB,f=marketingFilters(params,at),filter=conditions(f),vf=conditions({...f,product:''},'v');
  const state=await first(db,'SELECT * FROM marketing_state WHERE id=1');
  const collectionEnabled=env.MARKETING_COLLECTION_ENABLED==='true';
  const observedStart=Math.max(f.start,state.started_at);
  const cteValues=[at-600000,at-120000];
  const metric=await first(db,attemptsCTE+` SELECT count(*) purchases,coalesce(sum(total_cents),0) revenue,coalesce(sum(game_accesses),0) game_accesses,coalesce(sum(order_count),0) orders,coalesce(sum(refunded),0) refunds,coalesce(sum(CASE WHEN fulfillment_issue OR delivery_issues>0 THEN 1 ELSE 0 END),0) access_issues,coalesce(sum(delivery_issues+CASE WHEN fulfillment_issue=1 THEN (CASE WHEN gift_game=1 THEN 2 ELSE 1 END)-order_count ELSE 0 END),0) access_issue_orders,count(DISTINCT CASE WHEN visit_id IS NOT NULL THEN id END) attributed FROM a WHERE paid=1 AND paid_at>=? AND paid_at<?`+filter.sql,...cteValues,f.start,f.end,...filter.values);
  const issues=await first(db,attemptsCTE+` SELECT count(DISTINCT l.id) signals,count(DISTINCT l.attempt_id) attempts FROM payment_log l LEFT JOIN a ON a.id=l.attempt_id WHERE l.category='technical' AND l.type<>'delivery_failed' AND l.created_at>=? AND l.created_at<?`+filter.sql,...cteValues,f.start,f.end,...filter.values);
  const visits=await first(db,`SELECT count(*) visits,count(DISTINCT CASE WHEN checkout_at IS NOT NULL THEN visitor_id END) checkouts FROM marketing_visits v WHERE v.started_at>=? AND v.started_at<?`+vf.sql,observedStart,f.end,...vf.values);
  // Calendar-window counters do not require a recorded visitor attribution.
  const periodCommerce=await first(db,attemptsCTE+` SELECT count(DISTINCT CASE WHEN stripe_session_id IS NOT NULL AND created_at>=? AND created_at<? THEN id END) attempts,count(DISTINCT CASE WHEN free=1 AND paid_at>=? AND paid_at<? THEN id END) free_purchases FROM a WHERE 1=1`+filter.sql,...cteValues,f.start,f.end,f.start,f.end,...filter.values);
  const periodCheckout=await first(db,`SELECT count(DISTINCT visitor_id) checkouts FROM marketing_visits v WHERE v.checkout_at>=? AND v.checkout_at<?`+vf.sql,f.start,f.end,...vf.values);
  const cohorts=await query(db,attemptsCTE+` SELECT source,count(DISTINCT CASE WHEN stripe_session_id IS NOT NULL THEN id END) attempts,count(DISTINCT CASE WHEN paid=1 THEN id END) purchases FROM a WHERE visit_started_at>=? AND visit_started_at<?`+filter.sql+` GROUP BY source`,...cteValues,observedStart,f.end,...filter.values);
  const visitSources=await query(db,`SELECT source,count(*) visits,count(DISTINCT CASE WHEN checkout_at IS NOT NULL THEN visitor_id END) checkouts FROM marketing_visits v WHERE v.started_at>=? AND v.started_at<?`+vf.sql+` GROUP BY source`,observedStart,f.end,...vf.values);
  const calendarSources=await query(db,attemptsCTE+` SELECT source,count(*) purchases FROM a WHERE paid=1 AND paid_at>=? AND paid_at<?`+filter.sql+` GROUP BY source`,...cteValues,f.start,f.end,...filter.values);
  const campaigns=await query(db,'SELECT DISTINCT campaign FROM marketing_visits WHERE campaign<>? AND started_at>=? ORDER BY campaign LIMIT 200','',at-366*day);
  const addons=await first(db,attemptsCTE+` SELECT count(*) attempts,coalesce(sum(product='combination'),0) books,coalesce(sum(gift_game=1),0) gifts,coalesce(sum(EXISTS(SELECT 1 FROM json_each(a.selection) WHERE value='atlas-pixelkov')),0) atlas FROM a WHERE stripe_session_id IS NOT NULL AND created_at>=? AND created_at<?`+filter.sql,...cteValues,f.start,f.end,...filter.values);
  const checks=await query(db,'SELECT * FROM payment_monitor_checks');
  const history=await first(db,'SELECT min(created_at) started_at FROM checkout_attempts');
  const retention=await first(db,'SELECT min(created_at) earliest FROM payment_log');
  const warnings=[];
  if(!collectionEnabled)warnings.push('Zber návštev v prehliadači je vypnutý. Zachované návštevy a checkouty sú historické záznamy; nové pribúdať nebudú. Serverové platby a nákupy sa sledujú naďalej.');
  if(f.start<state.started_at)warnings.push('Návštevy, návštevný funnel a konverzia pokrývajú iba nameranú časť obdobia od začiatku zberu. Staršiu návštevnosť nepoznáme; Nákupy a tržby zahŕňajú celé zvolené obdobie.');
  warnings.push('Nové návštevné relácie zbierame iba po analytickom súhlase. Staršie záznamy vznikli pred zavedením panela. Relácie nie sú unikátni ľudia; celkovú návštevnosť ani podiel meraných návštev nepoznáme.');
  warnings.push('Počas dočasného vypnutia zberu sa návštevy nemerali; chýbajúce udalosti spätne nedopĺňame.');
  if(!state.last_event_at)warnings.push('Zatiaľ nebola prijatá žiadna analytická udalosť; zber návštev ešte nie je potvrdený.');
  else if(at-state.last_event_at>day)warnings.push('Viac než 24 hodín neprišla analytická udalosť. Môže ísť aj o nulovú návštevnosť, blokovanie merania alebo výpadok.');
  if(checks.length<2||checks.some(c=>!c.ok||at-c.checked_at>1800000))warnings.push('Serverové kontroly platobného zdroja chýbajú, zlyhali alebo sú staršie než 30 minút.');
  const collectionInRange=!!state.last_event_at&&f.end>state.started_at;
  const visitAvailable=collectionInRange&&!f.product;
  const conversionReason=!collectionEnabled?'Zber návštev v prehliadači je vypnutý; priebežnú konverziu nemožno spoľahlivo vypočítať.':!state.last_event_at?'Zber návštev zatiaľ nie je potvrdený.':f.product?'Produkt nie je známy pri každej návšteve pred checkoutom.':f.end<=state.started_at?'Zvolené obdobie je pred začiatkom merania.':!visits.visits?'Kohorta nemá žiadne namerané návštevy.':null;
  const cohortTotal=cohorts.reduce((s,r)=>({attempts:s.attempts+r.attempts,purchases:s.purchases+r.purchases}),{attempts:0,purchases:0});
  const periodMetrics={visits:visitAvailable?visits.visits:null,checkouts:collectionInRange&&!f.product?periodCheckout.checkouts:null,attempts:periodCommerce.attempts,purchases:metric.purchases,freePurchases:periodCommerce.free_purchases};
  const rows=Object.entries(sources).filter(([key])=>!f.source||f.source===key).map(([key,label])=>{
    const v=visitSources.find(r=>r.source===key),c=cohorts.find(r=>r.source===key),p=calendarSources.find(r=>r.source===key),n=visitAvailable?(v?.visits||0):null;
    return {source:key,label,visits:n,purchases:collectionInRange?(c?.purchases||0):null,periodPurchases:p?.purchases||0,conversion:!conversionReason&&n>0?(c?.purchases||0)/n:null};
  });
  const adsReport=await metaAdsReport(env,f,{enabled:collectionEnabled,startedAt:state.started_at,lastEventAt:state.last_event_at},at);
  return {generatedAt:at,collectionEnabled,periodMetrics,charts:await dailyMarketing(db,f,state,at),filters:f,startedAt:state.started_at,observedStart,partialPeriod:f.start<state.started_at,lastEventAt:state.last_event_at,paymentStartedAt:history?.started_at||null,checks,warnings,
    metrics:{visits:visitAvailable?visits.visits:null,checkouts:collectionInRange&&!f.product?visits.checkouts:null,purchases:metric.purchases,revenueCents:metric.revenue,orders:metric.orders,gameAccesses:metric.game_accesses,refunds:metric.refunds,accessIssues:metric.access_issues,accessIssueOrders:metric.access_issue_orders,attributedPurchases:metric.attributed,technicalSignals:issues.signals,technicalAttempts:issues.attempts,conversion:conversionReason?null:cohortTotal.purchases/visits.visits},
    cohort:{attempts:collectionInRange?cohortTotal.attempts:null,purchases:collectionInRange?cohortTotal.purchases:null},rows,campaigns:[...new Set([...campaigns.map(r=>r.campaign),...adsReport.ads.campaigns.map(c=>c.utm)])].sort(),conversionReason,
    ...adsReport,coverage:null,
    addons,addonReason:'Existujúci výber pri vytvorení Stripe relácie. Nie počet zobrazení, kliknutí, zmien výberu ani zaplatených doplnkov.',
    technicalComplete:f.start>=at-90*day,technicalStartedAt:retention?.earliest||null};
}

export async function pruneMarketing(env,at=Date.now()){
  // Bound pseudonymous analytics retention; never touch commerce records.
  await env.TQ_DB.batch([
    env.TQ_DB.prepare('DELETE FROM marketing_attribution WHERE visit_id IN(SELECT id FROM marketing_visits WHERE started_at<?)').bind(at-366*day),
    env.TQ_DB.prepare('DELETE FROM marketing_visits WHERE started_at<?').bind(at-366*day)
  ]);
}
