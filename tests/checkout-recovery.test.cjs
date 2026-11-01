const assert=require('node:assert/strict');
const {launch,open,cachedPurchase,sessionId,checkoutUrl,origin}=require('./helpers/hosted-checkout.cjs');
(async()=>{const browser=await launch(),cases=[];try{
 {
  const t=await open(browser,{createLost:true});await t.start();await t.page.locator('#retry-payment').waitFor();
  await t.page.reload();await t.page.locator('#retry-payment').click();await t.page.waitForURL(checkoutUrl);
  assert.equal(t.f.posts.length,2);assert.deepEqual(t.f.posts[0],t.f.posts[1]);await t.close();cases.push('lost create response and refresh reuse exact request and key');
 }
 for(const state of ['ready','failed','expired','pending','refunded','unknown']){
  const t=await open(browser,{purchase:cachedPurchase(),query:'?session_id='+sessionId,state});
  if(state==='pending'){
   assert.match(await t.page.locator('#payment-status').innerText(),/Overujeme|neplaťte znova/);assert.ok(await t.page.locator('#change-order').isHidden());assert.ok(await t.page.locator('#continue-payment').isHidden());
  }else{
   await t.page.waitForFunction(()=>!document.querySelector('#payment-status').textContent.includes('Overujeme výsledok'));
   if(['ready','failed'].includes(state)){
    assert.ok(await t.page.locator('#continue-payment').isVisible());assert.equal(await t.page.locator('#continue-payment').getAttribute('href'),checkoutUrl);
    if(state==='failed')assert.equal(await t.page.locator('#payment-status').getAttribute('data-tone'),'error');
    await t.page.locator('#continue-payment').click();await t.page.waitForURL(checkoutUrl);assert.equal(t.f.posts.length,0);
   }
   if(state==='expired'){await t.page.locator('#change-order').click();await t.page.waitForFunction(()=>!document.querySelector('#customer-email').disabled);assert.equal(t.f.releases.length,1);}
   if(state==='refunded')assert.ok(await t.page.locator('#new-order').isVisible());
   if(state==='unknown')assert.equal(await t.page.locator('#payment-status').getAttribute('data-tone'),'error');
  }
  await t.close();cases.push('return state '+state);
 }
 {
  const t=await open(browser,{query:'?session_id='+sessionId,paid:true,delivered:false,orderCount:2});
  await t.page.waitForFunction(()=>document.querySelector('#payment-status').textContent.includes('Platba je potvrdená'));
  assert.match(await t.page.locator('#payment-status').innerText(),/dva samostatné e-maily/i);assert.ok(await t.page.locator('#open-portal').isHidden());
  t.f.delivered=true;await t.page.locator('#check-payment').click();await t.page.locator('#open-portal').waitFor();assert.ok(await t.page.locator('#check-payment').isHidden());assert.equal(t.f.posts.length,0);await t.close();cases.push('paid before mail, then two messages ready');
 }
 {
  const t=await open(browser,{query:'?checkout_id=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&canceled=1',denyStorage:true});
  await t.page.locator('#continue-payment').waitFor();await t.page.locator('#continue-payment').click();await t.page.waitForURL(checkoutUrl);assert.equal(t.f.posts.length,0);await t.close();cases.push('cancel URL recovers same Session with browser storage denied');
 }
 {
  const t=await open(browser,{purchase:cachedPurchase({input:{...cachedPurchase().input,uiMode:'elements'},phase:'unknown'})});
  await t.page.locator('#change-order').waitFor();await t.page.locator('#change-order').click();assert.equal(t.f.releases.length,1);
  await t.page.waitForFunction(()=>!document.querySelector('#customer-email').disabled);await t.start();await t.page.waitForURL(checkoutUrl);assert.equal(t.f.posts[0].uiMode,'hosted');await t.close();cases.push('stuck legacy checkout closes original before a hosted order');
 }
 {
  const t=await open(browser,{purchase:cachedPurchase(),query:'?session_id='+sessionId,statusError:true});
  await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');
  assert.ok(await t.page.locator('#change-order').isHidden());assert.match(await t.page.locator('#payment-status').innerText(),/neplaťte znova/);
  await t.page.screenshot({path:'/tmp/pixelkovia-payment-network-390.png',fullPage:true});
  t.f.statusError=false;await t.page.locator('#check-payment').click();await t.page.locator('#continue-payment').waitFor();assert.equal(t.f.posts.length,0);await t.close();cases.push('network error is visible and retry checks original payment');
 }
 {
  const t=await open(browser,{purchase:cachedPurchase(),releaseError:true});await t.page.locator('#change-order').waitFor();await t.page.locator('#change-order').click();
  await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='error');assert.equal(t.f.posts.length,0);assert.ok(await t.page.locator('#customer-email').isDisabled());await t.close();cases.push('release failure keeps purchase locked');
 }
 {
  const t=await open(browser,{purchase:cachedPurchase(),paid:true,delivered:true});await t.page.locator('#new-order').waitFor();await t.page.locator('#new-order').click();await t.start();await t.page.waitForURL(checkoutUrl);
  assert.equal(t.f.posts[0].newPurchase,true);assert.notEqual(t.f.posts[0].attemptKey,cachedPurchase().attemptKey);await t.close();cases.push('explicit repeat purchase gets a new key');
 }
 {
  const t=await open(browser,{purchase:cachedPurchase(),query:'?session_id='+sessionId});await t.page.locator('#continue-payment').waitFor();
  await t.page.evaluate(()=>{const v=JSON.parse(localStorage.getItem('pixelkovia-checkout-attempt'));v.sessionId='cs_test_unrelatedorder12345';window.dispatchEvent(new StorageEvent('storage',{key:'pixelkovia-checkout-attempt',newValue:JSON.stringify(v)}));});
  assert.equal(t.f.posts.length,0);assert.ok(t.page.url().includes(sessionId));await t.close();cases.push('another tab never replaces return-linked order');
 }
 {
  const t=await open(browser,{configError:true});await t.page.locator('#reload-payments').waitFor();assert.equal(t.f.posts.length,0);
  t.f.configError=false;await t.page.locator('#reload-payments').click();await t.page.waitForFunction(()=>!document.querySelector('.checkout-buy').disabled);await t.close();cases.push('configuration outage retries without refresh');
 }
 for(const createError of [400,403,409,429,500]){
  const t=await open(browser,{createError});await t.start();await t.page.locator('#retry-payment').waitFor();assert.equal(await t.page.locator('#payment-status').getAttribute('data-tone'),'error');
  const original=t.f.posts[0];t.f.createError=0;await t.page.locator('#retry-payment').evaluate(el=>{el.click();el.click();});await t.page.waitForURL(checkoutUrl);assert.deepEqual(t.f.posts[1],original);assert.equal(t.f.posts.length,2);await t.close();cases.push('HTTP '+createError+' recovers one original request');
 }
 {
  const t=await open(browser);await t.start();await t.page.waitForURL(checkoutUrl);await t.page.goBack();await t.page.locator('#continue-payment').waitFor();assert.equal(t.f.posts.length,1);await t.close();cases.push('browser back restores original unpaid Session');
 }
 {
  const t=await open(browser,{purchase:cachedPurchase(),state:'pending'});await t.page.clock.install();await t.page.clock.runFor(8500);
  await t.page.waitForFunction(()=>!document.querySelector('#check-payment').disabled);assert.ok(await t.page.locator('#change-order').isHidden());assert.ok(await t.page.locator('#continue-payment').isHidden());
  t.f.paid=true;await t.page.locator('#check-payment').click();await t.page.waitForFunction(()=>document.querySelector('#payment-status').dataset.tone==='success');assert.equal(t.f.posts.length,0);await t.close();cases.push('polling stops safely and a late confirmed payment recovers');
 }
 {
  const t=await open(browser,{query:'?session_id='+sessionId,denyStorage:true,state:'expired'});await t.page.locator('#change-order').waitFor();await t.page.locator('#change-order').click();await t.page.waitForFunction(()=>!document.querySelector('#customer-email').disabled);assert.equal(t.f.posts.length,0);await t.close();cases.push('verified expiry releases UI with storage denied');
 }
 {
  const t=await open(browser,{query:'?session_id='+sessionId,paid:true,delivered:true,totalCents:0});await t.page.locator('#open-portal').waitFor();assert.match(await t.page.locator('#payment-status').innerText(),/Objednávka zdarma je potvrdená/);await t.close();cases.push('verified free order has correct success copy');
 }
 {
  const t=await open(browser,{query:'?session_id='+sessionId,labels:['<img src=x onerror=alert(1)>']});await t.page.locator('#continue-payment').waitFor();assert.equal(await t.page.locator('#returned-order-items img').count(),0);assert.match(await t.page.locator('#returned-order-items').innerText(),/<img/);await t.close();cases.push('server summary is rendered as plain text');
 }
 console.log(JSON.stringify({browser:process.env.QA_BROWSER||'chromium',passed:cases.length,cases},null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
