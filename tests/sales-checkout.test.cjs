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
   for(const [width,height] of [[320,568],[360,640],[390,844],[430,932],[768,1024],[1366,768],[1440,900]]){
    const context=await browser.newContext({...devices[engine===chromium?'Pixel 7':'iPhone 13'],viewport:{width,height},deviceScaleFactor:1,isMobile:width<600});
    const page=await context.newPage(),errors=[],failures=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin===new URL(BASE).origin)failures.push(r.url());});
    const save={progressVersion:2,started:true,callDone:true,stage:3,completed:[1],hints:{3:1},scenePages:{}};
    await page.addInitScript(save=>{if(!localStorage.getItem('zahada-v1-progress'))localStorage.setItem('zahada-v1-progress',JSON.stringify(save));},save);
    await page.goto(BASE);await page.locator('.funnel-hero').waitFor();await page.evaluate(()=>document.fonts.ready);
    assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.faq-list details').count(),19);assert.equal(await page.locator('.character-card').count(),7);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'sales overflow '+width);
    assert.equal(await page.locator('#app>section').count(),9);
    assert.match(await page.locator('.hero-format').innerText(),/45–60 min[\s\S]*7–13 rokov[\s\S]*Jeden tím[\s\S]*2–5 hráčov/);
    assert.match(await page.locator('.hero-price').innerText(),/14,99 €/);
    assert.match(await page.locator('.funnel-offer-card').innerText(),/Atlas Pixelkov/);
    assert.equal(await page.locator('.faq-primary>.faq-item').count(),8);
    assert.equal(await page.locator('.faq-extra .faq-item').count(),11);
    assert.equal(await page.locator('.faq-more').getAttribute('aria-expanded'),'false');
    assert.ok(await page.locator('.faq-extra').isHidden());
    const faqMore=page.locator('.faq-more');
    await faqMore.focus();await page.keyboard.press('Enter');
    assert.equal(await faqMore.getAttribute('aria-expanded'),'true','keyboard reveals the rest of the same FAQ list');
    assert.ok(await page.locator('.faq-extra .faq-item summary').first().evaluate(el=>el===document.activeElement),'focus reaches the first added question');
    const moreQuestion=page.locator('.faq-extra .faq-item').first();
    await moreQuestion.locator('summary').focus();await page.keyboard.press('Space');
    assert.ok(await moreQuestion.evaluate(el=>el.open));
    await moreQuestion.locator('summary').press('Enter');
    await faqMore.focus();await page.keyboard.press('Enter');
    assert.ok(await page.locator('.faq-extra').isHidden(),'collapse returns to the original eight questions');
    for(const cta of await page.locator('a[href="checkout.html"]').all()){
     assert.match(await cta.innerText(),/^Pozrieť ponuku/,'consistent checkout action');
     const rect=await cta.boundingBox();if(rect)assert.ok(rect.height>=44,'44px checkout targets');
    }
    if(width<=700){
     const heroCta=page.locator('.funnel-hero .funnel-cta');
     await heroCta.scrollIntoViewIfNeeded();await page.waitForTimeout(100);
     assert.ok(await page.locator('.mobile-buy').isHidden(),'no duplicate bar when hero CTA is fully visible');
     await page.locator('#ukazka').scrollIntoViewIfNeeded();
     await page.waitForTimeout(100);
     assert.ok(await page.locator('.mobile-buy').isVisible(),'bar accompanies content away from primary CTAs');
     const bar=await page.locator('.mobile-buy').boundingBox(),button=await page.locator('.mobile-buy>a').boundingBox();
     assert.ok(bar.y>=0&&bar.y+bar.height<=height+1,'purchase bar fits the visible phone screen');
     assert.ok(button.height>=46,'comfortable phone touch target');
     await page.locator('.mobile-buy>a').focus();await heroCta.scrollIntoViewIfNeeded();await page.waitForTimeout(100);
     assert.ok(await page.locator('.mobile-buy').isVisible(),'focused bar is retained while scrolling to another CTA');
     await heroCta.focus();await page.waitForTimeout(100);
     assert.ok(await page.locator('.mobile-buy').isHidden(),'bar hides after focus moves to visible hero CTA');
     await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
     const footer=await page.locator('.site-footer').boundingBox();
     assert.ok(footer.height>=95,'last content has clearance above fixed mobile bar');
    }else assert.ok(await page.locator('.mobile-buy').isHidden());
    assert.equal(await page.locator('.evidence-family>img').count(),3);
    const photo=page.locator('.evidence-family>img').first();
    await photo.scrollIntoViewIfNeeded();await photo.evaluate(img=>img.decode());
    const image=await photo.evaluate(img=>({ratio:img.naturalWidth/img.naturalHeight,rendered:img.clientWidth,fit:getComputedStyle(img).objectFit}));
    assert.ok(Math.abs(image.ratio-.8)<.01&&image.fit==='contain','portrait photograph remains uncropped');
    if(width<600)assert.ok(image.rendered>width*.75,'large phone photo leaves a visible peek of the next scene');
    assert.equal(await page.locator('.evidence-screen img').count(),1,'actual game frame visible without accordion');
    assert.equal(await page.locator('.evidence-screen img[src="assets/sales/game-lock-partial.webp"]').count(),1,'user-approved real puzzle preview');
    assert.equal(await page.locator('img[src*="opening-video-frame"]').count(),0,'the sad close-up is replaced by the approved puzzle still');
    assert.equal(await page.locator('.evidence-family img[src*="family-lock"]').count(),1,'original second family scene is restored');
    assert.equal(await page.locator('.compact-materials a,.compact-materials button,a[href$=".pdf"]').count(),0,'worksheets cannot be enlarged or downloaded from funnel');
    for(const sheet of await page.locator('.worksheet-window>img').all()){
     await sheet.evaluate(img=>img.decode());
     const preview=await sheet.evaluate(img=>({sourceWidth:img.naturalWidth,width:img.clientWidth,clipped:img.clientHeight>img.parentElement.clientHeight,overflow:getComputedStyle(img.parentElement).overflow}));
     assert.ok(preview.sourceWidth>=700&&preview.width<=(width<=700?141:110),'sharp but intentionally small worksheet preview');
     assert.ok(preview.clipped&&preview.overflow==='hidden','bottom reward/footer is outside public preview');
    }
    await require('./helpers/family-gallery.cjs')(page);
    await require('./helpers/sales-refresh.cjs')(page);
    const previewButton=page.locator('[data-sales-open-preview]');
    await previewButton.focus();await page.keyboard.press('Enter');
    assert.ok(await page.locator('#sales-preview').evaluate(el=>el.open));
    assert.ok(await page.locator('.sales-preview-close').evaluate(el=>el===document.activeElement));
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#sales-preview').evaluate(el=>el.open),false);
    assert.ok(await previewButton.evaluate(el=>el===document.activeElement),'preview returns keyboard focus');
    if(width<600)await previewButton.tap();else await previewButton.click();
    await page.locator('.sales-preview-close').click();
    const broken=await page.locator('a[href^="#"]').evaluateAll(as=>as.filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash));assert.deepEqual(broken,[]);
    assert.equal(await page.locator('a[href="parent.html"],a[href="storyboard.html"],a[href="game.html"]').count(),0);
    await page.locator('.faq-list summary').first().click();assert.ok(await page.locator('.faq-list details').first().evaluate(el=>el.open));
    await page.locator('.funnel-hero .funnel-cta').click();await page.waitForURL('**/checkout.html');
    await page.locator('#mission-options input').first().waitFor();
    assert.match(await page.locator('.checkout-status').innerText(),/Platby ešte nie sú spustené/);
    const statusRect=await page.locator('.checkout-status').boundingBox();assert.ok(statusRect.y<height,'inactive status is immediately visible');
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
   console.log('PASS '+engine.name()+': phone-first sales and checkout at 320/360/390/430/768/1366/1440px, 9 sections, 19 keyboard FAQs, conditional mobile bar, sharp protected worksheet previews, keyboard/touch game preview, pricing combinations, bundle discount, inactive payment, private form and preserved game progress.');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
