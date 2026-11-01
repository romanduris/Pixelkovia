// Native dismissal can leave Stripe's confirm promise unresolved. Exercise the
// browser, real Worker and database together; no real payment or mail is sent.
const assert=require('node:assert/strict');
const {launch,open}=require('./helpers/inline-checkout.cjs');
async function fixture(){
 const {fresh}=await import('../admin/tests/support.mjs'),{default:worker}=await import('../admin/src/worker.mjs');
 const db=fresh(),sessions=new Map();let expireMode='',releaseGate,statusGate,readError=false,loseReleaseResponse=false;
 const env={TQ_DB:db,PAYMENTS_ENABLED:'true',MAIL_DOMAIN_VERIFIED:'true',CUSTOMER_AUTH_SECRET:'a'.repeat(64),STRIPE_SECRET_KEY:'sk_test_wallet',STRIPE_PUBLISHABLE_KEY:'pk_test_wallet',STRIPE_WEBHOOK_SECRET:'unused',RESEND_API_KEY:'unused',STRIPE_CLIENT:{checkout:{sessions:{
  async create(input){const id='cs_test_walletfixture'+sessions.size,s={...input,id,client_secret:'fixture',currency:'eur',livemode:false,amount_total:input.line_items.reduce((n,l)=>n+l.price_data.unit_amount,0),status:'open',payment_status:'unpaid',payment_intent:null};sessions.set(id,s);return s;},
  async retrieve(id){if(readError)throw Error('Provider read failed');return sessions.get(id);},
  async expire(id){if(releaseGate)await releaseGate;const s=sessions.get(id);if(expireMode==='paid'){s.status='complete';s.payment_status='paid';throw Error('Paid during expiry');}if(expireMode==='error')throw Error('Provider connection lost');s.status='expired';if(s.payment_intent)s.payment_intent.status='canceled';if(expireMode==='lost')throw Error('Lost expiry response');return s;}
 }}}};
 const backend=async req=>{if(statusGate&&new URL(req.url()).pathname==='/api/checkout/status')await statusGate;const response=await worker.fetch(new Request(req.url(),{method:req.method(),headers:{origin:'https://pixelkovia.rodulab.com','content-type':'application/json'},...(['GET','HEAD'].includes(req.method())?{}:{body:req.postData()})}),env);if(loseReleaseResponse&&new URL(req.url()).pathname==='/api/checkout/release'){loseReleaseResponse=false;return Response.json({error:'Connection lost'},{status:503});}return response;};
 return {db,sessions,backend,setExpireMode(mode){expireMode=mode;},failRead(value){readError=value;},loseRelease(){loseReleaseResponse=true;},gate(){let resolve;releaseGate=new Promise(r=>resolve=r);return resolve;},gateStatus(){let resolve;statusGate=new Promise(r=>resolve=r);return resolve;}};
}
async function walletConfirm(t,wallet){await t.page.getByRole('button',{name:'Fixture '+wallet}).click();await t.page.waitForFunction(()=>inlineFixture.calls.length===1);await t.page.evaluate(()=>window.originalConfirm=inlineFixture.finish);}
async function restored(t){await t.page.waitForFunction(()=>inlineFixture.cardElements===2&&!document.querySelector('#stripe-pay').disabled,{},{timeout:7000});}
(async()=>{const browser=await launch(),cases=[];try{
 for(const wallet of ['google_pay','apple_pay']){
  for(const query of ['','?product=story-book-before','?product=story-book-after']){
   const f=await fixture();let t;try{
    t=await open(browser,{backend:f.backend,wallet,query});await t.voucher('1e');await t.start();await walletConfirm(t,wallet);const original=[...f.sessions.values()][0];
    await t.page.evaluate(()=>inlineFixture.cancel());await restored(t);
    assert.equal(original.status,'expired');assert.equal(f.sessions.size,2);assert.equal([...f.sessions.values()].filter(s=>s.status==='open').length,1);assert.equal(t.f.posts[1].baseId,t.f.posts[0].baseId);assert.equal(t.f.posts[1].voucherCode,'1e');assert.notEqual(t.f.posts[0].attemptKey,t.f.posts[1].attemptKey);
    await t.page.evaluate(()=>originalConfirm({throw:true}));await t.page.waitForTimeout(50);assert.ok(await t.page.locator('#stripe-pay').isEnabled());assert.equal(await t.page.locator('#payment-status').getAttribute('data-tone'),'info','the abandoned callback cannot overwrite the replacement');
    await t.page.locator('#stripe-pay').click();await t.page.waitForFunction(()=>inlineFixture.calls.length===2);const current=[...f.sessions.values()].at(-1);current.status='complete';current.payment_status='paid';await t.finish();await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');
    assert.equal((await f.db.prepare('SELECT count(*) n FROM orders').first()).n,0,'browser recovery never grants access without a signed webhook');cases.push(wallet+query+': unresolved confirmation dismissed, old Session closed, card retry paid once');
   }finally{if(t)await t.close();f.db.close();}
  }
  {
   const f=await fixture();let t;try{
    t=await open(browser,{backend:f.backend,wallet});await t.start();await walletConfirm(t,wallet);const original=[...f.sessions.values()][0];original.status='complete';original.payment_status='paid';await t.page.evaluate(()=>inlineFixture.cancel());
    await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');assert.equal(f.sessions.size,1);assert.ok(await t.page.locator('#stripe-pay').isHidden());assert.ok(await t.page.locator('#new-order').isVisible());cases.push(wallet+': dismissal after authorization preserves verified paid result');
   }finally{if(t)await t.close();f.db.close();}
  }
 }
 {
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend});await t.start();await walletConfirm(t,'google_pay');f.failRead(true);await t.page.evaluate(()=>inlineFixture.cancel());await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');
   assert.equal(f.sessions.size,1);assert.ok(await t.page.locator('#stripe-pay').isDisabled());f.failRead(false);await t.page.locator('#check-payment').click();await restored(t);assert.equal(f.sessions.size,2);cases.push('status outage keeps the original guard, then recovers safely after connectivity returns');
  }finally{if(t)await t.close();f.db.close();}
 }
 {
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend});await t.start();await walletConfirm(t,'google_pay');f.loseRelease();await t.page.evaluate(()=>inlineFixture.cancel());await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');
   assert.equal(f.sessions.size,1);assert.equal([...f.sessions.values()][0].status,'expired');await t.page.locator('#retry-payment').click();await restored(t);assert.equal(f.sessions.size,2);cases.push('lost HTTP release response rechecks the inactive attempt rather than trusting browser state');
  }finally{if(t)await t.close();f.db.close();}
 }
 for(const state of ['processing','requires_action']){
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend});await t.start();await walletConfirm(t,'google_pay');const original=[...f.sessions.values()][0];original.payment_intent={id:'pi_fixture',status:state};await t.page.evaluate(()=>inlineFixture.cancel());
   await t.page.waitForTimeout(100);assert.equal(f.sessions.size,1);assert.ok(await t.page.locator('#stripe-pay').isDisabled());assert.ok(await t.page.locator('#retry-payment').isHidden());original.status='complete';original.payment_status='paid';original.payment_intent.status='succeeded';
   await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');assert.equal(f.sessions.size,1);cases.push(state+': dismissed wallet cannot start a second charge while the bank is active');
  }finally{if(t)await t.close();f.db.close();}
 }
 for(const mode of ['paid','lost','error']){
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend});await t.start();await walletConfirm(t,'google_pay');f.setExpireMode(mode);await t.page.evaluate(()=>inlineFixture.cancel());
   if(mode==='paid'){await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');assert.equal(f.sessions.size,1);}
   else if(mode==='lost'){await restored(t);assert.equal(f.sessions.size,2);assert.equal([...f.sessions.values()][0].status,'expired');}
   else{await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');assert.equal(f.sessions.size,1);assert.ok(await t.page.locator('#stripe-pay').isDisabled());f.setExpireMode('');await t.page.locator('#retry-payment').click();await restored(t);assert.equal(f.sessions.size,2);}
   cases.push(mode+': expiry race/connection outcome must be verified before any replacement');
  }finally{if(t)await t.close();f.db.close();}
 }
 {
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend});await t.start();await walletConfirm(t,'google_pay');const unblock=f.gate();await t.page.evaluate(()=>inlineFixture.cancel());await t.page.waitForTimeout(100);assert.equal(f.sessions.size,1);assert.ok(await t.page.locator('#stripe-pay').isDisabled());await t.page.evaluate(()=>{originalConfirm({type:'error',error:{code:'paymentFailed',message:'Late failure'}});});unblock();await restored(t);assert.equal(f.sessions.size,2);cases.push('late SDK outcome during expiration cannot unlock or overwrite recovery');
  }finally{if(t)await t.close();f.db.close();}
 }
 for(const stage of ['before-confirm','after-confirm']){
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend,walletDelayConfirm:stage==='before-confirm'});await t.start();await t.page.clock.install();await t.page.getByRole('button',{name:'Fixture google_pay'}).click();
   await t.page.clock.runFor(stage==='before-confirm'?46000:21000);await t.page.waitForFunction(()=>!document.querySelector('#retry-payment').hidden);
   assert.equal(f.sessions.size,1,'a watchdog must not silently cancel a native payment');await t.page.locator('#retry-payment').click();await restored(t);assert.equal(f.sessions.size,2);assert.equal([...f.sessions.values()][0].status,'expired');cases.push(stage+': missing callback offers deliberate, server-verified recovery instead of a permanent lock');
  }finally{if(t)await t.close();f.db.close();}
 }
 {
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend,walletDelayConfirm:true});await t.start();await t.page.clock.install();const unblock=f.gateStatus();await t.page.getByRole('button',{name:'Fixture google_pay'}).click();await t.page.clock.runFor(46000);
   await t.page.evaluate(()=>{void inlineFixture.confirmWallet();});await t.page.waitForFunction(()=>inlineFixture.calls.length===1);const original=[...f.sessions.values()][0];original.status='complete';original.payment_status='paid';await t.finish();unblock();await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');assert.equal(f.sessions.size,1);cases.push('native authorization arriving during slow-status polling is accepted and paid once');
  }finally{if(t)await t.close();f.db.close();}
 }
 {
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend,walletDelayConfirm:true});await t.start();await t.page.getByRole('button',{name:'Fixture google_pay'}).click();await t.page.evaluate(()=>{inlineFixture.cancel();void inlineFixture.confirmWallet();});await t.page.waitForFunction(()=>inlineFixture.nativeReturned);
   assert.equal(await t.page.evaluate(()=>inlineFixture.calls.length),0);assert.ok(await t.page.locator('#stripe-pay').isEnabled());assert.equal(f.sessions.size,1);cases.push('a stale authorization callback after pre-confirmation dismissal cannot charge behind an enabled card form');
  }finally{if(t)await t.close();f.db.close();}
 }
 {
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend});await t.start();await t.page.clock.install();await walletConfirm(t,'google_pay');const original=[...f.sessions.values()][0];original.status='complete';original.payment_status='paid';
   await t.page.clock.runFor(21000);await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');await t.page.evaluate(()=>inlineFixture.cancel());assert.ok(await t.page.locator('#stripe-pay').isHidden());assert.ok(await t.page.locator('#new-order').isVisible());assert.equal(f.sessions.size,1);cases.push('late dismissal after watchdog verified payment releases the finished UI without another charge');
  }finally{if(t)await t.close();f.db.close();}
 }
 console.log(JSON.stringify({browser:process.env.QA_BROWSER||'chromium',passed:cases.length,cases},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
