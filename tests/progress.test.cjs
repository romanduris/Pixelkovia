const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8083',KEY='zahada-v1-progress';
(async()=>{const browser=await chromium.launch();try{
 const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto(BASE+'/game.html');
 const save={progressVersion:2,started:true,callDone:true,stage:5,completed:[1,2,3,4],hints:{3:1},plugyCells:[0,1],cipko:{version:2,round:0,won:false,pixels:[1,2],tiles:Array(9).fill(null),selected:null,matched:[],open:[],turns:[1,0,2,2,1,0,2,1,0]}};
 await page.evaluate(({KEY,save})=>localStorage.setItem(KEY,JSON.stringify(save)),{KEY,save});
 await page.goto(BASE+'/game.html?signal=cipko');assert.match(await page.locator('.cipko-status').innerText(),/2 \/ 16/);
 await page.reload();assert.match(await page.locator('.cipko-status').innerText(),/2 \/ 16/);
 await page.goto(BASE+'/game.html?signal=guardy');let saved=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.deepEqual(saved.completed,[1,2,3,4]);assert.deepEqual(saved.cipko.pixels,[1,2]);assert.deepEqual(saved.hints,{3:1});
 await page.goto(BASE+'/game.html?signal=navrat');await page.locator('#answer').fill('SVETLO');await page.locator('.answer-form button').click();assert.equal(await page.locator('.finale video').count(),1);
 saved=await page.evaluate(KEY=>JSON.parse(localStorage.getItem(KEY)),KEY);assert.deepEqual(saved.completed,[1,2,3,4,7]);
 console.log('PASS: current saved tasks, hints, selections and mini-game progress survive reload and QR navigation; final password opens the video.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exit(1)});
