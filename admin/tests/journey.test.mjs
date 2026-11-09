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
    const data=await customers(db,params());assert.equal(data.total,18);assert.equal(new Set(data.rows.map(c=>c.customer_id)).size,18);assert.equal(data.stages.length,7);
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

test('stars count distinct paid extensions, exclude refunds, count both books and intersect filters',async()=>{
  const db=fresh(),at=Date.now()-60000;try{
    await execute(db,'INSERT INTO customers VALUES(?,?,?,?)','one','one@example.invalid','Jedna Rodina',at);
    await createOrder(db,{id:'base',customerId:'one',productId:'episode-1',externalReference:'base',at});
    await execute(db,"UPDATE products SET content_ready=1 WHERE id IN ('story-book-before','story-book-after')");
    await createOrder(db,{id:'addon1',customerId:'one',productId:'story-book-before',externalReference:'addon1',at:at+100});
    await createOrder(db,{id:'addon2',customerId:'one',productId:'story-book-before',externalReference:'addon2',at:at+200});
    await createOrder(db,{id:'refunded',customerId:'one',productId:'story-book-after',externalReference:'refunded',at:at+300});
    await execute(db,"UPDATE orders SET status='refunded' WHERE id='refunded'");
    let data=await customers(db,params());assert.equal(data.total,1);assert.equal(data.rows[0].extension_count,1);assert.equal(data.rows[0].has_base,true);
    assert.equal((await customers(db,params({version:'base'}))).total,0);
    assert.equal((await customers(db,params({version:'extensions',portal:'unopened'}))).total,1);
    assert.equal((await customers(db,params({product:'story-book-before'}))).rows[0].has_base,true);
    const right=await first(db,"SELECT id FROM entitlements WHERE product_id='episode-1'");
    await portalVisit(db,'one',right.id,'portal-visit',at+1000);
    assert.equal((await customers(db,params({version:'extensions',portal:'unopened'}))).total,0);
    assert.equal((await customers(db,params({version:'extensions',portal:'opened'}))).total,1);
    await createOrder(db,{id:'complete',customerId:'one',productId:'story-book-after',externalReference:'complete',at:at+2000});
    data=await customers(db,params({version:'full'}));assert.equal(data.total,1);assert.equal(data.rows[0].extension_count,2);
    await createOrder(db,{id:'another-base',customerId:'one',productId:'episode-1',externalReference:'another-base',at:at+3000});
    assert.equal((await customers(db,params())).total,1);
    assert.equal((await customers(db,new URLSearchParams())).total,1,'customer list has one row per customer');
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

test('journey keeps game totals across filters, separates feedback from completion and links exact purchase emails',async()=>{
 const db=fresh();try{
  await seedDemo(db,{local:true});
  const all=await customers(db,params()),finished=all.rows.find(c=>c.state==='completed');
  assert.equal(all.summary.total,all.rows.filter(c=>c.has_base).length);
  assert.equal(all.summary.playing,all.rows.filter(c=>c.state==='playing'&&c.has_base).length);
  assert.equal(all.summary.completed,6);
  assert.equal(all.summary.unstarted,all.rows.filter(c=>c.has_base&&c.started_at==null).length);
  assert.equal(finished.feedback_at,null,'completed video does not invent feedback');
  const at=Date.now();await execute(db,'INSERT INTO game_feedback VALUES(?,?,?,?,?)',finished.run_id,finished.customer_id,4,'Skvelé papierové šifry.',at);
  const selected=await customers(db,params({email:finished.email.toUpperCase(),state:'completed'}));
  assert.equal(selected.total,1);assert.equal(selected.rows[0].customer_id,finished.customer_id);assert.equal(selected.rows[0].feedback_at,at);assert.equal(selected.rows[0].feedback_stars,4);
  assert.deepEqual(selected.summary,all.summary,'tiles count the full list, not just the selected player');
  assert.equal((await customers(db,params({email:finished.email+'.other'}))).total,0,'payment links match an exact email');
  assert.equal((await customerDetail(db,finished.customer_id)).runs.find(r=>r.id===finished.run_id).feedback_comment,'Skvelé papierové šifry.');
 }finally{db.close();}
});

test('a payment link selects only its independent purchase, even with a reused buyer email',async()=>{
 const db=fresh(),at=Date.now();try{
  for(const id of ['first','repeat']){await execute(db,'INSERT INTO customers VALUES(?,?,?,?)',id,'same@example.invalid',id,at);await createOrder(db,{customerId:id,productId:'episode-1',externalReference:'session-'+id});}
  await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id) VALUES(?,?,?,?,?,?,?)','purchase-first','same@example.invalid','','["episode-1"]',1499,at,'session-first');
  assert.equal((await customers(db,params({email:'same@example.invalid'}))).total,2);
  const selected=await customers(db,params({email:'same@example.invalid',attempt:'purchase-first'}));assert.equal(selected.total,1);assert.equal(selected.rows[0].customer_id,'first');assert.equal(selected.summary.total,2);
  assert.equal((await customers(db,params({attempt:'unknown'}))).total,0);
 }finally{db.close();}
});
