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
 const atlas=page.locator('[name="atlas"]'),bundle=page.locator('#select-bundle');
 assert.equal(await atlas.count(),1);assert.ok(await atlas.isChecked());assert.ok(await atlas.isEnabled());
 assert.match(await page.locator('.atlas-addon').innerText(),/Atlas Pixelkov[\s\S]*ZDARMA/);
 assert.match(await page.locator('.gift-row').innerText(),/Atlas Pixelkov[\s\S]*ZDARMA/);
 assert.equal(await page.locator('.base-product li').first().innerText(),'7 úloh');
 assert.equal(await bundle.locator('[data-complete-price]').innerText(),'19,99 €');
 assert.equal(await bundle.locator('[data-bundle-subtotal]').innerText(),'24,97 €');
 assert.equal(await bundle.locator('[data-bundle-saving]').innerText(),'4,98 €');
 await atlas.uncheck();assert.ok(await page.locator('.gift-row').isHidden());
 assert.equal(await page.locator('#order-total').innerText(),'14,99 €','removing the free Atlas never increases the price');
 await bundle.click();
 assert.equal(await page.locator('[name="book"]:checked').count(),2);assert.ok(await atlas.isChecked());
 assert.equal(await page.locator('#order-total').innerText(),'19,99 €');
 assert.match(await bundle.locator('.bundle-action').innerText(),/Celý balík je vybraný/);
 await bundle.click();assert.equal(await page.locator('[name="book"]:checked').count(),2,'repeated bundle selection is idempotent');
 await atlas.uncheck();assert.ok(await page.locator('.gift-row').isHidden());
 assert.equal(await page.locator('#order-total').innerText(),'19,99 €','bundle discount survives deselecting the free Atlas');
 await bundle.click();assert.ok(await atlas.isChecked());assert.ok(await page.locator('.gift-row').isVisible());
 for(const mask of [0,1,3,2,0,2,3,1,0]){
  for(let i=0;i<2;i++)await page.locator('[name="book"]').nth(i).setChecked(Boolean(mask&(1<<i)));
  const total=['14,99 €','19,98 €','19,98 €','19,99 €'][mask];
  assert.equal(await page.locator('#order-total').innerText(),total);assert.equal(await page.locator('#button-total').innerText(),total);
  assert.equal(await page.locator('#summary-discount').isVisible(),mask===3);
  if(mask===3)assert.match(await page.locator('#summary-discount').innerText(),/Zľava za kompletný balík[\s\S]*−4,98 €/);
  assert.equal(await bundle.evaluate(el=>el.classList.contains('is-selected')),mask===3);
 }
 for(const id of ['story-book-before','story-book-after']){
  const trigger=page.locator(`[data-book-preview="${id}"]`),before=await page.locator('#order-total').innerText();
  await trigger.click();assert.ok(await page.locator('#book-preview-dialog').evaluate(el=>el.open));
  assert.equal(await page.locator('#order-total').innerText(),before);assert.equal(await page.locator('[name="book"]:checked').count(),0);
  await page.locator('[data-close-book-preview]').click();assert.ok(await trigger.evaluate(el=>el===document.activeElement));
 }
 assert.ok(await page.locator('.checkout-buy').isDisabled());
 if(page.viewportSize().width===390){
  const size=await page.locator('.addons-panel').boundingBox();
  assert.ok(size.height<650,'phone upsells stay compact, including the complete-bundle action');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollHeight<2200),'phone checkout has substantially less scrolling');
 }
};
