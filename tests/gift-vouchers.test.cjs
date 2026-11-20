// Real Worker/D1 checkout, with isolated Stripe transport and fields.
const assert=require('node:assert/strict');
const {launch,open}=require('./helpers/inline-checkout.cjs');
async function fixture(){
 const {fresh}=await import('../admin/tests/support.mjs'),{default:worker}=await import('../admin/src/worker.mjs');
 const db=fresh(),sessions=new Map();
 const env={TQ_DB:db,PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',CUSTOMER_AUTH_SECRET:'a'.repeat(64),STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_PUBLISHABLE_KEY:'pk_test_fixture',STRIPE_WEBHOOK_SECRET:'fixture',RESEND_API_KEY:'fixture',STRIPE_CLIENT:{checkout:{sessions:{
  async create(input){const s={...input,id:'cs_test_vouchertest'+sessions.size,client_secret:'fixture',amount_total:input.line_items.reduce((n,l)=>n+l.price_data.unit_amount,0),currency:'eur',livemode:false,status:'open',payment_status:'no_payment_required',payment_intent:null};sessions.set(s.id,s);return s;},
  async retrieve(id){return sessions.get(id);},async expire(id){const s=sessions.get(id);s.status='expired';return s;}
 }}}};
 return {db,env,sessions,backend:req=>worker.fetch(new Request(req.url(),{method:req.method(),headers:{origin:'https://pixelkovia.rodulab.com','content-type':'application/json'},...(['GET','HEAD'].includes(req.method())?{}:{body:req.postData()})}),env)};
}
(async()=>{const browser=await launch();try{
 for(const width of [390,1360]){
  const f=await fixture();let first,other;
  try{
   first=await open(browser,{width,backend:f.backend});
   await first.voucher(' KoVo ');await first.page.waitForFunction(()=>!document.querySelector('#voucher-dialog').open);
   await first.page.locator('#select-bundle').check();await first.page.locator('#addon-gift-game').check();
   assert.equal(await first.page.locator('#order-total').innerText(),'0,00 €');
   assert.ok(await first.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await first.page.screenshot({path:'/tmp/pixelkovia-gift-checkout-'+width+'-'+(process.env.QA_BROWSER||'chromium')+'.png',fullPage:true});
   await first.start();assert.equal(first.f.totalCents,0);assert.equal(await first.page.evaluate(()=>inlineFixture.cardElements),0);
   assert.match(await first.page.locator('#stripe-pay').innerText(),/zdarma/);
   other=await open(browser,{width:390,backend:f.backend});await other.voucher('KOVO');await other.page.waitForFunction(()=>!document.querySelector('#voucher-dialog').open);
   await other.page.locator('[name=email]').fill('other@example.invalid');await other.page.locator('.checkout-buy').click();
   await other.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');
   assert.match(await other.page.locator('#payment-status').innerText(),/poukaz už bol použitý|práve uplatňuje/);assert.equal(f.sessions.size,1);
   await first.page.locator('#stripe-pay').click();await first.page.waitForFunction(()=>inlineFixture.calls.length===1);
   const session=[...f.sessions.values()][0];session.status='complete';await first.finish();
   await first.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');
   const {fulfill}=await import('../admin/src/commerce.mjs');await fulfill(f.env,session.id);
   await other.page.locator('#change-order').click();await other.voucher('KOVO');
   await other.page.waitForFunction(()=>!document.querySelector('#voucher-error').hidden);
   assert.match(await other.page.locator('#voucher-error').innerText(),/poukaz už bol použitý/);
   assert.equal((await f.db.prepare('SELECT count(*) n FROM orders').first()).n,2);
  }finally{if(first)await first.close();if(other)await other.close();f.db.close();}
 }
 for(const width of [390,1360]){
  const f=await fixture();let first,other;
  try{
   first=await open(browser,{width,backend:f.backend});
   await first.voucher(' LiNhY ');await first.page.waitForFunction(()=>!document.querySelector('#voucher-dialog').open);
   assert.equal(await first.page.locator('#order-total').innerText(),'1,00 €');
   assert.match(await first.page.locator('#summary-voucher').innerText(),/nákup za 1,00 €/);
   await first.page.screenshot({path:'/tmp/pixelkovia-linhy-'+width+'-'+(process.env.QA_BROWSER||'chromium')+'.png',fullPage:true});
   await first.start();assert.equal(first.f.totalCents,100);assert.equal(await first.page.evaluate(()=>inlineFixture.cardElements),1);
   const session=[...f.sessions.values()][0];session.status='complete';session.payment_status='paid';
   const {fulfill}=await import('../admin/src/commerce.mjs');f.env.RESEND_API_KEY='';await fulfill(f.env,session.id);
   other=await open(browser,{width:390,backend:f.backend});await other.voucher('linhy');
   await other.page.waitForFunction(()=>!document.querySelector('#voucher-error').hidden);
   assert.match(await other.page.locator('#voucher-error').innerText(),/poukaz už bol použitý/);
   assert.equal(f.sessions.size,1);
  }finally{if(first)await first.close();if(other)await other.close();f.db.close();}
 }
 console.log('Gift checkout passed on '+(process.env.QA_BROWSER||'chromium')+': mobile/desktop, all add-ons, zero card fields, competing device and spent-code rejection.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
