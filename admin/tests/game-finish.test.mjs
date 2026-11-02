import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fresh} from './support.mjs';
import {execute,first} from '../src/db.mjs';
import {createOrder,saveChecklist,activate,requireRun} from '../src/game-service.mjs';
import {syncRun,finishRun,feedback} from '../src/customer-portal.mjs';
import {checklist} from '../src/checklist.mjs';

test('the authenticated finale ends a run with missing tasks, preserves their records and accepts feedback',async()=>{
 const db=fresh();try{
  await execute(db,'INSERT INTO customers VALUES(?,?,?,?)','family','family@example.invalid','',Date.now());
  await createOrder(db,{customerId:'family',productId:'episode-1',externalReference:'finish-fixture'});
  const e=await first(db,'SELECT * FROM entitlements');
  await saveChecklist(db,'family',e.id,Object.fromEntries(checklist.map(s=>[s.id,true])));
  const session=await activate(db,'family',e.id,'finish-fixture-activation');
  const run=await requireRun(db,'family',session.runId,session.deviceToken);
  await syncRun(db,run,{progress:{stage:7,completed:[2,3,4,5,6,7]}});
  const result=await finishRun(db,await first(db,'SELECT * FROM game_runs WHERE id=?',run.id));
  assert.equal(result.completed,true);assert.equal(result.run.status,'completed');assert.equal(result.run.current_stage,8);
  assert.equal(result.run.stages.filter(s=>s.completed_at!==null).length,6);
  assert.equal(await first(db,'SELECT * FROM game_stage_progress WHERE run_id=? AND stage=1',run.id),null,'no invented completion for U1');
  const replayUntil=(await first(db,'SELECT replay_until FROM entitlements')).replay_until;
  const again=await finishRun(db,await first(db,'SELECT * FROM game_runs WHERE id=?',run.id));
  assert.equal(again.duplicate,true);assert.equal((await first(db,'SELECT replay_until FROM entitlements')).replay_until,replayUntil);
  await feedback(db,'family',{runId:run.id,stars:4,comment:'Hru sme dokončili aj po technickom probléme.'});
  assert.equal((await first(db,'SELECT stars FROM game_feedback WHERE run_id=?',run.id)).stars,4);
 }finally{db.close();}
});
