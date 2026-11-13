import {HttpError} from './auth.mjs';
import {execute,first,query} from './db.mjs';
import {localDate} from './marketing-query.mjs';
import {calendarDays} from './marketing-series.mjs';

// Called only by the studio's private service binding after a successful HTML
// document response. The gateway forwards no visitor headers or identifiers.
export async function recordStudioVisit(request,env,at=Date.now()){
  if(new URL(request.url).hostname!=='rodulab.com'||request.headers.get('X-RoduLab-Visit')!=='document')throw new HttpError(404,'Endpoint neexistuje.');
  await execute(env.TQ_DB,'INSERT INTO studio_traffic_daily(day,visits) VALUES(?,1) ON CONFLICT(day) DO UPDATE SET visits=visits+1',localDate(at));
}
export async function studioTrafficReport(db,filters,at=Date.now()){
  const state=await first(db,'SELECT started_at FROM studio_traffic_state WHERE id=1');
  if(filters.window)return {site:'rodulab',generatedAt:at,startedAt:state?.started_at??null,days:[],total:null,reason:'Návštevy rodulab.com sú uložené po celých dňoch. Pre presný časový rozsah Kamp.1 nie sú dostupné; vyberte bežné denné obdobie.'};
  const rows=await query(db,'SELECT day,visits FROM studio_traffic_daily WHERE day>=? AND day<=? ORDER BY day',filters.from,filters.to);
  const counts=new Map(rows.map(row=>[row.day,row.visits]));
  const days=calendarDays(filters).map(day=>{
    const measured=state!=null&&day.end>state.started_at,visits=measured?(counts.get(day.date)||0):null;
    return {date:day.date,visits,partial:measured&&day.start<state.started_at,sources:[{source:'studio',label:'rodulab.com',visits}]};
  });
  return {site:'rodulab',generatedAt:at,startedAt:state?.started_at??null,days,total:days.some(day=>day.visits!=null)?days.reduce((sum,day)=>sum+(day.visits||0),0):null};
}
