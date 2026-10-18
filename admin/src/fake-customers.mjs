// Explicitly synthetic fixture, generated locally before an independently approved DB import.
import {execute,first} from './db.mjs';
import {createOrder,saveChecklist,portalVisit,activate,gameEvent} from './game-service.mjs';
import {stages} from './game-rules.mjs';
import {checklist} from './checklist.mjs';
export const FAKE_BATCH='fake-tq-15-v1';
export async function fakeCustomerCount(db){
  return (await first(db,"SELECT COUNT(*) n FROM customers c WHERE EXISTS(SELECT 1 FROM audit_events a WHERE a.entity_id=c.id AND a.action='fake_customer_created')")).n;
}
export async function seedFakeCustomers(db,{local=false,at=Date.now()}={}){
  if(!local)throw Error('Generate the FAKE fixture locally; remote import is a separate explicit operation.');
  if((await first(db,'SELECT COUNT(*) n FROM customers')).n)throw Error('FAKE fixture generation requires an empty local database.');
  for(let index=0;index<15;index++){
    const number=String(index+1).padStart(2,'0'),key=FAKE_BATCH+'-'+number;
    const type=index<5?'purchased':index<10?'playing':'completed';
    const purchase=at-(16-index)*86400000;
    const started=at-(4+index%5)*3600000;
    await execute(db,'INSERT INTO customers VALUES(?,?,?,?)',key+'-customer',`fake.rodina${number}@example.invalid`,`FAKE · Rodina ${number}`,purchase);
    await execute(db,'INSERT INTO audit_events VALUES(?,?,?,?,?)',key+'-audit','explicit-user-request','fake_customer_created',key+'-customer',at);
    const order=await createOrder(db,{id:key+'-order',customerId:key+'-customer',productId:'episode-1',externalReference:key+'-FAKE-payment',at:purchase});
    const right=await first(db,'SELECT e.* FROM entitlements e JOIN order_items i ON i.id=e.order_item_id WHERE i.order_id=?',order.id);
    if(type==='purchased')continue;
    await portalVisit(db,key+'-customer',right.id,key+'-portal',started-3600000);
    await portalVisit(db,key+'-customer',right.id,key+'-portal',started-1200000);
    await saveChecklist(db,key+'-customer',right.id,Object.fromEntries(checklist.map(s=>[s.id,true])),started-600000);
    const session=await activate(db,key+'-customer',right.id,key+'-activation',{at:started});
    let run=await first(db,'SELECT * FROM game_runs WHERE id=?',session.runId),cursor=started;
    const lastStage=type==='playing'?2+(index-5):8;
    for(let stage=1;stage<=lastStage;stage++){
      cursor+=15000;
      const event=(type,offset,extra={})=>gameEvent(db,run,{eventId:`${key}-${stage}-${type}-${offset}`,type,stage,...extra},cursor+offset);
      await event('opened',0);
      for(const offset of [25000,50000,75000])await event('heartbeat',offset,{visible:true});
      if((stage+index)%3===0)await event('hint',80000);
      if((stage+index)%2===0)await event('answer',90000,{answer:'FAKE-nespravny-pokus'});
      if(type==='playing'&&stage===lastStage)break;
      const duration=(3+stage+index%5)*40000;
      await event('answer',duration,{answer:stages[stage-1].answers[0]});cursor+=duration;
      run=await first(db,'SELECT * FROM game_runs WHERE id=?',run.id);
    }
    if(type==='completed')await gameEvent(db,run,{eventId:key+'-completed',type:'complete'},cursor+30000);
  }
  return {customers:15,purchased:5,playing:5,completed:5,fake:true,batch:FAKE_BATCH};
}
