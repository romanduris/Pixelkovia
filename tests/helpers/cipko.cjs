const assert=require('node:assert/strict');
module.exports=async function solveCipko(page,{touch=true}={}){
 const press=locator=>touch?locator.tap():locator.click();
 const use=async(kind,index)=>press(page.locator(`[data-action="cipko"][data-kind="${kind}"]${index===undefined?'':`[data-index="${index}"]`}`));
 const next=async digit=>{assert.equal(await page.locator('.cipko-prize').innerText(),String(digit));await use('next');};
 for(let i=0;i<12;i++)if(!await page.locator(`[data-kind="pixel"][data-index="${i}"]`).isDisabled())await use('pixel',i);
 await next(7);
 await use('select',0);await use('slot',1);assert.match(await page.locator('.cipko-status').innerText(),/nepasuje/);
 for(let i=0;i<4;i++)if(!await page.locator(`[data-kind="slot"][data-index="${i}"]`).isDisabled()){await use('select',i);await use('slot',i);}
 await next(2);
 await use('card',0);await use('card',1);assert.match(await page.locator('.cipko-status').innerText(),/rozdielne/);
 for(const pair of [[0,5],[1,3],[2,4]])for(const i of pair)await use('card',i);
 await next(9);
 await use('pipe',0);for(let i=0;i<3;i++)await use('pipe',1);await use('pipe',2);
 await next(4);
 assert.deepEqual(await page.locator('.cipko-digits strong').allTextContents(),['7','2','9','4']);
 await page.locator('#answer').fill('246');await press(page.locator('.answer-form button'));assert.match(await page.locator('#feedback').innerText(),/nesedí/);
 await page.locator('#answer').fill('chladnička');await press(page.locator('.answer-form button'));await page.locator('.success-card').waitFor();
};
