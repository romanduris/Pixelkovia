// Solve the lock with real taps and verify the optional recording on mobile engines.
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
const KEY='zahada-v1-progress';
const saved={started:true,callDone:true,stage:3,completed:[1,2],hints:{}};
const normal=text=>text.replace(/\s+/g,' ').trim();
async function open(context){
 const errors=[],page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=async()=>{};});
 await page.goto(BASE+'/game.html');await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key:KEY,saved});await page.goto(BASE+'/game.html?signal=sutko');
 return {page,errors};
}
async function solve(page,inspectAudio=false){
 const indices=await page.evaluate(()=>GAME.sutkoPuzzle.grid.flat().flatMap((value,index)=>GAME.sutkoPuzzle.values.includes(value)?[index]:[]));
 const touch=await page.evaluate(()=>navigator.maxTouchPoints>0);
 for(const index of indices){const tile=page.locator('[data-cell="'+index+'"]');if(touch)await tile.tap();else await tile.click();}
 if(inspectAudio){
  const silent=await page.locator('audio').evaluate(audio=>{
   const sound=audio.sutkoSound;
   window.sutkoRewindAt=null;audio.addEventListener('seeked',()=>{sutkoRewindAt=audio.currentTime;});
   window.sutkoAnalyser=sound.context.createAnalyser();
   sound.gain.disconnect();sound.gain.connect(sutkoAnalyser);sutkoAnalyser.connect(sound.context.destination);
   const samples=new Float32Array(sutkoAnalyser.fftSize);sutkoAnalyser.getFloatTimeDomainData(samples);
   return sound.revealing&&sound.gain.gain.value===0&&samples.every(value=>value===0);
  });
  assert.ok(silent,'the final touch primes playback but the reveal produces no sound');
 }
 await page.locator('.sutko-connected').waitFor();
}
async function fits(page,label){
 const layout=await page.evaluate(()=>{const main=document.querySelector('#app');return {width:innerWidth,height:innerHeight,scrollWidth:main.scrollWidth,scrollHeight:main.scrollHeight};});
 assert.ok(layout.scrollWidth<=layout.width&&layout.scrollHeight<=layout.height+1,label+': '+JSON.stringify(layout));
}
(async()=>{
 const browser=await chromium.launch();
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),{page,errors}=await open(context);
  assert.equal(await page.locator('.sutko-grid .sutko-cell').count(),35);
  assert.equal(await page.locator('#answer,.signal-reward').count(),0,'a numeric answer cannot bypass the grid');
  assert.deepEqual(await page.locator('.party-person').allTextContents(),['Piko','Kvak','Iskra','Šutko']);
  const mask=await page.evaluate(()=>GAME.sutkoPuzzle.grid.map(row=>row.map(value=>GAME.sutkoPuzzle.values.includes(value)?1:0).join('')));
  assert.deepEqual(mask,['11111','10001','10001','11111','00001','00001','11111']);
  for(const [width,height] of [[320,568],[320,640],[390,844],[844,390],[1440,1000]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>document.fonts.ready);await fits(page,'lock '+width+'×'+height);
   await page.screenshot({path:'/tmp/sutko-lock-'+width+'-'+height+'.png'});
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('[data-cell="0"]').click();assert.equal(await page.locator('[data-cell="0"]').getAttribute('aria-pressed'),'true');
  await page.reload();assert.equal(await page.locator('[data-cell="0"]').getAttribute('aria-pressed'),'true','partial selection survives refresh');
  await page.locator('[data-cell="0"]').click();assert.equal(await page.locator('[data-cell="0"]').getAttribute('aria-pressed'),'false','a second tap clears the cell');
  await page.locator('[data-action="sutko-hint"]').click();await page.locator('[data-action="sutko-hint"]').last().click();await page.locator('.dialog-close').click();
  assert.equal(await page.locator('[aria-pressed="true"]').count(),0,'hints do not solve or reset the grid');
  // Select one wrong tile as well as every correct tile. It must stay locked.
  await page.locator('[data-cell="6"]').click();
  const indices=await page.evaluate(()=>GAME.sutkoPuzzle.grid.flat().flatMap((value,index)=>GAME.sutkoPuzzle.values.includes(value)?[index]:[]));
  assert.equal(indices.length,21);
  for(const index of indices)await page.locator('[data-cell="'+index+'"]').click();
  assert.equal(await page.locator('.sutko-connected').count(),0);
  assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).completed,KEY),[1,2]);
  const revealedAt=Date.now();await page.locator('[data-cell="6"]').click();
  assert.equal(await page.locator('.sutko-grid.is-unlocking').count(),1,'the discovered nine stays in the original grid');
  assert.equal(await page.locator('.sutko-connected').count(),0);
  assert.equal(await page.locator('.sutko-cell:disabled').count(),35,'the finished grid cannot change while revealing');
  assert.ok(await page.locator('#sutko-audio').evaluate(audio=>audio.sutkoSound?.revealing&&audio.sutkoSound.gain.gain.value===0),'the message stays inaudible while the nine is visible');
  const blink=await page.locator('.sutko-cell[aria-pressed="true"]').first().evaluate(node=>getComputedStyle(node).animationName);assert.equal(blink,'sutko-nine-blink');
  await page.screenshot({path:'/tmp/sutko-nine-reveal.png'});
  await page.waitForTimeout(1500);assert.equal(await page.locator('.sutko-connected').count(),0,'do not switch immediately');
  await page.locator('.sutko-connected').waitFor();assert.ok(Date.now()-revealedAt>=2400,'the reveal lasts about 2.5 seconds');
  assert.equal(await page.locator('#sutko-transcript,.sutko-written-message,.sutko-next-clue').count(),0,'speech stays behind its transcript control');
  assert.equal(await page.locator('.sutko-unlock-sign').getAttribute('aria-label'),'Odomykací znak: číslica 9');
  assert.equal(await page.locator('.sutko-unlock-sign .lit').count(),21);
  assert.match(await page.locator('.sutko-party-scene').getAttribute('alt'),/Piko, Kvak, Iskra a Šutko/);
  assert.match(await page.locator('.signal-reward').innerText(),/E[\s\S]*Zapamätajte[\s\S]*neskôr/);
  await page.waitForFunction(()=>document.querySelector('audio').sutkoSound?.gain.gain.value===1);
  assert.ok(await page.locator('#sutko-audio').evaluate(audio=>audio.sutkoSound?.gain.gain.value===1),'the result releases the unlocked output');
  await page.waitForFunction(()=>{const audio=document.querySelector('#sutko-audio');return audio&&!audio.paused&&audio.currentTime>0;});
  assert.equal(await page.locator('#sutko-audio').getAttribute('src'),'assets/Sutko.mp3','the supplied Sutko recording is used');
  await page.locator('[data-action="sutko-audio-toggle"]').click();
  await page.locator('[data-action="read-sutko-message"]').click();
  assert.equal(normal((await page.locator('#sutko-transcript p').allTextContents()).join(' ')),normal(await page.evaluate(()=>GAME.sutkoMessage.join(' '))));
  await page.locator('.dialog-close').click();
  assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).completed,KEY),[1,2,3]);
  for(const [width,height] of [[320,568],[390,844],[844,390],[1440,1000]]){
   await page.setViewportSize({width,height});await fits(page,'result '+width+'×'+height);await page.screenshot({path:'/tmp/sutko-result-'+width+'-'+height+'.png'});
  }
  await page.reload();assert.equal(await page.locator('.sutko-connected').count(),1,'saved completion does not need repeating');
  assert.equal(await page.locator('[data-action="next"]').count(),0);assert.equal(await page.locator('.sutko-thanks').textContent(),await page.evaluate(()=>GAME.sutkoThanks));
  await page.goto(BASE+'/game.html?signal=listok');assert.equal(await page.locator('.signal-content h1').textContent(),'Úloha 4 – Pri topánkach');
  await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify({...saved,completed:[1,2,3]})),{key:KEY,saved});await page.goto(BASE+'/game.html?signal=sutko');assert.equal(await page.locator('.sutko-connected').count(),1,'old completed task 3 remains valid');
  // Isolated StoryBoard tests never write the family's save or partial selections.
  const family=await page.evaluate(key=>localStorage.getItem(key),KEY);await page.goto(BASE+'/storyboard.html');await page.locator('[data-action="test"][data-stage="3"]').click();await solve(page);await page.locator('[data-action="exit-test"]').click();assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),family);
  assert.equal(await page.getByRole('button',{name:'Vývojárske podklady',exact:true}).count(),0);
  await page.locator('#gm-symbols .storyboard-toggle').click();
  for(const suffix of ['text','tts']){await page.locator('[data-target="sutko-message-'+suffix+'"]').click();assert.ok(await page.locator('#sutko-message-'+suffix).isVisible());}
  assert.match(await page.locator('#sutko-message-text').innerText(),/Lístok[\s\S]*cestovateľov/);
  assert.ok(!(await page.locator('#sutko-message-text').innerText()).includes('písmeno E'),'the clue is displayed separately from the spoken script');
  const tts=await page.locator('#sutko-message-tts pre').textContent();
  assert.equal(tts,await page.evaluate(()=>GAME.voiceScripts.sutko.prompt),'TTS instructions remain verbatim, independent of the written transcript');
  await page.goto(BASE+'/storyboard.html');await page.locator('[data-action="test"][data-stage="3"]').click();
  for(const index of indices)await page.locator('[data-cell="'+index+'"]').click();
  await page.locator('.sutko-grid.is-unlocking').waitFor();await page.evaluate(()=>window.canceledSutko=document.querySelector('audio'));await page.locator('[data-action="exit-test"]').click();
  assert.ok(await page.evaluate(()=>canceledSutko.paused&&canceledSutko.sutkoSound===null),'leaving during the reveal closes the silent output');
  await page.waitForTimeout(2700);assert.equal(await page.locator('.studio-header').count(),1,'leaving cancels the pending transition');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),family,'leaving a reveal does not write into family progress');
  assert.deepEqual(errors,[]);await context.close();
  console.log('PASS: exact 5×7 lock, reversible selections, saved progress, all four friends, sign 9, E, short message/TTS, next stage and isolated test; phone/desktop screens fit.');
 }finally{await browser.close();}
 // Exercise the shipped MP3 with real touch gestures and default mobile autoplay policies.
 for(const [engine,device] of [[chromium,devices['Pixel 7']],[webkit,devices['iPhone 13']]]){
  const browser=await engine.launch();
  try{
   const context=await browser.newContext({...device});let requests=0,fail=false;
   await context.route('**/assets/Sutko.mp3',route=>{requests++;return fail?route.fulfill({status:503,contentType:'text/plain',body:'Temporary failure'}):route.continue();});
   const {page,errors}=await open(context);
   await page.waitForFunction(()=>document.querySelector('#sutko-audio')?.readyState>=3);
   assert.ok(await page.locator('audio').evaluate(audio=>audio.paused));
   await page.evaluate(()=>window.preloadedSutko=document.querySelector('#sutko-audio'));
   await page.evaluate(()=>{const audio=document.querySelector('audio'),play=audio.play.bind(audio);window.sutkoPlayCalls=0;audio.play=()=>{sutkoPlayCalls++;return play();};});
   await solve(page,true);assert.ok(await page.evaluate(()=>window.preloadedSutko===document.querySelector('#sutko-audio')));
   assert.equal(await page.evaluate(()=>sutkoPlayCalls),1,'the result keeps the gesture-started player running without another play call');
   await page.waitForFunction(()=>document.querySelector('audio').sutkoSound?.gain.gain.value===1);
   assert.ok(await page.locator('#sutko-audio').evaluate(audio=>audio.sutkoSound?.context.state==='running'&&audio.sutkoSound.gain.gain.value===1&&!audio.loop),'the final tile unlocks automatic playback through the same element');
   await page.waitForFunction(()=>{const audio=document.querySelector('#sutko-audio');return !audio.paused&&audio.currentTime>0;});
   assert.ok(await page.locator('#sutko-audio').evaluate(audio=>audio.volume>0&&audio.duration>25&&audio.duration<35&&!audio.error),'the actual recording is loaded');
   await page.waitForFunction(()=>{const samples=new Float32Array(sutkoAnalyser.fftSize);sutkoAnalyser.getFloatTimeDomainData(samples);return samples.some(value=>Math.abs(value)>.001);}); // Verify output samples, including WebKit's rerouted media, not just a playing flag.
   assert.ok(await page.evaluate(()=>sutkoRewindAt!==null&&sutkoRewindAt<1.5),'the reveal rewinds the recording to its beginning (allowing WebKit audio-graph read-ahead)');
   await page.waitForFunction(()=>document.querySelector('#sutko-audio-status').textContent.includes('Hovorí Šutko'));
   assert.equal(requests,1,'preloaded audio is retained on completion');
   const button=page.locator('[data-action="sutko-audio-toggle"]');await button.click();assert.ok(await page.locator('audio').evaluate(audio=>audio.paused));
   const at=await page.locator('audio').evaluate(audio=>audio.currentTime);await button.click();await page.waitForFunction(at=>document.querySelector('#sutko-audio').currentTime>at,at);
   await page.locator('audio').evaluate(audio=>audio.playbackRate=16);await page.waitForFunction(()=>document.querySelector('#sutko-audio').ended);
   await page.waitForFunction(()=>document.querySelector('[data-action="sutko-audio-toggle"]').textContent.includes('Prehrať znova'));
   assert.match(await button.textContent(),/Prehrať znova/);await page.locator('audio').evaluate(audio=>audio.playbackRate=1);await button.tap();await page.waitForFunction(()=>{const audio=document.querySelector('#sutko-audio');return !audio.paused&&audio.currentTime<1.5;});
   await button.click();await page.locator('[data-action="home"]').click();assert.equal(await page.locator('audio').count(),0);
   assert.ok(await page.evaluate(()=>window.preloadedSutko.paused&&window.preloadedSutko.sutkoSound===null),'leaving releases the primed output');
   // A denied first play remains retryable with the same explicit control.
   await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key:KEY,saved});await page.goto(BASE+'/game.html?signal=sutko');
   await page.evaluate(()=>{const audio=document.querySelector('#sutko-audio'),play=audio.play.bind(audio);let blocked=true;audio.play=()=>{if(blocked){blocked=false;return Promise.reject(new DOMException('Blocked','NotAllowedError'));}return play();};});
   await solve(page);await page.waitForFunction(()=>document.querySelector('#sutko-audio-status').textContent.includes('Ťuknutím'));await page.locator('[data-action="sutko-audio-toggle"]').tap();await page.waitForFunction(()=>document.querySelector('#sutko-audio').currentTime>0);
   // A denied audio-context unlock must leave the entire message ready at zero.
   await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key:KEY,saved});await page.goto(BASE+'/game.html?signal=sutko');
   await page.evaluate(()=>{const Context=window.AudioContext;window.AudioContext=function(){const context=new Context(),resume=context.resume.bind(context);let blocked=true;context.resume=()=>{if(blocked){blocked=false;return Promise.reject(new DOMException('Blocked','NotAllowedError'));}return resume();};return context;};});
   await solve(page);await page.waitForFunction(()=>document.querySelector('#sutko-audio-status').textContent.includes('Ťuknutím'));
   assert.ok(await page.locator('audio').evaluate(audio=>audio.paused&&audio.currentTime===0),'a denied context does not consume the start of the message');
   await page.locator('[data-action="sutko-audio-toggle"]').tap();await page.waitForFunction(()=>document.querySelector('#sutko-audio').currentTime>0);
   // Network failure leaves the transcript available; retry can recover.
   fail=true;await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key:KEY,saved});await page.goto(BASE+'/game.html?signal=sutko');await solve(page);await page.waitForFunction(()=>document.querySelector('#sutko-audio-status').textContent.includes('nepodarilo'));assert.equal(await page.locator('#sutko-transcript').count(),0,'failed audio must not open text automatically');await page.locator('[data-action="read-sutko-message"]').click();await page.locator('#sutko-transcript').waitFor();assert.match(await page.locator('#sutko-transcript').textContent(),/cestovateľov/);await page.locator('.dialog-close').click();fail=false;await page.locator('[data-action="sutko-audio-toggle"]').click();await page.waitForFunction(()=>document.querySelector('#sutko-audio').currentTime>0);
   assert.deepEqual(errors,[]);await context.close();console.log('PASS: '+engine.name()+' real mobile MP3 preload, tap-unlocked automatic playback after reveal, pause/resume/replay, release, denied play and network retry.');
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exit(1)});
