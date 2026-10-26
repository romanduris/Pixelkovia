// Serve MP4 with HTTP byte-range (206) responses for iPhone WebKit.
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080',KEY='zahada-v1-progress';
(async()=>{for(const [engine,device] of [[chromium,devices['Pixel 7']],[webkit,devices['iPhone 13']]]){
 const browser=await engine.launch();try{
  const context=await browser.newContext(device),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/game.html?signal=navrat');
  assert.equal(await page.locator('#finale-video').count(),0);
  await page.locator('#answer').fill('SVETLO');await page.locator('.answer-form button').tap();
  const video=page.locator('#finale-video'),button=page.locator('[data-action="finale-video-toggle"]'),status=page.locator('#finale-video-status');
  await video.evaluate(v=>v.readyState>=1?null:new Promise((resolve,reject)=>{v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',()=>reject(new Error(v.error?.message||'Video load failed')),{once:true});}));
  const meta=await video.evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,paused:v.paused,muted:v.muted,inline:v.playsInline}));
  assert.equal(meta.width,480);assert.equal(meta.height,854);assert.ok(meta.duration>=9&&meta.duration<=11);assert.ok(meta.paused&&meta.inline&&!meta.muted);
  const saved=await page.evaluate(key=>localStorage.getItem(key),KEY);
  assert.ok(await page.locator('.finale-end-title').isHidden());
  await button.tap();await page.waitForFunction(()=>document.querySelector('#finale-video').currentTime>.2);assert.match(await status.innerText(),/prehráva/);
  await button.tap();assert.ok(await video.evaluate(v=>v.paused));await page.waitForFunction(()=>document.querySelector('#finale-video-status').textContent.includes('pozastavené'));
  const pausedAt=await video.evaluate(v=>v.currentTime);await button.tap();await page.waitForFunction(t=>document.querySelector('#finale-video').currentTime>t+.15,pausedAt);
  await video.evaluate(v=>{v.addEventListener('ended',()=>{window.finalVideoEndedAt=performance.now();},{once:true});const title=document.querySelector('.finale-end-title');new MutationObserver(()=>{if(!title.hidden)window.finalTitleShownAt=performance.now();}).observe(title,{attributes:true,attributeFilter:['hidden']});});
  await video.evaluate(v=>{v.currentTime=v.duration-.15;});await page.waitForFunction(()=>document.querySelector('#finale-video').ended);await page.waitForFunction(()=>document.querySelector('[data-action="finale-video-toggle"]').textContent.includes('znova'));
  assert.ok(await page.locator('.finale-end-title').isHidden(),'title is delayed after ended');
  const finalFrame=await video.evaluate(v=>{const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);return c.toDataURL();});
  await page.locator('.finale-end-title').waitFor({state:'visible'});
  assert.ok(await page.evaluate(()=>window.finalTitleShownAt-window.finalVideoEndedAt>=950),'KONIEC waits approximately one second');
  assert.ok(await video.evaluate(v=>v.ended&&v.paused&&Math.abs(v.currentTime-v.duration)<.1));
  assert.equal(await video.evaluate(v=>{const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;c.getContext('2d').drawImage(v,0,0);return c.toDataURL();}),finalFrame,'last decoded frame remains unchanged beneath the title');
  await page.locator('.finale-video-frame').screenshot({path:'/tmp/finale-ended-'+engine.name()+'.png'});
  await button.tap();await page.waitForFunction(()=>{const v=document.querySelector('#finale-video');return !v.paused&&v.currentTime<2});await button.tap();
  assert.ok(await page.locator('.finale-end-title').isHidden(),'replay clears the title');
  // A denied play request leaves a manual action and does not alter progress.
  await video.evaluate(v=>{v.realPlay=v.play;v.play=()=>Promise.reject(new DOMException('Denied','NotAllowedError'));});await button.tap();await page.waitForFunction(()=>document.querySelector('#finale-video-status').textContent.includes('Ťuknutím'));
  await video.evaluate(v=>{v.play=v.realPlay;});assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),saved);
  // A real failed request can be retried on the same element after recovery.
  await page.route('**/assets/EndScene-Dabing.mp4*',route=>route.abort());await video.evaluate(v=>{v.src+='?failed-check';v.load();});await page.waitForFunction(()=>!!document.querySelector('#finale-video').error);assert.match(await status.innerText(),/nepodarilo/);
  await page.unroute('**/assets/EndScene-Dabing.mp4*');await page.route('**/assets/EndScene-Dabing.mp4?failed-check',route=>route.continue());
  await button.tap();await page.waitForFunction(()=>{const v=document.querySelector('#finale-video');return !v.paused&&v.currentTime>.1});
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),saved);
  await video.evaluate(v=>{v.currentTime=v.duration-.15;});await page.locator('.finale-end-title').waitFor({state:'visible'});
  await page.reload();assert.ok(await page.locator('.finale-end-title').isHidden(),'refresh clears ending title');
  await button.tap();await page.waitForFunction(()=>document.querySelector('#finale-video').currentTime>.1);
  await video.evaluate(v=>{window.departingFinaleVideo=v;});await page.evaluate(()=>{window.close=()=>{window.closeAttempted=true};});await page.locator('[data-action="end-game"]').tap();await page.waitForFunction(()=>document.querySelector('[data-action="end-game"]').textContent.includes('Kartu môžete zavrieť'));assert.ok(await page.evaluate(()=>window.closeAttempted));assert.ok(await page.evaluate(()=>window.departingFinaleVideo.paused));
  assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': real 480x854 dubbed finale video, touch play/pause/resume/replay, denied play, retry, progress, delayed title over the retained final frame, replay/refresh and leaving.');
 }finally{await browser.close();}
}})().catch(error=>{console.error(error);process.exit(1);});
