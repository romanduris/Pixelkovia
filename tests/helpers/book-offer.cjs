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
 const books=page.locator('#select-bundle'),atlas=page.locator('[name="atlas"]');
 assert.equal(await page.locator('[name="book-bundle"]').count(),1);
 assert.equal(await page.locator('[name="book"]').count(),0);
 assert.equal(await page.locator('.bundle-book .offer-book-cover').count(),2);
 assert.equal(await page.locator('.base-product li').first().innerText(),'7 záhad v jednom spoločnom príbehu');
 assert.equal(await page.locator('[data-summary-base-price]').innerText(),'29,99 €');
 assert.equal(await page.locator('#summary-early-discount strong').innerText(),'−15,00 €');
 assert.equal(await page.locator('.delivery-row').count(),0);
 assert.equal(await page.locator('#order-total').innerText(),'14,99 €');
 assert.ok(await atlas.isChecked());await atlas.uncheck();assert.ok(await page.locator('.gift-row').isHidden());
 await books.check();assert.equal(await page.locator('#order-total').innerText(),'19,99 €');
 assert.match(await page.locator('#summary-discount').innerText(),/Zľava na balík kníh[\s\S]*−4,98 €/);
 assert.ok(!(await atlas.isChecked()),'selecting books does not change the Atlas preference');
 await atlas.check();assert.ok(await page.locator('.gift-row').isVisible());
 await books.uncheck();assert.equal(await page.locator('#order-total').innerText(),'14,99 €');
 for(const id of ['story-book-before','story-book-after']){
  const trigger=page.locator(`[data-book-preview="${id}"]`);
  await trigger.click();assert.ok(await page.locator('#book-preview-dialog').evaluate(el=>el.open));
  assert.equal(await books.isChecked(),false,'a preview never adds paid books');
  await page.locator('[data-close-book-preview]').click();assert.ok(await trigger.evaluate(el=>el===document.activeElement));
 }
 assert.ok(await page.locator('.checkout-buy').isDisabled());
};
