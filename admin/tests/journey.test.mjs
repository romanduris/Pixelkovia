import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from './support.mjs';
import {execute,first} from '../src/db.mjs';
import {customers,customerDetail} from '../src/analytics.mjs';
import {seedDemo} from '../src/demo.mjs';
import {createOrder,portalVisit} from '../src/game-service.mjs';
const params=values=>new URLSearchParams({view:'journey',...values});

test('journey groups by customer, preserves actual progress, sorts active before completed, and filters portal visits',async()=>{
  const db=fresh();try{
    await seedDemo(db,{local:true});
    const data=await customers(db,params());assert.equal(data.total,18);assert.equal(new Set(data.rows.map(c=>c.customer_id)).size,18);assert.equal(data.stages.length,8);
    const priority=c=>['purchased','preparing','playing'].includes(c.state)?0:c.state==='completed'?2:1;
    assert.deepEqual(data.rows.map(priority),data.rows.map(priority).sort());
    const playing=data.rows.find(c=>c.state==='playing'&&c.current_stage===4);assert.ok(playing);assert.equal(playing.stages.filter(s=>s.completed_at!=null).length,3);assert.equal(playing.stages[3].wrong_attempts,1);
    const detail=await customerDetail(db,playing.customer_id);assert.equal(detail.runs.find(r=>r.id===playing.run_id).stages[0].attempts,playing.stages[0].attempts);
    const unopened=await customers(db,params({portal:'unopened'}));assert.equal(unopened.total,3);assert.ok(unopened.rows.every(c=>c.portal_opened_at===null));
    const opened=await customers(db,params({portal:'opened'}));assert.equal(opened.total,15);
    const active=await customers(db,params({state:'active'}));assert.equal(active.total,12);
    const completed=await customers(db,params({state:'completed'}));assert.equal(completed.total,6);assert.ok(completed.rows.every(c=>c.completed_at!=null));
    assert.equal((await customers(db,params({q:"' OR 1=1 --"}))).total,0);
    assert.equal((await customers(db,params({sort:'name; DROP TABLE customers'}))).total,18);
  }finally{db.close();}
});

test('stars count distinct paid extensions, exclude refunds, support complete bundles and intersect filters',async()=>{
  const db=fresh(),at=Date.now()-60000;try{
    await execute(db,'INSERT INTO customers VALUES(?,?,?,?)','one','one@example.invalid','Jedna Rodina',at);
    await createOrder(db,{id:'base',customerId:'one',productId:'episode-1',externalReference:'base',at});
    await execute(db,"UPDATE products SET content_ready=1 WHERE id IN ('piko-mission','listok-mission','complete')");
    await createOrder(db,{id:'addon1',customerId:'one',productId:'piko-mission',externalReference:'addon1',at:at+100});
    await createOrder(db,{id:'addon2',customerId:'one',productId:'piko-mission',externalReference:'addon2',at:at+200});
    await createOrder(db,{id:'refunded',customerId:'one',productId:'listok-mission',externalReference:'refunded',at:at+300});
    await execute(db,"UPDATE orders SET status='refunded' WHERE id='refunded'");
    let data=await customers(db,params());assert.equal(data.total,1);assert.equal(data.rows[0].extension_count,1);assert.equal(data.rows[0].has_base,true);
    assert.equal((await customers(db,params({version:'base'}))).total,0);
    assert.equal((await customers(db,params({version:'extensions',portal:'unopened'}))).total,1);
    assert.equal((await customers(db,params({product:'piko-mission'}))).rows[0].has_base,true);
    const right=await first(db,"SELECT id FROM entitlements WHERE product_id='episode-1'");
    await portalVisit(db,'one',right.id,'portal-visit',at+1000);
    assert.equal((await customers(db,params({version:'extensions',portal:'unopened'}))).total,0);
    assert.equal((await customers(db,params({version:'extensions',portal:'opened'}))).total,1);
    await createOrder(db,{id:'complete',customerId:'one',productId:'complete',externalReference:'complete',at:at+2000});
    data=await customers(db,params({version:'full'}));assert.equal(data.total,1);assert.equal(data.rows[0].extension_count,4);
    await createOrder(db,{id:'another-base',customerId:'one',productId:'episode-1',externalReference:'another-base',at:at+3000});
    assert.equal((await customers(db,params())).total,1);
    assert.equal((await customers(db,new URLSearchParams())).total,6,'legacy order-item API remains available');
    assert.equal((await customers(db,params({product:'unknown'}))).total,0);
  }finally{db.close();}
});

test('journey pagination clamps the page after filtering and uses global ordering',async()=>{
  const db=fresh(),at=Date.now();try{
    for(let n=0;n<23;n++){
      await execute(db,'INSERT INTO customers VALUES(?,?,?,?)','c'+n,`c${n}@example.invalid`,'Rodina '+n,at);
      await createOrder(db,{id:'o'+n,customerId:'c'+n,productId:'episode-1',externalReference:'o'+n,at:at+n});
    }
    const firstPage=await customers(db,params()),second=await customers(db,params({page:'2'}));assert.equal(firstPage.total,23);assert.equal(firstPage.rows.length,20);assert.equal(second.rows.length,3);
    assert.equal(new Set([...firstPage.rows,...second.rows].map(c=>c.customer_id)).size,23);
    assert.equal((await customers(db,params({page:'99',q:'c22@'}))).page,1);
  }finally{db.close();}
});
