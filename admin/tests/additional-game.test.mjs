import {test} from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {fresh} from './support.mjs';
import {first,query,execute} from '../src/db.mjs';
import {createCheckout,fulfill,unseal,checkoutStatus,sendPending,paymentWebhook,accessEmail} from '../src/commerce.mjs';
import {customerLogin,customerSession} from '../src/customer-auth.mjs';
import {customerLibrary} from '../src/library-service.mjs';
const origin='https://pixelkovia.rodulab.com',secret='a'.repeat(64);
function fixture(){
 const db=fresh(),sessions=new Map(),sdk=new Stripe('sk_test_fixture');let sequence=0;
 const env={TQ_DB:db,PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',CUSTOMER_AUTH_SECRET:secret,STRIPE_SECRET_KEY:'rk_test_fixture',STRIPE_PUBLISHABLE_KEY:'pk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',RESEND_API_KEY:'re_fixture',STRIPE_CLIENT:{webhooks:sdk.webhooks,checkout:{sessions:{async create(input){const id='cs_test_twogamesfixture'+(++sequence),amount_total=input.line_items.reduce((sum,l)=>sum+l.price_data.unit_amount*l.quantity,0);sessions.set(id,{id,...input,status:'complete',currency:'eur',livemode:false,amount_total,payment_status:amount_total===0?'no_payment_required':'paid',payment_intent:amount_total===0?null:'pi_fixture'+sequence});return {id,client_secret:'fixture'};},async retrieve(id){return sessions.get(id);}}}}};
 const input={baseId:'episode-1',books:['story-book-before','story-book-after'],atlasIncluded:true,giftGame:true,newPurchase:true,email:'two-families@example.invalid'};
 const event=(id,type,object)=>{const payload=JSON.stringify({id,type,data:{object}});return new Request(origin+'/api/stripe/webhook',{method:'POST',body:payload,headers:{'stripe-signature':sdk.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET})}});};
 return {db,env,input,sessions,event};
}
test('additional game has server-owned price, two isolated orders, exact entitlements and independent delivery retries',async()=>{
 const {db,env,input,sessions}=fixture(),oldFetch=globalThis.fetch;
 try{
  for(const giftGame of ['true',1,null])await assert.rejects(()=>createCheckout(env,{...input,giftGame}),e=>e.status===400);
  await assert.rejects(()=>createCheckout(env,{...input,baseId:'story-book-before'}),e=>e.status===400);
  const checkout=await createCheckout(env,{...input,totalCents:1,giftPriceCents:1});
  assert.equal(checkout.totalCents,2997,'client prices cannot change 19.98 + 9.99');
  assert.deepEqual(sessions.get(checkout.sessionId).line_items.map(l=>l.price_data.unit_amount),[1499,249,250,0,999]);
  const order=await fulfill(env,checkout.sessionId);
  assert.equal((await fulfill(env,checkout.sessionId)).id,order.id);
  const orders=await query(db,'SELECT co.kind,o.* FROM checkout_orders co JOIN orders o ON o.id=co.order_id ORDER BY co.kind');
  assert.equal(orders.length,2);assert.equal(orders.find(o=>o.kind==='primary').total_cents,1998);assert.equal(orders.find(o=>o.kind==='gift').total_cents,999);
  assert.equal(orders.reduce((sum,o)=>sum+o.total_cents,0),checkout.totalCents);assert.notEqual(orders[0].customer_id,orders[1].customer_id);
  const deliveries=await query(db,'SELECT co.kind,d.* FROM checkout_orders co JOIN access_deliveries d ON d.order_id=co.order_id ORDER BY co.kind');
  const messages=await Promise.all(deliveries.map(d=>unseal(d.encrypted_message,secret)));
  assert.equal(messages[0].gift,true);assert.equal(messages[1].gift,false);assert.equal(messages[0].email,messages[1].email);assert.notEqual(messages[0].password,messages[1].password);
  assert.deepEqual(messages[0].products,['Hra Pixelkovia – Stratený signál']);assert.equal(messages[1].products.length,4);
  assert.match(accessEmail(messages[0]).text,/môžete preposlať/);assert.ok(!accessEmail(messages[0]).html.includes(messages[1].password));
  for(let i=0;i<orders.length;i++){
   const rights=await query(db,'SELECT product_id FROM entitlements WHERE customer_id=? ORDER BY product_id',orders[i].customer_id);
   assert.equal(rights.length,orders[i].kind==='gift'?1:4);
   if(orders[i].kind==='gift')assert.deepEqual(rights.map(r=>r.product_id),['episode-1']);
   const login=await customerLogin(new Request(origin,{headers:{'CF-Connecting-IP':'192.0.2.'+(i+10)}}),env,{email:input.email,password:messages[i].password});
   const identity=await customerSession(new Request(origin,{headers:{cookie:'__Host-pixelkovia='+login.token}}),env);
   assert.equal(identity.customerId,orders[i].customer_id);
   assert.deepEqual((await customerLibrary(db,identity.customerId)).books.map(b=>b.owned),orders[i].kind==='gift'?[false,false]:[true,true]);
  }
  assert.deepEqual(await checkoutStatus(db,checkout.sessionId),{paid:true,delivered:false,noPaymentRequired:false,orderCount:2});
  const mails=[];let failGift=true;
  globalThis.fetch=async(url,options)=>{
   assert.equal(url,'https://api.resend.com/emails');const mail=JSON.parse(options.body);mails.push(mail);
   assert.deepEqual(mail.to,[input.email]);assert.equal(mail.from,'Piko · Pixelkovia <Piko@pixelkovia.rodulab.com>');
   if(mail.subject.includes('druhá hra')&&failGift)return new Response('',{status:503});
   return Response.json({id:'provider-'+options.headers['Idempotency-Key']});
  };
  await sendPending(env);assert.equal(mails.length,2);assert.notEqual(mails[0].subject,mails[1].subject);
  assert.equal((await checkoutStatus(db,checkout.sessionId)).delivered,false,'one delivered email cannot hide a failed gift email');
  await execute(db,"UPDATE access_deliveries SET last_attempt_at=0 WHERE status='failed'");failGift=false;await sendPending(env);
  assert.equal(mails.length,3,'retry sends only the failed access email');assert.equal((await checkoutStatus(db,checkout.sessionId)).delivered,true);
  assert.equal((await first(db,'SELECT COUNT(*) n FROM access_deliveries WHERE encrypted_message IS NOT NULL')).n,0);
 }finally{globalThis.fetch=oldFetch;db.close();}
});
test('gift orders are atomic and idempotent across signed webhook retries, refunds and the free voucher',async()=>{
 const {db,env,input,sessions,event}=fixture();
 try{
  const checkout=await createCheckout(env,input),session=sessions.get(checkout.sessionId);
  env.RESEND_API_KEY='';
  const realBatch=db.batch.bind(db);let fail=true;
  db.batch=async statements=>{if(fail){fail=false;return realBatch([...statements,db.prepare('INSERT INTO missing_fixture_table VALUES(1)')]);}return realBatch(statements);};
  await assert.rejects(()=>fulfill(env,checkout.sessionId));
  assert.equal((await first(db,'SELECT COUNT(*) n FROM orders')).n,0);assert.equal((await first(db,'SELECT COUNT(*) n FROM customers')).n,0);
  await paymentWebhook(event('evt_two_games','checkout.session.completed',{id:session.id,payment_status:'paid'}),env);
  await paymentWebhook(event('evt_two_games','checkout.session.completed',{id:session.id,payment_status:'paid'}),env);
  await paymentWebhook(event('evt_two_games_retry','checkout.session.completed',{id:session.id,payment_status:'paid'}),env);
  assert.equal((await first(db,'SELECT COUNT(*) n FROM orders')).n,2);
  await paymentWebhook(event('evt_two_games_refund','charge.refunded',{id:'ch_fixture',payment_intent:session.payment_intent,refunded:true}),env);
  assert.equal((await first(db,"SELECT COUNT(*) n FROM orders WHERE status='refunded'")).n,2);
  assert.equal((await checkoutStatus(db,session.id)).paid,false);
  const giftCustomer=await first(db,"SELECT o.customer_id FROM orders o JOIN checkout_orders co ON co.order_id=o.id WHERE co.kind='gift'");
  assert.deepEqual((await customerLibrary(db,giftCustomer.customer_id)).books.map(b=>b.owned),[false,false]);
  env.RESEND_API_KEY='re_fixture';
  const free=await createCheckout(env,{...input,voucherCode:'free'});assert.equal(free.totalCents,0);
  assert.ok(sessions.get(free.sessionId).line_items.every(l=>l.price_data.unit_amount===0));
  await fulfill(env,free.sessionId);assert.equal((await checkoutStatus(db,free.sessionId)).orderCount,2);
  assert.equal((await checkoutStatus(db,free.sessionId)).noPaymentRequired,true);
  const early=await createCheckout(env,input);await execute(db,'INSERT INTO payment_refunds VALUES(?,?)',sessions.get(early.sessionId).payment_intent,Date.now());
  await fulfill(env,early.sessionId);
  assert.equal((await first(db,"SELECT COUNT(*) n FROM orders WHERE status='refunded'")).n,4,'a refund arriving before fulfillment prevents both grants');
  assert.equal((await first(db,'SELECT COUNT(*) n FROM access_deliveries')).n,4,'refunded purchase adds no delivery');
 }finally{db.close();}
});
