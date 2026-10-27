const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080',KEY='zahada-v1-progress';
(async()=>{for(const [engine,device] of (process.env.BROWSER==='chromium'?[[chromium,devices['Pixel 7']]]:process.env.BROWSER==='webkit'?[[webkit,devices['iPhone 13']]]:[[chromium,devices['Pixel 7']],[webkit,devices['iPhone 13']]])){
 const browser=await engine.launch();try{
  const context=await browser.newContext(device),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/game.html');
  for(const [signal,stage,selector,paperLetters] of [['miky',1,'.signal-restore',[]],['plugy',3,'.plugy-lock',[2]],['pingy',4,'.signal-content',[]],['cipko',5,'.cipko-screen',[4]],['guardy',6,'.signal-task',[]],['navrat',7,'.signal-task',[]]]){
   await page.evaluate(KEY=>localStorage.removeItem(KEY),KEY);await page.goto(BASE+'/game.html?signal='+signal);
   assert.equal(await page.locator(selector).count(),1,signal+': direct entry without prerequisites');
   assert.equal(await page.locator('.qr-prerequisite,[data-action="resume-scanned-game"]').count(),0);
   let saved=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.equal(saved.stage,stage);assert.deepEqual(saved.completed,paperLetters);
   await page.reload();saved=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.equal(saved.stage,stage);assert.deepEqual(saved.completed,paperLetters,'non-contiguous paper discoveries survive reload');
  }
  // The final QR asks for the password; it never jumps straight to the farewell.
  await page.evaluate(KEY=>localStorage.removeItem(KEY),KEY);await page.goto(BASE+'/game.html?signal=navrat');
  await page.locator('#answer').fill('NESPRAVNE');await page.locator('.answer-form button').tap();assert.equal(await page.locator('.finale').count(),0);
  await page.locator('#answer').fill('SVETLO');await page.locator('.answer-form button').tap();
  assert.equal(await page.locator('.finale').count(),1);assert.equal(await page.locator('#finale-title').innerText(),'NÁVRATOVÝ SIGNÁL PRIJATÝ');
  assert.equal(await page.locator('.finale video').count(),1,'delivered finale video is available after password verification');
  assert.equal(await page.locator('.finale audio').count(),0,'undelivered standalone voice does not create a broken player');
  assert.ok(await page.locator('.finale video').evaluate(video=>video.paused),'entering the finale does not autoplay');
  assert.deepEqual(await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).completed,KEY),[7]);
  // A saved completion must never bypass the password when scanning again.
  for(const stage of [7,8]){
   await page.evaluate(({KEY,stage})=>localStorage.setItem(KEY,JSON.stringify({progressVersion:2,started:true,callDone:true,stage,completed:[1,2,3,4,5,6,7],hints:{}})),{KEY,stage});
   await page.goto(BASE+'/game.html?signal=navrat');assert.equal(await page.locator('#answer').count(),1);assert.equal(await page.locator('#finale-video').count(),0);
   await page.locator('#answer').fill('NESPRAVNE');await page.locator('.answer-form button').tap();assert.equal(await page.locator('#finale-video').count(),0);
   await page.locator('#answer').fill('SVETLO');await page.locator('.answer-form button').tap();assert.equal(await page.locator('#finale-video').count(),1);
   assert.deepEqual(await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).completed,KEY),[1,2,3,4,5,6,7]);
   await page.reload();assert.equal(await page.locator('#answer').count(),1);assert.equal(await page.locator('#finale-video').count(),0);
  }
  await page.evaluate(KEY=>localStorage.removeItem(KEY),KEY);
  await page.goto(BASE+'/game.html?signal=cipko');await page.locator('[data-kind="pixel"][data-index="1"]').tap();
  await page.goto(BASE+'/game.html?signal=plugy');
  const cells=await page.evaluate(()=>GAME.plugyPuzzle.grid.flat().flatMap((v,i)=>GAME.plugyPuzzle.values.includes(v)?[i]:[]));
  for(const cell of cells)await page.locator(`[data-cell="${cell}"]`).tap();await page.locator('.plugy-connected').waitFor();await page.reload();
  let saved=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.deepEqual(saved.completed,[2,3,4]);
  await page.goto(BASE+'/game.html?signal=cipko');assert.match(await page.locator('.cipko-status').innerText(),/1 \/ 16/,'returning to the QR preserves the mini-game');
  await page.goto(BASE+'/game.html?signal=miky');assert.equal(await page.locator('.signal-restore').count(),1,'earlier QR opens its own task too');
  saved=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.deepEqual(saved.completed,[2,3,4]);
  assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': every current QR opens directly, sparse discoveries and mini-game survive reload/backtracking, no prerequisite screen.');
 }finally{await browser.close();}}
})().catch(e=>{console.error(e);process.exit(1)});
