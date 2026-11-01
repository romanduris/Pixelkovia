import {test} from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {fresh} from './support.mjs';
import {first,execute,query} from '../src/db.mjs';
import worker from '../src/worker.mjs';
import {createCheckout,verifiedCheckoutStatus,paymentWebhook,fulfill,auditPayments} from '../src/commerce.mjs';
import {paymentReport,paymentLog,browserPaymentEvent,observePayment,monitorCheck,prunePaymentLog} from '../src/payment-monitor.mjs';
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
    assert.equal((await worker.fetch(new Request(origin+'/api/admin/payments'),f.env)).status,403);
    assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,0);
    for(let n=0;n<61;n++)await worker.fetch(request(data),f.env);
    assert.equal((await worker.fetch(request(data),f.env)).status,429);
  }finally{f.db.close();}
});
test('signed failed card and asynchronous events are logged once, without granting access',async()=>{
  const f=fixture();try{
    const session=await createCheckout(f.env,f.input);
    const event=f.event('payment_intent.payment_failed',{id:'pi_monitor',last_payment_error:{code:'card_declined',decline_code:'insufficient_funds',charge:'ch_declined',message:'DO_NOT_STORE'}});
    await paymentWebhook(event.clone(),f.env);await paymentWebhook(event.clone(),f.env);
    const failure=await first(f.db,"SELECT * FROM payment_log WHERE type='payment_failed'");assert.equal(failure.source,'stripe');assert.equal(failure.code,'insufficient_funds');assert.ok(failure.attempt_id);
    assert.equal((await first(f.db,"SELECT count(*) n FROM payment_log WHERE type='payment_failed'")).n,1);
    const invalid=new Request(origin+'/api/stripe/webhook',{method:'POST',body:'{}',headers:{'stripe-signature':'forged'}});await assert.rejects(()=>paymentWebhook(invalid,f.env),e=>e.status===400);
    await paymentWebhook(f.event('checkout.session.async_payment_failed',f.sessions.get(session.sessionId),'evt_async_failure'),f.env);
    assert.equal((await first(f.db,"SELECT count(*) n FROM payment_log WHERE type='payment_failed'")).n,2);
    assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,0);
  }finally{f.db.close();}
});
test('payment report counts a paid gift once, separates free and refund, and flags delayed access',async()=>{
  const f=fixture();try{
    const gift=await createCheckout(f.env,{...f.input,giftGame:true}),s=f.sessions.get(gift.sessionId);
    s.status='complete';s.payment_status='paid';s.payment_intent={id:'pi_monitor_paid',status:'succeeded'};
    await verifiedCheckoutStatus(f.env,s.id);
    await execute(f.db,'UPDATE payment_observations SET paid_at=?',Date.now()-180000);
    let report=await paymentReport(f.env,new URLSearchParams(),true);assert.equal(report.fulfillmentDelayed,1);assert.equal(report.health,'attention');
    await fulfill(f.env,s.id);
    assert.equal((await first(f.db,'SELECT count(*) n FROM orders')).n,2);
    const free=await createCheckout(f.env,{...f.input,attemptKey:crypto.randomUUID(),voucherCode:'free'}),z=f.sessions.get(free.sessionId);z.status='complete';z.payment_status='no_payment_required';
    await verifiedCheckoutStatus(f.env,z.id);await fulfill(f.env,z.id);
    await monitorCheck(f.env,'stripe',true);await monitorCheck(f.env,'webhook',true);
    report=await paymentReport(f.env,new URLSearchParams(),true);
    assert.equal(report.counts.paid,1);assert.equal(report.counts.free,1);assert.equal(report.total,2);assert.equal(report.fulfillmentDelayed,0);assert.ok(report.lastSuccessAt);
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
