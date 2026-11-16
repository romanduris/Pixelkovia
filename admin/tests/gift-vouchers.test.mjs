import {test} from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {fresh} from './support.mjs';
import {first,execute,query} from '../src/db.mjs';
import {createCheckout,releaseCheckout,verifiedCheckoutStatus,fulfill,paymentWebhook,unseal} from '../src/commerce.mjs';
import {giftVoucher,validateVoucher} from '../src/gift-vouchers.mjs';
import {paymentReport} from '../src/payment-monitor.mjs';

function fixture(){
 const db=fresh(),sessions=new Map(),keys=new Map(),sdk=new Stripe('sk_test_fixture');let lose=false,failRead=false;
 const batch=db.batch.bind(db);let queue=Promise.resolve();
 db.batch=statements=>{const result=queue.then(()=>batch(statements));queue=result.catch(()=>{});return result;};
 const env={TQ_DB:db,PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',CUSTOMER_AUTH_SECRET:'a'.repeat(64),STRIPE_SECRET_KEY:'rk_test_fixture',STRIPE_PUBLISHABLE_KEY:'pk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',RESEND_API_KEY:'fixture',STRIPE_CLIENT:{webhooks:sdk.webhooks,checkout:{sessions:{
  async create(input,{idempotencyKey}){
   if(!keys.has(idempotencyKey)){
    const id='cs_test_giftfixture'+sessions.size,s={...input,id,client_secret:'fixture',amount_total:input.line_items.reduce((n,l)=>n+l.price_data.unit_amount,0),currency:'eur',livemode:false,status:'open',payment_status:'no_payment_required',payment_intent:null};
    keys.set(idempotencyKey,s);sessions.set(id,s);
   }
   if(lose){lose=false;throw Error('Lost create response');}return keys.get(idempotencyKey);
  },
  async retrieve(id){if(failRead)throw Error('Stripe unavailable');return sessions.get(id);},
  async list(){if(failRead)throw Error('Stripe unavailable');return {data:[...sessions.values()],has_more:false};},
  async expire(id){const s=sessions.get(id);s.status='expired';return s;}
 }}}};
 const input={baseId:'episode-1',books:['story-book-before','story-book-after'],atlasIncluded:true,giftGame:true,email:'gift@example.invalid',voucherCode:' KOVO ',attemptKey:crypto.randomUUID(),uiMode:'elements'};
 const complete=id=>{sessions.get(id).status='complete';};
 return {db,env,input,sessions,complete,lose(){lose=true;},failRead(value){failRead=value;},event(id,eventId='evt_gift'){
  const payload=JSON.stringify({id:eventId,type:'checkout.session.completed',data:{object:{id,payment_status:'no_payment_required'}}});
  return new Request('https://pixelkovia.rodulab.com/api/stripe/webhook',{method:'POST',body:payload,headers:{'stripe-signature':sdk.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET})}});
 }};
}
test('three gift codes cover the full bundle, standalone books and the optional second game',async()=>{
 for(const code of ['KOVO','SANDY','ROSOS'])for(const baseId of ['episode-1','story-book-before','story-book-after']){
  const f=fixture();try{
   const a=await createCheckout(f.env,{...f.input,voucherCode:' '+code+' ',baseId,giftGame:baseId==='episode-1'});
   assert.equal(a.totalCents,0);assert.ok(f.sessions.get(a.sessionId).line_items.every(l=>l.price_data.unit_amount===0));
   assert.equal((await first(f.db,'SELECT * FROM checkout_attempts')).gift_voucher_code,code.toLowerCase());
   f.complete(a.sessionId);await fulfill(f.env,a.sessionId);
   assert.equal((await giftVoucher(f.db,code)).redeemed_attempt_id,(await first(f.db,'SELECT id FROM checkout_attempts')).id);
   assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,baseId==='episode-1'?2:1);
   assert.equal((await first(f.db,'SELECT sum(total_cents) n FROM orders')).n,0);
   await assert.rejects(()=>createCheckout(f.env,{...f.input,email:'another@example.invalid',attemptKey:crypto.randomUUID(),voucherCode:code}),e=>e.status===409);
   const report=await paymentReport(f.env,new URLSearchParams());assert.equal(report.rows[0].voucherCode,code.toLowerCase());
  }finally{f.db.close();}
 }
});
test('concurrent devices reserve one gift once, with idempotent retry after a lost Stripe response',async()=>{
 const f=fixture();try{
  const results=await Promise.allSettled([createCheckout(f.env,f.input),createCheckout(f.env,{...f.input,email:'second@example.invalid',attemptKey:crypto.randomUUID()})]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.find(r=>r.status==='rejected').reason.status,409);
  assert.equal(f.sessions.size,1);assert.equal((await first(f.db,'SELECT count(*) n FROM checkout_attempts')).n,1);
  assert.equal((await first(f.db,'SELECT count(*) n FROM gift_voucher_claims')).n,1);
  const winning=(await first(f.db,'SELECT email FROM checkout_attempts')).email;
  const key=winning===f.input.email?f.input.attemptKey:null;
  if(key)assert.equal((await createCheckout(f.env,f.input)).sessionId,results.find(r=>r.status==='fulfilled').value.sessionId);
 }finally{f.db.close();}
 const lost=fixture();try{
  lost.lose();await assert.rejects(()=>createCheckout(lost.env,lost.input),/Lost create/);
  const a=await createCheckout(lost.env,lost.input),b=await createCheckout(lost.env,lost.input);
  assert.equal(a.sessionId,b.sessionId);assert.equal(lost.sessions.size,1);
 }finally{lost.db.close();}
});
test('uncompleted or forged zero-cost Sessions grant no access and cannot consume a gift',async()=>{
 const f=fixture();try{
  const a=await createCheckout(f.env,f.input),s=f.sessions.get(a.sessionId);
  assert.equal(await fulfill(f.env,s.id),null);assert.equal((await verifiedCheckoutStatus(f.env,s.id)).paid,false);
  assert.equal((await giftVoucher(f.db,'KOVO')).redeemed_attempt_id,null);
  f.complete(s.id);
  for(const [key,bad] of [['gift_voucher_code','sandy'],['voucher_code','kovo']]){
   const old=s.metadata[key];s.metadata[key]=bad;await assert.rejects(()=>fulfill(f.env,s.id),e=>e.status===400);s.metadata[key]=old;
  }
  assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,0);
  await execute(f.db,'DELETE FROM gift_voucher_claims');
  await assert.rejects(()=>fulfill(f.env,s.id),/FOREIGN KEY/);
  assert.equal((await first(f.db,'SELECT count(*) n FROM customers')).n,0,'a released reservation cannot grant access');
 }finally{f.db.close();}
});
test('abandonment releases only verified expired Sessions and never a completed or unknown one',async()=>{
 const f=fixture();try{
  const a=await createCheckout(f.env,f.input);
  f.failRead(true);await assert.rejects(()=>releaseCheckout(f.env,{attemptKey:f.input.attemptKey}));
  assert.ok((await giftVoucher(f.db,'kovo')).reserved_attempt_id);
  f.failRead(false);await releaseCheckout(f.env,{attemptKey:f.input.attemptKey});
  assert.equal(f.sessions.get(a.sessionId).status,'expired');assert.equal((await giftVoucher(f.db,'kovo')).reserved_attempt_id,null);
  const b=await createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID()});f.complete(b.sessionId);
  await execute(f.db,'UPDATE checkout_attempts SET created_at=created_at-1800001');
  await assert.rejects(()=>createCheckout(f.env,{...f.input,email:'other@example.invalid',attemptKey:crypto.randomUUID()}),e=>e.status===409);
  assert.equal(f.sessions.size,2,'a completed checkout stays reserved while its webhook is pending');
 }finally{f.db.close();}
 const stale=fixture();try{
  await createCheckout(stale.env,stale.input);await execute(stale.db,'UPDATE checkout_attempts SET created_at=created_at-1800001');
  await createCheckout(stale.env,{...stale.input,email:'later@example.invalid',attemptKey:crypto.randomUUID()});
  assert.equal(stale.sessions.size,2);assert.equal([...stale.sessions.values()].filter(s=>s.status==='open').length,1);
 }finally{stale.db.close();}
});
test('signed webhook atomically redeems the gift, creates isolated access and survives delivery rollback/retries',async()=>{
 const f=fixture();try{
  const a=await createCheckout(f.env,f.input);f.complete(a.sessionId);
  // Keep delivery queued; this test never sends external email.
  f.env.RESEND_API_KEY='';
  const realBatch=f.db.batch;let fail=true;
  f.db.batch=statements=>{if(fail){fail=false;return realBatch([...statements,f.db.prepare('INSERT INTO missing_fixture_table VALUES(1)')]);}return realBatch(statements);};
  await assert.rejects(()=>fulfill(f.env,a.sessionId));
  assert.equal((await giftVoucher(f.db,'kovo')).redeemed_attempt_id,null);
  assert.equal((await first(f.db,'SELECT count(*) n FROM customers')).n,0);
  await paymentWebhook(f.event(a.sessionId),f.env);await paymentWebhook(f.event(a.sessionId,'evt_retry'),f.env);
  assert.equal((await first(f.db,'SELECT count(*) n FROM gift_voucher_redemptions')).n,1);
  assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,2);
  const deliveries=await query(f.db,'SELECT encrypted_message FROM access_deliveries');
  const messages=await Promise.all(deliveries.map(d=>unseal(d.encrypted_message,f.env.CUSTOMER_AUTH_SECRET)));
  assert.notEqual(messages[0].password,messages[1].password);assert.ok(messages.every(m=>m.email===f.input.email));
  assert.ok(messages.some(m=>m.gift));
  await assert.rejects(()=>validateVoucher(f.env,{code:' KOVO '}),e=>e.status===409);
  await releaseCheckout(f.env,{attemptKey:f.input.attemptKey});assert.ok((await giftVoucher(f.db,'kovo')).reserved_attempt_id);
 }finally{f.db.close();}
});
test('validation normalizes only server-known codes and never reserves or redeems a voucher',async()=>{
 const f=fixture();try{
  assert.deepEqual(await validateVoucher(f.env,{code:' SaNdY '}),{code:'sandy',gift:true});
  for(const code of ['unknown','<script>','',null,'a'.repeat(65)])await assert.rejects(()=>validateVoucher(f.env,{code}),e=>e.status===400);
  assert.equal((await first(f.db,'SELECT count(*) n FROM gift_voucher_claims')).n,0);
  assert.deepEqual(await validateVoucher(f.env,{code:'free'}),{code:'free',gift:false});
 }finally{f.db.close();}
});
