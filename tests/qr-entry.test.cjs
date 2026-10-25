const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080',KEY='zahada-v1-progress';
(async()=>{for(const [engine,device] of [[chromium,devices['Pixel 7']],[webkit,devices['iPhone 13']]]){
 const browser=await engine.launch();try{
  const context=await browser.newContext(device),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(BASE+'/game.html');
  for(const [signal,stage,selector,paperLetters] of [['kvak',1,'.signal-restore',[]],['miky',1,'.signal-restore',[]],['sutko',3,'.plugy-lock',[2]],['plugy',3,'.plugy-lock',[2]],['listok',4,'.signal-content',[]],['pingy',4,'.signal-content',[]],['cipko',5,'.cipko-screen',[4]]]){
   await page.evaluate(KEY=>localStorage.removeItem(KEY),KEY);await page.goto(BASE+'/game.html?signal='+signal);
   assert.equal(await page.locator(selector).count(),1,signal+': direct entry without prerequisites');
   assert.equal(await page.locator('.qr-prerequisite,[data-action="resume-scanned-game"]').count(),0);
   let saved=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.equal(saved.stage,stage);assert.deepEqual(saved.completed,paperLetters);
   await page.reload();saved=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.equal(saved.stage,stage);assert.deepEqual(saved.completed,paperLetters,'non-contiguous paper discoveries survive reload');
  }
  await page.locator('[data-kind="pixel"][data-index="0"]').tap();
  await page.goto(BASE+'/game.html?signal=plugy');
  const cells=await page.evaluate(()=>GAME.plugyPuzzle.grid.flat().flatMap((v,i)=>GAME.plugyPuzzle.values.includes(v)?[i]:[]));
  for(const cell of cells)await page.locator(`[data-cell="${cell}"]`).tap();await page.locator('.plugy-connected').waitFor();await page.reload();
  let saved=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.deepEqual(saved.completed,[2,3,4]);
  await page.goto(BASE+'/game.html?signal=cipko');assert.match(await page.locator('.cipko-status').innerText(),/1 \/ 12/,'returning to the QR preserves the mini-game');
  await page.goto(BASE+'/game.html?signal=miky');assert.equal(await page.locator('.signal-restore').count(),1,'earlier QR opens its own task too');
  saved=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.deepEqual(saved.completed,[2,3,4]);
  assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': every QR alias opens directly, sparse discoveries and mini-game survive reload/backtracking, no prerequisite screen.');
 }finally{await browser.close();}}
})().catch(e=>{console.error(e);process.exit(1)});
