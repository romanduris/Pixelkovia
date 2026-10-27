const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
(async()=>{for(const engine of (process.env.BROWSER==='chromium'?[chromium]:process.env.BROWSER==='webkit'?[webkit]:[chromium,webkit])){
 const browser=await engine.launch();try{
  for(const viewport of [{width:390,height:844},{width:320,height:568},{width:1440,height:1000}]){
   const context=await browser.newContext({...devices[engine===chromium?'Pixel 7':'iPhone 13'],viewport,deviceScaleFactor:1,isMobile:viewport.width<600});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>localStorage.setItem('zahada-v1-progress','{"stage":3,"started":true}'));
   await page.goto(BASE+'/legacy-atlas.html');await page.evaluate(()=>document.fonts.ready);
   const layout=await page.evaluate(()=>({text:document.querySelector('.book-opening>p:nth-of-type(2)').getBoundingClientRect().top,cover:document.querySelector('.atlas-cover').getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>innerWidth}));
   assert.ok(!layout.overflow,'no horizontal scrolling');
   assert.ok(layout.text<viewport.height*.65,'reading starts on the first screen, including small phones');
   assert.ok(layout.cover<viewport.height*.34,'the cover occupies a small part of the screen');
   assert.equal(await page.locator('.book-section').count(),7);assert.equal(await page.locator('.atlas-profile,.book-contents').count(),0);assert.equal(await page.locator('.book-illustration').count(),3);
   assert.equal(await page.getByText('Otvoriť miniknižku').count(),0);
   const broken=await page.locator('a[href^="#"]').evaluateAll(links=>links.filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.hash));assert.deepEqual(broken,[]);
   await page.locator('#kapitola-7').scrollIntoViewIfNeeded();
   await page.locator('img').evaluateAll(async imgs=>{for(const img of imgs){img.loading='eager';await img.decode();}});
   const cutouts=await page.locator('.book-illustration img').evaluateAll(imgs=>imgs.map(img=>{const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);return ctx.getImageData(0,0,1,1).data[3]===0;}));
   assert.equal(cutouts.length,7);assert.ok(cutouts.every(Boolean),'book pictures are transparent character cutouts');
   const bookText=await page.locator('.book-chapter').innerText(),encyclopedia=await page.locator('.book-encyclopedia').innerText();
   const toggle=page.locator('.atlas-reading-toggle');
   await toggle.click();
   assert.equal(await toggle.getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('html').getAttribute('data-reading-theme'),'dark');
   assert.equal(await page.locator('.book-chapter').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(24, 37, 55)');
   assert.equal(await page.locator('.encyclopedia-grid p').first().evaluate(el=>getComputedStyle(el).color),'rgb(204, 215, 223)');
   await page.reload();
   assert.equal(await page.locator('html').getAttribute('data-reading-theme'),'dark','reading preference survives reload');
   assert.equal(await page.locator('.book-chapter').innerText(),bookText);
   assert.equal(await page.locator('.book-encyclopedia').innerText(),encyclopedia);
   await page.emulateMedia({media:'print'});
   assert.equal(await page.locator('.book-chapter').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)','print stays light even when reading is dark');
   await page.emulateMedia({media:'screen'});
   await toggle.focus();await page.keyboard.press('Enter');
   assert.equal(await toggle.getAttribute('aria-pressed'),'false');
   assert.equal(await page.locator('.book-chapter').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(250, 246, 237)');
   assert.equal(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')),'{"stage":3,"started":true}');
   assert.deepEqual(errors,[]);await context.close();
  }
  const blocked=await browser.newContext({viewport:{width:390,height:844}});
  await blocked.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('Storage blocked')};Storage.prototype.setItem=()=>{throw Error('Storage blocked')};});
  const privatePage=await blocked.newPage(),storageErrors=[];privatePage.on('pageerror',e=>storageErrors.push(e.message));
  await privatePage.goto(BASE+'/legacy-atlas.html');await privatePage.locator('.atlas-reading-toggle').click();
  assert.equal(await privatePage.locator('html').getAttribute('data-reading-theme'),'dark');assert.deepEqual(storageErrors,[]);await blocked.close();
  console.log('PASS '+engine.name()+': preserved legacy atlas cover, first-screen reading on phones and desktop, continuous bedtime reading, dark/light reading with persistence, keyboard control, storage-blocked fallback, light printing and unchanged book text/progress.');
 }finally{await browser.close();}
}})().catch(error=>{console.error(error);process.exit(1)});
