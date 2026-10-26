const assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
(async()=>{for(const engine of [chromium,webkit]){
 const browser=await engine.launch();try{for(const [width,height] of [[320,568],[390,844],[844,390],[1440,900]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await context.newPage();
  await page.goto(BASE+'/game.html?signal=navrat');await page.locator('#answer').fill('SVETLO');await page.locator('.answer-form button').tap();
  assert.equal(await page.locator('.finale').count(),1,'password opens video directly');
  assert.equal(await page.locator('.finale>h1').innerText(),'NÁVRATOVÝ SIGNÁL PRIJATÝ');
  assert.equal(await page.locator('.finale>button').innerText(),'Koniec hry');
  assert.equal(await page.locator('.finale>.finale-media').count(),1);assert.equal(await page.locator('.finale>*').count(),3);
  assert.equal(await page.locator('.quest-story,.contacts,.atlas-invitation,[data-action="next"]').count(),0);
  const metrics=await page.locator('main').evaluate(m=>({height:m.clientHeight,scroll:m.scrollHeight,width:m.clientWidth,scrollWidth:m.scrollWidth,videoHeight:document.querySelector('#finale-video').getBoundingClientRect().height}));
  assert.ok(metrics.scroll<=metrics.height+1);assert.ok(metrics.scrollWidth<=metrics.width+1);assert.ok(metrics.videoHeight>=height-125);
  if(engine===chromium&&width===390)await page.screenshot({path:'/tmp/finale-full-phone.png'});
  await context.close();
 }
 // A web-opened tab can close itself using the real browser operation.
 const context=await browser.newContext(),opener=await context.newPage();await opener.goto(BASE+'/storyboard.html');
 const popupPromise=context.waitForEvent('page');await opener.evaluate(url=>window.open(url,'finale-close-test'),BASE+'/game.html?signal=navrat');const popup=await popupPromise;
 await popup.waitForLoadState();await popup.locator('#answer').fill('SVETLO');await popup.locator('.answer-form button').click();
 const closed=popup.waitForEvent('close');await popup.locator('[data-action="end-game"]').click();await closed;
 console.log('PASS '+engine.name()+': direct minimal finale, maximum video on four viewport sizes, no scrolling and real popup close.');
 }finally{await browser.close();}
}})().catch(error=>{console.error(error);process.exit(1)});
