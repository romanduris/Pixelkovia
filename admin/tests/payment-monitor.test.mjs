import {test} from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import fs from 'node:fs';
import {fresh,LocalD1} from './support.mjs';
import {first,execute,query} from '../src/db.mjs';
import worker from '../src/worker.mjs';
import {createCheckout,verifiedCheckoutStatus,paymentWebhook,fulfill,auditPayments} from '../src/commerce.mjs';
import {paymentReport,paymentLog,browserPaymentEvent,observePayment,stripePaymentMethod,monitorCheck,prunePaymentLog} from '../src/payment-monitor.mjs';
const origin='https://pixelkovia.rodulab.com';
function fixture(){
  const db=fresh(),sessions=new Map(),sdk=new Stripe('sk_test_monitor_fixture');
  const env={TQ_DB:db,PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',CUSTOMER_AUTH_SECRET:'a'.repeat(64),STRIPE_SECRET_KEY:'sk_test_monitor_fixture',STRIPE_PUBLISHABLE_KEY:'pk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',RESEND_API_KEY:'re_fixture',STRIPE_CLIENT:{webhooks:sdk.webhooks,webhookEndpoints:{async list(){return {data:[{url:origin+'/api/stripe/webhook',status:'enabled',enabled_events:['*']}]};}},checkout:{sessions:{
    async create(input){const id='cs_test_monitorfixture'+sessions.size;const s={...input,id,amount_total:input.line_items.reduce((n,l)=>n+l.price_data.unit_amount,0),currency:'eur',livemode:false,status:'open',payment_status:'unpaid',payment_intent:null,client_secret:'NEVER_STORE_THIS_SECRET'};sessions.set(id,s);return s;},
    async retrieve(id){return sessions.get(id);},async list(){return {data:[...sessions.values()],has_more:false};}
  }}}};
  const input={email:'monitor@example.invalid',baseId:'episode-1',books:[],atlasIncluded:true,attemptKey:crypto.randomUUID(),uiMode:'elements'};
  const event=(type,object,id='evt_monitor_fixture')=>{const payload=JSON.stringify({id,type,data:{object}});return new Request(origin+'/api/stripe/webhook',{method:'POST',body:payload,headers:{'stripe-signature':sdk.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET})}});};
  return {db,env,input,event,sessions};
}
const request=input=>new Request(origin+'/api/checkout/diagnostic',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(input)});
test('payment method extraction distinguishes verified wallets, plain cards and missing details',()=>{
  const intent=wallet=>({latest_charge:{payment_method_details:{type:'card',card:{wallet,last4:'NEVER_STORE',fingerprint:'NEVER_STORE'}}}});
  for(const method of ['apple_pay','google_pay'])assert.equal(stripePaymentMethod(intent({type:method})),method);
  assert.equal(stripePaymentMethod(intent(null)),'card');
  assert.equal(stripePaymentMethod(intent({type:'NEVER_STORE'})),'wallet');
  for(const value of [null,'pi_unexpanded',{latest_charge:'ch_unexpanded'},{latest_charge:{payment_method_details:{type:'card'}}},{latest_charge:{payment_method_details:{type:'link'}}}])assert.equal(stripePaymentMethod(value),'unknown');
});
test('actual paid method wins over browser attempts and survives missing details, refunds and log pruning',async()=>{
  for(const actualMethod of ['google_pay','card']){
  const f=fixture();try{
    const session=await createCheckout(f.env,f.input),s=f.sessions.get(session.sessionId);
    await browserPaymentEvent(request({}),f.env,{type:'confirm_started',method:'apple_pay',productId:'episode-1',attemptKey:f.input.attemptKey});
    await verifiedCheckoutStatus(f.env,s.id);
    let report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.rows[0].method,'unknown');
    s.status='complete';s.payment_status='paid';s.payment_intent={id:'pi_method',status:'succeeded',latest_charge:{payment_method_details:{type:'card',card:{wallet:actualMethod==='card'?null:{type:actualMethod},last4:'NEVER_STORE',fingerprint:'NEVER_STORE'}}}};
    await verifiedCheckoutStatus(f.env,s.id);
    report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.rows[0].method,actualMethod);assert.equal(report.counts.paid,1);
    assert.equal(report.logs.find(l=>l.type==='paid').method,actualMethod);assert.equal(report.logs.find(l=>l.type==='confirm_started').method,'apple_pay');assert.ok(!JSON.stringify(report).includes('NEVER_STORE'));
    s.payment_intent.latest_charge='ch_unexpanded';await verifiedCheckoutStatus(f.env,s.id);
    assert.equal((await paymentReport(f.env,new URLSearchParams(),true)).rows[0].method,actualMethod);
    s.payment_intent.latest_charge={refunded:true};await verifiedCheckoutStatus(f.env,s.id);
    await execute(f.db,'UPDATE payment_log SET created_at=?',Date.now()-91*86400000);await prunePaymentLog(f.env);
    report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.rows[0].state,'refunded');assert.equal(report.rows[0].method,actualMethod);assert.equal(report.logs.length,0);assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,0);
  }finally{f.db.close();}
  }
});
test('signed successful payments record Apple Pay or card even without browser telemetry; audit backfills old settled purchases',async()=>{
  const f=fixture();try{
    for(const method of ['apple_pay','card']){
      const session=await createCheckout(f.env,{...f.input,email:method+'@example.invalid',attemptKey:crypto.randomUUID()}),s=f.sessions.get(session.sessionId);
      s.status='complete';s.payment_status='paid';s.payment_intent={id:'pi_'+method,status:'succeeded',latest_charge:{payment_method_details:{type:'card',card:{wallet:method==='card'?null:{type:method}}}}};
      // Simulate a legacy completed purchase whose method has not been recorded.
      if(method==='apple_pay'){
        await fulfill(f.env,s.id);const a=await first(f.db,'SELECT * FROM checkout_attempts WHERE stripe_session_id=?',s.id);await observePayment(f.env,a,'paid');
        await auditPayments(f.env);
      }else{const sender=f.env.RESEND_API_KEY;f.env.RESEND_API_KEY='';try{await paymentWebhook(f.event('checkout.session.completed',s,'evt_'+method),f.env);}finally{f.env.RESEND_API_KEY=sender;}}
      const report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.rows.find(r=>r.sessionId===s.id).method,method);
    }
    const report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.counts.paid,2);assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,2);assert.equal(report.logs.filter(l=>l.source==='browser').length,0);
  }finally{f.db.close();}
});
test('browser telemetry is bounded, deduplicated, private, and cannot report a successful payment',async()=>{
  const f=fixture();try{
    const session=await createCheckout(f.env,f.input);
    const data={type:'element_error',productId:'episode-1',attemptKey:f.input.attemptKey,code:'NEVER_STORE_THIS_SECRET',message:'4242424242424242',email:'NEVER_STORE_EMAIL',clientSecret:session.clientSecret};
    assert.equal((await worker.fetch(request({...data,type:'paid'}),f.env)).status,400);
    assert.equal((await worker.fetch(new Request('https://wrong.invalid/api/checkout/diagnostic',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(data)}),f.env)).status,403);
    assert.equal((await worker.fetch(request(data),f.env)).status,200);
    assert.equal((await worker.fetch(request(data),f.env)).status,200);
    const rows=await query(f.db,"SELECT * FROM payment_log WHERE source='browser'");assert.equal(rows.length,1);
    const saved=JSON.stringify(rows);for(const secret of ['NEVER_STORE','4242424242424242','monitor@example.invalid',f.input.attemptKey])assert.ok(!saved.includes(secret));
    assert.equal((await worker.fetch(request({...data,type:'confirm_error',code:'billing_phone_missing'}),f.env)).status,200);
    assert.equal((await first(f.db,"SELECT code FROM payment_log WHERE type='confirm_error'")).code,'billing_phone_missing');
    for(const type of ['wallet_wait_timeout','confirmation_recovered'])assert.equal((await worker.fetch(request({...data,type}),f.env)).status,200);
    assert.equal((await worker.fetch(new Request(origin+'/api/admin/payments'),f.env)).status,403);
    assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,0);
    for(let n=0;n<61;n++)await worker.fetch(request(data),f.env);
    assert.equal((await worker.fetch(request(data),f.env)).status,429);
  }finally{f.db.close();}
});
test('signed failed card and asynchronous events are logged once, without granting access',async()=>{
  const f=fixture();try{
    const session=await createCheckout(f.env,f.input);
    const intent={id:'pi_monitor',last_payment_error:{code:'card_declined',decline_code:'insufficient_funds',charge:'ch_declined',message:'DO_NOT_STORE'}};
    f.sessions.get(session.sessionId).payment_intent=intent;
    const event=f.event('payment_intent.payment_failed',intent);
    await paymentWebhook(event.clone(),f.env);await paymentWebhook(event.clone(),f.env);
    const failure=await first(f.db,"SELECT * FROM payment_log WHERE type='payment_failed'");assert.equal(failure.source,'stripe');assert.equal(failure.code,'insufficient_funds');assert.ok(failure.attempt_id);
    assert.equal((await first(f.db,"SELECT count(*) n FROM payment_log WHERE type='payment_failed'")).n,1);
    const invalid=new Request(origin+'/api/stripe/webhook',{method:'POST',body:'{}',headers:{'stripe-signature':'forged'}});await assert.rejects(()=>paymentWebhook(invalid,f.env),e=>e.status===400);
    await paymentWebhook(f.event('checkout.session.async_payment_failed',f.sessions.get(session.sessionId),'evt_async_failure'),f.env);
    assert.equal((await first(f.db,"SELECT count(*) n FROM payment_log WHERE type='payment_failed'")).n,2);
    assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,0);
  }finally{f.db.close();}
});
test('an attempt exists before Stripe creation; retries, early failures and recovery retain one ID',async()=>{
  const f=fixture();try{
    const create=f.env.STRIPE_CLIENT.checkout.sessions.create;
    f.env.STRIPE_CLIENT.checkout.sessions.create=async()=>{
      const report=await paymentReport(f.env,new URLSearchParams(),true);
      assert.equal(report.total,1);assert.equal(report.rows[0].email,f.input.email);
      assert.equal(report.rows[0].status,'started');assert.equal(report.rows[0].sessionId,null);
      const error=Error('DO_NOT_STORE');error.type='StripeConnectionError';throw error;
    };
    const response=await worker.fetch(new Request(origin+'/api/checkout/session',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(f.input)}),f.env);
    assert.equal(response.status,500);
    let report=await paymentReport(f.env,new URLSearchParams(),true),id=report.rows[0].id;
    assert.equal(report.rows[0].status,'error');assert.match(report.rows[0].reason,/StripeConnectionError/);
    await execute(f.db,'UPDATE checkout_attempts SET created_at=?',Date.now()-1800001);
    assert.equal((await paymentReport(f.env,new URLSearchParams(),true)).rows[0].status,'error');
    // Restore its original creation window for an idempotent retry.
    await execute(f.db,'UPDATE checkout_attempts SET created_at=?',Date.now());
    f.env.STRIPE_CLIENT.checkout.sessions.create=create;
    const session=await createCheckout(f.env,f.input);await createCheckout(f.env,f.input);
    report=await paymentReport(f.env,new URLSearchParams(),true);
    assert.equal(report.total,1);assert.equal(report.rows[0].id,id);assert.equal(report.rows[0].status,'started');
    assert.equal(report.rows[0].sessionId,session.sessionId);assert.equal(f.sessions.size,1);
    await paymentLog(f.env,{type:'session_error',attemptId:id,code:'StripeConnectionError'});
    assert.equal((await paymentReport(f.env,new URLSearchParams(),true)).rows[0].status,'started','a duplicate old failure cannot undo recovery');
  }finally{f.db.close();}
});
test('webhook monitoring storage failure retries safely instead of acknowledging a lost failure',async()=>{
  const f=fixture();try{
    const session=await createCheckout(f.env,f.input),s=f.sessions.get(session.sessionId);
    s.payment_intent={id:'pi_retry',status:'requires_payment_method',last_payment_error:{code:'card_declined',charge:'ch_retry'}};
    const event=f.event('payment_intent.payment_failed',s.payment_intent),prepare=f.db.prepare.bind(f.db);
    f.db.prepare=sql=>{if(sql.startsWith('INSERT INTO payment_attempt_outcomes'))throw Error('Simulated transient D1 failure');return prepare(sql);};
    await assert.rejects(()=>paymentWebhook(event.clone(),f.env),/Simulated transient/);
    assert.equal((await first(f.db,'SELECT count(*) n FROM payment_events')).n,0);
    f.db.prepare=prepare;
    await paymentWebhook(event.clone(),f.env);await paymentWebhook(event.clone(),f.env);
    const report=await paymentReport(f.env,new URLSearchParams(),true);
    assert.equal(report.rows[0].status,'declined');assert.equal(report.logs.filter(l=>l.type==='payment_failed').length,1);
    assert.equal((await first(f.db,'SELECT count(*) n FROM payment_events')).n,1);assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,0);
  }finally{f.db.close();}
});
test('abandonment, browser wallet dismissal, timeouts, technical failure and email failure are distinct',async()=>{
  const f=fixture();try{
    const session=await createCheckout(f.env,f.input),s=f.sessions.get(session.sessionId);
    for(const type of ['wallet_cancelled','confirmation_timeout','wallet_wait_timeout','confirm_error','status_error','delivery_failed'])await paymentLog(f.env,{type,source:'browser',attemptId:s.client_reference_id});
    let report=await paymentReport(f.env,new URLSearchParams(),true);
    assert.equal(report.rows[0].status,'started');assert.equal(report.rows[0].reason,'Neznáme');
    s.status='expired';await verifiedCheckoutStatus(f.env,s.id);
    report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.rows[0].status,'abandoned');
    assert.equal(report.attemptCounts.cancelled,0);assert.equal(report.attemptCounts.error,0);
    await paymentLog(f.env,{type:'element_error',source:'browser',attemptId:s.client_reference_id});
    report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.rows[0].status,'error');
    assert.match(report.rows[0].reason,/načítať údaje karty/);
    await execute(f.db,'UPDATE payment_log SET created_at=?',Date.now()-91*86400000);await prunePaymentLog(f.env);
    report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.rows[0].status,'error');assert.equal(report.logs.length,0);
    const next=await createCheckout(f.env,{...f.input,email:'no-session@example.invalid',attemptKey:crypto.randomUUID()});
    await execute(f.db,'UPDATE checkout_attempts SET stripe_session_id=NULL,created_at=? WHERE stripe_session_id=?',Date.now()-1800001,next.sessionId);
    assert.equal((await paymentReport(f.env,new URLSearchParams(),true)).attemptCounts.abandoned,1);
  }finally{f.db.close();}
});
test('only explicitly verified customer cancellation sets cancelled; signed duplicates are idempotent',async()=>{
  for(const reason of ['requested_by_customer','abandoned','automatic','expired',undefined]){
    const f=fixture();try{
      const session=await createCheckout(f.env,f.input),s=f.sessions.get(session.sessionId);
      s.payment_intent={id:'pi_cancelled',status:'canceled',cancellation_reason:reason};
      const event=f.event('payment_intent.canceled',s.payment_intent);
      await paymentWebhook(event.clone(),f.env);await paymentWebhook(event.clone(),f.env);
      let report=await paymentReport(f.env,new URLSearchParams(),true);
      assert.equal(report.rows[0].status,reason==='requested_by_customer'?'cancelled':'started');
      assert.equal(report.logs.filter(l=>l.type==='customer_cancelled').length,reason==='requested_by_customer'?1:0);
      s.status='expired';await verifiedCheckoutStatus(f.env,s.id);
      report=await paymentReport(f.env,new URLSearchParams(),true);
      assert.equal(report.rows[0].status,reason==='requested_by_customer'?'cancelled':'abandoned');
      assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,0);
    }finally{f.db.close();}
  }
});
test('bank refusal, provider processing failure and unknown failures retain only safe reasons and verified methods',async()=>{
  for(const [error,status,kind] of [
    [{code:'card_declined',decline_code:'insufficient_funds',type:'card_error'},'declined','bank'],
    [{code:'processing_error',type:'api_error'},'error','technical'],
    [{code:'NEW_UNKNOWN_CODE',type:'NEW_UNKNOWN_TYPE'},'unknown','unknown']
  ]){
    const f=fixture();try{
      const session=await createCheckout(f.env,f.input),s=f.sessions.get(session.sessionId);
      s.payment_intent={id:'pi_failure',status:'requires_payment_method',last_payment_error:{...error,charge:'ch_one',message:'DO_NOT_STORE',payment_method:{type:'card',card:{wallet:{type:'google_pay'},last4:'DO_NOT_STORE',fingerprint:'DO_NOT_STORE'}}}};
      const event=f.event('payment_intent.payment_failed',s.payment_intent);
      await paymentWebhook(event.clone(),f.env);await paymentWebhook(event.clone(),f.env);await verifiedCheckoutStatus(f.env,s.id);
      const report=await paymentReport(f.env,new URLSearchParams(),true);
      assert.equal(report.rows[0].status,status);assert.equal(report.rows[0].failureKind,kind);assert.equal(report.rows[0].method,'google_pay');
      assert.equal(report.logs.filter(l=>l.type.startsWith('payment_')).length,1);
      const saved=JSON.stringify(await query(f.db,'SELECT * FROM payment_attempt_outcomes'))+JSON.stringify(report.logs);
      for(const value of ['DO_NOT_STORE','NEW_UNKNOWN_CODE','NEW_UNKNOWN_TYPE'])assert.ok(!saved.includes(value));
      assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,0);
    }finally{f.db.close();}
  }
});
test('success waits for signed verified webhook; duplicates and late failures never reverse it or duplicate a gift',async()=>{
  const f=fixture();try{
    const session=await createCheckout(f.env,{...f.input,giftGame:true}),s=f.sessions.get(session.sessionId);
    s.status='complete';s.payment_status='paid';s.payment_intent={id:'pi_success',status:'succeeded'};
    await verifiedCheckoutStatus(f.env,s.id);
    let report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.rows[0].status,'started');assert.equal(report.attemptCounts.successful,0);
    const forged=new Request(origin+'/api/stripe/webhook',{method:'POST',body:JSON.stringify({type:'checkout.session.completed',data:{object:s}}),headers:{'stripe-signature':'forged'}});
    await assert.rejects(()=>paymentWebhook(forged,f.env),e=>e.status===400);
    f.env.RESEND_API_KEY='';
    const paid=f.event('checkout.session.completed',s);
    await paymentWebhook(paid.clone(),f.env);await paymentWebhook(paid.clone(),f.env);
    await paymentWebhook(f.event('checkout.session.async_payment_succeeded',s,'evt_async_success'),f.env);
    await paymentWebhook(f.event('payment_intent.payment_failed',{id:'pi_success',last_payment_error:{code:'card_declined',charge:'ch_old'}},'evt_late_failure'),f.env);
    report=await paymentReport(f.env,new URLSearchParams(),true);
    assert.equal(report.attemptCounts.successful,1);assert.equal(report.total,1);assert.equal(report.rows[0].status,'successful');assert.equal(report.rows[0].giftGame,true);
    assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,2);
    assert.equal((await first(f.db,'SELECT count(*) n FROM access_deliveries')).n,2);
    assert.equal((await first(f.db,'SELECT count(*) n FROM payment_attempt_outcomes')).n,1);
  }finally{f.db.close();}
});
test('signed webhook errors link exactly to an attempt and remain distinct from a later successful payment',async()=>{
  const f=fixture();try{
    const checkout=await createCheckout(f.env,f.input),session=f.sessions.get(checkout.sessionId),id=session.client_reference_id;
    session.status='complete';session.payment_status='paid';
    const retrieve=f.env.STRIPE_CLIENT.checkout.sessions.retrieve;
    f.env.STRIPE_CLIENT.checkout.sessions.retrieve=async()=>{const e=Error('DO_NOT_STORE');e.type='StripeConnectionError';throw e;};
    const event=f.event('checkout.session.completed',session,'evt_linked_retry');
    await assert.rejects(()=>paymentWebhook(event.clone(),f.env),/DO_NOT_STORE/);
    await assert.rejects(()=>paymentWebhook(event.clone(),f.env),/DO_NOT_STORE/);
    let report=await paymentReport(f.env,new URLSearchParams({category:'bank'}),true);
    assert.equal(report.errors24,1);assert.equal(report.attention.unlinkedTechnical,0);assert.equal(report.attention.linkedAttempts24,1);
    assert.equal(report.attention.events[0].linked_attempt_id,id);assert.equal(report.attention.events[0].type,'webhook_error');
    assert.equal(report.logs.length,0,'category filter cannot hide the alert evidence');assert.equal(report.rows[0].issues[0].kind,'technical');assert.equal(report.rows[0].status,'started');
    assert.ok(!JSON.stringify(report).includes('DO_NOT_STORE'));
    f.env.STRIPE_CLIENT.checkout.sessions.retrieve=retrieve;f.env.RESEND_API_KEY='';
    await paymentWebhook(event.clone(),f.env);await paymentWebhook(event.clone(),f.env);
    report=await paymentReport(f.env,new URLSearchParams({attention:'1'}),true);
    assert.equal(report.rows.length,1);assert.equal(report.rows[0].status,'successful');assert.equal(report.attemptCounts.error,0);assert.equal(report.rows[0].issues[0].kind,'technical');
    assert.equal(report.errors24,1);assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,1);
    const invalid=new Request(origin+'/api/stripe/webhook',{method:'POST',body:'{}',headers:{'stripe-signature':'forged'}});await assert.rejects(()=>paymentWebhook(invalid,f.env),e=>e.status===400);
    assert.equal((await first(f.db,"SELECT count(*) n FROM payment_log WHERE type='webhook_error'")).n,1);
  }finally{f.db.close();}
});
test('attention filters reach old and later-batch attempts; unlinked and truncated logs never invent purchase links',async()=>{
  const f=fixture();try{
    const now=Date.now();
    for(let i=0;i<45;i++)await execute(f.db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at) VALUES(?,?,?,?,?,?)','attention-'+i,'private@example.invalid','','["episode-1"]',1499,now-i*1000);
    await execute(f.db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at) VALUES(?,?,?,?,?,?)','old-attention','private@example.invalid','','["episode-1"]',1499,now-40*86400000);
    await paymentLog(f.env,{type:'status_error',attemptId:'attention-44'});
    await paymentLog(f.env,{type:'webhook_error',attemptId:'old-attention'});
    await paymentLog(f.env,{type:'webhook_error',dedupe:'unlinked'});
    const get=params=>paymentReport(f.env,new URLSearchParams(params),true);
    let report=await get({days:'30',category:'bank'});assert.equal(report.rows.length,40);assert.ok(!report.rows.some(r=>r.id==='attention-44'));
    assert.equal(report.attention.linkedAttempts24,2);assert.equal(report.attention.unlinkedTechnical,1);assert.equal(report.attention.attemptsInPeriod,1);assert.equal(report.logs.length,0);
    report=await get({days:'all',attention:'1'});assert.equal(report.rows.length,2);assert.equal(report.total,46);assert.equal(report.attentionOnly,true);
    assert.deepEqual(new Set(report.rows.map(r=>r.id)),new Set(['attention-44','old-attention']));assert.equal(report.attemptCounts.error,0,'status_error and webhook_error do not prove failed payment');
    report=await get({days:'all',attempt:'old-attention'});assert.equal(report.rows.length,1);assert.equal(report.attemptId,'old-attention');assert.ok(report.rows[0].issues.length);
    for(let i=0;i<201;i++)await paymentLog(f.env,{type:'webhook_error',dedupe:'cap-'+i,at:now+1000+i});
    report=await get({days:'all',attention:'1'});assert.equal(report.attention.events.length,200);assert.equal(report.attention.eventTotal,204);assert.equal(report.attention.unlinkedTechnical,202);assert.equal(report.rows.length,2,'row flags use all relevant signals, not just the last 200 events');
    assert.ok(report.attention.events.every(l=>l.linked_attempt_id===null));
    for(const params of [{attention:'forged'},{attempt:'bad/identifier'}])await assert.rejects(()=>get(params),e=>e.status===400);
  }finally{f.db.close();}
});
test('40-row cursor batches survive concurrent arrivals, equal timestamps, refreshes and filters',async()=>{
  const f=fixture();try{
    const now=Date.now();
    for(let i=0;i<105;i++)await execute(f.db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at) VALUES(?,?,?,?,?,?)','page-'+String(i).padStart(3,'0'),'private'+i+'@example.invalid','','["episode-1"]',1499,now);
    await paymentLog(f.env,{type:'sdk_error',source:'browser',attemptId:'page-000'});
    const get=values=>paymentReport(f.env,new URLSearchParams({days:'all',...values}),true);
    let report=await get({});
    assert.equal(report.total,105);assert.equal(report.rows.length,40);assert.equal(report.pageSize,40);assert.equal(report.pages,3);assert.equal(report.hasMore,true);
    assert.equal(report.attemptCounts.started,104);assert.equal(report.attemptCounts.error,1);
    assert.equal((await get({page:'3'})).rows.length,25,'legacy page parameter remains compatible');
    const ids=new Set(report.rows.map(r=>r.id)),firstCursor=report.nextCursor;
    await execute(f.db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at) VALUES(?,?,?,?,?,?)','new-arrival','new@example.invalid','','["episode-1"]',1499,now+1);
    report=await get({cursor:firstCursor});assert.equal(report.rows.length,40);assert.equal(report.rows[0].id,'page-040');
    for(const r of report.rows){assert.ok(!ids.has(r.id));ids.add(r.id);}
    const secondCursor=report.nextCursor;
    const refreshed=await get({through:report.refreshCursor});assert.equal(refreshed.rows.length,81);assert.equal(refreshed.rows[0].id,'new-arrival');assert.equal(refreshed.rows.at(-1).id,'page-079');assert.equal(refreshed.hasMore,true);assert.equal(refreshed.total,106);
    report=await get({cursor:secondCursor});assert.equal(report.rows.length,25);assert.equal(report.hasMore,false);assert.equal(report.nextCursor,null);
    for(const r of report.rows){assert.ok(!ids.has(r.id));ids.add(r.id);}assert.equal(ids.size,105);
    const all=await get({through:report.refreshCursor});assert.equal(all.rows.length,106);assert.equal(all.hasMore,false);
    // A changed/deleted boundary still defines a stable range.
    await execute(f.db,'DELETE FROM checkout_attempts WHERE id=?','page-079');
    assert.equal((await get({through:secondCursor})).rows.length,80);
    assert.equal((await get({cursor:secondCursor})).rows.length,25);
    report=await get({status:'error',page:'2'});assert.equal(report.page,1);assert.equal(report.matchingTotal,1);assert.equal(report.rows[0].id,'page-000');assert.equal(report.attemptCounts.started,104);assert.equal(report.hasMore,false);
    report=await get({status:'cancelled'});assert.equal(report.rows.length,0);assert.equal(report.refreshCursor,null);assert.equal(report.hasMore,false);
    const forged=btoa(JSON.stringify([-1,'id']));
    for(const params of [{status:'forged'},{page:'0'},{page:'NaN'},{cursor:'invalid'},{through:forged},{cursor:firstCursor,through:secondCursor},{cursor:firstCursor,page:'2'}])await assert.rejects(()=>get(params),e=>e.status===400);
    const response=await worker.fetch(new Request(origin+'/api/admin/payments?days=all'),f.env);
    assert.equal(response.status,403);assert.ok(!(await response.text()).includes('@example.invalid'));
  }finally{f.db.close();}
});
test('completed free vouchers reported as paid or no_payment_required fulfill once and expose exact optional metadata',async()=>{
  for(const paymentStatus of ['paid','no_payment_required'])for(const giftGame of [false,true]){
    const f=fixture();try{
      const checkout=await createCheckout(f.env,{...f.input,books:['story-book-before','story-book-after'],giftGame,voucherCode:' FREE ',subtotalCents:1,voucherDiscountCents:1}),session=f.sessions.get(checkout.sessionId);
      session.status='complete';session.payment_status=paymentStatus;session.payment_intent=null;
      await verifiedCheckoutStatus(f.env,session.id);
      let row=(await paymentReport(f.env,new URLSearchParams(),true)).rows[0];
      assert.equal(row.status,'started','a zero price alone never confirms the webhook');
      assert.equal(row.voucherCode,'free');assert.equal(row.subtotalCents,giftGame?3496:2497);assert.equal(row.bundleDiscountCents,499);assert.equal(row.voucherDiscountCents,giftGame?2997:1998);
      assert.equal(row.orderCount,0);assert.deepEqual(row.orderStates,[]);
      f.env.RESEND_API_KEY='';
      const event=f.event('checkout.session.completed',session);
      await paymentWebhook(event.clone(),f.env);await paymentWebhook(event.clone(),f.env);
      await paymentWebhook(f.event('checkout.session.completed',session,'evt_free_retry'),f.env);
      const report=await paymentReport(f.env,new URLSearchParams(),true);row=report.rows[0];
      const count=giftGame?2:1;
      assert.equal(row.status,'successful');assert.equal(row.state,'free');assert.equal(row.providerState,'free');assert.equal(row.method,'free');
      assert.equal(report.attemptCounts.successful,1);assert.equal(report.total,1);
      assert.equal(row.orderCount,count);assert.equal(row.expectedOrderCount,count);assert.deepEqual(row.orderStates,['paid']);
      assert.deepEqual(row.delivery,{total:count,sent:0,failed:0,queued:count,lastSentAt:null});
      assert.ok(row.webhookConfirmedAt>0);assert.ok(row.fulfilledAt>0);
      assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,count);
      assert.equal((await first(f.db,'SELECT count(*) n FROM customer_credentials')).n,count);
      assert.ok(!JSON.stringify(report).includes('NEVER_STORE'));
    }finally{f.db.close();}
  }
});
test('voucher and order reporting separates no voucher, 1e, unknown historical pricing and partial delivery without duplicating linked orders',async()=>{
  const f=fixture();try{
    const normal=await createCheckout(f.env,f.input);
    let row=(await paymentReport(f.env,new URLSearchParams(),true)).rows[0];
    assert.equal(row.voucherCode,null);assert.equal(row.subtotalCents,1499);assert.equal(row.bundleDiscountCents,0);assert.equal(row.voucherDiscountCents,0);
    const checkout=await createCheckout(f.env,{...f.input,email:'voucher@example.invalid',attemptKey:crypto.randomUUID(),books:['story-book-before','story-book-after'],giftGame:true,voucherCode:'1E'}),session=f.sessions.get(checkout.sessionId);
    session.status='complete';session.payment_status='paid';session.payment_intent={id:'pi_voucher',status:'succeeded'};f.env.RESEND_API_KEY='';
    await paymentWebhook(f.event('checkout.session.completed',session),f.env);
    const deliveries=await query(f.db,'SELECT d.order_id FROM access_deliveries d JOIN checkout_orders co ON co.order_id=d.order_id WHERE co.attempt_id=?',session.client_reference_id),sentAt=Date.now();
    await execute(f.db,"UPDATE access_deliveries SET status='sent',sent_at=? WHERE order_id=?",sentAt,deliveries[0].order_id);
    await execute(f.db,"UPDATE access_deliveries SET status='failed' WHERE order_id=?",deliveries[1].order_id);
    row=(await paymentReport(f.env,new URLSearchParams(),true)).rows.find(r=>r.sessionId===session.id);
    assert.equal(row.voucherCode,'1e');assert.equal(row.subtotalCents,3496);assert.equal(row.bundleDiscountCents,499);assert.equal(row.voucherDiscountCents,2897);assert.equal(row.totalCents,100);
    assert.equal(row.orderCount,2);assert.deepEqual(row.delivery,{total:2,sent:1,failed:1,queued:0,lastSentAt:sentAt});
    await execute(f.db,'UPDATE checkout_attempts SET subtotal_cents=NULL,bundle_discount_cents=NULL,voucher_discount_cents=NULL WHERE stripe_session_id=?',normal.sessionId);
    row=(await paymentReport(f.env,new URLSearchParams(),true)).rows.find(r=>r.sessionId===normal.sessionId);
    assert.equal(row.subtotalCents,null);assert.equal(row.bundleDiscountCents,null);assert.equal(row.voucherDiscountCents,null);assert.equal(row.voucherCode,null);
  }finally{f.db.close();}
});
test('a paid zero-cost result still requires the approved voucher, completion, matching currency and server attempt',async()=>{
  for(const invalid of ['voucher','metadata','currency','completion','amount','mode','reference']){
    const f=fixture();try{
      const checkout=await createCheckout(f.env,{...f.input,voucherCode:'free'}),s=f.sessions.get(checkout.sessionId);
      s.status='complete';s.payment_status='paid';
      if(invalid==='voucher')await execute(f.db,'UPDATE checkout_attempts SET voucher_code=NULL WHERE stripe_session_id=?',s.id);
      if(invalid==='metadata')s.metadata.voucher_code='not-approved';
      if(invalid==='currency')s.currency='usd';
      if(invalid==='completion')s.status='open';
      if(invalid==='amount')s.amount_total=100;
      if(invalid==='mode')s.mode='subscription';
      if(invalid==='reference')s.client_reference_id='foreign-attempt';
      await assert.rejects(()=>paymentWebhook(f.event('checkout.session.completed',s),f.env),e=>e.status===400);
      assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,0);
      assert.equal((await paymentReport(f.env,new URLSearchParams(),true)).attemptCounts.successful,0);
    }finally{f.db.close();}
  }
});
test('payment report counts a paid gift once, separates free and refund, and flags delayed access',async()=>{
  const f=fixture();try{
    const gift=await createCheckout(f.env,{...f.input,giftGame:true}),s=f.sessions.get(gift.sessionId);
    s.status='complete';s.payment_status='paid';s.payment_intent={id:'pi_monitor_paid',status:'succeeded'};
    await verifiedCheckoutStatus(f.env,s.id);
    await execute(f.db,'UPDATE payment_observations SET paid_at=?',Date.now()-180000);
    let report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.fulfillmentDelayed,1);assert.equal(report.health,'attention');assert.ok(report.rows[0].issues.some(i=>i.kind==='fulfillment'));
    await fulfill(f.env,s.id);
    assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,2);
    const free=await createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID(),voucherCode:'free'}),z=f.sessions.get(free.sessionId);z.status='complete';z.payment_status='no_payment_required';
    await verifiedCheckoutStatus(f.env,z.id);await fulfill(f.env,z.id);
    await monitorCheck(f.env,'stripe',true);await monitorCheck(f.env,'webhook',true);
    report=await paymentReport(f.env,new URLSearchParams(),true);
    assert.equal(report.counts.paid,1);assert.equal(report.counts.free,1);assert.equal(report.total,2);assert.equal(report.fulfillmentDelayed,0);assert.ok(report.lastSuccessAt);
    assert.equal(report.rows.find(r=>r.sessionId===z.id).method,'free');
    await execute(f.db,"UPDATE orders SET status='refunded' WHERE external_reference=? OR external_reference=?",s.id,s.id+':gift');
    report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.counts.refunded,1);assert.equal(report.counts.paid,0);
    await assert.rejects(()=>paymentReport(f.env,new URLSearchParams({days:'10000'}),true),e=>e.status===400);
  }finally{f.db.close();}
});
test('provider errors are observable and monitor storage failure does not break checkout',async()=>{
  const f=fixture();try{
    const create=f.env.STRIPE_CLIENT.checkout.sessions.create;f.env.STRIPE_CLIENT.checkout.sessions.create=async()=>{const e=Error('NEVER_STORE_THIS_SECRET');e.type='StripeConnectionError';throw e;};
    const r=await worker.fetch(new Request(origin+'/api/checkout/session',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(f.input)}),f.env);
    assert.equal(r.status,500);assert.ok(!(await r.text()).includes('NEVER_STORE'));
    const log=await first(f.db,"SELECT * FROM payment_log WHERE type='session_error'");assert.equal(log.code,'StripeConnectionError');assert.ok(log.attempt_id);
    f.env.STRIPE_CLIENT.checkout.sessions.create=create;
    await execute(f.db,'DROP TABLE payment_log');await execute(f.db,'DROP TABLE payment_observations');
    const session=await createCheckout(f.env,f.input);assert.ok(session.clientSecret);
    assert.equal((await verifiedCheckoutStatus(f.env,session.sessionId)).state,'ready');
  }finally{f.db.close();}
});
test('server audit detects unpaid expiry without a browser, checks freshness, and prunes only old diagnostics',async()=>{
  const f=fixture();try{
    const session=await createCheckout(f.env,f.input);f.sessions.get(session.sessionId).status='expired';
    await auditPayments(f.env);
    let report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.counts.expired,1);assert.equal(report.health,'observing');assert.equal(report.errors24,0);
    await execute(f.db,'UPDATE payment_monitor_checks SET checked_at=?',Date.now()-3600000);
    report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.health,'stale');
    await paymentLog(f.env,{type:'sdk_error',at:Date.now()-91*86400000});await prunePaymentLog(f.env);
    assert.equal((await first(f.db,"SELECT count(*) n FROM payment_log WHERE type='sdk_error'")).n,0);
    assert.equal((await first(f.db,'SELECT count(*) n FROM checkout_attempts')).n,1);
  }finally{f.db.close();}
});
test('signed expiry is abandonment, and an unpaid completed event is never success',async()=>{
  const f=fixture();try{
    const session=await createCheckout(f.env,f.input),s=f.sessions.get(session.sessionId);
    await paymentWebhook(f.event('checkout.session.completed',s,'evt_unpaid_complete'),f.env);
    assert.equal((await paymentReport(f.env,new URLSearchParams(),true)).rows[0].status,'started');
    s.status='expired';const event=f.event('checkout.session.expired',s,'evt_expired');
    await paymentWebhook(event.clone(),f.env);await paymentWebhook(event.clone(),f.env);
    const report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.rows[0].status,'abandoned');
    assert.equal(report.attemptCounts.successful,0);assert.equal(report.logs.filter(l=>l.type==='expired').length,1);
    assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,0);
  }finally{f.db.close();}
});
test('migration preserves historical successful purchases and classifies only known historical failures',async()=>{
  const db=new LocalD1();try{
    const folder=new URL('../migrations/',import.meta.url);
    for(const file of fs.readdirSync(folder).filter(f=>f.endsWith('.sql')&&!f.startsWith('0013')).sort())db.sqlite.exec(fs.readFileSync(new URL(file,folder),'utf8'));
    const now=Date.now(),env={TQ_DB:db};
    for(const id of ['legacy-paid','legacy-bank','legacy-technical','legacy-timeout','legacy-unknown','legacy-recovered'])await execute(db,'INSERT INTO checkout_attempts(id,email,name,selection,total_cents,created_at,stripe_session_id) VALUES(?,?,?,?,?,?,?)',id,'private@example.invalid','','["episode-1"]',1499,now,'cs_test_'+id);
    await execute(db,'INSERT INTO customers VALUES(?,?,?,?)','legacy-customer','private@example.invalid','',now);
    await execute(db,"INSERT INTO orders VALUES(?,?,?,'paid',1499,'EUR',?,?)",'legacy-order','legacy-customer','cs_test_legacy-paid',now,now);
    for(const [id,type,code,offset] of [
      ['legacy-bank','payment_failed','insufficient_funds',0],['legacy-technical','payment_failed','processing_error',0],
      ['legacy-timeout','confirmation_timeout','',0],['legacy-unknown','payment_failed','',0],
      ['legacy-recovered','session_error','StripeConnectionError',-1000],['legacy-recovered','session_created','',0]
    ])await execute(db,'INSERT INTO payment_log VALUES(?,?,?,?,?,?,?,?,?)',id+type,id,type==='session_created'?'server':'stripe',type,'technical',code,'unknown','',now+offset);
    db.sqlite.exec(fs.readFileSync(new URL('0013_payment_attempt_outcomes.sql',folder),'utf8'));
    const report=await paymentReport(env,new URLSearchParams(),true),statuses=Object.fromEntries(report.rows.map(r=>[r.id,r.status]));
    assert.deepEqual(statuses,{'legacy-paid':'successful','legacy-bank':'declined','legacy-technical':'error','legacy-timeout':'started','legacy-unknown':'unknown','legacy-recovered':'started'});
    assert.ok(!JSON.stringify(await query(db,'SELECT * FROM payment_attempt_outcomes')).includes('private@example.invalid'));
  }finally{db.close();}
});

test('administrator reviews persist per event, survive duplicate webhooks, reopen, and never alter payment or fulfillment',async()=>{
  const f=fixture();try{
    const session=await createCheckout(f.env,f.input),s=f.sessions.get(session.sessionId);s.status='complete';s.payment_status='paid';s.payment_intent={id:'pi_review',status:'succeeded'};f.env.RESEND_API_KEY='';
    await paymentWebhook(f.event('checkout.session.completed',s,'evt_review_paid'),f.env);
    f.env.RESEND_API_KEY='re_fixture';await auditPayments(f.env);f.env.RESEND_API_KEY='';
    await monitorCheck(f.env,'stripe',true);await monitorCheck(f.env,'webhook',true);
    const id=(await first(f.db,'SELECT id FROM checkout_attempts')).id;
    await paymentLog(f.env,{type:'webhook_error',attemptId:id,dedupe:'review-first'});
    let report=await paymentReport(f.env,new URLSearchParams(),true);const event=report.attention.events[0];
    const review=(eventId,reviewed,extra={})=>worker.fetch(new Request('http://localhost/api/admin/payments/review',{method:'POST',headers:{origin:'http://localhost','content-type':'application/json'},body:JSON.stringify({eventId,reviewed,...extra})}),{...f.env,ENVIRONMENT:'local'});
    assert.equal(report.health,'attention');assert.equal(report.rows[0].status,'successful');assert.ok(report.rows[0].issues.length);
    let response=await review(event.id,true,{reviewedBy:'FORGED_ACTOR'});assert.equal(response.status,200);const saved=await response.json();assert.equal(saved.reviewedBy,'lokalny-vyvojar');assert.ok(saved.reviewedAt);
    assert.deepEqual(await (await review(event.id,true)).json(),saved,'same review is idempotent and retains its original audit time');
    await paymentLog(f.env,{type:'webhook_error',attemptId:id,dedupe:'review-first'});
    await paymentWebhook(f.event('checkout.session.completed',s,'evt_review_paid'),f.env);
    report=await paymentReport(f.env,new URLSearchParams(),true);
    assert.equal(report.health,'observing');assert.equal(report.errors24,0);assert.equal(report.attention.reviewedTotal,1);assert.equal(report.attention.eventTotal,0);assert.equal(report.attention.linkedAttempts24,0);assert.equal(report.rows[0].issues.length,0);assert.equal(report.rows[0].status,'successful');assert.equal(report.rows[0].orderCount,1);
    assert.equal(report.logs.find(l=>l.id===event.id).reviewed_by,'lokalny-vyvojar');
    assert.equal((await paymentReport(f.env,new URLSearchParams({attention:'1'}),true)).matchingTotal,0);
    await paymentLog(f.env,{type:'webhook_error',attemptId:id,dedupe:'review-second'});
    report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.health,'attention');assert.equal(report.errors24,1);assert.equal(report.rows[0].issues[0].count,1,'a new event is never covered by an earlier review');
    assert.equal((await review(event.id,false)).status,200);report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.errors24,2);assert.equal(report.attention.reviewedTotal,0);assert.equal(report.rows[0].issues[0].count,2);
    assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,1);assert.equal((await first(f.db,'SELECT count(*) n FROM customer_credentials')).n,1);
    for(const e of report.attention.events)assert.equal((await review(e.id,true)).status,200);
    assert.equal((await paymentReport(f.env,new URLSearchParams(),false)).health,'attention','review cannot enable unconfigured payments');
    await monitorCheck(f.env,'stripe',false);assert.equal((await paymentReport(f.env,new URLSearchParams(),true)).health,'attention','review cannot override a failed live server check');
    await execute(f.db,'UPDATE payment_log SET created_at=? WHERE id=?',Date.now()-91*86400000,event.id);await prunePaymentLog(f.env);
    assert.equal(await first(f.db,'SELECT * FROM payment_event_reviews WHERE event_id=?',event.id),null,'review follows existing diagnostic retention');
  }finally{f.db.close();}
});
test('review endpoint requires an administrator, same origin, strict event and boolean inputs, and reviewable existing events',async()=>{
  const f=fixture();try{
    await paymentLog(f.env,{type:'sdk_error',dedupe:'unlinked-review'});await paymentLog(f.env,{type:'session_created',dedupe:'not-reviewable'});
    const technical=await first(f.db,"SELECT id FROM payment_log WHERE type='sdk_error'"),lifecycle=await first(f.db,"SELECT id FROM payment_log WHERE type='session_created'");
    const req=(base,input,originHeader=base)=>new Request(base+'/api/admin/payments/review',{method:'POST',headers:{origin:originHeader,'content-type':'application/json'},body:JSON.stringify(input)});
    const value={eventId:technical.id,reviewed:true};
    assert.equal((await worker.fetch(req(origin,value),{...f.env,ADMIN_AUTH_MODE:'password'})).status,401);
    const local={...f.env,ENVIRONMENT:'local'};
    assert.equal((await worker.fetch(req('http://localhost',value,'https://attacker.invalid'),local)).status,403);
    for(const bad of [{...value,eventId:'invalid'},{...value,reviewed:'true'},{...value,eventId:lifecycle.id},{}])assert.equal((await worker.fetch(req('http://localhost',bad),local)).status,400);
    assert.equal((await worker.fetch(req('http://localhost',{...value,eventId:'a'.repeat(64)}),local)).status,404);
    assert.equal((await worker.fetch(req('http://localhost',value),local)).status,200);
    let report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.attention.unlinkedTechnical,0);assert.equal(report.errors24,0);assert.equal(report.attention.reviewedTotal,1);
    assert.equal((await worker.fetch(new Request('http://localhost/api/admin/products',{method:'POST',headers:{origin:'http://localhost'}}),local)).status,405,'the new endpoint does not enable other administrative writes');
    const session=await createCheckout(f.env,f.input),a=await first(f.db,'SELECT id FROM checkout_attempts WHERE stripe_session_id=?',session.sessionId);
    await paymentLog(f.env,{type:'sdk_error',attemptId:a.id,dedupe:'known-error'});const known=await first(f.db,"SELECT id FROM payment_log WHERE attempt_id=? AND type='sdk_error'",a.id);
    assert.equal((await worker.fetch(req('http://localhost',{eventId:known.id,reviewed:true}),local)).status,200);
    report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.rows[0].status,'error','manual review does not relabel a technical failure as payment success');assert.equal(report.rows[0].issues.length,0,'reviewed event does not reappear as a fallback technical warning');
    await paymentLog(f.env,{type:'payment_failed',source:'stripe',attemptId:a.id,dedupe:'bank-review'});
    const bank=await first(f.db,"SELECT id FROM payment_log WHERE type='payment_failed'");
    report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.declines24,1);assert.ok(report.rows[0].issues.some(i=>i.kind==='bank'));
    assert.equal((await worker.fetch(req('http://localhost',{eventId:bank.id,reviewed:true}),local)).status,200);
    report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.declines24,0);assert.ok(!report.rows[0].issues.some(i=>i.kind==='bank'));assert.notEqual(report.rows[0].status,'successful');
  }finally{f.db.close();}
});

test('progress milestones and individual confirmations deduplicate replays, retain retries and never imply payment',async()=>{
 const f=fixture();try{
  await createCheckout(f.env,f.input);
  const send=extra=>browserPaymentEvent(request({}),f.env,{productId:'episode-1',attemptKey:f.input.attemptKey,method:'card',...extra});
  for(const type of ['form_loaded','fields_started','fields_complete','fields_validated','validation_error'])await Promise.all([send({type}),send({type})]);
  const eventId=crypto.randomUUID();await Promise.all([send({type:'confirm_started',eventId}),send({type:'confirm_started',eventId})]);
  const loadId=crypto.randomUUID();await Promise.all([send({type:'form_loaded',eventId:loadId}),send({type:'form_loaded',eventId:loadId})]);
  await send({type:'form_loaded',eventId:crypto.randomUUID()});
  await send({type:'confirm_started',eventId:crypto.randomUUID()});
  await send({type:'confirm_started'}); // a legacy diagnostic has no exact count
  let p=(await paymentReport(f.env,new URLSearchParams(),true)).progress;
  assert.equal(p.cohort,1);assert.equal(p.confirmations,2);
  assert.equal(p.formLoads,2);
  for(const key of ['session','loaded','started','complete','validated','validation','confirmed'])assert.equal(p.counts[key],1,key);
  assert.equal(p.counts.paid,0);assert.equal(p.counts.access,0);assert.equal(p.gaps.paid,1);
  await send({type:'fields_complete',method:'DO_NOT_STORE',card:'4242424242424242',email:'DO_NOT_STORE'});
  const saved=JSON.stringify(await query(f.db,'SELECT * FROM payment_progress'))+JSON.stringify(await query(f.db,'SELECT * FROM payment_confirmations'));
  for(const forbidden of ['424242','DO_NOT_STORE',f.input.attemptKey,f.input.email])assert.ok(!saved.includes(forbidden));
  const row=(await paymentReport(f.env,new URLSearchParams(),true)).rows[0];assert.equal(row.progress.confirmations,2);assert.equal(row.status,'started');
  assert.equal((await worker.fetch(request({...f.input,type:'paid',productId:'episode-1'}),f.env)).status,400);
 }finally{f.db.close();}
});
test('progress uses creation cohorts and current verified results, excludes legacy and separates gifts, free, refund and actual method',async()=>{
 const f=fixture();try{
  const checkout=await createCheckout(f.env,{...f.input,giftGame:true}),s=f.sessions.get(checkout.sessionId);
  const a=await first(f.db,'SELECT id FROM checkout_attempts WHERE stripe_session_id=?',s.id);
  await browserPaymentEvent(request({}),f.env,{type:'confirm_started',eventId:crypto.randomUUID(),productId:'episode-1',method:'apple_pay',attemptKey:f.input.attemptKey});
  let report=await paymentReport(f.env,new URLSearchParams({method:'apple_pay'}),true);assert.equal(report.total,1);assert.equal(report.progress.counts.paid,0);
  s.status='complete';s.payment_status='paid';s.payment_intent={id:'pi_progress',status:'succeeded',latest_charge:{payment_method_details:{type:'card',card:{wallet:{type:'google_pay'}}}}};
  f.env.RESEND_API_KEY='';await paymentWebhook(f.event('checkout.session.completed',s,'evt_progress'),f.env);
  report=await paymentReport(f.env,new URLSearchParams({method:'google_pay'}),true);assert.equal(report.total,1);assert.equal(report.progress.counts.paid,1);assert.equal(report.progress.counts.access,1);assert.equal(report.progress.counts.email,0);assert.equal(report.rows[0].orderCount,2);
  assert.equal((await paymentReport(f.env,new URLSearchParams({method:'apple_pay'}),true)).total,0,'settled method wins');
  await execute(f.db,"UPDATE access_deliveries SET status='sent',sent_at=?",Date.now());
  await execute(f.db,"UPDATE orders SET status='refunded'");
  report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.progress.counts.refunded,1);assert.equal(report.progress.counts.paid,1);assert.equal(report.progress.counts.email,1);
  f.env.RESEND_API_KEY='re_fixture';
  const free=await createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID(),voucherCode:'free'}),z=f.sessions.get(free.sessionId);z.status='complete';z.payment_status='no_payment_required';
  f.env.RESEND_API_KEY='';await paymentWebhook(f.event('checkout.session.completed',z,'evt_progress_free'),f.env);
  f.env.RESEND_API_KEY='re_fixture';
  const legacy=await createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID(),baseId:'story-book-before'});
  const meta=await first(f.db,'SELECT started_at FROM payment_progress_meta');
  await execute(f.db,'UPDATE checkout_attempts SET created_at=? WHERE stripe_session_id=?',meta.started_at-1,legacy.sessionId);
  report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.progress.legacy,1);assert.equal(report.progress.cohort,2);assert.equal(report.progress.counts.free,1);assert.equal(report.progress.payableCohort,1);assert.equal(report.progress.paidRate,1);
  assert.equal((await paymentReport(f.env,new URLSearchParams({paymentProduct:'story-book-before'}),true)).progress.cohort,0);
  for(const input of [{method:'injected'},{paymentProduct:'bad'}])await assert.rejects(()=>paymentReport(f.env,new URLSearchParams(input),true),e=>e.status===400);
  await execute(f.db,'UPDATE payment_confirmations SET created_at=?',Date.now()-91*86400000);await prunePaymentLog(f.env);
  assert.equal((await first(f.db,'SELECT count(*) n FROM payment_confirmations')).n,0);
  assert.equal((await first(f.db,'SELECT confirmation_count n FROM payment_progress WHERE attempt_id=?',a.id)).n,1,'aggregate survives event retention');
 }finally{f.db.close();}
});
test('bounded audit drains more than one batch, reaches old pending attempts and warns about lag',async()=>{
 const f=fixture();try{
  for(let i=0;i<29;i++)await createCheckout(f.env,{...f.input,email:'audit'+i+'@example.invalid',attemptKey:crypto.randomUUID()});
  await execute(f.db,'UPDATE checkout_attempts SET created_at=?',Date.now()-8*86400000);
  for(const s of f.sessions.values())s.status='expired';
  let active=0,maxActive=0,reads=0;const retrieve=f.env.STRIPE_CLIENT.checkout.sessions.retrieve;
  f.env.STRIPE_CLIENT.checkout.sessions.retrieve=async id=>{active++;maxActive=Math.max(maxActive,active);reads++;try{await new Promise(resolve=>setTimeout(resolve,1));return retrieve(id);}finally{active--;}};
  await auditPayments(f.env);let r=await paymentReport(f.env,new URLSearchParams({days:'all'}),true);
  assert.equal(reads,24);assert.ok(maxActive<=4);assert.equal(r.progress.audit.remaining,5);assert.equal(r.health,'stale');
  await auditPayments(f.env);r=await paymentReport(f.env,new URLSearchParams({days:'all'}),true);
  assert.equal(reads,29);assert.equal(r.progress.audit.remaining,0);assert.equal(r.counts.expired,29);assert.equal(r.health,'observing');
 }finally{f.db.close();}
});
