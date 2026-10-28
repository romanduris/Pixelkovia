import {test} from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {fresh} from './support.mjs';
import {first,execute} from '../src/db.mjs';
import {createCheckout,releaseCheckout,verifiedCheckoutStatus,checkoutConfig,paymentWebhook} from '../src/commerce.mjs';
import worker from '../src/worker.mjs';
const origin='https://pixelkovia.rodulab.com';
function fixture(){
 const db=fresh(),sessions=new Map(),requests=new Map(),sdk=new Stripe('sk_test_fixture');let sequence=0,lost=false,failRead=false;
 // D1 serializes atomic batches, including concurrent requests to one database.
 const batch=db.batch.bind(db);let queue=Promise.resolve();db.batch=statements=>{const result=queue.then(()=>batch(statements));queue=result.catch(()=>{});return result;};
 const env={TQ_DB:db,PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',CUSTOMER_AUTH_SECRET:'a'.repeat(64),STRIPE_SECRET_KEY:'rk_test_fixture',STRIPE_PUBLISHABLE_KEY:'pk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',RESEND_API_KEY:'re_fixture',STRIPE_CLIENT:{webhooks:sdk.webhooks,checkout:{sessions:{
  async create(input,{idempotencyKey}){
   if(!requests.has(idempotencyKey)){
    const id='cs_test_recoveryfixture'+(++sequence);
    requests.set(idempotencyKey,{id,client_secret:'fixture_secret',parameters:input});
    sessions.set(id,{...input,id,client_secret:'fixture_secret',amount_total:input.line_items.reduce((s,l)=>s+l.price_data.unit_amount,0),currency:'eur',livemode:false,status:'open',payment_status:'unpaid',payment_intent:null});
   }
   assert.deepEqual(input,requests.get(idempotencyKey).parameters,'every replay uses identical Stripe parameters');
   if(lost){lost=false;throw Error('Lost response after Stripe created the Session');}
   return requests.get(idempotencyKey);
  },
  async retrieve(id){if(failRead)throw Error('Stripe read timeout');return sessions.get(id);},
  async expire(id){const s=sessions.get(id);assert.equal(s.status,'open');s.status='expired';if(s.payment_intent)s.payment_intent.status='canceled';return s;}
 }}}};
 const input={baseId:'episode-1',books:[],atlasIncluded:true,email:'recovery@example.invalid',attemptKey:crypto.randomUUID(),uiMode:'elements'};
 const event=(type,id='evt_recovery')=>{const payload=JSON.stringify({id,type,data:{object:{id:[...sessions.keys()][0],payment_status:'paid'}}});return new Request(origin+'/api/stripe/webhook',{method:'POST',body:payload,headers:{'stripe-signature':sdk.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET})}});};
 return {db,env,input,sessions,requests,event,lose(){lost=true;},failRead(value){failRead=value;}};
}
test('lost create response and concurrent requests use one attempt and Stripe idempotency key',async()=>{
 const f=fixture();try{
  f.lose();await assert.rejects(()=>createCheckout(f.env,f.input),/Lost response/);
  const [a,b]=await Promise.all([createCheckout(f.env,f.input),createCheckout(f.env,f.input)]);
  assert.equal(a.sessionId,b.sessionId);assert.equal(f.sessions.size,1);assert.equal(f.requests.size,1);
  assert.equal((await first(f.db,'SELECT COUNT(*) n FROM checkout_attempts')).n,1);
  await assert.rejects(()=>createCheckout(f.env,{...f.input,books:['story-book-before']}),e=>e.status===409);
  await assert.rejects(()=>createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID(),newPurchase:true}),e=>e.status===409);
  assert.equal(f.sessions.size,1,'a new browser key cannot bypass an unresolved purchase');
 }finally{f.db.close();}
});
test('racing tabs with different keys cannot create two unresolved Stripe Sessions',async()=>{
 const f=fixture();try{
  const results=await Promise.allSettled([createCheckout(f.env,f.input),createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID()})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(results.find(r=>r.status==='rejected').reason.status,409);
  assert.equal(f.sessions.size,1);assert.equal((await first(f.db,'SELECT COUNT(*) n FROM checkout_attempts')).n,1);
 }finally{f.db.close();}
});
test('status separates verified payment from delayed webhook and email, and validates totals and refunds',async()=>{
 const f=fixture();try{
  const a=await createCheckout(f.env,f.input),s=f.sessions.get(a.sessionId);
  assert.equal((await verifiedCheckoutStatus(f.env,s.id)).state,'pending');
  s.payment_intent={id:'pi_fixture',status:'processing'};
  assert.equal((await verifiedCheckoutStatus(f.env,s.id)).retryAllowed,false);
  s.status='complete';s.payment_status='paid';s.payment_intent.status='succeeded';
  const value=await verifiedCheckoutStatus(f.env,s.id);
  assert.equal(value.paid,true);assert.equal(value.delivered,false);assert.equal(value.orderCount,1);
  assert.equal((await first(f.db,'SELECT COUNT(*) n FROM orders')).n,0,'status does not grant access ahead of a signed webhook');
  s.amount_total=1;await assert.rejects(()=>verifiedCheckoutStatus(f.env,s.id),e=>e.status===400);s.amount_total=1499;
  s.currency='usd';await assert.rejects(()=>verifiedCheckoutStatus(f.env,s.id),e=>e.status===400);s.currency='eur';
  s.payment_intent.latest_charge={refunded:true};assert.equal((await verifiedCheckoutStatus(f.env,s.id)).state,'refunded');
  assert.equal((await verifiedCheckoutStatus(f.env,s.id)).paid,false);
 }finally{f.db.close();}
});
test('unknown and processing cannot release the guard; edit expires original Session before a new one',async()=>{
 const f=fixture();try{
  const a=await createCheckout(f.env,f.input),s=f.sessions.get(a.sessionId);
  f.failRead(true);await assert.rejects(()=>releaseCheckout(f.env,f.input),/timeout/);
  await assert.rejects(()=>createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID()}),/timeout/);f.failRead(false);
  for(const status of ['processing','requires_action','succeeded']){
   s.payment_intent={id:'pi_fixture',status};
   await assert.rejects(()=>releaseCheckout(f.env,f.input),e=>e.status===409);
   await assert.rejects(()=>createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID(),newPurchase:true}),e=>e.status===409);
  }
  s.payment_intent={id:'pi_fixture',status:'requires_payment_method',last_payment_error:{code:'card_declined'}};
  assert.equal((await verifiedCheckoutStatus(f.env,s.id)).state,'failed');
  assert.equal((await verifiedCheckoutStatus(f.env,s.id)).retryAllowed,true);
  assert.equal((await createCheckout(f.env,f.input)).sessionId,s.id,'a decline can retry the same Session');
  await releaseCheckout(f.env,f.input);assert.equal(s.status,'expired');
  const b=await createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID()});assert.notEqual(b.sessionId,s.id);
  await assert.rejects(()=>createCheckout(f.env,f.input),e=>e.status===409,'stale tabs cannot reopen a released attempt');
 }finally{f.db.close();}
});
test('paid repeat purchases require an explicit new-purchase action and remain independent',async()=>{
 const f=fixture();try{
  const a=await createCheckout(f.env,f.input),s=f.sessions.get(a.sessionId);s.status='complete';s.payment_status='paid';
  await assert.rejects(()=>createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID()}),e=>e.status===409);
  const b=await createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID(),newPurchase:true});assert.notEqual(b.sessionId,s.id);
  assert.equal(f.sessions.size,2);await assert.rejects(()=>createCheckout(f.env,f.input),e=>e.status===409,'the old tab remains closed after an explicit next purchase');
 }finally{f.db.close();}
});
test('webhook acknowledges before delayed mail; duplicates/out-of-order success create one delivery',async()=>{
 const f=fixture(),original=globalThis.fetch;let deliver;
 try{
  const a=await createCheckout(f.env,f.input),s=f.sessions.get(a.sessionId);s.status='complete';s.payment_status='paid';s.payment_intent='pi_recovery';
  globalThis.fetch=()=>new Promise(resolve=>{deliver=()=>resolve(Response.json({id:'mail_fixture'}));});
  const pending=[],context={waitUntil(promise){pending.push(promise);}};
  assert.deepEqual(await paymentWebhook(f.event('checkout.session.completed'),f.env,context),{received:true});
  assert.equal((await verifiedCheckoutStatus(f.env,s.id)).paid,true);assert.equal((await verifiedCheckoutStatus(f.env,s.id)).delivered,false);
  await paymentWebhook(f.event('checkout.session.completed'),f.env,context);
  await paymentWebhook(f.event('checkout.session.async_payment_succeeded','evt_reordered'),f.env,context);
  assert.equal((await first(f.db,'SELECT COUNT(*) n FROM orders')).n,1);
  assert.equal((await first(f.db,'SELECT COUNT(*) n FROM access_deliveries')).n,1);
  while(!deliver)await new Promise(resolve=>setTimeout(resolve,1));deliver();await Promise.all(pending);
  assert.equal((await verifiedCheckoutStatus(f.env,s.id)).delivered,true);
  assert.equal((await first(f.db,'SELECT attempts FROM access_deliveries')).attempts,1);
 }finally{globalThis.fetch=original;f.db.close();}
});
test('production config keeps wallets disabled; recovery routes enforce origin and verify Stripe state',async()=>{
 const f=fixture();try{
  assert.deepEqual(checkoutConfig(f.env).wallets,{applePay:false,googlePay:false});
  const a=await createCheckout(f.env,f.input);
  const status=await worker.fetch(new Request(origin+'/api/checkout/status?session_id='+a.sessionId),f.env);assert.equal(status.status,200);assert.equal((await status.json()).state,'pending');
  const foreign=await worker.fetch(new Request(origin+'/api/checkout/release',{method:'POST',headers:{origin:'https://foreign.invalid','content-type':'application/json'},body:JSON.stringify(f.input)}),f.env);assert.equal(foreign.status,403);
  await assert.rejects(()=>releaseCheckout(f.env,{attemptKey:'forged'}),e=>e.status===400);
 }finally{f.db.close();}
});

test('pre-migration open Sessions block a new purchase until verified expiration',async()=>{
 const f=fixture();try{
  const a=await createCheckout(f.env,f.input);await execute(f.db,'DELETE FROM checkout_requests');
  await assert.rejects(()=>createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID(),newPurchase:true}),e=>e.status===409);
  f.sessions.get(a.sessionId).status='expired';
  const b=await createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID()});assert.notEqual(b.sessionId,a.sessionId);
 }finally{f.db.close();}
});
test('free Session can be safely edited, while only completed verified zero-cost status is paid',async()=>{
 const f=fixture();try{
  const input={...f.input,voucherCode:'free'},a=await createCheckout(f.env,input),s=f.sessions.get(a.sessionId);
  s.payment_status='no_payment_required';
  assert.equal((await verifiedCheckoutStatus(f.env,s.id)).paid,false);
  await releaseCheckout(f.env,input);assert.equal(s.status,'expired');
  assert.equal((await verifiedCheckoutStatus(f.env,s.id)).state,'expired');
  const b=await createCheckout(f.env,{...input,attemptKey:crypto.randomUUID()}),next=f.sessions.get(b.sessionId);
  next.status='complete';next.payment_status='no_payment_required';
  assert.equal((await verifiedCheckoutStatus(f.env,next.id)).paid,true);
  next.metadata.voucher_code='forged';await assert.rejects(()=>verifiedCheckoutStatus(f.env,next.id),e=>e.status===400);
 }finally{f.db.close();}
});
