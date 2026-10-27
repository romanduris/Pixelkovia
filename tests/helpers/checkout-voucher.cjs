const assert=require('node:assert/strict');

module.exports=async(page,{screenshotPrefix,standalone=false}={})=>{
 const open=page.locator('#voucher-open'),dialog=page.locator('#voucher-dialog'),input=page.locator('#voucher-code');
 const apply=dialog.getByRole('button',{name:'Uplatniť voucher'}),remove=page.locator('#voucher-remove');
 const total=page.locator('#order-total'),discount=page.locator('#summary-voucher');
 assert.equal(await open.innerText(),'Voucher');
 assert.ok(await open.evaluate(el=>el.previousElementSibling.matches('.checkout-buy')),'voucher link is immediately below the purchase button');
 assert.ok((await open.boundingBox()).height>=44,'voucher has a comfortable touch target');
 await open.click();assert.ok(await dialog.evaluate(el=>el.open));
 assert.ok(await input.evaluate(el=>el===document.activeElement),'code field receives focus');
 assert.ok(await remove.isHidden());
 assert.ok(await dialog.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight}),'popup fits the phone');
 assert.ok(await input.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16),'phone input avoids automatic zoom');
 if(screenshotPrefix)await page.screenshot({path:screenshotPrefix+'-popup.png'});
 await apply.click();assert.equal(await page.locator('#voucher-error').innerText(),'Zadajte kód voucheru.');
 assert.equal(await input.getAttribute('aria-invalid'),'true');
 await input.fill('<img src=x onerror=alert(1)>');await input.press('Enter');
 assert.match(await page.locator('#voucher-error').innerText(),/Tento voucher nepoznáme/);
 assert.equal(await dialog.locator('img').count(),0,'invalid code is not interpreted as markup');
 assert.equal(await total.innerText(),'14,99 €');assert.ok(await discount.isHidden());
 await input.fill(' FREE ');assert.ok(await page.locator('#voucher-error').isHidden());
 await input.press('Enter');assert.ok(await dialog.isHidden());
 assert.ok(await open.evaluate(el=>el===document.activeElement),'focus returns to voucher link');
 assert.equal(await total.innerText(),'0,00 €');
 for(const mask of [1,3,2,0]){
  for(let i=0;i<2;i++)await page.locator('[name="book"]').nth(i).setChecked(Boolean(mask&(1<<i)));
  assert.equal(await total.innerText(),'0,00 €','voucher covers the current choice of books');
  assert.equal(await page.locator('#button-total').innerText(),'0,00 €');
  assert.match(await discount.innerText(),/Voucher free · zľava 100 %/);
  assert.equal(await discount.locator('strong').innerText(),'−'+['14,99 €','19,98 €','19,98 €','19,99 €'][mask]);
  assert.equal(await page.locator('#summary-discount').isVisible(),mask===3,'bundle and voucher discounts are separate');
 }
 if(screenshotPrefix){await page.locator('.checkout-summary').scrollIntoViewIfNeeded();await page.screenshot({path:screenshotPrefix+'-applied.png'});}
 await open.click();assert.equal(await input.inputValue(),'free');assert.ok(await remove.isVisible());
 await input.fill('not-free');await apply.click();assert.ok(await dialog.evaluate(el=>el.open));
 assert.equal(await total.innerText(),'0,00 €','invalid replacement preserves applied voucher');
 await page.keyboard.press('Escape');assert.ok(await dialog.isHidden());
 assert.ok(await open.evaluate(el=>el===document.activeElement));
 assert.equal(await total.innerText(),'0,00 €','Escape preserves applied voucher');
 await page.locator('[name="book"]').first().check();await open.click();await remove.click();
 assert.equal(await total.innerText(),'19,98 €','removal restores the current selection');
 assert.ok(await discount.isHidden());
 await page.locator('[name="book"]').first().uncheck();
 await open.click();await input.fill('free');await page.locator('#voucher-close').click();
 assert.equal(await total.innerText(),'14,99 €','closing without applying does not change price');
 await open.click();await page.mouse.click(2,2);assert.ok(await dialog.isHidden(),'backdrop closes the popup');
 assert.ok(await open.evaluate(el=>el===document.activeElement));
 await open.click();await input.fill('free');await input.press('Enter');
 assert.ok(await page.locator('.checkout-buy').isDisabled(),'zero price never creates a fake purchase');
 await page.reload();await open.waitFor();assert.equal(await total.innerText(),'14,99 €','development voucher is not persisted');
 if(standalone){
  const original=page.url();
  for(const id of ['story-book-before','story-book-after']){
   const url=new URL(original);url.searchParams.set('product',id);await page.goto(url.href);
   await open.click();await input.fill('free');await input.press('Enter');
   assert.equal(await total.innerText(),'0,00 €','voucher also covers standalone books');
   await page.locator('[name="book"]:not(:disabled)').check();
   assert.equal(await total.innerText(),'0,00 €');
   assert.equal(await discount.locator('strong').innerText(),'−9,98 €');
   await open.click();await remove.click();assert.equal(await total.innerText(),'9,98 €');
  }
  await page.goto(original);await open.waitFor();
 }
};
