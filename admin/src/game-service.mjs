import {HttpError} from './auth.mjs';
import {first,query,execute,statement,uuid,hash,randomToken} from './db.mjs';
import {stages} from './game-rules.mjs';
import {checklist} from './checklist.mjs';
const DAY=86400000;
const clean=s=>String(s).trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').toUpperCase();
export async function entitlement(db,customerId,id,at=Date.now()){
  const row=await first(db,`SELECT e.*,p.content_ready,p.episode_id,o.status payment_status FROM entitlements e JOIN products p ON p.id=e.product_id JOIN order_items i ON i.id=e.order_item_id JOIN orders o ON o.id=i.order_id WHERE e.id=? AND e.customer_id=?`,id,customerId);
  if(!row || row.status!=='valid' || row.payment_status!=='paid' || !row.content_ready)throw new HttpError(403,'Zakúpené oprávnenie nie je dostupné.');
  if((row.expires_at!==null&&at>=row.expires_at)||(row.replay_until!==null&&at>=row.replay_until))throw new HttpError(410,'Prístup k hre vypršal.');
  return row;
}
export async function readChecklist(db,customerId,id){
  await entitlement(db,customerId,id);
  const rows=await query(db,'SELECT step_key,completed,updated_at FROM checklist_progress WHERE entitlement_id=?',id);
  return {steps:checklist.map(s=>({...s,completed:rows.some(r=>r.step_key===s.id&&r.completed===1),updatedAt:rows.find(r=>r.step_key===s.id)?.updated_at||null})),scope:'server'};
}
export async function saveChecklist(db,customerId,id,values,at=Date.now()){
  await entitlement(db,customerId,id,at);
  if(!values || typeof values!=='object'||Array.isArray(values)||Object.keys(values).some(key=>!checklist.some(s=>s.id===key)||typeof values[key]!=='boolean'))throw new HttpError(400,'Neplatné kroky checklistu.');
  const batch=Object.entries(values).map(([key,checked])=>statement(db,`INSERT INTO checklist_progress VALUES(?,?,?,?) ON CONFLICT(entitlement_id,step_key) DO UPDATE SET completed=excluded.completed,updated_at=CASE WHEN completed<>excluded.completed THEN excluded.updated_at ELSE updated_at END`,id,key,checked?1:0,at));
  if(batch.length)await db.batch(batch);
  return readChecklist(db,customerId,id);
}
export async function portalVisit(db,customerId,id,clientKey,at=Date.now()){
  const e=await entitlement(db,customerId,id,at);
  if(typeof clientKey!=='string'||!/^[-\w]{8,100}$/.test(clientKey))throw new HttpError(400,'Neplatný identifikátor návštevy.');
  const visit=uuid();
  const result=await db.batch([
    statement(db,`INSERT INTO portal_sessions SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM portal_sessions WHERE entitlement_id=? AND client_key=? AND last_at>?)`,visit,customerId,id,clientKey,at,at,e.activated_at===null?1:0,id,clientKey,at-30*60000),
    statement(db,`UPDATE portal_sessions SET last_at=MAX(last_at,?) WHERE id=(SELECT id FROM portal_sessions WHERE entitlement_id=? AND client_key=? ORDER BY last_at DESC LIMIT 1)`,at,id,clientKey)
  ]);
  const latest=await first(db,'SELECT id FROM portal_sessions WHERE entitlement_id=? AND client_key=? ORDER BY last_at DESC LIMIT 1',id,clientKey);
  return {id:latest.id,newVisit:result[0].meta.changes===1};
}
export async function activate(db,customerId,id,activationKey,{replay=false,at=Date.now(),unfinishedTtlHours=null}={}){
  const e=await entitlement(db,customerId,id,at);
  if(typeof activationKey!=='string'||!/^[-\w]{8,100}$/.test(activationKey))throw new HttpError(400,'Chýba jedinečný kľúč aktivácie.');
  // Never return a new device credential for a repeated activation key.
  if(await first(db,'SELECT id FROM game_runs WHERE activation_key=?',activationKey))throw new HttpError(409,'Táto aktivácia už bola spracovaná. Použite existujúcu bezpečnú reláciu.');
  if(await first(db,"SELECT id FROM game_runs WHERE entitlement_id=? AND status='active'",id))throw new HttpError(409,'Hra už má aktívnu reláciu. Prenos telefónu zatiaľ nie je pripojený.');
  if(e.first_completed_at!==null&&!replay)throw new HttpError(409,'Pre ďalšie hranie vedome zvoľte opakovanie.');
  if(replay&&e.first_completed_at===null)throw new HttpError(409,'Prvé hranie ešte nie je dokončené.');
  const done=await first(db,'SELECT COUNT(*) count FROM checklist_progress WHERE entitlement_id=? AND completed=1',id);
  if(done.count!==checklist.length)throw new HttpError(409,'Dokončite povinnú prípravu aj potvrdenie telefónu.');
  const count=await first(db,'SELECT COUNT(*) count FROM game_runs WHERE entitlement_id=?',id);
  const runId=uuid(),token=randomToken(),digest=await hash(token);
  const expiry=unfinishedTtlHours===null||e.first_completed_at!==null?e.expires_at:Math.min(e.expires_at??Infinity,at+unfinishedTtlHours*3600000);
  try{await db.batch([
    statement(db,`INSERT INTO game_runs(id,entitlement_id,run_number,activation_key,device_token_hash,status,current_stage,started_at,last_at) VALUES(?,?,?,?,?,'active',1,?,?)`,runId,id,count.count+1,activationKey,digest,at,at),
    statement(db,'UPDATE entitlements SET activated_at=COALESCE(activated_at,?),expires_at=? WHERE id=?',at,expiry,id)
  ]);}catch{throw new HttpError(409,'Súbežná aktivácia bola odmietnutá.');}
  return {runId,deviceToken:token,runNumber:count.count+1};
}
export async function requireRun(db,customerId,runId,token,at=Date.now()){
  const run=await first(db,'SELECT * FROM game_runs WHERE id=?',runId);
  if(!run)throw new HttpError(404,'Herná relácia neexistuje.');
  await entitlement(db,customerId,run.entitlement_id,at);
  if(!token||await hash(token)!==run.device_token_hash)throw new HttpError(403,'Táto herná relácia patrí inému telefónu.');
  return run;
}
export async function gameEvent(db,run,input,at=Date.now()){
  const {eventId,type,stage,answer,visible}=input;
  if(typeof eventId!=='string'||!/^[-\w]{8,100}$/.test(eventId)||!['opened','heartbeat','hint','answer','complete'].includes(type))throw new HttpError(400,'Neplatná herná udalosť.');
  const fingerprint=await hash(JSON.stringify({run:run.id,type,stage:stage??null,answer:answer??null,visible:visible??null}));
  const duplicate=await first(db,'SELECT * FROM game_events WHERE id=?',eventId);
  if(duplicate){if(duplicate.run_id!==run.id||duplicate.request_hash!==fingerprint)throw new HttpError(409,'Konflikt kľúča udalosti.');return {duplicate:true,accepted:duplicate.type==='solved',completed:duplicate.type==='completed'?true:undefined,hint:duplicate.type==='hint'?stages[duplicate.stage-1].hints[JSON.parse(duplicate.metadata).hintIndex]:undefined,run:await publicRun(db,run.id)};}
  if(run.status!=='active')throw new HttpError(409,'Táto relácia už nie je aktívna.');
  if(type==='complete'){
    const count=await first(db,'SELECT COUNT(*) count FROM game_stage_progress WHERE run_id=? AND completed_at IS NOT NULL',run.id);
    if(count.count!==stages.length)throw new HttpError(409,'Najskôr vyriešte všetkých sedem úloh.');
    const result=await db.batch([
      statement(db,"INSERT INTO game_events SELECT ?,id,NULL,'completed',?,?,'{}' FROM game_runs WHERE id=? AND status='active' AND current_stage=8",eventId,at,fingerprint,run.id),
      statement(db,"UPDATE game_runs SET status='completed',completed_at=?,last_at=? WHERE id=? AND EXISTS(SELECT 1 FROM game_events WHERE id=?)",at,at,run.id,eventId),
      statement(db,'UPDATE entitlements SET expires_at=CASE WHEN first_completed_at IS NULL THEN NULL ELSE expires_at END,first_completed_at=COALESCE(first_completed_at,?),replay_until=COALESCE(replay_until,?) WHERE id=? AND EXISTS(SELECT 1 FROM game_events WHERE id=?)',at,at+DAY,run.entitlement_id,eventId)
    ]);
    if(!result[0].meta.changes)throw new HttpError(409,'Relácia sa medzičasom zmenila.');
    return {completed:true,run:await publicRun(db,run.id)};
  }
  if(!Number.isInteger(stage)||stage<1||stage>stages.length||stage!==run.current_stage)throw new HttpError(409,'Udalosť nepatrí do aktuálnej úlohy.');
  const existing=await first(db,'SELECT * FROM game_stage_progress WHERE run_id=? AND stage=?',run.id,stage);
  if(type!=='opened'&&!existing)throw new HttpError(409,'Najskôr otvorte aktuálnu úlohu.');
  if(existing?.completed_at!==null&&existing?.completed_at!==undefined)throw new HttpError(409,'Úloha je už vyriešená.');
  if(type==='hint'&&existing.hints>=stages[stage-1].hints.length)throw new HttpError(409,'Ďalšia nápoveda už nie je dostupná.');
  if(type==='answer'&&(typeof answer!=='string'||answer.length>80))throw new HttpError(400,'Neplatná odpoveď.');
  const rule=stages[stage-1];
  const accepted=type==='answer'&&(stage===1?/^[0-9]{6}$/.test(answer)&&rule.answers.includes(answer):rule.digital?rule.answers.includes(answer):rule.answers.some(a=>clean(a)===clean(answer)));
  const kind=type==='answer'?(accepted?'solved':'wrong-answer'):type;
  const batch=[statement(db,`INSERT INTO game_events SELECT ?,id,?,?,?,?,? FROM game_runs WHERE id=? AND status='active' AND current_stage=? AND (?<>'hint' OR EXISTS(SELECT 1 FROM game_stage_progress WHERE run_id=? AND stage=? AND hints<?))`,eventId,stage,kind,at,fingerprint,JSON.stringify(type==='hint'?{hintIndex:existing.hints}:{}),run.id,stage,type,run.id,stage,rule.hints.length)];
  const guard='EXISTS(SELECT 1 FROM game_events WHERE id=?)';
  if(type==='opened')batch.push(statement(db,`INSERT INTO game_stage_progress(run_id,stage,first_opened_at,last_opened_at,last_heartbeat_at) SELECT ?,?,?,?,? WHERE ${guard} ON CONFLICT(run_id,stage) DO UPDATE SET last_opened_at=excluded.last_opened_at,last_heartbeat_at=excluded.last_heartbeat_at`,run.id,stage,at,at,at,eventId));
  if(type==='heartbeat'){
    batch.push(statement(db,`UPDATE game_stage_progress SET active_ms=active_ms+CASE WHEN ?=1 AND ?-COALESCE(last_heartbeat_at,?) BETWEEN 0 AND 90000 THEN MIN(30000,?-COALESCE(last_heartbeat_at,?)) ELSE 0 END,last_heartbeat_at=MAX(COALESCE(last_heartbeat_at,?),?) WHERE run_id=? AND stage=? AND ${guard}`,visible===true?1:0,at,at,at,at,at,at,run.id,stage,eventId));
  }
  if(type==='hint')batch.push(statement(db,`UPDATE game_stage_progress SET hints=hints+1 WHERE run_id=? AND stage=? AND ${guard}`,run.id,stage,eventId));
  if(type==='answer')batch.push(statement(db,`UPDATE game_stage_progress SET attempts=attempts+1,wrong_attempts=wrong_attempts+?,completed_at=? WHERE run_id=? AND stage=? AND ${guard}`,accepted?0:1,accepted?at:null,run.id,stage,eventId));
  batch.push(statement(db,`UPDATE game_runs SET last_at=?,current_stage=current_stage+? WHERE id=? AND ${guard}`,at,accepted?1:0,run.id,eventId));
  try{const result=await db.batch(batch);if(!result[0].meta.changes)throw new HttpError(409,'Úloha sa medzičasom zmenila.');}
  catch(error){const prior=await first(db,'SELECT request_hash FROM game_events WHERE id=?',eventId);if(prior?.request_hash===fingerprint)return {duplicate:true,accepted,run:await publicRun(db,run.id)};throw error;}
  return {accepted,hint:type==='hint'?rule.hints[existing.hints]:undefined,run:await publicRun(db,run.id)};
}
export async function publicRun(db,id){
  const run=await first(db,'SELECT id,entitlement_id,run_number,status,current_stage,started_at,last_at,completed_at FROM game_runs WHERE id=?',id);
  return {...run,stages:await query(db,'SELECT stage,first_opened_at,last_opened_at,completed_at,attempts,wrong_attempts,hints,active_ms FROM game_stage_progress WHERE run_id=? ORDER BY stage',id)};
}
// Called only by a future verified payment ingestion adapter (not a public checkout).
export async function createOrder(db,{id=uuid(),customerId,productId,externalReference,status='paid',at=Date.now()}){
  const old=externalReference?await first(db,'SELECT * FROM orders WHERE external_reference=?',externalReference):null;
  if(old){const item=await first(db,'SELECT product_id FROM order_items WHERE order_id=?',old.id);if(old.customer_id!==customerId||item?.product_id!==productId||old.status!==status)throw new HttpError(409,'Konflikt objednávky.');return old;}
  const product=await first(db,'SELECT * FROM products WHERE id=?',productId);if(!product)throw new HttpError(404,'Produkt neexistuje.');
  const item=uuid(),right=uuid();
  await db.batch([
    statement(db,'INSERT INTO orders VALUES(?,?,?,?,?,?,?,?)',id,customerId,externalReference??null,status,product.price_cents,product.currency,at,status==='paid'?at:null),
    statement(db,'INSERT INTO order_items VALUES(?,?,?,?,?)',item,id,productId,1,product.price_cents),
    ...(status==='paid'?[statement(db,'INSERT INTO entitlements(id,customer_id,order_item_id,product_id,granted_at) VALUES(?,?,?,?,?)',right,customerId,item,productId,at)]:[])
  ]);
  return first(db,'SELECT * FROM orders WHERE id=?',id);
}
