import {HttpError} from './auth.mjs';
import {first,query,execute,hash} from './db.mjs';

// Only these fixed labels/codes are persisted. Never persist a provider message,
// request body, IP, email, card details, client secret or arbitrary browser text.
export const paymentTypes={
  session_created:['lifecycle','Platobný formulár vytvorený'],
  checkout_blocked:['lifecycle','Pokračovanie nákupu čaká na uzavretie pôvodného pokusu'],
  session_error:['technical','Nepodarilo sa pripraviť platbu'],
  status_error:['technical','Nepodarilo sa overiť stav platby'],
  release_error:['technical','Nepodarilo sa bezpečne uzavrieť pôvodnú platbu'],
  config_error:['technical','Prehliadač nenačítal platobnú službu'],
  sdk_error:['technical','Prehliadač nenačítal Stripe formulár'],
  element_error:['technical','Nepodarilo sa načítať údaje karty'],
  wallet_error:['technical','Nepodarilo sa načítať peňaženky'],
  validation_error:['validation','Zákazník opravuje neúplné údaje karty'],
  validation_connection_error:['technical','Prerušenie pri kontrole údajov karty'],
  confirm_started:['lifecycle','Zákazník potvrdil platbu'],
  confirm_error:['technical','Nejasný výsledok potvrdenia; vyžaduje overenie'],
  confirmation_timeout:['technical','Dlhé čakanie na potvrdenie platby'],
  wallet_wait_timeout:['technical','Peňaženka dlho nevracia výsledok'],
  confirmation_recovered:['lifecycle','Prerušený pokus bezpečne uzavretý pred obnovou'],
  payment_failed_client:['bank','Prehliadač hlási nepotvrdenú platbu'],
  payment_failed:['bank','Stripe potvrdil neúspešný pokus o platbu'],
  wallet_cancelled:['customer','Zákazník zatvoril peňaženku'],
  wallet_opened:['lifecycle','Zákazník otvoril natívnu peňaženku'],
  wallet_available:['lifecycle','Prehliadač ponúkol peňaženku'],
  paid:['lifecycle','Stripe potvrdil zaplatenie'],
  free:['lifecycle','Stripe potvrdil objednávku zdarma'],
  expired:['customer','Relácia vypršala bez zaplatenia'],
  refunded:['lifecycle','Platba bola vrátená'],
  webhook_error:['technical','Chyba spracovania podpísanej Stripe udalosti'],
  delivery_failed:['technical','Nepodarilo sa odoslať prístupový e-mail'],
  delivery_sent:['lifecycle','Prístupový e-mail odovzdaný poskytovateľovi']
};
const clientTypes=new Set(['config_error','sdk_error','element_error','wallet_error','validation_error','validation_connection_error','confirm_started','confirm_error','confirmation_timeout','wallet_wait_timeout','confirmation_recovered','payment_failed_client','wallet_cancelled','wallet_opened','wallet_available','status_error','session_error','release_error']);
const codes=new Set(['card_declined','insufficient_funds','expired_card','incorrect_cvc','incorrect_number','invalid_number','invalid_expiry_month','invalid_expiry_year','invalid_cvc','authentication_required','payment_intent_authentication_failure','processing_error','do_not_honor','generic_decline','fraudulent','lost_card','stolen_card','try_again_later','transaction_not_allowed','issuer_not_available','StripeConnectionError','StripeAPIError','StripeAuthenticationError','StripePermissionError','StripeRateLimitError','StripeInvalidRequestError','billing_phone_missing','billing_email_missing','return_url_conflict','sdk_integration_error','confirmation_error']);
const products=new Set(['episode-1','story-book-before','story-book-after']);
const methods=new Set(['card','apple_pay','google_pay','wallet','free','unknown']);
export const safePaymentCode=value=>codes.has(value)?value:'';
export const paymentFailureKey=intent=>intent?.last_payment_error?.charge||[intent?.id,safePaymentCode(intent?.last_payment_error?.code),safePaymentCode(intent?.last_payment_error?.decline_code)].join(':');
// Observability must never change whether a payment succeeds or is fulfilled.
export async function paymentLog(env,{type,source='server',attemptId=null,code='',method='unknown',productId='',dedupe='',at=Date.now()}){
  try{
    if(!Object.hasOwn(paymentTypes,type)||!['server','stripe','browser'].includes(source))return;
    code=safePaymentCode(code);method=methods.has(method)?method:'unknown';productId=products.has(productId)?productId:'';
    const id=await hash(JSON.stringify([source,type,attemptId,code,method,dedupe||Math.floor(at/300000)]));
    await execute(env.TQ_DB,'INSERT OR IGNORE INTO payment_log VALUES(?,?,?,?,?,?,?,?,?)',id,attemptId,source,type,paymentTypes[type][0],code,method,productId,at);
  }catch{console.error('payment_monitor_write_failed');}
}
export async function attemptFor(env,{attemptKey,sessionId}={}){
  if(typeof attemptKey==='string'&&/^[-a-zA-Z0-9_]{32,100}$/.test(attemptKey))return first(env.TQ_DB,'SELECT a.* FROM checkout_requests r JOIN checkout_attempts a ON a.id=r.attempt_id WHERE r.request_key=?',await hash(attemptKey));
  if(typeof sessionId==='string'&&/^cs_(?:test_|live_)[a-zA-Z0-9]{10,200}$/.test(sessionId))return first(env.TQ_DB,'SELECT * FROM checkout_attempts WHERE stripe_session_id=?',sessionId);
  return null;
}
export async function orderPaymentLog(env,orderId,type,dedupe){
  try{const attempt=await first(env.TQ_DB,'SELECT attempt_id FROM checkout_orders WHERE order_id=?',orderId);await paymentLog(env,{type,attemptId:attempt?.attempt_id,dedupe});}catch{console.error('payment_monitor_write_failed');}
}
export async function browserPaymentEvent(request,env,input){
  if(!clientTypes.has(input.type)||!products.has(input.productId))throw new HttpError(400,'Neplatná diagnostická udalosť.');
  const at=Date.now(),scope='payment-log:'+await hash((env.CUSTOMER_AUTH_SECRET||'local')+':'+(request.headers.get('CF-Connecting-IP')||'unknown'));
  const limit=await first(env.TQ_DB,`INSERT INTO customer_login_attempts VALUES(?,1,?) ON CONFLICT(scope_key) DO UPDATE SET attempts=CASE WHEN window_start<=? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<=? THEN excluded.window_start ELSE window_start END RETURNING attempts`,scope,at,at-60000,at-60000);
  if(limit.attempts>60)throw new HttpError(429,'Príliš veľa diagnostických udalostí.');
  // The attempt key links the observation; browser claims never mark a payment paid.
  const attempt=await attemptFor(env,{attemptKey:input.attemptKey});
  if(!attempt&&!['config_error','session_error'].includes(input.type))return {received:true};
  await paymentLog(env,{source:'browser',type:input.type,attemptId:attempt?.id,productId:input.productId,code:input.code,method:input.method,dedupe:attempt?undefined:scope+':'+Math.floor(at/300000),at});
  return {received:true};
}
export async function observePayment(env,attempt,state,intent){
  try{
    const at=Date.now(),paid=state==='paid'||state==='free';
    await execute(env.TQ_DB,`INSERT INTO payment_observations VALUES(?,?,?,?) ON CONFLICT(attempt_id) DO UPDATE SET state=excluded.state,checked_at=excluded.checked_at,paid_at=coalesce(payment_observations.paid_at,excluded.paid_at)`,attempt.id,state,at,paid?at:null);
    if(['paid','free','expired','refunded'].includes(state))await paymentLog(env,{type:state,source:'stripe',attemptId:attempt.id,dedupe:state});
    if(state==='failed')await paymentLog(env,{type:'payment_failed',source:'stripe',attemptId:attempt.id,code:intent?.last_payment_error?.decline_code||intent?.last_payment_error?.code,dedupe:paymentFailureKey(intent)});
  }catch{console.error('payment_monitor_observation_failed');}
}
export async function monitorCheck(env,id,ok){
  await execute(env.TQ_DB,'INSERT INTO payment_monitor_checks VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET ok=excluded.ok,checked_at=excluded.checked_at',id,ok?1:0,Date.now());
}
export async function prunePaymentLog(env){
  await execute(env.TQ_DB,'DELETE FROM payment_log WHERE created_at<?',Date.now()-90*86400000);
  await execute(env.TQ_DB,"DELETE FROM customer_login_attempts WHERE scope_key LIKE 'payment-log:%' AND window_start<?",Date.now()-86400000);
}
export async function paymentReport(env,params,ready){
  const days=Number(params.get('days')||1);if(![1,7,30].includes(days))throw new HttpError(400,'Neplatné obdobie.');
  const category=params.get('category')||'';if(category&&!['technical','bank','validation','customer','lifecycle'].includes(category))throw new HttpError(400,'Neplatný filter.');
  const at=Date.now(),since=at-days*86400000,db=env.TQ_DB;
  // One row per Stripe Session, including a gift. Never count gift orders as two payments.
  const attempts=await query(db,`SELECT a.id,a.stripe_session_id,a.total_cents,a.created_at,a.selection,p.state observed_state,p.checked_at,
    (SELECT count(*) FROM checkout_orders co WHERE co.attempt_id=a.id) order_count,
    (SELECT min(o.status='paid') FROM orders o WHERE o.external_reference=a.stripe_session_id OR o.id IN(SELECT co.order_id FROM checkout_orders co WHERE co.attempt_id=a.id)) orders_paid,
    (SELECT max(o.status='refunded') FROM orders o WHERE o.external_reference=a.stripe_session_id OR o.id IN(SELECT co.order_id FROM checkout_orders co WHERE co.attempt_id=a.id)) has_refund
    FROM checkout_attempts a LEFT JOIN payment_observations p ON p.attempt_id=a.id WHERE a.created_at>=? ORDER BY a.created_at DESC`,since);
  const counts={paid:0,free:0,refunded:0,failed:0,pending:0,ready:0,expired:0,unknown:0},rows=[];
  for(const a of attempts){
    const status=a.has_refund?'refunded':a.orders_paid===1?(a.total_cents===0?'free':'paid'):a.observed_state||'unknown';counts[status]++;
    if(rows.length<100)rows.push({id:a.id,sessionId:a.stripe_session_id,totalCents:a.total_cents,createdAt:a.created_at,checkedAt:a.checked_at,state:status,products:JSON.parse(a.selection)});
  }
  const recent=await query(db,'SELECT category,source,count(*) count,count(DISTINCT attempt_id) attempts FROM payment_log WHERE created_at>=? GROUP BY category,source',since);
  const technical=recent.filter(r=>r.category==='technical').reduce((n,r)=>n+r.count,0);
  const errors24=await first(db,"SELECT count(*) count FROM payment_log WHERE category='technical' AND created_at>=?",at-86400000);
  const declines24=await first(db,"SELECT count(DISTINCT attempt_id) count FROM payment_log WHERE category='bank' AND source='stripe' AND created_at>=?",at-86400000);
  const deliveries=await first(db,`SELECT sum(d.status='failed') failed,sum(d.status<>'sent' AND o.created_at<?) delayed FROM access_deliveries d JOIN orders o ON o.id=d.order_id WHERE o.status='paid'`,at-600000);
  const fulfillment=await first(db,`SELECT count(*) count FROM payment_observations p JOIN checkout_attempts a ON a.id=p.attempt_id WHERE p.state IN('paid','free') AND p.paid_at<? AND NOT EXISTS(SELECT 1 FROM orders o WHERE o.external_reference=a.stripe_session_id)`,at-120000);
  const checks=await query(db,'SELECT * FROM payment_monitor_checks');
  const lastSuccess=await first(db,`SELECT max(o.created_at) at FROM orders o JOIN checkout_attempts a ON a.stripe_session_id=o.external_reference WHERE o.status='paid' AND a.total_cents>0`);
  const logs=await query(db,`SELECT l.*,a.stripe_session_id FROM payment_log l LEFT JOIN checkout_attempts a ON a.id=l.attempt_id WHERE l.created_at>=? ${category?'AND l.category=?':''} ORDER BY l.created_at DESC,l.id LIMIT 200`,...category?[since,category]:[since]);
  const stale=checks.length<2||checks.some(c=>at-c.checked_at>1800000),badChecks=checks.some(c=>!c.ok);
  const needsAttention=!ready||badChecks||errors24.count>0||declines24.count>0||deliveries.failed>0||deliveries.delayed>0||fulfillment.count>0;
  return {generatedAt:at,days,category,enabled:ready,health:needsAttention?'attention':stale?'stale':'observing',counts,total:attempts.length,technical,errors24:errors24.count,declines24:declines24.count,recent,deliveries:{failed:deliveries.failed||0,delayed:deliveries.delayed||0},fulfillmentDelayed:fulfillment.count,lastSuccessAt:lastSuccess?.at||null,checks,rows,logs:logs.map(l=>({...l,label:paymentTypes[l.type]?.[1]||l.type})),retentionDays:90};
}
