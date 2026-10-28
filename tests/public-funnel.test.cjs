// Public deployment boundary plus the real sales/checkout flow.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=(process.env.BASE_URL||'http://127.0.0.1:8081').replace(/\/$/,'');
const root='dist/funnel';
const forbidden=['game.html','parent.html','library-read.html','storyboard.html','book-before.html','book-after.html','books-preview.html','books-content/before.json','books-content/after.json','printables.html','game-data.js','story-text.js','app.js','site-config.js','print-materials.js','prep-store.js','cipko-game.js','admin','assets/printables/p1.pdf','assets/printables/vsetky-materialy.pdf','assets/Miky.mp3','assets/PicoVideo.mp4','assets/miky-sheet-preview.webp'];
for(const file of forbidden)assert.ok(!fs.existsSync(path.join(root,file)),'public artifact excludes '+file);
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(index.includes('Dnes večer budeme'),'landing is rendered without JavaScript');
assert.ok(!/741296|SVETLO/.test(index),'no authored answer codes');
const compiled={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'purchase-config.js'),'utf8'),compiled);
const source={window:{}};vm.runInNewContext(fs.readFileSync('site-config.js','utf8'),source);
assert.deepEqual(Array.from(compiled.window.SITE_CONFIG.products,p=>p.id),['episode-1','story-book-before','story-book-after','atlas-pixelkov']);
for(let mask=0;mask<4;mask++){
 const ids=source.window.SITE_CONFIG.offer.bookIds.filter((_,i)=>mask&(1<<i));
 assert.equal(JSON.stringify(compiled.window.SITE_CONFIG.quote(ids)),JSON.stringify(source.window.SITE_CONFIG.quote(ids)));
 for(const baseId of ['episode-1',...source.window.SITE_CONFIG.offer.bookIds]){
  for(const code of ['','free',' FREE ','not-free']){
   for(const includeAtlas of [true,false])assert.equal(JSON.stringify(compiled.window.SITE_CONFIG.quote(ids,baseId,includeAtlas,code)),JSON.stringify(source.window.SITE_CONFIG.quote(ids,baseId,includeAtlas,code)),'public voucher and optional Atlas quote match the source');
  }
 }
}
assert.equal(compiled.window.SITE_CONFIG.access,undefined);assert.equal(compiled.window.SITE_CONFIG.management,undefined);
(async()=>{
 const browser=await chromium.launch();
 try{
  for(const [width,height]of [[320,568],[360,640],[390,844],[430,932],[768,1024],[1366,768],[1440,900]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600});
   const page=await context.newPage(),errors=[],missing=[],outgoing=[];
   await page.route('**/api/checkout/config',route=>route.fulfill({json:{enabled:false,publishableKey:null}}));
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(BASE))missing.push(r.url())});
   page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))outgoing.push(r.url())});
   await page.addInitScript(()=>localStorage.setItem('zahada-v1-progress','{"progressVersion":2,"stage":3,"started":true}'));
   await page.goto(BASE+'/');await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.locator('#app>section').count(),10);assert.equal(await page.locator('.faq-item').count(),19);
   assert.equal(await page.locator('.character-card').count(),7);
   assert.equal(await page.locator('.evidence-screen img[src="assets/sales/game-lock-partial.webp"]').count(),1);
   assert.equal(await page.locator('.bonus-book-art .book-cover-title').count(),1);
   assert.equal(await page.evaluate(()=>typeof window.GAME),'undefined');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   const art=await page.locator('.funnel-hero').evaluate(el=>{const a=el.getBoundingClientRect(),b=el.querySelector('picture').getBoundingClientRect();return Math.abs((a.height-2)-b.height)<1&&getComputedStyle(el.querySelector('img')).objectFit==='cover'});
   assert.ok(art,'approved illustration fills the hero');
   assert.equal(await page.locator('a[href="game.html"],a[href="parent.html"],a[href$=".pdf"]').count(),0);
   assert.deepEqual(await page.locator('a[href^="#"]').evaluateAll(as=>as.filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash)),[]);
   await page.locator('.faq-primary>details>summary').first().focus();await page.keyboard.press('Enter');
   assert.ok(await page.locator('.faq-primary>details').first().evaluate(el=>el.open));
   await page.locator('.faq-more').focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('.faq-extra .faq-item').count(),11);
   assert.equal(await page.locator('.faq-list').count(),1,'all FAQ rows belong to one list');
   assert.equal(await page.locator('.faq-more').getAttribute('aria-expanded'),'true');
   const alignment=await page.locator('.faq-list').evaluate(list=>{
    const first=list.querySelector('.faq-primary details').getBoundingClientRect();
    return [...list.querySelectorAll('.faq-extra details')].every(el=>{const r=el.getBoundingClientRect();return Math.abs(r.left-first.left)<1&&Math.abs(r.width-first.width)<1;});
   });
   assert.ok(alignment,'new rows continue at the same width without inset framing');
   assert.equal(await page.locator('.faq-extra').evaluate(el=>getComputedStyle(el).borderWidth),'0px');
   if(width<=700){
    await page.locator('.funnel-hero .funnel-cta').scrollIntoViewIfNeeded();await page.waitForTimeout(100);
    assert.ok(await page.locator('.mobile-buy').isHidden());
    await page.locator('#ukazka').scrollIntoViewIfNeeded();await page.waitForTimeout(100);
    assert.ok(await page.locator('.mobile-buy').isVisible());
   }
   await require('./helpers/family-gallery.cjs')(page,{swipe:width===390});
   await require('./helpers/sales-refresh.cjs')(page,{swipe:width===390});
   if(width===390)await page.locator('#ukazka').screenshot({path:'/tmp/pixelkovia-public-gallery-phone.png'});
   const preview=page.locator('[data-sales-open-preview]');await preview.click();
   assert.ok(await page.locator('#sales-preview').evaluate(el=>el.open));await page.keyboard.press('Escape');
   assert.ok(await preview.evaluate(el=>document.activeElement===el));
   for(const img of await page.locator('img').all()){await img.evaluate(el=>el.decode());assert.ok(await img.getAttribute('alt')!==null)}
   for(const img of await page.locator('.worksheet-window>img').all()){
    const size=await img.evaluate(el=>({w:el.naturalWidth,h:el.naturalHeight}));
    assert.ok(size.w>=700&&size.h<=size.w*1.2,'only sharp physically cropped worksheets are public');
   }
   await require('./helpers/book-offer.cjs').previews(page);
   await page.locator('.funnel-hero .funnel-cta').click();await page.waitForURL(url=>/\/checkout(?:\.html)?$/.test(url.pathname));
   await page.locator('#book-options input').first().waitFor();
   assert.ok(await page.locator('.checkout-buy').isDisabled());assert.match(await page.locator('#payment-note').innerText(),/Platby ešte pripravujeme/);
   assert.equal(await page.locator('.checkout-intro,.checkout-status').count(),0);
   assert.equal(await page.locator('#order-total').innerText(),'14,99 €');
   await require('./helpers/book-offer.cjs').checkout(page);
   await require('./helpers/checkout-voucher.cjs')(page,{standalone:width===390,screenshotPrefix:width===390?'/tmp/pixelkovia-voucher-public':undefined});
   await page.locator('#customer-name').fill('Rodinný tím');await page.locator('#customer-email').fill('test@example.com');
   await page.locator('#customer-email').press('Enter');await page.evaluate(()=>document.querySelector('#checkout-form').requestSubmit());
   assert.deepEqual(outgoing,[]);assert.equal(await page.evaluate(()=>Object.values(localStorage).some(v=>v.includes('test@example.com'))),false);
   assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),'{"progressVersion":2,"stage":3,"started":true}');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
   if(width===390)await page.screenshot({path:'/tmp/pixelkovia-public-checkout.png',fullPage:true});
   await context.close();
  }
  const page=await browser.newPage();
  for(const route of [...forbidden,'admin/api/customers','assets/printables/p2-preview.webp','missing-page']){
   const response=await page.request.get(BASE+'/'+route);assert.equal(response.status(),404,'private/missing route returns 404: '+route);
  }
  console.log('PASS: sales-only artifact; rendered HTML; no game/answers/PDF/admin; seven responsive sizes, full hero, FAQ, three-scene swipe/keyboard gallery, preview, sticky CTA, all price combinations, inactive purchase, no submissions and unchanged game progress.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
