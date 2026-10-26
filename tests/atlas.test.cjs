const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
(async()=>{for(const engine of [chromium,webkit]){
 const browser=await engine.launch();try{
  for(const viewport of [{width:390,height:844},{width:320,height:568},{width:1440,height:1000}]){
   const context=await browser.newContext({...devices[engine===chromium?'Pixel 7':'iPhone 13'],viewport,deviceScaleFactor:1,isMobile:viewport.width<600});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(BASE+'/atlas.html');await page.evaluate(()=>document.fonts.ready);
   const layout=await page.evaluate(()=>({text:document.querySelector('.book-opening>p:nth-of-type(2)').getBoundingClientRect().top,cover:document.querySelector('.atlas-cover').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth}));
   assert.ok(!layout.overflow,'no horizontal scrolling');
   assert.ok(layout.text<viewport.height*.65,'reading starts on the first screen, including small phones');
   assert.ok(layout.cover<viewport.height*.34,'the cover occupies a small part of the screen');
   assert.equal(await page.locator('.book-section').count(),7);assert.equal(await page.locator('.atlas-profile,.book-contents').count(),0);assert.equal(await page.locator('.book-illustration').count(),3);
   assert.equal(await page.getByText('Otvoriť miniknižku').count(),0);
   const broken=await page.locator('a[href^="#"]').evaluateAll(links=>links.filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash));assert.deepEqual(broken,[]);
   await page.locator('#kapitola-7').scrollIntoViewIfNeeded();
   await page.locator('img').evaluateAll(async imgs=>{for(const img of imgs){img.loading='eager';await img.decode();}});
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS '+engine.name()+': compact atlas cover, first-screen reading on phones and desktop, continuous bedtime reading, three illustrations and no profile cards or chapter menu.');
 }finally{await browser.close();}
}})().catch(error=>{console.error(error);process.exit(1)});
