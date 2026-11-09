// Real gateway, login, device token, isolated D1 and the shipped MP4.
// No fullscreen/autoplay bypass: use trusted phone taps in both browser engines.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const {workerServer}=await import('./helpers/worker-server.mjs');
 const engines=process.env.QA_BROWSER?[{chromium,webkit}[process.env.QA_BROWSER]]:[chromium,webkit];
 for(const engine of engines){
  const server=await workerServer(),browser=await engine.launch({headless:true});
  try{
   const context=await browser.newContext({...devices[engine===webkit?'iPhone 13':'Pixel 7'],ignoreHTTPSErrors:true});
   const page=await context.newPage(),errors=[];page.setDefaultTimeout(20000);
   page.on('pageerror',error=>errors.push(error.message));
   const video=page.locator('#piko-video'),toggle=page.locator('[data-action="intro-video-toggle"]');
   const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('pixelkovia-run-'+PIXELKOVIA_RUN.run.id)));
   const playing=()=>page.waitForFunction(()=>{
    const v=document.querySelector('#piko-video');return v&&!v.paused&&v.currentTime>.1&&v.dataset.playback==='playing';
   });
   const visibleVideo=async()=>{
    assert.ok(await video.isVisible());
    assert.ok(await video.evaluate(v=>{
     const r=v.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
     return r.width>100&&r.height>100&&!!top?.closest('.message-video-surface');
    }),'the actual video surface is above the page, not just playing sound');
    assert.equal(await page.locator('#answer').count(),0,'no bathroom code screen behind the introduction');
   };
   const unchangedIntro=async()=>{
    const s=await saved();assert.equal(s.stage,0);assert.equal(s.callDone,false);assert.deepEqual(s.completed,[]);
   };
   await page.goto(server.url+'/Supervisor');
   await page.locator('#login-email').fill(server.email);await page.locator('#login-password').fill(server.customerPassword);
   await page.locator('#customer-login button').tap();await page.locator('#start-game').waitFor();
   for(const id of ['printed','placed','device-understood']){
    await page.locator(`[data-preparation="${id}"]`).check();
    await page.waitForFunction(()=>!document.querySelector('[data-preparation="printed"]').disabled);
   }
   await page.locator('#start-game').tap();await page.waitForURL('**/hra');
   await page.locator('.message-introduction').waitFor();
   const runId=await page.evaluate(()=>PIXELKOVIA_RUN.run.id);
   const intro=await page.locator('.quest-story').innerText();
   await unchangedIntro();assert.equal(await page.locator('#answer').count(),0);
   await page.waitForFunction(()=>document.querySelector('#piko-video').readyState>=3);
   const preloaded=await video.evaluate(v=>({hidden:v.hidden,paused:v.paused,time:v.currentTime,buffered:v.buffered.length,ready:v.readyState}));
   // WebKit can report HAVE_ENOUGH_DATA with empty TimeRanges before the first play.
   assert.ok(preloaded.hidden&&preloaded.paused&&preloaded.time<.05&&preloaded.ready>=3,'reading preloads silently: '+JSON.stringify(preloaded));
   const media=await page.request.get(server.url+'/assets/PicoVideo.mp4');
   assert.equal(media.status(),200);assert.match(media.headers()['content-type'],/^video\/mp4/);
   assert.deepEqual(Buffer.from(await media.body()),fs.readFileSync('assets/PicoVideo.mp4'));
   await page.evaluate(()=>window.bufferedIntro=document.querySelector('#piko-video'));
   await page.locator('[data-action="accept-call"]').tap();await playing();await visibleVideo();
   assert.ok(await video.evaluate(v=>v===window.bufferedIntro&&v.playsInline&&!v.muted&&v.volume>0&&v.videoWidth>0));
   assert.equal(await page.evaluate(()=>document.fullscreenElement),null,'video tap does not consume activation on document fullscreen');
   await page.waitForFunction(()=>document.querySelector('#piko-video').currentTime>3.5);
   await toggle.tap();const pausedAt=await video.evaluate(v=>v.currentTime);
   assert.ok(await video.evaluate(v=>v.paused));assert.match(await toggle.innerText(),/Pokračovať/);
   await toggle.tap();await page.waitForFunction(t=>document.querySelector('#piko-video').currentTime>t+.1,pausedAt);
   await toggle.tap();

   for(const [width,height] of [[320,568],[390,844],[844,390]]){
    await page.setViewportSize({width,height});await visibleVideo();
    assert.ok(await toggle.evaluate(b=>{const r=b.getBoundingClientRect();return r.height>=44&&r.top>=0&&r.bottom<=innerHeight;}),'touch playback control fits');
    assert.ok(await page.locator('#modal').evaluate(m=>m.scrollHeight<=m.clientHeight&&m.scrollWidth<=m.clientWidth),'intro video fits the phone');
    await page.screenshot({path:`/tmp/intro-start-${engine.name()}-${width}.png`});
   }
   await page.setViewportSize({width:390,height:844});
   await page.locator('[data-action="back-to-message"]').tap();
   assert.equal(await page.locator('.quest-story').innerText(),intro);
   assert.ok(await video.evaluate(v=>v===window.bufferedIntro&&v.paused&&v.hidden),'back retains the silent buffered player');
   await page.locator('[data-action="accept-call"]').tap();await playing();
   assert.ok(await video.evaluate(v=>v.currentTime<2),'return to video starts at the beginning');
   // Real decoding/completion, accelerated so the test does not wait a full minute.
   await video.evaluate(v=>{v.playbackRate=16;});
   await page.waitForFunction(()=>document.querySelector('#piko-video').ended);
   assert.match(await toggle.innerText(),/Prehrať znova/);await unchangedIntro();
   assert.equal((await saved()).messageWatched,true);
   await video.evaluate(v=>{v.playbackRate=1;});await toggle.tap();await playing();
   assert.ok(await video.evaluate(v=>v.currentTime<2));

   // Reloading an opened/finished introduction shows a manual play action, no sound.
   await page.reload();await toggle.waitFor();await page.waitForFunction(()=>document.querySelector('#piko-video').readyState>=2);
   assert.ok(await video.evaluate(v=>v.paused&&v.currentTime<.05));await unchangedIntro();
   await page.locator('[data-action="back-to-message"]').tap();
   await page.screenshot({path:`/tmp/intro-start-${engine.name()}-text.png`});
   await page.locator('[data-action="close"]').tap();await page.waitForURL('**/Supervisor');
   await page.locator('#start-game').tap();await page.waitForURL('**/hra');await page.locator('.message-introduction').waitFor();
   assert.equal(await page.evaluate(()=>PIXELKOVIA_RUN.run.id),runId,'portal resumes the same run');
   await unchangedIntro();
   assert.equal((await server.db.prepare('SELECT COUNT(*) count FROM game_stage_progress WHERE run_id=?').bind(runId).first()).count,0,'opening/playing/reloading the intro does not record task 1');

   // Denied play has a visible, working fallback and never advances progress.
   await video.evaluate(v=>{
    const play=v.play.bind(v);let denied=false;
    v.play=()=>{if(!denied){denied=true;return Promise.reject(new DOMException('Gesture required','NotAllowedError'));}return play();};
   });
   await page.locator('[data-action="accept-call"]').tap();
   await page.waitForFunction(()=>document.querySelector('#message-video-status').textContent.includes('Ťuknite'));
   assert.ok(await page.locator('.message-video-replay').isVisible());await unchangedIntro();
   await toggle.tap();await playing();await visibleVideo();await toggle.tap();

   // A failed real MP4 request can be reloaded on the same player.
   await page.route('**/assets/PicoVideo.mp4?retry-test',route=>route.abort());
   await video.evaluate(v=>{v.src='assets/PicoVideo.mp4?retry-test';v.load();});
   await page.waitForFunction(()=>document.querySelector('#piko-video').dataset.playback==='error');
   assert.match(await toggle.innerText(),/Skúsiť znova/);await unchangedIntro();
   await page.unroute('**/assets/PicoVideo.mp4?retry-test');await toggle.tap();await playing();await visibleVideo();
   await video.evaluate(v=>{window.departingIntro=v;});
   await page.locator('#modal').evaluate(m=>m.close());
   await page.waitForFunction(()=>window.departingIntro.paused&&!window.departingIntro.getAttribute('src'));
   await page.locator('[data-action="resume-intro"]').tap();await toggle.waitFor();
   assert.ok(await video.evaluate(v=>v.paused),'reopening after close does not start unsolicited sound');
   await unchangedIntro();

   // A tap before the download finishes must still start from the beginning
   // as soon as the actual MP4 arrives, without another tap or hidden task screen.
   let releaseDownload,downloadRequested;
   const downloadGate=new Promise(resolve=>releaseDownload=resolve),requested=new Promise(resolve=>downloadRequested=resolve);
   await page.route('**/assets/PicoVideo.mp4',async route=>{downloadRequested();await downloadGate;await route.continue();});
   await page.evaluate(()=>{
    const key='pixelkovia-run-'+PIXELKOVIA_RUN.run.id,s=JSON.parse(localStorage.getItem(key));s.messageOpened=false;localStorage.setItem(key,JSON.stringify(s));
   });
   await page.reload({waitUntil:'domcontentloaded'});await page.locator('.message-introduction').waitFor();await requested;
   await page.locator('[data-action="accept-call"]').tap();
   assert.match(await page.locator('#message-video-status').innerText(),/načítava/);
   assert.equal(await page.locator('#answer').count(),0);await unchangedIntro();
   releaseDownload();await playing();await visibleVideo();
   assert.ok(await video.evaluate(v=>v.currentTime<2),'slow first playback starts at the beginning');
   await page.unroute('**/assets/PicoVideo.mp4');
   await page.locator('[data-action="back-to-message"]').tap();

   // Old clients accidentally created a task-1 row before the children scanned QR.
   await page.evaluate(async()=>{
    await fetch('/api/customer/sync',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({runId:PIXELKOVIA_RUN.run.id,progress:{stage:1,completed:[]}})});
    localStorage.removeItem('pixelkovia-run-'+PIXELKOVIA_RUN.run.id);
   });
   await page.reload();await page.locator('.message-introduction').waitFor();await unchangedIntro();
   // A QR explicitly opens the actual task and future portal resumes preserve it.
   await page.goto(server.url+'/hra?signal=miky');await page.locator('#answer').waitFor();
   assert.equal(await page.locator('dialog[open]').count(),0);assert.equal((await saved()).callDone,true);
   await page.locator('#answer').fill('000000');await page.locator('.answer-form button').tap();
   await page.evaluate(()=>PIXELKOVIA_SAVE());
   await page.evaluate(()=>localStorage.removeItem('pixelkovia-run-'+PIXELKOVIA_RUN.run.id));
   await page.goto(server.url+'/hra');await page.locator('#answer').waitFor();
   assert.equal(await page.locator('dialog[open]').count(),0,'actual task activity survives missing local progress');
   assert.deepEqual(errors,[]);await context.close();
   console.log(`PASS ${engine.name()}: parent portal start/resume, real inline MP4 and visible frames, silent retained preload, touch pause/resume/replay, mobile layouts, reload, blocked playback, failed download retry, leaving, legacy intro and QR progression.`);
  }finally{await browser.close();await server.mf.dispose();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
