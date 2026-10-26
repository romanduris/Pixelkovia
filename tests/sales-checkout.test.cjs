const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
const c={window:{}};vm.runInNewContext(fs.readFileSync('site-config.js','utf8'),c);
const config=c.window.SITE_CONFIG,ids=config.offer.missionIds;
for(let mask=0;mask<8;mask++){
 const chosen=ids.filter((_,i)=>mask&(1<<i)),quote=config.quote(chosen);
 const expected=chosen.length===3?490:chosen.length*290;
 assert.equal(quote.extrasCents,expected);assert.equal(quote.totalCents,1499+expected);
}
assert.equal(config.quote([ids[0],ids[0],'invalid']).totalCents,1789);
assert.equal(config.offer.refundDays,14);assert.equal(config.offer.paymentsEnabled,false);
assert.equal(config.access.mode,'test','sales changes cannot simulate purchase entitlements');
(async()=>{
 for(const engine of (process.env.BROWSER==='webkit'?[webkit]:process.env.BROWSER==='chromium'?[chromium]:[chromium,webkit])){
  const browser=await engine.launch();
  try{
   for(const width of [320,390,768,1440]){
    const context=await browser.newContext({...devices[engine===chromium?'Pixel 7':'iPhone 13'],viewport:{width,height:844},deviceScaleFactor:1,isMobile:width<600});
    const page=await context.newPage(),errors=[],failures=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin===new URL(BASE).origin)failures.push(r.url());});
    const save={progressVersion:2,started:true,callDone:true,stage:3,completed:[1],hints:{3:1},scenePages:{}};
    await page.addInitScript(save=>{if(!localStorage.getItem('zahada-v1-progress'))localStorage.setItem('zahada-v1-progress',JSON.stringify(save));},save);
    await page.goto(BASE);await page.locator('.funnel-hero').waitFor();await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.faq-list details').count(),19);assert.equal(await page.locator('.character-card').count(),7);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'sales overflow '+width);
    const broken=await page.locator('a[href^="#"]').evaluateAll(as=>as.filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash));assert.deepEqual(broken,[]);
    assert.equal(await page.locator('a[href="parent.html"],a[href="storyboard.html"],a[href="game.html"]').count(),0);
    await page.locator('.faq-list summary').first().click();assert.ok(await page.locator('.faq-list details').first().evaluate(el=>el.open));
    await page.locator('.funnel-hero .funnel-cta').click();await page.waitForURL('**/checkout.html');
    await page.locator('#mission-options input').first().waitFor();
    assert.equal(await page.locator('[name="mission"]:checked').count(),0,'no paid additions preselected');
    assert.equal(await page.locator('#order-total').innerText(),'14,99 €');
    await page.locator('[name="mission"]').nth(0).check();assert.equal(await page.locator('#order-total').innerText(),'17,89 €');
    await page.locator('[name="mission"]').nth(1).check();assert.equal(await page.locator('#order-total').innerText(),'20,79 €');
    await page.locator('[name="mission"]').nth(2).check();assert.equal(await page.locator('#order-total').innerText(),'19,89 €','all three trigger the cheaper bundle');
    assert.ok(await page.locator('#all-missions').isChecked());assert.match(await page.locator('#summary-extras').innerText(),/3,80/);
    await page.locator('#all-missions').uncheck();assert.equal(await page.locator('[name="mission"]:checked').count(),0);assert.equal(await page.locator('#order-total').innerText(),'14,99 €');
    await page.locator('#all-missions').check();assert.equal(await page.locator('[name="mission"]:checked').count(),3);assert.equal(await page.locator('#order-total').innerText(),'19,89 €');
    await page.locator('[name="mission"]').nth(1).uncheck();assert.equal(await page.locator('#order-total').innerText(),'20,79 €');
    await page.locator('#customer-name').fill('Rodinný tím');await page.locator('#customer-email').fill('test@example.com');
    const outgoing=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))outgoing.push(r.url());});
    await page.locator('#customer-email').press('Enter');await page.evaluate(()=>document.querySelector('#checkout-form').requestSubmit());
    assert.deepEqual(outgoing,[],'no email, order or payment requests');assert.ok(await page.locator('.checkout-buy').isDisabled());
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'checkout overflow '+width);
    assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),JSON.stringify(save),'sales and checkout preserve game progress');
    assert.equal(await page.evaluate(()=>Object.values(localStorage).some(v=>v.includes('test@example.com'))),false,'contact details are not stored');
    if(width===390){await page.screenshot({path:`/tmp/pixelkovia-checkout-${engine.name()}-phone.png`,fullPage:true});await page.goto(BASE);await page.screenshot({path:`/tmp/pixelkovia-home-${engine.name()}-phone.png`,fullPage:true});}
    if(width===1440){await page.screenshot({path:'/tmp/pixelkovia-checkout-desktop.png',fullPage:true});await page.goto(BASE);await page.screenshot({path:'/tmp/pixelkovia-home-desktop.png',fullPage:true});}
    await page.goto(BASE+'/checkout.html?extras=all');assert.equal(await page.locator('#order-total').innerText(),'19,89 €');
    await page.goto(BASE+'/parent.html');await page.locator('.portal-header').waitFor();assert.equal(await page.locator('.material-card').count(),7);
    assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);await context.close();
   }
   console.log('PASS '+engine.name()+': sales and checkout at 320/390/768/1440px, pricing combinations, bundle discount, inactive payment, private form and preserved game progress.');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
