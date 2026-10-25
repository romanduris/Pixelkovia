const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const solve=require('./helpers/cipko.cjs');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080',KEY='zahada-v1-progress';
(async()=>{for(const [engine,device] of [[chromium,devices['Pixel 7']],[webkit,devices['iPhone 13']]]){
 const browser=await engine.launch();try{
 const context=await browser.newContext(device),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE+'/game.html');
 const saved={progressVersion:2,started:true,callDone:true,stage:4,completed:[1,2,3],hints:{3:1},plugyCells:[0,1]};
 await page.evaluate(({KEY,saved})=>localStorage.setItem(KEY,JSON.stringify(saved)),{KEY,saved});
 await page.goto(BASE+'/game.html?signal=cipko');
 assert.match(await page.locator('h1').innerText(),/Rozsvieť pixely/);assert.equal(await page.locator('.answer-form').count(),0,'cannot skip games through an answer form');
 await page.locator('[data-kind="pixel"][data-index="1"]').tap();await page.reload();
 assert.match(await page.locator('.cipko-status').innerText(),/1 \/ 16/);
 await page.screenshot({path:'/tmp/cipko-'+engine.name()+'-pixels.png'});
 for(const round of [0,1,2,3]){
  if(round!==0){ // Check layout of later boards without awarding any stage completion.
   await page.evaluate(({KEY,round})=>{const s=JSON.parse(localStorage.getItem(KEY));s.cipko.round=round;s.cipko.won=false;localStorage.setItem(KEY,JSON.stringify(s));},{KEY,round});await page.reload();
  }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no phone overflow');
  await page.screenshot({path:`/tmp/cipko-${engine.name()}-round-${round}.png`});
  if(round===1){
   const from=page.locator('[data-kind="select"][data-index="2"]'),to=page.locator('[data-kind="slot"][data-index="2"]');
   if(engine===chromium){
    await from.scrollIntoViewIfNeeded();const a=await from.boundingBox(),b=await to.boundingBox(),cdp=await context.newCDPSession(page);
    const x=a.x+a.width/2,y=a.y+a.height/2,dx=b.x+b.width/2-x,dy=b.y+b.height/2-y;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
    for(let k=1;k<=10;k++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*k/10,y:y+dy*k/10}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
   }else await from.dragTo(to);
   assert.equal(await page.locator('.cipko-slot.placed').count(),1,'drag places a correct image tile');await page.reload();assert.equal(await page.locator('.cipko-slot.placed').count(),1,'partial jigsaw survives reload');
  }
 }
 // Start actual interaction sequence from the retained first pixel.
 await page.evaluate(KEY=>{const s=JSON.parse(localStorage.getItem(KEY));s.cipko.round=0;localStorage.setItem(KEY,JSON.stringify(s));},KEY);await page.reload();
 await solve(page);await page.screenshot({path:'/tmp/cipko-'+engine.name()+'-finished.png'});
 const s=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.deepEqual(s.completed,[1,2,3,4,5]);assert.deepEqual(s.plugyCells,[0,1]);assert.equal(s.hints[3],1);
 await page.reload();assert.equal(await page.locator('.cipko-finished').count(),1,'completed stage survives reload');
 await page.goto(BASE+'/game.html?signal=guardy');assert.match(await page.locator('h1').innerText(),/chladničke/);
 const beforePreview=await page.evaluate(KEY=>localStorage.getItem(KEY),KEY);
 await page.goto(BASE+'/storyboard.html');await page.locator('[data-action="test"][data-stage="5"]').click();await page.locator('[data-kind="pixel"][data-index="1"]').tap();await page.locator('[data-action="exit-test"]').tap();
 assert.equal(await page.evaluate(KEY=>localStorage.getItem(KEY),KEY),beforePreview,'isolated preview preserves family progress');
 await page.evaluate(KEY=>{const s=JSON.parse(localStorage.getItem(KEY));s.stage=5;delete s.cipko;localStorage.setItem(KEY,JSON.stringify(s));},KEY);await page.goto(BASE+'/game.html?signal=cipko');assert.equal(await page.locator('.cipko-finished').count(),1,'historical completed task five stays completed');
 await page.evaluate(KEY=>{const s=JSON.parse(localStorage.getItem(KEY));s.completed=s.completed.filter(n=>n!==5);s.cipko={version:1,round:2,won:false,matched:[0,5],open:[]};localStorage.setItem(KEY,JSON.stringify(s));},KEY);await page.goto(BASE+'/game.html?signal=cipko');assert.equal(await page.locator('.cipko-card').count(),12,'old unfinished round upgrades to six pairs');assert.deepEqual(await page.locator('.cipko-digits strong').allTextContents(),['7','2','·','·']);
 await page.evaluate(KEY=>{const s=JSON.parse(localStorage.getItem(KEY));s.cipko={version:1,round:3,won:true};localStorage.setItem(KEY,JSON.stringify(s));},KEY);await page.reload();assert.equal(await page.locator('.cipko-finished').count(),1,'old last-game victory becomes paper handoff');assert.ok((await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)).completed,KEY)).includes(5));
 assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': harder games, touch dragging, paper-only finish with 7294, phone layouts, reload and existing progress preserved.');
 }finally{await browser.close();}}
})().catch(e=>{console.error(e);process.exit(1)});
