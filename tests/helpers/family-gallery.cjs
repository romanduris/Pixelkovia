const assert=require('node:assert/strict');
module.exports=async function checkFamilyGallery(page,{swipe=false}={}){
 const gallery=page.locator('[data-family-gallery]'),track=gallery.locator('.family-gallery-track');
 assert.equal(await gallery.locator('.evidence-family').count(),3);
 assert.equal(await gallery.locator('[data-gallery-dot]').count(),3);
 await track.scrollIntoViewIfNeeded();
 const shape=await track.evaluate(el=>{
  const frame=el.getBoundingClientRect(),first=el.children[0].getBoundingClientRect(),second=el.children[1].getBoundingClientRect();
  return {large:first.width/frame.width,peek:frame.right-second.left};
 });
 assert.ok(shape.large>=.88&&shape.large<=.92,'large uncropped scene');
 assert.ok(shape.peek>=14,'next photo visibly peeks into the gallery');
 for(const button of await gallery.locator('button').all()){
  const r=await button.boundingBox();assert.ok(r.width>=44&&r.height>=44,'comfortable touch target');
 }
 const settled=async index=>page.waitForFunction(index=>{
  const track=document.querySelector('.family-gallery-track'),slides=[...track.children];
  const target=Math.min(slides[index].offsetLeft-slides[0].offsetLeft,track.scrollWidth-track.clientWidth);
  return Math.abs(track.scrollLeft-target)<2&&document.querySelector(`[data-gallery-dot="${index}"]`).getAttribute('aria-current')==='true';
 },index);
 assert.equal(await gallery.locator('[data-gallery-prev]').getAttribute('aria-disabled'),'true');
 await gallery.locator('[data-gallery-next]').click();await settled(1);
 await gallery.locator('[data-gallery-dot="2"]').click();await settled(2);
 assert.equal(await gallery.locator('[data-gallery-next]').getAttribute('aria-disabled'),'true');
 await gallery.locator('[data-gallery-next]').press('Enter');await settled(2);
 await gallery.locator('[data-gallery-prev]').click();await settled(1);
 await track.focus();await page.keyboard.press('Home');await settled(0);
 await page.keyboard.press('ArrowRight');await settled(1);
 await page.keyboard.press('End');await settled(2);
 await page.keyboard.press('ArrowLeft');await settled(1);
 if(swipe){
  await track.scrollIntoViewIfNeeded();
  const r=await track.boundingBox(),y=Math.min(r.y+r.height/2,(await page.viewportSize()).height-120);
  const cdp=await page.context().newCDPSession(page);
  const start=r.x+r.width*.83,end=r.x+r.width*.16;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:start,y}]});
  for(let step=1;step<=10;step++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:start+(end-start)*step/10,y}]});
   await page.waitForTimeout(20);
  }
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await settled(2);await cdp.detach();
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 await gallery.locator('[data-gallery-dot="0"]').click();await settled(0);
 await page.emulateMedia({reducedMotion:'no-preference'});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'gallery does not overflow page');
};
