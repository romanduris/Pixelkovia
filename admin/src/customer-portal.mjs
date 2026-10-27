import {HttpError} from './auth.mjs';
import {query,first,statement,hash,uuid} from './db.mjs';
import {publicRun,requireRun,gameEvent} from './game-service.mjs';
import {customerLibrary} from './library-service.mjs';
export const runToken=request=>request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-tq-run=([a-f0-9]{64})(?:;|$)/)?.[1];
export async function paidProducts(db,customerId){return query(db,`SELECT DISTINCT e.product_id FROM entitlements e JOIN order_items i ON i.id=e.order_item_id JOIN orders o ON o.id=i.order_id WHERE e.customer_id=? AND e.status='valid' AND o.status='paid' AND (e.expires_at IS NULL OR e.expires_at>?)`,customerId,Date.now());}
export async function portal(request,env,identity){
  const db=env.TQ_DB;
  const rights=await query(db,`SELECT e.* FROM entitlements e JOIN order_items i ON i.id=e.order_item_id JOIN orders o ON o.id=i.order_id WHERE e.customer_id=? AND o.status='paid' AND e.status='valid'`,identity.customerId);
  const game=rights.find(e=>e.product_id==='episode-1');
  const run=game?await first(db,'SELECT * FROM game_runs WHERE entitlement_id=? ORDER BY run_number DESC LIMIT 1',game.id):null;
  const token=runToken(request),canResume=!!(run&&token&&await hash(token)===run.device_token_hash);
  const checklist=game?await query(db,'SELECT step_key,completed FROM checklist_progress WHERE entitlement_id=?',game.id):[];
  return {customer:{email:identity.email,name:identity.name},entitlement:game?{id:game.id,replayUntil:game.replay_until}:null,run:run?await publicRun(db,run.id):null,canResume,checklist,library:await customerLibrary(db,identity.customerId),feedback:run?await first(db,'SELECT stars,comment FROM game_feedback WHERE run_id=?',run.id):null};
}
// Telemetry mirrors the unchanged player's locally evaluated puzzles. It grants
// no purchase rights. Server timestamps and the authenticated device bind it to a run.
export async function syncRun(db,run,input){
  if(run.status!=='active')return publicRun(db,run.id);
  const p=input.progress;
  if(!p||!Number.isInteger(p.stage)||p.stage<0||p.stage>8||!Array.isArray(p.completed)||p.completed.length>7||p.completed.some(x=>!Number.isInteger(x)||x<1||x>7)||new Set(p.completed).size!==p.completed.length)throw new HttpError(400,'Neplatný herný postup.');
  const at=Date.now(),batch=[];
  const stages=new Set([...p.completed,...(p.stage>=1&&p.stage<=7?[p.stage]:[])]);
  for(const stage of stages){
    const metric=p.metrics?.[stage]||{};
    const bounded=v=>Number.isInteger(v)&&v>=0&&v<=10000?v:0;
    batch.push(statement(db,`INSERT INTO game_stage_progress(run_id,stage,first_opened_at,last_opened_at,completed_at,attempts,wrong_attempts,hints,last_heartbeat_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(run_id,stage) DO UPDATE SET last_opened_at=excluded.last_opened_at,completed_at=COALESCE(completed_at,excluded.completed_at),attempts=MAX(attempts,excluded.attempts),wrong_attempts=MAX(wrong_attempts,excluded.wrong_attempts),hints=MAX(hints,excluded.hints)`,run.id,stage,at,at,p.completed.includes(stage)?at:null,bounded(metric.attempts),bounded(metric.wrong),bounded(p.hints?.[stage]),at));
    if(p.stage===stage&&input.visible===true)batch.push(statement(db,`UPDATE game_stage_progress SET active_ms=active_ms+CASE WHEN ?-last_heartbeat_at BETWEEN 0 AND 90000 THEN MIN(30000,?-last_heartbeat_at) ELSE 0 END,last_heartbeat_at=? WHERE run_id=? AND stage=?`,at,at,at,run.id,stage));
  }
  let next=1;while(p.completed.includes(next)&&next<=7)next++;
  batch.push(statement(db,'UPDATE game_runs SET current_stage=MAX(current_stage,?),last_at=? WHERE id=?',next,at,run.id));
  await db.batch(batch);
  return publicRun(db,run.id);
}
export async function finishRun(db,run){return gameEvent(db,run,{type:'complete',eventId:'finish-'+run.id});}
export async function feedback(db,customerId,input){
  if(!Number.isInteger(input.stars)||input.stars<1||input.stars>5||typeof input.comment!=='string'||input.comment.length>2000)throw new HttpError(400,'Vyberte 1 až 5 hviezdičiek a najviac 2 000 znakov.');
  const run=await first(db,`SELECT r.id FROM game_runs r JOIN entitlements e ON e.id=r.entitlement_id WHERE r.id=? AND e.customer_id=? AND r.status='completed'`,input.runId,customerId);
  if(!run)throw new HttpError(403,'Hodnotenie patrí až k dokončenej hre.');
  await db.batch([statement(db,'INSERT INTO game_feedback VALUES(?,?,?,?,?) ON CONFLICT(run_id) DO UPDATE SET stars=excluded.stars,comment=excluded.comment',run.id,customerId,input.stars,input.comment.trim(),Date.now())]);
  return {saved:true};
}
