import {test} from 'node:test';import assert from 'node:assert/strict';
import {fresh} from './support.mjs';import {first,query} from '../src/db.mjs';
import {seedFakeCustomers,fakeCustomerCount} from '../src/fake-customers.mjs';
import {customers,dashboard,filters} from '../src/analytics.mjs';
import worker from '../src/worker.mjs';
test('explicit FAKE fixture has 15 labelled customers, five purchased/playing/completed and honest test-data context',async()=>{
 const db=fresh(),at=Date.now();
 try{
  assert.equal(await fakeCustomerCount(db),0);
  await assert.rejects(()=>seedFakeCustomers(db),/locally/);
  await seedFakeCustomers(db,{local:true,at});
  const people=await query(db,'SELECT * FROM customers');assert.equal(people.length,15);
  assert.ok(people.every(p=>p.name.startsWith('FAKE · ')&&p.email.endsWith('@example.invalid')));
  assert.equal(await fakeCustomerCount(db),15);
  const list=await customers(db,new URLSearchParams());
  for(const state of ['purchased','playing','completed'])assert.equal(list.rows.filter(c=>c.state===state).length,5,state);
  const running=list.rows.filter(c=>c.state==='playing').map(c=>c.current_stage).sort();assert.deepEqual(running,[2,3,4,5,6]);
  assert.equal((await first(db,'SELECT COUNT(*) n FROM game_runs')).n,10);
  assert.equal((await first(db,"SELECT COUNT(*) n FROM game_stage_progress sp JOIN game_runs r ON r.id=sp.run_id WHERE r.status='completed' AND sp.completed_at IS NOT NULL")).n,35);
  assert.equal((await first(db,'SELECT COUNT(*) n FROM game_events WHERE occurred_at>?',at)).n,0);
  assert.equal((await first(db,'SELECT COUNT(*) n FROM email_events')).n,0);
  const summary=await dashboard(db,filters(new URLSearchParams()));assert.equal(summary.metrics.customers,15);
  const response=await worker.fetch(new Request('http://127.0.0.1/api/admin/context'),{ENVIRONMENT:'local',TQ_DB:db});assert.equal(response.status,200);assert.equal((await response.json()).fakeCustomers,15);
  const count=await first(db,'SELECT COUNT(*) n FROM orders');
  await assert.rejects(()=>seedFakeCustomers(db,{local:true}),/empty/);assert.equal((await first(db,'SELECT COUNT(*) n FROM orders')).n,count.n);
  assert.deepEqual(await query(db,'PRAGMA foreign_key_check'),[]);
 }finally{db.close();}
});
