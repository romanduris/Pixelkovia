const assert=require('node:assert/strict');
const {launch,open,cachedPurchase,sessionId}=require('./helpers/inline-checkout.cjs');
(async()=>{const browser=await launch(),cases=[];try{
 for(const wallet of ['apple_pay','google_pay']){
  {
   const t=await open(browser,{wallet});await t.start();let unblock;t.f.statusGate=new Promise(resolve=>{unblock=resolve;});
   await t.page.getByRole('button',{name:'Fixture '+wallet}).click();await t.page.waitForFunction(()=>inlineFixture.calls.length===1);t.f.paid=true;await t.finish();await t.page.waitForFunction(()=>inlineFixture.nativeReturned);
   assert.equal(await t.page.evaluate(()=>inlineFixture.nativeComplete),true);assert.equal(await t.page.evaluate(()=>inlineFixture.destroyed),0);assert.equal(await t.page.evaluate(()=>inlineFixture.calls[0].wallet),wallet);assert.equal(await t.page.evaluate(()=>inlineFixture.calls[0].hasReturnUrl),false);assert.equal(await t.page.evaluate(()=>inlineFixture.walletFailed),0);
   unblock();await t.page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('Platba je potvrdená'));await t.close();cases.push(wallet+': native callback returns before server polling and elements survive');
  }
  {
   const t=await open(browser,{wallet});await t.start();await t.page.clock.install();await t.page.getByRole('button',{name:'Fixture '+wallet}).click();await t.page.clock.runFor(21000);
   assert.match(await t.page.locator('#payment-status').innerText(),/neplaťte znova/);assert.ok(await t.page.locator('#payment-slot').isVisible());assert.ok(await t.page.locator('#express-checkout-slot').isVisible());assert.ok(await t.page.locator('#change-order').isDisabled());assert.equal(await t.page.evaluate(()=>inlineFixture.walletFailed),0);
   t.f.paid=true;await t.finish();await t.page.clock.runFor(50);await t.page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('Platba je potvrdená'));assert.equal(t.f.posts.length,1);await t.close();cases.push(wallet+': slow native confirmation keeps original form alive');
  }
  {
   const t=await open(browser,{wallet});await t.start();await t.page.evaluate(()=>inlineFixture.cancel());assert.match(await t.page.locator('#payment-status').innerText(),/zatvorili/);assert.equal(await t.page.evaluate(()=>inlineFixture.calls.length),0);
   await t.page.getByRole('button',{name:'Fixture '+wallet}).click();await t.page.waitForFunction(()=>inlineFixture.calls.length===1);await t.finish({type:'error',error:{code:'paymentFailed',message:'Platba bola zamietnutá.',paymentFailed:{declineCode:'generic_decline'}}});await t.page.waitForFunction(()=>!document.querySelector('#stripe-pay').disabled);assert.equal(await t.page.evaluate(()=>inlineFixture.walletFailed),1);assert.equal(t.f.posts.length,1);await t.close();cases.push(wallet+': cancel and confirmed decline keep same order');
  }
 }
 {
  const t=await open(browser,{walletAvailable:false});await t.start();assert.ok(await t.page.locator('#express-checkout-slot').isHidden());await t.page.evaluate(()=>inlineFixture.walletAvailability(true));assert.ok(await t.page.locator('#express-checkout-slot').isVisible());await t.close();cases.push('late Stripe wallet availability reveals original wallet slot');
 }
 {
  const t=await open(browser,{createLost:true});await t.page.locator('[name=email]').fill('family@example.invalid');await t.page.locator('.checkout-buy').click();await t.page.locator('#retry-payment').waitFor();await t.page.reload();await t.page.locator('#stripe-pay').waitFor();assert.deepEqual(t.f.posts[0],t.f.posts[1]);await t.close();cases.push('lost create response and refresh retain original exact payload and key');
 }
 for(const createError of [400,403,409,429,500]){
  const t=await open(browser,{createError});await t.page.locator('[name=email]').fill('family@example.invalid');await t.page.locator('.checkout-buy').click();await t.page.locator('#retry-payment').waitFor();assert.equal(await t.page.locator('#payment-status').getAttribute('data-tone'),'error');t.f.createError=0;await t.page.locator('#retry-payment').click();await t.page.locator('#stripe-pay').waitFor();assert.deepEqual(t.f.posts[0],t.f.posts[1]);await t.close();cases.push('HTTP '+createError+' recovers the same inline attempt');
 }
 {
  const t=await open(browser,{purchase:cachedPurchase(),query:'?session_id='+sessionId,state:'pending',statusError:true});await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');assert.match(await t.page.locator('#payment-status').innerText(),/neplaťte znova/);assert.ok(await t.page.locator('#change-order').isDisabled());t.f.statusError=false;t.f.paid=true;await t.page.locator('#check-payment').click();await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');assert.equal(t.f.posts.length,0);await t.close();cases.push('connection loss never marks a payment failed or permits a replacement');
 }
 {
  const t=await open(browser,{purchase:cachedPurchase({phase:'unknown'}),query:'?session_id='+sessionId,state:'pending'});await t.page.waitForFunction(()=>!document.querySelector('#check-payment').disabled,{},{timeout:15000});assert.ok(await t.page.locator('#change-order').isDisabled());assert.ok(await t.page.locator('#check-payment').isEnabled());t.f.paid=true;await t.page.locator('#check-payment').click();await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');await t.close();cases.push('polling stops safely and late success can be checked');
 }
 {
  const t=await open(browser,{purchase:cachedPurchase(),query:'?session_id='+sessionId,state:'ready'});await t.page.locator('#retry-payment').waitFor();await t.page.locator('#retry-payment').click();await t.page.locator('#stripe-pay').waitFor();assert.equal(t.f.posts.length,1);await t.page.reload();await t.page.locator('#retry-payment').waitFor();await t.page.locator('#retry-payment').click();await t.page.locator('#stripe-pay').waitFor();assert.deepEqual(t.f.posts[0],t.f.posts[1]);await t.close();cases.push('unpaid return and refresh restore the same embedded Session');
 }
 {
  const t=await open(browser,{purchase:cachedPurchase({phase:'paid'})});assert.ok(await t.page.locator('.checkout-buy').isEnabled());assert.ok(await t.page.locator('#payment-panel').isHidden());await t.start();assert.equal(t.f.posts.length,1);assert.notEqual(t.f.posts[0].attemptKey,cachedPurchase().attemptKey);assert.equal(t.f.posts[0].newPurchase,undefined);await t.close();cases.push('known paid cache allows a natural repeat purchase without a confirmation wall');
 }
 {
  const t=await open(browser,{purchase:cachedPurchase({phase:'unknown'}),paid:true});await t.page.waitForFunction(()=>!document.querySelector('.checkout-buy').disabled);assert.ok(await t.page.locator('#payment-panel').isHidden());t.f.paid=false;await t.start();assert.notEqual(t.f.posts[0].attemptKey,cachedPurchase().attemptKey);await t.close();cases.push('verified old paid cache clears when returning from the funnel');
 }
 {
  const t=await open(browser,{query:'?product=story-book-before',purchase:cachedPurchase({phase:'paid'})});await t.start();assert.equal(t.f.posts[0].baseId,'story-book-before');assert.equal(t.f.totalCents,499);await t.close();cases.push('book upsell after a game purchase uses the shared inline checkout');
 }
 {
  const old=cachedPurchase();old.input.uiMode='hosted';const t=await open(browser,{purchase:old});await t.page.locator('#stripe-pay').waitFor();assert.equal(t.f.posts.length,2);assert.equal(t.f.releases.length,1);assert.equal(t.f.posts[0].uiMode,'hosted');assert.equal(t.f.posts[1].uiMode,'elements');assert.notEqual(t.f.posts[0].attemptKey,t.f.posts[1].attemptKey);assert.ok(t.page.url().startsWith('https://pixelkovia.rodulab.com'));await t.close();cases.push('old unpaid hosted attempt is safely closed before inline migration');
 }
 {
  const t=await open(browser,{query:'?session_id='+sessionId,paid:true,delivered:false,orderCount:2});await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');assert.match(await t.page.locator('#payment-status').innerText(),/dva samostatné e-maily/);assert.ok(await t.page.locator('#check-payment').isVisible());t.f.delivered=true;await t.page.locator('#check-payment').click();await t.page.waitForFunction(()=>document.querySelector('#check-payment').hidden);await t.close();cases.push('two access emails have their own delivery status after payment');
 }
 for(const state of ['expired','refunded','unknown']){
  const t=await open(browser,{query:'?session_id='+sessionId,denyStorage:true,state});await t.page.waitForFunction(()=>!document.querySelector('#payment-status').textContent.startsWith('Overujeme'));
  if(state==='expired'){await t.page.locator('#change-order').click();await t.page.waitForFunction(()=>!document.querySelector('.checkout-buy').disabled);}
  if(state==='unknown')assert.equal(await t.page.locator('#payment-status').getAttribute('data-tone'),'error');await t.close();cases.push(state+' is handled without granting access');
 }
 {
  const t=await open(browser,{query:'?session_id='+sessionId,paid:true,delivered:true,totalCents:0});await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');assert.match(await t.page.locator('#payment-status').innerText(),/voucherom/);await t.close();cases.push('verified free return shows correct confirmation');
 }
 {
  const old=cachedPurchase({phase:'creating'});delete old.sessionId;old.input.uiMode='hosted';
  const t=await open(browser,{purchase:old});await t.page.locator('#stripe-pay').waitFor();assert.equal(t.f.posts.length,2);assert.equal(t.f.posts[1].uiMode,'elements');assert.equal(t.f.releases.length,1);assert.ok(await t.page.locator('#new-order').isHidden());await t.close();cases.push('the old previous-payment warning cache restores inline without another confirmation wall');
 }
 console.log(JSON.stringify({browser:process.env.QA_BROWSER||'chromium',passed:cases.length,cases},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
