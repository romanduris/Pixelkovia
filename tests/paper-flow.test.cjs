const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080',KEY='zahada-v1-progress';
(async()=>{
 for(const [engine,device] of (process.env.BROWSER==='chromium'?[[chromium,devices['Pixel 7']]]:process.env.BROWSER==='webkit'?[[webkit,devices['iPhone 13']]]:[[chromium,devices['Pixel 7']],[webkit,devices['iPhone 13']]])){
 const browser=await engine.launch();try{
 const context=await browser.newContext(device),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE+'/game.html');
 // Every printed QR opens its own task, including in a fresh browser.
 await page.goto(BASE+'/game.html?signal=cipko');assert.equal(await page.locator('.cipko-screen').count(),1);assert.equal(await page.locator('.qr-prerequisite').count(),0);
 assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).completed,KEY),[4]);
 const saved={progressVersion:2,started:true,callDone:true,stage:4,completed:[1,2,3],hints:{3:1},plugyCells:[0,1]};
 await page.evaluate(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:KEY,s:saved});
 // Completed paper tasks remain completed while moving between current QR entries.
 await page.evaluate(({k,s})=>localStorage.setItem(k,JSON.stringify({...s,completed:[1,2,3,4]})),{k:KEY,s:saved});
 await page.goto(BASE+'/game.html?signal=pingy');assert.match(await page.locator('h1').innerText(),/papieri/);
 await page.evaluate(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:KEY,s:saved});
 await page.goto(BASE+'/game.html?signal=pingy');assert.equal(await page.locator('.answer-form').count(),0);assert.match(await page.locator('h1').innerText(),/papieri/);
 assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).completed,KEY),[1,2,3]);
 await page.goto(BASE+'/game.html?signal=cipko');assert.equal(await page.locator('h1').innerText(),'Rozsvieť pixely po poradí');
 let current=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);assert.deepEqual(current.completed,[1,2,3,4]);assert.deepEqual(current.plugyCells,[0,1]);
 await page.reload();assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).completed,KEY),[1,2,3,4]);
 await require('./helpers/cipko.cjs')(page);await page.goto(BASE+'/game.html?signal=guardy');
 await page.locator('#answer').fill('5817264');await page.locator('.answer-form button').tap();assert.match(await page.locator('.task-completion-note').innerText(),/Po vypočutí alebo prečítaní/);
 await page.goto(BASE+'/game.html?signal=navrat');assert.equal(await page.locator('#answer').count(),1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#answer').fill('SVETLO');await page.locator('.answer-form button').tap();assert.equal(await page.locator('.finale video').count(),1);assert.equal(await page.locator('#finale-title').innerText(),'NÁVRATOVÝ SIGNÁL PRIJATÝ');assert.equal(await page.locator('[data-action="end-game"]').count(),1);
 // Both real printable sheets remain isolated from the adult solution page.
 for(const id of ['p4','p7']){await page.goto(BASE+'/printables.html?sheet='+id);assert.equal(await page.locator('.sheet:visible').count(),1);assert.ok(await page.locator('#rodicovsky-navod').isHidden());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.goto(BASE+'/storyboard.html');assert.equal(await page.locator('#gm-cipher [data-action="test"]').count(),0);await page.locator('#gm-code .storyboard-toggle').tap();assert.match(await page.locator('#gm-code .worksheet-image').getAttribute('href'),/#p7$/);
 assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': direct QR entry, P4 paper handoff, P5 scan/retained save, four games → CHLADNIČKA → 5817264 → O → SVETLO → all seven home, isolated print sheets, phone layout and storyboard.');
 }finally{await browser.close();}}
})().catch(e=>{console.error(e);process.exit(1)});
