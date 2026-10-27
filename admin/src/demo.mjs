import {execute,first} from './db.mjs';
import {createOrder,saveChecklist,portalVisit,activate,gameEvent} from './game-service.mjs';
import {stages} from './game-rules.mjs';
import {checklist} from './checklist.mjs';
export async function seedDemo(db,{local=false,at=Date.now()}={}){
  if(!local)throw Error('Demo seed is strictly local-only.');
  if((await first(db,'SELECT COUNT(*) n FROM customers')).n)throw Error('Demo seed requires an empty local database.');
  const names=['Jana Ukážková','Peter Testovací','Lucia Demo','Martin Vzorový','Zuzana Ukážková','Tomáš Testovací','Eva Demo','Michal Vzorový','Katarína Ukážková','Marek Testovací','Andrea Demo','Filip Vzorový','Lenka Ukážková','Daniel Testovací','Simona Demo','Pavol Vzorový','Nina Ukážková','Adam Testovací'];
  for(let index=0;index<names.length;index++){
    const customerId='demo-customer-'+(index+1),type=index%6,purchase=[3,4].includes(type)?at-6*3600000-index*60000:at-(25-index)*86400000;
    await execute(db,'INSERT INTO customers VALUES(?,?,?,?)',customerId,`rodina${index+1}@example.invalid`,names[index],purchase);
    const order=await createOrder(db,{id:'demo-order-'+(index+1),customerId,productId:'episode-1',externalReference:'demo-payment-'+(index+1),at:purchase});
    const right=await first(db,'SELECT e.* FROM entitlements e JOIN order_items i ON i.id=e.order_item_id WHERE i.order_id=?',order.id);
    if(type===0)continue;
    await portalVisit(db,customerId,right.id,'demo-visit-'+index,purchase+60000);
    await portalVisit(db,customerId,right.id,'demo-visit-'+index,purchase+3600000);
    await saveChecklist(db,customerId,right.id,Object.fromEntries(checklist.slice(0,type===1?5:checklist.length).map(s=>[s.id,true])),purchase+120000);
    if(type===1)continue;
    const session=await activate(db,customerId,right.id,'demo-activation-'+index,{at:purchase+7200000});
    let run=await first(db,'SELECT * FROM game_runs WHERE id=?',session.runId),cursor=run.started_at;
    const max=type===2?4:stages.length;
    for(let stage=1;stage<=max;stage++){
      cursor+=45000;
      await gameEvent(db,run,{eventId:`demo-open-${index}-${stage}`,type:'opened',stage},cursor);
      await gameEvent(db,run,{eventId:`demo-heart-${index}-${stage}`,type:'heartbeat',stage,visible:true},cursor+25000);
      if(stage%3===1)await gameEvent(db,run,{eventId:`demo-hint-${index}-${stage}`,type:'hint',stage},cursor+30000);
      await gameEvent(db,run,{eventId:`demo-wrong-${index}-${stage}`,type:'answer',stage,answer:'zly-pokus'},cursor+40000);
      if(type===2&&stage===4)break;
      cursor+=(stage+index%3)*47000;
      await gameEvent(db,run,{eventId:`demo-solve-${index}-${stage}`,type:'answer',stage,answer:stages[stage-1].answers[0]},cursor);
      run=await first(db,'SELECT * FROM game_runs WHERE id=?',run.id);
    }
    if(type!==2){await gameEvent(db,run,{eventId:'demo-finish-'+index,type:'complete'},cursor+60000);}
    if(type===4){
      const replay=await activate(db,customerId,right.id,'demo-replay-'+index,{at:cursor+120000,replay:true});
      const replayRun=await first(db,'SELECT * FROM game_runs WHERE id=?',replay.runId);
      await gameEvent(db,replayRun,{eventId:'demo-replay-open-'+index,type:'opened',stage:1},cursor+150000);
    }
    if(type===5)await execute(db,'UPDATE entitlements SET expires_at=? WHERE id=?',at-86400000,right.id);
    await execute(db,'INSERT INTO email_preferences(customer_id,marketing_opt_in) VALUES(?,0)',customerId);
    await execute(db,"INSERT INTO email_events(id,customer_id,template_key,category,status,created_at) VALUES(?,?,'purchase-confirmation','transactional','draft',?)",'demo-email-'+index,customerId,purchase);
  }
  return {customers:18,demo:true};
}
