import {first,execute,statement,hash} from './db.mjs';

export const progressTypes=new Set(['form_loaded','fields_started','fields_complete','fields_validated','wallet_available','wallet_cancelled','validation_error','confirm_started']);
// Confirmation IDs represent individual calls to Stripe confirm, not grouped
// error signals. A replay cannot increment the count twice (including races).
export async function recordPaymentProgress(env,attempt,input,at){
  if(!attempt||!progressTypes.has(input.type))return;
  try{
    const method=['card','apple_pay','google_pay','wallet','free'].includes(input.method)?input.method:'unknown';
    const validId=typeof input.eventId==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(input.eventId);
    if(input.type==='confirm_started'||(input.type==='form_loaded'&&validId)){
      if(!validId)return;
      // D1 batch is transactional: changes() belongs to the immediately preceding
      // insert, including under concurrent duplicate delivery. Keep the aggregate
      // after raw IDs expire; failed inserts never increment it.
      const id=await hash(attempt.id+':'+input.eventId);
      await env.TQ_DB.batch(input.type==='form_loaded'?[
        statement(env.TQ_DB,'INSERT OR IGNORE INTO payment_form_loads VALUES(?,?,?)',id,attempt.id,at),
        statement(env.TQ_DB,`INSERT INTO payment_progress(attempt_id,form_loaded,load_count,last_at) SELECT ?,?,1,? WHERE changes()=1
          ON CONFLICT(attempt_id) DO UPDATE SET form_loaded=coalesce(payment_progress.form_loaded,excluded.form_loaded),load_count=payment_progress.load_count+1,last_at=max(payment_progress.last_at,excluded.last_at)`,attempt.id,at,at)
      ]:[
        statement(env.TQ_DB,'INSERT OR IGNORE INTO payment_confirmations VALUES(?,?,?,?)',id,attempt.id,method,at),
        statement(env.TQ_DB,`INSERT INTO payment_progress(attempt_id,confirm_started,confirmation_count,last_method,last_at)
          SELECT ?,?,1,?,? WHERE changes()=1
          ON CONFLICT(attempt_id) DO UPDATE SET confirm_started=coalesce(payment_progress.confirm_started,excluded.confirm_started),
          confirmation_count=payment_progress.confirmation_count+1,last_method=excluded.last_method,last_at=max(payment_progress.last_at,excluded.last_at)`,attempt.id,at,method,at)
      ]);
    }else{
      // Column is selected solely from the closed server-side allowlist above.
      const column=input.type;
      await execute(env.TQ_DB,`INSERT INTO payment_progress(attempt_id,${column},last_at) VALUES(?,?,?)
        ON CONFLICT(attempt_id) DO UPDATE SET ${column}=coalesce(payment_progress.${column},excluded.${column}),last_at=max(payment_progress.last_at,excluded.last_at)`,attempt.id,at,at);
    }
  }catch{console.error('payment_progress_write_failed');}
}

export async function progressMetadata(db){
  const meta=await first(db,'SELECT started_at FROM payment_progress_meta WHERE id=1');
  const audit=await first(db,'SELECT * FROM payment_audit_queue WHERE id=1');
  return {startedAt:meta?.started_at||null,audit};
}

export function summarizeProgress(attempts,meta,at){
  const keys=['session','loaded','started','complete','validated','confirmed','paid','free','refunded','access','email','validation','walletAvailable','walletCancelled','abandoned','pending','technical','declined','authentication'];
  const counts=Object.fromEntries(keys.map(key=>[key,0]));
  let cohort=0,legacy=0,confirmations=0,formLoads=0,withoutClientSignals=0,latestAt=null,payableCohort=0;
  const gaps={loaded:0,started:0,complete:0,paid:0};
  for(const a of attempts){
    if(!meta.startedAt||a.created_at<meta.startedAt){legacy++;continue;}
    cohort++;
    if(a.total_cents>0)payableCohort++;
    if(a.total_cents>0&&a.stripe_session_id&&!a.form_loaded)gaps.loaded++;
    if(a.form_loaded&&!a.fields_started)gaps.started++;
    if(a.fields_started&&!a.fields_complete)gaps.complete++;
    if(a.confirm_started&&!a.webhook_confirmed_at)gaps.paid++;
    if(a.stripe_session_id)counts.session++;
    for(const [key,column] of Object.entries({loaded:'form_loaded',started:'fields_started',complete:'fields_complete',validated:'fields_validated',confirmed:'confirm_started',validation:'validation_error',walletAvailable:'wallet_available',walletCancelled:'wallet_cancelled'}))if(a[column])counts[key]++;
    confirmations+=a.confirmation_count||0;
    formLoads+=a.load_count||0;
    if(!a.last_at)withoutClientSignals++;
    latestAt=Math.max(latestAt||0,a.last_at||0)||null;
    if(a.webhook_confirmed_at){
      counts[a.total_cents===0?'free':'paid']++;
      if(a.has_refund)counts.refunded++;
      const expected=a.gift_game?2:1;
      if(a.order_count>=expected)counts.access++;
      if(a.sent_count>=expected)counts.email++;
    }else{
      if(a.cancelled_at||a.observed_state==='expired')counts.abandoned++;
      else counts.pending++;
    }
    if(a.problem_kind==='technical')counts.technical++;
    if(a.problem_kind==='bank')counts.declined++;
    if(['authentication_required','payment_intent_authentication_failure'].includes(a.problem_code))counts.authentication++;
  }
  return {...meta,cohort,payableCohort,legacy,counts,gaps,confirmations,formLoads,withoutClientSignals,latestAt,generatedAt:at,
    paidRate:payableCohort?counts.paid/payableCohort:null};
}
