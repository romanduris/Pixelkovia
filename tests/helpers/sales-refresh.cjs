const assert=require('node:assert/strict');
module.exports=async function checkSalesRefresh(page,{swipe=false}={}){
 const width=page.viewportSize().width;
 assert.deepEqual(await page.locator('.hero-format strong').allTextContents(),['60–90 min','7–13 rokov','Jeden tím']);
 assert.match(await page.locator('.hero-format').innerText(),/2–5 hráčov/);
 assert.match(await page.locator('.evidence-family>img').first().getAttribute('src'),/real-play\/play-phone/);
 assert.match(await page.locator('.evidence-family>img').last().getAttribute('src'),/real-play\/play-story/);
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
 assert.equal(await gallery.locator('.review-card').count(),6);
 assert.equal(await gallery.locator('.review-stars').count(),6);
 const ratings=await gallery.locator('.review-stars').allTextContents();
 assert.deepEqual(ratings,Array(6).fill('★★★★★'));
 assert.equal(await gallery.locator('.review-stars').evaluateAll(nodes=>nodes.every(el=>el.getAttribute('aria-label').includes(`${[...el.textContent].filter(c=>c==='★').length} z 5`))),true);
 assert.deepEqual(await gallery.locator('.review-author').allTextContents(),['Lucia','Adam K.','Jana','Zuzana','Martin','Tomas']);
 assert.equal(await page.locator('.review-disclosure').count(),0,'retired sample disclaimer is removed');
 assert.equal(await page.locator('.review-context').textContent(),'Skúsenosti rodičov po dohraní hry.');
 assert.deepEqual(await gallery.locator('.review-origin').allTextContents(),Array(6).fill('Po dohraní hry'));
 assert.equal(await page.locator('#reviews-title').textContent(),'Čo hovoria rodičia.');
 const layout=await track.evaluate(el=>{
  const card=el.firstElementChild,author=card.querySelector('.review-author').getBoundingClientRect(),stars=card.querySelector('.review-stars').getBoundingClientRect();
  const quote=card.querySelector('blockquote').getBoundingClientRect();
  return {cardRatio:card.getBoundingClientRect().width/el.clientWidth,quoteBelow:quote.top>Math.max(author.bottom,stars.bottom),fontSize:parseFloat(getComputedStyle(card.querySelector('blockquote p')).fontSize)};
 });
 assert.ok(layout.quoteBelow,'author and stars stay above the review text');
 assert.ok(layout.fontSize>=14,'review text stays readable');
 if(width<=700)assert.ok(layout.cardRatio>.88&&layout.cardRatio<.92,'mobile shows one review and a peek of the next');
 else if(width<=1050)assert.ok(layout.cardRatio>.47&&layout.cardRatio<.5,'tablet shows two reviews');
 else assert.ok(layout.cardRatio>.30&&layout.cardRatio<.34,'desktop shows three reviews');
 assert.equal(await page.locator('[itemtype*="Review"],[itemtype*="AggregateRating"],script[type="application/ld+json"]').count(),0,'review cards do not add aggregate metadata');
 await page.emulateMedia({reducedMotion:'reduce'});
 const settled=async index=>page.waitForFunction(index=>{
  const track=document.querySelector('#review-gallery-track'),slides=[...track.children];
  const target=Math.min(slides[index].offsetLeft-slides[0].offsetLeft,track.scrollWidth-track.clientWidth);
  const range=innerWidth<=700?`${index+1}`:`${index+1}–${index+(innerWidth<=1050?2:3)}`;
  return Math.abs(track.scrollLeft-target)<2&&document.querySelector('.review-counter').textContent===`${range} / 6`;
 },index);
 const lastStart=width<=700?5:width<=1050?4:3;
 await track.scrollIntoViewIfNeeded();
 await settled(0);
 await gallery.locator('[data-gallery-next]').click();await settled(1);
 await track.focus();await page.keyboard.press('End');await settled(lastStart);
 assert.equal(await gallery.locator('[data-gallery-next]').getAttribute('aria-disabled'),'true');
 await page.keyboard.press('ArrowRight');await settled(lastStart);
 await gallery.locator('[data-gallery-prev]').click();await settled(lastStart-1);
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
