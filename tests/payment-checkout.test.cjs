// Browser-only provider simulation: no Stripe API call, payment or email.
const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=(process.env.BASE_URL||'http://127.0.0.1:8081').replace(/\/$/,'');
(async()=>{
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch();
  try{
   for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:width<600,hasTouch:width<600});
    await context.addInitScript(()=>{
     localStorage.setItem('zahada-v1-progress','{"stage":3,"started":true}');
     Object.defineProperty(window,'SITE_CONFIG',{configurable:true,set(cfg){
      Object.assign(cfg.payments,{mode:'test',accountId:'acct_fixture',chargesEnabled:true,merchantNotificationsConfirmed:true,promotionCode:'free',promotionVerified:true});
      cfg.payments.links={};
      cfg.paymentVariants().forEach((q,i)=>cfg.payments.links[cfg.paymentKey(q)]={url:'https://buy.stripe.com/test_fixture'+i,accountId:'acct_fixture',livemode:false,currency:'eur',priceCents:q.totalCents,verified:true});
      cfg.offer.paymentsEnabled=cfg.paymentsReady();cfg.offer.developmentVoucher='free';
      Object.defineProperty(window,'SITE_CONFIG',{value:cfg,configurable:true});
     }});
    });
    const page=await context.newPage(),errors=[],submissions=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))submissions.push(r.url())});
    await page.route('https://buy.stripe.com/**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><title>Intercepted test redirect</title><p>Provider navigation intercepted. No payment.</p>'}));
    const choices=[{base:'episode-1',books:[]},{base:'episode-1',books:['story-book-before']},{base:'episode-1',books:['story-book-after']},{base:'episode-1',books:['story-book-before','story-book-after']},{base:'story-book-before',books:[]},{base:'story-book-after',books:[]},{base:'story-book-before',books:['story-book-after']}];
    for(const choice of choices)for(const atlas of [true,false]){
     await page.goto(BASE+'/checkout.html?product='+choice.base);
     for(const book of choice.books)await page.locator(`[name="book"][value="${book}"]`).check();
     await page.locator('[name="atlas"]').setChecked(atlas);
     assert.ok(await page.locator('.details-panel').isHidden(),'email is collected on Stripe');
     assert.match(await page.locator('#payment-note').innerText(),/Testovacia platba[\s\S]*Prístup.*osobne e-mailom/);
     assert.ok(await page.locator('.checkout-buy').isEnabled());
     assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
     const expected=await page.evaluate(({choice,atlas})=>SITE_CONFIG.checkoutLink(SITE_CONFIG.quote(choice.books,choice.base,'',atlas)),{choice,atlas});
     assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),'{"stage":3,"started":true}');
     await page.locator('.checkout-buy').click();await page.waitForURL(expected);
     assert.equal(await page.title(),'Intercepted test redirect');
    }
    await page.goto(BASE+'/checkout.html');
    await page.locator('#voucher-open').click();await page.locator('#voucher-code').fill('free');await page.locator('#voucher-code').press('Enter');
    assert.equal(await page.locator('#order-total').innerText(),'0,00 €');
    await page.locator('#select-bundle').click();assert.equal(await page.locator('#order-total').innerText(),'0,00 €');
    if(width===390)await page.screenshot({path:`/tmp/pixelkovia-stripe-simulated-${engine.name()}.png`,fullPage:true});
    await page.locator('.checkout-buy').click();await page.waitForURL(url=>url.hostname==='buy.stripe.com');
    assert.equal(new URL(page.url()).searchParams.get('prefilled_promo_code'),'free');
    await page.goto(BASE+'/checkout.html?payment=success&session_id=unverified');
    assert.equal(await page.locator('#order-total').innerText(),'14,99 €','query strings do not simulate paid purchases');
    assert.deepEqual(errors,[]);assert.deepEqual(submissions,[]);
    await context.close();
    console.log(`PASS ${engine.name()} ${width}px: 14 simulated Stripe handoffs, exact offer/Atlas selection, manual delivery notice, hidden duplicate contact form, free promotion and unchanged progress. No real payment or email was sent.`);
   }
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
