import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from './support.mjs';
import {execute,first} from '../src/db.mjs';
import {createOrder,saveChecklist,readChecklist,activate} from '../src/game-service.mjs';
async function fixture(){
 const db=fresh(),at=Date.now();
 for(const id of ['first','second']){await execute(db,'INSERT INTO customers VALUES(?,?,?,?)',id,'same@example.invalid',id,at);await createOrder(db,{customerId:id,productId:'episode-1',externalReference:'prep-'+id});}
 const game=await first(db,"SELECT id FROM entitlements WHERE customer_id='first'");return {db,id:game.id};
}
test('individual hiding places persist, require all seven, and cannot substitute for the three launch confirmations',async()=>{
 const {db,id}=await fixture();
 try{
  for(let n=1;n<=3;n++)await saveChecklist(db,'first',id,{['placed-'+n]:true});
  let state=await readChecklist(db,'first',id);assert.equal(state.placements.filter(s=>s.completed).length,3);assert.equal(state.steps.find(s=>s.id==='placed').completed,false);
  await assert.rejects(()=>activate(db,'first',id,'prep-missing-three'),e=>e.status===409);
  for(let n=4;n<=7;n++)await saveChecklist(db,'first',id,{['placed-'+n]:true});
  state=await readChecklist(db,'first',id);assert.equal(state.steps.find(s=>s.id==='placed').completed,true);
  await assert.rejects(()=>activate(db,'first',id,'prep-still-no-print'),e=>e.status===409);
  await saveChecklist(db,'first',id,{printed:true,'device-understood':true});
  const active=await activate(db,'first',id,'prep-valid-all-seven');assert.ok(active.runId);
  await assert.rejects(()=>saveChecklist(db,'second',id,{'placed-1':false}),e=>e.status===403);
  await assert.rejects(()=>saveChecklist(db,'first',id,{'placed-8':true}),e=>e.status===400);
  await assert.rejects(()=>saveChecklist(db,'first',id,{'placed-1':'true'}),e=>e.status===400);
 }finally{db.close();}
});
test('one confirmation sets all seven; unchecking any item clears the aggregate; resetting all clears every item',async()=>{
 const {db,id}=await fixture();
 try{
  let state=await saveChecklist(db,'first',id,{placed:true});assert.equal(state.placements.filter(s=>s.completed).length,7);
  state=await saveChecklist(db,'first',id,{'placed-4':false});assert.equal(state.placements.filter(s=>s.completed).length,6);assert.equal(state.steps.find(s=>s.id==='placed').completed,false);
  state=await saveChecklist(db,'first',id,{'placed-4':true});assert.equal(state.steps.find(s=>s.id==='placed').completed,true);
  state=await saveChecklist(db,'first',id,{placed:false});assert.ok(state.placements.every(s=>!s.completed));
  const other=await first(db,"SELECT id FROM entitlements WHERE customer_id='second'");assert.ok((await readChecklist(db,'second',other.id)).placements.every(s=>!s.completed));
 }finally{db.close();}
});
test('a legacy single confirmation preserves the other six places when the first individual edit is made',async()=>{
 const {db,id}=await fixture();
 try{
  await execute(db,'INSERT INTO checklist_progress VALUES(?,?,?,?)',id,'placed',1,Date.now());
  assert.ok((await readChecklist(db,'first',id)).placements.every(s=>s.completed));
  const state=await saveChecklist(db,'first',id,{'placed-2':false});assert.equal(state.placements.filter(s=>s.completed).length,6);assert.equal(state.placements[1].completed,false);assert.equal(state.steps.find(s=>s.id==='placed').completed,false);
 }finally{db.close();}
});
