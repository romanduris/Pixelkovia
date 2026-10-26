const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
(async()=>{for(const [engine,device] of [[chromium,devices['Pixel 7']],[webkit,devices['iPhone 13']]]){
 const browser=await engine.launch();try{
  const page=await browser.newPage(device),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/storyboard.html');assert.equal(await page.locator('.recording-archive').count(),0);
  for(const [stage,file] of [['envelope','Miky.mp3'],['symbols','Plugy.mp3'],['search','Guardy.mp3']]){
   const card=page.locator('#gm-'+stage);await card.locator('.storyboard-toggle').tap();
   const audio=card.locator('.miky-message-controls audio');assert.equal(await audio.getAttribute('src'),'assets/'+file);assert.ok(await audio.evaluate(a=>a.controls&&a.paused));
   assert.equal(await card.locator('.audio-message-button,.recording-archive').count(),0);
   // Tap the browser's own play/pause control, without changing autoplay policy.
   await audio.tap({position:{x:20,y:21}});await page.waitForFunction(id=>{const a=document.querySelector('#gm-'+id+' .miky-message-controls audio');return a&&!a.paused&&a.currentTime>.1},stage);
   assert.ok(await audio.evaluate(a=>!a.muted&&a.duration>20));
   await audio.tap({position:{x:20,y:21}});await page.waitForFunction(id=>document.querySelector('#gm-'+id+' .miky-message-controls audio').paused,stage);
   await audio.tap({position:{x:20,y:21}});await page.waitForFunction(id=>!document.querySelector('#gm-'+id+' .miky-message-controls audio').paused,stage);
   await audio.evaluate(a=>{a.playbackRate=16});await page.waitForFunction(id=>document.querySelector('#gm-'+id+' .miky-message-controls audio').ended,stage);
   await audio.evaluate(a=>{a.playbackRate=1});await audio.tap({position:{x:20,y:21}});await page.waitForFunction(id=>{const a=document.querySelector('#gm-'+id+' .miky-message-controls audio');return !a.paused&&a.currentTime>.1&&a.currentTime<3},stage);
   await card.locator('.storyboard-toggle').tap();assert.ok(await audio.evaluate(a=>a.paused),'collapsing the stage pauses playback');
  }
  assert.equal(await page.locator('dialog[open]').count(),0);assert.deepEqual(errors,[]);
  console.log('PASS '+engine.name()+': matching native Miky/Plugy/Guardy players, current recordings, touch play/pause/replay, collapse cleanup and no archive controls.');
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exit(1)});
