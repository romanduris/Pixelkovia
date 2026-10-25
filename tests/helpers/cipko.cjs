const assert=require('node:assert/strict');
module.exports=async function solveCipko(page,{touch=true}={}){
 const press=locator=>touch?locator.tap():locator.click();
 const use=async(kind,index)=>press(page.locator(`[data-action="cipko"][data-kind="${kind}"]${index===undefined?'':`[data-index="${index}"]`}`));
 const next=async digit=>{assert.equal(await page.locator('.cipko-prize').innerText(),String(digit));await use('next');};
 await use('pixel',16);assert.match(await page.locator('.cipko-status').innerText(),/Najprv nájdi/);
 for(let i=1;i<=16;i++)if(!await page.locator(`[data-kind="pixel"][data-index="${i}"]`).isDisabled())await use('pixel',i);
 await next(7);
 await use('select',0);await use('slot',1);assert.match(await page.locator('.cipko-status').innerText(),/nepasuje/);
 for(let i=0;i<9;i++)if(!await page.locator(`[data-kind="slot"][data-index="${i}"]`).isDisabled()){await use('select',i);await use('slot',i);}
 await next(2);
 await use('card',0);await use('card',1);assert.match(await page.locator('.cipko-status').innerText(),/rozdielne/);
 for(const pair of [[0,8],[1,10],[2,6],[3,11],[4,7],[5,9]])for(const i of pair)await use('card',i);
 await next(9);
 const targets=[0,2,1,1,3,1,0,0,3];
 // Independently trace the drawn SVG pieces at the solved rotations.
 const paths=await page.locator('.cipko-pipe path').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('d')));
 const ports=paths.map((d,i)=>(d.startsWith('M40')?[0,1]:[3,1]).map(p=>(p+targets[i])%4));
 let at=0,entry=3;const visited=new Set();
 for(;;){
  assert.ok(!visited.has(at),'visual route must not loop');visited.add(at);assert.ok(ports[at].includes(entry),'drawn pipes must join');
  const exit=ports[at].find(p=>p!==entry),x=at%3+[0,1,0,-1][exit],y=Math.floor(at/3)+[-1,0,1,0][exit];
  if(x===3&&y===0){assert.equal(visited.size,9,'route uses all nine pieces');break;}
  assert.ok(x>=0&&x<3&&y>=0&&y<3,'route reaches the indicated core');at=y*3+x;entry=(exit+2)%4;
 }

 for(let i=0;i<9;i++){
  const path=page.locator(`[data-kind="pipe"][data-index="${i}"] path`);
  const rotation=Number((await path.getAttribute('transform')).match(/rotate\((\d+)/)[1])/90;
  for(let turn=0;turn<(targets[i]-rotation+4)%4;turn++)await use('pipe',i);
 }
 await page.locator('.cipko-finished').waitFor();
 assert.deepEqual(await page.locator('.cipko-digits strong').allTextContents(),['7','2','9','4']);
 assert.equal(await page.locator('#answer,.answer-form,[data-action="next"],[data-kind="next"]').count(),0,'no phone answer or extra step after last game');
 const message=await page.locator('.cipko-finished').innerText();assert.match(message,/pokračujte na papieri/);assert.ok(!message.includes('CHLADNIČKA'),'the paper reveals the hiding place');
};
