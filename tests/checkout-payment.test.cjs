const assert=require('node:assert/strict');
const {launch,open}=require('./helpers/inline-checkout.cjs');
(async()=>{const browser=await launch(),cases=[];try{
 for(const width of [360,390,430,1360]){
  const t=await open(browser,{width}),{page,f}=t;
  await page.locator('.checkout-buy').click();assert.equal(f.posts.length,0);assert.match(await page.locator('#email-error').innerText(),/Zadajte e-mail/);
  await page.locator('#customer-email').fill('bad@address');await page.locator('.checkout-buy').click();assert.equal(f.posts.length,0);
  await page.locator('#select-bundle').check();assert.equal(await page.locator('#order-total').innerText(),'19,98 €');await page.locator('#addon-gift-game').check();assert.equal(await page.locator('#order-total').innerText(),'29,97 €');
  await t.start();assert.equal(f.posts.length,1);assert.equal(f.posts[0].uiMode,'elements');assert.ok(page.url().startsWith('https://pixelkovia.rodulab.com/checkout'));
  assert.ok(await page.locator('.summary-inner #payment-panel #payment-slot').isVisible());assert.ok(await page.locator('.checkout-buy').isHidden());assert.ok(await page.locator('#change-order').isEnabled());
  assert.equal(await page.locator('#stripe-pay').innerText(),'Zaplatiť 29,97 €');assert.equal(await page.evaluate(()=>inlineFixture.init.elementsOptions.appearance.theme),'night');assert.equal(await page.evaluate(()=>inlineFixture.init.defaultValues.billingAddress.address.country),'SK');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#stripe-pay').evaluate(el=>{el.click();el.click();});await page.waitForFunction(()=>inlineFixture.calls.length===1);assert.equal(await page.evaluate(()=>inlineFixture.calls[0].hasReturnUrl),false);
  f.paid=true;await t.finish();await page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('Platba je potvrdená'));await t.close();cases.push(width+'px: original integrated layout, prices, email, single confirmation');
 }
 for(const [baseId,books,gift,voucher,total]of [
  ['episode-1',false,false,'',1499],['episode-1',true,false,'',1998],['episode-1',false,true,'',2498],['episode-1',true,true,'',2997],['story-book-before',false,false,'',499],['story-book-after',true,false,'',998],['episode-1',true,true,'free',0],['episode-1',true,true,'1e',100]
 ]){
  const t=await open(browser,{query:baseId==='episode-1'?'':'?product='+baseId});if(books)await t.page.locator(baseId==='episode-1'?'#select-bundle':'input[name=book]').check();if(gift)await t.page.locator('#addon-gift-game').check();if(voucher)await t.voucher(voucher);await t.start();assert.equal(t.f.totalCents,total);assert.equal(await t.page.evaluate(()=>inlineFixture.cardElements),total===0?0:1);await t.close();cases.push(baseId+' '+total+' cents inline');
 }
 {
  const t=await open(browser,{validationError:true});await t.start();await t.page.locator('#stripe-pay').click();await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');assert.match(await t.page.locator('#payment-status').innerText(),/neúplné/);assert.ok(await t.page.locator('#payment-slot').isVisible());assert.ok(await t.page.locator('#stripe-pay').isEnabled());assert.equal(await t.page.evaluate(()=>inlineFixture.calls.length),0);assert.equal(t.f.reads,0);
  await t.page.evaluate(()=>inlineFixture.validationError=false);await t.page.locator('#stripe-pay').click();await t.page.waitForFunction(()=>inlineFixture.calls.length===1);assert.equal(t.f.posts.length,1);await t.close();cases.push('real Checkout validation shape keeps fields editable and never confirms invalid data');
 }
 {
  const t=await open(browser);await t.start();await t.page.locator('#stripe-pay').click();await t.page.waitForFunction(()=>inlineFixture.calls.length===1);await t.finish({type:'error',error:{code:'paymentFailed',message:'Karta bola zamietnutá.',paymentFailed:{declineCode:'generic_decline'}}});await t.page.waitForFunction(()=>!document.querySelector('#stripe-pay').disabled);assert.ok(await t.page.locator('#payment-slot').isVisible());assert.match(await t.page.locator('#payment-status').innerText(),/zamietnutá/);await t.page.locator('#stripe-pay').click();await t.page.waitForFunction(()=>inlineFixture.calls.length===2);assert.equal(t.f.posts.length,1);await t.close();cases.push('documented paymentFailed permits a deliberate retry in the same form');
 }
 for(const kind of ['returned-error','thrown-error']){
  const t=await open(browser);await t.start();await t.page.locator('#stripe-pay').click();await t.page.waitForFunction(()=>inlineFixture.calls.length===1);await t.finish(kind==='thrown-error'?{throw:true}:{type:'error',error:{code:null,message:'Unknown result'}});await t.page.waitForFunction(()=>!document.querySelector('#stripe-pay').disabled);assert.ok(await t.page.locator('#payment-slot').isVisible());assert.ok(t.f.reads>0);assert.equal(t.f.posts.length,1);await t.close();cases.push(kind+' requires server verification before retry');
 }
 for(const option of ['cardLoadError','loadError','wrongTotal']){
  const t=await open(browser,{[option]:true});await t.page.locator('[name=email]').fill('family@example.invalid');await t.page.locator('.checkout-buy').click();await t.page.locator('#retry-payment').waitFor();assert.equal(await t.page.locator('#payment-status').getAttribute('data-tone'),'error');await t.page.evaluate(option=>inlineFixture[option]=false,option);await t.page.locator('#retry-payment').click();await t.page.waitForFunction(()=>!document.querySelector('#stripe-pay').hidden&&!document.querySelector('#stripe-pay').disabled);assert.deepEqual(t.f.posts[0],t.f.posts[1]);await t.close();cases.push(option+' recovers the original attempt');
 }
 {
  const t=await open(browser,{enabled:false});assert.ok(await t.page.locator('.checkout-buy').isDisabled());assert.equal(t.f.posts.length,0);await t.close();cases.push('disabled commerce never creates a Session');
 }
 console.log(JSON.stringify({browser:process.env.QA_BROWSER||'chromium',passed:cases.length,cases},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
