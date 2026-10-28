import {test} from 'node:test';import assert from 'node:assert/strict';
import {fresh} from './support.mjs';
import {first,execute,hash} from '../src/db.mjs';
import {credentials,customerLogin,customerSession} from '../src/customer-auth.mjs';
import {createCheckout,fulfill,unseal,paymentWebhook,commerceReady,sendPending} from '../src/commerce.mjs';
import {customerLibrary} from '../src/library-service.mjs';
import Stripe from 'stripe';
const secret='a'.repeat(64),origin='https://pixelkovia.rodulab.com';
test('two purchases with the same email get isolated credentials, orders and books; fulfillment retries never duplicate access',async()=>{
  const db=fresh(),email='family@example.invalid';
  const sessions=new Map();let counter=0;
  const env={TQ_DB:db,PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',CUSTOMER_AUTH_SECRET:secret,STRIPE_SECRET_KEY:'rk_live_test_fixture',STRIPE_PUBLISHABLE_KEY:'pk_live_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_test_fixture',RESEND_API_KEY:'re_test_fixture',STRIPE_CLIENT:{checkout:{sessions:{async create(input){const id='cs_live_fixture'+(++counter);sessions.set(id,{id,...input,amount_total:input.line_items.reduce((s,l)=>s+l.price_data.unit_amount,0),currency:'eur',livemode:true,status:'complete',payment_status:'paid',payment_intent:'pi_'+counter});return {id,client_secret:'not-a-real-secret'};},async retrieve(id){return sessions.get(id);}}}}};
  assert.equal(commerceReady(env),true);
  await assert.rejects(()=>createCheckout(env,{baseId:'episode-1',books:[],atlasIncluded:true,email:''}),e=>e.status===400);
  await assert.rejects(()=>createCheckout(env,{baseId:'episode-1',books:[],atlasIncluded:true,email,newPurchase:true,uiMode:'hosted'}),e=>e.status===400);
  const firstPurchase=await createCheckout(env,{baseId:'episode-1',books:['story-book-before'],atlasIncluded:true,uiMode:'elements',email});
  const secondPurchase=await createCheckout(env,{baseId:'episode-1',books:['story-book-after'],atlasIncluded:false,email,newPurchase:true});
  assert.equal(sessions.get(firstPurchase.sessionId).ui_mode,'elements','the compact checkout uses individual Stripe Elements');
  assert.equal(sessions.get(secondPurchase.sessionId).ui_mode,'form','already-open checkout tabs retain a compatible session during deployment');
  assert.equal(sessions.get(firstPurchase.sessionId).payment_method_types,undefined);
  assert.ok(sessions.get(firstPurchase.sessionId).excluded_payment_method_types.includes('bancontact'));
  assert.equal(sessions.get(firstPurchase.sessionId).wallet_options.link.display,'never');
  assert.equal(sessions.get(firstPurchase.sessionId).locale,'sk');
  assert.equal(sessions.get(firstPurchase.sessionId).adaptive_pricing.enabled,false,'the advertised EUR amount has no extra currency decision');
  const order1=await fulfill(env,firstPurchase.sessionId),order2=await fulfill(env,secondPurchase.sessionId);
  assert.equal((await fulfill(env,firstPurchase.sessionId)).id,order1.id);
  assert.equal((await first(db,'SELECT COUNT(*) n FROM customers')).n,2);
  assert.equal((await first(db,'SELECT COUNT(*) n FROM orders')).n,2);
  const d1=await first(db,'SELECT * FROM access_deliveries WHERE order_id=?',order1.id),d2=await first(db,'SELECT * FROM access_deliveries WHERE order_id=?',order2.id);
  const m1=await unseal(d1.encrypted_message,secret),m2=await unseal(d2.encrypted_message,secret);
  assert.notEqual(m1.password,m2.password);assert.ok(!d1.encrypted_message.includes(m1.password));
  const login=await customerLogin(new Request(origin,{headers:{'CF-Connecting-IP':'192.0.2.1'}}),env,{email,password:m1.password});assert.equal(login.status,200);
  const identity=await customerSession(new Request(origin,{headers:{cookie:'__Host-pixelkovia='+login.token}}),env);
  assert.equal(identity.customerId,d1.customer_id);assert.notEqual(identity.customerId,d2.customer_id);
  assert.deepEqual((await customerLibrary(db,identity.customerId)).books.map(b=>b.owned),[true,false]);
  const bad=await customerLogin(new Request(origin),env,{email,password:'wrong-password-value'});assert.equal(bad.status,401);
  const refunded=await createCheckout(env,{baseId:'episode-1',books:[],atlasIncluded:false,email,newPurchase:true});
  await execute(db,'INSERT INTO payment_refunds VALUES(?,?)','pi_3',Date.now());
  const refundedOrder=await fulfill(env,refunded.sessionId);
  assert.equal((await first(db,'SELECT status FROM orders WHERE id=?',refundedOrder.id)).status,'refunded');
  assert.equal(await first(db,'SELECT order_id FROM access_deliveries WHERE order_id=?',refundedOrder.id),null,'a refund arriving before checkout completion cannot deliver access');
  for(const [baseId,books,total]of [['episode-1',[],1499],['episode-1',['story-book-before'],1998],['episode-1',['story-book-before','story-book-after'],1998],['story-book-before',[],499],['story-book-after',[],499],['story-book-before',['story-book-after'],998]]){
    const created=await createCheckout(env,{baseId,books,atlasIncluded:true,email,newPurchase:true});
    assert.equal(created.totalCents,total);assert.equal(sessions.get(created.sessionId).amount_total,total,'Stripe receives the unchanged server-calculated price');
    if(baseId==='episode-1'&&books.length===2){
      assert.deepEqual(sessions.get(created.sessionId).line_items.map(l=>l.price_data.unit_amount),[1499,249,250,0],'bundle savings belong to the books, matching the checkout');
      const order=await fulfill(env,created.sessionId);
      assert.equal((await first(db,"SELECT unit_price_cents n FROM order_items WHERE order_id=? AND product_id='episode-1'",order.id)).n,1499);
      assert.equal((await first(db,"SELECT SUM(unit_price_cents) n FROM order_items WHERE order_id=? AND product_id LIKE 'story-book-%'",order.id)).n,499);
    }
  }
  const legacy=await createCheckout(env,{baseId:'episode-1',books:['story-book-before','story-book-after'],atlasIncluded:true,email,newPurchase:true});
  await execute(db,'UPDATE checkout_attempts SET item_prices=NULL,total_cents=1999 WHERE stripe_session_id=?',legacy.sessionId);
  sessions.get(legacy.sessionId).amount_total=1999;
  sessions.get(legacy.sessionId).line_items.forEach((line,i)=>line.price_data.unit_amount=[1001,499,499,0][i]);
  const legacyOrder=await fulfill(env,legacy.sessionId);
  assert.equal((await first(db,"SELECT unit_price_cents n FROM order_items WHERE order_id=? AND product_id='episode-1'",legacyOrder.id)).n,1001,'an already-open older checkout keeps its original item prices');
  const previousBundle=await createCheckout(env,{baseId:'episode-1',books:['story-book-before','story-book-after'],atlasIncluded:true,email,newPurchase:true});
  const previousPrices={'episode-1':1499,'story-book-before':250,'story-book-after':250,'atlas-pixelkov':0};
  await execute(db,'UPDATE checkout_attempts SET item_prices=?,total_cents=1999 WHERE stripe_session_id=?',JSON.stringify(previousPrices),previousBundle.sessionId);
  sessions.get(previousBundle.sessionId).amount_total=1999;
  const previousOrder=await fulfill(env,previousBundle.sessionId);
  assert.equal((await first(db,'SELECT total_cents FROM orders WHERE id=?',previousOrder.id)).total_cents,1999,'an already-open 19.99 checkout keeps its saved price after the new half-price offer');
  assert.equal((await first(db,"SELECT SUM(unit_price_cents) n FROM order_items WHERE order_id=? AND product_id LIKE 'story-book-%'",previousOrder.id)).n,500);
  const originalFetch=globalThis.fetch;
  try{globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');const mail=JSON.parse(options.body);assert.equal(mail.from,'Piko · Pixelkovia <Piko@pixelkovia.rodulab.com>');assert.equal(mail.reply_to,'miky@pixelkovia.rodulab.com');assert.ok(mail.text.includes('/Supervisor'));assert.ok(mail.text.endsWith('Piko · Pixelkovia'));assert.ok(mail.html.includes('<p>Piko · Pixelkovia</p>'));return Response.json({id:'provider-'+options.headers['Idempotency-Key']});};await sendPending(env);assert.equal((await first(db,'SELECT status FROM access_deliveries WHERE order_id=?',order1.id)).status,'sent');assert.equal((await first(db,'SELECT encrypted_message FROM access_deliveries WHERE order_id=?',order1.id)).encrypted_message,null);}finally{globalThis.fetch=originalFetch;db.close();}
});
test('failed or forged payment notifications cannot grant access; unsigned webhook is rejected',async()=>{
  const db=fresh(),env={TQ_DB:db,STRIPE_SECRET_KEY:'rk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture'};
  await assert.rejects(()=>paymentWebhook(new Request(origin+'/api/stripe/webhook',{method:'POST',body:JSON.stringify({type:'checkout.session.completed',data:{object:{payment_status:'paid'}}}),headers:{'stripe-signature':'forged'}}),env),e=>e.status===400);
  assert.equal((await first(db,'SELECT COUNT(*) n FROM orders')).n,0);db.close();
});
test('free voucher is server-owned and fulfills only a verified completed zero-cost Stripe Session',async()=>{
 const db=fresh(),sessions=new Map();let counter=0;
 const sdk=new Stripe('sk_test_fixture');
 const env={TQ_DB:db,PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',CUSTOMER_AUTH_SECRET:secret,STRIPE_SECRET_KEY:'rk_test_fixture',STRIPE_PUBLISHABLE_KEY:'pk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',RESEND_API_KEY:'re_fixture',STRIPE_CLIENT:{webhooks:sdk.webhooks,checkout:{sessions:{async create(input){const id='cs_test_voucherfixture'+(++counter);sessions.set(id,{id,...input,status:'open',amount_total:input.line_items.reduce((s,l)=>s+l.price_data.unit_amount,0),currency:'eur',livemode:false,payment_status:'no_payment_required',payment_intent:null});return {id,client_secret:'fixture'};},async retrieve(id){return sessions.get(id);}}}}};
 const input={baseId:'episode-1',books:['story-book-before','story-book-after'],atlasIncluded:true,email:'voucher@example.invalid',newPurchase:true,voucherCode:' FREE '};
 try{
  for(const voucherCode of ['unknown',{},'x'.repeat(65)])await assert.rejects(()=>createCheckout(env,{...input,voucherCode}),e=>e.status===400);
  assert.equal((await first(db,'SELECT COUNT(*) n FROM checkout_attempts')).n,0);
  const a=await createCheckout(env,input),session=sessions.get(a.sessionId);
  assert.equal(a.totalCents,0);assert.ok(session.line_items.every(l=>l.price_data.unit_amount===0));
  const attempt=await first(db,'SELECT * FROM checkout_attempts WHERE stripe_session_id=?',a.sessionId);
  assert.equal(attempt.voucher_code,'free');assert.equal(attempt.total_cents,0);
  assert.equal(await fulfill(env,a.sessionId),null,'an open zero-cost session grants no access');
  session.status='complete';session.payment_status='unpaid';
  assert.equal(await fulfill(env,a.sessionId),null,'an unpaid session grants no access');
  session.payment_status='no_payment_required';session.metadata.voucher_code='forged';
  await assert.rejects(()=>fulfill(env,a.sessionId),e=>e.status===400);
  session.metadata.voucher_code='free';session.currency='usd';
  await assert.rejects(()=>fulfill(env,a.sessionId),e=>e.status===400);
  session.currency='eur';
  const payload=JSON.stringify({id:'evt_free_fixture',type:'checkout.session.completed',data:{object:{id:a.sessionId,payment_status:'no_payment_required'}}});
  const signature=sdk.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET});
  env.RESEND_API_KEY=''; // Keep the encrypted delivery queued; never contact a mail provider.
  const request=()=>new Request(origin+'/api/stripe/webhook',{method:'POST',body:payload,headers:{'stripe-signature':signature}});
  await paymentWebhook(request(),env);await paymentWebhook(request(),env);
  const order=await first(db,'SELECT * FROM orders WHERE external_reference=?',a.sessionId);
  assert.equal(order.total_cents,0);assert.equal(order.status,'paid');
  assert.equal((await first(db,'SELECT COUNT(*) n FROM entitlements WHERE customer_id=?',order.customer_id)).n,4);
  assert.equal((await first(db,'SELECT SUM(unit_price_cents) n FROM order_items WHERE order_id=?',order.id)).n,0);
  assert.equal((await first(db,'SELECT COUNT(*) n FROM orders')).n,1,'duplicate notifications never create another order');
  const firstDelivery=await first(db,'SELECT * FROM access_deliveries WHERE order_id=?',order.id);
  assert.ok(firstDelivery.encrypted_message);assert.equal(firstDelivery.status,'queued');
  env.RESEND_API_KEY='re_fixture';
  const b=await createCheckout(env,input);sessions.get(b.sessionId).status='complete';
  const second=await fulfill(env,b.sessionId),secondDelivery=await first(db,'SELECT * FROM access_deliveries WHERE order_id=?',second.id);
  assert.notEqual(firstDelivery.customer_id,secondDelivery.customer_id);
  assert.notEqual((await unseal(firstDelivery.encrypted_message,secret)).password,(await unseal(secondDelivery.encrypted_message,secret)).password);
  const paid=await createCheckout(env,{...input,voucherCode:''});assert.equal(paid.totalCents,1998);
  const forged=sessions.get(paid.sessionId);forged.status='complete';forged.amount_total=0;forged.metadata.voucher_code='free';
  await assert.rejects(()=>fulfill(env,paid.sessionId),e=>e.status===400,'a forged zero cannot replace a priced attempt');
  assert.equal((await first(db,'SELECT COUNT(*) n FROM orders')).n,2);
  for(const baseId of ['story-book-before','story-book-after']){
   const book=await createCheckout(env,{...input,baseId,email:baseId+'@example.invalid',books:[],voucherCode:'free'});
   assert.equal(book.totalCents,0);assert.equal(sessions.get(book.sessionId).line_items.length,2);
  }
 }finally{db.close();}
});
