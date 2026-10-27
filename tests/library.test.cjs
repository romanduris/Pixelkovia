const assert=require('node:assert/strict'),fs=require('node:fs');const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');const BASE=process.env.BASE_URL||'http://127.0.0.1:8083';const publicBase=process.env.PUBLIC_BASE_URL||'http://127.0.0.1:8084';
const plain=s=>s.replace(/\*\*/g,'').replace(/\*([^*]+)\*/g,'$1').replace(/\s+/g,' ').trim();
(async()=>{for(const engine of (process.env.BROWSER==='webkit'?[webkit]:process.env.BROWSER==='all'?[chromium,webkit]:[chromium])){
 let browser;try{browser=await engine.launch();for(const width of [320,390,1440]){
 const context=await browser.newContext({viewport:{width,height:900},deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>localStorage.setItem('zahada-v1-progress','{"stage":3,"started":true}'));
 for(const path of ['library.html','atlas.html','book-before-sample.html','book-after-sample.html','book-before.html','book-after.html']){
  await page.goto(BASE+'/'+path);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+path+' '+width);
  await page.locator('img').evaluateAll(async imgs=>{for(const img of imgs){img.loading='eager';await img.decode();}});
  if(path==='atlas.html'){
   const atlas=require('../books-content/atlas.json');assert.equal(await page.locator('.atlas-profile').count(),7);
   for(const p of atlas.profiles){const text=plain(await page.locator('#'+p.id).innerText());for(const original of [...p.paragraphs,p.ability,p.activity])assert.ok(text.includes(plain(original)),'Atlas original '+p.id);}
  }
  if(/^book-(before|after)\.html$/.test(path)){
   const key=path.includes('before')?'before':'after',book=require('../books-content/'+key+'.json');assert.equal(await page.locator('.book-story').count(),3);
   for(const story of book.stories)assert.deepEqual((await page.locator('#'+story.id+' .authored-prose>p').allTextContents()).map(plain),story.paragraphs.map(plain),'all paragraphs verbatim '+story.id);
   await page.locator('.theme-toggle').click();assert.equal(await page.locator('html').getAttribute('data-reading-theme'),'dark');await page.reload();assert.equal(await page.locator('html').getAttribute('data-reading-theme'),'dark');await page.locator('.theme-toggle').click();
  }
  if(width===390&&['library.html','atlas.html','book-before.html'].includes(path)){fs.mkdirSync('docs/books/screenshots',{recursive:true});await page.screenshot({path:'docs/books/screenshots/'+path.replace('.html','')+'-mobile.png'});}
  if(width===1440&&['library.html','atlas.html','book-after.html'].includes(path))await page.screenshot({path:'docs/books/screenshots/'+path.replace('.html','')+'-desktop.png'});
 }
 await page.goto(BASE+'/checkout.html');assert.equal(await page.locator('[name=book]').count(),2);assert.equal(await page.locator('[name=book]:checked').count(),0);
 await require('./helpers/book-offer.cjs').checkout(page);
 for(const key of ['before','after']){await page.goto(BASE+'/checkout.html?product=story-book-'+key);assert.equal(await page.locator('#order-total').innerText(),'4,99 €');assert.equal(await page.locator('[name=mission]').count(),0);assert(!/Stratený signál/.test(await page.locator('.checkout-summary').innerText()),'standalone book does not require game');assert.ok(await page.locator('.checkout-buy').isDisabled());}
 assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),'{"stage":3,"started":true}');assert.deepEqual(errors,[]);await context.close();
 }
 const page=await browser.newPage();for(const path of ['book-before.html','book-after.html','books-preview.html','legacy-atlas.html','books-content/before.json','books-content/after.json','assets/books/before-1.webp','assets/books/after-3.webp'])assert.equal((await page.request.get(publicBase+'/'+path)).status(),404,'private production route '+path);
 for(const path of ['library.html','atlas.html','book-before-sample.html','book-after-sample.html'])assert.equal((await page.request.get(publicBase+'/'+path)).status(),200);
 console.log('PASS '+engine.name()+': exact 3+3 prose and Atlas profiles, mobile/desktop, theme, images, all four Early Bird combinations, standalone book offers and 404 boundary.');
 }finally{await browser?.close();}}
})().catch(e=>{console.error(e);process.exit(1)});
