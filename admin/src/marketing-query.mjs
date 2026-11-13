// Shared calendar, attribution and paid-transaction definitions for report and drill-down.
import {HttpError} from './auth.mjs';
const day=86400000;
const devices=['mobile','desktop','tablet','unknown'];
export const sources={facebook_ads:'Facebook reklama',instagram_ads:'Instagram reklama',meta:'Meta (UTM)',facebook:'Facebook odkaz',instagram:'Instagram odkaz',influencer:'Influencer',direct:'Priame návštevy',organic:'Organic',unknown:'Ostatné / neznáme'};
export const safeCampaign=value=>typeof value==='string'&&/^[a-zA-Z0-9_. -]{1,80}$/.test(value)?value:'';
export function localDate(at){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).format(at);}
export function midnight(date){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw new HttpError(400,'Neplatný dátum.');
  const utc=Date.parse(date+'T00:00:00Z');let value=utc;
  for(let i=0;i<3;i++){
    const parts=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(value);
    const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));value=utc-(Date.UTC(+p.year,+p.month-1,+p.day,+p.hour,+p.minute,+p.second)-value);
  }
  return value;
}
export function marketingFilters(params,at=Date.now()){
  const period=params.get('period')||'14',today=localDate(at);let start,end,window;
  if(period==='campaign1'){
    window={label:'Kamp.1',start:Date.parse('2026-11-13T14:30:00+01:00'),end:Date.parse('2026-11-16T13:00:00+01:00')};
    start=window.start;end=Math.max(start,Math.min(window.end,at+1));
  }else if(period==='since'){
    start=midnight(params.get('from')||'');end=at+1;
    if(start>at||Date.parse(today)-Date.parse(params.get('from'))>365*day)throw new HttpError(400,'Vyberte minulý alebo dnešný dátum, najviac 366 dní dozadu.');
  }else if(period==='custom'){
    start=midnight(params.get('from')||'');const last=midnight(params.get('to')||'');end=midnight(localDate(last+36*3600000));
    if(last<start||end-start>366*day||start>at)throw new HttpError(400,'Rozsah musí byť minulý alebo aktuálny, najviac 366 dní.');
  }else{
    if(!['today','7','14','30','90'].includes(period))throw new HttpError(400,'Neplatné obdobie.');
    start=midnight(localDate(midnight(today)-(period==='today'?0:Number(period)-1)*day+12*3600000));end=at+1;
  }
  const source=params.get('source')||'',device=params.get('device')||'',product=params.get('product')||'',campaign=params.get('campaign')||'';
  if((source&&!Object.hasOwn(sources,source))||(device&&!devices.includes(device))||!['','game','books','combination'].includes(product)||(campaign&&safeCampaign(campaign)!==campaign))throw new HttpError(400,'Neplatný filter.');
  return {period,from:localDate(start),to:localDate(window?Math.max(start,end-1):Math.min(end-1,at)),start,end:window?end:Math.min(end,at+1),source,device,product,campaign,...window?{window}:{}};
}
// Each row is one Stripe Session / transaction, including a gift purchase.
// Orders, entitlements and access emails are aggregated separately, before joins.
export const attemptsCTE=`WITH linked AS (
 SELECT a.id attempt_id,o.id order_id FROM checkout_attempts a JOIN orders o ON o.external_reference=a.stripe_session_id
 UNION SELECT attempt_id,order_id FROM checkout_orders
), os AS (
 SELECT l.attempt_id,count(*) order_count,min(o.paid_at) order_paid_at,
 sum(o.status IN('paid','refunded')) settled_orders,
 sum(CASE WHEN o.status='paid' AND (d.order_id IS NULL OR d.status='failed' OR (d.status<>'sent' AND o.created_at<?)) THEN 1 ELSE 0 END) delivery_issues,
 sum((SELECT count(*) FROM entitlements e JOIN order_items i ON i.id=e.order_item_id WHERE i.order_id=o.id AND e.product_id='episode-1' AND e.status='valid')) game_accesses,
 sum(o.status='refunded') refund_orders
 FROM linked l JOIN orders o ON o.id=l.order_id LEFT JOIN access_deliveries d ON d.order_id=o.id GROUP BY l.attempt_id
), a AS (
 SELECT c.id,c.created_at,c.total_cents,c.selection,c.gift_game,c.stripe_session_id,
 coalesce(p.paid_at,CASE WHEN os.settled_orders>0 THEN os.order_paid_at END) paid_at,
 CASE WHEN c.total_cents>0 AND (p.paid_at IS NOT NULL AND p.state IN('paid','refunded') OR os.settled_orders>0) THEN 1 ELSE 0 END paid,
 CASE WHEN c.total_cents=0 AND (p.paid_at IS NOT NULL AND p.state='free' OR os.settled_orders>0) THEN 1 ELSE 0 END free,
 coalesce(os.order_count,0) order_count,coalesce(os.game_accesses,0) game_accesses,
 CASE WHEN p.state IN('paid','free') AND coalesce(os.order_count,0)<CASE WHEN c.gift_game=1 THEN 2 ELSE 1 END AND p.paid_at<? THEN 1 ELSE 0 END fulfillment_issue,
 coalesce(os.delivery_issues,0) delivery_issues,
 CASE WHEN p.state='refunded' OR os.refund_orders>0 THEN 1 ELSE 0 END refunded,
 coalesce(v.source,'unknown') source,coalesce(v.campaign,'') campaign,coalesce(v.device,'unknown') device,
 m.visit_id,v.visitor_id,v.browser_id,v.started_at visit_started_at,v.checkout_at,
 CASE WHEN EXISTS(SELECT 1 FROM json_each(c.selection) WHERE value='episode-1') THEN CASE WHEN EXISTS(SELECT 1 FROM json_each(c.selection) WHERE value IN('story-book-before','story-book-after')) THEN 'combination' ELSE 'game' END ELSE 'books' END product
 FROM checkout_attempts c LEFT JOIN payment_observations p ON p.attempt_id=c.id LEFT JOIN os ON os.attempt_id=c.id
 LEFT JOIN marketing_attribution m ON m.attempt_id=c.id LEFT JOIN marketing_visits v ON v.id=m.visit_id
)`;
export function conditions(f,alias='a'){
  const clauses=[],values=[];
  for(const key of ['source','device','campaign','product'])if(f[key]){clauses.push(`${['source','device'].includes(key)?`coalesce(${alias}.${key},'unknown')`:`${alias}.${key}`}=?`);values.push(f[key]);}
  return {sql:clauses.length?' AND '+clauses.join(' AND '):'',values};
}
