// Removing the old sixth task must preserve discoveries and resume at the right scene.
const assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8080',KEY='zahada-v1-progress';
const run=length=>Array.from({length},(_,i)=>i+1);
(async()=>{
 const browser=await chromium.launch();
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE+'/game.html');
  async function resumeSaved(){await page.goto(BASE+'/game.html');for(const checkbox of await page.locator('[data-check]').all())await checkbox.check();await page.locator('[data-action="start"]').click();}
  for(const [oldStage,oldCompleted,newStage,newCompleted] of [[5,4,5,4],[6,5,6,5],[6,6,6,5],[7,6,6,5],[7,7,6,6],[8,7,7,6],[9,8,8,7]]){
   const old={started:true,callDone:true,stage:oldStage,completed:run(oldCompleted),hints:{5:1,6:2,7:1,8:2},scenePages:{'cipher:before':1},sutkoCells:[0,1,2]};
   await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key:KEY,saved:old});
   await resumeSaved();
   const migrated=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
   assert.equal(migrated.progressVersion,2);assert.equal(migrated.stage,newStage);
   assert.deepEqual(migrated.completed,run(newCompleted));assert.deepEqual(migrated.hints,{5:1,6:1,7:2});
   assert.deepEqual(migrated.plugyCells,old.sutkoCells);assert.equal(Object.hasOwn(migrated,'sutkoCells'),false);assert.deepEqual(migrated.scenePages,old.scenePages);
   if(newStage===8){assert.equal(await page.locator('.finale #finale-video').count(),1);}
   else assert.equal(await page.locator('.signal-content h1').innerText(),newStage===5?'Rozsvieť pixely po poradí':newCompleted===newStage?'SPRÁVY OPRAVENÉ':await page.evaluate(n=>GAME.stages[n].label,newStage));
   await page.reload();assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY),migrated,'a migrated save is never shifted twice');
  }
  // A new seventh-task save is the final password, and must never be interpreted as old task 7.
  await page.evaluate(({key,saved})=>localStorage.setItem(key,JSON.stringify(saved)),{key:KEY,saved:{progressVersion:2,started:true,callDone:true,stage:7,completed:run(6),hints:{}}});
  await resumeSaved();
  assert.match(await page.locator('h1').innerText(),/Úloha 7/);
  assert.equal(await page.locator('[data-action="notebook"]').count(),0);
  assert.deepEqual(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).completed,KEY),run(6));
  await page.locator('#answer').fill('SVETLO');await page.locator('.answer-form button').click();
  assert.equal(await page.locator('.finale #finale-video').count(),1);
  assert.deepEqual(errors,[]);console.log('PASS: old tasks 5–9 migrate without loss, removed task resumes at the pledge, hints shift once, new saves stay stable, SVETLO and all seven friends reach the finale.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
