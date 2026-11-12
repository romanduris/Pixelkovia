import {query} from './db.mjs';
import {conditions} from './marketing-query.mjs';

// Ads-only segments; ordinary social visits and unattributed payments stay other.
const group=source=>source==='facebook_ads'?'facebook':source==='instagram_ads'?'instagram':'other';
function split(rows,key,total,reason='',partial=false){
 const result={total,facebook:total==null?null:0,instagram:total==null?null:0,other:total==null?null:0,reason,partial};
 if(total==null)return result;
 for(const row of rows)result[group(row.source)]+=row[key]||0;
 if(result.facebook+result.instagram+result.other!==total)return {total,facebook:null,instagram:null,other:null,partial:true,reason:'Rozdelenie zdrojov nie je pre tento rozsah úplné.'};
 return result;
}
export async function webFunnelBreakdown(db,{f,state,at,periodMetrics,uniqueMetrics,visitSources,calendarSources}){
 const filter=conditions({...f,product:''},'v');
 const checkout=await query(db,`WITH openings AS (
  SELECT visit_id,opened_at FROM marketing_checkout_opens
  UNION ALL SELECT id,checkout_at FROM marketing_visits v WHERE checkout_at IS NOT NULL
    AND NOT EXISTS(SELECT 1 FROM marketing_checkout_opens e WHERE e.visit_id=v.id AND e.opened_at=v.checkout_at)
 ), ranked AS (
  SELECT v.source,v.browser_id,row_number() OVER(PARTITION BY v.browser_id ORDER BY e.opened_at,v.id) browser_rank
  FROM openings e JOIN marketing_visits v ON v.id=e.visit_id
  WHERE e.opened_at>=? AND e.opened_at<?${filter.sql}
 ) SELECT source,count(*) checkouts,sum(browser_id IS NOT NULL AND browser_rank=1) unique_checkouts FROM ranked GROUP BY source`,f.start,f.end,...filter.values);
 const uniqueVisits=await query(db,`WITH ranked AS (
  SELECT v.source,v.browser_id,row_number() OVER(PARTITION BY v.browser_id ORDER BY v.started_at,v.id) browser_rank
  FROM marketing_visits v WHERE v.started_at>=? AND v.started_at<?${filter.sql}
 ) SELECT source,sum(browser_id IS NOT NULL AND browser_rank=1) visits FROM ranked GROUP BY source`,Math.max(f.start,state.started_at,state.unique_started_at??at+1),f.end,...filter.values);
 const visitReason='Namerané návštevy s analytickým súhlasom. FB/IG zahŕňajú iba označené reklamné zdroje; ostatné zdroje sa neodhadujú.';
 const checkoutReason='Otvorenia checkoutu v období, priradené pôvodnému zdroju návštevy. Bez analytického súhlasu sa nové otvorenia nemerajú.';
 const uniqueReason='Unikátny prehliadač patrí prvému zdroju daného kroku v zvolenom období a filtroch. Iba identifikovaná časť merania.';
 return {
  visits:split(visitSources,'visits',periodMetrics.visits,visitReason,f.start<state.started_at),
  checkouts:split(checkout,'checkouts',periodMetrics.checkouts,checkoutReason,f.start<state.started_at),
  purchases:split(calendarSources,'purchases',periodMetrics.purchases,'Serverom overené platené transakcie podľa úhrady. Bez návštevnej atribúcie sú v Ostatné / neznáme; darček sa počíta raz. Refundácie zostávajú vykázané samostatne.'),
  uniqueVisits:split(uniqueVisits,'visits',uniqueMetrics.visits,uniqueReason,uniqueMetrics.partial),
  uniqueCheckouts:split(checkout,'unique_checkouts',uniqueMetrics.checkouts,uniqueReason,uniqueMetrics.partial)
 };
}
