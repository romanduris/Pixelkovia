const assert=require('node:assert/strict');
const {launch,open,checkoutUrl}=require('./helpers/hosted-checkout.cjs');
(async()=>{const browser=await launch(),cases=[];try{
 for(const width of [360,390,430,1360]){
  const t=await open(browser,{width}),{page,f}=t;
  await page.locator('.checkout-buy').click();assert.equal(f.posts.length,0);
  assert.match(await page.locator('#email-error').innerText(),/Zadajte e-mail/);assert.equal(await page.locator('#customer-email').getAttribute('aria-invalid'),'true');
  await page.locator('#customer-email').fill('bad@address');await page.locator('.checkout-buy').click();assert.equal(f.posts.length,0);assert.match(await page.locator('#email-error').innerText(),/Skontrolujte/);
  await page.locator('#customer-email').fill('family@example.invalid');assert.ok(await page.locator('#email-error').isHidden());
  assert.equal(await page.locator('#order-total').innerText(),'14,99 €');assert.match(await page.locator('#payment-note').innerText(),/Stripe.*Apple Pay.*Google Pay/);
  assert.equal(await page.locator('#addon-atlas').isChecked(),true);assert.match(await page.locator('.atlas-addon img').getAttribute('src'),/guardy/);
  await page.locator('#select-bundle').check();assert.equal(await page.locator('#order-total').innerText(),'19,98 €');
  await page.locator('#addon-gift-game').check();assert.equal(await page.locator('#order-total').innerText(),'29,97 €');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.equal(await page.locator('#stripe-pay,#payment-slot,#express-checkout-slot').count(),0,'no application-owned card confirmation');
  await page.locator('.checkout-buy').evaluate(el=>{el.click();el.click();});await page.waitForURL(checkoutUrl);
  assert.equal(f.posts.length,1);assert.equal(f.posts[0].uiMode,'hosted');assert.equal(f.posts[0].giftGame,true);assert.equal(f.posts[0].books.length,2);
  assert.equal(f.totalCents,2997);await t.close();cases.push(width+'px: inline email errors, prices, gift, single redirect');
 }
 for(const [baseId,books,gift,voucher,total]of [
  ['episode-1',false,false,'',1499],['episode-1',true,false,'',1998],['episode-1',false,true,'',2498],['episode-1',true,true,'',2997],
  ['story-book-before',false,false,'',499],['story-book-after',true,false,'',998],['episode-1',true,true,'free',0],['episode-1',true,true,'1e',100]
 ]){
  const t=await open(browser,{query:baseId==='episode-1'?'':'?product='+baseId});
  if(books)await t.page.locator(baseId==='episode-1'?'#select-bundle':'input[name=book]').check();
  if(gift)await t.page.locator('#addon-gift-game').check();if(voucher)await t.voucher(voucher);
  await t.start();await t.page.waitForURL(checkoutUrl);assert.equal(t.f.totalCents,total);await t.close();cases.push(baseId+' '+total+' cents');
 }
 {
  const t=await open(browser);await t.voucher('wrong');assert.match(await t.page.locator('#voucher-error').innerText(),/nepoznáme/);assert.ok(await t.page.locator('#voucher-dialog').isVisible());await t.close();cases.push('invalid voucher stays editable');
 }
 {
  const t=await open(browser,{enabled:false});assert.ok(await t.page.locator('.checkout-buy').isDisabled());assert.ok(await t.page.locator('#reload-payments').isVisible());
  t.f.enabled=true;await t.page.locator('#reload-payments').click();await t.page.waitForFunction(()=>!document.querySelector('.checkout-buy').disabled);assert.equal(t.f.posts.length,0);await t.close();cases.push('disabled payments recover without creating orders');
 }
 for(const url of ['javascript:alert(1)','https://checkout.stripe.com.evil.example/c/pay/123','http://checkout.stripe.com/c/pay/123','https://evil.example/']){
  const t=await open(browser,{url});await t.start();await t.page.locator('#retry-payment').waitFor();assert.ok(t.page.url().startsWith('https://pixelkovia.rodulab.com'));assert.equal(await t.page.locator('#payment-status').getAttribute('data-tone'),'error');await t.close();cases.push('unsafe redirect rejected');
 }
 console.log(JSON.stringify({browser:process.env.QA_BROWSER||'chromium',passed:cases.length,cases},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
