import {query} from './db.mjs';
import {conditions} from './marketing-query.mjs';

export const operatingSystems={ios:'iOS / iPadOS',android:'Android',windows:'Windows',macos:'macOS',chromeos:'ChromeOS',linux:'Linux',other:'Iný systém',unknown:'Neznámy / nezaznamenaný'};
const devices={mobile:'Mobil',tablet:'Tablet',desktop:'Počítač',unknown:'Neznáme zariadenie'};

export async function marketingAudience(db,f,state){
  const reason=f.product?'Pri filtri produktu nerozlišujeme návštevy, pretože produkt pred checkoutom nepoznáme.':f.end<=state.started_at?'Obdobie je pred začiatkom merania návštev.':!state.last_event_at?'Čakáme na prvú nameranú návštevu.':null;
  const filter=conditions(f,'v');
  const rows=reason?[]:await query(db,`SELECT device,coalesce(os,'unknown') system,count(*) visits FROM marketing_visits v
    WHERE v.started_at>=? AND v.started_at<?${filter.sql} GROUP BY device,coalesce(os,'unknown')`,Math.max(f.start,state.started_at),f.end,...filter.values);
  const total=reason?null:rows.reduce((sum,row)=>sum+row.visits,0);
  const group=(labels,key)=>Object.entries(labels).map(([id,label])=>{
    const visits=rows.filter(row=>(Object.hasOwn(labels,row[key])?row[key]:'unknown')===id).reduce((sum,row)=>sum+row.visits,0);
    return {id,label,visits:reason?null:visits,share:total>0?visits/total:null};
  });
  return {total,reason,osStartedAt:state.os_started_at,partial:f.start<state.started_at,
    devices:group(devices,'device'),systems:group(operatingSystems,'system')};
}
