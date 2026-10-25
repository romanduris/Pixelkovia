// Real MP3 playback in touch browsers, including blocked autoplay and a failed first request.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
const KEY='zahada-v1-progress';
const engines={chromium,webkit};
(async()=>{
 assert.deepEqual(fs.readFileSync('assets/KvakMessage.mp3'),fs.readFileSync('assets/KvakMessage.mpeg'),'the supplied recording must stay unchanged');
 for(const engine of (process.env.AUDIO_BROWSERS||'chromium,webkit').split(',')){
  const browser=await engines[engine].launch({headless:true});
  try{
   const contextOptions={...devices[engine==='webkit'?'iPhone 13':'Pixel 7']};
   async function phone(){
    const context=await browser.newContext(contextOptions);
    if(process.env.SITE_ACCESS_TOKEN){
     await context.route(new URL(BASE).origin+'/**',route=>route.continue({headers:{...route.request().headers(),'OAI-Sites-Authorization':'Bearer '+process.env.SITE_ACCESS_TOKEN}}));
    }
    await context.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=async()=>{};});
    const page=await context.newPage();page.setDefaultTimeout(15000);
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    return {context,page,errors};
   }
   async function solve(page){
    await page.goto(BASE+'/game.html?signal=kvak');
    await page.locator('#answer').fill('741296');
    await page.locator('button[type="submit"]').tap();
    await page.locator('.signal-connected').waitFor();
   }
   async function playing(page,after=0){
    await page.waitForFunction(after=>{const a=document.querySelector('#miky-audio');return a&&!a.paused&&a.readyState>=2&&a.currentTime>after;},after);
    assert.equal(await page.locator('audio').evaluate(a=>a.error?.code??null),null);
    assert.ok(await page.locator('audio').evaluate(a=>!a.muted&&a.volume>0&&a.duration>40&&a.duration<70));
   }
   const normal=await phone(),p=normal.page;
   await p.goto(BASE+'/game.html?signal=kvak');
   const media=await p.request.get(BASE+'/assets/Miky.mp3',{headers:process.env.SITE_ACCESS_TOKEN?{'OAI-Sites-Authorization':'Bearer '+process.env.SITE_ACCESS_TOKEN}:{}});
   assert.equal(media.status(),200);assert.match(media.headers()['content-type'],/^audio\/mpeg\b/,'MP3 must be served as audio on the actual server');
   assert.deepEqual(Buffer.from(await media.body()),fs.readFileSync('assets/Miky.mp3'),'browser receives the actual new recording');
   await p.locator('#answer').fill('000000');await p.locator('button[type="submit"]').tap();
   assert.ok(await p.locator('#miky-audio').evaluate(a=>a.paused&&a.currentTime===0),'preloading never plays the message before a correct code');
   await p.locator('#answer').fill('741296');await p.locator('button[type="submit"]').tap();
   await playing(p,.2);
   assert.equal(await p.locator('[data-action="miky-audio-toggle"]').innerText(),'Ⅱ Pozastaviť');
   await p.screenshot({path:`/tmp/miky-audio-${engine}.png`});
   await p.locator('[data-action="miky-audio-toggle"]').tap();
   const paused=await p.locator('audio').evaluate(a=>a.currentTime);
   await p.waitForTimeout(250);
   assert.ok(await p.locator('audio').evaluate(a=>a.paused));
   assert.ok(Math.abs(await p.locator('audio').evaluate(a=>a.currentTime)-paused)<.15);
   await p.locator('[data-action="miky-audio-toggle"]').tap();await playing(p,paused+.1);
   // Exercise actual completion even on static hosts without byte-range responses.
   await p.locator('audio').evaluate(a=>{a.playbackRate=16;});
   await p.waitForFunction(()=>document.querySelector('audio').ended&&document.querySelector('[data-action="miky-audio-toggle"]').textContent.includes('Prehrať znova'));
   assert.equal(await p.locator('[data-action="miky-audio-toggle"]').innerText(),'↻ Prehrať znova');
   await p.locator('audio').evaluate(a=>{a.playbackRate=1;});
   await p.locator('[data-action="miky-audio-toggle"]').tap();await playing(p,.1);
   assert.ok(await p.locator('audio').evaluate(a=>a.currentTime<3));
   assert.equal(await p.evaluate(key=>JSON.parse(localStorage.getItem(key)).stage,KEY),1,'playback never advances the game');
   await p.reload();await p.locator('.signal-connected').waitFor();
   assert.ok(await p.locator('audio').evaluate(a=>a.paused));
   await p.locator('[data-action="miky-audio-toggle"]').tap();await playing(p,.1);
   assert.deepEqual(normal.errors,[]);await normal.context.close();
   // A slow download must happen while children solve the paper puzzle, then be reused.
   const warm=await phone();let downloads=0,startRequest,release;
   const started=new Promise(resolve=>startRequest=resolve),gate=new Promise(resolve=>release=resolve);
   await warm.context.route('**/assets/Miky.mp3',async route=>{
    downloads++;startRequest();await gate;
    const headers={...route.request().headers()};
    if(process.env.SITE_ACCESS_TOKEN)headers['OAI-Sites-Authorization']='Bearer '+process.env.SITE_ACCESS_TOKEN;
    await route.continue({headers});
   });
   await warm.page.goto(BASE+'/game.html?signal=kvak',{waitUntil:'domcontentloaded'});
   await Promise.race([started,new Promise((_,reject)=>setTimeout(()=>reject(Error('Audio was not requested while the code form was open')),10000))]);
   assert.ok(await warm.page.locator('audio').evaluate(a=>a.paused&&a.currentTime===0));
   await warm.page.waitForTimeout(1200);release();
   await warm.page.waitForFunction(()=>{const a=document.querySelector('audio');return a.readyState>=3&&a.buffered.length&&a.buffered.end(a.buffered.length-1)>=a.duration-.1;});
   await warm.page.evaluate(()=>{
    window.preloadedMiky=document.querySelector('audio');
    document.addEventListener('submit',()=>window.mikySubmitted=performance.now(),{capture:true,once:true});
    preloadedMiky.addEventListener('playing',()=>window.mikyStartMs=performance.now()-window.mikySubmitted,{once:true});
   });
   await warm.page.locator('#answer').fill('741296');await warm.page.locator('button[type="submit"]').tap();
   await playing(warm.page,.1);
   const startup=await warm.page.evaluate(()=>({ms:window.mikyStartMs,samePlayer:window.preloadedMiky===document.querySelector('audio')}));
   assert.ok(startup.samePlayer,'the buffered player survives the screen transition');
   assert.equal(downloads,1,'correct code must not download the recording again');
   assert.ok(startup.ms<800,`preloaded audio started too slowly: ${startup.ms}ms`);
   await warm.page.locator('[data-action="home"]').tap();
   assert.equal(await warm.page.locator('#miky-audio').count(),0);
   assert.ok(await warm.page.evaluate(()=>preloadedMiky.paused&&!preloadedMiky.getAttribute('src')),'leaving the task releases the player');
   assert.deepEqual(warm.errors,[]);await warm.context.close();
   console.log(`PASS: ${engine} preloaded startup ${Math.round(startup.ms)}ms after a simulated slow download; one retained player and one download.`);
   const blocked=await phone();
   await blocked.page.addInitScript(()=>{
    const nativePlay=HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play=function(){
     if(this.id==='miky-audio'&&!window.blockedMikyOnce){window.blockedMikyOnce=true;return Promise.reject(new DOMException('User gesture required','NotAllowedError'));}
     return nativePlay.call(this);
    };
   });
   await solve(blocked.page);
   await blocked.page.waitForFunction(()=>document.querySelector('#miky-audio-status').textContent.includes('Ťuknutím'));
   assert.equal(await blocked.page.locator('dialog[open]').count(),0,'autoplay policy is not a broken recording');
   await blocked.page.locator('[data-action="miky-audio-toggle"]').tap();await playing(blocked.page,.1);
   assert.deepEqual(blocked.errors,[]);await blocked.context.close();
   const retry=await phone();let requests=0,recovered=false;
   await retry.context.route('**/assets/Miky.mp3',route=>{
    requests++;if(!recovered)return route.fulfill({status:503,contentType:'text/plain',body:'Temporary failure'});
    const headers={...route.request().headers()};
    if(process.env.SITE_ACCESS_TOKEN)headers['OAI-Sites-Authorization']='Bearer '+process.env.SITE_ACCESS_TOKEN;
    return route.continue({headers});
   });
   await solve(retry.page);await retry.page.waitForFunction(()=>document.querySelector('#miky-audio-status').textContent.includes('nepodarilo'));assert.equal(await retry.page.locator('dialog[open]').count(),0,'failure leaves manual transcript available');
   await retry.page.waitForFunction(()=>document.querySelector('audio').paused&&document.querySelector('[data-action="miky-audio-toggle"]').textContent.includes('Skúsiť prehrať znova'));
   recovered=true;
   await retry.page.locator('[data-action="miky-audio-toggle"]').tap();await playing(retry.page,.1);
   assert.ok(requests>=2,'a failed request can be retried without resetting progress');
   assert.deepEqual(retry.errors,[]);await retry.context.close();
   console.log(`PASS: ${engine} touch phone: real audio/mpeg, correct-code playback, pause/resume/replay, reload, blocked autoplay and network retry.`);
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exit(1);});
