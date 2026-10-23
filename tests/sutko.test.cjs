// Solve the lock with real taps and verify the optional recording on mobile engines.
const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
const KEY='zahada-v1-progress';
const saved={started:true,callDone:true,stage:3,completed:[1,2],hints:{}};
const normal=text=>text.replace(/\s+/g,' ').trim();
function audioFixture(){
 const rate=22050,frames=rate*2,wav=Buffer.alloc(44+frames*2);
 wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(frames*2,40);
 for(let i=0;i<frames;i++)wav.writeInt16LE(Math.round(Math.sin(2*Math.PI*220*i/rate)*300),44+i*2);
 return wav;
}
async function open(context,recording=false){
 const errors=[],page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=async()=>{};});
 if(recording)await context.route('**/game-data.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace(/"sutkoAudio": (?:null|"[^"]*")/,'"sutkoAudio": "assets/sutko-test.wav"')});});
 await page.goto(BASE+'/game.html');await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key:KEY,saved});await page.goto(BASE+'/game.html?signal=sutko');
 return {page,errors};
}
async function solve(page){
 const indices=await page.evaluate(()=>GAME.sutkoPuzzle.grid.flat().flatMap((value,index)=>GAME.sutkoPuzzle.values.includes(value)?[index]:[]));
 for(const index of indices)await page.locator('[data-cell="'+index+'"]').click();
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
  assert.ok(await page.locator('#sutko-audio').evaluate(audio=>audio.paused),'the message waits until the reveal ends');
  const blink=await page.locator('.sutko-cell[aria-pressed="true"]').first().evaluate(node=>getComputedStyle(node).animationName);assert.equal(blink,'sutko-nine-blink');
  await page.screenshot({path:'/tmp/sutko-nine-reveal.png'});
  await page.waitForTimeout(1500);assert.equal(await page.locator('.sutko-connected').count(),0,'do not switch immediately');
  await page.locator('.sutko-connected').waitFor();assert.ok(Date.now()-revealedAt>=2400,'the reveal lasts about 2.5 seconds');
  assert.equal(await page.locator('#sutko-transcript,.sutko-written-message,.sutko-next-clue').count(),0,'speech stays behind its transcript control');
  assert.equal(await page.locator('.sutko-unlock-sign').getAttribute('aria-label'),'Odomykací znak: číslica 9');
  assert.equal(await page.locator('.sutko-unlock-sign .lit').count(),21);
  assert.match(await page.locator('.sutko-party-scene').getAttribute('alt'),/Piko, Kvak, Iskra a Šutko/);
  assert.match(await page.locator('.signal-reward').innerText(),/E[\s\S]*Zapamätajte[\s\S]*neskôr/);
  await page.waitForFunction(()=>{const audio=document.querySelector('#sutko-audio');return audio&&!audio.paused&&audio.currentTime>0;});
  assert.equal(await page.locator('#sutko-audio').getAttribute('src'),await page.evaluate(()=>GAME.audio),'Kvak recording temporarily stands in for Sutko');
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
  assert.equal(tts.replace(/\[[^\]]+\]\s*/g,'').replace(/\s+/g,' ').trim(),normal(await page.evaluate(()=>GAME.sutkoMessage.join(' '))));
  await page.goto(BASE+'/storyboard.html');await page.locator('[data-action="test"][data-stage="3"]').click();
  for(const index of indices)await page.locator('[data-cell="'+index+'"]').click();
  await page.locator('.sutko-grid.is-unlocking').waitFor();await page.locator('[data-action="exit-test"]').click();
  await page.waitForTimeout(2700);assert.equal(await page.locator('.studio-header').count(),1,'leaving cancels the pending transition');
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),family,'leaving a reveal does not write into family progress');
  assert.deepEqual(errors,[]);await context.close();
  console.log('PASS: exact 5×7 lock, reversible selections, saved progress, all four friends, sign 9, E, short message/TTS, next stage and isolated test; phone/desktop screens fit.');
 }finally{await browser.close();}
 // Use a test-only WAV to exercise actual audio; no substitute voice ships in the game.
 for(const [engine,device] of [[chromium,devices['Pixel 7']],[webkit,devices['iPhone 13']]]){
  const browser=await engine.launch();
  try{
   const context=await browser.newContext({...device}),wav=audioFixture();let requests=0,fail=false;
   await context.route('**/sutko-test.wav',route=>{requests++;return fail?route.abort():route.fulfill({status:200,contentType:'audio/wav',body:wav});});
   const {page,errors}=await open(context,true);
   await page.waitForFunction(()=>document.querySelector('#sutko-audio')?.readyState>=3);
   assert.ok(await page.locator('audio').evaluate(audio=>audio.paused));
   await page.evaluate(()=>window.preloadedSutko=document.querySelector('#sutko-audio'));
   await solve(page);assert.ok(await page.evaluate(()=>window.preloadedSutko===document.querySelector('#sutko-audio')));
   await page.waitForFunction(()=>{const audio=document.querySelector('#sutko-audio');return !audio.paused&&audio.currentTime>0;});
   assert.equal(requests,1,'preloaded audio is retained on completion');
   const button=page.locator('[data-action="sutko-audio-toggle"]');await button.click();assert.ok(await page.locator('audio').evaluate(audio=>audio.paused));
   const at=await page.locator('audio').evaluate(audio=>audio.currentTime);await button.click();await page.waitForFunction(at=>document.querySelector('#sutko-audio').currentTime>at,at);
   await page.locator('audio').evaluate(audio=>audio.playbackRate=4);await page.waitForFunction(()=>document.querySelector('#sutko-audio').ended);
   await page.waitForFunction(()=>document.querySelector('[data-action="sutko-audio-toggle"]').textContent.includes('Prehrať znova'));
   assert.match(await button.textContent(),/Prehrať znova/);await button.click();await page.waitForFunction(()=>{const audio=document.querySelector('#sutko-audio');return !audio.paused&&audio.currentTime<1;});
   await button.click();await page.locator('[data-action="home"]').click();assert.equal(await page.locator('audio').count(),0);
   assert.ok(await page.evaluate(()=>window.preloadedSutko.paused));
   // Blocked autoplay exposes a manual play action rather than losing the message.
   await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key:KEY,saved});await page.goto(BASE+'/game.html?signal=sutko');
   await page.evaluate(()=>{const audio=document.querySelector('#sutko-audio'),play=audio.play.bind(audio);let blocked=true;audio.play=()=>{if(blocked){blocked=false;return Promise.reject(new DOMException('Blocked','NotAllowedError'));}return play();};});
   await solve(page);assert.match(await page.locator('#sutko-audio-status').textContent(),/Ťuknutím/);await page.locator('[data-action="sutko-audio-toggle"]').click();await page.waitForFunction(()=>document.querySelector('#sutko-audio').currentTime>0);
   // Network failure opens the exact same text; retry can recover.
   fail=true;await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key:KEY,saved});await page.goto(BASE+'/game.html?signal=sutko');await solve(page);await page.waitForFunction(()=>document.querySelector('#sutko-audio-status').textContent.includes('nepodarilo'));assert.equal(await page.locator('#sutko-transcript').count(),0,'failed audio must not open text automatically');await page.locator('[data-action="read-sutko-message"]').click();await page.locator('#sutko-transcript').waitFor();assert.match(await page.locator('#sutko-transcript').textContent(),/cestovateľov/);await page.locator('.dialog-close').click();fail=false;await page.locator('[data-action="sutko-audio-toggle"]').click();await page.waitForFunction(()=>document.querySelector('#sutko-audio').currentTime>0);
   assert.deepEqual(errors,[]);await context.close();console.log('PASS: '+engine.name()+' mobile audio preload, autoplay, pause/resume/replay, release, blocked autoplay and network retry.');
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exit(1)});
