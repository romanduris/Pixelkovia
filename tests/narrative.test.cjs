// The printed QR starts the written tasks even when recordings are unavailable.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080';
const normal=text=>text.replace(/\s+/g,' ').trim();
(async()=>{const browser=await chromium.launch({headless:true});try{
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=async()=>{};});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await context.route(/\.(mp4|mpeg|mp3|wav)(\?.*)?$/i,route=>route.abort());
 await page.goto(BASE+'/parent.html');
 for(const checkbox of await page.locator('[data-check]').all())await checkbox.check();
 await page.locator('[data-action="start"]').click();
 await page.locator('.message-incoming').waitFor();
 assert.ok(!/kúpeľ/i.test(await page.locator('dialog').innerText()),'place stays hidden until the message is opened');
 const intro=await page.evaluate(()=>GAME.stages[0].narrative.before.join(' '));
 assert.equal(normal(await page.locator('[data-story-stage="intro"]').innerText()),normal(intro));
 assert.equal(await page.locator('[data-action="read-message"],[data-action="finish-call"]').count(),0);
 const narrative=await page.evaluate(()=>GAME.stages.map(stage=>({id:stage.id,label:stage.label,narrative:stage.narrative,answer:stage.answer,character:stage.character,paperOnly:stage.paperOnly})));
 await page.screenshot({path:'/tmp/narrative-intro-phone.png'});
 await page.goto(BASE+'/game.html?signal=kvak');
 for(let index=1;index<=8;index++){
  const stage=narrative[index],before=page.locator(`[data-story-stage="${stage.id}"][data-story-phase="before"]`);
  if(stage.paperOnly){assert.equal(await before.count(),0,'Iskra has no phone page');assert.equal(stage.narrative.after.length,0);continue;}
  if(index===1||index===3)assert.equal(await before.count(),0,'terminal leaves the story on paper');
  else {await before.waitFor();assert.equal(normal(await before.innerText()),normal(stage.narrative.before.join(' ')),stage.id+': readable setup');}
  assert.equal(await page.locator('.signal-content h1').innerText(),stage.label,'number and envelope place form the heading');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'phone has no horizontal overflow');
  assert.equal(await page.locator('.quest-party .party-person').count(),Math.min(index,6)+1,'party grows by one friend per task');
  if(index===3)await page.screenshot({path:'/tmp/narrative-sutko-phone.png'});
  if(index===4)assert.ok(!(await page.locator('.task-question').innerText()).includes('STÔL'),'do not print the solved strip sentence in the question');
  if(index===3){const indexes=await page.evaluate(()=>GAME.sutkoPuzzle.grid.flat().flatMap((value,index)=>GAME.sutkoPuzzle.values.includes(value)?[index]:[]));for(const index of indexes)await page.locator('[data-cell="'+index+'"]').click();}
  else if(index===6){for(const symbol of stage.answer[0].split(','))await page.locator(`[data-symbol="${symbol}"]`).click();await page.locator('[data-action="verify-sequence"]').click();}
  else{await page.locator('#answer').fill(stage.answer[0]);await page.locator('.answer-form button').click();}
  const after=page.locator(`[data-story-stage="${stage.id}"][data-story-phase="after"]`);
  if(index===1){
   await page.locator('.signal-connected').waitFor();
   assert.match(await page.locator('.signal-reward').innerText(),/S[\s\S]*zapamätajte[\s\S]*neskôr/);
   assert.equal(await page.locator('[data-action="next"],[data-action="notebook"]').count(),0);
   await page.goto(BASE+'/game.html?signal=sutko');continue;
  }
  if(index===3){await page.locator('#sutko-transcript').waitFor();assert.equal(normal((await page.locator('#sutko-transcript p').allTextContents()).join(' ')),normal(stage.narrative.after.join(' ')));await page.locator('.dialog-close').click();assert.match(await page.locator('.signal-reward').innerText(),/E[\s\S]*neskôr/);await page.locator('[data-action="next"]').click();continue;}
  await after.waitFor();
  assert.equal(normal(await after.innerText()),normal(stage.narrative.after.join(' ')),stage.id+': thanks, discovery and next step are visible without media');
  if(index===4)assert.match(await after.innerText(),/OCHRANA AKTÍVNA/);
  if(index===6)assert.match(await after.innerText(),/automaticky uzavrela/);
  if(index===6)await page.screenshot({path:'/tmp/narrative-rysko-phone.png',fullPage:true});
  assert.ok(await page.locator('[data-action="next"]').isVisible());
  await page.locator('[data-action="next"]').click();
 }
 await page.locator('.finale').waitFor();
 const saved=JSON.parse(await page.evaluate(()=>localStorage.getItem('zahada-v1-progress')));
 assert.deepEqual(saved.completed,[1,2,3,4,5,6,7,8]);assert.equal(saved.callDone,true);
 // The numbered headings and story persist when resuming an older save without new fields.
 await page.evaluate(()=>{localStorage.setItem('zahada-v1-progress',JSON.stringify({started:true,callDone:true,stage:2,completed:[1],hints:{2:1}}));});
 await page.goto(BASE+'/parent.html');await page.locator('[data-action="start"]').click();
 assert.equal(await page.locator('.signal-content h1').innerText(),'Úloha 3 – Pod stoličkou');
 assert.equal(await page.locator('[data-story-stage="document"]').count(),0);
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('zahada-v1-progress')).completed),[1,2]);
 // Narrow screens and desktop use the same legible story; do not only check overflow.
 for(const [width,height] of [[320,640],[1440,1100]]){
  // Separate windows avoid Chromium's asynchronous native fullscreen exit when resizing.
  const layout=await browser.newContext({viewport:{width,height},storageState:await context.storageState()});
  await layout.addInitScript(()=>{HTMLElement.prototype.requestFullscreen=async()=>{};});
  const layoutPage=await layout.newPage();
  layoutPage.on('pageerror',error=>errors.push(error.message));
  await layoutPage.goto(BASE+'/parent.html');await layoutPage.locator('[data-action="start"]').click();
  const typography=await layoutPage.locator('.sutko-welcome').first().evaluate(node=>({size:parseFloat(getComputedStyle(node).fontSize),color:getComputedStyle(node).color}));
  assert.ok(typography.size>=12);assert.equal(typography.color,'rgb(185, 201, 225)');
  assert.ok(await layoutPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await layoutPage.screenshot({path:`/tmp/narrative-story-${width}.png`,fullPage:true});
  await layout.close();
 }
 // Old completed paper tasks retain their letter and never require repeating the hunt.
 await page.evaluate(()=>localStorage.setItem('zahada-v1-progress',JSON.stringify({started:true,callDone:true,stage:2,completed:[1,2],hints:{}})));
 await page.goto(BASE+'/parent.html');await page.locator('[data-action="start"]').click();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('zahada-v1-progress')).completed),[1,2]);assert.equal(await page.evaluate(()=>GAME.stages[2].reward),'V');
 assert.equal(await page.locator('.signal-content h1').innerText(),'Úloha 3 – Pod stoličkou');
 assert.equal(await page.locator('.quest-party .party-person').count(),4);
 // Every printed question uses the identical paragraph source as the live game.
 const printed=await context.newPage();await printed.goto(BASE+'/printables.html');
 for(const stage of narrative.slice(1,9))assert.equal(normal(await printed.locator(`[data-story-stage="${stage.id}"]`).innerText()),normal(stage.narrative.before.join(' ')),stage.id+': printable story agrees');
 await page.goto(BASE+'/storyboard.html');
 for(const stage of narrative){
  const article=page.locator('#gm-'+stage.id);assert.ok((await article.locator('h2').first().innerText()).includes(stage.label));
  await article.locator('.storyboard-toggle').click();
  if(stage.id==='symbols'){assert.equal(normal((await article.locator('#sutko-message-text>div>p').allTextContents()).join(' ')),normal(stage.narrative.after.join(' ')));}
  else if(stage.id==='intro'||stage.paperOnly)assert.equal(await article.locator('.storyboard-continuation').count(),0,'intro ends at the video without a post-solution scene');
  else assert.equal(normal(await article.locator('.quest-story[data-story-phase="after"]').innerText()),normal(stage.narrative.after.join(' ')));
  if(stage.id!=='finale')assert.equal(normal(await article.locator('.quest-story[data-story-phase="before"]').first().innerText()),normal(stage.narrative.before.join(' ')));
 }
 assert.deepEqual(errors,[]);
 console.log('PASS: eight-task written adventure without working media, intro and QR entry, plot reveals, numbered places, old-save compatibility, phone typography and exact shared printable/storyboard paragraphs.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1)});
