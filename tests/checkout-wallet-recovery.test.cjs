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
async function walletConfirm(t,wallet='google_pay'){
 await t.page.clock.install();await t.page.getByRole('button',{name:'Fixture '+wallet}).click();await t.page.waitForFunction(()=>inlineFixture.calls.length===1);await t.page.evaluate(()=>window.originalConfirm=inlineFixture.finish);
}
// Give the real Worker/SQLite transport time to answer between virtual-clock
// steps; one 21s jump can spuriously abort healthy fetches in WebKit.
async function advance(t,ms){for(let elapsed=0;elapsed<ms;elapsed+=750){await t.page.clock.runFor(Math.min(750,ms-elapsed));await t.page.waitForTimeout(15);}}
async function recover(t,{cancel=true}={}){
 if(cancel)await t.page.evaluate(()=>inlineFixture.cancel());
 await advance(t,21000);await t.page.waitForFunction(()=>!document.querySelector('#retry-payment').hidden).catch(async error=>{error.message+='; checkout state: '+await t.page.locator('#payment-status').innerText();throw error;});await t.page.locator('#retry-payment').click();
}
async function restored(t){await t.page.waitForFunction(()=>inlineFixture.cardElements===2&&!document.querySelector('#stripe-pay').disabled,{},{timeout:7000});}
async function paid(t,f){const s=[...f.sessions.values()].at(-1);s.status='complete';s.payment_status='paid';await t.finish();await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');}
(async()=>{const browser=await launch(),cases=[];try{
 for(const wallet of ['google_pay','apple_pay']){
  {
   const f=await fixture();let t;try{
    t=await open(browser,{backend:f.backend,wallet});await t.start();await walletConfirm(t,wallet);
    assert.equal(await t.page.evaluate(()=>inlineFixture.walletFailed),0,'authorized confirm must reach Checkout without a click event');await t.page.evaluate(()=>inlineFixture.cancel());await advance(t,10000);
    assert.equal(f.sessions.size,1);assert.equal([...f.sessions.values()][0].status,'open','dismissal after authorization must not expire a live confirmation');assert.ok(await t.page.locator('#retry-payment').isHidden());
    await paid(t,f);assert.equal(f.sessions.size,1);assert.equal(await t.page.evaluate(()=>inlineFixture.walletFailed),0);cases.push(wallet+': supported confirm without click is accepted; post-authorization dismissal preserves payment');
   }finally{if(t)await t.close();f.db.close();}
  }
  {
   const f=await fixture();let t;try{
    t=await open(browser,{backend:f.backend,wallet,walletDelayConfirm:true});await t.start();await t.page.getByRole('button',{name:'Fixture '+wallet}).click();await t.page.evaluate(()=>{inlineFixture.cancel();void inlineFixture.confirmWallet();});
    await t.page.waitForFunction(()=>inlineFixture.calls.length===1);await paid(t,f);assert.equal(await t.page.evaluate(()=>inlineFixture.walletFailed),0);assert.equal(f.sessions.size,1);cases.push(wallet+': valid authorization remains accepted after a dismiss event, without an invented open-state prerequisite');
   }finally{if(t)await t.close();f.db.close();}
  }
  for(const query of ['','?product=story-book-before','?product=story-book-after']){
   const f=await fixture();let t;try{
    t=await open(browser,{backend:f.backend,wallet,query});await t.voucher('1e');await t.start();await walletConfirm(t,wallet);const original=[...f.sessions.values()][0];await recover(t);await restored(t);
    assert.equal(original.status,'expired');assert.equal(f.sessions.size,2);assert.equal([...f.sessions.values()].filter(s=>s.status==='open').length,1);assert.equal(t.f.posts[1].baseId,t.f.posts[0].baseId);assert.equal(t.f.posts[1].voucherCode,'1e');assert.notEqual(t.f.posts[0].attemptKey,t.f.posts[1].attemptKey);
    await t.page.evaluate(()=>originalConfirm({throw:true}));await t.page.clock.runFor(50);assert.ok(await t.page.locator('#stripe-pay').isEnabled());assert.equal(await t.page.locator('#payment-status').getAttribute('data-tone'),'info');
    await t.page.locator('#stripe-pay').click();await t.page.waitForFunction(()=>inlineFixture.calls.length===2);await paid(t,f);assert.equal((await f.db.prepare('SELECT count(*) n FROM orders').first()).n,0);cases.push(wallet+query+': deliberate recovery after unresolved confirmation closes the old Session before card retry');
   }finally{if(t)await t.close();f.db.close();}
  }
 }
 for(const state of ['processing','requires_action']){
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend});await t.start();await walletConfirm(t);const original=[...f.sessions.values()][0];original.payment_intent={id:'pi_fixture',status:state};await t.page.evaluate(()=>inlineFixture.cancel());await advance(t,21000);
   assert.equal(f.sessions.size,1);assert.ok(await t.page.locator('#stripe-pay').isDisabled());assert.ok(await t.page.locator('#retry-payment').isHidden());original.payment_intent.status='succeeded';await paid(t,f);assert.equal(f.sessions.size,1);cases.push(state+': dismissed wallet cannot start a second charge while the bank is active');
  }finally{if(t)await t.close();f.db.close();}
 }
 for(const mode of ['paid','lost','error']){
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend});await t.start();await walletConfirm(t);f.setExpireMode(mode);await recover(t);
   if(mode==='paid'){await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');assert.equal(f.sessions.size,1);}
   else if(mode==='lost'){await restored(t);assert.equal(f.sessions.size,2);assert.equal([...f.sessions.values()][0].status,'expired');}
   else{await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');assert.equal(f.sessions.size,1);assert.ok(await t.page.locator('#stripe-pay').isDisabled());f.setExpireMode('');await t.page.locator('#retry-payment').click();await restored(t);}
   cases.push(mode+': manual recovery verifies the expiry race or connection outcome before replacement');
  }finally{if(t)await t.close();f.db.close();}
 }
 {
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend});await t.start();await walletConfirm(t);f.failRead(true);await t.page.evaluate(()=>inlineFixture.cancel());await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');assert.equal(f.sessions.size,1);
   f.failRead(false);await advance(t,21000);await t.page.locator('#check-payment').click();await t.page.waitForFunction(()=>!document.querySelector('#retry-payment').hidden).catch(async error=>{error.message+='; checkout state: '+await t.page.locator('#payment-status').innerText();throw error;});await t.page.locator('#retry-payment').click();await restored(t);cases.push('status outage keeps the guard until connectivity and an explicit safe recovery');
  }finally{if(t)await t.close();f.db.close();}
 }
 {
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend});await t.start();await walletConfirm(t);f.loseRelease();await recover(t);await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');assert.equal(f.sessions.size,1);assert.equal([...f.sessions.values()][0].status,'expired');
   await t.page.locator('#retry-payment').click();await restored(t);cases.push('lost release reply rechecks the inactive attempt before a new Session');
  }finally{if(t)await t.close();f.db.close();}
 }
 {
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend});await t.start();await walletConfirm(t);const unblock=f.gate();await recover(t);assert.equal(f.sessions.size,1);assert.ok(await t.page.locator('#stripe-pay').isDisabled());
   await t.page.evaluate(()=>originalConfirm({type:'error',error:{code:'paymentFailed',message:'Late failure'}}));unblock();await restored(t);cases.push('late SDK outcome during explicit recovery cannot unlock or overwrite the replacement');
  }finally{if(t)await t.close();f.db.close();}
 }
 {
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend});await t.start();await walletConfirm(t);await recover(t,{cancel:false});await restored(t);assert.equal([...f.sessions.values()][0].status,'expired');cases.push('missing confirmation callback offers explicit, server-verified recovery without silently canceling');
  }finally{if(t)await t.close();f.db.close();}
 }
 {
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend,walletDelayConfirm:true});await t.start();await t.page.clock.install();await t.page.getByRole('button',{name:'Fixture google_pay'}).click();await advance(t,65000);
   await t.page.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));window.dispatchEvent(new StorageEvent('storage',{key:'pixelkovia-checkout-attempt',newValue:'{}'}));void inlineFixture.confirmWallet();});await t.page.waitForFunction(()=>inlineFixture.calls.length===1);await paid(t,f);assert.equal(f.sessions.size,1);assert.equal(await t.page.evaluate(()=>inlineFixture.walletFailed),0);cases.push('long native authorization and app return preserve the original SDK without unsupported click or open timers');
  }finally{if(t)await t.close();f.db.close();}
 }
 {
  const f=await fixture();let t;try{
   t=await open(browser,{backend:f.backend,walletDelayConfirm:true});await t.start();await t.page.locator('#stripe-pay').click();await t.page.waitForFunction(()=>inlineFixture.calls.length===1);await t.page.evaluate(()=>{void inlineFixture.confirmWallet();});assert.equal(await t.page.evaluate(()=>inlineFixture.calls.length),1);await paid(t,f);assert.equal(f.sessions.size,1);cases.push('card and native callbacks serialize through one confirmation on the same Session');
  }finally{if(t)await t.close();f.db.close();}
 }
 console.log(JSON.stringify({browser:process.env.QA_BROWSER||'chromium',passed:cases.length,cases},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
