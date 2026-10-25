const assert=require('node:assert/strict');
const {chromium,webkit,devices}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080',KEY='zahada-v1-progress';
(async()=>{
 for(const [engine,device] of [[chromium,devices['Pixel 7']],[webkit,devices['iPhone 13']]]){
 const browser=await engine.launch();try{
 const context=await browser.newContext(device),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(BASE+'/game.html');
 // Scanning a later sheet must never award missing prerequisites in a fresh browser.
 await page.goto(BASE+'/game.html?signal=cipko');assert.equal(await page.locator('.qr-prerequisite').count(),1);
 assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).completed,KEY),[]);
 const saved={progressVersion:2,started:true,callDone:true,stage:4,completed:[1,2,3],hints:{3:1},plugyCells:[0,1]};
 await page.evaluate(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:KEY,s:saved});
 // Already completed historical P4 saves can continue without reprinting P5.
 await page.evaluate(({k,s})=>localStorage.setItem(k,JSON.stringify({...s,completed:[1,2,3,4]})),{k:KEY,s:saved});
 await page.goto(BASE+'/game.html?signal=listok');assert.equal(await page.locator('h1').innerText(),'Pozbieraj pixely');
 await page.evaluate(({k,s})=>localStorage.setItem(k,JSON.stringify(s)),{k:KEY,s:saved});
 await page.goto(BASE+'/game.html?signal=listok');assert.equal(await page.locator('.answer-form').count(),0);assert.match(await page.locator('h1').innerText(),/papieri/);
 assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).completed,KEY),[1,2,3]);
 await page.goto(BASE+'/game.html?signal=cipko');assert.equal(await page.locator('h1').innerText(),'Pozbieraj pixely');
 let current=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);assert.deepEqual(current.completed,[1,2,3,4]);assert.deepEqual(current.plugyCells,[0,1]);
 await page.reload();assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).completed,KEY),[1,2,3,4]);
 await require('./helpers/cipko.cjs')(page);await page.locator('[data-action="next"]').tap();
 await page.locator('#answer').fill('SPOLU');await page.locator('.answer-form button').tap();await page.locator('[data-action="next"]').tap();
 assert.match(await page.locator('.task-question').innerText(),/vyfarbite/);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.screenshot({path:'/tmp/pixelkovia-'+engine.name()+'-finale-phone.png'});
 await page.locator('#answer').fill('SVETLO');await page.locator('.answer-form button').tap();await page.locator('[data-action="next"]').tap();assert.equal(await page.locator('.finale .contact.connected').count(),7);
 // Both real printable sheets remain isolated from the adult solution page.
 for(const id of ['p4','p7']){await page.goto(BASE+'/printables.html?sheet='+id);assert.equal(await page.locator('.sheet:visible').count(),1);assert.ok(await page.locator('#rodicovsky-navod').isHidden());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.goto(BASE+'/storyboard.html');assert.equal(await page.locator('#gm-cipher [data-action="test"]').count(),0);await page.locator('#gm-code .storyboard-toggle').tap();assert.match(await page.locator('#gm-code .worksheet-image').getAttribute('href'),/#p7$/);
 assert.deepEqual(errors,[]);console.log('PASS '+engine.name()+': fresh QR prerequisites, legacy P4 paper handoff, P5 scan/retained save, four games → CHLADNIČKA → SPOLU → SVETLO → all seven home, isolated print sheets, phone layout and storyboard.');
 }finally{await browser.close();}}
})().catch(e=>{console.error(e);process.exit(1)});
