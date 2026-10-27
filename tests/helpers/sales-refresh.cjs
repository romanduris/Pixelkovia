const assert=require('node:assert/strict');
module.exports=async function checkSalesRefresh(page,{swipe=false}={}){
 const width=page.viewportSize().width;
 assert.deepEqual(await page.locator('.hero-format strong').allTextContents(),['45–60 min','7–13 rokov','Jeden tím']);
 assert.match(await page.locator('.hero-format').innerText(),/2–5 hráčov/);
 assert.match(await page.locator('.evidence-family>img').first().getAttribute('src'),/family-code-mobile/);
 assert.match(await page.locator('.evidence-family>img').last().getAttribute('src'),/family-opening-mobile/);
 const hero=await page.locator('.funnel-hero').evaluate(el=>{
  const intro=el.querySelector('.funnel-hero-top').getBoundingClientRect(),action=el.querySelector('.funnel-hero-bottom').getBoundingClientRect();
  return {height:el.clientHeight,overlap:intro.bottom>action.top,bottom:el.getBoundingClientRect().bottom+scrollY};
 });
 assert.ok(!hero.overlap,'intro and action do not overlap');
 if(width<=700){assert.ok(hero.height<=620,'compact hero');assert.ok(hero.bottom<=page.viewportSize().height+2,'cast and CTA fit the initial viewport');}
 const icon=page.locator('link[rel="icon"][sizes="32x32"]');
 assert.equal(await icon.count(),1);
 const response=await page.request.get(new URL(await icon.getAttribute('href'),page.url()).href);
 assert.equal(response.status(),200);assert.equal((await response.body()).subarray(1,4).toString(),'PNG');
 const gallery=page.locator('[data-review-gallery]'),track=gallery.locator('[data-gallery-track]');
 assert.equal(await gallery.locator('.review-card').count(),10);
 assert.equal(await gallery.locator('.review-stars').count(),10);
 assert.equal(await gallery.locator('.review-stars').evaluateAll(nodes=>nodes.every(el=>el.textContent==='★★★★★')),true);
 assert.equal(await gallery.locator('.review-example').evaluateAll(nodes=>nodes.every(el=>el.textContent.includes('Ilustračné hodnotenie'))),true);
 assert.match(await page.locator('#hodnotenia .funnel-section-heading').innerText(),/Nejde o skutočné ani overené recenzie/);
 assert.equal(await page.locator('[itemtype*="Review"],[itemtype*="AggregateRating"],script[type="application/ld+json"]').count(),0,'examples are not structured customer ratings');
 await page.emulateMedia({reducedMotion:'reduce'});
 const settled=async index=>page.waitForFunction(index=>{
  const track=document.querySelector('#review-gallery-track'),slides=[...track.children];
  const target=Math.min(slides[index].offsetLeft-slides[0].offsetLeft,track.scrollWidth-track.clientWidth);
  return Math.abs(track.scrollLeft-target)<2&&document.querySelector('.review-counter').textContent===`${index+1} / 10`;
 },index);
 await track.scrollIntoViewIfNeeded();
 await gallery.locator('[data-gallery-next]').click();await settled(1);
 await track.focus();await page.keyboard.press('End');await settled(9);
 assert.equal(await gallery.locator('[data-gallery-next]').getAttribute('aria-disabled'),'true');
 await gallery.locator('[data-gallery-prev]').click();await settled(8);
 await track.focus();await page.keyboard.press('Home');await settled(0);
 if(swipe){
  await track.scrollIntoViewIfNeeded();
  const r=await track.boundingBox(),y=Math.min(r.y+r.height/2,page.viewportSize().height-120);
  const cdp=await page.context().newCDPSession(page),start=r.x+r.width*.83,end=r.x+r.width*.16;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start,y}]});
  for(let step=1;step<=10;step++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start+(end-start)*step/10,y}]});await page.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settled(1);await cdp.detach();
 }
 await page.emulateMedia({reducedMotion:'no-preference'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
};
