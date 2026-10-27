const assert=require('node:assert/strict');
exports.previews=async page=>{
 for(const id of ['story-book-before','story-book-after','collection']){
  const trigger=page.locator(`[data-book-preview="${id}"]`).first();
  await trigger.click();
  const dialog=page.locator('#book-preview-dialog');
  assert.ok(await dialog.evaluate(el=>el.open));
  assert.equal(await dialog.locator('.book-preview-content').count(),id==='collection'?2:1);
  assert.equal(await dialog.locator('.book-preview-pages img').count(),id==='collection'?4:2);
  await dialog.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>img.decode())));
  assert.ok(await dialog.locator('[data-close-book-preview]').evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Escape');assert.ok(await trigger.evaluate(el=>el===document.activeElement));
 }
};
exports.checkout=async page=>{
 assert.equal(await page.locator('.checkout-addon').count(),3);
 assert.equal(await page.locator('[name="book"]').count(),2);
 assert.equal(await page.locator('[name="book"]:checked').count(),0);
 assert.equal(await page.locator('[name="mission"],#all-missions').count(),0);
 assert.equal(await page.locator('.atlas-addon input,.atlas-addon button').count(),0,'Atlas has no interactive selection');
 assert.match(await page.locator('.atlas-addon').innerText(),/2,99 €[\s\S]*ZDARMA K HRE[\s\S]*Zahrnuté automaticky/);
 assert.match(await page.locator('.gift-row').innerText(),/Atlas Pixelkov[\s\S]*ZDARMA/);
 for(const mask of [0,1,3,2,0,2,3,1,0]){
  for(let i=0;i<2;i++)await page.locator('[name="book"]').nth(i).setChecked(Boolean(mask&(1<<i)));
  const total=['14,99 €','19,98 €','19,98 €','19,99 €'][mask];
  assert.equal(await page.locator('#order-total').innerText(),total);assert.equal(await page.locator('#button-total').innerText(),total);
  assert.equal(await page.locator('#summary-discount').isVisible(),mask===3);
  if(mask===3)assert.match(await page.locator('#summary-discount').innerText(),/Zľava za kompletný balík[\s\S]*−4,98 €/);
 }
 for(const id of ['story-book-before','story-book-after']){
  const trigger=page.locator(`[data-book-preview="${id}"]`),before=await page.locator('#order-total').innerText();
  await trigger.click();assert.ok(await page.locator('#book-preview-dialog').evaluate(el=>el.open));
  assert.equal(await page.locator('#order-total').innerText(),before);assert.equal(await page.locator('[name="book"]:checked').count(),0);
  await page.locator('[data-close-book-preview]').click();assert.ok(await trigger.evaluate(el=>el===document.activeElement));
 }
 assert.ok(await page.locator('.checkout-buy').isDisabled());
};
