// Exercise the actual worker + database from two isolated browser contexts.
// Only Stripe transport/fields are fixtures; no live card or email is sent.
const assert=require('node:assert/strict');
const {launch,open}=require('./helpers/inline-checkout.cjs');
async function fixture(){
 const {fresh}=await import('../admin/tests/support.mjs'),{default:worker}=await import('../admin/src/worker.mjs');
 const db=fresh(),sessions=new Map();let expireMode='';
 const env={TQ_DB:db,PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',CUSTOMER_AUTH_SECRET:'a'.repeat(64),STRIPE_SECRET_KEY:'sk_test_device',STRIPE_PUBLISHABLE_KEY:'pk_test_device',STRIPE_WEBHOOK_SECRET:'unused',RESEND_API_KEY:'unused',STRIPE_CLIENT:{checkout:{sessions:{
  async create(input){const id='cs_test_devicefixture'+sessions.size,s={...input,id,client_secret:'fixture',currency:'eur',livemode:false,amount_total:input.line_items.reduce((n,l)=>n+l.price_data.unit_amount,0),status:'open',payment_status:'unpaid',payment_intent:null};sessions.set(id,s);return s;},
  async retrieve(id){return sessions.get(id);},async expire(id){const s=sessions.get(id);if(expireMode==='paid'){s.status='complete';s.payment_status='paid';throw Error('Paid during expiry');}s.status='expired';return s;}
 }}}};
 const backend=req=>worker.fetch(new Request(req.url(),{method:req.method(),headers:{origin:'https://pixelkovia.rodulab.com','content-type':'application/json'},...(['GET','HEAD'].includes(req.method())?{}:{body:req.postData()})}),env);
 return {db,sessions,backend,setExpireMode(mode){expireMode=mode;}};
}
(async()=>{const browser=await launch();try{
 for(const query of ['','?product=story-book-before','?product=story-book-after']){
  const f=await fixture();let desktop,phone;try{
   desktop=await open(browser,{backend:f.backend,width:1360,query});await desktop.voucher('1e');await desktop.start();
   const original=[...f.sessions.values()][0];assert.equal(original.amount_total,100);
   phone=await open(browser,{backend:f.backend,width:390,query});await phone.voucher('1e');await phone.start();
   assert.equal(original.status,'expired');assert.equal(f.sessions.size,2);assert.equal([...f.sessions.values()].filter(s=>s.status==='open').length,1);
   assert.notEqual(desktop.f.posts[0].attemptKey,phone.f.posts[0].attemptKey);assert.ok(await phone.page.locator('#payment-slot').isVisible());
   assert.equal(await phone.page.locator('#stripe-pay').innerText(),'Zaplatiť 1,00 €');
   await phone.page.locator('#stripe-pay').click();await phone.page.waitForFunction(()=>inlineFixture.calls.length===1);
   const current=[...f.sessions.values()].at(-1);current.status='complete';current.payment_status='paid';await phone.finish();await phone.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');
   await desktop.page.reload();await desktop.page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('vypršal bez úhrady'));
   assert.equal((await f.db.prepare('SELECT count(*) n FROM orders').first()).n,0,'only signed fulfillment may create access');
  }finally{if(desktop)await desktop.close();if(phone)await phone.close();f.db.close();}
 }
 for(const race of ['processing','paid']){
  const f=await fixture();let desktop,phone;try{
   desktop=await open(browser,{backend:f.backend,width:1360});await desktop.start();const original=[...f.sessions.values()][0];
   if(race==='processing')original.payment_intent={id:'pi_pending_fixture',status:'processing'};else f.setExpireMode('paid');
   phone=await open(browser,{backend:f.backend,width:390});await phone.page.locator('[name=email]').fill('family@example.invalid');await phone.page.locator('.checkout-buy').click();
   await phone.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');assert.equal(f.sessions.size,1);assert.ok(await phone.page.locator('#payment-slot').isHidden());
   if(race==='processing'){
    assert.match(await phone.page.locator('#payment-status').innerText(),/Predchádzajúca platba sa ešte dokončuje/);assert.equal(await phone.page.locator('#retry-payment').innerText(),'Znova overiť a pokračovať');
    original.payment_intent.status='requires_payment_method';await phone.page.locator('#retry-payment').click();await phone.page.locator('#stripe-pay').waitFor();assert.equal(original.status,'expired');assert.equal(f.sessions.size,2);assert.equal(phone.f.posts[0].attemptKey,phone.f.posts[1].attemptKey);
   }else{assert.match(await phone.page.locator('#payment-status').innerText(),/bola práve potvrdená/);assert.ok(await phone.page.locator('#retry-payment').isHidden());}
  }finally{if(desktop)await desktop.close();if(phone)await phone.close();f.db.close();}
 }
 console.log('PASS: actual worker and DB across desktop/phone, 1 EUR game and both books, stale-form expiry, pending bank recovery and payment winning the race');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
