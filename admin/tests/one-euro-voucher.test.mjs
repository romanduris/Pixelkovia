import {test} from 'node:test';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
import {fresh} from './support.mjs';
import {first,query} from '../src/db.mjs';
import {createCheckout,fulfill,paymentWebhook,unseal} from '../src/commerce.mjs';

const origin='https://pixelkovia.rodulab.com',secret='a'.repeat(64);
function fixture(){
  const db=fresh(),sessions=new Map(),sdk=new Stripe('sk_test_fixture');let sequence=0;
  const env={TQ_DB:db,PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',CUSTOMER_AUTH_SECRET:secret,STRIPE_SECRET_KEY:'rk_test_fixture',STRIPE_PUBLISHABLE_KEY:'pk_test_fixture',STRIPE_WEBHOOK_SECRET:'whsec_fixture',RESEND_API_KEY:'re_fixture',STRIPE_CLIENT:{webhooks:sdk.webhooks,checkout:{sessions:{async create(input){
    const id='cs_test_oneeuro'+(++sequence);
    assert.ok(input.line_items.every(l=>Number.isInteger(l.price_data.unit_amount)&&l.price_data.unit_amount>=0),'Stripe receives whole nonnegative cents');
    sessions.set(id,{id,...input,status:'open',currency:'eur',livemode:false,amount_total:input.line_items.reduce((sum,l)=>sum+l.price_data.unit_amount*l.quantity,0),payment_status:'unpaid',payment_intent:'pi_oneeuro'+sequence});
    return {id,client_secret:'fixture'};
  },async retrieve(id){return sessions.get(id);}}}}};
  const input={baseId:'episode-1',books:['story-book-before','story-book-after'],atlasIncluded:true,giftGame:true,email:'oneeuro@example.invalid',voucherCode:' 1E '};
  const event=(id,type,object)=>{const payload=JSON.stringify({id,type,data:{object}});return new Request(origin+'/api/stripe/webhook',{method:'POST',body:payload,headers:{'stripe-signature':sdk.webhooks.generateTestHeaderString({payload,secret:env.STRIPE_WEBHOOK_SECRET})}});};
  return {db,env,input,sessions,event};
}

test('1e sets every selectable cart to exactly one euro with exact Stripe item and order allocations',async()=>{
  const {db,env,input,sessions}=fixture();
  try{
    for(const baseId of ['episode-1','story-book-before','story-book-after'])for(let mask=0;mask<4;mask++)for(const atlasIncluded of [true,false])for(const giftGame of baseId==='episode-1'?[true,false]:[false]){
      const books=['story-book-before','story-book-after'].filter((_,i)=>mask&(1<<i));
      const checkout=await createCheckout(env,{...input,baseId,books,atlasIncluded,giftGame,totalCents:1,giftPriceCents:1});
      const session=sessions.get(checkout.sessionId),attempt=await first(db,'SELECT * FROM checkout_attempts WHERE stripe_session_id=?',checkout.sessionId);
      assert.equal(checkout.totalCents,100);assert.equal(session.amount_total,100);
      assert.equal(session.metadata.voucher_code,'1e');assert.equal(attempt.fixed_total_voucher,'1e');assert.equal(attempt.voucher_code,null);
      const prices=Object.values(JSON.parse(attempt.item_prices));
      assert.ok(prices.every(n=>Number.isInteger(n)&&n>=0));assert.equal(prices.reduce((sum,n)=>sum+n,0)+attempt.gift_price_cents,100);
      if(atlasIncluded)assert.equal(JSON.parse(attempt.item_prices)['atlas-pixelkov'],0);
      assert.equal(attempt.gift_price_cents>0,giftGame);
    }
    assert.equal((await first(db,'SELECT COUNT(*) n FROM orders')).n,0,'creating a discounted session never grants access');
    await assert.rejects(()=>createCheckout({...env,PAYMENTS_ENABLED:'false'},input),e=>e.status===503);
  }finally{db.close();}
});

test('1e requires a verified paid euro, fulfills two isolated accounts once and refunds both',async()=>{
  const {db,env,input,sessions,event}=fixture();
  try{
    const checkout=await createCheckout(env,input),session=sessions.get(checkout.sessionId);
    assert.deepEqual(session.line_items.map(l=>l.price_data.unit_amount),[50,8,9,0,33]);
    assert.equal(await fulfill(env,session.id),null);
    session.status='complete';session.payment_status='no_payment_required';assert.equal(await fulfill(env,session.id),null,'1e is a paid order, never a free-voucher exception');
    session.payment_status='paid';session.metadata.voucher_code='free';await assert.rejects(()=>fulfill(env,session.id),e=>e.status===400);
    session.metadata.voucher_code='1e';session.amount_total=0;await assert.rejects(()=>fulfill(env,session.id),e=>e.status===400);
    session.amount_total=100;session.status='open';await assert.rejects(()=>fulfill(env,session.id),e=>e.status===400);
    session.status='complete';session.currency='usd';await assert.rejects(()=>fulfill(env,session.id),e=>e.status===400);session.currency='eur';
    assert.equal((await first(db,'SELECT COUNT(*) n FROM orders')).n,0);
    await assert.rejects(()=>paymentWebhook(new Request(origin+'/api/stripe/webhook',{method:'POST',body:'{}',headers:{'stripe-signature':'forged'}}),env),e=>e.status===400);
    env.RESEND_API_KEY=''; // Never send live mail; inspect the encrypted queue instead.
    for(const id of ['evt_oneeuro','evt_oneeuro','evt_oneeuro_retry'])await paymentWebhook(event(id,'checkout.session.completed',{id:session.id,payment_status:'paid'}),env);
    const orders=await query(db,'SELECT co.kind,o.* FROM checkout_orders co JOIN orders o ON o.id=co.order_id ORDER BY co.kind');
    assert.equal(orders.length,2);assert.equal(orders.reduce((sum,o)=>sum+o.total_cents,0),100);
    assert.deepEqual(orders.map(o=>o.total_cents),[33,67]);assert.notEqual(orders[0].customer_id,orders[1].customer_id);
    const passwords=[];
    for(const order of orders){
      const items=await query(db,'SELECT product_id,unit_price_cents FROM order_items WHERE order_id=?',order.id);
      assert.equal(items.reduce((sum,item)=>sum+item.unit_price_cents,0),order.total_cents);
      assert.equal(items.length,order.kind==='gift'?1:4);
      const delivery=await first(db,'SELECT encrypted_message FROM access_deliveries WHERE order_id=?',order.id);
      passwords.push((await unseal(delivery.encrypted_message,secret)).password);
    }
    assert.notEqual(passwords[0],passwords[1]);
    await paymentWebhook(event('evt_oneeuro_refund','charge.refunded',{id:'ch_oneeuro',payment_intent:session.payment_intent,refunded:true}),env);
    assert.equal((await first(db,"SELECT COUNT(*) n FROM orders WHERE status='refunded'")).n,2);
  }finally{db.close();}
});
