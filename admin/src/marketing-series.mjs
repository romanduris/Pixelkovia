import {query,first} from './db.mjs';
import {sources,localDate,midnight,conditions} from './marketing-query.mjs';

// Explicit local-midnight boundaries handle both 23-hour and 25-hour days.
export function calendarDays(f){
 const result=[];let start=f.start;
 while(start<f.end){const date=localDate(start),next=midnight(localDate(midnight(date)+36*3600000));result.push({date,start,end:Math.min(next,f.end)});start=next;}
 return result;
}
export async function dailyMarketing(db,f,state,at){
 const days=calendarDays(f),filter=conditions({...f,product:''},'v');
 const rows=await query(db,`WITH days AS (
  SELECT json_extract(value,'$.date') date,json_extract(value,'$.start') start,json_extract(value,'$.end') end FROM json_each(?)
 ), visits AS (
  SELECT days.date,v.*,
   row_number() OVER(PARTITION BY days.date,v.browser_id ORDER BY v.started_at,v.id) browser_rank,
   row_number() OVER(PARTITION BY days.date,v.browser_id ORDER BY (v.checkout_at IS NULL),v.started_at,v.id) checkout_rank
  FROM days JOIN marketing_visits v ON v.started_at>=days.start AND v.started_at<days.end
  WHERE v.started_at>=?${filter.sql}
 ) SELECT date,source,count(*) visits,sum(checkout_at IS NOT NULL) checkouts,
  sum(browser_id IS NOT NULL) identified,
  sum(browser_id IS NOT NULL AND browser_rank=1) unique_visitors,
  sum(browser_id IS NOT NULL AND checkout_at IS NOT NULL AND checkout_rank=1) unique_checkouts
 FROM visits GROUP BY date,source ORDER BY date,source`,JSON.stringify(days),state.started_at,...filter.values);
 const uniqueStart=state.unique_started_at;
 const totals=await first(db,`SELECT count(DISTINCT browser_id) visitors,count(DISTINCT CASE WHEN checkout_at IS NOT NULL THEN browser_id END) checkouts FROM marketing_visits v WHERE v.started_at>=? AND v.started_at<?${filter.sql}`,Math.max(f.start,state.started_at,uniqueStart||at+1),f.end,...filter.values);
 const result=days.map(day=>{
  const measured=!!state.last_event_at&&day.end>state.started_at&&!f.product;
  const values=rows.filter(row=>row.date===day.date);
  const visits=values.reduce((sum,row)=>sum+row.visits,0),checkouts=values.reduce((sum,row)=>sum+row.checkouts,0),identified=values.reduce((sum,row)=>sum+row.identified,0);
  const uniqueMeasured=measured&&uniqueStart!=null&&day.end>uniqueStart&&(visits===0||identified>0);
  const uniqueVisitors=values.reduce((sum,row)=>sum+row.unique_visitors,0),uniqueCheckouts=values.reduce((sum,row)=>sum+row.unique_checkouts,0);
  return {date:day.date,visits:measured?visits:null,checkouts:measured?checkouts:null,uniqueVisitors:uniqueMeasured?uniqueVisitors:null,uniqueCheckouts:uniqueMeasured?uniqueCheckouts:null,
   checkoutRate:measured&&visits>0?checkouts/visits:null,uniqueCheckoutRate:uniqueMeasured&&uniqueVisitors>0?uniqueCheckouts/uniqueVisitors:null,
   partial:measured&&day.start<state.started_at,uniquePartial:uniqueMeasured&&(day.start<uniqueStart||identified<visits),unidentifiedVisits:measured?visits-identified:null,
   sources:Object.keys(sources).filter(source=>!f.source||source===f.source).map(source=>{const row=values.find(row=>row.source===source);return {source,visits:measured?(row?.visits||0):null,uniqueVisitors:uniqueMeasured?(row?.unique_visitors||0):null};})};
 });
 const uniqueAvailable=result.some(day=>day.uniqueVisitors!=null);
 return {days:result,uniqueStartedAt:uniqueStart,uniqueVisitors:uniqueAvailable?totals.visitors:null,uniqueCheckouts:uniqueAvailable?totals.checkouts:null,
  uniquePartial:result.some(day=>day.uniquePartial||day.uniqueVisitors==null),visitPartial:result.some(day=>day.partial||day.visits==null),
  methodology:'Dni a zdroje podľa začiatku návštevy v Bratislave. Pri unikátnych návštevníkoch patrí prehliadač za deň prvému zdroju spomedzi návštev zodpovedajúcich filtrom. Checkout je dosiahnutý v tejto návštevnej kohorte. Súčet denných unikátnych návštevníkov nie je počet unikátnych prehliadačov za celé obdobie.'};
}
