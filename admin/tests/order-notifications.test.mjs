import {test} from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {fresh} from './support.mjs';
import {execute,first,query} from '../src/db.mjs';
import {createCheckout,fulfill,paymentWebhook} from '../src/commerce.mjs';
import {orderNotificationSettings,saveOrderNotificationSettings,sendOrderNotifications,orderNotificationEmail} from '../src/order-notifications.mjs';
import worker from '../src/worker.mjs';

const origin='https://pixelkovia.rodulab.com';
function fixture(){
  const db=fresh(),sessions=new Map(),sdk=new Stripe('sk_test_notification_fixture');let sequence=0;
  const env={TQ_DB:db,PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',CUSTOMER_AUTH_SECRET:'a'.repeat(64),STRIPE_SECRET_KEY:'rk_test_fixture',STRIPE_PUBLISHABLE_KEY:'pk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',RESEND_API_KEY:'fixture',SUPPORT_FORWARD_TO:'owner@example.invalid',STRIPE_CLIENT:{webhooks:sdk.webhooks,checkout:{sessions:{
    async create(input){const id='cs_test_notificationfixture'+(++sequence);const row={...input,id,status:'complete',currency:'eur',livemode:false,amount_total:input.line_items.reduce((n,l)=>n+l.price_data.unit_amount*l.quantity,0),payment_status:'paid',payment_intent:'pi_fixture'+sequence};sessions.set(id,row);return {id,client_secret:'fixture'};},
    async retrieve(id){return sessions.get(id);}
  }}}};
  const input={baseId:'episode-1',books:[],atlasIncluded:true,email:'buyer@example.invalid',newPurchase:true};
  const signed=(session,eventId='evt_notification_fixture')=>{
    const payload=JSON.stringify({id:eventId,type:'checkout.session.completed',data:{object:session}});
    return new Request(origin+'/api/stripe/webhook',{method:'POST',body:payload,headers:{'stripe-signature':sdk.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET})}});
  };
  return {db,env,input,sessions,signed};
}

test('signed verified orders send one Pixi email each, with buyer, amount and a link to the matching game analysis',async()=>{
  const {db,env,input,sessions,signed}=fixture(),original=globalThis.fetch,mails=[];
  globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');mails.push({mail:JSON.parse(options.body),key:options.headers['Idempotency-Key']});return Response.json({id:'sent-'+mails.length});};
  try{
    const checkout=await createCheckout(env,{...input,giftGame:true}),session=sessions.get(checkout.sessionId);
    const invalid=signed(session);invalid.headers.set('stripe-signature','invalid');
    await assert.rejects(()=>paymentWebhook(invalid,env));assert.equal(mails.length,0);
    session.payment_status='unpaid';await paymentWebhook(signed(session,'evt_unpaid'),env);
    assert.equal((await first(db,'SELECT count(*) n FROM order_notifications')).n,0);
    session.payment_status='paid';await paymentWebhook(signed(session),env);
    await paymentWebhook(signed(session),env);await sendOrderNotifications(env);
    const notifications=mails.filter(m=>m.key.startsWith('order-notification/'));
    assert.equal(notifications.length,2);assert.equal(mails.filter(m=>m.key.startsWith('access/')).length,2);
    assert.equal(new Set(notifications.map(m=>m.key)).size,2);
    const attempt=await first(db,'SELECT id FROM checkout_attempts WHERE stripe_session_id=?',session.id);
    for(const {mail} of notifications){
      assert.equal(mail.from,'Pixi · Pixelkovia <Pixi@pixelkovia.rodulab.com>');assert.deepEqual(mail.to,['owner@example.invalid']);
      assert.equal(mail.reply_to,'miky@pixelkovia.rodulab.com');assert.match(mail.subject,/Mám skvelé správy/);
      assert.ok(mail.text.includes(input.email));assert.match(mail.text,/Bratislava/);
      assert.ok(mail.html.includes('/admin#analytics?attempt='+attempt.id));
      assert.ok(!mail.text.includes('Heslo:'));assert.ok(!JSON.stringify(mail).includes('encrypted_message'));
    }
    assert.ok(notifications.some(({mail})=>mail.text.includes('14,99')));assert.ok(notifications.some(({mail})=>mail.text.includes('9,99')));
    assert.ok(notifications.some(({mail})=>mail.text.includes('druhá hra')));
    assert.equal((await first(db,"SELECT count(*) n FROM order_notifications WHERE status='sent'")).n,2);
    assert.ok(!JSON.stringify(await query(db,'SELECT * FROM order_notifications')).includes('owner@example.invalid'));
  }finally{globalThis.fetch=original;db.close();}
});

test('off cancels queued updates, never backfills older orders, and on only queues future verified orders',async()=>{
  const {db,env,input}=fixture(),original=globalThis.fetch;let calls=0;
  globalThis.fetch=async()=>{calls++;return Response.json({id:'sent'});};
  try{
    const firstCheckout=await createCheckout(env,input);await fulfill(env,firstCheckout.sessionId);
    assert.equal((await first(db,'SELECT count(*) n FROM order_notifications')).n,1);
    await saveOrderNotificationSettings(env,{enabled:false});await sendOrderNotifications(env);assert.equal(calls,0);
    assert.equal((await first(db,'SELECT status FROM order_notifications')).status,'skipped');
    const disabledCheckout=await createCheckout(env,input);await fulfill(env,disabledCheckout.sessionId);
    await saveOrderNotificationSettings(env,{enabled:true});await sendOrderNotifications(env);assert.equal(calls,0);
    await fulfill(env,disabledCheckout.sessionId);assert.equal((await first(db,'SELECT count(*) n FROM order_notifications')).n,1);
    const next=await createCheckout(env,input);await fulfill(env,next.sessionId);await sendOrderNotifications(env);assert.equal(calls,1);
  }finally{globalThis.fetch=original;db.close();}
});

test('notification queue is atomic with fulfillment and retries provider failures with the same idempotency key',async()=>{
  const {db,env,input}=fixture(),original=globalThis.fetch,keys=[];let rejected=true;
  globalThis.fetch=async(url,options)=>{keys.push(options.headers['Idempotency-Key']);return rejected?new Response('',{status:503}):Response.json({id:'sent'});};
  try{
    const checkout=await createCheckout(env,input),batch=db.batch.bind(db);let fail=true;
    db.batch=async statements=>batch(fail?(fail=false,[...statements,db.prepare('INSERT INTO missing_fixture_table VALUES(1)')]):statements);
    await assert.rejects(()=>fulfill(env,checkout.sessionId));
    assert.equal((await first(db,'SELECT count(*) n FROM order_notifications')).n,0);assert.equal((await first(db,'SELECT count(*) n FROM orders')).n,0);
    await fulfill(env,checkout.sessionId);
    await Promise.all([sendOrderNotifications(env),sendOrderNotifications(env)]);assert.equal(keys.length,1);
    await sendOrderNotifications(env);assert.equal(keys.length,1);
    await execute(db,'UPDATE order_notifications SET last_attempt_at=0');rejected=false;
    await sendOrderNotifications(env);assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);
    assert.equal((await first(db,'SELECT status FROM order_notifications')).status,'sent');
    const refunded=await createCheckout(env,input);await fulfill(env,refunded.sessionId);
    await execute(db,"UPDATE orders SET status='refunded' WHERE external_reference=?",refunded.sessionId);
    await sendOrderNotifications(env);assert.equal(keys.length,2);
  }finally{globalThis.fetch=original;db.close();}
});

test('settings require admin authentication, same origin and a boolean, and never expose the private recipient',async()=>{
  const {db,env}=fixture();
  const post=(url,body,originHeader=new URL(url).origin)=>new Request(url,{method:'POST',headers:{origin:originHeader,'Content-Type':'application/json'},body:JSON.stringify(body)});
  try{
    const live={...env,ADMIN_AUTH_MODE:'password',ENVIRONMENT:'production'};
    for(const req of [new Request(origin+'/api/admin/notifications'),post(origin+'/api/admin/notifications',{enabled:false})])assert.equal((await worker.fetch(req,live)).status,401);
    const local={...env,ENVIRONMENT:'local'},url='http://127.0.0.1/api/admin/notifications';
    assert.equal((await worker.fetch(post(url,{enabled:false},origin),local)).status,403);
    assert.equal((await worker.fetch(post(url,{enabled:'true'}),local)).status,400);
    const saved=await worker.fetch(post(url,{enabled:false}),local);assert.deepEqual(await saved.json(),{enabled:false,configured:true});
    const read=await worker.fetch(new Request(url),local);assert.deepEqual(await read.json(),{enabled:false,configured:true});
    assert.equal((await worker.fetch(post(url,{enabled:true}),{...local,RESEND_API_KEY:''})).status,503);
    assert.equal((await orderNotificationSettings(env)).enabled,false);
  }finally{db.close();}
});

test('Pixi email escapes buyer data and retains a plain-text alternative',()=>{
  const mail=orderNotificationEmail({total_cents:0,currency:'EUR',paid_at:Date.UTC(2026,10,15,12),email:'<buyer&>@example.invalid',kind:'primary',attempt_id:'fixture'});
  assert.match(mail.html,/&lt;buyer&amp;&gt;@example.invalid/);assert.ok(!mail.html.includes('<buyer&>'));
  assert.match(mail.text,/15\. 11\. 2026/);assert.match(mail.text,/13:00/);assert.match(mail.text,/0,00/);
});
