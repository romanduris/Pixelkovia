const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
(async()=>{for(const [engine,device] of [[chromium,devices['Pixel 7']],[webkit,devices['iPhone 13']]]){
 const browser=await engine.launch();try{
  const context=await browser.newContext(device),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/storyboard.html');await page.locator('#gm-symbols .storyboard-toggle').tap();
  const launch=page.locator('#gm-symbols [data-media="plugy"]');
  assert.ok(await launch.isVisible());assert.equal(await page.locator('dialog[open]').count(),0);
  assert.equal(await page.locator('#gm-symbols .recording-archive audio').getAttribute('src'),'assets/Sutko.mp3');
  await launch.tap();await page.waitForFunction(()=>{const a=document.querySelector('dialog audio');return a&&!a.paused&&a.currentTime>.1;});
  assert.equal(await page.locator('dialog audio').getAttribute('src'),'assets/Plugy.mp3');
  assert.match(await page.locator('.preview-media-status').innerText(),/prehráva/);
  await page.locator('dialog audio').evaluate(a=>a.pause());assert.match(await page.locator('.preview-media-status').innerText(),/pozastavená/);
  await page.locator('dialog audio').evaluate(a=>a.play());await page.waitForFunction(()=>!document.querySelector('dialog audio').paused);
  await page.locator('dialog audio').evaluate(a=>{a.playbackRate=16;});await page.waitForFunction(()=>document.querySelector('dialog audio').ended);
  assert.match(await page.locator('.preview-media-status').innerText(),/prehrať znova/);
  await page.locator('.dialog-close').tap();await launch.tap();await page.waitForFunction(()=>{const a=document.querySelector('dialog audio');return !a.paused&&a.currentTime>.1&&a.currentTime<3;});
  await page.screenshot({path:'/tmp/plugy-storyboard-preview-'+engine.name()+'.png'});
  await page.locator('.dialog-close').tap();assert.ok(await page.locator('dialog audio').evaluate(a=>a.paused));
  await page.route('**/assets/Plugy.mp3',route=>route.abort());await launch.tap();await page.waitForFunction(()=>document.querySelector('dialog audio').error);
  assert.match(await page.locator('.preview-media-status').innerText(),/nepodarilo/);
  await page.locator('.dialog-close').tap();await page.unroute('**/assets/Plugy.mp3');await launch.tap();await page.waitForFunction(()=>!document.querySelector('dialog audio').paused&&document.querySelector('dialog audio').currentTime>.1);
  await page.locator('.dialog-close').tap();
  await page.evaluate(()=>{HTMLMediaElement.prototype.play=()=>Promise.reject(new DOMException('Blocked','NotAllowedError'));});await launch.tap();
  await page.waitForFunction(()=>document.querySelector('.preview-media-status').textContent.includes('Spustite'));
  assert.ok(await page.locator('dialog audio').evaluate(a=>a.controls),'native controls remain available after denial');
  assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': Plugy preview starts on tap, current MP3, native controls, status, replay, close, network recovery and blocked-play fallback.');
 }finally{await browser.close();}}
})().catch(e=>{console.error(e);process.exit(1)});
